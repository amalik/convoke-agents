'use strict';

const fs = require('fs-extra');
const path = require('path');
const {
  derivePrefix,
  buildAgentEntry,
  escapeSingleQuotes,
  verifyRequire,
  checkDirtyTree,
} = require('./registry-writer');

/** @typedef {import('../types/factory-types').RegistryResult} RegistryResult */

/**
 * Append a new agent to an existing team's module block in agent-registry.js.
 * Uses Full Write Safety Protocol: stage → validate → check → apply → verify → rollback.
 *
 * @param {string} teamNameKebab - Existing team (e.g., "gyre")
 * @param {Object} newAgentData - Agent spec with id, name, icon, role, persona fields
 * @param {string} registryPath - Absolute path to agent-registry.js
 * @param {Object} [options]
 * @param {boolean} [options.skipDirtyCheck] - Skip git dirty-tree detection (for tests)
 * @returns {Promise<RegistryResult>}
 */
async function appendAgentToBlock(teamNameKebab, newAgentData, registryPath, options = {}) {
  if (!teamNameKebab || !teamNameKebab.trim()) {
    return fail(['teamNameKebab is required and must not be empty']);
  }
  if (!newAgentData || !newAgentData.id) {
    return fail(['newAgentData with id is required']);
  }

  const prefix = derivePrefix(teamNameKebab);

  // --- Read current content ---
  let currentContent;
  try {
    currentContent = await fs.readFile(registryPath, 'utf8');
  } catch (err) {
    return fail([`Cannot read registry file: ${err.message}`]);
  }

  // --- 1. STAGE: Locate existing block and build new entry ---
  const agentsVarName = `${prefix}_AGENTS`;
  if (!currentContent.includes(`const ${agentsVarName}`)) {
    return fail([`Team block not found: const ${agentsVarName} does not exist in registry`]);
  }

  // Check duplicate agent ID
  const agentIdLiteral = `id: '${escapeSingleQuotes(newAgentData.id)}'`;
  if (currentContent.includes(agentIdLiteral)) {
    return { success: true, written: [], skipped: ['agent already exists in block'], errors: [], rollbackApplied: false };
  }

  // Build the new agent entry as JS text
  const entry = buildAgentEntry(newAgentData, teamNameKebab);
  const entryLines = formatAgentEntry(entry);

  // --- 2. VALIDATE: Structural checks ---
  // Find the closing ]; of the AGENTS array
  const arrayStart = currentContent.indexOf(`const ${agentsVarName} = [`);
  if (arrayStart === -1) {
    return fail([`Cannot parse ${agentsVarName} array start`]);
  }

  const closingBracket = findArrayClose(currentContent, arrayStart);
  if (closingBracket === -1) {
    return fail([`Cannot find closing ]; for ${agentsVarName}`]);
  }

  // --- 3. CHECK: Dirty-tree detection ---
  if (!options.skipDirtyCheck) {
    const dirtyResult = checkDirtyTree(registryPath);
    if (dirtyResult.dirty) {
      return { success: false, written: [], skipped: [], errors: [], rollbackApplied: false, dirty: true, diff: dirtyResult.diff };
    }
  }

  // --- 4. APPLY: Insert new entry before closing ]; ---
  const bakPath = `${registryPath}.bak`;
  if (await fs.pathExists(bakPath)) {
    return fail(['Stale .bak file exists — a previous run may have crashed. Remove it manually before retrying.']);
  }

  try {
    await fs.writeFile(bakPath, currentContent, 'utf8');
  } catch (err) {
    return fail([`Failed to create backup: ${err.message}`]);
  }

  // Insert the new entry before the closing ];
  const before = currentContent.slice(0, closingBracket);
  const after = currentContent.slice(closingBracket);
  const modified = before + entryLines + '\n' + after;

  try {
    await fs.writeFile(registryPath, modified, 'utf8');
  } catch (err) {
    await fs.writeFile(registryPath, currentContent, 'utf8');
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: [`Write failed: ${err.message}`], rollbackApplied: true };
  }

  // --- 5. VERIFY: Re-read + node require() ---
  const verifyError = verifyRequire(registryPath);
  if (verifyError) {
    await fs.writeFile(registryPath, currentContent, 'utf8');
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: [verifyError], rollbackApplied: true };
  }

  // Verify new agent appears in the file
  const verifyContent = await fs.readFile(registryPath, 'utf8');
  if (!verifyContent.includes(agentIdLiteral)) {
    await fs.writeFile(registryPath, currentContent, 'utf8');
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: ['Post-write verification: new agent entry not found'], rollbackApplied: true };
  }

  // --- Cleanup ---
  await fs.remove(bakPath);

  return {
    success: true,
    written: [newAgentData.id],
    skipped: [],
    errors: [],
    rollbackApplied: false,
  };
}

/**
 * Format an agent entry object as JS source text for insertion into AGENTS array.
 * @param {Object} entry - From buildAgentEntry
 * @returns {string}
 */
function formatAgentEntry(entry) {
  const lines = [];
  lines.push('  {');
  lines.push(`    id: '${escapeSingleQuotes(entry.id)}', name: '${escapeSingleQuotes(entry.name)}', icon: '${entry.icon}',`);
  lines.push(`    title: '${escapeSingleQuotes(entry.title)}', stream: '${escapeSingleQuotes(entry.stream)}',`);
  lines.push('    persona: {');
  lines.push(`      role: '${escapeSingleQuotes(entry.persona.role)}',`);
  lines.push(`      identity: '${escapeSingleQuotes(entry.persona.identity)}',`);
  lines.push(`      communication_style: '${escapeSingleQuotes(entry.persona.communication_style)}',`);
  lines.push(`      expertise: '${escapeSingleQuotes(entry.persona.expertise)}',`);
  lines.push('    },');
  lines.push('  },');
  return lines.join('\n');
}

/**
 * Find the closing ]; of an array that starts with `const NAME = [`.
 * Counts bracket depth to handle nested objects.
 * @param {string} content
 * @param {number} startIdx - Index of `const NAME = [`
 * @returns {number} Index of the `]` in `];`, or -1
 */
function findArrayClose(content, startIdx) {
  const bracketOpen = content.indexOf('[', startIdx);
  if (bracketOpen === -1) return -1;

  let depth = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = bracketOpen; i < content.length; i++) {
    const ch = content[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (inString) {
      if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    // Skip line comments
    if (ch === '/' && content[i + 1] === '/') {
      const eol = content.indexOf('\n', i);
      i = eol === -1 ? content.length : eol;
      continue;
    }

    // Skip block comments
    if (ch === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i + 2);
      i = end === -1 ? content.length : end + 1;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '[') depth++;
    if (ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}

/**
 * Create a failure result.
 * @param {string[]} errors
 * @returns {RegistryResult}
 */
function fail(errors) {
  return { success: false, written: [], skipped: [], errors, rollbackApplied: false };
}

/**
 * Append a new workflow entry to an existing team's WORKFLOWS array in agent-registry.js.
 * Uses Full Write Safety Protocol: stage → validate → check → apply → verify → rollback.
 *
 * @param {string} teamNameKebab - Existing team (e.g., "gyre")
 * @param {string} workflowName - Workflow name (kebab-case, e.g., "data-analysis")
 * @param {string} agentId - Agent ID this workflow belongs to (e.g., "stack-detective")
 * @param {string} registryPath - Absolute path to agent-registry.js
 * @param {Object} [options]
 * @param {boolean} [options.skipDirtyCheck] - Skip git dirty-tree detection (for tests)
 * @returns {Promise<RegistryResult>}
 */
async function appendWorkflowToBlock(teamNameKebab, workflowName, agentId, registryPath, options = {}) {
  if (!teamNameKebab || !teamNameKebab.trim()) {
    return fail(['teamNameKebab is required and must not be empty']);
  }
  if (!workflowName || !workflowName.trim()) {
    return fail(['workflowName is required and must not be empty']);
  }
  if (!agentId || !agentId.trim()) {
    return fail(['agentId is required and must not be empty']);
  }

  const prefix = derivePrefix(teamNameKebab);

  // --- Read current content ---
  let currentContent;
  try {
    currentContent = await fs.readFile(registryPath, 'utf8');
  } catch (err) {
    return fail([`Cannot read registry file: ${err.message}`]);
  }

  // --- 1. STAGE: Locate existing block and build new entry ---
  const workflowsVarName = `${prefix}_WORKFLOWS`;
  if (!currentContent.includes(`const ${workflowsVarName}`)) {
    return fail([`Team block not found: const ${workflowsVarName} does not exist in registry`]);
  }

  // Check duplicate workflow entry
  const nameLiteral = `name: '${escapeSingleQuotes(workflowName)}'`;
  if (currentContent.includes(nameLiteral)) {
    return { success: true, written: [], skipped: ['workflow already exists in block'], errors: [], rollbackApplied: false };
  }

  // --- 2. VALIDATE: Structural checks ---
  const arrayStart = currentContent.indexOf(`const ${workflowsVarName} = [`);
  if (arrayStart === -1) {
    return fail([`Cannot parse ${workflowsVarName} array start`]);
  }

  const closingBracket = findArrayClose(currentContent, arrayStart);
  if (closingBracket === -1) {
    return fail([`Cannot find closing ]; for ${workflowsVarName}`]);
  }

  // --- 3. CHECK: Dirty-tree detection ---
  if (!options.skipDirtyCheck) {
    const dirtyResult = checkDirtyTree(registryPath);
    if (dirtyResult.dirty) {
      return { success: false, written: [], skipped: [], errors: [], rollbackApplied: false, dirty: true, diff: dirtyResult.diff };
    }
  }

  // --- 4. APPLY: Insert new entry before closing ]; ---
  const bakPath = `${registryPath}.bak`;
  if (await fs.pathExists(bakPath)) {
    return fail(['Stale .bak file exists — a previous run may have crashed. Remove it manually before retrying.']);
  }

  try {
    await fs.writeFile(bakPath, currentContent, 'utf8');
  } catch (err) {
    return fail([`Failed to create backup: ${err.message}`]);
  }

  // Build workflow entry line
  const entryLine = `  { name: '${escapeSingleQuotes(workflowName)}', agent: '${escapeSingleQuotes(agentId)}' },`;

  const before = currentContent.slice(0, closingBracket);
  const after = currentContent.slice(closingBracket);
  const modified = before + entryLine + '\n' + after;

  try {
    await fs.writeFile(registryPath, modified, 'utf8');
  } catch (err) {
    await fs.writeFile(registryPath, currentContent, 'utf8');
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: [`Write failed: ${err.message}`], rollbackApplied: true };
  }

  // --- 5. VERIFY: Re-read + node require() ---
  const verifyError = verifyRequire(registryPath);
  if (verifyError) {
    await fs.writeFile(registryPath, currentContent, 'utf8');
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: [verifyError], rollbackApplied: true };
  }

  // Verify new workflow appears in the file
  const verifyContent = await fs.readFile(registryPath, 'utf8');
  if (!verifyContent.includes(nameLiteral)) {
    await fs.writeFile(registryPath, currentContent, 'utf8');
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: ['Post-write verification: new workflow entry not found'], rollbackApplied: true };
  }

  // --- Cleanup ---
  await fs.remove(bakPath);

  return {
    success: true,
    written: [workflowName],
    skipped: [],
    errors: [],
    rollbackApplied: false,
  };
}

module.exports = {
  appendAgentToBlock,
  appendWorkflowToBlock,
  formatAgentEntry,
  findArrayClose,
};
