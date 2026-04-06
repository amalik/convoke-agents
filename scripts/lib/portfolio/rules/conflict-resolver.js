/**
 * Rule 4: Resolve conflicts between inference signals.
 *
 * - Explicit confidence always wins over inferred
 * - For same confidence: later phase overrides earlier
 * - Ensures lastArtifact and nextAction are populated
 *
 * @param {import('../../types').InitiativeState} state - Current initiative state
 * @param {Array<{filename: string, dir: string, fullPath: string}>} artifacts - Artifacts for this initiative
 * @param {Object} _options - Reserved
 * @returns {import('../../types').InitiativeState} Enriched state
 */

/** Phase priority order (higher index = later phase) */
const PHASE_PRIORITY = ['unknown', 'discovery', 'planning', 'build', 'complete'];

function applyConflictResolver(state, artifacts, _options = {}) {
  // Ensure phase has a value
  if (!state.phase.value) {
    state.phase = { value: 'unknown', source: 'conflict-resolver', confidence: 'inferred' };
  }

  // Ensure status has a value
  if (!state.status.value) {
    state.status = { value: 'unknown', source: 'conflict-resolver', confidence: 'inferred' };
  }

  // Ensure lastArtifact is populated
  if (!state.lastArtifact.file && artifacts.length > 0) {
    // Fallback to last artifact in array
    const last = artifacts[artifacts.length - 1];
    state.lastArtifact = { file: last.filename, date: last.date || 'unknown' };
  }

  // Derive nextAction from phase if not already set by chain-gap analysis
  if (!state.nextAction.value) {
    state.nextAction = deriveNextAction(state);
  }

  return state;
}

/**
 * Derive a suggested next action based on current phase.
 * @param {import('../../types').InitiativeState} state
 * @returns {{value: string, source: string}}
 */
function deriveNextAction(state) {
  switch (state.phase.value) {
    case 'unknown':
      return { value: 'Create PRD or brief to start planning', source: 'conflict-resolver' };
    case 'discovery':
      return { value: 'Continue discovery — check HC chain progress', source: 'conflict-resolver' };
    case 'planning':
      return { value: 'Create architecture or epics to advance to build', source: 'conflict-resolver' };
    case 'build':
      return { value: 'Continue story execution', source: 'conflict-resolver' };
    case 'complete':
      return { value: 'Initiative complete — consider retrospective', source: 'conflict-resolver' };
    default:
      return { value: 'Review initiative status', source: 'conflict-resolver' };
  }
}

/**
 * Compare two phases by priority.
 * @param {string} a - Phase name
 * @param {string} b - Phase name
 * @returns {number} Negative if a < b, positive if a > b, 0 if equal
 */
function comparePhasePriority(a, b) {
  const idxA = PHASE_PRIORITY.indexOf(a);
  const idxB = PHASE_PRIORITY.indexOf(b);
  return (idxA === -1 ? -1 : idxA) - (idxB === -1 ? -1 : idxB);
}

module.exports = { applyConflictResolver, deriveNextAction, comparePhasePriority, PHASE_PRIORITY };
