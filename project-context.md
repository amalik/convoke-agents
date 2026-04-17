# Convoke Project Context

Rules and conventions that BMAD dev agents and contributors must follow when working in this repository. These are encoded here (not just in retros) so that the dev agent reads them before writing code.

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
- **Round 1** is mandatory.
- **Round 2** is triggered only if Round 1 produces any HIGH-severity finding.
- **Round 3** is triggered only if Round 2 introduces structural changes (new files, renamed functions, altered control flow) — not for wording fixes, comment edits, or cosmetic patches.
- **No Round 4.** If Round 3 still has issues, defer remaining findings to the backlog (via `bmad-enhance-initiatives-backlog` Triage mode) rather than running another review pass.

**Why.** Story 7.3 went through 3 unbounded review rounds producing 30 findings. The unbounded "keep reviewing until clean" pattern wastes time and generates diminishing-return findings. Retrospective: ag-epic-7-retro-2026-04-10, Action Item #3.

**How to apply.**
- When running `bmad-code-review`, track the current round number. The skill's step-04-present enforces the stopping criteria at the "Re-run code review" prompt.
- If you're manually re-running a review, check whether the stopping criteria are met before proceeding.
- If Round 2 produces only LOW/MEDIUM findings (no HIGH), stop — do not trigger Round 3.
- Remaining findings after the final allowed round go to the initiatives backlog as deferred items, not into another review cycle.
