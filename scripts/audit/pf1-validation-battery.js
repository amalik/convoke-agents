#!/usr/bin/env node
'use strict';

/**
 * PF1 Validation Battery Harness
 *
 * Orchestrates the full PF1 behavioral-equivalence pipeline:
 *   4 agents × 4 prompts × RUNS_PER_AGENT (3) judge runs = 48 API calls per cycle.
 * Reads pre-recorded baseline + post-migration outputs, calls the calibration-passed judge,
 * aggregates per-agent + per-prompt scores, produces PASS/INVESTIGATE/FAIL verdict per
 * arch:362-368 gate logic. Writes results artifact at RESULTS_PATH.
 *
 * USAGE:
 *   ANTHROPIC_API_KEY=<key> node scripts/audit/pf1-validation-battery.js
 *   node scripts/audit/pf1-validation-battery.js --dry-run    (no API; renders ALL 20 prompt-pairs)
 *   node scripts/audit/pf1-validation-battery.js --verbose    (per-call timing to stderr)
 *
 * ENV OVERRIDES:
 *   PF1_BATTERY_RESULTS_PATH=<path>    Override default RESULTS_PATH (Story 4.3 timestamping)
 *
 * EXIT CODES:
 *   0  — Calibration PASS    (avg ≥ 4.0 + no agent ≤ 2 → ship)
 *   1  — INVESTIGATE         (avg ≥ 4.0 + one agent ≤ 2 → single-agent regression worth investigating)
 *   2  — FAIL                (avg < 4.0 → broad behavioral degradation; do not ship)
 *   3  — Response parse failure (judge response didn't match SCORE: <1-5> format)
 *   4  — API call failure (network/auth/rate limit; verify ANTHROPIC_API_KEY; retry full run)
 *   5  — Recording fixture missing OR malformed (verify Story 4.3 ran; check pf1-baselines/ + pf1-post-migration/)
 *   99 — Unhandled exception (bug; surface stack trace for triage)
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { findProjectRoot } = require('../update/lib/utils');
const {
  extractText,
  parseScore,
  medianOf,
  loadPromptTemplate,
  formatResponseBlockquote,
  truncateResponse,
  JUDGE_MODEL,
  PROMPT_PATH,
} = require('./pf1-judge-calibration');

const PROJECT_ROOT = findProjectRoot();

// Story 4.3 Path B+ re-scope (Decision 4 addendum, 2026-05-29):
//   3 Vortex (Emma + Wade + Liam) for format-conversion behavioral signal +
//   1 Gyre (Stack Detective) for cross-Convoke-module control.
//   BMAD-agent control validation replaced by mechanical install-scope-check.js.
const PF1_AGENTS = [
  { display: 'Emma',           skill: 'bmad-agent-bme-contextualization-expert' },        // Vortex POC (Story 2.1)
  { display: 'Wade',           skill: 'bmad-agent-bme-lean-experiments-specialist' },     // Vortex R2-converged (Story 2.2)
  { display: 'Liam',           skill: 'bmad-agent-bme-hypothesis-engineer' },             // Vortex HC-schema-heaviest (Story 2.7)
  { display: 'StackDetective', skill: 'bmad-agent-bme-stack-detective' },                 // Gyre cross-module control
];

// Labels MUST match `## Prompt N` header keys emitted by parseRecording (digit-only).
// Decision 4 descriptions live in spec §"Decision 4" — kept out of code to preserve
// labels-used-as-keys symmetry with the parser. R1 P1 fix (H1 story-killer).
const PF1_PROMPTS = ['Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4'];

// Decision 4 descriptions (kept here for in-code reference + future report rendering).
// NOT used as map keys — see PF1_PROMPTS above for the load-bearing array.
const PF1_PROMPT_DESCRIPTIONS = {
  'Prompt 1': 'Activation greeting + menu',
  'Prompt 2': 'First capability invocation',
  'Prompt 3': 'Follow-up question',
  'Prompt 4': 'Multi-step workflow entry',
};

const RUNS_PER_AGENT = 3;
const MAX_TOKENS = 1024;
const RESPONSE_TRUNCATION = 500;
const BASELINE_DIR = path.join(PROJECT_ROOT, '_bmad-output/pf1-baselines');
const POST_MIGRATION_DIR = path.join(PROJECT_ROOT, '_bmad-output/pf1-post-migration');
const DEFAULT_RESULTS_PATH = path.join(
  PROJECT_ROOT,
  '_bmad-output/implementation-artifacts/v63-4-2-battery-results.md'
);
const GATE_THRESHOLDS = { passAvg: 4.0, investigateLowAgent: 2 };

function parseRecording(text) {
  // Match `## Prompt N` headers anchored to start-of-line + end-of-line (multiline mode).
  // R1 P4 fix (M5): tightened from `\b` to `\s*$` — `\b` matched `## Prompt 1.5` or
  // `## Prompt 1abc` as `Prompt 1`, leaving `.5` in body. `\s*$` requires nothing
  // (or only whitespace) after the digit before line-end.
  const headerRegex = /^## Prompt (\d+)\s*$/gm;
  const headers = [];
  let match;
  while ((match = headerRegex.exec(text)) !== null) {
    headers.push({ index: match.index, num: match[1], full: match[0] });
  }

  if (headers.length !== 4) {
    throw Object.assign(
      new Error(
        `Recording has wrong section structure: expected exactly 4 [Prompt 1..Prompt 4] headers, got ${headers.length}`
      ),
      { exitCode: 5 }
    );
  }

  const result = {};
  const expectedNums = ['1', '2', '3', '4'];
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].num !== expectedNums[i]) {
      throw Object.assign(
        new Error(
          `Recording has wrong section labels: expected [Prompt 1, Prompt 2, Prompt 3, Prompt 4] in order, got [Prompt ${headers.map((h) => h.num).join(', Prompt ')}]`
        ),
        { exitCode: 5 }
      );
    }
    const start = headers[i].index + headers[i].full.length;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    const body = text.slice(start, end).trim();
    // R1 P5 fix (M4): reject whitespace-only sections — judge would receive empty
    // {{OUTPUT_A}}/{{OUTPUT_B}} substitution → likely false PASS (empty == empty).
    if (body.length === 0) {
      throw Object.assign(
        new Error(
          `Recording has empty section: Prompt ${headers[i].num} contains only whitespace`
        ),
        { exitCode: 5 }
      );
    }
    result[`Prompt ${headers[i].num}`] = body;
  }
  return result;
}

function loadAgentRecordings(agent, baselineDir, postMigrationDir) {
  const baselinePath = path.join(baselineDir, `${agent.skill}-baseline.md`);
  const postPath = path.join(postMigrationDir, `${agent.skill}-post.md`);
  if (!fs.existsSync(baselinePath)) {
    throw Object.assign(new Error(`Recording missing: ${baselinePath}`), { exitCode: 5 });
  }
  if (!fs.existsSync(postPath)) {
    throw Object.assign(new Error(`Recording missing: ${postPath}`), { exitCode: 5 });
  }
  return {
    baseline: parseRecording(fs.readFileSync(baselinePath, 'utf8')),
    post: parseRecording(fs.readFileSync(postPath, 'utf8')),
  };
}

async function runJudgePairs(client, promptTemplate, baselineText, postText, n, options = {}) {
  const scores = [];
  const responses = [];
  for (let i = 0; i < n; i++) {
    // Function-form replace per Story 4.1 P-C4 (avoids $&/$1 regex-replacement-syntax interpretation)
    const prompt = promptTemplate
      .replace('{{OUTPUT_A}}', () => baselineText)
      .replace('{{OUTPUT_B}}', () => postText);
    const startCall = Date.now();
    let response;
    try {
      response = await client.messages.create({
        model: JUDGE_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (err) {
      if (err.exitCode !== undefined) throw err;
      err.message = `API call failed: ${err.message}`;
      err.exitCode = 4;
      throw err;
    }
    const callMs = Date.now() - startCall;
    if (options.verbose) {
      console.error(`[runJudgePairs] run ${i + 1}/${n} call took ${callMs}ms`);
    }
    if (response.stop_reason === 'max_tokens') {
      console.warn(
        `[runJudgePairs] response truncated by max_tokens=${MAX_TOKENS}; consider raising if REASONING is incomplete`
      );
    }
    const text = extractText(response);
    responses.push(text);
    if (text.length > RESPONSE_TRUNCATION) {
      console.error(
        `[FULL_RESPONSE_run_${i + 1}]\n${text}\n[END_run_${i + 1}]`
      );
    }
    const score = parseScore(text);
    scores.push(score);
  }
  return { scores, median: medianOf(scores), responses, retries: 0 };
}

function computeGate(agentMedians) {
  const entries = Object.entries(agentMedians);
  if (entries.length === 0) {
    throw Object.assign(new Error('computeGate: empty agentMedians'), { exitCode: 99 });
  }
  // R1 P2 fix (H2): reject NaN/non-finite medians — would silently mask FAIL via
  // NaN comparison falling through to PASS branch.
  for (const [agent, m] of entries) {
    if (!Number.isFinite(m)) {
      throw Object.assign(
        new Error(`computeGate: non-finite agent median: ${agent}=${m}`),
        { exitCode: 99 }
      );
    }
  }
  const medians = entries.map(([, m]) => m);
  const avg = medians.reduce((a, b) => a + b, 0) / medians.length;
  const lowest = entries.reduce(
    (min, [agent, m]) => (m < min[1] ? [agent, m] : min),
    [entries[0][0], entries[0][1]]
  );

  let verdict;
  let reasoning;
  if (avg < GATE_THRESHOLDS.passAvg) {
    verdict = 'FAIL';
    reasoning = `Average median ${avg.toFixed(2)} < ${GATE_THRESHOLDS.passAvg} threshold — broad behavioral degradation.`;
  } else if (lowest[1] <= GATE_THRESHOLDS.investigateLowAgent) {
    verdict = 'INVESTIGATE';
    reasoning = `Average median ${avg.toFixed(2)} ≥ ${GATE_THRESHOLDS.passAvg} but lowest agent ${lowest[0]} median ${lowest[1]} ≤ ${GATE_THRESHOLDS.investigateLowAgent} — single-agent regression worth investigating.`;
  } else {
    verdict = 'PASS';
    reasoning = `Average median ${avg.toFixed(2)} ≥ ${GATE_THRESHOLDS.passAvg} AND lowest agent ${lowest[0]} median ${lowest[1]} > ${GATE_THRESHOLDS.investigateLowAgent} — broad behavioral equivalence proven.`;
  }

  return {
    verdict,
    avg,
    lowestAgent: lowest[0],
    lowestMedian: lowest[1],
    reasoning,
  };
}

function writeResults(resultsPath, allResults, judgeModel, gate, totalApiCalls, startTime, endTime) {
  const created = new Date().toISOString().slice(0, 10);
  const wallClockSeconds = (endTime - startTime) / 1000;

  const frontmatter = {
    initiative: 'convoke',
    artifact_type: 'validation-results',
    story: 'v63-4-2-create-pf1-validation-battery-harness',
    gate_verdict: gate.verdict,
    avg_median: Number(gate.avg.toFixed(2)),
    lowest_agent: gate.lowestAgent,
    lowest_median: gate.lowestMedian,
    judge_model: judgeModel,
    created,
    total_api_calls: totalApiCalls,
    wall_clock_seconds: Number(wallClockSeconds.toFixed(2)),
  };

  for (const [k, v] of Object.entries(frontmatter)) {
    if (v === undefined || v === null || v === '') {
      throw Object.assign(new Error(`writeResults: frontmatter key '${k}' is empty/missing`), {
        exitCode: 99,
      });
    }
  }

  let out = '---\n';
  for (const [k, v] of Object.entries(frontmatter)) {
    out += `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}\n`;
  }
  out += '---\n\n';
  out += '# PF1 Validation Battery Results — Story 4.2\n\n';
  out += `## Gate Verdict: ${gate.verdict}\n\n`;
  out += `${gate.reasoning}\n\n`;
  out += `**Judge model:** \`${judgeModel}\`\n`;
  out += `**Runs per agent-prompt pair:** ${RUNS_PER_AGENT} (median)\n`;
  out += `**Total API calls:** ${totalApiCalls}\n`;
  out += `**Wall-clock:** ${wallClockSeconds.toFixed(2)}s (${(wallClockSeconds / 60).toFixed(2)}min) — NFR3 budget = 900s (15min)\n\n`;

  out += `## Per-agent table\n\n`;
  out += `| Display | Skill | P1 | P2 | P3 | P4 | Agent median | Agent verdict |\n`;
  out += `|---|---|---|---|---|---|---|---|\n`;
  for (const a of PF1_AGENTS) {
    const r = allResults[a.display];
    if (!r) continue;
    const promptMedians = PF1_PROMPTS.map((p) => r.promptResults[p]?.median ?? 'N/A');
    const agentVerdict =
      r.agentMedian <= GATE_THRESHOLDS.investigateLowAgent
        ? 'low (≤2)'
        : r.agentMedian >= GATE_THRESHOLDS.passAvg
          ? 'OK'
          : 'mid';
    out += `| ${a.display} | \`${a.skill}\` | ${promptMedians[0]} | ${promptMedians[1]} | ${promptMedians[2]} | ${promptMedians[3]} | ${r.agentMedian} | ${agentVerdict} |\n`;
  }
  out += '\n';

  out += `## Per-prompt detail\n\n`;
  for (const a of PF1_AGENTS) {
    const r = allResults[a.display];
    if (!r) continue;
    out += `### ${a.display} (\`${a.skill}\`)\n\n`;
    for (const p of PF1_PROMPTS) {
      const pr = r.promptResults[p];
      if (!pr) {
        out += `- ${p}: N/A\n`;
        continue;
      }
      out += `**${p}** — scores ${JSON.stringify(pr.scores)} median **${pr.median}**\n\n`;
      pr.responses.forEach((resp, i) => {
        out += `*Run ${i + 1}:*\n`;
        out += formatResponseBlockquote(truncateResponse(resp)) + '\n\n';
      });
    }
  }

  const tmpPath = `${resultsPath}.tmp`;
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(tmpPath, out, 'utf8');
  fs.renameSync(tmpPath, resultsPath);
}

function parseArgs(argv) {
  const args = { dryRun: false, verbose: false };
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--verbose') args.verbose = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const resultsPath = process.env.PF1_BATTERY_RESULTS_PATH || DEFAULT_RESULTS_PATH;

  const promptTemplate = loadPromptTemplate(PROMPT_PATH);

  // Load all 4 agents' baseline + post-migration recordings up-front (fail fast on missing/malformed)
  const agentRecordings = {};
  for (const agent of PF1_AGENTS) {
    agentRecordings[agent.display] = loadAgentRecordings(agent, BASELINE_DIR, POST_MIGRATION_DIR);
  }

  if (args.dryRun) {
    console.log('--- DRY RUN: rendered prompts (no API calls) ---\n');
    for (const agent of PF1_AGENTS) {
      const recs = agentRecordings[agent.display];
      for (const promptLabel of PF1_PROMPTS) {
        console.log(`\n=== ${agent.display} (${agent.skill}) — ${promptLabel} ===\n`);
        const rendered = promptTemplate
          .replace('{{OUTPUT_A}}', () => recs.baseline[promptLabel])
          .replace('{{OUTPUT_B}}', () => recs.post[promptLabel]);
        console.log(rendered);
      }
    }
    return 0;
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    const detail =
      process.env.ANTHROPIC_API_KEY === undefined ? 'is not set' : 'is empty or whitespace-only';
    throw Object.assign(new Error(`ANTHROPIC_API_KEY environment variable ${detail}`), {
      exitCode: 4,
    });
  }

  const client = new Anthropic({ maxRetries: 2, timeout: 60_000 });

  console.log(`Battery validation with judge model: ${JUDGE_MODEL}`);
  console.log(`Agents: ${PF1_AGENTS.length} × Prompts: ${PF1_PROMPTS.length} × Runs: ${RUNS_PER_AGENT} = ${PF1_AGENTS.length * PF1_PROMPTS.length * RUNS_PER_AGENT} API calls\n`);

  const startTime = Date.now();
  const allResults = {};
  let totalApiCalls = 0;

  for (const agent of PF1_AGENTS) {
    console.log(`\n--- ${agent.display} (${agent.skill}) ---`);
    const recs = agentRecordings[agent.display];
    const promptResults = {};
    const promptMedians = [];
    for (const promptLabel of PF1_PROMPTS) {
      const result = await runJudgePairs(
        client,
        promptTemplate,
        recs.baseline[promptLabel],
        recs.post[promptLabel],
        RUNS_PER_AGENT,
        { verbose: args.verbose }
      );
      totalApiCalls += result.scores.length;
      promptResults[promptLabel] = result;
      promptMedians.push(result.median);
      console.log(
        `  ${promptLabel}: scores ${JSON.stringify(result.scores)} median ${result.median}`
      );
    }
    const agentMedian = medianOf(promptMedians);
    allResults[agent.display] = { promptResults, agentMedian };
    console.log(`  → ${agent.display} median: ${agentMedian}`);
  }

  const agentMediansObj = {};
  for (const a of PF1_AGENTS) {
    agentMediansObj[a.display] = allResults[a.display].agentMedian;
  }

  const gate = computeGate(agentMediansObj);
  const endTime = Date.now();

  writeResults(resultsPath, allResults, JUDGE_MODEL, gate, totalApiCalls, startTime, endTime);

  console.log(`\n--- Battery Result ---`);
  console.log(`Verdict: ${gate.verdict}`);
  console.log(`Average median: ${gate.avg.toFixed(2)} (need ≥ ${GATE_THRESHOLDS.passAvg})`);
  console.log(
    `Lowest agent: ${gate.lowestAgent} median ${gate.lowestMedian} (need > ${GATE_THRESHOLDS.investigateLowAgent})`
  );
  console.log(`Wall-clock: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`Results written: ${resultsPath}`);

  return gate.verdict === 'PASS' ? 0 : gate.verdict === 'INVESTIGATE' ? 1 : 2;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('Error:', err.message);
      if (err.stack && process.env.DEBUG) console.error(err.stack);
      process.exit(err.exitCode !== undefined ? err.exitCode : 99);
    });
}

module.exports = {
  PF1_AGENTS,
  PF1_PROMPTS,
  PF1_PROMPT_DESCRIPTIONS,
  RUNS_PER_AGENT,
  GATE_THRESHOLDS,
  BASELINE_DIR,
  POST_MIGRATION_DIR,
  DEFAULT_RESULTS_PATH,
  JUDGE_MODEL,
  parseRecording,
  loadAgentRecordings,
  runJudgePairs,
  computeGate,
  writeResults,
};
