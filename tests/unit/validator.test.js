const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const {
  validateInstallation,
  validateConfigStructure,
  validateAgentFiles,
  validateWorkflows,
  validateManifest,
  validateUserDataIntegrity,
  validateDeprecatedWorkflows,
  validateWorkflowStepStructure,
  validateEnhanceModule,
  validateArtifactsModule,
  validateSkillMd,
  validateStepFiles,
  validateSkillCohesion,
  validateSkill
} = require('../../scripts/update/lib/validator');
const { fullConfig, createValidInstallation } = require('../helpers');

// === validateConfigStructure ===

describe('validateConfigStructure', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when config.yaml is missing', async () => {
    const result = await validateConfigStructure(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('not found'));
  });

  it('fails for invalid YAML', async () => {
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(vortexDir);
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), '{{{invalid', 'utf8');

    const result = await validateConfigStructure(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error);
  });

  it('fails for config missing required fields', async () => {
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    // Write config without version
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({ agents: [] }), 'utf8');

    const result = await validateConfigStructure(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error);
  });

  it('passes for valid config', async () => {
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump(fullConfig()), 'utf8');

    const result = await validateConfigStructure(tmpDir);
    assert.equal(result.passed, true);
    assert.equal(result.error, null);
  });
});

// === validateAgentFiles ===

describe('validateAgentFiles', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when agents/ directory is missing', async () => {
    const result = await validateAgentFiles(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('not found'));
  });

  it('fails when agent files are missing', async () => {
    const agentsDir = path.join(tmpDir, '_bmad/bme/_vortex/agents');
    await fs.ensureDir(agentsDir);
    // Only create one agent
    await fs.writeFile(path.join(agentsDir, 'contextualization-expert.md'), '# Emma', 'utf8');

    const result = await validateAgentFiles(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('lean-experiments-specialist'));
  });

  it('passes when all required agents exist', async () => {
    const agentsDir = path.join(tmpDir, '_bmad/bme/_vortex/agents');
    const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
    for (const id of AGENT_IDS) {
      await fs.writeFile(path.join(agentsDir, `${id}.md`), `# ${id}`, 'utf8');
    }

    const result = await validateAgentFiles(tmpDir);
    assert.equal(result.passed, true);
  });

  it('passes when an excluded agent file is absent (U8)', async () => {
    // Fresh temp dir so state from previous tests does not bleed.
    const localTmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-excl-'));
    try {
      const vortexDir = path.join(localTmp, '_bmad/bme/_vortex');
      const agentsDir = path.join(vortexDir, 'agents');
      await fs.ensureDir(agentsDir);

      const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
      const excludedId = 'production-intelligence-specialist';
      // Write all agent files EXCEPT the excluded one.
      for (const id of AGENT_IDS) {
        if (id === excludedId) continue;
        await fs.writeFile(path.join(agentsDir, `${id}.md`), `# ${id}`, 'utf8');
      }
      // Write the config with the exclusion.
      fs.writeFileSync(
        path.join(vortexDir, 'config.yaml'),
        yaml.dump({ agents: AGENT_IDS.filter(id => id !== excludedId), excluded_agents: [excludedId] }),
        'utf8'
      );

      const result = await validateAgentFiles(localTmp);
      assert.equal(result.passed, true, `validator must pass when excluded agent file is absent — got error: ${result.error}`);
    } finally {
      await fs.remove(localTmp);
    }
  });
});

// === validateWorkflows ===

describe('validateWorkflows', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when workflows/ directory is missing', async () => {
    const result = await validateWorkflows(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('not found'));
  });

  it('fails when workflow files are missing', async () => {
    const workflowsDir = path.join(tmpDir, '_bmad/bme/_vortex/workflows');
    await fs.ensureDir(workflowsDir);
    // Create only one workflow
    const wfDir = path.join(workflowsDir, 'lean-persona');
    await fs.ensureDir(wfDir);
    await fs.writeFile(path.join(wfDir, 'workflow.md'), '# lean-persona', 'utf8');

    const result = await validateWorkflows(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('Missing'));
  });

  it('passes when all required workflows exist', async () => {
    const workflowsDir = path.join(tmpDir, '_bmad/bme/_vortex/workflows');
    const { WORKFLOW_NAMES } = require('../../scripts/update/lib/agent-registry');
    for (const wf of WORKFLOW_NAMES) {
      const wfDir = path.join(workflowsDir, wf);
      await fs.ensureDir(wfDir);
      await fs.writeFile(path.join(wfDir, 'workflow.md'), `# ${wf}`, 'utf8');
    }

    const result = await validateWorkflows(tmpDir);
    assert.equal(result.passed, true);
  });
});

// === validateManifest ===

describe('validateManifest', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('passes when manifest is missing (optional)', async () => {
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true);
    assert.ok(result.warning);
  });

  it('fails when manifest is missing required agents', async () => {
    const manifestDir = path.join(tmpDir, '_bmad/_config');
    await fs.ensureDir(manifestDir);
    await fs.writeFile(
      path.join(manifestDir, 'agent-manifest.csv'),
      '"agent_id"\n"some-other-agent"\n',
      'utf8'
    );

    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('missing'));
  });

  it('passes when manifest contains all agents', async () => {
    const manifestPath = path.join(tmpDir, '_bmad/_config/agent-manifest.csv');
    const { AGENT_IDS, EXTRA_BME_AGENTS } = require('../../scripts/update/lib/agent-registry');
    const extraIds = EXTRA_BME_AGENTS.map(a => `bmad-agent-bme-${a.id}`);
    const csvRows = ['"agent_id"', ...AGENT_IDS.map(id => `"${id}"`), ...extraIds.map(id => `"${id}"`)].join('\n') + '\n';
    await fs.writeFile(manifestPath, csvRows, 'utf8');

    // Standalone bme agent files must exist on disk for validation to pass
    for (const a of EXTRA_BME_AGENTS) {
      const agentFile = path.join(tmpDir, '_bmad', 'bme', a.submodule, 'agents', `${a.id}.md`);
      await fs.ensureDir(path.dirname(agentFile));
      await fs.writeFile(agentFile, '# stub', 'utf8');
    }

    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true);
  });
});

// === validateUserDataIntegrity ===

describe('validateUserDataIntegrity', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when _bmad-output/ does not exist', async () => {
    const result = await validateUserDataIntegrity(5, tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('not found'));
  });

  it('fails when file count is significantly lower than expected', async () => {
    const outputDir = path.join(tmpDir, '_bmad-output');
    await fs.ensureDir(outputDir);
    // Create only 1 file but expect 10
    await fs.writeFile(path.join(outputDir, 'artifact.md'), 'test', 'utf8');

    const result = await validateUserDataIntegrity(10, tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('mismatch'));
  });

  it('passes when file count matches expected', async () => {
    const outputDir = path.join(tmpDir, '_bmad-output');
    // Create files to match
    for (let i = 0; i < 5; i++) {
      await fs.writeFile(path.join(outputDir, `file-${i}.md`), 'test', 'utf8');
    }

    const result = await validateUserDataIntegrity(5, tmpDir);
    assert.equal(result.passed, true);
    assert.ok(result.info);
  });

  it('allows slight variation (within 2 files)', async () => {
    const result = await validateUserDataIntegrity(8, tmpDir);
    assert.equal(result.passed, true);
  });
});

// === validateDeprecatedWorkflows ===

describe('validateDeprecatedWorkflows', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('passes when no _deprecated/ directory exists', async () => {
    const result = await validateDeprecatedWorkflows(tmpDir);
    assert.equal(result.passed, true);
    assert.ok(result.info);
  });

  it('warns when _deprecated/ exists but is empty', async () => {
    const deprecatedDir = path.join(tmpDir, '_bmad/bme/_vortex/workflows/_deprecated');
    await fs.ensureDir(deprecatedDir);

    const result = await validateDeprecatedWorkflows(tmpDir);
    assert.equal(result.passed, true);
    assert.ok(result.warning);
  });

  it('passes when deprecated workflows are present', async () => {
    const wireframeDir = path.join(tmpDir, '_bmad/bme/_vortex/workflows/_deprecated/wireframe');
    await fs.ensureDir(wireframeDir);

    const result = await validateDeprecatedWorkflows(tmpDir);
    assert.equal(result.passed, true);
    assert.ok(result.info);
  });
});

// === validateWorkflowStepStructure ===

describe('validateWorkflowStepStructure', () => {
  // Helper: create an isolated tmpDir with a single workflow + steps
  async function createStepFixture(workflowName, stepFiles) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-steps-'));
    const workflowsDir = path.join(tmpDir, '_bmad/bme/_vortex/workflows');
    const wfDir = path.join(workflowsDir, workflowName);
    await fs.ensureDir(wfDir);
    await fs.writeFile(path.join(wfDir, 'workflow.md'), `# ${workflowName}`, 'utf8');

    if (stepFiles && stepFiles.length > 0) {
      const stepsDir = path.join(wfDir, 'steps');
      await fs.ensureDir(stepsDir);
      for (const f of stepFiles) {
        await fs.writeFile(path.join(stepsDir, f), `# ${f}`, 'utf8');
      }
    }
    return tmpDir;
  }

  it('passes for workflows without steps/ directory (placeholder)', async () => {
    const tmpDir = await createStepFixture('lean-persona', null);
    const result = await validateWorkflowStepStructure(tmpDir);
    assert.equal(result.passed, true);
    await fs.remove(tmpDir);
  });

  it('passes with 4 step files (minimum)', async () => {
    const tmpDir = await createStepFixture('lean-persona', [
      'step-01-setup.md', 'step-02-context.md', 'step-03-work.md', 'step-04-synthesize.md'
    ]);
    const result = await validateWorkflowStepStructure(tmpDir);
    assert.equal(result.passed, true);
    await fs.remove(tmpDir);
  });

  it('passes with 6 step files (maximum)', async () => {
    const tmpDir = await createStepFixture('lean-persona', [
      'step-01-setup.md', 'step-02-context.md', 'step-03-work.md',
      'step-04-deep.md', 'step-05-extra.md', 'step-06-synthesize.md'
    ]);
    const result = await validateWorkflowStepStructure(tmpDir);
    assert.equal(result.passed, true);
    await fs.remove(tmpDir);
  });

  it('fails with 3 step files (below minimum)', async () => {
    const tmpDir = await createStepFixture('contextualize-scope', [
      'step-01-setup.md', 'step-02-context.md', 'step-03-synthesize.md'
    ]);
    const result = await validateWorkflowStepStructure(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('contextualize-scope'));
    assert.ok(result.error.includes('3'));
    await fs.remove(tmpDir);
  });

  it('fails with 7 step files (above maximum)', async () => {
    const tmpDir = await createStepFixture('contextualize-scope', [
      'step-01-setup.md', 'step-02-context.md', 'step-03-work.md',
      'step-04-work.md', 'step-05-work.md', 'step-06-work.md', 'step-07-synthesize.md'
    ]);
    const result = await validateWorkflowStepStructure(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('contextualize-scope'));
    assert.ok(result.error.includes('7'));
    await fs.remove(tmpDir);
  });

  it('fails when step-01-setup.md is missing (Wave 3 workflow)', async () => {
    // research-convergence belongs to Mila/Synthesize (Wave 3)
    const tmpDir = await createStepFixture('research-convergence', [
      'step-01-intro.md', 'step-02-context.md', 'step-03-work.md', 'step-04-synthesize.md'
    ]);
    const result = await validateWorkflowStepStructure(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('step-01-setup.md'));
    await fs.remove(tmpDir);
  });

  it('fails when step-02-context.md is missing (Wave 3 workflow)', async () => {
    // hypothesis-engineering belongs to Liam/Hypothesize (Wave 3)
    const tmpDir = await createStepFixture('hypothesis-engineering', [
      'step-01-setup.md', 'step-02-gather.md', 'step-03-work.md', 'step-04-synthesize.md'
    ]);
    const result = await validateWorkflowStepStructure(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('step-02-context.md'));
    await fs.remove(tmpDir);
  });

  it('fails when no *-synthesize.md file exists (Wave 3 workflow)', async () => {
    // signal-interpretation belongs to Noah/Sensitize (Wave 3)
    const tmpDir = await createStepFixture('signal-interpretation', [
      'step-01-setup.md', 'step-02-context.md', 'step-03-work.md', 'step-04-wrap.md'
    ]);
    const result = await validateWorkflowStepStructure(tmpDir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('synthesize'));
    await fs.remove(tmpDir);
  });
});

// === validateInstallation (orchestrator) ===

describe('validateInstallation', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-'));
    await createValidInstallation(tmpDir);
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns valid:true for a complete installation', async () => {
    const result = await validateInstallation({}, tmpDir);
    assert.equal(result.valid, true);
    assert.ok(Array.isArray(result.checks));
    assert.ok(result.checks.length >= 5);
    assert.ok(result.checks.every(c => c.passed));
  });

  it('includes user data check when preMigrationData has user_data_count', async () => {
    const outputDir = path.join(tmpDir, '_bmad-output');
    await fs.ensureDir(outputDir);
    await fs.writeFile(path.join(outputDir, 'test.md'), 'data', 'utf8');

    const result = await validateInstallation({ user_data_count: 1 }, tmpDir);
    assert.ok(result.checks.some(c => c.name === 'User data preserved'));
  });

  it('returns valid:false when installation is broken', async () => {
    const brokenDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-broken-'));
    await fs.ensureDir(path.join(brokenDir, '_bmad'));

    const result = await validateInstallation({}, brokenDir);
    assert.equal(result.valid, false);
    assert.ok(result.checks.some(c => !c.passed));

    await fs.remove(brokenDir);
  });
});

// === validateEnhanceModule ===

describe('validateEnhanceModule', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-val-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  /** Helper: create a valid Enhance installation in tmpDir */
  async function createValidEnhance(dir) {
    const enhDir = path.join(dir, '_bmad/bme/_enhance');
    const wfDir = path.join(enhDir, 'workflows/initiatives-backlog');
    await fs.ensureDir(wfDir);

    const config = {
      name: 'enhance',
      version: '1.0.0',
      description: 'Enhance module',
      workflows: [{
        name: 'initiatives-backlog',
        entry: 'workflows/initiatives-backlog/workflow.md',
        target_agent: 'bmm/agents/pm.md',
        menu_patch_name: 'initiatives-backlog'
      }]
    };
    await fs.writeFile(path.join(enhDir, 'config.yaml'), yaml.dump(config), 'utf8');
    await fs.writeFile(path.join(wfDir, 'workflow.md'), '# Workflow', 'utf8');

    // Create target agent with menu patch
    const pmDir = path.join(dir, '_bmad/bmm/agents');
    await fs.ensureDir(pmDir);
    await fs.writeFile(path.join(pmDir, 'pm.md'), '<menu>\n    <item cmd="initiatives-backlog">[IB] Test</item>\n</menu>', 'utf8');

    // Create skill wrapper (Check 6)
    const skillDir = path.join(dir, '.claude/skills/bmad-enhance-initiatives-backlog');
    await fs.ensureDir(skillDir);
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), '---\nname: bmad-enhance-initiatives-backlog\n---\nContent', 'utf8');
  }

  it('passes with info when _enhance/ directory does not exist', async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-empty-'));
    const result = await validateEnhanceModule(emptyDir);
    assert.equal(result.passed, true);
    assert.ok(result.info && result.info.includes('not installed'));
    await fs.remove(emptyDir);
  });

  it('passes when all 6 checks pass', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-valid-'));
    await createValidEnhance(dir);
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, true);
    assert.equal(result.error, null);
    await fs.remove(dir);
  });

  it('fails when config.yaml is missing but _enhance/ dir exists', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-nocfg-'));
    await fs.ensureDir(path.join(dir, '_bmad/bme/_enhance'));
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('config.yaml not found'));
    await fs.remove(dir);
  });

  it('fails when config.yaml is unparseable', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-badyaml-'));
    const enhDir = path.join(dir, '_bmad/bme/_enhance');
    await fs.ensureDir(enhDir);
    await fs.writeFile(path.join(enhDir, 'config.yaml'), '{{{invalid', 'utf8');
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('parse error'));
    await fs.remove(dir);
  });

  it('fails when config.yaml is missing required fields', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-missingf-'));
    const enhDir = path.join(dir, '_bmad/bme/_enhance');
    await fs.ensureDir(enhDir);
    await fs.writeFile(path.join(enhDir, 'config.yaml'), yaml.dump({ name: 'test' }), 'utf8');
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('config missing fields'));
    assert.ok(result.error.includes('version'));
    await fs.remove(dir);
  });

  it('fails when workflow entry point file does not exist', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-noentry-'));
    const enhDir = path.join(dir, '_bmad/bme/_enhance');
    await fs.ensureDir(path.join(enhDir, 'workflows/initiatives-backlog'));
    const config = {
      name: 'enhance', version: '1.0.0', description: 'test',
      workflows: [{ name: 'initiatives-backlog', entry: 'workflows/initiatives-backlog/workflow.md', target_agent: 'bmm/agents/pm.md', menu_patch_name: 'initiatives-backlog' }]
    };
    await fs.writeFile(path.join(enhDir, 'config.yaml'), yaml.dump(config), 'utf8');
    // No workflow.md created
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('entry point not found'));
    await fs.remove(dir);
  });

  it('fails when menu patch not found in target agent file', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-nopatch-'));
    await createValidEnhance(dir);
    // Overwrite pm.md without the patch
    await fs.writeFile(path.join(dir, '_bmad/bmm/agents/pm.md'), '<menu>\n    <item cmd="test">[T] Test</item>\n</menu>', 'utf8');
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('menu patch'));
    assert.ok(result.error.includes('not found'));
    await fs.remove(dir);
  });

  it('fails when config references a workflow that has no directory', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-nodir-'));
    const enhDir = path.join(dir, '_bmad/bme/_enhance');
    await fs.ensureDir(enhDir);
    const config = {
      name: 'enhance', version: '1.0.0', description: 'test',
      workflows: [{ name: 'nonexistent-workflow', entry: 'workflows/nonexistent-workflow/workflow.md', target_agent: 'bmm/agents/pm.md', menu_patch_name: 'nonexistent' }]
    };
    await fs.writeFile(path.join(enhDir, 'config.yaml'), yaml.dump(config), 'utf8');
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('workflow directory not found'));
    await fs.remove(dir);
  });

  it('passes check 6 when skill wrapper exists', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-skill-ok-'));
    await createValidEnhance(dir);
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, true);
    assert.equal(result.error, null);
    await fs.remove(dir);
  });

  it('fails check 6 when skill wrapper is missing', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-skill-miss-'));
    await createValidEnhance(dir);
    // Remove skill wrapper
    await fs.remove(path.join(dir, '.claude/skills/bmad-enhance-initiatives-backlog'));
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('skill wrapper not found'));
    assert.ok(result.error.includes('bmad-enhance-initiatives-backlog'));
    await fs.remove(dir);
  });

  it('reports multiple failures in single error string', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-multi-'));
    const enhDir = path.join(dir, '_bmad/bme/_enhance');
    await fs.ensureDir(enhDir);
    // Config with workflow that has no entry file, no directory, and no agent file
    const config = {
      name: 'enhance', version: '1.0.0', description: 'test',
      workflows: [{ name: 'missing-wf', entry: 'workflows/missing-wf/workflow.md', target_agent: 'bmm/agents/pm.md', menu_patch_name: 'missing-wf' }]
    };
    await fs.writeFile(path.join(enhDir, 'config.yaml'), yaml.dump(config), 'utf8');
    const result = await validateEnhanceModule(dir);
    assert.equal(result.passed, false);
    // Should contain multiple failures separated by "; "
    const failureCount = result.error.split('; ').length;
    assert.ok(failureCount >= 2, `Expected multiple failures, got: ${result.error}`);
    await fs.remove(dir);
  });
});

// === validateArtifactsModule ===

describe('validateArtifactsModule', () => {
  /** Helper: create a valid Artifacts installation in tmpDir */
  async function createValidArtifacts(dir) {
    const artDir = path.join(dir, '_bmad/bme/_artifacts');
    const wf1Dir = path.join(artDir, 'workflows/bmad-migrate-artifacts');
    const wf2Dir = path.join(artDir, 'workflows/bmad-portfolio-status');
    await fs.ensureDir(wf1Dir);
    await fs.ensureDir(wf2Dir);

    const config = {
      name: 'artifacts',
      version: '1.0.0',
      description: 'Artifacts module',
      workflows: [
        { name: 'bmad-migrate-artifacts', entry: 'workflows/bmad-migrate-artifacts/workflow.md', standalone: true },
        { name: 'bmad-portfolio-status', entry: 'workflows/bmad-portfolio-status/workflow.md', standalone: true }
      ]
    };
    await fs.writeFile(path.join(artDir, 'config.yaml'), yaml.dump(config), 'utf8');
    await fs.writeFile(path.join(wf1Dir, 'workflow.md'), '# migrate', 'utf8');
    await fs.writeFile(path.join(wf2Dir, 'workflow.md'), '# portfolio', 'utf8');

    // Skill wrappers
    const skill1 = path.join(dir, '.claude/skills/bmad-migrate-artifacts');
    const skill2 = path.join(dir, '.claude/skills/bmad-portfolio-status');
    await fs.ensureDir(skill1);
    await fs.ensureDir(skill2);
    await fs.writeFile(path.join(skill1, 'SKILL.md'), '---\nname: bmad-migrate-artifacts\n---\nContent', 'utf8');
    await fs.writeFile(path.join(skill2, 'SKILL.md'), '---\nname: bmad-portfolio-status\n---\nContent', 'utf8');
  }

  it('passes with info "not installed" when _artifacts/ does not exist', async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-empty-'));
    const result = await validateArtifactsModule(emptyDir);
    assert.equal(result.passed, true);
    assert.ok(result.info && result.info.includes('not installed'));
    await fs.remove(emptyDir);
  });

  it('fails when config.yaml is missing but _artifacts/ exists', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-nocfg-'));
    await fs.ensureDir(path.join(dir, '_bmad/bme/_artifacts'));
    const result = await validateArtifactsModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('config.yaml not found'));
    await fs.remove(dir);
  });

  it('fails when config.yaml is unparseable', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-badyaml-'));
    const artDir = path.join(dir, '_bmad/bme/_artifacts');
    await fs.ensureDir(artDir);
    await fs.writeFile(path.join(artDir, 'config.yaml'), '{{{invalid', 'utf8');
    const result = await validateArtifactsModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('parse error'));
    await fs.remove(dir);
  });

  it('fails when workflows array is missing or empty', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-nowfs-'));
    const artDir = path.join(dir, '_bmad/bme/_artifacts');
    await fs.ensureDir(artDir);
    await fs.writeFile(path.join(artDir, 'config.yaml'), yaml.dump({ name: 'artifacts', version: '1.0.0' }), 'utf8');
    const result = await validateArtifactsModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('no workflows array'));
    await fs.remove(dir);
  });

  it('fails when workflow entry point file does not exist', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-noentry-'));
    const artDir = path.join(dir, '_bmad/bme/_artifacts');
    await fs.ensureDir(artDir);
    const config = {
      name: 'artifacts', version: '1.0.0',
      workflows: [{ name: 'bmad-migrate-artifacts', entry: 'workflows/bmad-migrate-artifacts/workflow.md', standalone: true }]
    };
    await fs.writeFile(path.join(artDir, 'config.yaml'), yaml.dump(config), 'utf8');
    // No workflow.md created
    const result = await validateArtifactsModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('workflow entry missing for bmad-migrate-artifacts'));
    await fs.remove(dir);
  });

  it('fails when skill wrapper SKILL.md is missing', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-nowrap-'));
    await createValidArtifacts(dir);
    // Remove one skill wrapper
    await fs.remove(path.join(dir, '.claude/skills/bmad-portfolio-status'));
    const result = await validateArtifactsModule(dir);
    assert.equal(result.passed, false);
    assert.ok(result.error.includes('skill wrapper missing for bmad-portfolio-status'));
    await fs.remove(dir);
  });

  it('passes when all checks pass', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-valid-'));
    await createValidArtifacts(dir);
    const result = await validateArtifactsModule(dir);
    assert.equal(result.passed, true);
    assert.equal(result.error, null);
    await fs.remove(dir);
  });

  it('aggregates multiple failures into a single error string', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-multi-'));
    await createValidArtifacts(dir);
    // Break BOTH workflows: remove portfolio wrapper and migrate entry point
    await fs.remove(path.join(dir, '.claude/skills/bmad-portfolio-status'));
    await fs.remove(path.join(dir, '_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/workflow.md'));

    const result = await validateArtifactsModule(dir);
    assert.equal(result.passed, false);
    // Should contain BOTH failures separated by "; "
    assert.ok(result.error.includes('workflow entry missing for bmad-migrate-artifacts'),
      `expected migrate entry failure, got: ${result.error}`);
    assert.ok(result.error.includes('skill wrapper missing for bmad-portfolio-status'),
      `expected portfolio wrapper failure, got: ${result.error}`);
    const failureCount = result.error.split('; ').length;
    assert.ok(failureCount >= 2, `expected ≥2 aggregated failures, got: ${result.error}`);
    await fs.remove(dir);
  });

  it('skips wrapper/entry checks for non-standalone workflows', async () => {
    // Mirror the refresh-installation contract: non-standalone workflows are NOT
    // installed by section 6d, so the validator must NOT require their wrapper.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-art-nonstd-'));
    const artDir = path.join(dir, '_bmad/bme/_artifacts');
    await fs.ensureDir(artDir);
    const config = {
      name: 'artifacts', version: '1.0.0',
      workflows: [
        // Non-standalone workflow with NO entry point and NO wrapper — must still pass
        { name: 'future-menu-patch-workflow', entry: 'workflows/never-installed/workflow.md' }
      ]
    };
    await fs.writeFile(path.join(artDir, 'config.yaml'), yaml.dump(config), 'utf8');

    const result = await validateArtifactsModule(dir);
    assert.equal(result.passed, true,
      `non-standalone workflow should pass validation; got: ${result.error}`);
    assert.equal(result.error, null);
    await fs.remove(dir);
  });
});

// === validateSkillMd ===

describe('validateSkillMd', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-skill-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await validateSkillMd(path.join(tmpDir, 'nonexistent', 'SKILL.md'));
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('not found'));
  });

  it('fails when SKILL.md has no frontmatter', async () => {
    const skillPath = path.join(tmpDir, 'no-fm', 'SKILL.md');
    await fs.ensureDir(path.dirname(skillPath));
    await fs.writeFile(skillPath, '# Just a heading\nSome content\n', 'utf8');
    const result = await validateSkillMd(skillPath);
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('frontmatter'));
  });

  it('fails when frontmatter has invalid YAML', async () => {
    const skillPath = path.join(tmpDir, 'bad-yaml', 'SKILL.md');
    await fs.ensureDir(path.dirname(skillPath));
    await fs.writeFile(skillPath, '---\n{{{invalid\n---\nContent\n', 'utf8');
    const result = await validateSkillMd(skillPath);
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('parse error'));
  });

  it('fails when name field is missing', async () => {
    const skillPath = path.join(tmpDir, 'no-name', 'SKILL.md');
    await fs.ensureDir(path.dirname(skillPath));
    await fs.writeFile(skillPath, '---\ndescription: test skill\n---\nContent\n', 'utf8');
    const result = await validateSkillMd(skillPath);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('name')));
  });

  it('fails when description field is missing', async () => {
    const skillPath = path.join(tmpDir, 'no-desc', 'SKILL.md');
    await fs.ensureDir(path.dirname(skillPath));
    await fs.writeFile(skillPath, '---\nname: test-skill\n---\nContent\n', 'utf8');
    const result = await validateSkillMd(skillPath);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('description')));
  });

  it('passes with valid frontmatter (agent-activation type)', async () => {
    const skillPath = path.join(tmpDir, 'valid-agent', 'SKILL.md');
    await fs.ensureDir(path.dirname(skillPath));
    await fs.writeFile(skillPath, '---\nname: bmad-agent-bme-test\ndescription: test agent\n---\nActivation instructions\n', 'utf8');
    const result = await validateSkillMd(skillPath);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('passes with valid frontmatter (workflow type)', async () => {
    const skillPath = path.join(tmpDir, 'valid-workflow', 'SKILL.md');
    await fs.ensureDir(path.dirname(skillPath));
    await fs.writeFile(skillPath, '---\nname: bmad-quick-dev\ndescription: Implement a Quick Spec\n---\nFollow workflow.md\n', 'utf8');
    const result = await validateSkillMd(skillPath);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });
});

// === validateStepFiles ===

describe('validateStepFiles', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-steps-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when skill directory does not exist', async () => {
    const result = await validateStepFiles(path.join(tmpDir, 'nonexistent'));
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('not found'));
  });

  it('passes when no step files exist (agent-activation type)', async () => {
    const dir = path.join(tmpDir, 'no-steps');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'SKILL.md'), '---\nname: test\ndescription: test\n---\n', 'utf8');
    const result = await validateStepFiles(dir);
    assert.equal(result.valid, true);
  });

  it('passes with sequential step numbering', async () => {
    const dir = path.join(tmpDir, 'sequential');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'step-00-route.md'), 'Step 0', 'utf8');
    await fs.writeFile(path.join(dir, 'step-01-scope.md'), 'Step 1', 'utf8');
    await fs.writeFile(path.join(dir, 'step-02-connect.md'), 'Step 2', 'utf8');
    const result = await validateStepFiles(dir);
    assert.equal(result.valid, true);
  });

  it('fails with step numbering gaps', async () => {
    const dir = path.join(tmpDir, 'gaps');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'step-01-scope.md'), 'Step 1', 'utf8');
    await fs.writeFile(path.join(dir, 'step-03-connect.md'), 'Step 3', 'utf8');
    const result = await validateStepFiles(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('gap'));
    assert.ok(result.errors[0].includes('step-02'));
  });

  it('passes with step files in steps/ subdirectory', async () => {
    const dir = path.join(tmpDir, 'subdir');
    const stepsDir = path.join(dir, 'steps');
    await fs.ensureDir(stepsDir);
    await fs.writeFile(path.join(stepsDir, 'step-01-understand.md'), 'Step 1', 'utf8');
    await fs.writeFile(path.join(stepsDir, 'step-02-investigate.md'), 'Step 2', 'utf8');
    await fs.writeFile(path.join(stepsDir, 'step-03-generate.md'), 'Step 3', 'utf8');
    const result = await validateStepFiles(dir);
    assert.equal(result.valid, true);
  });
});

// === validateSkillCohesion ===

describe('validateSkillCohesion', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-cohesion-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fails when skill directory does not exist', async () => {
    const result = await validateSkillCohesion(path.join(tmpDir, 'nonexistent'));
    assert.equal(result.valid, false);
  });

  it('fails when step files exist but workflow.md is missing', async () => {
    const dir = path.join(tmpDir, 'no-workflow');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'step-00-route.md'), 'Step 0', 'utf8');
    const result = await validateSkillCohesion(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('no workflow.md'));
  });

  it('fails when steps/ subdirectory exists but workflow.md is missing', async () => {
    const dir = path.join(tmpDir, 'subdir-no-workflow');
    await fs.ensureDir(path.join(dir, 'steps'));
    await fs.writeFile(path.join(dir, 'steps', 'step-01-test.md'), 'Step 1', 'utf8');
    const result = await validateSkillCohesion(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('no workflow.md'));
  });

  it('passes when step files and workflow.md both exist', async () => {
    const dir = path.join(tmpDir, 'with-workflow');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'workflow.md'), '# Workflow', 'utf8');
    await fs.writeFile(path.join(dir, 'step-00-route.md'), 'Step 0', 'utf8');
    const result = await validateSkillCohesion(dir);
    assert.equal(result.valid, true);
  });

  it('passes when only SKILL.md exists (agent-activation type)', async () => {
    const dir = path.join(tmpDir, 'agent-only');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'SKILL.md'), '---\nname: test\ndescription: test\n---\n', 'utf8');
    const result = await validateSkillCohesion(dir);
    assert.equal(result.valid, true);
  });
});

// === validateSkill (composed) ===

describe('validateSkill', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-vskill-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('passes for a valid agent-activation skill', async () => {
    const dir = path.join(tmpDir, 'valid-agent');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'SKILL.md'), '---\nname: bmad-agent-bme-test\ndescription: test agent\n---\nActivation\n', 'utf8');
    const result = await validateSkill(dir);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('passes for a valid workflow skill with steps', async () => {
    const dir = path.join(tmpDir, 'valid-workflow');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'SKILL.md'), '---\nname: bmad-test-workflow\ndescription: test workflow\n---\nFollow workflow.md\n', 'utf8');
    await fs.writeFile(path.join(dir, 'workflow.md'), '# Workflow\n', 'utf8');
    await fs.writeFile(path.join(dir, 'step-00-route.md'), 'Step 0\n', 'utf8');
    await fs.writeFile(path.join(dir, 'step-01-scope.md'), 'Step 1\n', 'utf8');
    const result = await validateSkill(dir);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('aggregates errors from all sub-validators', async () => {
    const dir = path.join(tmpDir, 'multi-fail');
    await fs.ensureDir(dir);
    // Missing name in SKILL.md + step gap + missing workflow.md
    await fs.writeFile(path.join(dir, 'SKILL.md'), '---\ndescription: test\n---\n', 'utf8');
    await fs.writeFile(path.join(dir, 'step-01-a.md'), 'Step 1\n', 'utf8');
    await fs.writeFile(path.join(dir, 'step-03-c.md'), 'Step 3\n', 'utf8');
    const result = await validateSkill(dir);
    assert.equal(result.valid, false);
    // Should have errors from: missing name, step gap, missing workflow.md
    assert.ok(result.errors.length >= 3, `Expected >=3 errors, got ${result.errors.length}: ${result.errors.join('; ')}`);
  });

  it('passes for existing agent-activation skill on disk', async () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const agentSkillDir = path.join(projectRoot, '.claude/skills/bmad-agent-bme-contextualization-expert');
    // Only run if the skill exists on disk
    if (fs.existsSync(agentSkillDir)) {
      const result = await validateSkill(agentSkillDir);
      assert.equal(result.valid, true, `Existing skill failed: ${result.errors.join('; ')}`);
    }
  });

  it('passes for existing workflow skill on disk', async () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const workflowSkillDir = path.join(projectRoot, '.claude/skills/bmad-team-factory');
    // Only run if the skill exists on disk
    if (fs.existsSync(workflowSkillDir)) {
      const result = await validateSkill(workflowSkillDir);
      assert.equal(result.valid, true, `Existing skill failed: ${result.errors.join('; ')}`);
    }
  });
});
