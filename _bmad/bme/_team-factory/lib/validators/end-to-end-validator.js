'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { verifyRequire, buildExportNames } = require('../writers/registry-writer');

/** @typedef {import('../types/factory-types').E2EValidationResult} E2EValidationResult */
/** @typedef {import('../types/factory-types').E2ECheck} E2ECheck */

/**
 * Run end-to-end validation on a factory-created team.
 *
 * Checks: structural (config, csv, agents, workflows, contracts),
 * wiring (registry, activation), and regression (registry require, Vortex validation).
 *
 * @param {Object} specData - Parsed team spec
 * @param {Object} generationContext - Context from Step 4
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<E2EValidationResult>}
 */
async function validateTeam(specData, generationContext, projectRoot) {
  const checks = [];
  const errors = [];

  // --- Structural checks ---
  checks.push(...checkConfig(generationContext));
  checks.push(...checkCsv(generationContext, specData));
  checks.push(...checkAgentFiles(generationContext));
  checks.push(...checkWorkflowDirs(generationContext));
  checks.push(...checkContractFiles(generationContext));

  // --- Wiring checks ---
  checks.push(checkRegistryWiring(generationContext));
  checks.push(checkActivation(generationContext));

  // --- Regression checks ---
  checks.push(checkRegistryRegression(projectRoot));
  checks.push(await checkVortexRegression(projectRoot));

  const valid = checks.every(c => c.passed);
  if (!valid) {
    for (const c of checks) {
      if (!c.passed) {
        errors.push(`${c.name}: expected ${c.expected || '(pass)'}, got ${c.actual || '(fail)'}`);
      }
    }
  }

  return { valid, checks, errors };
}

// ── Structural checks ────────────────────────────────────────────────

/**
 * Check config.yaml: exists, parseable, has required fields.
 * @param {Object} ctx - Generation context
 * @returns {E2ECheck[]}
 */
function checkConfig(ctx) {
  const checks = [];
  const configPath = ctx.config_yaml_path;

  // EXISTS
  const exists = configPath && fs.existsSync(configPath);
  checks.push({
    name: 'CONFIG-EXISTS',
    stepName: 'structural',
    passed: !!exists,
    expected: 'file exists',
    actual: exists ? 'file exists' : 'file not found',
    detail: configPath || '(no path provided)',
  });

  if (!exists) return checks;

  // PARSEABLE
  let config;
  try {
    config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    checks.push({
      name: 'CONFIG-PARSEABLE',
      stepName: 'structural',
      passed: true,
      detail: configPath,
    });
  } catch (err) {
    checks.push({
      name: 'CONFIG-PARSEABLE',
      stepName: 'structural',
      passed: false,
      expected: 'valid YAML',
      actual: `parse error: ${err.message}`,
      detail: configPath,
    });
    return checks;
  }

  // REQUIRED FIELDS
  const required = ['submodule_name', 'module', 'agents', 'workflows'];
  const missing = required.filter(f => !config[f]);
  checks.push({
    name: 'CONFIG-REQUIRED-FIELDS',
    stepName: 'structural',
    passed: missing.length === 0,
    expected: required.join(', '),
    actual: missing.length === 0 ? 'all present' : `missing: ${missing.join(', ')}`,
    detail: configPath,
  });

  return checks;
}

/**
 * Check module-help.csv: exists, correct header, correct row count.
 * @param {Object} ctx - Generation context
 * @param {Object} specData - Team spec
 * @returns {E2ECheck[]}
 */
function checkCsv(ctx, specData) {
  const checks = [];
  const csvPath = ctx.module_help_csv_path;

  // EXISTS
  const exists = csvPath && fs.existsSync(csvPath);
  checks.push({
    name: 'CSV-EXISTS',
    stepName: 'structural',
    passed: !!exists,
    expected: 'file exists',
    actual: exists ? 'file exists' : 'file not found',
    detail: csvPath || '(no path provided)',
  });

  if (!exists) return checks;

  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n');

  // HEADER
  const expectedHeader = 'module,phase,name,code,sequence,workflow_file,command,required,agent,options,description,output_location,outputs';
  const actualHeader = lines[0] || '';
  checks.push({
    name: 'CSV-HEADER',
    stepName: 'structural',
    passed: actualHeader.trim() === expectedHeader,
    expected: expectedHeader,
    actual: actualHeader.trim(),
    detail: csvPath,
  });

  // ROW COUNT (data rows = agent count)
  const dataRows = lines.length - 1; // subtract header
  const agentCount = (specData.agents || []).length;
  checks.push({
    name: 'CSV-ROW-COUNT',
    stepName: 'structural',
    passed: dataRows === agentCount,
    expected: `${agentCount} rows`,
    actual: `${dataRows} rows`,
    detail: csvPath,
  });

  return checks;
}

/**
 * Check all agent files exist.
 * @param {Object} ctx
 * @returns {E2ECheck[]}
 */
function checkAgentFiles(ctx) {
  const checks = [];
  for (const agentFile of (ctx.agent_files || [])) {
    const exists = fs.existsSync(agentFile);
    checks.push({
      name: 'AGENT-FILE-EXISTS',
      stepName: 'structural',
      passed: exists,
      expected: 'file exists',
      actual: exists ? 'file exists' : 'file not found',
      detail: agentFile,
    });
  }
  return checks;
}

/**
 * Check all workflow directories exist.
 * @param {Object} ctx
 * @returns {E2ECheck[]}
 */
function checkWorkflowDirs(ctx) {
  const checks = [];
  for (const wfDir of (ctx.workflow_dirs || [])) {
    const exists = fs.existsSync(wfDir);
    checks.push({
      name: 'WORKFLOW-DIR-EXISTS',
      stepName: 'structural',
      passed: exists,
      expected: 'directory exists',
      actual: exists ? 'directory exists' : 'directory not found',
      detail: wfDir,
    });
  }
  return checks;
}

/**
 * Check all contract files exist.
 * @param {Object} ctx
 * @returns {E2ECheck[]}
 */
function checkContractFiles(ctx) {
  const checks = [];
  for (const contractFile of (ctx.contract_files || [])) {
    const exists = fs.existsSync(contractFile);
    checks.push({
      name: 'CONTRACT-FILE-EXISTS',
      stepName: 'structural',
      passed: exists,
      expected: 'file exists',
      actual: exists ? 'file exists' : 'file not found',
      detail: contractFile,
    });
  }
  return checks;
}

// ── Wiring checks ────────────────────────────────────────────────────

/**
 * Check registry wiring result from Step 4.
 * @param {Object} ctx
 * @returns {E2ECheck}
 */
function checkRegistryWiring(ctx) {
  const result = ctx.registry_wiring_result || {};
  const expectedCount = buildExportNames('X').length; // derive from canonical source
  const passed = result.success === true && Array.isArray(result.written) && result.written.length === expectedCount;
  return {
    name: 'REGISTRY-WIRING',
    stepName: 'wiring',
    passed,
    expected: `success with ${expectedCount} exports`,
    actual: result.success ? `success with ${(result.written || []).length} exports` : `failed: ${(result.errors || []).join(', ')}`,
    detail: result.skipped && result.skipped.length > 0 ? `skipped: ${result.skipped.join(', ')}` : undefined,
  };
}

/**
 * Check activation validation result from Step 4.
 * @param {Object} ctx
 * @returns {E2ECheck}
 */
function checkActivation(ctx) {
  const result = ctx.activation_validation_results || {};
  return {
    name: 'ACTIVATION-VALID',
    stepName: 'wiring',
    passed: result.valid === true,
    expected: 'valid',
    actual: result.valid === true ? 'valid' : 'invalid',
    detail: result.valid === true ? undefined : JSON.stringify(result.results || []),
  };
}

// ── Regression checks ────────────────────────────────────────────────

/**
 * Verify agent-registry.js still loads via require().
 * Reuses verifyRequire from registry-writer.js.
 * @param {string} projectRoot
 * @returns {E2ECheck}
 */
function checkRegistryRegression(projectRoot) {
  const registryPath = path.join(projectRoot, 'scripts/update/lib/agent-registry.js');
  const error = verifyRequire(registryPath);
  return {
    name: 'REGISTRY-REGRESSION',
    stepName: 'regression',
    passed: error === null,
    expected: 'require() succeeds',
    actual: error === null ? 'require() succeeds' : error,
    detail: registryPath,
  };
}

/**
 * Run existing Vortex validateInstallation() to confirm native team still passes.
 * @param {string} projectRoot
 * @returns {Promise<E2ECheck>}
 */
async function checkVortexRegression(projectRoot) {
  try {
    const validatorPath = path.join(projectRoot, 'scripts/update/lib/validator.js');
    const { validateInstallation } = require(validatorPath);
    const result = await validateInstallation({}, projectRoot);
    const failedChecks = (result.checks || []).filter(c => !c.passed);
    return {
      name: 'VORTEX-REGRESSION',
      stepName: 'regression',
      passed: result.valid === true,
      expected: 'all Vortex checks pass',
      actual: result.valid ? 'all Vortex checks pass' : `${failedChecks.length} check(s) failed: ${failedChecks.map(c => c.name).join(', ')}`,
      detail: validatorPath,
    };
  } catch (err) {
    return {
      name: 'VORTEX-REGRESSION',
      stepName: 'regression',
      passed: false,
      expected: 'validateInstallation() succeeds',
      actual: `error: ${err.message}`,
      detail: path.join(projectRoot, 'scripts/update/lib/validator.js'),
    };
  }
}

// ── Extension validation ──────────────────────────────────────────────

/**
 * Run end-to-end validation on an agent extension (add-agent-to-existing-team).
 *
 * Checks: append results (registry, config, CSV), structural (new agent files,
 * new workflow dirs), regression (existing agents unchanged, registry require).
 *
 * @param {Object} extensionContext - Context from the add-agent workflow
 * @param {string} extensionContext.new_agent_id - New agent ID
 * @param {string[]} extensionContext.existing_agent_ids - Existing agent IDs to verify unchanged
 * @param {string[]} extensionContext.new_agent_files - New agent .md file paths
 * @param {string[]} extensionContext.new_workflow_dirs - New workflow directory paths
 * @param {string[]} [extensionContext.new_contract_files] - New contract file paths
 * @param {string} extensionContext.config_yaml_path - Path to config.yaml
 * @param {string} extensionContext.module_help_csv_path - Path to module-help.csv
 * @param {Object} extensionContext.registry_append_result - Result from appendAgentToBlock
 * @param {Object} extensionContext.config_append_result - Result from appendConfigAgent
 * @param {Object} extensionContext.csv_append_result - Result from appendCsvRow
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<E2EValidationResult>}
 */
async function validateExtension(extensionContext, projectRoot) {
  const checks = [];
  const errors = [];

  // --- Append result checks ---
  checks.push(checkRegistryAppend(extensionContext));
  checks.push(checkConfigAppend(extensionContext));
  checks.push(checkCsvAppend(extensionContext));

  // --- Structural checks for new files ---
  checks.push(...checkNewAgentFiles(extensionContext));
  checks.push(...checkNewWorkflowDirs(extensionContext));
  checks.push(...checkNewContractFiles(extensionContext));

  // --- Extension regression: existing agents unchanged ---
  checks.push(checkExistingAgentsRegistry(extensionContext, projectRoot));
  checks.push(checkExistingAgentsConfig(extensionContext));
  checks.push(checkExistingAgentsCsv(extensionContext));

  // --- Standard regression ---
  checks.push(checkRegistryRegression(projectRoot));
  checks.push(await checkVortexRegression(projectRoot));

  const valid = checks.every(c => c.passed);
  if (!valid) {
    for (const c of checks) {
      if (!c.passed) {
        errors.push(`${c.name}: expected ${c.expected || '(pass)'}, got ${c.actual || '(fail)'}`);
      }
    }
  }

  return { valid, checks, errors };
}

/**
 * Check registry append result.
 * @param {Object} ctx
 * @returns {E2ECheck}
 */
function checkRegistryAppend(ctx) {
  const result = ctx.registry_append_result || {};
  return {
    name: 'AGENT-REGISTRY-APPEND',
    stepName: 'extension',
    passed: result.success === true && Array.isArray(result.written) && result.written.includes(ctx.new_agent_id),
    expected: `success with ${ctx.new_agent_id} written`,
    actual: result.success ? `written: ${(result.written || []).join(', ')}` : `failed: ${(result.errors || []).join(', ')}`,
  };
}

/**
 * Check config append result.
 * @param {Object} ctx
 * @returns {E2ECheck}
 */
function checkConfigAppend(ctx) {
  const result = ctx.config_append_result || {};
  return {
    name: 'CONFIG-APPEND',
    stepName: 'extension',
    passed: result.success === true,
    expected: 'success',
    actual: result.success ? 'success' : `failed: ${(result.errors || []).join(', ')}`,
  };
}

/**
 * Check CSV append result.
 * @param {Object} ctx
 * @returns {E2ECheck}
 */
function checkCsvAppend(ctx) {
  const result = ctx.csv_append_result || {};
  return {
    name: 'CSV-APPEND',
    stepName: 'extension',
    passed: result.success === true,
    expected: 'success',
    actual: result.success ? `success (${result.rowCount} rows)` : `failed: ${(result.errors || []).join(', ')}`,
  };
}

/**
 * Check new agent files exist.
 * @param {Object} ctx
 * @returns {E2ECheck[]}
 */
function checkNewAgentFiles(ctx) {
  const checks = [];
  for (const agentFile of (ctx.new_agent_files || [])) {
    const exists = fs.existsSync(agentFile);
    checks.push({
      name: 'AGENT-FILE-EXISTS',
      stepName: 'extension',
      passed: exists,
      expected: 'file exists',
      actual: exists ? 'file exists' : 'file not found',
      detail: agentFile,
    });
  }
  return checks;
}

/**
 * Check new workflow directories exist.
 * @param {Object} ctx
 * @returns {E2ECheck[]}
 */
function checkNewWorkflowDirs(ctx) {
  const checks = [];
  for (const wfDir of (ctx.new_workflow_dirs || [])) {
    const exists = fs.existsSync(wfDir);
    checks.push({
      name: 'WORKFLOW-DIR-EXISTS',
      stepName: 'extension',
      passed: exists,
      expected: 'directory exists',
      actual: exists ? 'directory exists' : 'directory not found',
      detail: wfDir,
    });
  }
  return checks;
}

/**
 * Check new contract files exist.
 * @param {Object} ctx
 * @returns {E2ECheck[]}
 */
function checkNewContractFiles(ctx) {
  const checks = [];
  for (const contractFile of (ctx.new_contract_files || [])) {
    const exists = fs.existsSync(contractFile);
    checks.push({
      name: 'CONTRACT-FILE-EXISTS',
      stepName: 'extension',
      passed: exists,
      expected: 'file exists',
      actual: exists ? 'file exists' : 'file not found',
      detail: contractFile,
    });
  }
  return checks;
}

/**
 * Verify existing agents still present in agent-registry.js.
 * @param {Object} ctx
 * @param {string} projectRoot
 * @returns {E2ECheck}
 */
function checkExistingAgentsRegistry(ctx, projectRoot) {
  const registryPath = path.join(projectRoot, 'scripts/update/lib/agent-registry.js');
  if (!fs.existsSync(registryPath)) {
    return {
      name: 'EXISTING-AGENTS-REGISTRY',
      stepName: 'extension-regression',
      passed: false,
      expected: 'existing agents preserved in registry',
      actual: 'agent-registry.js not found',
    };
  }

  const content = fs.readFileSync(registryPath, 'utf8');
  const missing = (ctx.existing_agent_ids || []).filter(id => !content.includes(`id: '${id}'`));
  return {
    name: 'EXISTING-AGENTS-REGISTRY',
    stepName: 'extension-regression',
    passed: missing.length === 0,
    expected: 'existing agents preserved in registry',
    actual: missing.length === 0 ? 'all preserved' : `missing: ${missing.join(', ')}`,
  };
}

/**
 * Verify existing agents still present in config.yaml.
 * @param {Object} ctx
 * @returns {E2ECheck}
 */
function checkExistingAgentsConfig(ctx) {
  const configPath = ctx.config_yaml_path;
  if (!configPath || !fs.existsSync(configPath)) {
    return {
      name: 'EXISTING-AGENTS-CONFIG',
      stepName: 'extension-regression',
      passed: false,
      expected: 'existing agents preserved',
      actual: 'config.yaml not found',
    };
  }

  let config;
  try {
    config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {
      name: 'EXISTING-AGENTS-CONFIG',
      stepName: 'extension-regression',
      passed: false,
      expected: 'existing agents preserved',
      actual: 'cannot parse config.yaml',
    };
  }

  const agents = config.agents || [];
  const missing = (ctx.existing_agent_ids || []).filter(id => !agents.includes(id));
  return {
    name: 'EXISTING-AGENTS-CONFIG',
    stepName: 'extension-regression',
    passed: missing.length === 0,
    expected: 'existing agents preserved',
    actual: missing.length === 0 ? 'all preserved' : `missing: ${missing.join(', ')}`,
  };
}

/**
 * Verify existing agents still present in module-help.csv.
 * @param {Object} ctx
 * @returns {E2ECheck}
 */
function checkExistingAgentsCsv(ctx) {
  const csvPath = ctx.module_help_csv_path;
  if (!csvPath || !fs.existsSync(csvPath)) {
    return {
      name: 'EXISTING-AGENTS-CSV',
      stepName: 'extension-regression',
      passed: false,
      expected: 'existing agent rows preserved',
      actual: 'module-help.csv not found',
    };
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n').slice(1); // skip header
  // Extract agent column (index 8) from each row
  const agentIds = lines.map(line => {
    const cols = line.split(',');
    return cols[8] || '';
  });
  const missing = (ctx.existing_agent_ids || []).filter(id => !agentIds.includes(id));
  return {
    name: 'EXISTING-AGENTS-CSV',
    stepName: 'extension-regression',
    passed: missing.length === 0,
    expected: 'existing agent rows preserved',
    actual: missing.length === 0 ? 'all preserved' : `missing: ${missing.join(', ')}`,
  };
}

module.exports = {
  validateTeam,
  validateExtension,
};
