#!/usr/bin/env node
/**
 * convoke-export.js — Story sp-2-3
 *
 * CLI entry point for the Tier 1 skill exporter. Wraps `exportSkill()` from
 * sp-2-2's export-engine.js, writes per-skill `instructions.md` + `README.md`
 * to disk, and reports success/failure with stable grep-friendly lines.
 *
 * Usage:
 *   convoke-export <skill-name>           # single skill, default output
 *   convoke-export <skill-name> --output <dir>
 *   convoke-export --tier 1               # batch all standalone skills
 *   convoke-export --all                  # alias for --tier 1 (sp-2-3)
 *   convoke-export --tier 1 --dry-run     # preview without writing
 *   convoke-export --help
 *
 * The CLI is read-only on the source tree — only the --output directory
 * (or the default ./exported-skills/) is written.
 *
 * See _bmad-output/implementation-artifacts/sp-2-3-cli-entry-point.md for the
 * full spec.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');
const { exportSkill, humanizeSkillName } = require('./export-engine');
const { readManifest } = require('./manifest-csv');
const { generateAdapters } = require('./generate-adapters');

// =============================================================================
// EXIT CODES
// =============================================================================

const EXIT_SUCCESS = 0;
const EXIT_USAGE = 1;
const EXIT_NOT_FOUND = 2;
const EXIT_TIER_NOT_SUPPORTED = 3;
const EXIT_PARTIAL_FAILURE = 4;

// =============================================================================
// ARG PARSER (hand-rolled, no deps — matches classify-skills.js style)
// =============================================================================

/**
 * Parse argv into a simple options object.
 * Returns { positional: string[], output: string|null, tier: string|null,
 *           all: boolean, dryRun: boolean, help: boolean, unknown: string|null }
 */
function parseArgs(argv) {
  const opts = {
    positional: [],
    output: null,
    tier: null,
    all: false,
    dryRun: false,
    help: false,
    unknown: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      opts.help = true;
    } else if (a === '--dry-run') {
      opts.dryRun = true;
    } else if (a === '--all') {
      opts.all = true;
    } else if (a === '--quiet' || a === '-q') {
      opts.quiet = true;
    } else if (a === '--output') {
      const next = argv[i + 1];
      // Reject any `-`-prefixed token as a value — covers both long (`--flag`)
      // and short (`-q`, `-h`) neighbors. Previously accepted `-q` as a literal
      // output path; I50's short-alias introduction made that exploitable.
      if (!next || next.startsWith('-')) {
        opts.unknown = '--output (missing value)';
        return opts;
      }
      opts.output = argv[++i];
    } else if (a.startsWith('--output=')) {
      const val = a.slice('--output='.length);
      if (!val) { opts.unknown = '--output= (empty value)'; return opts; }
      opts.output = val;
    } else if (a === '--tier') {
      const next = argv[i + 1];
      // See note on `--output` above: reject any `-`-prefixed token as a value.
      if (!next || next.startsWith('-')) {
        opts.unknown = '--tier (missing value)';
        return opts;
      }
      opts.tier = argv[++i];
    } else if (a.startsWith('--tier=')) {
      const val = a.slice('--tier='.length);
      if (!val) { opts.unknown = '--tier= (empty value)'; return opts; }
      opts.tier = val;
    } else if (a.startsWith('--')) {
      opts.unknown = a;
      return opts;
    } else {
      opts.positional.push(a);
    }
  }
  return opts;
}

// =============================================================================
// HELP TEXT (ASCII only — no emoji)
// =============================================================================

function printHelp() {
  const lines = [
    'Usage: convoke-export <skill-name> [options]',
    '       convoke-export --tier <N> [options]',
    '       convoke-export --all [options]',
    '       convoke-export --help',
    '',
    'Description:',
    '  Export a BMAD skill (Tier 1 standalone or Tier 2 light-deps) to a portable',
    '  per-skill directory containing instructions.md and a README.md. Wraps the',
    '  export engine. Read-only on the source tree.',
    '',
    'Flags:',
    '  <skill-name>          Positional. Manifest skill name (e.g. bmad-brainstorming).',
    '  --output <path>       Output directory root. Defaults to ./exported-skills/',
    '                        relative to the project root. User-supplied paths are',
    '                        resolved against the current working directory.',
    '  --tier <value>        Batch-export by tier. Accepts: 1/standalone, 2/light-deps',
    '                        (both proceed); 3/pipeline (rejected).',
    '                        Any other value exits 1 (usage error).',
    '  --all                 Export all exportable tiers (standalone + light-deps).',
    '  --dry-run             Run the engine in-memory; print would-be paths; write',
    '                        nothing. Combinable with all other flags.',
    '  --quiet, -q           Suppress per-skill success and skip lines. Failures',
    '                        (stderr) and the final summary line are still emitted.',
    '                        Useful in CI / scripted pipelines.',
    '  --help, -h            Print this message and exit 0.',
    '',
    '  Conflicts:',
    '    - <skill-name> with --tier or --all  -> exit 1',
    '    - --tier with --all                  -> exit 1',
    '    - unknown flag                       -> exit 1',
    '',
    'Exit codes:',
    '  0  Success (or empty batch, --help, --dry-run with no failures)',
    '  1  Usage error (unknown flag, conflicting flags, invalid --tier value)',
    '  2  Skill not found in manifest (single-skill mode)',
    '  3  Tier not supported (Tier 3 / pipeline requested)',
    '  4  Partial failure (batch mode with at least one failed skill)',
    '',
    'Examples:',
    '  Example: single skill, default output',
    '    convoke-export bmad-brainstorming',
    '',
    '  Example: single skill, custom output',
    '    convoke-export bmad-brainstorming --output ./out',
    '',
    '  Example: batch tier 1, dry-run preview',
    '    convoke-export --tier 1 --dry-run',
    '',
    '  Example: batch all (standalone + light-deps)',
    '    convoke-export --all',
    '',
  ];
  process.stdout.write(lines.join('\n'));
}

// =============================================================================
// REPORTER
// =============================================================================

function makeReporter(opts = {}) {
  const { quiet = false } = opts;
  const results = { success: 0, failed: 0, skipped: 0, warnings: 0 };
  return {
    success(skill, relPath, warnings) {
      results.success++;
      results.warnings += warnings;
      if (quiet) return;
      const suffix = warnings > 0 ? ` (${warnings} warnings)` : '';
      process.stdout.write(`✅ ${skill} → ${relPath}${suffix}\n`);
    },
    failure(skill, error) {
      // Failures always emit — `--quiet` suppresses success noise, not errors.
      results.failed++;
      const msg = (error && error.message ? error.message : String(error)).split('\n')[0];
      process.stderr.write(`❌ ${skill} — ${msg}\n`);
    },
    skip(skill, reason) {
      results.skipped++;
      if (quiet) return;
      process.stdout.write(`⏭️  ${skill} — ${reason}\n`);
    },
    summary(dryRun) {
      // Summary always emits — it's a single line that tells CI the batch outcome.
      const prefix = dryRun ? '[DRY RUN] ' : '';
      const total = results.success + results.failed + results.skipped;
      process.stdout.write(
        `${prefix}Exported ${total} skills (${results.success} success, ${results.failed} failed, ${results.skipped} skipped) — ${results.warnings} warnings total\n`
      );
    },
    counts() {
      return results;
    },
    isQuiet() {
      return quiet;
    },
  };
}

// =============================================================================
// README STUB GENERATION (Task 4)
// =============================================================================

/**
 * Read the readme template once. Cached after first call.
 */
let _templateCache = null;
function loadReadmeTemplate(projectRoot) {
  if (_templateCache !== null) return _templateCache;
  const tplPath = path.join(
    projectRoot,
    'scripts',
    'portability',
    'templates',
    'readme-template.md'
  );
  _templateCache = fs.readFileSync(tplPath, 'utf8');
  return _templateCache;
}

/**
 * Build a per-skill README from manifest row + engine result.
 * Reads the template, substitutes placeholders, strips HTML comments,
 * cleans up leaked engine placeholders, and collapses whitespace.
 * Throws if any multi-word placeholder remains after substitution.
 */
function buildReadme(skillRow, result, projectRoot) {
  const template = loadReadmeTemplate(projectRoot);
  const persona = result.persona || {};

  const displayName = humanizeSkillName(skillRow.name);
  const nameWithIcon = persona.icon ? `${persona.name} ${persona.icon}` : persona.name || '';
  const commStyle =
    (persona.communicationStyle && persona.communicationStyle.trim()) ||
    (persona.identity && persona.identity.trim()) ||
    'See instructions.md for details.';

  // Strip the heading from "What you produce" — keep the body only.
  const whatYouProduceBody = (result.sections.whatYouProduce || '')
    .replace(/^##\s+What you produce\s*\n+/, '')
    .trim();

  // Parse the "Use when:" bullet block from whenToUse.
  const whenSection = result.sections.whenToUse || '';
  const bulletLines = whenSection
    .split('\n')
    .filter((l) => /^\s*-\s+/.test(l))
    .map((l) => l.replace(/^\s+/, ''));
  const triggerList =
    bulletLines.length > 0
      ? bulletLines.join('\n')
      : '- See instructions.md for trigger conditions';

  // Substitute placeholders. Order matters where one token is a prefix of another.
  let out = template;
  out = out.replaceAll('<Skill display name>', displayName);
  out = out.replaceAll('<persona name + icon>', nameWithIcon);
  out = out.replaceAll('<persona name>', persona.name || '');
  out = out.replaceAll(
    '<one-paragraph description of what the skill does and what value it delivers>',
    skillRow.description || ''
  );
  out = out.replaceAll('<persona communication style summary>', commStyle);
  out = out.replaceAll('<output artifact description>', whatYouProduceBody);
  out = out.replaceAll('<trigger-list>', triggerList);
  out = out.replaceAll('<skill-name>', skillRow.name);
  out = out.replaceAll('<tier>', skillRow.tier);
  out = out.replaceAll('<standalone | light-deps | pipeline>', skillRow.tier);

  // Sanity check: verify no multi-word <placeholder> tokens remain BEFORE
  // stripping HTML comments (comments contain < chars that are fine).
  const checkContent = out.replace(/<!--[\s\S]*?-->/g, '');
  const leftover = checkContent.match(/<[a-z][a-z\s-]{2,}[a-z]>/gi);
  if (leftover && leftover.length > 0) {
    throw new Error(
      `README generation left unsubstituted placeholders: ${leftover.join(', ')}`
    );
  }

  // Strip HTML comments (developer docs in template, not user-facing)
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  // Clean up leaked engine placeholders from Phase 6 catch-all (all 6 mapped vars + catch-all)
  out = out.replaceAll('[your output folder]', 'your-output-folder');
  out = out.replaceAll('[your name]', 'your-name');
  out = out.replaceAll('[your preferred language]', 'your-preferred-language');
  out = out.replaceAll('[your document language]', 'your-document-language');
  out = out.replaceAll('[your planning artifacts directory]', 'your-planning-artifacts');
  out = out.replaceAll('[your implementation artifacts directory]', 'your-implementation-artifacts');
  out = out.replaceAll('[your context]', 'your-project-context');

  // Collapse multiple blank lines and trim
  out = out.replace(/\n{3,}/g, '\n\n').trim() + '\n';

  return out;
}

// =============================================================================
// SINGLE-SKILL EXPORT
// =============================================================================

/**
 * Export one skill. Returns { ok: bool, exitCode: number, error?: Error }.
 * Reporter is updated as a side effect.
 */
function runSingle(skillName, outputBase, dryRun, projectRoot, reporter) {
  let result;
  try {
    result = exportSkill(skillName, projectRoot);
  } catch (err) {
    reporter.failure(skillName, err);
    const msg = err.message || '';
    if (msg.includes('not in the manifest')) {
      return { ok: false, exitCode: EXIT_NOT_FOUND, error: err };
    }
    if (msg.includes('not standalone') || msg.includes('tier "')) {
      return { ok: false, exitCode: EXIT_TIER_NOT_SUPPORTED, error: err };
    }
    return { ok: false, exitCode: EXIT_PARTIAL_FAILURE, error: err };
  }

  // Re-read the skill row for README stub generation
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const { header, rows } = readManifest(manifestPath);
  const nameIdx = header.indexOf('name');
  const row = rows.find((r) => r[nameIdx] === skillName);
  if (!row) {
    const err = new Error(`Manifest row for "${skillName}" disappeared between engine call and README generation`);
    reporter.failure(skillName, err);
    return { ok: false, exitCode: EXIT_PARTIAL_FAILURE, error: err };
  }
  const skillRow = {};
  for (let i = 0; i < header.length; i++) skillRow[header[i]] = row[i];

  let readme;
  try {
    readme = buildReadme(skillRow, result, projectRoot);
  } catch (err) {
    reporter.failure(skillName, err);
    return { ok: false, exitCode: EXIT_PARTIAL_FAILURE, error: err };
  }

  const skillDir = path.join(outputBase, skillName);
  const instructionsPath = path.join(skillDir, 'instructions.md');
  const readmePath = path.join(skillDir, 'README.md');
  const relInstructions = path.relative(projectRoot, instructionsPath);

  if (!dryRun) {
    try {
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(instructionsPath, result.instructions);
      fs.writeFileSync(readmePath, readme);
      generateAdapters(skillName, skillRow, result.instructions, skillDir);
    } catch (writeErr) {
      reporter.failure(skillName, writeErr);
      return { ok: false, exitCode: EXIT_PARTIAL_FAILURE, error: writeErr };
    }
  }

  reporter.success(skillName, relInstructions, result.warnings.length);
  return { ok: true, exitCode: EXIT_SUCCESS };
}

// =============================================================================
// BATCH EXPORT
// =============================================================================

/**
 * Validate the --tier value. Returns { ok, normalizedTier, exitCode, message }.
 */
function validateTier(tierValue) {
  if (tierValue === 'all') {
    return { ok: true, normalizedTier: 'all' };
  }
  if (tierValue === '1' || tierValue === 'standalone') {
    return { ok: true, normalizedTier: 'standalone' };
  }
  if (tierValue === '2' || tierValue === 'light-deps') {
    return { ok: true, normalizedTier: 'light-deps' };
  }
  if (tierValue === '3' || tierValue === 'pipeline') {
    return {
      ok: false,
      exitCode: EXIT_TIER_NOT_SUPPORTED,
      message: 'Tier 3 skills are not exported per the portability schema.',
    };
  }
  return {
    ok: false,
    exitCode: EXIT_USAGE,
    message: `Invalid --tier value: '${tierValue}'. Valid values: 1, 2, 3, standalone, light-deps, pipeline.`,
  };
}

function runBatch(tierValue, outputBase, dryRun, projectRoot, reporter) {
  const tier = validateTier(tierValue);
  if (!tier.ok) {
    process.stderr.write(`${tier.message}\n`);
    return tier.exitCode;
  }

  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const { header, rows } = readManifest(manifestPath);
  const nameIdx = header.indexOf('name');
  const tierIdx = header.indexOf('tier');

  // Manifest may contain the same skill name across multiple modules.
  // Dedupe — each skill name is exported once.
  // 'all' exports standalone + light-deps; specific tier exports that tier only
  const tierFilter = tier.normalizedTier === 'all'
    ? (t) => t === 'standalone' || t === 'light-deps'
    : (t) => t === tier.normalizedTier;
  const matchingSkills = [
    ...new Set(rows.filter((r) => tierFilter(r[tierIdx])).map((r) => r[nameIdx])),
  ].sort();

  if (matchingSkills.length === 0) {
    // Suppress the friendly message in --quiet mode so the caller only sees
    // the single-line summary ("Exported 0 skills (0/0/0) — 0 warnings total").
    if (!reporter.isQuiet()) {
      process.stdout.write('Nothing to export — manifest matches found 0 skills\n');
    }
    return EXIT_SUCCESS;
  }

  for (const skillName of matchingSkills) {
    runSingle(skillName, outputBase, dryRun, projectRoot, reporter);
  }

  const counts = reporter.counts();
  return counts.failed > 0 ? EXIT_PARTIAL_FAILURE : EXIT_SUCCESS;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const argv = process.argv.slice(2);

  // No args = print help and exit 0
  if (argv.length === 0) {
    printHelp();
    return EXIT_SUCCESS;
  }

  const opts = parseArgs(argv);

  if (opts.help) {
    printHelp();
    return EXIT_SUCCESS;
  }

  if (opts.unknown) {
    process.stderr.write(`Unknown flag: ${opts.unknown}. Run --help for usage.\n`);
    return EXIT_USAGE;
  }

  // Conflict matrix
  const hasPositional = opts.positional.length > 0;
  const hasTier = opts.tier !== null;
  const hasAll = opts.all;
  if (hasPositional && (hasTier || hasAll)) {
    process.stderr.write(
      'Conflict: positional skill name cannot be combined with --tier or --all. Run --help for usage.\n'
    );
    return EXIT_USAGE;
  }
  if (hasTier && hasAll) {
    process.stderr.write('Conflict: --tier and --all cannot be combined. Run --help for usage.\n');
    return EXIT_USAGE;
  }
  if (!hasPositional && !hasTier && !hasAll) {
    process.stderr.write('No skill or batch flag provided. Run --help for usage.\n');
    return EXIT_USAGE;
  }
  if (opts.positional.length > 1) {
    process.stderr.write(
      `Conflict: only one positional skill name allowed (got ${opts.positional.length}). Run --help for usage.\n`
    );
    return EXIT_USAGE;
  }

  const projectRoot = findProjectRoot();

  // Resolve output base
  let outputBase;
  if (opts.output) {
    outputBase = path.isAbsolute(opts.output)
      ? opts.output
      : path.resolve(process.cwd(), opts.output);
  } else {
    outputBase = path.join(projectRoot, 'exported-skills');
  }

  const reporter = makeReporter({ quiet: !!opts.quiet });

  let exitCode;
  if (hasPositional) {
    const result = runSingle(opts.positional[0], outputBase, opts.dryRun, projectRoot, reporter);
    reporter.summary(opts.dryRun);
    exitCode = result.exitCode;
  } else {
    // Batch: --tier or --all
    const tierValue = hasAll ? 'all' : opts.tier;
    exitCode = runBatch(tierValue, outputBase, opts.dryRun, projectRoot, reporter);
    if (exitCode !== EXIT_TIER_NOT_SUPPORTED && exitCode !== EXIT_USAGE) {
      reporter.summary(opts.dryRun);
    }
  }

  return exitCode;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  parseArgs,
  validateTier,
  buildReadme,
  runSingle,
  runBatch,
  main,
  EXIT_SUCCESS,
  EXIT_USAGE,
  EXIT_NOT_FOUND,
  EXIT_TIER_NOT_SUPPORTED,
  EXIT_PARTIAL_FAILURE,
};
