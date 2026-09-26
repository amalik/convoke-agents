#!/usr/bin/env node
'use strict';

/**
 * Assert that no credential can reach npm on the publish path.
 *
 * WHY THIS IS A SCRIPT (T45). It was inline bash in `ci.yml`'s publish job, and in the healthy steady
 * state it inspected ZERO files: FR4 removed `registry-url:` from `setup-node` precisely so no
 * userconfig is written, so there is no npmrc for the loop to open. It then printed
 * `no npmrc exists on any path npm reads … OK`. The environment assertions were real and did run, but
 * **the file loop had never executed against an npmrc in CI** — observed live in `dist-1-6`'s rehearsal
 * (run 32599414962). A regex that has never matched anything is not a check; it is a plan.
 *
 * Two changes, and they are different in kind:
 *
 *   1. THE RULE CHANGED. On the publish path an npmrc EXISTING is itself the finding, whatever it
 *      contains. FR4's whole point is that this job has no userconfig; a "clean" npmrc appearing means
 *      something wrote one, and the next thing it writes may not be clean. Existence is checkable in the
 *      steady state, which grepping content never was.
 *   2. THE DETECTION IS NOW EXERCISED. Every rule below runs against fixtures in
 *      `tests/unit/npm-credential-scan.test.js`, including a real credential-bearing npmrc, so the regex
 *      is proven able to fire without planting a file on the real publish path — which would undo FR4.
 *
 * Every behaviour the bash had is preserved deliberately; each is pinned by a test. They were all paid
 * for by a defect:
 *   - CR-only line endings are normalised first: npm's `ini` splits on `[\r\n]+` and grep on `\n`, so a
 *     CR-only npmrc is a credential npm honours that a bare grep certifies clean.
 *   - `certfile`/`keyfile` count: `publish.js:144` treats `certfile && keyfile` as credentials.
 *   - The key regex is anchored to a config-key line, so a COMMENT mentioning `_authToken` does not
 *     abort a clean publish.
 *   - An unreadable candidate is fatal, not skipped: `grep -q` returns 2 for "cannot read" and an `if`
 *     collapses that to "no match", reporting an unreadable npmrc as verified-clean.
 *   - Environment names are matched structurally, not by credential spelling:
 *     `npm_config_//registry.npmjs.org/:${X}` with `X=_authToken` delivers a working token while a
 *     word-based regex sees nothing (`@npmcli/config` runs `envReplace` on every key). So any
 *     `npm_config_*` name that is rewritable (`${`) or nerf-darted (`//`, `:`) is rejected too.
 *   - Names are read from a NUL-framed env, never from `env` line output: a benign variable whose VALUE
 *     contains a newline could otherwise forge a match and abort a release on a tag already spent.
 *   - `NODE_AUTH_TOKEN` and `NPM_ID_TOKEN` are separate vectors. The environment outranks every npmrc,
 *     and `oidc.js:50` uses `NPM_ID_TOKEN` in place of the identity GitHub mints.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { findProjectRoot } = require('../update/lib/utils');

// Anchored to a config-key line. The optional `//host/:` prefix is npm's nerf-dart form.
const CREDENTIAL_KEY_RE = /^[ \t]*(\/\/[^\s]*:)?(_authToken|_auth|_password|username|certfile|keyfile)[ \t]*=/;

const CREDENTIAL_WORD_RE = /(_auth|_password|username|certfile|keyfile)/i;

/**
 * Does this npmrc content set a credential key?
 * @param {string} content
 * @returns {boolean}
 */
function setsCredential(content) {
  // `\r` → `\n` before splitting: a CR-only file is one line to `split('\n')` and npm reads it as many.
  return String(content).replace(/\r/g, '\n').split('\n').some((line) => CREDENTIAL_KEY_RE.test(line));
}

/**
 * Every npmrc path npm would read, deduped, in precedence-ish order.
 *
 * Paths come from npm itself where possible rather than from guesses — but the project `.npmrc`
 * OUTRANKS user config and is not gitignored, so it is included explicitly.
 *
 * @param {object} opts
 * @param {object} opts.env
 * @param {string} [opts.home]
 * @param {string} [opts.cwd]
 * @param {string[]} [opts.fromNpm] - values of `npm config get userconfig|globalconfig`
 * @returns {string[]}
 */
function npmrcCandidates({ env = {}, home, cwd, fromNpm = [] }) {
  const raw = [
    ...fromNpm,
    env.NPM_CONFIG_USERCONFIG,
    env.NPM_CONFIG_GLOBALCONFIG,
    home ? path.join(home, '.npmrc') : '',
    cwd ? path.join(cwd, '.npmrc') : '',
  ];
  const seen = new Set();
  const out = [];
  for (const candidate of raw) {
    // `npm config get` prints the string `undefined` when unset — a real path check would then stat a
    // file literally named "undefined".
    if (!candidate || candidate === 'undefined') continue;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    out.push(candidate);
  }
  return out;
}

/**
 * `npm_config_*` environment names that npm would honour as credentials or rewrite into one.
 * @param {object} env
 * @returns {string[]}
 */
function badNpmEnvNames(env = {}) {
  return Object.keys(env)
    .filter((name) => /^npm_config_/i.test(name))
    .filter((name) => name.includes('${') || name.includes('//') || name.includes(':')
      || CREDENTIAL_WORD_RE.test(name))
    .sort();
}

/**
 * Every reason this environment must not publish.
 *
 * @param {object} opts
 * @param {object} opts.env
 * @param {string} [opts.home]
 * @param {string} [opts.cwd]
 * @param {string[]} [opts.fromNpm]
 * @param {object} [opts.fsImpl] - injectable for tests
 * @returns {{fatal: string[], candidates: string[], present: string[]}}
 */
function check({ env = {}, home, cwd, fromNpm = [], fsImpl = fs }) {
  const fatal = [];
  const candidates = npmrcCandidates({ env, home, cwd, fromNpm });
  const present = [];

  for (const candidate of candidates) {
    let stat;
    try {
      stat = fsImpl.statSync(candidate);
    } catch {
      continue; // absent — the expected state on the publish path
    }
    present.push(candidate);
    if (!stat.isFile()) {
      fatal.push(`'${candidate}' exists on the publish path but is not a regular file.`);
      continue;
    }
    let content;
    try {
      content = fsImpl.readFileSync(candidate, 'utf8');
    } catch (err) {
      // Unreadable is fatal, never "clean": see the header.
      fatal.push(`'${candidate}' exists on the publish path and cannot be read (${err.code || 'unknown'}).`);
      continue;
    }
    // The rule is EXISTENCE. Content is reported because it changes how urgent this is, not whether it
    // fails: FR4 leaves this job with no userconfig, so anything here was written by something.
    fatal.push(setsCredential(content)
      ? `'${candidate}' exists on the publish path AND sets a credential key.`
      : `'${candidate}' exists on the publish path. It sets no credential key, but FR4 leaves this job `
        + 'with no npmrc at all — something wrote this one, and the next thing it writes may carry a token.');
  }

  if (env.NODE_AUTH_TOKEN) {
    fatal.push('NODE_AUTH_TOKEN is set. A token in the environment takes precedence over OIDC; '
      + 'this job publishes via Trusted Publishing and must have no token at all.');
  }
  const badEnv = badNpmEnvNames(env);
  if (badEnv.length > 0) {
    fatal.push(`npm_config_* credential or rewritable key(s) in the environment: ${badEnv.join(' ')}. `
      + 'npm reads config from the environment above every npmrc, so these outrank OIDC.');
  }
  if (env.NPM_ID_TOKEN) {
    fatal.push('NPM_ID_TOKEN is set. It overrides the ID token GitHub mints for this workflow '
      + '(oidc.js:50), so the exchange would run against a supplied assertion.');
  }

  return { fatal, candidates, present };
}

/**
 * `npm config get <key>`, or '' when npm cannot answer.
 * @param {string} key
 * @returns {string}
 */
function npmConfigGet(key) {
  try {
    return execFileSync('npm', ['config', 'get', key], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function main() {
  const fromNpm = [npmConfigGet('userconfig'), npmConfigGet('globalconfig')];
  // `findProjectRoot()` rather than `process.cwd()` (project rule `no-process-cwd-in-libs`). npm's
  // project config is the CWD's `.npmrc`; in the publish job the step runs at the repository root, so
  // the two coincide. A caller running from a subdirectory should pass `cwd` explicitly.
  const { fatal, present } = check({
    env: process.env,
    home: process.env.HOME,
    cwd: findProjectRoot(),
    fromNpm,
  });
  if (fatal.length > 0) {
    for (const reason of fatal) console.error(`FATAL: ${reason}`);
    return 1;
  }
  // Says what was actually established: no npmrc exists, and the three environment vectors are unset.
  console.log('npm credential check: no npmrc on any path npm reads '
    + `(${present.length} present of the paths checked); NODE_AUTH_TOKEN, npm_config_* and NPM_ID_TOKEN clean -- OK`);
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = {
  CREDENTIAL_KEY_RE,
  setsCredential,
  npmrcCandidates,
  badNpmEnvNames,
  check,
  main,
};
