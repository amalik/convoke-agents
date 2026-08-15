---
initiative: convoke
artifact_type: session-log
release_target: 4.0.0
validator_handle: validator-01
session_date: '2026-08-15'
created: '2026-08-15'
---

# Story 4.5 — N=1 External Validation Session Log

Satisfies AC2. Live observed session, operator screen-sharing with the validator throughout.

**Identity is deliberately not recorded here.** `validator-01` is an opaque handle; the mapping to the real person is held outside the repository per operator instruction, since `_bmad-output/` is tracked and published. Relationship — fellow consultant — is retained because Decision 1 names it as a recruitment-pool category, not as an identifier.

---

## Setup

| | |
|---|---|
| **Candidate under test** | `4.0.0-rc.5`, installed via the `rc` dist-tag |
| **Starting state** | Existing Convoke **3.3.0** install (Decision 4: operator records which) |
| **Platform** | macOS, all prerequisites already present |
| **Environment capture** | Not recorded — nothing environment-flavoured surfaced, so the optional `validator_environment` key is deliberately omitted per AC2 |
| **Mode** | Live, screen shared, operator observing |
| **Duration** | ~2 minutes end to end |
| **Operator interventions** | **None.** The >5-minute stuck threshold was never approached |

---

## Timeline

| Milestone | Note |
|---|---|
| Start | Validator ran `npx -p convoke-agents@rc convoke-update` against their existing 3.3.0 project |
| Migration | `3.3.x-to-4.0.0` applied; backup written; installation validated |
| Post-upgrade check | Two warnings surfaced (below) |
| Verification | Validator ran the command the tool printed — `npx -p convoke-agents@4.0.0-rc.5 convoke-doctor` |
| Completion | No hard failures. Validator reported the run as fine |

Output matched the operator's own `moonshot-2` run **exactly**, including both warnings and the version-pinned `convoke-doctor` invocation.

---

## Observations

1. **The upgrade completed unassisted in ~2 minutes**, from an existing 3.3.0 install, with no operator intervention at any point.

2. **The version-pinned guidance rendered correctly on an independent machine.** The validator's screen showed `npx -p convoke-agents@4.0.0-rc.5 convoke-doctor` — third-party confirmation of the BUG-16 fix outside the two operator-controlled environments it was developed on.

3. **The validator followed the printed instruction verbatim rather than substituting a tag.** This is the behaviour that exposed BUG-16 in the first place, and it now leads somewhere self-consistent.

4. **Both expected warnings appeared**, matching the protocol's pre-recorded expectations:
   - `⚠ BMAD core not detected (package not in node_modules)` — `preflight-soft-warn` behaving as specified
   - `⚠ BMM dependencies: registry present — bmm-dependencies.csv not found`

5. **The validator raised the warnings as a problem**, unprompted. Verbatim:

   > *"If everything is fine, I shouldn't have warning messages"*

   Notably this came from someone who already knows the tool. An expert reading non-blocking warnings on a healthy install as a signal that something is wrong is the strongest available evidence that the warning surface is miscalibrated, not merely noisy.

6. **No errors, no crashes, no confusion about what to do next.** Zero BLOCKER-tier findings under Decision 3, including the mandatory security category (no credential exposure, no injection surface, no unencrypted sensitive storage observed).

---

## Limitation on the strength of this result

Recorded so the release record is not read as claiming more than it earned.

**The validator is an expert user of both BMAD and Convoke.** Decision 1 explicitly does *not* require prior familiarity, and states the reason: *"recruiting expert-tier validators biases the test toward maintainer-baseline."* This session therefore validates that **the upgrade mechanics work on an independent machine** — genuinely the FR40 target — but does **not** test the discovery path: whether a newcomer can find the right command, interpret the warnings, or recover from a mistake. The two-minute duration is a direct consequence of that expertise, not evidence that the experience is self-explanatory.

**N=1 is a floor, not a ceiling** (Decision 1). A second validator without prior Convoke exposure would materially strengthen the evidence and is the obvious follow-up if one becomes available. It is not a ship blocker.
