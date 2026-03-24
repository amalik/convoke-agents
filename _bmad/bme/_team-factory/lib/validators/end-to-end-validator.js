'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { verifyRequire } = require('../writers/registry-writer');

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
  const passed = result.success === true && Array.isArray(result.written) && result.written.length === 5;
  return {
    name: 'REGISTRY-WIRING',
    stepName: 'wiring',
    passed,
    expected: 'success with 5 exports',
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

module.exports = {
  validateTeam,
};
