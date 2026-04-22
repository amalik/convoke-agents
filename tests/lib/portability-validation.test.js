'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { writeManifest } = require('../../scripts/portability/manifest-csv');
const {
  validate,
  HARD_FINDING_TYPES,
} = require('../../scripts/portability/validate-classification');

// Story sp-1-3: Validate Classification Completeness
//
// Tests use synthetic manifest fixtures in tmpdirs to isolate validator
// behavior from the real skill-manifest.csv. The smoke test (Test 1) uses
// the real manifest to ensure sp-1-2's output stays clean.

const HEADER = [
  'canonicalId',
  'name',
  'description',
  'module',
  'path',
  'install_to_bmad',
  'tier',
  'intent',
  'dependencies',
];

/**
 * Build a synthetic skill row with sane defaults.
 * Override any field via the `overrides` arg.
 */
function makeRow(overrides = {}) {
  const defaults = {
    canonicalId: 'bmad-test-skill',
    name: 'bmad-test-skill',
    description: 'Test skill for validator unit tests',
    module: 'core',
    path: '_bmad/core/bmad-test-skill/SKILL.md',
    install_to_bmad: 'true',
    tier: 'standalone',
    intent: 'think-through-problem',
    dependencies: '',
  };
  const merged = { ...defaults, ...overrides };
  return HEADER.map((col) => merged[col]);
}

/**
 * Create a tmp project root with a minimal _bmad/_config/ tree and write
 * a manifest containing the supplied rows. Returns the project root.
 */
function setupFixture(rows) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-1-3-validator-'));
  const configDir = path.join(tmpRoot, '_bmad', '_config');
  fs.mkdirSync(configDir, { recursive: true });
  const manifestPath = path.join(configDir, 'skill-manifest.csv');
  writeManifest(manifestPath, HEADER, rows);
  return tmpRoot;
}

function hasFindingType(findings, type) {
  return findings.some((f) => f.type === type);
}

describe('Portability validator (sp-1-3)', () => {
  // P1 (sp-1-3 review): track every tmpdir setupFixture creates and remove
  // them in afterEach to prevent dev/CI machine pollution.
  const createdTmpDirs = [];
  const trackingSetupFixture = setupFixture;

  afterEach(() => {
    while (createdTmpDirs.length > 0) {
      const dir = createdTmpDirs.pop();
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (_e) {
        // Best-effort cleanup; don't fail tests on filesystem races
      }
    }
  });

  // Wrap setupFixture to record dirs for cleanup
  const setup = (rows) => {
    const dir = trackingSetupFixture(rows);
    createdTmpDirs.push(dir);
    return dir;
  };

  it('Test 1: validator passes on the real skill-manifest.csv (smoke)', () => {
    const realRoot = findProjectRoot();
    const { totalSkills, findings } = validate(realRoot);
    const errors = findings.filter((f) => HARD_FINDING_TYPES.has(f.type));
    assert.ok(totalSkills > 0);
    if (errors.length > 0) {
      // Print for diagnostics if this ever fails
      console.error('Real-manifest hard errors:', errors);
    }
    assert.deepEqual(errors, []);
  });

  it('Test 2: missing tier triggers [MISSING]', () => {
    const tmpRoot = setup([
      makeRow({ name: 'bmad-broken', tier: '' }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[MISSING]'), true);
    const missing = findings.find((f) => f.type === '[MISSING]');
    assert.equal(missing.skill, 'bmad-broken');
    assert.match(missing.detail, /tier/);
  });

  it('Test 3: invalid tier value triggers [INVALID]', () => {
    const tmpRoot = setup([
      makeRow({ name: 'bmad-bogus-tier', tier: 'bogus' }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[INVALID]'), true);
    const invalid = findings.find((f) => f.type === '[INVALID]');
    assert.equal(invalid.skill, 'bmad-bogus-tier');
    assert.ok(invalid.detail.includes('bogus'));
  });

  it('Test 4: nonexistent _bmad/ dependency triggers [BROKEN-DEP]', () => {
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-broken-dep',
        dependencies: '_bmad/nonexistent/path/to/file.md',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[BROKEN-DEP]'), true);
    const broken = findings.find((f) => f.type === '[BROKEN-DEP]');
    assert.equal(broken.skill, 'bmad-broken-dep');
    assert.ok(broken.detail.includes('_bmad/nonexistent/path/to/file.md'));
  });

  it('Test 5: orphan skill-name dependency triggers [ORPHAN-DEP]', () => {
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-source-skill',
        dependencies: 'bmad-fake-skill-that-does-not-exist',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[ORPHAN-DEP]'), true);
    const orphan = findings.find((f) => f.type === '[ORPHAN-DEP]');
    assert.equal(orphan.skill, 'bmad-source-skill');
    assert.ok(orphan.detail.includes('bmad-fake-skill-that-does-not-exist'));
  });

  it('Test 6: malformed config: dependency triggers [BAD-CONFIG-DEP]', () => {
    // Use an uppercase character which violates [a-z_][a-z0-9_]*
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-bad-config',
        dependencies: 'config:BadKey',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[BAD-CONFIG-DEP]'), true);
    const bad = findings.find((f) => f.type === '[BAD-CONFIG-DEP]');
    assert.equal(bad.skill, 'bmad-bad-config');
  });

  it('Test 7: pipeline skill with empty deps triggers [MISSING-PREREQS] warning (not error)', () => {
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-pipeline-skill',
        tier: 'pipeline',
        intent: 'plan-your-work',
        dependencies: '',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[MISSING-PREREQS]'), true);
    // It must NOT also trigger a hard error
    const errors = findings.filter((f) => HARD_FINDING_TYPES.has(f.type));
    assert.deepEqual(errors, []);
  });

  it('Test 8: meta-platform pipeline skill is exempt from [MISSING-PREREQS]', () => {
    const tmpRoot = setup([
      makeRow({
        name: 'bmad-meta',
        tier: 'pipeline',
        intent: 'meta-platform',
        dependencies: '',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    assert.equal(hasFindingType(findings, '[MISSING-PREREQS]'), false);
  });

  it('Test 9: validator does not modify the manifest', () => {
    const tmpRoot = setup([
      makeRow({ name: 'bmad-readonly-test' }),
    ]);
    const manifestPath = path.join(tmpRoot, '_bmad', '_config', 'skill-manifest.csv');
    const before = fs.readFileSync(manifestPath, 'utf8');
    validate(tmpRoot);
    const after = fs.readFileSync(manifestPath, 'utf8');
    assert.equal(after, before);
  });
});
