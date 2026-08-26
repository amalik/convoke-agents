const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
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
    // Story v63-3-1: agents now in skill-dir layout (<id>/SKILL.md).
    for (const id of AGENT_IDS) {
      await fs.ensureDir(path.join(agentsDir, id));
      await fs.writeFile(path.join(agentsDir, id, 'SKILL.md'), `# ${id}`, 'utf8');
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
      // Write all agent skill-dirs EXCEPT the excluded one.
      for (const id of AGENT_IDS) {
        if (id === excludedId) continue;
        await fs.ensureDir(path.join(agentsDir, id));
        await fs.writeFile(path.join(agentsDir, id, 'SKILL.md'), `# ${id}`, 'utf8');
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
  const REG = require('../../scripts/update/lib/agent-registry');
  const { V610_HEADER } = require('../../scripts/lib/agent-manifest-generator');
  const { isManifestHeader } = require('../../scripts/update/lib/validator');

  // A realistic row: the `path` column is the anchor the validator uses, because it
  // is the only column present in all three headers this repo has ever had.
  function row(agentId, submodule, leaf = `${agentId}/SKILL.md`) {
    return `"${agentId}","","T","i","","r","id","s","p","bme","_bmad/bme/${submodule}/agents/${leaf}","bmad-agent-bme-${agentId}"`;
  }
  function fullManifest(extraRows = [], omit = []) {
    const rows = [
      ...REG.AGENTS.filter(a => !omit.includes(a.id)).map(a => row(a.id, '_vortex')),
      ...REG.GYRE_AGENTS.filter(a => !omit.includes(a.id)).map(a => row(a.id, '_gyre', `${a.id}.md`)),
      ...REG.EXTRA_BME_AGENTS.filter(a => !omit.includes(a.id)).map(a => row(a.id, a.submodule, `${a.id}.md`)),
    ];
    return [V610_HEADER, ...rows, ...extraRows].join('\n') + '\n';
  }
  async function write(content) {
    const mp = path.join(tmpDir, '_bmad/_config/agent-manifest.csv');
    await fs.ensureDir(path.dirname(mp));
    if (content === null) await fs.remove(mp);
    else await fs.writeFile(mp, content, 'utf8');
  }

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-val-'));
    // standalone bme agent files must exist on disk for validation to pass
    for (const a of REG.EXTRA_BME_AGENTS) {
      const f = path.join(tmpDir, '_bmad', 'bme', a.submodule, 'agents', `${a.id}.md`);
      await fs.ensureDir(path.dirname(f));
      await fs.writeFile(f, '# stub', 'utf8');
    }
  });
  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('passes when manifest is missing (optional)', async () => {
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true);
    assert.ok(result.warning);
  });

  it('passes on a well-formed manifest', async () => {
    await write(fullManifest());
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true, result.error || '');
  });

  it('fails when an agent row is missing', async () => {
    await write(fullManifest([], [REG.AGENTS[0].id]));
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, false);
    assert.match(result.error, new RegExp(REG.AGENTS[0].id));
  });

  // T76: GYRE_AGENT_IDS was never imported, so all four Gyre agents could vanish
  // and the check still reported pass.
  it('fails when a Gyre agent row is missing', async () => {
    await write(fullManifest([], [REG.GYRE_AGENTS[0].id]));
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, false);
    assert.match(result.error, new RegExp(REG.GYRE_AGENTS[0].id));
  });

  // T76: the old check was a raw substring test over the whole file, so IDs
  // appearing anywhere — even in one prose line with no rows — satisfied it.
  it('fails when the IDs appear only in prose, with no rows', async () => {
    const ids = [...REG.AGENTS, ...REG.GYRE_AGENTS, ...REG.EXTRA_BME_AGENTS].map(a => a.id);
    await write(`${V610_HEADER}\n"${ids.join(' ')}"\n`);
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, false);
    assert.match(result.error, /missing/);
  });

  // Round 1 changed this from a failure to a warning. The check runs AFTER the
  // generator, at migration-runner.js:146, where a failure throws and rolls the
  // update back to the same file — reproducing the duplicate on every retry with no
  // repair path. Reporting is the useful behaviour; failing wedges the consumer.
  it('warns, but does not fail, on duplicate rows for the same agent', async () => {
    await write(fullManifest([row(REG.AGENTS[0].id, '_vortex')]));
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true, result.error || '');
    assert.match(result.warning, /duplicate/i);
    assert.match(result.warning, /2x/);
  });

  // The shape that made Round 1 call this CRITICAL: an upstream BMAD installer run
  // (commit 0d2c15fc) wrote rows naming Convoke agents with a BLANK module column.
  // The generator preserves those forever (module !== 'bme') and appends fresh ones.
  // Counting by path alone made every one a duplicate; 7 of 23 historical manifests
  // reproduce it. `isOwnedRow` requires the module column too, so they do not count.
  it('does not count an upstream row with a blank module column as ours', async () => {
    const id = REG.AGENTS[0].id;
    const upstream = `"${id}","","T","i","","r","id","s","","","_bmad/bme/_vortex/agents/${id}/SKILL.md",""`;
    await write(fullManifest([upstream]));
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true, result.error || '');
    assert.equal(result.warning, undefined, `expected no duplicate warning, got: ${result.warning}`);
  });

  // Also downgraded to a warning by Round 1. `generateAgentManifest` preserves
  // `existing[0]` verbatim, so it cannot repair a lost header — failing here would
  // block the consumer from ever updating again. T75 owns the repair.
  it('warns, but does not fail, when the header is junk', async () => {
    // The realistic shape: the generator has already run, so every agent row exists;
    // what was lost is the header line, and an UPSTREAM row now sits at line 0.
    // (Dropping an agent row instead would legitimately report that agent missing.)
    const upstreamRow =
      '"John","","Product Manager","P","","r","id","s","p","bmm","_bmad/bmm/agents/pm.md","bmad-agent-pm"';
    await write([upstreamRow, ...fullManifest().split('\n').slice(1)].join('\n'));
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true, result.error || '');
    assert.match(result.warning, /header/i);
  });

  // Round 2 BLOCKING: line 0 was discarded unconditionally, even after being
  // identified as NOT a header — so a real agent row was thrown away, reported
  // missing, and the update rolled back. Reachable on an all-bme manifest (the
  // Vortex Standalone shape) whose header was lost, in a tree where regeneration
  // is skipped (isSameRoot).
  it('does not discard line 0 when line 0 is not a header', async () => {
    const rows = fullManifest().split('\n').slice(1).filter(l => l.trim());
    await write(rows.join('\n') + '\n');
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true, result.error || '');
    assert.match(result.warning, /header/i);
    assert.doesNotMatch(String(result.warning), /missing/i, 'no agent may be reported missing');
  });

  // Round 2: both clauses of isManifestHeader survived mutation, because the junk
  // fixture failed BOTH independently. Pin them separately. The `_bmad/` clause is
  // load-bearing: 110 of 638 real data rows across history contain "path".
  it('pins each isManifestHeader clause independently', () => {
    assert.equal(isManifestHeader('name,displayName,path'), true, 'a real header');
    // has `path`, but also `_bmad/` -> a data row, not a header
    assert.equal(
      isManifestHeader('"Isla","","Discovery","d","","empathy mapping path","i","s","p","bme","_bmad/bme/_vortex/agents/x/SKILL.md","c"'),
      false, 'the _bmad/ clause must reject a data row containing the word path'
    );
    // no `path` column at all -> not a header
    assert.equal(isManifestHeader('name,displayName,title,icon'), false, 'the path clause must reject');
    // Round 3: quote-stripping could only manufacture a match across a quote
    // boundary, making a mangled data row look like a header.
    assert.equal(isManifestHeader('pa"th,foo'), false, 'must not join across a quote boundary');
    // Pin the case-fold, which nothing else covers.
    assert.equal(isManifestHeader('Name,Path'), true, 'header matching is case-insensitive');
  });

  // All three headers this repository has ever written must stay valid: rejecting one
  // would make every consumer on that schema warn forever.
  it('recognises all three headers that exist in this repo history', () => {
    for (const h of [
      '"agent_id","name","title","icon","role","identity","communication_style","expertise","submodule","path"',
      'name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId',
      'name,displayName,title,icon,role,identity,communicationStyle,principles,module,path',
    ]) {
      assert.equal(isManifestHeader(h), true, `must recognise: ${h.slice(0, 40)}`);
    }
  });

  it('fails on an empty manifest', async () => {
    await write('   \n\n');
    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, false);
    assert.match(result.error, /empty/i);
  });

  // T76: the ONE state the old check rejected was a supported configuration — an
  // operator opting an agent out via excluded_agents got doctor exit 1.
  it('passes when an agent is legitimately excluded via excluded_agents', async () => {
    const yaml = require('js-yaml');
    const excludedId = REG.AGENTS[0].id;
    const cfgDir = path.join(tmpDir, '_bmad', 'bme', '_vortex');
    await fs.ensureDir(cfgDir);
    await fs.writeFile(path.join(cfgDir, 'config.yaml'), yaml.dump({ excluded_agents: [excludedId] }), 'utf8');
    await write(fullManifest([], [excludedId]));

    const result = await validateManifest(tmpDir);
    assert.equal(result.passed, true, result.error || '');
  });

  // Older schemas are still in the field: 1.0.x consumers carry a quoted 10-column
  // header, and 3.x consumers a 10-column unquoted one. Both must remain valid.
  it('accepts the two historical headers, and the flat agent-file path shape', async () => {
    for (const header of [
      '"agent_id","name","title","icon","role","identity","communication_style","expertise","submodule","path"',
      'name,displayName,title,icon,role,identity,communicationStyle,principles,module,path',
    ]) {
      const rows = [
        ...REG.AGENTS.map(a => row(a.id, '_vortex', `${a.id}.md`)),
        ...REG.GYRE_AGENTS.map(a => row(a.id, '_gyre', `${a.id}.md`)),
        ...REG.EXTRA_BME_AGENTS.map(a => row(a.id, a.submodule, `${a.id}.md`)),
      ];
      await write([header, ...rows].join('\n') + '\n');
      const result = await validateManifest(tmpDir);
      assert.equal(result.passed, true, `${header.slice(0, 30)} → ${result.error}`);
    }
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
