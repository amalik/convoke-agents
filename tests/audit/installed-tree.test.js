'use strict';

/**
 * Tests for the FR13 installed-tree assertion (story dist-2.4).
 *
 * WHY THESE ARE NOT OPTIONAL
 * --------------------------
 * `try-fresh-install.sh` has shipped at least four checks that reported PASS while doing
 * nothing — a bin loop that could not fail for a MISSING bin, a `set -u` abort that bash
 * reported as exit 0, a `for`-list command substitution that made the loop run zero times,
 * and a `2>/dev/null` that turned any extractor crash into the pass value. AC7 exists
 * because of that table: every assertion added here is shown failing on a deliberately
 * broken input AND passing on a good one, in both directions, before it is believed.
 *
 * `test-fixture-isolation`: every case builds its own tmp tree. Nothing reads PACKAGE_ROOT
 * except the citation-rot tests, which are ABOUT this repository's source and say so.
 */

const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { PACKAGE_ROOT, removeTempDirSync } = require('../helpers');

const {
  RUNTIME_DATA_FILES,
  WRAPPER_RULES,
  shippedBmeModules,
  missingModules,
  missingRuntimeFiles,
  declaredUnits,
  missingWrappers,
  modulesWithoutConfig,
  modulesDeclaringNothing,
  unparsableConfigs,
  walkRequires,
} = require('../../scripts/audit/lib/installed-tree');

const CLI = path.join(PACKAGE_ROOT, 'scripts', 'audit', 'assert-installed-tree.js');

/**
 * The citation predicate. Defined ONCE and used by both the rot alarms and the guards that
 * prove those alarms discriminate.
 *
 * Round 2 found the previous arrangement failing in both directions. The alarm accepted
 * `basename || token` — an OR — so a citation carrying a token was still satisfied by any
 * line merely mentioning the file, and all three citations Round 1 had disproved passed when
 * reverted. And the guard meant to prove the alarm worked never invoked it, so deleting the
 * alarm's assertion left the suite fully green. An alarm and a guard that share no code
 * cannot check each other.
 *
 * `anchor` is what the line MUST contain. When one is given it is authoritative — the
 * basename is not an escape hatch, because the whole failure mode is a log line or a path
 * declaration that mentions the file without being the read or the write.
 */
/**
 * Run the citation alarm over {site, anchor} pairs; return those that failed.
 *
 * THE ALARM ITSELF, not a copy. The real citation tests and the guards that prove the alarm
 * discriminates both call this, so a mutation weakening it breaks the guards too. Round 2
 * caught the previous arrangement: the guard exercised its own inline logic while the alarm
 * inlined separate assertions, so deleting the alarm's assertion left the suite fully green.
 * An alarm and a guard that share no code cannot check each other — true twice in this file
 * before it was true once.
 */
function auditCitations(pairs) {
  return pairs.filter(({ site, anchor, claim }) => !citationHolds(site, anchor, claim));
}

/**
 * Which anchors may stand for which kind of claim.
 *
 * AN ALLOWLIST, AND THE DIRECTION IS THE POINT. Round 1 removed the `:NNN` from these citations and
 * left content-uniqueness as the only test, which accepted anything occurring once — a log line, a
 * comment, the `console.warn` from the `catch` that runs when seeding FAILED. Round 2 then showed a
 * DENYLIST of line shapes could not close that: it missed a `changes.push` whose string sits on the
 * next line, an `if (verbose) {` block opener, a `require` destructure, a `module.exports` member and
 * a trailing comment — four more shapes, each inviting a fifth regex.
 *
 * So the test is inverted. A denylist fails OPEN on a shape nobody thought of, which is how every one
 * of those got through with the suite green. An allowlist fails CLOSED: an unrecognised shape is
 * rejected and whoever introduced it adds it deliberately. A false red costs a conversation; a false
 * green cost `T181` an operator's config.
 *
 * It is also per CLAIM, because the old predicate was write-semantics wearing a kind-agnostic name:
 * it rejected a `const x = path.join(...)` line, which is exactly what all nine READ sites cite, so
 * it forbade the conversion the same commit's comment called available.
 */
const ADMISSIBLE_ANCHOR = Object.freeze({
  // A GENERATOR claim names the loop that emits the wrapper.
  generates: /^\s*for\s*\(|\.(forEach|map)\s*\(/,
  // An ARRIVAL claim names the call that PUTS THE FILE THERE: a write/copy primitive, or a
  // delegating seeder invoked on the project or package root (`mergeTaxonomy(projectRoot)`).
  arrives: /fs\.(writeFile|writeFileSync|copy|outputFile|move|appendFile)\s*\(|^\s*(const\s+\w+\s*=\s*)?(await\s+)?\w+\((projectRoot|packageRoot)\b/,
  // A READ claim names where the reader resolves or opens the path.
  reads: /^\s*(const|let)\s+\w+\s*=\s*path\.join\(|fs\.(readFile|readFileSync|existsSync)\s*\(/,
});

/**
 * A citation holds when it resolves to exactly one line AND that line is an admissible anchor for
 * the kind of claim the record makes.
 *
 * TWO CITATION KINDS COEXIST and the shape of `site` says which. `path` is ANCHORED — the anchor is a
 * unique snippet and the line is resolved from it; eight of these. `path:NNN` is LINE-CITED — nine of
 * these, seven of which carry no token of their own so their anchor is a bare basename that
 * legitimately recurs, which is why the number is still load-bearing there. Both kinds are now
 * checked for admissibility, so the nine read sites are covered by something for the first time.
 *
 * `claim` is required. Omitting it rejects, rather than defaulting to a kind that might pass.
 */
function citationHolds(site, anchor, claim) {
  const rule = ADMISSIBLE_ANCHOR[claim];
  if (!rule || !anchor) return false;
  const [rel, lineNo, ...rest] = String(site).split(':');
  // `!rel` is REDUNDANT with the `isFile` check below — an empty `rel` resolves to PACKAGE_ROOT, a
  // directory. Removing it alone survives mutation, so it is defence-in-depth rather than an untested
  // path; recorded so it is not re-derived as a gap. `rest.length` is not redundant and is pinned.
  if (!rel || rest.length > 0) return false;
  const abs = path.join(PACKAGE_ROOT, rel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return false;
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  let line;
  if (lineNo === undefined) {
    const at = anchorLine(rel, anchor);
    if (at === 0) return false;           // absent or ambiguous
    line = lines[at - 1];
  } else {
    line = lines[Number(lineNo) - 1];
    if (line === undefined || !line.includes(anchor)) return false;
  }
  return rule.test(line);
}

/** Count of `needle` in `hay`, counting overlapping matches — so a self-overlapping anchor reads as
 *  ambiguous rather than unique, which errs toward rejection. */
function occurrencesOf(hay, needle) {
  // This guard prevents a HANG, not a wrong answer: without it an empty needle loops forever, so its
  // mutant hangs instead of reddening. That is why it is a guard and not something a test can kill —
  // `citationHolds` also rejects an empty anchor before reaching here.
  if (!needle) return 0;
  let n = 0;
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + 1)) n++;
  return n;
}

/** The 1-based line an anchor resolves to, for diagnostics. 0 when it does not resolve uniquely. */
function anchorLine(site, anchor) {
  const abs = path.join(PACKAGE_ROOT, String(site).split(':')[0]);
  // `isFile` as well as `existsSync`: a directory passed `existsSync` and then threw EISDIR out of
  // the rot alarm, where an assertion was written for it (Round 2).
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return 0;
  const src = fs.readFileSync(abs, 'utf8');
  if (occurrencesOf(src, anchor) !== 1) return 0;
  return src.slice(0, src.indexOf(anchor)).split('\n').length;
}

const created = [];
function tmp(prefix = 'convoke-tree-') {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  created.push(d);
  return d;
}
after(() => { while (created.length) removeTempDirSync(created.pop()); });

function write(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body, 'utf8');
}

// ─── AC4: the manifest is real and its citations still resolve ───

describe('RUNTIME_DATA_FILES — the curated manifest', () => {
  it('is non-empty (an empty list is a check that cannot fail)', () => {
    assert.ok(RUNTIME_DATA_FILES.length > 0);
  });

  it('names bmm-dependencies.csv, which the story\'s red demonstration depends on', () => {
    assert.ok(RUNTIME_DATA_FILES.some(e => e.file === '_bmad/_config/bmm-dependencies.csv'));
  });

  it('gives every entry a file, a read site and a reason', () => {
    for (const e of RUNTIME_DATA_FILES) {
      assert.match(e.file, /^_bmad\//, `${e.file} is not a project-relative _bmad path`);
      assert.match(e.readSite, /^scripts\/.+:\d+$/, `${e.file} has no <path>:<line> read site`);
      // T230: `arrivesVia` is ANCHORED — bare path, line resolved from `arrivesViaToken`. A number
      // here means the conversion was reverted.
      for (const s of e.alsoRead || []) {
        // EITHER shape is allowed, because conversion is meant to be possible one site at a time.
        // Round 2: a guard requiring `:NNN` here made the doc's "convertible today" false by
        // forbidding it. An ANCHORED entry needs a token, or there is nothing to resolve it from.
        assert.match(s, /^scripts\/.+?(:\d+)?$/, `${e.file}: alsoRead entry ${s} is not a path`);
        if (!/:\d+$/.test(s)) {
          assert.ok(e.alsoReadToken, `${e.file}: alsoRead ${s} is anchored but the entry has no alsoReadToken`);
        }
      }
      if (e.arrivesVia) {
        assert.doesNotMatch(e.arrivesVia, /:\d+$/, `${e.file}: arrivesVia carries a line number again`);
        // Length does NOT imply uniqueness and this guard never claimed to supply it — uniqueness is
        // enforced by the alarm. `seedBmmDependencies(projectRoot` is 31 characters and occurs twice.
        // What this rejects is a BARE SYMBOL, which is the shape that was ambiguous before T230.
        assert.ok(e.arrivesViaToken && e.arrivesViaToken.length > 20,
          `${e.file}: arrivesViaToken must be a snippet, not a bare symbol`);
      }
      assert.ok(e.why && e.why.length > 20, `${e.file} has no stated reason`);
    }
  });

  // THE ROT ALARM. Curation is weaker than derivation and this is the compensating
  // control: if someone moves the code that reads one of these files, the citation
  // stops resolving and this fails, rather than the manifest quietly going stale.
  it('every cited call site exists and that exact line still mentions the file', () => {
    // Each site carries the token that applies to IT, not a token pooled across the entry.
    // Round 1 review found three citations pointing at something other than the read or
    // write they claimed — a log line, an output-path constant on the WRITE side, and a
    // destination declaration — all of which passed because the old check accepted any line
    // merely mentioning the basename anywhere in the entry.
    const sites = RUNTIME_DATA_FILES.flatMap(e => [
      { site: e.readSite, entry: e, token: e.token, claim: 'reads' },
      ...(e.alsoRead || []).map(s => ({ site: s, entry: e, token: e.alsoReadToken, claim: 'reads' })),
      ...(e.arrivesVia ? [{ site: e.arrivesVia, entry: e, token: e.arrivesViaToken, claim: 'arrives' }] : []),
    ]);
    assert.ok(sites.length >= RUNTIME_DATA_FILES.length);
    for (const { site, entry, token, claim } of sites) {
      const [rel, lineNo] = site.split(':');
      const abs = path.join(PACKAGE_ROOT, rel);
      assert.ok(fs.existsSync(abs), `${site} — file no longer exists`);
      const lines = fs.readFileSync(abs, 'utf8').split('\n');
      // An ANCHORED site (no `:NNN`, T230) has no line to bound-check; its line is resolved from the
      // anchor and `citationHolds` rejects an anchor that is absent or ambiguous.
      const line = lineNo === undefined
        ? lines[anchorLine(site, token) - 1]
        : lines[Number(lineNo) - 1];
      assert.ok(line !== undefined, `${site} — ${lineNo === undefined ? 'anchor does not resolve' : `file has only ${lines.length} lines`}`);
      // The basename, or the CONSTANT that holds it: convoke-doctor.js's `const csvAbs = path.join(projectRoot, BMM_DEPS_CSV_REL)` reads
      // `path.join(projectRoot, BMM_DEPS_CSV_REL)`, so the filename is not on the line.
      // That indirection is precisely why AC4 is a declared list and not a grep.
      // AND, not OR. A declared token is authoritative: the `changes.push('Created …taxonomy.yaml…')`
      // LOG line names the file without creating it, so accepting the basename there let the exact
      // wrong citation Round 1 disproved pass again.
      const anchor = token || path.basename(entry.file);
      assert.deepEqual(
        auditCitations([{ site, anchor, claim }]), [],
        `${site} no longer contains ${anchor} — line reads: ${line.trim()}`
      );
    }
  });
});

describe('WRAPPER_RULES — the generator call sites this check mirrors', () => {
  // THIS TEST WAS THE STORY'S OWN FIFTH FAIL-OPEN, and it is worth recording why rather
  // than quietly replacing it. The first version asserted only
  // `lines[Number(lineNo) - 1] !== undefined` — i.e. that refresh-installation.js has at
  // least N lines. Round 1 review proved it by mutation: rewriting the cited `:909` to `:1`
  // left the suite at 31 pass / 0 fail. Three of the five citations were ALREADY wrong when
  // it shipped (`:836` and `:909` were comments, `:862` was an `if` guard), and nothing
  // caught them. A working content-checking alarm for RUNTIME_DATA_FILES sat twenty lines
  // above it. Now it checks the anchor text, so a citation that drifts fails here.
  it('every rule\'s anchor identifies exactly one line of its generator', () => {
    for (const [rule, def] of Object.entries(WRAPPER_RULES)) {
      assert.ok(!/:\d+$/.test(def.site), `${rule}: site carries a line number again — T230 removed it`);
      const abs = path.join(PACKAGE_ROOT, def.site);
      assert.ok(fs.existsSync(abs), `${rule}: ${def.site} — file gone`);
      const n = occurrencesOf(fs.readFileSync(abs, 'utf8'), def.anchor);
      assert.equal(n, 1, `${rule}: anchor ${JSON.stringify(def.anchor)} occurs ${n}× in ${def.site} — ` +
        (n === 0 ? 'the generator was renamed or removed' : 'lengthen it until it identifies one site'));
      assert.deepEqual(auditCitations([{ site: def.site, anchor: def.anchor, claim: 'generates' }]), [], `${rule}: predicate disagrees`);
      assert.equal(typeof def.name, 'function');
      assert.ok(['generator', 'ADR-004 C2'].includes(def.derivedFrom), `${rule}: unstated basis`);
    }
  });

  // Guards that the alarm DISCRIMINATES, by running the same predicate the alarm runs
  // against citations known to be wrong. The previous version of this test asserted facts
  // about line 1 and never invoked the predicate at all, so deleting the alarm's assertion
  // left the suite green — the Round 1 defect class reproduced one level up.
  it('the citation predicate rejects an absent anchor and an AMBIGUOUS one', () => {
    const { site, anchor } = WRAPPER_RULES.standaloneWorkflow;
    assert.deepEqual(auditCitations([{ site, anchor, claim: 'generates' }]), [], 'the real citation must hold, or the rest proves nothing');
    assert.ok(anchorLine(site, anchor) > 0, 'the real anchor must resolve to a line');

    // Absent.
    assert.equal(auditCitations([{ site, anchor: 'for (const nothing of NOWHERE)', claim: 'generates' }]).length, 1,
      'an anchor matching nothing must be rejected');

    // AMBIGUOUS — and this is the real historical defect, not a synthetic one. `vortexAgent` cited
    // `for (const agent of AGENTS)` for months; it matches the user-guides loop as well as the
    // wrapper loop, so un-numbering it without lengthening it would have pointed at the wrong one.
    const short = 'for (const agent of AGENTS)';
    assert.ok(occurrencesOf(fs.readFileSync(path.join(PACKAGE_ROOT, site), 'utf8'), short) > 1,
      'this guard is vacuous unless that text really is ambiguous');
    assert.equal(auditCitations([{ site, anchor: short, claim: 'generates' }]).length, 1, 'an ambiguous anchor must be rejected');
    assert.equal(anchorLine(site, short), 0, 'an ambiguous anchor must not resolve to a line');
  });

  // The same discrimination proof for the runtime-data manifest's alarm.
  it('only an admissible anchor stands for a claim — every shape Round 2 got through is rejected', () => {
    // The title names the property, not a universal: this is an ALLOWLIST, so the claim is that each
    // listed shape is rejected and the real anchors are accepted. An unrecognised shape is rejected
    // by construction, which is the whole reason for inverting the test.
    const REL = 'scripts/update/lib/refresh-installation.js';
    const realLineIn = (rel, needle) => {
      const lines = fs.readFileSync(path.join(PACKAGE_ROOT, rel), 'utf8').split('\n').filter((l) => l.includes(needle));
      assert.equal(lines.length, 1, `fixture needle ${JSON.stringify(needle)} must match exactly one line of ${rel}`);
      return lines[0];
    };
    const realLine = (needle) => realLineIn(REL, needle);
    const admits = (claim, line) => ADMISSIBLE_ANCHOR[claim].test(line);

    // ACCEPTED: the shapes the records actually use.
    assert.equal(admits('generates', realLine('for (const agent of GYRE_AGENTS) {')), true, 'a loop generates');
    assert.equal(admits('arrives', realLine('fs.writeFileSync(skillManifestPath,')), true, 'a write arrives');
    assert.equal(admits('arrives', realLine('const taxonomyResult = await mergeTaxonomy(projectRoot);')), true,
      'a seeder invoked on projectRoot arrives');
    // From the file that actually reads it — a READ site is not in the installer.
    assert.equal(admits('reads', realLineIn('scripts/lib/artifact-utils.js', "const configPath = path.join(projectRoot, '_bmad', '_config', 'taxonomy.yaml');")), true,
      'a path construction is what a READ site cites — the old predicate rejected all nine of these');

    // REJECTED: every shape Round 2 demonstrated getting through the denylist, plus Round 1's three.
    const rejected = [
      ['a plain log line', "changes.push('Created _bmad/_config/taxonomy.yaml (platform defaults)');"],
      ['the failure-path warning', 'Warning: could not seed skill-manifest.csv'],
      ['a guarded log line', "if (verbose) console.log('    Created _bmad/_config/taxonomy.yaml');"],
      ['a comment', 'Backlog I137. `mergeTaxonomy` was reachable'],
      ['a trailing comment on a code line', 'unparseable — treat as unusable and reseed'],
      ['a changes.push string on its OWN line', 'Created _bmad/_config/skill-manifest.csv (${kept.length}'],
      ['a require destructure', "const { mergeTaxonomy } = require('./taxonomy-merger');"],
      ['a path DECLARATION, for an ARRIVAL claim', "const packageManifest = path.join(packageRoot, '_bmad', '_config', 'skill-manifest.csv');"],
    ];
    for (const [label, needle] of rejected) {
      assert.equal(admits('arrives', realLine(needle)), false, `${label} must not stand for an arrival`);
    }

    // A block opener cannot stand for an arrival either — Round 2 reached one as a multi-line anchor's
    // first line. It is not unique on its own, so it is checked directly rather than via `realLine`.
    assert.equal(admits('arrives', '        if (verbose) {'), false, 'a block opener does not arrive');
    assert.equal(admits('generates', '        if (verbose) {'), false, 'nor does it generate');

    // A claim kind that does not exist, and a missing one, both reject rather than default.
    assert.equal(citationHolds(REL, 'for (const agent of GYRE_AGENTS) {', 'nonsense'), false);
    assert.equal(citationHolds(REL, 'for (const agent of GYRE_AGENTS) {', undefined), false);
    assert.equal(citationHolds(REL, 'for (const agent of GYRE_AGENTS) {', 'generates'), true);
    // ...and a generator anchor is not admissible for an arrival, nor a write for a generator.
    assert.equal(citationHolds(REL, 'for (const agent of GYRE_AGENTS) {', 'arrives'), false);
    assert.equal(citationHolds(REL, 'fs.writeFileSync(skillManifestPath,', 'generates'), false);
  });

  it('the LINE-CITED branch rejects a wrong line, and the defensive guards are reachable', () => {
    // Round 2: replacing the line-cited branch's `line.includes(anchor)` with `true` survived the
    // whole suite — nine of the seventeen citations had no negative control at all, because every
    // guard in this file exercised an ANCHORED site. This is that control.
    const REL = 'scripts/update/lib/refresh-installation.js';
    const bmm = RUNTIME_DATA_FILES.find((e) => e.file.endsWith('bmm-dependencies.csv'));
    assert.equal(citationHolds(bmm.readSite, bmm.token, 'reads'), true, 'the real line-cited citation must hold');
    // The wrong line must ITSELF be admissible, or the rule rejects it on admissibility and this
    // control proves nothing about `includes`. This was pinned to a line NUMBER and rotted when an
    // unrelated commit added lines above it; the first repair derived it with `/path\.join\(/`,
    // which is BROADER than the admissibility rule — one innocuous reshaping of the line it happened
    // to pick (`let x; x = path.join(…)`) made the control vacuous with nothing to say so. So
    // admissibility is now established by `citationHolds` ITSELF: find a line it ACCEPTS for an
    // anchor actually on that line, which proves both that the line is admissible and that the
    // content check can pass there.
    const [rel] = bmm.readSite.split(':');
    const relLines = fs.readFileSync(path.join(PACKAGE_ROOT, rel), 'utf8').split('\n');
    let wrongButAdmissible = null;
    for (let i = 0; i < relLines.length && !wrongButAdmissible; i += 1) {
      if (relLines[i].includes(bmm.token)) continue;
      const word = (relLines[i].match(/[A-Za-z_][A-Za-z0-9_]{3,}/) || [])[0];
      if (!word) continue;
      const site = `${rel}:${i + 1}`;
      if (citationHolds(site, word, 'reads')) wrongButAdmissible = site;
    }
    assert.ok(wrongButAdmissible,
      `fixture: no line of ${rel} is admissible for a read without containing ${bmm.token}, so this control cannot isolate \`includes\``);
    assert.equal(citationHolds(wrongButAdmissible, bmm.token, 'reads'), false,
      'an admissible line that does not contain the anchor must still be rejected');

    // Each of these took a branch that no test reached, so each could be deleted with the suite green.
    assert.equal(citationHolds('', 'anything', 'reads'), false, 'an empty site must not read PACKAGE_ROOT');
    assert.equal(citationHolds('scripts', 'anything', 'reads'), false, 'a directory is not a citation');
    assert.equal(citationHolds(`${REL}:897:5`, 'for (const agent of GYRE_AGENTS) {', 'generates'), false,
      'a two-colon site is not a citation');
    assert.equal(citationHolds(REL, '', 'generates'), false, 'an empty anchor matches everything, so it must reject');
    assert.equal(citationHolds(`${REL}:897`, '', 'generates'), false, 'likewise on the line-cited branch');
    assert.equal(occurrencesOf('aaaa', ''), 0, 'an empty needle must not loop');
    assert.equal(anchorLine('scripts', 'anything'), 0, 'a directory resolves to no line rather than throwing');
  });

  it('the manifest alarm rejects a log line that merely mentions the filename', () => {
    const taxonomy = RUNTIME_DATA_FILES.find(e => e.file.endsWith('taxonomy.yaml'));
    assert.deepEqual(auditCitations([{ site: taxonomy.arrivesVia, anchor: taxonomy.arrivesViaToken, claim: 'arrives' }]), [], 'the real citation must hold');
    // THE LOG LINE, restored. Round 1 found this test had kept its name while losing the case it was
    // named for: dropping the line number left content-uniqueness alone, and the `changes.push` line
    // below the call is unique, so pointing the record at it passed with the suite green. It asserts
    // the file ARRIVED by citing a line that only reports. Worse was available — the `console.warn`
    // in the `catch` reports that seeding FAILED, and it passed too.
    const logLine = "changes.push('Created _bmad/_config/taxonomy.yaml (platform defaults)');";
    assert.equal(occurrencesOf(fs.readFileSync(path.join(PACKAGE_ROOT, taxonomy.arrivesVia), 'utf8'), logLine), 1,
      'this guard is vacuous unless that log line really is unique');
    assert.equal(auditCitations([{ site: taxonomy.arrivesVia, anchor: logLine, claim: 'arrives' }]).length, 1,
      'a log line must not satisfy the alarm, however unique it is');
    const warnLine = "console.warn(`    Warning: could not seed skill-manifest.csv: ${err.message}`);";
    assert.equal(auditCitations([{ site: taxonomy.arrivesVia, anchor: warnLine, claim: 'arrives' }]).length, 1,
      'the failure-path warning must not satisfy the alarm');

    // The old token was the bare symbol `mergeTaxonomy`, which occurs three times: a COMMENT at
    // `Backlog I137`, the `require` destructure, and the call. Not a log line — the log line does not
    // contain the symbol at all, and an earlier version of this comment said it did.
    assert.equal(auditCitations([{ site: taxonomy.arrivesVia, anchor: 'mergeTaxonomy', claim: 'arrives' }]).length, 1,
      'the bare symbol is ambiguous and must be rejected');
    assert.equal(auditCitations([{ site: taxonomy.arrivesVia, anchor: 'mergeTaxonomyNope', claim: 'arrives' }]).length, 1,
      'an absent token must be rejected');
  });

  // The one rule that is NOT read off a generator, stated so the file cannot drift back to
  // claiming otherwise. There is no generic standalone-workflow generator — block 6d is
  // `if (artifactsConfig && !isSameRoot)` over `artifactsConfig.workflows`.
  it('is explicit that standaloneWorkflow comes from ADR-004 C2, not from a generator', () => {
    assert.equal(WRAPPER_RULES.standaloneWorkflow.derivedFrom, 'ADR-004 C2');
    // `extraBmeAgent` was in this list until tfu-1-1 removed the rule with its generator loop.
    for (const k of ['vortexAgent', 'gyreAgent', 'enhanceWorkflow']) {
      assert.equal(WRAPPER_RULES[k].derivedFrom, 'generator', `${k} should be generator-derived`);
    }
  });

  it('names wrappers the way each generator does', () => {
    assert.equal(WRAPPER_RULES.vortexAgent.name('emma'), 'bmad-agent-bme-emma');
    assert.equal(WRAPPER_RULES.enhanceWorkflow.name('initiatives-backlog'), 'bmad-enhance-initiatives-backlog');
    assert.equal(WRAPPER_RULES.standaloneWorkflow.name('bmad-portfolio-status'), 'bmad-portfolio-status');
  });
});

// ─── AC3 first half: modules in files[] arrive ───

describe('shippedBmeModules', () => {
  it('extracts bme module names and ignores everything else', () => {
    // Spread: the return is an array carrying an `unresolvable` side-channel.
    assert.deepEqual(
      [...shippedBmeModules(['index.js', 'scripts/', '_bmad/bme/_vortex/', '_bmad/bme/_portability/', '_bmad/_config/skill-manifest.csv'])],
      ['_vortex', '_portability']
    );
  });
  it('is not fooled by a nested path or a non-array', () => {
    assert.deepEqual([...shippedBmeModules(['_bmad/bme/_vortex/agents/'])], []);
    assert.deepEqual([...shippedBmeModules(undefined)], []);
  });
});

describe('missingModules', () => {
  it('reports an absent module and stays quiet about a present one', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '_bmad', 'bme', '_vortex'), { recursive: true });
    assert.deepEqual(missingModules(['_vortex', '_portability'], root), ['_portability']);
    assert.deepEqual(missingModules(['_vortex'], root), []);
  });
});

// ─── AC4: runtime data files arrive ───

describe('missingRuntimeFiles', () => {
  it('fires on an absent file and clears when it is put there', () => {
    const root = tmp();
    const manifest = [{ file: '_bmad/_config/x.csv', readSite: 'scripts/a.js:1', why: 'x'.repeat(30) }];
    assert.equal(missingRuntimeFiles(root, manifest).length, 1);
    write(path.join(root, '_bmad', '_config', 'x.csv'), 'a\n');
    assert.equal(missingRuntimeFiles(root, manifest).length, 0);
  });

  it('does not accept a DIRECTORY where a file is required', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '_bmad', '_config', 'x.csv'), { recursive: true });
    assert.equal(missingRuntimeFiles(root, [{ file: '_bmad/_config/x.csv', readSite: 'scripts/a.js:1', why: 'x'.repeat(30) }]).length, 1);
  });
});

// ─── AC3 second half: declared units resolve to wrappers ───

function moduleFixture() {
  const root = tmp();
  const mk = (mod, cfg) => write(path.join(root, '_bmad', 'bme', mod, 'config.yaml'), cfg);
  mk('_vortex', 'version: 4.0.1\nworkflows:\n  - lean-persona\n  - product-vision\n');
  mk('_gyre', 'version: 4.0.1\nexcluded_agents:\n  - review-coach\nworkflows:\n  - gap-analysis\n');
  mk('_enhance', 'workflows:\n  - name: initiatives-backlog\n    entry: workflows/initiatives-backlog/workflow.md\n');
  mk('_artifacts', 'workflows:\n  - name: bmad-portfolio-status\n    standalone: true\n  - name: bmad-not-standalone\n');
  return root;
}

// EXTRA_BME_AGENTS held `team-factory` here until tfu-1-1 removed the roster and its bucket.
const REGISTRY = {
  AGENTS: [{ id: 'emma' }, { id: 'isla' }],
  GYRE_AGENTS: [{ id: 'review-coach' }, { id: 'stack-detective' }],
};

describe('declaredUnits', () => {
  const arrived = ['_vortex', '_gyre', '_enhance', '_artifacts'];

  it('derives agents, honours excluded_agents, and skips string-shaped workflows', () => {
    const root = moduleFixture();
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived }).units.map(u => u.name).sort();
    assert.deepEqual(names, [
      'bmad-agent-bme-emma',
      'bmad-agent-bme-isla',
      'bmad-agent-bme-stack-detective',   // review-coach is excluded in _gyre's config
      'bmad-enhance-initiatives-backlog', // no standalone flag — the Enhance path emits anyway
      'bmad-portfolio-status',            // standalone: true, name used verbatim
    ]);
    // The string-shaped workflows (lean-persona, gap-analysis) declare nothing,
    // and `bmad-not-standalone` is an object without the flag — neither reaches a generator.
    assert.ok(!names.includes('lean-persona'));
    assert.ok(!names.includes('bmad-not-standalone'));
  });

  it('ignores agents whose module did not arrive', () => {
    const root = moduleFixture();
    fs.rmSync(path.join(root, '_bmad', 'bme', '_gyre'), { recursive: true, force: true });
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived: arrived.filter(m => m !== '_gyre') }).units.map(u => u.name);
    assert.ok(!names.includes('bmad-agent-bme-stack-detective'));
    assert.ok(names.includes('bmad-agent-bme-emma'));
  });

  // The load-bearing property: this must NOT be a snapshot. Story 2.6 gives _portability
  // a config.yaml with four standalone workflows, and this check has to pick them up
  // with no edit here — otherwise the wiring story ships against a stale expectation.
  it('picks up a module that gains standalone workflows, with no change to this code', () => {
    const root = moduleFixture();
    write(
      path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'),
      'version: 4.0.1\nworkflows:\n  - name: bmad-export-skill\n    standalone: true\n  - name: bmad-seed-catalog\n    standalone: true\n'
    );
    const names = declaredUnits({ projectRoot: root, registry: REGISTRY, arrived: [...arrived, '_portability'] }).units.map(u => u.name);
    assert.ok(names.includes('bmad-export-skill'));
    assert.ok(names.includes('bmad-seed-catalog'));
  });
});

describe('missingWrappers', () => {
  it('fires when a declared unit has no SKILL.md, and clears when it appears', () => {
    const root = tmp();
    const units = [{ name: 'bmad-agent-bme-emma', module: '_vortex', rule: 'vortexAgent', site: 'x:1' }];
    assert.equal(missingWrappers(units, root).length, 1);
    write(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma', 'SKILL.md'), '---\n');
    assert.equal(missingWrappers(units, root).length, 0);
  });

  it('does not accept an EMPTY skill DIRECTORY as a wrapper', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma'), { recursive: true });
    assert.equal(missingWrappers([{ name: 'bmad-agent-bme-emma', module: '_vortex', rule: 'v', site: 'x:1' }], root).length, 1);
  });
});

describe('modulesWithoutConfig — ADR-004 C1', () => {
  // THE REGRESSION THIS EXISTS FOR. Before C1 was asserted, a module directory copied
  // into the project with no config.yaml declared nothing, so the wrapper pass had
  // nothing to check and the whole run reported health — measured on a real installed
  // tree, exit 0, "6 shipped bme module(s) arrived, 15 declared unit(s) resolve", while
  // the module's skills were unreachable. Delete `modulesWithoutConfig` from the CLI and
  // the last case here goes green again.
  it('flags an arriving module with no config.yaml and clears when one is added', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '_bmad', 'bme', '_portability'), { recursive: true });
    assert.deepEqual(modulesWithoutConfig(['_portability'], root), ['_portability']);
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    assert.deepEqual(modulesWithoutConfig(['_portability'], root), []);
  });

  it('the CLI refuses a copied-but-unconfigured module rather than reporting health', () => {
    const { root, pkgRoot } = installedFixture();
    fs.mkdirSync(path.join(root, '_bmad', 'bme', '_portability'), { recursive: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1, 'a module that declares nothing must not pass by vacuity');
    assert.match(r.stdout, /_portability\/ arrived but carries no config\.yaml \(ADR-004 C1\)/);
  });
});

describe('modulesDeclaringNothing — the second form of the C1 vacuity', () => {
  // Round 1 review MEASURED this: `config.yaml` holding only `version: 4.0.1` passed the
  // file check, the parse check, and contributed zero units — so the wrapper pass had
  // nothing to check and the run reported `exit 0` on a `_portability` with four skills on
  // disk that no operator can invoke. Identical consequence to the hole C1 was added for.
  it('flags a module that has a config.yaml but declares nothing', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const byModule = { _portability: { declared: 0, excluded: 0 } };
    assert.deepEqual(modulesDeclaringNothing(['_portability'], byModule, root), ['_portability']);
  });

  it('stays quiet once the module declares a unit', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    assert.deepEqual(modulesDeclaringNothing(['_portability'], { _portability: { declared: 1, excluded: 0 } }, root), []);
  });

  // Round 2: a supported operator opt-out was being reported as a packaging defect.
  it('does NOT fire when the module declared nothing because the operator excluded everything', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_gyre', 'config.yaml'), 'version: 4.0.1\nexcluded_agents:\n  - review-coach\n');
    assert.deepEqual(modulesDeclaringNothing(['_gyre'], { _gyre: { declared: 0, excluded: 2 } }, root), []);
  });

  // Round 2: an unparsable config produced TWO findings, the second of them untrue.
  it('leaves an unparsable config to unparsableConfigs rather than reporting it twice', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_broken', 'config.yaml'), 'a:\n  - b\n c: [unclosed\n');
    assert.deepEqual(modulesDeclaringNothing(['_broken'], { _broken: { declared: 0, excluded: 0 } }, root), []);
    assert.equal(unparsableConfigs(root, ['_broken']).length, 1);
  });

  it('does not double-report a module that has no config at all', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '_bmad', 'bme', '_portability'), { recursive: true });
    assert.deepEqual(modulesDeclaringNothing(['_portability'], { _portability: { declared: 0, excluded: 0 } }, root), []);
    assert.deepEqual(modulesWithoutConfig(['_portability'], root), ['_portability']);
  });

  it('the CLI refuses the empty-config tree that used to exit 0', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1, 'this exact tree exited 0 before Round 1');
    assert.match(r.stdout, /_portability\/ arrived and carries a config\.yaml but declares no invocable unit/);
  });
});

describe('zero units — a packaging regression is not an environment failure', () => {
  // All three review layers raised this. When NO module arrives, the run printed the
  // correct FAILED lines and then exited 2 (`ENV_FAIL`), so the maximal product defect this
  // check exists to catch was filed as "the environment failed us" — and, in the harness,
  // aborted before `COMPLETED=1` so the verdict never printed.
  it('exits 1, not 2, when the units are zero BECAUSE no module arrived', () => {
    const { root, pkgRoot } = installedFixture();
    fs.rmSync(path.join(root, '_bmad', 'bme', '_vortex'), { recursive: true, force: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1, 'a total arrival failure is a product defect');
    assert.match(r.stdout, /_bmad\/bme\/_vortex\/ is in files\[\] but did not arrive/);
    assert.doesNotMatch(r.stderr, /derivation failed/);
  });

  // REPLACED after Round 2. This case previously asserted exit 2 with EMPTY stdout — which
  // was the bug: the ADR-004 C1 second-form check sat below the early return and could never
  // run in the one situation it was added for. Exit 2 is now reserved for PHASE 1, where no
  // finding can yet have been gathered.
  it('exits 1 and names every vacuous module, instead of exiting 2 with nothing printed', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'),
      'module.exports = { AGENTS: [], GYRE_AGENTS: [], EXTRA_BME_AGENTS: [] };\n');
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1, 'a tree full of unreachable modules is a product defect');
    assert.match(r.stdout, /_vortex\/ arrived and carries a config\.yaml but declares no invocable unit/);
    assert.match(r.stdout, /_portability\/ arrived and carries a config\.yaml but declares no invocable unit/);
  });

  // Round 2: `scripts/` is in files[], so a registry that did not ship is a PRODUCT defect.
  // It previously exited 2, discarding findings already gathered.
  it('reports an unloadable shipped registry as a finding, keeping the other findings', () => {
    const { root, pkgRoot } = installedFixture();
    fs.rmSync(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'), { force: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /the shipped agent registry did not load/);
    assert.match(r.stdout, /_portability\/ is in files\[\] but did not arrive/, 'earlier findings must survive');
  });
});

describe('exclusions mirror the generator rather than a uniform rule', () => {
  // REMOVED by tfu-1-1: 'does NOT honour excluded_agents for the EXTRA_BME bucket'.
  //
  // It pinned a real asymmetry — the Vortex and Gyre generator loops skip excluded agents and the
  // EXTRA_BME loop did not, so filtering that bucket would have dropped a wrapper from the CHECK that
  // the installer still emitted: skew in the fail-open direction. Both the loop and the bucket are
  // gone, so there is nothing left to assert. The reasoning is preserved in `installed-tree.js`'s
  // `honoursExclusions` comment, because the next standalone module faces the same choice.

  // REMOVED by tfu-1-1: 'reports a registry entry with no submodule instead of dropping it'.
  // `extraBmeAgent` was the only bucket whose `module` resolver read `a.submodule`, so with it gone no
  // registry entry has a submodule to omit and the path is unreachable. A future standalone bucket must
  // bring this case back with it.

  it('a zero-byte SKILL.md is not a wrapper', () => {
    const root = tmp();
    const units = [{ name: 'bmad-agent-bme-emma', module: '_vortex', rule: 'v', site: 'x:1' }];
    write(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma', 'SKILL.md'), '');
    assert.equal(missingWrappers(units, root).length, 1, 'an empty file is not invocable');
    write(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma', 'SKILL.md'), '---\n');
    assert.equal(missingWrappers(units, root).length, 0);
  });

  it('deduplicates units by wrapper name so one path is one assertion', () => {
    const root = moduleFixture();
    // Two modules declaring the same workflow name.
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'),
      'version: 4.0.1\nworkflows:\n  - name: bmad-portfolio-status\n    standalone: true\n');
    const { units } = declaredUnits({
      projectRoot: root, registry: REGISTRY,
      arrived: ['_vortex', '_gyre', '_enhance', '_artifacts', '_team-factory', '_portability'],
    });
    const names = units.map(u => u.name);
    assert.equal(new Set(names).size, names.length, 'no duplicate wrapper names');
  });

  // Round 2: silently skipping shrank the expectation set with no diagnostic, so a run could
  // exit 0 having never looked at the globbed module.
  it('reports a glob entry rather than silently dropping it', () => {
    const r = shippedBmeModules(['_bmad/bme/*/', '_bmad/bme/_vortex/']);
    assert.deepEqual([...r], ['_vortex']);
    assert.deepEqual(r.unresolvable, ['_bmad/bme/*/']);
  });
});

describe('walkRequires reports WHICH file needs a missing specifier', () => {
  it('carries `from`, and treats the same specifier from two directories as two defects', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");require("./sub/b");\n');
    write(path.join(root, 'a.js'), 'require("./gone");\n');
    write(path.join(root, 'sub', 'b.js'), 'require("./gone");\n');
    const res = walkRequires(path.join(root, 'entry.js'));
    assert.equal(res.missing.length, 2, 'same spec, different directories, two real defects');
    const froms = res.missing.map(m => path.basename(m.from)).sort();
    assert.deepEqual(froms, ['a.js', 'b.js']);
  });
});

describe('Round 3 — fail-open paths the restructure left open', () => {
  // Each of these was reproduced by a review layer against the shipped code, and each is a
  // check that reported less than it found, or reported health it had not established.

  it('a non-iterable AGENTS is REPORTED, not crashed on and not silently skipped', () => {
    // Was: "a crash in phases 2-4 still emits the findings gathered before it", pinning that a
    // non-iterable AGENTS threw and that earlier findings survived the throw. T102's Round 1
    // removed the crash — but the first version of that fix substituted `[]`, which is WORSE:
    // the bucket's wrappers go unchecked while the run reports success. This test caught it.
    // The behaviour now asserted is the third option: complete the run AND report the shape.
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'),
      'module.exports = { AGENTS: { emma: {} }, GYRE_AGENTS: [], EXTRA_BME_AGENTS: [] };\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.notEqual(r.code, 2, 'the run must complete, not abort as a harness failure');
    assert.match(r.stdout + r.stderr, /not an array/,
      'a non-array registry export must be reported, never silently emptied');
    assert.match(r.stdout, /_portability\/ is in files\[\] but did not arrive/,
      'findings from earlier phases must still be emitted');
  });

  it('the operator excluded_agents opt-out is not reported as a defect', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'),
      JSON.stringify({ name: 'convoke-agents', files: ['_bmad/bme/_vortex/'] }));
    write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'),
      'version: 4.0.1\nexcluded_agents:\n  - emma\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.doesNotMatch(r.stdout, /derivation/, 'the deleted zero-unit alarm must not come back');
  });

  it('reports a multi-segment glob rather than dropping it', () => {
    const r = shippedBmeModules(['_bmad/bme/_vortex/', '_bmad/bme/**/*', '_bmad/bme/*/subdir/']);
    assert.deepEqual([...r], ['_vortex']);
    assert.deepEqual(r.unresolvable, ['_bmad/bme/**/*', '_bmad/bme/*/subdir/'],
      'a glob outside the last segment used to vanish with no diagnostic');
  });

  it('a duplicated files[] entry yields one module, not two verdicts', () => {
    const r = shippedBmeModules(['_bmad/bme/_portability/', '_bmad/bme/_portability', '_bmad/bme/_vortex/']);
    assert.deepEqual([...r], ['_portability', '_vortex']);
  });

  it('a duplicated files[] entry does not double-report an absent module', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'), JSON.stringify({
      name: 'convoke-agents', files: ['_bmad/bme/_vortex/', '_bmad/bme/_portability/', '_bmad/bme/_portability'],
    }));
    const r = runCli(['tree', root, pkgRoot]);
    const lines = r.stdout.split('\n').filter(l => l.includes('_portability/ is in files[] but did not arrive'));
    assert.equal(lines.length, 1, 'one module, one verdict');
  });

  it('the success line counts modules that ARRIVED, not modules declared', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'),
      JSON.stringify({ name: 'convoke-agents', files: ['_bmad/bme/_vortex/'] }));
    write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'), 'version: 4.0.1\nexcluded_agents:\n  - emma\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.match(r.stdout, /^\s*1 shipped bme module\(s\) arrived/m);
  });
});

describe('the auditor resolves js-yaml from the installed package, not from $REPO', () => {
  // CI run 33323351907 took main red. `js-yaml` is a runtime dependency of convoke-agents, so
  // a bare require finds it in $REPO/node_modules on any developer machine — and at the time
  // the `fresh-install` job ran NO `npm ci`, so on the runner there was no $REPO/node_modules
  // and the auditor died mid-run. `8c5de2f8` fixed it by resolving from the INSTALLED package
  // root, and this test is what pins that.
  //
  // THE JOB NOW INSTALLS ITS DEPENDENCIES (T104), so a bare require would no longer kill it.
  // This block was named for that condition and asserted it in prose; the name and both
  // paragraphs were rewritten with the workflow. (A first pass rewrote only one of the two and
  // then claimed both had changed — found by review, not by the suite, because prose is not
  // code.)
  //
  // WHAT IT STILL GUARDS, stated narrowly because the broad version is no longer true: the
  // auditor resolves js-yaml from the package root it is given. That is
  // `setYamlResolutionRoot`'s contract, and the caller that still needs it is the repo-side
  // one — this auditor run from a checkout with no `node_modules`, which `try-fresh-install.sh`
  // documents as the pre-release ritual. NOT the operator: npm hoists js-yaml to the project's
  // own `node_modules`, where a bare require finds it.
  //
  // ONE BOUND, because the assert below is weaker than it reads. It checks a single directory
  // (`root/node_modules`), not the whole resolution chain, so if `os.tmpdir()` happens to sit
  // under a tree containing `node_modules/js-yaml` the bare-require fallback succeeds and this
  // block passes with the mechanism deleted. Verified: with `TMPDIR` pointed at such a tree the
  // mutant survives; on an ordinary machine it is killed. Do not read a green here as proof of
  // isolation without checking where the fixture landed.
  function isolatedRepo() {
    const root = tmp('convoke-norepo-');
    fs.mkdirSync(path.join(root, 'scripts', 'audit', 'lib'), { recursive: true });
    fs.copyFileSync(CLI, path.join(root, 'scripts', 'audit', 'assert-installed-tree.js'));
    fs.copyFileSync(
      path.join(PACKAGE_ROOT, 'scripts', 'audit', 'lib', 'installed-tree.js'),
      path.join(root, 'scripts', 'audit', 'lib', 'installed-tree.js')
    );
    assert.ok(!fs.existsSync(path.join(root, 'node_modules')), 'the fixture must have no repo deps');
    return path.join(root, 'scripts', 'audit', 'assert-installed-tree.js');
  }

  it('resolves js-yaml from the installed package and completes the run', () => {
    const { root, pkgRoot } = installedFixture();
    // A real tarball install carries js-yaml under the package; mirror that.
    fs.cpSync(
      path.join(PACKAGE_ROOT, 'node_modules', 'js-yaml'),
      path.join(pkgRoot, 'node_modules', 'js-yaml'),
      { recursive: true }
    );
    write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'), 'version: 4.0.1\n');

    const cli = isolatedRepo();
    let res;
    try {
      const stdout = execFileSync(process.execPath, [cli, 'tree', root, pkgRoot], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      res = { code: 0, stdout, stderr: '' };
    } catch (err) {
      res = { code: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
    }
    assert.doesNotMatch(res.stderr, /js-yaml could not be loaded/, res.stderr);
    assert.doesNotMatch(res.stderr, /assertion crashed/, res.stderr);
    assert.notEqual(res.code, 2, 'the run must complete, not abort as a harness failure');
    assert.match(res.stdout, /_portability\/ is in files\[\] but did not arrive/);
  });
});

describe('unparsableConfigs', () => {
  it('names a module whose config.yaml does not parse', () => {
    const root = tmp();
    write(path.join(root, '_bmad', 'bme', '_broken', 'config.yaml'), 'a:\n  - b\n c: [unclosed\n');
    const bad = unparsableConfigs(root, ['_broken']);
    assert.equal(bad.length, 1);
    assert.equal(bad[0].module, '_broken');
  });
});

// ─── AC5 / I153: the walk is transitive ───

describe('walkRequires', () => {
  it('follows relative requires TRANSITIVELY — the defect I153 records', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("./b");\n');
    write(path.join(root, 'b.js'), 'require("./gone");\n');
    const res = walkRequires(path.join(root, 'entry.js'));
    // A single-hop extractor reads entry.js only, finds `./a`, resolves it, and reports
    // clean. That is exactly `convoke-install`: one require, whole surface unchecked.
    assert.deepEqual(res.missing.map(m => m.spec), ['gone']
      .map(() => './gone'));
    assert.equal(res.visited, 3);
  });

  it('reports clean when the whole graph resolves', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("node:path");\n');
    assert.deepEqual(walkRequires(path.join(root, 'entry.js')).missing, []);
  });

  it('terminates on a cycle', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("./entry");\n');
    const res = walkRequires(path.join(root, 'entry.js'));
    assert.equal(res.visited, 2);
    assert.equal(res.capHit, false);
  });

  it('treats a bare package specifier as a leaf and does not walk into node_modules', () => {
    const root = tmp();
    write(path.join(root, 'node_modules', 'dep', 'package.json'), '{"name":"dep","main":"i.js"}');
    write(path.join(root, 'node_modules', 'dep', 'i.js'), 'require("./deep");\n');
    write(path.join(root, 'entry.js'), 'require("dep");\n');
    const res = walkRequires(path.join(root, 'entry.js'));
    // `dep/deep` is missing, but dep is third-party: not our packaging problem.
    assert.deepEqual(res.missing, []);
    assert.equal(res.visited, 1);
  });

  it('REPORTS the cap rather than passing silently', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("./b");\n');
    write(path.join(root, 'b.js'), 'require("./gone");\n');
    const res = walkRequires(path.join(root, 'entry.js'), { maxFiles: 2 });
    assert.equal(res.capHit, true);
    assert.ok(res.missing.length === 0, 'the walk stopped before reaching the defect — which is why capHit must be surfaced');
  });
});

// ─── AC7: the CLI fails on a broken tree and passes on a good one ───

function installedFixture() {
  const root = tmp();
  const pkgRoot = path.join(root, 'node_modules', 'convoke-agents');
  write(path.join(pkgRoot, 'package.json'), JSON.stringify({ name: 'convoke-agents', files: ['_bmad/bme/_vortex/', '_bmad/bme/_portability/'] }));
  write(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'),
    'module.exports = { AGENTS: [{ id: "emma" }], GYRE_AGENTS: [], EXTRA_BME_AGENTS: [] };\n');
  write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'), 'version: 4.0.1\nworkflows:\n  - lean-persona\n');
  write(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma', 'SKILL.md'), '---\n');
  for (const e of RUNTIME_DATA_FILES) write(path.join(root, e.file), 'x\n');
  return { root, pkgRoot };
}

function runCli(args) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return { code: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

describe('assert-installed-tree CLI', () => {
  it('exits 1 and names the module when a shipped module did not arrive', () => {
    const { root, pkgRoot } = installedFixture();   // _portability is declared, never created
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /FAILED: _bmad\/bme\/_portability\/ is in files\[\] but did not arrive/);
  });

  it('exits 1 and names the wrapper when a declared unit is not invocable', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    fs.rmSync(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma'), { recursive: true, force: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /declares bmad-agent-bme-emma but \.claude\/skills\/bmad-agent-bme-emma\/SKILL\.md was not generated/);
  });

  it('exits 1 and names the read site when a runtime data file did not arrive', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'version: 4.0.1\n');
    const victim = RUNTIME_DATA_FILES[0];
    fs.rmSync(path.join(root, victim.file), { force: true });
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.ok(r.stdout.includes(`FAILED: ${victim.file} is read at runtime by ${victim.readSite}`));
  });

  // The other direction. A check only shown failing might be failing for a reason that
  // has nothing to do with what it claims to measure.
  it('exits 0 on a tree where everything arrived', () => {
    const { root, pkgRoot } = installedFixture();
    // A conforming module under BOTH forms of C1: it carries a config.yaml AND that config
    // declares an invocable unit, whose wrapper then has to exist. A config holding only
    // `version:` is the vacuity the second form closes — see the C1 suite above.
    write(
      path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'),
      'version: 4.0.1\nworkflows:\n  - name: bmad-export-skill\n    standalone: true\n'
    );
    write(path.join(root, '.claude', 'skills', 'bmad-export-skill', 'SKILL.md'), '---\n');
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /2 shipped bme module\(s\) arrived, 2 declared unit\(s\) resolve/);
  });

  // Was exit 2. `files[]` losing its bme entries is the packaging regression this check
  // exists for — a finding about the artifact, not the instrument failing to start.
  it('exits 1 when files[] declares no bme modules — that is the regression, not a harness fault', () => {
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'package.json'), JSON.stringify({ name: 'convoke-agents', files: ['index.js'] }));
    const r = runCli(['tree', root, pkgRoot]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /declares no _bmad\/bme\/\* entries in files\[\]/);
  });

  it('exits 2 on bad arguments and on a project root that does not exist', () => {
    assert.equal(runCli(['tree']).code, 2);
    assert.equal(runCli(['nonsense']).code, 2);
    const { pkgRoot } = installedFixture();
    assert.equal(runCli(['tree', path.join(os.tmpdir(), 'convoke-does-not-exist-xyz'), pkgRoot]).code, 2);
  });

  it('requires mode prints missing specifiers and exits 2 when it hits the cap', () => {
    const root = tmp();
    write(path.join(root, 'entry.js'), 'require("./a");\n');
    write(path.join(root, 'a.js'), 'require("./gone");\n');
    const ok = runCli(['requires', path.join(root, 'entry.js')]);
    assert.equal(ok.code, 0);
    // `from` is part of the contract now: across a transitive walk a bare `./gone` does not
    // say which of up to 500 files needs it. The old one-hop check could omit it honestly.
    assert.match(ok.stdout.trim(), /^\.\/gone \(from .*a\.js\)$/);
    // Outside an installed package the path stays absolute — no cwd dependence either way.
    assert.ok(path.isAbsolute(ok.stdout.trim().replace(/^.*\(from /, '').replace(/\)$/, '')));
    const capped = runCli(['requires', path.join(root, 'entry.js'), '1']);
    assert.equal(capped.code, 2);
    assert.match(capped.stderr, /hit its 1-file cap/);
  });
});


// --- T102 (a)-(f): the six correctness defects that had to clear before $TREE could be wired ---
//
// dist-2-4 shipped this assertion deliberately NOT in try-fresh-install.sh's verdict, and its
// Round 3 residue was filed as T102 because code-review-convergence forbids a Round 4. These six
// are the subset that could make the gate WRONG rather than merely noisy, and T102 says plainly:
// clear them before adding $TREE to the condition. Each test below plants the exact defect the
// row describes and asserts it is now caught.

describe('T102 — the six correctness defects, each pinned', () => {
  const os = require('os');

  function tmpProject() {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 't102-test-'));
    fs.mkdirSync(path.join(d, '.claude', 'skills'), { recursive: true });
    return d;
  }

  it('(a) a wrapper name that escapes .claude/skills is a finding, not satisfied from outside', () => {
    // The row: a declared workflow named `../../../../tmp/x` was satisfied by any SKILL.md
    // sitting there — reproduced at exit 0. path.join does not neutralise `..`.
    const proj = tmpProject();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 't102-outside-'));
    fs.mkdirSync(path.join(outside, 'x'), { recursive: true });
    fs.writeFileSync(path.join(outside, 'x', 'SKILL.md'), '# planted outside the project');
    const escaping = path.relative(path.join(proj, '.claude', 'skills'), path.join(outside, 'x'));

    const found = missingWrappers([{ name: escaping, module: 'm', rule: 'r', site: 's' }], proj);

    assert.equal(found.length, 1, 'an escaping wrapper name must be reported, not satisfied');
    fs.rmSync(proj, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  });

  it('(b) an unparsable config does not manufacture a false wrapper demand per excluded agent', () => {
    // The row: excludedAgents cannot tell "no exclusions" from "did not parse" and returns []
    // for both, so every opted-out agent produced a false "SKILL.md was not generated" finding
    // stacked on the one true parse finding — two findings, one cause.
    const proj = tmpProject();
    const mod = path.join(proj, '_bmad', 'bme', '_vortex');
    fs.mkdirSync(mod, { recursive: true });
    fs.writeFileSync(path.join(mod, 'config.yaml'), 'name: vortex\n  bad: [unclosed\n\t\ttabs:');

    const r = declaredUnits({
      projectRoot: proj,
      registry: { AGENTS: [{ id: 'a1' }, { id: 'a2' }] },
      arrived: ['_vortex'],
    });

    // CORRECTED AT ROUND 1. The first fix skipped the module's agents entirely, which removed
    // the false findings AND the true ones — review reproduced a corrupted config plus a
    // genuinely deleted SKILL.md for a non-excluded agent and got zero findings for the real
    // defect. Trading noise for a fail-open is the wrong direction in a blocking gate. The
    // module is now marked exclusion-ambiguous so the CLI reports ONCE that these wrappers
    // could not be verified — neither fabricating N findings nor concealing them.
    assert.deepEqual(r.exclusionAmbiguous, ['_vortex'],
      'a module whose config will not parse must be reported as exclusion-ambiguous');
    fs.rmSync(proj, { recursive: true, force: true });
  });

  it('(a) a SYMLINK escaping .claude/skills is a finding — the lexical check alone missed this', () => {
    // ROUND 2 GAP. The original (a) test built a lexical `../..` string via path.relative, which
    // the pre-fix lexical check already caught — so reverting realResolve left the whole suite
    // GREEN while the actual HIGH (a symlink pointing outside the project, statSync following
    // it, wrapper reported PRESENT) went unverified. A fix whose regression test cannot fail is
    // the class this repo has shipped repeatedly. This creates the real symlink.
    const proj = tmpProject();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 't102-sym-out-'));
    fs.mkdirSync(path.join(outside, 'payload'), { recursive: true });
    fs.writeFileSync(path.join(outside, 'payload', 'SKILL.md'), '# lives outside the project');
    fs.symlinkSync(path.join(outside, 'payload'), path.join(proj, '.claude', 'skills', 'legit-name'));

    const found = missingWrappers([{ name: 'legit-name', module: 'm', rule: 'r', site: 's' }], proj);

    assert.equal(found.length, 1,
      'a wrapper whose real file is outside the project must be reported, not counted as present');
    fs.rmSync(proj, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  });

  it('(a) a genuinely present wrapper is not falsely reported by the containment check', () => {
    // The other direction: a containment check that rejects everything would also pass the test
    // above. This is what stops the fix being over-strict.
    const proj = tmpProject();
    fs.mkdirSync(path.join(proj, '.claude', 'skills', 'real'), { recursive: true });
    fs.writeFileSync(path.join(proj, '.claude', 'skills', 'real', 'SKILL.md'), '---\n');

    assert.equal(missingWrappers([{ name: 'real', module: 'm', rule: 'r', site: 's' }], proj).length, 0);
    fs.rmSync(proj, { recursive: true, force: true });
  });

  it('a registry that require()s to a FALSY value is reported, not passed', () => {
    // ROUND 2 GAP. Reverting this guard left all 63 tests green, though Round 1 had reproduced
    // exit 0 PASS with every agent wrapper unchecked and no diagnostic — because `require`
    // returning null does not throw, so the catch never fired.
    const { root, pkgRoot } = installedFixture();
    write(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'), 'module.exports = null;\n');

    const r = runCli(['tree', root, pkgRoot]);

    assert.match(r.stdout + r.stderr, /exported no usable module/,
      'a falsy registry export must be reported');
    assert.notEqual(r.code, 0, 'the run must not pass with every agent wrapper unchecked');
  });

  it('(b) an EXCLUDED agent in an unparsable module produces no fabricated wrapper finding', () => {
    // ROUND 2 GAP, and the defect it found. Attempt 2 collected the units anyway, so the false
    // "SKILL.md was not generated" finding still fired alongside the ambiguity note — while the
    // comment claimed it did not. Neither (b) test covered a module with an excluded agent, so
    // nothing contradicted the claim. This is that case.
    const { root, pkgRoot } = installedFixture();
    // emma is declared by the registry; her wrapper is deliberately absent, as it would be for a
    // real `excluded_agents: [emma]` — but the config no longer parses, so that cannot be known.
    fs.rmSync(path.join(root, '.claude', 'skills', 'bmad-agent-bme-emma'), { recursive: true, force: true });
    write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'), 'version: 4.0.1\n  bad: [unclosed\n\t\ttabs:');

    const r = runCli(['tree', root, pkgRoot]);

    assert.match(r.stdout + r.stderr, /exclusions are unknown/,
      'the unverifiable module must be named');
    assert.doesNotMatch(r.stdout + r.stderr, /bmad-agent-bme-emma.*was not generated/,
      'no per-agent wrapper finding may be fabricated while exclusions are unknown');
    assert.notEqual(r.code, 0, 'an unverifiable module must block');
  });

  it('(b) the ambiguity reaches the operator through the CLI and blocks the run', () => {
    // What this pins: the module-level note is not library-only — it survives to the binary's
    // stdout and to a non-zero exit. It does NOT pin that a genuinely missing wrapper in the
    // same module is still named; by design it is not (see the THIRD ATTEMPT note in
    // installed-tree.js), and the test above is the one that deletes a wrapper.
    //
    // An earlier version of this comment claimed the end-to-end case it never set up. Round 3
    // caught it — the third untrue comment on this branch, after two in the production file.
    const { root, pkgRoot } = installedFixture();
    write(path.join(root, '_bmad', 'bme', '_vortex', 'config.yaml'), 'version: 4.0.1\n  bad: [unclosed\n\t\ttabs:');

    const r = runCli(['tree', root, pkgRoot]);

    assert.match(r.stdout + r.stderr, /exclusions are unknown/,
      'the CLI must say the wrappers could not be verified');
    assert.notEqual(r.code, 0, 'an unverifiable module must not pass silently');
  });

  it('(c) a registry entry with no id is reported malformed, not fabricated into a unit name', () => {
    // The row: the id is interpolated, so a missing one produced `bmad-agent-bme-undefined`
    // and then reported THAT as a missing wrapper — a finding naming a unit nobody declared.
    const proj = tmpProject();
    const r = declaredUnits({ projectRoot: proj, registry: { AGENTS: [{ id: undefined }] }, arrived: ['_vortex'] });

    assert.ok(r.malformed.some((m) => /no id/.test(m.reason)), 'the malformed entry must be reported');
    assert.ok(!r.units.some((u) => /undefined/.test(u.name)), 'no unit name may be fabricated from a missing id');
    fs.rmSync(proj, { recursive: true, force: true });
  });

  // REMOVED by tfu-1-1: '(d) a falsy-but-not-sentinel submodule is malformed'. It fed
  // `EXTRA_BME_AGENTS` entries with submodules of 0 / false / {} to prove the guard tested more than
  // undefined/null/''. No surviving bucket reads `submodule`, so there is no way to construct the
  // input. `bucketList`'s malformed reporting is still covered by the non-array cases above.

  it('(e) the ADR-004 C1 check still runs when the agent registry fails to load', () => {
    // The row: byModule fell back to {} on a registry failure, and modulesDeclaringNothing
    // bails on a module with no accounting entry — so C1 went dark, though it reads nothing
    // from the registry. C1 is a question about configs.
    //
    // DRIVEN THROUGH THE CLI, and that is the point. The first version of this test called
    // declaredUnits({registry: {}}) directly and asserted C1 fired — which it always did,
    // before and after the fix, because the defect was never in declaredUnits. It was in the
    // CALLER, which substituted a literal `{}` for byModule instead of calling declaredUnits
    // at all. Reverting the fix left that test green: a check that cannot fail, the third
    // this session. It now breaks the registry and runs the real binary.
    const { root, pkgRoot } = installedFixture();
    // A module that arrives with a valid config declaring nothing — exactly what C1 exists for.
    write(path.join(root, '_bmad', 'bme', '_portability', 'config.yaml'), 'name: portability\nversion: 4.0.1\n');
    // Break the registry so it cannot be require'd.
    write(path.join(pkgRoot, 'scripts', 'update', 'lib', 'agent-registry.js'), 'module.exports = {\n');

    const res = runCli(['tree', root, pkgRoot]);

    assert.match(res.stdout + res.stderr, /agent registry did not load/,
      'the registry failure itself must still be reported');
    assert.match(res.stdout + res.stderr, /_portability.*declares no/,
      'ADR-004 C1 must still fire for a module whose config declares nothing');
  });

  it('(f) an unreadable ENTRY file is a finding, not the PASS value', () => {
    // The row: the old comment justified returning PASS as "only reachable for something
    // require.resolve accepted" — false for the ENTRY, which is realpath'd and queued
    // directly, never resolved. So an unwalkable bin reported no missing dependencies.
    const proj = tmpProject();
    const r = walkRequires(path.join(proj, 'does-not-exist.js'));

    assert.ok(r.missing.length > 0, 'an unreadable entry must not report a clean walk');
    fs.rmSync(proj, { recursive: true, force: true });
  });
});
