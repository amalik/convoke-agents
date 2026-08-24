'use strict';

const { describe, it, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { removeTempDirSync } = require('../helpers');

const {
  buildModuleBlock,
  derivePrefix,
  escapeSingleQuotes,
} = require('../../_bmad/bme/_team-factory/lib/writers/registry-writer');

// Injection regression tests for the team-factory registry writer.
//
// WHY THIS FILE EXISTS
// --------------------
// Code review on 2026-08-11 found two remote-code-execution holes in
// `buildModuleBlock`, both of which produced SYNTACTICALLY VALID JavaScript that passed
// `validateSyntax` with status 0 and was then persisted into `agent-registry.js` — a
// file require()d by refresh-installation, validator, convoke-doctor, the installer,
// index.js and migration-runner, so the payload re-executed on every later operation.
//
//   1. `icon` was the single field interpolated raw; every sibling used escapeSingleQuotes.
//   2. `team_name` was interpolated into a `//` comment, so a newline escaped the comment.
//
// At the time, all 165 team-factory tests passed identically before and after the
// vulnerable code — the suite could not detect either hole. These tests exist so a
// re-introduction fails loudly instead of shipping green.
//
// The assertions deliberately check the GENERATED SOURCE rather than mocking, and then
// actually execute it, because "produces valid JS" was precisely what made the original
// bugs invisible.

const MARKER_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-injection-'));

// MARKER_DIR is module-scoped and was never removed — a guaranteed temp-dir leak
// on every run, in a file whose subject is teardown hygiene.
after(() => removeTempDirSync(MARKER_DIR));
const marker = (name) => path.join(MARKER_DIR, name);

/** Minimal spec shaped like the real caller's input. */
function specWith(overrides = {}) {
  const agent = {
    id: 'aa',
    name: 'Aa',
    icon: '🎯',
    title: 'Tester',
    stream: 'S',
    persona: { role: 'r', identity: 'i', communication_style: 'c', expertise: 'e' },
    ...(overrides.agent || {}),
  };
  return {
    team_name: overrides.team_name || 'Demo',
    team_name_kebab: overrides.team_name_kebab || 'demo',
    agents: [agent],
    ...(overrides.spec || {}),
  };
}

/** Execute a generated module block in a child process; return whether it ran clean. */
function runBlock(block, prefix) {
  const file = path.join(MARKER_DIR, `blk-${Math.abs(hash(block))}.js`);
  fs.writeFileSync(
    file,
    `'use strict';\n${block}\nmodule.exports = { ${prefix}_AGENTS };\n`,
    'utf8'
  );
  const res = require('child_process').spawnSync(
    process.execPath,
    ['-e', `require(${JSON.stringify(file)})`],
    { stdio: 'pipe', timeout: 5000 }
  );
  return { status: res.status, stderr: (res.stderr || '').toString() };
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

describe('registry-writer injection regressions (code review 2026-08-11)', () => {
  afterEach(() => {
    for (const f of fs.readdirSync(MARKER_DIR)) {
      // Not a temp-dir teardown: this deletes individual PWNED* marker FILES inside
      // MARKER_DIR, non-recursively. removeTempDirSync would remove the whole
      // directory, which the remaining tests still need.
      // (no eslint-disable needed while this file is on the PENDING list; restore
      // the directive when it is converted and removed from that list.)
      if (f.startsWith('PWNED')) fs.rmSync(path.join(MARKER_DIR, f), { force: true });
    }
  });

  it('HIGH-1: a payload in `icon` cannot escape its string literal', () => {
    const target = marker('PWNED_ICON');
    const spec = specWith({
      agent: {
        icon: `X', zz: require('fs').writeFileSync(${JSON.stringify(target)},'p'), yy: '`,
      },
    });
    const block = buildModuleBlock(spec, 'DEMO', spec.team_name, {});

    // The payload must appear only as escaped string content, never as live syntax.
    assert.ok(!/zz: require\('fs'\)/.test(block), 'payload appears as executable syntax');
    assert.match(block, /icon: '.*\\'/, 'icon content is not escaped');

    const { status } = runBlock(block, 'DEMO');
    assert.equal(status, 0, 'generated block should still be valid JS');
    assert.equal(fs.existsSync(target), false, 'icon payload EXECUTED — RCE regression');
  });

  it('HIGH-2: a newline in `team_name` cannot escape the section comment', () => {
    const target = marker('PWNED_TEAM');
    const spec = specWith({
      team_name: `T\nrequire('fs').writeFileSync(${JSON.stringify(target)},'p');//`,
    });
    const block = buildModuleBlock(spec, 'DEMO', spec.team_name, {});

    // Every line the team name contributed must remain inside the comment.
    const commentLines = block.split('\n').filter((l) => l.includes('Module'));
    assert.equal(commentLines.length, 1, 'team name split the section comment across lines');
    assert.ok(!/^require\(/m.test(block), 'payload reached top level');

    const { status } = runBlock(block, 'DEMO');
    assert.equal(status, 0);
    assert.equal(fs.existsSync(target), false, 'team_name payload EXECUTED — RCE regression');
  });

  it('derivePrefix yields only JS identifier characters', () => {
    const evil = derivePrefix("a'];require('fs').writeFileSync('/tmp/x','p');const z=[");
    assert.match(evil, /^[A-Z0-9_]*$/, `derivePrefix leaked non-identifier chars: ${evil}`);
  });

  it('escapeSingleQuotes neutralises backslash, quote and newline (order matters)', () => {
    // A naive `.replace(/'/g, "\\'")` is defeated by a trailing backslash: the escape
    // character itself gets escaped by the payload rather than by us.
    for (const input of ["a\\", "a'", "a\\'", 'a\nb', 'a\rb', "\\'; x()"]) {
      // No `module.exports` here: `module` is undefined inside `new Function`.
      const src = `const v = '${escapeSingleQuotes(input)}'; return v;`;
      let value;
      assert.doesNotThrow(() => {
        value = new Function(src)();
      }, `escaping produced invalid JS for ${JSON.stringify(input)}`);
      assert.equal(value, input, 'round-trip changed the value');
    }
  });
});
