---
title: 'I20 — Portfolio markdown formatter renders --show-unattributed'
type: 'feature'
created: '2026-04-20'
status: 'done'
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

## Spec Change Log

### 2026-04-20 — Round 1 patch findings (no loopback)

Three patches applied after parallel review (Blind Hunter / Edge Case Hunter / Acceptance Auditor). No `intent_gap`, no `bad_spec` — all findings trivially fixable within the implementation.

1. **Markdown table injection via `|` and newlines in filesystem-derived strings** (HIGH — Blind Hunter + Edge Case Hunter). Added a private `escCell()` helper (`|` → `\|`, CR/LF → space) and applied it to both the new unattributed-row and the pre-existing initiative-row for consistency. Prevents: row corruption when `reason` or `filename` contains a pipe or embedded newline. *Note: applying `escCell()` to the pre-existing initiative row is a beneficial behavior change for pathological inputs — initiative names or next-action strings containing a literal `|` now render as `\|` where pre-I20 they would have silently corrupted the row. No known callers rely on the pre-I20 corruption.*
2. **`options = null` destructure crash** (LOW — Edge Case Hunter). Replaced `options = {}` default parameter with `const { ... } = options || {};`. Explicit `null` now resolves correctly instead of throwing on destructure.
3. **AC2 hint-line suppression side-effect** (MEDIUM — Acceptance Auditor E1). Restored the `"N unattributed files (run with --show-unattributed to see details)"` hint line for the `--markdown` path (pre-I20 behavior). The details block remains terminal-only; the hint line works in both paths because it's equally useful for markdown consumers.

**Test coverage added:** pipe+newline escaping case, `options = null` defensive case. Total 56/56 tests pass.

**KEEP instructions (must survive any future re-derivation):**
- `formatMarkdown(initiatives)` single-arg call stays backwards-compatible
- `formatTerminal()` output stays byte-identical
- `formatMarkdown()` unit tests stay fixture-based (no `generatePortfolio()` live-repo calls) per `test-fixture-isolation` rule
- `escCell()` stays module-private (not exported)

**Deferred findings** (logged in `deferred-work.md`): markdown path emits plain-text summary/WIP/verbose blocks (pre-existing structural); unattributed section ordering differs between markdown vs terminal paths (cosmetic, resolved by the same structural fix); no CLI-integration test for the markdown path (spec prohibited adding one; fixture-isolation follow-up would also address pre-existing Tests O/P/Q live-repo dependency).

### 2026-04-20 — Round 2 patch findings (bmad-code-review; no loopback, terminal round)

Round 2 ran via `/bmad-code-review` against commit `92d4506b`. Three parallel reviewers: 5 patch, 2 defer, 5 dismiss. All 5 patches applied.

1. **Trailing backslash in `escCell` escapes cell boundary** — MEDIUM per Blind Hunter + Edge Case Hunter. `escCell` replaced `|` → `\|` but left pre-existing `\` unescaped; a value ending in `\` produced `\|` at the template's cell separator, neutralizing the escape. Fixed by prepending `.replace(/\\/g, '\\\\')` to `escCell` so backslashes are doubled before pipe-escaping.
2. **Lone CR passes through** — MEDIUM per Edge Case Hunter. Regex `/\r?\n/` matched LF + CRLF but not solo CR from legacy-Mac / mangled-encoding files. Fixed to `/[\r\n]+/g`.
3. **Initiative-row `escCell` retrofit had no test lock-in** — MEDIUM per Edge Case Hunter. Round 1's consistency retrofit could silently revert. Added dedicated test asserting `| a\|b |` rendering when initiative name or nextAction contains `|`.
4. **Pipe-escape test missed `|` in `u.dir` and empty-string fields** — LOW per Edge Case Hunter. Extended the risky-fixture test to cover `|` in `dir` and added a separate empty-string case plus a lone-CR case.
5. **Pre-I20 initiative-row behavior change under-documented** — LOW/MEDIUM per Acceptance Auditor. Appended a note to the Round 1 Change Log entry acknowledging that escCell on the initiative row silently changes output for pathological inputs; no known callers rely on the pre-I20 corruption.

**Test coverage added:** backslash-doubling assertion, lone-CR collapse, empty-field rendering, initiative-row escape lock-in.

**KEEP instructions retained:** all Round 1 KEEP items still hold post-Round 2.

**Convergence:** Round 2 introduced no structural changes (no new files, no renamed functions, no altered control flow — just 1-line regex extension + 4 test additions + Change Log prose). Per `code-review-convergence` rule, **no Round 3.** Remaining deferred items (2) triaged to backlog.

### Review Findings

**Round 2 (2026-04-20) — via `bmad-code-review`**

Per `code-review-convergence` rule: Round 1 (inside quick-dev step-04) produced a HIGH markdown-injection finding → triggered this Round 2. Three parallel reviewers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) ran against commit `92d4506b`.

Triage: 5 patch, 2 defer, 5 dismiss.

- [x] [Review][Patch] Trailing backslash still escapes cell boundary — fixed by doubling `\` before pipe-escape in `escCell`. [`markdown-formatter.js:9`](../../scripts/lib/portfolio/formatters/markdown-formatter.js#L9)
- [x] [Review][Patch] Lone CR (no LF) passes through unreplaced — regex widened to `/[\r\n]+/g`. [`markdown-formatter.js:9`](../../scripts/lib/portfolio/formatters/markdown-formatter.js#L9)
- [x] [Review][Patch] No test pins `escCell` on the initiative row — added dedicated test for `|` in initiative + nextAction. [`tests/lib/portfolio-engine.test.js`](../../tests/lib/portfolio-engine.test.js)
- [x] [Review][Patch] Pipe-escape test misses `|` in `u.dir` and empty-string fields — extended fixture + added empty-field + lone-CR tests. [`tests/lib/portfolio-engine.test.js`](../../tests/lib/portfolio-engine.test.js)
- [x] [Review][Patch] Spec Change Log should acknowledge pre-I20 initiative-row behavior change — appended note to Round 1 Change Log entry. [`spec-i20-portfolio-markdown-unattributed.md`](spec-i20-portfolio-markdown-unattributed.md)
- [x] [Review][Defer] `--sort <invalid>` silently falls to alpha — pre-existing at `portfolio-engine.js:468-470`. CLI UX debt, unchanged by I20.
- [x] [Review][Defer] `--filter` without value silently ignores the flag — pre-existing at `portfolio-engine.js:471-474`. CLI UX debt, unchanged by I20.

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

## Suggested Review Order

**New capability — markdown formatter renders the unattributed section**

- Entry point: new signature accepts `options` with `showUnattributed` + `unattributedFiles`.
  [`markdown-formatter.js:21`](../../scripts/lib/portfolio/formatters/markdown-formatter.js#L21)

- The appended `## Unattributed Files (N)` section with `Path | Reason` table — gated on flag + non-empty array.
  [`markdown-formatter.js:47`](../../scripts/lib/portfolio/formatters/markdown-formatter.js#L47)

- Shared `escCell()` helper prevents `|`/newline from corrupting table rows; applied to both the new unattributed row and the pre-existing initiative row.
  [`markdown-formatter.js:8`](../../scripts/lib/portfolio/formatters/markdown-formatter.js#L8)

- CLI orchestrator threads `{showUnattributed, unattributedFiles}` into the formatter.
  [`portfolio-engine.js:503`](../../scripts/lib/portfolio/portfolio-engine.js#L503)

**CLI-side guards — what the markdown path suppresses vs preserves**

- Terminal-only detail block (`--- Unattributed Files (N) ---`) now nested under `!useMarkdown`; the hint line stays emitted in both paths.
  [`portfolio-engine.js:533`](../../scripts/lib/portfolio/portfolio-engine.js#L533)

**Test coverage (fixture-based, no live-repo scan)**

- Five I/O-matrix cases covering the new signature — legacy call, empty initiatives, flag-off, empty array, populated.
  [`portfolio-engine.test.js:272`](../../tests/lib/portfolio-engine.test.js#L272)

- Defensive cases added after Round 1 review: pipe+newline escaping and `options = null` fallback.
  [`portfolio-engine.test.js:304`](../../tests/lib/portfolio-engine.test.js#L304)

