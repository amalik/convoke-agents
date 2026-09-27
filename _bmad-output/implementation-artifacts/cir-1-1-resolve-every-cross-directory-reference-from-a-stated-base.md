---
baseline_commit: 14403e55
---

# Story cir-1.1: Resolve every cross-directory reference from a stated base

Status: ready-for-dev

**Epic:** [cir — Channel-Integrity Remediation](../planning-artifacts/convoke-epic-channel-integrity-remediation.md)
**Namespace decision:** Convoke-owned — 12 files under `_bmad/bme/_vortex/agents/*/references/`, one new test under `tests/unit/`, and (pending §The blocker) `scripts/portability/export-engine.js`. No skill, agent or workflow is added.
**Safety analysis (`path-safety-for-destructive-ops`):** in scope **only if** the export change lands — that edit alters what an operator's exported bundle contains. Nothing here deletes or writes in an operator's tree and no script gains a path argument.

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

## ⛔ The blocker: as things stand, the fix deletes the sentence it fixes

Measured, not reasoned:

```sh
node -e "…applyTransformations(line)…"
BARE   -> "…Then invoke the workflow at `_bmad/…/workflow.md`…"     # survives
PREFIX -> ""                                                         # whole line gone
```

`export-engine.js:481` puts `/\{project-root\}/` in `frameworkPatterns` and **drops the entire line**,
recording a warning only for `.claude/hooks` and `bmad-speak`. The three agents export as `pipeline`
tier, so this reaches the ~40% Vortex-Standalone segment.

**This is a defect in the export, not a conflict with the fix** — and the export already contains its
own better answer twenty-four lines later. `export-engine.js:505`, Phase 3b:

> Only strip lines whose primary content is a `_bmad/` path … **Avoid stripping the line if `_bmad/`
> appears only as a parenthetical or backtick reference.**

Phase 3b is surgical about exactly this and its guard `/^\s*[`*-]?\s*_bmad\//` is why the bare line
survives. Phase 3 is blunt about the same content, and its own comment assumes that bluntness
("*those references are already gone*").

**Recommendation, and the one thing needing your ruling:** narrow Phase 3 for `{project-root}` to match
Phase 3b — strip the **token**, or strip the line only when the path is the line's primary content —
rather than deleting every line that mentions it. `{project-root}` stays in `FORBIDDEN_STRINGS`
(`test-constants.js:34`) either way, because removing the token satisfies it. **AC1 must not land
before this**, or 22 load instructions vanish from the standalone bundle.

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

**AC1 — the 22 carry `{project-root}/`, and the export change lands with them.** Falsifier: the grep in
§Root cause returns non-zero for the bare form, **or** the measurement in §The blocker still returns `""`
for a prefixed line. **Both, or the AC is unmet** — prefixing alone is a regression.

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

1. **Get the export ruling** (§The blocker). Nothing else starts: task 2 without it is a regression.
2. Narrow Phase 3 per the ruling; verify with the before/after measurement on a real line 21.
3. Prefix the 22 on the twelve line-21s (AC1).
4. New sibling test: expectation set from each `SKILL.md`, floors per AC4, non-detections stated (AC2, AC3, AC4, AC5).
5. Prove the guard by mutating a **committed** file — `sed` one prefix back to bare, run, `git checkout --`
   it — and record *edit → the named `it()` that went red*. Both halves must exist in the repo, so a
   create-then-delete probe does not qualify.
6. Gates per AC7.

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
