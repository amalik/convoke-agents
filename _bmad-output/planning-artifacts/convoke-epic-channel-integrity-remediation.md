---
initiative: convoke
artifact_type: epic
qualifier: channel-integrity-remediation
created: '2026-09-26'
status: ready
schema_version: 1
qualifier_role: operator-authored
---

# Epic: Channel-Integrity Remediation (`cir`)

**Created 2026-09-26 by operator ruling.** An incident-driven mini-epic, following the
`fic` / `tfr-epic-1` / `lint-epic-1` / `ci-hygiene-epic-1` precedent.

**Evidence:** [`convoke-note-channel-integrity-findings-2026-09-26.md`](convoke-note-channel-integrity-findings-2026-09-26.md)
**Ruling it sits under:** [`adr/channel-integrity/adr-001-the-distribution-unit.md`](adr/channel-integrity/adr-001-the-distribution-unit.md)
— accepted 2026-09-26. **C10 and C11 stand. The "S2 the destination" half was overturned by Amendment 1 A1.2 (2026-09-27): S2 is reopened, is not a destination, and S4 is not a step toward it.** Corrected 2026-09-28 — an earlier pass corrected the identical sentence in the sibling `s4` epic and missed this one, because the sweep was run against the sentence in one file instead of against the claim.

## Why

A `skills.sh` listing of one Convoke agent exposed that `.claude-plugin/marketplace.json`,
shipped in `files[]`, is an **active publication surface**: the `npx skills` CLI searches
manifest-declared paths at their declared depth, bypassing its own bounded directory walk.
Convoke has been publishing seven agents to a public channel it did not treat as one.

Six defects were verified. **Three are remediation and belong here.** The other three are
resolved elsewhere, and saying so is half the point of this epic — see *Not in scope*.

## Scope: three stories

| Story | Defect | What it changes |
|---|---|---|
| `cir-1-1` | 2 — references do not resolve where the skill lands | Every cross-directory reference in a shipped skill states its resolution base: **22** bare paths across **12** files in `_bmad/bme/_vortex/agents/*/references/`. Those 12 belong to exactly the **three v6.3-converted agents**, so `T87`'s remaining four conversions would re-mint the defect — hence an assertion, not a sweep. Its home is the named gap in `tests/unit/agent-activation-config-refs.test.js` (*"the 3 v6.3 agents, which carry no activation block at all"*), so it rides `npm test` and adds no gate. **Two corrections to this row, made 2026-09-27 when the story was authored:** `T138`/`T214` are `loom` rows about Team Factory's `activation-validator.js` for *generated* agents — the defect *class* is shared, the *check* is not, and T138's "do not patch it a third time" does **not** govern this work; and the `_bmad/core/` references are **reassigned to `cir-1-2`** — they sit in the four *v5* agents' `SKILL.md`, are **already `{project-root}/`-prefixed**, and their real problem is that `_bmad/core/` is BMAD's to ship rather than Convoke's, which makes them correct for the ~60% addon segment and unresolvable only for the ~40% standalone. A two-segment dependency question, not a prefix one. |
| ~~`cir-1-2`~~ | 3 — dead upstream dependencies | **CLOSED 2026-09-27 as a duplicate of `T183`**, which was filed 2026-09-17 for exactly this defect and is cited by the Evaluate-door pack, the release-truth epic and the ledger. **And the row's premise was wrong:** derived against the released `bmad-method@6.12.0` tarball, only **`bmad-init`** is actually dead (6 refs, 3 files); `bmad-help` (23 refs), `bmad-create-prd` and `bmad-create-epics-and-stories` all ship and work today, and **`bmad-sprint-planning` was never a Convoke dependency at all** (0 refs). Those three become work when upstream cuts v7, not now. Two caveats a reviewer added: `bmad-create-prd`'s replacement IS released (the old path is a deprecation shim), and two of the 23 `bmad-help` refs are **OC-R6 error-path pointers**, not greetings (`bmad-export-skill/workflow.md:57,71`) — so the "nothing to fix yet" reading does not fully hold. Work continues under `T183`. |
| `cir-1-3` | 1 — **partially**; see the note below this table | **RE-SCOPED 2026-09-28 by operator ruling: it is now ADR-001 Amendment 1 **A1.3**'s disclaimer** — a terse pre-install notice in the frontmatter `description` plus a post-install pointer to the maturity ledger, never a transcribed status — and it folds in **A1.5**. Scope is the **7** declared manifest paths. **Every derivation, figure and command lives in the story, not here.** Two review rounds each found a defect in a figure this row had duplicated, and each correction landed in one file and not the other; the row now points instead. → [`cir-1-3`](../implementation-artifacts/cir-1-3-make-a-skill-that-arrives-alone-say-so.md). Gyre is out of scope: **`IN-248`**. Defect 1's detection half is out of scope: **`IN-249`**. |

> **⚠ Defect 1 is now only PARTIALLY addressed, and the remainder is filed rather than folded.** The
> findings note records defect 1 as *"A skill arriving without its runtime fails without naming what is
> missing"* — two behaviours: **disclosure** (the operator is told) and **detection** (the skill notices at
> run time and does not silently produce output). `cir-1-3` as re-scoped delivers the **disclosure** half.
> A frontmatter notice and a body link do **not** make a skill detect an absent runtime, name the missing
> component, or stop it producing output — different behaviours at a different moment. **The detection half
> is `IN-249`**, not this story, and not `s4-1-1` either (the hub would repair the runtime for itself, not
> teach 7 agents to notice). Recorded because the handoff §7 trap says a folded scope must dispose of every
> part explicitly — inherited, satisfied, or re-filed — and an earlier version of this table said
> *"Folded"* without naming where the rest went.

## Not in scope, stated as decisions

- **Defect 0 — the 38 non-product `SKILL.md`.** Downgraded twice by verification and **not
  a story.** Only **7** of the 38 sit at depth ≤ 5, the recursive fallback caps at
  `maxDepth = 5`, and manifest paths are walked before the zero-length test, so
  `--full-depth` cannot reach 31 of them and the "one `.gitignore` change away" reading was
  false. The residue is filed as **`IN-236`** (13 duplicate names; the real risk is
  install-destination overwrite, not registry shadowing) and **`IN-237`** (the one
  smoke-test file outside `tests/`). A depth-invariant CI check is attractive and cheap,
  **but ADR-001 C1 allows no new CI check under the ratified baseline** — it needs its own
  ruling, not a story here.
- **Defect 4 — Gyre unreachable by any skills channel.** ~~*Resolved by the ruling's design, not by
  remediation.*~~ **CORRECTED 2026-09-28 per ADR-001 Amendment 1 A1.4(1).** The original row answered
  *"can Gyre run"* — it can; `refresh-installation.js:853-878` generates a wrapper per `GYRE_AGENTS`
  member at install. A1.1 asks *"can Gyre be **referenced** in a channel"*, which needs a declarable
  manifest path, i.e. a `SKILL.md` **in the repository**. There is none. Closing it is a layout migration
  of the kind `v63-3-1` performed for Vortex, it is a prerequisite with real cost, and it is nobody's
  story today.

  **The derivation, the two checks it also drags in, and the C8 exposure are all in `IN-248`.** They are
  not repeated here — this row twice carried a copy that drifted from the source. The row's closing
  sentence still stands on its own terms: any wording claiming Gyre's agents *"exist nowhere in the tree"*
  is false — they exist as `_bmad/bme/_gyre/agents/<id>.md`; what they lack is the skill-directory shape a
  channel can point at.
- **Defect 5 — the maturity ledger.** **Shipped 2026-09-26** (`d0923d40`): nine in-place
  corrections in the ledger's own `Reclassified` convention, original wording retained.
- **Building S4.** The hub skill, making the manifest intentional, and the `kind: skill`
  registry row (ADR-001 **C10**, with `name-registry-integrity.js` learning the kind in the
  same change) are a **separate epic, authored once the hub is named.** C11 fixes its
  staging: the hub *fronts* `convoke-install` / `update` / `doctor` before absorbing them.
- **`IN-235`** — the air-gapped / internal-registry gap. Narrowed by neither S4 nor S2
  (ADR-001 C9), and an intake rather than a story.

## Constraints on every story

- **`C8` still binds.** There is no self-serve retraction from skills.sh. **Nothing new is
  published until the discovery surface is declared and checkable.**
- **No new ADR, registry or CI check** without a fresh ratification: all three meta-model
  baseline deliverables shipped and ADR-001 (meta-model) records *"Three deliverables, no
  epic, budget held."*
- **Derive, never transcribe.** Every figure above carries its command in the findings note.
  The superseded PRD failed this rule and fourteen of its figures were wrong.
