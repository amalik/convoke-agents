#!/usr/bin/env node
'use strict';

/**
 * PF1 Judge Calibration Script
 *
 * Validates that the PF1 judge prompt at `scripts/audit/pf1-judge-prompt.md` correctly
 * scores identical-output pairs ≥ 4 and different-output pairs ≤ 2 against the Anthropic
 * SDK. Writes calibration evidence to `_bmad-output/implementation-artifacts/v63-4-1-judge-calibration-evidence.md`.
 *
 * USAGE:
 *   ANTHROPIC_API_KEY=<key> node scripts/audit/pf1-judge-calibration.js
 *   node scripts/audit/pf1-judge-calibration.js --dry-run    (no API calls; prints rendered prompts)
 *
 * EXIT CODES:
 *   0  — Calibration PASS (commit evidence; mark Story 4.1 done)
 *   1  — Calibration FAIL (thresholds not met → apply Decision 1 escape: try Opus 4.7; then Decision 3: different fixtures)
 *   2  — Fixture/file missing (verify Task 3 ran; check tests/fixtures/pf1-calibration/)
 *   3  — Response parse failure (both regex patterns failed; inspect logged raw response; potentially tighten prompt format)
 *   4  — API call failure (network/auth/rate limit; verify ANTHROPIC_API_KEY; check network; retry full run)
 *   99 — Unhandled exception (bug; surface stack trace for triage)
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { findProjectRoot } = require('../update/lib/utils');

const PROJECT_ROOT = findProjectRoot();

const JUDGE_MODEL = 'claude-sonnet-4-6';
const PROMPT_PATH = path.join(PROJECT_ROOT, 'scripts/audit/pf1-judge-prompt.md');
const FIXTURE_DIR = path.join(PROJECT_ROOT, 'tests/fixtures/pf1-calibration');
const EVIDENCE_PATH = path.join(
  PROJECT_ROOT,
  '_bmad-output/implementation-artifacts/v63-4-1-judge-calibration-evidence.md'
);
const RUNS_PER_PAIR = 3;
const MAX_TOKENS = 1024;
const RESPONSE_TRUNCATION = 500;

function loadPromptTemplate(promptPath) {
  if (!fs.existsSync(promptPath)) {
    throw Object.assign(new Error(`Prompt template not found: ${promptPath}`), { exitCode: 2 });
  }
  const raw = fs.readFileSync(promptPath, 'utf8');
  const body = raw.replace(/^---[\s\S]*?---\s*/, '');
  if (!body.includes('{{OUTPUT_A}}') || !body.includes('{{OUTPUT_B}}')) {
    throw Object.assign(
      new Error('Prompt template missing {{OUTPUT_A}} or {{OUTPUT_B}} placeholder markers'),
      { exitCode: 2 }
    );
  }
  return body;
}

function loadFixturePair(dir, prefix) {
  const aPath = path.join(dir, `${prefix}-pair-a.md`);
  const bPath = path.join(dir, `${prefix}-pair-b.md`);
  if (!fs.existsSync(aPath)) {
    throw Object.assign(new Error(`Fixture missing: ${aPath}`), { exitCode: 2 });
  }
  if (!fs.existsSync(bPath)) {
    throw Object.assign(new Error(`Fixture missing: ${bPath}`), { exitCode: 2 });
  }
  return {
    a: fs.readFileSync(aPath, 'utf8'),
    b: fs.readFileSync(bPath, 'utf8'),
  };
}

function extractText(response) {
  if (!response || !Array.isArray(response.content)) {
    throw Object.assign(new Error('SDK response missing expected `content` array'), {
      exitCode: 99,
    });
  }
  const textBlocks = response.content.filter((b) => b.type === 'text');
  if (textBlocks.length === 0) {
    const stopReason = response.stop_reason ?? 'unknown';
    const contentTypes = response.content.map((b) => b.type).join(',') || 'empty';
    throw Object.assign(
      new Error(
        `SDK response had no text blocks (stop_reason=${stopReason}, content_types=[${contentTypes}]). Likely a refusal or tool_use-only response.`
      ),
      { exitCode: 4 }
    );
  }
  return textBlocks.map((b) => b.text).join('');
}

async function runJudgeOnce(client, promptTemplate, outputA, outputB) {
  // Use function form for `replace` to avoid `$&`/`$1` regex-replacement-syntax interpretation
  // when fixture content happens to contain `$&`, `$1`, `$\``, or `$'` literals.
  const prompt = promptTemplate
    .replace('{{OUTPUT_A}}', () => outputA)
    .replace('{{OUTPUT_B}}', () => outputB);
  try {
    const response = await client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });
    // Warn on max_tokens truncation — judge response cut mid-REASONING signals MAX_TOKENS too low
    // for the prompt + fixtures. parseScore may still find the SCORE line at top, so calibration
    // can pass with truncated reasoning; surface to operator for tuning visibility.
    if (response.stop_reason === 'max_tokens') {
      console.warn(
        `[runJudgeOnce] response truncated by max_tokens=${MAX_TOKENS}; consider raising MAX_TOKENS if REASONING is incomplete`
      );
    }
    // SDK 0.91.x does not expose retry count in response shape; field is always 0.
    // Future enhancement: intercept via SDK retry hook OR custom fetch wrapper.
    return { text: extractText(response), retries: 0 };
  } catch (err) {
    if (err.exitCode !== undefined) throw err; // already an exitCode-tagged error from extractText
    err.message = `API call failed: ${err.message}`;
    err.exitCode = 4;
    throw err;
  }
}

function parseScore(responseText) {
  const strict = responseText.match(/^SCORE:\s*([1-5])\s*$/m);
  if (strict) return parseInt(strict[1], 10);
  // Lenient fallback: anchored to start-of-line (multiline) but tolerates `**SCORE:** 4` style.
  // No `i` flag: judge prompt explicitly forbids lowercase per AC1 contract.
  const lenient = responseText.match(/^\**\s*SCORE:\s*\**\s*([1-5])\b/m);
  if (lenient) {
    console.warn(
      `[parseScore] strict regex missed; lenient fallback fired (response opens with markdown decoration?)`
    );
    return parseInt(lenient[1], 10);
  }
  throw Object.assign(
    new Error(
      `parseScore: no SCORE: <1-5> found in response. Raw response:\n${responseText}`
    ),
    { exitCode: 3 }
  );
}

function medianOf(scores) {
  if (scores.length === 0) {
    throw Object.assign(new Error('medianOf: empty scores array'), { exitCode: 99 });
  }
  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  if (n % 2 === 1) {
    return sorted[Math.floor(n / 2)];
  }
  return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

async function runCalibration(client, promptTemplate, pairLabel, fixtures, n) {
  const scores = [];
  const responses = [];
  let retries = 0;
  for (let i = 0; i < n; i++) {
    const result = await runJudgeOnce(client, promptTemplate, fixtures.a, fixtures.b);
    responses.push(result.text);
    retries += result.retries;
    if (result.text.length > RESPONSE_TRUNCATION) {
      // Per spec AC4: truncate evidence-file responses to first N chars but log full to stderr
      // so operators inspecting stderr (`2>&1` or `2>error.log`) can see the full content.
      console.error(`[FULL_RESPONSE_${pairLabel}_run_${i + 1}]\n${result.text}\n[END_${pairLabel}_run_${i + 1}]`);
    }
    const score = parseScore(result.text);
    scores.push(score);
    console.log(`  ${pairLabel} run ${i + 1}/${n}: SCORE=${score}`);
  }
  return { scores, median: medianOf(scores), responses, retries };
}

function truncateResponse(text) {
  if (text.length <= RESPONSE_TRUNCATION) return text;
  return (
    text.slice(0, RESPONSE_TRUNCATION) +
    `\n\n…[truncated to first ${RESPONSE_TRUNCATION} chars; full ${text.length}-char response logged to stderr — capture via \`2>&1\` or \`2>error.log\`]`
  );
}

function formatResponseBlockquote(text) {
  return text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function writeEvidence(evidencePath, results, judgeModel, calibrationPassed, totalRetries) {
  const created = new Date().toISOString().slice(0, 10);

  const frontmatter = {
    initiative: 'convoke',
    artifact_type: 'validation-evidence',
    story: 'v63-4-1-create-pf1-judge-prompt-and-calibration-test',
    calibration_passed: calibrationPassed,
    identical_median: results.identical.median,
    different_median: results.different.median,
    judge_model: judgeModel,
    created,
    api_retries_observed: totalRetries,
  };

  for (const [k, v] of Object.entries(frontmatter)) {
    if (v === undefined || v === null || v === '') {
      throw new Error(`writeEvidence: frontmatter key '${k}' is empty/missing`);
    }
  }

  let out = '---\n';
  for (const [k, v] of Object.entries(frontmatter)) {
    out += `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}\n`;
  }
  out += '---\n\n';
  out += '# PF1 Judge Calibration Evidence — Story 4.1\n\n';
  out += `**Calibration:** ${calibrationPassed ? 'PASS' : 'FAIL'}\n\n`;
  out += `**Judge model:** \`${judgeModel}\`\n`;
  out += `**Runs per pair:** ${RUNS_PER_PAIR} (median)\n`;
  out += `**Threshold contract:** identical-pair median ≥ 4 AND different-pair median ≤ 2\n`;
  out += `**API retries observed (SDK-reported):** ${totalRetries}\n\n`;

  for (const [pairLabel, pair] of [
    ['identical', results.identical],
    ['different', results.different],
  ]) {
    out += `## ${pairLabel}-pair results\n\n`;
    out += `| Run | Score |\n|-----|-------|\n`;
    pair.scores.forEach((s, i) => {
      out += `| ${i + 1} | ${s} |\n`;
    });
    out += `| **Median** | **${pair.median}** |\n\n`;
    out += `**Score scale gloss:** 5=identical · 4=equivalent w/ minor phrasing · 3=mostly equivalent · 2=noticeably different · 1=fundamentally different\n\n`;
    pair.responses.forEach((resp, i) => {
      out += `### ${pairLabel}-pair run ${i + 1} — verbatim judge response\n\n`;
      out += formatResponseBlockquote(truncateResponse(resp)) + '\n\n';
    });
  }

  const tmpPath = `${evidencePath}.tmp`;
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(tmpPath, out, 'utf8');
  fs.renameSync(tmpPath, evidencePath);
}

function parseArgs(argv) {
  const args = { dryRun: false };
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  const promptTemplate = loadPromptTemplate(PROMPT_PATH);
  const identicalFixtures = loadFixturePair(FIXTURE_DIR, 'identical');
  const differentFixtures = loadFixturePair(FIXTURE_DIR, 'different');

  if (args.dryRun) {
    console.log('--- DRY RUN: rendered prompts (no API calls) ---\n');
    console.log('=== IDENTICAL PAIR PROMPT ===\n');
    console.log(
      promptTemplate
        .replace('{{OUTPUT_A}}', () => identicalFixtures.a)
        .replace('{{OUTPUT_B}}', () => identicalFixtures.b)
    );
    console.log('\n=== DIFFERENT PAIR PROMPT ===\n');
    console.log(
      promptTemplate
        .replace('{{OUTPUT_A}}', () => differentFixtures.a)
        .replace('{{OUTPUT_B}}', () => differentFixtures.b)
    );
    return 0;
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    const detail = process.env.ANTHROPIC_API_KEY === undefined
      ? 'is not set'
      : 'is empty or whitespace-only';
    throw Object.assign(new Error(`ANTHROPIC_API_KEY environment variable ${detail}`), {
      exitCode: 4,
    });
  }

  // 60s per-request timeout caps total worst-case at 6 calls × 60s + retries = ~3-4min,
  // vs SDK default 10min/request → 1hr+. Calibration should complete in ~30-60s normal case.
  const client = new Anthropic({ maxRetries: 2, timeout: 60_000 });

  console.log(`Calibrating with judge model: ${JUDGE_MODEL}\n`);
  console.log('Identical-pair runs:');
  const identical = await runCalibration(
    client,
    promptTemplate,
    'identical',
    identicalFixtures,
    RUNS_PER_PAIR
  );
  console.log('\nDifferent-pair runs:');
  const different = await runCalibration(
    client,
    promptTemplate,
    'different',
    differentFixtures,
    RUNS_PER_PAIR
  );

  const calibrationPassed = identical.median >= 4 && different.median <= 2;
  const totalRetries = identical.retries + different.retries;

  writeEvidence(
    EVIDENCE_PATH,
    { identical, different },
    JUDGE_MODEL,
    calibrationPassed,
    totalRetries
  );

  console.log('\n--- Calibration Result ---');
  console.log(`Identical-pair median: ${identical.median} (need ≥ 4)`);
  console.log(`Different-pair median: ${different.median} (need ≤ 2)`);
  console.log(`Calibration: ${calibrationPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Evidence written: ${EVIDENCE_PATH}`);

  return calibrationPassed ? 0 : 1;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('Error:', err.message);
      if (err.stack && process.env.DEBUG) console.error(err.stack);
      // Honor only `err.exitCode` set explicitly at throw sites; default 99 (unhandled).
      // Drops fragile string-sniffing per R1 P2 (Edge Case Hunter H3 + Blind Hunter M14).
      process.exit(err.exitCode !== undefined ? err.exitCode : 99);
    });
}

module.exports = {
  JUDGE_MODEL,
  PROMPT_PATH,
  FIXTURE_DIR,
  EVIDENCE_PATH,
  RUNS_PER_PAIR,
  loadPromptTemplate,
  loadFixturePair,
  extractText,
  parseScore,
  medianOf,
  truncateResponse,
  formatResponseBlockquote,
};
