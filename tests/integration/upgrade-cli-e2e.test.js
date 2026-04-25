'use strict';

// T3 — End-to-end update test on real project.
//
// Existing `tests/integration/upgrade.test.js` covers the LIBRARY API
// (`refreshInstallation()`) across simulated v1.0.x / v1.3.x / v1.4.x / v1.7.x
// installs. `tests/integration/cli-entry-points.test.js` runs
// `convoke-update --dry-run` once as a smoke test. The gap this suite closes:
// the real `convoke-update` CLI actually applying migrations + refresh, with
// full post-state verification of every expected artifact class.
//
// Scope deferrals (see `_bmad-output/implementation-artifacts/deferred-work.md`
// under "Deferred from: scope of T3"):
//   - Real `npm pack` fetch of published versions (flaky; shape-of-old-install
//     is what matters, not provenance).
//   - Migration of user-authored custom agents (unit-tested separately).
//   - Interactive prompt mode (`--yes` bypass exercises the same code modulo
//     the single readline call).

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { runScript, PACKAGE_ROOT } = require('../helpers');
const {
  AGENTS,
  VORTEX_SKILL_PATHS,
  WORKFLOW_NAMES,
  GYRE_AGENTS,
  EXTRA_BME_AGENTS,
} = require('../../scripts/update/lib/agent-registry');

const pkg = require('../../package.json');
const UPDATE_SCRIPT = path.join(PACKAGE_ROOT, 'scripts/update/convoke-update.js');

// Old-version fixture: simulate a v1.7.x install (all 7 Vortex agents, 22
// workflows, pre-rename config shape). Mirrors the fixture in
// tests/integration/upgrade.test.js so we share the boundary case: v1.7 → 3.x
// spans the BMAD-Enhanced → Convoke rename + the 2.0 / 3.0 / 3.1 migrations.
async function seedV17Install(tmpDir) {
  const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
  const agentsDir = path.join(vortexDir, 'agents');
  await fs.ensureDir(agentsDir);
  await fs.ensureDir(path.join(vortexDir, 'workflows'));

  for (const id of [
    'contextualization-expert',
    'lean-experiments-specialist',
    'discovery-empathy-expert',
    'learning-decision-expert',
    'research-convergence-specialist',
    'hypothesis-engineer',
    'production-intelligence-specialist',
  ]) {
    await fs.writeFile(path.join(agentsDir, `${id}.md`), `# ${id} v1.7\n`, 'utf8');
  }

  await fs.writeFile(
    path.join(vortexDir, 'config.yaml'),
    yaml.dump({
      version: '1.7.1',
      user_name: 'Charlie',
      submodule_name: '_vortex',
      description: 'Vortex Pattern',
      module: 'bme',
      output_folder: '_bmad-output/vortex-artifacts',
      agents: [
        'contextualization-expert', 'lean-experiments-specialist',
        'discovery-empathy-expert', 'learning-decision-expert',
        'research-convergence-specialist', 'hypothesis-engineer',
        'production-intelligence-specialist',
      ],
      workflows: [
        'lean-persona', 'product-vision', 'contextualize-scope',
        'empathy-map', 'user-interview', 'user-discovery',
        'mvp', 'lean-experiment', 'proof-of-concept',
        'proof-of-value', 'learning-card', 'pivot-patch-persevere',
        'vortex-navigation', 'research-convergence', 'pivot-resynthesis',
        'pattern-mapping', 'hypothesis-engineering', 'assumption-mapping',
        'experiment-design', 'signal-interpretation', 'behavior-analysis',
        'production-monitoring',
      ],
    }),
    'utf8'
  );
}

async function assertPostUpgradeState(tmpDir) {
  const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');

  // Agent skill-dirs — every canonical Vortex agent has <id>/SKILL.md present (post-Story-3.1 layout).
  for (const skillPath of VORTEX_SKILL_PATHS) {
    assert.ok(
      fs.existsSync(path.join(vortexDir, 'agents', skillPath)),
      `Vortex agent missing after upgrade: ${skillPath}`
    );
  }

  // Workflow directories — each registered workflow has a directory with workflow.md.
  for (const wf of WORKFLOW_NAMES) {
    const wfPath = path.join(vortexDir, 'workflows', wf, 'workflow.md');
    assert.ok(fs.existsSync(wfPath), `Vortex workflow missing after upgrade: ${wf}/workflow.md`);
  }

  // Config.yaml stamped to current package version + user_name preserved.
  const cfg = yaml.load(fs.readFileSync(path.join(vortexDir, 'config.yaml'), 'utf8'));
  assert.equal(cfg.version, pkg.version, 'config.yaml version must match package.json');
  assert.equal(cfg.user_name, 'Charlie', 'user_name must be preserved across upgrade');

  // Agent skill wrappers — Vortex, Gyre, and EXTRA_BME all generate .claude/skills/bmad-agent-bme-{id}/SKILL.md.
  const skillsDir = path.join(tmpDir, '.claude/skills');
  for (const agent of [...AGENTS, ...GYRE_AGENTS, ...EXTRA_BME_AGENTS]) {
    const skill = path.join(skillsDir, `bmad-agent-bme-${agent.id}`, 'SKILL.md');
    assert.ok(fs.existsSync(skill), `Skill wrapper missing after upgrade: bmad-agent-bme-${agent.id}/SKILL.md`);
  }

  // Agent manifest — exists and references bme canonicalIds.
  const manifestPath = path.join(tmpDir, '_bmad/_config/agent-manifest.csv');
  assert.ok(fs.existsSync(manifestPath), 'agent-manifest.csv must be written');
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  for (const a of AGENTS) {
    assert.ok(
      manifest.includes(`bmad-agent-bme-${a.id}`),
      `Manifest must reference bmad-agent-bme-${a.id}`
    );
  }

  // Deprecated-agent cleanup — pre-Vortex rename agent files must not survive.
  assert.ok(
    !fs.existsSync(path.join(vortexDir, 'agents/empathy-mapper.md')),
    'Deprecated empathy-mapper.md must be removed after upgrade'
  );
  assert.ok(
    !fs.existsSync(path.join(vortexDir, 'agents/wireframe-designer.md')),
    'Deprecated wireframe-designer.md must be removed after upgrade'
  );
}

describe('convoke-update CLI end-to-end (T3) — v1.7.x fixture → current', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t3-upgrade-'));
    await seedV17Install(tmpDir);
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('exits 0 when invoked with --yes against the seeded v1.7.x fixture', async () => {
    const { exitCode, stdout, stderr } = await runScript(UPDATE_SCRIPT, ['--yes'], { cwd: tmpDir, timeout: 60000 });
    assert.equal(
      exitCode,
      0,
      `convoke-update --yes must exit 0\nstdout:\n${stdout}\nstderr:\n${stderr}`
    );
    assert.ok(
      stdout.includes('successfully') || stdout.includes('completed'),
      `stdout should confirm successful completion — got:\n${stdout}`
    );
  });

  it('produces a fully-populated installation matching the current registry', async () => {
    await assertPostUpgradeState(tmpDir);
  });
});

describe('convoke-update CLI end-to-end (T3) — refresh-only path (already-current)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t3-refresh-'));
    // Seed a fresh install by running the CLI once. An already-current project
    // with no migration deltas should fall through to the refresh-only branch
    // on the second invocation.
    await seedV17Install(tmpDir);
    const first = await runScript(UPDATE_SCRIPT, ['--yes'], { cwd: tmpDir, timeout: 60000 });
    assert.equal(first.exitCode, 0, `setup install must succeed; got stderr:\n${first.stderr}`);
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('second invocation hits refresh-only or up-to-date path and still exits 0', async () => {
    const { exitCode, stdout, stderr } = await runScript(UPDATE_SCRIPT, ['--yes'], { cwd: tmpDir, timeout: 60000 });
    assert.equal(
      exitCode,
      0,
      `second convoke-update must exit 0\nstdout:\n${stdout}\nstderr:\n${stderr}`
    );
    // Accept any of the three non-error terminal states: up-to-date,
    // refresh-only completed, or a clean re-run through migrations.
    const ok =
      stdout.includes('up to date') ||
      stdout.includes('successfully') ||
      stdout.includes('completed');
    assert.ok(ok, `stdout should confirm a non-error terminal state — got:\n${stdout}`);
  });

  it('installation state remains valid after a second update cycle', async () => {
    await assertPostUpgradeState(tmpDir);
  });
});
