# Story 6.3: Portfolio Attribution Improvements

Status: ready-for-dev

## Story

As a Convoke operator,
I want the portfolio to attribute more files and explain what it can't resolve,
So that I get complete visibility instead of 71% of files being silently dropped.

## Acceptance Criteria

1. **Given** the portfolio engine processes a file that lacks frontmatter and where `inferArtifactType()` + `inferInitiative()` cannot determine an initiative **When** content-based fallback runs **Then** the engine attempts (in priority order): (a) frontmatter `title` field keyword scan, (b) first 5 lines of content keyword scan, (c) parent directory name as initiative hint — and if any signal yields a known initiative ID or alias, the file is attributed with `degradedMode: true` and a new field `attributionSource: 'content-fallback' | 'frontmatter-title' | 'parent-dir'`.

2. **Given** the current Convoke repository (154 artifacts, baseline 111 unattributed as of 2026-04-06) **When** the portfolio runs after these changes **Then** the unattributed count drops to **under 20** (under 13%).

3. **Given** files remain unattributed after content-based fallback **When** the portfolio output renders **Then** the summary includes a new `Unattributed Files` section listing each file with a one-line reason: `{filename}: {reason}` (e.g., `architecture.md: no initiative signal in filename, content, or parent directory`).

4. **Given** the operator wants to inspect the unattributed list without scrolling **When** the portfolio runs with a new `--show-unattributed` flag **Then** the section is displayed; without the flag, only a summary line is shown: `{N} unattributed files (run with --show-unattributed to see details)`.

5. **Given** an initiative has artifacts in the registry but `applyArtifactChainRule()` returns `phase: unknown` **When** the conflict resolver runs **Then** `state.phase.evidence` is populated with a list describing what was found (e.g., `["3 artifacts found", "no PRD/brief", "no architecture", "no HC chain", "no epic"]`) so the operator can see WHY phase is unknown, not just that it is.

6. **Given** an initiative has unknown phase but artifacts exist **When** `formatTerminal()` and `formatMarkdown()` render the row **Then** the Next Action column shows: `Unknown phase: {first 2 evidence items}` instead of the generic `Create PRD or brief to start planning`.

7. **Given** an initiative has zero artifacts in the registry AND zero unattributed files match it **When** `deriveNextAction()` runs **Then** the existing message `Create PRD or brief to start planning` is preserved (this is the only correct case for the generic message).

8. **Given** the portfolio detects ungoverned files attributable to existing initiatives **When** the summary renders **Then** a new line appears below the governance health score: `{N} files attributable to existing initiatives but ungoverned — run convoke-migrate-artifacts to govern them` (only when N > 0).

9. **Given** the engine changes are complete **When** the existing test suite runs **Then** all existing portfolio tests pass without modification, except tests that explicitly assert the legacy unattributed-silent behavior or the generic "Create PRD or brief" message for non-empty initiatives — those need intentional updates with rationale.

10. **Given** the engine changes are complete **When** new tests run **Then** they cover: (a) frontmatter title keyword resolution, (b) first-5-lines content scan, (c) parent directory fallback, (d) priority ordering (title > content > parent), (e) unattributed reason generation, (f) phase-unknown evidence collection, (g) context-aware next action when artifacts exist but phase is unknown, (h) preservation of generic message when initiative has zero artifacts, (i) the "ungoverned but attributable" suggestion line.

## Tasks / Subtasks

- [ ] **Task 1: Add `attributeFile()` content-fallback to portfolio-engine.js** (AC: #1, #2)
  - [ ] 1.1 Open [scripts/lib/portfolio/portfolio-engine.js](scripts/lib/portfolio/portfolio-engine.js) and locate the file processing loop in `generatePortfolio()` (around line 80, the `for (const file of mdFiles)` loop).
  - [ ] 1.2 Just before the `unattributed++; continue;` line (around line 110), insert a call to a new helper `attributeFile(file, content, frontmatter, taxonomy, dirName)`.
  - [ ] 1.3 Define the helper at module scope. Signature: `function attributeFile(file, content, frontmatter, taxonomy, dirName)`. Returns `{ initiative: string|null, source: 'frontmatter-title' | 'content-fallback' | 'parent-dir' | null }`.
  - [ ] 1.4 **Step 1 — Frontmatter title scan** (highest priority):
    - If `frontmatter && frontmatter.title`, lowercase it and scan for any initiative ID or alias as a whole word (`\b{id}\b`)
    - Resolve aliases via `taxonomy.aliases`
    - Return `{ initiative, source: 'frontmatter-title' }` on first match (longest first)
  - [ ] 1.5 **Step 2 — First-5-lines content scan**:
    - Take `content.split('\n').slice(0, 5).join(' ').toLowerCase()`
    - Same whole-word scan as Step 1
    - Return `{ initiative, source: 'content-fallback' }` on first match
  - [ ] 1.6 **Step 3 — Parent directory scan**:
    - Lowercase `dirName` (e.g., `gyre-artifacts`)
    - Check if any initiative ID or alias matches as a whole word in the dirName
    - For `gyre-artifacts` → matches `gyre`. For `vortex-artifacts` → matches `vortex` (note: `vortex` IS in taxonomy as a platform initiative). For `planning-artifacts` → no initiative match (planning is not an initiative).
    - Return `{ initiative, source: 'parent-dir' }` on match
  - [ ] 1.7 If all three steps yield nothing, return `{ initiative: null, source: null }`.
  - [ ] 1.8 In the calling loop, if `attributeFile()` returns a non-null initiative:
    - Set `initiative`, `artifactType` (use a synthetic value `'unknown'` if `typeResult.type` was null), `isGoverned = false`, `ungoverned++`
    - Set the enriched object's `degradedMode: true` and `attributionSource: result.source`
    - Push to registry
    - Continue (don't fall through to unattributed)
  - [ ] 1.9 If still null after fallback, push to a new `unattributedFiles` array (replacing the bare `unattributed++` counter) with `{ filename: file.filename, dir: file.dir, reason: explainUnattributed(file, content, frontmatter) }`.

- [ ] **Task 2: Track and surface unattributed reasons** (AC: #3, #4)
  - [ ] 2.1 Add a helper `explainUnattributed(file, content, frontmatter)` that returns a one-line reason string. Logic:
    - If file is empty or unreadable → `"unreadable or empty"`
    - If filename has no recognizable type prefix → `"no type prefix in filename"`
    - If content is too short to scan (< 5 lines) → `"insufficient content for inference"`
    - Otherwise → `"no initiative signal in filename, frontmatter title, content, or parent directory"`
  - [ ] 2.2 In `generatePortfolio()` return value, add `unattributedFiles` (the array) alongside `summary.unattributed` (the count). Keep both for backward compatibility.
  - [ ] 2.3 In `main()` (the CLI handler), add `--show-unattributed` flag parsing.
  - [ ] 2.4 After the existing summary lines, if `result.unattributedFiles.length > 0`:
    - Always print: `\n{N} unattributed files (run with --show-unattributed to see details)`
    - If `useShowUnattributed` is true, also print each: `  {filename}: {reason}`

- [ ] **Task 3: Add phase-unknown evidence to artifact-chain-rule.js** (AC: #5, #6)
  - [ ] 3.1 Open [scripts/lib/portfolio/rules/artifact-chain-rule.js](scripts/lib/portfolio/rules/artifact-chain-rule.js).
  - [ ] 3.2 Locate the path where `state.phase` would remain unset (after all checks return no match). Build an `evidence` array describing what was checked:
    - `"{N} artifacts found"` (always first)
    - For each missing artifact category, append: `"no {category}"` (e.g., `"no PRD/brief"`, `"no architecture"`, `"no HC chain"`, `"no epic"`)
  - [ ] 3.3 Attach the evidence to `state.phase.evidence = [...]` BEFORE returning. Do not change `state.phase.value` — leave it null so `conflict-resolver` still sets `unknown`.
  - [ ] 3.4 Also attach evidence when artifacts exist but only HC1 is present (incomplete discovery): `["1 HC artifact found", "incomplete HC chain (needs HC2-HC6)"]`

- [ ] **Task 4: Update conflict-resolver to use evidence in nextAction** (AC: #6, #7)
  - [ ] 4.1 Open [scripts/lib/portfolio/rules/conflict-resolver.js](scripts/lib/portfolio/rules/conflict-resolver.js).
  - [ ] 4.2 In `applyConflictResolver()`, before calling `deriveNextAction()`, check if `state.phase.value === 'unknown'` AND `state.phase.evidence?.length > 0` AND `artifacts.length > 0`.
  - [ ] 4.3 If yes, override the default nextAction:
    - `state.nextAction = { value: \`Unknown phase: ${state.phase.evidence.slice(0, 2).join(', ')}\`, source: 'conflict-resolver' }`
  - [ ] 4.4 If `artifacts.length === 0`, leave the default `Create PRD or brief to start planning` (this is the only legitimate use of the generic message).
  - [ ] 4.5 Verify `deriveNextAction()` itself is unchanged — the override happens in the caller.

- [ ] **Task 5: Surface "ungoverned but attributable" guidance** (AC: #8)
  - [ ] 5.1 In [scripts/lib/portfolio/portfolio-engine.js](scripts/lib/portfolio/portfolio-engine.js) `generatePortfolio()`, after the file processing loop, count files where `degradedMode === true` AND the `attributionSource` is one of the new fallback sources (`content-fallback`, `frontmatter-title`, `parent-dir`).
  - [ ] 5.2 Add `attributableButUngoverned` to the `summary` object.
  - [ ] 5.3 In `main()` after the governance health line, if `attributableButUngoverned > 0`, print: `${attributableButUngoverned} files attributable to existing initiatives but ungoverned — run convoke-migrate-artifacts to govern them`.

- [ ] **Task 6: Verify unattributed rate reduction** (AC: #2)
  - [ ] 6.1 Run `node scripts/lib/portfolio/portfolio-engine.js` from the project root.
  - [ ] 6.2 Confirm the `Unattributed: {N}` count is **under 20** (down from baseline 111).
  - [ ] 6.3 Run `node scripts/lib/portfolio/portfolio-engine.js --show-unattributed` and confirm the detailed list appears with reasons.
  - [ ] 6.4 Confirm unknown-phase initiatives now show context-aware next actions (not the generic "Create PRD or brief").
  - [ ] 6.5 If the count is still ≥20, debug the fallback logic — don't lower the threshold.

- [ ] **Task 7: Write unit tests** (AC: #9, #10)
  - [ ] 7.1 Create or extend [tests/lib/portfolio-engine.test.js](tests/lib/portfolio-engine.test.js) with new tests for `attributeFile()`:
    - **Test A:** Frontmatter title with initiative — `{title: 'Gyre Validation Report'}` → resolves to `gyre` with source `frontmatter-title`
    - **Test B:** Content-fallback first 5 lines — `# Forge Discovery Report\n\nDate: 2026-...` → resolves to `forge` with source `content-fallback`
    - **Test C:** Parent dir match — file in `gyre-artifacts/` with no other signals → resolves to `gyre` with source `parent-dir`
    - **Test D:** Priority — file in `vortex-artifacts/` with frontmatter title `# Helm Strategy` → resolves to `helm` (frontmatter beats parent-dir)
    - **Test E:** Alias resolution — content `Strategy Perimeter` → resolves to `helm`
    - **Test F:** No signal — file with no title, no content keywords, in `planning-artifacts/` → returns `{initiative: null}`
  - [ ] 7.2 Add tests for `explainUnattributed()`:
    - **Test G:** Empty file → `"unreadable or empty"`
    - **Test H:** No type prefix → `"no type prefix in filename"`
    - **Test I:** Short content → `"insufficient content for inference"`
    - **Test J:** Default → `"no initiative signal in filename, frontmatter title, content, or parent directory"`
  - [ ] 7.3 Create or extend [tests/lib/portfolio-rules.test.js](tests/lib/portfolio-rules.test.js) with tests for evidence collection:
    - **Test K:** Initiative with 3 artifacts but no PRD/arch/HC/epic → `state.phase.evidence` contains `["3 artifacts found", "no PRD/brief", ...]`
    - **Test L:** Initiative with only HC1 → evidence contains `"incomplete HC chain (needs HC2-HC6)"`
    - **Test M:** Initiative with zero artifacts → `nextAction` remains `"Create PRD or brief to start planning"`
    - **Test N:** Initiative with artifacts but unknown phase → `nextAction` is `"Unknown phase: {evidence}"`, not the generic message
  - [ ] 7.4 Add CLI flag test for `--show-unattributed`:
    - **Test O:** Without flag → output contains summary line, NOT individual filenames
    - **Test P:** With flag → output contains both summary and per-file lines
  - [ ] 7.5 Add summary line test:
    - **Test Q:** When `attributableButUngoverned > 0` → output contains `run convoke-migrate-artifacts to govern them`
  - [ ] 7.6 Run the full test suite. Confirm zero regressions.

## Dev Notes

### Context

Story 6.3 addresses the second pain discovered during the actual portfolio run on this repository (2026-04-06): **154 total artifacts, 111 unattributed (71%)**. The portfolio engine silently drops files it can't attribute, then complains it has nothing to show. The root issue is the same as Story 6.2 — the inference engine is too cautious and there's no fallback when the filename doesn't tell the whole story.

Many of those 111 files have clear initiative signals in their content or frontmatter that the engine never reads. A file titled `# Gyre Validation Report` is obviously gyre, but if its filename is `validation-report.md`, the engine skips it. This story adds a content-fallback pass that catches these cases.

Additionally, when phase inference returns `unknown`, the operator gets no explanation. They see `unknown / Create PRD or brief to start planning` and think the engine failed — but actually there ARE artifacts, the engine just can't classify them. This story makes the unknown verdict explainable.

### Critical Architectural Constraints

**Constraint 1: Fallback files are degraded-mode, not governed.** Files attributed via content-fallback MUST have `degradedMode: true` and `isGoverned: false`. They count as `ungoverned` in the summary. This preserves the meaning of "governed" — frontmatter-driven, validated metadata.

**Constraint 2: The four inference rules stay intact.** Don't modify `applyFrontmatterRule`, the existing logic in `applyArtifactChainRule` (only ADD evidence collection), `applyGitRecencyRule`, or the priority cascade in `applyConflictResolver`. Evidence collection is additive — don't change phase resolution logic.

**Constraint 3: Performance.** NFR1 says portfolio scan must complete in under 5 seconds for 200 artifacts. Adding content-fallback reads the first 5 lines of each previously-unattributed file. This is bounded — most files were already being read for frontmatter parsing, so the marginal cost is negligible. Don't introduce per-file disk reads beyond what's already happening.

**Constraint 4: No `process.cwd()`.** Pass `projectRoot` explicitly per architecture rules.

**Constraint 5: NFR6 — no false-confident inference.** Content-fallback uses `degradedMode: true` to signal lower confidence. The portfolio output already has explicit/inferred markers — degraded files appear with `(inferred)` like other ungoverned files. Don't claim higher confidence than the engine has.

### Why Frontmatter Title > Content > Parent Dir

- **Frontmatter title** is the most authoritative — operators write titles deliberately
- **Content** (first 5 lines) is reliable for headers and intros, less reliable for body text — capping at 5 lines bounds risk
- **Parent dir** is the weakest signal — it tells you the file is in a category, not which initiative owns it (e.g., `vortex-artifacts/` could be any initiative). But it's better than `null` for files like `gyre-artifacts/some-file.md` where the parent IS an initiative.

### Files to Touch

| File | Action | Purpose |
|------|--------|---------|
| [scripts/lib/portfolio/portfolio-engine.js](scripts/lib/portfolio/portfolio-engine.js) | Edit | Add `attributeFile()`, `explainUnattributed()`, `unattributedFiles` array, `--show-unattributed` flag, `attributableButUngoverned` count, summary line |
| [scripts/lib/portfolio/rules/artifact-chain-rule.js](scripts/lib/portfolio/rules/artifact-chain-rule.js) | Edit | Add evidence collection for unknown phase paths |
| [scripts/lib/portfolio/rules/conflict-resolver.js](scripts/lib/portfolio/rules/conflict-resolver.js) | Edit | Override nextAction when phase is unknown and artifacts exist |
| [tests/lib/portfolio-engine.test.js](tests/lib/portfolio-engine.test.js) | Edit | Add tests A–J, O–Q |
| [tests/lib/portfolio-rules.test.js](tests/lib/portfolio-rules.test.js) | Edit | Add tests K–N |

**Do NOT modify:**
- `inferInitiative()` or `inferArtifactType()` in `artifact-utils.js` (Story 6.2 owns those)
- `applyFrontmatterRule`, `applyGitRecencyRule` — left intact
- The core phase priority cascade in `conflict-resolver.js`
- Format file structures (the existing terminal/markdown output stays compatible)

### Architecture Compliance

- ✅ No hardcoded version strings
- ✅ No `process.cwd()` — `projectRoot` is already passed explicitly
- ✅ Append-only — adding new functions and fields, not refactoring existing
- ✅ NFR1 preserved — content-fallback piggybacks on existing reads
- ✅ NFR6 preserved — `degradedMode: true` on all fallback attributions
- ✅ NFR18 preserved — 100% test coverage on new helper functions

### Previous Story Intelligence

Story 6.2 (Migration Inference Improvements) is in flight in parallel. It touches `artifact-utils.js`. **There is no file overlap with this story** — Story 6.3 only touches portfolio files. The two can be implemented in parallel without conflict.

Pattern reuse opportunity: Story 6.2's `suggestInitiative()` logic is conceptually similar to this story's `attributeFile()`. They could potentially share a content-keyword scanner. **Recommended:** keep them separate for now (different concerns, different file modules), but if a developer notices the duplication, extract a shared helper to `artifact-utils.js` as a final cleanup step. Don't over-engineer the first pass.

### Current Repository State (for Task 6 verification)

As of 2026-04-06, running `node scripts/lib/portfolio/portfolio-engine.js` produces:
```
Total: 154 artifacts | Governed: 0 | Ungoverned: 43 | Unattributed: 111
Governance: 0/43 artifacts governed (0%)
```

The 111 unattributed files come from various sources — many are in `_bmad-output/` subdirectories that don't match the standard pattern (e.g., `brainstorming/`, `design-artifacts/`, `journey-examples/`, `project-documentation/`, `test-artifacts/`, `drafts/`). **Important:** these directories are already in `EXCLUDE_DIRS` at the top of `portfolio-engine.js`. So the 111 unattributed are from the directories that ARE scanned.

Examples of unattributed files that should resolve via content-fallback:
- `architecture.md` → could resolve to `convoke` via content keyword (if the file mentions Convoke)
- `vortex-validation-report.md` → resolves to `vortex` via filename ALREADY (this should already work; if not, it's a Story 6.2 bug)
- Files in `vortex-artifacts/` like personas → resolve via content keywords or parent-dir fallback

Expected post-fix counts:
- ~80–90 files resolved via fallback layers
- Remaining truly unattributed: ~15–20 files

### Risk Notes

1. **The 111 baseline is high** — getting under 20 may require iteration. If after Task 1 the count is, say, 35, the dev should add diagnostics (temporarily log which files fall through and why) and analyze the patterns before declaring failure.

2. **Test fixture creation** — Many tests need synthetic files with specific frontmatter and content. Use temp directories per test, never modify the real repo.

3. **Evidence message localization** — The new "no PRD/brief" style messages are user-facing. If the project has document language settings, those are NOT applied here (the rest of the portfolio output is also English-only). Don't introduce i18n for this story — flag it as a future concern if relevant.

4. **The phase-unknown override might surprise users** — Some users may have grown used to seeing "Create PRD or brief" everywhere. The new message is more accurate but different. Flag in the completion notes that this is a deliberate UX change.

### Testing Standards

- Use Node's built-in test runner (`node --test`)
- Existing test files use describe/test pattern — match it
- Use temp directories for fixture files
- Mock git calls if any test paths involve git (this story should NOT touch git directly)
- Coverage expectation: 100% on `attributeFile()`, `explainUnattributed()`, and the new evidence/override branches (NFR18)

### References

- [scripts/lib/portfolio/portfolio-engine.js](scripts/lib/portfolio/portfolio-engine.js) — Main file to extend
- [scripts/lib/portfolio/rules/artifact-chain-rule.js](scripts/lib/portfolio/rules/artifact-chain-rule.js) — Add evidence collection
- [scripts/lib/portfolio/rules/conflict-resolver.js](scripts/lib/portfolio/rules/conflict-resolver.js) — Override nextAction logic
- [tests/lib/portfolio-engine.test.js](tests/lib/portfolio-engine.test.js) — Test file to extend
- [tests/lib/portfolio-rules.test.js](tests/lib/portfolio-rules.test.js) — Test file to extend
- [_bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md](_bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md) — Architecture reference (NFR1, NFR6, NFR18)
- [_bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md](_bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md) — Parent epic
- Story 6.5 (`ag-6-5-portfolio-skill-wrapper`) depends on this story — it consumes the new `unattributedFiles` array and `attributableButUngoverned` summary in the conversation flow

## Dev Agent Record

### Agent Model Used

(to be filled in by dev agent)

### Debug Log References

### Completion Notes List

### File List
