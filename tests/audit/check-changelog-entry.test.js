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
  assert.match(result.message, /DISPUTED CHANGELOG ENTRY/);
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
  // Deliberately a fixture, not the repository's own files: pointed at those, this test
  // goes red between `npm version` and the moment the date replaces UNRELEASED — during
  // the release, under a name that says nothing about the cause.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-changelog-'));
  const changelogPath = path.join(dir, 'CHANGELOG.md');
  fs.writeFileSync(changelogPath, GOOD);
  try {
    const output = execFileSync('node', [SCRIPT, '--changelog', changelogPath, '--version', VERSION], {
      cwd: path.parse(process.cwd()).root,
      encoding: 'utf8',
    });
    assert.match(output, /changelog entry for 9\.9\.9 dated 2026-09-17/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('exits 1 on a failing changelog', () => {
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

test('exits 2 on a mistyped flag rather than checking something else', () => {
  for (const args of [['--versoin', '9.9.9'], ['--version'], ['--changelog'], ['9.9.9']]) {
    try {
      execFileSync('node', [SCRIPT, ...args], { cwd: os.tmpdir(), encoding: 'utf8', stdio: 'pipe' });
      assert.fail(`expected a non-zero exit for ${args.join(' ')}`);
    } catch (err) {
      assert.equal(err.status, 2, `${args.join(' ')} exited ${err.status}: ${err.stdout}${err.stderr}`);
      assert.match(err.stderr, /unknown argument|needs a value/);
    }
  }
});

test('rejects a heading hidden in a fence longer than three markers', () => {
  // A ````-fence documenting a ```-fence. A boolean in-fence toggle flips mid-block and
  // treats the example as a live entry.
  const nested = `# Changelog

\`\`\`\`md
\`\`\`
## [9.9.9] - 2026-09-17

- example only
\`\`\`
\`\`\`\`

## [9.9.8] - 2026-09-14

- older
`;
  const result = check(nested);
  assert.equal(result.ok, false);
  assert.match(result.message, /DISPUTED CHANGELOG ENTRY/);
});

test('accepts a real entry below a legitimate nested code block', () => {
  // The false-failure direction: this changelog is correct and must pass.
  const documented = `# Changelog

Code blocks are written like:

  \`\`\`\`md
  Open a code block with:
  \`\`\`
  \`\`\`\`

## [9.9.9] - 2026-09-17

- a real, dated, non-empty entry

## [9.9.8] - 2026-09-14

- older
`;
  const result = check(documented);
  assert.equal(result.ok, true, result.message);
});

test('rejects a fenced example sitting above the real entry', () => {
  // The example hides from a strict scan but not from changelog-reader.js, so the gate
  // would otherwise validate the example and never look at the UNRELEASED entry below.
  const masked = `# Changelog

   \`\`\`md
## [9.9.9] - 2026-09-17
- example
   \`\`\`

## [9.9.9] - UNRELEASED

- the real entry
`;
  const result = check(masked);
  assert.equal(result.ok, false);
  assert.match(result.message, /DUPLICATE CHANGELOG ENTRIES/);
});

test('rejects an entry that exists only inside an HTML comment', () => {
  const commented = `# Changelog

<!--
## [9.9.9] - 2026-09-17

- drafted, not released
-->

## [9.9.8] - 2026-09-14

- older
`;
  const result = check(commented);
  assert.equal(result.ok, false);
  assert.match(result.message, /DISPUTED CHANGELOG ENTRY/);
});

test('rejects a body that is only an HTML comment', () => {
  const result = check(`# Changelog

## [9.9.9] - 2026-09-17

<!-- nothing written yet -->

## [9.9.8] - 2026-09-14

- older
`);
  assert.equal(result.ok, false);
  assert.match(result.message, /EMPTY CHANGELOG ENTRY/);
});

test('rejects a version above every entry in the file', () => {
  // The shape a release actually has: the new version is newer than everything present.
  // The earlier missing-entry test used a version BELOW the floor, where the reader's
  // ceiling filter returns nothing anyway — so it pinned the wrong thing.
  const result = check(GOOD, '9.9.10');
  assert.equal(result.ok, false);
  assert.match(result.message, /MISSING CHANGELOG ENTRY/);
});

test('rejects a date that does not start the heading', () => {
  const result = check(GOOD.replace(' - 2026-09-17', ' - UNRELEASED (target 2026-09-17)'));
  assert.equal(result.ok, false);
  assert.match(result.message, /UNDATED CHANGELOG ENTRY/);
});

test('sees an indented duplicate heading', () => {
  const result = check(`# Changelog

## [9.9.9] - 2026-09-17

- first

  ## [9.9.9] - 2026-09-16

- second
`);
  assert.equal(result.ok, false);
  assert.match(result.message, /DUPLICATE CHANGELOG ENTRIES/);
});

test('reports an unreadable changelog rather than blessing it', () => {
  const result = checkChangelogEntry({
    changelogPath: path.join(os.tmpdir(), 'convoke-no-such-changelog.md'),
    version: VERSION,
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /cannot read/);
});

test('ignores a standing Unreleased section', () => {
  // Keep-a-Changelog convention: a non-semver heading that must neither be treated as
  // this release nor make the gate throw.
  const result = check(`# Changelog

## [Unreleased]

- in progress

${GOOD.replace('# Changelog\n\n', '')}`);
  assert.equal(result.ok, true, result.message);
});

test('rejects a real heading and a fenced one that disagree about the date', () => {
  // Counts match — the reader sees only the column-0 heading inside the fence, the strict
  // scan sees only the indented one — so only comparing the dates catches it.
  const result = check(`# Changelog

   \`\`\`md
## [9.9.9] - 2026-09-17
- example
   \`\`\`

  ## [9.9.9] - UNRELEASED

- the real entry

## [9.9.8] - 2026-09-14

- older
`);
  assert.equal(result.ok, false);
  assert.match(result.message, /DISPUTED CHANGELOG ENTRY/);
});

test('finds its own repository files from an unrelated working directory', () => {
  // Asserts location, not verdict: between `npm version` and dating the entry the gate
  // legitimately exits 1, and this test must not go red for that.
  let output;
  try {
    output = execFileSync('node', [SCRIPT], { cwd: os.tmpdir(), encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    assert.equal(err.status, 1, `expected a gate verdict, got exit ${err.status}: ${err.stderr}`);
    output = err.stdout + err.stderr;
  }
  assert.doesNotMatch(output, /cannot read|ENOENT/, 'the gate must resolve its own repository, not the cwd');
});

test('does not mistake a four-part version for this release', () => {
  // compareVersions('9.9.9.0', '9.9.9') is 0, but changelog-reader.js's SEMVER_RE rejects
  // the heading, so operators are shown nothing — MISSING is the accurate verdict, and
  // sends the releaser to write an entry rather than to hunt for a stray code fence.
  const result = check(`# Changelog

## [9.9.9.0] - 2026-09-17

- a typo in the version

## [9.9.8] - 2026-09-14

- older
`);
  assert.equal(result.ok, false);
  assert.match(result.message, /MISSING CHANGELOG ENTRY/);
});
