const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const configMerger = require('../../scripts/update/lib/config-merger');
const { silenceConsole, restoreConsole } = require('../helpers');

// === mergeConfig negative paths ===

describe('mergeConfig: corrupted existing config', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-merge-neg-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('falls back to defaults when existing config is invalid YAML', async () => {
    const configPath = path.join(tmpDir, 'bad.yaml');
    await fs.writeFile(configPath, '{{{ not: valid: yaml [[[', 'utf8');

    silenceConsole();
    const merged = await configMerger.mergeConfig(configPath, '1.5.0', {
      agents: ['emma']
    });
    restoreConsole();

    assert.equal(merged.version, '1.5.0');
    assert.deepEqual(merged.agents, ['emma']);
    assert.ok(merged.submodule_name, 'should seed default submodule_name');
  });

  it('falls back to defaults when existing config is empty file', async () => {
    const configPath = path.join(tmpDir, 'empty.yaml');
    await fs.writeFile(configPath, '', 'utf8');

    silenceConsole();
    const merged = await configMerger.mergeConfig(configPath, '1.5.0', {
      agents: ['emma']
    });
    restoreConsole();

    assert.equal(merged.version, '1.5.0');
    assert.ok(merged.submodule_name, 'should seed defaults');
  });

  it('handles config that parses to null', async () => {
    const configPath = path.join(tmpDir, 'null.yaml');
    await fs.writeFile(configPath, '---\nnull\n', 'utf8');

    silenceConsole();
    const merged = await configMerger.mergeConfig(configPath, '1.5.0', {
      agents: ['emma']
    });
    restoreConsole();

    assert.equal(merged.version, '1.5.0');
  });
});

// === validateConfig negative paths ===

describe('validateConfig: edge cases', () => {
  it('rejects config with agents as string', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '1.0.0', output_folder: 'o',
      agents: 'not-an-array',
      workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('agents must be an array')));
  });

  it('rejects config with workflows as object', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '1.0.0', output_folder: 'o',
      agents: [],
      workflows: { bad: true }
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('workflows must be an array')));
  });

  it('rejects config with migration_history as object', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '1.0.0', output_folder: 'o',
      agents: [], workflows: [],
      migration_history: { not: 'array' }
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('migration_history must be an array')));
  });

  it('rejects version with only major.minor', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '1.0', output_folder: 'o',
      agents: [], workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Invalid version format')));
  });

  // Story v63-4-2b: regex extended to accept semver pre-release suffixes like `1.0.0-beta`
  // (previously rejected as "alpha characters"). This negative case now covers a still-invalid
  // pre-release: special characters outside the semver-allowed [0-9A-Za-z.-] alphabet.
  it('rejects version with invalid pre-release characters', () => {
    const config = {
      submodule_name: 'v', description: 'd', module: 'm',
      version: '1.0.0-beta!', output_folder: 'o',
      agents: [], workflows: []
    };
    const result = configMerger.validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Invalid version format')));
  });

  it('reports all missing fields at once', () => {
    const result = configMerger.validateConfig({});
    assert.equal(result.valid, false);
    // Should report all 7 required fields
    assert.ok(result.errors.length >= 7, `expected >=7 errors, got ${result.errors.length}`);
    assert.ok(result.errors.some(e => e.includes('submodule_name')));
    assert.ok(result.errors.some(e => e.includes('version')));
    assert.ok(result.errors.some(e => e.includes('agents')));
    assert.ok(result.errors.some(e => e.includes('workflows')));
  });
});

// === extractUserPreferences edge cases ===

describe('extractUserPreferences: edge cases', () => {
  it('returns empty for undefined input', () => {
    const prefs = configMerger.extractUserPreferences({});
    assert.deepEqual(prefs, {});
  });

  it('does not extract output_folder when it matches default', () => {
    const prefs = configMerger.extractUserPreferences({
      output_folder: '{project-root}/_bmad-output/vortex-artifacts'
    });
    assert.equal(prefs.output_folder, undefined);
  });

  it('extracts output_folder when customized', () => {
    const prefs = configMerger.extractUserPreferences({
      output_folder: '/custom/path'
    });
    assert.equal(prefs.output_folder, '/custom/path');
  });

  it('preserves party_mode_enabled=false (falsy value)', () => {
    const prefs = configMerger.extractUserPreferences({ party_mode_enabled: false });
    assert.equal(prefs.party_mode_enabled, false);
  });

  it('preserves empty migration_history array', () => {
    const prefs = configMerger.extractUserPreferences({ migration_history: [] });
    assert.deepEqual(prefs.migration_history, []);
  });
});
