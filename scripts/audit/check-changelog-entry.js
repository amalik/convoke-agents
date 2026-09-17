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
 * uses — so the gate and the operator see the same entry. It then applies checks the
 * reader does not, each of which was a way an earlier version of this gate could be
 * fooled:
 *
 *   - headings are re-scanned with a fence rule that accepts the 1-3 space indent
 *     CommonMark allows and `changelog-reader.js` does not. If the reader accepted a
 *     heading this scan cannot see, the heading is inside an example block and the
 *     entry is not real.
 *   - every `##` heading outside a fence must parse as `## [version] - date`. One
 *     malformed neighbour silently merges its whole section into the entry above it.
 *   - exactly one heading may claim the release version.
 *   - the date must be a real calendar date, not `0000-00-00` or `2026-13-45`.
 *   - the body must not be empty.
 *
 * Usage: node scripts/audit/check-changelog-entry.js [--changelog PATH] [--version V]
 */

const fs = require('fs');
const path = require('path');
const { readChangelogEntries } = require('../update/lib/changelog-reader');
const { compareVersions } = require('../update/lib/utils');

const REPO_ROOT = path.join(__dirname, '..', '..');

// Deliberately looser than changelog-reader.js's own FENCE_RE, which anchors at column 0.
const FENCE_RE = /^\s{0,3}(?:```|~~~)/;
const HEADING_RE = /^\s{0,3}##\s/;
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
  let inFence = false;
  raw.split('\n').forEach((line, i) => {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      return;
    }
    if (!inFence && HEADING_RE.test(line)) found.push({ line, number: i + 1 });
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
  if (claiming.length > 1) {
    return {
      ok: false,
      message: `DUPLICATE CHANGELOG ENTRIES for ${version} at lines ${claiming.map((h) => h.number).join(', ')}.\n`
        + '  Only the first is checked here and both are shown to operators.',
    };
  }

  const entry = readChangelogEntries(null, version, changelogPath)
    .find((e) => compareVersions(e.version, version) === 0);
  if (!entry) {
    return {
      ok: false,
      message: `MISSING CHANGELOG ENTRY for ${version}.\n`
        + '  convoke-update shows operators nothing at all for this release.',
    };
  }
  if (claiming.length === 0) {
    return {
      ok: false,
      message: `FENCED CHANGELOG ENTRY for ${version}.\n`
        + '  The only heading for this version sits inside a code fence, so it is an example,\n'
        + '  not an entry. changelog-reader.js cannot see fences indented 1-3 spaces.',
    };
  }
  if (!isRealDate(entry.date || '')) {
    return {
      ok: false,
      message: `UNDATED CHANGELOG ENTRY for ${version}: heading reads ${JSON.stringify(entry.date)}.\n`
        + '  Replace the placeholder with the release date, as YYYY-MM-DD.',
    };
  }
  if (entry.body.trim() === '') {
    return {
      ok: false,
      message: `EMPTY CHANGELOG ENTRY for ${version}: the heading is dated but there is nothing under it.`,
    };
  }

  return { ok: true, message: `changelog entry for ${version} dated ${entry.date}` };
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--changelog') options.changelogPath = path.resolve(argv[i + 1]);
    if (argv[i] === '--version') options.version = argv[i + 1];
  }
  return options;
}

if (require.main === module) {
  const result = checkChangelogEntry(parseArgs(process.argv.slice(2)));
  if (result.ok) {
    console.log(`✓ ${result.message}`);
  } else {
    console.error(`✗ ${result.message}`);
    process.exit(1);
  }
}

module.exports = { checkChangelogEntry, visibleHeadings, isRealDate };
