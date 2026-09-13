# Story 1.5: Derivation pass on the upstream-relationship documents

Status: ready-for-dev

## Story

As a reader deciding how Convoke sits alongside the BMAD Method,
I want its compatibility and sync claims to be true,
so that I do not plan an installation around a relationship that changed two releases ago.

## Acceptance Criteria

> ## Read this before AC1 — three things make this story unlike 1.4
>
> **1. The counter is NOT the worklist here.** Story 1.4's AC3 said *"the script's output is the
> worklist"* and that worked, because that file's defects lived in classes the counter sees. **These two
> files do not.** `docs/BMAD-METHOD-COMPATIBILITY.md:277` and `:357` each assert a test count that is
> wrong by an order of magnitude, and both lines return `counted=[] residual=[]` — invisible to the
> patterns *and* to the residual alarm. Statistics, dates, unbackticked paths, agent names and
> requirement IDs are all missing classes. **An implementer who works the script's list and stops will
> close the least important half of this pair and report it complete.**
>
> **2. One of the two files has never been audited at all.** `docs/host-framework-sync-playbook.md` is
> **not in `USER_FACING_DOCS`**, so `npm run docs:audit` has never examined it and never can as
> configured. The DoD line "docs:audit exits 0" is **vacuous for that file** — not merely weak, as NFR3
> already warns, but inapplicable. AC6 makes you decide what to do about that.
>
> **3. This is the story where `external-claims-must-be-executed-or-hedged` actually bites.** Both files
> describe a framework that is not this repository. That rule's own evidence is blunt: everything
> executable locally was right first time; every unexecuted external claim was *"wrong, unverifiable, or
> still open."*
>
> **No counts are stated in these ACs on purpose.** The epic's `36` and `30` were taken before the script
> existed, and the instrument has changed twice since. Named defects below are citations to verify, not
> figures to reproduce.

**AC1 — re-derive, report the divergence, and do not absorb it.**

**Given** the epic records this pair's assertion load as an input taken before the pinned script existed
**When** the counts are re-derived with `node scripts/audit/derived-assertions.js docs/host-framework-sync-playbook.md docs/BMAD-METHOD-COMPATIBILITY.md`
**Then** the output is recorded with its command, and the divergence from the epic's input figure is reported **as a finding about the input**, with both sides visible
**And** the report names the decidable contributor: `T160` closed the two-part-version class, which took the playbook from **zero** version assertions — for a document whose entire subject is version alignment — to a non-zero number. Re-derive the before-state with `git show <commit>^:scripts/audit/derived-assertions.js`; it is not recoverable any other way
**And** the counts are recorded as **floors**, because the script says so in its own output and `T160` enumerates the classes it misses.

**AC2 — the pass is not complete when the script's list is complete.**

**Given** that this pair's most consequential defects are invisible to the counter
**When** the worklist is built
**Then** it is built from **reading both files**, with the script's output as a floor and a starting point — never as the census
**And** each of these known-missing classes is swept explicitly, because the counter cannot raise them:

| Missing class | Where it bites in this pair |
|---|---|
| **Statistics and percentages** | test totals, assertion counts, coverage figures |
| **Dates** | `Last Updated:` and any dated claim |
| **Unbackticked paths in prose** | a filename inside ordinary prose is not a candidate |
| **Agent and team names** | rosters spelled out as names, checkable against `scripts/update/lib/agent-registry.js` |
| **Requirement identifiers** | `FR*`, `NFR*`, `M*`, `PM*`, `AP-*`, `I*`, `T*` — the largest missing class in the playbook |
| **CI job names** | bare identifiers in table cells |
| **Word-form counts** | `eight jobs` — a written-out number with an off-list noun reaches no candidate position |
| **Behavioural prose** | "runs in CI on every push", "works standalone" — no token at all |

**And** the Dev Agent Record states, per class, whether it was swept and what it found — **`0` written as `0`**, because a silent class is indistinguishable from an unexamined one.

**AC3 — external claims: executed, quoted, or hedged — and hedging is the last resort, not the first.**

**Given** every claim about upstream BMAD, npm, or GitHub
**When** it is verified
**Then** it is **executed** against the basis actually used, **quoted verbatim from primary source with the source named**, or **explicitly marked unverified naming what would settle it** — never asserted from recall
**And** — **this is the part the rule's usual framing hides** — two facts make "unverified" rarely the honest answer here:

- **Upstream BMAD is vendored in this tree.** `_bmad/core`, `_bmad/bmm` and `_bmad/bmb` carry a version in their `config.yaml` headers. Many "upstream" claims are locally checkable against it. Derive with `grep -rn 'Version:' _bmad/core/config.yaml _bmad/bmm/config.yaml _bmad/bmb/config.yaml`.
- **The registry is reachable.** `npm view bmad-method version` returns. So an upstream-version claim is *executable*, not merely hedgeable.

**And** a claim that remains unverifiable names the command that would settle it and why it could not be run — never a bare "unverified".

**AC4 — the pair's defining contradiction is ONE finding, resolved across both files together.**

**Given** the epic pairs these files because they describe the same relationship from different angles
**When** the upstream-version claims are worked
**Then** they are resolved as a single finding, not two, because the two files currently assert **incompatible** relationships to the same framework:

- `docs/BMAD-METHOD-COMPATIBILITY.md` asserts compatibility with **BMAD Method v1.x** across its matrix, and states a current Convoke version that the package no longer is.
- `docs/host-framework-sync-playbook.md` describes a **v6.3** coupling re-syncing at v6.4 and v7.0.
- The vendored tree and the live registry each report something different again.

**And** the in-repo basis is named before anything is rewritten — `docs/adr/adr-bmad-coupling-v4.0.md` records the coupling this package actually shipped, and the playbook is load-bearing for the compatibility document rather than the reverse
**And** the compatibility matrix is checked for rows that never existed: at least one version appears there with **no CHANGELOG entry and no git tag** (`grep -c '^## \[1\.6\.4\]' CHANGELOG.md` and `git tag | grep -c '^v1\.6\.4$'` both return `0`). Enumerate the whole column by command rather than spot-checking — every prior story in this epic that listed instances by hand listed them short.

**AC5 — capability and status overclaims, which this pair is unusually prone to.**

**Given** the playbook itself lists `AP-7` — overpromising by referencing unbuilt machinery
**When** its own claims are checked against the repository
**Then** each of the following is verified by execution and corrected or hedged, because reconnaissance found them wrong and the file has not been touched since `4.0.0`:

| Claim to check | How it falls |
|---|---|
| "All of them run in CI on every push" | at least one named gate appears nowhere in `.github/`, and the same document contradicts this ~45 lines later |
| the marketplace workstream's "maintain Convoke's presence" | the submission PR was **closed/rejected**; the repo's own epics call it "the rejected PR #9" |
| the trigger criterion's "BMAD upstream **major**-version release … (e.g., v6.4)" | `v6.3 → v6.4` is a **minor** bump; the criterion is a semver category error, settleable by logic alone |
| `validate-marketplace` "reports schema drift vs upstream `registry/registry-schema.yaml`" | run it and read its checks; nothing in this repo reads that schema |
| a registry-submission file described in the present tense | resolve the path |
| a backlog ID cited as the live record of an incident | check whether that row is still open |
| two citation targets — a pre-mortem finding ID, and a quoted phrase | both reconnaissance-flagged as pointing at the wrong source; confirm before editing |

**And** the `≥2 boxes` / `one or more` threshold conflict in the trigger checklist is **raised for an operator ruling, not resolved unilaterally** — it changes when a release class applies.

**AC6 — the audit-scope gap is decided and recorded.**

**Given** `docs/host-framework-sync-playbook.md` is not in `USER_FACING_DOCS`, so no gate has ever read it
**When** this story closes
**Then** the gap is **decided**: either the file is added to that list (and the story reports what `docs:audit` then says about it), or the reason it stays out is recorded
**And** whichever way it goes, the DoD's `docs:audit` line is annotated for this story to say that it was vacuous for one of the two files — an unqualified "exits 0" would otherwise read as coverage that never existed.

**AC7 — structural hazards that will produce wrong numbers if walked naively.**

**Given** both files contain structures the counter mis-reads
**When** the pass runs
**Then** these are treated as recorded, not rediscovered:

- The **directory tree** in the compatibility document is **one structural assertion** — *does the shipped tree look like this?* — not one per branch label. `T160` records that the counter suppresses its paths while keeping its counts. Reconnaissance found it shows a minority of the modules that actually install; `scripts/audit/lib/installed-tree.js` derives the real set, so the correct content is obtainable rather than hand-listed.
- **Globs and templates are not paths.** A `pf1-*` glob and a `v4.x` filename *pattern* are both counted as paths and **must not be resolved as files**.
- **Do not "fix" the playbook's frontmatter.** Its `outline_complete: false` was ruled a deliberate non-finding in the document's own sign-off.
- **Do not re-litigate the Team Factory extension sentence** in the compatibility document — `docs-1-1` already corrected it, and that commit assigned only the install-tree annotations to this story.
- **Do not transcribe the playbook's fenced shell block into any artifact.** It contains a `$(…)` with a quoted glob; this epic has lost three separate rounds to escaping bugs in transcribed commands. Cite it by location.

**AC8 — no correction introduces a claim nothing can contradict.**

**Given** every edit this story makes
**When** the diff is reviewed
**Then** each retained claim names the object that could contradict it; no new count, version marker or inventory is introduced that no object owns; and no **owned** claim is deleted while removing unowned ones (FR3a, and `docs-1-4`'s `D14`, where a file reported "deleted" had been **renamed** and the remedy deleted a live document's sentence).

## Tasks / Subtasks

> **Read both files end to end before running anything.** AC2 exists because the script's output is not
> the worklist here, and the fastest way to inherit that mistake is to start from `--json`.

- [ ] **Task 1 — Establish the ground truth for the upstream relationship (AC: 3, 4)**
  - [ ] Derive the vendored upstream version from `_bmad/*/config.yaml`; derive the live one from npm; read `docs/adr/adr-bmad-coupling-v4.0.md` for the coupling this package shipped
  - [ ] Record all three with their commands **before** touching either document — every later edit depends on which is authoritative
- [ ] **Task 2 — Re-derive and report the divergence (AC: 1)**
  - [ ] Run the counter over both files; paste output with its command; compare to the epic's input figure
  - [ ] **Do not tune anything toward the epic's number.** Report the divergence as a finding about the input
- [ ] **Task 3 — Build the worklist by READING (AC: 2)**
  - [ ] Sweep each missing class in AC2's table explicitly; record per-class findings, `0` as `0`
- [ ] **Task 4 — Work the cross-file contradiction as one finding (AC: 4)**
  - [ ] Resolve the version relationship across both files together; enumerate the matrix column by command
- [ ] **Task 5 — Capability and status overclaims (AC: 5)**
  - [ ] Verify each row of AC5's table by execution; correct or hedge; raise the threshold conflict for a ruling
- [ ] **Task 6 — Decide the audit-scope gap (AC: 6)**
- [ ] **Task 7 — Findings note and coverage table (AC: 1, DoD)**
  - [ ] Both files `Examined: yes` with counts, `0` written as `0`. **Your own rows only** — the note's freeze banner permits exactly that
- [ ] **Task 8 — Verify and hand off**
  - [ ] `npm run lint` → 0 · `npm test` → 0 · `node scripts/audit/backlog-integrity.js` → 0 · `npm run docs:audit` → 0 **and annotated per AC6**
  - [ ] Capture each exit code **without a pipe** — `${PIPESTATUS[0]}` is bash, this shell is zsh (`verification-pipefail`)
  - [ ] Commit plan with a Round 1 review record; `git diff HEAD --name-only` before staging

## Dev Notes

### What `docs-1-4` learned that this story inherits

- **A fixture demonstration proves a pattern fires, never that it fires completely.** 1.4's self-check
  passed while four patterns were materially broken; reading the *matches* exposed them. Read output,
  not totals.
- **Hand-derivation is only as independent as its assumptions.** 1.4's windows matched exactly and still
  missed an undercount, because the same person wrote the patterns and the hand pass. If you hand-derive
  a window here, pick one whose classes you have *not* just read about.
- **`git log --diff-filter=D` without `-M` reports a rename as a deletion.** That produced a false
  finding in 1.4 and deleted a live document's sentence. Always `-M --follow`.
- **Never pre-compute a derived value into an artifact whose reader re-derives it.** Three rounds in this
  epic died on this. Cite the command.
- **An instrument's own guarantee needs testing.** `T160`'s residual alarm shipped with a false superset
  claim twice. Do not assume the residual is complete — `T160` lists what it cannot see.

### The counter's state, as of this story

It reports a **FLOOR** and says so in its own output, with a non-zero residual meaning *known gap, not
clean run*. `T160` (Fast Lane) owns the open classes and carries the current list. Read that row before
deciding whether a class is missing or merely unfound — it is the difference between a finding and a
duplicate.

### Files being modified

- **`docs/host-framework-sync-playbook.md`** and **`docs/BMAD-METHOD-COMPATIBILITY.md`** — this story's
  pass. Neither has had one. The playbook has not been touched since `4.0.0` shipped.
- **`convoke-note-docs-accuracy-findings-4-0-2.md`** — Task 7, under the freeze banner's carve-out.
- **`scripts/docs-audit.js`** — only if AC6 is decided as "add the playbook to `USER_FACING_DOCS`".

**Do not touch** `README.md`, `docs/testing.md`, `SECURITY.md`, `docs/references.md`,
`docs/what-convoke-brings-to-bmad-method.md`, `CREDITS.md`, `CODE_OF_CONDUCT.md` — all Story 1.6.

### Reconnaissance already done — verify, do not re-discover

Two read-only research passes enumerated both files before this story was written. Their confirmed
defects are cited in AC4 and AC5 **as claims to verify**, not as findings to copy: each was proven with a
command at authoring time, and any of them may have moved since. The classes in AC2's table are the
counter's, taken from `T160`.

Findings deliberately **not** carried into the ACs, because they need a ruling rather than an edit: the
trigger-threshold conflict (AC5), and whether the compatibility document's "Update Strategy" section
should be repaired or replaced by a pointer to the playbook — reconnaissance judged it a second, weaker
copy of a governed process, which is a scope call, not a correction.

### Testing standards

This story ships no `.js` unless AC6 is decided as "add the file to `USER_FACING_DOCS`". If it does,
`lint-passes-before-review` is real, and the change needs a test that would fail if the list regressed —
`tests/unit/docs-audit.test.js` already pins `USER_FACING_DOCS` contents.

### References

- [Source: convoke-epic-docs-accuracy-4-0-2.md#Story-1.5] — ACs and DoD
- [Source: convoke-note-docs-accuracy-findings-4-0-2.md] — coverage table, freeze banner, the counter's
  missing-class table
- [Source: backlog `T160`] — the counter's open classes; read before filing a "missing class" finding
- [Source: `docs/adr/adr-bmad-coupling-v4.0.md`] — the coupling this package shipped; AC4's in-repo basis
- [Source: project-context.md] — `external-claims-must-be-executed-or-hedged`, `verification-pipefail`,
  `documentation-claims-must-be-derived`, `verification-must-be-falsifiable`, `code-review-convergence`,
  `commit-preparation`

## Definition of Done

- [ ] `npm run docs:audit` exits 0. **Non-regression only, not evidence of accuracy** *(NFR3, verbatim)* —
      **and annotated per AC6**, because it has never examined one of this story's two files.
- [ ] Every finding carries a reproducing command (NFR1) from an artifact the operator receives — never
      `.claude/skills/` (NFR8).
- [ ] Every external claim is executed, quoted verbatim with its source named, or marked unverified
      naming what would settle it (AC3).
- [ ] Every missing class in AC2's table is swept and reported, `0` written as `0`.
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a).
- [ ] The coverage table carries both files with `Examined: yes` and a findings count (FR10).
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies.
- [ ] `npm test` green.
- [ ] Commit plan emitted with a Round 1 review record (NFR4); reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-09-13 | **Story created.** Authored after two read-only reconnaissance passes over both files. Three findings shaped the ACs rather than the epic's text: (1) **the counter is not the worklist here** — this pair's worst defects, including two order-of-magnitude-wrong test counts, return `counted=[] residual=[]`, which inverts 1.4's central mechanic and is why AC2 exists; (2) **`docs/host-framework-sync-playbook.md` is not in `USER_FACING_DOCS`**, so the DoD's `docs:audit` line is vacuous for it — AC6 forces that to be decided rather than inherited; (3) **upstream BMAD is vendored in this tree and npm is reachable**, so AC3 says plainly that "unverified" is the last resort, not the first — the rule's own evidence is that unexecuted external claims were the ones that went wrong. AC4 makes the pair's defining contradiction a single finding: the two documents assert incompatible relationships to the same framework, and the tree and registry each report a third and fourth answer. No counts appear in any AC; the epic's input figures predate the script and the instrument has changed twice since. |
