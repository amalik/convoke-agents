'use strict';

/**
 * T265: every script the package ships must be reachable from something an operator can run.
 *
 * `files[]` carries `scripts/` whole, so a new repository tool ships to every operator by default.
 * `scripts/.npmignore` names the repository-only files to leave out (the mechanism `T257` used for
 * `scripts/audit/`), and this test is what keeps that list honest in both directions:
 *
 *   - a shipped script that no entry point can reach is repository tooling that leaked into the
 *     package -- `archive.js --apply` rewrites the tree it runs in, which is an operator's project;
 *   - a script an entry point CAN reach that the package does not ship is an install that throws
 *     MODULE_NOT_FOUND the first time that path runs.
 *
 * Entry points are the `bin` targets, `main`, and any install-time lifecycle script. Reachability
 * follows static `require('./relative')` calls, plus the computed loads of migrations:
 * `migrations/registry.js` and `convoke-migrate.js` both require a migration by its
 * `MIGRATIONS[].name`, so every registered migration is walked, read from the registry itself
 * rather than from the directory listing.
 *
 * What this cannot see: a script reached only by `spawn`/`exec` of a path string, by
 * `require.resolve`, or by a computed `require` other than the migrations'. None loads a shipped
 * script today -- checked on 2026-10-19 by listing every non-literal `require` and child-process call
 * in `scripts/` and `index.js`. A `require('./x')` inside a comment would also count as reachable.
 * It covers `.js` files under `scripts/` only; other file types there are not checked.
 *
 * The package composition is asked of npm (`npm pack --dry-run --json`), which owns the semantics
 * of `files[]` and nested `.npmignore` files -- see `format-conversion-exclusion.test.js` for why
 * hand-written reasoning about those patterns failed four times.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { PACKAGE_ROOT } = require('../helpers');

// Shipped on purpose although nothing reaches it yet. Each entry needs its reason.
const SHIPPED_BUT_UNREACHED = {
  // Reserved for runtime work that has not landed: docs/codebase-audit-2026-06-27.md records it as
  // "read primitives reserved for v4.1 E4 (AD1/AD8)". Kept in the package (operator ruling
  // 2026-10-19) so the change that wires it up does not also have to remember to ship it.
  'scripts/update/lib/config-loader.js': 'reserved for future runtime use',
};

const REQUIRE_RE = /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;

function resolveLocal(fromAbs, spec) {
  const base = path.resolve(path.dirname(fromAbs), spec);
  for (const cand of [base, `${base}.js`, path.join(base, 'index.js')]) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
  }
  return null;
}

function reachableFrom(entries) {
  // An entry point that does not exist would drop out of the walk silently, and every file only it
  // reaches would then look excludable.
  const missing = entries.filter(e => !fs.existsSync(path.join(PACKAGE_ROOT, e)));
  if (missing.length) throw new Error(`entry points missing on disk: ${missing.join(', ')}`);
  const seen = new Set();
  const stack = entries.map(e => path.join(PACKAGE_ROOT, e));
  while (stack.length) {
    const abs = stack.pop();
    if (seen.has(abs) || !fs.existsSync(abs)) continue;
    seen.add(abs);
    const src = fs.readFileSync(abs, 'utf8');
    for (const m of src.matchAll(REQUIRE_RE)) {
      const target = resolveLocal(abs, m[1]);
      if (target) stack.push(target);
    }
  }
  return new Set([...seen].map(abs => path.relative(PACKAGE_ROOT, abs).split(path.sep).join('/')));
}

// Read inside the tests' setup, not when the file loads: a malformed package.json must fail a
// named test rather than abort the file before any test is declared.
function readPackage() {
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  // npm strips a leading './' from paths in its pack listing, so compare in that form.
  const bins = (typeof pkg.bin === 'string' ? [pkg.bin] : Object.values(pkg.bin || {})).map(b => path.posix.normalize(b));
  return { pkg, bins };
}

function entryPoints({ pkg, bins }) {
  const entries = [...bins, path.posix.normalize(pkg.main || 'index.js')];
  // Lifecycle scripts that run when a package is installed. `prepare` runs only when installing
  // from a git dependency, not from the registry tarball; it is walked anyway, since walking it can
  // only add files. Each must be a plain `node <file>` the walker can follow; anything else fails
  // here rather than going unwalked.
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
    const cmd = pkg.scripts && pkg.scripts[hook];
    if (!cmd) continue;
    const m = /^node\s+(\S+\.js)$/.exec(cmd.trim());
    if (!m) throw new Error(`${hook} is not a plain "node <file>.js" this walker can follow: ${cmd}`);
    entries.push(m[1]);
  }
  const { MIGRATIONS } = require(path.join(PACKAGE_ROOT, 'scripts/update/migrations/registry.js'));
  for (const m of MIGRATIONS) entries.push(`scripts/update/migrations/${m.name}.js`);
  return entries;
}

function shippedScripts() {
  let out;
  try {
    out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: PACKAGE_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    throw new Error(`npm pack --dry-run failed: ${(err.stderr || err.message || '').toString().trim()}`, { cause: err });
  }
  return JSON.parse(out)[0].files.map(f => f.path).filter(p => p.startsWith('scripts/') && p.endsWith('.js'));
}

describe('T265: the package ships exactly the scripts an operator can reach', () => {
  // Computed inside the tests, not at describe time: a setup error thrown while the suite is being
  // declared makes `node --test` report zero tests and exit 0, which would read as a pass.
  // A failure is remembered, so one broken setup is reported once per test without re-running npm.
  let cache;
  let failure;
  const state = () => {
    if (failure) throw failure;
    try {
      if (!cache) {
        const pkgInfo = readPackage();
        cache = { bins: pkgInfo.bins, reachable: reachableFrom(entryPoints(pkgInfo)), shipped: shippedScripts() };
      }
      return cache;
    } catch (err) {
      failure = err;
      throw err;
    }
  };

  it('the walk found the entry points and the migrations, so an empty result means nothing', () => {
    const { reachable, shipped, bins } = state();
    assert.ok(reachable.has('scripts/update/convoke-update.js'), 'fixture: a bin was not walked');
    assert.ok(reachable.has('scripts/update/migrations/3.3.x-to-4.0.0.js'), 'fixture: registry migrations were not walked');
    const unshippedBins = bins.filter(b => !shipped.includes(b));
    assert.deepEqual(unshippedBins, [], 'fixture: npm reports a bin target the package does not ship');
  });

  it('every shipped script is reachable, or deliberately shipped with a reason', () => {
    const { reachable, shipped } = state();
    const leaked = shipped.filter(p => !reachable.has(p) && !SHIPPED_BUT_UNREACHED[p]);
    assert.deepEqual(leaked, [],
      'shipped scripts that no entry point reaches. Before excluding one, check that nothing an ' +
      'operator runs loads it in a way this walker cannot see (spawn/exec of its path, a file read, ' +
      'an instruction in shipped markdown); if something does, teach the walker. Only then list it in ' +
      'scripts/.npmignore:\n  ' + leaked.join('\n  '));
  });

  it('every reachable script ships', () => {
    const { reachable, shipped } = state();
    const shippedSet = new Set(shipped);
    const missing = [...reachable].filter(p => p.startsWith('scripts/') && !shippedSet.has(p));
    assert.deepEqual(missing, [], 'an entry point loads a script the package leaves out:\n  ' + missing.join('\n  '));
  });

  it('each deliberate exemption still ships and is still unreached, so the list cannot rot', () => {
    const { reachable, shipped } = state();
    for (const p of Object.keys(SHIPPED_BUT_UNREACHED)) {
      assert.ok(shipped.includes(p), `${p} is exempted but no longer ships; drop the exemption`);
      assert.ok(!reachable.has(p), `${p} is exempted but is now reachable; drop the exemption`);
    }
  });
});
