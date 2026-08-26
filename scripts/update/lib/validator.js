#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const configMerger = require('./config-merger');
const { countUserDataFiles } = require('./utils');
// Story v63-3-1: AGENT_FILES dropped — validateAgentFiles now uses
// VORTEX_SKILL_PATHS (lazy-required inside the function).
const { WORKFLOW_NAMES, WAVE3_WORKFLOW_NAMES, AGENTS, GYRE_AGENTS, EXTRA_BME_AGENTS } = require('./agent-registry');
// T76: the manifest parser and the exclusion reader are shared with the generator
// rather than reimplemented. A validator that parses differently from the writer
// cannot detect a writer bug — it detects a disagreement between two parsers.
const { parseCSVRow, readExclusions } = require('../../lib/agent-manifest-generator');

/**
 * Validator for Convoke
 * Verifies installation integrity post-migration
 */

/**
 * Validate entire installation
 * @param {object} preMigrationData - Data from before migration for comparison
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation result
 */
async function validateInstallation(preMigrationData = {}, projectRoot) {
  const checks = [];

  // 1. Config structure validation
  checks.push(await validateConfigStructure(projectRoot));

  // 2. Agent files validation
  checks.push(await validateAgentFiles(projectRoot));

  // 3. Workflow files validation
  checks.push(await validateWorkflows(projectRoot));

  // 4. Manifest consistency validation
  checks.push(await validateManifest(projectRoot));

  // 5. User data integrity validation
  if (preMigrationData.user_data_count) {
    checks.push(await validateUserDataIntegrity(preMigrationData.user_data_count, projectRoot));
  }

  // 6. Deprecated workflows validation (if applicable)
  checks.push(await validateDeprecatedWorkflows(projectRoot));

  // 7. Workflow step structure validation (P17 count + P20 filenames)
  checks.push(await validateWorkflowStepStructure(projectRoot));

  // 8. Enhance module validation (optional — passes if not installed)
  checks.push(await validateEnhanceModule(projectRoot));

  // 9. Artifacts module validation (optional — passes if not installed)
  checks.push(await validateArtifactsModule(projectRoot));

  const allPassed = checks.every(c => c.passed);

  return {
    valid: allPassed,
    checks
  };
}

/**
 * Validate config.yaml structure
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
async function validateConfigStructure(projectRoot) {
  const check = {
    name: 'Config structure',
    passed: false,
    error: null
  };

  try {
    const configPath = path.join(projectRoot, '_bmad/bme/_vortex/config.yaml');

    if (!fs.existsSync(configPath)) {
      check.error = 'config.yaml not found';
      return check;
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent);

    // Validate using config-merger
    const validation = configMerger.validateConfig(config);

    if (!validation.valid) {
      check.error = validation.errors.join(', ');
      return check;
    }

    check.passed = true;
  } catch (error) {
    check.error = error.message;
  }

  return check;
}

/**
 * Validate agent files exist
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
async function validateAgentFiles(projectRoot) {
  const check = {
    name: 'Agent files',
    passed: false,
    error: null
  };

  try {
    const agentsDir = path.join(projectRoot, '_bmad/bme/_vortex/agents');
    // U8: honor operator agent exclusions from the target config.yaml, so a
    // deliberately-removed agent doesn't fail post-upgrade validation.
    const configMerger = require('./config-merger');
    const excluded = configMerger.readExcludedAgents(
      path.join(projectRoot, '_bmad/bme/_vortex/config.yaml')
    );
    // Story v63-3-1: Vortex agents are now skill-dirs (`<id>/SKILL.md`)
    // per BMAD v6.3 convention. VORTEX_SKILL_PATHS is the post-migration
    // source of truth; `AGENT_FILES` is kept for legacy compatibility.
    const { VORTEX_SKILL_PATHS } = require('./agent-registry');
    const requiredAgents = VORTEX_SKILL_PATHS.filter(
      p => !excluded.includes(p.replace(/\/SKILL\.md$/, ''))
    );

    if (!fs.existsSync(agentsDir)) {
      check.error = 'agents/ directory not found';
      return check;
    }

    const missingAgents = [];
    for (const agent of requiredAgents) {
      const agentPath = path.join(agentsDir, agent);
      if (!fs.existsSync(agentPath)) {
        missingAgents.push(agent);
      }
    }

    if (missingAgents.length > 0) {
      check.error = `Missing agent files: ${missingAgents.join(', ')}`;
      return check;
    }

    check.passed = true;
  } catch (error) {
    check.error = error.message;
  }

  return check;
}

/**
 * Validate workflow files exist
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
async function validateWorkflows(projectRoot) {
  const check = {
    name: 'Workflow files',
    passed: false,
    error: null
  };

  try {
    const workflowsDir = path.join(projectRoot, '_bmad/bme/_vortex/workflows');
    const requiredWorkflows = WORKFLOW_NAMES;

    if (!fs.existsSync(workflowsDir)) {
      check.error = 'workflows/ directory not found';
      return check;
    }

    const missingWorkflows = [];
    for (const workflow of requiredWorkflows) {
      const workflowFile = path.join(workflowsDir, workflow, 'workflow.md');
      if (!fs.existsSync(workflowFile)) {
        missingWorkflows.push(workflow);
      }
    }

    if (missingWorkflows.length > 0) {
      check.error = `Missing workflows: ${missingWorkflows.join(', ')}`;
      return check;
    }

    check.passed = true;
  } catch (error) {
    check.error = error.message;
  }

  return check;
}

/**
 * Validate agent manifest consistency
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
/**
 * Is this line a manifest header rather than a data row or junk?
 *
 * T76. Derived from every `agent-manifest.csv` header that has existed in this
 * repository (19 commits, 3 distinct headers): all three name a `path` column, and
 * none contains `_bmad/`. A data row promoted to line 0 — the failure mode that
 * makes a corrupt manifest look healthy — always contains `_bmad/`, because the path
 * column is where the agent file lives. Junk (`<<<<<<< HEAD`, prose) has neither.
 *
 * Deliberately permissive about column NAMES: pinning the exact header would reject
 * the two older schemas that consumers upgrading from 1.0.x and 3.x still carry.
 */
function isManifestHeader(line) {
  // No quote-stripping. Round 3: `.replace(/"/g,'')` was not normalisation — neither
  // literal tested here contains a quote, so stripping cannot make a match appear
  // that was absent, only create one ACROSS a quote boundary (`pa"th` -> `path`).
  // Its sole possible effect was to make a mangled data row look like a header, which
  // is the exact defect Round 2 closed. All three historical headers still match:
  // the quoted one carries `"path"`, which contains `path`.
  const normalised = line.toLowerCase();
  return normalised.includes('path') && !normalised.includes('_bmad/');
}

/**
 * Does this parsed row point at the given agent's file?
 *
 * Anchored on the `path` column, which is the only column present in all three
 * historical schemas, and matched submodule- and leaf-agnostically: both
 * `<id>.md` (121 occurrences in history) and `<id>/SKILL.md` (7) are legitimate,
 * and the submodule has been renamed once (`_designos` -> `_vortex`).
 */
function rowNamesAgent(fields, agentId) {
  return fields.some(f => f.includes(`/agents/${agentId}.md`) || f.includes(`/agents/${agentId}/`));
}

/**
 * Is this a row the GENERATOR considers its own?
 *
 * **The reader must classify rows the same way the writer does, or the two disagree
 * permanently.** Round 1 of T76 caught this: an earlier version counted any row whose
 * path named an agent. `generateAgentManifest` instead keeps any row whose module
 * column is not exactly `bme` and appends a fresh one — so a row naming a Convoke
 * agent with a blank module column is **preserved forever by the writer and counted
 * as a duplicate by the reader**. That shape is real: commit `0d2c15fc` (an upstream
 * BMAD installer run) wrote 7 such rows, and 7 of the 23 manifest blobs in this
 * repository's history reproduce it. Because a failed check throws at
 * `migration-runner.js:146` and rolls the update back to the same file, the consumer
 * would be wedged with no repair path.
 *
 * `fields.includes('bme')` rather than a fixed index: the module column sits at
 * index 9 in the v6.1.0 schema and index 8 in both 10-column schemas.
 */
function isOwnedRow(fields, agentId) {
  return rowNamesAgent(fields, agentId) && fields.includes('bme');
}

/**
 * Validate the agent manifest.
 *
 * T76 rewrote this. The previous version asserted only that each Convoke agent ID
 * appeared **somewhere in the file as a raw substring**. Measured 2026-08-26, it
 * returned `passed: true` for a manifest missing 41 of its 53 rows, one with every
 * bme row duplicated, one whose header was `<<<<<<< HEAD`, one containing no rows at
 * all with the IDs in a single prose line, and one with all four Gyre agents absent
 * (`GYRE_AGENT_IDS` was never imported). It also FAILED for a consumer who
 * legitimately opted an agent out via `excluded_agents` — so the one state it did
 * reject was a supported configuration.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} check result
 */
async function validateManifest(projectRoot) {
  const check = {
    name: 'Agent manifest',
    passed: false,
    error: null
  };

  try {
    const manifestPath = path.join(projectRoot, '_bmad/_config/agent-manifest.csv');

    if (!fs.existsSync(manifestPath)) {
      // Manifest is optional, so this is not a failure
      check.passed = true;
      check.warning = 'agent-manifest.csv not found (optional)';
      return check;
    }

    const raw = fs.readFileSync(manifestPath, 'utf8').trim();
    if (raw === '') {
      check.error = 'agent-manifest.csv is empty — run `npm run generate:manifest` (dev) or reinstall';
      return check;
    }

    const lines = raw.split('\n').filter(l => l.trim());

    // An unrecognisable header is REPORTED, never failed. Failing here throws at
    // migration-runner.js:146 and rolls the update back to the same broken file —
    // and `generateAgentManifest` preserves `existing[0]` verbatim, so it cannot
    // repair a lost header either. The consumer would be permanently unable to
    // update, which is strictly worse than the corruption being reported. Same
    // reasoning as `preflight-soft-warn`. Found by Round 1.
    const warnings = [];
    const hasHeader = isManifestHeader(lines[0]);
    if (!hasHeader) {
      warnings.push(
        `header is unrecognisable (line 1 is: ${lines[0].slice(0, 80)}) — the header line was probably lost`
      );
    }

    // Expected = every registry agent the operator has NOT opted out of. Derived from
    // the registry, never a hardcoded count (`derive-counts-from-source`).
    const excluded = readExclusions(projectRoot);
    const expected = [
      ...AGENTS.filter(a => !excluded.vortex.includes(a.id)),
      ...GYRE_AGENTS.filter(a => !excluded.gyre.includes(a.id)),
      ...EXTRA_BME_AGENTS,
    ].map(a => a.id);

    const counts = new Map(expected.map(id => [id, 0]));
    // Skip line 0 only when it IS a header. Round 2: discarding it unconditionally
    // after having just decided it is NOT a header throws away a real agent row —
    // which then reports as `missing`, fails, and rolls the update back to the same
    // file. That is the wedge the warning downgrade above exists to prevent, reached
    // through the other door.
    for (const row of lines.slice(hasHeader ? 1 : 0)) {
      const fields = parseCSVRow(row);
      for (const id of expected) {
        if (isOwnedRow(fields, id)) counts.set(id, counts.get(id) + 1);
      }
    }

    const missing = expected.filter(id => counts.get(id) === 0);
    if (missing.length > 0) {
      check.error = `Agent manifest missing: ${missing.join(', ')}`;
      return check;
    }

    // Duplicates are REPORTED, never failed, for the same reason as the header: the
    // update has already run the generator, so a duplicate here means the generator
    // produced one (see T75). Throwing would roll back to the pre-update file and
    // reproduce it on every subsequent attempt.
    const duplicated = expected.filter(id => counts.get(id) > 1);
    if (duplicated.length > 0) {
      warnings.push(
        `duplicate rows for: ${duplicated.map(id => `${id} (${counts.get(id)}x)`).join(', ')}`
      );
    }

    // Confirm standalone bme agent files exist on disk
    const missingExtraFiles = EXTRA_BME_AGENTS
      .filter(a => !fs.existsSync(path.join(projectRoot, '_bmad', 'bme', a.submodule, 'agents', `${a.id}.md`)))
      .map(a => a.id);
    if (missingExtraFiles.length > 0) {
      check.error = `Standalone bme agent files missing: ${missingExtraFiles.join(', ')}`;
      return check;
    }

    check.passed = true;
    if (warnings.length > 0) check.warning = warnings.join('; ');
  } catch (error) {
    check.error = error.message;
  }

  return check;
}

/**
 * Validate user data integrity
 * @param {number} expectedCount - Expected file count
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
async function validateUserDataIntegrity(expectedCount, projectRoot) {
  const check = {
    name: 'User data preserved',
    passed: false,
    error: null
  };

  try {
    const outputDir = path.join(projectRoot, '_bmad-output');

    if (!fs.existsSync(outputDir)) {
      check.error = '_bmad-output/ directory not found';
      return check;
    }

    const currentCount = await countUserDataFiles(projectRoot);

    // Allow for slight variation (user guides may have been updated)
    if (currentCount >= expectedCount - 2) {
      check.passed = true;
      check.info = `Files: ${currentCount} (expected: ${expectedCount})`;
    } else {
      check.error = `User data count mismatch: ${currentCount} (expected: ${expectedCount})`;
    }
  } catch (error) {
    check.error = error.message;
  }

  return check;
}

/**
 * Validate deprecated workflows structure
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
async function validateDeprecatedWorkflows(projectRoot) {
  const check = {
    name: 'Deprecated workflows',
    passed: true, // Not required, so pass by default
    error: null
  };

  try {
    const deprecatedDir = path.join(projectRoot, '_bmad/bme/_vortex/workflows/_deprecated');

    if (!fs.existsSync(deprecatedDir)) {
      check.info = 'No deprecated workflows (fresh installation)';
      return check;
    }

    // If deprecated dir exists, check for expected workflows
    const empathyMapDir = path.join(deprecatedDir, 'empathy-map');
    const wireframeDir = path.join(deprecatedDir, 'wireframe');

    if (!fs.existsSync(empathyMapDir) && !fs.existsSync(wireframeDir)) {
      check.warning = '_deprecated/ directory exists but is empty';
    } else {
      check.info = 'Deprecated workflows preserved in _deprecated/';
    }

    check.passed = true;
  } catch (error) {
    check.error = error.message;
    check.passed = false;
  }

  return check;
}

/**
 * Validate workflow step structure (P17 count + P20 filenames)
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
async function validateWorkflowStepStructure(projectRoot) {
  const check = {
    name: 'Workflow step structure',
    passed: true,
    error: null
  };

  try {
    const workflowsDir = path.join(projectRoot, '_bmad/bme/_vortex/workflows');
    const issues = [];

    for (const workflow of WORKFLOW_NAMES) {
      const stepsDir = path.join(workflowsDir, workflow, 'steps');

      if (!fs.existsSync(stepsDir)) {
        continue; // Placeholder workflows without steps/ are valid
      }

      const files = fs.readdirSync(stepsDir).filter(f => f.endsWith('.md'));

      // P17: step count must be 4-6
      if (files.length < 4 || files.length > 6) {
        issues.push(`${workflow}: ${files.length} step files (expected 4-6)`);
        continue;
      }

      // P20: standardized filenames (Wave 3 workflows only)
      if (WAVE3_WORKFLOW_NAMES.has(workflow)) {
        if (!files.includes('step-01-setup.md')) {
          issues.push(`${workflow}: missing step-01-setup.md`);
        }
        if (!files.includes('step-02-context.md')) {
          issues.push(`${workflow}: missing step-02-context.md`);
        }
        if (!files.some(f => f.endsWith('-synthesize.md'))) {
          issues.push(`${workflow}: missing *-synthesize.md final step`);
        }
      }
    }

    if (issues.length > 0) {
      check.passed = false;
      check.error = `Step structure issues: ${issues.join('; ')}`;
    }
  } catch (error) {
    check.error = error.message;
    check.passed = false;
  }

  return check;
}

/**
 * Validate Enhance module installation (optional — passes if not installed)
 * Performs 5-point verification: directory, entry point, menu patch, config, filesystem consistency
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
async function validateEnhanceModule(projectRoot) {
  const check = {
    name: 'Enhance module',
    passed: false,
    error: null
  };

  try {
    const enhanceDir = path.join(projectRoot, '_bmad/bme/_enhance');

    // Check 1: Directory exists — if not, Enhance is simply not installed (optional)
    if (!fs.existsSync(enhanceDir)) {
      check.passed = true;
      check.info = 'Enhance module not installed (optional)';
      return check;
    }

    const failures = [];

    // Check 4 (first — needed by checks 2, 3, 5): Config valid
    const configPath = path.join(enhanceDir, 'config.yaml');
    let config = null;

    if (!fs.existsSync(configPath)) {
      failures.push('config.yaml not found');
    } else {
      try {
        config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      } catch (err) {
        failures.push(`config.yaml parse error: ${err.message}`);
      }

      if (config) {
        const missing = [];
        if (!config.name) missing.push('name');
        if (!config.version) missing.push('version');
        if (!config.description) missing.push('description');
        if (!Array.isArray(config.workflows) || config.workflows.length === 0) {
          missing.push('workflows (must be non-empty array)');
        } else {
          config.workflows.forEach((wf, i) => {
            const wfMissing = [];
            if (!wf.name) wfMissing.push('name');
            if (!wf.entry) wfMissing.push('entry');
            if (!wf.target_agent) wfMissing.push('target_agent');
            if (!wf.menu_patch_name) wfMissing.push('menu_patch_name');
            if (wfMissing.length > 0) {
              missing.push(`workflows[${i}] missing: ${wfMissing.join(', ')}`);
            }
          });
        }
        if (missing.length > 0) {
          failures.push(`config missing fields: ${missing.join('; ')}`);
        }
      }
    }

    // Checks 2, 3, 5 require a valid config with workflows
    if (config && Array.isArray(config.workflows)) {
      for (const wf of config.workflows) {
        // Check 2: Workflow entry point resolves
        if (wf.entry) {
          const entryPath = path.join(enhanceDir, wf.entry);
          if (!fs.existsSync(entryPath)) {
            failures.push(`workflow entry point not found: ${wf.entry}`);
          }
        }

        // Check 3: Menu patch present in target agent
        if (wf.target_agent) {
          const agentPath = path.join(projectRoot, '_bmad', wf.target_agent);
          if (fs.existsSync(agentPath)) {
            const agentContent = fs.readFileSync(agentPath, 'utf8');
            const patchName = wf.menu_patch_name || wf.name;
            if (!agentContent.includes(patchName)) {
              failures.push(`menu patch "${patchName}" not found in ${wf.target_agent}`);
            }
          }
          // If agent file doesn't exist, that's already caught by agent validation — not an Enhance-specific failure
        }

        // Check 5: Config-to-filesystem consistency — workflow directory exists
        if (wf.name) {
          const wfDir = path.join(enhanceDir, 'workflows', wf.name);
          if (!fs.existsSync(wfDir)) {
            failures.push(`workflow directory not found for registered workflow: ${wf.name}`);
          }
        }

        // Check 6: Skill wrapper exists for workflow
        if (wf.name) {
          const skillWrapperPath = path.join(projectRoot, '.claude', 'skills', `bmad-enhance-${wf.name}`, 'SKILL.md');
          if (!fs.existsSync(skillWrapperPath)) {
            failures.push(`skill wrapper not found: .claude/skills/bmad-enhance-${wf.name}/SKILL.md`);
          }
        }
      }
    }

    if (failures.length > 0) {
      check.error = `Enhance: ${failures.join('; ')}`;
    } else {
      check.passed = true;
    }
  } catch (error) {
    check.error = error.message;
  }

  return check;
}

/**
 * Validate Artifacts module installation (optional — passes if not installed)
 * Performs 5-point verification: directory, config, workflows array, per-workflow entry, per-workflow skill wrapper
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Validation check result
 */
async function validateArtifactsModule(projectRoot) {
  const check = {
    name: 'Artifacts module',
    passed: false,
    error: null
  };

  try {
    const artifactsDir = path.join(projectRoot, '_bmad/bme/_artifacts');

    // Check 1: Directory exists — if not, Artifacts is simply not installed (optional)
    if (!fs.existsSync(artifactsDir)) {
      check.passed = true;
      check.info = 'not installed';
      return check;
    }

    const failures = [];

    // Check 2: Config parse — bail early if config is unreadable, since later checks
    // depend on a parsed workflows array.
    const configPath = path.join(artifactsDir, 'config.yaml');
    if (!fs.existsSync(configPath)) {
      check.error = 'Artifacts: config.yaml not found';
      return check;
    }

    let config = null;
    try {
      config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      check.error = `Artifacts: config.yaml parse error: ${err.message}`;
      return check;
    }

    if (!config || typeof config !== 'object') {
      check.error = 'Artifacts: config.yaml is empty or invalid';
      return check;
    }

    // Check 3: Workflows array non-empty
    if (!Array.isArray(config.workflows) || config.workflows.length === 0) {
      check.error = 'Artifacts: config.yaml has no workflows array';
      return check;
    }

    // Checks 4 & 5: Per-workflow entry point and skill wrapper.
    // Aggregate failures across all workflows so a single doctor run reports every
    // problem at once (mirrors validateEnhanceModule).
    // Non-standalone workflows are skipped from wrapper/entry checks because
    // refresh-installation.js section 6d does NOT install them — validating their
    // wrapper would be a contract mismatch with the refresh logic.
    for (const wf of config.workflows) {
      if (!wf || !wf.name || !wf.entry) {
        failures.push('workflow entry missing name or entry field');
        continue;
      }

      if (wf.standalone !== true) {
        // Refresh skips non-standalone workflows; nothing to validate.
        continue;
      }

      // Check 4: Workflow entry point file exists
      const entryPath = path.join(artifactsDir, wf.entry);
      if (!fs.existsSync(entryPath)) {
        failures.push(`workflow entry missing for ${wf.name}: ${wf.entry}`);
      }

      // Check 5: Skill wrapper exists at .claude/skills/{workflow.name}/SKILL.md
      // (workflow.name already carries the bmad- prefix; do NOT synthesize bmad-${wf.name})
      const skillWrapperPath = path.join(projectRoot, '.claude', 'skills', wf.name, 'SKILL.md');
      if (!fs.existsSync(skillWrapperPath)) {
        failures.push(`skill wrapper missing for ${wf.name}`);
      }
    }

    if (failures.length > 0) {
      check.error = `Artifacts: ${failures.join('; ')}`;
    } else {
      check.passed = true;
    }
  } catch (error) {
    check.error = error.message;
  }

  return check;
}

/**
 * Validate a SKILL.md file has required frontmatter fields
 * @param {string} skillMdPath - Absolute path to SKILL.md file
 * @returns {Promise<object>} Validation result { valid, errors }
 */
async function validateSkillMd(skillMdPath) {
  const errors = [];

  if (!fs.existsSync(skillMdPath)) {
    errors.push(`SKILL.md not found: ${skillMdPath}`);
    return { valid: false, errors };
  }

  const content = fs.readFileSync(skillMdPath, 'utf8');

  // Extract YAML frontmatter between --- delimiters
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    errors.push('SKILL.md missing YAML frontmatter (--- delimiters)');
    return { valid: false, errors };
  }

  let frontmatter;
  try {
    frontmatter = yaml.load(fmMatch[1]);
  } catch (err) {
    errors.push(`SKILL.md frontmatter parse error: ${err.message}`);
    return { valid: false, errors };
  }

  if (!frontmatter || typeof frontmatter !== 'object') {
    errors.push('SKILL.md frontmatter is empty or not an object');
    return { valid: false, errors };
  }

  if (!frontmatter.name || typeof frontmatter.name !== 'string') {
    errors.push('SKILL.md missing required field: name');
  }

  if (!frontmatter.description || typeof frontmatter.description !== 'string') {
    errors.push('SKILL.md missing required field: description');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate step files in a skill directory follow sequential numbering
 * @param {string} skillDir - Absolute path to skill directory
 * @returns {Promise<object>} Validation result { valid, errors }
 */
async function validateStepFiles(skillDir) {
  const errors = [];

  if (!fs.existsSync(skillDir)) {
    errors.push(`Skill directory not found: ${skillDir}`);
    return { valid: false, errors };
  }

  // Collect step files from skill dir and steps/ subdirectory
  const stepFiles = [];
  const entries = fs.readdirSync(skillDir);

  for (const entry of entries) {
    if (/^step-\d+-/.test(entry) && entry.endsWith('.md')) {
      stepFiles.push(entry);
    }
  }

  const stepsSubdir = path.join(skillDir, 'steps');
  if (fs.existsSync(stepsSubdir)) {
    const subEntries = fs.readdirSync(stepsSubdir);
    for (const entry of subEntries) {
      if (/^step-\d+-/.test(entry) && entry.endsWith('.md')) {
        stepFiles.push(entry);
      }
    }
  }

  if (stepFiles.length === 0) {
    // No step files is valid — some skills are single-file (agent-activation type)
    return { valid: true, errors };
  }

  // Extract step numbers and check for sequential numbering
  const stepNumbers = stepFiles
    .map(f => {
      const match = f.match(/^step-(\d+)-/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(n => n !== null)
    .sort((a, b) => a - b);

  // Remove duplicates (same step number in root and steps/)
  const uniqueSteps = [...new Set(stepNumbers)];

  // Check for gaps in sequence
  for (let i = 0; i < uniqueSteps.length - 1; i++) {
    if (uniqueSteps[i + 1] - uniqueSteps[i] > 1) {
      errors.push(
        `Step numbering gap: step-${String(uniqueSteps[i]).padStart(2, '0')} to step-${String(uniqueSteps[i + 1]).padStart(2, '0')} (missing step-${String(uniqueSteps[i] + 1).padStart(2, '0')})`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate skill cohesion — workflow.md exists if step files exist
 * @param {string} skillDir - Absolute path to skill directory
 * @returns {Promise<object>} Validation result { valid, errors }
 */
async function validateSkillCohesion(skillDir) {
  const errors = [];

  if (!fs.existsSync(skillDir)) {
    errors.push(`Skill directory not found: ${skillDir}`);
    return { valid: false, errors };
  }

  const entries = fs.readdirSync(skillDir);
  const hasStepFiles = entries.some(e => /^step-\d+-/.test(e) && e.endsWith('.md'));
  const hasStepsSubdir = fs.existsSync(path.join(skillDir, 'steps'));
  const hasWorkflow = entries.includes('workflow.md');

  // If step files or steps/ subdirectory exist, workflow.md should too
  if ((hasStepFiles || hasStepsSubdir) && !hasWorkflow) {
    errors.push('Skill has step files but no workflow.md');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a complete skill package (SKILL.md + step files + cohesion)
 * @param {string} skillDir - Absolute path to skill directory
 * @returns {Promise<object>} Validation result { valid, errors }
 */
async function validateSkill(skillDir) {
  const allErrors = [];

  const skillMdPath = path.join(skillDir, 'SKILL.md');
  const skillMdResult = await validateSkillMd(skillMdPath);
  allErrors.push(...skillMdResult.errors);

  const stepResult = await validateStepFiles(skillDir);
  allErrors.push(...stepResult.errors);

  const cohesionResult = await validateSkillCohesion(skillDir);
  allErrors.push(...cohesionResult.errors);

  return { valid: allErrors.length === 0, errors: allErrors };
}

module.exports = {
  validateInstallation,
  validateConfigStructure,
  validateAgentFiles,
  validateWorkflows,
  validateManifest,
  isManifestHeader,
  rowNamesAgent,
  isOwnedRow,
  validateUserDataIntegrity,
  validateDeprecatedWorkflows,
  validateWorkflowStepStructure,
  validateEnhanceModule,
  validateArtifactsModule,
  validateSkillMd,
  validateStepFiles,
  validateSkillCohesion,
  validateSkill
};
