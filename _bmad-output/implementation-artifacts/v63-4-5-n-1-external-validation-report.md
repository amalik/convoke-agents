---
initiative: convoke
artifact_type: external-validation-report
release_target: 4.0.0
validator_handle: validator-01
session_date: '2026-08-15'
validation_outcome: REVIEW
created: '2026-08-15'
signoff_by: amalik
---

# Story 4.5 — N=1 External Validation Report

Satisfies AC3. Source: [`v63-4-5-session-log.md`](v63-4-5-session-log.md). Protocol: [`v63-4-5-recruitment-protocol.md`](v63-4-5-recruitment-protocol.md).

---

## Validator profile

Anonymised per AC1 PII discretion — identity is not recorded in this repository. A **fellow consultant**, one of the recruitment-pool categories named in Decision 1, running macOS with prerequisites already in place, upgrading an **existing Convoke 3.3.0** project.

**Expert in both BMAD and Convoke.** This is a deviation from Decision 1's stated preference and is treated as a limitation on the result, not a footnote — see *Evidence statement* below.

---

## Session timeline

| Milestone | Note |
|---|---|
| Start | `npx -p convoke-agents@rc convoke-update` on an existing 3.3.0 project |
| Migration | `3.3.x-to-4.0.0` applied, backup written, installation validated |
| Post-upgrade | Two non-blocking warnings surfaced |
| Verification | Ran the printed `npx -p convoke-agents@4.0.0-rc.5 convoke-doctor` |
| End | ~2 minutes total; **zero operator interventions** |

Output matched the operator's `moonshot-2` run exactly.

---

## Issue triage (Decision 3)

| Severity | Description | Ship-impact recommendation |
|---|---|---|
| **CONCERN** | Two non-blocking warnings (`BMAD core not detected`, `BMM dependencies: registry present`) appear on a **healthy** install. The validator — an expert — read them as evidence that something was wrong. One of the two carries a label (`registry present`) that contradicts its own message (`…not found`). | **Ship + defer.** Non-blocking and does not impede the upgrade. Route to the Fast Lane: (a) suppress or reword `BMAD core not detected` when BMAD absence is expected rather than anomalous; (b) fix the `BMM dependencies` label so it does not assert the opposite of its finding. |
| — | No BLOCKER-tier findings. Explicitly checked per Decision 3, including the mandatory security category: no credential exposure in output, no injection surface, no unencrypted sensitive storage. | Ship unblocked from the BLOCKER perspective. |
| **OBSERVATION** | The upgrade completed unassisted in ~2 minutes from an existing 3.3.0 install, with no confusion about the next step. | No action. Retrospective input (Story 5B.2). |
| **OBSERVATION** | Version-pinned guidance rendered correctly on an independent machine, and the validator followed the printed command verbatim rather than substituting a tag — the exact behaviour that exposed BUG-16. | No action. Records third-party confirmation of the BUG-16 fix. |

---

## In their own words

> *"If everything is fine, I shouldn't have warning messages"*

The weight of this line comes from its source. A newcomer saying it would be a preference; an expert saying it means the warning surface has stopped carrying information. Non-blocking warnings that a knowledgeable user reads as failure are worse than silence, because they train people to ignore the channel that will eventually carry something that matters.

---

## Operator ship decision (Decision 5)

**Ship.** `validation_outcome: REVIEW` — zero BLOCKERs, one CONCERN.

Rationale: the CONCERN is about warning *hygiene*, not upgrade *correctness*. The migration completed, the installation validated, `convoke-doctor` reported no hard failures, and the validator needed no help. FR40 asks whether an external user can complete the upgrade and report no issues; on the BLOCKER reading that Decision 5 pins, they did.

The CONCERN is deferred to the backlog tagged `deferred-from-v4.0` per OP-2 rather than fixed pre-ship, because reworking the warning surface touches `preflight-soft-warn` — a rule with its own deliberate fail-soft contract — and is not a change to make under release pressure on the strength of a single data point.

---

## M17 + FR40 evidence statement

**M17** — an N=1 external, non-maintainer validator ran `convoke-update` end to end **on their own machine** and reported no blocking issues. The session was live and observed, and this record plus the session log are the release-record evidence. **Satisfied.**

**FR40** — external real-world upgrade experience captured before release, with issues triaged and a ship decision recorded. **Satisfied.**

**Stated limitation.** The validator is an expert user of BMAD and Convoke. Decision 1 does not require familiarity and warns that expert validators bias the test toward the maintainer baseline. This result therefore establishes that **the upgrade mechanics work on an independent machine** — the FR40 target — but does **not** establish that the experience is navigable by a newcomer: the discovery path, warning interpretation, and error recovery were never exercised. The two-minute duration follows from that expertise.

N=1 is a floor, not a ceiling (Decision 1). A second validator with no prior Convoke exposure would materially strengthen this and remains open as a non-blocking follow-up.
