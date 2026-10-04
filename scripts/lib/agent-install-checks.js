'use strict';

const fs = require('fs');
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
function agentInstallChecks({ projectRoot, agents, configRel, agentFileFor, excluded: provided }) {
  const excluded = new Set(
    provided || configMerger.readExcludedAgents(path.join(projectRoot, configRel))
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
 * EXACT-NAME presence, every path component. `fs.existsSync` is case-INSENSITIVE on APFS, while
 * the stale-wrapper sweep in `refreshInstallation` filters `readdir` entries with a case-SENSITIVE
 * `startsWith('bmad-agent-bme-')`. A directory stored as `Bmad-agent-bme-<id>` was therefore
 * invisible to the sweep and present to the verifier, so an excluded agent failed verification
 * with `STILL INSTALLED` on every run, forever — nothing in the package would ever delete it and
 * the message did not name the path. The two layers must share one notion of existence, and the
 * sweep's is the stricter one, so this matches it.
 *
 * A first version of this module claimed the `absent` branch was "effectively unreachable" through
 * a bin for that reason. That claim was false, and it was written to justify testing the branch at
 * the unit level only.
 *
 * @param {string} projectRoot
 * @param {string} rel - forward-slash relative path
 * @returns {boolean}
 */
function pathPresent(projectRoot, rel) {
  let dir = projectRoot;
  for (const part of rel.split('/')) {
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return false;
    }
    if (!entries.includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}

/**
 * Does a check hold? The VERDICT lives here, not in each installer: extracting only the check list
 * left the pass/fail rule duplicated in both, which is how one rule becomes five.
 *
 * @param {{expect: 'present'|'absent'}} check
 * @param {boolean} exists
 * @returns {boolean}
 */
function checkHolds(check, exists) {
  return check.expect === 'absent' ? !exists : exists;
}

/**
 * The whole verification decision for one module: what is expected, whether it is there, and
 * whether that holds. Installers render this; they do not compute any part of it. `excluded` is
 * returned so a caller's success report can agree with the verdict — the first version left
 * `printSuccess` listing every excluded agent and its slash command as installed, which the fix
 * to the verdict is what made reachable.
 *
 * @returns {{results: Array<{path: string, name: string, expect: string, exists: boolean, held: boolean}>,
 *            excluded: string[], allHeld: boolean, anyPresentExpected: boolean}}
 */
function evaluateAgentInstall({ projectRoot, agents, configRel, agentFileFor }) {
  const excluded = configMerger.readExcludedAgents(path.join(projectRoot, configRel));
  const checks = agentInstallChecks({ projectRoot, agents, configRel, agentFileFor, excluded });
  const results = checks.map((check) => {
    const exists = pathPresent(projectRoot, check.path);
    return { ...check, exists, held: checkHolds(check, exists) };
  });
  return {
    results,
    excluded,
    allHeld: results.every((r) => r.held),
    // If nothing is expected PRESENT beyond the config, the run verified no installed artefact at
    // all — every roster agent was opted out. That is reportable, not a clean bill of health.
    anyPresentExpected: results.some((r) => r.expect === 'present' && r.path !== configRel),
  };
}

module.exports = { agentInstallChecks, checkHolds, pathPresent, evaluateAgentInstall };
