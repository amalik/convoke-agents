# Story 2.2: Fix Vortex 7-Stream Diagram Layout

Status: ready-for-dev

## Story

As a **developer reading the README**,
I want the Vortex 7-stream diagram to render with clean box alignment and arrow flow,
so that I can understand the agent loop at a glance.

## Acceptance Criteria

1. All 7 agent boxes have equal width
2. Horizontal arrows (`──▶`, `◀──`) align with box midpoints
3. Vertical arrows and the feedback loop path render without visual breaks
4. The two rows (4 top, 3 bottom) are visually balanced with consistent spacing
5. The "Start at Emma · back to any stream" label is centered beneath
6. The diagram renders correctly in GitHub markdown preview (inside a fenced code block)
7. The diagram renders correctly when viewed with `cat README.md` in an 80-column terminal

## Tasks / Subtasks

- [ ] Task 1: Analyze current diagram alignment issues (AC: #1, #2, #3, #4)
  - [ ] 1.1: In `README.md`, locate the Vortex diagram inside the fenced code block (``` ... ```) between the Vortex description paragraph and the "Suggested flow" note
  - [ ] 1.2: Measure box widths — verify all 7 boxes have equal character width (currently `┌─────────────┐` = 15 chars wide each)
  - [ ] 1.3: Check horizontal arrow alignment — verify `──▶` and `◀──` connect at box midpoints
  - [ ] 1.4: Check vertical arrow path — verify `▲`, `│`, `▼` characters align vertically
  - [ ] 1.5: Check the feedback loop arrow from Wade (top-right) to Noah (bottom-right) renders cleanly
  - [ ] 1.6: Check bottom connector line (`└─────────────────┴─────────────────┘`) spans correctly under the 3 bottom boxes
- [ ] Task 2: Fix any alignment issues found (AC: #1, #2, #3, #4)
  - [ ] 2.1: Fix box widths if inconsistent
  - [ ] 2.2: Fix arrow alignment if off-center
  - [ ] 2.3: Fix vertical path if broken
  - [ ] 2.4: Ensure spacing between boxes is consistent (currently 3 spaces between boxes)
- [ ] Task 3: Verify row balance (AC: #4, #5)
  - [ ] 3.1: Verify 4-box top row and 3-box bottom row are visually balanced
  - [ ] 3.2: Verify "▶ Start at Emma · back to any stream" label is centered beneath the diagram
- [ ] Task 4: Visual verification (AC: #6, #7)
  - [ ] 4.1: Verify rendering on GitHub by pushing and checking the rendered preview
  - [ ] 4.2: Verify rendering with `cat README.md` in terminal (80-column width)

## Dev Notes

- This is a pure README.md text edit — no code changes, no tests needed
- The change affects exactly one file: `README.md`
- The diagram is inside a fenced code block (```) — spaces and characters render exactly as typed
- Do NOT reference line numbers — other stories in this epic also modify README.md. Use content anchors instead.
- Box-drawing characters (┌, ─, ┐, │, └, ┘, ▶, ◀, ▲, ▼) each occupy 1 column in monospace fonts
- Emoji characters (🔍, 🔬, 💡, 🧪, 🎯, 🧭, 📡) may render as 2 columns wide in some terminals — this is a known limitation and acceptable

### Current State (verified 2026-03-08)

The diagram inside the fenced code block:

```
                         7 Streams · 7 Agents

  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │   Isla 🔍    │──▶│   Mila 🔬    │──▶│   Liam 💡    │──▶│   Wade 🧪    │
  │  Empathize  │   │ Synthesize  │   │ Hypothesize │   │ Externalize │
  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
         ▲                                                       │
         │                                                       │
         │                                                       ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
  │   Emma 🎯    │◀──│   Max  🧭    │◀──│   Noah 📡    │◀──────────┘
  │Contextualize│   │ Systematize │   │  Sensitize  │
  └─────────────┘   └─────────────┘   └─────────────┘
         │                 │                 │
         └─────────────────┴─────────────────┘
          ▶ Start at Emma · back to any stream
```

**Known potential issues to verify:**
- Box widths appear consistent (15 chars each) — confirm
- Emoji width rendering varies by platform (emoji may take 1 or 2 columns) — this affects the visual balance inside boxes
- The label text inside boxes has varying lengths ("Empathize" vs "Contextualize" vs "Hypothesize") — verify padding is correct
- The bottom connector line spans 3 boxes — verify it aligns with box centers

### Previous Story Intelligence (Story 1.1)

Story 1.1 modified README.md (Vortex paragraph section). Key learnings:
- Use content anchors, not line numbers
- Verify on GitHub after pushing — don't mark verification complete before actually doing it

### Project Structure Notes

- Single file change: `README.md` (root level)
- Story 2.1 modifies the banner section (top of file) — no conflict with diagram section
- Story 2.3 adds content below the diagram — position-dependent, but no content overlap

### References

- [Source: _bmad-output/planning-artifacts/epics-top5.md — Story 2.2]
- [Source: _bmad-output/planning-artifacts/initiatives-backlog.md — Initiative D7 (score 8.1)]
- [Source: README.md — fenced code block between Vortex description and "Suggested flow" note]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
