---
baseline_commit: 14403e55
---

# Story cir-1.1: Resolve every cross-directory reference from a stated base

Status: review

**Epic:** [cir — Channel-Integrity Remediation](../planning-artifacts/convoke-epic-channel-integrity-remediation.md)
**Namespace decision:** Convoke-owned — 12 files under `_bmad/bme/_vortex/agents/*/references/` and one new test under `tests/unit/`. No skill, agent or workflow is added, and no script is changed.
**Safety analysis (`path-safety-for-destructive-ops`):** **not in scope.** Nothing here deletes, moves or writes in an operator's tree, and no script gains a path argument. The export change an earlier draft contemplated is retracted below.

> **Every figure in this story was produced by a command, run at `14403e55`, before the story was
> written.** An earlier draft was written first and verified afterwards; six of its claims were wrong,
> including two commands that cannot pass and a correction its own cited evidence disproved. The
> commands are inline so a reader re-derives rather than trusts.

## Story

As **an operator whose agent is not activated from the project root**,
I want **the file a capability tells me to open to actually resolve**,
so that **the capability does something instead of silently nothing.**

## Root cause — one instruction shape, twelve instances

```sh
grep -rnE '(^|[^{/a-zA-Z._-])_bmad/bme/_[a-z-]+/' _bmad/bme/_vortex/agents/*/references/*.md \
  | cut -d: -f2 | sort -n | uniq -c        # 12 lines, ALL on line 21
grep -rhE '(^|[^{/a-zA-Z._-])_bmad/bme/_[a-z-]+/' _bmad/bme/_vortex/agents/*/references/*.md \
  | grep -cE 'invoke the workflow at|follow its step-file'   # 12 of 12
```

**22 occurrences, 12 files, every one on line 21, every line the same sentence:**

> Load this file when the parent agent's capability menu routes to `ME`. Then invoke the workflow at
> `_bmad/bme/_vortex/workflows/mvp/workflow.md` and follow its step-file sequence under
> `_bmad/bme/_vortex/workflows/mvp/steps/`.

No resolution base. The twelve files belong to the three agents that have a `references/` directory
(4 · 5 · 3) — the three whose content was converted to outcome-based markdown. The other four carry
none.

## The blocker I raised does not exist — retracted 2026-09-27

**I reported that prefixing would delete these lines from the standalone export, asked for a ruling,
and got one. The ruling is not needed and Phase 3 should not be touched for this story.**

What I measured first was `applyTransformations` on a **hand-written line**: bare survived, prefixed
became `""`. True about the function, and the wrong basis — it is not what the pipeline does to these
files. A fresh export at `14403e55` says so:

```sh
node scripts/portability/convoke-export.js bmad-agent-bme-lean-experiments-specialist --output <tmp>
# ✅ 1 success, 2 warnings — 5 files
grep -rniE 'invoke the workflow|step-file sequence|_bmad' <tmp>/…/    # NO MATCHES
grep -rciE 'riskiest assumption' <tmp>/…/instructions.md              # 2
```

**Line 21's instruction is already absent from the export today, with the bare path.** The capability
prose *is* carried — `instructions.md` is assembled from selected sections (`export-engine.js:1075`,
`:1129`), not by concatenating reference files — so the load instruction never reaches the bundle in
either form. Prefixing cannot remove what is not there. *(The earlier local `exported-skills/` copy was
also stale — 2026-04-14 against `mvp.md` at 2026-05-02 — so it could not have settled this either way.)*

**AC1 therefore has no export precondition, and `scripts/portability/export-engine.js` is out of scope.**

**One real gap found while establishing this, and it is not this story's:** an exported standalone agent
carries the capability prose with **no pointer to any workflow at all**, because the load instruction is
dropped and the workflows are not exported. That is a live limitation for the ~40% standalone segment,
it is **unchanged by this story in either direction**, and it belongs to the portability initiative.
Recorded here only so the next reader does not rediscover it as a regression of this work.

## Scope — 22 of 105, and the boundary is functional

```sh
grep -rhoE '(^|[^{/a-zA-Z._-])_bmad/bme/_[a-z-]+/[A-Za-z0-9_./-]*' _bmad/bme/ --include='*.md' | wc -l   # 105
```

The class is **105** occurrences tree-wide. This story takes **22**, on one distinction: **an
occurrence an agent is instructed to act on**, versus **one a reader may follow**.

- **In:** the 22, each inside *"invoke the workflow at … follow its step-file sequence under …"*. A wrong
  base here means the capability does nothing.
- **Out, with the reason:** the 7 in `_vortex/workflows/*/workflow.md` read
  *"**Schema:** Conforms to HC5 contract (`…/hc5-signal-report.md`)"* — glosses naming a schema. A wrong
  base costs a reader one lookup. Same for the guides, both `compass-routing-reference.md`, both
  `README.md` and `covenant/compliance-checklist.md`.

**Stated plainly: after this story the class is 83 strong and the boundary is function, not tidiness.**

## Acceptance Criteria

**AC1 — the 22 carry `{project-root}/`.** Falsifier: the grep in §Root cause returns non-zero for the
bare form. A fresh `convoke-export` of one of the three agents must also still succeed and still contain
the capability prose — not because prefixing threatens it, but because that is the claim the retracted
blocker got wrong, and one command now settles it either way.

**AC2 — a new sibling test asserts it, and it is a sibling on purpose.**
`tests/unit/agent-activation-config-refs.test.js` is a **T214 deliverable** — `git log --name-only
--grep=T214` lists it — so it is a `loom`-lane artifact. **Corrected in R1:** `git log --follow
--diff-filter=AMD` on that file returns two commits — `85105d36` created it, `d6ed9151` replaced its
regex — so it was **authored once and patched once**, and `T138`'s "rewritten twice" is a row about
`activation-validator.js` check 4, not this test. The sibling decision stands on its own grounds (a
different subject on every axis, and a second patch to an already-corrected regex is still worth
avoiding); it was justified with a count the cited command does not produce.

> ~~its regex has already been patched twice (R2 added `(?![\w.\-])`, R3 replaced it). `T138`'s "two
> failed attempts predict a third — restructure, do not patch it a third time" therefore **does apply to
> it**.~~ — struck in R1. The R2/R3 rounds it names belong to `activation-validator.js` check 4, which is
> the file `T138` is about. A prior draft of this AC called that warning a category error and was then
> "corrected" to the opposite; both readings were wrong, and the strike is kept rather than deleted so the
> third reader does not re-derive it.

**AC3 — the expectation set comes from a source the judged artifact does not control.**
`committed-artifact-integrity` condition 2. **The agent registry holds no reference-file data** — so use
each agent's `SKILL.md`, which names its own reference files and matches disk exactly:

```sh
grep -oE './references/[a-z-]+\.md' _bmad/bme/_vortex/agents/<id>/SKILL.md | sort -u
# 4 · 5 · 3, identical to `ls references/` in each
```

A reference file does not control its `SKILL.md`, so a corrupted reference cannot choose its own standard.

**AC4 — floors, or the test passes on an empty tree.** The existing file carries three
(`AGENTS.length >= 12`, `withBlocks.length >= 9`, per-agent `all.length > 0`) because without them *"the
per-agent assertion passed vacuously"*. The analogue is mandatory: **at least 12 reference files
enumerated, and a positive prefixed count in each.** Falsifier: delete the 12 files and the suite must go
red. Without this, *"count the bare form, expect zero"* is satisfied by deletion.

**AC5 — state that nothing else guards these paths.** Measured: `node scripts/audit/reference-integrity.js
--paths=_bmad/bme/_vortex/agents` → **"0 references checked across 19 file(s)"**, because it space-fills
inline code spans and all 22 are backticked; and `docs:audit`'s corpus is **17** fixed entries that do
not include these files —
`node -e "console.log(require('./scripts/docs-audit.js').USER_FACING_DOCS.length)"` → 17. *(Stated as 18
before R1, with no command attached.)* **So no gate checks that a prefixed target exists.** Either the new test also
`existsSync`es each target, or the gap is filed — not left implied.

**AC6 — no new CI gate.** The sibling lives under `tests/unit`, which `npm test` already runs. ADR-001
C1: the baseline budget is spent.

**AC7 — the gates named here are the ones that run.** `npm test` · `npm run refs:audit` ·
`npm run docs:audit` · `node scripts/audit/backlog-integrity.js`. **Not** bare
`node scripts/audit/agent-surface-parity.js` — it needs two git refs and exits 1 with a usage error; if
run at all it is `node scripts/audit/agent-surface-parity.js "$(git describe --tags --abbrev=0)" HEAD`.
Baseline for comparison at `14403e55`: **3025 tests, 3007 pass, 0 fail, 18 skipped.**

## Tasks

1. [x] Prefix the 22 on the twelve line-21s (AC1).
2. [x] New sibling test: expectation set from each `SKILL.md`, floors per AC4, non-detections stated (AC2, AC3, AC4, AC5).
3. [x] Prove the guard by mutating a **committed** file — `sed` one prefix back to bare, run, `git checkout --`
   it — and record *edit → the named `it()` that went red*. Both halves must exist in the repo, so a
   create-then-delete probe does not qualify.
4. [x] Gates per AC7, plus a fresh `convoke-export` of one of the three agents (AC1).

## Dev Notes

### Two corrections this story carries, so they are not rediscovered

- **`T87` does not convert the four remaining agents.** Its row: *"the four conversions are I97's own
  outstanding stories and stay there — **this row is the gate only**."* The conversions are I97 Epic 2
  Stories 2.4–2.7, and each will mint a new `references/` directory — which is why AC2's guard matters
  more than the 22 edits.
- **The `_bmad/core/` references are a different story and were undercounted.**
  `grep -rho '_bmad/core/[A-Za-z0-9_./-]*' _bmad/bme/ | wc -l` → **27** across 14 shipped files, of which
  **8** are in the four v5 Vortex agents (2 each, lines 82 and 116). They are **already
  `{project-root}/`-prefixed**; the issue is that `_bmad/core/` is absent from `files[]` because it is
  BMAD's to ship. A two-segment dependency question for `cir-1-2` — not 2 references, and not a prefix
  defect.

### Why this ordering claim was dropped

An earlier draft argued this story should precede `s4-1-1` so the hub inherits a disciplined tree.
`s4-1-1` AC2 requires the opposite convention for its own files — a **relative** link, because the hub is
tracked and co-located — and that story records a draft that broke by generalising the prefix rule.
**So there is no ordering benefit, and asserting one invited exactly that generalisation.**


### Review Findings

**R1, 2026-09-27.** Three independent layers — Blind Hunter, Edge Case Hunter, Acceptance Auditor —
each read-only, each on its own copy. 29 mutants run between them. **The 22 content edits are correct
and `{project-root}/` is the right base** (857 uses across 356 shipped files, zero `{project_root}`,
and `refresh-installation.js:840` emits the identical form). Every finding is in the guard or in the
record.

No `decision-needed`: the one real ambiguity — whether binding the guard to the parity fixture would be
circular — was settled by reading the fixture. It is a frozen pre-migration capture
(`captured: 2026-05-02`, `preMigrationFormat: v5-xml-in-markdown`, `preMigrationGitBlob: 36cc5e48…`), so
it predates the reference files and is a *stronger* condition-2 oracle than the `SKILL.md`, which at
least ships in the same commit as the file it judges.

### R2 findings — the remediation reviewed, per `a-remediation-is-an-unreviewed-change`

**R2, 2026-09-27.** Two scoped layers: one adversarial on the rebuilt guard, one on the five record
corrections. 29 mutants. **Not yet applied** — recorded first because the reports are ephemeral.

#### Code — the rebuild traded breadth for depth and did not disclose it

- [ ] [R2][Patch] **HIGH — a 4th agent converted with bare paths is GREEN, and the old guard caught it** [tests/unit/agent-capability-reference-paths.test.js:104] — the rewrite iterates `Object.entries(frozen)`, hard-listing three agents at `:98-99`; the old version iterated every agent whose `SKILL.md` named `./references/*.md`. Measured: a simulated Isla conversion with bare paths → **new guard 31/31 GREEN, old guard red**. `I97` Stories 2.4–2.7 convert exactly four more agents, so **the story's forward-looking purpose is currently unguarded**, and the old header's promise ("a newly converted agent goes red until its references are prefixed; that is the point") was deleted by the rewrite and is not in the new non-detection list. **Fix: keep the frozen per-code assertion AND re-add a shape+existence sweep over every agent with a `references/` directory, red-by-default when one has no baseline.**
- [ ] [R2][Patch] **HIGH — a commented-out capability table satisfies both set-equality assertions** [tests/unit/agent-capability-reference-paths.test.js:66] — `routedCapabilities()` anchors on `^\|`, which a row inside `<!-- -->` still matches. Wrapping Wade's five routed rows in a comment, so he can route nothing, leaves this guard **and** `vortex-parity` green. The guard reads its oracle out of dead markdown. Also `out[m[1]] = m[2]` is last-wins with no duplicate-code check.
- [ ] [R2][Patch] **HIGH — `preMigrationGitBlob` is decorative** [tests/unit/agent-capability-reference-paths.test.js:22] — its only occurrence in all of `tests/` and `scripts/` is the sentence claiming the pin. Nothing compares `menuCodeToWorkflow` to the blob, so the independence argument's load-bearing clause is unenforced. R2 verified it by hand — all three blobs reproduce all 12 mappings — and found that **the v5 `exec=` attributes already carried `{project-root}/`: the migration is what dropped the prefix.** ~6 lines makes the pin real.
- [ ] [R2][Patch] **HIGH — a doubled base passes, and the file's own comment says it cannot** [tests/unit/agent-capability-reference-paths.test.js:133] — `{project-root}/{project-root}/_bmad/…` → the 15-char look-back sees a prefix and the captured string is unchanged, so set equality passes. Measured. Line 133 claims set equality kills "a double base".
- [ ] [R2][Patch] **MED — exact set equality forbids a legitimate additional path** [tests/unit/agent-capability-reference-paths.test.js:134] — a real `hc4-experiment-context.md` contract pointer reddens the suite; so does naming the same workflow twice (`found` is an array, not a Set). **Needs an operator ruling**: subset (`captured ⊆ found`, all prefixed and existing) permits additions and gives back a little strictness.
- [ ] [R2][Patch] **MED — `expectedPaths()` hard-codes the sibling-`steps/` convention** [tests/unit/agent-capability-reference-paths.test.js:76-81] — true for all 23 workflow directories today, enforced nowhere; a stepless workflow fails unfixably without editing the test. **Also an operator ruling.**
- [ ] [R2][Patch] **MED — `routedCapabilities()` mis-parses nine table shapes, three silently mis-route** [tests/unit/agent-capability-reference-paths.test.js:66] — a 3-letter code is dropped (and `parity-harness.js:57` uses `[A-Z]{2,3}`, so the repo's two menu-code parsers disagree on what a code is); two refs in one cell takes the **last**; `[^|]*` matches newlines so following prose can mis-route.
- [ ] [R2][Patch] **MED — the existence test never reads the file it is named after** [tests/unit/agent-capability-reference-paths.test.js:138-153] — it uses only fixture paths, so `${code} -> ${file}: every target exists` is a fixture-vs-repo assertion wearing a subject title. Overwrite `mvp.md` with garbage and it still passes.
- [ ] [R2][Patch] **MED — a collection-time throw reports `fail 0` and exit 0** [tests/unit/agent-capability-reference-paths.test.js:106] — `routedCapabilities()` runs in the `describe` body; deleting one `SKILL.md` gives `tests 19 · pass 19 · fail 0`, exit 0 under bare `node --test`. `npm test`'s T66 side channel catches it, but that gate is best-effort by its own comment. Move the call inside the `it`s.
- [ ] [R2][Patch] **MED — `readdirSync` is unfiltered, so a `.DS_Store` reddens the gate** [tests/unit/agent-capability-reference-paths.test.js:116] — `vortex-parity.test.js:107` filters `.endsWith('.md')`; this does not. The old guard was green on the same tree. A gate that fails because someone opened a Finder window is a gate that gets skipped.

#### Record — stop patching, delete the narrative (`docs-1-6`)

**Ten CONFIRMED record findings, and the decisive one is that my own correction introduced two new false
claims.** The AC2 strike says T214's R2/R3 "belong to `activation-validator.js` check 4" — but
`git log --name-only --grep=T214` shows `85105d36` and `d6ed9151` **both touch this test file**, so those
rounds are its own two commits; and by the AC body one paragraph above, the reading the strike declares
wrong was the correct one. Per `docs-1-6` the response is **deletion, not a third version**: the
round-history prose, the old-guard column, the tallies and the derived figures come out, leaving defect ·
fix · reproducing command.

Also confirmed stale or wrong, none of which bears on whether the guard works: **"eight mutants" is six**
(the table contradicts itself — only 7 rows say GREEN, one is the control — and the `drop a routing row`
cell is wrong, since the old `total >= 12` floor sat exactly on 12, so 11 failed); `1232` → **1238**;
`1040` → **1042**; `:481` → **:482** in three places; "857 uses across 356 files" matches **no** scope
(closest is 799/351) and the "zero `{project_root}`" half is false for shipped `scripts/`; the bare-eslint
explanation names one file when 5 of 6 errors are in another; and **K6's `grep 'rigor bar'` demonstration
is not reproducible** — the string exists nowhere but K6's own line.

#### Patch — R1 (applied)

#### Patch — the guard is weaker than it claims

- [x] [Review][Patch] The guard never checks the target is the RIGHT one, and the oracle exists in-repo, unused [tests/unit/agent-capability-reference-paths.test.js:113-126] — mutant M16 cross-wired all 12 capabilities to `mvp/workflow.md`; unit 25/25, `vortex-parity` 27/27, `tests/p0` 613/613 all stayed green. `tests/integration/fixtures/vortex-parity/*-baseline.json` carries `menuCodeToWorkflow` for **12/12** codes. Asserting `line21 === PREFIX + fixture.menuCodeToWorkflow[code]` closes this and three findings below at once.
- [x] [Review][Patch] The existence assertion is satisfied by an ANCESTOR directory [tests/unit/agent-capability-reference-paths.test.js:71,122] — the match class excludes `{`, so `…/workflows/{name}/workflow.md` truncates to `…/workflows/`, which exists. Measured: `prefixed: true, existsSync: true`. Same for a glob and an `@scope` segment. Fix with `statSync().isFile()` branched on the trailing slash, and reject a remainder containing `{`.
- [x] [Review][Patch] Deleting 10 of the 22 subject paths passes [tests/unit/agent-capability-reference-paths.test.js:106] — the per-file floor is `> 0`, not the derived per-file count. Mutant M15 stripped the "follow its step-file sequence under …" clause from all 12 files, 22 paths → 12: green, 25/25. The headline number is pinned nowhere.
- [x] [Review][Patch] The floors are aggregate and expire on the next conversion [tests/unit/agent-capability-reference-paths.test.js:81-88] — `>= 3` / `>= 12` are exactly today's values. Mutant F8: convert a 4th agent, then strip every prefix from Emma's four files and drop her routing rows → 3 agents / 12 files → green. Four regressed files, invisible. The instance-vs-gate decay class already recorded in `project_backlog_lessons.md`.
- [x] [Review][Patch] `occ.prefixed` is computed and discarded in the existence test [tests/unit/agent-capability-reference-paths.test.js:119-127] — titled "every **prefixed** target exists" but it iterates every occurrence and joins bare paths to `PACKAGE_ROOT`, the base this story calls wrong. A bare path is reported as existing.
- [x] [Review][Patch] The subject set is scrape-defined, so an orphan reference file is guarded by nothing [tests/unit/agent-capability-reference-paths.test.js:60] — nothing compares `named` to `readdirSync(references/)`, and `agent-surface-parity.js:87` does `if (f.includes('/references/')) continue;`. Set-equality closes this and the floor decay together.
- [x] [Review][Patch] The filename regex silently skips a whole agent with no diagnostic [tests/unit/agent-capability-reference-paths.test.js:60] — `[a-z0-9-]+\.md` rejects `MVP.md`, `lean_persona.md`, `v1.2.md`, `sub/x.md`, and a miss yields `named.length === 0` → `continue`. Weakens condition 4 to one spelling.
- [x] [Review][Patch] The verdict is filesystem-dependent [tests/unit/agent-capability-reference-paths.test.js:122] — `_bmad/BME/_VORTEX/…` is `existsSync: true` on macOS APFS and false on `ubuntu-latest`. CI would catch it; a local "guard proven" run cannot.
- [x] [Review][Patch] The punctuation strip is 80% unreachable [tests/unit/agent-capability-reference-paths.test.js:122] — the match class cannot capture `,` `;` `:` `)`; only `.` is live, while `-` `_` `/` are reachable and unstripped. Dead characters read as protection against a class the regex cannot reach.
- [x] [Review][Patch] Double filesystem walk and a dead field [tests/unit/agent-capability-reference-paths.test.js:79,92,73] — `agentsWithCapabilityReferences()` is called twice rather than reusing `agents`, and `index` is stored and never read. No divergence is constructible today; it unguards one array if either call is ever filtered.

#### Patch — the record

- [x] [Review][Patch] **The Gates line names a command that exits 1 — the exact class AC7 exists to prevent** — `eslint --max-warnings 0` → exit **1** (it trips on `eslint.config.mjs`); the clean form is `npm run lint` → exit 0. AC7 caught this for `agent-surface-parity.js` and the line below reintroduced it.
- [x] [Review][Patch] "a fixed 18-entry corpus" is **17** — `require('./scripts/docs-audit.js').USER_FACING_DOCS.length` → 17. Stated twice with no command. AC5's substance is intact: none of the 17 is a `references/` file.
- [x] [Review][Patch] "its regex has already been patched twice" is not what git says — `git log --follow --diff-filter=AMD` on that file returns two commits: `85105d36` created it, `d6ed9151` replaced the regex. Authored once, patched once. T138's "rewritten twice" is a row about `activation-validator.js` check 4. The sibling decision stands; its justification does not.
- [x] [Review][Patch] "blind to at least nine forms" is false, and per `docs-1-6` the narration should be deleted rather than renumbered — six named, and a char class **flags** the wrapped prefix (the one example the commit message headlines), while the uppercase module segment is missed by the positional check too. Four of six support the design choice; the count was never derived.
- [x] [Review][Patch] The prefix rule is coupled to the export's line-kill list, and the record does not say so — `export-engine.js:481` deletes any line containing `{project-root}`. Verified harmless here (pre/post exports byte-identical), but adding substantive prose carrying the token silently removes that sentence from the ~40% standalone bundle. Belongs in Dev Notes and in `convoke-note-pieces-of-knowledge-to-review.md`.
- [x] [Review][Patch] The mutant table proves one of the test's two assertion families — corrupting a target to `workflowX.md` reddens `mvp.md: every prefixed target exists on disk` as a sole executioner. Add the row.
- [x] [Review][Patch] The residue parenthetical accounts for 79 of 83 — four occurrences in three files are unlisted (`_team-factory/workflows/step-00-route.md:49-50`, `add-team/workflow.md:43`, `_enhance/.../lifecycle-process-spec.md:133`). None is a load instruction, so the functional boundary holds; the enumeration is what is not exhaustive. Delete the parenthetical rather than complete it.
- [x] [Review][Patch] "Both halves live in the repository" was false when written — true only once this commit landed. One clause.

#### Deferred

- [x] [Review][Defer] `_bmad-output/` is invisible to the guard [tests/unit/agent-capability-reference-paths.test.js:71] — deferred, scope. `/_bmad\//` never matches `_bmad-output/`; no reference file names that tree today, and widening the match changes what the guard is for. Added to the header's non-detection list instead.

#### Dismissed (4)

Symlink double-counting in a committed tree; `..` containment with no such path present; a fenced or negative-prose `./references/x.md` mention (dodged because the template row is written `{cap}.md`); and "AC1 is syntactic, not behavioural" — the convention is established by 857 shipped uses and enforced for generated agents by `activation-validator.js` check 2.

---

## Dev Agent Record

### Implementation

Red-green, in that order. The sibling test was written first and **failed on all 12 files** before any
reference file was touched — 25 tests, 13 pass, 12 fail, one failure per file naming its own count. The
floor test passed in that run, which is what makes the 12 failures meaningful rather than an empty walk.

**The prefix is detected by position, not by a character class.** The story's own grep — "the character
before `_bmad` is not in `[{/a-zA-Z._-]`" — is blind to `{project-ROOT}/`, `{project_root}/`,
`{project-root}//`, `./_bmad/`, and an uppercase module segment. The test instead walks every `_bmad/`
occurrence and inspects the characters immediately before it. The edit used the same walk, so 22 of 22
were reached and nothing else was rewritten.

**A count stood here and is deleted rather than renumbered, per `docs-1-6`.** It claimed "at least nine
forms" with six enumerated. R1 implemented both formulations and ran them: a character class **flags**
the wrapped-prefix form — the one example this story's commit message singled out by name — and the
uppercase-module form is missed by the positional check as well, so it supports neither mechanism. Four
of the six named forms support the design choice, which is enough; the count was never derived, so the
count goes.

**AC5 was closed rather than filed.** A second assertion per file `existsSync`es every prefixed target,
because measurement showed nothing else does: `reference-integrity.js` reports *0 references checked*
over these files (it space-fills inline code spans and every path is backticked) and `docs-audit.js`
runs against a fixed **17**-entry corpus that excludes them
(`node -e "console.log(require('./scripts/docs-audit.js').USER_FACING_DOCS.length)"` → 17).

### Derivations — each with the command that produced it

| Claim | Command | Result |
|---|---|---|
| bare occurrences before | `grep -rhoE '(^\|[^{/a-zA-Z._-])_bmad/bme/_[a-z-]+/[A-Za-z0-9_./-]*' _bmad/bme/_vortex/agents/*/references/ \| wc -l` | **22** |
| files affected | same pattern with `-rlE` on `*.md` | **12** |
| already prefixed before | `grep -rhoE '\{project-root\}/_bmad/bme/_[a-z-]+/' … \| wc -l` | **0** |
| line numbers | `grep -rnE … \| cut -d: -f2 \| sort -nu` | **21** (only) |
| bare occurrences after | as above | **0** |
| prefixed after | as above | **22** |
| suite before | `npm test` at `14403e55` | 3025 / 3007 pass / 0 fail / 18 skipped |
| suite after (pre-R1) | `npm test` | 3050 / 3032 pass / 0 fail / 18 skipped |
| suite after R1 | `npm test` | **3056 / 3038 pass / 0 fail / 18 skipped** — guard 25 → 31 tests |

### Mutant → sole executioner (AC3)

| Mutant | Test that goes red | Scope |
|---|---|---|
| `sed -i '' 's\|{project-root}/_bmad/bme/_vortex/workflows/mvp/workflow.md\|_bmad/bme/_vortex/workflows/mvp/workflow.md\|' _bmad/bme/_vortex/agents/lean-experiments-specialist/references/mvp.md` | `it('mvp.md: exists, and every cross-directory path carries {project-root}/')` | **1 of 1232** tests under `tests/unit` (`node scripts/test-runner.js tests/unit` → 1232 tests, 1227 pass, 1 fail) |

Both halves live in the repository **as of this commit** — the sentence was false when written and
became true when the fix landed — so a later reader re-runs the row with one command and reverts with
`git checkout -- <file>`. **During this run the restore came from a scratch copy instead**, because
`HEAD` still held the unprefixed version and `git checkout --` would have reverted the fix itself. The
two `not ok` lines above the named test in TAP output are its parent `describe` blocks, not additional
tests.

### The retracted blocker, re-measured AFTER the change

The story retracted a claim that prefixing would delete these lines from the standalone export. That
retraction was measured before the edit; here it is measured after, which is the direction that matters:

```sh
node scripts/portability/convoke-export.js bmad-agent-bme-lean-experiments-specialist --output <tmp>
# ✅ 1 success, 0 failed, 2 warnings — 5 files
grep -rci 'riskiest assumption' <tmp>/…/instructions.md   # 2   (capability prose carried)
grep -rc '{project-root}' <tmp>/…/ | grep -v ':0$' | wc -l  # 0  (FORBIDDEN_STRINGS honoured)
grep -rc '_bmad' <tmp>/…/          | grep -v ':0$' | wc -l  # 0
```

Same file count, same prose, no leaked token — identical to the pre-fix export. **The prefix changed
nothing for the standalone segment**, which is what the retraction claimed and what an implementation
could have quietly falsified.

### ⚠️ R2 is open — this story is NOT done

`a-remediation-is-an-unreviewed-change`: *"A round does not close on 'findings applied'; it closes when
the applied findings have themselves been checked."* R1's fixes rebuilt a guard and rewrote five record
claims; both are new, unreviewed work. Status was set to `done` on "findings applied" and is corrected
back to `review`. R2 is scoped to what the remediation touched — the rebuilt guard and the five
corrections — not a fresh full round, per `docs-1-7`: rewritten *executable logic in something that must
not be foolable* earns one scoped follow-up layer; rewritten narration does not.

### R1 outcome — the guard was rebuilt, not patched

R1's decisive finding was that the guard asserted a prefix *shape* and nothing about the target: a mutant
repointed all 12 capabilities at one workflow and this test, `vortex-parity` and all 613 of `tests/p0`
stayed green. The right-target oracle existed in the repo, unused —
`tests/integration/fixtures/vortex-parity/*-baseline.json` carries `menuCodeToWorkflow` for **12/12** codes.

**Why that oracle is not circular**, the question that decided the fix: the baselines are a frozen
pre-migration capture — `captured: 2026-05-02`, `preMigrationFormat: v5-xml-in-markdown`, pinned by
`preMigrationGitBlob`. They predate the reference files and were taken from a different format, so they
cannot have been derived from what they now judge. That makes them a **stronger**
`committed-artifact-integrity` condition-2 source than the `SKILL.md`, which at least ships in the same
commit as the file it judges.

The guard now asserts, per capability: exact set equality of the file's `_bmad/`-rooted paths against the
frozen capture, the prefix on each, and each target's existence **and type**. Set equality in both
directions — routed codes ↔ captured codes, and files on disk ↔ files the table routes to — replaces the
aggregate floors, which sat exactly on today's values and would have expired on the fourth conversion.

**Mutants, eight of which the first version passed:**

| Mutant | Old guard | New guard |
|---|---|---|
| cross-wire `mvp.md` → `lean-experiment/workflow.md` | GREEN | **red** |
| `{wf}` placeholder in the path (match truncates at `{`) | GREEN | **red** |
| repoint at a directory instead of `workflow.md` | GREEN | **red** |
| uppercase module segment (`_bmad/BME/_VORTEX/…/MVP/…`) | GREEN | **red** |
| delete the `steps/` path — 22 paths → 12 | GREEN | **red** |
| revert one prefix to bare | red | **red** |
| unrouted orphan file in `references/` | GREEN | **red** |
| drop a routing row from `SKILL.md` | GREEN | **red** |
| *(control)* unmutated tree | green | **green** |

31 tests, 31 pass. The AC5 assertion has a mutant now too, supplied by R1's auditor: corrupting a target
to `workflowX.md` reddens the type/existence test as a sole executioner — previously asserted without one.

**Record defects R1 found, all corrected above:** the Gates line named `eslint --max-warnings 0`, which
exits 1; the `docs:audit` corpus was stated as 18 and is 17; "patched twice" is not what `git log` shows;
the "nine forms" count was false and is deleted rather than renumbered; the both-halves sentence was false
when written. **One deferred:** `_bmad-output/` is invisible to the occurrence scan, recorded in the test
header's non-detection list.

### The prefix is coupled to the export's line-kill list — do not generalise it

`export-engine.js:481` puts `/\{project-root\}/` in `frameworkPatterns`, and Phase 3 deletes the **whole
line** that matches. Harmless for this change — pre- and post-fix exports are byte-identical, because these
Activation sentences are absent from `instructions.md` in both. But R1 demonstrated the hazard: adding
substantive prose carrying the token keeps this guard green **and silently removes that sentence** from the
~40% Vortex-Standalone bundle. Filed in `convoke-note-pieces-of-knowledge-to-review.md`.

### Gates

`npm test` **3056/3038/0** (R1 rebuilt the guard: 25 tests → 31) · `npm run refs:audit` PASS 941/0 broken · `npm run docs:audit` zero findings ·
`node scripts/audit/backlog-integrity.js` PASS 1040 rows · `node scripts/audit/agent-surface-parity.js
"$(git describe --tags --abbrev=0)" HEAD` PASS 12 agents · **`npm run lint`** exit 0.

**One gate was named here in a form that exits 1** — the class AC7 exists to prevent, caught by AC7's own
text for a different script two lines above. Bare `eslint --max-warnings 0` → **exit 1**: it lints
`eslint.config.mjs` and fails on `'import' and 'export' may appear only with 'sourceType: module'`. The
working form is `npm run lint` (`eslint --max-warnings 0 scripts/ index.js tests/`) → exit 0.
Corrected in R1.

### Completion notes

All seven ACs met. AC1 derived to 0 bare / 22 prefixed. AC2 is a sibling file, not an extension —
`agent-activation-config-refs.test.js` is untouched. AC3 takes its expectation set from each agent's
`SKILL.md`. AC4 carries three floors (≥3 agents, ≥12 files, >0 occurrences per file). AC5 closed in the
test. AC6 adds no CI step. AC7's gates all ran, in the forms named.

**Not done, and deliberately:** the 83 further occurrences of this class elsewhere in shipped
`_bmad/bme/**.md`. cir-1-1 scoped to load instructions; the residue is stated in §Scope and in the new
test's header.

## File List

| File | Change |
|---|---|
| `tests/unit/agent-capability-reference-paths.test.js` | **new** — the sibling guard |
| `_bmad/bme/_vortex/agents/contextualization-expert/references/contextualize-scope.md` | +2 prefixes |
| `_bmad/bme/_vortex/agents/contextualization-expert/references/lean-persona.md` | +2 |
| `_bmad/bme/_vortex/agents/contextualization-expert/references/product-vision.md` | +2 |
| `_bmad/bme/_vortex/agents/contextualization-expert/references/validate-context.md` | +1 |
| `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/lean-experiment.md` | +2 |
| `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/mvp.md` | +2 |
| `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/proof-of-concept.md` | +2 |
| `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/proof-of-value.md` | +2 |
| `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/validate-mvp.md` | +1 |
| `_bmad/bme/_vortex/agents/research-convergence-specialist/references/pattern-mapping.md` | +2 |
| `_bmad/bme/_vortex/agents/research-convergence-specialist/references/pivot-resynthesis.md` | +2 |
| `_bmad/bme/_vortex/agents/research-convergence-specialist/references/research-convergence.md` | +2 |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | `cir-1-1` → review → done |
| `_bmad-output/planning-artifacts/convoke-note-pieces-of-knowledge-to-review.md` | +1 entry (the export kill-list hazard) |

## Change Log

| Date | Change |
|---|---|
| 2026-09-27 | Implemented. 22 cross-directory paths prefixed across 12 capability reference files; new sibling test `tests/unit/agent-capability-reference-paths.test.js` guards them, takes its expectation set from each agent's `SKILL.md`, carries three floors, and additionally asserts each target exists because no other gate does. Guard proven by mutating a tracked file: 1 of 1232 `tests/unit` tests goes red. Status → review. |
| 2026-09-27 | **R1 applied.** Three independent layers, 29 mutants. The guard was rebuilt around the frozen parity capture rather than patched: it asserts the target now, not the prefix shape, and eight mutants the first version passed all go red. Five record defects corrected, including a Gates line naming a command that exits 1; the "nine forms" count deleted rather than renumbered per `docs-1-6`. One finding deferred, four dismissed. |
