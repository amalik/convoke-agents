'use strict';

const fs = require('fs-extra');
const path = require('path');

/** @typedef {import('../types/factory-types')} Types */

/**
 * Regex to extract activation XML block from agent markdown files.
 * Matches <activation ...>...</activation> including multiline content.
 */
const ACTIVATION_REGEX = /<activation[^>]*>([\s\S]*?)<\/activation>/;

/**
 * Validate activation blocks in generated agent .md files.
 * Read-only — this module NEVER writes to any file.
 *
 * Checks:
 * 1. Activation block exists in the agent file
 * 2. Config path reference points to the team's config.yaml
 * 3. Module path reference is correct
 *
 * @param {string[]} agentFiles - Array of absolute paths to agent .md files
 * @param {Object} moduleConfig - Module context for validation
 * @param {string} moduleConfig.configPath - Expected config.yaml path
 * @param {string} moduleConfig.modulePath - Expected module path (e.g., "bme/_team-name")
 * @param {string} moduleConfig.moduleDir - Absolute path to module directory
 * @returns {Promise<import('../types/factory-types').ValidationResult>}
 */
async function validateActivation(agentFiles, moduleConfig) {
  const results = [];

  // tf-2-12 R2: an empty (or non-array) input must NOT report success. `[].every()`
  // is true, so the previous form could not distinguish "every agent passed" from
  // "no agent was inspected" — the T121 decorative-gate shape this validator exists
  // to avoid. Both call sites (step-04 §5c and end-to-end-validator's checkActivation)
  // key solely on `valid`, so a driver that failed to accumulate the array got green.
  if (!Array.isArray(agentFiles) || agentFiles.length === 0) {
    return {
      valid: false,
      results: [{
        agentFile: null,
        checks: [{ check: 'Agent files provided', passed: false, detail: 'No agent files were supplied to validate' }],
        errors: [`validateActivation: expected a non-empty array of agent file paths, received ${Array.isArray(agentFiles) ? 'an empty array' : typeof agentFiles}`]
      }]
    };
  }

  for (const agentFile of agentFiles) {
    const result = await validateSingleAgent(agentFile, moduleConfig);
    results.push(result);
  }

  const valid = results.every(r => r.errors.length === 0);
  return { valid, results };
}

/**
 * Validate a single agent file's activation block.
 * @param {string} agentFile - Absolute path to agent .md file
 * @param {Object} moduleConfig - Module context
 * @returns {Promise<import('../types/factory-types').ActivationResult>}
 */
async function validateSingleAgent(agentFile, moduleConfig) {
  const checks = [];
  const errors = [];

  // Read agent file
  let content;
  try {
    content = await fs.readFile(agentFile, 'utf8');
  } catch (err) {
    return { agentFile, checks: [], errors: [`Cannot read agent file: ${err.message}`] };
  }

  // Check 1: Activation block exists
  const match = content.match(ACTIVATION_REGEX);
  if (!match) {
    checks.push({ check: 'Activation block exists', passed: false, detail: 'No <activation> block found in agent file' });
    errors.push('No <activation> block found');
    return { agentFile, checks, errors };
  }
  checks.push({ check: 'Activation block exists', passed: true });

  const activationContent = match[0];

  // Check 2: Config path reference.
  // tf-2-12 (T129): compare on a normalised tail rather than a raw substring, so a
  // caller may pass either the `{project-root}/...` convention form that agents
  // actually write, or a resolved absolute path. Previously this was a bare
  // includes() and therefore turned on the caller's string form.
  const normaliseConfigRef = (p) =>
    String(p).replace(/\\/g, '/').replace(/^\{project-root\}\//, '').replace(/^.*?(?=_bmad\/)/, '');
  const expectedConfigRef = normaliseConfigRef(moduleConfig.configPath);
  // tf-2-12 R2: reject a configPath that cannot identify a module BEFORE comparing.
  // Previously `activationContent.includes('')` short-circuited the `||` to true, so
  // '', ' ', 'a' and even a bare 'config.yaml' passed against ANY agent — a bare
  // filename is contained in every activation block that mentions a config at all.
  const configRefUsable = expectedConfigRef.includes('/') && expectedConfigRef.endsWith('config.yaml');
  const configPathValid = configRefUsable && (
    activationContent.includes(moduleConfig.configPath) ||
    normaliseConfigRef(activationContent).includes(expectedConfigRef)
  );
  checks.push({
    check: 'Config path reference',
    passed: configPathValid,
    detail: configPathValid
      ? undefined
      : configRefUsable
        ? `Expected reference to "${moduleConfig.configPath}" not found in activation block`
        : `moduleConfig.configPath ("${moduleConfig.configPath}") cannot identify a module — expected a path ending in .../config.yaml`
  });
  if (!configPathValid) {
    errors.push(configRefUsable
      ? `Config path "${moduleConfig.configPath}" not referenced in activation block`
      : `Unusable moduleConfig.configPath "${moduleConfig.configPath}" — expected a path ending in .../config.yaml`);
  }

  // Check 3: Config file exists on disk
  const configAbsPath = path.resolve(moduleConfig.moduleDir, 'config.yaml');
  const configExists = await fs.pathExists(configAbsPath);
  checks.push({
    check: 'Config file exists',
    passed: configExists,
    detail: configExists ? undefined : `Config file not found at ${configAbsPath}`
  });
  if (!configExists) {
    errors.push(`Config file does not exist at ${configAbsPath}`);
  }

  // Check 4: Module path reference.
  //
  // tf-2-12 (T129), operator ruling Decision 1 option (c): module identity is
  // DERIVED from the config reference the activation block already contains.
  // Scoped census of the population this claim is about — activation blocks in
  // agent `.md` files under `_bmad/` — is 12 tags across 11 files, all
  // `critical="MANDATORY"`, and ZERO carrying a `module=` attribute. A strict
  // attribute match therefore could not be satisfied by any agent that has ever
  // shipped: the Team Factory's own agent failed this validator.
  //
  // An earlier pass ALSO honoured an explicit `module=` when present, to preserve
  // one existing test's coverage. Three independent reviewers rejected that: the
  // regex is unanchored over the whole activation BODY, so `core_module="..."`,
  // `submodule="..."` and BMB's own `module = "stand-alone"` vocabulary all hijack
  // it and hard-fail a correct agent — and giving the attribute sole authority made
  // normative the very convention option (b) was rejected for inventing. Removed.
  //
  // KNOWN AND ACCEPTED (tf-2-12 R2): at the sole call site this check has no
  // independent detection power — check 2 passing implies check 4 passing, because
  // check 2's reference contains check 4's. It is kept as a separately-named check
  // for its distinct diagnostic, not for independent coverage. Giving it real
  // independent work — asserting the config reference sits inside a load/read
  // instruction rather than merely appearing in prose — is filed, not done here.
  const MODULE_FROM_CONFIG_REF = /(?:^|[/\\])(bme[/\\]_[A-Za-z0-9._-]+)[/\\]config\.yaml/g;
  const derivedModulePaths = [
    ...activationContent.replace(/\\/g, '/').matchAll(MODULE_FROM_CONFIG_REF)
  ].map(m => m[1]);
  const modulePathValid = derivedModulePaths.includes(moduleConfig.modulePath);
  checks.push({
    check: 'Module path reference',
    passed: modulePathValid,
    detail: modulePathValid
      ? undefined
      : derivedModulePaths.length > 0
        ? `Activation block's config reference resolves to module "${derivedModulePaths[0]}", expected "${moduleConfig.modulePath}"`
        : `Activation block contains no module-identifying config reference (expected a path ending .../${moduleConfig.modulePath}/config.yaml)`
  });
  if (!modulePathValid) {
    errors.push(`Module path "${moduleConfig.modulePath}" not referenced correctly in activation block`);
  }

  // Check 5: Module directory exists
  const moduleDirExists = await fs.pathExists(moduleConfig.moduleDir);
  checks.push({
    check: 'Module directory exists',
    passed: moduleDirExists,
    detail: moduleDirExists ? undefined : `Module directory not found at ${moduleConfig.moduleDir}`
  });
  if (!moduleDirExists) {
    errors.push(`Module directory does not exist at ${moduleConfig.moduleDir}`);
  }

  return { agentFile, checks, errors };
}

// --- CLI entry point ---
if (require.main === module) {
  const args = process.argv.slice(2);
  const agentFilesIdx = args.indexOf('--agent-files');
  const configPathIdx = args.indexOf('--config-path');

  if (agentFilesIdx === -1 || configPathIdx === -1) {
    console.error('Usage: node activation-validator.js --agent-files <glob-or-paths> --config-path <path>');
    process.exit(1);
  }

  const agentGlob = args[agentFilesIdx + 1];
  const configPath = args[configPathIdx + 1];

  (async () => {
    try {
      // Resolve agent files from glob or comma-separated list
      let agentFiles;
      if (agentGlob.includes('*')) {
        // Use fs.readdir-based simple glob for *.md in a directory
        const dir = path.dirname(agentGlob);
        const entries = await fs.readdir(dir);
        agentFiles = entries
          .filter(e => e.endsWith('.md'))
          .map(e => path.join(dir, e));
      } else {
        agentFiles = agentGlob.split(',').map(f => f.trim());
      }

      // Derive module context from config path
      const moduleDir = path.dirname(configPath);
      const modulePath = path.relative(path.resolve(moduleDir, '../../'), moduleDir);

      const result = await validateActivation(agentFiles, {
        configPath: configPath,
        modulePath: modulePath,
        moduleDir: moduleDir
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(result.valid ? 0 : 1);
    } catch (err) {
      console.log(JSON.stringify({ valid: false, results: [], errors: [err.message] }, null, 2));
      process.exit(1);
    }
  })();
}

module.exports = { validateActivation, validateSingleAgent, ACTIVATION_REGEX };
