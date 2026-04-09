# Story 7.3: Validator/Refresh Contract Audit

Status: ready-for-dev

## Story

As a Convoke maintainer planning future bme submodules,
I want a documented audit of every flag-gated refresh path in `refresh-installation.js` and whether the corresponding validator (`validator.js`) and doctor (`convoke-doctor.js`) respect the same gate,
So that the next module I add doesn't inherit a latent contract gap like the Story 6.6 standalone-flag bug — closing I34 (rank #20 in backlog, RICE 2.4).

## Acceptance Criteria

1. **Given** the install pipeline currently contains 5 module wirings (Vortex, Gyre, Enhance, Artifacts, team-factory via `EXTRA_BME_AGENTS`) and an unknown number of flag-gated branches in [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) **When** the audit is performed **Then** the output is a single new document at `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-09.md` (NOTE: epic file references the 2026-04-08 dated path but the audit is being authored on 2026-04-09 — use today's date in the filename) and a forwarding link is added at the original 2026-04-08 path so the epic's references stay live.

2. **Given** the audit document is being authored **When** it lists each flag-gated branch **Then** every entry contains the following fields (in this order): (a) **Flag name** — the JS expression that gates the branch (e.g., `workflow.standalone === true`, `workflow.target_agent`, `!isSameRoot`, `EXTRA_BME_AGENTS` iteration, `enhanceConfig` truthiness, `artifactsConfig` truthiness, `gyreConfig` truthiness); (b) **File location** — `refresh-installation.js:LINE-LINE` markdown link; (c) **Refresh action** — what the gated branch does (copies files, generates wrappers, patches menus, stamps versions, etc.); (d) **Ungated branch action** — what happens when the gate is false (skip, throw, no-op, log-only); (e) **Validator counterpart** — file:line of the matching check in `validator.js` if any, OR "none"; (f) **Doctor counterpart** — file:line of the matching check in `convoke-doctor.js` if any, OR "none"; (g) **Verdict** — one of `SAFE` (validator/doctor respect the gate), `GAP` (a flag-gated refresh action has no validator/doctor mirror — latent future-trap), `N/A` (no validator/doctor check is conceptually needed — e.g., `isSameRoot` dev-mode skips), or `MIXED` (validator covers but doctor doesn't, or vice versa).

3. **Given** the audit identifies a `GAP` or `MIXED` entry **When** the maintainer reads the document **Then** the entry includes (a) a 5-15 line code snippet showing the recommended fix (typically a single new check appended to the corresponding `validateXxxModule` function or `convoke-doctor` per-module loop, following the append-only NFR1 from Epic 7), and (b) a 3-8 line **failure mode** description that describes the exact misuse pattern that would silently corrupt an install (e.g., "If a future operator removes `target_agent` from a workflow declaration but leaves the workflow in `_enhance/config.yaml`, refresh skips the menu patch but validator still passes — the operator sees a green install with a workflow that no slash command will ever invoke").

4. **Given** Story 7.2 introduced `checkModuleSkillWrappers` in `convoke-doctor.js` with **manifest-as-opt-in** semantics (workflows not in `_bmad/_config/skill-manifest.csv` are silently skipped) **When** the audit reviews the doctor **Then** it explicitly cross-references this function and lists, for each in-manifest workflow, whether the wrapper check covers it. The audit MUST also flag any **module pair** (e.g., `_artifacts` workflows that ARE in the manifest vs. `_artifacts` workflows that are NOT) where the wrapper-check coverage diverges from operator expectations, even if the divergence is currently zero (it documents the surface area for future change).

5. **Given** the audit catalogues at MINIMUM the following known flag-gated branches (this list is the dev's coverage floor — additional branches discovered during the audit MUST also be catalogued): **(F1)** `isSameRoot` dev-mode skip at [refresh-installation.js:38](scripts/update/lib/refresh-installation.js#L38) and its 13+ usage sites; **(F2)** `EXTRA_BME_AGENTS` submodule iteration at [refresh-installation.js:96-119](scripts/update/lib/refresh-installation.js#L96-L119); **(F3)** Enhance `workflow.target_agent` menu-patching loop at [refresh-installation.js:172-176](scripts/update/lib/refresh-installation.js#L172-L176); **(F4)** Artifacts `workflow.standalone === true` skill-wrapper-only loop at [refresh-installation.js:709-712](scripts/update/lib/refresh-installation.js#L709-L712); **(F5)** Gyre config-existence gate at [refresh-installation.js:343-359](scripts/update/lib/refresh-installation.js#L343-L359); **(F6)** Enhance config-existence gate at [refresh-installation.js:658-705](scripts/update/lib/refresh-installation.js#L658-L705); **(F7)** standalone bme agent skill-generation loop at [refresh-installation.js:632-657](scripts/update/lib/refresh-installation.js#L632-L657); **(F8)** Artifacts skill-wrapper generation gate at [refresh-installation.js:705-740](scripts/update/lib/refresh-installation.js#L705-L740). **When** the audit is complete **Then** every F-number from F1 through F8 has a matching entry in the audit table, AND any F-number discovered during the audit (F9, F10, …) is appended in the same format.

6. **Given** the audit is purely discovery work **When** Story 7.3 is marked for review **Then** the audit document exists, all F-entries are filled out, all GAPs have fix snippets + failure modes, and any GAP that the dev judges to be a **trivial 1-3 line patch** (single function, single file, no new imports, no test infrastructure changes) is fixed in this same story with an accompanying regression test. Any GAP requiring more than a trivial patch is **promoted to a follow-up story in the backlog with a fresh RICE score** and the audit entry links to it.

7. **Given** an `EXTRA_BME_AGENTS` submodule (e.g., team-factory) is added or removed **When** the audit reviews how `validator.js` validates standalone bme agents at [validator.js:208-225](scripts/update/lib/validator.js#L208-L225) **Then** the audit verifies whether the validator's check (which iterates `EXTRA_BME_AGENTS` and asserts each agent file exists) covers the same set as `refresh-installation.js`'s iteration at [refresh-installation.js:101-120](scripts/update/lib/refresh-installation.js#L101-L120). Any divergence (e.g., refresh copies files, validator only checks the registry array — what if the array is updated but the source files weren't created yet?) is documented as a GAP or N/A with reasoning.

8. **Given** the existing `validateEnhanceModule` function at [validator.js:374-490](scripts/update/lib/validator.js#L374-L490) handles `target_agent`, menu patches, and workflow declarations **When** the audit cross-references it with the Enhance branch in `refresh-installation.js` **Then** the audit explicitly states which fields the validator checks vs. which fields refresh-installation.js consumes, and flags any field consumed by refresh but not validated. (The Story 6.6 retro identified this exact pattern as the source of I34. Validate-by-example: does `validateEnhanceModule` check that `workflow.target_agent` resolves to a real file on disk? If yes → SAFE; if no → GAP with patch sketch.)

9. **Given** the existing `validateArtifactsModule` function at [validator.js:491-575](scripts/update/lib/validator.js#L491-L575) handles `workflow.standalone` filtering **When** the audit cross-references it with the Artifacts branch in `refresh-installation.js` **Then** the audit verifies whether the validator skips non-standalone workflows the same way refresh does. (Mirror the Story 6.6 fix pattern: refresh has `if (workflow.standalone !== true) { skip with msg; continue; }` — does the validator have the same skip? If validator iterates ALL workflows but checks for entry-point files that only exist on standalone workflows, that's a GAP.)

10. **Given** the audit identifies that `convoke-doctor.js`'s `checkModuleSkillWrappers` (introduced in Story 7.2) handles **only** modules whose workflows are in the skill-manifest **When** the audit considers Vortex, Gyre, and team-factory **Then** it documents whether those modules SHOULD have wrapper checks at all. The audit's verdict is binding: if the conclusion is "no wrapper checks needed for Vortex/Gyre/team-factory because their workflows are not standalone skills," that's an `N/A` entry with a 2-3 sentence rationale. If the conclusion is "team-factory's `bmad-team-factory-orchestrator` workflow IS a standalone skill and SHOULD be in the manifest," that's a `GAP` with a 1-line fix (add the row to skill-manifest.csv).

11. **Given** the dev runs `git diff` after Story 7.3 **When** comparing against the pre-story baseline **Then** the diff contains: (a) the new audit document, (b) the forwarding link at the 2026-04-08 path, (c) at most a handful of trivial 1-3 line patches to `validator.js`, `convoke-doctor.js`, or `_bmad/_config/skill-manifest.csv` if GAPs surfaced, (d) regression tests for each trivial patch under `tests/unit/`. **NFR1 (append-only):** if any patch touches an existing function in `validator.js` or `refresh-installation.js`, the patch MUST be a pure addition (new branch, new check, new line) — never a modification or deletion of existing logic. If the audit identifies a GAP that requires modifying existing logic, that GAP is promoted to a follow-up story (per AC #6).

12. **Given** all 5 stages of `npm run check` (lint, unit, integration, jest lib, coverage) **When** Story 7.3 is marked for review **Then** lint + unit + integration stages PASS. The pre-existing Jest lib + Coverage infrastructure issue documented in Story 7.1 (`npx jest tests/lib/` failures on files migrated to node:test) remains OUT of scope for Story 7.3 and is acceptable.

13. **Given** the Epic 7 review pattern established by Stories 7.1 and 7.2 (NFR3) **When** Story 7.3 is marked for review **Then** `bmad-code-review` is run with all 3 layers (Blind Hunter + Edge Case Hunter + Acceptance Auditor). **Note:** Story 7.3's review will be lighter than 7.1/7.2 because the primary deliverable is a markdown document, not a code change. Reviewers should focus on (a) audit completeness — are all F-entries present? (b) audit accuracy — does each entry's flag/file/line claim match the actual code? (c) GAP triage soundness — were any GAPs misclassified as N/A or vice versa? (d) any trivial patches that DID land — are they minimal, append-only, and tested?

14. **Given** the namespace audit rule from Epic 6 retro Action Item #2 **When** Story 7.3 creates new files **Then** the new audit document lives under `_bmad-output/planning-artifacts/` (a Convoke planning artifact, NOT under any `_bmad/{module}/` namespace), any new test files live under `tests/unit/`, and no new files are created under `_bmad/{module}/` or `.claude/skills/`. **Namespace decision:** ✅ verified — Story 7.3 only creates planning-artifact docs and (possibly) tests under `tests/unit/`.

15. **Given** the dev finishes the audit and applies any trivial patches **When** they re-run `node scripts/convoke-doctor.js` against the dev repo **Then** the doctor reports the same overall green/red state as before Story 7.3 (Story 7.3 should not introduce regressions in the doctor's existing checks; the version-consistency drift on `_enhance: 1.0.0`, `_gyre: 1.0.0`, `_artifacts: 1.0.0`, `_team-factory: 1.0.0` documented in Story 7.2 may continue to fail and remains out of scope).

## Tasks / Subtasks

- [ ] **Task 0: Read the prior art** (no AC, foundation step)
  - [ ] 0.1 Read [_bmad-output/planning-artifacts/epic-7-platform-debt.md](_bmad-output/planning-artifacts/epic-7-platform-debt.md) Story 7.3 section (FR4, NFR1, NFR3) end-to-end.
  - [ ] 0.2 Read [_bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md](_bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md) for the original I34 framing (Edge Case Hunter finding from Story 6.6 review).
  - [ ] 0.3 Read [_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md](_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md) Senior Developer Review section for the manifest-as-opt-in correction (relevant to AC #4 + AC #10).
  - [ ] 0.4 Read [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) **in full** (790 lines). Make a working list (in scratch notes, not in the audit yet) of every `if (...)` branch that gates a copy/write/patch action. Aim for a list of 8-15 branches; F1-F8 from AC #5 are the floor.
  - [ ] 0.5 Read [scripts/update/lib/validator.js](scripts/update/lib/validator.js) **in full** (750 lines). For each `validateXxxModule` function, make a scratch list of which fields it checks.
  - [ ] 0.6 Read [scripts/convoke-doctor.js](scripts/convoke-doctor.js) **in full** (672 lines). For each `checkModuleXxx` function, make a scratch list of which fields it checks.

- [ ] **Task 1: Build the audit table skeleton** (AC: #1, #2, #5)
  - [ ] 1.1 Create the new audit document at `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-09.md` with frontmatter:
    ```markdown
    # Validator / Refresh / Doctor Contract Audit

    **Date:** 2026-04-09
    **Story:** ag-7-3 (closes I34, RICE 2.4)
    **Audited files:**
    - `scripts/update/lib/refresh-installation.js` (790 lines)
    - `scripts/update/lib/validator.js` (750 lines)
    - `scripts/convoke-doctor.js` (672 lines)
    **Verdict legend:** SAFE = validator+doctor respect the same gate as refresh; GAP = refresh acts on a flag, validator/doctor doesn't check it (latent future-trap); N/A = no check needed; MIXED = validator OR doctor covers, but not both.
    ```
  - [ ] 1.2 Add a one-paragraph **Executive summary** placeholder (fill in after Task 4).
  - [ ] 1.3 Add a **Flag-gated branches catalogue** section with a markdown table whose columns match AC #2 fields (a)-(g): Flag name | refresh-installation.js loc | Refresh action | Ungated action | validator.js loc | convoke-doctor.js loc | Verdict.
  - [ ] 1.4 Pre-populate the table with placeholder rows for F1-F8 from AC #5 (just the flag name + refresh location columns; leave the rest empty for Task 2 to fill in).

- [ ] **Task 2: Fill in the F1-F8 baseline rows** (AC: #2, #5, #7, #8, #9)
  - [ ] 2.1 **F1 — `isSameRoot` dev-mode skip:** trace [refresh-installation.js:38](scripts/update/lib/refresh-installation.js#L38) and its 13+ usage sites. Refresh action = "skip file copies because dev repo IS the package source." Ungated action = "copy package source files into projectRoot." Validator counterpart = none (validator doesn't have an isSameRoot check — it always validates against projectRoot regardless). Doctor counterpart = none. Verdict = **N/A** (this is a dev-mode optimization, not a contract — validator/doctor SHOULD check projectRoot in both dev and prod modes, which they do).
  - [ ] 2.2 **F2 — `EXTRA_BME_AGENTS` submodule iteration:** trace [refresh-installation.js:96-119](scripts/update/lib/refresh-installation.js#L96-L119). Cross-reference [validator.js:208-225](scripts/update/lib/validator.js#L208-L225) (per AC #7). Verdict: SAFE if validator iterates the same array, GAP if there's any divergence in what's checked.
  - [ ] 2.3 **F3 — Enhance `workflow.target_agent`:** trace [refresh-installation.js:172-176](scripts/update/lib/refresh-installation.js#L172-L176). Cross-reference [validator.js:374-490](scripts/update/lib/validator.js#L374-L490) (per AC #8). Verify whether the validator checks (a) `target_agent` field presence — line 418 says yes, (b) the target file actually exists at `_bmad/{target_agent}` — line 444-449 says yes for menu-patch validation. Verdict: most likely SAFE; if any sub-field is unchecked → GAP with patch sketch.
  - [ ] 2.4 **F4 — Artifacts `workflow.standalone === true`:** trace [refresh-installation.js:709-712](scripts/update/lib/refresh-installation.js#L709-L712). Cross-reference [validator.js:491-575](scripts/update/lib/validator.js#L491-L575) (per AC #9). Specifically: refresh has `if (workflow.standalone !== true) { skip; continue; }` — does the validator have the same gate at line 549? Verdict should match the Story 6.6 fix outcome: SAFE post-6.6, but verify by running through a mental test case: "what if a non-standalone workflow lacks an entry-point file?" If validator would crash → GAP; if validator skips → SAFE.
  - [ ] 2.5 **F5 — Gyre config-existence gate:** trace [refresh-installation.js:343-359](scripts/update/lib/refresh-installation.js#L343-L359). Refresh action = copy `_gyre/config.yaml` and README. Validator counterpart = whatever Gyre validation exists in validator.js. Doctor counterpart = `discoverModules()` scans for `_bmad/bme/_gyre/config.yaml`. Verdict likely SAFE.
  - [ ] 2.6 **F6 — Enhance config-existence gate:** trace [refresh-installation.js:658-705](scripts/update/lib/refresh-installation.js#L658-L705). Refresh action = generate skill wrappers + menu patches. Validator counterpart = `validateEnhanceModule` (already cross-referenced in F3). Doctor counterpart = `checkModuleSkillWrappers` for in-manifest Enhance workflows + existing checkModuleConfig/Workflows for the rest. Verdict: likely SAFE post-Story-7.2.
  - [ ] 2.7 **F7 — standalone bme agent skill-generation loop:** trace [refresh-installation.js:632-657](scripts/update/lib/refresh-installation.js#L632-L657). Refresh action = generate `.claude/skills/bmad-agent-bme-{id}/` directories for each EXTRA_BME_AGENTS entry. Validator counterpart = validator.js:208-225 (AGAIN — same iteration). Doctor counterpart = does `convoke-doctor.js` check for these `.claude/skills/bmad-agent-bme-{id}/` directories anywhere? Search for `bmad-agent-bme-` in convoke-doctor.js. If absent → **GAP** (the doctor doesn't verify standalone bme agent wrappers; this is a likely follow-up story).
  - [ ] 2.8 **F8 — Artifacts skill-wrapper generation gate:** trace [refresh-installation.js:705-740](scripts/update/lib/refresh-installation.js#L705-L740). Refresh action = generate `.claude/skills/{workflow.name}/` for each `workflow.standalone === true`. Validator counterpart = `validateArtifactsModule` (cross-referenced in F4). Doctor counterpart = `checkModuleSkillWrappers` from Story 7.2. Verdict: SAFE post-Story-7.2 for in-manifest Artifacts workflows.

- [ ] **Task 3: Discover additional flag-gated branches and add them as F9, F10, …** (AC: #2, #5)
  - [ ] 3.1 Walk the entire `refresh-installation.js` file with the Task 0.4 scratch list as a guide. For every branch in the scratch list NOT already in F1-F8, add a new F-row to the audit table.
  - [ ] 3.2 For each new F-row, fill in all 7 columns (a)-(g). Use the same cross-reference protocol as Task 2.
  - [ ] 3.3 Stop when the catalogue is exhaustive (Task 0.4's scratch list is empty). Expected count: 8-15 total F-entries.

- [ ] **Task 4: Triage GAPs and apply trivial fixes** (AC: #3, #6, #11)
  - [ ] 4.1 List every F-row whose verdict is `GAP` or `MIXED` in a separate **Identified GAPs** section.
  - [ ] 4.2 For each GAP, write the **failure mode** description (3-8 lines, per AC #3). Use a concrete operator-action scenario, not abstract language.
  - [ ] 4.3 For each GAP, write the **recommended fix** code snippet (5-15 lines, per AC #3). The snippet must be append-only (per NFR1) — show exactly what new lines would be added to validator.js or convoke-doctor.js.
  - [ ] 4.4 For each GAP, decide: is this a **trivial patch** (single function, single file, no new imports, no test infrastructure changes, ≤3 added lines)? If yes → tag it `[FIX-IN-7.3]`. If no → tag it `[PROMOTE-TO-BACKLOG]`.
  - [ ] 4.5 For every `[FIX-IN-7.3]` GAP, apply the patch to the appropriate file. Add a regression test under `tests/unit/` that fails before the patch and passes after. Update the audit entry to `Verdict: GAP→FIXED in Story 7.3` with a link to the test file.
  - [ ] 4.6 For every `[PROMOTE-TO-BACKLOG]` GAP, append a new candidate row to [_bmad-output/planning-artifacts/initiatives-backlog.md](_bmad-output/planning-artifacts/initiatives-backlog.md) under the next available I-number (continuing from I42), with a fresh RICE score, source = "ag-7-3 contract audit". The audit entry links to the new I-number.

- [ ] **Task 5: Cross-reference Story 7.2's `checkModuleSkillWrappers`** (AC: #4, #10)
  - [ ] 5.1 In a new section **Story 7.2 wrapper-check coverage**, list every workflow in `_bmad/_config/skill-manifest.csv` and verify whether `checkModuleSkillWrappers` would catch a missing wrapper for it. (As of 2026-04-09 the manifest has 3 in-manifest workflows: `bmad-migrate-artifacts`, `bmad-portfolio-status`, `bmad-enhance-initiatives-backlog`. Verify by re-reading the manifest at audit time — the count may have grown.)
  - [ ] 5.2 For each Convoke module (Vortex, Gyre, Enhance, Artifacts, team-factory), state explicitly: "wrapper checks SHOULD/SHOULD NOT apply because…" with 2-3 sentences of rationale. Per AC #10, the audit's verdict is binding.
  - [ ] 5.3 If any module's verdict is "SHOULD apply but currently doesn't," that's a GAP — handle it via Task 4 (`[FIX-IN-7.3]` if trivial, else `[PROMOTE-TO-BACKLOG]`).

- [ ] **Task 6: Write the executive summary and finalize the audit doc** (AC: #1, #6)
  - [ ] 6.1 Fill in the Task 1.2 placeholder Executive summary. Lead with the headline: "N flag-gated branches catalogued. M SAFE / X GAP / Y N/A / Z MIXED. K GAPs fixed in Story 7.3. P GAPs promoted to backlog as I43-I…"
  - [ ] 6.2 Add a **Methodology** section (1 short paragraph) describing the per-file walk + cross-reference protocol used.
  - [ ] 6.3 Add a **Limitations** section listing what the audit did NOT cover (e.g., "the audit does not verify migration history correctness — that's covered by Story 7.1's tests; the audit does not check `convoke-version.js` because that's a CLI helper, not part of the install pipeline").
  - [ ] 6.4 Add a **Next steps** section linking to (a) any newly-filed backlog items, (b) Story 7.4 (orphan skill-wrapper cleanup) which depends on this audit per the epic's note at line 277-278.
  - [ ] 6.5 Add the audit doc to the planning-artifacts index. If `_bmad-output/planning-artifacts/README.md` exists, append a link there. If not, just leave the doc free-standing.

- [ ] **Task 7: Forwarding link at the epic-referenced path** (AC: #1)
  - [ ] 7.1 Create `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` with a single line: `Moved to [audit-validator-refresh-contracts-2026-04-09.md](audit-validator-refresh-contracts-2026-04-09.md) (date corrected from epic-7 spec to actual authoring date).`
  - [ ] 7.2 Verify the epic file's reference at [_bmad-output/planning-artifacts/epic-7-platform-debt.md:177](_bmad-output/planning-artifacts/epic-7-platform-debt.md#L177) still resolves through the forwarding link.

- [ ] **Task 8: Validate against checklist + run npm check** (AC: #11, #12, #14)
  - [ ] 8.1 Run `npm test` and verify lint + unit + integration stages pass. If any `[FIX-IN-7.3]` patches landed in Task 4.5, verify the new regression tests pass. The Jest lib + Coverage infrastructure issue from Story 7.1 is acceptable per AC #12.
  - [ ] 8.2 Run `git diff --stat` and verify the file list matches AC #11: new audit doc, forwarding stub, possibly small validator.js / convoke-doctor.js / skill-manifest.csv patches, possibly new tests under `tests/unit/`. NO modifications to existing function bodies in `validator.js` or `refresh-installation.js`.
  - [ ] 8.3 Run `node scripts/convoke-doctor.js` and verify no new failures vs. the pre-Story-7.3 baseline (per AC #15).
  - [ ] 8.4 Run `./checklist.md` validation against this story file (the bmad-create-story workflow ran this in the create step; re-run if any tasks edited the spec).

- [ ] **Task 9: Update sprint status and request review** (AC: #13)
  - [ ] 9.1 Update [_bmad-output/implementation-artifacts/sprint-status.yaml](_bmad-output/implementation-artifacts/sprint-status.yaml): set `ag-7-3-validator-refresh-contract-audit` to `review`.
  - [ ] 9.2 Request `bmad-code-review` per NFR3. Reviewers should focus on (a) audit completeness, (b) audit accuracy (line refs match), (c) GAP triage soundness, (d) any landed trivial patches.

## Dev Notes

### Architecture context

- **Story 7.3 is primarily a research/documentation story.** The deliverable is a markdown audit document, not a code change. Trivial GAP fixes are allowed (per AC #6) but the dev should resist scope creep — any GAP requiring more than 1-3 added lines goes to the backlog.
- **The I34 motivation:** Story 6.6's review (Edge Case Hunter) caught that `validateArtifactsModule` would have crashed on non-standalone workflows missing entry-point files because the validator didn't mirror the refresh's `if (workflow.standalone !== true) { skip; }` gate. The fix was 3 lines. The audit asks: what other gates have the same shape lurking in the install pipeline?
- **Append-only NFR1 is the load-bearing constraint.** Every Epic 7 story has been disciplined about not modifying existing function bodies. Story 7.3 inherits the same constraint — even when fixing GAPs, the patches MUST be additions (new branches, new checks, new files) rather than modifications of existing logic. If the audit identifies a GAP that requires modifying existing logic, that's a clear signal to promote it to a follow-up story where the modification can be properly scoped, reviewed, and tested.
- **The audit's value compounds with future modules.** Today's bme module set is Vortex, Gyre, Enhance, Artifacts, team-factory. The next module (Forge? Loom-runtime? Helm?) will be added against the same `refresh-installation.js` pipeline. The audit document is the contract surface that the next module's PR can be checked against — "does your new module's flag follow the same SAFE/GAP/N/A discipline as the existing F-entries?"

### Previous Story Intelligence

- **Story 7.1** (version stamp safety + YAML comment preservation, done 2026-04-09) — established the Epic 7 review pattern (3 layers, often ≥1 round). Used `YAML.parseDocument` from the `yaml` package; this is NOT relevant to Story 7.3's audit work but is referenced in the spec for context.
- **Story 7.2** (doctor skill-wrapper validation, done 2026-04-09) — introduced `checkModuleSkillWrappers` with **manifest-as-opt-in** semantics. The audit MUST cross-reference this function (per AC #4 + AC #10). Story 7.2 also added the missing `bmad-enhance-initiatives-backlog` row to skill-manifest.csv. Story 7.2's review caught 1 High + 3 Med + 2 Low and applied 6 patches; expect Story 7.3's review to be lighter because the deliverable is a doc, not code.
- **Story 6.6** (skill registration & wiring, done 2026-04-08 in epic-6) — the standalone-flag GAP fix that motivated I34 in the first place. The audit references the Story 6.6 fix as the canonical SAFE-pattern example.

### Risk Notes

1. **The audit could become a sprawling research exercise if not bounded.** AC #5 caps the floor at F1-F8; AC #6 caps the upper bound by requiring trivial fixes inline and promoting non-trivial fixes to the backlog. The dev should keep the audit doc to ≤500 lines (a reasonable upper bound for 8-15 F-entries with snippets) and resist the urge to explore tangential modules.

2. **GAP misclassification is the biggest review risk.** The Acceptance Auditor in code review will sanity-check verdicts. Common misclassification: marking something `SAFE` when the validator checks the field's *presence* but not whether the file it points to exists on disk (this is exactly the I34 pattern). When in doubt, write the failure-mode test case in your head — if it's a real operator action that could silently break, it's a GAP, not SAFE.

3. **Trivial-patch vs promote-to-backlog judgment.** AC #6's bright line is "single function, single file, no new imports, no test infrastructure changes, ≤3 added lines." Anything bigger goes to the backlog. The dev should err on the side of promoting — code changes inside an audit story complicate the review surface and dilute the research value of the audit doc.

4. **The forwarding link at the 2026-04-08 path is a small but important compatibility hack.** The epic file references that path verbatim. Without the forwarding link, the epic's reference becomes a broken link. Don't skip Task 7.

5. **Possible discovery: the doctor doesn't check standalone bme agent wrappers (F7).** This is a known suspected GAP from the survey. If the audit confirms it, the trivial-patch judgment is borderline — adding a check function is more than 3 lines. **Recommendation:** promote to backlog (likely a Story 7.5 or a new epic), don't try to land it inside Story 7.3.

### Testing Standards

- Story 7.3 is mostly a documentation story. Tests are only added when a `[FIX-IN-7.3]` GAP patch lands.
- Any added tests live under `tests/unit/` (Node `node --test` runner), follow the temp-dir fixture pattern from Story 7.2, and target the specific GAP being fixed.
- Coverage expectation: any new code added by a trivial patch must be covered by a test that fails before the patch and passes after.
- The audit doc itself does NOT have a unit test (it's prose), but its accuracy is validated by the code review's line-ref check.

### References

- [Epic 7 spec](_bmad-output/planning-artifacts/epic-7-platform-debt.md) — Story 7.3 section, FR4, NFR1, NFR3
- [Epic 6 retrospective](_bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md) — original I34 framing (Edge Case Hunter finding from Story 6.6)
- [Story 6.6 implementation artifact](_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md) — the standalone-flag GAP fix that motivated I34
- [Story 7.1 spec](_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md) — Senior Developer Review section (Epic 7 review pattern)
- [Story 7.2 spec](_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md) — `checkModuleSkillWrappers` introduction + manifest-as-opt-in semantics
- [Initiatives backlog I34 entry](_bmad-output/planning-artifacts/initiatives-backlog.md) — RICE score 2.4, rank #20
- [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) — primary audit target (790 lines)
- [scripts/update/lib/validator.js](scripts/update/lib/validator.js) — primary audit target (750 lines)
- [scripts/convoke-doctor.js](scripts/convoke-doctor.js) — primary audit target (672 lines)
- [_bmad/_config/skill-manifest.csv](_bmad/_config/skill-manifest.csv) — referenced by AC #5 and AC #10

### Project Structure Notes

- All file paths align with existing project structure. No new directories required.
- The audit document is the only required new file. It lives under `_bmad-output/planning-artifacts/` alongside the epic file and the initiatives backlog.
- The forwarding stub at the 2026-04-08 path is an additional minor file.
- Any tests added by Task 4.5 slot into the existing `tests/unit/` convention.

### Namespace decision

(Per Epic 6 retrospective Action Item #2 — every story creating files under `_bmad/{module}/` or `.claude/skills/` must include this section.)

Story 7.3 creates the following new files:
- `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-09.md` — Convoke planning artifact, lives under `_bmad-output/`, NOT under any module namespace.
- `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` — forwarding stub, same location.
- (Possibly) test files under `tests/unit/` — standard test directory, not a module namespace.

**No namespace decision required** — none of these files live under `_bmad/{module}/` or `.claude/skills/`. No upstream BMAD namespace is touched.

The file modifications in Story 7.3 (if any trivial GAP patches land) touch:
- `scripts/update/lib/validator.js` — Convoke platform code, not a bme module namespace
- `scripts/convoke-doctor.js` — Convoke platform code, not a bme module namespace
- `_bmad/_config/skill-manifest.csv` — Convoke top-level config, not a per-module file

## Dev Agent Record

### Agent Model Used

(to be filled by the dev agent)

### Debug Log References

(to be filled by the dev agent)

### Completion Notes List

(to be filled by the dev agent)

### File List

(to be filled by the dev agent)

### Change Log

(to be filled by the dev agent)
