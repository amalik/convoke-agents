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
--grep=T214` lists it — so it is a `loom`-lane artifact, and **its regex has already been patched twice**
(R2 added `(?![\w.\-])`, R3 replaced it). `T138`'s *"two failed attempts predict a third — restructure,
do not patch it a third time"* therefore **does apply to it**. A third patch is the thing to avoid; a
sibling file with its own subject is not. *(An earlier draft of this story claimed that warning was a
category error. It was not.)*

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
inline code spans and all 22 are backticked; and `docs:audit`'s corpus is 18 fixed entries that do not
include these files. **So no gate checks that a prefixed target exists.** Either the new test also
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

---

## Dev Agent Record

### Implementation

Red-green, in that order. The sibling test was written first and **failed on all 12 files** before any
reference file was touched — 25 tests, 13 pass, 12 fail, one failure per file naming its own count. The
floor test passed in that run, which is what makes the 12 failures meaningful rather than an empty walk.

**The prefix is detected by position, not by a character class.** The story's own grep — "the character
before `_bmad` is not in `[{/a-zA-Z._-]`" — is blind to at least nine forms (`{project-ROOT}/`,
`{project_root}/`, `{project-root}//`, `./_bmad/`, a prefix wrapped onto the previous line, an uppercase
module segment). The test instead walks every `_bmad/` occurrence and inspects the characters
immediately before it, so the only way to pass is to carry the exact prefix. The edit used the same
walk, so 22 of 22 were reached and nothing else was rewritten.

**AC5 was closed rather than filed.** A second assertion per file `existsSync`es every prefixed target,
because measurement showed nothing else does: `reference-integrity.js` reports *0 references checked*
over these files (it space-fills inline code spans and every path is backticked) and `docs-audit.js`
runs against a fixed 18-entry corpus that excludes them.

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
| suite after | `npm test` | **3050 / 3032 pass / 0 fail / 18 skipped** |

### Mutant → sole executioner (AC3)

| Mutant | Test that goes red | Scope |
|---|---|---|
| `sed -i '' 's\|{project-root}/_bmad/bme/_vortex/workflows/mvp/workflow.md\|_bmad/bme/_vortex/workflows/mvp/workflow.md\|' _bmad/bme/_vortex/agents/lean-experiments-specialist/references/mvp.md` | `it('mvp.md: exists, and every cross-directory path carries {project-root}/')` | **1 of 1232** tests under `tests/unit` (`node scripts/test-runner.js tests/unit` → 1232 tests, 1227 pass, 1 fail) |

Both halves live in the repository, so a later reader re-runs the row with one command and reverts with
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

### Gates

`npm test` 3050/3032/0 · `npm run refs:audit` PASS 941/0 broken · `npm run docs:audit` zero findings ·
`node scripts/audit/backlog-integrity.js` PASS 1040 rows · `node scripts/audit/agent-surface-parity.js
"$(git describe --tags --abbrev=0)" HEAD` PASS 12 agents · `eslint --max-warnings 0` clean.

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
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | `cir-1-1` → review |

## Change Log

| Date | Change |
|---|---|
| 2026-09-27 | Implemented. 22 cross-directory paths prefixed across 12 capability reference files; new sibling test `tests/unit/agent-capability-reference-paths.test.js` guards them, takes its expectation set from each agent's `SKILL.md`, carries three floors, and additionally asserts each target exists because no other gate does. Guard proven by mutating a tracked file: 1 of 1232 `tests/unit` tests goes red. Status → review. |
