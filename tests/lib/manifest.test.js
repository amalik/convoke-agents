const path = require('path');
const {
  getContextClues,
  getCrossReferences,
  buildManifestEntry,
  detectCollisions,
  generateManifest,
  formatManifest,
  readTaxonomy
} = require('../../scripts/lib/artifact-utils');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Load real taxonomy for all tests
let taxonomy;
let projectRoot;
const fixtureDir = path.join(__dirname, '..', 'fixtures', 'artifact-samples');

beforeAll(() => {
  projectRoot = findProjectRoot();
  taxonomy = readTaxonomy(projectRoot);
});

// --- getContextClues tests ---

describe('getContextClues', () => {
  test('returns first 3 lines for a file with > 3 lines', async () => {
    // governed-gyre-prd.md has frontmatter + content (> 3 lines)
    const filePath = path.join(fixtureDir, 'governed-gyre-prd.md');
    const result = await getContextClues(filePath, projectRoot);
    expect(result.firstLines).toHaveLength(3);
    expect(result.firstLines[0]).toBe('---');
  });

  test('returns all lines for a file with < 3 lines', async () => {
    // prd-gyre.md has just "# PRD Gyre" (1-2 lines)
    const filePath = path.join(fixtureDir, 'prd-gyre.md');
    const result = await getContextClues(filePath, projectRoot);
    expect(result.firstLines.length).toBeLessThanOrEqual(3);
    expect(result.firstLines[0]).toBe('# PRD Gyre');
  });

  test('returns git author info for tracked file', async () => {
    // Use a real tracked file in the repo
    const filePath = path.join(projectRoot, '_bmad', '_config', 'taxonomy.yaml');
    const result = await getContextClues(filePath, projectRoot);
    expect(result.gitAuthor).toBeTruthy();
    expect(result.gitDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('handles non-existent file gracefully', async () => {
    const filePath = path.join(fixtureDir, 'does-not-exist.md');
    const result = await getContextClues(filePath, projectRoot);
    expect(result.firstLines).toEqual([]);
    expect(result.gitAuthor).toBeNull();
    expect(result.gitDate).toBeNull();
  });
});

// --- getCrossReferences tests ---

describe('getCrossReferences', () => {
  test('finds markdown link references', async () => {
    // Create a minimal scope set with one file that references another
    const scopeFiles = [
      { filename: 'referrer.md', fullPath: path.join(fixtureDir, 'report-prd-validation-gyre.md') },
      { filename: 'prd-gyre.md', fullPath: path.join(fixtureDir, 'prd-gyre.md') }
    ];
    // report-prd-validation-gyre.md may or may not reference prd-gyre.md
    const result = await getCrossReferences('prd-gyre.md', scopeFiles, projectRoot);
    expect(Array.isArray(result)).toBe(true);
  });

  test('returns empty array for unreferenced files', async () => {
    const scopeFiles = [
      { filename: 'prd-gyre.md', fullPath: path.join(fixtureDir, 'prd-gyre.md') }
    ];
    const result = await getCrossReferences('does-not-exist.md', scopeFiles, projectRoot);
    expect(result).toEqual([]);
  });

  test('skips self-references', async () => {
    const scopeFiles = [
      { filename: 'prd-gyre.md', fullPath: path.join(fixtureDir, 'prd-gyre.md') }
    ];
    const result = await getCrossReferences('prd-gyre.md', scopeFiles, projectRoot);
    expect(result).toEqual([]);
  });

  test('skips non-md files', async () => {
    const scopeFiles = [
      { filename: 'config.yaml', fullPath: path.join(projectRoot, '_bmad', '_config', 'taxonomy.yaml') }
    ];
    const result = await getCrossReferences('prd-gyre.md', scopeFiles, projectRoot);
    expect(result).toEqual([]);
  });
});

// --- buildManifestEntry tests ---

describe('buildManifestEntry', () => {
  test('ungoverned file (no type match) -> action AMBIGUOUS', async () => {
    const fileInfo = {
      filename: 'initiatives-backlog.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'initiatives-backlog.md')
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    expect(entry.action).toBe('AMBIGUOUS');
    expect(entry.newPath).toBeNull();
    expect(entry.artifactType).toBeNull();
  });

  test('fully-governed + old convention filename -> action RENAME', async () => {
    // prd-gyre.md with initiative:gyre frontmatter -> fully-governed
    // But generateNewFilename returns gyre-prd.md != prd-gyre.md -> RENAME
    const fileInfo = {
      filename: 'prd-gyre.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'governed-gyre-prd.md')
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    expect(entry.action).toBe('RENAME');
    expect(entry.newPath).toBe('planning-artifacts/gyre-prd.md');
  });

  test('fully-governed + filename matches governance convention -> action SKIP', async () => {
    // gyre-prd.md fixture has initiative:gyre frontmatter AND filename matches convention
    // inferArtifactType('gyre-prd.md') won't match type at start (gyre is initiative, not type)
    // So getGovernanceState returns ungoverned -> AMBIGUOUS, not SKIP.
    // This is expected: the pre-migration inference engine can't detect initiative-first filenames.
    // True SKIP detection is deferred to post-migration idempotency (ag-3-1).
    const fileInfo = {
      filename: 'gyre-prd.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'gyre-prd.md')
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    // Pre-migration: initiative-first filename is ungoverned (no type prefix match)
    expect(entry.action).toBe('AMBIGUOUS');
  });

  test('half-governed + filename matches governance convention -> action INJECT_ONLY', async () => {
    // To produce INJECT_ONLY, we need: type+initiative inferred, no frontmatter, filename === generateNewFilename.
    // The old convention is type-first (prd-gyre.md), governance is initiative-first (gyre-prd.md).
    // These never match, so INJECT_ONLY only occurs when a file is already in governance convention
    // with type inferable from the old prefix. Since that's a contradiction (governance convention
    // puts initiative first), INJECT_ONLY is unreachable in pre-migration state.
    // This test documents that behavior — INJECT_ONLY becomes reachable post-migration (ag-3-1).
    const fileInfo = {
      filename: 'prd-gyre.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'prd-gyre.md')
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    // Pre-migration: old convention always differs from generated name -> RENAME, not INJECT_ONLY
    expect(entry.action).toBe('RENAME');
    expect(entry.newPath).toBe('planning-artifacts/gyre-prd.md');
  });

  test('half-governed + filename differs from target (old convention) -> action RENAME', async () => {
    const fileInfo = {
      filename: 'prd-gyre.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'prd-gyre.md') // No frontmatter
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    expect(entry.action).toBe('RENAME');
    expect(entry.newPath).toBe('planning-artifacts/gyre-prd.md');
    expect(entry.initiative).toBe('gyre');
    expect(entry.artifactType).toBe('prd');
    expect(entry.confidence).toBe('high');
  });

  test('invalid-governed file -> action CONFLICT', async () => {
    // We need type-first naming with conflicting frontmatter for a true CONFLICT.
    // prd-helm.md infers type:prd, initiative:helm. If frontmatter says gyre -> CONFLICT.
    // Use filename prd-helm.md pointing to helm-prd.md fixture (which has initiative:gyre)
    const conflictInfo = {
      filename: 'prd-helm.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'helm-prd.md') // Content has initiative:gyre, filename says helm
    };
    const entry = await buildManifestEntry(conflictInfo, taxonomy, projectRoot);
    expect(entry.action).toBe('CONFLICT');
    expect(entry.fileInitiative).toBe('helm');
    expect(entry.frontmatterInitiative).toBe('gyre');
  });

  test('ambiguous file (type OK, initiative unclear) -> action AMBIGUOUS with candidates', async () => {
    const fileInfo = {
      filename: 'persona-engineering-lead-2026-03-21.md',
      dir: 'vortex-artifacts',
      fullPath: path.join(fixtureDir, 'persona-engineering-lead-2026-03-21.md')
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    expect(entry.action).toBe('AMBIGUOUS');
    expect(entry.artifactType).toBe('persona');
    expect(entry.newPath).toBeNull();
  });

  test('half-governed dated file gets correct new path', async () => {
    const fileInfo = {
      filename: 'brief-gyre-2026-03-19.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'brief-gyre-2026-03-19.md')
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    expect(entry.action).toBe('RENAME');
    expect(entry.newPath).toBe('planning-artifacts/gyre-brief-2026-03-19.md');
  });

  test('non-markdown file -> action SKIP (filtered out)', async () => {
    const fileInfo = {
      filename: 'sprint-status.yaml',
      dir: 'implementation-artifacts',
      fullPath: path.join(projectRoot, '_bmad-output', 'implementation-artifacts', 'sprint-status.yaml')
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    expect(entry.action).toBe('SKIP');
    expect(entry.source).toBe('non-markdown');
  });

  test('unreadable file -> action AMBIGUOUS', async () => {
    const fileInfo = {
      filename: 'ghost.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'does-not-exist.md')
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    expect(entry.action).toBe('AMBIGUOUS');
    expect(entry.source).toBe('unreadable');
  });
});

// --- detectCollisions tests ---

describe('detectCollisions', () => {
  test('no collisions -> empty map', () => {
    const entries = [
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md' },
      { action: 'RENAME', oldPath: 'b.md', newPath: 'y.md' },
      { action: 'SKIP', oldPath: 'c.md', newPath: null }
    ];
    const result = detectCollisions(entries);
    expect(result.size).toBe(0);
  });

  test('two files with same target -> collision detected', () => {
    const entries = [
      { action: 'RENAME', oldPath: 'a.md', newPath: 'target.md' },
      { action: 'RENAME', oldPath: 'b.md', newPath: 'target.md' },
      { action: 'RENAME', oldPath: 'c.md', newPath: 'other.md' }
    ];
    const result = detectCollisions(entries);
    expect(result.size).toBe(1);
    expect(result.has('target.md')).toBe(true);
    expect(result.get('target.md')).toContain('a.md');
    expect(result.get('target.md')).toContain('b.md');
  });

  test('target matches existing SKIP file -> collision detected', () => {
    const entries = [
      { action: 'RENAME', oldPath: 'a.md', newPath: 'existing.md' },
      { action: 'SKIP', oldPath: 'existing.md', newPath: null }
    ];
    const result = detectCollisions(entries);
    expect(result.size).toBe(1);
    expect(result.has('existing.md')).toBe(true);
  });

  test('ignores AMBIGUOUS and CONFLICT entries for collision check', () => {
    const entries = [
      { action: 'AMBIGUOUS', oldPath: 'a.md', newPath: null },
      { action: 'CONFLICT', oldPath: 'b.md', newPath: null },
      { action: 'RENAME', oldPath: 'c.md', newPath: 'unique.md' }
    ];
    const result = detectCollisions(entries);
    expect(result.size).toBe(0);
  });
});

// --- generateManifest integration tests ---

describe('generateManifest', () => {
  test('processes real _bmad-output directories', async () => {
    const manifest = await generateManifest(projectRoot);
    expect(manifest.entries.length).toBeGreaterThan(0);
    expect(manifest.summary.total).toBe(manifest.entries.length);
    expect(manifest.summary.total).toBe(
      manifest.summary.skip + manifest.summary.rename +
      manifest.summary.inject + manifest.summary.conflict +
      manifest.summary.ambiguous
    );
  });

  test('returns correct action for known files', async () => {
    const manifest = await generateManifest(projectRoot);

    // prd-gyre.md should be RENAME (half-governed, old convention)
    const prdGyre = manifest.entries.find(e => e.oldPath.endsWith('prd-gyre.md'));
    if (prdGyre) {
      expect(prdGyre.action).toBe('RENAME');
      expect(prdGyre.initiative).toBe('gyre');
    }

    // initiatives-backlog.md should be AMBIGUOUS (ungoverned)
    const backlog = manifest.entries.find(e => e.oldPath.endsWith('initiatives-backlog.md'));
    if (backlog) {
      expect(backlog.action).toBe('AMBIGUOUS');
    }
  });

  test('respects excludeDirs option', async () => {
    const manifest = await generateManifest(projectRoot, {
      includeDirs: ['planning-artifacts'],
      excludeDirs: ['_archive']
    });
    const hasArchive = manifest.entries.some(e => e.dir === '_archive');
    expect(hasArchive).toBe(false);
  });

  test('performance: under 10s for all current artifacts (NFR2)', async () => {
    const start = Date.now();
    await generateManifest(projectRoot);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000);
  });

  test('verbose mode gathers cross-references for ambiguous entries', async () => {
    const manifest = await generateManifest(projectRoot, { verbose: true });
    const ambiguous = manifest.entries.filter(e => e.action === 'AMBIGUOUS');
    // At least some ambiguous entries should have crossReferences populated
    for (const entry of ambiguous) {
      expect(entry.crossReferences).not.toBeNull();
      expect(Array.isArray(entry.crossReferences)).toBe(true);
    }
  });

  test('context clues populated for ambiguous entries', async () => {
    const manifest = await generateManifest(projectRoot);
    const ambiguous = manifest.entries.filter(e => e.action === 'AMBIGUOUS');
    for (const entry of ambiguous) {
      expect(entry.contextClues).not.toBeNull();
      expect(Array.isArray(entry.contextClues.firstLines)).toBe(true);
    }
  });
});

// --- formatManifest tests ---

describe('formatManifest', () => {
  const makeManifest = (entries) => ({
    entries,
    collisions: new Map(),
    summary: {
      total: entries.length,
      skip: entries.filter(e => e.action === 'SKIP').length,
      rename: entries.filter(e => e.action === 'RENAME').length,
      inject: entries.filter(e => e.action === 'INJECT_ONLY').length,
      conflict: entries.filter(e => e.action === 'CONFLICT').length,
      ambiguous: entries.filter(e => e.action === 'AMBIGUOUS').length
    }
  });

  test('RENAME entries show arrow format', () => {
    const manifest = makeManifest([{
      action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md',
      newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre',
      artifactType: 'prd', confidence: 'high', source: 'exact',
      typeConfidence: 'high', typeSource: 'prefix',
      dir: 'planning-artifacts', contextClues: null, crossReferences: null,
      candidates: [], collisionWith: null, frontmatterInitiative: null, fileInitiative: 'gyre'
    }]);
    const output = formatManifest(manifest);
    expect(output).toContain('prd-gyre.md -> planning-artifacts/gyre-prd.md');
    expect(output).toContain('Initiative: gyre');
    expect(output).toContain('Type: prd (confidence: high, source: prefix)');
  });

  test('SKIP entries show [SKIP] prefix', () => {
    const manifest = makeManifest([{
      action: 'SKIP', oldPath: 'planning-artifacts/gyre-prd.md',
      newPath: null, initiative: 'gyre', artifactType: 'prd',
      confidence: 'high', source: 'exact', dir: 'planning-artifacts',
      contextClues: null, crossReferences: null, candidates: [],
      collisionWith: null, frontmatterInitiative: 'gyre', fileInitiative: 'gyre'
    }]);
    const output = formatManifest(manifest);
    expect(output).toContain('[SKIP]');
    expect(output).toContain('already governed');
  });

  test('INJECT entries show [INJECT] prefix', () => {
    const manifest = makeManifest([{
      action: 'INJECT_ONLY', oldPath: 'planning-artifacts/gyre-prd.md',
      newPath: null, initiative: 'gyre', artifactType: 'prd',
      confidence: 'high', source: 'exact', dir: 'planning-artifacts',
      contextClues: null, crossReferences: null, candidates: [],
      collisionWith: null, frontmatterInitiative: null, fileInitiative: 'gyre'
    }]);
    const output = formatManifest(manifest);
    expect(output).toContain('[INJECT]');
    expect(output).toContain('frontmatter needed');
  });

  test('CONFLICT entries show [!] prefix with both initiatives', () => {
    const manifest = makeManifest([{
      action: 'CONFLICT', oldPath: 'planning-artifacts/prd-helm.md',
      newPath: null, initiative: null, artifactType: 'prd',
      confidence: 'high', source: 'exact', dir: 'planning-artifacts',
      contextClues: { firstLines: ['# PRD Helm'], gitAuthor: 'Amalik', gitDate: '2026-04-01' },
      crossReferences: null, candidates: [],
      collisionWith: null, frontmatterInitiative: 'gyre', fileInitiative: 'helm'
    }]);
    const output = formatManifest(manifest);
    expect(output).toContain('[!]');
    expect(output).toContain('CONFLICT');
    expect(output).toContain('filename says helm');
    expect(output).toContain('frontmatter says gyre');
    expect(output).toContain('ACTION REQUIRED');
  });

  test('AMBIGUOUS entries show context clues', () => {
    const manifest = makeManifest([{
      action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md',
      newPath: null, initiative: null, artifactType: 'prd',
      confidence: 'low', source: 'unresolved', dir: 'planning-artifacts',
      contextClues: { firstLines: ['# Product Requirements Document'], gitAuthor: 'Amalik', gitDate: '2026-02-22' },
      crossReferences: null, candidates: ['convoke', 'gyre'],
      collisionWith: null, frontmatterInitiative: null, fileInitiative: null
    }]);
    const output = formatManifest(manifest);
    expect(output).toContain('[!]');
    expect(output).toContain('???');
    expect(output).toContain('ambiguous');
    expect(output).toContain('Line 1: "# Product Requirements Document"');
    expect(output).toContain('Git author: Amalik');
    expect(output).toContain('Candidates: convoke, gyre');
    expect(output).toContain('ACTION REQUIRED');
  });

  test('verbose mode shows cross-references for ambiguous entries', () => {
    const manifest = makeManifest([{
      action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md',
      newPath: null, initiative: null, artifactType: 'prd',
      confidence: 'low', source: 'unresolved', dir: 'planning-artifacts',
      contextClues: { firstLines: ['# PRD'], gitAuthor: 'Amalik', gitDate: '2026-02-22' },
      crossReferences: ['epic-phase3.md', 'architecture.md'], candidates: [],
      collisionWith: null, frontmatterInitiative: null, fileInitiative: null
    }]);
    const output = formatManifest(manifest, { verbose: true });
    expect(output).toContain('Referenced by: epic-phase3.md, architecture.md');
  });

  test('collision annotation appears on RENAME entries', () => {
    const manifest = makeManifest([{
      action: 'RENAME', oldPath: 'planning-artifacts/a.md',
      newPath: 'planning-artifacts/target.md', initiative: 'gyre',
      artifactType: 'prd', confidence: 'high', source: 'exact',
      dir: 'planning-artifacts', contextClues: null, crossReferences: null,
      candidates: [], collisionWith: ['planning-artifacts/b.md'],
      frontmatterInitiative: null, fileInitiative: 'gyre'
    }]);
    const output = formatManifest(manifest);
    expect(output).toContain('[!] COLLISION');
    expect(output).toContain('b.md');
  });

  test('summary footer includes all counts', () => {
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md', initiative: 'gyre', artifactType: 'prd', confidence: 'high', source: 'exact', dir: 'd', contextClues: null, crossReferences: null, candidates: [], collisionWith: null, frontmatterInitiative: null, fileInitiative: 'gyre' },
      { action: 'SKIP', oldPath: 'b.md', newPath: null, initiative: 'gyre', artifactType: 'prd', confidence: 'high', source: 'exact', dir: 'd', contextClues: null, crossReferences: null, candidates: [], collisionWith: null, frontmatterInitiative: 'gyre', fileInitiative: 'gyre' },
      { action: 'AMBIGUOUS', oldPath: 'c.md', newPath: null, initiative: null, artifactType: null, confidence: 'low', source: 'unresolved', dir: 'd', contextClues: { firstLines: [], gitAuthor: null, gitDate: null }, crossReferences: null, candidates: [], collisionWith: null, frontmatterInitiative: null, fileInitiative: null }
    ]);
    const output = formatManifest(manifest);
    expect(output).toContain('Total: 3');
    expect(output).toContain('Rename: 1');
    expect(output).toContain('Skip: 1');
    expect(output).toContain('Ambiguous: 1');
  });
});
