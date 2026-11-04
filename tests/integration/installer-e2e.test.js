const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');
const { runScript, PACKAGE_ROOT, removeTempDir } = require('../helpers');
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
    await removeTempDir(tmpDir);
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

// BUG-20: both installers looked for `_bmad/_config/bmad.yaml`, which BMAD's installer does not
// write, so every BMAD project was told "BMAD Method not detected" — and the preflight said the
// same from `node_modules`. Both now read BMAD's install record, `_bmad/_config/manifest.yaml`.
describe('installers report a BMAD install that exists (BUG-20)', () => {
  const INSTALLERS = {
    vortex: path.join(PACKAGE_ROOT, 'scripts/install-vortex-agents.js'),
    gyre: path.join(PACKAGE_ROOT, 'scripts/install-gyre-agents.js'),
  };
  const MANIFEST = 'installation:\n  version: 6.10.0\nmodules:\n  - name: core\n    version: 6.10.0\n';

  for (const [team, script] of Object.entries(INSTALLERS)) {
    it(`${team}: a project with a BMAD install record is told BMAD was found, by both checks`, async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-e2e-'));
      try {
        await fs.ensureDir(path.join(dir, '_bmad/_config'));
        await fs.writeFile(path.join(dir, '_bmad/_config/manifest.yaml'), MANIFEST, 'utf8');
        const { exitCode, stdout, stderr } = await runScript(script, [], { cwd: dir, timeout: 60000 });
        assert.equal(exitCode, 0, stderr);
        assert.ok(stdout.includes('BMAD Method 6.10.0 found'), stdout);
        assert.ok(!stdout.includes('BMAD Method not detected'), stdout);
        assert.ok(!stderr.includes('BMAD core not detected'), stderr);
      } finally {
        await removeTempDir(dir);
      }
    });

    it(`${team}: a BMAD below the floor is reported found but too old, never with a green check`, async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-e2e-'));
      try {
        await fs.ensureDir(path.join(dir, '_bmad/_config'));
        await fs.writeFile(path.join(dir, '_bmad/_config/manifest.yaml'),
          MANIFEST.replace(/6\.10\.0/g, '6.2.0'), 'utf8');
        const { exitCode, stdout, stderr } = await runScript(script, [], { cwd: dir, timeout: 60000 });
        assert.equal(exitCode, 0, stderr);
        assert.ok(stderr.includes('BMAD 6.2.0 detected; Convoke 4.0 requires >= 6.3.0'), stderr);
        assert.ok(stdout.includes('BMAD Method 6.2.0 found, below the 6.3.0 Convoke needs'), stdout);
        assert.ok(!/✓\S*\s+BMAD Method 6\.2\.0 found/.test(stdout), stdout);
      } finally {
        await removeTempDir(dir);
      }
    });

    it(`${team}: a record whose version is not a version does not produce a "found" line`, async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-e2e-'));
      try {
        await fs.ensureDir(path.join(dir, '_bmad/_config'));
        await fs.writeFile(path.join(dir, '_bmad/_config/manifest.yaml'),
          'modules:\n  - name: core\n    version: latest\n', 'utf8');
        const { exitCode, stdout, stderr } = await runScript(script, [], { cwd: dir, timeout: 60000 });
        assert.equal(exitCode, 0, stderr);
        assert.ok(stderr.includes('BMAD core not detected'), stderr);
        assert.ok(stdout.includes('BMAD Method not detected'), stdout);
        assert.ok(!stdout.includes('BMAD Method latest found'), stdout);
      } finally {
        await removeTempDir(dir);
      }
    });

    it(`${team}: a project with no BMAD install record is still told so`, async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-e2e-'));
      try {
        const { exitCode, stdout, stderr } = await runScript(script, [], { cwd: dir, timeout: 60000 });
        assert.equal(exitCode, 0, stderr);
        assert.ok(stdout.includes('BMAD Method not detected'), stdout);
        assert.ok(stderr.includes('BMAD core not detected'), stderr);
      } finally {
        await removeTempDir(dir);
      }
    });
  }
});
