'use strict';

/**
 * Pattern-aware decision elimination for the Team Factory.
 * A6'-coupled — adding a third composition pattern = adding a third column to DECISION_CATALOGUE.
 *
 * @module cascade-logic
 */

const KNOWN_PATTERNS = ['Independent', 'Sequential'];

/**
 * Master catalogue of factory decisions with per-pattern relevance.
 * Each entry defines whether the decision is active for a given pattern
 * and whether it's required or optional.
 *
 * @type {Array<{id: string, step: string, description: string, patterns: Object}>}
 */
const DECISION_CATALOGUE = [
  {
    id: 'agent-scope',
    step: 'scope',
    description: 'Define agent roles and capabilities',
    patterns: {
      Independent: { active: true, required: true },
      Sequential: { active: true, required: true },
    },
  },
  {
    id: 'pipeline-order',
    step: 'scope',
    description: 'Define agent execution sequence (pipeline positions)',
    patterns: {
      Independent: { active: false, required: false },
      Sequential: { active: true, required: true },
    },
  },
  {
    id: 'handoff-contracts',
    step: 'connect',
    description: 'Design inter-agent handoff contracts',
    patterns: {
      Independent: { active: false, required: false },
      Sequential: { active: true, required: true },
    },
  },
  {
    id: 'feedback-contracts',
    step: 'connect',
    description: 'Design feedback routing contracts (downstream → upstream)',
    patterns: {
      Independent: { active: false, required: false },
      Sequential: { active: true, required: false },
    },
  },
  {
    id: 'contract-prefix',
    step: 'connect',
    description: 'Define naming prefix for contracts (e.g., HC, GC)',
    patterns: {
      Independent: { active: false, required: false },
      Sequential: { active: true, required: true },
    },
  },
  {
    id: 'compass-routing',
    step: 'connect',
    description: 'Create compass routing reference for workflow navigation',
    patterns: {
      Independent: { active: true, required: false, defaultValue: 'per-agent' },
      Sequential: { active: true, required: true, defaultValue: 'shared-reference' },
    },
  },
  {
    id: 'orchestration-workflow',
    step: 'connect',
    description: 'Create pipeline orchestration workflow',
    patterns: {
      Independent: { active: false, required: false },
      Sequential: { active: true, required: true },
    },
  },
  {
    id: 'output-directory',
    step: 'connect',
    description: 'Define artifact output location',
    patterns: {
      Independent: { active: true, required: true, defaultValue: '_bmad-output/{team}-artifacts' },
      Sequential: { active: true, required: true, defaultValue: '_bmad-output/{team}-artifacts' },
    },
  },
  {
    id: 'naming-enforcement',
    step: 'scope',
    description: 'Validate all naming conventions (agent IDs, file names, module directory)',
    patterns: {
      Independent: { active: true, required: true },
      Sequential: { active: true, required: true },
    },
  },
  {
    id: 'overlap-detection',
    step: 'scope',
    description: 'Check proposed agents against existing agent manifest for collisions',
    patterns: {
      Independent: { active: true, required: true },
      Sequential: { active: true, required: true },
    },
  },
];

/**
 * Given a composition pattern, return which factory decisions are relevant
 * and which are eliminated.
 *
 * @param {string} pattern - "Independent" or "Sequential"
 * @returns {{ decisions: CascadeDecision[], eliminated: CascadeDecision[], error?: string }}
 */
function getCascadeForPattern(pattern) {
  const validation = validatePattern(pattern);
  if (!validation.valid) {
    return { decisions: [], eliminated: [], error: validation.error };
  }

  const decisions = [];
  const eliminated = [];

  for (const entry of DECISION_CATALOGUE) {
    const patternConfig = entry.patterns[pattern];
    const decision = {
      id: entry.id,
      step: entry.step,
      description: entry.description,
      required: patternConfig.required,
      defaultValue: patternConfig.defaultValue || undefined,
    };

    if (patternConfig.active) {
      decisions.push(decision);
    } else {
      eliminated.push(decision);
    }
  }

  return { decisions, eliminated };
}

/**
 * Validate that a pattern string is recognized.
 * @param {string} pattern
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePattern(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    return { valid: false, error: 'Pattern must be a non-empty string' };
  }
  if (!KNOWN_PATTERNS.includes(pattern)) {
    return { valid: false, error: `Unknown pattern "${pattern}". Expected one of: ${KNOWN_PATTERNS.join(', ')}` };
  }
  return { valid: true };
}

/**
 * Get the list of known composition patterns.
 * @returns {string[]}
 */
function getKnownPatterns() {
  return [...KNOWN_PATTERNS];
}

/**
 * @typedef {Object} CascadeDecision
 * @property {string} id - Decision identifier
 * @property {string} step - Factory step this belongs to (scope, connect, generate, validate)
 * @property {string} description - Human-readable description
 * @property {boolean} required - Whether mandatory for the pattern
 * @property {string} [defaultValue] - Default if applicable
 */

module.exports = {
  getCascadeForPattern,
  validatePattern,
  getKnownPatterns,
};
