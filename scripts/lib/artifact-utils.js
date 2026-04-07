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
const { execFileSync } = require('child_process');

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
  // Build scoped paths for git commands (forward slashes for git)
  const scopePaths = scopeDirs.map(dir => `_bmad-output/${dir}`);

  // Check tracked changes (staged and unstaged) — scoped to scopeDirs only
  try {
    execFileSync('git', ['diff', '--quiet', '--', ...scopePaths], { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    let diff = '(unable to list files)';
    try {
      diff = execFileSync('git', ['diff', '--name-only', '--', ...scopePaths], { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch { /* best-effort */ }
    throw new Error(
      'Working tree has uncommitted changes in scope directories. Commit or stash before running migration.\n' +
      `Dirty files:\n${diff}`
    );
  }

  try {
    execFileSync('git', ['diff', '--cached', '--quiet', '--', ...scopePaths], { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    let staged = '(unable to list files)';
    try {
      staged = execFileSync('git', ['diff', '--cached', '--name-only', '--', ...scopePaths], { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch { /* best-effort */ }
    throw new Error(
      'Working tree has staged changes in scope directories. Commit or stash before running migration.\n' +
      `Staged files:\n${staged}`
    );
  }

  // Check untracked files within scope directories
  for (const scopePath of scopePaths) {
    const untracked = execFileSync(
      'git', ['ls-files', '--others', '--exclude-standard', scopePath],
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
  if (!filename || typeof filename !== 'string') {
    return { type: null, hcPrefix: null, remainder: '', date: null, typeConfidence: 'low', typeSource: 'none' };
  }
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

  // Try artifact type aliases FIRST (longer, more specific — e.g., 'hypothesis-contract' before 'hypothesis')
  const sortedAliasKeys = Object.keys(ARTIFACT_TYPE_ALIASES).sort((a, b) => b.length - a.length);
  for (const aliasKey of sortedAliasKeys) {
    if (nameToMatch.startsWith(aliasKey + '-') || nameToMatch === aliasKey) {
      const canonicalType = ARTIFACT_TYPE_ALIASES[aliasKey];
      const remainder = nameToMatch === aliasKey ? '' : nameToMatch.slice(aliasKey.length + 1);
      return { type: canonicalType, hcPrefix, remainder, date, typeConfidence: 'high', typeSource: 'alias' };
    }
  }

  // Then try direct match against taxonomy types (dash boundary, longest first)
  const sortedTypes = [...taxonomy.artifact_types].sort((a, b) => b.length - a.length);
  for (const type of sortedTypes) {
    if (nameToMatch.startsWith(type + '-') || nameToMatch === type) {
      const remainder = nameToMatch === type ? '' : nameToMatch.slice(type.length + 1);
      return { type, hcPrefix, remainder, date, typeConfidence: 'high', typeSource: 'prefix' };
    }
  }

  // No match
  return { type: null, hcPrefix, remainder: nameToMatch, date, typeConfidence: 'low', typeSource: 'none' };
}

/**
 * Infer which initiative owns an artifact based on the remaining filename segments.
 * Five-step lookup: (1) exact match → (2) alias match → (3) progressive prefix → (4) progressive suffix → (5) first segment. Falls through to ambiguous if all steps fail.
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

  // Step 4: Try suffixes (last N segments) — catches 'prd-validation-gyre' → 'gyre'
  for (let i = 1; i < segments.length; i++) {
    const suffix = segments.slice(i).join('-');

    if (allInitiatives.includes(suffix)) {
      return { initiative: suffix, confidence: 'high', source: 'exact', candidates: [] };
    }

    if (taxonomy.aliases && taxonomy.aliases[suffix]) {
      return { initiative: taxonomy.aliases[suffix], confidence: 'high', source: 'alias', candidates: [] };
    }
  }

  // Step 5: Try first segment alone
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

// --- Suggested Initiative (Story 6.2) ---
// inferInitiative() is intentionally cautious — it never guesses. The suggester
// layers ON TOP, providing reviewable defaults for AMBIGUOUS entries based on
// content keywords, folder defaults, and git context. Suggestions are guidance,
// not decisions: the manifest entry stays AMBIGUOUS, but the operator gets a
// "REVIEW SUGGESTION: accept '{X}' or specify" prompt instead of a bare wall.

/**
 * Folder-default map for initiative inference.
 * - planning-artifacts → convoke (platform-level artifacts default to convoke)
 * - vortex-artifacts → null (Vortex spans multiple initiatives, no safe default)
 * - gyre-artifacts → gyre (all gyre-artifacts/* belong to gyre)
 *
 * @type {Object<string, string|null>}
 */
const FOLDER_DEFAULT_MAP = Object.freeze({
  'planning-artifacts': 'convoke',
  'vortex-artifacts': null,
  'gyre-artifacts': 'gyre'
});

/** Cap on git queries per migration run to preserve NFR2 (dry-run < 10s for 200 files) */
const MAX_GIT_SUGGESTER_QUERIES = 50;
let _gitSuggesterQueryCount = 0;
let _gitSuggesterWarned = false;

/**
 * Reset the per-run git query counter.
 * Called by generateManifest() at the start of each run, and by tests
 * via the exported helper to avoid cross-test state pollution.
 */
function _resetGitSuggesterCounter() {
  _gitSuggesterQueryCount = 0;
  _gitSuggesterWarned = false;
}

/**
 * Scan a text corpus for any taxonomy initiative ID or alias as a whole word.
 * Returns the first match (longest first to prefer specific over generic).
 *
 * Uses hyphen-aware lookarounds rather than `\b` because JS `\b` treats `-` as a
 * word boundary, which would cause `pre-gyre` to match the `gyre` initiative.
 * The boundary class `[a-z0-9-]` keeps kebab-case identifiers atomic.
 *
 * @param {string} corpus - Lowercased text to scan
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy with initiatives and aliases
 * @returns {string|null} Resolved initiative ID, or null if no match
 */
function _scanCorpusForInitiative(corpus, taxonomy) {
  if (!corpus) return null;
  if (!taxonomy || !taxonomy.initiatives) return null;

  const platform = Array.isArray(taxonomy.initiatives.platform) ? taxonomy.initiatives.platform : [];
  const user = Array.isArray(taxonomy.initiatives.user) ? taxonomy.initiatives.user : [];
  const allInitiatives = [...platform, ...user];
  const aliasKeys = taxonomy.aliases ? Object.keys(taxonomy.aliases) : [];

  // Combine and sort by length descending — prefer 'strategy-perimeter' over 'strategy'.
  const candidates = [...allInitiatives, ...aliasKeys].sort((a, b) => b.length - a.length);

  for (const candidate of candidates) {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Boundary class: not preceded/followed by [a-z0-9-]. Treats hyphen as word-internal,
    // so 'gyrescope' rejects (preceded by 'gyre' won't trigger; 'scope' = letter), 'pre-gyre'
    // also rejects (the leading 'pre-' counts as boundary since hyphen is in the class).
    const re = new RegExp(`(?:^|[^a-z0-9-])${escaped}(?:$|[^a-z0-9-])`, 'i');
    if (re.test(corpus)) {
      // Resolve aliases to canonical initiative
      if (allInitiatives.includes(candidate)) return candidate;
      if (taxonomy.aliases && taxonomy.aliases[candidate]) return taxonomy.aliases[candidate];
    }
  }
  return null;
}

/**
 * Suggest a likely initiative for a file when inferInitiative() returns null.
 * Three-step priority chain:
 *   1. Content keyword scan (frontmatter title + first 10 lines) → 'medium' confidence
 *   2. Folder default (FOLDER_DEFAULT_MAP) → 'low' confidence
 *   3. Git creation commit message → 'low' confidence
 *
 * Suggestions are GUIDANCE for the operator, not auto-resolutions. The action
 * label remains AMBIGUOUS so the operator must still confirm.
 *
 * @param {string} filename - The file's basename
 * @param {string} dirName - The parent directory name (e.g., 'planning-artifacts')
 * @param {string} fileContent - Already-loaded file content (avoids double-read)
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy config
 * @param {string} projectRoot - Absolute path to project root (for git queries)
 * @returns {{initiative: string|null, source: 'content-keyword'|'folder-default'|'git-context'|null, confidence: 'medium'|'low'|null}}
 */
function suggestInitiative(filename, dirName, fileContent, taxonomy, projectRoot) {
  // Step 1: Content keyword scan (highest priority)
  // Scan frontmatter title + first 10 lines, lowercased.
  // Note: a file titled "Comparing Gyre vs Vortex" matches both — first match wins
  // (longest first via _scanCorpusForInitiative). This is a documented trade-off.
  let title = '';
  let firstLines;
  try {
    const parsed = matter(fileContent);
    if (parsed.data && typeof parsed.data.title === 'string') {
      title = parsed.data.title;
    }
    const body = parsed.content || fileContent;
    firstLines = body.split('\n').slice(0, 10).join(' ');
  } catch {
    // Frontmatter parse failed — fall back to raw content
    firstLines = fileContent.split('\n').slice(0, 10).join(' ');
  }

  const corpus = `${title} ${firstLines}`.toLowerCase();
  const contentMatch = _scanCorpusForInitiative(corpus, taxonomy);
  if (contentMatch) {
    return { initiative: contentMatch, source: 'content-keyword', confidence: 'medium' };
  }

  // Step 2: Folder default
  if (Object.prototype.hasOwnProperty.call(FOLDER_DEFAULT_MAP, dirName)) {
    const folderDefault = FOLDER_DEFAULT_MAP[dirName];
    if (folderDefault) {
      return { initiative: folderDefault, source: 'folder-default', confidence: 'low' };
    }
  }

  // Step 3: Git context (lowest priority, capped to preserve NFR2).
  // Skip git entirely if we don't have a project root to run inside.
  if (!projectRoot) {
    return { initiative: null, source: null, confidence: null };
  }

  // Cap check: emit a one-time warning when we first hit the cap, then short-circuit.
  if (_gitSuggesterQueryCount >= MAX_GIT_SUGGESTER_QUERIES) {
    if (!_gitSuggesterWarned) {
      _gitSuggesterWarned = true;
      console.warn(
        `Warning: git-context suggester cap reached (${MAX_GIT_SUGGESTER_QUERIES} queries). ` +
        `Remaining ambiguous files will not get git-based suggestions.`
      );
    }
    return { initiative: null, source: null, confidence: null };
  }

  _gitSuggesterQueryCount++;
  try {
    const relPath = path.join('_bmad-output', dirName, filename);
    const raw = execFileSync(
      'git', ['log', '--diff-filter=A', '--format=%s', '--', relPath],
      { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    if (raw) {
      const gitMatch = _scanCorpusForInitiative(raw.toLowerCase(), taxonomy);
      if (gitMatch) {
        return { initiative: gitMatch, source: 'git-context', confidence: 'low' };
      }
    }
  } catch {
    // Git unavailable, file not tracked, or other failure — silent
  }

  return { initiative: null, source: null, confidence: null };
}

/**
 * Determine the governance state of a file based on filename convention and frontmatter.
 *
 * @param {string} filename - The filename to check
 * @param {string} fileContent - Raw file content (for frontmatter parsing)
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy config
 * @returns {{state: 'fully-governed'|'half-governed'|'ungoverned'|'invalid-governed'|'ambiguous', fileInitiative: string|null, frontmatterInitiative: string|null, candidates: string[]}}
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
  if (typeResult.type === null) {
    return { state: 'ungoverned', fileInitiative, frontmatterInitiative, candidates: [] };
  }

  // Type matched but initiative ambiguous — distinct from ungoverned
  if (initiativeResult.confidence === 'low') {
    return { state: 'ambiguous', fileInitiative, frontmatterInitiative, candidates: initiativeResult.candidates || [] };
  }

  if (!frontmatterInitiative) {
    return { state: 'half-governed', fileInitiative, frontmatterInitiative, candidates: [] };
  }

  if (frontmatterInitiative !== fileInitiative) {
    return { state: 'invalid-governed', fileInitiative, frontmatterInitiative, candidates: [] };
  }

  return { state: 'fully-governed', fileInitiative, frontmatterInitiative, candidates: [] };
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
    const remainderSegments = typeResult.remainder.split('-');
    const allInitiatives = [...taxonomy.initiatives.platform, ...taxonomy.initiatives.user];
    const aliasKeys = Object.keys(taxonomy.aliases || {});

    // Try to find which segments the initiative match consumed
    // Check prefixes (longest first)
    let consumedStart = -1;
    let consumedEnd = -1;

    // Try prefix matches first (e.g., 'forge-phase-a' → 'forge' consumed at start)
    for (let i = remainderSegments.length; i >= 1; i--) {
      const prefix = remainderSegments.slice(0, i).join('-');
      if (allInitiatives.includes(prefix) || aliasKeys.includes(prefix)) {
        consumedStart = 0;
        consumedEnd = i;
        break;
      }
    }

    // If no prefix match, try suffix matches (e.g., 'decision-strategy-perimeter' → 'strategy-perimeter' consumed at end)
    if (consumedStart === -1) {
      for (let i = 1; i < remainderSegments.length; i++) {
        const suffix = remainderSegments.slice(i).join('-');
        if (allInitiatives.includes(suffix) || aliasKeys.includes(suffix)) {
          consumedStart = i;
          consumedEnd = remainderSegments.length;
          break;
        }
      }
    }

    // If still no match, try single first segment
    if (consumedStart === -1) {
      const first = remainderSegments[0];
      if (allInitiatives.includes(first) || aliasKeys.includes(first)) {
        consumedStart = 0;
        consumedEnd = 1;
      }
    }

    // Build qualifier from unconsumed segments
    if (consumedStart >= 0) {
      const before = remainderSegments.slice(0, consumedStart);
      const after = remainderSegments.slice(consumedEnd);
      const qualifierSegments = [...before, ...after];
      if (qualifierSegments.length > 0) {
        parts.push(qualifierSegments.join('-'));
      }
    } else {
      // No initiative found — entire remainder is qualifier
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

  // Preserve original extension (.md or .yaml)
  const extMatch = filename.match(/\.(md|yaml)$/i);
  newName += extMatch ? `.${extMatch[1].toLowerCase()}` : '.md';

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

// --- Manifest Generation ---

/**
 * Get context clues for a file (first 3 lines + git author/date).
 * Used in dry-run manifest for ambiguous/conflict files.
 *
 * @param {string} filePath - Absolute path to the file
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<{firstLines: string[], gitAuthor: string|null, gitDate: string|null}>}
 */
async function getContextClues(filePath, projectRoot) {
  let firstLines = [];
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    firstLines = lines.slice(0, 3).map(l => l.trimEnd());
  } catch {
    // File unreadable — return empty lines
  }

  let gitAuthor = null;
  let gitDate = null;
  try {
    const raw = execFileSync(
      'git', ['log', '-1', '--format=%an|%as', '--', path.relative(projectRoot, filePath)],
      { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    if (raw) {
      const parts = raw.split('|');
      gitAuthor = parts[0] || null;
      gitDate = parts[1] || null;
    }
  } catch {
    // Not tracked in git or git unavailable
  }

  return { firstLines, gitAuthor, gitDate };
}

/**
 * Find files that reference a target filename via markdown links or bare mentions.
 * Only called when --verbose is set (reads every file in scope).
 *
 * @param {string} targetFilename - The filename to search for references to
 * @param {Array<{filename: string, fullPath: string}>} scopeFiles - All files in scope
 * @param {string} _projectRoot - Project root (unused, reserved for future)
 * @returns {Promise<string[]>} List of filenames that reference the target
 */
async function getCrossReferences(targetFilename, scopeFiles, _projectRoot) {
  const refs = [];
  for (const file of scopeFiles) {
    if (file.filename === targetFilename) continue;
    if (!file.fullPath.endsWith('.md')) continue;
    try {
      const content = await fs.readFile(file.fullPath, 'utf8');
      // Match: [text](targetFilename), [text](../dir/targetFilename), or bare targetFilename
      if (content.includes(targetFilename)) {
        refs.push(file.filename);
      }
    } catch {
      // Skip unreadable files
    }
  }
  return refs;
}

/**
 * Build a single manifest entry for a file, classifying its action.
 *
 * @param {{filename: string, dir: string, fullPath: string}} fileInfo - File from scanArtifactDirs
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy config
 * @param {string} _projectRoot - Project root (reserved)
 * @returns {Promise<import('./types').ManifestEntry>}
 */
async function buildManifestEntry(fileInfo, taxonomy, projectRoot) {
  const { filename, dir, fullPath } = fileInfo;
  const oldPath = `${dir}/${filename}`;

  // Only process markdown files — YAML and other files are not migration targets
  if (!filename.endsWith('.md')) {
    return {
      oldPath, newPath: null, initiative: null, artifactType: null,
      confidence: 'low', source: 'non-markdown', action: 'SKIP',
      dir, contextClues: null, crossReferences: null, candidates: [],
      collisionWith: null, frontmatterInitiative: null, fileInitiative: null,
      typeConfidence: 'low', typeSource: 'none',
      suggestedInitiative: null, suggestedFrom: null, suggestedConfidence: null
    };
  }

  let fileContent;
  try {
    fileContent = await fs.readFile(fullPath, 'utf8');
  } catch {
    return {
      oldPath, newPath: null, initiative: null, artifactType: null,
      confidence: 'low', source: 'unreadable', action: 'AMBIGUOUS',
      dir, contextClues: null, crossReferences: null, candidates: [],
      collisionWith: null, frontmatterInitiative: null, fileInitiative: null,
      typeConfidence: 'low', typeSource: 'none',
      suggestedInitiative: null, suggestedFrom: null, suggestedConfidence: null
    };
  }

  // Single inference pass — getGovernanceState uses inferArtifactType + inferInitiative internally.
  // We call inferArtifactType once here to get typeConfidence/typeSource for manifest display.
  const typeResult = inferArtifactType(filename, taxonomy);
  const govState = getGovernanceState(filename, fileContent, taxonomy);

  const initConfidence = govState.state === 'ambiguous' || govState.state === 'ungoverned' ? 'low' : 'high';
  const initSource = govState.state === 'ungoverned' ? 'no-type'
    : govState.state === 'ambiguous' ? 'unresolved'
    : govState.fileInitiative ? 'inferred' : 'none';

  const base = {
    oldPath, dir,
    initiative: govState.fileInitiative,
    artifactType: typeResult.type,
    confidence: initConfidence,
    source: initSource,
    typeConfidence: typeResult.typeConfidence,
    typeSource: typeResult.typeSource,
    contextClues: null,
    crossReferences: null,
    candidates: govState.candidates || [],
    collisionWith: null,
    frontmatterInitiative: govState.frontmatterInitiative,
    fileInitiative: govState.fileInitiative,
    // Suggestion fields (Story 6.2)
    // - suggestedInitiative/From/Confidence: populated for AMBIGUOUS entries by suggestInitiative()
    // - suggestedNewPath: populated for colliding RENAME entries by suggestDifferentiator()
    //   (set to null here so consumers always see a defined field)
    suggestedInitiative: null,
    suggestedFrom: null,
    suggestedConfidence: null,
    suggestedNewPath: null
  };

  // For ambiguous/ungoverned entries, layer a suggestion on top via suggestInitiative.
  // The action stays AMBIGUOUS — the operator must still confirm. This is guidance, not auto-resolution.
  if (govState.state === 'ungoverned' || govState.state === 'ambiguous') {
    const suggestion = suggestInitiative(filename, dir, fileContent, taxonomy, projectRoot);
    return {
      ...base,
      newPath: null,
      action: 'AMBIGUOUS',
      suggestedInitiative: suggestion.initiative,
      suggestedFrom: suggestion.source,
      suggestedConfidence: suggestion.confidence
    };
  }

  if (govState.state === 'invalid-governed') {
    return { ...base, newPath: null, action: 'CONFLICT' };
  }

  // Half-governed or fully-governed: type + initiative resolved
  // Compare current filename with governance target to determine action
  let newFilename;
  try {
    newFilename = generateNewFilename(filename, govState.fileInitiative, typeResult.type, taxonomy);
  } catch {
    // generateNewFilename failed — treat as ambiguous rather than aborting the entire manifest
    return { ...base, newPath: null, action: 'AMBIGUOUS' };
  }
  const newPath = `${dir}/${newFilename}`;

  if (govState.state === 'fully-governed') {
    if (filename === newFilename) {
      return { ...base, newPath: null, action: 'SKIP' };
    }
    return { ...base, newPath, action: 'RENAME' };
  }

  // half-governed
  if (filename === newFilename) {
    return { ...base, newPath: null, action: 'INJECT_ONLY' };
  }
  return { ...base, newPath, action: 'RENAME' };
}

/**
 * Suggest a differentiator suffix for two source filenames colliding on the same target.
 * Strategy:
 *   1. Strip date suffix from sources and target
 *   2. For each source, find the longest unique segment chain that the OTHER sources don't share
 *   3. Insert that differentiator into the target before the date suffix
 *
 * Returns null if sources are too similar to differentiate (e.g., exact duplicates).
 *
 * @param {string[]} sourcePaths - List of colliding source paths (e.g., 'vortex-artifacts/lean-persona-strategic-navigator-2026-04-04.md')
 * @param {string} targetPath - The collision target (e.g., 'vortex-artifacts/helm-lean-persona-2026-04-04.md')
 * @returns {Map<string, string|null>} Map of sourcePath → suggestedNewPath (or null)
 */
function suggestDifferentiator(sourcePaths, targetPath) {
  const result = new Map();

  // Filter out sentinel entries like '(existing) ...' that aren't real source files
  const realSources = sourcePaths.filter(s => !s.startsWith('(existing) '));
  if (realSources.length < 2) {
    for (const s of sourcePaths) result.set(s, null);
    return result;
  }

  // Parse target: directory + stem + date + ext
  const targetMatch = targetPath.match(/^(.*\/)?([^/]+?)(-(\d{4}-\d{2}-\d{2}))?\.(md|yaml)$/);
  if (!targetMatch) {
    for (const s of sourcePaths) result.set(s, null);
    return result;
  }
  const targetDir = targetMatch[1] || '';
  const targetStem = targetMatch[2];
  const targetDate = targetMatch[4] || '';
  const targetExt = targetMatch[5];

  // For each real source, extract segments that are not in the target stem.
  // Then verify uniqueness against the other sources.
  const sourceData = realSources.map(srcPath => {
    const srcMatch = srcPath.match(/^(.*\/)?([^/]+?)(-(\d{4}-\d{2}-\d{2}))?\.(md|yaml)$/);
    if (!srcMatch) return { srcPath, segments: [] };
    const srcStem = srcMatch[2];
    const srcSegments = srcStem.split('-');
    const targetSegments = new Set(targetStem.split('-'));
    // Keep only segments not present in the target stem
    const unique = srcSegments.filter(s => !targetSegments.has(s));
    return { srcPath, segments: unique, srcStem };
  });

  // Cross-check: each source's segments must also distinguish it from OTHER sources
  for (const { srcPath, segments } of sourceData) {
    const otherSegSets = sourceData
      .filter(d => d.srcPath !== srcPath)
      .map(d => new Set(d.segments));

    // Find segments that are unique to THIS source (not in any other source's segments)
    const uniqueToMe = segments.filter(seg => otherSegSets.every(other => !other.has(seg)));

    if (uniqueToMe.length === 0) {
      // No distinguishing segments — can't differentiate
      result.set(srcPath, null);
      continue;
    }

    // Build the differentiator (join unique segments)
    const differentiator = uniqueToMe.join('-');

    // Construct the suggested new path: targetDir + targetStem + '-' + differentiator + dateSuffix + ext
    const dateSuffix = targetDate ? `-${targetDate}` : '';
    const suggestedFilename = `${targetStem}-${differentiator}${dateSuffix}.${targetExt}`;
    const suggestedNewPath = `${targetDir}${suggestedFilename}`;
    result.set(srcPath, suggestedNewPath);
  }

  // Edge case: if the suggested new paths themselves collide, append a numeric suffix.
  // First pass: count duplicates. Second pass: rename ALL duplicates (not just 2nd+).
  // Uses the same greedy regex as the source/target parser above to avoid the
  // lazy-`.*?` empty-stem bug.
  const dupCounts = new Map();
  for (const suggested of result.values()) {
    if (!suggested) continue;
    dupCounts.set(suggested, (dupCounts.get(suggested) || 0) + 1);
  }
  const assignedSuffix = new Map(); // suggested → next index to assign
  for (const [src, suggested] of result) {
    if (!suggested) continue;
    if ((dupCounts.get(suggested) || 0) < 2) continue; // not a dup, skip
    const idx = (assignedSuffix.get(suggested) || 0) + 1;
    assignedSuffix.set(suggested, idx);
    const reMatch = suggested.match(/^(.*\/)?([^/]+?)(-(\d{4}-\d{2}-\d{2}))?\.(md|yaml)$/);
    if (reMatch) {
      const dirPrefix = reMatch[1] || '';
      const stem = reMatch[2];
      const dateSuffix = reMatch[4] ? `-${reMatch[4]}` : '';
      const ext = reMatch[5];
      result.set(src, `${dirPrefix}${stem}-${idx}${dateSuffix}.${ext}`);
    }
  }

  // Sentinels get null
  for (const s of sourcePaths) {
    if (!result.has(s)) result.set(s, null);
  }

  return result;
}

/**
 * Detect target filename collisions in manifest entries.
 *
 * @param {import('./types').ManifestEntry[]} entries - All manifest entries
 * @returns {Map<string, string[]>} Map of colliding newPath -> list of oldPaths
 */
function detectCollisions(entries) {
  const targetMap = new Map();

  // Collect all target filenames (from RENAME entries)
  for (const entry of entries) {
    if (entry.action === 'RENAME' && entry.newPath) {
      if (!targetMap.has(entry.newPath)) {
        targetMap.set(entry.newPath, []);
      }
      targetMap.get(entry.newPath).push(entry.oldPath);
    }
  }

  // Also check if any target matches an existing file (SKIP/INJECT entries)
  const existingPaths = new Set(
    entries.filter(e => e.action === 'SKIP' || e.action === 'INJECT_ONLY').map(e => e.oldPath)
  );

  for (const target of targetMap.keys()) {
    if (existingPaths.has(target)) {
      const sources = targetMap.get(target);
      const sentinel = `(existing) ${target}`;
      if (!sources.includes(sentinel)) {
        sources.push(sentinel);
      }
    }
  }

  // Filter to only actual collisions (more than 1 source)
  const collisions = new Map();
  for (const [target, sources] of targetMap) {
    if (sources.length > 1) {
      collisions.set(target, sources);
    }
  }

  return collisions;
}

/**
 * Generate the full dry-run manifest for all in-scope artifact directories.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {Object} [options={}]
 * @param {string[]} [options.includeDirs=['planning-artifacts','vortex-artifacts','gyre-artifacts']]
 * @param {string[]} [options.excludeDirs=['_archive']]
 * @param {boolean} [options.verbose=false]
 * @returns {Promise<import('./types').ManifestResult>}
 */
async function generateManifest(projectRoot, options = {}) {
  const {
    includeDirs = ['planning-artifacts', 'vortex-artifacts', 'gyre-artifacts'],
    excludeDirs = ['_archive'],
    verbose = false
  } = options;

  const taxonomy = readTaxonomy(projectRoot);
  const scopeFiles = await scanArtifactDirs(projectRoot, includeDirs, excludeDirs);
  const entries = [];

  // Reset the per-run git query counter (Story 6.2 — caps git suggestions to preserve NFR2)
  _resetGitSuggesterCounter();

  for (const fileInfo of scopeFiles) {
    const entry = await buildManifestEntry(fileInfo, taxonomy, projectRoot);
    entries.push(entry);
  }

  // Detect collisions and annotate entries
  const collisions = detectCollisions(entries);
  for (const [target, sources] of collisions) {
    // Compute differentiator suggestions for this collision (Story 6.2)
    const differentiators = suggestDifferentiator(sources, target);
    for (const entry of entries) {
      if (entry.newPath === target && entry.action === 'RENAME') {
        entry.collisionWith = sources.filter(s => s !== entry.oldPath);
        entry.suggestedNewPath = differentiators.get(entry.oldPath) || null;
      }
    }
  }

  // Gather context clues for AMBIGUOUS and CONFLICT entries
  for (const entry of entries) {
    if (entry.action === 'AMBIGUOUS' || entry.action === 'CONFLICT') {
      const fullPath = path.join(projectRoot, '_bmad-output', entry.oldPath);
      entry.contextClues = await getContextClues(fullPath, projectRoot);

      if (verbose) {
        entry.crossReferences = await getCrossReferences(
          entry.oldPath.split('/').pop(),
          scopeFiles,
          projectRoot
        );
      }
    }
  }

  // Build summary
  const summary = { total: entries.length, skip: 0, rename: 0, inject: 0, conflict: 0, ambiguous: 0 };
  for (const entry of entries) {
    switch (entry.action) {
      case 'SKIP': summary.skip++; break;
      case 'RENAME': summary.rename++; break;
      case 'INJECT_ONLY': summary.inject++; break;
      case 'CONFLICT': summary.conflict++; break;
      case 'AMBIGUOUS': summary.ambiguous++; break;
    }
  }

  return { entries, collisions, summary };
}

/**
 * Format the manifest as a human-readable text report.
 *
 * @param {import('./types').ManifestResult} manifest - Manifest from generateManifest()
 * @param {Object} [options={}]
 * @param {boolean} [options.verbose=false]
 * @returns {string} Formatted manifest text
 */
function formatManifest(manifest, options = {}) {
  const { verbose = false } = options;
  const lines = [];

  for (const entry of manifest.entries) {
    switch (entry.action) {
      case 'SKIP':
        lines.push(`[SKIP] ${entry.oldPath} -- already governed`);
        break;

      case 'INJECT_ONLY':
        lines.push(`[INJECT] ${entry.oldPath} -- frontmatter needed`);
        break;

      case 'RENAME':
        lines.push(`${entry.oldPath} -> ${entry.newPath}`);
        lines.push(`  Initiative: ${entry.initiative} (confidence: ${entry.confidence}, source: ${entry.source})`);
        lines.push(`  Type: ${entry.artifactType} (confidence: ${entry.typeConfidence || 'high'}, source: ${entry.typeSource || 'prefix'})`);
        if (entry.collisionWith && entry.collisionWith.length > 0) {
          lines.push(`  [!] COLLISION: same target as ${entry.collisionWith.join(', ')}`);
          if (entry.suggestedNewPath) {
            lines.push(`  Suggested rename: ${entry.suggestedNewPath}`);
          }
        }
        break;

      case 'CONFLICT':
        lines.push(`[!] ${entry.oldPath} -> CONFLICT (filename says ${entry.fileInitiative}, frontmatter says ${entry.frontmatterInitiative})`);
        lines.push('  ACTION REQUIRED: Resolve initiative conflict before migration');
        if (entry.contextClues) {
          for (let i = 0; i < entry.contextClues.firstLines.length; i++) {
            lines.push(`  Line ${i + 1}: "${entry.contextClues.firstLines[i]}"`);
          }
          if (entry.contextClues.gitAuthor) {
            lines.push(`  Git author: ${entry.contextClues.gitAuthor} (${entry.contextClues.gitDate})`);
          }
        }
        break;

      case 'AMBIGUOUS': {
        const typeLabel = entry.artifactType
          ? `type: ${entry.artifactType}, initiative unknown`
          : 'cannot infer type or initiative';
        lines.push(`[!] ${entry.oldPath} -> ??? (ambiguous -- ${typeLabel})`);
        if (entry.contextClues) {
          for (let i = 0; i < entry.contextClues.firstLines.length; i++) {
            lines.push(`  Line ${i + 1}: "${entry.contextClues.firstLines[i]}"`);
          }
          if (entry.contextClues.gitAuthor) {
            lines.push(`  Git author: ${entry.contextClues.gitAuthor} (${entry.contextClues.gitDate})`);
          }
          if (verbose && entry.crossReferences && entry.crossReferences.length > 0) {
            lines.push(`  Referenced by: ${entry.crossReferences.join(', ')}`);
          }
        }
        if (entry.candidates.length > 0) {
          lines.push(`  Candidates: ${entry.candidates.join(', ')}`);
        }
        // Suggestion (Story 6.2): if a default exists, surface it and switch the action label
        if (entry.suggestedInitiative) {
          lines.push(`  Suggested: ${entry.suggestedInitiative} (source: ${entry.suggestedFrom}, confidence: ${entry.suggestedConfidence})`);
          lines.push(`  REVIEW SUGGESTION: Accept '${entry.suggestedInitiative}' or specify initiative`);
        } else {
          lines.push('  ACTION REQUIRED: Specify initiative for this file');
        }
        break;
      }
    }
  }

  // Summary footer
  const s = manifest.summary;
  lines.push('');
  lines.push(`--- Manifest Summary ---`);
  lines.push(`Total: ${s.total} | Rename: ${s.rename} | Skip: ${s.skip} | Inject: ${s.inject} | Conflict: ${s.conflict} | Ambiguous: ${s.ambiguous}`);

  if (manifest.collisions.size > 0) {
    lines.push(`[!] ${manifest.collisions.size} filename collision(s) detected -- resolve before executing`);
  }

  return lines.join('\n');
}

// --- Migration Execution ---

/**
 * Structured error for migration failures. Named ArtifactMigrationError to avoid
 * collision with MigrationError in scripts/update/lib/migration-runner.js.
 *
 * @property {string} file - Which file caused the error
 * @property {'rename'|'inject'} phase - Drives programmatic rollback target
 * @property {boolean} recoverable - Can re-run fix this?
 */
class ArtifactMigrationError extends Error {
  constructor(message, { file = null, phase, recoverable = true } = {}) {
    super(message);
    this.name = 'ArtifactMigrationError';
    this.file = file;
    this.phase = phase;
    this.recoverable = recoverable;
  }
}

/**
 * Execute all renames from a manifest as a single atomic git commit.
 * If any git mv fails, rolls back ALL renames via git reset --hard HEAD.
 *
 * @param {import('./types').ManifestResult} manifest - Manifest from generateManifest()
 * @param {string} projectRoot - Absolute path to project root
 * @returns {{renamedCount: number, commitSha: string}} Result with count and commit SHA
 * @throws {ArtifactMigrationError} On collision detection or git mv failure (after rollback)
 */
function executeRenames(manifest, projectRoot) {
  const renameEntries = manifest.entries.filter(e => e.action === 'RENAME');

  if (renameEntries.length === 0) {
    return { renamedCount: 0, commitSha: null };
  }

  // Pre-flight: refuse to proceed if collisions exist
  const colliding = renameEntries.filter(e => e.collisionWith && e.collisionWith.length > 0);
  if (colliding.length > 0) {
    const details = colliding.map(e => `  ${e.oldPath} -> ${e.newPath} (collides with ${e.collisionWith.join(', ')})`).join('\n');
    throw new ArtifactMigrationError(
      `Cannot execute renames: ${colliding.length} filename collision(s) detected.\n${details}`,
      { phase: 'rename', recoverable: false }
    );
  }

  const outputDir = path.join(projectRoot, '_bmad-output');

  // Execute all git mv operations
  for (const entry of renameEntries) {
    const oldFull = path.join(outputDir, entry.oldPath);
    const newFull = path.join(outputDir, entry.newPath);

    try {
      execFileSync('git', ['mv', oldFull, newFull], { cwd: projectRoot, stdio: 'pipe' });
    } catch (err) {
      // Rollback ALL renames done so far
      let rollbackOk = false;
      try {
        execFileSync('git', ['reset', '--hard', 'HEAD'], { cwd: projectRoot, stdio: 'pipe' });
        rollbackOk = true;
      } catch { /* rollback failed — tree is dirty */ }

      throw new ArtifactMigrationError(
        `git mv failed for ${entry.oldPath} -> ${entry.newPath}: ${err.message}`,
        { file: entry.oldPath, phase: 'rename', recoverable: rollbackOk }
      );
    }
  }

  // Commit all renames as a single atomic commit (git mv already stages changes)
  try {
    execFileSync(
      'git', ['commit', '-m', 'chore: rename artifacts to governance convention'],
      { cwd: projectRoot, stdio: 'pipe' }
    );
  } catch (err) {
    // Commit failed after all git mv succeeded — rollback all renames
    let rollbackOk = false;
    try {
      execFileSync('git', ['reset', '--hard', 'HEAD'], { cwd: projectRoot, stdio: 'pipe' });
      rollbackOk = true;
    } catch { /* rollback failed */ }

    throw new ArtifactMigrationError(
      `git commit failed after renames: ${err.message}`,
      { phase: 'rename', recoverable: rollbackOk }
    );
  }

  let commitSha = null;
  try {
    const shaOutput = execFileSync(
      'git', ['rev-parse', 'HEAD'],
      { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
    );
    commitSha = (typeof shaOutput === 'string' ? shaOutput : shaOutput.toString('utf8')).trim();
  } catch {
    // Commit succeeded but SHA retrieval failed — non-fatal
  }

  return { renamedCount: renameEntries.length, commitSha };
}

/**
 * Verify git history chain is preserved for a sample of renamed files.
 * Informational only — does NOT rollback on failure.
 *
 * @param {import('./types').ManifestEntry[]} renamedEntries - Entries that were renamed
 * @param {string} projectRoot - Absolute path to project root
 * @returns {{verified: number, failed: string[]}} Verification result
 */
function verifyHistoryChain(renamedEntries, projectRoot) {
  const sample = renamedEntries.slice(0, 5);
  let verified = 0;
  const failed = [];

  for (const entry of sample) {
    const fullPath = path.join(projectRoot, '_bmad-output', entry.newPath);
    try {
      const log = execFileSync(
        'git', ['log', '--follow', '--oneline', '-3', '--', fullPath],
        { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
      ).trim();

      const lines = log.split('\n').filter(Boolean);
      if (lines.length >= 2) {
        verified++;
      } else {
        failed.push(entry.newPath);
      }
    } catch {
      failed.push(entry.newPath);
    }
  }

  return { verified, failed };
}

/**
 * Update internal markdown links in all .md files within scope after renames.
 * Handles 4 patterns: [text](file.md), [text](./file.md), [text](../dir/file.md),
 * and frontmatter inputDocuments arrays. Preserves anchor fragments.
 *
 * @param {Map<string, string>} oldToNewMap - Map of old basenames to new basenames
 * @param {string[]} scopeDirs - Directory names to scan (relative to _bmad-output/)
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<{updatedFiles: number, updatedLinks: number}>}
 */
async function updateLinks(oldToNewMap, scopeDirs, projectRoot) {
  const allFiles = await scanArtifactDirs(projectRoot, scopeDirs, ['_archive']);
  let updatedFiles = 0;
  let updatedLinks = 0;

  for (const file of allFiles) {
    if (!file.fullPath.endsWith('.md')) continue;

    const original = fs.readFileSync(file.fullPath, 'utf8');
    let content = original;
    let fileLinks = 0;

    // Parse frontmatter to handle inputDocuments arrays
    const parsed = matter(content);
    let fmChanged = false;
    if (parsed.data && parsed.data.inputDocuments && Array.isArray(parsed.data.inputDocuments)) {
      parsed.data.inputDocuments = parsed.data.inputDocuments.map(doc => {
        if (typeof doc !== 'string') return doc;
        for (const [oldName, newName] of oldToNewMap) {
          // Exact match or path-suffix match (e.g., "dir/oldname.md") — prevents substring corruption
          if (doc === oldName || doc.endsWith('/' + oldName)) {
            fmChanged = true;
            fileLinks++;
            return doc === oldName ? newName : doc.slice(0, doc.length - oldName.length) + newName;
          }
        }
        return doc;
      });
    }

    // Reassemble content if frontmatter changed
    if (fmChanged) {
      content = matter.stringify(parsed.content, parsed.data);
    }

    // Update markdown link patterns in body content
    for (const [oldName, newName] of oldToNewMap) {
      // Escape dots for regex
      const escaped = oldName.replace(/\./g, '\\.');

      // Patterns 1+2: [text](oldname.md) or [text](./oldname.md) with optional anchor
      const directPattern = new RegExp(
        `(\\[[^\\]]*\\]\\()(\\.\\/)?${escaped}(#[^)]*)?\\)`,
        'g'
      );

      // Pattern 3: [text](../dir/oldname.md) with optional anchor — replace only the filename
      const parentDirPattern = new RegExp(
        `(\\[[^\\]]*\\]\\([^)]*\\/)${escaped}(#[^)]*)?\\)`,
        'g'
      );

      let bodyChanges = 0;
      content = content.replace(directPattern, (_m, prefix, dotSlash, anchor) => {
        bodyChanges++;
        return `${prefix}${dotSlash || ''}${newName}${anchor || ''})`;
      });
      content = content.replace(parentDirPattern, (_m, prefix, anchor) => {
        bodyChanges++;
        return `${prefix}${newName}${anchor || ''})`;
      });
      fileLinks += bodyChanges;
    }

    if (content !== original) {
      fs.writeFileSync(file.fullPath, content, 'utf8');
      updatedFiles++;
      updatedLinks += fileLinks;
    }
  }

  return { updatedFiles, updatedLinks };
}

/**
 * Execute commit 2: inject frontmatter into renamed files and update links.
 * Runs AFTER executeRenames (commit 1) has completed.
 *
 * @param {import('./types').ManifestResult} manifest - Manifest from generateManifest()
 * @param {string} projectRoot - Absolute path to project root
 * @param {string[]} scopeDirs - Scope directories for link scanning
 * @returns {Promise<{injectedCount: number, linkUpdates: {updatedFiles: number, updatedLinks: number}, conflictCount: number, commitSha: string|null}>}
 * @throws {ArtifactMigrationError} On write failure (after rollback to commit 1)
 */
async function executeInjections(manifest, projectRoot, scopeDirs) {
  const renameEntries = manifest.entries.filter(e => e.action === 'RENAME');
  let injectedCount = 0;
  let conflictCount = 0;
  const outputDir = path.join(projectRoot, '_bmad-output');

  // Build old->new basename map for link updating
  const oldToNewMap = new Map();
  for (const entry of renameEntries) {
    const oldBasename = entry.oldPath.split('/').pop();
    const newBasename = entry.newPath.split('/').pop();
    if (oldBasename !== newBasename) {
      oldToNewMap.set(oldBasename, newBasename);
    }
  }

  // Inject frontmatter into each renamed file
  for (const entry of renameEntries) {
    const filePath = path.join(outputDir, entry.newPath);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fields = buildSchemaFields(entry.initiative, entry.artifactType);
      const result = injectFrontmatter(content, fields);

      // Log conflicts
      for (const c of result.conflicts) {
        console.warn(`  Warning: Skipping field "${c.field}" in ${entry.newPath}: existing value "${c.existingValue}" differs from proposed "${c.newValue}"`);
        conflictCount++;
      }

      fs.writeFileSync(filePath, result.content, 'utf8');
      injectedCount++;
    } catch (err) {
      // Write failure — rollback to commit 1
      let rollbackOk = false;
      try {
        execFileSync('git', ['reset', '--hard', 'HEAD'], { cwd: projectRoot, stdio: 'pipe' });
        rollbackOk = true;
      } catch { /* rollback failed */ }

      throw new ArtifactMigrationError(
        `Failed to inject frontmatter into ${entry.newPath}: ${err.message}`,
        { file: entry.newPath, phase: 'inject', recoverable: rollbackOk }
      );
    }
  }

  // Update internal links across all scoped .md files
  const linkUpdates = await updateLinks(oldToNewMap, scopeDirs, projectRoot);

  // Generate rename map (committed with injection phase)
  const renameMapContent = generateRenameMap(renameEntries);
  const renameMapPath = path.join(outputDir, 'planning-artifacts', 'artifact-rename-map.md');
  fs.writeFileSync(renameMapPath, renameMapContent, 'utf8');

  // Stage and commit (scoped to _bmad-output/)
  try {
    execFileSync('git', ['add', '_bmad-output/'], { cwd: projectRoot, stdio: 'pipe' });
    execFileSync(
      'git', ['commit', '-m', 'chore: inject frontmatter metadata and update links'],
      { cwd: projectRoot, stdio: 'pipe' }
    );
  } catch (err) {
    let rollbackOk = false;
    try {
      execFileSync('git', ['reset', '--hard', 'HEAD'], { cwd: projectRoot, stdio: 'pipe' });
      rollbackOk = true;
    } catch { /* rollback failed */ }

    throw new ArtifactMigrationError(
      `git commit failed after injections: ${err.message}`,
      { phase: 'inject', recoverable: rollbackOk }
    );
  }

  let commitSha = null;
  try {
    const shaOutput = execFileSync(
      'git', ['rev-parse', 'HEAD'],
      { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
    );
    commitSha = (typeof shaOutput === 'string' ? shaOutput : shaOutput.toString('utf8')).trim();
  } catch {
    // Non-fatal — commit succeeded
  }

  return { injectedCount, linkUpdates, conflictCount, commitSha };
}

/**
 * Prompt operator for initiative assignment on a single ambiguous file.
 * Exported for mocking in tests — tests should NEVER interact with real readline.
 *
 * @param {string} filename - The ambiguous filename
 * @param {string[]} candidates - Possible initiative matches
 * @returns {Promise<string>} Selected initiative or 'skip'
 */
async function promptInitiative(filename, candidates) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const options = [...candidates, 'skip'].join('/');
  return new Promise(resolve => {
    let resolved = false;
    const done = (value) => { if (!resolved) { resolved = true; resolve(value); } };
    rl.on('close', () => done('skip'));
    rl.question(`Assign initiative for ${filename} [${options}]: `, answer => {
      rl.close();
      const trimmed = (answer || '').trim().toLowerCase();
      if (trimmed === 'skip' || candidates.includes(trimmed)) {
        done(trimmed);
      } else {
        done('skip');
      }
    });
  });
}

/**
 * Resolve ambiguous manifest entries interactively or auto-skip in force mode.
 * Mutates manifest entries in-place.
 *
 * @param {import('./types').ManifestResult} manifest - Manifest to resolve
 * @param {import('./types').TaxonomyConfig} taxonomy - Taxonomy for filename generation
 * @param {string} _projectRoot - Project root (reserved)
 * @param {Object} [options={}]
 * @param {boolean} [options.force=false] - Auto-skip all ambiguous in force mode
 * @returns {Promise<{resolved: number, skipped: number}>}
 */
async function resolveAmbiguous(manifest, taxonomy, _projectRoot, options = {}) {
  const { force = false, promptFn = promptInitiative } = options;
  let resolved = 0;
  let skipped = 0;

  for (const entry of manifest.entries) {
    if (entry.action !== 'AMBIGUOUS') continue;

    // Non-resolvable: no type or no candidates — auto-skip
    if (!entry.artifactType || !entry.candidates || entry.candidates.length === 0) {
      entry.action = 'SKIP';
      skipped++;
      continue;
    }

    // Force mode: auto-skip all ambiguous
    if (force) {
      entry.action = 'SKIP';
      skipped++;
      continue;
    }

    // Interactive prompt
    const filename = entry.oldPath.split('/').pop();
    const choice = await promptFn(filename, entry.candidates);

    if (choice === 'skip') {
      entry.action = 'SKIP';
      skipped++;
    } else {
      entry.initiative = choice;
      const newFilename = generateNewFilename(filename, choice, entry.artifactType, taxonomy);
      entry.newPath = `${entry.dir}/${newFilename}`;
      entry.action = 'RENAME';
      entry.confidence = 'high';
      entry.source = 'operator';
      resolved++;
    }
  }

  // Update summary counts
  manifest.summary.rename = manifest.entries.filter(e => e.action === 'RENAME').length;
  manifest.summary.skip = manifest.entries.filter(e => e.action === 'SKIP').length;
  manifest.summary.ambiguous = manifest.entries.filter(e => e.action === 'AMBIGUOUS').length;

  return { resolved, skipped };
}

/**
 * Generate artifact-rename-map.md content as a markdown table.
 *
 * @param {import('./types').ManifestEntry[]} renamedEntries - Entries that were renamed
 * @returns {string} Markdown content for the rename map file
 */
function generateRenameMap(renamedEntries) {
  const date = new Date().toISOString().split('T')[0];
  const lines = [
    `# Artifact Rename Map`,
    '',
    `**Generated:** ${date}`,
    `**Total renamed:** ${renamedEntries.length}`,
    '',
    '| Old Path | New Path |',
    '|----------|----------|'
  ];

  for (const entry of renamedEntries) {
    lines.push(`| ${entry.oldPath} | ${entry.newPath} |`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Detect the current migration state for idempotent recovery.
 * Uses commit message as primary signal (inference engine can't recognize
 * initiative-first filenames after rename — see ag-3-3 Dev Notes).
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {'complete'|'renames-done'|'fresh'} Current migration state
 */
/**
 * Generate the content for the new governance convention ADR.
 *
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {{renamedCount: number, injectedCount: number, linksUpdated: number, scopeDirs: string[]}} migrationStats
 * @returns {string} Markdown content for the ADR file
 */
function generateGovernanceADR(date, migrationStats = {}) {
  const { renamedCount = 0, injectedCount = 0, linksUpdated = 0, scopeDirs = [] } = migrationStats;
  return `# Architecture Decision Record: Artifact Governance Convention

**Status:** ACCEPTED
**Date:** ${date}
**Decision Makers:** Convoke migration tool
**Supersedes:** adr-repo-organization-conventions-2026-03-22.md

---

## Context

The project accumulated artifacts across multiple initiatives (Vortex, Gyre, Forge, Helm, Enhance, Loom, Convoke) using inconsistent naming conventions. Files like \`prd-gyre.md\`, \`architecture-gyre.md\`, and \`hc2-problem-definition-gyre-2026-03-21.md\` followed different patterns, making it difficult to identify which initiative owned each artifact and to build automated tooling on top of the artifact structure.

## Decision

All artifacts within \`_bmad-output/\` follow the governance naming convention:

\`\`\`
{initiative}-{artifact_type}[-{qualifier}][-{date}].md
\`\`\`

**Examples:**
- \`gyre-prd.md\` (initiative: gyre, type: prd)
- \`helm-lean-persona-2026-04-04.md\` (initiative: helm, type: lean-persona, date)
- \`forge-problem-def-hc2-2026-03-21.md\` (initiative: forge, type: problem-def, qualifier: hc2, date)

## Taxonomy

**Platform initiatives (8):** vortex, gyre, bmm, forge, helm, enhance, loom, convoke

**Artifact types (21):** prd, epic, arch, adr, persona, lean-persona, empathy-map, problem-def, hypothesis, experiment, signal, decision, scope, pre-reg, sprint, brief, vision, report, research, story, spec

**Aliases (migration-specific):** Historical name variants mapped to canonical initiative IDs during migration (e.g., strategy-perimeter -> helm, team-factory -> loom).

## Frontmatter Schema v1

Every governed artifact includes YAML frontmatter with these required fields:

\`\`\`yaml
---
initiative: gyre          # Required. From taxonomy.yaml
artifact_type: prd        # Required. From taxonomy.yaml
created: 2026-04-06       # Required. ISO 8601 date
schema_version: 1         # Required. Integer >= 1
---
\`\`\`

Existing frontmatter fields are preserved — migration adds fields, never overwrites.

## Migration Scope

- **Directories:** ${scopeDirs.length > 0 ? scopeDirs.join(', ') : 'planning-artifacts, vortex-artifacts, gyre-artifacts'}
- **Files renamed:** ${renamedCount}
- **Frontmatter injected:** ${injectedCount}
- **Links updated:** ${linksUpdated}
- **Archive excluded:** \`_bmad-output/_archive/\` always excluded (FR50)

## Consequences

- All artifacts are discoverable by initiative and type via filename convention
- Automated portfolio tooling can infer initiative state from artifact metadata
- \`git log --follow\` preserves full history for renamed files
- The previous convention (type-first: \`prd-gyre.md\`) is superseded
`;
}

/**
 * Update the previous ADR's status to SUPERSEDED and add a Superseded-by reference.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {string} newADRFilename - Filename of the new ADR (e.g., 'adr-artifact-governance-convention-2026-04-06.md')
 * @returns {boolean} true if updated, false if old ADR not found
 */
function supersedePreviousADR(projectRoot, newADRFilename) {
  const oldADRPath = path.join(projectRoot, '_bmad-output', 'planning-artifacts', 'adr-repo-organization-conventions-2026-03-22.md');

  if (!fs.existsSync(oldADRPath)) {
    console.warn('Warning: Previous ADR not found at expected path. Skipping supersession.');
    return false;
  }

  let content = fs.readFileSync(oldADRPath, 'utf8');

  // Replace status
  content = content.replace('**Status:** ACCEPTED', '**Status:** SUPERSEDED');

  // Insert Superseded-by line after the Supersedes line (guard against double-insertion on re-run)
  const supersedesLine = '**Supersedes:** N/A (first formal repo organization standard)';
  if (content.includes(supersedesLine) && !content.includes('**Superseded by:**')) {
    content = content.replace(
      supersedesLine,
      `${supersedesLine}\n**Superseded by:** ${newADRFilename}`
    );
  }

  fs.writeFileSync(oldADRPath, content, 'utf8');
  return true;
}

function detectMigrationState(projectRoot) {
  try {
    // Check recent commits (not just last one) to handle intervening manual commits
    const recentMsgs = execFileSync(
      'git', ['log', '-5', '--format=%s'],
      { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
    ).trim().split('\n');

    // Check in order: most recent first
    for (const msg of recentMsgs) {
      if (msg === 'chore: inject frontmatter metadata and update links' ||
          msg === 'chore: generate governance convention ADR') {
        return 'complete';
      }
      if (msg === 'chore: rename artifacts to governance convention') {
        return 'renames-done';
      }
    }
  } catch {
    // Not a git repo or no commits — treat as fresh
  }

  return 'fresh';
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
  suggestInitiative,
  suggestDifferentiator,
  FOLDER_DEFAULT_MAP,
  getGovernanceState,
  generateNewFilename,
  // Git
  ensureCleanTree,
  // Manifest
  getContextClues,
  getCrossReferences,
  buildManifestEntry,
  detectCollisions,
  generateManifest,
  formatManifest,
  // Execution
  ArtifactMigrationError,
  executeRenames,
  verifyHistoryChain,
  updateLinks,
  executeInjections,
  // Interactive & Recovery
  promptInitiative,
  resolveAmbiguous,
  generateRenameMap,
  detectMigrationState,
  generateGovernanceADR,
  supersedePreviousADR
};
