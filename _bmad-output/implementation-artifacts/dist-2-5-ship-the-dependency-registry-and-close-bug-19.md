---
baseline_commit: be98b8ab6eddf3f05cf17db1ffbfaf9d119778fd
---
# Story 2.5: Ship the dependency registry and close BUG-19

Status: done

<!-- baseline_commit deliberately ABSENT — stamped by dev-story at implementation start. -->

> **Rescoped 2026-08-31, and renamed.** Was *"Close BUG-19 — ship the registry and fix the label
> that contradicts it"*. **FR17, the label half, already shipped** in `21ae3105` — a commit whose
> own subject names this story. What remains is FR18 plus the copy step FR18 alone does not provide.

## Story

As a **Convoke operator**,
I want `convoke-doctor` to find the dependency registry after an npm install,
so that **a healthy install does not warn me about a file that simply was not shipped**.

### What this story is, in one line

Put `_bmad/_config/bmm-dependencies.csv` in `files[]` **and** give it a copy path into the user's
project — because `files[]` alone gets it as far as `node_modules/` and no further.

---

## Acceptance Criteria

**AC1 — The file is in the package**

**Given** `_bmad/_config/bmm-dependencies.csv` is git-tracked but absent from `files[]`, whose only
`_bmad/_config/` entry is `skill-manifest.csv` — verified 2026-08-31: `grep -c bmm-dependencies
package.json` returns **0**
**When** this story completes
**Then** the file is in the package, confirmed by inspecting a real `npm pack` output rather than
the diff

**AC2 — And it reaches the project, which `files[]` alone does not achieve**

**Given** `refreshInstallation` copies `_bmad/_config/` **per named file, never as a directory** —
`skill-manifest.csv` is seeded at `:551`/`:585`, `workflow-manifest.csv` at `:876`, `agents/` at
`:983`, and **`bmm-dependencies.csv` appears in no copy or seed path anywhere in
`scripts/update/lib/`** (verified 2026-08-31)
**When** an install or refresh runs
**Then** the file arrives in the user's project at `_bmad/_config/bmm-dependencies.csv`
**And** the story states plainly that **AC1 without AC2 does not close BUG-19** — it would move the
file from *absent everywhere* to *present in `node_modules/` and still absent where the doctor
looks*, which produces the identical warning and a false belief that it was fixed
**And** the copy honours `isSameRoot`, as every sibling copy block does

**AC3 — Proven against an installed package, not this repository**

**Given** this repository has reported `✓ registry consistent` since the file was committed, while
nothing changed for any npm-installed operator — the population BUG-19 came from
**When** the fix is verified
**Then** `convoke-doctor` is run inside a **fresh install in a clean project**, and the
BMM-dependency check does not report the registry absent
**And** the verification is **not** performed in this repository, where it cannot fail

**AC4 — `dist-2-4`'s assertion covers it, and is seen to**

**Given** `dist-2-4` shipped an installed-tree assertion whose red demonstration fired on **both**
`_portability` and `bmm-dependencies.csv`
**When** this story completes
**Then** that assertion is re-run and observed **no longer reporting `bmm-dependencies.csv`**
**And** `_portability` is still reported, since `dist-2-6` has not landed — so the assertion is
demonstrably still red for the right reason, not green for the wrong one
**And** the assertion is **not** wired into the verdict by this story; `dist-2-6` does that

**AC5 — NFR8: the soft-warn contract is untouched**

**Given** NFR8 — `preflight-soft-warn` must remain intact, and BUG-19(b) is out of scope
**When** this story completes
**Then** `softWarning: true` and the exit-0 pass-through in `checkBmmDependencies` are unchanged
**And** the `fix:` line's pinning to the running build (`npx -p convoke-agents@${pv}`, per BUG-16)
is preserved
**And** the FR17 label shipped in `21ae3105` is **not re-edited** — it already reads
`'BMM dependencies: registry missing'` on the absent branch

**AC6 — BUG-19 closes, as a move**

**Given** both halves are now delivered — FR17 in `21ae3105`, FR18 here
**When** this story completes
**Then** backlog row **BUG-19** is closed **as a move**: status flipped, row deleted from the Bug
Lane, receipt appended to §2.5, Change Log entry added — all in the same edit
(`backlog-write-discipline`; closing a row is a MOVE, not a status edit)
**And** `node scripts/audit/backlog-integrity.js` is run and its result pasted into the commit
Description
**And** the `sprint-status.yaml` divergence warning naming this story clears

---

## Tasks / Subtasks

- [ ] **T1** — Add `_bmad/_config/bmm-dependencies.csv` to `files[]`; confirm against `npm pack` (AC1) — **NOT DONE, AND DELIBERATELY SO. Superseded by operator ruling 2026-09-01; see Completion Notes §1. Left unchecked rather than ticked, because it was not performed — the reviewer rules on AC1, not the implementer.**
- [x] **T2** — Add the copy/seed path, mirroring the named-file blocks; honour `isSameRoot` (AC2) — delivered as a **generate** path, not a copy path
- [x] **T3** — Fresh install in a clean temp project; run `convoke-doctor`; record output (AC3)
- [x] **T4** — Re-run `assert-installed-tree.js`; confirm one finding remains, not zero (AC4)
- [x] **T5** — Regression test for the copy, isolated fixture (`test-fixture-isolation`)
- [x] **T6** — Close BUG-19 as a move; run `backlog-integrity.js` (AC6)

---

## Dev Notes

### What changed, and the design lesson in it

This story was deliberately created by **merging** FR17 and FR18 on 2026-08-19, so that one story
would close BUG-19 "by it alone" — the epic subtracted an earlier two-epic split for exactly that
reason. FR17 then shipped separately anyway, in `21ae3105`, which is the outcome the merge existed
to prevent. The 2026-08-30 readiness assessment found the story still reading `backlog` with half
its substance already delivered.

`sprint-status.yaml` was left at `backlog` deliberately rather than flipped, on the grounds that
re-scoping is an authoring job and `done` would be a false claim. **This story is that re-scope.**

### The trap this story exists to avoid

`files[]` membership and project presence are different things, and this file needs both. The
package's `_bmad/_config/` is assembled **per named file**, so adding an entry to `files[]` gets the
file into `node_modules/convoke-agents/_bmad/_config/` and stops there. The doctor reads
`path.join(projectRoot, BMM_DEPS_CSV_REL)`. Ship without copy and the warning is unchanged — while
every gate and every reviewer sees a `files[]` diff that looks like the fix.

This is ADR-004 C4 restated on a different file: *shipping is not installing; installing is not
invoking.*

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-4` | **Shipped.** Its red demonstration covered this file; AC4 re-runs it |
| `dist-2-6` | **Blocked on this.** Its AC8 wires the assertion only when it has no findings left, which needs this story **and** 2.6's own `_portability` fix |
| `BUG-19` | Closes here (AC6) |

### References

- `scripts/convoke-doctor.js` — `checkBmmDependencies`, FR17 label shipped in `21ae3105`
- `scripts/update/lib/refresh-installation.js:551`, `:585`, `:876`, `:983` — the named-file copy pattern to mirror
- `scripts/audit/assert-installed-tree.js` — the assertion from `dist-2-4`
- ADR-004 C4 — shipping is not installing

---

## Commit Plan

```
fix(dist-2-5): ship the dependency registry and close BUG-19
```

Body: the `npm pack` confirmation, the clean-project doctor output, the `assert-installed-tree`
before/after showing one remaining finding, and the `backlog-integrity.js` result for the BUG-19
move.

---

## Change Log

| Date | Change |
|---|---|
| 2026-09-01 | Implemented. **AC1/T2 superseded by operator ruling:** the specified copy of the package registry was measured, on a real fresh install, to replace `registry missing` with `[stale:skill-gone]` — the package's only row names a skill directory no install path creates. `files[]` unmodified. (That first implementation seeded a project SCAN; Round 1 rejected it — superseded by the 2026-09-02 row above.) Fresh install: 27-passed-1-warning → **all 28 passed**. Two tests re-based (not relaxed); 4-mutant verification includes one reproducing the story-as-written defect. |
| 2026-08-31 | Rescoped and renamed. FR17 shipped separately in `21ae3105`; ACs reduced to FR18 plus the copy step. AC2 added — `files[]` alone leaves the file in `node_modules/`, since `_bmad/_config/` is copied per named file. AC4 added to keep `dist-2-4`'s assertion honestly red. |

---

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m] (Amelia / bmad-dev-story), Round 1 review by three independent subagent layers.

### Debug Log References

**Pre-implementation measurement** — `try-fresh-install.sh` against a real packed tarball, each
candidate applied to the SAME installed project:

| Fixture | `convoke-doctor` |
|---|---|
| No CSV — the shipped state | `⚠ registry missing` (BUG-19) |
| Package CSV copied verbatim — **T1+T2 as specified** | `⚠ [stale:skill-gone] bmad-register-skill` |
| **Header-only, no rows — shipped** | `✓ registry consistent — 0 auto-scan + 0 manual rows` |

**Post-Round-1 verification** — real fresh install, all four states on one tarball:

| State | Result |
|---|---|
| A. Empty project | `All 28 checks passed. Installation looks healthy!` |
| B. + an operator's unregistered custom skill | `⚠ [unregistered] operator-owned-skill → bmad-agent-pm` — correct signal, FR17 detection preserved |
| C. `convoke-register-skill` on that skill | `✓ Registered … EXIT=0` |
| D. Doctor after registering | `All 28 checks passed`; row reads `registered_by: operator` |

Gate falsifiability: `install-scope-check.js` mutation-verified — adding one write op to
`audit-bmm-dependencies.js` turns it red (`Write ops: 4 (snapshot: 3)`, exit 1), restored exit 0.

### Completion Notes List

**1. AC1 superseded, and Round 1 confirmed the reasoning independently.**
The story specified `files[]` + a copy. Measured before any code: the package registry's sole row is
an `auto-scan` row for `bmad-register-skill`, a skill absent from `files[]` and generated by no
install path, so copying reports `[stale:skill-gone]` — stale by construction in every user project.
AC3 would have passed on the letter (the doctor stops saying *absent* and starts saying *stale*).
The Acceptance Auditor independently traced `installed-tree.js:207`, `assert-installed-tree.js`,
`convoke-doctor.js`, `scripts/portability/**` and `ci.yml` and found **nothing** requiring the file
in `files[]` or inside `node_modules/`. `package.json` is unmodified.

**2. The registry is seeded EMPTY — and the first implementation was wrong about this.**
Seeding `scanBmmDependencies` output looked right; it is what the doctor's `fix:` line tells the
*operator* to run. But the installer is not the operator. On any project with pre-existing custom
BMM-dependent skills it stamped THEIR rows `registered_by: auto-scan`, a reserved marker — which
(a) made `convoke-register-skill` hard-fail `exit 1` with `Duplicate triple … registered by
auto-scan` on the exact path it exists to serve, and (b) permanently suppressed the doctor's FR17
`unregistered-custom-skill` category, so it reported `✓ registry consistent` over an ungoverned
tree. Found by the Blind Hunter, reproduced twice. **The original AC3 evidence was measured on a
project with no custom skills and so could not see it** — the "All 28 checks passed" headline was
true and unrepresentative. Operator ruled header-only 2026-09-01. An empty registry claims nothing.

**3. The write is an INLINE atomic create-if-absent — and it got here the long way.**
`writeFileSync` to a sibling temp, `linkSync` to publish, `unlinkSync` to reclaim. The content is
complete before the target name exists, so no reader can see a torn registry — which matters
because a torn file here is **permanent**: seeding is absence-only, and `mergePreservingManual`
preserves a fragment row as `manual`, so even `convoke-audit-bmm-deps` cannot heal it (reproduced
under `ulimit -f 1`). `linkSync` fails `EEXIST` atomically, which closes the check-then-act window
`lstat` alone leaves open — Round 2 measured 6-10 ms and destroyed a real concurrent
`convoke-register-skill` commit through it. The content write is INSIDE the `try`, so the `finally`
reclaims the temp on every path — Round 3 measured the alternative: a short write (ENOSPC/EDQUOT/EIO
create the file, then throw part-way) escaped before the reclaim and stranded one stray per attempt,
which `.gitignore`'s `*.tmp` does not match. The helper this replaced guards that with a `tmpCreated`
flag; an inline copy less careful than the thing it replaced is not a simplification. Round 1 had delegated to `audit-bmm-dependencies.js`'s
`_atomicWrite`; **that was reverted because delegating hid the write from `install-scope-check.js`**,
whose `WRITE_OP_RE` counts literal `fs.*` calls per file — see note 5.

**4. `lstat`, not `existsSync` — but not for the reason Round 1 gave.** `existsSync` follows
symlinks and reports a dangling one as absent. Round 1 recorded the hazard as *"the installer would
write outside the project"*, which was true of the `writeFileSync` implementation of the time and is
**false** of this one — `linkSync` fails `EEXIST` on the link itself and never follows it. The
surviving hazard is narrower and still real: an operator who symlinked this path into a dotfiles
repo must keep their symlink rather than have it replaced. The test now asserts that.

**5. The scope gate went green by INVISIBILITY — twice — and neither time was a pass.**
The first implementation took `refresh-installation.js` to 11 write ops against a snapshot of 10:
`install-scope-check.js` exit 1, wired at `ci.yml:155` inside a job `publish` depends on, so it
would have taken `main` red. My original gate list omitted it entirely. Delegating to `_atomicWrite`
returned the count to 10 and the gate to green — **but only because the write had moved into a file
the checker does not inspect.** Round 1's fix (tracking that file) did not close it either: it pins
`_atomicWrite`'s three internal ops, not the caller, and Round 2 reproduced a new write from
`refresh-installation.js` into the forbidden `_bmad/core/` passing GREEN. Three failed attempts at
one protection is the convergence rule's restructure trigger. Fixed by bringing the primitives back
inline where they are counted (snapshot **10 → 13**, derived with the checker's own regex), and by
teaching that regex `linkSync`/`link` — it knew `renameSync` but not `linkSync`, though both publish
a name at a destination. Verified no tracked file used `fs.link*`, so no existing snapshot shifted.
Mutation-verified in both directions: the `_bmad/core/` probe now exits 1 — via the snapshot delta,
not the path rule, since `FORBIDDEN_PATTERNS` matches literal `/_bmad/core/` substrings and a
`path.join(…, '_bmad', 'core', …)` call contains none. **Known residue, filed not fixed:** the
`fs.ensureDirSync` on the line above is a fourth write into the operator's project that `WRITE_OP_RE`
cannot count, because no fs-extra helper is in its alternation. That gap predates this story and is
deferred to the backlog rather than widened here.

**6. AC6's third bullet — unmet while this was written, SATISFIED 2026-09-02.**
The `sprint-status.yaml` divergence warn named `dist-2-5` for as long as the story sat at `review`;
it is a function of that status, not of the code. On the operator's flip to `done` (2026-09-02,
after CI went green on `c52e9fe0`, whose tree is byte-identical to `529c6969` over `scripts/` and
`tests/`) `backlog-integrity.js` emits **no divergence block at all**. All three AC6 bullets now
hold. Recorded forward rather than rewritten: the paragraph above stated the truth at the time, and
my earlier record had listed the three owed-close warns as though they were the whole output — they
were not, which is the error worth keeping visible.

**7. AC5 untouched.** `scripts/convoke-doctor.js` has **no** diff. `softWarning: true`, the exit-0
pass-through, the `npx -p convoke-agents@${pv}` pinning and the FR17 label from `21ae3105` are all
at HEAD state.

**8. THE SAME TEST WAS A PHANTOM TWICE, and the cause was one habit of mine, not two bugs.**
v1 (`writes atomically, leaving no temp file behind`) asserted that no temp was left — which a
direct write satisfies trivially by creating none. Round 2 caught it. v2 made the write throw and
asserted the target was absent — but a direct write that throws also creates no target, so it
passed against a zero-atomicity implementation too. Round 3 caught that.

**Why I missed it the second time is the part worth recording.** I ran mutants and reported
`fail 1`, and I did not check *which* test failed. It was the race test, every time; the atomicity
test survived all four. I reported the file as mutation-verified on that basis. A mutation run that
does not name the dying test proves only that *something* broke.

v3 asserts the property that actually separates the implementations — **content is never written
to the published name** — which a direct write cannot satisfy however it terminates. The battery
now reports per-test attribution:

| Mutant | Test(s) that die |
|---|---|
| M1 direct write to the published name | *never writes content to the published name*; *reclaims temp*; *does not clobber* |
| M2 temp write aimed at the target | *never writes content to the published name*; *reclaims temp*; *does not clobber* |
| M3 `renameSync` for `linkSync` | *does not clobber* |
| M4 write moved outside the `try` | *reclaims the temp file when the content write fails part-way* |
| M5 no temp reclaim | *reclaims temp*; *does not clobber* |

Every test is load-bearing: M3 and M4 are each killed by exactly one.

**9. Two tests re-based, not relaxed** — both asserted the BUG-19 behaviour. The Blind Hunter
independently ran the HEAD versions against the new code and confirmed both genuinely broke, and
re-ran all four implementation mutations. The absent-registry branch retains coverage at
`tests/unit/bmm-dependencies-doctor.test.js:67` and `tests/integration/convoke-doctor.test.js:366`.

**10. Gates — all five, true exit codes (`verification-pipefail`).** lint 0 · `install-scope-check`
0 · `docs:audit` 0 · `backlog-integrity` 0 (PASS) · `npm test` **1970 / 1969 pass / 1 pre-existing
skip**.

### File List

- `scripts/update/lib/refresh-installation.js` — `seedBmmDependencies` (header-only; inline `writeFileSync`/`linkSync`/`unlinkSync` atomic create-if-absent; `lstat` fast path) + call site + export
- `scripts/audit/lib/installed-tree.js` — `RUNTIME_DATA_FILES` entry re-based from `arrivesVia: null`
- `scripts/audit/install-scope-check.js` — `WRITE_OP_RE` extended with `linkSync`/`link`; `refresh-installation.js` re-pinned 10 → 13; `audit-bmm-dependencies.js` tracked (`expected: 3`) with its rationale corrected
- `tests/unit/refresh-installation-bmm-deps.test.js` — **new**: 9 tests, incl. the auto-registration, atomicity, race and symlink regression guards
- `tests/unit/convoke-update-governance.test.js` — NFR9 vehicle re-based
- `tests/unit/convoke-register-skill.test.js` — CSV-absent fixture made true again
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — BUG-19 closed as a move + Change Log
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions
- `_bmad-output/implementation-artifacts/dist-2-5-ship-the-dependency-registry-and-close-bug-19.md` — this record

## Change Log

| Date | Change |
|---|---|
| 2026-09-02 | **Flipped to `done` by the operator.** Decision evidence beyond the local gates: CI green on `c52e9fe0` across `fresh-install`, `agent-surface-parity` (which carries `install-scope-check`), `package-check`, `lint`, `coverage`, `security` and `test` on Node 18/20/22, with `publish` correctly skipped (no `v*` tag). `fresh-install` is the material one — it runs no `npm ci` and catches the *works in this repo and nowhere else* class (I135/I137/I139) that a local run cannot. **A Round 4 was considered and declined:** the unreviewed surface was ~40 lines (one moved statement, one new test), the residual risk is a regression guard that might not guard rather than a shipped defect, and product behaviour was separately verified across four install states on a packed tarball. **Carried risk, stated:** CI is ubuntu-only (T106) and nothing exercises `linkSync` on Windows filesystems. AC6's divergence warn cleared on this flip. |
| 2026-09-02 | **Round 3 (final round): 3 HIGH, 3 MEDIUM, 5 LOW — again including defects in the previous round's corrections.** (a) The *replacement* atomicity test still could not fail: its mock threw before writing, which a zero-atomicity implementation also satisfies. Rewritten a third time to assert that content never reaches the published name; killed by two mutants that previously passed. (b) The temp write sat outside its own `try`/`finally`, so a short write stranded one stray per attempt — the exact outcome its comment claimed to prevent; moved inside, and the reclaim assertion made load-bearing. (c) Both BACKLOG entries still described the reverted `_atomicWrite` delegation as shipped and repeated an `lstat` rationale the story had retracted; corrected. Also: two more wrong line citations, inside the comment arguing that citations must be proven. **No Round 4 per `code-review-convergence`** — these fixes are unreviewed and disclosed as such; the `ensureDirSync` scope-gate gap and the `convoke-audit-bmm-deps` fix-line trap are deferred to the backlog. |
| 2026-09-02 | **Round 2 review (3 layers): 3 HIGH, 4 MEDIUM, 4 LOW — and the HIGHs were defects in ROUND 1'S OWN CORRECTIONS**, which is `code-review-convergence`'s restructure trigger, so the write mechanism was changed rather than patched a third time. (a) The `install-scope-check.js` entry Round 1 added did **not** restore the signal — delegating to `_atomicWrite` moved the write out of the checker's counted unit, and a new write into the forbidden `_bmad/core/` passed GREEN; reproduced. (b) The `writes atomically` test **could not fail** — swapping `_atomicWrite` for a plain write left it green, so the dependency had zero coverage. (c) The TOCTOU race I reported as *dissolved* had not dissolved; a concurrent `convoke-register-skill` commit was destroyed inside a measured 6-10 ms window. **Restructured:** the atomic write is now INLINE — `writeFileSync` to a sibling temp, `linkSync` to publish (fails `EEXIST` atomically, closing the race), `unlinkSync` to reclaim — so all three ops are literal `fs.*` calls the checker counts (snapshot 10 → 13), `linkSync`/`link` added to `WRITE_OP_RE`, and the atomicity property was given a new test — **which Round 3 then proved still could not fail; see the row above.** Comment-vs-code divergences in `installed-tree.js` and the story record corrected. |
| 2026-09-01 | **Round 1 review (3 layers): 3 HIGH, 3 MEDIUM, 6 LOW.** Restructured rather than patched. Scan-seeding replaced with a HEADER-ONLY registry — the scan variant auto-registered operators' own skills under the reserved `auto-scan` marker, breaking `convoke-register-skill` and suppressing the doctor's unregistered-skill detection. Added `_atomicWrite` (a torn registry was permanent and unhealable), `lstat` (a dangling symlink made the installer write outside the project), and tracked `audit-bmm-dependencies.js` in `install-scope-check.js` (the gate had gone green by invisibility). AC6's divergence bullet recorded as unmet. |
| 2026-09-01 | Implemented. **AC1/T2 superseded by operator ruling:** the specified copy of the package registry was measured, on a real fresh install, to replace `registry missing` with `[stale:skill-gone]`. `files[]` unmodified. |
| 2026-08-31 | Rescoped and renamed. FR17 shipped separately in `21ae3105`; ACs reduced to FR18 plus the copy step. AC2 added — `files[]` alone leaves the file in `node_modules/`, since `_bmad/_config/` is copied per named file. AC4 added to keep `dist-2-4`'s assertion honestly red. |
