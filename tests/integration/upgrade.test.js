const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const versionDetector = require('../../scripts/update/lib/version-detector');
const registry = require('../../scripts/update/migrations/registry');

describe('Upgrade from v1.0.x (simulated)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-upgrade-1.0-'));

    // Simulate a v1.0.x installation structure
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows/empathy-map'));
    await fs.ensureDir(path.join(vortexDir, 'workflows/wireframe'));

    // Old agent files (deprecated names)
    await fs.writeFile(path.join(vortexDir, 'agents/empathy-mapper.md'), '# Old Emma');
    await fs.writeFile(path.join(vortexDir, 'agents/wireframe-designer.md'), '# Old Wade');

    // v1.0.x config
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({
      version: '1.0.5',
      user_name: 'TestUser',
      communication_language: 'fr',
      agents: ['empathy-mapper', 'wireframe-designer'],
      workflows: ['empathy-map', 'wireframe']
    }));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('detects v1.0.x version from file structure', () => {
    const version = versionDetector.guessVersionFromFileStructure(tmpDir);
    assert.equal(version, '1.0.0');
  });

  it('detects version from config.yaml', () => {
    const version = versionDetector.getCurrentVersion(tmpDir);
    assert.equal(version, '1.0.5');
  });

  it('finds applicable migration for v1.0.x', () => {
    const migrations = registry.getMigrationsFor('1.0.5');
    assert.ok(migrations.length >= 1);
    assert.equal(migrations[0].name, '1.0.x-to-1.3.0');
    assert.equal(migrations[0].breaking, true);
  });

  it('refreshInstallation replaces deprecated agents', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    // New agents should exist
    assert.ok(fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/agents/contextualization-expert.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/agents/lean-experiments-specialist.md')));

    // Old deprecated agents should be removed by refreshInstallation
    assert.ok(!fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/agents/empathy-mapper.md')));
    assert.ok(!fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/agents/wireframe-designer.md')));
  });

  it('preserves user preferences after refresh', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

    assert.equal(config.user_name, 'TestUser');
    assert.equal(config.communication_language, 'fr');
  });

  it('updates version in config after refresh', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    const pkg = require('../../package.json');

    assert.equal(config.version, pkg.version);
  });
});

describe('Upgrade from v1.3.x (simulated)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-upgrade-1.3-'));

    // Simulate a v1.3.x installation (already has correct structure)
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));

    await fs.writeFile(path.join(vortexDir, 'agents/contextualization-expert.md'), '# Emma v1.3');
    await fs.writeFile(path.join(vortexDir, 'agents/lean-experiments-specialist.md'), '# Wade v1.3');
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({
      version: '1.3.8',
      user_name: 'Alice',
      submodule_name: 'vortex',
      description: 'test',
      module: 'bme',
      output_folder: '_bmad/bme/_vortex/guides',
      agents: ['contextualization-expert', 'lean-experiments-specialist'],
      workflows: ['lean-persona']
    }));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('detects v1.3.8 from config', () => {
    const version = versionDetector.getCurrentVersion(tmpDir);
    assert.equal(version, '1.3.8');
  });

  it('finds applicable migration for v1.3.8', () => {
    const migrations = registry.getMigrationsFor('1.3.8');
    assert.ok(migrations.length >= 1, 'should have at least 1 migration');
    assert.equal(migrations[0].name, '1.3.x-to-1.5.0');
  });

  it('reports breaking changes for v1.3.8 (chain reaches 1.7.x-to-2.0.0)', () => {
    const changes = registry.getBreakingChanges('1.3.8');
    assert.equal(changes.length, 1);
    assert.ok(changes[0].includes('Product rename'));
  });

  it('migration path shows upgrade-needed and breaking (v2.0.0 rename)', () => {
    const pkg = require('../../package.json');
    const path = versionDetector.getMigrationPath('1.3.8', pkg.version);
    if (pkg.version !== '1.3.8') {
      assert.equal(path.type, 'upgrade-needed');
      // v2.0.0 introduced a breaking migration (product rename BMAD-Enhanced → Convoke)
      assert.equal(path.breaking, true);
    } else {
      assert.equal(path.type, 'up-to-date');
    }
  });

  it('refreshInstallation preserves user_name', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

    assert.equal(config.user_name, 'Alice');
  });

  it('refreshInstallation updates agent files to latest', async () => {
    const agentPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/contextualization-expert.md');
    const content = fs.readFileSync(agentPath, 'utf8');

    // Should no longer be our stub content
    assert.notEqual(content, '# Emma v1.3');
  });

  it('refreshInstallation adds Wave 2 agents', async () => {
    const islaPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/discovery-empathy-expert.md');
    const maxPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/learning-decision-expert.md');

    assert.ok(fs.existsSync(islaPath), 'Isla should be installed after upgrade');
    assert.ok(fs.existsSync(maxPath), 'Max should be installed after upgrade');
  });
});

describe('User guide backup during upgrade', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-guides-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad'));

    // Pre-create a user guide to test backup
    const guidesDir = path.join(tmpDir, '_bmad/bme/_vortex/guides');
    await fs.ensureDir(guidesDir);
    await fs.writeFile(path.join(guidesDir, 'EMMA-USER-GUIDE.md'), '# My custom guide notes');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('backs up existing guides when backupGuides is true', async () => {
    const packageRoot = path.join(__dirname, '..', '..');
    const srcGuide = path.join(packageRoot, '_bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md');

    // Only test if source guide exists in package
    if (fs.existsSync(srcGuide)) {
      await refreshInstallation(tmpDir, { backupGuides: true, verbose: false });

      const bakPath = path.join(tmpDir, '_bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md.bak');
      assert.ok(fs.existsSync(bakPath), '.bak file should be created');

      const bakContent = fs.readFileSync(bakPath, 'utf8');
      assert.equal(bakContent, '# My custom guide notes');
    }
  });

  it('does not create backup when backupGuides is false', async () => {
    const tmpDir2 = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-nobak-'));
    await fs.ensureDir(path.join(tmpDir2, '_bmad'));

    const guidesDir = path.join(tmpDir2, '_bmad/bme/_vortex/guides');
    await fs.ensureDir(guidesDir);
    await fs.writeFile(path.join(guidesDir, 'WADE-USER-GUIDE.md'), '# Custom wade notes');

    const packageRoot = path.join(__dirname, '..', '..');
    const srcGuide = path.join(packageRoot, '_bmad/bme/_vortex/guides/WADE-USER-GUIDE.md');

    if (fs.existsSync(srcGuide)) {
      await refreshInstallation(tmpDir2, { backupGuides: false, verbose: false });

      const bakPath = path.join(tmpDir2, '_bmad/bme/_vortex/guides/WADE-USER-GUIDE.md.bak');
      assert.ok(!fs.existsSync(bakPath), '.bak should NOT be created when backupGuides=false');
    }

    await fs.remove(tmpDir2);
  });
});

describe('Upgrade from v1.4.x (simulated)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-upgrade-1.4-'));

    // Simulate a v1.4.x installation (has Emma + Wade, 7 workflows)
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));

    await fs.writeFile(path.join(vortexDir, 'agents/contextualization-expert.md'), '# Emma v1.4');
    await fs.writeFile(path.join(vortexDir, 'agents/lean-experiments-specialist.md'), '# Wade v1.4');
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({
      version: '1.4.1',
      user_name: 'Bob',
      submodule_name: 'vortex',
      description: 'test',
      module: 'bme',
      output_folder: '_bmad/bme/_vortex/guides',
      agents: ['contextualization-expert', 'lean-experiments-specialist'],
      workflows: ['lean-persona', 'product-vision', 'contextualize-scope', 'mvp', 'lean-experiment', 'proof-of-concept', 'proof-of-value']
    }));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('detects v1.4.1 from config', () => {
    const version = versionDetector.getCurrentVersion(tmpDir);
    assert.equal(version, '1.4.1');
  });

  it('finds applicable migration for v1.4.1', () => {
    const migrations = registry.getMigrationsFor('1.4.1');
    assert.ok(migrations.length >= 1);
    assert.equal(migrations[0].name, '1.4.x-to-1.5.0');
    assert.equal(migrations[0].breaking, false);
  });

  it('refreshInstallation adds Isla and Max agents', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/agents/discovery-empathy-expert.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/agents/learning-decision-expert.md')));
  });

  it('preserves user_name after upgrade', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    assert.equal(config.user_name, 'Bob');
  });

  it('updates config to include all 4 agents and 13 workflows', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

    assert.ok(config.agents.includes('discovery-empathy-expert'));
    assert.ok(config.agents.includes('learning-decision-expert'));
    assert.ok(config.workflows.length >= 13, 'should have at least 13 workflows');
  });

  it('installs Wave 2 workflows', async () => {
    const workflowsDir = path.join(tmpDir, '_bmad/bme/_vortex/workflows');
    const wave2Workflows = ['empathy-map', 'user-interview', 'user-discovery', 'learning-card', 'pivot-patch-persevere', 'vortex-navigation'];

    for (const wf of wave2Workflows) {
      assert.ok(
        fs.existsSync(path.join(workflowsDir, wf, 'workflow.md')),
        `${wf}/workflow.md should exist after upgrade`
      );
    }
  });
});

describe('Config merge preserves migration history', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-history-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex'));

    // Config with existing migration history
    const config = {
      version: '1.3.0',
      submodule_name: 'vortex',
      description: 'test',
      module: 'bme',
      output_folder: '_bmad-output',
      agents: ['contextualization-expert'],
      workflows: [],
      migration_history: [{
        timestamp: '2026-01-01T00:00:00Z',
        from_version: '1.0.5',
        to_version: '1.3.0',
        migrations_applied: ['1.0.x-to-1.3.0']
      }]
    };
    await fs.writeFile(
      path.join(tmpDir, '_bmad/bme/_vortex/config.yaml'),
      yaml.dump(config)
    );
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('preserves existing migration_history after refresh', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

    assert.ok(Array.isArray(config.migration_history));
    assert.ok(config.migration_history.length >= 1);
    assert.equal(config.migration_history[0].from_version, '1.0.5');
  });
});

describe('Upgrade from v1.7.x (simulated)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-upgrade-1.7-'));

    // Simulate a v1.7.x installation (all 7 agents, 22 workflows)
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));

    await fs.writeFile(path.join(vortexDir, 'agents/contextualization-expert.md'), '# Emma v1.7');
    await fs.writeFile(path.join(vortexDir, 'agents/lean-experiments-specialist.md'), '# Wade v1.7');
    await fs.writeFile(path.join(vortexDir, 'agents/discovery-empathy-expert.md'), '# Isla v1.7');
    await fs.writeFile(path.join(vortexDir, 'agents/learning-decision-expert.md'), '# Max v1.7');
    await fs.writeFile(path.join(vortexDir, 'agents/research-convergence-specialist.md'), '# Mila v1.7');
    await fs.writeFile(path.join(vortexDir, 'agents/hypothesis-engineer.md'), '# Liam v1.7');
    await fs.writeFile(path.join(vortexDir, 'agents/production-intelligence-specialist.md'), '# Noah v1.7');

    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({
      version: '1.7.1',
      user_name: 'Charlie',
      submodule_name: '_vortex',
      description: 'Vortex Pattern',
      module: 'bme',
      output_folder: '_bmad-output/vortex-artifacts',
      agents: [
        'contextualization-expert', 'lean-experiments-specialist',
        'discovery-empathy-expert', 'learning-decision-expert',
        'research-convergence-specialist', 'hypothesis-engineer',
        'production-intelligence-specialist'
      ],
      workflows: [
        'lean-persona', 'product-vision', 'contextualize-scope',
        'empathy-map', 'user-interview', 'user-discovery',
        'mvp', 'lean-experiment', 'proof-of-concept',
        'proof-of-value', 'learning-card', 'pivot-patch-persevere',
        'vortex-navigation', 'research-convergence', 'pivot-resynthesis',
        'pattern-mapping', 'hypothesis-engineering', 'assumption-mapping',
        'experiment-design', 'signal-interpretation', 'behavior-analysis',
        'production-monitoring'
      ]
    }));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('detects v1.7.1 from config', () => {
    const version = versionDetector.getCurrentVersion(tmpDir);
    assert.equal(version, '1.7.1');
  });

  it('finds applicable migrations for v1.7.1 (chains to 2.0.x)', () => {
    const migrations = registry.getMigrationsFor('1.7.1');
    assert.equal(migrations.length, 2);
    assert.equal(migrations[0].name, '1.7.x-to-2.0.0');
    assert.equal(migrations[0].breaking, true);
    assert.equal(migrations[1].name, '2.0.x-to-3.1.0');
  });

  it('reports breaking changes for v1.7.1', () => {
    const changes = registry.getBreakingChanges('1.7.1');
    assert.equal(changes.length, 1);
    assert.ok(changes[0].includes('rename') || changes[0].includes('Convoke'), 'should describe the rename');
  });

  it('refreshInstallation preserves user_name', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

    assert.equal(config.user_name, 'Charlie');
  });

  it('refreshInstallation updates config version to current package', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    const pkg = require('../../package.json');

    assert.equal(config.version, pkg.version);
  });

  it('preserves _bmad/ directory structure after refresh', async () => {
    assert.ok(fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/config.yaml')));
    assert.ok(fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/agents')));
    assert.ok(fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex/workflows')));
  });

  it('preserves all 7 agents after refresh', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

    assert.ok(config.agents.length >= 7, 'should have at least 7 agents');
    assert.ok(config.agents.includes('contextualization-expert'));
    assert.ok(config.agents.includes('production-intelligence-specialist'));
  });
});
