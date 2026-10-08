const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const { GYRE_AGENTS } = require('../../scripts/update/lib/agent-registry');
const {
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
//   THE ASYMMETRY HALF. Vortex has had a guides phase since U8 and Gyre never did, so five shipped
//   guides reached no project. Nothing dangled for want of them, so the evidence is parity with the
//   Vortex phase in the two respects that make a guides phase different from a copy: it is
//   exclusion-aware and backup-aware.
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

  it('installs every shipped guide, and the set is derived from the roster', async () => {
    await refreshInstallation(tmpDir, { verbose: false });

    // Derived from GYRE_AGENTS plus the team guide, so adding an agent without its guide fails here
    // rather than silently installing four of five.
    const expected = [...GYRE_AGENTS.map(guideFor), TEAM_GUIDE].sort();
    assert.deepEqual((await fs.readdir(guides())).sort(), expected);
    // Vacuity: a roster of zero would make the assertion above trivially true.
    assert.ok(GYRE_AGENTS.length >= 4, 'fixture: the Gyre roster must be non-trivial');
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

  it('backs up an operator-annotated guide before overwriting it', async () => {
    await refreshInstallation(tmpDir, { verbose: false });

    const guide = guideFor(GYRE_AGENTS[0]);
    const target = path.join(guides(), guide);
    const annotation = 'OPERATOR ANNOTATION — must survive in the .bak\n';
    await fs.writeFile(target, annotation, 'utf8');

    await refreshInstallation(tmpDir, { verbose: false });

    assert.equal(await fs.readFile(`${target}.bak`, 'utf8'), annotation,
      'the operator\'s text must be preserved in the .bak, not merely a .bak created');
    assert.notEqual(await fs.readFile(target, 'utf8'), annotation,
      'the guide itself must be refreshed from the package');
  });

  it('writes no .bak when backupGuides is false', async () => {
    await refreshInstallation(tmpDir, { verbose: false });
    const target = path.join(guides(), guideFor(GYRE_AGENTS[0]));
    await fs.writeFile(target, 'annotated\n', 'utf8');

    await refreshInstallation(tmpDir, { verbose: false, backupGuides: false });

    assert.ok(!fs.existsSync(`${target}.bak`), 'backupGuides: false must suppress the .bak');
  });

  it('reports both phases in the changes array', async () => {
    const changes = await refreshInstallation(tmpDir, { verbose: false });
    assert.ok(changes.some((c) => /Refreshed Gyre compass-routing-reference\.md/.test(c)),
      'the reference copy must be reported');
    assert.ok(changes.some((c) => new RegExp(`Refreshed Gyre guide: ${TEAM_GUIDE}`).test(c)),
      'the guides phase must be reported');
  });
});
