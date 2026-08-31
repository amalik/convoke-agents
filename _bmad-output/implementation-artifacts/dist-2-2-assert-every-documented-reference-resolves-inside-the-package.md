# Story 2.2: Assert every documented reference resolves inside the package

Status: ready-for-dev

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

- [ ] **T1** — Locate the harness's pack/extract step; hook the checker to its output (AC1)
- [ ] **T2** — Link extraction with fence + inline-code stripping, indented fences included (AC3, AC4)
- [ ] **T3** — Self-referential absolute-URL resolution, prefix from `package.json` (AC5)
- [ ] **T4** — Red demonstration; derive the count; record output (AC6)
- [ ] **T5** — Tests: indented fence, flush fence, inline code span, a real broken link, a valid self-referential URL, a broken one. Isolated fixture dirs only (`test-fixture-isolation`)
- [ ] **T6** — Scope documentation at the checker and in Completion Notes (AC7, AC2)

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

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
