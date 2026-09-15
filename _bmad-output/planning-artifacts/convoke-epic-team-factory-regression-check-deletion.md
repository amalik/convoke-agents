---
initiative: convoke
artifact_type: epic
qualifier: team-factory-regression-check-deletion
created: '2026-09-15'
status: active
schema_version: 1
related_initiative: 'P14 Team Factory / Loom'
qualifier_role: operator-authored
---

# Epic: Team Factory — delete the regression check that cannot fail (`tfr-epic-2`)

**Created 2026-09-15 by operator decision**, as a one-story, incident-driven mini-epic following the
`tfr-epic-1` precedent. `tfr-epic-1` is complete and is not reopened: this project records forward.

## Scope — deletion only

One story, `tfr-2-1`. It deletes the Team Factory's `VORTEX-REGRESSION` check and everything that exists
only to feed it, and closes four Fast Lane rows by that deletion:

| Row | What it is | Why deletion closes it |
|---|---|---|
| `T171` | the check passes, but nothing `add-team` writes can make it fail | the check is gone |
| `T172` | it compares failing checks by name only | nothing compares |
| `T173` | `validator.js` caches its registry bindings in one process | nothing re-reads `validator.js` |
| `T174` | `validateExtension`/`validateSkillExtension` call it without a baseline, so they can never pass | they no longer call it — **but Round 1 found the extension write path can change what the check read, so `T174` stays open, rescoped to the unbuilt add-agent work (operator decision 2026-09-15)** |

**Why delete rather than widen.** `verification-must-be-falsifiable`: a check that cannot fail is no
evidence, and worse than none because it reads like proof. `code-review-convergence`'s over-build clause:
when a component keeps leaking, prefer deletion to another rewrite. All four residue rows trace to this one
check, and the only regression it could have caught — a broken `agent-registry.js` — is already caught by
`REGISTRY-REGRESSION` and by the writer's own verify-and-rollback.

**This epic reverses part of `T128`'s fix** (the differential), deliberately. `T128`'s closing note in the
completed-work archive gets a dated addendum; it is not rewritten.

## Not a repair programme

Operator-agreed 2026-09-15: after this deletion, **stop working the `loom` backlog** until the factory's
first real use. Three consecutive repairs (`tf-2-12`, `tf-2-13`, `tfr-1-1`) each filed more rows than they
closed. The remaining rows stay parked behind `tfr-epic-1`'s stated gate — revisit when a generated team
survives — and the first real team is Forge's job (`project_baseline_before_expansion`). This epic takes
no other row, including rows it touches in passing.

**Definition of done:** `VORTEX-REGRESSION` no longer exists in the Team Factory; every validator that
emitted it can return `valid: true` on a correct fixture; `T171`–`T174` are closed in §2.5.
