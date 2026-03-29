# Convoke Initiatives Backlog

**Created:** 2026-03-08
**Method:** RICE (Reach, Impact, Confidence, Effort)
**Last Updated:** 2026-03-25

---

## RICE Scoring Guide

| Factor | Scale | Description |
|--------|-------|-------------|
| **Reach** | 1-10 | How many users/quarter will this affect? (10 = all users, 1 = edge case) |
| **Impact** | 0.25 - 3 | Per-user impact (3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal) |
| **Confidence** | 20-100% | How sure are we about reach and impact estimates? |
| **Effort** | 1-10 | Relative effort in story points (1 = trivial, 10 = multi-epic) |
| **Score** | calculated | (Reach x Impact x Confidence) / Effort |

---

## Backlog

### Documentation & Onboarding

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| D2 | **Add output examples for more agents** — Isla (empathy map), Wade (experiment card), or Noah (signal report) in README | Vortex review (Liam, Wade) | 6 | 1 | 70% | 2 | 2.1 | Move the needle | Backlog |
| D6 | **Reduce narrative overlap in journey example** — Trim ~950-1,100 words of overlap between narrative paragraphs and transition notes in the 7-agent journey | Scope-adjacent backlog (P2 E4) | 4 | 0.5 | 80% | 1 | 1.6 | Keep the lights on | Backlog |
| D3 | **BMAD Core return arrow in diagram** — Show feedback loop from production back to Convoke in the README diagram | Vortex review (Noah) | 4 | 0.25 | 90% | 1 | 0.9 | Keep the lights on | Backlog |

### Update & Migration System

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| U7 | **Changelog surface during update** — `convoke-update` shows only migration names and breaking change flags. CHANGELOG.md exists but is never read by the CLI. Add structured `changelogSection` metadata to migration registry entries (added/changed/fixed arrays). Parse CHANGELOG.md on demand and display version-specific feature highlights before the user confirmation prompt. Users see value ("Gyre team added — 4 new agents") not just mechanics ("3 migrations to apply"). Reduces update anxiety and improves trust for big releases. | Winston adoption review, 2026-03-25 | 8 | 2 | 80% | 3 | 4.3 | Move the needle | Backlog |
| U8 | **Respect user agent exclusions on update** — `config-merger.js` (line 57-65) explicitly restores any canonical agent the user deleted on every upgrade. No opt-out mechanism exists. Add `excluded_agents: []` field to config.yaml schema. Update `mergeConfig()` to filter excluded agents after canonical restoration. Update validator, refresh-installation (skip skill wrappers for excluded agents), and convoke-doctor (report exclusions). Users get permanent agent customization that survives updates. | Winston adoption review, 2026-03-25 | 6 | 2 | 80% | 3 | 3.2 | Move the needle | Backlog |
| U9 | **Module-aware refresh and validation** — `refreshInstallation()` copies Vortex unconditionally, and copies Gyre/Enhance based on package directory existence (not project installation state). If package ships Gyre but user never installed it, files get copied anyway. Validator checks all Vortex agents unconditionally; Gyre has no dedicated validation. Create `_bmad/_config/modules-manifest.yaml` as explicit module registry (installed modules + version + enabled flag). Make refresh and validation conditional on manifest. Update installers to register modules. Add backward-compat migration to auto-generate manifest from filesystem state. | Winston adoption review, 2026-03-25 | 8 | 2 | 70% | 6 | 1.9 | Move the needle | Backlog |
| U4 | **Test upgrade-path step file cleanup** — Integration test simulating real upgrade with renamed step files. Note: v6.2.0 renamed entire directories (`code-review/` → `bmad-code-review/`), not just step files — scope is broader than originally described. | Murat review (M2) | 3 | 1 | 90% | 2 | 1.4 | Keep the lights on | Backlog |
| U2 | **Validate migration modules at load time** — Fail fast if a migration module lacks `apply()` instead of crashing at execution | Murat review | 2 | 0.5 | 80% | 1 | 0.8 | Keep the lights on | Backlog |
| U3 | **Robust version detection fallback** — Improve `guessVersionFromFileStructure()` with more markers (agent files, config presence) | Winston review (W3) | 3 | 0.5 | 60% | 2 | 0.5 | Keep the lights on | Backlog |

### Testing & CI

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| T3 | **End-to-end update test on real project** — Scripted test: install v1.7.0, update to v2.0.0, verify all files | User testing feedback, adjusted (Murat) | 5 | 2 | 80% | 3 | 2.7 | Keep the lights on | Backlog |
| T4 | **Migration idempotency CLI test** — Test that running `convoke-migrate` twice doesn't break state | Murat review | 3 | 1 | 80% | 1 | 2.4 | Keep the lights on | Backlog |
| T1 | **`convoke-update.js` coverage to 80%+** — Currently at 29%, CLI orchestration paths untested | Test debt | 3 | 1 | 80% | 3 | 0.8 | Keep the lights on | Backlog |
| T2 | **`convoke-version.js` coverage to 80%+** — Currently at 56%, CLI branch paths untested | Test debt | 2 | 0.5 | 80% | 2 | 0.4 | Keep the lights on | Backlog |
| T5 | **Expand docs audit — remaining gaps** — Stale counts, broken links, naming leaks, and incomplete tables already implemented. Remaining: tense consistency checks and prose quality patterns | Scope-adjacent backlog (P2 E1) | 2 | 0.5 | 60% | 2 | 0.3 | Keep the lights on | Backlog |
| T6 | **Add Python test execution to CI pipeline** — 46 Python files with local tests (pytest/unittest) across BMB and Core modules have zero CI coverage. Add `python-test` job to ci.yml with setup-python, pip install pyyaml, and pytest. Add to publish.needs gate. Tests already exist and pass locally. Resolves Gyre finding DL-001 (blocker) and COMPOUND-001. | Gyre delta analysis DL-001 (blocker), 2026-03-25 | 8 | 2 | 90% | 1 | 14.4 | Keep the lights on | Backlog |
| T7 | **Add Python linting to CI pipeline** — No ruff/flake8/pylint configured for 46 Python files. JS has ESLint in CI, Python has nothing. Add ruff to the Python CI job (piggyback on T6). May require one-time cleanup pass on existing files. Resolves Gyre finding DL-002. | Gyre delta analysis DL-002, 2026-03-25 | 6 | 1 | 80% | 2 | 2.4 | Keep the lights on | Backlog |
| T8 | **Standardize Python PEP 723 dependency declarations** — Scripts use PEP 723 inline metadata (good), but version pinning is inconsistent: some say `pyyaml`, others `pyyaml>=6.0`. Standardize to consistent pinning. CI Python job should install declared deps. Resolves Gyre finding DL-003. | Gyre delta analysis DL-003, 2026-03-25 | 4 | 0.5 | 80% | 1 | 1.6 | Keep the lights on | Backlog |

### Infrastructure

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| I2 | **`gh auth` for CI release creation** — Automate GitHub release notes on tag push. Confirmed blocker: `gh auth login` not configured locally (hit during v2.4.0 release, manual workaround used). | CI/CD | 6 | 1 | 80% | 2 | 2.4 | Keep the lights on | Backlog |
| I1 | **NPM_TOKEN secret for CI publish** — Enable automated `npm publish` on tag push via GitHub Actions | CI/CD, adjusted (Victor) | 8 | 2 | 90% | 8 | 1.8 | Keep the lights on | Backlog |
| S1 | **Interactive installer with project-type questions** — Ask user questions during install to customize initial config (e.g., B2B/B2C, team size). Note: must account for Skills installation alongside Teams (v2.4.0). v6.2.0 skill packages add discovery via `bmad-skill-manifest.yaml` — installer question flow should include skill activation. | Multi-agent review (Sally) | 5 | 2 | 50% | 5 | 1.0 | Move the needle | Backlog |
| S2 | **Simplified entry point** — Single "Start Discovery" command that activates Emma with a guided first-run experience. Note: Enhance skill activation UX (keyword in chat) provides a reference pattern for low-friction entry points. | Multi-agent review (Sally) | 7 | 1 | 40% | 4 | 0.7 | Move the needle | Backlog |
| S3 | **One-command standalone install (`npx convoke-agents init`)** — Replace the current two-step flow (`npm install -g` + `convoke-install`) with a single `npx convoke-agents init` that handles everything: project detection, module selection (Vortex/Gyre/both), config prompts, file copy, skill generation, and validation. No global install required — lowest possible barrier for a single CTA. Internally reuses the existing 5-stage pipeline. Also merge `convoke-install-vortex` + `convoke-install-gyre` into a unified `convoke-install` with flags (`--vortex-only`, `--gyre-only`) for users who prefer global install. Subsumes S1 interactive questions into the `init` flow. See `docs/standalone-decoupling-strategy.md` for full architectural context (standalone install + BMAD decoupling phases). | Winston architecture session, 2026-03-29 | 9 | 2 | 80% | 4 | 3.6 | Move the needle | Backlog |
| I7 | **Team Factory CSV quoting hardening** — `formatCsvRow` in `csv-creator.js` only quotes 2 of 13 columns. All columns should be quoted if they can contain commas or special characters. Same pattern exists in BMB/BMM CSVs. Applies to all CSV-producing modules. | Code review (tf-2-7) | 4 | 0.5 | 90% | 1 | 1.8 | Keep the lights on | Backlog |
| I8 | **Team Factory write verification — value correctness** — Simple safety protocol checks key presence but not value correctness after write. `config-creator.js` verifies `submodule_name`, `agents`, `workflows` keys exist but not their values. `csv-creator.js` verifies header only. Full value verification would need round-trip comparison against in-memory object. | Code review (tf-2-7) | 3 | 0.5 | 80% | 2 | 0.6 | Keep the lights on | Backlog |
| I9 | **Registry writer idempotency drift detection** — `registry-writer.js` Task 2.10 specifies "if existing block differs, return error" but implementation only checks prefix presence, not content match. A drift case (prefix exists, content changed) silently returns `skipped` instead of an error. Amend spec to either add content-hash comparison or clarify presence-only check is sufficient. | Code review (tf-2-8) | 3 | 0.5 | 90% | 1 | 1.4 | Keep the lights on | Backlog |
| I10 | **Config appender YAML comment preservation** — `appendConfigAgent` and `appendConfigWorkflow` in `config-appender.js` use `yaml.load` + `yaml.dump` round-trip which strips all YAML comments and custom formatting. First append permanently destroys comments. Investigate comment-preserving YAML libraries or text-level append instead of full re-serialization. | Code review (tf-3-2) | 4 | 0.5 | 90% | 2 | 0.9 | Keep the lights on | Backlog |
| I11 | **Registry Fragment Architecture (D-Q6)** — Investigate whether agent-registry.js can be replaced with per-module fragment files that are merged at load time, eliminating the shared-file bottleneck and Full Write Safety Protocol overhead. Open since Team Factory Epic 1. No impact observed across 3 epics — current approach is stable but adds complexity to every extension operation. | Team Factory retro (tf-epic-1, carried through tf-epic-3) | 3 | 1 | 60% | 4 | 0.5 | Keep the lights on | Backlog |
| I12 | **Validator.js hardcoded to Vortex paths** — `scripts/update/lib/validator.js` has Vortex-specific paths and checks hardcoded. End-to-end validator works around this, but long-term the validator should be module-agnostic and driven by config.yaml discovery. | Team Factory retro (tf-epic-2, carried through tf-epic-3) | 3 | 0.5 | 80% | 3 | 0.4 | Keep the lights on | Backlog |
| I13 | **Team Factory Express Mode** — Allow factory to accept a pre-filled spec file as input and skip the conversational decision cascade, generating output directly. Deferred from Story 2.5 (Decision Summary & Spec File Persistence). Guided mode is sufficient for current usage volume. | Team Factory retro (tf-epic-2, carried through tf-epic-3) | 2 | 1 | 70% | 3 | 0.5 | Keep the lights on | Backlog |
| I3 | **CSV parser library for manifest** — Replace regex-based CSV parsing in `refresh-installation.js` with proper parser | Murat review | 2 | 0.25 | 70% | 1 | 0.4 | Keep the lights on | Backlog |
| I6 | **Add `--verbose` flag to all CLI commands** — Currently only `convoke-update` supports `--verbose`. Missing from: `convoke-install`, `convoke-doctor`, `convoke-migrate`, `convoke-version`. Pattern already exists in refresh-installation.js. Improves troubleshooting when users hit install or diagnostic issues. | Gyre full analysis OBS-001, 2026-03-24 | 4 | 0.5 | 80% | 2 | 0.8 | Keep the lights on | Backlog |
| I5 | **Workflow output naming enforcement** — Update artifact-producing workflows (PRD, architecture, epics, UX, readiness, Vortex, quick-spec, sprint) to follow `{category}-{descriptor}[-{context}][-{date}].md` convention at creation time. Incremental: apply when a workflow is touched for any reason. Archive script (`npm run archive --rename`) catches drift in the meantime. ADR Phase C. | ADR `adr-repo-organization-conventions-2026-03-22.md` | 8 | 0.5 | 90% | 3 | 1.2 | Keep the lights on | Backlog |

### Agent Quality & Consistency

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| A1 | **Add validate menu items to Wave 3 agents** — Mila, Liam, Noah currently lack validate items that Emma/Isla/Wade/Max have | BMB review (W1) | 4 | 0.5 | 80% | 2 | 0.8 | Keep the lights on | Backlog |
| A3 | **Add `agentic` and `team-of-teams` npm keywords** — Discoverability improvement deferred since Phase 3 Epic 1 | Phase 3 tech debt | 3 | 0.25 | 100% | 1 | 0.8 | Keep the lights on | Backlog |
| A4 | **Fix temp dir prefix inconsistency** — Internal `bmad-` vs `convoke-` prefix in temporary directories | Phase 3 tech debt | 1 | 0.25 | 100% | 1 | 0.3 | Keep the lights on | Backlog |
| A2 | **Create `.agent.yaml` source files for Vortex agents** — Enable standard BMAD authoring pipeline (validate/edit via Agent Builder). Note: v6.2.0 added `AGENTS` file convention (#1970) — evaluate whether this replaces or complements `.agent.yaml` source files. | BMB review (B1) | 2 | 0.5 | 60% | 4 | 0.2 | Keep the lights on | Backlog |

### Platform & Product Vision

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| P3 | **Team installer architecture** — Generalize `convoke-install-vortex` to `convoke-install <module-name>` for multi-module support. Note: Enhance module proves the extensibility pattern (v2.4.0). v6.2.0 introduced `bmad-skill-manifest.yaml` for skill package discovery — installer should understand this convention. | Platform architecture | 6 | 1 | 80% | 4 | 1.2 | Move the needle | Backlog |
| P2 | **Multi-module collaboration workflows** — Cross-module handoffs and routing between Teams (Vortex) and Skills (Enhance). Scope expanded: not just cross-team, but cross-module (e.g., Enhance backlog feeding Vortex discovery). | Product vision, README roadmap | 5 | 2 | 30% | 8 | 0.4 | Move the needle | Unblocked (P1 complete) |
| P7 | **ML/AI Engineering team exploration** — Discovery spike to determine team-vs-skill question for ML/AI domain. Map ML lifecycle (problem → data exploration → experiment → validate → deploy → monitor) against Vortex streams and BMM workflow. Options: new team (3-4 dedicated agents) vs Enhance-style skill modules for existing agents. **Note (2026-03-21):** Should be evaluated through Capability Evaluation Framework (skill→agent→team) before committing form factor. Added from party-mode team exploration, 2026-03-17 | Party-mode review (Victor, Winston, user) | 6 | 2 | 30% | 3 | 1.2 | Move the needle | Backlog |
| P8 | **Governance & Support skill set** — Transversal advisory skills (compliance, coaching, change management, organizational health) that augment existing agents. "Review and advise" pattern — not a team but cross-cutting capability. Skills for PM (compliance), SM (coaching), Architect (change management). Reframe of Ethics & Legal into broader scope. **Note (2026-03-21):** Evaluate through Capability Evaluation Framework before committing form factor. Added from party-mode team exploration, 2026-03-17 | Party-mode review (Emma, Victor, user) | 5 | 1 | 30% | 3 | 0.5 | Move the needle | Backlog |
| P9 | **Forge team — Domain Knowledge Extraction (KORE)** — Third Convoke team for brownfield knowledge capture. Conversational persona agents (like Vortex and Gyre). **Scaffolded via Enhance framework (Task 4 in ADR-001 sequence).** Depends on: Enhance MVP shipped (Phase 6) + Vortex redesign (Task 3) complete. Vortex scope decision complete (scored 4.65/5). **Vortex discovery COMPLETE (all 7 streams, 2026-03-21).** 9 artifacts produced: scope decision, 2 lean personas (Landing Consultant, Knowledge Holder), HC2 problem definition, HC3 hypothesis contract (3 hypotheses, 11 assumptions), HC4 shadow engagement experiment (pre-registered), HC5 signal framework (15 signals, 6 anomaly patterns), HC6 decision framework (4 gates). **Next milestone: shadow engagement execution** — 6-week concierge+A/B experiment on first available brownfield engagement. Gate 1 decision criteria pre-registered. Phase A: Silo (Survey) + Rune (Excavate) targeting engagement weeks 1-4. Phase B: Aria (Codify). Phase C: Sage (Validate) + Warden (Steward). Forge↔Gyre handoff contracts designed (FG-HC1: TKAs→Gyre contextual model, FG-HC2: RCAs→Gyre compliance, GF-HC1: Gyre gaps→Forge queue). Epic breakdown: 5 epics, ~5 sprints for Phase A. Module at `_bmad/bme/_forge/`. Discovery artifacts in `_bmad-output/vortex-artifacts/`. Planning artifacts: `convoke-ecosystem-vision.md`, `epics-forge-phase-a.md`, `forge-gyre-handoff-contract.md`. **Rune input:** Vendor/platform decision excavation identified as high-value template category — "why we chose vendor X" is tribal knowledge that disappears first and hurts most. Reference: ArcKit (`tractorjuice/arc-kit`) has vendor profiling, scoring, and 3-year TCO analysis patterns. | Validated demand from consulting teams. Vortex discovery: 2026-03-21 (complete). ADR-001: Task 4. ArcKit ref: 2026-03-22 | 9 | 3 | 90% | 8 | 3.0 | Move the needle | Blocked (needs Enhance + Vortex redesign). Discovery complete — ready for shadow engagement |
| P12 | **Enhance framework — Team Module Generator (BMB)** — Meta-tool that generates new Convoke team modules from templates. BMB module with 6-step workflow: Team Discovery, Agent Design, Contract Design, Workflow Design, Integration, Validation. Extracts templates from Vortex + Gyre E1 (two proven reference modules). Task 2 in ADR-001 sequence (variant C'). **MVP = Structural tier**: complete XML activation protocol with parameterized placeholders (not stubs, not LLM-generated). Staggered parallel: Gyre E1 → Enhance Steps 1-5 draft (+ `enhance-notes.md` rationale + dry-run dummy module) → Gyre E2a → Enhance template lock → Gyre E2b-E4 → Enhance final (+ dogfood exercise). Guard rails: template stability gate (2+ agents), config-driven doctor (file existence only — Red Team H3), no mid-story switching, MVP time-box (1 Gyre epic equivalent). Spike contingency: if Gyre Story 2.1 accuracy gate fails, Enhance templates remain valid (structural, not accuracy-dependent). **Deferred to backlog:** auto-compass-routing, smart template validation, generative content (LLM-generated personas/principles). ADR: `adr-enhance-gyre-build-sequencing.md` | ADR-001 (variant C'). Product vision | 8 | 3 | 80% | 6 | 3.2 | Move the needle | **Unblocked — Gyre complete, ready to start** |
| P13 | **Vortex redesign** — Retroactively align Vortex to Enhance-codified patterns. Vortex *consumes* Enhance templates for validation — it must not feed them. Task 3 in ADR-001 sequence. Depends on Enhance template lock (Phase 4). Task sequencing lock: templates must be locked before this begins. | ADR-001. Task 3 | 7 | 2 | 70% | 4 | 2.5 | Move the needle | Blocked (needs Enhance template lock — Phase 4) |
| P10 | **Capability Evaluation Framework** — Decision tool for ecosystem growth: skill→agent→team tiers with bidirectional promotion/demotion triggers. Overlap analysis template (Gyre pattern). Sentinel evaluated as proof-of-concept (result: 1 agent in Gyre, not standalone team). **Tier 1 (Skill) maps to Enhance module pattern** — new capabilities at skill tier are implemented as Enhance workflows patched onto existing agents (see `ENHANCE-GUIDE.md`). Framework document complete. Operationalize: integrate into team review process, link to friction logs. Artifact: `capability-evaluation-framework.md` | Ecosystem strategy session, 2026-03-21 | 7 | 2 | 80% | 2 | 5.6 | Move the needle | Backlog |
| P11 | **Friction log capture for consulting teams** — Template and quarterly review process for tracking capability gaps across real engagements. Template complete, needs distribution to consulting teams. Links to Capability Evaluation Framework (P10) — friction logs feed the decision tree. Artifact: `friction-log-template.md` | Ecosystem strategy session, 2026-03-21 | 8 | 1 | 70% | 1 | 5.6 | Move the needle | Backlog |

---

## Exploration Candidates

These initiatives are promising but need discovery work before scoring. Not yet prioritized.

| # | Initiative | Source | Next Step |
|---|-----------|--------|-----------|
| N1 | **Usage telemetry (opt-in)** — Track which workflows are used, completion rates, and drop-off points to inform backlog priorities | Multi-agent review (Noah) | Define what to track and privacy model |
| P1-disc | **Gyre Vortex discovery — COMPLETE** — All 7 streams executed (2026-03-21). 8 artifacts produced across `_bmad-output/vortex-artifacts/`: scope decision (4.52/5), 3 lean personas (Engineering Lead/Sana, SRE Platform Engineer/Ravi, Compliance Officer/Priya), HC2 problem definition (structural readiness gap, 6 pains→1 root cause: assessment on predefined criteria not context-specific discovery), HC3 hypothesis contract (3 hypotheses: contextual discovery, actionable prioritization, compound risk; 9 assumptions), HC4 3-phase pilot experiment (interviews → model accuracy → sprint integration, 5-8 weeks total), HC5 signal framework (14 signals across 3 tiers, 6 anomaly patterns, model accuracy as master signal), HC6 decision framework (4 gates incl. Gate 2 kill switch at V1 <60%). Key findings: riskiest assumption (model accuracy) testable in days not weeks. Discovery runs in parallel with E1 build. Phase 1 interviews already designed (separate artifact from 2026-03-20). Domain research: 2026-03-19. Product brief: 2026-03-20. | Vortex discovery session, 2026-03-21 | **Done.** Findings absorbed into P1. Next: execute Phase 1 interviews (5 teams, 1 week) |
| P5 | **Convoke website** — Public website for Convoke: positioning, documentation, team showcase, getting started guide, and community | Product owner | Define scope (landing page vs. full docs site), hosting, and content strategy |
| P6 | **Tool-enabled agents** — Allow select agents to use external tools (MCP servers, CLI commands, file operations) beyond pure conversation. Evaluate which agents benefit from tool access and what guardrails are needed | Product owner | Identify candidate agents, define tool access model, assess security/trust implications |
| P9-disc | **Forge Vortex discovery — COMPLETE** — All 7 streams executed (2026-03-21). 9 artifacts produced across `_bmad-output/vortex-artifacts/`: scope decision (4.65/5), 2 lean personas (Landing Consultant + Knowledge Holder), HC2 problem definition (knowledge asymmetry, 6 pains→1 root cause), HC3 hypothesis contract (3 hypotheses, 11 assumptions, testing order), HC4 shadow engagement experiment (6-week concierge+A/B, pre-registered metrics), HC5 signal framework (15 signals across 3 tiers, 6 anomaly patterns), HC6 decision framework (4 gates from shadow→ecosystem). Key findings: 5 of 6 critical assumptions testable in single shadow engagement. Shadow engagement can run BEFORE Forge Phase A is built. Methodology validation precedes agent implementation. | Vortex discovery session, 2026-03-21 | **Done.** Findings absorbed into P9. Next: identify shadow engagement candidate (mid-level consultant, brownfield engagement within 4 weeks) |
| H4 | **Validate "strategic conversation" hypothesis** — Do RICE scoring questions prompt genuine reflection or rubber-stamping? Measure whether users modify their initial instinct on at least 1 score per triage session (modification = engagement). Source: P4 PRD Innovation Hypothesis H4 | P4 PRD (Innovation Hypotheses) | Run 3+ triage sessions, track per-session score modification rate |
| D4 | **Video walkthrough or tutorial** — Screencast of a first-time user going through Emma's Lean Persona workflow. Format, hosting, and maintenance strategy all undefined | Contributing section, adjusted (Maya, Carson) | Define format (video vs. interactive), hosting platform, and update strategy |
| P9-wka | **Forge Written Knowledge Analysis agent** — Potential third agent for Forge Phase A that ingests, structures, and cross-references existing code and documentation in brownfield environments. Produces a Knowledge Gap Map (documented & current / documented & stale / undocumented / contradictory) that targets Rune's excavation queue. Open question: separate agent vs. Silo expansion — defer to shadow engagement observation. Inspired by analysis of `bmad-federated-knowledge` (external repo, different ecosystem — pattern study only, not a dependency). Scope note: `_bmad-output/vortex-artifacts/scope-note-forge-written-knowledge-agent-2026-03-22.md` | Emma contextualization session, 2026-03-22 | Validate during Forge shadow engagement (HC4): observe whether consultants naturally separate landscape surveying from deep doc/code analysis. Success criteria: >15% Week 1 time on distinct doc/code analysis, organic gap map production, or untargeted interview waste. Decision: separate agent, Silo expansion, or drop |
| W1 | **Wardley Mapping as a shared capability** — Cross-team strategic lens for value chain mapping and evolution analysis. Serves multiple agents: Emma (competitive landscape), Silo (system landscape), Atlas (readiness mapping), Winston (architecture decisions). Open questions: skill vs. shared library vs. dedicated agent? Which team owns it? Evaluate through P10 (Capability Evaluation Framework) before committing form factor. Reference: ArcKit (`tractorjuice/arc-kit`) has deep Wardley support (5 artifact types, OWM-compatible output, mathematical models for Differentiation Pressure / Commodity Leverage / Dependency Risk) — study as structural exemplar, not a dependency. | Winston competitive analysis (ArcKit), 2026-03-22 | Run through P10 Capability Evaluation Framework: determine tier (skill→agent→team), identify owning team, define what user problem it solves that existing agents don't. Study ArcKit's Wardley skill as reference implementation |
| W2 | **Pre-write artifact validation hooks** — Claude Code hooks that validate artifacts before they're written to disk. Enforces quality at the infrastructure level across all teams (Vortex, Gyre, Forge, BMM). Prevents malformed artifacts from being saved — frontmatter completeness, required sections, template conformance. Reference: ArcKit (`tractorjuice/arc-kit`) implements 21 JS hooks including pre-write validation, governance scanning, and quality checklist enforcement — study pattern, not implementation. | Winston competitive analysis (ArcKit), 2026-03-22 | Define what "valid artifact" means per artifact type across teams. Identify minimum viable checks (frontmatter? required sections? naming convention?). Assess effort: how many artifact types need schemas? Prototype on one artifact type (e.g., PRD) before scaling |

---

## Epic Groupings

Initiatives that should be bundled together for efficient delivery:

### Epic: "First Impression" (D7 + D5 + D1 + D2 + S1)
Improve the first-time user experience from README visuals to first workflow completion. D7 and D5 are quick wins; D1 and D2 add depth; S1 is the higher-effort anchor.

### Epic: "Update Experience for Adoption" (U7 + U8 + U9)
Reduce update friction that hurts adoption on big releases. U7 (changelog surface, score 4.3) shows users what's new — highest leverage, lowest effort. U8 (agent exclusions, score 3.2) respects user customization across upgrades. U9 (module-aware refresh, score 1.9) scopes updates to installed modules only — highest effort but essential as module count grows. Sequencing: U7 first (standalone), then U8 (config schema change), then U9 (depends on U8 schema patterns).

### Epic: "Update System Hardening" (U1 + U4 + T3 + T4)
Harden the migration and update system with idempotency checks and integration tests.

### Epic: "CI/CD Pipeline" (I1 + I2)
Automate the publish and release flow. I1 (NPM_TOKEN) is the prerequisite; I2 (gh auth releases) builds on it.

### Epic: "Python CI Parity" (T6 + T7 + T8)
Close the dual-language CI gap. T6 (Python tests in CI) is the anchor and blocker resolution — scores 14.4, highest in the backlog. T7 (linting) and T8 (dep pinning) piggyback on the same CI job. All three can ship in a single PR. Source: Gyre delta analysis 2026-03-25.

### Epic: "Test Debt Cleanup" (T1 + T2 + T5)
Batch low-priority coverage gaps in existing CLI scripts. All low-score housekeeping that benefits from a single focused pass.

### Epic: "Platform Foundation" — ADR-001 Sequence (P1 → P14 → P12 → P13 → P9 → P2)
The multi-module future follows the ADR-001 build sequence. **P1 (Gyre) is DONE** — all 4 epics complete (2026-03-24), full pipeline validated. **P14 (Team Factory) is DONE** — all 3 epics complete (2026-03-25), 16 stories, 136 tests, guided creation + extension workflows shipped. P12 (Enhance framework) is **unblocked** — extracts templates from Vortex + Gyre (two proven reference modules). P13 (Vortex redesign) retroactively aligns Vortex to Enhance-codified patterns. P9 (Forge) is scaffolded by Enhance as the third team — Vortex discovery complete, shadow engagement next. P2 (cross-module workflows) is now **unblocked** by P1 completion. Gyre and Forge share handoff contracts (FG-HC1/HC2/GF-HC1).

### Epic: "Ecosystem Governance" (P10 + P11)
Decision framework for ecosystem growth. P10 (Capability Evaluation Framework) defines how new capabilities enter the ecosystem (skill→agent→team). P11 (Friction logs) provides the demand signal input. Together they prevent speculative building. Both artifacts complete — need operationalization and team distribution.

### Epic: "Agent Compliance Sweep" (A1 + A2 + A3 + A4)
Four small agent quality items that can be swept in a single pass: validate menus, source files, npm keywords, temp dir prefix.

### Epic: "Update System Robustness" (U2 + U3 + U5)
Remaining update system items not in Hardening: load-time validation, version detection fallback, and npx command fix.

---

## Prioritized View (by RICE Score)

| Rank | # | Initiative | Score | Track | Category |
|------|---|-----------|-------|-------|----------|
| 1 | **T6** | **Add Python test execution to CI pipeline** | **14.4** | **Keep the lights on** | **Testing** |
| 2 | P10 | Capability Evaluation Framework | 5.6 | Move the needle | Platform |
| 3 | P11 | Friction log capture for consulting teams | 5.6 | Move the needle | Platform |
| 4 | **U7** | **Changelog surface during update** | **4.3** | **Move the needle** | **Update System** |
| 5 | **S3** | **One-command standalone install (`npx convoke-agents init`)** | **3.6** | **Move the needle** | **Infrastructure** |
| 6 | P12 | Enhance framework — Team Module Generator (BMB) | 3.2 | Move the needle | Unblocked |
| 7 | **U8** | **Respect user agent exclusions on update** | **3.2** | **Move the needle** | **Update System** |
| 8 | P9 | Forge team — Domain Knowledge Extraction (KORE) | 3.0 | Move the needle | Blocked |
| 9 | T3 | End-to-end update test on real project | 2.7 | Keep the lights on | Testing |
| 10 | P13 | Vortex redesign (align to Enhance patterns) | 2.5 | Move the needle | Platform |
| 11 | T4 | Migration idempotency CLI test | 2.4 | Keep the lights on | Testing |
| 12 | T7 | Add Python linting to CI pipeline | 2.4 | Keep the lights on | Testing |
| 13 | I2 | `gh auth` for CI release creation | 2.4 | Keep the lights on | Infrastructure |
| 14 | D2 | Add output examples for more agents | 2.1 | Move the needle | Documentation |
| 15 | **U9** | **Module-aware refresh and validation** | **1.9** | **Move the needle** | **Update System** |
| 16 | I1 | NPM_TOKEN secret for CI publish | 1.8 | Keep the lights on | Infrastructure |
| 17 | I7 | Team Factory CSV quoting hardening | 1.8 | Keep the lights on | Infrastructure |
| 18 | T8 | Standardize Python PEP 723 dependency declarations | 1.6 | Keep the lights on | Testing |
| 19 | D6 | Reduce narrative overlap in journey example | 1.6 | Keep the lights on | Documentation |
| 20 | U4 | Test upgrade-path step file cleanup | 1.4 | Keep the lights on | Update System |
| 21 | I9 | Registry writer idempotency drift detection | 1.4 | Keep the lights on | Infrastructure |
| 22 | P3 | Team installer architecture | 1.2 | Move the needle | Platform |
| 23 | I5 | Workflow output naming enforcement | 1.2 | Keep the lights on | Infrastructure |
| 24 | P7 | ML/AI Engineering team exploration | 1.2 | Move the needle | Platform |
| 25 | S1 | Interactive installer | 1.0 | Move the needle | Infrastructure |
| 26 | D3 | BMAD Core return arrow in diagram | 0.9 | Keep the lights on | Documentation |
| 27 | I10 | Config appender YAML comment preservation | 0.9 | Keep the lights on | Infrastructure |
| 28 | A1 | Add validate menu items to Wave 3 agents | 0.8 | Keep the lights on | Agent Quality |
| 29 | A3 | Add npm keywords (`agentic`, `team-of-teams`) | 0.8 | Keep the lights on | Agent Quality |
| 30 | I6 | Add `--verbose` flag to all CLI commands | 0.8 | Keep the lights on | Infrastructure |
| 31 | T1 | `convoke-update.js` coverage to 80%+ | 0.8 | Keep the lights on | Testing |
| 32 | U2 | Validate migration modules at load time | 0.8 | Keep the lights on | Update System |
| 33 | S2 | Simplified entry point | 0.7 | Move the needle | Infrastructure |
| 34 | I8 | Team Factory write verification — value correctness | 0.6 | Keep the lights on | Infrastructure |
| 35 | P8 | Governance & Support skill set | 0.5 | Move the needle | Platform |
| 36 | U3 | Robust version detection fallback | 0.5 | Keep the lights on | Update System |
| 37 | I11 | Registry Fragment Architecture (D-Q6) | 0.5 | Keep the lights on | Infrastructure |
| 38 | I13 | Team Factory Express Mode | 0.5 | Keep the lights on | Infrastructure |
| 39 | P2 | Multi-module collaboration workflows | 0.4 | Move the needle | Unblocked |
| 40 | T2 | `convoke-version.js` coverage to 80%+ | 0.4 | Keep the lights on | Testing |
| 41 | I12 | Validator.js hardcoded to Vortex paths | 0.4 | Keep the lights on | Infrastructure |
| 42 | I3 | CSV parser library for manifest | 0.4 | Keep the lights on | Infrastructure |
| 43 | T5 | Expand docs audit — remaining gaps | 0.3 | Keep the lights on | Testing |
| 44 | A4 | Fix temp dir prefix inconsistency | 0.3 | Keep the lights on | Agent Quality |
| 45 | A2 | Create `.agent.yaml` source files | 0.2 | Keep the lights on | Agent Quality |

---

## Completed

### 2026-03-25

| # | Initiative | Score | Category |
|---|-----------|-------|----------|
| P14 | **Team Factory — Guided Team Creation Workflow** — 3 epics, 16 stories, 136 tests. Create teams, add agents, add skills — all fully wired with validation. | 3.6 | Platform |
| I4 | **BMAD v6.2.1 convention alignment** — 3 specced work items: skill validator for Team Factory pipeline, `tech-spec` → `spec` rename across 28 files, dead `default-party.csv` cleanup. | 2.0 | Infrastructure |

### 2026-03-24

| # | Initiative | Score | Category |
|---|-----------|-------|----------|
| P1 | **Gyre team — Operational Readiness (Convoke team module)** — 4 epics, 25 stories, 528+ subtasks. 4 agents (Scout, Atlas, Lens, Coach), 4 contracts, 7 workflows. Full pipeline validated. Vortex discovery complete (all 7 streams). | 3.6 | Platform |

### 2026-03-16

| # | Initiative | Score | Category |
|---|-----------|-------|----------|
| P4 | **Enhance module** — Shipped as v2.4.0. New BME section with RICE initiatives backlog skill (3 modes). | 2.8 | Platform |

### 2026-03-14

| # | Initiative | Score | Category |
|---|-----------|-------|----------|
| S4 | **Migrate to skills format & native module compliance** — v2.2.0 published | 3.6 | Infrastructure |
| S3 | **Install BME slash commands with Vortex** | 8.0 | Infrastructure |

### v2.0.1 (2026-03-09)

| # | Initiative | Score | Category |
|---|-----------|-------|----------|
| D7 | **Fix ASCII art banner and Vortex stream diagram** | 8.1 | Documentation |
| D5 | **Problem-framing sentence in README** | 8.1 | Documentation |
| D1 | **Workflow list in README or docs** | 5.6 | Documentation |
| U5 | **`postinstall.js` npx command fix** | 4.0 | Update System |
| U1 | **Check migration history before delta execution** | 3.2 | Update System |

### Pre-backlog fixes (2026-03-08)

| Item | Fix Applied |
|------|-------------|
| Stale workflow step files (M1 HIGH) | `fs.remove(dest)` before `fs.copy()` in `refresh-installation.js` |
| Migration history before validation (W1 MEDIUM) | Reordered: validate first, then write history in `migration-runner.js` |
| Doctor missing step structure check (M3 LOW) | Added `checkWorkflowStepStructure()` as 8th check in `convoke-doctor.js` |
| `npx convoke-*` commands fail without `-p` flag | Updated docs to use `npx -p convoke-agents` |
| README platform positioning | Restructured README with platform intro and Vortex section |
| README content ordering | Moved "What Agents Produce" above Quick Start |
| Activation instructions unclear for Claude.ai | Split into separate Claude Code and Claude.ai subsections |
| U6: Preserve user-customized agents on update | Already resolved: `mergeConfig()` smart-merges since v1.4.0 |
| A5: Complete Wade's placeholder workflow steps | Already resolved: all 3 workflows have full content since v1.5.x |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-03-25 | Winston adoption review: Added U7 (Changelog surface during update, score 4.3 — rank #4), U8 (Respect user agent exclusions, score 3.2 — rank #8), U9 (Module-aware refresh and validation, score 1.9 — rank #17). New epic grouping "Update Experience for Adoption" (U7+U8+U9). Sequencing: U7 first (standalone, highest leverage), U8 (config schema), U9 (highest effort, depends on U8 patterns). Source: user-reported update friction on big releases affecting adoption. 43 ranked items. |
| 2026-03-25 | Gyre delta analysis: Added T6 (Python CI test execution, score 14.4 — **blocker**, now rank #1), T7 (Python linting, score 2.4), T8 (PEP 723 dep standardization, score 1.6). New epic grouping "Python CI Parity" (T6+T7+T8). Source: Gyre team expanded model from 21→29 capabilities, added dual-language and agent-framework domains. Stack profile updated: Python confirmed as secondary stack (46 files, 33% of codebase). DL-003 revised from recommended→nice-to-have after discovering PEP 723 inline metadata already in use. 40 ranked items. |
| 2026-03-25 | tf-epic-3 retrospective: P14 (Team Factory) marked Done — all 3 epics complete (16 stories, 136 tests). Added I11 (Registry Fragment Architecture D-Q6, score 0.5), I12 (Validator.js Vortex hardcoding, score 0.4), I13 (Team Factory Express Mode, score 0.5) — all carried forward from tf-epic-1/2/3 retros. Prioritized view updated (37 items). Platform Foundation epic grouping updated. |
| 2026-03-24 | I4 expanded from v6.2.0 to v6.2.1 scope (Winston analysis). Three specs drafted: (a) `spec-skill-validator-team-factory.md` — new `validateSkill()` quality gate for Team Factory, 7 tasks; (b) `spec-tech-spec-to-spec-rename.md` — rename tech-spec prefix to spec across 28 files in BMM/TEA, 9 tasks; (c) `spec-party-roster-cleanup.md` — remove 3 dead `default-party.csv` files, 5 tasks. RICE re-scored: R 4→6, I 1→1.5, E 2→4, score 1.8→2.0. Status: Backlog→Specced. |
| 2026-03-22 | ArcKit competitive analysis (Winston). Added 2 exploration candidates: W1 (Wardley Mapping as shared capability — cross-team strategic lens, evaluate via P10 Capability Evaluation Framework), W2 (Pre-write artifact validation hooks — infrastructure-level quality enforcement via Claude Code hooks). Added reference notes: P1 updated with ArcKit compliance template exemplars for Gyre v2 Compliance & Security domain, P9 updated with vendor/platform decision excavation as Rune template category. Source: `tractorjuice/arc-kit` (Enterprise Architecture Governance toolkit, MIT, 64 commands, 58 templates, 21 hooks). 32 scored items + 9 exploration candidates. |
| 2026-03-22 | Added P9-wka exploration candidate (Forge Written Knowledge Analysis agent). Potential third Forge agent for deep doc/code analysis between Silo (survey) and Rune (extract). Needs shadow engagement validation before RICE scoring. Scope note saved. Source: Emma contextualization session analyzing `bmad-federated-knowledge` external repo. |
| 2026-03-22 | Added I5 (Workflow output naming enforcement, score 1.2). Phase C from ADR `adr-repo-organization-conventions-2026-03-22.md` — incremental updates to 8 artifact-producing workflows to follow naming convention at creation time. Ranked #16. 32 active items. |
| 2026-03-21 | **Gyre Vortex discovery complete.** P1-disc marked COMPLETE — all 7 streams executed, 8 artifacts produced (scope decision, 3 lean personas, HC2-HC6 chain). P1 updated with discovery findings: 3 hypotheses (contextual discovery, actionable prioritization, compound risk), 3-phase pilot experiment designed (interviews → model accuracy kill switch → sprint integration), 14 production signals cataloged, 4 decision gates pre-registered. P1 status updated: discovery complete, ready for pilot. Next milestone: Phase 1 interviews (5 teams, 1 week). Key speed advantage: riskiest assumption (model accuracy) testable in 2 weeks vs. Forge's 6-week shadow engagement. Discovery runs in parallel with E1 build. |
| 2026-03-21 | **Forge Vortex discovery complete.** P9-disc marked COMPLETE — all 7 streams executed, 9 artifacts produced (scope decision, 2 lean personas, HC2-HC6 chain). P9 updated with discovery findings: 3 hypotheses validated for testing, shadow engagement designed and pre-registered, 4-gate decision lifecycle defined, 15 production signals cataloged. P9 status updated: discovery complete, ready for shadow engagement. Next milestone: identify shadow engagement candidate (mid-level consultant, brownfield engagement within 4 weeks). Shadow engagement is independent of ADR-001 build sequence — can run in parallel with Gyre E1. |
| 2026-03-21 | **Kickoff.** P1 (Gyre) status → Active — Phase 1 (E1). P12 (Enhance) status → Queued — Phase 2 (after Gyre E1). P12 updated with Structural tier MVP definition, deferred sophistication items (auto-compass-routing, smart validation, generative content), dry-run dummy module, dogfood exercise. P13 dependency clarified (Phase 4 template lock). P9 dependency clarified (Phase 6 Enhance MVP + Vortex redesign). ADR-001 6-phase sequence is now the active execution plan. Team confidence vote: unanimous. |
| 2026-03-21 | Review pass: P1 updated with implementation readiness report findings (43 FRs, 17 NFRs, 100% coverage, FR57 inconsistency, Story 1.6 scope clarification). P12 updated with ADR-001 variant C' refinements (enhance-notes.md rationale, spike contingency, dogfood exercise, Red Team H3 doctor scope). 31 active items. |
| 2026-03-21 | Major update (2/2): Added P12 (Enhance framework — Team Module Generator, score 3.2) and P13 (Vortex redesign, score 2.5) from ADR-001 build sequence. P9 (Forge) status changed to Blocked (needs Enhance + Vortex redesign) — Forge is Task 4 in the ADR-001 sequence, scaffolded by Enhance. Capability Evaluation Framework updated: Tier 1 (Skill) = Enhance workflow pattern, Tier 3 (Team) = Enhance-generated module. Epic grouping "Platform Foundation" rewritten to follow ADR-001 sequence: P1→P12→P13→P9→P2. 31 active items. |
| 2026-03-21 | Major update (1/2): P1 redesigned (CLI→Convoke team module, score 1.9→3.6, effort 10→6, confidence 80%→90%). Added P9 (Forge team, score 3.0), P10 (Capability Evaluation Framework, score 5.6), P11 (Friction log capture, score 5.6). Added P9-disc exploration candidate (Vortex discovery streams 2-7). P7/P8 noted for Capability Evaluation Framework review. New epic groupings: "Ecosystem Governance" added (P10+P11). Forge↔Gyre handoff contracts designed (FG-HC1/HC2/GF-HC1). Ecosystem vision document split into 3 purpose-built documents. Sentinel evaluated through framework → 1 agent in Gyre, not standalone team. |
| 2026-03-20 | Review: P1 updated with product brief findings — 4 agents (Compliance & Security merged), generated contextual models (any stack), thickened MVP (2 agents + cross-domain correlation + architecture intent + RICE-scored backlog + markdown outputs), confidence 70%→80%, score 1.7→1.9. P1-disc updated with refined experiment design (4 questions, 5 interviews, same cohort for interviews + MVP pilot, MVP success criteria). Product brief: `product-brief-gyre-2026-03-19.md`. 26 active items. |
| 2026-03-19 | Review: P1 updated with domain research findings — renamed to "Gyre team — Operational Readiness", confidence 50%→70%, score 1.2→1.7. P1-disc sharpened with validated 3-domain scope (observability, deployment, compliance). Prioritized view re-ranked. Research document: `domain-operational-readiness-research-2026-03-19.md`. 26 active items. |
| 2026-03-17 | Triage: Added P7 (ML/AI Engineering team exploration, score 1.2), P8 (Governance & Support skill set, score 0.5). Merged Gyre team details into P1 + P1-disc (operational readiness scope, 5-interview experiment, best practices). Party-mode team exploration with Vortex + CIS teams. 26 active items. |
| 2026-03-16 | Triage: Added I4 (BMAD v6.2.0 convention alignment, score 1.8). Party-mode team review confirmed zero broken Enhance references, identified 3 convention gaps. 24 active items. |
| 2026-03-16 | Triage: landscape review after Enhance module (v2.4.0) and BMAD v6.1.0. Merged 7 observations into existing items: P4 moved to Completed, P1/P3/P2/S1/S2/I2 descriptions updated with post-Enhance context. Removed S4 from active (already completed 2026-03-14). Epic groupings updated (Platform Foundation: P4 done). 23 active items remain. |
| 2026-03-15 | P4 (Enhance module) advanced to In Planning. PRD complete (49 FRs, 9 NFRs), architecture aligned, pre-implementation spike validated (`<item exec="...">` confirmed), epics created (3 epics, 9 stories, 100% FR/NFR coverage). Implementation-ready. |
| 2026-03-14 | Completed S4 (Migrate to skills format & native module compliance). Published as v2.2.0 on npm. Moved to Completed section. 24 active items remain. P4 (Enhance module) is now rank #1. |
| 2026-03-14 | Updated S4 scope after adversarial review (12 findings) and party mode architecture session. Expanded from 8→10 tasks, 13→16 ACs. Added: manifest schema refactor, `createAgentManifest()` deletion, version bump, doc updates. Effort 3→5, score 6.0→3.6. Status: Ready (story file created). Still rank #1. |
| 2026-03-14 | Added S4 (Migrate to skills format, score 6.0). BMAD Method v6.1.0 moved from `.claude/commands/` to `.claude/skills/` directory-per-skill structure. Now rank #1. 25 active items. |
| 2026-03-14 | Completed S3 (Install BME slash commands with Vortex). Moved to Completed section. 24 active items remain. |
| 2026-03-12 | Added S3 (Install BME slash commands with Vortex, score 8.0). Now rank #1. 25 active items. |
| 2026-03-10 | Restructured: moved all completed items out of active tables into separate "Completed" section. Renumbered prioritized view (24 active items). |
| 2026-03-09 | Marked 5 initiatives Done (v2.0.1): D7, D5, D1, U5, U1. Shipped in Phase 4 sprint (3 epics, 6 stories). 24 scored items remain. |
| 2026-03-08 | Added D7 (Fix ASCII art banner and Vortex stream diagram, score 8.1). Backlog now at 30 scored items + 4 exploration candidates. |
| 2026-03-08 | Merged 4 items from scope-adjacent backlog: A5 (Wade placeholder steps, score 2.3), D6 (journey overlap, 1.6), U6 (preserve custom agents, 1.2), T5 (docs audit content patterns, 0.9). Backlog now at 31 scored items + 4 exploration candidates. |
| 2026-03-08 | Added exploration candidates: P1-disc updated with team candidates (Data Science/AI Engineering, Ethics & Legal Compliance, Standard Authority), P5 (Convoke website), P6 (Tool-enabled agents). |
| 2026-03-08 | Added P4 (Enhance module) — new BME section for upgrading existing BMAD agents with Convoke-provided workflows. Ranked #5 (score 2.8). |
| 2026-03-08 | Multi-agent review by Vortex team, CIS team (Victor, Maya, Carson), and Sally. Scoring adjustments: I1 (7.2→1.8), D1 (2.8→5.6), D4 (1.3→2.3), T3 (2.3→2.7). Added 4 new initiatives: D5, N1, S1, S2. Added track labels, exploration candidates section, and epic groupings. |
| 2026-03-08 | Initial backlog created from Vortex team README review, Winston/Murat update system review, Bond/Morgan/Wendy agent compliance review, and Phase 3 tech debt |
