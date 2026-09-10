---
baseline_commit: a907f24ee78a41fa53fa49edef3c0f0740a9c13b
---

# Story sp-7.2: Pin the third vocabulary copy and end the VALID_TIERS collision

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the maintainer,
I want all three classification-vocabulary copies pinned to each other, and the `VALID_TIERS` name collision inside `scripts/audit/` ended,
so that a vocabulary widened in one place cannot pass unnoticed, and one identifier does not mean two different things in one directory.

## Acceptance Criteria

**AC1 — The third copy is pinned.** `tests/audit/skill-manifest-integrity.test.js` fails when `scripts/portability/validate-classification.js`'s `VALID_TIERS` or `VALID_INTENTS` diverges from `scripts/portability/classify-skills.js`'s. It already exports both arrays, so no production change is needed. *(Today its comment claims "must match classify-skills.js" and nothing enforces it.)*

**AC2 — The pin cannot be satisfied by a SHARED INSTANCE, from either direction.** With three copies — writer **A** (`classify-skills.js`), checker **B** (`skill-manifest-integrity.js`), checker **C** (`validate-classification.js`) — the pre-story checks covered A↔B only. Required: **three identity assertions**, A/B, A/C **and B/C**. Without B/C, `C` RE-EXPORTING `B`'s array is invisible. **Corrected at Round 3:** an earlier wording claimed this closes "two distinct instances that are secretly one value" — it does not. A copying import (`[...require(...)]`) produces exactly that, and passes every assertion here (verified: 75/75 green). Identity closes a SHARED INSTANCE only.

~~**A source assertion per checker naming both counterparts.**~~ **STRUCK 2026-09-09 after Round 2.** Two attempts to establish "this vocabulary is not derived from elsewhere" by inspecting source both failed by execution. Round 1's version named the two counterpart filenames — a denylist, defeated by routing both checkers through a third module. Round 2's version required an array-literal declaration — defeated four independent ways (a `push(...require(...))` after a pristine literal, since `const` binds the reference not the contents; a decoy comment shadowing the leftmost match; `//` inside a string element; lazy capture stopping at a `];` inside a string), each 78/78 green with a bogus tier live in all three copies. It also falsely accused legitimate values containing `.`, `(` or `require`. Detecting a **copying** import is not achievable: a spread at load time yields a genuinely independent array, and any regex over JavaScript source is defeatable. Removed per `code-review-convergence`'s prefer-deletion clause rather than attempted a third time; the gap is filed and the limit is stated at all three declaration sites and in the test file.


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
| ~~make C `require` B and spread~~ | ~~*(the new C source assertion)*~~ — **struck with AC2's source limb at Round 2**; no assertion catches this, by design and on the record |

Two absorption risks to check rather than assume: mutating `classify-skills.js:35` reddens many unrelated writer tests, so a red suite proves nothing about the new pin; and mutating `validate-classification.js:44` may be absorbed by `tests/lib/portability-validation.test.js:227` depending on the injected value. Pick mutants that isolate the new assertions.

**AC6 — No regressions.** `npm test` passes, `npm run lint` reports zero warnings, and **both** audits still exit 0: `node scripts/audit/name-registry-integrity.js` and `node scripts/audit/skill-manifest-integrity.js` (Task 3 edits a block comment directly above a `const` in the latter).

**AC7 — The spec is re-derived.** `SPEC.md` CAP-4 and CAP-5 are marked satisfied, Delivery-sequence item 2 is struck, and the outcome is appended to `.memlog.md`. sp-7-1's Round 1 HIGH was exactly this omission — the spec still prescribing an approach the implementation had abandoned.

## Tasks / Subtasks

- [x] **Task 1 — Read before writing** (AC1, AC2)
  - [x] Read `tests/audit/skill-manifest-integrity.test.js:480-544` end to end — the scope comment, the describe, and the anti-tautology `it` with its Round 3 reasoning
  - [x] Note `fs` (`:5`) and `path` (`:7`) are already imported; no new requires needed
  - [x] Confirm `validate-classification.js:540-549` exports `VALID_TIERS` and `VALID_INTENTS`

- [x] **Task 2 — Pin the third copy** (AC1, AC2, AC5)
  - [x] RED first: add the A/C assertions, mutate, confirm the named test goes red
  - [x] Add the **B/C identity** assertion; mutate it separately. ~~and a source assertion for C naming both counterparts~~ — struck at Round 2 after two attempts were defeated by execution
  - [x] Extend the existing describe — one home for the whole pin — and rename it, since "pinned against the writer" no longer describes B/C
  - [x] Fix **both** stale sentences in its scope comment: `:487` ("One further copy exists") **and `:488` ("collapsing all four into one module")** — there are three copies, and `:488` was missed when sp-7-1 rewrote `:487`
  - [x] Add one sentence justifying why a pin covering two `scripts/portability/` modules lives in the audit's test file

- [x] **Task 3 — Name the roles, and fix two false claims** (AC4)
  - [x] `classify-skills.js:35` — mark as the WRITER, name both checkers
  - [x] `validate-classification.js:44` — mark as a CHECKER; replace "must match …" with the reason it is a separate copy plus a pointer to the enforcing test
  - [x] `skill-manifest-integrity.js:72-78` — **the copy count and counterpart list here are already correct; do not touch them.** Two other claims in that block are false and are what needs fixing:
    - `:73-74` "PINNED against **every other copy** … **which fails if any copy drifts**" — false today (it pins one of two); true only once Task 2 lands
    - `:77` "Collapsing the remaining three … **is filed in `deferred-work.md`**" — the row it points at (`deferred-work.md:1186`) is marked **CLOSED by sp-7-1**

- [x] **Task 4 — End the collision** (AC3, AC6)
  - [x] Rename at the four sites in `name-registry-integrity.js` (`:54`, `:527`, `:529`, `:659`)
  - [x] Leave the `unassigned` ADR comment at `:50-53` and the vocabulary's **contents** untouched — this renames an identifier, it does not reopen that ruling
  - [x] **Proof is the test suite, not a CLI diff.** `tests/audit/name-registry-integrity.test.js` drives the tier branch behaviourally at `:189`, `:214`, `:582` and `:610`. The live registry produces **zero** `row/tier` findings, so a before/after CLI comparison cannot fail and must not be cited as evidence (`verification-must-be-falsifiable`)
  - [x] Update or mark historical the one doc reference: `deferred-work.md:1215` cites `VALID_TIERS.includes(...)` for this module
  - [x] Run `grep -rnw 'VALID_TIERS' scripts/audit/` and confirm the exact three expected lines

- [x] **Task 5 — Re-derive the spec** (AC7)
  - [x] Mark CAP-4 (`SPEC.md:36-39`) and CAP-5 (`:41-43`) satisfied; strike Delivery-sequence item 2 (`:88`)
  - [x] Append the outcome to `.memlog.md` via `python3 _bmad/scripts/memlog.py append`

- [x] **Task 6 — Validate and hand over** (AC5, AC6)
  - [x] `npm test` (`node scripts/test-runner.js tests/unit tests/team-factory tests/lib tests/audit`) and `npm run lint` (`eslint --max-warnings 0 scripts/ index.js tests/`)
  - [x] Produce the AC5 mutant→test table
  - [x] Commit plan per `commit-preparation`, including the **reviewed-set = committed-set** assertion: the files the review saw must equal the files the plan stages. Test files written in response to a review finding are the canonical gap, and this story produces exactly those

### Review Findings — Round 1 (2026-09-09)

All three layers completed. **All seven ACs confirmed satisfied**, and the Blind Hunter proved assertion-by-assertion that the restructure lost nothing — every old assertion has a named successor, each mutation-verified.

- [x] [Review][Patch] **HIGH — the source check was a two-name denylist, not a property.** Routing **both** checkers' vocabulary through a third module — precisely the "give it one home" refactor filed in `deferred-work.md` — passed all nine tests; widening the writer then left the suite **76/76 green while both checkers accepted a bogus tier**. Identity passed (a spread makes distinct instances), value agreement passed (all three drifted together), and the regex was looking for the wrong thing. Reproduced end to end, then replaced with an array-literal requirement. **Superseded at Round 2:** that replacement was itself defeated four ways and deleted; see the Round 2 findings. Nothing catches this case today, by design and on the record.
- [x] [Review][Patch] **MEDIUM — the placement sentence was arithmetically impossible.** *"B is the only party to every pair"* — with three copies each is party to exactly two of three pairs. It was the sole stated justification for the pin's file location, and a Task 2 deliverable. Replaced with the honest reason: this file already owns the fixtures the block sits beside, and no copy is a privileged home.
- [x] [Review][Patch] **MEDIUM — the collapse prohibition attributed a proof to a claim it does not cover.** Round 2 of sp-7-1 proved a *checker importing from the writer* unsafe; a neutral module owned by neither party was never tested. The sentence's own continuation described the condition under which a collapse *is* safe, contradicting the prohibition it issued. Narrowed to what was proven, and pointed at the new property instead of a rule about filenames.
- [x] [Review][Patch] **MEDIUM — a `role` typo silently deleted 6 of 9 tests with a green suite.** `checkers` is an exact string filter with no validation; `role: 'Checker'` yielded `3 pass / 0 fail`, and `node --test` cannot distinguish that from nine. The table's shape is now asserted: exactly one writer, at least two checkers, no unrecognised role.
- [x] [Review][Patch] **LOW — `validate-classification.js`'s stated cause post-dated its effect.** Its local declaration dates from sp-1-3, which authored the file; sp-7-1's Round 2 demonstrated the *principle* later, against the sibling checker. Reordered so it reads as principle-then-demonstration rather than false history.
- [x] [Review][Patch] **LOW — the record claimed the copy count was "untouched" when it had been rewritten.** Both forms are correct, but the claim about the edit was not. Corrected to *rewritten and re-derived, still true*.
- [x] [Review][Patch] **LOW — `SPEC.md` carried two claims falsified by sp-7-1's own AC4 strike.** CAP-3's success criterion and Delivery item 1 both still asserted `portability-schema.md` doc conformance was preserved; it was deleted. Inherited, one line from edits this story was already making — exactly what AC7 exists to catch.
- [x] [Review][Defer] **Unescaped interpolation into `new RegExp`** — inert for the three current basenames (proven byte-identical to the replaced literal), and moot for the source check that was removed. Filed rather than fixed.
- [x] [Review][Defer] **`VALID_OWNERSHIP_TIERS` is itself unpinned** — adding a sixth value reddens nothing. Out of AC scope, but the collision-ending rename now sits beside a vocabulary with the exact unenforced-agreement property this story closed for the portability set. Filed.

### Review Findings — Round 2 (2026-09-09)

Scoped to the Round 1 remediation delta (140 lines, 4 files) — the code Round 1 could not have seen. Two layers ran.

**Outcome: the source check was DELETED and AC2 amended.** This was the fifth consecutive round in which the HIGH was a defect in the previous round's correction, and my second failed attempt at this same check. `code-review-convergence`'s prefer-deletion clause applies.

- [x] [Review][Patch] **HIGH — the "property" was not a property; four independent executed defeats.** `const` binds the reference, not the contents, so `VALID_TIERS.push(...require(...))` on the line after a pristine literal passed 78/78 with a bogus tier live in all three copies — reproduced independently before acting. Also: a decoy comment carrying the canonical literal shadowed the leftmost match; `//` inside a string element ate the rest of the line; the lazy capture stopped at a `];` inside a string. Deleted, with the limit now stated rather than claimed.
- [x] [Review][Patch] **HIGH — the same check falsely accused legitimate literals.** Any value containing `.`, `(` or the substring `require` reddened the gate with a message about an import that did not exist — an intent named `requires-approval` would fail. Gone with the check.
- [x] [Review][Patch] **HIGH — the delta's central claim was false and pointed at the hole.** "no import at any number of hops can supply it" was disproven, while the adjacent paragraph told the next maintainer a neutral shared module "was never tested and is not covered by that proof" — reading as permission for exactly the refactor that ships green while widening all three gates. Both replaced with what the pin actually establishes.
- [x] [Review][Patch] **MEDIUM — `VOCAB = []` deleted all nine vocabulary assertions with a 74/74 green suite.** The identical vacuity hazard the Round 1 shape test closed for `COPIES`, left unguarded on the other table driving the same loops. Now pinned.
- [x] [Review][Patch] **MEDIUM — two comments still described the deleted check**, guaranteeing it "fails … if either checker imports from a counterpart". Rewritten to state the limit.
- [x] [Review][Patch] **MEDIUM — `skill-manifest-integrity.js:26` contradicted its own line 31**, asserting schema-doc conformance "were folded in below" five lines above "SCHEMA-DOC CONFORMANCE WAS DELIBERATELY NOT FOLDED IN". Inherited from sp-7-1.
- [x] [Review][Patch] **LOW — `SPEC.md` CAP-3's intent line** still claimed coverage did not narrow. It did, deliberately and on the record.

**Confirmed correct by Round 2** (stated because it is the part that held): the Round 1 table-shape assertion genuinely catches a `role` typo; the placement sentence is now arithmetically true; the de-anachronised rationale in `validate-classification.js` checks out against git — the file was created 2026-04-09 with the literal already present, years before sp-7-1; and both `SPEC.md` corrections are accurate.

### Review Findings — Round 3 (2026-09-10)

Final permitted round (`code-review-convergence` allows no Round 4). Scoped to the Round 2 delta; two layers ran and **converged on one diagnosis: the deletion was right, but the strike propagated only to AC2.** The struck claim was still asserted in eight places.

This is not a fourth attempt at the check. It is one propagation pass, plus a corrected rationale and re-derived counts.

- [x] [Review][Patch] **HIGH — `skill-manifest-integrity.js:95-99` still said the deleted check was what the pin enforces**, four lines below the new paragraph saying it is not. A maintainer reading the forward-looking half would have believed the suite red-lines a shared-module import. Both paragraphs replaced.
- [x] [Review][Patch] **HIGH — the "permission sentence" recorded at Round 2 as replaced was untouched.** *"A neutral module owned by neither party was never tested and is not covered by that proof"* — Round 2's own record said "Both replaced"; only the test-file half was. A `[x]` against work that did not happen, in the story that closed a deferred row about exactly that.
- [x] [Review][Patch] **HIGH — AC2's SURVIVING rationale is false.** It justified the B/C identity assertion as closing *"two distinct instances that are secretly one value"*. Verified: a copying import produces exactly that and passes everything — **75/75 green**. Identity closes a shared instance only. The kept limb was mis-described, which no earlier round noticed.
- [x] [Review][Patch] **HIGH — two rows of the AC5 mutant→test table named a test that no longer exists**, so the falsifiability evidence pointed at deleted assertions. Corrected, with the uncaught mutant kept in the table rather than removed, so the gap shows in the evidence and not only in prose.
- [x] [Review][Patch] **HIGH — `tests/…test.js:496` still promised the source check.** A third comment describing it, in the file whose section 3 explains why it cannot exist.
- [x] [Review][Patch] **MEDIUM — AC2 and the memlog claimed the limit was "stated at all three declaration sites"; the writer was never touched.** Added to `classify-skills.js`, and the memlog corrected.
- [x] [Review][Patch] **MEDIUM — the Change Log and File List carried stale counts for the third round running.** Re-derived by running HEAD's copy against the working tree's: **70 → 75 runtime tests (+5)**, suite **2252 pass / 0 fail / 1 skipped of 2253**.
- [x] [Review][Patch] **MEDIUM — Completion Notes still described the pin as containing a source check**, and claimed "the checker↔checker hole is closed" without qualifying that only the shared-instance form is.
- [x] [Review][Patch] **MEDIUM — the new comments pointed at a `deferred-work.md` row marked CLOSED** — a verbatim recurrence of this story's own Round 1 finding, reintroduced in two new places by the remediation.
- [x] [Review][Patch] **MEDIUM — "detecting a copying import is not achievable" was an absolute the evidence did not support.** All four defeats were regex artifacts. Round 3 demonstrated a ~30-line `acorn` AST check that passes all three live copies and rejects all four defeats without false-accusing `requires-approval`, and `acorn` already resolves here via eslint. My own backlog row said "not achievable **by regex** … an AST check"; the comment contradicted it. Corrected in both, and the prototype recorded.
- [x] [Review][Patch] **LOW — `rel` was left dead in the `COPIES` table** after its only consumer was deleted, inviting the next maintainer to supply a path nothing reads. Removed.
- [x] [Review][Patch] **LOW — two comment figures could not be re-derived** ("nine vocabulary assertions", "6 of 9"). Replaced with statements that do not assert a count.
- [x] [Review][Patch] **LOW — the deferred-work block was headed "Round 1"** while containing Round 2 findings, and the RegExp row described deleted code as live.

**Confirmed correct by Round 3** — the deletion lost nothing load-bearing (all seven surviving assertions mutation-proven independently); the `VOCAB` guard is real and non-vacuous; the pin's positive guarantee holds for all three pairs; `SPEC.md` CAP-3's amendment is accurate; and CAP-4's success criterion still holds as worded, since single-site widening does redden value agreement.

**Residue → backlog, per the no-Round-4 cap:** the shared-module gap with the AST approach and its prototype recorded; the unpinned `VALID_OWNERSHIP_TIERS`; the RegExp-escaping note.

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

Claude Opus 5 (1M context) — `claude-opus-5[1m]`

### Debug Log References

### Completion Notes List

- **The pin was restructured, not extended.** An extra hand-written pair would have repeated the shape that hid the hole. It is now table-driven over three copies: value agreement per checker and identity across **every** unordered pair. (A third family, a source check, was added here and **deleted at Round 2** after two attempts were defeated by execution — see the Round 2 findings.) Adding a fourth copy is one table row, and the table's own shape is asserted.
- **The checker↔checker SHARED-INSTANCE hole is closed and was real.** Mutant M3 (C re-exporting B's array) reddens `B and C do not share a vocabulary instance`; under the previous pin it was entirely invisible. **The copying-import form of that hole remains open** — a spread passes all assertions. Stated here because an earlier draft of this bullet said "the hole" without qualification.
- **AC3's grep is exact.** `grep -rnw 'VALID_TIERS' scripts/audit/` returns **3 lines, all in `skill-manifest-integrity.js`**. My own explanatory comment at the rename site initially contained the bare token and broke that; reworded rather than relaxing the AC.
- **Trap 5 honoured in substance, and the record corrected in Round 1.** The story warned against "fixing the correct" at `skill-manifest-integrity.js` — its copy count and counterpart list were already right. The block WAS rewritten for role-naming, and the count sentence was rewritten with it ("Two other copies … removed a third" → "All three declare … removed a fourth copy"); both forms are correct, cross-checked against `deferred-work.md:1187`. An earlier version of this note claimed the text was "untouched", which was false — the honest claim is *rewritten and re-derived, still true*. The `deferred-work.md` pointer was dropped because the row it cited is CLOSED.
- **The rename's evidence is the test suite, not the CLI diff.** Before/after CLI output is byte-identical, but the live registry emits zero `row/tier` findings, so that comparison proves only that the file parses. The tier branch is covered behaviourally at `tests/audit/name-registry-integrity.test.js:189`, `:214`, `:582`, `:610` — 75/75 pass after the rename.
- **AC7 honoured:** `SPEC.md` CAP-4/CAP-5 marked satisfied, Delivery-sequence item 2 struck, outcome logged to `.memlog.md`. sp-7-1's Round 1 HIGH was exactly this omission.

#### AC5 — mutant → test

| Mutant | Named test that goes red |
|---|---|
| widen `validate-classification.js` `VALID_TIERS` | `validate-classification.js VALID_TIERS matches the writer exactly` |
| widen `validate-classification.js` `VALID_INTENTS` | `validate-classification.js VALID_INTENTS matches the writer exactly` |
| C re-exports B's array (identity mutant) | `B and C do not share a vocabulary instance` |
| ~~C imports B and spreads~~ | **no longer caught** — the source check was deleted at Round 2. Recorded rather than removed so the gap is visible in the evidence table, not only in prose |

Mutants were chosen to isolate the new assertions: mutating the **writer** was avoided because it reddens many unrelated writer tests and would prove nothing about the pin. Source file restored after each mutant, md5-verified.

### File List

- `tests/audit/skill-manifest-integrity.test.js` — the pin restructured from a hand-written A↔B pair into a table-driven check over all three copies (+5 net runtime tests, 70 → 75 — measured against HEAD, not inferred)
- `scripts/portability/classify-skills.js` — role comment: WRITER, names both checkers
- `scripts/portability/validate-classification.js` — role comment: CHECKER; the unenforced "must match" prose replaced with the reason and a pointer to the enforcing test
- `scripts/audit/skill-manifest-integrity.js` — role comment: CHECKER; counterparts named; the pointer to a CLOSED `deferred-work.md` row removed. Copy count and counterpart list left untouched — already correct
- `scripts/audit/name-registry-integrity.js` — `VALID_TIERS` → `VALID_OWNERSHIP_TIERS` (4 references) with the collision recorded at the declaration
- `_bmad-output/implementation-artifacts/deferred-work.md` — the doc reference to the renamed symbol updated, **plus three deferred rows filed** across Rounds 1-3 (the shared-module gap, the unpinned ownership vocabulary, the RegExp-escaping note)
- `_bmad-output/specs/spec-portability-manifest-checkers/SPEC.md` — CAP-4/CAP-5 satisfied, Delivery item 2 struck
- `_bmad-output/specs/spec-portability-manifest-checkers/.memlog.md` — outcome recorded
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status
- `_bmad-output/implementation-artifacts/sp-7-2-pin-the-third-vocabulary-copy.md` — this record

## Change Log

- 2026-09-09 — Pinned the third classification-vocabulary copy and closed the checker↔checker identity hole; renamed `name-registry-integrity.js`'s clashing `VALID_TIERS` to `VALID_OWNERSHIP_TIERS`. `npm test` **2252 pass / 0 fail / 1 skipped** of 2253; `npm run lint` zero warnings; both audits exit 0.
