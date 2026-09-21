'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { removeTempDirSync } = require('../helpers');

const {
  runReferenceIntegrityCheck,
  HISTORICAL_RECORD_PREFIXES,
} = require('../../scripts/audit/reference-integrity.js');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'audit', 'reference-integrity.js');

// This script shipped in May 2026 with no tests of its own and was never wired into CI, so
// nothing ever established that it could distinguish a broken reference from a working one.
// These tests were added alongside the historical-record exemption, because an exemption is
// the one change to a gate that can only make it quieter — it has to be shown to skip exactly
// what it claims and nothing else, in both directions.

// Every fixture is an isolated tmpdir per `test-fixture-isolation`; none of these tests reads
// the Convoke tree, so a reference added or removed in the repo cannot turn them red.
function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'refint-'));
  // findProjectRoot() (scripts/update/lib/utils.js) walks up from cwd looking for a `_bmad`
  // directory — not package.json. Without it the CLI exits 2 with "no project root found".
  fs.mkdirSync(path.join(dir, '_bmad'), { recursive: true });
  return dir;
}

function write(dir, rel, content) {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  return abs;
}

// A link that cannot resolve from the containing file's directory.
const BROKEN_LINK = '[see it](scripts/does-not-exist.js#L1)\n';

describe('reference-integrity: the check can fail, and can pass', () => {
  let dir;
  before(() => { dir = makeFixture(); });
  after(() => { removeTempDirSync(dir); });

  it('reports a link whose target does not exist', () => {
    write(dir, 'docs/a.md', BROKEN_LINK);
    const res = runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs'] });
    assert.equal(res.brokenRefs.length, 1);
    assert.match(res.brokenRefs[0].reason, /does not exist/);
    assert.equal(res.brokenRefs[0].source, path.join('docs', 'a.md'));
  });

  it('reports nothing once the same link resolves', () => {
    // Same file, same link text — only the target's existence changes. This is the pairing
    // that proves the finding above came from resolution and not from the file being scanned
    // at all: a check that reports a problem for every input is not a check.
    write(dir, 'docs/scripts/does-not-exist.js', '// now it exists\n');
    write(dir, 'docs/b.md', BROKEN_LINK);
    const res = runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs/b.md'] });
    assert.deepEqual(res.brokenRefs, []);
    assert.equal(res.totalRefs, 1, 'the reference was extracted, not merely skipped');
  });
});

describe('reference-integrity: the exempt list itself', () => {
  // Pinned by LITERAL membership, deliberately, and not derived from the export.
  //
  // Every other test in this file builds its fixtures by iterating
  // HISTORICAL_RECORD_PREFIXES, which makes them blind to a deletion: remove an entry and
  // the loop simply stops planting that file, so the suite stays green while the gate
  // silently starts checking — or stops checking — a whole directory. Mutation confirmed
  // it: dropping '_bmad-output/test-artifacts/' killed no test until this assertion existed.
  //
  // Widening the exemption is the dangerous direction, because it makes the gate quieter
  // with no failure anywhere. Adding a prefix must therefore be a deliberate edit here too.
  it('holds exactly the five declared prefixes', () => {
    assert.deepEqual([...HISTORICAL_RECORD_PREFIXES].sort(), [
      '_bmad-output/_archive/',
      '_bmad-output/implementation-artifacts/',
      '_bmad-output/planning-artifacts/archive/',
      '_bmad-output/test-artifacts/',
      '_bmad-output/vortex-artifacts/',
    ]);
  });

  it('is frozen against accidental mutation by a caller', () => {
    // It is exported, so any consumer holds a reference to the live array.
    assert.throws(() => { HISTORICAL_RECORD_PREFIXES.push('docs/'); }, TypeError);
  });
});

describe('reference-integrity: historical-record exemption', () => {
  let dir;
  before(() => {
    dir = makeFixture();
    // One broken link in each exempt prefix, plus one in a live directory.
    for (const prefix of HISTORICAL_RECORD_PREFIXES) {
      write(dir, path.join(prefix, 'record.md'), BROKEN_LINK);
    }
    write(dir, '_bmad-output/planning-artifacts/live.md', BROKEN_LINK);
  });
  after(() => { removeTempDirSync(dir); });

  it('skips every declared prefix and still reports the live file', () => {
    const res = runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['_bmad-output'] });
    assert.deepEqual(
      res.brokenRefs.map(b => b.source.split(path.sep).join('/')),
      ['_bmad-output/planning-artifacts/live.md'],
      'only the live document is reported'
    );
    assert.equal(res.exemptedCount, HISTORICAL_RECORD_PREFIXES.length);
  });

  it('exempts each prefix individually — no prefix is carried by a sibling', () => {
    // Asserting on the aggregate above would pass even if one prefix did nothing, because
    // another prefix's file would account for the count. Each is therefore checked alone.
    for (const prefix of HISTORICAL_RECORD_PREFIXES) {
      const res = runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: [prefix] });
      assert.deepEqual(res.brokenRefs, [], `${prefix} was not exempt`);
      assert.equal(res.exemptedCount, 1, `${prefix} did not report its skip`);
    }
  });

  it('scans the exempt files when exemptHistorical is false', () => {
    const res = runReferenceIntegrityCheck({
      projectRoot: dir,
      scopePaths: ['_bmad-output'],
      exemptHistorical: false,
    });
    assert.equal(res.exemptedCount, 0);
    assert.equal(
      res.brokenRefs.length,
      HISTORICAL_RECORD_PREFIXES.length + 1,
      'every planted link is reported when nothing is exempt'
    );
  });

  it('anchors the prefix at the repo root, so a nested lookalike is not exempt', () => {
    // `docs/_bmad-output/_archive/` merely contains an exempt prefix as a substring. If the
    // match were unanchored it would be silently skipped, which is how an exemption grows
    // past what it documents.
    const nested = makeFixture();
    try {
      write(nested, 'docs/_bmad-output/_archive/decoy.md', BROKEN_LINK);
      const res = runReferenceIntegrityCheck({ projectRoot: nested, scopePaths: ['docs'] });
      assert.equal(res.exemptedCount, 0);
      assert.equal(res.brokenRefs.length, 1, 'the nested lookalike is still checked');
    } finally {
      removeTempDirSync(nested);
    }
  });
});

describe('reference-integrity: the CLI states the exemption', () => {
  let dir;
  before(() => {
    dir = makeFixture();
    write(dir, '_bmad-output/implementation-artifacts/story.md', BROKEN_LINK);
  });
  after(() => { removeTempDirSync(dir); });

  function run(args) {
    try {
      const stdout = execFileSync(process.execPath, [SCRIPT, ...args], {
        cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { code: 0, out: stdout };
    } catch (err) {
      return { code: err.status, out: `${err.stdout || ''}${err.stderr || ''}` };
    }
  }

  it('passes and names the number it skipped', () => {
    const { code, out } = run(['--paths=_bmad-output']);
    assert.equal(code, 0);
    assert.match(out, /1 historical-record file\(s\) exempt/);
    assert.match(out, /--no-exempt/, 'the way to see them is printed with the count');
  });

  it('fails on the same tree with --no-exempt', () => {
    const { code, out } = run(['--paths=_bmad-output', '--no-exempt']);
    assert.equal(code, 1, 'the exempted file does contain a real broken reference');
    assert.match(out, /historical records included/);
  });

  it('rejects an unknown flag rather than ignoring it', () => {
    // `--no-exempt` was added to a loop that returns 2 on any unrecognised `--` arg. A typo
    // must not silently fall through to a default-exempt run that then passes.
    const { code } = run(['--no-exmept']);
    assert.equal(code, 2);
  });
});

// ─── Anchor fragments (2026-09-21) ────────────────────────────────────────────
//
// Until this change the fragment after `#` was sliced off and discarded, so `foo.md#anything`
// passed whenever `foo.md` existed. Adding the check found 23 real broken anchors in the
// repository, 20 of them one class: a link omitting the DOUBLE hyphen GitHub produces where
// dropped punctuation leaves two spaces.
//
// The first prototype collapsed runs of whitespace with `\s+` and reported a 12% false-positive
// rate on healthy links, which nearly got the whole check written off as unbuildable. The
// double-hyphen case below is that bug's executioner — it fails against a collapsing slugger and
// passes against the shipped one.
describe('reference-integrity: anchor fragments', () => {
  let dir;
  before(() => { dir = makeFixture(); });
  after(() => { removeTempDirSync(dir); });

  it('reports an anchor that matches no heading', () => {
    write(dir, 'docs/target.md', '# Real Heading\n');
    write(dir, 'docs/src.md', '[x](target.md#no-such-heading)\n');
    const res = runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs/src.md'] });
    assert.equal(res.brokenRefs.length, 1);
    assert.match(res.brokenRefs[0].reason, /anchor "#no-such-heading" matches no heading/);
  });

  it('accepts an anchor that matches a heading', () => {
    write(dir, 'docs/target2.md', '# Real Heading\n');
    write(dir, 'docs/src2.md', '[x](target2.md#real-heading)\n');
    assert.deepEqual(runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs/src2.md'] }).brokenRefs, []);
  });

  it('preserves a RUN of hyphens where dropped punctuation left a run of spaces', () => {
    // `### 2.3 Fast Lane (Quick Wins + Spikes)` -> `#23-fast-lane-quick-wins--spikes`. Five links
    // in this repository use that exact form, which is what makes it the correct behaviour rather
    // than a preference. A slugger that collapses whitespace turns this test red.
    write(dir, 'docs/runs.md', '### 2.3 Fast Lane (Quick Wins + Spikes)\n');
    write(dir, 'docs/src3.md', '[x](runs.md#23-fast-lane-quick-wins--spikes)\n');
    assert.deepEqual(runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs/src3.md'] }).brokenRefs, []);
  });

  it('does NOT try to resolve #L<line> blob anchors', () => {
    // 53 of these exist here. No slug algorithm resolves a GitHub line anchor, and a check that
    // tried would report the majority of its findings against links that are correct.
    write(dir, 'docs/target4.md', '# Heading\n');
    write(dir, 'docs/src4.md', '[a](target4.md#L75)\n[b](target4.md#L102-L127)\n');
    assert.deepEqual(runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs/src4.md'] }).brokenRefs, []);
  });

  it('disambiguates duplicate headings the way GitHub does', () => {
    write(dir, 'docs/dup.md', '# Notes\n\n# Notes\n');
    write(dir, 'docs/src5.md', '[first](dup.md#notes)\n[second](dup.md#notes-1)\n');
    assert.deepEqual(runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs/src5.md'] }).brokenRefs, []);
  });

  it('strips backticks and bold from headings before slugging', () => {
    write(dir, 'docs/fmt.md', '## The `config.yaml` **contract**\n');
    write(dir, 'docs/src6.md', '[x](fmt.md#the-configyaml-contract)\n');
    assert.deepEqual(runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs/src6.md'] }).brokenRefs, []);
  });

  it('leaves a non-markdown target alone — it has no headings to match', () => {
    write(dir, 'docs/thing.js', 'module.exports = 1;\n');
    write(dir, 'docs/src7.md', '[x](thing.js#whatever)\n');
    assert.deepEqual(runReferenceIntegrityCheck({ projectRoot: dir, scopePaths: ['docs/src7.md'] }).brokenRefs, []);
  });
});
