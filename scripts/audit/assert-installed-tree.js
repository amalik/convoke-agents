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
 * Run from the REPO, never from the installed copy. `scripts/` ships, so both exist —
 * but an auditor loaded out of the tree it is auditing hides exactly the defect class it
 * was built to catch. The tree under test is data here, not code.
 *
 * EXIT CODES — deliberately distinguished, matching the harness's own convention:
 *   0  no findings
 *   1  findings, printed as `FAILED:` lines
 *   2  the assertion could not run (bad arguments, unreadable package.json, no js-yaml)
 *
 * 2 is never conflated with 0. Four separate defects in this harness's history reported
 * success because a check could not run; `main()` is wrapped so an unexpected throw
 * lands on 2 rather than on node's default 1, which the caller would read as "findings".
 *
 * NOT IN THE VERDICT. Story dist-2.6 wires the caller's `TREE` variable into
 * try-fresh-install.sh's exit condition. Until then this prints and the harness still
 * exits on its pre-existing checks alone (NFR10).
 */

const fs = require('fs');
const path = require('path');

const {
  RUNTIME_DATA_FILES,
  shippedBmeModules,
  missingModules,
  missingRuntimeFiles,
  declaredUnits,
  missingWrappers,
  modulesWithoutConfig,
  unparsableConfigs,
  walkRequires,
} = require('./lib/installed-tree');

const USAGE = `usage:
  assert-installed-tree.js tree     <projectRoot> <installedPackageRoot>
  assert-installed-tree.js requires <entryFile> [maxFiles]`;

function harnessFail(msg) {
  console.error(`[harness] ${msg}`);
  process.exit(2);
}

function tree(projectRoot, packageRoot) {
  if (!projectRoot || !packageRoot) harnessFail(USAGE);
  for (const [label, dir] of [['project', projectRoot], ['installed package', packageRoot]]) {
    if (!fs.existsSync(dir)) harnessFail(`${label} root does not exist: ${dir}`);
  }

  const pkgPath = path.join(packageRoot, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    harnessFail(`cannot read installed package.json at ${pkgPath}: ${err.message}`);
  }

  const declared = shippedBmeModules(pkg.files);
  // An empty enumeration is not a pass. `files[]` losing its `_bmad/bme/*` entries is
  // itself the packaging regression this check exists for, and "0 modules, 0 missing"
  // would report it as health.
  if (declared.length === 0) {
    harnessFail(`installed package.json declares no _bmad/bme/* entries in files[] — enumeration failed or files[] regressed`);
  }
  // Same argument one level down: a manifest that emptied out is a check that cannot fail.
  if (RUNTIME_DATA_FILES.length === 0) {
    harnessFail('the runtime-data manifest is empty — a check that cannot fail is not a check');
  }

  let findings = 0;

  const absentModules = missingModules(declared, projectRoot);
  for (const m of absentModules) {
    console.log(`    FAILED: _bmad/bme/${m}/ is in files[] but did not arrive in the project`);
    findings++;
  }
  const arrived = declared.filter(m => !absentModules.includes(m));

  // ADR-004 C1, checked BEFORE the wrapper pass. Order matters: a module with no config
  // declares nothing, so without this the wrapper pass would find nothing to complain about
  // and the run would report health. Measured — see modulesWithoutConfig.
  for (const m of modulesWithoutConfig(arrived, projectRoot)) {
    console.log(`    FAILED: _bmad/bme/${m}/ arrived but carries no config.yaml (ADR-004 C1) — it can declare no invocable unit, so nothing in it is reachable`);
    findings++;
  }

  for (const bad of unparsableConfigs(projectRoot, arrived)) {
    console.log(`    FAILED: _bmad/bme/${bad.module}/config.yaml does not parse (${bad.message}) — its declarations cannot be checked`);
    findings++;
  }

  let registry;
  const registryPath = path.join(packageRoot, 'scripts', 'update', 'lib', 'agent-registry.js');
  try {
    registry = require(registryPath);
  } catch (err) {
    harnessFail(`cannot load the installed agent registry at ${registryPath}: ${err.message}`);
  }

  const units = declaredUnits({ projectRoot, registry, arrived });
  // Twelve agents and three workflows on a healthy 4.0.1 tree — but the number is
  // derived, never asserted, because a hardcoded count rots the first time a module
  // gains a workflow. Zero, however, means the derivation broke.
  if (units.length === 0) {
    harnessFail('no operator-invocable units were derived from the installed tree — the derivation failed (a module config shape changed, or the registry did not load)');
  }
  for (const u of missingWrappers(units, projectRoot)) {
    console.log(`    FAILED: ${u.module} declares ${u.name} but .claude/skills/${u.name}/SKILL.md was not generated (${u.site})`);
    findings++;
  }

  for (const e of missingRuntimeFiles(projectRoot)) {
    console.log(`    FAILED: ${e.file} is read at runtime by ${e.readSite} but did not arrive in the project`);
    findings++;
  }

  if (findings === 0) {
    console.log(
      `    ${declared.length} shipped bme module(s) arrived, ${units.length} declared unit(s) resolve to a wrapper, ` +
      `${RUNTIME_DATA_FILES.length} runtime data file(s) present`
    );
  }
  process.exit(findings === 0 ? 0 : 1);
}

function requires(entryFile, maxFilesArg) {
  if (!entryFile) harnessFail(USAGE);
  let maxFiles;
  if (maxFilesArg !== undefined) {
    maxFiles = Number(maxFilesArg);
    if (!Number.isInteger(maxFiles) || maxFiles < 1) harnessFail(`maxFiles must be an integer >= 1 (got: '${maxFilesArg}')`);
  }
  const res = walkRequires(entryFile, maxFiles === undefined ? {} : { maxFiles });
  // The cap is a harness limit, not a product defect — exit 2, so the caller does not
  // report a shipped package as broken because the walker gave up.
  if (res.capHit) harnessFail(`dependency walk hit its ${maxFiles === undefined ? 500 : maxFiles}-file cap from ${entryFile} — surface not fully checked`);
  // stdout is the caller's contract: space-joined missing specifiers, empty means clean.
  process.stdout.write(res.missing.map(m => m.spec).join(' '));
}

function main() {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === 'tree') return tree(rest[0], rest[1]);
  if (mode === 'requires') return requires(rest[0], rest[1]);
  harnessFail(USAGE);
}

try {
  main();
} catch (err) {
  // Any unexpected throw becomes 2, not node's default 1. The caller reads 1 as
  // "findings were printed"; a crash printed none.
  harnessFail(`assertion crashed: ${err && err.stack ? err.stack : err}`);
}
