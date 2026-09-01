# Story 1.1: Make the artifact scanner see subdirectories

Status: ready-for-dev

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

- [ ] **Task 1 — Prove it red (AC1)**
  - [ ] Add a nested fixture to the existing `scanArtifactDirs` describe block in
        `tests/lib/artifact-utils.test.js:274` — extend the `before()` hook, do **not** build a
        second fixture tree
  - [ ] Run it against unfixed code, capture the failure output into the Dev Agent Record
- [ ] **Task 2 — Make the scanner recursive (AC2, AC3)**
  - [ ] Rewrite the loop in `scripts/lib/artifact-utils.js:91-113` to walk depth-first
  - [ ] Add `relPath`; leave `filename`, `dir`, `fullPath` semantics untouched
  - [ ] Update the JSDoc `@returns` at `:88` to declare the new field
  - [ ] Skip dot-entries at every level
- [ ] **Task 3 — Guard the destructive consumer (AC4)**
  - [ ] Constrain `groupByKey` / its caller in `scripts/archive.js:28-37, 104-113` to same-parent grouping
  - [ ] Add the non-grouping test
  - [ ] Re-read `archive.js`'s `--apply` path and confirm no other place assumes flatness
- [ ] **Task 4 — Before/after diff (AC5)**
  - [ ] Capture BEFORE figures at `HEAD~` (stash or worktree — do not hand-transcribe)
  - [ ] Capture AFTER figures
  - [ ] Write `scan-1-1-instrument-figures-before-after-2026-09-01.md`
- [ ] **Task 5 — Consumers and suite (AC6)**
  - [ ] Read all four call sites before deciding nothing else changes:
        `archive.js:104`, `artifact-utils.js:1202`, `artifact-utils.js:1498`, `portfolio-engine.js:267`
  - [ ] `npm run lint` clean, then full suite green
- [ ] **Task 6 — T109 (AC7)**
- [ ] **Task 7 — Close BUG-21** per §*Closing a Row*: flip status, delete from §2.2, append receipt
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

### Debug Log References

### Completion Notes List

### File List
