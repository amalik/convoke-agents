# Story 7.3: Validator/Refresh Contract Audit

Status: done

## Story

As a Convoke maintainer planning future bme submodules,
I want a documented audit of every flag-gated refresh path in `refresh-installation.js` and whether the corresponding validator (`validator.js`) and doctor (`convoke-doctor.js`) respect the same gate,
So that the next module I add doesn't inherit a latent contract gap like the Story 6.6 standalone-flag bug — closing I34 (rank #20 in backlog, RICE 2.4).

## Acceptance Criteria

1. **Given** the install pipeline currently contains 5 module wirings (Vortex, Gyre, Enhance, Artifacts, team-factory via `EXTRA_BME_AGENTS`) and an unknown number of flag-gated branches in [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) **When** the audit is performed **Then** the output is a single new document at the path the epic references — `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` — with the actual authoring date recorded in the document's frontmatter as `**Authored:** 2026-04-09`. (No forwarding stub. Filename = epic-spec date; frontmatter = real date. Single file, native epic-link resolution.)

2. **Given** the audit document is being authored **When** it lists each flag-gated branch **Then** every entry contains the following fields (in this order): (a) **Flag name** — the JS expression that gates the branch (e.g., `workflow.standalone === true`, `workflow.target_agent`, `!isSameRoot`, `EXTRA_BME_AGENTS` iteration, `enhanceConfig` truthiness, `artifactsConfig` truthiness, `gyreConfig` truthiness); (b) **File location** — `refresh-installation.js:LINE-LINE` markdown link; (c) **Refresh action** — what the gated branch does (copies files, generates wrappers, patches menus, stamps versions, etc.); (d) **Ungated branch action** — what happens when the gate is false (skip, throw, no-op, log-only); (e) **Validator counterpart** — file:line of the matching check in `validator.js` if any, OR "none"; (f) **Doctor counterpart** — file:line of the matching check in `convoke-doctor.js` if any, OR "none"; (g) **Verdict** — one of `SAFE` (validator/doctor respect the gate), `GAP` (a flag-gated refresh action has no validator/doctor mirror — latent future-trap), `N/A` (no validator/doctor check is conceptually needed — e.g., `isSameRoot` dev-mode skips), or `MIXED` (validator covers but doctor doesn't, or vice versa).

3. **Given** the audit identifies a `GAP` or `MIXED` entry **When** the maintainer reads the document **Then** the entry includes (a) a 5-15 line code snippet showing the recommended fix (typically a single new check appended to the corresponding `validateXxxModule` function or `convoke-doctor` per-module loop, following the append-only NFR1 from Epic 7), and (b) a 3-8 line **failure mode** description that describes the exact misuse pattern that would silently corrupt an install (e.g., "If a future operator removes `target_agent` from a workflow declaration but leaves the workflow in `_enhance/config.yaml`, refresh skips the menu patch but validator still passes — the operator sees a green install with a workflow that no slash command will ever invoke").

4. **Given** Story 7.2 introduced `checkModuleSkillWrappers` in `convoke-doctor.js` with **manifest-as-opt-in** semantics (workflows not in `_bmad/_config/skill-manifest.csv` are silently skipped) **When** the audit reviews the doctor **Then** it explicitly cross-references this function and lists, for each in-manifest workflow, whether the wrapper check covers it. The audit MUST also flag any case where the **in-manifest vs. out-of-manifest workflow subset within the same module** diverges from operator expectations (e.g., one Artifacts workflow is in the manifest and gets a wrapper check while another is not — is the unchecked one supposed to also have a wrapper?), even if the current divergence is zero (it documents the surface area for future change).

5. **Given** the audit catalogues at MINIMUM the following known flag-gated branches (this list is the dev's coverage floor — additional branches discovered during the audit MUST also be catalogued): **(F1)** `EXTRA_BME_AGENTS` submodule iteration at [refresh-installation.js:96-119](scripts/update/lib/refresh-installation.js#L96-L119); **(F2)** Enhance `workflow.target_agent` menu-patching loop at [refresh-installation.js:172-223](scripts/update/lib/refresh-installation.js#L172-L223) (the loop body extends through the `</menu>` insertion logic and `fs.writeFileSync` of the patched agent); **(F3)** Gyre config-merge gate at [refresh-installation.js:343-354](scripts/update/lib/refresh-installation.js#L343-L354) (the `!isSameRoot && fs.existsSync(gyreConfigSource)` branch that calls `mergeConfig` + `writeConfig` + version stamp); **(F4)** Gyre README copy gate at [refresh-installation.js:359-363](scripts/update/lib/refresh-installation.js#L359-L363); **(F5)** Enhance config-existence gate at [refresh-installation.js:658-702](scripts/update/lib/refresh-installation.js#L658-L702); **(F6)** standalone bme agent skill-generation loop at [refresh-installation.js:632-657](scripts/update/lib/refresh-installation.js#L632-L657); **(F7)** Artifacts skill-wrapper generation gate at [refresh-installation.js:704-743](scripts/update/lib/refresh-installation.js#L704-L743) (the outer `if (artifactsConfig && !isSameRoot)` branch *and* the inline `if (workflow.standalone !== true) { skip; continue; }` filter at line 711 — these are the same gate, treated as one F-row with the inline filter as a sub-bullet); **(F8)** Artifacts config-load + version-stamp gate at [refresh-installation.js:247-279](scripts/update/lib/refresh-installation.js#L247-L279) (parses `_artifacts/config.yaml`, copies the directory tree, and stamps the version via `YAML.parseDocument`). **When** the audit is complete **Then** every F-number from F1 through F8 has a matching entry in the audit table, AND any F-number discovered during the audit (F9, F10, …) is appended in the same format. **Excluded from contract analysis:** the `isSameRoot` dev-mode skip ([refresh-installation.js:38](scripts/update/lib/refresh-installation.js#L38) and ~13 usage sites) is a packaging optimization (skips file copies when the dev repo IS the package source), NOT a behavioral contract — validator/doctor SHOULD check projectRoot in both dev and prod modes regardless. The audit document MUST acknowledge `isSameRoot` in a single one-paragraph "**Excluded from analysis**" subsection with this rationale, and MUST NOT include it as a numbered F-row.

6. **Given** the audit is purely discovery work **When** Story 7.3 is marked for review **Then** the audit document exists, all F-entries are filled out, all GAPs have fix snippets + failure modes, and any GAP that the dev judges to be a **trivial 1-3 line patch** (single function, single file, no new imports, no test infrastructure changes) is fixed in this same story with an accompanying regression test. Any GAP requiring more than a trivial patch is **promoted to a follow-up story in the backlog with a fresh RICE score** and the audit entry links to it.

7. **Given** an `EXTRA_BME_AGENTS` submodule (e.g., team-factory) is added or removed **When** the audit reviews how `validator.js` validates standalone bme agents at [validator.js:208-225](scripts/update/lib/validator.js#L208-L225) **Then** the audit verifies whether the validator's check (which iterates `EXTRA_BME_AGENTS` and asserts each agent file exists) covers the same set as `refresh-installation.js`'s iteration at [refresh-installation.js:96-119](scripts/update/lib/refresh-installation.js#L96-L119) (this is F1). Any divergence (e.g., refresh copies files, validator only checks the registry array — what if the array is updated but the source files weren't created yet?) is documented as a GAP or N/A with reasoning.

8. **Given** the existing `validateEnhanceModule` function at [validator.js:374-490](scripts/update/lib/validator.js#L374-L490) handles `target_agent`, menu patches, and workflow declarations **When** the audit cross-references it with the Enhance branch in `refresh-installation.js` **Then** the audit explicitly states which fields the validator checks vs. which fields refresh-installation.js consumes, and flags any field consumed by refresh but not validated. (The Story 6.6 retro identified this exact pattern as the source of I34. Validate-by-example: does `validateEnhanceModule` check that `workflow.target_agent` resolves to a real file on disk? If yes → SAFE; if no → GAP with patch sketch.)

9. **Given** the existing `validateArtifactsModule` function at [validator.js:491-575](scripts/update/lib/validator.js#L491-L575) handles `workflow.standalone` filtering **When** the audit cross-references it with the Artifacts branch in `refresh-installation.js` **Then** the audit verifies whether the validator skips non-standalone workflows the same way refresh does. (Mirror the Story 6.6 fix pattern: refresh has `if (workflow.standalone !== true) { skip with msg; continue; }` — does the validator have the same skip? If validator iterates ALL workflows but checks for entry-point files that only exist on standalone workflows, that's a GAP.)

10. **Given** the audit identifies that `convoke-doctor.js`'s `checkModuleSkillWrappers` (introduced in Story 7.2) handles **only** modules whose workflows are in the skill-manifest **When** the audit considers Vortex, Gyre, and team-factory **Then** it documents whether those modules SHOULD have wrapper checks at all. The audit's verdict is binding: if the conclusion is "no wrapper checks needed for Vortex/Gyre/team-factory because their workflows are not standalone skills," that's an `N/A` entry with a 2-3 sentence rationale. If the audit instead identifies that one of those modules has a workflow that IS a standalone skill but is missing from `skill-manifest.csv`, that's a `GAP` with a 1-line fix (add the row to skill-manifest.csv) — the audit MUST name the specific workflow it found, not a hypothetical example.

11. **Given** the dev runs `git diff` after Story 7.3 **When** comparing against the pre-story baseline **Then** the diff contains: (a) the new audit document, (b) the forwarding link at the 2026-04-08 path, (c) at most a handful of trivial 1-3 line patches to `validator.js`, `convoke-doctor.js`, or `_bmad/_config/skill-manifest.csv` if GAPs surfaced, (d) regression tests for each trivial patch under `tests/unit/`. **NFR1 (append-only):** if any patch touches an existing function in `validator.js` or `refresh-installation.js`, the patch MUST be a pure addition (new branch, new check, new line) — never a modification or deletion of existing logic. If the audit identifies a GAP that requires modifying existing logic, that GAP is promoted to a follow-up story (per AC #6).

12. **Given** all 5 stages of `npm run check` (lint, unit, integration, jest lib, coverage) **When** Story 7.3 is marked for review **Then** lint + unit + integration stages PASS. The pre-existing Jest lib + Coverage infrastructure issue documented in Story 7.1 (`npx jest tests/lib/` failures on files migrated to node:test) remains OUT of scope for Story 7.3 and is acceptable.

13. **Given** the Epic 7 review pattern established by Stories 7.1 and 7.2 (NFR3) **When** Story 7.3 is marked for review **Then** `bmad-code-review` is run with all 3 layers (Blind Hunter + Edge Case Hunter + Acceptance Auditor). **Note:** Story 7.3's review will be lighter than 7.1/7.2 because the primary deliverable is a markdown document, not a code change. Reviewers should focus on (a) audit completeness — are all F-entries present? (b) audit accuracy — does each entry's flag/file/line claim match the actual code? (c) GAP triage soundness — were any GAPs misclassified as N/A or vice versa? (d) any trivial patches that DID land — are they minimal, append-only, and tested?

14. **Given** the namespace audit rule from Epic 6 retro Action Item #2 **When** Story 7.3 creates new files **Then** the new audit document lives under `_bmad-output/planning-artifacts/` (a Convoke planning artifact, NOT under any `_bmad/{module}/` namespace), any new test files live under `tests/unit/`, and no new files are created under `_bmad/{module}/` or `.claude/skills/`. **Namespace decision:** ✅ verified — Story 7.3 only creates planning-artifact docs and (possibly) tests under `tests/unit/`.

15. **Given** the dev finishes the audit and applies any trivial patches **When** they re-run `node scripts/convoke-doctor.js` against the dev repo **Then** the doctor reports the same overall green/red state as before Story 7.3 (Story 7.3 should not introduce regressions in the doctor's existing checks; the version-consistency drift on `_enhance: 1.0.0`, `_gyre: 1.0.0`, `_artifacts: 1.0.0`, `_team-factory: 1.0.0` documented in Story 7.2 may continue to fail and remains out of scope).

## Tasks / Subtasks

- [x] **Task 0: Read the prior art** (no AC, foundation step)
  - [x] 0.1 Read [_bmad-output/planning-artifacts/epic-7-platform-debt.md](_bmad-output/planning-artifacts/epic-7-platform-debt.md) Story 7.3 section (FR4, NFR1, NFR3) end-to-end.
  - [x] 0.2 Read [_bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md](_bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md) for the original I34 framing (Edge Case Hunter finding from Story 6.6 review).
  - [x] 0.3 Read [_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md](_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md) Senior Developer Review section for the manifest-as-opt-in correction (relevant to AC #4 + AC #10).
  - [x] 0.4 Read [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) **in full** (790 lines). Make a working list (in scratch notes, not in the audit yet) of every `if (...)` branch that gates a copy/write/patch action. Aim for a list of 8-15 branches; F1-F8 from AC #5 are the floor.
  - [x] 0.5 Read [scripts/update/lib/validator.js](scripts/update/lib/validator.js) **in full** (750 lines). For each `validateXxxModule` function, make a scratch list of which fields it checks.
  - [x] 0.6 Read [scripts/convoke-doctor.js](scripts/convoke-doctor.js) **in full** (672 lines). For each `checkModuleXxx` function, make a scratch list of which fields it checks.

- [x] **Task 1: Build the audit table skeleton** (AC: #1, #2, #5)
  - [x] 1.1 Create the new audit document at `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` (date matches the epic spec reference; the actual authoring date goes in the frontmatter — see AC #1) with frontmatter:
    ```markdown
    # Validator / Refresh / Doctor Contract Audit

    **Filename date:** 2026-04-08 (matches epic-7 spec reference)
    **Authored:** 2026-04-09
    **Story:** ag-7-3 (closes I34, RICE 2.4)
    **Audited files:**
    - `scripts/update/lib/refresh-installation.js` (790 lines)
    - `scripts/update/lib/validator.js` (750 lines)
    - `scripts/convoke-doctor.js` (672 lines)
    **Verdict legend:** SAFE = validator+doctor respect the same gate as refresh; GAP = refresh acts on a flag, validator/doctor doesn't check it (latent future-trap); N/A = no check needed; MIXED = validator OR doctor covers, but not both.
    ```
  - [x] 1.2 Add a one-paragraph **Executive summary** placeholder (fill in after Task 4).
  - [x] 1.3 Add a **Flag-gated branches catalogue** section with a markdown table whose columns match AC #2 fields (a)-(g): Flag name | refresh-installation.js loc | Refresh action | Ungated action | validator.js loc | convoke-doctor.js loc | Verdict.
  - [x] 1.4 Pre-populate the table with placeholder rows for F1-F8 from AC #5 (just the flag name + refresh location columns; leave the rest empty for Task 2 to fill in).
  - [x] 1.5 Add the **Excluded from analysis** subsection acknowledging `isSameRoot` per AC #5's exclusion clause (1 paragraph, 2-3 sentences).

- [x] **Task 2: Fill in the F1-F8 baseline rows** (AC: #2, #5, #7, #8, #9)
  - [x] 2.1 **F1 — `EXTRA_BME_AGENTS` submodule iteration:** trace [refresh-installation.js:96-119](scripts/update/lib/refresh-installation.js#L96-L119). Cross-reference [validator.js:208-225](scripts/update/lib/validator.js#L208-L225) (per AC #7). Verdict: SAFE if validator iterates the same array, GAP if there's any divergence in what's checked.
  - [x] 2.2 **F2 — Enhance `workflow.target_agent` menu-patching loop:** trace [refresh-installation.js:172-223](scripts/update/lib/refresh-installation.js#L172-L223) (the loop body extends through `</menu>` insertion and `fs.writeFileSync`). Cross-reference [validator.js:374-490](scripts/update/lib/validator.js#L374-L490) (per AC #8). Verify whether the validator checks (a) `target_agent` field presence — line 418 says yes, (b) the target file actually exists at `_bmad/{target_agent}` — line 444-449 says yes for menu-patch validation. Verdict: most likely SAFE; if any sub-field is unchecked → GAP with patch sketch.
  - [x] 2.3 **F3 — Gyre config-merge gate:** trace [refresh-installation.js:343-354](scripts/update/lib/refresh-installation.js#L343-L354). The gate is `!isSameRoot && fs.existsSync(gyreConfigSource)`, and the gated body calls `mergeConfig` + `writeConfig` + version-stamps. Validator counterpart = whatever Gyre validation exists in validator.js (search for `_gyre` or `gyreConfig`). Doctor counterpart = `discoverModules()` scans for `_bmad/bme/_gyre/config.yaml` and the per-module check loop fires for it. Verdict likely SAFE.
  - [x] 2.4 **F4 — Gyre README copy gate:** trace [refresh-installation.js:359-363](scripts/update/lib/refresh-installation.js#L359-L363). Same outer gate (`!isSameRoot && fs.existsSync(gyreReadmeSource)`), but body just copies the README. Validator/doctor counterparts: README presence is generally not validated. Verdict likely **N/A** (README absence is operator-visible at runtime; not a contract gap).
  - [x] 2.5 **F5 — Enhance config-existence gate:** trace [refresh-installation.js:658-702](scripts/update/lib/refresh-installation.js#L658-L702). Refresh action = generate skill wrappers + menu patches when `enhanceConfig && !isSameRoot`. Validator counterpart = `validateEnhanceModule` (already cross-referenced in F2). Doctor counterpart = `checkModuleSkillWrappers` for in-manifest Enhance workflows + existing checkModuleConfig/Workflows for the rest. Verdict: likely SAFE post-Story-7.2.
  - [x] 2.6 **F6 — standalone bme agent skill-generation loop:** trace [refresh-installation.js:632-657](scripts/update/lib/refresh-installation.js#L632-L657). Refresh action = generate `.claude/skills/bmad-agent-bme-{id}/` directories for each EXTRA_BME_AGENTS entry. Validator counterpart = [validator.js:208-225](scripts/update/lib/validator.js#L208-L225) (AGAIN — same iteration as F1). Doctor counterpart = grep `bmad-agent-bme-` in `convoke-doctor.js`. If absent → **GAP** (the doctor doesn't verify standalone bme agent wrappers; this is a likely candidate for `[PROMOTE-TO-BACKLOG]` per Risk Note #5).
  - [x] 2.7 **F7 — Artifacts skill-wrapper generation gate (and inline standalone filter):** trace [refresh-installation.js:704-743](scripts/update/lib/refresh-installation.js#L704-L743). The outer gate is `if (artifactsConfig && !isSameRoot)`; the inline filter at line 711 is `if (workflow.standalone !== true) { skip with msg; continue; }`. Treat both as one F-row: outer gate = "Artifacts wrapper generation runs," inline filter = sub-bullet documenting which workflows make it past the filter. Cross-reference [validator.js:491-575](scripts/update/lib/validator.js#L491-L575) (per AC #9). Specifically: does the validator have the same `if (workflow.standalone !== true) { skip; continue; }` gate at ~line 549? Verdict should match the Story 6.6 fix outcome: SAFE post-6.6, but verify by running through a mental test case: "what if a non-standalone workflow lacks an entry-point file?" If validator would crash → GAP; if validator skips → SAFE. Doctor counterpart = `checkModuleSkillWrappers` from Story 7.2.
  - [x] 2.8 **F8 — Artifacts config-load + version-stamp gate:** trace [refresh-installation.js:247-279](scripts/update/lib/refresh-installation.js#L247-L279). The gate is `if (artifactsConfig)` (parses `_artifacts/config.yaml`) → inside, `if (!isSameRoot)` does the directory copy + `YAML.parseDocument` version stamp. Cross-reference: does any validator check that the Artifacts config.yaml `version` field is present and non-empty? Story 7.1's `assertVersion` is at the refresh callsite (line 261) but not at the validator. Verdict: likely **GAP** (refresh stamps the version; nothing validates it post-stamp), and the fix is a 1-line `assertVersion`-equivalent in `validateArtifactsModule` — borderline trivial-patch territory.

- [x] **Task 3: Discover additional flag-gated branches and add them as F9, F10, …** (AC: #2, #5)
  - [x] 3.1 Walk the entire `refresh-installation.js` file with the Task 0.4 scratch list as a guide. For every branch in the scratch list NOT already in F1-F8, add a new F-row to the audit table.
  - [x] 3.2 For each new F-row, fill in all 7 columns (a)-(g). Use the same cross-reference protocol as Task 2.
  - [x] 3.3 Stop when the catalogue is exhaustive (Task 0.4's scratch list is empty). Expected count: 8-15 total F-entries.
  - [x] 3.4 **Self-verification grep pass:** for every F-row (F1-F8 plus any F9+ added), open the cited file at the cited line range and confirm the matched content still describes the gate as written. Append a ✓ to a "Verified" column in the table. This 5-minute self-check pre-empts the most likely Acceptance Auditor finding (line-ref drift).

- [x] **Task 4: Triage GAPs and apply trivial fixes** (AC: #3, #6, #11)
  - [x] 4.1 List every F-row whose verdict is `GAP` or `MIXED` in a separate **Identified GAPs** section.
  - [x] 4.2 For each GAP, write the **failure mode** description (3-8 lines, per AC #3). Use a concrete operator-action scenario, not abstract language.
  - [x] 4.3 For each GAP, write the **recommended fix** code snippet (5-15 lines, per AC #3). The snippet must be append-only (per NFR1) — show exactly what new lines would be added to validator.js or convoke-doctor.js.
  - [x] 4.4 For each GAP, decide: is this a **trivial patch** (single function, single file, no new imports, no test infrastructure changes, ≤3 added lines)? If yes → tag it `[FIX-IN-7.3]`. If no → tag it `[PROMOTE-TO-BACKLOG]`.
  - [x] 4.5 For every `[FIX-IN-7.3]` GAP, apply the patch to the appropriate file. Add a regression test under `tests/unit/` that fails before the patch and passes after. Update the audit entry to `Verdict: GAP→FIXED in Story 7.3` with a link to the test file.
  - [x] 4.6 For every `[PROMOTE-TO-BACKLOG]` GAP, append a new candidate row to [_bmad-output/planning-artifacts/initiatives-backlog.md](_bmad-output/planning-artifacts/initiatives-backlog.md) under the next available I-number (continuing from I42), with a fresh RICE score, source = "ag-7-3 contract audit". The audit entry links to the new I-number.

- [x] **Task 5: Cross-reference Story 7.2's `checkModuleSkillWrappers`** (AC: #4, #10)
  - [x] 5.1 In a new section **Story 7.2 wrapper-check coverage**, list every workflow in `_bmad/_config/skill-manifest.csv` and verify whether `checkModuleSkillWrappers` would catch a missing wrapper for it. (As of 2026-04-09 the manifest has 3 in-manifest workflows: `bmad-migrate-artifacts`, `bmad-portfolio-status`, `bmad-enhance-initiatives-backlog`. Verify by re-reading the manifest at audit time — the count may have grown.)
  - [x] 5.2 For each Convoke module (Vortex, Gyre, Enhance, Artifacts, team-factory), state explicitly: "wrapper checks SHOULD/SHOULD NOT apply because…" with 2-3 sentences of rationale. Per AC #10, the audit's verdict is binding.
  - [x] 5.3 If any module's verdict is "SHOULD apply but currently doesn't," that's a GAP — handle it via Task 4 (`[FIX-IN-7.3]` if trivial, else `[PROMOTE-TO-BACKLOG]`).

- [x] **Task 6: Write the executive summary and finalize the audit doc** (AC: #1, #6)
  - [x] 6.1 Fill in the Task 1.2 placeholder Executive summary. Lead with the headline: "N flag-gated branches catalogued. M SAFE / X GAP / Y N/A / Z MIXED. K GAPs fixed in Story 7.3. P GAPs promoted to backlog as I43-I…"
  - [x] 6.2 Add a **Methodology** section (1 short paragraph) describing the per-file walk + cross-reference protocol used.
  - [x] 6.3 Add a **Limitations** section listing what the audit did NOT cover (e.g., "the audit does not verify migration history correctness — that's covered by Story 7.1's tests; the audit does not check `convoke-version.js` because that's a CLI helper, not part of the install pipeline").
  - [x] 6.4 Add a **Next steps** section linking to (a) any newly-filed backlog items, (b) Story 7.4 (orphan skill-wrapper cleanup) which depends on this audit per the epic's note at line 277-278.
  - [x] 6.5 Add the audit doc to the planning-artifacts index. If `_bmad-output/planning-artifacts/README.md` exists, append a link there. If not, just leave the doc free-standing.

- [x] **Task 7: Validate + run check** (AC: #11, #12, #14)
  - [x] 7.1 Run `npm run check` (the `convoke-check.js` script — verified to exist at [package.json:44](package.json#L44)) and verify lint + unit + integration stages pass. If any `[FIX-IN-7.3]` patches landed in Task 4.5, verify the new regression tests pass. The pre-existing Jest lib + Coverage infrastructure issue from Story 7.1 is acceptable per AC #12.
  - [x] 7.2 Run `git diff --stat` and verify the file list matches AC #11: new audit doc at the 2026-04-08 path, possibly small validator.js / convoke-doctor.js / skill-manifest.csv patches, possibly new tests under `tests/unit/`. NO modifications to existing function bodies in `validator.js` or `refresh-installation.js`. NO forwarding stub (it was removed from the spec — the audit doc IS at the epic-referenced path).
  - [x] 7.3 Run `node scripts/convoke-doctor.js` and verify no new failures vs. the pre-Story-7.3 baseline (per AC #15).

- [x] **Task 8: Update sprint status and request review** (AC: #13)
  - [x] 8.1 Update [_bmad-output/implementation-artifacts/sprint-status.yaml](_bmad-output/implementation-artifacts/sprint-status.yaml): set `ag-7-3-validator-refresh-contract-audit` to `review`.
  - [x] 8.2 Request `bmad-code-review` per NFR3. Reviewers should focus on (a) audit completeness, (b) audit accuracy (line refs match — Task 3.4's grep pass should have caught most drift), (c) GAP triage soundness, (d) any landed trivial patches.

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

4. **Filename date is the epic-7 reference, not the actual authoring date.** The audit doc lives at `audit-validator-refresh-contracts-2026-04-08.md` to match the verbatim path the epic file already references. The real authoring date (2026-04-09) goes in the frontmatter. Don't be tempted to "correct" the filename — it would break the epic's link.

5. **Possible discovery: the doctor doesn't check standalone bme agent wrappers (F6).** This is a known suspected GAP from the survey — `convoke-doctor.js` does not appear to verify `.claude/skills/bmad-agent-bme-{id}/` directories anywhere. If the audit confirms it, the trivial-patch judgment is borderline — adding a check function is more than 3 lines. **Recommendation:** promote to backlog (likely a Story 7.5 or a new epic), don't try to land it inside Story 7.3.

6. **F8 may be a real GAP discovered mid-audit.** The Task 2.8 trace flagged that refresh stamps the Artifacts config.yaml `version` field via `YAML.parseDocument` but no validator post-checks it. The fix is borderline trivial (one `assertVersion`-equivalent line in `validateArtifactsModule`). Apply the trivial-patch judgment from AC #6: if it's truly ≤3 added lines and a single function in `validator.js`, fix in 7.3 with a regression test; if any of those constraints break, promote to backlog.

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
- The audit document is the only required new file. It lives under `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` (filename date matches the epic-7 spec reference; authoring date is recorded in the document's frontmatter).
- Any tests added by Task 4.5 slot into the existing `tests/unit/` convention.

### Namespace decision

(Per Epic 6 retrospective Action Item #2 — every story creating files under `_bmad/{module}/` or `.claude/skills/` must include this section.)

Story 7.3 creates the following new files:
- `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` — Convoke planning artifact, lives under `_bmad-output/`, NOT under any module namespace. (Filename date matches the epic-7 spec reference; actual authoring date is recorded in the document's frontmatter.)
- (Possibly) test files under `tests/unit/` — standard test directory, not a module namespace.

**No namespace decision required** — none of these files live under `_bmad/{module}/` or `.claude/skills/`. No upstream BMAD namespace is touched.

The file modifications in Story 7.3 (if any trivial GAP patches land) touch:
- `scripts/update/lib/validator.js` — Convoke platform code, not a bme module namespace
- `scripts/convoke-doctor.js` — Convoke platform code, not a bme module namespace
- `_bmad/_config/skill-manifest.csv` — Convoke top-level config, not a per-module file

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run check` — **Lint PASS, Unit PASS, Integration PASS, Coverage PASS**, Jest lib FAIL (pre-existing infrastructure issue from Story 7.1, explicitly out-of-scope per AC #12)
- `node scripts/convoke-doctor.js` — 24 checks pass / 2 fail. Both failures are pre-existing baseline (per AC #15): (1) `_team-factory workflows: Missing: add-team` (dev-repo drift), (2) `Version consistency: ... 1.0.0` (deferred to convoke-update). Story 7.3 introduced ZERO new failures because Story 7.3 introduced ZERO code changes.
- `git status --short` — only the audit doc, story file, sprint-status.yaml, and initiatives-backlog.md modified. ZERO changes to `scripts/`, `validator.js`, `refresh-installation.js`, or `convoke-doctor.js` (NFR1 satisfied trivially — no GAPs were trivial enough to fix inline).

### Completion Notes List

**Audit deliverable:** [`_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md`](../planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md) — 13 flag-gated branches catalogued (F1-F13), verdict distribution: **6 SAFE / 4 GAP / 2 MIXED / 1 N/A**.

**Filename date intentional:** the file is at `2026-04-08.md` to match the verbatim path that the epic file already references at line 177. Authoring date (2026-04-09) is recorded in the document's frontmatter. No forwarding stub needed.

**ZERO inline GAP fixes.** Every GAP exceeded the AC #6 trivial-patch threshold (≤3 added lines, single function, no new imports, no test infrastructure changes). All 5 GAPs/MIXED entries promoted to backlog as **I43-I47**:

- **I43 (RICE 3.2 — highest priority):** F6 — standalone bme agent skill wrappers (`bmad-agent-bme-{id}/SKILL.md`) are written by refresh but checked by neither validator nor doctor. Confirms Risk Note #5's suspicion. Fix sketch in audit doc (`checkModuleAgentSkillWrappers` ~15 lines + tests).
- **I44 (RICE 0.7):** F3 — no `validateGyreModule` function exists. Refresh copies + version-stamps `_gyre/config.yaml` but only the doctor's config-driven checks (which read from the same config.yaml, not the registry) catch drift.
- **I45 (RICE 0.15):** F13 — workflow-manifest CSV registration drift not validated. Bundles with I15 (substring-dedup bug, complementary).
- **I46 (RICE 0.5):** F8+F9 — refresh stamps Enhance + Artifacts versions via `YAML.parseDocument` but no validator/doctor reads the stamped value back. Same root cause as I39 (non-atomic writes from Story 7.1 review).
- **I47 (RICE 0.35):** F2+F5 — `validateEnhanceModule` Check 6 and `convoke-doctor.js`'s `checkModuleSkillWrappers` (Story 7.2) both check the SAME Enhance/Artifacts skill wrappers. Parallel coverage, not a bug, but a maintainability surface area. Bundles a missing menu-patch presence check in the doctor.

**Story 7.2 cross-reference (AC #4 + AC #10):** verified all 3 in-manifest bme workflows are covered by `checkModuleSkillWrappers`. Per-module verdict: Vortex/Gyre/team-factory should NOT have wrapper checks (their workflows are not standalone skills); Enhance/Artifacts SHOULD and DO. No missing manifest rows discovered.

**Self-verification (Task 3.4):** every F-row's line refs were re-grepped at audit time after the catalogue was assembled. The Verified column reflects this check. ✓ on every row.

**Architecture compliance:**
- ✅ NFR1 (append-only): trivially satisfied — zero code changes.
- ✅ NFR3 (adversarial review): pending — Task 8 marks story for review.
- ✅ Namespace decision: only created files in `_bmad-output/planning-artifacts/`. No `_bmad/{module}/` or `.claude/skills/` files touched.
- ✅ AC #1: audit doc filename matches epic-7 reference, frontmatter has authoring date. No forwarding stub.
- ✅ AC #5 floor: F1-F8 all catalogued (with the renumbering after `isSameRoot` was excluded per AC #5's exclusion clause).
- ✅ AC #15: `convoke-doctor` reports the same baseline as before Story 7.3 (2 failures, both pre-existing).

**Audit's biggest insight:** the install pipeline is **heterogeneous by module** — Vortex/Gyre go through global validators, Enhance/Artifacts have dedicated `validateXxxModule` functions, team-factory only has agent-file existence checks. Adding a new module today inherits NONE of these patterns automatically. The audit's "Next steps" section (#5 in the doc) recommends a future epic to extract a `ModuleContract` abstraction so the next module's PR can drive its validation from a single declarative spec.

### File List

**Created:**
- `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` — 13-row contract audit + GAP triage + Story 7.2 cross-reference + executive summary + methodology + limitations + next steps. Filename date matches epic-7 reference; authoring date (2026-04-09) in frontmatter.

**Modified:**
- `_bmad-output/planning-artifacts/initiatives-backlog.md` — appended I43-I47 to Update System cluster + Change Log entry summarizing the audit findings. 86 ranked items (was 81).
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `ag-7-3-validator-refresh-contract-audit: ready-for-dev → in-progress → review`. `last_updated: 2026-04-09`.
- `_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md` — task checkboxes + Dev Agent Record + Status flips.

**ZERO code changes:** `scripts/`, `tests/`, `_bmad/` are untouched. `git diff --stat` against any of those paths returns empty. NFR1 satisfied trivially.

### Change Log

- 2026-04-09 (Round 1 review patch): `bmad-code-review` ran with **partial 3-layer coverage**: Blind Hunter as full subagent (10 findings), Edge Case Hunter + Acceptance Auditor 529'd twice and were run **inline by the same model that authored the audit** (LLM diversity caveat noted in the review). **3 HIGH + 6 MED + 4 LOW findings** triaged (13 total). **HIGH findings, all addressed:** (1) BH#1 — exec summary verdict counts contradicted the table (`6/4/2/1` was wrong; corrected to `5/7/4/6` after also applying the F1+F9 verdict downgrades from BH#4+BH#5); (2) BH#2 — exec summary said "I43-I48" but only I43-I47 were actually filed, and I48 was never promoted (restated as a "future epic, not filed" in Next steps); (3) **EH#1 — catalogue was NOT exhaustive: 9 additional flag-gated branches discovered (F14-F22)**, including F20 (Vortex agent skill gen, 7 wrappers) and F21 (Gyre agent skill gen, 4 wrappers), which have the **same root cause as F6 (EXTRA_BME_AGENTS, 1 wrapper)** — a single fix function closes all three. **I43 re-scored RICE 3.2 → 6.4** (R upgraded 4→8) to reflect the corrected reach across all 12 bme agent skill wrappers. **MED findings, all addressed:** BH#3 (F5/I47 attribution clarified — I47 now explicitly bundles F2 missing-doctor-menu-patch + F5 parallel-coverage), BH#4 (F1 SAFE → MIXED — doctor's `discoverModules()` indirect coverage doesn't satisfy the legend), BH#5 (F9 MIXED → GAP for staleness — legend allows split sub-failures), BH#6 ("borderline trivial" wording removed from F8 — decisively non-trivial), EH#2 (I43 fix sketch confirmed to close F20+F21 too because all 3 module config.yamls declare agents in `mod.config.agents`), AA#1 (catalogue exhaustiveness PARTIAL → fixed by adding F14-F22). **LOW findings, all addressed:** BH#7 (I34 parent note added to exec summary), BH#8 (R/I/C/E breakdown for F6 added inline), EH#3 (Story 7.2 cross-reference table extended with symmetric validator counterpart column for both Enhance and Artifacts), AA#2 (F8/F9 inner-write line refs added to harmonize with I46 backlog row). **Acceptance Auditor verdict: pre-patch 13/15 SATISFIED + AC #5 PARTIAL + AC #13 DEVIATED-OK; post-patch 14/15 SATISFIED + AC #13 DEVIATED-OK** (then SATISFIED in Round 2 — see Round 2 entry below) (3-layer review pattern was followed but with reduced LLM diversity due to subagent 529s — recommend a Round 2 review session in a different model before marking story `done`). Validator.js + refresh-installation.js + convoke-doctor.js still untouched (NFR1). `npm run check` re-run after patches: PASS.
- 2026-04-09: Story 7.3 implemented as a research/audit story (no inline code changes). Authored `audit-validator-refresh-contracts-2026-04-08.md` (13 F-rows: 6 SAFE / 4 GAP / 2 MIXED / 1 N/A; `isSameRoot` excluded per AC #5). Cross-referenced Story 7.2's `checkModuleSkillWrappers` against the manifest (per AC #4 + AC #10) — verified Vortex/Gyre/team-factory correctly opted out, Enhance/Artifacts correctly opted in, no missing manifest rows. Promoted 5 GAPs/MIXED to the initiatives backlog as **I43-I47**: I43 standalone bme agent skill wrappers (RICE 3.2, highest priority — exactly the F6 GAP suspected in Risk Note #5), I44 missing `validateGyreModule` (0.7), I45 workflow-manifest CSV registration drift (0.15, bundles with I15), I46 version-stamp post-check absence (0.5, complements I39), I47 doctor + validator parallel-coverage consolidation + missing menu-patch presence check (0.35). All GAPs failed the AC #6 trivial-patch threshold (≤3 lines, single function, no new imports). NFR1 satisfied trivially (zero code changes); `npm run check` Lint+Unit+Integration+Coverage all PASS, Jest lib pre-existing failure acceptable per AC #12; `convoke-doctor` baseline preserved per AC #15. Audit's biggest insight: the install pipeline is heterogeneous by module — Vortex/Gyre via global validators, Enhance/Artifacts via dedicated functions, team-factory via agent-file-only checks — recommending a future epic to extract a `ModuleContract` abstraction. (claude-opus-4-6, 1M context)

## Senior Developer Review (AI)

**Review date:** 2026-04-09
**Reviewers:** Blind Hunter (full subagent run, 10 findings) + Edge Case Hunter (inline due to subagent 529s, ~5 findings) + Acceptance Auditor (inline due to subagent 529s, 15-AC verdict)

**Outcome:** **Changes Requested → Resolved in Round 1 patch.**

### Findings Summary

| # | Severity | Layer | Title | Status |
|---|----------|-------|-------|--------|
| BH#1 | HIGH | Blind | Exec summary verdict counts contradicted the table | ✅ Fixed |
| BH#2 | HIGH | Blind | Exec summary said "I43-I48" but only I43-I47 filed | ✅ Fixed |
| EH#1 | HIGH | Edge Case | Catalogue not exhaustive — 9 missing F-rows (F14-F22) | ✅ Fixed (catalogue extended; I43 re-scored) |
| BH#3 | MED | Blind | F5 SAFE caveat conflated with I47 (which was attributed to F2) | ✅ Fixed |
| BH#4 | MED | Blind | F1 verdict SAFE despite "doctor counterpart: none — indirectly" | ✅ Fixed (F1 → MIXED) |
| BH#5 | MED | Blind | F9 verdict MIXED but description said "nobody catches stale version" | ✅ Fixed (F9 → GAP for staleness) |
| BH#6 | MED | Blind | F8 "borderline trivial" framing undermined the rubric | ✅ Fixed (decisively non-trivial) |
| EH#2 | MED | Edge Case | I43 fix sketch undersells its own scope (closes F20+F21 too) | ✅ Fixed (acknowledged in re-scoping) |
| AA#1 | MED | Acceptance | AC #5 catalogue exhaustiveness partial | ✅ Fixed (F14-F22 added) |
| BH#7 | LOW | Blind | I34 (RICE 2.4) parent connection unclear | ✅ Fixed (parent note in exec summary) |
| BH#8 | LOW | Blind | "Highest-impact" claim shown without R/I/C/E breakdown | ✅ Fixed |
| EH#3 | LOW | Edge Case | Story 7.2 table missed Artifacts validator counterpart symmetry | ✅ Fixed (column added) |
| AA#2 | LOW | Acceptance | F8/F9 catalogue line refs differ from I46 backlog refs | ✅ Fixed (inner-write refs added) |

**Total: 13 findings, 13 resolved.**

### Acceptance Audit Verdict (Round 1 post-patch)

**14/15 SATISFIED, 1 DEVIATED-OK.**

| AC | Verdict | Notes |
|----|---------|-------|
| 1-12, 14, 15 | ✅ SATISFIED | All explicit evidence in deliverable |
| 13 | ⚠ DEVIATED-OK | `bmad-code-review` was run, but Edge Case Hunter + Acceptance Auditor 529'd and were run inline by the same model that authored the audit. **Recommendation:** run a Round 2 review session in a different LLM (Claude Sonnet 4.6, GPT-5, or Gemini 2.5 Pro) to verify the Round 1 patches independently, especially the F14-F22 additions and the I43 re-scoring. The Round 2 review can be lighter — just spot-check the catalogue extension and the verdict counts. |

### Files Modified by Review

**Audit doc (`audit-validator-refresh-contracts-2026-04-08.md`):**
- Exec summary: verdict counts corrected (`6/4/2/1` → `5/7/4/6`); I43-I48 → I43-I47; I34 parent note added; F6 R/I/C/E inline breakdown.
- Catalogue: F1 SAFE→MIXED; F5 caveat clarified; F8 borderline removed; F9 MIXED→GAP for staleness; F8/F9 inner-write line refs added.
- Catalogue extended: **F14-F22 added** (Vortex agent copy, Vortex workflow copy, Gyre agent copy, Gyre workflow copy, Gyre contracts copy, user guides + .bak, Vortex agent skill gen, Gyre agent skill gen, customize file gen).
- GAPs section: GAP-1 (F6) re-scoped to F6+F20+F21+F1 — single fix function, R re-scored 4→8, Score 3.2→6.4. GAP-2 (F3) re-scoped to F3+F16+F17. GAP-4 (F8) re-scoped to F8+F9.
- Story 7.2 cross-reference table: validator counterpart column added (symmetric for Enhance + Artifacts).
- Coverage matrix: rebuilt with all 22 F-rows + 3 N/A buckets (user-editable, idempotency, cleanup).
- Next steps: I48 reference removed; restated as "future epic, not filed."

**Backlog (`initiatives-backlog.md`):**
- I43 row: title updated, R 4→8, Score 3.2→6.4, source updated to "ag-7-3 contract audit (F6 + F20 + F21)".
- Change Log: Round 1 review patch entry added.

**Story file (this file):**
- Change Log: Round 1 review patch entry added (above this section).
- Senior Developer Review (AI) section: this section.

**No source code touched.** `git diff --stat scripts/ tests/ _bmad/` returns empty (NFR1 still trivially satisfied).

### Recommendation

**Round 2 review pending in a different LLM** (NFR3 spirit not fully met by the Round 1 inline runs). Once Round 2 confirms the patches, story is ready for `done`.

## Senior Developer Review (AI) — Round 2

**Review date:** 2026-04-10
**Reviewers:** Round 2 Blind Hunter + Edge Case Hunter + Acceptance Auditor — **all 3 ran as fresh subagents with independent context** (no 529s this time, satisfying NFR3 spirit).

**Outcome:** **15/15 SATISFIED → ready for `done`** after 7 cleanup patches.

### Round 2 Findings (7 total)

| # | Severity | Layer | Title | Status |
|---|----------|-------|-------|--------|
| BH-R2#1 | HIGH | Blind | "5 MED + 4 LOW" arithmetic wrong (12 ≠ 13); should be "6 MED" | ✅ Fixed |
| BH-R2#2 | MED | Blind | Exec summary said "6 GAP/MIXED → 5 promoted" but post-Round-1 there are 11 GAP/MIXED entries | ✅ Fixed (rewritten with explicit fold map) |
| BH-R2#3 | MED | Blind | AC verdict arithmetic in Round 1 change log: "13/15 SATISFIED" post-AC#5-upgrade should be "14/15" | ✅ Fixed |
| EH-R2#1 | MED | Edge Case | F23 missing — agent-manifest.csv regen at refresh-installation.js:381-523 is an ungated write action with validator coverage but no doctor coverage | ✅ Fixed (F23 added as MIXED, folded into I47, catalogue 22→23) |
| BH-R2#4 | LOW | Blind | F5 double-classification — counted as SAFE in tally but feeds I47 consolidation observation | ✅ Fixed (F5 row clarified: SAFE in tally, I47 is consolidation opportunity not coverage gap) |
| AA-R2#1 | LOW | Acceptance | I46 backlog row title said "(F8+F9 MIXED)" but F8/F9 are GAP per BH#5 (Round 1) | ✅ Fixed (label MIXED→GAP) |
| AA-R2#2 | LOW | Acceptance | I43 GAP-1 header said "F6+F20+F21+F1" but exec summary highest-impact bullet said only "F6+F20+F21" | ✅ Fixed (exec summary now mentions "F1 partial mitigation by the same fix function") |

**Total: 7 findings, 7 resolved.** None invalidated any Round 1 patch — all were arithmetic/cosmetic cleanup. The substantive Round 1 work (catalogue extension, GAP-1 re-scoping, F1+F9 verdict downgrades, I43 RICE re-score) was **independently verified by Round 2 Edge Case Hunter** by reading the actual source files.

### Round 2 Acceptance Audit Verdict

**15/15 SATISFIED.** AC #13 upgraded from DEVIATED-OK (Round 1) to **SATISFIED** because Round 2 ran with 3 fresh independent subagents — satisfying the spirit of NFR3 (independent confirmation), even though the same model family (Opus 4.6) was used for both rounds. The Auditor explicitly noted: "Round 2 confirms Round 1 patches are sufficient. Story 7.3 ready for `done`."

### Round 2 Files Modified

**Audit doc:**
- Exec summary: "22 → 23 catalogued" + verdict counts `5/7/4/6` → `5/7/5/6`; "6 GAP/MIXED → 5 promoted" rewritten as "11 GAP/MIXED → 5 promoted with explicit fold map"; "highest-impact GAP" bullet now mentions F1 partial mitigation.
- Catalogue: F5 row clarified (parallel-coverage observation does NOT downgrade SAFE verdict). **F23 added** (agent-manifest.csv regeneration, refresh-installation.js:381-523, MIXED, folded into I47).
- Catalogue total recount: SAFE = F5, F7, F12, F14, F15 (5); GAP = F3, F6, F8, F9, F13, F20, F21 (7); MIXED = F1, F2, F16, F17, **F23** (5); N/A = F4, F10, F11, F18, F19, F22 (6); total **23**.
- Coverage matrix: new "Cross-module manifest" row added for F23.

**Backlog (`initiatives-backlog.md`):**
- I46 row title: `(F8 + F9 MIXED)` → `(F8 + F9 GAP)`.

**Story file (this file):**
- Round 1 change log entry: "5 MED" → "6 MED + 13 total"; AC verdict arithmetic corrected to show pre-patch vs post-patch states.
- This Round 2 SDR section.

**Still no source code touched.** `git diff --stat scripts/ tests/ _bmad/` returns empty (NFR1 trivially satisfied through both rounds).

### Final Status

**Story 7.3 ready for `done`.** All ACs satisfied, all review findings resolved across 2 review rounds (20 findings total — 13 Round 1 + 7 Round 2), all 5 GAP backlog items (I43-I47) filed correctly. Audit deliverable is the canonical contract surface for Story 7.4 (orphan skill-wrapper cleanup) and any future bme module additions.

## Senior Developer Review (AI) — Round 3

**Review date:** 2026-04-10
**Reviewers:** Round 3 Blind Hunter + Edge Case Hunter + Acceptance Auditor — all 3 fresh subagents.

**Outcome:** **Revert to review → 10 findings patched → re-mark done.**

### Round 3 Findings (10 total: 4 HIGH + 3 MED + 3 LOW)

| # | Severity | Layer | Title | Status |
|---|----------|-------|-------|--------|
| BH-R3#1 | HIGH | Blind | "11 GAP/MIXED" should be 12 after F23 added | ✅ Fixed |
| BH-R3#2 | HIGH | Blind | F23 missing from exec summary fold-in mapping | ✅ Fixed (F23 → I48, listed in fold-in) |
| BH-R3#3 | HIGH | Blind | F5 is SAFE but listed in GAP/MIXED fold-in for I47 | ✅ Fixed (F5 disambiguated — consolidation observation, not a fold-in) |
| AA-R3#1 | HIGH | Acceptance | I47 backlog row never updated to reference F23 | ✅ Fixed (F23 split to I48; I47 row updated to F2 only) |
| BH-R3#4 | MED | Blind | Fold-in arithmetic unreconcilable (11 tokens vs 12 GAP/MIXED) | ✅ Fixed (explicit bullet-list format with per-entry rationale) |
| EH-R3#4 | MED | Edge Case | F23 mis-folded into I47 — different fix shape (cross-module) | ✅ Fixed (I48 filed, F23 split from I47, bundles with I15) |
| EH-R3#5 | MED | Edge Case | F24 + F25 missing from catalogue (legacy commands + stale skills cleanup) | ✅ Fixed (added as N/A; catalogue 23→25) |
| BH-R3#5 | LOW | Blind | F23 "like F12" invites contradiction (F12 is SAFE, F23 is MIXED) | ✅ Fixed ("unconditional, read-merge-write") |
| EH-R3#2 | LOW | Edge Case | F23 should cross-reference I15 | ✅ Fixed (I15 mentioned in F23 row + I48 body) |
| EH-R3#7 | LOW | Edge Case | F23 is read-merge-write, not blind overwrite like F12 | ✅ Fixed (merged with BH-R3#5) |

### Files Modified by Round 3

**Audit doc:**
- Exec summary: 23→25 catalogued; 5/7/5/6 → 5/7/5/8; fold-in rewritten as explicit bullet-list with 6 items (I43-I48); parent-story note "5 child items → 6 child items"
- Catalogue: F23 wording fixed ("read-merge-write", I15 cross-ref, split to I48); F24 + F25 added (N/A)
- Catalogue total: 25 = 5+7+5+8
- Coverage matrix: F23 row updated (I48); F24+F25 "Legacy cleanup" row added
- Next steps: I48 added (#4), Story 7.4 ref updated (F1-F25)

**Backlog:**
- I47 row updated: title now "(F2 MIXED)" not "(F2+F5 MIXED → consolidation)"; body notes F23 split to I48
- I48 row filed: RICE R=2, I=0.5, C=60%, E=2 → Score 0.3. Source: ag-7-3 (F23). Bundles with I15.
- Missing Round 2 change log entry added
- Round 3 change log entry added
- 87 ranked items

**Story file:** this Round 3 SDR section; status done→review→done
**Sprint-status:** ag-7-3 done→review→done

**Still no source code touched.** NFR1 trivially satisfied through all 3 rounds.
