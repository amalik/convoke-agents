#!/usr/bin/env node

const fs = require('fs-extra');
const yaml = require('js-yaml');
const { AGENT_IDS, WORKFLOW_NAMES } = require('./agent-registry');

/**
 * Config Merger for BMAD-Enhanced
 * Smart YAML merging preserving user settings
 */

/**
 * Merge current config with new template while preserving user preferences.
 * Agents and workflows use smart-merge: canonical entries in registry order
 * first, then any user-added entries (not in AGENT_IDS/WORKFLOW_NAMES)
 * appended and deduplicated.
 *
 * @param {string} currentConfigPath - Path to current config.yaml
 * @param {string} newVersion - New version to set
 * @param {object} updates - Updates to apply (agents, workflows, etc.)
 * @returns {Promise<object>} Merged config object
 */
async function mergeConfig(currentConfigPath, newVersion, updates = {}) {
  let current = {};

  // Read current config if it exists
  if (fs.existsSync(currentConfigPath)) {
    try {
      const currentContent = fs.readFileSync(currentConfigPath, 'utf8');
      const parsed = yaml.load(currentContent);
      current = (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (_error) {
      console.warn('Warning: Could not parse current config.yaml, using defaults');
      current = {};
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
  // are preserved and deduplicated. Deliberately removed core agents are restored on upgrade.
  if (updates.agents) {
    const userAgents = Array.isArray(current.agents)
      ? [...new Set(current.agents.filter(a => !AGENT_IDS.includes(a)))]
      : [];
    merged.agents = [...updates.agents, ...userAgents];
  }

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
 * Write config to file
 * @param {string} configPath - Path to write config
 * @param {object} config - Config object
 * @returns {Promise<void>}
 */
async function writeConfig(configPath, config) {
  const yamlContent = yaml.dump(config, {
    indent: 2,
    lineWidth: -1, // Don't wrap long lines
    noRefs: true
  });

  await fs.writeFile(configPath, yamlContent, 'utf8');
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
  extractUserPreferences,
  validateConfig,
  writeConfig,
  addMigrationHistory
};
