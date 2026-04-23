# Deferred Work — Code Review Findings

This file collects code-review findings that were classified as `defer` —
real issues, but pre-existing or out of scope for the story under review.

---

## Deferred from: code review of v63-2-3-integrate-registry-gate-into-convoke-update (2026-04-24)

Round 1 code review added 2 `defer` items — both LOW, both CI-hygiene concerns with no live correctness impact:

- **200ms hardcoded stdin-write delay in `runScriptWithInput`** — Blind+Edge LOW. The test helper uses `setTimeout(..., 200)` to write piped input, assuming readline is ready by then. Works today, but burns 200ms × 7 tests = 1.4s in the Story 2.3 suite, and risks hanging on slow CI if convoke-update prompts earlier than 200ms for interactive paths. Also: on 15s timeout, `fs.remove(tmpDir)` may fail silently on macOS if SIGTERM leaves orphan child processes holding file descriptors. Fix path: refactor to `child.stdin.on('ready', ...)` or use a write-when-flowing pattern; add fs.remove retry on EBUSY.
- **`_scanWithSuppressedStderr` "no concurrent invocations" invariant violation** — Edge LOW. `scripts/convoke-doctor.js`'s helper mutates global `console.error` during the scan. JSDoc says "safe ONLY because `main()` runs checks serially" — but Story 2.3's new call-site in convoke-update runs post-`runMigrations`, where migration-runner cleanup logic may log to stderr concurrently. Actual risk: timing-based silent log swallow during the ~5-50ms scan window. Low probability (runMigrations is awaited before the gate), but the documented invariant is formally violated. Fix path: refactor convoke-doctor's helper to stack-counted reentrant shim, or assert sync-only at runtime via Promise-detection. Revisit if stderr silencing becomes observable.

---

---

## Deferred from: code review of v63-2-2-integrate-governance-check-into-convoke-doctor (2026-04-23)

Round 1 code review added 3 `defer` items — all LOW, all non-impactful today but worth watching:

- **FR17 CSV template not RFC-4180-escape-safe** — Blind Hunter LOW. The `fix:` string in the unregistered-custom-skill finding builds a literal CSV row by interpolating `${r.skill_name},${r.bmm_agent},...` into a comma-separated template. If a skill name ever contains commas, quotes, or CRLF, a user copy-pasting the suggestion into `bmm-dependencies.csv` would produce a malformed row. Skill directory naming convention currently prevents this (kebab-case, no special chars), so no live exposure. Fix path: use `formatCsvRow` from csv-utils when building the suggestion, OR document that skill names must stay kebab-safe. Defer until a user reports breakage.
- **Broken-symlink UX in skill-gone categorization** — Edge Hunter LOW. `fs.existsSync(path.join(claudeSkillsRoot, r.skill_name))` returns false for dangling symlinks (symlink target missing) — same result as skill-dir genuinely absent. An operator whose `.claude/skills/foo` is a symlink to an unmounted external volume would see `[stale:skill-gone]` warnings that don't match their mental model. Fix path: `fs.lstatSync` + link-target check to distinguish "absent" from "dangling symlink" in the warning text. Low-priority UX polish.
- **Test fixture coupling between Story 2.1 and 2.2** — Edge Hunter LOW. Story 2.2's `tests/unit/bmm-dependencies-doctor.test.js` reuses `tests/fixtures/bmm-dependencies/*` from Story 2.1. If a future 2.1 story mutates these fixtures (e.g., adding deps to `skill-with-removed-dep`), Story 2.2's stale/drift tests will shift. Works today because 2.1 fixtures are frozen. Defensive fix path: 2.2 tests construct minimal skill directories inline for cases where exact content matters, reducing cross-story coupling. Low ROI at current fixture stability.

Round 2 code review added 2 more `defer` items (both LOW):

- **H1 integration test non-hermetic via live taxonomy.yaml read** — Edge Hunter Round 2 LOW. The new `convoke-doctor: governance softWarning exit-code` test in `tests/integration/convoke-doctor.test.js` reads the repo's live `_bmad/_config/taxonomy.yaml` to populate the fixture's taxonomy. If the live taxonomy becomes mid-refactor invalid on a branch, the integration test goes red for unrelated reasons. Also if taxonomy.yaml is ever deleted, the test fails with ENOENT before reaching its assertions. Fix path: pin a minimal inline YAML fixture matching the schema's required shape (initiatives + artifact_types), OR wrap the live read in a descriptive error message pointing at the broken taxonomy. Low-impact today because taxonomy.yaml is stable and load-bearing.
- **H1 integration test fixture doesn't create package.json** — Blind Hunter Round 2 LOW. The H1 fixture creates `_bmad/`, agents, skills, taxonomy, `_bmad-output/` — but NOT a `package.json`. `findProjectRoot` walks up from `tmpDir` looking for `package.json` and eventually lands on the real repo's. Works today (pkg.version matches the fixture's version config so `checkVersionConsistency` passes). Couples integration test to the repo's current package.json. Fix path: write a pinned `{"name":"fixture","version":"${pkg.version}"}` into `tmpDir/package.json`. Hardens test isolation.

---

## Deferred from: code review of v63-2-1-create-bmm-dependency-scan-tool-and-registry (2026-04-23)

Round 1 code review produced 2 `defer` items — real concerns that don't block Story 2.1's AC surface but should be re-evaluated during Story 2.4 or a future refinement cycle.

- **Manual-row ordering lost in `_sortWithFr18Pin`** — Blind Hunter LOW. Task 4.3 spec said "manual rows preserved in their original order" but implementation feeds manual rows through `_sortWithFr18Pin` which re-sorts alphabetically by `(skill_name, bmm_agent)`. AC8 only enforces byte-identical content preservation, not ordering — so no AC violation, but a mild spec deviation. Fix path: in `mergePreservingManual`, emit manual rows with preserved input order ahead of sorted scan rows; OR amend the spec if operator workflow doesn't care about manual-row ordering. Story 2.4 (manual registration UX) should decide whether ordering matters.
- **`_inferSourceModule` `/^q\d/` too broad for theoretical names** — Blind Hunter LOW. The regex `/^q\d/.test(skillName) || skillName.startsWith('q-')` matches `q0-init` (intended, FPF) but also any future skill named `q2k-legacy` or `quantum-*`. No current or near-future skill matches the problematic pattern. Fix path: tighten to `/^q\d-/` to require trailing hyphen; alternatively defer until a real mis-classification appears. **(RESOLVED in Round 1 via D1 extended prefix rule — regex tightened to `/^q\d-/`. Keeping this entry for historical context.)**

Round 2 code review added 3 more `defer` items:

- **H1 ISO-8601 timestamp dates silently overwritten** — Edge Case Hunter LOW. `/^\d{4}-\d{2}-\d{2}$/` rejects full ISO-8601 timestamps like `2026-04-23T10:30:00Z`, causing the preserve-step to discard the date and restamp with today's. No warning logged. Defensive but data-lossy. Fix path: widen regex to accept full ISO-8601 OR log `[warn] malformed registered_date dropped: ...` when the preserve-step rejects a value. Low severity because the scanner always writes `YYYY-MM-DD`; only affects CSVs edited by foreign tools.
- **Missing integration test for FR18 + merge + dedup three-way interaction** — Edge Case Hunter LOW. `_sortWithFr18Pin` handles manual+auto uniformly so logic should hold, but sort stability across the three code paths (manual-only, dedup-survivor, FR18-pinned) is untested. Add one fixture case in Story 2.4: manual row for `bmad-enhance-initiatives-backlog` + scan also emits same (skill, agent) pair + 2 other skills — assert FR18 row pinned first, manual wins dedup.
- **Duplicate manual rows for same (skill, agent) pair silently preserved** — Blind Hunter Round 2 LOW. If two manual rows with same `(skill, agent)` appear in the CSV (operator appended accidentally), both are preserved and both survive output. No uniqueness invariant enforced, no stderr warning. Fix path: in `mergePreservingManual`, add `manualPairSeen` Set tracking — log `[warn] duplicate manual entry ...` on collision and keep the first row. Story 2.4 manual-registration workflow should prevent this at authoring time.

---

## Deferred from: code review of v63-1a-6-author-migration-guide-standalone-deliverable (2026-04-22 + 2026-04-23)

Round 1 code review of Story 1A.6's migration guide + CLI wiring. 1 `defer` item — spec-authoring convention gap, not an implementation miss.

- **AC7 measurement proxy too narrow** — Edge Case Hunter MED. AC7's validation script only walks `[text](url)` markdown-link patterns. Bare prose references (the CLI path string `docs/migration/3.x-to-4.0.md` emitted to stdout, the CSV path `_bmad/_config/bmm-dependencies.csv` referenced in guide body) escape the check. This means Story 1A.6's broken-link check passed while still containing unresolvable prose references. Fix path: future stories that carry "no broken links" ACs should specify a proxy that walks prose citations of file paths (e.g., regex for `(scripts|docs|_bmad|tests)/\S+\.(md|js|yaml|csv)` and verify each resolves). Not actionable against 1A.6's implementation — spec-authoring-convention refinement, belongs to a future AC-template story.

Round 2 code review added 3 more `defer` items (all LOW):

- **Missing test coverage for v1.7.x multi-hop positive case** — Blind Hunter Round 2 LOW. P2's gate fires when the migration chain includes a `-to-4.0.0` hop, which for 1.7.1 walks `1.7.x-to-2.0.0 → 2.0.x-to-3.1.0 → 3.1.x-to-4.0.0`. The v3.x test (added in Round 1 P1) covers direct 3.x→4.0 upgrade; no test pins the multi-hop positive path. If a future registry edit breaks the 1.7→4.0 chain, the gate silently drops the guide link from 1.7.x users and no test catches it. Fix path: add a test case with `createInstallation(tmpDir, '1.7.1')` asserting the guide URL appears. Can land in Epic 5B (release discipline) or as a standalone test-hardening story.
- **Hardcoded GitHub URL in CLI output** — Blind Hunter Round 2 LOW. `scripts/update/convoke-update.js:223` emits a literal string `https://github.com/amalik/convoke-agents/blob/main/docs/migration/3.x-to-4.0.md`. Correct today (matches `package.json.repository.url` owner segment), but fragile against future repo renames/forks. Fix path: 3–5 LOC helper that parses `package.json.repository.url` and constructs the blob URL dynamically. Defer to Epic 5B or a separate refactor — not worth blocking 1A.6 ship.
- **PF1 rephrase still uses present-tense "validates" for unshipped Epic 4 scope** — Blind Hunter Round 2 LOW. The guide says "Convoke 4.0 validates agent output equivalence as part of release gating" but Epic 4 (PF1 validation battery) is unshipped as of 1A.6 ship. The rephrase asserts a PROCESS rather than a SHIPPED FEATURE, so it's acceptable — but if Epic 4 slips past 4.0 release the claim becomes premature. Fix path: re-read the guide at Epic 4 ship time; if Epic 4 still slipping, tighten wording to "will validate" or remove the bullet. No action required until Epic 4 status clarifies.

---

## Deferred from: code review of v63-1a-2-create-config-loader-js-with-direct-yaml-loading (2026-04-21)

Round 1 code review of the `config-loader.js` implementation produced 9 `defer` items — real concerns that exceed Story 1A.2's 4.0-scoped AC surface. Acceptance Auditor verified all 9 story ACs satisfied; these defers cover defensive-hardening opportunities the audit explicitly de-scoped or that belong to later stories.

- **`console.warn` side-effects not routable** — Blind Hunter MED. Library writes to stderr directly via `console.warn` for deprecation + YAML warnings. Callers (CLI, JSON-logging consumers, test runners) can't route or suppress. Fix path: accept optional `{ logger = console }` option, or emit via EventEmitter. Out of 4.0 loader scope — broader library-logging convention concern.
- **Nested `{project-root}` silently unresolved** — Blind Hunter + Edge Case Hunter MED. `_resolveProjectRootPlaceholder` is top-level-only by design (audit §5 YAGNI for 4.0). Nested objects/arrays containing `{project-root}` strings pass through unresolved with no warning. Fix path: either recurse or emit a `console.warn` when a nested string contains the placeholder. Deferred per audit §5 explicit scope decision; revisit if a config author hits this.
- **Windows path-separator mismatch** — Blind Hunter MED. `replaceAll('{project-root}', projectRoot)` on Windows with `projectRoot = 'C:\\Users\\x'` and YAML `output_folder: "{project-root}/foo"` yields `C:\\Users\\x/foo` (mixed separators). Most Node APIs tolerate, but downstream string comparison / glob logic may not. Fix path: normalize via `path.join` where strings look like paths, or document Unix-style separator contract. Cross-platform is not a 4.0 promise per PRD; revisit if Windows CI is added.
- **Test `console.warn` spy restore-on-failure edge case** — Blind Hunter LOW. If a v3-fallback test's `beforeEach` throws before `afterEach` runs, `console.warn` stays globally mocked, poisoning subsequent test files in the same process. Fix path: wrap setup in try/catch or use `t.mock` (test-scoped). Project convention is global `mock.method`; not worth breaking the pattern for a rare edge.
- **EISDIR / broken-symlink at configPath unhandled** — Blind Hunter LOW. `fs.existsSync` returns true for a directory at the path; `readFileSync` then fails with raw EISDIR. Broken symlink yields false from existsSync and masquerades as missing-config. Fix path: `fs.statSync + isFile()` check, or catch EISDIR and rethrow with actionable message. Low-impact edge; add if a real report surfaces.
- **YAML merge keys `<<:` preserved as literal `"<<"` key** — Edge Case Hunter. Callers expecting merge-key expansion are surprised. Fix path: pass `{ merge: true }` to `yaml.parseDocument + toJSON`, or document non-support. No current config uses merge keys; document if a user authors one.
- **Python2-as-python3 PATH resolution** — Edge Case Hunter. If `python3` on PATH is actually Python 2, the script fails with SyntaxError, surfaces via non-zero exit + stderr. Current error handling catches this path correctly; just no explicit version-check. Fix path: prepend `python3 --version` check, or document requirement. Acceptable for a legacy fallback — the migration path (`convoke-update`) should normalize Python before hitting this path.
- **Subprocess stdout with warning-prelude-then-JSON** — Edge Case Hunter. If bmad_init.py emits a deprecation warning line before JSON, `JSON.parse` fails → caught by "non-JSON stdout" branch with generic error. Fix path: extract last-line JSON before parse, or assert bmad_init.py emits pure JSON. bmad_init.py is internal and we control its output shape — low risk.
- **Repeated `[DEPRECATED]` warning on N loader calls** — Edge Case Hunter LOW. A session calling the loader multiple times (e.g., doctor health check scanning multiple modules) spams the deprecation warning N times. Fix path: module-scoped `Set` keyed by `legacyInitDir`, warn once per path per process. Stderr noise only; no correctness impact.

---

## Deferred from: code review of v63-1a-1-audit-bmad-init-behavior-before-replacement (2026-04-21)

Round 1 code review of Story 1A.1's audit deliverable produced 7 `defer` items — scope belongs to downstream stories or other initiatives.

- **JS implementation edge cases** — Edge Case Hunter. `moduleConfigPath` undefined/null/empty/absolute/`..`-containing, `projectRoot` undefined/null/trailing-slash/symlinked, BOM handling, EACCES, TOCTOU race between `existsSync` and `readFileSync`, YAML multi-document streams, anchors, merge keys. These are real production-code concerns for the loader but belong to Story 1A.2 acceptance criteria + tests — the audit's drafted JS is a hint block, not production code. Fix path: Story 1A.2 must include these as explicit test cases.
- **`yaml` vs `js-yaml` package choice** — Edge Case Hunter. Both are in `package.json` dependencies; the audit's drafted body uses `yaml` (eemeli) but some existing Convoke modules use `js-yaml`. Decision belongs to Story 1A.2 design. Fix path: Story 1A.2 design doc should pick one and enforce consistency across `scripts/update/lib/`.
- **Deprecation warning only fires on fallback path** — Blind Hunter. Operators with successful v3→v4 migration will never hit `_loadLegacyConfig`, so they never see the 4.0 deprecation notice and may not realize `bmad-init` is being removed in 4.1. Belongs to Story 1A.4 (deprecation design) — consider emitting a one-shot notice when `_bmad/core/bmad-init/` directory exists even if config loads successfully.
- **convoke-doctor pre-existing issues** — Blind Hunter (triage). Two findings surfaced by `convoke-doctor` during AC6 validation: (a) `_team-factory` missing `add-team` workflow, (b) cross-module version drift (`_artifacts/_enhance/_gyre/_team-factory` at 1.0.0 vs `_vortex` at 3.3.0 vs package 3.2.0). Pre-existing platform hygiene issues, unrelated to 1A.1. Fix path: open separate backlog items for each; neither blocks Story 1A.1 sign-off.
- **Architecture doc Decision 1 vs Pattern 3 inconsistency** — Acceptance Auditor. Architecture doc's Decision 1 sample uses `yaml.parse()`; Pattern 3 says `yaml.parseDocument()` for read-write. The audit resolved this correctly (followed Pattern 3), but the arch doc itself has an internal inconsistency. Not caused by 1A.1. Fix path: flag to Winston for a Round 2 arch doc edit; audit stays as-is.
- **`_resolveProjectRootPlaceholder` mutates input config in place** — Edge Case Hunter. The drafted JS mutates `config[key]` rather than returning a new object. Maintainability / test-mocking hazard. Belongs to Story 1A.2 implementation choice — audit's draft is a hint. Fix path: Story 1A.2 implementer decides mutate-vs-clone based on caller contract.
- **`safe_dump` comment-stripping claim unverified** — Edge Case Hunter. Audit §12 asserts `yaml.safe_dump` strips operator comments as justification for Story 1A.4 round-trip writer. Claim not backed by grep evidence of existing operator comments in installed configs. Belongs to Story 1A.4 migration writer design — the round-trip justification may or may not be warranted. Fix path: before Story 1A.4 implements round-trip, grep installed configs for operator-added comments; if none, simpler `safe_dump` approach is fine.

---

## Deferred from: code review of I71 migration ADR git-add scope narrowing (2026-04-21)

Round 1 review (0 HIGH, 0 patches needed — convergence at Round 1). 1 item deferred:

- **Stale doc reference in historical story artifact `ag-3-4-adr-supersession.md:41`** — the shipped story doc's task checklist still reads `Stage both files: git add _bmad-output/planning-artifacts/`, reflecting pre-I71 broad-stage pattern. Per Convoke doc-immutability convention, shipped story artifacts are frozen at ship-time and not retroactively amended. The reference is LOW severity (historical checklist item, not load-bearing guidance for current work). If a future sweep revisits historical story docs for accuracy, update this line; otherwise leave as-is. Tracked here for audit trail only.

---

## Deferred from: code review of I69+I70 portfolio-engine validation bundle (2026-04-21)

**2 rounds** — Round 1 ad-hoc (0 HIGH, 1 MEDIUM patched: prefix-asymmetry regression). Round 2 formal skill pass (0 HIGH, 1 MEDIUM patched: P1 `--filter` error message disambiguation). **Round 3 not eligible** per convergence rule — both patches content-only. 6 LOW items deferred as pre-existing, minor UX, or out of scope:

- **`--sort=value` equals-form not supported** — Edge Case Hunter MEDIUM→LOW (pre-existing, not a regression). `args.indexOf('--sort')` matches only the exact token; `--sort=last-activity` silently skips the sort block and falls to default alpha. Fix path: accept both `--sort value` and `--sort=value` forms.
- **Duplicate `--sort` / `--filter` flags silently use first occurrence** — Blind + Edge LOW. `indexOf` returns only the first match; `--sort alpha --sort last-activity` silently honors `alpha`. Pre-existing, not introduced by I69+I70. Fix path: detect duplicates and error.
- **Empty-string or whitespace-only filter accepted** — Edge Case Hunter LOW. `--filter ""` and `--filter "   "` pass the `startsWith('--')` check; `filterPattern.startsWith('')` matches everything (empty) or nothing meaningful (whitespace). Downstream silent no-op. Fix path: trim + length check after validation.
- **Flag-like single-dash values accepted as filter** — Edge Case Hunter LOW. `--filter -h` / `--filter -v` treated as legitimate filter values (preserved by design to allow `-legacy` etc.). Almost-certainly-operator-error cases silently yield zero matches. Fix path: additional heuristic — reject single-dash-single-char values, OR emit warning when filter yields zero matches.
- **`filter.replace(/\*$/, '')` strips only trailing star — mid-string globs silently fail** — Edge Case Hunter LOW. `--filter "gyre*extra"` keeps the `*` in the middle; `startsWith` looks for literal `*`, matches nothing. Pre-existing glob-expectation gap; not introduced by I69+I70. Fix path: full glob syntax OR explicit error on unsupported patterns.
- **Skill wrapper passes operator-typed prefix verbatim** — Edge Case Hunter LOW. `_bmad/bme/_artifacts/workflows/bmad-portfolio-status/steps/step-02-explore.md:77` passes `--filter "{prefix}"` without error-handling. If the operator types `--foo`, the wrapper produces `--filter "--foo"` which now (post-I70) errors with exit 2. Operator sees a raw CLI error. Fix path: skill wrapper catches exit-2 and recovers gracefully OR pre-validates the prefix before invoking CLI.
- **Magic number `process.exit(2)` lacks inline comment** — Blind Hunter LOW. Four exit(2) calls in arg parsing; convention not documented inline. Minor style. Fix path: add `// exit code 2: usage error (per convention)` comment or extract a named constant.
- **`process.exit(2)` inside `main()` prevents unit-level validation tests** — Blind Hunter LOW. Validation logic exercised only via subprocess spawn. Structural concern; refactor would extract arg parsing to a pure function with error-return semantics. Interacts with I20 Round 2 defer about fixture-isolated CLI integration tests.

---

## Deferred from: code review of A35+A36 bundle — Round 1, reverted (2026-04-21)

Round 1 review surfaced 5 HIGH + 6 MEDIUM findings revealing architectural premise issues with A36 ("`validate.md` is a standalone workflow, not a sibling companion" — Edge Case Hunter). Both edits reverted; combined rework tracked as **A44** (Layer 1 + operator-facing text correct semantics). Defers below capture findings adjacent to A44's primary scope:

- **`_deprecated/` subtree audit scope** — Edge Case Hunter MEDIUM. `_bmad/bme/_vortex/workflows/_deprecated/empathy-map/` still contains workflow.md + validate.md + template.md. A44's filesystem survey should decide whether deprecated-subtree files are in scope for current audits. Fix path: explicit carve-out in §2.4 for `_deprecated/**` subtrees, OR include them with a clear "deprecated workflows are audited-but-not-retrofitted" policy.
- **README-like / operator-read-but-not-workflow-loaded files** — Edge Case Hunter LOW. Workflow-root `README.md`-style files that operators might read in a repo browser but workflows don't `Read` at runtime. A44's categorization should address this boundary — are repo-browsing reads "normal execution path" or out-of-scope?
- **Multi-step `Read` attribution** — Edge Case Hunter MEDIUM. If `empathy-map.template.md` is `Read` by both step-04 and step-06, is it Layer 1 (once at workflow level) or Layer 2 (per-step)? A44 must resolve; interacts with §2.6 inheritance semantics.
- **A10 §Cell Selection semantic effect** — Edge Case Hunter LOW. A36's Layer 1 expansion (had it shipped) would create a new class of borderline cells — companion-file contributions to Layer 1. A44 resolution should note whether Cell Selection guidance needs amendment to include companion-file inclusion as a candidate borderline axis.

---

## Deferred from: code review of A40 Publication Gate amendment (2026-04-21)

Round 1 code review of A40 (5 spec edits to `convoke-epic-operator-covenant.md`) produced 4 `defer` items — pre-existing or out of A40 scope.

- **"Worst-scoring rights" remains undefined** — Blind Hunter. The retrofit clause says "rights scoring worst in the audit" but does not specify a threshold (top-1? bottom-quartile? below some score?). Pre-existing from 2026-04-18 amendment; re-entrenched but not introduced by A40. Fix path: add explicit threshold to Epic retrofit rule, or reference Selection Discipline criteria from the Compliance Checklist. Candidate for a follow-up Fast Lane item.
- **Rationale parentheticals embedded in normative text** — Blind Hunter. "(you don't publish a covenant you can't keep) AND evidentiary breadth... (you don't publish a claim you can't back with evidence)" — rhetorical justification mixed inside gate clauses. Pre-existing pattern from original 2026-04-18 amendment; retained for voice consistency. Style issue, not a correctness issue.
- **Secondary-channel (blog post) approval loophole unchanged** — Blind Hunter. Story 2.3 AC says "an accompanying blog post is optional and requires separate approval (secondary channel)" — the separate-approval authority is unspecified. Pre-existing, out of A40 scope (A40 is specifically about the Publication Gate conditions, not secondary-channel governance).
- **T1/T2 trigger interaction with ≥2 portfolio audits unspecified** — Edge Case Hunter. A new portfolio audit at N ≥ 3 could fire T1 on a new right in a team that was previously un-audited. Story 2.1 was closed under v1 trigger evaluation. The Epic is silent on whether T1 re-firing on new portfolio data re-opens Story 2.1's retrofit scope automatically (vs. the A40 patch that covers "newly-surfaced bottleneck rights"). Interesting follow-up: tighten the T1/T2 rule to explicitly cascade across portfolio audits added post-v1.

---

## Deferred from: code review of spec-a33-checklist-workflow-md-scope (2026-04-20)

Round 2 code review of A33 produced these `defer` items — real findings, but pre-existing, bounded out-of-scope by A33's §2.6-amendment focus, or already captured in downstream Epic 2 Story 2.1 retrofit scope.

- **Operator-visible boundary cases undefined at edges** — Blind Hunter + Edge Case Hunter. Frontmatter, HTML comments, fenced code blocks, `Note:` blocks, Steps Overview bullet lists — §171 "Operator-facing vs agent-facing text" names only `MANDATORY EXECUTION RULES` / `YOUR ROLE:` as agent-facing examples. The operator-vs-agent boundary is hand-waved at the edges. A33's Scope paragraph inherits this silence; it becomes more load-bearing post-A33 because inheritance now depends on operator-visibility determination. Pre-existing §171 scope issue, out of scope for A33 which only disambiguated workflow.md-vs-step-01 scope. Fix path: extend §171 with exhaustive enumeration or a semantic test ("agent-facing = imperative addressee is the LLM and not rendered/echoed to the operator").
- **Steps Overview bullet headers: navigational vs concept-introducing** — Edge Case Hunter. In empathy-map/workflow.md:17-22 the Steps Overview list enumerates quadrant names ("Says & Thinks / Does & Feels / Pain points / Gains"). Under A33's broader reading these pre-exist at step-01, but it's unresolved whether list items in navigational sections count as concept-introductions or scaffolding. Directly affects empathy-map PASS reproducibility. Related to A13 (OC-R7 concept-counting for compound concepts) already in backlog.
- **Alias and parenthetical-expansion counting** — Edge Case Hunter. Example: workflow.md says "JTBD"; step-01 says "job-to-be-done (JTBD)". A33 is silent on whether the parenthetical re-introduction counts as novel. Related to A13. Fix path: append to §2.6 novel-concept glossary — "aliases / parenthetical expansions / synonymic re-phrasings of pre-existing concepts do not re-introduce them."
- **Sibling files (`template.md`, `validate.md`) silently escape Layer 1/2 enumeration** — Edge Case Hunter. §2.4 Layer 1 names only `workflow.md`; Layer 2 is `steps/**.md`. Sibling operator-loadable files at the workflow root (e.g., `empathy-map.template.md`, `validate.md`) are neither. Their operator-visible concept-introductions (e.g., empathy-map's validate.md lines 57-66 naming "Says/Thinks/Does/Feels/Pains/Gains dimensions") evade OC-R7 entirely. Genuinely new edge surface. Fresh Fast Lane candidate: extend §2.4 Layer 1 to cover workflow-root companion files, OR explicit §2.4 exclusion rule for sibling files.
- **Step-01 `Read`s workflow.md at runtime and echoes concepts to operator** — Edge Case Hunter. Is the echo a re-introduction (exempt per A33 ¶4) or a fresh Layer 2 introduction that counts toward step-01's novel-concept budget? Ambiguous; affects Vortex workflows that deliberately re-state workflow.md context in step files.
- **Cross-module `Read` (bmad-init bridging, Compass routing)** — Edge Case Hunter. A skill that loads another skill's workflow.md mid-execution: are those cross-module concept-introductions inherited into the caller's step files? A33's "within the same workflow" scope (BS2 restoration) is now silent on cross-workflow reuse. Fix path: explicit rule — cross-workflow `Read`s treat the loaded content as Layer 2 of the calling step.
- **New FAIL surfaces at dense Layer 1 workflows** — Edge Case Hunter. A33's anti-escape-hatch clause (¶4) requires workflow.md's own operator-visible content to pass OC-R7 at Layer 1. Skills with dense prose preambles (assumption-mapping/workflow.md:14-19 has 5+ novel concepts: bet / hides assumptions / lethality / uncertainty / testing order) now implicitly FAIL Layer 1 under A33. Already captured in Epic 2 Story 2.1 retrofit scope (assumption-mapping + hypothesis-engineering step-01 retrofits) — this defer is a note, not a new action. Revisit when Story 2.1 kicks off.
- **§171 examples list not exhaustive** — Edge Case Hunter. Blocks like `<critical-rules>`, `SYSTEM:`, INITIALIZATION lists — status (operator-visible or agent-facing) undetermined. Bundleable with the "operator-visible boundary cases" item above; same fix path.
- **Cross-workflow concept-reuse rule gap** — Blind Hunter. A33 ¶1 restricts inheritance to "within the same workflow" (BS2 fix). Shared concepts (HC contracts, JTBD) that appear across Vortex agents have no rule for whether workflow B's step file inherits from workflow A's workflow.md. Produces a silence, not a resolution. Candidate for a sibling rule "cross-workflow concept reuse."

Common theme: 4 of 9 defers point to follow-up Fast Lane candidates — (a) operator-visible boundary formalization in §171, (b) sibling-file Layer classification in §2.4, (c) cross-module / cross-workflow reuse rule, (d) alias/expansion counting in §2.6. Consider bundling into a single follow-up initiative or routing through `bmad-enhance-initiatives-backlog` Triage mode.

---

## Deferred from: code review of spec-bug-2-adr-idempotent-noop-commit (2026-04-20)

- **Broad `git add _bmad-output/planning-artifacts/` stages unrelated modified files** — `scripts/migrate-artifacts.js:399` stages every modified/untracked file under the scope dir, not just the ADR paths written by this phase. If the operator has unstaged edits to sibling ADRs or notes when re-running the migration, they silently get absorbed into the `"chore: generate governance convention ADR"` commit. Pre-existing; explicitly scoped out of BUG-2 per spec I/O Matrix. **Round 2 note:** the BUG-2 idempotency check amplifies the consequence — pre-fix, a second run with unrelated staged changes would at least error loudly on "nothing to commit" (the ADR file was byte-identical and git found no diff *for the ADR*, but the unrelated staged change would have been committed too). Post-fix, the diff-check sees the unrelated staged change and proceeds to commit it under the ADR message without any warning. Fix path unchanged: stage only `adrPath` and (when `supersedePreviousADR` returns true) the supersede target path.
- **Concurrent `convoke-migrate` invocations create TOCTOU window** — `scripts/migrate-artifacts.js:399-418`. Between `git add`, `git diff --cached`, and `git commit` a second process could empty the index. With the BUG-2 fix, the diff-check says "has staged changes" but the subsequent commit then errors with "nothing to commit", landing in the outer catch as a misleading ADR warning. Real user exposure is low (migrations aren't intended to be run concurrently) and the T4 test isolates each invocation. Fix path: `_bmad-output/planning-artifacts/.migration.lock` flock around all three commit phases, or `git commit -o <pathspec>` to restrict the commit to ADR paths.
- **T4 positive stdout assertion is fragile across UTC midnight rollover** — `tests/integration/migrate-artifacts-idempotency.test.js:205-209` (added Round 1 patch). If tests 1 and 3 straddle UTC midnight, the ADR `**Date:**` field differs between runs, `hasStagedChanges=true`, stdout shows `"ADR generated"` not `"ADR already current"`, `assert.match(/ADR already current/)` fails. Very-low-probability flake — full T4 run is ~1.1s so the window is ~1/86400 per CI run. Fix path: either freeze the clock in the fixture (env `TZ=UTC` + mock `Date`) or relax the match to a disjunction that still distinguishes regression paths.

---

## Deferred from: code review of oc-vortex-audit-expansion-a24 (2026-04-19)

Round 1 code review of A24 produced these `defer` items (real findings, out of scope for the current round or already acknowledged in-report):

- **Step-01 sampling bias — later steps unaudited** — Edge Case Hunter. All 3 audited workflows have more than step-01 (assumption-mapping: 4 steps, empathy-map: 6 steps, hypothesis-engineering: 5 steps). Step-01 is plausibly the highest-concept-density step (IN-12 origin), but later steps could harbor different rights violations unquantified by A24. The report's §7 Reproducibility section acknowledges the single-reviewer limit but does not acknowledge the step-01-scope limit. Future audit scope (candidate A26: Vortex HC-schema pattern audit) should cover ≥ 2 steps per workflow or explicitly scope to step-01 with documented rationale. Revisit when Epic 2 Story 2.1 retrofit scope is committed.
- **Third-workflow "twins" pick — structural diversity in future audits** — Blind Hunter. A24's third pick (hypothesis-engineering) was chosen for structural parity with assumption-mapping (both lack template/validate scaffolding, both invoke HC-schema-at-step-01). This guarantees the "shared architectural pattern" finding. Future Vortex audits should include at least one structurally-different skill per audit to avoid pattern-confirmation bias. Non-blocking for A24 findings but shapes future-audit protocol.
- **IN-12 intake-to-shipped in one day** — Blind Hunter. Governance smell: IN-12 was triaged 2026-04-18, renamed + spec-authored + executed + shipped 2026-04-19. For Fast Lane items the cycle time is intended; for audits with provisional findings bound to Epic 2 scope, a cool-down pause might reduce in-loop bias. Candidate for retrospective discussion; no deliverable change required.
- **T1 boundary case — exactly 70% compliance** — Edge Case Hunter. Epic's T1 threshold "< 70%" is strict-less-than. Boundary case: a cell at exactly 70% does not fire. Clarify in Epic text or via example. Out of scope for A24; belongs in Covenant Epic Story 2.1 spec revision.

---

## Deferred from: scope of T4 (migration idempotency CLI test) — 2026-04-19

T4's CLI-level idempotency test + its Round 1 code review revealed several latent issues while verifying functional idempotency holds:

- **ADR generation silently fails on re-run with byte-identical content** — MEDIUM. `scripts/migrate-artifacts.js:402-404` downgrades ADR generation failures to `console.warn` and keeps exit code 0. When the third (or any subsequent) migration run produces an ADR whose content is byte-identical to the previous run's ADR (same date, same `renameCount`, same `scopeDirs`), `git commit` errors with "nothing to commit, working tree clean", the phase is reported as failed via warning, and the caller sees a successful exit. T4's stderr-warning guard fires; the test allow-lists this class via `ALLOWED_WARNING_PATTERNS` (`tests/integration/migrate-artifacts-idempotency.test.js`). Fix options: (a) use `git commit --allow-empty` so re-runs always produce an ADR commit, (b) detect no-op before calling git and skip cleanly without warning, or (c) include a monotonic run counter in the ADR content so it's never byte-identical across runs. Surfaced by Edge Case Hunter Round 1 review of T4.
- **`runScript` returns `exitCode: null` on `execFile` timeout** — MEDIUM (pre-existing helper bug, affects many tests). `tests/helpers.js:143-152` maps `err.code` to `exitCode`, but `execFile`'s timeout sets `err.signal='SIGTERM'` and leaves `err.code === null`. Tests asserting `exitCode === 0` fail with `null !== 0` and zero diagnostic about the timeout. Fix: surface `err.signal`/`err.killed` as a distinct `timedOut` field in the helper's return value.
- **`detectMigrationState` scans only last 5 commits — boundary risk** — LOW. `scripts/lib/artifact-utils.js:~2118` reads `git log -5 --format=%s`. T4's test 4 approaches the boundary (4 commits from first run + seed commit = 5). Any additional intervening commit in the fixture would push the governance marker off the window and silently flip state detection from `'complete'` to `'fresh'`. Fix: increase the window OR document the 5-commit ceiling as a fixture-design constraint.
- **Missing baseline idempotency case — zero ungoverned files from the start** — LOW. T4 covers (1) migrate, (2) no-op re-run, (3) new-file resumption. The fourth scenario — a fixture with NO ungoverned files in `_bmad-output/` from the beginning — is untested. Adding this closes the "CLI handles an already-clean project on first run" path.
- **Test 4 over-specifies git state** — LOW. Test 4 commits the new ungoverned file before running the migration. If the migration scanner ever regresses to only see staged/committed files (not unstaged), this test wouldn't catch it. Consider an additional variant that leaves the new file uncommitted.
- **Windows portability of execSync arg strings** — LOW. T4's initial implementation used string commands; Round 1 patch converted to `execFileSync` with argv array, closing this. No follow-up needed, but noting that any future sibling tests should follow the argv pattern.

- **Migration-generated meta-artifacts flagged as ungoverned on re-run** — MEDIUM. When `convoke-migrate --apply --force` runs against a fresh project, it writes `_bmad-output/planning-artifacts/adr-artifact-governance-convention-<date>.md` and `_bmad-output/planning-artifacts/artifact-rename-map.md`. On the next run, the inference engine flags these as "ambiguous — cannot infer type or initiative" because their filenames don't match the `{initiative}-{artifact_type}` convention the migration itself is enforcing. Functional idempotency still holds (no new commits, no state change — T4 asserts this directly), but the CLI emits `"Previous migration detected, but new ungoverned files found. Proceeding with fresh migration."` followed by `"Nothing to rename"` instead of the cleaner `"Nothing to migrate — all files governed."`. Fix options: (a) inject governance frontmatter into the ADR and rename-map on creation so they're recognized as governed, or (b) add these specific filenames to an inference-time exclusion list. Deferred because the user-facing confusion is mild and the functional idempotency holds; however this should be fixed before any retro cites "Nothing to migrate" as the canonical no-op signal. Relevant: `scripts/migrate-artifacts.js:278-287` (`detectMigrationState` + manifest-has-work check); `scripts/lib/artifact-utils.js:926` (`buildManifestEntry`).

---

## Deferred from: scope of T3 (end-to-end update test on real project) — 2026-04-19

T3 shipped as a CLI-level non-dry-run upgrade test with full post-state verification (previously missing). The following were explicitly scoped out as they'd be disproportionate to T3's score (2.7) or would reintroduce flakiness:

- **Real `npm pack` fetch of published versions** — MEDIUM. T3 uses a simulated older-version fixture (mirroring `tests/integration/upgrade.test.js` pattern). A true end-to-end test would `npm pack` the old version from the registry, extract it, install into a tmp project, then run `convoke-update`. Rejected because: (a) registry lookup is network-dependent and flakier than library tests, (b) the signal added beyond the simulated fixture is narrow (shape-of-old-install is what matters, not provenance), (c) cost compounds if we span multiple old versions. Revisit if CI ever hits a regression the simulated-fixture pattern missed.
- **Migration of user-authored custom agents** — LOW. `mergeConfig` already preserves user-added agents (not in `AGENT_IDS`) via the `userAgents` spread at `scripts/update/lib/config-merger.js:113-117`. Unit tests cover this. An end-to-end CLI test for user-authored custom agents would extend T3's scope into a separate concern. Split if custom-agent upgrade behavior ever regresses.
- **Interactive prompt mode testing** — LOW. T3 uses `--yes` to bypass the confirm prompt. Covering the interactive path would require TTY simulation (pty, expect-style harness) — high cost for low signal since the non-interactive path exercises the same code modulo the single `readline` call. Split if interactive-mode bugs surface.

---

## Deferred from: code review of A15 + A5 + A10 Round 2 (2026-04-18)

- **Revisions table row is a multi-hundred-word paragraph per patch cycle** — LOW. Each shipping round appends a long cell to §Revisions. Cell readability is degrading. Consider splitting into one row per shipped patch or extracting Round-level detail to a dedicated `revisions/` folder with a pointer from the table.
- **Parser grammar § doesn't recognize the `Layers:` evidence-note prefix** — MEDIUM. P1 added a mandatory `Layers:` bulleted line in evidence notes for OC-R6 when `external-declared` is used, but the Parser grammar §currently validates only the Compliance Status column. Until Story 2.2 builds the Loom parser, the "first-class data" discipline is aspirational — enforcement depends on reviewer vigilance.
- **`(external)/(internal)` OC-R0 tokens share substring with `external-declared` OC-R6 value** — LOW. Grep-based tooling scanning evidence notes for `external` will match both the OC-R0 qualifier and the OC-R6 value. Namespace collision is cosmetic but worth noting for anyone writing grep-backed reporting in the future.
- **Misprediction + DISPUTED interaction edge case** — LOW. If the auditor predicted PASS, both reviewers agreed FAIL (mispredicted but reproducible), and the cell is then DISPUTED-excluded via path (b) for unrelated reasons (e.g., the verdict itself was mutually-reviewer-contested in a re-run), the interaction between calibration-signal logging and DISPUTED exclusion isn't specified. Defer until observed in a real v2+ audit.

---

## Deferred from: code review of A15 + A5 + A10 (2026-04-18)

- **A10 3-cell minimum doesn't scale** — HIGH. A 2-skill audit has 14 cells (3 cells = 21% sample); an 8-skill audit has 56 cells (3 cells = 5%). Fixed floor regardless of audit size. Scaling via a percentage floor or explicit "minimum OR 10% of matrix" would be more defensible. Design-level rework — deferred.
- **A15 OC-R0 enumeration doesn't distinguish internal vs external Layer 3 authorship** — MEDIUM. After A15's patch, the Checklist now requires an `(external)`/`(internal)` qualifier on each L3 enumeration entry to validate `external-declared` precondition 2b. The OC-R0 row wording in the main checklist table was not updated to match — the qualifier is documented only in the A15 value row. Broader methodology edit (OC-R0 row + evidence-note template examples) should follow.
- **A5 "research/catalog/audit/inventory" has no operational test** — MEDIUM. Is a retrospective (inventories lessons) covered? A portfolio status report (scans artifacts)? A PRD section listing personas? Rule reads as broad enough to rope in most status reporting. Fix requires either an operational test definition or an example list — scope decision pending.
- **A5 retroactive gap on v1 audit sample selection** — MEDIUM. §6 of the v1 audit admits "One of each was sampled" for 20+7 workflows without a grep/glob enumeration paste. Rule is prospective, retro-application reopens closed work. Noting in case a v2 audit wants to close the gap prospectively.
- **A15+A10 interaction: N/A-variant disagreement slips through verdict-agreement threshold** — MEDIUM. If two blind reviewers disagree on whether an OC-R6 cell is `N/A — external-declared (git)` vs `FAIL` vs `N/A — out-of-scope`, that's not a PASS/FAIL disagreement per A10's threshold semantics. Reviewers could agree on "it's not PASS" while differing on the reason. Threshold reworking needed; deferred pending v2+ audit evidence.
- **A5 story templates not updated to require search-command field** — LOW. Rule asks specs to include the exact grep/glob command as a required input. `bmad-create-story` and sprint-planning templates weren't edited. Authors will forget. Small follow-up task.

---

## Deferred from: code review of U8 — excluded_agents (2026-04-18)

- **Cross-module exclusion-ID validation** — `excluded_agents: [stack-detective]` in `_bmad/bme/_vortex/config.yaml` silently no-ops (Vortex never iterates that ID), and typos like `noha` (meant `noah`) silently no-op too. Neither `mergeConfig`, `refresh-installation`, nor `convoke-doctor` warns. Validation would require knowing each module's legal agent ID set.
- **`excluded_agents: []` default appears without explanatory comment on upgrade** — fresh installs get the shipped source YAML with the inline comment block. Operators upgrading from pre-U8 see `excluded_agents: []` appear in their config (via `merged.excluded_agents = excludedAgents` in `scripts/update/lib/config-merger.js`) but with no context. Fix requires comment-injection logic in `writeConfig` — broader scope.
- **YAML parser asymmetry between `readExcludedAgents` and `mergeConfig`** — the reader uses js-yaml (`yaml.load`), `mergeConfig` uses the `yaml` package (`YAML.parseDocument`). A file that parses differently under the two libraries (rare anchor/merge-key edge cases) could cause `refresh-installation` to copy an excluded agent's files while `mergeConfig` removes the ID from `merged.agents`. Pre-existing architectural split from ag-7-1.
- **Duplicate entries in `excluded_agents` not deduped** — `excluded_agents: ['noah', 'noah']` persists both entries through the merge. Inconsistent with the `Set`-based dedup on `agents`. Purely cosmetic.
- **EXTRA_BME_AGENTS (team-factory, etc.) have no exclusion mechanism** — `_team-factory/config.yaml` has no `excluded_agents` field and `refresh-installation` only reads Vortex + Gyre configs for the exclusion snapshot. Operators can't opt out of standalone bme agents. Feature-scope choice — revisit if a standalone agent ever needs opt-out.
- **Dev-mode (isSameRoot) skill wrapper generation doesn't honor exclusion** — when `packageRoot === projectRoot`, the agent-file copy loop is skipped but the skill-wrapper generation loops (§6 and §6b) still fire. Minor inconsistency that only affects dev testing of exclusions via same-root install.

---

## Deferred from: code review of BUG-1 + U7 (2026-04-18)

- **`DEFAULT_ARTIFACT_TYPES` drift from taxonomy** — `scripts/migrate-artifacts.js:135` lists 22 types (no `note`); `_bmad/_config/taxonomy.yaml` has 23. A fresh project that hits `bootstrapTaxonomy` before the first migration renders an ADR with the bootstrap list, not the committed taxonomy. Already tracked as **I54** in `convoke-note-initiative-lifecycle-backlog.md` — not re-logging.
- **`taxonomy.initiatives.user` silently dropped from generated ADR** — `scripts/lib/artifact-utils.js:2031` renders only `taxonomy.initiatives.platform`. If user-scope initiatives grow meaningful, they're invisible in the governance artifact. Design decision — defer until user-scope initiative UX is explicitly on the table.
- **Empty `taxonomy.initiatives.platform` / `artifact_types` arrays render degenerate ADR text** — `readTaxonomy` (`scripts/lib/artifact-utils.js:148-160`) validates the fields are arrays but not that they're non-empty. An operator editing `_bmad/_config/taxonomy.yaml` to comment out entries produces `**Platform initiatives (0):** ` with nothing after the colon. Upstream validation is the right place for the fix.
- **`compareVersions` silently coerces pre-release versions to their base** — `scripts/update/lib/utils.js:27-39` does `Number('4-alpha') → NaN → 0`, so `compareVersions('1.0.4-alpha', '1.0.4')` returns 0. Pre-existing limitation of the shared utility; affects U7's version-range filter but also any other consumer. Broader-scope fix.
- **`__dirname`-based CHANGELOG path resolution is fragile under bundlers/PnP** — `scripts/update/lib/changelog-reader.js:7` resolves three levels up from the lib file. Works for npm/npx today (verified via `package.json` files list) but breaks under Yarn Plug'n'Play zipped installs or any future bundler flattening. Speculative; defer until a real install mode complains.
- **No verbose-gating or max-entry cap on printed changelog** — a user on `v1.0.0` upgrading to `v3.2.0` will see every intervening release body streamed to stdout before the confirm prompt, pushing the Plan/Breaking-Changes block off-screen. Defer until someone actually hits this; the cross-major-version span is rare by design.

---

## Deferred from: code review of oc-1-5-adoption-surface (2026-04-18)

- **bme/README submodule table omits `_bmad/bme/config.yaml`** — MEDIUM. A sibling `config.yaml` file lives next to the 7 submodule directories but isn't listed in the new bme/README's Submodules table or anywhere else in the file. Strictly the table scope covers directories, so it's defensibly correct-as-scoped, but a contributor reading the README for bme-namespace orientation won't learn that `config.yaml` exists. Out of scope for Story 1.5 (Covenant surfacing). Follow-up: either add a "Files" note mentioning `config.yaml`, or widen the table scope to include it.
- **`docs/` directory has 6 contributor-facing files with no Covenant pointer** — MEDIUM. `docs/` holds `agents.md`, `development.md`, `faq.md`, `references.md`, `testing.md`, `BMAD-METHOD-COMPATIBILITY.md` — but no `docs/README.md` or `docs/index.md`. Story 1.5's AC #3 "3-of-4 coverage" substitution (docs index doesn't exist) is legitimate, but a contributor landing on `docs/` via a GitHub tree view sees six docs with no Covenant orientation. Follow-up: create `docs/README.md` as the docs index, with a Covenant pointer as one of its first sections — makes the 4th discovery path real rather than absent.
- **Canonical Covenant location under `_bmad-output/planning-artifacts/` — architectural path smell** — LOW. `_bmad-output/` is conventionally the output/artifact tree (often treated as ephemeral / git-ignored in other projects). Hosting durable required-reading documents like the Covenant and Compliance Checklist there confuses "output of a workflow" with "canonical spec". Story 1.5 inherits the location decided in oc-1-4; moving it would ripple across many references. Follow-up: evaluate whether the Covenant and Checklist should live at a canonical docs path (e.g., `docs/covenant/`) with `_bmad-output/planning-artifacts/` retaining a pointer.

---

## Deferred from: code review of oc-1-2-taxonomy-extension (2026-04-18)

- **Duplicate `DEFAULT_ARTIFACT_TYPES` across two files** — `scripts/migrate-artifacts.js:135` and `scripts/update/lib/taxonomy-merger.js:11` maintain identical hardcoded arrays that must stay in lockstep with each other and with `_bmad/_config/taxonomy.yaml`. Adding a new artifact_type requires editing three locations symmetrically — a drift bug waiting to happen. Refactor to a single source (either a shared constant module or reading from the shipped yaml at startup). Pre-existing architectural debt; surfaced by Blind Hunter during Round 1 review.
- **`generateGovernanceADR` hardcodes "Artifact types (21)"** — `scripts/lib/artifact-utils.js:2033` contains a template literal claiming 21 types and listing only 21 names. After recent additions (`note`, now `covenant`), the committed `_bmad/_config/taxonomy.yaml` has 23 types. Every governance ADR produced by a migration `--apply` now misreports the type count and omits both new types. Fix: derive the list and count from the taxonomy passed into `generateGovernanceADR` instead of hardcoding. Pre-existing drift; surfaced by Edge Case Hunter during Round 1 review.

---

## 🚨 URGENT — phantom test recurrence detected (2026-04-09)

**This is the C1 pattern from the original [astonishment report](../test-artifacts/2026-04-08-astonishment-report.md)
recurring DURING the recovery initiative that exists to prevent it.** Surfacing
loudly so the next person reading this file cannot miss it.

### Symptom

Two test files in `tests/lib/` are exit-code-1 broken under standalone
`node --test` invocation:

| File | Standalone result | Wired into `npm test`? |
|---|---|---|
| [tests/lib/portability-classification.test.js](../../tests/lib/portability-classification.test.js) | `tests 1, pass 0, fail 1` (file-load failure) | **NO** |
| [tests/lib/portability-schema.test.js](../../tests/lib/portability-schema.test.js) | `tests 1, pass 0, fail 1` (file-load failure) | **NO** |

Both report exactly 1 "test" — that's `node --test` counting the file itself
as a single failed test because it errored during `require()` before any
`it()` callback ran. **Identical failure mode to the 8 original Jest phantom
tests in `tests/lib/*` discovered on 2026-04-08.**

### Diagnosis (best guess, not verified)

Both files import `../../scripts/portability/manifest-csv` (lines 3 of
each). The `scripts/portability/` directory exists in the working tree but
is **untracked** (not yet committed) and may not export the symbols the
tests require:
- `portability-classification.test.js` imports `{ readManifest }`
- `portability-schema.test.js` imports `{ parseCsvRow, countCsvColumns }`

If `manifest-csv.js` doesn't exist or doesn't export these names, the
test files crash on require. The tests use plain `node:test` style (not
Jest), so the failure mode is "production code missing", not "test
framework missing" — a different flavour of the same bug class.

### Why this matters

The recovery initiative (Stories I, L, F.1, F.3, A, B.1-B.4 + polish)
exists *specifically* to prevent the C1 phantom-test bug class. Allowing
phantom tests to be reintroduced in `tests/lib/` while the recovery is
in flight is **the same failure mode the recovery exists to prevent**.

The original failure was: tests existed, looked correct, were never
executed. **The new failure is: tests exist, look correct, are not wired
into `npm test`, and crash on standalone invocation anyway.** Worse than
the original — these are double-broken.

### What I (Murat) deliberately did NOT do

- **Did NOT wire the files into `npm test`**. Doing so would break the
  CI gate (exit 1 from file-load failures) and block every subsequent PR
  including B.5+.
- **Did NOT fix the failure mode**. The `scripts/portability/` work is
  in-progress in a parallel session that I do not own. Fixing the imports
  here could conflict with the parallel session's next save.
- **Did NOT delete the files**. They are someone's intentional in-progress
  work; deleting them silently would be hostile.

### What needs to happen (action items for the portability work owner)

1. **Verify `scripts/portability/manifest-csv.js` exists** and exports
   `readManifest`, `parseCsvRow`, and `countCsvColumns`. If not, either
   write the module or remove the imports until it exists.
2. **Run `node --test tests/lib/portability-classification.test.js`** and
   `node --test tests/lib/portability-schema.test.js` standalone before
   each save. Both should report `pass > 0, fail 0` before being wired
   into the gate.
3. **Wire both files into `npm test`** (literal paths, same pattern as
   `tests/lib/migrate-artifacts.test.js`, `taxonomy.test.js`,
   `inference.test.js`, `portfolio-rules.test.js`) **only after they pass
   standalone**.
4. **Folding into the `tests/lib/*` glob** happens at Story F.2 (after
   Story B.8), not piecewise.

### Why this lives in `deferred-work.md` and not in a story file

The portability work owner is a parallel session, not the recovery
initiative. The recovery initiative's job is to *surface* the recurrence,
not to *fix* it (which would step on parallel work). Documenting it here
makes the issue findable by anyone running a future `bmad-code-review` or
astonishment-report sweep on this repo.

---

## ⚠️ UPDATE 2026-04-09 — orphan count grew, diagnosis sharpened, F.2 blocked

After completing Story B (all 8 `tests/lib/*.test.js` Jest→node:test
conversions), F.2 (replace literal paths with `tests/lib/*.test.js` glob
in `npm test`) was the next step. F.2 is **blocked** by the orphan
portability tests below.

### Updated state of `tests/lib/` orphans

| File | Standalone result | LOC | Tests | Wired into `npm test`? |
|---|---|---:|---:|---|
| `tests/lib/portability-classification.test.js` | `tests 1, pass 0, fail 1` (file-load failure) | 171 | 7 | NO |
| `tests/lib/portability-schema.test.js` | `tests 1, pass 0, fail 1` (file-load failure) | 118 | 5 | NO |
| `tests/lib/portability-validation.test.js` (NEW since 2026-04-08) | `tests 1, pass 0, fail 1` (file-load failure) | 205 | 9 | NO |
| **Total** | **3 phantoms** | **494** | **21** | **all NO** |

### Sharpened diagnosis (supersedes 2026-04-08 guess)

Yesterday's entry guessed the failure was "missing exports from
`scripts/portability/manifest-csv`." That was wrong. The actual diagnosis,
captured today by running standalone:

```
ReferenceError: describe is not defined
    at Object.<anonymous> (tests/lib/portability-classification.test.js:38:1)
```

**The portability test files use Jest API directly without converting:**
they call `describe()`, `test()`, `expect()`, `beforeAll()` at top level
without importing from `node:test`. Confirmed by grep:

```
$ grep -c "expect(" tests/lib/portability-*.test.js
tests/lib/portability-classification.test.js:20
tests/lib/portability-schema.test.js:?
tests/lib/portability-validation.test.js:?
```

`scripts/portability/manifest-csv.js` exists and exports the symbols the
tests import — that part is fine. The crash is the missing `describe`
import, identical in shape to the 8 original C1 phantom tests in
`tests/lib/` that the recovery initiative just spent a day fixing.

**This is the C1 pattern recurring exactly, in the same directory the
recovery initiative just cleared.** The parallel session producing the
portability work is using the same Jest-by-default behavior the original
astonishment report flagged as the root cause.

### Why F.2 is blocked

F.2 was specified as: replace the literal-path enumeration in `npm test`
and `test:coverage` with `tests/lib/*.test.js` glob. Now that all 8 Story
B files pass, the glob would normally be safe. **But the glob also
matches the 3 broken portability files**, which would crash the gate
immediately on next CI run.

Workarounds I considered and rejected:
1. **Convert the 3 orphans myself** — same mechanical translation as
   B.1-B.8, ~20-30 min total. **Rejected** because the parallel session
   owner explicitly confirmed (2026-04-09) they are actively working on
   these files. Editing them concurrently risks merge conflicts and
   silently overwriting work-in-progress.
2. **Delete the orphans and proceed with F.2** — clears the blocker but
   destroys parallel-session work. Hostile.
3. **Custom Node-side glob script that excludes them** — more complex
   than the literal paths I'm trying to retire. Defeats F.2's purpose.

**Chosen path:** keep the literal-path scaffolding in place; defer F.2
until the parallel session converts the 3 portability files. When that
lands, F.2 becomes a 2-line edit (test glob + test:coverage glob).

### What the portability work owner needs to do

Per the **completed** Story B sequence, the conversion pattern is now
well-established. For each portability file:

1. Add at the top of the file:
   ```js
   'use strict';
   const { describe, it, before, beforeEach, afterEach } = require('node:test');
   const assert = require('node:assert/strict');
   ```
2. Rename `test(` → `it(` (keep names verbatim).
3. Rename `beforeAll` → `before` (and `afterAll` → `after` if used).
4. Translate `expect()` assertions per the cumulative table in Stories
   B.1-B.8 commit messages. Most patterns are 1:1 mechanical:
   - `expect(x).toBe(y)` → `assert.equal(x, y)` (strict under
     `node:assert/strict`)
   - `expect(x).toEqual(y)` → `assert.deepEqual(x, y)`
   - `expect(arr).toContain(item)` → `assert.ok(arr.includes(item))`
   - `expect(x).toBeNull()` → `assert.equal(x, null)`
   - `expect(x).toBeTruthy()` → `assert.ok(x)`
   - `expect(arr).toHaveLength(n)` → `assert.equal(arr.length, n)`
   - See B.5 commit message for the `toContainEqual(stringMatching())`
     pattern if any portability test uses it.
5. Run `node --test tests/lib/portability-<name>.test.js` standalone
   and confirm `pass > 0, fail 0` before considering it done.
6. Add the file to the `npm test` glob in `package.json` as a literal
   path (or wait for F.2 to fold all `tests/lib/*` into a glob — this
   becomes safe the moment all 3 portability files pass standalone).

### When F.2 unblocks

F.2 unblocks when **all 3 portability tests pass standalone under
`node --test`**. At that point:

1. Replace the literal `tests/lib/<8 files>` enumeration in `npm test`
   with `tests/lib/*.test.js`.
2. Same replacement in `test:coverage`.
3. Delete the 8 individual lib path entries.
4. Run `npm test` and confirm the gate count includes all 11
   `tests/lib/*` files (8 original + 3 portability).
5. Commit as Story F.2 with a one-paragraph note that the literal-path
   scaffolding from B.1-B.8 is now retired.

## Deferred from: code review of Story B.4 portfolio-rules conversion (2026-04-08)

- **Glob expansion in npm test scripts assumes POSIX shell** — `package.json` `test` and `test:coverage` scripts use shell glob expansion (`tests/unit/*.test.js`). On Windows `cmd.exe` this won't expand and `node --test` will receive literal patterns. Pre-existing pattern across all 5 npm test scripts; B.4 added a literal path, no new glob. **Real issue.** Belongs in a cross-platform compatibility story.
- **Lifecycle defensive call: `cpMock?.restore()` instead of `cpMock.restore()`** — In `tests/lib/portfolio-rules.test.js` `afterEach`, if `beforeEach` throws (e.g. helper resolution fails), the `afterEach` will secondary-throw on `undefined` and mask the root cause. Pre-existing pattern across every other converted test file in `tests/lib/*` and `tests/unit/*`. **Marginal improvement** — would be applied uniformly across the suite, not piecewise. Worth folding into a Story B cleanup pass after B.8 lands.
- **Time-dependent test in `git-recency-rule`** — `'recent activity -> status: ongoing'` and `'multiple artifacts -> picks latest date'` use `new Date().toISOString().split('T')[0]` as the mock return value. At UTC midnight boundary the `daysSince` math could flake by ±1 day. Pre-existing pattern from the original Jest file. **Real flake risk** but inherited by B.4, not introduced. Hardening fix: use a fixed date that's `staleDays - 1` ago instead of `today`. Worth a future story.

## Deferred from: code review of I20 — portfolio markdown formatter unattributed rendering (2026-04-20)

- **`--markdown` path emits terminal-style summary / WIP radar / verbose trace as plain-text interleaved with markdown output** — Edge Case Hunter. `portfolio-engine.js` writes `Total: X artifacts | Governed: ...`, `WIP: N active ...`, and `--- Inference Trace ---` via `console.log` regardless of `useMarkdown`. Pre-I20 behavior, exposed more clearly now that the markdown path has a structured `## Unattributed Files` section above the unstructured tail. Structural fix would move summary/WIP/verbose rendering into `formatMarkdown()` (or make summary a markdown section). Pre-existing, out of scope for I20. Belongs in a portfolio-markdown-output-completeness follow-up.
- **Unattributed section ordering differs between paths** — Edge Case Hunter. Terminal path prints summary lines *then* `--- Unattributed Files (N) ---`. Markdown path now emits `## Unattributed Files (N)` inside the `formatMarkdown()` output (before summary console.log lines). Cosmetic, not a correctness issue — both paths include the section — but a future consumer who diffs the two outputs will notice. Same structural fix as above resolves it.
- **No CLI-integration test for `--markdown --show-unattributed`** — Edge Case Hunter + Blind Hunter. The new markdown section has unit-test coverage on `formatMarkdown()` but no end-to-end CLI integration test exercising the orchestrator glue (`options` threading through `main()`). The spec explicitly prohibited adding new CLI-integration tests under the `test-fixture-isolation` rule (`tests/lib/portfolio-engine.test.js` current CLI block uses the live repo via `runCli(..., { cwd: projectRoot })` which is already a pre-existing rule-tension pattern). If CLI-integration coverage is wanted, it belongs in a fixture-isolated follow-up that simultaneously addresses the live-repo dependency in Story 6.3's Tests O, P, Q.

## Deferred from: code review of I20 — Round 2 (2026-04-20)

- **`--sort <invalid>` silently falls to alpha** — Edge Case Hunter. `portfolio-engine.js:468-470` uses `args[args.indexOf('--sort') + 1] === 'last-activity' ? 'last-activity' : 'alpha'`. A user passing `--sort recent` gets alpha order silently with no validation warning. Pre-existing Story 6.3 pattern, unchanged by I20. Fix path: validate sort value against a known set, `process.exit(2)` on invalid.
- **`--filter` without value silently ignores the flag** — Edge Case Hunter. `portfolio-engine.js:471-474` uses `args[filterIdx + 1] && !args[filterIdx + 1].startsWith('--')` as the guard. If `--filter` is the last arg or followed by another flag, the filter is silently dropped. Pre-existing Story 6.3 pattern, unchanged by I20. Fix path: explicit error when `--filter` is present without a value.

## Deferred from: code review of lint-1-1-fix-ci-lint-and-add-dod-gate (2026-04-22)

- **Touched-files scope has no tooling automation** — Blind Hunter. `project-context.md` §`lint-passes-before-review` commands unfiltered `npm run lint` while defining the gate by diff scope. Reviewers must manually cross-reference ESLint output lines against `git diff --name-only`. Pre-existing gap exposed by this story, not caused by it. Fix path: a helper script (e.g., `scripts/lint-touched.js`) that runs lint scoped to `git diff --name-only main...HEAD`, promotable to a test-runner target and a checklist reference.
- **`.claude/skills/bmad-dev-story/checklist.md` not refreshed by `convoke-update`** — Edge Case Hunter. `scripts/update/lib/refresh-installation.js:587-700` only refreshes `bmad-agent-bme-*`, Gyre agents, EXTRA_BME_AGENTS, and standalone bme-workflow wrappers — `bmad-dev-story` (a `_bmad/bmm/` framework skill) is never touched. So future amendments to the canonical DoD checklist won't propagate to already-installed Convoke projects. Change Log already flags this as a follow-up backlog candidate. Fix path: extend refresh-installation to copy selected `_bmad/bmm/4-implementation/*/checklist.md` to `.claude/skills/*/checklist.md` with path-rewriting (see next item).
- **Canonical→runtime copy would break relative `project-context.md` link** — Edge Case Hunter. Canonical `_bmad/bmm/4-implementation/bmad-dev-story/checklist.md:50` uses `../../../../project-context.md` (4 levels up); runtime `.claude/skills/bmad-dev-story/checklist.md:48` uses `../../../project-context.md` (3 levels up). A naive `fs.copyFileSync` during refresh would break the link in the runtime copy. The follow-up for the refresh-installation fix needs a path-rewrite step (regex or string-replace) to compensate for the depth delta.
- **`_warnings` rename in `loadSkillSource` masks pre-existing unused-threaded-param bug** — Edge Case Hunter. `scripts/portability/export-engine.js:105` declares `loadSkillSource(skillRow, projectRoot, _warnings)`. Caller at line 1015 passes a real `warnings` array expecting it to be populated with non-fatal issues (missing workflow.md, empty stepContents) — but the function never pushes to it. The `_`-rename satisfies ESLint and makes the dead-code status permanent, losing the "unused param — will surely fix eventually" signal. Pre-existing bug surfaced by lint-1.1, not caused. Fix path: either populate `warnings` in `loadSkillSource` (surface missing-workflow.md as a non-fatal warning) or remove the parameter entirely from both callsite and callee.

## Deferred from: code review of mig-test-1-1-replace-upgrade-test-count-assertions (2026-04-23)

- **`migrations[1].breaking` unchecked in v1.7.1 chain assertion** — Blind Hunter. `tests/integration/upgrade.test.js:405-407` asserts `migrations[0].breaking === true` but never checks `migrations[1].breaking`. If `2.0.x-to-3.1.0`'s breaking flag flipped in registry.js, this test would pass silently. Not in mig-test-1-1 scope (count-rot fix only). Fix path: add `assert.equal(migrations[1].breaking, false)` as part of a future `derive-counts-from-source` compliance sweep story.
- **Unfixed hardcoded count `config.workflows.length >= 13` at line 289** — Edge Case Hunter. Same rot class as the three AC1-3 assertions — it's bound to the v1.4.1 post-refresh workflow count. If workflows are consolidated below 13, the test silently regresses; if additional Wave 4 workflows land, the `>=` guard absorbs that silently too. Out of mig-test-1-1 scope per Scope Exclusion. Fix path: replace with `for (const wf of EXPECTED_V14_WORKFLOWS) assert.ok(config.workflows.includes(wf))`.
- **Unfixed hardcoded count `config.agents.length >= 7` with only 2 of 7 agents named at line 446** — Edge Case Hunter. Same pattern: a refresh bug that drops `hypothesis-engineer` but duplicates another agent to reach 7 would pass the length check and never trigger the 2 named-agent assertions. Fix path: assert each of the 7 named agents explicitly.
- **v3.0.x chain-walker non-determinism in registry.js** — Edge Case Hunter. `getMigrationsFor('3.0.5')` could match either `3.0.x-to-3.1.0` OR `3.0.x-to-4.0.0` at `registry.js:151-153` — `Array.prototype.find` returns the first registry-order match. A 3.0.x user could be routed through the non-breaking 3.1.0 hop and miss the 4.0.0 breaking migration silently. Pre-existing, registry-side concern — out of any test-level story scope. Fix path: add a v3.0.x describe block asserting `getMigrationsFor('3.0.5')` contains `'3.0.x-to-4.0.0'`, OR enforce registry invariant that only one migration matches per `fromVersion`. Belongs in a registry-housekeeping story.
- **Append-safety simulation did not cover mid-chain insertion** — Blind Hunter. Task 5 probe appended `4.0.x-to-5.0.0` at the tail. A hypothetical mid-chain insert (e.g., a patch migration between `2.0.x-to-3.1.0` and `3.1.x-to-4.0.0`) would rot AC2's positional assertions (`migrations[1].name === '2.0.x-to-3.1.0'`). AC1/AC3's `some(...)` checks are position-agnostic and would survive either way. Future reviews of registry-touching stories should probe mid-insertion when positional identity is used.
