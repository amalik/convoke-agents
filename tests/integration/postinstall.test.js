const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');
const { runScript, PACKAGE_ROOT, removeTempDir } = require('../helpers');

const postinstallScript = path.join(PACKAGE_ROOT, 'scripts/postinstall.js');

// Behavior coverage for postinstall lives in the fixture-based describes below
// (`fresh project`, `up-to-date installation`, `older installation detected`).
// Previous bare smoke tests that ran against PACKAGE_ROOT were removed because
// they turned any drift in the live repo into a CI failure — without actually
// adding coverage the fixture tests did not already provide.

describe('postinstall: fresh project (no _bmad)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-post-fresh-'));
  });

  after(async () => {
    await removeTempDir(tmpDir);
  });

  it('does not crash on fresh project', async () => {
    const { exitCode } = await runScript(postinstallScript, [], { cwd: tmpDir });
    assert.equal(exitCode, 0, 'postinstall should not crash on fresh project');
  });

  it('suggests install command on fresh project', async () => {
    const { stdout } = await runScript(postinstallScript, [], { cwd: tmpDir });
    assert.ok(
      stdout.includes('convoke-install') || stdout.includes('install'),
      'should suggest install command'
    );
  });
});

describe('postinstall: up-to-date installation', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-post-current-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));

    const pkg = require('../../package.json');
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({
      version: pkg.version,
      submodule_name: '_vortex',
      description: 'test',
      module: 'bme',
      output_folder: '_bmad-output',
      agents: ['contextualization-expert'],
      workflows: []
    }));
    await fs.writeFile(path.join(vortexDir, 'agents/contextualization-expert.md'), '# Emma');
  });

  after(async () => {
    await removeTempDir(tmpDir);
  });

  it('reports up to date when versions match', async () => {
    const { exitCode, stdout } = await runScript(postinstallScript, [], { cwd: tmpDir });
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('up to date'), 'should indicate up-to-date status');
  });
});

describe('postinstall: older installation detected', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-post-old-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));

    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({
      version: '1.0.5',
      submodule_name: '_vortex',
      description: 'test',
      module: 'bme',
      output_folder: '_bmad-output',
      agents: ['contextualization-expert'],
      workflows: []
    }));
    await fs.writeFile(path.join(vortexDir, 'agents/contextualization-expert.md'), '# Emma');
  });

  after(async () => {
    await removeTempDir(tmpDir);
  });

  it('detects upgrade and suggests convoke-update', async () => {
    const { exitCode, stdout } = await runScript(postinstallScript, [], { cwd: tmpDir });
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('UPGRADE') || stdout.includes('upgrade'), 'should detect upgrade');
    assert.ok(stdout.includes('convoke-update'), 'should suggest convoke-update');
  });
});
