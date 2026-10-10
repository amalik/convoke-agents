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

### ~~K7 — the ratified v6.3 architecture mandates `bmad-init` delegation in four places~~ — **RESOLVED, see below**

**Says:** `convoke-arch-bmad-v63-source-format-adoption.md` at `:93`, `:429-430`, and the two summary
sites originally cited as `:685` and `:702` — now `:715` and `:732`, because Amendment 1 inserted lines
above them. Re-derive rather than trust these numbers. E.g.
> Every converted agent's `## On Activation` section delegates to `bmad-init` skill rather than encoding
> hardcoded `<step>` orchestration · Format: "Load config via `bmad-init` skill…"

**Contradicted by:** `bmad-init` has not existed since upstream's 6.2.x removals. `T183` replaced those
delegations with a direct read of `_bmad/bme/_vortex/config.yaml` — **not** `_bmad/bme/config.yaml`, which
this entry originally predicted and which turned out to be a file Convoke never writes.

```sh
grep -n 'bmad-init' _bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md
# 4 sites when this was filed; 6 hits now, because Amendment 1's own prose names the skill it retires
```

**Why it matters:** this is **ratified architecture**, so it is the document a future conversion story
reads to learn the pattern — and it currently teaches delegating to a skill that does not exist. **Forward-dated
rot, attributed to `T183`.** **Basis: verified.**

### K8 — `CHANGELOG.md` claims a 4.0 change that did not happen, and contradicts itself

**Says:** `:152` — *"Agents load configuration directly from `_bmad/{module}/config.yaml` at activation,
**replacing the prior `bmad-init` activation step**"*; `:170` — *"**`bmad-init` skill** — Removed; the
activation step it provided is now handled directly by the configuration loading change above"*; `:179` —
4.0 *"keeps `bmad-init` and the current agent set intact"*.

**Contradicted by:** `:179` contradicts `:170` **in the same file** — that half stands and is untouched
by anything since.

> **Narrowed 2026-09-27 by `T183`.** The original contradiction rested on the three converted agents still
> opening with *"Load config via bmad-init skill"*, shown by `grep -rl bmad-init _bmad/bme/` returning
> them. **That command now exits 1 with no output**, so this entry no longer has the falsifier the queue's
> own rules require, and `:152`/`:170` are no longer describing a change that was never made — `T183` made
> it. Two residues survive and are why the row stays open: `:179`'s self-contradiction, and the fact that
> `:152` names `_bmad/{module}/config.yaml` while the shipped read is the **submodule** config
> `_bmad/bme/_vortex/config.yaml`, because the bme-level file is BMAD's installer's to write. Also
> `CHANGELOG.md:21-22` — *"(Emma, Mila and Wade load their config a different way and never hit that
> branch…)"* — keeps a true conclusion on dead reasoning: they now read exactly that file. **Re-derive
> before acting:** `grep -rl bmad-init _bmad/bme/; echo $?` and `sed -n '150,180p' CHANGELOG.md`.

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

### K10 — the maturity ledger discloses a defect the product no longer has

**Says:** `convoke-note-maturity-ledger-2026-09-14.md:211` — *"Emma, Wade and Mila read `1. **Load config via
bmad-init skill**`"*; `:81` — *"Their first activation step calls a `bmad-init` skill that no longer exists in
the package"*; `:219` — the **Works with limits** rating rests partly on *"The one-shot activation defect in
the converted agents is unverified in impact."* `:135` and `:502` also list `T183` in the Bug Lane; `:135` is pinned to a `git show HEAD:` snapshot and is
a measurement record, `:502` presents the same list as current state and is not.

**Contradicted by:** `T183`, closed 2026-09-27 — **for the mechanism sentences only.** `grep -rl bmad-init _bmad/bme/` exits 1 with no output, so `:211` and the `bmad-init` clause of `:81` are stale. **`:219` is NOT contradicted:** *"unverified in impact"* is still true and stays — `T183` replaced an instruction and did not establish what the agents do at run time. Likewise `:81`'s non-determinism observation (`:27`, read once in four runs) is untouched. Only the mechanism is stale; re-derive with `grep -n 'bmad-init' _bmad-output/planning-artifacts/convoke-note-maturity-ledger-2026-09-14.md`.

**Why it matters:** this is **page 2 of a client-facing document**, and
`convoke-epic-evaluate-door-2026-09-22.md:58-61` sets the standard itself: *"A ledger that discloses a defect
the product no longer has is as wrong as one that hides a defect it still has, and it is wrong in the
direction that costs credibility twice."* **Note what does NOT change:** uncertain-row 1 stays uncertain —
`T183` replaced an instruction, and did not establish what the agents do at run time. `:135` is explicitly
pinned to a `git show HEAD:` snapshot and is a measurement record; `:502` presents the same list as current
state and is not. **Basis: verified.**

### K11 — a SHIPPED migration doc names the wrong config file

**Says:** `docs/migration/3.x-to-4.0.md:31` — *"**In 4.0:** Convoke loads configuration directly from
`_bmad/{module}/config.yaml` at activation."* `docs/migration/` is in `files[]`, so this reaches operators.

**Contradicted by:** the shipped read is the **submodule** config `_bmad/bme/_vortex/config.yaml`. The
bme-level `_bmad/bme/config.yaml` is BMAD's installer's to write and is absent from a Convoke-only install —
`bash scripts/audit/try-fresh-install.sh` then
`find <proj> -name 'config*.yaml' -not -path '*/node_modules/*'` → six submodule configs, no bme-level one.

**Why it matters:** an upgrading operator following this doc looks in a file that does not exist on their
tree. Same sentence shape as `K8`'s `CHANGELOG.md:152`, and the two should be corrected together.
**Basis: verified.**

### K12 — the in-flight Evaluate-door draft restates the deleted behaviour in three places

**Says:** `_bmad-output/drafts/docs-program/customize-without-forking.md:249` — *"**Emma, Mila and Wade** load
settings through a `bmad-init` step that no longer exists"*; `:85` and `:358` — *"no dependable way to read
project files at startup — measured 1 run in 4 (`T183`)"*. Evidence file
`customize-without-forking.evidence.md:55` (C13) and `:301` (D9) record the `bmad-init` step as the basis.

**Contradicted by:** `T183`. The `bmad-init` half is now false.

**Re-derive:** `grep -n 'bmad-init\|no dependable way\|one run of four' _bmad-output/drafts/docs-program/customize-without-forking.md`
and `grep -n 'bmad-init' _bmad-output/drafts/docs-program/customize-without-forking.evidence.md`.

**Why it matters:** each claim cites `T183` as the tracker that will fix it, and `T183` is closed — so nothing
brings a reader back. Not in `files[]` today, but this is a Wave-2 docs-program deliverable aimed at
operators. **The 1-in-4 measurement is NOT superseded** and must survive any edit: it is about whether these
agents read config at run time, which `T183` did not change. Only the mechanism sentence is stale.
**Basis: verified.**

### K13 — the maturity ledger cites a backlog section that does not exist

**Says:** `convoke-note-maturity-ledger-2026-09-14.md:502` — the Bug Lane list is attributed *"as §2.0
records"*.

**Contradicted by:** the backlog has §2.1–§2.5 and no §2.0 —
`grep -n '^### 2\.' _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`.

**Why it matters:** a broken attribution on a client-facing page, and a different class from `K10` (which is
about a defect the product no longer has). Filed separately because this queue's rule is one entry per
sentence. **Basis: verified.**

### K14 — the customise draft says a refresh deletes skill names it does not recognise

**Says:** `_bmad-output/drafts/docs-program/customize-without-forking.md:64` — *"Names Convoke doesn't
recognise are **deleted**."* — and `:284` — *"Convoke's refresh … **deletes** any
`.claude/skills/bmad-agent-bme-*` or `.claude/skills/bmad-enhance-*` directory it doesn't recognise."*

**Contradicted by:** `T252`. Such a directory is now left in place and reported as `Left in place`, and
content inside a wrapper Convoke owns is copied to `_bmad-output/.backups/skill-wrappers/` before it is
replaced. `node --test tests/unit/refresh-installation-operator-wrappers.test.js` — the two
*"leaves … in place and reports it"* tests.

**Why it matters:** the draft's advice to choose a prefix other than `bmad-` gives this deletion as its
reason. The advice may still be right; the reason is no longer true. The companion `.evidence.md` records
dated measurements against 4.0.2 and should be left as it is. **Basis: verified** for the behaviour;
the two line numbers were read on 2026-10-09 and the draft is in flight.

### K15 — Epic 7's FR5 requires removing an orphaned Enhance wrapper, which the refresh no longer does

**Says:** `_bmad-output/planning-artifacts/convoke-epic-7-platform-debt.md:40` — *"FR5: When a workflow is
removed from `_artifacts/config.yaml` or `_enhance/config.yaml`, the next `convoke-update` MUST detect and
remove its orphaned skill wrapper."*

**Contradicted by:** `T252`, for the Enhance half only. A `bmad-enhance-*` directory outside the current
config is left in place, because the prefix does not show Convoke wrote it and Enhance has never retired a
workflow name — `git log --format=%H -- _bmad/bme/_enhance/config.yaml` shows one name in every revision.
The Artifacts half still holds. See the Strategy 1 comment in `cleanupOrphanWorkflowWrappers`.

**Why it matters:** if this epic is read as a live requirement, the next Enhance workflow to be retired
will look like a regression against FR5. It needs that workflow's exact name listed for removal, not the
prefix sweep back. **Basis: verified** for the behaviour; whether the epic is live or a record of a
finished story (`ag-7-4` is done) is **unchecked**.

### K16 — two planning documents say nothing after 4.0.3 is published

**Says:** `_bmad-output/planning-artifacts/convoke-epic-team-factory-unship.md:256` — *"**Nothing is
published.** `npm view convoke-agents dist-tags` reads `latest: 4.0.3`"* — and
`_bmad-output/planning-artifacts/convoke-note-maturity-ledger-2026-09-14.md:263` — *"not in any published
release: the fix is under `[Unreleased]` and npm `latest` is 4.0.3"* (the `T91` annotation; `:91` quotes
the same dist-tags as a dated capture).

**Contradicted by:** `npm view convoke-agents dist-tags --json` → `"latest": "4.0.4"`, published
2026-10-10. `CHANGELOG.md` has no `[Unreleased]` section any more; the Team Factory withdrawal and the
`T91` Gyre guides fix are both in `## [4.0.4]`.

**Why it matters:** the maturity ledger is read by a leadership audience and its `T91` line tells them a
fix is not available when it is. The ledger marks itself a dated snapshot that is annotated rather than
rewritten, so the repair is another annotation, not an edit of the capture at `:91`. **Basis: verified**
for the registry and the changelog; the two line numbers were read on 2026-10-10.

### K17 — the evaluation pack says the interview workflow gives no help with personal data (true today, false at the next release)

**Says:** `_bmad-output/drafts/docs-program/evaluate-executive-brief.md` — *"The discovery workflows produce
personal data, and we give you no help governing it … It says **nothing** about data minimisation,
retention, lawful basis or participant withdrawal; the word *consent* does not appear in it, and nothing
tells you how long to keep a participant table or how to remove someone from it."* The same claim is in
`evaluate-due-diligence-pack.md` (*"we do not currently help you meet them"*) and `evaluate-page-one.md`
(*"personal data that we give you no help governing"*). No line numbers: these files were being edited by
another session on 2026-10-10.

**Contradicted by:** `T185`, in the tree but **not in published 4.0.4**. `grep -rci consent
_bmad/bme/_vortex/workflows/user-interview` on `main`, and step 3 section 7 of that workflow. Against the
published package the sentences are still accurate: `npm pack convoke-agents@4.0.4` and the same grep.

**Why it matters:** this is the disclosure the brief calls the one *"we would least like you to find on your
own"*, so it should be exactly right in both directions. After the next release it understates the product.
What stays true and should survive the rewrite: the guidance is advice with defaults, nothing enforces it,
it makes no compliance claim, the default output folder is still inside version control (`T256`), and
"discovery workflows" plural was already loose — `user-discovery` has carried consent and retention
guidance in its step 3 since before this pack was written. **Forward-dated, attributed to `T185`. Basis:
verified** for the tree; the published-package grep was **not run** by me.

## Resolved

*(strike the row, record the outcome and the commit — never delete)*

| Entry | Outcome |
|---|---|
| **K5** | **Resolved 2026-09-27.** It predicted `tests/unit/agent-activation-config-refs.test.js`'s non-detection paragraph would become false when `cir-1-1` landed. `cir-1-1` landed (`ba15efc7`) — and the prediction held only in part: the sibling's own header was never edited, because `cir-1-1` created a **separate** test rather than extending it, so the sentence *"the 3 v6.3 agents, which carry no activation block at all"* is still literally true of that file. **The row is kept struck rather than deleted** because the near-miss is the useful part: the rot was avoided by a design choice made for an unrelated reason (`T138`'s do-not-patch-a-third-time), not by anyone acting on this entry. |
| **K7** | **Resolved 2026-09-27 by `T183`.** All four sites in `convoke-arch-bmad-v63-source-format-adoption.md` are corrected: the normative FR4 bullets are left standing and answered by **Amendment 1** directly beneath them — a ratified decision is superseded in place, not rewritten — and the dependency entry plus the two summary sites now point at it. **Re-derive rather than trusting line numbers here; this change shifted them once already:** `grep -n 'bmad-init' _bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md` — every hit should be the struck entry, the two superseded bullets, the Amendment's own prose, or the corrected pointer; none a live instruction. **The shipped fix reads that config as its only source, not as a fallback** — an earlier draft of this row described a fallback chain that the remediation deleted. *(Commit: this row is written in the change that resolves it, so no SHA exists yet — trace with `git log --oneline -- _bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md`.)* |
