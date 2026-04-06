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
  const { sort = 'alpha', staleDays = 30 } = options;

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
  let unattributed = 0;

  const mdFiles = allFiles.filter(f => f.filename.endsWith('.md'));

  for (const file of mdFiles) {

    const typeResult = inferArtifactType(file.filename, taxonomy);
    const initResult = typeResult.type
      ? inferInitiative(typeResult.remainder, taxonomy)
      : { initiative: null, confidence: 'low', source: 'no-type', candidates: [] };

    // Files with no resolved initiative cannot be attributed — skip
    if (!initResult.initiative) {
      unattributed++;
      continue;
    }

    // Read frontmatter to classify governed vs ungoverned
    let frontmatter = null;
    let content = '';
    try {
      content = fs.readFileSync(file.fullPath, 'utf8');
      frontmatter = parseFrontmatter(content).data;
    } catch {
      // Unreadable — treat as no frontmatter
    }

    // Governed = has frontmatter with matching initiative field
    const isGoverned = !!(frontmatter && frontmatter.initiative && frontmatter.initiative === initResult.initiative);
    if (isGoverned) {
      governed++;
    } else {
      ungoverned++;
    }

    const enriched = {
      filename: file.filename,
      dir: file.dir,
      fullPath: file.fullPath,
      type: typeResult.type,
      hcPrefix: typeResult.hcPrefix,
      date: typeResult.date,
      initiative: initResult.initiative,
      frontmatter,
      content,
      isGoverned,
      degradedMode: !isGoverned
    };

    if (!registry.has(initResult.initiative)) {
      registry.set(initResult.initiative, []);
    }
    registry.get(initResult.initiative).push(enriched);
  }

  // FR39: warn if no governed artifacts
  if (governed === 0 && mdFiles.length > 0) {
    console.warn('Warning: No governed artifacts found. Run migration to populate.');
  }

  // Infer: run rule chain for each initiative in taxonomy
  const allInitiatives = [...taxonomy.initiatives.platform, ...taxonomy.initiatives.user];
  const results = [];

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

  // Calculate governance health score (of attributable files only — excludes unattributed)
  const attributable = governed + ungoverned;
  const healthPercentage = attributable > 0 ? Math.round((governed / attributable) * 100) : 0;

  return {
    initiatives: results,
    summary: {
      total: mdFiles.length,
      governed,
      ungoverned,
      unattributed,
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
  --terminal        Terminal table output (default)
  --markdown        Markdown table output
  --sort <mode>     Sort: alpha (default), last-activity
  --help, -h        Show this help

Examples:
  convoke-portfolio                      Default terminal view
  convoke-portfolio --markdown           Markdown output for chat/docs
  convoke-portfolio --sort last-activity Sort by most recent activity
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
  const sortMode = args.includes('--sort') && args[args.indexOf('--sort') + 1] === 'last-activity'
    ? 'last-activity'
    : 'alpha';

  try {
    const result = await generatePortfolio(projectRoot, { sort: sortMode });

    const output = useMarkdown
      ? formatMarkdown(result.initiatives)
      : formatTerminal(result.initiatives);

    console.log(output);
    console.log(`\nTotal: ${result.summary.total} artifacts | Governed: ${result.summary.governed} | Ungoverned: ${result.summary.ungoverned} | Unattributed: ${result.summary.unattributed}`);
    const hs = result.summary.healthScore;
    console.log(`Governance: ${hs.governed}/${hs.total} artifacts governed (${hs.percentage}%)`);
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

module.exports = { generatePortfolio, makeEmptyState, EXCLUDE_DIRS };
