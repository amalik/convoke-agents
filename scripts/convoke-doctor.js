#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const yaml = require('js-yaml');
const { findProjectRoot, getPackageVersion } = require('./update/lib/utils');
const { AGENT_FILES, WORKFLOW_NAMES } = require('./update/lib/agent-registry');

/**
 * convoke-doctor — Diagnose common Convoke installation issues.
 * Runs a series of checks and reports pass/fail with actionable fix suggestions.
 */

async function main() {
  console.log('');
  console.log(chalk.cyan.bold('Convoke Doctor'));
  console.log(chalk.gray(`Package version: ${getPackageVersion()}`));
  console.log('');

  const projectRoot = findProjectRoot();
  const checks = [];

  // 1. Project root detection
  checks.push(checkProjectRoot(projectRoot));

  if (!projectRoot) {
    printResults(checks);
    process.exit(1);
    return;
  }

  // 2. Config file
  checks.push(checkConfig(projectRoot));

  // 3. Agent files
  checks.push(checkAgents(projectRoot));

  // 4. Workflow directories
  checks.push(checkWorkflows(projectRoot));

  // 5. Output directory writable
  checks.push(await checkOutputDir(projectRoot));

  // 6. Stale migration lock
  checks.push(checkMigrationLock(projectRoot));

  // 7. Version consistency
  checks.push(checkVersionConsistency(projectRoot));

  // 8. Workflow step structure
  checks.push(checkWorkflowStepStructure(projectRoot));

  printResults(checks);

  const failed = checks.filter(c => !c.passed);
  process.exit(failed.length > 0 ? 1 : 0);
}

function checkProjectRoot(projectRoot) {
  if (projectRoot) {
    return {
      name: 'Project root',
      passed: true,
      info: projectRoot
    };
  }
  return {
    name: 'Project root',
    passed: false,
    error: 'Could not find _bmad/ directory',
    fix: 'Run this command from inside a Convoke project, or run: npx -p convoke-agents convoke-install'
  };
}

function checkConfig(projectRoot) {
  const configPath = path.join(projectRoot, '_bmad/bme/_vortex/config.yaml');

  if (!fs.existsSync(configPath)) {
    return {
      name: 'Config file',
      passed: false,
      error: 'config.yaml not found',
      fix: 'Run: npx -p convoke-agents convoke-install'
    };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);

    if (!config || typeof config !== 'object') {
      return {
        name: 'Config file',
        passed: false,
        error: 'config.yaml is empty or invalid',
        fix: 'Delete _bmad/bme/_vortex/config.yaml and run: npx -p convoke-agents convoke-install'
      };
    }

    if (!config.agents) {
      return {
        name: 'Config file',
        passed: false,
        error: 'config.yaml missing agents section',
        fix: 'Run: npx -p convoke-agents convoke-update'
      };
    }

    return { name: 'Config file', passed: true, info: 'Valid YAML with agents section' };
  } catch (err) {
    return {
      name: 'Config file',
      passed: false,
      error: `YAML parse error: ${err.message}`,
      fix: 'Check config.yaml for syntax errors, or delete and run: npx -p convoke-agents convoke-install'
    };
  }
}

function checkAgents(projectRoot) {
  const agentsDir = path.join(projectRoot, '_bmad/bme/_vortex/agents');
  const required = AGENT_FILES;

  if (!fs.existsSync(agentsDir)) {
    return {
      name: 'Agent files',
      passed: false,
      error: 'agents/ directory not found',
      fix: 'Run: npx -p convoke-agents convoke-install-vortex'
    };
  }

  const missing = required.filter(f => !fs.existsSync(path.join(agentsDir, f)));

  if (missing.length > 0) {
    return {
      name: 'Agent files',
      passed: false,
      error: `Missing: ${missing.join(', ')}`,
      fix: 'Run: npx -p convoke-agents convoke-install-vortex to reinstall'
    };
  }

  // Check files are non-empty
  const empty = required.filter(f => {
    const stat = fs.statSync(path.join(agentsDir, f));
    return stat.size === 0;
  });

  if (empty.length > 0) {
    return {
      name: 'Agent files',
      passed: false,
      error: `Empty agent files: ${empty.join(', ')}`,
      fix: 'Run: npx -p convoke-agents convoke-install to restore agent files'
    };
  }

  return { name: 'Agent files', passed: true, info: `${required.length} agents present` };
}

function checkWorkflows(projectRoot) {
  const workflowsDir = path.join(projectRoot, '_bmad/bme/_vortex/workflows');
  const required = WORKFLOW_NAMES;

  if (!fs.existsSync(workflowsDir)) {
    return {
      name: 'Workflow directories',
      passed: false,
      error: 'workflows/ directory not found',
      fix: 'Run: npx -p convoke-agents convoke-install'
    };
  }

  const missing = required.filter(w =>
    !fs.existsSync(path.join(workflowsDir, w, 'workflow.md'))
  );

  if (missing.length > 0) {
    return {
      name: 'Workflow directories',
      passed: false,
      error: `Missing: ${missing.join(', ')}`,
      fix: 'Run: npx -p convoke-agents convoke-update to restore workflows'
    };
  }

  return { name: 'Workflow directories', passed: true, info: `${required.length} workflows present` };
}

async function checkOutputDir(projectRoot) {
  const outputDir = path.join(projectRoot, '_bmad-output');

  if (!fs.existsSync(outputDir)) {
    return {
      name: 'Output directory',
      passed: true,
      info: 'Not created yet (will be created on first use)'
    };
  }

  try {
    const testFile = path.join(outputDir, '.doctor-write-test');
    await fs.writeFile(testFile, 'test', 'utf8');
    await fs.remove(testFile);
    return { name: 'Output directory', passed: true, info: 'Writable' };
  } catch (_err) {
    return {
      name: 'Output directory',
      passed: false,
      error: '_bmad-output/ is not writable',
      fix: 'Check directory permissions: chmod -R u+w _bmad-output/'
    };
  }
}

function checkMigrationLock(projectRoot) {
  const lockFile = path.join(projectRoot, '_bmad-output/.migration-lock');

  if (!fs.existsSync(lockFile)) {
    return { name: 'Migration lock', passed: true, info: 'No active lock' };
  }

  try {
    const lock = fs.readJsonSync(lockFile);
    const age = Date.now() - lock.timestamp;
    const minutes = Math.round(age / 60000);

    if (age > 5 * 60 * 1000) {
      return {
        name: 'Migration lock',
        passed: false,
        error: `Stale lock file (${minutes} minutes old, PID ${lock.pid})`,
        fix: 'Remove the stale lock: rm _bmad-output/.migration-lock'
      };
    }

    return {
      name: 'Migration lock',
      passed: true,
      info: `Active lock (${minutes}m old, PID ${lock.pid}) — migration may be running`
    };
  } catch (_err) {
    return {
      name: 'Migration lock',
      passed: false,
      error: 'Corrupt lock file',
      fix: 'Remove the lock: rm _bmad-output/.migration-lock'
    };
  }
}

function checkVersionConsistency(projectRoot) {
  const configPath = path.join(projectRoot, '_bmad/bme/_vortex/config.yaml');
  const packageVersion = getPackageVersion();

  if (!fs.existsSync(configPath)) {
    return { name: 'Version consistency', passed: true, info: 'No config to check' };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    const installedVersion = config.version || config.installed_version;

    if (!installedVersion) {
      return {
        name: 'Version consistency',
        passed: true,
        info: `Package: ${packageVersion} (no installed version recorded in config)`
      };
    }

    if (installedVersion === packageVersion) {
      return {
        name: 'Version consistency',
        passed: true,
        info: `${packageVersion} — package and config match`
      };
    }

    return {
      name: 'Version consistency',
      passed: false,
      error: `Package: ${packageVersion}, Config: ${installedVersion}`,
      fix: 'Run: npx -p convoke-agents convoke-update'
    };
  } catch (_err) {
    return { name: 'Version consistency', passed: true, info: 'Could not read config version' };
  }
}

function checkWorkflowStepStructure(projectRoot) {
  const workflowsDir = path.join(projectRoot, '_bmad/bme/_vortex/workflows');

  if (!fs.existsSync(workflowsDir)) {
    return { name: 'Workflow step structure', passed: true, info: 'No workflows directory' };
  }

  const issues = [];

  for (const wf of WORKFLOW_NAMES) {
    const stepsDir = path.join(workflowsDir, wf, 'steps');
    if (!fs.existsSync(stepsDir)) continue;

    const files = fs.readdirSync(stepsDir).filter(f => f.endsWith('.md'));
    if (files.length < 4 || files.length > 6) {
      issues.push(`${wf}: ${files.length} step files (expected 4-6)`);
    }
  }

  if (issues.length > 0) {
    return {
      name: 'Workflow step structure',
      passed: false,
      error: issues.join('; '),
      fix: 'Run: npx -p convoke-agents convoke-install-vortex to reinstall clean workflow files'
    };
  }

  return { name: 'Workflow step structure', passed: true, info: 'All workflows have valid step counts' };
}

function printResults(checks) {
  const passed = checks.filter(c => c.passed);
  const failed = checks.filter(c => !c.passed);

  checks.forEach(check => {
    if (check.passed) {
      console.log(chalk.green(`  ✓ ${check.name}`));
      if (check.info) {
        console.log(chalk.gray(`    ${check.info}`));
      }
    } else {
      console.log(chalk.red(`  ✗ ${check.name}`));
      console.log(chalk.red(`    ${check.error}`));
      if (check.fix) {
        console.log(chalk.yellow(`    Fix: ${check.fix}`));
      }
    }
  });

  console.log('');
  if (failed.length === 0) {
    console.log(chalk.green.bold(`All ${passed.length} checks passed. Installation looks healthy!`));
  } else {
    console.log(chalk.red.bold(`${failed.length} issue(s) found, ${passed.length} checks passed.`));
  }
  console.log('');
}

main().catch(err => {
  console.error(chalk.red(`Doctor failed: ${err.message}`));
  process.exit(1);
});
