'use strict';

const { describe, it, before, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

const { mockExecFileSync } = require('../mock-cp');

const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// --- Unit tests (mocked git) ---

describe('ArtifactMigrationError', () => {
  let ArtifactMigrationError;

  before(() => {
    ArtifactMigrationError = require('../../scripts/lib/artifact-utils').ArtifactMigrationError;
  });

  it('has correct name property', () => {
    const err = new ArtifactMigrationError('test', { phase: 'rename' });
    assert.equal(err.name, 'ArtifactMigrationError');
  });

  it('has file, phase, recoverable properties', () => {
    const err = new ArtifactMigrationError('fail', { file: 'a.md', phase: 'rename', recoverable: true });
    assert.equal(err.file, 'a.md');
    assert.equal(err.phase, 'rename');
    assert.equal(err.recoverable, true);
    assert.equal(err.message, 'fail');
  });

  it('extends Error', () => {
    const err = new ArtifactMigrationError('test', { phase: 'inject' });
    assert.ok(err instanceof Error);
  });

  it('defaults recoverable to true', () => {
    const err = new ArtifactMigrationError('test', { phase: 'rename' });
    assert.equal(err.recoverable, true);
  });
});

describe('executeRenames (mocked)', () => {
  let cpMock;

  beforeEach(() => {
    cpMock = mockExecFileSync('../../scripts/lib/artifact-utils', __dirname);
  });

  afterEach(() => {
    cpMock?.restore();
  });

  const makeManifest = (entries) => ({
    entries,
    collisions: new Map(),
    summary: { total: entries.length, rename: entries.filter((e) => e.action === 'RENAME').length },
  });

  it('all renames succeed -> commit created, returns count + sha', () => {
    cpMock.setImpl((_cmd, args) => {
      if (args && args[0] === 'rev-parse') return 'abc123\n';
      return '';
    });

    const { executeRenames } = cpMock.module;
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'planning-artifacts/old.md', newPath: 'planning-artifacts/new.md', collisionWith: null },
      { action: 'RENAME', oldPath: 'planning-artifacts/old2.md', newPath: 'planning-artifacts/new2.md', collisionWith: null },
    ]);

    const result = executeRenames(manifest, '/fake/root');
    assert.equal(result.renamedCount, 2);
    assert.equal(result.commitSha, 'abc123');
  });

  it('one git mv fails -> rollback called, ArtifactMigrationError thrown', () => {
    let mvCount = 0;
    cpMock.setImpl((_cmd, args) => {
      if (args && args[0] === 'mv') {
        mvCount++;
        if (mvCount === 2) throw new Error('git mv failed');
      }
      return '';
    });

    const { executeRenames, ArtifactMigrationError } = cpMock.module;
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md', collisionWith: null },
      { action: 'RENAME', oldPath: 'b.md', newPath: 'y.md', collisionWith: null },
    ]);

    assert.throws(() => executeRenames(manifest, '/fake/root'), ArtifactMigrationError);

    // Verify rollback was called
    const resetCalls = cpMock.callsMatching((args) => args[0] === 'reset' && args[1] === '--hard');
    assert.equal(resetCalls.length, 1);
  });

  it('git commit fails after all git mv succeed -> rollback called, ArtifactMigrationError thrown', () => {
    cpMock.setImpl((_cmd, args) => {
      if (args && args[0] === 'commit') throw new Error('pre-commit hook rejected');
      return '';
    });

    const { executeRenames, ArtifactMigrationError } = cpMock.module;
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md', collisionWith: null },
    ]);

    assert.throws(() => executeRenames(manifest, '/fake/root'), ArtifactMigrationError);
    assert.throws(() => executeRenames(manifest, '/fake/root'), /git commit failed/);

    // Verify rollback was called
    const resetCalls = cpMock.callsMatching((args) => args[0] === 'reset' && args[1] === '--hard');
    assert.ok(resetCalls.length >= 1);
  });

  it('only RENAME entries processed (SKIP, INJECT, AMBIGUOUS, CONFLICT ignored)', () => {
    cpMock.setImpl((_cmd, args) => {
      if (args && args[0] === 'rev-parse') return 'sha1\n';
      return '';
    });

    const { executeRenames } = cpMock.module;
    const manifest = makeManifest([
      { action: 'SKIP', oldPath: 'skip.md', newPath: null, collisionWith: null },
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md', collisionWith: null },
      { action: 'AMBIGUOUS', oldPath: 'amb.md', newPath: null, collisionWith: null },
      { action: 'CONFLICT', oldPath: 'con.md', newPath: null, collisionWith: null },
      { action: 'INJECT_ONLY', oldPath: 'inj.md', newPath: null, collisionWith: null },
    ]);

    const result = executeRenames(manifest, '/fake/root');
    assert.equal(result.renamedCount, 1);

    // Verify only 1 git mv was called (not 5)
    const mvCalls = cpMock.callsMatching((args) => args[0] === 'mv');
    assert.equal(mvCalls.length, 1);
  });

  it('empty rename list -> no git operations, returns count 0', () => {
    const { executeRenames } = cpMock.module;
    const manifest = makeManifest([
      { action: 'SKIP', oldPath: 'a.md', newPath: null, collisionWith: null },
    ]);

    const result = executeRenames(manifest, '/fake/root');
    assert.equal(result.renamedCount, 0);
    assert.equal(result.commitSha, null);
    assert.equal(cpMock.callCount(), 0);
  });

  it('RENAME entries with collisions -> throws before any git mv', () => {
    const { executeRenames } = cpMock.module;
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'target.md', collisionWith: ['b.md'] },
      { action: 'RENAME', oldPath: 'b.md', newPath: 'target.md', collisionWith: ['a.md'] },
    ]);

    assert.throws(() => executeRenames(manifest, '/fake/root'), /collision/i);
    assert.equal(cpMock.callCount(), 0);
  });
});

describe('verifyHistoryChain (mocked)', () => {
  let cpMock;

  beforeEach(() => {
    cpMock = mockExecFileSync('../../scripts/lib/artifact-utils', __dirname);
  });

  afterEach(() => {
    cpMock?.restore();
  });

  it('samples up to 5 entries', () => {
    cpMock.setReturnValue('abc Commit 1\ndef Commit 2\n');
    const { verifyHistoryChain } = cpMock.module;
    const entries = Array.from({ length: 10 }, (_, i) => ({
      action: 'RENAME', newPath: `planning-artifacts/file${i}.md`,
    }));

    const result = verifyHistoryChain(entries, '/fake/root');
    assert.equal(result.verified, 5);

    // Only 5 git log calls
    const logCalls = cpMock.callsMatching((args) => args[0] === 'log');
    assert.equal(logCalls.length, 5);
  });

  it('returns verified count for files with history', () => {
    cpMock.setReturnValue('abc Commit 1\ndef Commit 2\nghi Commit 3\n');
    const { verifyHistoryChain } = cpMock.module;
    const entries = [{ action: 'RENAME', newPath: 'planning-artifacts/file.md' }];

    const result = verifyHistoryChain(entries, '/fake/root');
    assert.equal(result.verified, 1);
    assert.deepEqual(result.failed, []);
  });

  it('reports failures for files without history chain', () => {
    cpMock.setReturnValue('abc Single commit\n');
    const { verifyHistoryChain } = cpMock.module;
    const entries = [{ action: 'RENAME', newPath: 'planning-artifacts/file.md' }];

    const result = verifyHistoryChain(entries, '/fake/root');
    assert.equal(result.verified, 0);
    assert.deepEqual(result.failed, ['planning-artifacts/file.md']);
  });

  it('handles git log failure gracefully', () => {
    cpMock.setImpl(() => { throw new Error('not a git repo'); });
    const { verifyHistoryChain } = cpMock.module;
    const entries = [{ action: 'RENAME', newPath: 'planning-artifacts/file.md' }];

    const result = verifyHistoryChain(entries, '/fake/root');
    assert.equal(result.verified, 0);
    assert.equal(result.failed.length, 1);
  });
});

// --- Integration tests (real temp git repo) ---
//
// These describe blocks use REAL child_process and REAL fs operations against
// temp git repos. They do NOT use mock-cp; the helper's per-spy restoration in
// the previous describe blocks' afterEach hooks ensures the cp module is in
// its real state by the time these blocks run.

describe('executeRenames integration', () => {
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

  it('renames files on disk and creates git commit', () => {
    const { executeRenames } = require('../../scripts/lib/artifact-utils');

    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', collisionWith: null },
        { action: 'RENAME', oldPath: 'planning-artifacts/epic-forge-phase-a.md', newPath: 'planning-artifacts/forge-epic-phase-a.md', collisionWith: null },
      ],
      collisions: new Map(),
      summary: { rename: 2 },
    };

    const result = executeRenames(manifest, tmpDir);
    assert.equal(result.renamedCount, 2);
    assert.ok(result.commitSha);
    assert.match(result.commitSha, /^[a-f0-9]+$/);

    // Verify files exist at new paths
    assert.equal(fs.existsSync(path.join(outputDir, 'gyre-prd.md')), true);
    assert.equal(fs.existsSync(path.join(outputDir, 'forge-epic-phase-a.md')), true);

    // Verify old paths gone
    assert.equal(fs.existsSync(path.join(outputDir, 'prd-gyre.md')), false);
    assert.equal(fs.existsSync(path.join(outputDir, 'epic-forge-phase-a.md')), false);

    // Verify commit message
    const { execFileSync: exec } = require('child_process');
    const log = exec('git', ['log', '--oneline', '-1'], { cwd: tmpDir, encoding: 'utf8', stdio: 'pipe' });
    assert.ok(log.includes('chore: rename artifacts to governance convention'));
  });

  it('git log --follow works on renamed files', () => {
    const { executeRenames, verifyHistoryChain } = require('../../scripts/lib/artifact-utils');

    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', collisionWith: null },
      ],
      collisions: new Map(),
      summary: { rename: 1 },
    };

    executeRenames(manifest, tmpDir);

    const result = verifyHistoryChain(manifest.entries, tmpDir);
    assert.equal(result.verified, 1);
    assert.deepEqual(result.failed, []);
  });

  it('rollback restores original state on git mv failure', () => {
    // Create a scenario where git mv fails: rename to a path that can't exist
    const { executeRenames, ArtifactMigrationError } = require('../../scripts/lib/artifact-utils');

    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', collisionWith: null },
        // This will fail — target dir doesn't exist
        { action: 'RENAME', oldPath: 'planning-artifacts/epic-forge-phase-a.md', newPath: 'nonexistent-dir/forge-epic.md', collisionWith: null },
      ],
      collisions: new Map(),
      summary: { rename: 2 },
    };

    assert.throws(() => executeRenames(manifest, tmpDir), ArtifactMigrationError);

    // Verify rollback: original files should be restored
    assert.equal(fs.existsSync(path.join(outputDir, 'prd-gyre.md')), true);
    assert.equal(fs.existsSync(path.join(outputDir, 'epic-forge-phase-a.md')), true);
  });

  it('performance: rename phase under 60 seconds for test files', { timeout: 90000 }, () => {
    const { executeRenames } = require('../../scripts/lib/artifact-utils');

    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', collisionWith: null },
        { action: 'RENAME', oldPath: 'planning-artifacts/brief-gyre-2026-03-19.md', newPath: 'planning-artifacts/gyre-brief-2026-03-19.md', collisionWith: null },
      ],
      collisions: new Map(),
      summary: { rename: 2 },
    };

    const start = Date.now();
    executeRenames(manifest, tmpDir);
    const duration = Date.now() - start;
    assert.ok(duration < 60000, `executeRenames took ${duration}ms; budget is 60000ms`);
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

  it('[text](old.md) -> [text](new.md) direct pattern', async () => {
    await fs.writeFile(path.join(outputDir, 'referrer.md'), 'See [PRD](prd-gyre.md) for details.\n');
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    const result = await updateLinks(map, ['planning-artifacts'], tmpDir);
    assert.equal(result.updatedFiles, 1);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    assert.ok(content.includes('[PRD](gyre-prd.md)'));
    assert.ok(!content.includes('](prd-gyre.md)'));
  });

  it('[text](./old.md) -> [text](./new.md) dot-slash pattern', async () => {
    await fs.writeFile(path.join(outputDir, 'referrer.md'), 'See [PRD](./prd-gyre.md) here.\n');
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    assert.ok(content.includes('[PRD](./gyre-prd.md)'));
  });

  it('[text](../dir/old.md) -> [text](../dir/new.md) parent-dir pattern', async () => {
    await fs.writeFile(path.join(outputDir, 'referrer.md'), 'See [Epic](../vortex-artifacts/epic-forge.md) here.\n');
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['epic-forge.md', 'forge-epic.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    assert.ok(content.includes('[Epic](../vortex-artifacts/forge-epic.md)'));
  });

  it('[text](old.md#section) -> [text](new.md#section) anchor preserved', async () => {
    await fs.writeFile(path.join(outputDir, 'referrer.md'), 'See [section](prd-gyre.md#overview) here.\n');
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    assert.ok(content.includes('[section](gyre-prd.md#overview)'));
  });

  it('frontmatter inputDocuments array entries updated', async () => {
    const fileContent = '---\ninputDocuments:\n  - prd-gyre.md\n  - architecture.md\n---\n# Content\n';
    await fs.writeFile(path.join(outputDir, 'referrer.md'), fileContent);
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    assert.ok(content.includes('gyre-prd.md'));
    assert.doesNotMatch(content, /inputDocuments:[\s\S]*prd-gyre\.md/);
  });

  it('files with no matching links are NOT rewritten', async () => {
    const original = '# No links here\nJust text.\n';
    await fs.writeFile(path.join(outputDir, 'nolinks.md'), original);
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    const result = await updateLinks(map, ['planning-artifacts'], tmpDir);
    assert.equal(result.updatedFiles, 0);
    const content = fs.readFileSync(path.join(outputDir, 'nolinks.md'), 'utf8');
    assert.equal(content, original);
  });

  it('files outside _bmad-output/ scope are NOT touched (FR15)', async () => {
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
    assert.equal(content, outsideContent);
  });

  it('inputDocuments substring does NOT corrupt similar filenames', async () => {
    // prd.md should NOT match inside report-prd.md
    const fileContent = '---\ninputDocuments:\n  - report-prd-gyre.md\n  - prd-gyre.md\n---\n# Content\n';
    await fs.writeFile(path.join(outputDir, 'referrer.md'), fileContent);
    const { updateLinks } = require('../../scripts/lib/artifact-utils');
    const map = new Map([['prd-gyre.md', 'gyre-prd.md']]);
    await updateLinks(map, ['planning-artifacts'], tmpDir);
    const content = fs.readFileSync(path.join(outputDir, 'referrer.md'), 'utf8');
    // prd-gyre.md should be replaced
    assert.ok(content.includes('gyre-prd.md'));
    // report-prd-gyre.md should NOT be corrupted
    assert.ok(content.includes('report-prd-gyre.md'));
    assert.ok(!content.includes('report-gyre-prd.md'));
  });
});

// --- executeInjections tests ---

describe('executeInjections', () => {
  let tmpDir;
  let outputDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-inject-'));
    outputDir = path.join(tmpDir, '_bmad-output', 'planning-artifacts');
    await fs.ensureDir(outputDir);
    await fs.ensureDir(path.join(tmpDir, '_bmad', '_config'));

    // Create taxonomy for readTaxonomy
    const yaml = require('js-yaml');
    const taxonomy = {
      initiatives: { platform: ['gyre', 'forge'], user: [] },
      artifact_types: ['prd', 'epic', 'brief'],
      aliases: {},
    };
    fs.writeFileSync(
      path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml'),
      yaml.dump(taxonomy),
      'utf8',
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

  it('injects frontmatter into file with no existing frontmatter', async () => {
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
        { action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null },
      ],
      collisions: new Map(),
      summary: { rename: 1 },
    };

    const result = await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    assert.equal(result.injectedCount, 1);

    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    assert.ok(content.includes('initiative: gyre'));
    assert.ok(content.includes('artifact_type: prd'));
    assert.ok(content.includes('schema_version: 1'));
    assert.ok(content.includes('# PRD Gyre'));
    assert.ok(content.includes('Content here.'));
  });

  it('preserves existing frontmatter fields (NFR20)', async () => {
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '---\ntitle: My PRD\nstatus: validated\n---\n# PRD\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename'], { cwd: tmpDir, stdio: 'pipe' });

    const { executeInjections } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
      collisions: new Map(), summary: { rename: 1 },
    };

    await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    assert.ok(content.includes('title: My PRD'));
    assert.ok(content.includes('status: validated'));
    assert.ok(content.includes('initiative: gyre'));
  });

  it('logs conflicts but does not overwrite existing differing values', async () => {
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '---\ninitiative: forge\n---\n# PRD\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename'], { cwd: tmpDir, stdio: 'pipe' });

    const warnSpy = mock.method(console, 'warn', () => {});
    try {
      const { executeInjections } = require('../../scripts/lib/artifact-utils');
      const manifest = {
        entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
        collisions: new Map(), summary: { rename: 1 },
      };

      const result = await executeInjections(manifest, tmpDir, ['planning-artifacts']);
      assert.equal(result.conflictCount, 1);

      // Translation of expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(...))
      const matched = warnSpy.mock.calls.some((call) => {
        const firstArg = call.arguments[0];
        return typeof firstArg === 'string' && firstArg.includes('Skipping field "initiative"');
      });
      assert.ok(matched, 'expected console.warn to be called with a string containing "Skipping field \\"initiative\\""');

      // Existing value preserved
      const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
      assert.ok(content.includes('initiative: forge'));
    } finally {
      warnSpy.mock.restore();
    }
  });

  it('content below frontmatter preserved byte-for-byte', async () => {
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
      collisions: new Map(), summary: { rename: 1 },
    };

    await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    // Body should be preserved after frontmatter
    assert.ok(content.includes(body.trim()));
  });

  it('two commits exist after full pipeline', async () => {
    fs.writeFileSync(path.join(outputDir, 'prd-gyre.md'), '# PRD\n');
    const { execFileSync: exec } = require('child_process');
    exec('git', ['add', '-A'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'initial'], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['mv', path.join(outputDir, 'prd-gyre.md'), path.join(outputDir, 'gyre-prd.md')], { cwd: tmpDir, stdio: 'pipe' });
    exec('git', ['commit', '-m', 'chore: rename artifacts to governance convention'], { cwd: tmpDir, stdio: 'pipe' });

    const { executeInjections } = require('../../scripts/lib/artifact-utils');
    const manifest = {
      entries: [{ action: 'RENAME', oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md', initiative: 'gyre', artifactType: 'prd', collisionWith: null }],
      collisions: new Map(), summary: { rename: 1 },
    };

    await executeInjections(manifest, tmpDir, ['planning-artifacts']);

    // Check two migration commits
    const log = exec('git', ['log', '--oneline'], { cwd: tmpDir, encoding: 'utf8', stdio: 'pipe' }).trim();
    const commits = log.split('\n');
    assert.ok(commits.length >= 3); // initial + rename + inject
    assert.ok(log.includes('chore: rename artifacts to governance convention'));
    assert.ok(log.includes('chore: inject frontmatter metadata and update links'));
  });

  it('injects frontmatter into metadata-only file (no body below ---)', async () => {
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
      collisions: new Map(), summary: { rename: 1 },
    };

    await executeInjections(manifest, tmpDir, ['planning-artifacts']);
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    assert.ok(content.includes('initiative: gyre'));
    assert.ok(content.includes('title: PRD')); // existing field preserved
  });

  it('rollback on write failure discards injections, preserves commit 1', async () => {
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
      collisions: new Map(), summary: { rename: 1 },
    };

    // Translation of: await expect(promise).rejects.toThrow(Error)
    await assert.rejects(
      executeInjections(manifest, tmpDir, ['planning-artifacts']),
      ArtifactMigrationError,
    );

    // Restore permissions for cleanup
    fs.chmodSync(path.join(outputDir, 'gyre-prd.md'), 0o644);

    // Verify commit 1 (rename) still exists
    const log = exec('git', ['log', '--oneline'], { cwd: tmpDir, encoding: 'utf8', stdio: 'pipe' }).trim();
    assert.ok(log.includes('chore: rename'));
    // File should NOT have frontmatter (rollback discarded injection)
    const content = fs.readFileSync(path.join(outputDir, 'gyre-prd.md'), 'utf8');
    assert.ok(!content.includes('initiative:'));
  });
});

// --- resolveAmbiguous tests ---

describe('resolveAmbiguous', () => {
  let resolveAmbiguous;
  let mockPromptFn;

  before(() => {
    resolveAmbiguous = require('../../scripts/lib/artifact-utils').resolveAmbiguous;
  });

  beforeEach(() => {
    // Translation of jest.fn() — mock.fn() returns a tracked freestanding function.
    // We pass an explicit default impl that returns undefined; tests override it
    // by reassigning mockPromptFn or by passing a fresh impl on each call.
    mockPromptFn = mock.fn();
  });

  const makeTaxonomy = () => ({
    initiatives: { platform: ['gyre', 'forge', 'helm'], user: [] },
    artifact_types: ['prd', 'epic', 'arch'],
    aliases: {},
  });

  const makeManifest = (entries) => ({
    entries,
    collisions: new Map(),
    summary: {
      total: entries.length,
      rename: entries.filter((e) => e.action === 'RENAME').length,
      skip: entries.filter((e) => e.action === 'SKIP').length,
      ambiguous: entries.filter((e) => e.action === 'AMBIGUOUS').length,
      conflict: 0, inject: 0,
    },
  });

  it('operator selects candidate -> entry updated to RENAME', async () => {
    // Translation of mockPromptFn.mockResolvedValue('gyre'):
    // create a fresh mock.fn() with the resolved-value impl baked in.
    mockPromptFn = mock.fn(async () => 'gyre');
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre', 'forge'], initiative: null, newPath: null },
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    assert.equal(result.resolved, 1);
    assert.equal(manifest.entries[0].action, 'RENAME');
    assert.equal(manifest.entries[0].initiative, 'gyre');
    assert.ok(manifest.entries[0].newPath.includes('gyre-prd'));
    assert.equal(manifest.entries[0].source, 'operator');
  });

  it('operator types skip -> entry marked SKIP', async () => {
    mockPromptFn = mock.fn(async () => 'skip');
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    assert.equal(result.skipped, 1);
    assert.equal(manifest.entries[0].action, 'SKIP');
  });

  it('no ambiguous entries -> returns manifest unchanged', async () => {
    const manifest = makeManifest([
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md' },
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    assert.equal(result.resolved, 0);
    assert.equal(result.skipped, 0);
    assert.equal(mockPromptFn.mock.callCount(), 0);
  });

  it('--force mode -> all ambiguous auto-skipped', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'a.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
      { action: 'AMBIGUOUS', oldPath: 'b.md', dir: 'planning-artifacts', artifactType: 'epic', candidates: ['forge'], initiative: null, newPath: null },
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { force: true, promptFn: mockPromptFn });
    assert.equal(result.skipped, 2);
    assert.equal(result.resolved, 0);
    assert.equal(mockPromptFn.mock.callCount(), 0);
  });

  it('non-resolvable entry (no type, no candidates) -> auto-skipped', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/backlog.md', dir: 'planning-artifacts', artifactType: null, candidates: [], initiative: null, newPath: null },
    ]);

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    assert.equal(result.skipped, 1);
    assert.equal(mockPromptFn.mock.callCount(), 0);
  });

  it('summary counts updated after resolution', async () => {
    mockPromptFn = mock.fn(async () => 'gyre');
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
      { action: 'RENAME', oldPath: 'a.md', newPath: 'x.md' },
    ]);

    await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', { promptFn: mockPromptFn });
    assert.equal(manifest.summary.rename, 2);
    assert.equal(manifest.summary.ambiguous, 0);
  });

  // --- Story 6.4: resolutionMap option tests ---

  it('resolutionMap rename → entry becomes RENAME with source operator', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre', 'forge'], initiative: null, newPath: null },
    ]);
    const resolutionMap = {
      'planning-artifacts/prd.md': { action: 'rename', initiative: 'forge' },
    };

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      promptFn: mockPromptFn,
      resolutionMap,
    });

    assert.equal(result.resolved, 1);
    assert.equal(result.skipped, 0);
    assert.equal(manifest.entries[0].action, 'RENAME');
    assert.equal(manifest.entries[0].initiative, 'forge');
    assert.equal(manifest.entries[0].source, 'operator');
    assert.equal(manifest.entries[0].confidence, 'high');
    assert.ok(manifest.entries[0].newPath.includes('forge-prd'));
    // Prompt MUST NOT have been invoked — resolution map takes precedence
    assert.equal(mockPromptFn.mock.callCount(), 0);
  });

  it('resolutionMap skip → entry becomes SKIP with source operator', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
    ]);
    const resolutionMap = {
      'planning-artifacts/prd.md': { action: 'skip' },
    };

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      promptFn: mockPromptFn,
      resolutionMap,
    });

    assert.equal(result.skipped, 1);
    assert.equal(manifest.entries[0].action, 'SKIP');
    assert.equal(manifest.entries[0].source, 'operator');
    assert.equal(mockPromptFn.mock.callCount(), 0);
  });

  it('resolutionMap takes precedence over --force', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
    ]);
    const resolutionMap = {
      'planning-artifacts/prd.md': { action: 'rename', initiative: 'gyre' },
    };

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      force: true,
      promptFn: mockPromptFn,
      resolutionMap,
    });

    // --force would have skipped this; resolution map renames it instead
    assert.equal(result.resolved, 1);
    assert.equal(result.skipped, 0);
    assert.equal(manifest.entries[0].action, 'RENAME');
  });

  it('resolutionMap entry not present → falls through to existing logic', async () => {
    mockPromptFn = mock.fn(async () => 'gyre');
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/prd.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
    ]);
    const resolutionMap = {
      'planning-artifacts/other.md': { action: 'skip' }, // Not a match for prd.md
    };

    const result = await resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
      promptFn: mockPromptFn,
      resolutionMap,
    });

    // Falls through to interactive prompt
    assert.equal(mockPromptFn.mock.callCount(), 1);
    assert.equal(result.resolved, 1);
    assert.equal(manifest.entries[0].action, 'RENAME');
  });

  it('resolutionMap rename for entry with no artifactType → falls back to synthetic note type', async () => {
    // Taxonomy MUST declare 'note' as a valid artifact_type for the synthetic fallback to fire.
    const taxonomy = {
      initiatives: { platform: ['gyre', 'forge', 'helm'], user: [] },
      artifact_types: ['prd', 'epic', 'arch', 'note'],
      aliases: {},
    };
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/random-thoughts.md', dir: 'planning-artifacts', artifactType: null, candidates: [], initiative: null, newPath: null },
    ]);
    const resolutionMap = {
      'planning-artifacts/random-thoughts.md': { action: 'rename', initiative: 'gyre' },
    };

    const result = await resolveAmbiguous(manifest, taxonomy, '/fake', {
      promptFn: mockPromptFn,
      resolutionMap,
    });

    // Without resolution map, this would auto-skip (no candidates).
    // With resolution map, we honor the override and use a synthetic 'note' type.
    assert.equal(result.resolved, 1);
    assert.equal(result.skipped, 0);
    assert.equal(manifest.entries[0].action, 'RENAME');
    assert.equal(manifest.entries[0].artifactType, 'note');
    assert.ok(manifest.entries[0].newPath.includes('gyre-note'));
  });

  it('synthetic note fallback NOT applied when taxonomy lacks note type → entry stays AMBIGUOUS', async () => {
    // Default test taxonomy does NOT include 'note' in artifact_types.
    const taxonomy = makeTaxonomy(); // artifact_types: ['prd', 'epic', 'arch']
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/random-thoughts.md', dir: 'planning-artifacts', artifactType: null, candidates: [], initiative: null, newPath: null },
    ]);
    const resolutionMap = {
      'planning-artifacts/random-thoughts.md': { action: 'rename', initiative: 'gyre' },
    };

    // Suppress the warning console output during this test
    const origWarn = console.warn;
    console.warn = () => {};
    try {
      await resolveAmbiguous(manifest, taxonomy, '/fake', {
        promptFn: mockPromptFn,
        resolutionMap,
      });
    } finally {
      console.warn = origWarn;
    }

    // Without 'note' in the taxonomy, the rename can't happen — entry falls through
    // to no-candidates auto-skip (since candidates is empty).
    assert.equal(manifest.entries[0].action, 'SKIP');
  });

  it('resolutionMap rename derives entry.dir from oldPath when dir is missing', async () => {
    const taxonomy = {
      initiatives: { platform: ['gyre'], user: [] },
      artifact_types: ['prd'],
      aliases: {},
    };
    const manifest = makeManifest([
      // Synthetic entry with no `dir` field set — exercises the safety net
      { action: 'AMBIGUOUS', oldPath: 'planning-artifacts/foo.md', artifactType: 'prd', candidates: [], initiative: null, newPath: null },
    ]);
    const resolutionMap = {
      'planning-artifacts/foo.md': { action: 'rename', initiative: 'gyre' },
    };

    const result = await resolveAmbiguous(manifest, taxonomy, '/fake', {
      promptFn: mockPromptFn,
      resolutionMap,
    });

    assert.equal(result.resolved, 1);
    assert.equal(manifest.entries[0].action, 'RENAME');
    // Critical assertion: newPath must NOT start with 'undefined/'
    assert.doesNotMatch(manifest.entries[0].newPath, /^undefined\//);
    assert.match(manifest.entries[0].newPath, /^planning-artifacts\//);
  });

  it('resolutionMap with unknown action throws (no silent fall-through)', async () => {
    const manifest = makeManifest([
      { action: 'AMBIGUOUS', oldPath: 'a.md', dir: 'planning-artifacts', artifactType: 'prd', candidates: ['gyre'], initiative: null, newPath: null },
    ]);
    // Build a malformed map directly (bypassing loadResolutionMap which would catch this)
    const resolutionMap = { 'a.md': { action: 'delete' } };

    await assert.rejects(
      resolveAmbiguous(manifest, makeTaxonomy(), '/fake', {
        promptFn: mockPromptFn,
        resolutionMap,
      }),
      /unknown action 'delete'/,
    );
  });
});

// --- Story 6.4: loadResolutionMap tests ---

describe('loadResolutionMap', () => {
  let loadResolutionMap;
  let tmpDir;

  const makeTaxonomy = () => ({
    initiatives: { platform: ['gyre', 'forge', 'helm'], user: [] },
    artifact_types: ['prd', 'epic'],
    aliases: {},
  });

  before(() => {
    loadResolutionMap = require('../../scripts/lib/artifact-utils').loadResolutionMap;
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolution-map-'));
  });

  afterEach(() => {
    if (tmpDir) fs.removeSync(tmpDir);
  });

  function writeFile(name, content) {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  it('valid file → returns the resolutions object', () => {
    const filePath = writeFile('valid.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: {
        'planning-artifacts/foo.md': { action: 'rename', initiative: 'gyre' },
        'planning-artifacts/bar.md': { action: 'skip' },
      },
    }));

    const result = loadResolutionMap(filePath, makeTaxonomy());
    assert.deepEqual(result['planning-artifacts/foo.md'], { action: 'rename', initiative: 'gyre' });
    assert.deepEqual(result['planning-artifacts/bar.md'], { action: 'skip' });
  });

  it('file not found → throws with clear message', () => {
    assert.throws(
      () => loadResolutionMap(path.join(tmpDir, 'missing.json'), makeTaxonomy()),
      /Resolution file not found/,
    );
  });

  it('invalid JSON → throws with clear message', () => {
    const filePath = writeFile('bad.json', '{ not valid json');
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /Invalid JSON in resolution file/,
    );
  });

  it('missing schemaVersion → throws', () => {
    const filePath = writeFile('no-version.json', JSON.stringify({
      resolutions: { 'a.md': { action: 'skip' } },
    }));
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /Unsupported schemaVersion/,
    );
  });

  it('wrong schemaVersion → throws', () => {
    const filePath = writeFile('wrong-version.json', JSON.stringify({
      schemaVersion: 2,
      resolutions: {},
    }));
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /Unsupported schemaVersion 2/,
    );
  });

  it('missing resolutions object → throws', () => {
    const filePath = writeFile('no-resolutions.json', JSON.stringify({ schemaVersion: 1 }));
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /missing required 'resolutions' object/,
    );
  });

  it('invalid action → throws with the bad action and oldPath', () => {
    const filePath = writeFile('bad-action.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'foo.md': { action: 'delete' } },
    }));
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /Invalid action 'delete' for foo\.md/,
    );
  });

  it('rename without initiative → throws', () => {
    const filePath = writeFile('no-init.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'foo.md': { action: 'rename' } },
    }));
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /has action='rename' but no initiative/,
    );
  });

  it('unknown initiative → throws with the bad initiative name', () => {
    const filePath = writeFile('bad-init.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'foo.md': { action: 'rename', initiative: 'mystery' } },
    }));
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /Unknown initiative 'mystery' for foo\.md/,
    );
  });

  it('user-section initiative is accepted', () => {
    const taxonomy = {
      initiatives: { platform: ['gyre'], user: ['custom'] },
      artifact_types: [],
      aliases: {},
    };
    const filePath = writeFile('user-init.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'foo.md': { action: 'rename', initiative: 'custom' } },
    }));
    const result = loadResolutionMap(filePath, taxonomy);
    assert.equal(result['foo.md'].initiative, 'custom');
  });

  it('__proto__ key is rejected (prototype pollution guard)', () => {
    // Write raw JSON because JS literal `{ '__proto__': ... }` invokes the prototype setter
    // and would never produce a real own __proto__ property.
    const filePath = writeFile('proto.json', '{"schemaVersion":1,"resolutions":{"__proto__":{"action":"skip"}}}');
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /Unsafe resolution key '__proto__'/,
    );
  });

  it('constructor key is rejected', () => {
    const filePath = writeFile('ctor.json', '{"schemaVersion":1,"resolutions":{"constructor":{"action":"skip"}}}');
    assert.throws(
      () => loadResolutionMap(filePath, makeTaxonomy()),
      /Unsafe resolution key 'constructor'/,
    );
  });

  it('returned map has null prototype (defense in depth)', () => {
    const filePath = writeFile('proto-check.json', JSON.stringify({
      schemaVersion: 1,
      resolutions: { 'a.md': { action: 'skip' } },
    }));
    const result = loadResolutionMap(filePath, makeTaxonomy());
    // The returned map is built via Object.create(null), so it has no prototype
    assert.equal(Object.getPrototypeOf(result), null);
  });
});

// --- generateRenameMap tests ---

describe('generateRenameMap', () => {
  let generateRenameMap;

  before(() => {
    generateRenameMap = require('../../scripts/lib/artifact-utils').generateRenameMap;
  });

  it('produces markdown table with correct old/new paths', () => {
    const entries = [
      { oldPath: 'planning-artifacts/prd-gyre.md', newPath: 'planning-artifacts/gyre-prd.md' },
      { oldPath: 'vortex-artifacts/epic-forge.md', newPath: 'vortex-artifacts/forge-epic.md' },
    ];
    const md = generateRenameMap(entries);
    assert.ok(md.includes('# Artifact Rename Map'));
    assert.ok(md.includes('Total renamed:** 2'));
    assert.ok(md.includes('| planning-artifacts/prd-gyre.md | planning-artifacts/gyre-prd.md |'));
    assert.ok(md.includes('| vortex-artifacts/epic-forge.md | vortex-artifacts/forge-epic.md |'));
  });

  it('empty entries -> table with header only', () => {
    const md = generateRenameMap([]);
    assert.ok(md.includes('# Artifact Rename Map'));
    assert.ok(md.includes('Total renamed:** 0'));
    assert.ok(md.includes('| Old Path | New Path |'));
  });
});

// --- detectMigrationState tests ---

describe('detectMigrationState', () => {
  let cpMock;

  beforeEach(() => {
    cpMock = mockExecFileSync('../../scripts/lib/artifact-utils', __dirname);
  });

  afterEach(() => {
    cpMock?.restore();
  });

  it('recent commit is inject message -> returns complete', () => {
    cpMock.setReturnValue('chore: inject frontmatter metadata and update links\n');
    const { detectMigrationState } = cpMock.module;
    assert.equal(detectMigrationState('/fake'), 'complete');
  });

  it('recent commit is rename message -> returns renames-done', () => {
    cpMock.setReturnValue('chore: rename artifacts to governance convention\n');
    const { detectMigrationState } = cpMock.module;
    assert.equal(detectMigrationState('/fake'), 'renames-done');
  });

  it('no migration commits in recent history -> returns fresh', () => {
    cpMock.setReturnValue('feat: add new feature\nfix: bug fix\n');
    const { detectMigrationState } = cpMock.module;
    assert.equal(detectMigrationState('/fake'), 'fresh');
  });

  it('rename message found after intervening commit -> returns renames-done', () => {
    cpMock.setReturnValue('fix: hotfix\nchore: rename artifacts to governance convention\n');
    const { detectMigrationState } = cpMock.module;
    assert.equal(detectMigrationState('/fake'), 'renames-done');
  });

  it('ADR commit message also returns complete', () => {
    cpMock.setReturnValue('chore: generate governance convention ADR\n');
    const { detectMigrationState } = cpMock.module;
    assert.equal(detectMigrationState('/fake'), 'complete');
  });

  it('git log fails (not a repo) -> returns fresh', () => {
    cpMock.setImpl(() => { throw new Error('not a git repo'); });
    const { detectMigrationState } = cpMock.module;
    assert.equal(detectMigrationState('/fake'), 'fresh');
  });
});

// --- generateGovernanceADR tests ---

describe('generateGovernanceADR', () => {
  let generateGovernanceADR;

  before(() => {
    generateGovernanceADR = require('../../scripts/lib/artifact-utils').generateGovernanceADR;
  });

  it('returns markdown string with correct structure', () => {
    const md = generateGovernanceADR('2026-04-06', {
      renamedCount: 42, injectedCount: 42, linksUpdated: 15, scopeDirs: ['planning-artifacts', 'vortex-artifacts'],
    });
    assert.ok(md.includes('# Architecture Decision Record: Artifact Governance Convention'));
    assert.ok(md.includes('**Status:** ACCEPTED'));
    assert.ok(md.includes('**Date:** 2026-04-06'));
    assert.ok(md.includes('**Supersedes:** adr-repo-organization-conventions-2026-03-22.md'));
  });

  it('contains naming convention section', () => {
    const md = generateGovernanceADR('2026-04-06');
    assert.ok(md.includes('{initiative}-{artifact_type}'));
    assert.ok(md.includes('## Decision'));
  });

  it('contains taxonomy structure', () => {
    const md = generateGovernanceADR('2026-04-06');
    assert.ok(md.includes('## Taxonomy'));
    assert.ok(md.includes('vortex, gyre, bmm, forge, helm, enhance, loom, convoke'));
  });

  it('contains frontmatter schema v1', () => {
    const md = generateGovernanceADR('2026-04-06');
    assert.ok(md.includes('## Frontmatter Schema v1'));
    assert.ok(md.includes('schema_version: 1'));
  });

  it('includes migration stats', () => {
    const md = generateGovernanceADR('2026-04-06', {
      renamedCount: 42, injectedCount: 42, linksUpdated: 15,
      scopeDirs: ['planning-artifacts', 'vortex-artifacts'],
    });
    assert.ok(md.includes('Files renamed:** 42'));
    assert.ok(md.includes('Frontmatter injected:** 42'));
    assert.ok(md.includes('Links updated:** 15'));
    assert.ok(md.includes('planning-artifacts, vortex-artifacts'));
  });

  it('defaults stats gracefully when not provided', () => {
    const md = generateGovernanceADR('2026-04-06');
    assert.ok(md.includes('Files renamed:** 0'));
  });
});

// --- supersedePreviousADR tests ---

describe('supersedePreviousADR', () => {
  let tmpDir;
  let supersedePreviousADR;

  before(() => {
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
      'Content here.',
    ].join('\n');
    await fs.writeFile(path.join(adrDir, 'adr-repo-organization-conventions-2026-03-22.md'), oldADR);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('updates status from ACCEPTED to SUPERSEDED', () => {
    supersedePreviousADR(tmpDir, 'adr-artifact-governance-convention-2026-04-06.md');
    const content = fs.readFileSync(
      path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'adr-repo-organization-conventions-2026-03-22.md'), 'utf8',
    );
    assert.ok(content.includes('**Status:** SUPERSEDED'));
    assert.ok(!content.includes('**Status:** ACCEPTED'));
  });

  it('adds Superseded-by line with new ADR filename', () => {
    supersedePreviousADR(tmpDir, 'adr-artifact-governance-convention-2026-04-06.md');
    const content = fs.readFileSync(
      path.join(tmpDir, '_bmad-output', 'planning-artifacts', 'adr-repo-organization-conventions-2026-03-22.md'), 'utf8',
    );
    assert.ok(content.includes('**Superseded by:** adr-artifact-governance-convention-2026-04-06.md'));
    // Original Supersedes line preserved
    assert.ok(content.includes('**Supersedes:** N/A (first formal repo organization standard)'));
  });

  it('non-existent old ADR logs warning, does not throw', () => {
    const warnSpy = mock.method(console, 'warn', () => {});
    try {
      const emptyDir = path.join(tmpDir, 'empty-project');
      fs.ensureDirSync(emptyDir);

      const result = supersedePreviousADR(emptyDir, 'adr-artifact-governance-convention-2026-04-06.md');
      assert.equal(result, false);
      const matched = warnSpy.mock.calls.some((call) => {
        const firstArg = call.arguments[0];
        return typeof firstArg === 'string' && firstArg.includes('Previous ADR not found');
      });
      assert.ok(matched, 'expected console.warn to be called with "Previous ADR not found"');
    } finally {
      warnSpy.mock.restore();
    }
  });
});
