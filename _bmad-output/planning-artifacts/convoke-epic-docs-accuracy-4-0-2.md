---
initiative: convoke
artifact_type: epic
created: 2026-09-10T00:00:00.000Z
schema_version: 1
status: active
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md
  - docs/pre-tag-release-checklist.md
  - project-context.md
  - scripts/docs-audit.js
  - package.json
---

# Convoke 4.0.2 — Documentation Accuracy Epic

## Overview

Cross-cutting, incident-driven epic following the
[`convoke-epic-ci-hygiene.md`](convoke-epic-ci-hygiene.md) /
[`convoke-epic-4-0-1-distribution-integrity.md`](convoke-epic-4-0-1-distribution-integrity.md)
precedent: **no PRD and no Architecture document.** Requirements derive from the ratified
scope decisions of 2026-09-10 and from the source-verified findings in
[`convoke-note-docs-accuracy-findings-4-0-2.md`](convoke-note-docs-accuracy-findings-4-0-2.md).

**Spine.** *Nothing in the release path can refuse a tag over documentation content.*
`npm run docs:audit` exits 0 with zero findings on two files carrying eleven defects between
them, three of which make a reader act and fail. The gate is not broken — it checks shape, and
every finding is a truth defect. The release checklist asserts CI green, so a green `docs:audit`
is currently the whole of the documentation gate. This epic repairs the instances **and**
converts the gate into a recorded derivation pass, which is the only enforceable form when no
check can decide whether a sentence is true.

**Trigger.** Operator found two stale spots by eye on 2026-09-10. Scoping derived nine more from
the same two files. **Ten of twelve in-scope files remain unexamined** — the cold tier has had two
releases to rot and was edited in neither.

**Gate posture — ratified 2026-09-10: this epic BLOCKS the 4.0.2 tag.** Stories 1–4 remediate;
Story 5 wires the gate and lands last, the same shape `dist-epic-2` used.

**Size.** 5 stories over 14 files. Deliberately excludes the remaining warm tier (written
during `dist-epic-2`, low expected yield) and five vision/draft/snapshot documents held to the
wrong bar by a present-tense accuracy pass. **Amended 2026-09-11, narrowed at Round 2:** `README.md` is admitted to scope after Story 1.1's
Round 1 review falsified the warm-tier exclusion for the D2 class (file count 12 → 13; `README.md`
is 167 lines, so the ~3,191-line scope figure becomes ~3,358).

**`CHANGELOG.md` is NOT admitted, and the question is referred to the operator.** Round 2 established
that the repository already codifies the opposite ruling: `scripts/docs-audit.js:541-542` deliberately
skips CHANGELOG's stale-reference and broken-path checks because *"historical entries reference files
that may have been deleted or renamed in past versions"*, and the findings note exempts dated
historical records on the same reasoning. Round 1's remediation rewrote two shipped-release entries
and, in doing so, asserted that `step-add-agent.md` and `step-add-skill.md` "have never existed" —
**which is false.** Stories `tf-3-1` and `tf-3-2` (both `done`, `tf-epic-3: done`) created both files
in `.claude/skills/bmad-team-factory/`, which `.gitignore:62` excludes; the claim was derived from a
git-path search structurally blind to that directory — the **NFR8** error, committed in the same
commit that amended this epic. Both CHANGELOG entries were reverted 2026-09-11. Whether a changelog
enters a present-tense derivation pass is an operator ruling, not a story-authored amendment.

## Requirements Inventory

### Functional Requirements

FR1: `docs/development.md` ACT-FAIL claims are corrected — the team-factory invocation names the installed skill, the capability list names only shipped capabilities, and the agent-file naming convention is stated once and consistently for both Vortex and Gyre layouts. (Findings D1, D2, D3)

FR2: The `docs/agents.md` Vortex flow diagram routes HC9 to the agent its own contract table names, closes every box it opens, and renders with equal column counts across all rows of a box row. (Findings A1, A2, A3, A4)

FR2a: The diagram is verified by **two independent mechanical checks, not one** — a *geometry* check (equal render-column counts per box row, equal `┌`/`└` counts, emoji counted as two columns) and a *routing* check that parses the HC contract tables at `docs/agents.md:264-289` and asserts each contract's arrow terminates in the box its own table names. **The geometry check cannot see A1**: a perfectly aligned diagram can still route HC9 to the wrong agent, so geometry alone is a check that cannot fail on this story's most severe finding.

FR3: `docs/development.md` MISLEAD and ROT claims are resolved by the **source-of-truth rule** (FR3a), not by correcting values in place. (Findings D4, D5, D6, D7)

- **D4** — the "XML-based agent structure" claim *has* a source of truth (the agent `SKILL.md` files) and a reader depends on it. **Qualify it** to match the actual conversion state.
- **D5** — the `(v1.1.0)` / `(v1.4.0+)` section markers version a *concept*, not the package. Nothing in the repository owns them and no reader action depends on them. **Delete.**
- **D6** — "39 scenarios" / "18 critical scenarios" have no registry, no config, and nothing that could ever contradict them. Keep the instruction, **delete the arithmetic.**
- **D7** — the Project Structure tree did not rot because it was hand-written; it rotted because it **implied exhaustiveness** and was not exhaustive. **Reduce the claim** to shape rather than inventory — neither delete (a reader needs orientation; `ls` is not orientation) nor generate (a generator buys for one block what a weaker claim gets for free).

FR3a: **The source-of-truth rule governs every count, version and inventory claim this epic touches, in all seven stories.** A number is kept *and mechanically checked* if some object in the repository can contradict it; a number is **deleted** if nothing can. A claim nobody can ever falsify is how D6 entered the documentation and survived two releases — it is not a weaker fact, it is a non-fact wearing a fact's punctuation. Where a claim has a source of truth, extend the checker that already exists rather than writing a new one: `scripts/docs-audit.js:59-74` already derives agent and workflow counts from the registry and flags drift, which is why `development.md`'s "7 agents, 22 workflows" never rotted while D6 did.

FR4: `UPDATE-GUIDE.md` and `docs/faq.md` (**57 derived assertions**) pass a derivation pass — every sentence asserting repository behaviour is checked against the file that determines it, and every finding is recorded with a re-runnable evidence command. These are the documents where a reader performs an action, which is why they lead.

FR4a: **The derived-assertion count over the full in-scope corpus is an INPUT to this epic, recorded in the findings note before any story runs** — it is not an output of a discovery story. Counting inside Story 1.4 would produce the number *after* the story cut is already frozen, which is precisely how the first cut came to be wrong. Story 1.4 re-derives the count with the pinned script and reports material divergence; it does not originate it.

FR4b: **The cut of Stories 1.4–1.6 is sized by derived-assertion count, never by line count or file age.** Measured 2026-09-10, the two disagree violently: `docs/references.md` is 877 lines and carries **2** derived assertions, while `UPDATE-GUIDE.md` is 262 lines and carries **37**. A line-sized cut inverted the clusters — the story labelled "the overrun risk" (1,252 lines) scored 32 while the one labelled "low yield, cheap" (585 lines) scored 40. A per-100-lines rate does not extrapolate across this corpus and must not be reintroduced.

FR5: `docs/host-framework-sync-playbook.md` and `docs/BMAD-METHOD-COMPATIBILITY.md` (**66 derived assertions**) pass the same derivation pass. They are paired by subject, not by leftover: both describe Convoke's relationship to upstream BMAD, so a finding in one is usually a finding in the other.

FR6: `docs/testing.md`, `SECURITY.md`, `CREDITS.md`, `CODE_OF_CONDUCT.md`, `docs/what-convoke-brings-to-bmad-method.md` and the two derived assertions inside `docs/references.md` (**28 derived assertions** in total) pass the same derivation pass. This is the genuine remainder, and three of its files score zero or near-zero — a fact the pass records rather than a reason to skip them.

FR7: All findings across Stories 1.1–1.6 accumulate into the single findings note in one table format — ID, line, claim, reality, evidence command — so that any row is independently re-runnable by a later reader.

FR8: `docs/pre-tag-release-checklist.md` gains a documentation-accuracy step that asserts, for the release SHA, that the findings note's coverage table shows no `In scope: yes` / `Examined: no` row — and that step is able to refuse a tag.

FR8a: That step states **what it asserts and what it does not**. It asserts a derivation pass was recorded over the full in-scope set; it does **not** assert the documentation is correct, and it must not be written as though it does. A step that claims more than it checks tells the next reader they are protected when they are not — the failure `commit-preparation` records twice in this repository.

FR9: Work this epic identifies but deliberately does not do is filed as backlog rows, not fixed here — **two** rows:

- the five vision/draft/snapshot documents sitting unlabelled in `docs/`; and
- **bibliography link integrity for `docs/references.md`.** The file is a bibliography — 73 headings, 64 external URLs, claims about academic literature rather than about this repository — so a derivation-against-source pass is the wrong instrument for it. What it needs is external link resolution plus a check that its "underpins component X" mappings still name components that exist. Executing 64 external URL checks under `external-claims-must-be-executed-or-hedged` is real work on a different cadence, and it is not release-gate work. Its two repository-facing assertions are checked in Story 1.6; the rest is filed.

FR10: The findings note carries a **coverage table** — every in-scope file with an explicit examined / not-examined state, the story that owns it, and its findings count — maintained by every story that examines a file. This is the denominator FR8 gates on: truth is not mechanically checkable, coverage is.

### NonFunctional Requirements

NFR1: Every finding entering the note names a command that reproduces it. A finding with no command does not enter the table. (`verification-claims-must-name-their-evidence`)

NFR2: Any count written into documentation by this epic is recomputed from source at the time of writing, never copied from the text being replaced. (`derive-counts-from-source`)

NFR3: `npm run docs:audit` exits 0 after every story. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and no story may cite it as proof a document is correct. **This NFR is carried verbatim into each story's Definition of Done, not left in this epic alone** — `lint-passes-before-review` records a configured gate skipped through two full review rounds because the obligation lived only in a checklist nobody re-read.

NFR4: Each story leaves the tree green and ships under its own commit plan with a Round 1 review record. (`commit-preparation`, `code-review-convergence`)

NFR5: The Story 5 gate has failed once on purpose, against a known-bad input, before it ships. A gate that has never refused anything is not evidence. (`verification-must-be-falsifiable`)

NFR6: No story writes a policy into documentation that does not already exist. Where a document needs a rule that has not been ratified, the story names it as an open decision and routes it to the operator. (`documentation-claims-must-be-derived`)

NFR7: Every file path a corrected document cites is globbed and confirmed to exist at correction time. (`spec-verify-referenced-files`)

NFR8: **Every finding derives from an artifact the operator actually receives.** `.claude/skills/*` is gitignored (`.gitignore:62`) and holds installed output, not shipped source; resolving a slash command there can report a command present that the package does not ship. Slash-command claims derive from `scripts/update/lib/agent-registry.js`; file claims from `_bmad/`, `docs/` or `scripts/`; version claims from `package.json`. Finding D1 was caught on the wrong basis by pre-mortem before any story was built on it — the finding survived, the citation did not.

### Additional Requirements

Derived from `project-context.md` and the existing release machinery, in place of an Architecture document:

- **The checklist has seven numbered sections.** FR8's step must slot in without breaking the numbering that `dist-epic-2` runbooks reference, and must not assert a job count — §3 of that file records why a count in a release procedure rots into a false halt.
- **`docs:audit` is one of the CI jobs §3 asserts green.** The new step is therefore additive to §3, not a modification of it.
- **The findings note is append-only in spirit.** Stories 2–4 add rows; no story rewrites another story's rows.
- **Deferred findings become backlog rows, sorted on insert**, per `backlog-write-discipline`; `node scripts/audit/backlog-integrity.js` is run before any commit plan touching the backlog.
- **Backlog ID allocation requires a clean working tree** for the backlog file — verified clean 2026-09-10; re-verify at allocation time. (`feedback_backlog_id_allocation`)
- **The diagram fix in FR2 needs two re-runnable checks**, not an eyeball and not one script: geometry *and* routing. See FR2a for why one is insufficient.
- **Tooling inventory — one new script, two extensions, and one thing deliberately not built.** Counted explicitly because the epic's requirement count grew twice under scrutiny and the mechanisation budget is the first place that shows up as unshipped work:

  | Need | Disposition |
  |---|---|
  | Agent/workflow count drift | **Already exists** — `docs-audit.js:59-74` (`checkStaleReferences`) |
  | Project Structure tree accuracy | **Not built** — FR3 reduces the claim instead of generating the block |
  | Coverage denominator (FR8/FR10) | **Extension** to `docs-audit.js`; the in-scope column is derived from the filesystem minus a declared exclusion list, so a new document appears in the table unexamined on its own |
  | Diagram geometry + routing (FR2a) | **One new script**, both checks in one file |
- **`.claude/skills/` is gitignored and is not a valid evidence basis.** See NFR8. Any story resolving a slash command must derive it from `scripts/update/lib/agent-registry.js`.
- **A pre-mortem and a roundtable were run on this epic before story creation** (2026-09-10). The roundtable produced FR3a (the source-of-truth rule), FR4a (assertion-density calibration, replacing a lines-based estimate that would not extrapolate across this corpus), and the tooling inventory above — including the cancellation of a tree generator nobody needed once the claim was reduced. The pre-mortem produced FR2a, FR8a, FR10, NFR8 and the NFR3 DoD clause. Seven failure paths were worked backwards; the warm-tier scope exclusion was tested and not falsified **for D1** — no D1-class defect resolves wrongly in `README.md`, `INSTALLATION.md` or `CONTRIBUTING.md`. **Amended 2026-09-11 (Story 1.1 Round 1 review): the exclusion WAS falsified for D2.** The pre-mortem tested the warm tier by resolving slash *commands*; it never tested capability *claims*. `README.md` advertised a capability `step-00-route.md:42` explicitly refuses to run, and was corrected. **`CHANGELOG.md` is NOT admitted by this amendment** — see the ruling note below. Read the original sentence as scoped to the one defect class it actually tested. That exclusion's premise ("recently edited implies accurate") remains weak: `development.md` was edited 16 days before carrying seven findings.

### UX Design Requirements

None. No UI surface; the epic's only rendered artifact is an ASCII diagram, covered by FR2 and its Additional Requirement above.

### FR Coverage Map

| FR | Epic | Story | Coverage |
|----|------|-------|----------|
| FR1 | Epic 1 | 1.1 | ACT-FAIL claims in `development.md` — D1 (wrong command), D2 (unshipped capability), D3 (self-contradicting naming convention) |
| FR2 | Epic 1 | 1.2 | `agents.md` flow diagram — A1 (HC9 contradicts contract table), A2 (unclosed box), A3 (column drift), A4 (inverted arrow) |
| FR3 | Epic 1 | 1.3 | MISLEAD/ROT claims in `development.md` — D4 (XML blanket claim), D5 (version markers), D6 (hardcoded counts), D7 (module tree) |
| FR4 | Epic 1 | 1.4 | Derivation pass — `UPDATE-GUIDE.md`, `faq.md` (57 assertions) |
| FR5 | Epic 1 | 1.5 | Derivation pass — `host-framework-sync-playbook.md`, `BMAD-METHOD-COMPATIBILITY.md` (66) |
| FR6 | Epic 1 | 1.6 | Derivation pass — `testing.md`, `SECURITY.md`, `CREDITS.md`, `CODE_OF_CONDUCT.md`, `what-convoke-brings`, + `references.md`'s 2 assertions (28) |
| FR7 | Epic 1 | 1.1–1.6 | Findings note accumulates every finding in one re-runnable table format (cross-cutting; asserted in every story's DoD) |
| FR8 | Epic 1 | 1.7 | Documentation-accuracy step added to `pre-tag-release-checklist.md`, able to refuse |
| FR9 | Epic 1 | 1.7 | Two backlog rows filed, not fixed — unlabelled draft docs, and `references.md` bibliography link integrity |
| FR2a | Epic 1 | 1.2 | Two independent diagram checks — geometry AND routing; geometry alone cannot see A1 |
| FR8a | Epic 1 | 1.7 | The gate step states what it asserts and what it does not |
| FR10 | Epic 1 | 1.1–1.6 | Coverage table in the findings note — the denominator FR8 gates on |
| FR3a | Epic 1 | 1.1–1.7 | Source-of-truth rule — keep-and-check what can be contradicted, delete what cannot |
| FR4a | Epic 1 | — (epic input) | Full-corpus assertion count recorded BEFORE the cut is frozen; 1.4 re-derives, never originates |
| FR4b | Epic 1 | 1.4–1.6 | Cut sized by assertion count, never by lines — measured, the two invert |

No FR is unmapped.

## Epic List

### Epic 1: Documentation Accuracy for the 4.0.2 Release

**Story ID prefix — `docs`.** Stories in this epic are identified **`docs-1-1` … `docs-1-7`**,
their files are `_bmad-output/implementation-artifacts/docs-1-N-<slug>.md`, and their
`sprint-status.yaml` keys are **`docs-epic-1`** plus `docs-1-N-<slug>`.

This is not decoration. `bmad-sprint-planning` keys an epic as `epic-{num}` by default, and
`sprint-status.yaml:154` **already carries `epic-1: done`** — while `SKILL.md:152` preserves the
more advanced status when a key already exists. Without this prefix all seven stories would land
under a key marked done on the day they were created, and 15 of the 24 files matching the skill's
`*epic*.md` glob declare `## Epic 1`, so the collision is not hypothetical.

The prefix follows the established `dist-` / `gen-` / `scan-` convention. It is declared here in
prose, deliberately: `bmad-create-story` sets `story_id = "{epic_num}.{story_num}"` and reads no
prefix field, so prose in the epic is the mechanism the prior epics actually used — there is no
frontmatter key to set, and inventing one would assert a policy no script implements.

A reader can follow any in-scope Convoke document and have the action succeed — the command
they type exists, the capability they expect has shipped, the diagram they follow routes where
its own contract table says it routes — and the release path can refuse a tag when that stops
being true.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9 *(all)*

**Why one epic and not four.** Every story targets the same component end-to-end —
`docs/` plus the single accumulating findings note — which is the file-overlap case the design
principles say to consolidate rather than split. Four epics cut by file cluster would each
modify the findings note and each re-establish the same derivation method, with no user-value
boundary between them: a reader does not experience "reference docs are accurate" as a separate
outcome from "the FAQ is accurate."

**The risk boundary, named rather than split.** Stories 1.1–1.3 remediate **known** findings;
Stories 1.4–1.6 are **discovery** whose yield is unknown, and a large yield in 1.4 would
legitimately change the scope of 1.5 and 1.6. That is normally an argument for an epic split.
It is handled instead by making **Story 1.4 the calibration point** — the documents where a
reader performs an action (57 of the corpus's 151 derived assertions), so a miss there costs
most. It records **findings per derived assertion** as an explicit output. If that rate applied
to 1.5's 66 and 1.6's 28 implies the remainder cannot finish before the tag, the decision is a
scope call by the operator at that moment — not a silent overrun.

**This cut replaced an earlier one, and the replacement is the epic's own best evidence for FR4b.**
The first cut was sized by line count and was inverted: it paired `references.md` (877 lines) with
`BMAD-METHOD-COMPATIBILITY.md` and called the result the overrun risk, while the cluster labelled
"low yield, cheap" was in fact larger. Measuring the corpus found `references.md` carries **2**
derived assertions against `UPDATE-GUIDE.md`'s **37** — a 60× density gap that no reasonable
pattern-set choice produces as noise. The story *count* did not change; the contents did. The epic
was mis-partitioned, not over-storied.

**Provisional on the pinned script.** The counts above come from a first-pass pattern set. The
coarse structure is safe at that gap; the fine ordering (1.5's 66 against 1.6's 28) is less so. If
the pinned script of FR4a materially disagrees, the cut is revisited **once** — not iteratively,
which is how this repository has previously spent five review rounds correcting its own corrections.

**Standalone.** The epic depends on nothing outside itself and blocks only the 4.0.2 tag.
Stories 1.1–1.6 each leave the tree green and shippable alone; Story 1.7 is the only ordering
constraint, and it lands last because a gate that refuses on an incomplete pass would block the
release it is meant to protect.

---

## Epic 1: Documentation Accuracy for the 4.0.2 Release

A reader can follow any in-scope Convoke document and have the action succeed — the command they
type exists, the capability they expect has shipped, the diagram they follow routes where its own
contract table says it routes — and the release path can refuse a tag when that stops being true.

**Applies to every story in this epic** (carried into each story's Definition of Done, per NFR3):

- `npm run docs:audit` exits 0. **This is a non-regression check and is never evidence of accuracy** — the epic exists because it passes on defective files.
- Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined* and the two must never be confusable.
- One commit plan per story, with a Round 1 review record (NFR4).

### Story 1.1: Correct the claims that make a reader act and fail

As a contributor following the development guide,
I want the commands and capabilities it names to actually exist,
So that I do not lose an afternoon to an invocation the package never shipped.

**Acceptance Criteria:**

**Given** `docs/development.md:75` instructs the reader to use `/bmad-team-factory`
**When** the invocation is re-derived from `scripts/update/lib/agent-registry.js` (`id` → `bmad-agent-bme-{id}`, line 219; `id: 'team-factory'`, line 230)
**Then** the guide names the invocation the installer actually produces
**And** the derivation is cited in the Dev Agent Record — not the finding ID alone, but the file and line the correction came from
**And** `grep -rn '/bmad-team-factory' docs/ *.md` returns **zero survivors** across the whole documentation surface. The line number in this criterion locates the defect; it does not scope the fix.

**Given** `docs/development.md:77` advertises three Team Factory capabilities — Create Team, Add Agent, Add Skill
**When** `_bmad/bme/_team-factory/workflows/` is enumerated
**Then** the guide names only capabilities that exist there
**And** the two unshipped capabilities are either omitted or explicitly marked unshipped — never left readable as available.

**Given** `docs/development.md:52` demonstrates `contextualization-expert/SKILL.md` while `:83` states the convention as `discovery-empathy-expert.md`, and both are true of different teams
**When** the convention is restated once
**Then** it covers both layouts explicitly — Vortex agents as `<agent-dir>/SKILL.md`, Gyre agents as flat `.md` — and the recipe at `:52` agrees with it
**And** every agent-file path form in the file is enumerated by grep and each one matches the stated convention. "No longer contradicts itself" is established by enumeration, never by reading.

**Definition of Done**

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and this story may not cite it as proof any document is correct. *(NFR3, verbatim)*
- [ ] Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- [ ] The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined*.
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies (`lint-passes-before-review`).
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5). "Verified by execution" without a named failing case does not satisfy this.
- [ ] Commit plan emitted with a Round 1 review record (NFR4, `commit-preparation`), and the reviewed file set equals the staged file set.

---

### Story 1.2: Make the Vortex diagram agree with its own contract table

As a reader navigating the Vortex,
I want the flow diagram to route each handoff to the agent its contract table names,
So that I do not follow a picture to the wrong agent.

**Acceptance Criteria:**

**Given** the diagram at `docs/agents.md:233-250` and the contract tables at `:264-289`
**When** a routing check parses each contract's endpoints from the tables and resolves where that contract's arrow terminates in the diagram
**Then** the check reports HC9 terminating in Noah's box while its table row names Isla
**And** the check is demonstrated **red against the current diagram before any fix is made** — a routing check first run against a corrected diagram proves nothing (NFR5).

**Given** the routing check is red on HC9
**When** the diagram is corrected
**Then** every contract's arrow terminates in the box its own table row names, and the routing check exits 0.

**Given** a geometry check that counts render columns treating any codepoint of east-asian width `W`/`F` or above `U+1F000` as two columns
**When** it is run over the diagram
**Then** all rows of a box row report equal render-column counts, and each box row opens and closes the same number of boxes
**And** the check is demonstrated red against the current diagram first, where line 243 measures 68 columns against line 246's 50.

**Given** both checks now pass
**When** the story is reviewed
**Then** the record states explicitly that **geometry passing is not evidence routing is correct** — an aligned diagram can still route a contract to the wrong agent, which is why FR2a requires two checks and not one.

**Given** the downward arrow at `docs/agents.md:249` labelled "to Isla" while Isla's box is at the top
**When** the diagram is corrected
**Then** exactly one rendering of that route survives, and it points at Isla.

**Given** that both checks are satisfiable by *removing* content — a two-box diagram with one arrow passes routing and geometry vacuously
**When** either check runs
**Then** a **completeness** assertion runs alongside them: every contract enumerated in the tables at `docs/agents.md:264-289` appears in the diagram, and every agent in the registry appears as a box
**And** the completeness assertion is demonstrated red against a deliberately truncated diagram before the story closes
**And** the counts come from the tables and the registry, never from a literal in the check (`derive-counts-from-source`) — so adding an eleventh contract makes the check fail rather than silently narrowing what it guards.

**Definition of Done**

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and this story may not cite it as proof any document is correct. *(NFR3, verbatim)*
- [ ] Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- [ ] The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined*.
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies (`lint-passes-before-review`).
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5). "Verified by execution" without a named failing case does not satisfy this.
- [ ] Commit plan emitted with a Round 1 review record (NFR4, `commit-preparation`), and the reviewed file set equals the staged file set.

---

### Story 1.3: Resolve the restatements by the source-of-truth rule

As a maintainer,
I want claims that nothing in the repository can contradict removed rather than refreshed,
So that the same findings do not return by 4.0.3.

**Acceptance Criteria:**

**Given** `docs/development.md:13` states "XML-based agent structure" for all agents, while Emma and Wade carry zero XML blocks and Isla carries two
**When** the claim is checked against the agent `SKILL.md` files, which are its source of truth
**Then** the claim is **qualified** to match the actual conversion state rather than deleted — a reader depends on it and something can contradict it.

**Given** the `(v1.1.0)` and `(v1.4.0+)` markers at `docs/development.md:9` and `:21` version a concept rather than the package
**When** the repository is searched for an object that owns either value
**Then** none is found, the markers are **deleted**, and the Dev Agent Record states what was searched.

**Given** "39 scenarios" and "18 critical scenarios minimum" at `docs/development.md:69-70` have no registry, config or suite that could contradict them
**When** the source-of-truth rule is applied
**Then** the arithmetic is **deleted** and the instruction it decorated is retained, pointing at the P0 gate as the authority
**And** no replacement number is introduced unless a source of truth for it is identified and cited.

**Given** the Project Structure tree at `docs/development.md:96-119` lists three of the eight directories under `_bmad/bme/`
**When** the tree is revised
**Then** it presents **shape rather than inventory** and no longer implies exhaustiveness
**And** it is neither deleted (a reader needs orientation) nor generated (FR3's tooling inventory cancels the generator)
**And** the revised tree stays true when a ninth directory is added — demonstrated by naming what would have to change, and showing that adding a directory is not on that list.

**Given** all four dispositions are applied
**When** the diff is reviewed
**Then** no correction has introduced a new claim that nothing can contradict — the failure mode this story exists to end.

**Definition of Done**

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and this story may not cite it as proof any document is correct. *(NFR3, verbatim)*
- [ ] Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- [ ] The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined*.
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies (`lint-passes-before-review`).
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5). "Verified by execution" without a named failing case does not satisfy this.
- [ ] Commit plan emitted with a Round 1 review record (NFR4, `commit-preparation`), and the reviewed file set equals the staged file set.

---

### Story 1.4: Calibrate the derivation pass on the user-path documents

As the operator deciding whether this epic fits before the tag,
I want a yield rate measured against something that actually predicts it,
So that the scope call on the remaining files is mine and is informed.

**Acceptance Criteria:**

**Given** `UPDATE-GUIDE.md` (37 derived assertions) and `docs/faq.md` (20)
**When** each file's **derived assertions** are counted before the audit begins — commands, counts, paths, version claims
**Then** the count is produced by a **single committed script with a pinned pattern set**, run identically across Stories 1.4, 1.5 and 1.6 — never by judgement, and never by a per-story grep
**And** the counts are recorded per file in the findings note, and its output is the story's worklist
**And** the script is demonstrated on a fixture containing a known assertion of each kind, so a pattern that matches nothing is visible before it is trusted.

**Given** the count both sizes the work and determines the projection that gates Stories 1.5 and 1.6
**When** the story is reviewed
**Then** the reviewer confirms the count came from that script and not from the implementer's reading — **an undercount makes this story smaller and every downstream story look cheaper**, so the measurement may not be authored by the party it sizes.

**Given** the worklist
**When** each assertion is checked against the file that determines it — conventions from `git log`, gates from `.github/workflows/`, thresholds from their config, rules from `project-context.md`
**Then** every finding enters the note with ID, line, claim, reality and a reproducing command, and every assertion that holds is marked checked rather than left silent.

**Given** the pass is complete
**When** the story closes
**Then** it records **findings per derived assertion** as an explicit output — not per line and not per week of file age.

**Given** that rate applied to the remaining assertion counts **already recorded as epic input** in the findings note — 66 and 28 — which are available before any story runs and are not outputs of a later story
**When** the projection implies the remaining work cannot complete before the tag
**Then** the story **raises an explicit scope call to the operator** and does not proceed silently
**And** a projection that fits is recorded just as explicitly, so the basis of the decision survives.

**Given** the three files are examined
**When** the coverage table is updated
**Then** each carries `Examined: yes` and a findings count, `0` written as `0`.

**Definition of Done**

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and this story may not cite it as proof any document is correct. *(NFR3, verbatim)*
- [ ] Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- [ ] The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined*.
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies (`lint-passes-before-review`).
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5). "Verified by execution" without a named failing case does not satisfy this.
- [ ] Commit plan emitted with a Round 1 review record (NFR4, `commit-preparation`), and the reviewed file set equals the staged file set.

---

### Story 1.5: Derivation pass on the upstream-relationship documents

As a reader deciding how Convoke sits alongside the BMAD Method,
I want its compatibility and sync claims to be true,
So that I do not plan an installation around a relationship that changed two releases ago.

**Acceptance Criteria:**

**Given** `docs/host-framework-sync-playbook.md` (36 assertions) and `docs/BMAD-METHOD-COMPATIBILITY.md` (30 assertions), paired because both describe the same subject — Convoke's relationship to upstream BMAD
**When** the pinned script re-derives their assertion counts
**Then** the counts are recorded and compared against the corpus count taken as epic input, and any material divergence is reported rather than absorbed
**And** a finding in one file is checked against the other before it is written up, since the two describe the same relationship from different angles and a claim true in one is usually load-bearing in both.

**Given** the worklist
**When** each assertion is checked against its determining source
**Then** every finding enters the note with a reproducing command, and every link target is resolved rather than assumed — `docs:audit` checks link shape, not whether the target says what the sentence claims it says.

**Given** a claim about npm, GitHub, the BMAD Method upstream, or any system outside this repository
**When** it is verified
**Then** it is executed, quoted verbatim from primary source with the source named, or explicitly marked unverified naming what would settle it — never asserted from recall (`external-claims-must-be-executed-or-hedged`).

**Given** the pass is complete
**When** the coverage table is updated
**Then** both files carry `Examined: yes` and a findings count.

**Definition of Done**

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and this story may not cite it as proof any document is correct. *(NFR3, verbatim)*
- [ ] Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- [ ] The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined*.
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies (`lint-passes-before-review`).
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5). "Verified by execution" without a named failing case does not satisfy this.
- [ ] Commit plan emitted with a Round 1 review record (NFR4, `commit-preparation`), and the reviewed file set equals the staged file set.

---

### Story 1.6: Derivation pass on the governance and positioning documents

As a reader arriving through the project's front matter,
I want its contact routes, attributions and positioning claims to be current,
So that a security report reaches someone and a credit names the right person.

**Acceptance Criteria:**

**Given** `docs/testing.md`, `SECURITY.md`, `CREDITS.md`, `CODE_OF_CONDUCT.md`, `docs/what-convoke-brings-to-bmad-method.md`, and the two repository-facing assertions inside `docs/references.md`
**When** the pinned script re-derives the assertion counts
**Then** the counts are recorded using the same committed script Story 1.4 pins, and effort follows the count rather than the file list
**And** every file — including one scoring zero — has each of its counted assertions individually marked checked or reported as a finding. A file may be *quick*; it may not be *skipped*, and a zero-assertion file is recorded as `0` with the script output as its evidence.

**Given** a contact address, reporting route, external handle or account identifier in any of these files
**When** it is verified
**Then** it is checked against external truth rather than accepted as plausible — a display name is not an account handle, and a validator's "typo fix" is not evidence (`feedback_verify_external_identifiers`).

**Given** positioning claims in `what-convoke-brings-to-bmad-method.md` about what Convoke owns
**When** they are checked
**Then** they are consistent with Convoke owning only `_bmad/bme/` — WDS is a parallel BMAD extension and not a Convoke module, and any sentence conflating them is a finding.

**Given** the pass is complete
**When** the coverage table is updated
**Then** all five files carry `Examined: yes` and a findings count.

**Definition of Done**

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and this story may not cite it as proof any document is correct. *(NFR3, verbatim)*
- [ ] Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- [ ] The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined*.
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies (`lint-passes-before-review`).
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5). "Verified by execution" without a named failing case does not satisfy this.
- [ ] Commit plan emitted with a Round 1 review record (NFR4, `commit-preparation`), and the reviewed file set equals the staged file set.

---

### Story 1.7: Wire the gate and file what this epic will not fix

As the operator tagging 4.0.2,
I want the release to stop if the derivation pass did not cover what it claimed to cover,
So that a dropped story cannot pass as a completed pass.

**Acceptance Criteria:**

**Given** the findings note's coverage table
**When** a check reads it and compares the in-scope set — derived from the filesystem minus a declared exclusion list — against the examined set
**Then** it exits non-zero on any file that is in scope and not examined, naming the file and the story that owns it.

**Given** that check
**When** it is demonstrated against a known-bad input — one in-scope row flipped to `Examined: no`
**Then** it exits non-zero and names that file
**And** the demonstration is recorded in the commit Description, per NFR5. **A gate that has never refused anything is not evidence**, and `cli-guidance-check` shipped twice matching nothing because this step was skipped.

**Given** a new document added under `docs/` and not listed in the exclusion list
**When** the check runs
**Then** that document appears in the in-scope set and reports unexamined without anyone having added a row by hand — the denominator is derived, not maintained
**And** this is **demonstrated by adding a scratch document and running the check**, to the same evidentiary standard as the flipped-row demonstration above. Asserting it is not satisfying it.

**Given** the step is added to `docs/pre-tag-release-checklist.md`
**When** its text is written
**Then** it states that it asserts **a derivation pass was recorded over the full in-scope set**, and states explicitly that it does **not** assert the documentation is correct
**And** it introduces no job count, per that file's own §3 note on counts rotting into false halts
**And** the existing seven sections keep their numbers, since `dist-epic-2` runbooks reference them.

**Given** the five vision, draft and dated-snapshot documents sitting unlabelled in `docs/`, and the bibliography link-integrity question `docs/references.md` raises
**When** the epic closes
**Then** **two** backlog rows are filed — not fixed here: one for relocating or labelling the draft documents, one for resolving `references.md`'s 64 external URLs and confirming its "underpins component X" mappings still name components that exist
**And** the bibliography row records *why* it is not release-gate work: a derivation-against-source pass is the wrong instrument for a document whose claims are about academic literature, and executing 64 external checks under `external-claims-must-be-executed-or-hedged` is a different cadence
**And** each row is inserted at its sorted position with the composite score computed first, and `node scripts/audit/backlog-integrity.js` exits 0 before the commit plan is emitted
**And** the backlog working tree is confirmed clean before the IDs are allocated.

**Given** every in-scope file is examined
**When** the gate runs against the real coverage table
**Then** it exits 0, and that is the last story to land in the epic.

**Definition of Done**

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the epic exists because it passes on defective files, and this story may not cite it as proof any document is correct. *(NFR3, verbatim)*
- [ ] Every finding recorded carries a command that reproduces it (NFR1), derived from an artifact the operator receives — never `.claude/skills/`, which is gitignored (NFR8).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a): keep-and-check what something can contradict, delete what nothing can.
- [ ] The findings note's coverage table is updated in the same commit (FR10). `0` findings is written as `0`; blank means *not examined*.
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies (`lint-passes-before-review`).
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5). "Verified by execution" without a named failing case does not satisfy this.
- [ ] Commit plan emitted with a Round 1 review record (NFR4, `commit-preparation`), and the reviewed file set equals the staged file set.
