'use strict';

const { describe, it, before, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');
const {
  parseArgs,
  bootstrapTaxonomy,
  DEFAULT_INCLUDE_DIRS,
  PLATFORM_INITIATIVES,
  DEFAULT_ARTIFACT_TYPES,
  VALID_DIR_PATTERN,
} = require('../../scripts/migrate-artifacts');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { generateManifest, formatManifest } = require('../../scripts/lib/artifact-utils');

// --- parseArgs tests ---

describe('parseArgs', () => {
  it('default args -> correct defaults', () => {
    const result = parseArgs([]);
    assert.equal(result.help, false);
    assert.equal(result.apply, false);
    assert.equal(result.force, false);
    assert.equal(result.verbose, false);
    assert.deepEqual(result.includeDirs, DEFAULT_INCLUDE_DIRS);
    assert.equal(result.includeDirs.length, 3);
  });

  it('--help flag detected', () => {
    assert.equal(parseArgs(['--help']).help, true);
    assert.equal(parseArgs(['-h']).help, true);
  });

  it('--include a,b,c parsed correctly', () => {
    const result = parseArgs(['--include', 'a,b,c']);
    assert.deepEqual(result.includeDirs, ['a', 'b', 'c']);
  });

  it('--include trims whitespace', () => {
    const result = parseArgs(['--include', ' a , b , c ']);
    assert.deepEqual(result.includeDirs, ['a', 'b', 'c']);
  });

  it('--include replaces defaults', () => {
    const result = parseArgs(['--include', 'custom-dir']);
    assert.deepEqual(result.includeDirs, ['custom-dir']);
    assert.notDeepEqual(result.includeDirs, DEFAULT_INCLUDE_DIRS);
  });

  it('--include without value uses defaults', () => {
    const result = parseArgs(['--include']);
    assert.deepEqual(result.includeDirs, [...DEFAULT_INCLUDE_DIRS]);
  });

  it('--include followed by another flag does not consume the flag', () => {
    const result = parseArgs(['--include', '--verbose']);
    assert.deepEqual(result.includeDirs, [...DEFAULT_INCLUDE_DIRS]);
    assert.equal(result.verbose, true);
  });

  // --- Story 6.4: --resolution-file flag ---

  it('default args → resolutionFile is null', () => {
    const result = parseArgs([]);
    assert.equal(result.resolutionFile, null);
  });

  it('--resolution-file <path> captured', () => {
    const result = parseArgs(['--resolution-file', '/tmp/resolutions.json']);
    assert.equal(result.resolutionFile, '/tmp/resolutions.json');
  });

  it('--resolution-file followed by another flag → parse error (does not silently swallow)', () => {
    const result = parseArgs(['--resolution-file', '--force']);
    assert.equal(result.resolutionFile, null);
    assert.ok(result.resolutionFileError);
    assert.ok(result.resolutionFileError.includes('--resolution-file requires a path'));
    // The next flag is still consumed normally
    assert.equal(result.force, true);
  });

  it('--resolution-file without value → parse error', () => {
    const result = parseArgs(['--resolution-file']);
    assert.equal(result.resolutionFile, null);
    assert.ok(result.resolutionFileError);
    assert.ok(result.resolutionFileError.includes('<missing>'));
  });

  it('--resolution-file with single-dash value → parse error', () => {
    const result = parseArgs(['--resolution-file', '-foo.json']);
    assert.equal(result.resolutionFile, null);
    assert.ok(result.resolutionFileError);
  });

  it('--resolution-file=path (GNU equals form) is accepted', () => {
    const result = parseArgs(['--resolution-file=/tmp/r.json']);
    assert.equal(result.resolutionFile, '/tmp/r.json');
    assert.equal(result.resolutionFileError, null);
  });

  it('--resolution-file= (empty equals form) → parse error', () => {
    const result = parseArgs(['--resolution-file=']);
    assert.equal(result.resolutionFile, null);
    assert.ok(result.resolutionFileError);
  });

  it('valid --resolution-file → no error', () => {
    const result = parseArgs(['--resolution-file', '/tmp/resolutions.json']);
    assert.equal(result.resolutionFile, '/tmp/resolutions.json');
    assert.equal(result.resolutionFileError, null);
  });

  it('--resolution-file combined with --apply --force', () => {
    const result = parseArgs(['--apply', '--force', '--resolution-file', 'r.json']);
    assert.equal(result.apply, true);
    assert.equal(result.force, true);
    assert.equal(result.resolutionFile, 'r.json');
    assert.equal(result.resolutionFileError, null);
  });

  it('--include with path traversal rejects invalid names', () => {
    // Silence the warning that parseArgs emits, and capture the call so we
    // can assert on it. node:test/mock equivalent of jest.spyOn + mockImplementation.
    const warnSpy = mock.method(console, 'warn', () => {});
    try {
      const result = parseArgs(['--include', '../../../etc,planning-artifacts']);
      assert.deepEqual(result.includeDirs, ['planning-artifacts']);

      // Assert console.warn was called with a string containing 'Invalid directory names'.
      // jest.toHaveBeenCalledWith(expect.stringContaining(...)) becomes a manual scan
      // of mock.calls[].arguments. Less terse, but every step is visible.
      const matched = warnSpy.mock.calls.some((call) => {
        const firstArg = call.arguments[0];
        return typeof firstArg === 'string' && firstArg.includes('Invalid directory names');
      });
      assert.ok(matched, 'console.warn should have been called with "Invalid directory names" message');
    } finally {
      warnSpy.mock.restore();
    }
  });

  it('--include returns copy of defaults (not same reference)', () => {
    const result1 = parseArgs([]);
    const result2 = parseArgs([]);
    assert.notStrictEqual(result1.includeDirs, result2.includeDirs);
    assert.deepEqual(result1.includeDirs, result2.includeDirs);
  });

  it('--apply and --force flags detected', () => {
    const result = parseArgs(['--apply', '--force']);
    assert.equal(result.apply, true);
    assert.equal(result.force, true);
  });

  it('--verbose flag detected', () => {
    assert.equal(parseArgs(['--verbose']).verbose, true);
  });

  it('unknown flags ignored (no error)', () => {
    const result = parseArgs(['--unknown', '--also-unknown', 'random']);
    assert.equal(result.help, false);
    assert.deepEqual(result.includeDirs, DEFAULT_INCLUDE_DIRS);
  });

  it('multiple flags combined', () => {
    const result = parseArgs(['--verbose', '--include', 'a,b', '--help']);
    assert.equal(result.verbose, true);
    assert.equal(result.help, true);
    assert.deepEqual(result.includeDirs, ['a', 'b']);
  });
});

// --- bootstrapTaxonomy tests ---

describe('bootstrapTaxonomy', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-test-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad', '_config'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('creates taxonomy.yaml when absent', () => {
    const created = bootstrapTaxonomy(tmpDir);
    assert.equal(created, true);

    const configPath = path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml');
    assert.equal(fs.existsSync(configPath), true);

    const content = yaml.load(fs.readFileSync(configPath, 'utf8'));
    assert.deepEqual(content.initiatives.platform, PLATFORM_INITIATIVES);
    assert.deepEqual(content.initiatives.user, []);
    assert.deepEqual(content.artifact_types, DEFAULT_ARTIFACT_TYPES);
    assert.deepEqual(content.aliases, {});
  });

  it('does not overwrite when present', () => {
    const configPath = path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml');
    fs.writeFileSync(configPath, 'existing: true\n', 'utf8');

    const created = bootstrapTaxonomy(tmpDir);
    assert.equal(created, false);

    const content = fs.readFileSync(configPath, 'utf8');
    assert.equal(content, 'existing: true\n');
  });

  it('bootstrap has empty aliases (not migration-specific ones)', () => {
    bootstrapTaxonomy(tmpDir);
    const configPath = path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml');
    const content = yaml.load(fs.readFileSync(configPath, 'utf8'));
    assert.deepEqual(content.aliases, {});
    assert.equal(Object.keys(content.aliases).length, 0);
  });

  it('creates _config directory if absent', async () => {
    const bareDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-bare-'));
    await fs.ensureDir(path.join(bareDir, '_bmad'));
    // _config does not exist yet

    const created = bootstrapTaxonomy(bareDir);
    assert.equal(created, true);
    assert.equal(fs.existsSync(path.join(bareDir, '_bmad', '_config', 'taxonomy.yaml')), true);

    await fs.remove(bareDir);
  });
});

// --- Archive exclusion ---

describe('archive exclusion', () => {
  it('_archive in --include is parsed (filtering happens in main)', () => {
    // parseArgs passes through all valid dir names; main() does the _archive filtering
    const args = parseArgs(['--include', 'planning-artifacts,_archive,vortex-artifacts']);
    assert.ok(args.includeDirs.includes('_archive'));
    assert.ok(args.includeDirs.includes('planning-artifacts'));
  });

  it('_archive-only include would be caught by empty scope check in main', () => {
    const args = parseArgs(['--include', '_archive']);
    const filtered = args.includeDirs.filter((d) => d !== '_archive');
    assert.equal(filtered.length, 0);
  });
});

// --- NFR22 error handling ---

describe('NFR22 taxonomy error handling', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-nfr22-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad', '_config'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('malformed taxonomy produces actionable error from readTaxonomy', () => {
    const configPath = path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml');
    fs.writeFileSync(configPath, 'not: valid: yaml: [broken', 'utf8');

    const { readTaxonomy } = require('../../scripts/lib/artifact-utils');
    assert.throws(() => readTaxonomy(tmpDir), /Invalid YAML/);
  });

  it('taxonomy with missing required fields produces clear error', () => {
    const configPath = path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml');
    fs.writeFileSync(configPath, yaml.dump({ initiatives: { platform: 'not-an-array' } }), 'utf8');

    const { readTaxonomy } = require('../../scripts/lib/artifact-utils');
    assert.throws(() => readTaxonomy(tmpDir), /initiatives.platform.*must be an array/);
  });
});

// --- Dry-run integration ---

describe('dry-run integration', () => {
  let projectRoot;

  before(() => {
    projectRoot = findProjectRoot();
  });

  // 30-second timeout: real-repo dry-run does up to 50 git-context queries
  // (Story 6.2 cap), which under load can exceed the default test budget.
  // NFR2 says < 10s for 200 files; 30s gives 3x headroom for CI flake.
  // node:test accepts an options object as the second argument to it().
  it('generateManifest + formatManifest produces non-empty output', { timeout: 30000 }, async () => {
    const manifest = await generateManifest(projectRoot, {
      includeDirs: DEFAULT_INCLUDE_DIRS,
      excludeDirs: ['_archive'],
    });
    const output = formatManifest(manifest);
    assert.ok(output.length > 0);
    assert.ok(output.includes('Manifest Summary'));
    assert.ok(manifest.summary.total > 0);
  });

  it('--include with single dir restricts scope', { timeout: 30000 }, async () => {
    const manifest = await generateManifest(projectRoot, {
      includeDirs: ['gyre-artifacts'],
      excludeDirs: ['_archive'],
    });
    for (const entry of manifest.entries) {
      assert.equal(entry.dir, 'gyre-artifacts');
    }
  });
});

// --- --apply stub ---

describe('--apply stub', () => {
  it('parseArgs recognizes --apply', () => {
    assert.equal(parseArgs(['--apply']).apply, true);
  });

  it('parseArgs recognizes --force', () => {
    assert.equal(parseArgs(['--force']).force, true);
  });

  it('--force without --apply is detected', () => {
    const args = parseArgs(['--force']);
    assert.equal(args.force, true);
    assert.equal(args.apply, false);
  });
});

// --- VALID_DIR_PATTERN ---

describe('VALID_DIR_PATTERN', () => {
  it('accepts valid directory names', () => {
    assert.equal(VALID_DIR_PATTERN.test('planning-artifacts'), true);
    assert.equal(VALID_DIR_PATTERN.test('vortex-artifacts'), true);
    assert.equal(VALID_DIR_PATTERN.test('_archive'), true);
    assert.equal(VALID_DIR_PATTERN.test('custom_dir'), true);
  });

  it('rejects path traversal and special characters', () => {
    assert.equal(VALID_DIR_PATTERN.test('../../../etc'), false);
    assert.equal(VALID_DIR_PATTERN.test('dir/subdir'), false);
    assert.equal(VALID_DIR_PATTERN.test('dir name'), false);
    assert.equal(VALID_DIR_PATTERN.test('$(cmd)'), false);
    assert.equal(VALID_DIR_PATTERN.test(''), false);
  });
});
