#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const yaml = require('js-yaml');
const { findProjectRoot, getPackageVersion } = require('./update/lib/utils');

/**
 * convoke-doctor — Diagnose common Convoke installation issues.
 *
 * Config-driven: discovers all modules by scanning _bmad/bme/ config.yaml
 * and validates file existence dynamically per module.
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

  // 2. Discover modules from _bmad/bme/*/config.yaml
  const modules = discoverModules(projectRoot);

  if (modules.length === 0) {
    checks.push({
      name: 'Module discovery',
      passed: false,
      error: 'No modules found — expected config.yaml files in _bmad/bme/*/',
      fix: 'Run: npx -p convoke-agents convoke-install'
    });
    printResults(checks);
    process.exit(1);
    return;
  }

  checks.push({
    name: 'Module discovery',
    passed: true,
    info: `Found ${modules.length} module(s): ${modules.map(m => m.name).join(', ')}`
  });

  // 3. Per-module checks
  for (const mod of modules) {
    checks.push(checkModuleConfig(mod));
    if (mod.config) {
      checks.push(checkModuleAgents(mod));
      checks.push(checkModuleWorkflows(mod));
    }
  }

  // 4. Global checks (module-agnostic)
  checks.push(await checkOutputDir(projectRoot));
  checks.push(checkMigrationLock(projectRoot));
  checks.push(checkVersionConsistency(projectRoot, modules));

  printResults(checks);

  const failed = checks.filter(c => !c.passed);
  process.exit(failed.length > 0 ? 1 : 0);
}

/**
 * Scan _bmad/bme/ for subdirectories containing config.yaml.
 * Returns an array of module descriptors with parsed config (or null on error).
 */
function discoverModules(projectRoot) {
  const bmeDir = path.join(projectRoot, '_bmad/bme');
  if (!fs.existsSync(bmeDir)) return [];

  const entries = fs.readdirSync(bmeDir, { withFileTypes: true });
  const modules = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const configPath = path.join(bmeDir, entry.name, 'config.yaml');
    if (!fs.existsSync(configPath)) continue;

    let config = null;
    let parseError = null;
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      config = yaml.load(content);
    } catch (err) {
      parseError = err.message;
    }

    modules.push({
      name: entry.name,
      dir: path.join(bmeDir, entry.name),
      configPath,
      config,
      parseError,
    });
  }

  return modules;
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

function checkModuleConfig(mod) {
  const label = `${mod.name} config`;

  if (mod.parseError) {
    return {
      name: label,
      passed: false,
      error: `YAML parse error: ${mod.parseError}`,
      fix: `Check ${mod.configPath} for syntax errors`
    };
  }

  if (!mod.config || typeof mod.config !== 'object') {
    return {
      name: label,
      passed: false,
      error: 'config.yaml is empty or invalid',
      fix: `Reinstall the ${mod.name} module`
    };
  }

  if (!Array.isArray(mod.config.agents) || mod.config.agents.length === 0) {
    return {
      name: label,
      passed: false,
      error: 'config.yaml missing or empty agents section',
      fix: `Check ${mod.configPath}`
    };
  }

  if (!Array.isArray(mod.config.workflows) || mod.config.workflows.length === 0) {
    return {
      name: label,
      passed: false,
      error: 'config.yaml missing or empty workflows section',
      fix: `Check ${mod.configPath}`
    };
  }

  return {
    name: label,
    passed: true,
    info: `${mod.config.agents.length} agents, ${mod.config.workflows.length} workflows`
  };
}

function checkModuleAgents(mod) {
  const label = `${mod.name} agents`;
  const agentsDir = path.join(mod.dir, 'agents');
  const agentIds = mod.config.agents;

  if (!fs.existsSync(agentsDir)) {
    return {
      name: label,
      passed: false,
      error: 'agents/ directory not found',
      fix: `Reinstall the ${mod.name} module`
    };
  }

  const missing = agentIds.filter(id => !fs.existsSync(path.join(agentsDir, `${id}.md`)));

  if (missing.length > 0) {
    return {
      name: label,
      passed: false,
      error: `Missing: ${missing.map(id => `${id}.md`).join(', ')}`,
      fix: `Reinstall the ${mod.name} module`
    };
  }

  // Check files are non-empty
  const empty = agentIds.filter(id => {
    const stat = fs.statSync(path.join(agentsDir, `${id}.md`));
    return stat.size === 0;
  });

  if (empty.length > 0) {
    return {
      name: label,
      passed: false,
      error: `Empty agent files: ${empty.map(id => `${id}.md`).join(', ')}`,
      fix: `Reinstall the ${mod.name} module`
    };
  }

  return { name: label, passed: true, info: `${agentIds.length} agents present` };
}

function checkModuleWorkflows(mod) {
  const label = `${mod.name} workflows`;
  const workflowsDir = path.join(mod.dir, 'workflows');
  const workflowNames = mod.config.workflows;

  if (!fs.existsSync(workflowsDir)) {
    return {
      name: label,
      passed: false,
      error: 'workflows/ directory not found',
      fix: `Reinstall the ${mod.name} module`
    };
  }

  const missing = workflowNames.filter(w =>
    !fs.existsSync(path.join(workflowsDir, w, 'workflow.md'))
  );

  if (missing.length > 0) {
    return {
      name: label,
      passed: false,
      error: `Missing: ${missing.join(', ')}`,
      fix: `Reinstall the ${mod.name} module`
    };
  }

  return { name: label, passed: true, info: `${workflowNames.length} workflows present` };
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

function checkVersionConsistency(projectRoot, modules) {
  const packageVersion = getPackageVersion();
  const mismatched = [];

  for (const mod of modules) {
    if (!mod.config) continue;
    const installedVersion = mod.config.version || mod.config.installed_version;
    if (installedVersion && installedVersion !== packageVersion) {
      mismatched.push(`${mod.name}: ${installedVersion}`);
    }
  }

  if (mismatched.length > 0) {
    return {
      name: 'Version consistency',
      passed: false,
      error: `Package: ${packageVersion}, ${mismatched.join(', ')}`,
      fix: 'Run: npx -p convoke-agents convoke-update'
    };
  }

  return {
    name: 'Version consistency',
    passed: true,
    info: `${packageVersion} — package and config versions consistent`
  };
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
