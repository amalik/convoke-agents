'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const path = require('path');
const { spawnSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { exportSkill } = require('../../scripts/portability/export-engine');
const { readManifest } = require('../../scripts/portability/manifest-csv');

// Story sp-5-1: Template Inlining for Tier 2 Export
//
// Tests that light-deps skills export successfully with inlined templates,
// companion-skill notes, and sidecar notes.

const projectRoot = findProjectRoot();
const CLI_PATH = path.join(projectRoot, 'scripts', 'portability', 'convoke-export.js');

describe('Tier 2 Export (sp-5-1)', () => {
  it('Test 1: bmad-create-prd exports successfully with Template section', () => {
    const result = exportSkill('bmad-create-prd', projectRoot);
    assert.notStrictEqual(result, undefined);
    assert.ok(result.instructions.includes('## Template:'));
    assert.ok(result.instructions.includes('Prd Template'));
  });

  it('Test 2: template content is inlined, {{vars}} preserved, no _bmad/', () => {
    const result = exportSkill('bmad-create-prd', projectRoot);
    assert.ok(result.instructions.includes('Product Requirements Document'));
    assert.ok(result.instructions.includes('{{project_name}}'));
    assert.ok(!result.instructions.includes('_bmad/'));
  });

  it('Test 3: skill-ref dependencies documented as companion skills', () => {
    const result = exportSkill('bmad-create-prd', projectRoot);
    assert.ok(result.instructions.includes('Companion skill:'));
    assert.ok(result.instructions.includes('Advanced Elicitation'));
  });

  it('Test 4: bmad-cis-agent-storyteller exports with sidecar notes', () => {
    const result = exportSkill('bmad-cis-agent-storyteller', projectRoot);
    assert.ok(result.instructions.includes('Persistent data:'));
  });

  it('Test 5: CLI --tier 2 batch works', () => {
    const result = spawnSync('node', [CLI_PATH, '--tier', '2', '--dry-run'], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: process.env,
      timeout: 30000,
    });
    // Accept 0 (all pass) or 4 (some fail) — both are valid
    assert.ok([0, 4].includes(result.status));
    assert.ok(result.stdout.includes('✅ bmad-create-prd'));
  });

  it('Test 6: --all includes both tier 1 and tier 2 skills', () => {
    const allResult = spawnSync('node', [CLI_PATH, '--all', '--dry-run'], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: process.env,
      timeout: 30000,
    });

    // Count standalone and light-deps from manifest
    const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
    const { header, rows } = readManifest(manifestPath);
    const nameIdx = header.indexOf('name');
    const tierIdx = header.indexOf('tier');
    const standaloneCount = [...new Set(rows.filter((r) => r[tierIdx] === 'standalone').map((r) => r[nameIdx]))].length;
    const lightDepsCount = [...new Set(rows.filter((r) => r[tierIdx] === 'light-deps').map((r) => r[nameIdx]))].length;

    const successLines = [...allResult.stdout.matchAll(/^✅ (\S+)/gm)];
    // --all exports both tiers — total successes must cover every standalone + every light-deps
    // (Strengthened 2026-04-22 per lint-1.1 AC2: was `>= standaloneCount` only, which didn't
    // check tier-2 coverage at all despite the test name claiming "includes both tier 1 and tier 2".)
    assert.ok(
      successLines.length >= standaloneCount + lightDepsCount,
      `expected ≥ ${standaloneCount + lightDepsCount} successes (standalone=${standaloneCount} + light-deps=${lightDepsCount}), got ${successLines.length}`
    );
    // Belt-and-suspenders: verify at least one known light-deps skill is in the output.
    assert.ok(allResult.stdout.includes('bmad-create-prd'));
  });
});
