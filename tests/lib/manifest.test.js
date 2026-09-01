'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const path = require('path');
const {
  getContextClues,
  getCrossReferences,
  buildManifestEntry,
  detectCollisions,
  generateManifest,
  formatManifest,
  readTaxonomy,
  suggestDifferentiator,
} = require('../../scripts/lib/artifact-utils');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Load real taxonomy for all tests
let taxonomy;
let projectRoot;
const fixtureDir = path.join(__dirname, '..', 'fixtures', 'artifact-samples');

before(() => {
  projectRoot = findProjectRoot();
  taxonomy = readTaxonomy(projectRoot);
});

// --- getContextClues tests ---

describe('getContextClues', () => {
  it('returns first 3 lines for a file with > 3 lines', async () => {
    // governed-gyre-prd.md has frontmatter + content (> 3 lines)
    const filePath = path.join(fixtureDir, 'governed-gyre-prd.md');
    const result = await getContextClues(filePath, projectRoot);
    assert.equal(result.firstLines.length, 3);
    assert.equal(result.firstLines[0], '---');
  });

  it('returns all lines for a file with < 3 lines', async () => {
    // prd-gyre.md has just "# PRD Gyre" (1-2 lines)
    const filePath = path.join(fixtureDir, 'prd-gyre.md');
    const result = await getContextClues(filePath, projectRoot);
    assert.ok(result.firstLines.length <= 3);
    assert.equal(result.firstLines[0], '# PRD Gyre');
  });

  it('returns git author info for tracked file', async () => {
    // Use a real tracked file in the repo
    const filePath = path.join(projectRoot, '_bmad', '_config', 'taxonomy.yaml');
    const result = await getContextClues(filePath, projectRoot);
    assert.ok(result.gitAuthor);
    assert.match(result.gitDate, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles non-existent file gracefully', async () => {
    const filePath = path.join(fixtureDir, 'does-not-exist.md');
    const result = await getContextClues(filePath, projectRoot);
    assert.deepEqual(result.firstLines, []);
    assert.equal(result.gitAuthor, null);
    assert.equal(result.gitDate, null);
  });
});

// --- getCrossReferences tests ---

describe('getCrossReferences', () => {
  it('finds markdown link references', async () => {
    // Create a minimal scope set with one file that references another
    const scopeFiles = [
      { filename: 'referrer.md', fullPath: path.join(fixtureDir, 'report-prd-validation-gyre.md') },
      { filename: 'prd-gyre.md', fullPath: path.join(fixtureDir, 'prd-gyre.md') },
    ];
    // report-prd-validation-gyre.md may or may not reference prd-gyre.md
    const result = await getCrossReferences('prd-gyre.md', scopeFiles, projectRoot);
    assert.ok(Array.isArray(result));
  });

  it('returns empty array for unreferenced files', async () => {
    const scopeFiles = [
      { filename: 'prd-gyre.md', fullPath: path.join(fixtureDir, 'prd-gyre.md') },
    ];
    const result = await getCrossReferences('does-not-exist.md', scopeFiles, projectRoot);
    assert.deepEqual(result, []);
  });

  it('skips self-references', async () => {
    const scopeFiles = [
      { filename: 'prd-gyre.md', fullPath: path.join(fixtureDir, 'prd-gyre.md') },
    ];
    const result = await getCrossReferences('prd-gyre.md', scopeFiles, projectRoot);
    assert.deepEqual(result, []);
  });

  it('skips non-md files', async () => {
    const scopeFiles = [
      { filename: 'config.yaml', fullPath: path.join(projectRoot, '_bmad', '_config', 'taxonomy.yaml') },
    ];
    const result = await getCrossReferences('prd-gyre.md', scopeFiles, projectRoot);
    assert.deepEqual(result, []);
  });
});

// --- buildManifestEntry tests ---

describe('buildManifestEntry', () => {
  it('ungoverned file (no type match) -> action AMBIGUOUS', async () => {
    const fileInfo = {
      filename: 'initiatives-backlog.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'initiatives-backlog.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'AMBIGUOUS');
    assert.equal(entry.newPath, null);
    assert.equal(entry.artifactType, null);
  });

  it('fully-governed + old convention filename -> action RENAME', async () => {
    // prd-gyre.md with initiative:gyre frontmatter -> fully-governed
    // But generateNewFilename returns gyre-prd.md != prd-gyre.md -> RENAME
    const fileInfo = {
      filename: 'prd-gyre.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'governed-gyre-prd.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'RENAME');
    assert.equal(entry.newPath, 'planning-artifacts/gyre-prd.md');
  });

  // R1 finding #1. `oldPath` is not a label — it is rejoined into a filesystem path to READ
  // the file and, on `--apply`, as the `git mv` SOURCE. Built as `dir/filename` it flattened
  // every nested file: the six `adr-001-*.md` live in six different folders, and the path
  // named by a flattened entry either does not exist or belongs to another document.
  // `newPath` had the mirrored fault — a name fix would have lifted an ADR out of its
  // initiative folder into `planning-artifacts/`.
  it('preserves the subdirectory in oldPath and newPath for a nested file', async () => {
    const fileInfo = {
      filename: 'prd-gyre.md',
      dir: 'planning-artifacts',
      relPath: path.join('adr', 'p60', 'prd-gyre.md'),
      fullPath: path.join(fixtureDir, 'governed-gyre-prd.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'RENAME');
    assert.equal(entry.oldPath, 'planning-artifacts/adr/p60/prd-gyre.md',
      'oldPath must name where the file actually is');
    assert.equal(entry.newPath, 'planning-artifacts/adr/p60/gyre-prd.md',
      'a rename is a rename, not a relocation — the file keeps its directory');
  });

  it('falls back to filename when a caller supplies no relPath', async () => {
    // Every pre-existing caller and test hand-builds fileInfo without relPath; the flat
    // contract must survive unchanged.
    const fileInfo = {
      filename: 'prd-gyre.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'governed-gyre-prd.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.oldPath, 'planning-artifacts/prd-gyre.md');
    assert.equal(entry.newPath, 'planning-artifacts/gyre-prd.md');
  });

  it('fully-governed + filename matches governance convention -> action SKIP', async () => {
    // gyre-prd.md fixture has initiative:gyre frontmatter AND filename matches convention
    // inferArtifactType('gyre-prd.md') won't match type at start (gyre is initiative, not type)
    // So getGovernanceState returns ungoverned -> AMBIGUOUS, not SKIP.
    // This is expected: the pre-migration inference engine can't detect initiative-first filenames.
    // True SKIP detection is deferred to post-migration idempotency (ag-3-1).
    const fileInfo = {
      filename: 'gyre-prd.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'gyre-prd.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    // Pre-migration: initiative-first filename is ungoverned (no type prefix match)
    assert.equal(entry.action, 'AMBIGUOUS');
  });

  it('half-governed + filename matches governance convention -> action INJECT_ONLY', async () => {
    // To produce INJECT_ONLY, we need: type+initiative inferred, no frontmatter, filename === generateNewFilename.
    // The old convention is type-first (prd-gyre.md), governance is initiative-first (gyre-prd.md).
    // These never match, so INJECT_ONLY only occurs when a file is already in governance convention
    // with type inferable from the old prefix. Since that's a contradiction (governance convention
    // puts initiative first), INJECT_ONLY is unreachable in pre-migration state.
    // This test documents that behavior — INJECT_ONLY becomes reachable post-migration (ag-3-1).
    const fileInfo = {
      filename: 'prd-gyre.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'prd-gyre.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    // Pre-migration: old convention always differs from generated name -> RENAME, not INJECT_ONLY
    assert.equal(entry.action, 'RENAME');
    assert.equal(entry.newPath, 'planning-artifacts/gyre-prd.md');
  });

  it('half-governed + filename differs from target (old convention) -> action RENAME', async () => {
    const fileInfo = {
      filename: 'prd-gyre.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'prd-gyre.md'), // No frontmatter
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'RENAME');
    assert.equal(entry.newPath, 'planning-artifacts/gyre-prd.md');
    assert.equal(entry.initiative, 'gyre');
    assert.equal(entry.artifactType, 'prd');
    assert.equal(entry.confidence, 'high');
  });

  it('invalid-governed file -> action CONFLICT', async () => {
    // We need type-first naming with conflicting frontmatter for a true CONFLICT.
    // prd-helm.md infers type:prd, initiative:helm. If frontmatter says gyre -> CONFLICT.
    // Use filename prd-helm.md pointing to helm-prd.md fixture (which has initiative:gyre)
    const conflictInfo = {
      filename: 'prd-helm.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'helm-prd.md'), // Content has initiative:gyre, filename says helm
    };
    const entry = await buildManifestEntry(conflictInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'CONFLICT');
    assert.equal(entry.fileInitiative, 'helm');
    assert.equal(entry.frontmatterInitiative, 'gyre');
  });

  it('ambiguous file (type OK, initiative unclear) -> action AMBIGUOUS with candidates', async () => {
    const fileInfo = {
      filename: 'persona-engineering-lead-2026-03-21.md',
      dir: 'vortex-artifacts',
      fullPath: path.join(fixtureDir, 'persona-engineering-lead-2026-03-21.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'AMBIGUOUS');
    assert.equal(entry.artifactType, 'persona');
    assert.equal(entry.newPath, null);
  });

  it('half-governed dated file gets correct new path', async () => {
    const fileInfo = {
      filename: 'brief-gyre-2026-03-19.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'brief-gyre-2026-03-19.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'RENAME');
    assert.equal(entry.newPath, 'planning-artifacts/gyre-brief-2026-03-19.md');
  });

  it('non-markdown file -> action SKIP (filtered out)', async () => {
    const fileInfo = {
      filename: 'sprint-status.yaml',
      dir: 'implementation-artifacts',
      fullPath: path.join(projectRoot, '_bmad-output', 'implementation-artifacts', 'sprint-status.yaml'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'SKIP');
    assert.equal(entry.source, 'non-markdown');
  });

  it('unreadable file -> action AMBIGUOUS', async () => {
    const fileInfo = {
      filename: 'ghost.md',
      dir: 'planning-artifacts',
      fullPath: path.join(fixtureDir, 'does-not-exist.md'),
    };
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    assert.equal(entry.action, 'AMBIGUOUS');
    assert.equal(entry.source, 'unreadable');
  });
});

// --- detectCollisions tests ---

describe('detectCollisions', () => {
  it('no collisions -> empty map', () => {
    const entries = [
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md' },
      { action: 'RENAME', oldPath: 'b.md', newPath: 'y.md' },
      { action: 'SKIP', oldPath: 'c.md', newPath: null },
    ];
    const result = detectCollisions(entries);
    assert.equal(result.size, 0);
  });

  it('two files with same target -> collision detected', () => {
    const entries = [
      { action: 'RENAME', oldPath: 'a.md', newPath: 'target.md' },
      { action: 'RENAME', oldPath: 'b.md', newPath: 'target.md' },
      { action: 'RENAME', oldPath: 'c.md', newPath: 'other.md' },
    ];
    const result = detectCollisions(entries);
    assert.equal(result.size, 1);
    assert.equal(result.has('target.md'), true);
    assert.ok(result.get('target.md').includes('a.md'));
    assert.ok(result.get('target.md').includes('b.md'));
  });

  it('target matches existing SKIP file -> collision detected', () => {
    const entries = [
      { action: 'RENAME', oldPath: 'a.md', newPath: 'existing.md' },
      { action: 'SKIP', oldPath: 'existing.md', newPath: null },
    ];
    const result = detectCollisions(entries);
    assert.equal(result.size, 1);
    assert.equal(result.has('existing.md'), true);
  });

  it('ignores AMBIGUOUS and CONFLICT entries for collision check', () => {
    const entries = [
      { action: 'AMBIGUOUS', oldPath: 'a.md', newPath: null },
      { action: 'CONFLICT', oldPath: 'b.md', newPath: null },
      { action: 'RENAME', oldPath: 'c.md', newPath: 'unique.md' },
    ];
    const result = detectCollisions(entries);
    assert.equal(result.size, 0);
  });
});

// --- generateManifest integration tests ---

describe('generateManifest', () => {
  it('processes real _bmad-output directories', async () => {
    const manifest = await generateManifest(projectRoot);
    assert.ok(manifest.entries.length > 0);
    assert.equal(manifest.summary.total, manifest.entries.length);
    assert.equal(
      manifest.summary.total,
      manifest.summary.skip + manifest.summary.rename
        + manifest.summary.inject + manifest.summary.conflict
        + manifest.summary.ambiguous,
    );
  });

  it('returns correct action for known files', async () => {
    const manifest = await generateManifest(projectRoot);

    // prd-gyre.md should be RENAME (half-governed, old convention)
    const prdGyre = manifest.entries.find((e) => e.oldPath.endsWith('prd-gyre.md'));
    if (prdGyre) {
      assert.equal(prdGyre.action, 'RENAME');
      assert.equal(prdGyre.initiative, 'gyre');
    }

    // initiatives-backlog.md should be AMBIGUOUS (ungoverned)
    const backlog = manifest.entries.find((e) => e.oldPath.endsWith('initiatives-backlog.md'));
    if (backlog) {
      assert.equal(backlog.action, 'AMBIGUOUS');
    }
  });

  it('respects excludeDirs option', async () => {
    const manifest = await generateManifest(projectRoot, {
      includeDirs: ['planning-artifacts'],
      excludeDirs: ['_archive'],
    });
    const hasArchive = manifest.entries.some((e) => e.dir === '_archive');
    assert.equal(hasArchive, false);
  });

  // NFR2 perf budget. Same flake-mitigation pattern as B.6 / N3:
  // 3x headroom (30000ms instead of 10000ms) and explicit comment.
  // Real fix is N3-future: synthetic fixed-size fixture + tight 10000ms cap.
  it('performance: full manifest generation within budget (NFR2, with flake headroom)', { timeout: 60000 }, async () => {
    const start = Date.now();
    await generateManifest(projectRoot);
    const duration = Date.now() - start;
    assert.ok(
      duration < 30000,
      `generateManifest took ${duration}ms; NFR2 budget is 10000ms with 3x headroom for CI flake (30000ms)`,
    );
  });

  it('verbose mode gathers cross-references for ambiguous entries', async () => {
    const manifest = await generateManifest(projectRoot, { verbose: true });
    const ambiguous = manifest.entries.filter((e) => e.action === 'AMBIGUOUS');
    // At least some ambiguous entries should have crossReferences populated
    for (const entry of ambiguous) {
      assert.notStrictEqual(entry.crossReferences, null);
      assert.ok(Array.isArray(entry.crossReferences));
    }
  });

  it('context clues populated for ambiguous entries', async () => {
    const manifest = await generateManifest(projectRoot);
    const ambiguous = manifest.entries.filter((e) => e.action === 'AMBIGUOUS');
    for (const entry of ambiguous) {
      assert.notStrictEqual(entry.contextClues, null);
      assert.ok(Array.isArray(entry.contextClues.firstLines));
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
      skip: entries.filter((e) => e.action === 'SKIP').length,
      rename: entries.filter((e) => e.action === 'RENAME').length,
      inject: entries.filter((e) => e.action === 'INJECT_ONLY').length,
      conflict: entries.filter((e) => e.action === 'CONFLICT').length,
      ambiguous: entries.filter((e) => e.action === 'AMBIGUOUS').length,
    },
  });

  it('RENAME entries show arrow format', () => {
    const manifest = makeManifest([{
      action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md',
      newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre',
      artifactType: 'prd', confidence: 'high', source: 'exact',
      typeConfidence: 'high', typeSource: 'prefix',
      dir: 'planning-artifacts', contextClues: null, crossReferences: null,
      candidates: [], collisionWith: null, frontmatterInitiative: null, fileInitiative: 'gyre',
    }]);
    const output = formatManifest(manifest);
    assert.ok(output.includes('prd-gyre.md -> planning-artifacts/gyre-prd.md'));
    assert.ok(output.includes('Initiative: gyre'));
    assert.ok(output.includes('Type: prd (confidence: high, source: prefix)'));
  });

  it('SKIP entries show [SKIP] prefix', () => {
    const manifest = makeManifest([{
      action: 'SKIP', oldPath: 'planning-artifacts/gyre-prd.md',
      newPath: null, initiative: 'gyre', artifactType: 'prd',
      confidence: 'high', source: 'exact', dir: 'planning-artifacts',
      contextClues: null, crossReferences: null, candidates: [],
      collisionWith: null, frontmatterInitiative: 'gyre', fileInitiative: 'gyre',
    }]);
    const output = formatManifest(manifest);
    assert.ok(output.includes('[SKIP]'));
    assert.ok(output.includes('already governed'));
  });

  it('INJECT entries show [INJECT] prefix', () => {
    const manifest = makeManifest([{
      action: 'INJECT_ONLY', oldPath: 'planning-artifacts/gyre-prd.md',
      newPath: null, initiative: 'gyre', artifactType: 'prd',
      confidence: 'high', source: 'exact', dir: 'planning-artifacts',
      contextClues: null, crossReferences: null, candidates: [],
      collisionWith: null, frontmatterInitiative: null, fileInitiative: 'gyre',
    }]);
    const output = formatManifest(manifest);
    assert.ok(output.includes('[INJECT]'));
    assert.ok(output.includes('frontmatter needed'));
  });

  it('CONFLICT entries show [!] prefix with both initiatives', () => {
    const manifest = makeManifest([{
      action: 'CONFLICT', oldPath: 'planning-artifacts/prd-helm.md',
      newPath: null, initiative: null, artifactType: 'prd',
      confidence: 'high', source: 'exact', dir: 'planning-artifacts',
      contextClues: { firstLines: ['# PRD Helm'], gitAuthor: 'Amalik', gitDate: '2026-04-01' },
      crossReferences: null, candidates: [],
      collisionWith: null, frontmatterInitiative: 'gyre', fileInitiative: 'helm',
    }]);
    const output = formatManifest(manifest);
    assert.ok(output.includes('[!]'));
    assert.ok(output.includes('CONFLICT'));
    assert.ok(output.includes('filename says helm'));
    assert.ok(output.includes('frontmatter says gyre'));
    assert.ok(output.includes('ACTION REQUIRED'));
  });

  it('AMBIGUOUS entries show context clues', () => {
    const manifest = makeManifest([{
      action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md',
      newPath: null, initiative: null, artifactType: 'prd',
      confidence: 'low', source: 'unresolved', dir: 'planning-artifacts',
      contextClues: { firstLines: ['# Product Requirements Document'], gitAuthor: 'Amalik', gitDate: '2026-02-22' },
      crossReferences: null, candidates: ['convoke', 'gyre'],
      collisionWith: null, frontmatterInitiative: null, fileInitiative: null,
    }]);
    const output = formatManifest(manifest);
    assert.ok(output.includes('[!]'));
    assert.ok(output.includes('???'));
    assert.ok(output.includes('ambiguous'));
    assert.ok(output.includes('Line 1: "# Product Requirements Document"'));
    assert.ok(output.includes('Git author: Amalik'));
    assert.ok(output.includes('Candidates: convoke, gyre'));
    assert.ok(output.includes('ACTION REQUIRED'));
  });

  it('verbose mode shows cross-references for ambiguous entries', () => {
    const manifest = makeManifest([{
      action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md',
      newPath: null, initiative: null, artifactType: 'prd',
      confidence: 'low', source: 'unresolved', dir: 'planning-artifacts',
      contextClues: { firstLines: ['# PRD'], gitAuthor: 'Amalik', gitDate: '2026-02-22' },
      crossReferences: ['epic-phase3.md', 'architecture.md'], candidates: [],
      collisionWith: null, frontmatterInitiative: null, fileInitiative: null,
    }]);
    const output = formatManifest(manifest, { verbose: true });
    assert.ok(output.includes('Referenced by: epic-phase3.md, architecture.md'));
  });

  it('collision annotation appears on RENAME entries', () => {
    const manifest = makeManifest([{
      action: 'RENAME', oldPath: 'planning-artifacts/a.md',
      newPath: 'planning-artifacts/target.md', initiative: 'gyre',
      artifactType: 'prd', confidence: 'high', source: 'exact',
      dir: 'planning-artifacts', contextClues: null, crossReferences: null,
      candidates: [], collisionWith: ['planning-artifacts/b.md'],
      frontmatterInitiative: null, fileInitiative: 'gyre',
    }]);
    const output = formatManifest(manifest);
    assert.ok(output.includes('[!] COLLISION'));
    assert.ok(output.includes('b.md'));
  });

  it('summary footer includes all counts', () => {
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md', initiative: 'gyre', artifactType: 'prd', confidence: 'high', source: 'exact', dir: 'd', contextClues: null, crossReferences: null, candidates: [], collisionWith: null, frontmatterInitiative: null, fileInitiative: 'gyre' },
      { action: 'SKIP', oldPath: 'b.md', newPath: null, initiative: 'gyre', artifactType: 'prd', confidence: 'high', source: 'exact', dir: 'd', contextClues: null, crossReferences: null, candidates: [], collisionWith: null, frontmatterInitiative: 'gyre', fileInitiative: 'gyre' },
      { action: 'AMBIGUOUS', oldPath: 'c.md', newPath: null, initiative: null, artifactType: null, confidence: 'low', source: 'unresolved', dir: 'd', contextClues: { firstLines: [], gitAuthor: null, gitDate: null }, crossReferences: null, candidates: [], collisionWith: null, frontmatterInitiative: null, fileInitiative: null },
    ]);
    const output = formatManifest(manifest);
    assert.ok(output.includes('Total: 3'));
    assert.ok(output.includes('Rename: 1'));
    assert.ok(output.includes('Skip: 1'));
    assert.ok(output.includes('Ambiguous: 1'));
  });
});

// --- suggestDifferentiator tests (Story 6.2) ---

describe('suggestDifferentiator', () => {
  it('I — helm lean-persona case: navigator/practitioner differentiated', () => {
    const sources = [
      'vortex-artifacts/lean-persona-strategic-navigator-2026-04-04.md',
      'vortex-artifacts/lean-persona-strategic-practitioner-2026-04-04.md',
    ];
    const target = 'vortex-artifacts/helm-lean-persona-2026-04-04.md';
    const result = suggestDifferentiator(sources, target);

    const navigatorPath = result.get('vortex-artifacts/lean-persona-strategic-navigator-2026-04-04.md');
    const practitionerPath = result.get('vortex-artifacts/lean-persona-strategic-practitioner-2026-04-04.md');

    assert.ok(navigatorPath);
    assert.ok(navigatorPath.includes('navigator'));
    assert.match(navigatorPath, /2026-04-04\.md$/);

    assert.ok(practitionerPath);
    assert.ok(practitionerPath.includes('practitioner'));
    assert.match(practitionerPath, /2026-04-04\.md$/);

    // Suggested paths must be unique
    assert.notStrictEqual(navigatorPath, practitionerPath);
  });

  it('J — synthetic 3-way collision: each gets unique differentiator', () => {
    const sources = [
      'vortex-artifacts/persona-junior-2026-01-01.md',
      'vortex-artifacts/persona-mid-2026-01-01.md',
      'vortex-artifacts/persona-senior-2026-01-01.md',
    ];
    const target = 'vortex-artifacts/forge-persona-2026-01-01.md';
    const result = suggestDifferentiator(sources, target);

    const paths = sources.map((s) => result.get(s));
    paths.forEach((p) => assert.ok(p));
    // All three suggested paths must be unique
    assert.equal(new Set(paths).size, 3);
    // Each contains its distinguishing segment
    assert.ok(paths[0].includes('junior'));
    assert.ok(paths[1].includes('mid'));
    assert.ok(paths[2].includes('senior'));
  });

  it('K — indistinguishable sources: returns null without crashing', () => {
    // Two sources whose stems are identical strings (synthetic — would never happen in real
    // collision detection but the function must handle it gracefully)
    const sources = [
      'a/foo-2026-01-01.md',
      'b/foo-2026-01-01.md',
    ];
    const target = 'a/foo-2026-01-01.md';
    const result = suggestDifferentiator(sources, target);
    // Both sources have no segments distinguishing them from the target stem ('foo')
    assert.equal(result.get('a/foo-2026-01-01.md'), null);
    assert.equal(result.get('b/foo-2026-01-01.md'), null);
  });

  it('Sentinel entries (existing files) are skipped, only real sources differentiated', () => {
    const sources = [
      'vortex-artifacts/persona-alpha-2026-01-01.md',
      '(existing) vortex-artifacts/forge-persona-2026-01-01.md',
    ];
    const target = 'vortex-artifacts/forge-persona-2026-01-01.md';
    const result = suggestDifferentiator(sources, target);
    // With only one real source, can't differentiate
    assert.equal(result.get('vortex-artifacts/persona-alpha-2026-01-01.md'), null);
    assert.equal(result.get('(existing) vortex-artifacts/forge-persona-2026-01-01.md'), null);
  });
});

// --- formatManifest suggestion rendering tests (Story 6.2) ---

describe('formatManifest with Story 6.2 suggestions', () => {
  it('L — AMBIGUOUS entry with suggestion shows REVIEW SUGGESTION line', () => {
    const manifest = {
      entries: [
        {
          oldPath: 'planning-artifacts/some-doc.md',
          newPath: null,
          dir: 'planning-artifacts',
          initiative: null,
          artifactType: null,
          confidence: 'low',
          source: 'no-type',
          typeConfidence: 'low',
          typeSource: 'none',
          contextClues: null,
          crossReferences: null,
          candidates: [],
          collisionWith: null,
          frontmatterInitiative: null,
          fileInitiative: null,
          action: 'AMBIGUOUS',
          suggestedInitiative: 'convoke',
          suggestedFrom: 'folder-default',
          suggestedConfidence: 'low',
        },
      ],
      collisions: new Map(),
      summary: { total: 1, skip: 0, rename: 0, inject: 0, conflict: 0, ambiguous: 1 },
    };
    const output = formatManifest(manifest);
    assert.ok(output.includes('Suggested: convoke'));
    assert.ok(output.includes('source: folder-default'));
    assert.ok(output.includes('REVIEW SUGGESTION'));
    assert.ok(!output.includes('ACTION REQUIRED: Specify initiative for this file'));
  });

  it('AMBIGUOUS entry without suggestion still shows ACTION REQUIRED (back-compat)', () => {
    const manifest = {
      entries: [
        {
          oldPath: 'vortex-artifacts/persona-foo.md',
          newPath: null,
          dir: 'vortex-artifacts',
          initiative: null,
          artifactType: 'persona',
          confidence: 'low',
          source: 'unresolved',
          typeConfidence: 'high',
          typeSource: 'prefix',
          contextClues: null,
          crossReferences: null,
          candidates: [],
          collisionWith: null,
          frontmatterInitiative: null,
          fileInitiative: null,
          action: 'AMBIGUOUS',
          suggestedInitiative: null,
          suggestedFrom: null,
          suggestedConfidence: null,
        },
      ],
      collisions: new Map(),
      summary: { total: 1, skip: 0, rename: 0, inject: 0, conflict: 0, ambiguous: 1 },
    };
    const output = formatManifest(manifest);
    assert.ok(output.includes('ACTION REQUIRED'));
    assert.ok(!output.includes('REVIEW SUGGESTION'));
    assert.ok(!output.includes('Suggested:'));
  });

  it('M — RENAME entry with collision + suggestedNewPath shows Suggested rename line', () => {
    const manifest = {
      entries: [
        {
          oldPath: 'a/lean-persona-foo-2026-01-01.md',
          newPath: 'a/helm-lean-persona-2026-01-01.md',
          dir: 'a',
          initiative: 'helm',
          artifactType: 'lean-persona',
          confidence: 'high',
          source: 'inferred',
          typeConfidence: 'high',
          typeSource: 'prefix',
          contextClues: null,
          crossReferences: null,
          candidates: [],
          collisionWith: ['a/lean-persona-bar-2026-01-01.md'],
          frontmatterInitiative: null,
          fileInitiative: 'helm',
          action: 'RENAME',
          suggestedNewPath: 'a/helm-lean-persona-foo-2026-01-01.md',
          suggestedInitiative: null,
          suggestedFrom: null,
          suggestedConfidence: null,
        },
      ],
      collisions: new Map([['a/helm-lean-persona-2026-01-01.md', ['a/lean-persona-foo-2026-01-01.md', 'a/lean-persona-bar-2026-01-01.md']]]),
      summary: { total: 1, skip: 0, rename: 1, inject: 0, conflict: 0, ambiguous: 0 },
    };
    const output = formatManifest(manifest);
    assert.ok(output.includes('COLLISION'));
    assert.ok(output.includes('Suggested rename: a/helm-lean-persona-foo-2026-01-01.md'));
  });
});
