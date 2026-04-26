'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

const PROJECT_ROOT = findProjectRoot();
const PROMPT_PATH = path.join(PROJECT_ROOT, 'scripts/audit/pf1-judge-prompt.md');
const FIXTURE_DIR = path.join(PROJECT_ROOT, 'tests/fixtures/pf1-calibration');

function loadPromptBody() {
  const raw = fs.readFileSync(PROMPT_PATH, 'utf8');
  return raw.replace(/^---[\s\S]*?---\s*/, '');
}

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([\w_]+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

describe('PF1 judge prompt + fixtures (Story 4.1 — structural-only)', () => {
  it('Test 1: pf1-judge-prompt.md exists at scripts/audit/', () => {
    assert.ok(fs.existsSync(PROMPT_PATH), `expected file at ${PROMPT_PATH}`);
  });

  it('Test 2: YAML frontmatter parses + contains 4 required keys', () => {
    const fm = parseFrontmatter(PROMPT_PATH);
    assert.ok(fm, 'frontmatter not found');
    for (const key of ['version', 'judge_model', 'score_scale', 'threshold_T']) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(fm, key),
        `frontmatter missing required key: ${key}`
      );
      assert.ok(fm[key].length > 0, `frontmatter key '${key}' is empty`);
    }
  });

  it('Test 3: prompt body contains both placeholder markers', () => {
    const body = loadPromptBody();
    assert.ok(body.includes('{{OUTPUT_A}}'), 'body missing {{OUTPUT_A}} marker');
    assert.ok(body.includes('{{OUTPUT_B}}'), 'body missing {{OUTPUT_B}} marker');
  });

  it("Test 4: body's last non-empty line equals the terminal cue", () => {
    const body = loadPromptBody();
    const lines = body.split('\n').filter((l) => l.trim().length > 0);
    const last = lines[lines.length - 1].trim();
    assert.equal(last, 'Now produce your structured assessment:');
  });

  it('Test 5: 4 fixture files exist at tests/fixtures/pf1-calibration/', () => {
    for (const name of [
      'identical-pair-a.md',
      'identical-pair-b.md',
      'different-pair-a.md',
      'different-pair-b.md',
    ]) {
      const p = path.join(FIXTURE_DIR, name);
      assert.ok(fs.existsSync(p), `expected fixture at ${p}`);
    }
  });

  it('Test 6: identical-pair-a.md and identical-pair-b.md are byte-identical', () => {
    const aPath = path.join(FIXTURE_DIR, 'identical-pair-a.md');
    const bPath = path.join(FIXTURE_DIR, 'identical-pair-b.md');
    assert.ok(fs.existsSync(aPath), `identical-pair-a.md missing at ${aPath}`);
    assert.ok(fs.existsSync(bPath), `identical-pair-b.md missing at ${bPath}`);
    const a = fs.readFileSync(aPath);
    const b = fs.readFileSync(bPath);
    assert.equal(a.compare(b), 0, 'identical-pair fixtures must be byte-identical');
  });

  it('Test 7: prompt body contains 5 literal field markers (FM7-2 silent prompt-drift guard)', () => {
    const body = loadPromptBody();
    for (const marker of [
      'SCORE:',
      'STRUCTURAL_MATCH:',
      'PERSONA_CONSISTENT:',
      'CAPABILITIES_COMPLETE:',
      'REASONING:',
    ]) {
      assert.ok(
        body.includes(marker),
        `body missing required field marker: ${marker}`
      );
    }
  });

  it('Test 8: judge_model in prompt frontmatter matches JUDGE_MODEL constant in calibration script (Decision 1 single-source-of-truth)', () => {
    const fm = parseFrontmatter(PROMPT_PATH);
    const { JUDGE_MODEL } = require('../../scripts/audit/pf1-judge-calibration');
    assert.equal(
      fm.judge_model,
      JUDGE_MODEL,
      `prompt frontmatter judge_model='${fm.judge_model}' must match script JUDGE_MODEL='${JUDGE_MODEL}'`
    );
  });
});
