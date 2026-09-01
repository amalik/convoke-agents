# scan-1-1 — instrument figures, before and after the recursive scanner

**Date:** 2026-09-01
**Baseline commit (BEFORE):** `98c8503c10cd04f59e214af6d56dc441129c8b19`
**Change:** `scanArtifactDirs` recurses (BUG-21); `archive.js` gains a same-parent supersession guard.
**Method:** every figure below was produced by executing the shipped code against the live tree,
before and after, with one harness run twice. Nothing is hand-counted (`derive-counts-from-source`).
`archive.js` was run in **dry-run** — no `--apply`, nothing moved.

> **This commit is a discontinuity.** Every governance figure Convoke has ever reported was measured
> by a scanner that could not see subdirectories. Numbers from before this commit and after it are
> **not comparable**. When you find a coverage percentage in an older document, check which side of
> this line it came from.

---

## The figures

| Figure | Before | After | Δ |
|---|---:|---:|---:|
| `scanner.total` | 373 | 403 | **+30** |
| `scanner.planning-artifacts` | 111 | 141 | **+30** |
| `scanner.implementation-artifacts` | 229 | 229 | 0 |
| `scanner.vortex-artifacts` | 32 | 32 | 0 |
| `scanner.gyre-artifacts` | 1 | 1 | 0 |
| **`scanner.adr_files`** | **1** | **16** | **+15** |
| `portfolio.total` | 380 | 415 | +35 |
| `portfolio.governed` | 186 | 201 | +15 |
| `portfolio.ungoverned` | 182 | 196 | +14 |
| `portfolio.unattributed` | 12 | 18 | +6 |
| `portfolio.attributableButUngoverned` | 181 | 195 | +14 |
| **`portfolio.coverage_pct`** | **48.95** | **48.43** | **−0.52** |
| `portfolio.initiatives` | 8 | 8 | 0 |
| `migrate.in_scope_files` | 144 | 174 | +30 |
| `archive` dry-run plan | *clean, no actions* | *clean, no actions* | identical |

*Both columns were captured before this report file existed, so the corpus differs between them
only by the code change. Re-running the harness now returns `implementation-artifacts` 230 and
coverage 48.32% — the report counts itself.*

*Re-measured after the Round 1 patches (symlinks no longer followed; `oldPath`/`newPath` carry the
subdirectory): every figure above is unchanged. The patches corrected latent path handling and a
crash path, not what the instruments count.*

## Reading them

**Coverage fell, and that is the correct direction.** The metric was reporting 48.95% over a corpus
it could not fully see. BUG-21's premise — that hiding ungoverned files removes them from the
denominator and makes coverage rise — is confirmed by its inverse: revealing them moved coverage
**down** 0.52 points. The number got worse and more true at the same time.

**The +35 in `portfolio.total` is fully accounted for.** The portfolio engine scans every
`_bmad-output` subdirectory, not just the four the scanner harness sampled: +30 from
`planning-artifacts` and +5 from `exp3-smoke-test/`, the only other directory holding nested
non-dotted files. No file appeared from anywhere unexplained.

**The +15 governed are the ADRs.** All 15 under `planning-artifacts/adr/**` carry complete
governance frontmatter, so every one of them lands on the governed side. This is the measurable
form of the defect: the most rigorously-governed documents in the corpus were the ones the
governance instrument could not see, including `adr-002-status-axis.md` and
`adr-003-object-ontology.md`, both of which rule on this very metric.

**The +14 ungoverned are the sharded PRD.** `planning-artifacts/convoke-prd-bmad-v6.3-adoption/`
contributes 14 parts, and part files carry no frontmatter of their own — the index does. Under
ADR-003's D3 reasoning this is arguably a denominator artefact rather than neglect, but ruling that
is out of scope here and is left to **OQ-2b**.

**`archive.js`'s plan is byte-identical before and after.** Nothing became newly archivable. That
is the expected result — no file in any `planning-artifacts` subdirectory is dated — and it is why
AC4's guard was built against a *latent* hazard rather than a live one.

## One thing the fix surfaced

`planning-artifacts/archive/convoke-prd-bmad-v6.3-adoption.md` has **malformed frontmatter**:
`bad indentation of a mapping entry (412:42)`. It has been unreadable for as long as it has existed
and nothing reported it, because nothing could see it. It now appears in
`unattributed_reasons` as its own category.

Two observations, neither of them ruled here:

1. The file sits in `planning-artifacts/archive/` — a **second archive**, nested inside a scanned
   directory. `excludeDirs` matches top-level include-dir names only, so `_archive/` is skipped and
   `planning-artifacts/archive/` is not. AC2 fixes the `excludeDirs` contract as unchanged, so this
   ships as-is rather than being widened mid-implementation. **P59 already records the underlying
   problem** — *"`archived` became a PLACE not a STATE: two archives"* — and this is a live instance
   of it, now visible for the first time.
2. Whether an archived document belongs in the governance denominator at all is **OQ-4**, unruled.

## Reproducing this

```bash
node -e "
const {scanArtifactDirs}=require('./scripts/lib/artifact-utils.js');
(async()=>{
  const f=await scanArtifactDirs(process.cwd(), ['planning-artifacts'], ['_archive']);
  console.log('scanner:', f.length, '| adr files:', f.filter(x=>x.filename.startsWith('adr-')).length);
})();"
```

Before: `scanner: 111 | adr files: 1`. After: `scanner: 141 | adr files: 16`.

These are dated observations, not assertions. The corpus grows; do not paste them into a test.
