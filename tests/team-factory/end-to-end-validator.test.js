const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const {
  validateTeam,
  checkPersonaCoverage,
} = require('../../_bmad/bme/_team-factory/lib/validators/end-to-end-validator');

const { derivePrefix, writeRegistryBlock } = require('../../_bmad/bme/_team-factory/lib/writers/registry-writer');

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'test-team-spec.yaml');
const PROJECT_ROOT = path.resolve(__dirname, '../..');

function loadFixtureSpec() {
  return yaml.load(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

/**
 * A stand-in for `scripts/update/lib/agent-registry.js`, carrying the `<PREFIX>_AGENTS`
 * export `checkPersonaCoverage` reads.
 *
 * The ids and the export name are derived from the spec it is given. Only this registry
 * is derived: the rest of `buildHappyContext` (agent files, config, CSV rows) is still
 * hand-built for two agents.
 *
 * `personaMode: 'hollow'` is hand-written in the T131 shape — `role` present, evidence
 * fields empty. The writer-produced version of that shape is exercised separately, by
 * "a hollow team written by the real writer fails the gate".
 */
function buildFixtureRegistry(specData, personaMode = 'full') {
  const persona = personaMode === 'hollow'
    ? (role) => `{ role: ${JSON.stringify(role)}, identity: '', communication_style: '', expertise: '' }`
    : (role) => `{ role: ${JSON.stringify(role)}, identity: 'Reads data', communication_style: 'Terse', expertise: 'Analysis' }`;
  const exportName = `${derivePrefix(specData.team_name_kebab)}_AGENTS`;
  const entries = (specData.agents || []).map(a =>
    `{ id: ${JSON.stringify(a.id)}, name: ${JSON.stringify(a.id)}, icon: 'x', title: ${JSON.stringify(a.id)}, ` +
    `stream: ${JSON.stringify(specData.team_name_kebab)}, persona: ${persona(a.role || 'Stated in the spec')} }`
  );
  return [
    "'use strict';",
    `const ${exportName} = [${entries.join(', ')}];`,
    `module.exports = { ${exportName} };`,
    '',
  ].join('\n');
}

/**
 * A stub project root holding the one file `validateTeam`'s regression check reads:
 * `scripts/update/lib/agent-registry.js`, which `REGISTRY-REGRESSION` must be able to require.
 * `registryBody` lets a test hand it a registry that does not load.
 *
 * tfr-2-1: this also used to write a stub `validator.js` for the Vortex regression check,
 * deleted with that check (T171). Assertions stay off live repo state (`test-fixture-isolation`).
 *
 * @param {string} dir
 * @param {string} [registryBody]
 */
async function buildStubProjectRoot(dir, registryBody = "'use strict';\nmodule.exports = {};\n") {
  const libDir = path.join(dir, 'scripts/update/lib');
  await fs.ensureDir(libDir);
  await fs.writeFile(path.join(libDir, 'agent-registry.js'), registryBody, 'utf8');
  return dir;
}

/**
 * Build a fully-passing generation context in a temp directory.
 * Creates real files on disk so structural checks pass.
 */
async function buildHappyContext(tmpDir, personaMode = 'full') {
  const moduleRoot = path.join(tmpDir, '_bmad/bme/_test-team');

  // Create agent files
  const agentFiles = [
    path.join(moduleRoot, 'agents/alpha-analyzer.md'),
    path.join(moduleRoot, 'agents/beta-builder.md'),
  ];
  for (const f of agentFiles) {
    await fs.ensureDir(path.dirname(f));
    await fs.writeFile(f, '---\nname: test\ndescription: test\n---\ntest content', 'utf8');
  }

  // Create workflow dirs
  const workflowDirs = [
    path.join(moduleRoot, 'workflows/data-analysis'),
    path.join(moduleRoot, 'workflows/component-building'),
  ];
  for (const d of workflowDirs) {
    await fs.ensureDir(d);
    await fs.writeFile(path.join(d, 'workflow.md'), 'test', 'utf8');
    await fs.writeFile(path.join(d, 'SKILL.md'), 'test', 'utf8');
  }

  // Create contract file
  const contractFiles = [path.join(moduleRoot, 'contracts/tc1-analysis-report.md')];
  await fs.ensureDir(path.dirname(contractFiles[0]));
  await fs.writeFile(contractFiles[0], 'test contract', 'utf8');

  // Create config.yaml with required fields
  const configPath = path.join(moduleRoot, 'config.yaml');
  const configData = {
    submodule_name: 'test-team',
    module: '_test-team',
    agents: ['alpha-analyzer', 'beta-builder'],
    workflows: ['data-analysis', 'component-building'],
  };
  await fs.writeFile(configPath, yaml.dump(configData), 'utf8');

  // Create module-help.csv with correct header and row count
  const csvPath = path.join(moduleRoot, 'module-help.csv');
  const csvHeader = 'module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs,';
  const csvRows = [
    csvHeader,
    'test-team,1,data-analysis,DA,1,workflow.md,run,yes,alpha-analyzer,,Analyze data,,',
    'test-team,2,component-building,CB,2,workflow.md,run,yes,beta-builder,,Build components,,',
  ];
  await fs.writeFile(csvPath, csvRows.join('\n'), 'utf8');

  // tfr-1-1 (T164a): PERSONA-COVERAGE reads the registry the run actually wrote to.
  // A fixture registry keeps the assertion off live repo state (`test-fixture-isolation`)
  // and lets the hollow case be built deliberately rather than waited for.
  const registryPath = path.join(tmpDir, 'fixture-agent-registry.js');
  await fs.writeFile(registryPath, buildFixtureRegistry(loadFixtureSpec(), personaMode), 'utf8');

  return {
    module_root: moduleRoot,
    registry_path: registryPath,
    generated_files: agentFiles.concat(
      workflowDirs.map(d => path.join(d, 'workflow.md')),
      workflowDirs.map(d => path.join(d, 'SKILL.md')),
      contractFiles
    ),
    agent_files: agentFiles,
    workflow_dirs: workflowDirs,
    contract_files: contractFiles,
    config_yaml_path: configPath,
    module_help_csv_path: csvPath,
    activation_validation_results: { valid: true, results: [] },
    registry_wiring_result: {
      success: true,
      written: ['TEST_TEAM_AGENTS', 'TEST_TEAM_WORKFLOWS', 'TEST_TEAM_AGENT_FILES', 'TEST_TEAM_AGENT_IDS', 'TEST_TEAM_WORKFLOW_NAMES'],
      skipped: [],
      errors: [],
      rollbackApplied: false,
    },
  };
}

// === Happy path ===

describe('validateTeam — happy path', () => {
  let tmpDir;
  let stubRoot;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
    stubRoot = await buildStubProjectRoot(path.join(tmpDir, 'root'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('structural and wiring checks pass when all files exist and results are valid', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);

    const result = await validateTeam(specData, ctx, stubRoot);

    assert.ok(result.checks.length > 0, 'should have checks');

    // Structural and wiring checks should all pass
    const structuralAndWiring = result.checks.filter(c => c.stepName === 'structural' || c.stepName === 'wiring');
    for (const check of structuralAndWiring) {
      assert.equal(check.passed, true, `${check.name} should pass but got: ${check.actual}`);
    }

    // Registry regression should pass (registry file loads fine)
    const regCheck = result.checks.find(c => c.name === 'REGISTRY-REGRESSION');
    assert.ok(regCheck, 'should have REGISTRY-REGRESSION check');
    assert.equal(regCheck.passed, true, `REGISTRY-REGRESSION failed: ${regCheck.actual}`);

    // tfr-2-1: every check, not a filtered subset — a correctly generated team is valid.
    // (The Vortex regression check this block used to single out was deleted: T171.)
    const failing = result.checks.filter(c => !c.passed).map(c => `${c.name}: ${c.actual}`);
    assert.equal(result.valid, true, `expected a valid team, failing: ${failing.join(' | ')}`);

    // Verify check names use PROP-SEMANTIC format
    for (const check of result.checks) {
      assert.match(check.name, /^[A-Z]+-[A-Z-]+$/, `Check name "${check.name}" does not match {PROP}-{SEMANTIC-NAME} format`);
      assert.ok(typeof check.stepName === 'string', `Check "${check.name}" missing stepName`);
    }
  });
});

// === Missing agent file ===

describe('validateTeam — missing agent file', () => {
  let tmpDir;
  let stubRoot;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
    stubRoot = await buildStubProjectRoot(path.join(tmpDir, 'root'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails with AGENT-FILE-EXISTS when an agent file is missing', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);

    // Remove one agent file
    await fs.remove(ctx.agent_files[0]);

    const result = await validateTeam(specData, ctx, stubRoot);

    assert.equal(result.valid, false);
    const failedCheck = result.checks.find(c => c.name === 'AGENT-FILE-EXISTS' && !c.passed);
    assert.ok(failedCheck, 'should have failed AGENT-FILE-EXISTS check');
    assert.ok(failedCheck.detail.includes('alpha-analyzer'), 'should reference the missing file');
    assert.equal(failedCheck.expected, 'file exists');
    assert.equal(failedCheck.actual, 'file not found');
  });
});

// === Missing config.yaml ===

describe('validateTeam — missing config', () => {
  let tmpDir;
  let stubRoot;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
    stubRoot = await buildStubProjectRoot(path.join(tmpDir, 'root'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails with CONFIG-EXISTS when config.yaml is missing', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);

    // Remove config
    await fs.remove(ctx.config_yaml_path);

    const result = await validateTeam(specData, ctx, stubRoot);

    assert.equal(result.valid, false);
    const failedCheck = result.checks.find(c => c.name === 'CONFIG-EXISTS' && !c.passed);
    assert.ok(failedCheck, 'should have failed CONFIG-EXISTS check');
    assert.ok(failedCheck.detail.includes('config.yaml'), 'should reference config path');
  });
});

// === Registry regression ===

describe('validateTeam — registry regression', () => {
  it('passes REGISTRY-REGRESSION against real project root', async () => {
    const specData = loadFixtureSpec();
    // Minimal context — only need regression check
    const ctx = {
      agent_files: [],
      workflow_dirs: [],
      contract_files: [],
      config_yaml_path: '/nonexistent/config.yaml', // will fail structural checks
      module_help_csv_path: '/nonexistent/module-help.csv',
      module_root: '/nonexistent',
      activation_validation_results: { valid: true, results: [] },
      registry_wiring_result: { success: true, written: ['A', 'B', 'C', 'D', 'E'], skipped: [], errors: [], rollbackApplied: false },
    };

    const result = await validateTeam(specData, ctx, PROJECT_ROOT);

    // Overall will fail (missing files), but regression should pass
    const regCheck = result.checks.find(c => c.name === 'REGISTRY-REGRESSION');
    assert.ok(regCheck, 'should have REGISTRY-REGRESSION check');
    assert.equal(regCheck.passed, true, `REGISTRY-REGRESSION failed: ${regCheck.actual}`);
    assert.equal(regCheck.stepName, 'regression');
  });

  it('fails REGISTRY-REGRESSION on a registry that does not load, and that alone makes the team invalid', async () => {
    // tfr-2-1 R1: the fixture is an otherwise VALID team, so REGISTRY-REGRESSION is the only check that
    // can fail — a verdict that ignored it would read valid. Two kinds of unloadable registry: a syntax
    // error, and one that parses but throws while loading (the registry's own disjoint-id guard throws at
    // load time, which a syntax-only check like `node --check` would miss).
    for (const [label, registryBody] of [
      ['syntax error', "'use strict';\nconst BROKEN = [;\nmodule.exports = {};\n"],
      ['throws while loading', "'use strict';\nthrow new Error('agent id declared in two registries');\n"],
    ]) {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-broken-registry-'));
      try {
        const ctx = await buildHappyContext(tmpDir);
        const root = await buildStubProjectRoot(path.join(tmpDir, 'root'), registryBody);
        const result = await validateTeam(loadFixtureSpec(), ctx, root);

        const failing = result.checks.filter(c => !c.passed).map(c => c.name);
        assert.deepEqual(failing, ['REGISTRY-REGRESSION'], `${label}: only the registry check should fail, got ${failing.join(', ')}`);
        assert.match(result.checks.find(c => c.name === 'REGISTRY-REGRESSION').actual, /require\(\) verification failed/);
        assert.equal(result.valid, false, `${label}: an unloadable registry must make the team invalid`);
      } finally {
        await fs.remove(tmpDir);
      }
    }
  });
});

// === Failed activation results ===

describe('validateTeam — failed activation', () => {
  let tmpDir;
  let stubRoot;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
    stubRoot = await buildStubProjectRoot(path.join(tmpDir, 'root'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails ACTIVATION-VALID when activation results are invalid', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);

    // Override activation results to fail
    ctx.activation_validation_results = {
      valid: false,
      results: [{ agentFile: 'test.md', checks: [], errors: ['config path wrong'] }],
    };

    const result = await validateTeam(specData, ctx, stubRoot);

    assert.equal(result.valid, false);
    const failedCheck = result.checks.find(c => c.name === 'ACTIVATION-VALID' && !c.passed);
    assert.ok(failedCheck, 'should have failed ACTIVATION-VALID check');
    assert.equal(failedCheck.expected, 'valid');
    assert.equal(failedCheck.actual, 'invalid');
    assert.equal(failedCheck.stepName, 'wiring');
  });
});

// === NFR11 format compliance ===

describe('validateTeam — NFR11 error format', () => {
  let tmpDir;
  let stubRoot;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
    stubRoot = await buildStubProjectRoot(path.join(tmpDir, 'root'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('failed checks include expected and actual values', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);
    await fs.remove(ctx.agent_files[0]); // cause a failure

    const result = await validateTeam(specData, ctx, stubRoot);
    const failedChecks = result.checks.filter(c => !c.passed);

    assert.ok(failedChecks.length > 0, 'should have failed checks');
    for (const check of failedChecks) {
      assert.ok(typeof check.name === 'string' && check.name.length > 0, 'check must have name');
      assert.ok(typeof check.expected === 'string' || check.expected === undefined, 'expected must be string or undefined');
      assert.ok(typeof check.actual === 'string' || check.actual === undefined, 'actual must be string or undefined');
      // At least one of expected/actual should be present for failed checks
      assert.ok(check.expected || check.actual, `Failed check "${check.name}" missing both expected and actual`);
    }
  });
});

// === tfr-1-1 Task 4 (T164a) — PERSONA-COVERAGE ===

describe('PERSONA-COVERAGE — a hollow team cannot report success', () => {
  let tmpDir;
  let stubRoot;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-persona-'));
    stubRoot = await buildStubProjectRoot(path.join(tmpDir, 'root'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails validateTeam on a hollow registry — role present, evidence fields empty', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir, 'hollow');

    const result = await validateTeam(specData, ctx, stubRoot);

    const check = result.checks.find(c => c.name === 'PERSONA-COVERAGE');
    assert.ok(check, 'should have PERSONA-COVERAGE check');
    assert.equal(check.passed, false, 'hollow personas must fail the terminal gate');
    // Name the agents, not a count: the message is what tells a contributor what to fix.
    for (const agent of specData.agents) assert.match(check.actual, new RegExp(agent.id));
    assert.equal(result.valid, false, 'a hollow team must not be reported valid');
  });

  // The generation path, unmocked: the real fixture spec → writeRegistryBlock → the
  // registry on disk → checkPersonaCoverage. This is the instrument that guards
  // PERSONA_EVIDENCE_FIELDS: if buildAgentEntry ever back-fills an evidence field from
  // the spec (capabilities, title, role…), the first test goes green-for-the-wrong-reason
  // and fails.
  const MINIMAL_REGISTRY = "'use strict';\n\nmodule.exports = {\n};\n";

  it('a hollow team written by the real writer fails the gate', async () => {
    const specData = loadFixtureSpec();
    const registryPath = path.join(tmpDir, 'writer-hollow-registry.js');
    await fs.writeFile(registryPath, MINIMAL_REGISTRY, 'utf8');

    const written = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });
    assert.equal(written.success, true, JSON.stringify(written.errors));

    const check = checkPersonaCoverage(specData, { registry_path: registryPath }, stubRoot);
    assert.equal(check.passed, false, `a team written with no agentFiles must be hollow, got: ${check.actual}`);
    for (const agent of specData.agents) assert.match(check.actual, new RegExp(agent.id));
  });

  it('a team written by the real writer from real agent files passes the gate', async () => {
    const specData = loadFixtureSpec();
    const registryPath = path.join(tmpDir, 'writer-full-registry.js');
    await fs.writeFile(registryPath, MINIMAL_REGISTRY, 'utf8');
    const agentFiles = [];
    for (const agent of specData.agents) {
      const f = path.join(tmpDir, 'writer-agents', `${agent.id}.md`);
      await fs.ensureDir(path.dirname(f));
      await fs.writeFile(f, `<persona>\n<identity>${agent.id} identity</identity>\n</persona>\n`, 'utf8');
      agentFiles.push(f);
    }

    const written = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true, agentFiles });
    assert.equal(written.success, true, JSON.stringify(written.errors));

    const check = checkPersonaCoverage(specData, { registry_path: registryPath }, stubRoot);
    assert.equal(check.passed, true, `extracted identities must count, got: ${check.actual}`);
  });

  it('fails when the module block is absent from the registry', async () => {
    const specData = loadFixtureSpec();
    const emptyRegistry = path.join(tmpDir, 'no-block-registry.js');
    await fs.writeFile(emptyRegistry, "'use strict';\nmodule.exports = {};\n", 'utf8');

    const check = checkPersonaCoverage(specData, { registry_path: emptyRegistry }, stubRoot);

    assert.equal(check.passed, false);
    assert.match(check.actual, new RegExp(`${derivePrefix(specData.team_name_kebab)}_AGENTS`));
  });

  it('fails rather than passing vacuously when the spec declares no agents', async () => {
    // Its own registry file, and the message is pinned. Round 1: this pointed at a file
    // created as a side effect of the FIRST test in the describe, so run under a name
    // filter it passed on the `cannot read registry` branch and never reached the guard
    // it claims to test — leaving that guard deletable with the suite still green.
    const registryPath = path.join(tmpDir, 'no-agents-registry.js');
    await fs.writeFile(registryPath, "'use strict';\nmodule.exports = { TEST_TEAM_AGENTS: [] };\n", 'utf8');

    const check = checkPersonaCoverage({ team_name_kebab: 'test-team', agents: [] }, { registry_path: registryPath }, stubRoot);

    assert.equal(check.passed, false, 'zero declared agents is unverifiable, not a pass');
    assert.match(check.actual, /declares no agents/, 'must fail on the vacuity guard, not on a missing file');
  });

  it('fails a declared agent that has no usable id rather than letting an id-less entry answer for it', async () => {
    const registryPath = path.join(tmpDir, 'idless-registry.js');
    await fs.writeFile(registryPath,
      "'use strict';\nmodule.exports = { TEST_TEAM_AGENTS: [{ persona: { identity: 'populated' } }] };\n", 'utf8');

    const check = checkPersonaCoverage({ team_name_kebab: 'test-team', agents: [{ name: 'nameless' }] }, { registry_path: registryPath }, stubRoot);

    assert.equal(check.passed, false);
    assert.match(check.actual, /no usable id/);
  });

  it('does not let a duplicate id hide a hollow entry, whichever order they appear in', async () => {
    const hollow = "  { id: 'alpha-analyzer', persona: { role: 'r', identity: '', communication_style: '', expertise: '' } },";
    const populated = "  { id: 'alpha-analyzer', persona: { role: 'r', identity: 'populated', communication_style: '', expertise: '' } },";
    // Hollow-first kills a last-wins lookup; hollow-last kills a first-wins one.
    for (const [label, order] of [['hollow first', [hollow, populated]], ['hollow last', [populated, hollow]]]) {
      const registryPath = path.join(tmpDir, `dup-registry-${label.replace(' ', '-')}.js`);
      await fs.writeFile(registryPath,
        ["'use strict';", 'module.exports = { TEST_TEAM_AGENTS: [', ...order, '] };', ''].join('\n'), 'utf8');

      const check = checkPersonaCoverage({ team_name_kebab: 'test-team', agents: [{ id: 'alpha-analyzer' }] }, { registry_path: registryPath }, stubRoot);

      assert.equal(check.passed, false, `${label}: a populated duplicate must not answer for the hollow one`);
      assert.match(check.actual, /alpha-analyzer/);
    }
  });

  it('rejects a relative registry_path instead of guessing which base the writer used', async () => {
    // The writer resolves a relative path against cwd. Resolving it against projectRoot
    // instead produced a false green when the two differed: the gate read a populated
    // registry while the writer had written a hollow one somewhere else.
    const specData = loadFixtureSpec();
    const rel = 'relative-registry.js';
    await fs.writeFile(path.join(stubRoot, rel), buildFixtureRegistry(specData, 'full'), 'utf8');

    const check = checkPersonaCoverage(specData, { registry_path: rel }, stubRoot);

    assert.equal(check.passed, false, 'a populated file at projectRoot/<rel> must not be trusted');
    assert.match(check.actual, /must be an absolute path/);
  });

  it('returns a failed check, not a crash, for a non-string registry_path', async () => {
    const specData = loadFixtureSpec();
    for (const bad of [42, {}, ['a.js'], '']) {
      const check = checkPersonaCoverage(specData, { registry_path: bad }, stubRoot);
      assert.equal(check.passed, false, `registry_path ${JSON.stringify(bad)}`);
      assert.match(check.actual, /must be an absolute path/);
    }
  });

  it('reads the registry the run wrote to, not one re-derived from projectRoot', async () => {
    const specData = loadFixtureSpec();
    const written = path.join(tmpDir, 'written-registry.js');
    await fs.writeFile(written, buildFixtureRegistry(specData, 'hollow'), 'utf8');

    // stubRoot's own registry has no module block at all. The check must report on
    // `written`, so it must name the hollow agents.
    const check = checkPersonaCoverage(specData, { registry_path: written }, stubRoot);

    assert.equal(check.passed, false);
    assert.match(check.actual, /no identity, communication_style, expertise for:/);
    assert.equal(check.detail, written);
  });
});
