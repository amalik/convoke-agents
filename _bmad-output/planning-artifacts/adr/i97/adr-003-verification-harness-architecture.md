---
initiative: convoke
artifact_type: adr
qualifier: i97-verification-harness-architecture
created: '2026-04-28'
status: accepted
schema_version: 1
related_initiative: I97
related_decision: D3
supersedes: none
---

# ADR-003: Verification Harness Architecture

**Status:** Accepted (2026-04-28)
**Initiative:** I97 (BMAD v6.3+ source format adoption)
**Related Decision:** D3 from architecture document
**Related Requirements:** FR13-23; NFR1-3; NFR4; NFR7; PRD Outcomes 2, 3, 4

## Context

I97's Behavioral Verification capability cluster (PRD FR13-23, ~11 FRs) requires verifying three different qualities of converted agents:

1. **Behavioral parity** (FR13-15) — identical menu codes preserved, identical workflow file paths invoked, identical output filenames produced. Mechanical assertion.
2. **Covenant survival** (FR17-20) — baseline Operator Covenant audit cells (notably A26 Vortex HC-cluster, 2026-04-26) must remain valid; cell-level non-regression rule. Rubric-driven assertion against existing Compliance Checklist tooling.
3. **Personality preservation** (FR21-23) — agent personality preserved across format change. Hybrid: fixed-prompt Q&A samples (mechanical comparison) + operator-ranked unscripted multi-turn engagement scenarios (judgment).

Each verification method has different fixture needs but shares a common fixture pattern: isolated install in `tmpDir` per `test-fixture-isolation` rule (NFR4).

Three resolution options:

- A) One unified harness with three modes
- B) Three separate harnesses with shared fixture pattern
- C) Three separate harnesses, no shared infrastructure

## Decision

**Three separate harnesses with shared fixture pattern.** Three distinct harness components with their own verification logic, sharing a common fixture utility library at `scripts/migration/format-conversion/fixtures/`.

| Harness | Source File | Verification Method | Fixture Pattern |
|---------|-------------|---------------------|-----------------|
| Parity test suite | `scripts/migration/format-conversion/parity-harness.js` | Mechanical: assert identical menu codes + workflow paths + output filenames | `tmpDir` setup, isolated install, run pre/post-migration agents on shared prompts |
| Covenant survival audit | `scripts/migration/format-conversion/covenant-survival-harness.js` | Rubric-driven: re-run baseline audit cells, cell-level non-regression | `tmpDir` setup, isolated install, run Compliance Checklist tooling per converted agent |
| Personality preservation | `scripts/migration/format-conversion/personality-harness.js` | Hybrid: fixed-prompt Q&A + operator-ranked unscripted multi-turn | `tmpDir` setup, isolated install, conversation logs in `tests/personality/` per agent |

The shared fixture utility library (`scripts/migration/format-conversion/fixtures/`) implements the `test-fixture-isolation` pattern:

- `tmpDir-setup.js` — creates temp directory in `before()` hook, cleans up in `after()` hook
- `isolated-install.js` — installs Convoke into the temp directory at a specified version (pre or post-migration)
- Reusable across all three harnesses; per `test-fixture-isolation` rule, no harness invokes `runScript()` without `{ cwd: tmpDir }`

Each harness is independently runnable for debugging; CI runs all three as gates per FR16, FR18, FR23.

## Consequences

**Positive:**

- **Each harness specialized for its verification method.** Mechanical assertion logic doesn't muddy rubric-driven Covenant logic doesn't muddy operator-judgment personality logic. Each harness is debuggable in isolation.
- **Shared fixture pattern** satisfies NFR4 (test-fixture-isolation) without code duplication. DRY honored.
- **Independent runnability** — operator can run any one harness against a single agent during debugging without invoking the full verification suite.
- **CI gate composition** — each harness is its own CI gate. Test failures localize to verification method, not to a unified-harness implementation detail.
- **Future I98/I99 reusability** — function-named namespace (`format-conversion/`) per ADR-004 means same harnesses run against Gyre/Team Factory migrations. NFR18 honored.

**Negative / Trade-offs:**

- **Three files instead of one.** Slight increase in file count vs unified harness. Acceptable: separation-of-concerns benefit outweighs.
- **Shared fixture library coordination.** If fixture utility library evolves (e.g., new isolation primitive added), all three harnesses must coordinate consumption. Mitigation: fixture library is versioned within repo; harnesses pin to specific exports.
- **Verification timing** — three harnesses sequentially in CI takes longer than one unified harness might. Mitigation: harnesses can run in parallel CI jobs (independent test suites).

## Alternatives Considered

**Alternative A: One unified harness with three modes**

- **Rejected because:** Three verification methods are *kind*-different (mechanical / rubric / judgment). A unified harness would obscure what each method does and make debugging conflated. Conceptual clarity is high-value for migration tooling that must be reused across I98/I99.

**Alternative C: Three separate harnesses, no shared infrastructure**

- **Rejected because:** Each harness needs `tmpDir` fixture setup + isolated install logic; duplicating that logic three times violates DRY and makes `test-fixture-isolation` rule (NFR4) harder to enforce uniformly. The fixture pattern is genuinely shared even if the verification logic isn't.

## Cross-References

- Architecture document: `_bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md` Section "D3" + Section "Test Architecture Additions"
- PRD: `_bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md` FR13-23, NFR1-3, NFR7
- Project context rule: `test-fixture-isolation` in `project-context.md`
- Sibling ADR: ADR-002 (BMB output is the input to verification harnesses); ADR-005 (per-Right Covenant policy is consumed by Covenant survival harness)
