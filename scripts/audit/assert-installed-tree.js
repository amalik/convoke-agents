#!/usr/bin/env node
'use strict';

/**
 * assert-installed-tree.js — the FR13 assertion, run against a real installed project.
 *
 * Invoked by `scripts/audit/try-fresh-install.sh` against the project that harness has
 * already packed and installed. It does NOT pack or install anything itself (AC1): a
 * second install would be a second experiment, and the point is to interrogate the one
 * the harness just performed.
 *
 * Run from the REPO, never from the installed copy. `scripts/` ships, so both exist — but
 * an auditor loaded out of the tree it is auditing hides exactly the defect class it was
 * built to catch.
 *
 * ONE DELIBERATE EXCEPTION, stated because an earlier version of this header claimed there
 * were none: `agent-registry.js` IS `require`d out of the installed package (see `tree()`).
 * AC3 requires the declared set to come from "the installed tree's module configs AND THE
 * AGENT REGISTRY at runtime", and the registry is code, so there is no reading it as data.
 * The consequence is real and worth naming rather than glossing: a damaged registry, a
 * damaged module config, or a damaged `excluded_agents` list all SHRINK what gets checked.
 * The zero-length guards below exist for exactly that, and they are the only thing standing
 * between this and a check that validates a broken package against a broken expectation.
 *
 * FOUR PHASES, and the separation is the point (restructured after Round 2).
 *
 * The first draft was one linear pass in which preconditions, per-module diagnosis and
 * finding-accumulation were interleaved, each guard `return`ing on failure. Round 2 found
 * four HIGHs that were all the same defect wearing different clothes: an early `return`
 * discarded `FAILED:` lines already printed, and two checks shadowed each other so the
 * ADR-004 C1 extension could never run in the one case it was added for. Patching those
 * individually is what `code-review-convergence` predicts will fail a third time, so the
 * control flow changed instead:
 *
 *   PHASE 1  preconditions — can this run at all? Nothing about the artifact under test.
 *            Failure here means NO findings were gathered, so exit 2 is unambiguous.
 *   PHASE 2  enumerate. A damaged enumeration is a FINDING, not a precondition — `files[]`
 *            losing its `_bmad/bme/*` entries is the packaging regression this exists for,
 *            and `scripts/` ships, so an unloadable registry is a product defect too.
 *   PHASE 3  per-module diagnosis, exactly ONE mutually exclusive verdict per module.
 *   PHASE 4  units, wrappers, runtime data files.
 *
 * Phases 2-4 NEVER return early. Everything accumulates, then PHASE 5 emits once.
 *
 * EXIT CODES — matching the harness's own convention:
 *   0  no findings
 *   1  findings, printed as `FAILED:` lines
 *   2  the assertion could not run — PHASE 1 only, so it can never discard a finding
 *
 * 2 is never conflated with 0. Four separate defects in this harness's history reported
 * success because a check could not run; `main()` is wrapped so an unexpected throw
 * lands on 2 rather than on node's default 1, which the caller would read as "findings".
 *
 * OUTPUT IS FLUSHED SYNCHRONOUSLY, THEN THE PROCESS IS FORCED TO EXIT. Round 1 replaced
 * `process.exit()` with `process.exitCode` to stop a piped stdout truncating; Round 2
 * reproduced the cost — a `require`d registry holding a live handle left the process running
 * forever, and `fresh-install` gates `publish` with no timeout, so that is a hung CI job
 * rather than a rare short read. `fs.writeSync` on fd 1 followed by `process.exit()` closes
 * both: the write completes before the call returns, and the exit is unconditional.
 *
 * NOT IN THE VERDICT. Story dist-2.6 wires the caller's `TREE` variable into
 * try-fresh-install.sh's exit condition. Until then this prints and the harness still
 * exits on its pre-existing checks alone (NFR10).
 */

const fs = require('fs');
const path = require('path');

// REQUIRED INSIDE A GUARD. This block used to sit at module scope, outside `try { main() }`,
// so a syntax error or a missing dependency in the library exited with node's default **1** —
// and 1 is the caller's value for "findings were printed". Demonstrated: break
// `lib/installed-tree.js` and the harness prints `[installed-tree status 1]` above zero
// FAILED lines and falls through to its PASS banner. The header below claims `main()` is
// wrapped precisely so this cannot happen; it was not, until Round 3.
let lib;
try {
  lib = require('./lib/installed-tree');
} catch (err) {
  // `precondition` is not defined yet, so inline the same contract: fd 2, exit 2.
  try { fs.writeSync(2, `[harness] the assertion could not load its own library: ${err && err.message}\n`); } catch { /* ignore */ }
  process.exit(2);
}
const {
  setYamlResolutionRoot,
  RUNTIME_DATA_FILES,
  DEFAULT_MAX_FILES,
  shippedBmeModules,
  missingModules,
  missingRuntimeFiles,
  declaredUnits,
  missingWrappers,
  modulesWithoutConfig,
  modulesDeclaringNothing,
  unparsableConfigs,
  walkRequires,
} = lib;

const USAGE = `usage:
  assert-installed-tree.js tree     <projectRoot> <installedPackageRoot>
  assert-installed-tree.js requires <entryFile> [maxFiles]`;

/** Buffered so nothing is emitted until the run decides its verdict. */
const out = [];
const fail = msg => out.push(`    FAILED: ${msg}`);

/**
 * Flush synchronously and terminate unconditionally.
 * `writeSync` completes before returning (no async pipe truncation); `process.exit` ignores
 * live handles left by anything `require`d out of the tree under test. Round 2 reproduced
 * both failure modes when only one of the two was addressed.
 */
function finish(code) {
  if (out.length) {
    try { fs.writeSync(1, out.join('\n') + '\n'); } catch { /* stdout closed; the code still carries */ }
  }
  process.exit(code);
}

/** PHASE 1 only. Exit 2 with no findings gathered, so it can never discard evidence. */
function precondition(msg) {
  try { fs.writeSync(2, `[harness] ${msg}\n`); } catch { /* ignore */ }
  process.exit(2);
}

function tree(projectRoot, packageRoot) {
  // ── PHASE 1 — preconditions. Nothing here is a statement about the package.
  if (!projectRoot || !packageRoot) precondition(USAGE);
  for (const [label, dir] of [['project', projectRoot], ['installed package', packageRoot]]) {
    if (!fs.existsSync(dir)) precondition(`${label} root does not exist: ${dir}`);
  }
  // Before ANY config is parsed: resolve js-yaml out of the installed package, which carries
  // it as a runtime dependency. The `fresh-install` job runs no `npm ci`, so `$REPO/node_modules`
  // does not exist on the runner — this is what took main red in CI run 33323351907.
  setYamlResolutionRoot(packageRoot);

  const pkgPath = path.join(packageRoot, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    precondition(`cannot read installed package.json at ${pkgPath}: ${err.message}`);
  }
  // A manifest that emptied out is a check that cannot fail — and it is OUR data, not the
  // package's, so it belongs here rather than among the findings.
  if (RUNTIME_DATA_FILES.length === 0) {
    precondition('the runtime-data manifest is empty — a check that cannot fail is not a check');
  }

  // ── PHASE 2 — enumerate. Damage here is a FINDING; the artifact is what is damaged.
  const declared = shippedBmeModules(pkg.files);
  for (const entry of declared.unresolvable || []) {
    fail(`files[] entry "${entry}" cannot be resolved to a module name, so nothing in it was checked`);
  }
  if (declared.length === 0) {
    fail('installed package.json declares no _bmad/bme/* entries in files[] — the packaging regression this check exists for');
  }

  let registry = null;
  const registryPath = path.join(packageRoot, 'scripts', 'update', 'lib', 'agent-registry.js');
  try {
    registry = require(registryPath);
  } catch (err) {
    // `scripts/` is in files[], so a registry that did not ship or does not load is a PRODUCT
    // defect — I139's exact class. The first draft called it a harness failure and exited 2,
    // discarding findings already gathered. Round 2 reproduced that.
    // First line only: `require` errors carry a multi-line "Require stack" that names THIS
    // auditor, which reads as if the auditor were the broken thing.
    const why = String(err && err.message || err).split('\n')[0];
    fail(`the shipped agent registry did not load (${path.relative(packageRoot, registryPath)}: ${why}) — agent wrappers could not be checked`);
  }

  // ── PHASE 3 — one mutually exclusive verdict per module.
  const absent = missingModules(declared, projectRoot);
  for (const m of absent) fail(`_bmad/bme/${m}/ is in files[] but did not arrive in the project`);
  const arrived = declared.filter(m => !absent.includes(m));

  for (const m of modulesWithoutConfig(arrived, projectRoot)) {
    fail(`_bmad/bme/${m}/ arrived but carries no config.yaml (ADR-004 C1) — it can declare no invocable unit`);
  }
  for (const bad of unparsableConfigs(projectRoot, arrived)) {
    fail(`_bmad/bme/${bad.module}/config.yaml does not parse (${bad.message}) — its declarations cannot be checked`);
  }

  // ── PHASE 4 — units, wrappers, runtime data.
  const { units, malformed, byModule, duplicates } = registry
    ? declaredUnits({ projectRoot, registry, arrived })
    : { units: [], malformed: [], byModule: {}, duplicates: [] };

  for (const m of malformed) {
    fail(`agent "${m.id}" (${m.rule}) — ${m.reason}, so nothing can be asserted about its wrapper`);
  }
  for (const d of duplicates) {
    fail(`${d.modules.join(' and ')} both declare ${d.name} — two modules cannot own one .claude/skills/ path`);
  }
  // C1 second form. Reachable now: nothing returns before it, and it distinguishes genuine
  // vacuity from the supported `excluded_agents` opt-out and from an unparsable config.
  for (const m of modulesDeclaringNothing(arrived, byModule, projectRoot)) {
    fail(`_bmad/bme/${m}/ arrived and carries a config.yaml but declares no invocable unit (ADR-004 C1/C3) — nothing in it is reachable`);
  }
  for (const u of missingWrappers(units, projectRoot)) {
    fail(`${u.module} declares ${u.name} but .claude/skills/${u.name}/SKILL.md was not generated or is empty (${u.site})`);
  }
  for (const e of missingRuntimeFiles(projectRoot)) {
    fail(`${e.file} is read at runtime by ${e.readSite} but did not arrive in the project`);
  }

  // NO ZERO-UNIT ALARM HERE, deliberately — it was removed in Round 3 rather than repaired.
  //
  // It read `units.length === 0 && arrived.length > 0 && out.length === 0`, and that
  // conjunction is unsatisfiable for the reason it existed: every route to zero units already
  // emits a finding above (no config, unparsable config, or declares-nothing), so
  // `out.length === 0` suppressed it. Its ONE reachable state was a module whose units were
  // all removed by the operator's `excluded_agents` opt-out — a supported configuration —
  // where it fired with a message that was false on its face. Both layers reproduced it.
  //
  // Deletion over repair: a check that cannot be a true positive and can be a false one is
  // worse than absent, and removing code cannot introduce the class of defect that every
  // previous round's repair did. The genuine "derivation broke" signals are the per-module
  // verdicts in PHASE 3, which do fire.

  // ── PHASE 5 — emit once.
  if (out.length === 0) {
    out.push(
      // `arrived`, not `declared` — the green line is the only thing an operator reads on a
      // passing run, and counting declarations there overstates coverage.
      `    ${arrived.length} shipped bme module(s) arrived, ${units.length} declared unit(s) resolve to a wrapper, ` +
      `${RUNTIME_DATA_FILES.length} runtime data file(s) present`
    );
    finish(0);
  }
  finish(1);
}

function requires(entryFile, maxFilesArg) {
  if (!entryFile) precondition(USAGE);
  let maxFiles;
  if (maxFilesArg !== undefined) {
    maxFiles = Number(maxFilesArg);
    if (!Number.isInteger(maxFiles) || maxFiles < 1) precondition(`maxFiles must be an integer >= 1 (got: '${maxFilesArg}')`);
  }
  const res = walkRequires(entryFile, maxFiles === undefined ? {} : { maxFiles });
  if (res.capHit) {
    precondition(`dependency walk hit its ${maxFiles === undefined ? DEFAULT_MAX_FILES : maxFiles}-file cap from ${entryFile} — surface not fully checked`);
  }
  // Newline-separated `<specifier> (from <file>)`; empty means clean. Newlines because a
  // specifier may contain a space, and `from` because the walk spans many files so a bare
  // `./x` does not say which one needs it.
  const shorten = f => {
    const marker = `${path.sep}node_modules${path.sep}convoke-agents${path.sep}`;
    const i = f.indexOf(marker);
    return i === -1 ? f : f.slice(i + marker.length);
  };
  const text = res.missing.map(m => `${m.spec} (from ${shorten(m.from)})`).join('\n');
  try { fs.writeSync(1, text); } catch { /* ignore */ }
  process.exit(0);
}

function main() {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === 'tree') return tree(rest[0], rest[1]);
  if (mode === 'requires') return requires(rest[0], rest[1]);
  precondition(USAGE);
}

try {
  main();
} catch (err) {
  // An unexpected throw is the instrument breaking, not a verdict — so exit 2. But FLUSH
  // FIRST. This used to call `precondition()`, which writes only to stderr, so a crash in
  // phases 2-4 threw away every finding already gathered. Round 2 raised that defect against
  // an early `return`; the restructure fixed the returns and left it alive in the catch, and
  // Round 3 reproduced it two ways (a non-iterable `AGENTS` shape, and js-yaml failing to
  // load). Evidence outlives the crash now; the exit code still says the run was incomplete.
  if (out.length) {
    try { fs.writeSync(1, out.join('\n') + '\n'); } catch { /* stdout closed */ }
  }
  try {
    fs.writeSync(2, `[harness] assertion crashed after ${out.length} finding(s): ${err && err.stack ? err.stack : err}\n`);
  } catch { /* ignore */ }
  process.exit(2);
}
