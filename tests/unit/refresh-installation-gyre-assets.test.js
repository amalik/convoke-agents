const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { refreshInstallation, gyreGuidePlan } = require('../../scripts/update/lib/refresh-installation');
const { GYRE_AGENTS } = require('../../scripts/update/lib/agent-registry');
const {
  PACKAGE_ROOT,
  createValidInstallation,
  silenceConsole,
  restoreConsole,
  removeTempDir
} = require('../helpers');

const PACKAGE_GYRE = path.join(__dirname, '../../_bmad/bme/_gyre');
const TEAM_GUIDE = 'GYRE-TEAM-GUIDE.md';
const guideFor = (agent) => `${agent.name.toUpperCase()}-USER-GUIDE.md`;

// T91. `_bmad/bme/_gyre/` shipped `compass-routing-reference.md` and `guides/`, and block 2d copied
// agents/, workflows/, contracts/, config.yaml and README.md and stopped. Two different defects wore
// one row, and the tests below keep them apart because their evidence differs:
//
//   THE DANGLING HALF. The README that DOES install names `compass-routing-reference.md` in its tree
//   listing, so an operator read a pointer to a file the installer never created — T88's defect one
//   module over. Evidence is the pointer resolving, not merely the file existing.
//
//   THE ASYMMETRY HALF. Vortex has had a guides phase since this file was created and Gyre never did,
//   so five shipped guides reached no project. (`U8` added the EXCLUSION gate to the Vortex phase, not
//   the phase; an earlier version of this comment dated the phase to U8 and Round 1 disproved it.)
//   An earlier version also called this half 'parity, not a dangling path'. That was wrong: the SHIPPED
//   `INSTALLATION.md` names `_gyre/guides/` inside a `your-project/` tree, so guides dangled too. The
//   evidence is therefore BOTH — the pointers resolve, and the phase matches Vortex's in the two
//   respects that make a guides phase different from a copy: exclusion-aware and backup-aware.
//
// NOTE ON FIXTURES, inherited from the T88 file: `createValidInstallation` creates only `_vortex`, so
// a test that deletes a Gyre file before the first refresh deletes nothing and proves nothing. Every
// update-path test refreshes ONCE to establish the installed state, then mutates it, then refreshes
// again — so the second refresh is a genuine update-over-existing.
describe('refreshInstallation — Gyre reference assets and guides (T91)', () => {
  let tmpDir;
  const gyre = () => path.join(tmpDir, '_bmad/bme/_gyre');
  const guides = () => path.join(gyre(), 'guides');

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t91-'));
    await createValidInstallation(tmpDir);
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await removeTempDir(tmpDir);
  });

  it('the installed README\'s pointer to the routing reference resolves', async () => {
    await refreshInstallation(tmpDir, { verbose: false });

    // The defect was a DANGLING POINTER, so the assertion is about the pointer, not the file. If the
    // README ever stops naming it, this fails loudly rather than passing for a changed reason.
    const readme = await fs.readFile(path.join(gyre(), 'README.md'), 'utf8');
    assert.match(readme, /compass-routing-reference\.md/,
      'the installed README must still name the routing reference, or this test no longer tests T91');
    assert.ok(fs.existsSync(path.join(gyre(), 'compass-routing-reference.md')),
      'README names compass-routing-reference.md — the installer must create it');
  });

  it('installs the routing reference byte-identical to the package copy', async () => {
    await refreshInstallation(tmpDir, { verbose: false });
    const name = 'compass-routing-reference.md';
    assert.equal(
      await fs.readFile(path.join(gyre(), name), 'utf8'),
      await fs.readFile(path.join(PACKAGE_GYRE, name), 'utf8'),
      `${name} must match the package copy, not merely exist`
    );
  });

  it('refreshes a routing reference an operator has damaged', async () => {
    await refreshInstallation(tmpDir, { verbose: false });
    const target = path.join(gyre(), 'compass-routing-reference.md');
    await fs.writeFile(target, 'truncated\n', 'utf8');

    await refreshInstallation(tmpDir, { verbose: false });
    assert.equal(
      await fs.readFile(target, 'utf8'),
      await fs.readFile(path.join(PACKAGE_GYRE, 'compass-routing-reference.md'), 'utf8'),
      'a second refresh must restore it — a reference asset is package-owned'
    );
  });

  it('installs every guide the package SHIPS, not merely every guide the roster names', async () => {
    await refreshInstallation(tmpDir, { verbose: false });

    // DERIVED FROM THE PACKAGE DIRECTORY. The first version of this test built `expected` from
    // `GYRE_AGENTS` plus a hardcoded `GYRE-TEAM-GUIDE.md` — the same two sources production derived from
    // — so it asserted "the roster's guides install", never "nothing shipped is ignored". Review shipped
    // a second team-level guide and the suite stayed green: T91's own defect class, in the test written
    // to prevent it. Reading the shipped directory is what makes the two sides independent.
    const shipped = (await fs.readdir(path.join(PACKAGE_GYRE, 'guides'))).filter((f) => f.endsWith('.md')).sort();
    assert.deepEqual((await fs.readdir(guides())).sort(), shipped,
      'every shipped guide must install — a shipped file no install path copies is the T91 defect');

    // Vacuity, both directions: the set must be non-empty, and it must contain something that is NOT a
    // per-agent guide, or this cannot distinguish a shipped-set derivation from a roster one.
    const perAgent = new Set(GYRE_AGENTS.map(guideFor));
    assert.ok(shipped.length > 0, 'fixture: the package must ship guides');
    assert.ok(shipped.some((g) => !perAgent.has(g)),
      'fixture: the package must ship a non-per-agent guide, or roster and shipped sets coincide');
  });

  it('gyreGuidePlan installs a shipped guide no roster names — tested on a SYNTHETIC listing', () => {
    // THE CONTROL THAT COMPARING TWO REAL DIRECTORIES CANNOT BE. On the real package the shipped set and
    // the roster set coincide, so reverting production to a roster derivation passes a directory
    // comparison. A synthetic listing can hold a guide no agent is named for; the real package cannot.
    const invented = 'GYRE-COMPASS-GUIDE.md';
    const perAgent = GYRE_AGENTS.map(guideFor);
    assert.ok(!perAgent.includes(invented), 'fixture: the invented guide must not be a roster guide');

    const shipped = [...perAgent, TEAM_GUIDE, invented].sort();
    const plan = gyreGuidePlan(shipped, []);
    assert.deepEqual(plan.install, shipped,
      'every shipped guide installs, including one no roster names — a roster derivation drops it');
    assert.deepEqual(plan.skip, []);

    // And the opt-out still subtracts, by name, from whatever was shipped.
    const excluded = GYRE_AGENTS[0];
    const withOptOut = gyreGuidePlan(shipped, [excluded.id]);
    assert.deepEqual(withOptOut.skip, [guideFor(excluded)]);
    assert.deepEqual(withOptOut.install, shipped.filter((g) => g !== guideFor(excluded)));

    // An opt-out for an agent whose guide is not shipped reports nothing — there is nothing to skip.
    assert.deepEqual(gyreGuidePlan([TEAM_GUIDE], [excluded.id]), { install: [TEAM_GUIDE], skip: [] });
    // Degenerate inputs reject rather than throw.
    assert.deepEqual(gyreGuidePlan([], undefined), { install: [], skip: [] });
  });

  it('honours excluded_agents — an excluded agent\'s guide is dead docs', async () => {
    await refreshInstallation(tmpDir, { verbose: false });

    const excluded = GYRE_AGENTS[0];
    const cfgPath = path.join(gyre(), 'config.yaml');
    const cfg = yaml.load(await fs.readFile(cfgPath, 'utf8')) || {};
    cfg.excluded_agents = [excluded.id];
    await fs.writeFile(cfgPath, yaml.dump(cfg), 'utf8');
    await fs.remove(path.join(guides(), guideFor(excluded)));

    await refreshInstallation(tmpDir, { verbose: false });

    assert.ok(!fs.existsSync(path.join(guides(), guideFor(excluded))),
      `${guideFor(excluded)} must not be restored for an agent the operator excluded`);
    for (const agent of GYRE_AGENTS.slice(1)) {
      assert.ok(fs.existsSync(path.join(guides(), guideFor(agent))),
        `${guideFor(agent)} must still install — one exclusion must not drop the rest`);
    }
  });

  it('does not exclusion-gate the TEAM guide, which is not per-agent', async () => {
    await refreshInstallation(tmpDir, { verbose: false });

    // Every agent excluded. The team guide describes the team, so it survives; this is the one place
    // the Gyre phase deliberately differs from iterating the roster.
    const cfgPath = path.join(gyre(), 'config.yaml');
    const cfg = yaml.load(await fs.readFile(cfgPath, 'utf8')) || {};
    cfg.excluded_agents = GYRE_AGENTS.map((a) => a.id);
    await fs.writeFile(cfgPath, yaml.dump(cfg), 'utf8');
    await fs.remove(guides());

    await refreshInstallation(tmpDir, { verbose: false });

    assert.ok(fs.existsSync(path.join(guides(), TEAM_GUIDE)), 'the team guide must still install');
    assert.deepEqual(await fs.readdir(guides()), [TEAM_GUIDE],
      'with every agent excluded, the team guide must be the only guide installed');
  });

  it('backs up an operator-annotated guide, and a SECOND refresh does not destroy that backup', async () => {
    await refreshInstallation(tmpDir, { verbose: false });

    const guide = guideFor(GYRE_AGENTS[0]);
    const target = path.join(guides(), guide);
    const first = 'OPERATOR ANNOTATION ONE — must survive every later refresh\n';
    await fs.writeFile(target, first, 'utf8');
    await refreshInstallation(tmpDir, { verbose: false });

    assert.equal(await fs.readFile(`${target}.bak`, 'utf8'), first,
      'the operator\'s text must be preserved in the .bak, not merely a .bak created');
    assert.notEqual(await fs.readFile(target, 'utf8'), first, 'the guide itself must be refreshed');

    // N=2. Round 1: the backup was unconditional, so this refresh replaced the annotation in the `.bak`
    // with the package text while still reporting `Backed up` — the asserted guarantee held for exactly
    // one update. The FIRST backup is the one worth keeping.
    await fs.writeFile(target, 'ANNOTATION TWO\n', 'utf8');
    const changes = await refreshInstallation(tmpDir, { verbose: false });

    assert.equal(await fs.readFile(`${target}.bak`, 'utf8'), first,
      'a later refresh must not overwrite an existing .bak');
    assert.ok(changes.some((c) => new RegExp(`Kept existing ${guide}\\.bak`).test(c)),
      'and it must say it kept the existing .bak rather than silently reporting a backup it did not take');
  });

  it('writes no .bak when backupGuides is false', async () => {
    await refreshInstallation(tmpDir, { verbose: false });
    const target = path.join(guides(), guideFor(GYRE_AGENTS[0]));
    await fs.writeFile(target, 'annotated\n', 'utf8');

    await refreshInstallation(tmpDir, { verbose: false, backupGuides: false });

    assert.ok(!fs.existsSync(`${target}.bak`), 'backupGuides: false must suppress the .bak');
  });

  it('reports both phases in the changes array', async () => {
    // EXACT strings, not regexes. The filenames contain a `.`, and an unescaped one made the earlier
    // assertion match `GYRE-TEAM-GUIDEXmd`; escaping it through a template literal then broke the test
    // outright. `changes` is the operator-facing report, so comparing the literal line is both simpler
    // and closer to what a reader sees.
    const changes = await refreshInstallation(tmpDir, { verbose: false });
    assert.ok(changes.includes('Refreshed Gyre compass-routing-reference.md'), 'the reference copy must be reported');
    assert.ok(changes.includes(`Refreshed Gyre guide: ${TEAM_GUIDE}`), 'the guides phase must be reported');
  });

  it('reports the skipped guide of an excluded agent, and only that one', async () => {
    // Round 1: this loop was wholly untested — inverting it or deleting it left the suite 9/9 green,
    // and `convoke-update` prints `changes` verbatim to the operator. An inverted report names the
    // guides it just INSTALLED as skipped and says nothing about the one it skipped.
    await refreshInstallation(tmpDir, { verbose: false });
    const excluded = GYRE_AGENTS[0];
    const cfgPath = path.join(gyre(), 'config.yaml');
    const cfg = yaml.load(await fs.readFile(cfgPath, 'utf8')) || {};
    cfg.excluded_agents = [excluded.id];
    await fs.writeFile(cfgPath, yaml.dump(cfg), 'utf8');

    const changes = await refreshInstallation(tmpDir, { verbose: false });
    const skipped = changes.filter((c) => c.startsWith('Skipped excluded Gyre guide: '));
    assert.deepEqual(skipped, [`Skipped excluded Gyre guide: ${guideFor(excluded)}`],
      'exactly the excluded agent\'s guide must be reported as skipped — not the installed ones');
  });

  it('reports the dev-environment skip for BOTH new phases', async () => {
    // Round 1: `2d2` had no dev-environment branch, so a dev read Vortex's `Skipped guide copy` line and
    // reasonably concluded it covered Gyre. Driven through the documented same-root seam.
    const changes = await refreshInstallation(PACKAGE_ROOT, { verbose: false, backupGuides: false });
    assert.ok(changes.includes('Skipped Gyre reference assets (dev environment — files already in place)'),
      '2d1 must report the dev skip');
    assert.ok(changes.includes('Skipped Gyre guides (dev environment — files already in place)'),
      '2d2 must report the dev skip too');
  });
});
