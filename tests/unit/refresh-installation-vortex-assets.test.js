const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const {
  createValidInstallation,
  silenceConsole,
  restoreConsole,
  removeTempDir
} = require('../helpers');

// Minimal pm.md — the Enhance block runs alongside the main install flow.
const MINIMAL_PM_MD = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
</agent>`;

const PACKAGE_VORTEX = path.join(__dirname, '../../_bmad/bme/_vortex');

// T88: 16 files under `workflows/` referenced
// `_bmad/bme/_vortex/contracts/hcN-*.md`, but refreshInstallation copied only agents,
// workflows, config.yaml and per-agent guides — so the directory existed in the installed
// package and never in the operator's project.
//
// NOTE ON FIXTURES: `createValidInstallation` does NOT create contracts/ or examples/. A
// test that deletes them before the first refresh deletes nothing and proves nothing. Every
// update-path test below therefore refreshes ONCE to establish the installed state, then
// mutates it, then refreshes again — so the second refresh is a genuine update-over-existing.
describe('refreshInstallation — Vortex reference assets (T88)', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t88-'));
    await createValidInstallation(tmpDir);
    const pmDir = path.join(tmpDir, '_bmad/bmm/agents');
    await fs.ensureDir(pmDir);
    await fs.writeFile(path.join(pmDir, 'pm.md'), MINIMAL_PM_MD, 'utf8');
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    // helpers.js documents why fs.remove is not used here: CI run 32115225495 lost three
    // jobs to ENOTEMPTY in exactly this hook.
    await removeTempDir(tmpDir);
  });

  for (const dir of ['contracts', 'examples']) {
    it(`installs ${dir}/ with byte-identical content, not just the directory`, async () => {
      await refreshInstallation(tmpDir, { verbose: false });

      const target = path.join(tmpDir, '_bmad/bme/_vortex', dir);
      const source = path.join(PACKAGE_VORTEX, dir);
      assert.ok(fs.existsSync(target), `_vortex/${dir}/ must exist in the operator project`);

      const expected = fs.readdirSync(source);
      assert.ok(expected.length > 0, `fixture guard: package ${dir}/ must not be empty`);
      for (const f of expected) {
        const dst = path.join(target, f);
        assert.ok(fs.existsSync(dst), `${dir}/${f} missing from the operator project`);
        // Existence alone would pass on a zero-byte or truncated copy.
        assert.equal(
          fs.readFileSync(dst, 'utf8'),
          fs.readFileSync(path.join(source, f), 'utf8'),
          `${dir}/${f} content differs from the package`
        );
      }
    });
  }

  it('every contracts/ reference under workflows/ resolves in the installed tree', async () => {
    // The defect was never "a directory is missing" — it was "16 files point at nothing".
    // Assert the property that actually failed, by resolving the real hrefs.
    await refreshInstallation(tmpDir, { verbose: false });

    const workflows = path.join(tmpDir, '_bmad/bme/_vortex/workflows');
    const refs = new Set();
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) { walk(full); continue; }
        if (!e.name.endsWith('.md')) continue;
        for (const m of fs.readFileSync(full, 'utf8').matchAll(/_bmad\/bme\/_vortex\/(contracts\/[a-z0-9-]+\.md)/g)) {
          refs.add(m[1]);
        }
      }
    };
    walk(workflows);

    assert.ok(refs.size > 0, 'fixture guard: the installed workflows must cite contracts');
    const dangling = [...refs].filter(r => !fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex', r)));
    assert.deepEqual(dangling, [], `dangling contract references in the operator tree: ${dangling.join(', ')}`);
  });

  it('evicts a contract deleted upstream instead of leaving it beside its replacement', async () => {
    // Update path: first refresh installs, then a stale file is planted, then a second
    // refresh must clear it. Without remove-then-copy the stale file survives forever —
    // and the referring files cite schemas by filename.
    await refreshInstallation(tmpDir, { verbose: false });

    const stale = path.join(tmpDir, '_bmad/bme/_vortex/contracts/hc99-removed-upstream.md');
    await fs.writeFile(stale, 'superseded schema', 'utf8');
    assert.ok(fs.existsSync(stale), 'fixture guard: stale file must exist before the second refresh');

    await refreshInstallation(tmpDir, { verbose: false });

    assert.ok(!fs.existsSync(stale), 'a contract removed upstream must not survive a refresh');
  });

  it('restores a reference file the operator deleted', async () => {
    await refreshInstallation(tmpDir, { verbose: false });

    const contract = path.join(tmpDir, '_bmad/bme/_vortex/contracts/hc1-empathy-artifacts.md');
    assert.ok(fs.existsSync(contract), 'fixture guard: first refresh must install the contract');
    await fs.remove(contract);

    await refreshInstallation(tmpDir, { verbose: false });

    assert.ok(fs.existsSync(contract), 'a deleted reference file must be restored on refresh');
  });

  it('leaves operator-editable root files alone — scope is the two reference dirs', async () => {
    // Guards the narrowing decided at review. README.md / module.yaml / module-help.csv /
    // compass-routing-reference.md have no shipped referent and are not this phase's business;
    // copying them would overwrite operator edits with no backup.
    await refreshInstallation(tmpDir, { verbose: false });

    for (const f of ['README.md', 'module.yaml', 'module-help.csv', 'compass-routing-reference.md']) {
      assert.ok(
        !fs.existsSync(path.join(tmpDir, '_bmad/bme/_vortex', f)),
        `_vortex/${f} is out of scope for this phase — see T89 for the general class`
      );
    }
  });

  it('preserves an operator-set config value across refresh', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    // Seed a distinctive key rather than relying on the shipped `{user}` placeholder — a test
    // whose oracle is a token in a file nobody treats as a fixture stops working the day that
    // token changes. APPEND rather than substitute: the fixture config has no `user_name` key,
    // so a regex replace matches nothing and seeds nothing (found the hard way).
    fs.appendFileSync(configPath, '\nuser_name: "t88-sentinel"\n', 'utf8');
    assert.match(
      fs.readFileSync(configPath, 'utf8'),
      /t88-sentinel/,
      'fixture guard: the operator value must actually be seeded before refresh'
    );

    await refreshInstallation(tmpDir, { verbose: false });

    assert.match(
      fs.readFileSync(configPath, 'utf8'),
      /t88-sentinel/,
      'config.yaml is merged by phase 3 and must never be clobbered by the asset copy'
    );
  });

  it('reports when the package source is missing rather than succeeding silently', async () => {
    const changes = await refreshInstallation(tmpDir, { verbose: false });
    assert.ok(
      changes.some(c => /Refreshed Vortex contracts/.test(c)),
      'the phase must record what it did, so a no-op is distinguishable from success'
    );
  });
});
