# Deferred Work — Code Review Findings

This file collects code-review findings that were classified as `defer` —
real issues, but pre-existing or out of scope for the story under review.

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
