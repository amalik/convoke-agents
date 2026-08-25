---
initiative: convoke
artifact_type: epic
created: 2026-08-25T00:00:00.000Z
schema_version: 1
status: active
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md
  - _bmad-output/implementation-artifacts/gen-1-1-extract-generated-artifact-writes-behind-a-deliberate-path.md
  - scripts/update/lib/refresh-installation.js
  - scripts/audit/install-scope-check.js
  - project-context.md
---

# gen — Generated-Artifact Writes

## Overview

**One story. The epic wrapper exists because `sprint-status.yaml` tracks stories under epics, not
because the work needs decomposition.** Written 2026-08-25 after Round 3 of the gen-1.1 review found
that `gen-epic-1` had been `in-progress` on the board with no artifact behind it — `grep -rln
"gen-epic-1" _bmad-output/` returned only `sprint-status.yaml`. Three review rounds missed it.

If a second story is ever added here, this document earns its keep. Until then it is a placeholder
that says so honestly, which is better than a board entry pointing at nothing.

## Spine

*A file the repository tracks should change when someone decides to change it, not as a side effect
of running the tests.*

`refreshInstallation` regenerates `_bmad/_config/agent-manifest.csv` unconditionally. Six live test
sites call it against `PACKAGE_ROOT`, so `npm test` rewrites a tracked file. Today the rewrite is
byte-identical — the manifest is in sync with the registry — which is exactly why nobody has noticed
and why the naive verification of a fix keeps passing on the broken code.

## Scope

**In:** the `agent-manifest.csv` write at `refresh-installation.js:792`, the deliberate regeneration
path that must exist before that write can be guarded, and the scope-checker bookkeeping both
require.

**Out:**
- The taxonomy write. `mergeTaxonomy` short-circuits on a steady-state merge and writes nothing —
  asserted by `tests/unit/taxonomy-merger.test.js` and confirmed by mtime. T54 originally named it;
  the claim was withdrawn 2026-08-24.
- A CI gate on manifest-vs-registry drift. Deferred deliberately, and the guard strengthens the case
  for it: once the write is guarded, drift becomes invisible to the two suites that read the real
  manifest.
- `bootstrapTaxonomy` consolidation.

## Stories

| Story | Status | Summary |
|---|---|---|
| **gen-1.1** — Route the agent-manifest write through a deliberate path | ready-for-dev | Extract generation into one module, add a CLI entry, then guard the refresh-side write. 10 ACs, 9 tasks. |

There is no story 1.2. If the deferred CI drift gate is ever taken up, it belongs here as 1.2 rather
than in the Fast Lane.

## The decision this epic implements

Recorded in **T54**, 2026-08-24, by the operator: *"extract generation into a deliberate path
(`npm run generate:manifest`) with `refreshInstallation` as a second caller, then guard the
refresh-side writes — one copy, two callers, same shape that worked for `downgrade-guard.sh`."*

An earlier draft of gen-1.1 forbade the guard half of that decision on reasoning that holds only for
a guard *without* a command. It is safe *with* one: the command supplies the regeneration the guard
removes. Corrected 2026-08-25.

## Constraints any implementation must satisfy

Each was found by review, not by design, and each has broken a draft of this work:

1. **The write-op snapshot is a publish gate.** `install-scope-check.js:93` pins `expected: 11` for
   `refresh-installation.js`. Extraction drops it to 10, and the checker runs inside
   `agent-surface-parity` (`ci.yml:155`), which is in `publish.needs` (`:452`). The first draft's AC7
   forbade editing the checker, making the story unimplementable.
2. **The checker has no untracked-file assertion.** It inspects only its `TRACKED` array, so moving
   the write to a new module also moves it out of the safety net unless the module is added.
3. **Generation is target-tree-dependent, not registry-derived.** Schema detection, non-bme row
   preservation, and the Vortex and Gyre exclusion filters all read the target tree.
4. **The naive verification passes on the broken code.** Three separate attempts — an md5 compare,
   then `git diff --exit-code` after a command run — were all tautologies. gen-1.1's AC1 is now a
   committed script that perturbs before it asserts.
5. **The entry ships.** `files` includes `"scripts/"` and the tarball carries 355 `_bmad` entries, so
   `findProjectRoot` resolves *inside* an installed package. The guard must discriminate on a
   development checkout — `tests/` ships zero entries — not on package root.

## Review history

Unusually heavy for one story, recorded so the cost is visible rather than repeated:

| Round | Findings |
|---|---|
| Draft (2026-08-24) | ~9 HIGH; returned to backlog. Premise wrong: two writes, "only generator", registry-derived. |
| R1 (2026-08-25) | 3 HIGH: an AC that could not fail; an AC set with no legal execution context; the story forbade the operator's own decision. |
| R2 | 3 HIGH: the contradiction had been relocated, not closed; the author's own correction was wrong in both directions. |
| R3 | 2 HIGH: the tautology relocated a second time; the refusal guard never fired where the risk is. Restructured per `code-review-convergence` `project-context.md:167` rather than patched a third time. |

The facts were stable from the rewrite onward. What kept failing was the verification design.

## Related

- **T54** (Fast Lane) — the corrected analysis this epic implements
- **T50** — guarded the Vortex `config.yaml` stamp; the precedent whose *shape* does not transfer here
- `scripts/ci/downgrade-guard.sh` — the one-copy-two-callers pattern
