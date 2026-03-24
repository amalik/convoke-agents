'use strict';

const path = require('path');

/** @typedef {import('./types/factory-types').ManifestEntry} ManifestEntry */

/**
 * Build a file manifest from spec data and generation context.
 * The manifest is built from tracked generation variables — NOT filesystem scanning.
 *
 * @param {Object} specData - Parsed team spec (needs team_name_kebab, spec_file_path)
 * @param {Object} generationContext - Context from Step 4
 * @param {string[]} generationContext.agent_files - Agent .md file paths
 * @param {string[]} generationContext.workflow_dirs - Workflow directory paths
 * @param {string[]} [generationContext.contract_files] - Contract .md file paths
 * @param {string} generationContext.config_yaml_path - Path to config.yaml
 * @param {string} generationContext.module_help_csv_path - Path to module-help.csv
 * @param {string} generationContext.module_root - Module root directory
 * @returns {ManifestEntry[]}
 */
function buildManifest(specData, generationContext) {
  const entries = [];
  const moduleName = specData.team_name_kebab || 'unknown';

  // Agent files — created
  for (const agentFile of (generationContext.agent_files || [])) {
    entries.push({ path: agentFile, operation: 'created', module: moduleName });
  }

  // Workflow directories — each gets a workflow.md and SKILL.md
  for (const wfDir of (generationContext.workflow_dirs || [])) {
    entries.push({ path: path.join(wfDir, 'workflow.md'), operation: 'created', module: moduleName });
    entries.push({ path: path.join(wfDir, 'SKILL.md'), operation: 'created', module: moduleName });
  }

  // Contract files — created
  for (const contractFile of (generationContext.contract_files || [])) {
    entries.push({ path: contractFile, operation: 'created', module: moduleName });
  }

  // Compass routing reference — created (if exists in generated_files)
  const compassFile = path.join(generationContext.module_root || '', 'compass-routing-reference.md');
  const generatedFiles = generationContext.generated_files || [];
  if (generatedFiles.includes(compassFile)) {
    entries.push({ path: compassFile, operation: 'created', module: moduleName });
  }

  // Config.yaml — created
  if (generationContext.config_yaml_path) {
    entries.push({ path: generationContext.config_yaml_path, operation: 'created', module: moduleName });
  }

  // Module-help.csv — created
  if (generationContext.module_help_csv_path) {
    entries.push({ path: generationContext.module_help_csv_path, operation: 'created', module: moduleName });
  }

  // agent-registry.js — modified
  entries.push({ path: 'scripts/update/lib/agent-registry.js', operation: 'modified', module: moduleName });

  // Spec file — modified (progress updated)
  if (specData.spec_file_path) {
    entries.push({ path: specData.spec_file_path, operation: 'modified', module: moduleName });
  }

  return entries;
}

/**
 * Format a manifest as a human-readable markdown table.
 * @param {ManifestEntry[]} entries
 * @returns {string}
 */
function formatManifest(entries) {
  const lines = [];
  lines.push('| # | Path | Operation | Module |');
  lines.push('|---|------|-----------|--------|');
  entries.forEach((entry, i) => {
    lines.push(`| ${i + 1} | \`${entry.path}\` | ${entry.operation} | ${entry.module} |`);
  });
  return lines.join('\n');
}

/**
 * Format abort/removal instructions from a manifest.
 * Created files get `rm`, modified files get `git checkout --`.
 * @param {ManifestEntry[]} entries
 * @returns {string}
 */
function formatAbortInstructions(entries) {
  const lines = [];
  lines.push('# Removal instructions');
  lines.push('');

  const created = entries.filter(e => e.operation === 'created');
  const modified = entries.filter(e => e.operation === 'modified');

  if (created.length > 0) {
    lines.push('# Created files — remove:');
    for (const entry of created) {
      lines.push(`rm ${entry.path}`);
    }
    lines.push('');
  }

  if (modified.length > 0) {
    lines.push('# Modified files — revert:');
    for (const entry of modified) {
      lines.push(`git checkout -- ${entry.path}`);
    }
  }

  return lines.join('\n');
}

module.exports = {
  buildManifest,
  formatManifest,
  formatAbortInstructions,
};
