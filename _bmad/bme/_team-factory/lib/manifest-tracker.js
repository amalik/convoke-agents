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

  // Workflow directories — each gets a workflow.md plus its step files.
  // tf-2-13 (T133d): this previously also claimed a `SKILL.md` per workflow. The
  // generator writes `workflow.md` + `steps/` and never a SKILL.md (`grep -c SKILL.md
  // step-04-generate.md` is 0) — the tracker was written to a v6.3 expectation while
  // the generator emits v5. T127 ruled the generator stays v5, so the tracker moves.
  // This matters because step-05-validate.md §8 prints the manifest as the abort
  // path's removal instructions: a named-but-uncreated file sends the operator after
  // nothing, and an omitted file is left behind.
  for (const wfDir of (generationContext.workflow_dirs || [])) {
    entries.push({ path: path.join(wfDir, 'workflow.md'), operation: 'created', module: moduleName });
  }
  for (const stepFile of (generationContext.workflow_step_files || [])) {
    entries.push({ path: stepFile, operation: 'created', module: moduleName });
  }

  // README and user guides — listed by §1 and §7 of step-04 as generated, but the
  // tracker had no branch for either (tf-2-13, T133d).
  if (generationContext.readme_path) {
    entries.push({ path: generationContext.readme_path, operation: 'created', module: moduleName });
  }
  for (const guideFile of (generationContext.guide_files || [])) {
    entries.push({ path: guideFile, operation: 'created', module: moduleName });
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

  // Output directory — created during integration wiring (tf-2-13, T133e). Listed so
  // the abort path removes it; it is the one artefact that lives outside module_root.
  if (generationContext.output_directory_path) {
    entries.push({ path: generationContext.output_directory_path, operation: 'created', module: moduleName });
  }

  // agent-registry.js — modified, ONLY on a confirmed successful write.
  //
  // tf-2-13 (T133d): originally pushed unconditionally. The first fix relaxed this to
  // "unless explicitly failed", justified as "over-claiming is the safer error — the
  // operator checks a file needlessly". **R2 corrected that: the argument is inverted
  // for this consumer.** `formatAbortInstructions` does not ask anyone to check — it
  // emits `git checkout -- "scripts/update/lib/agent-registry.js"`, which DISCARDS the
  // operator's uncommitted work. And absence is not a rare case: step-04 §5c runs
  // BEFORE §5d, so on the documented §5c abort this key is absent — meaning the
  // relaxed form handed a destructive revert to an operator whose registry the factory
  // had never touched. `writeRegistryBlock` carries a dirty-tree check precisely
  // because that file holds uncommitted edits.
  //
  // For a DESTRUCTIVE instruction, under-claiming is the safe direction. Only a
  // confirmed write earns a revert instruction.
  // R3: `success === true` is still not "a confirmed write" — the third predicate on
  // this one line, and the first two were both wrong for the same reason: they asked
  // about the CALL, not about the FILE.
  //   R1  unconditional        always claim
  //   R2a success !== false    claim unless it failed        (destructive on absence)
  //   R2b success === true     claim if the call succeeded   (destructive on a no-op)
  //   R3  written.length > 0   claim if it actually wrote
  // `registry-writer.js:42` returns `{success:true, written:[], skipped:['block already
  // exists']}` when the prefix block is present, and that early return sits BEFORE the
  // dirty-tree check at :75 — so R2's stated defence ("writeRegistryBlock carries a
  // dirty-tree check") never runs on this path. `derivePrefix` collapses `data-ops`,
  // `data_ops` and `Data-Ops` onto `DATA_OPS`, so a genuinely different team can land on
  // an existing block, leave the file byte-identical, and be handed
  // `git checkout -- scripts/update/lib/agent-registry.js`, discarding uncommitted work.
  const wiring = generationContext.registry_wiring_result;
  if (wiring && wiring.success === true && Array.isArray(wiring.written) && wiring.written.length > 0) {
    entries.push({ path: 'scripts/update/lib/agent-registry.js', operation: 'modified', module: moduleName });
  }

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
