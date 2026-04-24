const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const versionDetector = require('../../scripts/update/lib/version-detector');
const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');

describe('getTargetVersion', () => {
  it('returns a valid semver string', () => {
    const version = versionDetector.getTargetVersion();
    assert.match(version, /^\d+\.\d+\.\d+/);
  });

  it('matches package.json version', () => {
    const pkg = require('../../package.json');
    assert.equal(versionDetector.getTargetVersion(), pkg.version);
  });
});

describe('getVersionRange', () => {
  it('converts full version to wildcard range', () => {
    assert.equal(versionDetector.getVersionRange('1.0.5'), '1.0.x');
    assert.equal(versionDetector.getVersionRange('2.3.1'), '2.3.x');
    assert.equal(versionDetector.getVersionRange('0.0.0'), '0.0.x');
  });
});

describe('isBreakingChange', () => {
  it('v1.0.x to anything is breaking', () => {
    assert.equal(versionDetector.isBreakingChange('1.0.5', '1.4.0'), true);
    assert.equal(versionDetector.isBreakingChange('1.0.0', '2.0.0'), true);
  });

  it('v1.1.x to v1.2.x is not breaking', () => {
    assert.equal(versionDetector.isBreakingChange('1.1.3', '1.2.0'), false);
  });

  it('major version change is breaking', () => {
    assert.equal(versionDetector.isBreakingChange('1.4.0', '2.0.0'), true);
  });

  it('same major, non-1.0.x is not breaking', () => {
    assert.equal(versionDetector.isBreakingChange('1.3.0', '1.4.0'), false);
  });
});

describe('getMigrationPath', () => {
  it('returns fresh-install when currentVersion is null', () => {
    const result = versionDetector.getMigrationPath(null, '1.4.0');
    assert.equal(result.type, 'fresh-install');
    assert.equal(result.needsMigration, false);
  });

  it('returns up-to-date when versions match', () => {
    const result = versionDetector.getMigrationPath('1.4.0', '1.4.0');
    assert.equal(result.type, 'up-to-date');
    assert.equal(result.needsMigration, false);
  });

  it('returns downgrade when current > target', () => {
    const result = versionDetector.getMigrationPath('2.0.0', '1.4.0');
    assert.equal(result.type, 'downgrade');
    assert.equal(result.needsMigration, false);
  });

  it('returns upgrade-needed when current < target', () => {
    const result = versionDetector.getMigrationPath('1.0.5', '1.4.0');
    assert.equal(result.type, 'upgrade-needed');
    assert.equal(result.needsMigration, true);
    assert.equal(result.breaking, true); // 1.0.x is always breaking
  });

  it('returns upgrade-needed non-breaking for 1.3.x to 1.4.0', () => {
    const result = versionDetector.getMigrationPath('1.3.0', '1.4.0');
    assert.equal(result.type, 'upgrade-needed');
    assert.equal(result.needsMigration, true);
    assert.equal(result.breaking, false);
  });
});

describe('getCurrentVersion', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-vd-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns null when project root is null', () => {
    const result = versionDetector.getCurrentVersion('/nonexistent/path');
    assert.equal(result, null);
  });

  it('returns null when no config exists', async () => {
    // Create _bmad dir but no config
    await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex'));
    const result = versionDetector.getCurrentVersion(tmpDir);
    assert.equal(result, null);
  });

  it('reads version from config.yaml', async () => {
    const configDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(configDir);
    await fs.writeFile(
      path.join(configDir, 'config.yaml'),
      yaml.dump({ version: '1.3.8' })
    );
    const result = versionDetector.getCurrentVersion(tmpDir);
    assert.equal(result, '1.3.8');
  });
});

describe('guessVersionFromFileStructure', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-guess-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns null when no vortex directory', () => {
    const result = versionDetector.guessVersionFromFileStructure(tmpDir);
    assert.equal(result, null);
  });

  it('returns null when vortex exists but structure is ambiguous', async () => {
    await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex'));
    const result = versionDetector.guessVersionFromFileStructure(tmpDir);
    assert.equal(result, null);
  });

  it('returns 1.0.0 when empathy-map workflow exists', async () => {
    await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex/workflows/empathy-map'));
    const result = versionDetector.guessVersionFromFileStructure(tmpDir);
    assert.equal(result, '1.0.0');
  });

  it('returns 1.1.0 when deprecated dir exists', async () => {
    await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex/workflows/_deprecated'));
    const result = versionDetector.guessVersionFromFileStructure(tmpDir);
    assert.equal(result, '1.1.0');
  });
});

describe('detectInstallationScenario', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-scenario-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns fresh when no vortex directory', () => {
    assert.equal(versionDetector.detectInstallationScenario(tmpDir), 'fresh');
  });

  it('returns partial when vortex exists but no config', async () => {
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(vortexDir);
    assert.equal(versionDetector.detectInstallationScenario(tmpDir), 'partial');
  });

  it('returns corrupted when config exists but agents missing', async () => {
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({ version: '1.4.0' }));
    assert.equal(versionDetector.detectInstallationScenario(tmpDir), 'corrupted');
  });

  it('returns complete when all 7 agents exist in skill-dir layout', async () => {
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    const agentsDir = path.join(vortexDir, 'agents');
    await fs.ensureDir(agentsDir);
    await fs.ensureDir(path.join(vortexDir, 'workflows'));
    // Post-R1-H4: detectInstallationScenario iterates ALL 7 AGENT_IDS and
    // accepts either flat `.md` or skill-dir `<id>/SKILL.md` shape. Seed
    // the canonical v4.0 skill-dir layout here.
    for (const agentId of AGENT_IDS) {
      const skillDir = path.join(agentsDir, agentId);
      await fs.ensureDir(skillDir);
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `# ${agentId}\n`);
    }
    assert.equal(versionDetector.detectInstallationScenario(tmpDir), 'complete');
  });

  it('returns partial on mixed-shape drift — disjoint (R1-H4 + R2-H6)', async () => {
    const mixedDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-mixed-'));
    try {
      const vortexDir = path.join(mixedDir, '_bmad/bme/_vortex');
      const agentsDir = path.join(vortexDir, 'agents');
      await fs.ensureDir(agentsDir);
      await fs.ensureDir(path.join(vortexDir, 'workflows'));
      await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({ version: '4.0.0' }));
      // Seed 4 agents as flat `.md`, 3 as skill-dir — disjoint mid-migration
      // drift (different agents in different shapes).
      const flatIds = AGENT_IDS.slice(0, 4);
      const dirIds = AGENT_IDS.slice(4);
      for (const id of flatIds) {
        await fs.writeFile(path.join(agentsDir, `${id}.md`), `# ${id}`);
      }
      for (const id of dirIds) {
        const skillDir = path.join(agentsDir, id);
        await fs.ensureDir(skillDir);
        await fs.writeFile(path.join(skillDir, 'SKILL.md'), `# ${id}\n`);
      }
      // R2-H6: partial (not corrupted) so refreshInstallation auto-remediates.
      assert.equal(versionDetector.detectInstallationScenario(mixedDir), 'partial');
    } finally {
      await fs.remove(mixedDir);
    }
  });

  // R2-M6: per-agent dual-presence — single agent has BOTH flat `.md` AND
  // skill-dir `<id>/SKILL.md` simultaneously. Failure mode is partial R1-H2
  // cleanup (backup succeeded, flat removal failed). Should route to mixed-
  // shape branch and return 'partial' so refresh auto-remediates.
  it('returns partial on per-agent dual-presence (R2-M6)', async () => {
    const dualDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-dual-'));
    try {
      const vortexDir = path.join(dualDir, '_bmad/bme/_vortex');
      const agentsDir = path.join(vortexDir, 'agents');
      await fs.ensureDir(agentsDir);
      await fs.ensureDir(path.join(vortexDir, 'workflows'));
      await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({ version: '4.0.0' }));
      // Seed 1 agent with BOTH shapes; the other 6 with skill-dir only.
      const dualId = AGENT_IDS[0];
      const dualSkillDir = path.join(agentsDir, dualId);
      await fs.ensureDir(dualSkillDir);
      await fs.writeFile(path.join(dualSkillDir, 'SKILL.md'), `# ${dualId}\n`);
      await fs.writeFile(path.join(agentsDir, `${dualId}.md`), `# ${dualId}`);
      for (const id of AGENT_IDS.slice(1)) {
        const skillDir = path.join(agentsDir, id);
        await fs.ensureDir(skillDir);
        await fs.writeFile(path.join(skillDir, 'SKILL.md'), `# ${id}\n`);
      }
      assert.equal(versionDetector.detectInstallationScenario(dualDir), 'partial');
    } finally {
      await fs.remove(dualDir);
    }
  });
});
