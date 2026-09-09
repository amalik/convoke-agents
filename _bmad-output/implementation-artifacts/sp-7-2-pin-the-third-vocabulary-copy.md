# Story sp-7.2: Pin the third vocabulary copy and end the VALID_TIERS collision

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the maintainer,
I want the third classification-vocabulary copy pinned and the `VALID_TIERS` name collision inside `scripts/audit/` resolved,
so that a widened vocabulary cannot pass unnoticed, and one identifier does not mean two different things in one directory.

## Acceptance Criteria

**AC1 — The third copy is pinned.** `scripts/portability/validate-classification.js` declares `VALID_TIERS` and `VALID_INTENTS` under a comment reading *"must match scripts/portability/classify-skills.js"*, and **nothing enforces that claim**. A test fails when it diverges from the writer. It already exports both, so the test needs no production change.

**AC2 — The pin cannot be satisfied by importing.** The new assertions carry the same anti-tautology property as the existing block: an identity check (`notStrictEqual`, catching a shared instance however the import is spelled) **and** a source check (catching a copying import via spread/slice). Round 3 of sp-7-1 found a single string-match version defeated by adding `.js` to a path — with the original defect reintroduced, the whole suite passed and a bogus tier audited `✓ PASS`.

**AC3 — Every portability site names its role and its counterparts.** Each of the three declarations carries a comment stating whether it is the **writer** (`classify-skills.js`) or a **checker** (`validate-classification.js`, `skill-manifest-integrity.js`), names the other two, and states that the duplication is deliberate independence rather than drift. A reader arriving at any one site must be able to tell which it is without grepping.

**AC4 — One identifier, one vocabulary, inside `scripts/audit/`.** `scripts/audit/name-registry-integrity.js:54` declares `VALID_TIERS = ['bmad-upstream','convoke','practice','client','unassigned']` — a different vocabulary under the same name as the portability one two files away. Rename it to a domain-specific identifier consistent with its own sibling `VALID_STATUSES`. After this story, `grep -rn "VALID_TIERS" scripts/audit/` returns declarations of exactly one vocabulary.

**AC5 — Every new assertion is demonstrated able to fail.** Mutating any single one of the three portability sites reddens the suite; so does making a checker import from the writer. Show each red, per `verification-must-be-falsifiable`.

**AC6 — No regressions.** `npm test` passes, `npm run lint` reports zero warnings, and `node scripts/audit/name-registry-integrity.js` behaves exactly as before the rename.

## Tasks / Subtasks

- [ ] **Task 1 — Read before writing** (AC1, AC2)
  - [ ] Read the existing pinning block in `tests/audit/skill-manifest-integrity.test.js` (the `classification vocabulary — pinned against the writer` describe) end to end, including its Round 3 anti-tautology reasoning
  - [ ] Confirm `validate-classification.js` exports `VALID_TIERS` and `VALID_INTENTS`, and that no existing test pins them

- [ ] **Task 2 — Pin the third copy** (AC1, AC2, AC5)
  - [ ] RED: add assertions that `validate-classification.js`'s vocabulary matches the writer's; confirm they pass, then mutate one site and confirm red
  - [ ] Extend the existing describe rather than starting a new file — one home for the whole pin. Rename it to reflect that it now covers all three sites
  - [ ] Add the identity + source anti-tautology checks for the new site, matching the existing pair
  - [ ] Update the block's own scope comment, which currently says *"One further copy exists (`validate-classification.js`)"* — that sentence becomes false

- [ ] **Task 3 — Name the roles** (AC3)
  - [ ] `classify-skills.js:35` — mark as the WRITER; its current comment says only "locked classification rules from sp-1-2 spec"
  - [ ] `validate-classification.js:44` — mark as a CHECKER; replace "must match …" with the reason it is a separate copy and a pointer to the enforcing test
  - [ ] `skill-manifest-integrity.js:79` — already carries the rationale; update the copy count and counterpart list

- [ ] **Task 4 — End the collision** (AC4, AC6)
  - [ ] Rename `VALID_TIERS` in `name-registry-integrity.js` (declaration `:54`, uses `:527`, `:529`, export `:659`). `VALID_OWNERSHIP_TIERS` fits its own `VALID_STATUSES` sibling; pick deliberately and say why
  - [ ] Verify the blast radius is only those four sites — `tests/audit/name-registry-integrity.test.js` imports `REQUIRED_COLUMNS`, `VALID_STATUSES` and `OPERATIONAL`, **not** `VALID_TIERS`
  - [ ] Run `node scripts/audit/name-registry-integrity.js` before and after; output must be identical

- [ ] **Task 5 — Validate** (AC5, AC6)
  - [ ] `npm test`, `npm run lint`
  - [ ] Mutation-check each of the three portability sites individually; each must redden the suite
  - [ ] Run the AC4 grep and confirm one vocabulary

- [ ] **Task 6 — Commit plan** (AC6)
  - [ ] Produce a commit plan per `commit-preparation`: files, `<type>(<scope>): <intent>`, description with review status, the `git diff --cached --name-only` proof, and a falsifiable clause naming how each cited check was shown able to fail

## Dev Notes

### Why the copies stay copies

**Do not collapse the three portability declarations into a shared module.** Round 2 of sp-7-1 tried importing the audit's vocabulary from `classify-skills.js` and proved the defect: widening the writer made the checker accept a bogus tier **with zero test failures**. A checker must not take its definition of "valid" from the module it polices. The duplication is the safety property; the test is what stops it becoming drift.

This story therefore *adds a pin*, it does not remove a copy. AC3 exists so the next reader understands that before they "tidy" it.

### What already exists

`tests/audit/skill-manifest-integrity.test.js` has a `classification vocabulary — pinned against the writer` block that pins the **audit ↔ writer** pair, with two anti-tautology checks Round 3 hardened. Read it first — the new assertions should mirror its shape exactly, not invent a second style.

Its scope comment is honest about what it does not cover: *"One further copy exists (`scripts/portability/validate-classification.js`)"*. Closing that is this story.

### The collision

`scripts/audit/` currently holds two `VALID_TIERS` meaning different things:

| File | Values | Domain |
|---|---|---|
| `skill-manifest-integrity.js:79` | `standalone, light-deps, pipeline` | portability classification |
| `name-registry-integrity.js:54` | `bmad-upstream, convoke, practice, client, unassigned` | name-registry ownership |

Only the second moves. The first is the canonical portability vocabulary shared with two `scripts/portability/` modules and must keep its name.

Note `name-registry-integrity.js:50-53` carries an unrelated open item about whether `unassigned` is ADR-authorised — **leave that comment and that value alone**; this story renames an identifier, it does not touch the vocabulary's contents or that ruling.

### Project Structure Notes

- No new files. No new dependencies. No CI wiring — both audits already run in the `agent-surface-parity` job.
- **Namespace decision:** every touched path is Convoke-owned (`scripts/`, `tests/`). No `_bmad/bme/` skill, workflow or agent is authored, so the Operator Covenant compliance checklist does **not** apply. Recorded explicitly per `namespace-decision-for-new-skills`.

### Traps

1. **Do not import to satisfy the pin.** AC2 exists because that is the obvious shortcut and it silently voids the whole check.
2. **Do not rename the portability `VALID_TIERS`.** Three modules and an existing test depend on that name.
3. **The rename is mechanical but the export is public** — `name-registry-integrity.js:659` exports it. Grep the whole tree, not just `scripts/audit/`, before assuming the blast radius is four sites.
4. **`derive-counts-from-source`:** if a comment states how many copies exist, derive that number rather than carrying it forward — sp-7-1 shipped a "three other copies" comment that was false by the time it landed.

### References

- [Source: _bmad-output/specs/spec-portability-manifest-checkers/SPEC.md#Capabilities] — CAP-4, CAP-5
- [Source: _bmad-output/specs/spec-portability-manifest-checkers/.memlog.md] — the Round 2 ruling that the copies stay independent
- [Source: _bmad-output/implementation-artifacts/sp-7-1-fold-the-schema-lint-into-the-audit.md] — three rounds of review on the sibling story, including the `.js`-extension defeat of an earlier pin
- [Source: project-context.md#Rule: verification-must-be-falsifiable] — AC5
- [Source: project-context.md#Rule: shared-test-constants] — the rule this story deliberately does *not* apply, and why

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
