'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const { agentInstallChecks, checkHolds } = require('../../scripts/lib/agent-install-checks');
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

describe('T251 — both installers use the shared expectation (a floor)', () => {
  // Narrow on purpose. This checks that each bin references the shared module; it cannot establish
  // that no bin re-derives the expectation some other way. Stated rather than overclaimed.
  for (const bin of ['scripts/install-gyre-agents.js', 'scripts/install-vortex-agents.js']) {
    it(`${bin} calls agentInstallChecks`, () => {
      const src = fs.readFileSync(path.join(__dirname, '..', '..', bin), 'utf8');
      assert.match(src, /agentInstallChecks\(\{/, 'the verification list must come from the shared module');
      assert.match(src, /checkHolds\(check, exists\)/, 'and so must the pass/fail verdict');
    });
  }
});
