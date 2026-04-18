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
    // Remove the pre-existing agent file so we can assert refresh did not re-copy it.
    const agentPath = path.join(tmpDir, `_bmad/bme/_vortex/agents/${EXCLUDED_ID}.md`);
    if (fs.existsSync(agentPath)) await fs.remove(agentPath);

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(!fs.existsSync(agentPath), `${EXCLUDED_ID}.md must not be copied when excluded`);
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
    assert.ok(!content.includes(`agents/${EXCLUDED_ID}.md`),
      'manifest must not reference the excluded agent path');
  });

  it('still copies non-excluded agents (no over-filter)', async () => {
    const kept = AGENTS.find(a => a.id !== EXCLUDED_ID);
    const keptPath = path.join(tmpDir, `_bmad/bme/_vortex/agents/${kept.id}.md`);
    if (fs.existsSync(keptPath)) await fs.remove(keptPath);

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(fs.existsSync(keptPath), `non-excluded agent ${kept.id}.md must still be copied`);
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
