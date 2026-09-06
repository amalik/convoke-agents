---
baseline_commit: cdd9cf88ff03f010a5bf32bbddb132d718cb718b
---

# Story 2.2: Assert every documented reference resolves inside the package

Status: review

<!-- baseline_commit deliberately ABSENT — it is `dev-story`'s field, stamped at implementation start. -->

## Story

As a **Convoke operator**,
I want every link in what I installed to point at something I have,
so that **"required reading" is readable by someone who installed from npm**.

### What this story is, in one line

Build the shipped-link checker against the harness's already-packed tarball, prove it red on the
**27** real findings, and **do not wire it into CI** — Story 2.3c does that, in the commit that
turns it green.

---

## Acceptance Criteria

**AC1 — Runs against the harness's tarball, not a second pack**

**Given** `scripts/audit/try-fresh-install.sh` already runs `npm pack` as its first step
**When** the checker is written
**Then** it runs against that harness's packed tarball rather than packing its own — a second pack
is a parallel mechanism, the criticism this epic levels at grep-based detection
**And** it reuses the harness's existing extraction rather than extracting again

**AC2 — NOT wired into CI by this story (NFR10)**

**Given** `fresh-install` is one of the eight jobs `publish` `needs:`, and it runs on push to `main`
and on every pull request
**When** this story completes
**Then** the checker is **not** placed in the harness's failure path, and the harness verdict
condition is left byte-identical
**And** `continue-on-error` appears nowhere — a gate nobody watches is T32, the row this epic exists
to close
**And** Completion Notes name **Story 2.3c** as the wiring story
**And** a *cannot-run* condition (exit 2) may exit `ENV_FAIL`, consistent with the nine existing
sites in that file — the constraint is on the **verdict**, not on error handling. This clause exists
because Story 2.4's AC2 did not draw the distinction and a reviewer had to

**AC3 — Every relative link in every shipped `.md` resolves inside the package**

**Given** the packed tarball — **461 files, 334 of them `.md`** today, both re-derived at
implementation time
**When** the gate runs
**Then** it resolves every relative markdown link in every shipped `.md` and fails on any target
absent from the package
**And** `#fragment` suffixes are stripped before resolution; anchor *targets* are not validated, and
the story says so

**AC4 — Fenced and inline code are skipped, and indented fences are handled**

**Given** a naive scan reports **29** findings and a fence-aware scan reports **27** — the two extra
are markdown **examples** inside fenced blocks in
`_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md:227` and
`steps-c/step-c-04-generate.md:102`
**When** the checker runs
**Then** it skips fenced code blocks and inline code spans, so neither is reported
**And** it handles **indented** fences — the `backlog-format-spec.md` example opens with two leading
spaces, and a fence matcher anchored at `^` misreads the fence state for the rest of the file.
*(This is not hypothetical: the first measurement written for this story made exactly that mistake
and classified a fenced example as a real finding.)*
**And** a committed test covers both shapes, indented and flush

**AC5 — Self-referential absolute URLs are validated (ADR-002 Amendment 1)**

**Given** [ADR-002 Amendment 1](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md)
rules that FR12 validates the self-referential subset
**When** the checker runs
**Then** it resolves `https://github.com/amalik/convoke-agents/blob/main/<path>` against the
repository and fails when `<path>` does not exist
**And** external absolute URLs are permitted and **not** validated
**And** the prefix is read from `package.json`'s `repository.url`, never hardcoded and never taken
from a README — `verify-external-identifiers`
**And** the 10 unique self-referential paths shipping today all resolve, so this clause contributes
**zero** findings to AC6's red demonstration — it is built green and stays green until Story 2.3b
moves the Covenant, which is one of the ten

**AC6 — Observed failing, with the count derived (NFR10)**

**Given** the tree as it stands
**When** the gate first executes
**Then** it is observed **failing** with output recorded in Completion Notes, on **27 findings
across 4 files** — re-derived at implementation time, never copied from this story:

```
13  scripts/migration/format-conversion/README.md          <- Class 1 (2.3a)
 5  scripts/migration/format-conversion/fixup-checklist.md <- Class 1 (2.3a)
 5  _bmad/bme/README.md                                    <- Class 2 (2.3b)
 4  CHANGELOG.md                                           <- Class 3 (2.3c)
```

**And** the story records that **ADR-002's own enumeration says "20 broken relative links across 4
files" and is undercounted** — the file set is right, the link count is not. Do not reconcile to 20

**AC7 — The scope limit is stated, not assumed**

**Given** this gate resolves documented references only
**When** its scope is documented
**Then** the story states explicitly that it **cannot** detect a file read at runtime but absent
from the package — that class is Story 2.4's, which shipped — so no one assumes coverage it does
not have
**And** it states that CR-README-D04 **narrows rather than closes**: external absolute URLs remain
unvalidated by design

---

## Tasks / Subtasks

- [x] **T1** — Locate the harness's pack/extract step; hook the checker to its output (AC1)
- [x] **T2** — Link extraction with fence + inline-code stripping, indented fences included (AC3, AC4)
- [x] **T3** — Self-referential absolute-URL resolution, prefix from `package.json` (AC5)
- [x] **T4** — Red demonstration; derive the count; record output (AC6)
- [x] **T5** — Tests: indented fence, flush fence, inline code span, a real broken link, a valid self-referential URL, a broken one. Isolated fixture dirs only (`test-fixture-isolation`)
- [x] **T6** — Scope documentation at the checker and in Completion Notes (AC7, AC2)


### Review Findings

**Round 1, 2026-09-06.** Layer provenance, stated because it is not the intended arrangement:
**Edge Case Hunter ran blind in a separate session** (15 findings, every one reproduced against
running code before triage). **Blind Hunter and Acceptance Auditor ran IN-SESSION**, by the agent
that wrote the code — five successive subagent launches died on infrastructure (one machine sleep,
four 600s stream-watchdog stalls), and after three attempts at the same fix `code-review-convergence`
directs changing the instrument rather than retrying. In-session review is the weaker instrument
here and the two HIGHs below should be read with that discount. **A Round 2 by a different model is
warranted** — Round 1 produced HIGH findings, which triggers Round 2 under the convergence rule.

*Patched (12).* All applied, tested, and mutation-verified:

- [x] [Review][Patch] Comment claimed counts as "Measured on this package" that were copied from the story, not measured — HIGH [scripts/audit/lib/shipped-links.js:18] — said 29/6 naive and 27/4 aware; the actual measurement was 30/7 and 28/5. Absolute counts removed rather than corrected: 2.3a/b/c drive them to zero, so any number there is stale within three stories. The stable *property* is stated instead.
- [x] [Review][Patch] CLI reported a clean scan when markdown was found but zero references were extracted — HIGH [scripts/audit/assert-shipped-links.js] — one unclosed fence produced `scanned 2 markdown file(s), 0 resolvable reference(s)` and **exit 0**. Two fixes: an unterminated fence is now a *finding* naming the opening line, and the CLI fails closed on `linkCount === 0`. Zero shipped files have an unterminated fence today, so the derived count is unaffected.
- [x] [Review][Patch] Comments in the harness and the CLI claimed every finding maps to 2.3a/2.3b/2.3c — MEDIUM [scripts/audit/try-fresh-install.sh; scripts/audit/assert-shipped-links.js] — false for the 28th, and it is the one that would land a red gate on `main`. Both now say so explicitly.
- [x] [Review][Patch] A fence inside a blockquote was invisible, so every link in a blockquoted example became a finding — MEDIUM [scripts/audit/lib/shipped-links.js] — the identical false-positive class AC4 exists to prevent. Latent in 5 shipped files; none holds a link today, which is why it was silent.
- [x] [Review][Patch] A case-only link mismatch passed on a case-insensitive filesystem — MEDIUM [scripts/audit/lib/shipped-links.js] — `[home](Readme.md)` → `README.md` passed on macOS and 404s for every Linux consumer. Resolution is now case-exact per path segment.
- [x] [Review][Patch] A `#committish` in `repository.url` produced a truthy-but-WRONG prefix — MEDIUM [scripts/audit/lib/shipped-links.js] — only `null` fails closed, so AC5 would have evaluated nothing while the run printed a clean verdict.
- [x] [Review][Patch] `?query` was not stripped from targets — MEDIUM — GitHub's `?plain=1` / `?raw=1` turned a live file into a finding.
- [x] [Review][Patch] `http://` and `www.` variants of this repository's own URLs went unvalidated — MEDIUM — a silent hole in AC5 rather than a finding.
- [x] [Review][Patch] npm's documented shorthand `repository` forms returned `null` → CLI exit 2 → `ENV_FAIL` aborting the whole `fresh-install` job — MEDIUM. `github:`/`gitlab:`/`bitbucket:` and ssh-with-port now parse.
- [x] [Review][Patch] Angle-bracket targets and titles were mutually exclusive — LOW — `<file name.md> "Title"` kept its brackets and could never resolve.
- [x] [Review][Patch] `rel.startsWith('..')` could not tell an escape from a file named `..gitkeep-notes.md` — LOW. Containment now compares path segments.
- [x] [Review][Patch] The explicit containment guard was documented as the mechanism that prevents escapes, but is redundant — LOW [scripts/audit/lib/shipped-links.js] — **found by mutation, not by reading**: deleting it turns no test red, because the case-exact segment walk already rejects `..`. Kept as a statement of intent, with a comment saying it is redundant rather than implying it is load-bearing.

*Deferred (5).* Real, none reachable on today's corpus; measured, not assumed:

- [x] [Review][Defer] `blob/<ref>/` assumes a single-segment ref, so `release/4.0` mis-splits the path — MEDIUM — zero self-referential URLs use a slashed ref today. A correct fix needs the branch list; not guessable from the URL alone.
- [x] [Review][Defer] A fence-shaped line indented 4+ spaces (an indented code block) can open a fence and invert state — MEDIUM — zero occurrences today; bounding the indent at CommonMark's 3 would reintroduce the AC4 miss for nested list items. The trade-off is now documented at `FENCE_RE`, and the unterminated-fence finding is the tripwire.
- [x] [Review][Defer] Code spans that cross a line boundary are not recognised — LOW — `stripInlineCode` is per-line by design; documented scope limit.
- [x] [Review][Defer] A backslash-escaped backtick opens a span and can mask a real link — LOW.
- [x] [Review][Defer] `.markdown` files and symlinked `.md` files are not scanned — LOW — AC3 scopes the corpus to `.md`; zero of either ship today.

---

## Dev Notes

### The number to trust, and the two that are wrong

Measured against a real `npm pack` of `4.0.1` on 2026-08-31:

| Basis | Result | Why it differs |
|---|---|---|
| ADR-002's enumeration | 20 across 4 files | Undercounted; file set correct |
| Naive scan (no fence handling) | 29 across 6 files | Counts two fenced **examples** as findings |
| **Fence- and code-span-aware** | **27 across 4 files** | **Use this** |

The two prior figures are wrong in opposite directions and the whole discrepancy is fence handling.
That is why AC4 exists as an acceptance criterion rather than an implementation detail: a format
spec necessarily *shows* markdown, so a checker without fence handling will always accuse the
documents that document the format.

### Why this story does not wire the gate in

`fresh-install` gates every PR and every publish. Eighteen of the 27 findings belong to Class 1,
whose remedy is a `files[]` exclusion in Story 2.3a — so wiring here would block the repository
until three further stories land. NFR10 requires the gate **demonstrated** failing, not **merged**
failing.

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-3a` | Excludes Class 1 → removes 18 of 27 |
| `dist-2-3b` | Covenant move → removes 5, and is the first real test of AC5 (the Covenant is one of the ten self-referential paths) |
| `dist-2-3c` | Removes the last 4 and **wires this checker in, blocking** |
| `dist-2-4` | **Shipped.** Sibling class — it sees what arrives on disk; this sees documented references. `bmm-dependencies.csv` is referenced by no shipped markdown, so this checker cannot detect it and 2.4 must |

### References

- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) + **Amendment 1** (absolute URLs) and **Amendment 2** (the three settled rulings)
- `scripts/audit/try-fresh-install.sh` — the harness; see `dist-2-4` for how a check attaches without joining the verdict
- `scripts/docs-audit.js` `checkBrokenLinks` — skips `^https?://` (CR-README-D04)

---

## Commit Plan

```
feat(dist-2-2): assert every documented reference resolves inside the package
```

Body must record the derived finding count, the red-demonstration output, and that the checker is
deliberately outside the verdict with 2.3c named as the wiring story.

---

## Change Log

| Date | Change |
|---|---|
| 2026-08-31 | Story created. Count corrected to 27 (fence-aware) against ADR-002's 20 and a naive 29. AC4 and AC5 added — fence handling from measurement, absolute URLs from ADR-002 Amendment 1. |
| 2026-09-06 | Implemented. Count re-derived at implementation time per AC6: **28 across 5 files**, not 27 across 4 — the four files and their per-file counts match the story exactly; a fifth finding arrived 2026-09-05 in `154719e3`. Gate demonstrated red inside the harness with the harness still exiting 0. |

---

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — claude-opus-5[1m]

### Debug Log References

- Harness transcript (full run, packs + installs + all checks): reproduced with
  `bash scripts/audit/try-fresh-install.sh`
- Standalone: `node scripts/audit/assert-shipped-links.js <packageRoot> <repoRoot>`

### Completion Notes List

#### The derived count: 28 across 5 files, not 27 across 4 (AC6)

AC6 requires the count re-derived at implementation time and **never copied from the story**. It was.
The four files the story names are confirmed exactly, per-file count for per-file count:

```
13  scripts/migration/format-conversion/README.md           <- Class 1 (2.3a)
 5  scripts/migration/format-conversion/fixup-checklist.md  <- Class 1 (2.3a)
 5  _bmad/bme/README.md                                     <- Class 2 (2.3b)
 4  CHANGELOG.md                                            <- Class 3 (2.3c)
 1  _bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md   <- NEW
```

The fifth is new since the story was authored on 2026-08-31. `lifecycle-process-spec.md:133` names
`_bmad/bme/_config/name-registry.csv` as the **name authority** — "where the two disagree, the
registry wins" — and that file does not ship. It arrived 2026-09-05 in `154719e3`
(`feat(meta-model): seed the name registry, and rule on helm and forge`) — established with
`git log -1 --format='%H %ad' --date=short 154719e3` for the date and `git log -L 133,133:<file>`
to confirm that commit last wrote the line itself, not merely the file. Verified rather than assumed: the target resolves to
`_bmad/bme/_config/name-registry.csv`, which `fs.existsSync` finds in the repository and not in the
package, because `files[]` carries `_bmad/_config/skill-manifest.csv` — one named file, not the
`_bmad/bme/_config/` directory.

**This is a finding for Story 2.3c, and it should be read before 2.3c is picked up.** ADR-002
enumerates three classes and 2.3c is scoped to "remove the last 4 and wire the gate in, blocking".
The 28th belongs to none of the three classes, so on today's tree 2.3a + 2.3b + 2.3c would leave the
gate red at one finding and 2.3c would wire in a blocking gate that fails. Its remedy is a separate
decision — ship `_bmad/bme/_config/`, or repoint the link — and it is deliberately NOT taken here:
this story builds the gate and demonstrates it red; the remedies are 2.3a/2.3b/2.3c's.

The story's instruction not to reconcile to ADR-002's 20 was followed. Measured on this tree:

| Basis | Result |
|---|---|
| ADR-002's enumeration | 20 across 4 files (undercounted; file set correct) |
| Naive scan, no fence handling | **30 across 7 files** |
| Fence- and code-span-aware | **28 across 5 files** |

#### AC4 — the two extra findings are exactly the two documented examples

The naive-minus-aware delta was computed rather than asserted, and it is exactly the two lines AC4
names, with nothing else in the difference:

```
_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md:227
_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-04-generate.md:102
```

Both were opened and confirmed to be markdown **examples** inside fenced blocks.
`backlog-format-spec.md` opens its fence with **two leading spaces** (it sits inside a list item),
which is why `FENCE_RE` is not anchored at `^`. The damage from anchoring is not the one example it
lets through: the matcher never sees that fence OPEN, so it reads the CLOSING fence as an opening one
and inverts fence state for the whole remainder of the file.

#### AC5 — shown live, not merely silent

AC5's ten paths all resolve, so "zero self-referential findings" is also what a checker that skipped
them entirely would print. Both halves were therefore measured:

- The scanner **classifies 15 occurrences across exactly 10 unique paths** as self-referential —
  matching AC5's "10 unique self-referential paths shipping today" — and all 10 resolve, so this
  clause contributes **zero** findings to the red demonstration, as AC5 predicts.
- Re-run with `repoRoot` pointed at an empty directory, the same scan reports **43 findings, 15 of
  them self-referential**. The clause can fail.
- Non-`blob/` URLs on the same repository (`/issues`, `/security/advisories/new`) are correctly not
  validated — they are repository URLs, not file references.
- The prefix is derived from the shipped `package.json`'s `repository.url`
  (`scripts/audit/lib/shipped-links.js`, `selfRefPrefix`), never hardcoded and never read from a
  README. A test asserts that the SAME url under a different `repository.url` is treated as external.
  An unparsable url yields `null`, and the CLI exits 2 rather than silently skipping AC5 — an empty
  prefix would match every absolute URL.

#### AC1 — one artifact, no second pack, no second extract

`assert-shipped-links.js` reads `$TMP/proj/node_modules/convoke-agents` — the tarball the harness
packed at its first step and npm extracted at the install step. It neither packs nor extracts.
Relative links resolve inside the **package**; self-referential `blob/<ref>/` URLs resolve against
the **repository**, because such a URL names content on the default branch and `docs/` is in the
repository but not in `files[]`. Conflating the two roots would turn ten correct links into ten
findings; a test pins that distinction.

#### AC2 — demonstrated red, deliberately outside the verdict. **Story 2.3c is the wiring story.**

The full harness was run. It printed 28 `FAILED:` lines and `[shipped-links status 1]`, then reached
`PASS — a new user gets a working, self-consistent install.` and **exited 0**. That is the AC2
demonstration in the strongest available form: the gate is red and the harness verdict is untouched.

- The verdict condition is byte-identical to its prior text. Established from git, not by eye:
  `git diff HEAD -- scripts/audit/try-fresh-install.sh | grep -E '^[+-].*INSTALL. -eq 0'` returns
  nothing, so the line is in no hunk; diffing the line at `HEAD` against the working tree shows
  identical text at a shifted line number (406 → 459). `$LINKS` appears nowhere in it, nor in the
  `FAIL` diagnostic line.
- `continue-on-error` appears nowhere in the file (count: 0).
- The one `exit "$ENV_FAIL"` added is a **cannot-run** path (exit ≠ 0 and ≠ 1), consistent with the
  nine existing sites and with AC2's final clause. Findings are exit 1 and are excluded from it.

#### AC7 — the scope limit, stated

Documented in the header of `scripts/audit/lib/shipped-links.js` and repeated here:

- It **cannot** detect a file that shipped code READS AT RUNTIME but that no markdown mentions. That
  class is Story 2.4's (`assert-installed-tree.js`, shipped). The two are siblings, not substitutes:
  this one sees documented references, that one sees arrivals. `bmm-dependencies.csv` is referenced
  by no shipped markdown, which is precisely why 2.4 had to exist.
- CR-README-D04 **narrows rather than closes**: external absolute URLs remain unvalidated by design.
  Only the self-referential subset is resolved.
- Anchor **targets** are not validated. `#fragment` is stripped before resolution; whether the
  heading exists is out of scope.
- Inline links only. Reference-style definitions (`[id]: path`) are not resolved — none ship today,
  and if one is added it is unchecked. Named as a known hole rather than left implicit.
- A target containing `)` is truncated at the first `)`, matching `scripts/docs-audit.js`.

#### Verification, and how each check was shown able to fail

Per `verification-must-be-falsifiable`, every check cited here was observed producing the other answer.

| Check | Shown red by |
|---|---|
| The 40-test suite | A 10-mutant matrix, below. Every mutant killed; none survived |
| `npm run lint` | Went red on this very change — 2 `no-unused-vars` warnings in the new test file — then green after they were fixed |
| The gate itself | 28 findings on the real tarball, inside the real harness (exit 1) |
| AC5's clause | 15 self-referential findings against an empty `repoRoot` |
| Fence handling | Naive scan reports 30/7 where the aware scan reports 28/5 |

**Mutation matrix — mutant → the assertion that dies.** A pass/fail tally is not evidence, so each
row names its executioner. Control run with no mutation: zero failures. Twenty mutants after
Round 1; the ten below are the original battery, and each Round 1 patch additionally carries a
revert-the-fix mutant (M11-M20) that is killed by the test added with it. **M9 SURVIVED and that is
recorded rather than repaired away** — see the last Review Finding: it proved the containment guard
redundant, and the outcome was an honest comment, not a new test manufactured to kill it.

Three defects in the matrix HARNESS itself were found and fixed while running it: two patterns
matched zero lines (wrong indent) and printed nothing, and M19's first form was an EQUIVALENT
mutant — it produced identical output, so its "SURVIVED" was the harness's fault, not a coverage
hole. Per `verification-must-be-falsifiable`: when a matrix row disagrees with expectation, suspect
the harness first.

| Mutant | Killed by |
|---|---|
| M1 `FENCE_RE` anchored at `^` | *skips an INDENTED fence*; *resumes scanning after an indented fence closes* — and **not** the flush-fence test, which is why the two are separate cases |
| M2 `stripInlineCode` → no-op | *skips a link inside a code span*; + 2 unit cases |
| M3 selfref resolved against the package | *resolves against the REPOSITORY, not the package* |
| M4 `selfRefPrefix` returns `''` on an unparsable url | *returns null for a url it cannot parse* |
| M5 closing fence ignores the fence character | *does not let a tilde run close a backtick fence* |
| M6 closing fence ignores the fence length | *does not let a shorter run close a longer fence* |
| M7 `#fragment` not stripped | *strips a #fragment before resolving*; + 3 others |
| M8 nested `node_modules` walked | *does not descend into a nested node_modules* |
| M9 containment check dropped | *reports a ../ chain that escapes the package, even when it resolves on disk* |
| M10 whole-link regex instead of the `](` tail | *scans BOTH targets of a badge-wrapped link* |

M3 and M10 are the mutants chosen as *plausible refactors* rather than deletions — M3 is the single
easiest mistake to make in this file (one resolution root instead of two), and M10 is the regex a
reader would reach for first.

#### Package census (AC3), re-derived

`npm pack` of `4.0.1` on 2026-09-06: **465 files, 334 of them `.md`**. The story recorded 461; the
`.md` count is unchanged at 334. Whether 461 was right on 2026-08-31 was **not** re-verified — doing
so would mean packing at that commit, and nothing turns on it. The scan classifies **99 resolvable
references** (84 relative + 15 self-referential) and skips 30 (external URLs, anchor-only, `mailto:`).

#### Other notes

- **Full suite: 2151 tests, 0 failures, 1 skip.** The skip is pre-existing and unrelated: running
  each directory separately puts it in `tests/unit` (`tests/audit` reports `skipped 0`), and the new
  suite contains no `skip`. `npm run lint`: 0.
- **`test-fixture-isolation`:** every case builds its own tmp tree under `os.tmpdir()`; nothing reads
  `PACKAGE_ROOT` as data.
- **Namespace decision:** `scripts/audit/`, alongside `assert-installed-tree.js` — repository audit
  tooling, not a `_bmad/bme/` skill, so the Covenant's operator-facing obligations do not attach. It
  is invoked by the harness, not by an operator.
- **`derive-counts-from-source`:** no count is hardcoded in the **checker** — the census, the finding
  count and the per-file breakdown are all computed at runtime. Tests do assert literal numbers
  (e.g. `scanned 2 markdown file(s)`), which is the permitted form: each is a property of a fixture
  the test itself creates in the same function, so the fixture guarantees the count. No test
  asserts a count against live repository state.

### File List

- `scripts/audit/lib/shipped-links.js` (new) — extraction, classification, resolution
- `scripts/audit/assert-shipped-links.js` (new) — CLI; exit 0 clean / 1 findings / 2 cannot-run
- `tests/audit/shipped-links.test.js` (new) — 53 tests
- `scripts/audit/try-fresh-install.sh` (modified) — invocation only; verdict condition untouched
- `_bmad-output/implementation-artifacts/dist-2-2-assert-every-documented-reference-resolves-inside-the-package.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — `in-progress` → `review`
