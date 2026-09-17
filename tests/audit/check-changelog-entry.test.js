'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { checkChangelogEntry } = require('../../scripts/audit/check-changelog-entry');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'audit', 'check-changelog-entry.js');
const VERSION = '9.9.9';

/**
 * Write a changelog into a fresh directory and check it.
 *
 * Every case below is a shape that reached an operator, or would have: each one
 * passed the hand-written grep this gate replaced.
 *
 * @param {string} body - CHANGELOG.md contents.
 * @param {string} [version] - Version to check for.
 * @returns {{ok: boolean, message: string}}
 */
function check(body, version = VERSION) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-changelog-'));
  const changelogPath = path.join(dir, 'CHANGELOG.md');
  fs.writeFileSync(changelogPath, body);
  try {
    return checkChangelogEntry({ changelogPath, version });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const GOOD = `# Changelog

## [9.9.9] - 2026-09-17

### Fixed

- something real

## [9.9.8] - 2026-09-14

- older
`;

test('accepts a dated entry with a body', () => {
  const result = check(GOOD);
  assert.equal(result.ok, true, result.message);
  assert.match(result.message, /dated 2026-09-17/);
});

test('rejects a missing entry', () => {
  const result = check(GOOD, '9.9.7');
  assert.equal(result.ok, false);
  assert.match(result.message, /MISSING CHANGELOG ENTRY/);
});

test('rejects UNRELEASED, a bare heading, and TBD', () => {
  for (const date of [' - UNRELEASED', '', ' - TBD']) {
    const result = check(GOOD.replace(' - 2026-09-17', date));
    assert.equal(result.ok, false, `expected failure for "${date}"`);
    assert.match(result.message, /UNDATED CHANGELOG ENTRY/);
  }
});

test('rejects date-shaped strings that are not dates', () => {
  for (const date of ['0000-00-00', '9999-99-99', '2026-13-45', '2026-02-30']) {
    const result = check(GOOD.replace('2026-09-17', date));
    assert.equal(result.ok, false, `expected failure for ${date}`);
    assert.match(result.message, /UNDATED CHANGELOG ENTRY/);
  }
});

test('rejects a heading that is only an example inside an indented fence', () => {
  const fenced = `# Changelog

Example of the format:

   \`\`\`md
## [9.9.9] - 2026-09-17

### Fixed
- example
   \`\`\`

## [9.9.8] - 2026-09-14

- older
`;
  const result = check(fenced);
  assert.equal(result.ok, false);
  assert.match(result.message, /FENCED CHANGELOG ENTRY/);
});

test('rejects two entries for the same version', () => {
  const duplicated = `# Changelog

## [9.9.9] - 2026-09-17

placeholder, do not ship

## [9.9.9] - UNRELEASED

the real one
`;
  const result = check(duplicated);
  assert.equal(result.ok, false);
  assert.match(result.message, /DUPLICATE CHANGELOG ENTRIES/);
});

test('rejects a malformed neighbouring heading that would swallow its own section', () => {
  const result = check(GOOD.replace('## [9.9.8] - 2026-09-14', '## 9.9.8 - 2026-09-14'));
  assert.equal(result.ok, false);
  assert.match(result.message, /MALFORMED HEADING/);
});

test('leaves prose headings alone', () => {
  // The repository's own CHANGELOG.md ends with `## Version History`. A check that
  // demanded every `##` heading be an entry failed on it — caught by the test below
  // that runs this gate against the real file.
  const result = check(`${GOOD}\n## Version History\n\nSee git tags.\n`);
  assert.equal(result.ok, true, result.message);
});

test('rejects a dated heading with an empty body', () => {
  const result = check(`# Changelog

## [9.9.9] - 2026-09-17

## [9.9.8] - 2026-09-14

- older
`);
  assert.equal(result.ok, false);
  assert.match(result.message, /EMPTY CHANGELOG ENTRY/);
});

test('rejects a version string package.json should never carry', () => {
  for (const version of ['v9.9.9', '9.9.9 ', '']) {
    const result = check(GOOD, version);
    assert.equal(result.ok, false, `expected failure for ${JSON.stringify(version)}`);
    assert.match(result.message, /not a plain semver string/);
  }
});

test('matches versions the way printChangelog does, including build metadata', () => {
  const built = GOOD.replace('## [9.9.9]', '## [9.9.9+build.7]');
  assert.equal(check(built).ok, true, 'operators are shown this entry, so the gate must accept it');
});

test('accepts a pre-release version and a trailing note on the date', () => {
  const pre = GOOD.replace('## [9.9.9] - 2026-09-17', '## [9.9.9-alpha] - 2026-09-17 (Unpublished)');
  const result = check(pre, '9.9.9-alpha');
  assert.equal(result.ok, true, result.message);
});

test('runs from any working directory', () => {
  const output = execFileSync('node', [SCRIPT], { cwd: os.tmpdir(), encoding: 'utf8' });
  assert.match(output, /changelog entry for /);
});

test('exits non-zero when the repository changelog fails the gate', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-changelog-'));
  const changelogPath = path.join(dir, 'CHANGELOG.md');
  fs.writeFileSync(changelogPath, '# Changelog\n');
  try {
    execFileSync('node', [SCRIPT, '--changelog', changelogPath, '--version', VERSION], {
      cwd: os.tmpdir(),
      encoding: 'utf8',
      stdio: 'pipe',
    });
    assert.fail('expected a non-zero exit');
  } catch (err) {
    assert.equal(err.status, 1);
    assert.match(err.stderr, /MISSING CHANGELOG ENTRY/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
