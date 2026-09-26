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
— accepted 2026-09-26, **S4 now, S2 the destination**.

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
| `cir-1-1` | 2 — references do not resolve where the skill lands | Every cross-directory reference in a shipped skill states its resolution base. **22** bare paths in `_bmad/bme/_vortex/agents/*/references/`, plus `_bmad/core/tasks/workflow.xml` and `_bmad/core/workflows/party-mode/workflow.md`, neither of which ships in `files[]`. This is `T214`'s class extended past config references to capability references; `T214` itself is closed, and **`T138` carries the standing warning that applies here** — *"check 4 has already been rewritten twice… restructure the check's purpose, do not patch it a third time."* |
| `cir-1-2` | 3 — four dead upstream dependencies | `bmad-init` (removed), `bmad-create-prd` (→ `bmad-prd`), `bmad-create-epics-and-stories` + `bmad-sprint-planning` (→ `bmad-preview-ticketing`). **`bmad-help` is an investigation, not a fix:** it is absent from upstream's `skills/` tree *and* absent from its `removals.txt`, so its fate is unestablished. Resolve that before designing the change — five field findings ride on it. |
| `cir-1-3` | 1 — a skill that arrives alone fails without saying so | A Convoke skill whose runtime is absent detects it during activation, names the missing component, and states the command that obtains it. **Shape is constrained, not free:** `preflight-soft-warn` (`project-context.md:419`) requires *"stderr WARNING + exit 0 pass-through; never `process.exit(non-zero)`"*, and Operator Rights **OC-R1** and **OC-R5** make a bare refusal a FAIL — `skip`/`abort` are exits, not fallback values. **OC-R3** additionally wants a sentence of rationale naming a consequence, which a component name and a command do not supply. Upstream's `skills/bmad-prd/SKILL.md` step 1 is the reference implementation. |

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
- **Defect 4 — Gyre unreachable by any skills channel.** *Resolved by the ruling's design,
  not by remediation.* Under S4 the hub materialises the runtime in the operator's project,
  and Gyre's `SKILL.md` wrappers are already generated at install
  (`install-gyre-agents.js`, `GYRE_AGENTS` in `scripts/update/lib/agent-registry.js`). Gyre
  needs no marketplace entry of its own. Any wording that says Gyre's agents "exist nowhere
  in the tree" is false and misprices the work.
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
