'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Detect collisions between a new team spec and existing framework state.
 * Handles Level 1 (exact ID match) and Level 2 (name similarity).
 * Level 3 (capability overlap) is LLM reasoning in the workflow step.
 *
 * @param {Object} specData - Parsed team spec
 * @param {string} manifestPath - Absolute path to agent-manifest.csv
 * @param {string} [bmeDir] - Path to _bmad/bme/ directory for submodule name checks
 * @returns {Promise<CollisionResult>}
 */
async function detectCollisions(specData, manifestPath, bmeDir) {
  const blocks = [];
  const warnings = [];

  // Parse existing agent manifest
  const existingAgents = await parseManifest(manifestPath);

  // Parse existing submodule directories
  const existingModules = bmeDir ? await listSubmodules(bmeDir) : [];

  const proposedTeam = specData.team_name_kebab || '';
  const proposedAgents = (specData.agents || []).map(a => a.id).filter(Boolean);

  // --- Level 1: Exact submodule name collision ---
  if (proposedTeam && existingModules.includes(`_${proposedTeam}`)) {
    blocks.push({
      level: 'exact',
      field: 'submodule_name',
      newValue: `_${proposedTeam}`,
      existingValue: `_${proposedTeam}`,
      existingModule: proposedTeam,
      suggestion: `Module directory _bmad/bme/_${proposedTeam}/ already exists. Choose a different team name.`,
    });
  }

  // --- Level 1: Exact agent ID collision ---
  for (const agentId of proposedAgents) {
    const match = existingAgents.find(a => a.id === agentId);
    if (match) {
      blocks.push({
        level: 'exact',
        field: 'agent_id',
        newValue: agentId,
        existingValue: match.id,
        existingModule: match.module,
        suggestion: `Agent ID "${agentId}" already exists in module "${match.module}". Rename your agent.`,
      });
    }
  }

  // --- Level 2: Similar agent name detection ---
  for (const agentId of proposedAgents) {
    for (const existing of existingAgents) {
      if (existing.id === agentId) continue; // Already caught by Level 1

      const dist = levenshtein(agentId, existing.id);
      const sharePrefix = sharedPrefix(agentId, existing.id);

      if (dist <= 2 || (sharePrefix >= 4 && dist <= 3)) {
        warnings.push({
          level: 'similar',
          field: 'agent_id',
          newValue: agentId,
          existingValue: existing.id,
          existingModule: existing.module,
          suggestion: `"${agentId}" is similar to existing "${existing.id}" (${existing.module}). Intentional?`,
        });
      }
    }
  }

  return {
    blocks,
    warnings,
    hasBlocking: blocks.length > 0,
  };
}

/**
 * Parse agent-manifest.csv to extract agent IDs and their modules.
 * @param {string} manifestPath
 * @returns {Promise<Array<{id: string, module: string}>>}
 */
async function parseManifest(manifestPath) {
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return []; // header only or empty

    const results = [];
    // Skip header (line 0), parse data rows
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length >= 10) {
        const id = fields[0].replace(/^"|"$/g, '').trim();
        const module = fields[9].replace(/^"|"$/g, '').trim();
        if (id) results.push({ id, module });
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Parse a single CSV line handling quoted fields.
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * List existing submodule directory names under _bmad/bme/.
 * @param {string} bmeDir
 * @returns {Promise<string[]>}
 */
async function listSubmodules(bmeDir) {
  try {
    const entries = await fs.readdir(bmeDir, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && e.name.startsWith('_'))
      .map(e => e.name);
  } catch {
    return [];
  }
}

/**
 * Compute Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Count shared prefix length between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function sharedPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * @typedef {Object} CollisionResult
 * @property {CollisionEntry[]} blocks - Level 1: exact matches, must be resolved
 * @property {CollisionEntry[]} warnings - Level 2: similar names, review recommended
 * @property {boolean} hasBlocking - true if any blocks exist
 */

/**
 * @typedef {Object} CollisionEntry
 * @property {string} level - "exact" or "similar"
 * @property {string} field - "agent_id", "submodule_name", or "workflow_name"
 * @property {string} newValue
 * @property {string} existingValue
 * @property {string} existingModule
 * @property {string} suggestion
 */

module.exports = {
  detectCollisions,
};
