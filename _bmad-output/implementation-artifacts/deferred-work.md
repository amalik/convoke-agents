# Deferred Work — Code Review Findings

This file collects code-review findings that were classified as `defer` —
real issues, but pre-existing or out of scope for the story under review.

---

## Deferred from: code review of v63-5b-1-author-and-validate-changelog (2026-04-27 R1+R2)

R1+R2 review — R1 mandatory (8 patches across 3 layers); R2 mandatory per `code-review-convergence` rule (R1 had 1 HIGH); R2 converged with 1 patch (wording-only, no structural changes → R3 NOT triggered). Final cumulative: 7 patches (6 R1 + 1 R2) + 2 deferred + 9 dismissed (5 R1 + 4 R2 — multiple LOWs across both rounds).

- **D-V5B1-R2-1 — "That's it." voice-register tension in Documentation bullet (Blind R2-L2)** — CHANGELOG Documentation bullet ends with "Run `convoke-update`. That's it." which has same too-glib voice as cliché-list watches for ("nothing flashy" was already on list). Not a cliché-regex hit (FR42 grep stays at zero); voice-drift only. **Fix scope:** ~1-line rewording in CHANGELOG.md to "One page; the upgrade is a single `convoke-update` invocation" for consistency with sibling bullet sobriety. → backlog (cosmetic; CHANGELOG ships with current voice; future amendment if Sophia or operator surfaces friction).
- **D-V5B1-R2-2 — Playbook prose fragility on future editor inlining literal `TODO-5B3-` (Edge R2-L1)** — Story 5A.2's playbook prose at lines 148-153 currently uses `(todo-tag-prefix)-` placeholder pattern + recommended grep that uses narrower anchors (`SECTION-D:` etc.) — works correctly today (verified empirically: `grep -r "TODO-5B3"` returns exactly 4 hits, all live markers). However a future editor "simplifying" the prose to inline the literal `TODO-5B3-` prefix would re-introduce false-positive grep matches. **Fix scope:** add ~1-line HTML comment at line 148 warning future editors not to inline the literal prefix. → backlog (preventive ergonomic; not breaking).

---

## Deferred from: code review of v63-5a-2-create-strategic-adr-and-playbook-outline (2026-04-27 R1)

R1 review (3 layers — Auditor verdict ALL_AC_MET with 0 findings; Blind 12 + Edge 3 = 15 raw → 8 patches + 2 deferred + 5 dismissed). **R2 NOT triggered** per `code-review-convergence` rule (R1 had **0 HIGH** — second consecutive R1-only convergence in v6.3 stream after Story 5A.1; pure-docs minimal defect surface).

- **D-V5A2-R1-1 — `outline_complete` flag naming inverted at completion (Blind M3)** — frontmatter key flips from `outline_complete: true` (outline shipped) to `outline_complete: false` (full playbook ships) at Story 5B.3 close. The semantic reading is "this is no longer just an outline" but a reader encountering `false` may misread as "outline is incomplete." Decision call, not defect; revisit if friction surfaces. **Fix scope:** rename to `is_outline_only` (true=outline phase, false=complete) OR `playbook_phase: outline|complete` enum, ~5 LOC + Story 5B.3 spec amendment if pursued. → backlog if a future v4.x maintainer flags confusion.
- **D-V5A2-R1-2 — "Winston (architect)" ambiguity in external-facing ADR (Blind L5)** — Winston is the BMAD architect persona; in the Convoke project context this is unambiguous, but `docs/adr/adr-bmad-coupling-v4.0.md` is ecosystem-facing where external readers may not have that context. Precedent ADR (`convoke-adr-repo-organization-conventions-2026-03-22.md`) also names "Winston (architect)" as Decision Maker; aligning with precedent over-rides external ambiguity concern. **Fix scope:** add a single-line glossary footnote in ADR ("Winston is Convoke's architect persona — see `_bmad/_vortex/agents/architect.md`") OR amend Decision Makers row to "Amalik (project lead) + Winston (architect persona)". ~2 LOC. → backlog if external-reader feedback surfaces.

---

## Deferred from: code review of v63-5a-1-run-sprint-1-experiments-and-log-decisions (2026-04-27 R1)

R1 review (3 layers — Auditor verdict ALL_AC_MET with 1 spec-internal-contradiction MED). 18 raw findings → 7 patches applied + 4 deferred + 3 dismissed. **R2 NOT triggered** per `code-review-convergence` rule (R1 had 0 HIGH). Cleanest review of v6.3 stream — pure docs minimal defect surface.

- **D-V5A1-R1-1 — Tool field path abbreviation cosmetic (Blind L2)** — EXP1 design `Tool:` field at `convoke-note-sprint-1-experiments.md:21` reads `scripts/update/migrations/3.3.x-to-4.0.0.js (scripts/update/migrations/3.0.x-to-4.0.0.js + 3.1.x-to-4.0.0.js + 3.2.x-to-4.0.0.js thin wrappers extend chain coverage post-R1)`. Parenthetical mixes parallel-list with verb-phrase; first wrapper path repeated in full while next two abbreviated. Reads as hasty patch. **Fix scope:** ~5 LOC rewrite of the Tool: field for cleaner prose. → backlog (cosmetic; doesn't affect comprehension).
- **D-V5A1-R1-2 — Verdict capitalization consistency in YAML mapping (Blind L4)** — `experiment_verdicts: {EXP1: PASS, EXP2: PASS, EXP3: PASS}` flattens prose-level qualifiers (PASS via Path C; PASS cited from standing artifact). Either encode qualifiers in YAML (e.g., `EXP1: {verdict: PASS, qualifier: binary}`) or accept the flattening (current state). **Fix scope:** schema decision + ~10 LOC if encoded. → backlog (taste call; current flat form is downstream-dashboard-friendly).
- **D-V5A1-R1-3 — "sorted lexicographic" rationale strengthening (Blind L6)** — for the 3-key set EXP1/EXP2/EXP3, lexicographic + numeric + insertion order all collide identically. The OS-1 V-pass rationale ("sorted lexicographic for deterministic YAML") is correct but untestable from this artifact (would need a counter-example). **Fix scope:** ~5 LOC clarifying note in Decision 1 OR future-proof for >9 experiments scenario. → backlog (rationale strength; not a defect).
- **D-V5A1-R1-4 — `experiment_verdicts` bare-word YAML 1.1 future-proofing (Edge L2)** — `{EXP1: PASS, ...}` parses correctly today (PASS is a string), but YAML 1.1 implicit typing rules would parse `Y`/`N`/`YES`/`NO`/`ON`/`OFF` as booleans if a future experiment yielded those values. **Fix scope:** quote scalar values (`{EXP1: "PASS"}`). → backlog (future-proof; not load-bearing today).

---

## Deferred from: spec of v63-4-4-create-drift-snapshot-workflow (2026-04-26)

Story 4.4 Decision 5 deferred slash-command-skill wrapper per Story 4.2 PF1-tooling precedent (release-engineering tooling, not Convoke-user-facing per Operator Covenant operator/user distinction).

- **D-V44-1 — `/bmad-drift-snapshot` slash-command skill wrapper deferred per Story 4.4 Decision 5** — Story 4.4 ships drift-snapshot as bare CLI per Story 4.2 PF1-tooling precedent (release-engineering tooling, not Convoke-user-facing). `slash-command-ux-for-user-facing-tools` rule technically applies but is overridden by precedent grounded in Operator Covenant operator/user distinction. **Trigger to lift deferral:** if a future v4.x retrospective surfaces operator friction with bare CLI invocation OR if Convoke users (not just maintainers) start needing drift-snapshot for their own skill development. **Fix scope:** ~50 LOC skill wrapper at `.claude/skills/bmad-drift-snapshot/SKILL.md` + workflow.md that delegates to `scripts/audit/drift-snapshot.js`. Time: ~30 min. → fast-lane Initiative-backlog item if triggered.

---

## Deferred from: code review of v63-4-4-create-drift-snapshot-workflow (2026-04-27 R2)

R2 review (3 layers — Auditor verdict ALL_R1_PATCHES_LANDED + NO NEW AC VIOLATIONS). Findings: 16 raw → 10 patches applied + 4 deferred. R3 NOT triggered per `code-review-convergence` rule (R2 patches additive: guards, sanitizers, validators; no new files, no renamed functions, no fundamentally altered control flow).

- **D-V44-R2-1 — `lineDiff` builds full O(m·n) DP matrix with no upper bound (Blind R2-L2)** — large recordings (>500 lines × 4 prompts × 5 skills) materialize ~70 MB heap with no progress signal. Story 4.4 fixtures are small; release-time recordings via Story 4.3 typically <200 lines per prompt. **Fix scope:** ~10 LOC length-guard with stderr warning OR Hunt–Szymanski-style optimization. → backlog if real-recording perf surfaces friction.
- **D-V44-R2-2 — `-pre.md` suffix accepted but never produced by canonical tooling (Blind R2-L3)** — `stripSuffix` regex includes `-pre.md` alongside `-baseline.md` / `-post.md`. Operator confusion potential between `-baseline.md` and `-pre.md`. **Fix scope:** ~2 LOC: drop `-pre\.md$` alternation OR document the alias in protocol. → backlog (UX nicety).
- **D-V44-R2-3 — `--skills` case-sensitive error doesn't hint at case mismatch (Edge R2-L1)** — `--skills EMMA,JOHN` returns "unknown keys: EMMA, JOHN" without suggesting the correct case. **Fix scope:** ~10 LOC case-insensitive comparison fallback in error message: `(did you mean: emma, john?)`. → backlog (UX nicety).
- **D-V44-R2-4 — Test 8 / DEFAULT_SKILLS literal-value test is now in place but other "deep-equal-itself" patterns may exist (Auditor R2-M1 follow-through)** — R2 Test 8 patch added literal assertion `['emma','john','winston']`. Sweep other tests for similar circular-reference patterns (e.g., constants compared to themselves). **Fix scope:** ~30 min test review + targeted patches as needed. → backlog (test-quality sweep candidate).

---

## Deferred from: code review of v63-4-4-create-drift-snapshot-workflow (2026-04-27 R1)

R1 review (3 layers — Blind Hunter / Edge Case Hunter / Acceptance Auditor) — Auditor verdict ALL_AC_MET. Findings: 31 raw → 14 patches applied + 5 deferred + 1 dismissed. R2 mandatory per convergence rule (R1 had 3 HIGH).

- **D-V44-R1-1 — `getTodayDate` uses UTC, not local time (CR-L1)** — `new Date().toISOString().slice(0, 10)` returns UTC date. Operator running at 9pm PDT on April 25 gets `2026-04-26` in artifact `created:` field — surprising for human reviewers. Documented as protocol-doc caveat at story-close (operator can pass explicit `--date` to control). Could switch to locale-aware date if friction surfaces. **Fix scope:** ~5 LOC in `getTodayDate()` to use `toLocaleDateString('sv-SE')` (Swedish locale gives ISO format) OR document UTC behavior in protocol. → backlog if friction surfaces.
- **D-V44-R1-2 — No `--help`/`-h` handler; unknown flags silently ignored (CR-L4)** — `parseArgs` switch has no default case; `--help` does nothing and a default run executes. `--skil emma` (typo) silently runs default 3-skill set. Operator UX nice-to-have; not breaking. **Fix scope:** ~15 LOC for `--help` text + `default:` case rejecting unknown flags. → backlog if friction surfaces.
- **D-V44-R1-3 — `atomicWrite` not atomic across concurrent invocations (CR-L5)** — `tmpPath = ${outputPath}.tmp` is fixed; two parallel runs race on the same tmp file. No concurrent invocations expected for release-time tool, but theoretically unsafe. **Fix scope:** ~3 LOC: `tmpPath = ${outputPath}.${process.pid}.tmp`. → backlog (low risk).
- **D-V44-R1-4 — `atomicWrite` leaves stale `.tmp` on rename failure (CR-M10)** — try/catch maps any error to `exitCode=3`, doesn't clean up the leftover `.tmp` file on rename failure. Cosmetic; doesn't affect correctness. **Fix scope:** ~5 LOC try/catch around `renameSync` + `fs.unlinkSync(tmpPath)` in catch. → backlog (low risk).
- **D-V44-R1-5 — Test coverage for `checkPathSafety` symlink rejection (CR-H3 follow-up)** — R1 patch added `fs.realpathSync` to defeat symlink escapes; no unit test verifies this empirically. Edge Case Hunter reproduced the bug live during R1; a regression test would prevent re-introduction. **Fix scope:** ~15 LOC test that creates a temp symlink under `_bmad-output/`, points it outside project, asserts `checkPathSafety` throws `exitCode=4`. Cross-platform symlink tests can be brittle (Windows requires admin); guard with `process.platform !== 'win32'` skip. → backlog or follow-up amendment.

---

## Deferred from: V-pass of v63-4-3 (caught Story 4.2 surface bug — 2026-04-26)

V-pass on Story 4.3 caught a defect in already-shipped Story 4.2. Per Q2=A operator decision, defect routed to follow-up bug item rather than re-opening Story 4.2 R3 (which the convergence rule wouldn't have allowed anyway since R2 was additive).

- **D-V42-R3-1 — Battery `--dry-run` exits 0 silently on missing recordings (should exit 5)** — `scripts/audit/pf1-validation-battery.js` `main()` loads agentRecordings BEFORE `if (args.dryRun)` check; when recordings missing, `loadAgentRecordings` throws `exitCode: 5` which propagates to outer catch that sets `process.exit(err.exitCode)`. Empirical V-pass result: `node scripts/audit/pf1-validation-battery.js --dry-run` with no recordings prints `Error: Recording missing: ...` then **exits 0** (not 5 as Story 4.2 Completion Notes claimed). Operator's dry-run smoke-check would silently pass. **Root cause:** likely the catch handler calling `process.exit(err.exitCode !== undefined ? err.exitCode : 99)` is correct, BUT main() returns before reaching the catch on the load-error path — need to investigate. **Fix scope:** ~5 LOC to add try/catch in main() around the up-front loadAgentRecordings calls + ensure dry-run error path exits 5. Plus a unit test asserting `node scripts/audit/pf1-validation-battery.js --dry-run` with empty fixture dirs exits 5. Story 4.3 Task 6.2 works around by checking stdout for `Error:` lines. → fix-needed bug for next Story 4.2 amendment OR consolidated v6.3 patch round.

---

## Deferred from: code review of v63-4-2-create-pf1-validation-battery-harness (2026-04-26 R1+R2)

**R1+R2 review (3 layers each round) — convergence at R2.** R1: ~30 raw findings → 6 patches + 6 defers + 3 dismissed. R2: ~30 raw findings → 0 patches + 8 defers + 5 dismissed (all R2 HIGHs were false positives). **R3 NOT triggered** per `code-review-convergence` rule (R1 patches additive). 1 STORY-KILLER caught + fixed at R1: H1 PF1_PROMPTS-vs-parseRecording key mismatch would have silently substituted literal `"undefined"` into all 60 judge calls → false PASS gate verdict.

- **D-V42-R1-1 — NFR3 retry-storm cumulative budget** (R1) — 60 calls × 3 attempts × 60s = 10800s vs NFR3=900s. Acknowledged in spec PR3. Mitigation: cumulative-time check + fail-fast OR Story 4.3 measures + reports.
- **D-V42-R1-2 — `PF1_BATTERY_RESULTS_PATH` env-path validation** (R1) — env-overridable but no allowlist/sandbox. Operator-controlled trust boundary.
- **D-V42-R1-3 — JUDGE_MODEL invariant test verifies equality but not validity** (R1) — Test 5 enforces 3 sources align; doesn't verify model exists in Anthropic catalog. Same class as Story 4.1 R1 dismissed.
- **D-V42-R1-4 — EXDEV `renameSync` cross-volume safety** (R1) — same fs by construction; env-overridden RESULTS_PATH could theoretically cross fs.
- **D-V42-R1-5 / D-V42-R2-8 — Test suite covers only structural happy paths** (R1+R2) — runJudgePairs/writeResults/loadAgentRecordings missing-file path/main untested. Story 4.3 will exercise live; deferred to Story 4.3 OR follow-up test-coverage sweep.
- **D-V42-R1-6 — R1 minor LOWs bundle** (R1) — wall_clock_seconds rename + responses retention unbounded + frontmatter regex CRLF/BOM brittle + gate verdict ternary maps unknowns to FAIL + dead-code `?.` chain + dry-run prerequisite docstring + cross-recording structural mismatch fail-after-load + --verbose oversells + gate-boundary fractional-medians-2.5 ambiguity. Bundle for future polish PR.
- **D-V42-R2-1 — `PF1_PROMPT_DESCRIPTIONS` map exported but unused** (R2 N1 + BH LOW) — declared for future Story 4.3 report rendering; either consume in writeResults per-prompt detail OR drop the export.
- **D-V42-R2-2 — Tightened regex error message uninformative for descriptive-header recordings** (R2 N2) — `## Prompt 1 — description` rejected with "wrong section structure: got 0" (misleading). Improve to "header has trailing content (only `## Prompt N` allowed)". Story 4.3 author should be alerted.
- **D-V42-R2-3 — P5 throws on first empty section** (R2 N3) — operator round-trips N times for N empties. Could collect all empties + report consolidated.
- **D-V42-R2-4 — Single-char + zero-width-space bodies pass empty-check** (R2 N4 + BH MED) — operator-fault. Could add minimum-length sanity (e.g., ≥10 chars) but bound is arbitrary.
- **D-V42-R2-5 — Test 11 doesn't verify body-to-key mapping** (R2 N5) — future regex bug swapping bodies between keys would silently pass. Mitigation: add marker strings to fixture.
- **D-V42-R2-6 — R2 minor LOWs bundle** (R2 various) — markdown heading vs inline bold + reduce initializer style + template substitution duplication + API-key check fail-fast ordering + Test 7 trailing-newline gap + Test 13 prompt-pinning + dry-run validity scope + frontmatter snake_case mapping + computeGate tie-breaking + even-RUNS_PER_AGENT guard. Bundle for future polish PR.
- **D-V42-R2-7 — Per-call `console.error` full-response dump unconditional** (R2 BH MED) — inherited Story 4.1 P7 pattern; design intent. Could gate behind `--verbose` for CI quietness.

---

## Deferred from: code review of v63-4-1-create-pf1-judge-prompt-and-calibration-test (2026-04-26 R2)

R2 review (3 layers: Blind Hunter + Edge Case Hunter + Acceptance Auditor R2 verdict ALL R1 PATCHES VERIFIED) — ~25 raw findings → 2 patches + 6 defers + 5 dismissed. **0 NEW HIGH findings post-triage** ⇒ R3 NOT required (additive R1 patches). Convergence reached at R2 per `code-review-convergence` rule.

- **D-V41-R2-1 — Lenient regex permits `SCORE: 4 (because...)` style** (Blind Hunter R2 MED reclassified) — by-design fallback fires console.warn but doesn't fail. Format-rule enforcement on REASONING/STRUCTURAL_MATCH/CAPABILITIES_COMPLETE is downstream-consumer territory (Story 4.2 harness). Mitigation: stricter parser per-field if Story 4.2 needs it.
- **D-V41-R2-2 — `replace`-only-first-occurrence still latent + outputA-contains-{{OUTPUT_B}} contamination risk** (Edge Case Hunter R2 MED + Blind Hunter R2 MED) — P4 fixed `$&`/`$1` regex collision but not multiplicity; future fixture containing literal `{{OUTPUT_B}}` would substitute outputB into outputA. Mitigation paths: (a) `loadPromptTemplate` invariant `body.split('{{OUTPUT_A}}').length === 2` (asserts uniqueness), (b) sentinel-then-swap pattern, (c) single-pass tokenizer.
- **D-V41-R2-3 — `extractText` refusal-as-exit-4 misclassified per runbook** (Edge Case Hunter R2 MED) — exit 4 runbook says "verify ANTHROPIC_API_KEY; check network" which doesn't fit a refusal/tool_use response. Carve-out exit code 5 ("judge response shape unusable") OR document the refusal sub-case in runbook.
- **D-V41-R2-4 — `RESPONSE_TRUNCATION = 500` too short — every realistic response truncated** (Blind Hunter R2 MED) — judge with all 5 fields + multi-line REASONING easily exceeds 500 chars. Tune to ~2000 OR honor `MAX_TOKENS / 2`. Stderr logging mitigates evidence loss but markdown blockquotes routinely show truncation marker.
- **D-V41-R2-5 — Frontmatter-strip regex destroys content if body lacks leading `---`** (Blind Hunter R2 MED) — `loadPromptTemplate` non-greedy regex; if file has no frontmatter, regex doesn't match, returns full file. Subsequent `{{OUTPUT_*}}` check passes (markers in body). Mitigation: explicit existence-of-frontmatter assertion.
- **D-V41-R2-6 — Bundle of R2 minor LOWs** — exitCode=0 latent (no current throw site emits it but `!== undefined` guard would exit 0 on failure); exit 99 contract drift (header doc says "Unhandled exception" but extractText/medianOf classify as 99 for input-class errors); runJudgeOnce re-throw drops "API call failed:" framing for extractText errors; console.warn ordering across stdout/stderr in CI logs; parseArgs unknown-flag silent ignore; formatResponseBlockquote includes truncation marker inside `>` quote; gloss duplication across pair sections; fs.fsync absence in writeEvidence; findProjectRoot graceful failure path; case-sensitive fixture filename. All cosmetic/maintainability; bundle into single polish PR.

---

## Deferred from: code review of v63-4-1-create-pf1-judge-prompt-and-calibration-test (2026-04-26 R1)

R1 review (3 layers: Blind Hunter + Edge Case Hunter + Acceptance Auditor verdict MET-WITH-NOTES) — ~50 raw findings → 9 patches + 7 defers + 6 dismissed. **4 HIGH findings post-triage ⇒ R2 mandatory** per `code-review-convergence` rule.

- **D-V41-1 — tmp-file orphan on power loss between writeFileSync and renameSync** (Edge Case Hunter M5) — `scripts/audit/pf1-judge-calibration.js:261-264` writes to `<evidencePath>.tmp` then renames; SIGKILL between the two ops leaves orphan. Cleanup-on-restart sweep could be added. Theoretical.
- **D-V41-2 — Script writes evidence on FAIL — could overwrite committed PASS evidence** (Blind Hunter M5) — operator can intervene if calibration FAILs; not a current regression. Mitigations: `--no-write-on-fail` flag OR write FAIL evidence to `<evidencePath>.fail-<timestamp>.md`.
- **D-V41-3 — Flat YAML parser in tests** (Edge Case Hunter M7 + Blind Hunter M11) — `parseFrontmatter` regex won't handle nested keys/arrays/multi-line values. `js-yaml` already in node_modules tree (transitively); could replace. Current frontmatter is flat. Future-proofing concern only.
- **D-V41-4 — Fixture provenance unverifiable** (Blind Hunter M16) — comments say "captured 2026-04-26" but no commit hash / transcript ID / procedure record. Manual capture is by Decision 3 design. Re-capture procedure could be documented OR fixtures could be regenerated by a separate "capture-and-verify" tool.
- **D-V41-5 — Caret-pin on 0.x package allows minor breaking changes** (Blind Hunter M6 + Edge Case Hunter L4) — acknowledged trade-off in spec PR1. Tighter pin (`~0.91.1`) would block useful patches. Worth revisiting at SDK 1.0.0 release.
- **D-V41-6 — CRLF/LF byte-compare drift across platforms** (Edge Case Hunter L5) — Test 6 fails if Windows contributor edits fixtures with CRLF endings. Fix: `.gitattributes` rule `tests/fixtures/pf1-calibration/*.md text eol=lf`. Low frequency; cosmetic.
- **D-V41-7 — No CI hook visible for new test file** (Blind Hunter M17) — `npm test` auto-discovers `tests/lib/*.test.js` per existing `package.json` script `node --test tests/{lib,unit}/`; verified by gates passing 1455/1454/1/0 with new tests included. Documentation-only concern; spec could explicitly note auto-discovery.

---

## Deferred from: code review of spec-bug-7-export-placeholder-wording (2026-04-25 R1)

R1 review (3 layers: Blind Hunter + Edge Case Hunter VERIFIED via node simulation + Acceptance Auditor verdict MET-WITH-NOTES) — ~31 raw findings → 5 patches + 9 defers + 12 dismissed. **0 NEW HIGH findings introduced by BUG-7 ⇒ R2 NOT triggered per `code-review-convergence` rule** (3 raw HIGHs reclassified: 2 are pre-existing root causes BUG-7 changed symptom of, not introduced; 1 was theoretical with 0 source hits).

- **D-BUG7-1 — Catch-all collision class — replacement-self-rematch latent footgun** (Blind Hunter H2 + Edge Case Hunter F4 + F5 cluster) — Catch-all replacement value `'your-project-context'` matches `[\w_-]+`, creating a class of bug where future substitution stages over the same regex would re-match the residue. Loop reorder (BUG-7) addresses observable single-pass case but doesn't structurally prevent the class. Mitigations: tokenization rewrite OR denylist `your-X` substrings in catch-all OR separator change (e.g., `~your~name~` instead of `your-name`). RICE 1.6 (R:2 future scope, I:1 latent only, CF:80%, E:1).
- **D-BUG7-2 — convoke-export.js cleanup gap — literal `[your X]` source prose no longer normalized + leftover-placeholder check incomplete** (Blind Hunter M4 + Edge Case Hunter F12) — Pre-fix convoke-export.js:295-302 normalized literal `[your X]` text in source prose (regardless of whether it came from `{var}` substitution). Post-fix Phase 6 only substitutes `{var}` patterns; literal bracket prose passes through. 0 occurrences in `_bmad/` skill-source files at story-execute time, but no test enforces this. Sibling: convoke-export.js:285 leftover-check is angle-bracket only — could be expanded to cover `\{[\w_-]+\}|\[your [\w\s]+\]` patterns (post-Phase-6 sanity guard). RICE 2.4 (R:3 future skill additions, I:1 visible-but-bounded, CF:80%, E:1).
- **D-BUG7-3 — Source-content `{your-X}` literals mangled by Phase 6 catch-all (PRE-EXISTING)** (Edge Case Hunter F1) — `_bmad/tea/workflows/testarch/bmad-teach-me-testing/instructions.md:37,73,74,75` contains 4 occurrences of literal `{your-name}` (intended as user-instruction placeholders); Phase 6 catch-all matches `[\w_-]+` and substitutes. Pre-fix produced `[your context]/teaching-progress/[your context]-tea-progress.yaml` (also wrong); post-fix produces `your-project-context/teaching-progress/your-project-context-tea-progress.yaml` (different wrong, arguably worse-looking because no visual `[]` marker). **BUG-7 changed the mangled output but did NOT introduce the mangling.** Fix paths: (a) audit `_bmad/` source for `{your-X}` literals + escape (single occurrence file: bmad-teach-me-testing); (b) add catch-all exclusion `if (varName.match(/^your-/)) return _match;`. RICE 5.6 (R:7 affects bmad-teach-me-testing exports, I:2 visible UX, CF:80%, E:1 — single-file source rewrite).
- **D-BUG7-4 — README synthesis path line 807 regex strips inner `{date}` of `{{date}}` (PRE-EXISTING)** (Edge Case Hunter F2) — `export-engine.js:807` regex `/\{[\w_-]+\}/g` is single-brace only; matches inner `{date}` of `{{date}}` patterns producing residual brace + wrong literal. Affects all skills with `{{date}}` adjacent to `{output_folder}` in workflow `### Paths` block (Carson workflow.md:48 confirmed; likely others). **Pre-existing** — pre-fix produced same artifact with bracket form. Mitigation: broaden regex to `\{\{?[\w_-]+\}?\}`. RICE 4.8 (R:6 affects multi-skill README synthesis, I:1 visible-but-cosmetic, CF:80%, E:1).
- **D-BUG7-5 — convoke-export.js deletion has no breadcrumb comment** (Blind Hunter L4) — 8 deleted lines included a comment "Clean up leaked engine placeholders from Phase 6 catch-all" with no replacement breadcrumb. Future maintainers reading convoke-export.js won't know wording-refinement now lives upstream in Phase 6. Cosmetic; could add 1-line "/* Phase 6 in export-engine.js produces clean output; no per-README post-pass needed */". RICE 0.8 (R:2, I:0.5, CF:80%, E:1).
- **D-BUG7-6 — Line 822 fallback emits `[date]` literal — mixed convention with `your-X`** (Edge Case Hunter F6) — `export-engine.js:816,822` emit `your-output-folder/${humanName}/[date].md` — two different placeholder conventions in same output line. Date placeholder convention is separate from BUG-7 scope. Fix: standardize to `YYYY-MM-DD` or `your-date` form. RICE 1.6 (R:2, I:1, CF:80%, E:1).
- **D-BUG7-7 — sp-2-1-canonical-format-specification.md documents OLD bracket convention** (Edge Case Hunter F7) — Closed planning artifact at `_bmad-output/implementation-artifacts/sp-2-1-canonical-format-specification.md:27,104,252` still references `[your name]` etc. as canonical convention. Future contributors reading sp-2-1 get conflicting guidance vs canonical-format.md. Out of BUG-7 scope. Fix: 1-line annotation at top of sp-2-1 noting BUG-7 amendment. RICE 0.8 (R:2 retro readers, I:0.5, CF:80%, E:1).
- **D-BUG7-8 — DRY violation: `extractInputs` hardcodes configVarMap key superset** (Edge Case Hunter F8) — `export-engine.js:642-644` inline array duplicates configVarMap knowledge with no comment linking. Adding a 7th configVarMap entry requires keeping line 642 in sync. Pre-existing; BUG-7 didn't introduce it. Fix: replace inline array with `[...Object.keys(configVarMap), 'project_name', 'project_knowledge', 'user_skill_level', 'date'].includes(v)`. RICE 1.6 (R:2 maintainability, I:1, CF:80%, E:1).
- **D-BUG7-9 — R1-M4 not back-annotated in v63-3-5 batch validation report** (Edge Case Hunter F11) — `_bmad-output/implementation-artifacts/v63-3-5-platform-adapter-batch-validation.md:344,361` still tag R1-M4 as `[Review][Defer]`. Cosmetic — deferred-work.md is single source of truth and IS updated. Fix: append 1-line cross-ref at the v63-3-5 R1-M4 entry pointing to BUG-7 closure. RICE 0.4 (R:1, I:0.5, CF:80%, E:1).

---

## Deferred from: code review of v63-3-5-platform-adapter-batch-validation (2026-04-25 R1)

R1 review (3 layers: Blind Hunter + Edge Case Hunter VERIFIED full reproducibility + Acceptance Auditor verdict AC8 fully MET) — ~25 raw findings → 4 patches + 8 defers + 3 dismissed.

- **R1-M2 — Winston (`bmad-agent-architect`) `## How to proceed` section structurally broken in exported adapter** — Edge Case Hunter VERIFIED via independent re-run: bullet points without parent step (no "1." marker), then "2. Continue with steps below" referring to elided step 1. Phase 6 catch-all in `scripts/portability/export-engine.js` is stripping the step-1 marker. Will read as garbled to non-BMAD users. Out of Story 3.5 scope (Decision 4 forbids touching export engine). File path: `scripts/portability/export-engine.js` — Phase 6 step-marker handling. Estimated impact: any agent-skill exported with `## How to proceed` section may have similar artifacts.
- **R1-M3 — Hardcoded counts in story prose (400 warnings + 17 forbidden strings)** — appear 5+ times across sprint-status.yaml + Change Log + spot-check report frontmatter. `derive-counts-from-source` rule is partially load-bearing (44 IS derived) but partially decorative for these other counts. Future fix: either omit prose-side counts or include single derivation pointer ("400 warnings (Phase 6 catch-all class, see I50)"). Cosmetic; doesn't affect AC verification.
- **R1-M4 — Template placeholders leak through to ALL 44 exported instructions.md** (Edge Case Hunter VERIFIED 44/44 affected: `[your name]`, `[your context]`, `[your preferred language]`, `[your output folder]`). **RESOLVED 2026-04-25 via BUG-7** (Path A: refined Phase 6 substitution wording from `[your X]` bracket form to `your-X` hyphenated form; moved refinement upstream from convoke-export.js README post-pass into shared Phase 6, eliminating leak across all 4 export paths — instructions.md / SKILL.md / copilot-instructions.md / Cursor `<name>.md`). True scope was 176 affected files (instructions.md + adapters), not 132. Substitution-order subtlety surfaced + fixed: double-brace loop now runs before single-brace to avoid residual-brace artifact. Spec: [spec-bug-7-export-placeholder-wording.md](spec-bug-7-export-placeholder-wording.md). Initiative-Lane follow-up (b) — widen export-rubric — still open as future enhancement.
- **R1-M6 — sprint-status.yaml `last_updated` field bloated** (~53KB diff in v63-3-5 close commit alone; long prose paragraphs). Pre-existing pattern across multiple stories. Future fix: trim `last_updated` to date + 1-line pointer; move detail to a separate changelog field or keep in story file Change Logs (which already capture per-story narrative). Out of Story 3.5 scope.
- **R1-L1 — Catalog Walkthrough items 2+3 broad-brush N/A** — items "Reader finds a skill matching 'I want to brainstorm' within 60 seconds" + "Tier badges are clear" could conceivably apply to per-skill READMEs even without catalog README. Per Auditor: defensible because all 4 catalog tests semantically gate on catalog README which doesn't exist in raw export output. Cosmetic clarification only.
- **R1-L4 — Validate-exports.js Manual Smoke Tests template wording is auto-generated; behavioral language ("Invoked skill — Carson introduces self...") pre-baked into the report template** — out of scope per Story 3.5 Decision 4 (no production code touched). File as Bug-Lane item to amend `scripts/portability/validate-exports.js` template to emit structural language (e.g., "Adapter file inspected at `<path>` ... persona section verified at line N") instead of behavioral. Would close the R1-M1 root cause permanently.
- **R1-L6 — Cursor adapter naming convention (`<skill-name>.md`) not enforced** — Edge Case Hunter VERIFIED all 44 current skill names match `^[a-z][a-z0-9-]+$`; convention is implicit not asserted. Defense-in-depth via name-pattern assertion in `scripts/portability/validate-exports.js` would cost ~1 line. Out of Story 3.5 scope.
- **R1-L7 — Apostrophe-escape, unicode-in-frontmatter, empty-description branches in `scripts/portability/generate-adapters.js` untested** (Edge Case Hunter VERIFIED 0 production traffic on each branch). All 44 current descriptions are ASCII without apostrophes; all have non-empty descriptions. The escape path at `generate-adapters.js:48` (`description.replace(/'/g, "''")`) is dead code by current data. File as test-coverage Initiative-Lane item against `tests/unit/portability-export.test.js` (or wherever adapter generation is unit-tested) to add synthetic skills with apostrophes/emoji/empty descriptions.

---

## Deferred from: code review of v63-3-4-dual-distribution-parity-verification (2026-04-25 R2)

R2 review (3 layers) — 30 raw findings → 9 patches + 10 defers + 5 dismissed. Acceptance Auditor verdict: AC8 MET; all 16 R1 patches verified.

- **R2-L1 — `canonicalIdForSkillRel` platform-naïve on Windows backslash separators** — marketplace.json is authored with forward slashes, practically unreachable today. Future cross-platform consideration if marketplace.json is ever generated on Windows.
- **R2-L2 — `fs.copy` preserves symlinks (default `dereference: false`); BMAD's `installVerbatimSkills` follows symlinks** — no symlinks in current source tree under `_vortex/agents/`. If any Convoke skill ever contains a symlink, parity check sees byte-equal SKILL.md but structurally divergent neighbors. Fix path: `fs.copy(... { dereference: true })` to match BMAD.
- **R2-L3 — Per-iteration `fs.copy(sandboxB, sandboxBPrime)` × 7 wastes ~350KB I/O in I4** — Edge Case Hunter VERIFIED runs in 33ms, well under AC6 budget. Mutation-restore in-place would be faster but introduces test-pollution risk; current approach is correct conservatively.
- **R2-L4 — `cleanRel = skillRel.replace(/^\.\//, '')` duplicated 6+ times across 2 files** — DRY nit. Future fix: export `cleanSkillRel(rel)` helper from simulator.
- **R2-L5 — `plugins[0].skills = ''` (empty string) classified as "missing or empty" instead of "not an array"** — `''.length === 0` makes first guard fire before validation loop. Misleading error class for non-array string input. Cosmetic.
- **R2-L6 — `destDir` collision on duplicate canonicalIds: `skills: ['./a/foo', './b/foo']` → second entry silently overwrites first** — BMAD has same behavior; no current Convoke marketplace.json triggers it. Defense-in-depth via `seenCanonicalIds` Set would cost nothing.
- **R2-L7 — `isExcluded` with `sourceDir='/'` produces over-exclusion** — Edge Case Hunter VERIFIED `path.relative('/', '/parent/node_modules/x.js') === 'parent/node_modules/x.js'` includes `/node_modules/` → excluded even though sourceRepo is rooted at `/`. Production simulator never passes `sourceDir = '/'` (always `path.join(sourceRepo, cleanRel)`); document the sharp edge.
- **R2-L8 — `before()` failure cancels but doesn't name the culprit clearly** — node:test cancels every `it()` with generic "test did not finish before its parent and was cancelled". Diagnostic improvement: wrap each setup step in try/catch and re-throw with `[setup:refreshInstallation]` tag.
- **R2-L9 — Test-count drift in spec** (Auditor F-1) — story L138 + R1 change-log claim post-R1 unit count is `1438→1443 (+5)`; actual is `1444` (+1 from a parallel post-R1 commit on main). Spec stale; gate still passes. Fix path: refresh count in story L138 next time the file is edited.
- **R2-L10 — `canonicalIdForSkillRel` not used inside the simulator's own `marketplaceInstall`** (Auditor F-3). Sim line 142 still computes `path.basename(cleanRel)` inline. Same result as helper since `cleanRel` already strips `./`. DRY nit.

---

## Deferred from: code review of v63-3-4-dual-distribution-parity-verification (2026-04-25 R1)

R1 review (3 layers: Blind Hunter + Edge Case Hunter + Acceptance Auditor) — 39 raw findings → 16 patches + 14 defers + 5 dismissed.

- **R1-L1 — U1 describe title hardcodes "7 paths"** — cosmetic; assertion correctly derives count from manifest. Future fix: drop count from title text.
- **R1-L2 — `PACKAGE_ROOT` redefined in unit test instead of imported from `tests/helpers.js`** — duplicate computation, low impact. Future fix: import from helpers.
- **R1-L3 — `.gitkeep` literal hardcoded in two places** (simulator filter + U2 assertion) — low; could centralize in `PARITY_EXCLUSIONS.exceptionBasenames`.
- **R1-L4 — `src === sourceDir` exact-string compare brittle to `fs.copy` path normalization** — informational; if fs-extra ever normalizes paths (trailing slash, symlink resolution), the root-dir filter check breaks silently. Future fix: `path.resolve(src) === path.resolve(sourceDir)`.
- **R1-L5 — DEBUG flag uses bare `===` instead of npm namespace-list parsing** — `DEBUG=convoke:parity,foo` wouldn't trigger debug output. Future fix: `process.env.DEBUG?.split(/[\s,]/).includes('convoke:parity')`.
- **R1-L6 — Redundant filter logic** (`.bak` matches both dot rule + suffix rule when filename starts with `.`) — no functional bug.
- **R1-L7 — No explicit timeout on async `before()` hooks** — `fs.copy` of full SKILL.md trees + `refreshInstallation` could hang on a wedged FS. node:test has implicit timeouts; low risk.
- **R1-L8 — I4 cleanup `try/finally` fragile to future async refactor** — currently safe.
- **R1-L9 — `Buffer.compare` directionality not surfaced in failure message** — cosmetic; future fix: include `${aBytes.length}B vs ${bBytes.length}B`.
- **R1-L10 — Symlink handling: `fs.copy` default `dereference: false`** — informational; no symlinks in current source tree under `_vortex/agents/`.
- **R1-L11 — `skills[]` traversal `..` would `path.basename` to a sibling-dir name + clobber** — `validate-marketplace.js` is the gate; defense-in-depth via `assert(!cleanRel.includes('..'))` would cost nothing.
- **R1-L12 — I4 clones suite-level `sandboxB` rather than performing its own `marketplaceInstall(sandboxBPrime, …)`** — fragile to future test insertions that mutate `sandboxB` between I3 and I4. Currently safe.
- **R1-L13 — Spec internal inconsistency** — Testing section L273 has stale baseline projection (5+3 tests) vs final actual (6+15). Doc nit.
- **R1-L14 — Schema-guard duplicated** (simulator throws AND I1 asserts independently) — defense-in-depth, not defect.

---

## Deferred from: V-pass of v63-3-4-dual-distribution-parity-verification (2026-04-25)

V-pass (`/bmad-validate-create-story` fresh-context) batch-applied 26/26 findings inline. Two deferred follow-ups surfaced during V-pass that exceed Story 3.4's AC7 scope:

- **D-V34-E11 — `module_definition` field missing from `.claude-plugin/marketplace.json`** — MEDIUM. Architecture Decision 5 (line 414 of `convoke-arch-bmad-v6.3-adoption.md`) declares `module_definition: _bmad/bme/_vortex/module.yaml` as part of marketplace metadata; verified live (`node -e`) that `marketplace.json.plugins[0]` has keys `[name, source, description, version, author, skills]` only. Story 3.1 shipped without the field. Story 3.4 narrowed parity scope to `skills[]` only (Decision 1) and called this out as a 3.1 follow-up rather than scope-creeping. Fix path: amend `.claude-plugin/marketplace.json` to add `module_definition` field; re-run validate-marketplace; consider whether Story 3.4's parity test should be extended to cover the new path. Defer reason: AC7 of Story 3.4 forbids touching marketplace.json; this is Story 3.1 territory. Owner: pickup at next marketplace amendment OR open a Fast Lane item if it remains untouched at Story 3.5 close.
- **D-V34-E5 — PluginResolver behavior re-verification when BMAD ships local CLI** — LOW. Story 3.4 Decision 2 ships with PROVISIONAL assumptions about PluginResolver's contract: (i) materializes files vs registers paths; (ii) does NOT run package `bin` postinstall; (iii) preserves source-relative paths. Task 1.1's DS1 spike is time-boxed at 60 min; if inconclusive, the simulator ships under provisional assumptions. When BMAD eventually exposes a real PluginResolver CLI for community modules (DEF-SPIKE 4 of Story 3.3 confirmed it doesn't exist today: `bmad-builder validate`, `bmad-method validate-plugin`, `bmad-method registry-check` all unavailable), re-run Story 3.4's parity test against the real CLI to validate the simulator's assumptions. Fix path: replace `marketplaceInstall(...)` simulator call with `runScript('bmad-cli', ['install', ...])` or equivalent. Defer reason: blocked on upstream BMAD shipping the CLI. Re-trigger: any BMAD release notes mentioning a marketplace install CLI for community modules.

---

## Deferred from: code review of BUG-5 v3.0.x chain-walker fix (2026-04-25)

Round 1 review (Blind + Edge Case + Acceptance) — 0 HIGH after triage; convergence at Round 1. 4 patches applied (backlog moves + comment/test description tightening). 4 items deferred:

- **D-A1 — Broaden invariant test via `matchesVersionRange`** — MEDIUM. Current invariant in `tests/unit/registry.test.js` (`Registry invariants > at most one migration per fromVersion (BUG-5 guard)`) checks `fromVersion` string equality only. The actual collision class is "two MIGRATIONS entries match the same incoming user version via `matchesVersionRange`" — e.g., a future entry with `fromVersion: '3.0.0'` (exact) alongside an existing `fromVersion: '3.0.x'` (wildcard) would NOT collide on string equality but WOULD double-match. Currently no entries trigger this edge — all use `{major}.{minor}.x` form — but the invariant is narrower than the bug class. Fix path: derive a representative test version per entry (`'3.0.x'` → `'3.0.0'`), then for each pair assert `!matchesVersionRange(testVer_i, m_j.fromVersion) || i === j`. Defer reason: defensive against future entry shapes that don't exist today.
- **D-A2 — `registry.MIGRATIONS` mutation safety in tests** — LOW. New invariant test iterates `registry.MIGRATIONS` (live array reference, not copy). A future test author who mutates it directly (instead of using `getAllMigrations()` which returns a copy) could break the invariant test order-dependently. Fix path: clone the array at test start. Defer reason: speculative; existing convention uses `getAllMigrations()`.
- **D-A3 — Phantom `migration_history` reference for pre-shipped 3.0.x users** — LOW. After deleting `3.0.x-to-4.0.0.js` + its registry entry, any user config that recorded `'3.0.x-to-4.0.0'` in `migration_history` would have a phantom name with no live counterpart. No runtime crash today (`hasMigrationBeenApplied` does string-match only; `getMigrationsFor` no longer returns the name). Defer reason: v4.0 hasn't shipped — no real user has applied this migration. Revisit IF v4.0 release surfaces this OR a `migrate-history` cleanup utility is built.
- **D-A4 — Comment-phrasing doc nits** — LOW. Blind Hunter cluster: "each minor that needs a direct path" is ambiguous (no documented criterion); test error message references `Array.find` while `getMigrationsFor` actually uses `for...of/break` (equivalent but imprecise); sibling comments in 3.1.x/3.2.x point to `3.3.x-to-4.0.0.js` for "the base module" but architectural rationale lives in `registry.js`. Fix path: future doc sweep. Defer reason: cosmetic; non-load-bearing.

---

## Deferred from: code review of v63-3-1-create-and-validate-marketplace-metadata (2026-04-24)

Round 1 code review added 13 `defer` items (5 MED + 7 LOW + 1 DRIFT):

- **R1-M3 — Test 20 (`npm pack --dry-run`) JSON shape brittleness.** npm v6 vs v7+ output schema differs. Current `parsed[0]` assumes v7+ array form. Fix path: `Array.isArray(parsed) ? parsed[0] : parsed`.
- **R1-M5 — `refreshInstallation` flat-cleanup runs in dev environment.** Cleanup loop at refresh-installation.js:95-105 is outside the `isSameRoot` guard — could wipe `<id>.md.bak` files in the dev tree. Fix: move inside `!isSameRoot` block. Zero operator risk today.
- **R1-M7 — Test 14 repo-URL regex doesn't handle `git+ssh://` / trailing slashes.** Normalization `replace(/^git\+/, '').replace(/\.git$/, '')` wouldn't round-trip `git+ssh://git@github.com/X.git` to `https://github.com/X`. Low risk — current repo uses `git+https://`.
- **R1-M9 — Test 13 assertion message unhelpful.** Future regression failures lack fix hint / AC3 citation.
- **R1-M10 — Test 16 doesn't verify `{project-root}` resolves at activation.** Verifies wrapper content but not end-to-end activation correctness. Fix path: load SKILL.md target + assert minimal structure.
- **R1-D2 — Test numbering reordered vs spec AC6 case numbers** (cases 14/19 swapped). Cosmetic spec-body drift (PI-5 violation). Fix: renumber tests OR update spec.
- **R1-L1 — Race in Vortex copy loop.** fs.remove then fs.copy — concurrent observer sees empty dir. Low under CLI invocation, real under Windows file-lock scenarios.
- **R1-L2 — `_agentManifestPath` has no submodule allowlist.** Unknown names fall through to flat-`.md` silently. Fix: whitelist + throw.
- **R1-L3 — Test 15 only covers "6 dirs, 7 paths" not "7 dirs, 8 paths"** reciprocal case. Parameterize.
- **R1-L4 — `EXTRA_BME_AGENTS` wrapper hardcodes flat-`.md` LOAD.** Correct today; future skill-dir EXTRA_BME agents would silently break. Add `layout` field to registry.
- **R1-L5 — `detectInstallationScenario` accepts 0-byte SKILL.md as complete.** convoke-doctor catches later; detector only gates routing.
- **R1-L6 — Concurrent `refreshInstallation` race.** Parallel to Story 2.4 R1-H1. Fix path: lockfile.
- **R1-L7 — `_scanWithSuppressedStderr` re-entrancy guard.** Runtime check only catches Promises, not re-entrancy. Future doctor-check collisions possible.

---

## Deferred from: code review of v63-2-4-custom-skill-registration-and-honest-warnings (2026-04-24)

Round 1 code review added 7 `defer` items (1 MED + 2 MED edge-cases + 4 LOW):

- **R1-M7 — `_tripleKey` dedup not normalization-aware.** Case/trailing-whitespace/Unicode (NFC vs NFD) variants slip past duplicate detection. macOS case-insensitive filesystem catches most case-variants via the skill-dir existence check. Fix path: normalize all 3 components via `.normalize('NFC').trim().toLowerCase()` before building the triple key. Revisit if reported by operators.
- **R1-M9 — `--dry-run` runs disk-existence check** on `skill_name`. Operators trying to preview the row format before creating the skill dir get a hard error. Defensible today — dry-run validates what registration *would* check. Fix path: accept `{dryRun: true}` option in `validateInput` and demote the skill-exists error to a warning when dry-run is set.
- **R1-L2 — Formula sanitization idempotence on literal `=foo` rows.** `_sanitizeFormula` is idempotent only when the original escape was applied; a hand-edited CSV with literal `=foo` would get a `'` prepended on every `writeRow` call. No committed CSV contains such a row today. Fix path touches upstream Story 2.1 (`_sanitizeFormula`).
- **R1-L4 — Test 7 couples to `fs-extra.renameSync` call-site.** If a future refactor destructures `const { renameSync } = require('fs-extra')` in the audit tool, the monkey-patch silently misses. Fix path: dependency-inject `renameSync` into `_atomicWrite` or stub at `node:fs` level.
- **R1-L5 — FR16 merge-collision test missing.** Test 11 seeds a bare skill dir with no SKILL.md `dependencies:` frontmatter, so `scanBmmDependencies` returns 0 rows — the `mergePreservingManual` dedup path isn't exercised for a skill that BOTH exists in the CSV and is auto-detected. Fix path: extend Test 11 seeding to write SKILL.md with `dependencies: [bmad-agent-pm]`.
- **R1-L6 — SKILL.md trigger phrase overlap risk.** "register my skill" / "register custom skill" might collide with future registration/export skills. No collision today. Revisit as the skill catalog grows.
- **R1-L7 — Workflow.md doesn't offer `--dry-run` as an operator affordance.** Cautious operators asking "show me what would happen" don't get a preview step by default. Fix path: add a bullet to workflow.md Phase 2.

Round 2 code review added 10 additional `defer` items:

- **R2-M1 — R1-H1 concurrency test is not actually concurrent.** `Promise.all([setTimeout(…, 0), setTimeout(…, 0)])` runs serially on Node's single-threaded event loop. `_withCsvLock` is synchronous → callback 1 completes the full lock cycle before callback 2 starts. Test passes regardless of lock correctness. Fix path: spawn two `runScript` subprocesses in parallel; assert both rows land. Deferred because the lock is correct in principle; the fix requires adding real subprocess parallelism to the test harness.
- **R2-M3 — Silent `writeSync(fd, String(pid))` failure weakens forensic value of stale-lock diagnosis.** The pid in the lockfile is meant to help operators verify staleness before `rm`. A silent write failure means no pid lands. Low probability on modern Node.
- **R2-M4 — Duplicate-flag detection doesn't fire for `--skill foo --skill` (trailing no-value).** Missing-value error fires first; operator sees wrong error. Edge-case where both technically apply. Fix path: detect seen-before-value-fetch.
- **R2-M7 — Unverified-but-written exit 0 ambiguity.** When verification fails fail-soft, the CLI exits 0 without REGISTERED marker. LLM parsers correctly treat as not-success; scripted callers keyed only on exit code treat as success. Could emit `REGISTRATION_UNVERIFIED: <triple>` as a distinct machine marker.
- **R2-M8 — Non-TTY guard rejects piped-with-data stdin without hint.** `echo 'foo' | convoke-register-skill` silently refused rather than explaining pipe mode is unsupported. Minor UX.
- **R2-M9 — `process.stdin.isTTY` edge cases.** Current `!process.stdin.isTTY` coercion works but is "accidentally correct" for `undefined`. Defensive hardening could explicitly check type.
- **R2-L1 — `verifyRegistration` "not found" return shape lacks discriminator.** `{ok: false}` with no `error`/`mismatch` is indistinguishable from other failure modes. Programmatic consumers want `reason: 'not-found'` field.
- **R2-L2 — Cascade errors when `--key <value>` fails.** Positional-argument error follows the missing-value error, adding noise. Fix path: advance `i++` past the intended-value token even when rejected.
- **R2-L3 — `--dry-run` doesn't acquire the lockfile.** Preview could be stale under concurrent writers. Low impact — dry-run is advisory.
- **R2-L4 + R2-L5 — CRLF-edited CSV trim interactions + stale-lock forensics hint.** Both polish.

---

## Deferred from: code review of v63-2-3-integrate-registry-gate-into-convoke-update (2026-04-24)

Round 1 code review added 2 `defer` items — both LOW, both CI-hygiene concerns with no live correctness impact:

- **200ms hardcoded stdin-write delay in `runScriptWithInput`** — Blind+Edge LOW. The test helper uses `setTimeout(..., 200)` to write piped input, assuming readline is ready by then. Works today, but burns 200ms × 7 tests = 1.4s in the Story 2.3 suite, and risks hanging on slow CI if convoke-update prompts earlier than 200ms for interactive paths. Also: on 15s timeout, `fs.remove(tmpDir)` may fail silently on macOS if SIGTERM leaves orphan child processes holding file descriptors. Fix path: refactor to `child.stdin.on('ready', ...)` or use a write-when-flowing pattern; add fs.remove retry on EBUSY.
- **`_scanWithSuppressedStderr` "no concurrent invocations" invariant violation** — Edge LOW. `scripts/convoke-doctor.js`'s helper mutates global `console.error` during the scan. JSDoc says "safe ONLY because `main()` runs checks serially" — but Story 2.3's new call-site in convoke-update runs post-`runMigrations`, where migration-runner cleanup logic may log to stderr concurrently. Actual risk: timing-based silent log swallow during the ~5-50ms scan window. Low probability (runMigrations is awaited before the gate), but the documented invariant is formally violated. Fix path: refactor convoke-doctor's helper to stack-counted reentrant shim, or assert sync-only at runtime via Promise-detection. Revisit if stderr silencing becomes observable.

Round 2 code review added 5 `defer` items — all LOW, all defensive-polish with no live correctness impact:

- **R2-L6 — `check.info` only rendered on pass branch.** `_printPostUpgradeGate` emits `info` only in the ✓ branch; softWarning/hard-fail drop it. Story 2.2 contract today doesn't set `info` on non-pass findings. Future: render in all branches for defense-in-depth.
- **R2-L7 — Summary math double-counts duplicates.** `_printPostUpgradeGate` iterates `findings` blindly; duplicate entries (same triple-key) would count twice. Story 2.2 dedup prevents this upstream. Future: runtime uniqueness assertion.
- **R2-L9 — Lazy-require not memoized.** `_runPostUpgradeGate` `require('../convoke-doctor')` relies on Node's module cache for efficiency. AC8 183ms budget proven for first call only. Non-issue today (at most one call per convoke-update run). Future batch-mode needs explicit memo.
- **R2-L10 — Console monkey-patching blind to `process.stdout.write`.** Tests 7+8 capture via `console.log` override. Helper stably uses `console.log`; future-proofing only.
- **R2-L11 — tmpDir cleanup ordering in R1-H1 test.** `finally` block restores `cached.exports.checkBmmDependencies` BEFORE `fs.remove(tmpDir)`. If restoration throws, tmpDir leaks. Very low probability; OS tmp cleanup handles it eventually. Fix path: wrap restoration in inner try/catch.

---

---

## Deferred from: code review of v63-2-2-integrate-governance-check-into-convoke-doctor (2026-04-23)

Round 1 code review added 3 `defer` items — all LOW, all non-impactful today but worth watching:

- **FR17 CSV template not RFC-4180-escape-safe** — Blind Hunter LOW. The `fix:` string in the unregistered-custom-skill finding builds a literal CSV row by interpolating `${r.skill_name},${r.bmm_agent},...` into a comma-separated template. If a skill name ever contains commas, quotes, or CRLF, a user copy-pasting the suggestion into `bmm-dependencies.csv` would produce a malformed row. Skill directory naming convention currently prevents this (kebab-case, no special chars), so no live exposure. Fix path: use `formatCsvRow` from csv-utils when building the suggestion, OR document that skill names must stay kebab-safe. Defer until a user reports breakage.
- **Broken-symlink UX in skill-gone categorization** — Edge Hunter LOW. `fs.existsSync(path.join(claudeSkillsRoot, r.skill_name))` returns false for dangling symlinks (symlink target missing) — same result as skill-dir genuinely absent. An operator whose `.claude/skills/foo` is a symlink to an unmounted external volume would see `[stale:skill-gone]` warnings that don't match their mental model. Fix path: `fs.lstatSync` + link-target check to distinguish "absent" from "dangling symlink" in the warning text. Low-priority UX polish.
- **Test fixture coupling between Story 2.1 and 2.2** — Edge Hunter LOW. Story 2.2's `tests/unit/bmm-dependencies-doctor.test.js` reuses `tests/fixtures/bmm-dependencies/*` from Story 2.1. If a future 2.1 story mutates these fixtures (e.g., adding deps to `skill-with-removed-dep`), Story 2.2's stale/drift tests will shift. Works today because 2.1 fixtures are frozen. Defensive fix path: 2.2 tests construct minimal skill directories inline for cases where exact content matters, reducing cross-story coupling. Low ROI at current fixture stability.

Round 2 code review added 2 more `defer` items (both LOW):

- **H1 integration test non-hermetic via live taxonomy.yaml read** — Edge Hunter Round 2 LOW. The new `convoke-doctor: governance softWarning exit-code` test in `tests/integration/convoke-doctor.test.js` reads the repo's live `_bmad/_config/taxonomy.yaml` to populate the fixture's taxonomy. If the live taxonomy becomes mid-refactor invalid on a branch, the integration test goes red for unrelated reasons. Also if taxonomy.yaml is ever deleted, the test fails with ENOENT before reaching its assertions. Fix path: pin a minimal inline YAML fixture matching the schema's required shape (initiatives + artifact_types), OR wrap the live read in a descriptive error message pointing at the broken taxonomy. Low-impact today because taxonomy.yaml is stable and load-bearing.
- **H1 integration test fixture doesn't create package.json** — Blind Hunter Round 2 LOW. The H1 fixture creates `_bmad/`, agents, skills, taxonomy, `_bmad-output/` — but NOT a `package.json`. `findProjectRoot` walks up from `tmpDir` looking for `package.json` and eventually lands on the real repo's. Works today (pkg.version matches the fixture's version config so `checkVersionConsistency` passes). Couples integration test to the repo's current package.json. Fix path: write a pinned `{"name":"fixture","version":"${pkg.version}"}` into `tmpDir/package.json`. Hardens test isolation.

---

## Deferred from: code review of v63-2-1-create-bmm-dependency-scan-tool-and-registry (2026-04-23)

Round 1 code review produced 2 `defer` items — real concerns that don't block Story 2.1's AC surface but should be re-evaluated during Story 2.4 or a future refinement cycle.

- **Manual-row ordering lost in `_sortWithFr18Pin`** — Blind Hunter LOW. Task 4.3 spec said "manual rows preserved in their original order" but implementation feeds manual rows through `_sortWithFr18Pin` which re-sorts alphabetically by `(skill_name, bmm_agent)`. AC8 only enforces byte-identical content preservation, not ordering — so no AC violation, but a mild spec deviation. Fix path: in `mergePreservingManual`, emit manual rows with preserved input order ahead of sorted scan rows; OR amend the spec if operator workflow doesn't care about manual-row ordering. Story 2.4 (manual registration UX) should decide whether ordering matters.
- **`_inferSourceModule` `/^q\d/` too broad for theoretical names** — Blind Hunter LOW. The regex `/^q\d/.test(skillName) || skillName.startsWith('q-')` matches `q0-init` (intended, FPF) but also any future skill named `q2k-legacy` or `quantum-*`. No current or near-future skill matches the problematic pattern. Fix path: tighten to `/^q\d-/` to require trailing hyphen; alternatively defer until a real mis-classification appears. **(RESOLVED in Round 1 via D1 extended prefix rule — regex tightened to `/^q\d-/`. Keeping this entry for historical context.)**

Round 2 code review added 3 more `defer` items:

- **H1 ISO-8601 timestamp dates silently overwritten** — Edge Case Hunter LOW. `/^\d{4}-\d{2}-\d{2}$/` rejects full ISO-8601 timestamps like `2026-04-23T10:30:00Z`, causing the preserve-step to discard the date and restamp with today's. No warning logged. Defensive but data-lossy. Fix path: widen regex to accept full ISO-8601 OR log `[warn] malformed registered_date dropped: ...` when the preserve-step rejects a value. Low severity because the scanner always writes `YYYY-MM-DD`; only affects CSVs edited by foreign tools.
- **Missing integration test for FR18 + merge + dedup three-way interaction** — Edge Case Hunter LOW. `_sortWithFr18Pin` handles manual+auto uniformly so logic should hold, but sort stability across the three code paths (manual-only, dedup-survivor, FR18-pinned) is untested. Add one fixture case in Story 2.4: manual row for `bmad-enhance-initiatives-backlog` + scan also emits same (skill, agent) pair + 2 other skills — assert FR18 row pinned first, manual wins dedup.
- **Duplicate manual rows for same (skill, agent) pair silently preserved** — Blind Hunter Round 2 LOW. If two manual rows with same `(skill, agent)` appear in the CSV (operator appended accidentally), both are preserved and both survive output. No uniqueness invariant enforced, no stderr warning. Fix path: in `mergePreservingManual`, add `manualPairSeen` Set tracking — log `[warn] duplicate manual entry ...` on collision and keep the first row. Story 2.4 manual-registration workflow should prevent this at authoring time.

---

## Deferred from: code review of v63-1a-6-author-migration-guide-standalone-deliverable (2026-04-22 + 2026-04-23)

Round 1 code review of Story 1A.6's migration guide + CLI wiring. 1 `defer` item — spec-authoring convention gap, not an implementation miss.

- **AC7 measurement proxy too narrow** — Edge Case Hunter MED. AC7's validation script only walks `[text](url)` markdown-link patterns. Bare prose references (the CLI path string `docs/migration/3.x-to-4.0.md` emitted to stdout, the CSV path `_bmad/_config/bmm-dependencies.csv` referenced in guide body) escape the check. This means Story 1A.6's broken-link check passed while still containing unresolvable prose references. Fix path: future stories that carry "no broken links" ACs should specify a proxy that walks prose citations of file paths (e.g., regex for `(scripts|docs|_bmad|tests)/\S+\.(md|js|yaml|csv)` and verify each resolves). Not actionable against 1A.6's implementation — spec-authoring-convention refinement, belongs to a future AC-template story.

Round 2 code review added 3 more `defer` items (all LOW):

- **Missing test coverage for v1.7.x multi-hop positive case** — Blind Hunter Round 2 LOW. P2's gate fires when the migration chain includes a `-to-4.0.0` hop, which for 1.7.1 walks `1.7.x-to-2.0.0 → 2.0.x-to-3.1.0 → 3.1.x-to-4.0.0`. The v3.x test (added in Round 1 P1) covers direct 3.x→4.0 upgrade; no test pins the multi-hop positive path. If a future registry edit breaks the 1.7→4.0 chain, the gate silently drops the guide link from 1.7.x users and no test catches it. Fix path: add a test case with `createInstallation(tmpDir, '1.7.1')` asserting the guide URL appears. Can land in Epic 5B (release discipline) or as a standalone test-hardening story.
- **Hardcoded GitHub URL in CLI output** — Blind Hunter Round 2 LOW. `scripts/update/convoke-update.js:223` emits a literal string `https://github.com/amalik/convoke-agents/blob/main/docs/migration/3.x-to-4.0.md`. Correct today (matches `package.json.repository.url` owner segment), but fragile against future repo renames/forks. Fix path: 3–5 LOC helper that parses `package.json.repository.url` and constructs the blob URL dynamically. Defer to Epic 5B or a separate refactor — not worth blocking 1A.6 ship.
- **PF1 rephrase still uses present-tense "validates" for unshipped Epic 4 scope** — Blind Hunter Round 2 LOW. The guide says "Convoke 4.0 validates agent output equivalence as part of release gating" but Epic 4 (PF1 validation battery) is unshipped as of 1A.6 ship. The rephrase asserts a PROCESS rather than a SHIPPED FEATURE, so it's acceptable — but if Epic 4 slips past 4.0 release the claim becomes premature. Fix path: re-read the guide at Epic 4 ship time; if Epic 4 still slipping, tighten wording to "will validate" or remove the bullet. No action required until Epic 4 status clarifies.

---

## Deferred from: code review of v63-1a-2-create-config-loader-js-with-direct-yaml-loading (2026-04-21)

Round 1 code review of the `config-loader.js` implementation produced 9 `defer` items — real concerns that exceed Story 1A.2's 4.0-scoped AC surface. Acceptance Auditor verified all 9 story ACs satisfied; these defers cover defensive-hardening opportunities the audit explicitly de-scoped or that belong to later stories.

- **`console.warn` side-effects not routable** — Blind Hunter MED. Library writes to stderr directly via `console.warn` for deprecation + YAML warnings. Callers (CLI, JSON-logging consumers, test runners) can't route or suppress. Fix path: accept optional `{ logger = console }` option, or emit via EventEmitter. Out of 4.0 loader scope — broader library-logging convention concern.
- **Nested `{project-root}` silently unresolved** — Blind Hunter + Edge Case Hunter MED. `_resolveProjectRootPlaceholder` is top-level-only by design (audit §5 YAGNI for 4.0). Nested objects/arrays containing `{project-root}` strings pass through unresolved with no warning. Fix path: either recurse or emit a `console.warn` when a nested string contains the placeholder. Deferred per audit §5 explicit scope decision; revisit if a config author hits this.
- **Windows path-separator mismatch** — Blind Hunter MED. `replaceAll('{project-root}', projectRoot)` on Windows with `projectRoot = 'C:\\Users\\x'` and YAML `output_folder: "{project-root}/foo"` yields `C:\\Users\\x/foo` (mixed separators). Most Node APIs tolerate, but downstream string comparison / glob logic may not. Fix path: normalize via `path.join` where strings look like paths, or document Unix-style separator contract. Cross-platform is not a 4.0 promise per PRD; revisit if Windows CI is added.
- **Test `console.warn` spy restore-on-failure edge case** — Blind Hunter LOW. If a v3-fallback test's `beforeEach` throws before `afterEach` runs, `console.warn` stays globally mocked, poisoning subsequent test files in the same process. Fix path: wrap setup in try/catch or use `t.mock` (test-scoped). Project convention is global `mock.method`; not worth breaking the pattern for a rare edge.
- **EISDIR / broken-symlink at configPath unhandled** — Blind Hunter LOW. `fs.existsSync` returns true for a directory at the path; `readFileSync` then fails with raw EISDIR. Broken symlink yields false from existsSync and masquerades as missing-config. Fix path: `fs.statSync + isFile()` check, or catch EISDIR and rethrow with actionable message. Low-impact edge; add if a real report surfaces.
- **YAML merge keys `<<:` preserved as literal `"<<"` key** — Edge Case Hunter. Callers expecting merge-key expansion are surprised. Fix path: pass `{ merge: true }` to `yaml.parseDocument + toJSON`, or document non-support. No current config uses merge keys; document if a user authors one.
- **Python2-as-python3 PATH resolution** — Edge Case Hunter. If `python3` on PATH is actually Python 2, the script fails with SyntaxError, surfaces via non-zero exit + stderr. Current error handling catches this path correctly; just no explicit version-check. Fix path: prepend `python3 --version` check, or document requirement. Acceptable for a legacy fallback — the migration path (`convoke-update`) should normalize Python before hitting this path.
- **Subprocess stdout with warning-prelude-then-JSON** — Edge Case Hunter. If bmad_init.py emits a deprecation warning line before JSON, `JSON.parse` fails → caught by "non-JSON stdout" branch with generic error. Fix path: extract last-line JSON before parse, or assert bmad_init.py emits pure JSON. bmad_init.py is internal and we control its output shape — low risk.
- **Repeated `[DEPRECATED]` warning on N loader calls** — Edge Case Hunter LOW. A session calling the loader multiple times (e.g., doctor health check scanning multiple modules) spams the deprecation warning N times. Fix path: module-scoped `Set` keyed by `legacyInitDir`, warn once per path per process. Stderr noise only; no correctness impact.

---

## Deferred from: code review of v63-1a-1-audit-bmad-init-behavior-before-replacement (2026-04-21)

Round 1 code review of Story 1A.1's audit deliverable produced 7 `defer` items — scope belongs to downstream stories or other initiatives.

- **JS implementation edge cases** — Edge Case Hunter. `moduleConfigPath` undefined/null/empty/absolute/`..`-containing, `projectRoot` undefined/null/trailing-slash/symlinked, BOM handling, EACCES, TOCTOU race between `existsSync` and `readFileSync`, YAML multi-document streams, anchors, merge keys. These are real production-code concerns for the loader but belong to Story 1A.2 acceptance criteria + tests — the audit's drafted JS is a hint block, not production code. Fix path: Story 1A.2 must include these as explicit test cases.
- **`yaml` vs `js-yaml` package choice** — Edge Case Hunter. Both are in `package.json` dependencies; the audit's drafted body uses `yaml` (eemeli) but some existing Convoke modules use `js-yaml`. Decision belongs to Story 1A.2 design. Fix path: Story 1A.2 design doc should pick one and enforce consistency across `scripts/update/lib/`.
- **Deprecation warning only fires on fallback path** — Blind Hunter. Operators with successful v3→v4 migration will never hit `_loadLegacyConfig`, so they never see the 4.0 deprecation notice and may not realize `bmad-init` is being removed in 4.1. Belongs to Story 1A.4 (deprecation design) — consider emitting a one-shot notice when `_bmad/core/bmad-init/` directory exists even if config loads successfully.
- **convoke-doctor pre-existing issues** — Blind Hunter (triage). Two findings surfaced by `convoke-doctor` during AC6 validation: (a) `_team-factory` missing `add-team` workflow, (b) cross-module version drift (`_artifacts/_enhance/_gyre/_team-factory` at 1.0.0 vs `_vortex` at 3.3.0 vs package 3.2.0). Pre-existing platform hygiene issues, unrelated to 1A.1. Fix path: open separate backlog items for each; neither blocks Story 1A.1 sign-off.
- **Architecture doc Decision 1 vs Pattern 3 inconsistency** — Acceptance Auditor. Architecture doc's Decision 1 sample uses `yaml.parse()`; Pattern 3 says `yaml.parseDocument()` for read-write. The audit resolved this correctly (followed Pattern 3), but the arch doc itself has an internal inconsistency. Not caused by 1A.1. Fix path: flag to Winston for a Round 2 arch doc edit; audit stays as-is.
- **`_resolveProjectRootPlaceholder` mutates input config in place** — Edge Case Hunter. The drafted JS mutates `config[key]` rather than returning a new object. Maintainability / test-mocking hazard. Belongs to Story 1A.2 implementation choice — audit's draft is a hint. Fix path: Story 1A.2 implementer decides mutate-vs-clone based on caller contract.
- **`safe_dump` comment-stripping claim unverified** — Edge Case Hunter. Audit §12 asserts `yaml.safe_dump` strips operator comments as justification for Story 1A.4 round-trip writer. Claim not backed by grep evidence of existing operator comments in installed configs. Belongs to Story 1A.4 migration writer design — the round-trip justification may or may not be warranted. Fix path: before Story 1A.4 implements round-trip, grep installed configs for operator-added comments; if none, simpler `safe_dump` approach is fine.

---

## Deferred from: code review of I71 migration ADR git-add scope narrowing (2026-04-21)

Round 1 review (0 HIGH, 0 patches needed — convergence at Round 1). 1 item deferred:

- **Stale doc reference in historical story artifact `ag-3-4-adr-supersession.md:41`** — the shipped story doc's task checklist still reads `Stage both files: git add _bmad-output/planning-artifacts/`, reflecting pre-I71 broad-stage pattern. Per Convoke doc-immutability convention, shipped story artifacts are frozen at ship-time and not retroactively amended. The reference is LOW severity (historical checklist item, not load-bearing guidance for current work). If a future sweep revisits historical story docs for accuracy, update this line; otherwise leave as-is. Tracked here for audit trail only.

---

## Deferred from: code review of I69+I70 portfolio-engine validation bundle (2026-04-21)

**2 rounds** — Round 1 ad-hoc (0 HIGH, 1 MEDIUM patched: prefix-asymmetry regression). Round 2 formal skill pass (0 HIGH, 1 MEDIUM patched: P1 `--filter` error message disambiguation). **Round 3 not eligible** per convergence rule — both patches content-only. 6 LOW items deferred as pre-existing, minor UX, or out of scope:

- **`--sort=value` equals-form not supported** — Edge Case Hunter MEDIUM→LOW (pre-existing, not a regression). `args.indexOf('--sort')` matches only the exact token; `--sort=last-activity` silently skips the sort block and falls to default alpha. Fix path: accept both `--sort value` and `--sort=value` forms.
- **Duplicate `--sort` / `--filter` flags silently use first occurrence** — Blind + Edge LOW. `indexOf` returns only the first match; `--sort alpha --sort last-activity` silently honors `alpha`. Pre-existing, not introduced by I69+I70. Fix path: detect duplicates and error.
- **Empty-string or whitespace-only filter accepted** — Edge Case Hunter LOW. `--filter ""` and `--filter "   "` pass the `startsWith('--')` check; `filterPattern.startsWith('')` matches everything (empty) or nothing meaningful (whitespace). Downstream silent no-op. Fix path: trim + length check after validation.
- **Flag-like single-dash values accepted as filter** — Edge Case Hunter LOW. `--filter -h` / `--filter -v` treated as legitimate filter values (preserved by design to allow `-legacy` etc.). Almost-certainly-operator-error cases silently yield zero matches. Fix path: additional heuristic — reject single-dash-single-char values, OR emit warning when filter yields zero matches.
- **`filter.replace(/\*$/, '')` strips only trailing star — mid-string globs silently fail** — Edge Case Hunter LOW. `--filter "gyre*extra"` keeps the `*` in the middle; `startsWith` looks for literal `*`, matches nothing. Pre-existing glob-expectation gap; not introduced by I69+I70. Fix path: full glob syntax OR explicit error on unsupported patterns.
- **Skill wrapper passes operator-typed prefix verbatim** — Edge Case Hunter LOW. `_bmad/bme/_artifacts/workflows/bmad-portfolio-status/steps/step-02-explore.md:77` passes `--filter "{prefix}"` without error-handling. If the operator types `--foo`, the wrapper produces `--filter "--foo"` which now (post-I70) errors with exit 2. Operator sees a raw CLI error. Fix path: skill wrapper catches exit-2 and recovers gracefully OR pre-validates the prefix before invoking CLI.
- **Magic number `process.exit(2)` lacks inline comment** — Blind Hunter LOW. Four exit(2) calls in arg parsing; convention not documented inline. Minor style. Fix path: add `// exit code 2: usage error (per convention)` comment or extract a named constant.
- **`process.exit(2)` inside `main()` prevents unit-level validation tests** — Blind Hunter LOW. Validation logic exercised only via subprocess spawn. Structural concern; refactor would extract arg parsing to a pure function with error-return semantics. Interacts with I20 Round 2 defer about fixture-isolated CLI integration tests.

---

## Deferred from: code review of A35+A36 bundle — Round 1, reverted (2026-04-21)

Round 1 review surfaced 5 HIGH + 6 MEDIUM findings revealing architectural premise issues with A36 ("`validate.md` is a standalone workflow, not a sibling companion" — Edge Case Hunter). Both edits reverted; combined rework tracked as **A44** (Layer 1 + operator-facing text correct semantics). Defers below capture findings adjacent to A44's primary scope:

- **`_deprecated/` subtree audit scope** — Edge Case Hunter MEDIUM. `_bmad/bme/_vortex/workflows/_deprecated/empathy-map/` still contains workflow.md + validate.md + template.md. A44's filesystem survey should decide whether deprecated-subtree files are in scope for current audits. Fix path: explicit carve-out in §2.4 for `_deprecated/**` subtrees, OR include them with a clear "deprecated workflows are audited-but-not-retrofitted" policy.
- **README-like / operator-read-but-not-workflow-loaded files** — Edge Case Hunter LOW. Workflow-root `README.md`-style files that operators might read in a repo browser but workflows don't `Read` at runtime. A44's categorization should address this boundary — are repo-browsing reads "normal execution path" or out-of-scope?
- **Multi-step `Read` attribution** — Edge Case Hunter MEDIUM. If `empathy-map.template.md` is `Read` by both step-04 and step-06, is it Layer 1 (once at workflow level) or Layer 2 (per-step)? A44 must resolve; interacts with §2.6 inheritance semantics.
- **A10 §Cell Selection semantic effect** — Edge Case Hunter LOW. A36's Layer 1 expansion (had it shipped) would create a new class of borderline cells — companion-file contributions to Layer 1. A44 resolution should note whether Cell Selection guidance needs amendment to include companion-file inclusion as a candidate borderline axis.

---

## Deferred from: code review of A40 Publication Gate amendment (2026-04-21)

Round 1 code review of A40 (5 spec edits to `convoke-epic-operator-covenant.md`) produced 4 `defer` items — pre-existing or out of A40 scope.

- **"Worst-scoring rights" remains undefined** — Blind Hunter. The retrofit clause says "rights scoring worst in the audit" but does not specify a threshold (top-1? bottom-quartile? below some score?). Pre-existing from 2026-04-18 amendment; re-entrenched but not introduced by A40. Fix path: add explicit threshold to Epic retrofit rule, or reference Selection Discipline criteria from the Compliance Checklist. Candidate for a follow-up Fast Lane item.
- **Rationale parentheticals embedded in normative text** — Blind Hunter. "(you don't publish a covenant you can't keep) AND evidentiary breadth... (you don't publish a claim you can't back with evidence)" — rhetorical justification mixed inside gate clauses. Pre-existing pattern from original 2026-04-18 amendment; retained for voice consistency. Style issue, not a correctness issue.
- **Secondary-channel (blog post) approval loophole unchanged** — Blind Hunter. Story 2.3 AC says "an accompanying blog post is optional and requires separate approval (secondary channel)" — the separate-approval authority is unspecified. Pre-existing, out of A40 scope (A40 is specifically about the Publication Gate conditions, not secondary-channel governance).
- **T1/T2 trigger interaction with ≥2 portfolio audits unspecified** — Edge Case Hunter. A new portfolio audit at N ≥ 3 could fire T1 on a new right in a team that was previously un-audited. Story 2.1 was closed under v1 trigger evaluation. The Epic is silent on whether T1 re-firing on new portfolio data re-opens Story 2.1's retrofit scope automatically (vs. the A40 patch that covers "newly-surfaced bottleneck rights"). Interesting follow-up: tighten the T1/T2 rule to explicitly cascade across portfolio audits added post-v1.

---

## Deferred from: code review of spec-a33-checklist-workflow-md-scope (2026-04-20)

Round 2 code review of A33 produced these `defer` items — real findings, but pre-existing, bounded out-of-scope by A33's §2.6-amendment focus, or already captured in downstream Epic 2 Story 2.1 retrofit scope.

- **Operator-visible boundary cases undefined at edges** — Blind Hunter + Edge Case Hunter. Frontmatter, HTML comments, fenced code blocks, `Note:` blocks, Steps Overview bullet lists — §171 "Operator-facing vs agent-facing text" names only `MANDATORY EXECUTION RULES` / `YOUR ROLE:` as agent-facing examples. The operator-vs-agent boundary is hand-waved at the edges. A33's Scope paragraph inherits this silence; it becomes more load-bearing post-A33 because inheritance now depends on operator-visibility determination. Pre-existing §171 scope issue, out of scope for A33 which only disambiguated workflow.md-vs-step-01 scope. Fix path: extend §171 with exhaustive enumeration or a semantic test ("agent-facing = imperative addressee is the LLM and not rendered/echoed to the operator").
- **Steps Overview bullet headers: navigational vs concept-introducing** — Edge Case Hunter. In empathy-map/workflow.md:17-22 the Steps Overview list enumerates quadrant names ("Says & Thinks / Does & Feels / Pain points / Gains"). Under A33's broader reading these pre-exist at step-01, but it's unresolved whether list items in navigational sections count as concept-introductions or scaffolding. Directly affects empathy-map PASS reproducibility. Related to A13 (OC-R7 concept-counting for compound concepts) already in backlog.
- **Alias and parenthetical-expansion counting** — Edge Case Hunter. Example: workflow.md says "JTBD"; step-01 says "job-to-be-done (JTBD)". A33 is silent on whether the parenthetical re-introduction counts as novel. Related to A13. Fix path: append to §2.6 novel-concept glossary — "aliases / parenthetical expansions / synonymic re-phrasings of pre-existing concepts do not re-introduce them."
- **Sibling files (`template.md`, `validate.md`) silently escape Layer 1/2 enumeration** — Edge Case Hunter. §2.4 Layer 1 names only `workflow.md`; Layer 2 is `steps/**.md`. Sibling operator-loadable files at the workflow root (e.g., `empathy-map.template.md`, `validate.md`) are neither. Their operator-visible concept-introductions (e.g., empathy-map's validate.md lines 57-66 naming "Says/Thinks/Does/Feels/Pains/Gains dimensions") evade OC-R7 entirely. Genuinely new edge surface. Fresh Fast Lane candidate: extend §2.4 Layer 1 to cover workflow-root companion files, OR explicit §2.4 exclusion rule for sibling files.
- **Step-01 `Read`s workflow.md at runtime and echoes concepts to operator** — Edge Case Hunter. Is the echo a re-introduction (exempt per A33 ¶4) or a fresh Layer 2 introduction that counts toward step-01's novel-concept budget? Ambiguous; affects Vortex workflows that deliberately re-state workflow.md context in step files.
- **Cross-module `Read` (bmad-init bridging, Compass routing)** — Edge Case Hunter. A skill that loads another skill's workflow.md mid-execution: are those cross-module concept-introductions inherited into the caller's step files? A33's "within the same workflow" scope (BS2 restoration) is now silent on cross-workflow reuse. Fix path: explicit rule — cross-workflow `Read`s treat the loaded content as Layer 2 of the calling step.
- **New FAIL surfaces at dense Layer 1 workflows** — Edge Case Hunter. A33's anti-escape-hatch clause (¶4) requires workflow.md's own operator-visible content to pass OC-R7 at Layer 1. Skills with dense prose preambles (assumption-mapping/workflow.md:14-19 has 5+ novel concepts: bet / hides assumptions / lethality / uncertainty / testing order) now implicitly FAIL Layer 1 under A33. Already captured in Epic 2 Story 2.1 retrofit scope (assumption-mapping + hypothesis-engineering step-01 retrofits) — this defer is a note, not a new action. Revisit when Story 2.1 kicks off.
- **§171 examples list not exhaustive** — Edge Case Hunter. Blocks like `<critical-rules>`, `SYSTEM:`, INITIALIZATION lists — status (operator-visible or agent-facing) undetermined. Bundleable with the "operator-visible boundary cases" item above; same fix path.
- **Cross-workflow concept-reuse rule gap** — Blind Hunter. A33 ¶1 restricts inheritance to "within the same workflow" (BS2 fix). Shared concepts (HC contracts, JTBD) that appear across Vortex agents have no rule for whether workflow B's step file inherits from workflow A's workflow.md. Produces a silence, not a resolution. Candidate for a sibling rule "cross-workflow concept reuse."

Common theme: 4 of 9 defers point to follow-up Fast Lane candidates — (a) operator-visible boundary formalization in §171, (b) sibling-file Layer classification in §2.4, (c) cross-module / cross-workflow reuse rule, (d) alias/expansion counting in §2.6. Consider bundling into a single follow-up initiative or routing through `bmad-enhance-initiatives-backlog` Triage mode.

---

## Deferred from: code review of spec-bug-2-adr-idempotent-noop-commit (2026-04-20)

- **Broad `git add _bmad-output/planning-artifacts/` stages unrelated modified files** — `scripts/migrate-artifacts.js:399` stages every modified/untracked file under the scope dir, not just the ADR paths written by this phase. If the operator has unstaged edits to sibling ADRs or notes when re-running the migration, they silently get absorbed into the `"chore: generate governance convention ADR"` commit. Pre-existing; explicitly scoped out of BUG-2 per spec I/O Matrix. **Round 2 note:** the BUG-2 idempotency check amplifies the consequence — pre-fix, a second run with unrelated staged changes would at least error loudly on "nothing to commit" (the ADR file was byte-identical and git found no diff *for the ADR*, but the unrelated staged change would have been committed too). Post-fix, the diff-check sees the unrelated staged change and proceeds to commit it under the ADR message without any warning. Fix path unchanged: stage only `adrPath` and (when `supersedePreviousADR` returns true) the supersede target path.
- **Concurrent `convoke-migrate` invocations create TOCTOU window** — `scripts/migrate-artifacts.js:399-418`. Between `git add`, `git diff --cached`, and `git commit` a second process could empty the index. With the BUG-2 fix, the diff-check says "has staged changes" but the subsequent commit then errors with "nothing to commit", landing in the outer catch as a misleading ADR warning. Real user exposure is low (migrations aren't intended to be run concurrently) and the T4 test isolates each invocation. Fix path: `_bmad-output/planning-artifacts/.migration.lock` flock around all three commit phases, or `git commit -o <pathspec>` to restrict the commit to ADR paths.
- **T4 positive stdout assertion is fragile across UTC midnight rollover** — `tests/integration/migrate-artifacts-idempotency.test.js:205-209` (added Round 1 patch). If tests 1 and 3 straddle UTC midnight, the ADR `**Date:**` field differs between runs, `hasStagedChanges=true`, stdout shows `"ADR generated"` not `"ADR already current"`, `assert.match(/ADR already current/)` fails. Very-low-probability flake — full T4 run is ~1.1s so the window is ~1/86400 per CI run. Fix path: either freeze the clock in the fixture (env `TZ=UTC` + mock `Date`) or relax the match to a disjunction that still distinguishes regression paths.

---

## Deferred from: code review of oc-vortex-audit-expansion-a24 (2026-04-19)

Round 1 code review of A24 produced these `defer` items (real findings, out of scope for the current round or already acknowledged in-report):

- **Step-01 sampling bias — later steps unaudited** — Edge Case Hunter. All 3 audited workflows have more than step-01 (assumption-mapping: 4 steps, empathy-map: 6 steps, hypothesis-engineering: 5 steps). Step-01 is plausibly the highest-concept-density step (IN-12 origin), but later steps could harbor different rights violations unquantified by A24. The report's §7 Reproducibility section acknowledges the single-reviewer limit but does not acknowledge the step-01-scope limit. Future audit scope (candidate A26: Vortex HC-schema pattern audit) should cover ≥ 2 steps per workflow or explicitly scope to step-01 with documented rationale. Revisit when Epic 2 Story 2.1 retrofit scope is committed.
- **Third-workflow "twins" pick — structural diversity in future audits** — Blind Hunter. A24's third pick (hypothesis-engineering) was chosen for structural parity with assumption-mapping (both lack template/validate scaffolding, both invoke HC-schema-at-step-01). This guarantees the "shared architectural pattern" finding. Future Vortex audits should include at least one structurally-different skill per audit to avoid pattern-confirmation bias. Non-blocking for A24 findings but shapes future-audit protocol.
- **IN-12 intake-to-shipped in one day** — Blind Hunter. Governance smell: IN-12 was triaged 2026-04-18, renamed + spec-authored + executed + shipped 2026-04-19. For Fast Lane items the cycle time is intended; for audits with provisional findings bound to Epic 2 scope, a cool-down pause might reduce in-loop bias. Candidate for retrospective discussion; no deliverable change required.
- **T1 boundary case — exactly 70% compliance** — Edge Case Hunter. Epic's T1 threshold "< 70%" is strict-less-than. Boundary case: a cell at exactly 70% does not fire. Clarify in Epic text or via example. Out of scope for A24; belongs in Covenant Epic Story 2.1 spec revision.

---

## Deferred from: scope of T4 (migration idempotency CLI test) — 2026-04-19

T4's CLI-level idempotency test + its Round 1 code review revealed several latent issues while verifying functional idempotency holds:

- **ADR generation silently fails on re-run with byte-identical content** — MEDIUM. `scripts/migrate-artifacts.js:402-404` downgrades ADR generation failures to `console.warn` and keeps exit code 0. When the third (or any subsequent) migration run produces an ADR whose content is byte-identical to the previous run's ADR (same date, same `renameCount`, same `scopeDirs`), `git commit` errors with "nothing to commit, working tree clean", the phase is reported as failed via warning, and the caller sees a successful exit. T4's stderr-warning guard fires; the test allow-lists this class via `ALLOWED_WARNING_PATTERNS` (`tests/integration/migrate-artifacts-idempotency.test.js`). Fix options: (a) use `git commit --allow-empty` so re-runs always produce an ADR commit, (b) detect no-op before calling git and skip cleanly without warning, or (c) include a monotonic run counter in the ADR content so it's never byte-identical across runs. Surfaced by Edge Case Hunter Round 1 review of T4.
- **`runScript` returns `exitCode: null` on `execFile` timeout** — MEDIUM (pre-existing helper bug, affects many tests). `tests/helpers.js:143-152` maps `err.code` to `exitCode`, but `execFile`'s timeout sets `err.signal='SIGTERM'` and leaves `err.code === null`. Tests asserting `exitCode === 0` fail with `null !== 0` and zero diagnostic about the timeout. Fix: surface `err.signal`/`err.killed` as a distinct `timedOut` field in the helper's return value.
- **`detectMigrationState` scans only last 5 commits — boundary risk** — LOW. `scripts/lib/artifact-utils.js:~2118` reads `git log -5 --format=%s`. T4's test 4 approaches the boundary (4 commits from first run + seed commit = 5). Any additional intervening commit in the fixture would push the governance marker off the window and silently flip state detection from `'complete'` to `'fresh'`. Fix: increase the window OR document the 5-commit ceiling as a fixture-design constraint.
- **Missing baseline idempotency case — zero ungoverned files from the start** — LOW. T4 covers (1) migrate, (2) no-op re-run, (3) new-file resumption. The fourth scenario — a fixture with NO ungoverned files in `_bmad-output/` from the beginning — is untested. Adding this closes the "CLI handles an already-clean project on first run" path.
- **Test 4 over-specifies git state** — LOW. Test 4 commits the new ungoverned file before running the migration. If the migration scanner ever regresses to only see staged/committed files (not unstaged), this test wouldn't catch it. Consider an additional variant that leaves the new file uncommitted.
- **Windows portability of execSync arg strings** — LOW. T4's initial implementation used string commands; Round 1 patch converted to `execFileSync` with argv array, closing this. No follow-up needed, but noting that any future sibling tests should follow the argv pattern.

- **Migration-generated meta-artifacts flagged as ungoverned on re-run** — MEDIUM. When `convoke-migrate --apply --force` runs against a fresh project, it writes `_bmad-output/planning-artifacts/adr-artifact-governance-convention-<date>.md` and `_bmad-output/planning-artifacts/artifact-rename-map.md`. On the next run, the inference engine flags these as "ambiguous — cannot infer type or initiative" because their filenames don't match the `{initiative}-{artifact_type}` convention the migration itself is enforcing. Functional idempotency still holds (no new commits, no state change — T4 asserts this directly), but the CLI emits `"Previous migration detected, but new ungoverned files found. Proceeding with fresh migration."` followed by `"Nothing to rename"` instead of the cleaner `"Nothing to migrate — all files governed."`. Fix options: (a) inject governance frontmatter into the ADR and rename-map on creation so they're recognized as governed, or (b) add these specific filenames to an inference-time exclusion list. Deferred because the user-facing confusion is mild and the functional idempotency holds; however this should be fixed before any retro cites "Nothing to migrate" as the canonical no-op signal. Relevant: `scripts/migrate-artifacts.js:278-287` (`detectMigrationState` + manifest-has-work check); `scripts/lib/artifact-utils.js:926` (`buildManifestEntry`).

---

## Deferred from: scope of T3 (end-to-end update test on real project) — 2026-04-19

T3 shipped as a CLI-level non-dry-run upgrade test with full post-state verification (previously missing). The following were explicitly scoped out as they'd be disproportionate to T3's score (2.7) or would reintroduce flakiness:

- **Real `npm pack` fetch of published versions** — MEDIUM. T3 uses a simulated older-version fixture (mirroring `tests/integration/upgrade.test.js` pattern). A true end-to-end test would `npm pack` the old version from the registry, extract it, install into a tmp project, then run `convoke-update`. Rejected because: (a) registry lookup is network-dependent and flakier than library tests, (b) the signal added beyond the simulated fixture is narrow (shape-of-old-install is what matters, not provenance), (c) cost compounds if we span multiple old versions. Revisit if CI ever hits a regression the simulated-fixture pattern missed.
- **Migration of user-authored custom agents** — LOW. `mergeConfig` already preserves user-added agents (not in `AGENT_IDS`) via the `userAgents` spread at `scripts/update/lib/config-merger.js:113-117`. Unit tests cover this. An end-to-end CLI test for user-authored custom agents would extend T3's scope into a separate concern. Split if custom-agent upgrade behavior ever regresses.
- **Interactive prompt mode testing** — LOW. T3 uses `--yes` to bypass the confirm prompt. Covering the interactive path would require TTY simulation (pty, expect-style harness) — high cost for low signal since the non-interactive path exercises the same code modulo the single `readline` call. Split if interactive-mode bugs surface.

---

## Deferred from: code review of A15 + A5 + A10 Round 2 (2026-04-18)

- **Revisions table row is a multi-hundred-word paragraph per patch cycle** — LOW. Each shipping round appends a long cell to §Revisions. Cell readability is degrading. Consider splitting into one row per shipped patch or extracting Round-level detail to a dedicated `revisions/` folder with a pointer from the table.
- **Parser grammar § doesn't recognize the `Layers:` evidence-note prefix** — MEDIUM. P1 added a mandatory `Layers:` bulleted line in evidence notes for OC-R6 when `external-declared` is used, but the Parser grammar §currently validates only the Compliance Status column. Until Story 2.2 builds the Loom parser, the "first-class data" discipline is aspirational — enforcement depends on reviewer vigilance.
- **`(external)/(internal)` OC-R0 tokens share substring with `external-declared` OC-R6 value** — LOW. Grep-based tooling scanning evidence notes for `external` will match both the OC-R0 qualifier and the OC-R6 value. Namespace collision is cosmetic but worth noting for anyone writing grep-backed reporting in the future.
- **Misprediction + DISPUTED interaction edge case** — LOW. If the auditor predicted PASS, both reviewers agreed FAIL (mispredicted but reproducible), and the cell is then DISPUTED-excluded via path (b) for unrelated reasons (e.g., the verdict itself was mutually-reviewer-contested in a re-run), the interaction between calibration-signal logging and DISPUTED exclusion isn't specified. Defer until observed in a real v2+ audit.

---

## Deferred from: code review of A15 + A5 + A10 (2026-04-18)

- **A10 3-cell minimum doesn't scale** — HIGH. A 2-skill audit has 14 cells (3 cells = 21% sample); an 8-skill audit has 56 cells (3 cells = 5%). Fixed floor regardless of audit size. Scaling via a percentage floor or explicit "minimum OR 10% of matrix" would be more defensible. Design-level rework — deferred.
- **A15 OC-R0 enumeration doesn't distinguish internal vs external Layer 3 authorship** — MEDIUM. After A15's patch, the Checklist now requires an `(external)`/`(internal)` qualifier on each L3 enumeration entry to validate `external-declared` precondition 2b. The OC-R0 row wording in the main checklist table was not updated to match — the qualifier is documented only in the A15 value row. Broader methodology edit (OC-R0 row + evidence-note template examples) should follow.
- **A5 "research/catalog/audit/inventory" has no operational test** — MEDIUM. Is a retrospective (inventories lessons) covered? A portfolio status report (scans artifacts)? A PRD section listing personas? Rule reads as broad enough to rope in most status reporting. Fix requires either an operational test definition or an example list — scope decision pending.
- **A5 retroactive gap on v1 audit sample selection** — MEDIUM. §6 of the v1 audit admits "One of each was sampled" for 20+7 workflows without a grep/glob enumeration paste. Rule is prospective, retro-application reopens closed work. Noting in case a v2 audit wants to close the gap prospectively.
- **A15+A10 interaction: N/A-variant disagreement slips through verdict-agreement threshold** — MEDIUM. If two blind reviewers disagree on whether an OC-R6 cell is `N/A — external-declared (git)` vs `FAIL` vs `N/A — out-of-scope`, that's not a PASS/FAIL disagreement per A10's threshold semantics. Reviewers could agree on "it's not PASS" while differing on the reason. Threshold reworking needed; deferred pending v2+ audit evidence.
- **A5 story templates not updated to require search-command field** — LOW. Rule asks specs to include the exact grep/glob command as a required input. `bmad-create-story` and sprint-planning templates weren't edited. Authors will forget. Small follow-up task.

---

## Deferred from: code review of U8 — excluded_agents (2026-04-18)

- **Cross-module exclusion-ID validation** — `excluded_agents: [stack-detective]` in `_bmad/bme/_vortex/config.yaml` silently no-ops (Vortex never iterates that ID), and typos like `noha` (meant `noah`) silently no-op too. Neither `mergeConfig`, `refresh-installation`, nor `convoke-doctor` warns. Validation would require knowing each module's legal agent ID set.
- **`excluded_agents: []` default appears without explanatory comment on upgrade** — fresh installs get the shipped source YAML with the inline comment block. Operators upgrading from pre-U8 see `excluded_agents: []` appear in their config (via `merged.excluded_agents = excludedAgents` in `scripts/update/lib/config-merger.js`) but with no context. Fix requires comment-injection logic in `writeConfig` — broader scope.
- **YAML parser asymmetry between `readExcludedAgents` and `mergeConfig`** — the reader uses js-yaml (`yaml.load`), `mergeConfig` uses the `yaml` package (`YAML.parseDocument`). A file that parses differently under the two libraries (rare anchor/merge-key edge cases) could cause `refresh-installation` to copy an excluded agent's files while `mergeConfig` removes the ID from `merged.agents`. Pre-existing architectural split from ag-7-1.
- **Duplicate entries in `excluded_agents` not deduped** — `excluded_agents: ['noah', 'noah']` persists both entries through the merge. Inconsistent with the `Set`-based dedup on `agents`. Purely cosmetic.
- **EXTRA_BME_AGENTS (team-factory, etc.) have no exclusion mechanism** — `_team-factory/config.yaml` has no `excluded_agents` field and `refresh-installation` only reads Vortex + Gyre configs for the exclusion snapshot. Operators can't opt out of standalone bme agents. Feature-scope choice — revisit if a standalone agent ever needs opt-out.
- **Dev-mode (isSameRoot) skill wrapper generation doesn't honor exclusion** — when `packageRoot === projectRoot`, the agent-file copy loop is skipped but the skill-wrapper generation loops (§6 and §6b) still fire. Minor inconsistency that only affects dev testing of exclusions via same-root install.

---

## Deferred from: code review of BUG-1 + U7 (2026-04-18)

- **`DEFAULT_ARTIFACT_TYPES` drift from taxonomy** — `scripts/migrate-artifacts.js:135` lists 22 types (no `note`); `_bmad/_config/taxonomy.yaml` has 23. A fresh project that hits `bootstrapTaxonomy` before the first migration renders an ADR with the bootstrap list, not the committed taxonomy. Already tracked as **I54** in `convoke-note-initiative-lifecycle-backlog.md` — not re-logging.
- **`taxonomy.initiatives.user` silently dropped from generated ADR** — `scripts/lib/artifact-utils.js:2031` renders only `taxonomy.initiatives.platform`. If user-scope initiatives grow meaningful, they're invisible in the governance artifact. Design decision — defer until user-scope initiative UX is explicitly on the table.
- **Empty `taxonomy.initiatives.platform` / `artifact_types` arrays render degenerate ADR text** — `readTaxonomy` (`scripts/lib/artifact-utils.js:148-160`) validates the fields are arrays but not that they're non-empty. An operator editing `_bmad/_config/taxonomy.yaml` to comment out entries produces `**Platform initiatives (0):** ` with nothing after the colon. Upstream validation is the right place for the fix.
- **`compareVersions` silently coerces pre-release versions to their base** — `scripts/update/lib/utils.js:27-39` does `Number('4-alpha') → NaN → 0`, so `compareVersions('1.0.4-alpha', '1.0.4')` returns 0. Pre-existing limitation of the shared utility; affects U7's version-range filter but also any other consumer. Broader-scope fix.
- **`__dirname`-based CHANGELOG path resolution is fragile under bundlers/PnP** — `scripts/update/lib/changelog-reader.js:7` resolves three levels up from the lib file. Works for npm/npx today (verified via `package.json` files list) but breaks under Yarn Plug'n'Play zipped installs or any future bundler flattening. Speculative; defer until a real install mode complains.
- **No verbose-gating or max-entry cap on printed changelog** — a user on `v1.0.0` upgrading to `v3.2.0` will see every intervening release body streamed to stdout before the confirm prompt, pushing the Plan/Breaking-Changes block off-screen. Defer until someone actually hits this; the cross-major-version span is rare by design.

---

## Deferred from: code review of oc-1-5-adoption-surface (2026-04-18)

- **bme/README submodule table omits `_bmad/bme/config.yaml`** — MEDIUM. A sibling `config.yaml` file lives next to the 7 submodule directories but isn't listed in the new bme/README's Submodules table or anywhere else in the file. Strictly the table scope covers directories, so it's defensibly correct-as-scoped, but a contributor reading the README for bme-namespace orientation won't learn that `config.yaml` exists. Out of scope for Story 1.5 (Covenant surfacing). Follow-up: either add a "Files" note mentioning `config.yaml`, or widen the table scope to include it.
- **`docs/` directory has 6 contributor-facing files with no Covenant pointer** — MEDIUM. `docs/` holds `agents.md`, `development.md`, `faq.md`, `references.md`, `testing.md`, `BMAD-METHOD-COMPATIBILITY.md` — but no `docs/README.md` or `docs/index.md`. Story 1.5's AC #3 "3-of-4 coverage" substitution (docs index doesn't exist) is legitimate, but a contributor landing on `docs/` via a GitHub tree view sees six docs with no Covenant orientation. Follow-up: create `docs/README.md` as the docs index, with a Covenant pointer as one of its first sections — makes the 4th discovery path real rather than absent.
- **Canonical Covenant location under `_bmad-output/planning-artifacts/` — architectural path smell** — LOW. `_bmad-output/` is conventionally the output/artifact tree (often treated as ephemeral / git-ignored in other projects). Hosting durable required-reading documents like the Covenant and Compliance Checklist there confuses "output of a workflow" with "canonical spec". Story 1.5 inherits the location decided in oc-1-4; moving it would ripple across many references. Follow-up: evaluate whether the Covenant and Checklist should live at a canonical docs path (e.g., `docs/covenant/`) with `_bmad-output/planning-artifacts/` retaining a pointer.

---

## Deferred from: code review of oc-1-2-taxonomy-extension (2026-04-18)

- **Duplicate `DEFAULT_ARTIFACT_TYPES` across two files** — `scripts/migrate-artifacts.js:135` and `scripts/update/lib/taxonomy-merger.js:11` maintain identical hardcoded arrays that must stay in lockstep with each other and with `_bmad/_config/taxonomy.yaml`. Adding a new artifact_type requires editing three locations symmetrically — a drift bug waiting to happen. Refactor to a single source (either a shared constant module or reading from the shipped yaml at startup). Pre-existing architectural debt; surfaced by Blind Hunter during Round 1 review.
- **`generateGovernanceADR` hardcodes "Artifact types (21)"** — `scripts/lib/artifact-utils.js:2033` contains a template literal claiming 21 types and listing only 21 names. After recent additions (`note`, now `covenant`), the committed `_bmad/_config/taxonomy.yaml` has 23 types. Every governance ADR produced by a migration `--apply` now misreports the type count and omits both new types. Fix: derive the list and count from the taxonomy passed into `generateGovernanceADR` instead of hardcoding. Pre-existing drift; surfaced by Edge Case Hunter during Round 1 review.

---

## 🚨 URGENT — phantom test recurrence detected (2026-04-09)

**This is the C1 pattern from the original [astonishment report](../test-artifacts/2026-04-08-astonishment-report.md)
recurring DURING the recovery initiative that exists to prevent it.** Surfacing
loudly so the next person reading this file cannot miss it.

### Symptom

Two test files in `tests/lib/` are exit-code-1 broken under standalone
`node --test` invocation:

| File | Standalone result | Wired into `npm test`? |
|---|---|---|
| [tests/lib/portability-classification.test.js](../../tests/lib/portability-classification.test.js) | `tests 1, pass 0, fail 1` (file-load failure) | **NO** |
| [tests/lib/portability-schema.test.js](../../tests/lib/portability-schema.test.js) | `tests 1, pass 0, fail 1` (file-load failure) | **NO** |

Both report exactly 1 "test" — that's `node --test` counting the file itself
as a single failed test because it errored during `require()` before any
`it()` callback ran. **Identical failure mode to the 8 original Jest phantom
tests in `tests/lib/*` discovered on 2026-04-08.**

### Diagnosis (best guess, not verified)

Both files import `../../scripts/portability/manifest-csv` (lines 3 of
each). The `scripts/portability/` directory exists in the working tree but
is **untracked** (not yet committed) and may not export the symbols the
tests require:
- `portability-classification.test.js` imports `{ readManifest }`
- `portability-schema.test.js` imports `{ parseCsvRow, countCsvColumns }`

If `manifest-csv.js` doesn't exist or doesn't export these names, the
test files crash on require. The tests use plain `node:test` style (not
Jest), so the failure mode is "production code missing", not "test
framework missing" — a different flavour of the same bug class.

### Why this matters

The recovery initiative (Stories I, L, F.1, F.3, A, B.1-B.4 + polish)
exists *specifically* to prevent the C1 phantom-test bug class. Allowing
phantom tests to be reintroduced in `tests/lib/` while the recovery is
in flight is **the same failure mode the recovery exists to prevent**.

The original failure was: tests existed, looked correct, were never
executed. **The new failure is: tests exist, look correct, are not wired
into `npm test`, and crash on standalone invocation anyway.** Worse than
the original — these are double-broken.

### What I (Murat) deliberately did NOT do

- **Did NOT wire the files into `npm test`**. Doing so would break the
  CI gate (exit 1 from file-load failures) and block every subsequent PR
  including B.5+.
- **Did NOT fix the failure mode**. The `scripts/portability/` work is
  in-progress in a parallel session that I do not own. Fixing the imports
  here could conflict with the parallel session's next save.
- **Did NOT delete the files**. They are someone's intentional in-progress
  work; deleting them silently would be hostile.

### What needs to happen (action items for the portability work owner)

1. **Verify `scripts/portability/manifest-csv.js` exists** and exports
   `readManifest`, `parseCsvRow`, and `countCsvColumns`. If not, either
   write the module or remove the imports until it exists.
2. **Run `node --test tests/lib/portability-classification.test.js`** and
   `node --test tests/lib/portability-schema.test.js` standalone before
   each save. Both should report `pass > 0, fail 0` before being wired
   into the gate.
3. **Wire both files into `npm test`** (literal paths, same pattern as
   `tests/lib/migrate-artifacts.test.js`, `taxonomy.test.js`,
   `inference.test.js`, `portfolio-rules.test.js`) **only after they pass
   standalone**.
4. **Folding into the `tests/lib/*` glob** happens at Story F.2 (after
   Story B.8), not piecewise.

### Why this lives in `deferred-work.md` and not in a story file

The portability work owner is a parallel session, not the recovery
initiative. The recovery initiative's job is to *surface* the recurrence,
not to *fix* it (which would step on parallel work). Documenting it here
makes the issue findable by anyone running a future `bmad-code-review` or
astonishment-report sweep on this repo.

---

## ⚠️ UPDATE 2026-04-09 — orphan count grew, diagnosis sharpened, F.2 blocked

After completing Story B (all 8 `tests/lib/*.test.js` Jest→node:test
conversions), F.2 (replace literal paths with `tests/lib/*.test.js` glob
in `npm test`) was the next step. F.2 is **blocked** by the orphan
portability tests below.

### Updated state of `tests/lib/` orphans

| File | Standalone result | LOC | Tests | Wired into `npm test`? |
|---|---|---:|---:|---|
| `tests/lib/portability-classification.test.js` | `tests 1, pass 0, fail 1` (file-load failure) | 171 | 7 | NO |
| `tests/lib/portability-schema.test.js` | `tests 1, pass 0, fail 1` (file-load failure) | 118 | 5 | NO |
| `tests/lib/portability-validation.test.js` (NEW since 2026-04-08) | `tests 1, pass 0, fail 1` (file-load failure) | 205 | 9 | NO |
| **Total** | **3 phantoms** | **494** | **21** | **all NO** |

### Sharpened diagnosis (supersedes 2026-04-08 guess)

Yesterday's entry guessed the failure was "missing exports from
`scripts/portability/manifest-csv`." That was wrong. The actual diagnosis,
captured today by running standalone:

```
ReferenceError: describe is not defined
    at Object.<anonymous> (tests/lib/portability-classification.test.js:38:1)
```

**The portability test files use Jest API directly without converting:**
they call `describe()`, `test()`, `expect()`, `beforeAll()` at top level
without importing from `node:test`. Confirmed by grep:

```
$ grep -c "expect(" tests/lib/portability-*.test.js
tests/lib/portability-classification.test.js:20
tests/lib/portability-schema.test.js:?
tests/lib/portability-validation.test.js:?
```

`scripts/portability/manifest-csv.js` exists and exports the symbols the
tests import — that part is fine. The crash is the missing `describe`
import, identical in shape to the 8 original C1 phantom tests in
`tests/lib/` that the recovery initiative just spent a day fixing.

**This is the C1 pattern recurring exactly, in the same directory the
recovery initiative just cleared.** The parallel session producing the
portability work is using the same Jest-by-default behavior the original
astonishment report flagged as the root cause.

### Why F.2 is blocked

F.2 was specified as: replace the literal-path enumeration in `npm test`
and `test:coverage` with `tests/lib/*.test.js` glob. Now that all 8 Story
B files pass, the glob would normally be safe. **But the glob also
matches the 3 broken portability files**, which would crash the gate
immediately on next CI run.

Workarounds I considered and rejected:
1. **Convert the 3 orphans myself** — same mechanical translation as
   B.1-B.8, ~20-30 min total. **Rejected** because the parallel session
   owner explicitly confirmed (2026-04-09) they are actively working on
   these files. Editing them concurrently risks merge conflicts and
   silently overwriting work-in-progress.
2. **Delete the orphans and proceed with F.2** — clears the blocker but
   destroys parallel-session work. Hostile.
3. **Custom Node-side glob script that excludes them** — more complex
   than the literal paths I'm trying to retire. Defeats F.2's purpose.

**Chosen path:** keep the literal-path scaffolding in place; defer F.2
until the parallel session converts the 3 portability files. When that
lands, F.2 becomes a 2-line edit (test glob + test:coverage glob).

### What the portability work owner needs to do

Per the **completed** Story B sequence, the conversion pattern is now
well-established. For each portability file:

1. Add at the top of the file:
   ```js
   'use strict';
   const { describe, it, before, beforeEach, afterEach } = require('node:test');
   const assert = require('node:assert/strict');
   ```
2. Rename `test(` → `it(` (keep names verbatim).
3. Rename `beforeAll` → `before` (and `afterAll` → `after` if used).
4. Translate `expect()` assertions per the cumulative table in Stories
   B.1-B.8 commit messages. Most patterns are 1:1 mechanical:
   - `expect(x).toBe(y)` → `assert.equal(x, y)` (strict under
     `node:assert/strict`)
   - `expect(x).toEqual(y)` → `assert.deepEqual(x, y)`
   - `expect(arr).toContain(item)` → `assert.ok(arr.includes(item))`
   - `expect(x).toBeNull()` → `assert.equal(x, null)`
   - `expect(x).toBeTruthy()` → `assert.ok(x)`
   - `expect(arr).toHaveLength(n)` → `assert.equal(arr.length, n)`
   - See B.5 commit message for the `toContainEqual(stringMatching())`
     pattern if any portability test uses it.
5. Run `node --test tests/lib/portability-<name>.test.js` standalone
   and confirm `pass > 0, fail 0` before considering it done.
6. Add the file to the `npm test` glob in `package.json` as a literal
   path (or wait for F.2 to fold all `tests/lib/*` into a glob — this
   becomes safe the moment all 3 portability files pass standalone).

### When F.2 unblocks

F.2 unblocks when **all 3 portability tests pass standalone under
`node --test`**. At that point:

1. Replace the literal `tests/lib/<8 files>` enumeration in `npm test`
   with `tests/lib/*.test.js`.
2. Same replacement in `test:coverage`.
3. Delete the 8 individual lib path entries.
4. Run `npm test` and confirm the gate count includes all 11
   `tests/lib/*` files (8 original + 3 portability).
5. Commit as Story F.2 with a one-paragraph note that the literal-path
   scaffolding from B.1-B.8 is now retired.

## Deferred from: code review of Story B.4 portfolio-rules conversion (2026-04-08)

- **Glob expansion in npm test scripts assumes POSIX shell** — `package.json` `test` and `test:coverage` scripts use shell glob expansion (`tests/unit/*.test.js`). On Windows `cmd.exe` this won't expand and `node --test` will receive literal patterns. Pre-existing pattern across all 5 npm test scripts; B.4 added a literal path, no new glob. **Real issue.** Belongs in a cross-platform compatibility story.
- **Lifecycle defensive call: `cpMock?.restore()` instead of `cpMock.restore()`** — In `tests/lib/portfolio-rules.test.js` `afterEach`, if `beforeEach` throws (e.g. helper resolution fails), the `afterEach` will secondary-throw on `undefined` and mask the root cause. Pre-existing pattern across every other converted test file in `tests/lib/*` and `tests/unit/*`. **Marginal improvement** — would be applied uniformly across the suite, not piecewise. Worth folding into a Story B cleanup pass after B.8 lands.
- **Time-dependent test in `git-recency-rule`** — `'recent activity -> status: ongoing'` and `'multiple artifacts -> picks latest date'` use `new Date().toISOString().split('T')[0]` as the mock return value. At UTC midnight boundary the `daysSince` math could flake by ±1 day. Pre-existing pattern from the original Jest file. **Real flake risk** but inherited by B.4, not introduced. Hardening fix: use a fixed date that's `staleDays - 1` ago instead of `today`. Worth a future story.

## Deferred from: code review of I20 — portfolio markdown formatter unattributed rendering (2026-04-20)

- **`--markdown` path emits terminal-style summary / WIP radar / verbose trace as plain-text interleaved with markdown output** — Edge Case Hunter. `portfolio-engine.js` writes `Total: X artifacts | Governed: ...`, `WIP: N active ...`, and `--- Inference Trace ---` via `console.log` regardless of `useMarkdown`. Pre-I20 behavior, exposed more clearly now that the markdown path has a structured `## Unattributed Files` section above the unstructured tail. Structural fix would move summary/WIP/verbose rendering into `formatMarkdown()` (or make summary a markdown section). Pre-existing, out of scope for I20. Belongs in a portfolio-markdown-output-completeness follow-up.
- **Unattributed section ordering differs between paths** — Edge Case Hunter. Terminal path prints summary lines *then* `--- Unattributed Files (N) ---`. Markdown path now emits `## Unattributed Files (N)` inside the `formatMarkdown()` output (before summary console.log lines). Cosmetic, not a correctness issue — both paths include the section — but a future consumer who diffs the two outputs will notice. Same structural fix as above resolves it.
- **No CLI-integration test for `--markdown --show-unattributed`** — Edge Case Hunter + Blind Hunter. The new markdown section has unit-test coverage on `formatMarkdown()` but no end-to-end CLI integration test exercising the orchestrator glue (`options` threading through `main()`). The spec explicitly prohibited adding new CLI-integration tests under the `test-fixture-isolation` rule (`tests/lib/portfolio-engine.test.js` current CLI block uses the live repo via `runCli(..., { cwd: projectRoot })` which is already a pre-existing rule-tension pattern). If CLI-integration coverage is wanted, it belongs in a fixture-isolated follow-up that simultaneously addresses the live-repo dependency in Story 6.3's Tests O, P, Q.

## Deferred from: code review of I20 — Round 2 (2026-04-20)

- **`--sort <invalid>` silently falls to alpha** — Edge Case Hunter. `portfolio-engine.js:468-470` uses `args[args.indexOf('--sort') + 1] === 'last-activity' ? 'last-activity' : 'alpha'`. A user passing `--sort recent` gets alpha order silently with no validation warning. Pre-existing Story 6.3 pattern, unchanged by I20. Fix path: validate sort value against a known set, `process.exit(2)` on invalid.
- **`--filter` without value silently ignores the flag** — Edge Case Hunter. `portfolio-engine.js:471-474` uses `args[filterIdx + 1] && !args[filterIdx + 1].startsWith('--')` as the guard. If `--filter` is the last arg or followed by another flag, the filter is silently dropped. Pre-existing Story 6.3 pattern, unchanged by I20. Fix path: explicit error when `--filter` is present without a value.

## Deferred from: code review of lint-1-1-fix-ci-lint-and-add-dod-gate (2026-04-22)

- **Touched-files scope has no tooling automation** — Blind Hunter. `project-context.md` §`lint-passes-before-review` commands unfiltered `npm run lint` while defining the gate by diff scope. Reviewers must manually cross-reference ESLint output lines against `git diff --name-only`. Pre-existing gap exposed by this story, not caused by it. Fix path: a helper script (e.g., `scripts/lint-touched.js`) that runs lint scoped to `git diff --name-only main...HEAD`, promotable to a test-runner target and a checklist reference.
- **`.claude/skills/bmad-dev-story/checklist.md` not refreshed by `convoke-update`** — Edge Case Hunter. `scripts/update/lib/refresh-installation.js:587-700` only refreshes `bmad-agent-bme-*`, Gyre agents, EXTRA_BME_AGENTS, and standalone bme-workflow wrappers — `bmad-dev-story` (a `_bmad/bmm/` framework skill) is never touched. So future amendments to the canonical DoD checklist won't propagate to already-installed Convoke projects. Change Log already flags this as a follow-up backlog candidate. Fix path: extend refresh-installation to copy selected `_bmad/bmm/4-implementation/*/checklist.md` to `.claude/skills/*/checklist.md` with path-rewriting (see next item).
- **Canonical→runtime copy would break relative `project-context.md` link** — Edge Case Hunter. Canonical `_bmad/bmm/4-implementation/bmad-dev-story/checklist.md:50` uses `../../../../project-context.md` (4 levels up); runtime `.claude/skills/bmad-dev-story/checklist.md:48` uses `../../../project-context.md` (3 levels up). A naive `fs.copyFileSync` during refresh would break the link in the runtime copy. The follow-up for the refresh-installation fix needs a path-rewrite step (regex or string-replace) to compensate for the depth delta.
- **`_warnings` rename in `loadSkillSource` masks pre-existing unused-threaded-param bug** — Edge Case Hunter. `scripts/portability/export-engine.js:105` declares `loadSkillSource(skillRow, projectRoot, _warnings)`. Caller at line 1015 passes a real `warnings` array expecting it to be populated with non-fatal issues (missing workflow.md, empty stepContents) — but the function never pushes to it. The `_`-rename satisfies ESLint and makes the dead-code status permanent, losing the "unused param — will surely fix eventually" signal. Pre-existing bug surfaced by lint-1.1, not caused. Fix path: either populate `warnings` in `loadSkillSource` (surface missing-workflow.md as a non-fatal warning) or remove the parameter entirely from both callsite and callee.

## Deferred from: code review of mig-test-1-1-replace-upgrade-test-count-assertions (2026-04-23)

- **`migrations[1].breaking` unchecked in v1.7.1 chain assertion** — Blind Hunter. `tests/integration/upgrade.test.js:405-407` asserts `migrations[0].breaking === true` but never checks `migrations[1].breaking`. If `2.0.x-to-3.1.0`'s breaking flag flipped in registry.js, this test would pass silently. Not in mig-test-1-1 scope (count-rot fix only). Fix path: add `assert.equal(migrations[1].breaking, false)` as part of a future `derive-counts-from-source` compliance sweep story.
- **Unfixed hardcoded count `config.workflows.length >= 13` at line 289** — Edge Case Hunter. Same rot class as the three AC1-3 assertions — it's bound to the v1.4.1 post-refresh workflow count. If workflows are consolidated below 13, the test silently regresses; if additional Wave 4 workflows land, the `>=` guard absorbs that silently too. Out of mig-test-1-1 scope per Scope Exclusion. Fix path: replace with `for (const wf of EXPECTED_V14_WORKFLOWS) assert.ok(config.workflows.includes(wf))`.
- **Unfixed hardcoded count `config.agents.length >= 7` with only 2 of 7 agents named at line 446** — Edge Case Hunter. Same pattern: a refresh bug that drops `hypothesis-engineer` but duplicates another agent to reach 7 would pass the length check and never trigger the 2 named-agent assertions. Fix path: assert each of the 7 named agents explicitly.
- **v3.0.x chain-walker non-determinism in registry.js** — Edge Case Hunter. `getMigrationsFor('3.0.5')` could match either `3.0.x-to-3.1.0` OR `3.0.x-to-4.0.0` at `registry.js:151-153` — `Array.prototype.find` returns the first registry-order match. A 3.0.x user could be routed through the non-breaking 3.1.0 hop and miss the 4.0.0 breaking migration silently. Pre-existing, registry-side concern — out of any test-level story scope. Fix path: add a v3.0.x describe block asserting `getMigrationsFor('3.0.5')` contains `'3.0.x-to-4.0.0'`, OR enforce registry invariant that only one migration matches per `fromVersion`. Belongs in a registry-housekeeping story.
- **Append-safety simulation did not cover mid-chain insertion** — Blind Hunter. Task 5 probe appended `4.0.x-to-5.0.0` at the tail. A hypothetical mid-chain insert (e.g., a patch migration between `2.0.x-to-3.1.0` and `3.1.x-to-4.0.0`) would rot AC2's positional assertions (`migrations[1].name === '2.0.x-to-3.1.0'`). AC1/AC3's `some(...)` checks are position-agnostic and would survive either way. Future reviews of registry-touching stories should probe mid-insertion when positional identity is used.

## Deferred from: code review of v63-3-1-create-and-validate-marketplace-metadata Round 2 (2026-04-24)

- **R2-L1: SKILL_MD_MAX_BYTES decimal-MB naming + `>` vs `>=` boundary** — `scripts/audit/validate-marketplace.js:47` constant is 1,000,000 bytes (decimal MB). Comment says "1 MB red flag". Check uses `>` so exactly 1,000,000 bytes passes unchecked. Cosmetic alignment with comment intent; realistic SKILL.md is <100KB so no real-world impact. Fix path: change to `>=` or re-document as decimal MB explicitly.
- **R2-L2: `assertDisjointAgentIds` throws at require-time** — `scripts/update/lib/agent-registry.js:143-162` IIFE bricks every caller on registry collision. Fail-fast is arguably correct for a developer-bug scenario. Epic 4 may revisit by exporting a `validateRegistry()` function called from doctor/update entry points with structured error emission for better operator UX.
- **R2-L3: Backup `{ overwrite: true }` clobbers prior backups on re-run** — `scripts/update/lib/refresh-installation.js:199`. Operator scenario: convoke-update #1 backs up to `.backup-v4/<id>.md`; operator recovers/edits flat file; convoke-update #2 overwrites backup. Loses original 3.x content. Timestamp-suffix fix on conflict is defensive overkill for a one-time migration scenario.
- **R2-L4: R1-M1 module.yaml whitespace-only fields pass type guard** — `scripts/audit/validate-marketplace.js:262-270`. `code: "   "` (whitespace) passes `typeof === 'string' && length > 0` but fails EXPECTED_MODULE_CODE equality with cryptic `"has code=\"   \"; expected \"bme\""` diagnostic. Low-impact cosmetic — add `trim() !== ''` when convenient.
- **R2-L5: R1-H3 Test 16 comment wording slightly inaccurate** — `tests/unit/validate-marketplace.test.js:502-503`. Comment says "simulating the `convoke-update` flow on a 3.x install"; more precisely, the test only calls `refreshInstallation` directly and bypasses the detector's routing logic. Cosmetic; clarify in a future pass.

## Deferred from: code review of v63-3-2-compatibility-preflight-and-skill-dir-audit Round 1 (2026-04-25)

- **R1-L1: Information disclosure via `probe.reason` in WARNING text** — `scripts/update/lib/compat-preflight.js:78`. Reason is interpolated into stderr (e.g., `"version field invalid: 42"`). Package.json contents are public; not sensitive. Cosmetic.
- **R1-L2: No upper bound on number of skill dirs walked** — `scripts/audit/audit-skill-dirs.js:154`. Malicious `.claude/skills/` with millions of empty entries could exhaust memory. Realistic installs have ~98 dirs; defensive cap at 10,000 is belt-and-suspenders.
- **R1-L3: Banner-vs-preflight ordering inconsistent across 3 entry points** — install-vortex/gyre run preflight before banner; convoke-update runs banner first. Operator UX cosmetic. Standardize when convenient.
- **R1-L4: `package.json` files[] entry for `.claude/skills/bmad-audit-skill-dirs/` is single-purpose** — `package.json:16`. Each operator-tooling slash-command needs its own `files[]` entry. Track as the broader `.claude/skills/` shipping-mechanism cleanup (also affects `bmad-register-skill`).
- **R1-L5: Fresh-install short-circuit ambiguous when operator deleted `.claude/skills/`** — `audit-skill-dirs.js:144-156`. Could downgrade to WARNING if `_bmad/` indicates non-fresh state. Cosmetic diagnostic.
- **R1-L6: Windows trailing-backslash projectRoot normalization** — `compat-preflight.js:74-76`. `C:\proj\` passes but produces messy display strings. Fix via `path.resolve()` at top of `runCompatPreflight`.
- **R1-L7: `readdirSync` order non-deterministic across filesystems** — `audit-skill-dirs.js:154`. Failure messages + `--verbose` output non-deterministic across APFS vs ext4 etc. One-line fix: `entries.sort((a, b) => a.name.localeCompare(b.name))`.
- **R1-L8: SKILL.md size-guard TOCTOU between stat and readFileSync** — `audit-skill-dirs.js:120-128`. Concurrent writer extending file post-stat bypasses guard. Bounded `fs.openSync + fs.readSync` with fixed buffer is the proper fix; low-likelihood on read-only audit paths.
- **R1-L9: `seedBmadPackage` test fixture doesn't clean prior state** — `tests/unit/compat-preflight.test.js:11-18`. Each test creates fresh tmpDir so safe today. Brittle if a future test reuses tmpDir; add `await fs.remove(pkgDir).catch(() => {})` defensively.
- **R1-L10: Story Change Log narrative line-numbers drift from actual diff** — minor (`convoke-update.js:235` cited; actual call is at line 238 with `if` guard at 238 after blank line at 236). Cosmetic for future archaeologists.

## Deferred from: code review of v63-3-2-compatibility-preflight-and-skill-dir-audit Round 2 (2026-04-25)

- **R2-L1: BOM mid-frontmatter still produces misleading diagnosis** — `scripts/audit/audit-skill-dirs.js:120-122`. R1-M5 strips BOM only at file start; mid-frontmatter BOM (e.g., copy-paste from a BOM-prefixed source) survives and produces "invalid frontmatter YAML" or "frontmatter 'name' missing" instead of a clean encoding error. Edge case.
- **R2-L2: R1-M5 BOM strip only handles UTF-8, not UTF-16 LE/BE** — `scripts/audit/audit-skill-dirs.js:120`. Modern Notepad (Win10 1903+) defaults to UTF-8 with BOM; UTF-16 is out of scope for `readFileSync(path, 'utf8')`. Documented as expected scope.
- **R2-L3: R1-M3 unknown-flag check accepts positional args as "unknown flags"** — `scripts/audit/audit-skill-dirs.js:312-316`. `convoke-audit-skill-dirs /some/path` emits "Unknown flag(s): /some/path" — confusing if a future positional arg is added. No positionals today.
- **R2-L4: `--help` short-circuit doesn't clear `flags.unknown`** — `scripts/audit/audit-skill-dirs.js:307-310`. Works today, fragile if reordered. Doc-comment-only fix is sufficient.
- **R2-L5: `realPath?` field extends AC2 check-result shape** — `scripts/audit/audit-skill-dirs.js:49-54`. Already documented in JSDoc; the `?` form admits extension. No action needed.

## Deferred from: code review of v63-3-3-submit-marketplace-registry-pr Round 1 (2026-04-25)

- **R1-L1: `categories.yaml` SHA not pinned in validation log** — `_bmad-output/implementation-artifacts/v63-3-3-validation-log.md`. The slug-pair `business-and-strategy/product` was verified at Task 1.3 against current upstream state but no SHA snapshot was captured. Low-likelihood drift; cosmetic.
- **R1-L2: `repository` URL normalization comment in `convoke.yaml`** — explicit `# normalized per AC1 — diverges from package.json git+/.git affixes` comment would forestall reviewer questions but isn't required. Cosmetic.
- **R1-L3: Gate-2 timestamp prose clarification in validation log** — gate-2 entries at 09:22:00Z are post-PR-creation 09:21:04Z. Adds a note explaining "gate-2 is M12a aspiration evidence, not AC2 evidence; AC2 met at 09:09:03Z gate-1." Cosmetic — pre-empts a reviewer concern about evidence ordering.
- **R1-L4: CodeRabbit auto-injected text in PR body** — bot appends bland AI summary to PR descriptions. Optional removal via `gh pr edit` if it dilutes the human description. Not in our control to suppress.

## Deferred from: code review of v63-3-3-submit-marketplace-registry-pr Round 2 (2026-04-25)

- **R2-L1: `code: bme` framing dissonance** — `_bmad-output/implementation-artifacts/v63-3-3-validation-log.md`. R1-M3 treats `code` as identity-defining (collision-check section); R1-H2 lists `code` under "5 optional fields included". Defensible per schema (it IS optional) but suggests evidence-stitching fatigue. Cosmetic.
- **R2-L2: PR title direct verification** — `_bmad-output/implementation-artifacts/v63-3-3-pr-link.md` `pr_title` field. Title can be verified live via `gh pr view --json title`; not directly verifiable from inside the static diff. Cosmetic; not blocking.

## Deferred from: code review of A39 Gyre Covenant Audit Round 1 (2026-04-25)

Round 1 review (3 layers: Blind Hunter + Edge Case Hunter + Acceptance Auditor) — 9 HIGH after dedup, 9 MEDIUM, 6 LOW, 4 NIT. 14 patches applied + 4 deferred + 3 dismissed + 3 decisions surfaced for operator. All patches content-only; per `code-review-convergence` rule, Round 2 NOT auto-triggered. Headline T1-FIRES verdict on Right to a default remains provisional under A10 failure.

> **A41+A42 cross-reference (added 2026-04-25):** A41+A42 shipped 2026-04-25 ([oc-publication-gate-rigor-a41-a42.md](./oc-publication-gate-rigor-a41-a42.md)). Per A41 §A41-1..§A41-10, the following A39-D entry resolutions:
> - **A39-D2** (reading-dependent partial-credit): RESOLVED by A41 §A41-5 (structurally distinct from forbidden borderline IF AND ONLY IF (a) headline commits, (b) §Notes documents alternative, (c) §9 ambiguity logged).
> - **A39-D4** (A10 cell selection borderline): RESOLVED by A41 §A41-6 (expected-PASS must be reading-dependent or borderline; v3 stable-PASS picks grandfathered, v4+ refresh adopts borderline-required rule).
> - **A39-D1** (≤2-sentence cap): **REMAINS OPEN** pending v4+ refresh — A41 did NOT add a methodology amendment for compound-mechanism cells exceeding 2 sentences with §Notes pointer convention. Sweep across 6 cells stays deferred.
> - **A39-D3** (Scout R6 re-eval): **REMAINS OPEN** pending v4+ refresh — A41 did NOT add an OC-R6 application clarification for silent-decide branches.

- **A39-D1 (AA-H1; clarified post-R2 per AA-R2-H2) — AC5 ≤2-sentence cap exceeded across ~6 cells** — Acceptance Auditor finding. Spec AC5: "≤ 2-sentence evidence note." Several §4 cells exceed: Scout R5 (~4-5 sentences pre-R1; reduced to **3 sentences post-R1 P16 — STILL over the ≤2 cap; did NOT reach it**, clarified post-R2), Scout R7 (~6 sentences charitable + strict + headline reasoning), Atlas R7 (~5 sentences), Coach R1 (~4 sentences), Coach R5 post-R2-overturn (~3-4 sentences for FAIL evidence + composition-rule pointer to §4.5), Scout R1 (~3 sentences). Sweep across all 6 cells would touch ~150 lines of evidence-note prose; high risk of introducing semantic drift while compressing. R1 P16 attempted Scout R5 inline condensation but reduced from ~5 to 3 sentences, NOT to the ≤2 cap — earlier framing implied P16 fixed Scout R5; corrected post-R2 to clarify partial-fix-only. Fix path: v4+ refresh applies the same condensation pattern OR a methodology amendment via A41 allows compound-mechanism cells to exceed 2 sentences with an explicit §Notes pointer convention. Defer reason: scope creep risk; A39 R1+R2 patches are mostly content-only (R2 added the Coach R5 verdict overturn but did not sweep evidence-cell length); bulk evidence-note rewrite across 6 cells crosses the structural-change threshold per code-review-convergence rule.
- **A39-D2 (AA-H2) — "Reading-dependent" framing as partial-credit-shaped construct** — Acceptance Auditor finding. Spec AC5 mandates "no partial-credit language" + Anti-Pattern #4 forbids partial-credit language explicitly. Report repeatedly uses "reading-dependent verdict," "charitable PASS / strict FAIL," "borderline" (in §7.1 cell-selection table). This is a partial-credit-shaped construct in everything but name — it preserves both PASS and FAIL readings without binary commitment. **Counter-argument:** A24 §4.4 Notes used the same "reading-dependent" pattern and shipped clean; A39 inherits the precedent (charitable for headline + strict alternative in §Notes + ambiguity intake in §9). The A24 R2 review didn't flag this pattern — implying it's been operationally accepted. Defer reason: this is a methodology question for A41 — is "reading-dependent" verdict structurally distinct from forbidden "borderline" partial-credit, or is the precedent now in tension with the rubric's stated discipline? A41 should adjudicate (the "Selection Discipline" governance owns this).
- **A39-D3 (BH-M10) — Scout R6 re-evaluation: multi-service auto-decide branch as R6 trigger** — Blind Hunter finding. §4.1 Scout R6 scored vacuous PASS ("step-01 has no operator-visible error surface"). Counter-claim: §4.1 R5 already documents the multi-service auto-decide branch (line 144) as a R5 FAIL surface. The auto-decide commits the operator to single-service mode WITHOUT a remediation prompt (no "this is wrong, here's how to override" path). Under R6's "what to do if you didn't want this" framing, the auto-decide branch may trigger R6 = FAIL too. Re-evaluation outcome (if Scout R6 flips to FAIL): 4/28 fails total instead of 3; R6 fail rate = 1/4 = 25% (still below T1 threshold; doesn't change team-level T1-fires verdict for R1; but adds another individual cell to retrofit catalog). Defer reason: code-review-convergence rule discourages verdict overturns in same review round (would require re-running §3 matrix + §5 row + §10 activity log + arguably re-running A10 Cell 4); v4+ refresh under clarified A41 rubric is the appropriate venue. Also surfaced as DN3 in A39 spec Review Findings — operator may invoke explicit Round 2 if they want this resolved sooner.
- **A39-D4 (BH-M11) — A10 cell selection: redo with borderline expected-PASS** — Blind Hunter finding. §7.1 Cell 2 (Lens R7) was the safest expected-PASS — the audit's own §4.3 noted "PASSes under both readings", i.e., the LEAST controversial cell. Selecting the easiest expected-PASS artificially inflates the chance of getting at least one agreement. A genuine A10 stress test would pick the borderline expected-PASS (e.g., Atlas R7 charitable PASS / strict FAIL), not the safest one. If reviewers split on Atlas R7 too, A10 agreement could drop to 0/3. Defer reason: redoing A10 in Round 1 would require re-spawning 2 sub-reviewers and rewriting §7.1 — structural enough to warrant separate run; v4+ refresh will run A10 against clarified A41 rubric anyway and should adopt borderline-expected-PASS selection rule. Also a candidate A41 input: Selection Discipline rule for A10 cell composition should specify "expected-PASS must be reading-dependent or borderline, not stable-PASS, to maximize gate informativeness."


## Deferred from: code review of v63-5b-2-run-retrospective-and-create-anti-pattern-registry (2026-04-27)

- **CR-D1 (Blind-M5) — `arch:455` cite is opaque** — Readers cannot verify what file `arch:455` resolves to. Used as load-bearing citation for Decision 6 (sequence deviation rationale) but never spelled out. Same applies to "epic stories table line 451" reference. Defer reason: wording inherited from spec author at story creation; non-load-bearing for retrospective shipped artifacts; could be tightened in a future spec-template hardening pass (sibling to AP-1 marketing-as-fact + AP-4 spec-body drift discipline — should specs use file:line form for cross-references rather than opaque `token:line` form? Suggests a project-context.md anchor rule).
- **CR-D2 (Blind-M12) — "Empirical probes 9/12 PASS + 3 CAUGHT-DEFECT" enumeration gap** — Story spec L267 + sprint-status narrative claim 3 caught defects but only 2 are enumerated by name (CM-1 L1 recursion + CM-2 I5 dependency-chain). The third defect is unnamed. Defer reason: spec-author traceback (where did the 3rd defect surface?) is out-of-scope for this code review of dev-story execution; could be reconciled in a future V-pass-methodology audit but not load-bearing for shipped retrospective artifacts.
- **CR-D3 (Edge-M1) — AP-3 transcribes "3 distinct R1-introduced regressions" while upstream Epic 1A retro header says "2 of 6 stories"** — Per Epic 1A retro L65: header reads "Round 1 patches introduced new HIGHs in 2 of 6 stories" but the bullet enumeration directly underneath lists 3 (1A.1 + 1A.2 + 1A.6). AP-3 correctly cites the underlying enumeration of 3 regressions; the upstream header is internally inconsistent with its own bullets. Defer reason: AP-3 cites the correct underlying count; flagging the upstream header inconsistency belongs in Epic 1A retro amendment, not in the v6.3 retrospective. Could surface as upstream-doc cleanup item if registry is consulted at v6.4 retrospective time.
- **CR-D4 (Edge-M4) — EXP3 line cite L96 references different heading style than EXP1/EXP2** — Retrospective body cites "L47 (EXP1), L79 (EXP2), L96 (EXP3)" as parallel "What this changed downstream (FR34)" paragraphs. Reality: L47 + L79 use `### What this changed downstream (FR34)` h3 heading; L96 uses inline-bold `**Per FR34 downstream impact**` (different shape) because EXP3's content lives in a separate standing artifact (`convoke-note-exp3-platform-agnostic-smoke-test.md`) referenced by pointer. Substantive S3 PASS holds; cite asymmetry is cosmetic. Defer reason: Sprint 1 artifact's structural asymmetry across EXP1/EXP2/EXP3 is intentional (EXP3 has its own standing artifact); fix would require either bumping EXP3 content inline (out of scope) or annotating the cite asymmetry in Sprint 1 artifact's header.
- **CR-D5 (Blind-L7) — "Frozen post-Story-5B.1 release ship pending" wording is internally contradictory** — AC6 MUST-NOT-touch list at L157 says "CHANGELOG.md (frozen post-Story-5B.1 release ship pending)". "Frozen" + "release ship pending" describe different states. Cleaner phrasing: "out-of-scope post-Story-5B.1 ship-pending" or "locked until Story 5B.3 release ship." Defer reason: cosmetic prose nit; doesn't affect scope discipline (CHANGELOG was correctly not touched per git status).


## Deferred from: code review of v63-4-2b (2026-04-28)

- **CR-V42b-D1 (Edge-#3) — `migration_history` items not validated against version regex** [`scripts/update/lib/config-merger.js:218-227`] — The custom validator for `migration_history` checks `timestamp`, `from_version`, `to_version` field existence but does not validate their format against the version regex defined for top-level `version` field. Defer reason: pre-existing concern; not introduced by Story 4.2b; the regex update doesn't make it worse. Worth fixing if/when version-format invariants tighten across config schema (paired with strict-semver hardening item if that's pursued — see CR-V42b-DN1).
- **CR-V42b-D2 (Blind-#5/#6/#14) — Repurposed negative test uses single weak input; missing edge-case coverage** [`tests/unit/config-merger-negative.test.js:122`] — `1.0.0-beta!` is a single-character flip. Stronger negative cases not currently tested: `1.0.0-` (empty pre-release), `1.0.0-rc..1` (empty identifier), `1.0.0-rc.01` (leading zero), `1.0.0-rc 1` (whitespace), `1.0.a` (alpha in core position). Defer reason: tied to decision-needed item CR-V42b-DN1 (regex strictness). If strict-semver is adopted, these tests become required (and the regex change opens up more rejection cases to cover); without strict-semver, current coverage is acceptable. Co-deferred with CR-V42b-D1.

- **CR-V42b-DN-batch — strict-semver hardening (3 batch-deferred decision-needed findings)** — All three findings center on the same theme: the regex `/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/` introduced in Story 4.2b (per Decision 3 narrow exception) accepts the immediate target string `4.0.0-rc.1` correctly but is not strict-SemVer-2.0.0-compliant. Specifically: (a) **Grammar permissive** — accepts `1.0.0-rc..1` (empty identifier), `1.0.0-rc.01` (leading zero), `1.0.0-`, `1.0.0--rc.1`, `1.0.0-.`. Strict alternative: `/^\d+\.\d+\.\d+(?:-(?:[0-9A-Za-z-]+)(?:\.[0-9A-Za-z-]+)*)?$/`. (b) **Build metadata not handled** — `1.2.3+build.5` rejected; error message claims "semver" but regex doesn't deliver. Either extend regex OR scope error message. (c) **Downstream pre-release handling unverified** — `compareVersions('4.0.0-rc.1', '4.0.0')` and `getMigrationPath(current=4.0.0-rc.1, target=4.0.0)` may misbehave; never reached in current production path (RC builds not published publicly), but worth verifying or accepting risk before any future RC publication. Defer reason: Story 4.2b's stated scope was "make 4.0.0-rc.1 viable" — met. Strict-semver compliance is orthogonal hardening; doesn't block 4.0 ship sequence (4.3 → 4.5 → 5B.3). Triage to Fast-Lane / Bug-Lane in next backlog review; bundles with CR-V42b-D2 (negative-test coverage gaps) since stricter regex needs stronger negative tests. Source: code review of v63-4-2b 2026-04-28 (Round 1; Blind Hunter raised HIGH severity; Edge Case Hunter independently corroborated).


## Deferred from: code review of i97-1-1 (2026-05-01)

- **CR-i97-1-1-D1 (Blind-LOW) — `setupTmpDir` cleanup failures swallowed silently to stderr** [`scripts/migration/format-conversion/fixtures/tmpDir-setup.js:52-57`] — `console.warn` is silent in non-verbose CI. Long-running test suites accumulate orphaned tmpDirs invisibly. Defer reason: project-wide concern affecting all tooling that uses tmpDir cleanup; fix would touch sibling helpers in `tests/helpers.js` and similar. Should be addressed as a cross-cutting platform-debt item, not inside Story i97-1.1 scope. Pair with future cleanup-leak audit story.
- **CR-i97-1-1-D2 (Blind-MEDIUM) — Load-test brittle to module-cache state leakage between describe blocks** [`tests/lib/format-conversion-load.test.js`] — Each `it()` calls `require(...)` separately; Node caches modules. The module-level regex statefulness (also flagged as patch-item P5) means test order leaks state between describe blocks. Currently passes; brittle to reordering. Defer reason: paired with patch P5 (regex statefulness fix); once P5 lands and regexes become per-call, this brittleness disappears. No standalone fix needed.
- **CR-i97-1-1-D3 (Edge-LOW) — `parity-harness` reads SKILL.md as utf8 only; UTF-16 BOM source files silently corrupt** [`scripts/migration/format-conversion/parity-harness.js:111`] — A SKILL.md saved as UTF-16LE (rare on macOS/Linux; possible on Windows authoring tools) reads as garbled UTF-8; `isV5Format`/`isV63Format` return false; reports `unrecognized-format`. Defer reason: BMAD/Convoke ecosystem files are author-controlled and uniformly UTF-8 in practice. UTF-16 source is a hypothetical edge that's never been seen in 4.0 codebase. Re-evaluate if Windows-authored agents enter the ecosystem.
- **CR-i97-1-1-D4 (Blind-LOW) — `_resolveAllScopes` Set dedup uses path strings, not realpaths** [`scripts/audit/reference-integrity.js:232-242`] — Two globs matching the same file via different path representations (e.g., symlink + canonical) won't dedup. Currently irrelevant since `path.join` normalizes within the codebase. Defer reason: edge case requires symlinks in the project tree; Convoke doesn't currently use them. Add `fs.realpathSync` normalization if symlinks become part of the structural pattern.
- **CR-i97-1-1-D5 (Blind-LOW) — `reference-integrity.js` CLI has no `--project-root` override flag** [`scripts/audit/reference-integrity.js:412`] — Lib API correctly accepts `projectRoot`, but CLI seeds from `findProjectRoot()` only. Limits testability (can't run against fixtures from a different cwd). Defer reason: future enhancement for Story 3.3 CI gate productionization where fixture-based testing matures. Currently unblocked by hand-running with `cd <fixture-root>`.
- **CR-i97-1-1-D6 (Blind-LOW) — `runCovenantSurvivalCheck` accepts partial `perRightMatrix` silently with `pending-matrix-entry` for missing Rights** [`scripts/migration/format-conversion/covenant-survival-harness.js:153-169`] — If matrix has only OC-R1 with `decision: 're-audit'`, the function returns `status: 'matrix-applied'` with 6 of 7 cells `pending-matrix-entry`. Caller may interpret success status as approval. Defer reason: Story 4.1 (per-Right matrix authoring) is responsible for ensuring all 7 are populated; harness shouldn't double-enforce what Story 4.1's spec gates already cover. If Story 4.1 doesn't add this gate, file a follow-up.


## Deferred from: code review of i97-1-1 Round 2 (2026-05-02)

- **CR-i97-1-1-R2-D1 (Blind-LOW) — Cross-file regex duplication: 4 files duplicate `AGENT_ROLE_NAME_RE`** [`parity-harness.js:47`, `personality-harness.js:49`, `covenant-survival-harness.js:51`, `isolated-install.js:39`] — If one drifts (say a future patch adds a char class), the other three silently differ. No shared module. Defer reason: small surface; would require introducing a shared utility module; can be folded into a broader refactor when more cross-file constants accrue.
- **CR-i97-1-1-R2-D2 (Edge-LOW + Blind-LOW) — `setupTmpDir` prefix doesn't validate null-byte / Windows path-sep edge** [`tmpDir-setup.js:49`] — `prefix: 'foo\0bar'` passes the `path.sep`/`/`/`..` check but `mkdtempSync` rejects with TypeError. Cosmetic — the error is surfaced, just not as friendly. Defer reason: very edge.
- **CR-i97-1-1-R2-D3 (Blind-LOW) — `--paths foo bar` extra positional silently dropped** [`reference-integrity.js:_runCli`] — `--paths foo bar` consumes `foo`, leaves `bar` to fall through to the `else if (arg.startsWith('--'))` branch which doesn't match (no `--` prefix), so `bar` is silently dropped. Defer reason: extra-positional handling is corner-case; not worth fixing until a real user report.
- **CR-i97-1-1-R2-D4 (Blind-LOW) — Mode validation in `personality-harness` runs before structural-string validation, inconsistent with parity/covenant harnesses** [`personality-harness.js:107-127`] — Caller passing `{}` gets "Invalid mode" first; passing `{mode: 'capture'}` gets "options.projectRoot must be non-empty". Defer reason: pure preference; either ordering is defensible; consistency is a Round 3+ refactor.
- **CR-i97-1-1-R2-D5 (Blind-LOW) — `_globPartToRegex` documents glob support but doesn't handle `?` (single-char wildcard)** [`reference-integrity.js:408-413`] — `?` would be treated as literal. Defer reason: not used by any current scope; documenting the limitation suffices.
- **CR-i97-1-1-R2-D6 (Blind-LOW) — `setupIsolatedInstall` cleanup leaves `_bmad/bme/_vortex/` parent shells behind, blocks re-seeding into same tmpDir** [`isolated-install.js:148-151, 216-225`] — After cleanup, `tmpDir/_bmad` parent dirs remain. Subsequent `setupIsolatedInstall` against the same `tmpDir` would fail the "must be empty" precondition. Defer reason: documented contract is single-use tmpDir (each test creates fresh via setupTmpDir); re-seeding is not a supported flow.
- **CR-i97-1-1-R2-D7 (Edge-LOW) — `extractPerAgentFingerprint` returns header-only when section body is empty** [`personality-harness.js:297-307`] — A section that's literally `### Emma\n### Liam\n` returns just the header. Caller sees `'### Emma'` but no body. Defer reason: rare in practice (rubric always has body content); add a "found but empty" detection if it surfaces.
- **CR-i97-1-1-R2-D8 (Edge-LOW) — `formatOperatorScoringPrompt` uses Unicode glyphs (`✓`/`✗`) that may render as `?` in non-UTF-8 terminals** [`personality-harness.js:206-207`] — Cosmetic; project context says avoid emojis but these are technical glyphs. Defer reason: no real terminal in the dev/CI loop is non-UTF-8.
- **CR-i97-1-1-R2-D9 (Edge-MEDIUM, downgraded) — `_walkGlob` with non-existent staticDir or staticDir-as-file silently returns []; ENOTDIR not distinguished from ENOENT** [`reference-integrity.js:380-384`] — `readdirSync` of a file throws ENOTDIR, caught silently. Defer reason: surfacing this requires distinguishing error codes in a path that's primarily expected to succeed; corner case.
- **CR-i97-1-1-R2-D10 (Edge-MEDIUM, downgraded) — `setupIsolatedInstall` TOCTOU between empty-check and copy** [`isolated-install.js:124-131, 150`] — `fs.readdirSync(realTmpDir)` confirms empty, then writes. A concurrent test (or attacker with tmpdir write access) could populate `tmpDir` after the check. Defer reason: tmpDir is freshly mkdtemp'd in practice (caller pattern); document mkdtemp-only contract.
- **CR-i97-1-1-R2-D11 (Edge-MEDIUM, downgraded) — `_stripCodeRegions` 4-space indent stripping fires inside fenced blocks already replaced with spaces** [`reference-integrity.js:198-215`; `parity-harness.js:303-321`] — After fence-stripping, fenced lines are spaces. The 4-space indent loop sees `prevBlank=true` (stripped fence line is now blank-equivalent) → next line (also all-spaces from stripped fence) starts with 4 spaces → re-strips already-stripped content. Idempotent, no functional bug, but the loop performs O(n) extra work. Defer reason: idempotent + correct, performance impact minimal.
- **CR-i97-1-1-R2-D12 (Edge-LOW) — `realpathSync(tmpDir)` race with concurrent rmdir** [`isolated-install.js:111-117`] — If tmpDir is removed between mkdtemp and `setupIsolatedInstall`, realpathSync throws. Caught and rethrown with `cause` chain. Defer reason: extremely rare; user would have to actively delete tmpDir between two calls.
- **CR-i97-1-1-R2-D13 (Blind-LOW) — `_extractMarkdownLinkRefs` regex misses links with parens in URL** [`reference-integrity.js:94`] — `[t](./foo(bar).md)` truncated to `./foo(bar`. Already noted in Round 1 deferred items but re-surfaced in Round 2; not yet fixed. Defer reason: same as Round 1 — would require balanced-paren matcher; uncommon pattern.
- **CR-i97-1-1-R2-D14 (Blind-LOW) — JSDoc drift on `setupIsolatedInstall.includeWorkflows` default semantics** [`isolated-install.js:71-75`] — JSDoc says "If true (default)" then "default `true` silently skips" — inconsistent with the `COPY_OPT_DEFAULT` symbol semantics. Defer reason: JSDoc clarity nit; readers can read the code; rewriting the JSDoc cleanly is a small follow-up.
- **CR-i97-1-1-R2-D15 (Blind-LOW) — `runParityCheck` JSDoc claims "never throws on a missing post-migration file" but throws TypeError on invalid `agentRoleName`** [`parity-harness.js:62-72`] — Doc is technically correct ("never throws on missing") but a downstream consumer reading "never throws" without finishing the sentence will not catch. Defer reason: doc tightening is a small follow-up; current behavior is correct.
