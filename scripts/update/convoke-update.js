#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
const versionDetector = require('./lib/version-detector');
const migrationRunner = require('./lib/migration-runner');
const registry = require('./migrations/registry');
const { findProjectRoot } = require('./lib/utils');
const { readChangelogEntries } = require('./lib/changelog-reader');
const { runCompatPreflight } = require('./lib/compat-preflight');
// Story v63-2-3: post-upgrade governance gate. `checkBmmDependencies` is
// lazy-required inside `_runPostUpgradeGate` (Round 1 R1-M2 fix) so a
// load-time error in convoke-doctor can't abort convoke-update startup, and
// non-gate exit paths (no-project / fresh / broken / downgrade) don't pay the
// transitive import cost.

/**
 * Convoke Update CLI
 * Main update command for users
 */

/**
 * Assess the current installation and determine what update action is needed.
 * Pure logic — no I/O, no process.exit. Returns a structured decision object.
 *
 * @param {string|null} projectRoot - Project root path (null if not found)
 * @returns {object} Assessment result with action, versions, migrations, breakingChanges
 */
function assessUpdate(projectRoot) {
  if (!projectRoot) {
    return { action: 'no-project' };
  }

  const currentVersion = versionDetector.getCurrentVersion(projectRoot);
  const targetVersion = versionDetector.getTargetVersion();
  const scenario = versionDetector.detectInstallationScenario(projectRoot);

  if (scenario === 'fresh') {
    return { action: 'fresh', scenario };
  }

  if (scenario === 'partial' || scenario === 'corrupted') {
    return { action: 'broken', scenario };
  }

  if (!currentVersion) {
    return { action: 'no-version', scenario };
  }

  const migrationPath = versionDetector.getMigrationPath(currentVersion, targetVersion);

  if (migrationPath.type === 'up-to-date') {
    return { action: 'up-to-date', currentVersion, targetVersion };
  }

  if (migrationPath.type === 'downgrade') {
    return { action: 'downgrade', currentVersion, targetVersion };
  }

  const migrations = registry.getMigrationsFor(currentVersion);
  const breakingChanges = registry.getBreakingChanges(currentVersion);

  if (migrations.length === 0) {
    return { action: 'refresh-only', currentVersion, targetVersion };
  }

  return {
    action: 'upgrade',
    currentVersion,
    targetVersion,
    migrations,
    breakingChanges
  };
}

// --- Story v63-2-3: post-upgrade BMM dependency gate ---

/**
 * Run the governance gate against the post-upgrade state and render findings
 * to stdout. Fail-soft per NFR9: scan-failure or any internal error falls back
 * to a single yellow warning + gray fix hint; exit code is never escalated.
 *
 * Wired into BOTH successful state-changing exit paths: `refresh-only` (after
 * runRefreshOnly) and `upgrade` (after runMigrations). Skipped in `--dry-run`
 * by placement — the dry-run branches exit before reaching the runXxx() calls.
 *
 * @param {string} projectRoot - Absolute project root resolved by main().
 */
function _runPostUpgradeGate(projectRoot) {
  try {
    // Lazy-require (R1-M2): a load-time failure in convoke-doctor (syntax
    // error, missing transitive dep) would abort convoke-update at startup if
    // this were a top-level require. Inline-requiring inside the try/catch
    // ensures such failures fall through to the fail-soft warning branch.
    // Early exit paths (no-project, fresh, broken, etc.) also skip the import
    // cost entirely.
    const { checkBmmDependencies } = require('../convoke-doctor');
    // R2-M3: distinguish a wiring bug (missing / renamed export) from a scan
    // failure. Without this, a destructure-to-undefined throws `TypeError:
    // checkBmmDependencies is not a function` via the outer catch, which the
    // operator sees as "scan failed" — obscuring the real root cause.
    if (typeof checkBmmDependencies !== 'function') {
      throw new Error('convoke-doctor does not export checkBmmDependencies (wiring bug, not scan failure)');
    }
    const findings = checkBmmDependencies(projectRoot);
    _printPostUpgradeGate(findings);
  } catch (err) {
    // AC6: scan failure is fail-soft. Render a single yellow warning and
    // continue. Never re-throw — call-sites place this AFTER the migration
    // try/catch, so any throw here would leak to main() as an uncaught
    // exception. Belt-and-braces: swallow everything, rendering included.
    try {
      console.log('');
      console.log(chalk.yellow(`  ⚠ Governance gate: scan failed — ${(err && err.message) || String(err)}`));
      console.log(chalk.gray('    Run: node scripts/audit/audit-bmm-dependencies.js --dry-run'));
      console.log('');
    } catch (_renderErr) {
      // Even the warning-render failed (stdout closed?). Nothing sensible we
      // can do — swallow to preserve the exit-0 contract.
    }
  }
}

/**
 * Render the gate's findings with convoke-doctor's visual conventions.
 * Intentionally NOT sharing `printResults` from convoke-doctor: the summary
 * wording differs ("BMM registry consistent — no drift" vs "All N checks
 * passed"), and a shared helper would obscure the context-specific messaging.
 *
 * @param {Array<{name: string, passed: boolean, softWarning?: boolean, warning?: string, info?: string, error?: string, fix?: string}>} findings
 */
function _printPostUpgradeGate(findings) {
  // R2-M4: non-array types indicate contract drift in checkBmmDependencies
  // (e.g., a refactor that returns `{ findings: [...] }` or `null`). Surface
  // this as a fail-soft warning rather than silently rendering nothing — a
  // broken contract should be visible, not invisible.
  if (!Array.isArray(findings)) {
    console.log('');
    console.log(chalk.yellow(`  ⚠ Governance gate: contract drift — findings was ${findings === null ? 'null' : typeof findings}, expected array`));
    console.log(chalk.gray('    Run: node scripts/audit/audit-bmm-dependencies.js --dry-run'));
    console.log('');
    return;
  }

  // Always render the header + summary line, even when findings.length === 0
  // (R2-L3). Silent return would leave the operator with no evidence the gate
  // executed. An empty array is treated as all-clean.
  console.log('');
  console.log(chalk.cyan.bold('Post-upgrade governance check:'));

  // Track soft and hard counts separately (R1-M1). Story 2.2 guarantees
  // governance findings always set `softWarning: true` when `passed: false`,
  // so hardFailCount should stay 0 in practice — but if Story 2.2's contract
  // ever drifts or a third-party check plugs in, the summary must not
  // misreport hard-fail findings as "0 governance warning(s) surfaced".
  let softWarnCount = 0;
  let hardFailCount = 0;

  for (const check of findings) {
    // R2-L4: guard against null/undefined entries in findings array. A null
    // would throw TypeError on `check.name` access and cause the outer catch
    // to fire "scan failed" — obscuring any valid findings in the same array.
    if (!check || typeof check !== 'object') continue;

    // R1-L1: defensive field guards. Malformed findings render a placeholder
    // name instead of the literal string "undefined".
    const name = typeof check.name === 'string' && check.name.length > 0
      ? check.name
      : '(unnamed check)';

    // R2-L2: check softWarning FIRST. Story 2.2's contract is
    // `softWarning: true` ⇒ `passed: false`, but a contradictory finding
    // `{passed: true, softWarning: true}` should NOT render as clean — the
    // softWarning flag IS the advisory signal and must drive the branch.
    if (check.softWarning) {
      softWarnCount += 1;
      console.log(chalk.yellow(`  ⚠ ${name}`));
      const msg = (typeof check.warning === 'string' && check.warning)
        || (typeof check.error === 'string' && check.error)
        || '';
      if (msg) console.log(chalk.yellow(`    ${msg}`));
      // R1-L2: only split `fix` if it's already a string. Non-string fix
      // would render `[object Object]` under a blind String() coercion.
      if (typeof check.fix === 'string' && check.fix.length > 0) {
        check.fix.split('\n').forEach(line => console.log(chalk.gray(`    ${line}`)));
      }
    } else if (check.passed) {
      console.log(chalk.green(`  ✓ ${name}`));
      if (typeof check.info === 'string' && check.info.length > 0) {
        console.log(chalk.gray(`    ${check.info}`));
      }
    } else {
      // Defensive hard-fail branch: see hardFailCount rationale above.
      hardFailCount += 1;
      console.log(chalk.red(`  ✗ ${name}`));
      const msg = (typeof check.warning === 'string' && check.warning)
        || (typeof check.error === 'string' && check.error)
        || '';
      if (msg) console.log(chalk.red(`    ${msg}`));
      if (typeof check.fix === 'string' && check.fix.length > 0) {
        console.log(chalk.yellow(`    Fix: ${check.fix}`));
      }
    }
  }

  // Summary line (R1-M1 fix): faithfully reports both counts.
  const allClean = softWarnCount === 0 && hardFailCount === 0;
  if (allClean) {
    console.log(chalk.green('  BMM registry consistent — no drift'));
  } else if (hardFailCount > 0 && softWarnCount > 0) {
    console.log(chalk.red(`  ${hardFailCount} issue(s) + ${softWarnCount} governance warning(s) surfaced`));
    console.log(chalk.gray('  Run `convoke-doctor` for detailed governance checks.'));
  } else if (hardFailCount > 0) {
    console.log(chalk.red(`  ${hardFailCount} issue(s) surfaced`));
    console.log(chalk.gray('  Run `convoke-doctor` for detailed governance checks.'));
  } else {
    console.log(chalk.yellow(`  ${softWarnCount} governance warning(s) surfaced (non-blocking)`));
    console.log(chalk.gray('  Run `convoke-doctor` for detailed governance checks.'));
  }
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const yes = args.includes('--yes') || args.includes('-y');
  const verbose = args.includes('--verbose') || args.includes('-v');

  // Header
  console.log('');
  console.log(chalk.bold.magenta('╔════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('║   Convoke Update Manager               ║'));
  console.log(chalk.bold.magenta('╚════════════════════════════════════════╝'));
  console.log('');

  const projectRoot = findProjectRoot();

  // Story v63-3-2 (FR23): runtime BMAD-version preflight (soft-warn only).
  if (projectRoot) runCompatPreflight(projectRoot);

  const assessment = assessUpdate(projectRoot);

  switch (assessment.action) {
    case 'no-project':
      console.log(chalk.red('Not in a Convoke project. Could not find _bmad/ directory.'));
      console.log('');
      console.log('Run: ' + chalk.cyan('npx -p convoke-agents convoke-install'));
      console.log('');
      process.exit(1);
      break;

    case 'fresh':
      console.log(chalk.yellow('No previous installation detected.'));
      console.log('');
      console.log('Run: ' + chalk.cyan('npx -p convoke-agents convoke-install'));
      console.log('');
      process.exit(0);
      break;

    case 'broken':
      console.log(chalk.red('Installation appears incomplete or corrupted.'));
      console.log('');
      console.log('Recommend running: ' + chalk.cyan('npx -p convoke-agents convoke-install'));
      console.log('');
      process.exit(1);
      break;

    case 'no-version':
      console.log(chalk.yellow('Could not detect current version.'));
      console.log('');
      console.log('Run: ' + chalk.cyan('npx -p convoke-agents convoke-install'));
      console.log('');
      process.exit(0);
      break;

    case 'up-to-date':
      console.log(chalk.green(`✓ Already up to date! (v${assessment.currentVersion})`));
      console.log('');
      console.log(chalk.gray('If you expected a newer version, npx may be serving a cached copy.'));
      console.log(chalk.gray('Run: ') + chalk.cyan('npx -p convoke-agents@latest convoke-update'));
      console.log('');
      process.exit(0);
      break;

    case 'downgrade':
      console.log(chalk.red.bold('⚠ DOWNGRADE DETECTED'));
      console.log('');
      console.log(`  Current version: ${assessment.currentVersion}`);
      console.log(`  Package version: ${assessment.targetVersion}`);
      console.log('');
      console.log(chalk.gray('This usually means npx is serving a cached older package.'));
      console.log(chalk.gray('Run: ') + chalk.cyan('npx -p convoke-agents@latest convoke-update'));
      console.log('');
      console.log(chalk.gray('If the issue persists, clear the cache and reinstall:'));
      console.log(chalk.cyan('  npm cache clean --force && npm install convoke-agents@latest'));
      console.log('');
      console.log(chalk.yellow('If you intentionally want to downgrade:'));
      console.log('  1. Backup your installation');
      console.log('  2. Uninstall current version');
      console.log('  3. Install desired version');
      console.log('');
      process.exit(1);
      break;

    case 'refresh-only':
    case 'upgrade':
      break; // Continue below
  }

  // Refresh-only: no migration deltas, just update files to latest version
  if (assessment.action === 'refresh-only') {
    console.log(chalk.cyan('Update Plan:'));
    console.log(`  From: ${chalk.red(assessment.currentVersion)}`);
    console.log(`  To:   ${chalk.green(assessment.targetVersion)}`);
    console.log('');
    console.log(chalk.cyan('No migration deltas needed — refreshing installation files.'));
    console.log('');

    printChangelog(assessment.currentVersion, assessment.targetVersion);

    if (dryRun) {
      console.log(chalk.yellow.bold('DRY RUN — no changes will be made'));
      console.log('');
      process.exit(0);
    }

    if (!yes) {
      console.log(chalk.cyan('Your data will be backed up automatically.'));
      console.log('');
      const confirmed = await confirm('Proceed with update?');
      if (!confirmed) {
        console.log('');
        console.log(chalk.yellow('Update cancelled.'));
        console.log('');
        process.exit(0);
      }
    }

    console.log('');
    console.log(chalk.cyan.bold('Starting update...'));

    try {
      const result = await migrationRunner.runRefreshOnly(assessment.currentVersion, { verbose });

      console.log('');
      console.log(chalk.green.bold('✓ Update completed successfully!'));
      console.log('');
      console.log(chalk.cyan('Changes applied:'));
      result.changes.forEach(change => {
        console.log(chalk.green(`  ✓ ${change}`));
      });
      console.log('');
      console.log(chalk.gray(`Backup location: ${result.backupMetadata.backup_dir}`));
      console.log('');
    } catch (_error) {
      process.exit(1);
    }

    // Story v63-2-3: post-upgrade BMM dependency gate. Runs on refresh-only
    // success path (state changed, governance drift possible).
    _runPostUpgradeGate(projectRoot);

    process.exit(0);
  }

  // Show migration plan
  console.log(chalk.cyan('Migration Plan:'));
  console.log(`  From: ${chalk.red(assessment.currentVersion)}`);
  console.log(`  To:   ${chalk.green(assessment.targetVersion)}`);
  console.log('');

  console.log(chalk.cyan('Migrations to apply:'));
  assessment.migrations.forEach((m, i) => {
    const icon = m.breaking ? chalk.red('⚠') : chalk.green('✓');
    console.log(`  ${i + 1}. ${icon} ${m.description}`);
  });
  console.log('');

  if (assessment.breakingChanges.length > 0) {
    console.log(chalk.red.bold('⚠ BREAKING CHANGES:'));
    assessment.breakingChanges.forEach(change => {
      console.log(chalk.yellow(`  - ${change}`));
    });
    if (assessment.migrations.some(m => m.name && m.name.endsWith('-to-4.0.0'))) {
      console.log(chalk.cyan('  Migration guide: https://github.com/amalik/convoke-agents/blob/main/docs/migration/3.x-to-4.0.md'));
    }
    console.log('');
  }

  printChangelog(assessment.currentVersion, assessment.targetVersion);

  // Dry run - preview only
  if (dryRun) {
    console.log(chalk.yellow.bold('DRY RUN - Previewing changes'));
    console.log('');

    try {
      await migrationRunner.runMigrations(assessment.currentVersion, { dryRun: true, verbose });
    } catch (error) {
      console.error(chalk.red('Error during preview:'), error.message);
      process.exit(1);
    }

    process.exit(0);
  }

  // Confirm with user (unless --yes)
  if (!yes) {
    console.log(chalk.cyan('Your data will be backed up automatically before migration.'));
    console.log('');

    const confirmed = await confirm('Proceed with migration?');

    if (!confirmed) {
      console.log('');
      console.log(chalk.yellow('Migration cancelled.'));
      console.log('');
      process.exit(0);
    }
  }

  // Run migrations
  console.log('');
  console.log(chalk.cyan.bold('Starting migration...'));

  try {
    const result = await migrationRunner.runMigrations(assessment.currentVersion, { verbose });

    console.log('');
    console.log(chalk.green.bold('✓ Migration completed successfully!'));
    console.log('');
    console.log(chalk.cyan('Changes applied:'));
    result.results.forEach(r => {
      console.log(chalk.green(`  ✓ ${r.name}`));
      if (verbose) {
        r.changes.forEach(change => {
          console.log(chalk.gray(`    - ${change}`));
        });
      }
    });
    console.log('');
    console.log(chalk.gray(`Backup location: ${result.backupMetadata.backup_dir}`));
    console.log('');

  } catch (_error) {
    // Error already logged by migration-runner
    process.exit(1);
  }

  // Story v63-2-3: post-upgrade BMM dependency gate (R1-M3 placement).
  // OUTSIDE the migration try/catch so any helper exception (despite the
  // helper's own belt-and-braces try/catch) is never misattributed to
  // migration failure. Symmetric with refresh-only call-site placement.
  _runPostUpgradeGate(projectRoot);
}

/**
 * Render CHANGELOG sections for versions in (fromVersion, toVersion] to stdout.
 * Silently skips if there are no matching entries — this is a decorative surface.
 */
function printChangelog(fromVersion, toVersion) {
  const entries = readChangelogEntries(fromVersion, toVersion);
  if (entries.length === 0) return;

  console.log(chalk.cyan.bold("What's New:"));
  console.log('');
  for (const entry of entries) {
    const header = entry.date
      ? `${entry.version} — ${entry.date}`
      : entry.version;
    console.log(chalk.bold.green(header));
    console.log(entry.body);
    console.log('');
  }
}

/**
 * Confirm action with user
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} True if user confirms
 */
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(chalk.yellow(`${message} [y/N]: `), answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Export for testing
module.exports = {
  assessUpdate,
  printChangelog,
  // Story v63-2-3 R1-H1: helpers exposed under `_internal` so tests can
  // invoke the fail-soft gate directly (bypassing CLI spawn) to exercise the
  // scan-throw → yellow-warning branch. CLI spawn tests can't cover this
  // because refreshInstallation recreates `.claude/skills/` before the gate
  // runs, making scan errors unreachable through integration-level tests.
  // R2-L5: freeze to prevent test-order leaks. Without Object.freeze, a test
  // that overwrites `_internal._runPostUpgradeGate` and forgets to restore
  // would poison later tests via require.cache for the rest of the process.
  _internal: Object.freeze({
    _runPostUpgradeGate,
    _printPostUpgradeGate,
  }),
};

// Run main when executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('');
    console.error(chalk.red.bold('Unexpected error:'));
    console.error(chalk.red(error.message));
    console.error('');
    if (error.stack) {
      console.error(chalk.gray(error.stack));
      console.error('');
    }
    process.exit(1);
  });
}
