---
title: "Lean Persona: Priya — Compliance & Security Officer"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: lean-persona
status: HYPOTHESIS
version: 1.0
scope-decision: scope-decision-gyre-2026-03-21.md
activation: v2 (Compliance & Security agent)
---

# Lean Persona: Priya — Compliance & Security Officer

> **Remember:** This is a hypothesis until validated. Priya activates with the Compliance & Security agent (v2). This lightweight persona informs MVP architectural decisions — full development during v2 discovery.

## Executive Summary

**Job-to-be-Done:**
When ensuring services meet regulatory and security requirements, see which regulations likely apply, what controls are missing, and what policy-as-code can be generated — so I can validate compliance with evidence rather than asking engineers "are you GDPR compliant?" and getting blank stares.

**Riskiest Assumptions:**
1. A12: Gyre can surface regulatory applicability with sufficient accuracy for Priya to trust it (>85% accuracy on flags)
2. A13: Engineers will configure compliance requirements early (anticipation) rather than only at launch gate (crisis)
3. A14: Policy-as-code output is deployable to real infrastructure without significant manual rework

**Activation:** v2 — when the Compliance & Security agent ships

---

## Job-to-be-Done

### Primary Job

> **When** I need to ensure services meet regulatory and security requirements before launch (or maintain compliance in production),
> **I want to** see which regulations likely apply to a service, what controls are missing, and what policy-as-code can be generated,
> **so I can** validate compliance with evidence rather than asking engineering "are you compliant?" and getting blank stares.

### Key Distinction
Priya doesn't run Gyre — she **configures** compliance requirements early and **reviews** findings at milestones. She's a validator, not an operator.

### Context

- Ensures services meet regulatory (GDPR, EU AI Act, SOC 2, PCI-DSS) and security requirements
- Configures compliance requirements via Gyre early in lifecycle, monitors drift continuously, reviews at milestones
- Reviews happen too late today — "we launch in 2 weeks, are we GDPR compliant?"
- At enterprise scale, covers multiple product teams. At startup scale, this is a part-time role for Sana

---

## Pain Points

| # | Pain | Severity |
|---|------|----------|
| P1 | **No evidence trail** — compliance is word-of-mouth, not artifact-based | High |
| P2 | **Reviews too late** — discovers compliance gaps at launch, not during development | High |
| P3 | **Engineering blind spot** — engineers don't know which regulations apply to their service | Medium |
| P4 | **Manual mapping** — translating regulatory requirements to technical controls is manual and error-prone | Medium |
| P5 | **Drift invisible** — services compliant at launch may drift over time without detection | Medium |

---

## Success Criteria

| # | Metric | Target |
|---|--------|--------|
| M1 | Regulatory finding accuracy | >85% of flags validated as correct by Priya |
| M2 | Early configuration | Compliance requirements set before first sprint, not at launch gate |
| M3 | Evidence-based review | Priya reviews with Gyre artifacts, not engineering self-declarations |

---

## MVP Architectural Implications

Even though Priya activates in v2, her persona informs MVP decisions:

| Decision | Implication |
|----------|-------------|
| **Regulatory findings must always flag for expert review** | Gyre surfaces potential applicability ("EU user data detected — GDPR likely applies, recommend compliance review") but never claims certainty on legal matters |
| **Compliance sign-off is a launch gate** | Role-based sign-off workflow (v3) needs data shape defined in MVP |
| **Policy-as-code readiness** | MVP findings should tag which are policy-automatable, even before generation ships |
| **Confidence indicators** | All findings need confidence ratings. Regulatory findings especially — Priya needs to know what to trust vs. what to investigate |

---

## Revision History

| Date | What Changed | Why | New Assumptions |
|------|--------------|-----|-----------------|
| 2026-03-21 | Initial creation (lightweight) | v2 persona — informs MVP architecture | A12, A13, A14 untested |

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Empathize Stream)
**Agent:** Isla (Discovery & Empathy Expert)
**Workflow:** lean-persona
