/**
 * Shared artifact utilities for the Convoke governance system.
 * Consumed by: migrate-artifacts.js, portfolio-engine.js, archive.js
 *
 * @module artifact-utils
 * @see types.js for type definitions
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');
const { execSync } = require('child_process');

// --- Constants (extracted from archive.js) ---

/** Valid artifact category prefixes from the ADR naming convention */
const VALID_CATEGORIES = [
  'prd', 'epic', 'arch', 'adr', 'brief', 'report', 'spec', 'vision',
  'hc', 'persona', 'experiment', 'learning', 'sprint', 'decision',
  'research'
];

/** Regex for valid lowercase kebab-case filenames */
const NAMING_PATTERN = /^[a-z][a-z0-9-]*\.(?:md|yaml)$/;

/** Regex to extract date suffix from filenames */
const DATED_PATTERN = /^(.+)-(\d{4}-\d{2}-\d{2})\.(md|yaml)$/;

/** Regex to extract category prefix from filenames */
const CATEGORIZED_PATTERN = /^([a-z]+\d*)-(.+)\.(md|yaml)$/;

// --- Filename Parsing ---

/**
 * Check if a category string is in the valid categories list.
 * Handles numeric suffixes (e.g., 'hc2' → check 'hc').
 * @param {string} cat - Category to validate
 * @returns {boolean}
 */
function isValidCategory(cat) {
  const base = cat.replace(/\d+$/, '');
  return VALID_CATEGORIES.includes(base) || VALID_CATEGORIES.includes(cat);
}

/**
 * Parse a filename to extract naming convention components.
 * Backward compatible — works with or without taxonomy parameter.
 *
 * @param {string} filename - The filename to parse (e.g., 'prd-gyre.md')
 * @param {import('./types').TaxonomyConfig} [taxonomy] - Optional taxonomy for extended initiative inference
 * @returns {import('./types').ParsedFilename}
 */
function parseFilename(filename, _taxonomy) {
  const lower = filename.toLowerCase();
  const dated = lower.match(DATED_PATTERN);
  const categorized = lower.match(CATEGORIZED_PATTERN);

  return {
    filename,
    isDated: !!dated,
    date: dated ? dated[2] : null,
    baseName: dated ? dated[1] : lower.replace(/\.(md|yaml)$/, ''),
    category: categorized ? categorized[1] : null,
    hasValidCategory: categorized ? isValidCategory(categorized[1]) : false,
    isUppercase: filename !== lower,
    matchesConvention: !!(NAMING_PATTERN.test(filename) && categorized && isValidCategory(categorized[1]))
  };
}

/**
 * Convert a filename to lowercase kebab-case.
 * @param {string} filename
 * @returns {string}
 */
function toLowerKebab(filename) {
  return filename.toLowerCase();
}

// --- Directory Scanning ---

/**
 * Scan artifact directories and return file inventory.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {string[]} includeDirs - Directory names to scan (relative to _bmad-output/)
 * @param {string[]} [excludeDirs=['_archive']] - Directory names to exclude from results
 * @returns {Promise<Array<{filename: string, dir: string, fullPath: string}>>}
 */
async function scanArtifactDirs(projectRoot, includeDirs, excludeDirs = ['_archive']) {
  const outputDir = path.join(projectRoot, '_bmad-output');
  const results = [];

  for (const dir of includeDirs) {
    if (excludeDirs.includes(dir)) continue;

    const fullDir = path.join(outputDir, dir);
    if (!await fs.pathExists(fullDir)) continue;

    const files = (await fs.readdir(fullDir)).sort();
    for (const filename of files) {
      if (filename.startsWith('.')) continue;
      const fullPath = path.join(fullDir, filename);
      const stat = await fs.stat(fullPath);
      if (!stat.isFile()) continue;

      results.push({ filename, dir, fullPath });
    }
  }

  return results;
}

// --- Taxonomy ---

/**
 * Load and validate taxonomy configuration.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {import('./types').TaxonomyConfig}
 * @throws {Error} If file not found, malformed YAML, or invalid structure
 */
function readTaxonomy(projectRoot) {
  const configPath = path.join(projectRoot, '_bmad', '_config', 'taxonomy.yaml');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Taxonomy config not found at ${configPath}. ` +
      'Run convoke-migrate-artifacts or convoke-update to create it.'
    );
  }

  let raw;
  try {
    raw = yaml.load(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(
      `Invalid YAML in taxonomy config: ${err.message}. File: ${configPath}`,
      { cause: err }
    );
  }

  // Validate structure
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Taxonomy config is empty or not an object. File: ${configPath}`);
  }

  if (!raw.initiatives || !Array.isArray(raw.initiatives.platform)) {
    throw new Error(
      'Taxonomy config missing required field: initiatives.platform (must be an array). ' +
      `File: ${configPath}`
    );
  }

  if (!Array.isArray(raw.artifact_types)) {
    throw new Error(
      'Taxonomy config missing required field: artifact_types (must be an array). ' +
      `File: ${configPath}`
    );
  }

  // Ensure optional fields have defaults
  const config = {
    initiatives: {
      platform: raw.initiatives.platform || [],
      user: raw.initiatives.user || []
    },
    artifact_types: raw.artifact_types || [],
    aliases: raw.aliases || {}
  };

  // Validate entry format: lowercase alphanumeric with optional dashes
  const idPattern = /^[a-z][a-z0-9-]*$/;
  const allIds = [...config.initiatives.platform, ...config.initiatives.user];

  for (const id of allIds) {
    if (!idPattern.test(id)) {
      throw new Error(
        `Invalid initiative ID "${id}": must be lowercase alphanumeric with optional dashes. ` +
        `File: ${configPath}`
      );
    }
  }

  for (const type of config.artifact_types) {
    if (!idPattern.test(type)) {
      throw new Error(
        `Invalid artifact type "${type}": must be lowercase alphanumeric with optional dashes. ` +
        `File: ${configPath}`
      );
    }
  }

  // Check for duplicates between platform and user
  const platformSet = new Set(config.initiatives.platform);
  for (const userId of config.initiatives.user) {
    if (platformSet.has(userId)) {
      throw new Error(
        `Duplicate initiative ID "${userId}" found in both platform and user sections. ` +
        `File: ${configPath}`
      );
    }
  }

  return config;
}

// --- Frontmatter ---

/**
 * Parse frontmatter from file content.
 *
 * @param {string} fileContent - Raw file content string
 * @returns {{data: Object, content: string}} Parsed frontmatter data and content below
 */
function parseFrontmatter(fileContent) {
  if (typeof fileContent !== 'string') {
    throw new Error('parseFrontmatter expects a string. Ensure files are read with utf8 encoding.');
  }
  try {
    const parsed = matter(fileContent);
    return { data: parsed.data, content: parsed.content };
  } catch (err) {
    throw new Error(`Failed to parse frontmatter: ${err.message}`, { cause: err });
  }
}

/**
 * Inject frontmatter fields into file content.
 * Adds new fields, NEVER overwrites existing fields.
 * Returns conflicts when existing field values differ from proposed values.
 *
 * @param {string} fileContent - Raw file content string
 * @param {Object} newFields - Fields to inject (e.g., {initiative: 'helm', artifact_type: 'prd'})
 * @returns {import('./types').InjectResult} Modified content + any detected conflicts
 */
function injectFrontmatter(fileContent, newFields) {
  const parsed = matter(fileContent);
  const conflicts = [];

  // Detect conflicts: existing field has different value than proposed
  for (const [key, value] of Object.entries(newFields)) {
    if (parsed.data[key] !== undefined && parsed.data[key] !== value) {
      conflicts.push({
        field: key,
        existingValue: parsed.data[key],
        newValue: value
      });
    }
  }

  // Merge: new fields go first (for consistent ordering), existing fields override
  // This means existing values are preserved — newFields only fill gaps
  const merged = { ...newFields, ...parsed.data };

  const content = matter.stringify(parsed.content, merged);
  return { content, conflicts };
}

// --- Git Operations ---

/**
 * Verify the working tree is clean within scope directories.
 * Checks both tracked changes (staged + unstaged) and untracked files in scope.
 *
 * @param {string[]} scopeDirs - Directory names to check (relative to _bmad-output/)
 * @param {string} projectRoot - Absolute path to project root
 * @throws {Error} If working tree is dirty with details of dirty files
 */
function ensureCleanTree(scopeDirs, projectRoot) {
  // Build scoped paths for git diff (forward slashes for git)
  const scopePaths = scopeDirs.map(dir => `_bmad-output/${dir}`);
  const scopeArgs = scopePaths.map(p => `"${p}"`).join(' ');

  // Check tracked changes (staged and unstaged) — scoped to scopeDirs only
  try {
    execSync(`git diff --quiet -- ${scopeArgs}`, { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    let diff = '(unable to list files)';
    try {
      diff = execSync(`git diff --name-only -- ${scopeArgs}`, { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch { /* best-effort */ }
    throw new Error(
      'Working tree has uncommitted changes in scope directories. Commit or stash before running migration.\n' +
      `Dirty files:\n${diff}`
    );
  }

  try {
    execSync(`git diff --cached --quiet -- ${scopeArgs}`, { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    let staged = '(unable to list files)';
    try {
      staged = execSync(`git diff --cached --name-only -- ${scopeArgs}`, { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch { /* best-effort */ }
    throw new Error(
      'Working tree has staged changes in scope directories. Commit or stash before running migration.\n' +
      `Staged files:\n${staged}`
    );
  }

  // Check untracked files within scope directories
  for (const dir of scopeDirs) {
    // Use forward slashes for git commands (git expects posix paths even on Windows)
    const scopePath = `_bmad-output/${dir}`;
    const untracked = execSync(
      `git ls-files --others --exclude-standard "${scopePath}"`,
      { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
    ).trim();

    if (untracked) {
      throw new Error(
        `Untracked files found in ${scopePath}. Add or remove them before running migration.\n` +
        `Untracked:\n${untracked}`
      );
    }
  }
}

// --- Inference Engine ---

/** HC prefix pattern: matches hcN- at start of basename (e.g., hc2-, hc3-) */
const HC_PREFIX_PATTERN = /^hc\d+-/;

/**
 * Maps long-form artifact type names found in existing filenames to canonical taxonomy types.
 * Migration-specific — these are OLD naming patterns that don't match the taxonomy abbreviations.
 */
const ARTIFACT_TYPE_ALIASES = {
  'problem-definition': 'problem-def',
  'pre-registration': 'pre-reg',
  'architecture': 'arch',
  'hypothesis-contract': 'hypothesis'
};

/**
 * Infer artifact type from a filename using greedy longest-prefix matching.
 * Handles HC-prefixed files by stripping the HC prefix before matching.
 *
 * @param {string} filename - The filename to analyze (e.g., 'prd-gyre.md')
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy with artifact_types list
 * @returns {{type: string|null, hcPrefix: string|null, remainder: string}} Inferred type, HC prefix if any, and remaining segments
 */
function inferArtifactType(filename, taxonomy) {
  const lower = filename.toLowerCase();
  // Strip extension
  const withoutExt = lower.replace(/\.(md|yaml)$/, '');
  // Strip date suffix if present
  const dateMatch = withoutExt.match(/-(\d{4}-\d{2}-\d{2})$/);
  const date = dateMatch ? dateMatch[1] : null;
  const baseName = date ? withoutExt.slice(0, -(date.length + 1)) : withoutExt;

  // Check for HC prefix (hc2-, hc3-, etc.)
  let hcPrefix = null;
  let nameToMatch = baseName;
  const hcMatch = baseName.match(HC_PREFIX_PATTERN);
  if (hcMatch) {
    hcPrefix = hcMatch[0].slice(0, -1); // e.g., 'hc2' (without trailing dash)
    nameToMatch = baseName.slice(hcMatch[0].length);
  }

  // Sort taxonomy types by length descending (greedy: longest match first)
  const sortedTypes = [...taxonomy.artifact_types].sort((a, b) => b.length - a.length);

  // Try direct match against taxonomy types (dash boundary)
  for (const type of sortedTypes) {
    if (nameToMatch.startsWith(type + '-') || nameToMatch === type) {
      const remainder = nameToMatch === type ? '' : nameToMatch.slice(type.length + 1);
      return { type, hcPrefix, remainder, date };
    }
  }

  // Try artifact type aliases (long-form → canonical)
  const sortedAliasKeys = Object.keys(ARTIFACT_TYPE_ALIASES).sort((a, b) => b.length - a.length);
  for (const aliasKey of sortedAliasKeys) {
    if (nameToMatch.startsWith(aliasKey + '-') || nameToMatch === aliasKey) {
      const canonicalType = ARTIFACT_TYPE_ALIASES[aliasKey];
      const remainder = nameToMatch === aliasKey ? '' : nameToMatch.slice(aliasKey.length + 1);
      return { type: canonicalType, hcPrefix, remainder, date };
    }
  }

  // No match
  return { type: null, hcPrefix, remainder: nameToMatch, date };
}

/**
 * Infer which initiative owns an artifact based on the remaining filename segments.
 * Three-step lookup: exact taxonomy match → alias match → ambiguous.
 *
 * @param {string} remainder - Filename segments after type prefix and date are removed
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy with initiatives and aliases
 * @returns {{initiative: string|null, confidence: 'high'|'low', source: string, candidates: string[]}}
 */
function inferInitiative(remainder, taxonomy) {
  if (!remainder) {
    return { initiative: null, confidence: 'low', source: 'empty', candidates: [] };
  }

  const allInitiatives = [...taxonomy.initiatives.platform, ...taxonomy.initiatives.user];
  const segments = remainder.split('-');

  // Step 1: Try full remainder as exact initiative match
  if (allInitiatives.includes(remainder)) {
    return { initiative: remainder, confidence: 'high', source: 'exact', candidates: [] };
  }

  // Step 2: Try full remainder as alias match
  if (taxonomy.aliases && taxonomy.aliases[remainder]) {
    return { initiative: taxonomy.aliases[remainder], confidence: 'high', source: 'alias', candidates: [] };
  }

  // Step 3: Try progressive prefixes (longest first) against initiatives and aliases
  // e.g., for 'strategy-perimeter-foo', try 'strategy-perimeter-foo', then 'strategy-perimeter', then 'strategy'
  for (let i = segments.length - 1; i >= 1; i--) {
    const prefix = segments.slice(0, i).join('-');

    if (allInitiatives.includes(prefix)) {
      return { initiative: prefix, confidence: 'high', source: 'exact', candidates: [] };
    }

    if (taxonomy.aliases && taxonomy.aliases[prefix]) {
      return { initiative: taxonomy.aliases[prefix], confidence: 'high', source: 'alias', candidates: [] };
    }
  }

  // Step 4: Try first segment alone
  const firstSegment = segments[0];
  if (allInitiatives.includes(firstSegment)) {
    return { initiative: firstSegment, confidence: 'high', source: 'exact', candidates: [] };
  }
  if (taxonomy.aliases && taxonomy.aliases[firstSegment]) {
    return { initiative: taxonomy.aliases[firstSegment], confidence: 'high', source: 'alias', candidates: [] };
  }

  // Ambiguous — build candidate list from any partial matches
  const candidates = allInitiatives.filter(id =>
    segments.some(seg => seg === id || seg.startsWith(id) || id.startsWith(seg))
  );

  return { initiative: null, confidence: 'low', source: 'unresolved', candidates };
}

/**
 * Determine the governance state of a file based on filename convention and frontmatter.
 *
 * @param {string} filename - The filename to check
 * @param {string} fileContent - Raw file content (for frontmatter parsing)
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy config
 * @returns {{state: 'fully-governed'|'half-governed'|'ungoverned'|'invalid-governed', fileInitiative: string|null, frontmatterInitiative: string|null}}
 */
function getGovernanceState(filename, fileContent, taxonomy) {
  const typeResult = inferArtifactType(filename, taxonomy);
  const initiativeResult = typeResult.type
    ? inferInitiative(typeResult.remainder, taxonomy)
    : { initiative: null, confidence: 'low', source: 'no-type', candidates: [] };

  const fileInitiative = initiativeResult.initiative;

  // Check frontmatter
  let frontmatterInitiative = null;
  try {
    const { data } = parseFrontmatter(fileContent);
    frontmatterInitiative = data.initiative || null;
  } catch {
    // No valid frontmatter — treat as absent
  }

  // Determine state
  const filenameMatchesConvention = typeResult.type !== null && initiativeResult.confidence === 'high';

  if (!filenameMatchesConvention) {
    return { state: 'ungoverned', fileInitiative, frontmatterInitiative };
  }

  if (!frontmatterInitiative) {
    return { state: 'half-governed', fileInitiative, frontmatterInitiative };
  }

  if (frontmatterInitiative !== fileInitiative) {
    return { state: 'invalid-governed', fileInitiative, frontmatterInitiative };
  }

  return { state: 'fully-governed', fileInitiative, frontmatterInitiative };
}

/**
 * Generate a new filename following the governance convention.
 * Format: {initiative}-{artifactType}[-{qualifier}][-{date}].md
 *
 * @param {string} filename - Original filename
 * @param {string} initiative - Resolved initiative ID
 * @param {string} artifactType - Resolved artifact type
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy config
 * @returns {string} New filename following convention
 */
function generateNewFilename(filename, initiative, artifactType, taxonomy) {
  const typeResult = inferArtifactType(filename, taxonomy);

  // Build qualifier from: HC prefix + remainder after initiative extraction
  const parts = [];

  // Add HC prefix as qualifier if present
  if (typeResult.hcPrefix) {
    parts.push(typeResult.hcPrefix);
  }

  // Extract qualifier: remainder minus the initiative segments
  if (typeResult.remainder) {
    const initiativeResult = inferInitiative(typeResult.remainder, taxonomy);
    if (initiativeResult.initiative && initiativeResult.confidence === 'high') {
      // Remove the matched initiative/alias segments from remainder to get pure qualifier
      const remainderSegments = typeResult.remainder.split('-');
      const allInitiatives = [...taxonomy.initiatives.platform, ...taxonomy.initiatives.user];
      const aliasKeys = Object.keys(taxonomy.aliases || {});

      // Find how many segments the initiative match consumed
      let consumed = 0;
      for (let i = remainderSegments.length; i >= 1; i--) {
        const candidate = remainderSegments.slice(0, i).join('-');
        if (allInitiatives.includes(candidate) || aliasKeys.includes(candidate)) {
          consumed = i;
          break;
        }
      }
      // Also check single first segment
      if (consumed === 0) {
        const first = remainderSegments[0];
        if (allInitiatives.includes(first) || aliasKeys.includes(first)) {
          consumed = 1;
        }
      }

      const qualifierSegments = remainderSegments.slice(consumed);
      if (qualifierSegments.length > 0) {
        parts.push(qualifierSegments.join('-'));
      }
    } else {
      // No initiative found in remainder — entire remainder is qualifier
      parts.push(typeResult.remainder);
    }
  }

  const qualifier = parts.length > 0 ? parts.join('-') : null;

  // Build new filename
  let newName = `${initiative}-${artifactType}`;
  if (qualifier) {
    newName += `-${qualifier}`;
  }
  if (typeResult.date) {
    newName += `-${typeResult.date}`;
  }
  newName += '.md';

  return newName;
}

// --- Schema Validation ---

/** Valid artifact-level status values (closed enum) */
const VALID_STATUSES = ['draft', 'validated', 'superseded', 'active'];

/** ISO 8601 date format: YYYY-MM-DD */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate frontmatter fields against the governance schema v1.
 *
 * @param {Object} fields - Frontmatter fields to validate
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy config for initiative/type validation
 * @returns {{valid: boolean, errors: string[]}} Validation result with error messages
 */
function validateFrontmatterSchema(fields, taxonomy) {
  const errors = [];

  // Required fields
  if (!fields.initiative) {
    errors.push('Missing required field: initiative');
  }
  if (!fields.artifact_type) {
    errors.push('Missing required field: artifact_type');
  }
  if (!fields.created) {
    errors.push('Missing required field: created');
  }
  if (fields.schema_version === undefined || fields.schema_version === null) {
    errors.push('Missing required field: schema_version');
  }

  // schema_version must be integer >= 1
  if (fields.schema_version !== undefined && fields.schema_version !== null) {
    if (!Number.isInteger(fields.schema_version) || fields.schema_version < 1) {
      errors.push(`Invalid schema_version "${fields.schema_version}": must be an integer >= 1`);
    }
  }

  // created must be ISO 8601 date format
  if (fields.created && !DATE_PATTERN.test(fields.created)) {
    errors.push(`Invalid created date "${fields.created}": must be YYYY-MM-DD format`);
  }

  // status is optional but must be from closed enum if present
  if (fields.status !== undefined && !VALID_STATUSES.includes(fields.status)) {
    errors.push(`Invalid status "${fields.status}": must be one of ${VALID_STATUSES.join(', ')}`);
  }

  // initiative must exist in taxonomy
  if (fields.initiative && taxonomy) {
    const allInitiatives = [...taxonomy.initiatives.platform, ...taxonomy.initiatives.user];
    if (!allInitiatives.includes(fields.initiative)) {
      errors.push(`Initiative "${fields.initiative}" not found in taxonomy (platform or user sections)`);
    }
  }

  // artifact_type must exist in taxonomy
  if (fields.artifact_type && taxonomy) {
    if (!taxonomy.artifact_types.includes(fields.artifact_type)) {
      errors.push(`Artifact type "${fields.artifact_type}" not found in taxonomy artifact_types list`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Build a complete frontmatter field set conforming to schema v1.
 * Does NOT validate — use validateFrontmatterSchema() for that.
 *
 * @param {string} initiative - Initiative ID from taxonomy
 * @param {string} artifactType - Artifact type from taxonomy
 * @param {Object} [options={}] - Optional overrides (status, created)
 * @param {string} [options.status] - Optional artifact status (draft/validated/superseded/active)
 * @param {string} [options.created] - Optional created date (defaults to today YYYY-MM-DD)
 * @returns {import('./types').FrontmatterSchema} Complete frontmatter fields
 */
function buildSchemaFields(initiative, artifactType, options = {}) {
  const fields = {
    initiative,
    artifact_type: artifactType,
    created: options.created || new Date().toISOString().split('T')[0],
    schema_version: 1
  };

  if (options.status !== undefined) {
    fields.status = options.status;
  }

  return fields;
}

// --- Exports ---

module.exports = {
  // Constants
  VALID_CATEGORIES,
  NAMING_PATTERN,
  DATED_PATTERN,
  CATEGORIZED_PATTERN,
  VALID_STATUSES,
  // Filename parsing
  isValidCategory,
  parseFilename,
  toLowerKebab,
  // Directory scanning
  scanArtifactDirs,
  // Taxonomy
  readTaxonomy,
  // Frontmatter
  parseFrontmatter,
  injectFrontmatter,
  // Schema
  validateFrontmatterSchema,
  buildSchemaFields,
  // Inference
  ARTIFACT_TYPE_ALIASES,
  inferArtifactType,
  inferInitiative,
  getGovernanceState,
  generateNewFilename,
  // Git
  ensureCleanTree
};
