'use strict';

/**
 * T266: `convoke-doctor` credits an `excluded_agents` entry exactly when the install acts on it.
 *
 * The install reads the field for `_vortex` and `_gyre` only, and acts on an id there when it names
 * one of that module's agents: for a shipped one it skips, or removes, the agent's skill wrapper, at
 * the next refresh, upgrade or install. Before T266 the doctor credited ids the
 * install never acts on, in four ways, all exit 0:
 *   S1  a genuine id still in `agents:` was reported excluded while its wrapper was installed;
 *   S2  an id in a module the install does not read inflated the wrapper check's excluded count;
 *   S3  the same id suppressed that agent's wrapper check, so a missing wrapper passed;
 *   S4  one run used two rosters, so `excluded_agents` credited an exclusion `agents` did not;
 *   S5  a malformed list was said to be applied "beyond" an id that matched nothing.
 * Operator rulings 2026-11-01: an unprofiled module's list is reported as not read; an opt-out not
 * yet applied is pending, counted as excluded nowhere, and its fix is `convoke-update --refresh`.
 * Round 1 rulings 2026-11-02: D1, the skill wrapper decides — an opted-out shipped agent whose wrapper
 * is installed is pending, one whose wrapper is gone is applied, whatever `agents:` says; D2, an
 * operator's own agent has no wrapper and is neither (its after-state is `T268`'s).
 *
 * Each case runs the real doctor on a real install, so the partition direction is bound here too:
 * inverting `.known` and `.unknown` at the doctor's sites went unnoticed by the whole suite before.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');
const { spawnSync } = require('child_process');

const { createValidInstallation, PACKAGE_ROOT } = require('../helpers');
const { GYRE_AGENTS } = require('../../scripts/update/lib/agent-registry');

const BINS = require(path.join(PACKAGE_ROOT, 'package.json')).bin;
const GYRE_COUNT = GYRE_AGENTS.length;

function run(script, cwd, args = []) {
  return spawnSync(process.execPath, [path.join(PACKAGE_ROOT, script), ...args], {
    cwd, encoding: 'utf8', input: '', timeout: 120000, env: { ...process.env, FORCE_COLOR: '0' },
  });
}

/** The doctor's lines: each finding's first line and the indented lines under it. */
function doctor(dir) {
  const r = run('scripts/convoke-doctor.js', dir);
  const lines = r.stdout.split('\n');
  const block = (name) => {
    const at = lines.findIndex((l) => /^ {2}[✓✗⚠] /.test(l) && l.slice(4) === name);
    if (at < 0) return null;
    const out = [lines[at]];
    for (let i = at + 1; i < lines.length && /^ {4}/.test(lines[i]); i++) out.push(lines[i]);
    return out.join('\n');
  };
  return { status: r.status, stdout: r.stdout, block };
}

function editConfig(dir, mod, f) {
  const p = path.join(dir, '_bmad/bme', mod, 'config.yaml');
  const c = yaml.load(fs.readFileSync(p, 'utf8'));
  f(c);
  fs.writeFileSync(p, yaml.dump(c));
}

const wrapper = (dir, id) => path.join(dir, '.claude/skills', `bmad-agent-bme-${id}`);

describe('T266: convoke-doctor credits an exclusion exactly when the install acts on it', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t266-'));
    await createValidInstallation(dir);
    assert.equal(run(BINS['convoke-install'], dir).status, 0);
  });

  afterEach(async () => {
    await fs.remove(dir);
  });

  it('S1: an opt-out still in agents: is pending, not excluded, and the refresh applies it', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach']; });
    assert.ok(fs.existsSync(wrapper(dir, 'review-coach')), 'fixture: the wrapper is installed');
    const d = doctor(dir);
    assert.equal(d.status, 0);
    const agents = d.block('_gyre agents');
    assert.ok(agents && !/excluded/.test(agents), `an installed agent was reported excluded:\n${agents}`);
    assert.match(agents, new RegExp(`${GYRE_COUNT} agents present \\(1 opt-out pending: review-coach\\)`),
      'an installed agent is counted as present, and the pending opt-out is noted');
    assert.match(d.block('BME agent skill wrappers'), /agent skill wrappers verified$/m,
      'nothing is excluded yet, so the wrapper check must not say so');
    const pending = d.block('_gyre excluded_agents');
    assert.ok(pending, `no finding for the pending opt-out:\n${d.stdout}`);
    assert.match(pending, /review-coach/);
    assert.match(pending, /still installed/);
    assert.match(pending, /convoke-update --refresh/);

    const r = run(BINS['convoke-update'], dir, ['--refresh', '--yes']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const after = doctor(dir);
    assert.equal(after.block('_gyre excluded_agents'), null, after.stdout);
    assert.match(after.block('_gyre agents'), /\(1 excluded: review-coach\)/);
    assert.match(after.block('BME agent skill wrappers'), /\(1 excluded\)/);
  });

  it('D1: an opted-out agent whose wrapper is gone counts as applied, even still in agents:', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach']; });
    fs.removeSync(wrapper(dir, 'review-coach'));
    const d = doctor(dir);
    assert.equal(d.block('_gyre excluded_agents'), null, d.stdout);
    assert.match(d.block('_gyre agents'), /^ {2}✓.*\n.*\(1 excluded: review-coach\)/);
    assert.match(d.block('BME agent skill wrappers'), /^ {2}✓.*\n.*\(1 excluded\)/);
    assert.equal(d.status, 0, d.stdout);
  });

  it('D1: a pending agent whose file was deleted by hand is not reported missing', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach']; });
    fs.removeSync(path.join(dir, '_bmad/bme/_gyre/agents/review-coach.md'));
    const d = doctor(dir);
    assert.match(d.block('_gyre agents'),
      new RegExp(`^ {2}✓.*\\n.*${GYRE_COUNT - 1} agents present \\(1 opt-out pending: review-coach\\)$`, 'm'), d.stdout);
    assert.ok(d.block('_gyre excluded_agents'), 'its wrapper is still installed, so it is still pending');
    assert.equal(d.status, 0, d.stdout);
  });

  it('D1 (R1 H1): removed from agents: by hand with the wrapper installed is pending, not applied', () => {
    editConfig(dir, '_gyre', (c) => {
      c.agents = c.agents.filter((a) => a !== 'review-coach');
      c.excluded_agents = ['review-coach'];
    });
    const d = doctor(dir);
    assert.match(d.block('_gyre excluded_agents'), /still installed/, d.stdout);
    assert.ok(!/excluded/.test(d.block('_gyre agents')), d.block('_gyre agents'));
    assert.match(d.block('BME agent skill wrappers'), /agent skill wrappers verified$/m);
  });

  it('D1 (R1 H1): a config with no agents: list does not credit every opt-out', () => {
    editConfig(dir, '_gyre', (c) => { delete c.agents; c.excluded_agents = ['review-coach']; });
    const d = doctor(dir);
    assert.match(d.block('_gyre excluded_agents'), /still installed/, d.stdout);
    assert.match(d.block('BME agent skill wrappers'), /agent skill wrappers verified$/m);
  });

  it('a plain update of a current installation does not apply it, and the finding says so', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach']; });
    assert.equal(run(BINS['convoke-update'], dir, ['--yes']).status, 0);
    assert.ok(fs.existsSync(wrapper(dir, 'review-coach')), 'fixture: a plain update applied it after all');
    const f = doctor(dir).block('_gyre excluded_agents');
    assert.match(f, /not by a plain update/);
    assert.match(f, /a refresh, an upgrade or an install/);
    // ...and the install does apply it, as the finding says.
    assert.equal(run(BINS['convoke-install'], dir).status, 0);
    assert.ok(!fs.existsSync(wrapper(dir, 'review-coach')), 'an install did not apply the opt-out');
    assert.equal(doctor(dir).block('_gyre excluded_agents'), null);
  });


  it('S2: an id in a module the install does not read is not counted, and is reported as not read', () => {
    editConfig(dir, '_enhance', (c) => { c.excluded_agents = ['reviewcoach']; });
    const d = doctor(dir);
    assert.match(d.block('BME agent skill wrappers'), /agent skill wrappers verified$/m, d.stdout);
    const f = d.block('_enhance excluded_agents');
    assert.ok(f, `no finding for an opt-out the install never reads:\n${d.stdout}`);
    assert.match(f, /^ {2}⚠/);
    assert.match(f, /not read/);
    assert.ok(!/npx/.test(f), 'no command applies it');
    assert.equal(d.status, 0);
  });

  it('S3: an unprofiled module cannot hide another module\'s missing wrapper', () => {
    editConfig(dir, '_enhance', (c) => { c.excluded_agents = ['review-coach']; });
    fs.removeSync(wrapper(dir, 'review-coach'));
    const d = doctor(dir);
    const w = d.block('BME agent skill wrappers');
    assert.match(w, /^ {2}✗/, `the missing wrapper passed:\n${w}`);
    assert.match(w, /bmad-agent-bme-review-coach/);
    // And it says where the opt-out belongs.
    assert.match(d.block('_enhance excluded_agents'), /_bmad\/bme\/_gyre\/config\.yaml/);
  });

  it('D2: an operator\'s own agent is not pending, and is offered no command', () => {
    fs.writeFileSync(path.join(dir, '_bmad/bme/_gyre/agents/my-custom-agent.md'), 'x');
    editConfig(dir, '_gyre', (c) => {
      c.agents = [...c.agents, 'my-custom-agent'];
      c.excluded_agents = ['model-curator', 'my-custom-agent'];
    });
    const d = doctor(dir);
    const pending = d.block('_gyre excluded_agents');
    assert.ok(pending, d.stdout);
    assert.match(pending, /model-curator/);
    assert.ok(!/my-custom-agent/.test(pending), `the operator's own agent was called pending:\n${pending}`);
    assert.ok(!/excluded/.test(d.block('_gyre agents')), d.block('_gyre agents'));
  });

  it('D2: excluding only an operator\'s own agent raises no finding before the refresh', () => {
    fs.writeFileSync(path.join(dir, '_bmad/bme/_gyre/agents/my-custom-agent.md'), 'x');
    editConfig(dir, '_gyre', (c) => {
      c.agents = [...c.agents, 'my-custom-agent'];
      c.excluded_agents = ['my-custom-agent'];
    });
    const d = doctor(dir);
    assert.equal(d.block('_gyre excluded_agents'), null, `no refresh may be advised — it leads to T268:\n${d.stdout}`);
    assert.match(d.block('_gyre agents'), new RegExp(`${GYRE_COUNT + 1} agents present$`, 'm'));
  });

  it('S4: an applied exclusion is counted where it applies, and only there', () => {
    editConfig(dir, '_gyre', (c) => {
      c.agents = c.agents.filter((a) => a !== 'model-curator');
      c.excluded_agents = ['model-curator'];
    });
    fs.removeSync(wrapper(dir, 'model-curator'));
    const d = doctor(dir);
    assert.equal(d.block('_gyre excluded_agents'), null, d.stdout);
    assert.match(d.block('_gyre agents'), new RegExp(`${GYRE_COUNT - 1} agents present \\(1 excluded: model-curator\\)`));
    assert.match(d.block('BME agent skill wrappers'), /^ {2}✓.*\n.*\(1 excluded\)/);
  });

  it('a typo in a read module is unknown, not excluded, and not pending', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['reviewcoach']; });
    const d = doctor(dir);
    assert.match(d.block('_gyre excluded_agents'), /matches no agent this module knows about/);
    assert.ok(!/excluded/.test(d.block('_gyre agents')));
    assert.match(d.block('BME agent skill wrappers'), /agent skill wrappers verified$/m);
  });

  it('S5: a malformed list is not said to apply an id that matches nothing', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['reviewcoach', 42]; });
    const f = doctor(dir).block('_gyre excluded_agents');
    assert.ok(f);
    assert.ok(!/beyond reviewcoach/.test(f), `a phantom is named as applied:\n${f}`);
    assert.match(f, /NOT applied\./);
  });

  it('S5: a malformed list still names the genuine id it does apply', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach', 42]; });
    fs.removeSync(wrapper(dir, 'review-coach'));
    assert.match(doctor(dir).block('_gyre excluded_agents'), /NOT applied beyond review-coach\./);
  });

  it('R1 H2: a malformed list does not call an installed agent applied, and the refresh is still offered', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach', 42]; });
    const f = doctor(dir).block('_gyre excluded_agents');
    assert.ok(!/beyond review-coach/.test(f), `an installed agent is named as applied:\n${f}`);
    assert.match(f, /must be a YAML list/);
    assert.match(f, /"review-coach" is opted out .* but still installed/);
    assert.match(f, /convoke-update --refresh/);
  });

  it('R1: no reader on the update or install path names a phantom as applied', () => {
    // The Round 1 reproduction: the validator and the per-team install checks read the list without
    // the module's profile, so one refresh printed both "NOT applied." and "beyond <the typo>".
    editConfig(dir, '_vortex', (c) => { c.excluded_agents = ['contextualization-expertt', 42]; });
    const r = run(BINS['convoke-update'], dir, ['--refresh', '--yes']);
    const out = r.stdout + r.stderr;
    assert.match(out, /NOT applied\./, out);
    assert.ok(!/beyond contextualization-expertt/.test(out), `a reader named the typo as applied:\n${out}`);
    // The per-team install checks run on an install, not a refresh.
    const i = run(BINS['convoke-install'], dir);
    assert.ok(!/beyond contextualization-expertt/.test(i.stdout + i.stderr), `the install named the typo as applied:\n${i.stdout}${i.stderr}`);
  });

  it('R1: a typo in the list does not hide a pending id', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach', 'reviewcoach']; });
    const f = doctor(dir).block('_gyre excluded_agents');
    assert.match(f, /matches no agent this module knows about/);
    assert.match(f, /"review-coach" is opted out .* but still installed/);
    assert.match(f, /convoke-update --refresh/);
  });

  it('R1: an unread module is reported as not read even when its list is malformed', () => {
    editConfig(dir, '_enhance', (c) => { c.excluded_agents = [null]; });
    const f = doctor(dir).block('_enhance excluded_agents');
    assert.match(f, /is not read for _enhance, so it opts nothing out\./);
    assert.doesNotMatch(f, /nothing in it is not/, 'R2: the double negative said the opposite');
    editConfig(dir, '_enhance', (c) => { c.excluded_agents = []; });
    assert.equal(doctor(dir).block('_enhance excluded_agents'), null, 'an empty list says nothing');
  });

  it('R2: a not-read entry the owning module already applies is not advised to be moved', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach']; });
    editConfig(dir, '_enhance', (c) => { c.excluded_agents = ['review-coach', 'stack-detective'] ; });
    fs.removeSync(wrapper(dir, 'review-coach'));
    const d = doctor(dir);
    assert.match(d.block('_gyre agents'), /\(1 excluded: review-coach\)/);
    const f = d.block('_enhance excluded_agents');
    assert.match(f, /"review-coach" is already listed in _bmad\/bme\/_gyre\/config\.yaml, where it applies/);
    assert.ok(!/To opt out of "review-coach"/.test(f), f);
    assert.match(f, /To opt out of "stack-detective", list it in _bmad\/bme\/_gyre\/config\.yaml instead/);
  });

  it('R2: a not-read entry whose owning module is not installed says so', () => {
    fs.removeSync(path.join(dir, '_bmad/bme/_gyre'));
    editConfig(dir, '_enhance', (c) => { c.excluded_agents = ['review-coach']; });
    assert.match(doctor(dir).block('_enhance excluded_agents'), /"review-coach" is _gyre's agent, and _gyre is not installed here/);
  });

  it('R2: a pending _vortex agent is pending, counted present, and applied by the refresh', () => {
    const id = 'contextualization-expert';
    editConfig(dir, '_vortex', (c) => { c.excluded_agents = [id]; });
    const d = doctor(dir);
    assert.match(d.block('_vortex agents'), new RegExp(`\\(1 opt-out pending: ${id}\\)`), d.stdout);
    assert.match(d.block('_vortex excluded_agents'), /still installed/);
    assert.equal(run(BINS['convoke-update'], dir, ['--refresh', '--yes']).status, 0);
    const after = doctor(dir);
    assert.equal(after.block('_vortex excluded_agents'), null, after.stdout);
    assert.match(after.block('_vortex agents'), new RegExp(`\\(1 excluded: ${id}\\)`));
    assert.ok(!fs.existsSync(wrapper(dir, id)));
  });

  it('R2: a malformed list names an operator\'s own agent as applied, as the installer does', () => {
    fs.writeFileSync(path.join(dir, '_bmad/bme/_gyre/agents/my-custom-agent.md'), 'x');
    editConfig(dir, '_gyre', (c) => {
      c.agents = [...c.agents, 'my-custom-agent'];
      c.excluded_agents = ['my-custom-agent', 42];
    });
    assert.match(doctor(dir).block('_gyre excluded_agents'), /NOT applied beyond my-custom-agent\./);
    const r = run(BINS['convoke-update'], dir, ['--refresh', '--yes']);
    assert.match(r.stdout + r.stderr, /NOT applied beyond my-custom-agent\./, 'fixture: the installer says the same');
  });

  it('R2: a pending agent whose file is gone is still noted on the agents line', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach']; });
    fs.removeSync(path.join(dir, '_bmad/bme/_gyre/agents/review-coach.md'));
    assert.match(doctor(dir).block('_gyre agents'), /\(1 opt-out pending: review-coach\)/);
  });

  it('R2: an unknown id beside a pending one does not say the pending one applies', () => {
    editConfig(dir, '_gyre', (c) => { c.excluded_agents = ['review-coach', 'reviewcoach']; });
    const f = doctor(dir).block('_gyre excluded_agents');
    assert.ok(!/still applies/.test(f), f);
  });

  it('R1: a repeated id is one id', () => {
    editConfig(dir, '_enhance', (c) => { c.excluded_agents = ['x', 'x']; });
    assert.match(doctor(dir).block('_enhance excluded_agents'), /so "x" is not opted out/);
  });
});

describe('T266: classifyExclusions is the one definition', () => {
  const { classifyExclusions } = require('../../scripts/update/lib/config-merger');

  it('splits a read module\'s list into applied, pending and unknown', () => {
    const c = classifyExclusions('_gyre', {
      agents: ['stack-detective', 'review-coach', 'mine'],
      excluded_agents: ['review-coach', 'model-curator', 'mine', 'typo', 'contextualization-expert', 'review-coach'],
    }, (id) => id === 'model-curator');
    assert.equal(c.read, true);
    assert.deepEqual(c.pending, ['model-curator'], 'the wrapper decides, not agents:');
    assert.deepEqual(c.applied, ['review-coach']);
    assert.deepEqual(c.own, ['mine']);
    assert.deepEqual(c.unknown, ['typo', 'contextualization-expert']);
  });

  it('S5 on the install path: the warning names only the ids that apply', () => {
    const { parseExcludedAgents, resetExcludedAgentWarnings, MODULE_PROFILES } = require('../../scripts/update/lib/config-merger');
    const seen = [];
    const original = console.warn;
    console.warn = (m) => seen.push(m);
    try {
      resetExcludedAgentWarnings();
      parseExcludedAgents(['reviewcoach', 42], { source: '/p/_gyre/config.yaml', profile: MODULE_PROFILES._gyre });
      parseExcludedAgents(['review-coach', 42], { source: '/q/_gyre/config.yaml', profile: MODULE_PROFILES._gyre });
    } finally {
      console.warn = original;
      resetExcludedAgentWarnings();
    }
    assert.equal(seen.length, 2, seen.join('\n'));
    assert.match(seen[0], /NOT applied\./);
    assert.match(seen[1], /NOT applied beyond review-coach\./);
  });

  it('reads nothing for a module without a profile, or one named after an Object member', () => {
    for (const name of ['_enhance', 'toString', '__proto__']) {
      const c = classifyExclusions(name, { agents: ['x'], excluded_agents: ['x'] });
      assert.equal(c.read, false, name);
      assert.deepEqual([c.applied, c.pending, c.own, c.unknown], [[], [], [], []], name);
      assert.deepEqual(c.ids, ['x'], name);
    }
  });
});
