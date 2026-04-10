# Retrospective — SP Epic 4: Standalone Skills Repository (First Release)

**Date:** 2026-04-10
**Epic:** sp-epic-4 (Skill Portability & Distribution Initiative, Epic 4)
**Stories:** sp-4-1, sp-4-2 (2/2 done)
**Facilitator:** Bob (Scrum Master)
**Implementation:** Amelia (dev agent)
**Code review:** parallel adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor)

---

## Epic outcome

**Result:** Complete seeding + validation pipeline. 44 standalone skills exportable to a staging directory with self-verification and structural validation. Epic 5 (Tier 2 + adapters) unblocked. Catalog repo ready for `git init && gh repo create`.

| Metric | Value |
|---|---|
| Stories shipped | 2 / 2 |
| ACs satisfied | 14 / 14 (8 + 6) |
| Tests added | 8 (4 + 4) — total portability suite now 71 |
| Files created | 4 (seed script, validator, 2 test files) |
| Code-review patches applied | 7 across both stories (3 for sp-4-1, 4 for sp-4-2) |
| Spec-review patches applied | 3 for sp-4-1, 1 for sp-4-2 |
| Pre-existing test regressions | 0 |

---

## Epic 3 retro action item follow-through

| # | Action | Status | Evidence |
|---|---|---|---|
| A1 | Extract FORBIDDEN_STRINGS to shared module | ❌ Not done | Now 6 copies (seed-catalog-repo.js + validate-exports.js added 2 more). Debt grew. |
| A2 | `--quiet` flag for batch warnings | ❌ Not done | Not in Epic 4 scope. Still 400 warnings. |
| A3 | Enumerate from source, not example | ✅ Applied | sp-4-1 seed script uses the same 17-entry list systematically |
| A4 | Carry forward: manifest dupes, CRLF, basename | ⏳ Open | Still deferred, still not triggered |

**Score: 1/4 applied.** A1 got worse (6 copies now). A2 still open. Accumulated debt from 3 retros.

---

## What went well

### 1. Code review caught real safety issues

sp-4-1's P1 (destructive `rmSync` on pre-existing directories) was the most impactful finding across the entire initiative. If someone had run `seed-catalog-repo.js --output ~/Documents` and it failed mid-pipeline, it would have recursively deleted their Documents folder. The fix (refuse non-empty dirs + `dirCreatedByUs` flag) is simple but essential. This is the kind of bug that adversarial review exists to catch.

sp-4-2's P1 (inverted `./` link logic) and P2 (frontmatter regex `m` flag) were both correctness bugs that would have produced false negatives — the validator would have passed broken exports.

### 2. The seed script's self-verification worked as designed

8 built-in checks run after generation. The validator (sp-4-2) adds structural depth (XML tags, code fences, frontmatter, markdown links). Two-layer verification: build-time gate (seed) + QA tool (validator). Both passed on first run with 44 skills.

### 3. Direct module imports eliminated subprocess overhead

sp-4-1's seed script calls `exportSkill()`, `generateCatalog()`, `buildReadme()` directly instead of spawning 44+ subprocesses. The full pipeline (export + catalog + verify) runs in ~2 seconds. This design choice paid off immediately.

### 4. The progressive foundation from Epics 1-3 made both stories fast

Both stories were essentially orchestration scripts that wired together existing modules. No new algorithms, no new data structures — just `for (skill of skills) { exportSkill(); buildReadme(); writeFile(); }`. The hard work was done in Epics 2-3.

---

## What didn't go well

### 1. FORBIDDEN_STRINGS debt is now 6 copies and growing

| File | Entry count |
|---|---|
| `tests/lib/portability-export-engine.test.js` (sp-2-2) | 19 |
| `tests/lib/portability-export-all.test.js` (sp-2-4) | 17 |
| `tests/lib/portability-catalog-generator.test.js` (sp-3-1) | 8 |
| `tests/lib/portability-per-skill-readme.test.js` (sp-3-2) | 0 (doesn't check) |
| `scripts/portability/seed-catalog-repo.js` (sp-4-1) | 17 |
| `scripts/portability/validate-exports.js` (sp-4-2) | 17 |

Three retros have flagged this. The counts don't even match (19 vs 17 vs 8). This is the initiative's #1 test-reliability debt. It should be addressed before Epic 5 starts.

### 2. The `rmSync` safety issue should have been caught in spec review

The seed script's spec said "clean up the staging dir on failure." The spec review (C1 patch) added `loadSkillRow` usage but didn't question the cleanup approach. The destructive delete was only caught by the Blind Hunter in code review. Lesson: **cleanup of user-provided paths deserves explicit safety analysis in the spec**, not just in code review.

### 3. Test hardcoding continues to be a pattern

sp-4-1 Test 1 hardcoded `44` (caught and fixed in code review). sp-4-2 didn't have this issue because we learned from it. But it keeps appearing in first drafts. The dev agent defaults to hardcoded values and needs the reviewer to push back.

---

## Action items (for Epic 5 and beyond)

| # | Action | Owner | When |
|---|---|---|---|
| **A1** | **CRITICAL:** Extract FORBIDDEN_STRINGS to `scripts/portability/test-constants.js`. Import from all 6 files. This has been flagged in 3 consecutive retros and is now blocking test reliability. Do it as the first task of the next story that touches tests, or as a standalone debt story. | next dev session | Before Epic 5 |
| **A2** | When a script accepts user-provided paths for cleanup/deletion, the spec must include explicit safety constraints (refuse non-empty, track `createdByUs`, etc.). Don't rely on code review to catch destructive operations on user paths. | story author | ongoing |
| **A3** | Carry forward: `--quiet` flag (Epic 2 A3), manifest dupes (Epic 2 A2), CRLF (Epic 1 A6), basename collision (Epic 1 A7) | deferred | as needed |

---

## Key lessons (carry into Epic 5)

1. **Adversarial review catches safety issues that spec review misses.** The `rmSync` bug was invisible at the spec level (the spec said "clean up on failure" which sounds reasonable) but dangerous at the implementation level (user-provided path → recursive delete).
2. **Orchestration stories are fast when the foundation is solid.** Both sp-4-1 and sp-4-2 were thin wrappers around existing modules. The investment in Epics 2-3 paid off.
3. **Debt tracking across retros works — but only if someone acts on it.** FORBIDDEN_STRINGS has been flagged 3 times. The retro process surfaced it; the prioritization process didn't address it. Action: make A1 a blocking prerequisite for Epic 5.
4. **Two-layer verification (build-time + QA-time) is the right pattern.** The seed script's self-verification catches generation errors; the validator catches structural quality issues. Neither alone is sufficient.

---

## Initiative progress (Epics 1-4 complete)

| Epic | Stories | Tests | Status |
|---|---|---|---|
| Epic 1: Classification & Metadata | 3/3 | 21 | done |
| Epic 2: Tier 1 Exporter (Core Engine) | 4/4 | 31 | done |
| Epic 3: Skill Catalog Generation | 2/2 | 11 | done |
| Epic 4: Standalone Skills Repository | 2/2 | 8 | done |
| **Total** | **11/11** | **71** | **done** |

The first 4 epics deliver the complete Tier 1 pipeline: classify → export → catalog → seed → validate. A consultant can now browse and copy 44 standalone skills.

Epic 5 (Tier 2 Export & Platform Adapters) is optional — it extends the system to light-deps skills and generates per-platform wrappers. The core value proposition is already delivered.

---

## Epic 5 readiness assessment

| Question | Answer |
|---|---|
| Can we seed a catalog repo with 44 skills? | ✅ Yes — `seed-catalog-repo.js` produces a verified staging dir |
| Is the staging dir structurally validated? | ✅ Yes — `validate-exports.js` checks markdown, forbidden strings, platforms |
| Manual smoke tests documented? | ✅ Yes — VALIDATION-REPORT.md with Carson/Winston/Murat checklists |
| Blocking debt? | ⚠️ FORBIDDEN_STRINGS (6 copies, 3 retros) — address before Epic 5 |
| Test coverage? | ✅ 71 tests, all green |

**Verdict:** Ready for Epic 5 after addressing A1 (FORBIDDEN_STRINGS extraction).
