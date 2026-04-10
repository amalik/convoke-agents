# Retrospective — SP Epic 2: Tier 1 Exporter (Core Engine)

**Date:** 2026-04-10
**Epic:** sp-epic-2 (Skill Portability & Distribution Initiative, Epic 2)
**Stories:** sp-2-1, sp-2-2, sp-2-3, sp-2-4 (4/4 done)
**Facilitator:** Bob (Scrum Master)
**Implementation:** Amelia (dev agent)
**Code review:** parallel adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor)

---

## Epic outcome

**Result:** Tier 1 export pipeline complete. 44/44 standalone skills export with zero failures. Epic 3 (catalog) unblocked.

| Metric | Value |
|---|---|
| Stories shipped | 4 / 4 |
| ACs satisfied | 39 / 39 (8 + 9 + 13 + 9) |
| Tests added | 31 (8 + 9 + 9 + 5) — total portability suite now 52 |
| Files created | 7 (3 templates, engine, CLI, 3 test files) |
| Files modified | 5 (readme-template, package.json, .gitignore, classify-skills, export-engine) |
| Skills exported | 44 / 44 unique standalone (zero failures) |
| Named-persona skills | 20 (floor was 12) |
| Workflow-derived personas | 24 |
| Code-review patches applied | 16 across all 4 stories |
| Spec-review patches applied | 12 across 3 stories (sp-2-2, sp-2-3, sp-2-4) |
| Pre-existing test regressions | 0 |

---

## Epic 1 retro action item follow-through

| # | Action | Status | Evidence |
|---|---|---|---|
| A1 | Document artifact-consumption patterns | ✅ Done | sp-2-1 grouped spec files by consumer |
| A2 | Subtree search for relative paths | ✅ Done | sp-2-2 reused `findFileInSubtree` |
| A3 | Verify referenced files exist before locking ACs | ✅ Done | sp-2-2 verified Carson + Winston in both manifests |
| A4 | Enumerate negative cases in heuristics | ✅ Done | sp-2-2 AC #6, sp-2-3 AC #6 tier tables |
| A5 | Minimal sprint-status edits during dev | ⏳ Partial | Edited at story boundaries, but multi-stream churn persists |
| A6 | CRLF in writeManifest | ❌ Deferred | Not triggered (no Windows contributors) |
| A7 | Basename collision in subtree search | ❌ Deferred | Not triggered during Epic 2 |

**Score: 5/7 completed.** Remaining 2 are hypothetical edge cases that didn't surface.

---

## What went well

### 1. Spec-review-before-dispatch caught material issues in 3/4 stories

- **sp-2-2:** Swapped Sophia (Tier 2) for Winston (Tier 1) as second test fixture — caught before dev started
- **sp-2-3:** 5 critical + 1 medium findings patched pre-dispatch (dirty-tree fallback, `(0 warnings)` noise, `<trigger N>` fragility, HTML-comment-blind regex, exit-code dispatch, `--tier banana` gap)
- **sp-2-4:** Strategy 2 double-cis bug predicted; CIS stem-mismatch identified; Test 5 lookup chain clarified

### 2. Adversarial code review remains a HIGH-value layer

16 patches across 4 stories. HIGH severity findings that would have been production bugs:
- **sp-2-2 P1:** `\Z` regex anchor (invalid in JS, affected 6 extractors silently)
- **sp-2-3 P3:** `--output --dry-run` consumed `--dry-run` as output path
- **sp-2-3 P1:** undefined `row` crash after manifest re-read in `runSingle`

### 3. Progressive strategy stacking for persona resolution

Each strategy added when prior ones proved insufficient:

| Strategy | Added in | Resolves | Skills |
|---|---|---|---|
| 1: exact match | sp-2-2 | `bmad-agent-*` | 9 |
| 2: prefix transform | sp-2-2 | `bmad-brainstorming` → `bmad-cis-agent-*` | 7 |
| 2b: alias map | sp-2-4 | CIS stem mismatches | 3 |
| 3: description fuzzy | sp-2-2 | "talk to X" patterns | 1 |
| 4: inline extraction | sp-2-2 | `# Name` + `## Identity` | 0 |
| 5: workflow-derived | sp-2-4 | tool-like utilities | 24 |

### 4. Canonical format spec (sp-2-1) held up unchanged

7-section structure + transformation rules + forbidden-string list unchanged across all 4 stories and all 44 exported skills. Hand-authored Carson example served as regression anchor for the entire epic.

### 5. Test accumulation was steady and regression-free

21 → 29 → 38 → 47 → 52 tests. Zero regressions. `convoke-doctor` baseline stable at 2 pre-existing issues throughout.

---

## What didn't go well

### 1. Strategy 2 double-cis prefix bug shipped in sp-2-2 and survived 2 stories

`bmad-cis-storytelling` → `bmad-cis-agent-cis-storytelling` (double `cis`). Not caught until sp-2-4's spec review analyzed the 28-failure list. Root cause: sp-2-2's test fixtures (Carson + Winston) don't exercise the `bmad-cis-*` branch of Strategy 2.

### 2. 400 batch warnings make real issues invisible

Phase 6 catch-all fires for every unmapped `{var}` in every skill. Most are false alarms. Signal-to-noise ratio is poor in batch mode.

### 3. Manifest duplicate rows discovered late (sp-2-3)

Same skill name across multiple modules (e.g., `bmad-shard-doc` × 3). Discovered during sp-2-3 smoke test, not during sp-1-2 classification or sp-1-3 validation. `Set`-based dedup is a workaround.

### 4. FORBIDDEN_STRINGS list duplicated across 3 test files

sp-2-1 (19 entries), sp-2-2 (19 entries), sp-2-4 (initially 16 entries — missing `Skill tool`). Caught by sp-2-4 auditor. Should be a shared constant.

---

## Action items (for Epic 3 and beyond)

| # | Action | Owner | When |
|---|---|---|---|
| **A1** | Each conditional branch in strategy/heuristic functions must have at least one test fixture (avoids double-cis class of bug) | story author | Epic 3+ spec phase |
| **A2** | Track manifest duplicate rows as backlog item (manifest-hygiene story) | backlog | next triage |
| **A3** | Add `--quiet` flag or filter Phase 6 catch-all to suppress expected warnings in batch mode | future story | sp-5-x or debt sprint |
| **A4** | Share `FORBIDDEN_STRINGS` from a single source-of-truth file; 3 test files have their own copies | future story | next portability test refactor |
| **A5** | Carry forward Epic 1 A6 (CRLF writeManifest) and A7 (basename collision) — still deferred | deferred | as needed |

---

## Key lessons (carry into Epic 3)

1. **Spec review and code review catch different classes of bugs.** Spec review: fixture gaps, design ambiguity. Code review: implementation bugs, edge cases. Both needed.
2. **Progressive strategy stacking beats upfront over-design.** Strategy 5 added in the last story with full context on what needed it.
3. **Hand-authored gold standards are worth their weight.** Carson canonical example anchored every story's tests.
4. **Out-of-scope sections continue to work.** Prevented sp-2-3 from doing full README (sp-3-2), sp-2-4 from doing catalog (sp-3-1).
5. **When a function has N branches, it needs N fixtures.** Double-cis bug survived 2 stories because Strategy 2's `bmad-cis-*` branch had zero test coverage.

---

## Epic 3 readiness assessment

| Question | Answer |
|---|---|
| Can `convoke-export --tier 1` produce the full export set? | ✅ Yes — 44/44 skills, exit 0 |
| Is the canonical format locked? | ✅ Yes — sp-2-1 spec unchanged |
| Are README stubs present for all skills? | ✅ Yes |
| Are there blocking data quality issues? | ⚠️ One: 400 batch warnings (noisy, not blocking) |
| Test coverage on the pipeline? | ✅ 52 tests, all green |
| Sprint status accurate? | ✅ All 4 stories + epic marked done |

**Verdict:** Ready to start Epic 3 (Skill Catalog Generation).
