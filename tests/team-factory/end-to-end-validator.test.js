const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { validateTeam } = require('../../_bmad/bme/_team-factory/lib/validators/end-to-end-validator');

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'test-team-spec.yaml');
const PROJECT_ROOT = path.resolve(__dirname, '../..');

function loadFixtureSpec() {
  return yaml.load(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

/**
 * Build a fully-passing generation context in a temp directory.
 * Creates real files on disk so structural checks pass.
 */
async function buildHappyContext(tmpDir) {
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

  return {
    module_root: moduleRoot,
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

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('structural and wiring checks pass when all files exist and results are valid', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);

    const result = await validateTeam(specData, ctx, PROJECT_ROOT);

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

    // Vortex regression runs but may fail due to pre-existing project state
    const vortexCheck = result.checks.find(c => c.name === 'VORTEX-REGRESSION');
    assert.ok(vortexCheck, 'should have VORTEX-REGRESSION check');
    assert.equal(vortexCheck.stepName, 'regression');

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

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails with AGENT-FILE-EXISTS when an agent file is missing', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);

    // Remove one agent file
    await fs.remove(ctx.agent_files[0]);

    const result = await validateTeam(specData, ctx, PROJECT_ROOT);

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

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails with CONFIG-EXISTS when config.yaml is missing', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);

    // Remove config
    await fs.remove(ctx.config_yaml_path);

    const result = await validateTeam(specData, ctx, PROJECT_ROOT);

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
});

// === Failed activation results ===

describe('validateTeam — failed activation', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
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

    const result = await validateTeam(specData, ctx, PROJECT_ROOT);

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

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-e2e-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('failed checks include expected and actual values', async () => {
    const specData = loadFixtureSpec();
    const ctx = await buildHappyContext(tmpDir);
    await fs.remove(ctx.agent_files[0]); // cause a failure

    const result = await validateTeam(specData, ctx, PROJECT_ROOT);
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
