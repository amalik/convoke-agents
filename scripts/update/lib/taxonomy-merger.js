const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Platform-canonical taxonomy defaults.
 * Mirrors migrate-artifacts.js constants (separate module boundary).
 */
const PLATFORM_INITIATIVES = ['vortex', 'gyre', 'bmm', 'forge', 'helm', 'enhance', 'loom', 'convoke'];

const DEFAULT_ARTIFACT_TYPES = [
  'prd', 'epic', 'arch', 'adr', 'persona', 'lean-persona', 'empathy-map',
  'problem-def', 'hypothesis', 'experiment', 'signal', 'decision', 'scope',
  'pre-reg', 'sprint', 'brief', 'vision', 'report', 'research', 'story', 'spec'
];

const DEFAULT_ALIASES = {
  'strategy-perimeter': 'helm',
  'strategy': 'helm',
  'strategic': 'helm',
  'strategic-navigator': 'helm',
  'strategic-practitioner': 'helm',
  'team-factory': 'loom'
};

const TAXONOMY_HEADER = [
  '# Artifact Governance Taxonomy Configuration',
  '# Schema version: 1',
  '# Managed by: convoke-update taxonomy merger',
  '#',
  '# This file is the single source of truth for initiative IDs, artifact types,',
  '# and historical name aliases used by the governance system.',
  ''
].join('\n');

/**
 * Create or merge taxonomy.yaml with platform defaults.
 * Idempotent: safe to run multiple times.
 *
 * - If absent: creates with platform defaults
 * - If present: merges platform entries (adds missing, preserves user additions)
 * - Promotes user initiative IDs to platform when they match (FR42)
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<{created: boolean, merged: boolean, promoted: string[]}>}
 */
async function mergeTaxonomy(projectRoot) {
  const configDir = path.join(projectRoot, '_bmad', '_config');
  const configPath = path.join(configDir, 'taxonomy.yaml');

  await fs.ensureDir(configDir);

  // If no taxonomy exists, create from scratch
  if (!await fs.pathExists(configPath)) {
    const defaults = {
      initiatives: { platform: [...PLATFORM_INITIATIVES], user: [] },
      artifact_types: [...DEFAULT_ARTIFACT_TYPES],
      aliases: { ...DEFAULT_ALIASES }
    };
    await fs.writeFile(configPath, TAXONOMY_HEADER + yaml.dump(defaults, { lineWidth: -1 }), 'utf8');
    return { created: true, merged: false, promoted: [] };
  }

  // Read existing taxonomy (handle corrupt YAML gracefully, matching config-merger pattern)
  const content = await fs.readFile(configPath, 'utf8');
  let existing;
  try {
    existing = yaml.load(content) || {};
  } catch {
    console.warn('Warning: taxonomy.yaml contains invalid YAML. Treating as empty and merging defaults.');
    existing = {};
  }

  // Ensure structure
  if (!existing.initiatives) existing.initiatives = {};
  if (!Array.isArray(existing.initiatives.platform)) existing.initiatives.platform = [];
  if (!Array.isArray(existing.initiatives.user)) existing.initiatives.user = [];
  if (!Array.isArray(existing.artifact_types)) existing.artifact_types = [];
  if (!existing.aliases || typeof existing.aliases !== 'object') existing.aliases = {};

  let merged = false;
  const promoted = [];

  // Merge platform initiatives (add missing)
  const platformSet = new Set(existing.initiatives.platform);
  for (const id of PLATFORM_INITIATIVES) {
    if (!platformSet.has(id)) {
      existing.initiatives.platform.push(id);
      merged = true;
    }
  }

  // Promote user IDs that match platform (FR42)
  const date = new Date().toISOString().split('T')[0];
  const newPlatformSet = new Set(existing.initiatives.platform);
  existing.initiatives.user = existing.initiatives.user.filter(userId => {
    if (newPlatformSet.has(userId)) {
      promoted.push(userId);
      return false; // Remove from user (already in platform)
    }
    return true;
  });

  // Merge artifact types (add missing)
  const typeSet = new Set(existing.artifact_types);
  for (const type of DEFAULT_ARTIFACT_TYPES) {
    if (!typeSet.has(type)) {
      existing.artifact_types.push(type);
      merged = true;
    }
  }

  // Merge aliases (add missing, don't overwrite existing)
  for (const [key, value] of Object.entries(DEFAULT_ALIASES)) {
    if (!(key in existing.aliases)) {
      existing.aliases[key] = value;
      merged = true;
    }
  }

  // Write back if changes were made
  if (merged || promoted.length > 0) {
    let output = TAXONOMY_HEADER + yaml.dump(existing, { lineWidth: -1 });

    // Add promotion comments
    if (promoted.length > 0) {
      for (const id of promoted) {
        output += `# ${id}: promoted from user section on ${date}\n`;
      }
    }

    await fs.writeFile(configPath, output, 'utf8');
  }

  return { created: false, merged: merged || promoted.length > 0, promoted };
}

module.exports = { mergeTaxonomy, PLATFORM_INITIATIVES, DEFAULT_ARTIFACT_TYPES, DEFAULT_ALIASES };
