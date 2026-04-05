const {
  parseFilename,
  isValidCategory,
  toLowerKebab,
  parseFrontmatter,
  injectFrontmatter,
  scanArtifactDirs
} = require('../../scripts/lib/artifact-utils');
const path = require('path');
const fs = require('fs-extra');

// --- parseFilename tests ---

describe('parseFilename', () => {
  test('prd-gyre.md → category prd, valid', () => {
    const result = parseFilename('prd-gyre.md');
    expect(result.category).toBe('prd');
    expect(result.hasValidCategory).toBe(true);
    expect(result.isDated).toBe(false);
    expect(result.matchesConvention).toBe(true);
  });

  test('hc2-problem-definition-gyre-2026-03-21.md → dated, category hc2', () => {
    const result = parseFilename('hc2-problem-definition-gyre-2026-03-21.md');
    expect(result.category).toBe('hc2');
    expect(result.hasValidCategory).toBe(true);
    expect(result.isDated).toBe(true);
    expect(result.date).toBe('2026-03-21');
  });

  test('lean-persona-strategic-navigator-2026-04-04.md → dated, category lean (not valid in archive.js registry)', () => {
    const result = parseFilename('lean-persona-strategic-navigator-2026-04-04.md');
    expect(result.isDated).toBe(true);
    expect(result.date).toBe('2026-04-04');
    expect(result.category).toBe('lean');
    expect(result.hasValidCategory).toBe(false); // 'lean' not in VALID_CATEGORIES — expected
  });

  test('architecture.md → no category prefix, not matched as convention', () => {
    const result = parseFilename('architecture.md');
    expect(result.isDated).toBe(false);
    expect(result.category).toBe(null);
    expect(result.hasValidCategory).toBe(false);
    expect(result.matchesConvention).toBe(false);
  });

  test('sprint-change-proposal-2026-03-07.md → dated, category sprint, valid', () => {
    const result = parseFilename('sprint-change-proposal-2026-03-07.md');
    expect(result.isDated).toBe(true);
    expect(result.date).toBe('2026-03-07');
    expect(result.category).toBe('sprint');
    expect(result.hasValidCategory).toBe(true);
    expect(result.baseName).toBe('sprint-change-proposal');
  });

  test('UPPERCASE-FILE.md → detects uppercase', () => {
    const result = parseFilename('UPPERCASE-FILE.md');
    expect(result.isUppercase).toBe(true);
    expect(result.matchesConvention).toBe(false);
  });

  test('brief-gyre-2026-03-19.md → full convention match', () => {
    const result = parseFilename('brief-gyre-2026-03-19.md');
    expect(result.category).toBe('brief');
    expect(result.hasValidCategory).toBe(true);
    expect(result.isDated).toBe(true);
    expect(result.matchesConvention).toBe(true);
  });
});

// --- isValidCategory tests ---

describe('isValidCategory', () => {
  test('prd is valid', () => {
    expect(isValidCategory('prd')).toBe(true);
  });

  test('hc2 is valid (numeric suffix stripped → hc)', () => {
    expect(isValidCategory('hc2')).toBe(true);
  });

  test('lean is not valid', () => {
    expect(isValidCategory('lean')).toBe(false);
  });

  test('gyre is not valid', () => {
    expect(isValidCategory('gyre')).toBe(false);
  });
});

// --- toLowerKebab tests ---

describe('toLowerKebab', () => {
  test('converts uppercase to lowercase', () => {
    expect(toLowerKebab('UPPERCASE-FILE.md')).toBe('uppercase-file.md');
  });

  test('already lowercase stays the same', () => {
    expect(toLowerKebab('lowercase-file.md')).toBe('lowercase-file.md');
  });
});

// --- parseFrontmatter tests ---

describe('parseFrontmatter', () => {
  test('parses valid frontmatter', () => {
    const content = '---\ntitle: Test\nstatus: draft\n---\n\nBody content here.';
    const result = parseFrontmatter(content);
    expect(result.data.title).toBe('Test');
    expect(result.data.status).toBe('draft');
    expect(result.content.trim()).toBe('Body content here.');
  });

  test('handles file with no frontmatter', () => {
    const content = '# Just a heading\n\nSome content.';
    const result = parseFrontmatter(content);
    expect(result.data).toEqual({});
    expect(result.content).toContain('# Just a heading');
  });

  test('handles metadata-only file (frontmatter, no content)', () => {
    const content = '---\ninitiative: helm\nartifact_type: prd\n---\n';
    const result = parseFrontmatter(content);
    expect(result.data.initiative).toBe('helm');
    expect(result.content.trim()).toBe('');
  });
});

// --- injectFrontmatter tests ---

describe('injectFrontmatter', () => {
  test('injects frontmatter into file with no existing frontmatter', () => {
    const content = '# My Document\n\nSome content.';
    const result = injectFrontmatter(content, { initiative: 'helm', artifact_type: 'prd' });
    expect(result.conflicts).toEqual([]);
    expect(result.content).toContain('initiative: helm');
    expect(result.content).toContain('artifact_type: prd');
    expect(result.content).toContain('# My Document');
    expect(result.content).toContain('Some content.');
  });

  test('preserves existing frontmatter fields — never overwrites', () => {
    const content = '---\ntitle: Original Title\nstatus: validated\n---\n\nBody.';
    const result = injectFrontmatter(content, { initiative: 'helm', status: 'draft' });
    // status should stay 'validated' (existing) not 'draft' (new)
    expect(result.content).toContain('status: validated');
    expect(result.content).toContain('initiative: helm');
    // conflict reported for status
    expect(result.conflicts).toEqual([
      { field: 'status', existingValue: 'validated', newValue: 'draft' }
    ]);
  });

  test('handles metadata-only file (empty content below frontmatter)', () => {
    const content = '---\ninitiative: helm\n---\n';
    const result = injectFrontmatter(content, { artifact_type: 'prd', schema_version: 1 });
    expect(result.conflicts).toEqual([]);
    expect(result.content).toContain('initiative: helm');
    expect(result.content).toContain('artifact_type: prd');
    expect(result.content).toContain('schema_version: 1');
  });

  test('detects field conflicts', () => {
    const content = '---\ninitiative: gyre\n---\n\nContent.';
    const result = injectFrontmatter(content, { initiative: 'helm' });
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toEqual({
      field: 'initiative',
      existingValue: 'gyre',
      newValue: 'helm'
    });
    // Existing value preserved
    expect(result.content).toContain('initiative: gyre');
  });

  test('preserves content below frontmatter byte-for-byte', () => {
    const body = '# Title\n\nParagraph with **bold** and `code`.\n\n- List item\n- Another item\n';
    const content = `---\nold_field: value\n---\n${body}`;
    const result = injectFrontmatter(content, { initiative: 'helm' });
    expect(result.content).toContain(body.trim());
  });
});

// --- ensureCleanTree tests ---
// These use a separate require with jest.spyOn to mock child_process.execSync

describe('ensureCleanTree', () => {
  let mockExecSync;
  let ensureCleanTree;

  beforeEach(() => {
    // Clear module cache to get fresh require with spy
    jest.resetModules();
    const cp = require('child_process');
    mockExecSync = jest.spyOn(cp, 'execSync');
    // Re-require artifact-utils so it picks up the spy
    ensureCleanTree = require('../../scripts/lib/artifact-utils').ensureCleanTree;
  });

  afterEach(() => {
    mockExecSync.mockRestore();
  });

  test('passes when tree is clean', () => {
    mockExecSync.mockReturnValue('');
    expect(() => ensureCleanTree(['planning-artifacts'], '/fake/root')).not.toThrow();
  });

  test('throws on uncommitted tracked changes', () => {
    mockExecSync.mockImplementation((cmd) => {
      if (cmd.startsWith('git diff --quiet')) {
        throw new Error('diff found');
      }
      if (cmd.startsWith('git diff --name-only')) {
        return 'file-a.md\nfile-b.md';
      }
      return '';
    });
    expect(() => ensureCleanTree(['planning-artifacts'], '/fake/root'))
      .toThrow(/uncommitted changes/i);
  });

  test('throws on staged changes', () => {
    mockExecSync.mockImplementation((cmd) => {
      if (cmd.startsWith('git diff --quiet')) return '';
      if (cmd.startsWith('git diff --cached --quiet')) {
        throw new Error('staged found');
      }
      if (cmd.startsWith('git diff --cached --name-only')) {
        return 'staged-file.md';
      }
      return '';
    });
    expect(() => ensureCleanTree(['planning-artifacts'], '/fake/root'))
      .toThrow(/staged changes/i);
  });

  test('throws on untracked files in scope', () => {
    mockExecSync.mockImplementation((cmd) => {
      if (cmd.startsWith('git ls-files')) {
        return 'new-untracked.md';
      }
      return '';
    });
    expect(() => ensureCleanTree(['planning-artifacts'], '/fake/root'))
      .toThrow(/untracked files/i);
  });
});

// --- scanArtifactDirs tests ---

describe('scanArtifactDirs', () => {
  const tmpDir = path.join(__dirname, '..', '..', '_test_tmp_scan');

  beforeAll(async () => {
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', 'planning-artifacts'));
    await fs.writeFile(path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'test-file.md'), '# test');
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', '_archive'));
    await fs.writeFile(path.join(tmpDir, '_bmad-output', '_archive', 'archived.md'), '# archived');
  });

  afterAll(async () => {
    await fs.remove(tmpDir);
  });

  test('scans specified directories', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts']);
    expect(results).toHaveLength(1);
    expect(results[0].filename).toBe('test-file.md');
    expect(results[0].dir).toBe('planning-artifacts');
  });

  test('excludes _archive by default', async () => {
    const results = await scanArtifactDirs(tmpDir, ['planning-artifacts', '_archive']);
    expect(results).toHaveLength(1); // only planning-artifacts, _archive excluded
  });

  test('handles non-existent directories gracefully', async () => {
    const results = await scanArtifactDirs(tmpDir, ['nonexistent-dir']);
    expect(results).toHaveLength(0);
  });
});
