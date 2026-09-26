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
  // WHAT THIS CHECK GUARANTEES, precisely: every occurrence of the module-relative tail that appears in
  // the activation block carries the `{project-root}/` prefix, and at least one occurrence exists. It
  // does NOT guarantee the agent loads its config from the project root — a load step that names the
  // config by any other string (`config.yaml`, `./config.yaml`, or BMB's compiler-injected
  // `Load config to get {user_name}…`, which carries no path at all) contributes no occurrence and is
  // invisible here, while prefixed mentions in the error boilerplate satisfy the check. Asserting the
  // reference sits inside the load instruction is T138, not this. Found by R2, 2026-09-26.
  //
  // T214: the module-relative tail is derived from the CALLER's parameter, which may legitimately
  // arrive prefixed, unprefixed or absolute — it is an argument, not an artifact. The AGENT FILE is
  // held to the convention: `{project-root}/_bmad/…/config.yaml`, which is what the 9 agents that
  // HAVE an activation block write (27 references across them; the 3 v6.3 agents have none, per T127)
  // and what `step-04-generate.md`'s `{config_path}` row specifies.
  //
  // Before this, both sides were normalised — the prefix stripped, then everything up to the first
  // `_bmad/` — and compared with `includes`. So `_bmad/bme/_x/config.yaml` in an agent file satisfied
  // an expected `{project-root}/_bmad/bme/_x/config.yaml`: the two forms collapsed to one string. An
  // unprefixed reference resolves against whatever directory the agent is ACTIVATED from, so this
  // check was blind to the one thing it exists to catch, and step-04 §3a handed BMB that very form
  // until 2026-09-24.
  const toSlash = (p) => String(p).replace(/\\/g, '/');
  const configTail = (p) => toSlash(p).replace(/^\{project-root\}\//, '').replace(/^.*?(?=_bmad\/)/, '');
  const expectedConfigRef = configTail(moduleConfig.configPath);
  // tf-2-12 R2: reject a configPath that cannot identify a module BEFORE comparing.
  // Previously `activationContent.includes('')` short-circuited the `||` to true, so
  // '', ' ', 'a' and even a bare 'config.yaml' passed against ANY agent — a bare
  // filename is contained in every activation block that mentions a config at all.
  const configRefUsable = expectedConfigRef.includes('/') && expectedConfigRef.endsWith('config.yaml');
  const activation = toSlash(activationContent);
  const conventionRef = `{project-root}/${expectedConfigRef}`;

  // EVERY occurrence must be prefixed, not merely one of them. Requiring `activation.includes(
  // conventionRef)` was not enough: the shipped agent template names the config three times — once in
  // the load step and twice inside the quoted "Configuration Error" boilerplate — so an agent whose
  // LOAD instruction is unprefixed still contained the prefixed string, and passed. That is T214's
  // own outcome (an agent resolving its config against the directory it was activated from), and it
  // is the shape BMB produces when it substitutes the value it was handed and copies the boilerplate
  // verbatim. Found by R1, 2026-09-26.
  // The boundary and the flags, both of which cut in two directions — stating only the benefit is how
  // the last two rounds' findings got written.
  //
  // `(?![\w\-])(?!\.[A-Za-z0-9])` — no word character, hyphen, or dot-then-alphanumeric may follow.
  // That rejects `config.yaml.bak` / `.tmpl` (a file that need not even exist) while still MATCHING a
  // sentence-terminating `config.yaml.`, which a blanket `(?![\w.\-])` swallowed: the occurrence went
  // unseen, so a bare reference ending a sentence passed the check and a correctly prefixed one read as
  // "not referenced". Both demonstrated by R3, 2026-09-26.
  //
  // `gi` — matching is case-insensitive because a case-drifted path resolves on a case-insensitive
  // filesystem, so the reference must be SEEN. But seeing it is not accepting it: `exactCase` below
  // requires the matched text to equal the expected tail byte for byte, because the package ships to
  // Linux, where `_BMAD/…` does not resolve at all. Matching case-insensitively and asserting
  // case-sensitively is the pairing; `gi` alone silently blessed `{project-root}/_BMAD/…`.
  const occurrences = configRefUsable
    ? [...activation.matchAll(new RegExp(
      `${expectedConfigRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w\\-])(?!\\.[A-Za-z0-9])`, 'gi'))]
    : [];
  const prefixed = (m) => activation.slice(0, m.index).endsWith('{project-root}/');
  // Line numbers, because "appears 2 time(s)" in a block with three references is eyeball work, and a
  // wrong first try means deleting the generated config and module-help.csv before re-running §5a/§5b.
  const lineOf = (m) => activation.slice(0, m.index).split('\n').length;
  const where = (list) => (list.length > 0
    ? ` (activation-block line${list.length > 1 ? 's' : ''} ${list.map(lineOf).join(', ')})`
    : '');
  const bare = occurrences.filter((m) => !prefixed(m));
  // Prefixed but spelled with different case: seen because of `gi`, rejected because the package ships
  // to case-sensitive filesystems where it does not resolve.
  const caseDrifted = occurrences.filter((m) => prefixed(m) && m[0] !== expectedConfigRef);
  const configPathValid = configRefUsable
    && occurrences.length > 0
    && bare.length === 0
    && caseDrifted.length === 0;
  // A near miss is reported as one: `{PROJECT-ROOT}/`, `{project-root}//`, `{project-root}/./` and a
  // prefix wrapped onto the previous line all leave an unprefixed occurrence, and telling their author
  // to "add the prefix" tells them to write what they think they wrote.
  // Split, not merged: `bare.some(...)` reported every bare occurrence as a near miss, so a block with
  // one `{PROJECT-ROOT}/` and one prefix-less reference told the author to "check case" about both.
  const nearMisses = bare.filter((m) => /\{\s*project[-_ ]?root\s*\}[/.\\]*\s*$/i.test(activation.slice(0, m.index)));
  const noPrefix = bare.filter((m) => !nearMisses.includes(m));
  checks.push({
    check: 'Config path reference',
    passed: configPathValid,
    detail: configPathValid
      ? undefined
      : !configRefUsable
        ? `moduleConfig.configPath ("${moduleConfig.configPath}") cannot identify a module — expected a path ending in .../config.yaml`
        : occurrences.length === 0
          ? `Expected reference to "${conventionRef}" not found in activation block`
          : [
            noPrefix.length > 0
              ? `${noPrefix.length} reference(s)${where(noPrefix)} name "${expectedConfigRef}" with no "{project-root}/" prefix — a relative one resolves against the directory the agent is activated from, an absolute one is not portable between checkouts`
              : '',
            nearMisses.length > 0
              ? `${nearMisses.length} reference(s)${where(nearMisses)} carry a prefix that is not exactly "{project-root}/" — check case, doubled or "./" segments, and a prefix wrapped onto the previous line`
              : '',
            caseDrifted.length > 0
              ? `${caseDrifted.length} reference(s)${where(caseDrifted)} are prefixed but spell the path with different case, which does not resolve on a case-sensitive filesystem`
              : '',
          ].filter(Boolean).join('; ') + `. Every occurrence must read "${conventionRef}"`
  });
  if (!configPathValid) {
    errors.push(!configRefUsable
      ? `Unusable moduleConfig.configPath "${moduleConfig.configPath}" — expected a path ending in .../config.yaml`
      : checks[checks.length - 1].detail);
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
