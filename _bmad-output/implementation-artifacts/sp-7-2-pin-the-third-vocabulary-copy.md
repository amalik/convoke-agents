# Story sp-7.2: Pin the third vocabulary copy and end the VALID_TIERS collision

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the maintainer,
I want all three classification-vocabulary copies pinned to each other, and the `VALID_TIERS` name collision inside `scripts/audit/` ended,
so that a vocabulary widened in one place cannot pass unnoticed, and one identifier does not mean two different things in one directory.

## Acceptance Criteria

**AC1 — The third copy is pinned.** `tests/audit/skill-manifest-integrity.test.js` fails when `scripts/portability/validate-classification.js`'s `VALID_TIERS` or `VALID_INTENTS` diverges from `scripts/portability/classify-skills.js`'s. It already exports both arrays, so no production change is needed. *(Today its comment claims "must match classify-skills.js" and nothing enforces it.)*

**AC2 — The pin cannot be satisfied by importing, from EITHER direction.** With three copies — writer **A** (`classify-skills.js`), checker **B** (`skill-manifest-integrity.js`), checker **C** (`validate-classification.js`) — the existing checks cover A↔B only. Required:
- **Three identity assertions**: A/B, A/C **and B/C**. Without B/C, `C` importing from `B` leaves `notStrictEqual(C, A)` passing on two distinct instances that are secretly one value.
- **A source assertion per checker naming BOTH of its counterparts.** The existing regex (`tests/audit/skill-manifest-integrity.test.js:540`) matches only `classify-skills`; a `require('../audit/skill-manifest-integrity')` inside C passes it today.

This is not hypothetical rigour: sp-7-1 Round 3 found a source regex that matched one spelling and was defeated by adding `.js`, leaving the whole suite green while a bogus tier audited `✓ PASS`.

**AC3 — One identifier, one vocabulary, inside `scripts/audit/`.** Rename `name-registry-integrity.js`'s `VALID_TIERS` to **`VALID_OWNERSHIP_TIERS`** — declaration `:54`, uses `:527` and `:529`, export `:659`. The name is decided here, not by the implementer: the registry's tier column carries *ownership* (`bmad-upstream`, `convoke`, `practice`, `client`, `unassigned`), and prefixing is what removes the collision. Verify with:

```
grep -rnw 'VALID_TIERS' scripts/audit/
```

Expected after this story: **exactly three lines, all in `skill-manifest-integrity.js`** (`:79` declaration, `:429` use, `:696` export). `-w` matters — a plain substring grep is satisfied by `VALID_TIERS_OWNERSHIP`, which is the same shadowing class as sp-7-1's Round 1 HIGH.

**AC4 — Every portability site names its role and its counterparts.** Each of the three declarations states whether it is the **writer** or a **checker**, names the other two, and says the duplication is deliberate independence rather than drift. A reader arriving at any one site can tell which it is without grepping.

**AC5 — Falsifiability recorded as a mutant→test table, not a tally.** For every new assertion, record the edit made and the **named `it()` that goes red**:

| Mutant | Expected red test |
|---|---|
| widen `validate-classification.js:44` `VALID_TIERS` | *(the new A/C tier assertion, by name)* |
| widen `validate-classification.js` `VALID_INTENTS` | *(the new A/C intent assertion)* |
| make C re-export B's array (identity mutant) | *(the new B/C identity assertion)* |
| make C `require` B and spread (source mutant) | *(the new C source assertion)* |

Two absorption risks to check rather than assume: mutating `classify-skills.js:35` reddens many unrelated writer tests, so a red suite proves nothing about the new pin; and mutating `validate-classification.js:44` may be absorbed by `tests/lib/portability-validation.test.js:227` depending on the injected value. Pick mutants that isolate the new assertions.

**AC6 — No regressions.** `npm test` passes, `npm run lint` reports zero warnings, and **both** audits still exit 0: `node scripts/audit/name-registry-integrity.js` and `node scripts/audit/skill-manifest-integrity.js` (Task 3 edits a block comment directly above a `const` in the latter).

**AC7 — The spec is re-derived.** `SPEC.md` CAP-4 and CAP-5 are marked satisfied, Delivery-sequence item 2 is struck, and the outcome is appended to `.memlog.md`. sp-7-1's Round 1 HIGH was exactly this omission — the spec still prescribing an approach the implementation had abandoned.

## Tasks / Subtasks

- [ ] **Task 1 — Read before writing** (AC1, AC2)
  - [ ] Read `tests/audit/skill-manifest-integrity.test.js:480-544` end to end — the scope comment, the describe, and the anti-tautology `it` with its Round 3 reasoning
  - [ ] Note `fs` (`:5`) and `path` (`:7`) are already imported; no new requires needed
  - [ ] Confirm `validate-classification.js:540-549` exports `VALID_TIERS` and `VALID_INTENTS`

- [ ] **Task 2 — Pin the third copy** (AC1, AC2, AC5)
  - [ ] RED first: add the A/C assertions, mutate, confirm the named test goes red
  - [ ] Add the **B/C identity** assertion and a source assertion for C naming **both** counterparts; mutate each separately
  - [ ] Extend the existing describe — one home for the whole pin — and rename it, since "pinned against the writer" no longer describes B/C
  - [ ] Fix **both** stale sentences in its scope comment: `:487` ("One further copy exists") **and `:488` ("collapsing all four into one module")** — there are three copies, and `:488` was missed when sp-7-1 rewrote `:487`
  - [ ] Add one sentence justifying why a pin covering two `scripts/portability/` modules lives in the audit's test file

- [ ] **Task 3 — Name the roles, and fix two false claims** (AC4)
  - [ ] `classify-skills.js:35` — mark as the WRITER, name both checkers
  - [ ] `validate-classification.js:44` — mark as a CHECKER; replace "must match …" with the reason it is a separate copy plus a pointer to the enforcing test
  - [ ] `skill-manifest-integrity.js:72-78` — **the copy count and counterpart list here are already correct; do not touch them.** Two other claims in that block are false and are what needs fixing:
    - `:73-74` "PINNED against **every other copy** … **which fails if any copy drifts**" — false today (it pins one of two); true only once Task 2 lands
    - `:77` "Collapsing the remaining three … **is filed in `deferred-work.md`**" — the row it points at (`deferred-work.md:1186`) is marked **CLOSED by sp-7-1**

- [ ] **Task 4 — End the collision** (AC3, AC6)
  - [ ] Rename at the four sites in `name-registry-integrity.js` (`:54`, `:527`, `:529`, `:659`)
  - [ ] Leave the `unassigned` ADR comment at `:50-53` and the vocabulary's **contents** untouched — this renames an identifier, it does not reopen that ruling
  - [ ] **Proof is the test suite, not a CLI diff.** `tests/audit/name-registry-integrity.test.js` drives the tier branch behaviourally at `:189`, `:214`, `:582` and `:610`. The live registry produces **zero** `row/tier` findings, so a before/after CLI comparison cannot fail and must not be cited as evidence (`verification-must-be-falsifiable`)
  - [ ] Update or mark historical the one doc reference: `deferred-work.md:1215` cites `VALID_TIERS.includes(...)` for this module
  - [ ] Run `grep -rnw 'VALID_TIERS' scripts/audit/` and confirm the exact three expected lines

- [ ] **Task 5 — Re-derive the spec** (AC7)
  - [ ] Mark CAP-4 (`SPEC.md:36-39`) and CAP-5 (`:41-43`) satisfied; strike Delivery-sequence item 2 (`:88`)
  - [ ] Append the outcome to `.memlog.md` via `python3 _bmad/scripts/memlog.py append`

- [ ] **Task 6 — Validate and hand over** (AC5, AC6)
  - [ ] `npm test` (`node scripts/test-runner.js tests/unit tests/team-factory tests/lib tests/audit`) and `npm run lint` (`eslint --max-warnings 0 scripts/ index.js tests/`)
  - [ ] Produce the AC5 mutant→test table
  - [ ] Commit plan per `commit-preparation`, including the **reviewed-set = committed-set** assertion: the files the review saw must equal the files the plan stages. Test files written in response to a review finding are the canonical gap, and this story produces exactly those

## Dev Notes

### Verified at authoring, 2026-09-09 — re-derive only if you doubt it

Each with the command that re-establishes it, so checking stays cheap:

| Fact | Command |
|---|---|
| `validate-classification.js` declares at `:44-55`, exports at `:540-549` | `sed -n '44,55p;540,549p' scripts/portability/validate-classification.js` |
| Nothing pins C — only A↔B is pinned | `grep -rn "VALID_TIERS" tests/` |
| Existing pin at `tests/audit/skill-manifest-integrity.test.js:480-544` | `sed -n '480,544p' …` |
| Rename blast radius is 4 sites, all in `name-registry-integrity.js` | `grep -rnw VALID_TIERS scripts/ tests/` |
| That test imports `REQUIRED_COLUMNS`, `VALID_STATUSES`, `OPERATIONAL` — **not** `VALID_TIERS` | `sed -n '11,26p' tests/audit/name-registry-integrity.test.js` |
| Live registry emits zero `row/tier` findings | `node scripts/audit/name-registry-integrity.js` |
| Both audits run in the `agent-surface-parity` job | `grep -n "audit/" .github/workflows/ci.yml` |

### Why the copies stay copies

**Do not collapse the three portability declarations into a shared module.** sp-7-1 Round 2 tried importing the audit's vocabulary from `classify-skills.js` and proved the defect: widening the writer made the checker accept a bogus tier **with zero test failures**. A checker must not take its definition of "valid" from the module it polices. The duplication is the safety property; the pin is what stops it becoming drift.

This story *adds* a pin; it removes no copy. AC4 exists so the next reader understands that before they "tidy" it. `shared-test-constants` is the rule deliberately **not** applied here.

### The collision

`scripts/audit/` holds two `VALID_TIERS` meaning different things:

| File | Values | Domain |
|---|---|---|
| `skill-manifest-integrity.js:79` | `standalone, light-deps, pipeline` | portability classification |
| `name-registry-integrity.js:54` | `bmad-upstream, convoke, practice, client, unassigned` | name-registry ownership |

Only the second moves. The first is shared by name with two `scripts/portability/` modules and an existing test.

### Traps

1. **Do not import to satisfy the pin.** AC2 exists because it is the obvious shortcut and it silently voids the check — in both the A↔C and the B↔C direction.
2. **Do not rename the portability `VALID_TIERS`.** Three modules and an existing test depend on that name.
3. **Substring shadowing.** Verify the rename with `grep -rnw`, not a bare substring grep: `VALID_TIERS_OWNERSHIP` satisfies the latter. This is the class of sp-7-1's Round 1 HIGH, where `### Tier classification rules` satisfied a check for `## Tier`.
4. **`derive-counts-from-source`.** Two comments in this codebase currently state copy counts; one is stale. If you write a count, derive it at the moment you write it.
5. **Do not "fix" the correct.** `skill-manifest-integrity.js:75-77`'s count and counterpart list are right. An earlier draft of this story told the implementer to update them, which would have made a correct thing wrong.

### Review budget

sp-7-1 took three rounds; every round's HIGH findings were defects in the previous round's corrections, and it closed by **deleting** the component rather than patching it a fourth time. Per `code-review-convergence`: if Round 2's HIGHs are defects in Round 1's corrections, **change the instrument rather than patch again**.

### Project Structure Notes

- No new files, no new dependencies, no CI wiring — both audits already run in `agent-surface-parity`.
- `sprint-status.yaml:508` still shows `sp-7-1` at `review`; this story builds on its landed code. T79's owed-close scan runs in the same CI job.
- **Namespace decision:** every touched path is Convoke-owned (`scripts/`, `tests/`, `_bmad-output/`). No `_bmad/bme/` skill, workflow or agent is authored, so the Operator Covenant compliance checklist does **not** apply. Recorded explicitly per `namespace-decision-for-new-skills`.

### References

- [Source: _bmad-output/specs/spec-portability-manifest-checkers/SPEC.md#Capabilities] — CAP-4, CAP-5
- [Source: _bmad-output/specs/spec-portability-manifest-checkers/.memlog.md] — the Round 2 ruling that the copies stay independent
- [Source: _bmad-output/implementation-artifacts/sp-7-1-fold-the-schema-lint-into-the-audit.md] — three review rounds, including the `.js`-extension defeat of an earlier pin
- [Source: project-context.md#Rule: verification-must-be-falsifiable] — AC5's mutant→test table
- [Source: project-context.md#Rule: shared-test-constants] — the rule deliberately not applied, and why

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log
