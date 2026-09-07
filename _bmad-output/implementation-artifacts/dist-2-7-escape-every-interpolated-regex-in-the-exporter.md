---
baseline_commit: 86bf9ecba924f39f63516851a9a4404f93806da1
---

# Story 2.7: Escape every interpolated regex in the exporter

Status: review

> **Authored 2026-09-07 against the FR16 operator ruling**, recorded in
> [the epic](../planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md) at Story 2.7.
> Covers FR16. Independent of 2.1–2.6; may run at any time. Forge prerequisite.
>
> **This story fixes no crash.** Read *The honest framing* in Dev Notes before the ACs. The epic's
> original wording promised the exporter would "survive any persona name"; that was the same
> overclaim T33 was rescored 7.2 → 1.9 for, and it was corrected by the ruling.

## Story

As a **Convoke maintainer**,
I want every interpolated regex in the exporter escaped without exception,
so that **the rule is one a grep can confirm rather than one that needs a safety argument per site**.

### What this story is, in one line

Wrap the two remaining unescaped `${varName}` interpolations in
`scripts/portability/export-engine.js` in the `escapeRegExp` helper already imported there, so
FR16 becomes literally true and no exemption list exists.

---

## Acceptance Criteria

**AC1 — The enumeration is re-derived, because the one you were handed is stale**

**Given** FR16 originally named four unescaped sites (`:311`, `:390`, `:499`, `:503`) and a
2026-09-07 re-derivation found something different
**When** this story begins
**Then** the enumeration is re-run mechanically (`grep -n "new RegExp(" scripts/portability/export-engine.js`)
and recorded in Completion Notes
**And** the expected shape is **five** interpolated constructions — three already escaping via
`escapeRegExp`, two not — but that is a 2026-09-07 measurement, not a promise
**And** if the count differs, that is understood before anything is edited rather than after

**AC2 — Both remaining sites escape**

**Given** the two unescaped constructions interpolate `varName` from
`Object.entries(configVarMap)`, building `\{\{varName\}\}` and `\{varName\}` matchers
**When** this story completes
**Then** both interpolate through `escapeRegExp`, which is already imported at
`scripts/portability/export-engine.js:36` — no new import, no new helper
**And** no other behaviour in `replaceConfigVars` changes: the double-brace loop still runs before
the single-brace loop, for the reason its comment gives

**AC3 — The comment says it is hardening, so the next reader does not infer distrust**

**Given** `configVarMap` is a hardcoded object literal whose six keys are all `/^[a-z_]+$/`, and
escaping a provably-safe value can look like evidence the value is untrusted
**When** this story completes
**Then** a comment at the fix records that the input is a closed literal set, that no metacharacter
can reach it today, and that the escape is uniformity rather than a reachable fix
**And** it mirrors the format of the prior art in this same file — `export-engine.js:325` (*"T33,
defensive — matching the `extractSectionByHeading` site below."*) and `:416` (*"T33, defensive:
every caller today passes a hardcoded literal…"*) — so the new comment is indistinguishable in
style from its model
**And** it names the reason the rule is uniform: an exemption must be re-verified whenever
`configVarMap` gains a key, and nothing enforces that

**AC4 — Falsifiable, by the route T33 already proved is the honest one**

**Given** the input cannot be made hostile through the real code path — which is what makes a
runtime test here a check that cannot fail
**When** this story completes
**Then** the test mirrors the **T33 block at `tests/lib/portability-export-engine.test.js:236-335`**
(comment opens at 236, `describe` spans 251-335), which solved exactly this problem in **three**
categories, all of which this story mirrors:
| Category | What it proves |
|---|---|
| **Isolation** | `escapeRegExp` fixes the construct. Passes against pre-fix code — not a discriminator |
| **Source shape** | Production actually calls it. `assert.match(src, /\$\{escapeRegExp\(varName\)\}/)` plus a `doesNotMatch` for the raw form. **This is the half that fails on a revert** |
| **Reachability pin** | The safety argument still holds — see AC4b |
**And** the source-shape assertions are demonstrated **failing against the pre-fix code**
**And** the test block carries the same explanation T33's does, so a later reader does not
"simplify" the source-shape assertion away as redundant

**AC4b — The reachability claim is PINNED BY A TEST, not by a comment**

**Given** this story's whole ruling rests on `configVarMap` being a closed literal of `/^[a-z_]+$/`
keys, and the ruling itself names the gap: *"an exemption must be re-verified whenever
`configVarMap` gains a key, and nothing enforces that"*
**And** T33 pinned exactly this for its own two sites — `tests/lib/portability-export-engine.test.js`
carries *"the persona-name regex still admits letters only"* and *"every extractSectionByHeading
caller still passes a literal"*, built so that a later change making either site reachable fails
**When** this story completes
**Then** an equivalent pin exists, reading the **real object** — `Object.keys` of the exported map,
not a parse of its source text — asserting every key matches `/^[a-z_]+$/`
**And** it is demonstrated failing — add a key containing a metacharacter, observe red, remove it
**And** this is **not** the gate AC5 declines: AC5 refuses a new CI step, audit script or lint rule.
This is an ordinary assertion in the test file T33 already established the pattern in. Without it
the file ends with two enforcement postures for one construct class — CI-executed pins on three
sites, a comment nobody runs on the other two — which is the "fact stated where nothing checks it"
shape every recurring defect in this epic traces back to

**AC5 — No gate is added**

**Given** the ruling explicitly declined an enforcement gate — a check guarding two interpolations
against a closed six-key input set is more code than the code it guards, and this epic is at 8 of 10
with a freeze waiting on it
**When** this story completes
**Then** no new CI step, audit script or lint rule is introduced
**And** if the implementer believes one is warranted, it is raised rather than added

---

## Tasks / Subtasks

- [x] **T1** — Re-derive the enumeration; record it (AC1). **Stop and raise if it is not 5 / 3 escaped / 2 not**
- [x] **T2** — Wrap both `${varName}` interpolations in `escapeRegExp` (AC2)
- [x] **T3** — Add the hardening comment (AC3)
- [x] **T4** — Mirror T33's test block, all THREE categories: isolation, source-shape, reachability pin (AC4, AC4b)
- [x] **T5** — Demonstrate RED: the source-shape assertions against pre-fix code, and the reachability pin against a metacharacter key. Record both (AC4, AC4b)
- [x] **T6** — Run `npm test`, `lint`, `docs:audit`, `backlog-integrity`, and **`install-scope-check.js`** — see Dev Notes

### Review Findings

Round 1 — Blind Hunter, Edge Case Hunter and Acceptance Auditor as independent `claude-sonnet-5`
subagents. 13 raw, 8 after dedup: **0 decision-needed, 5 patch, 2 defer, 1 dismissed.** No HIGH.
**Acceptance Auditor found zero AC violations** and reproduced every claim in the Dev Agent Record
exactly — including the RED/GREEN counts, rebuilt in an isolated scratch copy.

- [x] **[Review][Patch] The reachability pin still could not fail — on five more key shapes** [tests/lib/portability-export-engine.test.js] — Blind Hunter and Edge Case Hunter, independently. Attempt 2 (quoted forms) was defeated by computed keys `[k]:`, escaped quotes inside quoted keys, empty-string keys, spread syntax, and a post-declaration `CONFIG_VAR_MAP['bad.key'] = …` that `Object.entries` picks up at runtime and **no source parser can ever see**. **Instrument changed rather than patched a third time**, per `code-review-convergence`: the map is hoisted to module scope, exported, and the pin reads `Object.keys` of the real object. Falsified against all six shapes — every one now red.
- [x] **[Review][Patch] AC4b claimed the pin "reads the real object" while it parsed source text** [story AC4b] — Blind Hunter. An overclaim in the criterion itself, not just the record. True as written now.
- [x] **[Review][Patch] The source-shape assertions would false-fail on a line wrap** [tests/lib/portability-export-engine.test.js] — Edge Case Hunter. The sibling T33 assertion already tolerates wrapping via `\s*`; mine did not. Added.
- [x] **[Review][Patch] The source-shape assertions would false-fail on a variable rename** [tests/lib/portability-export-engine.test.js] — Edge Case Hunter. They matched the literal identifier `varName`; renaming the loop variable changes no behaviour but would have gone red. Now matches `[A-Za-z_$][\w$]*`.
- [x] **[Review][Patch] Leftover template scaffolding** [story record] — Acceptance Auditor and Blind Hunter. `### Agent Model Used`, `### Completion Notes List` and `### File List` each appeared twice, filled then empty. Removed.

**Deferred:**
- [x] **[Review][Defer] The replacement side of `result.replace(re, replacement)` is not escaped** [scripts/portability/export-engine.js] — deferred, pre-existing — Edge Case Hunter, raised because I flagged it when writing the fix and did not act. `sanitize.js` exports `escapeReplacement` precisely because escaping the pattern is half the job: a replacement containing `$&`, `` $` ``, `$'` or `$1` re-injects matched text. **Not reachable** — all six values are hardcoded literals with no `$` — and unchanged by this diff, so it is the symmetric FR16 question for the replacement side rather than this story's business. Worth a row if the map ever takes a non-literal value.
- [x] **[Review][Defer] A template-literal VALUE containing `\n  };` would have truncated the old source capture** [tests/lib/portability-export-engine.test.js] — deferred, **obsolete** — Edge Case Hunter. Real against the attempt-2 parser; the attempt-3 pin reads the object and has no capture to truncate. Recorded because the finding is correct about the code it was written against, and because it is another instance of why source-parsing was the wrong instrument.

**Delta review of the Round 1 remediation — run because the remediation was STRUCTURAL.** Round 1's
main patch did not edit prose: it hoisted `configVarMap` out of `applyTransformations` into module
scope, renamed it, added it to `module.exports`, and rewrote the pin. `code-review-convergence` is
explicit that *"small in-place fixes to what the round already saw are fine; new code is not"*, and
the restructure clause it was invoked under says changing the instrument *"does not reduce review
depth, it redirects it"*. Invoking that clause and then skipping review of what it produced would
have been using the rule to avoid the thing the rule asks for. 1 patch, 1 defer.

- [x] **[Review][Patch] The loosened source-shape assertions could not tell the right identifier from the wrong one** [tests/lib/portability-export-engine.test.js] — **the direct cost of a Round 1 fix, and the reviewer proved it by mutation.** Relaxing the literal `varName` to `[A-Za-z_$][\w$]*` fixed a false-FAILURE on renames and created a false-PASS: changing `escapeRegExp(varName)` to `escapeRegExp(replacement)` — the wrong half of the same destructured pair, leaving the key raw in the regex — **kept the purpose-built test green**, and was caught only by an unrelated functional test. Fixed by parsing the loop header for its key binding and requiring that same identifier inside the RegExp. Falsified in all three directions: raw interpolation RED, wrong identifier RED, harmless rename GREEN. The first two versions each had one half of that property; this is the first with both.

**Deferred:**
- [x] **[Review][Defer] `CONFIG_VAR_MAP` is exported mutable and unfrozen** [scripts/portability/export-engine.js] — deferred, pre-existing convention — a consumer or test could do `require(...).CONFIG_VAR_MAP.evil = '.*'` and corrupt the shared module object for the rest of the process. **Not novel to this diff:** `ALLOWED_WARNING_TYPES` sits in the same *"Internal helpers exported for testing"* block, exported the same way, equally unfrozen. `Object.freeze` would cost nothing, but freezing one of two sibling exports is the inconsistency this story exists to argue against — it should be both or neither, which is a decision about the block, not about this story. Verified not a live hazard: Node's test runner isolates each `*.test.js` into its own process, so no cross-file leak, and nothing in this file mutates it.

**What the delta review verified clean, having been asked to doubt it:**
- **The hoist IS behaviour-preserving** — checked by grep across the repo, not by trusting the comment: the object is only ever read via `Object.entries`/`Object.keys`, never assigned or mutated in production, and nothing depended on a per-call fresh object.
- **`require` caching is not a stale-copy hazard** — the pin reads the same live reference, and the reviewer built a two-file repro confirming the runner's per-file process isolation.
- **The pin goes RED on all four bypass classes** by direct mutation: quoted, computed, spread-in, and post-declaration.
- **The loosened assertions still catch a straight revert** — the loosening created only the wrong-identifier gap, nothing wider.

**Dismissed, with the verification it got:**
- *(Blind)* A backtick key ``` `bad.key`: 'x' ``` defeats the pin — **false positive, and checking it mattered.** That is a `SyntaxError`; a bare template literal is not a legal property key, so it was never reachable. The legal form is computed (`` [`bad.key`]: ``), which is covered and goes red. My own first falsification run also mis-reported this GREEN because the injection silently failed — caught only by a Python escape-sequence warning. **A falsification that does not verify its own fixture is itself a check that cannot fail**, which is the lesson worth more than the finding.
- *(Edge)* Reformatting `CONFIG_VAR_MAP` to a different indent breaks the pin — obsolete with attempt 3, and it failed loud rather than vacuously even before.
- *(All three)* Positive verifications: the source-shape assertions do discriminate (revert → exactly 18 pass / 2 fail, restore → 20/0); `escapeRegExp` is a confirmed no-op on all six real keys, so the fix cannot change behaviour; the AC1 enumeration matches `git show HEAD:` exactly; every gate figure reproduced.


---

## Dev Notes

### The honest framing — read this before the ACs

Nothing crashes. `varName` iterates `Object.entries(configVarMap)`, and `configVarMap` is a
hardcoded object literal referenced in exactly three places: its own declaration and the two loops.
Nothing mutates or extends it. Its six keys — `user_name`, `communication_language`,
`document_output_language`, `output_folder`, `planning_artifacts`, `implementation_artifacts` — are
all `/^[a-z_]+$/`.

So this is **defensive hardening**, and the story record must say so. Selling it as a defect fix is
the specific error T33 was rescored 7.2 → 1.9 for, in this same file, three weeks ago.

### Why escape anyway — the ruling in one paragraph

Because an exemption is a claim nothing checks. *"Every interpolation is escaped"* is greppable;
*"every one except the provably-safe ones"* needs per-site judgement and silently expires the day
`configVarMap` gains a key with a `.` or a `-`. Every defect this epic has hit — the stale "ten
self-referential links", the false T32 closure, seven rotted line citations — was a fact stated
somewhere nothing checked. T33 also already ruled this way for the other three sites in this file,
and one file with two rules for one construct is worse than either rule chosen consistently.

### The T33 block is your template, and it already solved the hard part

`tests/lib/portability-export-engine.test.js:236-294`. It faced the identical problem — how do you
make a hardening fix falsifiable when the input cannot be hostile? — and its answer is stated in its
own comment:

> *The three tests above prove `escapeRegExp` solves the problem; they do NOT prove production uses
> it — verified: all of them pass against the pre-fix engine. That is the "check that cannot fail"
> class, and it is unavoidable at runtime here … With no way to drive hostile input through the real
> path, the honest discriminator is the shape of the call itself.*

Mirror both halves. The isolation tests show `escapeRegExp` fixes the construct; the source-shape
assertions (`assert.match(src, /\$\{escapeRegExp\(varName\)\}/)` plus a `doesNotMatch` for the raw
form) are what actually fail if someone reverts the fix. **Only the source-shape half is
falsifiable against pre-fix code** — that is what T5 demonstrates, and saying otherwise would be the
overclaim the block exists to prevent.

### `escapeRegExp` throws on a non-string — and that is fine here

`scripts/lib/sanitize.js` opens with `assertString(input, 'escapeRegExp')`. `Object.entries` always
yields string keys, so this cannot fire from these two call sites. Noted so it is not mistaken for a
new failure mode introduced by the fix.

### Run `install-scope-check.js`. It is not in `npm test`

`dist-2-6` went red in CI on a step that was never in its gate list. The `agent-surface-parity` job
is misleadingly named: it is **the audit aggregator**, running **nine** steps, seven of them audit
scripts — parity, install-scope, backlog-integrity, skill-manifest-integrity, name-registry-integrity,
docs-audit and agent-manifest-bme. **Several are not in `npm test`.** `install-scope-check.js` is the
one immediately after parity, and it is the one that caught `dist-2-6`. This story touches no write
operations so its snapshot should not move — but confirm it. Note also that CI runs parity against
the **last release tag**, not `main`:

```
BASE=$(git describe --tags --abbrev=0 --match 'v*')
node scripts/audit/agent-surface-parity.js "$BASE" HEAD
node scripts/audit/install-scope-check.js
```

### What this story does NOT do

- **No enforcement gate** (AC5). Declined in the ruling, with reasons. Raise it, do not add it.
- **No touching the three already-escaped sites.** They are T33's and are correct.
- **No change to `replaceConfigVars`'s ordering.** The double-brace loop runs first deliberately;
  its comment explains that single-brace-first would match the inner `{var}` of `{{var}}`.

### Cross-story dependencies

| Story | Relationship |
|---|---|
| T33 | **Closed 2026-08-27.** The precedent, the other three sites, and the test block to mirror |
| `dist-2-1` … `dist-2-6` | None. This story is independent and may run at any time |
| Forge | This is a stated prerequisite |

### References

- [Epic, Story 2.7](../planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md) — the FR16 ruling in full, including why a gate was declined
- `scripts/portability/export-engine.js:36` — `escapeRegExp` import; `:524` `configVarMap`; `:535`/`:539` the two sites *(line numbers as of 2026-09-07 — re-derive, per AC1)*
- `tests/lib/portability-export-engine.test.js:236-294` — the T33 block to mirror
- `scripts/lib/sanitize.js` — `escapeRegExp`, and `escapeReplacement` for why the pattern side is only half the job

---

## Commit Plan

```
fix(dist-2-7): escape the two remaining interpolated regexes in the exporter
```

Body: the re-derived enumeration, the isolation-vs-source-shape split with the RED demonstration
from T5, an explicit statement that this is hardening and no crash is fixed, and the gate results
including `install-scope-check.js`.

---

## Change Log

| Date | Change |
|---|---|
| 2026-09-07 | **Delta review of the Round 1 remediation — 1 patch, 1 defer.** Run because that remediation was STRUCTURAL (a module-scope hoist plus a new export), which `code-review-convergence` excludes from a round's coverage — and because the restructure clause it was invoked under says changing the instrument redirects review depth rather than reducing it. It found the cost of my own fix: loosening the source-shape assertions to tolerate a rename left them unable to distinguish `escapeRegExp(varName)` from `escapeRegExp(replacement)` — a real regression leaving the key raw — which **kept the purpose-built test green** and was caught only by an unrelated functional test. Now binds to the loop's actual key identifier; falsified three ways (raw RED, wrong identifier RED, rename GREEN). The hoist was independently confirmed behaviour-preserving and the pin RED on all four bypass classes. |
| 2026-09-07 | **Round 1 review — 5 patches, 2 defers, 1 dismissed, 0 HIGH, zero AC violations.** The headline is the reachability pin: attempt 2 was defeated by five further key shapes, including a post-declaration mutation `Object.entries` sees at runtime and no source parser ever can. **Instrument changed rather than patched a third time** — the map is hoisted to module scope, exported, and the pin reads `Object.keys` of the real object, which is true by construction for every key syntax at once. Falsified against all six shapes. **AC4b itself was an overclaim** ("reads the real object" while parsing source text) and was corrected. Two source-shape assertions would have false-failed on a line wrap or a variable rename; both now tolerant, matching the sibling T33 assertion. One reported bypass was a false positive — a bare backtick key is a SyntaxError — and my own falsification had mis-reported it GREEN on a silently-failed injection: **a falsification that does not verify its own fixture is itself a check that cannot fail.** Gates re-run: 2214 tests 0 fail, lint clean, and the whole audit-aggregator job green. |
| 2026-09-07 | **Implemented. All 6 ACs met.** Enumeration re-derived and matched (5 constructions, 3 escaped, 2 not); both remaining sites now escape; hardening comment mirrors the T33 format; three-category test block added. **The reachability pin did not go red on its first falsification** — the extractor read bare identifiers only, and a key with `.` or `-` must be QUOTED in JS, so it could see only the keys already safe by syntax. A pin that cannot fail. Fixed to match quoted forms and re-falsified. Also fixed a `no-regex-spaces` lint error I introduced, then re-falsified again. Gates: 2214 tests 0 fail, lint clean, docs:audit zero, and the whole audit-aggregator job green including `install-scope-check.js`. |
| 2026-09-07 | Authored against the FR16 operator ruling. FR16 binds the provably-safe sites; escape them. The epic's "survive any persona name / does not crash" framing was corrected by the same ruling — nothing crashes, `varName` is a closed literal set, and that overclaim is what T33 was rescored 7.2 → 1.9 for. Enumeration re-derived: five interpolated constructions, three already escaped, two not — FR16's original list of four was stale. An enforcement gate was considered and declined; AC5 pins that. |

---

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m]

### Completion Notes List

**AC1 — enumeration re-derived, and it matched.**

```
$ grep -n "new RegExp(" scripts/portability/export-engine.js
336   escapeRegExp(name)          escaped
423   escapeRegExp(headingName)   escaped   (multi-line construction)
535   ${varName}                  NOT escaped
539   ${varName}                  NOT escaped
1106  escapeRegExp(basename)      escaped
```

Five constructions, three escaped, two not — the shape AC1 predicted, so the stop condition did not
fire. FR16's original list (`:311`, `:390`, `:499`, `:503`) was stale, as the story said it would be.

**AC2 — both sites escape.** `:535`/`:539` now `escapeRegExp(varName)` (post-fix `:544`/`:548`).
`escapeRegExp` was already imported; no new import, no new helper. `replaceConfigVars`'s
double-brace-before-single-brace ordering is untouched.

**AC3 — the comment says it is hardening**, mirroring the format of `export-engine.js:325` and
`:416` (*"T33, defensive — …"*), and it points at the test rather than asking to be trusted.

**AC4 / AC4b — three categories, and the RED demonstrations.**

```
BEFORE THE FIX — the two source-shape assertions, and only those:
  ✖ the double-brace matcher interpolates through escapeRegExp
  ✖ the single-brace matcher interpolates through escapeRegExp
  20 tests, 18 pass, 2 fail
AFTER:  20 pass, 0 fail
```

The isolation test and the reachability pin passed pre-fix, exactly as predicted — only the
source-shape half is a discriminator, which is what T33's block records and what AC4 required be
restated rather than "simplified" away.

**THE REACHABILITY PIN TOOK THREE ATTEMPTS, AND THE THIRD CHANGED THE INSTRUMENT.** The first two
are recorded because the sequence is the finding.

*Attempt 1 — bare identifiers.* Planting `'bad.key': 'x'` left the pin green. Not a regex slip: the
extractor matched `[A-Za-z0-9_$]+`, and **a key containing `.` or `-` is not a valid bare identifier
in JS, so it must be quoted** — the pin could only ever see keys already safe by syntax. Found by
*running* the falsification, not by reading the regex.

*Attempt 2 — quoted forms too.* Extractor extended to `'quoted'` and `"quoted"`, re-falsified
against a quoted key: red. **Declared fixed. It was not.**

*Round 1 review defeated attempt 2* with computed keys `[k]:`, escaped quotes inside quoted keys,
empty-string keys, spread syntax, and a plain `CONFIG_VAR_MAP['bad.key'] = …` after the literal —
which `Object.entries` picks up at runtime and **no source parser can ever see**. Each patch was one
syntactic step behind the next bypass: `code-review-convergence`'s *"two failed attempts at the same
fix predict a third"*, whose instruction is to change the instrument.

*Attempt 3 — stop parsing source.* The map was function-local, so the only way to inspect it was to
read the file. It is now hoisted to module scope as `CONFIG_VAR_MAP` and exported under the file's
existing *"Internal helpers exported for testing"* convention, and the pin reads `Object.keys` of
the actual object. Behaviour-preserving: all six values are static literals with no dependency on
`applyTransformations`'s arguments, so it is constructed once rather than per call. **True by
construction for every key syntax at once, and it cannot rot.** Falsified against every shape that
defeated attempt 2:

```
quoted key                 RED      computed backtick [`k`]:   RED
computed key [k]:          RED      spread ...EXTRA            RED
escaped quote              RED      post-declaration mutation  RED
restored:                  20 pass, 0 fail
```

**One reported bypass was a false positive, and checking it mattered.** A bare backtick key
`` `bad.key`: 'x' `` is a **SyntaxError** — not valid JavaScript — so it was never reachable. My own
first falsification run also mis-reported it GREEN because the injection silently failed; the only
reason I noticed was a Python escape-sequence warning. **A falsification that does not verify its
own fixture is itself a check that cannot fail.**

**AC4b's wording was corrected too.** It claimed the pin "reads the real object rather than a copied
key list" while it was in fact parsing source text — an overclaim, caught at Round 1, now true as
written.

**AC5 — no gate added.** No CI step, audit script or lint rule. AC4b's pin is an ordinary assertion
in the test file T33 established, which is what AC4b distinguishes and AC5 permits.

**A lint error I introduced and fixed.** `no-regex-spaces` on two literal spaces in the
`configVarMap` extraction regex; replaced with `{2}`. Re-falsified the pin afterwards to confirm the
fix did not quietly de-fang it.

**Gates, each run against this change.**

```
npm test              2214 tests, 2213 pass, 0 fail, 1 pre-existing skip  (was 2210)
lint                  clean (eslint --max-warnings 0)
docs:audit            zero findings
agent-surface-parity  PASS  (vs v4.0.1, the tag CI uses — not main)
install-scope-check   PASS  (snapshot unmoved; this story adds no write ops)
backlog-integrity     PASS
skill-manifest-integrity / name-registry-integrity   PASS
```

`install-scope-check.js` and the other audit-aggregator steps were run because `dist-2-6` went red
in CI on exactly that job, which is not covered by `npm test`.

### File List

**Modified**
- `scripts/portability/export-engine.js` — both `varName` interpolations escaped; hardening comment
- `tests/lib/portability-export-engine.test.js` — the `dist-2-7` block: isolation, two source-shape assertions, reachability pin
- `_bmad-output/implementation-artifacts/dist-2-7-escape-every-interpolated-regex-in-the-exporter.md` — this record
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions

