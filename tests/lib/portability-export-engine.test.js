'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const { execSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { exportSkill, ALLOWED_WARNING_TYPES } = require('../../scripts/portability/export-engine');

// Story sp-2-2: Export Engine
//
// Validates that the export engine produces canonical instructions.md content
// matching the format spec from sp-2-1, for both Carson (Tier 1, strategy 2
// persona resolution) and Winston (Tier 1, strategy 1 persona resolution).

const { FORBIDDEN_STRINGS } = require('../../scripts/portability/test-constants');

const REQUIRED_HEADING_PATTERNS = [
  /^# /m, // Title (any H1 — engine generates "# X with Y" or "# X")
  /^## You are /m,
  /^## When to use this skill$/m,
  /^## Inputs you may need$/m,
  /^## How to proceed$/m,
  /^## What you produce$/m,
];

/**
 * Shared structural-invariant assertions per AC #8 + #9.
 */
function assertStructuralInvariants(result, expectedName, expectedIcon) {
  // 1. Result has all 4 keys
  assert.notStrictEqual(result['instructions'], undefined);
  assert.notStrictEqual(result['persona'], undefined);
  assert.notStrictEqual(result['sections'], undefined);
  assert.notStrictEqual(result['warnings'], undefined);
  assert.equal(typeof result.instructions, 'string');
  assert.ok(result.instructions.length > 0);

  // 2. All required section headings present in correct order
  // Use RegExp.exec().index instead of indexOf(m[0]) — sp-2-1 P2 fix
  const positions = REQUIRED_HEADING_PATTERNS.map((pattern) => {
    const re = new RegExp(pattern.source, pattern.flags);
    const match = re.exec(result.instructions);
    if (!match) {
      throw new Error(
        `Required section heading ${pattern} not found in instructions for ${expectedName}`
      );
    }
    return match.index;
  });
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] <= positions[i - 1]) {
      throw new Error(
        `Section heading ${i + 1} (pattern ${REQUIRED_HEADING_PATTERNS[i]}) ` +
        `appears at offset ${positions[i]}, which is not after section ${i} ` +
        `(at offset ${positions[i - 1]}) for ${expectedName}.`
      );
    }
  }

  // 3. Zero forbidden strings
  const violations = [];
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (result.instructions.includes(forbidden)) {
      violations.push(forbidden);
    }
  }
  if (violations.length > 0) {
    console.error(`${expectedName} export contains forbidden strings:`, violations);
  }
  assert.deepEqual(violations, []);

  // 4. Zero curly-brace placeholders (per sp-2-1 P3 — all should be substituted)
  const placeholderRegex = /\{[\w_-]+\}/g;
  const placeholders = result.instructions.match(placeholderRegex) || [];
  if (placeholders.length > 0) {
    console.error(`${expectedName} export contains unsubstituted placeholders:`, placeholders);
  }
  assert.deepEqual(placeholders, []);

  // 5. Persona name + icon match
  assert.equal(result.persona.name, expectedName);
  assert.equal(result.persona.icon, expectedIcon);

  // 6. Persona name appears in instructions text
  assert.ok(result.instructions.includes(expectedName));

  // 7. warnings.length <= 2
  if (result.warnings.length > 2) {
    console.error(`${expectedName} produced ${result.warnings.length} warnings:`, result.warnings);
  }
  assert.ok(result.warnings.length <= 2);

  // 8. All warning types are in the allowed set
  for (const warning of result.warnings) {
    assert.equal(ALLOWED_WARNING_TYPES.has(warning.type), true);
  }
}

describe('Export engine (sp-2-2)', () => {
  let projectRoot;

  before(() => {
    projectRoot = findProjectRoot();
  });

  it('Test 1: bmad-brainstorming (Carson) satisfies all structural invariants', () => {
    const result = exportSkill('bmad-brainstorming', projectRoot);
    assertStructuralInvariants(result, 'Carson', '🧠');
  });

  it('Test 2: bmad-agent-architect (Winston) satisfies all structural invariants — Fix 1 second fixture', () => {
    const result = exportSkill('bmad-agent-architect', projectRoot);
    assertStructuralInvariants(result, 'Winston', '🏗️');
  });

  it('Test 3: bmad-create-prd (Tier 2 light-deps) exports successfully', () => {
    const result = exportSkill('bmad-create-prd', projectRoot);
    assert.notStrictEqual(result, undefined);
    assert.ok(result.instructions.length > 0);
    assert.ok(result.instructions.includes('## You are'));
  });

  it('Test 4: bmad-dev-story (Tier 3 pipeline) exports with framework-only notice', () => {
    const result = exportSkill('bmad-dev-story', projectRoot);
    assert.notStrictEqual(result, undefined);
    assert.ok(result.instructions.includes('Framework-only skill'));
  });

  it('Test 5: nonexistent skill throws a helpful error', () => {
    assert.throws(() => {
      exportSkill('bmad-skill-that-does-not-exist', projectRoot);
    }, /not in the manifest/i);
  });

  it('Test 6: engine is read-only (git status unchanged before/after)', () => {
    let before;
    try {
      before = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
    } catch (e) {
      console.warn('skipping read-only test — git not available or not a repo');
      return;
    }
    if (before.length > 0) {
      console.warn('skipping read-only test — working tree has pre-existing changes');
      return;
    }
    exportSkill('bmad-brainstorming', projectRoot);
    const after = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
    assert.equal(after, before);
  });

  it('Test 7: Carson produces warnings.length <= 2 with allowed types only', () => {
    const result = exportSkill('bmad-brainstorming', projectRoot);
    assert.ok(result.warnings.length <= 2);
    for (const warning of result.warnings) {
      assert.equal(ALLOWED_WARNING_TYPES.has(warning.type), true);
    }
  });

  it('Test 8: Winston produces warnings.length <= 2 with allowed types only', () => {
    const result = exportSkill('bmad-agent-architect', projectRoot);
    assert.ok(result.warnings.length <= 2);
    for (const warning of result.warnings) {
      assert.equal(ALLOWED_WARNING_TYPES.has(warning.type), true);
    }
  });

  it('Test 9: Carson result.sections has all 7 expected keys', () => {
    const result = exportSkill('bmad-brainstorming', projectRoot);
    const expectedKeys = [
      'title',
      'persona',
      'whenToUse',
      'inputs',
      'howToProceed',
      'whatYouProduce',
      'qualityChecks',
    ];
    for (const key of expectedKeys) {
      assert.notStrictEqual(result.sections[key], undefined);
    }
  });
});
