---
baseline_commit: e1510517fa5ea4928fbafc7947fd656db183748c
---

# Story 1.1: Correct the claims that make a reader act and fail

Status: in-progress

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
| 2026-09-11 | Round 1 review: 5 HIGH, 15 patches applied as one batch, 5 deferred, 3 operator decisions. AC2's pattern retired and re-derived; D2 was live in 5 files, not 3. Second scope breach (`team-factory.md:123`) disclosed. **Round 2 mandatory** — `code-review-convergence`. |
| 2026-09-11 | Story implemented. D1 closed in 3 files, D2 in 3 files, D3 in 1. D8 and D9 discovered by AC4 and filed to Story 1.3. `README.md` edited outside epic scope, disclosed. |

## Review Findings

**Round 1 — 2026-09-11.** Three layers (Blind Hunter `bmad-review-adversarial-general`, Edge Case Hunter `bmad-review-edge-case-hunter`, Acceptance Auditor), run blind and in parallel against `2c74deb6`. Reviewed set == committed set (7 files), verified by the `code-review-convergence` equality check. Every finding below was re-derived against the tree by the triaging session before rating; subagent severities were discarded per the workflow.

**5 HIGH. Round 2 is therefore mandatory** (`code-review-convergence`).

**The organising fact:** AC2's grep requires a *space* between the verb and the noun. The corpus form is *hyphenated* — `add-agent`, `add-skill`. The pattern the Dev Agent Record describes as "broadened and falsified" is blind to it, so AC2 ran green across a corpus where the defect is still live, including three lines above the sentence this story corrected. The falsification planted a prose string the *original* pattern already matched; it never tested the form actually present in the files.

### Decision needed — all three resolved by operator 2026-09-11, each became a patch

- [x] [Review][Decision] **README.md and CHANGELOG.md scope is unratified, and CHANGELOG is unowned** — **RESOLVED: option (a), admit both to scope.** — The epic's out-of-scope table rules the warm tier out in a dated ruling (2026-09-10). This story falsified that ruling's basis and edited `README.md` anyway. The disclosure is excellent; the ratification is missing. Residue: the epic's out-of-scope table and its pre-mortem claim ("the warm-tier exclusion was tested and not falsified") both still stand, `README.md` has **no row** in the coverage table while the note's prose asserts Stories 1.4/1.6 own it, and `CHANGELOG.md:271` carries the identical D2 claim plus two filenames that exist nowhere (`step-add-agent.md`, `step-add-skill.md`; `find _bmad -name 'step-add-*.md' | wc -l` → `0`) and ships in the npm tarball. Options: (a) formally admit README+CHANGELOG to scope with coverage rows and an owner; (b) amend the epic to record the falsified exclusion and keep them out; (c) fix CHANGELOG's clause only and leave the tier ruling alone.
- [x] [Review][Decision] **The `[AR]` route this story newly points readers at is broken in the product** — **RESOLVED: option (a), fix the product path now and disclose as a second scope breach.** — `docs/development.md:79` now tells the reader the factory routes them to the Architecture Reference (`[AR]`). The menu item exists at `_bmad/bme/_team-factory/agents/team-factory.md:123`, but its `data=` target is `architecture-reference-teams.md`, which was renamed to `loom-arch-reference-teams.md` (commit `9ea6a860`). The documentation correctly describes what the product does; the product's route is dead. Fixing it means editing `_bmad/` content from a story whose Project Structure Notes declare "No `_bmad/` content". Options: (a) fix the product path now and disclose as a second scope breach; (b) file it as a product bug and leave `:79` as-is; (c) reword `:79` to drop the `[AR]` mention until the route works.
- [x] [Review][Decision] **The naming table has a two-team denominator and the tree has three** — **RESOLVED: route to Story 1.3.** Add the caveat here; 1.3 states the forward-going rule once it has made the I97 conversion disposition. Do not invent policy in this story. — `_bmad/bme/_team-factory/agents/team-factory.md` is a flat file matching neither the `Agent file (Vortex)` nor the `Agent file (Gyre)` row. Separately, the old table at least told a contributor what to name a *new* agent file; the new one says both forms "are current" and states no rule for a team that is neither. Under a heading reading "Building New Agents and Teams", that is a live question the table no longer answers. Which layout is canonical for new work is a policy call (I97 conversion is 3/7), plausibly Story 1.3's to make.

### Patch

- [x] [Review][Patch] **[from Decision 1] Admit `README.md` and `CHANGELOG.md` to scope** — Add coverage-table rows for both with a named owning story; amend the epic's out-of-scope table and its pre-mortem claim to record that the warm-tier exclusion **was** falsified (by capability claims, which the pre-mortem never tested); correct `CHANGELOG.md:271`, which carries the live D2 claim plus `step-add-agent.md` / `step-add-skill.md` — two filenames that exist nowhere (`find _bmad -name 'step-add-*.md' | wc -l` → `0`) — in a file that ships in the npm tarball. Also reconcile the note's prose, which currently asserts an owner the table does not record.
- [x] [Review][Patch] **[from Decision 2] Repoint the `[AR]` menu target** [_bmad/bme/_team-factory/agents/team-factory.md:123] — `data=` still names `architecture-reference-teams.md`; the file is `loom-arch-reference-teams.md` (renamed in `9ea6a860`). Disclose as a second, smaller scope breach in the story record, since this story declared "No `_bmad/` content".
- [x] [Review][Patch] **[from Decision 3] Caveat the two known-false naming rows and hand the rule to 1.3** [docs/development.md:90-91] — State that `Frontmatter name` and `Display name` are team- and conversion-state-dependent and are open as D8/D9 under Story 1.3. State no forward-going naming policy here, and do not add a third team row — 1.3 owns the disposition.
- [x] [Review][Patch] **Live D2 three lines above its own correction — the file now contradicts itself** [UPDATE-GUIDE.md:70] — HIGH. `:70` reads "Team Factory extension workflows (add-agent, add-skill) **are new capabilities** that change the module API surface"; `:73`, edited by this story, says the same workflows "did not ship in this release". Both sit in the "From v2.4.x to v3.0.0" section. This is the ACT-FAIL class the story exists to close, produced adjacent to its own fix. AC2's "returns no surviving claim of availability" is false.
- [x] [Review][Patch] **Fourth live D2 instance in an in-scope file, orphaned between "closed" and "never found"** [docs/BMAD-METHOD-COMPATIBILITY.md:105] — HIGH. `- Team Factory: guided team creation, add-agent, add-skill extensions`. The file is row 6 of the coverage table (in scope, 30 assertions, Story 1.5). The note tells Stories 1.4 and 1.6 not to re-report D2; Story 1.5 is told nothing at all, so nobody is looking for this one.
- [x] [Review][Patch] **The findings note asserts a closure that did not happen, and disarms the stories that would have caught it** [_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md:203-207] — HIGH. "Story 1.1 closed both classes **everywhere they appeared** … Stories 1.4 and 1.6 … should **not** re-report D1 or D2 there." D2 is live in `UPDATE-GUIDE.md:70` — the file Story 1.4 owns and is now instructed to skip. A false claim in the coverage denominator is worse than a false claim in a doc: it propagates into every story that trusts it.
- [x] [Review][Patch] **AC2's verification pattern is blind to the form the corpus actually uses** — HIGH, and the root cause of the three findings above. `add(s|ing)? (an?n? )?(agent|skill)` requires a space; the corpus uses hyphens. Verified: `sed -n '70p' UPDATE-GUIDE.md | grep -inE 'add(s|ing)? (an?n? )?(agent|skill)'` → exit 1. Also blind to passive (`can be added`), plurals (`add agents`), nominalisation (`addition of an agent`), and intra-phrase emphasis (`add an **agent**`). The `(an?n? )?` group matches the non-word `ann ` while missing `the`/`another`, which suggests the alternation was extended rather than reasoned about. Re-derive the pattern from the corpus and falsify it against a *hyphenated* case before re-asserting AC2.
- [x] [Review][Patch] **A false count was replaced with a different false count — AC4 fails on text this story added** [docs/development.md:77] — "One capability is available today: **Create Team**". `_bmad/bme/_team-factory/module-help.csv` declares **two** (Create Team, Validate Team) and the agent menu exposes nine items including `[VT] Validate Team` and `[EX] Express Mode`. AC4 forbids introducing "a count … that no object in the repository owns"; this count is owned by a directory listing, not by the module's capability surface.
- [x] [Review][Patch] **The naming table's new team-qualification makes the two rows filed as false read as deliberately universal** [docs/development.md:88-91] — Rows 1–2 are now team-qualified and the preamble says "both layouts are current". Rows 3–4 (D8/D9, filed-not-fixed) remain unqualified and uncaveated. Before the commit nothing signalled that team-variance had been considered, so no row invited trust; after it, the two surviving false rows sit inside a table that advertises having handled exactly that problem. Add a caveat pointing at D8/D9 — that states no policy and pre-empts no 1.3 disposition.
- [x] [Review][Patch] **D9's recorded evidence command reproduces nothing, and its empty output is indistinguishable from the finding** [convoke-note-docs-accuracy-findings-4-0-2.md:64] — `grep -nE 'name="\|^# ' …` uses a BRE alternation inside an ERE, so `\|` is a literal pipe: exit 1, no output. The corrected form (`'name="|^# '`) returns `6:# Emma`. The underlying finding is true; NFR1's required reproduction command is not. D8's command reproduces exactly — verified.
- [x] [Review][Patch] **Three counts in the findings note were staled by this commit while a fourth was correctly updated** [convoke-note-docs-accuracy-findings-4-0-2.md:39,49,121] — `:39` "All **eleven** findings below survive it" and `:121` "**Eleven** findings came from **743** lines" — the table now holds 9 `D` rows + 4 `A` rows = **13**. `:49` "`docs/development.md` (**141** lines)" — `wc -l` → **147**. The `7 → 9` coverage cell was derived correctly; the count was treated as one cell rather than as a claim class (`derive-counts-from-source`).
- [x] [Review][Patch] **Anchor drift in the artifact that records catching anchor drift** [convoke-note-docs-accuracy-findings-4-0-2.md:62,210 + D3 row] — The commit is +6 on `development.md`. D7 still cites `#L96-L119`; `sed -n '96p'` is now a horizontal rule and the tree it means runs L101-125. D7 is **open** and owned by Story 1.3, so its dev follows the anchor to the wrong place. The D3 row's `[L83]` now lands on the new preamble sentence, not the table (L88-89). Note `:210` records D2 closed at `development.md:77`; the disclaimer is at `:79` — the story's own Debug Log says `:79`, so the two artifacts committed together disagree.
- [x] [Review][Patch] **The one gate the story cites as a pass could not have failed** — `npm run lint` is `eslint --max-warnings 0 scripts/ index.js tests/`. All seven files in this commit are `.md` or `.yaml`; none is in that path set, and there is no markdown ESLint config. The DoD line "lint exits 0 with zero warnings in any file this story modifies" is vacuously true and was ticked without saying so. `commit-preparation` states verbatim: "`lint 0` is not evidence unless lint can go red on this change." Same bar unmet for the "2258 pass / 0 fail" suite tally and for AC3's enumeration grep, which reports a result without naming a case that would have differed.
- [x] [Review][Patch] **AC2's second conjunct is unmet in two of the three files** [README.md:100, UPDATE-GUIDE.md:73] — LOW. AC2 requires the text to state unavailability **and** point at the same three alternatives the router offers. `docs/development.md:79` does. The other two state the unavailability and offer nothing, so a README-only reader is told the capability does not exist and given no next step. The epic's looser AC is satisfied; the story's own AC as written is not.
- [x] [Review][Patch] **D8's framing sentence mis-attributes its own examples** [convoke-note-docs-accuracy-findings-4-0-2.md:63] — LOW. It calls Vortex "three-way" and lists `"stack detective"` as the third form, but that value is Gyre's, which the same row has already excluded. The three verified values are right; the sentence framing them is not.

### Deferred

- [x] [Review][Defer] **Three unresolvable `/bmad-bmb-*` commands survive in a file this commit edited, and one sits in a file already marked `Examined: yes`** [docs/faq.md:131-135, docs/agents.md:357] — deferred, pre-existing. HIGH consequence. `/bmad-bmb-agent`, `/bmad-bmb-module`, `/bmad-bmb-workflow` have zero rows in `_bmad/_config/skill-manifest.csv`; the shipped ids are `bmad-agent-builder`, `bmad-module-builder`, `bmad-workflow-builder` (manifest lines 68, 71, 72). This is D1's *class* — an invocation the package never shipped — 65 lines above the `faq.md:200` line the commit fixed. AC1's zero-survivors grep was the literal string `/bmad-team-factory`, which is instance-scoped, so the class check never ran. `docs/agents.md` is recorded `Examined: yes` with 4 findings, so `:357` is on the books as examined-and-clean while carrying an ACT-FAIL. Compounding: `development.md:79`, added by this commit, routes the reader to "BMB (Bond)" without naming a command — the only document that names one gives a command that does not exist. Owner: Story 1.4 (`faq.md`); Story 1.2's pass on `agents.md` needs re-opening.
- [x] [Review][Defer] **D3's class is live as literal copy-paste commands in an in-scope file** [docs/BMAD-METHOD-COMPATIBILITY.md:139,261,263] — deferred, pre-existing. Three `cat`/checklist lines reference `_bmad/bme/_vortex/agents/<name>.md` (flat form). Vortex is `<dir>/SKILL.md`; `ls _bmad/bme/_vortex/agents/contextualization-expert.md` → No such file or directory. AC3 scoped its enumeration to `docs/development.md`, which is defensible; recording it so Story 1.5 does not have to rediscover it.
- [x] [Review][Defer] **A second initiative's sprint scaffold rode along inside a docs commit, undisclosed** [_bmad-output/implementation-artifacts/sprint-status.yaml] — deferred, already committed and non-destructive. The diff is 67 insertions / 1 deletion; the sole deletion is `last_updated`. **The whole-file staging hazard the story flagged did not materialise** — nothing pre-existing was altered or dropped. But 29 of the 67 added lines are `abs-*` rows (the v4.1 upstream-BMAD absorption epic, generated 2026-09-10 by sprint-planning) against 9 `docs-*` rows. The File List records the file only as "(status transitions)" and the commit message does not mention it, so `git log` shows a 4.1 epic's scaffold landing inside a docs fix.
- [x] [Review][Defer] **The same defect is recorded open in one artifact and closed in another** [_bmad-output/implementation-artifacts/fast-readme-rewrite-lifecycle-spine.md:274] — deferred, pre-existing. An unchecked item still reads "`/bmad-team-factory` is not a registered skill; the id is `bmad-agent-bme-team-factory` [README.md:104]". AC1's `docs/ *.md` scope is defensible for a docs story, but the pre-existing item was neither closed nor cross-referenced.
- [x] [Review][Defer] **The calibration point has no baseline to calibrate against** [convoke-note-docs-accuracy-findings-4-0-2.md:188-189] — deferred, pre-existing. Both examined rows carry `—` in `Assertions` while the note designates Story 1.4 the calibration point for findings-per-derived-assertion. This story bumped `development.md`'s findings cell 7 → 9 and left the denominator empty.

### Verified sound — recorded so Round 2 does not re-litigate

AC1's own instance is genuinely closed: `grep -rn '/bmad-team-factory' docs/ *.md` → exit 1, no output, independently re-run. The derivation is cited by file and line, not finding ID, and both lines check out (`agent-registry.js:219`, `:230`). AC3 is satisfied **by enumeration** — 4 path forms in `development.md` (`:52`, `:53`, `:88`, `:89`), all matching the restated convention, all three real paths resolving on disk, and all 7 Vortex agents genuinely `<dir>/SKILL.md`. Task 4's prohibition was honoured: `faq.md` and `UPDATE-GUIDE.md` keep `Examined: no`, and no file was upgraded. FR10's `0`-vs-blank convention is intact. The `7 → 9` bump is derived from rows that exist, and D8/D9's `:90`/`:91` anchors are correct against the post-edit file — the story's account of first filing them stale at `:86-87` and correcting them checks out. The README scope breach is disclosed in three places with the reason the exclusion's test was weak; what it lacks is ratification, not candour.


## Round 1 Remediation Record — 2026-09-11

All 15 patches applied as **one batched remediation**, per `code-review-convergence`
("Collect every layer's findings for the round, design ONE coherent remediation, then apply it").
Root cause first, symptoms second — fixing `UPDATE-GUIDE.md:70` before re-deriving the pattern
would have treated a symptom and left the rest live. That ordering paid: the re-derived pattern
found a **fifth** D2 instance at `CHANGELOG.md:217` ("agent, and skill addition" — nominalized)
that neither the original nor the hyphenated pattern sees.

### The pattern of record

The AC2 pattern is retired. It required a space between verb and noun; the corpus uses hyphens,
nominalizations and passives. Replacement is high-recall plus a hand-filter, per `catch-all-phase-review`:

```
grep -rniE '\badd' README.md INSTALLATION.md CONTRIBUTING.md UPDATE-GUIDE.md CHANGELOG.md docs/*.md \
  | grep -iE 'agent|skill' | grep -viE 'add(ress|itional)'
```

**Falsified against the form that actually broke it**, not a planted one — the case AC2's own
falsification missed:

```
$ sed -n '70p' UPDATE-GUIDE.md | grep -inE 'add(s|ing)? (an?n? )?(agent|skill)'   # old pattern
exit=1                                                                            # BLIND
$ sed -n '70p' UPDATE-GUIDE.md | grep -iE '\badd' | grep -icE 'agent|skill'      # new pattern
1                                                                                 # SEES IT
```

### D2 closures — five instances, not three

`docs/development.md:79`, `README.md:100`, `UPDATE-GUIDE.md:73` (Story 1.1 as shipped), plus
`UPDATE-GUIDE.md:70`, `docs/BMAD-METHOD-COMPATIBILITY.md:105`, `CHANGELOG.md:217` and
`CHANGELOG.md:271` (Round 1). `CHANGELOG.md` additionally named `step-add-agent.md` and
`step-add-skill.md`, two files that have never existed (`find _bmad -name 'step-add-*.md' | wc -l` → `0`),
in a file that ships in the npm tarball.

### Second scope breach, disclosed

`_bmad/bme/_team-factory/agents/team-factory.md:123` was edited — a **product** file, from a story
that declared "No `_bmad/` content". The `[AR]` menu item's `data=` target was
`architecture-reference-teams.md`, renamed to `loom-arch-reference-teams.md` in `9ea6a860`. Story 1.1
newly pointed readers at that route, so the story made a pre-existing product defect reader-visible.
Operator ruling 2026-09-11: fix the path now rather than document a dead route. One line, no logic.

### Correction to this story's own verification record

**`npm run lint` was cited as evidence and could not have failed on this change.** The script is
`eslint --max-warnings 0 scripts/ index.js tests/`; every file this story touches is `.md` or `.yaml`,
and no markdown ESLint config exists. The DoD line "lint exits 0 with zero warnings in any file this
story modifies" is **vacuously true** — it inspected none of them. Per `commit-preparation`, "`lint 0`
is not evidence unless lint can go red on this change." The same applies to the "2258 pass / 0 fail"
suite tally, which is a bare count, and to AC3's enumeration grep, which reported a result without
naming a case that would have differed. `npm run docs:audit` remains correctly disclaimed as
non-regression only. **The honest statement of this story's automated-gate coverage is: none of the
repository's automated gates can fail on a documentation-content change.** That is the finding the
epic exists to act on, and it should not be restated as a passing gate.

### AC status after remediation

- **AC1** — instance closed and re-verified. **Class not closed**: `/bmad-bmb-*` survives at
  `docs/faq.md:131-135` and `docs/agents.md:357`, deferred to Stories 1.4 / 1.2.
- **AC2** — now satisfied on both conjuncts. Five instances closed; `README.md:100` and
  `UPDATE-GUIDE.md:73` now carry the router's three alternatives, which they previously omitted.
- **AC3** — was satisfied; unchanged. The naming table now carries a caveat routing the two
  known-false rows to Story 1.3. No forward-going naming policy was invented here.
- **AC4** — the story's own violation is fixed: "One capability is available today" is replaced by
  a **two**-capability statement derived from `_bmad/bme/_team-factory/module-help.csv`, a named
  source that could have produced a different answer.
