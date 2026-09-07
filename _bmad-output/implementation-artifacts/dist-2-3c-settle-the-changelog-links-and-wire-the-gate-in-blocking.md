---
baseline_commit: a4d5ce3f67f8237cc226b2d5e0c0dee36d5d3bcb
---

# Story 2.3c: Settle the CHANGELOG links and wire the gate in, blocking

Status: review

> **Split from Story 2.3 on 2026-08-31.** Class 3 of
> [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md), plus the wiring step
> that made the original story too large to review. Siblings: `dist-2-3a`, `dist-2-3b`.
>
> **This is the last of the three and it carries the gate.** It must not start until 2.3a and 2.3b
> have landed and the finding count is zero.

## Story

As a **Convoke operator**,
I want the link gate actually enforced,
so that **the next broken reference is caught by CI rather than by someone reading carefully**.

### What this story is, in one line

Clear the final 4 findings in `CHANGELOG.md`, then wire Story 2.2's checker into
`try-fresh-install.sh` as blocking **in the same commit that turns it green**.

---

## Acceptance Criteria

**AC1 — The migration guide ships**

**Given** `CHANGELOG.md` links `docs/migration/3.x-to-4.0.md` twice (`:44`, `:83`) and `docs/` is
not in `files[]`
**When** this story completes
**Then** `docs/migration/` is added to `files[]` — the migration guide is the single most useful
link an upgrading npm reader can follow
**And** only `docs/migration/`, not `docs/` wholesale

**AC2 — The other two become validated absolute URLs**

**Given** ADR-002 Amendment 2(2) settles these as absolute rather than dropped, because Amendment 1
now makes them **validated** rather than unchecked
**When** this story completes
**Then** `_bmad-output/planning-artifacts/adr/v63/adr-001-retire-m9-pf1-gate.md` (`:54`) and
`docs/BMAD-METHOD-COMPATIBILITY.md` (`:1205`) are rendered as self-referential absolute URLs
**And** both are confirmed resolvable by Story 2.2's AC5 clause, not by eye — both verified present
2026-08-31
**And** `CHANGELOG.md` then contributes **zero** findings, derived

**AC2b — The name-registry citation, per ADR-002 Amendment 3(1)**

**Given** `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md:133`
cites `_bmad/bme/_config/name-registry.csv` as the **name authority** — *"where the two disagree,
the registry wins"* — and the source ships while the target does not
**And** it arrived 2026-09-05 in `154719e3`, after ADR-002 drew its three classes, so it belongs to
none of them and to no sibling story
**When** this story completes
**Then** `_bmad/bme/_config/` is **NOT** added to `files[]` — Amendment 3(1) rules the registry a
development-state inventory, not operator reference, and it fails this ADR's own
`project-context.md` required-reading test
**And** the link is rendered as a self-referential absolute URL
(`https://github.com/amalik/convoke-agents/blob/main/_bmad/bme/_config/name-registry.csv`),
validated by Story 2.2's AC5 clause rather than by eye
**And** `lifecycle-process-spec.md` then contributes **zero** findings, derived

**AC3 — Zero findings before the gate is wired**

**Given** NFR10 forbids a gate and its first fix landing together, and `fresh-install` gates every
PR and every publish
**When** this story begins its wiring step
**Then** the checker is run and observed reporting **zero** findings across the whole packed tarball
**And** that output is recorded in Completion Notes **before** the wiring diff is written
**And** if any finding remains, the wiring does not proceed — the remedy belongs to whichever
sibling story owns that class, not here

**AC4 — Wired blocking, in the same commit that turns it green**

**Given** Story 2.2 deliberately left the checker outside the harness verdict
**When** this story completes
**Then** the checker is placed in `try-fresh-install.sh`'s failure path, **blocking**, in the same
commit as AC1 and AC2 — it is never merged non-blocking
**And** `continue-on-error` appears nowhere. A gate that runs and nobody watches is T32, the row
this epic exists to close
**And** the harness's verdict condition is edited **exactly once**, adding the new status variable
alongside `INSTALL`, `DOCTOR`, `EXPORT` and `FAILED`

**AC5 — The gate is proven able to fail after wiring**

**Given** `try-fresh-install.sh` has a documented history of at least five fail-open defects, every
one of which reported PASS while doing nothing
**When** the gate is wired
**Then** a deliberately broken relative link is planted in a shipped `.md`, the harness is run, and
it is observed **exiting non-zero**; the link is restored and it is observed exiting zero
**And** both outputs are recorded — `verification-must-be-falsifiable`
**And** any command substitution feeding the pass/fail decision fails **closed**

**AC6 — The epic's detection pair is complete, and says so**

**Given** `dist-2-4` wired the installed-tree assertion (what arrives on disk) and this story wires
the documented-reference checker (what the docs claim)
**When** this story completes
**Then** Completion Notes record that FR12 and FR13 are both now enforced in the same job, and
restate the boundary: this checker cannot see a file read at runtime but absent from the package,
and that assertion cannot see a broken link. Neither subsumes the other

---

## Tasks / Subtasks

- [x] **T1** — Confirm `dist-2-3a` and `dist-2-3b` have landed
- [x] **T2** — Add `docs/migration/` to `files[]` (AC1)
- [x] **T3** — Rewrite the two CHANGELOG links as absolute (AC2)
- [x] **T3a** — Rewrite the `lifecycle-process-spec.md:133` citation as an absolute URL (AC2b)
- [x] **T4** — Re-pack; run the checker; record **zero** (AC3). **Stop here if non-zero**
- [x] **T5** — Wire into the verdict, blocking (AC4)
- [x] **T6** — Plant-and-restore falsifiability demonstration (AC5)
- [x] **T7** — Re-run `agent-surface-parity` and `fresh-install`; record counts

### Review Findings

Round 1 — three parallel layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor), all as
independent subagents on `claude-sonnet-5`, none sharing this session's authoring context. 5
findings merged from 10 raw (dedup: `docs/.npmignore` scope was raised independently by two
layers). 0 decision-needed, 3 patch, 2 defer, 6 dismissed.

- [x] **[Review][Patch] `docs/.npmignore`'s `README.md` pattern is unanchored — excludes at any depth, not just `docs/README.md`** [docs/.npmignore:25] — reproduced by both Blind Hunter and Edge Case Hunter independently: a `docs/migration/README.md` created and packed vanished silently. The file's own comment claims "exactly one file must be kept out"; the pattern did not deliver that. Fixed by anchoring: `/README.md`. Verified both directions — `docs/README.md` still excluded, a hypothetical `docs/migration/README.md` now correctly ships.
- [x] **[Review][Patch] `assert-shipped-links.js`'s module docstring is stale and now self-contradicting** [scripts/audit/assert-shipped-links.js:32-43] — still reads "NOT IN THE VERDICT (NFR10)... It is red today" and "READ THIS BEFORE PICKING UP 2.3c," both false now that this story wired it green. This story rewrote the equivalent claim in `try-fresh-install.sh`'s comment but missed the twin copy in the file the gate actually calls — the same doc-rot class this epic exists to catch, caught by Blind Hunter, not by the author.
- [x] **[Review][Patch] Story frontmatter and body contradict each other** [dist-2-3c story file:9] — `baseline_commit` is set in frontmatter, but a leftover HTML comment two lines below still reads "deliberately ABSENT — stamped by dev-story at implementation start." Introduced when the frontmatter was prepended; the comment was never removed.
- [x] **[Review][Defer] Two test conventions in `tests/lib/docs-packaging.test.js` are copied verbatim from `covenant-packaging.test.js`, gaps included** [tests/lib/docs-packaging.test.js:45,110] — deferred, pre-existing — Edge Case Hunter found both: `JSON.parse(execFileSync(...))` has no shape/identity guard (an npm output-format change fails opaquely rather than as a clear packaging-regression), and the reference-style-link regex anchors to column 0, missing an indented `[ref]: target` definition. Both patterns are shared with `covenant-packaging.test.js` and two files under `tests/unit/`; fixing only the new file would leave the other three carrying the identical gap. A class-level fix (shared helper / shared regex) belongs to its own story, not a one-file patch inside this one.
- [x] **[Review][Defer] `docs-packaging.test.js`'s "no relative link" test flags every relative link, not just ones that would escape the shipped directory** [tests/lib/docs-packaging.test.js:87] — deferred, pre-existing — Blind Hunter: a future same-directory cross-link (e.g. a second migration guide linking back to `3.x-to-4.0.md`) would false-fail, since `relativeLinks()` doesn't check whether the target resolves within the shipped set. The suite's own first test explicitly anticipates a second guide file, so this is concretely reachable, not hypothetical. Identical design in `covenant-packaging.test.js:107-117`, so the same file-vs-class reasoning applies — and this direction fails toward safety (over-strict), not toward the fail-open pattern this epic exists to close, which is why it's a defer and not a patch.

**Delta review of the remediation** (Blind Hunter + Edge Case Hunter, independent subagents). Run
because the Round 1 patches were themselves unreviewed text and the set-equality check showed a real
gap: `scripts/audit/assert-shipped-links.js` had entered the change set and was **never in the
reviewed diff** — Blind Hunter found the defect there by reading past the diff, so the fix to it had
had no review at all. Not a Round 2 (no HIGH); this completes Round 1's coverage per the
`code-review-convergence` set-equality clause. 4 more patches, 2 more defers.

- [x] **[Review][Patch] The "ten self-referential links" claim is wrong in both gate files, and was already wrong before this story** [scripts/audit/assert-shipped-links.js:21, scripts/audit/try-fresh-install.sh:417-418] — measured: **21 instances / 15 unique paths** today, and **18 / 13 at baseline `a4d5ce3f`** — so the figure was stale before `dist-2-3c` touched anything, and this story made it staler by adding three. A hardcoded count in a comment is `derive-counts-from-source` exactly, and `assert-shipped-links.js`'s own later paragraph warns against literal counts while carrying one eleven lines above. Both replaced with the derived instruction (`--json`, read `selfRefCount`) plus the dated measurement.
- [x] **[Review][Patch] The NFR10 gloss said the opposite of what NFR10 says, and contradicted its own next clause** [scripts/audit/assert-shipped-links.js:34, scripts/audit/try-fresh-install.sh:420] — this story wrote "(NFR10: a gate and its first fix never land together)" immediately before "in the same commit that took the count to zero." The epic is explicit: NFR10 requires a gate *demonstrated* failing, **not** *merged* failing, and names "checker wired in blocking, same commit" as 2.3's compliant pattern. So the wiring was compliant and the parenthetical describing it was not. Corrected in both, with the wrong gloss quoted so the correction is legible.
- [x] **[Review][Patch] The documented exit-code contract is not the tri-state it appears to be** [scripts/audit/assert-shipped-links.js:24] — `cannotRunAfterScan` exits **1** when findings exist AND a post-scan precondition failed, printing `NOTE: the scan was also incomplete`. Findings win over the cannot-run signal deliberately, but the docstring's `1 = findings` line let a reader take exit 1 as proof of a complete scan. Clause added.
- [x] **[Review][Patch] "shipped" used for a third meaning inside the docstring that exists to be precise about it** [scripts/audit/assert-shipped-links.js:49] — the file distinguishes package / repository / installed project; the new paragraph used "after 2.3c had shipped" to mean "its changes had landed." Reworded.
- [x] **[Review][Defer] A symlinked `docs/migration/README.md` is silently omitted by npm regardless of the anchoring** [docs/.npmignore] — deferred, pre-existing — Edge Case Hunter, verified. `npm pack` drops symlinked files, so the anchoring fix's promise ("a legitimate `docs/migration/README.md` ships") does not hold for a symlink, and nothing detects it. Zero symlinks ship today. Same class as the symlink gaps already filed against `shipped-links.js` from `dist-2-2` Round 3.
- [x] **[Review][Defer] A case-variant `docs/Readme.md` or `docs/README.MD` would ship with its repository-only links** [docs/.npmignore] — deferred, pre-existing — Edge Case Hunter. The anchored pattern is case-sensitive; a stray case variant is not excluded and would arrive carrying the same seven broken links `docs/README.md` does. Sharpened by this repository's own macOS case-insensitive filesystem, on which a contributor cannot create the file to reproduce it locally — it would surface only in CI. Latent: no such file exists.

**Dismissed, with the verification each one got:**
- *(Blind)* Absolute-URL links (CHANGELOG.md, lifecycle-process-spec.md) degrade offline/IDE reading — real tradeoff, but it's ADR-002 Amendment 1's accepted policy, not this story's decision to re-litigate.
- *(Blind)* "A root `.npmignore` does NOT work when `files[]` is present" — inherited from `dist-2-3a` without re-verification. **Re-verified here, twice:** a root-level rule naming an explicitly-listed file (`README.md`) does not suppress it, and a root-level rule naming a directory-swept-in file (`docs/README.md`, the exact scenario) does not suppress it either. Confirmed true, not folklore.
- *(Blind)* `links=$LINKS` diagnostic line is untested — true, but consistent with the pre-existing pattern: none of `install=`, `doctor=`, `export=`, `bins_failed=` in that same line is asserted either.
- *(Blind)* `package.json`'s `"//files"` comment is now one unreviewable paragraph — true, but restructuring how these doc-comments are stored is a design decision spanning three prior stories' entries already; out of scope here.
- *(Blind)* ENV_FAIL/no-fail-open argument rests on a `ci.yml` grep taken at write time, unpinned by a test — legitimate hardening idea (assert the workflow step shape), but it is new test surface beyond this story's ACs, not a defect in what shipped.
- *(Blind)* AC6's falsified premise isn't surfaced machine-readably (sprint-status just says `review`) — real, and the same shape as this repo's known "governance instrument that does not run" class. Worth a backlog note; not a code patch to this story, which already states the honest AC6 outcome in prose.
- *(Auditor)* `package.json` comment claims "17 files" repository-facing under `docs/`; a `docs/*.md` top-level count gives 16 — **checked; 17 is correct.** `find docs -name '*.md'` (recursive) returns 18, of which 1 ships; the auditor's count used `maxdepth 1` and missed `docs/adr/adr-bmad-coupling-v4.0.md`. No defect; comment stands as written.
- *(Auditor)* Zero AC violations. Every falsifiable claim in Completion Notes was independently reproduced against the repo, including both self-reported deviations.

---

## Dev Notes

### The ordering constraint is the whole point of this story existing separately

Story 2.2 built the checker and did not wire it. 2.3a removes 18 findings, 2.3b removes 5, this
story removes the last 4 and only then wires. If any of those is incomplete, wiring here turns
`fresh-install` red — and because `publish` `needs:` it, that blocks **every PR and every release**
until the missing fix lands.

AC3 exists so that is discovered by a check, not by a blocked repository.

### Expected finding trajectory

```
2.2 red demonstration      27
after 2.3a (Class 1)        9
 + 154719e3 (2026-09-05)   10   <- AC2b's finding arrives BETWEEN 2.3a and 2.3b
after 2.3b (Class 2)        5   <- 28cbf81c: "10 across 3 files -> 5 across 2"
after 2.3c AC1+AC2          1   <- NOT zero
after AC2b                  0   <- gate wired here
```

**The `9 -> 10` step is not an error.** The original table put Class 1's residue at 9; `28cbf81c`
reports starting from 10. The extra finding is AC2b's, which landed in `154719e3` on 2026-09-05 —
after `dist-2-3a` and before `dist-2-3b`.

**Measured 2026-09-07** against the committed tree at `5b974787`: `npm pack && node
scripts/audit/assert-shipped-links.js <tarball>/package .` -> `5 finding(s) across 2 file(s)` — 4
`CHANGELOG.md`, 1 `lifecycle-process-spec.md`.

Derive each number at implementation time. If the trajectory does not match, something else changed
and that is worth understanding before wiring.

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-2` | **Blocking.** Builds the checker |
| `dist-2-3a`, `dist-2-3b` | **Blocking.** Must both land first (AC3) |
| `dist-2-4` | Shipped. Its assertion is already wired; this completes the pair |
| *(none)* | **AC2b has no upstream story.** Epic residue, adopted here because this is the last story in the epic and the gate cannot be wired around it |

### References

- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) Class 3; **Amendment 1**; **Amendment 2(2)**
- `scripts/audit/try-fresh-install.sh` — verdict condition; see `dist-2-4` for the ENV_FAIL convention
- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) **Amendment 3(1)** — why the registry does not ship, and what the ruling leaves to the meta-model baseline
- [ADR-004](../planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md) C2 — why `scripts/audit/name-registry-integrity.js` shipping while its input does not is not an FR13 breach
- T32 — the **exemplar** of the class this epic addresses: a check that exists but is not enforced. **Already closed 2026-08-24 by `4556f4f0`** (that was `npm run docs:audit`). This story closes another *instance* of the class, which has no row of its own — it does not close T32. The original wording here read "the row this epic exists to close", which was taken at face value and propagated a false closure claim into two shipped files; corrected 2026-09-07.

---

## Commit Plan

```
fix(dist-2-3c): settle the CHANGELOG links and enforce the shipped-link gate
```

Body: the zero-finding output from AC3 **before** the wiring diff, the plant-and-restore
demonstration from AC5, the derived trajectory, and both packed-gate re-runs.

---

## Change Log

| Date | Change |
|---|---|
| 2026-09-07 | **Correction after `018ec89e` landed: this story does NOT close T32, and said it did in two shipped files.** T32 was closed **2026-08-24 by `4556f4f0`** — it was `npm run docs:audit` wired into CI, a different check. T32 is the *exemplar* of the class *a check that exists but is not enforced*; FR12's checker is another instance of that class and has no backlog row of its own. Corrected in `assert-shipped-links.js`, `try-fresh-install.sh`, this record, and the References line that caused it — which read *"the row this epic exists to close"* and was taken at face value instead of opened. `documentation-claims-must-be-derived`. **Not caught by either review pass**: Blind Hunter verified many claims but not this one, and the Acceptance Auditor audits against the spec, which is where the wrong premise lived. The phrase never reached `018ec89e`'s commit message, so only the source files and this record needed correcting. |
| 2026-09-07 | **Delta review of the Round 1 remediation — 4 more patches, 2 more defers.** Run because the set-equality clause of `code-review-convergence` failed: `scripts/audit/assert-shipped-links.js` had entered the change set and was never in the reviewed diff, so the fix Round 1 prompted had itself had zero review. Not a Round 2 (no HIGH) — this completes Round 1's coverage. Two findings were **wrong claims this story wrote or worsened**: the "ten self-referential links" figure in both gate files measured **21/15 today and 18/13 at baseline**, so it was already false before this story and staler after — `derive-counts-from-source`, in a file whose own text warns against literal counts; and the NFR10 gloss "a gate and its first fix never land together" is the **opposite** of the epic's NFR10 and was contradicted by the very clause it introduced. Also corrected: exit 1 does not imply a complete scan (`cannotRunAfterScan` returns it for findings-plus-incomplete), and "shipped" was used for a third meaning inside the docstring that exists to keep that word precise. Gates re-run: shipped-links 0/exit 0, harness PASS/exit 0, 2190 tests 0 fail, lint clean, backlog-integrity PASS. |
| 2026-09-07 | **Round 1 review — 3 layers as independent subagents, 3 patches applied, 2 deferred, 6 dismissed.** All three patches were defects the author did not see. (1) `docs/.npmignore`'s `README.md` was **unanchored**, so it excluded at any depth and would have silently dropped a future `docs/migration/README.md` — found independently by two layers, both by reproducing it. Anchored to `/README.md`; verified both directions. (2) `assert-shipped-links.js`'s module docstring still read *"NOT IN THE VERDICT... it is red today... READ THIS BEFORE PICKING UP 2.3c"* — this story rewrote that claim in `try-fresh-install.sh` and **missed the twin copy in the file the gate actually calls**, which is the exact doc-rot class the epic exists to close. (3) Story frontmatter contradicted a leftover HTML comment claiming `baseline_commit` was absent. Acceptance Auditor found **zero AC violations** and independently reproduced every falsifiable claim in the Dev Agent Record, including both self-reported deviations. Per `code-review-convergence`, **Round 2 not triggered** — 0 HIGH after triage, and all three patches are content-only. Gates re-run after patching: shipped-links 0/exit 0, harness PASS/exit 0, 2190 tests 0 fail, lint clean. |
| 2026-09-07 | **Implemented.** Findings 5 -> 0; gate wired blocking at `try-fresh-install.sh:479`; T32 closed. Two deviations from the story as written, both disclosed rather than reframed. (1) **AC1 created a finding class the story did not anticipate** — adding `docs/migration/` to `files[]` also ships `docs/README.md` and its 7 repository-only links, because npm keeps `README.md` in any directory it walks; the named-file form was tried and does not avoid it. Fixed with `docs/.npmignore`, the mechanism `dist-2-3a` established, plus 7 tests. AC3's escape clause did not apply: no sibling owns a class this story's own AC1 created (ADR-002 Amendment 3(2)). (2) **AC6's premise is false** — FR13 is NOT enforced; `$TREE` is absent from the verdict by design until `dist-2-6`, observed in this story's green run as `[installed-tree status 1]` alongside `PASS`. The note AC6 asked for would have been a false claim, so the accurate one was written instead. |
| 2026-09-07 | **AC2b added, with T3a.** A shipped-link finding that arrived in `154719e3` (2026-09-05) after ADR-002 drew its classes had no owning story and no backlog row; ADR-002 **Amendment 3(1)** rules it and this story adopts it, because AC3's *"Stop here if non-zero"* makes an unowned finding an epic blocker rather than a wiring delay. Trajectory table corrected against the committed tree — AC1+AC2 leave **1**, not 0, and the `9 -> 10` step is the new finding, not an error. |
| 2026-08-31 | Split from Story 2.3. AC2 settled per ADR-002 Amendment 2(2); AC3 added as an explicit stop-gate before wiring; AC5 added from the harness's fail-open history. |

---

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m]

### Debug Log References

### Completion Notes List

**AC3 — zero findings, recorded BEFORE the wiring diff was written.** Run against the packed
tarball at working tree on baseline `a4d5ce3f`, after T2/T3/T3a and before any edit to
`try-fresh-install.sh`:

```
$ npm pack && node scripts/audit/assert-shipped-links.js <tarball>/package .
    scanned 335 markdown file(s), 81 resolvable reference(s); self-referential prefix https://github.com/amalik/convoke-agents/
EXIT=0
```

Zero findings. 81 resolvable references clears the zero-extraction guard.

**Trajectory, derived at implementation time, and it did NOT match the story's table.**

```
at baseline a4d5ce3f          5   4 CHANGELOG.md, 1 lifecycle-process-spec.md
after T2 (docs/migration/)    7   <- WENT UP; see below
after docs/.npmignore         0
```

**T2 created a finding class the story did not anticipate, and this story owns it.** Adding
`docs/migration/` to `files[]` also shipped `docs/README.md`, which carries 7 relative links into
repository-only siblings (`agents.md`, `development.md`, `testing.md`, `references.md`, `faq.md`,
`BMAD-METHOD-COMPATIBILITY.md`, `../project-context.md`). npm keeps `README.md` in any directory it
walks.

Established by controlled experiment rather than inferred, because npm's packing rules have broken
four hand-written derivations in this repository already:

| `files[]` entry | what npm ships under `docs/` |
|---|---|
| *(none)* | `[]` |
| `docs/migration/` | guide **and** `docs/README.md` |
| `docs/migration/3.x-to-4.0.md` (named file) | guide **and** `docs/README.md` |
| `docs/migration/` + `docs/.npmignore` | guide only |

Narrowing the entry does not help — the named-file form was tried and rejected on measurement, not
on taste. The fix is `docs/.npmignore` naming `README.md`, which is the mechanism `dist-2-3a`
established for `scripts/migration/format-conversion/` and whose file documents why it is preferred
over a `!` negation in `files[]`: a negation puts a glob metacharacter into the array that
`installed-tree.js` parses to build the expected `_bmad/bme/*` module set.

This is **ADR-002 Amendment 3(2)** applying to the story whose author wrote it: *a document
entering shipped space brings its own outbound links with it, and the story that moves it owns
them.* AC3's escape clause — *"the remedy belongs to whichever sibling story owns that class"* —
does not apply, because no sibling owns it: AC1 created it.

**AC4 — wired blocking.** `$LINKS` added to the verdict condition at
`scripts/audit/try-fresh-install.sh:479`, one edit adding one variable alongside `INSTALL`,
`DOCTOR`, `EXPORT` and `FAILED`. `grep -rc continue-on-error` over the harness and `ci.yml` returns
`0` in both. The FAIL diagnostic now names the axis (`links=$LINKS`), without which a red run says
the gate fired but not which one. The stale comment claiming the checker is *"DELIBERATELY NOT IN
THE VERDICT"* was rewritten rather than left to contradict the code.

**AC4 — the ENV_FAIL trade, which the harness comment left open for this story to weigh.** The
checker exits 2 when the package ships no markdown at all or `repository.url` stops parsing — both
product defects that leave the harness as ENV_FAIL rather than as findings. Checked against the
workflow rather than assumed: `.github/workflows/ci.yml:381` runs the harness as a plain `run:`
step, which collapses exit 1 and exit 2 into the same failed step, and `publish` `needs:` this job.
So both block equally and there is **no fail-open** — the trade costs diagnosis, not enforcement.
Accepted on those terms and recorded in the file.

**AC5 — proven able to fail, both directions.** A broken relative link was planted in a shipped
`.md` (`CHANGELOG.md`), the full harness run, then restored and re-run.

```
PLANTED   FAILED: CHANGELOG.md:1208 -> ./this-file-does-not-exist-dist-2-3c.md
          1 finding(s) across 1 file(s)   [shipped-links status 1]
          FAIL — a new user would hit this.
          install=0 doctor=0 export=0 bins_failed=0 links=1

RESTORED  scanned 335 markdown file(s), 81 resolvable reference(s)
          [shipped-links status 0]
          PASS — a new user gets a working, self-consistent install.
          HARNESS_EXIT=0
```

**The diagnostic line is the proof, not the FAIL.** `install=0 doctor=0 export=0 bins_failed=0`
means every pre-existing axis was clean: before this story's wiring that same run printed PASS. The
planted link is caught by the new axis and by nothing else. Plant confirmed removed —
`grep -c` for the planted text in `CHANGELOG.md` returns `0`.

**AC5 — fail-closed.** `$LINKS` is set by `|| LINKS=$?` from a direct `node` invocation, not by a
command substitution, and the `-ne 0 && -ne 1` guard above exits `ENV_FAIL` if the checker did not
run. The path this story adds to the pass/fail decision introduces no command substitution and
cannot report health without executing. The pre-existing substitutions feeding `$EXPORT` and
`$FAILED` are unchanged by this story; their role in the verdict is exactly what it was.

**AC6 — DEVIATION. The premise is false and the note it asks for would have been a false claim.**
AC6 asks Completion Notes to record *"that FR12 and FR13 are both now enforced in the same job."*
FR12 is enforced as of this story. **FR13 is not.** `$TREE` is deliberately absent from the verdict
condition — `dist-2-6` wires it — and the harness comment at `:370` says so explicitly. Observed in
this story's own green run, in the same output:

```
    FAILED: _bmad/bme/_portability/ is in files[] but did not arrive in the project
    [installed-tree status 1]
    ...
PASS — a new user gets a working, self-consistent install.
```

An assertion reporting a real finding while the job it runs in exits 0. **The accurate statement:
both checks now RUN in the same job; only FR12 blocks.** Recorded this way rather than reframed as
compliance, because a story record asserting FR13 is enforced is exactly the class ADR-001 D5 was
caught in — a governance artifact naming an assertion that does not exist.

**AC6 — the boundary, which does hold and is worth restating.** The shipped-link checker sees what
the docs *claim*: a documented reference that does not resolve inside the package. The installed-tree
assertion sees what *arrives*: a shipped module absent from a real install. Neither subsumes the
other — this checker cannot see a file read at runtime but absent from the package, and that
assertion cannot see a broken link. `_bmad/bme/_portability/` is the live demonstration: it ships,
it does not install, and the link checker has nothing to say about it.

**NOT T32 — corrected 2026-09-07, after `018ec89e` had landed.** This section originally read
*"T32 is closed. The row this epic exists to close was a check that exists but is not enforced. It
is enforced."* **T32 was already closed on 2026-08-24 by `4556f4f0`**, and it was `npm run
docs:audit` wired into the `agent-surface-parity` job — a different check, closed two weeks before
this story began.

What is true: T32 is the **exemplar** of the class *a check that exists but is not enforced*. FR12's
checker was another instance of that class, and it had **no backlog row of its own**. This story
closes the instance, not the row.

The error came from reading this story's own References line — *"T32 — the row this epic exists to
close"* — at face value instead of opening the row. `documentation-claims-must-be-derived`, and
`verification-basis`: an artifact's self-description is not evidence about a different artifact.
Neither review pass caught it. Blind Hunter verified many factual claims but not this one, and the
Acceptance Auditor audits against the spec, which is where the wrong premise lives. It reached two
shipped source files before a status check on the row surfaced it.

**Gates, all run against this change.**

```
shipped-links        0 findings, exit 0   (335 .md, 81 resolvable references)
fresh-install        PASS, exit 0
agent-surface-parity PASS — 12 agents, menu codes and config-load preserved
npm test             2190 tests, 2189 pass, 0 fail, 1 skipped
lint                 clean (eslint --max-warnings 0)
docs:audit           zero findings
refs:audit           657 broken — unchanged from baseline, none in files this story touched
backlog-integrity    PASS — 815 rows
bash -n              OK
```

`refs:audit` is a pre-existing FAIL at 657 and is not a regression: the count was 657 before this
story began. It is not wired into CI.

### File List

**Modified**
- `package.json` — `docs/migration/` added to `files[]`; `//files` doc key extended
- `CHANGELOG.md` — two repository-facing links rendered as self-referential absolute URLs
- `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md` — name-registry citation rendered absolute (AC2b)
- `scripts/audit/try-fresh-install.sh` — `$LINKS` wired into the verdict; two stale comment blocks corrected
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions
- `_bmad-output/implementation-artifacts/dist-2-3c-settle-the-changelog-links-and-wire-the-gate-in-blocking.md` — this record

**New**
- `docs/.npmignore` — excludes `docs/README.md`, which npm ships alongside any `docs/` entry. Pattern **anchored** (`/README.md`) per Round 1 review
- `tests/lib/docs-packaging.test.js` — 7 tests: the guide ships, `docs/README.md` does not, the exclusion is not vacuous, and the rule is anchored

**Also modified at Round 1 review**
- `scripts/audit/assert-shipped-links.js` — module docstring corrected; it still claimed the checker was outside the verdict after this story put it inside
