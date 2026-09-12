---
baseline_commit: 7f40ff28
---

# Story 1.3: Resolve the restatements by the source-of-truth rule

Status: ready-for-dev

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

- [ ] **Task 1 — Derive everything, before editing (AC: all)**
  - [ ] Enumerate agent files under `_bmad/bme/`, excluding `references/` sub-files. Measure each with D4's unit **copied from the findings note's D4 row**, plus its frontmatter `name:` and any `name="` value
  - [ ] **Prove every search you rely on can fire** before citing it — plant a matching string, show the hit, remove it. Three greps across two drafts silently matched nothing (NFR5)
  - [ ] For each version marker: open what the section links to first, then widen. Record **all** candidates
  - [ ] Content-search the scenario figures; classify every document that carries them under AC8
  - [ ] Diff each enumerating node in the tree fence against the filesystem; run `npm run docs:audit` to identify which annotations it validates
  - [ ] Record the current line numbers of every claim to be edited
- [ ] **Task 2 — D4: qualify the XML claim (AC: 1)**
  - [ ] Sweep for the same claim class across **all** of `_bmad/bme/`, not one team. **The class is any statement that an agent's structure is XML, in any spelling** — a plain `xml-based` search misses live instances that say it differently, and at least one exists outside Vortex
  - [ ] Instances outside this story's file set are **recorded and routed to an owner, not edited here**
- [ ] **Task 3 — D5: dispose of each marker separately (AC: 2)**
  - [ ] File a backlog row for any ambiguous ownership, and for the filing question a load-bearing spec in `_archive/` raises. **Do not resolve those here**
  - [ ] **Do not touch `UPDATE-GUIDE.md`**
- [ ] **Task 4 — D6: dispose of the arithmetic; record every document found (AC: 3, 8)**
- [ ] **Task 5 — D7: revise every enumerating node (AC: 4)**
  - [ ] Preserve the registry-validated annotations; confirm `docs:audit` still exercises them afterwards
- [ ] **Task 6 — D8/D9: resolve both rows including their values; clear the spent caveat; answer or defer the canonical-layout question (AC: 5)**
- [ ] **Task 7 — AC6: reword for the existing checker, and prove coverage by mutation (AC: 6)**
  - [ ] `docs/agents.md`'s **diagram, contract tables and command claims** were examined by Story 1.2. Editing two prose claims does not re-open that pass
- [ ] **Task 8 — Update the findings note (AC: DoD)**
  - [ ] Close D4-D9; **file AC6's findings as new rows** — they correspond to none today, and the DoD requires every finding carry a reproducing command
  - [ ] ⚠ `docs/agents.md`'s coverage row is **owned by Story 1.2**, and the freeze carve-out says "derive and write your own row; do not hand-fix anyone else's." Editing its count is either a sanctioned exception or a violation — **state which**
  - [ ] Re-derive line counts **after** editing. Aggregates and tier totals stay frozen
- [ ] **Task 9 — Backlog rows (AC: 2, 5)**
  - [ ] Before allocating any ID: **grep the working tree**, and **never allocate while the backlog has uncommitted edits** (`feedback_backlog_id_allocation`). `backlog-integrity.js` must pass afterwards
- [ ] **Task 10 — Verify and hand off**
  - [ ] `npm run docs:audit` → 0 (non-regression only) · `npm test` → 0 · `backlog-integrity` → 0
  - [ ] `npm run lint` → 0 **and state it is vacuous** — this story modifies no file in lint's path set
  - [ ] Capture each exit code **without a pipe**: `${PIPESTATUS[0]}` is bash, this shell is zsh (`verification-pipefail`)
  - [ ] Commit plan with a Round 1 review record; `git diff --name-only` before staging

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

- [ ] `npm run docs:audit` exits 0. **Non-regression only, not evidence of accuracy** *(NFR3, verbatim)*.
- [ ] Every finding recorded carries a reproducing command (NFR1) from an artifact the operator receives — never `.claude/skills/` (NFR8).
- [ ] Every claim written or kept obeys FR3a, and **each retained claim names the object that could contradict it**.
- [ ] Findings note updated in the same commit (FR10), within the freeze banner's carve-out: this story's own rows only.
- [ ] `npm run lint` exits 0 — **and the record states it is vacuous here**, since this story modifies no file in lint's path set. Citing it as a passing gate is the `docs-1-1` defect.
- [ ] Every check cited as evidence names how it was shown able to fail (NFR5). For the **negative** searches, that means showing the search finds something when pointed at a value that does have an owner.
- [ ] No new count, version marker or inventory is introduced that no object owns.
- [ ] Commit plan emitted with a Round 1 review record (NFR4); reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-09-12 | **Instrument changed after a SECOND validation returned NOT READY — 12 of its 16 findings were defects the first rework introduced.** Every failure across both drafts had one shape: a command or derived value transcribed into the story was wrong (three escaping bugs, an enumeration returning 24 files instead of 12, two incomplete instance lists, a count table that contradicted the story's own stop-rule). The dispositions survived every round; the arithmetic never did. **Operator ruling: stop pre-computing.** The story now states what to derive and what disposition follows from each answer, cites canonical commands by location instead of retyping them, and publishes no counts. AC8 added to carry the archive ruling and name its actual discriminator (`status:`, not `version:` — both classes have a version field, which the previous draft missed and which would have led a dev to reverse AC3). The false D7 worked example is removed rather than corrected; the `_vortex` scope fencing is narrowed to the two documents the epic actually admitted. |
| 2026-09-12 | **Reworked after independent validation returned NOT READY, 7 HIGH.** Both of the draft's "corrections of the epic" were **retracted as false**: the epic's Isla figure is right under the unit the findings note publishes (the draft switched units silently, and its own figure was indefensible — Isla's file and Gyre's are structurally identical), and `v1.1.0` **is** owned, by the spec that `docs/development.md:19` links to, in the same section as the heading the draft proposed deleting. The draft also asserted a `v1.1.0` git tag that does not exist, and wrote its containment grep with `\|` inside `-E` so it could never fire — the identical bug `docs-1-1` Round 1 caught. **Operator ruling: a versioned specification is an owner wherever filed; a dated point-in-time record is not** — so `(v1.1.0)` becomes keep-and-check and the 39/18 arithmetic stays a delete. AC2 split into 2a/2b (the pair was backwards). AC4 widened from one enumeration to four. AC1/AC5 widened to the **twelfth** agent `docs-1-1` routed here. AC6 now requires wording the existing `docs-audit.js` matches, per FR3a's own clause, which the draft had dropped while citing FR3a to the wrong document. |
| 2026-09-12 | Story created. Every anchor re-derived at `7f40ff28`; the epic's ACs were written against a 141-line file that is now 149. **Two epic errors corrected in the ACs:** Isla carries four XML element types, not two (and Mila is converted, making the converted set three); and AC2's premise that no object owns `v1.1.0` is false — `CHANGELOG.md:996` and a git tag do — so the deletion reasoning is restated rather than inherited. Scope adds AC5 (D8/D9, routed here by docs-1-1) and AC6 (the "all seven" claims, routed here by docs-1-2). |
