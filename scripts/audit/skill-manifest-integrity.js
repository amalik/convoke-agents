'use strict';

/**
 * Skill-manifest integrity audit (Story sp-1-2, promoted from tests/ 2026-09-05).
 *
 * WHAT THIS IS
 * ------------
 * A LINT over a tracked governance artifact — `_bmad/_config/skill-manifest.csv` —
 * cross-checked against the skills actually present in the tree. It asserts that every row
 * carries a canonical tier + intent, and that a set of spot-check rosters still match the
 * classification policy locked in sp-1-2's Dev Notes.
 *
 * WHY IT LIVES HERE AND NOT IN tests/
 * -----------------------------------
 * It reads live repo state by design: its subject IS the real manifest, and the roster
 * guard needs to know which skills genuinely exist on disk. A test doing that violates
 * `test-fixture-isolation` (project-context.md) — drift in the installed tree becomes a red
 * CI run across every Node version at once. So the live read lives here, alongside
 * `backlog-integrity.js` and `agent-surface-parity.js`, and
 * `tests/audit/skill-manifest-integrity.test.js` exercises the logic against fixtures.
 *
 * SCOPE — WHAT THIS DID *NOT* FIX
 * -------------------------------
 * This promotion covers ONE file. `tests/lib/portability-schema.test.js:51` still calls
 * `findProjectRoot()` and asserts against the live `skill-manifest.csv` — its header, its
 * 9-column row width, and any NON-EMPTY tier/intent value — so the `test-fixture-isolation`
 * violation is NOT resolved as a class, only for the file that moved here. Round 2
 * (2026-09-05) caught an earlier draft of this docblock claiming otherwise; Round 3 caught
 * that correction overstating what the sibling checks. Filed in `deferred-work.md`.
 *
 * WHAT IT DOES NOT PROVE
 * ----------------------
 * That the classifications are *correct* — only that they are present, canonical, and that
 * the spot-checked rosters have not silently decayed. Judgement about whether `bmad-x` is
 * really `pipeline` is a human call recorded in the manifest.
 *
 * REPORTING A FAILURE TO RUN IS NOT REPORTING CLEAN
 * -------------------------------------------------
 * Round 1 found the git half asserted by nothing: replacing `trackedSkillDirsAt`'s body with
 * `return []` left every test green and the audit printing PASS. Two changes close that: the
 * function throws a typed error rather than letting a git failure surface as a bare stack,
 * and an EMPTY result is itself a finding — because "no skills found" and "the guard could
 * not run" are the same observation, and the second must never render as success.
 */

const path = require('path');
const { execFileSync } = require('child_process');
const { findProjectRoot } = require('../update/lib/utils');
const { readManifest } = require('../portability/manifest-csv');

// The canonical classification vocabulary.
//
// Round 2 rejected importing these from `classify-skills.js`: that module WRITES the values
// this one POLICES, so a widened vocabulary there would silently widen the gate here
// (proven — adding a bogus tier to the writer made this audit accept it with zero test
// failures). A checker must not take its definition of "valid" from the thing it checks.
//
// They are therefore declared locally and PINNED against every other copy by
// `tests/audit/skill-manifest-integrity.test.js`, which fails if any copy drifts. Three
// other copies exist (`classify-skills.js`, `validate-classification.js`,
// `tests/lib/portability-schema.test.js`); collapsing all four into one shared module is
// filed in `deferred-work.md` rather than done here, because it touches two scripts this
// change does not otherwise open.
const VALID_TIERS = ['standalone', 'light-deps', 'pipeline'];

const VALID_INTENTS = [
  'think-through-problem',
  'define-what-to-build',
  'review-something',
  'write-documentation',
  'plan-your-work',
  'test-your-code',
  'discover-product-fit',
  'assess-readiness',
  'meta-platform',
];

// Where a tracked `SKILL.md` counts as evidence the product ships that skill.
//
// Test fixtures under `tests/` and sample trees under `_bmad-output/` carry real `SKILL.md`
// files for skills the product does not ship —
// `tests/fixtures/portability-project/_bmad/core/skills/bmad-distillator` is tracked right
// now. Counting those would let a fixture permanently block a legitimate retirement.
//
// `.claude/skills/` is included because two Convoke-authored skills genuinely live there and
// are tracked (`bmad-audit-skill-dirs`, `bmad-register-skill`) — Round 2 caught an earlier
// `_bmad/`-only filter excluding them. Most of that directory is generated and gitignored;
// only the tracked minority reaches this filter at all.
const PRODUCT_TREE_PREFIXES = ['_bmad/', '.claude/skills/'];

// Canonical meta-platform skills (AC #7, adjusted during sp-1-2 implementation).
//
// AC #7 originally listed 6 skills including `bmad-agent-bme-team-factory`, but that name
// lives in the AGENT manifest, not the skill manifest.
//
// CANDIDATES, not an assertion that all of them exist — see `resolveRoster()`. Upstream
// churns this set: v6.3 retired `bmad-init`, v6.10 renamed `bmad-builder-setup` ->
// `bmad-bmb-setup`. Both names are kept so the policy keeps getting checked on whichever the
// installed tree actually has.
const META_PLATFORM_SKILLS = [
  'bmad-init', // retired upstream in v6.3 — kept for older trees
  'bmad-help',
  'bmad-party-mode',
  'bmad-builder-setup', // renamed upstream in v6.10 ->
  'bmad-bmb-setup', //     ... this
  'bmad-agent-builder',
];

// Per AC #7, these are explicitly carved out from meta-platform.
const STANDALONE_UTILITIES = {
  'bmad-distillator': 'write-documentation',
  'bmad-advanced-elicitation': 'think-through-problem',
  'bmad-shard-doc': 'write-documentation',
  'bmad-index-docs': 'write-documentation',
};

// Per sp-1-2 Task 3's enumerated table — menu wrappers, not pipelines. Their dependencies
// column should be empty (menu options are not exporter deps).
const PERSONA_AGENTS = [
  'bmad-agent-analyst',
  'bmad-agent-pm',
  'bmad-agent-architect',
  'bmad-agent-ux-designer',
  'bmad-agent-tech-writer',
  'bmad-agent-dev',
  'bmad-agent-sm', // retired upstream — consolidated into Amelia
  'bmad-agent-quick-flow-solo-dev', // retired upstream — consolidated into Amelia
  'bmad-agent-qa', // retired upstream — consolidated into Amelia
];

// One policy table, not two lists. An earlier split into CIS_SAMPLES + CIS_STANDALONE let a
// name appear in the tier list only, where a missing row silently no-op'd every check on it
// — the 1-of-N degradation `resolveRoster` exists to prevent, reintroduced in the one path
// that bypassed it. `tier: null` means "intent is pinned, tier is not"
// (`bmad-cis-agent-storyteller` carries a sidecar memory file, so it is light-deps).
const CIS_POLICY = {
  'bmad-brainstorming': { intent: 'think-through-problem', tier: 'standalone' },
  'bmad-cis-agent-storyteller': { intent: 'think-through-problem', tier: null },
  'bmad-cis-agent-creative-problem-solver': { intent: 'think-through-problem', tier: 'standalone' },
};

// Known upstream retirements. Each entry is a claim that a specific skill is gone by
// upstream's choice — not a licence for the roster to shrink arbitrarily.
//
// Every roster has an entry here, including `cis`. Round 2 caught CIS being the one roster
// with no escape hatch: a legitimate upstream retirement there would have reddened CI with
// no declared way to record it, which is the exact failure `RETIRED` was built to prevent.
//
// Reviewed against upstream v6.12.0 on 2026-09-05. v6.11/v6.12 retired four more skills
// (`bmad-check-implementation-readiness`, `bmad-agent-tech-writer`, `bmad-index-docs`,
// `bmad-shard-doc`) but NONE are listed here, deliberately: `classify-skills.js` updates
// manifest rows in place and never deletes them, so their rows persist and the rosters still
// resolve. `bmad-index-docs` and `bmad-shard-doc` are additionally VENDORED by Convoke under
// `_bmad/core/`, so they remain part of the shipped product regardless of upstream. Add a
// name here only when its row is actually gone AND its files are gone.
const RETIRED = {
  metaPlatform: ['bmad-init', 'bmad-builder-setup'],
  personaAgents: ['bmad-agent-sm', 'bmad-agent-quick-flow-solo-dev', 'bmad-agent-qa'],
  standaloneUtilities: [],
  cis: [],
};

/** Raised when the tracked-skill enumeration cannot run at all (no git, not a repo). */
class GitUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GitUnavailableError';
  }
}

// A finding IS a problem — there is no severity axis. An earlier draft carried one, but
// every call site passed the same value and `main()` counted only that value, so the first
// other severity anyone added would have printed above a green PASS and exited 0. Round 2.
// Removing the axis is what makes that unrepresentable rather than merely unlikely.
const finding = (id, detail) => ({ id, detail });

/**
 * Narrow a candidate roster to the skills the manifest actually has.
 *
 * Why this exists (`derive-counts-from-source`): the rosters above name upstream-owned
 * skills, and upstream retires, renames, and relocates them without notice — v6.3 retired
 * `bmad-init`, v6.10 renamed `bmad-builder-setup`, the BMM agent consolidation retired
 * `bmad-agent-sm` / `-qa` / `-quick-flow-solo-dev`, and v6.11/v6.12 retired four more.
 * Asserting a hardcoded roster is present makes a legitimate upstream retirement look like a
 * Convoke regression — which is exactly what happened after the 2026-06-27 BMAD update.
 *
 * So: assert the CLASSIFICATION POLICY on the skills that exist, not the existence of a
 * roster we do not own.
 *
 * `expectedAbsent` pins WHICH members may be missing. Without it, a bare `present.length > 0`
 * check degrades an N-of-N assertion to 1-of-N: 8 of 9 persona agents could vanish and the
 * roster would still pass on the survivor. That makes decay undetectable — the very thing
 * this function argues against. (Code review 2026-08-10.)
 */
function resolveRoster({ names, rows, nameIdx, trackedSkillDirs, expectedAbsent = [], label }) {
  const findings = [];
  const findRow = (name) => rows.find((r) => r[nameIdx] === name);

  // A name may only be excused if the skill is genuinely GONE — not merely missing from the
  // manifest. Round 2 (2026-08-10) caught `bmad-distillator` listed as an upstream retirement
  // while 7 of its files were still tracked, turning a real manifest gap into a permanent,
  // audit-enforced exemption.
  //
  // Exact basename comparison. For directories `trackedSkillDirsAt` produces this is
  // equivalent to the `endsWith('/' + name)` form it replaced — every such path contains a
  // slash — so this is a clarity change, not a bug fix. It does matter for `resolveRoster`'s
  // own contract, which is exported and accepts arbitrary injected directories.
  const stillOnDisk = expectedAbsent.filter((n) => trackedSkillDirs.some((d) => path.basename(d) === n));
  if (stillOnDisk.length) {
    findings.push(
      finding(
        `${label}/manifest-gap`,
        `${stillOnDisk.join(', ')} is listed as retired upstream, but its files are still ` +
          `tracked in the product tree. That is a MANIFEST GAP (skill exists, row missing), ` +
          `not a retirement — add the row to skill-manifest.csv instead of excusing it.`
      )
    );
  }

  const absent = names.filter((n) => findRow(n) === undefined);
  const unexpected = absent.filter((n) => !expectedAbsent.includes(n));
  if (unexpected.length) {
    findings.push(
      finding(
        `${label}/roster-decay`,
        `${unexpected.join(', ')} disappeared from skill-manifest.csv without being declared ` +
          `a known upstream retirement. Either the row was wrongly deleted, or add it to ` +
          `RETIRED in this file in the same commit that observes the retirement.`
      )
    );
  }

  const reappeared = expectedAbsent.filter((n) => findRow(n) !== undefined);
  if (reappeared.length) {
    findings.push(
      finding(
        `${label}/stale-retirement`,
        `${reappeared.join(', ')} is listed as retired upstream but is present again — ` +
          `remove it from RETIRED.`
      )
    );
  }

  const present = names.filter((n) => findRow(n) !== undefined);
  if (present.length === 0) {
    findings.push(finding(`${label}/roster-empty`, `entire roster [${names.join(', ')}] is absent`));
  }

  return { present, findings };
}

/**
 * The whole audit, as a pure function over data. No filesystem, no git, no cwd — which is
 * what lets `tests/audit/` drive it against fixtures.
 */
function audit({ header, rows, trackedSkillDirs = [] }) {
  const findings = [];
  const nameIdx = header.indexOf('name');
  const tierIdx = header.indexOf('tier');
  const intentIdx = header.indexOf('intent');
  const depsIdx = header.indexOf('dependencies');

  for (const [label, idx] of [
    ['name', nameIdx],
    ['tier', tierIdx],
    ['intent', intentIdx],
    ['dependencies', depsIdx],
  ]) {
    if (idx === -1) {
      findings.push(finding('header/missing-column', `no "${label}" column in manifest header`));
    }
  }
  if (findings.length) return findings; // nothing below can be trusted without the columns

  if (rows.length === 0) {
    findings.push(finding('manifest/empty', 'skill-manifest.csv has no data rows'));
    return findings;
  }

  // An empty enumeration is a FAILURE TO RUN, not a clean bill of health: with no tracked
  // dirs, `manifest-gap` can never fire and every declared retirement is rubber-stamped.
  // Round 1 finding — the mutation that emptied this array left every gate green.
  if (trackedSkillDirs.length === 0) {
    findings.push(
      finding(
        'tracked-skills/empty',
        `no tracked SKILL.md directories found under ${PRODUCT_TREE_PREFIXES.join(' or ')}. The ` +
          `retirement guard cannot run, so RETIRED entries would be accepted unchecked. This is ` +
          `a failure to run, not a pass.`
      )
    );
  }

  // Rows shorter than the header cannot be read positionally. Detect and SKIP them rather
  // than dereferencing undefined — a stray line (a merge-conflict marker, a hand-edit) used
  // to throw a raw TypeError that discarded every finding collected so far. Round 1 finding.
  const wellFormed = [];
  for (const [i, row] of rows.entries()) {
    if (row.length < header.length) {
      findings.push(
        finding(
          'row/malformed',
          `row ${i + 1} has ${row.length} field(s), header declares ${header.length}: ` +
            `${JSON.stringify(row).slice(0, 120)}`
        )
      );
      continue;
    }
    wellFormed.push(row);
  }

  const findRow = (name) => wellFormed.find((r) => r[nameIdx] === name);

  // `findRow` returns the FIRST match, so a duplicate name exempts every later copy from
  // every policy check below. Round 1 finding: a bogus second `bmad-help` row produced an
  // entirely clean audit.
  const seen = new Map();
  for (const row of wellFormed) {
    const name = row[nameIdx];
    seen.set(name, (seen.get(name) || 0) + 1);
  }
  for (const [name, count] of seen) {
    if (count > 1) {
      findings.push(
        finding(
          'manifest/duplicate-name',
          `${name} appears ${count} times; only the first row is ever checked, so the ` +
            `duplicates are exempt from every policy assertion.`
        )
      );
    }
  }

  // 1. Every data row is classified, and classified with canonical values.
  for (const row of wellFormed) {
    const [name, tier, intent] = [row[nameIdx], row[tierIdx], row[intentIdx]];
    if (!tier || !intent) {
      findings.push(
        finding('row/unclassified', `${name}: tier="${tier || ''}" intent="${intent || ''}"`)
      );
      continue;
    }
    if (!VALID_TIERS.includes(tier)) {
      findings.push(finding('row/invalid-tier', `${name}: invalid tier "${tier}"`));
    }
    if (!VALID_INTENTS.includes(intent)) {
      findings.push(finding('row/invalid-intent', `${name}: invalid intent "${intent}"`));
    }
  }

  // 2. CIS agent skills — routed through the same roster guard as every other set, so a
  //    genuine upstream retirement can be declared rather than reddening CI forever.
  const cis = resolveRoster({
    names: Object.keys(CIS_POLICY),
    rows: wellFormed,
    nameIdx,
    trackedSkillDirs,
    expectedAbsent: RETIRED.cis,
    label: 'cis',
  });
  findings.push(...cis.findings);
  for (const name of cis.present) {
    const policy = CIS_POLICY[name];
    const row = findRow(name);
    if (row[intentIdx] !== policy.intent) {
      findings.push(finding('cis/intent', `${name}: expected ${policy.intent}, got "${row[intentIdx]}"`));
    }
    if (policy.tier !== null && row[tierIdx] !== policy.tier) {
      findings.push(finding('cis/tier', `${name}: expected ${policy.tier}, got "${row[tierIdx]}"`));
    }
  }

  // 3. testarch skills — derived from the manifest, never a hardcoded list.
  const testarchRows = wellFormed.filter((r) => r[nameIdx].startsWith('bmad-testarch-'));
  if (testarchRows.length < 3) {
    findings.push(
      finding('testarch/too-few', `expected >= 3 bmad-testarch-* rows, found ${testarchRows.length}`)
    );
  }
  for (const row of testarchRows) {
    if (row[intentIdx] !== 'test-your-code') {
      findings.push(
        finding('testarch/intent', `${row[nameIdx]}: expected test-your-code, got "${row[intentIdx]}"`)
      );
    }
  }

  // 4. Canonical meta-platform skills are pipeline + meta-platform.
  const meta = resolveRoster({
    names: META_PLATFORM_SKILLS,
    rows: wellFormed,
    nameIdx,
    trackedSkillDirs,
    expectedAbsent: RETIRED.metaPlatform,
    label: 'meta-platform',
  });
  findings.push(...meta.findings);
  for (const name of meta.present) {
    const row = findRow(name);
    if (row[tierIdx] !== 'pipeline') {
      findings.push(finding('meta-platform/tier', `${name}: expected pipeline, got "${row[tierIdx]}"`));
    }
    if (row[intentIdx] !== 'meta-platform') {
      findings.push(
        finding('meta-platform/intent', `${name}: expected meta-platform, got "${row[intentIdx]}"`)
      );
    }
  }

  // 5. Standalone utilities are NOT meta-platform (AC #7 carve-out).
  const utils = resolveRoster({
    names: Object.keys(STANDALONE_UTILITIES),
    rows: wellFormed,
    nameIdx,
    trackedSkillDirs,
    expectedAbsent: RETIRED.standaloneUtilities,
    label: 'standalone-utility',
  });
  findings.push(...utils.findings);
  for (const name of utils.present) {
    const row = findRow(name);
    const expected = STANDALONE_UTILITIES[name];
    if (row[intentIdx] !== expected) {
      findings.push(
        finding('standalone-utility/intent', `${name}: expected ${expected}, got "${row[intentIdx]}"`)
      );
    }
    if (row[tierIdx] !== 'standalone') {
      findings.push(
        finding('standalone-utility/tier', `${name}: expected standalone, got "${row[tierIdx]}"`)
      );
    }
  }

  // 6. Persona-only bmad-agent-* skills are standalone with empty deps.
  const personas = resolveRoster({
    names: PERSONA_AGENTS,
    rows: wellFormed,
    nameIdx,
    trackedSkillDirs,
    expectedAbsent: RETIRED.personaAgents,
    label: 'persona-agent',
  });
  findings.push(...personas.findings);
  for (const name of personas.present) {
    const row = findRow(name);
    if (row[tierIdx] !== 'standalone') {
      findings.push(finding('persona-agent/tier', `${name}: expected standalone, got "${row[tierIdx]}"`));
    }
    if (row[depsIdx] !== '') {
      findings.push(
        finding('persona-agent/deps', `${name}: expected empty dependencies, got "${row[depsIdx]}"`)
      );
    }
  }

  return findings;
}

/**
 * Directories of every tracked skill in the PRODUCT tree — this is what distinguishes
 * "upstream retired it" from "the row went missing".
 *
 * Throws `GitUnavailableError` rather than letting a git failure escape as a bare
 * `execFileSync` stack: the caller must be able to say "the guard could not run" instead of
 * rendering it as a pass. `stdio: 'pipe'` keeps git's own stderr out of the operator's
 * output, so the typed message is the only thing they read.
 */
function trackedSkillDirsAt(projectRoot) {
  let out;
  try {
    out = execFileSync('git', ['ls-files'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    throw new GitUnavailableError(
      `could not enumerate tracked files in ${projectRoot}: ${(err.stderr || err.message).toString().trim()}`
    );
  }
  return out
    .split('\n')
    .filter((f) => f.endsWith('/SKILL.md'))
    .map((f) => path.dirname(f))
    .filter((d) => PRODUCT_TREE_PREFIXES.some((p) => d.startsWith(p)));
}

const USAGE = [
  'Usage: skill-manifest-integrity.js [--project-root <path>]',
  '',
  '  Lints _bmad/_config/skill-manifest.csv against the skills present in the tree.',
  '  --project-root <path>   audit this tree instead of the enclosing project',
  '  --help                  show this message',
  '',
  'Exit codes: 0 pass, 1 could not run, 2 integrity problems found.',
].join('\n');

function parseArgs(args) {
  if (args.includes('--help') || args.includes('-h')) return { help: true };

  const flagPositions = args.reduce((acc, a, i) => (a === '--project-root' ? [...acc, i] : acc), []);
  if (flagPositions.length > 1) {
    return { error: '--project-root given more than once' };
  }

  const rootFlag = flagPositions.length ? flagPositions[0] : -1;
  // -1 (not the falsy 0) when the flag is absent, so index 0 is not accidentally excused
  // from the argument checks below.
  const rootValueIdx = rootFlag === -1 ? -1 : rootFlag + 1;

  const known = new Set(['--project-root', '--help', '-h']);
  // Positional arguments are rejected, not ignored. Round 2: a bare path was silently
  // dropped and the audit ran against the enclosing project while printing PASS — the same
  // wrong-tree harm the empty-value guard below exists to prevent, in its commonest form.
  const stray = args.filter((a, i) => i !== rootValueIdx && !known.has(a));
  if (stray.length) {
    return { error: `unknown argument(s): ${stray.join(', ')}` };
  }

  if (rootFlag === -1) return { projectRoot: null };

  const value = args[rootValueIdx];
  // An empty string resolves to cwd, which would silently audit the WRONG tree.
  if (value === undefined || value === '') return { error: '--project-root requires a path' };
  return { projectRoot: path.resolve(value) };
}

function main(argv) {
  const parsed = parseArgs(argv.slice(2));

  if (parsed.help) {
    console.log(USAGE);
    return 0;
  }
  if (parsed.error) {
    console.error(`error: ${parsed.error}\n`);
    console.error(USAGE);
    return 1;
  }

  let projectRoot = parsed.projectRoot;
  if (projectRoot === null) {
    projectRoot = findProjectRoot();
    if (!projectRoot) {
      console.error('error: no BMad project found from the current directory.');
      console.error('Run inside a project, or pass --project-root <path>.');
      return 1;
    }
  }

  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');

  let header;
  let rows;
  try {
    ({ header, rows } = readManifest(manifestPath));
  } catch (err) {
    console.error(`error: could not read ${manifestPath}`);
    console.error(`  ${err.message}`);
    return 1;
  }

  let trackedSkillDirs;
  try {
    trackedSkillDirs = trackedSkillDirsAt(projectRoot);
  } catch (err) {
    console.error(`error: ${err.message}`);
    console.error('The retirement guard cannot run without git, so this is a failure, not a pass.');
    return 1;
  }

  const findings = audit({ header, rows, trackedSkillDirs });

  console.log(`Skill-manifest integrity: ${path.relative(projectRoot, manifestPath)}`);
  console.log(`  ${rows.length} rows, ${trackedSkillDirs.length} tracked product skill dirs\n`);

  for (const f of findings) console.log(`  BROKEN ${f.id}: ${f.detail}`);

  if (findings.length) {
    console.log(`\n✗ FAIL — ${findings.length} integrity problem(s) across ${rows.length} rows.`);
    return 2;
  }
  console.log(
    `✓ PASS — ${rows.length} rows classified with canonical tier + intent; spot-check rosters intact.` +
      `\n  Proves the manifest is well-formed and policy-conformant, NOT that each judgement is right.`
  );
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  audit,
  resolveRoster,
  trackedSkillDirsAt,
  parseArgs,
  main,
  GitUnavailableError,
  PRODUCT_TREE_PREFIXES,
  VALID_TIERS,
  VALID_INTENTS,
  META_PLATFORM_SKILLS,
  STANDALONE_UTILITIES,
  PERSONA_AGENTS,
  CIS_POLICY,
  RETIRED,
};
