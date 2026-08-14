'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { findProjectRoot } = require('../../scripts/update/lib/utils');

const REPO_ROOT = findProjectRoot();

// Backlog I137 — regression coverage for "a clean install reports itself broken".
//
// WHAT HAPPENED
// -------------
// Running an install-tarball smoke by hand (`npm pack` -> install into a fresh project ->
// `convoke-install-vortex` -> `convoke-doctor`) showed that a SUCCESSFUL install of 4.0.0-rc.1
// immediately failed its own health check with 3 errors and 2 warnings, one of which told the
// user to run a command that does not exist in their project. The install worked; the product
// said it didn't.
//
// These tests are deliberately CHEAP and STRUCTURAL. They do not pack or install anything —
// they assert the invariants whose violation produced each failure, so they run in
// milliseconds on every commit. The real end-to-end smoke is backlog T25; this is the fast
// guard that catches the same three classes long before a release.
//
// They read the repo's own shipped configuration on purpose. That is repo-integrity checking,
// the same category as portability-classification and portability-schema, not a
// `test-fixture-isolation` violation: the subject under test IS this repository's package.

describe('fresh-install health (I137)', () => {
  /** Every `_bmad/bme/*` module config, as { name, dir, config }. */
  function moduleConfigs() {
    const bmeDir = path.join(REPO_ROOT, '_bmad', 'bme');
    return fs
      .readdirSync(bmeDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => ({ name: e.name, dir: path.join(bmeDir, e.name) }))
      .filter((m) => fs.existsSync(path.join(m.dir, 'config.yaml')))
      .map((m) => ({ ...m, config: yaml.load(fs.readFileSync(path.join(m.dir, 'config.yaml'), 'utf8')) || {} }));
  }

  it('every workflow a module DECLARES has a workflow.md entry point', () => {
    // The `add-team` failure. `_team-factory/config.yaml` declared `workflows: [add-team]`, the
    // directory shipped with five step files, and `validator.js` requires
    // `workflows/<name>/workflow.md` — which did not exist. Result on a clean install:
    //   ✗ _team-factory workflows — Missing: add-team
    // Derived from the configs rather than a hardcoded list, per `derive-counts-from-source`:
    // a module that adds a workflow tomorrow is covered without editing this test.
    // Two declaration shapes ship today and both are valid: a bare string (Vortex, Gyre,
    // Team Factory) and an object carrying an explicit `entry` path (Enhance, Artifacts).
    // An earlier version of this test assumed strings and crashed on the object form — which
    // would have made it a test that fails for the wrong reason rather than one that finds
    // anything.
    const missing = [];
    let checked = 0;
    for (const mod of moduleConfigs()) {
      for (const wf of mod.config.workflows || []) {
        checked++;
        const rel =
          typeof wf === 'string'
            ? path.join('workflows', wf, 'workflow.md')
            : wf.entry || path.join('workflows', wf.name, 'workflow.md');
        const label = typeof wf === 'string' ? wf : wf.name;
        if (!fs.existsSync(path.join(mod.dir, rel))) missing.push(`${mod.name}/${label}`);
      }
    }
    assert.ok(checked > 0, 'no declared workflows found — this test would pass vacuously');
    assert.deepEqual(
      missing,
      [],
      `declared workflow(s) have no workflow.md entry point, which fails convoke-doctor on a ` +
        `clean install: ${missing.join(', ')}`
    );
  });

  it('doctor never tells a user to run a repo-relative script path', () => {
    // The unrunnable-remediation failure. Doctor emitted 12 `fix:` strings of the form
    // `node scripts/audit/audit-bmm-dependencies.js`. That path exists in THIS repo and under
    // the user's node_modules/, but not at the path printed — so every one of them was
    // unrunnable advice. Same root cause as I135: our own layout assumed to be theirs.
    // Remediation must be an installed bin, invoked via npx.
    // Scans EVERY shipped script, not just convoke-doctor.js. The first version of this test
    // checked doctor alone and passed while `convoke-update.js` still printed the same
    // unrunnable command twice — caught only because an unrelated unit test failed. Remediation
    // text is user-facing wherever it is printed from.
    const scriptFiles = [];
    (function walk(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name !== 'node_modules') walk(full);
        } else if (e.name.endsWith('.js')) scriptFiles.push(full);
      }
    })(path.join(REPO_ROOT, 'scripts'));

    // Discriminator: flag a message only when it points at a script OTHER than the one printing
    // it. A tool's own `Usage: node scripts/foo.js --bar` line is correct — that is genuinely how
    // you invoke it from a checkout, and those tools (pf1-record-agent, reference-integrity,
    // test-runner) are repo-internal and never run by an end user. What is never acceptable is
    // one script telling a user to go and run a DIFFERENT repo-relative path.
    const offenders = [];
    for (const file of scriptFiles) {
      const self = path.basename(file);
      // Skip comment-only lines. Explanatory comments legitimately quote the OLD, unrunnable
      // form when documenting why it was changed — this test flagged its own fix note otherwise.
      const src = fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => {
          const t = line.trim();
          return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
        })
        .join('\n');
      for (const m of src.matchAll(/['"`]([^'"`\n]*\bnode\s+scripts\/[^'"`\n]*)['"`]/g)) {
        const text = m[1].trim();
        const target = (text.match(/node\s+(scripts\/\S+)/) || [])[1] || '';
        if (path.basename(target) === self) continue; // self-usage line
        offenders.push(`${path.relative(REPO_ROOT, file)} -> ${target}`);
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `convoke-doctor tells the user to run a path that does not exist in their project. Expose ` +
        `the script as a bin and use "npx -p convoke-agents <bin>":\n  ${offenders.join('\n  ')}`
    );
  });

  it('every bin referenced by a doctor remediation is actually declared in package.json', () => {
    // Guards the fix above from being satisfied by naming a bin that does not exist.
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    const doctor = fs.readFileSync(path.join(REPO_ROOT, 'scripts', 'convoke-doctor.js'), 'utf8');
    const referenced = [...doctor.matchAll(/npx -p convoke-agents ([a-z0-9-]+)/g)].map((m) => m[1]);
    assert.ok(referenced.length > 0, 'no npx remediations found — this test would pass vacuously');
    const undeclared = [...new Set(referenced)].filter((b) => !pkg.bin[b]);
    assert.deepEqual(undeclared, [], `doctor references undeclared bin(s): ${undeclared.join(', ')}`);
  });

  it('every declared bin points at a file that exists and is executable as a CLI', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    const broken = [];
    for (const [name, rel] of Object.entries(pkg.bin)) {
      const abs = path.join(REPO_ROOT, rel);
      if (!fs.existsSync(abs)) {
        broken.push(`${name} -> ${rel} (missing)`);
        continue;
      }
      const src = fs.readFileSync(abs, 'utf8');
      if (!src.startsWith('#!')) {
        broken.push(`${name} -> ${rel} (no shebang)`);
        continue;
      }
      // A `require.main === module` guard is required ONLY for a file that is also importable:
      // without it, `require()`ing the module executes the CLI as a side effect. Pure entry
      // points (install-vortex, convoke-version, ...) legitimately run at top level.
      // An earlier version of this test demanded the guard unconditionally and reported five
      // working bins as broken — all five were verified to launch correctly.
      if (/module\.exports\s*=/.test(src) && !src.includes('require.main === module')) {
        broken.push(`${name} -> ${rel} (exports a module but runs at top level — require() would execute the CLI)`);
      }
    }
    assert.deepEqual(broken, [], `declared bin(s) are not runnable:\n  ${broken.join('\n  ')}`);
  });

  it('the install path seeds the artifact taxonomy, not just the upgrade path', () => {
    // `mergeTaxonomy` was reachable only from two migrations. A fresh install runs no
    // migrations, so `_bmad/_config/taxonomy.yaml` was never created and doctor reported
    //   ✗ Taxonomy: file exists
    // with a fix that told the user to run an upgrade they had no reason to run.
    const refresh = fs.readFileSync(
      path.join(REPO_ROOT, 'scripts', 'update', 'lib', 'refresh-installation.js'),
      'utf8'
    );
    assert.match(
      refresh,
      /mergeTaxonomy\s*\(/,
      'refreshInstallation no longer seeds taxonomy.yaml — a clean install will fail convoke-doctor'
    );
  });

  it('every shipped module config carries a version the installer will stamp', () => {
    // `_team-factory` was copied wholesale without a version stamp, so a clean install of
    // 4.0.0-rc.1 reported `_team-factory: 1.0.0` and told the user to immediately update.
    // Assert the STAMPING SITE exists rather than the stamped values: the package's own
    // config.yaml files legitimately ship a placeholder version, and it is the installer's
    // job to overwrite it.
    const refresh = fs.readFileSync(
      path.join(REPO_ROOT, 'scripts', 'update', 'lib', 'refresh-installation.js'),
      'utf8'
    );
    const standaloneBlock = refresh.slice(refresh.indexOf('Standalone bme submodule trees'));
    assert.ok(
      standaloneBlock.length > 0,
      'standalone submodule copy block not found — this test needs updating, not deleting'
    );
    assert.match(
      standaloneBlock.slice(0, 3000),
      /scDoc\.set\('version', version\)|mergeConfig\(/,
      'standalone bme submodules are copied without stamping config version — a clean install ' +
        'will fail the doctor version-consistency check'
    );
    // Every module must at least DECLARE a version for the check to have something to stamp.
    for (const mod of moduleConfigs()) {
      assert.ok(mod.config.version, `${mod.name}/config.yaml has no version field`);
    }
  });
});
