# Story 2.1: Fix CONVOKE ASCII Art Banner Alignment

Status: ready-for-dev

## Story

As a **visitor to the Convoke GitHub page or npm listing**,
I want the CONVOKE ASCII art banner to render with consistent alignment,
so that the project looks polished and professional at first glance.

## Acceptance Criteria

1. All 6 lines of the banner have consistent leading spaces
2. The block characters align vertically in monospace rendering (each column lines up across all rows)
3. The tagline "Agent teams for complex systems" is centered beneath the banner
4. The banner renders correctly in GitHub markdown preview (inside `<pre>` tags within `<div align="center">`)
5. The banner renders correctly when viewed with `cat README.md` in an 80-column terminal

## Tasks / Subtasks

- [ ] Task 1: Analyze current banner alignment issues (AC: #1, #2)
  - [ ] 1.1: In `README.md`, locate the banner inside the `<pre>...</pre>` block (within `<div align="center">`)
  - [ ] 1.2: Count leading spaces per line — currently inconsistent (2 spaces on lines 1 and 6, 1 space on lines 2-5)
  - [ ] 1.3: Check if any columns are misaligned across the 6 rows by verifying character positions match vertically
- [ ] Task 2: Fix leading space consistency (AC: #1)
  - [ ] 2.1: Normalize all 6 banner lines to the same number of leading spaces
  - [ ] 2.2: Ensure the left edge of the letterforms aligns vertically after normalization
- [ ] Task 3: Verify column alignment (AC: #2)
  - [ ] 3.1: Check that each letter (C-O-N-V-O-K-E) occupies consistent column widths across all 6 rows
  - [ ] 3.2: Fix any columns where block characters don't line up vertically
- [ ] Task 4: Center tagline (AC: #3)
  - [ ] 4.1: Verify "Agent teams for complex systems" is visually centered beneath the banner block
  - [ ] 4.2: Adjust leading spaces on the tagline if needed
- [ ] Task 5: Visual verification (AC: #4, #5)
  - [ ] 5.1: Verify rendering on GitHub by pushing and checking the rendered preview
  - [ ] 5.2: Verify rendering with `cat README.md` in terminal (80-column width)

## Dev Notes

- This is a pure README.md text edit — no code changes, no tests needed
- The change affects exactly one file: `README.md`
- The banner is inside `<div align="center"><pre>...</pre></div>` — the `<pre>` tag preserves whitespace, and `align="center"` centers the block on GitHub
- Do NOT reference line numbers — other stories in this epic also modify README.md and may shift lines. Use content anchors instead.
- Unicode box-drawing characters (█, ╗, ║, ╔, ═, ╚, ╝) each occupy 1 column in monospace fonts — alignment depends on correct space counts between them

### Current State (verified 2026-03-08)

The banner inside `<pre>` tags:

```
  ██████╗ ██████╗ ███╗   ██╗██╗   ██╗ ██████╗ ██╗  ██╗███████╗
 ██╔════╝██╔═══██╗████╗  ██║██║   ██║██╔═══██╗██║ ██╔╝██╔════╝
 ██║     ██║   ██║██╔██╗ ██║██║   ██║██║   ██║█████╔╝ █████╗
 ██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══╝
 ╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ╚██████╔╝██║  ██╗███████╗
  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝
       Agent teams for complex systems
```

**Known issues:**
- Lines 1 and 6 have 2 leading spaces; lines 2-5 have 1 leading space
- Tagline has 7 leading spaces — verify this centers correctly under the banner

### Previous Story Intelligence (Story 1.1)

Story 1.1 also modified README.md (different section — Vortex paragraph). Key learnings:
- Use content anchors, not line numbers
- Verify on GitHub after pushing — don't mark verification complete before actually doing it
- The `<pre>` block is at the very top of README.md, well above the Vortex section (no merge conflict risk)

### Project Structure Notes

- Single file change: `README.md` (root level)
- Stories 2.2 also modifies README.md (diagram section, lines 33-50 area) — no conflict with banner section (lines 1-11 area)
- Story 2.3 adds content below the diagram — no conflict

### References

- [Source: _bmad-output/planning-artifacts/epics-top5.md — Story 2.1]
- [Source: _bmad-output/planning-artifacts/initiatives-backlog.md — Initiative D7 (score 8.1)]
- [Source: README.md — `<pre>` block within `<div align="center">`]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
