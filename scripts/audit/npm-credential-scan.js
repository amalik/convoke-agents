#!/usr/bin/env node
'use strict';

/**
 * Assert that no credential can reach npm on the publish path.
 *
 * WHY THIS IS A SCRIPT (T45). It was inline bash in `ci.yml`'s publish job (106 lines deleted, 57 of them
 * executable), and in the healthy steady state it inspected ZERO files: FR4 removed `registry-url:` from
 * `setup-node` precisely so no userconfig is written, so there is no npmrc for the loop to open. It then
 * printed `no npmrc exists on any path npm reads … OK`. The environment assertions were real and did run,
 * but **the file loop had never executed against an npmrc in CI** — observed live in `dist-1-6`'s
 * rehearsal (run 32599414962). A regex that has never matched anything is not a check; it is a plan.
 *
 * TWO RULES, because npm has two kinds of config file (R2). `@npmcli/config` has exactly four
 * file-backed sources — `builtin`, `project`, `user`, `global` (`@npmcli/config/lib/index.js`,
 * `confTypes`) — and they do not share a rule:
 *
 *   1. EXISTENCE is the rule for `project`, `user` and `global`. FR4's whole point is that this job has
 *      no userconfig; a "clean" npmrc appearing means something wrote one, and the next thing it writes
 *      may not be clean. Existence is checkable in the steady state, which grepping content never was.
 *   2. CONTENT is the rule for `builtin` — `<npm install dir>/npmrc` — because it legitimately exists on
 *      every install (npm ships one containing `prefix = …`). Existence cannot be the rule for a file
 *      that must be present, so this is the one path where `setsCredential` is the verdict and not just
 *      the urgency. R1 shipped with this source missing from the candidate set entirely: it is reported
 *      by neither `npm config get userconfig` nor `globalconfig`, `Config.validate()` skips it, so a
 *      token appended there was sent by npm while this scan printed OK.
 *
 * A DEGRADED ENUMERATION IS FATAL (R2). Two of the four sources are named by a subprocess. When that
 * subprocess cannot answer, the path is simply dropped and the success line reads the same as a clean
 * run — a guard that cannot see cannot clear. Every failure to enumerate is now a fatal with its own
 * message.
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
 *   - `npm_config_userconfig` / `globalconfig` REPOINT npm at an arbitrary file, and npm honours any
 *     casing (`loadEnv` tests `/^npm_config_/i`), so they are rejected by config key, case-insensitively
 *     — a name-cased spelling defeated both the structural rule and the path lookup (R2).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { findProjectRoot } = require('../update/lib/utils');

// Anchored to a config-key line.
//
// LEADING CLASS: `\s`, matching what npm does — it trims the key with `String.trim()`, and JS `\s` is
// the same set `trim()` strips, the BOM (U+FEFF, ECMAScript `<ZWNBSP>`) included. A UTF-8 BOM and a
// U+00A0 each produced a live `_authToken` key in npm's own `ini` while `[ \t\f\v]` called the file
// clean (R2). An earlier version of this line spelled the class `[\s\uFEFF]` with a comment claiming
// the BOM needed its own term; `\s` already covers it, and the mutation battery caught the redundancy by
// showing the extra term could be deleted with no behaviour change.
// QUOTES: optional, because `ini`'s `unsafe()` strips surrounding quotes, so
// `"//registry.npmjs.org/:_authToken"=tok` is the same key (R2).
// NERF-DART BODY: `[^ \t\f\v\r\n]`, deliberately NOT `[^\s]` — JS `\s` counts U+00A0, which POSIX
// `[[:space:]]` does not, so `[^\s]` would be narrower than the bash this replaced.
const CREDENTIAL_KEY_RE = /^\s*["']?(\/\/[^ \t\f\v\r\n]*:)?(_authToken|_auth|_password|username|certfile|keyfile)["']?[ \t\f\v]*=/;

const CREDENTIAL_WORD_RE = /(_auth|_password|username|certfile|keyfile)/i;

// npm config keys that are credentials in their own right, or that repoint npm at another config file.
// `cert`/`key` are inline PEM client credentials — `CREDENTIAL_WORD_RE` matches `certfile`/`keyfile` but
// not these (R2). `userconfig`/`globalconfig` do not carry a credential; they name the file that does.
const DANGEROUS_CONFIG_KEYS = new Set([
  'userconfig',
  'globalconfig',
  'cert',
  'key',
  'cafile',
]);

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
 * The npmrc paths npm reads under the EXISTENCE rule — `project`, `user` and `global`. The `builtin`
 * source is deliberately absent: it has its own rule and reaches `check()` by its own argument.
 *
 * Paths come from npm itself where possible rather than from guesses — but the project `.npmrc`
 * OUTRANKS user config and is not gitignored, so it is included explicitly.
 *
 * @param {object} opts
 * @param {object} opts.env
 * @param {string} [opts.home]
 * @param {string} [opts.cwd] - npm's `localPrefix`, not the process cwd; see `npmLocalPrefix`
 * @param {string[]} [opts.fromNpm] - values of `npm config get userconfig|globalconfig`
 * @param {string[]} [opts.extra]
 * @param {object} [opts.fsImpl] - injectable; used only to resolve symlinked duplicates
 * @returns {string[]}
 */
function npmrcCandidates({ env = {}, home, cwd, fromNpm = [], extra = [], fsImpl = fs }) {
  // npm honours `npm_config_*` in ANY casing, so the override cannot be read by exact name (R2).
  const envOverride = (key) => {
    const hit = Object.keys(env).find((name) => name.toLowerCase() === `npm_config_${key}`);
    return hit ? env[hit] : '';
  };
  const raw = [
    ...fromNpm,
    envOverride('userconfig'),
    envOverride('globalconfig'),
    home ? path.join(home, '.npmrc') : '',
    cwd ? path.join(cwd, '.npmrc') : '',
    ...extra,
  ];
  const seen = new Set();
  const out = [];
  for (const candidate of raw) {
    // `npm config get` prints the string `undefined` when unset — a real path check would then stat a
    // file literally named "undefined".
    if (!candidate || candidate === 'undefined') continue;
    // Dedupe on the RESOLVED path: an aliased or symlinked `--cwd` named the same file twice and
    // reported one writer as two, and inflated the count on a clean tree (R2).
    let resolved = candidate;
    try {
      resolved = fsImpl.realpathSync(candidate);
    } catch {
      /* absent or unresolvable — fall back to the literal, which `check()` will stat and classify */
    }
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    out.push(candidate);
  }
  return out;
}

/**
 * npm's `localPrefix`: the nearest ancestor of `startDir` containing `package.json` or `node_modules`
 * (`@npmcli/config/lib/index.js`). npm reads the project npmrc at `<localPrefix>/.npmrc`, NOT at
 * `<cwd>/.npmrc` — measured: run from `repo/scripts/sub`, npm reads `repo/.npmrc` and ignores
 * `sub/.npmrc`. Checking `cwd/.npmrc` could therefore abort a publish over a file npm never reads, on a
 * tag already spent (R2).
 *
 * @param {string} startDir
 * @param {object} [fsImpl]
 * @returns {string} the localPrefix, or `startDir` when no ancestor qualifies (npm's own fallback)
 */
function npmLocalPrefix(startDir, fsImpl = fs) {
  if (!startDir) return startDir;
  let dir = path.resolve(startDir);
  for (;;) {
    if (fsImpl.existsSync(path.join(dir, 'package.json'))
      || fsImpl.existsSync(path.join(dir, 'node_modules'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(startDir);
    dir = parent;
  }
}

/**
 * `npm_config_*` environment names that npm would honour as credentials, rewrite into one, or use to
 * repoint its own config file.
 * @param {object} env
 * @returns {string[]}
 */
function badNpmEnvNames(env = {}) {
  return Object.keys(env)
    .filter((name) => /^npm_config_/i.test(name))
    .filter((name) => {
      // npm slices a fixed 11 characters and lowercases, so this is the config key it will set.
      const key = name.slice('npm_config_'.length).toLowerCase();
      return name.includes('${')
        || name.includes('//')
        || name.includes(':')
        || CREDENTIAL_WORD_RE.test(name)
        || DANGEROUS_CONFIG_KEYS.has(key);
    })
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
 * @param {string[]} [opts.extra]
 * @param {string[]} [opts.builtin] - npmrc paths judged by CONTENT, not existence
 * @param {string[]} [opts.degraded] - reasons the enumeration is incomplete; each is fatal
 * @param {object} [opts.fsImpl] - injectable for tests
 * @returns {{fatal: string[], candidates: string[], builtin: string[], present: string[]}}
 */
function check({
  env = {}, home, cwd, fromNpm = [], extra = [], builtin = [], degraded = [], fsImpl = fs,
}) {
  const fatal = [];
  const candidates = npmrcCandidates({ env, home, cwd, fromNpm, extra, fsImpl });
  const present = [];

  // A path we could not even name is not a path we cleared.
  for (const reason of degraded) {
    fatal.push(`the set of npmrc paths npm reads could not be established: ${reason}. `
      + 'A scan that cannot enumerate cannot certify; see docs/npm-publishing-access-playbook.md §6.');
  }

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
      ? `'${candidate}' exists on the publish path AND sets a credential key. setup-node exports `
        + "NODE_AUTH_TOKEN='XXXXX-XXXXX-XXXXX-XXXXX' when it is otherwise unset (authutil.ts:55-57), so "
        + 'npm sends THAT dummy as a bearer token and an OIDC decline is reported as *bad token*, not '
        + '*no token*. See docs/npm-publishing-access-playbook.md §6 "The credential scan refused the publish".'
      : `'${candidate}' exists on the publish path. It sets no credential key, but FR4 leaves this job `
        + 'with no npmrc at all — something wrote this one, and the next thing it writes may carry a token. '
        + 'See docs/npm-publishing-access-playbook.md §6 "The credential scan refused the publish".');
  }

  // The CONTENT rule. This file is supposed to be here, so only what it sets can be the finding.
  for (const candidate of builtin) {
    let content;
    try {
      content = fsImpl.readFileSync(candidate, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') continue; // no builtin npmrc on this install — nothing npm will read
      fatal.push(`npm's builtin npmrc '${candidate}' cannot be read (${err.code || 'unknown'}). `
        + 'It is the one config file npm reads that this scan judges by content, so an unreadable one is '
        + 'an uninspected credential source.');
      continue;
    }
    present.push(candidate);
    if (setsCredential(content)) {
      fatal.push(`npm's builtin npmrc '${candidate}' sets a credential key. It is reported by neither `
        + '`npm config get userconfig` nor `globalconfig` and `Config.validate()` skips it, so npm would '
        + 'send this credential with no warning. See docs/npm-publishing-access-playbook.md §6.');
    }
  }

  if (env.NODE_AUTH_TOKEN) {
    fatal.push('NODE_AUTH_TOKEN is set. A token in the environment takes precedence over OIDC; '
      + 'this job publishes via Trusted Publishing and must have no token at all.');
  }
  const badEnv = badNpmEnvNames(env);
  if (badEnv.length > 0) {
    fatal.push(`npm_config_* credential, rewritable or config-repointing key(s) in the environment: `
      + `${badEnv.join(' ')}. npm reads config from the environment above every npmrc, so these outrank OIDC.`);
  }
  if (env.NPM_ID_TOKEN) {
    fatal.push('NPM_ID_TOKEN is set. It overrides the ID token GitHub mints for this workflow '
      + '(oidc.js:50), so the exchange would run against a supplied assertion.');
  }

  return {
    fatal, candidates, builtin, present,
  };
}

/**
 * Run npm and return what it said, plus whether it could be asked at all.
 *
 * stderr is CAPTURED, not inherited: npm's config warnings would otherwise land in a public CI log
 * (R2). npm prints key names only, so nothing observed leaked — captured because the guarantee should
 * not depend on that.
 *
 * @param {string[]} args
 * @returns {{ok: boolean, out: string, err: string}}
 */
function npmExec(args) {
  try {
    const out = execFileSync('npm', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: String(out).trim(), err: '' };
  } catch (err) {
    return { ok: false, out: '', err: (err && (err.code || err.message)) || 'unknown' };
  }
}

/**
 * @param {string[]} argv
 * @returns {number} exit code
 */
function main(argv = process.argv.slice(2)) {
  const degraded = [];

  // Two of npm's four config sources are named by npm itself. A silent '' here used to drop the path
  // and print the same OK line as a clean run (R2).
  const fromNpm = [];
  for (const key of ['userconfig', 'globalconfig']) {
    const r = npmExec(['config', 'get', key]);
    if (r.ok) fromNpm.push(r.out);
    else degraded.push(`\`npm config get ${key}\` failed (${r.err})`);
  }

  // The builtin npmrc lives beside npm itself and is named by no config key. `npm root -g` gives the
  // directory; `process.execPath` is the fallback so a lost subprocess does not silently drop the one
  // source judged by content.
  const builtin = [];
  const root = npmExec(['root', '-g']);
  if (root.ok && root.out) builtin.push(path.join(root.out, 'npm', 'npmrc'));
  else {
    const guess = path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'npmrc');
    builtin.push(path.resolve(guess));
    degraded.push(`\`npm root -g\` failed (${root.err || 'empty'}); npm's builtin npmrc was guessed at `
      + `'${path.resolve(guess)}' from process.execPath instead of being located`);
  }

  // `ci.yml` passes `--cwd "$PWD"`. `findProjectRoot()` alone was a real loss: it returns null outside a
  // `_bmad` tree, and the file is then never examined while the OK line still prints. The project root is
  // ALSO checked, because a subdirectory run should not miss the repo's own file; `check()` dedupes.
  const cwdFlag = argv.indexOf('--cwd');
  if (cwdFlag >= 0 && !argv[cwdFlag + 1]) {
    console.error('FATAL: --cwd was given with no value. Refusing to guess which project npmrc npm '
      + 'would read; pass `--cwd "$PWD"` or omit the flag entirely.');
    return 1;
  }
  const cwd = cwdFlag >= 0 ? argv[cwdFlag + 1] : undefined;
  const projectRoot = findProjectRoot();
  const start = cwd || projectRoot;
  // npm reads `<localPrefix>/.npmrc`, which is not `<cwd>/.npmrc` from a subdirectory.
  const localPrefix = start ? npmLocalPrefix(start) : start;
  const { fatal, candidates, builtin: builtinChecked } = check({
    env: process.env,
    home: process.env.HOME,
    cwd: localPrefix,
    extra: projectRoot ? [path.join(projectRoot, '.npmrc')] : [],
    builtin,
    degraded,
    fromNpm,
  });
  if (fatal.length > 0) {
    for (const reason of fatal) console.error(`FATAL: ${reason}`);
    return 1;
  }
  // Reports what was ACTUALLY established, which is the whole point of this row: the count is the
  // number of paths INSPECTED, across both rules. An earlier version printed `present.length`, which is
  // provably 0 on this branch — a parenthetical carrying no information, in a message whose predecessor
  // existed to stop exactly that (R1). The count now includes the builtin source, whose absence from it
  // made the same sentence false in a second way (R2).
  console.log(`npm credential check: ${candidates.length + builtinChecked.length} path(s) npm reads were `
    + 'checked (no npmrc on any existence-checked path; no credential key in npm\'s builtin npmrc); '
    + 'NODE_AUTH_TOKEN, npm_config_* and NPM_ID_TOKEN clean -- OK');
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = {
  CREDENTIAL_KEY_RE,
  DANGEROUS_CONFIG_KEYS,
  setsCredential,
  npmrcCandidates,
  npmLocalPrefix,
  badNpmEnvNames,
  check,
  main,
};
