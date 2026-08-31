# Story 2.5: Ship the dependency registry and close BUG-19

Status: ready-for-dev

<!-- baseline_commit deliberately ABSENT — stamped by dev-story at implementation start. -->

> **Rescoped 2026-08-31, and renamed.** Was *"Close BUG-19 — ship the registry and fix the label
> that contradicts it"*. **FR17, the label half, already shipped** in `21ae3105` — a commit whose
> own subject names this story. What remains is FR18 plus the copy step FR18 alone does not provide.

## Story

As a **Convoke operator**,
I want `convoke-doctor` to find the dependency registry after an npm install,
so that **a healthy install does not warn me about a file that simply was not shipped**.

### What this story is, in one line

Put `_bmad/_config/bmm-dependencies.csv` in `files[]` **and** give it a copy path into the user's
project — because `files[]` alone gets it as far as `node_modules/` and no further.

---

## Acceptance Criteria

**AC1 — The file is in the package**

**Given** `_bmad/_config/bmm-dependencies.csv` is git-tracked but absent from `files[]`, whose only
`_bmad/_config/` entry is `skill-manifest.csv` — verified 2026-08-31: `grep -c bmm-dependencies
package.json` returns **0**
**When** this story completes
**Then** the file is in the package, confirmed by inspecting a real `npm pack` output rather than
the diff

**AC2 — And it reaches the project, which `files[]` alone does not achieve**

**Given** `refreshInstallation` copies `_bmad/_config/` **per named file, never as a directory** —
`skill-manifest.csv` is seeded at `:551`/`:585`, `workflow-manifest.csv` at `:876`, `agents/` at
`:983`, and **`bmm-dependencies.csv` appears in no copy or seed path anywhere in
`scripts/update/lib/`** (verified 2026-08-31)
**When** an install or refresh runs
**Then** the file arrives in the user's project at `_bmad/_config/bmm-dependencies.csv`
**And** the story states plainly that **AC1 without AC2 does not close BUG-19** — it would move the
file from *absent everywhere* to *present in `node_modules/` and still absent where the doctor
looks*, which produces the identical warning and a false belief that it was fixed
**And** the copy honours `isSameRoot`, as every sibling copy block does

**AC3 — Proven against an installed package, not this repository**

**Given** this repository has reported `✓ registry consistent` since the file was committed, while
nothing changed for any npm-installed operator — the population BUG-19 came from
**When** the fix is verified
**Then** `convoke-doctor` is run inside a **fresh install in a clean project**, and the
BMM-dependency check does not report the registry absent
**And** the verification is **not** performed in this repository, where it cannot fail

**AC4 — `dist-2-4`'s assertion covers it, and is seen to**

**Given** `dist-2-4` shipped an installed-tree assertion whose red demonstration fired on **both**
`_portability` and `bmm-dependencies.csv`
**When** this story completes
**Then** that assertion is re-run and observed **no longer reporting `bmm-dependencies.csv`**
**And** `_portability` is still reported, since `dist-2-6` has not landed — so the assertion is
demonstrably still red for the right reason, not green for the wrong one
**And** the assertion is **not** wired into the verdict by this story; `dist-2-6` does that

**AC5 — NFR8: the soft-warn contract is untouched**

**Given** NFR8 — `preflight-soft-warn` must remain intact, and BUG-19(b) is out of scope
**When** this story completes
**Then** `softWarning: true` and the exit-0 pass-through in `checkBmmDependencies` are unchanged
**And** the `fix:` line's pinning to the running build (`npx -p convoke-agents@${pv}`, per BUG-16)
is preserved
**And** the FR17 label shipped in `21ae3105` is **not re-edited** — it already reads
`'BMM dependencies: registry missing'` on the absent branch

**AC6 — BUG-19 closes, as a move**

**Given** both halves are now delivered — FR17 in `21ae3105`, FR18 here
**When** this story completes
**Then** backlog row **BUG-19** is closed **as a move**: status flipped, row deleted from the Bug
Lane, receipt appended to §2.5, Change Log entry added — all in the same edit
(`backlog-write-discipline`; closing a row is a MOVE, not a status edit)
**And** `node scripts/audit/backlog-integrity.js` is run and its result pasted into the commit
Description
**And** the `sprint-status.yaml` divergence warning naming this story clears

---

## Tasks / Subtasks

- [ ] **T1** — Add `_bmad/_config/bmm-dependencies.csv` to `files[]`; confirm against `npm pack` (AC1)
- [ ] **T2** — Add the copy/seed path, mirroring the named-file blocks; honour `isSameRoot` (AC2)
- [ ] **T3** — Fresh install in a clean temp project; run `convoke-doctor`; record output (AC3)
- [ ] **T4** — Re-run `assert-installed-tree.js`; confirm one finding remains, not zero (AC4)
- [ ] **T5** — Regression test for the copy, isolated fixture (`test-fixture-isolation`)
- [ ] **T6** — Close BUG-19 as a move; run `backlog-integrity.js` (AC6)

---

## Dev Notes

### What changed, and the design lesson in it

This story was deliberately created by **merging** FR17 and FR18 on 2026-08-19, so that one story
would close BUG-19 "by it alone" — the epic subtracted an earlier two-epic split for exactly that
reason. FR17 then shipped separately anyway, in `21ae3105`, which is the outcome the merge existed
to prevent. The 2026-08-30 readiness assessment found the story still reading `backlog` with half
its substance already delivered.

`sprint-status.yaml` was left at `backlog` deliberately rather than flipped, on the grounds that
re-scoping is an authoring job and `done` would be a false claim. **This story is that re-scope.**

### The trap this story exists to avoid

`files[]` membership and project presence are different things, and this file needs both. The
package's `_bmad/_config/` is assembled **per named file**, so adding an entry to `files[]` gets the
file into `node_modules/convoke-agents/_bmad/_config/` and stops there. The doctor reads
`path.join(projectRoot, BMM_DEPS_CSV_REL)`. Ship without copy and the warning is unchanged — while
every gate and every reviewer sees a `files[]` diff that looks like the fix.

This is ADR-004 C4 restated on a different file: *shipping is not installing; installing is not
invoking.*

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-4` | **Shipped.** Its red demonstration covered this file; AC4 re-runs it |
| `dist-2-6` | **Blocked on this.** Its AC8 wires the assertion only when it has no findings left, which needs this story **and** 2.6's own `_portability` fix |
| `BUG-19` | Closes here (AC6) |

### References

- `scripts/convoke-doctor.js` — `checkBmmDependencies`, FR17 label shipped in `21ae3105`
- `scripts/update/lib/refresh-installation.js:551`, `:585`, `:876`, `:983` — the named-file copy pattern to mirror
- `scripts/audit/assert-installed-tree.js` — the assertion from `dist-2-4`
- ADR-004 C4 — shipping is not installing

---

## Commit Plan

```
fix(dist-2-5): ship the dependency registry and close BUG-19
```

Body: the `npm pack` confirmation, the clean-project doctor output, the `assert-installed-tree`
before/after showing one remaining finding, and the `backlog-integrity.js` result for the BUG-19
move.

---

## Change Log

| Date | Change |
|---|---|
| 2026-08-31 | Rescoped and renamed. FR17 shipped separately in `21ae3105`; ACs reduced to FR18 plus the copy step. AC2 added — `files[]` alone leaves the file in `node_modules/`, since `_bmad/_config/` is copied per named file. AC4 added to keep `dist-2-4`'s assertion honestly red. |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
