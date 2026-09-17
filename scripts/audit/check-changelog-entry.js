#!/usr/bin/env node
'use strict';

/**
 * Release gate: CHANGELOG.md must carry one dated, non-empty entry for the version
 * in package.json.
 *
 * This exists because nothing else checks it. `changelog-reader.js` tests the version
 * and not the date, so an entry left at `UNRELEASED` ships happily and `convoke-update`
 * renders `4.0.3 — UNRELEASED` to operators; an entry that is missing entirely makes
 * `printChangelog` return early, so the release reaches people silently.
 *
 * It reads the entry through `changelog-reader.js` — the parser `convoke-update` itself
 * uses — and separately scans the file with CommonMark's own fence and comment rules.
 * The two readings must agree on how many headings claim the version and on the date
 * they carry; a disagreement means one of them is not a real entry, and the gate refuses
 * rather than pick a side. Every earlier version of this check was fooled by trying to
 * out-parse the reader instead of comparing against it.
 *
 * On top of the agreement it requires:
 *
 *   - every version-shaped `##` heading parses as `## [version] - date`. One malformed
 *     neighbour silently merges its whole section into the entry above it.
 *   - exactly one heading claims the release version.
 *   - the date is a real calendar date, not `0000-00-00` or `2026-13-45`.
 *   - the body is not empty, and not only an HTML comment.
 *
 * Usage: node scripts/audit/check-changelog-entry.js [--changelog PATH] [--version V]
 */

const fs = require('fs');
const path = require('path');
const { readChangelogEntries } = require('../update/lib/changelog-reader');
const { compareVersions } = require('../update/lib/utils');

const REPO_ROOT = path.join(__dirname, '..', '..');

// CommonMark fences: 0-3 spaces of indent, three or more markers, closed by the same
// marker repeated at least as many times with nothing after it. A boolean "am I in a
// fence" toggle is not enough — a ````-fence documenting a ```-fence flips it mid-block,
// which both hides a real heading and reveals an example one.
const FENCE_RE = /^(\s{0,3})(`{3,}|~{3,})(.*)$/;
const HEADING_RE = /^\s{0,3}##\s/;
const COMMENT_OPEN_RE = /<!--/;
const COMMENT_CLOSE_RE = /-->/;
// A heading that means to be a release entry. `## Version History` and other prose
// headings are legitimate and must not be flagged — the real CHANGELOG.md has them.
const VERSIONISH_RE = /^\s{0,3}##\s+\[?v?\d+\.\d+\.\d+/;
// Kept in step with changelog-reader.js::HEADER_RE.
const HEADER_RE = /^##\s+\[([^\]]+)\](?:\s*[-–—]\s*(.+?))?\s*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Headings a strict fence scan can see, in file order.
 *
 * @param {string} raw - CHANGELOG.md contents.
 * @returns {Array<{line: string, number: number}>}
 */
function visibleHeadings(raw) {
  const found = [];
  let fence = null;
  let inComment = false;
  raw.split('\n').forEach((line, i) => {
    const fenceMatch = FENCE_RE.exec(line);
    if (fence) {
      if (fenceMatch
        && fenceMatch[2][0] === fence.marker
        && fenceMatch[2].length >= fence.length
        && fenceMatch[3].trim() === '') {
        fence = null;
      }
      return;
    }
    if (inComment) {
      if (COMMENT_CLOSE_RE.test(line)) inComment = false;
      return;
    }
    if (fenceMatch) {
      fence = { marker: fenceMatch[2][0], length: fenceMatch[2].length };
      return;
    }
    if (COMMENT_OPEN_RE.test(line) && !COMMENT_CLOSE_RE.test(line)) {
      inComment = true;
      return;
    }
    if (COMMENT_OPEN_RE.test(line)) return;
    if (HEADING_RE.test(line)) found.push({ line, number: i + 1 });
  });
  return found;
}

/**
 * True when `value` is a calendar date, not merely date-shaped.
 *
 * @param {string} value - Leading `YYYY-MM-DD` of a heading's date field.
 * @returns {boolean}
 */
function isRealDate(value) {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [, y, mo, d] = m;
  const parsed = new Date(`${y}-${mo}-${d}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getUTCFullYear() === Number(y)
    && parsed.getUTCMonth() + 1 === Number(mo)
    && parsed.getUTCDate() === Number(d);
}

/**
 * @param {object} [options]
 * @param {string} [options.changelogPath] - Defaults to the repository's CHANGELOG.md.
 * @param {string} [options.version] - Defaults to package.json's version.
 * @returns {{ok: boolean, message: string}}
 */
function checkChangelogEntry(options = {}) {
  const changelogPath = options.changelogPath || path.join(REPO_ROOT, 'CHANGELOG.md');
  const version = options.version !== undefined
    ? options.version
    : JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')).version;

  if (typeof version !== 'string' || !SEMVER_RE.test(version)) {
    return { ok: false, message: `package.json version is not a plain semver string: ${JSON.stringify(version)}` };
  }

  let raw;
  try {
    raw = fs.readFileSync(changelogPath, 'utf8');
  } catch (err) {
    return { ok: false, message: `cannot read ${changelogPath}: ${err.message}` };
  }

  const headings = visibleHeadings(raw);

  const malformed = headings.filter((h) => VERSIONISH_RE.test(h.line) && !HEADER_RE.test(h.line.trim()));
  if (malformed.length > 0) {
    const first = malformed[0];
    return {
      ok: false,
      message: `MALFORMED HEADING at ${path.basename(changelogPath)}:${first.number}: ${first.line.trim()}\n`
        + '  Every "## " heading must read "## [version] - date". One that does not is skipped by\n'
        + '  changelog-reader.js, and its whole section is then shown under the entry above it.',
    };
  }

  const claiming = headings.filter((h) => {
    const m = HEADER_RE.exec(h.line.trim());
    return m && SEMVER_RE.test(m[1].trim()) && compareVersions(m[1].trim(), version) === 0;
  });
  // What convoke-update will show, read with its own parser.
  const entries = readChangelogEntries(null, version, changelogPath)
    .filter((e) => compareVersions(e.version, version) === 0);

  if (claiming.length > 1 || entries.length > 1) {
    const where = claiming.length > 1 ? ` at lines ${claiming.map((h) => h.number).join(', ')}` : '';
    return {
      ok: false,
      message: `DUPLICATE CHANGELOG ENTRIES for ${version}${where}.\n`
        + '  Only the first is checked here and every one of them is shown to operators.',
    };
  }
  if (claiming.length === 0 && entries.length === 0) {
    return {
      ok: false,
      message: `MISSING CHANGELOG ENTRY for ${version}.\n`
        + '  convoke-update shows operators nothing at all for this release.',
    };
  }
  // The two readings must agree. They diverge when a heading is an example inside a code
  // fence or an HTML comment (this scan hides it, changelog-reader.js does not), or when
  // it is indented 1-3 spaces (this scan sees it, changelog-reader.js does not).
  if (claiming.length !== entries.length) {
    return {
      ok: false,
      message: `DISPUTED CHANGELOG ENTRY for ${version}: a strict read finds ${claiming.length} heading(s), `
        + `changelog-reader.js finds ${entries.length}.\n`
        + '  One of them is not a real entry — usually a heading inside a code fence or an HTML\n'
        + '  comment, or a heading indented 1-3 spaces. Operators are shown what the reader finds.',
    };
  }

  const entry = entries[0];
  const headingMatch = HEADER_RE.exec(claiming[0].line.trim());
  const headingDate = headingMatch && headingMatch[2] ? headingMatch[2].trim() : null;
  if (headingDate !== (entry.date || null)) {
    return {
      ok: false,
      message: `DISPUTED CHANGELOG ENTRY for ${version}: a strict read dates it ${JSON.stringify(headingDate)}, `
        + `changelog-reader.js dates it ${JSON.stringify(entry.date)}.\n`
        + '  The heading the gate checked is not the heading operators will be shown.',
    };
  }
  if (!isRealDate(entry.date || '')) {
    return {
      ok: false,
      message: `UNDATED CHANGELOG ENTRY for ${version}: heading reads ${JSON.stringify(entry.date)}.\n`
        + '  Replace the placeholder with the release date, as YYYY-MM-DD.',
    };
  }
  if (entry.body.replace(/<!--[\s\S]*?-->/g, '').trim() === '') {
    return {
      ok: false,
      message: `EMPTY CHANGELOG ENTRY for ${version}: the heading is dated but there is nothing under it.`,
    };
  }

  return { ok: true, message: `changelog entry for ${version} dated ${entry.date}` };
}

const USAGE = 'usage: check-changelog-entry.js [--changelog PATH] [--version VERSION]';

/**
 * @param {string[]} argv - Arguments after the script name.
 * @returns {{changelogPath?: string, version?: string}}
 * @throws {Error} On an unknown flag or a missing value — a typo must never read as a pass.
 */
function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag !== '--changelog' && flag !== '--version') {
      throw new Error(`unknown argument: ${flag}\n  ${USAGE}`);
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${flag} needs a value\n  ${USAGE}`);
    }
    if (flag === '--changelog') options.changelogPath = path.resolve(value);
    else options.version = value;
    i += 1;
  }
  return options;
}

if (require.main === module) {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(2);
  }
  const result = checkChangelogEntry(parsed);
  if (result.ok) {
    console.log(`✓ ${result.message}`);
  } else {
    console.error(`✗ ${result.message}`);
    process.exit(1);
  }
}

module.exports = { checkChangelogEntry, visibleHeadings, isRealDate };
