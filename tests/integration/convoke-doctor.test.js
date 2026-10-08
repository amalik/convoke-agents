const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { runScript, PACKAGE_ROOT, removeTempDir } = require('../helpers');
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
    await removeTempDir(tmpDir);
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
    await removeTempDir(tmpDir);
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
    await removeTempDir(tmpDir);
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
    await removeTempDir(tmpDir);
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
    await removeTempDir(tmpDir);
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
    await removeTempDir(tmpDir);
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
    await removeTempDir(tmpDir);
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
    await removeTempDir(tmpDir);
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
    const { GYRE_AGENTS } = require('../../scripts/update/lib/agent-registry');
    for (const a of [...GYRE_AGENTS]) {
      const dir = path.join(skillsDir, `bmad-agent-bme-${a.id}`);
      await fs.ensureDir(dir);
      await fs.writeFile(path.join(dir, 'SKILL.md'), '# stub', 'utf8');
    }
  });

  after(async () => {
    await removeTempDir(tmpDir);
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
    const { AGENT_IDS, GYRE_AGENTS } = require('../../scripts/update/lib/agent-registry');

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
    for (const a of [...GYRE_AGENTS]) {
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
    await removeTempDir(tmpDir);
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

// T249 — the WIRING, not the check. `checkExcludedAgents` is unit-tested in
// `tests/unit/excluded-agents-doctor.test.js`, and deleting its `checks.push(...)` call from the
// module loop left every one of those tests green. That is the same defect class that cost `T250`
// two review rounds: the thing is tested, the thing being CALLED is not. Only the CLI can bind it,
// because the assembly lives inside `main()`.
describe('convoke-doctor: a wrong excluded_agents value reaches the operator (T249)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-excl-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    // A bare scalar: the shape that made T244's operator lose their opt-out silently.
    await fs.writeFile(
      path.join(vortexDir, 'config.yaml'),
      `${CURRENT_CONFIG_YAML}excluded_agents: contextualization-expert\n`,
      'utf8'
    );
    // A SECOND module, deliberately CLEAN. With one module the wiring cannot be told from
    // `checkExcludedAgents(modules[0])` — reporting against the first module regardless of which
    // one is being checked survived the whole suite. With two, the finding must name the right one
    // and must NOT name the other.
    const gyreDir = path.join(tmpDir, '_bmad/bme/_gyre');
    await fs.ensureDir(path.join(gyreDir, 'agents'));
    await fs.writeFile(
      path.join(gyreDir, 'config.yaml'),
      `version: "${pkg.version}"\nagents:\n  - review-coach\nexcluded_agents: []\n`,
      'utf8'
    );
    // A THIRD module with NO `agents:` key at all, and a malformed exclusion. This is the
    // commit's central design decision — the check is NOT gated on a non-empty `agents` list —
    // and every previous fixture had one, so re-gating it survived.
    const portDir = path.join(tmpDir, '_bmad/bme/_portability');
    await fs.ensureDir(portDir);
    await fs.writeFile(
      path.join(portDir, 'config.yaml'),
      `version: "${pkg.version}"\nworkflows:\n  - export-skill\nexcluded_agents: oops-a-scalar\n`,
      'utf8'
    );
  });

  after(async () => { await removeTempDir(tmpDir); });

  it('prints the finding, names the field and the required shape', async () => {
    const { stdout, stderr } = await runDoctor(tmpDir);
    const out = `${stdout}${stderr}`;
    assert.ok(out.includes('excluded_agents'),
      `doctor said nothing about the field; output was:\n${out}`);
    assert.ok(out.includes('must be a YAML list of agent ids'),
      'the finding must name the required shape, not merely that something is wrong');
    assert.ok(/_vortex excluded_agents/.test(out),
      'and name the module whose config holds it');
    // H3: the finding must be attributed to the module being checked, not to whichever module
    // happens to be first. The clean module must draw no finding of its own.
    assert.ok(!/_gyre excluded_agents/.test(out),
      `the clean module must not be reported; output was:\n${out}`);
    // H4: the no-`agents:` module must still be reported — that is the ungating this commit added.
    assert.ok(/_portability excluded_agents/.test(out),
      `a module with no agents list must still be checked; output was:\n${out}`);
    // Exactly one finding per wrong module, two wrong modules here.
    assert.equal((out.match(/excluded_agents$/gm) || []).length, 2,
      `expected one finding line per wrong module; output was:\n${out}`);
  });

  it('does not change the exit code — a wrong opt-out is a soft warning', async () => {
    // The property the design turns on, asserted on the PROCESS rather than on a struct field: the
    // unit tests pin `softWarning: true`, and nothing pinned what an operator or CI actually sees.
    //
    // Asserted COMPARATIVELY, not as `exitCode === 0`. This fixture has unrelated hard failures
    // (no agent files, no taxonomy), so it exits 1 either way — an absolute assertion here was
    // wrong about the fixture rather than about the code, and said so on the first run. What
    // matters is that adding the finding neither causes a failure nor masks one.
    const vortexConfig = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const withBadValue = await runDoctor(tmpDir);
    const original = await fs.readFile(vortexConfig, 'utf8');
    try {
      await fs.writeFile(vortexConfig, `${CURRENT_CONFIG_YAML}excluded_agents: []\n`, 'utf8');
      const withCleanValue = await runDoctor(tmpDir);
      assert.equal(withBadValue.exitCode, withCleanValue.exitCode,
        'the excluded_agents finding must not move the exit code in either direction');
      // THE PROPERTY THE NAME CLAIMS. The equality above is `1 === 1` on this fixture — it has
      // unrelated hard failures — and stayed `1 === 1` under `softWarning: false`, so the named
      // property survived the mutation. The observable that discriminates soft from hard is the
      // summary line doctor prints, and the neighbouring suite already asserts on it.
      const bad = withBadValue.stdout + withBadValue.stderr;
      const clean = withCleanValue.stdout + withCleanValue.stderr;
      const issues = (s) => Number((s.match(/(\d+) issue\(s\) found/) || [0, NaN])[1]);
      const warnings = (s) => Number((s.match(/(\d+) governance warning/) || [0, 0])[1]);
      assert.equal(issues(bad), issues(clean),
        'the finding must not add a hard ISSUE — that is what `softWarning: false` would do');
      assert.ok(warnings(bad) > warnings(clean),
        `the finding must appear as a governance WARNING; bad=${warnings(bad)} clean=${warnings(clean)}`);
      // ...and the fixture must actually differ in the finding, or the equality above is trivial.
      assert.ok(/_vortex excluded_agents/.test(withBadValue.stdout + withBadValue.stderr));
      assert.ok(!/_vortex excluded_agents/.test(withCleanValue.stdout + withCleanValue.stderr));
    } finally {
      await fs.writeFile(vortexConfig, original, 'utf8');
    }
  });
});

describe('convoke-doctor: a VALID excluded_agents value stays quiet (T249)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-doc-excl-ok-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.writeFile(
      path.join(vortexDir, 'config.yaml'),
      `${CURRENT_CONFIG_YAML}excluded_agents:\n  - contextualization-expert\n`,
      'utf8'
    );
  });

  after(async () => { await removeTempDir(tmpDir); });

  it('emits no excluded_agents finding for a correct opt-out', async () => {
    // The control. Without it the test above passes for a doctor that complains unconditionally.
    const { stdout, stderr } = await runDoctor(tmpDir);
    const out = `${stdout}${stderr}`;
    assert.ok(!/excluded_agents` (is|names|contains)/.test(out),
      `a correct opt-out must draw no finding; output was:\n${out}`);
  });
});
