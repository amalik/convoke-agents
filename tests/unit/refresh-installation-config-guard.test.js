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
  STAMPABLE_MODULES,
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
 *  This is the apparatus that lets `GUARDED_MODULE_NAMES` be a literal, and Round 3 of `T227` broke
 *  two earlier versions of it. Both escapes are recorded because the shape recurs:
 *
 *    1. **The signal was "the `version` scalar changed", not "the file changed."** A write site that
 *       clobbers the config and then restores the operator's previous `version` was invisible — the
 *       whole suite stayed green while an unguarded module's config was destroyed, which is `T181`
 *       verbatim. The signal is now full CONTENT inequality. Measured: with the version signal that
 *       write site gave 15/15 pass; keyed on content it reddens, naming the module.
 *    2. **Candidates required the package to ship a `config.yaml` TEMPLATE.** A module whose config
 *       the installer GENERATES has no template, so it was enumerated nowhere and the probe was
 *       silent about it — the same data loss, and not even the decoy check could fire.
 *       `taxonomy-merger.js` already generates a config with no shipped template, so this is a shape
 *       the codebase uses. The universe is now every `_bmad/bme/*` DIRECTORY, template or not; a
 *       config that appears where none was seeded counts as written.
 *
 *  `_vortex` arrives from `createValidInstallation` and the refresh needs its agent and workflow
 *  lists, so its version is replaced in place rather than the file being truncated.
 *
 *  WHAT THIS STILL CANNOT SEE. A write that reproduces the seeded bytes exactly. That is not a
 *  data-loss shape — a write which leaves the operator's file byte-identical has destroyed nothing —
 *  so the gap is stated rather than closed. */
const PROBE_VERSION = '0.0.0-probe';

async function probeWrittenConfigs(tmpDir) {
  const packageBme = path.join(PACKAGE_ROOT, '_bmad', 'bme');
  // NO `config.yaml` filter: see (2) above. Every directory is a candidate.
  const candidates = (await fs.readdir(packageBme, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  // `null` means "nothing was seeded here", so a config existing afterwards is a GENERATED write.
  const seeded = new Map();
  for (const name of candidates) {
    const target = path.join(tmpDir, '_bmad', 'bme', name, 'config.yaml');
    if (await fs.pathExists(target)) {
      const before = await fs.readFile(target, 'utf8');
      const doc = yaml.load(before) || {};
      doc.version = PROBE_VERSION;
      await fs.outputFile(target, yaml.dump(doc), 'utf8');
      // The sentinel must actually land, or detection rests on whatever the yaml round-trip happens
      // to reformat. Without this, replacing the assignment with a no-op leaves the suite green.
      assert.notEqual(await fs.readFile(target, 'utf8'), before, `probe sentinel did not change ${name}/config.yaml`);
    } else if (fs.existsSync(path.join(packageBme, name, 'config.yaml'))) {
      await fs.outputFile(target, yaml.dump({ version: PROBE_VERSION }), 'utf8');
    } else {
      seeded.set(name, null);
      continue;
    }
    seeded.set(name, await fs.readFile(target, 'utf8'));
  }

  await refreshInstallation(tmpDir, { verbose: false });

  const written = [];
  for (const name of candidates) {
    const target = path.join(tmpDir, '_bmad', 'bme', name, 'config.yaml');
    const after = (await fs.pathExists(target)) ? await fs.readFile(target, 'utf8') : null;
    if (after !== seeded.get(name)) written.push(name);
  }
  return { candidates, written };
}

/** Every `_bmad/bme/*` directory in the package, pinned as a LITERAL.
 *
 *  This replaces a `candidates.length > written.length` vacuity check, which Round 3 showed was a
 *  tautology one character from being unconditional (`written` is filtered FROM `candidates`, so
 *  `>=` can never fail) and which survived both relaxation and outright deletion. It also collapsed
 *  three opposite future changes into one misleading message, and its `assert.ok` short-circuited
 *  the diff that would have named the real problem.
 *
 *  Pinning the universe instead is falsifiable in both directions and says what changed. Adding a
 *  directory here is a deliberate act: it forces a decision about whether its config is written. */
const BME_DIRECTORIES = [
  '_artifacts', '_config', '_enhance', '_gyre', '_portability', '_team-factory', '_vortex', 'covenant',
];

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
    // THE PIN THAT LETS THE LIST BE A LITERAL — with the two qualifiers Round 3 found escapable now
    // closed, and the one remaining gap stated at `probeWrittenConfigs`. Nothing here reads a
    // manifest: one real refresh runs and the configs that changed are compared to the literal.
    const { candidates, written } = await probeWrittenConfigs(tmpDir);

    // The contract, asserted BEFORE the universe pin: a failure in the data-loss direction (a write
    // site with no literal entry) must produce the diff that NAMES the module, not a message about
    // the probe. Round 3 found the old ordering hid exactly that behind a short-circuiting assert.
    assert.deepEqual(
      written,
      guardedModuleNames(),
      'a module in `written` but not the literal means a config is written UNGUARDED (data loss, T181); ' +
        'a module in the literal but not `written` means either the write site went away or the probe ' +
        'stopped seeing it — check which before editing the literal'
    );

    // The universe. Guarantees a decoy exists (candidates ⊋ written) without a comparison that
    // cannot fail, and names any directory that appeared or vanished.
    assert.deepEqual(candidates, BME_DIRECTORIES, 'the set of _bmad/bme/* directories changed');
  });

  it('every module declared stampable is actually re-stamped by a refresh (T234)', async () => {
    // Replaces an equality assertion between `STAMPABLE_MODULES` and `guardedModuleNames()`. That
    // pin caught T234 but had a backwards incentive: the two are NOT the same predicate — guarded
    // means the refresh changes these bytes, stampable means it re-writes this version — so a
    // future module that is written but NOT stamped must be guarded and must NOT be stampable.
    // Under equality the cheap move was to append it to `STAMPABLE_MODULES`, which is exactly
    // BUG-17's defect (routing `convoke-update` to a refresh that takes the lock, cuts a backup
    // and stamps nothing), and the correct move was the one that turned the suite red.
    //
    // This asserts the property the consumer depends on instead: `isManagedByInstaller` promises
    // a refresh can repair this module's version, so skew every declared module and require a
    // refresh to actually re-stamp it. A module added to the list with no stamp site fails here.
    for (const m of STAMPABLE_MODULES) {
      const cfg = path.join(tmpDir, '_bmad', 'bme', m, 'config.yaml');
      await fs.ensureDir(path.dirname(cfg));
      await fs.writeFile(cfg, 'version: 0.0.1\nname: probe\n', 'utf8');
    }
    await refreshInstallation(tmpDir, { verbose: false });
    const notRestamped = [];
    for (const m of STAMPABLE_MODULES) {
      const body = await fs.readFile(path.join(tmpDir, '_bmad', 'bme', m, 'config.yaml'), 'utf8');
      if (/^version:\s*0\.0\.1\s*$/m.test(body)) notRestamped.push(m);
    }
    assert.deepEqual(notRestamped, [], 'declared stampable but a refresh left the version alone — the skew detector would route convoke-update to a refresh that cannot repair it (BUG-17)');
  });

  it('nothing stampable escapes the readability guard (T234)', () => {
    // The direction that IS a true invariant: stamping writes the config, so anything stamped must
    // also be guarded. Containment, not equality, so a guarded-but-unstamped module stays legal.
    const guarded = new Set(guardedModuleNames());
    assert.deepEqual(STAMPABLE_MODULES.filter((m) => !guarded.has(m)), [],
      'a module is re-stamped without a readability check, so a damaged config there is overwritten (T181)');
  });

  it('the guarded list is sorted, because the refusal names only the first', async () => {
    // Trivially true as written, and recorded as trivial rather than dressed up. The BEHAVIOUR it
    // protects is pinned by `names exactly one module, the first in sorted order` below.
    assert.deepEqual(guardedModuleNames(), [...guardedModuleNames()].sort());
  });

  it('the probe sentinel cannot collide with a shipped template', async () => {
    // Round 3: `PROBE_VERSION = '1.0.0'` — the version five of the six shipped templates carry —
    // left the suite at 15/15. The sentinel's whole job is to differ from what the refresh writes,
    // and that property was asserted nowhere.
    const packageBme = path.join(PACKAGE_ROOT, '_bmad', 'bme');
    const offenders = [];
    for (const name of BME_DIRECTORIES) {
      const template = path.join(packageBme, name, 'config.yaml');
      if (!fs.existsSync(template)) continue;
      if ((await fs.readFile(template, 'utf8')).includes(PROBE_VERSION)) offenders.push(name);
    }
    assert.deepEqual(offenders, [], `PROBE_VERSION ${PROBE_VERSION} appears in a shipped template`);
  });

  it('a caller cannot shrink the guard for the rest of the process', async () => {
    // Round 3: dropping `Object.freeze` AND the returned copy both survived, and together let any
    // caller zero the guard permanently. No live caller does — this is the floor that keeps it so.
    //
    // TWO MUTANTS SURVIVE HERE DELIBERATELY, recorded so nobody re-derives them as gaps. Dropping
    // `Object.freeze` ALONE is unobservable, because the returned copy already protects callers —
    // semantically equivalent, not an untested path; dropping both together fails this case.
    // Separately, making `config-merger.js`'s `merged.version = newVersion` conditional now survives
    // this FILE, where it used to break it: the probe keys on content, so it no longer depends on a
    // version stamp in another module. That dependency was Round 3's MEDIUM 5 and is gone.
    const first = guardedModuleNames();
    first.length = 0;
    first.push('_nonsense');
    assert.deepEqual(guardedModuleNames(), ['_artifacts', '_enhance', '_gyre', '_portability', '_vortex']);
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
    // A guard derived from the PROJECT tree would pass every other case in this file, and would refuse an
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
