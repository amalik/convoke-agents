'use strict';

/**
 * Every module config the refresh overwrites refuses when it cannot be read (T181).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `assertConfigReadable` was wired into Vortex and Gyre only (fic-1-1). The other four modules
 * — `_enhance`, `_artifacts`, `_portability`, `_team-factory` — each parse their config too, but
 * only AFTER `fs.copy` has already replaced it, so those checks read the package's own file and
 * cannot fail on operator data. An operator with a duplicate `user_name:` line got exit 0, no
 * message, and their values gone. Measured with the guard deleted: `refreshInstallation` resolves
 * and all four configs are overwritten.
 *
 * WHAT THIS FILE DOES NOT COVER. The guard refuses an UNREADABLE config. It does not preserve a
 * readable one: all four are still rewritten from the package template on every run, because
 * `mergeConfig` carries profiles for `_vortex` and `_gyre` only. That half of T181 is `T221`.
 *
 * THE TRAP THIS FILE KEPT FALLING INTO. Two earlier versions pinned the derived module set against
 * the REAL package tree, where the derivation and a hardcoded `['_artifacts', … ]` literal return
 * the same six names — so a literal passed the whole suite twice, and the comment claiming
 * otherwise was the only thing wrong. `the derived set` cases below use a SYNTHETIC package root,
 * whose expected value the live tree cannot produce. No census of the cases is kept here: three
 * review layers found the last one false, and it rots on every edit to this file.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const {
  refreshInstallation,
  guardedModuleNames,
} = require('../../scripts/update/lib/refresh-installation');
const { readExcludedAgents } = require('../../scripts/update/lib/config-merger');
const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
const { PACKAGE_ROOT, createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

/** Unguarded before T181, and still SHIPPED. Pinned as a LITERAL: deriving it the way the code does
 *  would agree with the code even if the code stopped guarding a module. This is the floor.
 *
 *  `_team-factory` was a fifth entry until T227. It is no longer guarded — not because the guard
 *  regressed, but because the module stopped shipping in `tfu-1-1` and the guard now follows
 *  `files[]`, which is what T181's own commit message always claimed it did. Its removal from this
 *  list is therefore a contract change, and the case below named `T227` is what pins the new one.
 *  If a module is ever added back to `files[]`, add it here too — this list is the floor, not the
 *  derivation. */
const PREVIOUSLY_UNGUARDED = ['_artifacts', '_enhance', '_portability'];

/** Guarded before T181 by the two `readExcludedAgents` wrappers. These two cases are REGRESSION
 *  COVER for that older guard, not coverage of the T181 loop — deleting the loop leaves them
 *  green, because both guards emit the same path in the same message. `_vortex`'s refusal is
 *  covered nowhere else in the suite; `_gyre`'s is also covered in `fresh-install.test.js`. */
const ALREADY_GUARDED = ['_gyre', '_vortex'];

/** A config holding a real operator value plus the duplicate key that is T181's filed repro. */
const DAMAGED_CONFIG = ['user_name: Amalik', 'communication_language: English', 'user_name: Amalik', ''].join('\n');

async function writeModuleConfig(tmpDir, moduleName, contents) {
  const dir = path.join(tmpDir, '_bmad', 'bme', moduleName);
  await fs.ensureDir(dir);
  const p = path.join(dir, 'config.yaml');
  await fs.writeFile(p, contents, 'utf8');
  return p;
}

/**
 * A file the refresh would overwrite, used to prove nothing was copied before the refusal.
 *
 * Three ways this comparison can go vacuous, all checked by `the sentinel can actually detect a
 * copy`: the package file is missing (the copy is skipped), the package ships the fixture's own
 * text (nothing to detect), or the agent is in `excluded_agents` (the copy is skipped for that id).
 */
function sentinelPaths(tmpDir) {
  const agentId = AGENT_IDS[0];
  return {
    agentId,
    fixture: path.join(tmpDir, '_bmad', 'bme', '_vortex', 'agents', agentId, 'SKILL.md'),
    package: path.join(PACKAGE_ROOT, '_bmad', 'bme', '_vortex', 'agents', agentId, 'SKILL.md'),
  };
}

/** Which module configs does ONE real refresh WRITE? Observed, never parsed.
 *
 *  This is the apparatus that lets `GUARDED_MODULE_NAMES` be a literal. It reads no manifest and no
 *  directory listing of its own beyond enumerating candidates: every config-bearing module in the
 *  PACKAGE tree is seeded with a readable config carrying a version no release will ever have, one
 *  real refresh runs, and a module counts as WRITTEN when that version is gone.
 *
 *  `_vortex` arrives from `createValidInstallation` and the refresh needs its agent and workflow
 *  lists, so the version is replaced in place rather than the file being truncated. */
const PROBE_VERSION = '0.0.0-probe';

async function probeWrittenConfigs(tmpDir) {
  const packageBme = path.join(PACKAGE_ROOT, '_bmad', 'bme');
  const candidates = (await fs.readdir(packageBme, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => fs.existsSync(path.join(packageBme, n, 'config.yaml')))
    .sort();

  for (const name of candidates) {
    const target = path.join(tmpDir, '_bmad', 'bme', name, 'config.yaml');
    const doc = (await fs.pathExists(target)) ? yaml.load(await fs.readFile(target, 'utf8')) || {} : {};
    doc.version = PROBE_VERSION;
    await fs.outputFile(target, yaml.dump(doc), 'utf8');
  }

  await refreshInstallation(tmpDir, { verbose: false });

  const written = [];
  for (const name of candidates) {
    const target = path.join(tmpDir, '_bmad', 'bme', name, 'config.yaml');
    const after = (await fs.pathExists(target)) ? await fs.readFile(target, 'utf8') : '';
    if (!after.includes(PROBE_VERSION)) written.push(name);
  }
  return { candidates, written };
}

describe('refreshInstallation — module config readability guard (T181)', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t181-'));
    await createValidInstallation(tmpDir);
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    if (tmpDir) await fs.remove(tmpDir); // guarded: a throw in beforeEach would mask itself here
  });

  for (const moduleName of [...PREVIOUSLY_UNGUARDED, ...ALREADY_GUARDED]) {
    it(`refuses rather than overwrite a damaged ${moduleName}/config.yaml`, async () => {
      const configPath = await writeModuleConfig(tmpDir, moduleName, DAMAGED_CONFIG);
      const sentinel = sentinelPaths(tmpDir);
      const before = await fs.readFile(sentinel.fixture, 'utf8');

      await assert.rejects(
        () => refreshInstallation(tmpDir, { verbose: false }),
        (err) => {
          assert.match(err.message, /refusing to overwrite/);
          assert.match(err.message, new RegExp(`${moduleName}[/\\\\]config\\.yaml`));
          return true;
        },
        `${moduleName} was overwritten silently — the guard did not fire`
      );

      assert.equal(await fs.readFile(configPath, 'utf8'), DAMAGED_CONFIG);
      assert.equal(await fs.readFile(sentinel.fixture, 'utf8'), before, 'a tree was copied before the refusal');
    });
  }

  it('the sentinel can actually detect a copy — all three vacuity channels closed', async () => {
    const sentinel = sentinelPaths(tmpDir);
    assert.equal(await fs.pathExists(sentinel.package), true, `package must ship ${sentinel.agentId}/SKILL.md`);
    const fixtureBody = await fs.readFile(sentinel.fixture, 'utf8');
    const packageBody = await fs.readFile(sentinel.package, 'utf8');
    assert.notEqual(packageBody, fixtureBody, 'package and fixture bodies must differ, or the copy is undetectable');
    const excluded = readExcludedAgents(path.join(tmpDir, '_bmad', 'bme', '_vortex', 'config.yaml'));
    assert.ok(!excluded.includes(sentinel.agentId), `fixture must not exclude ${sentinel.agentId} — its copy would be skipped`);
  });

  it('the guarded list is exactly the set of module configs the refresh WRITES', async () => {
    // THE PIN THAT LETS THE LIST BE A LITERAL. Two derivations were tried and both were wrong in the
    // data-loss direction — see `GUARDED_MODULE_NAMES` in the source for which and why. A literal is
    // the third answer, and it rots unless something observes the real behaviour, so this reads no
    // manifest: it runs one real refresh and watches which configs changed.
    const { candidates, written } = await probeWrittenConfigs(tmpDir);

    // Vacuity, closed explicitly. With no DECOY — a candidate the refresh does not write — the probe
    // cannot detect a list that is too wide, and would pass on a literal naming every candidate.
    // `_team-factory` is the decoy today: tracked in git, no copy loop since `tfu-1-1`. If it ever
    // leaves the tree this reddens, which is correct — the author is told the probe went blind.
    assert.ok(
      candidates.length > written.length,
      `probe cannot detect an over-wide list: every candidate was written (${candidates.join(', ')})`
    );
    assert.deepEqual(written, guardedModuleNames());
  });

  it('the guarded list is sorted, because the refusal names only the first', async () => {
    // Trivially true as written, and recorded as trivial rather than dressed up. The BEHAVIOUR it
    // protects is pinned by `names exactly one module, the first in sorted order` below.
    assert.deepEqual(guardedModuleNames(), [...guardedModuleNames()].sort());
  });

  it('T227: a damaged config for an UNSHIPPED module does not block the refresh', async () => {
    // The operator-facing half. `guardedModuleNames` excluding it is necessary but not sufficient —
    // what matters is that `refreshInstallation` completes. An orphaned `_team-factory/` is exactly
    // the state projects installed between 3.2.0 (when the module entered files[]) and 4.0.3 are left in
    // (T222), so this is not hypothetical. NOT every project <= 4.0.3 — one installed at 3.1.0 and never
    // updated has no orphan to leave behind.
    await writeModuleConfig(tmpDir, '_team-factory', DAMAGED_CONFIG);
    await assert.doesNotReject(() => refreshInstallation(tmpDir, { verbose: false }));
  });

  it('guards the PACKAGE\'s modules, not the project\'s — an operator-authored config is untouched', async () => {
    // `guardedModuleNames(projectRoot)` passes every other case in this file, and would refuse an
    // update because of a config the refresh never writes: a false refusal blocking every update.
    await writeModuleConfig(tmpDir, '_operator-notes', DAMAGED_CONFIG);
    await assert.doesNotReject(() => refreshInstallation(tmpDir, { verbose: false }));
  });

  it('names exactly one module, the first in sorted order, when several are damaged', async () => {
    // `_portability` sorts AFTER `_artifacts`, which is the whole point: the refusal must name the
    // first in sorted order. This was `_team-factory` until T227 unguarded it, at which point the
    // case would have passed because the module was skipped entirely rather than ordered second.
    const other = await writeModuleConfig(tmpDir, '_portability', DAMAGED_CONFIG);
    await writeModuleConfig(tmpDir, '_artifacts', DAMAGED_CONFIG);

    await assert.rejects(
      () => refreshInstallation(tmpDir, { verbose: false }),
      (err) => {
        assert.match(err.message, /_artifacts[/\\]config\.yaml/);
        assert.doesNotMatch(err.message, /_portability/, 'one refusal at a time — a combined message is a different contract');
        return true;
      }
    );
    assert.equal(await fs.readFile(other, 'utf8'), DAMAGED_CONFIG);
  });

  it('refuses on a project with no Vortex install at all', async () => {
    // Deliberately NOT a dev-tree test: `isSameRoot` is false here, because a temp dir is never
    // the package root. An earlier version of this case was named for `isSameRoot` and gating the
    // guard on it killed nothing, which is what the name promised and did not deliver.
    const bare = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t181-bare-'));
    try {
      await fs.ensureDir(path.join(bare, '_bmad', 'bme', '_enhance'));
      await fs.writeFile(path.join(bare, '_bmad', 'bme', '_enhance', 'config.yaml'), DAMAGED_CONFIG, 'utf8');
      await assert.rejects(() => refreshInstallation(bare, { verbose: false }), /_enhance[/\\]config\.yaml/);
    } finally {
      await fs.remove(bare);
    }
  });

  it('reports the path when the config cannot be read at all, not a bare errno', async () => {
    // A directory at the config path made `fs.readFileSync` throw `EISDIR` naming NOTHING, which
    // reached the operator as `✗ Installation failed: EISDIR: illegal operation on a directory`.
    await fs.ensureDir(path.join(tmpDir, '_bmad', 'bme', '_artifacts', 'config.yaml'));
    await assert.rejects(() => refreshInstallation(tmpDir, { verbose: false }), (err) => {
      assert.match(err.message, /refusing to overwrite/);
      assert.match(err.message, /_artifacts[/\\]config\.yaml/);
      assert.match(err.message, /EISDIR/);
      return true;
    });
  });

  // ── Negative controls: these cannot fail with the guard absent. ──────────────────────────────
  it('stays silent when a module config is absent — a fresh install must not refuse', async () => {
    for (const moduleName of PREVIOUSLY_UNGUARDED) {
      assert.equal(
        await fs.pathExists(path.join(tmpDir, '_bmad', 'bme', moduleName, 'config.yaml')),
        false,
        `fixture precondition: ${moduleName}/config.yaml must not exist`
      );
    }
    await assert.doesNotReject(() => refreshInstallation(tmpDir, { verbose: false }));
  });

  it('does not refuse an intact config that carries an operator value', async () => {
    const intact = 'user_name: Amalik\ncommunication_language: English\nmy_custom_key: keep-me\n';
    for (const moduleName of PREVIOUSLY_UNGUARDED) {
      await writeModuleConfig(tmpDir, moduleName, intact);
    }
    await assert.doesNotReject(() => refreshInstallation(tmpDir, { verbose: false }));
  });
});
