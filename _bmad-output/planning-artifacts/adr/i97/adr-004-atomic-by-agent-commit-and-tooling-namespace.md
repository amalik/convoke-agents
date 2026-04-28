---
initiative: convoke
artifact_type: adr
qualifier: i97-atomic-by-agent-commit-and-tooling-namespace
created: '2026-04-28'
status: accepted
schema_version: 1
related_initiative: I97
related_decision: D5
supersedes: none
---

# ADR-004: Atomic-by-Agent Commit Pattern + Migration Tooling Namespace

**Status:** Accepted (2026-04-28)
**Initiative:** I97 (BMAD v6.3+ source format adoption)
**Related Decision:** D5 from architecture document
**Related Requirements:** FR12; NFR17; NFR18; NFR12

## Context

I97 migrates 7 Vortex agents over multiple PRs. Two architectural questions surface:

**Question 1: Commit boundary granularity.** Should a PR convert one agent (with all dependents — tests, manifests, slash-command wrapper, audit citations) atomically? Or should multiple agents be combined per PR? Or should agent format-conversion be split from dependents (manifests, tests) into separate PRs?

**Question 2: Migration tooling namespace.** Where does the migration tooling code live? `scripts/migration/i97/` (initiative-scoped)? `scripts/migration/format-conversion/` (function-scoped)? `scripts/migration/` (flat)?

**Constraints:**

- NFR12 (atomic audit-report-update) — audit reports referencing pre-migration paths must be updated atomically with each agent conversion
- NFR17 (atomic-by-agent commit) — every PR converts exactly one Vortex agent's complete dependency graph
- NFR18 (migration tooling reusability) — tooling for I98 (Gyre) and I99 (Team Factory) inherits the architecture without re-authoring core logic
- FR12 (workflow source preserved) — agent conversions don't modify workflow source

## Decision

### Commit Pattern

**One PR per agent with all dependents in the same PR.** A PR for `i97-{first-name}-conversion` MUST include all of:

- Agent's converted `SKILL.md`
- Agent's `references/{workflow-name}.md` files (capability prompts, Pattern-C-friendly per NFR16)
- Manifest updates (`module.yaml` `agents:` array entry; `module-help.csv` row for this agent)
- Slash-command wrapper update (`.claude/skills/bmad-agent-bme-{role}/SKILL.md` per ADR-001 alias layer)
- Test updates (parity test additions, fixture data per agent)
- Audit report citation refreshes (per NFR12 — atomic methodology artifact update for this agent's references)

No partial-state PRs. Branch naming: `i97-{first-name}-conversion` (e.g., `i97-emma-conversion`, `i97-isla-conversion`).

### Migration Tooling Namespace

**Function-named namespace: `scripts/migration/format-conversion/`.**

Migration tooling for I97 lives at `scripts/migration/format-conversion/` rather than `scripts/migration/i97/`. The directory structure:

```
scripts/migration/format-conversion/
├── README.md                      # How to invoke + per-agent fixup checklist guidance
├── fixup-checklist.md             # Reusable per-agent fixup contract (per ADR-002)
├── fixtures/                      # Shared fixture utilities (per ADR-003)
│   ├── tmpDir-setup.js
│   └── isolated-install.js
├── parity-harness.js              # Parity test runner (FR13-15)
├── covenant-survival-harness.js   # Covenant audit re-runner (FR17-20)
└── personality-harness.js         # Personality verification (FR21-23)
```

When I98 (Gyre marketplace structural compliance) or I99 (Team Factory marketplace structural compliance) fires, the same tooling parameterizes across modules without refactor.

### Branch Naming

`i97-{first-name}-conversion` — initiative-scoped branch names tag the work to I97 specifically. (Tooling location does NOT use I97 branding; only branches do.) When I98 fires, branches are `i98-{gyre-agent-name}-conversion`; tooling at `scripts/migration/format-conversion/` is shared.

## Consequences

**Positive:**

- **Atomic-by-agent commits enable bisect-friendly history.** Per-PR scope is bounded; if a regression surfaces post-merge, the PR-of-origin is unambiguous. Clean rollback unit.
- **Per-PR review is bounded.** Reviewer reads one agent's full dependency graph at a time; fits in code-review-convergence rule's R1 budget.
- **Function-named namespace transfers cleanly to I98/I99.** Gyre and Team Factory migrations inherit the harness infrastructure (parity, Covenant survival, personality) without re-authoring. NFR18 explicit.
- **Branch naming distinguishes initiative ownership from tooling reusability.** Branches are initiative-scoped (clear when reading git log); tooling is function-scoped (clear when reading directory structure).
- **Audit report atomic-update enforced** — NFR12 violations surface as broken reference checks within the same PR (per ADR-004's reference integrity requirement); reviewer cannot accidentally merge an agent conversion that leaves audit reports stale.

**Negative / Trade-offs:**

- **Larger PRs** than alternative B (per-agent format-only). Each PR carries SKILL.md + references/* + manifests + tests + slash-command wrapper + audit citations. Mitigation: scope is *bounded* (one agent's dependency graph); not unbounded.
- **Slower flow per agent** than parallel commits. Each agent must be fully verified before merge. Mitigation: per-agent verification is a feature, not a bug — catches regressions before they propagate.
- **Branch naming requires discipline.** Dev agents may default to `feature/emma` or `convert-emma`. Mitigation: per-agent PR checklist (architecture document) explicitly cites canonical branch naming as a merge gate.

**Function-named namespace consequence:** future operators may initially expect `scripts/migration/i97/` per the initiative ID. Mitigation: README at namespace root explicitly documents the convention ("function-named for reusability across migration initiatives").

## Alternatives Considered

**Commit pattern alternatives:**

**Alternative B: One PR per agent format-only, dependents in separate PRs**

- **Rejected because:** Partial-state commits land on `main`. An agent's SKILL.md could merge to v6.3+ format while its slash-command wrapper still references the old structure — operators would experience broken invocation paths between dependent-update PRs. Violates NFR17 explicitly.

**Alternative C: Branch-per-epic with multi-agent commits**

- **Rejected because:** Larger scope per PR; weaker bisect support if regression surfaces. Migration discipline (atomic-by-agent commits) is high-value for behavioral preservation guarantee (PRD Outcome 2); abandoning it for marginal flow gain is the wrong trade.

**Namespace alternatives:**

**Alternative 1: `scripts/migration/i97/` (initiative-named)**

- **Rejected because:** Locks tooling to I97 framing. When I98 (Gyre) fires, options are (a) copy-paste tooling to `scripts/migration/i98/`, (b) extract via refactor. Both are NFR18 violations or refactor cost. Function-named namespace pre-pays this cost cheaply.

**Alternative 3: `scripts/migration/` (flat)**

- **Rejected because:** Future migrations would create naming collisions (e.g., `scripts/migration/parity-harness.js` from I97 vs I98's parity harness). Flat hierarchy doesn't scale beyond one migration initiative.

## Cross-References

- Architecture document: `_bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md` Section "D5" + Section "Per-agent PR checklist"
- PRD: `_bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md` FR12, NFR12, NFR17, NFR18
- Project context rule: `code-review-convergence` (per-PR review budget)
- Sibling ADRs: ADR-001 (slash-command wrapper update is part of atomic per-agent PR); ADR-002 (fixup checklist artifact lives at namespace root); ADR-003 (verification harnesses live at namespace root)
