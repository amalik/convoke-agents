'use strict';

const fs = require('fs-extra');
const path = require('path');

/** @typedef {import('../types/factory-types')} Types */

/**
 * Regex to extract activation XML block from agent markdown files.
 * Matches <activation ...>...</activation> including multiline content.
 */
const ACTIVATION_REGEX = /<activation[^>]*>([\s\S]*?)<\/activation>/;

/**
 * Validate activation blocks in generated agent .md files.
 * Read-only — this module NEVER writes to any file.
 *
 * Checks:
 * 1. Activation block exists in the agent file
 * 2. Config path reference points to the team's config.yaml
 * 3. Module path reference is correct
 *
 * @param {string[]} agentFiles - Array of absolute paths to agent .md files
 * @param {Object} moduleConfig - Module context for validation
 * @param {string} moduleConfig.configPath - Expected config.yaml path
 * @param {string} moduleConfig.modulePath - Expected module path (e.g., "bme/_team-name")
 * @param {string} moduleConfig.moduleDir - Absolute path to module directory
 * @returns {Promise<import('../types/factory-types').ValidationResult>}
 */
async function validateActivation(agentFiles, moduleConfig) {
  const results = [];

  for (const agentFile of agentFiles) {
    const result = await validateSingleAgent(agentFile, moduleConfig);
    results.push(result);
  }

  const valid = results.every(r => r.errors.length === 0);
  return { valid, results };
}

/**
 * Validate a single agent file's activation block.
 * @param {string} agentFile - Absolute path to agent .md file
 * @param {Object} moduleConfig - Module context
 * @returns {Promise<import('../types/factory-types').ActivationResult>}
 */
async function validateSingleAgent(agentFile, moduleConfig) {
  const checks = [];
  const errors = [];

  // Read agent file
  let content;
  try {
    content = await fs.readFile(agentFile, 'utf8');
  } catch (err) {
    return { agentFile, checks: [], errors: [`Cannot read agent file: ${err.message}`] };
  }

  // Check 1: Activation block exists
  const match = content.match(ACTIVATION_REGEX);
  if (!match) {
    checks.push({ check: 'Activation block exists', passed: false, detail: 'No <activation> block found in agent file' });
    errors.push('No <activation> block found');
    return { agentFile, checks, errors };
  }
  checks.push({ check: 'Activation block exists', passed: true });

  const activationContent = match[0];

  // Check 2: Config path reference
  const configPathValid = activationContent.includes(moduleConfig.configPath);
  checks.push({
    check: 'Config path reference',
    passed: configPathValid,
    detail: configPathValid ? undefined : `Expected reference to "${moduleConfig.configPath}" not found in activation block`
  });
  if (!configPathValid) {
    errors.push(`Config path "${moduleConfig.configPath}" not referenced in activation block`);
  }

  // Check 3: Config file exists on disk
  const configAbsPath = path.resolve(moduleConfig.moduleDir, 'config.yaml');
  const configExists = await fs.pathExists(configAbsPath);
  checks.push({
    check: 'Config file exists',
    passed: configExists,
    detail: configExists ? undefined : `Config file not found at ${configAbsPath}`
  });
  if (!configExists) {
    errors.push(`Config file does not exist at ${configAbsPath}`);
  }

  // Check 4: Module path reference — strict module= attribute match only
  const moduleAttrRegex = /module\s*=\s*"([^"]*)"/;
  const moduleAttrMatch = activationContent.match(moduleAttrRegex);
  const modulePathValid = moduleAttrMatch
    ? moduleAttrMatch[1] === moduleConfig.modulePath
    : false;
  checks.push({
    check: 'Module path reference',
    passed: modulePathValid,
    detail: modulePathValid
      ? undefined
      : moduleAttrMatch
        ? `Expected module="${moduleConfig.modulePath}" but found module="${moduleAttrMatch[1]}" in activation block`
        : `No module="..." attribute found in activation block`
  });
  if (!modulePathValid) {
    errors.push(`Module path "${moduleConfig.modulePath}" not referenced correctly in activation block`);
  }

  // Check 5: Module directory exists
  const moduleDirExists = await fs.pathExists(moduleConfig.moduleDir);
  checks.push({
    check: 'Module directory exists',
    passed: moduleDirExists,
    detail: moduleDirExists ? undefined : `Module directory not found at ${moduleConfig.moduleDir}`
  });
  if (!moduleDirExists) {
    errors.push(`Module directory does not exist at ${moduleConfig.moduleDir}`);
  }

  return { agentFile, checks, errors };
}

// --- CLI entry point ---
if (require.main === module) {
  const args = process.argv.slice(2);
  const agentFilesIdx = args.indexOf('--agent-files');
  const configPathIdx = args.indexOf('--config-path');

  if (agentFilesIdx === -1 || configPathIdx === -1) {
    console.error('Usage: node activation-validator.js --agent-files <glob-or-paths> --config-path <path>');
    process.exit(1);
  }

  const agentGlob = args[agentFilesIdx + 1];
  const configPath = args[configPathIdx + 1];

  (async () => {
    try {
      // Resolve agent files from glob or comma-separated list
      let agentFiles;
      if (agentGlob.includes('*')) {
        // Use fs.readdir-based simple glob for *.md in a directory
        const dir = path.dirname(agentGlob);
        const entries = await fs.readdir(dir);
        agentFiles = entries
          .filter(e => e.endsWith('.md'))
          .map(e => path.join(dir, e));
      } else {
        agentFiles = agentGlob.split(',').map(f => f.trim());
      }

      // Derive module context from config path
      const moduleDir = path.dirname(configPath);
      const modulePath = path.relative(path.resolve(moduleDir, '../../'), moduleDir);

      const result = await validateActivation(agentFiles, {
        configPath: configPath,
        modulePath: modulePath,
        moduleDir: moduleDir
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(result.valid ? 0 : 1);
    } catch (err) {
      console.log(JSON.stringify({ valid: false, results: [], errors: [err.message] }, null, 2));
      process.exit(1);
    }
  })();
}

module.exports = { validateActivation, validateSingleAgent, ACTIVATION_REGEX };
