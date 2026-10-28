#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const YAML = require('yaml'); // Comment-preserving YAML library (ag-7-1: I29). Use for WRITE sites that need to preserve comments. js-yaml stays for read-only consumers.
const { getPackageVersion, assertVersion } = require('./utils');
const configMerger = require('./config-merger');
// Story v63-3-1: AGENT_FILES dropped from this file's imports — post-migration
// the Vortex copy loop iterates AGENT_IDS and handles skill-dir shape inline.
// AGENT_FILES remains @deprecated in agent-registry for any external consumers.
const { AGENTS, AGENT_IDS, WORKFLOW_NAMES, GYRE_AGENTS, GYRE_AGENT_FILES, GYRE_AGENT_IDS, GYRE_WORKFLOW_NAMES, RETIRED_WRAPPER_IDS } = require('./agent-registry');
const {
  generateAgentManifest,
  CHANGE_MESSAGE: MANIFEST_CHANGE_MESSAGE,
  SKIP_MESSAGE: MANIFEST_SKIP_MESSAGE,
} = require('../../lib/agent-manifest-generator');

/**
 * Refresh Installation for Convoke
 *
 * Copies latest agent files, workflows, config, and user guides from the
 * package to the project. Called ONCE after all migration deltas have run,
 * or directly by the install script.
 */

/**
 * The `_bmad/bme/<module>/` configs this refresh WRITES, sorted.
 *
 * A literal, and the reason is measured rather than preferred. Two earlier derivations were tried
 * and both were wrong in the data-loss direction:
 *
 *   1. `readdirSync` of the package tree, filtered to directories carrying a `config.yaml`. Correct
 *      on every real install — the installed package tree IS the shipped set — but in a dev tree it
 *      covers `_team-factory`, whose source stays tracked in git while `tfu-1-1` stopped shipping it
 *      and deleted its copy loop. The guard then refuses over a config nothing would have written.
 *      That was `T227`.
 *   2. The same, intersected with `package.json` `files[]`. `T227`'s fix, and worse: `files[]` is a
 *      declaration whose glob semantics have now defeated five hand-written parsers in this
 *      repository (`deferred-work.md` records the first four; T227's Round 2 measured the fifth).
 *      A leading `/`, a `//`, a case difference, a `./` or an empty string each left npm shipping
 *      the module while the parser dropped it — reintroducing `T181`'s silent overwrite. Measured on
 *      an extracted tarball, deleting `files[]` outright changed the result not at all, so the
 *      parser could only ever subtract from a correct answer.
 *
 * So the question "which modules ship" was the wrong one. The guard exists to refuse an unreadable
 * config rather than overwrite it, which makes the only relevant question "which configs does this
 * function WRITE" — and that is not knowable from any manifest. It is a property of the code below,
 * where five modules have a config write site and nothing else does.
 *
 * NOT DERIVED, THEREFORE PINNED BEHAVIOURALLY. A literal rots when someone adds a module and
 * forgets. `tests/unit/refresh-installation-config-guard.test.js` seeds a readable sentinel config
 * into every `_bmad/bme/*` directory, runs one real refresh, and asserts that the set whose config
 * CONTENT changed equals this list exactly. A write site without an entry here reddens; an entry
 * here without a write site reddens. Neither direction reads a manifest.
 *
 * The scope of that guarantee, stated because an earlier version of this comment overstated it and
 * Round 3 of `T227` falsified it twice: the probe sees a write only if it changes the file's BYTES.
 * It originally keyed on the `version` scalar alone, and a write that restored the operator's
 * previous version was invisible — suite green, config destroyed. It also enumerated only modules
 * shipping a `config.yaml` template, so a module whose config the installer GENERATES was never
 * examined. Both are closed. What remains open is a write that reproduces the seeded bytes exactly,
 * which is not a data-loss shape and is left stated rather than closed.
 *
 * Sorted because the order decides WHICH damaged config an operator is told about first, and the
 * refusal names only the first. A test asserts both the sortedness and that behaviour.
 */
const GUARDED_MODULE_NAMES = Object.freeze(['_artifacts', '_enhance', '_gyre', '_portability', '_vortex']);

/**
 * @returns {string[]} a fresh copy of {@link GUARDED_MODULE_NAMES}
 */
function guardedModuleNames() {
  return [...GUARDED_MODULE_NAMES];
}

/**
 * The modules whose `config.yaml` goes through {@link configMerger.mergeConfig}, so an operator's
 * own keys survive a refresh — values they edited as well as keys they added. The rest of
 * {@link GUARDED_MODULE_NAMES} is copied from the package template and version-stamped, keeping only
 * the keys an operator added ({@link ADDED_KEYS_KEPT_MODULE_NAMES}, T221).
 *
 * NAMED, not derived from `configMerger.MODULE_PROFILES`. A profile is necessary but not
 * sufficient: preservation is decided by which write site a module reaches, and only the Gyre and
 * Vortex blocks call `mergeConfig` — the other three would ignore a profile entirely. Deriving the
 * set from the profile table let a profile added for `_artifacts` print "`_artifacts` keeps your
 * values" in the `convoke-update` plan while the refresh still replaced it, with every test green.
 *
 * `tests/unit/refresh-installation-config-guard.test.js` pins this behaviourally: a sentinel key is
 * seeded into all five configs, one refresh runs, and the set that still holds it must equal this
 * list.
 */
const MERGED_MODULE_NAMES = Object.freeze(['_gyre', '_vortex']);

/**
 * @returns {string[]} a fresh copy of {@link MERGED_MODULE_NAMES}
 */
function mergedModuleNames() {
  return [...MERGED_MODULE_NAMES];
}

/**
 * T221: the modules whose `config.yaml` is copied from the package template, so the package's own
 * keys (`name`, `version`, `description`, `workflows`) are reset, but every top-level key the
 * operator added is carried over (operator ruling 2026-10-26). Before T221 the copy dropped those
 * keys too. Named, and measured with {@link MERGED_MODULE_NAMES} by the same probe in
 * `tests/unit/refresh-installation-config-guard.test.js`: an added key and an edited package key
 * are seeded into every config, and the modules that keep only the first must be this list.
 */
const ADDED_KEYS_KEPT_MODULE_NAMES = Object.freeze(['_artifacts', '_enhance', '_portability']);

/**
 * @returns {string[]} a fresh copy of {@link ADDED_KEYS_KEPT_MODULE_NAMES}
 */
function addedKeysKeptModuleNames() {
  return [...ADDED_KEYS_KEPT_MODULE_NAMES];
}

/**
 * T221: what a refresh installed into a module tree, kept beside it — the files, and the top-level
 * keys of the package's `config.yaml`. Without it a file or key the package does not ship could be
 * the operator's or one an EARLIER Convoke version shipped and has since retired, and there is no
 * telling which (operator rulings 2026-10-26: record it, for files and for keys).
 */
const INSTALLED_RECORD_NAME = '.convoke-installed.json';

/**
 * Everything under `dir` that a refresh can keep, as `/`-separated paths relative to it: regular
 * files, symbolic links (not followed), and directories, each with its type. Other entries (FIFOs,
 * sockets) are left out.
 *
 * @returns {Array<{rel: string, type: 'file'|'symlink'|'dir'}>}
 */
function listEntries(dir) {
  const out = [];
  const walk = (rel) => {
    let entries;
    try {
      entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true });
    } catch (err) {
      err.rel = rel;
      throw err;
    }
    for (const entry of entries) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        out.push({ rel: entryRel, type: 'symlink' });
      } else if (entry.isDirectory()) {
        out.push({ rel: entryRel, type: 'dir' });
        walk(entryRel);
      } else if (entry.isFile()) {
        out.push({ rel: entryRel, type: 'file' });
      }
    }
  };
  if (isRealDir(dir)) walk('');
  return out;
}

/** True for a directory that is not a symbolic link to one. */
function isRealDir(p) {
  try {
    return fs.lstatSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** What the package ships at `rel`: 'file', 'dir', or null. */
function shippedType(packageDir, rel) {
  try {
    const st = fs.lstatSync(path.join(packageDir, rel));
    return st.isDirectory() ? 'dir' : 'file';
  } catch {
    return null;
  }
}

/**
 * The record an earlier refresh wrote, or `null` when there is none or it cannot be read. `null`
 * means every file and key the package does not ship is treated as the operator's — the direction
 * that loses nothing.
 *
 * @returns {{files: Set<string>, keys: Set<string>|null}|null}
 */
function readInstalledRecord(targetDir) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(targetDir, INSTALLED_RECORD_NAME), 'utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    // Strings only: a hand-edited entry that is not one names no path or key.
    const strings = (list) => (Array.isArray(list) ? new Set(list.filter((x) => typeof x === 'string')) : null);
    const files = strings(parsed.files);
    const keys = strings(parsed.keys);
    if (!files && !keys) return null;
    return { files: files || new Set(), keys };
  } catch {
    return null;
  }
}

const REFUSAL_TAIL = 'Fix it and re-run. No module has been refreshed yet; see UPDATE-GUIDE.md "Refresh: cannot read or remove".';

/**
 * T221: refuse, before any module is refreshed, a module tree the refresh could not take apart and
 * put back: a file of the operator's it cannot read, or a directory it cannot read, enter or
 * remove entries from. Without this, `fs.remove` failed half-way through such a tree — after
 * `_vortex`, `_gyre` and `_enhance` were written — leaving the module without its config.
 * Called from the T181 guard. A tree whose root is a symbolic link or not a directory is not
 * collected through (see {@link refreshCopiedModule}), so there is nothing here to check.
 */
function assertTreeKeepable(targetDir, packageDir, moduleRel) {
  if (!isRealDir(targetDir)) return;
  const record = readInstalledRecord(targetDir);
  const refuse = (rel, what, err, note = '') => {
    throw new Error(`Refresh: cannot ${what} ${moduleRel}${rel}${note} (${err.code || err.message}). ${REFUSAL_TAIL}`, { cause: err });
  };
  let entries;
  try {
    entries = listEntries(targetDir);
  } catch (err) {
    refuse(err.rel ? `${err.rel}/` : '', 'read', err);
  }
  // The parent too: removing the module directory itself is an entry removed from `_bmad/bme/`.
  try {
    fs.accessSync(path.dirname(targetDir), fs.constants.W_OK | fs.constants.X_OK);
  } catch (err) {
    throw new Error(`Refresh: cannot remove entries from ${path.posix.dirname(moduleRel.replace(/\/$/, ''))}/ (${err.code || err.message}). ${REFUSAL_TAIL}`, { cause: err });
  }
  const dirs = [''].concat(entries.filter((e) => e.type === 'dir').map((e) => e.rel));
  for (const rel of dirs) {
    try {
      fs.accessSync(path.join(targetDir, rel), fs.constants.W_OK | fs.constants.X_OK);
    } catch (err) {
      refuse(rel ? `${rel}/` : '', 'remove entries from', err);
    }
  }
  const clash = (rel, note) => {
    throw new Error(`Refresh: cannot keep ${moduleRel}${rel}, ${note}. Move it out of _bmad/bme/ and re-run. No module has been refreshed yet; see UPDATE-GUIDE.md "Refresh: cannot read or remove".`);
  };
  for (const entry of entries) {
    if (entry.rel === INSTALLED_RECORD_NAME) continue;
    const shipped = shippedType(packageDir, entry.rel);
    // Kinds that clash with what the package now ships at the same path: putting the operator's
    // entry back would mean removing the package's, so it cannot be kept in place.
    if (entry.type !== 'dir' && shipped === 'dir') clash(entry.rel, 'a file you added, where the package now ships a folder');
    if (entry.type === 'dir' && shipped === 'file') clash(`${entry.rel}/`, 'a folder you added, where the package now ships a file');
    // A path the package ships now but did not install last time holds the operator's file, which
    // the copy would overwrite. Only a record can tell; without one it is overwritten, as before T221.
    if (entry.type !== 'dir' && shipped === 'file' && record && record.files.size > 0 && !record.files.has(entry.rel)) {
      clash(entry.rel, 'a file you added, where the package now ships one of its own');
    }
    if (entry.type !== 'file' || shipped === 'file') continue;
    if (record && record.files.has(entry.rel)) continue;
    try {
      fs.accessSync(path.join(targetDir, entry.rel), fs.constants.R_OK);
    } catch (err) {
      refuse(entry.rel, 'read', err, ', a file you added');
    }
  }
}

/**
 * T221: sort what a module tree holds that the package does not ship, before the tree is removed
 * and re-copied. A file an earlier refresh installed is stale and goes with the tree; anything else
 * is the operator's and is read so it can be put back — files with their mode, symbolic links as
 * links, directories they created with their mode. With no record from an earlier refresh (the
 * first refresh after upgrading, or a damaged record) everything counts as the operator's. That is
 * also correct for every project today: no file the package retired from these two trees ever
 * reached one (`_artifacts` has retired none; `_portability` moved `skills/` to `workflows/` in
 * `dist-2-6`, the change that first installed it). A shipped path counts as shipped only when the
 * package has the same kind of entry there; an operator file where the package now has a directory
 * is kept, and reported as not put back.
 *
 * @returns {{added: Array<object>, stale: string[]}}
 */
function collectAddedEntries(targetDir, packageDir, record) {
  const added = [];
  const stale = [];
  // A directory the record shows the package used (a file under it was installed) is not the
  // operator's merely because the package dropped it; it is kept only if something under it is.
  const packageUsed = (rel) => Boolean(record) && [...record.files].some((f) => f.startsWith(`${rel}/`));
  for (const entry of listEntries(targetDir)) {
    if (entry.rel === INSTALLED_RECORD_NAME) continue;
    const shipped = shippedType(packageDir, entry.rel);
    if (entry.type === 'dir' ? shipped === 'dir' : shipped === 'file') continue;
    if (entry.type === 'dir' && packageUsed(entry.rel)) continue;
    if (entry.type === 'file' && record && record.files.has(entry.rel)) {
      stale.push(entry.rel);
      continue;
    }
    const abs = path.join(targetDir, entry.rel);
    if (entry.type === 'symlink') added.push({ rel: entry.rel, type: 'symlink', link: fs.readlinkSync(abs) });
    else if (entry.type === 'dir') added.push({ rel: entry.rel, type: 'dir', mode: fs.statSync(abs).mode & 0o7777 });
    else {
      const st = fs.statSync(abs);
      added.push({ rel: entry.rel, type: 'file', data: fs.readFileSync(abs), mode: st.mode & 0o7777, atime: st.atime, mtime: st.mtime });
    }
  }
  return { added, stale };
}

/**
 * Write back what {@link collectAddedEntries} read, after the package tree is copied — or after a
 * copy that failed, since this runs in a `finally`. A path it cannot write (the package now has
 * something else there, or a directory is unwritable) is reported, not thrown. `convoke-update`
 * backs up the whole of `_bmad/bme` before refreshing (T184); `convoke-install` takes no backup,
 * so there the report is the operator's only notice.
 *
 * @returns {{restored: string[], skipped: string[]}}
 */
function restoreAddedEntries(targetDir, collected) {
  const restored = [];
  const skipped = [];
  const dirModes = [];
  for (const entry of collected.added) {
    const dest = path.join(targetDir, entry.rel);
    try {
      if (entry.type === 'dir') {
        fs.ensureDirSync(dest);
        dirModes.push(entry);
        continue;
      }
      fs.ensureDirSync(path.dirname(dest));
      if (entry.type === 'symlink') {
        // Still there when the tree was not removed (a failure before `fs.remove`): that is restored.
        let existing = null;
        try { existing = fs.readlinkSync(dest); } catch { /* absent, or not a link */ }
        if (existing !== entry.link) fs.symlinkSync(entry.link, dest);
      } else {
        fs.writeFileSync(dest, entry.data);
        fs.chmodSync(dest, entry.mode);
        fs.utimesSync(dest, entry.atime, entry.mtime);
      }
      restored.push(entry.rel);
    } catch {
      skipped.push(entry.rel);
    }
  }
  // Last, deepest first: a directory the operator made read-only must still take its files above.
  for (const entry of dirModes.reverse()) {
    try {
      fs.chmodSync(path.join(targetDir, entry.rel), entry.mode);
    } catch {
      skipped.push(entry.rel);
    }
  }
  return { restored, skipped };
}

/**
 * T221: carry into the package's config every top-level key the operator's copy had and the
 * package's does not, with its comments, and the document's trailing comment. A key an earlier
 * refresh recorded as the package's own is not the operator's: it is dropped. Mutates `doc`.
 *
 * @param {YAML.Document} doc - The package config, already copied and stamped.
 * @param {string|null} priorText - The operator's config as it was before the copy.
 * @param {Set<string>|null} priorPackageKeys - From the record; `null` when there is none.
 * @returns {{carried: string[], retired: string[]}}
 */
function carryOperatorKeys(doc, priorText, priorPackageKeys) {
  const none = { carried: [], retired: [], replaced: [] };
  if (priorText === null) return none;
  const prior = YAML.parseDocument(priorText);
  // The T181 guard parses the same file with the same parser and refuses a YAML error or a
  // non-mapping, but it accepts an EMPTY document — a comment-only file is one. Its comment is the
  // operator's and is carried; there are no keys to carry.
  if (!(prior.errors && prior.errors.length > 0) && prior.contents === null && prior.commentBefore) {
    doc.comment = doc.comment ? `${doc.comment}\n${prior.commentBefore}` : prior.commentBefore;
    return none;
  }
  if ((prior.errors && prior.errors.length > 0) || !YAML.isMap(prior.contents) || !YAML.isMap(doc.contents)) {
    return none;
  }
  const keyOf = (pair) => (YAML.isScalar(pair.key) ? pair.key.value : pair.key);
  const retired = [];
  const replaced = [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const added = prior.contents.items.filter((pair) => {
    const key = keyOf(pair);
    if (doc.has(key)) {
      // A key the package now defines and did not last time was the operator's: package keys win
      // (ruling 2026-10-26), but the operator is told their value went.
      if (priorPackageKeys && !priorPackageKeys.has(String(key)) && !same(prior.toJS()[key], doc.toJS()[key])) {
        replaced.push(String(key));
      }
      return false;
    }
    if (priorPackageKeys && priorPackageKeys.has(String(key))) {
      retired.push(String(key));
      return false;
    }
    return true;
  });
  for (const pair of added) doc.contents.items.push(pair);
  // The trailing comment, on its own if need be. If the template ever carries one too, the
  // operator's copy already holds it, so only what follows it is theirs.
  const ownTrailer = prior.comment && doc.comment && prior.comment.startsWith(doc.comment)
    ? prior.comment.slice(doc.comment.length).replace(/^\n+/, '')
    : prior.comment;
  if (ownTrailer) doc.comment = doc.comment ? `${doc.comment}\n${ownTrailer}` : ownTrailer;
  try {
    doc.toString({ lineWidth: 0 });
  } catch {
    // An alias in a carried value whose anchor sits on a package key that was not carried. Carry
    // the resolved values instead, losing their comments rather than the keys.
    doc.contents.items.splice(doc.contents.items.length - added.length, added.length);
    // `mapAsMap` keys the result by the real key value, so a numeric or null key is found too.
    const values = prior.toJS({ mapAsMap: true });
    for (const pair of added) doc.set(keyOf(pair), values.get(keyOf(pair)));
  }
  return { carried: added.map((pair) => String(keyOf(pair))), retired, replaced };
}

/**
 * T221: copy one of {@link ADDED_KEYS_KEPT_MODULE_NAMES} from the package, keeping what the operator
 * added. The three modules shared this sequence copied three times; the failure path is why it is
 * one function now — what the operator added is put back in a `finally`, so a copy or stamp that
 * throws after the tree was removed does not lose it.
 *
 * @param {object} o
 * @param {string} o.packageDir
 * @param {string} o.targetDir
 * @param {boolean} o.removeFirst - Remove the tree before copying, to clear stale files.
 * @param {string} o.moduleRel - e.g. `_bmad/bme/_artifacts/`, for messages.
 * @param {string} o.label - e.g. `Artifacts`, for messages.
 * @param {string} o.version
 * @param {string[]} o.changes
 * @param {boolean} o.verbose
 */
async function refreshCopiedModule({ packageDir, targetDir, removeFirst, moduleRel, label, version, changes, verbose }) {
  const configPath = path.join(targetDir, 'config.yaml');
  const priorText = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : null;
  const record = readInstalledRecord(targetDir);
  // A root that is a symbolic link (or not a directory at all) is replaced as it always was:
  // `fs.remove` takes only the link, so whatever it pointed at is untouched. `listEntries` does not
  // walk such a root, so nothing is collected through it to be written a second time.
  const collected = removeFirst ? collectAddedEntries(targetDir, packageDir, record) : null;
  let keys = { carried: [], retired: [], replaced: [] };
  let files = null;
  let finished = false;
  try {
    if (removeFirst && fs.existsSync(targetDir)) await fs.remove(targetDir);
    await fs.copy(packageDir, targetDir, { overwrite: true });
    // Stamp the config's version to the package version (ag-7-1: I30 + I29; I137 for why every
    // copied module must be stamped). Comment-preserving YAML.parseDocument, not mergeConfig, which
    // has profiles for `_vortex` and `_gyre` only and would stamp Vortex identity onto this module.
    if (fs.existsSync(configPath)) {
      assertVersion(version, label.toLowerCase());
      const doc = YAML.parseDocument(fs.readFileSync(configPath, 'utf8'));
      if (doc.errors && doc.errors.length > 0) {
        throw new Error(`Refresh: cannot parse ${label} config.yaml: ${doc.errors[0].message}`);
      }
      doc.set('version', version);
      keys = carryOperatorKeys(doc, priorText, record && record.keys);
      fs.writeFileSync(configPath, doc.toString({ lineWidth: 0 }), 'utf8');
    }
    finished = true;
  } finally {
    if (collected) files = restoreAddedEntries(targetDir, collected);
    if (!finished) {
      // The copy or stamp failed after the tree may have been removed: put the operator's config
      // back as it was, keys and all, rather than leave the package's or none, and name what could
      // not be put back before the error propagates.
      // Printed, not only listed: the refresh is about to throw, so the caller never sees `changes`.
      const lines = [];
      if (priorText !== null) {
        try {
          fs.ensureDirSync(targetDir);
          fs.writeFileSync(configPath, priorText, 'utf8');
        } catch {
          lines.push(`Could not put back ${moduleRel}config.yaml as it was`);
        }
      }
      lines.push(...reportKept([], false, moduleRel, keys, files && { ...files, stale: [] }));
      for (const line of lines) console.error(`    ${line}`);
    }
  }
  changes.push(`Refreshed ${label} module: ${moduleRel}`);
  if (verbose) console.log(`    Refreshed ${label} module: ${moduleRel}`);
  const recordPath = path.join(targetDir, INSTALLED_RECORD_NAME);
  try {
    const packageDoc = YAML.parseDocument(fs.readFileSync(path.join(packageDir, 'config.yaml'), 'utf8'));
    const packageKeys = YAML.isMap(packageDoc.contents)
      ? packageDoc.contents.items.map((p) => String(YAML.isScalar(p.key) ? p.key.value : p.key))
      : [];
    // `files` only where the tree is removed and re-copied: that is the only place a refresh acts
    // on it. `_enhance` is copied over the top, so its record holds the config keys alone.
    const next = removeFirst
      ? {
        note: 'Written by convoke-install / convoke-update: what the package installed here. Editing it can make a refresh remove the files or config keys it names.',
        files: listEntries(packageDir).filter((e) => e.type === 'file').map((e) => e.rel).sort(),
        keys: packageKeys.sort(),
      }
      : {
        note: 'Written by convoke-install / convoke-update: the config keys the package installed here. Editing it can make a refresh remove the keys it names.',
        keys: packageKeys.sort(),
      };
    fs.writeFileSync(recordPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  } catch (err) {
    // An outdated record is worse than none: none means "keep everything".
    try { fs.removeSync(recordPath); } catch { /* reported below either way */ }
    changes.push(`Could not record what was installed in ${moduleRel} (${err.code || err.message}); the next refresh keeps every file and key it does not ship`);
  }
  reportKept(changes, verbose, moduleRel, keys, files && { ...files, stale: collected.stale });
}

/**
 * Report what T221 kept for one module, in the refresh's change list.
 */
function reportKept(changes, verbose, moduleRel, keys, files) {
  const lines = [];
  if (keys.replaced && keys.replaced.length > 0) {
    lines.push(`The package now sets ${keys.replaced.join(', ')} in ${moduleRel}config.yaml; your value was replaced`);
  }
  if (keys.carried.length > 0) lines.push(`Kept your keys in ${moduleRel}config.yaml: ${keys.carried.join(', ')}`);
  if (keys.retired.length > 0) {
    lines.push(`Removed key(s) an earlier Convoke version set in ${moduleRel}config.yaml and no longer does: ${keys.retired.join(', ')}`);
  }
  if (files && files.restored.length > 0) {
    lines.push(`Kept ${files.restored.length} file(s) you added under ${moduleRel}`);
  }
  if (files && files.stale.length > 0) {
    lines.push(`Removed ${files.stale.length} file(s) an earlier Convoke version installed under ${moduleRel} and no longer ships: ${files.stale.join(', ')}`);
  }
  if (files && files.skipped.length > 0) {
    lines.push(`Could not put back ${files.skipped.length} entr${files.skipped.length === 1 ? 'y' : 'ies'} you added under ${moduleRel}: ${files.skipped.join(', ')} — convoke-update backs up _bmad/bme first; an install does not`);
  }
  for (const line of lines) {
    changes.push(line);
    if (verbose) console.log(`    ${line}`);
  }
  return lines;
}

/**
 * Split a SHIPPED Gyre guides listing into what installs and what an opt-out excludes.
 *
 * EXTRACTED AND EXPORTED so the derivation can be tested against a SYNTHETIC listing. Round 1 of `T91`
 * found the first version built this list from `GYRE_AGENTS` plus a hardcoded `'GYRE-TEAM-GUIDE.md'`, so a
 * further non-per-agent document dropped into `guides/` would ship and never install — the very defect
 * `T91` was filed for. The first attempt at a test for that compared the installed directory against the
 * package directory, which CANNOT detect the regression: on the real package those two sets coincide,
 * because the package happens to ship exactly the roster's guides plus the one hardcoded exception. Review
 * reproduced the roster derivation and that test stayed green.
 *
 * A pure function over a listing is what makes the two sides independent: a synthetic list can contain a
 * guide no roster names, which the real package does not.
 *
 * @param {string[]} shipped - filenames in the package's `_gyre/guides/`
 * @param {string[]} excludedIds - agent ids from the project's `excluded_agents`
 * @returns {{ install: string[], skip: string[] }} both sorted; `skip` is reported, `install` is copied
 */
function gyreGuidePlan(shipped, excludedIds) {
  // THE FUNCTION OWNS THE WHOLE DECISION, INCLUDING THE LISTING. Round 2: the caller filtered to `*.md`
  // before calling, so the contract here ("filenames in guides/") and the caller's ("the .md ones")
  // disagreed and nothing reconciled them — the allowlist dropped shipped guides silently, and no test
  // against the real package could see it, because the real package happens to ship only `.md`. Passing a
  // DIRECTORY makes that decision reachable from a temp directory that ships whatever a test wants.
  //
  // A string argument is read as a directory; an array is taken as an already-read listing, which is what
  // the synthetic unit tests use. A missing or unreadable directory yields empty sets and `missing: true`,
  // so the caller reports it rather than silently installing nothing.
  if (typeof shipped === 'string') {
    let entries;
    try {
      entries = fs.readdirSync(shipped, { withFileTypes: true });
    } catch {
      return { install: [], skip: [], missing: true };
    }
    // `isFile`, not an extension test: a `.txt` or `.markdown` guide ships like any other, and a
    // DIRECTORY whose name ends `.md` must not be copied as though it were a guide.
    return gyreGuidePlan(entries.filter((e) => e.isFile()).map((e) => e.name), excludedIds);
  }
  const names = (Array.isArray(shipped) ? shipped : []).filter((n) => typeof n === 'string');
  const candidates = [...new Set(names)].filter((n) => !n.endsWith('.bak'));
  const excludedGuides = new Set(
    GYRE_AGENTS.filter((a) => (Array.isArray(excludedIds) ? excludedIds : []).includes(a.id))
      .map((a) => `${a.name.toUpperCase()}-USER-GUIDE.md`)
  );
  return {
    missing: false,
    install: candidates.filter((g) => !excludedGuides.has(g)).sort(),
    // Only guides the package actually ships are reported as skipped — an `excluded_agents` entry for an
    // agent whose guide is not shipped has nothing to report.
    skip: [...excludedGuides].filter((g) => candidates.includes(g)).sort(),
  };
}

/**
 * Refresh all installation files from the package to the project.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {object} options
 * @param {boolean} options.backupGuides - Create .bak of user guides before overwriting (default: true)
 * @param {boolean} options.verbose - Log each action (default: true)
 * @returns {Promise<Array<string>>} List of changes made
 */
async function refreshInstallation(projectRoot, options = {}) {
  const { backupGuides = true, verbose = true } = options;
  const changes = [];
  // `options.packageRoot` exists so the SAME-ROOT branch is reachable from a test. It defaults to
  // the derived value, so no caller's behaviour changes. T250 R3: the two `readExcludedAgents`
  // wirings below are load-bearing only when `isSameRoot` is true — in every other tree
  // `mergeConfig` runs and reports first — and with no way to reach that branch, deleting either
  // wiring left the whole suite green. The alternative was asserting on this file's source text,
  // which pins the spelling rather than the behaviour.
  const packageRoot = options.packageRoot
    ? path.resolve(options.packageRoot)
    : path.join(__dirname, '..', '..', '..');
  const packageVortex = path.join(packageRoot, '_bmad', 'bme', '_vortex');
  const targetVortex = path.join(projectRoot, '_bmad', 'bme', '_vortex');
  const version = getPackageVersion();

  // When running from the package's own directory (dev environment),
  // source and destination are identical — skip file copies.
  const isSameRoot = path.resolve(packageRoot) === path.resolve(projectRoot);

  // T181: refuse a module config that cannot be read, before any module tree is copied.
  //
  // `assertConfigReadable` was wired into Vortex and Gyre only (fic-1-1), so a damaged
  // `_enhance`, `_artifacts`, `_portability` or `_team-factory` config was replaced with the
  // package template and the operator's values were lost with nothing on screen. Those four
  // blocks (2b1 standalone, 2a Enhance, 2c Artifacts, 2c-bis Portability) do each parse a
  // config, but only after their `fs.copy` has already replaced the target — `scDoc`, `ecDoc`,
  // `acDoc` and `pcDoc` are all read from the DESTINATION path, so they see the package's own
  // template and cannot fail on operator data.
  //
  // The set is NAMED in `GUARDED_MODULE_NAMES`, not derived. Two derivations were tried and both
  // narrowed the guard in the data-loss direction; the reasoning is recorded at that constant. A
  // module added below without an entry there reddens the behavioural probe in
  // `tests/unit/refresh-installation-config-guard.test.js`.
  //
  // A path with no file on it is skipped: the `readConfigDocument` helper behind it returns null before
  // reading, which is what keeps a fresh install silent.
  //
  // NOT gated on `isSameRoot`, matching the two `readExcludedAgents` calls below. In a dev tree
  // the module copies are skipped, so this refuses a refresh that would not have written; the
  // message still names the file and the parser error, which is the actionable part.
  //
  // This refuses an UNREADABLE config. A readable one is handled in two ways: `_vortex` and
  // `_gyre` go through `configMerger.mergeConfig`, which has profiles for those two alone and
  // keeps the operator's values; `_enhance`, `_artifacts` and `_portability` are copied from the
  // package template and version-stamped, and since T221 keep the keys the operator added.
  for (const moduleName of guardedModuleNames()) {
    configMerger.assertConfigReadable(path.join(projectRoot, '_bmad', 'bme', moduleName, 'config.yaml'));
  }
  // T221: the two trees a refresh removes must be readable too, or what the operator added there
  // could be neither kept nor put back. Refused here, before any module is written.
  if (!isSameRoot) {
    for (const moduleName of ['_artifacts', '_portability']) {
      assertTreeKeepable(path.join(projectRoot, '_bmad', 'bme', moduleName),
        path.join(packageRoot, '_bmad', 'bme', moduleName), `_bmad/bme/${moduleName}/`);
    }
  }

  // U8: read per-module `excluded_agents` from target configs BEFORE copy.
  // These are opt-out lists the operator maintains; excluded agents don't get
  // their agent file copied, don't get a skill wrapper generated, and don't
  // fail presence checks downstream.
  // T250 R2: `{ profile }` makes these reads REPORT an unknown id. They are deliberately not
  // gated on `isSameRoot`, but the `mergeConfig` calls that used to carry the only warning
  // are — so in a same-root (dev) tree the exclusions were read and applied to the filesystem
  // with nothing printed. Measured: a stale wrapper removed for a genuine exclusion while a
  // typo'd id did nothing and said nothing.
  const vortexExcluded = configMerger.readExcludedAgents(
    configMerger.assertConfigReadable(path.join(targetVortex, 'config.yaml')),
    { profile: configMerger.MODULE_PROFILES._vortex }
  );
  const gyreExcluded = configMerger.readExcludedAgents(
    configMerger.assertConfigReadable(path.join(projectRoot, '_bmad', 'bme', '_gyre', 'config.yaml')),
    { profile: configMerger.MODULE_PROFILES._gyre }
  );

  // 1. Copy agent files
  const agentsSource = path.join(packageVortex, 'agents');
  const agentsTarget = path.join(targetVortex, 'agents');
  await fs.ensureDir(agentsTarget);

  if (!isSameRoot) {
    // Story v63-3-1: Vortex agents are now skill-dirs (`<agentId>/SKILL.md`)
    // per BMAD v6.3 convention. Copy the entire agent directory tree.
    for (const agentId of AGENT_IDS) {
      if (vortexExcluded.includes(agentId)) {
        changes.push(`Skipped excluded Vortex agent: ${agentId}`);
        if (verbose) console.log(`    Skipped excluded Vortex agent: ${agentId}`);
        continue;
      }
      const srcDir = path.join(agentsSource, agentId);
      const destDir = path.join(agentsTarget, agentId);
      if (fs.existsSync(srcDir)) {
        // Remove existing agent dir first to clear stale files.
        if (fs.existsSync(destDir)) {
          await fs.remove(destDir);
        }
        await fs.copy(srcDir, destDir, { overwrite: true });
        changes.push(`Refreshed agent: ${agentId}/SKILL.md`);
        if (verbose) console.log(`    Refreshed agent: ${agentId}/SKILL.md`);
      }
    }
  } else {
    changes.push('Skipped agent copy (dev environment — files already in place)');
    if (verbose) console.log('    Skipped agent copy (dev environment)');
  }

  // Remove deprecated agent files if still present (both pre-v4.0 flat-.md
  // and legacy v1.0.x agent names). Post-v4.0 migration, also clean up any
  // lingering flat <agentId>.md from a previous skill-dir migration boundary.
  const deprecatedAgents = ['empathy-mapper.md', 'wireframe-designer.md'];
  for (const file of deprecatedAgents) {
    const agentPath = path.join(agentsTarget, file);
    if (fs.existsSync(agentPath)) {
      await fs.remove(agentPath);
      changes.push(`Removed deprecated agent: ${file}`);
      if (verbose) console.log(`    Removed deprecated agent: ${file}`);
    }
  }
  // Story v63-3-1 cleanup + R1-H2 safety net: if any flat `<agentId>.md`
  // survives from a pre-4.0 install (e.g., operator upgrading from 3.3.0),
  // move it to `.backup-v4/` BEFORE removing — operator hand-edits deserve
  // preservation, not silent deletion. Respects feedback_path_safety.md
  // (explicit safety analysis required for destructive ops on user paths).
  // Skip in dev/isSameRoot mode so we don't accidentally wipe source backups.
  //
  // R2-H1: skip `vortexExcluded` agents — the copy loop at :61 already
  // skipped them, so the operator's opt-out flat file is legitimate state,
  // not stale. Removing it here would leave them with NO agent file
  // anywhere (not in skill-dir, not in agents root).
  //
  // R2-H5: backup dir lives at `_bmad/bme/_vortex/.backup-v4` (outside
  // `agentsTarget`). Placing it inside `agentsTarget` risked recursive
  // re-processing by directory walkers (workflow-copy, future doctor scans)
  // that treat `.backup-v4/<id>.md` as stale flat agents or copy them into
  // runtime wrappers.
  if (!isSameRoot) {
    const backupDir = path.join(targetVortex, '.backup-v4');
    let backedUpAny = false;
    for (const agentId of AGENT_IDS) {
      if (vortexExcluded.includes(agentId)) continue;
      const staleFlatPath = path.join(agentsTarget, `${agentId}.md`);
      if (fs.existsSync(staleFlatPath) && fs.statSync(staleFlatPath).isFile()) {
        if (!backedUpAny) {
          await fs.ensureDir(backupDir);
          backedUpAny = true;
        }
        const backupPath = path.join(backupDir, `${agentId}.md`);
        try {
          await fs.move(staleFlatPath, backupPath, { overwrite: true });
          changes.push(`Backed up pre-v4.0 flat agent file: ${agentId}.md → _vortex/.backup-v4/${agentId}.md`);
          if (verbose) {
            console.log(`    Backed up pre-v4.0 flat agent file: ${agentId}.md → _vortex/.backup-v4/${agentId}.md`);
          }
        } catch (_moveErr) {
          // If move fails (permissions, concurrent writer), fall back to
          // remove — better than blocking the migration, but log loudly.
          await fs.remove(staleFlatPath);
          changes.push(`Removed stale flat agent file (backup attempt failed): ${agentId}.md`);
          if (verbose) {
            console.log(`    WARNING: Removed stale flat agent file ${agentId}.md — backup attempt failed (${_moveErr.message})`);
          }
        }
      }
    }
    if (backedUpAny) {
      changes.push(`Note: pre-v4.0 agent file backups preserved under _vortex/.backup-v4/ — review and delete when confident migration is complete`);
      if (verbose) {
        console.log(`    Note: pre-v4.0 agent file backups preserved under _vortex/.backup-v4/`);
      }
    }
  }

  // 2. Copy workflow directories
  const workflowsSource = path.join(packageVortex, 'workflows');
  const workflowsTarget = path.join(targetVortex, 'workflows');
  await fs.ensureDir(workflowsTarget);

  if (!isSameRoot) {
    for (const wf of WORKFLOW_NAMES) {
      const src = path.join(workflowsSource, wf);
      const dest = path.join(workflowsTarget, wf);
      if (fs.existsSync(src)) {
        // Remove existing workflow directory first to clear stale files
        // (e.g., renamed step files from previous versions)
        if (fs.existsSync(dest)) {
          await fs.remove(dest);
        }
        await fs.copy(src, dest, { overwrite: true });
        changes.push(`Refreshed workflow: ${wf}`);
        if (verbose) console.log(`    Refreshed workflow: ${wf}`);
      }
    }
  } else {
    changes.push('Skipped workflow copy (dev environment — files already in place)');
    if (verbose) console.log('    Skipped workflow copy (dev environment)');
  }

  // 2b. Vortex reference assets (T88)
  //
  // Phases 1 and 2 copy `agents/` (respecting the U8 excluded_agents opt-out) and the
  // `workflows/` directories named in WORKFLOW_NAMES. `config.yaml` is merged at phase 3 and
  // per-agent guides are copied at phase 5. Nothing copied `contracts/`, so 16 files under
  // `workflows/` referenced `_bmad/bme/_vortex/contracts/hcN-*.md` — a path that existed only
  // inside the installed package, never in the operator's project.
  //
  // Mirrors the Gyre contracts block below, with one deliberate difference: this removes the
  // destination before copying. Phases 1, 2 and 2b1 all remove-then-copy so that files renamed
  // or deleted upstream do not survive in the operator tree. That matters more here than
  // elsewhere because the referring files cite schemas BY FILENAME — a superseded contract
  // left behind sits beside its replacement indefinitely.
  //
  // Scope is deliberately the two package-owned reference directories and nothing else. An
  // earlier draft copied every entry at the Vortex root; review rejected it on two grounds.
  // (1) It exceeded what was diagnosed: `README.md`, `module.yaml` and `module-help.csv` have
  // no shipped referent, and overwriting operator-editable files with no backup is a
  // regression the guides phase avoids via `backupGuides`. (2) Excluding the phase-owned
  // entries by name makes correctness depend on a denylist staying in sync with the phases
  // above — and drift there would wholesale-copy an exclusion-aware subtree, restoring agent
  // files an operator opted out of. Detecting the general class of "shipped document names a
  // path the installer never creates" is T89's job, not this phase's.
  const VORTEX_REFERENCE_DIRS = ['contracts', 'examples'];
  if (!isSameRoot) {
    for (const dir of VORTEX_REFERENCE_DIRS) {
      const src = path.join(packageVortex, dir);
      const dest = path.join(targetVortex, dir);
      if (!fs.existsSync(src)) {
        changes.push(`Vortex ${dir}/ not found in package — skipping`);
        if (verbose) console.log(`    ⚠ Vortex ${dir}/ not found in package — skipping`);
        continue;
      }
      if (fs.existsSync(dest)) await fs.remove(dest);
      await fs.copy(src, dest, { overwrite: true });
      changes.push(`Refreshed Vortex ${dir}`);
      if (verbose) console.log(`    Refreshed Vortex ${dir}`);
    }
  } else {
    changes.push('Skipped Vortex reference assets (dev environment — files already in place)');
    if (verbose) console.log('    Skipped Vortex reference assets (dev environment)');
  }

  // 2b1. REMOVED by story tfu-1-1 (2026-09-29) — standalone bme submodule trees.
  //
  // This block copied each EXTRA_BME_AGENTS submodule wholesale and stamped its config version. Its
  // only consumer was Loom's `_team-factory`, which stopped shipping per the 2026-09-16 operator
  // ruling. Removing it drops one tracked write op (`fs.writeFileSync(destConfig, ...)`), so
  // `scripts/audit/install-scope-check.js`'s snapshot for this file moves with it.
  //
  // Backlog I137 is why the stamp existed: this was the ONLY module tree copied without its config
  // being stamped, so a fresh successful install immediately failed Convoke's own version-consistency
  // check. That history matters if the mechanism is ever rebuilt for another standalone module —
  // stamp the config in the same block that copies the tree.
  //
  // NOTE for T222: this loop was also the only thing that could REMOVE a stale submodule from an
  // existing project (remove-then-copy). With it gone, a project that already installed
  // `_bmad/bme/_team-factory/` keeps it, and `convoke-doctor` fails version consistency
  // indefinitely. That orphan is T222's scope, deliberately not this story's.

  // 2a. Enhance module — read config, copy directory tree, patch target agent menu
  const packageEnhance = path.join(packageRoot, '_bmad', 'bme', '_enhance');
  const enhanceConfigPath = path.join(packageEnhance, 'config.yaml');

  let enhanceConfig = null;
  if (fs.existsSync(enhanceConfigPath)) {
    try {
      enhanceConfig = yaml.load(fs.readFileSync(enhanceConfigPath, 'utf8'));
    } catch (err) {
      const msg = `Enhance config.yaml parse error: ${err.message} — skipping Enhance installation`;
      changes.push(msg);
      if (verbose) console.log(`    ⚠ ${msg}`);
    }
  } else {
    changes.push('Enhance config.yaml not found — skipping Enhance installation');
    if (verbose) console.log('    ⚠ Enhance config.yaml not found — skipping Enhance installation');
  }

  if (enhanceConfig) {
    // 2b. Copy _enhance/ directory tree
    const targetEnhance = path.join(projectRoot, '_bmad', 'bme', '_enhance');

    if (!isSameRoot) {
      // A bare copy over the top: files the operator added were never removed here, so none are set
      // aside. Their config keys are carried over (T221).
      await refreshCopiedModule({
        packageDir: packageEnhance, targetDir: targetEnhance, removeFirst: false,
        moduleRel: '_bmad/bme/_enhance/', label: 'Enhance', version, changes, verbose,
      });
    } else {
      changes.push('Skipped Enhance copy (dev environment — files already in place)');
      if (verbose) console.log('    Skipped Enhance copy (dev environment)');
    }

    // 2c. Patch target agent menu for each registered workflow
    if (isSameRoot) {
      changes.push('Skipped Enhance menu patch (dev environment — source files unchanged)');
      if (verbose) console.log('    Skipped Enhance menu patch (dev environment)');
    }

    for (const workflow of (isSameRoot ? [] : enhanceConfig.workflows || [])) {
      const targetAgentRel = workflow.target_agent;
      const targetAgentPath = path.join(projectRoot, '_bmad', targetAgentRel);

      if (!fs.existsSync(targetAgentPath)) {
        const msg = `${targetAgentRel} not found — BMM module must be installed first. Skipping Enhance menu patch.`;
        changes.push(msg);
        if (verbose) console.log(`    ⚠ ${msg}`);
        continue;
      }

      let agentContent = fs.readFileSync(targetAgentPath, 'utf8');
      const patchName = workflow.menu_patch_name || workflow.name;

      // Idempotency: skip if patch already present
      if (agentContent.includes(patchName)) {
        changes.push(`Enhance menu patch already present in ${targetAgentRel} — skipping`);
        if (verbose) console.log(`    Enhance menu patch already present in ${targetAgentRel} — skipping`);
        continue;
      }

      // Build the <item> tag
      const entryPath = `{project-root}/_bmad/bme/_enhance/${workflow.entry}`;
      const itemTag = `    <item cmd="IB or fuzzy match on ${patchName}" exec="${entryPath}">[IB] 📦 Initiatives Backlog (Convoke Enhance)</item>`;

      // Find insertion anchor: prefer </menu>, fallback to last <item>
      const menuCloseIdx = agentContent.lastIndexOf('</menu>');
      if (menuCloseIdx !== -1) {
        // Insert before the </menu> line (not at the </menu> character position,
        // which would prepend existing line indentation to the inserted tag)
        const lineStart = agentContent.lastIndexOf('\n', menuCloseIdx - 1) + 1;
        agentContent = agentContent.slice(0, lineStart) + itemTag + '\n' + agentContent.slice(lineStart);
      } else {
        // Fallback: insert after last <item>...</item> line
        const lastItemMatch = agentContent.match(/.*<item[^]*?<\/item>/g);
        if (lastItemMatch) {
          const lastItem = lastItemMatch[lastItemMatch.length - 1];
          const lastItemIdx = agentContent.lastIndexOf(lastItem);
          const insertIdx = lastItemIdx + lastItem.length;
          agentContent = agentContent.slice(0, insertIdx) + '\n' + itemTag + agentContent.slice(insertIdx);
        } else {
          const msg = `${targetAgentRel} menu structure not recognized — manual patch required. Skipping Enhance menu patch.`;
          changes.push(msg);
          if (verbose) console.log(`    ⚠ ${msg}`);
          continue;
        }
      }

      fs.writeFileSync(targetAgentPath, agentContent, 'utf8');
      changes.push(`Patched ${targetAgentRel} with Enhance menu item: ${patchName}`);
      if (verbose) console.log(`    Patched ${targetAgentRel} with Enhance menu item: ${patchName}`);
    }
  }

  // 2c. Artifacts module — read config, copy directory tree, generate skill wrappers
  // Workflow-only submodule (no agents). Workflows are STANDALONE: each gets a Claude Code
  // skill wrapper but NO menu patch. The `standalone: true` flag in the workflow entry is
  // the discriminator — workflows without it are NOT supported in this module today (Story 6.6).
  const packageArtifacts = path.join(packageRoot, '_bmad', 'bme', '_artifacts');
  const artifactsConfigPath = path.join(packageArtifacts, 'config.yaml');

  let artifactsConfig = null;
  if (fs.existsSync(artifactsConfigPath)) {
    try {
      artifactsConfig = yaml.load(fs.readFileSync(artifactsConfigPath, 'utf8'));
    } catch (err) {
      const msg = `Artifacts config.yaml parse error: ${err.message} — skipping Artifacts installation`;
      changes.push(msg);
      if (verbose) console.log(`    ⚠ ${msg}`);
    }
  } else {
    changes.push('Artifacts config.yaml not found — skipping Artifacts installation');
    if (verbose) console.log('    ⚠ Artifacts config.yaml not found — skipping Artifacts installation');
  }

  if (artifactsConfig) {
    // Copy _artifacts/ directory tree
    const targetArtifacts = path.join(projectRoot, '_bmad', 'bme', '_artifacts');

    if (!isSameRoot) {
      // Removed first to clear stale files; what the operator added is kept (T221).
      await refreshCopiedModule({
        packageDir: packageArtifacts, targetDir: targetArtifacts, removeFirst: true,
        moduleRel: '_bmad/bme/_artifacts/', label: 'Artifacts', version, changes, verbose,
      });
    } else {
      changes.push('Skipped Artifacts copy (dev environment — files already in place)');
      if (verbose) console.log('    Skipped Artifacts copy (dev environment)');
    }

    // Skill wrapper generation for each workflow happens later in section 6d,
    // after skillsDir is defined (mirrors Enhance pattern: config/copy here, skill
    // wrappers in section 6c after agent skills are generated).
  }

  // 2c-bis. Portability module — copy tree, stamp version (Story dist-2.6)
  // MIRRORS the Artifacts block above line for line, deliberately. Portability had NO install
  // path at all: the only generic module loop iterated EXTRA_BME_AGENTS and was driven by the
  // AGENT registry, so a module with no agents was never visited. (That loop was removed with the
  // Team Factory in tfu-1-1; there is now NO generic module loop at all, which makes every module's
  // install path explicit — see §2b1's tombstone.) Its four skills shipped in
  // files[] to every operator and were reachable by none of them — which is the standing
  // finding assert-installed-tree.js reports and ADR-004 C1/C2 define.
  //
  // No new module shape is introduced (ADR-004 C2, AC1): declaration is still `config.yaml`
  // with `standalone: true`, the same mechanism Artifacts uses.
  const packagePortability = path.join(packageRoot, '_bmad', 'bme', '_portability');
  const portabilityConfigPath = path.join(packagePortability, 'config.yaml');

  let portabilityConfig = null;
  if (fs.existsSync(portabilityConfigPath)) {
    try {
      portabilityConfig = yaml.load(fs.readFileSync(portabilityConfigPath, 'utf8'));
    } catch (err) {
      const msg = `Portability config.yaml parse error: ${err.message} — skipping Portability installation`;
      changes.push(msg);
      if (verbose) console.log(`    ⚠ ${msg}`);
    }
  } else {
    changes.push('Portability config.yaml not found — skipping Portability installation');
    if (verbose) console.log('    ⚠ Portability config.yaml not found — skipping Portability installation');
  }

  if (portabilityConfig) {
    const targetPortability = path.join(projectRoot, '_bmad', 'bme', '_portability');

    if (!isSameRoot) {
      // As for Artifacts (T221). Portability had no install path before dist-2.6, and an unstamped
      // copy fails Convoke's own version-consistency check (I137).
      await refreshCopiedModule({
        packageDir: packagePortability, targetDir: targetPortability, removeFirst: true,
        moduleRel: '_bmad/bme/_portability/', label: 'Portability', version, changes, verbose,
      });
    } else {
      changes.push('Skipped Portability copy (dev environment — files already in place)');
      if (verbose) console.log('    Skipped Portability copy (dev environment)');
    }

    // Skill wrapper generation happens in section 6d-bis, after skillsDir is defined.
  }

  // 2d. Gyre module — copy agents, workflows, contracts, config
  const packageGyre = path.join(packageRoot, '_bmad', 'bme', '_gyre');
  const targetGyre = path.join(projectRoot, '_bmad', 'bme', '_gyre');

  if (fs.existsSync(packageGyre)) {
    // Copy Gyre agents
    const gyreAgentsSource = path.join(packageGyre, 'agents');
    const gyreAgentsTarget = path.join(targetGyre, 'agents');
    await fs.ensureDir(gyreAgentsTarget);

    if (!isSameRoot) {
      for (const file of GYRE_AGENT_FILES) {
        const agentId = file.replace(/\.md$/, '');
        if (gyreExcluded.includes(agentId)) {
          changes.push(`Skipped excluded Gyre agent: ${file}`);
          if (verbose) console.log(`    Skipped excluded Gyre agent: ${file}`);
          continue;
        }
        const src = path.join(gyreAgentsSource, file);
        if (fs.existsSync(src)) {
          await fs.copy(src, path.join(gyreAgentsTarget, file), { overwrite: true });
          changes.push(`Refreshed Gyre agent: ${file}`);
          if (verbose) console.log(`    Refreshed Gyre agent: ${file}`);
        }
      }
    } else {
      changes.push('Skipped Gyre agent copy (dev environment)');
      if (verbose) console.log('    Skipped Gyre agent copy (dev environment)');
    }

    // Copy Gyre workflows
    const gyreWorkflowsSource = path.join(packageGyre, 'workflows');
    const gyreWorkflowsTarget = path.join(targetGyre, 'workflows');
    await fs.ensureDir(gyreWorkflowsTarget);

    if (!isSameRoot) {
      for (const wf of GYRE_WORKFLOW_NAMES) {
        const src = path.join(gyreWorkflowsSource, wf);
        const dest = path.join(gyreWorkflowsTarget, wf);
        if (fs.existsSync(src)) {
          if (fs.existsSync(dest)) {
            await fs.remove(dest);
          }
          await fs.copy(src, dest, { overwrite: true });
          changes.push(`Refreshed Gyre workflow: ${wf}`);
          if (verbose) console.log(`    Refreshed Gyre workflow: ${wf}`);
        }
      }
    } else {
      changes.push('Skipped Gyre workflow copy (dev environment)');
      if (verbose) console.log('    Skipped Gyre workflow copy (dev environment)');
    }

    // Copy Gyre contracts
    const gyreContractsSource = path.join(packageGyre, 'contracts');
    const gyreContractsTarget = path.join(targetGyre, 'contracts');
    if (fs.existsSync(gyreContractsSource)) {
      await fs.ensureDir(gyreContractsTarget);
      if (!isSameRoot) {
        await fs.copy(gyreContractsSource, gyreContractsTarget, { overwrite: true });
        changes.push('Refreshed Gyre contracts');
        if (verbose) console.log('    Refreshed Gyre contracts');
      }
    }

    // Copy Gyre config.yaml
    const gyreConfigSource = path.join(packageGyre, 'config.yaml');
    const gyreConfigTarget = path.join(targetGyre, 'config.yaml');
    if (!isSameRoot && fs.existsSync(gyreConfigSource)) {
      // Merge Gyre config preserving user prefs, same as Vortex
      const gyreUpdates = {
        agents: GYRE_AGENT_IDS,
        workflows: GYRE_WORKFLOW_NAMES
      };
      assertVersion(version, 'config-merger:gyre'); // ag-7-1: defense-in-depth before mergeConfig
      const gyreConfigMerged = await configMerger.mergeConfig(gyreConfigTarget, version, gyreUpdates, { submodule: '_gyre' }); // fic-1-1 (BUG-22): without it Gyre got Vortex defaults and lists
      await configMerger.writeConfig(gyreConfigTarget, gyreConfigMerged);
      changes.push(`Updated Gyre config.yaml to v${version}`);
      if (verbose) console.log(`    Updated Gyre config.yaml to v${version}`);
    }

    // Copy Gyre README
    const gyreReadmeSource = path.join(packageGyre, 'README.md');
    const gyreReadmeTarget = path.join(targetGyre, 'README.md');
    if (!isSameRoot && fs.existsSync(gyreReadmeSource)) {
      await fs.copy(gyreReadmeSource, gyreReadmeTarget, { overwrite: true });
      changes.push('Refreshed Gyre README.md');
      if (verbose) console.log('    Refreshed Gyre README.md');
    }

    // 2d1. Gyre reference assets (T91) — the dangling half.
    //
    // `compass-routing-reference.md` ships and the phases above never copied it, while the README
    // that DOES install names it in its tree listing. So an operator reads a pointer to a file the
    // installer never created: T88's defect one module over, and an instance of the class T89 exists
    // to detect.
    //
    // NAMED, NOT SWEPT, and this row's own description asked for the opposite. It proposed applying
    // "a generic phase copying every `_gyre` root entry the enumerated phases do not own" — which is
    // the draft T88's review REJECTED, for two reasons that hold here unchanged. (1) It exceeds the
    // diagnosis: `config.yaml` is MERGED at the config step and `agents/` honours the U8 opt-out, so
    // a root sweep would overwrite a merged config and restore agent files an operator excluded.
    // (2) It would make correctness depend on a denylist of phase-owned entries staying in sync with
    // the phases above. A named list of package-owned assets cannot drift that way.
    const GYRE_REFERENCE_FILES = ['compass-routing-reference.md'];
    if (!isSameRoot) {
      for (const file of GYRE_REFERENCE_FILES) {
        const src = path.join(packageGyre, file);
        if (!fs.existsSync(src)) {
          changes.push(`Gyre ${file} not found in package — skipping`);
          if (verbose) console.log(`    ⚠ Gyre ${file} not found in package — skipping`);
          continue;
        }
        await fs.copy(src, path.join(targetGyre, file), { overwrite: true });
        changes.push(`Refreshed Gyre ${file}`);
        if (verbose) console.log(`    Refreshed Gyre ${file}`);
      }
    } else {
      changes.push('Skipped Gyre reference assets (dev environment — files already in place)');
      if (verbose) console.log('    Skipped Gyre reference assets (dev environment — files already in place)');
    }

    // 2d2. Gyre user guides (T91) — the asymmetry half.
    //
    // Vortex has had a guides phase since `refresh-installation.js` was created; Gyre never did, so five
    // shipped guides reached no project. `U8` added the EXCLUSION gate to the Vortex phase, not the phase
    // itself — an earlier version of this comment dated the phase to U8 and Round 1 disproved it.
    //
    // It mirrors the Vortex phase in both respects that make a guides phase different from a reference
    // copy, and for the same reasons:
    //   EXCLUSION-AWARE. A guide whose agent is in `excluded_agents` is dead docs.
    //   BACKUP-AWARE, AND DELIBERATELY NOT IDENTICAL TO VORTEX'S. A guide is operator-readable and may be
    //     annotated, so one the operator has CHANGED is preserved before being overwritten, honouring
    //     `backupGuides`. Vortex backs up whenever the destination exists, which writes a `.bak` of
    //     unmodified package text on every update; this phase backs up only what the operator changed.
    //     That divergence is the point rather than an oversight — see the condition below — and bringing
    //     Vortex into line is filed, not done here.
    //
    // DERIVED FROM THE SHIPPED DIRECTORY, NOT THE ROSTER, and that is Round 1's correction. The first
    // version built the list from `GYRE_AGENTS` plus a hardcoded `'GYRE-TEAM-GUIDE.md'`, so any further
    // non-per-agent document dropped into `guides/` would ship and never install — T91's own defect class,
    // one iteration later, in the code written to end it. Review reproduced it: a second team-level guide
    // was shipped and ignored with the suite green.
    //
    // Sweeping this directory is safe where sweeping the module ROOT is not (see `2d1`): a guide's own
    // content is preserved when the operator changed it, an operator-authored file that is not a shipped
    // guide is never touched, and the one subtree that must honour an opt-out is handled by subtracting
    // excluded agents' guides by name. One thing this does NOT manage, stated rather than implied: the
    // `.bak` files themselves. Nothing refreshes, prunes or reports on them, so they persist until the
    // operator removes them.
    const gyreGuidesSource = path.join(packageGyre, 'guides');
    const gyreGuidesTarget = path.join(targetGyre, 'guides');
    if (!isSameRoot && fs.existsSync(gyreGuidesSource)) {
      await fs.ensureDir(gyreGuidesTarget);

      const { install, skip } = gyreGuidePlan(gyreGuidesSource, gyreExcluded);
      for (const skipped of skip) {
        changes.push(`Skipped excluded Gyre guide: ${skipped}`);
        if (verbose) console.log(`    Skipped excluded Gyre guide: ${skipped}`);
      }

      for (const guide of install) {
        const src = path.join(gyreGuidesSource, guide);
        const dest = path.join(gyreGuidesTarget, guide);
        // BACK UP ONLY WHAT THE OPERATOR CHANGED, and this condition took three attempts to get right.
        //
        // The first version backed up whenever `dest` existed and overwrote any previous `.bak`. Round 1
        // showed that destroyed annotation N-1 when annotation N arrived. The second version kept the
        // FIRST `.bak` instead — and Round 2 measured that as a NET REGRESSION: the first ordinary
        // `convoke-update` after an install already makes a `.bak` of unmodified package text, which then
        // pins forever, so an annotation written after that update was lost from both files while the
        // report said `Kept existing … — not overwritten`. Worse than the defect it replaced, and it
        // needed only one annotation in the ordinary install-update-annotate order.
        //
        // Both versions asked the wrong question. A backup exists to preserve the OPERATOR's work, so the
        // condition is whether this file differs from the package text about to replace it — not whether
        // the file exists, and not whether a `.bak` already exists. Consequences, all intended:
        //   · nothing to lose, nothing written — a refresh that changes nothing produces no `.bak` at all,
        //     so repeated updates are idempotent instead of churning one `.bak` per guide per run;
        //   · the operator's MOST RECENT state is what survives, which is the one they would look for.
        const operatorText = fs.existsSync(dest) ? await fs.readFile(dest, 'utf8') : null;
        const packageText = await fs.readFile(src, 'utf8');
        if (backupGuides && operatorText !== null && operatorText !== packageText) {
          await fs.copy(dest, `${dest}.bak`, { overwrite: true });
          changes.push(`Backed up ${guide} → ${guide}.bak`);
          if (verbose) console.log(`    Backed up ${guide} → ${guide}.bak`);
        }
        if (operatorText === packageText) continue;   // already current; nothing to write or report
        await fs.copy(src, dest, { overwrite: true });
        changes.push(`Refreshed Gyre guide: ${guide}`);
        if (verbose) console.log(`    Refreshed Gyre guide: ${guide}`);
      }
    } else if (isSameRoot) {
      // Reported, like every other phase's dev-environment branch. Round 1: this was the only phase
      // without one, so a dev reading the report saw Vortex's line and assumed it covered Gyre too.
      changes.push('Skipped Gyre guides (dev environment — files already in place)');
      if (verbose) console.log('    Skipped Gyre guides (dev environment — files already in place)');
    } else {
      changes.push('Gyre guides/ not found in package — skipping');
      if (verbose) console.log('    ⚠ Gyre guides/ not found in package — skipping');
    }
  }

  // 2e. Seed skill-manifest.csv if the project has none.
  //
  // Backlog I139. `convoke-export` is a shipped bin that reads every skill's content from the
  // `path` column of `_bmad/_config/skill-manifest.csv`. That file was never created by an
  // install and `_bmad/_config/` was not in package.json `files`, so on a clean install the bin
  // failed outright:
  //
  //   ❌ bmad-brainstorming — ENOENT: ... <project>/_bmad/_config/skill-manifest.csv
  //
  // Every export by every new user failed. `convoke-doctor` only ever reported it as a ⚠ and
  // still exited 0, and `--help` succeeded, so both the health check and a launch smoke called
  // the product healthy — it took invoking real work to see it.
  //
  // WHY FILTERED, NOT COPIED VERBATIM. The package's manifest is a CANDIDATE list of 106 rows,
  // but only 19 point at content Convoke actually ships (`_bmad/bme/**`); the other 87 point at
  // upstream BMAD modules (bmm, core, wds, tea, cis, bmb) that the user gets from BMAD itself,
  // if they have it. Shipping all 106 verbatim would hand every user a manifest where most rows
  // resolve to nothing — the exact trap backlog I123 documents, where 75 of 106 paths failed to
  // resolve even inside this repo. Filtering on "does this path exist in the user's project"
  // is ground truth: it keeps the Convoke rows always, and upstream rows exactly when the user
  // has that content installed.
  //
  // Only ever seeds when ABSENT. An existing manifest is user state — it may carry rows they
  // added — and is left untouched; the Enhance/Artifacts registration blocks below append to it.
  const skillManifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  // Seed when the manifest is ABSENT **or UNUSABLE**, not merely absent.
  //
  // Code review 2026-08-14 asked whether "absent" was the right trigger. It was not, and the
  // failure is worse than being stuck: `fs.existsSync` is true for a 0-byte file, so an empty or
  // truncated manifest was never reseeded — and section 6c below then APPENDS the Enhance row to
  // it. `readManifest` treats line 0 as the header, so that appended data row became the header:
  // garbage columns, zero rows, and `convoke-export` throwing "not in the manifest" forever.
  // Verified by execution before this guard was widened.
  //
  // Usable means: parses, and has the `path` column the exporter reads. A manifest that parses
  // with a valid header is USER STATE and is never overwritten, however few rows it has.
  let manifestUsable = false;
  if (fs.existsSync(skillManifestPath)) {
    try {
      const { readManifest } = require('../../portability/manifest-csv');
      const existing = readManifest(skillManifestPath);
      manifestUsable = Array.isArray(existing.header) && existing.header.includes('path');
    } catch {
      manifestUsable = false; // unparseable — treat as unusable and reseed
    }
    if (!manifestUsable) {
      const salvage = `${skillManifestPath}.corrupt-${version}`;
      try {
        // Never delete user data silently, even when it is unusable (path-safety rule).
        fs.renameSync(skillManifestPath, salvage);
        changes.push(`Unusable skill-manifest.csv set aside as ${path.basename(salvage)}`);
        if (verbose) console.log(`    Unusable skill-manifest.csv → ${path.basename(salvage)}`);
      } catch (err) {
        console.warn(`    Warning: could not set aside unusable skill-manifest.csv: ${err.message}`);
      }
    }
  }
  if (!manifestUsable) {
    const packageManifest = path.join(packageRoot, '_bmad', '_config', 'skill-manifest.csv');
    if (fs.existsSync(packageManifest)) {
      try {
        const { parseCsvRow, readManifest } = require('../../portability/manifest-csv');
        const { header } = readManifest(packageManifest);
        const pathIdx = header.indexOf('path');
        if (pathIdx < 0) throw new Error('package skill-manifest.csv has no `path` column');

        // Filter the package manifest's RAW LINES rather than re-serialising parsed rows.
        //
        // `writeManifest` -> `formatCsvField` only quotes a field when it contains a comma, quote
        // or newline, so re-serialising emitted bare `bmad-enhance-initiatives-backlog` where the
        // source file has `"bmad-enhance-initiatives-backlog"`. Section 6c below decides whether
        // to append that row with `skCsv.includes('"' + canonicalId + '"')` — a QUOTED substring
        // match — which then missed the seeded row and appended a DUPLICATE. Caught by inspecting
        // a seeded manifest, not by any test.
        //
        // Keeping the original lines byte-for-byte sidesteps it and preserves the file's existing
        // quoting convention. (The substring-based dedup in 6c is fragile in its own right; that
        // is pre-existing and left alone here.)
        const rawLines = fs.readFileSync(packageManifest, 'utf8').split('\n');
        const headerLine = rawLines[0];
        const dataLines = rawLines.slice(1).filter((l) => l.trim());
        const projectRootResolved = path.resolve(projectRoot);
        const kept = dataLines.filter((line) => {
          const cells = parseCsvRow(line);
          return manifestRowSeeds(cells[pathIdx], projectRootResolved);
        });
        await fs.ensureDir(path.dirname(skillManifestPath));
        fs.writeFileSync(skillManifestPath, [headerLine, ...kept].join('\n') + '\n', 'utf8');
        changes.push(
          `Created _bmad/_config/skill-manifest.csv (${kept.length} of ${dataLines.length} skills — rows whose content is present)`
        );
        if (verbose) {
          console.log(`    Created skill-manifest.csv (${kept.length}/${dataLines.length} skills present)`);
        }
      } catch (err) {
        // Non-fatal: a failure here costs `convoke-export`, not the install. Not pushed into
        // `changes` — convoke-update renders that array as green ticks.
        console.warn(`    Warning: could not seed skill-manifest.csv: ${err.message}`);
      }
    }
  }

  // 3. Update config.yaml (merge, preserving user prefs)
  //
  // T50: guarded by `!isSameRoot`, like every other module config write in this file
  // (Gyre, Enhance, Artifacts, standalone submodules). Vortex was the ONLY unguarded one,
  // so in a dev tree — where packageRoot === projectRoot — a refresh rewrote the repo's own
  // shipped `_bmad/bme/_vortex/config.yaml`.
  //
  // That is how the test suite dirtied a tracked file on every run. FIVE call sites pass
  // PACKAGE_ROOT deliberately, to exercise the dev-environment skip branches, and this write sat
  // outside those branches:
  //   tests/unit/refresh-installation-enhance.test.js:76, :232, :302
  //   tests/unit/refresh-installation-artifacts.test.js:74, :178
  // The stamped value was then committed release after release under bare "Update config.yaml"
  // commits — at least 3.2.0, 3.2.1, 3.3.0, 4.0.0-rc.1, 4.0.0-rc.2, 4.0.0-rc.5 and 4.0.0 (the
  // list is what `git log -L` surfaces for the version line; earlier releases may also qualify).
  // That history made the field look like it tracked the package version by design rather than
  // by accident.
  //
  // A REAL installation is unaffected (projectRoot !== packageRoot): the stamp still runs and
  // convoke-doctor's Version-consistency check still passes on the user's tree. A dev tree
  // reports that check as failing either way — _gyre, _enhance, _artifacts and _team-factory
  // all sit at template 1.0.0 there, by construction.
  if (!isSameRoot) {
    const configPath = path.join(targetVortex, 'config.yaml');
    await fs.ensureDir(path.dirname(configPath));

    const updates = {
      agents: AGENT_IDS,
      workflows: WORKFLOW_NAMES
    };

    assertVersion(version, 'config-merger:vortex'); // ag-7-1: defense-in-depth before mergeConfig
    const merged = await configMerger.mergeConfig(configPath, version, updates, { submodule: '_vortex' });
    await configMerger.writeConfig(configPath, merged);
    changes.push(`Updated config.yaml to v${version}`);
    if (verbose) console.log(`    Updated config.yaml to v${version}`);
  } else {
    changes.push('Skipped Vortex config stamp (dev environment — source is the installation)');
    if (verbose) console.log('    Skipped Vortex config stamp (dev environment)');
  }

  // 4. Regenerate agent manifest — replace only bme rows, preserve other modules.
  // Story gen-1.1: lifted verbatim into scripts/lib/agent-manifest-generator.js so
  // generation has a deliberate caller (`npm run generate:manifest`) instead of
  // firing as a side effect of every refreshInstallation() the test suite makes.
  // `excluded` is passed rather than re-read — both lists were already read at
  // :47-50 for the copy loops.
  // The write is guarded on `!isSameRoot` for the same reason every other write in
  // this function is: when source and destination are the same tree, refreshing is
  // rewriting our own tracked source. Six live callers pass PACKAGE_ROOT from the
  // test suite, so before this guard `npm test` rewrote agent-manifest.csv. The
  // regeneration a dev tree still needs comes from `npm run generate:manifest`
  // (scripts/generate-manifest.js) — guard and command ship together by design;
  // the guard alone would leave a checkout unable to rebuild the file.
  if (!isSameRoot) {
    changes.push(
      await generateAgentManifest(projectRoot, {
        excluded: { vortex: vortexExcluded, gyre: gyreExcluded },
      })
    );
    if (verbose) console.log(`    ${MANIFEST_CHANGE_MESSAGE}`);
  } else {
    changes.push(MANIFEST_SKIP_MESSAGE);
    if (verbose) console.log(`    ${MANIFEST_SKIP_MESSAGE}`);
  }

  // 5. Copy user guides (with optional backup)
  const guidesSource = path.join(packageRoot, '_bmad', 'bme', '_vortex', 'guides');
  const guidesTarget = path.join(projectRoot, '_bmad', 'bme', '_vortex', 'guides');
  await fs.ensureDir(guidesTarget);

  if (!isSameRoot) {
    // U8: user guides are named after each agent (e.g., NOAH-USER-GUIDE.md). Iterate
    // AGENTS so we can match guides to agent IDs and skip excluded ones — a guide
    // without its agent is dead docs.
    for (const agent of AGENTS) {
      const guide = `${agent.name.toUpperCase()}-USER-GUIDE.md`;
      if (vortexExcluded.includes(agent.id)) {
        changes.push(`Skipped excluded guide: ${guide}`);
        if (verbose) console.log(`    Skipped excluded guide: ${guide}`);
        continue;
      }
      const src = path.join(guidesSource, guide);
      const dest = path.join(guidesTarget, guide);

      if (fs.existsSync(src)) {
        // Backup existing guide before overwriting
        if (backupGuides && fs.existsSync(dest)) {
          await fs.copy(dest, dest + '.bak', { overwrite: true });
          changes.push(`Backed up ${guide} → ${guide}.bak`);
          if (verbose) console.log(`    Backed up ${guide} → ${guide}.bak`);
        }

        await fs.copy(src, dest, { overwrite: true });
        changes.push(`Refreshed guide: ${guide}`);
        if (verbose) console.log(`    Refreshed guide: ${guide}`);
      }
    }
  } else {
    changes.push('Skipped guide copy (dev environment — files already in place)');
    if (verbose) console.log('    Skipped guide copy (dev environment)');
  }

  // 6. Clean up legacy .claude/commands/ and generate .claude/skills/ for each agent
  const commandsDir = path.join(projectRoot, '.claude', 'commands');
  if (fs.existsSync(commandsDir)) {
    const legacyCommands = (await fs.readdir(commandsDir)).filter(f => f.startsWith('bmad-agent-bme-'));
    for (const file of legacyCommands) {
      await fs.remove(path.join(commandsDir, file));
      changes.push(`Removed legacy command: ${file}`);
      if (verbose) console.log(`    Removed legacy command: ${file}`);
    }
  }

  const skillsDir = path.join(projectRoot, '.claude', 'skills');

  // T252: the wrapper phases from here to 6e copy a wrapper aside before removing or rewriting it,
  // and skip it when the copy cannot be made. See `preserveOperatorWrapper`.
  const wrapperCtx = { backupRoot: path.join(projectRoot, WRAPPER_BACKUP_REL), changes, verbose };

  // Every agent-wrapper name Convoke has generated: the two rosters, excluded or not, plus the
  // retired ids. A `bmad-agent-bme-*` name outside this set was never Convoke's.
  const ownedSkillDirs = new Set(
    [...AGENTS.map(a => a.id), ...GYRE_AGENTS.map(a => a.id), ...RETIRED_WRAPPER_IDS].map(id => `bmad-agent-bme-${id}`)
  );

  // An owned name stored under another CASE. On a case-insensitive filesystem `Bmad-Agent-Bme-X`
  // IS the directory the loops below write to, while `readdir` and `pathPresent` in
  // `agent-install-checks.js` see only the spelling on disk. Left alone, the loop rewrites it, the
  // sweep calls it foreign, and verification reports the wrapper missing on every run. Renaming it
  // to the owned spelling makes all three agree. Where the two spellings are different
  // directories (a case-sensitive filesystem) the inode test fails and nothing is renamed.
  if (fs.existsSync(skillsDir)) {
    const ownedByLowerCase = new Map([...ownedSkillDirs].map(n => [n.toLowerCase(), n]));
    for (const entry of await fs.readdir(skillsDir)) {
      const owned = ownedByLowerCase.get(entry.toLowerCase());
      if (!owned || owned === entry) continue;
      if (!isSameDirectoryEntry(path.join(skillsDir, entry), path.join(skillsDir, owned))) continue;
      await fs.rename(path.join(skillsDir, entry), path.join(skillsDir, owned));
      changes.push(`Renamed skill directory ${entry} → ${owned}`);
      if (verbose) console.log(`    Renamed skill directory ${entry} → ${owned}`);
    }
  }

  // What this run WOULD generate for each excluded agent, keyed by wrapper name. The stale sweep
  // after the two loops compares a wrapper it is about to remove against this text, so excluding
  // an agent removes Convoke's own wrapper quietly and backs up anything else found at that name.
  const excludedWrapperText = new Map();

  for (const agent of AGENTS) {
    const skillDir = path.join(skillsDir, `bmad-agent-bme-${agent.id}`);
    // Story v63-3-1 / AC9: LOAD path points at the migrated skill-dir
    // (`<id>/SKILL.md`), NOT the pre-4.0 flat `<id>.md`. This is the
    // critical runtime contract for existing operators upgrading from 3.x.
    const content = `---
name: bmad-agent-bme-${agent.id}
description: ${agent.id} agent
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bme/_vortex/agents/${agent.id}/SKILL.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. FOLLOW the activation steps precisely
4. DISPLAY the welcome/greeting as instructed
5. PRESENT the numbered menu
6. WAIT for user input before proceeding
</agent-activation>
`;
    if (vortexExcluded.includes(agent.id)) {
      excludedWrapperText.set(path.basename(skillDir), content);
      continue;
    }
    if (!preserveOperatorWrapper(skillsDir, path.basename(skillDir), content, { ...wrapperCtx, textOnly: true, writesThrough: true })) continue;
    await fs.ensureDir(skillDir);
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf8');
    changes.push(`Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
    if (verbose) console.log(`    Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
  }

  // 6b. Generate .claude/skills/ for Gyre agents
  for (const agent of GYRE_AGENTS) {
    const skillDir = path.join(skillsDir, `bmad-agent-bme-${agent.id}`);
    const content = `---
name: bmad-agent-bme-${agent.id}
description: ${agent.id} agent
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bme/_gyre/agents/${agent.id}.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. FOLLOW the activation steps precisely
4. DISPLAY the welcome/greeting as instructed
5. PRESENT the numbered menu
6. WAIT for user input before proceeding
</agent-activation>
`;
    if (gyreExcluded.includes(agent.id)) {
      excludedWrapperText.set(path.basename(skillDir), content);
      continue;
    }
    if (!preserveOperatorWrapper(skillsDir, path.basename(skillDir), content, { ...wrapperCtx, textOnly: true, writesThrough: true })) continue;
    await fs.ensureDir(skillDir);
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf8');
    changes.push(`Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
    if (verbose) console.log(`    Refreshed skill: bmad-agent-bme-${agent.id}/SKILL.md`);
  }

  // Remove stale agent wrappers: agents the operator excluded, and agents Convoke has retired.
  // U8: excluded agents are omitted from the current set so their wrappers are removed here, and
  // re-inclusion regenerates them above. T251's `absent` check depends on that removal.
  //
  // T252 narrowed what "stale" means. This used to remove EVERY `bmad-agent-bme-*` entry not in
  // the current set, which deleted an operator's own `bmad-agent-bme-acme-reviewer`. The prefix
  // is not proof of authorship; a name Convoke shipped is. So a name outside `ownedSkillDirs` is
  // left in place and reported, and an owned one is copied aside first when its content differs
  // from the wrapper this run would have generated for it.
  //
  // It runs AFTER the two loops because that generated text is only known once they have run.
  const currentSkillDirs = new Set([
    ...AGENTS.filter(a => !vortexExcluded.includes(a.id)).map(a => `bmad-agent-bme-${a.id}`),
    ...GYRE_AGENTS.filter(a => !gyreExcluded.includes(a.id)).map(a => `bmad-agent-bme-${a.id}`),
  ]);
  if (fs.existsSync(skillsDir)) {
    const existingSkills = (await fs.readdir(skillsDir)).filter(d => d.startsWith('bmad-agent-bme-'));
    for (const dir of existingSkills) {
      if (currentSkillDirs.has(dir)) continue;
      if (!ownedSkillDirs.has(dir)) {
        reportForeignWrapper(dir);
        continue;
      }
      if (!preserveOperatorWrapper(skillsDir, dir, excludedWrapperText.get(dir), wrapperCtx)) continue;
      await fs.remove(path.join(skillsDir, dir));
      changes.push(`Removed stale skill: ${dir}`);
      if (verbose) console.log(`    Removed stale skill: ${dir}`);
    }
  }

  // 6b1. REMOVED by story tfu-1-1 (2026-09-29) — skill wrappers for standalone bme agents.
  //
  // ⚠ This block held the THIRD of three `const content = \`` wrapper templates that
  // `scripts/audit/agent-surface-parity.js` extracts from this file and compares against the
  // committed `.github/expected-wrapper-template.txt`. Deleting it takes the extraction from three
  // templates to two, so that baseline is regenerated in the same change (story AC#14). The gate is
  // in `publish.needs`, so a stale baseline blocks release rather than merely reddening a push.

  // 6c. Copy Enhance workflow skill wrappers and register in manifests
  if (enhanceConfig && !isSameRoot) {
    for (const workflow of enhanceConfig.workflows || []) {
      const canonicalId = `bmad-enhance-${workflow.name}`;
      const skillDir = path.join(skillsDir, canonicalId);
      await fs.ensureDir(skillDir);

      // Copy source SKILL.md from package (shipped via npm, not generated)
      const sourceSkillPath = path.join(packageRoot, '_bmad', 'bme', '_enhance', 'workflows', workflow.name, 'SKILL.md');
      const targetSkillPath = path.join(skillDir, 'SKILL.md');
      // Only the copy is skipped when the wrapper could not be set aside; the menu patch and
      // manifest rows below do not touch it.
      if (preserveOperatorWrapper(skillsDir, canonicalId, fs.readFileSync(sourceSkillPath, 'utf8'), { ...wrapperCtx, textOnly: true })) {
        await fs.copy(sourceSkillPath, targetSkillPath, { overwrite: true });
        changes.push(`Refreshed Enhance skill: ${canonicalId}/SKILL.md`);
        if (verbose) console.log(`    Refreshed Enhance skill: ${canonicalId}/SKILL.md`);
      }

      // Append to workflow-manifest.csv if not already present
      const wfManifestPath = path.join(projectRoot, '_bmad', '_config', 'workflow-manifest.csv');
      if (fs.existsSync(wfManifestPath)) {
        const wfCsv = fs.readFileSync(wfManifestPath, 'utf8');
        if (!wfCsv.includes(`"${canonicalId}"`)) {
          const wfRow = `\n"${workflow.name}","Manage RICE initiatives backlog — triage review findings, rescore existing items, or bootstrap new backlogs.","bme","_bmad/bme/_enhance/${workflow.entry}","${canonicalId}"`;
          fs.appendFileSync(wfManifestPath, wfRow, 'utf8');
          changes.push(`Added ${canonicalId} to workflow-manifest.csv`);
          if (verbose) console.log(`    Added ${canonicalId} to workflow-manifest.csv`);
        }
      } else {
        if (verbose) console.log('    ⚠ workflow-manifest.csv not found — skipping manifest registration');
      }

      // Append to skill-manifest.csv if not already present
      const skManifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
      if (fs.existsSync(skManifestPath)) {
        const skCsv = fs.readFileSync(skManifestPath, 'utf8');
        if (!skCsv.includes(`"${canonicalId}"`)) {
          const skRow = `\n"${canonicalId}","${canonicalId}","Manage RICE initiatives backlog — triage review findings, rescore existing items, or bootstrap new backlogs.","bme","_bmad/bme/_enhance/workflows/${workflow.name}/SKILL.md","true",,,`;
          fs.appendFileSync(skManifestPath, skRow, 'utf8');
          changes.push(`Added ${canonicalId} to skill-manifest.csv`);
          if (verbose) console.log(`    Added ${canonicalId} to skill-manifest.csv`);
        }
      } else {
        if (verbose) console.log('    ⚠ skill-manifest.csv not found — skipping manifest registration');
      }
    }
  } else if (enhanceConfig && isSameRoot) {
    changes.push('Skipped Enhance skill registration (dev environment — source files unchanged)');
    if (verbose) console.log('    Skipped Enhance skill registration (dev environment)');
  }

  // 6d. Copy Artifacts workflow skill wrappers (Story 6.6)
  // Each standalone:true workflow gets a skill wrapper at .claude/skills/{workflow.name}/SKILL.md.
  // workflow.name already carries the bmad- prefix, so we use it verbatim (unlike Enhance which
  // synthesizes bmad-enhance-${workflow.name}). The remove-then-copy pattern clears any leftover
  // files from prior installs (e.g., the obsolete bmad-portfolio-status/workflow.md thin wrapper).
  if (artifactsConfig && !isSameRoot) {
    for (const workflow of artifactsConfig.workflows || []) {
      if (workflow.standalone !== true) {
        const msg = `Artifacts: workflow ${workflow.name} has no standalone:true flag — only standalone workflows are supported, skipping`;
        changes.push(msg);
        if (verbose) console.log(`    ⚠ ${msg}`);
        continue;
      }

      const destSkillDir = path.join(skillsDir, workflow.name);
      const sourceSkillPath = path.join(packageRoot, '_bmad', 'bme', '_artifacts', 'workflows', workflow.name, 'SKILL.md');
      // T252: the removal below takes every file in the directory with it, so a directory that
      // is not the shipped SKILL.md alone is copied aside first.
      if (!preserveOperatorWrapper(
        skillsDir, workflow.name,
        fs.existsSync(sourceSkillPath) ? fs.readFileSync(sourceSkillPath, 'utf8') : undefined,
        wrapperCtx
      )) continue;

      // Remove the destination directory first to clear leftover files from prior installs
      if (fs.existsSync(destSkillDir)) {
        await fs.remove(destSkillDir);
      }
      await fs.ensureDir(destSkillDir);

      // Copy source SKILL.md from the package (the SKILL.md uses an absolute {project-root}
      // path to load workflow.md, so workflow.md does NOT need to be co-located).
      const targetSkillPath = path.join(destSkillDir, 'SKILL.md');
      if (fs.existsSync(sourceSkillPath)) {
        await fs.copy(sourceSkillPath, targetSkillPath, { overwrite: true });
        changes.push(`Generated skill wrapper: ${workflow.name}`);
        if (verbose) console.log(`    Generated skill wrapper: ${workflow.name}`);
      } else {
        const msg = `Artifacts: source SKILL.md not found for ${workflow.name} at ${sourceSkillPath}`;
        changes.push(msg);
        if (verbose) console.log(`    ⚠ ${msg}`);
      }
    }
  } else if (artifactsConfig && isSameRoot) {
    changes.push('Skipped Artifacts skill wrapper generation (dev environment — source files unchanged)');
    if (verbose) console.log('    Skipped Artifacts skill wrapper generation (dev environment)');
  }

  // 6d-bis. Copy Portability workflow skill wrappers (Story dist-2.6)
  // Mirrors 6d. workflow.name already carries the bmad- prefix, so it is used verbatim.
  // The source SKILL.md loads its workflow by an ABSOLUTE {project-root} path — rewritten from a
  // relative [workflow.md](workflow.md) by this story — because the generator copies SKILL.md
  // ALONE. A relative link would resolve inside .claude/skills/<name>/, where no workflow.md
  // exists, and every wrapper would point at a file that is not there.
  if (portabilityConfig && !isSameRoot) {
    for (const workflow of portabilityConfig.workflows || []) {
      if (workflow.standalone !== true) {
        const msg = `Portability: workflow ${workflow.name} has no standalone:true flag — only standalone workflows are supported, skipping`;
        changes.push(msg);
        if (verbose) console.log(`    ⚠ ${msg}`);
        continue;
      }

      const destSkillDir = path.join(skillsDir, workflow.name);
      const sourceSkillPath = path.join(packageRoot, '_bmad', 'bme', '_portability', 'workflows', workflow.name, 'SKILL.md');
      // T252: the removal below takes every file in the directory with it, so a directory that
      // is not the shipped SKILL.md alone is copied aside first.
      if (!preserveOperatorWrapper(
        skillsDir, workflow.name,
        fs.existsSync(sourceSkillPath) ? fs.readFileSync(sourceSkillPath, 'utf8') : undefined,
        wrapperCtx
      )) continue;

      if (fs.existsSync(destSkillDir)) {
        await fs.remove(destSkillDir);
      }
      await fs.ensureDir(destSkillDir);

      const targetSkillPath = path.join(destSkillDir, 'SKILL.md');
      if (fs.existsSync(sourceSkillPath)) {
        await fs.copy(sourceSkillPath, targetSkillPath, { overwrite: true });
        changes.push(`Generated skill wrapper: ${workflow.name}`);
        if (verbose) console.log(`    Generated skill wrapper: ${workflow.name}`);
      } else {
        const msg = `Portability: source SKILL.md not found for ${workflow.name} at ${sourceSkillPath}`;
        changes.push(msg);
        if (verbose) console.log(`    ⚠ ${msg}`);
      }
    }
  } else if (portabilityConfig && isSameRoot) {
    changes.push('Skipped Portability skill wrapper generation (dev environment — source files unchanged)');
    if (verbose) console.log('    Skipped Portability skill wrapper generation (dev environment)');
  }

  // 6e. Orphan workflow-wrapper cleanup (Story 7.4, I32)
  // See `cleanupOrphanWorkflowWrappers` for what is removed and what is only reported.
  if (!isSameRoot) {
    const currentWorkflowWrappers = new Set();
    // Enhance wrappers: bmad-enhance-${workflow.name}
    if (enhanceConfig && Array.isArray(enhanceConfig.workflows)) {
      for (const wf of enhanceConfig.workflows) {
        if (wf && wf.name) currentWorkflowWrappers.add(`bmad-enhance-${wf.name}`);
      }
    }
    // Artifacts wrappers: workflow.name verbatim (only standalone:true are installed,
    // but we track ALL names so a removed standalone workflow is still recognized as an orphan)
    // Renamed from knownArtifactsNames (Story dist-2.6): Portability declares its workflows the
    // same way and its wrappers carry the same verbatim naming, so it belongs in this set on the
    // same footing. Before this the four portability wrappers were safe from Strategy 2 only BY
    // ACCIDENT -- their names matched no known Artifacts workflow -- and a workflow later removed
    // from portability's config.yaml would have been stranded rather than cleaned.
    const knownVerbatimNames = new Set(RETIRED_VERBATIM_WRAPPERS);
    for (const cfg of [artifactsConfig, portabilityConfig]) {
      if (cfg && Array.isArray(cfg.workflows)) {
        for (const wf of cfg.workflows) {
          if (wf && wf.name) {
            knownVerbatimNames.add(wf.name);
            if (wf.standalone === true) currentWorkflowWrappers.add(wf.name);
          }
        }
      }
    }
    const orphanChanges = cleanupOrphanWorkflowWrappers(skillsDir, currentWorkflowWrappers, knownVerbatimNames, { verbose, backupRoot: wrapperCtx.backupRoot });
    changes.push(...orphanChanges);
  } else {
    changes.push('Skipped orphan workflow-wrapper cleanup (dev environment)');
    if (verbose) console.log('    Skipped orphan workflow-wrapper cleanup (dev environment)');
  }

  // 7. Generate agent customize files (only if they don't already exist)
  const customizeDir = path.join(projectRoot, '_bmad', '_config', 'agents');
  await fs.ensureDir(customizeDir);

  const CUSTOMIZE_TEMPLATE = `# Agent Customization
# Customize any section below - all are optional

# Override agent name
agent:
  metadata:
    name: ""

# Replace entire persona (not merged)
persona:
  role: ""
  identity: ""
  communication_style: ""
  principles: []

# Add custom critical actions (appended after standard config loading)
critical_actions: []

# Add persistent memories for the agent
memories: []

# Add custom menu items (appended to base menu)
menu: []

# Add custom prompts (for action="#id" handlers)
prompts: []
`;

  for (const agent of [...AGENTS, ...GYRE_AGENTS]) {
    const filename = `bme-${agent.name.toLowerCase()}.customize.yaml`;
    const filePath = path.join(customizeDir, filename);
    if (!fs.existsSync(filePath)) {
      await fs.writeFile(filePath, CUSTOMIZE_TEMPLATE, 'utf8');
      changes.push(`Created customize file: ${filename}`);
      if (verbose) console.log(`    Created customize file: ${filename}`);
    }
  }

  // Seed / merge the artifact-governance taxonomy.
  //
  // Backlog I137. `mergeTaxonomy` was reachable ONLY from the 2.0.x->3.1.0 and 3.0.x->3.1.0
  // migrations. A fresh install runs no migrations, so `_bmad/_config/taxonomy.yaml` was never
  // created and a clean install failed its own health check:
  //
  //   ✗ Taxonomy: file exists — taxonomy.yaml not found at _bmad/_config/taxonomy.yaml
  //     Fix: Run convoke-migrate-artifacts or convoke-update to create it
  //
  // Taxonomy creation lived on the UPGRADE path but not the INSTALL path. Calling it here covers
  // both: it is idempotent by construction — creates from platform defaults when absent, and
  // otherwise merges while preserving the operator-managed `initiatives.user` list.
  try {
    const { mergeTaxonomy } = require('./taxonomy-merger');
    const taxonomyResult = await mergeTaxonomy(projectRoot);
    if (taxonomyResult.created) {
      changes.push('Created _bmad/_config/taxonomy.yaml (platform defaults)');
      if (verbose) console.log('    Created _bmad/_config/taxonomy.yaml');
    } else if (taxonomyResult.merged) {
      changes.push('Merged platform defaults into _bmad/_config/taxonomy.yaml');
      if (verbose) console.log('    Merged _bmad/_config/taxonomy.yaml');
    }
  } catch (err) {
    // Non-fatal: a broken taxonomy must not abort an otherwise-good install. `convoke-doctor`
    // reports the missing file, which is the same signal the operator had before this call
    // existed — so the worst case is the previous behaviour, not a failed install.
    // Deliberately NOT pushed into `changes`: convoke-update renders every entry of that array
    // as `chalk.green('  ✓ ' + change)`, so a warning string there would print with a green tick
    // — a failure disguised as a success. Code review 2026-08-14 (I137). Always warn, not just
    // in verbose mode: this is the only signal the operator gets.
    console.warn(`    Warning: could not seed taxonomy.yaml: ${err.message}`);
  }

  // dist-2-5 / BUG-19: create the BMM governance registry so the doctor stops reporting a
  // file nothing ever made. Header only — see `seedBmmDependencies` for why seeding SCAN
  // ROWS here is wrong, and what it broke when it was tried.
  try {
    const depsResult = seedBmmDependencies(projectRoot, { isSameRoot, verbose });
    if (depsResult.seeded) {
      changes.push('Created _bmad/_config/bmm-dependencies.csv (empty registry)');
    }
  } catch (err) {
    // Non-fatal, for the same reason the taxonomy seed above is non-fatal: a failed seed
    // must not abort an otherwise-good install. The worst case is the pre-dist-2-5
    // behaviour — doctor reports the registry missing and names the command that fixes it.
    // Deliberately NOT pushed into `changes`: convoke-update renders every entry there with
    // a green tick, so a warning string would print as a success.
    console.warn(`    Warning: could not seed bmm-dependencies.csv: ${err.message}`);
  }

  return changes;
}

/**
 * Does one manifest row's `path` seed into a project rooted at `projectRootResolved`?
 *
 * THE SEEDING PREDICATE, and the single definition of it. The package's `skill-manifest.csv` is a
 * CANDIDATE list — see the long comment at the seeding block above — and this is the filter that
 * turns candidates into the set an operator actually receives.
 *
 * EXTRACTED AND EXPORTED BY STORY dist-2-8 so the classification ratchet can validate the same set
 * the installer seeds, using this function rather than a reimplementation of it. A second copy
 * would let the test and the installer drift into disagreeing about what ships, which is precisely
 * the failure the ratchet exists to detect — a check that is confident about the wrong tree.
 *
 * Two guards, both deliberate and both load-bearing:
 *  - **Containment before existence.** `path.join` does NOT neutralise `..`, so a row naming
 *    `../../etc/passwd` would resolve outside the project — and `export-engine.loadSkillSource`
 *    reads whatever `path` names straight into an exported bundle the user may share. The input is
 *    Convoke's own manifest today, so this is defence in depth rather than a live hole (code
 *    review 2026-08-14, LOW).
 *  - **`isFile`, not `existsSync`.** A directory satisfies `existsSync` and then makes the
 *    exporter throw EISDIR later.
 *
 * WHAT THE GUARDS DO **NOT** COVER, listed because this function is now exported and read by a
 * test as well as the installer, and an undisclosed limit in a shared predicate is worse than one
 * in a private block (Round 1 review, dist-2-8):
 *  - **Symlinks.** Containment is LEXICAL: `path.resolve` collapses `..` textually, and `statSync`
 *    then FOLLOWS symlinks. A `path` cell naming a symlink that sits inside the project but points
 *    outside it passes both guards — reproduced by review against `/etc/passwd`. A `realpathSync`
 *    check would close it. Not closed here because the manifest is first-party content today and
 *    this story did not open that question; it is the same symlink-containment class already filed
 *    from `dist-2-2` Round 3 against `shipped-links.js`, and belongs with it.
 *  - **Case sensitivity.** A mis-cased `path` seeds on a case-insensitive filesystem (macOS,
 *    Windows) and does not on a case-sensitive CI runner, so the predicate can disagree between a
 *    developer's machine and CI.
 *
 * @param {string|undefined} rel - the row's `path` cell, relative to the project root
 * @param {string} projectRootResolved - an already-`path.resolve`d project root
 * @returns {boolean} true when the row's content is present and inside the project
 */
function manifestRowSeeds(rel, projectRootResolved) {
  // `typeof`, not just falsy: a truthy non-string (a number, an object from a malformed parse)
  // makes `path.resolve` throw a TypeError, and this runs outside the caller's try/catch. Round 1.
  if (typeof rel !== 'string' || !rel) return false;
  const abs = path.resolve(projectRootResolved, rel);
  if (abs !== projectRootResolved && !abs.startsWith(projectRootResolved + path.sep)) {
    return false;
  }
  try {
    return fs.statSync(abs).isFile();
  } catch {
    return false;
  }
}

// Workflow wrappers Convoke generated under their verbatim name and no longer does. A module config
// lists only what it installs now, so a name dropped from it would otherwise be unknown to
// `cleanupOrphanWorkflowWrappers` and its wrapper stranded in every project that has it. T255 withdrew
// the three catalog-publishing workflows from `_portability/config.yaml`; they are listed here so the
// next refresh removes their wrappers. Strategy 2 has no expected text to compare against, so each one is
// copied aside first whether or not it was edited (T252) -- one copy per project, made once.
const RETIRED_VERBATIM_WRAPPERS = ['bmad-generate-catalog', 'bmad-seed-catalog', 'bmad-validate-exports'];

// Where a wrapper is copied before the refresh removes or rewrites it (T252). Under
// `_bmad-output/.backups/`, which `backup-manager.js` already writes to, and outside
// `.claude/skills/` so that the copy of an excluded agent's wrapper is not itself a skill.
const WRAPPER_BACKUP_REL = path.join('_bmad-output', '.backups', 'skill-wrappers');

/**
 * sha256 over the tree at `root`, following symlinks: every directory and every file by relative
 * path, and each file's bytes behind their length, so no two different trees give one stream.
 */
function wrapperDigest(root) {
  const hash = crypto.createHash('sha256');
  const walk = (abs, rel) => {
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      hash.update(`d${rel}\0`);
      for (const entry of fs.readdirSync(abs).sort()) walk(path.join(abs, entry), `${rel}/${entry}`);
    } else if (stat.isFile()) {
      const bytes = fs.readFileSync(abs);
      hash.update(`f${rel}\0${bytes.length}\0`).update(bytes);
    } else {
      // A FIFO would block the read and a socket cannot be copied; refuse rather than guess.
      throw new Error(`${rel || path.basename(abs)} is not a regular file or directory`);
    }
  };
  walk(root, '');
  return hash.digest('hex');
}

/** Do two paths name the same directory entry? True for two spellings of one name on a case-insensitive filesystem. */
function isSameDirectoryEntry(a, b) {
  try {
    const sa = fs.lstatSync(a);
    const sb = fs.lstatSync(b);
    return sa.ino === sb.ino && sa.dev === sb.dev;
  } catch {
    return false;
  }
}

/**
 * Copy `.claude/skills/<name>` aside when it holds something other than the text Convoke would
 * write there, and tell the caller whether it may now remove or rewrite it.
 *
 * "Something other" is decided two ways, because the callers destroy different things:
 *   - a caller that removes the whole directory passes no `textOnly`, and any entry besides a
 *     `SKILL.md` equal to `expectedText` counts;
 *   - a caller that only rewrites `SKILL.md` passes `textOnly: true`, and sibling files, which
 *     it leaves alone, do not count.
 * With no `expectedText` there is nothing to compare against, so any content at all is copied.
 * That includes Convoke's own wrapper from an older release — and a wrapper whose shipped text
 * changed between releases differs from `expectedText` too — which is why the report line does
 * not call the content the operator's.
 *
 * `SKILL.md` is read through the path the caller will WRITE to rather than looked up in a
 * directory listing: on a case-insensitive filesystem a file stored as `skill.md` is the file
 * that write replaces, and a listing compared against `'SKILL.md'` does not see it. Symlinks are
 * followed for the same reason, for the comparison, the digest and the copy alike — the caller's
 * write goes through a link, so what must be kept is what the link points at.
 *
 * Each copy lands at `<name>-<digest of its content>` and nothing here deletes one, so a copy
 * of different content does not land on an earlier copy's name. Content is treated as already copied only when the
 * directory at that name still digests to the same value — its mere existence proves nothing,
 * since an operator who moves a file back out of it leaves the directory behind. Nothing prunes
 * the copies. The Gyre guides phase keeps a single `.bak` instead; that loses an operator's edit
 * when the next release changes the shipped text, which is what this avoids.
 *
 * A wrapper holding something that cannot be read as a file or a directory — a broken or
 * circular link, a FIFO, a socket — cannot be copied whole, so it is refused: see the return.
 *
 * @returns {boolean} true when the caller may proceed: there was nothing to keep, or the copy was
 *   made, or an identical copy was already there. false when the copy failed. The wrapper is then
 *   untouched and a warning has been printed; the caller must leave it alone.
 */
function preserveOperatorWrapper(skillsDir, name, expectedText, { backupRoot, changes, verbose, textOnly = false, writesThrough = false }) {
  const target = path.join(skillsDir, name);
  try {
    let stat;
    try {
      stat = fs.statSync(target);
    } catch (err) {
      if (err.code === 'ENOENT') return true; // absent, or a link to nothing
      throw err;
    }

    // T271: a wrapper that IS a folder inside the backups is refused before anything else — a
    // caller writing into it writes into a copy, whether or not its content counts as changed.
    const realBackupRoot = realPathOfPossiblyMissing(backupRoot);
    if (isWithin(realPathOrNull(target), realBackupRoot)) throw reachError('.', false);
    // A `SKILL.md` that is a folder cannot be written as a file; for a caller that writes it, that
    // threw out of the whole refresh. Refused instead.
    if (writesThrough && stat.isDirectory()) {
      const skillStat = statOrNull(path.join(target, 'SKILL.md'));
      if (skillStat && skillStat.isDirectory()) throw new Error('SKILL.md is a folder, not a file; move it out of .claude/skills/');
    }

    let differs = true; // a file where a wrapper directory belongs is not something Convoke wrote
    if (stat.isDirectory()) {
      const skillFile = path.join(target, 'SKILL.md');
      let textDiffers = false;
      if (fs.existsSync(skillFile)) {
        let text = null;
        // Read it only when it is a regular file: reading a FIFO at this name never returns.
        if (fs.statSync(skillFile).isFile()) {
          try {
            text = fs.readFileSync(skillFile, 'utf8');
          } catch {
            // unreadable: not the text Convoke writes
          }
        }
        textDiffers = expectedText === undefined || text !== expectedText;
      }
      differs = textDiffers || (!textOnly && fs.readdirSync(target).some(e => e !== 'SKILL.md'));
    }
    if (!differs) return true;

    // T271: only once there is something to keep — an unchanged wrapper is written with the text it
    // already holds, so where its links lead harms nothing. Two shapes are refused, through the
    // catch below, like any wrapper that cannot be copied: a `SKILL.md` that IS a backup copy (by
    // a symbolic or a hard link), which digested equal to that copy, was read as already kept, and
    // then had the regenerated text written through it onto the copy; and a folder in the wrapper
    // that holds the backups, which made the copy recurse into its own output until the path was
    // too long.
    // Created first, so a link pointing at it — dangling until a first copy made it — resolves and
    // is seen. One that cannot be created would have failed the copy anyway; it is refused the same.
    fs.ensureDirSync(backupRoot);
    const endangered = wrapperEndangersBackup(target, backupRoot, { writesThrough });
    if (endangered !== null) throw reachError(endangered.rel, endangered.hard);

    const digest = wrapperDigest(target);
    const backupName = `${name}-${digest.slice(0, 16)}`;
    const dest = path.join(backupRoot, backupName);
    let alreadyKept = false;
    try {
      alreadyKept = fs.existsSync(dest) && wrapperDigest(dest) === digest;
    } catch {
      // whatever is at `dest` cannot be read as this content, so it is not a copy of it
    }
    if (alreadyKept) return true;

    // Copied OVER whatever is at `dest`, without removing the directory first: a copy that
    // failed part-way last time is completed. A file already at a path this copy writes is
    // replaced by it; files at other paths are left where they are.
    fs.copySync(target, dest, { dereference: true });

    const shown = path.join(WRAPPER_BACKUP_REL, backupName);
    changes.push(`Backed up ${name} → ${shown}`);
    if (verbose) console.log(`    Backed up ${name} → ${shown}`);
    return true;
  } catch (err) {
    // Not pushed into `changes`, and not gated on `verbose`: see the taxonomy seed's catch in
    // `refreshInstallation` for why a warning must not be rendered with a green tick.
    const advice = (err.remedy || 'Move it out of .claude/skills/ and run again').replace('<name>', name);
    console.warn(`    Warning: could not back up .claude/skills/${name} (${err.message}) — left as it is. ${advice}.`);
    return false;
  }
}

/** The real path of `p`, spelled as on disk; see {@link wrapperEndangersBackup}. */
function realPathNative(p) {
  try {
    return fs.realpathSync.native(p);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') throw err;
    // Some Windows volumes fail the native call where the JS one works; better the caller's
    // spelling than refusing every changed wrapper on that volume.
    return fs.realpathSync(p);
  }
}

function realPathOrNull(p) {
  try {
    return realPathNative(p);
  } catch {
    return null;
  }
}

function statOrNull(p, opts) {
  try {
    return fs.statSync(p, opts);
  } catch {
    return null;
  }
}

/** True when `child` is `parent` or inside it; false for `null`. */
function isWithin(child, parent) {
  if (child === null) return false;
  const rel = path.relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

/** The T271 refusal, carrying its own advice so the catch does not add a second, different one. */
function reachError(rel, hard) {
  const where = rel === '.' ? 'the wrapper itself' : rel;
  const err = new Error(hard
    ? `${where} is a hard link to a file in ${WRAPPER_BACKUP_REL}/`
    : `${where} reaches into ${WRAPPER_BACKUP_REL}/, where its copy would go`);
  err.remedy = hard
    ? `Delete .claude/skills/<name>/${rel} (the copy keeps its content) and run again`
    : rel === '.' ? 'Replace the link with a folder of its own and run again' : `Remove the link at ${rel} and run again`;
  return err;
}

/**
 * T271: what in `target` would put its backup copy at risk, or `null`. `rel` is a path relative to
 * `target`; `hard` says it is a hard link.
 *   - For a caller that writes `SKILL.md` (`writesThrough`, the agent loops): that file resolving
 *     inside `backupRoot`, or being a hard link to any file there — writing it would write the copy.
 *     The other callers replace or remove the file without writing through it.
 *   - For every caller: a folder in the wrapper, reached through links, that holds `backupRoot` —
 *     the copy would copy itself.
 * A link to some other folder inside the backups is neither: the copy reads it, and nothing writes
 * through it. Paths are compared by `realpathSync.native`, which returns the spelling on disk:
 * the JS `realpathSync` keeps the caller's case, so on a case-insensitive filesystem a link to
 * `_BMAD-OUTPUT` read as somewhere else. Each real folder is walked once, so loops end the walk;
 * an entry that cannot be resolved or read is skipped — the copy refuses it, if it must.
 *
 * @param {string} target - A wrapper under `.claude/skills/`.
 * @param {string} backupRoot - Where its copy would go; it exists by now.
 * @param {{writesThrough: boolean}} opts
 * @returns {{rel: string, hard: boolean}|null}
 */
function wrapperEndangersBackup(target, backupRoot, { writesThrough }) {
  const realBackup = realPathOfPossiblyMissing(backupRoot);

  if (writesThrough) {
    const realSkill = realPathOrNull(path.join(target, 'SKILL.md'));
    if (isWithin(realSkill, realBackup)) return { rel: 'SKILL.md', hard: false };
    const st = realSkill === null ? null : statOrNull(realSkill, { bigint: true });
    if (st && st.isFile() && st.nlink > 1n && hardLinkedIntoBackups(st, realBackup)) return { rel: 'SKILL.md', hard: true };
  }

  const seen = new Set();
  const walk = (abs, rel) => {
    const resolved = realPathOrNull(abs);
    if (resolved === null || seen.has(resolved)) return null;
    const st = statOrNull(resolved);
    if (!st || !st.isDirectory()) return null;
    if (isWithin(realBackup, resolved)) return { rel, hard: false };
    seen.add(resolved);
    let entries;
    try {
      entries = fs.readdirSync(resolved);
    } catch {
      return null;
    }
    for (const entry of entries) {
      const found = walk(path.join(abs, entry), rel === '.' ? entry : `${rel}/${entry}`);
      if (found !== null) return found;
    }
    return null;
  };
  return walk(target, '.');
}

/**
 * True when any regular file under `realBackup` is the same file as `st` — a hard link can be to
 * any of them, not only a copy's `SKILL.md`. Links are not followed; inode numbers are compared as
 * BigInts, which a Number cannot hold exactly on every filesystem.
 */
function hardLinkedIntoBackups(st, realBackup) {
  const stack = [realBackup];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile()) {
        const other = statOrNull(abs, { bigint: true });
        if (other && other.ino === st.ino && other.dev === st.dev) return true;
      }
    }
  }
  return false;
}

/**
 * The real path of `p`, resolving through its nearest existing ancestor when `p` does not exist
 * yet. Only a missing component is climbed past; any other failure is thrown, to the caller's
 * refusal.
 */
function realPathOfPossiblyMissing(p) {
  const rest = [];
  let current = path.resolve(p);
  for (;;) {
    try {
      return path.join(realPathNative(current), ...rest);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      const parent = path.dirname(current);
      if (parent === current) return path.resolve(p);
      rest.unshift(path.basename(current));
      current = parent;
    }
  }
}

/**
 * Report a `.claude/skills/` entry that carries a Convoke prefix but not a name Convoke shipped.
 * A warning rather than a `changes` entry, because nothing was changed.
 */
function reportForeignWrapper(name) {
  console.warn(`    Left in place: .claude/skills/${name} uses a Convoke prefix but is not a skill Convoke installs`);
}

/**
 * Clean up workflow-wrapper directories in .claude/skills/ that no module config declares.
 *
 * Two-strategy matching (Story 7.4, I32; Strategy 1 changed by T252):
 *   Strategy 1: Enhance prefix — a dir starting with `bmad-enhance-` that is not in
 *               `currentWrappers` is reported and LEFT IN PLACE.
 *   Strategy 2: verbatim exact-name (Artifacts + Portability) — a dir whose name is in
 *               `knownVerbatimNames` but not in `currentWrappers` is copied aside and removed.
 * Everything else (agent wrappers, upstream BMAD skills, third-party) is ignored.
 *
 * @param {string} skillsDir - Absolute path to .claude/skills/
 * @param {Set<string>} currentWrappers - Union of live workflow wrapper names
 * @param {Set<string>} knownVerbatimNames - ALL Artifacts + Portability workflow names (including non-standalone)
 * @param {object} options
 * @param {string} options.backupRoot - Absolute directory removed wrappers are copied into
 * @param {boolean} [options.verbose] - Log each action
 * @returns {Array<string>} Changes array entries: one per copy made and one per directory removed
 */
function cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownVerbatimNames, options = {}) {
  // Deliberately synchronous (fs.removeSync / fs.readdirSync) — the function returns
  // Array<string>, not a Promise. The sync pattern keeps the contract simple for both
  // the caller (section 6e spreads the result into changes[]) and the test file (which
  // imports the function directly without async scaffolding). The existing agent
  // stale-skill sweep at section 6 uses async fs.remove because it runs inline in the
  // async refreshInstallation body; this function is extracted to be testable standalone.
  const { verbose = false, backupRoot } = options;
  if (!backupRoot) throw new TypeError('cleanupOrphanWorkflowWrappers: options.backupRoot is required');
  const changes = [];
  const ctx = { backupRoot, changes, verbose };

  if (!fs.existsSync(skillsDir)) return changes;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;

    // Skip agent wrappers (handled by existing stale-skill sweep)
    if (name.startsWith('bmad-agent-bme-')) continue;

    // Strategy 1: Enhance prefix. T252: this used to REMOVE every `bmad-enhance-*` directory not
    // in the current set, on the reasoning that no upstream module uses the prefix. That shows
    // the name is not upstream's; it does not show Convoke wrote it, and an operator's own
    // `bmad-enhance-acme` was deleted by a plain install. Enhance has never retired a workflow
    // name, so nothing under this prefix is Convoke's to remove; it is left in place and reported.
    // When Enhance does retire one, list that exact name and remove it the way Strategy 2 does.
    if (name.startsWith('bmad-enhance-')) {
      if (!currentWrappers.has(name)) reportForeignWrapper(name);
      continue;
    }

    // Strategy 2: verbatim exact-name match (Artifacts + Portability)
    if (knownVerbatimNames.has(name)) {
      if (!currentWrappers.has(name)) {
        if (!preserveOperatorWrapper(skillsDir, name, undefined, ctx)) continue;
        fs.removeSync(path.join(skillsDir, name));
        changes.push(`Removed orphan skill wrapper: ${name}`);
        if (verbose) console.log(`    Removed orphan skill wrapper: ${name}`);
      }
      continue;
    }

    // Everything else: not a workflow wrapper we own — leave alone
  }

  return changes;
}

/**
 * Create an EMPTY BMM governance registry in the operator's project (dist-2-5 / BUG-19).
 *
 * `convoke-doctor` reads `path.join(projectRoot, '_bmad/_config/bmm-dependencies.csv')`
 * (`convoke-doctor.js's `const csvAbs = path.join(projectRoot, BMM_DEPS_CSV_REL)``). Nothing created it, so every npm-installed operator saw
 * `⚠ BMM dependencies: registry missing` on an otherwise healthy install.
 *
 * HEADER ONLY — THE SCHEMA, NEVER A ROW. Two implementations were rejected by measurement
 * before this one, and both failure modes are guarded by tests in
 * `tests/unit/refresh-installation-bmm-deps.test.js`:
 *
 *   1. Shipping the package's registry in `files[]` and copying it (the story's original
 *      prescription) replaces `registry missing` with `[stale:skill-gone]` — its sole row
 *      names a skill directory that reaches no user project.
 *   2. Seeding `scanBmmDependencies(projectRoot)` output — which looks right, since it is
 *      what the doctor's `fix:` line tells the OPERATOR to run — stamps the operator's own
 *      custom skills `registered_by: auto-scan`, a RESERVED marker
 *      (`convoke-register-skill.js:33`). That makes `convoke-register-skill` hard-fail
 *      `exit 1` on the exact path it exists to serve, and permanently blinds the doctor's
 *      `unregistered-custom-skill` category, so it reports `✓ registry consistent` over a
 *      tree nobody governed.
 *
 * An empty registry claims nothing. A project with no BMM-dependent skills reports
 * `registry consistent — 0 auto-scan + 0 manual rows`, which is accurate. A project that
 * HAS unregistered skills keeps getting `unregistered-custom-skill`, which is also
 * accurate; silencing that was never in BUG-19's scope. (BUG-20 is the separate question of whether
 * an EXPECTED absence — `compat-preflight`'s `BMAD core not detected` — should warn at all; an
 * unregistered custom skill is not that case, and is not in BUG-20's scope.)
 *
 * WRITTEN INLINE, AND NOT VIA `_atomicWrite`, FOR A REASON THAT IS NOT STYLE. An earlier
 * revision delegated to `audit-bmm-dependencies.js`'s `_atomicWrite`. Round 2 showed that
 * delegating moved the write out of `install-scope-check.js`'s counted unit — its
 * `WRITE_OP_RE` matches literal `fs.*` calls per file — so a NEW write from this file into
 * the forbidden `_bmad/core/` passed the gate GREEN. Reproduced. Keeping the primitives
 * here keeps them counted, which is the whole point of that snapshot.
 *
 * `writeFileSync` + `linkSync` + `unlinkSync`, in that order, is atomic create-if-absent:
 *   - the content is fully written to a sibling temp file BEFORE the target name exists,
 *     so no reader can observe a torn registry (a torn file would be PERMANENT here, since
 *     this function only writes when the target is absent, and `mergePreservingManual`
 *     preserves a fragment row as `manual` so even `convoke-audit-bmm-deps` cannot heal it);
 *   - `linkSync` fails `EEXIST` if the target exists, atomically. That closes the
 *     check-then-act window `lstat` alone leaves open — Round 2 measured 6-10 ms, and
 *     demonstrated a concurrent `convoke-register-skill` commit being silently destroyed by
 *     a `renameSync` that overwrites unconditionally.
 *
 * The `lstat` below is a fast path and a clearer `reason` code, NOT the safety property;
 * `linkSync`'s `EEXIST` is what actually makes this safe. Note it is `lstat`, not
 * `existsSync`: `existsSync` follows symlinks and reports a dangling one as absent.
 *
 * On a filesystem without hard-link support the `linkSync` throws, the caller warns, and the
 * operator lands back in the documented pre-dist-2-5 state — degraded, never broken.
 *
 * Only ever seeds when ABSENT. An existing registry is user state: it carries manually
 * registered rows no scan can reproduce.
 *
 * @param {string} projectRoot - Absolute path to the operator's project.
 * @param {{isSameRoot?: boolean, verbose?: boolean}} [opts]
 * @returns {{seeded: boolean, reason: string}}
 */
function seedBmmDependencies(projectRoot, opts = {}) {
  const { isSameRoot = false, verbose = false } = opts;

  // Guarded like every other write in this file. In dev mode the project IS the package,
  // and rewriting the repository's own tracked registry during a refresh would turn a
  // read-only dev refresh into a source edit.
  if (isSameRoot) return { seeded: false, reason: 'same-root' };

  const depsAbs = path.join(projectRoot, '_bmad', '_config', 'bmm-dependencies.csv');

  let present = true;
  try {
    fs.lstatSync(depsAbs);
  } catch (err) {
    if (err.code === 'ENOENT') present = false;
    else throw err;
  }
  if (present) return { seeded: false, reason: 'exists' };

  const { renderCsv } = require('../../audit/audit-bmm-dependencies');

  fs.ensureDirSync(path.dirname(depsAbs));
  // Sibling of the target by construction, so `linkSync` never crosses a filesystem.
  const tmpAbs = `${depsAbs}.tmp-${process.pid}-${Date.now()}`;
  let seeded = false;
  // The content write is INSIDE the try so the `finally` reclaims the temp on every path.
  // Round 3 measured the alternative: with the write outside, a SHORT write — ENOSPC, EDQUOT,
  // EIO, all of which create the file and then throw part-way — escaped before the reclaim and
  // stranded one stray per attempt, which `.gitignore`'s `*.tmp` does not match and the
  // operator therefore sees in `git status`. The helper this code replaced (`_atomicWrite`)
  // guards the same hazard with a `tmpCreated` flag; an inline copy that is less careful than
  // the thing it replaced is not a simplification.
  try {
    // `renderCsv([])` is exactly the header the doctor's reader expects, derived from that
    // module's own CSV_HEADER_FIELDS rather than restated here, so a schema change cannot
    // leave this seed writing a stale header (`derive-counts-from-source`). Verified
    // byte-identical to what `convoke-audit-bmm-deps` generates for an empty project, so a
    // freshly seeded install does not trip `--verify-only` drift.
    //
    // It is written to the TEMP name, never to `depsAbs`. That is the atomicity property:
    // the published name only ever comes into existence via `linkSync`, already complete.
    fs.writeFileSync(tmpAbs, renderCsv([]), 'utf8');
    fs.linkSync(tmpAbs, depsAbs);
    seeded = true;
  } catch (err) {
    // Someone created the registry while we were writing the temp file — their content
    // wins. This is the race arm, and losing it is the CORRECT outcome: a concurrent
    // `convoke-register-skill` has real rows, and this function only ever had a header.
    if (err.code !== 'EEXIST') throw err;
  } finally {
    // Reclaim the temp name on every path — success, EEXIST, and any throw from either the
    // write or the link. This is only true because the write is inside the try above.
    try { fs.unlinkSync(tmpAbs); } catch { /* never created, or already consumed */ }
  }

  if (!seeded) return { seeded: false, reason: 'exists' };
  if (verbose) console.log('    Created _bmad/_config/bmm-dependencies.csv (empty registry)');
  return { seeded: true, reason: 'created' };
}

/**
 * The `_bmad/bme/*` modules this file has a version-stamping path for.
 *
 * BUG-17: `scripts/lib/bme-modules.js` must know what a refresh can actually change, or it
 * routes `convoke-update` to a refresh that takes the lock, cuts a backup and stamps nothing.
 * Declared here, beside the stamp sites, and imported there — a second hardcoded list would be
 * the two-callers-disagree defect BUG-17 exists to remove, reproduced inside its own fix.
 *
 * The stamp sites are the `configMerger.mergeConfig` calls for Vortex and Gyre, and the
 * `ecDoc`/`acDoc`/`pcDoc` `.set('version')` writes for Enhance, Artifacts and Portability — five.
 * A sixth, `scDoc.set('version')` in the EXTRA_BME_AGENTS loop, was removed with the Team Factory in
 * tfu-1-1, which is why `install-scope-check.js`'s snapshot for this file dropped by one.
 *
 * T234: this enumeration was written by hand and omitted `pcDoc`, so the list said four while the
 * code stamped five, and `_portability` read as unmanaged. Derive it rather than counting by eye:
 * `grep -nE "\\.set\\('version'|configMerger\\.mergeConfig\\(" scripts/update/lib/refresh-installation.js | grep -v "^[0-9]*: \\*"` — the filter matters: without it the two sentences above match too, and one of them names `scDoc`, a site `tfu-1-1` deleted, so the unfiltered command returns 7 and reproduces the hand-count it replaces.
 * Named by symbol on purpose: line
 * numbers in this file are not gate-checked, and every attempt to keep them current during
 * BUG-17 rotted within the hour.
 */
const STAMPABLE_MODULES = Object.freeze([
  '_vortex',
  '_enhance',
  '_artifacts',
  '_portability',
  '_gyre',
  // `_team-factory` was here via EXTRA_BME_AGENTS until tfu-1-1; it is no longer
  // installer-managed because it is no longer installed.
]);

module.exports = {
  guardedModuleNames,
  gyreGuidePlan,
  mergedModuleNames,
  MERGED_MODULE_NAMES,
  addedKeysKeptModuleNames,
  ADDED_KEYS_KEPT_MODULE_NAMES,
  // T221: exported so the trailing-comment rule can be tested against a template that has a
  // trailing comment of its own, which no shipped template does yet.
  carryOperatorKeys,
  refreshInstallation,
  cleanupOrphanWorkflowWrappers,
  isSameDirectoryEntry,
  RETIRED_VERBATIM_WRAPPERS,
  WRAPPER_BACKUP_REL,
  manifestRowSeeds,
  seedBmmDependencies,
  STAMPABLE_MODULES,
};
