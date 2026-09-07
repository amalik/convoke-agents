'use strict';

/**
 * The Portability module installs and its skills become invocable (story dist-2.6).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Before dist-2.6 there was NO install path for `_bmad/bme/_portability/`. The only generic
 * module loop iterates `EXTRA_BME_AGENTS` and is driven by the AGENT registry, so a module with
 * no agents was never visited. All four skills shipped in `files[]` to every operator and were
 * reachable by none of them — the standing finding `assert-installed-tree.js` reports, and the
 * defect ADR-004 C1/C2 define.
 *
 * These tests mirror `refresh-installation-artifacts.test.js`, because the fix was to make the
 * module look like the one that already worked rather than to add a sixth bespoke code path.
 *
 * THE TRAP THIS FILE GUARDS. The generator copies `SKILL.md` ALONE, never `workflow.md`. The
 * source SKILL.md therefore has to load its workflow by an ABSOLUTE `{project-root}` path; the
 * relative `[workflow.md](workflow.md)` these files shipped with would resolve inside
 * `.claude/skills/<name>/`, where no such file exists. Presence of the wrapper is necessary and
 * NOT sufficient (ADR-004 C4) — so the wrapper-content test below resolves the directive rather
 * than asserting the file exists.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const { PACKAGE_ROOT, createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

const MINIMAL_PM_MD = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
</agent>`;

/** Derived from the package config, never hardcoded — `derive-counts-from-source` (AC9). */
function declaredWorkflows() {
  const cfg = yaml.load(fs.readFileSync(path.join(PACKAGE_ROOT, '_bmad/bme/_portability/config.yaml'), 'utf8'));
  return (cfg.workflows || []).filter(w => w && w.standalone === true);
}

async function setupPortabilityTestDir() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-port-inst-'));
  await createValidInstallation(tmpDir);
  const pmDir = path.join(tmpDir, '_bmad/bmm/agents');
  await fs.ensureDir(pmDir);
  await fs.writeFile(path.join(pmDir, 'pm.md'), MINIMAL_PM_MD, 'utf8');
  return tmpDir;
}

describe('refreshInstallation — Portability directory copy', () => {
  let tmpDir;
  beforeEach(async () => { tmpDir = await setupPortabilityTestDir(); silenceConsole(); });
  afterEach(async () => { restoreConsole(); await fs.remove(tmpDir); });

  it('copies _portability/ from package to project, with every declared entry present', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const dir = path.join(tmpDir, '_bmad/bme/_portability');
    assert.ok(fs.existsSync(dir), '_portability/ should exist in target');
    assert.ok(fs.existsSync(path.join(dir, 'config.yaml')), 'config.yaml should exist');

    const declared = declaredWorkflows();
    assert.ok(declared.length > 0, 'config must declare at least one standalone workflow');
    for (const wf of declared) {
      assert.ok(fs.existsSync(path.join(dir, wf.entry)), `${wf.entry} should exist`);
      assert.ok(
        fs.existsSync(path.join(dir, 'workflows', wf.name, 'SKILL.md')),
        `${wf.name}/SKILL.md should exist`,
      );
    }
  });

  it('stamps version in _portability/config.yaml to match package version (I137)', async () => {
    // I137: _team-factory was the one module copied WITHOUT stamping, and a fresh successful
    // install then failed Convoke's own version-consistency check.
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const cfg = yaml.load(fs.readFileSync(path.join(tmpDir, '_bmad/bme/_portability/config.yaml'), 'utf8'));
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    assert.equal(cfg.version, pkg.version);
  });

  it('preserves EVERY config doc comment through the version stamp', async () => {
    // doc.set() rather than mergeConfig, precisely so the standalone:true rationale survives.
    // Counts rather than existence: the first version of this test asserted body.includes('#'),
    // which would have passed with all but one comment dropped. Review 2026-09-07.
    const srcBody = fs.readFileSync(
      path.join(PACKAGE_ROOT, '_bmad/bme/_portability/config.yaml'), 'utf8');
    const expected = srcBody.split('\n').filter(l => l.trim().startsWith('#')).length;
    assert.ok(expected > 0, 'the source config must carry doc comments for this test to mean anything');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const body = fs.readFileSync(path.join(tmpDir, '_bmad/bme/_portability/config.yaml'), 'utf8');
    const actual = body.split('\n').filter(l => l.trim().startsWith('#')).length;
    assert.equal(actual, expected, `expected all ${expected} doc comments to survive, found ${actual}`);
  });

  it('reports the Portability copy in the changes array', async () => {
    const changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('Refreshed Portability module')));
  });

  it('skips the copy in a dev environment (source === destination)', async () => {
    const changes = await refreshInstallation(PACKAGE_ROOT, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('Skipped Portability copy (dev environment')));
  });

  it('removes stale files in the destination before copying', async () => {
    const name = declaredWorkflows()[0].name;
    const staleDir = path.join(tmpDir, '_bmad/bme/_portability/workflows', name);
    await fs.ensureDir(staleDir);
    await fs.writeFile(path.join(staleDir, 'stale-leftover.md'), '# stale', 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(!fs.existsSync(path.join(staleDir, 'stale-leftover.md')), 'stale file should be removed');
    assert.ok(fs.existsSync(path.join(staleDir, 'workflow.md')), 'fresh workflow.md should be present');
  });
});

describe('refreshInstallation — Portability skill wrappers', () => {
  let tmpDir;
  beforeEach(async () => { tmpDir = await setupPortabilityTestDir(); silenceConsole(); });
  afterEach(async () => { restoreConsole(); await fs.remove(tmpDir); });

  it('generates a wrapper per declared standalone workflow, named verbatim', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    for (const wf of declaredWorkflows()) {
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.claude/skills', wf.name, 'SKILL.md')),
        `wrapper for ${wf.name} should be generated`,
      );
    }
  });

  it('every generated wrapper RESOLVES its workflow — presence is not sufficient (C4)', async () => {
    // THE TEST THIS FILE EXISTS FOR. A wrapper carrying the relative directive these files
    // shipped with would pass a presence check and resolve to nothing. This substitutes
    // {project-root} exactly as the skill runtime does and reads the target.
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    for (const wf of declaredWorkflows()) {
      const wrapper = fs.readFileSync(path.join(tmpDir, '.claude/skills', wf.name, 'SKILL.md'), 'utf8');
      const m = wrapper.match(/LOAD the FULL \{project-root\}(\S+?),/);
      assert.ok(m, `${wf.name} wrapper must carry an absolute {project-root} load directive`);
      const target = path.join(tmpDir, m[1]);
      assert.ok(fs.existsSync(target), `${wf.name} directive points at a missing file: ${m[1]}`);
      assert.ok(fs.readFileSync(target, 'utf8').length > 0, `${wf.name} workflow is empty`);
    }
  });

  it('carries no RELATIVE workflow link in any source SKILL.md', async () => {
    // The regression guard for AC2: reintroducing [workflow.md](workflow.md) in the source
    // would silently produce four wrappers pointing at files that are not there.
    for (const wf of declaredWorkflows()) {
      const src = fs.readFileSync(
        path.join(PACKAGE_ROOT, '_bmad/bme/_portability/workflows', wf.name, 'SKILL.md'), 'utf8');
      assert.ok(
        !/\]\(workflow\.md\)/.test(src),
        `${wf.name}/SKILL.md must not load its workflow by a relative link`,
      );
    }
  });

  it('wrappers SURVIVE a second consecutive refresh (AC5)', async () => {
    // The failure this guards is a wrapper that installs and then disappears on the next update,
    // which is what an orphan sweep that does not know these names would do.
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    for (const wf of declaredWorkflows()) {
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.claude/skills', wf.name, 'SKILL.md')),
        `${wf.name} wrapper should survive a second refresh`,
      );
    }
  });

  it('skips wrapper generation in a dev environment', async () => {
    const changes = await refreshInstallation(PACKAGE_ROOT, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('Skipped Portability skill wrapper generation')));
  });
});
