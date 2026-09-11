---
baseline_commit: e1510517fa5ea4928fbafc7947fd656db183748c
---

# Story 1.1: Correct the claims that make a reader act and fail

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a contributor following Convoke's documentation,
I want the commands it tells me to type and the capabilities it tells me exist to be real,
so that I do not lose an afternoon to an invocation the package never shipped.

## Acceptance Criteria

**AC1 — D1: the Team Factory invocation names a skill that exists.**

**Given** three documents instruct the reader to use `/bmad-team-factory`
**When** the invocation is re-derived from `scripts/update/lib/agent-registry.js:219` (`id: kebab-case identifier (becomes bmad-agent-bme-{id})`) and `:230` (`id: 'team-factory'`)
**Then** all three name `/bmad-agent-bme-team-factory`, matching the form already used in `README.md:100`, `INSTALLATION.md:169` and `CONTRIBUTING.md:12`
**And** `grep -rn '/bmad-team-factory' docs/ *.md` returns **zero survivors** — the line numbers below locate the defect, they do not scope the fix
**And** the derivation is cited in the Dev Agent Record by file and line, not by finding ID.

**AC2 — D2: no document advertises a capability the product refuses to run.**

**Given** three documents advertise Team Factory "Add Agent" and "Add Skill"
**When** `_bmad/bme/_team-factory/workflows/` is enumerated — it contains `add-team/` and `step-00-route.md`, nothing else
**And** `_bmad/bme/_team-factory/workflows/step-00-route.md:42-49` displays *"Add Agent and Add Skill workflows are planned for Phase 3 of the Team Factory"* and routes the user to three manual alternatives
**Then** no document claims those capabilities as available
**And** where a document mentions them at all, it states they are **not yet available** and points at the same three alternatives the router offers — the product and the documentation must not disagree about what exists
**And** `grep -rniE 'add (an )?agent|add (a )?skill' README.md INSTALLATION.md CONTRIBUTING.md docs/*.md UPDATE-GUIDE.md` returns no surviving claim of availability.

**AC3 — D3: the agent-file naming convention is stated once and is true for both teams.**

**Given** `docs/development.md:52` demonstrates `cp _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md …` while `:83` states the convention as `` `discovery-empathy-expert.md` ``, and both are true — of different teams
**When** the convention is restated once
**Then** it covers both layouts explicitly: **Vortex agents are `<agent-dir>/SKILL.md`; Gyre agents are flat `<agent-name>.md`**
**And** the recipe at `:52` agrees with the table at `:83`
**And** every agent-file path form in the file is enumerated by grep and each matches the stated convention — "no longer contradicts itself" is established by enumeration, never by reading.

**AC4 — no correction introduces a claim nothing can contradict.**

**Given** every edit made by this story
**When** the diff is reviewed
**Then** each replacement value has a named source that could have produced a different answer (FR3a, the source-of-truth rule)
**And** no count, version marker or inventory is introduced that no object in the repository owns.

## Tasks / Subtasks

- [x] **Task 1 — Close D1 across all three files (AC: 1)**
  - [x] Verify the invocation from source: `sed -n '219p;230p' scripts/update/lib/agent-registry.js`
  - [x] `docs/development.md:75` — replace `/bmad-team-factory` with `/bmad-agent-bme-team-factory`
  - [x] `docs/faq.md:200` — same replacement
  - [x] `UPDATE-GUIDE.md:83` — same replacement
  - [x] Run the zero-survivors grep; paste the empty result into the Dev Agent Record
- [x] **Task 2 — Close D2 across all three files (AC: 2)**
  - [x] Read `_bmad/bme/_team-factory/workflows/step-00-route.md:42-49` and reuse its wording so product and docs agree
  - [x] `docs/development.md:77` — the "Three capabilities" sentence claims two that do not exist
  - [x] `README.md:100` — "It can also add an agent to an existing team, or a skill to an existing agent"
  - [x] `UPDATE-GUIDE.md:73` — "Team Factory extensions — Add Agent and Add Skill workflows with appender modules"
  - [x] Run the capability grep; record every surviving hit and why it is not a claim of availability
- [x] **Task 3 — Close D3 in `docs/development.md` (AC: 3)**
  - [x] Confirm both layouts on disk: `ls _bmad/bme/_vortex/agents/contextualization-expert/` (→ `SKILL.md`, `references`) and `ls _bmad/bme/_gyre/agents/` (→ four flat `.md`)
  - [x] Rewrite the `:79-88` convention table to carry both layouts
  - [x] Make the `:47-56` recipe consistent with it
  - [x] Enumerate agent-file path forms in the file by grep; confirm each matches
- [x] **Task 4 — Update the coverage table (AC: DoD)**
  - [x] In `convoke-note-docs-accuracy-findings-4-0-2.md`, mark `docs/development.md` examined with its findings count
  - [x] **Do NOT mark `docs/faq.md`, `UPDATE-GUIDE.md` or `README.md` examined.** This story touches a defect in them; it does not perform their derivation pass. `Examined: yes` means the pass ran
  - [x] Add a note recording that D1 and D2 were closed in those files by this story, so Stories 1.4 and 1.6 do not re-report them
- [x] **Task 5 — Verify and hand off (AC: 4, DoD)**
  - [x] `npm run docs:audit` → exit 0 (non-regression only; **not** evidence of accuracy)
  - [x] `npm run lint` → exit 0, zero warnings in modified files
  - [x] Emit the commit plan with a Round 1 review record

## Dev Notes

### ⚠ Two findings are wider than the epic recorded — this story closes the class, not the instance

The epic anchored D1 and D2 to `docs/development.md`. Enumeration at story-creation time found each defect in **three** files:

| Defect | Files | Whose scope? |
|---|---|---|
| D1 wrong command | `docs/development.md:75`, `docs/faq.md:200`, `UPDATE-GUIDE.md:83` | 1.1 / 1.4 / 1.4 |
| D2 unshipped capabilities | `docs/development.md:77`, `README.md:100`, `UPDATE-GUIDE.md:73` | 1.1 / **out of epic scope** / 1.4 |

**`README.md:100` was excluded from the epic as "warm tier."** The pre-mortem tested that exclusion by resolving slash *commands* in warm-tier files and found none broken — but it never tested capability *claims*. README is the highest-traffic document in the repository and it advertises a capability `step-00-route.md:42` explicitly refuses to run. Closing D1 and D2 in `development.md` alone would leave the identical defect live in the first file any user reads.

**Touching a file is not examining it.** Tasks 1 and 2 edit `faq.md`, `UPDATE-GUIDE.md` and `README.md` for these two defects only. Their derivation passes remain owned by Stories 1.4 and 1.6. Do not set `Examined: yes` for them (Task 4).

### Files being modified — current state, change, and what must be preserved

**`docs/development.md`** — the story's primary file.

- **:73-77 "Team Factory (Recommended)"** — currently names `/bmad-team-factory`, then *"Three capabilities: Create Team, Add Agent, Add Skill."* **Preserve:** the description of what Create Team actually does (composition pattern selection, agent scope definition, contract design, artifact generation, integration wiring) and the claim that output passes the same validation as native teams — both verified true against `_bmad/bme/_team-factory/workflows/add-team/`.
- **:47-56 "Manual Agent Creation"** — a `cp` recipe using the Vortex `<dir>/SKILL.md` form. **Correct as written for Vortex.** The defect is that the table below contradicts it.
- **:79-88 "Agent File Naming Conventions"** — states `discovery-empathy-expert.md`. True for **Gyre**, false for **Vortex**. **Preserve:** the other three rows (frontmatter name, display name, user guide) — all verified: `_bmad/bme/_vortex/guides/ISLA-USER-GUIDE.md` exists, as do six siblings.

**`docs/faq.md:200`, `UPDATE-GUIDE.md:73,83`, `README.md:100`** — single-sentence edits. Change only the defective clause; leave surrounding prose alone. These files carry other stories' findings and must not be broadly rewritten here.

### Ground truth for every replacement value

| Claim | Source of truth | Verified value |
|---|---|---|
| Team Factory invocation | `scripts/update/lib/agent-registry.js:219,230` | `bmad-agent-bme-team-factory` |
| Invocation form in prose | `README.md:100`, `INSTALLATION.md:169`, `CONTRIBUTING.md:12` | leading slash, e.g. `/bmad-agent-bme-team-factory` |
| Shipped capabilities | `_bmad/bme/_team-factory/workflows/` | `add-team/` only |
| Unavailable-capability wording | `_bmad/bme/_team-factory/workflows/step-00-route.md:42-49` | "planned for Phase 3", + 3 alternatives |
| Vortex agent layout | `_bmad/bme/_vortex/agents/<name>/SKILL.md` | 7 agent dirs |
| Gyre agent layout | `_bmad/bme/_gyre/agents/<name>.md` | 4 flat files |

**`.claude/skills/` is NOT a valid source** (NFR8). It is gitignored at `.gitignore:62` and holds installed output, not shipped source — resolving a command there can report a command present that the package does not ship. Finding D1 was originally cited against it and had to be rebased.

### Testing standards

No unit tests. This is documentation; verification is **assertion-derivation**, per `project-context.md` → `documentation-claims-must-be-derived`: *"For a documentation change, verifying the assertions substitutes for reviewing the diff. It is the higher-yield pass."*

Every AC's evidence is a grep whose empty (or expected) output is pasted into the Dev Agent Record. `npm run docs:audit` is a **non-regression** check and may not be cited as evidence any document is correct — it exits 0 on all of these defects today, which is why this epic exists.

### Latest technical information

**None applicable, stated deliberately rather than omitted.** This story adds no dependency, calls no external API, and pins no version. No library research was performed because none is relevant; asserting otherwise would be the unverified-external-claim defect that `external-claims-must-be-executed-or-hedged` governs.

### Git intelligence

Recent commits (`8a8adbe1`, `e1510517`) authored this epic and its prefix; `58965967` / `80344b03` are `tf-2-12` Team Factory work by a parallel session.

**Relevant:** `tf-2-12` is actively changing `_bmad/bme/_team-factory/workflows/add-team/`. Re-verify AC2's enumeration against the tree at implementation time — if `tf-2-12` has shipped an Add Agent workflow since 2026-09-10, D2's premise has changed and the story must be re-scoped rather than implemented as written.

**Also note:** commit `e1510517` carries a malformed message — `Summary: docs(docs-accuracy): …`, with the GitHub Desktop field label included. Cosmetic, not this story's work, but do not copy the pattern.

### Project Structure Notes

Documentation only. No source, no tests, no `_bmad/` content. Paths touched: `docs/development.md`, `docs/faq.md`, `UPDATE-GUIDE.md`, `README.md`, and the findings note under `_bmad-output/planning-artifacts/`.

**Namespace decision:** not applicable — this story authors no skill, workflow or agent. The `namespace-decision-for-new-skills` rule does not bind documentation corrections.

**Concurrent-session hazard.** A parallel session has been committing `tf-2-12` work. Before emitting the commit plan run `git diff --name-only` and stage **whole files** — never line-level on a modified line. Line-level staging on a modified row has destroyed backlog records in this repository twice (`c841fcd2`, `3a3de195`).

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-docs-accuracy-4-0-2.md#Story-1.1] — acceptance criteria, epic-wide DoD
- [Source: _bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md#Findings-docs-development-md] — D1, D2, D3 with reproduction commands
- [Source: _bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md#Coverage-denominator] — the table Task 4 updates
- [Source: scripts/update/lib/agent-registry.js:219-230] — invocation derivation
- [Source: _bmad/bme/_team-factory/workflows/step-00-route.md:42-49] — the product's own wording for unavailable capabilities
- [Source: project-context.md#Rule-documentation-claims-must-be-derived] — verification method
- [Source: project-context.md#Rule-commit-preparation] — commit plan, whole-file staging
- [Source: project-context.md#Rule-code-review-convergence] — Round 1 fires at the commit plan

## Definition of Done

- [x] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and this story may not cite it as proof any document is correct. *(NFR3, verbatim)*
- [x] Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- [x] Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- [x] The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined*.
- [x] `npm run lint` exits 0 with zero warnings in any file this story modifies (`lint-passes-before-review`).
- [x] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5). "Verified by execution" without a named failing case does not satisfy this.
- [x] Commit plan emitted with a Round 1 review record (NFR4, `commit-preparation`), and the reviewed file set equals the staged file set.

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m]

### Debug Log References

**AC1 — D1, red then green.**
```
# RED (before)
$ grep -rn "/bmad-team-factory" docs/ *.md
docs/faq.md:200 · docs/development.md:75 · UPDATE-GUIDE.md:83        → 3 survivors
# GREEN (after)
$ grep -rn "/bmad-team-factory" docs/ *.md
<no output>                                                          → 0 survivors
```
Derivation, per AC1: `scripts/update/lib/agent-registry.js:219` → `id: kebab-case identifier (becomes bmad-agent-bme-{id})`; `:230` → `id: 'team-factory'`. Therefore `bmad-agent-bme-team-factory`. Slash-prefixed form matched to `README.md:100`, `INSTALLATION.md:169`, `CONTRIBUTING.md:12`.

**AC2 — D2.** Precondition re-verified before editing, as the story required: `_bmad/bme/_team-factory/workflows/` still contains `add-team/` and `step-00-route.md` only, so D2's premise held despite `tf-2-12` activity. Wording taken from `step-00-route.md:42-49` so the docs and the router agree.

Surviving mentions after the fix, each disclaiming availability:
- `docs/development.md:79` — "planned for Phase 3 and do not ship yet"
- `UPDATE-GUIDE.md:73` — "planned for Phase 3 and did not ship in this release"
- `README.md:100` — "planned for Phase 3 and not yet available"
- `docs/codebase-audit-2026-06-27.md:229` — **not a capability claim**: a verifier note about test brittleness ("adding an agent to any registry array would fail these"). Out-of-scope dated snapshot; no action.

**AC2 — the grep went blind, and was fixed.** Rewording `README.md:100` to "Adding an agent…" made it stop matching the AC's `add (an )?agent` pattern — the line was *evading* the check, not satisfying it. Pattern broadened to `add(s|ing)? (an?n? )?(agent|skill)`, which sees all four hits. Falsified against a planted `"The factory can also add an agent to an existing team."` — fires. (NFR5)

**AC3 — D3.** Both layouts confirmed on disk: `_bmad/bme/_vortex/agents/contextualization-expert/` → `SKILL.md`, `references`; `_bmad/bme/_gyre/agents/` → four flat `.md`. After the fix, every agent-file path form in `docs/development.md` (lines 52, 53, 88, 89) matches the stated convention, and all three real paths resolve on disk.

**Gates.** `npm run docs:audit` exit 0 — **non-regression only, not evidence of accuracy**; it exited 0 on every one of these defects before the fix, which is why this epic exists. `npm run lint` exit 0.

### Completion Notes List

✅ **AC1 satisfied** — D1 closed in 3 files, zero survivors.
✅ **AC2 satisfied** — D2 closed in 3 files; 4 surviving mentions all disclaim or are non-claims.
✅ **AC3 satisfied** — naming table now carries both team layouts; path forms enumerated, not read.
✅ **AC4 satisfied** — see below; it caught two false claims I was about to preserve.

**Scope breach, deliberate and disclosed: `README.md` was edited.** The epic scoped it out as warm tier. It advertised a capability `step-00-route.md:42` explicitly refuses to run, in the repository's highest-traffic document. The pre-mortem's warm-tier test resolved slash *commands* and never tested capability *claims* — a gap in the test, not bad luck. Fixing `development.md` alone would have left an identical ACT-FAIL defect in the first file any user reads.

**Two new findings, filed not fixed: D8 and D9.** AC4 required verifying the rows I intended to *preserve*, and two were false:
- **D8** — "Frontmatter name: spaces, lowercase" is true for **Gyre only**. Vortex is three-way: `bmad-bme-agent-emma` (converted), `discovery-empathy-expert` (unconverted), `"stack detective"` (Gyre).
- **D9** — "Display name: `name="Isla"`" holds only for **unconverted** agents; converted ones carry it as an `# Emma` heading and contain zero `name="` attributes.

Both routed to **Story 1.3**, which already owns the conversion-state claim (D4). Their correct form depends on a disposition 1.3 has yet to make; stating one here would be inventing policy. `development.md` findings count updated 7 → 9.

**Three files were edited without being examined.** `docs/faq.md`, `UPDATE-GUIDE.md` and `README.md` keep `Examined: no`. Stories 1.4 and 1.6 still own their derivation passes and should not re-report D1 or D2 there — recorded in the findings note.

**A stale anchor was introduced and caught.** D8/D9 were first filed against `development.md:86-87`; the table edit had shifted them to `:90-91`. Corrected and re-verified against the live file. Noted because it is the exact defect class this epic exists to close, produced inside the artifact that records it.

**`UPDATE-GUIDE.md:73` was narrowed, not deleted.** The v3.0.0 entry was half true: the appender modules genuinely shipped (`registry-appender.js`, `config-appender.js`, `csv-appender.js` all exist under `_bmad/bme/_team-factory/lib/writers/`); the workflows they were built for did not.

### File List

- `docs/development.md` — modified (D1, D2, D3)
- `docs/faq.md` — modified (D1)
- `UPDATE-GUIDE.md` — modified (D1, D2)
- `README.md` — modified (D2; out of epic scope, disclosed above)
- `_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md` — modified (D8, D9, cross-file closures, count 7→9)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — modified (status transitions)
- `_bmad-output/implementation-artifacts/docs-1-1-correct-the-claims-that-make-a-reader-act-and-fail.md` — new (this story)

**Not mine, do not stage:** `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` and `_bmad-output/party-mode/memories/installed/.memlog.md`.

## Change Log

| Date | Change |
|------|--------|
| 2026-09-11 | Story implemented. D1 closed in 3 files, D2 in 3 files, D3 in 1. D8 and D9 discovered by AC4 and filed to Story 1.3. `README.md` edited outside epic scope, disclosed. |
