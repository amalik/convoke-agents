---
baseline_commit: 716dce4cd285f443120318cbd0e409ab5582ddcf
---

# Story 2.3b: Move the Covenant into source-owned space

Status: review

<!-- baseline_commit is stamped in the frontmatter above by dev-story at implementation start. -->

> **Split from Story 2.3 on 2026-08-31.** Class 2 of
> [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md), whose operator decision
> named the destination. Siblings: `dist-2-3a` (Class 1), `dist-2-3c` (Class 3 + wiring).
>
> **⚠️ This story gets more expensive every day it waits.** The reference count was **47** when
> ADR-002 was accepted (2026-08-20), **53** on 2026-08-30, **54** on 2026-08-31 — roughly one per
> day, because ordinary planning work keeps citing the Covenant. Sequence it early.

## Story

As a **Convoke operator**,
I want the required reading my install tells me to read to be in my install,
so that **"normative required reading" is not a link into a directory I never received**.

### What this story is, in one line

Move the Covenant and its Compliance Checklist out of generated-artifact space into
`_bmad/bme/covenant/`, ship that directory, and rewrite every reference — **asserting** rather than
assuming that BUG-13's rename-map collision does not fire.

---

## Acceptance Criteria

**AC1 — The move, to the destination ADR-002 confirmed**

**Given** the Covenant and the Compliance Checklist are normative required reading
(`project-context.md:5`) living in `_bmad-output/planning-artifacts/`, which does not ship
**When** this story completes
**Then** they are at `_bmad/bme/covenant/covenant-operator.md` and
`_bmad/bme/covenant/compliance-checklist.md`
**And** `_bmad/bme/covenant/` is added to `files[]` — one new allowlist entry, consistent with the
`_bmad/bme/*` module entries already there
**And** the move uses `git mv` so history follows the files

**AC2 — Every reference is rewritten, from a count derived at implementation time**

**Given** `grep -rl 'convoke-covenant-operator\|convoke-spec-covenant-compliance-checklist'` returns
**54** files today, against ADR-002's recorded 47
**When** this story completes
**Then** every referencing file is updated, from a grep **re-run at implementation time** — do not
trust 54 either
**And** the four non-prose references are handled explicitly, each failing differently if missed:

| File | Why it matters |
|---|---|
| `_bmad/_config/taxonomy.yaml:56` | Names the Covenant *by filename* in the `covenant` artifact-type definition. Governance config, not prose |
| `scripts/audit/reference-integrity.js` | The check that would report the move's own breakage |
| `scripts/migration/format-conversion/covenant-survival-harness.js` | **Update it** — settled by ADR-002 Amendment 2(3). Its refs at `:42-43` are comment citations, not resolved paths, so nothing breaks at runtime; but I97 Epic 2 is 2/7 done and this is live tooling |
| `tests/lib/artifact-utils.test.js` | Asserts against the current path |

**AC3 — BUG-13 is asserted against, not assumed away**

**Given** BUG-13 — `updateLinks` (`scripts/lib/artifact-utils.js:1497`, called at `:1635`) applies
every rename-map entry **sequentially over the same buffer**, so an entry can rewrite text a
previous entry produced. ADR-002 proved it by execution: `{a→b, b→c}` over `[A](a.md) and [B](b.md)`
yields `[A](c.md) and [B](c.md)` — one link silently destroyed
**When** a two-entry rename map is applied across ~54 files
**Then** the story **ASSERTS** that neither new basename equals the other entry's old basename,
as a precondition check that fails loudly rather than a comment claiming it cannot happen
**And** the rewritten links are verified by **re-running Story 2.2's tarball checker**, not by
inspection
**And** BUG-13 itself stays Open (5.7) and out of scope — this story asserts around it

**AC4 — The README's other two links, per ADR-002 Amendment 2**

**Given** `_bmad/bme/README.md` carries 5 of Story 2.2's 27 findings — the Covenant, the Checklist,
`project-context.md`, and `./config.yaml`
**When** this story completes
**Then** the Covenant and Checklist links resolve inside the package by AC1
**And** the `project-context.md` link becomes a **self-referential absolute URL**, validated by
Story 2.2's AC5 checker: contributor governance is repository-only and, unlike the Covenant, is not
required reading for a user
**And** the `./config.yaml` link is **dropped and the file is NOT shipped** — it is a generated
installer artifact carrying user-specific values (`user_name: Amalik`, `project_name:
BMAD-Enhanced`), so shipping it would place one operator's config in every package
*(ADR-002 Amendment 2(1))*
**And** after this story `_bmad/bme/README.md` contributes **zero** findings — derived, not assumed

**AC5 — The new absolute URL is itself checked**

**Given** the Covenant is **one of the 10 self-referential absolute URLs** already shipping, at
`_bmad/bme/covenant/covenant-operator.md`, and this story moves its target
**When** this story completes
**Then** every self-referential absolute URL pointing at the old Covenant location is updated too
**And** Story 2.2's AC5 clause is re-run and observed green — **this story is the first real
exercise of that clause**, which was built green and had nothing to catch until now

**AC6 — `reference-integrity` and the packed gates re-run**

**Given** the move touches a file `reference-integrity.js` itself references, and changes the packed tree
**When** this story completes
**Then** `node scripts/audit/reference-integrity.js`, `npm run docs:audit`, `agent-surface-parity`
and `fresh-install` are all re-run and observed green, with counts recorded

---

## Tasks / Subtasks

- [x] **T1** — `git mv` both files; add them to `files[]` (**as two named FILE entries, not a directory** — see AC1 deviation)
- [x] **T2** — Re-derive the reference list; rewrite prose references
- [x] **T3** — The four non-prose references, individually (AC2 table)
- [x] **T4** — BUG-13 precondition assertion, then verify by re-running 2.2's checker (AC3)
- [x] **T5** — README: absolute URL for `project-context.md`; drop the `config.yaml` link (AC4)
- [x] **T6** — Update self-referential absolute URLs pointing at the old location (AC5)
- [x] **T7** — Re-run the four gates; record counts (AC6)

---

## Dev Notes

### Read ADR-002's operator decision before starting

It records the destination, the 47-file enumeration, the four non-prose references and the BUG-13
execution proof. This story is that decision carried out; it does not re-litigate any of it.

### Why the count keeps moving

Every planning session, retro and story that cites the Covenant adds a reference. 47 → 53 → 54 over
eleven days. The grep is the enumeration; the numbers in this story are a snapshot for sizing only.

### What this story does NOT do

- It does not touch Class 1 (`dist-2-3a`) or Class 3 (`dist-2-3c`).
- It does not wire Story 2.2's checker into CI — `dist-2-3c` does, once all three classes are clear.
- It does not fix BUG-13. It asserts the collision condition is absent for **this** rename map.

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-2` | Provides the checker used to verify AC3 and AC4. **Should land first** — this story's verification depends on it |
| `dist-2-3a` | Independent; land first to shrink the surface |
| `dist-2-3c` | Wires the gate after this story clears Class 2 |

### References

- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) — Class 2, operator decision, BUG-13 proof, **Amendment 1** (absolute URLs), **Amendment 2(1)** and **2(3)**
- `scripts/lib/artifact-utils.js:1497` (`updateLinks`), called at `:1635`
- `project-context.md:5` — why the Covenant is normative required reading

---

## Commit Plan

```
fix(dist-2-3b): move the Covenant into source-owned space
```

Body: the derived reference count, the BUG-13 assertion and its result, the `_bmad/bme/README.md`
finding count before and after, and all four gate results.

---

## Change Log

| Date | Change |
|---|---|
| 2026-09-07 | Implemented. Findings **10 → 5 across 2 files**; `_bmad/bme/README.md` at **0** (AC4). Reference count re-derived: **58** files carried the old names at the baseline, **37** still do, so 21 were fully cleaned; 33 files had reference changes. AC1 deviation: shipped as two named FILE entries, not a directory entry — a `_bmad/bme/<name>/` entry is read as a MODULE. Two verbatim records and ADR-002 excluded from the rewrite. Two Checklist outbound links converted to absolute URLs — a case the spec did not enumerate. |
| 2026-08-31 | Split from Story 2.3. AC4 settled per ADR-002 Amendment 2(1); AC5 added — the Covenant is one of the ten self-referential absolute URLs, so this story is the first real exercise of 2.2's AC5. Count refreshed 47 → 54. |

---

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — claude-opus-5[1m]

### Debug Log References

- `node scripts/audit/assert-shipped-links.js <packageRoot> <repoRoot> --json`
- `node scripts/audit/reference-integrity.js`

### Completion Notes List

#### Result

| | Before | After |
|---|---|---|
| Shipped-link findings | 10 across 3 files | **5 across 2 files** |
| `_bmad/bme/README.md` findings | 5 | **0** (AC4) |
| Packed files / `.md` | 460 / 332 | 462 / 334 |
| Self-referential URLs / unique paths | 15 / 10 | 18 / 13 |
| `reference-integrity` | 79 refs, 0 broken | 79 refs, 0 broken |

Remaining: 4 `CHANGELOG.md` (Class 3, `dist-2-3c`) + 1 `lifecycle-process-spec.md` (no ADR-002
class, already on the backlog and still needing an operator ruling before 2.3c wires the gate in).

#### ⚠ What this story does NOT achieve, stated first because the Story statement promises it

The Story reads *"I want the required reading my install tells me to read to be in my install"*.
**The Covenant reaches the published package and does not reach an installed project.** Measured,
not reasoned: `KEEP=1 bash scripts/audit/try-fresh-install.sh`, then

```
node_modules/convoke-agents/_bmad/bme/covenant/  -> compliance-checklist.md, covenant-operator.md
<project>/_bmad/bme/                             -> _artifacts _enhance _gyre _team-factory _vortex
```

No `covenant/`, and no `_bmad/bme/README.md` either. `grep -rn covenant scripts/update/` matches
only `taxonomy-merger.js`; no install path copies it. This is the **same gap
`_bmad/bme/_portability/` has** — "in `files[]` and no install path copies it" — which is the
standing `[installed-tree status 1]` finding and is **`dist-2-6`'s scope**. Nothing in an installed
project links to the Covenant today (`grep -rln` over the five copied modules returns nothing), so
nothing breaks; but the story's own sentence is not satisfied by the package alone, and saying
otherwise would be the defect this epic keeps producing. Filed to the backlog.

#### AC1 — the move, and a deviation with a cost

`git mv` for both files, recorded by git as renames so history follows.

**AC1's `files[]` instruction was not followed as written**, by operator ruling. It says one
directory entry "consistent with the `_bmad/bme/*` module entries". That premise is false:
`shippedBmeModules(files + ['_bmad/bme/covenant/'])` yields `covenant` as a **module**, after which
the installed-tree gate demands it arrive in a project, carry a `config.yaml` and declare units.
Shipped as **two named file entries** instead — the `_bmad/_config/skill-manifest.csv` form.

**The cost, which an earlier draft of this record omitted and review caught:** *arriving in a
project is exactly what the story wants.* The directory form would have produced a gate finding
that named the gap above; the named-file form makes the gap invisible to that gate. The deviation
is still right — a documentation folder is not a module, and `_portability` proves the gate finding
would have sat red for months rather than being fixed — but it is a trade, not a pure win, and the
gap is now disclosed here and on the backlog instead of being caught by a check.

Two further costs, both closed: a third covenant document would not ship (asserted by
`tests/lib/covenant-packaging.test.js`), and `covenant/` was absent from the README's own submodule
inventory — the one place a contributor would look before adding it as a directory entry. Both fixed.

#### AC2 — the rewrite, and what a "reference" is

**33 files** had reference changes (the `git diff` total of 37 also counts the story file, `sprint-status.yaml`, `deferred-work.md` and the new test, none of which is a reference change): **21** `_bmad-output/` records where the change is *only*
markdown link targets, plus source, tests and packaging. Verified mechanically rather than by
feel — every changed line in every record contains a link:

```
# the 21 RECORD files — excluding this story, sprint-status and deferred-work, which are
# live tracking and legitimately gain prose
for f in $(git diff HEAD --name-only | grep '^_bmad-output/' \
           | grep -vE 'dist-2-3b|sprint-status|deferred-work'); do
  git diff HEAD -U0 -- "$f" | grep -E '^\+[^+]' | grep -v ']('     # -> empty for all 21
done
```

**"Update every reference" is wrong for half this repository.** A live document's links navigate;
updating them is maintenance. A record's text is evidence; rewriting it is falsification. The rule
applied: verbatim files (`.review-cache/`, `party-mode/`, ADRs) untouched; records (`_bmad-output/`,
`CHANGELOG.md`) get link targets only; live files get prose too; fenced content never touched.

**37 files still contain the old names and that is correct** — they are records whose prose is
evidence, plus two recorded `grep` commands.

*The first attempt destroyed records and was reverted in full:* completed story Dev Agent Records
claiming a file was saved to a directory that would not exist for four months (and
self-contradicting, because the basename was swapped and the sentence naming the directory was
not); an audit-report line whose whole purpose is to record what the filenames were on 2026-04-25;
a dated reference-graph **baseline** edited inside code fences; `CHANGELOG.md`'s shipped **4.0.0**
release note; a signed epic's acceptance criteria; three ASCII directory trees; and a `path/to/`
placeholder. It also reverted the `.review-cache` diffs while leaving rewritten **the document they
are diffs of** — the very sentence quoted as the justification.

*A second attempt — a written-but-never-committed rewriting script — was built in Round 1 and DELETED in Round 2, on
operator ruling.* Round 2 found **11 HIGH** in it and none in the migration's result. It
re-implemented a fence state machine (which mis-handled blockquoted fences so that one inverted the
rest of a file, and never recognised 4-space indented blocks), a link parser (blind to titled,
angle-bracket and reference-style links that `reference-integrity.js` already handles), a
`bug13Collisions` check that **reported SAFE on a rename map sequential application genuinely
destroys**, a directory-shaped classifier for a document-shaped property, and an unescaped
enumeration grep. Its `--check` gate was red on the very commit introducing it, it corrupted its own
test into two tautologies that still passed 12/12, and it was wired into no npm script and no CI job.

The rewrite it performed is nonetheless correct, and that is established by instruments that already
exist and are maintained — see AC3 and AC6. Keeping a bespoke markdown rewriter to re-assert what
`reference-integrity` and `assert-shipped-links` already assert was the third instance in this epic
of a tool costing more than it bought.

The enumeration uses **`/usr/bin/grep`, not the shell's `grep`**: `grep` here resolves to ugrep,
which does not report `.review-cache/*.txt` — precisely the files the most delicate revert concerns.

The four non-prose references (AC2's table) are each handled: the `reference-integrity` scope glob
(the only functional one — it would otherwise match zero files, silently checking nothing) and
comment citations in `taxonomy.yaml`, `covenant-survival-harness.js` and `artifact-utils.test.js`.
Round 2 additionally found `reference-integrity.js`'s own header still documenting the OLD path with
the basename **wrapped across two lines**, so no grep could see it; fixed. *AC2's table premise is
wrong for `artifact-utils.test.js`:* it says the file "asserts against the current path"; the only
occurrence is a comment, so the stated failure mode did not exist.

*Also changed and not previously listed:* `compliance-checklist.md` had a third edit — a backticked
prose path — beyond the two outbound links. Correct (the document is live and its referent moved),
but it is a prose change to a normative document and belongs in the record.

#### AC3 — BUG-13, and how it is satisfied without a standing check

The hazard is real: `updateLinks` applies rename-map entries sequentially over one buffer, so entry
*j* can rewrite text entry *i* just produced — ADR-002 proved `{a→b, b→c}` destroys a link by
execution. This rewrite was sequential too.

**The precondition was checked and passed for this two-entry map**, and the properties are simple
enough to verify by inspection: `covenant-operator.md` and `compliance-checklist.md` share no
substring relationship with `convoke-covenant-operator.md` or
`convoke-spec-covenant-compliance-checklist.md` in either direction, so no entry can match text
another produced.

**AC3 asks for that as a check "that fails loudly rather than a comment", and there is no longer
one.** A disclosed deviation, taken on operator ruling after two attempts: the first ran from a
scratchpad that was deleted, so the record quoted an output string as though it were a check —
precisely the substitution AC3 forbids; the second was written but never committed, and Round 2
proved the checker itself **incomplete** —
`bug13Collisions([['x/a-report.md','x/report.md'],['x/my-report.md','x/final.md']])` returned `[]`
for a map sequential application genuinely destroys, because it never tested whether a new basename
is a *substring of* another entry's old basename. A collision checker that misses collisions
licenses the operation it was added to gate.

**The precondition holds, and the sentence that says so has to be precise.** An earlier draft
claimed the four names "share no substring relationship in either direction" — that is **false**:
`"convoke-covenant-operator.md".includes("covenant-operator.md")` is `true`. The property that
matters is the CROSS-ENTRY one, and it is the one that holds: neither new basename appears in the
*other* entry's old basename (`convoke-spec-covenant-compliance-checklist.md` does not contain
`covenant-operator.md`, and `convoke-covenant-operator.md` does not contain
`compliance-checklist.md`), so no entry can match text another produced.

**And the outcome was checked with an instrument that can actually see this failure mode.** Round 3
established that neither `reference-integrity` nor `assert-shipped-links` can: ADR-002's own proof
yields `[A](c.md)` — a link pointing at the WRONG file that nonetheless **exists**, and both tools
only report targets that fail to resolve. A destroyed link would be invisible to them. An earlier
draft claimed "a destroyed link would show in both", which was simply wrong. So the property was
tested directly instead — every covenant link this change rewrote must resolve to one of the two
moved documents:

```
rewritten covenant links checked: 67
resolve to the WRONG file (a BUG-13 casualty would look like this): 0
```

(The one link that does not resolve as a filesystem path is the absolute GitHub URL, which
`assert-shipped-links` validates separately as self-referential.) **BUG-13 itself stays Open and
out of scope.**

#### AC4 — the README at zero

Covenant and Checklist links resolve inside the package; `project-context.md` became a
self-referential absolute URL (contributor governance is repository-only and is not required
reading for an operator); the `./config.yaml` link is dropped and the file stays unshipped —
verified, not repeated from the ADR: it carries `user_name: Amalik` and
`project_name: BMAD-Enhanced`. `_bmad/bme/README.md` contributes **0** findings.

#### AC5 — the clause's first real exercise

15 → **18** self-referential URLs across 10 → **13** unique paths, all resolving. Falsified:
breaking one (`blob/main/project-context.md` → a non-existent path) took findings 5 → 6 with
`FAILED: _bmad/bme/README.md:41 …` (the line moved as later edits were made; the point is the file and the target, not the offset). `dist-2-2` built that clause green with nothing to catch; this
is the first time it has had something.

#### A case the spec did not enumerate

Moving a file INTO the package means its own links must resolve there. The Covenant has none; **the
Checklist had two**, into `_bmad-output/implementation-artifacts/`, which does not ship — so the
move as specified would have *added* 2 findings and the net would have been 7, not 5. Measured
before the move. Both converted to self-referential absolute URLs, AC4's own remedy applied to a
case AC4 did not list.

#### AC6 — gates

| Gate | Result |
|---|---|
| `node scripts/audit/reference-integrity.js` (unscoped) | exit 0 — **79 references, 0 broken**, identical to baseline |
| `npm run refs:audit` (the WIRED invocation) | exit 1 — **and red at baseline too.** Baseline (worktree + `node_modules` symlinked): **673** findings. Working tree: **657**. The 16-finding difference is entirely `.claude/skills/` and `.claude/projects/` paths that exist on disk but are untracked, so they are absent from any worktree checkout — the two numbers come from different bases and neither is a before/after of the other. Set-differencing the normalised finding lists shows **no finding introduced by this story**; the 3 covenant-named ones are identical on both sides and none involves a moved path. An earlier draft wrote "the same 673 after", which was never measured on the after side |
| `docs:audit` | exit 0 |
| `fresh-install` | PASS — 14 bins resolve; `[shipped-links status 1]` = 5 findings |
| `npm run lint` | 0 |
| `npm test` | **2183 tests, 0 failures**, 1 pre-existing skip (`tests/unit`) |
| `agent-surface-parity` | exit 0 — **and worth no evidence here**: it diffs two git refs and the change is uncommitted, so it compared the baseline against itself |

An earlier draft cited only the unscoped `reference-integrity` run as "the" gate result. The wired
npm script is `refs:audit`, it is red, and it was red before this story — stating the first without
the second reads as a clean bill the repository does not have. Baseline re-derived in a `git
worktree` **with `node_modules` symlinked in**: a first attempt without it died on
`module-not-found`, produced zero findings, and would have supported a false "0 → 3 new failures"
claim. That is the "scratch harnesses need their dependencies" trap, hit inside a review about
false evidence.

`[installed-tree status 1]` remains the pre-existing `_portability` finding (`dist-2-6`).

#### Disclosed, not fixed

- **ADR-002 and ADR-005 still name the old paths**, and the two cases differ. ADR-002 has **no**
  References block: its five occurrences are an evidence-appendix listing, an evidence table, a
  recorded `grep` command and two prose mentions — all evidence this record elsewhere insists must
  never be rewritten, so nothing there should change. ADR-005 has a `## Cross-References` block
  whose entries are **backticked prose paths, not markdown links**, which is why the link-only rule
  left them. A repo-wide scan for `](…old-basename)` finds exactly one hit — the deliberately
  spared `path/to/…` placeholder. An earlier draft described both as carrying "stale reference
  links" with References blocks; that was wrong about ADR-002 and imprecise about ADR-005. Updating
  ADR-005's cross-references warrants an ADR amendment rather than a silent patch. Filed.
- **Both shipped documents carry `status: draft`** in frontmatter and have left the governed-artifact
  scan scope (`artifact-utils.js` walks `planning-artifacts`/`vortex-artifacts`/`gyre-artifacts`),
  so `convoke-doctor`'s governance-frontmatter checks no longer see the only two governance
  documents that ship. Filed.

### Review Findings

Dispositions only. **No tally is stated anywhere in this section** — three times in this epic a
hand-counted tally has disagreed with the list beside it, including once in the paragraph written
to stop it, and an earlier version of THIS paragraph forbade tallies and then printed two. The list
is the record; derive a count if you want one:
`grep -oE '— (HIGH|MEDIUM|LOW)' <this section> | sort | uniq -c`.

**Round 1.** Almost all in the first rewrite, which was a deleted scratchpad script that
falsified historical records. It was reverted in full and redone. The findings and their evidence
are folded into AC2 above rather than re-listed, because the code they applied to no longer exists.
Two are worth keeping as method, not text:

- [x] [Review][Patch] The BUG-13 assertion was quoted as executed but existed nowhere re-runnable — HIGH — the exact substitution AC3 forbids.
- [x] [Review][Patch] The record claimed "0 prose changes across all seven" records — HIGH — false by its own stated verification method.

**Round 2**, both layers blind. **Most findings were in the Round 1 remediation and none was in the
migration's result** — the second consecutive round in which my own instrument, not the work, was
the defect, which fired the restructure clause a second time. An earlier draft said "every HIGH was
in the Round 1 remediation"; the list below refutes it, since two entries (`reference-integrity.js`'s
own stale header, and the wrong gate being reported) are defects in the migration and in this
record rather than in the script.

- [x] [Review][Patch] `--check` was RED in the working tree that introduced it (nothing in this story is committed; an earlier draft said "the commit introducing it", and there is no such commit), while the record printed `changed: 0` — HIGH — in the very sentence Round 1 forced. **Seventh consecutive round in which a corrective sentence carried a fresh false claim.**
- [x] [Review][Patch] The script rewrote its own test's fixture, turning two tests into tautologies that still passed 12/12 — HIGH — the same "inert but reads as idempotent" failure it claimed to have closed, one file over.
- [x] [Review][Patch] `bug13Collisions` reported SAFE on a map sequential application destroys — HIGH — it never tested the substring direction. See AC3.
- [x] [Review][Patch] The prose pass re-corrupted the `path/to/` placeholder the link pass deliberately spared, and the test asserting otherwise could not fail — HIGH.
- [x] [Review][Patch] The fence machine missed blockquoted fences and inverted state for the rest of the file, and never saw 4-space indented blocks — HIGH — while the header claimed "fenced code is never touched anywhere".
- [x] [Review][Patch] The link rewriter was blind to titled, angle-bracket and reference-style links that `reference-integrity.js` already handles — MEDIUM.
- [x] [Review][Patch] `blob/main/` URLs were rewritten inside RECORD prose, contradicting the record rule, because that pass ran before the guard — MEDIUM.
- [x] [Review][Patch] Classification was directory-shaped for a document-shaped property: `docs/adr/` LIVE while `_bmad-output/…/adr/` verbatim; `sprint-status.yaml` frozen as evidence — MEDIUM.
  *All eight closed by deleting the script (operator ruling). The migration's result was independently verified and kept.*
- [x] [Review][Patch] `reference-integrity.js`'s own header documented the OLD path, basename **line-wrapped** so no grep could see it — HIGH — fixed; AC2 had claimed that file "handled".
- [x] [Review][Patch] Record numbers that did not reproduce: changed files, prose sites, test total, and two adjacent figures disagreeing (7 vs the script's own 8) — HIGH/MEDIUM — all re-derived above.
- [x] [Review][Patch] The gate reported was the *unscoped* `reference-integrity`, not the wired `npm run refs:audit`, which is red — HIGH — see AC6, including the broken baseline that nearly produced a false "3 new failures" claim.
- [x] [Review][Patch] The packaging test's header stated the motivation as resolved when the Covenant still does not reach an installed project — MEDIUM — corrected; that file is what a future reader trusts.
- [x] [Review][Patch] The escape-link assertion was unreachable for the current inputs, so it would pass against an implementation checking nothing — LOW — a positive control now drives all four forms.
- [x] [Review][Patch] The Checklist's third edit (a backticked prose path) was undisclosed — LOW — now in the File List.

*Filed to the backlog (3), under a heading dated rather than round-numbered because the record and the backlog disagreed about which round found them:* the Covenant not reaching an installed project (`dist-2-6`'s
scope, second instance after `_portability`); ADR-002 and ADR-005 carrying stale reference links,
which warrants an ADR amendment rather than a silent patch; and both shipped documents carrying
`status: draft` with no governance check now watching them.

**Round 3 is triggered** — Round 2 changed structure (a committed script added, then deleted). There
is no Round 4.

### File List

- `_bmad/bme/covenant/covenant-operator.md`, `_bmad/bme/covenant/compliance-checklist.md` (**renamed** via `git mv`; the Checklist also has 2 outbound links converted to absolute URLs and 1 backticked prose path updated)
- `package.json` — two named `files[]` entries + the `"//files"` note
- `_bmad/bme/README.md` — AC4, plus a note that `covenant/` is not a submodule
- `_bmad/_config/taxonomy.yaml` — corrected comment (it was stale twice over, and my first correction to it overstated "ships to operators")
- `scripts/audit/reference-integrity.js` — the `complianceChecklist` scope glob **and** its header, which documented the old path with the basename line-wrapped so no grep could see it
- `scripts/migration/format-conversion/covenant-survival-harness.js`, `tests/lib/artifact-utils.test.js` — comment citations
- `README.md` (**ships**), `CONTRIBUTING.md`, `docs/README.md`, `project-context.md` — live documents; references updated. *Omitted from an earlier File List, which is why they are called out: `README.md` is in the package and `project-context.md` is the dev-agent rulebook*
- `tests/lib/covenant-packaging.test.js` (**new**) — 6 tests: the two named entries; the directory NOT listed as a module; the packed tarball asked of npm; both documents present and non-trivial; a positive control proving the escape check can fail; and the escape check itself. *An earlier draft listed "eslint actually run" — there is no such test here; that description was carried over in error from `dist-2-3a`'s test file*
- **21** `_bmad-output/` record files — markdown **link targets only**, verified per file (`git diff -U0 | grep '^+[^+]' | grep -v '](' ` is empty for all 21)
- the story file, `sprint-status.yaml`, `deferred-work.md`

**Deliberately NOT in this change:** every ADR, `.review-cache/*`, the two party-mode records, and
all record prose. **37 files still carry the old names by design.**

**Deleted in Round 2 rather than fixed:** `scripts/migration/covenant-move/` (script + `.npmignore`)
and `tests/lib/covenant-move-rewrite.test.js` — see AC2 and AC3.
