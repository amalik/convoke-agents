'use strict';

/**
 * installed-tree.js — assertions about what actually ARRIVES in a user's project.
 *
 * Story dist-2.4 (FR13). The question this answers is narrower than "did the tarball
 * contain it": a file can be in `package.json` `files[]`, reach
 * `node_modules/convoke-agents/`, and still never reach the project where the code
 * looks for it. `refresh-installation.js` copies `_bmad/_config/` PER NAMED FILE
 * (`:551`, `:585`), not as a directory, and `.claude/skills/` wrappers are GENERATED
 * from declarations (`:782`, `:811`, `:836`, `:862`, `:909`) — never copied.
 *
 * So there are three distinct failures, and this module names all three:
 *
 *   1. a shipped `_bmad/bme/*` module does not arrive in the project     (ADR-004 C4)
 *   2. a module arrives but its declared units are not invocable          (ADR-004 C2)
 *   3. a data file the shipped code READS at runtime does not arrive      (FR13)
 *
 * Failure 2 is why this file exists at all. A presence-only check goes GREEN on a
 * `_bmad/bme/_portability/` tree that was copied but whose four skills remain
 * unreachable — which is the exact defect I141 was filed for. See ADR-004
 * (`_bmad-output/planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md`),
 * accepted question 3.
 *
 * NOT WIRED INTO THE VERDICT. Story dist-2.4 builds and demonstrates; story dist-2.6
 * wires it in. NFR10: a gate merged green has never been shown to work.
 */

const fs = require('fs');
const path = require('path');

/**
 * AC4 — project-scoped runtime data files.
 *
 * CURATED, NOT INFERRED, and the story says so rather than pretending otherwise.
 * The obvious mechanisation — `grep -rn "path.join(projectRoot" scripts/` — was tried
 * and measured on 2026-08-29: 135 sites, no way to tell a read from a write, many
 * paths built from variables, several of them directories, and decisively it CANNOT
 * SEE the one entry this check is required to fire on: `convoke-doctor.js:763` reads
 * `path.join(projectRoot, BMM_DEPS_CSV_REL)`, so the filename lives in a constant and
 * a static extractor yields no filename. A check built that way could not satisfy its
 * own acceptance criterion.
 *
 * Curation rots when someone adds a runtime read and forgets this list. That is a real
 * cost, not a hypothetical one, which is why every entry cites the call site that reads
 * it and `tests/audit/installed-tree.test.js` asserts those citations still resolve.
 * That test is the rot alarm. It is weaker than derivation and saying so is the point.
 *
 * DO NOT "improve" this into an inference engine. If derivation is wanted later, the
 * tractable route is observing an installed product's real file opens, not static
 * analysis — a different story with a different cost.
 *
 * Membership rule: the shipped code READS it from the project root at runtime, and its
 * absence is a DEFECT rather than a normal pre-generation state. Each `arrivesVia` cites
 * the installer code that puts it there, which is what makes "absence is a defect" a
 * claim about this repository rather than an opinion.
 */
const RUNTIME_DATA_FILES = [
  {
    file: '_bmad/_config/skill-manifest.csv',
    readSite: 'scripts/portability/convoke-export.js:360',
    alsoRead: ['scripts/portability/export-engine.js:98', 'scripts/convoke-doctor.js:322'],
    arrivesVia: 'scripts/update/lib/refresh-installation.js:551',
    why: 'convoke-export resolves every skill through it — absence is I139 exactly: the bin exits non-zero on a fresh install.',
  },
  {
    file: '_bmad/_config/agent-manifest.csv',
    readSite: 'scripts/update/lib/validator.js:286',
    alsoRead: ['scripts/portability/export-engine.js:168'],
    arrivesVia: 'scripts/lib/agent-manifest-generator.js:237',
    why: 'the installer regenerates it during refresh, so a post-install absence means the regeneration step did not run.',
  },
  {
    file: '_bmad/_config/taxonomy.yaml',
    readSite: 'scripts/convoke-doctor.js:980',
    alsoRead: ['scripts/lib/artifact-utils.js:125'],
    arrivesVia: 'scripts/update/lib/refresh-installation.js:1040',
    why: 'a fresh install runs no migrations, so the installer seeds it directly; without it doctor fails its own Taxonomy checks.',
  },
  {
    file: '_bmad/_config/bmm-dependencies.csv',
    readSite: 'scripts/convoke-doctor.js:763',
    // The read site does not spell the filename: it reads `path.join(projectRoot,
    // BMM_DEPS_CSV_REL)`. That indirection is the single most important fact about this
    // entry — it is why no static extractor can find this file, and therefore why AC4 is
    // a declared list rather than a grep. The token is named so the rot alarm can still
    // check the citation instead of being weakened to accommodate it.
    token: 'BMM_DEPS_CSV_REL',
    alsoRead: ['scripts/audit/audit-bmm-dependencies.js:34'],
    arrivesVia: null,
    why:
      'NOTHING puts it in the project today — this is the FR13 red target. Its "must arrive" status is a ' +
      'DECISION Story 2.5 made, not a property of the code: convoke-doctor treats absence as a soft ' +
      'governance warning by design. If 2.5 revisits that, this entry leaves the manifest and the ' +
      'dist-2-4 red demonstration must be re-based.',
  },
];

/** Wrapper-name rules, one per generator code path. See `declaredUnits`. */
const WRAPPER_RULES = {
  vortexAgent: { site: 'scripts/update/lib/refresh-installation.js:782', name: id => `bmad-agent-bme-${id}` },
  gyreAgent: { site: 'scripts/update/lib/refresh-installation.js:811', name: id => `bmad-agent-bme-${id}` },
  extraBmeAgent: { site: 'scripts/update/lib/refresh-installation.js:836', name: id => `bmad-agent-bme-${id}` },
  enhanceWorkflow: { site: 'scripts/update/lib/refresh-installation.js:862', name: n => `bmad-enhance-${n}` },
  standaloneWorkflow: { site: 'scripts/update/lib/refresh-installation.js:909', name: n => `${n}` },
};

/** `_bmad/bme/*` entries in a `files[]` array, normalised to bare module names. */
function shippedBmeModules(files) {
  if (!Array.isArray(files)) return [];
  const out = [];
  for (const entry of files) {
    if (typeof entry !== 'string') continue;
    const m = /^_bmad\/bme\/([^/]+)\/?$/.exec(entry.trim());
    if (m) out.push(m[1]);
  }
  return out;
}

/** Modules declared in `files[]` that never reached the project tree (ADR-004 C4). */
function missingModules(modules, projectRoot) {
  return modules.filter(m => !isDir(path.join(projectRoot, '_bmad', 'bme', m)));
}

/** Manifest entries absent from the project tree (FR13). */
function missingRuntimeFiles(projectRoot, manifest = RUNTIME_DATA_FILES) {
  return manifest.filter(e => !isFile(path.join(projectRoot, e.file)));
}

/**
 * Every operator-invocable unit DECLARED by a module that arrived (ADR-004 C2).
 *
 * Derived at call time from the installed tree's module configs and the agent registry.
 * NEVER snapshotted: a hardcoded list of expected wrappers goes stale the first time a
 * module gains a workflow, and the one thing this check must survive is Story 2.6 giving
 * `_portability` a config.yaml with four standalone workflows — which this function then
 * picks up with no edit here.
 *
 * The rules below are the GENERATOR's rules, read off the five code paths that emit
 * wrappers, not ADR-004's prose. They differ in one place and it matters: ADR-004 C2 says
 * a workflow is declared by `standalone: true`, but the Enhance path (`:862`) emits a
 * wrapper for EVERY object-shaped workflow entry and `_enhance`'s sole entry carries no
 * `standalone` flag. Implementing C2 literally would leave `bmad-enhance-initiatives-backlog`
 * unchecked — a whole module's operator surface invisible to the gate. Recorded in the
 * story as a discrepancy between the accepted contract and the shipped code; the check
 * follows the code, because the code is what the operator gets.
 *
 * `_vortex`, `_gyre` and `_team-factory` list workflows as bare STRINGS. Those are agent
 * menu items, not standalone skills, and no path generates wrappers for them — hence the
 * object-shape guard rather than a module allowlist.
 *
 * @param {object}  opts
 * @param {string}  opts.projectRoot  installed project
 * @param {object}  opts.registry     the installed `agent-registry.js` exports
 * @param {string[]} opts.arrived     module names present in the project tree
 * @returns {{name: string, module: string, rule: string, site: string}[]}
 */
function declaredUnits({ projectRoot, registry, arrived }) {
  const yaml = loadYaml();
  const present = new Set(arrived);
  const units = [];

  const agentBuckets = [
    { list: registry.AGENTS || [], module: () => '_vortex', rule: 'vortexAgent' },
    { list: registry.GYRE_AGENTS || [], module: () => '_gyre', rule: 'gyreAgent' },
    { list: registry.EXTRA_BME_AGENTS || [], module: a => a.submodule, rule: 'extraBmeAgent' },
  ];

  for (const bucket of agentBuckets) {
    for (const agent of bucket.list) {
      const mod = bucket.module(agent);
      // "declared by an ARRIVING module": a wrapper for an agent whose module never
      // landed would point at a file that is not there, so it is the module's absence
      // that is the finding — already reported by missingModules — not the wrapper's.
      if (!present.has(mod)) continue;
      if (excludedAgents(projectRoot, mod, yaml).includes(agent.id)) continue;
      units.push({
        name: WRAPPER_RULES[bucket.rule].name(agent.id),
        module: mod,
        rule: bucket.rule,
        site: WRAPPER_RULES[bucket.rule].site,
      });
    }
  }

  for (const mod of arrived) {
    const cfg = readModuleConfig(projectRoot, mod, yaml);
    if (!cfg) continue;
    for (const wf of Array.isArray(cfg.workflows) ? cfg.workflows : []) {
      // Bare strings are agent menu entries; only object entries reach a generator.
      if (!wf || typeof wf !== 'object' || typeof wf.name !== 'string' || !wf.name) continue;
      const rule = mod === '_enhance' ? 'enhanceWorkflow' : wf.standalone === true ? 'standaloneWorkflow' : null;
      if (!rule) continue;
      units.push({
        name: WRAPPER_RULES[rule].name(wf.name),
        module: mod,
        rule,
        site: WRAPPER_RULES[rule].site,
      });
    }
  }

  return units;
}

/** Declared units with no generated `.claude/skills/<name>/SKILL.md` (ADR-004 C2). */
function missingWrappers(units, projectRoot) {
  return units.filter(u => !isFile(path.join(projectRoot, '.claude', 'skills', u.name, 'SKILL.md')));
}

/**
 * AC5 / I153 — resolve a bin's FULL dependency surface, not one hop.
 *
 * The check this replaces read each bin ENTRY FILE, regex-matched literal `require()`
 * calls and resolved each specifier — but never opened what it resolved. Measured:
 * `scripts/install-all-agents.js` (bin `convoke-install`) contains exactly ONE require,
 * so its real surface (`fs-extra`, `refresh-installation`, `compat-preflight`,
 * `agent-registry`) was entirely unchecked and that bin's gate was vacuous.
 *
 * BOUNDED DELIBERATELY. The extractor is a regex over raw text with NO LEXER, so a
 * commented-out or string-literal `require` reads as missing. That is latent today (no
 * bin has one) and is a separate I153 deferral, out of scope — but going transitive
 * would multiply its blast radius from 14 entry files to the whole graph. So only
 * RELATIVE specifiers (`./`, `../`) are followed; a bare package specifier is resolved
 * and then treated as a leaf. No AST library: `backlog-integrity.js` set the precedent
 * that a hand-rolled parser gets fenced in rather than extended.
 *
 * @param {string} entryFile
 * @param {{maxFiles?: number}} [opts]
 * @returns {{missing: {spec: string, from: string}[], capHit: boolean, visited: number}}
 */
function walkRequires(entryFile, opts = {}) {
  const maxFiles = opts.maxFiles === undefined ? 500 : opts.maxFiles;
  const RE = /\brequire\(\s*["']([^"']+)["']\s*\)/g;
  const seen = new Set();
  const missing = new Map();
  const queue = [real(entryFile)];
  let capHit = false;

  while (queue.length) {
    const file = queue.shift();
    // Compared as REAL paths. `require.resolve` returns the realpath, but the entry file
    // arrives as given — and on macOS `mktemp` hands out `/var/...` for a directory whose
    // realpath is `/private/var/...`. Comparing the two as strings made a cycle look like
    // two distinct files, so the visited set did not terminate it. Found by the cycle
    // test, which is the whole reason it asserts a count rather than just "returns".
    if (seen.has(file)) continue;
    // Report the cap rather than passing silently. A walk that stopped early and said
    // nothing is the fail-open pattern this harness has already shipped four times.
    if (seen.size >= maxFiles) { capHit = true; break; }
    seen.add(file);

    let src;
    try {
      src = fs.readFileSync(file, 'utf8');
    } catch {
      // Only reachable for something `require.resolve` accepted and the reader then
      // could not open (a .node addon, a permissions change mid-walk). Not a missing
      // dependency — resolution already succeeded — so it is not reported as one.
      continue;
    }

    for (const m of src.matchAll(RE)) {
      const spec = m[1];
      if (spec.startsWith('node:')) continue;
      let resolved;
      try {
        resolved = require.resolve(spec, { paths: [path.dirname(file)] });
      } catch {
        if (!missing.has(spec)) missing.set(spec, { spec, from: file });
        continue;
      }
      if (spec.startsWith('./') || spec.startsWith('../')) queue.push(resolved);
    }
  }

  return { missing: [...missing.values()], capHit, visited: seen.size };
}

// ─── internals ───────────────────────────────────────────────────

/** Realpath, falling back to the resolved path when the file does not exist. */
function real(p) {
  const abs = path.resolve(p);
  try { return fs.realpathSync(abs); } catch { return abs; }
}

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }

function loadYaml() {
  try {
    return require('js-yaml');
  } catch (err) {
    // Fail LOUD. Returning a null parser here would make every config read come back
    // empty, every module declare nothing, and the wrapper check pass while asserting
    // nothing — the exact shape of the four fail-open defects this harness records.
    throw new Error(`installed-tree: js-yaml is required but could not be loaded (${err.message})`, { cause: err });
  }
}

function readModuleConfig(projectRoot, mod, yaml) {
  const p = path.join(projectRoot, '_bmad', 'bme', mod, 'config.yaml');
  if (!isFile(p)) return null;
  try {
    return yaml.load(fs.readFileSync(p, 'utf8')) || null;
  } catch {
    // A config that does not parse declares nothing THIS check can see. Surfaced by the
    // caller as a note rather than swallowed — see assert-installed-tree.js.
    return null;
  }
}

function excludedAgents(projectRoot, mod, yaml) {
  const cfg = readModuleConfig(projectRoot, mod, yaml);
  if (!cfg || !Array.isArray(cfg.excluded_agents)) return [];
  return cfg.excluded_agents.filter(a => typeof a === 'string');
}

/**
 * ADR-004 C1 — an arriving module must carry a `config.yaml`.
 *
 * NOT required by AC3, and added deliberately after the positive control MEASURED the
 * hole: create `_bmad/bme/_portability/` in an installed project with no config.yaml and
 * this assertion reported `6 shipped bme module(s) arrived, 15 declared unit(s) resolve`
 * — exit 0 — on a tree whose four skills are unreachable. A module with no config declares
 * nothing, so the invocability half of the check has nothing to check and passes by
 * vacuity. That is a gate going green on the defect it was built to catch, which is the
 * failure `project-context.md` records twice from 2026-08-15 and which NFR10 exists to
 * prevent. Operator-approved 2026-08-30 as an addition to the story's scope.
 *
 * C1 is also not cosmetic on its own terms: the installer STAMPS the config's version, and
 * I137 is the recorded case of the one module copied without that stamp — a fresh,
 * successful install immediately failed Convoke's own health check and told a brand-new
 * user to go and update.
 */
function modulesWithoutConfig(arrived, projectRoot) {
  return arrived.filter(m => !isFile(path.join(projectRoot, '_bmad', 'bme', m, 'config.yaml')));
}

/** Modules whose config.yaml exists but does not parse — reported, never silent. */
function unparsableConfigs(projectRoot, arrived) {
  const yaml = loadYaml();
  const bad = [];
  for (const mod of arrived) {
    const p = path.join(projectRoot, '_bmad', 'bme', mod, 'config.yaml');
    if (!isFile(p)) continue;
    try {
      yaml.load(fs.readFileSync(p, 'utf8'));
    } catch (err) {
      bad.push({ module: mod, message: err.message });
    }
  }
  return bad;
}

module.exports = {
  RUNTIME_DATA_FILES,
  WRAPPER_RULES,
  shippedBmeModules,
  missingModules,
  missingRuntimeFiles,
  declaredUnits,
  missingWrappers,
  modulesWithoutConfig,
  unparsableConfigs,
  walkRequires,
};
