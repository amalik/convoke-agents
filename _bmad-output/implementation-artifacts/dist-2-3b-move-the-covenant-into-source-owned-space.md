# Story 2.3b: Move the Covenant into source-owned space

Status: ready-for-dev

<!-- baseline_commit deliberately ABSENT — stamped by dev-story at implementation start. -->

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
`_bmad-output/planning-artifacts/convoke-covenant-operator.md`, and this story moves its target
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

- [ ] **T1** — `git mv` both files; add `_bmad/bme/covenant/` to `files[]`
- [ ] **T2** — Re-derive the reference list; rewrite prose references
- [ ] **T3** — The four non-prose references, individually (AC2 table)
- [ ] **T4** — BUG-13 precondition assertion, then verify by re-running 2.2's checker (AC3)
- [ ] **T5** — README: absolute URL for `project-context.md`; drop the `config.yaml` link (AC4)
- [ ] **T6** — Update self-referential absolute URLs pointing at the old location (AC5)
- [ ] **T7** — Re-run the four gates; record counts (AC6)

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
| 2026-08-31 | Split from Story 2.3. AC4 settled per ADR-002 Amendment 2(1); AC5 added — the Covenant is one of the ten self-referential absolute URLs, so this story is the first real exercise of 2.2's AC5. Count refreshed 47 → 54. |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
