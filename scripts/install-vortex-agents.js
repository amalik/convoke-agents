#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { refreshInstallation } = require('./update/lib/refresh-installation');
const { findProjectRoot } = require('./update/lib/utils');
const { AGENTS } = require('./update/lib/agent-registry');

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

  const checks = [
    ...AGENTS.map(a => ({ path: `_bmad/bme/_vortex/agents/${a.id}.md`, name: `${a.name} agent file` })),
    ...AGENTS.map(a => ({ path: `.claude/skills/bmad-agent-bme-${a.id}/SKILL.md`, name: `${a.name} skill` })),
    { path: '_bmad/bme/_vortex/config.yaml', name: 'Configuration file' },
  ];

  let allChecksPass = true;
  checks.forEach(check => {
    const fullPath = path.join(projectRoot, check.path);
    if (fs.existsSync(fullPath)) {
      console.log(`${GREEN}  ✓${RESET} ${check.name}`);
    } else {
      console.log(`${RED}  ✗${RESET} ${check.name} - MISSING`);
      allChecksPass = false;
    }
  });

  if (!allChecksPass) {
    console.log('');
    console.error(`${RED}Installation verification failed. Some files are missing.${RESET}`);
    process.exit(1);
  }

  console.log(`${GREEN}  ✓${RESET} All files installed successfully`);
}

function printSuccess() {
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
    console.log(`  ${GREEN}✓${RESET} ${agent.name} (${agent.id}) - ${agent.title} ${agent.icon}`);
  }
  console.log('');
  console.log(`${BOLD}Next Steps:${RESET}`);
  console.log('');
  console.log(`  ${YELLOW}1.${RESET} Personalize your config:`);
  console.log(`     Edit ${CYAN}_bmad/bme/_vortex/config.yaml${RESET} and replace ${YELLOW}{user}${RESET} with your name`);
  console.log('');
  console.log(`  ${YELLOW}2.${RESET} Activate an agent (skill) in Claude Code:`);
  for (const agent of AGENTS) {
    console.log(`     ${CYAN}/bmad-agent-bme-${agent.id}${RESET}  (${agent.name})`);
  }
  console.log('');
  console.log(`  ${YELLOW}3.${RESET} Or read the agent file directly:`);
  console.log(`     ${CYAN}cat _bmad/bme/_vortex/agents/{agent-id}.md${RESET}`);
  console.log('');
}

async function main() {
  try {
    // Use findProjectRoot for existing projects, fall back to cwd for fresh installs
    const projectRoot = findProjectRoot() || process.cwd();

    printBanner();
    checkPrerequisites(projectRoot);
    archiveDeprecatedWorkflows(projectRoot);
    createOutputDirectory(projectRoot);

    // Use refreshInstallation for agents, workflows, config, guides, manifest, and skills
    console.log(`${CYAN}[4/5]${RESET} Installing agents, workflows, config, and guides...`);
    await refreshInstallation(projectRoot, { backupGuides: false });
    console.log(`${GREEN}  ✓${RESET} Installation refreshed`);

    verifyInstallation(projectRoot);
    printSuccess();
  } catch (error) {
    console.error(`${RED}✗ Installation failed:${RESET}`, error.message);
    process.exit(1);
  }
}

main();
