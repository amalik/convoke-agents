'use strict';

const fs = require('fs-extra');
const path = require('path');
const { spawnSync } = require('child_process');
const { toKebab, deriveWorkflowName } = require('../utils/naming-utils');

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
  if (!specData.team_name_kebab || !specData.team_name_kebab.trim()) {
    return { success: false, written: [], skipped: [], errors: ['team_name_kebab is required and must not be empty'], rollbackApplied: false };
  }

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
  if (await fs.pathExists(bakPath)) {
    return { success: false, written: [], skipped: [], errors: ['Stale .bak file exists — a previous run may have crashed. Remove it manually before retrying.'], rollbackApplied: false };
  }
  try {
    await fs.writeFile(bakPath, currentContent, 'utf8');
  } catch (err) {
    return { success: false, written: [], skipped: [], errors: [`Failed to create backup: ${err.message}`], rollbackApplied: false };
  }

  let modified;
  try {
    modified = applyInsertions(currentContent, moduleBlock, exportNames);
  } catch (err) {
    await fs.remove(bakPath);
    return { success: false, written: [], skipped: [], errors: [`Insertion failed: ${err.message}`], rollbackApplied: false };
  }

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
  return (teamNameKebab || '')
    .replace(/^_/, '')
    .replace(/-/g, '_')
    .toUpperCase()
    // The result is interpolated directly into `const ${prefix}_AGENTS = [`, i.e. into an
    // identifier position. Callers are expected to pass a toKebab()'d value, but this
    // function is reachable with an arbitrary `specData.team_name_kebab`. Constraining to
    // identifier characters keeps a malformed spec a validation error rather than a
    // syntax break. (Lower severity than the icon/teamName holes: .toUpperCase() mangles
    // any payload into non-callable identifiers.) Code review 2026-08-11.
    .replace(/[^A-Z0-9_]/g, '');
}

/**
 * Build workflow names from spec data using shared deriveWorkflowName().
 * @param {Object} specData
 * @returns {Object} Map of agent_id → workflow_name
 */
function buildWorkflowNames(specData) {
  const map = {};
  for (const agent of (specData.agents || [])) {
    map[agent.id] = deriveWorkflowName(agent, specData);
  }
  return map;
}

/**
 * Escape single quotes in a string for JS string literal output.
 * @param {string} str
 * @returns {string}
 */
function sanitizeForComment(str) {
  if (!str) return '';
  return String(str).replace(/[\r\n\u2028\u2029]+/g, ' ');
}

/**
 * Escape a value for embedding inside a single-quoted JS string literal.
 * Order matters: backslashes first, then quotes, then line terminators.
 * @param {string} str
 * @returns {string}
 */
function escapeSingleQuotes(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
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

  // Section comment (padded to ~72 chars like Gyre).
  // `teamName` is interpolated into a `//` line comment, so ANY newline in it escapes
  // the comment and the remainder is executed as source. Verified end-to-end: a team
  // name containing a newline returned success:true / errors:[] and wrote an executing
  // payload permanently into agent-registry.js. escapeSingleQuotes is not usable here
  // (its `\n` output is a string escape, meaningless inside a comment), so newlines are
  // stripped outright. Code review 2026-08-11.
  const label = `── ${sanitizeForComment(teamName)} Module `;
  const pad = Math.max(0, 72 - 3 - label.length);
  lines.push(`// ${label}${'─'.repeat(pad)}`);

  // AGENTS array
  lines.push(`const ${prefix}_AGENTS = [`);
  for (const agent of agents) {
    lines.push('  {');
    // `icon` MUST go through escapeSingleQuotes like every sibling field. It was the
    // one raw interpolation in this builder, and it was a remote-code-execution hole:
    // an icon of `X', zz: require('fs').writeFileSync(...), yy: '` produces syntactically
    // valid JS, passes validateSyntax with status 0, and is persisted to
    // agent-registry.js — which is then require()d by refresh-installation, validator,
    // convoke-doctor, the installer, index.js and migration-runner on every subsequent
    // operation. Verified by execution, code review 2026-08-11.
    lines.push(`    id: '${escapeSingleQuotes(agent.id)}', name: '${escapeSingleQuotes(agent.name)}', icon: '${escapeSingleQuotes(agent.icon)}',`);
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
  // Second comment interpolation of teamName — same newline-escape vector as the section
  // comment above. Missed on the first pass of the 2026-08-11 fix and caught by the new
  // regression test, which is the argument for writing it.
  lines.push(`// Derived lists for ${sanitizeForComment(teamName)}`);
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

  return errors;
}

/**
 * Run `node -e "require(<file>)"` WITHOUT a shell.
 *
 * The previous implementation built a shell command string and interpolated the path,
 * escaping only backslashes and single quotes. Any path containing `"`, `$` or a backtick
 * escaped that quoting and was executed by /bin/sh — verified live against HEAD on
 * 2026-08-11 via `verifyRequire('.../reg.js$(touch marker)')`. `registryPath` is
 * user-supplied through the `--registry-path` CLI flag, and `validateSyntax`'s path
 * derives from `TMPDIR`. spawnSync with an argv array removes the shell entirely.
 *
 * `path.resolve` is applied to every path: `node -e "require('foo/bar.js')"` without a
 * leading `./` is a PACKAGE specifier and fails MODULE_NOT_FOUND. For `verifyRequire`
 * this preserves prior behaviour; for `validateSyntax` it is newly added (the old code
 * did not resolve, so a relative TMPDIR produced a package specifier).
 *
 * Errors carry `stderr` so callers' `err.stderr ? ... : err.message` keep their messages —
 * spawnSync populates res.stderr even when it sets res.error (ETIMEDOUT, ENOBUFS), but
 * the error object has no .stderr of its own, unlike execSync's.
 *
 * @param {string} filePath
 */
function runNodeRequire(filePath) {
  const absPath = path.resolve(filePath);
  const res = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(absPath)})`], {
    timeout: 5000,
    stdio: 'pipe',
  });
  if (res.error) {
    if (res.stderr && res.stderr.length) res.error.stderr = res.stderr;
    throw res.error;
  }
  // A signal kill (timeout, OOM killer, CI cgroup limit) yields status === null with no
  // error. Treating null as a non-zero exit would roll back a correctly written file.
  if (res.status === null) {
    const err = new Error(`node was killed by signal ${res.signal || 'unknown'}`);
    if (res.stderr && res.stderr.length) err.stderr = res.stderr;
    throw err;
  }
  if (res.status !== 0) {
    const err = new Error(`node exited with status ${res.status}`);
    if (res.stderr && res.stderr.length) err.stderr = res.stderr;
    throw err;
  }
}

/**
 * Run a `git diff`-family command without a shell; '' when git is unavailable or fails.
 *
 * Each call is isolated, so a failure of the `--cached` query no longer discards a
 * successful unstaged result — under the previous single-try/two-execSync shape, one
 * failing call sent both to the catch and reported a dirty tree as clean.
 *
 * @param {string[]} args
 * @param {string} cwd
 * @returns {string}
 */
function runGitDiff(args, cwd) {
  const res = spawnSync('git', args, { cwd, timeout: 5000, stdio: 'pipe' });
  if (res.error || res.status !== 0 || !res.stdout) return '';
  return res.stdout.toString().trim();
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
    runNodeRequire(tmpFile);
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
    const unstaged = runGitDiff(['diff', '--name-only', '--', registryPath], cwd);
    const staged = runGitDiff(['diff', '--cached', '--name-only', '--', registryPath], cwd);
    const allDiffs = [unstaged, staged].filter(Boolean).join('\n');
    return { dirty: allDiffs.length > 0, diff: allDiffs };
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
    runNodeRequire(registryPath);
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
