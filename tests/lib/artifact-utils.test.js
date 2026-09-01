'use strict';

const { describe, it, before, beforeEach, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const os = require('os');

const { mockExecFileSync } = require('../mock-cp');

const {
  parseFilename,
  isValidCategory,
  toLowerKebab,
  parseFrontmatter,
  injectFrontmatter,
  scanArtifactDirs,
  validateFrontmatterSchema,
  buildSchemaFields,
  VALID_STATUSES,
} = require('../../scripts/lib/artifact-utils');
const path = require('path');
const fs = require('fs-extra');
const { removeTempDir } = require('../helpers');

// --- parseFilename tests ---

describe('parseFilename', () => {
  it('prd-gyre.md → category prd, valid', () => {
    const result = parseFilename('prd-gyre.md');
    assert.equal(result.category, 'prd');
    assert.equal(result.hasValidCategory, true);
    assert.equal(result.isDated, false);
    assert.equal(result.matchesConvention, true);
  });

  it('hc2-problem-definition-gyre-2026-03-21.md → dated, category hc2', () => {
    const result = parseFilename('hc2-problem-definition-gyre-2026-03-21.md');
    assert.equal(result.category, 'hc2');
    assert.equal(result.hasValidCategory, true);
    assert.equal(result.isDated, true);
    assert.equal(result.date, '2026-03-21');
  });

  it('lean-persona-strategic-navigator-2026-04-04.md → dated, category lean (not valid in archive.js registry)', () => {
    const result = parseFilename('lean-persona-strategic-navigator-2026-04-04.md');
    assert.equal(result.isDated, true);
    assert.equal(result.date, '2026-04-04');
    assert.equal(result.category, 'lean');
    assert.equal(result.hasValidCategory, false); // 'lean' not in VALID_CATEGORIES — expected
  });

  it('architecture.md → no category prefix, not matched as convention', () => {
    const result = parseFilename('architecture.md');
    assert.equal(result.isDated, false);
    assert.equal(result.category, null);
    assert.equal(result.hasValidCategory, false);
    assert.equal(result.matchesConvention, false);
  });

  it('sprint-change-proposal-2026-03-07.md → dated, category sprint, valid', () => {
    const result = parseFilename('sprint-change-proposal-2026-03-07.md');
    assert.equal(result.isDated, true);
    assert.equal(result.date, '2026-03-07');
    assert.equal(result.category, 'sprint');
    assert.equal(result.hasValidCategory, true);
    assert.equal(result.baseName, 'sprint-change-proposal');
  });

  it('UPPERCASE-FILE.md → detects uppercase', () => {
    const result = parseFilename('UPPERCASE-FILE.md');
    assert.equal(result.isUppercase, true);
    assert.equal(result.matchesConvention, false);
  });

  it('brief-gyre-2026-03-19.md → full convention match', () => {
    const result = parseFilename('brief-gyre-2026-03-19.md');
    assert.equal(result.category, 'brief');
    assert.equal(result.hasValidCategory, true);
    assert.equal(result.isDated, true);
    assert.equal(result.matchesConvention, true);
  });
});

// --- isValidCategory tests ---

describe('isValidCategory', () => {
  it('prd is valid', () => {
    assert.equal(isValidCategory('prd'), true);
  });

  it('hc2 is valid (numeric suffix stripped → hc)', () => {
    assert.equal(isValidCategory('hc2'), true);
  });

  it('lean is not valid', () => {
    assert.equal(isValidCategory('lean'), false);
  });

  it('gyre is not valid', () => {
    assert.equal(isValidCategory('gyre'), false);
  });
});

// --- toLowerKebab tests ---

describe('toLowerKebab', () => {
  it('converts uppercase to lowercase', () => {
    assert.equal(toLowerKebab('UPPERCASE-FILE.md'), 'uppercase-file.md');
  });

  it('already lowercase stays the same', () => {
    assert.equal(toLowerKebab('lowercase-file.md'), 'lowercase-file.md');
  });
});

// --- parseFrontmatter tests ---

describe('parseFrontmatter', () => {
  it('parses valid frontmatter', () => {
    const content = '---\ntitle: Test\nstatus: draft\n---\n\nBody content here.';
    const result = parseFrontmatter(content);
    assert.equal(result.data.title, 'Test');
    assert.equal(result.data.status, 'draft');
    assert.equal(result.content.trim(), 'Body content here.');
  });

  it('handles file with no frontmatter', () => {
    const content = '# Just a heading\n\nSome content.';
    const result = parseFrontmatter(content);
    assert.deepEqual(result.data, {});
    assert.ok(result.content.includes('# Just a heading'));
  });

  it('handles metadata-only file (frontmatter, no content)', () => {
    const content = '---\ninitiative: helm\nartifact_type: prd\n---\n';
    const result = parseFrontmatter(content);
    assert.equal(result.data.initiative, 'helm');
    assert.equal(result.content.trim(), '');
  });
});

// --- injectFrontmatter tests ---

describe('injectFrontmatter', () => {
  it('injects frontmatter into file with no existing frontmatter', () => {
    const content = '# My Document\n\nSome content.';
    const result = injectFrontmatter(content, { initiative: 'helm', artifact_type: 'prd' });
    assert.deepEqual(result.conflicts, []);
    assert.ok(result.content.includes('initiative: helm'));
    assert.ok(result.content.includes('artifact_type: prd'));
    assert.ok(result.content.includes('# My Document'));
    assert.ok(result.content.includes('Some content.'));
  });

  it('preserves existing frontmatter fields — never overwrites', () => {
    const content = '---\ntitle: Original Title\nstatus: validated\n---\n\nBody.';
    const result = injectFrontmatter(content, { initiative: 'helm', status: 'draft' });
    // status should stay 'validated' (existing) not 'draft' (new)
    assert.ok(result.content.includes('status: validated'));
    assert.ok(result.content.includes('initiative: helm'));
    // conflict reported for status
    assert.deepEqual(result.conflicts, [
      { field: 'status', existingValue: 'validated', newValue: 'draft' },
    ]);
  });

  it('handles metadata-only file (empty content below frontmatter)', () => {
    const content = '---\ninitiative: helm\n---\n';
    const result = injectFrontmatter(content, { artifact_type: 'prd', schema_version: 1 });
    assert.deepEqual(result.conflicts, []);
    assert.ok(result.content.includes('initiative: helm'));
    assert.ok(result.content.includes('artifact_type: prd'));
    assert.ok(result.content.includes('schema_version: 1'));
  });

  it('detects field conflicts', () => {
    const content = '---\ninitiative: gyre\n---\n\nContent.';
    const result = injectFrontmatter(content, { initiative: 'helm' });
    assert.equal(result.conflicts.length, 1);
    assert.deepEqual(result.conflicts[0], {
      field: 'initiative',
      existingValue: 'gyre',
      newValue: 'helm',
    });
    // Existing value preserved
    assert.ok(result.content.includes('initiative: gyre'));
  });

  it('preserves content below frontmatter byte-for-byte', () => {
    const body = '# Title\n\nParagraph with **bold** and `code`.\n\n- List item\n- Another item\n';
    const content = `---\nold_field: value\n---\n${body}`;
    const result = injectFrontmatter(content, { initiative: 'helm' });
    assert.ok(result.content.includes(body.trim()));
  });
});

// --- ensureCleanTree tests ---
//
// Uses tests/mock-cp.js to mock child_process.execFileSync. Same helper
// pattern as the git-recency-rule conversion in B.4. The mock target is
// scripts/lib/artifact-utils — the helper drops it from the require cache,
// installs the spy on cp.execFileSync, then re-requires the module so the
// fresh load captures the spy at module-init time.

describe('ensureCleanTree', () => {
  let cpMock;

  beforeEach(() => {
    cpMock = mockExecFileSync('../../scripts/lib/artifact-utils', __dirname);
  });

  afterEach(() => {
    cpMock?.restore();
  });

  it('passes when tree is clean', () => {
    cpMock.setReturnValue('');
    const { ensureCleanTree } = cpMock.module;
    assert.doesNotThrow(() => ensureCleanTree(['planning-artifacts'], '/fake/root'));
  });

  it('throws on uncommitted tracked changes', () => {
    cpMock.setImpl((_cmd, args) => {
      if (args.includes('--quiet') && !args.includes('--cached')) {
        throw new Error('diff found');
      }
      if (args.includes('--name-only') && !args.includes('--cached')) {
        return 'file-a.md\nfile-b.md';
      }
      return '';
    });
    const { ensureCleanTree } = cpMock.module;
    assert.throws(
      () => ensureCleanTree(['planning-artifacts'], '/fake/root'),
      /uncommitted changes/i,
    );
  });

  it('throws on staged changes', () => {
    cpMock.setImpl((_cmd, args) => {
      if (args.includes('--quiet') && !args.includes('--cached')) return '';
      if (args.includes('--cached') && args.includes('--quiet')) {
        throw new Error('staged found');
      }
      if (args.includes('--cached') && args.includes('--name-only')) {
        return 'staged-file.md';
      }
      return '';
    });
    const { ensureCleanTree } = cpMock.module;
    assert.throws(
      () => ensureCleanTree(['planning-artifacts'], '/fake/root'),
      /staged changes/i,
    );
  });

  it('throws on untracked files in scope', () => {
    cpMock.setImpl((_cmd, args) => {
      if (args.includes('ls-files')) {
        return 'new-untracked.md';
      }
      return '';
    });
    const { ensureCleanTree } = cpMock.module;
    assert.throws(
      () => ensureCleanTree(['planning-artifacts'], '/fake/root'),
      /untracked files/i,
    );
  });
});

// --- scanArtifactDirs tests ---

describe('scanArtifactDirs', () => {
  // Was `path.join(__dirname, '..', '..', '_test_tmp_scan')` — a fixture in the REPO
  // ROOT, which `test-fixture-isolation` forbids and which leaked into `git status`
  // whenever teardown failed. A real temp dir also satisfies removeTempDir's
  // containment guard, which is what caught it.
  let tmpDir;

  before(async () => {
    // Created HERE, not in the describe body: a describe callback runs at module
    // load, so a filtered run (--test-name-pattern, .only) would create the dir
    // and never reach after() to remove it.
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-scan-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', 'planning-artifacts'));
    await fs.writeFile(path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'test-file.md'), '# test');
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', '_archive'));
    await fs.writeFile(path.join(tmpDir, '_bmad-output', '_archive', 'archived.md'), '# archived');

    // BUG-21 fixture: the corpus nests. `planning-artifacts/adr/<initiative>/` holds 15 of the
    // 16 ADRs and `convoke-prd-.../` holds a 14-file sharded PRD, none of which the scanner
    // returned. Two levels deep, plus a dotted entry at depth 1 and a dotted DIRECTORY, because
    // the pre-fix skip only ever ran against top-level names.
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'adr', 'p60'));
    await fs.writeFile(
      path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'adr', 'p60', 'adr-003-nested.md'),
      '# nested adr'
    );
    await fs.writeFile(
      path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'adr', '.hidden-nested.md'),
      '# hidden'
    );
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', 'planning-artifacts', '.hidden-dir'));
    await fs.writeFile(
      path.join(tmpDir, '_bmad-output', 'planning-artifacts', '.hidden-dir', 'buried.md'),
      '# should never be returned'
    );
  });

  after(async () => {
    await removeTempDir(tmpDir);
  });

  it('scans specified directories', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts']);
    const top = results.find(r => r.filename === 'test-file.md');
    assert.ok(top, 'top-level file must still be returned');
    assert.equal(top.dir, 'planning-artifacts');
    assert.equal(top.relPath, 'test-file.md', 'relPath of a top-level file is its basename');
  });

  // BUG-21. Pre-fix this returned 1 file: `scanArtifactDirs` did one readdir and dropped every
  // entry failing `stat.isFile()`, so `adr/` died at the isFile check and nothing below it was
  // ever reached.
  it('descends into subdirectories at unbounded depth', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts']);
    const nested = results.find(r => r.filename === 'adr-003-nested.md');
    assert.ok(nested, 'a file two levels deep must be returned');
    assert.equal(nested.dir, 'planning-artifacts',
      'dir stays the top-level include dir — portfolio-engine keys folder-default attribution ' +
      'off it and archive.js rebuilds a filesystem path from it');
    assert.equal(nested.relPath, path.join('adr', 'p60', 'adr-003-nested.md'));
    assert.equal(nested.fullPath,
      path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'adr', 'p60', 'adr-003-nested.md'));
  });

  it('skips dot-prefixed files and directories at every level', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts']);
    const names = results.map(r => r.filename);
    assert.ok(!names.includes('.hidden-nested.md'), 'dotted file below the top level is skipped');
    assert.ok(!names.includes('buried.md'), 'nothing inside a dotted directory is returned');
  });

  // R1 finding #2. `fs.stat` follows symlinks; `Dirent` does not. With stat, a link to an
  // ancestor threw ELOOP out of the scanner — and out of every instrument that calls it.
  // Pre-recursion this was safe by accident: a symlinked directory failed `isFile()`.
  it('does not follow symlinked directories', async function () {
    const linkDir = path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'loop');
    try {
      await fs.symlink(path.join(tmpDir, '_bmad-output', 'planning-artifacts'), linkDir, 'dir');
    } catch (err) {
      // Windows without developer mode cannot create symlinks; the guard is still correct
      // there because Dirent classification is platform-independent.
      if (err.code === 'EPERM' || err.code === 'ENOSYS') return;
      throw err;
    }
    try {
      const results = await scanArtifactDirs(tmpDir, ['planning-artifacts']);
      assert.ok(
        !results.some(r => r.relPath.split(path.sep).includes('loop')),
        'nothing reached through the symlink may appear in results'
      );
      // The real point: this resolves at all. Pre-patch it threw ELOOP.
      assert.ok(results.some(r => r.filename === 'test-file.md'));
    } finally {
      await fs.remove(linkDir);
    }
  });

  it('returns every non-dotted file in the tree and nothing else', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts']);
    // Derived from the fixture, not hardcoded: derive-counts-from-source.
    const expected = ['adr-003-nested.md', 'test-file.md'];
    assert.deepEqual(results.map(r => r.filename).sort(), expected);
  });

  it('excludes _archive by default', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts', '_archive']);
    // Asserts the property, not a count. The count was `1` until BUG-21's fixture grew the
    // tree — a census, not a test (`derive-counts-from-source`).
    assert.ok(!results.some(r => r.dir === '_archive'), '_archive must not appear in results');
    assert.ok(!results.some(r => r.filename === 'archived.md'), 'archived file must not be returned');
    assert.ok(results.some(r => r.dir === 'planning-artifacts'), 'planning-artifacts is still scanned');
  });

  it('handles non-existent directories gracefully', async () => {
    const results = await scanArtifactDirs(tmpDir, ['nonexistent-dir']);
    assert.equal(results.length, 0);
  });
});

// --- validateFrontmatterSchema tests ---

describe('validateFrontmatterSchema', () => {
  // Minimal valid taxonomy for testing
  const taxonomy = {
    initiatives: {
      platform: ['vortex', 'gyre', 'bmm', 'forge', 'helm', 'enhance', 'loom', 'convoke'],
      user: [],
    },
    artifact_types: ['prd', 'epic', 'arch', 'adr', 'persona', 'hypothesis', 'spec'],
    aliases: {},
  };

  const validFields = {
    initiative: 'helm',
    artifact_type: 'prd',
    created: '2026-04-05',
    schema_version: 1,
  };

  // Helper: assert that errors array contains at least one entry matching the regex.
  // Translation of Jest's `expect(arr).toContainEqual(expect.stringMatching(/re/))`.
  function assertErrorMatching(errors, regex) {
    const matched = errors.some((err) => typeof err === 'string' && regex.test(err));
    assert.ok(matched, `expected errors to contain a string matching ${regex}, got: ${JSON.stringify(errors)}`);
  }

  it('valid schema with all required fields passes', () => {
    const result = validateFrontmatterSchema(validFields, taxonomy);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it('valid schema with optional status passes', () => {
    const result = validateFrontmatterSchema({ ...validFields, status: 'draft' }, taxonomy);
    assert.equal(result.valid, true);
  });

  it('all four valid status values pass', () => {
    for (const status of VALID_STATUSES) {
      const result = validateFrontmatterSchema({ ...validFields, status }, taxonomy);
      assert.equal(result.valid, true);
    }
  });

  it('rejects missing initiative', () => {
    const { initiative: _initiative, ...fields } = validFields;
    const result = validateFrontmatterSchema(fields, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /missing.*initiative/i);
  });

  it('rejects missing artifact_type', () => {
    const { artifact_type: _artifact_type, ...fields } = validFields;
    const result = validateFrontmatterSchema(fields, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /missing.*artifact_type/i);
  });

  it('rejects missing schema_version', () => {
    const { schema_version: _schema_version, ...fields } = validFields;
    const result = validateFrontmatterSchema(fields, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /missing.*schema_version/i);
  });

  it('rejects missing created', () => {
    const { created: _created, ...fields } = validFields;
    const result = validateFrontmatterSchema(fields, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /missing.*created/i);
  });

  it('rejects invalid status value', () => {
    const result = validateFrontmatterSchema({ ...validFields, status: 'active-ish' }, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /invalid status/i);
  });

  it('rejects schema_version: 0', () => {
    const result = validateFrontmatterSchema({ ...validFields, schema_version: 0 }, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /invalid schema_version/i);
  });

  it('rejects schema_version: "one" (non-integer)', () => {
    const result = validateFrontmatterSchema({ ...validFields, schema_version: 'one' }, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /invalid schema_version/i);
  });

  it('rejects initiative not in taxonomy', () => {
    const result = validateFrontmatterSchema({ ...validFields, initiative: 'nonexistent' }, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /initiative.*not found in taxonomy/i);
  });

  it('accepts covenant artifact_type when present in taxonomy', () => {
    // When taxonomy includes 'covenant', files with artifact_type: covenant must validate.
    // Covers the consumer path exercised by files like convoke-covenant-operator.md.
    const taxonomyWithCovenant = { ...taxonomy, artifact_types: [...taxonomy.artifact_types, 'covenant'] };
    const result = validateFrontmatterSchema({ ...validFields, artifact_type: 'covenant' }, taxonomyWithCovenant);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it('rejects artifact_type not in taxonomy', () => {
    const result = validateFrontmatterSchema({ ...validFields, artifact_type: 'unknown-type' }, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /artifact type.*not found in taxonomy/i);
  });

  it('rejects invalid created date format', () => {
    const result = validateFrontmatterSchema({ ...validFields, created: 'yesterday' }, taxonomy);
    assert.equal(result.valid, false);
    assertErrorMatching(result.errors, /invalid created date/i);
  });

  it('collects multiple errors at once', () => {
    const result = validateFrontmatterSchema({ schema_version: 'bad' }, taxonomy);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 3); // missing initiative, artifact_type, created + invalid schema_version
  });
});

// --- buildSchemaFields tests ---

describe('buildSchemaFields', () => {
  it('returns all required fields with correct types', () => {
    const fields = buildSchemaFields('helm', 'prd');
    assert.equal(fields.initiative, 'helm');
    assert.equal(fields.artifact_type, 'prd');
    assert.equal(typeof fields.created, 'string');
    assert.equal(fields.schema_version, 1);
  });

  it('schema_version is always 1', () => {
    const fields = buildSchemaFields('gyre', 'epic');
    assert.equal(fields.schema_version, 1);
  });

  it('created defaults to today in YYYY-MM-DD format', () => {
    const fields = buildSchemaFields('helm', 'prd');
    const today = new Date().toISOString().split('T')[0];
    assert.equal(fields.created, today);
    assert.match(fields.created, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('status included only when provided in options', () => {
    const withoutStatus = buildSchemaFields('helm', 'prd');
    assert.equal(withoutStatus.status, undefined);

    const withStatus = buildSchemaFields('helm', 'prd', { status: 'draft' });
    assert.equal(withStatus.status, 'draft');
  });

  it('custom created date is respected when provided', () => {
    const fields = buildSchemaFields('helm', 'prd', { created: '2025-01-01' });
    assert.equal(fields.created, '2025-01-01');
  });
});
