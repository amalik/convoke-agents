---
initiative: convoke
artifact_type: note
qualifier: pieces-of-knowledge-to-review
created: '2026-09-27'
status: active
schema_version: 1
qualifier_role: operator-authored
---

# Pieces of Knowledge to Review

**What this is.** A queue of sentences in committed documents that evidence says are false, stale or
misleading — found incidentally while doing other work, recorded here instead of fixed in passing, so an
agent can be pointed at one entry and investigate it properly.

**Why it exists.** Stale prose in this repository is load-bearing: the maturity ledger told a leadership
audience *"Convoke is not listed"* while a Convoke agent was listed, and `ci.yml` explains a check's scope
with a `.gitignore` citation that points at a comment. A reader cannot tell a rotted sentence from a live
one, and whoever trips over it is rarely the right person to fix it.

**How to use it.** Each entry is self-contained: where the sentence is, what it says, what contradicts it,
and the command that shows the contradiction. **Nothing here is a fix** — an entry may turn out to be
right and the finder wrong. Resolve by editing the source and striking the row with the outcome; never
delete a row silently.

**How to add.** One entry per sentence. Include the derivation command. If you could not verify it, say so
in the Basis column rather than filing it as fact.

---

## Open

### K1 — `ci.yml:228-230` explains a check's scope with a citation that points at a comment

**Says:**
> It does NOT read `.claude/skills/`, which `.gitignore:62` ignores — a check over an ignored path passes
> vacuously in CI.

**Contradicted by:** `.gitignore:62` is a comment line (*"# directory, so we must (a) un-ignore .claude/…"*).
The operative rules are `:66-71`, and **four of them un-ignore** — two skills are tracked there.

```sh
sed -n '62p' .gitignore                      # a comment, not a rule
grep -n '^!\.claude' .gitignore              # 66, 68, 70, 71
git ls-files '.claude/skills/*' | wc -l      # 4
```

**Why it matters:** the operational conclusion still holds — the check genuinely does not read that path —
but the stated *reason* is false, so anyone reasoning from it concludes `.claude/skills/` is uninspectable
and untracked. It is neither. This sentence is cited in `s4-1-1`'s AC11 as needing correction when a third
tracked skill lands. **Basis: verified.**

### K2 — `INSTALLATION.md:100` calls every `.claude/skills/` entry auto-generated

**Says:**
> `├── .claude/skills/           # Claude Code skill wrappers (auto-generated)`

**Contradicted by:** `bmad-audit-skill-dirs/` and `bmad-register-skill/` are **hand-authored and
git-tracked**, un-ignored deliberately at `.gitignore:70-71` under the policy *"operator-tooling
slash-command skills shipped via npm-pack must be tracked"*, and shipped via `package.json` `files[]`.

```sh
git ls-files '.claude/skills/*'               # 4 files, 2 skills
```

**Why it matters:** the annotation tells a reader nothing in that directory is source, so a reader
looking for where those two skills live will not look there — and a contributor may regenerate over them.
**Basis: verified.**

### K3 — `INSTALLATION.md:118` scopes `.claude/skills/` to agents only

**Says:**
> **Skills** | Claude Code skill wrappers in `.claude/skills/` for every installed agent

**Contradicted by:** the directory also holds non-agent skills — Enhance, Artifacts and Portability
workflow wrappers, plus the two tracked operator tools in K2. "for every installed agent" both understates
the contents and mis-describes what a wrapper is for. **Basis: verified** (same command as K2, plus
`ls .claude/skills/` on an installed tree).

### K4 — the maturity ledger has ~22 further affected statements, not yet examined

**Says:** various, throughout `convoke-note-maturity-ledger-2026-09-14.md`.

**Contradicted by:** an independent reconciliation on 2026-09-26 identified **31** statements made false,
stale or misleading by the channel-integrity findings. **Nine were corrected in place** on 2026-09-26
(`d0923d40`) — the marketplace row, the supply-chain row, §2.13, §2.19, §2.1's reference audit, §2.2, the
contracts row and the §1 banner. **The remainder have not been examined.** They are enumerated with both
sides quoted in
`_bmad-output/planning-artifacts/prds/prd-BMAD-Enhanced-2026-09-26/reconcile-ledger.md`.

**Why it matters:** the ledger is client-facing and was presented to a leadership audience on 2026-09-22.
**Basis: the count is a reviewer's, not re-derived here** — treat 31 as a claim to check, not a fact.

### K5 — a test header will become false when `cir-1-1` lands

**Says:** `tests/unit/agent-activation-config-refs.test.js`, in its **WHAT THIS DOES NOT CATCH** paragraph:
> and the 3 v6.3 agents, which carry no activation block at all (T127)

**Contradicted by:** nothing yet — this is **forward-dated**. `cir-1-1` adds a sibling test covering
exactly those three agents' reference files, at which point the sentence understates what is covered.
Filed now because the story's Task 2 is the only thing that would catch it, and a later reader of the test
would have no reason to doubt it. **Basis: verified as currently true; flagged as due to rot.**

### K6 — the standalone export deletes any line carrying `{project-root}`, and nothing warns

**Says:** `scripts/portability/export-engine.js:481`, inside `frameworkPatterns`:
> `/\{project-root\}/`

Phase 3 then filters the line out entirely, and records a warning **only** for `.claude/hooks` and
`bmad-speak`.

**Contradicted by:** nothing — the code does what it says. The problem is that twenty-four lines later,
Phase 3b is deliberately surgical about the same content:

> Only strip lines whose primary content is a `_bmad/` path … **Avoid stripping the line if `_bmad/`
> appears only as a parenthetical or backtick reference.**

So a line mentioning `_bmad/` inline survives, and the same line carrying `{project-root}/_bmad/` is
deleted whole, silently.

```sh
# demonstrated during cir-1-1 R1: a sentence carrying the token disappears from the bundle
node scripts/portability/convoke-export.js bmad-agent-bme-lean-experiments-specialist --output <tmp>
grep -r 'rigor bar' <tmp>/   # nothing — the whole sentence was removed
```

**Why it matters:** `cir-1-1` prefixed 22 load instructions with `{project-root}/`. Harmless there,
verified — those sentences are absent from `instructions.md` both before and after, so pre- and post-fix
exports are byte-identical. But the convention the repo now enforces is on a collision course with this
filter: **any future prose carrying the token is removed from the ~40% Vortex-Standalone bundle with no
warning recorded.** The fix is probably to strip the token rather than the line, or to warn as the hook
patterns do — but it is a change to a shipped script for the standalone segment, so it wants its own scope.
**Basis: verified** (the filter, the Phase 3b asymmetry, and the byte-identical exports).

### K7 — the ratified v6.3 architecture mandates `bmad-init` delegation in four places

**Says:** `convoke-arch-bmad-v63-source-format-adoption.md` at `:93`, `:429-430`, `:685`, `:702` — e.g.
> Every converted agent's `## On Activation` section delegates to `bmad-init` skill rather than encoding
> hardcoded `<step>` orchestration · Format: "Load config via `bmad-init` skill…"

**Contradicted by:** `bmad-init` has not existed since upstream's 6.2.x removals, and `T183` will replace
those delegations with a direct read of `_bmad/bme/config.yaml`.

```sh
grep -n 'bmad-init' _bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md   # 4 sites
```

**Why it matters:** this is **ratified architecture**, so it is the document a future conversion story
reads to learn the pattern — and it currently teaches delegating to a skill that does not exist. **Forward-dated
rot, attributed to `T183`.** **Basis: verified.**

### K8 — `CHANGELOG.md` claims a 4.0 change that did not happen, and contradicts itself

**Says:** `:152` — *"Agents load configuration directly from `_bmad/{module}/config.yaml` at activation,
**replacing the prior `bmad-init` activation step**"*; `:170` — *"**`bmad-init` skill** — Removed; the
activation step it provided is now handled directly by the configuration loading change above"*; `:179` —
4.0 *"keeps `bmad-init` and the current agent set intact"*.

**Contradicted by:** the three converted agents still open with *"Load config via bmad-init skill"* —
`grep -rl bmad-init _bmad/bme/` returns them. So `:152` and `:170` describe a change that was never made,
and `:179` contradicts `:170` **in the same file**.

**Why it matters:** the CHANGELOG is operator-facing and shipped, so this is the strongest class in this
queue — a released document asserting a fix that does not exist. **`committed-artifact-integrity` means a
shipped CHANGELOG is not rewritten in passing**, so this needs a deliberate decision about how a released
changelog is corrected, not an edit. Already recorded at maturity-ledger `:214`; filed here so it is not
only inside a ledger note. **Basis: verified.**

### K9 — the cadence floor is recorded as N-8 and is now N-9

**Says:** `convoke-arch-bmad-v6.4-v6.8-absorption.md:230` — *"the product floor is v6.3 against a v6.11
head, i.e. **N-8**"*.

**Contradicted by:** `npm view bmad-method dist-tags --json` → `latest: 6.12.0`. Floor v6.3 against a 6.12
head is **N-9**. The figure was correct when written on 2026-08-14 and drifts with every upstream minor.

**Why it matters:** it is a *derived* figure stated as a constant in an architecture document, and it was
restated as current in a story on 2026-09-27. Either express it as the command, or date it. **Basis:
verified.**

---

## Resolved

*(strike the row, record the outcome and the commit — never delete)*

| Entry | Outcome |
|---|---|
| **K5** | **Resolved 2026-09-27.** It predicted `tests/unit/agent-activation-config-refs.test.js`'s non-detection paragraph would become false when `cir-1-1` landed. `cir-1-1` landed (`ba15efc7`) — and the prediction held only in part: the sibling's own header was never edited, because `cir-1-1` created a **separate** test rather than extending it, so the sentence *"the 3 v6.3 agents, which carry no activation block at all"* is still literally true of that file. **The row is kept struck rather than deleted** because the near-miss is the useful part: the rot was avoided by a design choice made for an unrelated reason (`T138`'s do-not-patch-a-third-time), not by anyone acting on this entry. |
