#!/usr/bin/env node

const fs = require('fs-extra');
const yaml = require('js-yaml');
const YAML = require('yaml'); // Comment-preserving YAML library (ag-7-1: I29). Used by mergeConfig + writeConfig to preserve comments across the merge round-trip.
const { AGENT_IDS, WORKFLOW_NAMES, GYRE_AGENT_IDS, GYRE_WORKFLOW_NAMES } = require('./agent-registry');
const { assertVersion } = require('./utils');

/**
 * Config Merger for Convoke
 * Smart YAML merging preserving user settings
 *
 * ag-7-1 (I29): mergeConfig now returns a sentinel-tagged structure that carries
 * the parsed YAML.Document alongside the merged plain-object form. writeConfig
 * detects the sentinel and writes via the Document API (preserving comments) when
 * possible, falling back to js-yaml.dump for backwards compatibility with any
 * caller that passes a bare object.
 */

const MERGED_DOC_SENTINEL = Symbol.for('convoke.config-merger.docMerged');

/**
 * Per-module structural defaults and canonical lists for the modules merged through `mergeConfig`.
 *
 * fic-1-1 (BUG-22). `mergeConfig` used to hold one Vortex-shaped set of defaults and judged
 * "user-added" agents against Vortex's lists, while `refresh-installation.js` called it for Gyre
 * too. A fresh 4.0.2 install therefore wrote configs with no `user_name`/`communication_language`
 * (Isla, Liam, Noah, Max and all four Gyre agents stop without them), seeded Gyre with Vortex's
 * identity, and doubled Gyre's lists on its first update (they then stayed doubled).
 *
 * `user_name` and `communication_language` are defaults because the agents require the keys to be
 * present; the installer then tells the operator to replace `{user}`. `submodule_name`, `module`,
 * `output_folder`, `user_name` and `communication_language` are pinned to the shipped templates by
 * `tests/unit/config-merger-module-profiles.test.js`; `description` is not, because the Vortex
 * template's copy is stale (IN-208). The lists are frozen copies, so the export cannot mutate the
 * registry.
 */
const MODULE_PROFILES = Object.freeze({
  _vortex: Object.freeze({
    defaults: Object.freeze({
      submodule_name: '_vortex',
      description: 'Vortex Pattern - Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, and Systematize streams',
      module: 'bme',
      output_folder: '{project-root}/_bmad-output/vortex-artifacts',
      user_name: '{user}',
      communication_language: 'en'
    }),
    agentIds: Object.freeze([...AGENT_IDS]),
    workflowNames: Object.freeze([...WORKFLOW_NAMES])
  }),
  _gyre: Object.freeze({
    defaults: Object.freeze({
      submodule_name: '_gyre',
      description: 'Gyre Pattern - Production readiness discovery through stack analysis, contextual model generation, and absence detection',
      module: 'bme',
      output_folder: '{project-root}/_bmad-output/gyre-artifacts',
      user_name: '{user}',
      communication_language: 'en'
    }),
    agentIds: Object.freeze([...GYRE_AGENT_IDS]),
    workflowNames: Object.freeze([...GYRE_WORKFLOW_NAMES])
  })
});

/**
 * Read `excluded_agents` from a module's config.yaml without going through the
 * full merge path. Used by refresh-installation and validator to skip copying
 * / checking agents the operator has opted out of. U8: permanent agent
 * exclusions that survive upgrades.
 *
 * @param {string} configPath - Absolute path to module config.yaml
 * @returns {string[]} Array of excluded agent IDs (empty if missing, malformed, or not an array)
 */
function readExcludedAgents(configPath) {
  let content;
  try {
    content = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    // ENOENT is expected on fresh installs (config hasn't been written yet).
    // Other IO errors (EACCES, EISDIR, EMFILE, ...) indicate a real misconfiguration —
    // warn so the operator knows their exclusions won't be applied this run. Never throw:
    // this reader must not break the install flow.
    if (err && err.code !== 'ENOENT') {
      console.warn(`Warning: could not read ${configPath} for excluded_agents (${err.code || err.message}). Proceeding without exclusions.`);
    }
    return [];
  }
  try {
    const parsed = yaml.load(content);
    if (parsed && Array.isArray(parsed.excluded_agents)) {
      return parsed.excluded_agents.filter(a => typeof a === 'string');
    }
  } catch (err) {
    console.warn(`Warning: could not parse ${configPath} for excluded_agents (${err.message}). Proceeding without exclusions.`);
  }
  return [];
}

/**
 * Read an existing module config as a YAML Document, or refuse to touch it.
 *
 * fic-1-1. Returns the Document, or null when the file does not exist. Throws
 * `refusing to overwrite <path>` when the file is not something every reader in this package
 * accepts: a yaml parse error (including a duplicate key), a document that is not a mapping, one
 * yaml cannot convert (e.g. more than 100 aliases), or one js-yaml rejects (the doctor, the
 * version detector and `readExcludedAgents` read with js-yaml). A document of just `null` is
 * treated as empty.
 *
 * @param {string} configPath
 * @returns {YAML.Document|null}
 */
function readConfigDocument(configPath) {
  if (!fs.existsSync(configPath)) return null;
  const content = fs.readFileSync(configPath, 'utf8');
  const firstLine = (message) => String(message).split('\n')[0];
  const refuse = (why) =>
    new Error(`config-merger: refusing to overwrite ${configPath}: ${why}. Fix or remove the file, then re-run.`);

  const doc = YAML.parseDocument(content);
  if (doc.errors && doc.errors.length > 0) {
    throw refuse(`it is not valid YAML (${firstLine(doc.errors[0].message)})`);
  }
  if (YAML.isScalar(doc.contents) && doc.contents.value === null) {
    doc.contents = null;
  }
  if (doc.contents !== null && !YAML.isMap(doc.contents)) {
    throw refuse('it is not a YAML mapping');
  }
  try {
    doc.toJS();
  } catch (err) {
    throw refuse(`it cannot be read (${firstLine(err.message)})`);
  }
  try {
    yaml.load(content);
  } catch (err) {
    throw refuse(`it is not valid YAML (${firstLine(err.message)})`);
  }
  return doc;
}

/**
 * Refuse, before anything is copied, a module config an update could not write back.
 *
 * fic-1-1. `refreshInstallation` copies agents, workflows and other modules before it merges the
 * Vortex and Gyre configs, so a refusal at write time left a mixed-version tree. Calling this
 * first makes the refusal happen while nothing has changed.
 *
 * @param {string} configPath
 * @returns {string} configPath, unchanged, so it can wrap an existing call
 */
function assertConfigReadable(configPath) {
  readConfigDocument(configPath);
  return configPath;
}

/**
 * Merge current config with new template while preserving user preferences.
 * Agents and workflows use smart-merge: canonical entries in registry order
 * first, then any user-added entries (not in AGENT_IDS/WORKFLOW_NAMES)
 * appended and deduplicated.
 *
 * @param {string} currentConfigPath - Path to current config.yaml
 * @param {string} newVersion - New version to set
 * @param {object} updates - Updates to apply (agents, workflows, etc.)
 * @param {object} [options]
 * @param {string} [options.submodule='_vortex'] - Which MODULE_PROFILES entry supplies defaults and canonical lists.
 *   Omitting it on a config that names another known module throws rather than stamping Vortex onto it.
 * @returns {Promise<object>} Merged config object (with hidden Document sentinel for comment preservation)
 */
async function mergeConfig(currentConfigPath, newVersion, updates = {}, options = {}) {
  assertVersion(newVersion, 'config-merger'); // ag-7-1: I30 — fail fast on undefined/null/empty version
  const requested = (options || {}).submodule;
  const submodule = requested === undefined ? '_vortex' : requested;
  // Own-property lookup: `MODULE_PROFILES.constructor` would otherwise resolve through the prototype.
  const hasProfile = (name) => typeof name === 'string' && Object.prototype.hasOwnProperty.call(MODULE_PROFILES, name);
  const profile = hasProfile(submodule) ? MODULE_PROFILES[submodule] : undefined;
  if (!profile) {
    throw new Error(
      `config-merger: unknown submodule "${String(submodule)}" (known: ${Object.keys(MODULE_PROFILES).join(', ')})`
    );
  }

  let current;
  let doc; // YAML.Document for comment preservation (null for a fresh or unreadable file)

  // Read current config if it exists. An unreadable file yields defaults here (the merged result
  // is still well-formed), and `writeConfig` then refuses to write over it (fic-1-1).
  try {
    doc = readConfigDocument(currentConfigPath);
    const parsed = doc ? doc.toJS() : null;
    current = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (error) {
    console.warn(`Warning: ${error.message}`);
    current = {};
    doc = null;
  }

  // fic-1-1: the default submodule is a convenience for Vortex callers, never a guess about a file
  // that says it belongs to another module. Stamping Vortex identity onto a Gyre config is the
  // BUG-22 corruption, so refuse and make the caller say which profile applies.
  if (requested === undefined && hasProfile(current.submodule_name) && current.submodule_name !== submodule) {
    throw new Error(
      `config-merger: ${currentConfigPath} is a ${current.submodule_name} config; pass { submodule: '${current.submodule_name}' }`
    );
  }

  // Extract user preferences
  const userPrefs = extractUserPreferences(current, profile.defaults);

  // Seed with required structural defaults for fresh installs
  const defaults = {
    ...profile.defaults,
    agents: [...profile.agentIds],
    workflows: [...profile.workflowNames]
  };

  // Start with defaults, overlay current config (preserves existing values)
  const merged = { ...defaults, ...current };
  // fic-1-1: a key that is present but empty (`user_name:` or `user_name: ''`) is as unusable to an
  // agent as a missing one, so it takes the default too.
  for (const key of Object.keys(profile.defaults)) {
    if (merged[key] === null || merged[key] === '') {
      merged[key] = profile.defaults[key];
    }
  }

  // Update version (system field)
  merged.version = newVersion;

  // Smart-merge agents: canonical agents in order, then unique user-added agents appended.
  // Core agents are always restored to canonical order. User-added agents (not in AGENT_IDS)
  // are preserved and deduplicated.
  //
  // U8: respect `excluded_agents` — an operator-maintained opt-out list. Agents named in that
  // list are filtered out of the active `agents` array so deliberate removals survive upgrades.
  // Re-inclusion works by removing the agent from `excluded_agents` — the next merge restores
  // it via the canonical spread above.
  const excludedAgents = Array.isArray(current.excluded_agents)
    ? current.excluded_agents.filter(a => typeof a === 'string')
    : [];
  if (updates.agents) {
    const userAgents = Array.isArray(current.agents)
      ? [...new Set(current.agents.filter(a => !profile.agentIds.includes(a)))]
      : [];
    merged.agents = [...updates.agents, ...userAgents];
  }
  // Apply exclusions to merged.agents regardless of whether `updates.agents` was provided —
  // otherwise callers that pass empty updates (e.g., a workflows-only migration delta) would
  // leak excluded agents back via the `defaults` spread at line 96.
  if (excludedAgents.length > 0 && Array.isArray(merged.agents)) {
    merged.agents = merged.agents.filter(a => !excludedAgents.includes(a));
  }
  // Preserve the exclusion list as a first-class field (empty stays empty — the schema default).
  merged.excluded_agents = excludedAgents;

  // Smart-merge workflows: canonical workflows in order, then unique user-added appended
  if (updates.workflows) {
    const userWorkflows = Array.isArray(current.workflows)
      ? [...new Set(current.workflows.filter(w => !profile.workflowNames.includes(w)))]
      : [];
    merged.workflows = [...updates.workflows, ...userWorkflows];
  }

  // Preserve user preferences
  Object.assign(merged, userPrefs);

  // fic-1-1 (BUG-22b): identity. `submodule_name` and `module` name the directory the file lives
  // in, so they are never an operator preference. `description` and `output_folder` are the other
  // two fields a Vortex-seeded Gyre config received: a value equal to ANOTHER module's exact
  // default is that corruption, whatever `submodule_name` now says (an operator may have fixed
  // that line by hand). Any other value, including an edited one, is kept.
  for (const [name, other] of Object.entries(MODULE_PROFILES)) {
    if (name === submodule) continue;
    for (const field of ['description', 'output_folder']) {
      if (merged[field] === other.defaults[field]) {
        console.warn(`Repaired ${field} in ${currentConfigPath}: it held the ${name} default`);
        merged[field] = profile.defaults[field];
      }
    }
  }
  merged.submodule_name = profile.defaults.submodule_name;
  merged.module = profile.defaults.module;

  // Ensure migration_history exists
  if (!merged.migration_history) {
    merged.migration_history = [];
  }

  // ag-7-1 (I29): attach the Document for comment-preserving writes.
  // writeConfig detects the sentinel and writes via doc.toString() when set;
  // otherwise it falls back to js-yaml.dump (backwards compat).
  if (doc) {
    Object.defineProperty(merged, MERGED_DOC_SENTINEL, {
      value: doc,
      enumerable: false,
      writable: false,
      configurable: false
    });
  }

  return merged;
}

/**
 * Extract user-specific preferences from config
 * @param {object} config - Config object
 * @param {object} [defaults] - The module's structural defaults; a value equal to its default is not a preference
 * @returns {object} User preferences
 */
function extractUserPreferences(config, defaults) {
  defaults = defaults || MODULE_PROFILES._vortex.defaults;
  const prefs = {};

  // Preserve these fields if they exist and are not default placeholders
  if (config.user_name && config.user_name !== '{user}') {
    prefs.user_name = config.user_name;
  }

  if (config.communication_language) {
    prefs.communication_language = config.communication_language;
  }

  if (config.output_folder && config.output_folder !== defaults.output_folder) {
    prefs.output_folder = config.output_folder;
  }

  if (Object.prototype.hasOwnProperty.call(config, 'party_mode_enabled')) {
    prefs.party_mode_enabled = config.party_mode_enabled;
  }

  if (config.migration_history) {
    prefs.migration_history = config.migration_history;
  }

  return prefs;
}

/**
 * Declarative config schema.
 * Each entry declares a field's type, whether it's required, and an optional
 * validation function that receives the value and returns an error string or null.
 */
const CONFIG_SCHEMA = [
  { field: 'submodule_name', type: 'string', required: true },
  { field: 'description',   type: 'string', required: true },
  { field: 'module',        type: 'string', required: true },
  { field: 'version',       type: 'string', required: true,
    validate: v => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(v) ? null : `Invalid version format: ${v} (expected semver x.x.x or x.x.x-prerelease)` },
  { field: 'output_folder', type: 'string', required: true },
  { field: 'agents',        type: 'array',  required: true, items: 'string' },
  { field: 'workflows',     type: 'array',  required: true, items: 'string' },
  { field: 'communication_language', type: 'string',  required: false },
  { field: 'party_mode_enabled',     type: 'boolean', required: false },
  { field: 'migration_history',      type: 'array',   required: false,
    validate: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        const e = arr[i];
        if (!e.timestamp || !e.from_version || !e.to_version) {
          return `migration_history[${i}] missing required fields`;
        }
      }
      return null;
    }},
];

/**
 * Validate merged config structure
 * @param {object} config - Config to validate
 * @returns {object} Validation result { valid: boolean, errors: [] }
 */
function validateConfig(config) {
  const errors = [];

  for (const rule of CONFIG_SCHEMA) {
    const has = Object.prototype.hasOwnProperty.call(config, rule.field);

    if (!has) {
      if (rule.required) errors.push(`Missing required field: ${rule.field}`);
      continue;
    }

    const value = config[rule.field];

    // Type check
    if (rule.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${rule.field} must be an array`);
        continue;
      }
      // Item type check
      if (rule.items) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== rule.items) {
            errors.push(`${rule.field}[${i}] must be a ${rule.items}`);
          }
        }
      }
    } else if (typeof value !== rule.type) {
      errors.push(`${rule.field} must be a ${rule.type}`);
      continue;
    }

    // Custom validation
    if (rule.validate) {
      const err = rule.validate(value);
      if (err) errors.push(err);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Write config to file.
 * If the config object carries the merged-doc sentinel from mergeConfig (ag-7-1),
 * write via the Document API to preserve comments. Otherwise fall back to
 * js-yaml.dump for backwards compatibility.
 *
 * @param {string} configPath - Path to write config
 * @param {object} config - Config object (optionally carrying a Document sentinel)
 * @returns {Promise<void>}
 */
async function writeConfig(configPath, config) {
  // ag-7-1 (I29) — Comment preservation paths, in order of preference:
  //
  // 1. SENTINEL PATH: caller went through `mergeConfig` which attached the parsed
  //    Document via the MERGED_DOC_SENTINEL symbol. Use it directly. The sentinel
  //    contract guarantees `merged` is a complete config (mergeConfig produces a
  //    full structure), so it's safe to delete keys from the Document that aren't
  //    in `merged` (e.g., a removed user field).
  // 2. SELF-HEAL PATH: caller passed a bare object (e.g., `migration-runner.js`'s
  //    `updateMigrationHistory` calling `addMigrationHistory` then `writeConfig`)
  //    AND the destination file exists. Re-parse the existing file as a Document
  //    so any comments inside it survive the rewrite. CRITICAL: in the self-heal
  //    path, we ONLY apply additive/update operations (doc.set for each key the
  //    caller knows about) — we do NOT delete keys the caller doesn't mention,
  //    because the bare-object caller may not know about every field on disk
  //    (e.g., a future caller passing `{ version: '4.0.0' }` to update only the
  //    version would otherwise wipe out every other top-level field).
  // 3. FALLBACK PATH: bare object + no existing destination file (fresh install).
  //    No comments to preserve. Use js-yaml.dump for backwards compatibility.
  //
  // CONTRACT NOTE: callers should not reuse the same `merged` object across multiple
  // `writeConfig` calls. The Document reference inside the sentinel is mutated on
  // write, so a second call would see an already-mutated Document instead of the
  // originally parsed state. This is fine for current callers (refresh-installation
  // calls writeConfig once per merged result) but document the constraint for
  // future maintainers.
  const sentinelDoc = config[MERGED_DOC_SENTINEL];
  let doc = sentinelDoc;
  const isSentinelPath = !!sentinelDoc;

  if (!doc && fs.existsSync(configPath)) {
    // Self-heal: re-parse the existing file so its comments survive the rewrite.
    //
    // fic-1-1: an existing file that cannot be read is NEVER overwritten. This used to fall through
    // to `yaml.dump`, so a config with one duplicate key (an operator adding `user_name: Pat` below
    // the installer's `user_name: '{user}'` line) was silently replaced by defaults on the next
    // update, losing every operator value. `mergeConfig` still returns defaults for such a file;
    // `readConfigDocument` refuses here, and `refreshInstallation` calls it before copying anything.
    doc = readConfigDocument(configPath);
  }

  let yamlContent;
  if (doc) {
    // Comment-preserving path: sync the merged structure into the Document via per-field
    // doc.set() calls. Replacing doc.contents wholesale would blow away comments attached
    // to the top-level mapping (e.g., header comments above the first key).
    // Per-field updates preserve all comment metadata anchored to the document or to fields.
    const merged = stripSentinel(config);

    // Update existing fields and add new ones
    for (const key of Object.keys(merged)) {
      doc.set(key, merged[key]);
    }

    // Remove keys that were in the original doc but are no longer in the merged structure.
    // ONLY do this on the SENTINEL path — `mergeConfig` produces a complete config so any
    // missing key was intentionally removed. On the SELF-HEAL path the caller is a legacy
    // bare-object caller that may not know about every on-disk field, so deleting unknown
    // keys would silently destroy user data.
    if (isSentinelPath && doc.contents && typeof doc.contents.items !== 'undefined') {
      const mergedKeys = new Set(Object.keys(merged));
      const docKeys = doc.contents.items.map(item => String(item.key.value));
      for (const docKey of docKeys) {
        if (!mergedKeys.has(docKey)) {
          doc.delete(docKey);
        }
      }
    }

    yamlContent = doc.toString({ lineWidth: 0 });
  } else {
    // Backwards-compat path: bare object, no existing file, no comments to preserve.
    yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: -1, // Don't wrap long lines
      noRefs: true
    });
  }

  await fs.writeFile(configPath, yamlContent, 'utf8');
}

/**
 * Return a plain-object copy of config with the sentinel symbol stripped,
 * so doc.createNode doesn't try to serialize it.
 * @param {object} config
 * @returns {object}
 */
function stripSentinel(config) {
  // Symbol-keyed properties are not enumerable in our case (defineProperty above),
  // but as a safety net we explicitly clone only string-keyed enumerable fields.
  const plain = {};
  for (const key of Object.keys(config)) {
    plain[key] = config[key];
  }
  return plain;
}

/**
 * Add migration history entry
 * @param {object} config - Config object
 * @param {string} fromVersion - Version migrating from
 * @param {string} toVersion - Version migrating to
 * @param {Array<string>} migrationsApplied - List of migration names applied
 * @returns {object} Updated config
 */
function addMigrationHistory(config, fromVersion, toVersion, migrationsApplied) {
  if (!config.migration_history) {
    config.migration_history = [];
  }

  config.migration_history.push({
    timestamp: new Date().toISOString(),
    from_version: fromVersion,
    to_version: toVersion,
    migrations_applied: migrationsApplied
  });

  return config;
}

module.exports = {
  CONFIG_SCHEMA,
  MODULE_PROFILES,
  assertConfigReadable,
  mergeConfig,
  readExcludedAgents,
  extractUserPreferences,
  validateConfig,
  writeConfig,
  addMigrationHistory
};
