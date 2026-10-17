const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const { spawn } = require('node:child_process');

const { assessUpdate } = require('../../scripts/update/convoke-update');
const {
  createTempDir,
  createValidInstallation,
  createInstallation,
  runScript,
  PACKAGE_ROOT
} = require('../helpers');

const SCRIPT_PATH = path.join(PACKAGE_ROOT, 'scripts/update/convoke-update.js');

/**
 * Run a script with input piped to stdin.
 * Used for testing interactive prompts (confirm dialog).
 * @param {string} script - Absolute path to script
 * @param {string[]} args - CLI arguments
 * @param {string} input - Text to write to stdin
 * @param {object} opts - Options: cwd, timeout
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>}
 */
function runScriptWithInput(script, args, input, opts = {}) {
  const cwd = opts.cwd || PACKAGE_ROOT;
  const timeout = opts.timeout || 15000;

  return new Promise((resolve) => {
    const child = spawn('node', [script, ...args], { cwd });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve({ exitCode: null, stdout, stderr });
    }, timeout);

    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, stdout, stderr });
    });

    // Write input after brief delay so readline is ready
    setTimeout(() => {
      child.stdin.write(input);
      child.stdin.end();
    }, 200);
  });
}

// ─── assessUpdate Unit Tests ──────────────────────────────────

describe('assessUpdate', () => {
  it('returns no-project when projectRoot is null', () => {
    const result = assessUpdate(null);
    assert.equal(result.action, 'no-project');
  });

  it('returns fresh for empty directory', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'fresh');
      assert.equal(result.scenario, 'fresh');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('returns broken for partial installation', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      // Create _bmad dir with vortex but no config
      await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex'));
      const result = assessUpdate(tmpDir);
      assert.ok(
        result.action === 'broken' || result.action === 'no-version',
        `expected broken or no-version, got ${result.action}`
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('returns up-to-date when versions match', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);

      // Set version to match current package
      const pkg = require('../../package.json');
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = pkg.version;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'up-to-date');
      assert.equal(result.currentVersion, pkg.version);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('returns downgrade when installed > package', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);

      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '99.99.99';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'downgrade');
      assert.equal(result.currentVersion, '99.99.99');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('returns upgrade with migrations for v1.4.x', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);

      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '1.4.1';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'upgrade');
      assert.equal(result.currentVersion, '1.4.1');
      assert.ok(Array.isArray(result.migrations));
      assert.ok(result.migrations.length >= 1);
      assert.ok(Array.isArray(result.breakingChanges));
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('returns upgrade with breaking changes for v1.0.x', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);

      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '1.0.5';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'upgrade');
      assert.ok(result.breakingChanges.length > 0, 'v1.0.x should have breaking changes');
      assert.ok(result.migrations.some(m => m.breaking), 'should include breaking migration');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── Edge Cases (AC #4) ──────────────────────────────────

  it('returns no-version when config has no version field', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      delete config.version;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      // Remove empathy-map dir so guessVersionFromFileStructure returns null
      // (empathy-map is a current workflow but also matches the v1.0.0 guess heuristic)
      await fs.remove(path.join(tmpDir, '_bmad/bme/_vortex/workflows/empathy-map'));

      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'no-version');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('returns refresh-only when version has no applicable migrations', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      // Use a version with no registered migration (0.9.x has no entry in registry)
      config.version = '0.9.0';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'refresh-only');
      assert.equal(result.currentVersion, '0.9.0');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('handles malformed config.yaml gracefully', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      // Write invalid YAML that will cause a parse error
      fs.writeFileSync(configPath, ': invalid: yaml: {{{{', 'utf8');

      const result = assessUpdate(tmpDir);
      // With malformed YAML, detectInstallationScenario may return 'corrupted' (→ broken)
      // or getCurrentVersion fallback via guessVersionFromFileStructure (→ upgrade)
      const validActions = ['upgrade', 'broken', 'no-version'];
      assert.ok(
        validActions.includes(result.action),
        `malformed config should result in ${validActions.join('/')}, got: ${result.action}`
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('handles empty config.yaml', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      fs.writeFileSync(configPath, '', 'utf8');

      // Remove empathy-map so guessVersion returns null instead of '1.0.0'
      await fs.remove(path.join(tmpDir, '_bmad/bme/_vortex/workflows/empathy-map'));

      const result = assessUpdate(tmpDir);
      // yaml.load('') returns undefined → config falsy → guessVersion → null → no-version
      assert.equal(result.action, 'no-version');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('returns upgrade without duplicate migrations for v1.0.x', async () => {
    const tmpDir = await createTempDir('bmad-assess-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '1.0.5';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'upgrade');

      // Verify no duplicate migration names
      const names = result.migrations.map(m => m.name);
      const uniqueNames = [...new Set(names)];
      assert.equal(names.length, uniqueNames.length, 'should have no duplicate migrations');
    } finally {
      await fs.remove(tmpDir);
    }
  });
});

// ─── main() CLI Integration Tests ─────────────────────────

describe('convoke-update CLI (main)', () => {

  // ─── Scenario Tests ──────────────────────────────────

  it('exits 1 with error for no-project scenario', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('Not in a Convoke project'), 'should mention missing project');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('exits 0 with install suggestion for fresh installation', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      // Create _bmad dir only (no _vortex) so findProjectRoot finds it
      await fs.ensureDir(path.join(tmpDir, '_bmad'));

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('No previous installation'), 'should indicate fresh state');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('exits 1 for broken installation', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      // Create partial installation: _vortex exists but no config
      await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex'));

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(
        stdout.includes('incomplete') || stdout.includes('corrupted'),
        'should indicate broken installation'
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('exits 0 for no-version scenario', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      delete config.version;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      // Remove empathy-map so guessVersion returns null instead of '1.0.0'
      await fs.remove(path.join(tmpDir, '_bmad/bme/_vortex/workflows/empathy-map'));

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('Could not detect'), 'should mention version detection failure');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('exits 0 for up-to-date installation', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createValidInstallation(tmpDir);
      const pkg = require('../../package.json');
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = pkg.version;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('up to date'), 'should confirm up-to-date status');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('exits 1 for downgrade scenario', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '99.99.99';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('DOWNGRADE'), 'should warn about downgrade');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows update plan for refresh-only scenario', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      // Use a version with no registered migration (0.9.x has no entry in registry)
      config.version = '0.9.0';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const { stdout } = await runScript(SCRIPT_PATH, ['--dry-run'], { cwd: tmpDir });
      assert.ok(stdout.includes('No migration deltas needed'), 'should indicate refresh-only');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── CLI Flag Tests ──────────────────────────────────

  it('previews migrations with --dry-run and exits 0', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--dry-run'], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('DRY RUN'), 'should indicate dry run mode');
      assert.ok(stdout.includes('Migration Plan'), 'should show migration plan');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('skips confirmation with --yes flag', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--yes'], { cwd: tmpDir });
      // Migration should run without prompting and complete successfully
      assert.equal(exitCode, 0, 'migration with --yes should complete successfully');
      assert.ok(stdout.includes('Migration Plan'), 'should show migration plan');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('accepts -y shorthand for --yes', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['-y', '--dry-run'], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('DRY RUN'), 'should accept -y shorthand');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('shows verbose output with --verbose flag', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH, ['--dry-run', '--verbose'], { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);
      assert.ok(stdout.length > 0, 'should produce output with verbose flag');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('accepts -v shorthand for --verbose', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const { exitCode } = await runScript(
        SCRIPT_PATH, ['--dry-run', '-v'], { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── Confirmation Tests ──────────────────────────────

  it('exits 0 when user rejects migration with n', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const { exitCode, stdout } = await runScriptWithInput(
        SCRIPT_PATH, [], 'n\n', { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('cancelled'), 'should indicate cancellation');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('runs migration when user confirms with y', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const { exitCode, stdout } = await runScriptWithInput(
        SCRIPT_PATH, [], 'y\n', { cwd: tmpDir }
      );
      // Migration confirmed with 'y' should complete successfully
      assert.equal(exitCode, 0, 'confirmed migration should complete successfully');
      assert.ok(stdout.includes('Migration Plan'), 'should show migration plan before confirm');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── Breaking Changes Display ──────────────────────────

  it('displays breaking changes warning for v1.0.x upgrade', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.0.5');

      const { stdout } = await runScriptWithInput(
        SCRIPT_PATH, [], 'n\n', { cwd: tmpDir }
      );
      assert.ok(stdout.includes('BREAKING CHANGES'), 'should display breaking changes warning');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── Partial Failure Recovery (AC #4 edge case) ─────

  it('handles partial migration failure with error exit', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      // Replace agents directory with a file to cause refreshInstallation failure
      // This simulates a partial failure: migration starts but filesystem state is corrupted
      const agentsDir = path.join(tmpDir, '_bmad/bme/_vortex/agents');
      await fs.remove(agentsDir);
      await fs.writeFile(agentsDir, 'not-a-directory', 'utf8');

      const { exitCode } = await runScript(SCRIPT_PATH, ['--yes'], { cwd: tmpDir });
      assert.equal(exitCode, 1, 'should exit 1 when migration fails mid-execution');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── Manifest Merge Preservation (AC #3) ────────────

  it('updates config version and agents after upgrade with --yes', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const { exitCode } = await runScript(SCRIPT_PATH, ['--yes'], { cwd: tmpDir });
      assert.equal(exitCode, 0);

      // Verify config updated to current package version with all core agents
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const updatedConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
      const pkg = require('../../package.json');
      assert.equal(updatedConfig.version, pkg.version, 'should update to package version');
      assert.ok(updatedConfig.agents.length >= 7, 'should include all core agents');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // AC #3 / NFR15 — user-added agent and ordering preservation
  it('preserves user-added custom agents after upgrade', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      // Inject custom user agents into config
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.agents.push('my-custom-agent', 'tea-test-architect');
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      await runScript(SCRIPT_PATH, ['--yes'], { cwd: tmpDir });

      const updatedConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
      assert.ok(updatedConfig.agents.includes('my-custom-agent'), 'should preserve user-added agent');
      assert.ok(updatedConfig.agents.includes('tea-test-architect'), 'should preserve TEA agent');
      assert.ok(updatedConfig.agents.length >= 9, 'should have core + user agents');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('maintains agent ordering after merge', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      // Inject custom agent into config
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.agents.push('user-custom-agent');
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      await runScript(SCRIPT_PATH, ['--yes'], { cwd: tmpDir });

      const updatedConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
      const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');

      // Core agents appear first in canonical order
      for (let i = 0; i < AGENT_IDS.length; i++) {
        assert.equal(updatedConfig.agents[i], AGENT_IDS[i], `core agent ${AGENT_IDS[i]} should be at index ${i}`);
      }
      // User agent appended after core agents
      assert.equal(updatedConfig.agents[AGENT_IDS.length], 'user-custom-agent', 'user agent should be appended after core agents');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('does not duplicate core agents after upgrade', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.4.1');

      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');

      await runScript(SCRIPT_PATH, ['--yes'], { cwd: tmpDir });

      // Verify no duplicate agent entries
      const updatedConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
      const uniqueAgents = [...new Set(updatedConfig.agents)];
      assert.equal(
        updatedConfig.agents.length,
        uniqueAgents.length,
        'should have no duplicate agents after upgrade'
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── Cross-Platform Path Handling (AC #5) ──────────

  it('finds project root from nested subdirectory', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createValidInstallation(tmpDir);
      const pkg = require('../../package.json');
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = pkg.version;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      // Create nested subdirectory and run from there
      const nestedDir = path.join(tmpDir, 'src', 'components', 'deep');
      await fs.ensureDir(nestedDir);

      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: nestedDir });
      // findProjectRoot walks up from nestedDir → finds _bmad at tmpDir
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('up to date'), 'should find project root from nested dir');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── Cross-Platform Path Handling — process.platform mocking (AC #5) ──

  it('assessUpdate works with mocked process.platform win32', async () => {
    const tmpDir = await createTempDir('bmad-plat-');
    const originalPlatformDesc = Object.getOwnPropertyDescriptor(process, 'platform');
    try {
      await createValidInstallation(tmpDir);
      const pkg = require('../../package.json');
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = pkg.version;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'up-to-date', 'should work with mocked win32 platform');
    } finally {
      Object.defineProperty(process, 'platform', originalPlatformDesc);
      await fs.remove(tmpDir);
    }
  });

  it('assessUpdate works with mocked process.platform darwin', async () => {
    const tmpDir = await createTempDir('bmad-plat-');
    const originalPlatformDesc = Object.getOwnPropertyDescriptor(process, 'platform');
    try {
      await createValidInstallation(tmpDir);
      const pkg = require('../../package.json');
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = pkg.version;
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'up-to-date', 'should work with mocked darwin platform');
    } finally {
      Object.defineProperty(process, 'platform', originalPlatformDesc);
      await fs.remove(tmpDir);
    }
  });

  it('source code uses path module for cross-platform path handling', () => {
    const utilsSource = fs.readFileSync(
      path.join(PACKAGE_ROOT, 'scripts/update/lib/utils.js'), 'utf8'
    );
    // Verify findProjectRoot uses path module functions (cross-platform by design)
    assert.ok(utilsSource.includes('path.join('), 'utils.js should use path.join');
    assert.ok(utilsSource.includes('path.dirname('), 'utils.js should use path.dirname');
    assert.ok(utilsSource.includes('path.parse('), 'utils.js should use path.parse');

    // Verify convoke-update.js imports utils for path operations
    const updateSource = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(
      updateSource.includes("require('./lib/utils')"),
      'convoke-update.js should import utils for path operations'
    );
  });

  // ─── Banner & Output ──────────────────────────────────

  it('shows header banner on every invocation', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      const { stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.ok(stdout.includes('Convoke Update Manager'), 'should display header banner');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ─── v1.7.x → 2.0.0 Migration Path (Story 1.7) ────

  it('assessUpdate returns upgrade with breaking migration for v1.7.1', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.7.1');

      const result = assessUpdate(tmpDir);
      assert.equal(result.action, 'upgrade');
      assert.ok(Array.isArray(result.migrations));
      assert.ok(result.migrations.some(m => m.name === '1.7.x-to-2.0.0'), 'should include 1.7.x-to-2.0.0 migration');
      assert.ok(result.breakingChanges.length > 0, 'should have breaking changes');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('displays breaking changes warning for v1.7.x upgrade', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '1.7.1');

      const { stdout } = await runScriptWithInput(
        SCRIPT_PATH, [], 'n\n', { cwd: tmpDir }
      );
      assert.ok(stdout.includes('BREAKING CHANGES'), 'should display breaking changes warning');
      assert.ok(stdout.includes('Migration Plan'), 'should show migration plan');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // Story v63-1a-6 AC4: migration guide link printed alongside breaking changes
  // when the migration chain lands on a -to-4.0.0 hop. Uses 3.2.0 (not 3.3.0
  // which equals the current package.json version → 'up-to-date' action).
  it('links the migration guide in breaking-changes output for v3.x upgrade', async () => {
    const tmpDir = await createTempDir('bmad-cli-');
    try {
      await createInstallation(tmpDir, '3.2.0');

      const { stdout } = await runScriptWithInput(
        SCRIPT_PATH, [], 'n\n', { cwd: tmpDir }
      );
      assert.ok(stdout.includes('BREAKING CHANGES'), 'should display breaking changes warning');
      assert.ok(
        stdout.includes('https://github.com/amalik/convoke-agents/blob/main/docs/migration/3.x-to-4.0.md'),
        'should link the migration guide from breaking-changes output for 3.x→4.0 upgrade'
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });
});

// ─── T248: a dry run shows what the real run would back up and replace ───────────

describe('T248: --dry-run shows the backup scope and the whole refresh', () => {
  // Both dry-run branches used to exit before printBackupScope(), so the command whose only job is
  // to show what will happen showed less than the confirmation prompt of the real run. Each test
  // reaches one branch, and asserts on text that only the backup printer and the refresh plan emit.
  const BACKUP_HEADER = 'Backed up first, and restorable from _bmad-output/.backups/:';
  const NOT_BACKED_UP = 'NOT in this backup';
  const REFRESH_SCOPE = 'Most of _bmad/bme/ is replaced from the package';

  async function dryRunIn(setup) {
    const tmpDir = await createTempDir('bmad-t248-');
    try {
      await setup(tmpDir);
      return await runScript(SCRIPT_PATH, ['--dry-run'], { cwd: tmpDir });
    } finally {
      await fs.remove(tmpDir);
    }
  }

  // Runs a POSIX shell pipeline in `cwd` and resolves with its output and exit code. A hung
  // pipeline is killed and reported as a failure rather than hanging the suite.
  function runPipeline(cwd, script, extraEnv = {}, deadlineMs = 30000) {
    return new Promise((resolve, reject) => {
      // `detached` makes the shell lead its own process group, so a timeout can kill every process
      // in the pipeline. Killing the shell alone leaves node and head holding the pipe open.
      const child = spawn('/bin/sh', ['-c', script], {
        cwd, detached: true, stdio: ['ignore', 'pipe', 'ignore'],
        env: { ...process.env, NODE: process.execPath, SCRIPT: SCRIPT_PATH, ...extraEnv },
      });
      const chunks = [];
      const started = Date.now();
      let settled = false;
      const timer = setTimeout(() => {
        settled = true;
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* group already gone */ }
        child.stdout.destroy();
        reject(new Error(`pipeline did not finish within ${deadlineMs} ms`));
      }, deadlineMs);
      child.on('error', err => { if (settled) return; settled = true; clearTimeout(timer); reject(err); });
      child.stdout.on('data', c => chunks.push(c));
      child.on('close', code => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ code, out: Buffer.concat(chunks).toString('utf8'), ms: Date.now() - started });
      });
    });
  }

  // These pipe tests need a POSIX shell. CI runs on Linux only; a Windows contributor skips them.
  const NO_SH = process.platform === 'win32' ? 'needs /bin/sh, which Windows does not have' : false;

  it('the migration dry run prints what is backed up and what a refresh replaces', async () => {
    const { exitCode, stdout } = await dryRunIn((dir) => createInstallation(dir, '1.4.1'));
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Migration Plan'), 'fixture: this is the migration branch');
    assert.ok(stdout.includes(BACKUP_HEADER), 'the backup scope is missing from the migration dry run');
    assert.ok(stdout.includes('plus every file the migrations listed above declare'),
      'the migration branch must print the migration variant of the backup scope');
    assert.ok(stdout.includes(NOT_BACKED_UP), 'the dry run must also say what is not backed up');
    assert.ok(stdout.includes(REFRESH_SCOPE), 'the refresh plan must state the whole scope');
    assert.ok(stdout.includes('DRY RUN — no changes will be made'), 'the migration dry run must close with the banner');
  });

  it('a migration dry run whose reader closes early exits 0 without a broken-pipe crash', { skip: NO_SH }, async () => {
    // `convoke-update --dry-run | head -1` exited 1 with an unhandled EPIPE once main() stopped
    // calling process.exit(): Node reports the broken pipe after main() returns. Seen 3 of 3 on the
    // migration branch.
    const tmpDir = await createTempDir('bmad-t248-epipe-');
    try {
      await createInstallation(tmpDir, '1.4.1');
      // The pipe only breaks if output is still being written when head exits, i.e. if the run
      // prints more than one pipe buffer. Measure the whole run first, so a smaller fixture fails
      // loudly instead of letting this test pass without exercising the handler.
      const full = await runPipeline(tmpDir, '"$NODE" "$SCRIPT" --dry-run 2>/dev/null');
      assert.ok(full.out.includes('Migration Plan'), 'fixture: this is the migration branch');
      assert.ok(Buffer.byteLength(full.out) > 65536,
        `fixture: the run must print more than one pipe buffer to break the pipe, printed ${Buffer.byteLength(full.out)} bytes`);

      const codeFile = path.join(tmpDir, 'code.txt');
      const { code, out } = await runPipeline(tmpDir,
        '{ "$NODE" "$SCRIPT" --dry-run 2>"$ERR"; echo $? > "$CODE"; } | head -1',
        { ERR: path.join(tmpDir, 'err.txt'), CODE: codeFile });
      assert.equal(code, 0, 'fixture: the pipeline itself must succeed');
      assert.ok(out.length > 0, 'fixture: head received the first line');
      assert.ok(fs.existsSync(codeFile), 'fixture: convoke-update never reported its exit code');
      const stderr = fs.readFileSync(path.join(tmpDir, 'err.txt'), 'utf8');
      assert.ok(!/EPIPE/.test(stderr), `convoke-update crashed on the closed pipe:\n${stderr.slice(0, 300)}`);
      assert.equal(fs.readFileSync(path.join(tmpDir, 'code.txt'), 'utf8').trim(), '0', 'convoke-update itself must exit 0');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('a dry run with both streams piped into a reader that closes early exits 0', { skip: NO_SH }, async () => {
    // `2>&1 | head` shares one pipe between stdout and stderr, and the command writes a warning to
    // stderr. With only stdout guarded, stderr's EPIPE still crashed it with exit 1, 3 of 3.
    const tmpDir = await createTempDir('bmad-t248-epipe2-');
    try {
      await createInstallation(tmpDir, '1.4.1');
      const codeFile = path.join(tmpDir, 'code.txt');
      const { code } = await runPipeline(tmpDir,
        '{ "$NODE" "$SCRIPT" --dry-run 2>&1; echo $? > "$CODE"; } | head -1', { CODE: codeFile });
      assert.equal(code, 0, 'fixture: the pipeline itself must succeed');
      assert.ok(fs.existsSync(codeFile), 'fixture: convoke-update never reported its exit code');
      assert.equal(fs.readFileSync(codeFile, 'utf8').trim(), '0', 'convoke-update itself must exit 0');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('a real run whose output reader is gone answers its own prompt no, instead of waiting unseen', { skip: NO_SH }, async () => {
    // Once stdout's EPIPE is ignored, the [y/N] prompt is written to nowhere. stdin here is a pipe
    // that stays open for 20 s, so a prompt still waiting would hold the run that long; failing
    // closed must end it at once and change nothing.
    const tmpDir = await createTempDir('bmad-t248-prompt-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '0.9.0';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      // stdin is held open by a background sleep that the command's side of the pipeline kills as
      // soon as convoke-update exits -- otherwise the shell would wait out the sleep and every run
      // would take 20 s whether or not the prompt was cancelled.
      const codeFile = path.join(tmpDir, 'code.txt');
      const { code, ms } = await runPipeline(tmpDir,
        '( sleep 20 & echo $! > "$SLEEP"; wait ) | { "$NODE" "$SCRIPT" 2>/dev/null; echo $? > "$CODE"; kill "$(cat "$SLEEP")" 2>/dev/null; } | head -1',
        { CODE: codeFile, SLEEP: path.join(tmpDir, 'sleep.pid') }, 60000);

      assert.equal(code, 0, 'fixture: the pipeline itself must succeed');
      assert.ok(ms < 10000, `the prompt waited for input nobody could see: the run took ${ms} ms`);
      assert.equal(yaml.load(fs.readFileSync(configPath, 'utf8')).version, '0.9.0', 'nothing may be applied');
      assert.ok(!fs.existsSync(path.join(tmpDir, '_bmad-output', '.backups')) ||
        fs.readdirSync(path.join(tmpDir, '_bmad-output', '.backups')).length === 0, 'no backup may be taken');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('a long dry run reaches a slow reader whole, instead of being cut at one pipe buffer', { skip: NO_SH }, async () => {
    // The refresh-only fixture prints every changelog entry since 0.9.0, far more than one pipe
    // buffer. main() used to end with process.exit(0), which drops output still queued for a pipe:
    // CI's Linux runner lost the tail under Node 22, and a reader that drains late loses everything
    // after the first 64 KiB on any platform. The delay below IS the condition under test -- a
    // reader that is not keeping up -- not a wait standing in for an event.
    const tmpDir = await createTempDir('bmad-t248-pipe-');
    try {
      await createValidInstallation(tmpDir);
      const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '0.9.0';
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      // A shell pipeline is the reader: `sleep` holds the pipe undrained while the command finishes.
      // An in-process paused stream does not reproduce it, because Node keeps reading the child's
      // pipe into its own buffer regardless.
      const { code, out } = await runPipeline(tmpDir,
        '{ "$NODE" "$SCRIPT" --dry-run 2>/dev/null; echo "NODE_EXIT=$?"; } | (sleep 1; cat)');

      assert.equal(code, 0, 'fixture: the pipeline itself must succeed');
      assert.ok(out.includes('No migration deltas needed'), 'fixture: this is the refresh-only branch');
      // The pipeline's own exit code is cat's; the command reports its own into the stream instead.
      assert.ok(out.includes('NODE_EXIT=0'), 'convoke-update itself must exit 0');
      assert.ok(out.includes('DRY RUN — no changes will be made'), `the tail was lost: received ${out.length} characters`);
      assert.ok(out.length > 70000, `fixture: output must exceed a pipe buffer to test anything, got ${out.length} characters`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  it('the refresh-only dry run prints what is backed up and what a refresh replaces', async () => {
    const { exitCode, stdout } = await dryRunIn(async (dir) => {
      await createValidInstallation(dir);
      const configPath = path.join(dir, '_bmad/bme/_vortex/config.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      config.version = '0.9.0'; // no registered migration from here, so this is the refresh-only branch
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
    });
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('No migration deltas needed'), 'fixture: this is the refresh-only branch');
    assert.ok(stdout.includes(BACKUP_HEADER), 'the backup scope is missing from the refresh-only dry run');
    assert.ok(stdout.includes(NOT_BACKED_UP), 'the dry run must also say what is not backed up');
    assert.ok(stdout.includes(REFRESH_SCOPE), 'the refresh plan must be shown on this branch too');
  });
});
