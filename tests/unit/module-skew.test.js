'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');

const { createTempDir, removeTempDir, createValidInstallation } = require('../helpers');
const { getPackageVersion, compareVersions } = require('../../scripts/update/lib/utils');
const {
  detectRepairableSkew,
  isManagedByInstaller,
} = require('../../scripts/lib/bme-modules');
const { assessUpdate } = require('../../scripts/update/convoke-update');
const { isSourceCheckout } = require('../../scripts/update/lib/refresh-installation');
const { checkVersionConsistency } = require('../../scripts/convoke-doctor');

const PACKAGE_ROOT = path.join(__dirname, '..', '..');

const PKG = getPackageVersion();

/** An installation whose module versions are exactly as specified. */
async function fixture(modules = {}, vortexVersion = PKG) {
  const dir = await createTempDir('convoke-skew-');
  await createValidInstallation(dir);
  const cfgPath = path.join(dir, '_bmad/bme/_vortex/config.yaml');
  const cfg = yaml.load(await fs.readFile(cfgPath, 'utf8'));
  cfg.version = vortexVersion;
  await fs.writeFile(cfgPath, yaml.dump(cfg), 'utf8');

  for (const [name, body] of Object.entries(modules)) {
    const modDir = path.join(dir, '_bmad/bme', name);
    await fs.ensureDir(modDir);
    await fs.writeFile(path.join(modDir, 'config.yaml'), body, 'utf8');
  }
  return dir;
}
const at = v => `version: ${v}\n`;

// ─────────────────────────────────────────────────────────────────
// BUG-17, exactly as reported.
//
// `convoke-doctor` checks every `_bmad/bme/*/config.yaml`; `getCurrentVersion()` read only
// `_vortex`. An install whose Vortex was current but whose siblings were behind reported
// skew forever, because this gate returned `up-to-date` and exited before
// `refreshInstallation` — which stamps every module — was reached.
// ─────────────────────────────────────────────────────────────────
describe('BUG-17 — the update gate sees what doctor sees', () => {
  it('routes a behind sibling to a refresh instead of reporting the install current', async () => {
    const dir = await fixture({ _gyre: at('1.0.0') });
    try {
      // Pre-fix this returned `up-to-date`: _vortex is at the package version, and that was
      // the only config the gate read.
      const assessment = assessUpdate(dir);
      assert.equal(assessment.action, 'refresh-only');
      assert.deepEqual(assessment.skew.map(m => m.name), ['_gyre']);
    } finally { await removeTempDir(dir); }
  });

  it('shares the COMPARATOR, not only the module set', async () => {
    // Sharing the set alone would leave doctor reporting a mismatch the gate cannot see:
    // `compareVersions` drops build metadata (SemVer §10) while the strings differ.
    assert.equal(compareVersions(`${PKG}+abc`, PKG), 0, 'precondition: equal precedence');
    assert.notEqual(`${PKG}+abc`, PKG, 'precondition: different strings');

    const dir = await fixture({ _enhance: at(`${PKG}+abc`) });
    try {
      const assessment = assessUpdate(dir);
      assert.equal(assessment.action, 'refresh-only');
      assert.equal(assessment.skew[0].state, 'divergent');
    } finally { await removeTempDir(dir); }
  });

  it('reads installed_version, exactly as convoke-doctor does', async () => {
    // Doctor reads `version || installed_version`. The first cut of bme-modules read only
    // `.version`, so a module declaring `installed_version` was visible to doctor and invisible
    // to this gate: doctor reported skew, `convoke-update` said up-to-date, and a refresh would
    // have repaired it. BUG-17's symptom, latent inside BUG-17's own fix. Found by the narrow
    // review pass at 90ca7de0. Nothing in the repo writes the key today — this pins the parity
    // so the drift cannot come back silently if something starts to.
    const dir = await fixture({ _gyre: 'installed_version: 1.0.0\n' });
    try {
      const assessment = assessUpdate(dir);
      assert.equal(assessment.action, 'refresh-only',
        'doctor sees this module; the gate must see it too');
      assert.deepEqual(assessment.skew.map(m => m.name), ['_gyre']);
    } finally { await removeTempDir(dir); }
  });

  it('a fully current install is still reported current', async () => {
    const dir = await fixture({ _gyre: at(PKG) });
    try {
      assert.equal(assessUpdate(dir).action, 'up-to-date');
    } finally { await removeTempDir(dir); }
  });
});

// ─────────────────────────────────────────────────────────────────
// `repairable` is a claim about `refreshInstallation`. Routing a module it cannot stamp
// makes convoke-update take the lock, cut a backup, change nothing and report a problem it
// cannot solve — BUG-17's own shape, rebuilt in its fix. Found in review, not in testing.
// ─────────────────────────────────────────────────────────────────
describe('only modules the installer can stamp are routed', () => {
  it('a module the package does not ship is never routed', async () => {
    const dir = await fixture({ _legacy: at('1.0.0') });
    try {
      assert.equal(isManagedByInstaller('_legacy'), false);
      assert.deepEqual(detectRepairableSkew(dir), []);
      assert.equal(assessUpdate(dir).action, 'up-to-date');
    } finally { await removeTempDir(dir); }
  });

  it('requires BOTH a declared stamp path and a present package source', () => {
    assert.equal(isManagedByInstaller('_gyre'), true);
    assert.equal(isManagedByInstaller('_team-factory'), true, 'EXTRA_BME_AGENTS submodules count');
    assert.equal(isManagedByInstaller('_portability'), false, 'shipped, but nothing stamps it');
    assert.equal(isManagedByInstaller('_nope'), false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Deliberately out of scope. These are NOT closed by this change; each has a backlog row.
// The assertions pin current behaviour so a future fix has a baseline to move.
// ─────────────────────────────────────────────────────────────────
describe('out of scope, pinned so the boundary is visible', () => {
  it('an unorderable version is not routed (BUG-18 / T116)', async () => {
    for (const bad of ['main', 'v4.0.1', '4.0']) {
      const dir = await fixture({ _gyre: at(bad) });
      try {
        assert.deepEqual(detectRepairableSkew(dir), [],
          `${bad} cannot be ordered, so no refresh is promised for it`);
      } finally { await removeTempDir(dir); }
    }
  });

  it('a module ahead of the package is not routed (T38)', async () => {
    const dir = await fixture({ _artifacts: at('99.0.0') });
    try {
      assert.deepEqual(detectRepairableSkew(dir), [],
        'advising an update for an unpublished version is an E404');
      assert.equal(assessUpdate(dir).action, 'up-to-date');
    } finally { await removeTempDir(dir); }
  });

  it('_vortex is left to getCurrentVersion, never double-routed', async () => {
    const dir = await fixture({}, '1.0.0');
    try {
      assert.deepEqual(detectRepairableSkew(dir), []);
      assert.notEqual(assessUpdate(dir).action, 'up-to-date', 'the scalar read handles it');
    } finally { await removeTempDir(dir); }
  });

  it('classifies against a supplied package version', async () => {
    const dir = await fixture({ _gyre: at('2.0.0') });
    try {
      assert.equal(detectRepairableSkew(dir, { packageVersion: '9.0.0' })[0].state, 'behind');
      assert.deepEqual(detectRepairableSkew(dir, { packageVersion: '1.0.0' }), [], 'ahead is not routed');
    } finally { await removeTempDir(dir); }
  });
});

// ─────────────────────────────────────────────────────────────────
// T114 — no finding may advise a command that cannot change the thing it is about.
//
// In the package's own checkout `refreshInstallation` skips every config write, so a module's
// version stamp cannot change. Doctor advised `convoke-update` for five modules anyway, and the
// update reported success having changed nothing. Reproducible with no fixture:
// `node scripts/convoke-doctor.js` in this repo.
//
// SCOPE, measured rather than assumed: only the config writes are guarded. Skill-wrapper
// generation and taxonomy seeding still run in a source checkout (12 of 27 actions performed),
// so doctor's OTHER three `convoke-update` advisories are correct there and must stay untouched.
// ─────────────────────────────────────────────────────────────────
describe('T114 — advice is suppressed only where the remedy cannot run', () => {
  it('isSourceCheckout identifies the package tree and nothing else', () => {
    assert.equal(isSourceCheckout(PACKAGE_ROOT), true);
    assert.equal(isSourceCheckout('/tmp'), false);
    assert.equal(isSourceCheckout(undefined), false, 'a missing root is not a source checkout');
  });

  it('the gate routes no skew in a source checkout, whatever the configs say', () => {
    // Independent of this repo's actual module versions: the early return precedes any read.
    assert.deepEqual(detectRepairableSkew(PACKAGE_ROOT), []);
  });

  it('doctor reports the mismatch but withdraws the update advice', () => {
    // `modules` is injected, so this asserts the BRANCH rather than this repo's version drift.
    const modules = [{ name: '_gyre', configPath: '/x/config.yaml', config: { version: '1.0.0' } }];
    const finding = checkVersionConsistency(PACKAGE_ROOT, modules);

    assert.equal(finding.passed, false, 'the mismatch is real and still reported');
    assert.equal(finding.softWarning, true,
      'a permanent hard failure with no available action is the shape T114 removes');
    assert.match(finding.warning, /_gyre: 1\.0\.0/, 'the module is still named');
    assert.ok(!/convoke-update/.test(finding.fix),
      'the advice was false here: a refresh in this tree stamps nothing');
  });

  it('outside a source checkout the advice is unchanged', () => {
    const modules = [{ name: '_gyre', configPath: '/x/config.yaml', config: { version: '1.0.0' } }];
    const finding = checkVersionConsistency('/not/the/package/root', modules);

    assert.equal(finding.passed, false);
    assert.ok(!finding.softWarning, 'a real install CAN repair this, so it stays a hard failure');
    assert.match(finding.fix, /convoke-update/);
  });
});
