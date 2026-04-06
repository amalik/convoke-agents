# Story 4.5: Output Formats & CLI Wrapper

Status: ready-for-dev

## Story

As a Convoke operator,
I want portfolio output in both terminal and markdown formats with a verbose mode for debugging,
so that I can use it from CLI daily and embed it in documents from chat.

## Acceptance Criteria

1. **Given** the portfolio engine has produced InitiativeState data, **When** the operator runs `convoke-portfolio` from CLI, **Then** terminal format is default with alignment
2. `--markdown` produces a standard markdown table with the same columns
3. Both formats include the WIP radar (if triggered) and governance health score below the table
4. `--verbose` appends an inference trace per initiative showing source and confidence for every field
5. The BMAD skill wrapper at `.claude/skills/bmad-portfolio-status/workflow.md` invokes `convoke-portfolio --markdown` and presents the output
6. Default is `--terminal` from CLI, `--markdown` from chat/skill context (FR27)

## Tasks / Subtasks

- [ ] Task 1: Implement `--verbose` flag and inference trace (AC: #4)
  - [ ] Add `--verbose` to CLI help text
  - [ ] Parse `--verbose` flag in main()
  - [ ] Pass `verbose` option to `generatePortfolio`
  - [ ] In `generatePortfolio`: when verbose, collect trace data per initiative (phase source/confidence, status source/confidence, lastArtifact, nextAction source)
  - [ ] Add `traces` array to return: `[{ initiative, phase: { value, source, confidence }, status: { value, source, confidence } }]`
  - [ ] After printing the portfolio table in CLI, if verbose: print inference trace per initiative
  - [ ] Trace format: `  [initiative] phase: value (source, confidence) | status: value (source, confidence)`

- [ ] Task 2: Create BMAD skill wrapper (AC: #5, #6)
  - [ ] Create directory `.claude/skills/bmad-portfolio-status/`
  - [ ] Create `.claude/skills/bmad-portfolio-status/workflow.md` as a thin wrapper
  - [ ] Workflow invokes `convoke-portfolio --markdown` and presents the output
  - [ ] FR27: skill context defaults to markdown (not terminal)

- [ ] Task 3: Verify AC #1-#3 already satisfied (AC: #1, #2, #3)
  - [ ] Terminal formatter with alignment: already built (ag-4-2)
  - [ ] Markdown formatter: already built (ag-4-2)
  - [ ] WIP radar + health score in output: already built (ag-4-3, ag-4-4)
  - [ ] No code changes needed — just verify existing behavior

- [ ] Task 4: Write tests (AC: #4)
  - [ ] Extend `tests/lib/portfolio-engine.test.js`
  - [ ] Test verbose mode returns traces in result
  - [ ] Test verbose trace contains source and confidence per field
  - [ ] Test non-verbose mode has no traces (or empty)

- [ ] Task 5: Run convoke-check and regression suite
  - [ ] Run `node scripts/convoke-check.js --skip-coverage` -- all steps pass
  - [ ] Run `node scripts/lib/portfolio/portfolio-engine.js --verbose` -- shows inference traces
  - [ ] Run `node scripts/lib/portfolio/portfolio-engine.js --markdown` -- markdown output

## Dev Notes

### Previous Stories Intelligence

- Terminal and markdown formatters already built (ag-4-2) with `(explicit)` / `(inferred)` markers
- WIP radar (ag-4-4) and governance health score (ag-4-3) already print in CLI
- Config reading (ag-4-4) already reads `stale_days` and `wip_threshold`
- `--verbose` was removed from help in ag-4-2 code review (was dead feature). Now implementing for real.
- 307 tests pass across 10 test files

### Architecture Compliance

**`--verbose` trace**: Shows source + confidence for each field of each initiative. The data is already in the `InitiativeState` objects — phase.source, phase.confidence, status.source, status.confidence. Verbose just needs to FORMAT this existing data, not compute anything new.

**BMAD skill wrapper**: A thin `workflow.md` that tells the agent to run `convoke-portfolio --markdown`. The skill framework handles invocation — the wrapper just says what command to run. FR27: skill/chat context defaults to `--markdown`.

**Box-drawing characters**: The architecture spec shows box-drawing as an example, but this is aspirational UX polish, not a hard requirement. The current `padEnd()` alignment is functional and clean. Box-drawing can be a future enhancement. Terminal colors similarly deferred.

**FR27 (CLI vs chat default)**: When invoked via the BMAD skill, `--markdown` is hardcoded in the workflow. When invoked from CLI directly, `--terminal` is default. This satisfies FR27 without needing runtime context detection.

### Verbose Trace Format

```
--- Inference Trace ---
  [bmm] phase: unknown (artifact-chain, inferred) | status: unknown (conflict-resolver, inferred)
  [convoke] phase: unknown (artifact-chain, inferred) | status: ongoing (git-recency, inferred)
  [enhance] phase: planning (artifact-chain, inferred) | status: ongoing (git-recency, inferred)
  [forge] phase: discovery (artifact-chain, inferred) | status: DECIDED (frontmatter, explicit)
```

The data for this is already in every `InitiativeState` — just needs formatting.

### Anti-Patterns to AVOID

- Do NOT add box-drawing characters or colors — defer to future UX polish story
- Do NOT modify the 4 inference rules — trace data comes from existing InitiativeState fields
- Do NOT add runtime CLI-vs-chat detection — FR27 is satisfied by hardcoding `--markdown` in the skill wrapper
- Do NOT modify formatters for verbose — trace is printed separately in CLI after formatter output

### File Structure

```
scripts/
└── lib/
    └── portfolio/
        └── portfolio-engine.js          # MODIFIED — add --verbose parsing + trace output

.claude/
└── skills/
    └── bmad-portfolio-status/           # NEW directory
        └── workflow.md                  # NEW — thin wrapper invoking convoke-portfolio --markdown

tests/
└── lib/
    └── portfolio-engine.test.js         # MODIFIED — add verbose tests
```

### References

- [Source: arch-artifact-governance-portfolio.md -- --verbose, FR27, skill wrapper]
- [Source: prd-artifact-governance-portfolio.md -- FR22, FR23, FR27]
- [Source: scripts/lib/portfolio/portfolio-engine.js -- current CLI, formatters]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
