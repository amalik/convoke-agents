# Convoke Initiatives Backlog

**Created:** 2026-03-08
**Method:** RICE (Reach, Impact, Confidence, Effort)
**Last Updated:** 2026-03-19

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

### Infrastructure

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| I2 | **`gh auth` for CI release creation** — Automate GitHub release notes on tag push. Confirmed blocker: `gh auth login` not configured locally (hit during v2.4.0 release, manual workaround used). | CI/CD | 6 | 1 | 80% | 2 | 2.4 | Keep the lights on | Backlog |
| I1 | **NPM_TOKEN secret for CI publish** — Enable automated `npm publish` on tag push via GitHub Actions | CI/CD, adjusted (Victor) | 8 | 2 | 90% | 8 | 1.8 | Keep the lights on | Backlog |
| S1 | **Interactive installer with project-type questions** — Ask user questions during install to customize initial config (e.g., B2B/B2C, team size). Note: must account for Skills installation alongside Teams (v2.4.0). v6.2.0 skill packages add discovery via `bmad-skill-manifest.yaml` — installer question flow should include skill activation. | Multi-agent review (Sally) | 5 | 2 | 50% | 5 | 1.0 | Move the needle | Backlog |
| S2 | **Simplified entry point** — Single "Start Discovery" command that activates Emma with a guided first-run experience. Note: Enhance skill activation UX (keyword in chat) provides a reference pattern for low-friction entry points. | Multi-agent review (Sally) | 7 | 1 | 40% | 4 | 0.7 | Move the needle | Backlog |
| I3 | **CSV parser library for manifest** — Replace regex-based CSV parsing in `refresh-installation.js` with proper parser | Murat review | 2 | 0.25 | 70% | 1 | 0.4 | Keep the lights on | Backlog |
| I4 | **BMAD v6.2.0 convention alignment** — Adopt native skill package markers (`bmad-skill-manifest.yaml`) in Enhance workflows, verify installer handles renamed `bmad-`-prefixed directories, study upstream step-file patterns. Stretch: evaluate inference-based skill validator for Enhance skills. Added from party-mode v6.2.0 review, 2026-03-16 | Party-mode review (John, Winston, Amelia, Murat, Liam) | 4 | 1 | 90% | 2 | 1.8 | Keep the lights on | Backlog |

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
| P1 | **Gyre team — Operational Readiness** — Second Convoke team for production readiness discovery. Domain research validated (2026-03-19): $4.5B SRE market at 14.2% CAGR, 98% of leaders report readiness failures, zero competitors in agent-guided discovery. Phase 1: 3 agents (Observability Readiness, Deployment Readiness, Compliance Readiness). Completes the Vortex → BMM → Gyre product lifecycle pipeline. Complementary to IDPs (Cortex, Backstage) — Gyre discovers criteria, IDPs enforce. Research: `_bmad-output/planning-artifacts/research/domain-operational-readiness-research-2026-03-19.md` | Product vision, adjusted (Isla). Domain research validated, 2026-03-19 | 8 | 3 | 70% | 10 | 1.7 | Move the needle | Backlog |
| P3 | **Team installer architecture** — Generalize `convoke-install-vortex` to `convoke-install <module-name>` for multi-module support. Note: Enhance module proves the extensibility pattern (v2.4.0). v6.2.0 introduced `bmad-skill-manifest.yaml` for skill package discovery — installer should understand this convention. | Platform architecture | 6 | 1 | 80% | 4 | 1.2 | Move the needle | Backlog |
| P2 | **Multi-module collaboration workflows** — Cross-module handoffs and routing between Teams (Vortex) and Skills (Enhance). Scope expanded: not just cross-team, but cross-module (e.g., Enhance backlog feeding Vortex discovery). | Product vision, README roadmap | 5 | 2 | 30% | 8 | 0.4 | Move the needle | Blocked (needs P1) |
| P7 | **ML/AI Engineering team exploration** — Discovery spike to determine team-vs-skill question for ML/AI domain. Map ML lifecycle (problem → data exploration → experiment → validate → deploy → monitor) against Vortex streams and BMM workflow. Options: new team (3-4 dedicated agents) vs Enhance-style skill modules for existing agents. Added from party-mode team exploration, 2026-03-17 | Party-mode review (Victor, Winston, user) | 6 | 2 | 30% | 3 | 1.2 | Move the needle | Backlog |
| P8 | **Governance & Support skill set** — Transversal advisory skills (compliance, coaching, change management, organizational health) that augment existing agents. "Review and advise" pattern — not a team but cross-cutting capability. Skills for PM (compliance), SM (coaching), Architect (change management). Reframe of Ethics & Legal into broader scope. Added from party-mode team exploration, 2026-03-17 | Party-mode review (Emma, Victor, user) | 5 | 1 | 30% | 3 | 0.5 | Move the needle | Backlog |

---

## Exploration Candidates

These initiatives are promising but need discovery work before scoring. Not yet prioritized.

| # | Initiative | Source | Next Step |
|---|-----------|--------|-----------|
| N1 | **Usage telemetry (opt-in)** — Track which workflows are used, completion rates, and drop-off points to inform backlog priorities | Multi-agent review (Noah) | Define what to track and privacy model |
| P1-disc | **User discovery for Gyre team** — Domain research complete (2026-03-19), validated operational readiness as highest-value domain. Remaining: Wade's experiment — interview 5 teams on discovery-to-production gap. Ask: "What was the hardest part?" Categorize against 3 Phase 1 domains (observability, deployment, compliance). Also: study Google PRR process, AWS ORR checklist, and DORA research in detail to extract the specific questions that become Gyre agent knowledge base. | Multi-agent review (Isla), product owner. Domain research: 2026-03-19 | Wade's 5-team interview + Google PRR/AWS ORR deep-dive |
| P5 | **Convoke website** — Public website for Convoke: positioning, documentation, team showcase, getting started guide, and community | Product owner | Define scope (landing page vs. full docs site), hosting, and content strategy |
| P6 | **Tool-enabled agents** — Allow select agents to use external tools (MCP servers, CLI commands, file operations) beyond pure conversation. Evaluate which agents benefit from tool access and what guardrails are needed | Product owner | Identify candidate agents, define tool access model, assess security/trust implications |
| H4 | **Validate "strategic conversation" hypothesis** — Do RICE scoring questions prompt genuine reflection or rubber-stamping? Measure whether users modify their initial instinct on at least 1 score per triage session (modification = engagement). Source: P4 PRD Innovation Hypothesis H4 | P4 PRD (Innovation Hypotheses) | Run 3+ triage sessions, track per-session score modification rate |
| D4 | **Video walkthrough or tutorial** — Screencast of a first-time user going through Emma's Lean Persona workflow. Format, hosting, and maintenance strategy all undefined | Contributing section, adjusted (Maya, Carson) | Define format (video vs. interactive), hosting platform, and update strategy |

---

## Epic Groupings

Initiatives that should be bundled together for efficient delivery:

### Epic: "First Impression" (D7 + D5 + D1 + D2 + S1)
Improve the first-time user experience from README visuals to first workflow completion. D7 and D5 are quick wins; D1 and D2 add depth; S1 is the higher-effort anchor.

### Epic: "Update System Hardening" (U1 + U4 + T3 + T4)
Harden the migration and update system with idempotency checks and integration tests.

### Epic: "CI/CD Pipeline" (I1 + I2)
Automate the publish and release flow. I1 (NPM_TOKEN) is the prerequisite; I2 (gh auth releases) builds on it.

### Epic: "Test Debt Cleanup" (T1 + T2 + T5)
Batch low-priority coverage gaps in existing CLI scripts. All low-score housekeeping that benefits from a single focused pass.

### Epic: "Platform Foundation" (P3 → P1 → P2)
The multi-module future. P4 (Enhance module) is done (v2.4.0) — proved the Skills extensibility pattern. P3 (installer architecture) generalizes for multi-module support; P1 (second team) follows; P2 (cross-module workflows) depends on P1.

### Epic: "Agent Compliance Sweep" (A1 + A2 + A3 + A4)
Four small agent quality items that can be swept in a single pass: validate menus, source files, npm keywords, temp dir prefix.

### Epic: "Update System Robustness" (U2 + U3 + U5)
Remaining update system items not in Hardening: load-time validation, version detection fallback, and npx command fix.

---

## Prioritized View (by RICE Score)

| Rank | # | Initiative | Score | Track | Category |
|------|---|-----------|-------|-------|----------|
| 1 | T3 | End-to-end update test on real project | 2.7 | Keep the lights on | Testing |
| 2 | T4 | Migration idempotency CLI test | 2.4 | Keep the lights on | Testing |
| 3 | I2 | `gh auth` for CI release creation | 2.4 | Keep the lights on | Infrastructure |
| 4 | D2 | Add output examples for more agents | 2.1 | Move the needle | Documentation |
| 5 | I4 | BMAD v6.2.0 convention alignment | 1.8 | Keep the lights on | Infrastructure |
| 6 | I1 | NPM_TOKEN secret for CI publish | 1.8 | Keep the lights on | Infrastructure |
| 7 | P1 | Gyre team — Operational Readiness | 1.7 | Move the needle | Platform |
| 8 | D6 | Reduce narrative overlap in journey example | 1.6 | Keep the lights on | Documentation |
| 9 | U4 | Test upgrade-path step file cleanup | 1.4 | Keep the lights on | Update System |
| 10 | P3 | Team installer architecture | 1.2 | Move the needle | Platform |
| 11 | P7 | ML/AI Engineering team exploration | 1.2 | Move the needle | Platform |
| 12 | S1 | Interactive installer | 1.0 | Move the needle | Infrastructure |
| 13 | D3 | BMAD Core return arrow in diagram | 0.9 | Keep the lights on | Documentation |
| 14 | A1 | Add validate menu items to Wave 3 agents | 0.8 | Keep the lights on | Agent Quality |
| 15 | A3 | Add npm keywords (`agentic`, `team-of-teams`) | 0.8 | Keep the lights on | Agent Quality |
| 16 | T1 | `convoke-update.js` coverage to 80%+ | 0.8 | Keep the lights on | Testing |
| 17 | U2 | Validate migration modules at load time | 0.8 | Keep the lights on | Update System |
| 18 | S2 | Simplified entry point | 0.7 | Move the needle | Infrastructure |
| 19 | P8 | Governance & Support skill set | 0.5 | Move the needle | Platform |
| 20 | U3 | Robust version detection fallback | 0.5 | Keep the lights on | Update System |
| 21 | P2 | Multi-module collaboration workflows | 0.4 | Move the needle | Platform |
| 22 | T2 | `convoke-version.js` coverage to 80%+ | 0.4 | Keep the lights on | Testing |
| 23 | I3 | CSV parser library for manifest | 0.4 | Keep the lights on | Infrastructure |
| 24 | T5 | Expand docs audit — remaining gaps | 0.3 | Keep the lights on | Testing |
| 25 | A4 | Fix temp dir prefix inconsistency | 0.3 | Keep the lights on | Agent Quality |
| 26 | A2 | Create `.agent.yaml` source files | 0.2 | Keep the lights on | Agent Quality |

---

## Completed

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
