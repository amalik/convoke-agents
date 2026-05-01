# Migration Tooling — Format Conversion (v5/early-v6 → v6.3+)

This directory hosts the harness infrastructure that powers per-agent format conversions for **Initiative I97** (BMAD v6.3+ Source Format Adoption / Convoke 4.0 packaging-contract). The tooling is **function-named** rather than initiative-named so I98 (Gyre marketplace structural compliance gap) and I99 (Team Factory marketplace structural compliance gap) inherit it without renaming or re-derivation per **NFR18**.

## Scope

This directory contains build/test/CI tooling only — no runtime services, no operator-facing CLIs, no agent code. The harnesses are invoked by per-agent test suites during Epic 2 conversions (Stories 2.1–2.7) and productionized as CI gates during Epic 3.

**Out of scope here:** the BMB conversion tooling itself (`bmad-agent-builder` + `bmad-workflow-builder` "convert" mode). BMB is canonical per ADR-002; this directory's harnesses verify the *output* of BMB-driven conversions, plus apply the manual fixup contract.

## Architectural references

Read in this order:

| Doc | One-line summary |
|---|---|
| [ADR-002](../../../_bmad-output/planning-artifacts/adr/i97/adr-002-conversion-tooling-architecture.md) | BMB-canonical conversion + documented manual-fixup contract — drives `fixup-checklist.md` content |
| [ADR-003](../../../_bmad-output/planning-artifacts/adr/i97/adr-003-verification-harness-architecture.md) | Three separate harnesses (parity / Covenant / personality) with shared fixture library — drives this directory's structure |
| [ADR-004](../../../_bmad-output/planning-artifacts/adr/i97/adr-004-atomic-by-agent-commit-and-tooling-namespace.md) | Atomic-by-agent commit + this namespace's function-named rationale + NFR18 reusability |
| [ADR-005](../../../_bmad-output/planning-artifacts/adr/i97/adr-005-covenant-baseline-validity-policy.md) | Covenant baseline-validity per-Right policy (matrix authored at Story 4.1) |
| [Architecture document](../../../_bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md) | I97 architecture overview; § "Code Patterns" + § "Anti-Patterns" |

## Files

| File | Purpose | Consumers |
|---|---|---|
| `README.md` | This file. Overview + navigation. | Future devs onboarding to I97 / I98 / I99 |
| `fixup-checklist.md` | Per-agent fixup contract (4 categories) authored per ADR-002 | Per-agent PR reviewers in Epic 2 (Stories 2.1–2.7) |
| `fixtures/tmpDir-setup.js` | Shared utility for `os.tmpdir()` + `fs.mkdtempSync()` per `test-fixture-isolation` rule | All harnesses + per-agent test suites |
| `fixtures/isolated-install.js` | Shared utility for creating an isolated 4.x BMAD install in a tmpDir | All harnesses + per-agent test suites |
| `parity-harness.js` | Parity test runner — identical menu codes / workflow paths / output filenames pre vs post (FR13–15) | `tests/integration/vortex-parity.test.js` (authored at Story 3.2) + per-agent stories |
| `covenant-survival-harness.js` | Covenant audit re-runner — cell-level non-regression rule (FR17–20) per ADR-005 per-Right policy. **Per-Right matrix authored at Story 4.1**; until then, the harness expects the matrix as input and returns `{ status: 'no-matrix-supplied' }` if absent. | Story 4.2 (cell re-audit execution) + per-agent stories with Covenant cells |
| `personality-harness.js` | Personality verification harness (FR21–23) — consumes the calibrated rubric at [`convoke-spec-personality-preservation-rubric.md`](../../../_bmad-output/planning-artifacts/convoke-spec-personality-preservation-rubric.md) and existing fixtures under [`tests/migration/personality-preservation/fixtures/<agent>/`](../../../tests/migration/personality-preservation/fixtures/) | Per-agent stories (Stories 2.1–2.7) for baseline-vs-post comparison |

## Smoke verification commands

These commands are part of the **AC8 contract** of Story i97-1.1 (Migration Tooling Foundation Scaffolded). Re-run them after any change to confirm scaffolds still load cleanly:

```bash
# Each module imports cleanly (no SyntaxError, no MODULE_NOT_FOUND, no module-level throws)
cd <project-root>
for f in fixtures/tmpDir-setup.js fixtures/isolated-install.js parity-harness.js covenant-survival-harness.js personality-harness.js; do
  node -e "require('./scripts/migration/format-conversion/$f'); console.log('ok: $f')"
done

# Reference integrity script smoke
node scripts/audit/reference-integrity.js --help 2>&1 | head -1
# Default scope (covered by AC4): exits 0 against current 4.0 baseline.
node scripts/audit/reference-integrity.js
# Scoped to a specific Vortex slash-command wrapper (known-clean per AC8 amendment):
node scripts/audit/reference-integrity.js --paths .claude/skills/bmad-agent-bme-contextualization-expert/
# NOTE: invoking with --paths .claude/ scopes to the WIDER tree which contains
# pre-existing drift in WDS skill bundles + bmad-document-project templates;
# expect non-zero exit on the wider scope. Filed as separate Bug Lane intake
# candidate; not in I97 scope. See deferred-work.md.
```

## How the fixup checklist is consumed

Per ADR-002, every per-agent conversion PR (Epic 2 Stories 2.1–2.7) runs the BMB tooling and then applies [`fixup-checklist.md`](./fixup-checklist.md) before merge. The checklist captures the four categories of post-BMB drift: **persona preservation**, **hardcoded error-string preservation** (Operator Covenant fail-loud signal per OC-R3), **capability menu code preservation**, **workflow file path preservation per FR12**. Reviewers cite the specific category in PR comments rather than generic "improve UX" notes.

The checklist is **reusable for I98 / I99** — section structure is migration-general; only specific menu-code lists are agent-specific (handled by the per-agent PR template body, not this checklist).

## Project-context.md rules that apply to all code in this directory

- [`no-process-cwd-in-libs`](../../../project-context.md) — every export accepts `projectRoot` as a parameter; no `process.cwd()` in lib code
- [`test-fixture-isolation`](../../../project-context.md) — all tests pass `{ cwd: tmpDir }`; bare `runScript()` calls forbidden
- [`mechanical-research-enumeration`](../../../project-context.md) — reference-integrity uses `grep -r` / `glob`, never eyeballing
- [`derive-counts-from-source`](../../../project-context.md) — never hardcode "7 agents"; derive from registry / manifest
- [`lint-passes-before-review`](../../../project-context.md) — `npm run lint` exits 0 with zero warnings on touched files before `review`
- [`code-review-convergence`](../../../project-context.md) — Round 1 mandatory; Round 2 only on HIGH; max Round 3
