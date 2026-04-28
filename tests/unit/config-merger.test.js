const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const configMerger = require('../../scripts/update/lib/config-merger');

describe('extractUserPreferences', () => {
  it('returns empty object for default config', () => {
    const prefs = configMerger.extractUserPreferences({});
    assert.deepEqual(prefs, {});
  });

  it('preserves custom user_name', () => {
    const prefs = configMerger.extractUserPreferences({ user_name: 'Alice' });
    assert.equal(prefs.user_name, 'Alice');
  });

  it('ignores default placeholder user_name', () => {
    const prefs = configMerger.extractUserPreferences({ user_name: '{user}' });
    assert.equal(prefs.user_name, undefined);
  });

  it('preserves non-English communication_language', () => {
    const prefs = configMerger.extractUserPreferences({ communication_language: 'fr' });
    assert.equal(prefs.communication_language, 'fr');
  });

  it('preserves English language setting', () => {
    const prefs = configMerger.extractUserPreferences({ communication_language: 'en' });
    assert.equal(prefs.communication_language, 'en');
  });

  it('preserves party_mode_enabled', () => {
    const prefs = configMerger.extractUserPreferences({ party_mode_enabled: false });
    assert.equal(prefs.party_mode_enabled, false);
  });

  it('preserves migration_history', () => {
    const history = [{ timestamp: '2026-01-01', from_version: '1.0.0', to_version: '1.4.0' }];
    const prefs = configMerger.extractUserPreferences({ migration_history: history });
    assert.deepEqual(prefs.migration_history, history);
  });
});

describe('validateConfig', () => {
  it('validates a complete config', () => {
    const config = {
      submodule_name: 'vortex',
      description: 'test',
      module: 'bme',
      version: '1.4.0',
      output_folder: '_bmad-output',
      agents: [],
      workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('reports missing required fields', () => {
    const result = configMerger.validateConfig({});
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 7);
  });

  it('rejects invalid version format', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: 'bad', output_folder: 'o', agents: [], workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Invalid version format')));
  });

  // Story v63-4-2b: regex extended to accept semver pre-release suffixes (e.g., 4.0.0-rc.1).
  // Required for Convoke 4.0 RC release-engineering.
  it('accepts semver pre-release version (e.g., 4.0.0-rc.1)', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '4.0.0-rc.1', output_folder: 'o', agents: [], workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('accepts semver pre-release version with alpha tag (e.g., 4.0.0-alpha.0)', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '4.0.0-alpha.0', output_folder: 'o', agents: [], workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('still rejects incomplete version (e.g., 4.0)', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '4.0', output_folder: 'o', agents: [], workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Invalid version format')));
  });

  it('still rejects version with too many parts (e.g., 4.0.0.0)', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '4.0.0.0', output_folder: 'o', agents: [], workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Invalid version format')));
  });

  it('rejects non-array agents', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '1.0.0', output_folder: 'o', agents: 'not-array', workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.ok(result.errors.some(e => e.includes('agents must be an array')));
  });

  it('validates migration_history structure', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '1.0.0', output_folder: 'o', agents: [], workflows: [],
      migration_history: [{ incomplete: true }]
    };
    const result = configMerger.validateConfig(config);
    assert.ok(result.errors.some(e => e.includes('migration_history[0]')));
  });
});

describe('mergeConfig', () => {
  let tmpDir;
  let configPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-merge-'));
    configPath = path.join(tmpDir, 'config.yaml');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('creates config from scratch when no existing config', async () => {
    const merged = await configMerger.mergeConfig(
      path.join(tmpDir, 'nonexistent.yaml'),
      '1.4.0',
      { agents: ['emma', 'wade'] }
    );
    assert.equal(merged.version, '1.4.0');
    assert.deepEqual(merged.agents, ['emma', 'wade']);
    assert.ok(Array.isArray(merged.migration_history));
  });

  it('preserves user preferences during merge', async () => {
    const existing = {
      version: '1.3.0',
      user_name: 'Alice',
      communication_language: 'fr',
      agents: ['old-agent']
    };
    await fs.writeFile(configPath, yaml.dump(existing));

    const merged = await configMerger.mergeConfig(configPath, '1.4.0', {
      agents: ['emma', 'wade']
    });

    assert.equal(merged.version, '1.4.0');
    assert.equal(merged.user_name, 'Alice');
    assert.equal(merged.communication_language, 'fr');
    // User-added agents (not in AGENT_IDS) are preserved after canonical ones
    assert.deepEqual(merged.agents, ['emma', 'wade', 'old-agent']);
  });
});

describe('mergeConfig — fresh install seeding', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-seed-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('seeds agents from registry when no updates.agents provided', async () => {
    const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
    const merged = await configMerger.mergeConfig(
      path.join(tmpDir, 'nonexistent.yaml'),
      '1.5.2',
      {} // no agents in updates
    );
    assert.deepEqual(merged.agents, AGENT_IDS);
    assert.equal(merged.agents.length, 7);
  });

  it('seeds workflows from registry when no updates.workflows provided', async () => {
    const { WORKFLOW_NAMES } = require('../../scripts/update/lib/agent-registry');
    const merged = await configMerger.mergeConfig(
      path.join(tmpDir, 'nonexistent.yaml'),
      '1.5.2',
      {} // no workflows in updates
    );
    assert.deepEqual(merged.workflows, WORKFLOW_NAMES);
    assert.equal(merged.workflows.length, 22);
  });

  it('updates.agents overrides default seeding', async () => {
    const merged = await configMerger.mergeConfig(
      path.join(tmpDir, 'nonexistent.yaml'),
      '1.5.2',
      { agents: ['custom-agent'] }
    );
    assert.deepEqual(merged.agents, ['custom-agent']);
  });

  it('updates.workflows overrides default seeding', async () => {
    const merged = await configMerger.mergeConfig(
      path.join(tmpDir, 'nonexistent.yaml'),
      '1.5.2',
      { workflows: ['custom-workflow'] }
    );
    assert.deepEqual(merged.workflows, ['custom-workflow']);
  });

  it('description reflects all 7 Vortex streams', async () => {
    const merged = await configMerger.mergeConfig(
      path.join(tmpDir, 'nonexistent.yaml'),
      '1.5.2',
      {}
    );
    assert.ok(merged.description.includes('Contextualize'));
    assert.ok(merged.description.includes('Empathize'));
    assert.ok(merged.description.includes('Synthesize'));
    assert.ok(merged.description.includes('Hypothesize'));
    assert.ok(merged.description.includes('Externalize'));
    assert.ok(merged.description.includes('Sensitize'));
    assert.ok(merged.description.includes('Systematize'));
  });
});

describe('validateConfig — agent count acceptance', () => {
  const baseConfig = {
    submodule_name: '_vortex',
    description: 'test',
    module: 'bme',
    version: '1.5.2',
    output_folder: '_bmad-output'
  };

  it('accepts config with 4 agents (pre-migration)', () => {
    const config = { ...baseConfig, agents: ['a', 'b', 'c', 'd'], workflows: ['w1'] };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, true);
  });

  it('accepts config with 7 agents (post-migration)', () => {
    const config = { ...baseConfig, agents: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], workflows: ['w1'] };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, true);
  });

  it('accepts config with empty agents array', () => {
    const config = { ...baseConfig, agents: [], workflows: [] };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, true);
  });

  it('rejects agents with non-string items', () => {
    const config = { ...baseConfig, agents: [123], workflows: [] };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('agents[0]')));
  });
});

describe('addMigrationHistory', () => {
  it('creates migration_history if not present', () => {
    const config = {};
    configMerger.addMigrationHistory(config, '1.0.5', '1.4.0', ['1.0.x-to-1.3.0']);
    assert.ok(Array.isArray(config.migration_history));
    assert.equal(config.migration_history.length, 1);
    assert.equal(config.migration_history[0].from_version, '1.0.5');
    assert.equal(config.migration_history[0].to_version, '1.4.0');
  });

  it('appends to existing migration_history', () => {
    const config = {
      migration_history: [{ timestamp: '2026-01-01', from_version: '1.0.0', to_version: '1.3.0', migrations_applied: [] }]
    };
    configMerger.addMigrationHistory(config, '1.3.0', '1.4.0', []);
    assert.equal(config.migration_history.length, 2);
  });
});

describe('writeConfig', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-write-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('writes valid YAML to disk', async () => {
    const configPath = path.join(tmpDir, 'out.yaml');
    const config = { version: '1.4.0', agents: ['emma'] };
    await configMerger.writeConfig(configPath, config);

    const content = await fs.readFile(configPath, 'utf8');
    const parsed = yaml.load(content);
    assert.equal(parsed.version, '1.4.0');
    assert.deepEqual(parsed.agents, ['emma']);
  });
});

// ── U8: excluded_agents ────────────────────────────────────────────────────

describe('readExcludedAgents', () => {
  let tmpDir;
  let originalWarn;
  let capturedWarnings;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-excluded-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  beforeEach(() => {
    capturedWarnings = [];
    originalWarn = console.warn;
    console.warn = (...args) => capturedWarnings.push(args.join(' '));
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  it('returns [] when file does not exist (no warning — ENOENT is expected on fresh installs)', () => {
    const result = configMerger.readExcludedAgents(path.join(tmpDir, 'missing.yaml'));
    assert.deepEqual(result, []);
    assert.equal(capturedWarnings.length, 0);
  });

  it('returns [] when field is absent', async () => {
    const configPath = path.join(tmpDir, 'no-field.yaml');
    await fs.writeFile(configPath, yaml.dump({ agents: ['a', 'b'] }));
    assert.deepEqual(configMerger.readExcludedAgents(configPath), []);
  });

  it('returns [] when field is not an array', async () => {
    const configPath = path.join(tmpDir, 'not-array.yaml');
    await fs.writeFile(configPath, yaml.dump({ excluded_agents: 'nope' }));
    assert.deepEqual(configMerger.readExcludedAgents(configPath), []);
  });

  it('returns [] and warns when YAML is malformed', async () => {
    const configPath = path.join(tmpDir, 'malformed.yaml');
    await fs.writeFile(configPath, '::: not yaml :::');
    assert.deepEqual(configMerger.readExcludedAgents(configPath), []);
    assert.equal(capturedWarnings.length, 1, 'malformed YAML should emit one warning');
    assert.match(capturedWarnings[0], /could not parse/);
  });

  it('returns [] and warns on non-ENOENT IO errors (e.g., EISDIR)', () => {
    // Pass a directory path — readFileSync throws EISDIR, not ENOENT.
    const result = configMerger.readExcludedAgents(tmpDir);
    assert.deepEqual(result, []);
    assert.equal(capturedWarnings.length, 1, 'non-ENOENT error should emit a warning');
    assert.match(capturedWarnings[0], /could not read/);
    assert.match(capturedWarnings[0], /EISDIR/);
  });

  it('returns the list when field is a string array', async () => {
    const configPath = path.join(tmpDir, 'valid.yaml');
    await fs.writeFile(
      configPath,
      yaml.dump({ excluded_agents: ['production-intelligence-specialist', 'learning-decision-expert'] })
    );
    assert.deepEqual(configMerger.readExcludedAgents(configPath), [
      'production-intelligence-specialist',
      'learning-decision-expert',
    ]);
  });

  it('filters non-string entries silently', async () => {
    const configPath = path.join(tmpDir, 'mixed.yaml');
    await fs.writeFile(
      configPath,
      yaml.dump({ excluded_agents: ['valid-id', null, 123, 'another-valid'] })
    );
    assert.deepEqual(configMerger.readExcludedAgents(configPath), ['valid-id', 'another-valid']);
  });
});

describe('mergeConfig — excluded_agents (U8)', () => {
  let tmpDir;
  let configPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-merge-excl-'));
    configPath = path.join(tmpDir, 'config.yaml');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('filters excluded agents from merged.agents', async () => {
    await fs.writeFile(configPath, yaml.dump({
      version: '3.1.0',
      agents: ['emma', 'wade', 'noah'],
      excluded_agents: ['noah'],
    }));

    const merged = await configMerger.mergeConfig(configPath, '3.2.0', {
      agents: ['emma', 'wade', 'noah'],
    });

    assert.ok(!merged.agents.includes('noah'), 'excluded agent should be filtered out');
    assert.ok(merged.agents.includes('emma'));
    assert.ok(merged.agents.includes('wade'));
  });

  it('preserves excluded_agents across the merge', async () => {
    await fs.writeFile(configPath, yaml.dump({
      version: '3.1.0',
      agents: ['emma'],
      excluded_agents: ['noah', 'max'],
    }));

    const merged = await configMerger.mergeConfig(configPath, '3.2.0', {
      agents: ['emma', 'noah', 'max'],
    });

    assert.deepEqual(merged.excluded_agents, ['noah', 'max']);
  });

  it('re-includes an agent when removed from excluded_agents on next merge', async () => {
    // First merge: noah excluded
    await fs.writeFile(configPath, yaml.dump({
      version: '3.1.0',
      agents: ['emma', 'wade'],
      excluded_agents: ['noah'],
    }));
    const firstMerge = await configMerger.mergeConfig(configPath, '3.2.0', {
      agents: ['emma', 'wade', 'noah'],
    });
    assert.ok(!firstMerge.agents.includes('noah'));

    // Operator removes noah from excluded_agents — simulate by writing a config without it
    await fs.writeFile(configPath, yaml.dump({
      version: '3.2.0',
      agents: firstMerge.agents,
      excluded_agents: [],
    }));
    const secondMerge = await configMerger.mergeConfig(configPath, '3.3.0', {
      agents: ['emma', 'wade', 'noah'],
    });

    assert.ok(secondMerge.agents.includes('noah'), 'agent should be restored when no longer excluded');
    assert.deepEqual(secondMerge.excluded_agents, []);
  });

  it('defaults excluded_agents to [] when field is missing from current config', async () => {
    await fs.writeFile(configPath, yaml.dump({
      version: '3.1.0',
      agents: ['contextualization-expert'],
      // no excluded_agents field
    }));

    const merged = await configMerger.mergeConfig(configPath, '3.2.0', {
      agents: ['contextualization-expert', 'discovery-empathy-expert'],
    });

    assert.deepEqual(merged.excluded_agents, []);
    assert.deepEqual(merged.agents, ['contextualization-expert', 'discovery-empathy-expert']);
  });

  it('ignores non-string entries in excluded_agents during filter', async () => {
    await fs.writeFile(configPath, yaml.dump({
      version: '3.1.0',
      agents: ['emma'],
      excluded_agents: ['noah', null, 123],
    }));

    const merged = await configMerger.mergeConfig(configPath, '3.2.0', {
      agents: ['emma', 'wade', 'noah'],
    });

    assert.ok(!merged.agents.includes('noah'));
    assert.deepEqual(merged.excluded_agents, ['noah']); // sanitized
  });

  it('applies exclusions even when updates.agents is not provided (P2 regression)', async () => {
    // Simulate a migration delta that only touches workflows — no updates.agents.
    // Before the fix, merged.agents would fall through from `defaults`/`current` unfiltered,
    // leaking the excluded agent back into the active list.
    const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
    await fs.writeFile(configPath, yaml.dump({
      version: '3.1.0',
      agents: AGENT_IDS, // current config has all canonical agents
      excluded_agents: ['production-intelligence-specialist'],
    }));

    const merged = await configMerger.mergeConfig(configPath, '3.2.0', {
      // deliberately no `agents` key
      workflows: ['some-workflow'],
    });

    assert.ok(!merged.agents.includes('production-intelligence-specialist'),
      'excluded agent must be filtered even when updates.agents is absent');
    assert.deepEqual(merged.excluded_agents, ['production-intelligence-specialist']);
  });
});
