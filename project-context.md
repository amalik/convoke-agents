# Convoke Project Context

Rules and conventions that BMAD dev agents and contributors must follow when working in this repository. These are encoded here (not just in retros) so that the dev agent reads them before writing code.

> **Authoring a new skill, workflow, or agent under `_bmad/bme/`?** Before anything else, read [The Convoke Operator Covenant](_bmad-output/planning-artifacts/convoke-covenant-operator.md) — one axiom and seven commitments every Convoke skill must honor — and self-check against the [Covenant Compliance Checklist](_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md). The rule is `covenant-compliance-for-convoke-skills` below. Covenant compliance is an architectural concern, not a styling concern: it's what makes a `_bmad/bme/` skill a *Convoke* skill rather than a generic one.

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

## Rule: covenant-compliance-for-convoke-skills

**Statement.** Before authoring a new skill, workflow, or agent under `_bmad/bme/` (Convoke's owned namespace), the author must read [The Convoke Operator Covenant](_bmad-output/planning-artifacts/convoke-covenant-operator.md) and self-check the deliverable against the [Covenant Compliance Checklist](_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md) before marking the story ready-for-review.

**Why.** The Covenant encodes one axiom ("the operator is the resolver") and seven Operator Rights that distinguish a Convoke skill from a generic skill. Authoring without consulting it produces skills that look structurally correct but violate the operator-experience standard the rest of the ecosystem relies on. The baseline audit (2026-04-18) found 10 violations across 56 cells (~82% compliance) in existing skills — all of them introduced by authors who never had the Covenant to consult. Making the Covenant required reading at the point of authorship is how we stop adding new violations while we retrofit the old ones.

**How to apply.**
- **Authoring a new `_bmad/bme/` skill or workflow.** Read the Covenant before you start. When drafting the deliverable, work through the Checklist's OC-R1 through OC-R7 rules and confirm each either PASSes or has a declared N/A variant with rationale.
- **Reviewing a `_bmad/bme/` skill PR.** Check whether the author ran the Checklist. If the diff introduces new operator-facing behavior (prompts, errors, output formats, decision points), verify the relevant Right's compliance — cite the specific OC-Rn rule in the review comment, not a generic "improve UX" note.
- **Exception: upstream BMAD contributions.** Skills contributed upstream (`_bmad/core/`, `_bmad/bmm/`, `_bmad/bmb/`, etc.) are out of scope for the Covenant — it's a Convoke-specific standard, not a BMAD Method requirement. If the skill is genuinely upstream-appropriate (see `namespace-decision-for-new-skills`), the Covenant does not apply.
- **Reference, not boilerplate.** Cite the Covenant by its display name and link, with a sentence explaining *why* compliance matters for the surface in question. "See the Covenant" with no rationale violates the Right to rationale that the Covenant itself encodes.

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
