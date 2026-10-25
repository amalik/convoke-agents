'use strict';

const fs = require('fs');
const path = require('path');
const { compareVersions } = require('./utils');

const DEFAULT_CHANGELOG_PATH = path.join(__dirname, '..', '..', '..', 'CHANGELOG.md');

// Broad bracket-capture so pre-release headers ([1.0.4-alpha]) don't get skipped —
// a skipped header would leak its body into the preceding entry. Non-semver labels
// (Unreleased, TBD) are dropped later by SEMVER_RE. Date may use ASCII or en/em dash.
const HEADER_RE = /^##\s+\[([^\]]+)\](?:\s*[-–—]\s*(.+?))?\s*$/;
// T182: a release heading that drops its brackets (`## 4.0.2 - 2026-09-14`, `## v4.0.2`) is read
// as its own release (operator ruling 2026-10-24). Skipped, its whole section leaked into the
// entry above. It must be the version alone, or the version and a dash-separated date that starts
// YYYY-MM-DD, so a prose heading such as `## 1.0.0 - migration notes` is still not a release.
const BARE_HEADER_RE = /^##\s+v?(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)(?:\s*[-–—]\s*(\d{4}-\d{2}-\d{2}(?:\s.*?)?))?\s*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
// T182: CommonMark fences. Up to three spaces of indent (not a tab, which counts as four), three
// or more of one marker; a backtick fence's info string may not contain a backtick. A fence
// closes only on the same marker, at least as long, with nothing after it, so a ````-fence can
// document a ```-fence. Matched at column 0 alone, an indented fence was invisible and a heading
// inside it was shown as a release. check-changelog-entry.js applies the same rules in its own
// code, on purpose: that gate compares its reading with this one, which only means something if
// they are independent. They part on a fence that never closes (below), which the gate refuses,
// and on a fence line inside an HTML comment, which the gate skips and this reader does not (T283).
// [\s\S], not `.`: `.` stops at a stray \r (a CRCRLF file) or U+2028, and no fence line matches.
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})([\s\S]*)$/;
// After a closing fence CommonMark allows spaces and tabs only — not NBSP or U+2028, which
// String#trim also strips. \r is tolerated because a CRCRLF file leaves one on every line.
const CLOSER_TAIL_RE = /^[ \t]*\r*$/;

function openingFence(line) {
  const m = FENCE_RE.exec(line);
  if (!m) return null;
  if (m[1][0] === '`' && m[2].includes('`')) return null;
  return { marker: m[1][0], length: m[1].length };
}

function closesFence(line, fence) {
  const m = FENCE_RE.exec(line);
  return Boolean(m) && m[1][0] === fence.marker && m[1].length >= fence.length && CLOSER_TAIL_RE.test(m[2]);
}

/**
 * For each line index, the longest closing fence of each marker at or below it.
 *
 * @param {string[]} lines
 * @returns {Array<{'`': number, '~': number}>} Entry `lines.length` is all zeros.
 */
function longestClosersFrom(lines) {
  const out = new Array(lines.length + 1);
  out[lines.length] = { '`': 0, '~': 0 };
  for (let i = lines.length - 1; i >= 0; i--) {
    const next = { ...out[i + 1] };
    const m = FENCE_RE.exec(lines[i]);
    if (m && CLOSER_TAIL_RE.test(m[2])) next[m[1][0]] = Math.max(next[m[1][0]], m[1].length);
    out[i] = next;
  }
  return out;
}

function parseHeader(line) {
  const match = HEADER_RE.exec(line) || BARE_HEADER_RE.exec(line);
  if (!match) return null;
  return { version: match[1].trim(), date: match[2] ? match[2].trim() : null };
}

/**
 * Read the entries in one pass.
 *
 * CommonMark runs a fence that never closes to the end of the file, which here would drop every
 * later release from "What's New" without a word. Fail safe instead (operator ruling 2026-10-24):
 * an opening line that no line below it could close is read as plain text. That is what
 * re-parsing after retiring each still-open opener in turn gives, without the re-parsing, which
 * took 38 s on 20,000 stray fence lines. check-changelog-entry.js keeps the strict rule and
 * refuses any changelog with a fence left open.
 *
 * @param {string[]} lines - The file, split into lines.
 * @returns {Array<{version: string, date: string|null, body: string}>} In file order, unfiltered.
 */
function parseEntries(lines) {
  const closers = longestClosersFrom(lines);
  const entries = [];
  let current = null;
  let fence = null;

  const flush = () => {
    if (!current) return;
    current.body = current.bodyLines.join('\n').replace(/\s+$/, '');
    delete current.bodyLines;
    entries.push(current);
    current = null;
  };

  lines.forEach((line, i) => {
    if (fence) {
      if (closesFence(line, fence)) fence = null;
      if (current) current.bodyLines.push(line);
      return;
    }
    const opening = openingFence(line);
    if (opening && closers[i + 1][opening.marker] >= opening.length) {
      fence = opening;
      if (current) current.bodyLines.push(line);
      return;
    }
    const header = parseHeader(line);
    if (header) {
      flush();
      current = { ...header, bodyLines: [] };
      return;
    }
    if (current) {
      if (/^---\s*$/.test(line)) return;
      current.bodyLines.push(line);
    }
  });
  flush();

  return entries;
}

/**
 * Parse a Keep-a-Changelog-formatted file and return entries for versions
 * strictly greater than `fromVersion` and less than or equal to `toVersion`.
 *
 * Returns entries newest-first. Unreleased sections, malformed headers, and
 * missing files are skipped silently — this is a decorative surface and must
 * never break the update flow.
 *
 * @param {string|null|undefined} fromVersion - Installed version (exclusive lower bound). Null treats all entries <= toVersion as new.
 * @param {string} toVersion - Target version (inclusive upper bound).
 * @param {string} [changelogPath] - Absolute path to CHANGELOG.md.
 * @returns {Array<{version: string, date: string|null, body: string}>}
 */
function readChangelogEntries(fromVersion, toVersion, changelogPath = DEFAULT_CHANGELOG_PATH) {
  if (!toVersion) return [];

  let raw;
  try {
    raw = fs.readFileSync(changelogPath, 'utf8');
  } catch {
    return [];
  }

  // CRLF too: with the `\r` left on, no line ends where FENCE_RE's `$` needs it to. A leading
  // byte-order mark would stop the first line matching anything; GitHub ignores it.
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);

  return parseEntries(lines)
    .filter((e) => {
      if (!SEMVER_RE.test(e.version)) return false;
      const aboveFloor = fromVersion ? compareVersions(e.version, fromVersion) > 0 : true;
      const atOrBelowCeiling = compareVersions(e.version, toVersion) <= 0;
      return aboveFloor && atOrBelowCeiling;
    })
    .sort((a, b) => compareVersions(b.version, a.version));
}

module.exports = {
  readChangelogEntries,
  DEFAULT_CHANGELOG_PATH,
};
