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
