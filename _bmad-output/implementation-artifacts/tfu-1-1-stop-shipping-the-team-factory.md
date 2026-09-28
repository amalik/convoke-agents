---
baseline_commit: 21ed0512dd238297a49b9c6249b1d381640d83ba
---

# Story tfu-1.1: Stop shipping the Team Factory

Status: deferred

**Epic:** [tfu-epic-1 — Team Factory Unship](../planning-artifacts/convoke-epic-team-factory-unship.md)
**Origin:** Fast Lane rows `T179` (2.0, `loom`) and `T150` (5.7, `convoke`), bundled `21ed0512`.
**Namespace decision:** Convoke-owned throughout — `_bmad/bme/_team-factory/` stops being packaged,
`_bmad/bme/covenant/` gets new worked examples, and everything else is `scripts/`, `tests/`,
`package.json` and Convoke's own docs. No upstream BMAD namespace (`_bmad/{core,bmm,bmb,…}/`) is
touched. No skill, agent or workflow is **added**, so `namespace-decision-for-new-skills` is satisfied
by construction.
**Covenant:** no `_bmad/bme/` skill or workflow is authored, so `covenant-compliance-for-convoke-skills`
applies as a no-regression check only — **except** for one obligation this story does carry:
`covenant-operator.md:130`, `:170` and `:208` use the module being unshipped as their **"Good example"**
for two Operator Rights. Replacing those is OC-R3 work (the Right to rationale), not tidying.
**Safety analysis (`path-safety-for-destructive-ops`):** **in scope, and load-bearing.** AC#8 adds a
migration that removes a directory from the **operator's own project**. It takes no user-supplied path,
but it does delete under `{projectRoot}`. The resolve + normalize + contains-check and the explicit
refusal path are AC#8's, not optional.

## Why this story is `deferred` and not `ready-for-dev`

**AC#0 is an unanswered operator ruling**, and every other AC's edit list depends on which way it goes.
`deferred` is the correct status per `sprint-status.yaml`'s own definition (added 2026-09-28 by operator
ruling for `s4-1-1`): the file exists and is complete, and work is intentionally not to start yet.
`ready-for-dev` would let `bmad-dev-story` flip this to `in-progress` before reading it.

**Revival condition:** the operator answers AC#0. Then flip this file and the sprint-status key to
`ready-for-dev` in the same edit, and delete this section.

## Story

As **the operator of a Convoke install**,
I want **the Team Factory to stop arriving in my project**,
so that **what Convoke ships is what Convoke supports, and a module ruled internal scaffolding stops
presenting itself as a capability I can use**.

## Context

The ruling is 2026-09-16. The module still ships. `docs/development.md:77-83` simultaneously
recommends it (`### Team Factory (Recommended)`) and records that it is being withdrawn, citing `T179`.

`T179` priced this as four edits. It is not four edits, and three of its four are inaccurate — see the
epic's §"What the scoping pass found". The two findings that most change the work are that
**the Covenant cites the module as its own worked example**, and that **existing installs keep an
orphan copy forever** because the removal loop is itself driven by the registry entry being removed.

**Unship is not delete.** `scripts/audit/agent-surface-parity.js` exits 2 on a removed agent and has no
waiver, so deleting the tree cannot be made green in-commit. The tree stays tracked in git; it stops
being packaged. This also keeps three non-Team-Factory consumers of `_team-factory/lib/` working.

## Acceptance Criteria

**AC#0 — BLOCKING. The operator has ruled how `EXTRA_BME_AGENTS` retires.** Three options, and they
fail in opposite directions. Do not start until one is chosen; record the ruling and the date here.

- **(a) Empty the array.** No runtime throw anywhere. Cost: twelve sites silently stop asserting.
  The worst pair is `scripts/update/lib/validator.js:359-366` (`Standalone bme agent files missing`
  becomes unconditionally satisfied) together with `tests/unit/validator.test.js:227` (the `beforeEach`
  that seeds the files it checks iterates nothing) — both halves of one contract go quiet, nothing red.
  Also `tests/unit/docs-audit.test.js:68`, the T146 regression guard, passes while proving nothing:
  `full` collapses 12 → 11 and 11 is *also* the team subtotal, so it stays a valid count.
- **(b) Delete the export.** Loud — throws at module load. Cost: silently coerced at exactly two sites
  (`scripts/lib/agent-manifest-generator.js:299`/`:304` via `|| []`; `scripts/audit/lib/installed-tree.js:292-296`,
  which returns `[]` for `undefined` **without** recording a malformed finding), and at
  `scripts/update/lib/validator.js:326` it is caught and mistranslated into a check failure that
  `scripts/update/lib/migration-runner.js:146` escalates into an **update rollback**.
- **(c) Delete the export *and* every consumer that would otherwise be vacuous.** Nothing left to
  throw, nothing left asserting nothing. Cost: it removes the "standalone bme submodule tree"
  mechanism entirely — a decision about whether that extension point has a future, which is why this
  is a ruling and not a recommendation the story may make for itself.

> **Recorded ruling:** _(blank — fill with the option and the date)_

**AC#1 — the premise is re-derived before anything is edited.** The audit behind this story ran
2026-09-28 against `21ed0512`. Re-run these three before editing; if any disagrees, stop and re-scope.

```bash
# 1. the roster this story empties, and what the counts become
node -e "const r=require('./scripts/update/lib/agent-registry.js');
const {validCountsFor,registryHeader}=require('./scripts/docs-audit.js');
const a={...r}; delete a.EXTRA_BME_AGENTS;
console.log('now  ', [...validCountsFor(r,'AGENTS')].sort((x,y)=>x-y).join(','), '|', registryHeader(r));
console.log('after', [...validCountsFor(a,'AGENTS')].sort((x,y)=>x-y).join(','), '|', registryHeader(a))"

# 2. the gate with no waiver — must still return nothing
grep -n 'waiver\|allowlist\|EXEMPT' scripts/audit/agent-surface-parity.js

# 3. the cross-module consumers that forbid deleting the tree
grep -rn "_team-factory/lib" --include='*.js' scripts/ tests/ | grep -v '^tests/team-factory'
```

**AC#2 — the package stops carrying it.** `_bmad/bme/_team-factory/` is absent from `package.json`
`files[]`, and the packed tarball contains no file under that path. Derive, do not assert:

```bash
npm pack --dry-run --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
const f=JSON.parse(s)[0].files.filter(x=>x.path.includes('_team-factory'));
console.log(f.length===0?'PASS: 0 team-factory files packed':'FAIL: '+f.length+' still packed')})"
```

**AC#3 — the shipped bin does not break, and this is proven before `files[]` changes.**
`scripts/audit/audit-bmm-dependencies.js:13` has a **top-level, unguarded** require of
`_bmad/bme/_team-factory/lib/utils/csv-utils`, and it is the target of the `convoke-audit-bmm-deps`
bin. Relocate the dependency under `scripts/` and repoint it **in the same commit**, before or with the
`files[]` removal. `scripts/convoke-doctor.js:330-341` requires the same module lazily and degrades to
*"skill wrapper checks will be skipped"* — repoint it too and **delete the degradation branch**, or the
doctor's wrapper check goes permanently dark with a yellow warning. Proven by
`scripts/audit/try-fresh-install.sh`, whose §303-308 documents this exact trap and whose `:327` and
`:341-343` enforce it.

**AC#4 — every derived artifact moves with the registry.** `_bmad/_config/agent-manifest.csv` is
**regenerated** (`npm run generate:manifest`), never hand-edited — it does not ship and is not a source.
`_bmad/_config/skill-manifest.csv` row 106 is deleted by hand (nothing derives it).
`_bmad/bme/_config/name-registry.csv:8` and `:27` are retired or moved out of
`['shipped','in-dev']`, and the now-dead carve-out at `scripts/audit/name-registry-integrity.js:270`
goes with them. `_bmad/bme/README.md:15`'s table row and its live `./_team-factory/` link are removed.
State no row counts here; derive them.

> ⚠ **`skill-manifest.csv` is a CANDIDATE list, not an inventory.** Most of its `path` values do not
> resolve in a given install and **that is the design** — read `convoke-note-backlog-completed-archive.md`
> § `## BUG-14` and the seeding predicate in `refresh-installation.js` (the JSDoc headed *"THE SEEDING
> PREDICATE, and the single definition of it"*) before touching this file. The trap has caught four
> attempts and cost one reverted ADR. Delete row 106; change nothing else about the file.

**AC#5 — the install path stops copying it, and the write-op snapshot moves with it.** The
standalone-bme-submodule block at `scripts/update/lib/refresh-installation.js:222-276` (copy, version
assert, `scDoc.set('version')`, write) is removed per AC#0's option. `scripts/audit/install-scope-check.js`
is updated in the same commit with a dated comment in the house style. **Its current tracked value is
`expected: 14` at `:135`** — the `8→9→10→11→10→13` chain in the comments above it is *history*, not the
live figure; read the entry, not the narration.

**AC#6 — nothing is left asserting nothing.** For the option AC#0 chose, enumerate every site that
becomes vacuous or dead and give each a disposition (removed, rewritten, or kept with a stated reason).
This AC is why option (a) is not free. At minimum, decide explicitly about:
`scripts/update/lib/validator.js:359-366` · `tests/unit/validator.test.js:227` ·
`tests/unit/docs-audit.test.js:68` · `scripts/audit/lib/installed-tree.js:298` ·
`scripts/update/lib/refresh-installation.js:879-902` · `scripts/convoke-doctor.js:511` ·
`scripts/audit/name-registry-integrity.js:115` · `tests/unit/agent-persona-registry-sync.test.js:100-106` ·
`tests/unit/refresh-installation-orphan-cleanup.test.js:206-217` (which asserts the wrapper is
*preserved* and will contradict the stale-sweep at `refresh-installation.js:812`).

**AC#7 — the documentation stops advertising it, and the Covenant stops demonstrating with it.**
Audited corpus first (`scripts/docs-audit.js:111-139` is the list; `npm run docs:audit` must exit 0):
`README.md:98`, `:100` · `INSTALLATION.md:27`, `:87-88`, `:115`, `:169`, `:250`, `:268` ·
`UPDATE-GUIDE.md:83` (and `:70`, `:73`, `:75`, `:236`, `:284`) · `docs/faq.md:200` ·
`docs/development.md:77-83` · `docs/testing.md:45` · `docs/BMAD-METHOD-COMPATIBILITY.md:87`, `:95`, `:120`.
Then the shipped normative files: `_bmad/bme/covenant/covenant-operator.md:130`, `:170`, `:208` and
`_bmad/bme/covenant/compliance-checklist.md:467` need **replacement worked examples from a module that
still ships** — Vortex or Gyre. A Covenant that illustrates its own standard with an unreachable
capability fails OC-R3 on its own terms.

`CHANGELOG.md` is **exempt** from stale-reference checking (`scripts/docs-audit.js:750`). Add a new
entry; do **not** rewrite `:143` or `:222`. They become false and nothing will flag them — that is a
known, accepted consequence, recorded here so it is a decision rather than an oversight.

**AC#8 — existing installs are not left with an orphan.** A migration under
`scripts/update/migrations/` removes (or archives) `_bmad/bme/_team-factory/` from a project that
already has it, registered append-only in `registry.js`. Without it, the removal loop at
`refresh-installation.js:229` never runs — it iterates the very array being emptied — so every current
user keeps the directory with a frozen `version:`, `convoke-doctor`'s `discoverModules()` keeps finding
it by `config.yaml`, and version consistency fails **forever** with the un-actionable remedy "Run
convoke-update". This is `I137` in mirror image.

Follow the precedent already in this repository: `scripts/update/migrations/1.0.x-to-1.3.0.js` contains
**both** `moveToDeprecated()` (archives to `_deprecated/`) and a hard `fs.remove`. **Prefer the archive**
— it is the operator's tree, the Covenant's axiom is that the operator is the resolver, and
`path-safety-for-destructive-ops` applies. Proven by a test that runs the migration against a fixture
project containing the directory and asserts it is gone from its original location.

**AC#9 — `T150` is closed by deletion, not by correction.** With no agent-owned workflow left,
`EXTRA_BME_WORKFLOWS` is never added. The three `T150` comments in `scripts/docs-audit.js` (`:57-59`,
`:192-196`, `:640-643`) and the one in `tests/unit/docs-audit.test.js:721-722` currently assert a live
undercount and become **false**. Delete the `T150` clauses.

⚠ **Do not delete the `(from exported rosters)` string at `scripts/docs-audit.js:644`.** Its
justification is a conjunction — `T150` *and* `T156` — and `T156` survives this story. Remove the
`T150` sentence; the qualifier stays, justified by `T156` alone.

**AC#10 — the `# one agent` false positive is handled.** `docs/testing.md:102` is
`node --test tests/p0/p0-emma.test.js  # one agent`, a true sentence inside a bash fence. It passes
today only because `EXTRA_BME_AGENTS.length === 1` makes `1` a legal agent count; after this story the
audit flags a correct document with a remedy that cannot be followed (`one of 4, 7, 11 agents`).
Re-derive with the command in the epic's §"Two defects", then fix the **instance** — reword the comment
so it carries no bare count. **Do not widen the matcher**: that is `T152`'s class (a count valid at one
roster size going stale at another) firing on a *shrinking* roster, and the class is a backlog action,
not this story's scope. File it rather than fixing it here.

**AC#11 — a consumer audit closes the story.** Per `code-review-convergence`'s consumer-audit clause,
independent of the implementer, across the **whole repository** — not the diff. Enumerate every changed
symbol, context key, `run:`/CLI contract and documented capability, then `git grep` for each **and for
the behaviour each implements, phrased as a reader would describe it**, since prose restating a removed
capability contains no symbol. Known prose-only sites to confirm are covered:
`.github/ISSUE_TEMPLATE/bug_report.yml:23` (a user-selectable bug-report area) ·
`.gyre/capabilities.yaml:277-282` · `CONTRIBUTING.md:12` · `CREDITS.md:32`, `:36` ·
`docs/what-convoke-brings-to-bmad-method.md:67`, `:97` · `docs/references.md:39`, `:178`, `:848` ·
`.github/workflows/ci.yml:125` (a comment claiming the parity check "covers 12 agents").

**AC#12 — the backlog is closed by the change.** `T179` and `T150` move to §2.5 with closing notes;
lanes stay ordered and `node scripts/audit/backlog-integrity.js` exits 0. **`T151` is re-scoped or
closed in the same pass** — its hazard is `derivePrefix()` emitting `EXTRA_SOMETHING_AGENTS` for a team
named `extra-something`, and the generator that creates that hazard is what stops shipping. File
`T152`'s shrinking-roster class (AC#10) as a new row.

**AC#13 — mutant → sole-executioner, cited by test.** Per `verification-must-be-falsifiable`: record
*(edit to make → test that goes red)*, never a mutant identifier — a harness is a scratch script and an
`M14`-style label points at nothing. Two traps specific to this story:

- **Choose mutants that land on one side.** The installed-tree check compares an expected set derived
  from the registry against what arrived. Mutating the registry moves **both** sides at once and the
  gate correctly reports clean — the `T102` NFR10 absorption. Inject where the two genuinely disagree:
  an installer that drops a unit the registry still declares.
- **"Derived survives" is false for a removal.** Seven of the eight tests that go red here derive
  correctly from the registry per `derive-counts-from-source` and break anyway, because the *symbol*
  disappears. Do not read a red derived test as a defect in the test.

## Tasks / Subtasks

- [ ] **Task 0 — get the ruling (AC#0).** Record option and date in the AC. Flip status to
      `ready-for-dev` here and in `sprint-status.yaml` in the same edit; delete §"Why this story is
      deferred".
- [ ] **Task 1 — re-derive the premise (AC#1).** Run all three commands; stop on any disagreement.
- [ ] **Task 2 — break the cross-module dependency (AC#3).** Relocate `csv-utils` under `scripts/`;
      repoint `audit-bmm-dependencies.js:13` and `convoke-doctor.js:330-341`; delete the degradation
      branch. Must precede or accompany Task 3.
- [ ] **Task 3 — unship (AC#2, AC#4, AC#5).** `package.json` `files[]`; registry per AC#0; install
      block; `install-scope-check.js` snapshot + comment; regenerate the agent manifest; hand-delete
      `skill-manifest.csv` row 106; retire the two `name-registry.csv` rows and the dead carve-out;
      `_bmad/bme/README.md:15`.
- [ ] **Task 4 — leave nothing vacuous (AC#6).** Disposition every site in the AC#6 list.
- [ ] **Task 5 — documentation and Covenant (AC#7, AC#9, AC#10).** Audited corpus; replacement
      Covenant examples from Vortex or Gyre; delete the `T150` clauses but keep
      `(from exported rosters)`; reword `docs/testing.md:102`; new `CHANGELOG.md` entry.
- [ ] **Task 6 — the migration (AC#8).** Append to `registry.js`; prefer `moveToDeprecated`; safety
      analysis; test against a fixture project.
- [ ] **Task 7 — gates (AC#2, AC#13).** `npm run lint` clean on every file this story modifies;
      `npm test`; `npm run docs:audit` exit 0; `node scripts/audit/backlog-integrity.js`;
      `install-scope-check`; `name-registry-integrity`; `agent-surface-parity`; and
      `scripts/audit/try-fresh-install.sh` — the only gate that exercises the packed tarball, and the
      one that catches AC#3.
- [ ] **Task 8 — consumer audit and backlog close (AC#11, AC#12).** Independent of the implementer.

## Dev Notes

### Current state of what changes

- **`scripts/update/lib/agent-registry.js`** — `EXTRA_BME_AGENTS` at `:228-243`, one entry;
  `EXTRA_BME_AGENT_IDS` derived at `:244`; both exported at `:290-291`; a disjoint-ID IIFE at
  `:246-278` throws at require-time on collision.
- **`scripts/update/lib/refresh-installation.js`** — destructures eight named exports at `:12` and
  performs **no** dynamic enumeration, so a new export would be inert here (this is why `T150`'s fix
  was never an installer change). Five `EXTRA_BME_AGENTS` sites: `:12`, the copy block `:222-276`, the
  stale-wrapper sweep `:812`, the skills generation loop `:879-902` (**not** guarded by `!isSameRoot`,
  unlike its siblings — it writes into a dev tree too), and `STAMPABLE_MODULES` at `:1418-1424`, which
  is module-level and frozen, so a throw there happens at import and takes `scripts/lib/bme-modules.js:92`
  with it.
- **`scripts/docs-audit.js`** — `rostersFor` `:48-52` enumerates by suffix over `Object.keys`, so it
  needs no edit when a roster disappears; `validCountsFor` `:98-106` drops zero-length rosters, which
  is why an emptied array and a deleted export produce the **same** valid set.
- **`_bmad/bme/_team-factory/config.yaml`** — declares `agents: [team-factory]` and
  `workflows: [add-team]`; ships `version: 1.0.0`, stamped to the package version at install. The
  `workflows:` value is a bare string, which `installed-tree.js` skips — which is why a tree that
  arrives with an emptied registry declares **zero** invocable units and trips ADR-004 C3.

### Traps

- **Never `git stash`.** The operator commits from GitHub Desktop mid-session; a stash/pop race stages
  a revert of their work.
- **Never instruct line-level staging on a modified line.** A modified row is `-old` / `+new`; staging
  the `-` side alone deletes it silently. This has destroyed backlog records twice.
- **`npm pack --dry-run`** is the only way to know what ships. `files[]` is a declaration; the tarball
  is the fact.
- **Two of this story's own source figures were wrong on first pass** and were corrected by execution:
  a write-op count read from a history comment instead of the live entry, and `agent-manifest.csv`
  described as a shipping site when it is not in `files[]`. Re-derive; do not trust this file's prose
  over the tree.

### Testing standards

`test-fixture-isolation` — every `runScript` call passes `{ cwd: tmpDir }`; the migration test builds
its own fixture project. `derive-counts-from-source` — no literal agent or workflow count enters a new
assertion. `verification-pipefail` — any verification command that pipes sets `set -o pipefail` or reads
`${PIPESTATUS[0]}`; note the local shell is zsh, where it is `${pipestatus[1]}`.
`lint-passes-before-review` — `npm run lint` unfiltered, zero warnings in files this story modifies.

### References

- [convoke-epic-team-factory-unship.md](../planning-artifacts/convoke-epic-team-factory-unship.md) — §Ordering carries all thirteen constraints with citations
- [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) — `T179` at `:477`, `T150` at `:337`
- [convoke-note-backlog-completed-archive.md](../planning-artifacts/convoke-note-backlog-completed-archive.md) — § `## BUG-14`, the `skill-manifest.csv` candidate-list trap
- [tfr-2-1-delete-the-regression-check-that-cannot-fail.md](tfr-2-1-delete-the-regression-check-that-cannot-fail.md) — the deletion-shaped precedent this story is modelled on
- [project-context.md](../../project-context.md) — `path-safety-for-destructive-ops`, `verification-must-be-falsifiable`, `code-review-convergence`, `commit-preparation`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-09-28 | Authored. Status `deferred` pending AC#0. Scoped from a three-layer read-only audit against `21ed0512`; T179's four named sites expanded to thirteen cited ordering constraints, and three of its four re-derived as inaccurate. |
