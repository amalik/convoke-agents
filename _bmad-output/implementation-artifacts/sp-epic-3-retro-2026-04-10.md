# Retrospective — SP Epic 3: Skill Catalog Generation

**Date:** 2026-04-10
**Epic:** sp-epic-3 (Skill Portability & Distribution Initiative, Epic 3)
**Stories:** sp-3-1, sp-3-2 (2/2 done)
**Facilitator:** Bob (Scrum Master)
**Implementation:** Amelia (dev agent)
**Code review:** parallel adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor)

---

## Epic outcome

**Result:** Catalog pipeline complete. Decision-tree README + polished per-skill READMEs for all 44 standalone skills. Epic 4 (repo seeding) unblocked.

| Metric | Value |
|---|---|
| Stories shipped | 2 / 2 |
| ACs satisfied | 19 / 19 (10 + 9) |
| Tests added | 11 (6 + 5) — total portability suite now 63 |
| Files created | 4 (catalog generator, 2 test files, per-skill readme test) |
| Files modified | 3 (export-engine, convoke-export, readme-template) |
| Code-review patches applied | 4 across both stories (3 for sp-3-1, 1 for sp-3-2) |
| Spec-review patches applied | 4 for sp-3-1, 1 for sp-3-2 |
| Pre-existing test regressions | 0 |

---

## Epic 2 retro action item follow-through

| # | Action | Status | Evidence |
|---|---|---|---|
| A1 | Each conditional branch needs a test fixture | ✅ Applied | sp-3-1's `findAgentMatch` extraction is shared code tested by sp-2-2's 9 existing engine tests; no new branches introduced |
| A2 | Manifest duplicate rows → backlog | ⏳ Open | Not addressed in Epic 3 (no manifest changes). Still needs triage. |
| A3 | `--quiet` flag for batch warnings | ⏳ Open | Not in Epic 3 scope. Still 400 warnings in batch mode. |
| A4 | Share FORBIDDEN_STRINGS from single source | ⏳ Open | sp-3-1 test duplicated a subset (8 entries). Now 4 test files with their own copies. Debt growing. |
| A5 | Carry forward Epic 1 A6/A7 | ⏳ Open | Still deferred, still not triggered. |

**Score: 1/5 applied.** The rest are deferred debt items — none were in Epic 3's scope. The A4 debt (FORBIDDEN_STRINGS duplication) is the only one that got worse (4 files now, up from 3).

---

## What went well

### 1. Both stories were clean first-pass implementations

Neither sp-3-1 nor sp-3-2 required iteration loops during dev. The code review found only polish issues (unknown-intent fallback, file-write try/catch, dead import for sp-3-1; placeholder cleanup gap for sp-3-2). No HIGH-severity findings in either story.

### 2. The `findAgentMatch` extraction (sp-3-1) was a well-scoped refactor

Extracting Strategies 1+2+2b into a shared function was surgical — `loadPersona()` calls it, `resolvePersonaSummary()` calls it, and the 14 existing engine tests passed without modification. This validates the Epic 2 retro lesson: "progressive strategy stacking" created clean seams for extraction.

### 3. The sp-2-3 stub README was a good foundation for sp-3-2

sp-2-3's `buildReadmeStub` was already 90% of the final README. sp-3-2 only needed: strip comments, add 2 platform sections, clean leaked placeholders, rename function. The stub-then-polish approach worked — sp-2-3 shipped a valid directory structure, sp-3-2 polished the content.

### 4. The catalog output looks good

49 main-body skills across 6 intent categories with "I need to..." headings, 24 pipeline skills in a collapsed section, tier badges, persona icons. The decision-tree structure matches the vision doc's framing. A consultant can scan it in under 60 seconds.

---

## What didn't go well

### 1. FORBIDDEN_STRINGS debt is now 4 copies

sp-2-1 test (19 entries), sp-2-2 test (19 entries), sp-2-4 test (17 entries), sp-3-1 test (8 entries). Each is slightly different. This is the kind of drift that causes false-confidence — a test passes because its copy of the list is missing an entry, not because the code is correct. Epic 2 retro A4 flagged this; it got worse, not better.

### 2. The 400 batch warnings are still noisy

Epic 2 retro A3 flagged this. Epic 3 didn't address it (not in scope). But every batch test now prints 400 warning lines to stderr, making CI output unreadable. This needs a `--quiet` flag or filtered warning set.

### 3. sp-3-2's placeholder cleanup was incomplete until code review caught it

`buildReadme()` initially only cleaned 2 of 7 possible `[your ...]` engine placeholders. The Edge Case Hunter caught this. While it's a low-severity gap (most placeholders don't appear in README-facing sections), it shows that the cleanup was implemented by pattern-matching from the Carson example rather than systematically enumerating all engine outputs.

---

## Action items (for Epic 4 and beyond)

| # | Action | Owner | When |
|---|---|---|---|
| **A1** | Extract FORBIDDEN_STRINGS into a shared module (e.g., `scripts/portability/test-constants.js`) and import from all 4 test files. This is the #1 test-debt item across the portability suite. | next story touching tests | Epic 4 or debt sprint |
| **A2** | Add `--quiet` flag to `convoke-export` CLI to suppress expected batch warnings. Carry forward from Epic 2 A3. | future story | sp-5-x or debt sprint |
| **A3** | When implementing placeholder cleanup, enumerate all possible values from the source (engine Phase 6 map) rather than pattern-matching from a single example. | dev agent | ongoing discipline |
| **A4** | Carry forward: manifest duplicate rows (Epic 2 A2), CRLF writeManifest (Epic 1 A6), basename collision (Epic 1 A7) — all still open, none triggered. | deferred | as needed |

---

## Key lessons (carry into Epic 4)

1. **Stub-then-polish works.** Shipping a valid-but-rough artifact early (sp-2-3 stub) and polishing later (sp-3-2) is faster than trying to ship polished on the first pass.
2. **Clean extraction seams come from progressive design.** The `findAgentMatch` refactor was trivial because the strategy stack was built incrementally with clear boundaries.
3. **Enumerate from source, don't pattern-match from examples.** The placeholder cleanup gap (2 of 7 cleaned) is a generic lesson: when cleaning up engine output, read the engine's map, not just one example.
4. **Small epics are fine.** 2 stories, 19 ACs, 11 tests, done in one session. No ceremony overhead needed.

---

## Epic 4 readiness assessment

| Question | Answer |
|---|---|
| Can the catalog generator produce a valid README? | ✅ Yes — 49 main-body + 24 collapsed, all intent categories |
| Are per-skill READMEs polished and under 80 lines? | ✅ Yes — all 44 at 48 lines |
| Do READMEs include 3-platform install instructions? | ✅ Yes — Claude Code + Copilot + Cursor |
| Are there blocking data quality issues? | ⚠️ Same as Epic 2: 400 batch warnings (noisy, not blocking) |
| Test coverage on the catalog pipeline? | ✅ 63 tests, all green |
| Sprint status accurate? | ✅ Both stories + epic marked done |

**Verdict:** Ready to start Epic 4 (Standalone Skills Repository — Create and Seed).
