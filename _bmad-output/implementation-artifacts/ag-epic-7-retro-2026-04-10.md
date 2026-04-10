---
artifact_type: retrospective
initiative: convoke
created: 2026-04-10
schema_version: 1
status: complete
---

# Epic 7 Retrospective — Cross-Cutting Platform Debt

**Date:** 2026-04-10
**Epic:** ag-epic-7 (Cross-Cutting Platform Debt)
**Facilitator:** Bob (Scrum Master)
**Participants:** Amalik (Project Lead), Alice (Product Owner), Charlie (Senior Dev), Dana (QA Engineer)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| Stories completed | 4/4 (100%) |
| Backlog items closed | 6 (I29, I30, I31, I32, I34, I10) |
| Backlog items opened | 6 (I43-I48 — discovered by Story 7.3 audit) |
| Net debt delta | 0 (6 closed, 6 opened — new items lower severity) |
| Review rounds total | 7 (7.1: 2, 7.2: 1, 7.3: 3, 7.4: 1) |
| Total review findings | ~50 (all resolved) |
| Tests added | ~112 (from ~938 to ~1050) |
| CI regressions | 0 |
| NFR violations | 0 |

### Story Breakdown

| Story | Closes | Type | Code delta | Review rounds | Key finding |
|-------|--------|------|-----------|---------------|-------------|
| 7.1 | I30+I29+I10 | Code | 5 YAML write sites migrated to `yaml@^2.8.3`; `assertVersion` guard; `MERGED_DOC_SENTINEL` | 2 (24 patches) | Round 1 caught `migration-runner.js` bypass + self-heal data-loss footgun |
| 7.2 | I31 | Code | `loadSkillManifest` + `checkModuleSkillWrappers` in convoke-doctor.js | 1 (6 patches) | Manifest-as-opt-in semantics correction; `_team-factory` lazy-require crash |
| 7.3 | I34 | Research | 25-row contract audit (zero code changes) | 3 (30 findings) | Catalogue incomplete in every round (13→22→23→25); I43 (12 agent wrappers unchecked) re-scored to RICE 6.4 |
| 7.4 | I32 | Code | `cleanupOrphanWorkflowWrappers` (40 lines) + 10 tests | 1 (2 patches) | Two-strategy matching (Enhance prefix + Artifacts exact-name) prevented upstream collision risk |

---

## Previous Retro Action Item Follow-Through

| # | Action Item (from Epic 6) | Status |
|---|--------------------------|--------|
| 1 | Plan Epic 7 around the deferred cross-cutting platform debt | ✅ Completed — Epic 7 created directly from Epic 6 retro's Action Item #1; all 6 identified backlog items closed |
| 2 | Every story creating files under `_bmad/{module}/` or `.claude/skills/` must include a "Namespace decision" rationale section | ✅ Completed — NFR4 enforced across all 4 stories; every story file has the section; zero namespace collisions |

**Streak:** 2/2 action items completed (100%). First time both the Epic 5→6 and Epic 6→7 retro action items have been fully honored.

---

## What Went Well

1. **The adversarial review pattern IS the safety net.** Story 7.1 Round 1 caught the `migration-runner.js` bypass — a real bug that would have erased Vortex comments on every `convoke-update`. Story 7.2 Round 1 caught the `_team-factory` top-level `require` crash that would have broken the doctor on installs missing the optional submodule. Without NFR3, both would have shipped.

2. **The spec review step prevented a design-level bug in Story 7.4.** The pre-dev spec review caught that hardcoded prefix-matching (`bmad-migrate-*`, `bmad-portfolio-*`) would collide with upstream BMAD skills. The two-strategy matching approach (Enhance prefix + Artifacts exact-name) was designed before a line of code was written.

3. **The namespace audit rule (NFR4) worked.** Zero namespace collisions across 4 stories. Every story justified its file placement. 3 out of 4 stories correctly concluded "no namespace decision needed."

4. **I43 (RICE 6.4) is the audit's biggest payoff.** Story 7.3 discovered that 12 bme agent skill wrappers (Vortex 7 + Gyre 4 + team-factory 1) have zero doctor/validator coverage. Without the audit, nobody would have known until an operator hit the silent slash-command failure. The audit paid for itself with one finding.

5. **Test count grew by ~112.** Every story followed the temp-dir fixture pattern established in Epic 6. The test suite is materially stronger. Coverage on `refresh-installation.js` went from 92.53% to higher (new sweep function fully covered).

6. **Epic 6 retro action items were 100% honored.** The retro→epic pipeline worked: Epic 6's retro surfaced the debt, the triage workflow scored it, and Epic 7 closed it. The process loop closed cleanly.

---

## What Didn't Go Well

1. **Story 7.3's catalogue never converged.** The audit claimed "exhaustive" in every draft, and every review round found more missing rows (13→22→23→25). Research deliverables don't have the binary pass/fail property that code changes have. The review process kept finding more because "walk a 790-line file and catalogue every flag-gated branch" is inherently subjective — different readers see different things.

2. **Review patches introduced fresh defects.** Story 7.3's exec summary verdict counts were wrong in 3 consecutive drafts. Each patch fixed one count and broke another. The Round 2 patch added F23 but forgot to update the I47 backlog row it was "folded into." Review patches amplified noise instead of dampening it.

3. **Subagent 529 errors degraded review independence.** Story 7.3 Round 1: Edge Case Hunter and Acceptance Auditor both 529'd twice and had to run inline by the same model that authored the audit. This eliminated the LLM diversity that NFR3 was designed to provide. Round 2 and Round 3 ran successfully, but the reliability issue burned time and created a confidence gap.

4. **Sprint-status.yaml linter races.** Multiple stories across the epic hit linter conflicts between read and edit, requiring multiple retries. Not Epic 7-specific but accumulated frustration — the external linter modifies the file between the agent's read and write, causing edit failures.

5. **The effort distribution was inverted.** Story 7.4 (the actual code change that operators will notice) took the least effort. Story 7.3 (an internal audit document) consumed the most review cycles. The review overhead didn't correlate with user-facing value.

---

## Root Cause: Confidence Erosion

**Amalik's key observation:** "When it is so laborious, it's hard to feel confident in the outputs."

This is the central finding of the Epic 7 retro. The adversarial review process works — it catches real bugs — but the *experience* of 3 review rounds with 30 findings on a markdown document erodes trust in the deliverable. If every review round finds the previous draft was wrong, the natural question is: "Is the final draft also wrong?"

**Three root causes identified:**

1. **Research stories lack mechanical verification.** Code stories have tests (binary pass/fail). Research stories have prose claims that require human judgment to verify. The "catalogue every flag-gated branch" methodology relied on eyeballing section headers instead of systematic `grep`.

2. **Count-sensitive outputs are hand-maintained.** Verdict distributions, fold-in mappings, and I-item references were maintained by hand in markdown tables. Every edit risked breaking a cross-reference. No validation script existed to catch arithmetic errors.

3. **No review convergence criteria.** NFR3 says "every story gets `bmad-code-review`" but doesn't say when to stop. The unbounded "keep reviewing until clean" pattern meant Story 7.3 went through 3 rounds with no principled stopping rule.

---

## Technical Debt After Epic 7

### Opened by Epic 7 (6 items)

| Item | RICE | Source | Surface |
|------|------|--------|---------|
| I43 | 6.4 | Story 7.3 audit (F6+F20+F21) | 12 agent skill wrappers not validated by doctor |
| I44 | 0.7 | Story 7.3 audit (F3+F16+F17) | No `validateGyreModule` function |
| I45 | 0.15 | Story 7.3 audit (F13) | Workflow-manifest CSV registration drift |
| I46 | 0.5 | Story 7.3 audit (F8+F9) | Version-stamp post-check absence |
| I47 | 0.35 | Story 7.3 audit (F2) | Doctor missing Enhance menu-patch check + parallel-coverage consolidation |
| I48 | 0.3 | Story 7.3 audit (F23) | Agent-manifest doctor check + CSV-parse upgrade (bundles with I15) |

### Pre-existing (carried through)

- Jest lib infrastructure issue (`npx jest tests/lib/` failures on files migrated to `node:test`) — documented in every story, not addressed
- `convoke-doctor` version-consistency drift (`_enhance: 1.0.0`, `_gyre: 1.0.0`, `_artifacts: 1.0.0`, `_team-factory: 1.0.0` vs package `3.1.0`) — dev-repo drift, not operator-facing

---

## Action Items

| # | Action Item | Owner | Trigger |
|---|------------|-------|---------|
| 1 | **Research stories must use a mechanical search protocol.** For any story whose deliverable is a catalogue/audit/inventory, the spec MUST include a grep-based discovery step (e.g., "grep every `if (!isSameRoot)` in the target file and add each match to the catalogue"). No reliance on section-header eyeballing. | Story creation workflow (spec-level change) | Next research story |
| 2 | **Structured-source deliverables for count-sensitive outputs.** Any audit table, catalogue, or inventory with arithmetic claims (verdict counts, fold-in mappings) MUST have a structured source (YAML/JSON) with a validation script. The markdown table is generated from the structured source, not hand-maintained. | Dev workflow (implementation pattern) | Next audit/catalogue story |
| 3 | **Review convergence rule.** Round 1 is mandatory. Round 2 is triggered if Round 1 has any HIGH finding. Round 3 is triggered ONLY if Round 2 introduces structural changes (not just wording fixes). Replaces the current unbounded "keep reviewing until clean" pattern. | `bmad-code-review` workflow (process change) | Immediate — all future stories |

---

## What Stays the Same

1. **NFR3 (adversarial review via `bmad-code-review`)** — the 3-layer pattern (Blind Hunter + Edge Case Hunter + Acceptance Auditor) stays. It caught real bugs in Stories 7.1 and 7.2. Action Item #3 above adds a convergence rule, but doesn't remove the process.
2. **NFR4 (namespace decision section)** — inherited from Epic 6, proved its value again. Keep for all future stories that create files.
3. **Temp-dir fixture pattern for tests** — established in Epic 6, used in all 4 Epic 7 stories. Standard practice now.
4. **Spec review before dev** — caught Story 7.4's prefix-collision design flaw before implementation. Keep the "review the story file" step before `/bmad-dev-story`.
5. **`npm run check` before review** — zero CI regressions across 4 stories. The discipline continues.

---

## Initiative Status After Epic 7

**Artifact Governance & Portfolio initiative status:** Epic 7 (Cross-Cutting Platform Debt) is complete. The initiative's platform foundation is now solid: version stamps are guarded, YAML comments survive updates, the doctor validates skill wrappers, the contract surface is audited, and orphan wrappers self-clean.

**What remains** is the 6 audit-discovered items (I43-I48) — a natural follow-up sprint or a feature-epic side-effect. I43 (agent skill wrapper validation, RICE 6.4) is the highest-priority item in the entire backlog and should be picked up early.

**Next planned work:** no Epic 8 is currently defined. The Skill Portability initiative (sp-epic-2) is running in parallel. The Epic 7 retrospective does not mandate a successor epic — the action items are process improvements, not new feature scope.

---

## Closing Notes

Bob (Scrum Master): "Three action items, all achievable, all with clear triggers. Epic 7 was the toughest epic yet in review effort, but it closed 6 real debt items and discovered 6 more. The process loop works — it just needs better convergence discipline."

Alice (Product Owner): "The spec review catching Story 7.4's prefix collision before a line of code was written — that's the process paying dividends. Let's keep that."

Charlie (Senior Dev): "And Action Item #2 — structured sources for count-sensitive deliverables — would have saved us 2 entire review rounds on Story 7.3. That's the highest-leverage process change."

Amalik (Project Lead): Confirmed all three action items.
