#!/usr/bin/env node

'use strict';

/**
 * @module scripts/convoke-register-skill
 *
 * Story v63-2-4: interactive + non-interactive CLI for registering a custom
 * BMM-dependent skill in `_bmad/_config/bmm-dependencies.csv`. Closes the loop
 * between Story 2.2's `unregistered-custom-skill` honest-warning category and
 * operator action — operators see a warning from `convoke-doctor` and can run
 * `/bmad-register-skill` (or this CLI directly) to register the skill without
 * hand-editing the CSV.
 *
 * Bin entry: `convoke-register-skill` (see package.json).
 *
 * Exit codes:
 *   0 — success (write committed + post-write verification passed OR skipped via --yes)
 *   1 — validation or write failure (explicit NFR9 carve-out; registration is
 *       an operator-intended write op, silent failure would violate expectation)
 * 130 — SIGINT during interactive prompt (no CSV mutation)
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const { findProjectRoot } = require('./update/lib/utils');

// ─── Constants ────────────────────────────────────────────────────

const DEPENDENCY_TYPE_ENUM = ['frontmatter', 'code-reference', 'capability_extension'];
const RESERVED_REGISTERED_BY = 'auto-scan';
const REQUIRED_FLAGS = ['skill', 'agent', 'type'];

// R1-M1 / R2-D2 / R2-M2: prefix list for known BMM agents + allowlist for
// standalone agents whose names don't match a prefix. `bmad-tea` (Master Test
// Architect) is the canonical example — add future standalones here as the
// BMM roster evolves.
const BMM_AGENT_PREFIXES = ['bmad-agent-', 'bmad-cis-', 'bmad-testarch-'];
const BMM_AGENT_ALLOWLIST = ['bmad-tea'];

// ─── Argument parsing ─────────────────────────────────────────────

/**
 * Parse process.argv-style array into a flat flag object. Supports:
 *   `--skill name` / `--skill=name`
 * Booleans (no value): `--yes`, `--dry-run`, `--help`, `-h`, `-y`.
 *
 * Error cases surfaced via `result.errors` (non-empty → caller exits 1):
 *   - Unknown `--flag` token (R1-M3).
 *   - `--skill` with no value or next token starts with `-` (R1-H3).
 *   - Same long-flag specified twice (R1-M2).
 *
 * All string values are trimmed on assignment (R1-M5) to keep interactive
 * and non-interactive paths consistent — interactive `ask()` already trims.
 *
 * @param {string[]} argv - Raw arg array (typically `process.argv.slice(2)`).
 * @returns {{skill?:string,agent?:string,type?:string,source?:string,email?:string,yes:boolean,dryRun:boolean,help:boolean,errors:string[]}}
 */
function parseArgs(argv) {
  const result = { yes: false, dryRun: false, help: false, errors: [] };
  const longMap = {
    skill: 'skill', agent: 'agent', type: 'type',
    source: 'source', email: 'email',
  };
  const seen = new Set();
  const assign = (key, rawValue, token) => {
    if (seen.has(key)) {
      result.errors.push(`--${key} specified multiple times (token: ${token})`);
      return;
    }
    seen.add(key);
    // R1-M5: trim to match interactive ask() behavior. Preserves empty-string
    // semantics for downstream validation ("" fails the non-empty check).
    result[key] = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { result.help = true; continue; }
    if (a === '--yes' || a === '-y') { result.yes = true; continue; }
    if (a === '--dry-run') { result.dryRun = true; continue; }
    // --key=value form
    if (a.startsWith('--') && a.includes('=')) {
      const eq = a.indexOf('=');
      const key = a.slice(2, eq);
      const value = a.slice(eq + 1);
      if (!longMap[key]) {
        // R1-M3: unknown flag rejected explicitly.
        result.errors.push(`unknown flag: --${key} (see --help for valid flags)`);
        continue;
      }
      assign(longMap[key], value, a);
      continue;
    }
    // --key value form
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (!longMap[key]) {
        result.errors.push(`unknown flag: ${a} (see --help for valid flags)`);
        continue;
      }
      const nextToken = argv[i + 1];
      // R1-H3 (refined by R2): reject missing-value (end of argv) or when the
      // next token is unambiguously a long-flag (`--something`). Narrower than
      // the initial R1 implementation which used `.startsWith('-')` — legitimate
      // values CAN start with a single dash (emails like `-alice@foo.com`,
      // negative numbers, source-module names like `-internal`). Only the
      // `--` prefix is unambiguously flag-shaped.
      if (nextToken === undefined || (typeof nextToken === 'string' && nextToken.startsWith('--'))) {
        result.errors.push(`${a} requires a value (got: ${nextToken === undefined ? '<end of arguments>' : nextToken})`);
        continue;
      }
      assign(longMap[key], nextToken, a);
      i++;
      continue;
    }
    // Anything else is an unrecognized positional argument.
    result.errors.push(`unexpected positional argument: ${a}`);
  }
  return result;
}

// ─── Validation ──────────────────────────────────────────────────

/**
 * Pure validator: given a partially-populated input object + projectRoot,
 * return `{ok, errors, warnings}`. Tests call this directly via `_internal`.
 *
 * @param {{skill?:string,agent?:string,type?:string,source?:string,email?:string}} input
 * @param {string} projectRoot - Absolute project root.
 * @returns {{ok:boolean,errors:string[],warnings:string[]}}
 */
function validateInput(input, projectRoot) {
  const errors = [];
  const warnings = [];
  const { skill, agent, type, source, email } = input;

  // skill_name — existence check under .claude/skills/ with path-traversal guard.
  if (!skill || typeof skill !== 'string' || skill.length === 0) {
    errors.push('--skill is required (non-empty string)');
  } else if (/[\\/]/.test(skill) || skill.includes('\0') || skill.includes('..') || skill.startsWith('.')) {
    // R1-H4: reject path-traversal or path-like values. A skill name must be
    // a single directory name under `.claude/skills/` — no slashes, no `..`,
    // no leading-dot hidden names, no embedded null bytes.
    errors.push(
      `Invalid --skill: '${skill}'. Skill names must be a simple directory name ` +
      `under .claude/skills/ — no path separators, '..' segments, leading '.', or null bytes.`
    );
  } else {
    const skillsRoot = path.join(projectRoot, '.claude', 'skills');
    const skillDir = path.join(skillsRoot, skill);
    // R1-H4 belt-and-braces: even if the regex above missed something exotic,
    // verify path.relative confirms skillDir is a DIRECT child of skillsRoot.
    const relative = path.relative(skillsRoot, skillDir);
    if (relative.includes('..') || relative.includes(path.sep) || relative.length === 0) {
      errors.push(`Invalid --skill: '${skill}' resolves outside .claude/skills/`);
    } else {
      // R2-H3: symlink-based traversal bypass. fs.statSync() follows symlinks,
      // so `.claude/skills/evil -> /etc` would pass all the lexical/regex guards
      // above and report `isDirectory=true` for the target. Check `lstatSync`
      // first to see the entry's own type; if it's a symlink, resolve via
      // `realpathSync` and verify the real target is still contained within
      // `realpath(skillsRoot)`. If resolution escapes the skills root (or the
      // realpath fails outright), reject.
      let skillExists;
      try {
        const lstat = fs.lstatSync(skillDir);
        if (lstat.isSymbolicLink()) {
          const realSkill = fs.realpathSync(skillDir);
          const realRoot = fs.realpathSync(skillsRoot);
          const realRelative = path.relative(realRoot, realSkill);
          if (realRelative.includes('..') || realRelative.includes(path.sep) || realRelative.length === 0) {
            errors.push(
              `Invalid --skill: '${skill}' is a symlink resolving outside .claude/skills/ (target: ${realSkill}). ` +
              `Symlinks pointing outside the skills root are rejected to prevent registry pollution.`
            );
            skillExists = false;
          } else {
            // Symlink contained within the skills root — safe; proceed with
            // normal directory check against the real path.
            skillExists = fs.statSync(realSkill).isDirectory();
          }
        } else {
          skillExists = lstat.isDirectory();
        }
      } catch (_e) { skillExists = false; }
      if (!skillExists && errors.every(e => !e.includes('symlink'))) {
        errors.push(
          `Unknown skill: '${skill}'. No directory at .claude/skills/${skill}/ ` +
          `— run \`ls .claude/skills/\` to see available skills.`
        );
      }
    }
  }

  // bmm_agent — warn (not error) on unrecognized agent. R1-M1: check explicit
  // BMM prefixes (not `_inferSourceModule`, which is a generic skill-name
  // inferrer that also accepts `convoke-*`, `q-*`, `wds-*` — all non-BMM).
  // R2-D2: dropped `bmad-agent-bme-` from the prefix list — it's a strict
  // subset of `bmad-agent-`, so inclusion was redundant.
  // R2-M2: added an exact-match allowlist for standalone BMM agents whose
  // name doesn't match a prefix (e.g. `bmad-tea` = Master Test Architect).
  if (!agent || typeof agent !== 'string' || agent.length === 0) {
    errors.push('--agent is required (non-empty string)');
  } else {
    const matchesBmmPrefix = BMM_AGENT_PREFIXES.some(p => agent.startsWith(p));
    const isBmmAllowlist = BMM_AGENT_ALLOWLIST.includes(agent);
    if (!matchesBmmPrefix && !isBmmAllowlist) {
      warnings.push(
        `Unrecognized BMM agent: '${agent}'. Proceeding anyway; ` +
        `expected prefixes are ${BMM_AGENT_PREFIXES.map(p => `'${p}*'`).join(', ')}, ` +
        `or one of the standalone agents: ${BMM_AGENT_ALLOWLIST.map(a => `'${a}'`).join(', ')}. ` +
        `Verify the agent exists before relying on this registration.`
      );
    }
  }

  // dependency_type — strict enum
  if (!type || typeof type !== 'string' || type.length === 0) {
    errors.push('--type is required (non-empty string)');
  } else if (!DEPENDENCY_TYPE_ENUM.includes(type)) {
    errors.push(
      `Invalid --type: '${type}'. Must be one of: ${DEPENDENCY_TYPE_ENUM.join(', ')}.`
    );
  }

  // source_module — non-empty if provided (default 'unknown' applied later)
  if (source !== undefined && (typeof source !== 'string' || source.length === 0)) {
    errors.push('--source must be a non-empty string if provided');
  }

  // registered_by (email) — reject the reserved scanner value
  if (email === RESERVED_REGISTERED_BY) {
    errors.push(
      `'${RESERVED_REGISTERED_BY}' is reserved for the scan tool. Registration rows ` +
      `must carry an operator identifier so mergePreservingManual treats them as manual rows ` +
      `and preserves them byte-identical across re-scans. Provide any other value ` +
      `(email, username, 'operator').`
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Assemble a row object from validated inputs, applying defaults for optional
 * fields and auto-populating `registered_date` (UTC YYYY-MM-DD).
 *
 * @param {{skill:string,agent:string,type:string,source?:string,email?:string}} input
 * @returns {{skill_name:string,bmm_agent:string,dependency_type:string,source_module:string,registered_by:string,registered_date:string}}
 */
function buildRow(input) {
  return {
    skill_name: input.skill,
    bmm_agent: input.agent,
    dependency_type: input.type,
    source_module: (input.source && input.source.length > 0) ? input.source : 'unknown',
    registered_by: (input.email && input.email.length > 0) ? input.email : 'operator',
    registered_date: _todayIso(),
  };
}

/** UTC YYYY-MM-DD. Mirrors Story 2.1's `_internal._todayIso` to keep output consistent. */
function _todayIso() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Duplicate detection ─────────────────────────────────────────

/**
 * Scan the existing CSV for a row whose triple-key matches the candidate.
 * Returns the matching row or null.
 *
 * @param {object} candidate - The row shape returned by `buildRow`.
 * @param {string} csvPath - Absolute CSV path.
 * @returns {object|null}
 */
function checkDuplicate(candidate, csvPath) {
  const audit = require('./audit/audit-bmm-dependencies');
  if (!fs.existsSync(csvPath)) return null;
  const existing = audit.readExistingCsv(csvPath);
  const newKey = audit._internal._tripleKey(candidate);
  return existing.find(r => audit._internal._tripleKey(r) === newKey) || null;
}

// ─── CSV write ───────────────────────────────────────────────────

// R2-H2: hoist SharedArrayBuffer allocation to module scope. Created ONCE at
// load time, reused across all retry iterations and all lock acquisitions.
// Wrapped in try/catch so hardened Node environments without SharedArrayBuffer
// support degrade gracefully (the `Atomics.wait` sleep becomes a noop spin,
// still functional though less efficient).
let _LOCK_WAIT_BUFFER = null;
try {
  _LOCK_WAIT_BUFFER = new Int32Array(new SharedArrayBuffer(4));
} catch (_sabErr) {
  // SharedArrayBuffer unavailable — fall back to setTimeout-based spin.
  _LOCK_WAIT_BUFFER = null;
}

function _lockSleep(ms) {
  if (_LOCK_WAIT_BUFFER !== null) {
    Atomics.wait(_LOCK_WAIT_BUFFER, 0, 0, ms);
  } else {
    // Fallback busy-spin on platforms without SharedArrayBuffer. Inefficient
    // but rare; avoids a hard dependency on the SAB primitive.
    const end = Date.now() + ms;
    while (Date.now() < end) { /* spin */ }
  }
}

/**
 * Acquire an exclusive advisory lock on the CSV before the read-compute-write
 * sequence (R1-H1). `_atomicWrite` protects a single writer from crash-induced
 * partial files, but does NOT protect against two concurrent invocations both
 * reading the same baseline and one clobbering the other's row.
 *
 * Implementation: create `${csvPath}.lock` with the exclusive flag (`wx`) so
 * `openSync` fails if the lock already exists. Retry briefly (registration is
 * ~ms-scale, so concurrent collisions should clear quickly). If the lock can't
 * be acquired within the retry budget, surface an actionable error — the
 * operator can inspect the `.lock` file and remove it if it's stale.
 *
 * @param {string} csvPath - Absolute CSV path.
 * @param {() => void} fn - Synchronous critical section.
 */
function _withCsvLock(csvPath, fn) {
  const lockPath = `${csvPath}.lock`;
  fs.ensureDirSync(path.dirname(lockPath));
  const maxAttempts = 20;
  const retryDelayMs = 50;
  let fd = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      fd = fs.openSync(lockPath, 'wx');
      break;
    } catch (err) {
      if (err && err.code === 'EEXIST' && attempt < maxAttempts - 1) {
        _lockSleep(retryDelayMs);
        continue;
      }
      if (err && err.code === 'EEXIST') {
        const lockErr = new Error(
          `Could not acquire registration lock at ${lockPath} within ${maxAttempts * retryDelayMs}ms — ` +
          `another convoke-register-skill process may be running, or the lock is stale. ` +
          `If no other process is registering, remove the lock file and retry: rm ${lockPath}`
        );
        lockErr.cause = err;
        throw lockErr;
      }
      throw err;
    }
  }
  try {
    // Write our pid into the lock for forensic diagnosis of stuck locks.
    try { fs.writeSync(fd, String(process.pid)); } catch (_wErr) { /* best-effort */ }
    fn();
  } finally {
    // R2-H2: only release / delete the lock if we actually acquired it. A
    // defensive `fd !== null` guard protects against a code-path where the
    // for loop exits without either break or throw (shouldn't happen today,
    // but the guard ensures we never delete another process's valid lock).
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (_cErr) { /* ignore */ }
      try { fs.unlinkSync(lockPath); } catch (_uErr) { /* ignore; next attempt will EEXIST + retry */ }
    }
  }
}

/**
 * Append a registration row to `_bmad/_config/bmm-dependencies.csv`, preserving
 * existing rows byte-identical (no re-sort). Atomic write via Story 2.1's
 * `_atomicWrite`, wrapped in an advisory lock (R1-H1) so concurrent
 * registrations don't clobber each other. Creates the file with header if
 * absent.
 *
 * @param {object} row - The row shape returned by `buildRow`.
 * @param {string} csvPath - Absolute CSV path.
 */
function writeRow(row, csvPath) {
  const audit = require('./audit/audit-bmm-dependencies');
  _withCsvLock(csvPath, () => {
    let existingRows = [];
    if (fs.existsSync(csvPath)) {
      existingRows = audit.readExistingCsv(csvPath);
    } else {
      // Fresh install: ensure the parent directory exists before atomic write.
      fs.ensureDirSync(path.dirname(csvPath));
    }
    // Preserve existing order; append new row at the end. renderCsv does NOT
    // sort — it iterates in array order — so this inherits order preservation
    // from Story 2.1 + formula-sanitization + RFC 4180 quoting for free.
    const allRows = [...existingRows, row];
    const contents = audit.renderCsv(allRows);
    audit._internal._atomicWrite(csvPath, contents);
  });
}

// ─── Post-write verification ─────────────────────────────────────

/**
 * Apply the same formula-sanitization rule the upstream audit tool's
 * `_sanitizeFormula` uses when rendering CSV rows (R2-H1): prepend a single
 * `'` to any value whose first character is `=`, `+`, `-`, `@`, `\t`, or `\r`
 * (OWASP CSV-injection mitigation). Mirrored locally rather than imported
 * because the audit tool doesn't currently export this helper and modifying
 * the upstream module is out of scope for Story 2.4. Kept in lock-step with
 * `scripts/audit/audit-bmm-dependencies.js:176-185` — if the upstream rule
 * ever changes, this helper needs the matching update.
 *
 * @param {string|null|undefined} value
 * @returns {string}
 */
function _sanitizeForCompare(value) {
  if (value == null) return '';
  const s = String(value);
  if (s.length === 0) return s;
  const first = s.charAt(0);
  if (first === '=' || first === '+' || first === '-' || first === '@' || first === '\t' || first === '\r') {
    return `'${s}`;
  }
  return s;
}

/**
 * Verify a registration landed in the CSV by direct row-equality lookup
 * (deliberately NOT `checkBmmDependencies`, which collapses findings above
 * `BMM_DRIFT_SUMMARY_THRESHOLD` and can't answer per-skill questions).
 *
 * R1-M4: compares ALL 6 fields, not just the triple-key — a `writeRow` bug
 * that persists the correct triple but corrupts `source_module`/`registered_by`/
 * `registered_date` would otherwise pass verification green.
 *
 * R2-H1: apply the upstream formula-sanitization rule to candidate fields
 * before comparing. Without this, values starting with `=+-@\t\r` (e.g.
 * `--email -alice@example.com`) persist as `'-alice@example.com` but the
 * candidate row carries the un-sanitized `-alice@example.com`, producing a
 * false-positive mismatch and suppressing the `REGISTERED:` marker.
 *
 * @param {object} row - The row shape returned by `buildRow`.
 * @param {string} csvPath - Absolute CSV path.
 * @returns {{ok:boolean, error?:string, mismatch?:string}}
 */
function verifyRegistration(row, csvPath) {
  try {
    const audit = require('./audit/audit-bmm-dependencies');
    const rows = audit.readExistingCsv(csvPath);
    const target = audit._internal._tripleKey(row);
    const match = rows.find(r => audit._internal._tripleKey(r) === target);
    if (!match) {
      return { ok: false };
    }
    // Triple found — compare full row in the same sanitization space as the
    // writer used (R2-H1). `renderCsv` writes each field through
    // `_sanitizeFormula`, which leaves the leading `'` byte in the persisted
    // CSV. Apply the identical rule to each candidate field before diffing.
    const fields = ['skill_name', 'bmm_agent', 'dependency_type', 'source_module', 'registered_by', 'registered_date'];
    const diffs = [];
    for (const f of fields) {
      const expectedPersisted = _sanitizeForCompare(row[f]);
      if (match[f] !== expectedPersisted) {
        diffs.push(`${f}: expected '${expectedPersisted}', got '${match[f]}'`);
      }
    }
    if (diffs.length > 0) {
      return { ok: false, mismatch: diffs.join('; ') };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err && err.message) || String(err) };
  }
}

// ─── Interactive prompts ─────────────────────────────────────────

/**
 * Prompt for any missing required fields via readline. Returns the completed
 * input object or exits 130 on SIGINT.
 *
 * NOT exposed via _internal — tests drive the non-interactive path via flags
 * rather than simulating stdin. Manual dev-box verification covers this path.
 *
 * @param {object} partial - Flags already provided on the command line.
 * @returns {Promise<object>} Completed input object.
 */
function promptMissingFields(partial) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const cleanup = () => { try { rl.close(); } catch (_e) { /* noop */ } };

    // SIGINT from the terminal → exit 130 with no CSV mutation. readline by
    // default handles Ctrl+C by emitting 'SIGINT'; we bind our own handler so
    // the CLI exits cleanly rather than leaving a dangling prompt.
    rl.on('SIGINT', () => {
      cleanup();
      console.log('');
      console.log(chalk.yellow('  Cancelled — no registration written.'));
      process.exit(130);
    });

    const ask = (question, fallback) => new Promise((res) => {
      const prompt = fallback !== undefined
        ? `${question} [${fallback}]: `
        : `${question}: `;
      rl.question(prompt, (answer) => {
        const trimmed = (answer || '').trim();
        res(trimmed.length > 0 ? trimmed : (fallback !== undefined ? fallback : ''));
      });
    });

    (async () => {
      try {
        const result = { ...partial };
        if (!result.skill) result.skill = await ask('Skill name (e.g. my-custom-skill)');
        if (!result.agent) result.agent = await ask('BMM agent it depends on (e.g. bmad-agent-pm)');
        if (!result.type) result.type = await ask(`Dependency type (${DEPENDENCY_TYPE_ENUM.join(' / ')})`);
        if (result.source === undefined) result.source = await ask('Source module', 'unknown');
        if (result.email === undefined) result.email = await ask('Registered by (email or identifier)', 'your-email@example.com');
        cleanup();
        resolve(result);
      } catch (err) {
        cleanup();
        reject(err);
      }
    })();
  });
}

// ─── Rendering ───────────────────────────────────────────────────

function renderHelp() {
  const lines = [
    '',
    chalk.bold('convoke-register-skill') + ' — register a custom BMM-dependent skill in the governance registry',
    '',
    'Usage:',
    '  convoke-register-skill --skill <name> --agent <agent> --type <type> [options]',
    '',
    'Required:',
    '  --skill <name>      Skill directory name under .claude/skills/',
    '  --agent <agent>     BMM agent the skill depends on (e.g. bmad-agent-pm)',
    `  --type <type>       One of: ${DEPENDENCY_TYPE_ENUM.join(' | ')}`,
    '',
    'Optional:',
    '  --source <module>   Source module label (default: "unknown" for user custom skills)',
    `  --email <identifier> Operator identifier (default: "operator"). MUST NOT be "${RESERVED_REGISTERED_BY}".`,
    '  --yes, -y           Skip post-write verification (for CI use)',
    '  --dry-run           Validate + print the row that would be written; no mutation',
    '  --help, -h          Show this help',
    '',
    'Interactive mode:',
    '  If any required flag is missing, the CLI prompts for it interactively.',
    '  Pass all required flags to run non-interactively (suitable for scripts / CI).',
    '',
    'Example:',
    '  convoke-register-skill \\',
    '    --skill my-custom-skill --agent bmad-agent-pm --type frontmatter \\',
    '    --email alice@example.com --yes',
    '',
  ];
  for (const l of lines) console.log(l);
}

/**
 * Render validation errors + warnings with chalk. Returns nothing; tests
 * monkey-patch console.log to capture output.
 *
 * @param {{errors:string[], warnings:string[]}} result
 */
function renderValidationIssues(result) {
  for (const w of result.warnings || []) {
    console.log(chalk.yellow(`  ⚠ ${w}`));
  }
  for (const e of result.errors || []) {
    console.log(chalk.red(`  ✗ ${e}`));
  }
}

// ─── Main ────────────────────────────────────────────────────────

/**
 * CLI entry. Returns a promise that resolves to an exit code; caller invokes
 * `process.exit(code)`. Separated so tests can in-process drive main() without
 * spawning a subprocess (though most tests use runScript for end-to-end).
 *
 * @param {string[]} argv - Raw argv slice (typically `process.argv.slice(2)`).
 * @returns {Promise<number>} Exit code.
 */
async function main(argv) {
  // R2-M5: pre-scan argv for --help / -h BEFORE parseArgs. Without this,
  // `convoke-register-skill --skill --help` would fail with "--skill requires
  // a value (got: --help)" instead of rendering help. Help should always win
  // regardless of surrounding argv state.
  if (argv.includes('--help') || argv.includes('-h')) {
    renderHelp();
    return 0;
  }

  const flags = parseArgs(argv);
  if (flags.help) { renderHelp(); return 0; }

  // R1-H3 / R1-M2 / R1-M3: surface argv parse errors BEFORE project-root
  // detection so operators get a clear "you mistyped a flag" signal instead
  // of falling into interactive mode or hitting a generic validation error.
  if (flags.errors && flags.errors.length > 0) {
    for (const msg of flags.errors) {
      console.log(chalk.red(`  ✗ ${msg}`));
    }
    console.log(chalk.gray('    Run with --help for flag reference.'));
    return 1;
  }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(chalk.red('  ✗ Not inside a Convoke project (no _bmad/ directory found).'));
    console.log(chalk.gray('    Run: npx -p convoke-agents convoke-install'));
    return 1;
  }

  // Collect input — flags first, then interactive prompts for anything missing.
  let input = {
    skill: flags.skill,
    agent: flags.agent,
    type: flags.type,
    source: flags.source,
    email: flags.email,
  };

  const missingRequired = REQUIRED_FLAGS.some(k => !input[k]);
  if (missingRequired) {
    // R1-M8: refuse to prompt when stdin isn't a TTY. Piped / CI / non-TTY
    // invocations would either hang on `rl.question` waiting for input that
    // never comes, or silently accept empty answers + fallback defaults,
    // producing a registration the operator never intended. Fail fast with
    // an actionable error listing the missing flags.
    if (!process.stdin.isTTY) {
      const missing = REQUIRED_FLAGS.filter(k => !input[k]).map(k => `--${k}`);
      console.log(chalk.red(
        `  ✗ Missing required flags in non-interactive context: ${missing.join(', ')}.`
      ));
      console.log(chalk.gray('    Provide all required flags, or run from a terminal to use interactive prompts.'));
      console.log(chalk.gray('    Run with --help for the full flag reference.'));
      return 1;
    }
    // Interactive fill-in.
    try {
      input = await promptMissingFields(input);
    } catch (err) {
      console.log(chalk.red(`  ✗ Prompt failed: ${(err && err.message) || String(err)}`));
      return 1;
    }
  }

  // Validate.
  const validation = validateInput(input, projectRoot);
  renderValidationIssues(validation);
  if (!validation.ok) return 1;

  // Build row + check duplicate.
  const row = buildRow(input);
  const audit = require('./audit/audit-bmm-dependencies');
  const csvPath = path.join(projectRoot, audit.OUTPUT_CSV_REL);
  const duplicate = checkDuplicate(row, csvPath);
  if (duplicate) {
    // R1-M6: fall back to an operator-actionable message when the existing
    // row has empty metadata (hand-edited CSV, truncated fields). Otherwise
    // the error reads `"already registered by  on "` with no way to locate
    // the conflict.
    const hasMetadata = (duplicate.registered_by && duplicate.registered_by.length > 0)
      && (duplicate.registered_date && duplicate.registered_date.length > 0);
    const attribution = hasMetadata
      ? `already registered by ${duplicate.registered_by} on ${duplicate.registered_date}`
      : 'already registered (existing row has incomplete metadata — inspect `_bmad/_config/bmm-dependencies.csv` manually to locate it)';
    console.log(chalk.red(
      `  ✗ Duplicate triple: ${row.skill_name}/${row.bmm_agent}/${row.dependency_type} ${attribution}. ` +
      `Use a different dependency_type, or edit the CSV manually to update.`
    ));
    return 1;
  }

  // Dry-run: render the row that would be written + exit 0.
  if (flags.dryRun) {
    console.log(chalk.cyan('  Dry-run — row that would be written:'));
    console.log('    ' + JSON.stringify(row));
    console.log(chalk.gray(`    (CSV path: ${audit.OUTPUT_CSV_REL})`));
    return 0;
  }

  // Write.
  try {
    writeRow(row, csvPath);
  } catch (err) {
    console.log(chalk.red(`  ✗ Registration failed: ${(err && err.message) || String(err)}`));
    console.log(chalk.gray('    Fix hint: verify filesystem permissions on _bmad/_config/ ' +
      'or hand-edit the CSV following the header schema.'));
    return 1;
  }

  // Render the green success line (human-readable) immediately after the
  // write succeeds. The machine-parseable `REGISTERED:` marker is emitted
  // AFTER verification (R1-L8) so LLM parsers reading stdout can trust
  // `REGISTERED:` as a "verified persisted" marker rather than just
  // "write call returned without throwing".
  console.log(chalk.green(
    `  ✓ Registered: ${row.skill_name} → ${row.bmm_agent} (${row.dependency_type})`
  ));

  const tripleKey = audit._internal._tripleKey(row);

  if (flags.yes) {
    // Verification explicitly skipped — emit the marker with a gray note so
    // downstream parsers know the verification contract wasn't exercised.
    console.log(`REGISTERED: ${tripleKey}`);
    console.log(chalk.gray('  (post-write verification skipped under --yes)'));
    console.log(chalk.gray('  Run `convoke-doctor` for a full governance health check.'));
    return 0;
  }

  // Post-write verification (R1-L8: emit REGISTERED marker ONLY on success).
  const verification = verifyRegistration(row, csvPath);
  if (!verification.ok) {
    if (verification.error) {
      console.log(chalk.yellow(
        `  ⚠ Post-write verification skipped — ${verification.error}`
      ));
    } else if (verification.mismatch) {
      // R1-M4: full-row compare found a field-level difference.
      console.log(chalk.yellow(
        `  ⚠ Registration written but persisted row has unexpected fields: ${verification.mismatch}`
      ));
      console.log(chalk.gray('    Investigate: run `cat _bmad/_config/bmm-dependencies.csv` manually.'));
    } else {
      console.log(chalk.yellow(
        `  ⚠ Registration written but ${tripleKey} triple not found in CSV re-read.`
      ));
      console.log(chalk.gray('    Investigate: run `cat _bmad/_config/bmm-dependencies.csv` manually.'));
    }
    // Verification failure is fail-soft — the write itself succeeded. Do NOT
    // emit the REGISTERED: marker (R1-L8): LLM parsers keying on that string
    // should only see it when the row is both written AND verified.
    console.log(chalk.gray('  Run `convoke-doctor` for a full governance health check.'));
    return 0;
  }

  console.log(`REGISTERED: ${tripleKey}`);
  console.log(chalk.gray('  Run `convoke-doctor` for a full governance health check.'));
  return 0;
}

// ─── Exports ─────────────────────────────────────────────────────

module.exports = {
  main,
  // R2-L5 pattern (from Story 2.3): Object.freeze prevents test-order leaks
  // via mutable require.cache entries. Helpers exposed for unit-level testing
  // without spawning the CLI.
  _internal: Object.freeze({
    parseArgs,
    validateInput,
    buildRow,
    checkDuplicate,
    writeRow,
    _withCsvLock,
    verifyRegistration,
    _todayIso,
    DEPENDENCY_TYPE_ENUM,
    RESERVED_REGISTERED_BY,
  }),
};

// CLI entrypoint.
if (require.main === module) {
  main(process.argv.slice(2))
    .then(code => process.exit(code))
    .catch(err => {
      console.log(chalk.red(`  ✗ Unexpected error: ${(err && err.message) || String(err)}`));
      process.exit(1);
    });
}
