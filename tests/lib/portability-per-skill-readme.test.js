'use strict';

const { describe, it, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Story sp-3-2: Per-Skill README Generation
//
// Validates that exported READMEs are polished, under 80 lines, free of
// HTML comments, include all 3 platform install sections, and contain
// no leaked engine placeholders.

const projectRoot = findProjectRoot();
const CLI_PATH = path.join(projectRoot, 'scripts', 'portability', 'convoke-export.js');

function runCli(args) {
  return spawnSync('node', [CLI_PATH, ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 30000,
  });
}

function makeTmpDir() {
  const dir = path.join(os.tmpdir(), `sp-3-2-${crypto.randomUUID()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

describe('Per-Skill README Generation (sp-3-2)', () => {
  // Single-skill tests
  let singleTmpDir;

  afterEach(() => {
    if (singleTmpDir && fs.existsSync(singleTmpDir)) {
      fs.rmSync(singleTmpDir, { recursive: true, force: true });
    }
    singleTmpDir = null;
  });

  function exportCarson() {
    if (!singleTmpDir) singleTmpDir = makeTmpDir();
    const result = runCli(['bmad-brainstorming', '--output', singleTmpDir]);
    assert.equal(result.status, 0);
    return fs.readFileSync(
      path.join(singleTmpDir, 'bmad-brainstorming', 'README.md'),
      'utf8'
    );
  }

  it('Test 1: README under 80 lines for Carson', () => {
    const content = exportCarson();
    const lineCount = content.split('\n').length;
    assert.ok(lineCount <= 80);
  });

  it('Test 2: no HTML comments in output', () => {
    const content = exportCarson();
    assert.ok(!content.includes('<!--'));
  });

  it('Test 3: all 3 platform sections present', () => {
    const content = exportCarson();
    assert.ok(content.includes('Claude Code'));
    assert.ok(content.includes('Copilot'));
    assert.ok(content.includes('Cursor'));
  });

  it('Test 4: no leaked engine placeholders', () => {
    const content = exportCarson();
    assert.ok(!content.includes('[your output folder]'));
    assert.ok(!content.includes('[your context]'));
    assert.ok(!content.includes('[your name]'));
    assert.ok(
      content.includes('your-output-folder'),
      'Phase 6 substitution must produce hyphenated form in README synthesis path'
    );
  });

  // Batch test — shared run
  describe('Batch validation', () => {
    let batchTmpDir, batchResult, skillDirs;

    before(() => {
      batchTmpDir = makeTmpDir();
      batchResult = spawnSync('node', [CLI_PATH, '--tier', '1', '--output', batchTmpDir], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: process.env,
        timeout: 30000,
      });
      skillDirs = fs.existsSync(batchTmpDir)
        ? fs.readdirSync(batchTmpDir).filter((d) =>
            fs.statSync(path.join(batchTmpDir, d)).isDirectory()
          )
        : [];
    }, 30000);

    after(() => {
      if (batchTmpDir && fs.existsSync(batchTmpDir)) {
        fs.rmSync(batchTmpDir, { recursive: true, force: true });
      }
    });

    it('Test 5: batch README validity — under 80 lines, no comments, all platforms', () => {
      assert.equal(batchResult.status, 0);
      assert.ok(skillDirs.length > 0);

      const issues = [];
      for (const dir of skillDirs) {
        const readmePath = path.join(batchTmpDir, dir, 'README.md');
        if (!fs.existsSync(readmePath)) {
          issues.push({ skill: dir, issue: 'README.md missing' });
          continue;
        }
        const content = fs.readFileSync(readmePath, 'utf8');
        const lineCount = content.split('\n').length;

        if (lineCount > 80) {
          issues.push({ skill: dir, issue: `${lineCount} lines (exceeds 80)` });
        }
        if (content.includes('<!--')) {
          issues.push({ skill: dir, issue: 'contains HTML comments' });
        }
        if (!content.includes('Claude Code')) {
          issues.push({ skill: dir, issue: 'missing Claude Code section' });
        }
        if (!content.includes('Copilot')) {
          issues.push({ skill: dir, issue: 'missing Copilot section' });
        }
        if (!content.includes('Cursor')) {
          issues.push({ skill: dir, issue: 'missing Cursor section' });
        }
      }

      if (issues.length > 0) {
        console.error('Batch README issues:', issues);
      }
      assert.deepEqual(issues, []);
    });
  });
});
