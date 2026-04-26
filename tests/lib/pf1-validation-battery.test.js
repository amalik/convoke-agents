'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

const PROJECT_ROOT = findProjectRoot();
const BATTERY_PATH = path.join(PROJECT_ROOT, 'scripts/audit/pf1-validation-battery.js');
const PROMPT_PATH = path.join(PROJECT_ROOT, 'scripts/audit/pf1-judge-prompt.md');
const SAMPLE_BASELINE_PATH = path.join(
  PROJECT_ROOT,
  'tests/fixtures/pf1-battery/sample-baseline.md'
);

function parsePromptFrontmatter(filePath) {
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

describe('PF1 validation battery harness (Story 4.2 — structural-only)', () => {
  it('Test 1: pf1-validation-battery.js exists at scripts/audit/', () => {
    assert.ok(fs.existsSync(BATTERY_PATH), `expected file at ${BATTERY_PATH}`);
  });

  it('Test 2: required exports present', () => {
    const m = require(BATTERY_PATH);
    const expected = [
      'PF1_AGENTS',
      'PF1_PROMPTS',
      'RUNS_PER_AGENT',
      'GATE_THRESHOLDS',
      'parseRecording',
      'computeGate',
      'runJudgePairs',
      'loadAgentRecordings',
      'writeResults',
    ];
    for (const k of expected) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(m, k),
        `battery module missing required export: ${k}`
      );
    }
  });

  it('Test 3: PF1_AGENTS has 5 entries matching Decision 3 (display + skill mapping)', () => {
    const { PF1_AGENTS } = require(BATTERY_PATH);
    assert.equal(PF1_AGENTS.length, 5);
    const expectedSkills = {
      Emma: 'bmad-agent-bme-contextualization-expert',
      John: 'bmad-agent-pm',
      Winston: 'bmad-agent-architect',
      Carson: 'bmad-cis-agent-brainstorming-coach',
      Murat: 'bmad-tea',
    };
    for (const a of PF1_AGENTS) {
      assert.ok(a.display, `agent missing display name: ${JSON.stringify(a)}`);
      assert.ok(a.skill, `agent missing skill name: ${JSON.stringify(a)}`);
      assert.equal(
        a.skill,
        expectedSkills[a.display],
        `Decision 3 mismatch for ${a.display}: expected ${expectedSkills[a.display]}, got ${a.skill}`
      );
    }
  });

  it('Test 4: PF1_PROMPTS has 4 entries matching parser keys (digit-only labels)', () => {
    const { PF1_PROMPTS } = require(BATTERY_PATH);
    assert.equal(PF1_PROMPTS.length, 4);
    // Labels MUST be digit-only `Prompt N` to match parseRecording output keys.
    // Test 11 verifies the round-trip; Test 4 verifies the canonical form.
    assert.deepEqual(PF1_PROMPTS, ['Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4']);
  });

  it('Test 5: JUDGE_MODEL invariant triangle (battery ↔ calibration ↔ prompt FM)', () => {
    const battery = require(BATTERY_PATH);
    const calibration = require('../../scripts/audit/pf1-judge-calibration');
    const promptFm = parsePromptFrontmatter(PROMPT_PATH);
    assert.ok(promptFm, 'prompt frontmatter not found');
    assert.equal(
      battery.JUDGE_MODEL,
      calibration.JUDGE_MODEL,
      `battery.JUDGE_MODEL='${battery.JUDGE_MODEL}' must equal calibration.JUDGE_MODEL='${calibration.JUDGE_MODEL}'`
    );
    assert.equal(
      calibration.JUDGE_MODEL,
      promptFm.judge_model,
      `calibration.JUDGE_MODEL='${calibration.JUDGE_MODEL}' must equal prompt frontmatter judge_model='${promptFm.judge_model}'`
    );
  });

  it('Test 6: parseRecording extracts 4 sections from sample-baseline.md', () => {
    const { parseRecording } = require(BATTERY_PATH);
    const text = fs.readFileSync(SAMPLE_BASELINE_PATH, 'utf8');
    const result = parseRecording(text);
    assert.deepEqual(
      Object.keys(result).sort(),
      ['Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4'],
      'parseRecording must return exactly 4 keys: Prompt 1..Prompt 4'
    );
    for (const k of ['Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4']) {
      assert.ok(
        result[k] && result[k].length > 0,
        `parseRecording result['${k}'] must be non-empty`
      );
    }
  });

  it('Test 7: parseRecording throws exitCode 5 when fewer than 4 prompt sections present', () => {
    const { parseRecording } = require(BATTERY_PATH);
    const threeSection = `## Prompt 1\nfoo\n\n## Prompt 2\nbar\n\n## Prompt 3\nbaz`;
    assert.throws(
      () => parseRecording(threeSection),
      (err) => err.exitCode === 5 && /wrong section structure/.test(err.message),
      'parseRecording must throw err.exitCode=5 with "wrong section structure" message on <4 sections'
    );
  });

  it('Test 8: computeGate returns PASS for all-5 medians', () => {
    const { computeGate } = require(BATTERY_PATH);
    const result = computeGate({ Emma: 5, John: 5, Winston: 5, Carson: 5, Murat: 5 });
    assert.equal(result.verdict, 'PASS');
    assert.equal(result.avg, 5);
    assert.equal(result.lowestMedian, 5);
  });

  it('Test 9: computeGate returns INVESTIGATE when one agent ≤ 2', () => {
    const { computeGate } = require(BATTERY_PATH);
    const result = computeGate({ Emma: 5, John: 5, Winston: 5, Carson: 5, Murat: 2 });
    assert.equal(result.verdict, 'INVESTIGATE');
    assert.equal(result.avg, 4.4);
    assert.equal(result.lowestAgent, 'Murat');
    assert.equal(result.lowestMedian, 2);
  });

  it('Test 10: computeGate returns FAIL when avg < 4.0', () => {
    const { computeGate } = require(BATTERY_PATH);
    const result = computeGate({ Emma: 3, John: 3, Winston: 3, Carson: 3, Murat: 3 });
    assert.equal(result.verdict, 'FAIL');
    assert.equal(result.avg, 3);
  });

  it('Test 11: PF1_PROMPTS keys match parseRecording output keys (R1 P3 — H1 story-killer guard)', () => {
    const { parseRecording, PF1_PROMPTS } = require(BATTERY_PATH);
    const text = fs.readFileSync(SAMPLE_BASELINE_PATH, 'utf8');
    const parsed = parseRecording(text);
    // Round-trip invariant: every PF1_PROMPTS label MUST resolve to a non-undefined section
    // in parseRecording output. Without this, main()'s `recs.baseline[promptLabel]` lookup
    // returns undefined for ALL 60 calls → silent false PASS gate verdict (verified empirically
    // pre-fix: H1 caused literal "undefined" to be substituted into every judge prompt).
    for (const label of PF1_PROMPTS) {
      assert.ok(
        parsed[label] !== undefined,
        `PF1_PROMPTS label '${label}' must resolve to a non-undefined parseRecording section; got undefined`
      );
      assert.ok(
        parsed[label].length > 0,
        `parsed['${label}'] must be non-empty body content`
      );
    }
    // Also assert the inverse: parseRecording produces exactly the keys PF1_PROMPTS uses.
    assert.deepEqual(
      Object.keys(parsed).sort(),
      [...PF1_PROMPTS].sort(),
      'parseRecording output keys must match PF1_PROMPTS exactly (no missing, no extra)'
    );
  });

  it('Test 12: computeGate throws exitCode 99 on NaN agent median (R1 P2 — H2 NaN-mask guard)', () => {
    const { computeGate } = require(BATTERY_PATH);
    assert.throws(
      () => computeGate({ Emma: 5, John: NaN, Winston: 5, Carson: 5, Murat: 5 }),
      (err) => err.exitCode === 99 && /non-finite agent median/.test(err.message),
      'computeGate must throw err.exitCode=99 with "non-finite agent median" message on NaN'
    );
  });

  it('Test 13: parseRecording throws exitCode 5 on whitespace-only section (R1 P5 — M4 empty-body guard)', () => {
    const { parseRecording } = require(BATTERY_PATH);
    const whitespaceOnly = `## Prompt 1\n\n\n## Prompt 2\nbar\n\n## Prompt 3\nbaz\n\n## Prompt 4\nqux`;
    assert.throws(
      () => parseRecording(whitespaceOnly),
      (err) => err.exitCode === 5 && /empty section/.test(err.message),
      'parseRecording must throw err.exitCode=5 with "empty section" message on whitespace-only body'
    );
  });
});
