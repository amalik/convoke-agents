'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { removeTempDirSync, initGitFixture } = require('../helpers');

const {
  deriveInScope,
  parseCoverageTable,
  audit,
  main,
  EXCLUSIONS,
  MODULE_INCLUSIONS,
} = require('../../scripts/audit/coverage-denominator');

const TABLE_HEADER =
  '| File | In scope | Assertions | Examined | Story | Findings |\n' +
  '|------|----------|-----------:|----------|-------|----------|\n';

const created = [];
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cov-denom-'));
  created.push(dir);
  initGitFixture(dir);
  return dir;
}
function write(dir, rel, body) {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body, 'utf8');
  return abs;
}
function track(dir) {
  require('child_process').execFileSync('git', ['add', '-A'], { cwd: dir, stdio: 'ignore' });
}

afterEach(() => {
  while (created.length) removeTempDirSync(created.pop());
});

describe('coverage-denominator: derivation', () => {
  it('derives only TRACKED files — an untracked scratch note is not in scope', () => {
    const dir = fixture();
    write(dir, 'docs/tracked.md', '# t');
    track(dir);
    write(dir, 'docs/untracked.md', '# u');
    const set = deriveInScope(dir);
    assert.ok(set.includes('docs/tracked.md'));
    assert.ok(!set.includes('docs/untracked.md'), 'untracked file must not enter the denominator');
  });

  it('recurses into docs/ subdirectories', () => {
    const dir = fixture();
    write(dir, 'docs/adr/deep.md', '# d');
    track(dir);
    assert.ok(deriveInScope(dir).includes('docs/adr/deep.md'));
  });

  it('honours the exclusion list', () => {
    const dir = fixture();
    write(dir, 'docs/keep.md', '# k');
    write(dir, 'CHANGELOG.md', '# c');
    track(dir);
    const set = deriveInScope(dir);
    assert.ok(set.includes('docs/keep.md'));
    assert.ok(!set.includes('CHANGELOG.md'), 'CHANGELOG.md is excluded by ruling');
  });

  it('adds module inclusions that no glob reaches', () => {
    const dir = fixture();
    for (const rel of MODULE_INCLUSIONS) write(dir, rel, '# m');
    track(dir);
    const set = deriveInScope(dir);
    for (const rel of MODULE_INCLUSIONS) assert.ok(set.includes(rel), `${rel} must be included`);
  });
});

describe('coverage-denominator: table parsing', () => {
  it('parses the six-column table and strips emphasis', () => {
    const rows = parseCoverageTable(
      TABLE_HEADER + '| `docs/a.md` | yes | 5 | **yes** | 1.4 | 0 |\n'
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].file, 'docs/a.md');
    assert.equal(rows[0].examined, 'yes');
    assert.equal(rows[0].story, '1.4');
  });

  it('ignores a six-column table inside a fenced block', () => {
    const fenced = '```\n' + TABLE_HEADER + '| `docs/fake.md` | yes | 1 | **yes** | 9.9 | 0 |\n```\n';
    assert.equal(parseCoverageTable(fenced).length, 0);
  });

  it('does not parse the other tables that also start with | File |', () => {
    const other = '| File | Lines | Why |\n|---|---|---|\n| `docs/x.md` | 10 | reason |\n';
    assert.equal(parseCoverageTable(other).length, 0);
  });
});

describe('coverage-denominator: refusal', () => {
  // Fixtures inject their own lists: the real exclusion list names real-repo files, so
  // reusing it here would report 15 stale entries and mask what each case is testing.
  const FIXTURE_EXCL = new Map([['note.md', 'the fixture table itself']]);
  const FIXTURE_INCL = [];

  function setup(tableBody) {
    const dir = fixture();
    write(dir, 'docs/one.md', '# 1');
    write(dir, 'docs/two.md', '# 2');
    write(dir, 'note.md', TABLE_HEADER + tableBody);
    track(dir);
    return {
      dir,
      opts: {
        root: dir,
        tablePath: path.join(dir, 'note.md'),
        exclusions: FIXTURE_EXCL,
        moduleInclusions: FIXTURE_INCL,
      },
    };
  }

  it('refuses a row flipped to Examined: no, naming the file and its story', () => {
    const { opts } = setup(
      '| `docs/one.md` | yes | 5 | **no** | 1.4 | 0 |\n| `docs/two.md` | yes | 5 | **yes** | 1.5 | 0 |\n'
    );
    const r = audit(opts);
    assert.equal(r.ok, false);
    const f = r.findings.find((x) => x.file === 'docs/one.md');
    assert.ok(f, 'must name the unexamined file');
    assert.equal(f.story, '1.4', 'must name the owning story');
  });

  it('reports an in-scope file with NO row as owner: none', () => {
    const { opts } = setup('| `docs/one.md` | yes | 5 | **yes** | 1.4 | 0 |\n');
    const r = audit(opts);
    assert.equal(r.ok, false);
    const f = r.findings.find((x) => x.file === 'docs/two.md');
    assert.ok(f, 'a file with no row must be reported');
    assert.equal(f.story, null, 'no row means no owning story');
    assert.match(f.reason, /no row/i);
  });

  it('reports an orphan row — a row for a file not in the derived set', () => {
    const { opts } = setup(
      '| `docs/one.md` | yes | 5 | **yes** | 1.4 | 0 |\n' +
        '| `docs/two.md` | yes | 5 | **yes** | 1.5 | 0 |\n' +
        '| `docs/ghost.md` | yes | 5 | **yes** | 1.6 | 0 |\n'
    );
    const r = audit(opts);
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((x) => x.file === 'docs/ghost.md' && /orphan/i.test(x.reason)));
  });

  it('reports a row saying In scope: no while the file IS in the derived set', () => {
    const { opts } = setup(
      '| `docs/one.md` | no | 5 | **yes** | 1.4 | 0 |\n| `docs/two.md` | yes | 5 | **yes** | 1.5 | 0 |\n'
    );
    const r = audit(opts);
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((x) => x.file === 'docs/one.md' && /in scope/i.test(x.reason)));
  });

  it('passes when every derived file is examined', () => {
    const { opts } = setup(
      '| `docs/one.md` | yes | 5 | **yes** | 1.4 | 0 |\n| `docs/two.md` | yes | 5 | **yes** | 1.5 | 0 |\n'
    );
    const r = audit(opts);
    assert.equal(r.ok, true, JSON.stringify(r.findings));
    assert.equal(r.findings.length, 0);
  });
});

describe('coverage-denominator: stale list entries', () => {
  it('refuses when an exclusion entry resolves to no tracked file', () => {
    const dir = fixture();
    write(dir, 'docs/one.md', '# 1');
    write(dir, 'note.md', TABLE_HEADER + '| `docs/one.md` | yes | 5 | **yes** | 1.4 | 0 |\n');
    track(dir);
    const r = audit({
      root: dir,
      tablePath: path.join(dir, 'note.md'),
      exclusions: new Map([['note.md', 'fixture table'], ['docs/deleted.md', 'names a file that is gone']]),
      moduleInclusions: [],
    });
    assert.equal(r.ok, false);
    assert.ok(
      r.findings.some((x) => x.file === 'docs/deleted.md' && /stale exclusion/i.test(x.reason)),
      'a list entry naming no file must be reported'
    );
  });
});

describe('coverage-denominator: the declared lists', () => {
  // AC1 requires a one-line reason per exclusion. Without this the requirement is
  // an instruction nobody checks, and an unexplained exclusion is how a file
  // silently leaves scope.
  it('every exclusion carries a non-empty reason', () => {
    assert.ok(EXCLUSIONS.size > 0, 'the exclusion list must not be empty');
    const bare = [...EXCLUSIONS.entries()].filter(([, why]) => !why || why.trim().length < 10);
    assert.deepEqual(bare.map(([f]) => f), [], 'these exclusions have no usable reason');
  });

  it('no entry appears in both the exclusion and inclusion lists', () => {
    const both = MODULE_INCLUSIONS.filter((f) => EXCLUSIONS.has(f));
    assert.deepEqual(both, [], 'an entry cannot be both excluded and included');
  });
});

describe('coverage-denominator: main', () => {
  it('exits 0 against the real repository', () => {
    assert.equal(main(), 0);
  });
});
