#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { refreshInstallation } = require('./update/lib/refresh-installation');
const { findProjectRoot } = require('./update/lib/utils');
const { runCompatPreflight } = require('./update/lib/compat-preflight');
const { GYRE_AGENTS } = require('./update/lib/agent-registry');
const { evaluateAgentInstall } = require('./lib/agent-install-checks');

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GREY = '\x1b[90m';

function printBanner() {
  console.log('');
  console.log(`${GREY}  ██████╗ ██████╗ ███╗   ██╗██╗   ██╗ ██████╗ ██╗  ██╗███████╗${RESET}`);
  console.log(`${GREY} ██╔════╝██╔═══██╗████╗  ██║██║   ██║██╔═══██╗██║ ██╔╝██╔════╝${RESET}`);
  console.log(`${GREY} ██║     ██║   ██║██╔██╗ ██║██║   ██║██║   ██║█████╔╝ █████╗  ${RESET}`);
  console.log(`${GREY} ██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══╝  ${RESET}`);
  console.log(`${GREY} ╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ╚██████╔╝██║  ██╗███████╗${RESET}`);
  console.log(`${GREY}  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝${RESET}`);
  console.log(`${GREY}       Agent teams for complex systems${RESET}`);
  console.log('');
  console.log(`${BOLD} Gyre Module — Production readiness discovery${RESET}`);
  console.log('');
}

function checkPrerequisites(projectRoot) {
  console.log(`${CYAN}[1/4]${RESET} Checking prerequisites...`);

  const bmadDir = path.join(projectRoot, '_bmad');

  if (!fs.existsSync(bmadDir)) {
    console.log(`${YELLOW}  ⚠${RESET} _bmad directory not found - creating it`);
    fs.mkdirSync(bmadDir, { recursive: true });
  } else {
    console.log(`${GREEN}  ✓${RESET} BMAD directory detected`);
  }

  const bmadConfigPath = path.join(bmadDir, '_config', 'bmad.yaml');
  if (fs.existsSync(bmadConfigPath)) {
    console.log(`${GREEN}  ✓${RESET} BMAD Method configuration found`);
  } else {
    console.log(`${YELLOW}  ⚠${RESET} BMAD Method not detected (Convoke will install standalone)`);
  }

  console.log(`${GREEN}  ✓${RESET} Prerequisites met`);
}

function createOutputDirectory(projectRoot) {
  console.log(`${CYAN}[2/4]${RESET} Setting up output directory...`);

  const outputDir = path.join(projectRoot, '_bmad-output', 'gyre-artifacts');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`${GREEN}  ✓${RESET} Output directory ready`);
}

function verifyInstallation(projectRoot) {
  console.log(`${CYAN}[4/4]${RESET} Verifying installation...`);

  const { results, excluded, allHeld, anyPresentExpected } = evaluateAgentInstall({
    projectRoot,
    agents: GYRE_AGENTS,
    configRel: '_bmad/bme/_gyre/config.yaml',
    agentFileFor: (a) => `_bmad/bme/_gyre/agents/${a.id}.md`,
  });

  let sawPresentFailure = false;
  let sawAbsentFailure = false;
  results.forEach((r) => {
    if (r.held) {
      console.log(`${GREEN}  ✓${RESET} ${r.name}${r.expect === 'absent' ? ' — opted out' : ''}`);
      return;
    }
    if (r.expect === 'absent') {
      sawAbsentFailure = true;
      console.log(`${RED}  ✗${RESET} ${r.name} - STILL INSTALLED at ${r.path}, the opt-out did not take effect`);
    } else {
      sawPresentFailure = true;
      console.log(`${RED}  ✗${RESET} ${r.name} - MISSING`);
    }
  });

  if (!allHeld) {
    console.log('');
    // The summary must match the failure: an `absent` check fails because something is PRESENT.
    const why = sawPresentFailure && sawAbsentFailure
      ? 'Some files are missing, and an opted-out agent is still installed.'
      : sawAbsentFailure
        ? 'An opted-out agent is still installed.'
        : 'Some files are missing.';
    console.error(`${RED}Installation verification failed. ${why}${RESET}`);
    process.exit(1);
  }

  if (!anyPresentExpected) {
    // Every roster agent is opted out, so nothing installed was verified. Reporting this as a
    // clean install would be the T251 defect inverted.
    console.log(`${YELLOW}  !${RESET} All ${GYRE_AGENTS.length} agents are opted out — nothing from this module is invocable`);
  } else {
    // Scoped deliberately: this step checks agent files, wrappers and the module config —
    // not the other module trees, the non-agent wrappers or `_bmad/_config/`. Saying "all
    // files" claimed a sweep it never made.
    console.log(`${GREEN}  ✓${RESET} Agent files, skills and config verified — run ${CYAN}convoke-doctor${RESET} for a full check`);
  }
  return excluded;
}

function printSuccess(excluded = []) {
  console.log('');
  console.log(`${GREEN}${BOLD}╔════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${GREEN}${BOLD}║                                                    ║${RESET}`);
  console.log(`${GREEN}${BOLD}║    ✓  All Gyre Agents Installed! 🎉               ║${RESET}`);
  console.log(`${GREEN}${BOLD}║                                                    ║${RESET}`);
  console.log(`${GREEN}${BOLD}╚════════════════════════════════════════════════════╝${RESET}`);
  console.log('');
  console.log(`${BOLD}Installed Agents:${RESET}`);
  console.log('');
  for (const agent of GYRE_AGENTS) {
    // T251 R1: this listed every opted-out agent as installed, with a slash command that cannot
    // resolve. Pre-fix it was unreachable because verification exited 1 first — fixing the verdict
    // is what exposed it.
    const out = excluded.includes(agent.id);
    const mark = out ? `${YELLOW}!${RESET}` : `${GREEN}✓${RESET}`;
    const note = out ? ` ${YELLOW}— opted out, no slash command${RESET}` : '';
    console.log(`  ${mark} ${agent.name} (${agent.id}) - ${agent.title} ${agent.icon}${note}`);
  }
  console.log('');
  console.log(`${BOLD}Next Steps:${RESET}`);
  console.log('');
  console.log(`  ${YELLOW}1.${RESET} Personalize your config:`);
  console.log(`     Edit ${CYAN}_bmad/bme/_gyre/config.yaml${RESET} and replace ${YELLOW}{user}${RESET} with your name`);
  console.log('');
  console.log(`  ${YELLOW}2.${RESET} Activate an agent (skill) in Claude Code:`);
  for (const agent of GYRE_AGENTS) {
    if (excluded.includes(agent.id)) continue;
    console.log(`     ${CYAN}/bmad-agent-bme-${agent.id}${RESET}  (${agent.name})`);
  }
  console.log('');
  console.log(`  ${YELLOW}3.${RESET} Or read the agent file directly:`);
  console.log(`     ${CYAN}cat _bmad/bme/_gyre/agents/{agent-id}.md${RESET}`);
  console.log('');
}

async function main() {
  try {
    // Story v63-3-2 R2-H1: mirror install-vortex's `|| process.cwd()` pattern
    // exactly. R1-H1's `if (projectRoot)` guard prevented `runCompatPreflight`
    // from throwing, but the very next call `checkPrerequisites(projectRoot)`
    // (line 32) does `path.join(projectRoot, '_bmad')` — which crashes with
    // TypeError on null. The fresh-install case stayed broken; R1-H1 only
    // moved the crash one line down. `|| process.cwd()` ensures projectRoot
    // is always a string; preflight then degrades to absent-package WARNING
    // gracefully via Decision 1's clause-4 fallback.
    const projectRoot = findProjectRoot() || process.cwd();

    runCompatPreflight(projectRoot);

    printBanner();
    checkPrerequisites(projectRoot);
    createOutputDirectory(projectRoot);

    console.log(`${CYAN}[3/4]${RESET} Installing agents, workflows, config, and contracts...`);
    await refreshInstallation(projectRoot, { backupGuides: false });
    console.log(`${GREEN}  ✓${RESET} Installation refreshed`);

    const excluded = verifyInstallation(projectRoot);
    printSuccess(excluded);
  } catch (error) {
    console.error(`${RED}✗ Installation failed:${RESET}`, error.message);
    process.exit(1);
  }
}

main();
