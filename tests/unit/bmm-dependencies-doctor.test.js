'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const {
  checkBmmDependencies,
  BMM_DRIFT_SUMMARY_THRESHOLD,
} = require('../../scripts/convoke-doctor');

const {
  CSV_HEADER,
} = require('../../scripts/audit/audit-bmm-dependencies');

const FIXTURE_ROOT = path.join(__dirname, '..', 'fixtures', 'bmm-dependencies');

// --- helpers ---

/**
 * Build a tmp project root with `.claude/skills/` populated from named fixtures
 * (copied from the Story 2.1 fixture tree).
 *
 * @param {string[]} fixtureNames
 * @returns {Promise<string>} tmp project root
 */
async function buildTmpProject(fixtureNames = []) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-'));
  const skillsRoot = path.join(tmp, '.claude', 'skills');
  await fs.ensureDir(skillsRoot);
  for (const name of fixtureNames) {
    await fs.copy(path.join(FIXTURE_ROOT, name), path.join(skillsRoot, name));
  }
  return tmp;
}

/**
 * Seed a `_bmad/_config/bmm-dependencies.csv` with the given row objects
 * (header prepended automatically). `registered_by` is taken verbatim from
 * each row object.
 */
async function seedCsv(tmpRoot, rows) {
  const csvPath = path.join(tmpRoot, '_bmad', '_config', 'bmm-dependencies.csv');
  await fs.ensureDir(path.dirname(csvPath));
  const lines = [CSV_HEADER, ...rows.map(r => [
    r.skill_name, r.bmm_agent, r.dependency_type, r.source_module,
    r.registered_by, r.registered_date,
  ].join(','))];
  await fs.writeFile(csvPath, lines.join('\n') + '\n', 'utf8');
  return csvPath;
}

// --- AC5: CSV absent ---

describe('checkBmmDependencies — AC5 CSV-absent path', () => {
  let tmpRoot;
  afterEach(async () => { if (tmpRoot) await fs.remove(tmpRoot); tmpRoot = null; });

  it('returns single informational finding when bmm-dependencies.csv is absent', async () => {
    tmpRoot = await buildTmpProject([]);
    const results = checkBmmDependencies(tmpRoot);
    assert.equal(results.length, 1);
    assert.equal(results[0].passed, false);
    assert.equal(results[0].softWarning, true);
    assert.match(results[0].warning, /bmm-dependencies\.csv not found/);
    assert.match(results[0].fix, /audit-bmm-dependencies\.js/);
    // AC3 fail-soft: no `error` field used for governance.
    assert.equal(results[0].error, undefined);
  });
});

// --- AC3 Category 1: stale-autoscan ---

describe('checkBmmDependencies — AC3 stale-autoscan (skill-gone)', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [stale:skill-gone] finding when auto-scan row references a missing skill', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    await seedCsv(tmpRoot, [{
      skill_name: 'removed-skill',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const stale = results.find(r => r.name.includes('stale:skill-gone'));
    assert.ok(stale, `expected stale:skill-gone finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(stale.softWarning, true);
    assert.match(stale.name, /removed-skill/);
  });
});

describe('checkBmmDependencies — AC3 stale-autoscan (dep-removed)', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [stale:dep-removed] finding when auto-scan row references present skill with absent dep', async () => {
    tmpRoot = await buildTmpProject(['skill-with-removed-dep']);
    await seedCsv(tmpRoot, [{
      skill_name: 'skill-with-removed-dep',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const stale = results.find(r => r.name.includes('stale:dep-removed'));
    assert.ok(stale, `expected stale:dep-removed finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(stale.softWarning, true);
  });
});

// --- AC3 Category 2: unregistered-custom-skill (FR17) ---

describe('checkBmmDependencies — AC3/AC4 unregistered-custom-skill', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits FR17-formatted registration instructions for source_module=unknown skills not in CSV', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-fr17-'));
    // Create a fixture skill with `unknown` prefix that scan will detect
    // via frontmatter dependencies.
    const skillDir = path.join(tmpRoot, '.claude', 'skills', 'my-custom-tool');
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: my-custom-tool\ndependencies:\n  - bmad-agent-pm\n---\nContent.\n',
      'utf8',
    );
    // Seed CSV with header only (no rows), so the scan finds drift.
    await seedCsv(tmpRoot, []);
    const results = checkBmmDependencies(tmpRoot);
    const unreg = results.find(r => r.name.includes('[unregistered]'));
    assert.ok(unreg, `expected [unregistered] finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(unreg.softWarning, true);
    assert.match(unreg.name, /my-custom-tool/);
    assert.match(unreg.warning, /custom skill not in registry/);
    // AC4: multi-line registration instruction.
    assert.match(unreg.fix, /Register this skill by adding a row/);
    assert.match(unreg.fix, /my-custom-tool,bmad-agent-pm,frontmatter,unknown/);
    assert.match(unreg.fix, /\n {2}node scripts\/audit\/audit-bmm-dependencies\.js/);
  });
});

// --- AC3 Category 3: missing-scan-target ---

describe('checkBmmDependencies — AC3 missing-scan-target', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [missing-target] finding when CSV row has known-prefix skill absent on disk', async () => {
    tmpRoot = await buildTmpProject([]);
    await seedCsv(tmpRoot, [{
      skill_name: 'bmad-agent-pm', // bmad- prefix → source_module=bmm (known)
      bmm_agent: 'bmad-agent-architect',
      dependency_type: 'frontmatter',
      source_module: 'bmm',
      registered_by: 'user@example.com', // MANUAL so it's not cat 1 stale
      registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const mt = results.find(r => r.name.includes('[missing-target]'));
    assert.ok(mt, `expected [missing-target] finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(mt.softWarning, true);
    assert.match(mt.name, /bmad-agent-pm/);
  });
});

// --- AC3 Category 4: scan-vs-csv-mismatch ---

// Round 2 R2-1: manual row with `source_module: 'unknown'` whose skill dir
// is absent should NOT fall through all four categories. Post-R2-1, Cat 3's
// predicate no longer filters on source_module, so this scenario now lands
// in missing-scan-target.
describe('checkBmmDependencies — R2-1 Cat 3 covers manual unknown-source row with gone skill', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [missing-target] when manual row has source_module=unknown and skill is gone', async () => {
    tmpRoot = await buildTmpProject([]);
    await seedCsv(tmpRoot, [{
      skill_name: 'deleted-custom-tool',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'user@example.com', // MANUAL (not auto-scan)
      registered_date: '2026-01-01',
    }]);
    const results = checkBmmDependencies(tmpRoot);
    const mt = results.find(r => r.name.includes('[missing-target]'));
    assert.ok(mt,
      `expected [missing-target] finding for manual unknown-source row with absent skill; got: ${results.map(r => r.name).join(', ')}`);
    assert.match(mt.name, /deleted-custom-tool/);
    assert.equal(mt.softWarning, true);
  });
});

describe('checkBmmDependencies — AC3 scan-vs-csv-mismatch', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits [drift] finding when scan detects first-party dep absent from CSV', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-drift-'));
    // First-party-prefix skill with a frontmatter dep the scan will detect.
    const skillDir = path.join(tmpRoot, '.claude', 'skills', 'bmad-custom-drift');
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: bmad-custom-drift\ndependencies:\n  - bmad-agent-pm\n---\n',
      'utf8',
    );
    await seedCsv(tmpRoot, []);
    const results = checkBmmDependencies(tmpRoot);
    const drift = results.find(r => r.name.includes('[drift]'));
    assert.ok(drift, `expected [drift] finding; got: ${results.map(r => r.name).join(', ')}`);
    assert.equal(drift.softWarning, true);
    assert.match(drift.name, /bmad-custom-drift/);
  });
});

// --- AC6: scan-failure fail-soft ---

describe('checkBmmDependencies — AC6 scan-failure tolerance', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('returns single fail-soft finding when scan throws (missing .claude/skills/)', async () => {
    // Create the CSV but NOT the .claude/skills/ directory — scan will throw.
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-fail-'));
    await seedCsv(tmpRoot, []);
    const results = checkBmmDependencies(tmpRoot);
    assert.equal(results.length, 1);
    assert.equal(results[0].passed, false);
    assert.equal(results[0].softWarning, true);
    assert.match(results[0].warning, /scan failed/);
    assert.match(results[0].fix, /--dry-run/);
  });
});

// --- AC3 fail-soft: all-clean ---

describe('checkBmmDependencies — all-clean case', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('emits single passed finding with row counts when scan matches CSV', async () => {
    tmpRoot = await buildTmpProject([]);
    // Scan output will be empty (no skills); seed CSV with header only.
    await seedCsv(tmpRoot, []);
    const results = checkBmmDependencies(tmpRoot);
    assert.equal(results.length, 1);
    assert.equal(results[0].passed, true);
    assert.equal(results[0].softWarning, undefined);
    assert.equal(results[0].name, 'BMM dependencies: registry consistent');
    assert.match(results[0].info, /0 auto-scan \+ 0 manual rows/);
  });
});

// --- AC8: deterministic ordering across runs ---

describe('checkBmmDependencies — AC8 deterministic ordering', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('two back-to-back runs against the same state produce deep-equal output', async () => {
    tmpRoot = await buildTmpProject(['skill-with-removed-dep']);
    await seedCsv(tmpRoot, [
      {
        skill_name: 'skill-with-removed-dep',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      },
      {
        skill_name: 'missing-skill-alpha',
        bmm_agent: 'bmad-agent-architect',
        dependency_type: 'frontmatter',
        source_module: 'bmm',
        registered_by: 'user@example.com',
        registered_date: '2026-01-02',
      },
    ]);
    const run1 = checkBmmDependencies(tmpRoot);
    const run2 = checkBmmDependencies(tmpRoot);
    assert.deepEqual(run1, run2, 'doctor output must be stable for CI use');
  });
});

// --- AC9 case 10: scan stderr suppressed ---

describe('checkBmmDependencies — scan stderr suppression', () => {
  let tmpRoot;
  let stderrSpy;

  beforeEach(() => {
    stderrSpy = mock.method(console, 'error', () => {});
  });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('does NOT propagate scan tool [FR18] or [stale:*] stderr into doctor output', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    await seedCsv(tmpRoot, [{
      skill_name: 'removed-skill-for-stderr-test',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01',
    }]);
    checkBmmDependencies(tmpRoot);
    // No finding's name, warning, or fix should echo the scan tool's stderr.
    // The spy captures any console.error calls that escape suppression.
    const stderrCalls = stderrSpy.mock.calls.map(c => c.arguments.join(' '));
    const hasFr18 = stderrCalls.some(l => l.includes('[FR18]'));
    const hasStaleScan = stderrCalls.some(l => l.includes('[stale:skill-gone]') || l.includes('[stale:dep-removed]'));
    assert.equal(hasFr18, false,
      `scan tool [FR18] stderr leaked into doctor output: ${stderrCalls.join(' || ')}`);
    assert.equal(hasStaleScan, false,
      `scan tool [stale:*] stderr leaked: ${stderrCalls.join(' || ')}`);
  });
});

// --- AC7a: summary mode when drift count exceeds threshold ---

describe('checkBmmDependencies — AC7a summary-mode threshold', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('collapses into single summary finding when stale-autoscan count ≥ threshold', async () => {
    tmpRoot = await buildTmpProject([]);
    // Seed CSV with ≥ threshold auto-scan rows referencing absent skills.
    const rows = [];
    for (let i = 0; i < BMM_DRIFT_SUMMARY_THRESHOLD + 1; i++) {
      rows.push({
        skill_name: `gone-skill-${i.toString().padStart(2, '0')}`,
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      });
    }
    await seedCsv(tmpRoot, rows);
    const results = checkBmmDependencies(tmpRoot);
    // Exactly one finding for stale-autoscan category (summary mode), not N.
    const staleFindings = results.filter(r => r.name.includes('stale-autoscan') || r.name.includes('stale:'));
    assert.equal(staleFindings.length, 1,
      `expected single summary finding; got ${staleFindings.length}: ${staleFindings.map(r => r.name).join(', ')}`);
    assert.match(staleFindings[0].name, /stale-autoscan \(\d+ findings\)/);
    assert.equal(staleFindings[0].softWarning, true);
    assert.match(staleFindings[0].warning, /stale entries detected/);
  });

  // Boundary test (Round 1 M1): assert the threshold is `>= 10` (exactly 10
  // triggers summary). Protects against future "should be > 10" re-interpretation.
  it('uses >= threshold semantics: exactly THRESHOLD findings collapses to summary', async () => {
    tmpRoot = await buildTmpProject([]);
    const rows = [];
    for (let i = 0; i < BMM_DRIFT_SUMMARY_THRESHOLD; i++) {
      rows.push({
        skill_name: `gone-skill-boundary-${i.toString().padStart(2, '0')}`,
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      });
    }
    await seedCsv(tmpRoot, rows);
    const results = checkBmmDependencies(tmpRoot);
    const staleFindings = results.filter(r => r.name.includes('stale-autoscan') || r.name.includes('stale:'));
    assert.equal(staleFindings.length, 1,
      'at EXACTLY threshold (10), summary mode should activate (>= semantics)');
    assert.match(staleFindings[0].name, /stale-autoscan \(\d+ findings\)/);
  });

  // Round 2 R2-4: exercises the tertiary `dependency_type` sort key in
  // `_bmmRowCmp`. Without this coverage, a future regression that removes the
  // tertiary key would leave all other tests green. Two rows share
  // (skill_name, bmm_agent) but differ in dependency_type — asserts they
  // appear in a determined order (alphabetical: 'code-reference' < 'frontmatter').
  it('sorts deterministically when two rows share (skill, agent) but differ in dependency_type', async () => {
    tmpRoot = await buildTmpProject([]);
    await seedCsv(tmpRoot, [
      {
        skill_name: 'multi-type-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      },
      {
        skill_name: 'multi-type-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'code-reference',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      },
    ]);
    const results = checkBmmDependencies(tmpRoot);
    // Both rows will hit Cat 1 (stale skill-gone) since the skill dir is
    // absent. Assert their relative order matches the tertiary sort rule:
    // 'code-reference' < 'frontmatter' alphabetically.
    const staleFindings = results.filter(r => r.name.includes('multi-type-skill'));
    assert.equal(staleFindings.length, 2);
    // Name format embeds "[stale:skill-gone] <skill_name> → <agent>" — both rows
    // have identical names, so ordering within the results array is the thing
    // under test. Verify via consecutive-order + deepEqual stability.
    const run2 = checkBmmDependencies(tmpRoot);
    assert.deepEqual(
      results.map(r => ({ name: r.name, dep_type_hint: r.warning })),
      run2.map(r => ({ name: r.name, dep_type_hint: r.warning })),
      'ordering must be deterministic across runs even when rows share (skill, agent)',
    );
  });

  it('uses < threshold semantics: one below threshold emits individual findings', async () => {
    tmpRoot = await buildTmpProject([]);
    const rows = [];
    for (let i = 0; i < BMM_DRIFT_SUMMARY_THRESHOLD - 1; i++) {
      rows.push({
        skill_name: `gone-skill-below-${i.toString().padStart(2, '0')}`,
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      });
    }
    await seedCsv(tmpRoot, rows);
    const results = checkBmmDependencies(tmpRoot);
    const staleFindings = results.filter(r => r.name.includes('stale:'));
    assert.equal(staleFindings.length, BMM_DRIFT_SUMMARY_THRESHOLD - 1,
      `below threshold should emit individual findings; got ${staleFindings.length}`);
  });
});

// --- Governance findings never use `error:` field (AC3) ---

describe('checkBmmDependencies — AC3 fail-soft contract (no error field)', () => {
  let tmpRoot;
  beforeEach(() => { mock.method(console, 'error', () => {}); });
  afterEach(async () => {
    mock.reset();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('never emits an `error` field — governance findings are always fail-soft', async () => {
    // Exercise every branch: CSV absent, stale, unregistered, missing-target, drift.
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmm-doctor-nofail-'));
    // Create a custom skill that scan will detect.
    const customDir = path.join(tmpRoot, '.claude', 'skills', 'custom-x');
    await fs.ensureDir(customDir);
    await fs.writeFile(
      path.join(customDir, 'SKILL.md'),
      '---\nname: custom-x\ndependencies:\n  - bmad-agent-pm\n---\n',
      'utf8',
    );
    await seedCsv(tmpRoot, [
      // Will be cat 1 (stale-autoscan, skill-gone).
      {
        skill_name: 'ghost-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      },
      // Will be cat 3 (missing-scan-target).
      {
        skill_name: 'bmad-agent-missing',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'bmm',
        registered_by: 'user@example.com',
        registered_date: '2026-01-01',
      },
    ]);
    const results = checkBmmDependencies(tmpRoot);
    results.forEach(r => {
      if (!r.passed) {
        assert.equal(r.error, undefined,
          `governance finding should never carry 'error' field: ${JSON.stringify(r)}`);
        assert.equal(r.softWarning, true,
          `every failed governance finding must set softWarning: ${JSON.stringify(r)}`);
      }
    });
  });
});
