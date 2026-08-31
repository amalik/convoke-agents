# Story 2.3a: Exclude the conversion tooling from the package

Status: ready-for-dev

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

- [ ] **T1** — Verify no runtime resolution into the directory (AC2), reusing `assert-installed-tree.js`
- [ ] **T2** — Add the exclusion to `files[]` with the AC3 comment
- [ ] **T3** — Re-pack; confirm the 18 findings are gone and 9 remain; derive both counts
- [ ] **T4** — Re-run `agent-surface-parity` and `fresh-install`; record the new file count
- [ ] **T5** — Confirm the i97 conversion tooling still runs from the repo (one conversion dry-run or its test suite)

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

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
