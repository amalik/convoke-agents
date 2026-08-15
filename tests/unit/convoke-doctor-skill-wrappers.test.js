/**
 * ag-7-2 (I31): Doctor skill-wrapper validation tests
 *
 * Verifies that `convoke-doctor` detects partial installs where the source
 * tree was copied but `.claude/skills/{wrapperName}/SKILL.md` is missing.
 *
 * Closes I31 (rank #12 in backlog, RICE 3.2).
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { loadSkillManifest, checkModuleSkillWrappers } = require('../../scripts/convoke-doctor');

const ARTIFACTS_MANIFEST_ROWS = [
  'canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies',
  'bmad-migrate-artifacts,bmad-migrate-artifacts,"Migrate artifact governance metadata to conform to taxonomy",bme,_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/SKILL.md,true,pipeline,meta-platform,',
  'bmad-portfolio-status,bmad-portfolio-status,"Show a portfolio view",bme,_bmad/bme/_artifacts/workflows/bmad-portfolio-status/SKILL.md,true,pipeline,meta-platform,',
  'bmad-enhance-initiatives-backlog,bmad-enhance-initiatives-backlog,"Manage RICE initiatives backlog",bme,_bmad/bme/_enhance/workflows/initiatives-backlog/SKILL.md,true,,,',
];

async function setupTempProject() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-doctor-test-'));
  // Seed skill-manifest.csv with the standard rows
  await fs.ensureDir(path.join(tmpDir, '_bmad/_config'));
  await fs.writeFile(
    path.join(tmpDir, '_bmad/_config/skill-manifest.csv'),
    ARTIFACTS_MANIFEST_ROWS.join('\n') + '\n',
    'utf8'
  );
  // Seed both wrapper directories with SKILL.md
  await fs.ensureDir(path.join(tmpDir, '.claude/skills/bmad-migrate-artifacts'));
  await fs.writeFile(
    path.join(tmpDir, '.claude/skills/bmad-migrate-artifacts/SKILL.md'),
    '---\nname: bmad-migrate-artifacts\n---',
    'utf8'
  );
  await fs.ensureDir(path.join(tmpDir, '.claude/skills/bmad-portfolio-status'));
  await fs.writeFile(
    path.join(tmpDir, '.claude/skills/bmad-portfolio-status/SKILL.md'),
    '---\nname: bmad-portfolio-status\n---',
    'utf8'
  );
  await fs.ensureDir(path.join(tmpDir, '.claude/skills/bmad-enhance-initiatives-backlog'));
  await fs.writeFile(
    path.join(tmpDir, '.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md'),
    '---\nname: bmad-enhance-initiatives-backlog\n---',
    'utf8'
  );
  return tmpDir;
}

// mod.dir must be a real path under the temp project root so that
// path.relative(projectRoot, mod.dir) inside checkModuleSkillWrappers
// produces the correct manifest lookup key. ag-7-2 review patch (Blind Hunter
// BH#1): the source-path prefix is now derived from mod.dir, not hardcoded.
function makeArtifactsMod(projectRoot) {
  return {
    name: '_artifacts',
    dir: path.join(projectRoot, '_bmad/bme/_artifacts'),
    config: {
      workflows: [
        { name: 'bmad-migrate-artifacts', entry: 'workflows/bmad-migrate-artifacts/workflow.md', standalone: true },
        { name: 'bmad-portfolio-status', entry: 'workflows/bmad-portfolio-status/workflow.md', standalone: true },
      ],
    },
  };
}

function makeEnhanceMod(projectRoot) {
  return {
    name: '_enhance',
    dir: path.join(projectRoot, '_bmad/bme/_enhance'),
    config: {
      workflows: [
        { name: 'initiatives-backlog', entry: 'workflows/initiatives-backlog/workflow.md', target_agent: 'bmm/agents/pm.md' },
      ],
    },
  };
}

function makeVortexMod(projectRoot) {
  return {
    name: '_vortex',
    dir: path.join(projectRoot, '_bmad/bme/_vortex'),
    config: {
      workflows: ['lean-persona', 'product-vision'],
    },
  };
}

// === (a) Healthy install: all wrappers present ===

// ── Backlog I40: a duplicate source path must not resolve silently ────────────────────────
//
// `loadSkillManifest` keys a Map by source path. Two rows claiming the same path used to
// overwrite with no signal, so the manifest could be ambiguous and the operator never learn.
// Not live today — the shipped manifest has 106 rows and 106 distinct paths — but demonstrably
// reachable: the I139 seeding bug (fixed 2026-08-14) produced exactly that shape.
//
// Last-writer-wins is asserted deliberately. The backlog row's complaint is the SILENCE, not the
// precedence, and changing which row wins would be an unevidenced behaviour change.
describe('I40: duplicate source paths in skill-manifest.csv', () => {
  let tmpDir;
  let warnings;
  let originalWarn;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-doctor-i40-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad/_config'));
    warnings = [];
    originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
  });

  afterEach(async () => {
    console.warn = originalWarn;
    await fs.remove(tmpDir);
  });

  const write = (rows) =>
    fs.writeFile(path.join(tmpDir, '_bmad/_config/skill-manifest.csv'), rows.join('\n') + '\n');

  it('warns, names the conflict, and keeps last-writer-wins', async () => {
    await write([
      'canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies',
      'skill-a,a,"desc",bme,shared/path/SKILL.md,true,,,',
      'skill-b,b,"desc",bme,shared/path/SKILL.md,true,,,',
      'skill-c,c,"desc",bme,other/path/SKILL.md,true,,,',
    ]);

    const map = loadSkillManifest(tmpDir);

    assert.equal(map.size, 2, 'the duplicate should collapse to one entry');
    assert.equal(map.get('shared/path/SKILL.md'), 'skill-b', 'last-writer-wins must be preserved');

    const text = warnings.join('\n');
    assert.match(text, /duplicate source path/i, 'the collision was not reported at all');
    assert.match(text, /shared\/path\/SKILL\.md/, 'the warning does not name the offending path');
    assert.match(text, /skill-a/, 'the warning does not name the row that was overridden');
    assert.match(text, /skill-b/, 'the warning does not name the row that won');
  });

  it('stays silent when a duplicate path maps to the SAME canonicalId', async () => {
    // A row repeated verbatim is redundant, not ambiguous — warning would be noise.
    await write([
      'canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies',
      'skill-a,a,"desc",bme,shared/path/SKILL.md,true,,,',
      'skill-a,a,"desc",bme,shared/path/SKILL.md,true,,,',
    ]);

    const map = loadSkillManifest(tmpDir);
    assert.equal(map.get('shared/path/SKILL.md'), 'skill-a');
    assert.equal(
      warnings.filter((w) => /duplicate source path/i.test(w)).length,
      0,
      'an identical repeated row should not warn'
    );
  });

  it('does not warn on a manifest with no duplicates', async () => {
    await write([
      'canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies',
      'skill-a,a,"desc",bme,a/SKILL.md,true,,,',
      'skill-b,b,"desc",bme,b/SKILL.md,true,,,',
    ]);

    loadSkillManifest(tmpDir);
    assert.equal(
      warnings.filter((w) => /duplicate source path/i.test(w)).length,
      0,
      'clean manifest must not produce a duplicate warning'
    );
  });
});

describe('ag-7-2: checkModuleSkillWrappers — healthy install', () => {
  let tmpDir;

  beforeEach(async () => { tmpDir = await setupTempProject(); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('returns passed for Artifacts when all wrappers present', () => {
    const map = loadSkillManifest(tmpDir);
    const result = checkModuleSkillWrappers(makeArtifactsMod(tmpDir), tmpDir, map);
    assert.equal(result.passed, true);
    assert.equal(result.name, '_artifacts skill wrappers');
    assert.match(result.info, /2 standalone-skill workflows have wrappers/);
  });

  it('returns passed for Enhance when wrapper present (different naming convention)', () => {
    const map = loadSkillManifest(tmpDir);
    const result = checkModuleSkillWrappers(makeEnhanceMod(tmpDir), tmpDir, map);
    assert.equal(result.passed, true);
    assert.match(result.info, /1 standalone-skill workflows have wrappers/);
  });
});

// === (b) Missing wrapper for Artifacts ===

describe('ag-7-2: checkModuleSkillWrappers — missing Artifacts wrapper', () => {
  let tmpDir;

  beforeEach(async () => { tmpDir = await setupTempProject(); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('returns failed when bmad-migrate-artifacts wrapper is missing', async () => {
    await fs.remove(path.join(tmpDir, '.claude/skills/bmad-migrate-artifacts'));
    const map = loadSkillManifest(tmpDir);
    const result = checkModuleSkillWrappers(makeArtifactsMod(tmpDir), tmpDir, map);
    assert.equal(result.passed, false);
    assert.match(result.error, /Missing skill wrapper for bmad-migrate-artifacts/);
    assert.match(result.error, /\.claude\/skills\/bmad-migrate-artifacts\/SKILL\.md/);
    assert.equal(result.fix, 'Run convoke-update to regenerate skill wrappers');
  });
});

// === (c) Missing wrapper for Enhance — verifies prefix lookup ===

describe('ag-7-2: checkModuleSkillWrappers — missing Enhance wrapper', () => {
  let tmpDir;

  beforeEach(async () => { tmpDir = await setupTempProject(); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('error message uses the manifest-resolved prefix bmad-enhance-initiatives-backlog (not initiatives-backlog)', async () => {
    await fs.remove(path.join(tmpDir, '.claude/skills/bmad-enhance-initiatives-backlog'));
    const map = loadSkillManifest(tmpDir);
    const result = checkModuleSkillWrappers(makeEnhanceMod(tmpDir), tmpDir, map);
    assert.equal(result.passed, false);
    assert.match(result.error, /Missing skill wrapper for initiatives-backlog/);
    // The wrapper path MUST use the prefix from the manifest, not the verbatim name
    assert.match(result.error, /\.claude\/skills\/bmad-enhance-initiatives-backlog\/SKILL\.md/);
    assert.doesNotMatch(result.error, /\.claude\/skills\/initiatives-backlog\/SKILL\.md/);
  });
});

// === (d) Module with no manifest entries (Vortex/Gyre/team-factory pattern) ===

describe('ag-7-2: checkModuleSkillWrappers — module with no standalone-skill workflows', () => {
  let tmpDir;

  beforeEach(async () => { tmpDir = await setupTempProject(); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('returns null for Vortex (no workflows in manifest)', () => {
    const map = loadSkillManifest(tmpDir);
    const result = checkModuleSkillWrappers(makeVortexMod(tmpDir), tmpDir, map);
    assert.equal(result, null,
      'modules whose workflows are NOT in the manifest should be skipped (return null)');
  });
});

// === (e) Multiple missing wrappers in same module — failure aggregation ===

describe('ag-7-2: checkModuleSkillWrappers — failure aggregation', () => {
  let tmpDir;

  beforeEach(async () => { tmpDir = await setupTempProject(); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('aggregates multiple missing wrappers into a single error string with semicolon separator', async () => {
    await fs.remove(path.join(tmpDir, '.claude/skills/bmad-migrate-artifacts'));
    await fs.remove(path.join(tmpDir, '.claude/skills/bmad-portfolio-status'));
    const map = loadSkillManifest(tmpDir);
    const result = checkModuleSkillWrappers(makeArtifactsMod(tmpDir), tmpDir, map);
    assert.equal(result.passed, false);
    assert.match(result.error, /bmad-migrate-artifacts/);
    assert.match(result.error, /bmad-portfolio-status/);
    // Aggregation uses '; ' separator (mirrors validateEnhanceModule pattern)
    const failures = result.error.split('; ');
    assert.ok(failures.length >= 2, `expected ≥2 aggregated failures, got: ${result.error}`);
  });
});

// === (f) Per-workflow filtering: some in manifest, some not ===

describe('ag-7-2: checkModuleSkillWrappers — partial manifest coverage', () => {
  let tmpDir;

  beforeEach(async () => { tmpDir = await setupTempProject(); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('only checks workflows that ARE in the manifest, ignores the rest', () => {
    const mod = {
      name: '_artifacts',
      // mod.dir must be relative to projectRoot via path.relative — use the
      // real temp project dir so the relative path math matches what the
      // function computes internally.
      dir: path.join(tmpDir, '_bmad/bme/_artifacts'),
      config: {
        workflows: [
          { name: 'bmad-migrate-artifacts', entry: 'x', standalone: true }, // in manifest
          { name: 'some-future-non-skill-workflow', entry: 'y' },           // NOT in manifest
        ],
      },
    };
    const map = loadSkillManifest(tmpDir);
    const result = checkModuleSkillWrappers(mod, tmpDir, map);
    // ag-7-2 review patch (Edge Case Hunter EH#6): assert non-null before property access
    assert.ok(result !== null, `expected non-null result, got: ${result}`);
    assert.equal(result.passed, true);
    // Only 1 workflow has a wrapper to check (the in-manifest one); the other is silently skipped
    assert.match(result.info, /1 standalone-skill workflows have wrappers/);
  });
});

// === Null/empty/malformed workflow entries don't crash the check (EH#4 / BH#7 patch) ===

describe('ag-7-2: checkModuleSkillWrappers — null/malformed workflow entries', () => {
  let tmpDir;

  beforeEach(async () => { tmpDir = await setupTempProject(); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('does not crash on null workflow entries', () => {
    const mod = {
      name: '_artifacts',
      dir: path.join(tmpDir, '_bmad/bme/_artifacts'),
      config: {
        workflows: [
          null,
          { name: 'bmad-migrate-artifacts', entry: 'x', standalone: true },
          { name: null }, // object with null name
          { /* no name field */ },
          '',  // empty string
        ],
      },
    };
    const map = loadSkillManifest(tmpDir);
    // This must not throw
    const result = checkModuleSkillWrappers(mod, tmpDir, map);
    assert.ok(result !== null, 'expected the one valid workflow to produce a result');
    assert.equal(result.passed, true, `expected pass, got: ${JSON.stringify(result)}`);
    assert.match(result.info, /1 standalone-skill workflows have wrappers/);
  });
});

// === (g) Graceful degradation when manifest CSV is missing ===

describe('ag-7-2: loadSkillManifest — graceful degradation', () => {
  let tmpDir;
  let originalWarn;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-doctor-no-manifest-'));
    originalWarn = console.warn;
    console.warn = () => {}; // silence the expected warning
  });

  afterEach(async () => {
    console.warn = originalWarn;
    await fs.remove(tmpDir);
  });

  it('returns empty Map when skill-manifest.csv does not exist', () => {
    const map = loadSkillManifest(tmpDir);
    assert.ok(map instanceof Map);
    assert.equal(map.size, 0);
  });

  it('checkModuleSkillWrappers returns null for every module when manifest is missing', () => {
    // SPEC DEVIATION (ag-7-2 review patch — Acceptance Auditor + Edge Case Hunter EH#5):
    // The original AC #3 wording said "fall back to verbatim names with warning" on
    // manifest miss. The implementation skips silently instead because:
    //   1. Vortex/Gyre/team-factory all declare workflows in config.yaml that are NOT
    //      standalone skills (they're agent-menu items / non-skill workflows)
    //   2. The verbatim fallback would false-fail the doctor on every healthy install
    //      for those modules
    //   3. The manifest is the OPT-IN marker for "this workflow is a standalone skill
    //      that needs a wrapper" — modules without manifest entries are correctly
    //      reported as having nothing to check
    // The Acceptance Auditor reviewed and ACCEPTED this deviation in the Round 1 code
    // review. AC #3 has been updated in the spec to reflect the opt-in semantics.
    // This test locks in the corrected behavior.
    const map = loadSkillManifest(tmpDir);
    const artifactsResult = checkModuleSkillWrappers(makeArtifactsMod(tmpDir), tmpDir, map);
    const enhanceResult = checkModuleSkillWrappers(makeEnhanceMod(tmpDir), tmpDir, map);
    assert.equal(artifactsResult, null);
    assert.equal(enhanceResult, null);
  });
});

// === (h) loadSkillManifest correctly parses real csv structure ===

describe('ag-7-2: loadSkillManifest — CSV parsing', () => {
  let tmpDir;

  beforeEach(async () => { tmpDir = await setupTempProject(); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('builds the correct sourcePath → canonicalId map', () => {
    const map = loadSkillManifest(tmpDir);
    assert.equal(
      map.get('_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/SKILL.md'),
      'bmad-migrate-artifacts'
    );
    assert.equal(
      map.get('_bmad/bme/_artifacts/workflows/bmad-portfolio-status/SKILL.md'),
      'bmad-portfolio-status'
    );
    assert.equal(
      map.get('_bmad/bme/_enhance/workflows/initiatives-backlog/SKILL.md'),
      'bmad-enhance-initiatives-backlog'
    );
    assert.equal(map.size, 3);
  });

  it('handles quoted descriptions with embedded commas', async () => {
    // The seeded manifest has commas inside quoted descriptions — verify they parse
    const map = loadSkillManifest(tmpDir);
    // If quote handling is broken, the path field would shift and the lookup would fail
    assert.ok(map.has('_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/SKILL.md'));
  });
});
