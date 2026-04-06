/**
 * Rule 1: Read explicit status/phase from frontmatter (highest priority).
 *
 * Reads `status` (standard schema field) and `phase` (operator-override, not in standard schema).
 * Explicit frontmatter signals have highest priority — later rules should not override them.
 *
 * @param {import('../../types').InitiativeState} state - Current initiative state
 * @param {Array<{filename: string, dir: string, fullPath: string, frontmatter?: Object}>} artifacts - Artifacts for this initiative
 * @param {Object} _options - Reserved
 * @returns {import('../../types').InitiativeState} Enriched state
 */
function applyFrontmatterRule(state, artifacts, _options = {}) {
  // Process artifacts most-recent-first (by date suffix or array order)
  // First explicit value found wins
  for (const artifact of artifacts) {
    if (!artifact.frontmatter) continue;

    if (!state.status.value || state.status.confidence !== 'explicit') {
      if (artifact.frontmatter.status != null && artifact.frontmatter.status !== '') {
        state.status = {
          value: artifact.frontmatter.status,
          source: 'frontmatter',
          confidence: 'explicit'
        };
      }
    }

    if (!state.phase.value || state.phase.confidence !== 'explicit') {
      if (artifact.frontmatter.phase != null && artifact.frontmatter.phase !== '') {
        state.phase = {
          value: artifact.frontmatter.phase,
          source: 'frontmatter',
          confidence: 'explicit'
        };
      }
    }
  }

  return state;
}

module.exports = { applyFrontmatterRule };
