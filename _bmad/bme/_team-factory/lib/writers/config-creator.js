'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { toKebab, deriveWorkflowName } = require('../utils/naming-utils');

/** @typedef {import('../types/factory-types')} Types */

/**
 * Create a per-module config.yaml for a new team.
 * Matches the Gyre/Vortex config.yaml schema exactly.
 *
 * Safety: Simple (write → verify parse). Additive-only (NFR17).
 * Collision detection runs before writing (NFR15).
 *
 * @param {Object} specData - Parsed team spec file content
 * @param {string} outputPath - Full path to write config.yaml
 * @param {string} bmeRoot - Path to _bmad/bme/ directory for collision scanning
 * @returns {Promise<import('../types/factory-types').CreatorResult>}
 */
async function createConfig(specData, outputPath, bmeRoot) {
  const errors = [];

  // --- Additive-only check (NFR17) ---
  if (await fs.pathExists(outputPath)) {
    return { success: false, filePath: outputPath, errors: ['config.yaml already exists at target path — additive-only, will not overwrite'], collisions: [] };
  }

  // --- Collision detection (NFR15) ---
  const collisions = await detectCollisions(specData, bmeRoot);
  if (collisions.length > 0) {
    return { success: false, filePath: outputPath, errors: ['Collision(s) detected with existing modules'], collisions };
  }

  // --- Build config data ---
  const configData = buildConfigData(specData);

  // --- Write config.yaml ---
  try {
    await fs.ensureDir(path.dirname(outputPath));
    const content = yaml.dump(configData, { indent: 2, lineWidth: -1, noRefs: true });
    await fs.writeFile(outputPath, content, 'utf8');
  } catch (err) {
    return { success: false, filePath: outputPath, errors: [`Write failed: ${err.message}`], collisions: [] };
  }

  // --- Verify parse (Simple safety) ---
  try {
    const readBack = await fs.readFile(outputPath, 'utf8');
    const parsed = yaml.load(readBack);
    if (!parsed || !parsed.submodule_name || !parsed.agents || !parsed.workflows) {
      errors.push('Verification failed: config.yaml missing required fields after write');
    }
  } catch (err) {
    errors.push(`Verification failed: ${err.message}`);
  }

  if (errors.length > 0) {
    return { success: false, filePath: outputPath, errors, collisions: [] };
  }

  return { success: true, filePath: outputPath, errors: [], collisions: [] };
}

/**
 * Build config.yaml data matching Gyre/Vortex schema.
 * @param {Object} specData - Parsed team spec file
 * @returns {import('../types/factory-types').ConfigData}
 */
function buildConfigData(specData) {
  const agents = (specData.agents || []).map(a => a.id);

  // Derive workflow names from agents' capabilities (first capability kebab-case)
  // or use workflow_names if available in spec
  const workflows = deriveWorkflowNames(specData);

  return {
    submodule_name: `_${specData.team_name_kebab}`,
    description: specData.description || `${specData.team_name} team module`,
    module: 'bme',
    output_folder: prefixProjectRoot(specData.integration.output_directory),
    agents,
    workflows,
    version: '1.0.0',
    user_name: '{user}',
    communication_language: 'en',
    party_mode_enabled: true,
    core_module: 'bme'
  };
}

/**
 * Create the team's artifact output directory.
 *
 * tf-2-13 (T133e): nothing created it. The three `ensureDir` calls in this module,
 * `csv-creator` and `spec-writer` each create the parent of the file being written;
 * `integration.output_directory` was only ever READ — validated, written into
 * `config.yaml` as `output_folder`, and displayed in the review summary. `tf-2-11`
 * Risk #3 predicted this and the pilot confirmed it: the directory never appeared,
 * so the first workflow to write an artifact would have failed on a missing path.
 *
 * Takes `projectRoot` explicitly rather than reading `process.cwd()`, per the
 * `no-process-cwd-in-libs` rule in project-context.md. Idempotent.
 *
 * @param {Object} specData - Parsed team spec
 * @param {string} projectRoot - Absolute path to the project root
 * @returns {Promise<{success: boolean, path: string, errors: string[]}>}
 */
async function ensureOutputDirectory(specData, projectRoot) {
  const relative = specData && specData.integration && specData.integration.output_directory;
  if (!relative) {
    return { success: false, path: '', errors: ['integration.output_directory is required'] };
  }
  if (!projectRoot) {
    return { success: false, path: '', errors: ['projectRoot is required — do not fall back to process.cwd()'] };
  }
  const target = path.resolve(projectRoot, relative);
  try {
    await fs.ensureDir(target);
  } catch (err) {
    return { success: false, path: target, errors: [`Failed to create output directory: ${err.message}`] };
  }
  return { success: true, path: target, errors: [] };
}

/**
 * Prefix an output directory with `{project-root}/` unless it already carries it.
 *
 * tf-2-13 (T133a): `buildConfigData` wrote the bare `integration.output_directory`,
 * so a generated team's `output_folder` resolved against `process.cwd()` rather than
 * the project root — the hazard `project-context.md` rule `no-process-cwd-in-libs`
 * exists for. `step-02-connect.md` §5 documents the template as
 * `'{project-root}/{output_directory}'`, and `_gyre`, `_vortex` and `_team-factory`
 * all carry the prefix; only generated teams did not.
 *
 * Applied at WRITE time rather than stored in the spec: the spec's field is the
 * repo-relative path the contributor chose, and `spec-parser.js` now enforces that
 * shape. Idempotent, so a spec that already carries the prefix is not double-wrapped.
 *
 * @param {string} outputDirectory
 * @returns {string}
 */
function prefixProjectRoot(outputDirectory) {
  const value = String(outputDirectory || '');
  return value.startsWith('{project-root}/') ? value : `{project-root}/${value}`;
}

/**
 * Derive workflow names from spec data.
 * Uses shared deriveWorkflowName() for per-agent logic, then deduplicates.
 * @param {Object} specData
 * @returns {string[]}
 */
function deriveWorkflowNames(specData) {
  const names = (specData.agents || []).map(agent => deriveWorkflowName(agent, specData));

  // Check for intra-spec duplicate workflow names
  const seen = new Set();
  for (let i = 0; i < names.length; i++) {
    if (seen.has(names[i])) {
      const agent = (specData.agents || [])[i];
      // Disambiguate by appending agent id
      names[i] = `${names[i]}-${(agent && agent.id) || i}`;
    }
    seen.add(names[i]);
  }

  return names;
}

/**
 * Scan existing config.yaml files in bmeRoot for collisions (NFR15).
 * Checks submodule_name, agent IDs, and workflow names.
 * @param {Object} specData - New team spec
 * @param {string} bmeRoot - Path to _bmad/bme/
 * @returns {Promise<import('../types/factory-types').Collision[]>}
 */
async function detectCollisions(specData, bmeRoot) {
  const collisions = [];
  const newSubmodule = `_${specData.team_name_kebab}`;
  const newAgentIds = (specData.agents || []).map(a => a.id);
  const newWorkflows = deriveWorkflowNames(specData);

  // Find all existing config.yaml files under bmeRoot
  let entries;
  try {
    entries = await fs.readdir(bmeRoot);
  } catch {
    return collisions; // bmeRoot doesn't exist yet — no collisions possible
  }

  for (const entry of entries) {
    // Skip the new team's own directory to avoid self-collision on re-run
    if (entry === newSubmodule) continue;
    const configPath = path.join(bmeRoot, entry, 'config.yaml');
    if (!await fs.pathExists(configPath)) continue;

    let existing;
    try {
      existing = yaml.load(await fs.readFile(configPath, 'utf8'));
    } catch {
      continue; // Skip unparseable configs
    }
    if (!existing) continue;

    const moduleName = entry;

    // Check submodule_name collision
    if (existing.submodule_name === newSubmodule) {
      collisions.push({ field: 'submodule_name', value: newSubmodule, existingModule: moduleName });
    }

    // Check agent ID collisions
    const existingAgents = existing.agents || [];
    for (const agentId of newAgentIds) {
      if (existingAgents.includes(agentId)) {
        collisions.push({ field: 'agent', value: agentId, existingModule: moduleName });
      }
    }

    // Check workflow name collisions
    const existingWorkflows = existing.workflows || [];
    for (const wf of newWorkflows) {
      if (existingWorkflows.includes(wf)) {
        collisions.push({ field: 'workflow', value: wf, existingModule: moduleName });
      }
    }
  }

  return collisions;
}

// --- CLI entry point ---
if (require.main === module) {
  const args = process.argv.slice(2);
  const specFileIdx = args.indexOf('--spec-file');
  const dryRunIdx = args.indexOf('--dry-run');

  if (specFileIdx === -1 || !args[specFileIdx + 1]) {
    console.error('Usage: node config-creator.js --spec-file <path> [--dry-run]');
    process.exit(1);
  }

  const specFilePath = args[specFileIdx + 1];
  const dryRun = dryRunIdx !== -1;

  (async () => {
    try {
      const specContent = await fs.readFile(specFilePath, 'utf8');
      const specData = yaml.load(specContent);
      const bmeRoot = path.resolve(__dirname, '../../../../');
      const outputPath = path.join(bmeRoot, `_${specData.team_name_kebab}`, 'config.yaml');

      if (dryRun) {
        const collisions = await detectCollisions(specData, bmeRoot);
        console.log(JSON.stringify({ dryRun: true, collisions }, null, 2));
        process.exit(collisions.length > 0 ? 1 : 0);
      }

      const result = await createConfig(specData, outputPath, bmeRoot);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      console.log(JSON.stringify({ success: false, errors: [err.message] }, null, 2));
      process.exit(1);
    }
  })();
}

module.exports = { createConfig, buildConfigData, ensureOutputDirectory, detectCollisions, deriveWorkflowNames, toKebab };
