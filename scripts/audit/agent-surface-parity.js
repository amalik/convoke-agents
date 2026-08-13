#!/usr/bin/env node
/**
 * agent-surface-parity.js — deterministic agent-surface comparison across two git refs.
 *
 * WHY THIS EXISTS
 * ---------------
 * Replaces the LLM-judged PF1 behavioural-equivalence gate (M9) for the operator-facing
 * surfaces that can be checked exactly. The PF1 battery asked "do agents behave the same?"
 * by recording activation transcripts and scoring them with an LLM judge. Three problems,
 * all established empirically on 2026-08-13:
 *
 *   1. It measured noise. The Path B+ control agent `stack-detective` had BYTE-IDENTICAL
 *      source across the two compared commits, yet its recordings differed substantially
 *      (list -> table, title text, added prose). One capture per phase, no repeat-capture
 *      control, so agent run-to-run variance was confounded with migration effect and was
 *      evidently as large. Backlog I131.
 *   2. It cost ~6 hr of manual capture per cycle, forever.
 *   3. Convoke's agents are markdown in git. The behavioural question is downstream of a
 *      mechanical one that `git show` answers exactly, for free.
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

  return { rows, findings };
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

module.exports = { agentFilesAt, menuCodes, loadsConfig, compare, _internal: { git } };
