#!/usr/bin/env node

/**
 * Generate Agent Manifest — the deliberate path.
 *
 * Regenerates this checkout's `_bmad/_config/agent-manifest.csv` from the agent
 * registry. Run it after editing `scripts/update/lib/agent-registry.js`; nothing
 * else regenerates the manifest in a development tree any more.
 *
 *   npm run generate:manifest
 *
 * Story gen-1.1: before this entry existed, the manifest was rewritten as a side
 * effect of every `refreshInstallation()` call — including the ones made by the
 * test suite, which meant `npm test` silently modified a tracked file. That write
 * is now guarded; this command is the replacement for it.
 *
 * @module generate-manifest
 */

const fs = require('fs');
const path = require('path');
const { generateAgentManifest } = require('./lib/agent-manifest-generator');

const PACKAGE_NAME = 'convoke-agents';

/**
 * Resolve the package root from THIS FILE's location — never from `process.cwd()`
 * and never via `findProjectRoot()`.
 *
 * Story gen-1.1 AC7. `findProjectRoot()` walks up from the cwd looking for a
 * `_bmad` directory, and the published tarball contains one — along with 355 file
 * entries beneath it — so a consumer running from inside
 * `node_modules/convoke-agents/` resolves to the package itself and passes any
 * contains-check. It also returns `null` when no ancestor has a `_bmad`, which
 * makes `path.join(null, …)` throw a TypeError — a stack trace exiting 1,
 * indistinguishable from a refusal to an exit-code assertion.
 *
 * Deriving from `__dirname` makes the answer independent of where the command is
 * invoked from, so there is no cwd from which the guard gives the wrong answer.
 */
function packageRoot() {
  return path.resolve(__dirname, '..');
}

/**
 * Decide whether this copy of the package is a development checkout.
 *
 * The discriminator is "am I installed inside a `node_modules` tree", NOT "is some
 * marker file present". An earlier design keyed on the presence of `tests/`, on the
 * evidence that `tests/` ships zero tarball entries — but that proves *absent from
 * the tarball*, not *present only in this repo*. A consumer who installed Convoke
 * has `_bmad/`, and nearly every JS project has a `tests/` directory, so that guard
 * allowed the write into their tracked manifest.
 *
 * Being under `node_modules` is true of every installed copy (including a global
 * `-g` install, which lands in `lib/node_modules/convoke-agents`) and false of every
 * checkout.
 *
 * @param {string} root - Absolute package root
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
function checkDevelopmentCheckout(root) {
  if (root.split(path.sep).includes('node_modules')) {
    return {
      ok: false,
      reason:
        `this is an installed copy of ${PACKAGE_NAME}, not a development checkout\n` +
        `  (package root is inside node_modules: ${root})`,
    };
  }

  const pkgPath = path.join(root, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    return { ok: false, reason: `cannot read ${pkgPath}: ${err.message}` };
  }
  // `JSON.parse('null')` succeeds, so reading `.name` off the result must not be
  // assumed safe — it would throw OUTSIDE the try above and surface as a crash
  // rather than the refusal this function promises. Same for a JSON string, number
  // or array, all of which parse fine and have no useful `.name`.
  const name = pkg && typeof pkg === 'object' ? pkg.name : undefined;
  if (name !== PACKAGE_NAME) {
    return {
      ok: false,
      reason: `package root is not ${PACKAGE_NAME} (found "${name}" at ${pkgPath})`,
    };
  }

  return { ok: true };
}

async function main() {
  const root = packageRoot();
  const verdict = checkDevelopmentCheckout(root);

  if (!verdict.ok) {
    console.error(`REFUSED: ${verdict.reason}`);
    console.error('');
    console.error(
      'This command regenerates a tracked source file and is only meaningful in a'
    );
    console.error(
      `${PACKAGE_NAME} development checkout. Installed copies receive their manifest`
    );
    console.error('from the installer, which writes it during install and update.');
    process.exit(1);
  }

  const message = await generateAgentManifest(root);
  console.log(`  ${message}`);
  console.log(`  ${path.join(root, '_bmad', '_config', 'agent-manifest.csv')}`);
}

// Only run when invoked as a command. Without this guard, a test that `require()`s
// this file to assert the AC1(ii) wiring would regenerate the tracked manifest as a
// side effect of being imported — the same class of defect this story exists to fix.
if (require.main === module) {
  main().catch(err => {
    console.error(`generate-manifest failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { checkDevelopmentCheckout, packageRoot, main };
