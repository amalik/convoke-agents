'use strict';

const path = require('path');
const configMerger = require('../update/lib/config-merger');

/**
 * The verification checks an installer should run, given the operator's opt-out list.
 *
 * T251: both installers listed every registry agent's agent file AND its skill wrapper
 * unconditionally, so a perfectly conforming `excluded_agents` made the run print
 * `Installation verification failed. Some files are missing.` and exit **1** while the opt-out had
 * worked correctly. Measured: `convoke-install-vortex` with `[learning-decision-expert]` excluded
 * reported `✗ Max skill - MISSING` and exit 1; a fresh `convoke-install-gyre` with
 * `[review-coach]` already in the config reported two failures, because nothing copied the agent
 * file either. The documented, supported way to opt an agent out made the installer declare the
 * install broken.
 *
 * ONE function, called by both installers. Teaching each verifier about exclusions separately
 * would have created two copies of the same rule — the defect `T244` spent a row consolidating
 * out of five sites.
 *
 * For an excluded agent the WRAPPER must be ABSENT. That is the opt-out's observable effect and
 * what makes the agent un-invocable, which `ADR-004` establishes as the contract rather than file
 * presence — so this verifies the opt-out took effect instead of merely not failing on it. The
 * agent FILE is not checked either way: a refresh skips copying it but never deletes it, so a file
 * left behind by an earlier install is expected, and so is its absence on a fresh install.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {Array<{id: string, name: string}>} options.agents - the module's registry roster
 * @param {string} options.configRel - the module config, relative to `projectRoot`
 * @param {(agent: {id: string}) => string} options.agentFileFor - the two modules differ: Vortex
 *   agents are directories, Gyre agents are flat files
 * @returns {Array<{path: string, name: string, expect: 'present'|'absent'}>}
 */
function agentInstallChecks({ projectRoot, agents, configRel, agentFileFor }) {
  const excluded = new Set(
    configMerger.readExcludedAgents(path.join(projectRoot, configRel))
  );

  const checks = [];
  for (const agent of agents) {
    const wrapper = `.claude/skills/bmad-agent-bme-${agent.id}/SKILL.md`;
    if (excluded.has(agent.id)) {
      checks.push({ path: wrapper, name: `${agent.name} skill`, expect: 'absent' });
      continue;
    }
    checks.push({ path: agentFileFor(agent), name: `${agent.name} agent file`, expect: 'present' });
    checks.push({ path: wrapper, name: `${agent.name} skill`, expect: 'present' });
  }
  checks.push({ path: configRel, name: 'Configuration file', expect: 'present' });
  return checks;
}

/**
 * Does a check hold, given whether its path exists? The VERDICT lives here, not in each
 * installer: extracting only the check list left the pass/fail rule duplicated in both, which is
 * how one rule becomes five.
 *
 * Note for anyone probing the `absent` branch through an installer: it is effectively unreachable
 * there, because `refreshInstallation` deletes wrappers outside the expected set BEFORE
 * verification runs, so a planted wrapper is gone by then. The branch is still worth asserting —
 * it is what would catch a refresh that stopped deleting — and it is exercised directly in
 * `tests/unit/agent-install-checks.test.js` rather than through the bin.
 *
 * @param {{expect: 'present'|'absent'}} check
 * @param {boolean} exists
 * @returns {boolean}
 */
function checkHolds(check, exists) {
  return check.expect === 'absent' ? !exists : exists;
}

module.exports = { agentInstallChecks, checkHolds };
