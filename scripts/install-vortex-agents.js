#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { refreshInstallation } = require('./update/lib/refresh-installation');
const { findProjectRoot } = require('./update/lib/utils');
const { runCompatPreflight } = require('./update/lib/compat-preflight');
const { AGENTS } = require('./update/lib/agent-registry');
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
  console.log(`${BOLD} Domain-specialized agent teams | compatible with BMAD Method${RESET}`);
  console.log('');
}

function checkPrerequisites(projectRoot) {
  console.log(`${CYAN}[1/5]${RESET} Checking prerequisites...`);

  const bmadDir = path.join(projectRoot, '_bmad');

  // Create _bmad directory if it doesn't exist
  if (!fs.existsSync(bmadDir)) {
    console.log(`${YELLOW}  ⚠${RESET} _bmad directory not found - creating it`);
    fs.mkdirSync(bmadDir, { recursive: true });
  } else {
    console.log(`${GREEN}  ✓${RESET} BMAD directory detected`);
  }

  // Check for BMAD Method configuration (optional)
  const bmadConfigPath = path.join(bmadDir, '_config', 'bmad.yaml');
  if (fs.existsSync(bmadConfigPath)) {
    console.log(`${GREEN}  ✓${RESET} BMAD Method configuration found`);
  } else {
    console.log(`${YELLOW}  ⚠${RESET} BMAD Method not detected (Convoke will install standalone)`);
  }

  console.log(`${GREEN}  ✓${RESET} Prerequisites met`);
}

function archiveDeprecatedWorkflows(projectRoot) {
  console.log(`${CYAN}[2/5]${RESET} Archiving deprecated workflows...`);

  const sourceDir = path.join(__dirname, '..', '_bmad', 'bme', '_vortex');
  const targetDir = path.join(projectRoot, '_bmad', 'bme', '_vortex');

  // Only wireframe is deprecated now; empathy-map is live for Isla
  const deprecatedWorkflows = ['wireframe'];

  for (const workflow of deprecatedWorkflows) {
    const workflowSourceDir = path.join(sourceDir, 'workflows', '_deprecated', workflow);
    const workflowTargetDir = path.join(targetDir, 'workflows', '_deprecated', workflow);

    if (fs.existsSync(workflowSourceDir)) {
      fs.copySync(workflowSourceDir, workflowTargetDir);
      console.log(`${GREEN}  ✓${RESET} Archived ${workflow} to _deprecated/`);
    }
  }

  // Legacy cleanup
  cleanupLegacyFiles(projectRoot);
}

function cleanupLegacyFiles(projectRoot) {
  console.log(`${CYAN}  →${RESET} Cleaning up legacy files...`);

  // Remove _designos directory (pre-Vortex structure) from all possible locations
  const legacyPaths = [
    path.join(projectRoot, '_bmad', 'bme', '_designos'),
    path.join(projectRoot, '_bmad', '_designos'),
  ];

  for (const legacyPath of legacyPaths) {
    if (fs.existsSync(legacyPath)) {
      fs.removeSync(legacyPath);
      console.log(`${GREEN}    ✓${RESET} Removed legacy directory: ${path.relative(projectRoot, legacyPath)}`);
    }
  }

  console.log(`${GREEN}  ✓${RESET} Legacy cleanup complete`);
}

function createOutputDirectory(projectRoot) {
  console.log(`${CYAN}[3/5]${RESET} Setting up output directory...`);

  const outputDir = path.join(projectRoot, '_bmad-output', 'vortex-artifacts');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`${GREEN}  ✓${RESET} Output directory ready`);
}

function verifyInstallation(projectRoot) {
  console.log(`${CYAN}[5/5]${RESET} Verifying installation...`);

  const { results, excluded, allHeld, anyPresentExpected } = evaluateAgentInstall({
    projectRoot,
    agents: AGENTS,
    configRel: '_bmad/bme/_vortex/config.yaml',
    agentFileFor: (a) => `_bmad/bme/_vortex/agents/${a.id}/SKILL.md`,
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
    console.log(`${YELLOW}  !${RESET} All ${AGENTS.length} agents are opted out — nothing from this module is invocable`);
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
  console.log(`${GREEN}${BOLD}║    ✓  All Vortex Agents Installed! 🎉             ║${RESET}`);
  console.log(`${GREEN}${BOLD}║                                                    ║${RESET}`);
  console.log(`${GREEN}${BOLD}╚════════════════════════════════════════════════════╝${RESET}`);
  console.log('');
  console.log(`${BOLD}Installed Agents:${RESET}`);
  console.log('');
  for (const agent of AGENTS) {
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
  console.log(`     Edit ${CYAN}_bmad/bme/_vortex/config.yaml${RESET} and replace ${YELLOW}{user}${RESET} with your name`);
  console.log('');
  console.log(`  ${YELLOW}2.${RESET} Activate an agent (skill) in Claude Code:`);
  for (const agent of AGENTS) {
    if (excluded.includes(agent.id)) continue;
    console.log(`     ${CYAN}/bmad-agent-bme-${agent.id}${RESET}  (${agent.name})`);
  }
  console.log('');
  console.log(`  ${YELLOW}3.${RESET} Or read the agent file directly:`);
  console.log(`     ${CYAN}cat _bmad/bme/_vortex/agents/{agent-id}/SKILL.md${RESET}`);
  console.log('');
}

async function main() {
  try {
    // Use findProjectRoot for existing projects, fall back to cwd for fresh installs
    const projectRoot = findProjectRoot() || process.cwd();

    // Story v63-3-2 (FR23): runtime BMAD-version preflight. Soft-warn only —
    // emits stderr WARNING when BMAD < 6.3 or absent; never blocks install.
    runCompatPreflight(projectRoot);

    printBanner();
    checkPrerequisites(projectRoot);
    archiveDeprecatedWorkflows(projectRoot);
    createOutputDirectory(projectRoot);

    // Use refreshInstallation for agents, workflows, config, guides, manifest, and skills
    console.log(`${CYAN}[4/5]${RESET} Installing agents, workflows, config, and guides...`);
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
