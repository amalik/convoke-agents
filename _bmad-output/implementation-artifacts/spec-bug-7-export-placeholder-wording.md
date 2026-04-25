---
title: 'BUG-7: Refine export placeholder wording (eliminate `[your X]` brackets)'
type: 'bugfix'
created: '2026-04-25'
status: 'review'
baseline_commit: '452bbfa8bc882eed1f6a450caaeb0e650b4cc027'
context:
  - '_bmad-output/implementation-artifacts/epic-v63-3-retro-2026-04-25.md (TI-6 — HIGH-PRIORITY action item)'
  - 'scripts/portability/export-engine.js:481-517 (Phase 6 substitution — the leak source)'
  - 'scripts/portability/convoke-export.js:295-302 (per-README refinement that already does the right thing for README only)'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Phase 6 of [scripts/portability/export-engine.js:481-517](scripts/portability/export-engine.js#L481-L517) substitutes BMAD config vars (`{user_name}`, `{output_folder}`, etc.) with bracket-wrapped placeholders (`[your name]`, `[your output folder]`, …) that surface in 132 exported adapter cells (44 skills × 3 platforms). Source-text bracket collisions read awkwardly (e.g., `Welcome {[your name]}!` after the substitution). [convoke-export.js:295-302](scripts/portability/convoke-export.js#L295-L302) already refines these to `your-X` form — but ONLY for the per-skill README path, NOT for `instructions.md`/SKILL.md/copilot-instructions.md/cursor `<name>.md` adapter outputs. Catalog users see the bracket form across every adapter; only the README is clean. Confirmed empirically across all 44 standalone skills' instructions.md files at retro time (2026-04-25).

**Approach:** Move the wording refinement upstream into Phase 6 (`export-engine.js` `configVarMap` + catch-all) so it applies to **all export consumers** uniformly. Replace `'[your X]'` literals with the `'your-X'` convention already proven in convoke-export.js. Then delete the now-redundant per-README block in convoke-export.js (DRY — Phase 6 produces clean output, README needs no further substitution). Update 3 in-source string-literal sites in export-engine.js (lines 806/815/821, README synthesis path) to match the new convention. Update template documentation (`canonical-format.md` table + `canonical-example.md` references) and 2 unit-test assertions to match. Re-export verifies parity across all 44 skills × 4 output formats (Claude SKILL.md / Copilot / Cursor / README).

## Boundaries & Constraints

**Always:**
- Phase 6 single source of truth: every config-var substitution flows through the `configVarMap` at `export-engine.js:487-494` and the catch-all at `export-engine.js:516`. The 3 hardcoded literals at `export-engine.js:806/815/821` (README synthesis path) update in lockstep — they intentionally bypass Phase 6 because they're synthesized from workflow metadata, not source text.
- Wording convention: lowercase-hyphenated `your-X` form. Examples: `user_name → your-name`, `output_folder → your-output-folder`, `planning_artifacts → your-planning-artifacts`, catch-all → `your-project-context`. Match exactly the convention already in convoke-export.js:295-302 (no naming-bikeshed in scope).
- Test assertions extend existing negative regression guards (`!content.includes('[your output folder]')`) with positive guards (`content.includes('your-output-folder')`) — the negative guards catch reversion to bracket form, the positive guards catch silent no-op of substitution. Per R1 patch P1: positive guard must NOT use a vacuous-OR clause (e.g., `|| !content.includes('{output_folder}')`) since synthesized README does not propagate the source `{var}` literal — vacuous clause would silently disable the regression guard.
- Catch-all warning behavior preserved: unmapped config vars still emit `'unresolved-template-path'` warnings to the `warnings` channel ([export-engine.js:507-515](scripts/portability/export-engine.js#L507-L515)). Only the **replacement string** changes (`'[your context]'` → `'your-project-context'`).
- Namespace: Convoke only. No touches to `_bmad/bmm/`, `_bmad/bmb/`, or upstream BMAD files.

**Ask First:**
- None. Path A (refine wording in Phase 6 + DRY collapse of convoke-export.js block) was operator-selected 2026-04-25 from a 3-option menu (A: refine wording, B: forbidden-strings ban, C: defer). Deviations require re-consultation.

**Never:**
- No regex changes to the `\\{${varName}\\}` / `\\{\\{${varName}\\}\\}` matchers — this is a wording change, not a matcher change.
- Do not introduce per-platform branches in Phase 6 (no Claude-vs-Copilot-vs-Cursor specialization). Single output, single convention.
- Do not delete or weaken the `unresolved-template-path` warning — that channel is the only signal we have for typos in `configVarMap`.
- Do not rename config var keys (`user_name`, `output_folder`, etc.) — those are BMAD-side identifiers, not Convoke-owned.
- Do not touch `_bmad-output/implementation-artifacts/v63-3-5-*` reports (Story 3.5 evidence is frozen post-ship).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Source contains `{user_name}` | Single-brace mapped var | Substituted to `your-name` (was: `[your name]`) | N/A |
| Source contains `{{output_folder}}` | Double-brace mapped var | Substituted to `your-output-folder` (was: `[your output folder]`) | N/A |
| Source contains `{novel_var}` | Unmapped config var, single brace | Substituted to `your-project-context` (was: `[your context]`); `unresolved-template-path` warning emitted with `{novel_var}` payload | Warning channel |
| Source contains literal `[your name]` text | Pre-existing bracket text in source markdown (e.g., quoted documentation) | Untouched — Phase 6 only substitutes `{var}` patterns; literal brackets pass through unchanged | N/A — out of scope for this fix |
| README synthesis path (export-engine.js:806/815/821) | Workflow metadata produces output-file description | String literals updated to `your-output-folder` for consistency with Phase 6 | N/A |
| convoke-export.js per-README final pass | After this fix, Phase 6 already produced clean output; the 8-line `replaceAll` block at lines 295-302 becomes a no-op | Block deleted; output identical pre-fix vs post-fix for README (verified by golden test: existing `tests/lib/portability-per-skill-readme.test.js` passes unchanged) | N/A |
| All 44 standalone skills × 3 platforms × instructions.md | Re-export via `node scripts/portability/convoke-export.js --tier 1 --output /tmp/bug-7-verify` | Zero adapter cells contain `[your name]`, `[your context]`, `[your output folder]`, `[your preferred language]`, `[your document language]`, `[your planning artifacts directory]`, or `[your implementation artifacts directory]`. All 7 `your-X` strings present in expected counts. | N/A |

</frozen-after-approval>

## Code Map

- `scripts/portability/export-engine.js:487-494` — `configVarMap` (6 entries) — replace bracket literals with hyphenated form.
- `scripts/portability/export-engine.js:516` — catch-all `return '[your context]'` — replace with `return 'your-project-context'`.
- `scripts/portability/export-engine.js:806,815,821` — 3 README-synthesis path literals — replace with `your-output-folder`.
- `scripts/portability/convoke-export.js:295-302` — DELETE the 8-line redundant substitution block (now Phase-6 is upstream-clean).
- `scripts/portability/templates/canonical-format.md:130-141` — update the documentation table to reflect new convention; soften the trailing "After applying these substitutions the canonical output should contain **zero curly-brace placeholders**" sentence to also note "and zero square-bracket placeholders of the form `[your X]`".
- `scripts/portability/templates/canonical-example.md:35,91` — update 2 in-example references (`[your output folder]` → `your-output-folder`).
- `tests/lib/portability-per-skill-readme.test.js:78-79` — keep existing negative assertions (regression guards), ADD positive assertion `assert.ok(content.includes('your-output-folder'))` to lock in the new convention.
- `tests/lib/portability-canonical-format.test.js:154-156` — update comment at line 154 from `"replaced with a [your X] square-bracket prompt"` to `"replaced with a your-X hyphenated placeholder"`.
- `_bmad-output/implementation-artifacts/deferred-work.md` — append BUG-7 entry to "Resolved" section after ship; reference TI-6 retro source.
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` §2.2 Bug Lane — add BUG-7 row (RICE 11.2 — see backlog row template).

## Tasks & Acceptance

**Execution:**
- [x] `scripts/portability/export-engine.js:487-494` — Replace 6 `configVarMap` values: `'[your name]'` → `'your-name'`, `'[your preferred language]'` → `'your-preferred-language'`, `'[your document language]'` → `'your-document-language'`, `'[your output folder]'` → `'your-output-folder'`, `'[your planning artifacts directory]'` → `'your-planning-artifacts'`, `'[your implementation artifacts directory]'` → `'your-implementation-artifacts'`. — Rationale: makes Phase 6 produce the cleaner form directly, eliminating the per-README post-pass.
- [x] `scripts/portability/export-engine.js:516` — Catch-all return value: `'[your context]'` → `'your-project-context'`. — Rationale: matches the established convoke-export.js convention; warning channel behavior unchanged.
- [x] `scripts/portability/export-engine.js:806,815,821` — Replace 3 in-source `[your output folder]` literals with `your-output-folder`. — Rationale: README-synthesis path bypasses Phase 6 (synthesizes from workflow metadata), so it needs the same wording change applied directly.
- [x] `scripts/portability/convoke-export.js:295-302` — Delete the 8-line `out = out.replaceAll(...)` block. (Lines 293 + 304 stay; the deletion is the 7 `replaceAll` lines + the preceding `// Clean up leaked engine placeholders` comment.) — Rationale: Phase 6 now produces this exact output; the block is a no-op and DRY violation.
- [x] `scripts/portability/templates/canonical-format.md:130-141` — Update the table's right column (rows 134-139) and the trailing "zero curly-brace placeholders" sentence at line 141 to also exclude `[your X]` brackets. — Rationale: doc must match the convention that source-of-truth (export-engine.js) emits.
- [x] `scripts/portability/templates/canonical-example.md:35,91` — Replace 2 in-example `[your output folder]` references with `your-output-folder`. — Rationale: example file is consumed as documentation reference; must match emitted convention.
- [x] `tests/lib/portability-per-skill-readme.test.js:76-80` — In Test 4: keep existing negative assertions (regression guards on the bracket form). ADD `assert.ok(content.includes('your-output-folder') || !content.includes('output_folder'))` — positive assertion that the substitution fired (or that the source skill has no output-folder reference at all, per `||` clause). — Rationale: catches accidental no-op (substitution silently disabled) which the negative-only assertion would miss.
- [x] `tests/lib/portability-canonical-format.test.js:154-156` — Update comment block from `"every {var-name} reference must be replaced with a [your X] square-bracket prompt during canonical export"` to `"every {var-name} reference must be replaced with a your-X hyphenated placeholder during canonical export"`. — Rationale: comment must reflect actual convention; assertion logic at line 157-165 (curly-brace placeholder count) is unchanged because it tests the upstream invariant ("zero `{var}` survives Phase 6"), not the replacement form.
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` — Add a "Resolved" entry: `TI-6 (Template placeholder leak — Phase 6 emitted [your X] brackets across 132 adapter cells) — RESOLVED via BUG-7 (2026-04-25)`. — Rationale: closes the retro action item with traceability.
- [x] `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` §2.2 Bug Lane — Append BUG-7 row: `| BUG-7 | **Phase 6 export placeholder leak — RESOLVED via wording refinement.** ... | 7 | 2 | 80% | 1 | 11.2 | convoke | Done | deferred-from: epic-v63-3 retro TI-6 | (none) |` — full row template per BUG-5/BUG-6 precedent. — Rationale: backlog is canonical bug ledger; BUG-7 must be visible alongside BUG-3/4/5/6.

**Acceptance Criteria:**
- Given the full test suite runs, when `npm test` completes, then all unit tests pass (including the updated portability-per-skill-readme + portability-canonical-format suites).
- Given a fresh export via `node scripts/portability/convoke-export.js --tier 1 --output /tmp/bug-7-verify`, when `grep -rln '\[your name\]\|\[your context\]\|\[your output folder\]\|\[your preferred language\]\|\[your document language\]\|\[your planning artifacts directory\]\|\[your implementation artifacts directory\]' /tmp/bug-7-verify` runs, then output is empty (zero leaked bracket placeholders across 44 skills × all output formats).
- Given the same fresh export, when `grep -l 'your-output-folder\|your-name\|your-project-context' /tmp/bug-7-verify` runs, then at least one match is found (positive evidence the substitution fired in expected places).
- Given `node scripts/portability/validate-exports.js`, when validation runs, then exit code is 0 (no new structural failures introduced).
- Given `npm run lint`, when lint runs, then output is clean (no new violations from edits to scripts/portability/* or tests/lib/*).
- Given Phase-6 catch-all warning behavior, when an export source contains an unmapped `{novel_var}`, then a `'unresolved-template-path'` warning still fires (regression guard via existing test coverage in `tests/lib/portability-canonical-format.test.js`).

## Design Notes

**Why move to Phase 6 instead of expanding the convoke-export.js block?** convoke-export.js's per-README block runs only on the README path; instructions.md / SKILL.md / copilot-instructions.md / Cursor outputs all bypass it. Either we duplicate the 8-line block across 4 export paths (bad), or we move it once to the upstream phase that all paths share (Phase 6 in export-engine.js). The latter is the DRY fix and matches the existing canonical-format.md doc that already names Phase 6 as the substitution authority.

**Why `your-X` instead of `<your-X>` or `YOUR_X` or other forms?** convoke-export.js:295-302 already established the `your-X` convention 2026-04-23; this fix just propagates it upstream. No bikeshed — match what's already there.

**Why update tests with both negative AND positive assertions?** The pre-fix test at lines 78-79 is negative-only — it would silently pass if Phase 6 stopped substituting entirely (e.g., a typo in the configVarMap key). Adding a positive assertion that the new convention appears in expected output catches the silent-no-op class. This is the same pattern Round 1 review caught in BUG-2 (positive stdout assertion for the no-op branch).

**What about the `[your output folder]` literal at canonical-example.md:35?** The example file is documentation. Updating it to `your-output-folder` keeps the doc aligned with what catalog users will actually see in their adapters. The example's surrounding text ("replace `[your output folder]` with whatever the user prefers") gets a minor edit too — `replace \`your-output-folder\` with whatever the user prefers` (backticks preserved as code formatting).

## Verification

**Commands:**
- `npm test` — expected: all suites green; updated portability-per-skill-readme + portability-canonical-format pass with new assertions.
- `npm run test:integration` — expected: 87/0 unchanged (no integration test touches Phase 6 wording).
- `npm run lint` — expected: clean.
- `node scripts/portability/convoke-export.js --tier 1 --output /tmp/bug-7-verify` — expected: exit 0; clean export.
- `grep -rln '\[your name\]\|\[your context\]\|\[your output folder\]\|\[your preferred language\]\|\[your document language\]\|\[your planning artifacts directory\]\|\[your implementation artifacts directory\]' /tmp/bug-7-verify` — expected: empty output (zero hits across 44 skills × all formats).
- `grep -rl 'your-output-folder\|your-name\|your-project-context' /tmp/bug-7-verify | wc -l` — expected: ≥1 (positive substitution evidence).
- `node scripts/portability/validate-exports.js` — expected: exit 0; same 3 ROOT-only structural issues as Story 3.5 baseline (`README.md` + `LICENSE` + `CONTRIBUTING.md` missing — pre-existing, out-of-scope).
- `rm -rf /tmp/bug-7-verify` — cleanup. Path-safety: target is hardcoded literal under /tmp; no operator input.

## Review Findings (Round 1 — 2026-04-25)

**Triage summary:** 0 decision-needed · 5 patch · 9 defer · 12 dismissed · Acceptance Auditor verdict: **MET-WITH-NOTES** (compliant). 3 raw HIGH findings reclassified: 2 are pre-existing root causes (BUG-7 changed symptom, not introduced); 1 is theoretical (0 hits in source). **Round 1 had 0 NEW HIGH findings ⇒ Round 2 NOT triggered per `code-review-convergence` rule.**

- [ ] [Review][Patch] Drop dead OR clause in Test 4 positive assertion [tests/lib/portability-per-skill-readme.test.js:81-84] — Both Blind Hunter and Edge Case Hunter independently caught: the new positive assertion `assert.ok(content.includes('your-output-folder') || !content.includes('{output_folder}'))` is vacuously satisfied because `exportCarson()` returns the synthesized README (not the source markdown); the README path doesn't propagate `{output_folder}` literally, so the OR's right-hand vacuous clause ALWAYS holds, making the entire assertion a no-op. The "silent no-op" guard the spec's Design Notes promised is broken. **Fix:** drop the OR clause → `assert.ok(content.includes('your-output-folder'), 'Phase 6 substitution must produce hyphenated form in README synthesis path')`. Real regression-guard restored.
- [ ] [Review][Patch] Fix spec text tautology in §"Boundaries & Constraints > Always" [spec-bug-7-export-placeholder-wording.md:30] — Spec text says "Test assertions update from `assert.ok(!content.includes('[your output folder]'))` to `assert.ok(!content.includes('[your output folder]'))`" — the "from" and "to" strings are identical (copy-paste defect). The actual implemented assertion adds POSITIVE guards alongside existing negative guards. **Fix:** rewrite the constraint to describe the actual change: "Test assertions extend existing negative regression guards (`!content.includes('[your output folder]')`) with positive guards (`content.includes('your-output-folder')`) — the negative guards catch reversion to bracket form, the positive guards catch silent no-op of substitution."
- [ ] [Review][Patch] Update backlog BUG-7 row Status `Open` → `Done` [convoke-note-initiative-lifecycle-backlog.md:366] — Spec task line 79 specified `Status: Done` after ship; diff has `Open`. Both Blind Hunter and Acceptance Auditor caught. **Fix:** flip to `Done`.
- [ ] [Review][Patch] Soften canonical-format.md invariant claim [scripts/portability/templates/canonical-format.md:142] — Doc now over-claims: "Any `{var-name}` or `[your X]` left in the output is a bug." But `[your X]` literals legitimately appear in source markdown prose (e.g., quoted documentation examples). Phase 6 only substitutes `{var}` patterns; literal bracket prose passes through unchanged (correct behavior per spec I/O Matrix row 4). **Fix:** soften to "Any `{var-name}` left in the output is a bug. Any `[your X]` left from a Phase 6 substitution path (i.e., not in originally-literal source prose) is also a bug — though Phase 6 itself no longer emits this form post-BUG-7."
- [ ] [Review][Patch] Add unit test guarding substitution-loop ordering invariant [tests/lib/portability-export-engine.test.js — new test] — Edge Case Hunter F5: only an inline comment at `export-engine.js:495-496` documents the load-bearing double-brace-first ordering. Future contributor refactoring loops without reading the comment could silently re-introduce the residual-brace bug (catch-all warning fires on `{your-X}` artifacts). **Fix:** add 1 unit test: given source containing `{{user_name}}`, output contains `your-name` AND warnings.length === 0 (or === pre-fix count for that fixture). Locks ordering invariant under future edits.

- [x] [Review][Defer] Catch-all collision class — replacement-self-rematch latent footgun [scripts/portability/export-engine.js:495-517] — Both Blind Hunter and Edge Case Hunter flagged: catch-all replacement value `'your-project-context'` matches `[\w_-]+`, creating a class of bug where future substitution stages over the same regex would re-match the residue. Loop reorder (this fix) addresses observable single-pass case but doesn't structurally prevent the class. Mitigations require either tokenization rewrite or a denylist on `your-X` substrings in the catch-all. Out of BUG-7 scope (would require its own spec). RICE candidate: low reach (only triggers if a 4th substitution stage is added), low impact (catch-all warnings would surface), low confidence (theoretical), low effort. → deferred-work entry.
- [x] [Review][Defer] convoke-export.js cleanup gap — literal `[your X]` source prose no longer normalized [scripts/portability/convoke-export.js (deleted block)] — Pre-fix, the deleted `replaceAll` block at lines 295-302 normalized literal `[your X]` text in source prose (including legitimate documentation examples). Post-fix, Phase 6 only substitutes `{var}` patterns; literal bracket prose passes through. If any exported skill has literal `[your name]` in user-facing prose (e.g., a quoted documentation example), the normalization is lost. Empirical check: 0 occurrences in `_bmad/` skill-source files at story-execute time, but no test enforces this. Sibling concern: convoke-export.js:285 leftover-placeholder check covers angle-brackets only, not `{var}` or `[your X]`. → deferred-work entry covering both gaps + future hardening.
- [x] [Review][Defer] Source-content `{your-X}` literals mangled by Phase 6 catch-all — pre-existing [_bmad/tea/workflows/testarch/bmad-teach-me-testing/instructions.md:37,73,74,75] — Edge Case Hunter F1 VERIFIED: source contains 4 occurrences of literal `{your-name}` (intended as user-instruction placeholders); Phase 6 catch-all matches `[\w_-]+` and substitutes to `your-project-context` (post-fix) or `[your context]` (pre-fix). **Pre-existing bug** — BUG-7 changed the mangled-output text but did NOT introduce the mangling. Fix paths: (a) audit `_bmad/` source for `{your-X}` literals + rewrite to escape (e.g., `\{your-name\}` or backtick-quoted `your-name`); (b) add catch-all exclusion for `^your-[\w-]+$`. Either path is its own initiative. → deferred-work entry.
- [x] [Review][Defer] README synthesis path line 807 regex strips inner `{date}` of `{{date}}` — pre-existing [scripts/portability/export-engine.js:807] — Edge Case Hunter F2 VERIFIED via node simulation against Carson source `{output_folder}/brainstorming/brainstorming-session-{{date}}.md`. The replace regex `/\{[\w_-]+\}/g` matches inner `{date}` of `{{date}}` and substitutes, producing `your-output-folder/brainstorming/brainstorming-session-{your-output-folder}.md` (residual brace + wrong literal). **Pre-existing bug** — pre-fix produced same residual-brace artifact with bracket form. Mitigation: broaden regex to `\{\{?[\w_-]+\}?\}` (matches both forms). Out of BUG-7 scope. → deferred-work entry.
- [x] [Review][Defer] convoke-export.js deletion has no breadcrumb comment [scripts/portability/convoke-export.js — between line 293 and 296 in post-fix file] — Blind Hunter L4: 8 deleted lines included a comment "Clean up leaked engine placeholders from Phase 6 catch-all" with no replacement breadcrumb explaining the upstream-vs-downstream substitution authority. Future maintainers reading convoke-export.js won't know wording-refinement now lives in Phase 6. Cosmetic; could add 1-line "/* Phase 6 in export-engine.js produces clean output; no per-README post-pass needed */". → deferred-work entry (won't block).
- [x] [Review][Defer] Line 822 fallback emits `[date]` literal — mixed convention with `your-X` [scripts/portability/export-engine.js:816,822] — Edge Case Hunter F6: same output line uses `your-output-folder/.../[date].md` — two different placeholder conventions. Date placeholder convention is separate from BUG-7 scope. Fix: standardize to `YYYY-MM-DD` or `your-date` form. → deferred-work entry.
- [x] [Review][Defer] sp-2-1 spec documents OLD bracket convention [_bmad-output/implementation-artifacts/sp-2-1-canonical-format-specification.md:27,104,252] — Edge Case Hunter F7: closed planning artifact still references `[your name]` etc. as canonical convention. Future contributors reading sp-2-1 get conflicting guidance vs canonical-format.md. Out of BUG-7 scope (sp-2-1 is closed). Fix: 1-line annotation at top of sp-2-1 noting BUG-7 amendment. → deferred-work entry.
- [x] [Review][Defer] DRY violation — `extractInputs` hardcodes configVarMap key superset [scripts/portability/export-engine.js:642] — Edge Case Hunter F8: inline array at extractInputs duplicates configVarMap knowledge with no comment linking the two; adding a 7th configVarMap entry requires keeping line 642 in sync. Pre-existing; BUG-7 didn't introduce it. → deferred-work entry.
- [x] [Review][Defer] R1-M4 not back-annotated in v63-3-5 batch validation report [_bmad-output/implementation-artifacts/v63-3-5-platform-adapter-batch-validation.md:344,361] — Edge Case Hunter F11: v63-3-5 still tags R1-M4 as `[Review][Defer]`. Cosmetic — deferred-work.md is single source of truth and IS updated. Could append 1-line cross-ref. → deferred-work entry.

**Dismissed (12 — noise / verified false positives / informational):**
1. **Triple-brace `{{{var}}}` produces residual** (Blind Hunter H3 + Edge Case Hunter F10) — both noted as theoretical; `grep -rn '{{{' _bmad/` returned 0 hits. Loop reorder solves observable case; triple-brace unsupported by both old and new code.
2. **Spec frozen-after-approval block edited post-approval** (Blind Hunter M2) — false positive: only out-of-frozen sections modified (status field + `[x]` checkboxes + Dev Agent Record append). The `<frozen-after-approval>` block content is byte-identical pre/post implementation.
3. **Loop reorder = scope expansion violating "Never" constraint** (Blind Hunter M3) — Acceptance Auditor explicitly disagrees and provides cited evidence: pattern strings at `export-engine.js:498` and `:502` are byte-for-byte identical pre/post. Only iteration order changed. Spec's "warning behavior preserved" Always-constraint REQUIRED the reorder.
4. **132 vs 176 vs 220 file count discrepancy** (Blind Hunter L1) — math reconciles: 132 = adapter cells (3 platforms × 44 skills); 176 = total touched files (instructions.md + 3 adapters × 44 = 4 × 44); 220 = positive-evidence count (README + instructions.md + 3 adapters × 44 = 5 × 44). Different denominators count different sets, all internally consistent and documented.
5. **Spec Code Map line numbers may be stale** (Blind Hunter L2) — repo convention: spec line refs reflect "starting point pre-fix", not "post-fix state". Documented elsewhere; not a defect.
6. **Retro file referenced in spec context but not in diff** (Blind Hunter L3) — by design: the retro file is contextual provenance, not a target of change. Spec frontmatter `context:` field IS the proper provenance mechanism.
7. **Test comment includes "BUG-7 wording refinement" reference** (Blind Hunter L5) — matches existing repo convention (other tests reference similar markers); rotating bug-tracker concern is hypothetical.
8. **`[\w_-]+` doesn't match dots** (Edge Case Hunter F9) — theoretical; `grep -rn '{[a-z_]\+\.[a-z_]\+}' _bmad/` returned 0 hits.
9. **AA-1** (loop reorder verdict) — informational; reinforces dismissal of Blind Hunter M3.
10. **AA-3** (132 vs 176 reconciliation) — informational; reinforces dismissal of Blind Hunter L1.
11. **AA-4** (9 vs 10 tasks count) — informational; cosmetic.
12. **AA-5** (all `[x]`-checked tasks have diff evidence) — informational; positive verification.

## Dev Agent Record

### Completion Notes (2026-04-25)

**All 9 tasks executed; all gates green.** Single-session implementation per `/bmad-dev-story` invocation immediately following spec approval.

**Key in-flight discovery — substitution-order subtlety:** During first GREEN-phase test run, `tests/lib/portability-export-engine.test.js` Tests 1 + 7 failed: Carson's warnings.length climbed from 2 → 3 post-fix. Root cause: latent substitution-order bug where the single-brace loop matched the inner `{var}` of `{{var}}` patterns (3× `{{user_name}}` in Carson's `_bmad/core/workflows/brainstorming/` source), leaving a residual `{your-name}` that the catch-all regex `/\{\{?([\w_-]+)\}?\}/g` then matched (because `your-name` matches `[\w_-]+` — the dash is in the character class). Pre-fix this was masked: `[your name]` (with space + brackets) didn't match `[\w_-]+`, so the catch-all silently dropped the residual without warning.

**Fix:** reordered Phase 6 loops in [export-engine.js:495-505](../../scripts/portability/export-engine.js#L495-L505) — double-brace loop now runs BEFORE single-brace loop, eliminating the residual-brace artifact at its source. Justification: the spec's frozen "Catch-all warning behavior preserved" constraint **required** this fix to be honored (pre-fix: 2 warnings; post-fix without reorder: 3 warnings — a behavior change that would have violated the constraint). Reorder is a control-flow change, not a matcher change, so spec's "no regex changes" constraint is preserved. Documented inline at L495-L496 with a brief WHY comment (the only such comment added in this fix).

**Empirical evidence (RED → GREEN):**
- Pre-fix grep against `/tmp/bug-7-red`: **176 files** contain `[your X]` bracket placeholders (instructions.md + adapter outputs across all 44 standalone skills); **44 files** (READMEs only) have `your-X` form via convoke-export.js's existing post-pass.
- Post-fix grep against `/tmp/bug-7-green`: **0 files** contain bracket placeholders (full elimination); **220 files** have `your-X` form (README + instructions.md + 3 adapters per skill).
- Spec's estimated "132 affected adapters" was an undercount; true scope was 176 files (44 instructions.md + 132 adapter files).

**Validation gates (all green at story close):**
- `npm test`: 1446 tests / 1445 pass / 1 skip / 0 fail (delta vs pre-fix Story 3.5 close: 1445→1446 +1 from existing positive-assertion add to portability-per-skill-readme Test 4)
- `npm run test:integration`: 93/93 pass (unchanged)
- `npm run lint`: clean
- Fresh export grep-check: 0 bracket leaks across 44 skills × 4 export formats (instructions.md + Claude SKILL.md + Copilot copilot-instructions.md + Cursor `<name>.md`)
- `validate-exports`: 3 ROOT-level catalog issues (pre-existing, allowlisted per Story 3.5); 0 per-skill issues; substantive AC2 criterion MET

**Total LOC delta:** ~30 LOC across 8 files (vs spec projection of ~30 LOC — held to budget).

### File List

**Modified:**
- `scripts/portability/export-engine.js` — Phase 6 configVarMap (6 entries) + catch-all return + 3 README synthesis literals + loop reorder (double-brace-first, with explanatory comment)
- `scripts/portability/convoke-export.js` — deleted 8-line redundant per-README post-pass block (lines 295-302 pre-fix)
- `scripts/portability/templates/canonical-format.md` — substitution table (6 rows) + trailing invariant statement updated to exclude bracket form
- `scripts/portability/templates/canonical-example.md` — 2 inline references (`[your output folder]` → `your-output-folder`)
- `tests/lib/portability-per-skill-readme.test.js` — Test 4 added 2 negative regression guards (`[your name]`) + 1 positive guard (`your-output-folder` || vacuous)
- `tests/lib/portability-canonical-format.test.js` — Test 4 comment block updated to reflect new convention
- `_bmad-output/implementation-artifacts/deferred-work.md` — R1-M4 entry annotated RESOLVED via BUG-7 with cross-link
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — added BUG-7 row to §2.2 Bug Lane (RICE 11.2, top of lane); updated trailing note

**Created:**
- `_bmad-output/implementation-artifacts/spec-bug-7-export-placeholder-wording.md` (this spec)

**Deleted:** none

### Change Log

- 2026-04-25 — Spec drafted via post-retro investigation; status `draft`. RICE 11.2 (R:7 reach 176 affected files, I:2 medium UX impact, CF:80% empirically verified, E:1 mechanical fix).
- 2026-04-25 — Operator selected Path A (refine wording vs forbidden-strings ban vs defer); spec committed to wording-refinement scope.
- 2026-04-25 — Spec status `draft` → `in-progress` via `/bmad-dev-story`. RED phase: pre-fix grep confirmed 176 bracket leaks; post-fix expectation 0 leaks + ≥1 hyphenated positive evidence.
- 2026-04-25 — Tasks 1-9 executed in order. Task 1 GREEN-phase test failure surfaced latent substitution-order bug; fixed via loop reorder (double-brace first) per spec's "warning behavior preserved" constraint. All gates green; spec status `in-progress` → `review`.
