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
  // Track the failure explicitly rather than re-deriving parseability later from a DIFFERENT
  // parser. `YAML.parseDocument` is more permissive than js-yaml — an unknown local tag
  // (`custom: !mytag foo`) makes js-yaml throw while parseDocument reports zero errors. Deriving
  // "is this file OK?" from parseDocument therefore ran the in-place merge against
  // `existing = {}`, and the promotion loop deleted every operator entry in `initiatives.user`
  // as "not present in existing". Verified: `user: [my-precious-initiative]` -> `user: []`, with
  // `promoted: []` so nothing recorded it. (Review 2026-08-15.)
  let parseFailed = false;
  try {
    existing = yaml.load(content) || {};
  } catch {
    console.warn('Warning: taxonomy.yaml contains invalid YAML. Treating as empty and merging defaults.');
    existing = {};
    parseFailed = true;
  }

  // Ensure structure.
  //
  // Coerce a non-object root first. `yaml.load('just a string')` returns a STRING, which is
  // truthy, so `existing.initiatives = {}` was a silent no-op on a primitive and the next line
  // dereferenced `undefined`. A sequence root (`- a`) has the same problem via an Array. Both
  // are plausible for a truncated or half-written file — the most likely corruption there is.
  // Pre-existing (the previous revision threw identically), fixed here because this function is
  // being hardened. (Review 2026-08-15.)
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) existing = {};
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
  // Mutating the parsed Document in place preserves the header, inline and trailing comments,
  // key order, flow-vs-block style, and unknown top-level keys. It does NOT preserve everything:
  // indentation is reflowed to 2 spaces, CRLF becomes LF, and a BOM is stripped, because
  // `doc.toString()` re-emits the whole document. Stated because an earlier version of this
  // comment claimed formatting was preserved outright, which would mislead anyone diffing a
  // 4-space or CRLF file. The write remains guarded — no changes, no write, no churn.
  if (merged || promoted.length > 0) {
    let output = null;

    // In-place mutation is only safe when the Document agrees with the normalised object.
    //
    // `has`/`hasIn` return TRUE for a key whose value is null or a scalar, so the original
    // guards skipped the repair branch and then called `.toJSON()` on a Scalar. Five
    // operator-plausible shapes threw — `user:` empty, `platform:` a scalar, `artifact_types:`
    // empty, `initiatives:` empty, `aliases:` a list — every one of which the previous
    // `yaml.dump(existing)` path handled correctly, because js-yaml normalisation repaired them.
    // A throw here is caught by refreshInstallation, so the install "succeeds" while the taxonomy
    // is NEVER merged again: future platform initiatives and artifact types silently never land.
    // The two migration callers do not guard it at all. (Review 2026-08-15.)
    //
    // An ALIAS is excluded too: `user: *p` aliasing `platform` makes every platform id look
    // promoted on every run, `deleteIn` removes nothing, and the file grows ~400 bytes per
    // update forever (measured 858 -> 1259 -> 1659 across three runs).
    const isUsable = (node, kind) =>
      node === undefined ||
      node === null ||
      (kind === 'seq' ? YAML.isSeq(node) : YAML.isMap(node));

    if (!parseFailed) {
      const doc = YAML.parseDocument(content);
      const nodes = {
        initiatives: doc.get('initiatives', true),
        platform: doc.getIn(['initiatives', 'platform'], true),
        user: doc.getIn(['initiatives', 'user'], true),
        types: doc.get('artifact_types', true),
        aliases: doc.get('aliases', true),
      };
      // The ROOT must be a map. `doc.get`/`getIn` return `undefined` for every key when the
      // root is a sequence or a scalar, so all five node checks passed and `shapeOk` was true —
      // then `doc.set('initiatives', ...)` threw on a YAMLSeq. The gate written to catch bad
      // shapes did not catch the shape it was written for. (Review 2026-08-15.)
      const shapeOk =
        YAML.isMap(doc.contents) &&
        (!doc.errors || doc.errors.length === 0) &&
        isUsable(nodes.initiatives, 'map') &&
        isUsable(nodes.platform, 'seq') &&
        isUsable(nodes.user, 'seq') &&
        isUsable(nodes.types, 'seq') &&
        isUsable(nodes.aliases, 'map');

      if (shapeOk) {
        if (!YAML.isMap(nodes.initiatives)) doc.set('initiatives', doc.createNode({ platform: [], user: [] }));
        if (!YAML.isSeq(doc.getIn(['initiatives', 'platform'], true))) doc.setIn(['initiatives', 'platform'], doc.createNode([]));
        if (!YAML.isSeq(doc.getIn(['initiatives', 'user'], true))) doc.setIn(['initiatives', 'user'], doc.createNode([]));
        if (!YAML.isSeq(doc.get('artifact_types', true))) doc.set('artifact_types', doc.createNode([]));
        if (!YAML.isMap(doc.get('aliases', true))) doc.set('aliases', doc.createNode({}));

        const docPlatform = doc.getIn(['initiatives', 'platform']).toJSON() || [];
        for (const id of existing.initiatives.platform) {
          if (!docPlatform.includes(id)) doc.addIn(['initiatives', 'platform'], id);
        }
        // Promotions REMOVE entries — walk backwards so indices stay valid. Only scalar entries
        // are compared; a non-scalar entry cannot match `existing` by value and was previously
        // deleted as if promoted.
        const userJson = doc.getIn(['initiatives', 'user']).toJSON() || [];
        for (let i = userJson.length - 1; i >= 0; i--) {
          const v = userJson[i];
          const comparable = v === null || typeof v !== 'object';
          if (comparable && !existing.initiatives.user.includes(v)) doc.deleteIn(['initiatives', 'user', i]);
        }
        const docTypes = doc.get('artifact_types').toJSON() || [];
        for (const t of existing.artifact_types) {
          if (!docTypes.includes(t)) doc.addIn(['artifact_types'], t);
        }
        for (const [k, v] of Object.entries(existing.aliases)) {
          if (!doc.hasIn(['aliases', k])) doc.setIn(['aliases', k], v);
        }
        // No TAXONOMY_HEADER: the parsed document already carries the file's leading comments.
        output = doc.toString({ lineWidth: 0 });
      }
    }

    if (output === null) {
      // Fallback: js-yaml could not read it, the Document has errors, or the shape is one the
      // in-place path cannot safely edit. Reserialising from the normalised object REPAIRS the
      // file — the behaviour that shipped before I140 — at the cost of comments.
      //
      // When js-yaml FAILED, `existing` is `{}`, so this rewrite discards whatever the operator
      // had: a file with an unknown local tag (`custom: !mytag foo`) parses fine for
      // parseDocument but throws for js-yaml, and its `initiatives.user` entries are simply
      // gone. That is pre-existing behaviour, not introduced by I140 — but silently overwriting
      // a file you could not read is exactly what `path-safety-for-destructive-ops` exists to
      // prevent, and the same salvage convention is already used for an unusable
      // skill-manifest.csv. Preserve the original beside the repaired file. (Review 2026-08-15.)
      // Salvage before ANY wholesale rewrite, not only when js-yaml failed.
      //
      // The fallback reserialises from `existing`, which the "Ensure structure" normaliser has
      // already reset — so a READABLE file whose shape the in-place path declines (say
      // `user: mine`, a missing `-`, the most plausible hand-edit slip) has that value written
      // out of existence with `merged:true`, no warning, and no copy. Measured against the
      // previous revision: the old code THREW there and the operator's value survived. This
      // "fix" had turned a loud failure into silent data loss — strictly worse. (Review
      // 2026-08-15.)
      //
      // Timestamped, not date-only: two unreadable states on the same day previously had the
      // second salvage overwrite the first, destroying the only surviving copy of the original.
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const salvage = `${configPath}.superseded-${stamp}`;
      try {
        await fs.copy(configPath, salvage, { overwrite: false });
        console.warn(
          `Warning: taxonomy.yaml could not be updated in place (${parseFailed ? 'unparseable' : 'unexpected structure'}); ` +
          `the original is preserved at ${path.basename(salvage)} and the file has been rewritten from platform defaults.`
        );
      } catch (err) {
        console.warn(`Warning: could not preserve the existing taxonomy.yaml (${err.message}); NOT overwriting it.`);
        return { created: false, merged: false, promoted: [], skipped: 'could-not-preserve-original' };
      }
      output = TAXONOMY_HEADER + yaml.dump(existing, { lineWidth: -1 });
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
