---
initiative: convoke
artifact_type: protocol
qualifier: v63-4-4-drift-snapshot-protocol
created: '2026-04-26'
schema_version: 1
epic: v63-epic-4
---

# PF1 Drift Snapshot — Operator Protocol

**Tool:** [`scripts/audit/drift-snapshot.js`](../../scripts/audit/drift-snapshot.js) (Story 4.4 deliverable).
**Purpose:** produce side-by-side pre/post migration drift artifact for retrospective review (FR39 + NFR22 + NFR32). NOT a release-blocking gate — see [Story 4.3 release record](v63-4-3-release-record-4.0.md) for the M9 PF1 gate.

## When to run

At release time, **after** Story 4.3 Task 5 (post-migration recordings captured) AND **before** Story 4.3 Task 7 (release record sign-off). The drift snapshot is a complement to the gate verdict, not a replacement: the gate (Story 4.3) decides ship/no-ship; the snapshot (Story 4.4) gives the operator a human-reviewable surface for unexpected behavioral changes that the gate's coarse PASS/INVESTIGATE/FAIL verdict can't surface.

## How to run

### Default (3-skill subset Emma + John + Winston)

```bash
node scripts/audit/drift-snapshot.js \
  --date 2026-XX-XX \
  --output _bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-2026-XX-XX.md
```

**MANDATORY: pass explicit `--date` flag** per [Decision 4 LL-1 V-pass](v63-4-4-create-drift-snapshot-workflow.md#acceptance-criteria) — defaulting to today is convenient but breaks NFR32 if the operator runs the snapshot twice across UTC midnight (frontmatter `created` differs silently). Test 11 verifies this silent-failure path is detectable; the protocol mandates explicit `--date` to avoid hitting it.

### 5-agent expansion (all PF1 agents)

```bash
node scripts/audit/drift-snapshot.js \
  --skills emma,john,winston,carson,murat \
  --date 2026-XX-XX \
  --output _bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-all5-2026-XX-XX.md
```

### Non-PF1 skill ad-hoc pair mode (FR39 broader scope)

For capturing drift on a non-PF1 skill (e.g., `bmad-enhance-initiatives-backlog` per FR39's first cited example):

1. **Manually capture pre-migration output** from convoke 3.x sandbox: invoke `/bmad-enhance-initiatives-backlog`; paste agent's response into a file with 4 sections delimited by digit-only headers `## Prompt 1` / `## Prompt 2` / `## Prompt 3` / `## Prompt 4`. Save as `_bmad-output/pf1-baselines/bmad-enhance-initiatives-backlog-baseline.md`.
2. **Validate file passes Story 4.2 parser** (HEADER FORMAT CONTRACT — digit-only `## Prompt N`, no descriptions; per Story 4.2 H1 + Story 4.3 CM-6):
   ```bash
   node -e "const b=require('./scripts/audit/pf1-validation-battery'); const fs=require('fs'); console.log(Object.keys(b.parseRecording(fs.readFileSync('_bmad-output/pf1-baselines/bmad-enhance-initiatives-backlog-baseline.md','utf8'))));"
   ```
   Expected output: `[ 'Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4' ]`. If you get a parser error, fix headers before proceeding.
3. **Repeat steps 1–2 for post-migration** in 4.0 sandbox; save as `_bmad-output/pf1-post-migration/bmad-enhance-initiatives-backlog-post.md`.
4. **Invoke ad-hoc pair mode**:
   ```bash
   node scripts/audit/drift-snapshot.js \
     --input-pre _bmad-output/pf1-baselines/bmad-enhance-initiatives-backlog-baseline.md \
     --input-post _bmad-output/pf1-post-migration/bmad-enhance-initiatives-backlog-post.md \
     --date 2026-XX-XX \
     --output _bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-bmad-enhance-initiatives-backlog-2026-XX-XX.md
   ```

Operator may chain multiple ad-hoc invocations to cover all FR39 examples (Vortex stream, PRD draft, etc.).

## Where the artifact lives

`_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-<date>.md`. Operator-committed alongside Story 4.3 release record. **Path-safety:** the script refuses output paths outside the project root (per AC5 + `path-safety-for-destructive-ops` rule); always pass paths under `_bmad-output/`.

## What to do with output

- **Review side-by-side** for unexpected behavioral changes per skill, per prompt.
- **Surface concerns** in [Epic 4 retrospective](epic-v63-4-retro-XXXX.md) or [Story 5B.2 anti-pattern registry](v63-5b-2-retrospective-and-anti-pattern-registry.md). Drift observations may surface anti-patterns for `convoke-anti-patterns.md`.
- **NOT a release-blocking gate.** Story 4.3's PF1 gate decides ship/no-ship; this snapshot is observational. Even significant drift here doesn't auto-block release IF the gate verdict is PASS (per arch:362-368 boundary semantics).

## Determinism caveat (NFR32)

Byte-identical re-run requires:
- Same `--date` arg (passed explicitly — see "MANDATORY" callout above).
- Same input files (recordings byte-identical).
- Same `--skills` arg (or same `--input-pre/--input-post` for ad-hoc).
- Stable Node version (LCS algorithm uses no `Math.random`, no `Date.now()` in body).

If recordings are amended (Story 4.3 re-record after INVESTIGATE/FAIL gate), regenerate the snapshot. Test 11 in `tests/lib/drift-snapshot.test.js` proves the silent default-date failure path is detectable; following the explicit-`--date` protocol above avoids it.

## Cross-reference

The Story 4.3 release record (`v63-4-3-release-record-4.0.md`) SHOULD cite the snapshot artifact path under "Retrospective observations" section to maintain traceability between the gate verdict and the human-reviewable drift evidence.
