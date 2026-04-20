#!/usr/bin/env node

/**
 * Convoke Portfolio Engine — scan → parse → infer → sort → format → output.
 * Read-only: no git writes, no file modifications.
 *
 * @module portfolio-engine
 */

const fs = require('fs-extra');
const path = require('path');
const {
  readTaxonomy,
  scanArtifactDirs,
  parseFrontmatter,
  inferArtifactType,
  inferInitiative
} = require('../artifact-utils');
const { findProjectRoot } = require('../../update/lib/utils');
const { applyFrontmatterRule } = require('./rules/frontmatter-rule');
const { applyArtifactChainRule } = require('./rules/artifact-chain-rule');
const { applyGitRecencyRule } = require('./rules/git-recency-rule');
const { applyConflictResolver } = require('./rules/conflict-resolver');
const { formatTerminal } = require('./formatters/terminal-formatter');
const { formatMarkdown } = require('./formatters/markdown-formatter');

/** Directories to exclude from portfolio scan */
const EXCLUDE_DIRS = ['_archive', 'brainstorming', 'design-artifacts', 'journey-examples', 'project-documentation', 'test-artifacts', 'drafts'];

// --- Story 6.3: Attribution helpers ---

/**
 * Scan a corpus for any taxonomy initiative ID or alias as a whole word.
 * Mirrors `_scanCorpusForInitiative` in artifact-utils.js — kept local to avoid
 * a cross-module dependency from portfolio into the migration suggester. The
 * `[a-z0-9-]` boundary class keeps kebab-case identifiers atomic so `pre-gyre`
 * does not match `gyre`.
 *
 * @param {string} corpus - Lowercased text to scan
 * @param {import('../types').TaxonomyConfig} taxonomy
 * @returns {string|null} Resolved canonical initiative ID, or null
 */
function _scanCorpus(corpus, taxonomy) {
  if (!corpus || !taxonomy || !taxonomy.initiatives) return null;
  const platform = Array.isArray(taxonomy.initiatives.platform) ? taxonomy.initiatives.platform : [];
  const user = Array.isArray(taxonomy.initiatives.user) ? taxonomy.initiatives.user : [];
  const allInitiatives = [...platform, ...user];
  const aliasKeys = taxonomy.aliases ? Object.keys(taxonomy.aliases) : [];
  const candidates = [...allInitiatives, ...aliasKeys].sort((a, b) => b.length - a.length);

  for (const candidate of candidates) {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[^a-z0-9-])${escaped}(?:$|[^a-z0-9-])`, 'i');
    if (re.test(corpus)) {
      if (allInitiatives.includes(candidate)) return candidate;
      if (taxonomy.aliases && taxonomy.aliases[candidate]) return taxonomy.aliases[candidate];
    }
  }
  return null;
}

/**
 * Map of story-key filename prefixes (that are NOT taxonomy initiatives) to
 * canonical initiative IDs. Story files (e.g. `tf-2-10-...`, `p3-1-1-...`) live
 * in `implementation-artifacts/` and use compact prefixes that aren't real
 * initiative IDs. Real-initiative prefixes (`gyre`, `forge`, `helm`, etc.) are
 * resolved separately by checking taxonomy membership directly.
 *
 * Add new entries here when a new initiative starts producing stories under a
 * non-initiative prefix.
 */
const STORY_PREFIX_MAP = Object.freeze({
  ag: 'convoke',     // Artifact Governance — platform-level work
  tf: 'loom',        // Team Factory → Loom
  p2: 'convoke',     // Phase 2 — platform stabilization
  p3: 'convoke',     // Phase 3 — Convoke rename
  enh: 'enhance',    // Enhance module
  sp: 'convoke',     // Skill Portability — platform-level
});

/**
 * Folder defaults for the portfolio engine. Mirrors the migration suggester:
 * `planning-artifacts` is for cross-cutting convoke platform artifacts.
 * Other dirs (`vortex-artifacts`, `implementation-artifacts`) are heterogeneous
 * — no safe default, so they fall through to subsequent inference layers.
 */
const PORTFOLIO_FOLDER_DEFAULT_MAP = Object.freeze({
  'planning-artifacts': 'convoke'
});

/**
 * Attribute a file to an initiative when filename inference fails.
 * Six-step priority chain (highest first):
 *   1. frontmatter.title keyword scan          → 'frontmatter-title'
 *   2. first 5 lines of content keyword scan   → 'content-fallback'
 *   3. filename first-segment matches a real taxonomy initiative (e.g. `gyre-1-1-...`)
 *      → 'filename-prefix'
 *   4. parent directory name (e.g. `gyre-artifacts/`) → 'parent-dir'
 *   5. story-key prefix mapping (e.g. `tf-2-10-...` → loom) → 'story-prefix'
 *   6. folder default (e.g. `planning-artifacts/` → convoke) → 'folder-default'
 *
 * @param {Object} fileInfo - File descriptor with filename and dir
 * @param {string} content - Already-loaded file content
 * @param {Object|null} frontmatter - Parsed frontmatter or null
 * @param {import('../types').TaxonomyConfig} taxonomy
 * @returns {{initiative: string|null, source: string|null}}
 */
function attributeFile(fileInfo, content, frontmatter, taxonomy) {
  // Step 1: Frontmatter title scan (highest priority)
  if (frontmatter && typeof frontmatter.title === 'string' && frontmatter.title.length > 0) {
    const match = _scanCorpus(frontmatter.title.toLowerCase(), taxonomy);
    if (match) return { initiative: match, source: 'frontmatter-title' };
  }

  // Step 2: First-5-lines content scan
  // Strip frontmatter before scanning so non-title fields (e.g. `tags: [gyre]`)
  // don't false-trigger content-fallback. The migration suggester does the same.
  if (content && content.length > 0) {
    let body = content;
    try {
      const parsed = parseFrontmatter(content);
      if (parsed && typeof parsed.content === 'string') {
        body = parsed.content;
      }
    } catch {
      // Frontmatter parse failed — fall back to raw content
    }
    const corpus = body.split('\n').slice(0, 5).join(' ').toLowerCase();
    const match = _scanCorpus(corpus, taxonomy);
    if (match) return { initiative: match, source: 'content-fallback' };
  }

  // Step 3: Filename first-segment matches a real taxonomy initiative.
  // Catches patterns like `gyre-1-1-...`, `forge-epic-1-...`, `helm-prd.md`,
  // and also single-word filenames like `gyre.md` (extension stripped first).
  if (fileInfo.filename && taxonomy && taxonomy.initiatives) {
    const platform = Array.isArray(taxonomy.initiatives.platform) ? taxonomy.initiatives.platform : [];
    const user = Array.isArray(taxonomy.initiatives.user) ? taxonomy.initiatives.user : [];
    const allInitiatives = new Set([...platform, ...user]);
    const stem = fileInfo.filename.replace(/\.(md|yaml|yml)$/i, '');
    const firstSegment = stem.split('-')[0].toLowerCase();
    if (allInitiatives.has(firstSegment)) {
      return { initiative: firstSegment, source: 'filename-prefix' };
    }
  }

  // Step 4: Parent directory scan
  // The dir is something like `gyre-artifacts` — split on dashes and check each
  // segment against the taxonomy. We can't reuse `_scanCorpus` here because it
  // uses a kebab-aware boundary class (`[a-z0-9-]`) that intentionally treats
  // `gyre-artifacts` as a single token, which is correct for content scanning
  // but wrong for directory naming where `-` IS the segment separator.
  if (fileInfo.dir && taxonomy && taxonomy.initiatives) {
    const platform = Array.isArray(taxonomy.initiatives.platform) ? taxonomy.initiatives.platform : [];
    const user = Array.isArray(taxonomy.initiatives.user) ? taxonomy.initiatives.user : [];
    const allInitiatives = new Set([...platform, ...user]);
    const aliases = taxonomy.aliases || {};
    const dirSegments = fileInfo.dir.toLowerCase().split('-');
    for (const seg of dirSegments) {
      if (allInitiatives.has(seg)) {
        return { initiative: seg, source: 'parent-dir' };
      }
      if (aliases[seg]) {
        return { initiative: aliases[seg], source: 'parent-dir' };
      }
    }
  }

  // Step 5: Story-key prefix mapping
  // Match patterns like `tf-2-10-...`, `p3-epic-2-retrospective`, `ag-1-1-...`
  // Take the first dash-separated segment of the filename stem and look it up in STORY_PREFIX_MAP.
  if (fileInfo.filename) {
    const stem = fileInfo.filename.replace(/\.(md|yaml|yml)$/i, '');
    const firstSegment = stem.split('-')[0].toLowerCase();
    if (Object.prototype.hasOwnProperty.call(STORY_PREFIX_MAP, firstSegment)) {
      return { initiative: STORY_PREFIX_MAP[firstSegment], source: 'story-prefix' };
    }
  }

  // Step 6: Folder default — last resort for cross-cutting platform artifacts
  // (e.g. `planning-artifacts/architecture.md` → convoke)
  if (fileInfo.dir && Object.prototype.hasOwnProperty.call(PORTFOLIO_FOLDER_DEFAULT_MAP, fileInfo.dir)) {
    const defaultInit = PORTFOLIO_FOLDER_DEFAULT_MAP[fileInfo.dir];
    if (defaultInit) {
      return { initiative: defaultInit, source: 'folder-default' };
    }
  }

  return { initiative: null, source: null };
}

/**
 * Produce a one-line reason explaining why a file could not be attributed.
 *
 * @param {Object} fileInfo - File descriptor
 * @param {string} content - File content (may be empty if unreadable)
 * @param {Object|null} _frontmatter - Frontmatter (reserved for future heuristics)
 * @returns {string} Reason
 */
function explainUnattributed(fileInfo, content, _frontmatter) {
  if (!content || content.length === 0) {
    return 'unreadable or empty';
  }
  // Check whether the filename has a recognizable type prefix BEFORE checking content length —
  // matches the spec's order so a 3-line file with no prefix returns the more actionable
  // 'no type prefix' message rather than 'insufficient content'.
  const hasTypePrefix = /^[a-z]+\d*-/.test(fileInfo.filename);
  if (!hasTypePrefix) {
    return 'no type prefix in filename';
  }
  const lineCount = content.split('\n').length;
  if (lineCount < 5) {
    return 'insufficient content for inference';
  }
  return 'no initiative signal in filename, frontmatter title, content, or parent directory';
}

/**
 * Create an empty InitiativeState for a given initiative.
 * @param {string} initiative - Initiative ID
 * @returns {import('../types').InitiativeState}
 */
function makeEmptyState(initiative) {
  return {
    initiative,
    phase: { value: null, source: null, confidence: null },
    status: { value: null, source: null, confidence: null },
    lastArtifact: { file: null, date: null },
    nextAction: { value: null, source: null }
  };
}

/**
 * Generate portfolio view of all initiatives.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {Object} [options={}]
 * @param {string} [options.sort='alpha'] - Sort mode: 'alpha' or 'last-activity'
 * @param {number} [options.staleDays=30] - Days threshold for stale detection
 * @returns {Promise<{initiatives: import('../types').InitiativeState[], summary: {total: number, governed: number, ungoverned: number}}>}
 */
async function generatePortfolio(projectRoot, options = {}) {
  const { sort = 'alpha', staleDays = 30, wipThreshold = 4, filter = null } = options;

  // Pre-flight: read taxonomy (FR39 — error if absent)
  const taxonomy = readTaxonomy(projectRoot);

  // Scan: discover subdirectories dynamically
  const outputDir = path.join(projectRoot, '_bmad-output');
  if (!fs.existsSync(outputDir)) {
    console.warn('Warning: _bmad-output/ directory not found.');
    return { initiatives: [], summary: { total: 0, governed: 0, ungoverned: 0 } };
  }
  const allDirs = fs.readdirSync(outputDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE_DIRS.includes(e.name))
    .map(e => e.name);

  const allFiles = await scanArtifactDirs(projectRoot, allDirs, ['_archive']);

  // Parse: index files by initiative
  const registry = new Map();
  let governed = 0;
  let ungoverned = 0;
  let attributableButUngoverned = 0; // Story 6.3: counts files attributed via fallback layers
  const unattributedFiles = []; // Story 6.3: track per-file reasons (replaces bare counter)

  const mdFiles = allFiles.filter(f => f.filename.endsWith('.md'));

  for (const file of mdFiles) {

    // Read frontmatter FIRST — governed files have authoritative metadata
    let frontmatter = null;
    let content = '';
    let readFailed = false;
    try {
      content = fs.readFileSync(file.fullPath, 'utf8');
      frontmatter = parseFrontmatter(content).data;
    } catch {
      // Unreadable — treat as no frontmatter and skip fallback attribution
      // (otherwise filename-prefix/story-prefix could silently attribute a file we never read)
      readFailed = true;
    }

    // Strategy: frontmatter initiative is authoritative if present
    let initiative, artifactType, isGoverned, typeResult;
    let attributionSource = null; // Story 6.3: tracks which fallback layer provided the attribution

    if (frontmatter && frontmatter.initiative && frontmatter.artifact_type) {
      // Governed file — use frontmatter as source of truth
      initiative = frontmatter.initiative;
      artifactType = frontmatter.artifact_type;
      isGoverned = true;
      governed++;
      typeResult = { type: artifactType, hcPrefix: null, remainder: '', date: null, typeConfidence: 'high', typeSource: 'frontmatter' };
    } else {
      // Ungoverned file — fall back to filename inference
      typeResult = inferArtifactType(file.filename, taxonomy);
      const initResult = typeResult.type
        ? inferInitiative(typeResult.remainder, taxonomy)
        : { initiative: null, confidence: 'low', source: 'no-type', candidates: [] };

      if (initResult.initiative) {
        initiative = initResult.initiative;
        artifactType = typeResult.type;
        isGoverned = false;
        ungoverned++;
      } else if (readFailed) {
        // Don't attempt fallback attribution on a file we couldn't read —
        // otherwise filename/story-prefix layers would silently produce a phantom attribution.
        unattributedFiles.push({
          filename: file.filename,
          dir: file.dir,
          reason: 'unreadable or empty'
        });
        continue;
      } else {
        // Story 6.3: try content-fallback layers before giving up
        const fallback = attributeFile(file, content, frontmatter, taxonomy);
        if (fallback.initiative) {
          initiative = fallback.initiative;
          // Type may not be inferable — synthetic 'unknown' so registry can still index it
          artifactType = typeResult.type || 'unknown';
          isGoverned = false;
          ungoverned++;
          attributableButUngoverned++;
          attributionSource = fallback.source;
        } else {
          // Truly unattributed — record reason for the diagnostic section
          unattributedFiles.push({
            filename: file.filename,
            dir: file.dir,
            reason: explainUnattributed(file, content, frontmatter)
          });
          continue;
        }
      }
    }

    const enriched = {
      filename: file.filename,
      dir: file.dir,
      fullPath: file.fullPath,
      type: artifactType,
      hcPrefix: typeResult.hcPrefix,
      date: typeResult.date,
      initiative,
      frontmatter,
      content,
      isGoverned,
      degradedMode: !isGoverned,
      // Story 6.3: 'frontmatter-title' | 'content-fallback' | 'filename-prefix' | 'parent-dir' | 'story-prefix' | 'folder-default' | null
      attributionSource
    };

    if (!registry.has(initiative)) {
      registry.set(initiative, []);
    }
    registry.get(initiative).push(enriched);
  }
  const unattributed = unattributedFiles.length;

  // FR39: warn if no governed artifacts
  if (governed === 0 && mdFiles.length > 0) {
    console.warn('Warning: No governed artifacts found. Run migration to populate.');
  }

  // Infer: run rule chain for each initiative in taxonomy
  const allInitiatives = [...taxonomy.initiatives.platform, ...taxonomy.initiatives.user];
  let results = [];

  for (const initiative of allInitiatives) {
    const artifacts = registry.get(initiative) || [];
    let state = makeEmptyState(initiative);
    state = applyFrontmatterRule(state, artifacts, { projectRoot });
    state = applyArtifactChainRule(state, artifacts, { projectRoot });
    state = applyGitRecencyRule(state, artifacts, { projectRoot, staleDays });
    state = applyConflictResolver(state, artifacts, { projectRoot });
    results.push(state);
  }

  // Sort
  if (sort === 'last-activity') {
    results.sort((a, b) => (b.lastArtifact.date || '').localeCompare(a.lastArtifact.date || ''));
  } else {
    results.sort((a, b) => a.initiative.localeCompare(b.initiative));
  }

  // Filter by initiative prefix (before WIP count)
  if (filter) {
    const prefix = filter.replace(/\*$/, '');
    results = results.filter(s => s.initiative.startsWith(prefix));
  }

  // WIP radar: count active initiatives (ongoing, blocked, or stale)
  const activeStatuses = ['ongoing', 'stale', 'blocked'];
  const activeInitiatives = results.filter(s => activeStatuses.includes(s.status.value));
  const wipRadar = activeInitiatives.length > wipThreshold
    ? {
      active: activeInitiatives.length,
      threshold: wipThreshold,
      initiatives: activeInitiatives
        .sort((a, b) => (b.lastArtifact.date || '').localeCompare(a.lastArtifact.date || ''))
        .map(s => s.initiative)
    }
    : null;

  // Calculate governance health score (of attributable files only — excludes unattributed)
  const attributable = governed + ungoverned;
  const healthPercentage = attributable > 0 ? Math.round((governed / attributable) * 100) : 0;

  return {
    initiatives: results,
    wipRadar,
    unattributedFiles, // Story 6.3: full list with reasons (for --show-unattributed)
    summary: {
      total: mdFiles.length,
      governed,
      ungoverned,
      unattributed,
      attributableButUngoverned, // Story 6.3: count of files attributed via fallback layers
      healthScore: { governed, total: attributable, percentage: healthPercentage }
    }
  };
}

// --- CLI ---

function printHelp() {
  console.log(`
Usage: convoke-portfolio [options]

Generate a portfolio view of all initiatives from artifact analysis.

Options:
  --terminal           Terminal table output (default)
  --markdown           Markdown table output
  --sort <mode>        Sort: alpha (default), last-activity
  --filter <prefix>    Filter initiatives by prefix (e.g., --filter gyre)
  --verbose            Show inference trace per initiative (source + confidence)
  --show-unattributed  List each unattributed file with its reason
  --help, -h           Show this help

Examples:
  convoke-portfolio                       Default terminal view
  convoke-portfolio --markdown            Markdown output for chat/docs
  convoke-portfolio --sort last-activity  Sort by most recent activity
  convoke-portfolio --show-unattributed   See why each unattributed file was skipped
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.error('Error: Not in a Convoke project. Could not find _bmad/ directory.');
    process.exit(1);
  }

  const useMarkdown = args.includes('--markdown');
  const useVerbose = args.includes('--verbose');
  const showUnattributed = args.includes('--show-unattributed');
  const sortMode = args.includes('--sort') && args[args.indexOf('--sort') + 1] === 'last-activity'
    ? 'last-activity'
    : 'alpha';
  const filterIdx = args.indexOf('--filter');
  const filterPattern = (filterIdx !== -1 && args[filterIdx + 1] && !args[filterIdx + 1].startsWith('--'))
    ? args[filterIdx + 1]
    : null;

  // Read portfolio config from _bmad/bmm/config.yaml (optional)
  let wipThreshold = 4;
  let staleDays = 30;
  try {
    const yaml = require('js-yaml');
    const configPath = path.join(projectRoot, '_bmad', 'bmm', 'config.yaml');
    if (fs.existsSync(configPath)) {
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      if (config && config.portfolio) {
        const wt = Number(config.portfolio.wip_threshold);
        if (!isNaN(wt)) wipThreshold = wt;
        const sd = Number(config.portfolio.stale_days);
        if (!isNaN(sd)) staleDays = sd;
      }
    }
  } catch {
    // Config read failed — use defaults
  }

  try {
    const result = await generatePortfolio(projectRoot, {
      sort: sortMode,
      filter: filterPattern,
      wipThreshold,
      staleDays
    });

    const output = useMarkdown
      ? formatMarkdown(result.initiatives, {
          showUnattributed,
          unattributedFiles: result.unattributedFiles,
        })
      : formatTerminal(result.initiatives);

    console.log(output);

    // WIP radar (only when threshold exceeded)
    if (result.wipRadar) {
      console.log(`\nWIP: ${result.wipRadar.active} active (threshold: ${result.wipRadar.threshold}) -- sorted by last activity`);
      console.log(`  ${result.wipRadar.initiatives.join(', ')}`);
    }

    console.log(`\nTotal: ${result.summary.total} artifacts | Governed: ${result.summary.governed} | Ungoverned: ${result.summary.ungoverned} | Unattributed: ${result.summary.unattributed}`);
    const hs = result.summary.healthScore;
    console.log(`Governance: ${hs.governed}/${hs.total} artifacts governed (${hs.percentage}%)`);

    // Story 6.3: Surface attributable-but-ungoverned guidance
    if (result.summary.attributableButUngoverned > 0) {
      console.log(
        `${result.summary.attributableButUngoverned} files attributable to existing initiatives ` +
        `but ungoverned — run convoke-migrate-artifacts to govern them`
      );
    }

    // Story 6.3 / I20: terminal unattributed details are rendered here; markdown details are rendered inside formatMarkdown().
    // The non-details hint line ("N unattributed files (run with --show-unattributed)") is emitted for both paths so markdown
    // consumers aren't silently deprived of the flag hint.
    if (result.unattributedFiles && result.unattributedFiles.length > 0) {
      if (showUnattributed) {
        if (!useMarkdown) {
          console.log(`\n--- Unattributed Files (${result.unattributedFiles.length}) ---`);
          for (const u of result.unattributedFiles) {
            console.log(`  ${u.dir}/${u.filename}: ${u.reason}`);
          }
        }
      } else {
        console.log(
          `\n${result.unattributedFiles.length} unattributed files ` +
          `(run with --show-unattributed to see details)`
        );
      }
    }

    // Verbose: inference trace per initiative
    if (useVerbose) {
      console.log('\n--- Inference Trace ---');
      for (const s of result.initiatives) {
        const p = s.phase;
        const st = s.status;
        console.log(`  [${s.initiative}] phase: ${p.value} (${p.source}, ${p.confidence}) | status: ${st.value} (${st.source}, ${st.confidence})`);
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  generatePortfolio,
  makeEmptyState,
  attributeFile,
  explainUnattributed,
  EXCLUDE_DIRS,
  STORY_PREFIX_MAP,
  PORTFOLIO_FOLDER_DEFAULT_MAP
};
