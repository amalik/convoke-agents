# Story 1.1: Add Problem-Framing Sentence Above Vortex Diagram

Status: done

## Story

As a **developer evaluating Convoke**,
I want a clear problem-framing sentence immediately above the Vortex diagram,
so that I understand the pain Vortex solves before seeing the agent map.

## Acceptance Criteria

1. A problem-framing sentence appears directly above the 7-stream diagram code block in README.md
2. The sentence communicates the core problem (teams skipping validation / building on assumptions)
3. The existing problem-framing sentence is extracted from the paragraph and presented as a standalone bold line immediately before the diagram code block

## Tasks / Subtasks

- [x] Task 1: Extract and reposition the problem-framing sentence (AC: #1, #2, #3)
  - [x] 1.1: In `README.md`, locate the paragraph that starts with "Most teams skip validation and build on assumptions. Vortex guides you through..." (currently between the workflow badges and the diagram code block)
  - [x] 1.2: Extract the first sentence ("Most teams skip validation and build on assumptions.") from that paragraph
  - [x] 1.3: Add it as a standalone bold line immediately before the diagram code block: `**Most teams skip validation and build on assumptions.**`
  - [x] 1.4: The remaining paragraph should start with "Vortex guides you through..." and still read naturally
  - [x] 1.5: Ensure blank lines above and below the bold line for proper markdown rendering
  - [x] 1.6: Verify the bold line renders correctly on GitHub (push or use local preview)

## Dev Notes

- This is a pure README.md text restructuring — no code changes, no tests needed
- The change affects exactly one file: `README.md`
- The goal is visual hierarchy: the bold standalone line creates a "hook" that draws the eye before the diagram
- Do NOT reference line numbers — other stories in this epic also modify README.md and may shift lines. Use content anchors instead.

### Current State

The Vortex section currently has this structure (abbreviated):

    ## Vortex — Product Discovery Team
    ...badges...

    Most teams skip validation and build on assumptions. Vortex guides you through seven discovery streams...

    ```
                             7 Streams · 7 Agents
    ...diagram...
    ```

### Target State

    ## Vortex — Product Discovery Team
    ...badges...

    **Most teams skip validation and build on assumptions.**

    Vortex guides you through seven discovery streams...

    ```
                             7 Streams · 7 Agents
    ...diagram...
    ```

The bold line sits between the badges and the explanatory paragraph, immediately above the diagram block.

### Project Structure Notes

- Single file change: `README.md` (root level)
- No alignment with other modules or paths needed
- No conflicts detected
- Stories 2.1 and 2.2 also modify README.md but different sections (banner and diagram internals) — no merge conflict risk

### References

- [Source: _bmad-output/planning-artifacts/epics-top5.md — Story 1.1]
- [Source: _bmad-output/planning-artifacts/initiatives-backlog.md — Initiative D5 (score 8.1)]
- [Source: README.md — paragraph between workflow badges and diagram code block]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Extracted "Most teams skip validation and build on assumptions." from the Vortex description paragraph
- Placed it as a standalone bold line (`**...**`) between the workflow badges and the remaining paragraph
- Remaining paragraph flows naturally starting with "Vortex guides you through..."
- Proper blank line spacing confirmed above and below the bold line
- No tests needed — pure text restructuring, no code changes

### File List

- `README.md` (modified — extracted bold problem-framing sentence above Vortex paragraph)
