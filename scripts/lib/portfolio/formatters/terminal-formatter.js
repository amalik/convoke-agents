/**
 * Terminal formatter — aligned column output with confidence markers.
 * No library used — padEnd() for alignment.
 *
 * @module terminal-formatter
 */

/**
 * Format InitiativeState array as aligned terminal table.
 *
 * @param {import('../../types').InitiativeState[]} initiatives
 * @returns {string}
 */
function formatTerminal(initiatives) {
  if (initiatives.length === 0) {
    return 'No initiatives found.';
  }

  // Dynamic init column width: at least 14, grows for long names
  const maxInitLen = Math.max(14, ...initiatives.map(s => s.initiative.length + 2));
  const COL = { init: maxInitLen, phase: 12, status: 24, action: 50 };
  const lines = [];

  // Header
  lines.push(
    'Initiative'.padEnd(COL.init) +
    'Phase'.padEnd(COL.phase) +
    'Status'.padEnd(COL.status) +
    'Next Action / Context'
  );
  lines.push('-'.repeat(COL.init + COL.phase + COL.status + COL.action));

  for (const s of initiatives) {
    const phase = s.phase.value || 'unknown';
    const statusVal = s.status.value || 'unknown';
    const conf = s.status.confidence === 'explicit' ? '(explicit)' : '(inferred)';
    const status = `${statusVal} ${conf}`;

    const context = s.nextAction.value
      ? s.nextAction.value
      : s.lastArtifact.file
        ? `Last: ${s.lastArtifact.file} (${s.lastArtifact.date || '?'})`
        : 'No artifacts';

    lines.push(
      s.initiative.padEnd(COL.init) +
      phase.padEnd(COL.phase) +
      status.padEnd(COL.status) +
      context
    );
  }

  return lines.join('\n');
}

module.exports = { formatTerminal };
