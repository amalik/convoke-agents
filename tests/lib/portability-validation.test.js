'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');
const { writeManifest } = require('../../scripts/portability/manifest-csv');

const { FIXTURE_ROOT, REPO_ROOT } = require('./portability-fixture');
const { manifestRowSeeds } = require('../../scripts/update/lib/refresh-installation');
const {
  validate,
  renderReport,
  HARD_FINDING_TYPES,
} = require('../../scripts/portability/validate-classification');

// Story sp-1-3: Validate Classification Completeness
//
// Tests use synthetic manifest fixtures in tmpdirs to isolate validator
// behavior from the real skill-manifest.csv. The smoke test (Test 1) uses
// the real manifest to ensure sp-1-2's output stays clean.

const HEADER = [
  'canonicalId',
  'name',
  'description',
  'module',
  'path',
  'install_to_bmad',
  'tier',
  'intent',
  'dependencies',
];

/**
 * Build a synthetic skill row with sane defaults.
 * Override any field via the `overrides` arg.
 */
function makeRow(overrides = {}) {
  const defaults = {
    canonicalId: 'bmad-test-skill',
    name: 'bmad-test-skill',
    description: 'Test skill for validator unit tests',
    module: 'core',
    path: '_bmad/core/bmad-test-skill/SKILL.md',
    install_to_bmad: 'true',
    tier: 'standalone',
    intent: 'think-through-problem',
    dependencies: '',
  };
  const merged = { ...defaults, ...overrides };
  return HEADER.map((col) => merged[col]);
}

/**
 * Create a tmp project root with a minimal _bmad/_config/ tree and write
 * a manifest containing the supplied rows. Returns the project root.
 */
function setupFixture(rows) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-1-3-validator-'));
  const configDir = path.join(tmpRoot, '_bmad', '_config');
  fs.mkdirSync(configDir, { recursive: true });
  const manifestPath = path.join(configDir, 'skill-manifest.csv');
  writeManifest(manifestPath, HEADER, rows);
  return tmpRoot;
}

function hasFindingType(findings, type) {
  return findings.some((f) => f.type === type);
}

// NOT skipped at suite level: only Test 1 reads the real project root. Tests 2-9 build
// synthetic manifests in isolated tmpdirs via setupFixture — already fixture-isolated,
// and disabling them lost validator coverage ([MISSING]/[INVALID]/[BROKEN-DEP] finding
// types) for a precondition they do not depend on. Code review 2026-08-10.
describe('Portability validator (sp-1-3)', () => {
  // P1 (sp-1-3 review): track every tmpdir setupFixture creates and remove
  // them in afterEach to prevent dev/CI machine pollution.
  const createdTmpDirs = [];
  const trackingSetupFixture = setupFixture;

  afterEach(() => {
    while (createdTmpDirs.length > 0) {
      const dir = createdTmpDirs.pop();
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (_e) {
        // Best-effort cleanup; don't fail tests on filesystem races
      }
    }
  });

  // Wrap setupFixture to record dirs for cleanup
  const setup = (rows) => {
    const dir = trackingSetupFixture(rows);
    createdTmpDirs.push(dir);
    return dir;
  };

  // Backlog I123. This was the one test here that read the real repo, and it sat SKIPPED behind
  // the vendored-content guard for ~6 weeks — during which nothing checked the validator OR the
  // manifest. Un-skipping it as written fails immediately: the real manifest has 4 genuine broken
  // dependencies. Splitting it keeps both signals instead of trading one for the other.

  it('Test 1a: validator runs clean on a complete, self-consistent manifest (fixture)', () => {
    // Exercises the VALIDATOR against a dependency-closed corpus. If this fails, the validator
    // is broken — not the repo.
    const { totalSkills, findings } = validate(FIXTURE_ROOT);
    const errors = findings.filter((f) => HARD_FINDING_TYPES.has(f.type));
    assert.ok(totalSkills > 0, 'fixture manifest is empty — the assertion below would be vacuous');
    assert.deepEqual(errors, [], `fixture should have no hard findings; got ${JSON.stringify(errors)}`);
  });

  it('Test 1b: the SEEDING manifest has no hard findings beyond the acknowledged baseline', () => {
    // Ratchet, same shape as .github/expected-python-tests.txt and expected-wrapper-template.txt.
    // A NEW broken dependency fails here. FIXING one also fails here, until its line is removed
    // from the baseline — so the acknowledged list can only ever shrink.
    // dist-2-8: validate the set that SEEDS, not the 106-row candidate list.
    //
    // WHY. `refresh-installation.js` documents the shipped manifest as a CANDIDATE list and seeds a
    // set filtered by path existence, printing `Created skill-manifest.csv (N/106 skills present)`.
    // Validating all 106 asked a question no operator's tree answers: 75 rows point at upstream
    // BMAD content that this repo deleted in `a16fa340`, so they can never resolve in CI, and the
    // findings they produced were accurate but unrepairable.
    //
    // ⚠ THE TRAP, AND IT HAS CAUGHT FOUR ATTEMPTS. The fix that suggests itself — repoint those
    // `path` cells at `.claude/skills/<id>/SKILL.md`, where the content genuinely is — was made on
    // 2026-08-10 in `4ed770a0` and reverted within the hour in `8f2fbda0`, because
    // `.claude/skills/` is gitignored (`.gitignore:62`): it passes on a developer machine with
    // BMAD installed and hollows out in a clean checkout. **It produces a false green.** The
    // closed row at `convoke-note-backlog-completed-archive.md:355` is kept expressly as this
    // warning; read it before touching any `path` cell. This story edits none.
    //
    // THE PREDICATE IS THE INSTALLER'S OWN, imported rather than reimplemented. A second copy
    // would let the test and the installer drift into disagreeing about what ships — a ratchet
    // confident about the wrong tree, which is worse than no ratchet.
    //
    // WHAT THIS GIVES UP, stated rather than discovered later: a genuinely broken dependency on a
    // NON-SEEDING upstream row is no longer caught here. That coverage was already unreachable —
    // CI cannot see gitignored content — and every finding it produced was unrepairable. Test 1a's
    // fixture is where upstream-shaped rows get real coverage; extend the fixture to add it back.
    //
    // A SECOND, DISTINCT GAP, named because Round 1 found the sentence above implies it without
    // saying it: nothing here checks whether a SEEDING row's bare-name dependency points at a row
    // that also seeds. Two do today — `bmad-help` -> `bmad-quick-dev` and `bmad-migrate-artifacts`
    // -> `bmad-create-epics-and-stories`, both `bmm` rows the installer never seeds by design.
    // `[ORPHAN-DEP]` cannot cover it (it is a typo check against the manifest's vocabulary, and
    // both targets are correctly-spelled real rows) and `[BROKEN-DEP]` cannot either (it checks
    // path-shaped deps). Closing it needs a NEW finding type, not a redefinition of an existing
    // one — filed rather than improvised here. This gap predates this story: the vocabulary was
    // already derived from all rows before the filter existed.
    const { totalSkills, findings } = validate(REPO_ROOT, {
      rowFilter: (row, header) => manifestRowSeeds(row[header.indexOf('path')], REPO_ROOT),
    });

    // NON-VACUITY FLOOR, not merely non-zero. Filtering is precisely the operation that can reduce
    // the validated set to nothing, and this repository has shipped checks that reported success
    // while doing no work. Measured 2026-09-07: **31 of 106 rows seed — `core` 11, `bmm` 1,
    // `bme` 19**, grouped by the manifest's own `module` column.
    //
    // (An earlier draft of this comment said `core` 12 / `bme` 19 and asserted the story's figure
    // was wrong. It was not. That grouping came from the path's second segment, a different basis:
    // `bmad-create-prd` has `path` under `_bmad/core/` but `module` `bmm`. Correcting a right
    // number with a wrong one, by silently changing the basis, is `verification-basis` failing in
    // the direction that looks like diligence. Round 1 caught it.)
    //
    // The floor is deliberately below the measurement so ordinary churn does not trip it, but it
    // is NOT derived from a structural minimum — a legitimate consolidation of several `bme`
    // skills could trip it and force a bump alongside an unrelated refactor. Known trade.
    assert.ok(totalSkills > 0, 'seeding manifest is empty — cannot evaluate');
    assert.ok(
      totalSkills >= 25,
      `seeding set collapsed to ${totalSkills} rows (expected ~31) — the filter is too aggressive ` +
        `or the tree changed shape; a small set here would pass vacuously`
    );

    const actual = findings
      .filter((f) => HARD_FINDING_TYPES.has(f.type))
      .map((f) => `${f.type} ${f.skill}`)
      .sort();
    // The file's own header says "a missing baseline is a removed gate". Nothing enforced that —
    // a deleted file produced a raw ENOENT stack rather than the diagnostic the header promises.
    // Now it does. Lines are trimmed before use: the file is comment-only today, so a stray
    // leading space before a `#` would otherwise become a phantom expected finding, and trailing
    // whitespace on a real line would make it read as both appeared AND resolved. (Round 1.)
    const baselinePath = path.join(REPO_ROOT, '.github', 'expected-classification-findings.txt');
    assert.ok(
      fs.existsSync(baselinePath),
      'baseline file is missing — that is a REMOVED GATE, not an empty baseline. Restore it; an ' +
        'empty file is the goal state and is what this check expects.'
    );
    const expected = fs
      .readFileSync(baselinePath, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .sort();

    const appeared = actual.filter((a) => !expected.includes(a));
    const resolved = expected.filter((e) => !actual.includes(e));
    assert.deepEqual(
      appeared,
      [],
      `NEW hard classification finding(s) — a skill dependency broke:\n  ${appeared.join('\n  ')}`
    );
    assert.deepEqual(
      resolved,
      [],
      `Finding(s) fixed — delete them from .github/expected-classification-findings.txt in the ` +
        `same commit:\n  ${resolved.join('\n  ')}`
    );
  });

  it('Test 2: missing tier triggers [MISSING]', () => {
    const tmpRoot = setup([
      makeRow({ name: 'bmad-broken', tier: '' }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[MISSING]'), true);
    const missing = findings.find((f) => f.type === '[MISSING]');
    assert.equal(missing.skill, 'bmad-broken');
    assert.match(missing.detail, /tier/);
  });

  it('Test 3: invalid tier value triggers [INVALID]', () => {
    const tmpRoot = setup([
      makeRow({ name: 'bmad-bogus-tier', tier: 'bogus' }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[INVALID]'), true);
    const invalid = findings.find((f) => f.type === '[INVALID]');
    assert.equal(invalid.skill, 'bmad-bogus-tier');
    assert.ok(invalid.detail.includes('bogus'));
  });

  it('Test 4: nonexistent _bmad/ dependency triggers [BROKEN-DEP]', () => {
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-broken-dep',
        dependencies: '_bmad/nonexistent/path/to/file.md',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[BROKEN-DEP]'), true);
    const broken = findings.find((f) => f.type === '[BROKEN-DEP]');
    assert.equal(broken.skill, 'bmad-broken-dep');
    assert.ok(broken.detail.includes('_bmad/nonexistent/path/to/file.md'));
  });

  it('Test 5: orphan skill-name dependency triggers [ORPHAN-DEP]', () => {
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-source-skill',
        dependencies: 'bmad-fake-skill-that-does-not-exist',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[ORPHAN-DEP]'), true);
    const orphan = findings.find((f) => f.type === '[ORPHAN-DEP]');
    assert.equal(orphan.skill, 'bmad-source-skill');
    assert.ok(orphan.detail.includes('bmad-fake-skill-that-does-not-exist'));
  });

  it('Test 6: malformed config: dependency triggers [BAD-CONFIG-DEP]', () => {
    // Use an uppercase character which violates [a-z_][a-z0-9_]*
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-bad-config',
        dependencies: 'config:BadKey',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[BAD-CONFIG-DEP]'), true);
    const bad = findings.find((f) => f.type === '[BAD-CONFIG-DEP]');
    assert.equal(bad.skill, 'bmad-bad-config');
  });

  it('Test 7: pipeline skill with empty deps triggers [MISSING-PREREQS] warning (not error)', () => {
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-pipeline-skill',
        tier: 'pipeline',
        intent: 'plan-your-work',
        dependencies: '',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[MISSING-PREREQS]'), true);
    // It must NOT also trigger a hard error
    const errors = findings.filter((f) => HARD_FINDING_TYPES.has(f.type));
    assert.deepEqual(errors, []);
  });

  it('Test 8: meta-platform pipeline skill is exempt from [MISSING-PREREQS]', () => {
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-meta',
        tier: 'pipeline',
        intent: 'meta-platform',
        dependencies: '',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[MISSING-PREREQS]'), false);
  });

  it('Test 9: validator does not modify the manifest', () => {
    const tmpRoot = setup([
      makeRow({ name: 'bmad-readonly-test' }),
    ]);
    const manifestPath = path.join(tmpRoot, '_bmad', '_config', 'skill-manifest.csv');
    const before = fs.readFileSync(manifestPath, 'utf8');
    validate(tmpRoot);
    const after = fs.readFileSync(manifestPath, 'utf8');
    assert.equal(after, before);
  });
});

// --- Report rendering: table-cell escaping ---
//
// CodeQL js/incomplete-sanitization, issue #7. The escaper used to replace `|`
// without first escaping `\`, so any backslash already in the text doubled into
// a literal backslash and handed the pipe back to the table parser.

describe('renderReport — markdown table-cell escaping', () => {
  /** Extract the data rows of the first finding table (skip header + separator). */
  function findingRows(report) {
    return report
      .split('\n')
      .filter((l) => l.startsWith('| `bmad-'));
  }

  it('escapes a bare pipe so the row keeps its three columns', () => {
    const report = renderReport('2026-08-15', 1, 'FAIL', [
      { type: '[INVALID]', skill: 'bmad-x', detail: 'tier is a|b', recommendation: 'fix it' },
    ]);
    const [row] = findingRows(report);
    assert.ok(row, 'no finding row rendered');
    assert.ok(row.includes('a\\|b'), `pipe not escaped in ${JSON.stringify(row)}`);
    // 3 columns => 4 unescaped delimiters.
    assert.equal(row.replace(/\\\\/g, '').replace(/\\\|/g, '').split('|').length - 1, 4);
  });

  it('escapes a backslash before the pipe it precedes', () => {
    const report = renderReport('2026-08-15', 1, 'FAIL', [
      { type: '[INVALID]', skill: 'bmad-x', detail: 'path a\\|b', recommendation: 'fix it' },
    ]);
    const [row] = findingRows(report);
    assert.ok(row, 'no finding row rendered');
    assert.ok(row.includes('a\\\\\\|b'), `backslash not escaped in ${JSON.stringify(row)}`);
    assert.equal(row.replace(/\\\\/g, '').replace(/\\\|/g, '').split('|').length - 1, 4);
  });

  // R1 regression: the skill column is wrapped in backticks, and markdown does
  // not process backslash escapes inside a code span. Doubling the backslash
  // there rendered `a\b` as `a\\b` — worse than before the escaper was touched.
  it('does not double backslashes in the backticked skill column', () => {
    const report = renderReport('2026-08-15', 1, 'FAIL', [
      { type: '[INVALID]', skill: 'bmad-a\\b', detail: 'd', recommendation: 'r' },
    ]);
    const [row] = findingRows(report);
    assert.ok(row.includes('`bmad-a\\b`'), `code span mangled in ${JSON.stringify(row)}`);
    assert.ok(!row.includes('`bmad-a\\\\b`'), `backslash doubled in ${JSON.stringify(row)}`);
  });

  it('still escapes pipes inside the backticked skill column', () => {
    const report = renderReport('2026-08-15', 1, 'FAIL', [
      { type: '[INVALID]', skill: 'bmad-a|b', detail: 'd', recommendation: 'r' },
    ]);
    const [row] = findingRows(report);
    assert.ok(row.includes('`bmad-a\\|b`'), `pipe not escaped in ${JSON.stringify(row)}`);
    assert.equal(row.replace(/\\\\/g, '').replace(/\\\|/g, '').split('|').length - 1, 4);
  });

  it('flattens newlines so a cell cannot break the table', () => {
    const report = renderReport('2026-08-15', 1, 'FAIL', [
      { type: '[INVALID]', skill: 'bmad-x', detail: 'line1\nline2', recommendation: 'fix it' },
    ]);
    assert.equal(findingRows(report).length, 1);
    assert.ok(findingRows(report)[0].includes('line1 line2'));
  });

  // R1: CommonMark treats a bare CR as a line ending, so it splits the row
  // mid-cell exactly as `\n` would. Both columns and both escapers.
  it('flattens carriage returns in every column', () => {
    for (const [detail, label] of [['a\rb', 'CR'], ['a\r\nb', 'CRLF']]) {
      const report = renderReport('2026-08-15', 1, 'FAIL', [
        { type: '[INVALID]', skill: `bmad-x\ry`, detail, recommendation: 'r' },
      ]);
      const rows = findingRows(report);
      assert.equal(rows.length, 1, `${label}: row split into ${rows.length}`);
      assert.ok(!rows[0].includes('\r'), `${label}: raw CR survived in ${JSON.stringify(rows[0])}`);
    }
  });
});
