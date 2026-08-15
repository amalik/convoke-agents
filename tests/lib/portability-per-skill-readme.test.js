'use strict';

const { describe, it, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { FIXTURE_ROOT, REPO_ROOT } = require('./portability-fixture');


// Story sp-3-2: Per-Skill README Generation
//
// Validates that exported READMEs are polished, under 80 lines, free of
// HTML comments, include all 3 platform install sections, and contain
// no leaked engine placeholders.

// Backlog I123: was the LIVE repo. Now a committed fixture (test-fixture-isolation).
const projectRoot = FIXTURE_ROOT;
const CLI_PATH = path.join(REPO_ROOT, 'scripts', 'portability', 'convoke-export.js');

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

// --- buildReadme: comment-marker handling (R1 review, issue #7) ---
//
// buildReadme used to substitute user data into the template and strip HTML
// comments afterwards. A `<!--` inside any substituted value then paired with
// the template's next `-->` and deleted everything between them — silently,
// with a mutilated README written to disk and a success report. The template is
// now stripped BEFORE substitution, so user data can never form a comment span
// with template text, and a marker that arrives through a value is refused.

describe('buildReadme — HTML comment markers in substituted values', () => {
  const { buildReadme } = require('../../scripts/portability/convoke-export');

  const skillRow = (over = {}) => ({
    name: 'bmad-test-skill',
    tier: 'standalone',
    description: 'Does a useful thing for the operator.',
    ...over
  });

  const result = (over = {}) => ({
    persona: { name: 'Testy', icon: '🧪', communicationStyle: 'Terse.' },
    sections: {
      whatYouProduce: '## What you produce\n\nAn artifact.',
      whenToUse: '- when testing'
    },
    ...over
  });

  // R3: asserting `!out.includes('<!--')` here would be tautological — the
  // function throws on exactly that condition, so any returned value satisfies
  // it. Assert on the template's actual comment TEXT instead, which is what
  // "the template was stripped" really means.
  it('produces a comment-free README on the clean path', () => {
    const out = buildReadme(skillRow(), result());
    assert.ok(out.includes('Does a useful thing'), 'description missing');
    assert.ok(!out.includes('Catalog-facing README'), 'template comment body leaked');
    assert.ok(!out.includes('Tier badge'), 'template comment body leaked');
    assert.ok(out.includes('Testy'), 'persona missing');
  });

  // R3 raised this: legitimate prose containing an arrow must not be mistaken
  // for a comment terminator. Verified by differential — a `-->` with no opener
  // corrupts nothing under either ordering, so the correct assertion is that it
  // passes through intact rather than that it throws.
  it('passes a description containing a bare --> through untouched', () => {
    const out = buildReadme(
      skillRow({ description: 'Converts A --> B and reports the result.' }),
      result()
    );
    assert.ok(out.includes('Converts A --> B'), `arrow text mangled: ${out.slice(0, 200)}`);
    assert.ok(out.includes('How to use it'), 'content after the arrow was swallowed');
  });

  it('refuses a description carrying a bare comment marker', () => {
    assert.throws(
      () => buildReadme(skillRow({ description: 'hide text with <!-- in markdown' }), result()),
      /HTML comment marker/
    );
  });

  it('refuses a complete comment arriving through a substituted value', () => {
    assert.throws(
      () => buildReadme(skillRow({ description: 'text <!-- hidden --> more' }), result()),
      /HTML comment marker/
    );
  });

  it('names the offending skill in the error', () => {
    assert.throws(
      () => buildReadme(skillRow({ name: 'bmad-culprit', description: 'x <!-- y' }), result()),
      /bmad-culprit/
    );
  });

  // The corruption this guard replaces. Under the old substitute-then-strip
  // ordering a description carrying `<!--` paired with the template's next
  // `-->`, deleting everything between — verified by differential: the sentinel
  // below was LOST from the output with no error raised. The assertion is that
  // the failure is now loud, since a silent wrong answer is the thing that
  // shipped mutilated READMEs.
  it('fails loudly instead of silently swallowing content after a marker', () => {
    const description = 'lead <!-- mid SENTINEL_TAIL';
    let out = null;
    let thrown = null;
    try {
      out = buildReadme(skillRow({ description }), result());
    } catch (e) {
      thrown = e;
    }
    assert.ok(thrown, `expected a throw; got ${out && out.length} bytes of output`);
    assert.match(thrown.message, /HTML comment marker/);
    assert.equal(out, null, 'no partial README may be returned');
  });
});
