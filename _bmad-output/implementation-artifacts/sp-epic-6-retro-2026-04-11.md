# Retrospective — SP Epic 6: Skill Portability UX (Slash Command Wrappers)

**Date:** 2026-04-11
**Epic:** sp-epic-6 (Skill Portability & Distribution Initiative, Epic 6 — final)
**Stories:** sp-6-1, sp-6-2, sp-6-3, sp-6-4 (4/4 done)
**Facilitator:** Bob (Scrum Master)
**Implementation:** Amelia (dev agent)
**Code review:** parallel adversarial layers (sp-6-1 + sp-6-2 reviewed; sp-6-3 + sp-6-4 batched without separate review)

---

## Epic outcome

**Result:** All 4 portability tools wrapped as BMAD slash-command skills. Users interact via chatbox, not terminal. Initiative complete.

| Metric | Value |
|---|---|
| Stories shipped | 4 / 4 |
| Skills created | 4 (`bmad-export-skill`, `bmad-generate-catalog`, `bmad-seed-catalog`, `bmad-validate-exports`) |
| Files created | 16 (4 skills × 2 files × 2 locations: `.claude/skills/` + `_bmad/bme/_portability/`) |
| Manifest rows added | 4 |
| Code-review patches applied | 3 (sp-6-1: input validation + exit 1 handling; sp-6-2: completion notes) |
| Script changes | 0 (zero JS files modified — pure markdown + CSV) |
| Pre-existing test regressions | 0 |

---

## Epic 5 retro action item follow-through

| # | Action | Status | Evidence |
|---|---|---|---|
| A1 | Process uniformity — encode constraints in dev-agent-readable files | ⏳ Open | Saved to memory but no `CONVENTIONS.md` created yet. Epic 6 was markdown-only so no coding constraints were exercised. |
| A2 | Decide on `--quiet` flag | ⏳ Open | Not addressed in Epic 6 (no script changes). |
| A3 | Carry forward deferred items | ⏳ Open | Manifest dupes, CRLF, basename collision — all still deferred. |

**Score: 0/3 applied.** Epic 6 was pure UX wrappers — no coding work to exercise the constraints. All 3 remain open for the next initiative.

---

## What went well

### 1. The simple skill wrapper pattern is fast and repeatable

All 4 skills followed the same template: SKILL.md (frontmatter + load directive) + workflow.md (parse → run → present). sp-6-1 took the longest (establishing the pattern). sp-6-2 shipped 2 skills in one story. sp-6-3 and sp-6-4 were batched and done in minutes. The pattern is now proven and can be reused for any future CLI-to-skill wrapper.

### 2. Code review caught a real security issue in sp-6-1

The Blind Hunter flagged shell injection via unsanitized skill names interpolated into Bash commands. The fix (validate `[a-zA-Z0-9-]` only) was applied before the pattern was replicated to sp-6-2/6-3/6-4 — so all 4 skills have input validation from the start.

### 3. Zero script changes across the entire epic

Epic 6 added zero lines of JavaScript. All 4 skills are pure markdown instruction files that tell the LLM to run existing CLI scripts via the Bash tool. This validates the architecture: the engine layer (Epics 1-5) is stable enough to wrap without modification.

### 4. User feedback directly shaped the epic

The user said "I want the user to use slash commands in the chatbox, no CLI." That feedback created Epic 6 within the same session. The entire 4-story epic was conceived, spec'd, implemented, reviewed, and completed in one continuous session. Fast feedback loop.

---

## What didn't go well

### 1. sp-6-3 and sp-6-4 skipped spec review and code review

The last 2 stories were batched and implemented without the full ceremony (spec review → dispatch → code review → triage). This was pragmatic (they're tiny, follow an established pattern) but breaks the cadence that caught real issues in sp-6-1 (input validation) and sp-6-2 (completion notes). If a future skill wrapper has a subtle issue, the batched approach would miss it.

### 2. Module-side copies are manual duplicates with no sync mechanism

Each skill has 2 copies: `.claude/skills/<name>/` (local dev) and `_bmad/bme/_portability/skills/<name>/` (module-side for `convoke-install`). These are manually `cp`'d with no check that they stay in sync. If someone edits the `.claude/skills/` version without updating the module-side copy, `convoke-install` will ship a stale version. This is the same problem artifact governance has with its workflow copies.

### 3. Manifest dependency field is empty for all 4 skills

All 4 skill wrappers have empty `dependencies` columns because the validator treats dependency entries as skill-name references, not file paths. The actual dependencies (`convoke-export.js`, `catalog-generator.js`, etc.) can't be expressed in the current manifest schema. This means the manifest doesn't capture the real dependency graph for these skills — a data-model gap.

---

## Action items (post-initiative)

| # | Action | Owner | When |
|---|---|---|---|
| **A1** | **Process uniformity (carry forward):** Create `CONVENTIONS.md` encoding reusable dev constraints. Still the #1 process-debt item from Epic 5. | Amalik | Next initiative |
| **A2** | Consider a **sync check** for `.claude/skills/` ↔ `_bmad/bme/` copies. Could be a `convoke-doctor` check: "module-side skill copy differs from .claude/skills version." | future story | debt sprint |
| **A3** | **Manifest dependency schema** — consider supporting file-path dependencies alongside skill-name references, so wrapper skills can express their real dependency on CLI scripts. | future story | schema evolution |
| **A4** | Carry forward: `--quiet` flag, manifest dupes, CRLF, basename collision | deferred | as needed |

---

## Initiative final scorecard (all 6 epics)

| Epic | Stories | Tests | Patches | Status |
|---|---|---|---|---|
| Epic 1: Classification & Metadata | 3 | 21 | 15 | done |
| Epic 2: Tier 1 Exporter | 4 | 31 | 28 | done |
| Epic 3: Skill Catalog | 2 | 11 | 5 | done |
| Epic 4: Standalone Repository | 2 | 8 | 10 | done |
| Epic 5: Tier 2 & Adapters | 3 | 15 | 3 | done |
| Epic 6: Slash Command UX | 4 | 0 | 3 | done |
| **Total** | **18** | **86** | **64** | **done** |

**Deliverables:**
- 49 exportable skills (44 standalone + 5 light-deps)
- 3 platform adapters (Claude Code, Copilot, Cursor)
- Decision-tree catalog README
- Seed script + structural validator
- 4 slash-command skills for chatbox UX
- 86 automated tests, zero regressions

**Key lessons (initiative-level, updated):**
1. Process consistency requires encoded constraints, not just retro notes.
2. Spec review is the highest-leverage step — caught issues in 12 of 18 stories.
3. Adversarial code review had 100% signal on HIGH findings across the initiative.
4. Progressive complexity is the right approach — each epic added one layer without reworking prior layers.
5. Stub-then-polish works for iterative artifact development.
6. User feedback in the conversation can create and complete an entire epic in one session.
7. **Slash-command UX is table stakes** — CLI tools without skill wrappers don't match the BMAD interaction model.

---

## The Skill Portability & Distribution Initiative is complete.
