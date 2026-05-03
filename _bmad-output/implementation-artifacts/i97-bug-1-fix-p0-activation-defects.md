# Story i97-bug-1: Update P0 activation test contract to be format-aware (v5 XML + v6.3 markdown)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [i97-bug-epic-1 — I97 Conversion-Discovery Hotfixes](../planning-artifacts/convoke-epic-i97-bug-fixes.md) (cross-cutting platform debt; single-story epic following [`convoke-epic-lint-cleanup-dod-gate.md`](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) + [`convoke-epic-restore-coverage-green-ci.md`](../planning-artifacts/convoke-epic-restore-coverage-green-ci.md) precedent)
**Origin:** Discovered during cov-1.1 implementation 2026-05-03 (Task 4.4 HALT). The GitHub Actions `coverage` job has been red since 2026-05-01T23:15:46Z for two stacked reasons: (1) c8 functions threshold trip [closed by [cov-1.1](cov-1-1-close-functions-coverage-gap.md), shipped 2026-05-03] and (2) ~21 P0 activation test failures (18 test-level `✖` + 3 describe rollups; 6 failing assertions × 3 already-converted agents) across the I97-converted Vortex agents. This story closes (2). Operator authorized **option γ** (2026-05-03): cut `i97-bug-1` as a separate hotfix; preserve [I97 Epic 3 Story 3.1 (CI Infrastructure Spike)](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#story-31-ci-infrastructure-spike) at full scope; add a one-line cross-reference acknowledging P0-contract work absorbed early.
**Sprint:** Out-of-band hotfix; runs in parallel with active I97 Epic 2 Story 2.3 (Mila); does not enter sprint capacity planning.
**Namespace decision:** No new skills or `_bmad/bme/` content. Work touches [tests/p0/](../../tests/p0/) only (test-contract layer). The `namespace-decision-for-new-skills` rule is N/A by construction; the `covenant-compliance-for-convoke-skills` rule is N/A — no Convoke skill content touched. v6.3-converted agent files are NOT modified (preserves I97 Story 2.1 + 2.2 conversion integrity).
**Safety analysis (path-safety rule):** N/A — no scripts that accept user paths or perform destructive operations are added or modified.

## Story

As the platform maintainer (Amalik) and the I97 dev agent picking up the next Vortex conversion (currently Mila),
I want the P0 activation test contract at [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) + [tests/p0/helpers.js](../../tests/p0/helpers.js) to be format-aware (recognizing both v5 XML-in-markdown agents and v6.3 outcome-based markdown agents),
so that converted agents pass P0 without v5-XML pollution AND un-converted agents continue passing during the conversion runway, finally closing the GitHub Actions `coverage` job to green.

## Context & Motivation

**The contract mismatch:**

[tests/p0/helpers.js](../../tests/p0/helpers.js) `loadAgentDefinition` parses an agent SKILL.md by extracting:
- `<agent id="..." name="..." title="..." icon="...">` opening tag (regex `/<agent\s+([^>]+)>/`)
- `<role>...</role>`, `<identity>...</identity>`, `<communication_style>...</communication_style>` for persona
- `<item cmd="...">...</item>` for menu items
- `<step n="...">` for activation steps
- `Configuration Error` or `STOP` substring inside step 2's content for error-handling

Every assertion in [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) (lines 27–113 — 8 assertions per agent × N agents) presumes this v5 XML structure. **[I97 Story 2.1 (Emma POC)](../planning-artifacts/convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md) shipped Emma to v6.3 zero-XML outcome-based markdown 2026-05-02; [Story 2.2 Wade](i97-2-2-convert-wade-lean-experiments-specialist.md) followed; and Mila's SKILL.md was already migrated to v6.3 by the time [Story 2.3](i97-2-3-convert-mila-research-convergence-specialist.md) entered its capability-prompt + calibration-baseline phase.** All three converted files have NO XML at all — pure markdown frontmatter + headings + tables.

**Per-agent state at story-authoring (2026-05-03):**

| Agent | I97 story | File | Format | P0 status |
|---|---|---|---|---|
| Emma (Contextualization Expert) | 2.1 done 2026-05-02 | [contextualization-expert/SKILL.md](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md) | **v6.3 markdown** | FAIL (no XML to parse) |
| Wade (Lean Experiments Specialist) | 2.2 done 2026-05-02 | [lean-experiments-specialist/SKILL.md](../../_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md) | **v6.3 markdown** | FAIL |
| Mila (Research Convergence Specialist) | 2.3 in-progress (SKILL.md already migrated; in-flight on capability prompts + calibration baseline) | [research-convergence-specialist/SKILL.md](../../_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md) | **v6.3 markdown** | FAIL |
| Isla (Discovery & Empathy Expert) | 2.4 backlog | [discovery-empathy-expert/SKILL.md](../../_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md) | **v5 XML** | PASS (v5 contract holds) |
| Noah (Production Intelligence Specialist) | 2.5 backlog | [production-intelligence-specialist/SKILL.md](../../_bmad/bme/_vortex/agents/production-intelligence-specialist/SKILL.md) | **v5 XML** | PASS |
| Max (Learning Decision Expert) | 2.6 backlog | [learning-decision-expert/SKILL.md](../../_bmad/bme/_vortex/agents/learning-decision-expert/SKILL.md) | **v5 XML** | PASS |
| Liam (Hypothesis Engineer) | 2.7 backlog | [hypothesis-engineer/SKILL.md](../../_bmad/bme/_vortex/agents/hypothesis-engineer/SKILL.md) | **v5 XML** | PASS |

**Dual-format reality through I97 Epic 2 ship:** the test contract MUST cover both formats simultaneously (3 v6.3 agents + 4 v5 agents at story-authoring time, transitioning toward 7 v6.3 + 0 v5 as I97 Epic 2 completes). The fix lives in the test-contract layer; agent files are correct as-shipped per I97 ACs.

**v6.3 contract (from Emma's exemplar SKILL.md):**

| Concept | v5 XML form | v6.3 markdown form |
|---|---|---|
| Agent identity | `<agent id="..." name="..." title="..." icon="...">` opening tag | YAML frontmatter `name:`, `description:` + first-line `# {Display Name}` heading + emoji embedded in description or section header |
| Persona role | `<role>...</role>` | `## Identity` heading prose paragraph |
| Persona identity | `<identity>...</identity>` | (same `## Identity` paragraph; or merged with `## Communication Style`) |
| Communication style | `<communication_style>...</communication_style>` | `## Communication Style` heading prose |
| Principles | `<principles>...</principles>` | `## Principles` bullet list |
| Capabilities (≥5) | `<item cmd="..." workflow="..." [...]>...</item>` (inside `<menu>`) | `## Capabilities` markdown table with `\| Code \|` header column |
| Activation steps (≥7) | `<step n="N">...</step>` (inside `<activation>`) | `## On Activation` numbered markdown list (`1.`, `2.`, ...). Sub-bullets allowed. |
| Step-2 error handling | Substring `Configuration Error` or `STOP` inside `<step n="2">` body | Reference to `bmad-init` skill (which handles config error semantics via interactive walkthrough — explicit Operator Covenant OC-R3 compliance per Emma's "Note:" inside step 1) OR explicit "Configuration Error" / "STOP" prose |

**Why CI was red on cov-1.1's commit:** the `coverage` job runs `npm run test:coverage` which exercises [tests/p0/](../../tests/p0/) (per [package.json:47](../../package.json#L47)). `tests/p0/p0-activation.test.js` fails ~21 assertions (18 test-level + 3 describe rollups; verified locally 2026-05-03) even though c8 `check-coverage` passes (functions 90.12% per cov-1.1). Closing those assertions is the second cause; this story is the parallel hotfix promised in [cov-1.1's AC1 amendment](cov-1-1-close-functions-coverage-gap.md).

## Acceptance Criteria

**AC1 — `tests/p0/p0-activation.test.js` passes for all 7 registered agents in mixed-format cohort.**
**Given** the registry at [scripts/update/lib/agent-registry.js](../../scripts/update/lib/agent-registry.js) (the single source of truth for the agent list) and the per-agent state table above
**When** the story is implemented and `npm run test:coverage` is invoked
**Then** every per-agent test in `tests/p0/p0-activation.test.js` (the `describe(\`${agent.name} (${agent.id})\`, ...)` block at lines 19–113 plus the `P0 Activation: Full Validation` block at lines 116–128) exits with zero failing assertions for all 7 registered agents (3 v6.3 — Emma, Wade, Mila — and 4 v5 — Isla, Noah, Max, Liam — at story-authoring time; the count shifts as I97 Epic 2 conversions land but the format-aware test handles each agent against its current declared format).
**And** the test format-discriminator is mechanical and well-documented (e.g., a comment in [tests/p0/helpers.js](../../tests/p0/helpers.js) explaining "v5 detected by `<agent ...>` opening tag presence; v6.3 detected by absence + frontmatter+`## Identity` heading presence").
**And** when CI run on the post-fix commit completes, the `coverage` job exits 0 (finally closing the second cause from cov-1.1's AC1 amendment).

**AC2 — Zero v6.3 agent files modified.**
**Given** the v6.3-converted SKILL.md files (Emma, Wade, Mila at story-authoring time)
**When** the story is implemented
**Then** `git diff -- _bmad/bme/_vortex/agents/` exits with zero changes for the v6.3-converted files.
**And** specifically: NO v5-XML constructs (e.g., `<agent>`, `<step>`, `<item cmd>`, etc.) are added back to v6.3 files.
**Rationale:** I97 Story 2.1 and 2.2 shipped the v6.3 conversions per their ACs (including personality preservation rubric and parity harness validation). Re-introducing XML would invalidate that work and conflict with [BMAD marketplace v6.3+ source-format requirements](../planning-artifacts/spike-marketplace-packaging-delta.md).

**AC3 — Zero v5 agent files modified.**
**Given** the un-converted v5-XML SKILL.md files (Isla, Noah, Max, Liam at story-authoring time)
**When** the story is implemented
**Then** `git diff -- _bmad/bme/_vortex/agents/discovery-empathy-expert/ _bmad/bme/_vortex/agents/production-intelligence-specialist/ _bmad/bme/_vortex/agents/learning-decision-expert/ _bmad/bme/_vortex/agents/hypothesis-engineer/` exits with zero changes.
**Rationale:** v5 agents continue to ship with their existing format until their respective I97 Epic 2 conversion stories pick them up. Don't pre-emptively migrate or modify; let the format-aware test path handle them as v5.

**AC4 — Mila state pinned (not conditional).**
**Given** Mila's [research-convergence-specialist/SKILL.md](../../_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md) is already v6.3 at story-authoring time (verified 2026-05-03 via `grep -c "<agent " research-convergence-specialist/SKILL.md` returns 0 — see Context per-agent state table). The i97-2-3 story remains `in-progress` because it is in-flight on capability prompts + calibration baselines, NOT on the SKILL.md itself, which has already been migrated.
**When** the story is implemented
**Then** the format-aware test treats Mila uniformly with Emma and Wade as a v6.3 agent. AC1 verifies P0 passes for her under the v6.3 path.
**And** AC4 is satisfied at this story's ship regardless of i97-2-3's overall completion status — the two stories are decoupled at the SKILL.md layer.
**And** if at pickup time Mila's SKILL.md has been further modified (e.g., i97-2-3 shipped), the dev agent re-runs the Task 1.3 spot-check (`grep -c "<agent " ...`) to reconcile and notes any drift in Dev Notes.

**AC5 — Test-contract changes only; no production code touched.**
**Given** the production code surfaces ([scripts/](../../scripts/), [index.js](../../index.js), [_bmad/bme/_vortex/contracts/](../../_bmad/bme/_vortex/contracts/), [_bmad/bme/_vortex/agents/](../../_bmad/bme/_vortex/agents/))
**When** the story is implemented
**Then** `git diff` shows changes ONLY in [tests/p0/](../../tests/p0/) (e.g., `tests/p0/p0-activation.test.js`, `tests/p0/helpers.js`, possibly a new helper file like `tests/p0/v63-helpers.js`).
**And** zero changes to migration scripts, agent SKILL.md files, package.json, .c8rc.json, .github/workflows/ci.yml, or any `_bmad/` content.
**And** `npm test` (matrix-equivalent) and `npm run test:integration` continue to exit 0 — the test-contract update does NOT introduce new failures in the existing non-P0 suites.

**AC6 — Path decision rationale recorded in Dev Notes.**
**Given** three viable paths (see Dev Notes "Path Options"):
1. **Format-aware test (recommended)** — single test file with format detection per agent + branched assertions.
2. **Per-format test files** — split P0 into `p0-activation-v5.test.js` + `p0-activation-v63.test.js`; helpers.js routes by agent.
3. **Per-agent contract manifest** — each agent's `module.yaml` (or new sidecar) declares its format; P0 reads manifest, applies format-specific assertions.

**When** the story is implemented
**Then** the Dev Notes section MUST include a "Path Chosen" subsection stating: which path (1, 2, or 3); a 2-3 sentence rationale; the diff size impact; whether any new test files were created.

## Scope Exclusions

- **CI gate productionization beyond P0 activation** — parity-harness, covenant-survival-harness, reference-integrity gates are I97 Epic 3 territory (Stories 3.2 + 3.3). Don't bundle.
- **v6.3 agent file content audit / corrections** — each I97 Epic 2 conversion ships under its own ACs (parity harness + personality rubric); don't re-litigate.
- **Personality-preservation contract additions to P0** — already covered by [vortex-parity.test.js](../../tests/integration/vortex-parity.test.js) per I97 Story 2.1.
- **Pre-emptive v5→v6.3 migration of un-converted agents** — Isla/Noah/Max/Liam ship under their respective Epic 2 stories.
- **Modifying the agent-registry** — `scripts/update/lib/agent-registry.js` is production code; AC5 forbids touching it. The registry already lists all 7 agents uniformly; the test layer handles format heterogeneity.

## Tasks / Subtasks

- [ ] **Task 1 — Capture pre-fix baseline** (AC1, AC6; per `mechanical-research-enumeration` rule)
  - [ ] 1.1. Verify `node --version` reports 20.x to match the CI runner; if not, switch (e.g., `nvm use 20`). c8 + node:test timing variance can affect P0 results across Node versions.
  - [ ] 1.2. Run `node --test tests/p0/p0-activation.test.js 2>&1 | tee /tmp/i97-bug-1-baseline.txt` (P0 only; isolates from cov-1.1 c8 noise). **Expected baseline (verified 2026-05-03 at story-authoring time):** `grep -c "^✖" /tmp/i97-bug-1-baseline.txt` returns ~22 (18 test-level failures = 6 assertions × 3 v6.3 agents [Emma + Wade + Mila] + 3 describe-level rollups + 1 validation aggregate). Isla / Noah / Max / Liam pass. If the count drifts ≥3 from this baseline, halt and reconcile (likely additional conversion shipped or P0 contract changed since story authoring).
  - [ ] 1.3. Verify per-agent state table in Context section: re-grep each agent's SKILL.md for `<agent` tag presence (`grep -l "<agent " _bmad/bme/_vortex/agents/*/SKILL.md`) and reconcile with the table. If state has drifted (e.g., Mila now shipped), update the table accordingly in Dev Notes.

- [ ] **Task 2 — Choose path and execute** (AC1, AC6)
  - [ ] 2.1. Document path choice and rationale in Dev Notes ("Path Chosen" subsection — see AC6).
  - [ ] 2.2. **Path 1 branch (recommended):**
    - [ ] 2.2.1. Update [tests/p0/helpers.js](../../tests/p0/helpers.js) `loadAgentDefinition` to detect format (recommended discriminator: `content.match(/<agent\s+/)`). Branch parsing: v5 path retains existing logic; v6.3 path parses frontmatter + `## Identity` + `## Communication Style` + `## Capabilities` table + `## On Activation` numbered list.
    - [ ] 2.2.2. Update [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) assertions to be format-aware (or keep them stable and let helpers.js return a uniform shape that both formats populate equivalently — preferred for test-readability).
    - [ ] 2.2.3. v6.3 step-2 error-handling check: detect either explicit `Configuration Error` / `STOP` substring (rare in v6.3) OR a reference to `bmad-init` (which delegates config-error semantics to that skill, satisfying OC-R3 per Emma's exemplar). Document the convention in helpers.js.
    - [ ] 2.2.4. Run `node --test tests/p0/p0-activation.test.js` — all 7 agents pass.
  - [ ] 2.3. **Path 2 branch:** see Dev Notes for rationale and trade-offs if Path 1 is infeasible.
  - [ ] 2.4. **Path 3 branch:** see Dev Notes; over-engineering for current state.

- [ ] **Task 3 — Verify production-code-untouched invariant** (AC2, AC3, AC5)
  - [ ] 3.1. `git diff -- _bmad/bme/_vortex/agents/` → expect zero changes.
  - [ ] 3.2. `git diff -- scripts/ index.js _bmad/bme/_vortex/contracts/ .github/workflows/` → expect zero changes.
  - [ ] 3.3. `git diff -- package.json .c8rc.json` → expect zero changes.
  - [ ] 3.4. `git diff --stat tests/p0/` → expect changes; verify they're scoped to format-aware test work.

- [ ] **Task 4 — Local pre-commit verification** (AC1, AC5)
  - [ ] 4.1. `npm run lint` → exit 0 with zero new warnings in modified files (per `lint-passes-before-review` rule).
  - [ ] 4.2. `npm test` → exit 0 (matrix-equivalent locally on Node 20). Note: any pre-existing Node-version-related timing failures in `tests/lib/migrate-artifacts.test.js` continue to apply per [cov-1.1 AC6 amendment](cov-1-1-close-functions-coverage-gap.md).
  - [ ] 4.3. `npm run test:integration` → exit 0.
  - [ ] 4.4. `npm run test:coverage` → exit 0 — **this is the headline outcome.** Confirm:
    - c8 summary block free of `ERROR: Coverage for X does not meet global threshold` line (cov-1.1 already ensured this).
    - Zero failing assertions in `tests/p0/p0-activation.test.js`.
    - Overall job exit code 0.

- [x] **Task 5 — Cross-reference I97 Epic 3 Story 3.1** (epic FR6) *— Pre-done at story authoring 2026-05-03 by SM per operator option γ. The cross-reference note has been added at the top of [Story 3.1 in convoke-epic-bmad-v63-source-format-adoption.md](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#story-31-ci-infrastructure-spike). Dev agent should spot-verify it remains in place before commit; no action needed beyond that.*
  - [x] 5.1. Story 3.1 located in I97 epic file.
  - [x] 5.2. One-line note appended above Story 3.1's user-story block: "Note 2026-05-03 (operator option γ): the P0 activation contract sliver ... absorbed early via i97-bug-1. Story 3.1 retains its full parity / Covenant survival / reference-integrity gating scope."
  - [x] 5.3. Story 3.1 ACs unmodified; only a top-of-section note added.

- [ ] **Task 6 — Commit and push** (AC1) *(deferred to operator per CLAUDE.md "NEVER commit unless explicitly asked"; lint-1-1 + cov-1-1 precedent)*
  - [ ] 6.1. (operator action) Stage the minimal diff per File List below.
  - [ ] 6.2. (operator action) Commit message: `i97-bug-1: P0 activation test format-aware (v5 XML + v6.3 markdown)`.
  - [ ] 6.3. (operator action) Push to main.
  - [ ] 6.4. (operator action) Watch the GitHub Actions run; confirm `coverage` job exits 0.

- [ ] **Task 7 — Final verification** (AC1, AC5; 7.1 deferred to operator; 7.2 + 7.3 done by dev)
  - [ ] 7.1. (operator action) Confirm GitHub Actions run for the commit shows ALL jobs green (lint + test 18/20/22 + python-test + coverage + security + package-check + burn-in if PR-triggered). **`coverage` going green is THE headline.**
  - [ ] 7.2. Update File List section with every modified file.
  - [ ] 7.3. Update sprint-status.yaml: `i97-bug-1-fix-p0-activation-defects: ready-for-dev → review` (then `done` after code review).

## Dev Notes

### Path Options (decision tree per AC6)

**Path 1 — Format-aware single-file test (recommended).** Update `tests/p0/helpers.js` `loadAgentDefinition` to detect format via mechanical discriminator (e.g., `content.match(/<agent\s+/)`) and route to format-specific parser. Return a uniform `def` shape so `p0-activation.test.js` assertions remain unchanged. Pros: minimal diff (~one helpers.js function expansion + maybe one new private parser function); test-readability preserved (assertions describe contracts, not formats); future v6.3 agent ships extend the v6.3 parser path uniformly. Cons: helpers.js grows; format-specific quirks (e.g., step-2 error-handling discriminator) need careful design to avoid false-positive PASS on incomplete v6.3 agents.

**Path 2 — Per-format test files.** Split into `p0-activation-v5.test.js` + `p0-activation-v6.test.js`; each iterates only its format cohort. Pros: clean separation; assertions can specialize; obvious which test fires for which agent. Cons: doubles the test-runner invocation surface; agent-registry changes (e.g., a new agent) need maintenance in two places; package.json `test:coverage` script needs to include both files; complicates `tests/p0/` directory navigation. Adopt only if Path 1's helpers.js complexity becomes unmanageable.

**Path 3 — Per-agent contract manifest.** Each agent's `module.yaml` (or a new sidecar at `_bmad/bme/_vortex/agents/<id>/p0-contract.yaml`) declares which format the agent uses; P0 reads the manifest and applies format-specific assertions. Pros: most flexible; supports future format variants. Cons: over-engineering for current state (only 2 formats expected through I97 Epic 2 ship); requires coordination with I97 Epic 2 conversion stories to populate the manifest; couples test layer to data files. Don't pick unless format proliferation becomes real.

### v6.3 contract details (verified uniform across all 3 converted agents 2026-05-03)

Spot-checks against [contextualization-expert/SKILL.md](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md) (Emma), [lean-experiments-specialist/SKILL.md](../../_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md) (Wade), and [research-convergence-specialist/SKILL.md](../../_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md) (Mila) confirm the v6.3 conversion convention is **uniform** across all three agents. The format-aware test can rely on these patterns:

- **Frontmatter:** `name: bmad-bme-agent-{first-name}` (BMB-canonical form — verified Emma/Wade/Mila), plus `description:` field. **Important asymmetry:** the v6.3 frontmatter `name` is NOT the registry-name — registry has `'Emma'`, `'Wade'`, `'Mila'`; frontmatter has `bmad-bme-agent-emma` etc. Don't compare these directly. The display name appears as the first H1 heading after frontmatter (`# Emma`, `# Wade`, `# Mila`).
- **Display name:** first H1 heading after frontmatter (`# {first-name}`).
- **Identity:** `## Identity` heading, prose paragraph.
- **Communication Style:** `## Communication Style` heading, prose paragraph.
- **Principles:** `## Principles` heading, bullet list.
- **Capabilities:** `## Capabilities` heading, markdown table with header `| Code | Description | Skill |` (3 columns — verified uniform across Emma/Wade/Mila). Each non-separator row is one capability. Count rows under the header — must be ≥5 for AC1.
- **Activation:** `## On Activation` heading, numbered markdown list `1.`, `2.`, `3.`, etc. Each top-level numeric item is one step. Sub-bullets allowed under each step. Count top-level numerics — must be ≥7 for AC1.
- **Step-2 error handling (canonical v6.3 convention — verified Emma + Wade + Mila):** all three v6.3 agents have an identical step-1 / step-2 pattern:
  - Step 1 invokes `bmad-init` (which handles `Configuration Error` / `STOP` semantics with OC-R3 walkthrough — explicit "if Vortex config is missing, `bmad-init` runs an interactive walkthrough" Note inside step 1).
  - Step 2 reads `**Continue with steps below:**` (load project context, greet, present capabilities). The substring `Configuration Error` / `STOP` does **NOT** appear in step 2 of any v6.3 agent.
  - **The format-aware test treats v6.3 step-2 error-handling as satisfied iff step 1 references `bmad-init`** (the canonical OC-R3-compliant delegation). This is THE v6.3 convention — not a candidate, an established pattern across the 3 converted agents.

### Why minimum-diff matters

Per the cov-1.1 + lint-1-1 precedents, hotfix stories ship with the smallest possible diff that satisfies the AC. For this story, that's likely:
- One helpers.js function expansion (or extraction into a small `parseV63AgentDef` helper).
- Zero or one new test file.
- The Story 3.1 cross-reference note (one line in the I97 epic file).

Avoid scope-creep into related-but-different concerns (parity harness, covenant survival, reference integrity, agent-registry refactors). Those are I97 Epic 3 / future stories.

### Testing standards summary

- **Test framework:** [`node:test`](https://nodejs.org/api/test.html) per the C1 phantom-test retro 2026-04-08 → 2026-04-11 (zero Jest globals; uses `node:assert/strict`).
- **P0 isolation:** P0 tests run only via `npm run test:coverage` and `npm run test:p0` (if the latter exists; check [package.json:42-47](../../package.json#L42)). They do NOT run under `npm test` (matrix jobs).
- **Fixture isolation:** N/A for this story — no filesystem fixture creation; helpers.js reads agent files in-place.
- **Format discrimination semantics:** the discriminator must be **content-based, not path-based**. A future agent under `_bmad/bme/_vortex/agents/<new-agent>/SKILL.md` could be either format; only the file content tells you which.

### Project Structure Notes

- No new directories created.
- Possibly one new helper file under [tests/p0/](../../tests/p0/) (e.g., `tests/p0/v63-helpers.js`) if Path 1 grows beyond clean modification of existing `helpers.js`. **c8 safety:** [.c8rc.json](../../.c8rc.json) `exclude` list contains `"tests/**"`, so any new file under `tests/p0/` is automatically excluded from the c8 coverage gate (verified 2026-05-03 — wouldn't trip the threshold).
- Zero modifications to [_bmad/](../../_bmad/), [scripts/](../../scripts/), [index.js](../../index.js), [package.json](../../package.json), [.c8rc.json](../../.c8rc.json), or [.github/workflows/](../../.github/workflows/).

### References

- [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) — the test contract to update
- [tests/p0/helpers.js](../../tests/p0/helpers.js) — the parser to make format-aware
- [scripts/update/lib/agent-registry.js](../../scripts/update/lib/agent-registry.js) — registry of all 7 agents (DO NOT MODIFY per AC5)
- [_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md) — v6.3 exemplar (Emma)
- [_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md](../../_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md) — v6.3 exemplar (Wade)
- [_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md](../../_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md) — v5 exemplar (Isla)
- [convoke-epic-i97-bug-fixes.md](../planning-artifacts/convoke-epic-i97-bug-fixes.md) — this story's epic
- [convoke-epic-bmad-v63-source-format-adoption.md](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md) §Story 3.1 — long-term home for CI gate work (cross-reference target per Task 5)
- [convoke-epic-restore-coverage-green-ci.md](../planning-artifacts/convoke-epic-restore-coverage-green-ci.md) — sibling cov-1.1 epic; the c8-gate half of the dual-cause CI red
- [cov-1-1-close-functions-coverage-gap.md](cov-1-1-close-functions-coverage-gap.md) — sibling story; closed the c8 gate; this story closes the second cause
- [convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md](../planning-artifacts/convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md) — I97 Story 2.1 Emma POC conversion report (origin of v6.3 format)
- [project-context.md](../../project-context.md) — §Rule: code-review-convergence (do not reopen Story 2.1 / 2.2), §Rule: derive-counts-from-source (≥5 capabilities, ≥7 activation steps as mechanical thresholds), §Rule: spec-verify-referenced-files (verified 2026-05-03), §Rule: lint-passes-before-review (Task 4.1)
- [`node:test` documentation](https://nodejs.org/api/test.html) — test framework
- [c8 documentation](https://github.com/bcoe/c8#readme) — coverage runner

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

(To be filled at implementation time per Task 1.2 and Task 7.1.)

### Completion Notes List

(To be filled at completion.)

### Path Chosen

(Required per AC6. To be filled when path is selected.)

### Review Findings

(To be filled after `bmad-code-review`.)

### File List

(To be filled at completion.)

## Change Log

- **2026-05-03 (story authored).** Story authored by Bob (SM) via `bmad-create-story` workflow. Origin: cov-1.1 Task 4.4 HALT discovered ~21 P0 activation test failures (18 test-level `✖` + 3 describe rollups; 6 failing assertions × 3 already-converted agents) pre-dating cov-1.1 (verified in CI run #25277123569 log lines 5028–5210+). Operator authorized **option γ** 2026-05-03 (cut as separate hotfix; preserve I97 Epic 3 Story 3.1 at full scope; add cross-reference). The defect lives in the test contract (P0 assumes v5 XML; converted agents are v6.3 markdown), not in agent artifacts — story scope reflects this discovery.
