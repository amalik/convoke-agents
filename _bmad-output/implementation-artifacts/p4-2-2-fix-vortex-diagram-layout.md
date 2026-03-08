# Story 2.2: Fix Vortex 7-Stream Diagram Layout

Status: done

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

- [x] Task 1: Analyze current diagram alignment issues (AC: #1, #2, #3, #4)
  - [x] 1.1: In `README.md`, locate the Vortex diagram inside the fenced code block (``` ... ```) between the Vortex description paragraph and the "Suggested flow" note
  - [x] 1.2: Measure box widths — verified all 7 boxes are 15 chars wide each
  - [x] 1.3: Check horizontal arrow alignment — verified `──▶` at positions 19,37,55 and `◀──` at 17,35,53 (consistent 18-char spacing)
  - [x] 1.4: Check vertical arrow path — found 1-char misalignment: right-side pipe at position 64 on bottom row vs position 65 on lines above
  - [x] 1.5: Check the feedback loop arrow — ┘ at position 64 misaligned with vertical pipe at position 65
  - [x] 1.6: Check bottom connector line — └ at 9 (Emma center), ┴ at 27 (Max center), ┘ at 45 (Noah center) — all correct
- [x] Task 2: Fix alignment issues found (AC: #1, #2, #3, #4)
  - [x] 2.1: Box widths verified consistent (15 chars each) — no fix needed
  - [x] 2.2: Horizontal arrows verified aligned — no fix needed
  - [x] 2.3: Fixed vertical path: added 1 space on bottom-row box line and 1 dash on feedback arrow to align pipe at position 65
  - [x] 2.4: Box spacing verified consistent (3 spaces between boxes) — no fix needed
- [x] Task 3: Verify row balance (AC: #4, #5)
  - [x] 3.1: Verified 4-box top row and 3-box bottom row are visually balanced
  - [x] 3.2: Verified label centered — label center at position 28 vs bottom row center at 27.5
- [x] Task 4: Visual verification (AC: #6, #7)
  - [x] 4.1: Verify rendering on GitHub by pushing and checking the rendered preview
  - [x] 4.2: Verified rendering with `cat README.md` in terminal

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

**Note:** Preliminary measurement shows the diagram is internally consistent (all boxes 15 chars, uniform spacing). After verification, the outcome may be "no changes needed" — that is a valid result. Document the verification in the completion notes either way.

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

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- **Task 1 (Analysis):** Comprehensive measurement of all diagram elements. Found 1 real issue: right-side feedback loop pipe was at char position 64 on bottom row lines but position 65 on lines above (1-char misalignment). All other elements verified correct: 7 boxes at 15 chars each, horizontal arrows at consistent 18-char intervals, bottom connector at correct box centers (9, 27, 45), label properly centered.
- **Task 2 (Fix):** Added 1 space before the │ on the bottom-row box line and 1 additional ─ in the feedback arrow `◀───────────┘` (11 dashes, was 10) to align the right-side vertical path at position 65 across all lines.
- **Task 3 (Row balance):** Top row (4 boxes) and bottom row (3 boxes + feedback pipe) visually balanced. Label "▶ Start at Emma · back to any stream" centered at position 28 vs bottom row center 27.5.
- **Task 4 (Visual verification):** Terminal rendering verified with `cat`. GitHub rendering verified after push. Emoji width variance is a known acceptable limitation per dev notes.
- No tests needed — pure README.md text edit

### File List

- `README.md` (modified — fixed 1-char right-side pipe misalignment on bottom row of Vortex diagram)
