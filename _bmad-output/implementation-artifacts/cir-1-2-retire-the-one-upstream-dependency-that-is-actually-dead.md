---
baseline_commit: a9324a44
---

# Story cir-1.2: Retire the one upstream dependency that is actually dead

Status: superseded-by-T183

**Epic:** [cir — Channel-Integrity Remediation](../planning-artifacts/convoke-epic-channel-integrity-remediation.md)
**Namespace decision:** Convoke-owned — three `SKILL.md` files under `_bmad/bme/_vortex/agents/`. No script, no test helper, no new skill.
**Safety analysis (`path-safety-for-destructive-ops`):** not in scope. Nothing deletes, moves or writes in an operator's tree; no script gains a path argument.

> ## ⛔ SUPERSEDED BY `T183` — do not implement. Closed 2026-09-27, unimplemented.
>
> **`T183` was already this story**, filed **2026-09-17**, naming the same three agents, the same
> `bmad-init` routing and the same OC-R3 dependency — and already cited by the Evaluate-door pack, the
> release-truth epic and the maturity ledger. I authored a parallel story for a filed defect and never
> grepped the backlog. That omission is now a clause in `derive-before-you-write`.
>
> **An adversarial review also found the fix below is wrong**, which is why nothing here should be copied:
> it prescribes `resolve_config.py` plus the *submodule* config, when `--module bme` loaded
> `_bmad/bme/config.yaml` — one read that supplies everything, including the `document_output_language` and
> `project_name` this design silently drops. It would also take `_bmad/bme/`'s Python usage from **0 to 3**,
> forfeiting the invariant the absorption architecture credits with making upstream's churn inert. And AC1's
> falsifier `grep -rc` exits 0 whether or not the string is present, so it read satisfied with the defect live.
>
> **What survives and moved to `T183`:** the derivation that only `bmad-init` is genuinely dead, that
> `bmad-sprint-planning` was never a dependency, and the corrected fix — one read of `_bmad/bme/config.yaml`,
> no Python, `grep -rl`, an OC-R1 neutral default, and an explicit call on soft-warn versus the four other
> Vortex agents' documented hard stop.
>
> **Kept, not deleted**, because the review that dismantled it is the most useful thing in the file.

> **Derived before written.** The epic row this story implements claimed four dead upstream
> dependencies. **Three of them are not dead.** Deriving first cut the story from four items to one and
> from days to about an hour. Commands are inline; re-run them rather than trusting the numbers.

## Root cause — one item, not four

```sh
# what a released BMAD actually ships (this is what operators install)
npm view bmad-method@6.12.0 dist.tarball --json | tr -d '"' | xargs curl -sL \
  | tar -tzf - | grep -oE 'bmad-(help|init|create-prd|create-epics-and-stories)' | sort -u
#   bmad-create-epics-and-stories
#   bmad-create-prd
#   bmad-help          <- all three PRESENT
#   (bmad-init absent)
```

| Dependency | Convoke refs | Released BMAD | Verdict |
|---|---|---|---|
| **`bmad-init`** | **6 in 3 files** | **absent** (removals.txt, 6.2.x block) | **dead — this story** |
| `bmad-help` | 23 in 13 files | present | works today; renamed to `bmad` only on unreleased `main` |
| `bmad-create-prd` | 1 in 1 file | present | works today; renamed on `main` |
| `bmad-create-epics-and-stories` | 1 in 1 file | present | works today; replaced on `main` |
| `bmad-sprint-planning` | **0** | — | never a Convoke dependency |

```sh
for s in bmad-init bmad-help bmad-create-prd bmad-create-epics-and-stories bmad-sprint-planning; do
  printf '%-32s %s refs in %s files\n' "$s" \
    "$(grep -rho "$s" _bmad/bme/ | wc -l)" "$(grep -rl "$s" _bmad/bme/ | wc -l)"; done
```

**Why the other three are out of scope and not deferred-by-omission.** Their replacements exist only on
upstream `main`, which is in **no tagged release** — `removals.txt` calls it "the v7 installer". Acting now
is restructuring against an unreleased branch, which
`convoke-arch-bmad-v6.4-v6.8-absorption.md:230` warns against while recording the product floor at
**N-8**. They become work on the day upstream cuts v7, and that is a **watch item**, not a story.

**And all 23 `bmad-help` references are one shape** — the agent telling the operator *"you can type
`/bmad-help` at any time"*. Correct today. Wrong the day v7 ships. Nothing to fix yet.

## What is broken

`_bmad/bme/_vortex/agents/{contextualization-expert,lean-experiments-specialist,research-convergence-specialist}/SKILL.md`,
activation step 1:

> **Load config via bmad-init skill** — Store all returned vars for use: Pass `--module bme` to load
> Vortex-module config … **Note:** if Vortex config is missing, `bmad-init` runs an interactive
> walkthrough to set it up (this satisfies Operator Covenant OC-R3 …)

`bmad-init` has not existed since the 6.2.x removals. So the three converted agents open by invoking a
skill that is not there, and the OC-R3 compliance the note claims rests on it. This is the maturity
ledger's **uncertain-row 1**.

## The replacement — two reads, because one does not cover it

```sh
uv run _bmad/scripts/resolve_config.py --project-root . --key core.user_name --key core.communication_language
# {"core.user_name": "Amalik", "core.communication_language": "English"}
uv run _bmad/scripts/resolve_config.py --project-root . | python3 -c 'import json,sys; print(sorted(json.load(sys.stdin)))'
# ['agents', 'core', 'modules']   <- no bme/vortex key
```

`resolve_config.py` is the resolver upstream's own skills use, and it supplies `user_name` and
`communication_language`. **It does not reach Vortex's module config**, which is plain YAML at
`_bmad/bme/_vortex/config.yaml` and holds `output_folder` and the agent list. So step 1 becomes a
resolver call **plus** a direct read of that file.

## Acceptance Criteria

**AC1 — no shipped Convoke file instructs an agent to use `bmad-init`.** Falsifier:
`grep -rc bmad-init _bmad/bme/` returns non-zero.

**AC2 — each of the three agents resolves `user_name` and `communication_language` via
`uv run {project-root}/_bmad/scripts/resolve_config.py --project-root {project-root} --key core.user_name
--key core.communication_language`.** The `{project-root}/` prefix is required on the **script path too**,
not only on the config read in AC3 — an earlier draft of this AC required it of one and not the other,
which is the exact defect `cir-1-1` had just finished removing from 22 paths.

**AC2a — the dependency is declared, not assumed.** `_bmad/scripts/` is **BMAD's to ship, not Convoke's**
(`package.json` `files[]` carries only `_bmad/bme/*` and `_bmad/_config/skill-manifest.csv`), and a
released BMAD does ship it — verified in the 6.12.0 tarball at `package/src/scripts/resolve_config.py`.
The activation text must therefore behave per AC4/AC5 when the script is absent, which is the standalone
case, and must not claim Convoke provides it. Note this inherits upstream's `uv`/Python requirement.

**AC3 — each reads Vortex module config directly** from `{project-root}/_bmad/bme/_vortex/config.yaml`,
with the `{project-root}/` prefix per `cir-1-1`.

**AC4 — the OC-R3 claim is re-earned, not inherited.** The old note satisfied OC-R3 by delegating to
`bmad-init`'s walkthrough. With that gone, a missing config must still give the operator a **consequence**
and a **next action** — per `compliance-checklist.md`, OC-R3 needs a sentence naming consequence,
trade-off or downstream effect, and OC-R6 needs a concrete remedy. Minimum: name the file, say what the
agent cannot do without it, and give `npx -p convoke-agents convoke-install`. **Deliberately not the full
hub self-repair** — that is `s4`'s job; this is the sentence that makes the claim true meanwhile.

**AC5 — `preflight-soft-warn` shape.** A missing config warns and continues; it never refuses, and never
offers abort as the only option.

**AC6 — the epic row is corrected in the same change.** It names four dead dependencies; three are alive
and one was never a dependency. Leaving it is how the next reader re-does this derivation.

**AC7 — the v7 watch item is filed**, naming the three renames and the release that triggers them.

**AC8 — no new gate, and the existing ones pass.** `npm test` · `npm run lint` · `npm run refs:audit` ·
`npm run docs:audit` · `node scripts/audit/backlog-integrity.js` ·
`node scripts/audit/agent-surface-parity.js "$(git describe --tags --abbrev=0)" HEAD`.

## Tasks

1. [ ] Rewrite activation step 1 in the three `SKILL.md` files (AC1–AC5).
2. [ ] Correct the epic's `cir-1-2` row with the derived table (AC6).
3. [ ] File the v7 watch item (AC7).
4. [ ] Gates (AC8).

## Dev Notes

**Why no test — and a correction to an earlier draft of this note.** The draft claimed
`agent-surface-parity.js` "already asserts config-load preservation … and would catch a broken activation
block." **It would not.** Its check (`:110`) is a substring presence test:

```js
return /config\.yaml|load.{0,20}config|config.{0,20}load/i.test(text);
```

The broken text *"Load config via bmad-init skill"* matches `load.{0,20}config`; the replacement matches
`config\.yaml`. **It passes both and cannot distinguish them** — nor either from prose that merely mentions
config near "load". Its own comment says "coarse but exact". That is the presence-only class this
repository keeps re-learning, and citing it as coverage was the same mistake as naming a gate that cannot
fail.

What remains true: **AC1's `grep` is a genuine falsifier** for the invariant this story actually asserts —
no shipped file names `bmad-init`. It fails when the invariant fails and passes only when it holds. A
dedicated test file for a one-string invariant would be a new gate, which ADR-001 C1 forbids under the
spent baseline. **So: no test, but on AC1's grep alone — not on parity coverage that does not exist.**

**What this does not fix.** Whether the three agents *reliably* read config at runtime. The ledger records
that behaviour as varying between runs of the same project, and observing it once is not evidence either
way. This story removes a reference to a skill that does not exist; it does not prove the replacement is
read. That distinction is the ledger's uncertain-row 1, and it stays uncertain.
