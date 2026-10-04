const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { runScript, PACKAGE_ROOT, removeTempDir } = require('../helpers');

// ─────────────────────────────────────────────────────────────────
// T251, Round 1. The defect was that a conforming `excluded_agents` made an installer print
// `Installation verification failed` and exit 1 while the opt-out had worked. The fix was pinned
// only INSIDE `agentInstallChecks` — nothing ran a bin with an exclusion, and `excluded_agents`
// appears nowhere in `ci.yml`. Review demonstrated the gap: an installer that calls the shared
// module and then overrides its result, or that reverts to the old inline list while keeping the
// module's names in a comment, restored the exact defect with the whole suite green. A text test
// over call syntax cannot see that, and it reddened on three behaviour-preserving refactors.
//
// So the property is asserted where it lives: run the real bin with a real exclusion.
// ─────────────────────────────────────────────────────────────────

const CASES = [
  {
    bin: 'scripts/install-vortex-agents.js',
    module: '_vortex',
    excludeId: 'learning-decision-expert',
    excludeName: 'Max',
  },
  {
    bin: 'scripts/install-gyre-agents.js',
    module: '_gyre',
    excludeId: 'review-coach',
    excludeName: 'Coach',
  },
];

async function withProject(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't251-bin-'));
  try {
    return await fn(dir);
  } finally {
    await removeTempDir(dir);
  }
}

describe('T251 — an installer honours excluded_agents (run against the real bin)', () => {
  for (const c of CASES) {
    const script = path.join(PACKAGE_ROOT, c.bin);

    it(`${c.bin}: a fresh install with the exclusion already present succeeds`, async () => {
      await withProject(async (dir) => {
        // The IN-194 shape: the operator writes the opt-out before ever installing, so the agent
        // file is never copied either and BOTH checks used to fail.
        await fs.outputFile(
          path.join(dir, '_bmad/bme', c.module, 'config.yaml'),
          `submodule_name: ${c.module}\nmodule: bme\nexcluded_agents: [${c.excludeId}]\n`,
          'utf8'
        );

        const { exitCode, stdout } = await runScript(script, [], { cwd: dir, timeout: 60000 });

        assert.equal(exitCode, 0,
          `the supported opt-out must not fail the install. stdout:\n${stdout}`);
        assert.match(stdout, new RegExp(`${c.excludeName} skill\\s+— opted out`),
          'the excluded agent must be reported as opted out, not as missing');
        assert.doesNotMatch(stdout, /Installation verification failed/,
          'verification must not fail on a conforming exclusion');
        assert.doesNotMatch(stdout, new RegExp(`${c.excludeName} skill - MISSING`),
          'this exact line is the T251 defect');
      });
    });

    it(`${c.bin}: the excluded agent's slash command is not advertised`, async () => {
      await withProject(async (dir) => {
        await fs.outputFile(
          path.join(dir, '_bmad/bme', c.module, 'config.yaml'),
          `submodule_name: ${c.module}\nmodule: bme\nexcluded_agents: [${c.excludeId}]\n`,
          'utf8'
        );

        const { exitCode, stdout } = await runScript(script, [], { cwd: dir, timeout: 60000 });
        assert.equal(exitCode, 0);
        // The success banner listed every opted-out agent as installed, with a slash command that
        // cannot resolve. Fixing the verdict is what made that reachable.
        assert.doesNotMatch(stdout, new RegExp(`/bmad-agent-bme-${c.excludeId}\\b`),
          'an agent with no wrapper must not be offered as a slash command');
        assert.match(stdout, /opted out, no slash command/,
          'and the banner must say why it is listed differently');
      });
    });

    it(`${c.bin}: with no exclusions, every agent is still verified present`, async () => {
      await withProject(async (dir) => {
        const { exitCode, stdout } = await runScript(script, [], { cwd: dir, timeout: 60000 });
        assert.equal(exitCode, 0, `clean install must succeed. stdout:\n${stdout}`);
        // The positive control: without this, every assertion above is satisfied by a bin that
        // verifies nothing at all.
        assert.match(stdout, /agent file/, 'agent files must still be checked');
        assert.doesNotMatch(stdout, /— opted out/, 'nothing is excluded here');
        assert.doesNotMatch(stdout, /Installation verification failed/);
      });
    });
  }
});
