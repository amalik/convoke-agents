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

  test('git log fails (not a repo) -> returns fresh', () => {
    mockExecFileSync.mockImplementation(() => { throw new Error('not a git repo'); });
    expect(detectMigrationState('/fake')).toBe('fresh');
  });
});
