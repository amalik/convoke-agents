const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const { PACKAGE_ROOT, createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

// Minimal pm.md needed because the Enhance block runs alongside the Artifacts block
const MINIMAL_PM_MD = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
</agent>`;

async function setupArtifactsTestDir() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-inst-'));
  await createValidInstallation(tmpDir);

  // pm.md so the Enhance block (which runs in parallel) doesn't warn-loudly
  const pmDir = path.join(tmpDir, '_bmad/bmm/agents');
  await fs.ensureDir(pmDir);
  await fs.writeFile(path.join(pmDir, 'pm.md'), MINIMAL_PM_MD, 'utf8');

  return tmpDir;
}

// === Artifacts directory copy ===

describe('refreshInstallation — Artifacts directory copy', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupArtifactsTestDir();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('copies _artifacts/ directory tree from package to project', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const artDir = path.join(tmpDir, '_bmad/bme/_artifacts');
    assert.ok(fs.existsSync(artDir), '_artifacts/ should exist in target');
    assert.ok(fs.existsSync(path.join(artDir, 'config.yaml')), 'config.yaml should exist');
    assert.ok(fs.existsSync(path.join(artDir, 'workflows/bmad-migrate-artifacts/workflow.md')), 'migrate workflow.md should exist');
    assert.ok(fs.existsSync(path.join(artDir, 'workflows/bmad-migrate-artifacts/SKILL.md')), 'migrate SKILL.md should exist');
    assert.ok(fs.existsSync(path.join(artDir, 'workflows/bmad-portfolio-status/workflow.md')), 'portfolio workflow.md should exist');
    assert.ok(fs.existsSync(path.join(artDir, 'workflows/bmad-portfolio-status/SKILL.md')), 'portfolio SKILL.md should exist');
    assert.ok(fs.existsSync(path.join(artDir, 'workflows/bmad-migrate-artifacts/steps')), 'migrate steps/ dir should exist');
    assert.ok(fs.existsSync(path.join(artDir, 'workflows/bmad-portfolio-status/steps')), 'portfolio steps/ dir should exist');
  });

  it('stamps version field in _artifacts/config.yaml to match package version', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const cfg = yaml.load(fs.readFileSync(path.join(tmpDir, '_bmad/bme/_artifacts/config.yaml'), 'utf8'));
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    assert.equal(cfg.version, pkg.version, 'config.yaml version should match package.json version');
  });

  it('reports Artifacts copy in changes array', async () => {
    const changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('Refreshed Artifacts module')));
  });

  it('skips copy in dev environment (source === destination)', async () => {
    const changes = await refreshInstallation(PACKAGE_ROOT, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('Skipped Artifacts copy (dev environment')));
  });

  it('removes stale files in destination before copying', async () => {
    // Pre-seed a stale file in the destination
    const staleDir = path.join(tmpDir, '_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts');
    await fs.ensureDir(staleDir);
    await fs.writeFile(path.join(staleDir, 'stale-leftover.md'), '# stale', 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(!fs.existsSync(path.join(staleDir, 'stale-leftover.md')), 'stale file should be removed');
    assert.ok(fs.existsSync(path.join(staleDir, 'workflow.md')), 'fresh workflow.md should be present');
  });
});

// === Artifacts skill wrappers ===

describe('refreshInstallation — Artifacts skill wrappers', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupArtifactsTestDir();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('generates SKILL.md wrapper for bmad-migrate-artifacts', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const skillPath = path.join(tmpDir, '.claude/skills/bmad-migrate-artifacts/SKILL.md');
    assert.ok(fs.existsSync(skillPath), 'SKILL.md should exist');

    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('name: bmad-migrate-artifacts'), 'frontmatter name should match');
    assert.ok(content.includes('_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/workflow.md'), 'should reference absolute workflow.md path');
  });

  it('generates SKILL.md wrapper for bmad-portfolio-status', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const skillPath = path.join(tmpDir, '.claude/skills/bmad-portfolio-status/SKILL.md');
    assert.ok(fs.existsSync(skillPath), 'SKILL.md should exist');

    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('name: bmad-portfolio-status'), 'frontmatter name should match');
    assert.ok(content.includes('_bmad/bme/_artifacts/workflows/bmad-portfolio-status/workflow.md'), 'should reference absolute workflow.md path');
  });

  it('uses workflow.name verbatim (no double bmad- prefix)', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    // Should NOT exist with double prefix
    const wrongPath = path.join(tmpDir, '.claude/skills/bmad-bmad-migrate-artifacts/SKILL.md');
    assert.ok(!fs.existsSync(wrongPath), 'should not generate double-prefixed skill dir');
  });

  it('removes obsolete thin wrapper files before generating new wrapper', async () => {
    // Pre-seed an obsolete thin wrapper (mirrors the real .claude/skills/bmad-portfolio-status/workflow.md case)
    const obsoleteSkillDir = path.join(tmpDir, '.claude/skills/bmad-portfolio-status');
    await fs.ensureDir(obsoleteSkillDir);
    await fs.writeFile(path.join(obsoleteSkillDir, 'workflow.md'), '# obsolete 5-line wrapper', 'utf8');
    await fs.writeFile(path.join(obsoleteSkillDir, 'unrelated-leftover.md'), '# leftover', 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    // Obsolete files should be gone
    assert.ok(!fs.existsSync(path.join(obsoleteSkillDir, 'workflow.md')), 'obsolete workflow.md should be removed');
    assert.ok(!fs.existsSync(path.join(obsoleteSkillDir, 'unrelated-leftover.md')), 'unrelated leftover should be removed');
    // Fresh SKILL.md should be present
    assert.ok(fs.existsSync(path.join(obsoleteSkillDir, 'SKILL.md')), 'fresh SKILL.md should exist');
  });

  it('does not invoke menu-patch logic for standalone:true workflows', async () => {
    // The Artifacts workflows do not have target_agent — if the menu-patch logic tried to run,
    // pm.md would be modified with garbage. Verify pm.md is unchanged by Artifacts processing.
    const pmPathBefore = path.join(tmpDir, '_bmad/bmm/agents/pm.md');
    const pmBefore = fs.readFileSync(pmPathBefore, 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const pmAfter = fs.readFileSync(pmPathBefore, 'utf8');
    // pm.md will have the Enhance menu patch added (initiatives-backlog), but NOT any artifacts entries
    // (Strengthened 2026-04-22 per lint-1.1 AC2: `pmBefore` was captured but never compared —
    // the test only checked the absence of artifacts entries, not the presence of the Enhance patch
    // that the comment claimed would happen. Now uses pmBefore to assert both facts.)
    assert.notStrictEqual(pmAfter, pmBefore, 'pm.md should be modified by Enhance menu patch');
    assert.ok(pmAfter.includes('initiatives-backlog'), 'pm.md should contain the Enhance menu patch (initiatives-backlog)');
    assert.ok(!pmAfter.includes('bmad-migrate-artifacts'), 'pm.md should not contain artifacts menu entries');
    assert.ok(!pmAfter.includes('bmad-portfolio-status'), 'pm.md should not contain artifacts menu entries');
  });

  it('reports skill wrapper generation in changes array', async () => {
    const changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c === 'Generated skill wrapper: bmad-migrate-artifacts'), 'should report migrate wrapper');
    assert.ok(changes.some(c => c === 'Generated skill wrapper: bmad-portfolio-status'), 'should report portfolio wrapper');
  });

  it('skips skill wrapper generation in dev environment (isSameRoot)', async () => {
    const changes = await refreshInstallation(PACKAGE_ROOT, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('Skipped Artifacts skill wrapper generation (dev environment')));
  });

  it('is idempotent (identical content after two runs)', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const first = fs.readFileSync(path.join(tmpDir, '.claude/skills/bmad-migrate-artifacts/SKILL.md'), 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const second = fs.readFileSync(path.join(tmpDir, '.claude/skills/bmad-migrate-artifacts/SKILL.md'), 'utf8');

    assert.equal(first, second, 'SKILL.md should be identical after two runs');
  });
});

// === package.json files array ===

describe('package.json files array — Artifacts', () => {
  it('includes _bmad/bme/_artifacts/ for npm publishing', async () => {
    const pkgPath = path.join(PACKAGE_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(
      pkg.files.some(f => f.includes('_artifacts')),
      `package.json files array should include _artifacts/, got: ${pkg.files.join(', ')}`
    );
  });
});
