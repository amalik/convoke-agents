#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { refreshInstallation } = require('./update/lib/refresh-installation');
const { findProjectRoot } = require('./update/lib/utils');
const { GYRE_AGENTS } = require('./update/lib/agent-registry');

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

  const checks = [
    ...GYRE_AGENTS.map(a => ({ path: `_bmad/bme/_gyre/agents/${a.id}.md`, name: `${a.name} agent file` })),
    ...GYRE_AGENTS.map(a => ({ path: `.claude/skills/bmad-agent-bme-${a.id}/SKILL.md`, name: `${a.name} skill` })),
    { path: '_bmad/bme/_gyre/config.yaml', name: 'Configuration file' },
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
  console.log(`${GREEN}${BOLD}║    ✓  All Gyre Agents Installed! 🎉               ║${RESET}`);
  console.log(`${GREEN}${BOLD}║                                                    ║${RESET}`);
  console.log(`${GREEN}${BOLD}╚════════════════════════════════════════════════════╝${RESET}`);
  console.log('');
  console.log(`${BOLD}Installed Agents:${RESET}`);
  console.log('');
  for (const agent of GYRE_AGENTS) {
    console.log(`  ${GREEN}✓${RESET} ${agent.name} (${agent.id}) - ${agent.title} ${agent.icon}`);
  }
  console.log('');
  console.log(`${BOLD}Next Steps:${RESET}`);
  console.log('');
  console.log(`  ${YELLOW}1.${RESET} Personalize your config:`);
  console.log(`     Edit ${CYAN}_bmad/bme/_gyre/config.yaml${RESET} and replace ${YELLOW}{user}${RESET} with your name`);
  console.log('');
  console.log(`  ${YELLOW}2.${RESET} Activate an agent (skill) in Claude Code:`);
  for (const agent of GYRE_AGENTS) {
    console.log(`     ${CYAN}/bmad-agent-bme-${agent.id}${RESET}  (${agent.name})`);
  }
  console.log('');
  console.log(`  ${YELLOW}3.${RESET} Or read the agent file directly:`);
  console.log(`     ${CYAN}cat _bmad/bme/_gyre/agents/{agent-id}.md${RESET}`);
  console.log('');
}

async function main() {
  try {
    const projectRoot = findProjectRoot();

    printBanner();
    checkPrerequisites(projectRoot);
    createOutputDirectory(projectRoot);

    console.log(`${CYAN}[3/4]${RESET} Installing agents, workflows, config, and contracts...`);
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
