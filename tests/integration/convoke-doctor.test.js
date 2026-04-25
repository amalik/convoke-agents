const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { runScript, PACKAGE_ROOT } = require('../helpers');
const pkg = require('../../package.json');

const doctorScript = path.join(PACKAGE_ROOT, 'scripts/convoke-doctor.js');
// Fixtures below use `pkg.version` for config `version:` fields so they
// track package.json automatically — satisfies project-context.md rule
// "no-hardcoded-versions". The "version mismatch" test deliberately uses
// "0.0.1" (a literal) because it's testing version-inconsistency detection.
const CURRENT_CONFIG_YAML = `version: "${pkg.version}"\nagents:\n  - contextualization-expert\n`;

function runDoctor(cwd) {
  return runScript(doctorScript, [], { cwd });
}

describe('convoke-doctor: no project root', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when no _bmad directory exists', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    assert.equal(exitCode, 1, 'should exit with code 1');
    assert.ok(stdout.includes('Project root'), 'should report project root check');
  });
});

describe('convoke-doctor: missing config', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-'));
    // Create _bmad but no config
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when config.yaml is missing', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    assert.equal(exitCode, 1, 'should exit with code 1');
    assert.ok(stdout.includes('Module discovery'), 'should check module discovery');
    assert.ok(stdout.includes('No modules found') || stdout.includes('issue'), 'should report no modules found');
  });
});

describe('convoke-doctor: invalid config YAML', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex'));
    // Write invalid YAML
    await fs.writeFile(
      path.join(tmpDir, '_bmad/bme/_vortex/config.yaml'),
      '{ invalid yaml: [[[',
      'utf8'
    );
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('reports YAML parse error', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    assert.equal(exitCode, 1, 'should exit with code 1');
    assert.ok(stdout.includes('config'), 'should check config');
  });
});

describe('convoke-doctor: missing agent files', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    // Write valid config but no agent files
    await fs.writeFile(
      path.join(vortexDir, 'config.yaml'),
      CURRENT_CONFIG_YAML,
      'utf8'
    );
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('reports missing agent files', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    assert.equal(exitCode, 1, 'should exit with code 1');
    assert.ok(stdout.includes('agents'), 'should check agents');
    assert.ok(stdout.includes('Missing') || stdout.includes('issue'), 'should report missing agents');
  });
});

describe('convoke-doctor: empty agent files', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    const agentsDir = path.join(vortexDir, 'agents');
    await fs.ensureDir(agentsDir);
    await fs.writeFile(
      path.join(vortexDir, 'config.yaml'),
      CURRENT_CONFIG_YAML,
      'utf8'
    );
    // Create all 7 agent skill-dirs with empty SKILL.md (0 bytes) — post-Story-3.1 layout
    const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
    for (const id of AGENT_IDS) {
      const agentDir = path.join(agentsDir, id);
      await fs.ensureDir(agentDir);
      await fs.writeFile(path.join(agentDir, 'SKILL.md'), '', 'utf8');
    }
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('reports empty agent files', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    assert.equal(exitCode, 1, 'should exit with code 1');
    assert.ok(stdout.includes('agents'), 'should check agents');
    assert.ok(stdout.includes('Empty') || stdout.includes('empty'), 'should report empty agents');
  });
});

describe('convoke-doctor: stale migration lock', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.writeFile(
      path.join(vortexDir, 'config.yaml'),
      CURRENT_CONFIG_YAML,
      'utf8'
    );
    // Create a stale lock file (10 minutes old)
    const outputDir = path.join(tmpDir, '_bmad-output');
    await fs.ensureDir(outputDir);
    await fs.writeJson(path.join(outputDir, '.migration-lock'), {
      timestamp: Date.now() - 10 * 60 * 1000,
      pid: 99999
    });
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('reports stale migration lock', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    assert.equal(exitCode, 1, 'should exit with code 1');
    assert.ok(stdout.includes('Migration lock'), 'should check migration lock');
    assert.ok(stdout.includes('Stale') || stdout.includes('stale') || stdout.includes('issue'), 'should report stale lock');
  });
});

describe('convoke-doctor: version mismatch', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));
    // Config with old version
    await fs.writeFile(
      path.join(vortexDir, 'config.yaml'),
      'version: "0.0.1"\nagents:\n  - contextualization-expert\n',
      'utf8'
    );
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('reports version inconsistency', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    assert.equal(exitCode, 1, 'should exit with code 1');
    assert.ok(stdout.includes('Version consistency'), 'should check version consistency');
  });
});

describe('convoke-doctor: corrupt migration lock', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.writeFile(
      path.join(vortexDir, 'config.yaml'),
      CURRENT_CONFIG_YAML,
      'utf8'
    );
    // Create a corrupt lock file
    const outputDir = path.join(tmpDir, '_bmad-output');
    await fs.ensureDir(outputDir);
    await fs.writeFile(path.join(outputDir, '.migration-lock'), 'not json at all', 'utf8');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('reports corrupt lock file', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    assert.equal(exitCode, 1, 'should exit with code 1');
    assert.ok(stdout.includes('Migration lock'), 'should check migration lock');
    assert.ok(stdout.includes('Corrupt') || stdout.includes('corrupt') || stdout.includes('issue'), 'should report corrupt lock');
  });
});

describe('convoke-doctor: excluded_agents (U8)', () => {
  let tmpDir;
  const EXCLUDED_ID = 'production-intelligence-specialist';

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-excl-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));

    // Config: agents list omits the excluded agent; excluded_agents lists it.
    const yaml = require('js-yaml');
    const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
    const activeAgents = AGENT_IDS.filter(id => id !== EXCLUDED_ID);
    fs.writeFileSync(
      path.join(vortexDir, 'config.yaml'),
      yaml.dump({
        version: pkg.version,
        agents: activeAgents,
        workflows: [],
        excluded_agents: [EXCLUDED_ID],
      }),
      'utf8'
    );

    // Write agent skill-dirs for all active agents (NOT the excluded one) — post-Story-3.1 layout.
    for (const id of activeAgents) {
      const agentDir = path.join(vortexDir, 'agents', id);
      await fs.ensureDir(agentDir);
      await fs.writeFile(path.join(agentDir, 'SKILL.md'), `# ${id}`, 'utf8');
    }

    // Seed skill wrappers for active agents only.
    const skillsDir = path.join(tmpDir, '.claude/skills');
    await fs.ensureDir(skillsDir);
    for (const id of activeAgents) {
      const dir = path.join(skillsDir, `bmad-agent-bme-${id}`);
      await fs.ensureDir(dir);
      await fs.writeFile(path.join(dir, 'SKILL.md'), '# stub', 'utf8');
    }
    // Seed wrappers for Gyre + EXTRA_BME agents too, since checkAgentSkillWrappers scans them.
    const { GYRE_AGENTS, EXTRA_BME_AGENTS } = require('../../scripts/update/lib/agent-registry');
    for (const a of [...GYRE_AGENTS, ...EXTRA_BME_AGENTS]) {
      const dir = path.join(skillsDir, `bmad-agent-bme-${a.id}`);
      await fs.ensureDir(dir);
      await fs.writeFile(path.join(dir, 'SKILL.md'), '# stub', 'utf8');
    }
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('surfaces the exclusion count and agent in the module agents info line', async () => {
    const { stdout } = await runDoctor(tmpDir);
    assert.ok(stdout.includes('_vortex agents'), 'should report module agents check');
    assert.ok(stdout.includes('excluded'), `info line should mention exclusion — stdout:\n${stdout}`);
    assert.ok(stdout.includes(EXCLUDED_ID), `info line should name the excluded agent — stdout:\n${stdout}`);
  });

  it('does not flag the excluded agent skill wrapper as missing', async () => {
    const { stdout } = await runDoctor(tmpDir);
    assert.ok(!stdout.includes(`Missing: .claude/skills/bmad-agent-bme-${EXCLUDED_ID}`),
      'excluded agent wrapper must not be flagged as missing');
  });
});

// Story v63-2-2 H1: governance warnings must NOT hard-fail the doctor exit
// code (NFR9 fail-soft contract). Unit tests enforce the field-level invariant
// but the exit-code wiring in `main()` needs an integration guard — if a
// future refactor swaps the `!c.passed && !c.softWarning` filter back to
// `!c.passed`, unit tests stay green while the regression reaches production.
describe('convoke-doctor: governance softWarning exit-code (Story v63-2-2 H1)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-softwarn-'));
    const yaml = require('js-yaml');
    const { AGENT_IDS, GYRE_AGENTS, EXTRA_BME_AGENTS } = require('../../scripts/update/lib/agent-registry');

    // _bmad/bme/_vortex/ — valid config + all agents present + workflows listed.
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));
    await fs.writeFile(
      path.join(vortexDir, 'config.yaml'),
      yaml.dump({ version: pkg.version, agents: [...AGENT_IDS], workflows: [] }),
      'utf8'
    );
    for (const id of AGENT_IDS) {
      const agentDir = path.join(vortexDir, 'agents', id);
      await fs.ensureDir(agentDir);
      await fs.writeFile(path.join(agentDir, 'SKILL.md'), `# ${id}`, 'utf8');
    }

    // Skill wrappers for all expected agents (Vortex + Gyre + EXTRA_BME).
    const skillsDir = path.join(tmpDir, '.claude/skills');
    await fs.ensureDir(skillsDir);
    for (const id of AGENT_IDS) {
      const dir = path.join(skillsDir, `bmad-agent-bme-${id}`);
      await fs.ensureDir(dir);
      await fs.writeFile(path.join(dir, 'SKILL.md'), '# stub', 'utf8');
    }
    for (const a of [...GYRE_AGENTS, ...EXTRA_BME_AGENTS]) {
      const dir = path.join(skillsDir, `bmad-agent-bme-${a.id}`);
      await fs.ensureDir(dir);
      await fs.writeFile(path.join(dir, 'SKILL.md'), '# stub', 'utf8');
    }

    // Valid taxonomy.yaml so `checkTaxonomy` passes (existing taxonomy check
    // uses `passed: false` without `softWarning` and would hard-fail exit).
    const taxonomyDir = path.join(tmpDir, '_bmad/_config');
    await fs.ensureDir(taxonomyDir);
    const realTaxonomy = await fs.readFile(
      path.join(PACKAGE_ROOT, '_bmad/_config/taxonomy.yaml'),
      'utf8'
    );
    await fs.writeFile(path.join(taxonomyDir, 'taxonomy.yaml'), realTaxonomy, 'utf8');

    // Output dir (writable) so checkOutputDir passes.
    await fs.ensureDir(path.join(tmpDir, '_bmad-output'));

    // Intentionally DO NOT create bmm-dependencies.csv — that triggers the
    // softWarning path ("registry not yet created") which is the state under
    // test.
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('exits 0 when BMM registry is absent (softWarning only, no hard failures)', async () => {
    const { exitCode, stdout } = await runDoctor(tmpDir);
    // NFR9 contract: governance warnings alone must not hard-fail exit.
    assert.equal(exitCode, 0,
      `governance warnings must not affect exit code; stdout:\n${stdout}`);
    // Confirm the softWarning was actually rendered (otherwise the test
    // proves nothing — we need to see the yellow ⚠ path exercised).
    assert.ok(stdout.includes('BMM dependencies'),
      `expected BMM dependencies check in output; stdout:\n${stdout}`);
    assert.ok(
      stdout.includes('bmm-dependencies.csv not found')
      || stdout.includes('governance warning'),
      `expected softWarning rendering; stdout:\n${stdout}`,
    );
  });

  it('summary line reports governance warning(s) without claiming hard failures', async () => {
    const { stdout } = await runDoctor(tmpDir);
    // Either "N governance warning(s) surfaced" (soft-only) or the all-pass
    // line — NEVER "issue(s) found" which is the hard-failure phrasing.
    assert.ok(!stdout.includes('issue(s) found'),
      `hard-failure summary must not appear for governance-only warnings; stdout:\n${stdout}`);
  });
});
