---
initiative: convoke
artifact_type: implementation-readiness-memo
qualifier: e7-decoupling
created: '2026-06-21'
status: complete
schema_version: 1
related_initiative: v4.1 (Upstream BMAD v6.4-v6.8 absorption)
related_decision: option-f
related_adr: adr/v4-1/adr-001-guardrails-covenant-enforcement.md
verdict: 4.0-unaffected
signoff_by: amalik
qualifier_role: winston-architect
---

# Implementation Readiness Memo — E7 / v6.8 Decoupling from 4.0 Ship

**Scope:** Confirm that adding **E7** (activation-guardrails-as-Covenant-enforcement, per [ADR-001](adr/v4-1/adr-001-guardrails-covenant-enforcement.md)) and the broader v6.8.0 absorption does **not** alter the implementation readiness of the in-flight **Convoke 4.0** ship.

**This is not a full IR sweep.** The 6-step PRD→Architecture→Epics→Stories traceability workflow validates a complete planning chain heading into implementation. v4.1 does not yet have that chain (decision note + one ADR; 7 epics named, zero story decomposition), so a full sweep would emit "missing document" at every step. This memo answers only the decoupling question that was actually asked.

## Verdict

**4.0 ship readiness is UNAFFECTED by E7 / v6.8 absorption.** The existing v6.3-adoption IR report ([convoke-report-implementation-readiness-bmad-v6.3-adoption.md](convoke-report-implementation-readiness-bmad-v6.3-adoption.md), verdict **READY (with conditions)**) remains valid as-is. No re-run required.

## Evidence

| Check | Finding | Basis |
|-------|---------|-------|
| **Does E7 gate the 4.0 ship?** | No. v4.1 (incl. E7) is explicitly post-4.0 and deferred per Option F. | Option F note §"v4.1 catch-up Initiative scope" + §"v4.0 ship-track" — v4.1 starts *after* 4.0 tags. |
| **Does E7 modify any v6.3-adoption artifact?** | No. E7 lives entirely in the v4.1 scope table + ADR-001 + Appendix C. The v6.3 PRD (sharded, 10 files), architecture doc, and 29-story epic file are untouched. | File diff: only `convoke-note-...-catchup` + new `adr/v4-1/adr-001` were edited 2026-06-20. |
| **Does v6.8 introduce a forced change into 4.0?** | No. v6.8's substantive items (activation guardrails → E7; `bmad-spec` → E5; two-file UX → WDS awareness-only) are all optional/deferred. None is a v6.3-baseline-breaking change. | Appendix C of the Option F note. |
| **Is the prior v6.3 IR verdict still sound?** | Yes. Its READY-with-conditions verdict was scoped to the v6.3 chain, which E7 did not touch. | Existing IR report `### Overall Readiness Status → READY (with conditions)`. |

## One sequencing constraint to carry forward (not a 4.0 blocker)

E7's eventual work — *"bounded retrofit of existing `_bmad/bme/` skill activation sequences"* — touches the **same surface** as two other deferred/in-flight v6.3 items:

- **Epic 1B (Amelia persona consolidation)** — deferred to the **4.0.1 patch**.
- **Story 4.3 (PF1 validation cycle)** — currently **stalled / in-progress**; a 4.0 ship-track blocker in its own right.

**Constraint:** E7's retrofit must be sequenced **after Epic 1B lands** (4.0.1), to avoid double-touching skill activation sequences (rework + merge churn). This is a v4.1-planning input, not a 4.0 readiness condition — recorded here so it isn't rediscovered when v4.1 kicks off.

**Also:** E7 carries an unresolved **binary spike gate** (agent-internal vs operator-facing confirmation gates — see ADR-001). That spike is a v4.1-entry precondition for E7, independent of 4.0.

## Next gate

v4.1 reaches the **real** IR gate only after the v4.1 Initiative produces a PRD + epics-and-stories breakdown (where E7 becomes concrete stories with ACs). Until then, v4.1 is pre-planning and IR does not apply. The 4.0 ship proceeds on its existing track (resume Story 4.3 → 4.5 → 5B.3 → tag/publish) unchanged.

## Change Log

- **2026-06-21** — Authored by Winston (Architect, PM/SM lens) per operator (Amalik) "lightweight E7 decoupling memo" selection during an IR (`bmad-check-implementation-readiness`) session. Confirms 4.0 readiness unaffected by E7/v6.8; records the E7-after-1B sequencing constraint. Status: complete. Sign-off: amalik 2026-06-21.
