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
> several times smaller than the suite actually runs — derive both sides with `npm test` — and both
> lines return `counted=[] residual=[]`, invisible to the patterns *and* to the residual alarm. Statistics, dates, unbackticked paths, agent names and
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
> executable locally *"was correct on the first attempt"*, while *"every claim about npm's behaviour was
> wrong, unverifiable, or still open"*. The rule's measured case is npm specifically — this story extends
> the discipline to upstream BMAD and GitHub by analogy, not by citation.
>
> **No count is stated as a target.** The epic's inputs were taken before the script existed and the
> instrument has changed twice since, so any figure quoted here is a citation to verify — never something
> to reproduce or tune toward. Where a command settles a question, the command is given and its output is
> deliberately left out.

**AC1 — re-derive, report the divergence, and do not absorb it.**

**Given** the epic records this pair's assertion load as an input taken before the pinned script existed
**When** the counts are re-derived with `node scripts/audit/derived-assertions.js docs/host-framework-sync-playbook.md docs/BMAD-METHOD-COMPATIBILITY.md`
**Then** the output is recorded with its command, and the divergence from the epic's input figure is reported **as a finding about the input**, with both sides visible
**And** the report names the decidable contributor: `T160` closed the two-part-version class, and the playbook's version count before that closure is **already recorded** — the breakdown table in `_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md` carries a Versions column for this file. Read it there rather than reconstructing it. *(An earlier draft of this AC said the before-state was "not recoverable any other way" and sent you to `git show <commit>^:…derived-assertions.js`. Both were wrong: the figure is recorded, and that command does **not** run — the old script has relative requires and exits `Cannot find module './lib/shipped-links'`. If you do need to execute a historical version, `git worktree add --detach` a temporary tree so its sibling libraries resolve.)*
**And** the counts are recorded as **floors**, because the script says so in its own output and `T160` enumerates the classes it misses
**And** you check the findings note's "Story 1.4 output" table first — **1.4 already re-derived this story's load with the same command**, so a fresh finding about the divergence would be a duplicate. What this story owes is the *coverage table* update: its `Assertions` column still carries the pre-script input for both of these rows, which is what makes it disagree with the projection table
**And** if the re-derived load materially invalidates Story 1.4's projection, that is **raised to the operator as a scope call** per 1.4's AC5 — the projection is what gates 1.5 and 1.6, and absorbing a change to it silently is the failure 1.4's AC5 exists to prevent.

**AC2 — the pass is not complete when the script's list is complete.**

**Given** that this pair's most consequential defects are invisible to the counter
**When** the worklist is built
**Then** the script's output is treated as a floor, and **each missing class below is swept by its own enumerating command** — a class swept "by reading" is an attestation nobody can check, so the command is the requirement:

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

**And** every link and anchor target in both files is **resolved by command**, and each is checked for whether the target *says what the citing sentence claims* — the epic is explicit that `docs:audit` checks link shape, not content, so a resolving link is not a verified one. The playbook's section anchors are the cases where the second half bites
**And** before any finding is written up, the same claim is searched for in the sibling file — the epic pairs these documents because a claim true in one is usually load-bearing in both
**And** the Dev Agent Record states, per class, whether it was swept and what it found — **`0` written as `0`**, because a silent class is indistinguishable from an unexamined one.

**AC3 — external claims: executed, quoted, or hedged — and hedging is the last resort, not the first.**

**Given** every claim about upstream BMAD, npm, or GitHub
**When** it is verified
**Then** it is **executed** against the basis actually used, **quoted verbatim from primary source with the source named**, or **explicitly marked unverified naming what would settle it** — never asserted from recall
**And** — **this is the part the rule's usual framing hides** — two facts make "unverified" rarely the honest answer here:

- **An upstream copy is present locally — but it is NOT the product's coupling.** `_bmad/core`, `_bmad/bmm` and `_bmad/bmb` carry a version in their `config.yaml` headers, so many "upstream" claims are checkable without the network. ⚠ **Do not treat that version as authoritative for what Convoke supports**: those directories appear in `package.json` `files[]` **zero** times — check with `node -e "console.log(require('./package.json').files.filter(f=>/_bmad\/(core|bmm|bmb)/.test(f)))"` — so they are a maintainer's local install, not something an operator receives.
- **The registry is reachable.** `npm view bmad-method version` returns. So an upstream-version claim is *executable*, not merely hedgeable.

**And** a claim that remains unverifiable names the command that would settle it and why it could not be run — never a bare "unverified".

**AC4 — the pair's defining contradiction is ONE finding, resolved across both files together.**

**Given** the epic pairs these files because they describe the same relationship from different angles
**When** the upstream-version claims are worked
**Then** they are resolved as a single finding, not two, because these documents and the code disagree about the same relationship. Enumerate every basis before writing anything — there are more than the two documents:

| Basis | What it is |
|---|---|
| the compatibility document's matrix | asserts a **1.x** relationship throughout, and a "Current Version" the package no longer is |
| the playbook | describes a **v6.3** coupling re-syncing at later versions |
| **`scripts/update/lib/compat-preflight.js`** | **`REQUIRED_BMAD_VERSION` — what the shipped package actually enforces.** This is the authority for "what Convoke supports" |
| `_bmad/_config/manifest.yaml` and `_bmad/{core,bmm,bmb}/config.yaml` | the local install's version — **not shipped**, see AC3 |
| the registry | what upstream serves today — `npm view bmad-method version` |

⚠ **The trap this AC exists to prevent:** writing the *local install's* version into the compatibility document. That would contradict what the preflight enforces and add a seventh wrong number. The gap between the enforced version and the local one is **already an open backlog row (`T73`)** — this story does not close it, and must not silently pick a side.

**And** the in-repo basis is named before anything is rewritten — `docs/adr/adr-bmad-coupling-v4.0.md` records the coupling this package shipped, and `compat-preflight.js` is what enforces it
**And** *"the playbook is load-bearing for the compatibility document"* is reconnaissance's **judgement, not a fact** — neither file references the other in either direction. Treat it as a starting hypothesis you may overturn
**And** the compatibility matrix is checked for rows that never existed: at least one version appears there with **no CHANGELOG entry and no git tag** — enumerate the matrix column against `CHANGELOG.md` headings and `git tag --list`, and note that `grep -c` **exits 1 when it counts zero**, so a naive pipeline under `set -e` aborts on exactly the rows you are looking for. Enumerate the whole column by command rather than spot-checking — hand-written instance lists have repeatedly come up short in this epic, including one written in the commit that corrected the previous short list.

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
| the registry-submission file named in the marketplace workstream, described in the present tense | `find . -name 'convoke.yaml' -not -path './node_modules/*'` — reconnaissance found only a never-submitted artifact |
| the backlog ID cited as the live record of the hand-publish incident | that row is in §2.5 Absorbed/Archived, i.e. **closed**, with its residual absorbed elsewhere — `grep -n '^| T35 ' _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` |
| the pre-mortem finding ID cited as the anti-vapor anchor | reconnaissance places the anti-vapor point at a **different** PM number than the one cited; read both in `convoke-prd-bmad-v6.3-adoption/` before editing |
| the quoted phrase used to characterise the release process | traces to a source about the **product**, not the release process; `grep -rn "content, not software" --include='*.md' .` |
| three `cat` commands naming agent files that no longer exist | deferred here by `docs-1-1`; the real layout is a directory per agent — `ls -d _bmad/bme/_vortex/agents/*/` |

**And** the `≥2 boxes` / `one or more` threshold conflict in the trigger checklist is **raised for an operator ruling, not resolved unilaterally** — it changes when a release class applies.

**AC6 — the audit-scope gap is decided and recorded.**

**Given** `docs/host-framework-sync-playbook.md` is not in `USER_FACING_DOCS`, so no gate has ever read it
**When** this story closes
**Then** the gap is **decided**: either the file is added to that list (and the story reports what `docs:audit` then says about it), or the reason it stays out is recorded
**And** whichever way it goes, the DoD's `docs:audit` line is annotated for this story to say that it was vacuous for one of the two files — an unqualified "exits 0" would otherwise read as coverage that never existed
**And** if the file **is** added, the compatibility document's own claim about how many user-facing files the audit covers must be re-derived **in the same commit** — adding one to `USER_FACING_DOCS` falsifies it, it is on the counter's worklist as a count assertion, and no check would catch it
**And** before deciding, run the three checks against the playbook directly (`checkStaleReferences`, `checkBrokenPaths`, `checkBrokenLinks` are all exported from `scripts/docs-audit.js`) so the decision is made knowing whether adding it would turn the gate red.

**AC7 — structural hazards that will produce wrong numbers if walked naively.**

**Given** both files contain structures the counter mis-reads
**When** the pass runs
**Then** these are treated as recorded, not rediscovered:

- The **directory tree** in the compatibility document is **one structural assertion** — *does the shipped tree look like this?* — not one per branch label. the findings note's missing-class table records the figures for that block — paths suppressed while the same block's counts are kept. ⚠ **Post-`T160` those paths are no longer suppressed; they surface in the residual.** So AC2's "sweep the residual" and this bullet cover the same tokens: dispose of them as **one** structural assertion and say so, rather than filing them individually. Reconnaissance found it shows **half** the modules that actually install — derive both sides with `shippedBmeModules(require('./package.json').files)` from that library, which takes the `files[]` array and **not** a path (handed a path it returns an empty array with no error, which reads as "nothing missing"); `scripts/audit/lib/installed-tree.js` derives the real set, so the correct content is obtainable rather than hand-listed.
- **Globs and templates are not paths.** A `pf1-*` glob and a `v4.x` filename *pattern* are both counted as paths and **must not be resolved as files**.
- **Do not "fix" the playbook's frontmatter.** Its `outline_complete: false` was ruled a deliberate non-finding in the document's own sign-off.
- **Do not re-litigate the Team Factory extension sentence** in the compatibility document — `docs-1-1` already corrected it. But that story deferred **more** than the install-tree annotations here: its review also routed **D3's class — literal copy-paste `cat` commands naming agent files that no longer exist** — to this story, explicitly "so Story 1.5 does not have to rediscover it". Those are in AC5's table; work them.
- **Do not transcribe the playbook's fenced shell block into any artifact.** It contains a `$(…)` with a quoted glob; this epic lost two drafts of one story to three separate escaping bugs in transcribed commands. Cite it by location.

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
  - [ ] **AC8 sweep** — for every retained claim in the diff, name the object that could contradict it; for every deletion, show that nothing owned it, using `git log --diff-filter=D -M --follow -- <path>`. **The `-M` is not optional**: without it a rename reports as a deletion, which is exactly how `docs-1-4` produced a false finding and deleted a live document's sentence
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
- **An instrument's own guarantee needs testing.** `T160`'s residual alarm shipped with a superset claim that
  review found false. Do not assume the residual is complete — `T160` lists what it cannot see.

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
`tests/unit/docs-audit.test.js` asserts a handful of inclusions and exclusions for `USER_FACING_DOCS` — it does **not** pin the list, so adding an entry passes the suite unchanged. Do not read it as existing coverage; add the assertion.

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

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the
      epic exists because it passes on defective files, **and this story may not cite it as proof any document
      is correct** *(NFR3, verbatim)* — **and annotated per AC6**, because it has never examined one of this
      story's two files. *(`docs-1-4` carried a compressed version of this line under the same `verbatim`
      tag; the prohibition clause was the part it dropped.)*
- [ ] Every finding carries a reproducing command (NFR1) from an artifact the operator receives — never
      `.claude/skills/` (NFR8).
- [ ] Every external claim is executed, quoted verbatim with its source named, or marked unverified
      naming what would settle it (AC3).
- [ ] Every missing class in AC2's table is swept and reported, `0` written as `0`.
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a).
- [ ] The findings note's coverage table is updated **in the same commit** (FR10), carrying both files with
      `Examined: yes` and a findings count. **`0` findings is written as `0`; blank means *not examined*** —
      Story 1.7's gate reads that column, so a blank left where a `0` belongs reads as unexamined work.
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
