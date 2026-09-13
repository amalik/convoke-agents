const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');

const { buildManifest, buildExtensionManifest, buildSkillExtensionManifest, formatManifest, formatAbortInstructions } = require('../../_bmad/bme/_team-factory/lib/manifest-tracker');

const GOLDEN_PATH = path.join(__dirname, 'golden', 'golden-manifest.json');

/**
 * Build a generation context matching the test-team-spec.yaml fixture (2-agent Sequential team).
 */
function buildTestContext() {
  const moduleRoot = '_bmad/bme/_test-team';
  return {
    module_root: moduleRoot,
    generated_files: [
      `${moduleRoot}/agents/alpha-analyzer.md`,
      `${moduleRoot}/agents/beta-builder.md`,
      `${moduleRoot}/workflows/data-analysis/workflow.md`,
      `${moduleRoot}/workflows/data-analysis/SKILL.md`,
      `${moduleRoot}/workflows/component-building/workflow.md`,
      `${moduleRoot}/workflows/component-building/SKILL.md`,
      `${moduleRoot}/contracts/tc1-analysis-report.md`,
    ],
    agent_files: [
      `${moduleRoot}/agents/alpha-analyzer.md`,
      `${moduleRoot}/agents/beta-builder.md`,
    ],
    workflow_dirs: [
      `${moduleRoot}/workflows/data-analysis`,
      `${moduleRoot}/workflows/component-building`,
    ],
    contract_files: [
      `${moduleRoot}/contracts/tc1-analysis-report.md`,
    ],
    config_yaml_path: `${moduleRoot}/config.yaml`,
    module_help_csv_path: `${moduleRoot}/module-help.csv`,
  };
}

function buildTestSpec() {
  return {
    team_name_kebab: 'test-team',
    spec_file_path: '_bmad-output/test-team-artifacts/test-team-team-spec.yaml',
  };
}

// === buildManifest ===

describe('buildManifest', () => {
  it('returns correct entry count and operations', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());

    // tf-2-13 (T133d): was 11 / 9 created, counting "2 workflows * 2 files" — a
    // workflow.md AND a SKILL.md per directory. The generator writes workflow.md +
    // steps/ and never a SKILL.md, so the manifest claimed two files that do not
    // exist and the abort path sent the operator after them. T127 ruled the generator
    // stays v5, so the tracker moved rather than the generator.
    // 2 agents + 2 workflows * 1 file + 1 contract + config + csv + registry (modified) + spec (modified)
    assert.equal(manifest.length, 9);

    const created = manifest.filter(e => e.operation === 'created');
    const modified = manifest.filter(e => e.operation === 'modified');
    assert.equal(created.length, 7);
    assert.equal(modified.length, 2);
  });

  it('marks agent-registry.js as modified', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const registry = manifest.find(e => e.path === 'scripts/update/lib/agent-registry.js');
    assert.ok(registry);
    assert.equal(registry.operation, 'modified');
  });

  it('marks spec file as modified', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const spec = manifest.find(e => e.path.includes('team-spec.yaml'));
    assert.ok(spec);
    assert.equal(spec.operation, 'modified');
  });

  it('sets module name from team_name_kebab', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    assert.ok(manifest.every(e => e.module === 'test-team'));
  });

  it('matches golden manifest structure', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const golden = JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8'));

    assert.equal(manifest.length, golden.length, 'manifest length mismatch');
    for (let i = 0; i < golden.length; i++) {
      assert.equal(manifest[i].path, golden[i].path, `path mismatch at index ${i}`);
      assert.equal(manifest[i].operation, golden[i].operation, `operation mismatch at index ${i}`);
      assert.equal(manifest[i].module, golden[i].module, `module mismatch at index ${i}`);
    }
  });

  it('includes compass routing when in generated_files', () => {
    const ctx = buildTestContext();
    ctx.generated_files.push(`${ctx.module_root}/compass-routing-reference.md`);
    const manifest = buildManifest(buildTestSpec(), ctx);
    const compass = manifest.find(e => e.path.includes('compass-routing-reference.md'));
    assert.ok(compass);
    assert.equal(compass.operation, 'created');
  });

  it('omits compass routing when NOT in generated_files', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const compass = manifest.find(e => e.path.includes('compass-routing-reference.md'));
    assert.equal(compass, undefined);
  });

  it('handles empty contract_files array', () => {
    const ctx = buildTestContext();
    ctx.contract_files = [];
    const manifest = buildManifest(buildTestSpec(), ctx);
    const contracts = manifest.filter(e => e.path.includes('contracts/'));
    assert.equal(contracts.length, 0);
  });
});

// === formatManifest ===

describe('formatManifest', () => {
  it('produces valid markdown table', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const table = formatManifest(manifest);

    assert.ok(table.includes('| # | Path | Operation | Module |'));
    assert.ok(table.includes('|---|------|-----------|--------|'));
    // Should have header + separator + one line per entry
    const lines = table.split('\n');
    assert.equal(lines.length, manifest.length + 2);
  });

  it('includes all entries with numbered rows', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const table = formatManifest(manifest);
    assert.ok(table.includes('| 1 |'));
    assert.ok(table.includes(`| ${manifest.length} |`));
  });
});

// === formatAbortInstructions ===

describe('formatAbortInstructions', () => {
  it('produces rm for created files', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const instructions = formatAbortInstructions(manifest);
    assert.ok(instructions.includes('rm "_bmad/bme/_test-team/agents/alpha-analyzer.md"'));
  });

  it('produces git checkout for modified files', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const instructions = formatAbortInstructions(manifest);
    assert.ok(instructions.includes('git checkout -- "scripts/update/lib/agent-registry.js"'));
  });

  it('separates created and modified sections', () => {
    const manifest = buildManifest(buildTestSpec(), buildTestContext());
    const instructions = formatAbortInstructions(manifest);
    assert.ok(instructions.includes('# Created files'));
    assert.ok(instructions.includes('# Modified files'));
  });
});

// === buildExtensionManifest ===

function buildExtensionContext() {
  const moduleRoot = '_bmad/bme/_test-team';
  return {
    new_agent_id: 'gamma-guardian',
    new_agent_files: [`${moduleRoot}/agents/gamma-guardian.md`],
    new_workflow_dirs: [`${moduleRoot}/workflows/integrity-check`],
    new_contract_files: [],
    config_yaml_path: `${moduleRoot}/config.yaml`,
    module_help_csv_path: `${moduleRoot}/module-help.csv`,
  };
}

describe('buildExtensionManifest', () => {
  it('returns correct entry count and operations', () => {
    const manifest = buildExtensionManifest(buildExtensionContext());

    // 1 agent + 1 workflow * 2 files + config (modified) + csv (modified) + registry (modified) = 6
    assert.equal(manifest.length, 6);

    const created = manifest.filter(e => e.operation === 'created');
    const modified = manifest.filter(e => e.operation === 'modified');
    assert.equal(created.length, 3); // agent + workflow.md + SKILL.md
    assert.equal(modified.length, 3); // config + csv + registry
  });

  it('marks config, csv, and registry as modified', () => {
    const manifest = buildExtensionManifest(buildExtensionContext());

    const config = manifest.find(e => e.path.includes('config.yaml'));
    assert.ok(config);
    assert.equal(config.operation, 'modified');

    const csv = manifest.find(e => e.path.includes('module-help.csv'));
    assert.ok(csv);
    assert.equal(csv.operation, 'modified');

    const registry = manifest.find(e => e.path === 'scripts/update/lib/agent-registry.js');
    assert.ok(registry);
    assert.equal(registry.operation, 'modified');
  });

  it('uses new_agent_id as module name', () => {
    const manifest = buildExtensionManifest(buildExtensionContext());
    assert.ok(manifest.every(e => e.module === 'gamma-guardian'));
  });

  it('produces correct abort instructions — rm for new files, checkout for modified', () => {
    const manifest = buildExtensionManifest(buildExtensionContext());
    const instructions = formatAbortInstructions(manifest);

    // New files get rm
    assert.ok(instructions.includes('rm "_bmad/bme/_test-team/agents/gamma-guardian.md"'));

    // Modified files get git checkout
    assert.ok(instructions.includes('git checkout -- "_bmad/bme/_test-team/config.yaml"'));
    assert.ok(instructions.includes('git checkout -- "_bmad/bme/_test-team/module-help.csv"'));
    assert.ok(instructions.includes('git checkout -- "scripts/update/lib/agent-registry.js"'));
  });
});

// ══════════════════════════════════════════════════════════════════════
// buildSkillExtensionManifest tests
// ══════════════════════════════════════════════════════════════════════

function buildSkillContext() {
  return {
    new_workflow_name: 'new-analysis',
    agent_id: 'alpha-analyzer',
    new_workflow_files: [
      '_bmad/bme/_test-team/workflows/new-analysis/workflow.md',
      '_bmad/bme/_test-team/workflows/new-analysis/new-analysis.template.md',
    ],
    agent_file_path: '_bmad/bme/_test-team/agents/alpha-analyzer.md',
    config_yaml_path: '_bmad/bme/_test-team/config.yaml',
    module_help_csv_path: '_bmad/bme/_test-team/module-help.csv',
  };
}

describe('buildSkillExtensionManifest', () => {
  it('produces correct entry count', () => {
    const manifest = buildSkillExtensionManifest(buildSkillContext());
    // 2 workflow files (created) + 1 agent .md (modified) + 1 config (modified) + 1 csv (modified) + 1 registry (modified) = 6
    assert.equal(manifest.length, 6);
  });

  it('marks workflow files as created and shared files as modified', () => {
    const manifest = buildSkillExtensionManifest(buildSkillContext());

    const wfFiles = manifest.filter(e => e.path.includes('workflows/new-analysis'));
    assert.equal(wfFiles.length, 2);
    assert.ok(wfFiles.every(e => e.operation === 'created'));

    const agentFile = manifest.find(e => e.path.includes('agents/alpha-analyzer.md'));
    assert.ok(agentFile);
    assert.equal(agentFile.operation, 'modified');

    const config = manifest.find(e => e.path.includes('config.yaml'));
    assert.ok(config);
    assert.equal(config.operation, 'modified');

    const registry = manifest.find(e => e.path === 'scripts/update/lib/agent-registry.js');
    assert.ok(registry);
    assert.equal(registry.operation, 'modified');
  });

  it('uses new_workflow_name as module name', () => {
    const manifest = buildSkillExtensionManifest(buildSkillContext());
    assert.ok(manifest.every(e => e.module === 'new-analysis'));
  });

  it('produces correct abort instructions for skill extension', () => {
    const manifest = buildSkillExtensionManifest(buildSkillContext());
    const instructions = formatAbortInstructions(manifest);

    // New workflow files get rm
    assert.ok(instructions.includes('rm "_bmad/bme/_test-team/workflows/new-analysis/workflow.md"'));

    // Modified files get git checkout
    assert.ok(instructions.includes('git checkout -- "_bmad/bme/_test-team/agents/alpha-analyzer.md"'));
    assert.ok(instructions.includes('git checkout -- "_bmad/bme/_test-team/config.yaml"'));
    assert.ok(instructions.includes('git checkout -- "scripts/update/lib/agent-registry.js"'));
  });
});

// ── tf-2-13 Task 4 (T133d): the manifest is the abort path's removal instructions ──
// step-05-validate.md §8 displays it under "To remove all generated files, delete the
// following paths". A manifest that names an uncreated file sends the operator after
// nothing; one that omits a created file leaves it behind. Both were true:
// it asserted workflows/*/SKILL.md (step-04 never writes SKILL.md — grep -c is 0) and
// had no branch for README.md, guides/ or workflow step files.
describe('tf-2-13: manifest describes what was actually generated', () => {
  const ctx = (over = {}) => ({
    module_root: '/tmp/_probe',
    agent_files: ['/tmp/_probe/agents/alpha-probe.md'],
    workflow_dirs: ['/tmp/_probe/workflows/run-check-a'],
    workflow_step_files: ['/tmp/_probe/workflows/run-check-a/steps/step-01-run.md'],
    guide_files: ['/tmp/_probe/guides/ALPHA-USER-GUIDE.md'],
    readme_path: '/tmp/_probe/README.md',
    config_yaml_path: '/tmp/_probe/config.yaml',
    module_help_csv_path: '/tmp/_probe/module-help.csv',
    output_directory_path: '/tmp/_bmad-output/probe-artifacts',
    generated_files: [],
    registry_wiring_result: { success: true },
    ...over
  });
  const paths = (c) => buildManifest({ team_name_kebab: 'probe' }, c).map(e => e.path);

  it('does not claim a SKILL.md the generator never writes', () => {
    assert.ok(!paths(ctx()).some(p => p.endsWith('SKILL.md')),
      'step-04-generate.md writes workflow.md + steps/, never SKILL.md');
  });

  it('lists README.md, the user guides and the workflow step files', () => {
    const p = paths(ctx());
    assert.ok(p.includes('/tmp/_probe/README.md'), 'README.md missing');
    assert.ok(p.includes('/tmp/_probe/guides/ALPHA-USER-GUIDE.md'), 'guides missing');
    assert.ok(p.includes('/tmp/_probe/workflows/run-check-a/steps/step-01-run.md'), 'step files missing');
  });

  it('lists the output directory so cleanup removes it', () => {
    assert.ok(paths(ctx()).includes('/tmp/_bmad-output/probe-artifacts'));
  });

  it('claims agent-registry.js as modified ONLY when the registry was written', () => {
    const withWrite = paths(ctx());
    const without = paths(ctx({ registry_wiring_result: { success: false } }));
    assert.ok(withWrite.some(p => p.includes('agent-registry.js')), 'should claim it on success');
    assert.ok(!without.some(p => p.includes('agent-registry.js')), 'must not claim it when unwritten');
  });
});
