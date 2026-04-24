const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');
const { runScript, PACKAGE_ROOT } = require('../helpers');
const { AGENT_IDS, WORKFLOW_NAMES } = require('../../scripts/update/lib/agent-registry');

const installerScript = path.join(PACKAGE_ROOT, 'scripts/install-vortex-agents.js');

function runInstaller(cwd) {
  return runScript(installerScript, [], { cwd });
}

describe('install-vortex-agents CLI E2E', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-e2e-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('completes without error on a fresh directory', async () => {
    const { exitCode, stdout } = await runInstaller(tmpDir);
    assert.equal(exitCode, 0, 'installer should exit cleanly');
    assert.ok(stdout.length > 0, 'should produce output');
  });

  it('creates all agent files (registry-driven)', async () => {
    for (const agentId of AGENT_IDS) {
      // Story v63-3-1: Vortex migrated to skill-dir layout (<id>/SKILL.md).
      const agentPath = path.join(tmpDir, '_bmad/bme/_vortex/agents', agentId, 'SKILL.md');
      assert.ok(fs.existsSync(agentPath), `${agentId}/SKILL.md should exist`);
      const stat = fs.statSync(agentPath);
      assert.ok(stat.size > 0, `${agentId}/SKILL.md should be non-empty`);
    }
  });

  it('creates config.yaml with correct version', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    assert.ok(fs.existsSync(configPath), 'config.yaml should exist');

    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    const pkg = require('../../package.json');
    assert.equal(config.version, pkg.version);
  });

  it('creates agent-manifest.csv with all agents (registry-driven)', async () => {
    const manifestPath = path.join(tmpDir, '_bmad/_config/agent-manifest.csv');
    assert.ok(fs.existsSync(manifestPath), 'agent-manifest.csv should exist');

    const content = fs.readFileSync(manifestPath, 'utf8');
    for (const agentId of AGENT_IDS) {
      assert.ok(content.includes(agentId), `manifest should list ${agentId}`);
    }
  });

  it('creates output directory', async () => {
    const outputDir = path.join(tmpDir, '_bmad-output/vortex-artifacts');
    assert.ok(fs.existsSync(outputDir), 'output directory should exist');
  });

  it('creates all workflow directories (registry-driven)', async () => {
    const workflowsDir = path.join(tmpDir, '_bmad/bme/_vortex/workflows');
    assert.ok(fs.existsSync(workflowsDir), 'workflows directory should exist');

    for (const wf of WORKFLOW_NAMES) {
      assert.ok(
        fs.existsSync(path.join(workflowsDir, wf)),
        `${wf} workflow directory should exist`
      );
    }
  });

  it('is idempotent (re-run succeeds)', async () => {
    const { exitCode } = await runInstaller(tmpDir);
    assert.equal(exitCode, 0, 'second run should also succeed');
  });
});
