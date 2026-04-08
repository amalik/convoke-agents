const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// --- Unit tests (mocked git) ---

describe('ArtifactMigrationError', () => {
  let ArtifactMigrationError;

  beforeAll(() => {
    ArtifactMigrationError = require('../../scripts/lib/artifact-utils').ArtifactMigrationError;
  });

  test('has correct name property', () => {
    const err = new ArtifactMigrationError('test', { phase: 'rename' });
    expect(err.name).toBe('ArtifactMigrationError');
  });

  test('has file, phase, recoverable properties', () => {
    const err = new ArtifactMigrationError('fail', { file: 'a.md', phase: 'rename', recoverable: true });
    expect(err.file).toBe('a.md');
    expect(err.phase).toBe('rename');
    expect(err.recoverable).toBe(true);
    expect(err.message).toBe('fail');
  });

  test('extends Error', () => {
    const err = new ArtifactMigrationError('test', { phase: 'inject' });
    expect(err).toBeInstanceOf(Error);
  });

  test('defaults recoverable to true', () => {
    const err = new ArtifactMigrationError('test', { phase: 'rename' });
    expect(err.recoverable).toBe(true);
  });
});

describe('executeRenames (mocked)', () => {
  let mockExecFileSync;
  let executeRenames;
  let ArtifactMigrationError;

  beforeEach(() => {
    jest.resetModules();
    const cp = require('child_process');
    mockExecFileSync = jest.spyOn(cp, 'execFileSync');
    const utils = require('../../scripts/lib/artifact-utils');
    executeRenames = utils.executeRenames;
    ArtifactMigrationError = utils.ArtifactMigrationError;
  });

  afterEach(() => {
    mockExecFileSync.mockRestore();
  });

  const makeManifest = (entries) => ({
    entries,
    collisions: new Map(),
    summary: { total: entries.length, rename: entries.filter(e => e.action === 'RENAME').length }
  });

  test('all renames succeed -> commit created, returns count + sha', () => {
    mockExecFileSync.mockImplementation((_cmd, args) => {
      if (args && args[0] === 'rev-parse') return 'abc123\n';
      return '';
    });

    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'planning-artifacts/old.md', newPath: 'planning-artifacts/new.md', collisionWith: null },
      { action: 'RENAME', oldPath: 'planning-artifacts/old2.md', newPath: 'planning-artifacts/new2.md', collisionWith: null }
    ]);

    const result = executeRenames(manifest, '/fake/root');
    expect(result.renamedCount).toBe(2);
    expect(result.commitSha).toBe('abc123');
  });

  test('one git mv fails -> rollback called, ArtifactMigrationError thrown', () => {
    let mvCount = 0;
    mockExecFileSync.mockImplementation((_cmd, args) => {
      if (args && args[0] === 'mv') {
        mvCount++;
        if (mvCount === 2) throw new Error('git mv failed');
      }
      return '';
    });

    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md', collisionWith: null },
      { action: 'RENAME', oldPath: 'b.md', newPath: 'y.md', collisionWith: null }
    ]);

    expect(() => executeRenames(manifest, '/fake/root')).toThrow(ArtifactMigrationError);

    // Verify rollback was called
    const resetCalls = mockExecFileSync.mock.calls.filter(
      ([, args]) => args && args[0] === 'reset' && args[1] === '--hard'
    );
    expect(resetCalls.length).toBe(1);
  });

  test('git commit fails after all git mv succeed -> rollback called, ArtifactMigrationError thrown', () => {
    mockExecFileSync.mockImplementation((_cmd, args) => {
      if (args && args[0] === 'commit') throw new Error('pre-commit hook rejected');
      return '';
    });

    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md', collisionWith: null }
    ]);

    expect(() => executeRenames(manifest, '/fake/root')).toThrow(ArtifactMigrationError);
    expect(() => executeRenames(manifest, '/fake/root')).toThrow(/git commit failed/);

    // Verify rollback was called
    const resetCalls = mockExecFileSync.mock.calls.filter(
      ([, args]) => args && args[0] === 'reset' && args[1] === '--hard'
    );
    expect(resetCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('only RENAME entries processed (SKIP, INJECT, AMBIGUOUS, CONFLICT ignored)', () => {
    mockExecFileSync.mockImplementation((_cmd, args) => {
      if (args && args[0] === 'rev-parse') return 'sha1\n';
      return '';
    });

    const manifest = makeManifest([
      { action: 'SKIP', oldPath: 'skip.md', newPath: null, collisionWith: null },
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md', collisionWith: null },
      { action: 'AMBIGUOUS', oldPath: 'amb.md', newPath: null, collisionWith: null },
      { action: 'CONFLICT', oldPath: 'con.md', newPath: null, collisionWith: null },
      { action: 'INJECT_ONLY', oldPath: 'inj.md', newPath: null, collisionWith: null }
    ]);

    const result = executeRenames(manifest, '/fake/root');
    expect(result.renamedCount).toBe(1);

    // Verify only 1 git mv was called (not 5)
    const mvCalls = mockExecFileSync.mock.calls.filter(
      ([, args]) => args && args[0] === 'mv'
    );
    expect(mvCalls.length).toBe(1);
  });

  test('empty rename list -> no git operations, returns count 0', () => {
    const manifest = makeManifest([
      { action: 'SKIP', oldPath: 'a.md', newPath: null, collisionWith: null }
    ]);

    const result = executeRenames(manifest, '/fake/root');
    expect(result.renamedCount).toBe(0);
    expect(result.commitSha).toBeNull();
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  test('RENAME entries with collisions -> throws before any git mv', () => {
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'target.md', collisionWith: ['b.md'] },
      { action: 'RENAME', oldPath: 'b.md', newPath: 'target.md', collisionWith: ['a.md'] }
    ]);

    expect(() => executeRenames(manifest, '/fake/root')).toThrow(/collision/i);
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });
});

describe('verifyHistoryChain (mocked)', () => {
  let mockExecFileSync;
  let verifyHistoryChain;

  beforeEach(() => {
    jest.resetModules();
    const cp = require('child_process');
    mockExecFileSync = jest.spyOn(cp, 'execFileSync');
    verifyHistoryChain = require('../../scripts/lib/artifact-utils').verifyHistoryChain;
  });

  afterEach(() => {
    mockExecFileSync.mockRestore();
  });

  test('samples up to 5 entries', () => {
    mockExecFileSync.mockReturnValue('abc Commit 1\ndef Commit 2\n');
    const entries = Array.from({ length: 10 }, (_, i) => ({
      action: 'RENAME', newPath: `planning-artifacts/file${i}.md`
    }));

    const result = verifyHistoryChain(entries, '/fake/root');
    expect(result.verified).toBe(5);

    // Only 5 git log calls
    const logCalls = mockExecFileSync.mock.calls.filter(
      ([, args]) => args && args[0] === 'log'
    );
    expect(logCalls.length).toBe(5);
  });

  test('returns verified count for files with history', () => {
    mockExecFileSync.mockReturnValue('abc Commit 1\ndef Commit 2\nghi Commit 3\n');
    const entries = [{ action: 'RENAME', newPath: 'planning-artifacts/file.md' }];

    const result = verifyHistoryChain(entries, '/fake/root');
    expect(result.verified).toBe(1);
    expect(result.failed).toEqual([]);
  });

  test('reports failures for files without history chain', () => {
    mockExecFileSync.mockReturnValue('abc Single commit\n');
    const entries = [{ action: 'RENAME', newPath: 'planning-artifacts/file.md' }];

    const result = verifyHistoryChain(entries, '/fake/root');
    expect(result.verified).toBe(0);
    expect(result.failed).toEqual(['planning-artifacts/file.md']);
  });

  test('handles git log failure gracefully', () => {
    mockExecFileSync.mockImplementation(() => { throw new Error('not a git repo'); });
    const entries = [{ action: 'RENAME', newPath: 'planning-artifacts/file.md' }];

    const result = verifyHistoryChain(entries, '/fake/root');
    expect(result.verified).toBe(0);
    expect(result.failed).toHaveLength(1);
  });
});

// --- Integration tests (real temp git repo) ---
// These use REAL child_process — ensure all mocks are fully restored

describe('executeRenames integration', () => {
  beforeAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  let tmpDir;
  let outputDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-rename-'));
    outputDir = path.join(tmpDir, '_bmad-output', 'planning-artifacts');
    await fs.ensureDir(outputDir);

    // Create sample files
    await fs.writeFile(path.join(outputDir, 'prd-gyre.md'), '# PRD Gyre\n');
    await fs.writeFile(path.join(outputDir, 'epic-forge-phase-a.md'), '# Epic Forge\n');
    await fs.writeFile(path.join(outputDir, 'brief-gyre-2026-03-19.md'), '# Brief\n');

    // Initialize git repo and commit
    const { execFileSync: exec } = require('child_process');
    exec('git', ['init'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['config', 'user.name', 'Test'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial commit'], { cwd: tmpDir, stdio: 'pipe' });
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  test('renames files on disk and creates git commit', () => {
    const { executeRenames } = require('../../scripts/lib/artifact-utils');

    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', collisionWith: null },
        { action: 'RENAME', oldPath: 'planning-artifacts/epic-forge-phase-a.md', newPath: 'planning-artifacts/forge-epic-phase-a.md', collisionWith: null }
      ],
      collisions: new Map(),
      summary: { rename: 2 }
    };

    const result = executeRenames(manifest, tmpDir);
    expect(result.renamedCount).toBe(2);
    expect(result.commitSha).toBeTruthy();
    expect(result.commitSha).toMatch(/^[a-f0-9]+$/);

    // Verify files exist at new paths
    expect(fs.existsSync(path.join(outputDir, 'gyre-prd.md'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'forge-epic-phase-a.md'))).toBe(true);

    // Verify old paths gone
    expect(fs.existsSync(path.join(outputDir, 'prd-gyre.md'))).toBe(false);
    expect(fs.existsSync(path.join(outputDir, 'epic-forge-phase-a.md'))).toBe(false);

    // Verify commit message
    const { execFileSync: exec } = require('child_process');
    const log = exec('git', ['log', '--oneline', '-1'], { cwd: tmpDir, encoding: 'utf8', stdio: 'pipe' });
    expect(log).toContain('chore: rename artifacts to governance convention');
  });

  test('git log --follow works on renamed files', () => {
    const { executeRenames, verifyHistoryChain } = require('../../scripts/lib/artifact-utils');

    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', collisionWith: null }
      ],
      collisions: new Map(),
      summary: { rename: 1 }
    };

    executeRenames(manifest, tmpDir);

    const result = verifyHistoryChain(manifest.entries, tmpDir);
    expect(result.verified).toBe(1);
    expect(result.failed).toEqual([]);
  });

  test('rollback restores original state on git mv failure', () => {
    // Create a scenario where git mv fails: rename to a path that can't exist
    const { executeRenames, ArtifactMigrationError } = require('../../scripts/lib/artifact-utils');

    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', collisionWith: null },
        // This will fail — target dir doesn't exist
        { action: 'RENAME', oldPath: 'planning-artifacts/epic-forge-phase-a.md', newPath: 'nonexistent-dir/forge-epic.md', collisionWith: null }
      ],
      collisions: new Map(),
      summary: { rename: 2 }
    };

    expect(() => executeRenames(manifest, tmpDir)).toThrow(ArtifactMigrationError);

    // Verify rollback: original files should be restored
    expect(fs.existsSync(path.join(outputDir, 'prd-gyre.md'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'epic-forge-phase-a.md'))).toBe(true);
  });

  test('performance: rename phase under 60 seconds for test files', () => {
    const { executeRenames } = require('../../scripts/lib/artifact-utils');

    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', collisionWith: null },
        { action: 'RENAME', oldPath: 'planning-artifacts/brief-gyre-2026-03-19.md', newPath: 'planning-artifacts/gyre-brief-2026-03-19.md', collisionWith: null }
      ],
      collisions: new Map(),
      summary: { rename: 2 }
    };

    const start = Date.now();
    executeRenames(manifest, tmpDir);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(60000);
  });
});

// --- updateLinks tests ---

describe('updateLinks', () => {
  let tmpDir;
  let outputDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-links-'));
    outputDir = path.join(tmpDir, '_bmad-output', 'planning-artifacts');
    await fs.ensureDir(outputDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  test('[text](old.md) -> [text](new.md) direct pattern', async () => {
    await fs.writeFile(path.join(outputDir, 'referrer.md'), 'See [PRD](prd-gyre.md) for details.\n');
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    const result = await updateLinks(map, ['planning-artifacts'], tmpDir);
    expect(result.updatedFiles).toBe(1);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    expect(content).toContain('[PRD](gyre-prd.md)');
    expect(content).not.toContain('prd-gyre.md');
  });

  test('[text](./old.md) -> [text](./new.md) dot-slash pattern', async () => {
    await fs.writeFile(path.join(outputDir, 'referrer.md'), 'See [PRD](./prd-gyre.md) here.\n');
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    expect(content).toContain('[PRD](./gyre-prd.md)');
  });

  test('[text](../dir/old.md) -> [text](../dir/new.md) parent-dir pattern', async () => {
    await fs.writeFile(path.join(outputDir, 'referrer.md'), 'See [Epic](../vortex-artifacts/epic-forge.md) here.\n');
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['epic-forge.md', 'forge-epic.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    expect(content).toContain('[Epic](../vortex-artifacts/forge-epic.md)');
  });

  test('[text](old.md#section) -> [text](new.md#section) anchor preserved', async () => {
    await fs.writeFile(path.join(outputDir, 'referrer.md'), 'See [section](prd-gyre.md#overview) here.\n');
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    expect(content).toContain('[section](gyre-prd.md#overview)');
  });

  test('frontmatter inputDocuments array entries updated', async () => {
    const fileContent = '---\ninputDocuments:\n  - prd-gyre.md\n  - architecture.md\n---\n# Content\n';
    await fs.writeFile(path.join(outputDir, 'referrer.md'), fileContent);
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    expect(content).toContain('gyre-prd.md');
    expect(content).not.toMatch(/inputDocuments:[\s\S]*prd-gyre\.md/);
  });

  test('files with no matching links are NOT rewritten', async () => {
    const original = '# No links here\nJust text.\n';
    await fs.writeFile(path.join(outputDir, 'nolinks.md'), original);
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    const result = await updateLinks(map, ['planning-artifacts'], tmpDir);
    expect(result.updatedFiles).toBe(0);
    const content = fs.readFileSync(path.join(outputDir, 'nolinks.md'), 'utf8');
    expect(content).toBe(original);
  });

  test('files outside _bmad-output/ scope are NOT touched (FR15)', async () => {
    // Create a file OUTSIDE _bmad-output/ that references old filename
    const outsideDir = path.join(tmpDir, 'docs');
    await fs.ensureDir(outsideDir);
    const outsideContent = 'See [PRD](prd-gyre.md) for details.\n';
    await fs.writeFile(path.join(outsideDir, 'readme.md'), outsideContent);

    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);

    // Outside file should be untouched
    const content = fs.readFileSync(path.join(outsideDir, 'readme.md'), 'utf8');
    expect(content).toBe(outsideContent);
  });

  test('inputDocuments substring does NOT corrupt similar filenames', async () => {
    // prd.md should NOT match inside report-prd.md
    const fileContent = '---\ninputDocuments:\n  - report-prd-gyre.md\n  - prd-gyre.md\n---\n# Content\n';
    await fs.writeFile(path.join(outputDir, 'referrer.md'), fileContent);
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    // prd-gyre.md should be replaced
    expect(content).toContain('gyre-prd.md');
    // report-prd-gyre.md should NOT be corrupted
    expect(content).toContain('report-prd-gyre.md');
    expect(content).not.toContain('report-gyre-prd.md');
  });
});

// --- executeInjections tests ---

describe('executeInjections', () => {
  let tmpDir;
  let outputDir;

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-inject-'));
    outputDir = path.join(tmpDir, '_bmad-output', 'planning-artifacts');
    await fs.ensureDir(outputDir);
    await fs.ensureDir(path.join(tmpDir, '_bmad', '_config'));

    // Create taxonomy for readTaxonomy
    const yaml = require('js-yaml');
    const taxonomy = {
      initiatives: { platform: ['gyre', 'forge'], user: [] },
      artifact_types: ['prd', 'epic', 'brief'],
      aliases: {}
    };
    fs.writeFileSync(
      path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml'),
      yaml.dump(taxonomy),
      'utf8'
    );

    // Init git repo
    const { execFileSync: exec } = require('child_process');
    exec('git', ['init'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['config', 'user.name', 'Test'], { cwd: tmpDir, stdio: 'pipe' });
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  test('injects frontmatter into file with no existing frontmatter', async () => {
    // Create file, commit, rename (simulate commit 1)
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '# PRD Gyre\nContent here.\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename artifacts to governance convention'], { cwd: tmpDir, stdio: 'pipe' });

    const { executeInjections } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }
      ],
      collisions: new Map(),
      summary: { rename: 1 }
    };

    const result = await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    expect(result.injectedCount).toBe(1);

    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    expect(content).toContain('initiative: gyre');
    expect(content).toContain('artifact_type: prd');
    expect(content).toContain('schema_version: 1');
    expect(content).toContain('# PRD Gyre');
    expect(content).toContain('Content here.');
  });

  test('preserves existing frontmatter fields (NFR20)', async () => {
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '---\ntitle: My PRD\nstatus: validated\n---\n# PRD\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename'], { cwd: tmpDir, stdio: 'pipe' });

    const { executeInjections } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
      collisions: new Map(), summary: { rename: 1 }
    };

    await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    expect(content).toContain('title: My PRD');
    expect(content).toContain('status: validated');
    expect(content).toContain('initiative: gyre');
  });

  test('logs conflicts but does not overwrite existing differing values', async () => {
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '---\ninitiative: forge\n---\n# PRD\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename'], { cwd: tmpDir, stdio: 'pipe' });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const { executeInjections } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
      collisions: new Map(), summary: { rename: 1 }
    };

    const result = await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    expect(result.conflictCount).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping field "initiative"'));

    // Existing value preserved
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    expect(content).toContain('initiative: forge');
    warnSpy.mockRestore();
  });

  test('content below frontmatter preserved byte-for-byte', async () => {
    const body = '# PRD Gyre\n\nThis has **bold** and `code` and special chars: <>&\n';
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), body);
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename'], { cwd: tmpDir, stdio: 'pipe' });

    const { executeInjections } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
      collisions: new Map(), summary: { rename: 1 }
    };

    await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    // Body should be preserved after frontmatter
    expect(content).toContain(body.trim());
  });

  test('two commits exist after full pipeline', async () => {
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '# PRD\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename artifacts to governance convention'], { cwd: tmpDir, stdio: 'pipe' });

    const { executeInjections } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
      collisions: new Map(), summary: { rename: 1 }
    };

    await executeInjections(manifest, tmpDir, ['planning-artifacts']);

    // Check two migration commits
    const log = exec('git', ['log', '--oneline'], { cwd: tmpDir, encoding: 'utf8', stdio: 'pipe' }).trim();
    const commits = log.split('\n');
    expect(commits.length).toBeGreaterThanOrEqual(3); // initial + rename + inject
    expect(log).toContain('chore: rename artifacts to governance convention');
    expect(log).toContain('chore: inject frontmatter metadata and update links');
  });

  test('injects frontmatter into metadata-only file (no body below ---)', async () => {
    // A file whose entire content is frontmatter with no body
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '---\ntitle: PRD\n---\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename'], { cwd: tmpDir, stdio: 'pipe' });

    const { executeInjections } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
      collisions: new Map(), summary: { rename: 1 }
    };

    await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    expect(content).toContain('initiative: gyre');
    expect(content).toContain('title: PRD'); // existing field preserved
  });

  test('rollback on write failure discards injections, preserves commit 1', async () => {
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '# PRD\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename'], { cwd: tmpDir, stdio: 'pipe' });

    // Make the file read-only to cause write failure
    fs.chmodSync(path.join(outputDir, 'gyre-prd.md'), 0o444);

    const { executeInjections, ArtifactMigrationError } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
      collisions: new Map(), summary: { rename: 1 }
    };

    await expect(executeInjections(manifest, tmpDir, ['planning-artifacts'])).rejects.toThrow(ArtifactMigrationError);

    // Restore permissions for cleanup
    fs.chmodSync(path.join(outputDir, 'gyre-prd.md'), 0o644);

    // Verify commit 1 (rename) still exists
    const log = exec('git', ['log', '--oneline'], { cwd: tmpDir, encoding: 'utf8', stdio: 'pipe' }).trim();
    expect(log).toContain('chore: rename');
    // File should NOT have frontmatter (rollback discarded injection)
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    expect(content).not.toContain('initiative:');
  });
});

// --- resolveAmbiguous tests ---

describe('resolveAmbiguous', () => {
  let resolveAmbiguous;
  let mockPromptFn;

  beforeAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    resolveAmbiguous = require('../../scripts/lib/artifact-utils').resolveAmbiguous;
  });

  beforeEach(() => {
    mockPromptFn = jest.fn();
  });

  const makeTaxonomy = () => ({
    initiatives: { platform: ['gyre', 'forge', 'helm'], user: [] },
    artifact_types: ['prd', 'epic', 'arch'],
    aliases: {}
  });

  const makeManifest = (entries) => ({
    entries,
    collisions: new Map(),
    summary: {
      total: entries.length,
      rename: entries.filter(e => e.action === 'RENAME').length,
      skip: entries.filter(e => e.action === 'SKIP').length,
      ambiguous: entries.filter(e => e.action === 'AMBIGUOUS').length,
      conflict: 0, inject: 0
    }
  });

  test('operator selects candidate -> entry updated to RENAME', async () => {
    mockPromptFn.mockResolvedValue('gyre');
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre', 'forge'], initiative: null, newPath: null }
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    expect(result.resolved).toBe(1);
    expect(manifest.entries[0].action).toBe('RENAME');
    expect(manifest.entries[0].initiative).toBe('gyre');
    expect(manifest.entries[0].newPath).toContain('gyre-prd');
    expect(manifest.entries[0].source).toBe('operator');
  });

  test('operator types skip -> entry marked SKIP', async () => {
    mockPromptFn.mockResolvedValue('skip');
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null }
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    expect(result.skipped).toBe(1);
    expect(manifest.entries[0].action).toBe('SKIP');
  });

  test('no ambiguous entries -> returns manifest unchanged', async () => {
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md' }
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    expect(result.resolved).toBe(0);
    expect(result.skipped).toBe(0);
    expect(mockPromptFn).not.toHaveBeenCalled();
  });

  test('--force mode -> all ambiguous auto-skipped', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'a.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
      { action: 'AMBIGUOUS', oldPath: 'b.md', dir: 'planning-artifacts', artifactType: 'epic', candidates: ['forge'], initiative: null, newPath: null }
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { force: true, promptFn: mockPromptFn });
    expect(result.skipped).toBe(2);
    expect(result.resolved).toBe(0);
    expect(mockPromptFn).not.toHaveBeenCalled();
  });

  test('non-resolvable entry (no type, no candidates) -> auto-skipped', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/backlog.md', dir: 'planning-artifacts', artifactType: null, candidates: [], initiative: null, newPath: null }
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    expect(result.skipped).toBe(1);
    expect(mockPromptFn).not.toHaveBeenCalled();
  });

  test('summary counts updated after resolution', async () => {
    mockPromptFn.mockResolvedValue('gyre');
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md' }
    ]);

    await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    expect(manifest.summary.rename).toBe(2);
    expect(manifest.summary.ambiguous).toBe(0);
  });

  // --- Story 6.4: resolutionMap option tests ---

  test('resolutionMap rename → entry becomes RENAME with source operator', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre', 'forge'], initiative: null, newPath: null }
    ]);
    const resolutionMap = {
      'planning-artifacts/prd.md': { action: 'rename', initiative: 'forge' }
    };

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      promptFn: mockPromptFn,
      resolutionMap
    });

    expect(result.resolved).toBe(1);
    expect(result.skipped).toBe(0);
    expect(manifest.entries[0].action).toBe('RENAME');
    expect(manifest.entries[0].initiative).toBe('forge');
    expect(manifest.entries[0].source).toBe('operator');
    expect(manifest.entries[0].confidence).toBe('high');
    expect(manifest.entries[0].newPath).toContain('forge-prd');
    // Prompt MUST NOT have been invoked — resolution map takes precedence
    expect(mockPromptFn).not.toHaveBeenCalled();
  });

  test('resolutionMap skip → entry becomes SKIP with source operator', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null }
    ]);
    const resolutionMap = {
      'planning-artifacts/prd.md': { action: 'skip' }
    };

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      promptFn: mockPromptFn,
      resolutionMap
    });

    expect(result.skipped).toBe(1);
    expect(manifest.entries[0].action).toBe('SKIP');
    expect(manifest.entries[0].source).toBe('operator');
    expect(mockPromptFn).not.toHaveBeenCalled();
  });

  test('resolutionMap takes precedence over --force', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null }
    ]);
    const resolutionMap = {
      'planning-artifacts/prd.md': { action: 'rename', initiative: 'gyre' }
    };

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      force: true,
      promptFn: mockPromptFn,
      resolutionMap
    });

    // --force would have skipped this; resolution map renames it instead
    expect(result.resolved).toBe(1);
    expect(result.skipped).toBe(0);
    expect(manifest.entries[0].action).toBe('RENAME');
  });

  test('resolutionMap entry not present → falls through to existing logic', async () => {
    mockPromptFn.mockResolvedValue('gyre');
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null }
    ]);
    const resolutionMap = {
      'planning-artifacts/other.md': { action: 'skip' }  // Not a match for prd.md
    };

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      promptFn: mockPromptFn,
      resolutionMap
    });

    // Falls through to interactive prompt
    expect(mockPromptFn).toHaveBeenCalledTimes(1);
    expect(result.resolved).toBe(1);
    expect(manifest.entries[0].action).toBe('RENAME');
  });

  test('resolutionMap rename for entry with no artifactType → falls back to synthetic note type', async () => {
    // Taxonomy MUST declare 'note' as a valid artifact_type for the synthetic fallback to fire.
    const taxonomy = {
      initiatives: { platform: ['gyre', 'forge', 'helm'], user: [] },
      artifact_types: ['prd', 'epic', 'arch', 'note'],
      aliases: {}
    };
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/random-thoughts.md', dir: 'planning-artifacts', artifactType: null, candidates: [], initiative: null, newPath: null }
    ]);
    const resolutionMap = {
      'planning-artifacts/random-thoughts.md': { action: 'rename', initiative: 'gyre' }
    };

    const result = await resolveAmbiguous(manifest, taxonomy, '/fake', {
      promptFn: mockPromptFn,
      resolutionMap
    });

    // Without resolution map, this would auto-skip (no candidates).
    // With resolution map, we honor the override and use a synthetic 'note' type.
    expect(result.resolved).toBe(1);
    expect(result.skipped).toBe(0);
    expect(manifest.entries[0].action).toBe('RENAME');
    expect(manifest.entries[0].artifactType).toBe('note');
    expect(manifest.entries[0].newPath).toContain('gyre-note');
  });

  test('synthetic note fallback NOT applied when taxonomy lacks note type → entry stays AMBIGUOUS', async () => {
    // Default test taxonomy does NOT include 'note' in artifact_types.
    const taxonomy = makeTaxonomy(); // artifact_types: ['prd', 'epic', 'arch']
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/random-thoughts.md', dir: 'planning-artifacts', artifactType: null, candidates: [], initiative: null, newPath: null }
    ]);
    const resolutionMap = {
      'planning-artifacts/random-thoughts.md': { action: 'rename', initiative: 'gyre' }
    };

    // Suppress the warning console output during this test
    const origWarn = console.warn;
    console.warn = () => {};
    try {
      await resolveAmbiguous(manifest, taxonomy, '/fake', {
        promptFn: mockPromptFn,
        resolutionMap
      });
    } finally {
      console.warn = origWarn;
    }

    // Without 'note' in the taxonomy, the rename can't happen — entry falls through
    // to no-candidates auto-skip (since candidates is empty).
    expect(manifest.entries[0].action).toBe('SKIP');
  });

  test('resolutionMap rename derives entry.dir from oldPath when dir is missing', async () => {
    const taxonomy = {
      initiatives: { platform: ['gyre'], user: [] },
      artifact_types: ['prd'],
      aliases: {}
    };
    const manifest = makeManifest([
      // Synthetic entry with no `dir` field set — exercises the safety net
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/foo.md', artifactType: 'prd', candidates: [], initiative: null, newPath: null }
    ]);
    const resolutionMap = {
      'planning-artifacts/foo.md': { action: 'rename', initiative: 'gyre' }
    };

    const result = await resolveAmbiguous(manifest, taxonomy, '/fake', {
      promptFn: mockPromptFn,
      resolutionMap
    });

    expect(result.resolved).toBe(1);
    expect(manifest.entries[0].action).toBe('RENAME');
    // Critical assertion: newPath must NOT start with 'undefined/'
    expect(manifest.entries[0].newPath).not.toMatch(/^undefined\//);
    expect(manifest.entries[0].newPath).toMatch(/^planning-artifacts\//);
  });

  test('resolutionMap with unknown action throws (no silent fall-through)', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'a.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null }
    ]);
    // Build a malformed map directly (bypassing loadResolutionMap which would catch this)
    const resolutionMap = { 'a.md': { action: 'delete' } };

    await expect(resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      promptFn: mockPromptFn,
      resolutionMap
    })).rejects.toThrow(/unknown action 'delete'/);
  });
});

// --- Story 6.4: loadResolutionMap tests ---

describe('loadResolutionMap', () => {
  let loadResolutionMap;
  let tmpDir;

  const makeTaxonomy = () => ({
    initiatives: { platform: ['gyre', 'forge', 'helm'], user: [] },
    artifact_types: ['prd', 'epic'],
    aliases: {}
  });

  beforeAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    loadResolutionMap = require('../../scripts/lib/artifact-utils').loadResolutionMap;
  });

  beforeEach(() => {
    const fs = require('fs-extra');
    const os = require('os');
    const path = require('path');
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolution-map-'));
  });

  afterEach(() => {
    const fs = require('fs-extra');
    if (tmpDir) fs.removeSync(tmpDir);
  });

  function writeFile(name, content) {
    const fs = require('fs-extra');
    const path = require('path');
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  test('valid file → returns the resolutions object', () => {
    const filePath = writeFile('valid.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: {
        'planning-artifacts/foo.md': { action: 'rename', initiative: 'gyre' },
        'planning-artifacts/bar.md': { action: 'skip' }
      }
    }));

    const result = loadResolutionMap(filePath, makeTaxonomy());
    expect(result['planning-artifacts/foo.md']).toEqual({ action: 'rename', initiative: 'gyre' });
    expect(result['planning-artifacts/bar.md']).toEqual({ action: 'skip' });
  });

  test('file not found → throws with clear message', () => {
    const path = require('path');
    expect(() => loadResolutionMap(path.join(tmpDir, 'missing.json'), makeTaxonomy()))
      .toThrow(/Resolution file not found/);
  });

  test('invalid JSON → throws with clear message', () => {
    const filePath = writeFile('bad.json', '{ not valid json');
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/Invalid JSON in resolution file/);
  });

  test('missing schemaVersion → throws', () => {
    const filePath = writeFile('no-version.json', JSON.stringify({
      resolutions: { 'a.md': { action: 'skip' } }
    }));
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/Unsupported schemaVersion/);
  });

  test('wrong schemaVersion → throws', () => {
    const filePath = writeFile('wrong-version.json', JSON.stringify({
      schemaVersion: 2,
      resolutions: {}
    }));
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/Unsupported schemaVersion 2/);
  });

  test('missing resolutions object → throws', () => {
    const filePath = writeFile('no-resolutions.json', JSON.stringify({ schemaVersion: 1 }));
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/missing required 'resolutions' object/);
  });

  test('invalid action → throws with the bad action and oldPath', () => {
    const filePath = writeFile('bad-action.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'foo.md': { action: 'delete' } }
    }));
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/Invalid action 'delete' for foo\.md/);
  });

  test('rename without initiative → throws', () => {
    const filePath = writeFile('no-init.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'foo.md': { action: 'rename' } }
    }));
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/has action='rename' but no initiative/);
  });

  test('unknown initiative → throws with the bad initiative name', () => {
    const filePath = writeFile('bad-init.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'foo.md': { action: 'rename', initiative: 'mystery' } }
    }));
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/Unknown initiative 'mystery' for foo\.md/);
  });

  test('user-section initiative is accepted', () => {
    const taxonomy = {
      initiatives: { platform: ['gyre'], user: ['custom'] },
      artifact_types: [],
      aliases: {}
    };
    const filePath = writeFile('user-init.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'foo.md': { action: 'rename', initiative: 'custom' } }
    }));
    const result = loadResolutionMap(filePath, taxonomy);
    expect(result['foo.md'].initiative).toBe('custom');
  });

  test('__proto__ key is rejected (prototype pollution guard)', () => {
    // Write raw JSON because JS literal `{ '__proto__': ... }` invokes the prototype setter
    // and would never produce a real own __proto__ property.
    const filePath = writeFile('proto.json', '{"schemaVersion":1,"resolutions":{"__proto__":{"action":"skip"}}}');
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/Unsafe resolution key '__proto__'/);
  });

  test('constructor key is rejected', () => {
    const filePath = writeFile('ctor.json', '{"schemaVersion":1,"resolutions":{"constructor":{"action":"skip"}}}');
    expect(() => loadResolutionMap(filePath, makeTaxonomy()))
      .toThrow(/Unsafe resolution key 'constructor'/);
  });

  test('returned map has null prototype (defense in depth)', () => {
    const filePath = writeFile('proto-check.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'a.md': { action: 'skip' } }
    }));
    const result = loadResolutionMap(filePath, makeTaxonomy());
    // The returned map is built via Object.create(null), so it has no prototype
    expect(Object.getPrototypeOf(result)).toBeNull();
  });
});

// --- generateRenameMap tests ---

describe('generateRenameMap', () => {
  let generateRenameMap;

  beforeAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    generateRenameMap = require('../../scripts/lib/artifact-utils').generateRenameMap;
  });

  test('produces markdown table with correct old/new paths', () => {
    const entries = [
      { oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md' },
      { oldPath: 'vortex-artifacts/epic-forge.md', newPath: 'vortex-artifacts/forge-epic.md' }
    ];
    const md = generateRenameMap(entries);
    expect(md).toContain('# Artifact Rename Map');
    expect(md).toContain('Total renamed:** 2');
    expect(md).toContain('| planning-artifacts/prd-gyre.md | planning-artifacts/gyre-prd.md |');
    expect(md).toContain('| vortex-artifacts/epic-forge.md | vortex-artifacts/forge-epic.md |');
  });

  test('empty entries -> table with header only', () => {
    const md = generateRenameMap([]);
    expect(md).toContain('# Artifact Rename Map');
    expect(md).toContain('Total renamed:** 0');
    expect(md).toContain('| Old Path | New Path |');
  });
});

// --- detectMigrationState tests ---

describe('detectMigrationState', () => {
  let mockExecFileSync;
  let detectMigrationState;

  beforeEach(() => {
    jest.resetModules();
    const cp = require('child_process');
    mockExecFileSync = jest.spyOn(cp, 'execFileSync');
    detectMigrationState = require('../../scripts/lib/artifact-utils').detectMigrationState;
  });

  afterEach(() => {
    mockExecFileSync.mockRestore();
  });

  test('recent commit is inject message -> returns complete', () => {
    mockExecFileSync.mockReturnValue('chore: inject frontmatter metadata and update links\n');
    expect(detectMigrationState('/fake')).toBe('complete');
  });

  test('recent commit is rename message -> returns renames-done', () => {
    mockExecFileSync.mockReturnValue('chore: rename artifacts to governance convention\n');
    expect(detectMigrationState('/fake')).toBe('renames-done');
  });

  test('no migration commits in recent history -> returns fresh', () => {
    mockExecFileSync.mockReturnValue('feat: add new feature\nfix: bug fix\n');
    expect(detectMigrationState('/fake')).toBe('fresh');
  });

  test('rename message found after intervening commit -> returns renames-done', () => {
    mockExecFileSync.mockReturnValue('fix: hotfix\nchore: rename artifacts to governance convention\n');
    expect(detectMigrationState('/fake')).toBe('renames-done');
  });

  test('ADR commit message also returns complete', () => {
    mockExecFileSync.mockReturnValue('chore: generate governance convention ADR\n');
    expect(detectMigrationState('/fake')).toBe('complete');
  });

  test('git log fails (not a repo) -> returns fresh', () => {
    mockExecFileSync.mockImplementation(() => { throw new Error('not a git repo'); });
    expect(detectMigrationState('/fake')).toBe('fresh');
  });
});

// --- generateGovernanceADR tests ---

describe('generateGovernanceADR', () => {
  let generateGovernanceADR;

  beforeAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    generateGovernanceADR = require('../../scripts/lib/artifact-utils').generateGovernanceADR;
  });

  test('returns markdown string with correct structure', () => {
    const md = generateGovernanceADR('2026-04-06', {
      renamedCount: 42, injectedCount: 42, linksUpdated: 15, scopeDirs: ['planning-artifacts', 'vortex-artifacts']
    });
    expect(md).toContain('# Architecture Decision Record: Artifact Governance Convention');
    expect(md).toContain('**Status:** ACCEPTED');
    expect(md).toContain('**Date:** 2026-04-06');
    expect(md).toContain('**Supersedes:** adr-repo-organization-conventions-2026-03-22.md');
  });

  test('contains naming convention section', () => {
    const md = generateGovernanceADR('2026-04-06');
    expect(md).toContain('{initiative}-{artifact_type}');
    expect(md).toContain('## Decision');
  });

  test('contains taxonomy structure', () => {
    const md = generateGovernanceADR('2026-04-06');
    expect(md).toContain('## Taxonomy');
    expect(md).toContain('vortex, gyre, bmm, forge, helm, enhance, loom, convoke');
  });

  test('contains frontmatter schema v1', () => {
    const md = generateGovernanceADR('2026-04-06');
    expect(md).toContain('## Frontmatter Schema v1');
    expect(md).toContain('schema_version: 1');
  });

  test('includes migration stats', () => {
    const md = generateGovernanceADR('2026-04-06', {
      renamedCount: 42, injectedCount: 42, linksUpdated: 15,
      scopeDirs: ['planning-artifacts', 'vortex-artifacts']
    });
    expect(md).toContain('Files renamed:** 42');
    expect(md).toContain('Frontmatter injected:** 42');
    expect(md).toContain('Links updated:** 15');
    expect(md).toContain('planning-artifacts, vortex-artifacts');
  });

  test('defaults stats gracefully when not provided', () => {
    const md = generateGovernanceADR('2026-04-06');
    expect(md).toContain('Files renamed:** 0');
  });
});

// --- supersedePreviousADR tests ---

describe('supersedePreviousADR', () => {
  let tmpDir;
  let supersedePreviousADR;

  beforeAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    supersedePreviousADR = require('../../scripts/lib/artifact-utils').supersedePreviousADR;
  });

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-adr-'));
    const adrDir = path.join(tmpDir, '_bmad-output', 'planning-artifacts');
    await fs.ensureDir(adrDir);

    // Create the old ADR with the expected format
    const oldADR = [
      '# Architecture Decision Record: Repository Organization Conventions',
      '',
      '**Status:** ACCEPTED',
      '**Date:** 2026-03-22',
      '**Decision Makers:** Amalik (project lead), Winston (architect)',
      '**Supersedes:** N/A (first formal repo organization standard)',
      '',
      '---',
      '',
      '## Context',
      'Content here.'
    ].join('\n');
    await fs.writeFile(path.join(adrDir, 'adr-repo-organization-conventions-2026-03-22.md'), oldADR);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  test('updates status from ACCEPTED to SUPERSEDED', () => {
    supersedePreviousADR(tmpDir, 'adr-artifact-governance-convention-2026-04-06.md');
    const content = fs.readFileSync(
      path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'adr-repo-organization-conventions-2026-03-22.md'), 'utf8'
    );
    expect(content).toContain('**Status:** SUPERSEDED');
    expect(content).not.toContain('**Status:** ACCEPTED');
  });

  test('adds Superseded-by line with new ADR filename', () => {
    supersedePreviousADR(tmpDir, 'adr-artifact-governance-convention-2026-04-06.md');
    const content = fs.readFileSync(
      path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'adr-repo-organization-conventions-2026-03-22.md'), 'utf8'
    );
    expect(content).toContain('**Superseded by:** adr-artifact-governance-convention-2026-04-06.md');
    // Original Supersedes line preserved
    expect(content).toContain('**Supersedes:** N/A (first formal repo organization standard)');
  });

  test('non-existent old ADR logs warning, does not throw', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const emptyDir = path.join(tmpDir, 'empty-project');
    fs.ensureDirSync(emptyDir);

    const result = supersedePreviousADR(emptyDir, 'adr-artifact-governance-convention-2026-04-06.md');
    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Previous ADR not found'));
    warnSpy.mockRestore();
  });
});
