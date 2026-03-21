const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { runScript, PACKAGE_ROOT } = require('../helpers');
const { AGENTS } = require('../../scripts/update/lib/agent-registry');

const projectRoot = PACKAGE_ROOT;

function run(script, args = []) {
  return runScript(script, args);
}

describe('index.js entry point', () => {
  it('runs without error and shows version', async () => {
    const { exitCode, stdout } = await run(path.join(projectRoot, 'index.js'));
    assert.equal(exitCode, 0);

    const pkg = require('../../package.json');
    assert.ok(stdout.includes(pkg.version), 'should show package version');
  });

  it('shows all agent names (registry-driven)', async () => {
    const { stdout } = await run(path.join(projectRoot, 'index.js'));
    for (const agent of AGENTS) {
      assert.ok(stdout.includes(agent.name), `should mention ${agent.name}`);
    }
  });

  it('shows available commands', async () => {
    const { stdout } = await run(path.join(projectRoot, 'index.js'));
    assert.ok(stdout.includes('convoke-install-vortex'), 'should list primary install command');
    assert.ok(stdout.includes('convoke-update'), 'should list update command');
    assert.ok(stdout.includes('convoke-doctor'), 'should list doctor command');
  });
});

describe('convoke-doctor CLI', () => {
  it('runs and produces check results', async () => {
    const { stdout } = await run(path.join(projectRoot, 'scripts/convoke-doctor.js'));
    assert.ok(stdout.includes('Convoke Doctor'), 'should show doctor header');
    assert.ok(stdout.includes('Project root'), 'should check project root');
    assert.ok(stdout.includes('config'), 'should check config');
    assert.ok(stdout.includes('agents'), 'should check agents');
  });
});

describe('convoke-version CLI', () => {
  it('runs without error from project root', async () => {
    const { exitCode, stdout } = await run(path.join(projectRoot, 'scripts/update/convoke-version.js'));
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Convoke'), 'should show project name');
  });

  it('shows installed and package versions', async () => {
    const { stdout } = await run(path.join(projectRoot, 'scripts/update/convoke-version.js'));
    const pkg = require('../../package.json');
    assert.ok(stdout.includes(pkg.version), 'should show package version');
  });
});

describe('convoke-update CLI (dry-run)', () => {
  it('runs with --dry-run without error', async () => {
    const { exitCode, stdout } = await run(
      path.join(projectRoot, 'scripts/update/convoke-update.js'),
      ['--dry-run']
    );
    assert.equal(exitCode, 0);
    // Should report up-to-date or show dry-run plan
    assert.ok(
      stdout.includes('up to date') || stdout.includes('DRY RUN') || stdout.includes('Already') || stdout.includes('No migrations'),
      'should show up-to-date, dry-run, or no-migrations info'
    );
  });
});

describe('convoke-version smoke test', () => {
  it('does not crash when run from project root', async () => {
    const { exitCode } = await run(
      path.join(projectRoot, 'scripts/update/convoke-version.js'),
      [],
    );
    assert.equal(exitCode, 0);
  });
});
