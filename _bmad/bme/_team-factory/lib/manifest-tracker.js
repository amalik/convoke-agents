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
      lines.push(`rm "${entry.path}"`);
    }
    lines.push('');
  }

  if (modified.length > 0) {
    lines.push('# Modified files — revert:');
    for (const entry of modified) {
      lines.push(`git checkout -- "${entry.path}"`);
    }
  }

  return lines.join('\n');
}

/**
 * Build a file manifest for an extension operation (add agent to existing team).
 * New agent/workflow/contract files are "created"; config, CSV, and registry are "modified".
 *
 * @param {Object} extensionContext
 * @param {string} extensionContext.new_agent_id - New agent ID (for module label)
 * @param {string[]} extensionContext.new_agent_files - New agent .md file paths
 * @param {string[]} extensionContext.new_workflow_dirs - New workflow directory paths
 * @param {string[]} [extensionContext.new_contract_files] - New contract file paths
 * @param {string} extensionContext.config_yaml_path - Path to config.yaml (modified)
 * @param {string} extensionContext.module_help_csv_path - Path to module-help.csv (modified)
 * @returns {ManifestEntry[]}
 */
function buildExtensionManifest(extensionContext) {
  const entries = [];
  const moduleName = extensionContext.new_agent_id || 'unknown-agent';

  // New agent files — created
  for (const agentFile of (extensionContext.new_agent_files || [])) {
    entries.push({ path: agentFile, operation: 'created', module: moduleName });
  }

  // New workflow directories — each gets workflow.md and SKILL.md
  for (const wfDir of (extensionContext.new_workflow_dirs || [])) {
    entries.push({ path: path.join(wfDir, 'workflow.md'), operation: 'created', module: moduleName });
    entries.push({ path: path.join(wfDir, 'SKILL.md'), operation: 'created', module: moduleName });
  }

  // New contract files — created
  for (const contractFile of (extensionContext.new_contract_files || [])) {
    entries.push({ path: contractFile, operation: 'created', module: moduleName });
  }

  // Config.yaml — modified (agent appended)
  if (extensionContext.config_yaml_path) {
    entries.push({ path: extensionContext.config_yaml_path, operation: 'modified', module: moduleName });
  }

  // Module-help.csv — modified (row appended)
  if (extensionContext.module_help_csv_path) {
    entries.push({ path: extensionContext.module_help_csv_path, operation: 'modified', module: moduleName });
  }

  // agent-registry.js — modified (agent appended to existing block)
  entries.push({ path: 'scripts/update/lib/agent-registry.js', operation: 'modified', module: moduleName });

  return entries;
}

/**
 * Build a file manifest for a skill/workflow extension (add workflow to existing agent).
 * New workflow files are "created"; agent .md, config, CSV, and registry are "modified".
 *
 * @param {Object} skillContext
 * @param {string} skillContext.new_workflow_name - New workflow name (for module label)
 * @param {string} skillContext.agent_id - Target agent ID
 * @param {string[]} skillContext.new_workflow_files - New workflow file paths (workflow.md, template)
 * @param {string} [skillContext.agent_file_path] - Agent .md file path (modified for menu)
 * @param {string} skillContext.config_yaml_path - Path to config.yaml (modified)
 * @param {string} skillContext.module_help_csv_path - Path to module-help.csv (modified)
 * @returns {ManifestEntry[]}
 */
function buildSkillExtensionManifest(skillContext) {
  const entries = [];
  const moduleName = skillContext.new_workflow_name || 'unknown-workflow';

  // New workflow files — created
  for (const wfFile of (skillContext.new_workflow_files || [])) {
    entries.push({ path: wfFile, operation: 'created', module: moduleName });
  }

  // Agent .md file — modified (menu item added)
  if (skillContext.agent_file_path) {
    entries.push({ path: skillContext.agent_file_path, operation: 'modified', module: moduleName });
  }

  // Config.yaml — modified (workflow appended)
  if (skillContext.config_yaml_path) {
    entries.push({ path: skillContext.config_yaml_path, operation: 'modified', module: moduleName });
  }

  // Module-help.csv — modified (row appended)
  if (skillContext.module_help_csv_path) {
    entries.push({ path: skillContext.module_help_csv_path, operation: 'modified', module: moduleName });
  }

  // agent-registry.js — modified (workflow appended to existing block)
  entries.push({ path: 'scripts/update/lib/agent-registry.js', operation: 'modified', module: moduleName });

  return entries;
}

module.exports = {
  buildManifest,
  buildExtensionManifest,
  buildSkillExtensionManifest,
  formatManifest,
  formatAbortInstructions,
};
