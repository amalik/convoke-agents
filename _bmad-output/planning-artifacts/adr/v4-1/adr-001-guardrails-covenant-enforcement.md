---
initiative: convoke
artifact_type: adr
qualifier: v4-1-guardrails-covenant-enforcement
created: '2026-06-20'
status: accepted
schema_version: 1
related_initiative: v4.1 (Upstream BMAD v6.4-v6.8 absorption)
related_decision: option-f (extends convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25)
related_epic: E7
supersedes: none
qualifier_role: winston-architect
signoff_by: amalik
---

# ADR-001: Activation Guardrails as Operator Covenant Enforcement Substrate

**Status:** Accepted (2026-06-20)
**Initiative:** Convoke v4.1 (Upstream BMAD v6.4-v6.8 absorption)
**Related Decision:** Option F (2026-05-25). This ADR extends the Option F scope from 6 epics to 7 by adding E7.
**Related Requirements:** Operator Covenant OC-R5 (Right to pause); OC-R7 (Right to pacing).

## Context

BMAD upstream **v6.8.0 (2026-05-25)** shipped "strengthened activation guardrails across 23+ skills." This release landed the same day as the Option F decision and was **not** analyzed in the [v6.3 re-sequencing & v4.1 catch-up note](../../convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25.md), whose upstream-impact appendix stops at "Web Bundles v1.0.0 (today)." This ADR closes that gap for the guardrails dimension specifically.

### What the v6.8 guardrails actually are

Per the v6.8.0 changelog, the problem solved was: *"LLM agents were short-circuiting activation sequences (`INCLUDE → READ → RUN → CHECK → FILTER → CD`) by guessing variables instead of executing in order, silently skipping append steps and `on_complete` hooks."*

The mechanism is **runtime enforcement of execution fidelity**:
- Explicit prepend/append step naming so insertion-point steps cannot be silently dropped.
- **Mandatory confirmation gates** — "each step must run and be validated before the next one activates."
- Enforcement scope: all BMM planning + execution skills, all persona agents (analyst, tech-writer, pm, ux-designer, architect, dev), and new skills.

The guardrails answer the question: *did the agent actually execute every step, in order, without hallucinating intermediate values?*

### The apparent conflict, and why it is not one

The surface worry was that upstream guardrails compete with the Operator Covenant — Convoke's headline differentiator — and erode it to table stakes. Mechanism-level analysis shows the two systems operate on **orthogonal axes**:

| | **v6.8 Activation Guardrails** | **Operator Covenant** |
|---|---|---|
| Axis | agent ↔ workflow-author | workflow ↔ operator (human) |
| Answers | Did the agent run every step in order? | Does the workflow treat the human as the resolver? |
| Nature | Runtime **enforcement** | Design **contract** |
| Substance | Step sequencing, no-skip, no variable-guessing | Default, full universe, rationale, completeness, pause, next action, pacing |

The guardrails say nothing about defaults, scope visibility, rationale, or pacing — the operator-experience substance the Covenant is built on. Conversely, the Covenant has always **assumed** the agent executes its steps but provides **no mechanism to enforce that assumption**.

### The single reinforcing intersection: OC-R5

There is exactly one point of contact. **OC-R5 (Right to pause)** requires the skill to "halt and wait — no auto-advance, no silent default-selection." Today R5 is delivered by **convention**: the author writes `ALWAYS halt and wait for user input` markers and the agent is *trusted* to honor them.

The precise failure v6.8 guardrails kill — agents short-circuiting the activation sequence and silently skipping steps — **is the exact mechanism by which an agent would blow past a Covenant pause marker and never reach the "present default and wait" step.** Guardrails therefore make OC-R5 *binding* where it was previously *conventional*.

**The Covenant is the contract; v6.8 guardrails are the enforcement layer that makes the contract binding.**

## Decision

**Adopt the v6.8 activation-guardrail pattern as the runtime enforcement substrate for the Operator Covenant — graduating OC-R5 (pause) from author-discipline convention to enforced mechanism — and record this as Epic E7 of the v4.1 catch-up Initiative.**

Positioning is sharpened, not weakened: BMAD guardrails ensure the *agent* runs the steps; the Covenant ensures those steps *serve the operator*. Upstream converging on agent-obedience validates the substrate the Covenant has been quietly assuming; it does not contest the operator-experience axis the Covenant owns.

### The load-bearing spike question (E7 gate)

Adoption is gated on resolving one binary question about BMAD's confirmation gates:

- **If agent-internal** (the agent confirms *to itself* that it ran the step before advancing) → pure upside. Adopt the activation-sequence pattern wholesale; it directly enforces OC-R5 at zero operator cost.
- **If operator-facing** (each micro-step prompts the human to confirm) → adopting it verbatim would flood the operator with `INCLUDE?` / `READ?` / `RUN?` confirmation prompts, **violating OC-R7 (pacing, 3-concept budget) and the Covenant's "one interaction round" definition** — the very anti-pattern the Covenant exists to prevent. In this case Convoke adopts the *enforcement intent* (the agent must not skip steps) but **wraps it** so confirmations stay agent-side and never surface as operator prompts.

The spike MUST resolve this before any Convoke skill adopts the pattern. A wrong adoption here would have the Covenant's own enforcement layer violating two of its rights.

## Consequences

**Positive:**
- **OC-R5 becomes enforced, not conventional.** The Covenant's weakest link (trusting the agent to honor pause markers) gets a runtime backstop.
- **Differentiator sharpens.** The pitch becomes cleaner: "guardrails make the agent obey; the Covenant makes the workflow accountable to you." Upstream validates Convoke's substrate without contesting its axis.
- **Convergent maintenance.** Adopting upstream's enforcement pattern (rather than inventing a parallel Convoke mechanism) keeps Convoke aligned with BMAD's activation model, reducing future drift cost — consistent with the Option F rationale of structurally addressing N-cadence.
- **Covenant audit gains teeth.** A future audit can verify OC-R5 mechanically (was the gate present?) rather than only by reading for `halt and wait` markers.

**Negative / Trade-offs:**
- **Spike required before adoption.** The agent-internal-vs-operator-facing question is binary but load-bearing; a wrong call self-violates the Covenant. This is a gate, not a formality.
- **Retrofit surface.** Graduating OC-R5 to enforced touches the activation sequence of existing `_bmad/bme/` skills. Scope is bounded by the skills that already carry pause markers, but it is non-trivial.
- **Coupling to upstream activation model.** Adopting BMAD's `INCLUDE → READ → RUN → CHECK → FILTER → CD` sequence ties Convoke's enforcement to upstream's activation conventions; a future upstream change to that sequence becomes a Convoke maintenance event. Accepted: the alternative (a parallel Convoke-only enforcement mechanism) costs more and diverges further.

## Out of scope

- **`bmad-spec` (five-field kernel: Problem / Capabilities / Constraints / Non-goals / Success signal).** A planning-artifact pattern unrelated to guardrails; folded into existing **E5** (pattern-evaluation epic alongside `bmad-investigate` / `.decision-log`), not this ADR.
- **Two-file UX contract (DESIGN.md / EXPERIENCE.md).** WDS-adjacent; WDS is a parallel BMAD extension, not a Convoke module. Awareness-only.

## Change Log

- **2026-06-20** — Authored by Winston (Architect) per operator (Amalik) "ADR + E7" selection during a CA session triggered by "look at the latest BMAD Method releases and see how it impacts Convoke." Captures the orthogonal-axes finding, the OC-R5 enforcement opportunity, and the agent-internal-vs-operator-facing spike gate. Status: accepted. Sign-off: amalik 2026-06-20.