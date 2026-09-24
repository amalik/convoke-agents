'use strict';

/**
 * run-context — the transport for `run:` blocks.
 *
 * A `run:` block interpolates only PATHS, never objects or contributor-authored
 * values. A `node -e "…"` payload is a double-quoted shell string: JSON
 * substituted into it loses its own quotes, and a value containing an apostrophe
 * is a syntax error (`T136`).
 *
 *   {spec_path}     the spec `step-01` §5 writes. Parsed here, not interpolated.
 *   {context_path}  the generation context: a JSON file, so Step 5 reads what
 *                   Step 4 wrote even in a separate session.
 *
 * `readContext` THROWS on absence rather than returning `{}`, because an empty
 * context makes a correctly generated team fail `checkConfig`, `checkActivation`
 * and `checkRegistryWiring`.
 *
 * `no-process-cwd-in-libs`: every function takes its paths explicitly.
 *
 * Reproduce: node --test tests/team-factory/run-context.test.js
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
  assertAbsolute(specPath, 'loadSpec');
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
 * Deliberately destructive: a context left over from an abandoned run would
 * carry stale paths into the abort manifest, which emits removal instructions
 * against every `created` entry.
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
      `context file not found at ${contextPath} (${err.code || err.message}). ` +
      'Create it before reading it. Do not substitute an empty object: an empty ' +
      'context makes a correctly generated team fail validation.',
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
 * The `expect:` lines in `step-04` §5 call this, so recording a result is a
 * command rather than an instruction an executor can skip.
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
  // Exported, so it is reachable without going through the callers that already check (T168 R1).
  assertAbsolute(target, 'writeAtomic');
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
  assertAbsolute(p, fn);
}

/**
 * A relative path here is a silent two-file bug, not a style question (T168).
 *
 * Every caller is a `run:` block in an add-team step file, and a relative path resolves against
 * whatever directory the executor happens to be in: run step 4 from the repo root and step 5 from
 * anywhere else and `readContext` either throws ENOENT or reads a DIFFERENT context file than
 * `initContext` wrote. The step files pass `{project-root}`-prefixed placeholders; this refuses
 * anything else rather than resolving it against a guess.
 *
 * An UNSUBSTITUTED placeholder is refused too, anywhere in the path. `{project-root}/…` fails
 * `isAbsolute` on its own, but `<root>/…/.factory-context-{team_name_kebab}.json` does not — and a
 * mid-string placeholder is the easier one to miss, since every context path carries two.
 *
 * @param {string} p
 * @param {string} fn - caller name, for the message
 */
function assertAbsolute(p, fn) {
  const unsubstituted = String(p).match(/\{[a-z][a-z0-9_-]*\}/i);
  if (unsubstituted) {
    throw new Error(
      `${fn} was given a path with an unsubstituted placeholder: ${unsubstituted[0]} in ${JSON.stringify(p)}. `
      + 'Substitute every placeholder in the step file before running the block.'
    );
  }
  if (!path.isAbsolute(p)) {
    throw new Error(
      `${fn} needs an absolute path, got ${JSON.stringify(p)}. A relative path resolves against the `
      + "executor's working directory, so the same block run from two directories reads or writes two "
      + 'different files. Use the {project-root}-prefixed placeholder from the step file.'
    );
  }
}

module.exports = { loadSpec, initContext, readContext, recordContext, writeAtomic };
