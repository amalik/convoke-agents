'use strict';

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/** @typedef {import('../types/factory-types')} Types */

/**
 * Write a new module block to agent-registry.js with Full Write Safety Protocol.
 *
 * Protocol: stage → validate → check → apply → verify → rollback
 *
 * This is the ONLY writer that uses the full protocol because agent-registry.js
 * is a shared file consumed by refresh-installation, validator, convoke-doctor,
 * installer, index.js, and migration-runner.
 *
 * @param {Object} specData - Parsed team spec with agents enriched with persona fields
 * @param {string} registryPath - Absolute path to agent-registry.js
 * @param {Object} [options]
 * @param {boolean} [options.skipDirtyCheck] - Skip git dirty-tree detection (for tests)
 * @returns {Promise<import('../types/factory-types').RegistryResult>}
 */
async function writeRegistryBlock(specData, registryPath, options = {}) {
  const prefix = derivePrefix(specData.team_name_kebab);
  const teamName = specData.team_name || specData.team_name_kebab;

  // --- Idempotency check ---
  let currentContent;
  try {
    currentContent = await fs.readFile(registryPath, 'utf8');
  } catch (err) {
    return { success: false, written: [], skipped: [], errors: [`Cannot read registry file: ${err.message}`], rollbackApplied: false };
  }

  if (currentContent.includes(`const ${prefix}_AGENTS`)) {
    return { success: true, written: [], skipped: ['block already exists'], errors: [], rollbackApplied: false };
  }

  // --- 1. STAGE: Build module block + export additions ---
  const workflowNames = buildWorkflowNames(specData);
  const moduleBlock = buildModuleBlock(specData, prefix, teamName, workflowNames);
  const exportNames = buildExportNames(prefix);

  // --- 2. VALIDATE: Syntax, prefix uniqueness, additive-only ---
  const validateErrors = validateStaged(moduleBlock, prefix, currentContent);
  if (validateErrors.length > 0) {
    return { success: false, written: [], skipped: [], errors: validateErrors, rollbackApplied: false };
  }

  // Validate staged block syntax via temp file
  const syntaxError = await validateSyntax(moduleBlock, prefix);
  if (syntaxError) {
    return { success: false, written: [], skipped: [], errors: [syntaxError], rollbackApplied: false };
  }

  // --- 3. CHECK: Dirty-tree detection ---
  if (!options.skipDirtyCheck) {
    const dirtyResult = checkDirtyTree(registryPath);
    if (dirtyResult.dirty) {
      return { success: false, written: [], skipped: [], errors: [], rollbackApplied: false, dirty: true, diff: dirtyResult.diff };
    }
  }

  // --- 4. APPLY: Read → save .bak → insert → write ---
  const bakPath = `${registryPath}.bak`;
  try {
    await fs.writeFile(bakPath, currentContent, 'utf8');
  } catch (err) {
    return { success: false, written: [], skipped: [], errors: [`Failed to create backup: ${err.message}`], rollbackApplied: false };
  }

  const modified = applyInsertions(currentContent, moduleBlock, exportNames);
  try {
    await fs.writeFile(registryPath, modified, 'utf8');
  } catch (err) {
    // Restore from backup
    await fs.writeFile(registryPath, currentContent, 'utf8');
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: [`Write failed: ${err.message}`], rollbackApplied: true };
  }

  // --- 5. VERIFY: Re-read + node require() ---
  const verifyError = verifyRequire(registryPath);
  if (verifyError) {
    // Rollback
    await fs.writeFile(registryPath, currentContent, 'utf8');
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: [verifyError], rollbackApplied: true };
  }

  // --- Cleanup: Remove .bak ---
  await fs.remove(bakPath);

  return {
    success: true,
    written: [`${prefix}_AGENTS`, `${prefix}_WORKFLOWS`, `${prefix}_AGENT_FILES`, `${prefix}_AGENT_IDS`, `${prefix}_WORKFLOW_NAMES`],
    skipped: [],
    errors: [],
    rollbackApplied: false
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Derive SCREAMING_SNAKE_CASE prefix from team name kebab.
 * @param {string} teamNameKebab - e.g. "test-team"
 * @returns {string} - e.g. "TEST_TEAM"
 */
function derivePrefix(teamNameKebab) {
  return (teamNameKebab || '').replace(/^_/, '').replace(/-/g, '_').toUpperCase();
}

/**
 * Build workflow names from spec data using the same logic as config-creator.
 * @param {Object} specData
 * @returns {Object} Map of agent_id → workflow_name
 */
function buildWorkflowNames(specData) {
  const map = {};
  for (const agent of (specData.agents || [])) {
    if (specData.workflow_names && specData.workflow_names[agent.id]) {
      map[agent.id] = specData.workflow_names[agent.id];
    } else if (agent.capabilities && agent.capabilities.length > 0) {
      const cap = agent.capabilities[0];
      const wordCount = cap.trim().split(/\s+/).length;
      if (wordCount > 4 && agent.role) {
        map[agent.id] = toKebab(agent.role);
      } else {
        map[agent.id] = toKebab(cap);
      }
    } else {
      map[agent.id] = toKebab(agent.role || agent.id);
    }
  }
  return map;
}

/**
 * Convert a string to kebab-case.
 * @param {string} str
 * @returns {string}
 */
function toKebab(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Escape single quotes in a string for JS string literal output.
 * @param {string} str
 * @returns {string}
 */
function escapeSingleQuotes(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Build a registry agent entry object from enriched agent spec data.
 * @param {Object} agentSpec - Agent spec with persona fields
 * @param {string} teamNameKebab - Team name for stream field
 * @returns {Object}
 */
function buildAgentEntry(agentSpec, teamNameKebab) {
  return {
    id: agentSpec.id,
    name: agentSpec.name || agentSpec.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    icon: agentSpec.icon || '\u{2699}',
    title: agentSpec.role || agentSpec.title || agentSpec.id,
    stream: teamNameKebab,
    persona: {
      role: agentSpec.persona?.role || agentSpec.role || '',
      identity: agentSpec.persona?.identity || '',
      communication_style: agentSpec.persona?.communication_style || '',
      expertise: agentSpec.persona?.expertise || '',
    }
  };
}

/**
 * Build the module block as a JS string.
 * @param {Object} specData
 * @param {string} prefix - SCREAMING_SNAKE_CASE
 * @param {string} teamName - Display name
 * @param {Object} workflowNames - Map of agent_id → workflow_name
 * @returns {string}
 */
function buildModuleBlock(specData, prefix, teamName, workflowNames) {
  const agents = (specData.agents || []).map(a => buildAgentEntry(a, specData.team_name_kebab));
  const workflows = [];
  for (const agent of (specData.agents || [])) {
    const wfName = workflowNames[agent.id];
    if (wfName) {
      workflows.push({ name: wfName, agent: agent.id });
    }
  }

  const lines = [];

  // Section comment (padded to ~72 chars like Gyre)
  const label = `── ${teamName} Module `;
  const pad = Math.max(0, 72 - 3 - label.length);
  lines.push(`// ${label}${'─'.repeat(pad)}`);

  // AGENTS array
  lines.push(`const ${prefix}_AGENTS = [`);
  for (const agent of agents) {
    lines.push('  {');
    lines.push(`    id: '${escapeSingleQuotes(agent.id)}', name: '${escapeSingleQuotes(agent.name)}', icon: '${agent.icon}',`);
    lines.push(`    title: '${escapeSingleQuotes(agent.title)}', stream: '${escapeSingleQuotes(agent.stream)}',`);
    lines.push('    persona: {');
    lines.push(`      role: '${escapeSingleQuotes(agent.persona.role)}',`);
    lines.push(`      identity: '${escapeSingleQuotes(agent.persona.identity)}',`);
    lines.push(`      communication_style: '${escapeSingleQuotes(agent.persona.communication_style)}',`);
    lines.push(`      expertise: '${escapeSingleQuotes(agent.persona.expertise)}',`);
    lines.push('    },');
    lines.push('  },');
  }
  lines.push('];');
  lines.push('');

  // WORKFLOWS array
  lines.push(`const ${prefix}_WORKFLOWS = [`);
  for (const wf of workflows) {
    lines.push(`  { name: '${escapeSingleQuotes(wf.name)}', agent: '${escapeSingleQuotes(wf.agent)}' },`);
  }
  lines.push('];');
  lines.push('');

  // Derived lists
  lines.push(`// Derived lists for ${teamName}`);
  lines.push(`const ${prefix}_AGENT_FILES = ${prefix}_AGENTS.map(a => \`\${a.id}.md\`);`);
  lines.push(`const ${prefix}_AGENT_IDS = ${prefix}_AGENTS.map(a => a.id);`);
  lines.push(`const ${prefix}_WORKFLOW_NAMES = ${prefix}_WORKFLOWS.map(w => w.name);`);

  return lines.join('\n');
}

/**
 * Build the list of export names to add to module.exports.
 * @param {string} prefix
 * @returns {string[]}
 */
function buildExportNames(prefix) {
  return [
    `${prefix}_AGENTS`,
    `${prefix}_WORKFLOWS`,
    `${prefix}_AGENT_FILES`,
    `${prefix}_AGENT_IDS`,
    `${prefix}_WORKFLOW_NAMES`,
  ];
}

/**
 * Validate staged content: prefix uniqueness, additive-only.
 * @param {string} moduleBlock
 * @param {string} prefix
 * @param {string} currentContent
 * @returns {string[]} errors
 */
function validateStaged(moduleBlock, prefix, currentContent) {
  const errors = [];

  // Check prefix collision
  if (currentContent.includes(`const ${prefix}_AGENTS`)) {
    errors.push(`Prefix collision: ${prefix}_AGENTS already exists in registry`);
  }

  // Check additive-only — no reassignment to existing variables
  const existingConsts = [...currentContent.matchAll(/const\s+(\w+)\s*=/g)].map(m => m[1]);
  const newConsts = [...moduleBlock.matchAll(/const\s+(\w+)\s*=/g)].map(m => m[1]);
  for (const nc of newConsts) {
    if (existingConsts.includes(nc)) {
      errors.push(`Additive-only violation: ${nc} already exists`);
    }
  }

  // Check balanced braces
  const opens = (moduleBlock.match(/\{/g) || []).length;
  const closes = (moduleBlock.match(/\}/g) || []).length;
  if (opens !== closes) {
    errors.push(`Unbalanced braces: ${opens} opens, ${closes} closes`);
  }

  return errors;
}

/**
 * Validate staged block syntax by writing to temp file and require()ing it.
 * @param {string} moduleBlock
 * @param {string} prefix
 * @returns {Promise<string|null>} error message or null
 */
async function validateSyntax(moduleBlock, prefix) {
  const tmpDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'bmad-tf-validate-'));
  const tmpFile = path.join(tmpDir, 'validate-block.js');
  try {
    // Wrap the block in a module so require() can parse it
    const wrapped = `'use strict';\n${moduleBlock}\nmodule.exports = { ${buildExportNames(prefix).join(', ')} };\n`;
    await fs.writeFile(tmpFile, wrapped, 'utf8');
    execSync(`node -e "require('${tmpFile.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')"`, { timeout: 5000, stdio: 'pipe' });
    return null;
  } catch (err) {
    return `Staged block syntax validation failed: ${err.stderr ? err.stderr.toString().trim() : err.message}`;
  } finally {
    await fs.remove(tmpDir);
  }
}

/**
 * Check if the registry file has uncommitted changes.
 * @param {string} registryPath
 * @returns {{ dirty: boolean, diff: string }}
 */
function checkDirtyTree(registryPath) {
  try {
    const cwd = path.dirname(registryPath);
    const diff = execSync(`git diff --name-only -- "${registryPath}"`, { cwd, timeout: 5000, stdio: 'pipe' }).toString().trim();
    return { dirty: diff.length > 0, diff };
  } catch {
    // If git is not available or file is not in a repo, proceed
    return { dirty: false, diff: '' };
  }
}

/**
 * Insert module block and export names into registry content.
 * @param {string} content - Current file content
 * @param {string} moduleBlock - New module block to insert
 * @param {string[]} exportNames - Export names to add
 * @returns {string} Modified content
 */
function applyInsertions(content, moduleBlock, exportNames) {
  // Insert module block before `module.exports = {`
  const exportsMarker = 'module.exports = {';
  const markerIdx = content.indexOf(exportsMarker);
  if (markerIdx === -1) {
    throw new Error('Cannot find module.exports = { marker in registry file');
  }

  const before = content.slice(0, markerIdx);
  const after = content.slice(markerIdx);

  const withBlock = before + moduleBlock + '\n\n' + after;

  // Insert export names before the closing `};` of module.exports
  const closingIdx = withBlock.lastIndexOf('};');
  if (closingIdx === -1) {
    throw new Error('Cannot find closing }; of module.exports');
  }

  const beforeClosing = withBlock.slice(0, closingIdx);
  const afterClosing = withBlock.slice(closingIdx);

  const exportLines = exportNames.map(name => `  ${name},`).join('\n');
  const withExports = beforeClosing + exportLines + '\n' + afterClosing;

  return withExports;
}

/**
 * Verify the written file can be require()d by Node.
 * @param {string} registryPath
 * @returns {string|null} error message or null
 */
function verifyRequire(registryPath) {
  try {
    const absPath = path.resolve(registryPath);
    execSync(`node -e "require('${absPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')"`, { timeout: 5000, stdio: 'pipe' });
    return null;
  } catch (err) {
    return `Post-write require() verification failed: ${err.stderr ? err.stderr.toString().trim() : err.message}`;
  }
}

// --- CLI entry point ---
if (require.main === module) {
  const args = process.argv.slice(2);
  const specFileIdx = args.indexOf('--spec-file');
  const registryPathIdx = args.indexOf('--registry-path');

  if (specFileIdx === -1 || !args[specFileIdx + 1]) {
    console.error('Usage: node registry-writer.js --spec-file <path> [--registry-path <path>]');
    process.exit(1);
  }

  const specFilePath = args[specFileIdx + 1];
  const registryPath = registryPathIdx !== -1 && args[registryPathIdx + 1]
    ? path.resolve(args[registryPathIdx + 1])
    : path.resolve(__dirname, '../../../../../scripts/update/lib/agent-registry.js');

  (async () => {
    try {
      const yaml = require('js-yaml');
      const specContent = await fs.readFile(specFilePath, 'utf8');
      const specData = yaml.load(specContent);

      const result = await writeRegistryBlock(specData, registryPath);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      console.log(JSON.stringify({ success: false, errors: [err.message] }, null, 2));
      process.exit(1);
    }
  })();
}

module.exports = {
  writeRegistryBlock,
  derivePrefix,
  buildAgentEntry,
  buildModuleBlock,
  buildExportNames,
  buildWorkflowNames,
  applyInsertions,
  checkDirtyTree,
  verifyRequire,
  escapeSingleQuotes,
};
