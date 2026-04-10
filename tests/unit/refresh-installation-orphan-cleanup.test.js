/**
 * ag-7-4 (I32): Orphan workflow-wrapper cleanup tests
 *
 * Verifies that `cleanupOrphanWorkflowWrappers` correctly removes stale
 * workflow wrapper directories from .claude/skills/ while preserving live
 * wrappers, agent wrappers, and third-party/upstream wrappers.
 *
 * Uses a two-strategy matching approach:
 *   Strategy 1: Enhance prefix (bmad-enhance-*) — unambiguous
 *   Strategy 2: Artifacts exact-name match — avoids colliding with upstream
 *
 * Closes I32 (rank #47 in backlog, RICE 1.0).
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { cleanupOrphanWorkflowWrappers } = require('../../scripts/update/lib/refresh-installation');

/**
 * Seed a skills directory with the given wrapper names (each gets a SKILL.md).
 */
async function seedSkillsDir(skillsDir, wrapperNames) {
  await fs.ensureDir(skillsDir);
  for (const name of wrapperNames) {
    const dir = path.join(skillsDir, name);
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'SKILL.md'), `---\nname: ${name}\n---`, 'utf8');
  }
}

// === (a) Orphan detected and removed ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — orphan removal', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('removes an Enhance orphan (bmad-enhance-removed-workflow)', async () => {
    await seedSkillsDir(skillsDir, [
      'bmad-enhance-initiatives-backlog', // live
      'bmad-enhance-removed-workflow',     // orphan
    ]);
    const currentWrappers = new Set(['bmad-enhance-initiatives-backlog']);
    const knownArtifactsNames = new Set();

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);

    assert.ok(!fs.existsSync(path.join(skillsDir, 'bmad-enhance-removed-workflow')),
      'orphan should be removed');
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-enhance-initiatives-backlog')),
      'live wrapper should be preserved');
    assert.ok(changes.some(c => c.includes('bmad-enhance-removed-workflow')),
      'changes should log the removal');
  });

  it('removes an Artifacts orphan (bmad-portfolio-status removed from config)', async () => {
    await seedSkillsDir(skillsDir, [
      'bmad-migrate-artifacts',   // live
      'bmad-portfolio-status',    // orphan (removed from config)
    ]);
    const currentWrappers = new Set(['bmad-migrate-artifacts']);
    const knownArtifactsNames = new Set(['bmad-migrate-artifacts', 'bmad-portfolio-status']);

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);

    assert.ok(!fs.existsSync(path.join(skillsDir, 'bmad-portfolio-status')),
      'orphan should be removed');
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-migrate-artifacts')),
      'live wrapper should be preserved');
    assert.ok(changes.some(c => c.includes('bmad-portfolio-status')),
      'changes should log the removal');
  });
});

// === (b) Live wrappers preserved ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — live wrappers preserved', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('preserves all 3 current workflow wrappers', async () => {
    const liveWrappers = [
      'bmad-enhance-initiatives-backlog',
      'bmad-migrate-artifacts',
      'bmad-portfolio-status',
    ];
    await seedSkillsDir(skillsDir, liveWrappers);
    const currentWrappers = new Set(liveWrappers);
    const knownArtifactsNames = new Set(['bmad-migrate-artifacts', 'bmad-portfolio-status']);

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);

    for (const name of liveWrappers) {
      assert.ok(fs.existsSync(path.join(skillsDir, name)),
        `live wrapper ${name} should be preserved`);
    }
    assert.equal(changes.length, 0, 'no changes when all wrappers are live');
  });
});

// === (c) Third-party wrappers left alone ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — third-party wrappers', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('leaves third-party and upstream wrappers untouched', async () => {
    await seedSkillsDir(skillsDir, [
      'my-custom-skill',              // third-party
      'bmad-cis-agent-storyteller',   // upstream CIS
      'bmad-agent-analyst',           // upstream BMM agent skill
      'bmad-code-review',             // upstream BMM workflow skill
      'bmad-brainstorming',           // upstream core
    ]);
    const currentWrappers = new Set();
    const knownArtifactsNames = new Set();

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);

    assert.ok(fs.existsSync(path.join(skillsDir, 'my-custom-skill')));
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-cis-agent-storyteller')));
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-agent-analyst')));
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-code-review')));
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-brainstorming')));
    assert.equal(changes.length, 0, 'no changes for non-workflow wrappers');
  });
});

// === (d) Agent wrappers left alone ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — agent wrappers', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('ignores bmad-agent-bme-* directories (handled by existing agent sweep)', async () => {
    await seedSkillsDir(skillsDir, [
      'bmad-agent-bme-contextualization-expert',
      'bmad-agent-bme-team-factory',
      'bmad-enhance-orphan', // this IS an orphan
    ]);
    const currentWrappers = new Set();
    const knownArtifactsNames = new Set();

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);

    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-agent-bme-contextualization-expert')),
      'agent wrapper should be preserved');
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-agent-bme-team-factory')),
      'agent wrapper should be preserved');
    assert.ok(!fs.existsSync(path.join(skillsDir, 'bmad-enhance-orphan')),
      'Enhance orphan should still be removed');
    assert.equal(changes.length, 1);
  });
});

// === (e) Idempotency ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — idempotency', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('running twice produces same result — second run has no changes', async () => {
    await seedSkillsDir(skillsDir, [
      'bmad-enhance-initiatives-backlog',
      'bmad-enhance-removed-workflow',
    ]);
    const currentWrappers = new Set(['bmad-enhance-initiatives-backlog']);
    const knownArtifactsNames = new Set();

    const changes1 = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);
    assert.equal(changes1.length, 1, 'first run should remove the orphan');

    const changes2 = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);
    assert.equal(changes2.length, 0, 'second run should have no changes');
  });
});

// === (f) Empty .claude/skills/ directory ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — empty skills directory', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('does not crash on empty .claude/skills/', async () => {
    await fs.ensureDir(skillsDir);
    const currentWrappers = new Set(['bmad-enhance-initiatives-backlog']);
    const knownArtifactsNames = new Set(['bmad-migrate-artifacts']);

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);
    assert.equal(changes.length, 0);
  });
});

// === (g) Missing .claude/skills/ directory ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — missing skills directory', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
    // deliberately NOT creating skillsDir
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('returns empty changes when .claude/skills/ does not exist', () => {
    const currentWrappers = new Set(['bmad-enhance-initiatives-backlog']);
    const knownArtifactsNames = new Set(['bmad-migrate-artifacts']);

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);
    assert.equal(changes.length, 0);
    assert.ok(!fs.existsSync(skillsDir), 'should not create the directory');
  });
});

// === (h) Non-standalone Artifacts workflow name collision (documenting test — BH#3/EH#2) ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — non-standalone Artifacts name in knownArtifactsNames', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('removes a directory matching a non-standalone Artifacts name if it exists (defensive — such dirs should never be installed)', async () => {
    // Scenario: a future Artifacts workflow "bmad-internal-tool" is declared in config
    // WITHOUT standalone:true. refresh-installation section 6d would never install a
    // wrapper for it. But if someone manually created .claude/skills/bmad-internal-tool/,
    // Strategy 2 correctly removes it because:
    //   - knownArtifactsNames contains "bmad-internal-tool" (all Artifacts names tracked)
    //   - currentWrappers does NOT contain it (only standalone:true workflows are in the union)
    // This is intentional: the name is Convoke-owned, and the directory shouldn't exist.
    await seedSkillsDir(skillsDir, ['bmad-internal-tool']);
    const currentWrappers = new Set(); // no standalone workflows
    const knownArtifactsNames = new Set(['bmad-internal-tool']); // non-standalone, but known

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);

    assert.ok(!fs.existsSync(path.join(skillsDir, 'bmad-internal-tool')),
      'directory matching a known Artifacts name should be removed even if non-standalone');
    assert.equal(changes.length, 1);
    assert.ok(changes[0].includes('bmad-internal-tool'));
  });
});

// === Mixed scenario: all wrapper types coexist ===

describe('ag-7-4: cleanupOrphanWorkflowWrappers — mixed scenario', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-cleanup-test-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
  });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('correctly handles a realistic mix of all wrapper types', async () => {
    await seedSkillsDir(skillsDir, [
      // Live workflow wrappers (should be preserved)
      'bmad-enhance-initiatives-backlog',
      'bmad-migrate-artifacts',
      'bmad-portfolio-status',
      // Orphan workflow wrappers (should be removed)
      'bmad-enhance-old-removed-workflow',
      // Agent wrappers (should be ignored)
      'bmad-agent-bme-contextualization-expert',
      'bmad-agent-bme-team-factory',
      // Upstream/third-party (should be ignored)
      'bmad-code-review',
      'bmad-brainstorming',
      'my-custom-skill',
      'bmad-cis-agent-storyteller',
    ]);
    const currentWrappers = new Set([
      'bmad-enhance-initiatives-backlog',
      'bmad-migrate-artifacts',
      'bmad-portfolio-status',
    ]);
    const knownArtifactsNames = new Set([
      'bmad-migrate-artifacts',
      'bmad-portfolio-status',
    ]);

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames);

    // Exactly 1 orphan removed
    assert.equal(changes.length, 1);
    assert.ok(changes[0].includes('bmad-enhance-old-removed-workflow'));

    // Removed
    assert.ok(!fs.existsSync(path.join(skillsDir, 'bmad-enhance-old-removed-workflow')));

    // Preserved
    const preserved = [
      'bmad-enhance-initiatives-backlog', 'bmad-migrate-artifacts', 'bmad-portfolio-status',
      'bmad-agent-bme-contextualization-expert', 'bmad-agent-bme-team-factory',
      'bmad-code-review', 'bmad-brainstorming', 'my-custom-skill', 'bmad-cis-agent-storyteller',
    ];
    for (const name of preserved) {
      assert.ok(fs.existsSync(path.join(skillsDir, name)), `${name} should be preserved`);
    }
  });
});
