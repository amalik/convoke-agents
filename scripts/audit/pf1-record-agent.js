#!/usr/bin/env node
'use strict';

/*
 * PROVENANCE (2026-06-28): NOT dead code. Part of the PF1 battery — the v4.0
 * behavioral-equivalence RELEASE gate (FR36-40; LLM-judge, drift threshold T).
 * BLOCKED / mid-resumption (Story 4.3), not abandoned. Its gate evidence is
 * genuinely unobtained: the I97 personality scoring (FR21-23) covers only 2 of
 * PF1's 4 target agents and gates merge, not release. FINISH or formally waive
 * the gate at the v4.0 release decision — do NOT archive. See
 * docs/codebase-audit-2026-06-27.md.
 */

/**
 * PF1 Recording Helper (Story 4.3 Task 1.5 D2-A automation script)
 *
 * Captures `claude -p --max-turns N "/<skill>"` activation greetings for the 5 PF1 agents,
 * writes parser-valid recording files per the protocol contract.
 *
 * Spike-confirmed invariant (v63-4-3-fm4-2-spike-result.md):
 *   - Working form: `claude -p --max-turns N "/<skill>"`  (slash-command-as-prompt-arg)
 *   - NOT-working form: `echo "/<skill>" | claude -p "..."`  (stdin pipe — fails with max-turns error)
 *
 * v0 design (per recording-protocol §5.1 limitation):
 *   - `claude -p` is single-shot; Prompts 2-4 depend on stateful agent activation
 *   - Script reliably captures Prompt 1 (activation greeting + menu)
 *   - Writes per-agent file with Prompt 1 captured + placeholder sections for Prompts 2-4
 *   - Operator completes Prompts 2-4 via D2-B (manual) for those only
 *
 * USAGE:
 *   node scripts/audit/pf1-record-agent.js --phase=baseline
 *   node scripts/audit/pf1-record-agent.js --phase=post-migration
 *   node scripts/audit/pf1-record-agent.js --phase=baseline --agent=bmad-agent-architect
 *   node scripts/audit/pf1-record-agent.js --phase=baseline --dry-run
 *
 * EXIT CODES:
 *   0 — all targeted agents captured (Prompt 1 each)
 *   1 — partial success (some agents failed; per-agent errors logged to stderr)
 *   2 — invalid usage (bad flags, unknown agent, etc.)
 *   3 — pre-flight failed (claude CLI not found, target dir not writable)
 *   4 — git rev-parse failed (commit SHA not retrievable for provenance)
 *   5 — recording-protocol contract violated by output (parser would reject — bug; surface stack)
 *
 * ENV OVERRIDES:
 *   PF1_RECORD_MAX_TURNS=<N>   Override --max-turns for `claude -p` invocations (default 5)
 *   PF1_RECORD_TIMEOUT_MS=<N>  Per-invocation timeout (default 60000 = 60s)
 *
 * Authored 2026-05-29 per D14 snapshot. Story 4.3 Task 1.5 D2-A path deliverable.
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');

const PROJECT_ROOT = findProjectRoot();

// ===== Configuration =====

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

const PHASE_TO_VERSION = {
  baseline: '3.x',
  'post-migration': '4.0.0-rc.1',
};

const PHASE_TO_DIR = {
  baseline: 'pf1-baselines',
  'post-migration': 'pf1-post-migration',
};

const PHASE_TO_SUFFIX = {
  baseline: 'baseline',
  'post-migration': 'post',
};

// Default bumped 5 → 10 after empirical finding 2026-05-31: v6.3+ outcome-based agents
// (Emma + Wade in particular) require more activation turns than v5 XML format. v3.3.0
// baseline succeeded at 5, but 4.0-rc.1 post-migration of Emma + Wade hit
// "Reached max turns (5)" until bumped. Spike anticipated this ("may need adjustment for
// deeper prompts"). Override via PF1_RECORD_MAX_TURNS env var if needed.
const DEFAULT_MAX_TURNS = Number(process.env.PF1_RECORD_MAX_TURNS) || 10;
const TIMEOUT_MS = Number(process.env.PF1_RECORD_TIMEOUT_MS) || 60000;

// ===== Argument parsing =====

function parseArgs(argv) {
  const args = { phase: null, agent: null, dryRun: false };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--phase=')) args.phase = arg.slice('--phase='.length);
    else if (arg.startsWith('--agent=')) args.agent = arg.slice('--agent='.length);
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printUsage();
      process.exit(2);
    }
  }
  return args;
}

function printUsage() {
  console.error('Usage: node scripts/audit/pf1-record-agent.js --phase=<baseline|post-migration> [--agent=<skill-id>] [--dry-run]');
}

// ===== Pre-flight =====

function checkClaudeCli() {
  const probe = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    throw new Error(`claude CLI not found or non-zero exit (status=${probe.status}). Install Claude Code first: https://docs.anthropic.com/claude/docs/claude-code`);
  }
}

function getCommitSha() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().slice(0, 8);
  } catch (err) {
    throw new Error(`git rev-parse HEAD failed: ${err.message}`, { cause: err });
  }
}

function ensureOutputDir(phaseDir) {
  const absDir = path.join(PROJECT_ROOT, '_bmad-output', phaseDir);
  fs.mkdirSync(absDir, { recursive: true });
  return absDir;
}

// ===== Capture =====

function capturePrompt1(skillId, maxTurns) {
  const slashCommand = `/${skillId}`;
  // --setting-sources project,local scopes skill lookup to cwd `.claude/skills/`,
  // preventing user-level wrappers from leaking into a worktree-scoped recording
  // (verified 2026-05-31 by comparing v3.3.0 worktree Emma menu codes vs source file).
  const result = spawnSync(
    'claude',
    ['-p', '--setting-sources', 'project,local', '--max-turns', String(maxTurns), slashCommand],
    { encoding: 'utf8', timeout: TIMEOUT_MS },
  );
  if (result.error) {
    throw new Error(`claude invocation failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`claude exited ${result.status} for ${slashCommand}. stderr: ${(result.stderr || '').trim()}`);
  }
  return result.stdout || '';
}

// ===== Recording file format =====

function buildRecordingFile({ skillId, phase, prompt1Body, commitSha, timestamp }) {
  const version = PHASE_TO_VERSION[phase];
  const provenance = `<!-- Source: ${skillId} ${phase} captured ${timestamp} from convoke ${version} (commit ${commitSha}) -->`;

  // Prompt 1 captured; Prompts 2-4 left as placeholders for operator D2-B fill-in.
  // Placeholder body MUST be non-empty so parseRecording sees a section, but operator must
  // replace before declaring file complete (per recording-protocol §4 pre-validation).
  const placeholder = '_(D2-B operator fill-in required — see recording-protocol.md §6.1 for manual workflow)_';

  return [
    provenance,
    '',
    '## Prompt 1',
    '',
    prompt1Body.trim(),
    '',
    '## Prompt 2',
    '',
    placeholder,
    '',
    '## Prompt 3',
    '',
    placeholder,
    '',
    '## Prompt 4',
    '',
    placeholder,
    '',
  ].join('\n');
}

// ===== Parser-contract self-check =====
// Per recording-protocol §4: file MUST parse with /^## Prompt (\d+)\s*$/gm
// regex producing keys [Prompt 1, Prompt 2, Prompt 3, Prompt 4].

function selfCheckParserContract(body) {
  const headerRe = /^## Prompt (\d+)\s*$/gm;
  const found = [];
  let m;
  while ((m = headerRe.exec(body)) !== null) found.push(`Prompt ${m[1]}`);
  const expected = ['Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4'];
  const missing = expected.filter((k) => !found.includes(k));
  const extra = found.filter((k) => !expected.includes(k));
  if (missing.length || extra.length) {
    throw new Error(`Parser-contract self-check FAILED. Found: [${found.join(', ')}]. Missing: [${missing.join(', ')}]. Extra: [${extra.join(', ')}].`);
  }
  return found;
}

// ===== Main =====

function main() {
  const args = parseArgs(process.argv);

  if (!args.phase || !PHASE_TO_DIR[args.phase]) {
    console.error(`Invalid --phase. Must be one of: ${Object.keys(PHASE_TO_DIR).join(', ')}`);
    printUsage();
    process.exit(2);
  }

  const targetAgents = args.agent
    ? PF1_AGENTS.filter((a) => a.skill === args.agent)
    : PF1_AGENTS;

  if (targetAgents.length === 0) {
    console.error(`Unknown --agent: ${args.agent}. Known: ${PF1_AGENTS.map((a) => a.skill).join(', ')}`);
    process.exit(2);
  }

  // Pre-flight
  try {
    checkClaudeCli();
  } catch (err) {
    console.error(`Pre-flight failed: ${err.message}`);
    process.exit(3);
  }

  let commitSha;
  try {
    commitSha = getCommitSha();
  } catch (err) {
    console.error(`Pre-flight failed: ${err.message}`);
    process.exit(4);
  }

  const phaseDir = PHASE_TO_DIR[args.phase];
  const phaseSuffix = PHASE_TO_SUFFIX[args.phase];
  const absDir = args.dryRun ? null : ensureOutputDir(phaseDir);

  console.log(`PF1 recording — phase=${args.phase}, agents=${targetAgents.length}, commit=${commitSha}, max-turns=${DEFAULT_MAX_TURNS}, dry-run=${args.dryRun}`);
  console.log(`Output dir: ${args.dryRun ? '(skipped — dry run)' : absDir}`);
  console.log('');

  const results = { ok: [], failed: [] };

  for (const agent of targetAgents) {
    const outPath = absDir ? path.join(absDir, `${agent.skill}-${phaseSuffix}.md`) : null;
    process.stdout.write(`[${agent.display.padEnd(7)}] ${agent.skill} ... `);

    if (args.dryRun) {
      console.log(`(dry run — would write ${agent.skill}-${phaseSuffix}.md)`);
      results.ok.push(agent.skill);
      continue;
    }

    let prompt1Body;
    try {
      prompt1Body = capturePrompt1(agent.skill, DEFAULT_MAX_TURNS);
    } catch (err) {
      console.log(`FAIL`);
      console.error(`    ${err.message}`);
      results.failed.push({ skill: agent.skill, error: err.message });
      continue;
    }

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const fileBody = buildRecordingFile({
      skillId: agent.skill,
      phase: args.phase,
      prompt1Body,
      commitSha,
      timestamp,
    });

    try {
      selfCheckParserContract(fileBody);
    } catch (err) {
      console.log(`FAIL (parser-contract self-check)`);
      console.error(`    ${err.message}`);
      console.error(`    This is a script bug — surface for triage.`);
      process.exit(5);
    }

    fs.writeFileSync(outPath, fileBody);
    console.log(`OK (wrote ${path.relative(PROJECT_ROOT, outPath)})`);
    results.ok.push(agent.skill);
  }

  console.log('');
  console.log(`Summary: ${results.ok.length} captured, ${results.failed.length} failed`);
  if (results.failed.length) {
    console.log('Failed:');
    for (const f of results.failed) console.log(`  - ${f.skill}: ${f.error}`);
  }
  console.log('');
  console.log('Next steps (per recording-protocol §6.1 + §4):');
  console.log(`  1. Complete Prompts 2-4 in each ${phaseDir}/*.md file via D2-B manual workflow`);
  console.log(`  2. Run per-file parser validation (recording-protocol §4)`);
  console.log(`  3. Commit ${phaseDir}/ to git`);

  process.exit(results.failed.length === 0 ? 0 : 1);
}

// Module load detection — only run when executed directly.
if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`Unhandled error: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(99);
  }
}

module.exports = {
  PF1_AGENTS,
  PHASE_TO_VERSION,
  PHASE_TO_DIR,
  PHASE_TO_SUFFIX,
  buildRecordingFile,
  selfCheckParserContract,
};
