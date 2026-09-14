'use strict';

/**
 * run-context — the transport for `run:` blocks. tfr-1-1 (T136).
 *
 * THE PROBLEM THIS EXISTS TO REMOVE. Every `run:` block in the add-team workflow
 * is `node -e "…"`, a DOUBLE-quoted shell string. Substituting a JS object into
 * it destroys the object before node sees it, because the outer `"` terminates
 * on the JSON's first `"`:
 *
 *   run: node -e "const s = {"team_name":"forge"}; …"
 *   shell hands node:  const s = {team_name:forge};   -> SyntaxError
 *
 * Not only for values containing quotes — plain JSON already fails. So the
 * blocks could never be pasted verbatim, which is what `T136` records and what
 * `T130`'s signature fixes could not reach.
 *
 * THE CONTRACT. A block interpolates only PATHS, never objects. Two paths:
 *
 *   {spec_path}     the spec `step-01` §5 already writes to
 *                   `_bmad-output/planning-artifacts/team-spec-<kebab>.yaml`.
 *                   NOT a new file — `spec-parser.js::parseSpec` already takes a
 *                   path, and `step-04`'s Placeholders table already defines
 *                   `{spec_data}` as the parse of exactly this file. Writing the
 *                   spec to a second JSON file would duplicate on-disk state,
 *                   which is the drift class tfr-1-1 Task 3 exists to delete.
 *
 *   {context_path}  the generation context, which previously lived only in the
 *                   executor's head. `step-05-validate.md` documented that as a
 *                   live hazard: run steps 4 and 5 in separate sessions and it is
 *                   gone, and `checkConfig`/`checkActivation`/`checkRegistryWiring`
 *                   then report FALSE FAILURES on a correctly generated team.
 *                   Persisting it fixes that as a side effect of fixing the
 *                   transport.
 *
 * Paths are single-quoted at the call site (`rc.loadSpec('{spec_path}')`), the
 * same convention `{project-root}` already uses in every block. POSIX/bash is the
 * supported surface: every CI job is `ubuntu-latest` and `.github/workflows/ci.yml`
 * records Windows as separately tracked.
 *
 * `no-process-cwd-in-libs`: every function takes its paths explicitly. Nothing
 * here falls back to `process.cwd()`.
 */

const fs = require('fs');
const path = require('path');

const { parseSpec } = require('../spec-parser');

/**
 * Parse the team spec at `specPath`.
 *
 * Rejects rather than resolving a null spec: a block that silently received
 * `undefined` would call its writer with no data and fail somewhere less
 * legible. `parseSpec` returns `{valid, spec, errors}` rather than throwing, so
 * the lift to an exception happens here.
 *
 * @param {string} specPath - path to `team-spec-<kebab>.yaml`
 * @returns {Promise<Object>} the parsed spec (the `.spec` of parseSpec's result)
 * @throws {Error} when the file cannot be read or the spec is invalid
 */
async function loadSpec(specPath) {
  if (typeof specPath !== 'string' || specPath.trim() === '') {
    throw new Error(`loadSpec needs a path to the team spec (got ${JSON.stringify(specPath)})`);
  }
  const result = await parseSpec(specPath);
  if (!result.valid || !result.spec) {
    const errs = (result.errors || []).join('; ') || 'unknown parse failure';
    throw new Error(`spec at ${specPath} is not usable: ${errs}`);
  }
  return result.spec;
}

/**
 * Create the generation-context file, replacing any previous run's.
 *
 * Called once at `step-04` §1. Deliberately destructive: a context left over
 * from an abandoned run would carry stale paths into the abort manifest, which
 * emits removal instructions against every `created` entry.
 *
 * @param {string} contextPath - where to write it
 * @param {Object} [seed] - initial keys
 * @returns {Object} the context as written
 */
function initContext(contextPath, seed = {}) {
  assertPath(contextPath, 'initContext');
  if (seed === null || typeof seed !== 'object' || Array.isArray(seed)) {
    throw new Error(`initContext seed must be an object (got ${JSON.stringify(seed)})`);
  }
  fs.mkdirSync(path.dirname(contextPath), { recursive: true });
  writeAtomic(contextPath, seed);
  return seed;
}

/**
 * Read the generation context.
 *
 * THROWS when the file is absent rather than returning `{}`. An empty context is
 * indistinguishable from a correctly generated team whose context was lost, and
 * `step-05`'s own caveat records what that produces: `checkConfig`,
 * `checkActivation` and `checkRegistryWiring` reporting false failures. A loud
 * failure naming the missing file is the only honest answer — the same reasoning
 * that makes `checkContractFiles`' vacuous pass a defect rather than a feature.
 *
 * @param {string} contextPath
 * @returns {Object}
 * @throws {Error} when absent or unparseable
 */
function readContext(contextPath) {
  assertPath(contextPath, 'readContext');
  let raw;
  try {
    raw = fs.readFileSync(contextPath, 'utf8');
  } catch (err) {
    throw new Error(
      `generation context not found at ${contextPath} (${err.code || err.message}). ` +
      'It is created by step-04 §1. Re-run step-04 rather than passing an empty object — ' +
      'an empty context makes a correct team fail validation.',
      { cause: err }
    );
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('context must be a JSON object');
    }
    return parsed;
  } catch (err) {
    throw new Error(`generation context at ${contextPath} is not a JSON object: ${err.message}`, { cause: err });
  }
}

/**
 * Merge one key into the generation context and persist it.
 *
 * This is what the `expect:` lines in `step-04` §5 call, so recording a result
 * is a command the executor pastes rather than an instruction they may skip.
 * `T164`(b) is exactly that skip: §5d said merely "proceed" while §5a-ii and §5c
 * said to record, and `end-to-end-validator.js::checkRegistryWiring` reads the
 * key either way.
 *
 * @param {string} contextPath
 * @param {string} key
 * @param {*} value
 * @returns {Object} the merged context
 */
function recordContext(contextPath, key, value) {
  assertPath(contextPath, 'recordContext');
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error(`recordContext needs a key (got ${JSON.stringify(key)})`);
  }
  const ctx = readContext(contextPath);
  ctx[key] = value;
  writeAtomic(contextPath, ctx);
  return ctx;
}

/**
 * Write JSON to `target` without leaving a half-written file behind.
 *
 * `writeFileSync` to a sibling temp then `renameSync` over the target: rename
 * within a directory is atomic, so a reader sees either the old context or the
 * new one and never a truncated parse. Sibling rather than `os.tmpdir()` so the
 * rename stays on one filesystem.
 *
 * @param {string} target
 * @param {Object} data
 */
function writeAtomic(target, data) {
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  try {
    fs.renameSync(tmp, target);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* the rename failure is what matters */ }
    throw err;
  }
}

/**
 * @param {*} p
 * @param {string} fn - caller name, for the message
 */
function assertPath(p, fn) {
  if (typeof p !== 'string' || p.trim() === '') {
    throw new Error(`${fn} needs a context file path (got ${JSON.stringify(p)})`);
  }
}

module.exports = { loadSpec, initContext, readContext, recordContext, writeAtomic };
