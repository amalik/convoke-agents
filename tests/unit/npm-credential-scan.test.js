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
 * Hermetic on purpose: `check()` takes `env`, `home`, `cwd` and the `npm config get` values as
 * arguments, so no test reads the developer's own `~/.npmrc`. (Running the CLI here would fail, as it
 * should: this machine has a real npmrc with a token in it.)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { execFileSync } = require('child_process');

const {
  setsCredential,
  npmrcCandidates,
  badNpmEnvNames,
  check,
} = require('../../scripts/audit/npm-credential-scan');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'audit', 'npm-credential-scan.js');

/**
 * Run the CLI as CI runs it, with an isolated HOME and an explicit --cwd.
 * @returns {{status: number, stdout: string, stderr: string}}
 */
function runCli({ cwd, home, env = {} }) {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, '--cwd', cwd], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH, HOME: home, ...env },
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return { status: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
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
    assert.match(only({ npm_config__authToken: 'x' })[0], /npm_config_\* credential or rewritable/);
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
  // `check()` was tested 18 ways and the bridge from it to an exit code was tested zero ways: changing
  // `if (fatal.length > 0)` to `if (false)` left the whole suite green while the guard became a no-op
  // that printed a success line. That is T45's own defect — an unexercised path — one layer in (R1).
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
    const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-clean-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-home-'));
    try {
      const { status, stdout } = runCli({ cwd: clean, home });
      assert.equal(status, 0, stdout);
      assert.match(stdout, /path\(s\) npm reads were checked/,
        'the count must be the paths INSPECTED — the earlier message printed a number that is always 0 here');
      assert.match(stdout, /-- OK/);
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
    for (const key of ['NPM_CONFIG_USERCONFIG', 'NPM_CONFIG_GLOBALCONFIG']) {
      const { dir, file } = tmpNpmrc('_authToken=abc\n');
      try {
        const { fatal } = check({ env: { [key]: file }, home: '/none', cwd: '/none', fromNpm: [] });
        assert.equal(fatal.length, 1, `${key} must be scanned`);
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
