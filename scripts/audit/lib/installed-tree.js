'use strict';

/**
 * installed-tree.js — assertions about what actually ARRIVES in a user's project.
 *
 * Story dist-2.4 (FR13). The question this answers is narrower than "did the tarball
 * contain it": a file can be in `package.json` `files[]`, reach
 * `node_modules/convoke-agents/`, and still never reach the project where the code
 * looks for it. `refresh-installation.js` copies `_bmad/_config/` PER NAMED FILE
 * (`:551`, `:585`), not as a directory, and `.claude/skills/` wrappers are GENERATED
 * from declarations (`:782`, `:811`, `:837`, `:863`, `:914`) — never copied. Those numbers are
 * re-derived and anchor-checked in WRAPPER_RULES below; this header carried the pre-correction
 * set until Round 2, where three of the five pointed at comments and guards.
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
    // `:585` opens the PACKAGE copy that seeds the project file; `:551` — cited until Round 2 —
    // only declares the destination path, the same declaration-not-a-write defect corrected on
    // the agent-manifest entry below. Missing this sibling is why the alarm is now an AND.
    arrivesVia: 'scripts/update/lib/refresh-installation.js:585',
    arrivesViaToken: 'packageManifest',
    why: 'convoke-export resolves every skill through it — absence is I139 exactly: the bin exits non-zero on a fresh install.',
  },
  {
    file: '_bmad/_config/agent-manifest.csv',
    readSite: 'scripts/update/lib/validator.js:286',
    alsoRead: ['scripts/portability/export-engine.js:168'],
    // `:308` is `fs.writeFile(manifestPath, …)` — the write itself. The first draft cited
    // `:237`, which only DECLARES the destination path; deleting the write and leaving the
    // declaration would have kept the rot alarm green. Review 2026-08-30.
    arrivesVia: 'scripts/lib/agent-manifest-generator.js:308',
    arrivesViaToken: 'fs.writeFile(manifestPath',
    why: 'the installer regenerates it during refresh, so a post-install absence means the regeneration step did not run.',
  },
  {
    file: '_bmad/_config/taxonomy.yaml',
    readSite: 'scripts/convoke-doctor.js:980',
    alsoRead: ['scripts/lib/artifact-utils.js:125'],
    // `:1038` is the `mergeTaxonomy(projectRoot)` call that creates the file. The first
    // draft cited `:1040`, which is the `changes.push('Created …taxonomy.yaml…')` LOG
    // LINE inside `if (taxonomyResult.created)` — so the rot alarm passed merely because
    // a string literal mentioned the basename. Deleting the real call and leaving the log
    // would have kept it green. Review 2026-08-30.
    arrivesVia: 'scripts/update/lib/refresh-installation.js:1038',
    arrivesViaToken: 'mergeTaxonomy',
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
    // `:642` is the read (`path.join(projectRoot, OUTPUT_CSV_REL)` feeding
    // `readExistingCsv`). The first draft cited `:34`, which is that script's OUTPUT path
    // constant — the WRITE side. Citing a write as a read is exactly the confusion this
    // manifest gives as its reason for refusing the grep, reproduced inside the manifest
    // itself. Review 2026-08-30.
    alsoRead: ['scripts/audit/audit-bmm-dependencies.js:642'],
    // The token must DISCRIMINATE, not merely appear. `OUTPUT_CSV_REL` alone matched both
    // `:642` (the read) and `:34` (the write-side declaration), so reverting to the wrong
    // citation still passed. Anchored on the join that builds the read path instead.
    alsoReadToken: 'path.join(projectRoot, OUTPUT_CSV_REL)',
    arrivesVia: null,
    why:
      'NOTHING puts it in the project today — this is the FR13 red target. Its "must arrive" status is a ' +
      'DECISION Story 2.5 made, not a property of the code: convoke-doctor treats absence as a soft ' +
      'governance warning by design. If 2.5 revisits that, this entry leaves the manifest and the ' +
      'dist-2-4 red demonstration must be re-based.',
  },
];

/** Wrapper-name rules, one per generator code path. See `declaredUnits`. */
/**
 * Wrapper-name rules, one per generator code path. See `declaredUnits`.
 *
 * `site` must name the LOOP OR GATE that emits the wrapper, and `anchor` is the text that
 * line must still contain — checked by `tests/audit/installed-tree.test.js`. The first
 * draft cited `:836`, `:862` and `:909`, which are a section comment, an `if` guard and
 * another comment; the accompanying test asserted only that the file had that many lines,
 * so nothing caught it. Both halves fixed 2026-08-30 after review.
 *
 * `derivedFrom` is honest about which basis each rule has. Four are read off the generator.
 * `standaloneWorkflow` is NOT: there is no generic standalone-workflow generator — block 6d
 * is `if (artifactsConfig && !isSameRoot)` over `artifactsConfig.workflows` and is
 * `_artifacts`-specific. That rule is derived from ADR-004 C2 (declared ⇒ invocable) and
 * applies to every arriving module ON PURPOSE, so that `dist-2-6` giving `_portability` a
 * config with `standalone: true` workflows goes RED until the generator is extended to
 * emit them. Demanding a wrapper nothing yet generates is the correct behaviour; claiming
 * the rule was read off a generator was not.
 */
const WRAPPER_RULES = {
  vortexAgent:        { site: 'scripts/update/lib/refresh-installation.js:782', anchor: 'for (const agent of AGENTS)',            derivedFrom: 'generator', name: id => `bmad-agent-bme-${id}` },
  gyreAgent:          { site: 'scripts/update/lib/refresh-installation.js:811', anchor: 'for (const agent of GYRE_AGENTS)',       derivedFrom: 'generator', name: id => `bmad-agent-bme-${id}` },
  extraBmeAgent:      { site: 'scripts/update/lib/refresh-installation.js:837', anchor: 'for (const agent of EXTRA_BME_AGENTS)',  derivedFrom: 'generator', name: id => `bmad-agent-bme-${id}` },
  enhanceWorkflow:    { site: 'scripts/update/lib/refresh-installation.js:863', anchor: 'enhanceConfig.workflows',               derivedFrom: 'generator', name: n => `bmad-enhance-${n}` },
  standaloneWorkflow: { site: 'scripts/update/lib/refresh-installation.js:914', anchor: 'artifactsConfig.workflows',             derivedFrom: 'ADR-004 C2', name: n => `${n}` },
};

/** `_bmad/bme/*` entries in a `files[]` array, normalised to bare module names. */
function shippedBmeModules(files) {
  const out = [];
  const unresolvable = [];
  if (!Array.isArray(files)) return Object.assign(out, { unresolvable });
  for (const entry of files) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    const m = /^_bmad\/bme\/([^/]+)\/?$/.exec(trimmed);
    // A glob is npm-legal in `files[]` and cannot be resolved to a module name here. The
    // first fix SKIPPED it — which silently shrank the expectation set, the precise
    // damaged-input-reduces-coverage class this module exists to prevent, and Round 2 showed
    // a run could then exit 0 having never looked at the globbed module. Reported instead.
    // METACHARACTERS TESTED FIRST, on the whole entry. Testing them on `m[1]` meant the
    // strict regex had to match before the glob could be reported — so only a glob in the
    // LAST segment was caught, and `_bmad/bme/**/*` or `_bmad/bme/*/subdir/` fell through
    // `if (!m) continue` and vanished with no diagnostic. Both Round 3 layers reproduced a
    // run exiting 0 having never looked at the globbed module: the same silent
    // coverage-shrink the `unresolvable` channel was added to close, through a shape the
    // first fix did not see.
    if (/[*?[\]{}!]/.test(trimmed)) { unresolvable.push(trimmed); continue; }
    if (!m) continue;
    out.push(m[1]);
  }
  // DEDUPLICATED. `_bmad/bme/_portability/` and `_bmad/bme/_portability` both normalise to
  // one module, and without this every per-module loop ran twice: the same `did not arrive`
  // line printed twice, and the success line counted two modules where one exists. Round 3
  // raised it as "exactly ONE mutually exclusive verdict per module is not exclusive".
  //
  // A consequence worth stating rather than leaving as a puzzle: with dedup in place,
  // `declared.length` and `arrived.length` are necessarily equal wherever the success line
  // prints, because any absent module emits a finding and suppresses that line. The CLI uses
  // `arrived.length` there because it is what the sentence claims; no test can distinguish
  // the two, and pretending otherwise would be a check that cannot fail.
  const seen = new Set();
  const deduped = out.filter(m => (seen.has(m) ? false : (seen.add(m), true)));
  return Object.assign(deduped, { unresolvable });
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
 * a workflow is declared by `standalone: true`, but the Enhance path (`:863`) emits a
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
  const malformed = [];
  const excludedCounts = new Map();

  // `honoursExclusions` mirrors the generator EXACTLY rather than applying a uniform rule.
  // The Vortex loop (`:783`) and the Gyre loop (`:812`) skip excluded agents; the
  // EXTRA_BME loop (`:837`) has no exclusion check at all and emits unconditionally.
  // Filtering that bucket — as the first draft did — meant an `excluded_agents` entry in
  // `_team-factory/config.yaml` would drop a wrapper from the CHECK that the installer
  // still generates: a skew in the fail-open direction. Review 2026-08-30.
  const agentBuckets = [
    { list: registry.AGENTS || [], module: () => '_vortex', rule: 'vortexAgent', honoursExclusions: true },
    { list: registry.GYRE_AGENTS || [], module: () => '_gyre', rule: 'gyreAgent', honoursExclusions: true },
    { list: registry.EXTRA_BME_AGENTS || [], module: a => a.submodule, rule: 'extraBmeAgent', honoursExclusions: false },
  ];

  for (const bucket of agentBuckets) {
    for (const agent of bucket.list) {
      const mod = bucket.module(agent);
      // A registry entry whose `submodule` field is renamed or absent used to yield
      // `present.has(undefined)` === false and vanish from the expectation set without a
      // word — a shape change in the audited package quietly shrinking what is checked.
      // Surfaced instead, and the CLI reports it. Review 2026-08-30.
      if (mod === undefined || mod === null || mod === '') {
        malformed.push({ id: agent.id, rule: bucket.rule, reason: 'registry entry declares no submodule' });
        continue;
      }
      // "declared by an ARRIVING module": a wrapper for an agent whose module never
      // landed would point at a file that is not there, so it is the module's absence
      // that is the finding — already reported by missingModules — not the wrapper's.
      if (!present.has(mod)) continue;
      if (bucket.honoursExclusions && excludedAgents(projectRoot, mod, yaml).includes(agent.id)) {
        excludedCounts.set(mod, (excludedCounts.get(mod) || 0) + 1);
        continue;
      }
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

  // Per-module accounting, computed BEFORE dedup and BEFORE filtering, because callers need
  // to tell these cases apart and Round 2 proved collapsing them produces FALSE findings:
  //   declared — units this module contributed
  //   excluded — units suppressed by the operator's `excluded_agents` opt-out
  // declared 0 AND excluded 0 is genuine vacuity (ADR-004 C1 second form). declared 0 with
  // excluded > 0 is a SUPPORTED configuration (`refresh-installation.js:48-51`), and calling
  // it a packaging defect turns a correct install red — reproduced against a `_gyre` config
  // excluding both its agents.
  const byModule = {};
  for (const m of arrived) byModule[m] = { declared: 0, excluded: 0 };
  for (const u of units) if (byModule[u.module]) byModule[u.module].declared++;
  for (const [mod, n] of excludedCounts) if (byModule[mod]) byModule[mod].excluded = n;

  // Dedup by wrapper name — one wrapper path is one assertion. But a collision is itself a
  // defect (two modules fighting over one `.claude/skills/` path), and the first draft hid
  // it: dedup kept the first module and the loser then reported "declares no invocable unit".
  // Surfaced as its own finding; `byModule` is computed pre-dedup so nothing is orphaned.
  const byName = new Map();
  const duplicates = [];
  for (const u of units) {
    const prev = byName.get(u.name);
    if (prev) {
      if (prev.module !== u.module) duplicates.push({ name: u.name, modules: [prev.module, u.module] });
      continue;
    }
    byName.set(u.name, u);
  }
  return { units: [...byName.values()], malformed, byModule, duplicates };
}

/**
 * Declared units with no usable `.claude/skills/<name>/SKILL.md` (ADR-004 C2).
 *
 * NON-EMPTY, not merely present. `fs.ensureDir` + a truncating `writeFile` that never
 * completes leaves a 0-byte wrapper, and a 0-byte SKILL.md is not invocable — accepting it
 * would be presence-checking again, one level down, which is the whole objection this
 * module exists to answer. Review 2026-08-30.
 */
function missingWrappers(units, projectRoot) {
  return units.filter(u => {
    const p = path.join(projectRoot, '.claude', 'skills', u.name, 'SKILL.md');
    try {
      const st = fs.statSync(p);
      return !st.isFile() || st.size === 0;
    } catch {
      return true;
    }
  });
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
 * commented-out or string-literal `require` reads as missing. **Not latent in the tree —
 * only latent on the bin graph.** An earlier version of this comment said "no bin has
 * one", which was true of the 14 bin ENTRY files and misleading about everything else:
 * `_bmad/bme/_team-factory/lib/writers/registry-writer.js:323` already carries a quoted
 * require inside a comment, and is unreachable from a bin only by accident of the current
 * import graph. One new relative import turns the `publish`-gating job red on a healthy
 * package. Tracked as T101(b); corrected here 2026-08-30 after review. Only
 * RELATIVE specifiers (`./`, `../`) are followed; a bare package specifier is resolved
 * and then treated as a leaf. No AST library: `backlog-integrity.js` set the precedent
 * that a hand-rolled parser gets fenced in rather than extended.
 *
 * @param {string} entryFile
 * @param {{maxFiles?: number}} [opts]
 * @returns {{missing: {spec: string, from: string}[], capHit: boolean, visited: number}}
 */
/** Single home for the walk's file cap — the caller's error message reads it from here
 *  rather than repeating the literal, which would let the two drift. Review 2026-08-30. */
const DEFAULT_MAX_FILES = 500;

function walkRequires(entryFile, opts = {}) {
  const maxFiles = opts.maxFiles === undefined ? DEFAULT_MAX_FILES : opts.maxFiles;
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
        // Keyed on spec+file, not spec alone. `./utils` unresolvable from two different
        // directories is two defects, and reporting one hides the other.
        const key = `${spec}\u0000${file}`;
        if (!missing.has(key)) missing.set(key, { spec, from: file });
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

/**
 * Where to resolve `js-yaml` from, newest first. Set by the CLI to the INSTALLED package root.
 *
 * WHY THIS EXISTS — CI run 33323351907, main went red. `js-yaml` is a runtime dependency of
 * `convoke-agents`, so a bare `require` finds it in `$REPO/node_modules` on any developer
 * machine. The `fresh-install` job runs **no `npm ci`** — deliberately, and its own comment
 * says so: *"the script needs no repo dependencies (verified against a clean clone)"* — so on
 * the runner `$REPO/node_modules` does not exist and the auditor died mid-run.
 *
 * That is the exact defect class this harness was built to catch, committed inside the
 * harness: code that works in THIS repo and nowhere else. I135, I137 and I139 are the three
 * recorded instances in `try-fresh-install.sh`'s header; this is a fourth, and the only one
 * whose victim was the auditor rather than the product.
 *
 * The installed tree is the right source: `js-yaml` ships as a runtime dependency of the
 * package under test, so it is present there by construction, and the harness already loads
 * `manifest-csv.js` the same way. It is third-party code, not the artifact being audited, so
 * this does not weaken the "run the auditor from the repo" rule the header states.
 */
let yamlRoots = [];

/** Point yaml resolution at an installed package root. Call before any config is read. */
function setYamlResolutionRoot(dir) {
  yamlRoots = dir ? [dir] : [];
}

function loadYaml() {
  // Installed tree first, then the ordinary require. The fallback is what keeps the unit
  // tests and local runs working without a packageRoot.
  if (yamlRoots.length) {
    try {
      return require(require.resolve('js-yaml', { paths: yamlRoots }));
    } catch { /* fall through to the bare require below */ }
  }
  try {
    return require('js-yaml');
  } catch (err) {
    // Fail LOUD. Returning a null parser here would make every config read come back
    // empty, every module declare nothing, and the wrapper check pass while asserting
    // nothing — the exact shape of the four fail-open defects this harness records.
    throw new Error(
      `installed-tree: js-yaml could not be loaded from ${yamlRoots.length ? yamlRoots.join(', ') + ' or ' : ''}the ordinary require path (${err.message})`,
      { cause: err }
    );
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

/**
 * The same vacuity, one level down — modules that arrive, carry a `config.yaml`, and still
 * declare nothing.
 *
 * `modulesWithoutConfig` closed only the MISSING-FILE form. Review 2026-08-30 measured the
 * other form and it is not theoretical: a `config.yaml` containing just `version: 4.0.1`
 * passes both the C1 file check and the parse check, contributes zero units, and the run
 * reports `2 shipped bme module(s) arrived, 2 declared unit(s) resolve` — exit 0 — on a
 * `_portability` holding four skills on disk that no operator can invoke. Identical
 * consequence to the hole C1 was added for, so the same argument closes it.
 *
 * Operator-approved 2026-08-30 as a second scope addition beyond AC3 and beyond ADR-004 C1
 * as written. **It constrains `dist-2-6`:** conforming `_portability` means its config must
 * DECLARE the four skills, not merely exist.
 *
 * A module legitimately declaring nothing has no place in `files[]` under C3 — an
 * operator-facing surface that nothing declares is unreachable by construction.
 */
function modulesDeclaringNothing(arrived, byModule, projectRoot) {
  return arrived.filter(m => {
    if (!isFile(path.join(projectRoot, '_bmad', 'bme', m, 'config.yaml'))) return false;
    const acct = byModule && byModule[m];
    if (!acct) return false;
    // Excluded-by-operator is not vacuity, and an unparsable config is already reported by
    // `unparsableConfigs` — reporting it here too gave two findings for one cause, the second
    // untrue. Both carve-outs added after Round 2 reproduced them.
    if (acct.excluded > 0) return false;
    if (!configParses(projectRoot, m)) return false;
    return acct.declared === 0;
  });
}

/** Whether a module's config.yaml parses — keeps one cause to one finding. */
function configParses(projectRoot, mod) {
  const yaml = loadYaml();
  const p = path.join(projectRoot, '_bmad', 'bme', mod, 'config.yaml');
  if (!isFile(p)) return false;
  try { yaml.load(fs.readFileSync(p, 'utf8')); return true; } catch { return false; }
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
  setYamlResolutionRoot,
  RUNTIME_DATA_FILES,
  DEFAULT_MAX_FILES,
  WRAPPER_RULES,
  shippedBmeModules,
  missingModules,
  missingRuntimeFiles,
  declaredUnits,
  missingWrappers,
  modulesWithoutConfig,
  modulesDeclaringNothing,
  configParses,
  unparsableConfigs,
  walkRequires,
};
