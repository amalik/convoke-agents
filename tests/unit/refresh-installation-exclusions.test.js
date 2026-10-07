const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const { AGENTS, GYRE_AGENTS } = require('../../scripts/update/lib/agent-registry');
const { createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

// Minimal pm.md needed because the Enhance block runs alongside the main install flow
const MINIMAL_PM_MD = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
</agent>`;

async function setupProject() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-u8-excl-'));
  await createValidInstallation(tmpDir);

  const pmDir = path.join(tmpDir, '_bmad/bmm/agents');
  await fs.ensureDir(pmDir);
  await fs.writeFile(path.join(pmDir, 'pm.md'), MINIMAL_PM_MD, 'utf8');

  return tmpDir;
}

async function setExcludedAgents(configPath, excludedIds) {
  const cfg = yaml.load(fs.readFileSync(configPath, 'utf8'));
  cfg.excluded_agents = excludedIds;
  fs.writeFileSync(configPath, yaml.dump(cfg), 'utf8');
}

// === U8: Vortex agent exclusions ===

describe('refreshInstallation — Vortex excluded_agents (U8)', () => {
  let tmpDir;
  const EXCLUDED_ID = 'production-intelligence-specialist';
  const EXCLUDED_AGENT = AGENTS.find(a => a.id === EXCLUDED_ID);

  beforeEach(async () => {
    tmpDir = await setupProject();
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    await setExcludedAgents(configPath, [EXCLUDED_ID]);
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('does not copy the excluded agent file on refresh', async () => {
    // Story v63-3-1: Vortex now uses skill-dir layout (<id>/SKILL.md).
    const agentPath = path.join(tmpDir, `_bmad/bme/_vortex/agents/${EXCLUDED_ID}/SKILL.md`);
    const agentDir = path.join(tmpDir, `_bmad/bme/_vortex/agents/${EXCLUDED_ID}`);
    if (fs.existsSync(agentDir)) await fs.remove(agentDir);

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(!fs.existsSync(agentPath), `${EXCLUDED_ID}/SKILL.md must not be copied when excluded`);
  });

  it('does not generate skill wrapper for the excluded agent', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const skillDir = path.join(tmpDir, `.claude/skills/bmad-agent-bme-${EXCLUDED_ID}`);
    assert.ok(!fs.existsSync(skillDir), 'excluded agent skill wrapper must not exist');
  });

  it('removes a pre-existing skill wrapper for the excluded agent (stale cleanup)', async () => {
    // Seed a stale wrapper that refresh should clean up because the agent is excluded.
    const skillDir = path.join(tmpDir, `.claude/skills/bmad-agent-bme-${EXCLUDED_ID}`);
    await fs.ensureDir(skillDir);
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), '# stale wrapper', 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(!fs.existsSync(skillDir), 'stale wrapper for excluded agent must be removed');
  });

  it('does not copy the excluded agent user guide', async () => {
    const guideName = `${EXCLUDED_AGENT.name.toUpperCase()}-USER-GUIDE.md`;
    const guidePath = path.join(tmpDir, '_bmad/bme/_vortex/guides', guideName);
    if (fs.existsSync(guidePath)) await fs.remove(guidePath);

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(!fs.existsSync(guidePath), 'excluded agent user guide must not be copied');
  });

  it('omits the excluded agent from agent-manifest.csv', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const manifestPath = path.join(tmpDir, '_bmad/_config/agent-manifest.csv');
    assert.ok(fs.existsSync(manifestPath), 'manifest must be written');
    const content = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(!content.includes(`bmad-agent-bme-${EXCLUDED_ID}`),
      'manifest must not reference the excluded agent canonicalId');
    assert.ok(!content.includes(`_vortex/agents/${EXCLUDED_ID}/SKILL.md`),
      'manifest must not reference the excluded Vortex agent path');
  });

  it('still copies non-excluded agents (no over-filter)', async () => {
    const kept = AGENTS.find(a => a.id !== EXCLUDED_ID);
    // Story v63-3-1: Vortex skill-dir layout.
    const keptPath = path.join(tmpDir, `_bmad/bme/_vortex/agents/${kept.id}/SKILL.md`);
    const keptDir = path.join(tmpDir, `_bmad/bme/_vortex/agents/${kept.id}`);
    if (fs.existsSync(keptDir)) await fs.remove(keptDir);

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(fs.existsSync(keptPath), `non-excluded agent ${kept.id}/SKILL.md must still be copied`);
  });

  it('updates config.yaml so agents list excludes the agent and excluded_agents is preserved', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const cfg = yaml.load(fs.readFileSync(path.join(tmpDir, '_bmad/bme/_vortex/config.yaml'), 'utf8'));
    assert.ok(!cfg.agents.includes(EXCLUDED_ID), 'merged agents list must omit excluded');
    assert.deepEqual(cfg.excluded_agents, [EXCLUDED_ID]);
  });
});

// === U8: Gyre agent exclusions ===

describe('refreshInstallation — Gyre excluded_agents (U8)', () => {
  let tmpDir;
  const EXCLUDED_ID = 'review-coach';

  beforeEach(async () => {
    tmpDir = await setupProject();
    // Seed a minimal Gyre config with exclusion — refresh will merge against it.
    const gyreDir = path.join(tmpDir, '_bmad/bme/_gyre');
    await fs.ensureDir(gyreDir);
    fs.writeFileSync(
      path.join(gyreDir, 'config.yaml'),
      yaml.dump({
        submodule_name: '_gyre',
        module: 'bme',
        agents: GYRE_AGENTS.map(a => a.id),
        workflows: [],
        version: '1.0.0',
        excluded_agents: [EXCLUDED_ID],
      }),
      'utf8'
    );
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('does not copy the excluded Gyre agent file', async () => {
    const agentPath = path.join(tmpDir, `_bmad/bme/_gyre/agents/${EXCLUDED_ID}.md`);
    if (fs.existsSync(agentPath)) await fs.remove(agentPath);

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(!fs.existsSync(agentPath), `${EXCLUDED_ID}.md must not be copied when excluded`);
  });

  it('does not generate skill wrapper for the excluded Gyre agent', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const skillDir = path.join(tmpDir, `.claude/skills/bmad-agent-bme-${EXCLUDED_ID}`);
    assert.ok(!fs.existsSync(skillDir), 'excluded Gyre agent skill wrapper must not exist');
  });

  it('omits the excluded Gyre agent from agent-manifest.csv', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const manifestPath = path.join(tmpDir, '_bmad/_config/agent-manifest.csv');
    const content = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(!content.includes(`bmad-agent-bme-${EXCLUDED_ID}`));
    assert.ok(!content.includes(`_gyre/agents/${EXCLUDED_ID}.md`));
  });

  it('still copies non-excluded Gyre agents (no over-filter)', async () => {
    // Pre-remove a non-excluded Gyre agent file so we can assert refresh re-copied it.
    const kept = GYRE_AGENTS.find(a => a.id !== EXCLUDED_ID);
    const keptPath = path.join(tmpDir, `_bmad/bme/_gyre/agents/${kept.id}.md`);
    if (fs.existsSync(keptPath)) await fs.remove(keptPath);

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(fs.existsSync(keptPath), `non-excluded Gyre agent ${kept.id}.md must still be copied`);
  });
});

// === T250 R3: the two `{ profile }` wirings on this file's reads ===
//
// Both were deletable with every test green — including this file's own — because nothing
// anywhere drove `refreshInstallation` with an unknown id and read stderr. That is the Round 2
// HIGH repeating one layer up: the fix was pinned in the abstract and unpinned at the sites.
//
// Each test uses a CROSS-MODULE id rather than a typo, so it binds WHICH profile the wiring
// passes. A typo is unknown to both modules, so a wiring that hands over the wrong profile
// produces identical output and cannot be caught.

describe('refreshInstallation — T250 reports an unknown excluded id, per module', () => {
  let tmpDir;
  beforeEach(async () => {
    tmpDir = await setupProject();
    // `createValidInstallation` seeds Vortex only, so the Gyre config is written here — the same
    // minimal shape the Gyre block above uses. Without it the Gyre read is never reached and two
    // of these tests fail on ENOENT rather than on the property they assert.
    const gyreDir = path.join(tmpDir, '_bmad/bme/_gyre');
    await fs.ensureDir(gyreDir);
    fs.writeFileSync(path.join(gyreDir, 'config.yaml'), yaml.dump({
      submodule_name: '_gyre', module: 'bme',
      agents: GYRE_AGENTS.map((a) => a.id), workflows: [], version: '1.0.0',
      excluded_agents: [],
    }), 'utf8');
  });
  afterEach(async () => { restoreConsole(); if (tmpDir) await fs.remove(tmpDir); });

  /** Run a refresh, returning every `console.warn` line. */
  async function refreshCapturingWarnings() {
    const real = console.warn;
    const said = [];
    console.warn = (m) => said.push(String(m));
    try {
      await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    } finally { console.warn = real; }
    return said;
  }

  it('reports a Vortex agent id listed in GYRE\'s config', async () => {
    // `contextualization-expert` is a real Vortex agent and no Gyre agent, so it can only be
    // reported if the Gyre read is given GYRE's profile.
    await setExcludedAgents(path.join(tmpDir, '_bmad/bme/_gyre/config.yaml'), ['contextualization-expert']);
    const said = await refreshCapturingWarnings();
    const hits = said.filter((m) => /no agent this module knows about/.test(m) && /contextualization-expert/.test(m));
    assert.equal(hits.length, 1, `expected one report; got ${JSON.stringify(said)}`);
    assert.match(hits[0], /_gyre\/config\.yaml/, 'and it must name the Gyre config, not the Vortex one');
  });

  it('reports a Gyre agent id listed in VORTEX\'s config', async () => {
    await setExcludedAgents(path.join(tmpDir, '_bmad/bme/_vortex/config.yaml'), ['review-coach']);
    const said = await refreshCapturingWarnings();
    const hits = said.filter((m) => /no agent this module knows about/.test(m) && /review-coach/.test(m));
    assert.equal(hits.length, 1, `expected one report; got ${JSON.stringify(said)}`);
    assert.match(hits[0], /_vortex\/config\.yaml/);
  });

  // THE SAME-ROOT BRANCH, which is the only one where these two wirings do any work: elsewhere
  // `mergeConfig` runs first and reports, so deleting either wiring was invisible. `packageRoot`
  // is injected to reach it — in a dev tree both `mergeConfig` calls are skipped while the reads
  // and the wrapper work still happen.
  it('reports an unknown id in a SAME-ROOT tree, where mergeConfig is skipped', async () => {
    await setExcludedAgents(path.join(tmpDir, '_bmad/bme/_gyre/config.yaml'), ['contextualization-expert']);
    await setExcludedAgents(path.join(tmpDir, '_bmad/bme/_vortex/config.yaml'), ['review-coach']);
    const real = console.warn;
    const said = [];
    console.warn = (m) => said.push(String(m));
    let changes;
    try {
      changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false, packageRoot: tmpDir });
    } finally { console.warn = real; }
    // THE PREMISE, asserted. Without this the test passes whether or not it is in the same-root
    // branch: if the `packageRoot` override were ignored, `isSameRoot` would be false, `mergeConfig`
    // would run and report, and the two assertions below would still hold — so a mutant that
    // ignores the override survived. `Skipped agent copy (dev environment …)` is only pushed when
    // `isSameRoot` is true, which makes the branch observable.
    const flat = Array.isArray(changes) ? changes.join('\n') : String(changes && changes.changes);
    assert.match(flat, /dev environment/,
      `this test must run in the SAME-ROOT branch, or it proves nothing about the reads; changes were ${flat}`);
    const reports = said.filter((m) => /no agent this module knows about/.test(m));
    assert.equal(reports.length, 2,
      `both reads must report in a same-root tree; got ${JSON.stringify(said)}`);
    assert.ok(reports.some((m) => /_gyre\/config\.yaml/.test(m) && /contextualization-expert/.test(m)),
      'the Gyre read must report the Vortex id, with the Gyre profile');
    assert.ok(reports.some((m) => /_vortex\/config\.yaml/.test(m) && /review-coach/.test(m)),
      'and the Vortex read must report the Gyre id');
  });

  it('says nothing when both modules exclude their OWN agents', async () => {
    // The common path: an operator with a correct opt-out must see no new noise.
    await setExcludedAgents(path.join(tmpDir, '_bmad/bme/_vortex/config.yaml'), ['production-intelligence-specialist']);
    await setExcludedAgents(path.join(tmpDir, '_bmad/bme/_gyre/config.yaml'), ['review-coach']);
    const said = await refreshCapturingWarnings();
    assert.deepEqual(said.filter((m) => /no agent this module knows about/.test(m)), [],
      'a valid exclusion in each module must be silent');
  });
});
