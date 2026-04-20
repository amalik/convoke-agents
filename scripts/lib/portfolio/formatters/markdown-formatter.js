/**
 * Markdown formatter — standard markdown table output with confidence markers.
 *
 * @module markdown-formatter
 */

/**
 * Format InitiativeState array as markdown table.
 *
 * @param {import('../../types').InitiativeState[]} initiatives
 * @param {object} [options]
 * @param {boolean} [options.showUnattributed] - When true and unattributedFiles is non-empty, append a markdown section listing them.
 * @param {Array<{dir: string, filename: string, reason: string}>} [options.unattributedFiles]
 * @returns {string}
 */
function formatMarkdown(initiatives, options = {}) {
  const { showUnattributed, unattributedFiles } = options;
  const lines = [];

  if (initiatives.length === 0) {
    lines.push('No initiatives found.');
  } else {
    lines.push('| Initiative | Phase | Status | Next Action / Context |');
    lines.push('|------------|-------|--------|----------------------|');

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

      lines.push(`| ${s.initiative} | ${phase} | ${status} | ${context} |`);
    }
  }

  if (showUnattributed && Array.isArray(unattributedFiles) && unattributedFiles.length > 0) {
    lines.push('');
    lines.push(`## Unattributed Files (${unattributedFiles.length})`);
    lines.push('');
    lines.push('| Path | Reason |');
    lines.push('|------|--------|');
    for (const u of unattributedFiles) {
      lines.push(`| ${u.dir}/${u.filename} | ${u.reason} |`);
    }
  }

  return lines.join('\n') + '\n';
}

module.exports = { formatMarkdown };
