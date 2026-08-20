# Story 1.1: Retire the badges pipeline

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Convoke maintainer**,
I want the badges pipeline removed from the repository and from the publish path,
so that no release is ever blocked by a generated file that no document consumes.

## Acceptance Criteria

1. **AC1 — The publish hook is gone.** `package.json` no longer declares `prepublishOnly`, `badges:check` or `badges`. The `prepublishOnly` key is *removed*, not left empty.
2. **AC2 — The pipeline is deleted.** `scripts/generate-badges-json.js`, `.github/workflows/badges.yml` and `docs/badges.json` are removed in one commit.
3. **AC3 — `knip` stays green.** The `scripts/generate-badges-json.js` entry is removed from `knip.json` in the same commit as the file deletion.
4. **AC4 — The two stale references are corrected, not deleted.** `project-context.md`'s `verification-pipefail` scar table and `.github/workflows/ci.yml`'s `prepublishOnly` note are updated so neither cites a script that no longer exists, while both remain valid as history.
5. **AC5 — Nothing else regresses.** `npm test` and `npm run lint` succeed, and `npm pack --dry-run` reports **the same file count as before the change** — `docs/` is not in `package.json` `files[]`, so `docs/badges.json` never shipped. Falsify this rather than confirm it: if the count moves, stop and find out why.
6. **AC6 — Three backlog items close.** T40, I108 and CR-README-D03 are closed against this story, each row moved below its lane's live block. The lane-order check from `project-context.md` §`backlog-write-discipline` is run and **its output pasted into the commit Description** — an unrecorded check is an unfalsifiable claim.
7. **AC7 — The rehearsal strategy is stated, not assumed (NFR2).** Removing `prepublishOnly` is a publish-path change, and the publish job runs only on a `refs/tags/v*` push. The story records that its rehearsal is **deferred to Story 1.6's composed run**, and does not claim `npm publish --dry-run` as evidence — whether `--dry-run` fires lifecycle scripts is version-dependent and was never verified. What IS locally verifiable: the three keys are absent from `package.json`, and no file in the tree invokes them.
8. **AC8 — FR6, FR7 and FR8 are not implemented.** They were RETIRED by ADR-001, not deferred. Do not add the `agents: []` collapse guard, the manifest floor, or committed guard tests. If the implementation finds itself hardening the generator, it has already gone wrong — the generator is being deleted.

## Tasks / Subtasks

- [ ] **Task 1 — Remove the publish hook and the npm scripts (AC: 1)**
  - [ ] Delete the `badges`, `badges:check` and `prepublishOnly` keys from `package.json`'s `scripts` block (lines 53–55 today)
  - [ ] Confirm `postinstall` is now the only lifecycle hook remaining
  - [ ] Verify: `python3 -c "import json;print(json.load(open('package.json'))['scripts'])"` shows none of the three keys

- [ ] **Task 2 — Delete the pipeline (AC: 2, 3)**
  - [ ] `git rm scripts/generate-badges-json.js .github/workflows/badges.yml docs/badges.json`
  - [ ] Remove the `"scripts/generate-badges-json.js"` entry from `knip.json` (line 21 today)
  - [ ] Verify: `npx knip` reports no error about a missing entry file

- [ ] **Task 3 — Correct the two stale references (AC: 4)**
  - [ ] `project-context.md` — the `verification-pipefail` rule's evidence table. **TWO of its four rows become historical, not one:** row 1 (`npm run badges:check | tail -8; echo $?`) and row 4 (the generator mutation harness that died on `Cannot find module 'yaml'`). Annotate the table as a historical record of four real incidents; **do not delete the rows** — they are the rule's entire justification
  - [ ] `.github/workflows/ci.yml` (~line 220) — the `fresh-install` job's note reads *"`prepublishOnly` (the one that exists) does NOT fire on pack."* Correct the parenthetical. Note the reasoning gets **safer**, not weaker: with `prepublishOnly` gone, `postinstall` is the only hook and the job's no-`npm ci` justification still holds
  - [ ] Verify: `grep -rn "badges:check\|prepublishOnly" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=_bmad-output` returns only intentional historical mentions

- [ ] **Task 4 — Regression gates (AC: 5, 7)**
  - [ ] Record the packed file count BEFORE any change: `npm pack --dry-run --json | python3 -c "import json,sys;print(json.load(sys.stdin)[0]['entryCount'])"`
  - [ ] `set -o pipefail; npm test 2>&1 | tail -5; echo "EXIT: ${PIPESTATUS[0]}"` (zsh: `${pipestatus[0]}`)
  - [ ] `npm run lint` exits 0 with zero warnings in the touched files
  - [ ] Re-run the pack count AFTER. It MUST be unchanged — `docs/` is not in `files[]`. A change means something else moved; stop and diagnose
  - [ ] Confirm the three keys are gone and nothing invokes them: `grep -rn "badges:check\|npm run badges\|prepublishOnly" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=_bmad-output`
  - [ ] **Do NOT cite `npm publish --dry-run` as proof the hook is gone.** Whether it fires lifecycle scripts is version-dependent and unverified here. Per AC7, the live evidence comes from Story 1.6's rehearsal

- [ ] **Task 5 — Close the backlog rows (AC: 6)**
  - [ ] **T40** (Fast Lane, 9.5) → closed; row moved below the live block
  - [ ] **I108** (Fast Lane, 1.4) → closed; the `[skip ci]` auto-commit-to-main path disappears with `badges.yml`
  - [ ] **CR-README-D03** (`deferred-work.md:957`) → marked resolved
  - [ ] Run the lane-order check from `project-context.md` §`backlog-write-discipline` (the `python3 - <<'EOF'` block in that section — copy it verbatim; it is escape-aware and start-anchored, and a hand-rolled substitute will produce false positives on `P21`)
  - [ ] Paste its output (`LANE ORDER: OK`, or the violations) into the commit Description. An unrecorded check is an unfalsifiable claim
  - [ ] **No line-level staging on the backlog** — file-level or nothing. `3a3de195` deleted T35 and T39 that way

## Dev Notes

### What this story is, in one line

`docs/badges.json` has no consumer. The gate that protects it has, since T39, been structurally
incapable of failing on anything real. Delete both.

### Files being modified — current state, change, and what must be preserved

| File | Current state | Change |
|---|---|---|
| `package.json` | `scripts` declares `badges`, `badges:check`, `prepublishOnly` (lines 53–55). Only two lifecycle hooks exist: `postinstall` and `prepublishOnly` | Remove all three keys |
| `scripts/generate-badges-json.js` | 91 lines. Reads five `_bmad/bme/*/config.yaml` files plus `skill-manifest.csv`, writes `docs/badges.json`. Carries guards added by `3a3de195` (throws on non-list value, missing config, header-only manifest) | Delete |
| `.github/workflows/badges.yml` | 48 lines. Fires on push to `main` for `_bmad/bme/_*/config.yaml`, `skill-manifest.csv`, `generate-badges-json.js`. Auto-commits `docs/badges.json` with `[skip ci]`, bypassing every CI gate (**I108**) | Delete |
| `docs/badges.json` | `{teams:2, agents:12, workflows:33, skills:106}`. `docs/` is not in `package.json` `files[]`, so this never shipped | Delete |
| `knip.json:21` | Lists the generator as an entry file | Remove the entry |
| `project-context.md` (~355–362) | `verification-pipefail` scar table, four rows | Annotate rows 1 and 4 as historical — **do not delete** |
| `.github/workflows/ci.yml` (~220) | `fresh-install` job comment citing `prepublishOnly` "(the one that exists)" | Correct the parenthetical |

### 🚩 The false lead that will cost you an hour

`grep -rln "badges" tests/` returns **two files**:

```
tests/lib/portability-catalog-generator.test.js
tests/lib/portability-full-pipeline.test.js
```

**Neither is related.** They assert *"tier badges"* — the "Ready to use" / "Framework only" markers
in generated portability-catalog output. Verified: `grep -n "badges.json\|generate-badges"` across
both returns nothing. **Do not touch them.**

**Zero tests reference this pipeline.** Also verified clean: `.c8rc.json` (no mention),
`ci.yml` (no badges job — `badges.yml` is a separate workflow file), `scripts/docs-audit.js`,
`docs/README.md`.

### Why this is safe — the evidence chain

1. **No consumer.** The I156 README rewrite (`303f160d`) culled the four dynamic `shields.io`
   `dynamic/json` badges that read `docs/badges.json`. `README.md:13-14` now carries two *static*
   shields (`npm/v`, license) that touch nothing. Repo-wide grep finds only the generator,
   `badges.yml`, `knip.json` and `package.json`.
2. **No latent consumer.** The same rewrite deliberately carried **no counts at all** — team cards
   list agents by name so a stale integer cannot disagree with reality.
3. **The gate cannot fail meaningfully.** T39 (`6d6578e2`) removed the `generated` timestamp, which
   was the only field that could differ; counts are regenerated from the source data that produced
   them.
4. **Every failure it produced was false.** Four ritual timestamp commits: `8de471c3`, `f58b15a8`,
   `b4c095db`, `a2e32cbd`.

### Cross-story dependency

**Story 1.6 rehearses a publish job that this story modified.** Stories 1.2–1.5 also edit that job;
1.6 is the only story that exercises the composition. This story's removal of `prepublishOnly` is
part of what 1.6 proves. Nothing here blocks on a later story — but the evidence that this change is
correct arrives in 1.6, not here (AC7).

### Disproved risks — do not re-raise, and do not "helpfully" fix

- **Deleting the generator does NOT orphan the `yaml` dependency.** Five other consumers:
  `scripts/update/lib/refresh-installation.js`, `config-loader.js`, `config-merger.js`,
  `taxonomy-merger.js`, `scripts/lib/frontmatter.js`. `yaml@^2.8.3` stays in `dependencies`.
- **All cited line numbers verified 2026-08-20** by `sed`: `package.json:53-55`, `knip.json:21`,
  `ci.yml:220-221`. Re-check at implementation time per `spec-verify-referenced-files`; the file has
  moved under this project before.

### Reversibility

91 lines plus a 48-line workflow, both recoverable from git. If shields are wanted for FY2027
credibility they are cheaper to rebuild against the then-current schema — and D9's original cull
reason still stands: the first screenful depended on shields.io uptime, repository visibility, `main`
not moving, and a generated file staying generated.

### FR6–FR8 are retired, not deferred

ADR-001 retires them with the pipeline. Do not implement the guard hardening (`agents: []` collapse,
manifest floor, committed guard tests) — those FRs no longer exist. T41 drops from 8 findings to 5.

### Project Structure Notes

- Deletions only in `scripts/`, `.github/workflows/` and `docs/`. No `_bmad/bme/` namespace is
  touched, so the **Covenant compliance checklist is N/A** for this story
  (`project-context.md` §`covenant-compliance-for-convoke-skills`).
- **Namespace decision:** N/A — no new skill, workflow or agent is authored.
- `derive-counts-from-source` is *preserved*, not violated: the rule says a count that must appear is
  derived from source at runtime. No shipped document carries a count today, so there is nothing to
  derive.

### Testing standards

- No new tests. This is a deletion whose correctness is proved by the existing suite staying green
  and by the absence of any reference to the deleted surface.
- `verification-pipefail` applies to every piped verification command in Task 4 — use
  `set -o pipefail` or `${PIPESTATUS[0]}` / `${pipestatus[0]}`. The scar table this story is
  annotating contains the incident that produced that rule, and its first row is this exact command.

### References

- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-001-retire-badges-pipeline.md] — accepted 2026-08-19, option (a); full options analysis and consequences
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story 1.1] — acceptance criteria origin
- [Source: _bmad-output/implementation-artifacts/deferred-work.md:957] — CR-README-D03, the standing finding this closes
- [Source: project-context.md#backlog-write-discipline] — lane-order check required for Task 5
- [Source: project-context.md#verification-pipefail] — the rule whose scar table Task 3 annotates
- [Source: project-context.md#commit-preparation] — a commit plan is required, and Round 1 fires when it is prepared

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
