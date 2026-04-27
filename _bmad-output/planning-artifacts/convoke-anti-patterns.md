---
initiative: convoke
artifact_type: registry
qualifier: anti-patterns
created: '2026-04-27'
schema_version: 1
---

# Convoke Anti-Pattern Registry

**Purpose.** Standing registry of anti-patterns observed across Convoke releases — the L1 hypothesis carrier per PRD `convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md:59-64`. Created at Story 5B.2 (v6.3 retrospective close); persists across releases. Future retrospectives consult AND extend this registry.

**Reading guide for future operators.** Before starting work on a new release (Sprint 0 of any future Convoke major), read this registry end-to-end. Each entry names a recurring failure mode with a concrete v6.3-instance citation and a recommended counter-pattern. The L1 falsification condition is "registry exists but is never consulted" — break the falsification by citing entries from this file in future retrospectives.

**Initial population (v6.3-stream observations):** 10 anti-patterns (AP-1..AP-10), shipped at Story 5B.2 close. Sources: Epic 1A/2/3 retros + per-story V-pass + R1/R2 code-review findings + Story-level Decision-rationale archives + PRD seed examples per `innovation-novel-patterns.md:62` (the L1 hypothesis paragraph enumerating "first-class", "M18 masquerade", "silent reorder" seeds).

**Mid-stream additions (v6.3-stream, post-5B.2):** AP-11 added at Story 5B.3 V-pass time (2026-04-27) after the count-drift pattern recurred on consecutive specs (5B.2 → 5B.3) — first instance of this registry self-extending within-stream per L1 hypothesis "Recurrence tracking" convention. Current count: **11 entries.** Future retrospectives extend further per the Maintenance + Reuse section below.

---

## AP-1: Marketing-as-fact in CHANGELOG entries

**Description:** Authors describe shipped functionality using marketing-language tense ("Release gating verifies your agents produce the same outputs") rather than process-claim tense ("Release gating runs an empirical equivalence check"). The marketing-tense over-promises when validation infrastructure ships before validation execution. Users read the marketing-tense as a guarantee; the framework can only honestly promise the process ran.

**v6.3 instance:** Story 5B.1 R1 review caught this in `CHANGELOG.md` v4.0 Added section ("Behavioral equivalence validation" bullet). Edge Hunter R1-CR-M4 finding. Patched to soften wording from "verifies" → "runs an empirical equivalence check".

**Counter-pattern:** Use process-claim tense when validation is shipping-before-execution. Reserve outcome-claim tense for cases where validation has actually run AND produced the claimed outcome. Audit CHANGELOG verbs at R1 for outcome-claims that the release cannot empirically defend.

---

## AP-2: CHANGELOG bullet duplication across versions

**Description:** A feature shipped in v(N-1) gets re-listed in v(N)'s Added subsection, signaling false novelty to upgrading users. Often happens because authors brainstorm the v(N) entry from "what's the framework doing now" rather than "what changed since v(N-1)" — leading to surfacing of features that were already there.

**v6.3 instance:** Story 5B.1 — `CHANGELOG.md` v4.0 Added bullet `convoke-update "What's New" surfacing` was caught by Edge Hunter R1-CR-H1 as already shipped in v3.3.0 via Story U7. Bullet deleted at R1. The R1 patch was the first time the section was scrutinized against prior CHANGELOG entries; spec author had not done that grep at draft time.

**Counter-pattern:** Before authoring v(N) Added bullets, grep `CHANGELOG.md` for prior version mentions of the same feature. If shipped in v(N-1), it belongs under Changed (if modified) or omitted entirely. Edge Case Hunter pattern at draft time, not just at review time.

---

## AP-3: Round 1 patches introducing new HIGH-severity regressions

**Description:** R1 code-review patches are themselves code; they ship without their own review. When a patch introduces a normalization, guard clause, or generic refactor, it can silently introduce regressions in the very area it tried to harden. Without a Round 2 review, these regressions ship.

**v6.3 instance:** Epic 1A retro reported 3 distinct R1-introduced regressions across 6 stories: Story 1A.1 count arithmetic regression (E14 cross-references double-counted by R1's normalization patch); Story 1A.2 trailing-slash normalization introduced `projectRoot='/'` silent cwd-load bug; Story 1A.6 M7 CRLF normalization mutated CRLF inside quoted CSV fields (M7 × H2 interaction). All three caught at R2 only — without the convergence rule, they would have shipped.

**Counter-pattern:** When an R1 patch is a normalization or guard clause, R2 reviewers MUST run extreme-value tests (empty string, whitespace-only, root path `/`, CRLF inside quoted fields, NUL bytes, leading/trailing dashes). Codified as Epic 1A retro PI-2; reinforced by Story 2.2 N=10 boundary test, Story 2.4 R2-H3 symlink rejection test. Convergence rule (R2 mandatory when R1 has any HIGH) is the safety net — never shortcut.

---

## AP-4: Spec-body drift after R1 patches

**Description:** R1 patches change test counts, AC enumeration, or scope boundaries — but the spec body's prose narratives (Acceptance Criteria text, Tasks/Subtasks lists, File List counts) get authored once at draft time and stale rapidly post-patch. The Change Log + File List entries track the changes; the AC body does not. Auditors at R2 then re-discover the drift.

**v6.3 instance:** Story 2.4 R2-D1: spec AC8 body still listed 12 test cases when the code had 19 (R1 added 7). R2-D2: R1-M1 patch description said 3 prefixes; code shipped 4 (redundant-but-equivalent — R1 expanded scope). Both caught by Acceptance Auditor at R2. Story 5B.1 R2-M1: stale "Added 6 bullets" narrative in 3 spec locations after CR-H1 patch removed a bullet (count was 5 post-patch).

**Counter-pattern:** R1 patches that change test count, AC scope, or task subtasks MUST trigger a spec-body update in the same R1 commit — not wait for R2 Auditor to flag. Codified as Epic 2 retro PI-5. Dev-agent reflex: after each R1 patch, re-read AC body + Tasks/Subtasks list + File List and update inline.

---

## AP-5: Shell pipeline `$?` reads tail's exit, not the load-bearing command

**Description:** Empirical probes (V-pass option 0; sanity checks during dev-story) often use `cmd 2>&1 | tee log; echo "exit=$?"` or `cmd | tail -30; echo "exit=$?"` — but `$?` reads the LAST command's exit (`tee`/`tail`), not `cmd`'s. The load-bearing exit-code signal is silently lost; spec assumptions about CLI behavior get baked in as wrong.

**v6.3 instance:** Story 3.5 dev-time AC2 deviation. V-pass empirical probe claimed `validate-exports` exits 0 even with issues. Reality: validator exits 1 on any issue. The probe shell pipeline used `... 2>&1 | tail -30; echo "exit=$?"` — `$?` read `tail`'s exit (always 0), not `node`'s. Substantive criterion still met (allowlist semantics correct); spec amended inline. Codified as Epic 3 retro PI-9.

**Counter-pattern:** All future empirical probes capturing exit codes MUST use one of: (a) `${PIPESTATUS[0]}` in bash, (b) `set -o pipefail` set globally, or (c) run command without pipes. Avoid `cmd | tee log; echo "exit=$?"` pattern entirely. Add to project anchor rules for V-pass + dev-story facilitators.

---

## AP-6: Spec spot-check rubric too narrow to catch user-visible defects

**Description:** Procedural-story spec-author rubrics often check structural shape (frontmatter keys present, headings ordered, schema fields conform) — and miss the most user-visible content defects (broken template placeholders, leaked internal vocabulary, garbled prose). The rubric PASSES; the artifact is structurally sound but functionally broken.

**v6.3 instance:** Story 3.5 — 9-cell rubric (frontmatter shape + `## You are` + `FORBIDDEN_STRINGS`) PASSED 9/9. Missed `[your name]` / `[your context]` / `[your preferred language]` / `[your output folder]` template placeholders leaked across 44/44 exported `instructions.md` files. Caught only by Edge Case Hunter's broader sweep (R1-M4). Routed to Bug-Lane (export-engine fix) + Initiative-Lane (rubric-widening). Codified as Epic 3 retro PI-12.

**Counter-pattern:** When authoring procedural-story spot-check rubrics, ALSO consider the most user-visible content defects, not just structural shape. Apply Edge Case Hunter pattern at SPEC-AUTHOR time (broaden the rubric proactively before V-pass): scan for placeholder strings, template tokens, common fragment leaks. Rubric depth > rubric breadth — better to check 5 user-visible content properties than 15 structural ones.

---

## AP-7: Overpromising shipped functionality by referencing unbuilt machinery

**Description:** Documentation, guides, or release artifacts reference downstream tooling, commands, or workflows that have not yet been built. Users reading the doc try the referenced flow, find it broken, learn that the framework's instructions are not authoritative — and then ignore future correct instructions because trust is gone.

**v6.3 instance:** Story 1A.6 D1 strip decision. The migration guide originally referenced an Epic-2 custom-skills section + machinery that Epic 2 hadn't built yet. Strip-vs-defer decision: chose strip over "coming soon disclaimer" — an honest-software call. Per Epic 1A retro key lesson 2: "Strip > defer > aspiration. When shipping docs that reference unshipped machinery, strip the reference. Don't ship 'coming soon.'" Same restraint applied at Story v63-2-1 H3 self-reference filter (filter out `references/` doc examples so CSV registry reflects reality, not aspirational detection).

**Counter-pattern:** Default to STRIP when shipping docs that reference unshipped machinery. "Coming soon" notes teach users the framework's instructions are aspirational; strip teaches them the framework only documents what works. If the unshipped feature is critical, defer the document until the feature ships. Per S1 honesty constraint: name what the release can't promise rather than implying it.

---

## AP-8: "First-class" and other unearned status inflation in user-facing prose

**Description:** Marketing-language phrases like "first-class community module", "opinionated downstream", "strategic bet on X coupling" inflate the framework's actual status. Users read these as positioning claims; the words leak internal-only framing into user-facing artifacts. Per S2 dual-framing discipline (PRD `innovation-novel-patterns.md:50-55`), these phrases belong in `internalOnly` vocabulary, not in CHANGELOG / migration guide / release announcement.

**v6.3 instance:** PRD seed examples per `innovation-novel-patterns.md:62` ("we used 'first-class' where the status was unearned"; "we let M18 masquerade as a metric when it was a policy"). Story 5B.1 cliché-list grep (FR42) + internalOnly grep (FR43) both run against the v4.0 CHANGELOG section to enforce S2 — both returned zero matches at story-close per `v63-5b-1-grep-evidence.md`. The grep enforcement is the counter-pattern made executable.

**Counter-pattern:** Maintain a published `internalOnly` vocabulary list (per PRD `framingAnnotations.internalOnly` family). Run grep -nE checks against all user-facing release artifacts (CHANGELOG, migration guide, release announcement, README) before tagging. Zero matches required. If a phrase is genuinely user-facing AND uninflated, promote it to `userFacing`; otherwise rephrase. Sophia's announcement draft is the canonical voice exemplar for Convoke; its regex serves as the enforcement gate.

---

## AP-9: Structural migrations leaving downstream test fixtures broken

**Description:** A structural migration (file rename, directory restructure, schema change) updates production code + tests in the migration's own scope — but leaves integration tests / fixtures elsewhere in the repo silently broken. The migration ships green; the broken tests surface only at the next story's baseline gate, blocking unrelated work.

**v6.3 instance:** Story 3.1's skill-dir migration (`<id>.md` → `<id>/SKILL.md`) didn't update integration test fixtures referencing the old layout. Discovered at Story 3.4 dev-story Task 0.1 baseline gate: 8 pre-existing integration test failures across 3 test files. Story 3.1 V-pass + R1 + R2 reviews didn't catch this because the affected tests pass `runScript()` with `cwd: PACKAGE_ROOT`-substitute fixtures; the broken fixture-state was only exposed when Story 3.4 ran the integration suite as its baseline gate. Operator-managed-side-commit (BUG-6) cleaned it up; Story 3.4 resumed cleanly. Codified as Epic 3 retro key lesson 9.

**Counter-pattern:** Structural migrations MUST add a "downstream-test-fixture audit" subtask to AC at story-author time — explicit grep across `tests/` for old-layout references. If the audit surface is too large for one story, file a deferred Bug-Lane row at story-author time so the work is tracked rather than discovered. Pre-flight `npm test` baseline captures fixture lag at story-start, not story-close.

---

## AP-10: Test fragility via incidental substring match in CLI tests

**Description:** Tests that spawn a CLI and assert on stdout substring presence pass when an unrelated output coincidentally contains the substring. The test passes; the assertion is no longer testing what the author intended. Often happens with single-substring matches against shared fixture output (validator messages, scanner logs, version banners) that contain common words.

**v6.3 instance:** Story 2.3 Legacy Test 9 passed via incidental substring match in unrelated output (caught R2-M2, test deleted). Story 2.4 Test 12 SIGINT test passed via Node's default signal behavior, never exercising the custom handler (caught R2-H2, test repurposed as R1-M8 non-TTY guard). Story 2.4 R1-H1 concurrency test STILL weak (`Promise.all` + `setTimeout(fn, 0)` is sequential on the event loop, not parallel — flagged as TI-5 deferred). Codified as Epic 2 retro PI-6.

**Counter-pattern:** For tests that verify a specific CLI-emitted string, prefer AND-conjunction of multiple specific substrings (per Story 2.3 R2-M2 rewrite of Test 2). For tests that verify a specific side effect (byte-identical file post-cancel, specific exit code, file presence), prefer asserting on that side effect rather than on a stdout substring. Add to project anchor rules: substring-assertion CLI tests require multi-substring AND-conjunction OR side-effect assertion.

---

## AP-11: Count drift in cross-spec progress narratives

**Description:** Sprint progress counts (e.g., "X/Y stories shipped") get authored by copying narrative from a prior spec without re-verifying against ground truth (`sprint-status.yaml`). The count goes stale — typically off-by-one — between when the prior spec was authored and when the new spec is authored, because intervening stories have shipped + status fields have changed. The drift then propagates: each new spec inherits the wrong count from the previous spec until someone empirically re-greps. Symptoms: numerator off-by-one (story-not-yet-shipped counted as shipped) OR denominator off-by-one (stale total story count from earlier sprint planning).

**v6.3 instance:** Story 5B.1 spec used "22/29 stories" at creation (denominator 29 was wrong — actual 28 v63 stories total per `grep -cE "^  v63-[0-9]+[a-z]?-[0-9]+-" sprint-status.yaml`). Story 5B.2 R1 CR-H2 caught this and corrected to 22/28 at story-close. Story 5B.3 spec creation INHERITED the "23/28" count from Story 5B.2's close-time narrative (correct as a forward-looking close-time count) but applied it as a "story-creation" count — off-by-one again because Story 5B.3 wasn't shipped at creation (actual 22/28). Story 5B.3 V-pass CM-2 caught this same off-by-one pattern recurring on consecutive specs. Two empirical observations on the same pattern in 24 hours = registry candidate per L1 falsification clause.

**Counter-pattern:** At each spec-author + close + V-pass time, RE-GREP `sprint-status.yaml` for the `: done` count rather than copying narrative from prior spec:
- Total v63 stories: `grep -cE "^  v63-[0-9]+[a-z]?-[0-9]+-" _bmad-output/implementation-artifacts/sprint-status.yaml`
- v63 stories done: `grep -cE "^  v63-[0-9]+[a-z]?-[0-9]+-.*: done$" _bmad-output/implementation-artifacts/sprint-status.yaml`
Use the empirical-probe option-0 pattern (Epic 3 retro PI-8 / AP equivalent) — the V-pass MUST re-verify denominator + numerator counts via grep, never via narrative inheritance. Treat any "X/Y stories shipped" claim in a new spec as a count-drift candidate until empirically verified. **Discipline at spec-author time:** if you can't run the grep right now, write `XX/YY` placeholders + flag a TODO for the V-pass to fill in — narrative-inheritance is the failure mode this anti-pattern names.

---

## Maintenance + Reuse

**Adding entries.** Future retrospectives append to this registry. Each new entry follows the same shape: `## AP-N: <name>` + **Description** + **v6.3 instance** (or future version) + **Counter-pattern**. Sequence numbers monotonically increase. (Note: heading-depth is `##` h2 throughout — the v6.3-stream initial population fixed this convention; use `##` for AP-N entries.)

**Consultation cadence.** Per PRD `innovation-novel-patterns.md:100` (L1 mitigation): registry must be consulted at the *start* of future releases (Sprint 0 checklist), not just updated at the end. Future operators: open this file at v4.x or v6.4 kickoff, review all entries, and cite entries that apply to the upcoming work in the new release's planning artifacts.

**Recurrence tracking.** When a retrospective observes that an existing anti-pattern recurred despite the registry, that recurrence is itself an L1 falsification signal per PRD L64. Document recurrence inline in the existing entry (e.g., "v6.4 instance: <citation>") rather than creating a duplicate entry.

**Deletion / deprecation.** Entries are not deleted. If an anti-pattern becomes inert (e.g., the underlying practice is now impossible due to tooling enforcement), append a `**Status:** RESOLVED — <date> — <how>` line to the entry rather than removing it. Preserves historical record per S2 honesty discipline.

---

## Traceability

- **PRD source:** `_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md` (L59-64 L1 hypothesis definition; L88-99 standing-discipline analysis; L100 consultation-cadence requirement)
- **Story 5B.2 spec:** [`../implementation-artifacts/v63-5b-2-run-retrospective-and-create-anti-pattern-registry.md`](../implementation-artifacts/v63-5b-2-run-retrospective-and-create-anti-pattern-registry.md)
- **Initiative retrospective consuming this registry:** [`../implementation-artifacts/v63-retrospective-bmad-v6.3-adoption.md`](../implementation-artifacts/v63-retrospective-bmad-v6.3-adoption.md)
- **Source retros (v6.3-stream):** [`../implementation-artifacts/epic-v63-1a-retro-2026-04-23.md`](../implementation-artifacts/epic-v63-1a-retro-2026-04-23.md), [`../implementation-artifacts/epic-v63-2-retro-2026-04-24.md`](../implementation-artifacts/epic-v63-2-retro-2026-04-24.md), [`../implementation-artifacts/epic-v63-3-retro-2026-04-25.md`](../implementation-artifacts/epic-v63-3-retro-2026-04-25.md)
- **FR coverage:** FR48 (`convoke-anti-patterns.md` registry created with v6.3-stream observations); supports FR49 + FR50 + L1 hypothesis (PRD L59-64)
