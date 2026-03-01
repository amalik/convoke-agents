'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');

const {
  createTempDir,
  createValidInstallation,
  runScript,
  PACKAGE_ROOT
} = require('../helpers');

const SCRIPT_PATH = path.join(PACKAGE_ROOT, 'scripts/update/bmad-version.js');
const PKG_VERSION = require('../../package.json').version;

// ─── main() Status Branches ────────────────────────────────────

describe('bmad-version CLI — status branches', () => {
  it('shows "Not in a BMAD project" when no _bmad/ directory exists', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(stdout.includes('Not in a BMAD project'), `stdout should contain "Not in a BMAD project", got: ${stdout.slice(0, 200)}`);
      assert.ok(stdout.includes('bmad-install-agents'), 'should suggest install command');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows "Not installed" for fresh scenario (_bmad/ exists but no _vortex/)', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad'));
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(stdout.includes('Not installed'), `stdout should contain "Not installed", got: ${stdout.slice(0, 200)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows "Partial installation" when _vortex/ exists but config.yaml is missing', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex'));
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(stdout.includes('Partial installation'), `stdout should contain "Partial installation", got: ${stdout.slice(0, 300)}`);
      assert.ok(stdout.includes('installation error'), 'should mention installation error');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows "Partial installation" when config.yaml has no version field and guessVersion returns null', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      // Create a complete installation scenario (config.yaml + required agents + workflows)
      // but with no version field, and no deprecated/empathy-map dirs to prevent guessVersion match
      const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
      const agentsDir = path.join(vortexDir, 'agents');
      const workflowsDir = path.join(vortexDir, 'workflows');
      await fs.ensureDir(agentsDir);
      await fs.ensureDir(workflowsDir);

      // Config with NO version field
      const config = { submodule_name: '_vortex', description: 'test', module: 'bme' };
      await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump(config), 'utf8');

      // Required agent files so scenario = 'complete'
      await fs.writeFile(path.join(agentsDir, 'contextualization-expert.md'), '# test', 'utf8');
      await fs.writeFile(path.join(agentsDir, 'lean-experiments-specialist.md'), '# test', 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      // scenario is 'complete' but currentVersion is null → hits the !currentVersion path
      assert.ok(stdout.includes('Partial installation'), `should hit !currentVersion path showing "Partial installation", got: ${stdout.slice(0, 300)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows "Corrupted installation" when required agent files are missing', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      // Remove one of the two required agent files checked by detectInstallationScenario
      await fs.remove(path.join(vortexDir, 'agents/contextualization-expert.md'));

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(stdout.includes('Corrupted installation'), `stdout should contain "Corrupted installation", got: ${stdout.slice(0, 300)}`);
      assert.ok(stdout.includes('missing required files'), 'should mention missing required files');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows "Up to date" when installed version matches package version', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      // Set version to match package.json
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = PKG_VERSION;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(stdout.includes('Up to date'), `stdout should contain "Up to date", got: ${stdout.slice(0, 300)}`);
      assert.ok(stdout.includes(PKG_VERSION), 'should display the version number');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows "Update available" when installed version is older than package', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '1.0.0';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(stdout.includes('Update available'), `stdout should contain "Update available", got: ${stdout.slice(0, 300)}`);
      assert.ok(stdout.includes('bmad-update'), 'should suggest bmad-update command');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows downgrade warning when installed version is newer than package', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '99.0.0';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(stdout.includes('older than installed'), `stdout should contain "older than installed", got: ${stdout.slice(0, 300)}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });
});

// ─── getMigrationHistory() — Tested Indirectly via CLI Output ───

describe('bmad-version CLI — migration history display', () => {
  it('displays migration history when config.yaml contains migration_history', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = PKG_VERSION;
      config.migration_history = [
        {
          from_version: '1.4.1',
          to_version: '1.5.0',
          timestamp: '2025-06-15T10:00:00Z',
          migrations_applied: ['migrate-config-v1.5']
        }
      ];
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(stdout.includes('Migration History'), `should display "Migration History" header, got: ${stdout.slice(0, 500)}`);
      assert.ok(stdout.includes('1.4.1'), 'should display from_version');
      assert.ok(stdout.includes('1.5.0'), 'should display to_version');
      assert.ok(stdout.includes('migrate-config-v1.5'), 'should display applied migration name');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('does not display migration history when config.yaml has no migration_history', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = PKG_VERSION;
      // Ensure no migration_history key
      delete config.migration_history;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(!stdout.includes('Migration History'), 'should NOT display Migration History header');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('does not display migration history when migration_history is empty array', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = PKG_VERSION;
      config.migration_history = [];
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      assert.ok(!stdout.includes('Migration History'), 'should NOT display Migration History header for empty array');
    } finally {
      await fs.remove(tmpDir);
    }
  });
});

// ─── Edge Cases ─────────────────────────────────────────────────

describe('bmad-version CLI — edge cases', () => {
  it('handles malformed version string gracefully (treated as older version)', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = 'not-a-version';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      // compareVersions treats non-semver as older → "Update available"
      assert.ok(stdout.includes('not-a-version'), 'should display the malformed version string');
      assert.ok(stdout.includes('Update available'), 'should show Update available for malformed version');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('handles config.yaml with no version field and guessVersion returns non-null', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      // createValidInstallation creates workflows/empathy-map/ which causes
      // guessVersionFromFileStructure to return '1.0.0' — so currentVersion is NOT null.
      // This test verifies the script handles the fallback version gracefully.
      const vortexDir = await createValidInstallation(tmpDir);
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      delete config.version;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      // guessVersion returns '1.0.0' from empathy-map dir → hits update-available branch
      assert.ok(stdout.includes('Update available'), 'should show Update available with guessed version 1.0.0');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('handles invalid YAML in config.yaml — falls through to Partial installation', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
      const agentsDir = path.join(vortexDir, 'agents');
      const workflowsDir = path.join(vortexDir, 'workflows');
      await fs.ensureDir(agentsDir);
      await fs.ensureDir(workflowsDir);

      // Required agents for scenario = 'complete' (not 'corrupted')
      await fs.writeFile(path.join(agentsDir, 'contextualization-expert.md'), '# test', 'utf8');
      await fs.writeFile(path.join(agentsDir, 'lean-experiments-specialist.md'), '# test', 'utf8');

      // Write corrupted YAML — getCurrentVersion catches parse error,
      // guessVersion returns null (no empathy-map/deprecated dirs) → currentVersion is null
      await fs.writeFile(path.join(vortexDir, 'config.yaml'), '{{{{invalid yaml: [[[', 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      // scenario = 'complete' but !currentVersion → hits Partial installation branch
      assert.ok(stdout.includes('Partial installation'), 'should show Partial installation when YAML is unparseable');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('handles migration history with malformed entries — renders with undefined fields', async () => {
    const tmpDir = await createTempDir('bmad-ver-');
    try {
      const vortexDir = await createValidInstallation(tmpDir);
      const configPath = path.join(vortexDir, 'config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = PKG_VERSION;
      // Entries missing timestamp, from_version, to_version
      config.migration_history = [
        { from_version: '1.0.0' },  // missing to_version and timestamp
        { timestamp: 'invalid' },    // missing versions
        {}                            // completely empty
      ];
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0, 'should exit 0');
      // Script renders history even with missing fields (shows "undefined")
      assert.ok(stdout.includes('Migration History'), 'should still display Migration History header');
      assert.ok(stdout.includes('Up to date'), 'should show Up to date for matching version');
    } finally {
      await fs.remove(tmpDir);
    }
  });
});

// ─── Cross-Platform Path Handling ───────────────────────────────

describe('bmad-version — cross-platform path validation', () => {
  it('bmad-version.js uses path.join for all filesystem path construction (no raw concatenation)', async () => {
    const source = await fs.readFile(
      path.join(PACKAGE_ROOT, 'scripts/update/bmad-version.js'), 'utf8'
    );

    const lines = source.split('\n');
    const violations = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip comments, empty lines, require() statements, shebang
      if (!line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
      if (line.includes('require(')) continue;
      if (line.startsWith('#!')) continue;

      // Flag raw string concatenation: variable + '/' + path
      // path.join('foo', '_bmad/bar') is OK — path.join normalizes internally
      if (line.match(/\+\s*['"`][/\\]/) || line.match(/['"`][/\\]\s*\+/)) {
        if (!line.includes('console.log') && !line.includes('chalk')) {
          violations.push(`Line ${i + 1}: raw path concatenation: ${line.slice(0, 100)}`);
        }
      }
      // Flag template literals with embedded path separators: `${var}/_bmad/...`
      if (line.match(/`[^`]*\$\{[^}]+\}[/\\][^`]*`/)) {
        if (!line.includes('console.log') && !line.includes('chalk')) {
          violations.push(`Line ${i + 1}: template literal path construction: ${line.slice(0, 100)}`);
        }
      }
    }

    assert.equal(violations.length, 0, `Found raw path concatenation in bmad-version.js:\n${violations.join('\n')}`);
    // Verify path.join is used (positive check)
    assert.ok(source.includes('path.join'), 'bmad-version.js should use path.join for path construction');
  });

  it('version-detector.js and utils.js use path module for path construction', async () => {
    const vdSource = await fs.readFile(
      path.join(PACKAGE_ROOT, 'scripts/update/lib/version-detector.js'), 'utf8'
    );
    const utilsSource = await fs.readFile(
      path.join(PACKAGE_ROOT, 'scripts/update/lib/utils.js'), 'utf8'
    );

    // Both files should import and use the path module
    assert.ok(vdSource.includes("require('path')"), 'version-detector.js should import path module');
    assert.ok(utilsSource.includes("require('path')"), 'utils.js should import path module');

    // Check that path.join is actually used for path construction
    assert.ok(vdSource.includes('path.join'), 'version-detector.js should use path.join');
    assert.ok(utilsSource.includes('path.join') || utilsSource.includes('path.resolve'),
      'utils.js should use path.join or path.resolve');
  });
});
