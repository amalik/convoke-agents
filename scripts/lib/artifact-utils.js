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
function parseFilename(filename, taxonomy) {
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
    matchesConvention: NAMING_PATTERN.test(filename) && categorized && isValidCategory(categorized[1])
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

    const files = await fs.readdir(fullDir);
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
      `Invalid YAML in taxonomy config: ${err.message}. File: ${configPath}`
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
  const parsed = matter(fileContent);
  return { data: parsed.data, content: parsed.content };
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
  // Check tracked changes (staged and unstaged)
  try {
    execSync('git diff --quiet', { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    const diff = execSync('git diff --name-only', { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }).trim();
    throw new Error(
      'Working tree has uncommitted changes. Commit or stash before running migration.\n' +
      `Dirty files:\n${diff}`
    );
  }

  try {
    execSync('git diff --cached --quiet', { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    const staged = execSync('git diff --cached --name-only', { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }).trim();
    throw new Error(
      'Working tree has staged changes. Commit or stash before running migration.\n' +
      `Staged files:\n${staged}`
    );
  }

  // Check untracked files within scope directories
  for (const dir of scopeDirs) {
    const scopePath = path.join('_bmad-output', dir);
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

// --- Exports ---

module.exports = {
  // Constants
  VALID_CATEGORIES,
  NAMING_PATTERN,
  DATED_PATTERN,
  CATEGORIZED_PATTERN,
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
  // Git
  ensureCleanTree
};
