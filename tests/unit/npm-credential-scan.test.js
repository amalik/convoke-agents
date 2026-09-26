'use strict';

/**
 * The publish path's credential guard, exercised.
 *
 * WHY THIS EXISTS (T45). The guard was inline bash in `ci.yml`'s publish job and, in the healthy steady
 * state, inspected ZERO files — FR4 removed `registry-url:` so nothing writes a userconfig — then printed
 * `no npmrc exists on any path npm reads … OK`. Observed live in `dist-1-6`'s rehearsal (run
 * 32599414962). The environment assertions ran; the file loop never did. Every rule below is now run
 * against a fixture, including a real credential-bearing npmrc, so the detection is proven able to fire
 * without planting a file on the real publish path — which would undo FR4.
 *
 * Hermetic on purpose, and it takes TWO mechanisms to be so (R2). `check()` takes `env`, `home`, `cwd`
 * and the `npm config get` values as arguments, so no unit test reads the developer's own `~/.npmrc`.
 * The CLI tests spawn the real script, whose `main()` asks the machine's own npm to name two of npm's
 * four config sources and to locate the builtin npmrc — so they put a STUB `npm` on the child's PATH.
 * Without it, `globalconfig` resolves to something like `/opt/homebrew/etc/npmrc`, and on any machine
 * where that file exists — `/usr/local/etc/npmrc`, `/etc/npmrc`, an nvm or Volta prefix, and not
 * guaranteed absent on a GitHub runner — the clean-tree test fails. That was a latent CI flake, not
 * merely a local one.
 */

const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { execFileSync } = require('child_process');

const {
  setsCredential,
  npmrcCandidates,
  npmLocalPrefix,
  npmBuiltinCandidates,
  badNpmEnvNames,
  check,
} = require('../../scripts/audit/npm-credential-scan');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'audit', 'npm-credential-scan.js');

const STUBS = [];

/**
 * A fake `npm` for the child's PATH, answering only what `main()` asks. See the file header for why the
 * real npm cannot be used here.
 *
 * @param {object} [opts]
 * @param {string} [opts.userconfig] - what `npm config get userconfig` prints
 * @param {string} [opts.globalconfig]
 * @param {string} [opts.root] - what `npm root -g` prints; the builtin npmrc is `<root>/npm/npmrc`
 * @param {boolean} [opts.fail] - npm exits non-zero for everything, i.e. cannot be asked
 * @returns {string} a directory to use as the child's entire PATH
 */
function npmStub({ userconfig = 'undefined', globalconfig = 'undefined', root = '', fail = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-stub-'));
  STUBS.push(dir);
  const body = fail
    ? 'exit 1\n'
    : `case "$*" in
  "config get userconfig") echo '${userconfig}' ;;
  "config get globalconfig") echo '${globalconfig}' ;;
  "root -g") echo '${root || path.join(dir, 'noroot')}' ;;
  *) echo undefined ;;
esac
exit 0
`;
  fs.writeFileSync(path.join(dir, 'npm'), `#!/bin/sh\n${body}`, { mode: 0o755 });
  return dir;
}

/**
 * Run the CLI as CI runs it, with an isolated HOME, an explicit --cwd, and a stub npm.
 * @returns {{status: number, stdout: string, stderr: string}}
 */
function runCli({
  cwd, home, env = {}, stub = {}, args = ['--cwd', cwd], projectRoot = fixtureProjectRoot(),
}) {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, ...args], {
      encoding: 'utf8',
      // The child's CWD, not the test runner's. `main()` calls `findProjectRoot()`, which walks up from
      // `process.cwd()` looking for `_bmad` — so the candidate count depended on where the suite was
      // launched from and on whether the real repo had a `.npmrc`. A benign `engine-strict=true` at the
      // repo root, or running the suite from `/`, turned the count assertions red (R3).
      cwd: projectRoot,
      env: { PATH: npmStub(stub), HOME: home, ...env },
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return { status: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

after(() => {
  for (const dir of STUBS) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A directory that `findProjectRoot()` will resolve to: it holds a `_bmad` marker and no `.npmrc`.
 * @returns {string}
 */
function fixtureProjectRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-root-'));
  STUBS.push(dir);
  fs.mkdirSync(path.join(dir, '_bmad'));
  return dir;
}

function tmpNpmrc(contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-scan-'));
  const file = path.join(dir, '.npmrc');
  fs.writeFileSync(file, contents, 'utf8');
  return { dir, file };
}

describe('setsCredential — every spelling npm authenticates with', () => {
  it('fires on each credential key, bare and nerf-darted', () => {
    for (const line of [
      '_authToken=abc123',
      '//registry.npmjs.org/:_authToken=abc123',
      '_auth=aGk=',
      '_password=hunter2',
      'username=someone',
      // publish.js:144 treats `certfile && keyfile` as credentials exactly like a token.
      'certfile=/tmp/c.pem',
      'keyfile=/tmp/k.pem',
      '  //registry.npmjs.org/:_authToken = abc',
    ]) {
      assert.equal(setsCredential(line), true, `${JSON.stringify(line)} must be seen as a credential`);
    }
  });

  it('does NOT fire on a comment mentioning a credential key', () => {
    // Anchored to a config-key line: a comment must not abort a clean publish.
    assert.equal(setsCredential('# do not put _authToken=… in here'), false);
    assert.equal(setsCredential('; _password=… is forbidden'), false);
  });

  it('does not fire on a benign npmrc', () => {
    assert.equal(setsCredential('registry=https://registry.npmjs.org/\nalways-auth=false\n'), false);
  });

  it('sees a CR-only file, which npm honours and a line-based grep certifies clean', () => {
    // npm's `ini` splits on [\r\n]+; `split('\n')` alone sees one line and misses the key.
    assert.equal(setsCredential('registry=x\r//registry.npmjs.org/:_authToken=abc\r'), true);
  });

  it('tolerates empty and non-string input', () => {
    for (const empty of ['', null, undefined]) assert.equal(setsCredential(empty), false);
  });
});

describe('npmrcCandidates — the paths npm reads', () => {
  it('takes npm\'s own answers, the env overrides, HOME and the project file', () => {
    const got = npmrcCandidates({
      env: { NPM_CONFIG_USERCONFIG: '/env/user', NPM_CONFIG_GLOBALCONFIG: '/env/global' },
      home: '/home/me',
      cwd: '/repo',
      fromNpm: ['/npm/user', '/npm/global'],
    });
    assert.deepEqual(got, ['/npm/user', '/npm/global', '/env/user', '/env/global',
      path.join('/home/me', '.npmrc'), path.join('/repo', '.npmrc')]);
  });

  it('drops the literal string "undefined", which `npm config get` prints when unset', () => {
    const got = npmrcCandidates({ env: {}, fromNpm: ['undefined', ''] });
    assert.deepEqual(got, []);
  });

  it('dedupes, so one file is never reported twice', () => {
    const got = npmrcCandidates({ env: { NPM_CONFIG_USERCONFIG: '/same' }, fromNpm: ['/same'] });
    assert.deepEqual(got, ['/same']);
  });
});

describe('badNpmEnvNames — the environment outranks every npmrc', () => {
  it('rejects a rewritable or nerf-darted name even with no credential word in it', () => {
    // `npm_config_//registry.npmjs.org/:${X}` with X=_authToken delivers a working token while a
    // word-based regex sees nothing: @npmcli/config runs envReplace on every key.
    assert.deepEqual(badNpmEnvNames({ 'npm_config_//registry.npmjs.org/:${X}': '1' }),
      ['npm_config_//registry.npmjs.org/:${X}']);
    assert.deepEqual(badNpmEnvNames({ npm_config_foo: '1' }), []);
  });

  it('rejects every credential spelling, in any case', () => {
    const env = {
      npm_config__authToken: 'a', NPM_CONFIG__PASSWORD: 'b', Npm_Config_username: 'c',
      npm_config_certfile: 'd', npm_config_keyfile: 'e',
    };
    assert.equal(badNpmEnvNames(env).length, 5, JSON.stringify(badNpmEnvNames(env)));
  });

  it('ignores a variable whose VALUE contains a newline or a credential word', () => {
    // The bash read a NUL-framed env for exactly this: `env` line-splits a multi-line VALUE, so a
    // benign variable could forge a match and abort a release on a tag already spent.
    assert.deepEqual(badNpmEnvNames({ BENIGN: 'line1\nnpm_config__authToken=stolen' }), []);
    assert.deepEqual(badNpmEnvNames({ npm_config_registry: 'https://x/\n_authToken=y' }), []);
  });
});

describe('check — the publish path must have no npmrc at all', () => {
  it('passes when nothing exists and the environment is clean', () => {
    const { fatal } = check({ env: {}, home: '/nonexistent-home', cwd: '/nonexistent-repo', fromNpm: [] });
    assert.deepEqual(fatal, []);
  });

  it('FAILS on an npmrc that exists even with no credential in it — existence is the finding', () => {
    // The rule T45 changed. FR4 leaves this job with no userconfig, so a "clean" npmrc means something
    // wrote one, and grepping content was never checkable in the steady state.
    const { dir } = tmpNpmrc('registry=https://registry.npmjs.org/\n');
    try {
      const { fatal, present } = check({ env: {}, cwd: dir, fromNpm: [] });
      assert.equal(fatal.length, 1, JSON.stringify(fatal));
      assert.match(fatal[0], /exists on the publish path/);
      assert.match(fatal[0], /sets no credential key/, 'the message must distinguish this from a token');
      assert.equal(present.length, 1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('says so differently when the npmrc DOES set a credential', () => {
    const { dir } = tmpNpmrc('//registry.npmjs.org/:_authToken=npm_realtoken\n');
    try {
      const { fatal } = check({ env: {}, cwd: dir, fromNpm: [] });
      assert.equal(fatal.length, 1);
      assert.match(fatal[0], /AND sets a credential key/);
      assert.ok(!fatal[0].includes('npm_realtoken'), 'the token value must never be echoed');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('treats an unreadable npmrc as fatal, never as clean', () => {
    // `grep -q` returns 2 for "cannot read" and an `if` collapses that to "no match" — which reported
    // an unreadable npmrc as verified-clean.
    const { fatal } = check({
      env: {},
      cwd: '/repo',
      fromNpm: [],
      fsImpl: {
        statSync: () => ({ isFile: () => true }),
        readFileSync: () => { const e = new Error('denied'); e.code = 'EACCES'; throw e; },
      },
    });
    assert.equal(fatal.length, 1);
    assert.match(fatal[0], /cannot be read \(EACCES\)/);
  });

  it('treats a directory named .npmrc as fatal rather than reading it', () => {
    const { fatal } = check({
      env: {},
      cwd: '/repo',
      fromNpm: [],
      fsImpl: { statSync: () => ({ isFile: () => false }), readFileSync: () => { throw new Error('unreached'); } },
    });
    assert.match(fatal[0], /not a regular file/);
  });

  it('flags the three environment vectors separately', () => {
    const only = (env) => check({ env, home: '/none', cwd: '/none', fromNpm: [] }).fatal;
    assert.match(only({ NODE_AUTH_TOKEN: 'x' })[0], /NODE_AUTH_TOKEN is set/);
    assert.match(only({ NPM_ID_TOKEN: 'x' })[0], /NPM_ID_TOKEN is set/);
    assert.match(only({ npm_config__authToken: 'x' })[0], /npm_config_\* credential, rewritable or config-repointing/);
    // All three at once, so one masking another would show as a shorter list.
    assert.equal(only({ NODE_AUTH_TOKEN: 'x', NPM_ID_TOKEN: 'y', npm_config__auth: 'z' }).length, 3);
  });

  it('never echoes a credential value in any message', () => {
    const fatal = check({
      env: { NODE_AUTH_TOKEN: 'npm_secret_value', NPM_ID_TOKEN: 'id_secret_value',
        npm_config__authToken: 'cfg_secret_value' },
      home: '/none',
      cwd: '/none',
      fromNpm: [],
    }).fatal.join(' ');
    for (const secret of ['npm_secret_value', 'id_secret_value', 'cfg_secret_value']) {
      assert.ok(!fatal.includes(secret), `${secret} leaked into the failure output`);
    }
  });
});

describe('the CLI — the exit code is the only thing CI consumes', () => {
  // `check()` was tested thoroughly and the bridge from it to an exit code was tested zero ways: changing
  // `if (fatal.length > 0)` to `if (false)` left the whole suite green while the guard became a no-op
  // that printed a success line. That is T45's own defect — an unexercised path — one layer in (R1).
  // No test count appears in this file: two were transcribed here and both were false within one
  // commit of being written. `node --test <this file>` is the count (R2).
  it('exits 1 and reports on stderr when a planted npmrc sets a credential', () => {
    const { dir } = tmpNpmrc('//registry.npmjs.org/:_authToken=npm_PLANTED\n');
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: dir, home });
      assert.equal(status, 1, 'a credential on the publish path must fail the job');
      assert.match(stderr, /FATAL:/);
      assert.match(stderr, /AND sets a credential key/);
      assert.ok(!stderr.includes('npm_PLANTED'), 'the token value must never be echoed');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  it('exits 1 for an npmrc with no credential in it — existence is the rule', () => {
    const { dir } = tmpNpmrc('registry=https://registry.npmjs.org/\n');
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: dir, home });
      assert.equal(status, 1);
      assert.match(stderr, /sets no credential key/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  it('exits 0 on a clean tree, and says how many paths it checked', () => {
    // THE NUMBER IS THE ASSERTION (R2). The first version matched only the surrounding prose, so
    // hardcoding the count back to `0` — the literal regression R1 existed to remove — and hardcoding it
    // to `9999` both passed. A number nothing asserts is decoration.
    //
    // BASE AND BASE+1 FROM ONE STUB, not a machine-shaped absolute (R3). The literal `4` asserted stub
    // arithmetic and broke on two unrelated conditions: a benign `.npmrc` at the repo root (which is not
    // gitignored here, so it would be committed) and running the suite from outside a `_bmad` tree. Real
    // npm never prints `undefined` for these keys either, so the absolute figure described a state no
    // runner produces. The delta is the property worth pinning, and a constant cannot satisfy it.
    const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-clean-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stdout } = runCli({ cwd: clean, home });
      assert.equal(status, 0, stdout);
      const base = Number((stdout.match(/^npm credential check: (\d+) path\(s\)/) || [])[1]);
      assert.ok(Number.isInteger(base) && base >= 3,
        `the count must be a real number of inspected paths, at least HOME + project + builtin; got: ${stdout}`);
      assert.match(stdout, /-- OK/);

      const more = runCli({
        cwd: clean, home, stub: { userconfig: path.join(clean, 'absent-userconfig') },
      });
      assert.equal(more.status, 0, more.stdout);
      const raised = Number((more.stdout.match(/^npm credential check: (\d+) path\(s\)/) || [])[1]);
      assert.equal(raised, base + 1,
        `one more path npm reports must raise the count by exactly one: ${base} -> ${raised}`);
    } finally {
      fs.rmSync(clean, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  it('exits 1 when the environment carries a token, even with no npmrc anywhere', () => {
    const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-clean-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: clean, home, env: { NODE_AUTH_TOKEN: 'x' } });
      assert.equal(status, 1);
      assert.match(stderr, /NODE_AUTH_TOKEN is set/);
    } finally {
      fs.rmSync(clean, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});

describe('check — every candidate path is really scanned, not just the project one', () => {
  // Only `cwd` was pinned: dropping `home` or the env overrides from the candidate list left all 45
  // tests green, and `$HOME/.npmrc` is the likeliest place for a real npmrc on a runner (R1).
  it('finds an npmrc at $HOME', () => {
    const { dir } = tmpNpmrc('//registry.npmjs.org/:_authToken=abc\n');
    try {
      const { fatal } = check({ env: {}, home: dir, cwd: '/nonexistent-repo', fromNpm: [] });
      assert.equal(fatal.length, 1, 'the HOME candidate must be scanned');
      assert.match(fatal[0], /AND sets a credential key/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('finds one at NPM_CONFIG_USERCONFIG and at NPM_CONFIG_GLOBALCONFIG', () => {
    // TWO findings, and they are independent (R2): the file at that path is scanned, AND the variable
    // itself is rejected, because `userconfig`/`globalconfig` repoint npm at an arbitrary file and FR4
    // leaves this job with no reason to set either. Asserting only the total would let one mask the other.
    for (const key of ['NPM_CONFIG_USERCONFIG', 'NPM_CONFIG_GLOBALCONFIG']) {
      const { dir, file } = tmpNpmrc('_authToken=abc\n');
      try {
        const { fatal } = check({ env: { [key]: file }, home: '/none', cwd: '/none', fromNpm: [] });
        assert.equal(fatal.filter((f) => f.includes(file) && /sets a credential key/.test(f)).length, 1,
          `${key} must be scanned as a path: ${JSON.stringify(fatal)}`);
        assert.equal(fatal.filter((f) => /config-repointing key\(s\)/.test(f)).length, 1,
          `${key} must itself be rejected as a config-repointing name: ${JSON.stringify(fatal)}`);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('finds one at a path npm itself reports', () => {
    const { dir, file } = tmpNpmrc('_authToken=abc\n');
    try {
      const { fatal } = check({ env: {}, home: '/none', cwd: '/none', fromNpm: [file, 'undefined'] });
      assert.equal(fatal.length, 1, "npm's own userconfig answer must be scanned");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('setsCredential — the whitespace npm honours', () => {
  it('sees a key preceded by a form feed or vertical tab', () => {
    // POSIX [[:space:]] covers these and npm's `ini` trims the key: measured against npm 11.11.0, a
    // form-feed-prefixed key is honoured. `[ \t]` alone missed them (R1).
    assert.equal(setsCredential('\f_authToken=abc'), true);
    assert.equal(setsCredential('\v_authToken=abc'), true);
    assert.equal(setsCredential('_authToken\f=abc'), true);
  });
});

describe('setsCredential — the leading characters npm strips but a whitespace class does not', () => {
  // Driven through npm's own `ini`, each of these yields a live credential key while `[ \t\f\v]` called
  // the file clean. npm trims the key with `String.trim()`, which strips every Unicode space AND the BOM;
  // `ini`'s `unsafe()` strips surrounding quotes (R2).
  //
  // On the three existence-checked paths this only changed the MESSAGE — existence is already fatal, and
  // the message said "sets no credential key" over a live token, which the playbook then read as "no
  // token yet". On npm's builtin npmrc, where content IS the verdict, it changed the verdict.
  it('sees a key behind a UTF-8 BOM', () => {
    assert.equal(setsCredential('\uFEFF//registry.npmjs.org/:_authToken=abc'), true);
  });

  it('sees a key behind a non-breaking space', () => {
    assert.equal(setsCredential('\u00a0_authToken=abc'), true);
  });

  it('sees a quoted key', () => {
    assert.equal(setsCredential('"//registry.npmjs.org/:_authToken"=abc'), true);
    assert.equal(setsCredential("'_authToken'=abc"), true);
  });

  it('still tolerates a space INSIDE the nerf-dart, which POSIX allows and JS \\s would not', () => {
    // The header argues this class at length and nothing pinned it: reverting the inner class to `[^\s]`
    // left the suite green while changing this answer to false (R2). JS `\s` counts U+00A0, POSIX
    // `[[:space:]]` does not, so `[^\s]` is NARROWER than the bash this replaced.
    assert.equal(setsCredential('//registry.npmjs.org\u00a0/:_authToken=abc'), true);
  });
});

describe('badNpmEnvNames — each structural marker, alone', () => {
  // THE FIXTURE MUST DISTINGUISH THE GUARD FROM ITS RELAXATION. One fixture carried `${`, `//` and `:`
  // at once, so deleting any single disjunct left the suite green — including `${`, the one the header,
  // the commit message and the playbook each single out as the load-bearing insight. Two independent
  // reviewers found the same hole (R2).
  it('rejects a name that is only rewritable', () => {
    assert.deepEqual(badNpmEnvNames({ 'npm_config_${X}': '1' }), ['npm_config_${X}']);
  });

  it('rejects a name that is only nerf-darted with //', () => {
    assert.deepEqual(badNpmEnvNames({ 'npm_config_//registry.example/k': '1' }),
      ['npm_config_//registry.example/k']);
  });

  it('rejects a name that only carries a colon', () => {
    assert.deepEqual(badNpmEnvNames({ 'npm_config_registry.example:tok': '1' }),
      ['npm_config_registry.example:tok']);
  });

  it('rejects the keys that repoint npm at another config file, in any casing', () => {
    // npm's `loadEnv` tests /^npm_config_/i, slices a fixed 11 characters and lowercases, so a
    // name-cased spelling sets the same config key — and defeated both the structural rule and the
    // exact-uppercase path lookup (R2).
    for (const name of ['npm_config_userconfig', 'NpM_CoNfIg_UsErCoNfIg', 'npm_config_globalconfig',
      'npm_config_cert', 'npm_config_key', 'npm_config_cafile']) {
      assert.deepEqual(badNpmEnvNames({ [name]: 'v' }), [name], `${name} must be rejected`);
    }
  });

  it('does not reject a benign npm_config_* name', () => {
    // The floor for the rule above: without this, widening it to every `npm_config_*` would pass.
    assert.deepEqual(badNpmEnvNames({ npm_config_registry: 'https://registry.npmjs.org/' }), []);
    assert.deepEqual(badNpmEnvNames({ npm_config_loglevel: 'warn' }), []);
  });

  it('reports names in a stable order', () => {
    // The FATAL line is what an operator reads; removing `.sort()` left the suite green (R2).
    assert.deepEqual(badNpmEnvNames({ npm_config_keyfile: 'a', npm_config_certfile: 'b' }),
      ['npm_config_certfile', 'npm_config_keyfile']);
  });
});

describe("check — npm's builtin npmrc, the source judged by CONTENT", () => {
  // R1 shipped with this source missing entirely. `@npmcli/config` has four file-backed sources; the
  // candidate set had three. The builtin is reported by neither `npm config get userconfig` nor
  // `globalconfig`, and `Config.validate()` skips it, so a token appended there was sent by npm while
  // this scan printed OK — demonstrated end to end against npm 11.11.0 (R2).
  it('fails on a credential in the builtin npmrc', () => {
    const { file } = tmpNpmrc('//registry.npmjs.org/:_authToken=npm_BUILTIN\n');
    try {
      const { fatal } = check({
        env: {}, home: '/none', cwd: '/none', fromNpm: [], builtin: [file],
      });
      assert.equal(fatal.length, 1, JSON.stringify(fatal));
      assert.match(fatal[0], /builtin npmrc/);
      assert.ok(!fatal[0].includes('npm_BUILTIN'), 'the token value must never be echoed');
    } finally {
      fs.rmSync(path.dirname(file), { recursive: true, force: true });
    }
  });

  it('PASSES on the builtin npmrc npm actually ships, which exists on every install', () => {
    // Existence cannot be the rule here: npm's own builtin npmrc contains `prefix = …` and is present on
    // every install (measured, 23 bytes). Applying the existence rule to it would refuse every publish.
    const { file } = tmpNpmrc('prefix = /opt/homebrew\n');
    try {
      const { fatal } = check({
        env: {}, home: '/none', cwd: '/none', fromNpm: [], builtin: [file],
      });
      assert.deepEqual(fatal, []);
    } finally {
      fs.rmSync(path.dirname(file), { recursive: true, force: true });
    }
  });

  it('passes when there is no builtin npmrc at all', () => {
    const { fatal } = check({
      env: {}, home: '/none', cwd: '/none', fromNpm: [], builtin: ['/nonexistent/npm/npmrc'],
    });
    assert.deepEqual(fatal, []);
  });

  it('fails when the builtin npmrc exists but cannot be read', () => {
    const { fatal } = check({
      env: {},
      home: '/none',
      cwd: '/none',
      fromNpm: [],
      builtin: ['/npm/npmrc'],
      fsImpl: {
        // Only the builtin path exists — the existence candidates must stay absent, or their own fatals
        // would be counted here and this would pass for the wrong reason.
        statSync: (p) => {
          if (p === '/npm/npmrc') return { isFile: () => true, isDirectory: () => false };
          const e = new Error('nope'); e.code = 'ENOENT'; throw e;
        },
        readFileSync: () => { const e = new Error('denied'); e.code = 'EACCES'; throw e; },
        realpathSync: (p) => p,
      },
    });
    assert.equal(fatal.length, 1);
    assert.match(fatal[0], /builtin npmrc .* cannot be read \(EACCES\)/);
  });
});

describe('check — a degraded enumeration is fatal, not silently narrower', () => {
  // Two of npm's four sources are named by a subprocess. A silent '' dropped the path and printed the
  // same OK line as a clean run: a guard that cannot see cannot clear (R2).
  it('refuses when a path could not be enumerated', () => {
    const { fatal } = check({
      env: {}, home: '/none', cwd: '/none', fromNpm: [], degraded: ['`npm config get userconfig` failed (ENOENT)'],
    });
    assert.equal(fatal.length, 1);
    assert.match(fatal[0], /could not be established/);
    assert.match(fatal[0], /cannot enumerate cannot certify/);
  });

  it('reports every degraded reason, not just the first', () => {
    const { fatal } = check({
      env: {}, home: '/none', cwd: '/none', fromNpm: [], degraded: ['reason one', 'reason two'],
    });
    assert.equal(fatal.length, 2, JSON.stringify(fatal));
  });
});

describe('npmLocalPrefix — the directory npm reads the project npmrc from', () => {
  // npm resolves the project file at `<localPrefix>/.npmrc`, where localPrefix is the nearest ancestor
  // with `package.json` or `node_modules` — NOT `<cwd>/.npmrc`. Measured: run from `repo/scripts/sub`,
  // npm reads `repo/.npmrc` and ignores `sub/.npmrc`. Checking `cwd/.npmrc` could abort a publish over a
  // file npm never reads, on a tag already spent (R2).
  it('climbs to the nearest ancestor holding package.json', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-prefix-'));
    try {
      const deep = path.join(root, 'scripts', 'sub');
      fs.mkdirSync(deep, { recursive: true });
      fs.writeFileSync(path.join(root, 'package.json'), '{"name":"r","version":"1.0.0"}');
      assert.equal(npmLocalPrefix(deep), fs.realpathSync(root) === root ? root : path.resolve(root));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('climbs to an ancestor holding node_modules', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-prefix-'));
    try {
      const deep = path.join(root, 'a', 'b');
      fs.mkdirSync(deep, { recursive: true });
      fs.mkdirSync(path.join(root, 'node_modules'));
      assert.equal(npmLocalPrefix(deep), path.resolve(root));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('does NOT climb past the directory that qualifies', () => {
    // Without this the walk could run to `/` and scan a stranger's npmrc.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-prefix-'));
    try {
      const mid = path.join(root, 'mid');
      fs.mkdirSync(path.join(mid, 'deep'), { recursive: true });
      fs.writeFileSync(path.join(root, 'package.json'), '{}');
      fs.writeFileSync(path.join(mid, 'package.json'), '{}');
      assert.equal(npmLocalPrefix(path.join(mid, 'deep')), path.resolve(mid));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('falls back to the start directory when no ancestor qualifies', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-prefix-'));
    try {
      assert.equal(npmLocalPrefix(root), path.resolve(root));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('npmrcCandidates — the project root reach, and duplicates that are one file', () => {
  it('scans an extra path the caller supplies', () => {
    // `main()`'s project-root fallback was R1's second code fix and NOTHING exercised it: replacing the
    // expression with `[]` left the suite green. Two independent reviewers found it (R2).
    assert.deepEqual(npmrcCandidates({ env: {}, fromNpm: [], extra: ['/repo/.npmrc'] }), ['/repo/.npmrc']);
  });

  it('treats a symlinked duplicate as one file', () => {
    // Dedupe was by raw string, so an aliased `--cwd` named the same file twice and reported one writer
    // as two, inflating the count on a clean tree (R2).
    const real = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-real-'));
    const link = path.join(os.tmpdir(), `npmrc-link-${process.pid}`);
    try {
      fs.writeFileSync(path.join(real, '.npmrc'), 'registry=x\n');
      fs.symlinkSync(real, link);
      const got = npmrcCandidates({
        env: {}, fromNpm: [], cwd: real, extra: [path.join(link, '.npmrc')],
      });
      assert.equal(got.length, 1, `one file, one candidate: ${JSON.stringify(got)}`);
    } finally {
      fs.rmSync(link, { recursive: true, force: true });
      fs.rmSync(real, { recursive: true, force: true });
    }
  });

  it('reads the env override in any casing npm honours', () => {
    const got = npmrcCandidates({ env: { npm_config_userconfig: '/lower/user' }, fromNpm: [] });
    assert.deepEqual(got, ['/lower/user']);
  });
});

describe('the CLI — refusing to guess, and refusing to certify what it could not enumerate', () => {
  it('exits 1 when --cwd is given with no value instead of silently inferring one', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: undefined, home, args: ['--cwd'] });
      assert.equal(status, 1);
      assert.match(stderr, /--cwd was given with no value/);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  it('exits 1 when npm cannot be asked which paths it reads', () => {
    // Previously this dropped the paths and printed the same OK line as a clean run (R2).
    const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-clean-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: clean, home, stub: { fail: true } });
      assert.equal(status, 1);
      assert.match(stderr, /could not be established/);
    } finally {
      fs.rmSync(clean, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  it('fails on a credential in the builtin npmrc npm reports', () => {
    // End to end: the source R1 could not see, through the real CLI.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-root-'));
    const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-clean-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      fs.mkdirSync(path.join(root, 'npm'), { recursive: true });
      fs.writeFileSync(path.join(root, 'npm', 'npmrc'),
        'prefix = /x\n//registry.npmjs.org/:_authToken=npm_BUILTIN_E2E\n');
      const { status, stderr } = runCli({ cwd: clean, home, stub: { root } });
      assert.equal(status, 1, 'a credential in the builtin npmrc must fail the job');
      assert.match(stderr, /builtin npmrc/);
      assert.ok(!stderr.includes('npm_BUILTIN_E2E'), 'the token value must never be echoed');
    } finally {
      for (const d of [root, clean, home]) fs.rmSync(d, { recursive: true, force: true });
    }
  });
});

describe('the playbook section the refusal messages cite', () => {
  // The SECTION NUMBER is load-bearing and must be asserted with the path, not apart from it. This
  // repo already paid for exactly this bug on the sibling downgrade guard, where citing `§9` passed
  // every test; the T45 messages shipped with no equivalent assertion, and BOTH directions of the drift
  // — renumbering the heading, or renumbering the citation — passed all 55 tests (R2).
  const PLAYBOOK = path.join(__dirname, '..', '..', 'docs', 'npm-publishing-access-playbook.md');
  const SCAN = fs.readFileSync(SCRIPT, 'utf8');

  it('the scan cites §6 by number', () => {
    assert.match(SCAN, /npm-publishing-access-playbook\.md §6/,
      'the refusal messages must route the operator to a numbered section');
  });

  it('§6 is the section the scan names, with that exact heading', () => {
    const playbook = fs.readFileSync(PLAYBOOK, 'utf8');
    assert.match(playbook, /^## 6\. The credential scan refused the publish$/m,
      'the cited section must exist at the cited number — a renumber would point operators at whatever '
      + 'then occupies the slot');
  });
});

describe("the CLI — main() reads the project npmrc from npm's localPrefix", () => {
  it('finds the repo-root .npmrc when --cwd names a subdirectory', () => {
    // `npmLocalPrefix` had four unit tests and NOTHING asserted `main()` called it: replacing
    // `npmLocalPrefix(start)` with `start` left every one of them green. A helper nothing wires is the
    // same defect class as T45 itself — detection code that never runs (R2).
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-proj-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const sub = path.join(root, 'scripts', 'sub');
      fs.mkdirSync(sub, { recursive: true });
      fs.writeFileSync(path.join(root, 'package.json'), '{"name":"r","version":"1.0.0"}');
      fs.writeFileSync(path.join(root, '.npmrc'), '//registry.npmjs.org/:_authToken=npm_PREFIX\n');
      const { status, stderr } = runCli({ cwd: sub, home });
      assert.equal(status, 1, 'the npmrc npm would actually read must be found from a subdirectory');
      assert.match(stderr, /AND sets a credential key/);
      assert.ok(stderr.includes(path.join(root, '.npmrc')) || stderr.includes(`${path.sep}.npmrc`),
        `the fatal must name the repo-root npmrc; got: ${stderr}`);
      assert.ok(!stderr.includes('npm_PREFIX'), 'the token value must never be echoed');
    } finally {
      for (const d of [root, home]) fs.rmSync(d, { recursive: true, force: true });
    }
  });
});

describe('setsCredential — the character class BEFORE the = (R3)', () => {
  // R2 widened the LEADING class to `\s` and left this one as `[ \t\f\v]` — the same defect, one position
  // over. Driven through npm's own `ini`, each of these produced a live credential key while
  // `setsCredential` returned false.
  const SPACES = [' ', ' ', ' ', ' ', ' ', ' ', ' ', '　', '﻿'];
  for (const ch of SPACES) {
    it(`sees a key followed by U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} before the =`, () => {
      assert.equal(setsCredential(`//registry.npmjs.org/:_authToken${ch}=tok`), true);
    });
  }

  it("sees ini's array-append form, which npm interpolates into a working Bearer header", () => {
    // `ini` parses this to `['tok']`; npm-registry-fetch does `Bearer ${auth.token}`, and interpolating a
    // one-element array yields exactly `Bearer tok`.
    assert.equal(setsCredential('//registry.npmjs.org/:_authToken[]=tok'), true);
    assert.equal(setsCredential('_password[]=hunter2'), true);
  });

  it('still does not fire on a comment or a benign key', () => {
    // The floor. Widening both classes to `\s` must not start matching prose.
    assert.equal(setsCredential('# _authToken = nope'), false);
    assert.equal(setsCredential('registry=https://registry.npmjs.org/'), false);
    assert.equal(setsCredential('always-auth=false'), false);
  });
});

describe('npmBuiltinCandidates — located independently of `prefix` (R3)', () => {
  // R2 derived the builtin npmrc from `npm root -g`, which is `resolve(prefix,'lib','node_modules')`.
  // `prefix` is settable from the environment, so `npm_config_prefix=/tmp/x` moved where the scan LOOKED
  // without moving where npm READS — a complete bypass of the only content-checked source, and in reverse
  // a false refusal over a file npm never opens.
  it('includes the path derived from what `npm root -g` reported', () => {
    // BOTH routes are returned deliberately, so this asserts membership, not the whole list: extra
    // candidates cost nothing under the content rule (an absent path is skipped), and requiring exactly
    // one would forbid the prefix-independent route that closes the bypass.
    const got = npmBuiltinCandidates(['/opt/x/lib/node_modules']);
    assert.ok(got.includes(path.join('/opt/x/lib/node_modules', 'npm', 'npmrc')),
      `the reported global root must be checked; got ${JSON.stringify(got)}`);
  });

  it('returns a candidate even when npm could not be asked for its global root', () => {
    // The second, prefix-independent route: npm's own binary. On a machine with npm installed this must
    // produce something; the assertion is that the function does not simply give up.
    const got = npmBuiltinCandidates([]);
    assert.ok(Array.isArray(got), 'must always return a list');
    for (const p of got) assert.match(p, /npmrc$/, `${p} is not an npmrc path`);
  });

  it('never returns the same path twice', () => {
    const got = npmBuiltinCandidates(['/opt/x/lib/node_modules', '/opt/x/lib/node_modules']);
    assert.equal(new Set(got).size, got.length, JSON.stringify(got));
  });
});

describe('badNpmEnvNames — prefix, empty values, and npm\'s own lifecycle env (R3)', () => {
  it('rejects npm_config_prefix, which relocates the tree the builtin lookup uses', () => {
    assert.deepEqual(badNpmEnvNames({ npm_config_prefix: '/tmp/FAKE' }), ['npm_config_prefix']);
    assert.deepEqual(badNpmEnvNames({ NPM_CONFIG_PREFIX: '/tmp/FAKE' }), ['NPM_CONFIG_PREFIX']);
  });

  it('rejects npm_config_ca, the inline-PEM sibling of cafile', () => {
    assert.deepEqual(badNpmEnvNames({ npm_config_ca: '-----BEGIN CERTIFICATE-----' }), ['npm_config_ca']);
  });

  it('ignores an EMPTY value, because npm ignores it too', () => {
    // npm's `loadEnv` does `if (… || envVal === '') continue`. An Actions `env:` entry interpolating an
    // unset secret produces exactly this, and refusing it refused a correct configuration.
    assert.deepEqual(badNpmEnvNames({ NPM_CONFIG_USERCONFIG: '' }), []);
    assert.deepEqual(badNpmEnvNames({ npm_config_prefix: '' }), []);
  });

  it("ignores a value npm itself reports, and still rejects a DIFFERENT value for that key", () => {
    // `npm run` injects userconfig/globalconfig/prefix set to npm's own answers, so the scan refused in
    // any environment npm created. Repeating npm's answer is not a finding; changing it is.
    assert.deepEqual(badNpmEnvNames({ npm_config_userconfig: '/home/me/.npmrc' }, ['/home/me/.npmrc']), []);
    assert.deepEqual(badNpmEnvNames({ npm_config_userconfig: '/evil/.npmrc' }, ['/home/me/.npmrc']),
      ['npm_config_userconfig']);
  });

  it('still rejects a credential-shaped name whatever the benign list says', () => {
    // The floor: the benign list must not become a way to whitelist a token.
    assert.deepEqual(badNpmEnvNames({ npm_config__authToken: 'tok' }, ['tok']), ['npm_config__authToken']);
  });
});

describe('npmLocalPrefix — npm\'s own file/directory rules (R3)', () => {
  it('does not stop at a DIRECTORY named package.json', () => {
    // npm uses `fileExists`; `existsSync` accepted a directory and stopped the walk one level below npm,
    // hiding the npmrc npm actually loads.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-prefix-'));
    try {
      const sub = path.join(root, 'sub');
      fs.mkdirSync(path.join(sub, 'package.json'), { recursive: true });
      fs.writeFileSync(path.join(root, 'package.json'), '{"name":"r","version":"1.0.0"}');
      assert.equal(npmLocalPrefix(sub), path.resolve(root));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not stop at a FILE named node_modules', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-prefix-'));
    try {
      const sub = path.join(root, 'sub');
      fs.mkdirSync(sub, { recursive: true });
      fs.writeFileSync(path.join(sub, 'node_modules'), 'not a directory');
      fs.mkdirSync(path.join(root, 'node_modules'));
      assert.equal(npmLocalPrefix(sub), path.resolve(root));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('check — the builtin loop stats before it reads (R3)', () => {
  it('does not report a DIRECTORY at the builtin path as an uninspected credential source', () => {
    // npm's own `#loadFile` catches the same read error, loads no config, and `validate()` skips this
    // source — so such a path provably carries nothing, and the old fatal's justification was false for it.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-builtindir-'));
    try {
      const asDir = path.join(dir, 'npmrc');
      fs.mkdirSync(asDir);
      const { fatal } = check({
        env: {}, home: '/none', cwd: '/none', fromNpm: [], builtin: [asDir],
      });
      assert.deepEqual(fatal, []);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('the CLI — --cwd cannot be defeated by argument shape (R3)', () => {
  // R2 checked only that a value was PRESENT. Each shape below certified a tree holding a live token.
  function plantedTree() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-planted-'));
    fs.writeFileSync(path.join(dir, '.npmrc'), '//registry.npmjs.org/:_authToken=npm_LIVE\n');
    return dir;
  }

  it('honours the --cwd=<path> equals form, the spelling the playbook invites', () => {
    const proj = plantedTree();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: proj, home, args: [`--cwd=${proj}`] });
      assert.equal(status, 1, 'the equals form must scan the same tree as the space form');
      assert.match(stderr, /AND sets a credential key/);
    } finally {
      for (const d of [proj, home]) fs.rmSync(d, { recursive: true, force: true });
    }
  });

  it('refuses a flag as the value of --cwd instead of treating it as a directory', () => {
    const proj = plantedTree();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: proj, home, args: ['--cwd', '--verbose', proj] });
      assert.equal(status, 1);
      assert.match(stderr, /which is a flag, not a directory/);
    } finally {
      for (const d of [proj, home]) fs.rmSync(d, { recursive: true, force: true });
    }
  });

  it('refuses a --cwd that is not a directory rather than certifying it', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: '/nonexistent-xyz', home });
      assert.equal(status, 1);
      assert.match(stderr, /is not a directory/);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});

describe('the CLI — a zero exit from npm is not an answer (R3)', () => {
  // R2 fixed only the non-zero branch, so npm exiting 0 with empty output still dropped the source and
  // printed the same OK line as a clean run — verbatim the defect its own header claimed closed.
  it('refuses when npm exits 0 but prints nothing', () => {
    const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-clean-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stderr } = runCli({ cwd: clean, home, stub: { userconfig: '' } });
      assert.equal(status, 1);
      assert.match(stderr, /printed nothing|could not be established/);
    } finally {
      for (const d of [clean, home]) fs.rmSync(d, { recursive: true, force: true });
    }
  });
});

describe('npmBuiltinCandidates — the prefix-independent route (R3)', () => {
  // The whole point of HIGH-1's fix: `npm root -g` is derived from `prefix`, which an attacker sets, so a
  // second route that `prefix` cannot move must contribute a candidate. Deleting it left the suite green
  // until this test existed.
  it('derives a candidate from npm_execpath, which `prefix` does not move', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-exec-'));
    const saved = process.env.npm_execpath;
    try {
      const npmDir = path.join(root, 'lib', 'node_modules', 'npm');
      fs.mkdirSync(path.join(npmDir, 'bin'), { recursive: true });
      fs.writeFileSync(path.join(npmDir, 'bin', 'npm-cli.js'), '// stub\n');
      process.env.npm_execpath = path.join(npmDir, 'bin', 'npm-cli.js');
      const got = npmBuiltinCandidates([]);
      // Compared against the RESOLVED directory: the route deliberately realpaths, and on macOS a tmpdir
      // under /var resolves to /private/var.
      const expected = path.join(fs.realpathSync(npmDir), 'npmrc');
      assert.ok(got.includes(expected),
        `the binary-derived builtin npmrc must be a candidate; wanted ${expected}, got ${JSON.stringify(got)}`);
    } finally {
      if (saved === undefined) delete process.env.npm_execpath;
      else process.env.npm_execpath = saved;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not synthesise a candidate under a FILE named npm', () => {
    // A wrapper script on PATH named `npm` resolves to itself; returning it would name `<file>/npmrc`.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-exec-'));
    const saved = process.env.npm_execpath;
    try {
      fs.writeFileSync(path.join(root, 'npm'), '#!/bin/sh\n');
      process.env.npm_execpath = path.join(root, 'npm');
      const got = npmBuiltinCandidates([]);
      const forbidden = path.join(fs.realpathSync(path.join(root, 'npm')), 'npmrc');
      assert.ok(!got.includes(forbidden),
        `a file cannot hold an npmrc; ${forbidden} must not be a candidate, got ${JSON.stringify(got)}`);
    } finally {
      if (saved === undefined) delete process.env.npm_execpath;
      else process.env.npm_execpath = saved;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('badNpmEnvNames — the benign exemption cannot launder a credential key (R3)', () => {
  it('never exempts a credential-carrying key by value coincidence', () => {
    // The exemption exists for keys that NAME a file npm already reported. `cert`, `key`, `ca` and
    // `cafile` carry or point at material, so a value that happens to match one of npm's answers must not
    // clear them. An earlier version applied the exemption to every key, which let this through.
    for (const name of ['npm_config_cert', 'npm_config_key', 'npm_config_ca', 'npm_config_cafile']) {
      assert.deepEqual(badNpmEnvNames({ [name]: '/home/me/.npmrc' }, ['/home/me/.npmrc']), [name],
        `${name} must be rejected regardless of what npm reports elsewhere`);
    }
  });
});
