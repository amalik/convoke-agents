#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { getPackageVersion } = require('./utils');
const configMerger = require('./config-merger');
const { AGENTS, AGENT_FILES, AGENT_IDS, WORKFLOW_NAMES, USER_GUIDES, GYRE_AGENTS, GYRE_AGENT_FILES, GYRE_AGENT_IDS, GYRE_WORKFLOW_NAMES, EXTRA_BME_AGENTS } = require('./agent-registry');

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

  // 1. Copy agent files
  const agentsSource = path.join(packageVortex, 'agents');
  const agentsTarget = path.join(targetVortex, 'agents');
  await fs.ensureDir(agentsTarget);

  if (!isSameRoot) {
    for (const file of AGENT_FILES) {
      const src = path.join(agentsSource, file);
      if (fs.existsSync(src)) {
        await fs.copy(src, path.join(agentsTarget, file), { overwrite: true });
        changes.push(`Refreshed agent: ${file}`);
        if (verbose) console.log(`    Refreshed agent: ${file}`);
      }
    }
  } else {
    changes.push('Skipped agent copy (dev environment — files already in place)');
    if (verbose) console.log('    Skipped agent copy (dev environment)');
  }

  // Remove deprecated agent files if still present
  const deprecatedAgents = ['empathy-mapper.md', 'wireframe-designer.md'];
  for (const file of deprecatedAgents) {
    const agentPath = path.join(agentsTarget, file);
    if (fs.existsSync(agentPath)) {
      await fs.remove(agentPath);
      changes.push(`Removed deprecated agent: ${file}`);
      if (verbose) console.log(`    Removed deprecated agent: ${file}`);
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
        changes.push(`Refreshed standalone bme submodule: ${agent.submodule}`);
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
      // Stamp enhance config version to match package version
      const targetEnhanceConfig = path.join(targetEnhance, 'config.yaml');
      if (fs.existsSync(targetEnhanceConfig)) {
        const ecContent = yaml.load(fs.readFileSync(targetEnhanceConfig, 'utf8'));
        ecContent.version = version;
        fs.writeFileSync(targetEnhanceConfig, yaml.dump(ecContent, { lineWidth: -1 }), 'utf8');
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
      // Stamp artifacts config version to match package version
      const targetArtifactsConfig = path.join(targetArtifacts, 'config.yaml');
      if (fs.existsSync(targetArtifactsConfig)) {
        const acContent = yaml.load(fs.readFileSync(targetArtifactsConfig, 'utf8'));
        acContent.version = version;
        fs.writeFileSync(targetArtifactsConfig, yaml.dump(acContent, { lineWidth: -1 }), 'utf8');
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

  // 3. Update config.yaml (merge, preserving user prefs)
  const configPath = path.join(targetVortex, 'config.yaml');
  await fs.ensureDir(path.dirname(configPath));

  const updates = {
    agents: AGENT_IDS,
    workflows: WORKFLOW_NAMES
  };

  const merged = await configMerger.mergeConfig(configPath, version, updates);
  await configMerger.writeConfig(configPath, merged);
  changes.push(`Updated config.yaml to v${version}`);
  if (verbose) console.log(`    Updated config.yaml to v${version}`);

  // 4. Regenerate agent manifest — replace only bme rows, preserve other modules
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'agent-manifest.csv');
  await fs.ensureDir(path.dirname(manifestPath));

  function csvEscape(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  function parseCSVRow(row) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (inQuotes) {
        if (ch === '"' && row[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  }

  const V610_HEADER = 'name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId';
  // Detect schema from existing manifest or default to v6.1.0
  let header;
  let isV610 = true;
  let preservedRows = [];

  if (fs.existsSync(manifestPath)) {
    const existing = (await fs.readFile(manifestPath, 'utf8')).trim().split('\n');
    header = existing[0];
    isV610 = header.startsWith('name,') || header.includes('canonicalId');

    // Filter out bme rows, preserve everything else
    preservedRows = existing.slice(1).filter(row => {
      if (!row.trim()) return false;
      if (isV610) {
        // v6.1.0: module is column 10 (index 9) — handle quoted CSV fields
        const parsed = parseCSVRow(row);
        if (!parsed || parsed.length < 10) return true;
        return parsed[9] !== 'bme';
      } else {
        // Legacy: submodule is column 9 (index 8) — quoted CSV
        const fields = row.match(/"([^"]*(?:""[^"]*)*)"/g);
        if (!fields || fields.length < 9) return true;
        const submodule = fields[8].replace(/^"|"$/g, '');
        return submodule !== 'bme';
      }
    });
  } else {
    header = V610_HEADER;
    isV610 = true;
  }

  // Build fresh bme rows matching the detected schema (Vortex + Gyre agents)
  function buildAgentRow610(a, submodule) {
    const p = a.persona;
    return [
      csvEscape(a.name),           // name
      csvEscape(''),               // displayName
      csvEscape(a.title),          // title
      csvEscape(a.icon),           // icon
      csvEscape(''),               // capabilities
      csvEscape(p.role),           // role
      csvEscape(p.identity),       // identity
      csvEscape(p.communication_style), // communicationStyle
      csvEscape(p.expertise),      // principles
      csvEscape('bme'),            // module
      csvEscape(`_bmad/bme/${submodule}/agents/${a.id}.md`), // path
      csvEscape(`bmad-agent-bme-${a.id}`), // canonicalId
    ].join(',');
  }

  function buildAgentRowLegacy(a, submodule) {
    const p = a.persona;
    return [
      a.id, a.name, a.title, a.icon,
      p.role, p.identity, p.communication_style, p.expertise,
      'bme', `_bmad/bme/${submodule}/agents/${a.id}.md`,
    ].map(csvEscape).join(',');
  }

  // Row builder for standalone bme agents (e.g., team-factory) — submodule path differs from team agents
  function buildExtraBmeAgentRow610(a) {
    const p = a.persona;
    return [
      csvEscape(a.name),
      csvEscape(''),
      csvEscape(a.title),
      csvEscape(a.icon),
      csvEscape(''),
      csvEscape(p.role),
      csvEscape(p.identity),
      csvEscape(p.communication_style),
      csvEscape(p.expertise),
      csvEscape('bme'),
      csvEscape(`_bmad/bme/${a.submodule}/agents/${a.id}.md`),
      csvEscape(`bmad-agent-bme-${a.id}`),
    ].join(',');
  }

  function buildExtraBmeAgentRowLegacy(a) {
    const p = a.persona;
    return [
      a.id, a.name, a.title, a.icon,
      p.role, p.identity, p.communication_style, p.expertise,
      'bme', `_bmad/bme/${a.submodule}/agents/${a.id}.md`,
    ].map(csvEscape).join(',');
  }

  let bmeRows;
  if (isV610) {
    bmeRows = [
      ...AGENTS.map(a => buildAgentRow610(a, '_vortex')),
      ...GYRE_AGENTS.map(a => buildAgentRow610(a, '_gyre')),
      ...EXTRA_BME_AGENTS.map(buildExtraBmeAgentRow610),
    ];
  } else {
    bmeRows = [
      ...AGENTS.map(a => buildAgentRowLegacy(a, '_vortex')),
      ...GYRE_AGENTS.map(a => buildAgentRowLegacy(a, '_gyre')),
      ...EXTRA_BME_AGENTS.map(buildExtraBmeAgentRowLegacy),
    ];
  }

  const allRows = [...preservedRows, ...bmeRows].join('\n') + '\n';
  await fs.writeFile(manifestPath, header + '\n' + allRows, 'utf8');
  changes.push('Regenerated agent-manifest.csv (bme rows updated, other modules preserved)');
  if (verbose) console.log('    Regenerated agent-manifest.csv (bme rows updated, other modules preserved)');

  // 5. Copy user guides (with optional backup)
  const guidesSource = path.join(packageRoot, '_bmad', 'bme', '_vortex', 'guides');
  const guidesTarget = path.join(projectRoot, '_bmad', 'bme', '_vortex', 'guides');
  await fs.ensureDir(guidesTarget);

  if (!isSameRoot) {
    for (const guide of USER_GUIDES) {
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

  // Remove stale skill directories (agents no longer in registry)
  const currentSkillDirs = new Set([
    ...AGENTS.map(a => `bmad-agent-bme-${a.id}`),
    ...GYRE_AGENTS.map(a => `bmad-agent-bme-${a.id}`),
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
    const skillDir = path.join(skillsDir, `bmad-agent-bme-${agent.id}`);
    await fs.ensureDir(skillDir);
    const content = `---
name: bmad-agent-bme-${agent.id}
description: ${agent.id} agent
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bme/_vortex/agents/${agent.id}.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. FOLLOW every step in the <activation> section precisely
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
3. FOLLOW every step in the <activation> section precisely
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
3. FOLLOW every step in the <activation> section precisely
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
          const skRow = `\n"${canonicalId}","${canonicalId}","Manage RICE initiatives backlog — triage review findings, rescore existing items, or bootstrap new backlogs.","bme","_bmad/bme/_enhance/workflows/${workflow.name}/SKILL.md","true"`;
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

  return changes;
}

module.exports = { refreshInstallation };
