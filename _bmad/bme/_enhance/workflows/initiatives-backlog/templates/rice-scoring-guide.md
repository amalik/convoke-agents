# RICE Scoring Guide

Reference document for consistent RICE scoring across all initiatives backlog operations. Loaded by the workflow during Triage (Gate 2 scoring), Review (rescoring), and Create (initial scoring) modes.

---

## RICE Factor Definitions

| Factor | Scale | Description |
|--------|-------|-------------|
| **Reach** | 1-10 | How many users/quarter will this affect? (10 = all users, 1 = edge case) |
| **Impact** | 0.25 - 3 | Per-user impact (3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal) |
| **Confidence** | 20-100% | How sure are we about reach and impact estimates? |
| **Effort** | 1-10 | Relative effort in story points (1 = trivial, 10 = multi-epic) |
| **Score** | calculated | (Reach x Impact x Confidence) / Effort |

---

## Guided Scoring Questions

Use these questions to guide scoring for each factor. The goal is genuine strategic reflection, not mechanical calculation.

### Reach (1-10)

"How many users per quarter will this affect?"

| Score | Meaning |
|-------|---------|
| 10 | All users — every project that installs Convoke encounters this |
| 7-9 | Most users — affects a common workflow or visible surface |
| 4-6 | Some users — affects a specific use case or user segment |
| 2-3 | Few users — niche scenario or advanced feature |
| 1 | Edge case — rare configuration or exceptional circumstance |

### Impact (0.25-3)

"What's the per-user impact when they encounter this?"

| Score | Meaning | Signal |
|-------|---------|--------|
| 3 | Massive | Unblocks a capability that didn't exist before; users would pay for this |
| 2 | High | Significant improvement to an existing workflow; saves meaningful time |
| 1 | Medium | Noticeable improvement; users appreciate it but can work around it |
| 0.5 | Low | Minor quality-of-life improvement; polish |
| 0.25 | Minimal | Cosmetic or hygienic; almost invisible to users |

### Confidence (20-100%)

"How confident are we in the Reach and Impact estimates?"

| Score | Meaning | Basis |
|-------|---------|-------|
| 100% | Measured data | Direct observation, usage metrics, user reports |
| 80% | Strong evidence | Multiple corroborating signals, team consensus |
| 60% | Reasonable estimate | Single data point or strong analogy to similar work |
| 50% | Educated guess | Logical reasoning without direct evidence |
| 40% | Informed speculation | Based on domain knowledge, no project-specific data |
| 20% | Pure speculation | Gut feeling, novel territory, no precedent |

### Effort (1-10)

"Relative effort in story points?"

| Score | Meaning |
|-------|---------|
| 1 | Trivial — single file change, under 30 minutes |
| 2-3 | Small — a few files, a focused session |
| 4-5 | Medium — multi-file, requires design thought, 1-2 stories |
| 6-7 | Large — multi-story, cross-cutting concerns |
| 8-9 | Very large — full epic, significant architecture work |
| 10 | Multi-epic — major initiative spanning multiple sprints |

---

## Composite Formula & Sort Order

**Formula:** Score = (Reach x Impact x Confidence) / Effort

**Sort order:** Descending by composite score.

**Tiebreak rules:**
1. Higher Confidence first (more certain items surface above speculative ones)
2. Newer insertion order first (recently added items break remaining ties)

---

## Calibration Examples

These examples are drawn from the existing Convoke backlog to anchor scoring consistency. Study the reasoning, not just the numbers — the goal is to understand *why* items scored as they did.

### Low Tier (~0.2-0.5)

**A4: "Fix temp dir prefix inconsistency"** — R:1 I:0.25 C:100% E:1 = **0.3**
- Reach 1: Only affects internal tooling, no user visibility
- Impact 0.25: Cosmetic inconsistency with zero functional effect
- Confidence 100%: Known, observable, deterministic
- Effort 1: Single string change
- *Lesson: High confidence and low effort don't rescue low reach and minimal impact*

**A2: "Create .agent.yaml source files"** — R:2 I:0.5 C:60% E:4 = **0.2**
- Reach 2: Only affects module authors using the BMAD authoring pipeline
- Impact 0.5: Enables standard tooling but workarounds exist
- Confidence 60%: Unclear how many authors will use the pipeline
- Effort 4: Multiple files across multiple agents
- *Lesson: Moderate effort with uncertain reach pushes score very low*

### Medium Tier (~1.0-2.0)

**U4: "Test upgrade-path step file cleanup"** — R:3 I:1 C:90% E:2 = **1.4**
- Reach 3: Only users upgrading from specific older versions
- Impact 1: Prevents a confusing stale-file scenario
- Confidence 90%: Known issue from observed upgrade path
- Effort 2: Focused integration test
- *Lesson: High confidence on a real (but narrow) problem scores solidly mid-range*

**I1: "NPM_TOKEN secret for CI publish"** — R:8 I:2 C:90% E:8 = **1.8**
- Reach 8: Every release depends on this automation
- Impact 2: Eliminates manual publish step, significant time savings
- Confidence 90%: Well-understood CI pattern
- Effort 8: Full CI pipeline setup, secrets management, testing
- *Lesson: High reach and impact can be offset by high effort — the formula balances ambition against cost*

### High Tier (~2.5+)

**P4: "Enhance module"** — R:8 I:3 C:70% E:6 = **2.8**
- Reach 8: New capability for every BMAD user with Convoke
- Impact 3: Creates an entirely new value layer (multiplicative, not additive)
- Confidence 70%: Architecture validated but user adoption uncertain
- Effort 6: Multi-epic initiative with installer integration
- *Lesson: Massive impact with broad reach justifies investment even at moderate confidence*

**S4: "Skills migration & module compliance"** — R:10 I:2 C:90% E:5 = **3.6**
- Reach 10: Affects every user — skills activation was broken
- Impact 2: Restores core functionality and modernizes format
- Confidence 90%: Known breakage with clear fix path
- Effort 5: Multi-file migration with schema changes
- *Lesson: Universal reach with a clear fix and high confidence produces the highest scores*

---

## Score Distribution Health Check

A healthy backlog has differentiated scores. If more than 3 items share the same composite score in the top 10 of the prioritized view, refine the distinguishing RICE components — typically Confidence or Impact have the most room for differentiation.

This is a quality signal, not a hard rule. Identical scores indicate either genuine parity (acceptable if rare) or insufficient scoring granularity (fix by re-examining the items with fresh eyes).

---

## Scoring Consistency Notes

- Scores in this backlog range from approximately 0.2 to 10.0. New scores should land within this range.
- Composite scores are rounded to one decimal place for display (e.g., 1.35 rounds to 1.4). This matches existing backlog convention and keeps the prioritized view scannable.
- When scoring a new item, mentally compare it to 2-3 existing items at similar scale. If your proposed score would rank it significantly above or below where it "feels" relative to those items, revisit the component scores.
- The Confidence factor is the most commonly under-scrutinized. Default to 50% (educated guess) when no direct evidence exists, not 80%.
