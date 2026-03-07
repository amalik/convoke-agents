# Story 2.1: Overhaul README.md

Status: done

## Story

As a new user arriving from npm or GitHub,
I want the README to present Convoke branding with correct install commands and value proposition,
So that my first impression matches the actual product identity.

## Acceptance Criteria

1. **Given** the current README with BMAD ASCII art
   **When** the overhaul is applied
   **Then** the ASCII art banner displays "CONVOKE" in block letters

2. **Given** the current tagline
   **When** the overhaul is applied
   **Then** the tagline reflects the new positioning ("Agent teams for complex systems")

3. **Given** the version badge
   **When** the overhaul is applied
   **Then** the version badge shows 2.0.0 with the new repo URL (`github.com/amalik/convoke`)

4. **Given** the install command
   **When** the overhaul is applied
   **Then** the install command is `npm install convoke && npx convoke-install-vortex`

5. **Given** all CLI examples in the README
   **When** the overhaul is applied
   **Then** all CLI examples use `convoke-*` command names

6. **Given** the cache tip
   **When** the overhaul is applied
   **Then** it references `npx -p convoke@latest convoke-update`

7. **Given** the "How It Fits with BMAD Core" section
   **When** the overhaul is applied
   **Then** it uses "Convoke" for the product name (keeping "BMAD Core" and "BMAD Method" as-is)

8. **Given** the roadmap section
   **When** the overhaul is applied
   **Then** the v2.0.0 entry explains the rename from BMAD-Enhanced to Convoke

9. **Given** the entire README
   **When** scanned
   **Then** zero instances of "bmad-enhanced" or "BMAD-Enhanced" remain (except in "compatible with BMAD Method" style references)

## Tasks / Subtasks

- [x] Task 1: Replace ASCII art banner and tagline (AC: #1, #2)
  - [x] 1.1: Replace the BMAD ASCII art (lines 4-10) with the CONVOKE banner from `scripts/install-vortex-agents.js` (lines 19-24), adapted for `<pre>` block (no ANSI color codes)
  - [x] 1.2: Replace "E N H A N C E D" tagline (line 10) with "Agent teams for complex systems" (line 25 in install-vortex-agents.js)
  - [x] 1.3: Update the bold tagline below the banner (line 13): extended with "7 discovery agents guide you from insight to evidence"

- [x] Task 2: Update badges and intro paragraph (AC: #3, #9)
  - [x] 2.1: Update version badge from `1.7.1` to `2.0.0` and URL from `github.com/amalik/BMAD-Enhanced` to `github.com/amalik/convoke` (line 15)
  - [x] 2.2: Update intro paragraph (line 22): `BMAD-Enhanced guides you through...` -> `Convoke guides you through...`

- [x] Task 3: Update Quick Start install command (AC: #4)
  - [x] 3.1: Update install command (line 68): `npm install bmad-enhanced && npx bmad-install-vortex-agents` -> `npm install convoke && npx convoke-install-vortex`

- [x] Task 4: Update Updating section CLI commands (AC: #5, #6)
  - [x] 4.1: Update CLI commands (lines 127-130): `bmad-version` -> `convoke-version`, `bmad-update` -> `convoke-update`, `bmad-doctor` -> `convoke-doctor`
  - [x] 4.2: Update tip text (line 135): `npx bmad-update` -> `npx convoke-update`
  - [x] 4.3: Update cache tip command (line 137): `npx -p bmad-enhanced@latest bmad-update` -> `npx -p convoke@latest convoke-update`

- [x] Task 5: Update "How It Fits with BMAD Core" section (AC: #7)
  - [x] 5.1: Update product name refs (line 214): `BMAD-Enhanced handles` -> `Convoke handles`
  - [x] 5.2: Update diagram label (line 217): `BMAD-Enhanced (Vortex)` -> `Convoke (Vortex)`
  - [x] 5.3: Update standalone statement (line 227): `BMAD-Enhanced works standalone` -> `Convoke works standalone`
  - [x] 5.4: Verify "BMAD Core" and "BMAD Method" refs are preserved (lines 212, 227, 274) — confirmed intact

- [x] Task 6: Update Roadmap section (AC: #8)
  - [x] 6.1: Updated v2.0.0 roadmap entry explaining the rename with CLI and package details
  - [x] 6.2: Replaced `v2.0.0+` placeholder with specific v2.0.0 entry + "Next" future entry

- [x] Task 7: Grep verification (AC: #9)
  - [x] 7.1: Grep for `bmad-enhanced` — 1 match: L249 roadmap (intentional, describes rename)
  - [x] 7.2: Grep for `BMAD-Enhanced` — 1 match: L249 roadmap (intentional, describes rename)
  - [x] 7.3: Grep for `bmad-install` — zero matches
  - [x] 7.4: Grep for `bmad-update` — zero matches
  - [x] 7.5: Grep for `bmad-version` — zero matches
  - [x] 7.6: Grep for `bmad-doctor` — zero matches
  - [x] 7.7: Preserved refs verified: BMAD Core (3), BMAD Method (2), _bmad/ (15+), bmad-master (1) — all intact

- [x] Task 8: Run docs audit (AC: #9)
  - [x] 8.1: `node scripts/docs-audit.js` — README.md has 1 finding at L249 (intentional roadmap rename description). All other findings are in files scoped for Stories 2.2-2.3.

## Dev Notes

### Critical Context

**Atomic commit rule:** Epic 2 stories should be committed together after all 3 stories (2.1-2.3) are complete, following the same pattern as Epic 1. Alternatively, individual commits are acceptable since docs changes don't break tests.

**ASCII banner source:** The CONVOKE ASCII banner already exists in `scripts/install-vortex-agents.js` (lines 19-24), created in Story 1.3. Reuse the same letter forms but strip ANSI color codes (`\x1b[90m`, `\x1b[0m`) for the markdown `<pre>` block.

**Banner from install-vortex-agents.js:**
```
  ██████╗ ██████╗ ███╗   ██╗██╗   ██╗ ██████╗ ██╗  ██╗███████╗
 ██╔════╝██╔═══██╗████╗  ██║██║   ██║██╔═══██╗██║ ██╔╝██╔════╝
 ██║     ██║   ██║██╔██╗ ██║██║   ██║██║   ██║█████╔╝ █████╗
 ██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══╝
 ╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ╚██████╔╝██║  ██╗███████╗
  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝
       Agent teams for complex systems
```

Note: The banner in `install-vortex-agents.js` uses `${GREY}` prefix and `${RESET}` suffix per line. Strip these for the README `<pre>` block.

### Complete String Replacement Reference

**Product name replacements (7 instances):**

| Line | Old String | New String |
|------|-----------|------------|
| 4-10 | ASCII "BMAD" banner | ASCII "CONVOKE" banner (from install-vortex-agents.js) |
| 10 | `E N H A N C E D` | `Agent teams for complex systems` |
| 15 | `version-1.7.1` + `BMAD-Enhanced` | `version-2.0.0` + `convoke` |
| 22 | `BMAD-Enhanced guides you through` | `Convoke guides you through` |
| 214 | `BMAD-Enhanced handles` | `Convoke handles` |
| 217 | `BMAD-Enhanced (Vortex)` | `Convoke (Vortex)` |
| 227 | `BMAD-Enhanced works standalone` | `Convoke works standalone` |

**CLI command replacements (8 instances):**

| Line | Old Command | New Command |
|------|------------|-------------|
| 68 | `npm install bmad-enhanced && npx bmad-install-vortex-agents` | `npm install convoke && npx convoke-install-vortex` |
| 127 | `npx bmad-version` | `npx convoke-version` |
| 128 | `npx bmad-update --dry-run` | `npx convoke-update --dry-run` |
| 129 | `npx bmad-update` | `npx convoke-update` |
| 130 | `npx bmad-doctor` | `npx convoke-doctor` |
| 135 | `npx bmad-update` | `npx convoke-update` |
| 137 | `npx -p bmad-enhanced@latest bmad-update` | `npx -p convoke@latest convoke-update` |

**Tagline replacement (1 instance):**

| Line | Old String | New String |
|------|-----------|------------|
| 13 | `Validate your product ideas before writing a single line of code` | New tagline — consider: `Agent teams for complex systems — from discovery to delivery` or similar. Must align with install-vortex-agents.js positioning. |

**Roadmap update (1 instance):**

| Line | Old String | New String |
|------|-----------|------------|
| 249 | `v2.0.0+ — Multi-agent collaboration, cross-agent workflows, analytics` | `v2.0.0 — Product rename: BMAD-Enhanced -> Convoke. CLI commands renamed. Package: convoke.` + new future entry |

### Preserved References (DO NOT CHANGE)

| Line | String | Reason to keep |
|------|--------|---------------|
| 212 | `How It Fits with BMAD Core` | Section heading — "BMAD Core" is the framework name |
| 214 | `BMAD Core handles` | Framework reference |
| 227 | `no BMAD Method installation required` | Framework reference |
| 274 | `BMAD Method v6.0.0` | Acknowledgments — framework reference |
| 285 | `BMM — BMAD Method Module` | Agent category — framework reference |
| All `_bmad/` paths | Directory paths | Actual directory name, not product name |
| All agent names | `bmad-master`, etc. | Agent IDs, not product name |

### Design Decision: Tagline

The current tagline "Validate your product ideas before writing a single line of code" is Vortex-specific. The new positioning "Agent teams for complex systems" is broader. Options:

1. Keep the banner subtitle as "Agent teams for complex systems" (matching install script)
2. Use the bold tagline for a Vortex-specific pitch: "Validate your product ideas before writing a single line of code" (could keep this if still accurate)
3. New combined: "Agent teams that validate product ideas before you write a single line of code"

The dev agent should choose what best represents the product at v2.0.0 — the key constraint is consistency with `install-vortex-agents.js` banner (Story 1.3).

### Previous Story Intelligence (from Epic 1)

**From Epic 1 Retrospective:**
- Grep verification after each file is the essential quality gate — mandatory for this story
- NFR4 safe replacement patterns apply: target `bmad-enhanced`, specific CLI names; never bare `bmad`, `_bmad` paths
- "BMAD Enhanced" (space-separated) variant needs per-instance review — may appear in README prose
- The `checkStaleBrandReferences` function in `docs-audit.js` will validate this file — use it as final verification

**From Story 1.3:**
- The CONVOKE ASCII banner was already designed and tested in `scripts/install-vortex-agents.js`
- Tagline: "Agent teams for complex systems"
- Sub-tagline: "Domain-specialized agent teams | compatible with BMAD Method"

**From Story 1.6:**
- `docs-audit.test.js` CLI tests were relaxed to accept exit code 0 or 1 (brand check finds refs in docs not yet renamed)
- After this epic (2.1-2.3), those tests should be restored to strict — tracked as tech debt

### What NOT to change in this story

- Do NOT update other documentation files — that's Story 2.2 and 2.3
- Do NOT change source code files — those were updated in Epic 1
- Do NOT change test files
- Do NOT modify `_bmad/` paths or agent definitions
- Do NOT rename "BMAD Method", "BMAD Core", "BMad Master", or agent IDs

### References

- [Source: _bmad-output/planning-artifacts/epics-phase3.md#Story 2.1, lines 314-334]
- [Source: README.md — 330 lines, 7 product name refs + 8 CLI refs + banner + tagline + roadmap]
- [Source: scripts/install-vortex-agents.js — CONVOKE banner reference, lines 19-27]
- [Source: _bmad-output/implementation-artifacts/p3-epic-1-retro-2026-03-06.md — Epic 1 learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — all tasks completed without errors.

### Completion Notes List

- ASCII banner: Replaced 4-letter "BMAD" with 7-letter "CONVOKE" banner sourced from `install-vortex-agents.js` (lines 19-24), stripped ANSI codes for `<pre>` block. Tagline "E N H A N C E D" replaced with "Agent teams for complex systems".
- Bold tagline: Extended original to include agent context: "Validate your product ideas before writing a single line of code — 7 discovery agents guide you from insight to evidence". Preserves Vortex-specific value prop while adding product identity.
- Version badge: `1.7.1` -> `2.0.0`, repo URL `BMAD-Enhanced` -> `convoke`.
- Intro paragraph: `BMAD-Enhanced` -> `Convoke` (1 replacement).
- Install command: `npm install bmad-enhanced && npx bmad-install-vortex-agents` -> `npm install convoke && npx convoke-install-vortex`.
- Updating section: 4 CLI commands updated (version, update, update --dry-run, doctor). Tip text and cache tip updated (2 more refs).
- "How It Fits with BMAD Core" section: 3 product name refs updated. "BMAD Core" and "BMAD Method" refs preserved (framework names).
- Roadmap: v2.0.0+ placeholder replaced with specific v2.0.0 rename entry + "Next" future entry.
- Grep verification: Zero stale CLI refs. 1 intentional `BMAD-Enhanced` ref in roadmap (describes the rename). All preserved refs (BMAD Core, BMAD Method, _bmad/, agent IDs) intact.
- Docs audit: README.md has 1 finding at L249 (intentional). Other findings are in files scoped for Stories 2.2-2.3.

### File List

- `README.md` (banner replacement, 7 product name updates, 7 CLI ref updates, tagline, roadmap)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status updated)
- `_bmad-output/implementation-artifacts/p3-2-1-overhaul-readme.md` (story file updated)

## Code Review Record

### Review Date
2026-03-06

### Reviewer
Claude Opus 4.6 (adversarial code review)

### Verdict: PASS

### Findings Summary
- 0 HIGH, 1 MEDIUM (fixed), 4 LOW

### Findings

1. **MEDIUM (FIXED): Permanent docs-audit false positive** — Roadmap L249 used `BMAD-Enhanced` which triggers `stale-brand-reference` finding permanently. Reworded to "Product renamed to Convoke" — zero findings now.

2. **LOW: Bold tagline mixed messaging** — L13 leads with old Vortex-specific pitch, appends new agent language. Dev notes gave creative latitude. Acceptable.

3. **LOW: Banner trailing space discrepancy** — README lines 6-7 missing trailing spaces from install-vortex-agents.js source. Invisible in rendered HTML.

4. **LOW: Diagram header 1-char shift** — `Convoke (Vortex)` shorter than original, padding adjusted. BMAD Core label shifted 1 char right. Renders acceptably.

5. **LOW: AC #9 exception clause wording** — Exception says "compatible with BMAD Method style references" but L249 was a roadmap rename description. Moot after M1 fix — zero instances remain.

### AC Verification
All 9 ACs verified. Zero `bmad-enhanced`/`BMAD-Enhanced` instances remain. All CLI refs updated. Banner, badges, install command, cache tip, BMAD Core section, roadmap — all correct. Preserved refs (BMAD Core, BMAD Method, _bmad/, agent IDs) intact.
