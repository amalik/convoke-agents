const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
// Comment-preserving writer (ag-7-1: I29), same convention as refresh-installation.js: js-yaml
// for read-only parsing, the `yaml` package's Document API for any WRITE that must not destroy
// operator comments.
const YAML = require('yaml');

/**
 * Platform-canonical taxonomy defaults.
 * Mirrors migrate-artifacts.js constants (separate module boundary).
 */
const PLATFORM_INITIATIVES = ['vortex', 'gyre', 'bmm', 'forge', 'helm', 'enhance', 'loom', 'convoke'];

const DEFAULT_ARTIFACT_TYPES = [
  'prd', 'epic', 'arch', 'adr', 'persona', 'lean-persona', 'empathy-map',
  'problem-def', 'hypothesis', 'experiment', 'signal', 'decision', 'scope',
  'pre-reg', 'sprint', 'brief', 'vision', 'report', 'research', 'story', 'spec',
  'covenant'
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

  // Write back if changes were made.
  //
  // Backlog I140. This used `TAXONOMY_HEADER + yaml.dump(existing)`, which reserialises from a
  // plain object and therefore DISCARDS every comment the operator wrote. taxonomy.yaml
  // explicitly invites operator edits — `initiatives.user` is documented as "Operator-managed.
  // Add custom initiative IDs here" — so the content most likely to carry an explanatory comment
  // is exactly the content this function rewrites.
  //
  // The exposure was widened by I137: before that, `mergeTaxonomy` was reachable only from the
  // 2.0.x->3.1.0 and 3.0.x->3.1.0 migrations (twice, historically). It now runs at the end of
  // every `refreshInstallation()`, so the loss fires on the first refresh after ANY release that
  // adds a platform initiative, artifact type, or alias. Measured, not assumed: a steady-state
  // refresh writes nothing at all (the guard below), so this is once-per-release, not every run.
  //
  // Mutating the parsed Document in place preserves the header, inline comments, key order, and
  // the operator's formatting. The write remains guarded — no changes, no write, no churn.
  if (merged || promoted.length > 0) {
    let output;
    const doc = YAML.parseDocument(content);
    if (doc.errors && doc.errors.length > 0) {
      // Unparseable input already fell back to `existing = {}` above, so there are no comments
      // to preserve and nothing to mutate in place. Reserialise, and re-add the header since the
      // original content is being replaced wholesale.
      output = TAXONOMY_HEADER + yaml.dump(existing, { lineWidth: -1 });
    } else {
      // Re-apply the same merge to the Document. Deriving it from `existing` rather than
      // recomputing keeps one source of truth for what changed.
      if (!doc.has('initiatives')) doc.set('initiatives', doc.createNode({ platform: [], user: [] }));
      if (!doc.hasIn(['initiatives', 'platform'])) doc.setIn(['initiatives', 'platform'], doc.createNode([]));
      if (!doc.hasIn(['initiatives', 'user'])) doc.setIn(['initiatives', 'user'], doc.createNode([]));
      if (!doc.has('artifact_types')) doc.set('artifact_types', doc.createNode([]));
      if (!doc.has('aliases')) doc.set('aliases', doc.createNode({}));

      const docPlatform = doc.getIn(['initiatives', 'platform']).toJSON() || [];
      for (const id of existing.initiatives.platform) {
        if (!docPlatform.includes(id)) doc.addIn(['initiatives', 'platform'], id);
      }
      // Promotions REMOVE entries from user — walk backwards so indices stay valid.
      const docUser = doc.getIn(['initiatives', 'user']);
      const userJson = docUser.toJSON() || [];
      for (let i = userJson.length - 1; i >= 0; i--) {
        if (!existing.initiatives.user.includes(userJson[i])) doc.deleteIn(['initiatives', 'user', i]);
      }
      const docTypes = doc.get('artifact_types').toJSON() || [];
      for (const t of existing.artifact_types) {
        if (!docTypes.includes(t)) doc.addIn(['artifact_types'], t);
      }
      for (const [k, v] of Object.entries(existing.aliases)) {
        if (!doc.hasIn(['aliases', k])) doc.setIn(['aliases', k], v);
      }
      // No TAXONOMY_HEADER here: the parsed document already carries the file's own leading
      // comments. Prepending would duplicate the header on every merge.
      output = doc.toString({ lineWidth: 0 });
    }

    // Add promotion comments
    if (promoted.length > 0) {
      if (!output.endsWith('\n')) output += '\n';
      for (const id of promoted) {
        output += `# ${id}: promoted from user section on ${date}\n`;
      }
    }

    await fs.writeFile(configPath, output, 'utf8');
  }

  return { created: false, merged: merged || promoted.length > 0, promoted };
}

module.exports = { mergeTaxonomy, PLATFORM_INITIATIVES, DEFAULT_ARTIFACT_TYPES, DEFAULT_ALIASES };
