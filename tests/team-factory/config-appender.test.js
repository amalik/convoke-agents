const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { appendConfigAgent } = require('../../_bmad/bme/_team-factory/lib/writers/config-appender');

function buildTestConfig() {
  return {
    submodule_name: '_test-team',
    description: 'Test team module',
    module: 'bme',
    output_folder: '{project-root}/_bmad-output/test-team-artifacts',
    agents: ['alpha-analyzer', 'beta-builder'],
    workflows: ['data-analysis', 'component-building'],
    version: '1.0.0',
    user_name: '{user}',
    communication_language: 'en',
    party_mode_enabled: true,
    core_module: 'bme',
  };
}

// === Happy path ===

describe('appendConfigAgent — happy path', () => {
  let tmpDir, configPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-cfgapp-'));
    configPath = path.join(tmpDir, 'config.yaml');
    await fs.writeFile(configPath, yaml.dump(buildTestConfig()), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('appends new agent to config agents array', async () => {
    const result = await appendConfigAgent('gamma-guardian', configPath);

    assert.equal(result.success, true);
    assert.deepEqual(result.errors, []);

    const config = yaml.load(await fs.readFile(configPath, 'utf8'));
    assert.ok(config.agents.includes('gamma-guardian'));
    assert.ok(config.agents.includes('alpha-analyzer'), 'existing agents preserved');
    assert.ok(config.agents.includes('beta-builder'), 'existing agents preserved');
    assert.equal(config.agents.length, 3);
  });
});

// === Idempotency ===

describe('appendConfigAgent — idempotency', () => {
  let tmpDir, configPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-cfgapp-'));
    configPath = path.join(tmpDir, 'config.yaml');
    await fs.writeFile(configPath, yaml.dump(buildTestConfig()), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('skips when agent already in config', async () => {
    const result = await appendConfigAgent('alpha-analyzer', configPath);

    assert.equal(result.success, true);
    assert.equal(result.skipped, 'agent already in config');
  });
});

// === File not found ===

describe('appendConfigAgent — file not found', () => {
  it('fails when config does not exist', async () => {
    const result = await appendConfigAgent('gamma-guardian', '/nonexistent/config.yaml');

    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('does not exist'));
  });
});

// === Invalid YAML ===

describe('appendConfigAgent — invalid YAML', () => {
  let tmpDir, configPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-cfgapp-'));
    configPath = path.join(tmpDir, 'config.yaml');
    await fs.writeFile(configPath, '{ invalid yaml: [', 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails on unparseable YAML', async () => {
    const result = await appendConfigAgent('gamma-guardian', configPath);

    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('Cannot parse'));
  });
});

// === Missing agents array ===

describe('appendConfigAgent — missing agents array', () => {
  let tmpDir, configPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-cfgapp-'));
    configPath = path.join(tmpDir, 'config.yaml');
    await fs.writeFile(configPath, yaml.dump({ submodule_name: '_test' }), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when agents array is missing', async () => {
    const result = await appendConfigAgent('gamma-guardian', configPath);

    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('missing agents array'));
  });
});

// === Input validation ===

describe('appendConfigAgent — input validation', () => {
  it('fails with empty agent ID', async () => {
    const result = await appendConfigAgent('', '/fake/path');

    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('newAgentId is required'));
  });
});

// === Atomic write ===

describe('appendConfigAgent — atomic write', () => {
  let tmpDir, configPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-cfgapp-'));
    configPath = path.join(tmpDir, 'config.yaml');
    await fs.writeFile(configPath, yaml.dump(buildTestConfig()), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('does not leave .tmp file after successful write', async () => {
    await appendConfigAgent('gamma-guardian', configPath);

    assert.equal(await fs.pathExists(configPath + '.tmp'), false);
  });
});
