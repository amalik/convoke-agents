---
contract: HC2
type: artifact
source_agent: mila
source_workflow: research-convergence
target_agents: [liam]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/scope-decision-gyre-2026-03-21.md"
    contract: non-HC1 (contextualize-scope output)
  - path: "_bmad-output/vortex-artifacts/lean-persona-engineering-lead-2026-03-21.md"
    contract: non-HC1 (lean-persona output)
  - path: "_bmad-output/vortex-artifacts/lean-persona-sre-platform-engineer-2026-03-21.md"
    contract: non-HC1 (lean-persona output)
  - path: "_bmad-output/vortex-artifacts/lean-persona-compliance-officer-2026-03-21.md"
    contract: non-HC1 (lean-persona output)
  - path: "_bmad-output/planning-artifacts/prd-gyre.md"
    contract: non-HC1 (PRD)
  - path: "_bmad-output/planning-artifacts/product-brief-gyre-2026-03-19.md"
    contract: non-HC1 (product brief)
created: 2026-03-21
---

# HC2 Problem Definition: Gyre — Operational Readiness Discovery

> **Confidence:** High — strong convergence across 6 artifacts on core problem. Evidence gap: no direct user interviews yet (P1-disc pending). Domain research and market data validate problem severity externally.

## Converged Problem Statement

Software teams shipping to production face a structural readiness gap: they don't know what they don't know. SRE expertise, DORA research, and compliance frameworks exist — but teams cannot map this knowledge to their specific stack and context. Generic checklists miss stack-specific gaps. Single-domain tools miss compound risks. Flat lists fail to prioritize. Assessments don't persist — next quarter, same exercise from scratch.

The result: readiness gaps surface as incidents, not findings. The cost is revenue loss, compliance failures, team burnout, and leadership blind spots. 66% of engineering leaders cite inconsistent readiness standards across teams as their top blocker. The $4.5B SRE platform market (14.2% CAGR) confirms this is a real, growing problem — and zero current products offer agent-guided discovery of context-specific readiness.

The problem manifests differently across three user roles:
- **Sana (engineering lead):** "What's missing from *my* service?" — no context-specific discovery, no prioritization, no evidence for leadership
- **Ravi (SRE/platform engineer):** "What's missing across *all* my services?" — no portfolio visibility, no normalization, review bottleneck
- **Priya (compliance officer):** "Are we compliant?" — no evidence trail, reviews too late, regulatory mapping is manual

Gyre addresses this with agent-guided discovery that generates a context-specific readiness model for any stack, then compares what *should* exist against what *does* exist — surfacing absences, not just misconfigurations. Observation over declaration: code doesn't lie, self-assessments do.

**Scope:**
- **In:** Observability + Deployment readiness discovery for engineering teams shipping to production (MVP — 2 agents + cross-domain correlation)
- **Out:** Compliance & Security agent (v2), FinOps agent (v3), policy-as-code generation (v2), org-wide aggregation (v3), runtime analysis, autonomous remediation

---

## Jobs-to-be-Done

### Primary JTBD

> **When** I'm preparing to ship a service to production (or already running one that had an incident),
> **I want to** systematically discover what readiness gaps exist in my specific stack — across observability, deployment, compliance, and infrastructure —
> **so I can** prioritize the highest-impact fixes, communicate clearly to leadership about launch readiness, and avoid surprises that cause incidents or audit failures.

### Functional Job
Discover what's missing from a production stack — gaps in observability, deployment, security, compliance, and cost that are invisible until they cause incidents. Produce a prioritized, source-tagged, confidence-rated backlog of fixes with severity tiers.

**Evidence:** PRD core problem statement, domain research ($4.5B SRE market), Sana persona (M1-M6), product brief (generated contextual model as core innovation)

### Emotional Job
Feel confident and in control of production readiness — not anxious that something unknown will break at the worst possible moment.

**Evidence:** Sana persona (emotional job: "not anxious that something unknown will break"), product brief anti-metrics ("time spent in Gyre — shorter is better" = relieve anxiety, don't create it)

### Social Job
Be perceived by leadership and peers as someone who ships reliably — who can answer "when can we go live?" with evidence, not gut feel.

**Evidence:** Sana P4 (leadership visibility gap), PRD dual-audience output, Ravi persona (social job: "elevated org maturity, not bottleneck")

---

## Pains

| # | Pain | Priority | Frequency | Intensity | Evidence Sources | Current Coping |
|---|------|----------|-----------|-----------|-----------------|----------------|
| P1 | **Unknown-unknowns** — teams don't know what "ready" means for their specific stack. Generic criteria miss context-specific gaps. Absence of something isn't visible on a checklist that doesn't list it | High | Every assessment, every service | Blocks readiness — gaps surface as incidents | PRD core problem, Sana P1, product brief differentiator #1 | Ad-hoc checklists from blog posts, tribal knowledge |
| P2 | **Cross-domain blind spots** — observability, deployment, security assessed independently. Compound risks invisible ("no rollback telemetry + no deployment markers = blind rollbacks") | High | Every assessment | Compound risks cause the worst incidents — multi-system cascading failures | Sana P2, product brief differentiator #2, PRD cross-domain correlation | No mitigation — teams don't know to look for compound risks |
| P3 | **No prioritization** — all readiness items appear equally important. Flat checklists can't distinguish blockers from nice-to-haves. Teams either try to fix everything (burnout) or give up (risk) | High | Every assessment | Paralysis or risk-taking. Neither outcome is good | Sana P3, PRD RICE-scored backlog, product brief anti-metric (number of findings) | Gut feel prioritization by most senior person in the room |
| P4 | **Leadership visibility gap** — PM/CTO asks "when can we go live?" and engineering has no structured evidence to answer | Medium | Every launch | Delays, misaligned expectations, eroded trust | Sana P4, PRD dual-audience output, product brief user journey | Hand-wavy confidence levels, Slack messages, meeting updates |
| P5 | **Expertise doesn't scale** — Ravi is the single reviewer. His bandwidth caps organizational launch velocity. Teams come too late ("launching Monday, can you review?") | Medium | Every launch × number of teams | Bottleneck grows linearly with organization size | Ravi P1, P5, product brief (50% reduction target) | Ravi triages by urgency, delegates to senior devs, or skips review |
| P6 | **Assessments don't persist** — ad-hoc reviews produce meeting notes, not versioned artifacts. Knowledge evaporates. Next quarter, same exercise from scratch. No drift detection | Medium | Quarterly | Cumulative: readiness work is never compounding | Sana P5, Ravi P4, PRD capabilities manifest (version-controlled) | Personal Notion pages, Confluence docs, Slack threads |

**Root cause convergence:** P1-P3 converge on a single root cause: **assessment operates on predefined criteria, not context-specific discovery.** Existing tools (IDPs, checklists, frameworks) measure *how ready are we against criteria someone else defined.* No tool discovers *what does ready mean for this specific stack.* Gyre doesn't just check boxes — it generates the boxes.

P4-P6 are systemic consequences: leadership can't get answers because engineering can't get answers (P4), expertise is bottlenecked in individuals because there's no tool to scale it (P5), and readiness work doesn't compound because artifacts are ephemeral (P6).

---

## Gains

| # | Gain | Priority | Expected Impact | Evidence Sources |
|---|------|----------|----------------|-----------------|
| G1 | **Context-specific readiness discovery** — Gyre detects the stack, generates a capabilities manifest of what *should* exist, compares against what *does* exist. Absence detection, not just misconfiguration detection | High | Surfaces unknown-unknowns. The "aha!" moment: "I didn't even know to check for that." ≥2 novel findings per analysis | PRD core innovation, product brief generated contextual model, Sana M2 |
| G2 | **Prioritized, actionable backlog** — RICE-scored findings in 3 severity tiers (blockers, recommended, nice-to-have), source-tagged (static vs. contextual), confidence-rated | High | Sana pulls ≥1 blocker into next sprint. Teams fix what matters first, not everything at once | Sana M3, PRD output format, product brief RICE-scored backlog |
| G3 | **Cross-domain compound findings** — findings that span observability + deployment, revealing interaction effects invisible to single-domain tools | High | ≥1 compound finding per analysis. Key differentiator over all existing tools | Sana M5, product brief differentiator #2, PRD cross-domain correlation |
| G4 | **Evidence-based readiness communication** — leadership summary alongside engineering detail. Single artifact, dual rendering | Medium | Sana shares with PM/CTO. "When can we go live?" gets an evidence-based answer | Sana M6, PRD dual-audience, product brief user journey step 3 |
| G5 | **Persistent, version-controlled readiness** — capabilities manifest and readiness backlog live in the repo (.gyre/ directory). Drift detectable on re-run. Amendments preserved | Medium | Readiness work compounds. Quarterly re-runs build on previous state instead of starting from scratch | PRD .gyre/ directory, Sana P5, Ravi P4 |

**Gain convergence:** G1-G3 serve the JTBD directly — discover what's missing, prioritize it, find compound risks. G4 resolves the core tension between engineering depth and leadership clarity. G5 is the long-term compounding value that makes Gyre a continuous tool, not a one-shot assessment.

---

## Evidence Summary

| Field | Assessment |
|-------|-----------|
| **Artifacts Analyzed** | 6: scope decision (6 opportunities, weighted scoring), 3 lean personas (Sana, Ravi, Priya), PRD (43 FRs, 17 NFRs, 12 steps completed), product brief (5 sections, full persona/journey/MVP), domain research (market sizing, competitor analysis, framework survey) |
| **Total Evidence Points** | ~80 discrete findings across scope evaluation (6×5 criteria matrix), Sana persona (5 pains, 6 metrics, 5 push forces, 5 pull forces, 5 anxieties), Ravi persona (5 pains, 5 metrics, 4 push forces, 4 pull forces, 4 anxieties), Priya persona (5 pains, 3 metrics), PRD (43 functional + 17 non-functional requirements, 10 success criteria), product brief (6 MVP features, 5 success criteria, 3 personas, 4 journey steps, 10 differentiators) |
| **Convergence Assessment** | **Strong.** All artifacts independently converge on the same root cause: teams cannot map general readiness knowledge to their specific context. Pains cluster around two themes: context-blind assessment (P1-P3) and systemic consequences of no tooling (P4-P6). Gains converge on one innovation: generated contextual models that discover what "ready" means per stack |
| **Contradictions** | 1. Speed vs. depth — <2 min to first finding requires surface-level analysis; deep discovery requires more time. Designed resolution: tiered output (fast surface scan → deep domain analysis on demand). 2. Accuracy vs. coverage — model richness varies by stack community density. Designed resolution: team amendments close the gap, no stack is unsupported. 3. Tool vs. platform — Sana wants a quick answer, Ravi wants an organizational platform. Designed resolution: MVP serves Sana, architecture serves Ravi from day one |
| **Evidence Gaps** | No direct user interviews (P1-disc: Wade's 5-team interview pending). Model accuracy untested on real stacks. Sprint pull rate assumption (A1) unvalidated. Cross-domain correlation value (A3) hypothetical. Leadership summary consumption (A5) assumed |

**Provenance:**

| Finding | Primary Source | Supporting Sources |
|---------|---------------|-------------------|
| Unknown-unknowns as core problem | PRD problem statement | Domain research, all 3 personas |
| Generated contextual model as innovation | PRD core innovation section | Product brief MVP features |
| Cross-domain correlation value | Product brief differentiator #2 | PRD compound findings requirement |
| Crisis mode as entry point | Product brief operating modes | Sana persona triggers, user journey |
| ≥70% model accuracy threshold | PRD technical success criteria | Product brief kill switch |
| $4.5B market / 14.2% CAGR | Domain research market sizing | Product brief executive summary |
| 66% inconsistent standards | PRD problem statement | Ravi persona P3 |
| Dual-audience output | PRD output design | Sana M6, product brief user journey |

---

## Assumptions

| # | Assumption | Basis | Risk if Wrong | Status |
|---|-----------|-------|---------------|--------|
| A1 | Engineering leads will act on findings — pulling them into sprints alongside feature work | Sana persona M3, product brief sprint pull rate | Gyre produces reports nobody reads. No behavior change. Shelf-ware | Assumed |
| A2 | RICE scoring effectively prioritizes findings (blockers vs. nice-to-have distinction useful) | Product brief output format, PRD severity tiers | Teams overwhelmed despite prioritization. Scoring redesign needed | Assumed |
| A3 | Cross-domain correlation produces findings that single-domain tools can't find | Product brief differentiator #2, PRD compound findings | Key differentiator invalidated. "Yet another readiness checker" with no unique value | Assumed |
| A4 | Generated contextual models are accurate enough (≥70%) for first-run trust | PRD core innovation, product brief kill switch | Engineers dismiss Gyre permanently. First impression is the only impression | Assumed |
| A5 | Leadership summary is consumed and valued by non-technical stakeholders | Sana M6, PRD dual-audience rendering | Dual-audience bet fails. Engineer-only tool. Still valuable but narrower market | Assumed |
| A6 | Static analysis + contextual model combination is sufficient without runtime data | PRD analysis modes, product brief dual-mode | Misses dynamic gaps (load-dependent issues, intermittent failures). Runtime mode needed sooner | Assumed |

**Assumption priority for Liam:** A4 is the riskiest — it determines whether Gyre earns trust at all. A1 determines whether trust converts to action. A3 determines whether Gyre has unique value. A2 and A5 determine output quality. A6 determines scope adequacy.

---

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Problem clearly defined, assumptions identified | **hypothesis-engineering** | Liam 💡 | Converge assumptions into testable hypothesis contracts (HC3) |
| Evidence gaps need filling first | **user-discovery** | Isla 🔍 | Run P1-disc interviews before hypothesizing |
| Problem scope needs adjustment | **contextualize-scope** | Emma 🎯 | Re-examine boundaries if problem definition doesn't fit |

**Recommended next:** Stream 4 — Hypothesize (Liam). Problem definition is converged with 6 explicit assumptions ranked by risk. Liam converts these into testable hypothesis contracts that feed Wade's experiment design.

**Note:** Unlike Forge (where zero user validation existed), Gyre has extensive domain research and a complete PRD with adversarial review. The evidence gap is narrower — P1-disc interviews will partially validate A1 and A4 before any experiment. Confidence is higher starting point than Forge's HC2.

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Synthesize Stream)
**Agent:** Mila (Research Convergence Specialist)
**Workflow:** research-convergence
