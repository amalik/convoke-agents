---
title: 'I20 — Portfolio markdown formatter renders --show-unattributed'
type: 'feature'
created: '2026-04-20'
status: 'in-review'
baseline_commit: 'ca3395e2'
context:
  - project-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `convoke-portfolio --markdown --show-unattributed` emits a valid markdown initiative table followed by a terminal-style `--- Unattributed Files (N) ---` block printed via raw `console.log` in the CLI orchestrator. The unattributed section is not rendered as markdown and `formatMarkdown()` never sees the unattributed data, so the markdown output is broken for chat/doc consumers — the flag effectively only works in the terminal path.

**Approach:** Extend `formatMarkdown(initiatives, options)` to accept `{ showUnattributed, unattributedFiles }`; when set, append a `## Unattributed Files (N)` section rendered as a markdown table. Gate the CLI's plain-text `--- Unattributed Files ---` block on `!useMarkdown` so the markdown path uses the formatter exclusively and the terminal path is unchanged.

## Boundaries & Constraints

**Always:**
- Preserve existing `formatMarkdown(initiatives)` single-arg callers — default `options = {}` keeps the current signature backwards-compatible for the two existing call sites and any downstream consumers
- Terminal output (non-`--markdown`) is byte-unchanged — pure markdown-path extension
- Unattributed markdown section appears *after* the initiatives table, separated by a blank line, consistent with terminal ordering
- Unit tests for the new markdown output use in-memory fixtures — no `generatePortfolio()` live-repo calls (per `test-fixture-isolation` rule)

**Ask First:**
- Whether to emit the `## Unattributed Files (0)` section with a "none" line when `unattributedFiles.length === 0 && showUnattributed === true`, or suppress the section entirely (terminal path today suppresses — recommend matching for consistency)

**Never:**
- Modify the terminal formatter or `formatTerminal()` signature
- Change the CLI flag parsing (`--show-unattributed` detection stays at the same spot)
- Touch `generatePortfolio()` or any rule/inference code
- Add new CLI-integration tests that shell out against the live repo; keep new tests unit-level on the formatter

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Markdown + flag + files exist | `formatMarkdown(init, { showUnattributed: true, unattributedFiles: [{dir, filename, reason}, ...] })` | Initiatives table, blank line, `## Unattributed Files (N)` heading, markdown table with `Path \| Reason` columns | N/A |
| Markdown + flag + zero unattributed | Same options, empty `unattributedFiles` array | Initiatives table only; no unattributed section (matches terminal path suppression) | N/A |
| Markdown, no flag | `formatMarkdown(init)` (no options) or `{ showUnattributed: false }` | Initiatives table only, unchanged from today | N/A |
| Markdown, flag, no initiatives | Empty initiatives + populated unattributedFiles | `No initiatives found.` then unattributed section | N/A |
| Legacy single-arg call | `formatMarkdown(init)` | Unchanged behavior — table only | N/A |

</frozen-after-approval>

## Code Map

- `scripts/lib/portfolio/formatters/markdown-formatter.js` -- primary edit: add `options` parameter, append unattributed section when requested
- `scripts/lib/portfolio/portfolio-engine.js` -- CLI orchestrator: pass `{ showUnattributed, unattributedFiles }` into `formatMarkdown()` at [line 503-504](scripts/lib/portfolio/portfolio-engine.js#L503-L504); gate the existing `console.log('--- Unattributed Files...')` block at [line 528-540](scripts/lib/portfolio/portfolio-engine.js#L528-L540) on `!useMarkdown`
- `tests/lib/portfolio-engine.test.js` -- extend `describe('formatMarkdown')` block with unit tests for the new option (fixture-based, no live-repo scan)

## Tasks & Acceptance

**Execution:**
- [x] `scripts/lib/portfolio/formatters/markdown-formatter.js` -- Change signature to `formatMarkdown(initiatives, options = {})`. When `options.showUnattributed === true && options.unattributedFiles?.length > 0`, append: a blank line, `## Unattributed Files (N)` heading with actual count, blank line, markdown table with header `| Path | Reason |` + `|------|--------|`, and one row per file as `| ${dir}/${filename} | ${reason} |`. Matches terminal suppression semantics when zero files.
- [x] `scripts/lib/portfolio/portfolio-engine.js` -- In `main()`: pass `{ showUnattributed, unattributedFiles: result.unattributedFiles }` as the second arg to `formatMarkdown()`. Wrap the existing `if (result.unattributedFiles && ...)` terminal-block in an additional `!useMarkdown` guard so the plain-text block only prints in terminal mode. Markdown path must not double-render.
- [x] `tests/lib/portfolio-engine.test.js` -- Add unit tests to the existing `describe('formatMarkdown')` block: (1) `showUnattributed + files → markdown section rendered`, (2) `showUnattributed + empty array → no section`, (3) `no options (legacy call) → backwards-compatible`, (4) `showUnattributed true but option absent → no section`. Use in-memory fixture objects only.

**Acceptance Criteria:**
- Given `convoke-portfolio --markdown --show-unattributed` is run on any project with unattributed files, when stdout is captured, then it contains exactly one `## Unattributed Files (N)` markdown heading, a well-formed table with `Path | Reason` columns, and does NOT contain the plain-text `--- Unattributed Files (` delimiter.
- Given `convoke-portfolio --markdown` is run without the `--show-unattributed` flag, when stdout is captured, then output is unchanged from the pre-I20 behavior (initiatives markdown table + summary lines, no unattributed section, no plain-text unattributed block).
- Given `convoke-portfolio --show-unattributed` is run without `--markdown`, when stdout is captured, then the terminal-path `--- Unattributed Files (N) ---` block is rendered unchanged — byte-identical to pre-I20 output.
- Given any caller invokes `formatMarkdown(initiatives)` with a single argument, when the return value is inspected, then it matches the pre-I20 output exactly (backwards-compat for downstream consumers).

## Design Notes

**Why a markdown table rather than a bullet list.** The initiatives output above it is already a markdown table; matching the shape keeps the overall document coherent for chat/doc consumers. Paths can contain characters that need escaping in bullet lists; a table cell is a saner container.

**Why suppress the section when `unattributedFiles.length === 0`.** The terminal path's guard at [portfolio-engine.js:528](scripts/lib/portfolio/portfolio-engine.js#L528) already only prints the block when files exist. Matching that in markdown keeps behavior symmetric and avoids a vacuous `## Unattributed Files (0)` heading polluting docs.

**Golden output (markdown + flag + 2 files):**
```
| Initiative | Phase | Status | Next Action / Context |
|------------|-------|--------|----------------------|
| gyre | planning | ongoing (inferred) | ... |

## Unattributed Files (2)

| Path | Reason |
|------|--------|
| vortex-artifacts/persona-foo.md | no initiative signal in filename, frontmatter title, content, or parent directory |
| drafts/untitled.md | empty frontmatter and body |
```

## Verification

**Commands:**
- `node scripts/lib/portfolio/portfolio-engine.js --markdown --show-unattributed | head -40` -- expected: initiatives markdown table followed by `## Unattributed Files (N)` markdown section; no `--- Unattributed Files (` delimiter.
- `node scripts/lib/portfolio/portfolio-engine.js --markdown | head -20` -- expected: initiatives markdown table only; no unattributed section.
- `node scripts/lib/portfolio/portfolio-engine.js --show-unattributed | tail -20` -- expected: terminal `--- Unattributed Files (N) ---` block present, byte-identical to pre-I20.
- `node --test tests/lib/portfolio-engine.test.js` -- expected: all tests pass, including the 4 new `formatMarkdown` cases.
