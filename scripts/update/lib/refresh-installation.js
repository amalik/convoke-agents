#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const YAML = require('yaml'); // Comment-preserving YAML library (ag-7-1: I29). Use for WRITE sites that need to preserve comments. js-yaml stays for read-only consumers.
const { getPackageVersion, assertVersion } = require('./utils');
const configMerger = require('./config-merger');
// Story v63-3-1: AGENT_FILES dropped from this file's imports — post-migration
// the Vortex copy loop iterates AGENT_IDS and handles skill-dir shape inline.
// AGENT_FILES remains @deprecated in agent-registry for any external consumers.
const { AGENTS, AGENT_IDS, WORKFLOW_NAMES, GYRE_AGENTS, GYRE_AGENT_FILES, GYRE_AGENT_IDS, GYRE_WORKFLOW_NAMES, EXTRA_BME_AGENTS } = require('./agent-registry');
const {
  generateAgentManifest,
  CHANGE_MESSAGE: MANIFEST_CHANGE_MESSAGE,
  SKIP_MESSAGE: MANIFEST_SKIP_MESSAGE,
} = require('../../lib/agent-manifest-generator');

/**
 * Refresh Installation for Convoke
 *
 * Copies latest agent files, workflows, config, and user guides from the
 * package to the project. Called ONCE after all migration deltas have run,
 * or directly by the install script.
 */

/**
 * Refresh all installation files from the package to the project.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {object} options
 * @param {boolean} options.backupGuides - Create .bak of user guides before overwriting (default: true)
 * @param {boolean} options.verbose - Log each action (default: true)
 * @returns {Promise<Array<string>>} List of changes made
 */
async function refreshInstallation(projectRoot, options = {}) {
  const { backupGuides = true, verbose = true } = options;
  const changes = [];
  const packageRoot = path.join(__dirname, '..', '..', '..');
  const packageVortex = path.join(packageRoot, '_bmad', 'bme', '_vortex');
  const targetVortex = path.join(projectRoot, '_bmad', 'bme', '_vortex');
  const version = getPackageVersion();

  // When running from the package's own directory (dev environment),
  // source and destination are identical — skip file copies.
  const isSameRoot = path.resolve(packageRoot) === path.resolve(projectRoot);

  // U8: read per-module `excluded_agents` from target configs BEFORE copy.
  // These are opt-out lists the operator maintains; excluded agents don't get
  // their agent file copied, don't get a skill wrapper generated, and don't
  // fail presence checks downstream.
  const vortexExcluded = configMerger.readExcludedAgents(path.join(targetVortex, 'config.yaml'));
  const gyreExcluded = configMerger.readExcludedAgents(
    path.join(projectRoot, '_bmad', 'bme', '_gyre', 'config.yaml')
  );

  // 1. Copy agent files
  const agentsSource = path.join(packageVortex, 'agents');
  const agentsTarget = path.join(targetVortex, 'agents');
  await fs.ensureDir(agentsTarget);

  if (!isSameRoot) {
    // Story v63-3-1: Vortex agents are now skill-dirs (`<agentId>/SKILL.md`)
    // per BMAD v6.3 convention. Copy the entire agent directory tree.
    for (const agentId of AGENT_IDS) {
      if (vortexExcluded.includes(agentId)) {
        changes.push(`Skipped excluded Vortex agent: ${agentId}`);
        if (verbose) console.log(`    Skipped excluded Vortex agent: ${agentId}`);
        continue;
      }
      const srcDir = path.join(agentsSource, agentId);
      const destDir = path.join(agentsTarget, agentId);
      if (fs.existsSync(srcDir)) {
        // Remove existing agent dir first to clear stale files.
        if (fs.existsSync(destDir)) {
          await fs.remove(destDir);
        }
        await fs.copy(srcDir, destDir, { overwrite: true });
        changes.push(`Refreshed agent: ${agentId}/SKILL.md`);
        if (verbose) console.log(`    Refreshed agent: ${agentId}/SKILL.md`);
      }
    }
  } else {
    changes.push('Skipped agent copy (dev environment — files already in place)');
    if (verbose) console.log('    Skipped agent copy (dev environment)');
  }

  // Remove deprecated agent files if still present (both pre-v4.0 flat-.md
  // and legacy v1.0.x agent names). Post-v4.0 migration, also clean up any
  // lingering flat <agentId>.md from a previous skill-dir migration boundary.
  const deprecatedAgents = ['empathy-mapper.md', 'wireframe-designer.md'];
  for (const file of deprecatedAgents) {
    const agentPath = path.join(agentsTarget, file);
    if (fs.existsSync(agentPath)) {
      await fs.remove(agentPath);
      changes.push(`Removed deprecated agent: ${file}`);
      if (verbose) console.log(`    Removed deprecated agent: ${file}`);
    }
  }
  // Story v63-3-1 cleanup + R1-H2 safety net: if any flat `<agentId>.md`
  // survives from a pre-4.0 install (e.g., operator upgrading from 3.3.0),
  // move it to `.backup-v4/` BEFORE removing — operator hand-edits deserve
  // preservation, not silent deletion. Respects feedback_path_safety.md
  // (explicit safety analysis required for destructive ops on user paths).
  // Skip in dev/isSameRoot mode so we don't accidentally wipe source backups.
  //
  // R2-H1: skip `vortexExcluded` agents — the copy loop at :61 already
  // skipped them, so the operator's opt-out flat file is legitimate state,
  // not stale. Removing it here would leave them with NO agent file
  // anywhere (not in skill-dir, not in agents root).
  //
  // R2-H5: backup dir lives at `_bmad/bme/_vortex/.backup-v4` (outside
  // `agentsTarget`). Placing it inside `agentsTarget` risked recursive
  // re-processing by directory walkers (workflow-copy, future doctor scans)
  // that treat `.backup-v4/<id>.md` as stale flat agents or copy them into
  // runtime wrappers.
  if (!isSameRoot) {
    const backupDir = path.join(targetVortex, '.backup-v4');
    let backedUpAny = false;
    for (const agentId of AGENT_IDS) {
      if (vortexExcluded.includes(agentId)) continue;
      const staleFlatPath = path.join(agentsTarget, `${agentId}.md`);
      if (fs.existsSync(staleFlatPath) && fs.statSync(staleFlatPath).isFile()) {
        if (!backedUpAny) {
          await fs.ensureDir(backupDir);
          backedUpAny = true;
        }
        const backupPath = path.join(backupDir, `${agentId}.md`);
        try {
          await fs.move(staleFlatPath, backupPath, { overwrite: true });
          changes.push(`Backed up pre-v4.0 flat agent file: ${agentId}.md → _vortex/.backup-v4/${agentId}.md`);
          if (verbose) {
            console.log(`    Backed up pre-v4.0 flat agent file: ${agentId}.md → _vortex/.backup-v4/${agentId}.md`);
          }
        } catch (_moveErr) {
          // If move fails (permissions, concurrent writer), fall back to
          // remove — better than blocking the migration, but log loudly.
          await fs.remove(staleFlatPath);
          changes.push(`Removed stale flat agent file (backup attempt failed): ${agentId}.md`);
          if (verbose) {
            console.log(`    WARNING: Removed stale flat agent file ${agentId}.md — backup attempt failed (${_moveErr.message})`);
          }
        }
      }
    }
    if (backedUpAny) {
      changes.push(`Note: pre-v4.0 agent file backups preserved under _vortex/.backup-v4/ — review and delete when confident migration is complete`);
      if (verbose) {
        console.log(`    Note: pre-v4.0 agent file backups preserved under _vortex/.backup-v4/`);
      }
    }
  }

  // 2. Copy workflow directories
  const workflowsSource = path.join(packageVortex, 'workflows');
  const workflowsTarget = path.join(targetVortex, 'workflows');
  await fs.ensureDir(workflowsTarget);

  if (!isSameRoot) {
    for (const wf of WORKFLOW_NAMES) {
      const src = path.join(workflowsSource, wf);
      const dest = path.join(workflowsTarget, wf);
      if (fs.existsSync(src)) {
        // Remove existing workflow directory first to clear stale files
        // (e.g., renamed step files from previous versions)
        if (fs.existsSync(dest)) {
          await fs.remove(dest);
        }
        await fs.copy(src, dest, { overwrite: true });
        changes.push(`Refreshed workflow: ${wf}`);
        if (verbose) console.log(`    Refreshed workflow: ${wf}`);
      }
    }
  } else {
    changes.push('Skipped workflow copy (dev environment — files already in place)');
    if (verbose) console.log('    Skipped workflow copy (dev environment)');
  }

  // 2b. Vortex reference assets (T88)
  //
  // Phases 1 and 2 copy `agents/` (respecting the U8 excluded_agents opt-out) and the
  // `workflows/` directories named in WORKFLOW_NAMES. `config.yaml` is merged at phase 3 and
  // per-agent guides are copied at phase 5. Nothing copied `contracts/`, so 16 files under
  // `workflows/` referenced `_bmad/bme/_vortex/contracts/hcN-*.md` — a path that existed only
  // inside the installed package, never in the operator's project.
  //
  // Mirrors the Gyre contracts block below, with one deliberate difference: this removes the
  // destination before copying. Phases 1, 2 and 2b1 all remove-then-copy so that files renamed
  // or deleted upstream do not survive in the operator tree. That matters more here than
  // elsewhere because the referring files cite schemas BY FILENAME — a superseded contract
  // left behind sits beside its replacement indefinitely.
  //
  // Scope is deliberately the two package-owned reference directories and nothing else. An
  // earlier draft copied every entry at the Vortex root; review rejected it on two grounds.
  // (1) It exceeded what was diagnosed: `README.md`, `module.yaml` and `module-help.csv` have
  // no shipped referent, and overwriting operator-editable files with no backup is a
  // regression the guides phase avoids via `backupGuides`. (2) Excluding the phase-owned
  // entries by name makes correctness depend on a denylist staying in sync with the phases
  // above — and drift there would wholesale-copy an exclusion-aware subtree, restoring agent
  // files an operator opted out of. Detecting the general class of "shipped document names a
  // path the installer never creates" is T89's job, not this phase's.
  const VORTEX_REFERENCE_DIRS = ['contracts', 'examples'];
  if (!isSameRoot) {
    for (const dir of VORTEX_REFERENCE_DIRS) {
      const src = path.join(packageVortex, dir);
      const dest = path.join(targetVortex, dir);
      if (!fs.existsSync(src)) {
        changes.push(`Vortex ${dir}/ not found in package — skipping`);
        if (verbose) console.log(`    ⚠ Vortex ${dir}/ not found in package — skipping`);
        continue;
      }
      if (fs.existsSync(dest)) await fs.remove(dest);
      await fs.copy(src, dest, { overwrite: true });
      changes.push(`Refreshed Vortex ${dir}`);
      if (verbose) console.log(`    Refreshed Vortex ${dir}`);
    }
  } else {
    changes.push('Skipped Vortex reference assets (dev environment — files already in place)');
    if (verbose) console.log('    Skipped Vortex reference assets (dev environment)');
  }

  // 2b1. Standalone bme submodule trees (e.g., _team-factory)
  // Each EXTRA_BME_AGENTS entry references a submodule directory under _bmad/bme/
  // that must be copied wholesale so the agent file, workflows, lib code, and config travel together.
  // Mirrors the workflow loop pattern (2-step remove-then-copy) so renamed/deleted files
  // in the package don't survive in the user install as stale leftovers.
  const copiedExtraSubmodules = new Set();
  if (!isSameRoot) {
    for (const agent of EXTRA_BME_AGENTS) {
      if (copiedExtraSubmodules.has(agent.submodule)) continue;
      copiedExtraSubmodules.add(agent.submodule);
      const srcDir = path.join(packageRoot, '_bmad', 'bme', agent.submodule);
      const destDir = path.join(projectRoot, '_bmad', 'bme', agent.submodule);
      if (fs.existsSync(srcDir)) {
        // Remove existing destination first to clear stale files
        // (e.g., renamed/deleted workflow steps from previous versions)
        if (fs.existsSync(destDir)) {
          await fs.remove(destDir);
        }
        await fs.copy(srcDir, destDir, { overwrite: true });
        // Stamp the submodule config version to match the package, exactly as the Enhance and
        // Artifacts blocks below do.
        //
        // Backlog I137. This was the ONLY module tree copied without its config being stamped —
        // Vortex and Gyre go through `mergeConfig`, Enhance and Artifacts set it directly, and
        // `_team-factory` did neither. The package ships `version: 1.0.0`, so a FRESH, SUCCESSFUL
        // install immediately failed Convoke's own health check:
        //
        //   ✗ Version consistency — Package: 4.0.0-rc.1, _team-factory: 1.0.0
        //     Fix: Run: npx -p convoke-agents convoke-update
        //
        // i.e. the first thing a new user was told after installing was to go and update.
        //
        // `doc.set` rather than `mergeConfig` is deliberate: mergeConfig's structural defaults are
        // Vortex-specific (`submodule_name: '_vortex'`, Vortex agents/workflows), so it would seed
        // the wrong values into any field a submodule config happens to omit.
        const destConfig = path.join(destDir, 'config.yaml');
        if (fs.existsSync(destConfig)) {
          assertVersion(version, `standalone:${agent.submodule}`);
          const scDoc = YAML.parseDocument(fs.readFileSync(destConfig, 'utf8'));
          if (scDoc.errors && scDoc.errors.length > 0) {
            throw new Error(
              `Refresh: cannot parse ${agent.submodule} config.yaml: ${scDoc.errors[0].message}`
            );
          }
          scDoc.set('version', version);
          fs.writeFileSync(destConfig, scDoc.toString({ lineWidth: 0 }), 'utf8');
        }
        changes.push(`Refreshed standalone bme submodule: ${agent.submodule} (config v${version})`);
        if (verbose) console.log(`    Refreshed standalone bme submodule: ${agent.submodule}`);
      }
    }
  } else {
    changes.push('Skipped standalone bme submodule copy (dev environment — files already in place)');
    if (verbose) console.log('    Skipped standalone bme submodule copy (dev environment)');
  }

  // 2a. Enhance module — read config, copy directory tree, patch target agent menu
  const packageEnhance = path.join(packageRoot, '_bmad', 'bme', '_enhance');
  const enhanceConfigPath = path.join(packageEnhance, 'config.yaml');

  let enhanceConfig = null;
  if (fs.existsSync(enhanceConfigPath)) {
    try {
      enhanceConfig = yaml.load(fs.readFileSync(enhanceConfigPath, 'utf8'));
    } catch (err) {
      const msg = `Enhance config.yaml parse error: ${err.message} — skipping Enhance installation`;
      changes.push(msg);
      if (verbose) console.log(`    ⚠ ${msg}`);
    }
  } else {
    changes.push('Enhance config.yaml not found — skipping Enhance installation');
    if (verbose) console.log('    ⚠ Enhance config.yaml not found — skipping Enhance installation');
  }

  if (enhanceConfig) {
    // 2b. Copy _enhance/ directory tree
    const targetEnhance = path.join(projectRoot, '_bmad', 'bme', '_enhance');

    if (!isSameRoot) {
      await fs.copy(packageEnhance, targetEnhance, { overwrite: true });
      // Stamp enhance config version to match package version (ag-7-1: I30 + I29).
      // Uses comment-preserving YAML.parseDocument so the doc comments survive.
      const targetEnhanceConfig = path.join(targetEnhance, 'config.yaml');
      if (fs.existsSync(targetEnhanceConfig)) {
        assertVersion(version, 'enhance');
        const ecDoc = YAML.parseDocument(fs.readFileSync(targetEnhanceConfig, 'utf8'));
        if (ecDoc.errors && ecDoc.errors.length > 0) {
          throw new Error(`Refresh: cannot parse Enhance config.yaml: ${ecDoc.errors[0].message}`);
        }
        ecDoc.set('version', version);
        fs.writeFileSync(targetEnhanceConfig, ecDoc.toString({ lineWidth: 0 }), 'utf8');
      }
      changes.push('Refreshed Enhance module: _bmad/bme/_enhance/');
      if (verbose) console.log('    Refreshed Enhance module: _bmad/bme/_enhance/');
    } else {
      changes.push('Skipped Enhance copy (dev environment — files already in place)');
      if (verbose) console.log('    Skipped Enhance copy (dev environment)');
    }

    // 2c. Patch target agent menu for each registered workflow
    if (isSameRoot) {
      changes.push('Skipped Enhance menu patch (dev environment — source files unchanged)');
      if (verbose) console.log('    Skipped Enhance menu patch (dev environment)');
    }

    for (const workflow of (isSameRoot ? [] : enhanceConfig.workflows || [])) {
      const targetAgentRel = workflow.target_agent;
      const targetAgentPath = path.join(projectRoot, '_bmad', targetAgentRel);

      if (!fs.existsSync(targetAgentPath)) {
        const msg = `${targetAgentRel} not found — BMM module must be installed first. Skipping Enhance menu patch.`;
        changes.push(msg);
        if (verbose) console.log(`    ⚠ ${msg}`);
        continue;
      }

      let agentContent = fs.readFileSync(targetAgentPath, 'utf8');
      const patchName = workflow.menu_patch_name || workflow.name;

      // Idempotency: skip if patch already present
      if (agentContent.includes(patchName)) {
        changes.push(`Enhance menu patch already present in ${targetAgentRel} — skipping`);
        if (verbose) console.log(`    Enhance menu patch already present in ${targetAgentRel} — skipping`);
        continue;
      }

      // Build the <item> tag
      const entryPath = `{project-root}/_bmad/bme/_enhance/${workflow.entry}`;
      const itemTag = `    <item cmd="IB or fuzzy match on ${patchName}" exec="${entryPath}">[IB] 📦 Initiatives Backlog (Convoke Enhance)</item>`;

      // Find insertion anchor: prefer </menu>, fallback to last <item>
      const menuCloseIdx = agentContent.lastIndexOf('</menu>');
      if (menuCloseIdx !== -1) {
        // Insert before the </menu> line (not at the </menu> character position,
        // which would prepend existing line indentation to the inserted tag)
        const lineStart = agentContent.lastIndexOf('\n', menuCloseIdx - 1) + 1;
        agentContent = agentContent.slice(0, lineStart) + itemTag + '\n' + agentContent.slice(lineStart);
      } else {
        // Fallback: insert after last <item>...</item> line
        const lastItemMatch = agentContent.match(/.*<item[^]*?<\/item>/g);
        if (lastItemMatch) {
          const lastItem = lastItemMatch[lastItemMatch.length - 1];
          const lastItemIdx = agentContent.lastIndexOf(lastItem);
          const insertIdx = lastItemIdx + lastItem.length;
          agentContent = agentContent.slice(0, insertIdx) + '\n' + itemTag + agentContent.slice(insertIdx);
        } else {
          const msg = `${targetAgentRel} menu structure not recognized — manual patch required. Skipping Enhance menu patch.`;
          changes.push(msg);
          if (verbose) console.log(`    ⚠ ${msg}`);
          continue;
        }
      }

      fs.writeFileSync(targetAgentPath, agentContent, 'utf8');
      changes.push(`Patched ${targetAgentRel} with Enhance menu item: ${patchName}`);
      if (verbose) console.log(`    Patched ${targetAgentRel} with Enhance menu item: ${patchName}`);
    }
  }

  // 2c. Artifacts module — read config, copy directory tree, generate skill wrappers
  // Workflow-only submodule (no agents). Workflows are STANDALONE: each gets a Claude Code
  // skill wrapper but NO menu patch. The `standalone: true` flag in the workflow entry is
  // the discriminator — workflows without it are NOT supported in this module today (Story 6.6).
  const packageArtifacts = path.join(packageRoot, '_bmad', 'bme', '_artifacts');
  const artifactsConfigPath = path.join(packageArtifacts, 'config.yaml');

  let artifactsConfig = null;
  if (fs.existsSync(artifactsConfigPath)) {
    try {
      artifactsConfig = yaml.load(fs.readFileSync(artifactsConfigPath, 'utf8'));
    } catch (err) {
      const msg = `Artifacts config.yaml parse error: ${err.message} — skipping Artifacts installation`;
      changes.push(msg);
      if (verbose) console.log(`    ⚠ ${msg}`);
    }
  } else {
    changes.push('Artifacts config.yaml not found — skipping Artifacts installation');
    if (verbose) console.log('    ⚠ Artifacts config.yaml not found — skipping Artifacts installation');
  }

  if (artifactsConfig) {
    // Copy _artifacts/ directory tree
    const targetArtifacts = path.join(projectRoot, '_bmad', 'bme', '_artifacts');

    if (!isSameRoot) {
      // Remove existing destination first to clear stale files
      if (fs.existsSync(targetArtifacts)) {
        await fs.remove(targetArtifacts);
      }
      await fs.copy(packageArtifacts, targetArtifacts, { overwrite: true });
      // Stamp artifacts config version to match package version (ag-7-1: I30 + I29).
      // Uses comment-preserving YAML.parseDocument so the standalone:true doc comments survive.
      const targetArtifactsConfig = path.join(targetArtifacts, 'config.yaml');
      if (fs.existsSync(targetArtifactsConfig)) {
        assertVersion(version, 'artifacts');
        const acDoc = YAML.parseDocument(fs.readFileSync(targetArtifactsConfig, 'utf8'));
        if (acDoc.errors && acDoc.errors.length > 0) {
          throw new Error(`Refresh: cannot parse Artifacts config.yaml: ${acDoc.errors[0].message}`);
        }
        acDoc.set('version', version);
        fs.writeFileSync(targetArtifactsConfig, acDoc.toString({ lineWidth: 0 }), 'utf8');
      }
      changes.push('Refreshed Artifacts module: _bmad/bme/_artifacts/');
      if (verbose) console.log('    Refreshed Artifacts module: _bmad/bme/_artifacts/');
    } else {
      changes.push('Skipped Artifacts copy (dev environment — files already in place)');
      if (verbose) console.log('    Skipped Artifacts copy (dev environment)');
    }

    // Skill wrapper generation for each workflow happens later in section 6d,
    // after skillsDir is defined (mirrors Enhance pattern: config/copy here, skill
    // wrappers in section 6c after agent skills are generated).
  }

  // 2d. Gyre module — copy agents, workflows, contracts, config
  const packageGyre = path.join(packageRoot, '_bmad', 'bme', '_gyre');
  const targetGyre = path.join(projectRoot, '_bmad', 'bme', '_gyre');

  if (fs.existsSync(packageGyre)) {
    // Copy Gyre agents
    const gyreAgentsSource = path.join(packageGyre, 'agents');
    const gyreAgentsTarget = path.join(targetGyre, 'agents');
    await fs.ensureDir(gyreAgentsTarget);

    if (!isSameRoot) {
      for (const file of GYRE_AGENT_FILES) {
        const agentId = file.replace(/\.md$/, '');
        if (gyreExcluded.includes(agentId)) {
          changes.push(`Skipped excluded Gyre agent: ${file}`);
          if (verbose) console.log(`    Skipped excluded Gyre agent: ${file}`);
          continue;
        }
        const src = path.join(gyreAgentsSource, file);
        if (fs.existsSync(src)) {
          await fs.copy(src, path.join(gyreAgentsTarget, file), { overwrite: true });
          changes.push(`Refreshed Gyre agent: ${file}`);
          if (verbose) console.log(`    Refreshed Gyre agent: ${file}`);
        }
      }
    } else {
      changes.push('Skipped Gyre agent copy (dev environment)');
      if (verbose) console.log('    Skipped Gyre agent copy (dev environment)');
    }

    // Copy Gyre workflows
    const gyreWorkflowsSource = path.join(packageGyre, 'workflows');
    const gyreWorkflowsTarget = path.join(targetGyre, 'workflows');
    await fs.ensureDir(gyreWorkflowsTarget);

    if (!isSameRoot) {
      for (const wf of GYRE_WORKFLOW_NAMES) {
        const src = path.join(gyreWorkflowsSource, wf);
        const dest = path.join(gyreWorkflowsTarget, wf);
        if (fs.existsSync(src)) {
          if (fs.existsSync(dest)) {
            await fs.remove(dest);
          }
          await fs.copy(src, dest, { overwrite: true });
          changes.push(`Refreshed Gyre workflow: ${wf}`);
          if (verbose) console.log(`    Refreshed Gyre workflow: ${wf}`);
        }
      }
    } else {
      changes.push('Skipped Gyre workflow copy (dev environment)');
      if (verbose) console.log('    Skipped Gyre workflow copy (dev environment)');
    }

    // Copy Gyre contracts
    const gyreContractsSource = path.join(packageGyre, 'contracts');
    const gyreContractsTarget = path.join(targetGyre, 'contracts');
    if (fs.existsSync(gyreContractsSource)) {
      await fs.ensureDir(gyreContractsTarget);
      if (!isSameRoot) {
        await fs.copy(gyreContractsSource, gyreContractsTarget, { overwrite: true });
        changes.push('Refreshed Gyre contracts');
        if (verbose) console.log('    Refreshed Gyre contracts');
      }
    }

    // Copy Gyre config.yaml
    const gyreConfigSource = path.join(packageGyre, 'config.yaml');
    const gyreConfigTarget = path.join(targetGyre, 'config.yaml');
    if (!isSameRoot && fs.existsSync(gyreConfigSource)) {
      // Merge Gyre config preserving user prefs, same as Vortex
      const gyreUpdates = {
        agents: GYRE_AGENT_IDS,
        workflows: GYRE_WORKFLOW_NAMES
      };
      assertVersion(version, 'config-merger:gyre'); // ag-7-1: defense-in-depth before mergeConfig
      const gyreConfigMerged = await configMerger.mergeConfig(gyreConfigTarget, version, gyreUpdates);
      await configMerger.writeConfig(gyreConfigTarget, gyreConfigMerged);
      changes.push(`Updated Gyre config.yaml to v${version}`);
      if (verbose) console.log(`    Updated Gyre config.yaml to v${version}`);
    }

    // Copy Gyre README
    const gyreReadmeSource = path.join(packageGyre, 'README.md');
    const gyreReadmeTarget = path.join(targetGyre, 'README.md');
    if (!isSameRoot && fs.existsSync(gyreReadmeSource)) {
      await fs.copy(gyreReadmeSource, gyreReadmeTarget, { overwrite: true });
      changes.push('Refreshed Gyre README.md');
      if (verbose) console.log('    Refreshed Gyre README.md');
    }
  }

  // 2e. Seed skill-manifest.csv if the project has none.
  //
  // Backlog I139. `convoke-export` is a shipped bin that reads every skill's content from the
  // `path` column of `_bmad/_config/skill-manifest.csv`. That file was never created by an
  // install and `_bmad/_config/` was not in package.json `files`, so on a clean install the bin
  // failed outright:
  //
  //   ❌ bmad-brainstorming — ENOENT: ... <project>/_bmad/_config/skill-manifest.csv
  //
  // Every export by every new user failed. `convoke-doctor` only ever reported it as a ⚠ and
  // still exited 0, and `--help` succeeded, so both the health check and a launch smoke called
  // the product healthy — it took invoking real work to see it.
  //
  // WHY FILTERED, NOT COPIED VERBATIM. The package's manifest is a CANDIDATE list of 106 rows,
  // but only 19 point at content Convoke actually ships (`_bmad/bme/**`); the other 87 point at
  // upstream BMAD modules (bmm, core, wds, tea, cis, bmb) that the user gets from BMAD itself,
  // if they have it. Shipping all 106 verbatim would hand every user a manifest where most rows
  // resolve to nothing — the exact trap backlog I123 documents, where 75 of 106 paths failed to
  // resolve even inside this repo. Filtering on "does this path exist in the user's project"
  // is ground truth: it keeps the Convoke rows always, and upstream rows exactly when the user
  // has that content installed.
  //
  // Only ever seeds when ABSENT. An existing manifest is user state — it may carry rows they
  // added — and is left untouched; the Enhance/Artifacts registration blocks below append to it.
  const skillManifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  // Seed when the manifest is ABSENT **or UNUSABLE**, not merely absent.
  //
  // Code review 2026-08-14 asked whether "absent" was the right trigger. It was not, and the
  // failure is worse than being stuck: `fs.existsSync` is true for a 0-byte file, so an empty or
  // truncated manifest was never reseeded — and section 6c below then APPENDS the Enhance row to
  // it. `readManifest` treats line 0 as the header, so that appended data row became the header:
  // garbage columns, zero rows, and `convoke-export` throwing "not in the manifest" forever.
  // Verified by execution before this guard was widened.
  //
  // Usable means: parses, and has the `path` column the exporter reads. A manifest that parses
  // with a valid header is USER STATE and is never overwritten, however few rows it has.
  let manifestUsable = false;
  if (fs.existsSync(skillManifestPath)) {
    try {
      const { readManifest } = require('../../portability/manifest-csv');
      const existing = readManifest(skillManifestPath);
      manifestUsable = Array.isArray(existing.header) && existing.header.includes('path');
    } catch {
      manifestUsable = false; // unparseable — treat as unusable and reseed
    }
    if (!manifestUsable) {
      const salvage = `${skillManifestPath}.corrupt-${version}`;
      try {
        // Never delete user data silently, even when it is unusable (path-safety rule).
        fs.renameSync(skillManifestPath, salvage);
        changes.push(`Unusable skill-manifest.csv set aside as ${path.basename(salvage)}`);
        if (verbose) console.log(`    Unusable skill-manifest.csv → ${path.basename(salvage)}`);
      } catch (err) {
        console.warn(`    Warning: could not set aside unusable skill-manifest.csv: ${err.message}`);
      }
    }
  }
  if (!manifestUsable) {
    const packageManifest = path.join(packageRoot, '_bmad', '_config', 'skill-manifest.csv');
    if (fs.existsSync(packageManifest)) {
      try {
        const { parseCsvRow, readManifest } = require('../../portability/manifest-csv');
        const { header } = readManifest(packageManifest);
        const pathIdx = header.indexOf('path');
        if (pathIdx < 0) throw new Error('package skill-manifest.csv has no `path` column');

        // Filter the package manifest's RAW LINES rather than re-serialising parsed rows.
        //
        // `writeManifest` -> `formatCsvField` only quotes a field when it contains a comma, quote
        // or newline, so re-serialising emitted bare `bmad-enhance-initiatives-backlog` where the
        // source file has `"bmad-enhance-initiatives-backlog"`. Section 6c below decides whether
        // to append that row with `skCsv.includes('"' + canonicalId + '"')` — a QUOTED substring
        // match — which then missed the seeded row and appended a DUPLICATE. Caught by inspecting
        // a seeded manifest, not by any test.
        //
        // Keeping the original lines byte-for-byte sidesteps it and preserves the file's existing
        // quoting convention. (The substring-based dedup in 6c is fragile in its own right; that
        // is pre-existing and left alone here.)
        const rawLines = fs.readFileSync(packageManifest, 'utf8').split('\n');
        const headerLine = rawLines[0];
        const dataLines = rawLines.slice(1).filter((l) => l.trim());
        const projectRootResolved = path.resolve(projectRoot);
        const kept = dataLines.filter((line) => {
          const cells = parseCsvRow(line);
          const rel = cells[pathIdx];
          if (!rel) return false;
          // Containment check before the existence check. `path.join` does NOT neutralise `..`,
          // so a row with `../../etc/passwd` would resolve outside the project — and
          // `export-engine.loadSkillSource` reads whatever `path` names straight into an exported
          // bundle the user may share. Input is Convoke's own manifest today, so this is defence
          // in depth rather than a live hole (code review 2026-08-14, LOW), but it is one line.
          const abs = path.resolve(projectRootResolved, rel);
          if (abs !== projectRootResolved && !abs.startsWith(projectRootResolved + path.sep)) {
            return false;
          }
          // `isFile`, not `existsSync`: a directory satisfies existsSync but makes the exporter
          // throw EISDIR later.
          try {
            return fs.statSync(abs).isFile();
          } catch {
            return false;
          }
        });
        await fs.ensureDir(path.dirname(skillManifestPath));
        fs.writeFileSync(skillManifestPath, [headerLine, ...kept].join('\n') + '\n', 'utf8');
        changes.push(
          `Created _bmad/_config/skill-manifest.csv (${kept.length} of ${dataLines.length} skills — rows whose content is present)`
        );
        if (verbose) {
          console.log(`    Created skill-manifest.csv (${kept.length}/${dataLines.length} skills present)`);
        }
      } catch (err) {
        // Non-fatal: a failure here costs `convoke-export`, not the install. Not pushed into
        // `changes` — convoke-update renders that array as green ticks.
        console.warn(`    Warning: could not seed skill-manifest.csv: ${err.message}`);
      }
    }
  }

  // 3. Update config.yaml (merge, preserving user prefs)
  //
  // T50: guarded by `!isSameRoot`, like every other module config write in this file
  // (Gyre, Enhance, Artifacts, standalone submodules). Vortex was the ONLY unguarded one,
  // so in a dev tree — where packageRoot === projectRoot — a refresh rewrote the repo's own
  // shipped `_bmad/bme/_vortex/config.yaml`.
  //
  // That is how the test suite dirtied a tracked file on every run. FIVE call sites pass
  // PACKAGE_ROOT deliberately, to exercise the dev-environment skip branches, and this write sat
  // outside those branches:
  //   tests/unit/refresh-installation-enhance.test.js:76, :232, :302
  //   tests/unit/refresh-installation-artifacts.test.js:74, :178
  // The stamped value was then committed release after release under bare "Update config.yaml"
  // commits — at least 3.2.0, 3.2.1, 3.3.0, 4.0.0-rc.1, 4.0.0-rc.2, 4.0.0-rc.5 and 4.0.0 (the
  // list is what `git log -L` surfaces for the version line; earlier releases may also qualify).
  // That history made the field look like it tracked the package version by design rather than
  // by accident.
  //
  // A REAL installation is unaffected (projectRoot !== packageRoot): the stamp still runs and
  // convoke-doctor's Version-consistency check still passes on the user's tree. A dev tree
  // reports that check as failing either way — _gyre, _enhance, _artifacts and _team-factory
  // all sit at template 1.0.0 there, by construction.
  if (!isSameRoot) {
    const configPath = path.join(targetVortex, 'config.yaml');
    await fs.ensureDir(path.dirname(configPath));

    const updates = {
      agents: AGENT_IDS,
      workflows: WORKFLOW_NAMES
    };

    assertVersion(version, 'config-merger:vortex'); // ag-7-1: defense-in-depth before mergeConfig
    const merged = await configMerger.mergeConfig(configPath, version, updates);
    await configMerger.writeConfig(configPath, merged);
    changes.push(`Updated config.yaml to v${version}`);
    if (verbose) console.log(`    Updated config.yaml to v${version}`);
  } else {
    changes.push('Skipped Vortex config stamp (dev environment — source is the installation)');
    if (verbose) console.log('    Skipped Vortex config stamp (dev environment)');
  }

  // 4. Regenerate agent manifest — replace only bme rows, preserve other modules.
  // Story gen-1.1: lifted verbatim into scripts/lib/agent-manifest-generator.js so
  // generation has a deliberate caller (`npm run generate:manifest`) instead of
  // firing as a side effect of every refreshInstallation() the test suite makes.
  // `excluded` is passed rather than re-read — both lists were already read at
  // :47-50 for the copy loops.
  // The write is guarded on `!isSameRoot` for the same reason every other write in
  // this function is: when source and destination are the same tree, refreshing is
  // rewriting our own tracked source. Six live callers pass PACKAGE_ROOT from the
  // test suite, so before this guard `npm test` rewrote agent-manifest.csv. The
  // regeneration a dev tree still needs comes from `npm run generate:manifest`
  // (scripts/generate-manifest.js) — guard and command ship together by design;
  // the guard alone would leave a checkout unable to rebuild the file.
  if (!isSameRoot) {
    changes.push(
      await generateAgentManifest(projectRoot, {
        excluded: { vortex: vortexExcluded, gyre: gyreExcluded },
      })
    );
    if (verbose) console.log(`    ${MANIFEST_CHANGE_MESSAGE}`);
  } else {
    changes.push(MANIFEST_SKIP_MESSAGE);
    if (verbose) console.log(`    ${MANIFEST_SKIP_MESSAGE}`);
  }

  // 5. Copy user guides (with optional backup)
  const guidesSource = path.join(packageRoot, '_bmad', 'bme', '_vortex', 'guides');
  const guidesTarget = path.join(projectRoot, '_bmad', 'bme', '_vortex', 'guides');
  await fs.ensureDir(guidesTarget);

  if (!isSameRoot) {
    // U8: user guides are named after each agent (e.g., NOAH-USER-GUIDE.md). Iterate
    // AGENTS so we can match guides to agent IDs and skip excluded ones — a guide
    // without its agent is dead docs.
    for (const agent of AGENTS) {
      const guide = `${agent.name.toUpperCase()}-USER-GUIDE.md`;
      if (vortexExcluded.includes(agent.id)) {
        changes.push(`Skipped excluded guide: ${guide}`);
        if (verbose) console.log(`    Skipped excluded guide: ${guide}`);
        continue;
      }
      const src = path.join(guidesSource, guide);
      const dest = path.join(guidesTarget, guide);

      if (fs.existsSync(src)) {
        // Backup existing guide before overwriting
        if (backupGuides && fs.existsSync(dest)) {
          await fs.copy(dest, dest + '.bak', { overwrite: true });
          changes.push(`Backed up ${guide} → ${guide}.bak`);
          if (verbose) console.log(`    Backed up ${guide} → ${guide}.bak`);
        }

        await fs.copy(src, dest, { overwrite: true });
        changes.push(`Refreshed guide: ${guide}`);
        if (verbose) console.log(`    Refreshed guide: ${guide}`);
      }
    }
  } else {
    changes.push('Skipped guide copy (dev environment — files already in place)');
    if (verbose) console.log('    Skipped guide copy (dev environment)');
  }

  // 6. Clean up legacy .claude/commands/ and generate .claude/skills/ for each agent
  const commandsDir = path.join(projectRoot, '.claude', 'commands');
  if (fs.existsSync(commandsDir)) {
    const legacyCommands = (await fs.readdir(commandsDir)).filter(f => f.startsWith('bmad-agent-bme-'));
    for (const file of legacyCommands) {
      await fs.remove(path.join(commandsDir, file));
      changes.push(`Removed legacy command: ${file}`);
      if (verbose) console.log(`    Removed legacy command: ${file}`);
    }
  }

  const skillsDir = path.join(projectRoot, '.claude', 'skills');

  // Remove stale skill directories (agents no longer in registry OR excluded by operator).
  // U8: excluded agents are intentionally omitted from the valid set so the stale-removal
  // loop below deletes their wrappers on the next refresh. Re-inclusion (removing from
  // excluded_agents) regenerates the wrapper here.
  const currentSkillDirs = new Set([
    ...AGENTS.filter(a => !vortexExcluded.includes(a.id)).map(a => `bmad-agent-bme-${a.id}`),
    ...GYRE_AGENTS.filter(a => !gyreExcluded.includes(a.id)).map(a => `bmad-agent-bme-${a.id}`),
    ...EXTRA_BME_AGENTS.map(a => `bmad-agent-bme-${a.id}`),
  ]);
  if (fs.existsSync(skillsDir)) {
    const existingSkills = (await fs.readdir(skillsDir)).filter(d => d.startsWith('bmad-agent-bme-'));
    for (const dir of existingSkills) {
      if (!currentSkillDirs.has(dir)) {
        await fs.remove(path.join(skillsDir, dir));
        changes.push(`Removed stale skill: ${dir}`);
        if (verbose) console.log(`    Removed stale skill: ${dir}`);
      }
    }
  }

  for (const agent of AGENTS) {
    if (vortexExcluded.includes(agent.id)) continue;
    const skillDir = path.join(skillsDir, `bmad-agent-bme-${agent.id}`);
    await fs.ensureDir(skillDir);
    // Story v63-3-1 / AC9: LOAD path points at the migrated skill-dir
    // (`<id>/SKILL.md`), NOT the pre-4.0 flat `<id>.md`. This is the
    // critical runtime contract for existing operators upgrading from 3.x.
    const content = `---
name: bmad-agent-bme-${agent.id}
description: ${agent.id} agent
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bme/_vortex/agents/${agent.id}/SKILL.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. FOLLOW the activation steps precisely
4. DISPLAY the welcome/greeting as instructed
5. PRESENT the numbered menu
6. WAIT for user input before proceeding
</agent-activation>
`;
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf8');
    changes.push(`Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
    if (verbose) console.log(`    Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
  }

  // 6b. Generate .claude/skills/ for Gyre agents
  for (const agent of GYRE_AGENTS) {
    if (gyreExcluded.includes(agent.id)) continue;
    const skillDir = path.join(skillsDir, `bmad-agent-bme-${agent.id}`);
    await fs.ensureDir(skillDir);
    const content = `---
name: bmad-agent-bme-${agent.id}
description: ${agent.id} agent
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bme/_gyre/agents/${agent.id}.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. FOLLOW the activation steps precisely
4. DISPLAY the welcome/greeting as instructed
5. PRESENT the numbered menu
6. WAIT for user input before proceeding
</agent-activation>
`;
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf8');
    changes.push(`Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
    if (verbose) console.log(`    Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
  }

  // 6b1. Generate .claude/skills/ for standalone bme agents (e.g., team-factory)
  for (const agent of EXTRA_BME_AGENTS) {
    const skillDir = path.join(skillsDir, `bmad-agent-bme-${agent.id}`);
    await fs.ensureDir(skillDir);
    const content = `---
name: bmad-agent-bme-${agent.id}
description: ${agent.id} agent
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bme/${agent.submodule}/agents/${agent.id}.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. FOLLOW the activation steps precisely
4. DISPLAY the welcome/greeting as instructed
5. PRESENT the numbered menu
6. WAIT for user input before proceeding
</agent-activation>
`;
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf8');
    changes.push(`Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
    if (verbose) console.log(`    Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
  }

  // 6c. Copy Enhance workflow skill wrappers and register in manifests
  if (enhanceConfig && !isSameRoot) {
    for (const workflow of enhanceConfig.workflows || []) {
      const canonicalId = `bmad-enhance-${workflow.name}`;
      const skillDir = path.join(skillsDir, canonicalId);
      await fs.ensureDir(skillDir);

      // Copy source SKILL.md from package (shipped via npm, not generated)
      const sourceSkillPath = path.join(packageRoot, '_bmad', 'bme', '_enhance', 'workflows', workflow.name, 'SKILL.md');
      const targetSkillPath = path.join(skillDir, 'SKILL.md');
      await fs.copy(sourceSkillPath, targetSkillPath, { overwrite: true });
      changes.push(`Refreshed Enhance skill: ${canonicalId}/SKILL.md`);
      if (verbose) console.log(`    Refreshed Enhance skill: ${canonicalId}/SKILL.md`);

      // Append to workflow-manifest.csv if not already present
      const wfManifestPath = path.join(projectRoot, '_bmad', '_config', 'workflow-manifest.csv');
      if (fs.existsSync(wfManifestPath)) {
        const wfCsv = fs.readFileSync(wfManifestPath, 'utf8');
        if (!wfCsv.includes(`"${canonicalId}"`)) {
          const wfRow = `\n"${workflow.name}","Manage RICE initiatives backlog — triage review findings, rescore existing items, or bootstrap new backlogs.","bme","_bmad/bme/_enhance/${workflow.entry}","${canonicalId}"`;
          fs.appendFileSync(wfManifestPath, wfRow, 'utf8');
          changes.push(`Added ${canonicalId} to workflow-manifest.csv`);
          if (verbose) console.log(`    Added ${canonicalId} to workflow-manifest.csv`);
        }
      } else {
        if (verbose) console.log('    ⚠ workflow-manifest.csv not found — skipping manifest registration');
      }

      // Append to skill-manifest.csv if not already present
      const skManifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
      if (fs.existsSync(skManifestPath)) {
        const skCsv = fs.readFileSync(skManifestPath, 'utf8');
        if (!skCsv.includes(`"${canonicalId}"`)) {
          const skRow = `\n"${canonicalId}","${canonicalId}","Manage RICE initiatives backlog — triage review findings, rescore existing items, or bootstrap new backlogs.","bme","_bmad/bme/_enhance/workflows/${workflow.name}/SKILL.md","true",,,`;
          fs.appendFileSync(skManifestPath, skRow, 'utf8');
          changes.push(`Added ${canonicalId} to skill-manifest.csv`);
          if (verbose) console.log(`    Added ${canonicalId} to skill-manifest.csv`);
        }
      } else {
        if (verbose) console.log('    ⚠ skill-manifest.csv not found — skipping manifest registration');
      }
    }
  } else if (enhanceConfig && isSameRoot) {
    changes.push('Skipped Enhance skill registration (dev environment — source files unchanged)');
    if (verbose) console.log('    Skipped Enhance skill registration (dev environment)');
  }

  // 6d. Copy Artifacts workflow skill wrappers (Story 6.6)
  // Each standalone:true workflow gets a skill wrapper at .claude/skills/{workflow.name}/SKILL.md.
  // workflow.name already carries the bmad- prefix, so we use it verbatim (unlike Enhance which
  // synthesizes bmad-enhance-${workflow.name}). The remove-then-copy pattern clears any leftover
  // files from prior installs (e.g., the obsolete bmad-portfolio-status/workflow.md thin wrapper).
  if (artifactsConfig && !isSameRoot) {
    for (const workflow of artifactsConfig.workflows || []) {
      if (workflow.standalone !== true) {
        const msg = `Artifacts: workflow ${workflow.name} has no standalone:true flag — only standalone workflows are supported, skipping`;
        changes.push(msg);
        if (verbose) console.log(`    ⚠ ${msg}`);
        continue;
      }

      const destSkillDir = path.join(skillsDir, workflow.name);

      // Remove the destination directory first to clear leftover files from prior installs
      if (fs.existsSync(destSkillDir)) {
        await fs.remove(destSkillDir);
      }
      await fs.ensureDir(destSkillDir);

      // Copy source SKILL.md from the package (the SKILL.md uses an absolute {project-root}
      // path to load workflow.md, so workflow.md does NOT need to be co-located).
      const sourceSkillPath = path.join(packageRoot, '_bmad', 'bme', '_artifacts', 'workflows', workflow.name, 'SKILL.md');
      const targetSkillPath = path.join(destSkillDir, 'SKILL.md');
      if (fs.existsSync(sourceSkillPath)) {
        await fs.copy(sourceSkillPath, targetSkillPath, { overwrite: true });
        changes.push(`Generated skill wrapper: ${workflow.name}`);
        if (verbose) console.log(`    Generated skill wrapper: ${workflow.name}`);
      } else {
        const msg = `Artifacts: source SKILL.md not found for ${workflow.name} at ${sourceSkillPath}`;
        changes.push(msg);
        if (verbose) console.log(`    ⚠ ${msg}`);
      }
    }
  } else if (artifactsConfig && isSameRoot) {
    changes.push('Skipped Artifacts skill wrapper generation (dev environment — source files unchanged)');
    if (verbose) console.log('    Skipped Artifacts skill wrapper generation (dev environment)');
  }

  // 6e. Orphan workflow-wrapper cleanup (Story 7.4, I32)
  // Removes stale .claude/skills/ directories for workflow wrappers that are no longer
  // declared in the module configs. Uses a two-strategy matching approach:
  //   Strategy 1 (Enhance): any bmad-enhance-* dir not in the current union → orphan
  //   Strategy 2 (Artifacts): any dir whose name exactly matches a known Artifacts
  //     workflow name but is not in the current union → orphan
  // All other directories (agent wrappers, upstream BMAD skills, third-party) are ignored.
  if (!isSameRoot) {
    const currentWorkflowWrappers = new Set();
    // Enhance wrappers: bmad-enhance-${workflow.name}
    if (enhanceConfig && Array.isArray(enhanceConfig.workflows)) {
      for (const wf of enhanceConfig.workflows) {
        if (wf && wf.name) currentWorkflowWrappers.add(`bmad-enhance-${wf.name}`);
      }
    }
    // Artifacts wrappers: workflow.name verbatim (only standalone:true are installed,
    // but we track ALL names so a removed standalone workflow is still recognized as an orphan)
    const knownArtifactsNames = new Set();
    if (artifactsConfig && Array.isArray(artifactsConfig.workflows)) {
      for (const wf of artifactsConfig.workflows) {
        if (wf && wf.name) {
          knownArtifactsNames.add(wf.name);
          if (wf.standalone === true) currentWorkflowWrappers.add(wf.name);
        }
      }
    }
    const orphanChanges = cleanupOrphanWorkflowWrappers(skillsDir, currentWorkflowWrappers, knownArtifactsNames, { verbose });
    changes.push(...orphanChanges);
  } else {
    changes.push('Skipped orphan workflow-wrapper cleanup (dev environment)');
    if (verbose) console.log('    Skipped orphan workflow-wrapper cleanup (dev environment)');
  }

  // 7. Generate agent customize files (only if they don't already exist)
  const customizeDir = path.join(projectRoot, '_bmad', '_config', 'agents');
  await fs.ensureDir(customizeDir);

  const CUSTOMIZE_TEMPLATE = `# Agent Customization
# Customize any section below - all are optional

# Override agent name
agent:
  metadata:
    name: ""

# Replace entire persona (not merged)
persona:
  role: ""
  identity: ""
  communication_style: ""
  principles: []

# Add custom critical actions (appended after standard config loading)
critical_actions: []

# Add persistent memories for the agent
memories: []

# Add custom menu items (appended to base menu)
menu: []

# Add custom prompts (for action="#id" handlers)
prompts: []
`;

  for (const agent of [...AGENTS, ...GYRE_AGENTS]) {
    const filename = `bme-${agent.name.toLowerCase()}.customize.yaml`;
    const filePath = path.join(customizeDir, filename);
    if (!fs.existsSync(filePath)) {
      await fs.writeFile(filePath, CUSTOMIZE_TEMPLATE, 'utf8');
      changes.push(`Created customize file: ${filename}`);
      if (verbose) console.log(`    Created customize file: ${filename}`);
    }
  }

  // Seed / merge the artifact-governance taxonomy.
  //
  // Backlog I137. `mergeTaxonomy` was reachable ONLY from the 2.0.x->3.1.0 and 3.0.x->3.1.0
  // migrations. A fresh install runs no migrations, so `_bmad/_config/taxonomy.yaml` was never
  // created and a clean install failed its own health check:
  //
  //   ✗ Taxonomy: file exists — taxonomy.yaml not found at _bmad/_config/taxonomy.yaml
  //     Fix: Run convoke-migrate-artifacts or convoke-update to create it
  //
  // Taxonomy creation lived on the UPGRADE path but not the INSTALL path. Calling it here covers
  // both: it is idempotent by construction — creates from platform defaults when absent, and
  // otherwise merges while preserving the operator-managed `initiatives.user` list.
  try {
    const { mergeTaxonomy } = require('./taxonomy-merger');
    const taxonomyResult = await mergeTaxonomy(projectRoot);
    if (taxonomyResult.created) {
      changes.push('Created _bmad/_config/taxonomy.yaml (platform defaults)');
      if (verbose) console.log('    Created _bmad/_config/taxonomy.yaml');
    } else if (taxonomyResult.merged) {
      changes.push('Merged platform defaults into _bmad/_config/taxonomy.yaml');
      if (verbose) console.log('    Merged _bmad/_config/taxonomy.yaml');
    }
  } catch (err) {
    // Non-fatal: a broken taxonomy must not abort an otherwise-good install. `convoke-doctor`
    // reports the missing file, which is the same signal the operator had before this call
    // existed — so the worst case is the previous behaviour, not a failed install.
    // Deliberately NOT pushed into `changes`: convoke-update renders every entry of that array
    // as `chalk.green('  ✓ ' + change)`, so a warning string there would print with a green tick
    // — a failure disguised as a success. Code review 2026-08-14 (I137). Always warn, not just
    // in verbose mode: this is the only signal the operator gets.
    console.warn(`    Warning: could not seed taxonomy.yaml: ${err.message}`);
  }

  // dist-2-5 / BUG-19: create the BMM governance registry so the doctor stops reporting a
  // file nothing ever made. Header only — see `seedBmmDependencies` for why seeding SCAN
  // ROWS here is wrong, and what it broke when it was tried.
  try {
    const depsResult = seedBmmDependencies(projectRoot, { isSameRoot, verbose });
    if (depsResult.seeded) {
      changes.push('Created _bmad/_config/bmm-dependencies.csv (empty registry)');
    }
  } catch (err) {
    // Non-fatal, for the same reason the taxonomy seed above is non-fatal: a failed seed
    // must not abort an otherwise-good install. The worst case is the pre-dist-2-5
    // behaviour — doctor reports the registry missing and names the command that fixes it.
    // Deliberately NOT pushed into `changes`: convoke-update renders every entry there with
    // a green tick, so a warning string would print as a success.
    console.warn(`    Warning: could not seed bmm-dependencies.csv: ${err.message}`);
  }

  return changes;
}

/**
 * Remove orphan workflow-wrapper directories from .claude/skills/.
 *
 * Two-strategy matching (Story 7.4, I32):
 *   Strategy 1: Enhance prefix — any dir starting with `bmad-enhance-` that is
 *               not in `currentWrappers` is an orphan.
 *   Strategy 2: Artifacts exact-name — any dir whose name is in `knownArtifactsNames`
 *               but not in `currentWrappers` is an orphan.
 * Everything else (agent wrappers, upstream BMAD skills, third-party) is ignored.
 *
 * @param {string} skillsDir - Absolute path to .claude/skills/
 * @param {Set<string>} currentWrappers - Union of live workflow wrapper names
 * @param {Set<string>} knownArtifactsNames - ALL Artifacts workflow names (including non-standalone)
 * @param {object} [options]
 * @param {boolean} [options.verbose] - Log each action
 * @returns {Array<string>} Changes array entries for removed orphans
 */
function cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames, options = {}) {
  // Deliberately synchronous (fs.removeSync / fs.readdirSync) — the function returns
  // Array<string>, not a Promise. The sync pattern keeps the contract simple for both
  // the caller (section 6e spreads the result into changes[]) and the test file (which
  // imports the function directly without async scaffolding). The existing agent
  // stale-skill sweep at section 6 uses async fs.remove because it runs inline in the
  // async refreshInstallation body; this function is extracted to be testable standalone.
  const { verbose = false } = options;
  const changes = [];

  if (!fs.existsSync(skillsDir)) return changes;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;

    // Skip agent wrappers (handled by existing stale-skill sweep)
    if (name.startsWith('bmad-agent-bme-')) continue;

    // Strategy 1: Enhance prefix (unambiguous — no upstream module uses bmad-enhance-)
    if (name.startsWith('bmad-enhance-')) {
      if (!currentWrappers.has(name)) {
        fs.removeSync(path.join(skillsDir, name));
        changes.push(`Removed orphan skill wrapper: ${name}`);
        if (verbose) console.log(`    Removed orphan skill wrapper: ${name}`);
      }
      continue;
    }

    // Strategy 2: Artifacts exact-name match
    if (knownArtifactsNames.has(name)) {
      if (!currentWrappers.has(name)) {
        fs.removeSync(path.join(skillsDir, name));
        changes.push(`Removed orphan skill wrapper: ${name}`);
        if (verbose) console.log(`    Removed orphan skill wrapper: ${name}`);
      }
      continue;
    }

    // Everything else: not a workflow wrapper we own — leave alone
  }

  return changes;
}

/**
 * Create an EMPTY BMM governance registry in the operator's project (dist-2-5 / BUG-19).
 *
 * `convoke-doctor` reads `path.join(projectRoot, '_bmad/_config/bmm-dependencies.csv')`
 * (`convoke-doctor.js:763`). Nothing created it, so every npm-installed operator saw
 * `⚠ BMM dependencies: registry missing` on an otherwise healthy install.
 *
 * HEADER ONLY — THE SCHEMA, NEVER A ROW. Two implementations were rejected by measurement
 * before this one, and both failure modes are guarded by tests in
 * `tests/unit/refresh-installation-bmm-deps.test.js`:
 *
 *   1. Shipping the package's registry in `files[]` and copying it (the story's original
 *      prescription) replaces `registry missing` with `[stale:skill-gone]` — its sole row
 *      names a skill directory that reaches no user project.
 *   2. Seeding `scanBmmDependencies(projectRoot)` output — which looks right, since it is
 *      what the doctor's `fix:` line tells the OPERATOR to run — stamps the operator's own
 *      custom skills `registered_by: auto-scan`, a RESERVED marker
 *      (`convoke-register-skill.js:33`). That makes `convoke-register-skill` hard-fail
 *      `exit 1` on the exact path it exists to serve, and permanently blinds the doctor's
 *      `unregistered-custom-skill` category, so it reports `✓ registry consistent` over a
 *      tree nobody governed.
 *
 * An empty registry claims nothing. A project with no BMM-dependent skills reports
 * `registry consistent — 0 auto-scan + 0 manual rows`, which is accurate. A project that
 * HAS unregistered skills keeps getting `unregistered-custom-skill`, which is also
 * accurate; silencing that was never in BUG-19's scope. (BUG-20 is the separate question of whether
 * an EXPECTED absence — `compat-preflight`'s `BMAD core not detected` — should warn at all; an
 * unregistered custom skill is not that case, and is not in BUG-20's scope.)
 *
 * WRITTEN INLINE, AND NOT VIA `_atomicWrite`, FOR A REASON THAT IS NOT STYLE. An earlier
 * revision delegated to `audit-bmm-dependencies.js`'s `_atomicWrite`. Round 2 showed that
 * delegating moved the write out of `install-scope-check.js`'s counted unit — its
 * `WRITE_OP_RE` matches literal `fs.*` calls per file — so a NEW write from this file into
 * the forbidden `_bmad/core/` passed the gate GREEN. Reproduced. Keeping the primitives
 * here keeps them counted, which is the whole point of that snapshot.
 *
 * `writeFileSync` + `linkSync` + `unlinkSync`, in that order, is atomic create-if-absent:
 *   - the content is fully written to a sibling temp file BEFORE the target name exists,
 *     so no reader can observe a torn registry (a torn file would be PERMANENT here, since
 *     this function only writes when the target is absent, and `mergePreservingManual`
 *     preserves a fragment row as `manual` so even `convoke-audit-bmm-deps` cannot heal it);
 *   - `linkSync` fails `EEXIST` if the target exists, atomically. That closes the
 *     check-then-act window `lstat` alone leaves open — Round 2 measured 6-10 ms, and
 *     demonstrated a concurrent `convoke-register-skill` commit being silently destroyed by
 *     a `renameSync` that overwrites unconditionally.
 *
 * The `lstat` below is a fast path and a clearer `reason` code, NOT the safety property;
 * `linkSync`'s `EEXIST` is what actually makes this safe. Note it is `lstat`, not
 * `existsSync`: `existsSync` follows symlinks and reports a dangling one as absent.
 *
 * On a filesystem without hard-link support the `linkSync` throws, the caller warns, and the
 * operator lands back in the documented pre-dist-2-5 state — degraded, never broken.
 *
 * Only ever seeds when ABSENT. An existing registry is user state: it carries manually
 * registered rows no scan can reproduce.
 *
 * @param {string} projectRoot - Absolute path to the operator's project.
 * @param {{isSameRoot?: boolean, verbose?: boolean}} [opts]
 * @returns {{seeded: boolean, reason: string}}
 */
function seedBmmDependencies(projectRoot, opts = {}) {
  const { isSameRoot = false, verbose = false } = opts;

  // Guarded like every other write in this file. In dev mode the project IS the package,
  // and rewriting the repository's own tracked registry during a refresh would turn a
  // read-only dev refresh into a source edit.
  if (isSameRoot) return { seeded: false, reason: 'same-root' };

  const depsAbs = path.join(projectRoot, '_bmad', '_config', 'bmm-dependencies.csv');

  let present = true;
  try {
    fs.lstatSync(depsAbs);
  } catch (err) {
    if (err.code === 'ENOENT') present = false;
    else throw err;
  }
  if (present) return { seeded: false, reason: 'exists' };

  const { renderCsv } = require('../../audit/audit-bmm-dependencies');

  fs.ensureDirSync(path.dirname(depsAbs));
  // Sibling of the target by construction, so `linkSync` never crosses a filesystem.
  const tmpAbs = `${depsAbs}.tmp-${process.pid}-${Date.now()}`;
  let seeded = false;
  // The content write is INSIDE the try so the `finally` reclaims the temp on every path.
  // Round 3 measured the alternative: with the write outside, a SHORT write — ENOSPC, EDQUOT,
  // EIO, all of which create the file and then throw part-way — escaped before the reclaim and
  // stranded one stray per attempt, which `.gitignore`'s `*.tmp` does not match and the
  // operator therefore sees in `git status`. The helper this code replaced (`_atomicWrite`)
  // guards the same hazard with a `tmpCreated` flag; an inline copy that is less careful than
  // the thing it replaced is not a simplification.
  try {
    // `renderCsv([])` is exactly the header the doctor's reader expects, derived from that
    // module's own CSV_HEADER_FIELDS rather than restated here, so a schema change cannot
    // leave this seed writing a stale header (`derive-counts-from-source`). Verified
    // byte-identical to what `convoke-audit-bmm-deps` generates for an empty project, so a
    // freshly seeded install does not trip `--verify-only` drift.
    //
    // It is written to the TEMP name, never to `depsAbs`. That is the atomicity property:
    // the published name only ever comes into existence via `linkSync`, already complete.
    fs.writeFileSync(tmpAbs, renderCsv([]), 'utf8');
    fs.linkSync(tmpAbs, depsAbs);
    seeded = true;
  } catch (err) {
    // Someone created the registry while we were writing the temp file — their content
    // wins. This is the race arm, and losing it is the CORRECT outcome: a concurrent
    // `convoke-register-skill` has real rows, and this function only ever had a header.
    if (err.code !== 'EEXIST') throw err;
  } finally {
    // Reclaim the temp name on every path — success, EEXIST, and any throw from either the
    // write or the link. This is only true because the write is inside the try above.
    try { fs.unlinkSync(tmpAbs); } catch { /* never created, or already consumed */ }
  }

  if (!seeded) return { seeded: false, reason: 'exists' };
  if (verbose) console.log('    Created _bmad/_config/bmm-dependencies.csv (empty registry)');
  return { seeded: true, reason: 'created' };
}

module.exports = { refreshInstallation, cleanupOrphanWorkflowWrappers, seedBmmDependencies };
