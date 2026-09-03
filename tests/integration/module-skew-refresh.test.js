'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');

const { createTempDir, removeTempDir, runScript } = require('../helpers');
const { getPackageVersion } = require('../../scripts/update/lib/utils');
const { detectRepairableSkew } = require('../../scripts/lib/bme-modules');

const PACKAGE_ROOT = path.join(__dirname, '..', '..');
const UPDATE_CLI = path.join(PACKAGE_ROOT, 'scripts', 'update', 'convoke-update.js');
const PKG = getPackageVersion();

/**
 * BUG-17's close, end to end: routing to a refresh is only worth anything if the refresh
 * actually re-stamps. Without this, dead-branching every stamp in `refreshInstallation`
 * would leave the routing tests green.
 */
describe('BUG-17 — the refresh repairs the skew it was routed for', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await createTempDir('convoke-skew-repair-');
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
    const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const cfgPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const cfg = yaml.load(await fs.readFile(cfgPath, 'utf8'));
    cfg.version = PKG;
    await fs.writeFile(cfgPath, yaml.dump(cfg), 'utf8');

    const gyre = path.join(tmpDir, '_bmad/bme/_gyre/config.yaml');
    const gyreCfg = yaml.load(await fs.readFile(gyre, 'utf8'));
    gyreCfg.version = '1.0.0';
    await fs.writeFile(gyre, yaml.dump(gyreCfg), 'utf8');
  });

  after(async () => { await removeTempDir(tmpDir); });

  it('names the skewed modules in the plan and leaves none behind', async () => {
    assert.deepEqual(detectRepairableSkew(tmpDir).map(m => m.name), ['_gyre'],
      'precondition: the skew is real before the refresh');

    const { exitCode, stdout } = await runScript(UPDATE_CLI, ['--yes'], {
      cwd: tmpDir,
      timeout: 120000,
    });

    assert.equal(exitCode, 0, stdout);
    // The plan must not render `From: 4.0.1 / To: 4.0.1` in red-to-green, which reads as a
    // bug in the tool: on this path currentVersion === targetVersion.
    assert.match(stdout, /Skewed:\s+_gyre: 1\.0\.0 \(behind\)/,
      'the plan names the modules and their state — `behind` and `divergent` are not the same thing');
    assert.deepEqual(detectRepairableSkew(tmpDir), [],
      'the refresh ran but did not re-stamp');
  });
});
