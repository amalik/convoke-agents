const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { validateExtension, validateSkillExtension } = require('../../_bmad/bme/_team-factory/lib/validators/end-to-end-validator');
const { CSV_HEADER } = require('../../_bmad/bme/_team-factory/lib/writers/csv-creator');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Build a fully-passing extension context in a temp directory.
 * Simulates adding gamma-guardian to an existing team with alpha-analyzer.
 */
async function buildExtensionContext(tmpDir) {
  const moduleRoot = path.join(tmpDir, '_bmad/bme/_test-team');

  // Existing agent file (already present before extension)
  const existingAgentFile = path.join(moduleRoot, 'agents/alpha-analyzer.md');
  await fs.ensureDir(path.dirname(existingAgentFile));
  await fs.writeFile(existingAgentFile, '---\nname: alpha\n---\nexisting agent', 'utf8');

  // New agent file (created by extension)
  const newAgentFile = path.join(moduleRoot, 'agents/gamma-guardian.md');
  await fs.writeFile(newAgentFile, '---\nname: gamma\n---\nnew agent', 'utf8');

  // New workflow dir (created by extension)
  const newWorkflowDir = path.join(moduleRoot, 'workflows/integrity-check');
  await fs.ensureDir(newWorkflowDir);
  await fs.writeFile(path.join(newWorkflowDir, 'workflow.md'), 'test', 'utf8');
  await fs.writeFile(path.join(newWorkflowDir, 'SKILL.md'), 'test', 'utf8');

  // Config.yaml with both agents (modified)
  const configPath = path.join(moduleRoot, 'config.yaml');
  const configData = {
    submodule_name: '_test-team',
    module: 'bme',
    agents: ['alpha-analyzer', 'gamma-guardian'],
    workflows: ['data-analysis', 'integrity-check'],
  };
  await fs.writeFile(configPath, yaml.dump(configData), 'utf8');

  // Module-help.csv with both agents (modified)
  const csvPath = path.join(moduleRoot, 'module-help.csv');
  const csvRows = [
    CSV_HEADER,
    'bme/_test-team,anytime,Data Analysis,DA,10,workflow.md,bmad-test-team-data-analysis,false,alpha-analyzer,Create Mode,Analyzes data,{project-root}/_bmad-output/test-team-artifacts,data-analysis,',
    'bme/_test-team,anytime,Integrity Check,IC,20,workflow.md,bmad-test-team-integrity-check,false,gamma-guardian,Create Mode,Guards integrity,{project-root}/_bmad-output/test-team-artifacts,integrity-check,',
  ];
  await fs.writeFile(csvPath, csvRows.join('\n') + '\n', 'utf8');

  return {
    module_root: moduleRoot,
    config_yaml_path: configPath,
    module_help_csv_path: csvPath,
    new_agent_files: [newAgentFile],
    new_workflow_dirs: [newWorkflowDir],
    new_contract_files: [],
    new_agent_id: 'gamma-guardian',
    existing_agent_ids: ['alpha-analyzer'],
    registry_append_result: {
      success: true,
      written: ['gamma-guardian'],
      skipped: [],
      errors: [],
      rollbackApplied: false,
    },
    config_append_result: {
      success: true,
      errors: [],
    },
    csv_append_result: {
      success: true,
      rowCount: 2,
      errors: [],
    },
  };
}

// === Happy path ===

describe('validateExtension — happy path', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-extval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('all checks pass when extension is valid', async () => {
    const ctx = await buildExtensionContext(tmpDir);

    const result = await validateExtension(ctx, PROJECT_ROOT);

    // All extension-specific checks should pass
    const extChecks = result.checks.filter(c => c.stepName === 'extension' || c.stepName === 'extension-regression');
    assert.ok(extChecks.length > 0, 'should have extension checks');
    for (const check of extChecks) {
      assert.equal(check.passed, true, `${check.name} should pass but got: ${check.actual}`);
    }

    // Check name format compliance (NFR11)
    for (const check of result.checks) {
      assert.match(check.name, /^[A-Z]+-[A-Z-]+$/, `Check name "${check.name}" does not match {PROP}-{SEMANTIC-NAME} format`);
    }

    // Registry regression should pass
    const regCheck = result.checks.find(c => c.name === 'REGISTRY-REGRESSION');
    assert.ok(regCheck, 'should have REGISTRY-REGRESSION check');
    assert.equal(regCheck.passed, true);
  });
});

// === AGENT-REGISTRY-APPEND check ===

describe('validateExtension — registry append check', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-extval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when registry append result is unsuccessful', async () => {
    const ctx = await buildExtensionContext(tmpDir);
    ctx.registry_append_result = {
      success: false,
      written: [],
      skipped: [],
      errors: ['Team block not found'],
      rollbackApplied: true,
    };

    const result = await validateExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'AGENT-REGISTRY-APPEND');
    assert.ok(check, 'should have AGENT-REGISTRY-APPEND check');
    assert.equal(check.passed, false);
    assert.ok(check.actual.includes('Team block not found'));
  });
});

// === CONFIG-APPEND check ===

describe('validateExtension — config append check', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-extval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when config append result is unsuccessful', async () => {
    const ctx = await buildExtensionContext(tmpDir);
    ctx.config_append_result = {
      success: false,
      errors: ['config.yaml does not exist'],
    };

    const result = await validateExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'CONFIG-APPEND');
    assert.ok(check, 'should have CONFIG-APPEND check');
    assert.equal(check.passed, false);
  });
});

// === CSV-APPEND check ===

describe('validateExtension — csv append check', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-extval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when csv append result is unsuccessful', async () => {
    const ctx = await buildExtensionContext(tmpDir);
    ctx.csv_append_result = {
      success: false,
      rowCount: 0,
      errors: ['CSV header mismatch'],
    };

    const result = await validateExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'CSV-APPEND');
    assert.ok(check, 'should have CSV-APPEND check');
    assert.equal(check.passed, false);
  });
});

// === EXISTING-AGENTS-UNCHANGED checks ===

describe('validateExtension — existing agents unchanged', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-extval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when existing agent missing from config', async () => {
    const ctx = await buildExtensionContext(tmpDir);

    // Rewrite config without existing agent
    const config = yaml.load(await fs.readFile(ctx.config_yaml_path, 'utf8'));
    config.agents = ['gamma-guardian']; // removed alpha-analyzer
    await fs.writeFile(ctx.config_yaml_path, yaml.dump(config), 'utf8');

    const result = await validateExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'EXISTING-AGENTS-CONFIG');
    assert.ok(check, 'should have EXISTING-AGENTS-CONFIG check');
    assert.equal(check.passed, false);
    assert.ok(check.actual.includes('alpha-analyzer'));
  });

  it('fails when existing agent missing from CSV', async () => {
    const ctx2 = await buildExtensionContext(tmpDir);

    // Rewrite CSV without existing agent's row
    const csvRows = [
      CSV_HEADER,
      'bme/_test-team,anytime,Integrity Check,IC,20,workflow.md,bmad-test-team-integrity-check,false,gamma-guardian,Create Mode,Guards integrity,{project-root}/_bmad-output/test-team-artifacts,integrity-check,',
    ];
    await fs.writeFile(ctx2.module_help_csv_path, csvRows.join('\n') + '\n', 'utf8');

    const result = await validateExtension(ctx2, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'EXISTING-AGENTS-CSV');
    assert.ok(check);
    assert.equal(check.passed, false);
  });
});

// === New agent file check ===

describe('validateExtension — new agent file', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-extval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when new agent file is missing', async () => {
    const ctx = await buildExtensionContext(tmpDir);

    // Remove new agent file
    await fs.remove(ctx.new_agent_files[0]);

    const result = await validateExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'AGENT-FILE-EXISTS' && !c.passed);
    assert.ok(check, 'should have failed AGENT-FILE-EXISTS check');
  });
});

// === New workflow dir check ===

describe('validateExtension — new workflow dir', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-extval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when new workflow dir is missing', async () => {
    const ctx = await buildExtensionContext(tmpDir);

    // Remove new workflow dir
    await fs.remove(ctx.new_workflow_dirs[0]);

    const result = await validateExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'WORKFLOW-DIR-EXISTS' && !c.passed);
    assert.ok(check, 'should have failed WORKFLOW-DIR-EXISTS check');
  });
});

// ══════════════════════════════════════════════════════════════════════
// validateSkillExtension tests
// ══════════════════════════════════════════════════════════════════════

/**
 * Build a fully-passing skill extension context in a temp directory.
 * Simulates adding a new-analysis workflow to an existing agent.
 */
async function buildSkillContext(tmpDir) {
  const moduleRoot = path.join(tmpDir, '_bmad/bme/_test-team');

  // Existing workflow dir (already present)
  const existingWfDir = path.join(moduleRoot, 'workflows/data-analysis');
  await fs.ensureDir(existingWfDir);
  await fs.writeFile(path.join(existingWfDir, 'workflow.md'), 'existing', 'utf8');

  // New workflow files (created by skill extension)
  const newWfDir = path.join(moduleRoot, 'workflows/new-analysis');
  await fs.ensureDir(newWfDir);
  const newWfFile = path.join(newWfDir, 'workflow.md');
  const newTemplateFile = path.join(newWfDir, 'new-analysis.template.md');
  await fs.writeFile(newWfFile, '---\nname: new-analysis\n---\nnew workflow', 'utf8');
  await fs.writeFile(newTemplateFile, '# Template', 'utf8');

  // Config.yaml with both workflows (modified)
  const configPath = path.join(moduleRoot, 'config.yaml');
  const configData = {
    submodule_name: '_test-team',
    module: 'bme',
    agents: ['alpha-analyzer'],
    workflows: ['data-analysis', 'new-analysis'],
  };
  await fs.writeFile(configPath, yaml.dump(configData), 'utf8');

  // Module-help.csv with both workflows (modified)
  const csvPath = path.join(moduleRoot, 'module-help.csv');
  const csvRows = [
    CSV_HEADER,
    'bme/_test-team,anytime,Data Analysis,DA,10,workflow.md,bmad-test-team-data-analysis,false,alpha-analyzer,Create Mode,Analyzes data,{project-root}/_bmad-output/test-team-artifacts,data-analysis,',
    'bme/_test-team,anytime,New Analysis,NA,20,workflow.md,bmad-test-team-new-analysis,false,alpha-analyzer,Create Mode,New analysis,{project-root}/_bmad-output/test-team-artifacts,new-analysis,',
  ];
  await fs.writeFile(csvPath, csvRows.join('\n') + '\n', 'utf8');

  // Agent .md file with activation menu (modified — new item added)
  const agentFilePath = path.join(moduleRoot, 'agents/alpha-analyzer.md');
  await fs.ensureDir(path.join(moduleRoot, 'agents'));
  const agentContent = `---
name: alpha-analyzer
---
# Alpha Analyzer

<activation>
  <menu>
    <item exec="_bmad/bme/_test-team/workflows/data-analysis/SKILL.md">Data Analysis</item>
    <item exec="_bmad/bme/_test-team/workflows/new-analysis/SKILL.md">New Analysis</item>
  </menu>
</activation>
`;
  await fs.writeFile(agentFilePath, agentContent, 'utf8');

  return {
    module_root: moduleRoot,
    config_yaml_path: configPath,
    module_help_csv_path: csvPath,
    agent_file_path: agentFilePath,
    new_workflow_name: 'new-analysis',
    agent_id: 'alpha-analyzer',
    existing_workflow_names: ['data-analysis'],
    new_workflow_files: [newWfFile, newTemplateFile],
    registry_append_result: {
      success: true,
      written: ['new-analysis'],
      skipped: [],
      errors: [],
      rollbackApplied: false,
    },
    config_append_result: {
      success: true,
      errors: [],
    },
    csv_append_result: {
      success: true,
      rowCount: 2,
      errors: [],
    },
  };
}

describe('validateSkillExtension — happy path', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-skillval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('all checks pass when skill extension is valid', async () => {
    const ctx = await buildSkillContext(tmpDir);

    const result = await validateSkillExtension(ctx, PROJECT_ROOT);

    // All skill-extension-specific checks should pass
    const skillChecks = result.checks.filter(c =>
      c.stepName === 'skill-extension' || c.stepName === 'skill-extension-regression'
    );
    assert.ok(skillChecks.length > 0, 'should have skill extension checks');
    for (const check of skillChecks) {
      assert.equal(check.passed, true, `${check.name} should pass but got: ${check.actual}`);
    }
  });
});

describe('validateSkillExtension — workflow registry append', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-skillval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when registry append result is unsuccessful', async () => {
    const ctx = await buildSkillContext(tmpDir);
    ctx.registry_append_result = {
      success: false,
      written: [],
      errors: ['WORKFLOWS block not found'],
      rollbackApplied: true,
    };

    const result = await validateSkillExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'WORKFLOW-REGISTRY-APPEND');
    assert.ok(check);
    assert.equal(check.passed, false);
  });
});

describe('validateSkillExtension — workflow file exists', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-skillval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when new workflow file is missing', async () => {
    const ctx = await buildSkillContext(tmpDir);

    // Remove one new workflow file
    await fs.remove(ctx.new_workflow_files[0]);

    const result = await validateSkillExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'WORKFLOW-FILE-EXISTS' && !c.passed);
    assert.ok(check, 'should have failed WORKFLOW-FILE-EXISTS check');
  });
});

describe('validateSkillExtension — existing workflows unchanged', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-skillval-'));
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when existing workflow missing from config', async () => {
    const ctx = await buildSkillContext(tmpDir);

    // Rewrite config without existing workflow
    const config = yaml.load(await fs.readFile(ctx.config_yaml_path, 'utf8'));
    config.workflows = ['new-analysis']; // removed data-analysis
    await fs.writeFile(ctx.config_yaml_path, yaml.dump(config), 'utf8');

    const result = await validateSkillExtension(ctx, PROJECT_ROOT);

    assert.equal(result.valid, false);
    const check = result.checks.find(c => c.name === 'EXISTING-WORKFLOWS-CONFIG');
    assert.ok(check);
    assert.equal(check.passed, false);
    assert.ok(check.actual.includes('data-analysis'));
  });
});
