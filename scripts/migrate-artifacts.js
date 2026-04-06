#!/usr/bin/env node

/**
 * Convoke Artifact Governance Migration CLI
 *
 * Dry-run by default — shows what the migration would do without changing anything.
 * Use --apply to execute renames. Use --apply --force to skip confirmation.
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
  formatManifest,
  ensureCleanTree,
  executeRenames,
  ArtifactMigrationError,
  verifyHistoryChain,
  executeInjections,
  resolveAmbiguous,
  detectMigrationState
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
  --apply           Execute the rename migration (commit 1: git mv)
  --force           Bypass confirmation prompt (use with --apply for automation)
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

// --- Interactive Prompt ---

/**
 * Prompt the operator to confirm migration apply.
 * Exported for mocking in tests — tests should NEVER interact with real readline.
 *
 * @returns {Promise<boolean>} true if operator confirms
 */
async function confirmApply() {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.on('close', () => resolve(false)); // piped/closed stdin → reject
    rl.question('Apply migration? [y/n] ', answer => {
      rl.close();
      resolve(typeof answer === 'string' && answer.trim().toLowerCase() === 'y');
    });
  });
}

// --- Main ---

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.force && !args.apply) {
    console.log('Warning: --force has no effect without --apply. Running dry-run instead.');
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

  // Generate manifest (shared by dry-run and apply)
  const manifest = await generateManifest(projectRoot, {
    includeDirs: filteredIncludeDirs,
    excludeDirs,
    verbose: args.verbose
  });

  const output = formatManifest(manifest, { verbose: args.verbose });
  console.log(output);

  // Dry-run mode (default): just print manifest and exit
  if (!args.apply) {
    return;
  }

  // --- Apply mode ---

  // Idempotent recovery detection
  let migrationState = detectMigrationState(projectRoot);
  if (migrationState === 'complete') {
    // Secondary check: verify manifest confirms all files governed (catches new files added since migration)
    const hasWork = manifest.entries.some(e => e.action === 'RENAME' || e.action === 'AMBIGUOUS');
    if (!hasWork) {
      console.log('\nNothing to migrate -- all files governed.');
      return;
    }
    // New files found — proceed as fresh migration
    console.log('\nPrevious migration detected, but new ungoverned files found. Proceeding with fresh migration.');
    migrationState = 'fresh';
  }

  // Load taxonomy for ambiguous resolution
  const taxonomy = readTaxonomy(projectRoot);

  // Resolve ambiguous files interactively (or auto-skip in --force mode)
  const resolution = await resolveAmbiguous(manifest, taxonomy, projectRoot, { force: args.force });
  if (resolution.resolved > 0 || resolution.skipped > 0) {
    console.log(`\nAmbiguous resolution: ${resolution.resolved} resolved, ${resolution.skipped} skipped.`);
  }

  // Re-compute counts and re-check collisions after resolution (new RENAME entries may collide)
  const { detectCollisions } = require('./lib/artifact-utils');
  manifest.collisions = detectCollisions(manifest.entries);
  const renameCount = manifest.summary.rename;
  const skipCount = manifest.entries.filter(e => e.action === 'SKIP').length;
  const ambiguousLeft = manifest.summary.ambiguous;
  console.log(`\n${renameCount} files will be renamed. ${skipCount} skipped. ${ambiguousLeft} still ambiguous.`);

  // Block on collisions (includes post-resolution collisions)
  if (manifest.collisions.size > 0) {
    console.error(`Error: ${manifest.collisions.size} filename collision(s) detected. Resolve before applying.`);
    process.exit(1);
  }

  if (renameCount === 0) {
    console.log('Nothing to rename.');
    return;
  }

  // Confirmation prompt (unless --force)
  if (!args.force) {
    const confirmed = await confirmApply();
    if (!confirmed) {
      console.log('Migration aborted.');
      return;
    }
  }

  // Pre-flight: ensure clean tree
  try {
    ensureCleanTree(filteredIncludeDirs, projectRoot);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  // Execute migration phases
  try {
    // Phase routing based on idempotent recovery state
    if (migrationState === 'renames-done') {
      const priorCount = manifest.entries.filter(e => e.action === 'RENAME').length;
      console.log(`\nDetected partial migration (${priorCount} renames done, frontmatter pending). Resuming commit 2.`);
    } else {
      // Commit 1: renames
      const renameResult = executeRenames(manifest, projectRoot);
      console.log(`\nRename phase complete. ${renameResult.renamedCount} files renamed. Commit: ${renameResult.commitSha}`);

      // Verify history chain (informational)
      const renamedEntries = manifest.entries.filter(e => e.action === 'RENAME');
      const verification = verifyHistoryChain(renamedEntries, projectRoot);
      if (verification.failed.length > 0) {
        console.warn(`Warning: git log --follow failed for ${verification.failed.length} file(s):`);
        for (const f of verification.failed) {
          console.warn(`  ${f}`);
        }
      } else {
        console.log(`History chain verified for ${verification.verified} sample file(s).`);
      }
    }

    // Commit 2: frontmatter injection + link updating + rename map
    const injResult = await executeInjections(manifest, projectRoot, filteredIncludeDirs);
    console.log(`\nInjection phase complete. ${injResult.injectedCount} files injected, ${injResult.linkUpdates.updatedLinks} links updated, ${injResult.conflictCount} conflicts skipped. Commit: ${injResult.commitSha}`);

    // Final summary
    console.log(`\nMigration complete. ${renameCount} files renamed, ${injResult.injectedCount} frontmatter injected, ${injResult.linkUpdates.updatedLinks} links updated, ${skipCount} skipped.`);
  } catch (err) {
    if (err instanceof ArtifactMigrationError && err.phase === 'rename') {
      console.error(`\nRename failed: ${err.message}`);
      if (err.recoverable) {
        console.error('Rollback complete. No changes made.');
      } else {
        console.error('WARNING: Rollback may have failed. Run `git status` to check working tree state.');
      }
      process.exit(1);
    }
    if (err instanceof ArtifactMigrationError && err.phase === 'inject') {
      console.error(`\nInjection failed: ${err.message}`);
      if (err.recoverable) {
        console.error('Renames preserved (commit 1). Injections discarded.');
      } else {
        console.error('WARNING: Rollback may have failed. Run `git status` to check working tree state.');
      }
      process.exit(1);
    }
    throw err;
  }
}

// Run if invoked directly
if (require.main === module) {
  main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { parseArgs, main, confirmApply, bootstrapTaxonomy, DEFAULT_INCLUDE_DIRS, PLATFORM_INITIATIVES, DEFAULT_ARTIFACT_TYPES, VALID_DIR_PATTERN };
