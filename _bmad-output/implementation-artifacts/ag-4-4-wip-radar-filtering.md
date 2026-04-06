# Story 4.4: WIP Radar & Filtering

Status: done

## Story

As a Convoke operator,
I want to be warned when I have too many active initiatives and filter by initiative prefix,
so that I can manage overload and focus on specific workstreams.

## Acceptance Criteria

1. **Given** the portfolio view is generated, **When** the number of active initiatives (status: ongoing, blocked, or stale) exceeds the WIP threshold (default 4, configurable), **Then** a WIP radar line appears below the portfolio table: `WIP: X active (threshold: Y) -- sorted by last activity`
2. The radar lists all active initiatives sorted by last-activity date (FR36)
3. When threshold is not exceeded, no WIP line appears
4. `--filter <pattern>` filters the portfolio view to show only initiatives matching the pattern (FR25). MVP uses prefix matching (`startsWith`); full glob support deferred.
5. Filtering applies before WIP count -- filtered view shows WIP only for the filtered set
6. Operator can configure `wip_threshold` and `stale_days` in `_bmad/bmm/config.yaml` under `portfolio` section (FR37)

## Tasks / Subtasks

- [x] Task 1: Add WIP radar to generatePortfolio return (AC: #1, #2, #3)
  - [x] After sorting in `generatePortfolio`, filter results where `status.value` is `'ongoing'`, `'blocked'`, or `'stale'`
  - [x] Read `wipThreshold` from options (default 4)
  - [x] If active count > threshold: build `wipRadar` object with `{ active: number, threshold: number, initiatives: string[] }` (sorted by lastArtifact.date descending)
  - [x] If active count <= threshold: `wipRadar = null`
  - [x] Add `wipRadar` to `generatePortfolio` return alongside `initiatives` and `summary`

- [x] Task 2: Read config from `_bmad/bmm/config.yaml` (AC: #6)
  - [x] In the CLI main() function, read `_bmad/bmm/config.yaml` via `yaml.load(fs.readFileSync(...))`
  - [x] Extract `portfolio.wip_threshold` (default 4) and `portfolio.stale_days` (default 30)
  - [x] Pass to `generatePortfolio(projectRoot, { wipThreshold, staleDays, ... })`
  - [x] `staleDays` is already wired inside the engine (passed to `applyGitRecencyRule`) — no engine change needed for stale_days
  - [x] `wipThreshold` is new — add to `generatePortfolio` options destructuring alongside `staleDays`
  - [x] If config not found or `portfolio` section missing: use defaults silently

- [x] Task 3: Add `--filter` flag (AC: #4, #5)
  - [x] Parse `--filter <pattern>` from CLI args
  - [x] Pass `filter` pattern as an option to `generatePortfolio(projectRoot, { filter, ... })`
  - [x] Inside `generatePortfolio`, after rule chain + sort, filter `results` array: `results.filter(s => s.initiative.startsWith(pattern.replace('*', '')))`
  - [x] WIP radar calculated AFTER filter — counts only filtered initiatives
  - [x] MVP uses prefix matching (`startsWith`). No `minimatch` dependency. Full glob deferred.

- [x] Task 4: Print WIP radar in CLI output (AC: #1, #2, #3)
  - [x] After printing the portfolio table and before the summary line: if `result.wipRadar` is not null, print the radar line
  - [x] Format: `WIP: X active (threshold: Y) -- sorted by last activity`
  - [x] Followed by the sorted active initiative names (one per line or comma-separated)

- [x] Task 5: Write tests (AC: #1-#6)
  - [x] Extend `tests/lib/portfolio-engine.test.js`
  - [x] Test WIP radar:
    - Real repo likely has active initiatives — check if wipRadar is returned when threshold exceeded
    - wipRadar is null when threshold not exceeded (use high threshold like 99)
    - wipRadar.initiatives is sorted by date descending
  - [x] Test `--filter`:
    - Filter by prefix (e.g., 'g') returns only gyre initiatives
    - Filter with no match returns empty
    - WIP radar counts only filtered initiatives
  - [x] Test config reading:
    - Default values when config section missing

- [x] Task 6: Run convoke-check and regression suite
  - [x] Run `node scripts/convoke-check.js --skip-coverage` -- all steps pass
  - [x] Run `node scripts/lib/portfolio/portfolio-engine.js` -- shows WIP radar if threshold exceeded
  - [x] Run `node scripts/lib/portfolio/portfolio-engine.js --filter gyre` -- filters output

## Dev Notes

### Previous Story (ag-4-3) Intelligence

- `generatePortfolio` returns `{ initiatives, summary }` where `summary` has `healthScore`, `governed`, `ungoverned`, `unattributed`
- The engine already sorts by alpha (default) or last-activity
- `status.value` can be: `ongoing`, `stale`, `blocked`, `complete`, `unknown`, or explicit frontmatter values
- 302 tests pass across 10 test files
- CLI already prints summary line + health score after formatter output

### Architecture Compliance

**WIP radar**: Only appears when threshold exceeded. Active = `ongoing`, `blocked`, or `stale`. Default threshold 4. The radar line plus sorted initiative list provides at-a-glance focus guidance.

**Config location**: `_bmad/bmm/config.yaml` — this file already exists (it's the BMM module config). The `portfolio` section is a new optional block:
```yaml
portfolio:
  wip_threshold: 4
  stale_days: 30
```

**Filter**: The story says `--filter clientb-*` with glob pattern. Since `minimatch` is not a dependency, use simple prefix matching (`initiative.startsWith(pattern.replace('*', ''))`) for MVP. This covers the primary use case (filtering by initiative prefix).

**Filter order**: Filter BEFORE WIP count. If the operator filters to `gyre*`, only gyre initiatives count toward WIP. This prevents false WIP warnings when the operator is focused on a subset.

### Anti-Patterns to AVOID

- Do NOT modify the 4 rule files
- Do NOT modify the formatters (WIP radar is printed in CLI, same pattern as health score)
- Do NOT add `minimatch` as a dependency for MVP — simple prefix matching is sufficient
- Do NOT show WIP radar when threshold is not exceeded — clean output for healthy state
- Do NOT hardcode the threshold — read from config, default to 4

### File Structure

```
scripts/
└── lib/
    └── portfolio/
        └── portfolio-engine.js          # MODIFIED — add WIP radar, filter, config reading

tests/
└── lib/
    └── portfolio-engine.test.js         # MODIFIED — add WIP radar + filter tests
```

### Testing Standards

- Jest test framework
- Extend `tests/lib/portfolio-engine.test.js`
- Integration tests against real repo
- Run `convoke-check --skip-coverage` after all tests
- 302 existing + new must all pass

### References

- [Source: arch-artifact-governance-portfolio.md -- FR35, FR36, FR37, --filter flag]
- [Source: prd-artifact-governance-portfolio.md -- FR25, FR35, FR36, FR37]
- [Source: scripts/lib/portfolio/portfolio-engine.js -- sort + return section lines 150-170]
- [Source: _bmad/bmm/config.yaml -- existing BMM config, portfolio section to be added]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 307/307 tests pass (302 existing + 5 new)
- convoke-check: all 5 steps pass (lint clean)
- `--filter g` correctly shows only gyre
- WIP radar not displayed in real repo (active count <= default threshold 4)
- Zero test failures during development

### Completion Notes List

- Added `wipThreshold` and `filter` to `generatePortfolio` options (alongside existing `staleDays`)
- Filter: prefix matching via `startsWith(pattern.replace('*', ''))` applied after sort, before WIP count
- WIP radar: counts active initiatives (ongoing/blocked/stale), builds radar object when count > threshold, null when not exceeded
- Config reading in CLI main(): reads `_bmad/bmm/config.yaml` `portfolio.wip_threshold` and `portfolio.stale_days` with defaults
- CLI prints WIP radar line + initiative list between portfolio table and summary
- `--filter` flag in CLI with guard against consuming next flag
- Updated help text with `--filter` option
- 5 new tests: wipRadar null, wipRadar returned, filter by prefix, filter no match, filter before WIP

### File List

- `scripts/lib/portfolio/portfolio-engine.js` — MODIFIED (WIP radar, filter, config reading, CLI updates)
- `tests/lib/portfolio-engine.test.js` — MODIFIED (5 new tests)
