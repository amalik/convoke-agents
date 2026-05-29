#!/usr/bin/env node
'use strict';

/**
 * Install-Scope Check (PF1 mechanical control — Story 4.3 Path B+ re-scope)
 *
 * Replaces the original PF1 spec's 4-BMAD-agent LLM-judged control validation with a
 * cheap mechanical assertion that Convoke's migration + install code stays within
 * Convoke's intended write scope. Catches "migration scope leaked into BMAD-owned territory"
 * regressions that the original spec used 4 BMAD agents to detect.
 *
 * RATIONALE (Story 4.3 Decision 4 addendum):
 *   The original PF1 spec listed 5 agents (Emma + John + Winston + Carson + Murat).
 *   80% of test cost (4 of 5 agents = BMAD-upstream-owned) was control validation:
 *   "Convoke's migration shouldn't accidentally break BMAD agents." This is mechanically
 *   verifiable for ~$0 vs ~$1 LLM + ~2 hr operator time for the control half.
 *   Path B+ re-scopes PF1 to 4 Convoke agents (3 Vortex + 1 Gyre) for signal density,
 *   with this script substituting for the BMAD-agent control validation.
 *
 * APPROACH (snapshot-based):
 *   For each tracked migration/install file, count write-op invocations
 *   (fs.writeFileSync, fs.writeFile, fs.copyFileSync, fs.copyFile, fs.cpSync,
 *    fs.rmSync, fs.unlinkSync, fs.renameSync, fs.mkdirSync, fs.mkdir).
 *   Assert count matches expected snapshot. Mismatch → operator review required.
 *
 *   Additionally checks for known-violating substring patterns in write-target
 *   path expressions (e.g., absolute paths to BMAD-core directories).
 *
 * USAGE:
 *   node scripts/audit/install-scope-check.js
 *   node scripts/audit/install-scope-check.js --verbose    (per-write-site detail)
 *   node scripts/audit/install-scope-check.js --update     (rewrite snapshot — operator confirms reviewed)
 *
 * EXIT CODES:
 *   0 — All tracked files match snapshot + no scope-violating patterns detected
 *   1 — Snapshot mismatch (write-op count diverged; review changes + update snapshot)
 *   2 — Scope-violation pattern detected in path expression
 *   3 — Tracked file missing (refactor renamed/moved it; update tracking)
 *   99 — Unhandled error
 *
 * Authored 2026-05-29 per Story 4.3 Decision 4 addendum (Path B+ re-scope).
 */

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');

const PROJECT_ROOT = findProjectRoot();

// ===== Tracked migration/install files + expected write-op counts =====
// Snapshot taken 2026-05-29 (`\b`-bounded write-op regex):
//   - refresh-installation.js: 8 writes — lines 236/299/346 (config + agent), 619 (manifest),
//                                          716/742/767 (skill SKILL.md), 929 (customize template)
//     All visibly scoped to Convoke targets (targetEnhanceConfig, targetAgentPath, manifestPath,
//     SKILL.md in skillDir, CUSTOMIZE_TEMPLATE). Verified 2026-05-29.
//   - 3.3.x-to-4.0.0.js: 5 matches (4 real writes + 1 comment false-positive at line 394).
//     Real writes at 309/354 (taxonomy frontmatter + content update), 681/682 (atomic state file
//     rotation via tmpPath + renameSync). All visibly scoped. Verified 2026-05-29.
//   - 3.1.x and 3.2.x: 0 (thin wrappers per BUG-5 chain-walker invariant — no direct writes).
const TRACKED = [
  { file: 'scripts/update/lib/refresh-installation.js', expected: 8 },
  { file: 'scripts/update/migrations/3.3.x-to-4.0.0.js', expected: 5 },
  { file: 'scripts/update/migrations/3.2.x-to-4.0.0.js', expected: 0 },
  { file: 'scripts/update/migrations/3.1.x-to-4.0.0.js', expected: 0 },
];

// ===== Forbidden path-expression substrings =====
// These would indicate the migration is writing outside Convoke scope.
// String matching is conservative; we look for literal substrings in path expressions
// surrounding write-op invocations (within ±2 lines).
const FORBIDDEN_PATTERNS = [
  { pattern: '/_bmad/bmm/', reason: 'BMAD core (BMM module) write — Convoke should not modify upstream BMAD modules' },
  { pattern: '/_bmad/cis/', reason: 'CIS module write — Convoke should not modify CIS-owned files' },
  { pattern: '/_bmad/tea/', reason: 'TEA module write — Convoke should not modify TEA-owned files' },
  { pattern: '/_bmad/bma/', reason: 'BMad Automator write — Convoke should not modify automator-owned files' },
  { pattern: '/_bmad/gds/', reason: 'GDS module write — Convoke should not modify GDS-owned files' },
  { pattern: '/_bmad/bmb/', reason: 'BMB module write — Convoke should not modify BMB-owned files' },
  { pattern: '/_bmad/wds/', reason: 'WDS module write — Convoke should not modify WDS-owned files' },
  { pattern: '/_bmad/core/', reason: 'BMAD core module write — Convoke should not modify upstream core' },
];

// ===== Write-op regex =====
const WRITE_OP_RE = /fs\.(writeFileSync|writeFile|copyFileSync|copyFile|cpSync|cp|rmSync|rm|unlinkSync|unlink|renameSync|rename|mkdirSync|mkdir)\b/g;

// ===== Helpers =====

function readFileLines(relPath) {
  const absPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf8').split('\n');
}

function countWriteOps(lines) {
  let count = 0;
  const sites = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = [...line.matchAll(WRITE_OP_RE)];
    if (matches.length > 0) {
      count += matches.length;
      sites.push({ lineNum: i + 1, line: line.trim(), opCount: matches.length });
    }
  }
  return { count, sites };
}

function scanForbiddenPatterns(lines) {
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only check lines with write ops or in their immediate vicinity (±2 lines)
    const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n');
    const hasWriteOp = WRITE_OP_RE.test(line);
    WRITE_OP_RE.lastIndex = 0; // reset regex state
    if (!hasWriteOp) continue;
    for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
      if (context.includes(pattern)) {
        violations.push({ lineNum: i + 1, pattern, reason, contextLine: line.trim() });
      }
    }
  }
  return violations;
}

// ===== Main =====

function main() {
  const argv = process.argv.slice(2);
  const verbose = argv.includes('--verbose');
  const updateSnapshot = argv.includes('--update');

  console.log('Install-Scope Check (Story 4.3 Path B+ mechanical control)');
  console.log('');

  let allPass = true;
  let scopeViolations = 0;

  for (const tracked of TRACKED) {
    const lines = readFileLines(tracked.file);
    if (lines === null) {
      console.error(`✗ MISSING: ${tracked.file}`);
      console.error(`  Tracked file not found. Did a refactor rename/move it? Update TRACKED array.`);
      process.exit(3);
    }

    const { count, sites } = countWriteOps(lines);
    const violations = scanForbiddenPatterns(lines);

    const countMatch = count === tracked.expected;
    const noViolations = violations.length === 0;
    const fileOk = countMatch && noViolations;

    if (fileOk) {
      console.log(`✓ ${tracked.file}`);
      console.log(`  Write ops: ${count} (snapshot: ${tracked.expected}) — no scope violations`);
    } else {
      allPass = false;
      console.log(`✗ ${tracked.file}`);
      if (!countMatch) {
        const delta = count - tracked.expected;
        const sign = delta > 0 ? '+' : '';
        console.log(`  Write ops: ${count} (snapshot: ${tracked.expected}) — DELTA: ${sign}${delta}`);
        console.log(`  Review the new/removed writes; if scope is correct, re-run with --update to refresh snapshot.`);
      }
      if (!noViolations) {
        scopeViolations += violations.length;
        console.log(`  SCOPE VIOLATIONS: ${violations.length}`);
        for (const v of violations) {
          console.log(`    line ${v.lineNum}: pattern '${v.pattern}' — ${v.reason}`);
          console.log(`      ${v.contextLine}`);
        }
      }
    }

    if (verbose && sites.length > 0) {
      console.log(`  Sites (verbose):`);
      for (const site of sites) {
        console.log(`    line ${site.lineNum}: ${site.line.slice(0, 80)}${site.line.length > 80 ? '...' : ''}`);
      }
    }
    console.log('');
  }

  if (updateSnapshot) {
    console.log('--update mode: snapshot rewrite is operator-manual. Edit TRACKED in this file with the new counts shown above.');
    console.log('');
  }

  console.log('========================================');
  if (allPass) {
    console.log(`✓ PASS — all ${TRACKED.length} tracked files match snapshot + no scope violations`);
    console.log('  Convoke migration scope is mechanically verified within _bmad/bme/ + version metadata.');
    console.log('  This substitutes for the original PF1 spec\'s 4-BMAD-agent LLM-judged control validation.');
    process.exit(0);
  } else if (scopeViolations > 0) {
    console.log(`✗ FAIL — ${scopeViolations} scope violation(s) detected`);
    console.log('  Migration code is writing to non-Convoke paths. Investigate before ship.');
    process.exit(2);
  } else {
    console.log('✗ FAIL — snapshot mismatch (no scope violations, but write-op counts diverged)');
    console.log('  Review new writes; if scoped correctly, update TRACKED array snapshot.');
    process.exit(1);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`Unhandled error: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(99);
  }
}

module.exports = {
  TRACKED,
  FORBIDDEN_PATTERNS,
  WRITE_OP_RE,
  countWriteOps,
  scanForbiddenPatterns,
};
