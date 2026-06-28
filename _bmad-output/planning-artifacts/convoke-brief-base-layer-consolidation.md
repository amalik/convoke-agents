# Initiative Brief: Base-Layer Consolidation

**Status:** proposed initiative · **Timing:** AFTER 4.0 ship (touches 15+ files; not release-path) · **Source:** [`docs/codebase-audit-2026-06-27.md`](../../docs/codebase-audit-2026-06-27.md) — conception findings #17, #18, #19, #41, #42 · **Lane:** Initiative (pending triage RICE)

## Thesis

Convoke grew subsystem-by-subsystem (initiative-by-initiative) and never consolidated a **base/kernel layer**. The result is **multiple sources of truth for things that must agree** — the structural debt behind a recurring class of bug (including the audit's HIGH-1: a wrong primitive worked around at 10+ call-sites). One deliberate consolidation pays this down and prevents recurrence.

## The duplication (audit findings)

| # | Source-of-truth violation | Spread |
|---|---|---|
| #17 | Agent roster + name-map | 3 copies — `agent-registry.js` (canonical), `export-engine.js:175`, `classify-skills.js:97` |
| #19 | Install-layout paths (`_bmad/bme/_vortex/config.yaml`, `_bmad-output` root) | Hardcoded in 10+ files across subsystems |
| #18 | Frontmatter parsing | `scripts/lib/frontmatter.js` exists but ~15 files re-roll `^---` regex; **two YAML libs** (`yaml` + `js-yaml`) in parallel |
| #41 | Kernel primitives (`findProjectRoot`, `getPackageVersion`, `compareVersions`, …) misplaced inside `update/lib/utils.js` | Every subsystem reaches *up* into the update feature-subsystem for base utils |
| #42 | Package self-location | Fragile `../../../` chains, no `getPackageRoot()` helper |

## The move

Establish `scripts/lib/` as the **kernel/base layer** and route everyone through it:
1. **`scripts/lib/paths.js`** — derivations (`vortexConfigPath`, `outputDir`, `backupsDir`, `getPackageRoot`, …); retire inlined path literals.
2. **Relocate kernel primitives** from `update/lib/utils.js` to the base layer so subsystems depend *down*, not *up* into `update/`.
3. **Finish the in-flight `frontmatter.js` adoption** (already mid-rollout — coordinate, don't duplicate) and **standardize on one YAML library**, retiring the redundant one.
4. **Derive the roster** in portability from `agent-registry` (`Object.fromEntries(AGENTS.map(...))`); tag registry entries with stream to derive Vortex/Gyre sets.

## Why post-4.0

15+ files, cross-subsystem moves, real regression surface. Doing it between now and ship adds churn in front of a release. It is debt-paydown, not a blocker. **Sequence after 4.0; coordinate with the in-flight frontmatter rollout so #18 isn't done twice.**

## Guardrails (project-context rules this initiative must honor)

- `no-hardcoded-versions`, `no-process-cwd-in-libs` — the relocated kernel must keep these invariants (the primitives are *why* the rules exist).
- `derive-counts-from-source`, `shared-test-constants` — roster/path derivations replace magic literals; tests import shared constants.
- `mechanical-research-enumeration` — enumerate every call-site of each duplicated symbol via grep before refactoring (the audit's spread counts are the starting evidence, not the final set).

## Open coordination

- **Overlaps v4.1 cadence work:** `paths.js` + `config-loader` internals (see [[project_reserved_components]] / OQ-1) touch the same base layer the v4.1 E4 cadence reader will use. Sequence so consolidation lands a clean base for v4.1 to build on, not a conflicting one.
- **Relationship to `frontmatter.js`:** that consolidation is already moving (#18 is WIP) — this initiative absorbs/finishes it rather than restarting it.

## Next step

Run backlog triage to score (RICE) and place in the Initiative Lane; then PRD/arch via the normal BMAD flow when it qualifies for a sprint.
