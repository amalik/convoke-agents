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
  format,
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

describe('coverage-denominator: the REAL declared lists, against a fixture tree', () => {
  // The previous version of this block asserted `main() === 0` against PACKAGE_ROOT. That
  // violated `test-fixture-isolation` ("Exception. None."), and made any PR that tracked a
  // new .md turn the suite red with a bare `1 !== 0`. It was also the SOLE executioner for
  // 14 of 15 exclusions, both module inclusions, and the path-parsing fix — mutation-proved
  // at review. This block keeps that coverage without scanning the real tree: it builds a
  // fixture FROM the real lists, so a typo in either one fails here.

  function treeFromRealLists() {
    const dir = fixture();
    for (const rel of EXCLUSIONS.keys()) write(dir, rel, '# excluded');
    for (const rel of MODULE_INCLUSIONS) write(dir, rel, '# included');
    write(dir, 'docs/in-scope-sentinel.md', '# in scope');
    track(dir);
    return dir;
  }

  // ⚠ The two tests below iterate the list under test to BUILD the fixture, so they catch a
  // TYPO but are blind to a DELETION — the entry is simply absent from both sides. Round 2
  // mutation-proved that gap: dropping an exclusion, dropping a module inclusion, and
  // dropping the root-`*.md` half of the derivation all left the suite green. These three
  // pin the lists and the derivation shape independently.

  it('the declared lists are pinned — a DELETED entry fails here', () => {
    // Required members, named literally. Deleting any of them from the source fails this.
    for (const rel of [
      'CHANGELOG.md', 'CONTRIBUTING.md', 'INSTALLATION.md', 'project-context.md',
      'docs/README.md', 'docs/pre-tag-release-checklist.md',
      'docs/adr/adr-bmad-coupling-v4.0.md', 'docs/migration/3.x-to-4.0.md',
    ]) {
      assert.ok(EXCLUSIONS.has(rel), `${rel} must remain excluded, with its reason`);
    }
    assert.deepEqual(
      [...MODULE_INCLUSIONS].sort(),
      ['_bmad/bme/_vortex/compass-routing-reference.md', '_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md'],
      'the module inclusion list is exact — no glob reaches these'
    );
  });

  it('the derivation covers root *.md, not only docs/', () => {
    const dir = fixture();
    write(dir, 'docs/in-docs.md', '# d');
    write(dir, 'AT-ROOT.md', '# r');
    write(dir, 'sub/dir/elsewhere.md', '# e');
    track(dir);
    const set = deriveInScope(dir, { exclusions: new Map(), moduleInclusions: [] });
    assert.ok(set.includes('docs/in-docs.md'), 'docs/ half');
    assert.ok(set.includes('AT-ROOT.md'), 'root half — 5 of the 15 rows live here');
    assert.ok(!set.includes('sub/dir/elsewhere.md'), 'other directories are out of scope');
  });

  it('a row hidden behind a blank line is reported, not silently dropped', () => {
    const rows = parseCoverageTable(
      TABLE_HEADER +
        '| `docs/a.md` | yes | 1 | **yes** | 1.4 | 0 |\n\n' +
        '| `docs/b.md` | yes | 1 | **no** | 1.5 | 0 |\n'
    );
    assert.deepEqual(rows.map((r) => r.file), ['docs/a.md']);
    assert.equal(rows.malformed.length, 1, 'the unreachable row must be recorded');
    assert.ok(rows.malformed[0].unreached);
  });

  it('a sibling table with a backticked first cell is NOT swept', () => {
    const rows = parseCoverageTable(
      TABLE_HEADER +
        '| `docs/a.md` | yes | 1 | **yes** | 1.4 | 0 |\n\n' +
        '| File | Lines | Why |\n|---|---|---|\n| `docs/x.md` | 637 | prose |\n'
    );
    assert.equal(rows.malformed.length, 0, 'other tables in the same file are not coverage rows');
  });

  it('every real exclusion entry names a path the glob would otherwise catch', () => {
    const dir = treeFromRealLists();
    const set = deriveInScope(dir);
    const leaked = [...EXCLUSIONS.keys()].filter((rel) => set.includes(rel));
    assert.deepEqual(leaked, [], 'these exclusions did not take effect');
  });

  it('every real module inclusion is pulled in even though no glob reaches it', () => {
    const dir = treeFromRealLists();
    const set = deriveInScope(dir);
    const missing = MODULE_INCLUSIONS.filter((rel) => !set.includes(rel));
    assert.deepEqual(missing, [], 'these inclusions were not added');
  });

  it('a typo in an exclusion path is caught as a stale entry', () => {
    const dir = treeFromRealLists();
    const typo = new Map(EXCLUSIONS);
    typo.delete('CHANGELOG.md');
    typo.set('CHANGELOGG.md', 'deliberately misspelt');
    const r = audit({ root: dir, tablePath: path.join(dir, 'none.md'), exclusions: typo, moduleInclusions: MODULE_INCLUSIONS });
    assert.ok(
      r.findings.some((f) => f.file === 'CHANGELOGG.md' && /stale exclusion/i.test(f.reason)),
      'a misspelt exclusion must be reported'
    );
  });

  it('a typo in a module inclusion is caught as a stale entry', () => {
    const dir = treeFromRealLists();
    const r = audit({
      root: dir, tablePath: path.join(dir, 'none.md'),
      exclusions: EXCLUSIONS,
      moduleInclusions: ['_bmad/bme/_vortex/NOT-A-REAL-GUIDE.md'],
    });
    assert.ok(
      r.findings.some((f) => /NOT-A-REAL-GUIDE/.test(f.file) && /stale inclusion/i.test(f.reason)),
      'a misspelt inclusion must be reported'
    );
  });

  it('a path with underscores, asterisks or backticks survives parsing intact', () => {
    for (const p of ['_bmad/bme/_vortex/x.md', 'CODE_OF_CONDUCT.md', 'docs/a*b.md']) {
      const rows = parseCoverageTable(TABLE_HEADER + `| \`${p}\` | yes | 1 | **yes** | 1.4 | 0 |\n`);
      assert.equal(rows[0].file, p, `${p} was mangled by cell parsing`);
    }
  });
});

describe('coverage-denominator: cannot be fooled', () => {
  const EX = new Map([['note.md', 'fixture table']]);
  function run(body) {
    const dir = fixture();
    write(dir, 'docs/one.md', '# 1');
    write(dir, 'note.md', TABLE_HEADER + body);
    track(dir);
    return audit({ root: dir, tablePath: path.join(dir, 'note.md'), exclusions: EX, moduleInclusions: [] });
  }

  it('a duplicate row cannot override an earlier refusal', () => {
    const r = run('| `docs/one.md` | yes | 1 | **no** | 1.4 | 0 |\n| `docs/one.md` | yes | 1 | **yes** | 1.4 | 0 |\n');
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f) => /duplicate row/i.test(f.reason)));
  });

  it('a malformed row is reported, not silently skipped', () => {
    const r = run('| `docs/one.md` | yes | 1 | **yes** | 1.4 | 0 | extra |\n');
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f) => /unparseable table row/i.test(f.reason)));
  });

  it('a malformed row does not stop later rows being parsed', () => {
    const rows = parseCoverageTable(
      TABLE_HEADER +
        '| `docs/a.md` | yes | 1 | **yes** | 1.4 | 0 |\n' +
        '| `docs/bad.md` | yes | 1 | **yes** | 1.4 | 0 | extra |\n' +
        '| `docs/c.md` | yes | 1 | **yes** | 1.6 | 0 |\n'
    );
    assert.deepEqual(rows.map((r) => r.file), ['docs/a.md', 'docs/c.md']);
    assert.equal(rows.malformed.length, 1);
  });

  it('an escaped pipe inside a cell does not break the row', () => {
    const rows = parseCoverageTable(
      TABLE_HEADER + '| `docs/a.md` | yes | 1 | **yes** | 1.4 | run `x \\| wc -l` |\n'
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].file, 'docs/a.md');
  });

  it('In scope fails closed on anything that is not yes', () => {
    for (const v of ['partial', 'n/a', '']) {
      const r = run(`| \`docs/one.md\` | ${v} | 1 | **yes** | 1.4 | 0 |\n`);
      assert.equal(r.ok, false, `In scope: ${JSON.stringify(v)} must not pass`);
    }
  });

  it('an empty derivation is never a pass', () => {
    const dir = fixture();
    write(dir, 'note.md', TABLE_HEADER);
    track(dir);
    const r = audit({
      root: dir, tablePath: path.join(dir, 'note.md'),
      exclusions: new Map([['note.md', 'fixture']]), moduleInclusions: [],
    });
    assert.equal(r.ok, false, 'a zero-file derivation must refuse');
    assert.ok(r.findings.some((f) => /EMPTY/.test(f.reason)));
  });

  it('a missing table is reported as itself, not as every file lacking a row', () => {
    const dir = fixture();
    write(dir, 'docs/one.md', '# 1');
    track(dir);
    const r = audit({ root: dir, tablePath: path.join(dir, 'gone.md'), exclusions: EX, moduleInclusions: [] });
    assert.equal(r.ok, false);
    assert.ok(
      r.findings.some((f) => /table not found/i.test(f.reason)),
      'the missing table must be named as its own finding'
    );
    // The point of the fix: it must NOT blame the in-scope files for "having no row".
    assert.ok(
      !r.findings.some((f) => /no row in the coverage table/i.test(f.reason)),
      'a missing table must not be reported as every file lacking a row'
    );
  });
});

describe('coverage-denominator: the operator-facing report', () => {
  it('does not claim "no row" for a finding that is not about a row', () => {
    const out = format({
      ok: false, inScope: [],
      findings: [{ file: 'docs/x.md', story: null, reason: 'stale exclusion — entry names no tracked file' }],
    });
    assert.ok(!/no row in the coverage table/.test(out), 'stale-entry findings must not be labelled "no row"');
  });

  it('names the owning story when there is one', () => {
    const out = format({
      ok: false, inScope: [],
      findings: [{ file: 'docs/x.md', story: '1.6', reason: 'in scope and not examined' }],
    });
    assert.match(out, /owner: story 1\.6/);
  });
});
