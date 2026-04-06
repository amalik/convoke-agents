#!/usr/bin/env node

/**
 * Convoke Artifact Governance Migration CLI
 *
 * Dry-run by default — shows what the migration would do without changing anything.
 * Execution (--apply) is not yet implemented (coming in ag-3-1).
 *
 * @module migrate-artifacts
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { findProjectRoot } = require('./update/lib/utils');
const {
  readTaxonomy,
  generateManifest,
  formatManifest
} = require('./lib/artifact-utils');

// --- CLI Argument Parsing ---

const DEFAULT_INCLUDE_DIRS = Object.freeze(['planning-artifacts', 'vortex-artifacts', 'gyre-artifacts']);

/** Pattern for valid directory names: lowercase alphanumeric, dashes, underscores */
const VALID_DIR_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Parse CLI arguments from argv array.
 *
 * @param {string[]} argv - Arguments (typically process.argv.slice(2))
 * @returns {{help: boolean, includeDirs: string[], apply: boolean, force: boolean, verbose: boolean}}
 */
function parseArgs(argv) {
  const help = argv.includes('--help') || argv.includes('-h');
  const apply = argv.includes('--apply');
  const force = argv.includes('--force');
  const verbose = argv.includes('--verbose');

  let includeDirs = [...DEFAULT_INCLUDE_DIRS];
  const includeIdx = argv.indexOf('--include');
  if (includeIdx !== -1) {
    const nextArg = argv[includeIdx + 1];
    // Skip if next arg is missing or is another flag
    if (nextArg && !nextArg.startsWith('--')) {
      const parsed = nextArg.split(',').map(d => d.trim()).filter(Boolean);
      // Validate: only simple directory names (no path traversal)
      const valid = parsed.filter(d => VALID_DIR_PATTERN.test(d));
      const invalid = parsed.filter(d => !VALID_DIR_PATTERN.test(d));
      if (invalid.length > 0) {
        console.warn(`Warning: Invalid directory names ignored: ${invalid.join(', ')}`);
      }
      if (valid.length > 0) {
        includeDirs = valid;
      }
    }
  }

  return { help, includeDirs, apply, force, verbose };
}

// --- Help ---

function printHelp() {
  console.log(`
Usage: convoke-migrate-artifacts [options]

Analyze artifact files and show what the governance migration would do.
Dry-run by default — no files are modified.

Options:
  --include <dirs>  Comma-separated directory names to scan (relative to _bmad-output/)
                    Default: planning-artifacts,vortex-artifacts,gyre-artifacts
  --verbose         Show cross-references for ambiguous files
  --apply           Execute the migration (not yet implemented -- coming in ag-3-1)
  --force           Bypass confirmation prompt (not yet implemented -- coming in ag-3-1)
  --help, -h        Show this help

Examples:
  convoke-migrate-artifacts                          Dry-run with default scope
  convoke-migrate-artifacts --verbose                Dry-run with cross-references
  convoke-migrate-artifacts --include planning-artifacts   Dry-run for one directory
`);
}

// --- Taxonomy Bootstrap ---

const PLATFORM_INITIATIVES = ['vortex', 'gyre', 'bmm', 'forge', 'helm', 'enhance', 'loom', 'convoke'];

const DEFAULT_ARTIFACT_TYPES = [
  'prd', 'epic', 'arch', 'adr', 'persona', 'lean-persona', 'empathy-map',
  'problem-def', 'hypothesis', 'experiment', 'signal', 'decision', 'scope',
  'pre-reg', 'sprint', 'brief', 'vision', 'report', 'research', 'story', 'spec'
];

/**
 * Create taxonomy.yaml with platform defaults if it does not exist.
 * Idempotent — never overwrites an existing file.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {boolean} true if file was created, false if already existed
 */
function bootstrapTaxonomy(projectRoot) {
  const configDir = path.join(projectRoot, '_bmad', '_config');
  const configPath = path.join(configDir, 'taxonomy.yaml');

  if (fs.existsSync(configPath)) {
    return false;
  }

  const defaults = {
    initiatives: {
      platform: PLATFORM_INITIATIVES,
      user: []
    },
    artifact_types: DEFAULT_ARTIFACT_TYPES,
    aliases: {}
  };

  const header = [
    '# Artifact Governance Taxonomy Configuration',
    '# Schema version: 1',
    `# Created by: convoke-migrate-artifacts bootstrap`,
    '#',
    '# This file is the single source of truth for initiative IDs, artifact types,',
    '# and historical name aliases used by the governance system.',
    ''
  ].join('\n');

  fs.ensureDirSync(configDir);
  fs.writeFileSync(configPath, header + yaml.dump(defaults, { lineWidth: -1 }), 'utf8');
  return true;
}

// --- Main ---

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  // --apply / --force: recognized but not yet implemented
  if (args.force && !args.apply) {
    console.log('Warning: --force has no effect without --apply. Running dry-run instead.');
  }
  if (args.apply) {
    console.log('Not yet implemented -- coming in ag-3-1');
    return;
  }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.error('Error: Not in a Convoke project. Could not find _bmad/ directory.');
    process.exit(1);
  }

  // Archive exclusion (FR50): always strip _archive from includeDirs
  const excludeDirs = ['_archive'];
  const filteredIncludeDirs = args.includeDirs.filter(d => {
    if (d === '_archive') {
      console.warn('Warning: _archive is always excluded from migration scope (FR50). Ignoring.');
      return false;
    }
    return true;
  });

  if (filteredIncludeDirs.length === 0) {
    console.error('Error: No directories to scan. All specified directories were excluded.');
    process.exit(1);
  }

  // Taxonomy bootstrap (FR49): create if absent, never overwrite
  const created = bootstrapTaxonomy(projectRoot);
  if (created) {
    console.log('Created _bmad/_config/taxonomy.yaml with platform defaults.');
  }

  // Validate taxonomy (NFR22: graceful error, no stack traces)
  try {
    readTaxonomy(projectRoot);
  } catch (err) {
    console.error(`Error: Invalid taxonomy configuration.`);
    console.error(`  ${err.message}`);
    console.error(`  Fix the file at: _bmad/_config/taxonomy.yaml`);
    process.exit(1);
  }

  // Dry-run manifest generation
  const manifest = await generateManifest(projectRoot, {
    includeDirs: filteredIncludeDirs,
    excludeDirs,
    verbose: args.verbose
  });

  const output = formatManifest(manifest, { verbose: args.verbose });
  console.log(output);
}

// Run if invoked directly
if (require.main === module) {
  main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { parseArgs, main, bootstrapTaxonomy, DEFAULT_INCLUDE_DIRS, PLATFORM_INITIATIVES, DEFAULT_ARTIFACT_TYPES, VALID_DIR_PATTERN };
