'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { checkDirtyTree } = require('./registry-writer');

/** @typedef {import('../types/factory-types').CreatorResult} CreatorResult */

/**
 * Append a new agent ID to an existing team's config.yaml.
 * Enhanced Simple safety: read → validate → write (.tmp) → verify parse → rename.
 *
 * @param {string} newAgentId - Agent ID to add (e.g., "gamma-guardian")
 * @param {string} configPath - Absolute path to existing config.yaml
 * @param {Object} [options]
 * @param {boolean} [options.skipDirtyCheck] - Skip git dirty-tree detection (for tests)
 * @returns {Promise<CreatorResult>}
 */
async function appendConfigAgent(newAgentId, configPath, options = {}) {
  if (!newAgentId || !newAgentId.trim()) {
    return { success: false, filePath: configPath, errors: ['newAgentId is required'] };
  }

  // --- Read existing config ---
  if (!await fs.pathExists(configPath)) {
    return { success: false, filePath: configPath, errors: ['config.yaml does not exist at target path'] };
  }

  // --- Dirty-tree detection (per-write) ---
  if (!options.skipDirtyCheck) {
    const dirtyResult = checkDirtyTree(configPath);
    if (dirtyResult.dirty) {
      return { success: false, filePath: configPath, errors: [], dirty: true, diff: dirtyResult.diff };
    }
  }

  let content;
  try {
    content = await fs.readFile(configPath, 'utf8');
  } catch (err) {
    return { success: false, filePath: configPath, errors: [`Cannot read config: ${err.message}`] };
  }

  // --- Parse and validate ---
  let config;
  try {
    config = yaml.load(content);
  } catch (err) {
    return { success: false, filePath: configPath, errors: [`Cannot parse config YAML: ${err.message}`] };
  }

  if (!config || !Array.isArray(config.agents)) {
    return { success: false, filePath: configPath, errors: ['config.yaml missing agents array'] };
  }

  // --- Duplicate check (additive-only) ---
  if (config.agents.includes(newAgentId)) {
    return { success: true, filePath: configPath, errors: [], skipped: 'agent already in config' };
  }

  // --- Append ---
  config.agents.push(newAgentId);

  // --- Atomic write (.tmp → validate → rename) ---
  const tmpPath = configPath + '.tmp';
  try {
    const newContent = yaml.dump(config, { indent: 2, lineWidth: -1, noRefs: true });
    await fs.writeFile(tmpPath, newContent, 'utf8');

    // Verify parse of tmp file
    const readBack = yaml.load(await fs.readFile(tmpPath, 'utf8'));
    if (!readBack || !Array.isArray(readBack.agents) || !readBack.agents.includes(newAgentId)) {
      await fs.remove(tmpPath);
      return { success: false, filePath: configPath, errors: ['Post-write verification failed: new agent not found in parsed output'] };
    }

    // Rename tmp → target
    await fs.rename(tmpPath, configPath);
  } catch (err) {
    await fs.remove(tmpPath).catch(() => {});
    return { success: false, filePath: configPath, errors: [`Write failed: ${err.message}`] };
  }

  return { success: true, filePath: configPath, errors: [] };
}

/**
 * Append a new workflow name to an existing team's config.yaml.
 * Enhanced Simple safety: read → validate → write (.tmp) → verify parse → rename.
 *
 * @param {string} newWorkflowName - Workflow name to add (kebab-case, e.g., "data-analysis")
 * @param {string} configPath - Absolute path to existing config.yaml
 * @param {Object} [options]
 * @param {boolean} [options.skipDirtyCheck] - Skip git dirty-tree detection (for tests)
 * @returns {Promise<CreatorResult>}
 */
async function appendConfigWorkflow(newWorkflowName, configPath, options = {}) {
  if (!newWorkflowName || !newWorkflowName.trim()) {
    return { success: false, filePath: configPath, errors: ['newWorkflowName is required'] };
  }

  // --- Read existing config ---
  if (!await fs.pathExists(configPath)) {
    return { success: false, filePath: configPath, errors: ['config.yaml does not exist at target path'] };
  }

  // --- Dirty-tree detection (per-write) ---
  if (!options.skipDirtyCheck) {
    const dirtyResult = checkDirtyTree(configPath);
    if (dirtyResult.dirty) {
      return { success: false, filePath: configPath, errors: [], dirty: true, diff: dirtyResult.diff };
    }
  }

  let content;
  try {
    content = await fs.readFile(configPath, 'utf8');
  } catch (err) {
    return { success: false, filePath: configPath, errors: [`Cannot read config: ${err.message}`] };
  }

  // --- Parse and validate ---
  let config;
  try {
    config = yaml.load(content);
  } catch (err) {
    return { success: false, filePath: configPath, errors: [`Cannot parse config YAML: ${err.message}`] };
  }

  if (!config || !Array.isArray(config.workflows)) {
    return { success: false, filePath: configPath, errors: ['config.yaml missing workflows array'] };
  }

  // --- Duplicate check (additive-only) ---
  if (config.workflows.includes(newWorkflowName)) {
    return { success: true, filePath: configPath, errors: [], skipped: 'workflow already in config' };
  }

  // --- Append ---
  config.workflows.push(newWorkflowName);

  // --- Atomic write (.tmp → validate → rename) ---
  const tmpPath = configPath + '.tmp';
  try {
    const newContent = yaml.dump(config, { indent: 2, lineWidth: -1, noRefs: true });
    await fs.writeFile(tmpPath, newContent, 'utf8');

    // Verify parse of tmp file
    const readBack = yaml.load(await fs.readFile(tmpPath, 'utf8'));
    if (!readBack || !Array.isArray(readBack.workflows) || !readBack.workflows.includes(newWorkflowName)) {
      await fs.remove(tmpPath);
      return { success: false, filePath: configPath, errors: ['Post-write verification failed: new workflow not found in parsed output'] };
    }

    // Rename tmp → target
    await fs.rename(tmpPath, configPath);
  } catch (err) {
    await fs.remove(tmpPath).catch(() => {});
    return { success: false, filePath: configPath, errors: [`Write failed: ${err.message}`] };
  }

  return { success: true, filePath: configPath, errors: [] };
}

module.exports = { appendConfigAgent, appendConfigWorkflow };
