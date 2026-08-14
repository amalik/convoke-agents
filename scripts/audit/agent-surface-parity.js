#!/usr/bin/env node
/**
 * agent-surface-parity.js — deterministic agent-surface comparison across two git refs.
 *
 * WHY THIS EXISTS
 * ---------------
 * Replaces the LLM-judged PF1 behavioural-equivalence gate (M9) for the operator-facing
 * surfaces that can be checked exactly. The PF1 battery asked "do agents behave the same?"
 * by recording activation transcripts and scoring them with an LLM judge. Three problems:
 *
 *   1. After 10 weeks it had produced nothing interpretable. The protocol captures each
 *      prompt ONCE per phase (`RUNS_PER_AGENT = 3` controls judge variance, not agent
 *      variance), so there is no noise floor to judge any difference against — and the one
 *      agent positioned to establish one, the Path B+ control `stack-detective`, turned out
 *      to be contaminated. See ADR-001 §1.
 *   2. It cost ~6 hr of manual capture per cycle, forever.
 *   3. Convoke's agents are markdown in git. The behavioural question is downstream of a
 *      mechanical one that `git show` answers exactly, for free — PROVIDED the check reads
 *      the whole executed surface (see `wrapperTemplates`).
 *
 * NOTE (2026-08-14): an earlier version of this header claimed PF1 "measured noise", citing
 * `stack-detective`'s byte-identical source against differing recordings. That inference was
 * WITHDRAWN — the agent executes through a generated, gitignored wrapper whose generator DID
 * change between those commits, so the control was never a control. Backlog I131, which
 * quantified it, is retracted; do not cite its numbers. The rewritten reasoning above does
 * not depend on it.
 *
 * This tool answers the mechanical question. It does NOT claim to prove behavioural
 * equivalence — an LLM reading identical definitions can still phrase things differently,
 * and that is precisely the variance PF1 could not separate from signal. What it proves is
 * that the CONTRACT an operator depends on is unchanged: which agents exist, what menu
 * codes they answer to, and whether their activation sequence still loads config.
 *
 * FORMAT-AGNOSTIC BY CONSTRUCTION
 * -------------------------------
 * Agent definitions exist in two shapes that both ship today: flat `<agent>.md` and
 * `<agent>/SKILL.md`, with menus encoded either as XML `<item cmd="XX ...">[XX] Label</item>`
 * or as a markdown table row `| XX | ... |`. A format-specific extractor manufactures false
 * findings — during development, a table-only matcher reported Liam's menu as empty when it
 * was simply still in XML form. Every extractor here accepts both shapes.
 *
 * Usage:
 *   node scripts/audit/agent-surface-parity.js <base-ref> <head-ref>
 *   node scripts/audit/agent-surface-parity.js v3.3.0 HEAD
 *
 * Exit codes:
 *   0  parity holds (or only additions)
 *   1  usage error
 *   2  parity BROKEN — an agent or menu code was removed/renamed
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');

const AGENT_ROOT = '_bmad/bme';

/** Run git, returning stdout or null when the path/ref does not exist. */
function git(projectRoot, args) {
  try {
    return execFileSync('git', args, {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

/**
 * Agent definition files under `_bmad/bme/` at a ref, keyed by agent id.
 * Accepts both `<agent>.md` and `<agent>/SKILL.md`; excludes `references/` sidecars,
 * which are content, not contract.
 */
function agentFilesAt(projectRoot, ref) {
  const out = git(projectRoot, ['ls-tree', '-r', '--name-only', ref]);
  if (out === null) return null;
  const agents = new Map();
  for (const f of out.split('\n')) {
    if (!f.startsWith(`${AGENT_ROOT}/`) || !f.endsWith('.md')) continue;
    if (!f.includes('/agents/')) continue;
    if (f.includes('/references/')) continue;
    const id = f.endsWith('/SKILL.md')
      ? path.basename(path.dirname(f))
      : path.basename(f, '.md');
    // A directory-form definition supersedes a flat one of the same id.
    if (!agents.has(id) || f.endsWith('/SKILL.md')) agents.set(id, f);
  }
  return agents;
}

/**
 * Menu codes declared by an agent definition, format-agnostic.
 * Matches `[XX]` (XML menu items) and `| XX |` (markdown table rows).
 */
function menuCodes(text) {
  const codes = new Set();
  for (const m of text.matchAll(/\[([A-Z]{2,3})\]/g)) codes.add(m[1]);
  for (const m of text.matchAll(/^\|\s*([A-Z]{2,3})\s*\|/gm)) codes.add(m[1]);
  return [...codes].sort();
}

/** Does the activation sequence still load config? (MO7 class ⑤, coarse but exact.) */
function loadsConfig(text) {
  return /config\.yaml|load.{0,20}config|config.{0,20}load/i.test(text);
}

const GENERATOR = 'scripts/update/lib/refresh-installation.js';
const WRAPPER_BASELINE = '.github/expected-wrapper-template.txt';

/**
 * The static skeleton of every generated agent-wrapper template, at `ref`.
 *
 * WHY THIS EXISTS (ADR-001 §3, added 2026-08-14). An agent executes TWO files: the tracked
 * `_bmad/bme/**\/agents/<id>.md`, and the generated `.claude/skills/<id>/SKILL.md` that wraps it.
 * The wrapper is gitignored, so a diff of `agents/**` cannot see it — and a real, migration-caused
 * instruction change hid there for 10 weeks, silently contaminating PF1's control agent and the
 * argument this ADR was originally built on (`FOLLOW every step in the <activation> section
 * precisely` -> `FOLLOW the activation steps precisely`).
 *
 * A parity gate that only read `agents/**` would inherit the exact blind spot it replaced. The
 * wrapper's GENERATOR is tracked, so the surface is recoverable: extract the template literals and
 * diff those.
 *
 * `${...}` interpolations are normalised away — they carry the per-agent id/name, which varies by
 * agent and is already covered by the agent-level checks above. What is compared is the fixed
 * instruction text every agent receives.
 */
function wrapperTemplates(projectRoot, ref) {
  // `git()` signals failure by RETURNING null, it does not throw — so a try/catch here catches
  // nothing and the next line dereferences null. Caught by the test below, 2026-08-14.
  const src = git(projectRoot, ['show', `${ref}:${GENERATOR}`]);
  if (!src) return []; // absent/unreadable generator — caller fails closed on an empty result
  const templates = [];
  const START = 'const content = `';
  let i = src.indexOf(START);
  while (i !== -1) {
    const end = scanTemplate(src, i + START.length);
    if (end === -1) return []; // unterminated — treat as extraction failure, which fails closed
    templates.push(src.slice(i + START.length, end).replace(/\$\{[^}]*\}/g, '${}'));
    i = src.indexOf(START, end);
  }
  return templates;
}

/**
 * Index of the backtick closing the template literal that starts at `start`, or -1.
 *
 * An earlier version counted a single `depth` that incremented on `${` but decremented on ANY
 * bare `}`. A brace from an object literal or block inside an interpolation — `${ {a:1}.a }` —
 * therefore zeroed the depth early, and a subsequent backtick (a NESTED template literal, which
 * is ordinary in generator code) was then misread as the closing one. The literal was silently
 * TRUNCATED, so a real change in the discarded tail produced no finding at all: the gate went
 * green while the wrapper had changed. That is the precise failure this check exists to prevent,
 * reproduced inside the check itself. Found by review 2026-08-14; not live at the time — today's
 * generator has no braces or backticks inside its interpolations — but one edit away from it.
 *
 * Tracking a context stack instead makes nesting explicit: template ⊃ interpolation ⊃ template.
 * Quoted strings are skipped wholesale so a brace or backtick inside one cannot desync the count.
 */
function scanTemplate(src, start) {
  const ctx = ['tpl']; // innermost context last
  const braces = []; // unclosed `{` count for each open interpolation
  for (let j = start; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') {
      j++; // escaped char, whatever it is
      continue;
    }
    if (ctx[ctx.length - 1] === 'tpl') {
      if (c === '`') {
        ctx.pop();
        if (ctx.length === 0) return j; // closed the outermost literal
        continue;
      }
      if (c === '$' && src[j + 1] === '{') {
        ctx.push('expr');
        braces.push(1);
        j++;
      }
      continue;
    }
    // inside ${ ... }
    if (c === '`') {
      ctx.push('tpl');
      continue;
    }
    if (c === '{') {
      braces[braces.length - 1]++;
      continue;
    }
    if (c === '}') {
      if (--braces[braces.length - 1] === 0) {
        braces.pop();
        ctx.pop();
      }
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      for (j++; j < src.length; j++) {
        if (src[j] === '\\') {
          j++;
          continue;
        }
        if (src[j] === quote) break;
      }
    }
  }
  return -1; // unterminated
}

function compare(projectRoot, baseRef, headRef) {
  const base = agentFilesAt(projectRoot, baseRef);
  const head = agentFilesAt(projectRoot, headRef);
  if (!base) throw Object.assign(new Error(`ref not found: ${baseRef}`), { exitCode: 1 });
  if (!head) throw Object.assign(new Error(`ref not found: ${headRef}`), { exitCode: 1 });

  const findings = [];
  const rows = [];

  for (const [id, basePath] of [...base].sort()) {
    const headPath = head.get(id);
    if (!headPath) {
      findings.push({ severity: 'BROKEN', id, detail: `agent removed (was ${basePath})` });
      rows.push({ id, codes: 'REMOVED', config: '-', moved: '-' });
      continue;
    }
    const baseText = git(projectRoot, ['show', `${baseRef}:${basePath}`]) || '';
    const headText = git(projectRoot, ['show', `${headRef}:${headPath}`]) || '';

    const bCodes = menuCodes(baseText);
    const hCodes = menuCodes(headText);
    const lost = bCodes.filter((c) => !hCodes.includes(c));
    const gained = hCodes.filter((c) => !bCodes.includes(c));

    if (lost.length) {
      findings.push({
        severity: 'BROKEN',
        id,
        detail: `menu codes removed: ${lost.join(', ')} — operators invoking these get "Not recognized"`,
      });
    }
    if (gained.length) {
      findings.push({ severity: 'INFO', id, detail: `menu codes added: ${gained.join(', ')}` });
    }
    if (loadsConfig(baseText) && !loadsConfig(headText)) {
      findings.push({
        severity: 'BROKEN',
        id,
        detail: 'activation no longer references config loading (MO7 class ⑤)',
      });
    }

    rows.push({
      id,
      codes: lost.length ? `LOST ${lost.join(',')}` : `${hCodes.length} preserved`,
      config: loadsConfig(headText) ? 'yes' : 'NO',
      moved: basePath === headPath ? '' : `${basePath} -> ${headPath}`,
    });
  }

  for (const id of [...head.keys()].sort()) {
    if (!base.has(id)) findings.push({ severity: 'INFO', id, detail: 'agent added' });
  }

  // The generated wrapper is part of the executed surface (see wrapperTemplates).
  const wBase = wrapperTemplates(projectRoot, baseRef);
  const wHead = wrapperTemplates(projectRoot, headRef);
  if (wBase.length === 0 || wHead.length === 0) {
    // Fail loudly rather than silently reporting parity we did not check. If the generator is
    // refactored so the templates no longer match, "found nothing" must not read as "nothing
    // changed" — that is the exact false-negative this whole check exists to prevent.
    findings.push({
      severity: 'BROKEN',
      id: '(wrapper)',
      detail:
        `wrapper templates could not be extracted (base ${wBase.length}, head ${wHead.length}) — ` +
        `the extractor in agent-surface-parity.js needs updating for ${GENERATOR}`,
    });
  } else {
    // Between two RELEASES the wrapper is expected to change — it did across 3.x -> 4.0. Diffing
    // base->head would therefore leave this permanently red, and a gate nobody can get to green
    // is a gate nobody reads. Compare HEAD against a COMMITTED baseline instead, the same shape
    // as `.github/expected-python-tests.txt`: drift fails, and the fix is to acknowledge it by
    // updating the baseline in the same commit. That way the check fires exactly when someone
    // changes the executed surface WITHOUT noticing — the failure mode that actually occurred.
    const current = wHead.join('\n~~~\n');
    let baseline = null;
    try {
      baseline = fs.readFileSync(path.join(projectRoot, WRAPPER_BASELINE), 'utf8');
    } catch {
      /* absent — reported below */
    }
    if (baseline === null) {
      findings.push({
        severity: 'BROKEN',
        id: '(wrapper)',
        detail: `baseline ${WRAPPER_BASELINE} is missing — cannot verify the generated wrapper`,
      });
    } else if (baseline.trimEnd() !== current.trimEnd()) {
      findings.push({
        severity: 'BROKEN',
        id: '(wrapper)',
        detail:
          `the generated agent wrapper changed and the baseline was not updated. Agents EXECUTE ` +
          `through this file; it is gitignored, so no diff of agents/** can see it.\n` +
          diffLines(baseline, current) +
          `\n         If this change is intended, update ${WRAPPER_BASELINE} in the SAME commit ` +
          `and say why in the message.`,
      });
    }
    // Informational: what the operator-facing wrapper did between the two refs. Not a failure.
    if (wBase.join('\n~~~\n') !== current) {
      findings.push({
        severity: 'INFO',
        id: '(wrapper)',
        detail: `wrapper changed between ${baseRef} and ${headRef}:\n${diffLines(wBase.join('\n'), wHead.join('\n'))}`,
      });
    }
  }

  return { rows, findings };
}

/** Line-level diff, enough to show which instruction moved. */
function diffLines(a, b) {
  const A = a.split('\n');
  const B = b.split('\n');
  const setB = new Set(B);
  const setA = new Set(A);
  const out = [];
  for (const l of A) if (!setB.has(l) && l.trim()) out.push(`           - ${l}`);
  for (const l of B) if (!setA.has(l) && l.trim()) out.push(`           + ${l}`);
  return out.join('\n');
}

function main(argv) {
  const [baseRef, headRef] = argv.slice(2);
  if (!baseRef || !headRef) {
    console.error('Usage: agent-surface-parity.js <base-ref> <head-ref>');
    console.error('   e.g. agent-surface-parity.js v3.3.0 HEAD');
    return 1;
  }
  const projectRoot = findProjectRoot();
  const { rows, findings } = compare(projectRoot, baseRef, headRef);

  console.log(`Agent surface parity: ${baseRef} -> ${headRef}\n`);
  const w = Math.max(...rows.map((r) => r.id.length), 5);
  for (const r of rows) {
    console.log(
      `  ${r.id.padEnd(w)}  menu: ${r.codes.padEnd(14)} config-load: ${r.config}` +
        (r.moved ? `\n  ${' '.repeat(w)}  moved: ${r.moved}` : '')
    );
  }

  const broken = findings.filter((f) => f.severity === 'BROKEN');
  const info = findings.filter((f) => f.severity === 'INFO');
  console.log('');
  for (const f of info) console.log(`  INFO   ${f.id}: ${f.detail}`);
  for (const f of broken) console.log(`  BROKEN ${f.id}: ${f.detail}`);

  if (broken.length) {
    console.log(`\n✗ FAIL — ${broken.length} parity break(s) across ${rows.length} agents.`);
    return 2;
  }
  console.log(
    `\n✓ PASS — ${rows.length} agents, menu codes and config-load preserved.` +
      `\n  Proves contract parity, NOT behavioural equivalence (see file header).`
  );
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  agentFilesAt,
  menuCodes,
  loadsConfig,
  compare,
  wrapperTemplates,
  scanTemplate,
  _internal: { git },
};
