# Fast Story: Pin `cir-1-3`'s channel disclosure so a later edit cannot silently drop it (T275)

**Status:** withdrawn — ruled against, see banner · **Lane:** Fast (RICE 1.35 — R:3 I:1 C:90% E:2, qualified 2026-10-12 by Winston) · **Source:** `cir-1-3` Round 1 independent review (2026-10-11), intake `IN-250`

> ## 🚫 WITHDRAWN 2026-10-13 — ruled against by ADR-001 Amendment 3. Do not implement.
>
> **The ruling went the other way on sequence, not on budget.** A3.1 settles that extending an
> already-wired check is **not** a new check under C1 — C10's precedent, where an existing check was
> *required* to gain assertions in the same change with the budget explicitly not reopened. So D1's premise
> was sound and the earlier restrictive reading of C1 was wrong.
>
> **A3.2 still rules no gate.** C12 is about order, not cost: a gate is considered *afterwards*, on evidence
> about what actually broke. Nothing has broken, the four `i97` notes are in, and the measured test C12
> defers to (`s4-1-1`) is deferred. Decisive: **a gate makes the disclosure unable to drop, so the evidence
> C12 conditions on could never be gathered** — the fix would destroy its own ruling's decision criterion.
>
> **The protection is therefore declared-but-unchecked**, the posture C8 already accepted: the four story
> notes, plus the verification command run as a task with its output recorded in whichever story touches the
> field. `T275` stays open holding the future gate consideration, blocked on an observed drop.
>
> **This file is kept, not deleted.** If the evidence arrives it is the starting point — and the eleven
> Round 1 findings below are the fix list it must clear first. **All eleven are listed, because an earlier
> version of this sentence promised the findings were recorded and carried only five; the other six were
> left in the text below, unmarked.**
>
> *Shape and falsifiability:*
> 1. **AC3 is unfalsifiable** — it names no literal, and four defensible choices all "satisfy" it. Found from three independent directions.
> 2. **AC3 drops the fence case** — the body check passes with the pointer inside the ```xml fence, which is the exact regression the four `i97` notes warn about, for four of the seven files.
> 3. **AC3's justification is false** — `assert-shipped-links.js` does not assert `blob/main`; `shipped-links.js` returns `{kind:'skip'}` for any non-self-referential absolute URL, and `FORGE_LAYOUTS` accepts any ref. Swapping to a `raw.githubusercontent.com` host passes the new assertion and is skipped by the link gate.
> 4. **AC1/AC2 have no lower bound** — an 83-character description consisting only of the disclosure passes AC1, AC2 and AC4, which is the A1.5 regression inverted.
> 5. **AC5 admits three vacuous passes** — a `cp -R` copy exits 1 on a missing module; running from outside any `_bmad` ancestor exits 1 with zero checks run; and `findProjectRoot()` resolves from cwd, so the copy's script validates the real repo and prints green. AC5 must assert the failure *message*.
> 6. **AC4 is an AC the implementer may delete** by self-certification (Task 3), with no stated default and no holder named.
> 7. **AC6's `npm test` is flaky at HEAD** for reasons no diff here can touch — see `IN-251`.
>
> *Citations and attributions, all still present in the text below:*
> 8. **`i97-2-4:113` and `:383` are stale** — displaced by `c8d7594d`, the amendment the same sentence cites. At HEAD the quoted sentence is at `:136`; `:113` is now a comparison-table row.
> 9. **The `IN-245(a)` dev note inverts the provenance** — that row exists because `test:p0` is named nowhere in CI. The grep-the-name error was made by the row's own first draft, not by a story. The instruction the bullet gives is right; its reason is not.
> 10. **A1.3 is credited with the partial-listing clause and does not contain it** — A1.3 specifies a flat notice plus a pointer. The clause's authority is A1.1 plus the 2026-09-28 operator ruling recorded in `IN-248`. The verbatim wording of both strings is `cir-1-3`'s drafting choice, not the ADR's.
> 11. **Two measurement slips** — *"the next word breaks three of seven"* is a rhetorical figure, true only for an addition of exactly 11 characters (+9/+10 breaks two, +12 breaks six); and the Context says *"two operator-facing strings"* then enumerates three and writes three ACs.

> ## 🗒 SUPERSEDED — this banner's framing is wrong, and is kept as the record of why the ruling was sought
>
> **Corrected 2026-10-13 by ADR-001 Amendment 3.** This banner said the premise under D1 was *unruled* and
> that the on-point ruling *pointed the other way*. **A3.1 ruled the premise SOUND** — extending an
> already-wired check is not a new check under C1, on C10's precedent. What A3.2 ruled against is the gate,
> on sequence rather than budget. So the banner was right that a ruling was owed and wrong about which way
> C1 fell. The rest of it is the argument that produced the ruling and is kept verbatim below.
>
> **`ADR-001` C12, ruled 2026-09-27 and never amended, decides exactly the question D1 pins — against a gate:**
> *"the ratified sequence is ship, then a tiny baseline, then one measured test — and the hub is the measured
> test. Gating before the test runs inverts the order… **So the assertions run as story tasks with their
> output recorded in the story**… and a gate is considered **afterwards** — with evidence about what actually
> broke rather than a guess about what might."*
>
> This story cites C12 nowhere. It argued from one sentence of C1 about **registries** and did not search the
> same ADR for a constraint that had already answered the question. Three other artifacts say the same thing
> and all three were available: `cir-1-3` AC6 (*"C12 is the precedent for a recorded task instead"*),
> `cir-1-3` Dev Notes (*"Do not add a CI check for any of this. C1. If one looks necessary, that is a ruling,
> not a task"*), and `IN-250` itself (*"the mechanical option is a ruling, not a task"*).
>
> **Two facts make C12 bite harder here, not softer.** The "afterwards" it defers to is the measured test,
> which is `s4-1-1` — itself deferred. And implementing the assertion means the disclosure can never
> silently drop, so **the evidence C12 conditions on can never be gathered**: the deferred decision is not
> postponed but destroyed.
>
> **The ruling needs C1, C10 and C12 on the table together.** C10 is the stronger support this story
> under-claimed — an Amalik-ruled instance of an existing check's assertions being extended under the spent
> baseline (*"`name-registry-integrity.js` must learn the new kind in the same change"*). C1's registry
> sentence is the weakest.
>
> **If the ruling permits a gate, this spec needs revision rather than patches.** Round 1 found AC3
> unfalsifiable and foolable from three independent directions; AC1/AC2 have no lower bound, so a
> 83-character description consisting only of the disclosure passes every AC; AC5 admits three vacuous
> passes; AC4 is an AC the implementer may delete by self-certification; and AC6's `npm test` is flaky at
> HEAD for reasons no diff here can touch. Details in the review record below.


## Context

`cir-1-3` shipped two operator-facing strings into the seven agent skills that
[`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) declares:

- in each frontmatter `description`, the verbatim notice `Non-reference listing; complete product on GitHub + npm.` plus the partial-listing clause `Not every agent is listed.`
- in each body, under `## Maturity and limits`, a pointer to the maturity ledger

Both are required by [ADR-001](../planning-artifacts/adr/channel-integrity/adr-001-the-distribution-unit.md)
**A1.3**, and **A1.1** is the condition they satisfy: a channel listing must never claim more than the
ledger's status for that capability. **Amendment 2 A2.1** fixes their reach — these are a listing-channel
surface, rendered by the two channels that read `marketplace.json`, and nothing else.

**Nothing mechanical protects either string.** Measured 2026-10-11:

```sh
grep -rn 'Non-reference listing' --include='*.js' --include='*.yml' --include='*.json' --include='*.sh' . | grep -v node_modules
# → 0 matches
```

The only gate that parses the field is `auditSkillDirs` in
[`scripts/audit/validate-marketplace.js`](../../scripts/audit/validate-marketplace.js), and it asserts that
`description` is a non-empty string and nothing more. So AC1 and AC2 of `cir-1-3` can regress to **zero**
with every gate green.

**The regression has a date, not a hypothesis.** `i97-2-4`, `i97-2-5`, `i97-2-6` and `i97-2-7` are all
`ready-for-dev`, each converts one of the four v5 agents whose `description` `cir-1-3` rewrote, and each
instructs *"`description:` must be a real one-line description"* (`i97-2-4:113`, `:383`). Notes were added
to all four on 2026-10-11, which closes the immediate exposure. **This story is the standing floor:** a
reader's obligation protects four stories, not the fifth edit.

**What this is NOT.** Not a defect in `cir-1-3` — the strings are present and correct. Not a widening of
A1.3's reach: A2.2 ruled the export channel out, and nothing here touches `export-engine.js`.

## Design decisions (pinned)

**D1 — Extend `validate-marketplace.js`. Do not add a gate.** ADR-001 **C1** permits no new CI check under
the spent baseline, and its own text supplies the precedent: *"Extending an existing registry with a row
type is not a new deliverable."* The budgeted thing is the **set** of checks; an assertion inside a check
that already runs does not grow the set. `auditSkillDirs` already iterates `skills[]`, already reads each
`SKILL.md`, and already `yaml.load`s each frontmatter. **Winston qualified this row accepting that premise
on 2026-10-12**, and C1's precedent supports it — but if a reviewer reads C1 the other way, this is a
ruling request and the RICE is void.

**D2 — Assert on the parsed `frontmatter.description`, never on a grep of the frontmatter block.**
`cir-1-3`'s own AC1 falsifier scopes to the block rather than the key, and Round 1 demonstrated the hole: a
file carrying

```yaml
x_disclaimer: Non-reference listing; complete product on GitHub + npm.
description: "Discovery & Empathy Expert"
```

passes that falsifier with the `description` untouched — i.e. with the pre-install surface, the only one
both channels render, carrying no disclosure at all. The gate already has `frontmatter.description` in hand.
Use it.

**D3 — Protect the body pointer at the same site, because it is free there.** `auditSkillDirs` does
`const content = fs.readFileSync(skillMdPath, 'utf8')` and matches the frontmatter block out of it, so the
body is already in memory. No second read, no second traversal, no second gate. Assert the pointer against
the body — **not against the whole file**, or a notice that drifted into the body would satisfy both checks.

**D4 — Derive the seven from `marketplace.json`. Never hard-code a list or a count.** The gate already does
this; do not add a parallel roster. A count asserted here would rot the moment the manifest changes, and
`IN-248` carries what declaring more would cost.

**D5 — The test pins the literal by membership, not by importing the gate's constant.** If the test reads
the same constant the gate reads, deleting the notice from both passes. This is the trap recorded in
`project_review_rounds_correct_their_own_corrections`: *a fixture built from the list under test is blind to
deletion — pin by literal membership.* The expected string is typed into the test.

**D6 — Fail loud. No baseline, no allowlist, no soft-warn.** A dropped disclosure turns CI red. Safe
because the condition is binary and the remedy is one line of text, and consistent with
[`fast-upstream-name-staleness-gate`](fast-upstream-name-staleness-gate.md) D5.

**D7 — AC5a's 220-character bar comes along, and this is the one scope addition.** `cir-1-3` set it and
nothing enforces it; the worst description is 213, so the margin is 7 characters and the next word added to
the shared notice breaks three of seven. It is the same parsed value at the same site, so the marginal cost
is one comparison. **Flagged as an addition rather than smuggled in:** if the qualifier wants the row held
to the disclosure alone, drop AC4 below and the rest stands.

## Scope

**In:** `scripts/audit/validate-marketplace.js` (`auditSkillDirs` only), and
`tests/unit/validate-marketplace.test.js`.

**Out:** the seven agent files (already correct); `export-engine.js` (A2.2); the generated
`.claude/skills/bmad-agent-bme-*` wrappers, whose description is a template literal and which A2.1 records
as outside this surface; `skill-manifest.csv`'s separate description column; any new CI job or step.

## Acceptance criteria

**AC1 — a missing or altered notice fails the gate.** For each of the declared skills, the parsed
`frontmatter.description` must contain the exact substring `Non-reference listing; complete product on GitHub + npm.`
A failure names the skill path and which string is absent.

**AC2 — a missing partial-listing clause fails the gate.** Same, for `Not every agent is listed.`

**AC3 — a missing body pointer fails the gate.** The body — the file content after the frontmatter block —
must contain a markdown link whose target is the maturity ledger path. Assert the **path**, not the whole
URL: ADR-002's `blob/main` prefix is already asserted by `assert-shipped-links.js`, and duplicating it here
creates two places to update on a rename.

**AC4 — a description over 220 raw characters fails the gate.** *(D7; drop this AC if the row is held to
the disclosure alone.)*

**AC5 — the gate still passes on `HEAD` unchanged, and the check is proven able to fail.** Both directions
demonstrated, on a copy and never in the working tree:

```sh
set -o pipefail
node scripts/audit/validate-marketplace.js; echo "clean tree exit: $?"      # expect 0
# then, on a COPY outside the repo, delete the notice from one description and re-run — expect non-zero
```

**AC6 — no new gate, and the existing ones pass.** `npm test` · `npm run lint` · `npm run refs:audit` ·
`npm run docs:audit` · `node scripts/audit/backlog-integrity.js` · `npm run test:p0` ·
`node scripts/audit/agent-surface-parity.js "$(git describe --tags --abbrev=0)" HEAD` ·
`bash scripts/audit/try-fresh-install.sh` · `node scripts/audit/validate-marketplace.js`. No workflow file,
no `package.json` script, no new script file.

**AC7 — the test fails if the implementation is removed.** A positive control: with the new assertions
commented out, the new tests must go red. A test that passes against both states is not a test.

## Namespace decision

**Upstream-adjacent, Convoke-owned.** `scripts/audit/validate-marketplace.js` and
`tests/unit/validate-marketplace.test.js` are Convoke files. No `_bmad/` path is touched, no upstream BMAD
file is modified, and no skill or workflow is added — so the `covenant-compliance-for-convoke-skills` rule
does not apply: nothing operator-facing gains a decision point.

## Safety analysis

**`path-safety-for-destructive-ops`: not in scope, recorded rather than omitted.** Nothing here deletes,
moves or writes in an operator's tree, and no script gains a path argument. `auditSkillDirs` already walks
operator-controlled paths and already carries its symlink-escape guard (`R1-M2`, `R2-H2`, `R2-H3`); this
story adds string assertions inside that existing loop and must not weaken those guards.

## Dev notes — traps, each one already paid for

- **Trace the wiring; do not grep for the script's name.** `validate-marketplace.js` runs at `ci.yml:206`
  inside the `agent-surface-parity` job, and that job is in `publish.needs`. `IN-245(a)` exists because a
  story grepped for a script name, found nothing, and concluded "not wired".
- **`refs:audit` is not evidence for AC3.** `reference-integrity.js:318` returns `{valid: true}` for
  anything with a URL scheme. Its PASS counts the seven pointers without resolving them.
- **The notice is 56 characters and the clause 26**, and the appended overhead is 84 — space, notice, space,
  clause. Do not re-derive these into the gate as magic numbers; assert the strings.
- **Do not assert the ledger's filename is stable.** It is date-stamped, and a re-date breaking all seven
  links is a known residual recorded in `cir-1-3`. This gate asserts a pointer exists, not that the target
  survives a rename.
- **Line-number citations in this story will rot.** Anchor on symbol names when you read the code.
- **Grep the backlog before filing anything found along the way.** `cir-1-2` duplicated `T183` by ten days.

## Tasks

1. [ ] Read `auditSkillDirs` end to end and record what the existing symlink guards do, so the new
   assertions sit inside them rather than before them (D3, Safety analysis).
2. [ ] Add the three string assertions on the parsed `description` and the body (AC1, AC2, AC3), deriving
   the skill set from `skills[]` as the loop already does (D2, D4).
3. [ ] Add the length assertion, or delete AC4 if the row was held to the disclosure alone (D7).
4. [ ] Tests in `tests/unit/validate-marketplace.test.js`, with the expected literals typed in rather than
   imported (D5). Include the positive control required by AC7.
5. [ ] Prove the gate fails and passes (AC5), on a copy outside the repository. Paste both exits.
6. [ ] Run AC6's list. Paste the verdicts rather than paraphrasing them.
