---
baseline_commit: 87b87eaee36ea1f535c4aeb4668e153a952f2c0a
---

# Fast Story: Baseline the reference graph before any corpus rename

**Status:** review · **Lane:** Fast (spike — time-boxed learning, uncertain outcome) · **Source:** Knowledge-governance survey, 2026-08-25 (party-mode roundtable) · **Backlog ID:** unallocated — allocate before starting, grepping the working tree first (I150)

**Governed by:** [`adr-001-cleanup-scope.md`](../planning-artifacts/adr/knowledge-governance/adr-001-cleanup-scope.md) — *proposed, unsigned.* This story is implementable while that ADR is unsigned **only** because it mutates nothing. If the ADR's scope decision changes, AC3's coverage target changes with it and nothing else does.

---

## Context

The knowledge-governance initiative will eventually rename and move documents across `_bmad-output/`, `docs/`, and the repository root. Every such rename breaks every inbound reference to the moved file.

The project already owns the instrument that finds those references: [`scripts/audit/reference-integrity.js`](../../scripts/audit/reference-integrity.js). Its header records sixteen rounds of code-review patches (P3–P16, applied 2026-05-01) — symlink-cycle protection, ENOENT-vs-EACCES distinction, regex statefulness, code-fence stripping.

**It runs nowhere.** It appears in no `package.json` script and in no CI workflow. Its sibling [`backlog-integrity.js`](../../scripts/audit/backlog-integrity.js) runs at [`ci.yml:161`](../../.github/workflows/ci.yml#L161). This one has never been called.

**Why this story is first.** Three reasons, in order of weight:

1. **It is a hard prerequisite.** Nothing may be renamed until link damage is distinguishable from pre-existing damage. Rename first and the two become permanently indistinguishable.
2. **It can abort the initiative cheaply.** If the corpus's reference graph is already heavily broken, mass renaming is unsafe at any speed and the whole plan stops at "new documents only" — a conclusion worth reaching in an afternoon rather than after a planning pipeline.
3. **It is the cheapest instrument to wire.** It needs a command and a run. Its sibling instruments (`bmad-portfolio-status`, `bmad-migrate-artifacts`) need skill registration, which may itself turn out to be a shipped-product defect belonging to 4.0.1 Epic 3.

**What this story is NOT.** It is not the cleanup. It does not rename, move, archive, or edit any existing document. It does not wire anything into CI. It produces one piece of evidence and stops.

---

## Story

As a Convoke maintainer,
I want the reference-integrity checker reachable by a command and run once across the governed corpus,
so that the knowledge-governance initiative begins from a **measured** link baseline rather than an assumption — and can be abandoned before a single file is renamed if that baseline turns out to be bad.

---

## The trap that is real

**A clean result is the dangerous outcome, not the reassuring one.**

This checker's own review history records exactly this failure: patch **P6** — *"middle-segment glob wildcards now expanded (previously `.claude/skills/bmad-agent-bme-*/SKILL.md` returned ZERO files)"*. A path pattern that matched nothing produced a silent pass.

A run that reports zero broken references across ~1,470 files is far more likely to mean *the walker found nothing to check* than *the corpus is perfectly linked*. AC2 and AC3 exist solely to make that distinguishable, and neither is optional.

---

## Acceptance Criteria

**AC1 — The checker is reachable by a command.**
A `package.json` script invokes it. Name it consistently with the existing `docs:audit` entry — `refs:audit` is the obvious form; any name is acceptable provided it is not a bare `node scripts/...` incantation that lives only in this story.

Rationale: `feedback_slash_command_ux` / the operator-surface principle. An instrument that can only be run by someone who already knows it exists is how the previous ten went quiet.

**AC2 — The checker is demonstrated RED before its output is trusted.**
Introduce a reference that is known-broken — a fixture document, or a sentinel link in a scratch file removed afterwards — and show the checker reports it and exits non-zero.

This must be shown **as part of the story's evidence**, not asserted. Per `verification-must-be-falsifiable` (`project-context.md`, "Exception. None."): a check whose failure mode has never been observed is not a check. Given P6's history, "it printed no findings" is not evidence of a clean corpus until this AC has been satisfied.

**AC3 — Coverage is reported as a number, not assumed.**
The run states **how many files it walked, per tree**. Per [ADR-001](../planning-artifacts/adr/knowledge-governance/adr-001-cleanup-scope.md), the analysis scope is `_bmad-output/` + `_bmad/bme/` + `docs/` + the repository root — approximately **1,470** markdown files (1,152 / 318 / 17 / 7 at the time of the survey).

Do **not** hardcode 1,470 as an assertion — `derive-counts-from-source` forbids a magic number that rots while the property it stands for does not. Assert the *property*: the walked count is within a sane band of an independently derived `find` count taken in the same run, and any tree reporting **zero** files is a failure, not a pass.

If the checker cannot see one of the trees, **that is the story's finding** and the initiative's third abort condition has fired. Report it and stop; do not patch the walker to make the number look right.

**AC4 — The baseline is captured as a governed artifact.**
One report, written to `_bmad-output/planning-artifacts/`, following the governance convention (`convoke-report-…-2026-08-25.md`) with frontmatter carrying `initiative`, `artifact_type: report`, `created`, `schema_version: 1`, and a `status`.

Use a status value legal under the shipped enum at [`artifact-utils.js:763`](../../scripts/lib/artifact-utils.js#L763) (`draft` / `validated` / `superseded` / `active`). Do **not** invent a sixteenth status value; the corpus already carries fifteen across three axes and normalising them is a downstream decision (ADR OQ-1).

The report contains, at minimum:
- files walked, per tree
- every broken reference as `source:line → target`
- the total count of **pre-existing** breakage, stated as such
- the AC2 red demonstration, recorded

Rationale: if the first artifact this initiative produces is itself ungoverned, nothing after it will be governed either.

**AC5 — The abort conditions are evaluated in writing.**
The report states explicitly which of the initiative's three abort conditions fired, and which did not:

1. redundancy low → stop at staleness *(not evaluable by this story; say so)*
2. **link baseline bad → step 8 is unsafe; the initiative stops at "new documents only"** *(this story's to answer)*
3. instrument cannot see both trees → the instrument is the finding *(this story's to answer)*

A reader must not have to infer the verdict from a table of numbers. Write the sentence.

**AC6 — Nothing is mutated, and nothing is gated.**
No existing document is renamed, moved, or edited. `git status` shows only the new report and the `package.json` script.

**CI wiring is explicitly out of scope.** Adding this checker to CI *before* the baseline is known would fail every build on pre-existing breakage the project has not yet decided to fix. Whether it becomes a gate — and on what threshold — is downstream of this report, and is a decision, not a task.

---

## Tasks

- [x] Read [`reference-integrity.js`](../../scripts/audit/reference-integrity.js) — particularly its walker and its path-matching — before running anything. Its P3–P16 notes describe the failure modes worth watching for.
- [x] Add the `package.json` script (AC1).
- [x] Build the red demonstration and observe it fail (AC2). **Before** any full run — a clean full run seen first will bias the reading of everything after it.
- [x] Run against the ADR-001 scope; capture per-tree walked counts alongside an independently derived `find` count (AC3).
- [x] Write the governed report, including the AC2 evidence and the AC5 verdict sentence (AC4, AC5).
- [x] Confirm the working tree carries only the new report and the script change (AC6).

---

## Time-box and stopping rule

**This is a spike.** If it exceeds its box, stop and report what was learned rather than pushing to completion — an unfinished baseline that names its own gap is more useful than a finished one that papers over it.

Two specific stopping triggers:

- **The checker needs non-trivial repair to walk the corpus at all.** That is a different story, and it is a finding: log it and stop.
- **A sixth deliverable appears.** Per the cap agreed for this slice, growth is the signal to re-scope, not to absorb.

---

## Follow-on rows (do not do them here)

- `bmad-portfolio-status` made invocable and run — **check first** whether "declared in `skill-manifest.csv`, absent from `.claude/skills/`" is a shipped-install defect. If it is, it is 4.0.1 Epic 3, not a documentation story.
- The three reconcile deltas — status enum, taxonomy, folder plan — against the corpus.
- The ~30-document sampled read.
- ADR-002 through ADR-005 (OQ-1 … OQ-4).

---

## Dev Agent Record

### Completion Notes

**All six ACs satisfied.** The measurement ran; the corpus reference graph is now baselined at commit `87b87eae`.

**Headline result: 657 broken references out of 2,696 checked (24.4%).**

| Tree | `.md` files | Refs | Broken |
|---|---:|---:|---:|
| `_bmad-output/` | 1,155 | 2,402 | 612 |
| `_bmad/bme/` (ships) | 318 | 39 | **0** |
| `docs/` | 17 | 182 | 45 |
| Repository root | 7 | 72 | **0** |

**AC5 verdicts.** Abort condition 2 (bad link baseline) **did not fire**, conditionally — the shipped surfaces are clean, 51.6% of breakage is a benign authoring-convention artifact, and the baseline is captured as a diffable set. Abort condition 3 (instrument blindness) **did not fire** — all four trees proved reachable red *and* green. Abort condition 1 (redundancy) is **not evaluable** by this story and stays open.

**Three findings beyond the ACs:**

1. **`COVERAGE_SCOPES` is not corpus-wide.** The checker's default "full project scan" resolves to five I97-specific globs (retros, audit reports, one checklist, `tests/`, bme slash-commands). `docs/`, `_bmad/bme/`, the repo root and most of both artifact directories fall outside it — a bare run prints `PASS` and means little. Found by reading before running (Task 1), which is why Task 3 came before Task 4. `npm run refs:audit` pins the ADR-001 scope with `--paths=`; **no source file was modified.**

2. **The breakage is 51.6% benign.** Every broken target was re-tested against the repository root: 339 of 657 **exist** and are simply linked as if the document sat at the repo root. Only 318 are genuinely absent, and only 243 of those point at `.md` documents — the subset that interacts with a rename at all. `docs/`, `drafts/` and `test-artifacts/` contribute **zero** genuinely-absent references.

3. **The checker cannot ever return 0 here, so it must not become a binary CI gate.** It is a baseline-diff instrument. A future gate must also exclude `_archive/`, which holds 139 of the 318 absent-target refs — historical documents whose targets legitimately no longer exist.

**Limitation worth carrying forward:** this validates a git clone, not a shipped package. `_bmad/bme/` passes here while I157 remains true, because the checker resolves against the working tree. It is structurally incapable of detecting the repo-versus-tarball class.

### Debug Log

**The falsification harness produced a false negative and was rewritten.** The first red demonstration reported `_bmad-output/` as unreachable. Cause: `printf … | grep -q` — `grep -q` exits on first match, `printf` dies with `EPIPE`, and `set -o pipefail` propagated the *harness's* failure as the checker's. This is `verification-pipefail` occurring inside the falsification harness itself, and it looked exactly like a real finding. The assertion was rewritten to pure-shell pattern matching against a unique per-tree token, with no pipe in the assertion path. A GREEN control (token must vanish after the sentinel is removed) was added at the same time.

Sentinels were planted in-tree to prove reachability and removed on every exit path via `trap … EXIT INT TERM`. `git status` after the demonstration confirmed no residue.

## File List

| File | Change |
|---|---|
| `package.json` | Added `refs:audit` script with the ADR-001 scope pinned via `--paths=` |
| `_bmad-output/planning-artifacts/convoke-report-reference-graph-baseline-2026-08-26.md` | **New.** Governed baseline report, 822 lines, including the full 657-entry comparison set |
| `_bmad-output/implementation-artifacts/fast-reference-graph-baseline.md` | Story record: `baseline_commit`, task checkboxes, Dev Agent Record, File List, Change Log, Status |

No existing document was renamed, moved, or edited. `scripts/audit/reference-integrity.js` was **read only**.

---

## Change log

| Date | Change | By |
|------|--------|-----|
| 2026-08-25 | Initial draft. Fast Lane spike, scoped to the link baseline only. | Winston (architect role) |
| 2026-08-26 | Implemented. 657/2,696 broken refs baselined; abort conditions 2 and 3 did not fire. Status → review. | Amelia (dev role) |
