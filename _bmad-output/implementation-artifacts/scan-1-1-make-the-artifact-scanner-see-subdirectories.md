---
baseline_commit: 98c8503c10cd04f59e214af6d56dc441129c8b19
---

# Story 1.1: Make the artifact scanner see subdirectories

Status: done

<!-- baseline_commit deliberately ABSENT — it is `dev-story`'s field, stamped at implementation start. -->

> **Incident-driven mini-epic**, following the `lint-epic-1` / `cov-epic-1` / `i97-bug-epic-1` /
> `ci-hygiene-epic-1` precedent: a single story under `scan-epic-1`, authored directly rather than
> derived from a planning epic. Source is backlog row **BUG-21** (§2.2, filed 2026-09-01).

## Story

As a **Convoke maintainer**,
I want the artifact scanner to find files in subdirectories,
so that **the governance instruments stop reporting numbers that improve when documents disappear**.

### What this story is, in one line

`scanArtifactDirs` never descends, so the 15 ADRs under `planning-artifacts/adr/**` and the 14-file
sharded PRD are invisible to all three governance instruments — **make it recursive, and record the
before/after figures rather than flipping it silently.**

---

## The defect, measured

`scripts/lib/artifact-utils.js:101-106` does one `readdir` and drops every entry that fails
`stat.isFile()`. It never recurses.

```js
const files = (await fs.readdir(fullDir)).sort();
for (const filename of files) {
  if (filename.startsWith('.')) continue;
  const fullPath = path.join(fullDir, filename);
  const stat = await fs.stat(fullPath);
  if (!stat.isFile()) continue;        // <-- a subdirectory dies here
  results.push({ filename, dir, fullPath });
}
```

**Executed 2026-09-01** against the live tree (not inferred):

```
total files scanner sees: 371
  planning-artifacts:      111      (141 on disk)
  implementation-artifacts: 228
  vortex-artifacts:         32
ADR files seen: 1
  -> [ 'adr-artifact-governance-convention-2026-04-10.md' ]
```

**16 ADRs exist. The scanner sees 1.** The 15 it misses include `adr/p60/adr-002-status-axis.md`
and `adr/p60/adr-003-object-ontology.md` — both signed 2026-08-31, both ruling on the governance
coverage metric that cannot see them.

**Why it went undetected since P60 OQ-0 foldered them:** hiding ungoverned files removes them from
the denominator, so coverage went **up**. A blindness that flatters the metric has no failure signal.

### Reproduce it before you touch anything

```bash
node -e "
const {scanArtifactDirs}=require('./scripts/lib/artifact-utils.js');
(async()=>{
  const f=await scanArtifactDirs(process.cwd(), ['planning-artifacts'], ['_archive']);
  console.log('scanner:', f.length, '| on disk:', require('child_process')
    .execSync('find _bmad-output/planning-artifacts -name \"*.md\" | wc -l').toString().trim());
  console.log('adr files:', f.filter(x=>x.filename.startsWith('adr-')).length);
})();"
```

Prints `scanner: 111 | on disk: 141` and `adr files: 1`. After the fix it must print 141 and 16.
Do not paste these numbers into an assertion — `derive-counts-from-source`; they are a manual
sanity check, and the corpus grows.

---

## Acceptance Criteria

**AC1 — Red first: the defect is proven before it is fixed**

**Given** a fixture tree containing `planning-artifacts/top.md` and `planning-artifacts/adr/p60/adr-003-nested.md`
**When** `scanArtifactDirs(fixtureRoot, ['planning-artifacts'])` runs against the **unfixed** scanner
**Then** the test fails, returning 1 file rather than 2
**And** the failure is recorded in the Dev Agent Record before any production line changes.

> A test written after the fix cannot show the fix was needed. `verification-must-be-falsifiable`.

**AC2 — The scanner descends, at unbounded depth**

**Given** the fixed `scanArtifactDirs`
**When** it scans a directory containing files nested two or more levels deep
**Then** every regular file is returned regardless of depth
**And** dot-prefixed entries are still skipped **at every level**, not only at the top
**And** `excludeDirs` still excludes by top-level include-dir name, unchanged.

**AC3 — The returned record keeps its existing contract and gains one field**

**Given** four production call sites depend on the shape `{ filename, dir, fullPath }`
**When** the scanner returns a nested file
**Then** `dir` is still the **top-level include directory** (`'planning-artifacts'`), never a nested path
**And** a new field `relPath` carries the path relative to that include dir
(`'adr/p60/adr-003-object-ontology.md'`; for a top-level file it equals `filename`)
**And** `filename` remains the basename only.

> **This is the load-bearing design decision. Do not change `dir`.** `portfolio-engine.js:191`
> keys `PORTFOLIO_FOLDER_DEFAULT_MAP` off `fileInfo.dir`, and `archive.js:106-113` both groups by
> `f.dir` and rebuilds a filesystem path with `path.join(outputDir, dir)`. A nested `dir` value
> silently changes attribution in one and writes to the wrong place in the other.

**AC4 — `archive.js` cannot archive a nested file as a superseded duplicate**

**Given** `archive.js:104` scans for dated duplicates and **moves** the older ones
**And** `groupByKey` groups solely on `baseName`, with no notion of directory depth
**When** the scanner starts returning nested files
**Then** grouping is constrained so that only files sharing the **same immediate parent directory**
can supersede one another
**And** a test proves that `planning-artifacts/x-2026-01-01.md` and
`planning-artifacts/adr/x-2026-02-01.md` are **not** grouped.

> Measured 2026-09-01: **no file in any `planning-artifacts` subdirectory is currently dated**, so
> this hazard is latent, not live. Guard it anyway — this is a destructive operation and
> `path-safety-for-destructive-ops` applies. Do not rely on the measurement staying true.

**AC5 — The before/after diff is produced and recorded**

**Given** this change alters every figure the three instruments emit
**When** the fix is complete
**Then** a dated comparison is written to `_bmad-output/implementation-artifacts/` recording, for
**before** (HEAD~) and **after**:

| Figure | Source |
|---|---|
| files scanned per include dir | `scanArtifactDirs` |
| governed / ungoverned / coverage % | `portfolio-engine.js` summary |
| unattributed count and reasons | `explainUnattributed` |
| archive candidates (`--dry-run`, no `--apply`) | `scripts/archive.js` |
| migrate scope file count | `migrate-artifacts` default include dirs |

**And** every number is generated by running the code, never hand-counted (`derive-counts-from-source`)
**And** the diff explicitly states whether coverage rose or fell, and by how much.

> The point of the diff is that historical figures become non-comparable at this commit. Record the
> discontinuity so a future reader knows which side of it a number came from.

**AC6 — Existing consumers still pass, and `updateLinks`' widened blast radius is stated**

**Given** `updateLinks` (`artifact-utils.js:1498`) rewrites links across everything the scanner returns
**When** the scanner widens
**Then** `updateLinks` now also rewrites links inside ADRs and sharded-PRD parts
**And** the Dev Agent Record states this explicitly as an intended consequence, or the story is
re-scoped rather than the behaviour shipped unremarked
**And** the full suite passes (1955 tests at authoring time — derive the current number, do not assert 1955).

**AC7 — T109 is discharged or explicitly left open**

**Given** T109 records that ADR-003 §Context.4 reports 140 files for `planning-artifacts` where the
engine sees 111
**When** the scanner is fixed and the engine agrees with the recursive figure
**Then** either append the method note to `adr/p60/adr-003-object-ontology.md` and close T109,
**or** state in the Dev Agent Record why it is being left open.

---

## Tasks / Subtasks

- [x] **Task 1 — Prove it red (AC1)**
  - [x] Add a nested fixture to the existing `scanArtifactDirs` describe block in
        `tests/lib/artifact-utils.test.js:274` — extend the `before()` hook, do **not** build a
        second fixture tree
  - [x] Run it against unfixed code, capture the failure output into the Dev Agent Record
- [x] **Task 2 — Make the scanner recursive (AC2, AC3)**
  - [x] Rewrite the loop in `scripts/lib/artifact-utils.js:91-113` to walk depth-first
  - [x] Add `relPath`; leave `filename`, `dir`, `fullPath` semantics untouched
  - [x] Update the JSDoc `@returns` at `:88` to declare the new field
  - [x] Skip dot-entries at every level
- [x] **Task 3 — Guard the destructive consumer (AC4)**
  - [x] Constrain `groupByKey` / its caller in `scripts/archive.js:28-37, 104-113` to same-parent grouping
  - [x] Add the non-grouping test
  - [x] Re-read `archive.js`'s `--apply` path and confirm no other place assumes flatness
- [x] **Task 4 — Before/after diff (AC5)**
  - [x] Capture BEFORE figures at `HEAD~` (stash or worktree — do not hand-transcribe)
  - [x] Capture AFTER figures
  - [x] Write `scan-1-1-instrument-figures-before-after-2026-09-01.md`
- [x] **Task 5 — Consumers and suite (AC6)**
  - [x] Read all four call sites before deciding nothing else changes:
        `archive.js:104`, `artifact-utils.js:1202`, `artifact-utils.js:1498`, `portfolio-engine.js:267`
  - [x] `npm run lint` clean, then full suite green
- [x] **Task 6 — T109 (AC7)**
- [x] **Task 7 — Close BUG-21** per §*Closing a Row*: flip status, delete from §2.2, append receipt
      to §2.5, add a Change Log entry. Run `node scripts/audit/backlog-integrity.js` — it must PASS.

---

## Dev Notes

### The four call sites — read all of them before changing the scanner

| Site | Uses | Risk when the scanner widens |
|---|---|---|
| `portfolio-engine.js:267` | governance coverage, attribution | `fileInfo.dir` drives `PORTFOLIO_FOLDER_DEFAULT_MAP` (`:191`) and the `parent-dir` attribution step (`:107`). **Keep `dir` top-level.** |
| `archive.js:104` | dated-duplicate supersession, **moves files** | `filesByDir[f.dir]` then `path.join(outputDir, dir)` (`:106,113`). Destructive. See AC4. |
| `artifact-utils.js:1202` | migrate manifest + `detectCollisions` | More files in scope → more potential rename-target collisions. Expected; confirm the collision report still reads correctly. |
| `artifact-utils.js:1498` | `updateLinks` rename rewriting | Blast radius widens to ADRs and PRD shards. See AC6. |

### What is NOT in scope

- **No files move, and nothing is renamed.** This story changes what the scanner *sees*, not where
  anything lives. The `open`/`closed`/`reference` reorganisation is **P60 OQ-4**, unruled, and gated
  behind **T84** (`refs:audit` baseline-diff) because the corpus already carries 673 broken references.
- **No backfill.** ADR-003 D5 stands: the 174 ungoverned `implementation-artifacts` files are not a debt.
- **No `taxonomy.yaml` class field.** That is ADR-003 **D2** and a separate story.
- **No change to `EXCLUDE_DIRS`.** ADR-003 leaves its survival open.

### Testing standards

- `test-fixture-isolation` — extend the existing `mkdtemp` fixture at
  `tests/lib/artifact-utils.test.js:285`. Never scan `PACKAGE_ROOT`. Note the comment already in
  that block: a repo-root fixture was removed for exactly this reason.
- `fixture-determinism` — the fixture must guarantee any count asserted. Do not assert against the
  live corpus; those numbers move.
- `derive-counts-from-source` — the before/after diff generates its numbers by running code.

### Review discipline

`code-review-convergence` applies. Round 1 is mandatory; any HIGH triggers Round 2, and **"the HIGH
is fixed" is not a reason to skip it** — that exact reasoning shipped 132 unreviewed lines in
`7b957dbf` and Rounds 2–3 then found 4 more HIGHs. There is no CI backstop for this (T77): the only
thing enforcing it is doing it.

### Commit

Per `commit-preparation`: scanner + its test in one atomic commit; the archive guard + its test in a
second; the before/after diff third; the BUG-21 close fourth. Hand Amalik the prepared plan.

### Project Structure Notes

- `scripts/lib/artifact-utils.js` — UPDATE (the scanner, `:91-113`; JSDoc `:88`)
- `scripts/archive.js` — UPDATE (grouping guard, `:28-37`, `:104-113`)
- `tests/lib/artifact-utils.test.js` — UPDATE (extend the existing describe block, `:274-312`)
- `_bmad-output/implementation-artifacts/scan-1-1-instrument-figures-before-after-2026-09-01.md` — NEW
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — UPDATE (close BUG-21)
- `_bmad-output/planning-artifacts/adr/p60/adr-003-object-ontology.md` — UPDATE if AC7 is discharged

No new files under `scripts/`. **No new dependency** — this is a rewrite of one loop using `fs-extra`,
already imported.

### References

- [Source: `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` §2.2 — BUG-21]
- [Source: `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` §2.3 — T109]
- [Source: `_bmad-output/planning-artifacts/adr/p60/adr-003-object-ontology.md` §Decision D2, D5, §Alternatives C]
- [Source: `_bmad-output/planning-artifacts/adr/p60/adr-002-status-axis.md` — no-backfill ruling]
- [Source: `project-context.md` — `test-fixture-isolation`, `fixture-determinism`, `derive-counts-from-source`, `path-safety-for-destructive-ops`, `verification-must-be-falsifiable`, `code-review-convergence`, `commit-preparation`]
- [Source: `scripts/lib/artifact-utils.js:91-113`, `:1202`, `:1498`]
- [Source: `scripts/lib/portfolio/portfolio-engine.js:191`, `:267`]
- [Source: `scripts/archive.js:20-37`, `:104-113`]

---

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m]

### Debug Log References

**RED, captured before any production line changed (AC1).** `node --test --test-name-pattern "scanArtifactDirs"`
against unfixed code — 3 of 4 new assertions failed:

```
✖ scans specified directories            actual: undefined, expected: 'test-file.md'   (relPath absent)
✖ descends into subdirectories at unbounded depth
      AssertionError: a file two levels deep must be returned
✖ returns every non-dotted file in the tree and nothing else
      actual:   [ 'test-file.md' ]
      expected: [ 'adr-003-nested.md', 'test-file.md' ]
```

**AC4's guard mutation-proven.** The same-parent key was reverted to `f.baseName` and the suite re-run:

```
with guard REMOVED:
  ✖ does not group same-named dated files across directories
  ✔ still supersedes within a single directory
  ✔ moves nothing in dry-run
```

One test red, the other green — the guard is load-bearing and did not disable supersession
altogether, which is the failure mode a naive fix produces. Guard restored.

**Final:** `npm run lint` clean (`--max-warnings 0`). `npm test` → 1958 tests, **1957 pass, 0 fail**,
1 skipped (pre-existing).

### Completion Notes List

**The fix.** `scanArtifactDirs` walks depth-first, sorted at each level so the returned order stays
deterministic. `dir` is unchanged — the top-level include directory — and a new `relPath` carries
location. Dot-prefixed entries are skipped at *every* level; pre-fix that check only ever ran
against top-level names because the walk never went deeper.

**Why `dir` was not changed, and it was the right call.** Both hazards named in the story turned out
to be real in the code, and one was worse than the story described: `archive.js` did not merely
group by `dir`, it **rebuilt the source path** as `path.join(fullDir, filename)` and ignored
`fullPath` entirely. For a nested dated file that names a path which does not exist — or, worse, a
different file that happens to share the basename. Fixed in both the supersession and the rename
branches; `fullDir` became unused and was removed.

**AC6 — `updateLinks`' widened blast radius, stated rather than shipped unremarked.** `updateLinks`
rewrites links across everything the scanner returns, so it now also rewrites links inside the 15
ADRs and the 14 sharded-PRD parts. **This is intended.** Those files carry real cross-references and
were previously skipped by every rename, which means any historical rename silently left them
dangling — a contributor to the corpus's 673 broken references. Nothing in this story performs a
rename, so no link was rewritten by it.

**Two collateral finds, neither absorbed silently.**
1. `excludes _archive by default` asserted `results.length === 1`. That is a census, not a test — it
   failed the moment the fixture grew. Converted to property assertions (`derive-counts-from-source`).
2. `tests/audit/installed-tree.test.js`'s **rot alarm fired correctly**: the curated citation
   `scripts/lib/artifact-utils.js:125` no longer pointed at the `taxonomy.yaml` read after the
   rewrite added 29 lines above it. Verified via `git show HEAD:` that it is the *same statement*
   moved to `:154`, not a changed one, and updated the citation. The compensating control worked
   exactly as its comment says it should.

**Measured effect (AC5).** `planning-artifacts` 111 → 141 files; ADRs **1 → 16**; governed 186 → 201;
ungoverned 182 → 196; coverage **48.95% → 48.43%**; migrate scope 144 → 174; `archive.js` dry-run plan
byte-identical before and after. **Coverage fell, and that is the correct direction** — the metric
was reporting 48.95% over a corpus it could not fully see. The `portfolio.total` delta of +35 is
fully accounted for: +30 `planning-artifacts`, +5 `exp3-smoke-test/`, the only other directory with
nested non-dotted files. Full record in
`scan-1-1-instrument-figures-before-after-2026-09-01.md`, which carries the discontinuity warning.

**AC7 discharged.** ADR-003 gains a dated second method note: its recursive enumeration was the
truthful one, the instrument was wrong, the table stands unchanged. T109 closed on that basis.
BUG-21 closed. Both rows MOVED to §2.5 per Closing a Row, with a Change Log entry;
`backlog-integrity.js` PASS (779 rows, 10 tables).

**Newly surfaced by the fix — NOT ruled here, flagged for the operator.**
`planning-artifacts/archive/convoke-prd-bmad-v6.3-adoption.md` has malformed frontmatter (bad
indentation of a mapping entry, 412:42). It has been unreadable for as long as it has existed and
nothing reported it, because nothing could see it. It also sits in a **second archive** nested inside
a scanned directory — `excludeDirs` matches top-level include-dir names only, so `_archive/` is
skipped and `planning-artifacts/archive/` is not. AC2 fixes the `excludeDirs` contract as unchanged,
so this ships as-is rather than being widened mid-implementation. **P59 already records the
underlying problem** (*"`archived` became a PLACE not a STATE: two archives"*) and this is its first
visible instance; whether an archived document belongs in the governance denominator is **OQ-4**.

**Not done, deliberately.** No file moved or renamed. No backfill. No `taxonomy.yaml` class field
(ADR-003 D2, separate story). `EXCLUDE_DIRS` untouched.

### File List

| File | Change |
|---|---|
| `scripts/lib/artifact-utils.js` | MODIFIED — `scanArtifactDirs` recurses; `relPath` added; JSDoc rewritten |
| `scripts/archive.js` | MODIFIED — same-parent supersession guard; `from` uses `fullPath` in both the archive and rename branches; unused `fullDir` removed |
| `scripts/audit/lib/installed-tree.js` | MODIFIED — stale citation `artifact-utils.js:125` → `:154` |
| `tests/lib/artifact-utils.test.js` | MODIFIED — nested + dotted fixture; 3 new tests; census assertion converted to property assertions |
| `tests/integration/archive-nested-supersession.test.js` | NEW — AC4, 3 tests, dry-run only |
| `_bmad-output/implementation-artifacts/scan-1-1-instrument-figures-before-after-2026-09-01.md` | NEW — AC5 record |
| `_bmad-output/planning-artifacts/adr/p60/adr-003-object-ontology.md` | MODIFIED — second method note (AC7) |
| `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` | MODIFIED — BUG-21 + T109 closed to §2.5, Change Log entry |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | MODIFIED — story status |
| `tests/lib/manifest.test.js` | MODIFIED — 2 tests for nested `oldPath`/`newPath` and the flat fallback (R1 #1) |
| `_bmad-output/implementation-artifacts/scan-1-1-make-the-artifact-scanner-see-subdirectories.md` | MODIFIED — this record |

## Senior Developer Review (AI)

**Reviewed:** 2026-09-01 · **Rounds:** 2 (converged) · **Outcome:** Changes Requested → all applied
**Diff:** uncommitted working tree, 11 files. **Set-equality check run** (`code-review-convergence`):
reviewed set == committed set, empty diff.

### Round 1 — 1 HIGH, 1 MEDIUM, 3 LOW (4 dismissed)

- [x] **HIGH #1 — `migrate-artifacts` carried the same path-reconstruction defect this story fixed
  in `archive.js`.** `artifact-utils.js` built `oldPath` and `newPath` as `` `${dir}/${filename}` ``,
  flattening every nested file. Demonstrated: the dry-run printed
  `planning-artifacts/adr-001-retire-badges-pipeline.md`, which does not exist — the file is at
  `planning-artifacts/adr/4-0-1/`. Those strings are not labels: `oldPath` is rejoined to read the
  file (`:1258`) and as the **`git mv` SOURCE** (`:1427`), and `newPath` is its destination, so a
  name fix would have lifted an ADR out of its initiative folder. Latent today — all 30 nested files
  return `AMBIGUOUS` with `newPath: null`, `Rename: 0`/`Conflict: 0` verified both sides — and live
  the moment an operator resolves one via `--resolution-file`, whose documented `"dir/file.md"` key
  named non-existent paths for all 30. **Fixed:** both now carry the subdirectory, POSIX-separated,
  with a `relPath || filename` fallback so every hand-built `fileInfo` keeps the flat contract.
  *This is the finding that justified the round: AC3 named the defect class and I fixed one of its
  two instances.*
- [x] **MEDIUM #2 — the recursion introduced a new crash path.** `fs.stat` follows symlinks;
  pre-recursion a symlinked directory failed `isFile()` and was skipped harmlessly. Executed against
  a fixture with a link to an ancestor: **`THREW: ELOOP`** — out of the scanner and therefore out of
  every governance instrument. A non-looping link is quieter and worse: its files count twice.
  **Fixed** with `fs.readdir(..., { withFileTypes: true })`; `Dirent` classifies with lstat
  semantics, so symlinks are skipped, restoring the pre-recursion property and dropping a per-entry
  `fs.stat`.
- [x] **LOW #3 — `originalDir` used `path.join`**, so Windows backslashes would land inside a
  markdown table cell in the archive `INDEX`. **Fixed:** POSIX-joined.
- [x] **LOW #5 — the walk comment overstated continuity.** Order is deterministic, but the
  *sequence* changed: nested entries interleave alphabetically with top-level ones. No consumer
  orders on it (all four checked). **Fixed:** comment now says so plainly.
- [ ] **LOW #4 — `archive.js --rename` convention warnings 358 → 373.** `Files to rename: 0` both
  sides, so nothing destructive changed; the 15 new warnings correctly name files that lack category
  prefixes. **Deferred** as reporting noise, not a defect.

**Dismissed (4):** duplicate `adr-001` basenames colliding in `groupByKey` (the parent-dir key
separates them); recursion depth (corpus max is 3); `parseFilename` spread clobbering `parentRel`
(no key overlap); `EXCLUDE_DIRS` not matching nested `planning-artifacts/archive/` — already recorded
above as OQ-4 territory, deliberately unruled, so not a review finding.

### Round 2 — 0 HIGH, 2 LOW

Triggered by Round 1's HIGH, and scoped to the patches **plus the three tests written to answer
them**, which `code-review-convergence` classifies as unreviewed text by default.

- **LOW** — the symlink test early-returns on `EPERM`/`ENOSYS`, a vacuous pass on Windows without
  developer mode. All 8 CI jobs are `ubuntu-latest`, so the guard is always exercised where it runs.
  Accepted.
- **LOW** — the `installed-tree` rot-alarm citation moved twice in one story (`:125` → `:154` →
  `:164`). Both were pure line shifts, each confirmed against `git show HEAD:` to be the same
  statement relocated. Line-fragile by design; recorded, no action.

**Confirmed as an improvement rather than a risk:** `detectCollisions` keys on `newPath`, so two
documents with the same canonical name in different folders no longer collide falsely.

**Convergence:** Round 2 produced no HIGH and introduced no structural change, so Round 3 is not
triggered. Review closed at Round 2.

### Both patches are mutation-proven

| Mutant | Killed by | Other tests |
|---|---|---|
| `oldPath`/`newPath` flattened again | *preserves the subdirectory…* | *falls back to filename* stays green |
| `withFileTypes` → `fs.stat` | *does not follow symlinked directories* | — |

Neither guard is a check that cannot fail (`verification-must-be-falsifiable`).

### Post-review gates

`npm run lint` clean · `npm test` **1961 tests, 1960 pass, 0 fail**, 1 skipped ·
`backlog-integrity.js` PASS (779 rows, 10 tables) · `archive.js` dry-run clean ·
instrument figures unchanged by the patches (141 files, 16 ADRs, 48.43%).

## Change Log

| Date | Change |
|---|---|
| 2026-09-01 | Story closed `done` by operator. Epic `scan-epic-1` closed with it (single-story mini-epic). |
| 2026-09-01 | Code review Rounds 1-2, converged. R1: 1 HIGH (migrate-artifacts carried the same path-flattening defect — `git mv` source/destination), 1 MEDIUM (symlink recursion threw ELOOP), 3 LOW; 4 applied, 1 deferred. R2: 0 HIGH, closed. Both patches mutation-proven. 1960 tests pass. |
| 2026-09-01 | Story implemented. Scanner recurses (BUG-21); `archive.js` guarded against cross-directory supersession and two path reconstructions fixed; before/after instrument figures recorded; ADR-003 method note appended; BUG-21 and T109 closed. 1957 tests pass, 0 fail, lint clean. |
