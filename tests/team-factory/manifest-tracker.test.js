const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');

const { buildManifest, buildExtensionManifest, formatManifest, formatAbortInstructions } = require('../../_bmad/bme/_team-factory/lib/manifest-tracker');

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

    // 2 agents + 2 workflows * 2 files + 1 contract + config + csv + registry (modified) + spec (modified)
    assert.equal(manifest.length, 11);

    const created = manifest.filter(e => e.operation === 'created');
    const modified = manifest.filter(e => e.operation === 'modified');
    assert.equal(created.length, 9);
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
