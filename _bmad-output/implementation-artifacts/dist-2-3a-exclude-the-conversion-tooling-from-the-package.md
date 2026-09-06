---
baseline_commit: 2f793c856749db9b7c0bbe54ee1eb1e5e74e52a4
---

# Story 2.3a: Exclude the conversion tooling from the package

Status: review

<!-- baseline_commit deliberately ABSENT — stamped by dev-story at implementation start. -->

> **Split from Story 2.3 on 2026-08-31** (readiness Finding 7: 2.3 bundled six independently-risky
> workstreams behind one gate-wiring step). Class 1 of [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md).
> Siblings: `dist-2-3b` (Class 2), `dist-2-3c` (Class 3 + wiring).

## Story

As a **Convoke operator**,
I want the package to carry only what I can use,
so that **one-off contributor tooling is not shipped to me with links I cannot follow**.

### What this story is, in one line

Drop `scripts/migration/format-conversion/` from `files[]` — **18 of Story 2.2's 27 findings are
inside it**, and the package boundary was misplaced, not the links.

---

## Acceptance Criteria

**AC1 — The directory leaves the package, and no link inside it is edited**

**Given** 18 of the 27 shipped-link findings are in `scripts/migration/format-conversion/`
(13 in `README.md`, 5 in `fixup-checklist.md`), and the directory reaches the tarball only because
`files[]` carries `scripts/` wholesale
**When** this story completes
**Then** that directory is excluded from `files[]`
**And** **no link inside it is edited** — the boundary was wrong, not the references. All 18 point
at `_bmad-output/`, `project-context.md` and `tests/`, which are repository-only by design and
correct to reference from repository-only tooling
**And** the count is re-derived at implementation time (`derive-counts-from-source`)

**AC2 — Nothing resolves into it at runtime, verified before removal**

**Given** removing a directory from `files[]` is invisible until something reaches for it
**When** this story completes
**Then** it is verified that no `bin`, nothing under `scripts/update/**`, and no test resolves into
`scripts/migration/format-conversion/` at runtime
**And** the verification is by execution — a fresh-install smoke that exercises the bins — not by
grep alone, since a dynamically built path defeats grep
**And** `scripts/audit/assert-installed-tree.js` (shipped by `dist-2-4`) already walks the bins'
transitive dependency surface; use it rather than writing a second walker

**AC3 — The directory stays in the repository, and stays maintained**

**Given** ADR-002 Class 1 calls this "one-off i97 tooling", which is true of its purpose and
**misleading about its state** — I97 Epic 2 is **2 of 7** done, with `i97-2-3` `in-progress` and
`i97-2-4` … `i97-2-7` all `ready-for-dev`
**When** this story completes
**Then** the directory is removed from `files[]` **only** — not deleted, not deprecated, not
excluded from lint or tests
**And** the `files[]` comment records why: an operator has no use for it; **five agent conversions
still run through it**. That an operator does not need it does not mean a contributor does not
*(ADR-002 Amendment 2(3))*

**AC4 — The package shrinks, so both packed-tree gates re-run**

**Given** `agent-surface-parity` and `fresh-install` both assert against the packed tree
**When** the exclusion lands
**Then** both are re-run and observed green
**And** the new tarball file count is recorded (461 before, re-derived after)

---

## Tasks / Subtasks

- [x] **T1** — Verify no runtime resolution into the directory (AC2), reusing `assert-installed-tree.js`
- [x] **T2** — Add the exclusion to `files[]` with the AC3 comment
- [x] **T3** — Re-pack; confirm the 18 findings are gone; derive both counts (**10 remain, not 9** — see below)
- [x] **T4** — Re-run `agent-surface-parity` and `fresh-install`; record the new file count
- [x] **T5** — Confirm the i97 conversion tooling still runs from the repo (one conversion dry-run or its test suite)

---

## Dev Notes

### Why this is first among the three

It is the largest single reduction (18 of 27) and the only one with **no editing of shipped prose
at all** — it changes one packaging list. It carries no BUG-13 exposure and no rename map. Landing
it first shrinks the surface the other two work against.

### `files[]` is an allowlist, not a glob

`package.json` `files[]` carries `scripts/` wholesale, which is how this directory reached the
tarball without anyone deciding it should. npm supports negation patterns; confirm the syntax
against the packed output rather than assuming it worked — the failure mode is silent inclusion.

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-2` | Builds the checker whose findings this reduces. **Not blocking** — this story can land first; 2.2's red demonstration is a point-in-time record, and its AC6 requires re-derivation anyway |
| `dist-2-3b`, `dist-2-3c` | Siblings; 2.3c wires the gate once all three classes are clear |
| I97 Epic 2 | Consumes this directory. **Must not be broken** — see AC3 |

### References

- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) Class 1; **Amendment 2(3)** (live-tooling correction)
- `package.json` `files[]`; `scripts/audit/assert-installed-tree.js`

---

## Commit Plan

```
fix(dist-2-3a): drop the conversion tooling from the package
```

Body: the derived before/after finding counts, the AC2 verification method and result, the new
tarball file count, and both re-run gates.

---

## Change Log

| Date | Change |
|---|---|
| 2026-08-31 | Split from Story 2.3. AC3 added — ADR-002's "one-off tooling" premise is stale; I97 Epic 2 is 2/7 with five conversions still to run. |
| 2026-09-06 | Round 1: 2 HIGH, 6 MEDIUM, 5 LOW — every number re-derived correct, defects entirely in the claims. 11 patched, 1 filed to backlog. The guard scoping needed a second attempt: the first keyed on a substring and was wrong in both directions. |
| 2026-09-06 | Implemented. 18 findings removed exactly as specified; **10 remain, not 9** — the spec was written against 27, and `dist-2-2` re-derived 28. Census 467 → 460 files, 334 → 332 `.md`. Required a scoping fix to `shippedBmeModules` (dist-2-4's code), which reported the negation as an unresolvable `files[]` entry. |

---

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — claude-opus-5[1m]

### Debug Log References

- `npm pack --dry-run --json` for the packed census and the exclusion itself
- `node scripts/audit/assert-shipped-links.js <packageRoot> <repoRoot> --json` for finding counts
- `bash scripts/audit/try-fresh-install.sh` for AC2 and AC4

### Completion Notes List

#### What is on disk — read this before the history below

The exclusion is **one untracked-until-now file**: `scripts/migration/format-conversion/.npmignore`
containing `*`, plus a `"//files"` pointer in `package.json` and one test.

**`package.json`'s `files[]` is byte-identical to the baseline.** No packaging pattern was changed.

**AC1 IS NOT MET AS WRITTEN, and that is a deviation rather than compliance.** AC1 says "that
directory is excluded from `files[]`". It is excluded from the **tarball**; `files[]` still matches
it via `scripts/`, and the `.npmignore` overrides. The outcome is identical — verified below — but
the instrument is not the one the AC names, and this record says so rather than asserting the AC's
words. Why the substitution: see *The detour*, below.

#### The counts (AC1, AC4)

Re-derived, never copied (`derive-counts-from-source`):

| | Before | After |
|---|---|---|
| Findings | 28 across 5 files | **10 across 3 files** |
| Packed files | 467 | **460** |
| Shipped `.md` | 334 | **332** |
| Resolvable references | 99 (84 rel + 15 selfref) | 80 (65 rel + 15 selfref) |

**The spec says "18 of 27 … 9 remain"; it is 18 of 28, 10 remain.** The 18 is exactly right, down
to the 13 + 5 per-file split. The remainder differs because the spec was authored against 27 and
`dist-2-2` re-derived **28** — a 28th finding landed 2026-09-05 (`154719e3`). What remains:

```
 5  _bmad/bme/README.md                                    <- Class 2 (dist-2-3b)
 4  CHANGELOG.md                                           <- Class 3 (dist-2-3c)
 1  _bmad/bme/_enhance/.../lifecycle-process-spec.md       <- NO ADR-002 class (filed to backlog)
```

**AC4's "461 before" is also stale** — the measured pre-change census is **467**. Two stale figures
in the spec, both left in place: `dev-story` does not permit this agent to edit spec sections. The
full list of spec text this record contradicts is at the end of these notes.

#### AC1's other half: no link inside the directory was edited

None was. AC1's *reasoning* holds for **17 of the 18**: they point at `_bmad-output/`,
`project-context.md` and `tests/`, which are repository-only by design and correct to reference
from repository-only tooling.

**The 18th does not fit that story.** `fixup-checklist.md:54` points at
`../../../.claude/skills/bmad-init/SKILL.md`. `.claude/skills/*` is gitignored (`.gitignore:62`)
and **no `bmad-init` directory exists** — the link is dangling in the repository too, so excluding
the directory *hides* it rather than vindicating it. Not fixed here, because AC1 forbids editing
links inside the directory and that holds even where a link is genuinely broken.

#### AC3 — removed from the package, not from the repository

The directory is untouched: seven files still on disk, still linted, still exercised by tests.
Premise re-verified rather than assumed — `sprint-status.yaml` shows I97 Epic 2 at **2 of 7**
(`i97-2-3` in-progress, `i97-2-4`…`i97-2-7` ready-for-dev), so five agent conversions still run
through this tooling. **Coverage is the one exception and it predates this story:** `.c8rc.json:11`
already excluded the directory, so nothing was removed; listing it beside lint and tests would
imply it is measured, and it is not.

The rationale lives in two places because the mechanism and the manifest are now separate files:
the `.npmignore` header (where the exclusion is) and the `"//files"` key (where a reader looking
for it would start). JSON has no comments, hence the key; npm ignores it. Nine files read
`package.json`; **none iterates its key set**, which is the property that makes an extra key safe.

#### AC2 — verified by execution, with the limit named

**AC2's literal wording is not fully met either.** It requires that "no test resolves into
`scripts/migration/format-conversion/` at runtime". Two do —
`tests/lib/format-conversion-load.test.js` and `tests/integration/vortex-parity.test.js`. They are
harmless (`tests/` does not ship, so they run from the repository), but T5 of this same story
*depends* on those requires resolving, so the story requires and disclaims them in one breath.

**And "execution" needs qualifying.** AC2 asks for it *"since a dynamically built path defeats
grep"*. The dependency walker is **not** execution: it is a regex over raw text with no lexer (its
own header says so), and a dynamic path defeats it exactly as it defeats grep. What genuinely
executes: `try-fresh-install.sh` runs **3 of the 14 bins** for real (`convoke-install-vortex`,
`convoke-doctor`, `convoke-export`); the other eleven are checked statically, by design.

Evidence, both directions, using the existing walker rather than a second one:

- **Control** — real harness, npm-installed tree: `all 14 bins present, shipped, parseable, and
  their requires resolve`, harness **PASS**.
- **Mutant** — `require('./migration/format-conversion/parity-harness')` inserted into
  `scripts/install-all-agents.js` **after the shebang**, so the file still parses (`node --check`
  clean) and only the missing-module assertion can fire: `FAILED: convoke-install — requires
  module(s) that did not ship: ./migration/format-conversion/parity-harness`, harness **exit 1**.

That mutant is a literal require — the one form the walker's regex already matches. It proves the
check can go red and names the right module; it is **not** evidence for the dynamic-path case,
because no static scanner can be.

*Two pieces of evidence were discarded rather than reported:* a first mutant placed the `require`
before the shebang and killed the "does not parse" assertion instead; and a first probe walked a
bare extracted tarball with no `node_modules`, so `fs-extra` and `chalk` showed unresolved in
**both** arms — the "scratch harnesses need their dependencies" trap.

#### AC4 — the gates

**AC4's premise is wrong for one of the two gates it names.** `agent-surface-parity` does not
assert against the packed tree: it shells `git show` and compares refs (`grep -c 'npm
pack\|tarball\|\.tgz'` over that file → **0**). It is invariant to this change. **`fresh-install`
is the only real AC4 evidence.**

| Gate | Result |
|---|---|
| `fresh-install` | **PASS**, exit 0 — 460 files, 332 `.md`, 10 findings across 3, all 14 bins resolve |
| `agent-surface-parity` (`v4.0.1` → HEAD; `v4.0.1` is what `git describe --tags --abbrev=0 --match 'v*'` returns, which is what CI uses) | exit 0 — *not evidence for this change; see above* |
| `install-scope-check`, `docs:audit` | exit 0 |
| `npm run lint` | 0 |
| `npm test` | **0 failures**, 1 pre-existing skip (in `tests/unit`; `tests/audit` reports 0). *Count not quoted — it moved as review added and then removed tests* |

`[installed-tree status 1]` in the harness is **pre-existing and unrelated**: the single finding is
`_bmad/bme/_portability/ is in files[] but did not arrive`, which is `dist-2-6`'s work. Constant
across every harness run in this session, including the pre-change baseline.

#### T5 — the tooling still works from the repository

`node --test tests/lib/format-conversion-load.test.js` → **15 tests, 0 failures**. That suite
requires every module under the directory. `npx eslint --format json <dir>` → 0 errors across 5
linted files, which the new test now asserts by *running* eslint rather than by reading its config.

#### The detour, and why the mechanism changed

**This story's own work has been correct and unchanged since the first attempt.** Everything below
is collateral, and it is recorded because it cost three review rounds.

The first implementation excluded the directory with `!scripts/migration/format-conversion` in
`files[]`. That put a glob metacharacter into an array that `scripts/audit/lib/installed-tree.js`
parses to build the expected set of `_bmad/bme/*` modules — so it reported the negation as
"cannot be resolved to a module name, so nothing in it was checked": a false finding in a gate.

Teaching that parser to tell a harmless negation from a pattern that shrinks the expectation set
means re-deriving npm's glob semantics by hand. **Four attempts were written and adversarial review
broke every one:**

| Attempt | Rule | Broken by |
|---|---|---|
| original | report anything containing `[*?[]{}!]` | false-flagged the negation itself |
| Round 1 | report if the entry contains the literal `_bmad`, or leads with a wildcard | `_?mad/bme/*`, `_bma[d]/bme/*` — silently dropped |
| Round 2 | report unless the literal prefix before the first glob can reach `_bmad/` | `./_bmad/bme/*`, bare `_bmad`, extglob `@(a\|b)`, `_BMAD`, glob-free `!_bmad/` |
| Round 3 | **invert the default** — report unless a literal segment provably diverges | `scripts/../_bmad/bme/_ghost` and `\_bmad/bme/*`, both of which npm resolves and ships |

Every one of those was a **silent under-report**, and each attempt's comment asserted a
completeness the code did not have.

**The resolution was to remove the need for the parser change, not to attempt a fifth.** A
`.npmignore` *inside* the directory excludes it with no pattern in `files[]` at all, so the
interaction does not arise. Verified: a **root** `.npmignore` does *not* work when `files[]` is
present; it must live in the directory. `installed-tree.js` and `tests/audit/installed-tree.test.js`
were reverted to the baseline — **0 diff** — and every finding about them is moot.

**Operator ruling 2026-09-06 approved the Round-3 inversion, on this agent's recommendation, and
that recommendation was wrong.** Round 3 broke it within minutes. The option actually taken —
eliminate the interaction rather than manage it — was available from the first round and was
under-weighted twice.

**One hole is left behind and is now unowned.** The reverted baseline guard has the same defect
Round 3 found: `shippedBmeModules(['scripts/../_bmad/bme/_ghost'])` returns no module and no
report, while npm resolves the `..` and ships `_ghost`. It is pre-existing, this story no longer
touches that file, and it is **filed to the backlog** rather than left implicit.

#### Spec text this record contradicts

`dev-story` does not permit this agent to edit spec sections, so these stand uncorrected:

| Where | Says | Measured |
|---|---|---|
| One-line summary, AC1, AC6-adjacent prose | 18 of **27**, 9 remain | 18 of 28, **10** remain |
| AC1 | **all 18** point at `_bmad-output/`, `project-context.md`, `tests/` | 17 of 18; the 18th is a dangling gitignored path |
| AC1 | "excluded from `files[]`" | excluded from the **tarball**; `files[]` unchanged |
| AC2 | "no test resolves into it at runtime" | two do |
| AC4 | "461 before" | 467 |
| AC4 | "both assert against the packed tree" | `agent-surface-parity` does not |

### Review Findings

Three rounds ran. Their dispositions are below; **no severity tally is restated in any header** —
twice in this story a hand-counted tally disagreed with the list beside it, the second time
regressing the very patch that removed the first. Derive one instead:

```
awk '/^\*Round . patched/,/^\*Round . (deferred|filed)/' <this file> \
  | grep -oE '— (HIGH|MEDIUM|LOW)' | sort | uniq -c
```

**Rounds 1 and 2** produced 25 dispositions against the `files[]`-negation implementation. **Most
of them are now moot**, because the code they applied to was reverted: every finding about
`shippedBmeModules`, its four rewrites and its tests died with the mechanism. They are not
re-listed here; what survived the change of mechanism is carried into the notes above — the AC1
enumeration defect, the AC2 "verified by execution" overstatement, the AC4 gate premise, the
`.c8rc.json` coverage precision, the base-tag and `file:line` citations, and the false
package.json-readers claim.

Two process failures from those rounds are recorded because they are about method, not text:

- A Round 1 patch item was marked `[x]` and **never applied** — one string replacement omitted its
  `assert`, silently no-op'd, and the ledger recorded it as done. Every replacement since asserts
  before writing, and that discipline caught two further mismatches the same day.
- A false enumeration reached **`package.json`** — the published artifact — before Round 2 caught it.

**Round 3, 2026-09-06 — the final round.** Blind Hunter and Acceptance Auditor, both blind.

*Round 3 patched (7):*

- [x] [Review][Patch] The whole mechanism rested on an **untracked** file omitted from the File List and Commit Plan — HIGH — verified by deleting only `.npmignore` from a clean copy: `npm pack` then shipped **467 files including all 7**, so a commit built from that list would publish a `package.json` claiming the directory does not ship while it ships. Now in the File List, called out in the Commit Plan, and the tarball test would catch it in CI.
- [x] [Review][Patch] The record described an implementation that no longer existed — HIGH — the mechanism was replaced mid-audit and the notes still documented the `files[]` negation and a rewritten `shippedBmeModules`. Rewritten against what is on disk.
- [x] [Review][Patch] AC1's instrument is not met and no deviation was recorded — HIGH — the directory is excluded from the tarball, not from `files[]`. Now stated as a deviation, as AC2's already was.
- [x] [Review][Patch] A severity tally in a header disagreed with its own list — HIGH — claimed 4/7/4 against 4/8/2 across 14 items, **regressing this story's own Round 1 patch** which had removed a header count for exactly that reason. No header restates a count now; the derivation command is given instead.
- [x] [Review][Patch] The fourth broken attempt was recorded only in a code comment, not the ledger — MEDIUM — now in the attempts table above with what broke it.
- [x] [Review][Patch] The "still linted" test read eslint's config instead of running eslint — LOW — narrowing eslint's globs would have left it green. It now runs `npx eslint --format json` and asserts both zero errors **and** a non-empty file list, so "clean" cannot mean "linted nothing".
- [x] [Review][Patch] A stale comment in the test said "Removed from files[] ONLY" — LOW — it never was.

*Round 3 filed to the backlog (1):* the `..`-traversal hole in the baseline `shippedBmeModules`,
which this story no longer touches and which nothing now owns.

*Round 3 disclosed, not fixed (1):* the claim that the tarball test "was green under the old guard"
is **unreproducible** — that guard was rewritten and the file has never been committed, so the
pre-Round-2 version exists nowhere. The falsifiable half does hold and was re-run: appending `**`
to a copy's `files[]` leaks 7 files and turns the assertion red.

**The round cap is reached and there is no Round 4.** The auditor's verdict on the previous state
was *not fit to close*, and its stated remedy was a record rewrite plus a re-run of Round 2's
checks against the `.npmignore` mechanism, with the untracked file staged — which is what the
above is. Note the direction of travel: the final change is **smaller** than every version that
preceded it, and two source files went back to baseline.

### File List

- `scripts/migration/format-conversion/.npmignore` (**NEW — UNTRACKED; the entire mechanism lives here. Staging the rest without this file publishes the directory**)
- `package.json` (modified) — the `"//files"` rationale key only; `files[]` is byte-identical to baseline
- `tests/lib/format-conversion-exclusion.test.js` (new) — 6 tests: the `.npmignore`, no glob metacharacter in `files[]`, the packed tarball asked of npm, the rationale in both places, the directory still on disk, and eslint actually run over it
- `_bmad-output/implementation-artifacts/dist-2-3a-exclude-the-conversion-tooling-from-the-package.md` (modified)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified) — two filings
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — `in-progress` → `review`

**Not in this change, deliberately:** `scripts/audit/lib/installed-tree.js` and
`tests/audit/installed-tree.test.js` were modified across Rounds 1-3 and are now **byte-identical
to baseline**. `git diff` lists neither.
