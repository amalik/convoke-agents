'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const { getPackageVersion, compareVersions, parseVersion } = require('../update/lib/utils');

/**
 * Shared enumeration of `_bmad/bme/*` modules, and the skew `convoke-update` can repair.
 *
 * BUG-17: `convoke-doctor` enumerated every `_bmad/bme/*` module for its version-consistency
 * check while `convoke-update`'s gate read only `_bmad/bme/_vortex/config.yaml`. An install
 * whose Vortex was current but whose siblings were behind therefore reported skew forever:
 * `assessUpdate` returned `up-to-date` and exited before `refreshInstallation` — which has
 * stamped every module since `ag-7-1` — was ever reached.
 *
 * This module gives the GATE an enumeration equivalent to doctor's, and a comparison that is a
 * strict superset of it. It is deliberately NOT single-sourced: `convoke-doctor` keeps its own
 * `discoverModules` and its own `!==` compare, because this change was required to leave doctor
 * byte-identical. So the two copies are pinned by tests and by review, not by construction — and
 * the version-key read below must match doctor's exactly or the drift is BUG-17 again. An earlier
 * revision of this file read only `.version` and reproduced precisely that.
 *
 * SCOPE — read this before extending. Three review rounds established that widening this file
 * to classify every version shape and to decide what doctor should advise is a substantially
 * larger problem than the one BUG-17 reports, and three attempts at it failed. What is NOT
 * handled here, each with a backlog row and a reproduction:
 *
 *   - a source checkout (`packageRoot === projectRoot`), where every config write in
 *     `refreshInstallation` is skipped, so nothing here is repairable in practice — T114
 *   - `assessUpdate`'s earlier exits (`no-project`, `fresh`, `broken`, `no-version`,
 *     `downgrade`), which refuse before skew is ever consulted — T115
 *   - unorderable versions (`main`, `v4.0.1`, the number `4`) — BUG-18, and T116 for the
 *     unhandled `TypeError` a numeric `_vortex` version produces in `isBreakingChange`
 *   - modules ahead of the package — T38
 *
 * Everything else IS handled here, and the version-key read must stay in lockstep with doctor's.
 *
 * Doctor's reporting is deliberately unchanged by this file. It already reported the skew
 * correctly; the defect was that no command acted on it.
 */

const PACKAGE_ROOT = path.join(__dirname, '..', '..');

/** `getCurrentVersion()` already decides whether Vortex itself needs an update. */
const ROUTING_EXEMPT_MODULES = Object.freeze(['_vortex']);

/**
 * Scan `_bmad/bme/` for subdirectories containing config.yaml.
 * Returns module descriptors with parsed config (or null on parse error).
 *
 * Behaviour-for-behaviour the same enumeration `convoke-doctor` performs; the only difference
 * is `fs-extra`, whose `existsSync`/`readdirSync`/`readFileSync` are the same functions. A
 * module directory with no config.yaml is invisible here by construction.
 */
function discoverModules(projectRoot) {
  const bmeDir = path.join(projectRoot, '_bmad/bme');
  if (!fs.existsSync(bmeDir)) return [];

  const modules = [];
  for (const entry of fs.readdirSync(bmeDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const configPath = path.join(bmeDir, entry.name, 'config.yaml');
    if (!fs.existsSync(configPath)) continue;

    let config = null;
    let parseError = null;
    try {
      config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      parseError = err.message;
    }
    modules.push({ name: entry.name, dir: path.join(bmeDir, entry.name), configPath, config, parseError });
  }
  return modules;
}

/**
 * Modules `refreshInstallation` has a stamp path for, whose package source is present.
 *
 * Both conditions, because either alone is a lie: the declared set is the truth about which
 * code paths exist, the tree check is the truth about whether this build ships the source
 * they copy from. Requiring lazily so a broken install cannot take down the caller.
 */
function isManagedByInstaller(name) {
  // Deliberately NOT wrapped in a try/catch. Swallowing a load failure here made every module
  // look unmanaged, so `assessUpdate` returned `up-to-date` and the CLI reported a skewed tree as
  // healthy — a silent green, which is the house's named failure mode ("what does it do when it
  // cannot tell?"). The failure is not survivable in any case: `refresh-installation` is a hard
  // dependency of `runRefreshOnly`, the path this routes TO. Better loud than masked.
  const { STAMPABLE_MODULES: declared } = require('../update/lib/refresh-installation');
  if (!Array.isArray(declared)) {
    throw new Error('refresh-installation did not export STAMPABLE_MODULES (wiring bug, not a skew result)');
  }
  // `declared.includes(name)` is evaluated BEFORE the join, which is what makes a name containing
  // `..` or `/` safe. Do not reorder these clauses for readability.
  return declared.includes(name)
    && fs.existsSync(path.join(PACKAGE_ROOT, '_bmad', 'bme', name));
}

/**
 * Skew a refresh will repair: a module behind the package, or at the same precedence with a
 * different version string.
 *
 * `divergent` matters because the two sides must compare the same way as well as enumerate the
 * same set. `compareVersions('4.0.1+abc', '4.0.1')` is 0 — SemVer §10 drops build metadata —
 * while the strings differ, so doctor reports a mismatch. A refresh re-stamps it either way.
 *
 * Anything this function cannot order, or cannot promise a refresh will change, is omitted
 * rather than guessed at. See the SCOPE note above.
 *
 * @returns {Array<{name, version, state}>}
 */
function detectRepairableSkew(projectRoot, opts = {}) {
  const packageVersion = opts.packageVersion || getPackageVersion();
  const out = [];

  for (const mod of discoverModules(projectRoot)) {
    if (ROUTING_EXEMPT_MODULES.includes(mod.name)) continue;
    if (!mod.config) continue;
    if (!isManagedByInstaller(mod.name)) continue;

    // MUST stay identical to convoke-doctor's read (`version || installed_version`). Reading only
    // `.version` leaves a module declaring `installed_version` visible to doctor and invisible to
    // this gate — doctor reports skew, `convoke-update` says up-to-date, and a refresh would have
    // repaired it. That is BUG-17's symptom exactly, and it shipped in the first cut of this file.
    // The `|| installed_version` fallback must match convoke-doctor's read exactly.
    // Dropping it recreated BUG-17's symptom inside BUG-17's own fix; see a0539c83.
    const declared = mod.config.version || mod.config.installed_version;
    // T120: was a locally-written regex here. BUG-17 had to invent this same test twice
    // across three review rounds, which is the argument for one shared read-side check.
    // NOTE this is slightly LOOSER than the regex it replaces: `parseVersion` accepts a
    // 1- or 2-part version (`1.0`), which `compareVersions` pads and orders, and which
    // `tests/unit/utils.test.js` pins as orderable. Such a module is now routed rather
    // than skipped — correct, since it genuinely is behind.
    const parsed = parseVersion(declared);
    if (!parsed.ok) continue;
    const raw = parsed.version;

    const cmp = compareVersions(raw, packageVersion);
    if (cmp > 0) continue;                        // ahead — T38
    if (cmp === 0 && raw === packageVersion) continue; // current
    out.push({ name: mod.name, version: raw, state: cmp < 0 ? 'behind' : 'divergent' });
  }

  return out;
}

module.exports = {
  discoverModules,
  detectRepairableSkew,
  isManagedByInstaller,
  ROUTING_EXEMPT_MODULES,
};
