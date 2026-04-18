#!/usr/bin/env node

const fs = require('fs-extra');
const yaml = require('js-yaml');
const YAML = require('yaml'); // Comment-preserving YAML library (ag-7-1: I29). Used by mergeConfig + writeConfig to preserve comments across the merge round-trip.
const { AGENT_IDS, WORKFLOW_NAMES } = require('./agent-registry');
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
 * Merge current config with new template while preserving user preferences.
 * Agents and workflows use smart-merge: canonical entries in registry order
 * first, then any user-added entries (not in AGENT_IDS/WORKFLOW_NAMES)
 * appended and deduplicated.
 *
 * @param {string} currentConfigPath - Path to current config.yaml
 * @param {string} newVersion - New version to set
 * @param {object} updates - Updates to apply (agents, workflows, etc.)
 * @returns {Promise<object>} Merged config object (with hidden Document sentinel for comment preservation)
 */
async function mergeConfig(currentConfigPath, newVersion, updates = {}) {
  assertVersion(newVersion, 'config-merger'); // ag-7-1: I30 — fail fast on undefined/null/empty version

  let current = {};
  let doc = null; // YAML.Document for comment preservation

  // Read current config if it exists
  if (fs.existsSync(currentConfigPath)) {
    try {
      const currentContent = fs.readFileSync(currentConfigPath, 'utf8');
      doc = YAML.parseDocument(currentContent);
      // Note: YAML.parseDocument does not throw on syntax errors — check doc.errors
      if (doc.errors && doc.errors.length > 0) {
        console.warn(`Warning: Could not parse current config.yaml (${doc.errors[0].message}), using defaults`);
        current = {};
        doc = null;
      } else {
        const parsed = doc.toJSON();
        current = (parsed && typeof parsed === 'object') ? parsed : {};
      }
    } catch (_error) {
      console.warn('Warning: Could not parse current config.yaml, using defaults');
      current = {};
      doc = null;
    }
  }

  // Extract user preferences
  const userPrefs = extractUserPreferences(current);

  // Seed with required structural defaults for fresh installs
  const defaults = {
    submodule_name: '_vortex',
    description: 'Vortex Pattern - Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, and Systematize streams',
    module: 'bme',
    output_folder: '{project-root}/_bmad-output/vortex-artifacts',
    agents: [...AGENT_IDS],
    workflows: [...WORKFLOW_NAMES]
  };

  // Start with defaults, overlay current config (preserves existing values)
  const merged = { ...defaults, ...current };

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
      ? [...new Set(current.agents.filter(a => !AGENT_IDS.includes(a)))]
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
      ? [...new Set(current.workflows.filter(w => !WORKFLOW_NAMES.includes(w)))]
      : [];
    merged.workflows = [...updates.workflows, ...userWorkflows];
  }

  // Preserve user preferences
  Object.assign(merged, userPrefs);

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
 * @returns {object} User preferences
 */
function extractUserPreferences(config) {
  const prefs = {};

  // Preserve these fields if they exist and are not default placeholders
  if (config.user_name && config.user_name !== '{user}') {
    prefs.user_name = config.user_name;
  }

  if (config.communication_language) {
    prefs.communication_language = config.communication_language;
  }

  if (config.output_folder && config.output_folder !== '{project-root}/_bmad-output/vortex-artifacts') {
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
    validate: v => /^\d+\.\d+\.\d+$/.test(v) ? null : `Invalid version format: ${v} (expected x.x.x)` },
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
    try {
      const existingContent = fs.readFileSync(configPath, 'utf8');
      const reparsed = YAML.parseDocument(existingContent);
      if (!reparsed.errors || reparsed.errors.length === 0) {
        doc = reparsed;
      }
      // If parse fails, fall through to the bare-object path silently —
      // the caller is writing a known-good structure either way.
    } catch (_err) {
      // Silent — fall through to bare-object path.
    }
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
  mergeConfig,
  readExcludedAgents,
  extractUserPreferences,
  validateConfig,
  writeConfig,
  addMigrationHistory
};
