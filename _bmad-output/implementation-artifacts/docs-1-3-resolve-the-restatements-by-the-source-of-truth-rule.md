---
baseline_commit: 7f40ff28
---

# Story 1.3: Resolve the restatements by the source-of-truth rule

Status: review

## Story

As a maintainer,
I want claims that nothing in the repository can contradict removed rather than refreshed,
so that the same findings do not return by 4.0.3.

## Acceptance Criteria

> ## ⚠ This story deliberately does not pre-compute. Read why before you read the ACs.
>
> Two earlier drafts of this file **both failed independent validation**, and the second introduced twelve new defects while fixing seven. Every single failure had the same shape: **a command or derived value transcribed into the story was wrong.** Three separate escaping bugs (`\|` inside `grep -E`, then an unescaped `|` in plain `grep`), an enumeration command that returned 24 files instead of 12, two incomplete "here are all the instances" lists, and a table of counts that contradicted the story's own stop-rule.
>
> The *dispositions* survived every round. The *arithmetic* never did.
>
> **Operator ruling, 2026-09-12: stop pre-computing.** This story states **what to derive and what disposition follows from each answer**. It does not publish the answers, the counts, or the commands. Where a canonical command already exists somewhere, the story **cites its location** — copy it from there, do not retype it. A figure that is not in this story cannot go stale in this story, and Task 1 re-derives everything anyway.
>
> **If you want a number, run the derivation. If this story contains a number you did not derive, distrust it.**

**AC1 — D4: the XML claim is qualified to the real conversion state.**

**Given** `docs/development.md:13` states **"XML-based agent structure"** as a property of agents generally
**When** every agent file under `_bmad/bme/` is measured — *enumerate them yourself, and exclude the `references/` sub-files that live beside agent definitions; the count is whatever your enumeration returns* — using **D4's published unit, copied verbatim from `convoke-note-docs-accuracy-findings-4-0-2.md` row D4** rather than retyped — **it is a BRE; do not add `-E`**, which silently matches nothing and is the bug that killed both earlier drafts
**Then** the claim is **qualified**, not deleted: a reader depends on it and the agent files can contradict it
**And** the qualification distinguishes whatever groups the measurement actually shows — do not assume the grouping matches team boundaries; two teams' files may be structurally identical
**And** it covers **every** team with an agent file, not only Vortex.

**AC2 — D5: each version marker is disposed of on its own evidence.**

**Given** `docs/development.md:9` `(v1.1.0)` and `:21` `(v1.4.0+)`, which version **concepts**
**When** an owner is sought for each — and the search **starts with the document the target section itself links to** where one exists — one of the two sections links out and the other names only module source, so begin there instead — before widening to `CHANGELOG.md` and git tags
**Then** each marker is **kept-and-checked if an owner exists** and **deleted if none does**, decided separately; they may not share a disposition
**And** the Dev Agent Record names every candidate owner found, not the first one — if two documents carry the same version for the same concept, ownership is **ambiguous** and the disposition is routed to the backlog rather than guessed
**And** any claim that a document is a live authority is **derived, not asserted** — check whether what it points at still exists.

> **The contrast case:** `UPDATE-GUIDE.md:97`'s `(v2.2.0)` versions a **release**, and `CHANGELOG.md` owns it. Do not touch it. The rule is *what owns this value*, not *does it look like a version*.

**AC3 — D6: the scenario arithmetic.**

**Given** the two figures at `docs/development.md:69-70`
**When** a **content** search is run for them across the repository — not a filename glob; the earlier draft's glob missed the real source because it is named for *design*, not *plan*
**Then** **every** document carrying those figures is enumerated and classified under AC8's ruling
**And** the disposition follows from that classification: deleted if no owner qualifies, kept-and-checked if one does
**And** if deleted, the instruction the numbers decorated is **retained**, pointing at the P0 gate as the authority, and no replacement figure is introduced.

**AC4 — D7: every enumeration in the tree fence presents shape, not inventory.**

**Given** the Project Structure fence in `docs/development.md` contains **several** incomplete enumerations, not one — the epic's D7 names only `_bmad/bme/`
**When** each directory node in the fence is diffed against the filesystem
**Then** **every** node that enumerates children is revised to present shape rather than inventory — fixing one and leaving its siblings is the instance-vs-class defect this epic exists to end
**And** the pass condition is a **textual property**: each such node either **stops enumerating** or **carries an explicit non-exhaustive marker**. Diffing against `ls` finds incompleteness; it cannot confirm either outcome, so the text is what is checked
**And** the revision holds under **rename and removal**, not only addition
**And** it is neither deleted (a reader needs orientation) nor generated (FR3's tooling inventory cancelled the generator)
**And** any annotation in the fence that `docs-audit.js` currently validates against the registry is **preserved or relocated, never dropped** — identify these **by mutation**: change an annotation, show the audit reports it, revert. A clean audit run names nothing, so running it proves only that nothing is broken. This is the same instrument AC6 uses, and for the same reason.

**AC5 — D8/D9: the naming rows are resolved across every agent.**

**Given** `docs/development.md:90-91`, both stated as universal, and the caveat at `:94` that `docs-1-1` left pointing here
**When** each is checked against AC1's measurement
**Then** both rows are resolved to the forms that actually occur — **including the value column, not only where the attribute exists.** At least one agent's display name is not a first name, which is what the `Display name` row claims
**And** the `:94` caveat is removed or rewritten — a caveat deferring to a resolved finding is itself a stale claim
**And** the **canonical-layout question `docs-1-1` routed here** (which layout is canonical for a team that is neither Vortex nor Gyre) is **answered or explicitly deferred with a backlog ID**. Silence is not a disposition.

**AC6 — the "all seven" claims, handed to the checker that already exists.**

**Given** the two claims `docs-1-2` routed here, in `docs/agents.md`
**When** the source-of-truth rule is applied — the agent registry can contradict them, so this is **keep-and-check**
**Then** the retained wording takes a form `scripts/docs-audit.js` **already matches**, so the claim is checked by machine rather than by a note in a record. This is FR3a's own instruction — *extend the checker that already exists* — and it costs about one word
**And** coverage is **demonstrated by mutation** (change the number, show the audit reports it, revert). Both the current and corrected wording produce no output while the value is right; only a mutation shows the line is covered (NFR5)
**And** the sibling instances elsewhere are found **by sweeping**, in both word and digit forms, and each is routed to its owning story. Do not trust a list — `docs-1-2` lost a review round for an incomplete one, and so did this story's second draft.

**AC7 — no correction introduces a claim nothing can contradict.**

**Given** every disposition applied
**When** the diff is reviewed
**Then** no new count, version marker or inventory is introduced that no object owns
**And** each **retained** claim names the object that could contradict it
**And** no **owned** claim is deleted while removing unowned ones.

**AC8 — the archive ruling, and the discriminator it turns on.**

**Given** that several of the above dispositions depend on whether a document in `_bmad-output/_archive/` can be a source of truth
**When** a candidate owner is classified
**Then** the operator's ruling applies: **a versioned specification is an owner wherever it is filed; a dated point-in-time record is not** — following the precedent this epic set for `codebase-audit-2026-06-27.md`, whose exemption reasoning is quoted in the findings note's tier table
**And** the discriminator is the document's **`status:` frontmatter field**, not the presence of a `version:` field — a `version:` field alone decides nothing, and the previous draft's omission of this would have led a dev to reverse AC3.

**And** because `status:` is uncontrolled free text and most archived documents have no frontmatter at all, the ruling is stated for the two cases that actually occur:

> **(a) No `status:` field ⇒ not an owner.** A document that does not declare itself a specification is not one. Most archived files are in this class.
>
> **(b) A `status:` describing a *run* rather than a *standing rule* ⇒ not an owner** — `READY FOR EXECUTION`, `COMPLETE`, `ANALYSIS`, `DECISION EXECUTED` and the like. These record that something was about to happen or did happen. A versioned *test design* for one agent's verification on a fixed date is the paradigm case: `version:` makes it look owned, and it is still a dated record.
>
> Only a status asserting a standing specification (`FRAMEWORK SPECIFICATION` and its kin) qualifies. **If a candidate fits neither case cleanly, it is ambiguous — route it to the backlog rather than deciding it here.**

## Tasks / Subtasks

> **Task 1 runs before any edit** — every later task touches lines whose numbers move. `docs-1-2` lost a round to exactly this.
>
> **This story contains no derived figures on purpose.** If you find one, it is a leftover — distrust it and derive instead. Where a command's canonical form lives elsewhere, **copy it from there**; three transcription bugs across two drafts are why this rule exists.

- [x] **Task 1 — Derive everything, before editing (AC: all)**
  - [x] Enumerate agent files under `_bmad/bme/`, excluding `references/` sub-files. Measure each with D4's unit **copied from the findings note's D4 row**, plus its frontmatter `name:` and any `name="` value
  - [x] **Prove every search you rely on can fire** before citing it — plant a matching string, show the hit, remove it. Three greps across two drafts silently matched nothing (NFR5)
  - [x] For each version marker: open what the section links to first, then widen. Record **all** candidates
  - [x] Content-search the scenario figures; classify every document that carries them under AC8
  - [x] Diff each enumerating node in the tree fence against the filesystem; run `npm run docs:audit` to identify which annotations it validates
  - [x] Record the current line numbers of every claim to be edited
- [x] **Task 2 — D4: qualify the XML claim (AC: 1)**
  - [x] Sweep for the same claim class across **all** of `_bmad/bme/`, not one team. **The class is any statement that an agent's structure is XML, in any spelling** — a plain `xml-based` search misses live instances that say it differently, and at least one exists outside Vortex
  - [x] Instances outside this story's file set are **recorded and routed to an owner, not edited here**
- [x] **Task 3 — D5: dispose of each marker separately (AC: 2)**
  - [x] File a backlog row for any ambiguous ownership, and for the filing question a load-bearing spec in `_archive/` raises. **Do not resolve those here**
  - [x] **Do not touch `UPDATE-GUIDE.md`**
- [x] **Task 4 — D6: dispose of the arithmetic; record every document found (AC: 3, 8)**
- [x] **Task 5 — D7: revise every enumerating node (AC: 4)**
  - [x] Preserve the registry-validated annotations; confirm `docs:audit` still exercises them afterwards
- [x] **Task 6 — D8/D9: resolve both rows including their values; clear the spent caveat; answer or defer the canonical-layout question (AC: 5)**
- [x] **Task 7 — AC6: reword for the existing checker, and prove coverage by mutation (AC: 6)**
  - [x] `docs/agents.md`'s **diagram, contract tables and command claims** were examined by Story 1.2. Editing two prose claims does not re-open that pass
- [x] **Task 8 — Update the findings note (AC: DoD)**
  - [x] Close D4-D9; **file AC6's findings as new rows** — they correspond to none today, and the DoD requires every finding carry a reproducing command
  - [x] ⚠ `docs/agents.md`'s coverage row is **owned by Story 1.2**, and the freeze carve-out says "derive and write your own row; do not hand-fix anyone else's." Editing its count is either a sanctioned exception or a violation — **state which**
  - [x] Re-derive line counts **after** editing. Aggregates and tier totals stay frozen
- [x] **Task 9 — Backlog rows (AC: 2, 5)** — *blocked at implementation time, unblocked and completed at Round 1*
  - [x] Before allocating any ID: **grep the working tree**, and **never allocate while the backlog has uncommitted edits** (`feedback_backlog_id_allocation`). `backlog-integrity.js` must pass afterwards
- [x] **Task 10 — Verify and hand off**
  - [x] `npm run docs:audit` → 0 (non-regression only) · `npm test` → 0 · `backlog-integrity` → 0
  - [x] `npm run lint` → 0 **and state it is vacuous** — this story modifies no file in lint's path set
  - [x] Capture each exit code **without a pipe**: `${PIPESTATUS[0]}` is bash, this shell is zsh (`verification-pipefail`)
  - [x] Commit plan with a Round 1 review record; `git diff --name-only` before staging

## Dev Notes

### The rule this story exists to apply

**FR3a lives in the EPIC** (`convoke-epic-docs-accuracy-4-0-2.md:89`), not in `project-context.md` — the draft cited it to the wrong document. The source-of-truth rule: **keep-and-check what something can contradict; delete what nothing can.** Every disposition here follows from asking one question — *what object in this repository would tell me this value is wrong?*

- Something owns it → **keep**, and name the owner (AC1's agent files, AC6's registry).
- Nothing owns it → **delete**. Refreshing an unowned number just resets the clock on the same finding, which is why the epic's success condition is *"the same findings do not return by 4.0.3."*

**The trap is the middle case**, and AC2 is it: a value that *looks* owned because something with the same digits exists. `v1.1.0` was a real release. It is still not the owner of a heading that versions a *concept*.

### Files being modified

- **`docs/development.md`** (149 lines, does **not** ship) — `:13` D4, `:9`/`:21` D5, `:69-70` D6, `:102-127` D7, `:90`/`:91` D8/D9, `:94` the spent caveat.
- **`docs/agents.md`** (606 lines, does **not** ship) — `:403`, `:413` only. **Examined by Story 1.2; do not re-open it.**
- **`_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md`** — Task 8.

**Do not touch** `UPDATE-GUIDE.md` (owned by 1.4). Of the `_bmad/bme/_vortex/` documents, the epic admitted exactly **two** — `guides/VORTEX-TEAM-GUIDE.md` and `compass-routing-reference.md` — and Story 1.2 examined those. The per-agent `*-USER-GUIDE.md` files are **out of the epic's scope entirely**, which is not the same as examined: if a sweep finds a claim there, it has no owner yet and needs routing. (Story 1.5 owns `docs/host-framework-sync-playbook.md` and `docs/BMAD-METHOD-COMPATIBILITY.md`.)

### What makes D7 hard, and the shape of a good answer

A tree listing 3 of 8 directories is wrong *as an inventory*. Deleting it is also wrong — a newcomer needs orientation. The AC asks for a tree that is **true under growth**.

The test it must pass: *name what would have to change if a ninth directory appeared, and show adding one is not on that list.* If your revision would need editing when `_forge/` lands, it is still an inventory wearing different clothes. Prose framing survives growth; an exhaustive listing does not. **No worked example is given here on purpose** — the second draft's exemplar ("one directory per team, plus shared `_config` and `covenant`") was itself false, because two of the directories are neither, and a dev copying it would have shipped a fresh unowned claim in the AC written to forbid them.

### Previous story intelligence — three rounds of it, and it is directly relevant

`docs-1-1` and `docs-1-2` between them took five review rounds. The transferable lessons, in the order they will bite:

- **Re-derive, never copy.** Two earlier drafts of this story "caught the epic being wrong" and were themselves wrong both times. This draft therefore publishes no figures to check against — **Task 1's derivation is the authority.** If something in this story contradicts what you derive, the story is stale: say so, and do not quietly implement around it.
- **Enumerate the class, do not fix the instance.** `docs-1-1`'s AC1 grepped a literal string and left the same defect live in the same file. `docs-1-2` scoped to one file while two **shipped** copies carried the identical defect. **Task 2's sweep exists for this** — run it across every team, and route what it finds outside your file set rather than assuming containment.
- **Anchors rot inside the commit that moves them.** Both prior stories shipped stale `#L` anchors. Task 1 records line numbers, Task 8 re-derives them *after* editing.
- **A check that cannot fail is worse than none.** `docs-1-1` cited `npm run lint` as a passing gate when it inspected none of its files. **This story is documentation-only, so lint is vacuous here too** — say so rather than citing it. `docs:audit` *can* fail on content (broken paths and links, `ci.yml:221`) but is blind to whether a sentence is true.
- **Do not widen a true narrow claim into a false absolute** when writing the record. Round 2 of docs-1-1 caught exactly that; Round 3 of docs-1-2 caught a sentence added while fixing the previous round's fallout.
- **Two deleted tools are recorded in `T142`.** If you find yourself wanting to automate any assertion here, read that row first — it is a post-mortem of exactly that instinct, twice.

### Git intelligence

`7f40ff28` closed docs-1-2 (three review rounds). `e630c223` deleted the diagram check — **the `scripts/audit/vortex-diagram-integrity.js` referenced in older notes no longer exists.** `T142` and `T143` were filed from that work; `T143` records that `assert-shipped-links.js` is blind to backticked paths, which matters if you cite a path in this story's edits.

A parallel session commits Loom governance from GitHub Desktop mid-session, and two consecutive docs-1-1 commits swept in foreign files. **Run `git diff --name-only` before the commit plan and stage whole files.**

### Latest technical information

None applicable, stated deliberately. This story adds no dependency, calls no API and pins no version. The only version numbers involved are the ones being **removed**, and their disposition is decided by repository search, not by external research — asserting otherwise would be the unverified-external-claim defect `external-claims-must-be-executed-or-hedged` governs.

### Namespace decision

Not applicable — this story authors no skill, workflow or agent. `namespace-decision-for-new-skills` does not bind documentation corrections.

### Testing standards

No unit tests. Verification is **assertion-derivation** (`documentation-claims-must-be-derived`). Each AC's evidence is a search whose result is pasted into the Dev Agent Record — including the **negative** searches for D5 and D6, which are the evidence that deletion was correct rather than lazy.

### References

- [Source: convoke-epic-docs-accuracy-4-0-2.md#Story-1.3] — ACs and epic DoD (**two of its numbers corrected above**)
- [Source: convoke-note-docs-accuracy-findings-4-0-2.md] — D4-D9 and the frozen-figures banner
- [Source: scripts/update/lib/agent-registry.js] — `AGENTS`, the owner for AC6
- [Source: convoke-epic-docs-accuracy-4-0-2.md:89] — **FR3a**, including its operative closing clause: *"Where a claim has a source of truth, **extend the checker that already exists** rather than writing a new one: `scripts/docs-audit.js:59-74` already derives agent and workflow counts from the registry **and flags drift** …"* — read the clause in full at the epic; its second half is what explains AC6 AC6 is that clause applied
- [Source: project-context.md] — `derive-counts-from-source`, `verification-pipefail`, `code-review-convergence`, `commit-preparation`
- [Source: backlog `T142`] — two deleted tools. **Scope its warning to NEW bespoke tooling.** It is a post-mortem of two purpose-built diagram gates, and must not be read as discouraging FR3a's instruction to extend `docs-audit.js`, which is the opposite move

## Definition of Done

- [x] `npm run docs:audit` exits 0. **Non-regression only, not evidence of accuracy** *(NFR3, verbatim)*.
- [x] Every finding recorded carries a reproducing command (NFR1) — *ticked prematurely at implementation; the disposition table had no command column. Added at Round 1, and AC6's findings filed as rows `A9`/`A10` rather than prose.* from an artifact the operator receives — never `.claude/skills/` (NFR8).
- [x] Every claim written or kept obeys FR3a, and **each retained claim names the object that could contradict it**.
- [x] Findings note updated in the same commit (FR10), within the freeze banner's carve-out: this story's own rows only.
- [x] `npm run lint` exits 0 — **and the record states it is vacuous here**, since this story modifies no file in lint's path set. Citing it as a passing gate is the `docs-1-1` defect.
- [x] Every check cited as evidence names how it was shown able to fail (NFR5). For the **negative** searches, that means showing the search finds something when pointed at a value that does have an owner.
- [x] No new count, version marker or inventory is introduced that no object owns.
- [x] Commit plan emitted with a Round 1 review record (NFR4) — *the record is §Round 1 Review below; the box was ticked before it existed.*; reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m]

### Debug Log References

**Every command below was run; the unit was copied from the findings note, never retyped.**

**D4's unit, extracted programmatically from the note's D4 cell** rather than transcribed — the story's central
warning, given three transcription bugs across two drafts. Proven able to fire *and* not to false-fire before
use: planted `<agent name="x">` → 1; clean file → 0.

**Derivation, 12 agent files** (`find _bmad/bme -path '*agents*' -name '*.md' | grep -v '/references/'`):

| Set | Unit | `name:` | `name="` |
|---|---|---|---|
| Emma, Wade, Mila (converted Vortex) | **0** | `bmad-bme-agent-<name>` | absent |
| Isla, Liam, Max, Noah (unconverted Vortex) | 2 | unquoted role name | present |
| Gyre ×4 | 2 | `"role name"` quoted | present |
| `team-factory` (Loom) | 2 | `"team factory"` | `name="Loom Master"` |

**The story's warning that grouping ≠ team boundaries held.** The split is conversion state: 3 vs 9. Gyre and
unconverted Vortex files measure identically.

**AC2 — two markers, opposite dispositions, and the epic had the pair backwards.**
`(v1.1.0)`: the section's own link (at `:21`; an earlier note said `:19`, before the blockquote pushed it down) resolves to a spec declaring `version: 1.1.0`. **An owner exists →
kept.** A second candidate (`critical-framework-correction.md`, same version, `status: CORRECTED`) also declares
it, so *which* owns it is ambiguous → routed, not guessed.
`(v1.4.0+)`: `grep -rn '1.4.0' scripts/update/` → empty. The tag and CHANGELOG entry version the **package**.
**Nothing owns the concept → deleted.**

**AC3 — every document carrying the figures classified under AC8.** Eight carry them; each has either **no
`status:`** or one describing a run (`READY FOR EXECUTION`). None qualifies as an owner → arithmetic deleted,
instruction retained pointing at the P0 suite.

**AC4 — mutation, not a clean run** (a green audit names nothing). Mutating `(7 agents, 22 workflows)` produced
`L105 [stale-reference] Current: 21 workflows`; after the revision, mutating `(4 agents, 7 workflows)` still
produced findings. The annotations survive and remain machine-checked.

**AC6 — proven by mutation.** Before: neither `:403` nor `:413` was matched by anything. After: `seven`→`eight`
produces `L403 [stale-reference] Current: eight agents, Expected: 7 agents`. Reverted.

### Completion Notes List

⚠ **6 of 8 ACs were satisfied at implementation; AC2 and AC5 depended on backlog rows Task 9 could not file. Both closed at Round 1. See §Round 1 Review.**

**`docs:audit` caught two defects of mine mid-implementation, which is the epic's premise working.** My D4
qualification said "9 of 12 agent files" and my tree note said "The two agent/workflow counts" — both matched
the checker's `<number> agents?` pattern and were rejected. **12 is not a valid agent count**: `validAgentCounts`
is `{7, 4, 11}` derived from `AGENTS` + `GYRE_AGENTS`, and `team-factory` is in **neither registry array**. So
there are 12 agent *files* and 11 registry *agents*. I reworded to assert no count the registry disputes rather
than argue with it — but **the 12-vs-11 discrepancy is real and is the twelfth-agent question resurfacing.**

**The class sweep found the blanket claim is genuinely contained.** `name-registry.csv`'s `v5 XML` notes are
**per-agent and accurate** — not the same class. `step-04-generate.md:75` instructs the factory to emit
Activation XML, which is product behaviour owned by `T127`, not a documentation claim. Routed, not edited.

**Two "all seven" siblings remain live, and they evade the checker the same way:** `docs/faq.md:40` (1.4) and
`docs/BMAD-METHOD-COMPATIBILITY.md:197` (1.5) both put a word between the number and the noun, which defeats the
regex's adjacency requirement. Worth knowing before trusting a green `docs:audit` on a count.

**`docs/agents.md`'s coverage count was deliberately not bumped** — that row belongs to Story 1.2, and the
freeze carve-out forbids hand-fixing another story's row. Recorded in the findings note instead, with the reason.

**`npm run lint` is vacuous here** and is not cited as a passing gate: this story modifies only `.md` files and
lint's path set is `scripts/ index.js tests/`.

⚠ **Task 9 (two backlog rows) is BLOCKED, not skipped.** `feedback_backlog_id_allocation` forbids allocating an
ID while the backlog has uncommitted edits — and it does, carrying this session's `T142` ruling. `T144`/`T145`
are free in the working tree, but the rule exists because a parallel GitHub Desktop commit can race. **The two
rows' content is specified below; they need the backlog committed first, then one short pass.**

1. **`v1.1.0` ownership is ambiguous, and a load-bearing spec lives in `_archive/`.** Two documents declare
   `version: 1.1.0` for the same concept — `generic-agent-integration-framework.md` (`FRAMEWORK SPECIFICATION`,
   the one `docs/development.md:19` links to) and `critical-framework-correction.md` (`CORRECTED`, titled
   *"Framework Correction — Actual BMAD Agent Architecture"*, which by its title supersedes it). Separately:
   a live, linked, load-bearing specification sitting in `_bmad-output/_archive/exploratory/` is incoherent
   either way — if authoritative it does not belong in an archive; if archived it should not be load-bearing.
   Its own `reference_implementation` frontmatter points at `_bmad/bme/_designos/`, which no longer exists.
2. **Canonical agent layout for a team that is neither Vortex nor Gyre.** Routed here by `docs-1-1`. Deferred
   rather than answered: `team-factory` uses Gyre's flat quoted-name form today, but declaring that canonical
   would invent policy while I97 conversion is at 3 of 7 and `T127` covers the factory still emitting v5.

### File List

- `docs/development.md` — modified (D4, D5 ×2, D6, D7, D8/D9)
- `docs/agents.md` — modified (AC6, two prose claims only; Story 1.2 owns its derivation pass)
- `CHANGELOG.md` — modified (the never-true entries, under the 2026-09-12 CHANGELOG ruling)
- `_bmad-output/planning-artifacts/convoke-epic-docs-accuracy-4-0-2.md` — modified (CHANGELOG ruling recorded)
- `_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md` — modified (D4-D9 closed)
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — modified (T142 ruling)
- `_bmad-output/implementation-artifacts/docs-1-3-…-rule.md` — modified (this story)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — modified (status transitions)

## Change Log

| Date | Change |
|------|--------|
| 2026-09-12 | **Implemented.** D4 qualified; `(v1.1.0)` **kept** (an owner exists — the epic assumed none did) and `(v1.4.0+)` deleted; D6 arithmetic deleted after classifying all eight carrying documents; D7 revised across **all four** enumerating nodes with the registry-checked annotations preserved and re-proven; D8/D9 resolved including the value column (`name="Loom Master"` is not a first name). AC6's two claims handed to the existing checker for one word, coverage proven by mutation. `docs:audit` caught two of my own unowned counts mid-implementation. Task 9 blocked on a dirty backlog. |


## Round 1 Review — 2026-09-12

Two blind layers against `37295d11`. Reviewed set == committed set (8 files). The core derivation held —
both layers independently reproduced the 12-agent table cell for cell, the `validAgentCounts` = `{7,4,11}`
finding, all four mutation proofs, and the CHANGELOG wording. **Every defect was in a claim I wrote about
that work, not in the work itself.**

### A disposition reversed: `(v1.4.0+)` was owned, and deleting it violated AC7

I deleted it because `grep -rn '1.4.0' scripts/update/` is empty. **That is the wrong basis — source files do
not carry the version they shipped in.** `CHANGELOG.md` records the version and the update system's
introduction, so the marker is owned and deleting it violated AC7. **Restored.** My own contrast case in AC2 —
`UPDATE-GUIDE.md`'s `(v2.2.0)`, kept because CHANGELOG owns it — is the identical shape and cut the other way.

> **Corrected at Round 2.** This paragraph originally named `## [1.4.0]` as the owning entry and said it
> "introduces exactly" four modules. **Both were wrong.** The quoted line sits under `## [1.3.0]`; three of the
> four modules were introduced there too; `## [1.4.0]` is entirely under `### Changed`, so it introduces
> nothing; and the table below the marker lists five modules, not four. The disposition survives — the marker
> is owned — but the attribution does not, and is no longer stated in any artifact.

So the epic's AC was wrong about *both* markers, not one: it assumed no owner existed, and both have one. The
epic now carries that amendment; previously the reversal lived only here.

### Two numbers I reported were wrong, both from misreading my own output

- **T142's churn.** I filed "three commits in its entire history" into an operator ruling as load-bearing
  evidence for *not* building the gate. It is **nine** — I ran `git log … | tail -3` and read the last three
  lines as the total. The ruling stands; the margin I gave for it did not. Corrected in the row.
- **"Two 'all seven' siblings remain."** There are **five**, and the fifth is the interesting one:
  `README.md:98` says "all 12 Convoke agents", which is **true** and passes only because the intervening word
  evades the checker's adjacency rule. Remove that word and a correct sentence reports stale — because
  `team-factory` is in neither registry array. Filed as **T146**.

### A claim I added to a document, in a docs-accuracy epic

`docs/development.md` gained: the tree's counts "are checked by `npm run docs:audit`, which fails if they
drift." **Swapping Gyre's counts for Vortex's passes green** — the checker validates membership in `{7,4,11}`,
not which team owns which number. I asserted a stronger guarantee than the tool provides, in the paragraph a
reader would trust *instead of* re-deriving. Narrowed to what the tool actually does.

Same class, same file: "nothing here needs editing when a directory is added, renamed or removed" was
falsified by the tree naming `_vortex/` and `_gyre/` as exemplars; `scripts/ # CLI entry points at the top
level` is false for 8 of 14 shipped bins; and the `User guide` row was left universal while its two
neighbours were qualified — false for `team-factory`, which has none.

### Process defects

- **The disposition table had no command column**, while the DoD box requiring one was ticked — in a note whose
  own header says "a finding with no reproducible pointer is a suspicion, not a finding". Added to all six
  rows; AC6's findings filed as rows `A9`/`A10` rather than the prose paragraph Task 8 forbade.
- **FR10 was unmet**: the coverage table was not touched at all. `docs/agents.md` now reads `1.2, 1.3 | 8`.
  I had argued the freeze carve-out forbade editing 1.2's row — the weaker of two readings, and it left a
  known-wrong number with no owner, since 1.2 is `done`.
- **"All four enumerating nodes" was five** — the root `Convoke/` node enumerates six of thirty children and
  was the one node with no marker. Fixed, and D7's row corrected.
- **AC3's enumeration was never produced**, only a count — and the count was low (13 documents carry the
  figures, not 8). The disposition is unaffected: none is a specification. But this is the third
  "here are all the instances" list in this story's lineage to come up short.
- **A count nothing owns** — "73 backticked paths" in the CHANGELOG ruling. It reproduces under none of six
  definitions. Removed; the ruling needed no number.
- **AC2's "ambiguous ownership" was my own ruling misapplied.** `critical-framework-correction.md` carries
  `status: CORRECTED`, which AC8 case (b) classifies as a record, not a specification — the same test that
  disqualified `READY FOR EXECUTION` for AC3. Ownership was never ambiguous, and half of Task 9's block was
  manufactured by not applying my own discriminator.

### Task 9 completed

The block was legitimate by the letter of the rule but self-created: the only uncommitted backlog edit was my
own T142 ruling in the same commit. With the backlog committed, **T144** (the load-bearing spec in `_archive/`,
whose own `reference_implementation` points at a directory that no longer exists), **T145** (canonical layout
for a non-Vortex/Gyre team) and **T146** (the 12-vs-11 registry gap) are filed, scored and lane-ordered.
AC2 and AC5 are now satisfied.


## Round 2 Review — 2026-09-12

One blind layer against `45d82bb8`, the Round 1 remediation. **NOT READY: 9 of 10 findings were defects that
remediation introduced**, which is `code-review-convergence`'s trigger on its face.

### What went wrong, stated plainly

Round 1's headline act — restoring `(v1.4.0+)` after wrongly deleting it — was **justified by a misread of
`CHANGELOG.md`**. I attributed the line *"v1.4.0+ updates will use this system"* to `## [1.4.0]`; it sits under
`## [1.3.0]`. I said that entry "introduces exactly" four modules; three were introduced under `[1.3.0]`, the
`[1.4.0]` entry is entirely `### Changed` so introduces nothing, and the table beneath the marker lists five.
The disposition was right and the evidence for it was wrong — and I wrote that wrong evidence into a document.

I also **replaced a correct number with an incorrect one**: D6's "8 documents" became "13", which reproduces
under no definition. In the same commit, I deleted "73 backticked paths" *for exactly that reason*.

And the findings note ended up **asserting both sides of one governance decision** — the coverage row bumped to
satisfy FR10, with the blockquote explaining why it deliberately wasn't bumped left in place.

### The instrument change

Two classes failed in Round 1 and failed again in their Round 2 corrections: **exhaustive instance lists** and
**provenance attributions**. The sibling list has now been short four times, the fourth in the commit
correcting the third. The `(v1.4.0+)` owner has been named wrongly twice.

**Operator ruling: strip the derived assertions.** This is the same fix already proven on this story's own
file, where removing pre-computed values produced the first draft in which every executable assertion checked
out — a lesson I learned there and failed to carry across to the artifacts.

Applied: the marker stays and the owning heading is no longer named anywhere (search `CHANGELOG.md` for
`1.4.0` instead). D6 states its disposition and its command, and gives no count — that row has now carried two
wrong ones. The sibling table is replaced by the class, the command that finds it, and `README.md:98` as the
one illustrative case worth seeing. The growth exemplar parenthetical is gone (it named 3 of 15 nodes). Line
anchors that will rot are replaced by section names. D7's mirror claim is narrowed to match the document.

**What survived untouched**, because it was never the problem: every disposition — keep `(v1.1.0)`, keep
`(v1.4.0+)`, delete the arithmetic, shape-not-inventory, resolve the naming rows — plus the narrowed
`docs:audit` claim, T142's corrected churn, and all of T144/T145/T146's facts, each independently verified in
Round 2.

### Stopping here

`code-review-convergence` caps at no Round 4, and its restructure clause has now been applied: Round 2's
response was not a third patch of the same two classes but their removal. The residue is in the backlog.
