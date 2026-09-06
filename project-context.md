# Convoke Project Context

Rules and conventions that BMAD dev agents and contributors must follow when working in this repository. These are encoded here (not just in retros) so that the dev agent reads them before writing code.

> **Authoring a new skill, workflow, or agent under `_bmad/bme/`?** Before anything else, read [The Convoke Operator Covenant](_bmad-output/planning-artifacts/convoke-covenant-operator.md) — one axiom and seven Operator Rights every Convoke skill must honor — and self-check against the [Covenant Compliance Checklist](_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md). The rule is `covenant-compliance-for-convoke-skills` below. Covenant compliance is an architectural concern, not a styling concern: it's what makes a `_bmad/bme/` skill a *Convoke* skill rather than a generic one.

---

## Rule: team-expansion-freeze

**Statement.** No new Convoke team is built until **4.0.2 ships `dist-epic-2`**. Repackaging or
completing an EXISTING team (Gyre's manifests, I97's remaining agent conversions) is not covered by this
freeze; only adding a team that does not exist is.

**Why.** The freeze is real and has been in force since roughly April 2026, but it existed only as a
disposition — "augment the product surface on sound bases" — with no test for when the bases are sound
enough. A foundation programme with no completion criterion does not complete: it keeps generating its
own successor work, which is how 189 intakes accumulated and how a ratified three-deliverable plan stayed
invisible for three weeks. Naming a version turns a thing that was happening by default into a decision
with an exit.

**Why 4.0.2 specifically.** Epic 1 of 4.0.1 is complete and the publish path is enforced through CI, so
the distribution work is most of the way done; `dist-epic-2`'s defects are live on `latest` today. That
makes it both the honest remainder of "sound bases" and a dated, checkable event rather than a judgement
call.

**How to apply.**

- **Picking up work.** If a candidate would create a new team directory under `_bmad/bme/`, it is behind
  this freeze regardless of its RICE score. Say so in the row rather than starting it.
- **Forge (P9).** It is the first team out of the freeze by the 2026-08-15 baseline sequence, and its own
  Gate 1 additionally requires an external engagement. Both conditions must clear.
- **Lifting it.** When 4.0.2 publishes, delete this rule in the same commit that records the lift. A rule
  that outlives its condition becomes the next undated freeze.

**Exception.** None by default. Lifting early is an operator decision that must be recorded as one — the
absence of such a record is what this rule exists to prevent.

---

## Rule: test-fixture-isolation

**Statement.** Tests that invoke a CLI script via `runScript(...)` or scan the project tree via `findProjectRoot()` / `runAudit()` / similar **must** run against an isolated fixture directory, never against `PACKAGE_ROOT`.

**Operational check.** Every call to `tests/helpers.js::runScript` must pass `{ cwd: tmpDir }` — where `tmpDir` is created in a `before()` hook, populated with the minimum state the test requires, and cleaned up in `after()`. Bare `runScript(script)` calls (no cwd) are forbidden.

**Why.** Tests that couple assertions to live repo state turn any drift — a README typo, a config version bump mid-PR, a banner rename, a new doc finding — into a CI failure across every Node version simultaneously. The failure appears as "CI is flaky" when it is actually *correctly* reporting that the test's implicit assumption about the project state no longer holds. This class of failure has bitten Convoke multiple times (see `tests/unit/docs-audit.test.js` pre-fix, `tests/integration/cli-entry-points.test.js` pre-fix, `tests/integration/postinstall.test.js:11-21` pre-fix — all fixed 2026-04-11).

**How to apply.**

- **Writing a new test that shells out to a CLI.** Use `createValidInstallation(tmpDir)` (from `tests/helpers.js`) or a minimal hand-built fixture in a `before()` hook. Pass `{ cwd: fixtureDir }` to every `runScript` call in that suite.
- **Writing a new test that scans the project tree.** Pass `{ projectRoot: fixtureDir }` to `runAudit()` or equivalent APIs. Do not rely on `findProjectRoot()` walking up from the test process cwd.
- **Assertions.** Assert on *behavior* (exit code validity, JSON shape, presence of a specific header the script emits for a given fixture input), never on *counts* against live state (`findings.length === 0`, "all 7 agents mentioned") unless the fixture itself *guarantees* the count.
- **Rescuing an existing bare call.** Create a fixture in `before()`, thread `cwd` through the test's helper, convert assertions to behavior-based. If the test was a pure smoke test ("does it run against our own repo?") and the same behavior is already covered by a fixture-based test in the same file, **delete it** — do not fixture-ize redundant coverage.
- **Reviewing a PR.** If a diff adds `runScript(...)` without a `cwd:` option, block and cite this rule.

**Exception.** None. If you believe you have one, escalate — the exception is almost certainly a sign the test is checking something that belongs in a separate gate (e.g., `npm run docs:audit` as its own CI step), not in the unit/integration suite.

---

## Rule: fixture-determinism

**Statement.** A test must not assert on anything it does not control. If the asserted value can change
without the code under test changing, the test is a clock, a race, or a census — not a test.

**Operational check.** Before writing an assertion, name what determines the value. These axes each produce
non-determinism and none is covered elsewhere in this file:

- **Wall-clock time** — `new Date()` / `Date.now()` feeding date maths.
- **Process lifetime you did not await** — a detached child or background writer still running after the
  call that spawned it returned.
- **A fixed delay** — `setTimeout`/`sleep` standing in for an event you could have awaited.
- **Ambient environment** — inherited env vars, global config, the developer's own `git` settings.

A fifth axis, **live repository state**, is owned in full by `test-fixture-isolation`; treat that rule as
this one's filesystem case rather than repeating it here.

**Why.** Five instances, each found separately, each fixed separately, none recognised at the time as the
same defect:

| | Uncontrolled input | How it surfaced | Already owned by |
|---|---|---|---|
| T12 | wall-clock | ±1 day flake across UTC midnight | — |
| I131 | fixed delay | CI flake plus wasted seconds per suite | — |
| I124 | live tree, timed | 30s timeout flake only under `c8` | `test-fixture-isolation` |
| CI run 32115225495 | detached `git maintenance` child | `ENOTEMPTY` in teardown, three jobs red | — |
| `02cb6d72` | live repo census | failed on corpus **growth**, not regression | `derive-counts-from-source` |

Two of the five already had a rule and still recurred, because the rule named the *instance* and not the
*class*. The other three had nothing. `fc59c190` states the cost best: *"the magic number rotted while the
property it stood for did not."*

**How to apply.**

- **Pin the input rather than widen the tolerance.** A fixed offset instead of `new Date()`; a fixture tree
  instead of a longer timeout; an awaited event instead of a sleep. Raising a limit hides the coupling and
  the next person pays for it again.
- **Remove the writer, then survive it.** Where concurrency is the input, suppress the source if you can
  prove one exists, and make the failure self-diagnosing where you cannot — see `initGitFixture` and
  `removeTempDir` in `tests/helpers.js`, whose failure message names what survived, precisely because the
  race could not be reproduced locally.
- **A guarded test that cannot run must say so** (`t.skip('reason')`). Silence reads as coverage. Proving the
  guard itself can fail is `verification-must-be-falsifiable`, not this rule.
- **Reviewing a PR.** If a diff adds an assertion whose value depends on any axis above, block and cite this
  rule. Known trap: `runScriptWithInput` in `tests/unit/convoke-update.test.js` defaults `cwd` to
  `PACKAGE_ROOT`, so omitting `cwd` silently opts into live repo state.

**Exception.** A test whose *subject* is the non-deterministic thing — a clock helper, a retry policy, a
concurrency primitive. Control the input explicitly (inject the clock, drive the scheduler); the subject
being time does not license reading the real time.

---

## Rule: no-hardcoded-versions

**Statement.** Never hardcode version strings in source code. Always read via `getPackageVersion()` from `scripts/update/lib/utils.js`.

**Why.** Convoke's update/migration system depends on a single source of truth for the current package version (`package.json`). Hardcoded versions rot silently and cause update logic to compare against stale values.

**How to apply.** When you need the current version, `require('../../package.json').version` or use the `getPackageVersion()` helper. If you find an existing hardcoded version string, replace it.

---

## Rule: no-process-cwd-in-libs

**Statement.** Library code under `scripts/update/lib/` and similar must not call `process.cwd()` directly. Accept a `projectRoot` parameter or use `findProjectRoot()` from `utils.js`.

**Why.** Direct `process.cwd()` calls make functions untestable against fixtures (they're implicitly bound to the test runner's working directory) and produce subtle bugs when callers invoke them from a nested directory.

**How to apply.** Every library function that needs a project path takes it as a parameter. CLI entry points are the only place `findProjectRoot()` is called, and they pass the result down.

---

## Rule: path-safety-for-destructive-ops

**Statement.** Any script that accepts a user-provided path and performs destructive operations (delete, overwrite, cleanup) must include a safety analysis in its spec and refuse to operate on paths outside the project root.

**Why.** See `feedback_path_safety.md` in auto-memory. A script that writes to user paths without validation is one typo away from deleting the wrong tree.

**How to apply.** When writing such a script, include:
1. A `resolve + normalize + contains-check` against the project root.
2. An explicit refusal path for `/`, `$HOME`, and any path that isn't under the project root.
3. A story-level safety analysis in the spec (not just the code).

---

## Rule: namespace-decision-for-new-skills

**Statement.** Every new skill or workflow story must include a "Namespace decision" section in its spec, explaining whether the skill lives under Convoke's `_bmad/bme/` namespace or upstream BMAD's namespace, and why.

**Why.** Convoke is an extension of BMAD Method, and keeping the boundaries clean prevents accidental upstream contamination and makes future merges tractable. See `feedback_namespace_audit.md` in auto-memory.

**How to apply.** Include the section in the story. If the choice isn't obvious (mixed-namespace work, refactoring that crosses the boundary), escalate to the user before coding.

---

## Rule: covenant-compliance-for-convoke-skills

**Statement.** Before authoring a new skill, workflow, or agent under `_bmad/bme/` (Convoke's owned namespace), the author must read [The Convoke Operator Covenant](_bmad-output/planning-artifacts/convoke-covenant-operator.md) and self-check the deliverable against the [Covenant Compliance Checklist](_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md) before marking the story ready-for-review.

**Why.** The Covenant encodes one axiom ("the operator is the resolver") and seven Operator Rights that distinguish a Convoke skill from a generic skill. Authoring without consulting it produces skills that look structurally correct but violate the operator-experience standard the rest of the ecosystem relies on. The baseline audit (2026-04-18) found 10 violations across 56 cells (~82% compliance) in existing skills — all of them introduced by authors who never had the Covenant to consult. Making the Covenant required reading at the point of authorship is how we stop adding new violations while we retrofit the old ones.

**How to apply.**
- **Authoring a new `_bmad/bme/` skill or workflow.** Read the Covenant before you start. When drafting the deliverable, satisfy the Checklist's OC-R0 enumeration precondition first (record the full 3-layer interaction surface — workflow.md + all step files + all invoked scripts/CLIs), then work through OC-R1 through OC-R7 and confirm each either PASSes or has a declared N/A variant with rationale. Cells answered against an incompletely-enumerated surface are invalid per OC-R0.
- **Reviewing a `_bmad/bme/` skill PR.** Check whether the author ran the Checklist. If the diff introduces new operator-facing behavior (prompts, errors, output formats, decision points), verify the relevant Right's compliance — cite the specific OC-Rn rule in the review comment, not a generic "improve UX" note.
- **Exception: upstream BMAD contributions.** Skills contributed upstream (`_bmad/core/`, `_bmad/bmm/`, `_bmad/bmb/`, etc.) are out of scope for the Covenant — it's a Convoke-specific standard, not a BMAD Method requirement. If the skill is genuinely upstream-appropriate (see `namespace-decision-for-new-skills`), the Covenant does not apply.
- **Reference, not boilerplate.** Cite the Covenant by its display name and link, with a sentence explaining *why* compliance matters for the surface in question. "See the Covenant" with no rationale violates OC-R3 (the Right to rationale that the Covenant itself encodes).

---

## Rule: slash-command-ux-for-user-facing-tools

**Statement.** Any user-facing tool must be exposed as a BMAD slash-command skill, not as a bare CLI script. CLI scripts are an implementation detail, not a user interface.

**Why.** See `feedback_slash_command_ux.md` in auto-memory.

**How to apply.** When planning a new user-facing feature, the story's deliverables must include a slash-command skill that wraps the underlying script. If you find yourself writing CLI-only documentation, you've missed a layer.

---

## Rule: no-code-in-party-mode

**Statement.** When multiple BMAD agents are in party mode, no agent writes code. Exit party mode first, create stories via the appropriate agent (typically SM), then implement.

**Why.** See `feedback_no_code_in_party_mode.md` in auto-memory.

**How to apply.** If a user asks for code inside party mode, the agent proposes exiting party mode and creating a story instead.

---

## Rule: code-review-convergence

**Statement.** Code reviews follow a bounded convergence rule:
- **Round 1 fires automatically** when a change reaches a landing point, with no operator request required. The landing points are: a story moving to `review`, and — for Fast Lane / out-of-story work, which has no story status to move — **the moment a commit is prepared** (see `commit-preparation`). Waiting to be asked is a rule violation, not a default.
- **Round 1** is mandatory.
- **Round 2** is triggered only if Round 1 produces any HIGH-severity finding.
- **Round 3** is triggered only if Round 2 introduces structural changes (new files, renamed functions, altered control flow) — not for wording fixes, comment edits, or cosmetic patches.
- **No Round 4.** If Round 3 still has issues, defer remaining findings to the backlog (via `bmad-enhance-initiatives-backlog` Triage mode) rather than running another review pass.
- **Restructure, do not patch, when a round is correcting the previous round.** If a round's HIGH findings are predominantly defects in the *previous round's corrections* rather than in the work under review, the next action is to **change the instrument**, not to patch again. Two failed attempts at the same fix predict a third. This is a routing rule, not a stopping rule — it does not reduce review depth, it redirects it.
- **The reviewed set must equal the committed set.** A round only covers the files that were in the diff handed to it. Before emitting a commit plan, assert that the set of files the review saw is the same set the plan stages. If they differ, either re-review the delta or say so explicitly in the commit Description — never let the earlier round's verdict silently extend to text it never saw.

**Why the Round-4 cap was exceeded once, and what it taught.** `dist-1-7` ran a Round 4 at explicit operator request, against this rule's cap. It found **two HIGHs** — an unsatisfiable git gate and a banner that overclaimed in the opposite direction — so the cap's premise (diminishing returns) did not hold. The reason is diagnostic rather than exculpatory: rounds 2-4 were **fixing fixes**, not reviewing work, and each patch asserted a fresh unverified external claim (see `external-claims-must-be-executed-or-hedged`). The restructure-not-patch clause above exists to end that loop at Round 3 — when it was finally applied to ADR-003, a document-wide scope banner closed in one pass what four sentence-level sweeps could not. Do not read this as licence for Round 4; read it as the signal that Round 3 chose the wrong instrument.

**Why.** Story 7.3 went through 3 unbounded review rounds producing 30 findings. The unbounded "keep reviewing until clean" pattern wastes time and generates diminishing-return findings. Retrospective: ag-epic-7-retro-2026-04-10, Action Item #3.

**Why the set-equality clause.** Twice in the 2026-08-15 issue #7 / BUG-12 session, a review diff was built from a hand-typed file list, work continued, and the committed changeset ended up larger than the reviewed one — both times because a *test file* was written after the review was already in flight. The second instance shipped 89 unreviewed lines in commit `d9e15713` under a commit message reading "Round 1: no HIGH; 2 MEDIUM + 5 LOW applied or logged", which reads as covering what shipped. Reviewing that gap found a **HIGH**: the `/g` flag was unpinned on both escapers, so a non-global `replace` — the canonical form of the `js/incomplete-sanitization` class the commit existed to close — passed the suite while leaving every occurrence after the first unescaped. The gap was in tests written *in response to* a review finding, which is the easiest place to lose coverage and the least likely to be re-checked.

**How to apply.**
- **Never wait for the operator to ask.** The failure mode this rule now guards against is not "too many rounds" (the original concern) but "zero rounds" — Fast Lane work shipping unreviewed because the operator was tired and nobody else was watching. If you are preparing a commit plan and no Round 1 has run on the changes it covers, run it first, or state explicitly in the plan that it was skipped and why.
- When running `bmad-code-review`, track the current round number. The skill's step-04-present enforces the stopping criteria at the "Re-run code review" prompt.
- If you're manually re-running a review, check whether the stopping criteria are met before proceeding.
- If Round 2 produces only LOW/MEDIUM findings (no HIGH), stop — do not trigger Round 3.
- Remaining findings after the final allowed round go to the initiatives backlog as deferred items, not into another review cycle.
- **Derive the review diff from git, never from memory.** Build it with `git diff HEAD --name-only` (or the equivalent for the chosen baseline) rather than typing the paths you believe you touched. Then, immediately before emitting the commit plan, run the equality check:

  ```bash
  diff <(grep '^diff --git' review.diff | sed 's|^diff --git a/||; s| b/.*||' | sort) \
       <(git diff HEAD --name-only | sort)
  ```

  Empty output means the round covered everything the plan stages. Any output is the delta you must re-review or disclose. Costs one command; both 2026-08-15 gaps would have been caught by it.
- **Applying a finding is not a reviewed change.** Remediation written after a round is unreviewed text by default. Small in-place fixes to what the round already saw are fine; *new* code or *new* tests are not, however directly they answer a finding. Note that the bound still applies — if no HIGH was found, this does not license another round; disclose in the Description instead.
- **A verification that cannot fail is worse than none.** Both 2026-08-15 gaps had a sibling failure: a check that reported success without doing its work (a mutation harness whose `perl`/shell escaping silently no-op'd, and a test asserting the negation of its own function's exit condition). When a check is the evidence for a claim, prove it can fail — assert the mutation applied, or show the test red against the pre-fix code — before citing it.

---

## Rule: lint-passes-before-review

**Statement.** Before marking a story `review` (or submitting a PR for review), run `npm run lint` and verify it exits 0 **with zero warnings in any file the story modifies**. The scope is the story's diff, not the whole repo — pre-existing warnings in files the story does not touch are owned by whichever story currently owns those files (or by a follow-up lint-cleanup backlog item).

**Why.** Story 1A.2 (`v63-1a-2-create-config-loader-js-with-direct-yaml-loading`) shipped with 1,224 tests passing and two full code-review rounds converged — but produced 8 ESLint `preserve-caught-error` errors in `scripts/update/lib/config-loader.js` that were first surfaced by CI run #714 (2026-04-21). Review Round 1 + Round 2 both gated on `npm test`, not `npm run lint`, so the regression slipped past both rounds. The existing dev-story DoD checklist said "Linting and static checks pass **when configured in project**" — a weasel qualifier that made the gate skippable despite ESLint being configured. This rule closes that gap: the DoD checklist is amended (via lint-1.1) to remove the weasel wording, and this rule restates the norm so dev agents see it as a citable convention before touching code.

**How to apply.**
- **Before marking a story `review`.** Run `npm run lint` unprefixed (no file filter — the CI gate is unfiltered). If it surfaces any error in files this story modifies, fix before `review`. If it surfaces any *warning* in files this story modifies, fix before `review`. Pre-existing warnings in untouched files are out of scope — log a deferred backlog item if the warning count is growing, but do not scope-creep the current story.
- **Scoping the "files modified by this story".** Run `git diff --name-only main...HEAD` (or equivalent) — that's your touched-files set. The DoD gate applies to every `.js` / `.mjs` / `.cjs` in that set.
- **When the weaker ESLint-rule default hides a real problem.** `no-unused-vars` defaults to `args: "after-used"` (only trailing unused args are flagged). TypeScript's language server flags *all* unused args, which is stricter than ESLint. If the IDE reports an unused arg that ESLint misses, use judgment — if it's public API, prefix with `_`; if it's dead, delete. Do not disable the IDE hint without replacing it with the corresponding fix.
- **Reviewing a PR.** If the diff touches `scripts/**` or `tests/**` and the author has not explicitly cited `npm run lint` output in the PR description or commit message, ask for it before approving. An author whose DoD step ran `npm run lint` and saw errors would have fixed them — their silence about lint is evidence the gate wasn't walked.
- **When CI lint fails but your local doesn't.** Different ESLint versions, different rule sets, or uncommitted changes. Run `npm ci && npm run lint` (clean install, matches CI) before assuming the failure is spurious.

**Scope exemptions.** None under normal circumstances. If the story amends ESLint configuration itself (e.g., disabling a rule project-wide), the new rule set is what `npm run lint` exercises — the DoD still applies. If the story is authored specifically to clean up lint (like lint-1.1 itself), the DoD applies forward: the story's own diff must be lint-clean. Pre-existing WIP warnings from parallel in-flight stories (e.g., the 1A.4 migration script in progress during lint-1.1's implementation) are scope-excluded **only if** the scope exclusion is documented in the story file at authoring time, not retroactively.

---

## Rule: verification-pipefail

**Statement.** Story Task verification commands that use shell pipes MUST either set `set -o pipefail` at the script level OR capture the upstream command's exit code via `${PIPESTATUS[0]}` (Bash) / `${pipestatus[0]}` (zsh) or the per-shell equivalent. The pattern `cmd | head/tail/grep ; echo $?` is **forbidden** in any verification context — it captures the rightmost command's exit code (which is always 0 for `head`/`tail` in normal operation), not the upstream command's actual exit code. The same rule applies to verification steps in CI workflow `run:` blocks (see GitHub Actions `defaults.run.shell: bash -eo pipefail {0}`).

**Why.** Story `cov-1.1` Task 4.4 used `npm run test:coverage 2>&1 | tail -15; echo "EXIT: $?"` to verify the test suite. The `;` separator means `$?` captures `tail`'s exit code (always 0), not `npm run test:coverage`'s. The cov-1.1 Task 4.4 HALT was triggered when R1 code review independently re-ran the command with `set -o pipefail` and got a different exit code — exposing that the dev Task had reported "EXIT: 0" while the actual exit was 1 with 12 P0 failures in `tests/p0/p0-{emma,wade,mila}.test.js`. The story had been marked done on a false positive. Scar-story documented in [session-retro-2026-05-05-cov-and-i97-bug.md](_bmad-output/implementation-artifacts/session-retro-2026-05-05-cov-and-i97-bug.md) §"What didn't go well" — `i97-bug-epic-1` was authored as the forward-going hotfix and the action item AC-RETRO-1 logged this `verification-pipefail` rule as required forward-prevention.

**How to apply.**
- **Authoring a Task verification command.** If the command pipes its output (e.g., to `tail`, `head`, `grep`, `awk`, `tee`), prefix with `set -o pipefail` for multi-command sequences OR use `${PIPESTATUS[0]}` (Bash) / `${pipestatus[0]}` (zsh) for a single pipeline. Example: `set -o pipefail; npm run test:coverage 2>&1 | tail -15; echo "EXIT: $?"` — now `$?` is `npm`'s exit code. Or: `npm run test:coverage 2>&1 | tail -15; echo "EXIT: ${PIPESTATUS[0]}"` — explicit capture of the first pipeline element's exit code (use `${pipestatus[0]}` if running locally under zsh). Cite this `verification-pipefail` rule in the Task body so reviewers can verify the discipline was deliberate.
- **Picking the form.** `set -o pipefail` is recommended when the Task runs multiple commands and you want any upstream failure to short-circuit. `${PIPESTATUS[0]}` is recommended for one-off pipelines where you need the exit code of a specific stage. Avoid relying on bare `$?` after any pipeline.
- **CI workflow steps.** GitHub Actions' default `bash` invocation includes `-e` but not `-o pipefail`. Set `defaults.run.shell: bash -eo pipefail {0}` at the workflow top level (between `concurrency:` and `jobs:`) so every `run:` step inherits pipefail without per-step overrides.
- **Reviewing a story spec.** Grep Task bodies for `| head`, `| tail`, `| grep`, `| awk` followed by `; echo $?`. Block at story authoring time if the rule isn't honored — the cost of catching this at authoring is seconds; the cost of catching it after a false-positive ship is hours of dual-cause diagnosis.
- **Reviewing a PR.** If a story's Dev Agent Record cites a Task that piped a verification command, verify the `pipefail` discipline was followed. If not, the verification didn't actually verify what the AC claims.

**Scope exemptions.** Display-only pipes (formatting output for human reading, where the upstream command's exit code doesn't gate Task completion) are exempt. The rule applies only to **verification** pipes — those whose exit code is what the Task or AC actually checks.

---

## Rule: capability-form-factor-evaluation

**Statement.** When a new capability enters the qualifying gate (§1.2 of the initiative lifecycle), and the question is "what form should this take?" — run it through the Capability Evaluation Framework decision tree before assigning a lane or committing to a form factor.

**Reference document.** `_bmad-output/planning-artifacts/convoke-note-capability-evaluation-framework.md` — contains the 3-tier model (Skill → Agent → Team), decision tree, promotion/demotion triggers, and overlap analysis template.

**Input feed.** Friction logs from consulting engagements (`_bmad-output/planning-artifacts/convoke-note-friction-log-template.md`). No capability gets built without friction log evidence — vision is not demand.

**Why.** Convoke's ecosystem grows through Enhance skills (Tier 1), new agents in existing teams (Tier 2), and new teams (Tier 3). Building at the wrong tier wastes effort (over-engineering) or creates shallow tools (under-engineering). The framework prevents both by requiring evidence-based tier selection and providing bidirectional promotion/demotion triggers.

**How to apply.**
- At the qualifying gate: if the intake describes a new capability (not a bug, not a point fix), check whether the form factor question is relevant. If yes, run the decision tree from the framework doc.
- For Tier 2+ (Agent or Team): run the overlap analysis template against existing scopes before building.
- After 3 engagements using a shipped capability: check the promotion/demotion triggers table.
- Quarterly: review accumulated friction log entries, cluster by scope, and run clusters with 3+ entries through the framework.

---

## Rule: derive-counts-from-source

**Statement.** Tests and deliverables that assert or report counts (number of agents, skills, findings, taxonomy entries, etc.) must derive those counts from the authoritative source data at runtime — never hardcode them.

**Why.** Hardcoded counts rot silently. Adding an agent, a taxonomy entry, or a skill changes the real count but not the assertion. The test passes when it should fail. This class of bug has bitten Convoke across multiple initiatives: agent counts in validator tests, taxonomy entry counts in migration tests, skill counts in portability tests — all required fixing after the underlying data grew. SP Epic 5 retro A1.

**How to apply.**
- In tests: compute expected counts from the source (registry arrays, manifest files, config entries) — e.g., `AGENTS.length + GYRE_AGENTS.length` instead of `12`.
- In deliverables (audit tables, coverage reports): generate counts programmatically from the data, not by hand-counting table rows.
- **Reviewing a PR.** If a diff adds a magic number that represents a count of something that can change, block and cite this rule.

---

## Rule: shared-test-constants

**Statement.** Test suites that validate the same invariants (forbidden strings, expected patterns, canonical IDs) must import from shared constant files — not duplicate the lists inline.

**Reference.** `scripts/portability/test-constants.js` is the established pattern: `FORBIDDEN_STRINGS` is the single source of truth for the portability suite.

**Why.** Duplicated constant lists drift. When a new forbidden string is added in one test file but not the others, coverage has a silent hole. Carried through SP Epic 2–5 retros as the #1 test-reliability debt item until `test-constants.js` was extracted.

**How to apply.**
- Before adding a constant list to a test file, check if a shared constants file already exists for that domain.
- If it does, import from it.
- If it doesn't and the list will be used by 2+ test files, create one following the `test-constants.js` pattern.

---

## Rule: catch-all-phase-review

**Statement.** Any processing phase that uses a catch-all or fallback matcher (e.g., regex-based text substitution that operates on "everything not already handled") must have its output reviewed for false positives before the deliverable is accepted.

**Why.** The portability export engine's Phase 6 catch-all produced 400+ warnings and false positives on patterns like `[your context]` (valid markdown links misidentified as framework references). The catch-all is necessary for coverage but inherently noisy. SP Epic 5 retro A2.

**How to apply.**
- When writing a catch-all phase: add a `--dry-run` or `--verbose` mode that shows what would be matched before applying.
- When reviewing output from a catch-all: spot-check at least 10 matches for false positives. If false-positive rate exceeds ~10%, tighten the matcher before shipping.
- In tests: include at least one test fixture containing known false-positive patterns to verify the catch-all doesn't match them.

---

## Rule: spec-verify-referenced-files

**Statement.** Story specs that reference specific files (by path or by name) must verify those files exist before the story is marked ready-for-dev. The dev agent must re-verify at implementation time.

**Why.** Specs written against a moving codebase accumulate stale file references. The dev agent follows the spec, can't find the file, improvises, and produces work that doesn't match the spec's intent. Story 7.3 went through 3 review rounds partly because non-mechanical enumeration missed files that had moved. AG Epic 7 retro A1.

**How to apply.**
- When writing a spec: for every file path mentioned, run a quick existence check (`ls` or glob). If the file doesn't exist, note the correct path or mark it as "to be created."
- When picking up a story: before coding, grep/glob for every file referenced in the spec. Flag any that are missing — don't silently skip them.
- **Reviewing a spec.** If a spec references a file path, verify it. If it references a pattern ("all files matching X"), run the glob and confirm the count matches the spec's claim.

---

## Rule: mechanical-research-enumeration

**Statement.** Research, catalog, audit, or inventory deliverables must enumerate their subject space via a mechanical search (`grep`, `glob`, `rg`) — not by eyeballing section headers, tables of contents, or file listings.

**Why.** Eyeballed enumeration silently undercounts. Section headers may not match what the story actually needs ("all skills invoking X" ≠ "sections titled X"), files may have moved, and a human scanning hundreds of files misses edges a grep would catch. Story 7.3 went through 3 review rounds because its inventory was built from section-header eyeballing rather than pattern-based search — edges found in Rounds 2 and 3 should have been found in Round 1. AG Epic 7 retro A1.

**How to apply.**
- When the deliverable is "list all X": run the grep/glob first, paste the raw output into the working notes, *then* transform it to the presentation format. The raw output is the evidence of completeness.
- In story specs for research/catalog work: include the exact search command as a required input. Example: `grep -l 'OC-R6' _bmad/**/*.md` rather than "review all Covenant-related files for OC-R6 references".
- **Reviewing a research/catalog PR.** If the deliverable doesn't cite a mechanical search, ask how the enumeration was built. If it was eyeballed, request a grep-based re-verification pass before approving.

---

## Rule: staleness-preflight-for-backlog-pickup

**Statement.** Before starting implementation of any Bug Lane, Fast Lane, or Initiative Lane item qualified more than **3 calendar days ago**, OR when parallel tracks have been active since qualification **regardless of age**, run a four-check pre-flight. An item whose pre-flight returns yellow/red must be re-qualified or re-scoped before work begins.

**The rule fires at two moments, not one.** Everything above is the *pickup* arm. There is an earlier one — see **Qualification-time arm** below — because a row can be dead on arrival, and the pickup checks cannot see it.

**Why.** Parallel work tracks silently drift backlog items. On 2026-04-19 alone, Convoke's lifecycle backlog absorbed three distinct drift events in a single session: (1) a Vortex audit initiative shipped in a sibling session while the main session worked on unrelated test infrastructure — overlapping file paths that would have caused re-discovery if the main session had then picked an adjacent item; (2) deferrals from a Covenant adoption-surface story were triaged by a prior session using a different IN-ID space than the current session, caught only because the Triage workflow has built-in overlap detection; (3) most instructively, four intakes were logged with lane-ID pointers but the corresponding Fast Lane rows were never materialized — a partial-write that remained invisible until a human eyeballed the backlog and noticed. Without a systematic pre-flight, each of these drift classes cascades: operators pick up already-shipped work, re-triage duplicates, implement against rotted file anchors, or build against semantically-obsolete rubrics.

**How to apply.** Relationship to sibling rules: **Check #3 is a pickup-time application of `spec-verify-referenced-files`** (the existing rule covers authoring + story-ready gates; this rule covers backlog-pickup time). Don't double-execute — if a recent `spec-verify-referenced-files` run passed and the cited files haven't changed since, treat Check #3 as already-satisfied. Run four checks before coding:

1. **Existence check.** `grep -r` recent commits (since the qualification date) and `deferred-work.md` changes for the item's ID, key file anchors, and distinctive symbols. Any hit post-qualification = review whether a sibling track already shipped or superseded the work. **YELLOW example**: a commit touched a cited file but not in the described way. **RED example**: a commit message says "closes BUG-X" where X is this item's ID.

   **Known blind spot — this check cannot see a fix that predates the row.** Searching by ID only finds commits written *after* the ID existed. A row qualified from an aged intake describes a defect that may already have been fixed, and no commit can name a row that did not yet exist when the fix landed. The ID search comes back clean and the row looks healthy. When the row is younger than the work it describes, only the anchor and semantic checks (#3, #4) can catch it — and those must be run against **source**, not against commit messages. See the Qualification-time arm.
2. **Dependency check.** Parse the row's `Dependencies` column. For each referenced ID (`deferred-from:`, `depends-on:`, `blocks:`, `bundles-with:`, `blocked-on:`), verify the target is still in its expected state — not moved to §2.5 Completed, not re-qualified into a different lane, not itself blocked by something newly added. **YELLOW example**: a bundle-partner item's scope expanded. **RED example**: a hard dependency shipped with a different API than this item assumed.
3. **Code-anchor validity check.** Glob or grep every file path the item's Description cites (format `scripts/foo.js:42`, backticked filenames, directory references). Missing files = the anchor has rotted. **YELLOW example**: the file exists but the cited line number now points to unrelated content. **RED example**: the cited file was deleted or moved outside the repo.
4. **Semantic-anchor check.** If the item refers to rubrics, rules, concept definitions, or methodology (any item where the `Description` cites a spec by name — e.g., "Compliance Checklist §2.6", "A10 threshold semantics", "T1 rule"), verify those sections haven't been amended since qualification. Syntactic checks catch file rot but miss the case where an adjacent ship redefined concept boundaries under the item. **YELLOW example**: the cited section was edited but the edits don't change the item's framing. **RED example**: the concept the item is scoped to has been renamed, merged, or removed.

**Verdict:**
- **GREEN** (all checks clean) — proceed to implementation.
- **YELLOW** (one or more checks flagged an ambiguous signal per the examples above) — confirm with the operator / qualifier before proceeding; may need a one-line description refresh.
- **RED** (any check found definitive drift per the examples above) — re-qualify the item via `[R] Review mode` in `bmad-enhance-initiatives-backlog`, or if obsolete, move the row to §2.5 Absorbed per `backlog-format-spec.md` (never delete outright — every removal becomes a §2.5 entry).

**Scope exemptions.**
- **Age exemption:** items qualified within the last 3 calendar days are exempt from the date-triggered arm — pre-flight on fresh work is theater. Threshold rationale: Convoke's observed drift-to-surface lag from parallel sessions has been ≤24h in practice (3× multiplier gives reviewer-latency slack). Revise if evidence shifts.
- **Parallel-tracks trigger has no age exemption** — if a sibling session was active between qualification and pickup, run the pre-flight regardless of item age. "Active" = commits or backlog edits from a different session since the item's qualification timestamp.
- **Trigger-blocked exemption:** items whose Dependencies column lists an explicit trigger criterion (e.g., "blocked-on: X ships") defer the pre-flight *until the trigger fires*. At unblock-time, the pre-flight runs against the **full elapsed window** from original qualification — not a fresh clock. This is deliberate: the accumulated drift is exactly what the check is catching.
- **No-cited-surface exemption:** items with neither file anchors nor dependency references nor ID references in the Description (e.g., external-setup tasks like `gh auth` or `NPM_TOKEN` setup) are exempt by construction — the four checks have no surface to examine. The exemption is structural, not a judgment call; if you can construct a surface, run the checks.

### Qualification-time arm

**Statement.** Before qualifying an intake **older than 7 calendar days** into a lane row, verify its claim against **current source** — read the cited file, run the cited command, check the cited behaviour. Do not qualify from the intake's own text. If the claim no longer holds, close the intake with a note instead of materialising a row.

**Why.** An intake is append-only by design: it is the audit trail, and that is correct. But append-only means an intake is a **snapshot of a belief on the day it was written**, and nothing ages it. Meanwhile sibling sessions fix things incidentally, in commits about something else, with no reason to revisit an intake they never read.

Measured instance. `IN-187` was filed 2026-08-15 stating that the Review-mode step files hardcoded lane column counts of Bug 10 / Fast 9 / Initiative 10 against real tables of 11 / 10 / 11, so pre-write validation failed on every run. True when written. Commit `69c0eba6` fixed it on 2026-08-16 — inside a commit titled *"bind lane ordering to every writer, not the workflow"*, which is why nobody connected the two. On 2026-08-24 the intake was qualified into **T57**, scored 9.5, and placed at the top of the Fast Lane, where it was twice reported to the operator as the highest-priority open item. It had been fixed for eight days. Closed 2026-08-25 by audit; the pickup pre-flight would never have caught it, because check #1 searches for `T57` and `T57` postdates the fix.

**The exposure is not one row.** As of 2026-08-25 the backlog holds **178 unqualified intakes, 162 of them filed in April or earlier**, across two shipped releases. Each is a candidate for the same failure.

**How to apply.**
- **Qualifying an intake ≤ 7 days old.** Proceed normally; the belief is probably still current.
- **Qualifying an older one.** Verify against source first, then qualify. Record what you verified in the lane row's Description — one clause is enough (*"re-verified against `foo.js:42` on YYYY-MM-DD"*), and it converts the row's age from unknown to known.
- **When the claim no longer holds.** Annotate the intake in place — `*(closed YYYY-MM-DD — fixed by <commit> before qualification)*` — and do not create a lane row. Nothing is deleted; §2.1 stays append-only.
- **When it partly holds.** Qualify the surviving part only, and say which part died. Three rows in the 2026-08-25 audit (`BUG-9`, `I133`, `I157`) each bundled *an instance* with *a missing gate*; every time, someone fixed the instance incidentally and the gate outlived it while the row kept a score priced for both. **Prefer filing instance and gate as separate rows** — they decay at different rates.

**Scope exemption.** Intakes with no verifiable surface — external-setup tasks, operator decisions, questions — are exempt by construction, the same exemption the pickup arm grants.

**When to skip.** Skip only via the exemptions above. If the pre-flight feels expensive on a regular item, the item is probably over-scoped and should be split — the four checks are bounded by the item's cited surface, not the whole codebase.

**Reviewing a PR that implements a backlog item.** Ask the author: did you run the staleness pre-flight? If the answer is no and the item was qualified more than 3 days before the PR opened (or a parallel-tracks event intervened), request a retroactive run and hold the review until it's clean.

**Forward-looking note.** This rule is the Phase 1 convention-test for a future `[P] Preflight` step file in `bmad-enhance-initiatives-backlog` (tracked as I62 in the lifecycle backlog, Blocked). I62 unblocks when **either**: (a) the rule is applied ≥ 3 times with ≥ 1 real-drift hit documented in the backlog Change Log, OR (b) 2 weeks elapse since this rule's ship date (2026-04-19) — evidence-freshness deadline to prevent Phase 1 rotting. Applications are recorded via Change Log entries of the form *"Staleness pre-flight run on item X: GREEN/YELLOW/RED"* — this is the verifiable substrate the I62 trigger counts. No applications logged = Phase 1 rotted; unblock on (b) path but revisit whether the rule itself needs reshaping.

## preflight-soft-warn

**Rule.** Runtime preflight checks (BMAD compatibility, environment sanity) emit yellow WARNINGs to stderr but exit 0 — never block the install/update flow. Operators see the WARNING but the operation continues.

**Why.** Story v63-3-2 (FR23) shipped the first preflight in `scripts/update/lib/compat-preflight.js`. Detection is best-effort: Convoke is a *parallel* BMAD extension installed side-by-side, not a dependent — `node_modules/bmad-method/` is absent in the canonical Convoke dev tree, so the absent-package WARNING is the primary path that fires. False-positive hard-blocks would trap operators with legitimate non-standard installs (git-clone, monorepo, alternative distribution channels). Higher-fidelity gates ship in Story 3.3 (publish-gate) and Story 4.x (behavioral-equivalence) where the cost-benefit favors strict failure.

**How to apply.** Future preflight helpers (e.g., environment-preflight, dependency-preflight) MUST follow the same contract: stderr WARNING + exit 0 pass-through; never `process.exit(non-zero)`; never `throw` to the caller. Use `chalk.yellow(...)` so WARNING text stays under non-TTY (chalk auto-disables colors only). Live smoke against the dev tree MUST emit the WARNING — silent green is a fixture-or-gate bug, not a success signal.

---

## Rule: backlog-write-discipline

**Statement.** The lifecycle backlog's three lanes are sorted **at all times** — §2.2 Bug, §2.3 Fast and §2.4 Initiative each ordered per §"Lane Ordering" in [`backlog-format-spec.md`](_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md): live rows by composite score descending, then untriaged rows, then closed rows. Any writer who adds a lane row, edits a score, or flips a status is responsible for restoring that order **in the same edit** — whether or not the write went through `bmad-enhance-initiatives-backlog`. A row left where it landed is an incomplete edit, not a deferred chore.

**Why.** The sort rule is not new and was never missing. It is stated four times in the format spec (once per lane plus a global tiebreak) and implemented in all three workflow write paths. The lanes were unsorted anyway, because **the workflow is not what writes to the backlog.** Of the four lane rows added on 2026-08-15, zero arrived through Triage: `T37` came in `73528ea6` (a BUG-12 *fix* commit), `BUG-17` and `BUG-18` in `c841fcd2` (a BUG-16 *fix* commit), `BUG-19` in `cc28ee5c` (a Story 4.5 *docs* commit). Two of them arrived malformed — 10 columns against an 11-column table — because no validation ran on a hand-edit. Restating the rule inside the skill would have changed nothing; the obligation has to sit where the hand-editors read, which is this file.

The cost is not tidiness. Position is the first thing a reader uses to pick up work, so an unsorted lane misdirects. Measured 2026-08-16: the Bug Lane held a **closed** row scoring 17.1 at position 4, directly above `BUG-15` (17.9, Open) — the highest-scoring open item in the project, reading as fifth-most-important. That is the same class of harm as `BUG-8` sitting `Open` for six days after shipping: the table asserted something false and everyone downstream believed it.

**How to apply.**

- **Adding a lane row by hand.** Compute the RICE composite first, then insert at its sorted position — not at the top, not at the bottom. Copy the column layout from an adjacent row in the same table rather than from memory; that is what `BUG-17`/`BUG-18` got wrong.
- **Closing a row is a MOVE, not a status edit.** The row leaves its lane for §2.5 in the same edit that closes it — see "Closing a Row" in [`backlog-format-spec.md`](_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md). Demoting it to the bottom of the lane is the *superseded* rule; leaving it in the lane at all is now a detectable error rather than a judgement call about position.
- **Rescoring.** Re-place the row; a changed score with an unchanged position is a silent lie.
- **Before emitting a commit plan that touches the backlog.** Run the check below and paste its result into the commit Description. It costs one command.
- **Reviewing a diff that adds or edits a lane row.** Verify the position. If the row was appended to the end of a table that is not sorted ascending, block and cite this rule.
- **Prefer the workflow when it fits.** `bmad-enhance-initiatives-backlog` Triage mode logs the intake, cross-references it, sorts, and writes the Change Log entry. A hand-edit does none of that for free. Use it for anything larger than a single row.

**The check — `node scripts/audit/backlog-integrity.js`.** Shipped by **T58** (2026-08-25) and wired
into CI at `.github/workflows/ci.yml:161`, so it runs on every push whether or not anyone remembers
it. Run it locally before emitting a commit plan that touches the backlog and paste the result into
the Description.

It asserts four things; two of them are this rule: *lane shape* (lanes are score-ordered and hold no
closed rows) covers clauses 1 and 3, alongside referential integrity, per-table arity, and structure
and coverage. Verified by mutation 2026-08-26 — moving `T51` (7.65) below a 2.8 row and marking a
lane row `✅ Done` in place were both caught, exit 1, with the offending ID and line named.

> **An inline Python check used to live here and was deleted 2026-08-26 — do not restore it.** It
> hardcoded column positions (`f[6]` for Score, `f[8]` for Status). When **T69** added the `Filed`
> column the Fast Lane went from 10 fields to 11, and those indices silently became *E* and
> *Portfolio*: the check reported **51 violations** against a correctly-sorted backlog, with scores
> like `BUG-19 (2.0)` for a row scoring 5.7. Anyone following this rule got a wall of false failures
> and either ignored the gate or "fixed" a lane that was already right. `backlog-integrity.js` reads
> each table's own header, so it survived the same schema change untouched — which is the argument
> for a script over a snippet, and an instance of `derive-counts-from-source`.

**Scope exemptions.** §2.1 Intakes are append-only and carry no score — they are never sorted. §2.5 sub-tables are append-only receipts and are never sorted. Untriaged lane rows (`?` for R/I/C/E, `—` for Score) have no sort key and park after the live block per clause 2 — there is no closed block in a lane to park before, since clause 3 evicts closed rows to §2.5.

**Note.** This section *is* the pointer the previous version anticipated. It read: *"The durable version is a shape-and-order assertion wired into `docs:audit` or `convoke-doctor` so that any writer is caught — tracked in the lifecycle backlog, qualified from `IN-188`. When that ships, this section reduces to a pointer."* `IN-188` was qualified into **T58**, T58 shipped, and the section has been reduced accordingly.

---

## Rule: external-claims-must-be-executed-or-hedged

**Statement.** Any assertion about the behaviour of a system **outside this repository** — a registry, a package manager's internals, a third-party API, a CI runner environment, a hosted setting — must be one of:

1. **Executed**, against the basis that will actually be used — not a fixture, not a different OS, not a summary — with the command and its output recorded; or
2. **Quoted verbatim from primary source**, with the source identified (raw doc file, source code with file:line, live API response); or
3. **Explicitly marked unverified**, naming what would settle it.

A claim that is none of these does not enter a governed artifact — not an ADR, an epic, a story AC, a backlog row, or an operator runbook. **"I read the docs" is not execution, and a documentation summary is not the docs.**

**Why.** `dist-epic-1` produced 36 correction rounds across 7 stories, and the defects sort almost perfectly along this line. Everything executable locally — gate composition, pack counts, lane order, backlog integrity — was correct on the first attempt. Every claim about npm's behaviour was wrong, unverifiable, or still open:

| Claim | Outcome |
|---|---|
| `EPUBLISHCONFLICT` is npm's duplicate-version error | **False** — no thrower exists; it lives only in a formatter |
| The 2FA setting makes hand-publishing impossible | **Inverted** — npm's wording is that a maintainer *"must publish interactively"* |
| `git status --porcelain --ignored=matching` gates a clean tree | **Verified in a fixture**; returns 161 lines in this repo and can never pass |
| BSD vs GNU `sort -V` agree | Disclosed, never closed; still unexecuted on a runner |
| `auth-only` satisfies the package publishing policy | **Still unknown** — shipped as a recorded open risk |

Each wrong claim generated its own correction round, and the corrections asserted *new* unverified claims in turn — ADR-003's central premise was swept four times before the approach itself had to change.

**How to apply.**
- Before writing an external fact into an artifact, ask: *did I run this, or did I read about it?* If read — quote the primary source and say so, or hedge.
- Prefer **raw source** over rendered docs and over search summaries. Two summarisers disagreed about which npm 2FA option carried which sentence; fetching the raw `.mdx` settled it in one command.
- When execution is impossible (a hosted setting with no read-back, an account state you cannot reach), say **"documented, not observed"** and name the observation that would close it. That phrasing is the deliverable — not a weaker version of one.
- **Correcting an overclaim with an unhedged counter-claim is the same defect pointed the other way.** It happened here: "impossible" was replaced with "never removed", when the evidence supported only "documented, not observed".
- **Reviewing a PR.** If a diff asserts external behaviour with no command, no quote, and no hedge, block and cite this rule.

---

## Rule: documentation-claims-must-be-derived

**Statement.** Any sentence in project documentation that asserts something about **this repository's own behaviour** — a command, a CI gate, a threshold, a convention, a policy — must be derived from the source that determines it, at the time of writing. Recalled, inferred, or pattern-matched claims do not enter documentation. A policy that does not exist yet is a **proposal**, not a fact, and must not be written in the indicative.

**Operational check.** For each assertion in the diff, name the file that determines it and read it. Conventions come from `git log`, gates from `.github/workflows/`, thresholds from their config file, rules from this file. If no file determines the claim, it is not a fact about the system — get it ratified, then write it.

**Why.** Commit `832a18db` (2026-08-25) added `CONTRIBUTING.md`, `SECURITY.md` and the GitHub templates. Five mechanical checks passed — `docs:audit`, `install-scope-check`, `backlog-integrity`, `lint`, `npm pack --dry-run` — and all 12 relative links plus 4 asserted paths resolved. It shipped with two defects, both inside the section that declares itself normative and says it overrides everything else in the file:

| Claim written | Reality |
|---|---|
| Commit types are `feat, fix, docs, test, chore, refactor, governance` | `test` and `refactor` appear in **none** of the last 400 commits; `ci` and `release` are used and were omitted |
| "Entries are written at release time" stated as established policy | **No such policy existed.** Inferred from how `CHANGELOG.md` reads, then published under the maintainer's authority |

Three shell commands found both, after the commit was pushed. No gate could have: `docs:audit` walks the agent/workflow registry and checks link *shape*. Nothing in this repository has an opinion about whether a sentence is true.

**How to apply.**
- **"Shape passed" is not "content verified."** Link checkers, YAML parsers and pack listings verify shape only. When reporting verification of a documentation change, say which of the two you ran.
- **For a documentation change, verifying the assertions substitutes for reviewing the diff.** It is the higher-yield pass, not a lighter one — a diff review reads prose for plausibility, which is exactly what a wrong-but-plausible claim survives.
- **Do not invent policy while documenting it.** If the artifact needs a rule that does not exist, name it as an open decision and route it to the operator. If the ratified rule binds contributors or agents, it belongs in this file, not only in prose docs.
- **Reviewing a PR.** If a docs diff asserts repository behaviour and the change shows no derivation — no command, no cited file — block and cite this rule.

**Related, and deliberately distinct.** `derive-counts-from-source` covers counts; `spec-verify-referenced-files` covers whether a referenced file *exists*; `external-claims-must-be-executed-or-hedged` covers systems outside this repository. This rule covers claims about **this** repository that are neither counts nor paths — the ones that are true or false rather than present or absent.

---

## Rule: verification-must-be-falsifiable

**Statement.** Before citing a check as evidence, establish that it could have said something else. Run it against a known-bad input, or mutate the thing it inspects and confirm it goes red. A check that cannot fail is not weak evidence — it is **no** evidence, and it is worse than none because it reads like proof.

`verification-pipefail` is one instance of this defect. This rule is the general case, and it applies to **ad-hoc verification during work**, not only to checks cited in a review.

**Why.** Five failures, every one of which produced a confident wrong answer. The first four fell in three days; the fifth is from `dist-2-5` (2026-09-02) and is the same error one level in — see below:

| What was run | What it looked like | What it was |
|---|---|---|
| `npm run badges:check \| tail -8; echo $?` | `exit=0`, gate passes | `$?` was `tail`'s. True exit was 1; the gate was blocking the release |
| `grep -c 'convoke-agents@${getPackageVersion()}' file` | `0` — "the fix isn't in the tarball" | `{}` is a grep interval expression. The fix *was* there; a false alarm was raised against a correct build |
| `npx -p convoke-agents convoke-version` → `3.3.0` | "good, `-p` bypasses the stale global" | It did — and also served a version two releases old. Half the claim was verified, all of it was reported. This became BUG-16 |
| Generator mutation harness, 4 cases | all `exit=1` — "guards work" | No `node_modules` in the scratch tree. All four died on `Cannot find module 'yaml'`. Nothing was tested |
| `node --test <file>` after a mutation → `ℹ pass 8 / fail 1` | "the mutant is caught; the suite guards this" | Something failed; not the thing claimed. The atomicity test survived every mutant — the *race* test died each time. Reported as mutation-verified twice, in two successive review rounds (`dist-2-5`, 2026-09-02) |

A sixth was caught only by luck: a backlog column-arity check that flagged 71 correct rows, which would have made the gate unreadable had it shipped.

> **Historical record — do not "repair" these rows.** All four are real incidents and stay verbatim;
> they are this rule's entire justification. Two of them now name a surface that no longer exists:
> row 1's `npm run badges:check` and row 4's generator mutation harness both targeted the badges
> pipeline, deleted by [ADR-001](_bmad-output/planning-artifacts/adr/4-0-1/adr-001-retire-badges-pipeline.md)
> (story `dist-1-1`). What the rows document is the *reasoning* error, not the command — rewriting
> them against a live command would destroy the evidence and teach nothing.

The common shape is not carelessness about shell syntax. It is **reading a check's output as evidence without ever seeing it produce the other answer.** The **last** row is that error one level in: the check *did* produce the other answer, and the other answer was never read. A count is not an attribution.

**How to apply.**
- **Before citing any check, show it red.** Mutate the input — inject the defect, delete the file, revert the fix — and confirm the check fails and names the right thing. Then restore and confirm it passes. Both directions, or it is not a check.
- **When the check is a SUITE, name the assertion that died — a pass/fail count is not evidence.** `fail 1` says something broke; it does not say *what*, and the difference is the whole claim. Run the mutant with the failing test names visible (`node --test … | grep '^  ✖'`, or `--test-name-pattern` to isolate) and record **mutant → test** as a table, not a tally. Two consequences follow, and both have bitten:
  - **A test that no mutant uniquely kills is not proven to guard anything.** In `dist-2-5` two successive versions of an atomicity test passed against a zero-atomicity implementation; each time a sibling test absorbed the mutant and the count read `fail 1`. The phantom survived a review round *because the evidence for it was a number*.
  - **Choose mutants that target one property each.** A mutant that breaks several properties at once cannot distinguish a load-bearing test from a bystander. Aim for a battery where every test is the sole executioner of at least one mutant; a test that never is should be deleted or rewritten, because nothing would notice its removal.
- **The mutant must be the defect you are claiming to guard against, not merely *a* defect.** "Delete the call" is a weaker mutant than "replace the call with the wrong-but-plausible alternative": the first is caught by anything downstream, the second is what a future maintainer actually writes. `dist-2-5`'s decisive mutant was not *remove the atomic write* but *write the same bytes to the published name instead of the temp* — the shape of an innocent refactor.
- **A new gate is not shippable until it has failed once on purpose.** `backlog-integrity.js` was proven against the pushed commit that had actually lost the rows; `cli-guidance-check` (withdrawn) shipped twice matching nothing because that step was skipped.
- **State the falsification in the commit Description**, per `commit-preparation` field 5. "Verified by execution" without naming the failing case is the phrasing this rule exists to catch — it appeared in three commit messages this week, none of which had run a negative case. Where the claim is about what the CODE guarantees rather than about a check you ran, `verification-claims-must-name-their-evidence` is the governing rule.
- **Prefer a check that fires on the real artifact.** Verify the published tarball rather than the source, the emitted string rather than the code that emits it, the committed file rather than the working tree. Every failure above inspected a proxy.
- **Scratch harnesses need their dependencies.** A mutation matrix where every case fails identically is testing your harness, not your code. If all rows of a matrix agree, suspect the harness first.
- **Watch for the check that only ever passes.** If you cannot construct an input that makes it fail, it is asserting nothing — delete it or narrow it until it can.

**Exception.** None. If a check genuinely cannot be falsified — a tautology, a count of itself — it must not be cited as evidence at all.

---

## Rule: verification-claims-must-name-their-evidence

**Statement.** Any sentence asserting that the code *guarantees*, *proves*, *checks*, *cannot do*, or *is independent of* something must name the thing that makes it true — a `file:line` that implements it, or a command whose output demonstrates it. This binds comments, spec text, acceptance criteria and test names, not only commit messages. A claim of this shape with no pointer is a **plan**, not a description, and must be written as one.

**Operational check.** For each such sentence in the diff, answer: *which line of code does this, and what would I run to see it fail?* If the answer is "I did it in a shell once", the sentence is false — the shell is not the artifact. If the answer is "the mutation kills it", name **which assertion** goes red, because a mutation can die on an unrelated one.

There is deliberately **no grep here.** The obvious one — `cannot|never|always|guarantee|proves|independent of` over added comment lines — returns 30 hits on the T103 diff, nearly all legitimate history prose. Per `catch-all-phase-review` that false-positive rate disqualifies it, and a gate nobody trusts is worse than an explicit human step.

**Why.** T103 (`f192117a` → `810f1788`) ran three adversarial review rounds plus a delta review of the remediation: eight HIGH findings. Seven distinct false claims about the code's own correctness apparatus were found, and **three of them were introduced by corrections written to fix earlier ones**:

| Claim written | Where | Reality |
|---|---|---|
| "the caller cross-checks the two counts against an independently-derived total" | code comment | No such computation was ever written. It was run once in a shell, then described as if the code did it |
| "Assumptions audited — **do not re-derive in review**" | spec Design Notes | The assumption it protected was false on the tree that day. Both reviewers found the blocker only by ignoring the instruction |
| "the mutation … makes the message appear and kills it" | test comment | The kill came from an unrelated arithmetic assertion. The guard it claimed to prove had **zero** coverage — removing it survived the suite |
| "blind to the block bound" / "counts every line ANYWHERE in the file" | 2 comments + 1 AC | Gated entirely on `inBlock`; not blind to it, and not file-wide |
| "cannot detect one that never opened" | correction to the above | It detects exactly that, loudly |
| "real sibling keys in this file carry underscores" | correction to the above | `generated:` and `project:` carry none and do match; safety came from ordering |
| verb distribution "on story-shaped scopes" | code comment + spec | Measured over the story **+ epic** population; the story-only figures differ |

The cost is not tidiness. The first row is why a second silent data-loss path survived a whole round: the remedy for the *class* was written into a comment claiming it had been implemented, so nobody built it, and one de-indented key went on discarding **302 of 451** keys while printing a clean result and exiting 0.

**None of these was caught by a test, by `lint`, by CI, or by the mutation matrix** — every one of those instruments reads code, and a comment is not code. Only an adversarial reader caught them, which is why this is a rule about writing rather than a check.

**How to apply.**
- **Point at it or don't claim it.** "Cross-checked against an independent count" needs the line that computes it. If you cannot cite one, write *"not cross-checked"* — that phrasing is the deliverable, not a weaker version of one.
- **Negative claims are the dangerous ones.** "This cannot happen", "it cannot detect X" invite the reader to stop looking. Run the negative case before writing it; two of the rows above are negative claims that were simply false.
- **Never instruct a reviewer not to verify something.** *"Do not re-derive in review"* manufactures the blind spot it sits in front of. If a figure is expensive to re-derive, record the command instead so re-deriving is cheap.
- **When a fix is defended by a mutation, name the assertion.** "M6 kills it" is insufficient; "M6 turns `it('…')` red on its second assertion" is checkable.
- **Correcting a false claim is where the next one gets written.** Three of the seven arrived that way. Re-run the check *after* editing the sentence, against the sentence you actually wrote.
- **Reviewing a PR.** For every sentence asserting a guarantee, ask for the `file:line` or the command. If the author cannot produce one, the claim is the finding — regardless of whether the code is correct.

**Related, and deliberately distinct.** `verification-must-be-falsifiable` governs a check you **ran** and cite as evidence — show it can fail. `documentation-claims-must-be-derived` governs claims about repository behaviour in documentation. `external-claims-must-be-executed-or-hedged` governs systems outside this repo. All three assume the thing being described **exists**. This rule covers the case those three cannot see: a sentence describing the code's own correctness apparatus when that apparatus is absent, weaker than stated, or credited to the wrong assertion.

**Exception.** Prose that records *history* or *intent* rather than a present property — "this exists because `c841fcd2` deleted the BUG-16 row" — is exempt, and this file depends on such prose. The test is tense and mood: a claim about what the code **does now** needs a pointer; a claim about what happened does not.

---

## Rule: commit-preparation

**Statement.** The operator commits through GitHub Desktop and does not hand-author commits. Therefore the agent MUST produce an explicit **commit plan** for any change it makes, and the operator executes that plan rather than improvising. A commit plan is an ordered list of commits; each entry carries exactly three things:

1. **Files** — the complete list to stage for that commit, and nothing else.
2. **Summary** — one line, ≤ 72 chars, `<type>(<scope>): <intent>`. Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `governance`. Scope is the story ID (`v63-4-5`), backlog ID (`T25`), or module (`doctor`). The summary states *intent*, never the filename.
3. **Description** — why the change exists, what it affects, and the review status of the change (`Round 1: PASS` / `Round 1: findings applied` / `Round 1: skipped — <reason>`).
4. **Staged set** — the command that proves the staged set equals the Files list: `git diff --cached --name-only`. Run it *after* staging and *before* committing.
5. **Falsifiable** — for every check the Description cites as evidence, one clause naming how it was shown able to fail. `lint 0` is not evidence unless lint can go red on this change; a new gate is not evidence until it has been run against a known-bad input. See `verification-must-be-falsifiable`.

**Never acceptable:** `Update <filename>` / `Create <filename>` as a summary. It carries zero intent and makes `git log` unreadable as a history of decisions.

**Why.** Every commit in this repository as of 2026-08-15 is a single file with a GitHub-Desktop-default message. The consequence is not cosmetic: `scripts/lib/taxonomy-merger.js` and its test landed in two separate commits on 2026-08-15, violating the Phase 3 Epic 1 atomic-commit rule — not through carelessness but because file-by-file staging in a GUI makes atomic multi-file commits the harder path. A history of `Update X` cannot be bisected by intent, cannot be reviewed as a changeset, and cannot answer "why did this change?" for any future reader, human or agent.

**How to apply.**
- **Agent side.** After completing any change, emit the commit plan before the operator asks. Group by *logical change*, not by file — source and its test belong in one commit, a rename and its call sites belong in one commit. If a change genuinely splits into several commits, order them so each one leaves the tree green.
- **Operator side.** In GitHub Desktop, check only the files listed for commit 1, paste Summary and Description, commit; then repeat for commit 2. Do not commit files the plan didn't list — an unlisted modified file means the plan is stale, so ask for a refresh.
- **⚠ Never instruct line-level staging on a MODIFIED line.** This is the most damaging instruction in this rule's history. A modified table row appears in the diff as `-old` followed by `+new`; staging the `-` side without the `+` side **deletes the row outright**, silently, with every check green. It has destroyed backlog records twice: `c841fcd2` dropped the BUG-16 row while shipping BUG-16's own fix, and `3a3de195` dropped T35 (an *open* risk item) and T39 while its message claimed to have repaired them. Both times the agent had instructed line-level staging because a concurrent session shared the file.
  - **Prefer whole-file staging** whenever the only dirty hunks in that file are the agent's own. Check first with `git diff --name-only`; if a file is shared, say so explicitly rather than defaulting to line-level.
  - **When line-level is genuinely unavoidable** (a file carrying two sessions' work), stage *whole hunks*, never individual lines, and verify before committing — `git diff --cached` must show both sides of every modified line.
  - **Backstop.** `scripts/audit/backlog-integrity.js` runs in CI and fails on any `BUG-n`/`T-n` cited by a row that no longer has one. It catches the symptom after a push; the guidance above is what prevents it.
- **Review coupling.** A commit plan is a landing point per `code-review-convergence`. Preparing a plan without a Round 1 on the changes it covers is a rule violation; if review is deliberately skipped (e.g. a docs typo), say so in the Description rather than leaving it silent.
- **Enforcement — the chokepoint exists; the backstop does not.** The commit-plan handoff is the *chokepoint* gate, and it only covers commits that pass through an agent session. **There is currently no automated backstop.** An earlier version of this bullet asserted one in the indicative — *"a story cannot reach `done` without a review record, and a commit touching `scripts/**/*.js` must touch its test or carry an explicit opt-out"* — and that gate was never built. Verified 2026-08-26: no job in `.github/workflows/ci.yml` asserts a review record or a test-touch, and no script under `scripts/audit/` mentions review.

  The correction matters because the false sentence had a cost. On story `gen-1-1`, `code-review-convergence`'s mandatory Round 2 was skipped, the reasoning *"the HIGH is fixed"* was written into a pushed commit, and **132 lines shipped unreviewed** — caught only when the operator asked whether reviews had been included. Rounds 2 and 3 then found four more HIGH, including a fix that deleted 41 of 53 manifest rows while reporting *"other modules preserved"*. Nothing caught the bypass, because nothing was watching for it. This is the same defect class as `documentation-claims-must-be-derived`, occurring inside the file that defines that rule: **a policy written in the indicative before it exists tells the next reader they are protected when they are not.**

  Building the gate is tracked as **T77**. Until it ships, the chokepoint is the only enforcement, which means a skipped round is invisible unless a human asks — and that has now happened twice across sessions.
