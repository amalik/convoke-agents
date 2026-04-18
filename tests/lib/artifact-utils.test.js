'use strict';

const { describe, it, before, beforeEach, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');

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
  const tmpDir = path.join(__dirname, '..', '..', '_test_tmp_scan');

  before(async () => {
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', 'planning-artifacts'));
    await fs.writeFile(path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'test-file.md'), '# test');
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', '_archive'));
    await fs.writeFile(path.join(tmpDir, '_bmad-output', '_archive', 'archived.md'), '# archived');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('scans specified directories', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts']);
    assert.equal(results.length, 1);
    assert.equal(results[0].filename, 'test-file.md');
    assert.equal(results[0].dir, 'planning-artifacts');
  });

  it('excludes _archive by default', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts', '_archive']);
    assert.equal(results.length, 1); // only planning-artifacts, _archive excluded
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
