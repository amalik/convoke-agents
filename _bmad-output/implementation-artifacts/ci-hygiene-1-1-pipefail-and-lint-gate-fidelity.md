# Story ci-hygiene-1.1: Add pipefail to CI workflow + `verification-pipefail` rule to project-context + lint `--max-warnings 0`

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [ci-hygiene-epic-1 — CI Hygiene: Pipefail & Lint Gate Fidelity](../planning-artifacts/convoke-epic-ci-hygiene.md) (cross-cutting CI gate-fidelity bundle; single-story mini-epic following `lint-epic-1` / `cov-epic-1` / `i97-bug-epic-1` precedent)
**Origin:** [2026-05-11 CI/CD review](convoke-note-initiative-lifecycle-backlog.md) (Winston Architect + Quinn QA parallel dispatch) surfaced 15 findings; top 3 (A47, I103, I104) bundled here as the "30-min quick win" sequencing called out in the operator's review wrap.
**Sprint:** inline before next story authoring (so Mila's R1 review and any successor inherit the new pipefail rule)
**Namespace decision:** No new skills or `_bmad/bme/` content. Work touches: (1) [project-context.md](../../project-context.md) (new rule), (2) [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (one block addition), (3) [package.json](../../package.json) (one flag addition). The `namespace-decision-for-new-skills` rule from [project-context.md](../../project-context.md#rule-namespace-decision-for-new-skills) is N/A by construction. The `covenant-compliance-for-convoke-skills` rule is also N/A — no `_bmad/bme/` content touched.
**Safety analysis (path-safety rule):** N/A — config edits only; no scripts that accept user paths or perform destructive operations are added or modified.

## Story

As the platform maintainer (Amalik) and any future dev agent authoring a Convoke story,
I want (a) the workflow shell to propagate piped-step exit codes, (b) story Task verification commands to be forbidden from masking exit codes via `tail`/`head`/`grep`, and (c) `npm run lint` to fail on any warning,
so that the 4-day CI red of 2026-05-01 → 05 (which was diagnosed via party-mode because two of its causes were silently masked) cannot recur — same lesson encoded at three layers: rule (humans), workflow (CI), and gate (eslint).

## Context & Motivation

The [2026-05-05 session retrospective](session-retro-2026-05-05-cov-and-i97-bug.md) for `cov-epic-1` + `i97-bug-epic-1` identified that the dev verification step `npm run test:coverage 2>&1 | tail -15; echo "EXIT: $?"` captured `tail`'s exit code (always 0), not the upstream command's. The dev-story Task 4.4 reported "EXIT: 0" while the actual exit was 1 with 12 P0 failures. Round 1 code review caught the false-positive only because R1 ran the same command independently with `set -o pipefail`.

The retro logged **AC-RETRO-1** as the forward-prevention fix: codify a `verification-pipefail` rule in [project-context.md](../../project-context.md). The action item said "Bob (SM) on next story authoring; Pre-next-story" — and this *is* the next story authoring window.

Independently, the [2026-05-11 CI/CD architectural review](convoke-note-initiative-lifecycle-backlog.md) (Winston + Quinn) surfaced two adjacent gaps:

- **I103** — the same pipefail lesson at the **workflow** layer: GitHub Actions' default `bash` invocation includes `-e` but not `-o pipefail`, so any future piped `run:` step would silently lie regardless of the project-context rule. No current `ci.yml` step uses pipes, so blast radius is small — but one-line workflow hardening eliminates the latent class entirely.
- **I104** — the **lint** gate doesn't enforce zero warnings: `package.json:48` runs `eslint scripts/ index.js tests/` without `--max-warnings 0`, so any future `no-unused-vars` warning (configured as `warn` in [eslint.config.mjs:30](../../eslint.config.mjs#L30)) slides through CI green. This contradicts the existing `lint-passes-before-review` rule which mandates zero warnings on touched files. Rule and gate currently disagree.

All three fixes are different layers of the same lesson: **gate text and gate behavior must agree**. Bundling them here means one R1 review covers all three (the established `cov-1.1` / `lint-1.1` shape).

**Current lint state (verified 2026-05-11 by `npm run lint`):** zero errors, zero warnings. AC3 is truly a one-flag addition with no remediation needed at authoring time. Dev agent re-verifies at implementation time.

## Acceptance Criteria

**AC1 — `verification-pipefail` rule added to [project-context.md](../../project-context.md).**
**Given** the existing project-context.md has rules encoded for dev agents (`test-fixture-isolation`, `lint-passes-before-review`, `code-review-convergence`, etc., adjacent at §lint-passes-before-review)
**When** the story is implemented
**Then** a new rule titled `verification-pipefail` is added with the standard 3-section structure (**Statement**, **Why**, **How to apply**) — match tone/format of adjacent rules (no decorative emojis or non-standard sectioning)
**And** the rule statement explicitly forbids the `cmd | tail|head|grep ; echo $?` pattern and prescribes either `set -o pipefail` at the shell-script level OR `${PIPESTATUS[0]}` for the upstream exit code
**And** the rule cites [session-retro-2026-05-05-cov-and-i97-bug.md](session-retro-2026-05-05-cov-and-i97-bug.md) as the scar-story evidence (specifically the cov-1.1 Task 4.4 HALT discovery)
**And** the rule is placed adjacent to `lint-passes-before-review` (process conventions grouped); inserted via Edit, no reordering of existing rules
**And** running `grep -c "verification-pipefail" project-context.md` returns **≥ 3** post-fix (rule title + `Why` reference + at least one `How to apply` occurrence)

**AC2 — `defaults.run.shell: bash -eo pipefail {0}` added to [.github/workflows/ci.yml](../../.github/workflows/ci.yml).**
**Given** the current `ci.yml` has no top-level `defaults:` block (verified 2026-05-11 — file has `name:` / `on:` / `concurrency:` / `jobs:` only)
**When** the story is implemented
**Then** a top-level `defaults:` block is inserted between `concurrency:` (lines 10-12) and `jobs:` (line 14), matching this structure:
```yaml
defaults:
  run:
    shell: bash -eo pipefail {0}
```
**And** no `run:` step needs explicit `shell:` override (workflow default propagates to all jobs unless overridden at job or step level — none are currently)
**And** `gh workflow view ci.yml` or equivalent YAML parse succeeds (no syntax error introduced)

**AC3 — `npm run lint` requires zero warnings.**
**Given** [package.json:48](../../package.json#L48) currently reads `"lint": "eslint scripts/ index.js tests/"` and `npm run lint` exits 0 with zero warnings at story authoring (verified 2026-05-11)
**When** the story is implemented
**Then** the `lint` script is amended to include `--max-warnings 0`: `"lint": "eslint --max-warnings 0 scripts/ index.js tests/"`
**And** `npm run lint` continues to exit 0 (since baseline is already clean)
**And** if a regression has introduced warnings between authoring (2026-05-11) and dev pickup, the dev agent fixes them in scope and notes them in Dev Notes; **stricter alternative:** if any warning surfaces, dev HALTs and asks operator before proceeding (per `feedback_avoid_overcomplicating_audits` — defer ambiguity to operator rather than scope-creep)

**AC4 — Full CI green on the next push to `main` post-fix.**
**Given** GitHub Actions `ci.yml` currently runs green (last verified 2026-05-07 run 25367777820)
**When** the story is implemented and pushed to a branch + PR opened
**Then** every CI job (`lint`, `test (18|20|22)`, `coverage`, `security`, `package-check`, `python-test`) exits 0 — verified via `gh run list --workflow=ci.yml --limit 1` showing `completed success`
**And** the `burn-in` job (PR-only) also passes — note: burn-in is itself targeted for re-shape in I-103-adjacent backlog item T27, but stays as-is for this story
**And** on merge to `main`, the next `main` push run also goes green

## Scope Exclusions

- **The other 12 CI/CD review findings** triaged on 2026-05-11 (I102, I105, T25, T26, T27, T28, I106, I107, I108, I109, I110, I111). Each retains its own Fast Lane row; do not absorb here. Per epic NFR4.
- **Codifying AC-RETRO-2 (baseline-binds-to-AC) into `bmad-create-story` template.** This story *applies* AC-RETRO-2 in its Task 1 baseline-capture (per epic NFR5) but does NOT amend the `bmad-create-story` workflow template itself. That's a separate concern; log as backlog candidate if it recurs.
- **AC-RETRO-3 (I97 conversion ACs run full P0 surface).** Orthogonal; applies to I97 Epic 2 conversion stories.
- **Pre-commit hooks (husky, lefthook, etc.)** to enforce lint locally. Per `lint-epic-1` § Scope Exclusions precedent — CI enforcement + DoD + the new `verification-pipefail` rule are sufficient; local-hook friction is not warranted by current evidence.
- **Fixing any new lint warnings discovered at implementation time that fall OUTSIDE the 3 touched files.** If `npm run lint` surfaces warnings introduced by parallel work, the dev agent should: (a) fix if trivially obvious and clearly scoped to this story's "touched files" (per `lint-passes-before-review` semantics), (b) HALT and report to operator otherwise. Do not scope-creep into unrelated warning cleanup.

## Tasks / Subtasks

- [ ] **Task 1 — Capture pre-fix baseline** (AC1, AC2, AC3, AC4; baselines bind to AC verification commands per epic NFR5)
  - [ ] 1.1. AC1 baseline: `grep -c "verification-pipefail" project-context.md` → expected `0` (rule does not yet exist); record actual count in Dev Agent Record
  - [ ] 1.2. AC2 baseline: `grep -nE "^defaults:" .github/workflows/ci.yml` → expected zero matches; record
  - [ ] 1.3. AC3 baseline: `grep -E '"lint":\s*"[^"]*max-warnings' package.json` → expected zero matches; AND `npm run lint; echo "EXIT: ${PIPESTATUS[0]}"` → expected `EXIT: 0` with zero output (clean). If warnings have appeared since authoring, HALT and consult operator per Scope Exclusions clause
  - [ ] 1.4. AC4 baseline: `gh run list --workflow=ci.yml --limit 1 --branch main` → expected `completed success`; record run ID
  - [ ] 1.5. `git status` — confirm working tree matches expectations (clean except for any in-progress mini-epic spec/story file authoring artifacts)

- [ ] **Task 2 — Add `verification-pipefail` rule to project-context.md** (AC1)
  - [ ] 2.1. Read [project-context.md](../../project-context.md) and locate the `lint-passes-before-review` rule (search anchor: `## Rule: lint-passes-before-review`). The new rule will be inserted immediately AFTER this rule's closing `---` separator (or before the next `## Rule:` heading)
  - [ ] 2.2. Author the rule using the standard 3-section structure (**Statement**, **Why**, **How to apply**). Match tone/format of adjacent rules — citation-driven, no decorative emojis, link to the scar-story retro
  - [ ] 2.3. Required content:
    - **Statement** — Story Task verification commands using shell pipes MUST use `set -o pipefail` OR capture the upstream exit code via `${PIPESTATUS[0]}` (or equivalent for the shell in use). The pattern `cmd | head/tail/grep ; echo $?` is **forbidden** because it captures the rightmost command's exit code (always 0 for `head`/`tail` in normal operation), not the upstream command's actual exit code
    - **Why** — Direct cite of the 2026-05-05 retro: `npm run test:coverage 2>&1 | tail -15; echo "EXIT: $?"` reported "EXIT: 0" while the actual exit was 1 with 12 P0 failures across `tests/p0/p0-{emma,wade,mila}.test.js`. R1 code review caught the false-positive by running the same command with `set -o pipefail`. Link to [session-retro-2026-05-05-cov-and-i97-bug.md](_bmad-output/implementation-artifacts/session-retro-2026-05-05-cov-and-i97-bug.md) §What didn't go well
    - **How to apply** — At story authoring time: any Task that pipes its verification command MUST prefix with `set -o pipefail` (Bash) or use `${PIPESTATUS[0]}` (Bash) or use the per-shell equivalent. At dev pickup time: re-verify the rule applies to any added commands. At code-review time (especially R1 Edge Case Hunter): grep Task bodies for `| head\|| tail\|| grep` patterns and block if the rule isn't honored
  - [ ] 2.4. Save; re-read in editor; confirm tone consistency with adjacent rules
  - [ ] 2.5. Verify AC1 acceptance: `grep -c "verification-pipefail" project-context.md` returns ≥ 3

- [ ] **Task 3 — Add `defaults.run.shell: bash -eo pipefail {0}` to ci.yml** (AC2)
  - [ ] 3.1. Read [.github/workflows/ci.yml](../../.github/workflows/ci.yml) lines 1-14 to confirm insertion site (between `concurrency:` block and `jobs:` block)
  - [ ] 3.2. Insert the block:
    ```yaml
    defaults:
      run:
        shell: bash -eo pipefail {0}
    ```
    Placement: after line 12 (`  cancel-in-progress: true`), before line 14 (`jobs:`). Preserve surrounding blank line for readability
  - [ ] 3.3. Verify YAML parse: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` exits 0; or `gh workflow view ci.yml` succeeds against the local file's content (note: `gh workflow view` reads from remote — local parse is sufficient)
  - [ ] 3.4. Confirm AC2 acceptance: `grep -A2 "^defaults:" .github/workflows/ci.yml` returns the 3-line block

- [ ] **Task 4 — Add `--max-warnings 0` to package.json lint script** (AC3)
  - [ ] 4.1. Read [package.json](../../package.json) and locate the `"lint":` line (currently line 48: `"lint": "eslint scripts/ index.js tests/"`)
  - [ ] 4.2. Edit to: `"lint": "eslint --max-warnings 0 scripts/ index.js tests/"`. Preserve quoting and surrounding JSON structure
  - [ ] 4.3. Verify JSON parse: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf-8'))"` exits 0
  - [ ] 4.4. Run `npm run lint; echo "EXIT: ${PIPESTATUS[0]}"` → expected `EXIT: 0` (matches AC3 baseline). If non-zero, investigate: did a warning appear between authoring and now? Per Scope Exclusions, HALT and report to operator if any warning surfaces

- [ ] **Task 5 — Cross-update sprint-status.yaml backlog row provenance** (epic-level housekeeping)
  - [ ] 5.1. Update sprint-status.yaml: this story key (`ci-hygiene-1-1-pipefail-and-lint-gate-fidelity`) transitions from `ready-for-dev` → `in-progress` at dev pickup (handled by `bmad-dev-story` workflow automatically)
  - [ ] 5.2. No manual edit needed to the lifecycle backlog (the qualified rows A47, I103, I104 stay in §2.3 with status `Backlog`; they transition to `Done` only when the story ships per existing convention — i.e., update at story `done` time, not in this task)
  - [ ] 5.3. Skip if the dev-story workflow handles this automatically

- [ ] **Task 6 — Final verification** (AC4)
  - [ ] 6.1. `npm run lint` → exit 0, zero warnings (AC3 acceptance + regression guard for AC1/AC2 not breaking anything)
  - [ ] 6.2. `npm test` → exit 0 (no regression — sanity check; this story does not touch test code)
  - [ ] 6.3. `git diff --stat` → review the diff for scope creep. Expected files modified: exactly 3 (project-context.md + .github/workflows/ci.yml + package.json), plus the story file itself and sprint-status.yaml. Any other file in the diff = scope creep; halt and reconcile
  - [ ] 6.4. Update File List section of this story with every modified file
  - [ ] 6.5. Commit + push to a branch; open PR; observe CI run; verify all jobs exit `completed success` per AC4
  - [ ] 6.6. After merge, observe the next `main` push run; verify same green outcome

## Dev Notes

### Why three layers, not just one

The 4-day red of 2026-05-01 → 05 had three causal layers, all silently aligned to hide the failure:
1. **Verification script** — dev-story Task 4.4 used `cmd | tail`, masking exit code (the immediate trigger)
2. **Workflow shell** — no `pipefail`, so even at the CI layer the same pattern would lie
3. **Lint gate** — silent acceptance of warnings would mean any future `_warnings`-style unused-arg defect could slip through review with the same shape

Encoding the same lesson at all three layers means **no single layer alone is load-bearing** for catching this class. Future contributors who break one layer still hit the other two.

### Why these specific code choices

- **`bash -eo pipefail {0}`** — `{0}` is GitHub Actions' way of injecting the temp-script path that holds the `run:` body. `-e` exits on first error (default for GitHub Actions bash anyway); `-o pipefail` propagates pipe exit codes. Together they match what most production-grade `Makefile` `SHELL` declarations use
- **`--max-warnings 0`** — preferred over `--quiet` (which suppresses warning *display* but not exit codes for *errors*). `--max-warnings 0` makes any warning a non-zero exit, matching the rule's intent. Doesn't change error behavior (errors always exit non-zero)
- **`${PIPESTATUS[0]}` vs `set -o pipefail`** — both are valid. The rule prescribes either, with `set -o pipefail` recommended for full-script use and `${PIPESTATUS[0]}` for single-command use. Project-context rule should explain both with one-line guidance for when to use each

### What the new rule does NOT enforce

- It does not block all pipe usage. Pipes for non-verification purposes (formatting output, filtering for display) are fine
- It does not require `set -o pipefail` in CI workflow `run:` steps — that's I103's job (added separately in this story as AC2)
- It does not retroactively fix existing Task verification commands in already-shipped stories. The rule is **forward-prevention**

### Testing standards summary

- **Test framework:** N/A — this story modifies config and convention files, no test code
- **Coverage expectation:** This story should not reduce coverage (no source code added/removed). `npm run test:coverage` is not required to run as part of dev verification, but Task 6.1 + 6.2 already exercise lint + unit-test gates
- **Fixture isolation:** N/A

### Project Structure Notes

- No new directories created
- No new files created under `scripts/`, `tests/`, or `_bmad/`
- One new rule section added in-place to `project-context.md`
- One YAML block added in-place to `.github/workflows/ci.yml`
- One flag added in-place to `package.json` `scripts.lint`

### References

- [convoke-note-initiative-lifecycle-backlog.md §2.3 Fast Lane](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md#23-fast-lane-quick-wins--spikes) — rows A47 (12.0), I103 (10.8), I104 (10.8) added 2026-05-11
- [session-retro-2026-05-05-cov-and-i97-bug.md](session-retro-2026-05-05-cov-and-i97-bug.md) — AC-RETRO-1 (the unshipped rule that AC1 ships), AC-RETRO-2 (applied here per epic NFR5)
- [project-context.md](../../project-context.md) — §lint-passes-before-review (insertion neighbor for new rule), §code-review-convergence, §derive-counts-from-source, §spec-verify-referenced-files (verified 2026-05-11 — all 3 target files exist), §mechanical-research-enumeration (Task 1 baseline-capture commands are mechanical)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — current state (no `defaults:` block; lint job at L15-30 invokes `npm run lint`)
- [package.json](../../package.json) — current `scripts.lint` at L48
- [eslint.config.mjs](../../eslint.config.mjs) — `no-unused-vars: "warn"` at L30 explains why `--max-warnings 0` is the load-bearing flag
- [GitHub Actions docs — `defaults.run`](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#defaultsrun) — workflow-level shell default
- [GitHub Actions docs — `shell`](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#using-a-specific-shell) — `bash -eo pipefail {0}` is the documented non-default
- [ESLint `--max-warnings`](https://eslint.org/docs/latest/use/command-line-interface#--max-warnings) — flag semantics

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

{{debug_log_to_be_filled_by_dev_agent}}

### Completion Notes List

{{completion_notes_to_be_filled_by_dev_agent}}

### File List

**Expected modified by this story (3 files in scope + 2 workflow-required):**

- `project-context.md` — new `verification-pipefail` rule (Task 2)
- `.github/workflows/ci.yml` — new `defaults.run.shell` block (Task 3)
- `package.json` — `--max-warnings 0` flag on lint script (Task 4)
- `_bmad-output/implementation-artifacts/ci-hygiene-1-1-pipefail-and-lint-gate-fidelity.md` — this story file (Status, Tasks/Subtasks, Dev Agent Record, File List, Change Log)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions for ci-hygiene-1-1 and ci-hygiene-epic-1

**Not expected to be modified (regression guard):** any file under `scripts/`, `tests/`, `_bmad/`, or `docs/`. If any of these appear in `git diff --stat`, halt and reconcile per Task 6.3.

## Change Log

{{change_log_to_be_filled_by_dev_agent_and_reviewer}}
