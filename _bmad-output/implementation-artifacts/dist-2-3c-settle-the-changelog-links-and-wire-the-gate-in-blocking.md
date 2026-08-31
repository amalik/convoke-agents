# Story 2.3c: Settle the CHANGELOG links and wire the gate in, blocking

Status: ready-for-dev

<!-- baseline_commit deliberately ABSENT — stamped by dev-story at implementation start. -->

> **Split from Story 2.3 on 2026-08-31.** Class 3 of
> [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md), plus the wiring step
> that made the original story too large to review. Siblings: `dist-2-3a`, `dist-2-3b`.
>
> **This is the last of the three and it carries the gate.** It must not start until 2.3a and 2.3b
> have landed and the finding count is zero.

## Story

As a **Convoke operator**,
I want the link gate actually enforced,
so that **the next broken reference is caught by CI rather than by someone reading carefully**.

### What this story is, in one line

Clear the final 4 findings in `CHANGELOG.md`, then wire Story 2.2's checker into
`try-fresh-install.sh` as blocking **in the same commit that turns it green**.

---

## Acceptance Criteria

**AC1 — The migration guide ships**

**Given** `CHANGELOG.md` links `docs/migration/3.x-to-4.0.md` twice (`:44`, `:83`) and `docs/` is
not in `files[]`
**When** this story completes
**Then** `docs/migration/` is added to `files[]` — the migration guide is the single most useful
link an upgrading npm reader can follow
**And** only `docs/migration/`, not `docs/` wholesale

**AC2 — The other two become validated absolute URLs**

**Given** ADR-002 Amendment 2(2) settles these as absolute rather than dropped, because Amendment 1
now makes them **validated** rather than unchecked
**When** this story completes
**Then** `_bmad-output/planning-artifacts/adr/v63/adr-001-retire-m9-pf1-gate.md` (`:54`) and
`docs/BMAD-METHOD-COMPATIBILITY.md` (`:1205`) are rendered as self-referential absolute URLs
**And** both are confirmed resolvable by Story 2.2's AC5 clause, not by eye — both verified present
2026-08-31
**And** `CHANGELOG.md` then contributes **zero** findings, derived

**AC3 — Zero findings before the gate is wired**

**Given** NFR10 forbids a gate and its first fix landing together, and `fresh-install` gates every
PR and every publish
**When** this story begins its wiring step
**Then** the checker is run and observed reporting **zero** findings across the whole packed tarball
**And** that output is recorded in Completion Notes **before** the wiring diff is written
**And** if any finding remains, the wiring does not proceed — the remedy belongs to whichever
sibling story owns that class, not here

**AC4 — Wired blocking, in the same commit that turns it green**

**Given** Story 2.2 deliberately left the checker outside the harness verdict
**When** this story completes
**Then** the checker is placed in `try-fresh-install.sh`'s failure path, **blocking**, in the same
commit as AC1 and AC2 — it is never merged non-blocking
**And** `continue-on-error` appears nowhere. A gate that runs and nobody watches is T32, the row
this epic exists to close
**And** the harness's verdict condition is edited **exactly once**, adding the new status variable
alongside `INSTALL`, `DOCTOR`, `EXPORT` and `FAILED`

**AC5 — The gate is proven able to fail after wiring**

**Given** `try-fresh-install.sh` has a documented history of at least five fail-open defects, every
one of which reported PASS while doing nothing
**When** the gate is wired
**Then** a deliberately broken relative link is planted in a shipped `.md`, the harness is run, and
it is observed **exiting non-zero**; the link is restored and it is observed exiting zero
**And** both outputs are recorded — `verification-must-be-falsifiable`
**And** any command substitution feeding the pass/fail decision fails **closed**

**AC6 — The epic's detection pair is complete, and says so**

**Given** `dist-2-4` wired the installed-tree assertion (what arrives on disk) and this story wires
the documented-reference checker (what the docs claim)
**When** this story completes
**Then** Completion Notes record that FR12 and FR13 are both now enforced in the same job, and
restate the boundary: this checker cannot see a file read at runtime but absent from the package,
and that assertion cannot see a broken link. Neither subsumes the other

---

## Tasks / Subtasks

- [ ] **T1** — Confirm `dist-2-3a` and `dist-2-3b` have landed
- [ ] **T2** — Add `docs/migration/` to `files[]` (AC1)
- [ ] **T3** — Rewrite the two CHANGELOG links as absolute (AC2)
- [ ] **T4** — Re-pack; run the checker; record **zero** (AC3). **Stop here if non-zero**
- [ ] **T5** — Wire into the verdict, blocking (AC4)
- [ ] **T6** — Plant-and-restore falsifiability demonstration (AC5)
- [ ] **T7** — Re-run `agent-surface-parity` and `fresh-install`; record counts

---

## Dev Notes

### The ordering constraint is the whole point of this story existing separately

Story 2.2 built the checker and did not wire it. 2.3a removes 18 findings, 2.3b removes 5, this
story removes the last 4 and only then wires. If any of those is incomplete, wiring here turns
`fresh-install` red — and because `publish` `needs:` it, that blocks **every PR and every release**
until the missing fix lands.

AC3 exists so that is discovered by a check, not by a blocked repository.

### Expected finding trajectory

```
2.2 red demonstration     27  across 4 files
after 2.3a (Class 1)       9  (-18)
after 2.3b (Class 2)       4  (-5)
after 2.3c AC1+AC2         0  (-4)   <- gate wired here
```

Derive each number at implementation time. If the trajectory does not match, something else changed
and that is worth understanding before wiring.

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-2` | **Blocking.** Builds the checker |
| `dist-2-3a`, `dist-2-3b` | **Blocking.** Must both land first (AC3) |
| `dist-2-4` | Shipped. Its assertion is already wired; this completes the pair |

### References

- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) Class 3; **Amendment 1**; **Amendment 2(2)**
- `scripts/audit/try-fresh-install.sh` — verdict condition; see `dist-2-4` for the ENV_FAIL convention
- T32 — the row this epic exists to close: a check that exists but is not enforced

---

## Commit Plan

```
fix(dist-2-3c): settle the CHANGELOG links and enforce the shipped-link gate
```

Body: the zero-finding output from AC3 **before** the wiring diff, the plant-and-restore
demonstration from AC5, the derived trajectory, and both packed-gate re-runs.

---

## Change Log

| Date | Change |
|---|---|
| 2026-08-31 | Split from Story 2.3. AC2 settled per ADR-002 Amendment 2(2); AC3 added as an explicit stop-gate before wiring; AC5 added from the harness's fail-open history. |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
