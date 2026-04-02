'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

/** @typedef {import('./types/factory-types').TeamSpec} TeamSpec */

/**
 * Step completion states.
 * @type {Object<string, string>}
 */
const STEP_ORDER = ['orient', 'scope', 'connect', 'review', 'generate', 'validate'];

/**
 * Determine the resume point for a spec file by reading its progress section.
 * Returns the first step that is not 'complete'.
 *
 * For the 'generate' step, also checks per-agent completion status
 * and returns which agents still need generation.
 *
 * @param {string} specPath - Absolute path to the spec file
 * @param {string} [moduleDir] - Path to the team's module directory for filesystem verification
 * @returns {Promise<ResumeResult>}
 */
async function findResumePoint(specPath, moduleDir) {
  let raw;
  try {
    raw = await fs.readFile(specPath, 'utf8');
  } catch (err) {
    return { resumable: false, resumeStep: null, pendingAgents: [], errors: [`Cannot read spec file: ${err.message}`] };
  }

  let doc;
  try {
    doc = yaml.load(raw);
  } catch (err) {
    return { resumable: false, resumeStep: null, pendingAgents: [], errors: [`Invalid YAML: ${err.message}`] };
  }

  if (!doc || !doc.progress) {
    return { resumable: false, resumeStep: null, pendingAgents: [], errors: ['Spec file has no progress section'] };
  }

  const progress = doc.progress;

  // Find first non-complete step
  for (const step of STEP_ORDER) {
    const status = typeof progress[step] === 'string' ? progress[step] : null;

    if (step === 'generate' && typeof progress[step] === 'object') {
      // Generate step has per-agent tracking
      const pending = [];
      for (const [agentId, agentStatus] of Object.entries(progress[step])) {
        if (agentStatus !== 'complete') {
          pending.push(agentId);
        }
      }
      if (pending.length > 0) {
        return { resumable: true, resumeStep: 'generate', pendingAgents: pending, errors: [] };
      }
      // All agents complete — continue to next step
      continue;
    }

    if (status !== 'complete') {
      return { resumable: true, resumeStep: step, pendingAgents: [], errors: [] };
    }
  }

  // All steps complete
  return { resumable: false, resumeStep: null, pendingAgents: [], errors: [], allComplete: true };
}

/**
 * Compare two spec objects and return which fields changed.
 * Used for displaying diffs when resuming or in express mode.
 *
 * @param {TeamSpec} oldSpec - Previous spec state
 * @param {TeamSpec} newSpec - Current spec state
 * @returns {SpecDiff}
 */
function diffSpecs(oldSpec, newSpec) {
  const changes = [];

  // Compare top-level scalar fields
  const scalarFields = ['team_name', 'team_name_kebab', 'description', 'composition_pattern', 'factory_version'];
  for (const field of scalarFields) {
    if (oldSpec[field] !== newSpec[field]) {
      changes.push({ field, oldValue: oldSpec[field], newValue: newSpec[field] });
    }
  }

  // Compare agent count
  const oldAgentCount = (oldSpec.agents || []).length;
  const newAgentCount = (newSpec.agents || []).length;
  if (oldAgentCount !== newAgentCount) {
    changes.push({ field: 'agents.length', oldValue: String(oldAgentCount), newValue: String(newAgentCount) });
  }

  // Compare agent IDs
  const oldIds = (oldSpec.agents || []).map(a => a.id).sort();
  const newIds = (newSpec.agents || []).map(a => a.id).sort();
  const addedAgents = newIds.filter(id => !oldIds.includes(id));
  const removedAgents = oldIds.filter(id => !newIds.includes(id));
  if (addedAgents.length > 0) {
    changes.push({ field: 'agents.added', oldValue: '', newValue: addedAgents.join(', ') });
  }
  if (removedAgents.length > 0) {
    changes.push({ field: 'agents.removed', oldValue: removedAgents.join(', '), newValue: '' });
  }

  // Compare contract count (Sequential only)
  const oldContracts = (oldSpec.contracts || []).length;
  const newContracts = (newSpec.contracts || []).length;
  if (oldContracts !== newContracts) {
    changes.push({ field: 'contracts.length', oldValue: String(oldContracts), newValue: String(newContracts) });
  }

  // Compare progress
  for (const step of STEP_ORDER) {
    const oldStatus = typeof oldSpec.progress?.[step] === 'string' ? oldSpec.progress[step] : JSON.stringify(oldSpec.progress?.[step]);
    const newStatus = typeof newSpec.progress?.[step] === 'string' ? newSpec.progress[step] : JSON.stringify(newSpec.progress?.[step]);
    if (oldStatus !== newStatus) {
      changes.push({ field: `progress.${step}`, oldValue: oldStatus || 'undefined', newValue: newStatus || 'undefined' });
    }
  }

  return {
    hasChanges: changes.length > 0,
    changeCount: changes.length,
    changes,
  };
}

/**
 * @typedef {Object} ResumeResult
 * @property {boolean} resumable - True if there's a step to resume from
 * @property {string|null} resumeStep - The step to resume from
 * @property {string[]} pendingAgents - For generate step: agents still pending
 * @property {string[]} errors
 * @property {boolean} [allComplete] - True if all steps are complete
 */

/**
 * @typedef {Object} SpecDiff
 * @property {boolean} hasChanges
 * @property {number} changeCount
 * @property {SpecChange[]} changes
 */

/**
 * @typedef {Object} SpecChange
 * @property {string} field - Dot-path to the changed field
 * @property {string} oldValue
 * @property {string} newValue
 */

module.exports = {
  findResumePoint,
  diffSpecs,
  STEP_ORDER,
};
