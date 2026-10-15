/**
 * T255: what an operator receives must not tell them to run `node scripts/…`.
 *
 * `scripts/` exists in a Convoke checkout and not in an operator's project, so an installed workflow
 * that shells out to `node scripts/<x>.js` fails with MODULE_NOT_FOUND. Workflows that have a published
 * bin now call it through `npx -p convoke-agents <bin>`. The three catalog-publishing workflows have no
 * bin and are Convoke maintainer tools, so they were withdrawn from operator installs instead.
 *
 * The installed-tree test runs a real refresh into a fixture and reads what landed there, so a new
 * workflow that ships a `node scripts/` call goes red without anyone listing it. The withdrawn three
 * are excluded by name: their files are still copied into the project, but no wrapper invokes them, and
 * they say `node scripts/` correctly for the checkout they now run in. A second test covers the two
 * skills shipped under `.claude/skills/`, which the refresh does not install.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { refreshInstallation, RETIRED_VERBATIM_WRAPPERS } = require('../../scripts/update/lib/refresh-installation');
const yaml = require('js-yaml');
const { createValidInstallation, silenceConsole, restoreConsole, PACKAGE_ROOT } = require('../helpers');

const MINIMAL_PM_MD = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
</agent>`;

const REFRESH_OPTIONS = { backupGuides: false, verbose: false };
const NODE_SCRIPTS = /node\s+(\.\/)?(\{project-root\}\/)?(scripts|node_modules\/convoke-agents)\//;
// A checkout-only instruction names the script and says "run that file with `node`", never `node scripts/`.

function markdownUnder(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const abs = path.join(d, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name.endsWith('.md')) out.push(abs);
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

describe('T255: installed workflows call published commands', () => {
  let tmpDir, skillsDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t255-'));
    await createValidInstallation(tmpDir);
    await fs.ensureDir(path.join(tmpDir, '_bmad/bmm/agents'));
    await fs.writeFile(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), MINIMAL_PM_MD, 'utf8');
    skillsDir = path.join(tmpDir, '.claude', 'skills');
    silenceConsole();
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('no workflow an operator can invoke tells them to run node scripts/', () => {
    // A withdrawn workflow's files still ship under its module, but nothing invokes them.
    const withdrawn = new Set(RETIRED_VERBATIM_WRAPPERS);
    const reachable = markdownUnder(path.join(tmpDir, '_bmad', 'bme'))
      .filter(f => !f.split(path.sep).some(part => withdrawn.has(part)));
    // Every module that declares workflows must have landed, or this scan would pass on a missing tree.
    const PACKAGE_BME = path.join(__dirname, '..', '..', '_bmad', 'bme');
    for (const mod of fs.readdirSync(PACKAGE_BME).filter(m => m.startsWith('_'))) {
      const cfgPath = path.join(PACKAGE_BME, mod, 'config.yaml');
      if (!fs.existsSync(cfgPath)) continue;
      const cfg = yaml.load(fs.readFileSync(cfgPath, 'utf8')) || {};
      for (const wf of cfg.workflows || []) {
        if (!wf || !wf.entry) continue;
        assert.ok(fs.existsSync(path.join(tmpDir, '_bmad', 'bme', mod, wf.entry)), `fixture: ${mod}/${wf.entry} was not installed`);
      }
    }

    const offenders = reachable
      .filter(f => NODE_SCRIPTS.test(fs.readFileSync(f, 'utf8')))
      .map(f => path.relative(tmpDir, f));
    assert.deepEqual(offenders, []);
  });

  it('the skills shipped under .claude/skills/ do not tell anyone to run node scripts/ either', () => {
    // These ship in the tarball but are not installed by the refresh, so the scan above cannot see them.
    const shipped = require(path.join(PACKAGE_ROOT, 'package.json')).files.filter(f => f.startsWith('.claude/skills/'));
    assert.ok(shipped.length > 0, 'fixture: package.json ships no .claude/skills/ entries');
    const offenders = shipped
      .flatMap(dir => markdownUnder(path.join(PACKAGE_ROOT, dir)))
      .filter(f => NODE_SCRIPTS.test(fs.readFileSync(f, 'utf8')))
      .map(f => path.relative(PACKAGE_ROOT, f));
    assert.deepEqual(offenders, []);
  });

  it('the withdrawn catalog workflows get no wrapper, and export still does', () => {
    assert.ok(RETIRED_VERBATIM_WRAPPERS.length > 0, 'fixture needs at least one withdrawn workflow');
    for (const name of RETIRED_VERBATIM_WRAPPERS) {
      assert.ok(!fs.existsSync(path.join(skillsDir, name)), `${name} must not be installed`);
    }
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-export-skill', 'SKILL.md')));
  });

  it('a wrapper an earlier install generated for a withdrawn workflow is removed', async () => {
    for (const name of RETIRED_VERBATIM_WRAPPERS) {
      const src = path.join(tmpDir, '_bmad/bme/_portability/workflows', name, 'SKILL.md');
      await fs.ensureDir(path.join(skillsDir, name));
      await fs.copy(src, path.join(skillsDir, name, 'SKILL.md'));
    }

    const changes = await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    for (const name of RETIRED_VERBATIM_WRAPPERS) {
      assert.ok(!fs.existsSync(path.join(skillsDir, name)), `${name} wrapper must be removed`);
      assert.ok(changes.includes(`Removed orphan skill wrapper: ${name}`), `the run must say it removed ${name}`);
    }
  });
});
