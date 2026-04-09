const fs = require('fs');
const os = require('os');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { writeManifest, readManifest } = require('../../scripts/portability/manifest-csv');
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

function findingTypes(findings) {
  return findings.map((f) => f.type);
}

function hasFindingType(findings, type) {
  return findings.some((f) => f.type === type);
}

describe('Portability validator (sp-1-3)', () => {
  test('Test 1: validator passes on the real skill-manifest.csv (smoke)', () => {
    const realRoot = findProjectRoot();
    const { totalSkills, findings } = validate(realRoot);
    const errors = findings.filter((f) => HARD_FINDING_TYPES.has(f.type));
    expect(totalSkills).toBeGreaterThan(0);
    if (errors.length > 0) {
      // Print for diagnostics if this ever fails
      console.error('Real-manifest hard errors:', errors);
    }
    expect(errors).toEqual([]);
  });

  test('Test 2: missing tier triggers [MISSING]', () => {
    const tmpRoot = setupFixture([
      makeRow({ name: 'bmad-broken', tier: '' }),
    ]);
    const { findings } = validate(tmpRoot);
    expect(hasFindingType(findings, '[MISSING]')).toBe(true);
    const missing = findings.find((f) => f.type === '[MISSING]');
    expect(missing.skill).toBe('bmad-broken');
    expect(missing.detail).toMatch(/tier/);
  });

  test('Test 3: invalid tier value triggers [INVALID]', () => {
    const tmpRoot = setupFixture([
      makeRow({ name: 'bmad-bogus-tier', tier: 'bogus' }),
    ]);
    const { findings } = validate(tmpRoot);
    expect(hasFindingType(findings, '[INVALID]')).toBe(true);
    const invalid = findings.find((f) => f.type === '[INVALID]');
    expect(invalid.skill).toBe('bmad-bogus-tier');
    expect(invalid.detail).toContain('bogus');
  });

  test('Test 4: nonexistent _bmad/ dependency triggers [BROKEN-DEP]', () => {
    const tmpRoot = setupFixture([
      makeRow({
        name: 'bmad-broken-dep',
        dependencies: '_bmad/nonexistent/path/to/file.md',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    expect(hasFindingType(findings, '[BROKEN-DEP]')).toBe(true);
    const broken = findings.find((f) => f.type === '[BROKEN-DEP]');
    expect(broken.skill).toBe('bmad-broken-dep');
    expect(broken.detail).toContain('_bmad/nonexistent/path/to/file.md');
  });

  test('Test 5: orphan skill-name dependency triggers [ORPHAN-DEP]', () => {
    const tmpRoot = setupFixture([
      makeRow({
        name: 'bmad-source-skill',
        dependencies: 'bmad-fake-skill-that-does-not-exist',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    expect(hasFindingType(findings, '[ORPHAN-DEP]')).toBe(true);
    const orphan = findings.find((f) => f.type === '[ORPHAN-DEP]');
    expect(orphan.skill).toBe('bmad-source-skill');
    expect(orphan.detail).toContain('bmad-fake-skill-that-does-not-exist');
  });

  test('Test 6: malformed config: dependency triggers [BAD-CONFIG-DEP]', () => {
    // Use an uppercase character which violates [a-z_][a-z0-9_]*
    const tmpRoot = setupFixture([
      makeRow({
        name: 'bmad-bad-config',
        dependencies: 'config:BadKey',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    expect(hasFindingType(findings, '[BAD-CONFIG-DEP]')).toBe(true);
    const bad = findings.find((f) => f.type === '[BAD-CONFIG-DEP]');
    expect(bad.skill).toBe('bmad-bad-config');
  });

  test('Test 7: pipeline skill with empty deps triggers [MISSING-PREREQS] warning (not error)', () => {
    const tmpRoot = setupFixture([
      makeRow({
        name: 'bmad-pipeline-skill',
        tier: 'pipeline',
        intent: 'plan-your-work',
        dependencies: '',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    expect(hasFindingType(findings, '[MISSING-PREREQS]')).toBe(true);
    // It must NOT also trigger a hard error
    const errors = findings.filter((f) => HARD_FINDING_TYPES.has(f.type));
    expect(errors).toEqual([]);
  });

  test('Test 8: meta-platform pipeline skill is exempt from [MISSING-PREREQS]', () => {
    const tmpRoot = setupFixture([
      makeRow({
        name: 'bmad-meta',
        tier: 'pipeline',
        intent: 'meta-platform',
        dependencies: '',
      }),
    ]);
    const { findings } = validate(tmpRoot);
    expect(hasFindingType(findings, '[MISSING-PREREQS]')).toBe(false);
  });

  test('Test 9: validator does not modify the manifest', () => {
    const tmpRoot = setupFixture([
      makeRow({ name: 'bmad-readonly-test' }),
    ]);
    const manifestPath = path.join(tmpRoot, '_bmad', '_config', 'skill-manifest.csv');
    const before = fs.readFileSync(manifestPath, 'utf8');
    validate(tmpRoot);
    const after = fs.readFileSync(manifestPath, 'utf8');
    expect(after).toBe(before);
  });
});
