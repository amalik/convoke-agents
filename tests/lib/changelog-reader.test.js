'use strict';

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const path = require('path');
const os = require('os');

const { readChangelogEntries, DEFAULT_CHANGELOG_PATH } = require('../../scripts/update/lib/changelog-reader');

describe('readChangelogEntries', () => {
  let tmpDir;
  let changelogPath;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-changelog-'));
    changelogPath = path.join(tmpDir, 'CHANGELOG.md');
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    fs.writeFileSync(changelogPath, '', 'utf8');
  });

  it('returns entries strictly above fromVersion and up to toVersion, newest-first', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '# Changelog',
        '',
        '## [3.2.0] - 2026-04-11',
        '',
        '### Added',
        '- portability',
        '',
        '## [3.1.0] - 2026-04-06',
        '',
        '### Added',
        '- governance',
        '',
        '## [3.0.0] - 2026-03-01',
        '',
        '### Changed',
        '- rename',
        '',
      ].join('\n'),
      'utf8'
    );

    const entries = readChangelogEntries('3.0.0', '3.2.0', changelogPath);

    assert.equal(entries.length, 2);
    assert.equal(entries[0].version, '3.2.0');
    assert.equal(entries[0].date, '2026-04-11');
    assert.ok(entries[0].body.includes('- portability'));
    assert.equal(entries[1].version, '3.1.0');
    assert.ok(entries[1].body.includes('- governance'));
  });

  it('excludes the fromVersion entry (already installed) and includes the toVersion entry', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [2.0.0] - 2026-01-01',
        '- two',
        '',
        '## [1.0.0] - 2025-12-01',
        '- one',
      ].join('\n'),
      'utf8'
    );

    const entries = readChangelogEntries('1.0.0', '2.0.0', changelogPath);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].version, '2.0.0');
  });

  it('returns empty array when fromVersion equals toVersion (already current)', () => {
    fs.writeFileSync(changelogPath, '## [3.2.0] - 2026-04-11\n- stuff\n', 'utf8');
    assert.deepEqual(readChangelogEntries('3.2.0', '3.2.0', changelogPath), []);
  });

  it('treats null fromVersion as "include everything up to toVersion"', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [2.0.0] - 2026-01-01',
        '- two',
        '',
        '## [1.0.0] - 2025-12-01',
        '- one',
      ].join('\n'),
      'utf8'
    );

    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].version, '2.0.0');
    assert.equal(entries[1].version, '1.0.0');
  });

  it('returns empty array when file does not exist', () => {
    const missingPath = path.join(tmpDir, 'does-not-exist.md');
    assert.deepEqual(readChangelogEntries('1.0.0', '2.0.0', missingPath), []);
  });

  it('returns empty array when toVersion is falsy', () => {
    fs.writeFileSync(changelogPath, '## [1.0.0] - 2025-12-01\n- one\n', 'utf8');
    assert.deepEqual(readChangelogEntries('0.9.0', '', changelogPath), []);
    assert.deepEqual(readChangelogEntries('0.9.0', null, changelogPath), []);
  });

  it('ignores malformed or non-version headers and "Unreleased" sections', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [Unreleased]',
        '- wip',
        '',
        '## Not a version header',
        '- garbage',
        '',
        '## [1.0.0] - 2025-12-01',
        '- real',
      ].join('\n'),
      'utf8'
    );

    const entries = readChangelogEntries(null, '1.0.0', changelogPath);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].version, '1.0.0');
    assert.ok(entries[0].body.includes('- real'));
  });

  it('accepts version headers without a date', () => {
    fs.writeFileSync(changelogPath, '## [1.2.3]\n- undated\n', 'utf8');
    const entries = readChangelogEntries(null, '1.2.3', changelogPath);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].version, '1.2.3');
    assert.equal(entries[0].date, null);
    assert.ok(entries[0].body.includes('- undated'));
  });

  it('excludes horizontal-rule separators from body content', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [1.1.0] - 2025-12-10',
        '',
        '### Added',
        '- a thing',
        '',
        '---',
        '',
        '## [1.0.0] - 2025-12-01',
        '',
        '### Added',
        '- initial',
      ].join('\n'),
      'utf8'
    );

    const entries = readChangelogEntries('1.0.0', '1.1.0', changelogPath);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].version, '1.1.0');
    assert.ok(!entries[0].body.includes('---'));
  });

  it('uses the packaged CHANGELOG.md by default and can parse the real file', () => {
    assert.ok(fs.existsSync(DEFAULT_CHANGELOG_PATH), 'packaged CHANGELOG.md should exist');
    const entries = readChangelogEntries(null, '99.99.99');
    assert.ok(entries.length > 0, 'real CHANGELOG should yield at least one entry');
    for (const e of entries) {
      assert.match(e.version, /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/);
    }
  });

  it('includes pre-release version headers without body leakage', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [1.1.0] - 2026-02-16',
        '',
        '### Added',
        '- stable feature',
        '',
        '## [1.0.4-alpha] - 2026-02-16',
        '',
        '### Added',
        '- alpha feature',
        '',
        '## [1.0.3-alpha] - 2026-02-15',
        '',
        '- another alpha',
      ].join('\n'),
      'utf8'
    );

    const entries = readChangelogEntries(null, '1.1.0', changelogPath);
    const versions = entries.map((e) => e.version);
    assert.deepEqual(versions, ['1.1.0', '1.0.4-alpha', '1.0.3-alpha']);
    const stable = entries.find((e) => e.version === '1.1.0');
    assert.ok(stable.body.includes('- stable feature'));
    assert.ok(!stable.body.includes('- alpha feature'), 'pre-release body must not leak into stable entry');
    assert.ok(!stable.body.includes('- another alpha'));
  });

  it('does not parse version headers inside fenced code blocks', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [2.0.0] - 2026-03-01',
        '',
        '### Changed',
        '- bumped from the previous format',
        '',
        'Example of the old format:',
        '',
        '```markdown',
        '## [1.0.0] - 2025-01-01',
        '- ancient',
        '```',
        '',
        'End of example.',
      ].join('\n'),
      'utf8'
    );

    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.equal(entries.length, 1, 'fenced header must not create a second entry');
    assert.equal(entries[0].version, '2.0.0');
    assert.ok(entries[0].body.includes('## [1.0.0] - 2025-01-01'), 'fenced header preserved in body');
    assert.ok(entries[0].body.includes('End of example.'));
  });

  it('drops non-semver labels like Unreleased and TBD while preserving surrounding flow', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [Unreleased]',
        '- wip',
        '',
        '## [1.1.0] - 2026-02-16',
        '- real',
        '',
        '## [TBD] - soon',
        '- placeholder',
        '',
        '## [1.0.0] - 2025-12-01',
        '- also real',
      ].join('\n'),
      'utf8'
    );

    const entries = readChangelogEntries(null, '1.1.0', changelogPath);
    const versions = entries.map((e) => e.version);
    assert.deepEqual(versions, ['1.1.0', '1.0.0']);
    const onezero = entries.find((e) => e.version === '1.0.0');
    assert.ok(!onezero.body.includes('- placeholder'), 'TBD body must not leak into 1.0.0');
  });

  // T182 (a): CommonMark lets a fence open with up to three spaces of indent, and only a run of
  // the same marker at least as long closes it. The real CHANGELOG.md has four indented fence
  // lines. Read with a column-0 toggle, a heading inside such a fence became a release shown to
  // operators, and the text after the fence moved into it.
  it('treats a fence indented by up to three spaces as a fence (T182)', () => {
    for (const indent of [' ', '  ', '   ']) {
      fs.writeFileSync(
        changelogPath,
        [
          '## [2.0.0] - 2026-01-02',
          '',
          'Real two.',
          '',
          `${indent}\`\`\`md`,
          '## [1.5.0] - 2026-01-01',
          'Example inside an indented fence.',
          `${indent}\`\`\``,
          '',
          'More of two.',
          '',
          '## [1.0.0] - 2025-12-01',
          '',
          'Real one.',
        ].join('\n'),
        'utf8'
      );
      const entries = readChangelogEntries(null, '2.0.0', changelogPath);
      const label = `indent ${JSON.stringify(indent)}`;
      assert.deepEqual(entries.map((e) => e.version), ['2.0.0', '1.0.0'], `${label}: the fenced heading became a release`);
      assert.ok(entries[0].body.includes('Example inside an indented fence.'), `${label}: the fence content belongs to 2.0.0`);
      assert.ok(entries[0].body.includes('More of two.'), `${label}: the text after the fence belongs to 2.0.0`);
    }
  });

  it('closes a fence only on the same marker at least as long, with nothing after it (T182)', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [2.0.0] - 2026-01-02',
        '',
        '````md',
        'A four-backtick fence documenting a three-backtick one:',
        '```',
        '## [1.6.0] - 2026-01-01',
        '```',
        '~~~~',
        '## [1.5.0] - 2026-01-01',
        '```` not a closer',
        '## [1.4.0] - 2026-01-01',
        '````',
        '',
        'After the fence.',
        '',
        '## [1.0.0] - 2025-12-01',
        'Real one.',
      ].join('\n'),
      'utf8'
    );
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => e.version), ['2.0.0', '1.0.0']);
    assert.ok(entries[0].body.includes('After the fence.'));
  });

  it('does not take a backtick line whose info string holds a backtick for a fence (T182)', () => {
    // CommonMark: \`\`\` followed by text containing a backtick is inline code, not a fence opener.
    fs.writeFileSync(
      changelogPath,
      [
        '## [2.0.0] - 2026-01-02',
        '',
        '```run `npm test` first',
        '',
        '## [1.0.0] - 2025-12-01',
        'Real one.',
        // A later fence line: read as an opener, the line above would pair with it and hide 1.0.0.
        '```',
      ].join('\n'),
      'utf8'
    );
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => e.version), ['2.0.0', '1.0.0']);
  });

  it('does not take a tab-indented line for a fence (T182)', () => {
    // CommonMark counts a tab as four columns: indented code, not a fence.
    fs.writeFileSync(
      changelogPath,
      ['## [2.0.0] - 2026-01-02', '', '\t```', '', '## [1.0.0] - 2025-12-01', 'Real one.', '```'].join('\n'),
      'utf8'
    );
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => e.version), ['2.0.0', '1.0.0']);
  });

  it('does not take a line indented four spaces for a fence (T182)', () => {
    // Four spaces is an indented code block, not a fence: it must not hide the heading after it.
    fs.writeFileSync(
      changelogPath,
      [
        '## [2.0.0] - 2026-01-02',
        '',
        '    ```',
        '',
        '## [1.0.0] - 2025-12-01',
        'Real one.',
      ].join('\n'),
      'utf8'
    );
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => e.version), ['2.0.0', '1.0.0']);
  });

  // T182 (b): a version heading that drops its brackets was skipped, so its whole section was
  // shown under the release above it. Operator ruling 2026-10-24: read it as its own release.
  it('reads a version heading without brackets as its own release (T182)', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [2.0.0] - 2026-01-02',
        'Real two.',
        '',
        '## 1.5.0 - 2026-01-01',
        'Bare section.',
        '',
        '## v1.4.0',
        'Prefixed section.',
        '',
        '## 1.3.5 — 2025-12-20 (yanked)',
        'A note after the date, as the bracketed form allows.',
        '',
        '## [v1.3.0] — 2025-12-15',
        'Bracketed and prefixed: not a semver label, dropped as before T182.',
        '',
        '## [1.0.0] - 2025-12-01',
        'Real one.',
      ].join('\n'),
      'utf8'
    );
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => [e.version, e.date]), [
      ['2.0.0', '2026-01-02'],
      ['1.5.0', '2026-01-01'],
      ['1.4.0', null],
      ['1.3.5', '2025-12-20 (yanked)'],
      ['1.0.0', '2025-12-01'],
    ]);
    assert.equal(entries[0].body, 'Real two.', 'no section may leak into the release above it');
    assert.equal(entries[1].body, 'Bare section.');
    assert.equal(entries[2].body, 'Prefixed section.', 'the bracketed [v…] heading still ends the section above it');
  });

  it('reads a changelog with CRLF line endings the same way (T182)', () => {
    const lf = [
      '## [2.0.0] - 2026-01-02',
      '',
      '  ```md',
      '## [1.5.0] - 2026-01-01',
      '  ```',
      '',
      '## 1.2.0 - 2025-12-20',
      'Bare.',
      '',
      '## [1.0.0] - 2025-12-01',
      'Real one.',
    ].join('\n');
    fs.writeFileSync(changelogPath, lf, 'utf8');
    const expected = readChangelogEntries(null, '2.0.0', changelogPath);
    fs.writeFileSync(changelogPath, lf.replace(/\n/g, '\r\n'), 'utf8');
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => e.version), ['2.0.0', '1.2.0', '1.0.0']);
    assert.deepEqual(entries, expected);
  });

  it('keeps fences when a stray carriage return is left on the line (T182)', () => {
    // A file converted to CRLF twice ends its lines in \r\r\n; splitting on \r?\n leaves one \r.
    fs.writeFileSync(
      changelogPath,
      ['## [2.0.0] - 2026-01-02', '', '```md', '## [0.0.1] - 2020-01-01', '```', '', '## [1.0.0] - 2025-12-01', 'Real one.'].join('\r\r\n'),
      'utf8'
    );
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => e.version), ['2.0.0', '1.0.0'], 'the fenced example became a release');
  });

  it('bounds the fail-safe on a changelog full of stray fence lines (T182)', () => {
    // Each pass re-reads the file; without a bound, 20,000 such lines took about 38 s.
    const lines = ['## [2.0.0] - 2026-01-02', ''];
    for (let i = 0; i < 20000; i++) lines.push('```a');
    lines.push('', '## [1.0.0] - 2025-12-01', 'Real one.');
    fs.writeFileSync(changelogPath, lines.join('\n'), 'utf8');
    const started = Date.now();
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    const ms = Date.now() - started;
    assert.ok(ms < 5000, `the reader took ${ms} ms`);
    assert.equal(entries[0].version, '2.0.0');
  });

  it('reads a fence that never closes as plain text, so later releases still show (T182)', () => {
    // CommonMark would run it to the end of the file and drop every release below. Operator
    // ruling 2026-10-24: fail safe. A fence that does close still hides what is inside it.
    fs.writeFileSync(
      changelogPath,
      [
        '## [3.0.0] - 2026-02-01',
        '',
        '```md',
        '## [2.5.0] - 2026-01-15',
        '```',
        '',
        '## [2.0.0] - 2026-01-02',
        '',
        '  ````js',
        'a stray opener with no closer',
        '',
        '## [1.0.0] - 2025-12-01',
        'Real one.',
        '',
        '~~~',
        '## [0.5.0] - 2025-11-01',
        'Below a second unclosed fence.',
      ].join('\n'),
      'utf8'
    );
    const entries = readChangelogEntries(null, '3.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => e.version), ['3.0.0', '2.0.0', '1.0.0', '0.5.0']);
    assert.ok(entries[1].body.includes('a stray opener with no closer'));
  });

  it('still leaves prose headings that merely start with a number alone (T182)', () => {
    fs.writeFileSync(
      changelogPath,
      [
        '## [2.0.0] - 2026-01-02',
        'Real two.',
        '',
        '## 1.0.0 migration notes',
        'Prose under a heading that is not a release.',
        '',
        '## 1.0.0 - migration notes',
        'A dash is not enough: the date must start YYYY-MM-DD.',
        '',
        '## v2.0.0 — what changed',
        'Nor here.',
        '',
        '## 2.0 overview',
        'More prose.',
      ].join('\n'),
      'utf8'
    );
    const entries = readChangelogEntries(null, '2.0.0', changelogPath);
    assert.deepEqual(entries.map((e) => e.version), ['2.0.0']);
  });
});

describe('printChangelog (convoke-update integration)', () => {
  let originalLog;
  let captured;
  let printChangelog;

  before(() => {
    printChangelog = require('../../scripts/update/convoke-update').printChangelog;
  });

  beforeEach(() => {
    captured = [];
    originalLog = console.log;
    console.log = (...args) => {
      captured.push(args.join(' '));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('is silent when no entries fall within the requested range', () => {
    printChangelog('3.2.0', '3.2.0');
    assert.equal(captured.length, 0);
  });

  it('does not throw when rendering against the real packaged CHANGELOG', () => {
    assert.doesNotThrow(() => printChangelog(null, '99.99.99'));
    assert.ok(captured.length > 0, 'real CHANGELOG should produce visible output');
    assert.ok(captured.some((l) => l.includes("What's New")));
  });
});
