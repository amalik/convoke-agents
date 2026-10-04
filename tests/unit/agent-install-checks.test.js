'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const {
  agentInstallChecks,
  checkHolds,
  pathPresent,
  evaluateAgentInstall,
} = require('../../scripts/lib/agent-install-checks');
const { resetExcludedAgentWarnings } = require('../../scripts/update/lib/config-merger');

// ─────────────────────────────────────────────────────────────────
// T251. Both installers built their verification list from the registry alone, so a conforming
// `excluded_agents` made the run print `Installation verification failed. Some files are missing.`
// and exit 1 while the opt-out had worked correctly. Measured before the fix:
// `convoke-install-vortex` with `[learning-decision-expert]` → `✗ Max skill - MISSING`, exit 1;
// a FRESH `convoke-install-gyre` with `[review-coach]` → two failures, exit 1.
// ─────────────────────────────────────────────────────────────────

const ROSTER = [{ id: 'scout', name: 'Scout' }, { id: 'coach', name: 'Coach' }];
const CONFIG_REL = '_bmad/bme/_gyre/config.yaml';
const fileFor = (a) => `_bmad/bme/_gyre/agents/${a.id}.md`;

async function withConfig(body, fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't251-'));
  if (body !== null) await fs.outputFile(path.join(dir, CONFIG_REL), body, 'utf8');
  resetExcludedAgentWarnings();
  const real = console.warn;
  console.warn = () => {};
  try {
    return await fn(dir);
  } finally {
    console.warn = real;
    await fs.remove(dir);
  }
}

const find = (checks, p) => checks.find((c) => c.path === p);

describe('T251 — checkHolds owns the pass/fail rule', () => {
  // Extracting only the check LIST left this rule copied into both installers. The `absent` case
  // is effectively unreachable through a bin — `refreshInstallation` deletes wrappers outside the
  // expected set before verification runs — so it is asserted here or nowhere.
  it('present expects the path to exist', () => {
    assert.equal(checkHolds({ expect: 'present' }, true), true);
    assert.equal(checkHolds({ expect: 'present' }, false), false);
  });

  it('absent expects the path NOT to exist', () => {
    assert.equal(checkHolds({ expect: 'absent' }, false), true);
    assert.equal(checkHolds({ expect: 'absent' }, true), false,
      'a wrapper that survived for an opted-out agent must fail the install');
  });
});

describe('T251 — the expected set honours the opt-out', () => {
  it('with no exclusions, every agent must have its file and its wrapper', async () => {
    await withConfig('excluded_agents: []\n', async (dir) => {
      const checks = agentInstallChecks({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      for (const a of ROSTER) {
        assert.equal(find(checks, fileFor(a)).expect, 'present', `${a.id} agent file`);
        assert.equal(find(checks, `.claude/skills/bmad-agent-bme-${a.id}/SKILL.md`).expect, 'present', `${a.id} wrapper`);
      }
      assert.equal(find(checks, CONFIG_REL).expect, 'present');
      // `name` is what the installer prints. With it unasserted, dropping it left the suite green
      // and the bin printing `✓ undefined` for every check.
      assert.equal(find(checks, fileFor(ROSTER[0])).name, `${ROSTER[0].name} agent file`);
      assert.equal(find(checks, `.claude/skills/bmad-agent-bme-${ROSTER[0].id}/SKILL.md`).name,
        `${ROSTER[0].name} skill`);
      assert.equal(find(checks, CONFIG_REL).name, 'Configuration file');
    });
  });

  it('an excluded agent is not required to be installed — the T251 regression', async () => {
    await withConfig('excluded_agents: [coach]\n', async (dir) => {
      const checks = agentInstallChecks({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      const wrapper = find(checks, '.claude/skills/bmad-agent-bme-coach/SKILL.md');
      assert.ok(wrapper, 'the excluded agent must still be reported, not dropped silently');
      assert.equal(wrapper.expect, 'absent',
        'requiring an opted-out wrapper to be present is what failed the install');
      assert.equal(find(checks, fileFor({ id: 'coach' })), undefined,
        'a refresh skips copying the agent file but never deletes it, so neither state is checked');
      // Pin the SET, not one absence. Checking only that one spelling is missing was satisfied by
      // re-adding the row as `./${agentFileFor(agent)}` — `find` missed it, `path.join` normalised
      // it, and the bin required the excluded agent's file present again.
      assert.deepEqual(
        checks.map((c) => c.path).sort(),
        [
          CONFIG_REL,
          '.claude/skills/bmad-agent-bme-coach/SKILL.md',
          '.claude/skills/bmad-agent-bme-scout/SKILL.md',
          fileFor({ id: 'scout' }),
        ].sort(),
        'exactly one wrapper for the excluded agent, a file and a wrapper for the other, and the config'
      );
      // The other agent is untouched.
      assert.equal(find(checks, fileFor({ id: 'scout' })).expect, 'present');
      assert.equal(find(checks, '.claude/skills/bmad-agent-bme-scout/SKILL.md').expect, 'present');
    });
  });

  it('a NON-conforming excluded_agents excludes nothing, so the full roster is expected', async () => {
    // Delegated to `configMerger.readExcludedAgents` (T244), not re-decided here.
    await withConfig('excluded_agents: coach\n', async (dir) => {
      const checks = agentInstallChecks({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      assert.equal(find(checks, '.claude/skills/bmad-agent-bme-coach/SKILL.md').expect, 'present');
      assert.equal(find(checks, fileFor({ id: 'coach' })).expect, 'present');
    });
  });

  it('a missing config excludes nothing rather than throwing', async () => {
    await withConfig(null, async (dir) => {
      const checks = agentInstallChecks({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      assert.equal(checks.filter((c) => c.expect === 'absent').length, 0);
      assert.equal(checks.length, ROSTER.length * 2 + 1);
    });
  });

  it('the config itself is always required', async () => {
    for (const body of ['excluded_agents: []\n', 'excluded_agents: [coach]\n', 'excluded_agents: coach\n']) {
      await withConfig(body, async (dir) => {
        const checks = agentInstallChecks({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
        assert.equal(find(checks, CONFIG_REL).expect, 'present', `config check missing for ${body.trim()}`);
      });
    }
  });
});

// The text guard that stood here asserted each bin's CALL SHAPES. It was evadable — a bin could
// call the module and then override its result, or revert to the old inline list while keeping the
// module's names in a comment, with the whole suite green — and it reddened on three
// behaviour-preserving refactors (renaming the loop variable, a prettier wrap, hoisting the options
// object). `tests/integration/installer-opt-out.test.js` runs the real bins with a real exclusion
// instead, and kills both evasions. A behavioural property belongs in a behavioural test.

describe('T251 — existence is resolved the way the stale-wrapper sweep resolves it', () => {
  // `fs.existsSync` is case-INSENSITIVE on APFS; the sweep filters `readdir` entries with a
  // case-SENSITIVE `startsWith('bmad-agent-bme-')`. A directory stored as `Bmad-agent-bme-<id>`
  // was invisible to the sweep and present to the verifier, so an excluded agent failed
  // verification with STILL INSTALLED on every run, unhealably.
  it('a case-variant directory is not reported present under the canonical name', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't251c-'));
    try {
      await fs.outputFile(path.join(dir, '.claude/skills/Bmad-agent-bme-coach/SKILL.md'), 'x', 'utf8');
      assert.equal(pathPresent(dir, '.claude/skills/bmad-agent-bme-coach/SKILL.md'), false,
        'the canonical name is not on disk, so it must not be reported present');
      assert.equal(pathPresent(dir, '.claude/skills/Bmad-agent-bme-coach/SKILL.md'), true,
        'the name that IS on disk must be found, or this is just broken rather than exact');
    } finally {
      await fs.remove(dir);
    }
  });

  it('every path component is matched exactly, not just the basename', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't251c-'));
    try {
      await fs.outputFile(path.join(dir, 'a/B/c.md'), 'x', 'utf8');
      assert.equal(pathPresent(dir, 'a/B/c.md'), true);
      assert.equal(pathPresent(dir, 'a/b/c.md'), false, 'a mid-path case difference must not pass');
      assert.equal(pathPresent(dir, 'a/B/C.md'), false, 'nor a basename case difference');
      assert.equal(pathPresent(dir, 'a/B/missing.md'), false);
      assert.equal(pathPresent(dir, 'nope/B/c.md'), false, 'an unreadable parent is simply absent');
    } finally {
      await fs.remove(dir);
    }
  });
});

describe('T251 — the whole decision, including the all-excluded case', () => {
  it('reports excluded ids so a success report can agree with the verdict', async () => {
    await withConfig('excluded_agents: [coach]\n', async (dir) => {
      const e = evaluateAgentInstall({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      assert.deepEqual(e.excluded, ['coach'],
        'printSuccess listed every opted-out agent as installed because it had no access to this');
    });
  });

  it('flags a run where every roster agent is opted out', async () => {
    await withConfig('excluded_agents: [scout, coach]\n', async (dir) => {
      const e = evaluateAgentInstall({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      assert.equal(e.anyPresentExpected, false,
        'nothing installed was verified, so this must not read as a clean install');
      assert.ok(e.results.every((r) => r.expect === 'absent' || r.path === CONFIG_REL));
    });
  });

  it('a normal run does expect something present', async () => {
    await withConfig('excluded_agents: [coach]\n', async (dir) => {
      const e = evaluateAgentInstall({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      assert.equal(e.anyPresentExpected, true);
    });
  });

  it('allHeld is false when an expected file is missing, and true once it is there', async () => {
    await withConfig('excluded_agents: []\n', async (dir) => {
      let e = evaluateAgentInstall({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      assert.equal(e.allHeld, false, 'nothing is installed in this fixture');
      for (const a of ROSTER) {
        await fs.outputFile(path.join(dir, fileFor(a)), 'x', 'utf8');
        await fs.outputFile(path.join(dir, `.claude/skills/bmad-agent-bme-${a.id}/SKILL.md`), 'x', 'utf8');
      }
      e = evaluateAgentInstall({ projectRoot: dir, agents: ROSTER, configRel: CONFIG_REL, agentFileFor: fileFor });
      assert.equal(e.allHeld, true);
    });
  });
});
