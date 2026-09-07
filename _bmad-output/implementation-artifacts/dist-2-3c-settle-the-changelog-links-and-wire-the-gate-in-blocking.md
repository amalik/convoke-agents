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

**AC2b — The name-registry citation, per ADR-002 Amendment 3(1)**

**Given** `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md:133`
cites `_bmad/bme/_config/name-registry.csv` as the **name authority** — *"where the two disagree,
the registry wins"* — and the source ships while the target does not
**And** it arrived 2026-09-05 in `154719e3`, after ADR-002 drew its three classes, so it belongs to
none of them and to no sibling story
**When** this story completes
**Then** `_bmad/bme/_config/` is **NOT** added to `files[]` — Amendment 3(1) rules the registry a
development-state inventory, not operator reference, and it fails this ADR's own
`project-context.md` required-reading test
**And** the link is rendered as a self-referential absolute URL
(`https://github.com/amalik/convoke-agents/blob/main/_bmad/bme/_config/name-registry.csv`),
validated by Story 2.2's AC5 clause rather than by eye
**And** `lifecycle-process-spec.md` then contributes **zero** findings, derived

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
- [ ] **T3a** — Rewrite the `lifecycle-process-spec.md:133` citation as an absolute URL (AC2b)
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
2.2 red demonstration      27
after 2.3a (Class 1)        9
 + 154719e3 (2026-09-05)   10   <- AC2b's finding arrives BETWEEN 2.3a and 2.3b
after 2.3b (Class 2)        5   <- 28cbf81c: "10 across 3 files -> 5 across 2"
after 2.3c AC1+AC2          1   <- NOT zero
after AC2b                  0   <- gate wired here
```

**The `9 -> 10` step is not an error.** The original table put Class 1's residue at 9; `28cbf81c`
reports starting from 10. The extra finding is AC2b's, which landed in `154719e3` on 2026-09-05 —
after `dist-2-3a` and before `dist-2-3b`.

**Measured 2026-09-07** against the committed tree at `5b974787`: `npm pack && node
scripts/audit/assert-shipped-links.js <tarball>/package .` -> `5 finding(s) across 2 file(s)` — 4
`CHANGELOG.md`, 1 `lifecycle-process-spec.md`.

Derive each number at implementation time. If the trajectory does not match, something else changed
and that is worth understanding before wiring.

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-2` | **Blocking.** Builds the checker |
| `dist-2-3a`, `dist-2-3b` | **Blocking.** Must both land first (AC3) |
| `dist-2-4` | Shipped. Its assertion is already wired; this completes the pair |
| *(none)* | **AC2b has no upstream story.** Epic residue, adopted here because this is the last story in the epic and the gate cannot be wired around it |

### References

- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) Class 3; **Amendment 1**; **Amendment 2(2)**
- `scripts/audit/try-fresh-install.sh` — verdict condition; see `dist-2-4` for the ENV_FAIL convention
- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) **Amendment 3(1)** — why the registry does not ship, and what the ruling leaves to the meta-model baseline
- [ADR-004](../planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md) C2 — why `scripts/audit/name-registry-integrity.js` shipping while its input does not is not an FR13 breach
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
| 2026-09-07 | **AC2b added, with T3a.** A shipped-link finding that arrived in `154719e3` (2026-09-05) after ADR-002 drew its classes had no owning story and no backlog row; ADR-002 **Amendment 3(1)** rules it and this story adopts it, because AC3's *"Stop here if non-zero"* makes an unowned finding an epic blocker rather than a wiring delay. Trajectory table corrected against the committed tree — AC1+AC2 leave **1**, not 0, and the `9 -> 10` step is the new finding, not an error. |
| 2026-08-31 | Split from Story 2.3. AC2 settled per ADR-002 Amendment 2(2); AC3 added as an explicit stop-gate before wiring; AC5 added from the harness's fail-open history. |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
