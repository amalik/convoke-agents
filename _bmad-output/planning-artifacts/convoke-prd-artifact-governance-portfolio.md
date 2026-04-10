---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - _bmad-output/planning-artifacts/initiatives-backlog.md
  - docs/lifecycle-expansion-vision.md
  - _bmad-output/planning-artifacts/adr-repo-organization-conventions-2026-03-22.md
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  projectDocs: 3
classification:
  projectType: 'Governance & Knowledge Management Infrastructure'
  domain: 'Agentic Workflow Governance'
  complexity: 'Medium-High'
  projectContext: 'brownfield'
  annotations:
    - 'Complexity concentrated in P15 (portfolio inference), not uniformly distributed'
    - 'Frontmatter schema is a cross-cutting contract — requires architect + tech writer co-design'
---

# Product Requirements Document - Artifact Governance & Portfolio

**Author:** Amalik
**Date:** 2026-04-05

## Executive Summary

As Convoke scales beyond single-initiative usage, operators lose coherence. Artifacts accumulate across `_bmad-output/` with inconsistent naming, no initiative tagging, and no cross-initiative visibility. An operator managing Vortex, Gyre, Forge, Helm, and Loom simultaneously cannot determine — at a glance — what belongs to what, where each initiative stands, or what to pick up next. The cognitive cost of context-switching between workstreams grows linearly with initiative count.

This PRD specifies two tightly coupled capabilities that address this gap:

1. **Artifact Governance (I14)** — A naming convention (`{initiative}-{artifact-type}[-{qualifier}]-{date}.md`), frontmatter metadata schema, controlled initiative taxonomy (8 IDs: vortex, gyre, bmm, forge, helm, enhance, loom, convoke), and artifact type taxonomy (~20 types). Includes a CLI migration script (`convoke-migrate-artifacts`) that retroactively applies the convention to ~60 existing artifacts across MVP-scoped directories (`planning-artifacts/`, `vortex-artifacts/`, `gyre-artifacts/`) with dry-run manifest, frontmatter injection, and git rename mapping. Implementation artifacts (~100 files) deferred to Growth. **Supersedes and extends** the existing repo organization ADR (`adr-repo-organization-conventions-2026-03-22.md`), which defined `{category}-{descriptor}[-{context}][-{date}].md` — I14 elevates initiative as the primary sort dimension and adds frontmatter metadata as a machine-readable layer.

2. **Portfolio Skill (P15)** — A BMM skill that scans planning artifacts across all initiatives and produces a portfolio view: initiative name, phase, health signal, next action, and context re-entry hint (last artifact touched, last open question). Includes a WIP radar that flags overload. Derives state from existing artifacts — zero manual tracking files. Operates in degraded mode on unstructured artifacts (filename inference, git recency) and at full capability on governed artifacts (frontmatter metadata). Inference sources: epic files (story completion %), sprint plans (current sprint state), backlog files (queued work depth), git history (activity recency), and frontmatter metadata (initiative, status).

These capabilities fill a gap already diagnosed in the Lifecycle Expansion Vision (Section 8: "Flow and WIP governance — not yet embedded") and represent the first concrete implementation of the governance cross-cutting axis from Convoke's three-axis architecture.

**Target users:** Solo operators, consultants managing multiple engagements, and team leads coordinating across Convoke modules. The primary persona is the platform operator managing 2+ concurrent initiatives.

**Design principle — graduation path:** If the portfolio skill's inference capabilities hit limits, the gaps become validated input for a Vortex discovery cycle on a full governance perimeter — ensuring investment follows evidence, not speculation.

## What Makes This Special

Zero-maintenance visibility. The portfolio skill does not require manual status updates — it infers state from the artifacts the platform already produces. The naming convention and frontmatter schema are not documentation bureaucracy; they are the machine-readable contract that enables automated portfolio intelligence. Convention is the automation layer.

The frontmatter schema is a cross-cutting contract that every future Convoke workflow must honor. Its design requires architect and tech writer co-design to balance structural rigor with practical adoptability.

The initiative taxonomy (8 IDs) is a **controlled vocabulary decision** — it commits the platform to a specific naming structure. The taxonomy must be extensible (new initiatives can be added) without breaking existing artifacts or the portfolio skill's parsing logic.

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Project Type** | Governance & Knowledge Management Infrastructure |
| **Domain** | Agentic Workflow Governance |
| **Complexity** | Medium-High (concentrated in P15 portfolio inference; I14 is lower complexity but high consequence — the schema propagates platform-wide) |
| **Project Context** | Brownfield — extending existing Convoke platform |
| **Vision Traceability** | Lifecycle Expansion Vision, Section 8 — Flow & WIP governance + Value stream visibility |
| **Backlog Items** | I14 (Artifact Governance, RICE 3.2), P15 (Portfolio Skill, RICE 1.7) |
| **Dependency** | I14 must complete before P15 |

## Success Criteria

### User Success

- **Context re-entry in under 30 seconds:** An operator switching to any initiative can identify its current state, last artifact touched, and next action within 30 seconds of viewing the portfolio output
- **Initiative identification at a glance:** Opening any `_bmad-output/` directory, the operator can tell which initiative owns every file by reading filenames alone — initiative prefix as primary sort dimension
- **Emotional shift:** From "overwhelmed, where do I start" to "coherent, I see the full picture across all workstreams"
- **Zero manual upkeep:** The operator never creates or updates a tracking file — the portfolio skill derives everything from existing artifacts

### Business Success

- **Convention adoption rate:** 100% of artifacts produced by Convoke workflows after I14 ships follow the naming convention and include frontmatter metadata
- **Migration completeness:** 100% of existing artifacts renamed and frontmatter-injected — no manual cleanup remainder
- **Drift prevention:** No naming convention violations detected in artifacts created in the 3 months following I14 deployment
- **Force multiplier signal:** At least 2 subsequent initiatives (e.g., Helm discovery, Forge Gate 1) are managed using the portfolio skill within 1 month of P15 deployment

### Technical Success

- **Migration safety:** All renames executed via git mv — full history preserved with `git log --follow`. Rename mapping file included in migration commit
- **Portfolio inference accuracy:** Skill correctly identifies initiative phase (discovery, planning, build, blocked, complete) AND status (ongoing, blocked, paused) for all active initiatives
- **Frontmatter schema adoption:** At least 2 artifact-producing workflows updated to emit frontmatter on creation within the first sprint after I14
- **Degraded mode functional:** Portfolio skill produces usable (if lower-fidelity) output on pre-migration artifacts without frontmatter

### Measurable Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| Context re-entry time | < 30 seconds | Operator self-report on first 5 uses |
| Migration coverage | 100% | Count of renamed files vs total eligible files |
| Portfolio phase accuracy | Correct for all active initiatives | Manual verification against known initiative states |
| Convention drift | 0 violations in 3 months | Periodic scan of new artifacts |
| Workflow adoption | 2+ workflows emit frontmatter | Code inspection |

## User Journeys

### Journey 1: Amalik the Solo Operator — "Where Was I?"

**Opening Scene:** It's Monday morning. Amalik has been running Convoke for months. Five initiatives are in flight — Vortex (stable), Gyre (built), Forge (waiting on Gate 1), Helm (mid-discovery), and Loom (first agent built, improvements pending). He opens `_bmad-output/planning-artifacts/` and sees 40+ files. `prd.md` — which initiative? `architecture.md` — the platform one or Gyre's? He spent 10 minutes last Thursday on Helm discovery and now can't remember where he left off. He opens three files before finding the right one. The cognitive tax compounds — by the time he's re-loaded Helm context, he's lost the energy to do the actual work.

**Rising Action:** Amalik runs the migration skill. A dry-run manifest appears — 163 files, each showing `old-name → new-name`. He reviews it, spots two files the skill couldn't classify (ambiguous `prd.md` and `architecture.md`), manually assigns them to `convoke-prd.md` and `convoke-arch.md`. He confirms. Git mv executes. Every file now starts with its initiative: `helm-problem-definition-hc2-2026-04-05.md`. He opens the folder — alphabetical sorting groups everything by initiative. Helm files are together. Forge files are together. He adds a new initiative ID — a single line in `_bmad/_config/taxonomy.yaml` under the `user` section — and starts creating artifacts immediately.

**Climax:** Two days later, he's been deep in Forge planning. He needs to switch to Helm. He runs the portfolio skill. In under 10 seconds, he sees:

```
helm    | Discovery | Ongoing (inferred) | Last: empathy-map (Apr 5) | Next: HC4 experiment design
forge   | Planning  | Blocked (explicit)  | Last: epic-phase-a (Mar 21) | Blocked: Gate 1 shadow engagement
gyre    | Complete  | Complete (explicit)  | Last: validation-report (Mar 23)
vortex  | Stable    | —                   | No recent activity
loom    | Build     | Ongoing (inferred)  | Last: team-factory agent (Apr 2) | Next: improvements from backlog
```

Thirty seconds. He knows exactly where Helm is, what he did last, and what's next. No folder diving. No re-reading. He picks up HC4 experiment design and starts working. The WIP radar flags: "5 active initiatives (threshold: 4)" and lists them by last-activity date. He decides Vortex (stable, no recent activity) can be deprioritized.

**Resolution:** Over the next month, Amalik stops dreading context switches. The portfolio view becomes his Monday morning ritual — scan, pick the highest-gravity initiative, dive in. The naming convention means he never opens the wrong file. The frontmatter means the portfolio skill gets smarter over time. He adds a 9th initiative and it slots in naturally — one line in the taxonomy config.

---

### Journey 2: Clara the Consulting Practitioner — "Which Client, Which Phase?"

**Opening Scene:** Clara is a mid-level consultant using Convoke across three client engagements. Each engagement has its own Vortex discovery cycle and Gyre readiness assessment. She context-switches between clients daily — sometimes hourly. Her `_bmad-output/` is a disaster: `persona-engineering-lead-2026-03-21.md` — is that Client A's or Client B's? She's accidentally presented Client A's empathy map in a Client B workshop. She maintains a personal spreadsheet to track which files belong to which engagement. It's always out of date.

**Rising Action:** After the I14 migration, every artifact carries its initiative in the filename and frontmatter. Clara discovers the taxonomy is extensible with a flat prefix convention: she adds `clienta-vortex`, `clientb-vortex`, `clientc-gyre` as initiative IDs in the `user` section of her taxonomy config. The naming convention adapts without breaking — no hierarchy needed, just prefix matching.

**Climax:** Clara runs the portfolio skill before her Thursday client sync. She filters by `clientb-*` and sees:

```
clientb-vortex | Discovery | Ongoing (inferred) | Last: hypothesis-hc3 (Apr 3) | Next: experiment design
clientb-gyre   | Not started | —                 | No artifacts yet
```

She knows exactly what to present and what's coming next. No spreadsheet. No wrong-client file panic. The flat taxonomy with glob filtering gives her the multi-client view without requiring structured hierarchy.

**Resolution:** Clara's efficiency improves visibly. Her engagement lead notices she's always prepared, always knows where things stand. She recommends Convoke to two other consultants on her team. The naming convention and portfolio skill become her competitive advantage — she manages more engagements with less overhead than colleagues using manual tracking.

---

### Journey 3: Dario the Platform Builder — "Is Helm Ready to Build?"

**Opening Scene:** Dario is building Convoke's next team module — Helm (Strategy). He needs to know: has discovery produced enough artifacts to start architecture? Are there open questions from the Vortex cycle? He opens `_bmad-output/vortex-artifacts/` and sees Helm files mixed with Forge files, Gyre files, and Strategy files. Some use `strategy-perimeter` in the name, some use `helm`. He's not sure if the scope decision and hypothesis contract are complete or still drafts.

**Rising Action:** Post-migration, every Helm artifact is prefixed `helm-` and carries frontmatter with an optional `status` field. The Vortex workflow that produced the scope decision set `status: validated` explicitly. The hypothesis contract, created before the migration, has no status field — the portfolio skill infers `validated` from the presence of a downstream HC4 experiment artifact. The portfolio output clearly marks which statuses are explicit and which are inferred.

**Climax:** He runs the portfolio skill:

```
helm | Discovery | Ongoing (inferred) | Last: hypothesis-hc3 (Apr 5) | Next: HC4 experiment — status: draft (inferred)
```

One glance: Helm isn't ready for architecture yet. The experiment needs to complete first. The `(inferred)` marker tells him this status comes from artifact chain analysis, not an explicit declaration — he trusts it because the chain logic is straightforward. He doesn't waste a sprint starting premature architecture work. He switches to Loom improvements instead — the portfolio shows those are unblocked.

**Resolution:** When Helm's experiment completes and the portfolio shows `helm | Discovery | Complete (explicit)`, Dario knows it's time. He pulls up all `helm-*` artifacts, reviews the validated chain (scope → problem → hypothesis → experiment → signal → decision), and starts architecture with full confidence that discovery is done.

---

### Journey Requirements Summary

| Capability | Revealed by Journey | Requirement |
|-----------|-------------------|-------------|
| Initiative-first filename sorting | All three | Naming convention with initiative as primary sort dimension |
| Frontmatter status field (optional) | Dario (draft/validated/superseded/active) | Closed enum, workflows set when they can, portfolio infers when absent |
| Two-tier status: explicit + inferred | Dario, Amalik | Portfolio output marks `(explicit)` vs `(inferred)` for transparency |
| Portfolio view with phase + status | All three | Core portfolio skill output |
| Context re-entry hint (last artifact + next action) | Amalik, Dario | Inference from git recency + artifact chain |
| WIP radar: flag + list | Amalik (5+ initiatives) | Flag overload, list initiatives by last-activity date. Operator decides response |
| Taxonomy as config file | Amalik (registration), Clara (client prefixes) | `_bmad/_config/taxonomy.yaml` with platform defaults + user extensions |
| Flat taxonomy with prefix matching | Clara (client filtering) | Portfolio skill supports prefix glob filtering, no hierarchy needed |
| Degraded mode | Clara (pre-migration on new engagements) | Filename inference when frontmatter absent |
| Dry-run manifest with human review | Amalik (ambiguous files) | Migration skill must surface unknowns for manual resolution |
| Artifact chain awareness | Dario (HC sequence completeness) | Portfolio infers discovery completeness from contract chain |

## Domain-Specific Requirements

### BMAD Method Compatibility

- Taxonomy file (`_bmad/_config/taxonomy.yaml`) must conform to BMAD config directory conventions
- Must not break existing BMAD installers (`convoke-install`), updaters (`convoke-update`), or validators (`convoke-doctor`)
- `_bmad/` directory paths are NOT renamed — only `_bmad-output/` artifacts are in scope
- `convoke-doctor` must validate taxonomy file structure and content

### Cross-Module Contract

- Frontmatter schema adoption must be incremental — modules adopt at their own pace
- Portfolio skill must produce consistent output regardless of which modules have adopted frontmatter
- No module should be *required* to emit frontmatter for its existing workflows to continue functioning
- **MVP adoption roadmap:** `bmad-create-prd` and `bmad-create-epics-and-stories` updated to emit frontmatter at creation time
- **Growth adoption:** `bmad-create-architecture`, `bmad-create-ux-design`, Vortex agent workflows
- Without a concrete adoption roadmap, "incremental" becomes "never" — the PRD commits to the MVP list above

### Git History Preservation

- All renames must use `git mv` to preserve rename detection
- **Hard requirement: two-commit migration strategy.** Commit 1 = renames only (git mv, no content changes — 100% similarity). Commit 2 = frontmatter injection (content changes to already-renamed files). This guarantees git sees pure renames and preserves full history via `git log --follow`
- The two commits must execute as an **atomic sequence** in the migration skill — no user pause between them
- Migration must verify `git log --follow` works for a sample of renamed files before completing

### Backward Compatibility

- `convoke-update` must not break on projects with pre-I14 artifacts (no frontmatter, old naming)
- `convoke-update` must include a migration that creates `taxonomy.yaml` with platform defaults for existing installations
- Portfolio skill's degraded mode is a backward compatibility requirement, not a convenience feature
- **P15 prerequisite check:** skill checks for `_bmad/_config/taxonomy.yaml` existence. If absent → clear error message. If present but no governed artifacts found → warning that degraded mode is active, suggest running migration
- Existing ADR archive structure (`_bmad-output/_archive/`) must be respected — migration does not touch archived files
- **Internal link updating:** migration must scan and update markdown links (`[text](filename.md)` patterns and frontmatter `inputDocuments` arrays) in `.md` files within `_bmad-output/`. Bounded to markdown files in `_bmad-output/` only — not code comments, not files outside the output directory. Dry-run manifest shows both renames AND link updates for operator review.

### Taxonomy Evolution

- `convoke-update` must merge new platform taxonomy entries without overwriting user extensions — same pattern as `config-merger.js` (seed defaults, preserve user additions)
- **Promotion logic:** if a user ID becomes a platform ID in a new release, auto-migrate from user to platform section
- **Taxonomy validation:** lowercase alphanumeric with optional dashes, no spaces, no special characters. Validated by `convoke-doctor`
- New initiative IDs shipped in Convoke releases appear automatically after update

## Governance Infrastructure Specific Requirements

### Project-Type Overview

This is internal governance infrastructure for the Convoke agentic platform — a CLI migration script and a BMM portfolio skill, backed by a taxonomy config and frontmatter schema. The migration script is a batch Node.js operation invoked via CLI. The portfolio skill is conversational, invoked via Claude Code chat or CLI. Output is multi-format: markdown for documents, terminal-formatted text for CLI.

### Invocation Model

| Capability | Type | Invocation | Notes |
|-----------|------|------------|-------|
| Migration | Node.js script (`scripts/migrate-artifacts.js`) | CLI: `convoke-migrate-artifacts [--dry-run \| --apply]` | Batch operation. CLI-only — not conversational. Follows existing `scripts/update/` patterns. |
| Portfolio | BMAD skill (`.claude/skills/`) | Chat: `/bmad-portfolio-status` CLI: `convoke-portfolio [--markdown \| --terminal]` | Interactive, on-demand. Both chat and CLI. |

- Migration is idempotent: safe to re-run. A file is "already governed" if (a) filename matches the `{initiative}-{artifact-type}` pattern AND (b) has valid frontmatter with `initiative` field. Both conditions required — a file that is renamed but lacks frontmatter ("half-governed") triggers frontmatter injection only.
- Portfolio is stateless: reads current state on every invocation, produces fresh output
- Migration script must include `--help` usage output documenting dry-run, apply, and behavior

### Output Formats

**Portfolio skill output modes (MVP):**

| Mode | Format | Use Case |
|------|--------|----------|
| `--markdown` | Markdown table | Embedding in documents, skill output in chat |
| `--terminal` | Colored terminal text with alignment | CLI daily use |

Default: `--terminal` when invoked from CLI, `--markdown` when invoked from chat. YAML structured output deferred to Growth (no consumer exists today).

**Migration script output:**
- Dry-run: markdown table (old → new mapping + link updates)
- Execution: terminal progress with summary
- Mapping file: `artifact-rename-map.md` committed with migration

### Configuration Schema

**Taxonomy config:** `_bmad/_config/taxonomy.yaml` — taxonomy only, no behavior settings

```yaml
initiatives:
  platform:
    - vortex
    - gyre
    - bmm
    - forge
    - helm
    - enhance
    - loom
    - convoke
  user: []

artifact_types:
  - prd
  - epic
  - arch
  - adr
  - persona
  - lean-persona
  - empathy-map
  - problem-def
  - hypothesis
  - experiment
  - signal
  - decision
  - scope
  - pre-reg
  - sprint
  - brief
  - vision
  - report
  - research
  - story
  - spec
```

**Portfolio behavior config:** added to `_bmad/bmm/config.yaml`

```yaml
portfolio:
  wip_threshold: 4
  stale_days: 30
```

- `initiatives.platform` — read-only, updated by Convoke releases
- `initiatives.user` — append-only, operator adds custom IDs
- `portfolio.wip_threshold` — configurable WIP limit before radar flags
- `portfolio.stale_days` — days without git activity before `stale` status
- **Future note:** if portfolio becomes a core capability (not BMM-specific), config location needs revisiting

### Integration Surface

- **MVP: standalone.** Portfolio skill reads artifacts directly. Migration script operates independently.
- **Update pipeline integration:** `convoke-update` includes a migration that creates `taxonomy.yaml` for pre-I14 installations. Migration script is invocable from update pipeline as an optional post-update step.
- **Future integration:** other skills can read `taxonomy.yaml` for initiative validation at artifact creation time

### Implementation Considerations

- Migration script lives in `scripts/migrate-artifacts.js` with CLI entry point in `bin/convoke-migrate-artifacts`. Same pattern as existing `scripts/update/` infrastructure.
- Portfolio skill lives in `.claude/skills/bmad-portfolio-status/` with optional CLI wrapper in `bin/convoke-portfolio`
- Migration script needs filesystem access (read/write `_bmad-output/`), git access (`git mv`, `git log`), and YAML parsing
- Portfolio skill needs filesystem access (read-only scan of `_bmad-output/`), git access (read-only `git log` for recency), and YAML parsing
- Both must handle the case where `_bmad-output/` directories don't exist (fresh installation)

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Convention-as-Automation** — The naming convention and frontmatter schema are not governance overhead — they are the machine-readable data layer that enables automated portfolio intelligence. This inverts the traditional relationship between standards and tooling: instead of "tooling enforces standards," here "standards enable tooling." The convention is the automation layer.

2. **Zero-Maintenance Portfolio Inference** — Portfolio status derived entirely from existing artifacts without requiring manual status updates. No tracking spreadsheet, no status field to maintain, no ceremony. The system observes what you produce and infers where you are. Novel in the agentic AI tooling space where most project management requires explicit status tracking.

3. **Two-Tier Status Model** — Explicit status (set by workflows at creation) coexists with inferred status (derived from artifact chain analysis at read time). Solves the cold-start and adoption gap problem: the portfolio skill works immediately on legacy artifacts via inference, and improves as workflows adopt frontmatter emission. Degraded mode isn't a fallback — it's the adoption bridge.

4. **Governance Health Score** — Every portfolio output includes an adoption nudge: `Governance: 23/163 artifacts governed (14%) — run migration for full accuracy`. Not a gate, not nagging — a factual transparency signal that creates natural pull toward migration. Disappears at 100%. Doubles as a trackable success metric.

### Status Enum Clarification

Two distinct status vocabularies serve two different purposes:

**Artifact-level status** (frontmatter field, optional, closed enum):
- `draft` — work in progress, not yet reviewed
- `validated` — reviewed and confirmed
- `superseded` — replaced by a newer artifact
- `active` — living document, currently maintained

**Initiative-level status** (portfolio output, derived by portfolio skill):
- `ongoing` — active work, recent artifacts or git activity
- `blocked` — explicit blocker identified (from frontmatter or artifact content)
- `paused` — operator has deprioritized (explicit)
- `complete` — all expected artifacts present and validated
- `stale` — technically ongoing but no git activity in 30+ days (inferred)
- `unknown` — insufficient signal to determine status

### Unknown Status Triggers

The portfolio skill produces `unknown` under specific, testable conditions:

1. **No artifacts match the initiative ID** — initiative exists in taxonomy but has zero files → phase: `unknown`, status: `unknown`
2. **Artifacts exist but no phase-determining artifacts** — no epic, no sprint plan, no discovery chain → phase: `unknown`, status inferred from git recency only
3. **Conflicting signals** — epic says "in-progress" but no git activity in 30+ days → phase: from epic, status: `stale (inferred)`

### Validation Approach

- **H1 (Convention-as-Automation):** Validate by measuring whether the portfolio skill produces accurate output *without* any manual status updates. Success: phase and status correct for all active initiatives using only artifact metadata and git history.
- **H2 (Zero-Maintenance):** Validate by tracking operator behavior — do they stop maintaining external tracking (spreadsheets, notes) within 2 weeks of P15 deployment?
- **H3 (Two-Tier Status):** Validate by comparing accuracy of inferred-only status vs explicit+inferred status. If inference accuracy is >80% on legacy artifacts, the two-tier model is justified.
- **H4 (Inference Failure):** When inference confidence is too low, the skill shows `unknown (inferred)` rather than guessing. Validate: zero false-confident inferences in first month of use.

### Risk Mitigation

- **Risk: Inference is wrong.** Mitigation: explicit `(inferred)` vs `(explicit)` markers in portfolio output. Operator always knows the confidence level.
- **Risk: Convention not adopted.** Mitigation: concrete MVP adoption roadmap (2 workflows) + convoke-doctor validation + governance health score in every portfolio output. Drift is detectable, not silent.
- **Risk: Schema locks in too early.** Mitigation: frontmatter `status` is optional. Schema can evolve by adding fields — existing artifacts remain valid.
- **Risk: Degraded mode "too good."** Mitigation: governance health score makes the quality gap visible. Every portfolio view shows governed vs total artifact count. The operator sees what they're missing, creating natural pull toward full adoption without enforcement.
- **Risk: Portfolio output at scale.** At 20+ initiative IDs, flat alphabetical view becomes unwieldy. Mitigation (Growth): grouped portfolio output by prefix (referencing Clara's persona). MVP acknowledges the limitation; filtered views (`clientb-*`) are the daily driver at scale.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving — deliver the minimum that eliminates the cross-initiative coherence pain for a solo operator managing 3+ concurrent initiatives.

**Resource Requirements:** Single developer. Migration script and portfolio skill are independent deliverables with a clear dependency chain (I14 → P15). No parallel team needed.

**Key scoping insight:** I14 (Artifact Governance) is a **standalone product**, not just a P15 prerequisite. The naming convention alone solves the "which initiative owns this file" problem. For solo operators with <10 initiatives, I14 with migration may be sufficient. P15's primary value emerges at scale (10+ initiatives, consultant with multiple clients).

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1 (Amalik) — full support: migration, portfolio view, WIP radar, context re-entry
- Journey 3 (Dario) — partial support: initiative grouping and phase visibility. Artifact chain awareness is MVP.
- Journey 2 (Clara) — enabled by taxonomy extensibility but not explicitly targeted. Clara's prefix filtering works out of the box.

**Must-Have Capabilities — I14 (Artifact Governance):**

| # | Capability | Must-Have Rationale |
|---|-----------|-------------------|
| 1 | Naming convention specification | The contract — without it, nothing else works |
| 2 | `taxonomy.yaml` with platform defaults + user extensions | Data source for both migration and portfolio |
| 3 | Frontmatter metadata schema (initiative, artifact_type, status, created, schema_version) | Machine-readable layer enabling portfolio inference. `schema_version: 1` enables future evolution. |
| 4 | Migration script with dry-run manifest | Migration of ~60 existing artifacts (planning, vortex, gyre directories) |
| 5 | Migration scope via CLI flags | `--include` with MVP defaults. Growth adds implementation-artifacts. |
| 6 | Two-commit migration (rename → frontmatter injection) | Git history preservation — hard requirement |
| 7 | Internal markdown link updating | Prevents broken cross-references post-migration |
| 8 | `artifact-rename-map.md` | Rosetta Stone for old → new filename tracing |
| 9 | ADR supersession | Existing ADR updated to SUPERSEDED, new ADR produced |
| 10 | `convoke-doctor` taxonomy validation | Catches invalid IDs, malformed config |
| 11 | `convoke-update` migration for pre-I14 installs | Creates taxonomy.yaml with platform defaults |

**Must-Have Capabilities — P15 (Portfolio Skill):**

| # | Capability | Must-Have Rationale |
|---|-----------|-------------------|
| 12 | Artifact registry (scan + parse + index) | Foundation for all portfolio output |
| 13 | Portfolio view (initiative, phase, status, next action, context hint) | Core deliverable — the "30-second coherence" promise |
| 14 | Explicit vs inferred status markers | Trust and transparency — operator knows what's reliable |
| 15 | WIP radar (flag + list) | Overload detection for solo operators |
| 16 | Degraded mode (filename inference without frontmatter) | Backward compatibility + adoption bridge |
| 17 | Governance health score | Adoption nudge — governed/total count in every output |
| 18 | P15 prerequisite check (taxonomy.yaml existence) | Prevents cryptic errors on pre-I14 projects |
| 19 | Two output formats (markdown + terminal) | Chat and CLI coverage |

**MVP workflow adoption:** `bmad-create-prd` and `bmad-create-epics-and-stories` updated to emit frontmatter at creation time.

**MVP migration scope:** `planning-artifacts/`, `vortex-artifacts/`, `gyre-artifacts/` (~60 files). `implementation-artifacts/` excluded — high effort, low portfolio value, ephemeral story files rarely cross-referenced.

### Post-MVP Features

**Phase 2 (Growth):**
- `implementation-artifacts/` migration (add via `--include implementation-artifacts` CLI flag)
- Workflow enforcement: `bmad-create-architecture`, `bmad-create-ux-design`, Vortex agent workflows emit frontmatter
- YAML structured output format for machine consumption
- Grouped portfolio output by prefix (Clara's consultant persona)
- Portfolio inference confidence scoring
- Cross-initiative dependency view
- Archive integration with existing ADR archive system
- `--upgrade-schema` flag for frontmatter schema evolution

**Phase 3 (Vision):**
- Full governance perimeter via Vortex discovery (if portfolio skill hits limits)
- Value stream mapping across perimeter activations
- Multi-project support with project/client prefix taxonomy
- Kaizen signals — portfolio emits improvement suggestions
- Automated convention enforcement via pre-write validation hooks

### Effort Distribution

**Migration script is 50-55% of total engineering effort** (revised down from 60-70% after excluding implementation-artifacts). The two high-complexity items — initiative inference and link updating — should become dedicated stories.

### Risk Mitigation Strategy

**Technical Risks:**
- *Most challenging:* Initiative inference from filenames. Reduced to ~3 predictable patterns after excluding implementation-artifacts. Mitigation: dry-run manifest with human review.
- *Riskiest assumption:* Portfolio inference accuracy sufficient without explicit status fields. Mitigation: two-tier model + `(inferred)` markers + governance health score. Testable before deployment.

**Market Risks:**
- *Biggest risk:* Naming convention so effective it cannibalizes portfolio skill value for small-scale operators. Mitigation: this is a success signal, not a failure. I14 alone may suffice for <10 initiatives. P15 value emerges at scale.

**Resource Risks:**
- *Minimum viable:* Single developer, sequential delivery (I14 then P15).
- *Absolute minimum:* I14 with migration script (no P15). Convention + migration solves 80% of the coherence pain. Portfolio deferred until scale demands it.
- *If constrained further:* I14 without migration — just convention spec + taxonomy config + frontmatter schema. Apply convention forward-only. Still solves "which initiative owns this file" for new artifacts.

## Functional Requirements

### Taxonomy & Schema Management

- FR1: Operator can define initiative IDs in a taxonomy config file (`_bmad/_config/taxonomy.yaml`) with platform defaults and user extensions
- FR2: Operator can define artifact type IDs in the taxonomy config file
- FR3: System validates taxonomy entries (lowercase alphanumeric with optional dashes, no duplicates, no collisions between platform and user sections)
- FR4: System provides a frontmatter metadata schema with fields: initiative, artifact_type, status (optional, closed enum: draft/validated/superseded/active), created, schema_version
- FR5: Operator can add new initiative IDs by appending a single entry to the user section of the taxonomy config
- FR6: System ships platform taxonomy defaults that include all current Convoke initiative IDs (vortex, gyre, bmm, forge, helm, enhance, loom, convoke)

### Migration

- FR7: Operator can run a dry-run migration that shows a manifest of all proposed renames and link updates without modifying any files
- FR8: Operator can execute the migration to rename all in-scope artifacts to follow the naming convention `{initiative}-{artifact-type}[-{qualifier}]-{date}.md`
- FR9: Migration infers initiative from existing filename patterns, folder location, and file content
- FR10: Migration infers artifact type from existing filename patterns
- FR11: Migration surfaces ambiguous files (where initiative or type cannot be confidently inferred) for manual resolution by the operator
- FR12: Migration renames files using `git mv` to preserve version history
- FR13: Migration preserves full git history for all renamed files, verifiable via `git log --follow`
- FR14: Migration injects frontmatter metadata into all renamed files, preserving any existing frontmatter
- FR15: Migration scans and updates internal markdown links (`[text](filename.md)` patterns and frontmatter `inputDocuments` arrays) in `.md` files within `_bmad-output/` directories only. Files outside `_bmad-output/` and non-markdown files are never modified.
- FR16: Migration generates an `artifact-rename-map.md` mapping old filenames to new filenames
- FR17: Migration verifies `git log --follow` works for a sample of renamed files
- FR18: Migration is idempotent — detects already-governed files (filename match AND valid frontmatter) and skips them. Half-governed files (renamed but lacking frontmatter) trigger frontmatter injection only.
- FR19: Operator can specify migration scope via CLI flags (`--include`) with MVP defaults (planning-artifacts, vortex-artifacts, gyre-artifacts)
- FR20: Migration provides `--help` usage output documenting all flags and behavior
- FR21: Migration produces a new ADR superseding the existing repo organization ADR

### Portfolio View

- FR22: Operator can generate a portfolio view showing all initiatives with: initiative name, phase, status, next action, and context re-entry hint (last artifact touched)
- FR23: Portfolio view marks each status as `(explicit)` or `(inferred)` for transparency
- FR24: Portfolio view displays a governance health score showing governed artifact count vs total artifact count
- FR25: Operator can filter the portfolio view by initiative prefix (glob pattern, e.g., `clientb-*`)
- FR26: Portfolio view supports two output formats: markdown (for chat) and terminal-formatted text (for CLI)
- FR27: Portfolio view defaults to terminal format when invoked from CLI and markdown when invoked from chat

### Portfolio Inference

- FR28: Portfolio skill infers initiative phase (discovery, planning, build, blocked, complete) from artifact presence, type, and chain analysis
- FR29: Portfolio skill infers initiative status using a two-tier model: explicit status from frontmatter when present, inferred status from git history and activity signals when absent
- FR30: Portfolio skill uses initiative-level status vocabulary: ongoing, blocked, paused, complete, stale, unknown
- FR31: Portfolio skill marks initiative as `stale` when no git activity detected within configurable threshold (default 30 days)
- FR32: Portfolio skill produces `unknown` status under specific conditions: no artifacts match initiative ID, or artifacts exist but no phase-determining artifacts found
- FR33: Portfolio skill infers context re-entry hint from most recently modified artifact (git log) and artifact chain next-step analysis
- FR34: Portfolio skill infers discovery completeness from Vortex handoff contract chain (HC2 → HC3 → HC4 → HC5 → HC6)

### WIP Management

- FR35: Portfolio skill flags WIP overload when active initiative count exceeds configurable threshold (default 4)
- FR36: WIP radar lists all active initiatives sorted by last-activity date when threshold is exceeded
- FR37: Operator can configure WIP threshold and stale-days settings in BMM config

### Backward Compatibility & Integration

- FR38: Portfolio skill operates in degraded mode on artifacts without frontmatter, using filename pattern inference and git recency
- FR39: Portfolio skill checks for taxonomy config prerequisite and displays clear error if absent, or warning if no governed artifacts found
- FR40: `convoke-update` creates taxonomy config with platform defaults for pre-I14 installations
- FR41: `convoke-update` merges new platform taxonomy entries without overwriting user extensions
- FR42: `convoke-update` promotes user initiative IDs to platform section when they become official platform IDs
- FR43: `convoke-doctor` validates taxonomy config structure, entry format, and detects duplicates/collisions

### Workflow Adoption (MVP)

- FR44: `bmad-create-prd` workflow emits frontmatter metadata (initiative, artifact_type, status, created, schema_version) when creating new PRD artifacts
- FR45: `bmad-create-epics-and-stories` workflow emits frontmatter metadata when creating new epic artifacts

### Migration Safety & Recovery

- FR46: Migration supports idempotent recovery from partial failure — each commit phase (rename, frontmatter injection) is independently resumable. Re-running after a partial failure resumes from the incomplete phase without re-executing completed phases.
- FR47: Migration follows a single interactive flow: dry-run manifest → operator review → confirmation prompt → apply. `--force` flag bypasses the confirmation prompt for automation. Operator cannot `--apply` without seeing the manifest first (unless `--force`).
- FR48: Portfolio view sorts initiatives alphabetically by initiative ID by default. Operator can override with `--sort last-activity`.
- FR49: Migration creates `taxonomy.yaml` with platform defaults if not present before executing. Idempotent — does not overwrite existing taxonomy (whether created by `convoke-update` or manually).
- FR50: Migration explicitly excludes `_bmad-output/_archive/` directory — archived files are never renamed or modified.

## Non-Functional Requirements

### Performance

- NFR1: Portfolio skill completes full scan and output generation in under 5 seconds for repositories with up to 200 artifacts
- NFR2: Migration dry-run manifest generation completes in under 10 seconds for repositories with up to 200 artifacts
- NFR3: Migration execution (rename + frontmatter injection) completes in under 60 seconds for up to 100 files, excluding git commit time

### Reliability

- NFR4: Migration must not corrupt file content — any file that cannot be safely processed is skipped with a warning, never partially modified
- NFR5: If any commit phase fails, all changes from that incomplete phase are rolled back via `git reset --hard` to the last successful commit, discarding all uncommitted changes from the failed phase. The repository is left in a clean, recoverable state.
- NFR6: Portfolio inference must never produce false-confident results — when confidence is low, status is marked `unknown (inferred)`, not guessed
- NFR7: Migration dry-run must be 100% accurate — every change shown in the manifest must match what apply executes. No surprises.

### Maintainability

- NFR8: Frontmatter schema supports forward-compatible evolution via `schema_version` field — adding new optional fields must not require re-migration of existing artifacts
- NFR9: Taxonomy is extensible without code changes — adding a new initiative ID or artifact type requires only a config file edit
- NFR10: Portfolio inference logic is modular — adding a new phase-detection heuristic (e.g., for a new team module) does not require modifying existing heuristics
- NFR11: Migration inference rules are documented and testable — each filename pattern → initiative mapping is an explicit, unit-testable rule

### Compatibility

- NFR12: Migration script and portfolio skill must work with Node.js versions supported by the existing Convoke platform (≥18.x)
- NFR13: All operations must work on macOS, Linux, and Windows (same platforms as existing Convoke CLI tools). Path handling must use `path.join()`, never hardcoded separators.
- NFR14: Migration must not break existing `convoke-update`, `convoke-doctor`, or `convoke-install` functionality
- NFR15: Portfolio skill must coexist with all existing BMAD skills without conflicts
- NFR16: Taxonomy config must be parseable by standard YAML libraries (no custom syntax, no YAML extensions)

### Testing

- NFR17: Migration script must have ≥80% overall test coverage, with **100% coverage on all inference rules** (initiative inference patterns, artifact type inference, link detection patterns)
- NFR18: Portfolio skill must have ≥80% overall test coverage, with **100% coverage on all inference heuristics** (phase inference, status inference, chain analysis, stale detection)
- NFR19: Both tools must include test fixtures representing all known filename patterns in the current repository

### Data Integrity

- NFR20: Frontmatter injection preserves all existing file content below the frontmatter block byte-for-byte. Existing frontmatter fields are preserved — migration adds new fields, never overwrites existing fields. Field conflicts (e.g., existing `initiative` with different value) are surfaced in the dry-run manifest for manual resolution.
- NFR21: Taxonomy changes take effect immediately on next portfolio skill invocation — no restart or cache invalidation required

### Error Handling

- NFR22: Both migration script and portfolio skill must handle malformed `taxonomy.yaml` gracefully — display a clear, actionable error message identifying the syntax or structural issue. No stack traces, no crashes.
