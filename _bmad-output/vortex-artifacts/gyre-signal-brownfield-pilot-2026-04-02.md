---
contract: HC5
type: signal-report
source_agent: noah
source_workflow: signal-interpretation
target_agents: [max]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc4-experiment-gyre-pilot-2026-03-21.md"
    contract: HC4
created: 2026-04-02
status: SIGNAL-CAPTURED
---

# Signal Report: Gyre Brownfield Pilot — Sales Copilot

> **Status:** SIGNAL-CAPTURED — first brownfield test completed. N=1, monitoring for pattern confirmation.

---

## Test Context

| Field | Value |
|-------|-------|
| **Target** | Sales Copilot |
| **Stack** | Python 3.12 / FastAPI / PostgreSQL 17 / Azure Container Apps / pydantic-ai (multi-provider LLM) |
| **Archetype** | Python Agentic API Service — Azure Cloud, PostgreSQL, AI-heavy |
| **Team profile** | AI engineers — deep domain expertise, thin platform/infrastructure coverage |
| **Date** | 2026-04-02 |

---

## Pipeline Results

Full end-to-end execution: Scout (GC1) → Atlas (GC2) → Lens (GC3) → Coach (GC4)

- **8 findings**: 2 HIGH, 2 MEDIUM, 4 LOW-MEDIUM
- **False positive rate**: 0 (per team feedback)
- **Scorecard**:

| Domain | Score | Key Gap |
|--------|-------|---------|
| Containerization & deployment | 🟢 Strong | Non-root, multi-stage, clean IaC |
| Authentication & security | 🟡 Partial | CORS misconfiguration, no rate limiting |
| Database & persistence | 🟠 Weak | No migrations, no cache TTL |
| Observability | 🟡 Partial | OTel present, logs not correlated |
| Testing | 🟠 Weak | Agent layer untested, CI no static analysis |
| Secret management | 🟡 Partial | KeyVault dep unused |

---

## Key Learning (N=1 — monitoring, not yet actionable)

**Team feedback**: Report was "very positive" — converged with their known issues AND surfaced findings beyond their expertise.

- The team are AI engineers, not platform engineers — Gyre's value was strongest in infrastructure/ops blind spots (migrations, CORS spec nuances, KeyVault integration patterns)
- Early signal: strongest value proposition may be for **domain-specialist teams with thin platform coverage**
- Trust pattern observed: confirming what the team already knew built credibility, then the novel findings landed with authority

---

## Gyre Differentiators Validated

- **Cross-domain correlation**: schema migration gap amplified by missing CI/CD migration step — single-domain tools miss this
- **Unused dependency detection**: KeyVault declared but never wired — dependency scanners check installed, Gyre checks *used*
- **Honest severity calibration**: Lens didn't inflate severity — builds credibility with receiving team

---

## Next Experiments Queued

1. **Breadth**: Run Gyre on a different archetype (Node.js/Go, different cloud, different DB) to test generalization
2. **Depth/Recurring**: Re-run on same Sales Copilot repo after team addresses top findings — tests the "maturity tracker" concept (scorecard improvement over time)

---

## Decision Guidance for Max (HC6)

- One data point — log the learning, don't act on it yet
- Persona refinement premature — wait for pattern confirmation from additional brownfield tests
- Both experiments (breadth + recurring) approved to run in parallel
