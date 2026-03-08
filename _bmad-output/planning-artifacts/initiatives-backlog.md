# Convoke Initiatives Backlog

**Created:** 2026-03-08
**Method:** RICE (Reach, Impact, Confidence, Effort)
**Last Updated:** 2026-03-08

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
| D5 | **Problem-framing sentence in README** — Add a one-liner above the diagram: "Most teams skip validation and build on assumptions. Vortex fixes that." | Multi-agent review (Emma) | 9 | 3 | 90% | 1 | 8.1 | Move the needle | Backlog |
| D1 | **Workflow list in README or docs** — Surface the 22 workflow names somewhere accessible (collapsed `<details>` block or dedicated page) | Vortex review (Wade), adjusted (Mila) | 7 | 1 | 80% | 1 | 5.6 | Move the needle | Backlog |
| U5 | **`postinstall.js` npx command fix** — Update postinstall messages to use `npx -p convoke-agents` pattern | User testing | 8 | 0.5 | 100% | 1 | 4.0 | Keep the lights on | Backlog |
| T3 | **End-to-end update test on real project** — Scripted test: install v1.7.0, update to v2.0.0, verify all files | User testing feedback, adjusted (Murat) | 5 | 2 | 80% | 3 | 2.7 | Keep the lights on | Backlog |
| D4 | **Video walkthrough or tutorial** — Screencast of a first-time user going through Emma's Lean Persona workflow | Contributing section, adjusted (Maya, Carson) | 5 | 2 | 70% | 3 | 2.3 | Move the needle | Backlog |
| D2 | **Add output examples for more agents** — Isla (empathy map), Wade (experiment card), or Noah (signal report) in README | Vortex review (Liam, Wade) | 6 | 1 | 70% | 2 | 2.1 | Move the needle | Backlog |
| D3 | **BMAD Core return arrow in diagram** — Show feedback loop from production back to Convoke in the README diagram | Vortex review (Noah) | 4 | 0.25 | 90% | 1 | 0.9 | Keep the lights on | Backlog |

### Update & Migration System

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| U1 | **Check migration history before delta execution** — Prevent double-application if `convoke-update` runs twice | Winston review (W2) | 4 | 1 | 80% | 1 | 3.2 | Keep the lights on | Backlog |
| U4 | **Test upgrade-path step file cleanup** — Integration test simulating real upgrade with renamed step files | Murat review (M2) | 3 | 1 | 90% | 2 | 1.4 | Keep the lights on | Backlog |
| U2 | **Validate migration modules at load time** — Fail fast if a migration module lacks `apply()` instead of crashing at execution | Murat review | 2 | 0.5 | 80% | 1 | 0.8 | Keep the lights on | Backlog |
| U3 | **Robust version detection fallback** — Improve `guessVersionFromFileStructure()` with more markers (agent files, config presence) | Winston review (W3) | 3 | 0.5 | 60% | 2 | 0.5 | Keep the lights on | Backlog |

### Testing & CI

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| T4 | **Migration idempotency CLI test** — Test that running `convoke-migrate` twice doesn't break state | Murat review | 3 | 1 | 80% | 1 | 2.4 | Keep the lights on | Backlog |
| T1 | **`convoke-update.js` coverage to 80%+** — Currently at 29%, CLI orchestration paths untested | Test debt | 3 | 1 | 80% | 3 | 0.8 | Keep the lights on | Backlog |
| T2 | **`convoke-version.js` coverage to 80%+** — Currently at 56%, CLI branch paths untested | Test debt | 2 | 0.5 | 80% | 2 | 0.4 | Keep the lights on | Backlog |

### Infrastructure

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| I2 | **`gh auth` for CI release creation** — Automate GitHub release notes on tag push | CI/CD | 6 | 1 | 80% | 2 | 2.4 | Keep the lights on | Backlog |
| S1 | **Interactive installer with project-type questions** — Ask user questions during install to customize initial config (e.g., B2B/B2C, team size) | Multi-agent review (Sally) | 5 | 2 | 50% | 5 | 1.0 | Move the needle | Backlog |
| I1 | **NPM_TOKEN secret for CI publish** — Enable automated `npm publish` on tag push via GitHub Actions | CI/CD, adjusted (Victor) | 8 | 2 | 90% | 8 | 1.8 | Keep the lights on | Backlog |
| S2 | **Simplified entry point** — Single "Start Discovery" command that activates Emma with a guided first-run experience | Multi-agent review (Sally) | 7 | 1 | 40% | 4 | 0.7 | Move the needle | Backlog |
| I3 | **CSV parser library for manifest** — Replace regex-based CSV parsing in `refresh-installation.js` with proper parser | Murat review | 2 | 0.25 | 70% | 1 | 0.4 | Keep the lights on | Backlog |

### Agent Quality & Consistency

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| A1 | **Add validate menu items to Wave 3 agents** — Mila, Liam, Noah currently lack validate items that Emma/Isla/Wade/Max have | BMB review (W1) | 4 | 0.5 | 80% | 2 | 0.8 | Keep the lights on | Backlog |
| A3 | **Add `agentic` and `team-of-teams` npm keywords** — Discoverability improvement deferred since Phase 3 Epic 1 | Phase 3 tech debt | 3 | 0.25 | 100% | 1 | 0.8 | Keep the lights on | Backlog |
| A4 | **Fix temp dir prefix inconsistency** — Internal `bmad-` vs `convoke-` prefix in temporary directories | Phase 3 tech debt | 1 | 0.25 | 100% | 1 | 0.3 | Keep the lights on | Backlog |
| A2 | **Create `.agent.yaml` source files for Vortex agents** — Enable standard BMAD authoring pipeline (validate/edit via Agent Builder) | BMB review (B1) | 2 | 0.5 | 60% | 4 | 0.2 | Keep the lights on | Backlog |

### Platform & Product Vision

| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
| P4 | **Enhance module** — New BME section (`_bmad/bme/_enhance/`) that adds workflows and menu items to existing BMAD agents (BMM, CIS, BMB, TEA, Core). First enhancement: RICE initiatives backlog workflow for John PM. Positions Convoke as both "new teams" and "BMAD made better." | Product owner | 8 | 3 | 70% | 6 | 2.8 | Move the needle | Backlog |
| P1 | **Second domain-specialized team** — Design and build the next Convoke team beyond Vortex. Requires user discovery to identify which team to build. | Product vision, adjusted (Isla) | 8 | 3 | 50% | 10 | 1.2 | Move the needle | Backlog |
| P3 | **Team installer architecture** — Generalize `convoke-install-vortex` to `convoke-install <team-name>` for multi-team support | Platform architecture | 6 | 1 | 80% | 4 | 1.2 | Move the needle | Backlog |
| P2 | **Multi-team collaboration workflows** — Cross-team handoffs and routing between Vortex and future teams | Product vision, README roadmap | 5 | 2 | 30% | 8 | 0.4 | Move the needle | Blocked (needs P1) |

---

## Exploration Candidates

These initiatives are promising but need discovery work before scoring. Not yet prioritized.

| # | Initiative | Source | Next Step |
|---|-----------|--------|-----------|
| N1 | **Usage telemetry (opt-in)** — Track which workflows are used, completion rates, and drop-off points to inform backlog priorities | Multi-agent review (Noah) | Define what to track and privacy model |
| P1-disc | **User discovery for second team** — Research which domain-specialized team would deliver the most value after Vortex. Candidates: Data Science/AI Engineering, Ethics & Legal Compliance, Standard Authority | Multi-agent review (Isla), product owner | Interview current users or survey target audience |
| P5 | **Convoke website** — Public website for Convoke: positioning, documentation, team showcase, getting started guide, and community | Product owner | Define scope (landing page vs. full docs site), hosting, and content strategy |
| P6 | **Tool-enabled agents** — Allow select agents to use external tools (MCP servers, CLI commands, file operations) beyond pure conversation. Evaluate which agents benefit from tool access and what guardrails are needed | Product owner | Identify candidate agents, define tool access model, assess security/trust implications |

---

## Epic Groupings

Initiatives that should be bundled together for efficient delivery:

### Epic: "First Impression" (D5 + D1 + D4 + S1)
Improve the first-time user experience from README to first workflow completion.

### Epic: "Update System Hardening" (U1 + U4 + T3 + T4)
Harden the migration and update system with idempotency checks and integration tests.

---

## Prioritized View (by RICE Score)

| Rank | # | Initiative | Score | Track | Category |
|------|---|-----------|-------|-------|----------|
| 1 | D5 | Problem-framing sentence in README | 8.1 | Move the needle | Documentation |
| 2 | D1 | Workflow list in README or docs | 5.6 | Move the needle | Documentation |
| 3 | U5 | `postinstall.js` npx command fix | 4.0 | Keep the lights on | Update System |
| 4 | U1 | Check migration history before delta execution | 3.2 | Keep the lights on | Update System |
| 5 | P4 | Enhance module | 2.8 | Move the needle | Platform |
| 6 | T3 | End-to-end update test on real project | 2.7 | Keep the lights on | Testing |
| 7 | T4 | Migration idempotency CLI test | 2.4 | Keep the lights on | Testing |
| 8 | I2 | `gh auth` for CI release creation | 2.4 | Keep the lights on | Infrastructure |
| 9 | D4 | Video walkthrough or tutorial | 2.3 | Move the needle | Documentation |
| 10 | D2 | Add output examples for more agents | 2.1 | Move the needle | Documentation |
| 11 | I1 | NPM_TOKEN secret for CI publish | 1.8 | Keep the lights on | Infrastructure |
| 12 | U4 | Test upgrade-path step file cleanup | 1.4 | Keep the lights on | Update System |
| 13 | P1 | Second domain-specialized team | 1.2 | Move the needle | Platform |
| 14 | P3 | Team installer architecture | 1.2 | Move the needle | Platform |
| 15 | S1 | Interactive installer | 1.0 | Move the needle | Infrastructure |
| 16 | D3 | BMAD Core return arrow in diagram | 0.9 | Keep the lights on | Documentation |
| 17 | A1 | Add validate menu items to Wave 3 agents | 0.8 | Keep the lights on | Agent Quality |
| 18 | A3 | Add npm keywords (`agentic`, `team-of-teams`) | 0.8 | Keep the lights on | Agent Quality |
| 19 | T1 | `convoke-update.js` coverage to 80%+ | 0.8 | Keep the lights on | Testing |
| 20 | U2 | Validate migration modules at load time | 0.8 | Keep the lights on | Update System |
| 21 | S2 | Simplified entry point | 0.7 | Move the needle | Infrastructure |
| 22 | U3 | Robust version detection fallback | 0.5 | Keep the lights on | Update System |
| 23 | P2 | Multi-team collaboration workflows | 0.4 | Move the needle | Platform |
| 24 | T2 | `convoke-version.js` coverage to 80%+ | 0.4 | Keep the lights on | Testing |
| 25 | I3 | CSV parser library for manifest | 0.4 | Keep the lights on | Infrastructure |
| 26 | A4 | Fix temp dir prefix inconsistency | 0.3 | Keep the lights on | Agent Quality |
| 27 | A2 | Create `.agent.yaml` source files | 0.2 | Keep the lights on | Agent Quality |

---

## Already Fixed This Session

These items were identified and resolved during the 2026-03-08 review session:

| Item | Finding | Fix Applied |
|------|---------|-------------|
| Stale workflow step files (M1 HIGH) | `refreshInstallation()` didn't clean old step files before copying | `fs.remove(dest)` before `fs.copy()` in `refresh-installation.js` |
| Migration history before validation (W1 MEDIUM) | History written before validation; rollback left stale history | Reordered: validate first, then write history in `migration-runner.js` |
| Doctor missing step structure check (M3 LOW) | `convoke-doctor` didn't validate workflow step counts | Added `checkWorkflowStepStructure()` as 8th check in `convoke-doctor.js` |
| `npx convoke-*` commands fail without `-p` flag | npx tries to find standalone packages named `convoke-update` etc. | Updated README, UPDATE-GUIDE, INSTALLATION to use `npx -p convoke-agents` |
| README platform positioning | README framed Convoke as Vortex-only, not as multi-team platform | Restructured README with platform intro and Vortex section |
| README content ordering | "What Agents Produce" buried below Quick Start | Moved above Quick Start |
| Activation instructions unclear for Claude.ai | Claude.ai path was a buried sub-bullet | Split into separate Claude Code and Claude.ai subsections |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-03-08 | Added exploration candidates: P1-disc updated with team candidates (Data Science/AI Engineering, Ethics & Legal Compliance, Standard Authority), P5 (Convoke website), P6 (Tool-enabled agents). |
| 2026-03-08 | Added P4 (Enhance module) — new BME section for upgrading existing BMAD agents with Convoke-provided workflows. Ranked #5 (score 2.8). |
| 2026-03-08 | Multi-agent review by Vortex team, CIS team (Victor, Maya, Carson), and Sally. Scoring adjustments: I1 (7.2→1.8), D1 (2.8→5.6), D4 (1.3→2.3), T3 (2.3→2.7). Added 4 new initiatives: D5, N1, S1, S2. Added track labels, exploration candidates section, and epic groupings. |
| 2026-03-08 | Initial backlog created from Vortex team README review, Winston/Murat update system review, Bond/Morgan/Wendy agent compliance review, and Phase 3 tech debt |
