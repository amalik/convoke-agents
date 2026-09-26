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
// BOTH WHITESPACE CLASSES ARE `\s`. R2 widened the LEADING class and left the one before the `=` as
// `[ \t\f\v]` — the same defect, one character position over. Driven through npm's own `ini`, 11
// characters in that position (U+00A0, U+1680, U+2000, U+2002, U+2009, U+202F, U+205F, U+3000, U+2028,
// U+2029, U+FEFF) each produced a live credential key while this returned false (R3).
// ARRAY-APPEND FORM: `ini` parses `…:_authToken[]=tok` to `['tok']`, and npm-registry-fetch interpolates
// that into `Bearer tok` — a working credential the `["']?…=` shape could not match (R3).
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
const CREDENTIAL_KEY_RE = /^\s*["']?(\/\/[^ \t\f\v\r\n]*:)?(_authToken|_auth|_password|username|certfile|keyfile)(\[\])?["']?\s*=/;

const CREDENTIAL_WORD_RE = /(_auth|_password|username|certfile|keyfile)/i;

// npm config keys that are credentials in their own right, or that repoint npm at another config file.
// `cert`/`key` are inline PEM client credentials — `CREDENTIAL_WORD_RE` matches `certfile`/`keyfile` but
// not these (R2). `userconfig`/`globalconfig` do not carry a credential; they name the file that does.
// The subset of DANGEROUS_CONFIG_KEYS that names ANOTHER FILE or TREE rather than carrying a secret. Only
// these can be exempted by matching npm's own reported value — see `badNpmEnvNames`.
const REPOINTING_KEYS = new Set(['userconfig', 'globalconfig', 'prefix']);

const DANGEROUS_CONFIG_KEYS = new Set([
  'userconfig',
  'globalconfig',
  // `prefix` relocates npm's global tree, which is how `npm root -g` is derived — so it moves where this
  // scan LOOKS for the builtin npmrc without moving where npm READS it. Setting it was a complete bypass
  // of the builtin check (R3).
  'prefix',
  'cert',
  'key',
  'ca',
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
      // Checked, not assumed: a partial `fsImpl` from a test threw a TypeError the bare catch swallowed,
      // running the dedupe silently off and unable to tell (R3).
      if (typeof fsImpl.realpathSync !== 'function') throw new Error('no realpathSync');
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
function isFile(p, fsImpl = fs) {
  try { return fsImpl.statSync(p).isFile(); } catch { return false; }
}

function isDir(p, fsImpl = fs) {
  try { return fsImpl.statSync(p).isDirectory(); } catch { return false; }
}

function npmLocalPrefix(startDir, fsImpl = fs) {
  if (!startDir) return startDir;
  let dir = path.resolve(startDir);
  for (;;) {
    // npm's `loadLocalPrefix` uses `fileExists` for `package.json` and `dirExists` for `node_modules`;
    // `existsSync` accepted a DIRECTORY named package.json and a FILE named node_modules, stopping the
    // walk one level below npm and hiding the npmrc npm actually loads (R3).
    if (isFile(path.join(dir, 'package.json'), fsImpl)
      || isDir(path.join(dir, 'node_modules'), fsImpl)) return dir;
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
function badNpmEnvNames(env = {}, benign = []) {
  const benignValues = new Set(benign.filter(Boolean));
  return Object.keys(env)
    .filter((name) => /^npm_config_/i.test(name))
    // npm's `loadEnv` skips an empty value outright (`envVal === '' continue`), so an `env:` entry
    // interpolating an unset secret sets nothing — refusing it refused a correct configuration (R3).
    .filter((name) => env[name] !== '' && env[name] !== undefined)
    .filter((name) => {
      const key = name.slice('npm_config_'.length).toLowerCase();
      // `npm run` injects userconfig/globalconfig/prefix set to npm's OWN answers, so the scan refused in
      // any environment npm itself created. A value npm already reports is not a finding; a DIFFERENT
      // value for the same key still is.
      //
      // SCOPED TO THOSE THREE KEYS ONLY. A first attempt applied this exemption before every other rule,
      // which meant the benign list could whitelist a credential: `npm_config__authToken=tok` with `tok`
      // among npm's answers passed. The exemption is about a path npm named, never about a secret's value.
      if (!REPOINTING_KEYS.has(key)) return true;
      // A repointing key is exempt only if it names exactly what npm already reports, and only if nothing
      // else about the name is suspicious.
      const structural = name.includes('${') || name.includes('//') || name.includes(':')
        || CREDENTIAL_WORD_RE.test(name);
      return structural || !benignValues.has(env[name]);
    })
    .filter((name) => {
      // npm slices a fixed 11 characters and lowercases. It ALSO maps `_` to `-` for keys not starting
      // `//`, which this does not — harmless while no key below contains a dash, and a trap the moment
      // one does (R3).
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
 * @param {string[]} [opts.benign] - values npm itself reports, so an env var repeating one is not a finding
 * @param {object} [opts.fsImpl] - injectable for tests
 * @returns {{fatal: string[], candidates: string[], builtin: string[], present: string[]}}
 */
function check({
  env = {}, home, cwd, fromNpm = [], extra = [], builtin = [], degraded = [], benign = [], fsImpl = fs,
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
    // Stat first, so `present` means the same thing in both loops and a non-regular path is not reported
    // as an uninspected credential source: npm's own `#loadFile` catches the identical read error, loads
    // no config, and `validate()` skips this source — such a path provably carries nothing. It also keeps
    // `readFileSync` off a FIFO, which would block with no timeout (R3).
    if (!isFile(candidate, fsImpl)) continue;
    present.push(candidate);
    let content;
    try {
      content = fsImpl.readFileSync(candidate, 'utf8');
    } catch (err) {
      fatal.push(`npm's builtin npmrc '${candidate}' cannot be read (${err.code || 'unknown'}). `
        + 'It is the one config file npm reads that this scan judges by content, so an unreadable one is '
        + 'an uninspected credential source.');
      continue;
    }
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
  const badEnv = badNpmEnvNames(env, benign);
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
  let raw;
  try {
    raw = execFileSync('npm', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    return { ok: false, out: '', err: (err && (err.code || err.message)) || 'unknown' };
  }
  // A zero exit is not an answer. R2 fixed only the non-zero branch, so npm exiting 0 with EMPTY output
  // still dropped the source and printed the same OK line as a clean run — verbatim the defect the header
  // claimed closed. Multi-line or relative output is no better: it was used whole as a path, stat'd
  // ENOENT, silently skipped, and still counted in the `N path(s) checked` figure (R3).
  const out = String(raw).trim();
  if (!out) return { ok: false, out: '', err: 'npm exited 0 but printed nothing' };
  if (out.includes('\n')) return { ok: false, out: '', err: 'npm printed multiple lines' };
  return { ok: true, out, err: '' };
}

/**
 * Every path npm might read its BUILTIN npmrc from, deduped.
 *
 * npm reads it at `resolve(npmPath, 'npmrc')`, where `npmPath` is npm's own install directory. R2 derived
 * it from `npm root -g`, which is `resolve(prefix, 'lib', 'node_modules')` — and `prefix` is settable from
 * the environment, so `npm_config_prefix=/tmp/x` moved where this scan LOOKED without moving where npm
 * READS. That was a complete bypass, and in reverse it aborted releases over a file npm never opens (R3).
 *
 * `prefix` is now refused outright, and the path is taken from the npm BINARY as well, which `prefix` does
 * not move. Both are checked: extra candidates cost nothing under the content rule, because a path that
 * does not exist is skipped and only a credential in one that does is a finding.
 *
 * @param {string[]} fromRootG - what `npm root -g` reported, if it could be asked
 * @returns {string[]}
 */
function npmBuiltinCandidates(fromRootG = []) {
  const out = [];
  const add = (p) => { if (p && !out.includes(p)) out.push(p); };
  for (const root of fromRootG) add(path.join(root, 'npm', 'npmrc'));
  // From the npm binary: <prefix>/bin/npm is a symlink into <prefix>/lib/node_modules/npm/bin/npm-cli.js.
  // Not gated on npm being runnable — resolving a path needs no subprocess, and gating it made the
  // prefix-independent route depend on the very tool whose answer it exists to distrust.
  const which = resolveNpmDir();
  add(which ? path.join(which, 'npmrc') : '');
  return out;
}

/**
 * npm's own install directory, resolved through the binary rather than through `prefix`.
 * @returns {string}
 */
function resolveNpmDir() {
  for (const candidate of [process.env.npm_execpath, findOnPath('npm')]) {
    if (!candidate) continue;
    try {
      let real = fs.realpathSync(candidate);
      // .../lib/node_modules/npm/bin/npm-cli.js -> .../lib/node_modules/npm
      while (real && path.basename(real) !== 'npm' && real !== path.dirname(real)) real = path.dirname(real);
      // Must be npm's install DIRECTORY. A wrapper script on PATH named `npm` that is not a symlink
      // resolves to itself, whose basename is also `npm` — returning a file here would then synthesise a
      // nonexistent `<file>/npmrc` candidate.
      if (real && path.basename(real) === 'npm' && isDir(real)) return real;
    } catch { /* not resolvable — try the next candidate */ }
  }
  return '';
}

/**
 * @param {string} bin
 * @returns {string} the first match on PATH, or ''
 */
function findOnPath(bin) {
  for (const dir of String(process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    const full = path.join(dir, bin);
    try { fs.statSync(full); return full; } catch { /* keep looking */ }
  }
  return '';
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
  const root = npmExec(['root', '-g']);
  const builtin = npmBuiltinCandidates(root.ok ? [root.out] : []);
  if (builtin.length === 0) {
    degraded.push(`npm's builtin npmrc could not be located (\`npm root -g\`: ${root.err || 'ok'}); `
      + 'it is the one config source judged by content, so it cannot be skipped');
  }

  // `ci.yml` passes `--cwd "$PWD"`. `findProjectRoot()` alone was a real loss: it returns null outside a
  // `_bmad` tree, and the file is then never examined while the OK line still prints. The project root is
  // ALSO checked, because a subdirectory run should not miss the repo's own file; `check()` dedupes.
  // R2 checked only that a value was PRESENT, so `--cwd=<path>` (the conventional Node spelling, and the
  // one an operator following the playbook would type), `--cwd --verbose <path>`, and `--cwd <missing dir>`
  // each certified a tree holding a live token as clean. A guard must not be defeatable by argument shape.
  const eqFlag = argv.find((a) => a.startsWith('--cwd='));
  const cwdFlag = argv.indexOf('--cwd');
  let cwd;
  if (eqFlag) cwd = eqFlag.slice('--cwd='.length);
  else if (cwdFlag >= 0) cwd = argv[cwdFlag + 1];
  if ((eqFlag || cwdFlag >= 0) && !cwd) {
    console.error('FATAL: --cwd was given with no value. Refusing to guess which project npmrc npm '
      + 'would read; pass `--cwd "$PWD"` or omit the flag entirely.');
    return 1;
  }
  if (cwd && cwd.startsWith('-')) {
    console.error(`FATAL: --cwd was given '${cwd}', which is a flag, not a directory. Refusing to treat `
      + 'it as the project path.');
    return 1;
  }
  if (cwd && !isDir(cwd)) {
    console.error(`FATAL: --cwd '${cwd}' is not a directory. Refusing to certify a tree that does not `
      + 'exist — the project npmrc npm would read cannot be established from it.');
    return 1;
  }
  const projectRoot = findProjectRoot();
  const start = cwd || projectRoot;
  // npm reads `<localPrefix>/.npmrc`, which is not `<cwd>/.npmrc` from a subdirectory.
  const localPrefix = start ? npmLocalPrefix(start) : start;
  const prefixAnswer = npmExec(['config', 'get', 'prefix']);
  const { fatal, candidates, builtin: builtinChecked } = check({
    env: process.env,
    home: process.env.HOME,
    cwd: localPrefix,
    extra: projectRoot ? [path.join(projectRoot, '.npmrc')] : [],
    builtin,
    degraded,
    // Values npm itself reports. An `npm_config_*` variable repeating one of these is npm's own lifecycle
    // environment, not a finding; a different value for the same key still is (R3).
    benign: [...fromNpm, prefixAnswer.ok ? prefixAnswer.out : ''],
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
  npmBuiltinCandidates,
  badNpmEnvNames,
  check,
  main,
};
