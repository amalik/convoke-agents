#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { getPackageVersion } = require('./utils');
const configMerger = require('./config-merger');
const { AGENTS, AGENT_FILES, AGENT_IDS, WORKFLOW_NAMES, USER_GUIDES } = require('./agent-registry');

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

  // Build fresh bme rows matching the detected schema
  let bmeRows;
  if (isV610) {
    bmeRows = AGENTS.map(a => {
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
        csvEscape(`_bmad/bme/_vortex/agents/${a.id}.md`), // path
        csvEscape(`bmad-agent-bme-${a.id}`), // canonicalId
      ].join(',');
    });
  } else {
    bmeRows = AGENTS.map(a => {
      const p = a.persona;
      return [
        a.id, a.name, a.title, a.icon,
        p.role, p.identity, p.communication_style, p.expertise,
        'bme', `_bmad/bme/_vortex/agents/${a.id}.md`,
      ].map(csvEscape).join(',');
    });
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
  const currentSkillDirs = new Set(AGENTS.map(a => `bmad-agent-bme-${a.id}`));
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

  for (const agent of AGENTS) {
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
