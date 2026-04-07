/**
 * Rule 2: Infer phase from artifact chain analysis.
 *
 * Priority order (highest first):
 *   1. Epic with all stories done/complete/✅/[x]/strikethrough → complete
 *   2. Epic + sprint artifact → build
 *   3. Architecture doc → planning
 *   4. HC artifacts (HC2-HC6) → discovery
 *   5. PRD or brief only → planning
 *   6. No recognized artifacts → unknown
 *
 * Also detects Vortex HC chain completeness (FR34).
 *
 * @param {import('../../types').InitiativeState} state - Current initiative state
 * @param {Array<{filename: string, dir: string, fullPath: string, type?: string, hcPrefix?: string, date?: string, content?: string}>} artifacts
 * @param {Object} _options - Reserved
 * @returns {import('../../types').InitiativeState} Enriched state
 */

/** Patterns that indicate epic completion — require status context to avoid false positives.
 * Matches: "status: done", "epic-1: done", "Status:** done", "- [x]", "✅" */
const DONE_PATTERNS = [
  /(?:status|epic)[^:]*:\s*done\b/i,
  /(?:status|epic)[^:]*:\s*complete\b/i,
  /\*\*\s*done\b/i,     // bold marker: **done**
  /✅/,
  /\[x\]/i,
  /~~[^~]{3,}~~/        // strikethrough (min 3 chars to avoid false matches)
];

function applyArtifactChainRule(state, artifacts, _options = {}) {
  // Don't override explicit frontmatter phase
  if (state.phase.confidence === 'explicit') return state;

  const types = new Set(artifacts.map(a => a.type).filter(Boolean));
  const hcPrefixes = new Set(artifacts.map(a => a.hcPrefix).filter(Boolean));

  // Track last artifact for this initiative
  let latestArtifact = null;
  let latestDate = '';
  for (const a of artifacts) {
    const d = a.date || '';
    if (d >= latestDate) {
      latestDate = d;
      latestArtifact = a;
    }
  }
  if (latestArtifact) {
    state.lastArtifact = { file: latestArtifact.filename, date: latestDate || 'unknown' };
  }

  // Check for epic completion
  const epicArtifacts = artifacts.filter(a => a.type === 'epic');
  if (epicArtifacts.length > 0) {
    // Use most recent epic (by date, fallback to last in array)
    const epic = epicArtifacts.reduce((best, a) => {
      return (a.date || '') >= (best.date || '') ? a : best;
    }, epicArtifacts[0]);

    if (epic.content && isEpicDone(epic.content)) {
      state.phase = { value: 'complete', source: 'artifact-chain', confidence: 'inferred' };
      return state;
    }

    // Epic exists + sprint artifact → build
    if (types.has('sprint')) {
      state.phase = { value: 'build', source: 'artifact-chain', confidence: 'inferred' };
      return state;
    }
  }

  // Architecture doc → planning
  if (types.has('arch')) {
    state.phase = { value: 'planning', source: 'artifact-chain', confidence: 'inferred' };
    // Detect HC chain for nextAction even in planning phase
    detectHCChain(state, hcPrefixes);
    return state;
  }

  // HC artifacts → discovery
  if (hcPrefixes.size > 0) {
    state.phase = { value: 'discovery', source: 'artifact-chain', confidence: 'inferred' };
    detectHCChain(state, hcPrefixes);
    return state;
  }

  // PRD or brief → planning
  if (types.has('prd') || types.has('brief')) {
    state.phase = { value: 'planning', source: 'artifact-chain', confidence: 'inferred' };
    return state;
  }

  // No recognized pattern — collect evidence so the operator can see WHY it's unknown (Story 6.3)
  const evidence = collectPhaseEvidence(artifacts, types, hcPrefixes);
  state.phase = { value: 'unknown', source: 'artifact-chain', confidence: 'inferred', evidence };
  return state;
}

/**
 * Collect a one-line description of what the phase inference looked at when it
 * couldn't determine a phase. Used to populate the Next Action with context
 * instead of the generic "Create PRD or brief" message.
 *
 * @param {Array<Object>} artifacts - All artifacts for this initiative
 * @param {Set<string>} types - Distinct artifact types present
 * @param {Set<string>} hcPrefixes - HC prefixes present (e.g. 'hc1', 'hc2')
 * @returns {string[]} Evidence list, e.g. ["3 artifacts found", "no PRD/brief", "no HC chain", ...]
 */
function collectPhaseEvidence(artifacts, types, hcPrefixes) {
  const evidence = [];
  const count = artifacts.length;
  evidence.push(count === 1 ? '1 artifact found' : `${count} artifacts found`);

  // Special-case: only HC1 present (incomplete discovery, doesn't trigger discovery branch)
  if (hcPrefixes.size === 1 && hcPrefixes.has('hc1')) {
    evidence.push('incomplete HC chain (needs HC2-HC6)');
    return evidence;
  }

  if (!types.has('prd') && !types.has('brief')) evidence.push('no PRD/brief');
  if (!types.has('arch')) evidence.push('no architecture');
  if (hcPrefixes.size === 0) evidence.push('no HC chain');
  if (!types.has('epic')) evidence.push('no epic');

  return evidence;
}

/**
 * Check if epic content indicates completion via flexible markers.
 * @param {string} content - Epic file content
 * @returns {boolean}
 */
function isEpicDone(content) {
  return DONE_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Detect Vortex HC chain completeness and set nextAction if gaps found.
 * HC chain: HC2 (Problem Definition) → HC3 (Hypothesis) → HC4 (Experiment) → HC5 (Signal) → HC6 (Decision)
 * @param {import('../../types').InitiativeState} state
 * @param {Set<string>} hcPrefixes - Set of HC prefixes present (e.g., 'hc2', 'hc3')
 */
function detectHCChain(state, hcPrefixes) {
  const expectedHCs = ['hc2', 'hc3', 'hc4', 'hc5', 'hc6'];
  const hcNames = { hc2: 'Problem Definition', hc3: 'Hypothesis', hc4: 'Experiment', hc5: 'Signal', hc6: 'Decision' };
  const missing = expectedHCs.filter(hc => !hcPrefixes.has(hc));

  if (missing.length === 0) {
    state.nextAction = { value: 'HC chain complete — ready for learning decision', source: 'chain-gap' };
  } else if (missing.length < expectedHCs.length) {
    const nextMissing = missing[0];
    state.nextAction = { value: `Next: ${hcNames[nextMissing]} (${nextMissing.toUpperCase()})`, source: 'chain-gap' };
  }
}

module.exports = { applyArtifactChainRule, isEpicDone, detectHCChain, collectPhaseEvidence, DONE_PATTERNS };
