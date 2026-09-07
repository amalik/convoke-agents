# Story 2.7: Escape every interpolated regex in the exporter

Status: ready-for-dev

<!-- baseline_commit is stamped by `dev-story` at implementation start, not by the author. Worded
     to stay true after stamping: dist-2-3c's Round 1 review found the sibling phrasing
     ("deliberately ABSENT") contradicts the frontmatter the moment the field is written. -->

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
**Then** an equivalent pin exists for `configVarMap`, reading the **real object** rather than a
copied key list, asserting every key matches `/^[a-z_]+$/`
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

- [ ] **T1** — Re-derive the enumeration; record it (AC1). **Stop and raise if it is not 5 / 3 escaped / 2 not**
- [ ] **T2** — Wrap both `${varName}` interpolations in `escapeRegExp` (AC2)
- [ ] **T3** — Add the hardening comment (AC3)
- [ ] **T4** — Mirror T33's test block, all THREE categories: isolation, source-shape, reachability pin (AC4, AC4b)
- [ ] **T5** — Demonstrate RED: the source-shape assertions against pre-fix code, and the reachability pin against a metacharacter key. Record both (AC4, AC4b)
- [ ] **T6** — Run `npm test`, `lint`, `docs:audit`, `backlog-integrity`, and **`install-scope-check.js`** — see Dev Notes

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
| 2026-09-07 | Authored against the FR16 operator ruling. FR16 binds the provably-safe sites; escape them. The epic's "survive any persona name / does not crash" framing was corrected by the same ruling — nothing crashes, `varName` is a closed literal set, and that overclaim is what T33 was rescored 7.2 → 1.9 for. Enumeration re-derived: five interpolated constructions, three already escaped, two not — FR16's original list of four was stale. An enforcement gate was considered and declined; AC5 pins that. |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
