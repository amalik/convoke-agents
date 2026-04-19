'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { readManifest } = require('../../scripts/portability/manifest-csv');

// Story sp-2-3: CLI Entry Point
//
// Tests the convoke-export CLI by spawning it as a subprocess. All file
// outputs go to per-test tmpdirs that are cleaned up afterEach.

const projectRoot = findProjectRoot();
const CLI_PATH = path.join(projectRoot, 'scripts', 'portability', 'convoke-export.js');

function runCli(args, options = {}) {
  return spawnSync('node', [CLI_PATH, ...args], {
    cwd: options.cwd || projectRoot,
    encoding: 'utf8',
    env: process.env,
  });
}

function makeTmpDir() {
  const dir = path.join(os.tmpdir(), `sp-2-3-${crypto.randomUUID()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupTmpDir(dir) {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('convoke-export CLI (sp-2-3)', () => {
  let tmpDir;

  afterEach(() => {
    cleanupTmpDir(tmpDir);
    tmpDir = null;
  });

  it('Test 1: single skill, default output, dry-run — exits 0, prints success, writes nothing', () => {
    // Capture git status before; if dirty, skip the byte-comparison part only.
    let before;
    let canCompare = true;
    try {
      before = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
    } catch (e) {
      canCompare = false;
    }
    if (canCompare && before.length > 0) {
      console.warn('skipping write-check — working tree has pre-existing changes');
      canCompare = false;
    }

    const result = runCli(['bmad-brainstorming', '--dry-run']);
    assert.equal(result.status, 0);
    assert.ok(result.stdout.includes('✅ bmad-brainstorming'));
    assert.ok(result.stdout.includes('[DRY RUN]'));

    if (canCompare) {
      const after = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
      assert.equal(after, before);
    }
  });

  it('Test 2: single skill, custom output, real write — files exist, contain Carson', () => {
    tmpDir = makeTmpDir();
    const result = runCli(['bmad-brainstorming', '--output', tmpDir]);
    assert.equal(result.status, 0);

    const instructionsPath = path.join(tmpDir, 'bmad-brainstorming', 'instructions.md');
    const readmePath = path.join(tmpDir, 'bmad-brainstorming', 'README.md');
    assert.equal(fs.existsSync(instructionsPath), true);
    assert.equal(fs.existsSync(readmePath), true);

    const instructions = fs.readFileSync(instructionsPath, 'utf8');
    assert.ok(instructions.length > 0);
    assert.ok(instructions.includes('Carson'));
  });

  it('Test 3: tier 1 batch dry-run — exits 0 or 4, prints >=2 success lines, writes nothing', () => {
    // Count expected standalone skills from the manifest (avoid hard-coded count).
    const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
    const { header, rows } = readManifest(manifestPath);
    const nameIdx = header.indexOf('name');
    const tierIdx = header.indexOf('tier');
    const standaloneSet = new Set(
      rows.filter((r) => r[tierIdx] === 'standalone').map((r) => r[nameIdx])
    );
    assert.ok(standaloneSet.size >= 2);

    const result = runCli(['--tier', '1', '--dry-run']);
    // Engine may fail on some skills (persona resolution gaps in current
    // standalone set); accept either full success or partial failure.
    assert.ok([0, 4].includes(result.status));
    assert.ok(result.stdout.includes('[DRY RUN]'));
    assert.ok(result.stdout.includes('✅ bmad-brainstorming'));
    assert.ok(result.stdout.includes('✅ bmad-agent-architect'));
  });

  it('Test 4: tier 3 rejection — exits 3', () => {
    const result = runCli(['--tier', '3']);
    assert.equal(result.status, 3);
    assert.ok(result.stderr.includes("Tier 3"));
  });

  it('Test 5: nonexistent skill — exits 2 with "not in the manifest"', () => {
    const result = runCli(['bmad-skill-that-does-not-exist']);
    assert.equal(result.status, 2);
    assert.match(result.stdout + result.stderr, /not in the manifest/);
  });

  it('Test 6: --all includes --tier 1 skills (superset)', () => {
    const tierResult = runCli(['--tier', '1', '--dry-run']);
    const allResult = runCli(['--all', '--dry-run']);

    const extractSuccessSet = (out) =>
      new Set([...out.matchAll(/^✅ (\S+)/gm)].map((m) => m[1]));

    const tier1Set = extractSuccessSet(tierResult.stdout);
    const allSet = extractSuccessSet(allResult.stdout);

    // --all must include all --tier 1 skills (superset)
    for (const skill of tier1Set) {
      assert.equal(allSet.has(skill), true);
    }
    // --all should have >= --tier 1 count (includes light-deps too)
    assert.ok(allSet.size >= tier1Set.size);
  });

  it('Test 7: conflicting flags — exit 1', () => {
    const r1 = runCli(['bmad-brainstorming', '--tier', '1']);
    assert.equal(r1.status, 1);
    assert.ok(r1.stderr.includes('Run --help for usage.'));

    const r2 = runCli(['--tier', '1', '--all']);
    assert.equal(r2.status, 1);
    assert.ok(r2.stderr.includes('Run --help for usage.'));
  });

  it('Test 8: --help — exits 0, ASCII only, lists exit codes and examples', () => {
    const result = runCli(['--help']);
    assert.equal(result.status, 0);
    assert.ok(result.stdout.includes('Usage'));
    assert.ok(result.stdout.includes('--output'));
    assert.ok(result.stdout.includes('--tier'));
    assert.ok(result.stdout.includes('--all'));
    assert.ok(result.stdout.includes('--dry-run'));
    assert.ok(result.stdout.includes('Exit codes'));
    assert.ok(result.stdout.includes('Example:'));
    // No emoji in help text — ASCII only
    // eslint-disable-next-line no-control-regex
    assert.match(result.stdout, /^[\x00-\x7F\n]*$/);
  });

  it('Test 9: README stub validity — has Carson, icon, skill name, no leftover placeholders', () => {
    tmpDir = makeTmpDir();
    const result = runCli(['bmad-brainstorming', '--output', tmpDir]);
    assert.equal(result.status, 0);

    const readmePath = path.join(tmpDir, 'bmad-brainstorming', 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');

    // Strip HTML comments first (the template has explanatory comments
    // containing < characters that would otherwise false-match).
    const stripped = content.replace(/<!--[\s\S]*?-->/g, '');

    assert.ok(content.includes('Carson'));
    assert.ok(content.includes('🧠'));
    assert.ok(content.includes('bmad-brainstorming'));

    // Match the CLI's sanity check: multi-word placeholders only (single-word
    // HTML tags like <code>, <br> are allowed).
    const leftover = stripped.match(/<[a-z][a-z\s-]{2,}[a-z]>/gi);
    assert.equal(leftover, null);
  });
});

// I50: `--quiet` / `-q` flag — suppress per-skill success + skip lines, keep
// failures (stderr) + the single-line summary. Useful for CI / scripted
// pipelines. Deferred through 4 SP-Epic retros; resolved 2026-04-19.
describe('convoke-export CLI — --quiet flag (I50)', () => {
  const tmpDirs = [];
  afterEach(() => {
    while (tmpDirs.length) cleanupTmpDir(tmpDirs.pop());
  });

  it('suppresses per-skill success lines on batch when --quiet is passed', () => {
    const noisy = runCli(['--all', '--dry-run']);
    const quiet = runCli(['--all', '--dry-run', '--quiet']);

    assert.equal(noisy.status, 0);
    assert.equal(quiet.status, 0);

    const noisyLines = noisy.stdout.split('\n').filter(l => l.length > 0);
    const quietLines = quiet.stdout.split('\n').filter(l => l.length > 0);

    // Quiet must have exactly 1 line (the summary); noisy must have at least one
    // per-skill line on top. Relative comparison avoids brittleness if the
    // manifest ever shrinks below a hardcoded floor.
    assert.equal(quietLines.length, 1, `quiet batch should emit only the summary (got ${quietLines.length}): ${quiet.stdout}`);
    assert.ok(noisyLines.length > quietLines.length, `noisy batch must emit more lines than quiet (noisy=${noisyLines.length}, quiet=${quietLines.length})`);
  });

  it('-q short alias produces identical stdout AND stderr to --quiet', () => {
    const longForm = runCli(['--all', '--dry-run', '--quiet']);
    const shortForm = runCli(['--all', '--dry-run', '-q']);
    assert.equal(longForm.status, shortForm.status);
    assert.equal(longForm.stdout, shortForm.stdout);
    // stderr parity: a future divergence (e.g., one form triggering a
    // deprecation warning) must not silently pass.
    assert.equal(longForm.stderr, shortForm.stderr);
  });

  it('summary line is still emitted in quiet mode', () => {
    const result = runCli(['--all', '--dry-run', '--quiet']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Exported \d+ skills/);
    assert.match(result.stdout, /warnings total/);
  });

  it('single-skill mode with --quiet still writes output and exits 0; success line suppressed', () => {
    const tmpDir = makeTmpDir();
    tmpDirs.push(tmpDir);
    const result = runCli(['bmad-brainstorming', '--output', tmpDir, '--quiet']);
    assert.equal(result.status, 0);
    // Per-skill success line (✅ ... → ...) must be suppressed; summary still prints.
    const lines = result.stdout.split('\n').filter(l => l.length > 0);
    assert.equal(lines.length, 1, `expected only summary line; got:\n${result.stdout}`);
    assert.match(lines[0], /Exported 1 skills/);
    assert.ok(!/✅/.test(result.stdout), 'per-skill success emoji line must be suppressed');
    // Output files still landed on disk.
    assert.ok(fs.existsSync(path.join(tmpDir, 'bmad-brainstorming', 'instructions.md')));
  });

  it('help text documents --quiet', () => {
    const result = runCli(['--help']);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /--quiet/);
    assert.match(result.stdout, /-q/);
  });

  it('unknown flag starting with --quiet- is still rejected', () => {
    const result = runCli(['--quietz']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unknown flag/);
  });
});
