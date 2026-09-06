#!/usr/bin/env node
'use strict';

/**
 * assert-shipped-links.js — the FR12 assertion, run against a real packed-and-installed package.
 *
 * Invoked by `scripts/audit/try-fresh-install.sh` against the package that harness has already
 * packed and npm has already extracted into `node_modules/`. It does NOT pack and does NOT
 * extract (AC1): a second `npm pack` would be a second artifact, and a parallel mechanism is the
 * exact criticism this epic levels at grep-based detection. There is one artifact under test and
 * the harness already made it.
 *
 * Run from the REPO, never from the installed copy. `scripts/` ships, so both exist — but an
 * auditor loaded out of the tree it is auditing cannot report that tree as broken.
 *
 * TWO RESOLUTION ROOTS, and conflating them is the defect this file is easiest to write:
 *   <packageRoot>  relative links resolve here. "Did it ship?"
 *   <repoRoot>     self-referential `blob/<ref>/` URLs resolve here (AC5, ADR-002 Amendment 1).
 *                  Such a URL names content on the default branch, which is a different set
 *                  from what `files[]` ships — `docs/` is in the repository and not in the
 *                  package, and every one of the ten shipping today points there.
 *
 * EXIT CODES — matching `assert-installed-tree.js` and the harness's own convention:
 *   0  no findings
 *   1  findings, printed as `FAILED:` lines
 *   2  the assertion could not run
 *
 * 2 is never conflated with 0 or 1. A cannot-run reported as 1 is a false defect report; as 0 it
 * is a gate that passed by crashing, which this harness has shipped five times (see the header
 * of try-fresh-install.sh). `main()` is wrapped so an unexpected throw lands on 2 rather than on
 * node's default 1, which the caller would read as "findings".
 *
 * NOT IN THE VERDICT (NFR10). Story dist-2.3c wires this into try-fresh-install.sh's exit
 * condition, in the same commit that turns it green. It is red today, so merging it into the
 * verdict now would block every PR and every publish until its remedies land. A check that
 * prints FAILED and does not fail the job is uncomfortable on purpose. If you are reading this
 * after 2.3c shipped and this script still appears nowhere in the verdict, that is the bug.
 *
 * READ THIS BEFORE PICKING UP 2.3c. Most of today's findings map to the three ADR-002 classes
 * that 2.3a/2.3b/2.3c remove, but NOT all of them: `lifecycle-process-spec.md` points at
 * `_bmad/bme/_config/name-registry.csv`, which is in the repository and not in `files[]`, and
 * belongs to none of the three classes. Wiring the gate in blocking without settling that one
 * lands a red gate on `main`. The story's Completion Notes carry the measurement and its date.
 */

const fs = require('fs');
const path = require('path');

// REQUIRED INSIDE A GUARD. At module scope, a syntax error or a missing dependency in the
// library exits with node's default **1** — and 1 is the caller's value for "findings were
// printed", so a broken assertion would be reported as a broken package.
let lib;
try {
  lib = require('./lib/shipped-links');
} catch (err) {
  try { fs.writeSync(2, `[harness] the assertion could not load its own library: ${err && err.message}\n`); } catch { /* ignore */ }
  process.exit(2);
}
const { scanPackage } = lib;

const USAGE = 'usage: assert-shipped-links.js <packageRoot> <repoRoot> [--json]';

/** Buffered so nothing is emitted until the run decides its verdict. */
const out = [];

/**
 * Flush synchronously and terminate unconditionally.
 * `writeSync` completes before returning, so a piped stdout cannot truncate the findings the
 * caller is about to be judged on.
 */
function finish(code) {
  if (out.length) {
    try { fs.writeSync(1, out.join('\n') + '\n'); } catch { /* stdout closed; the code still carries */ }
  }
  process.exit(code);
}

/**
 * Cannot-run BEFORE the scan: exit 2. Nothing has been gathered yet, so nothing can be lost.
 *
 * Use {@link cannotRunAfterScan} once `scanPackage` has returned. The distinction is enforced by
 * having two functions rather than by a comment claiming it, because the comment has now been
 * wrong twice. Round 2 rewrote this docstring to correct a false claim and wrote another
 * ("the ones after it are guarded explicitly") that was false in the same way: three preconditions
 * followed the scan and exactly one was guarded. A property asserted in prose is a property
 * nobody checks.
 */
function precondition(msg) {
  try { fs.writeSync(2, `[harness] ${msg}\n`); } catch { /* ignore */ }
  process.exit(2);
}

/**
 * Cannot-run AFTER the scan: emit whatever was gathered, then decide.
 *
 * THE SINGLE PATH FOR EVERY POST-SCAN BAIL-OUT, and the reason it exists is structural rather
 * than stylistic. `res.findings` is fully populated by the time any of these conditions can be
 * tested, so an unqualified `precondition()` here silently throws real defects away — and the
 * harness turns exit 2 into an advisory line, so the run then reports NOTHING. Round 2 found that
 * on one guard and fixed that one guard; Round 3 found it alive in the sibling. Routing all of
 * them through one function makes "a cannot-run never outranks evidence in hand" true by
 * construction, so no future guard can reintroduce it by being written the obvious way.
 *
 * Findings win: they are a real answer about the artifact. The cannot-run reason is still printed,
 * so the operator learns the scan was also incomplete.
 *
 * @param {Array} findings gathered so far
 * @param {string} msg why the assertion cannot complete
 * @param {boolean} json emit machine-readable output
 */
function cannotRunAfterScan(findings, msg, json) {
  if (findings.length) {
    if (json) out.push(JSON.stringify({ incomplete: msg, findingCount: findings.length, findings }, null, 2));
    else {
      for (const f of findings) out.push(`    FAILED: ${f.file}:${f.line} -> ${f.target} (${f.reason})`);
      out.push(`    NOTE: the scan was also incomplete — ${msg}`);
    }
    finish(1);
  }
  if (json) {
    // A consumer piping to `jq` must get a parseable error, not "unexpected end of input".
    out.push(JSON.stringify({ error: msg }, null, 2));
    finish(2);
  }
  precondition(msg);
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function main() {
  // `--json` exists so the review record's evidence numbers are EMITTED, never transcribed.
  // Several false claims in this change's own record were hand-maintained figures that rotted the
  // moment the thing they described moved — a file census, a test count, a mutation verdict. A
  // number a reviewer can regenerate in one command is checkable; a number retyped into prose is
  // a claim. (No such figure is quoted HERE, deliberately: a literal count in shipped code is the
  // same defect one level down, and this file carried two of them until Round 3.)
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const positional = args.filter(a => !a.startsWith('--'));
  // An unrecognised flag must not silently degrade JSON mode to text: a caller piping to `jq`
  // would get a parse error instead of a verdict. Typos belong on the cannot-run side.
  const unknown = args.filter(a => a.startsWith('--') && a !== '--json');
  if (unknown.length) precondition(`unrecognised option(s): ${unknown.join(' ')}\n${USAGE}`);
  const [packageRoot, repoRoot] = positional;
  if (!packageRoot || !repoRoot) precondition(USAGE);
  if (!isDir(packageRoot)) precondition(`package root is not a directory: ${packageRoot}`);
  if (!isDir(repoRoot)) precondition(`repository root is not a directory: ${repoRoot}`);
  if (!fs.existsSync(path.join(packageRoot, 'package.json'))) {
    precondition(`no package.json under ${packageRoot} — this is not an extracted package`);
  }

  let res;
  try {
    res = scanPackage({ packageRoot, repoRoot });
  } catch (err) {
    precondition(`the scan could not complete: ${err && err.message}`); // nothing gathered: res is unset
  }

  // FAIL CLOSED ON A MISSING PREFIX. Without it, AC5 silently evaluates nothing while the run
  // still reports a clean verdict for the relative links — a gate that half-ran and said PASS.
  if (!res.prefix) {
    cannotRunAfterScan(res.findings,
      'package.json declares no parsable repository.url — self-referential URLs (AC5) cannot be resolved', json);
  }
  // A package with no markdown means the walk found nothing, not that everything resolves.
  if (res.mdCount === 0) {
    cannotRunAfterScan(res.findings,
      `no markdown files found under ${packageRoot} — the scan cannot have checked anything`, json);
  }
  // THE SAME GUARD ONE LEVEL IN, and the one that was missing. Markdown was found and NOTHING was
  // extracted from it: every link was skipped, or the extractor broke. Either way the exit-0 that
  // would otherwise follow is "clean" reported by a check that inspected nothing — the fail-open
  // shape this harness's header documents five variants of, and the sixth would have been mine.
  // Falsified by construction: a single unclosed fence at the top of one file produced
  // `scanned 2 markdown file(s), 0 resolvable reference(s)` and exit 0 before this guard existed.
  //
  // `res.findings.length === 0` IS PART OF THE CONDITION, and its absence was a Round 2 HIGH.
  // Findings are gathered BEFORE this point, so an unqualified guard discarded them: a package
  // whose only markdown opens a fence and never closes it produces exactly one finding — the
  // unterminated-fence tripwire Round 1 added for this very case — zero resolvable links, and
  // then exited 2 printing only "ZERO resolvable references", swallowing the finding it had
  // already made. The harness turns exit 2 into an advisory line, so the run ended reporting
  // nothing at all. A cannot-run must never outrank evidence already in hand.
  if (res.linkCount === 0) {
    cannotRunAfterScan(res.findings,
      `${res.mdCount} markdown file(s) scanned but ZERO resolvable references extracted — ` +
      'the extractor is broken or every link was skipped; refusing to report a clean scan', json);
  }

  const byFile = new Map();
  for (const f of res.findings) byFile.set(f.file, (byFile.get(f.file) || 0) + 1);

  if (json) {
    out.push(JSON.stringify({
      packageRoot,
      mdCount: res.mdCount,
      linkCount: res.linkCount,
      // The relative/self-referential split and the unique self-referential path count are part
      // of the record's evidence, so they are EMITTED. Round 3 found them still hand-transcribed
      // beneath a paragraph promising every figure came from this command.
      relativeCount: res.relativeCount,
      selfRefCount: res.selfRefCount,
      uniqueSelfRefPaths: res.uniqueSelfRefPaths,
      skippedCount: res.skippedCount,
      prefix: res.prefix,
      findingCount: res.findings.length,
      fileCount: byFile.size,
      byFile: Object.fromEntries([...byFile.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
      findings: res.findings,
    }, null, 2));
    finish(res.findings.length ? 1 : 0);
  }

  for (const f of res.findings) {
    out.push(`    FAILED: ${f.file}:${f.line} -> ${f.target} (${f.reason})`);
  }
  out.push(
    `    scanned ${res.mdCount} markdown file(s), ${res.linkCount} resolvable reference(s); ` +
    `self-referential prefix ${res.prefix}`,
  );
  if (res.findings.length) {
    out.push(`    ${res.findings.length} finding(s) across ${byFile.size} file(s):`);
    for (const [file, n] of [...byFile.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
      out.push(`      ${String(n).padStart(3)}  ${file}`);
    }
  }
  finish(res.findings.length ? 1 : 0);
}

try {
  main();
} catch (err) {
  precondition(`unexpected failure: ${err && err.stack ? err.stack.split('\n')[0] : err}`);
}
