---
initiative: convoke
artifact_type: note
qualifier: backlog-completed-archive
created: '2026-08-24'
schema_version: 1
status: active
origin: 'Decision 2(b) of the 2026-08-24 backlog cleanup — post-mortem prose split out of the lifecycle backlog'
---

# Backlog — Completed Work Archive

Full closing text for rows retired from the lifecycle backlog's lanes. The backlog's
[§2.5 Absorbed / Archived](convoke-note-initiative-lifecycle-backlog.md#25-absorbed--archived) carries a
one-line receipt per row and links here for the detail.

**This file is append-only and is never rewritten.** A closing note records what was understood
at the moment the row closed. Editing it later falsifies the record — where a finding was
subsequently overturned, append a dated addendum under the same heading and leave the original
text standing. Two entries below (`I131`, `BUG-16`) are themselves retractions of earlier
claims, preserved on exactly that principle.

Rows arrive here only through the **Closing a Row** transition in
[`backlog-format-spec.md`](../../_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md).

---

## BUG-16

**Lane:** Bug Lane · **Score:** 17.1 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-15

**Receipt:** Emitted guidance used a floating `npx -p convoke-agents` tag, serving `latest` rather than the running build — observed path pinned; the class stays open as T38

✅ **OBSERVED PATH FIXED 2026-08-15. Class open — see T38.** **Emitted guidance used the floating `npx -p convoke-agents` form, which serves `latest` — not the build the operator is actually running.** Found on a **second machine with no stale global** during 4.0.0-rc.2 validation: the operator followed the freshly-corrected instruction verbatim (`npx -p convoke-agents convoke-doctor`) and got `Package version: 3.3.0`, because `latest` is 3.3.0 while `rc` is 4.0.0-rc.2. Result: the identical false report BUG-10 produced — seven Vortex agents "missing" plus **"Reinstall the _vortex module"** — on a correctly migrated project, this time caused by our own corrected guidance rather than the operator's environment. **BUG-10's fix was insufficient:** converting bare → floating-tag removed the stale-*global* vector and inherited a stale-*latest* one. The pre-fix verification (`npx -p convoke-agents convoke-version` → 3.3.0) demonstrated the bug and was misread as success — it proved the global was bypassed, not that the right version was served. **Not prerelease-only:** any operator whose project is not on `latest` hits it. A 4.0.0 user after 4.1.0 ships gets 4.1.0's doctor against a 4.0.0 project — same version-consistency failure. The floating tag is wrong by construction; it names a moving target instead of the running build. **Fixed (observed path only):** `convoke-update.js` ×3 post-migration guidance and `convoke-doctor.js:616` version-consistency remediation now interpolate `getPackageVersion()` — emitting `npx -p convoke-agents@4.0.0-rc.2 convoke-doctor`, verified by executing the local build against a scratch 3.3.0 project. 2 test assertions made version-agnostic. **Record note (2026-08-16):** this row was **deleted** by commit `c841fcd2` — the very commit that shipped the fix — and restored incidentally by `b72a9c53` under an unrelated title. Nine cross-references (`sibling: BUG-16`, `found-by: BUG-16 R2`) pointed at nothing in between, and every check stayed green: nothing validates backlog referential integrity. Recorded so a future audit does not read the re-add as an unexplained addition. Candidate check for T38's sibling work: assert every `BUG-n`/`T-n` referenced by a row actually exists. **Extended 2026-08-15 (rc.4):** the `convoke-audit-bmm-deps` guidance — which a validator sees **twice on a successful run**, once from `convoke-update`'s governance check and once from `convoke-doctor` — was still floating. 13 further sites pinned (11 in `convoke-doctor.js` via a local `getPackageVersion()` in `checkBmmDependencies`, 2 in `convoke-update.js`); 2 test assertions made version-agnostic. **Verified by execution:** a successful `convoke-update` + `convoke-doctor` run against a scratch 3.3.0 project now emits **zero** floating instructions — the operator's happy path is fully self-consistent. **Deliberately NOT fixed here:** 31 sites remain across 13 files, all on error/edge paths (`postinstall`, `convoke-version`, `convoke-migrate`, `convoke-register-skill`, `validate-marketplace`, `audit-skill-dirs`) that a clean run never reaches. Centralisation is T38.

---

## BUG-15

**Lane:** Bug Lane · **Score:** 17.9 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-17

**Receipt:** The CI `publish` job had no `--tag`, so any `v*` tag — including an rc — would have gone to the `latest` dist-tag; the tag is now derived from the version

✅ **DONE 2026-08-17.** **The CI `publish` job would have pushed a release candidate to the `latest` dist-tag, exposing every existing user.** `.github/workflows/ci.yml` publish step runs `npm publish --provenance --access public` with **no `--tag`**, while the job fires on `if: startsWith(github.ref, 'refs/tags/v')` — which matches `v4.0.0-rc.2` exactly as it matches `v4.0.0`. npm applies `latest` unless `--tag` is passed; prerelease semver does not change that. **Evidence it is real:** both manual rc publishes on 2026-08-15 required an explicit `npm publish --tag rc` precisely to keep `latest` at 3.3.0, and `npm view convoke-agents dist-tags` confirmed it worked (`{latest: 3.3.0, rc: 4.0.0-rc.1}`). CI has no equivalent. **Currently latent only because rcs have been hand-published.** The moment an rc is tagged and pushed — the normal release motion — every `npm install convoke-agents` gets a release candidate. **Fix:** derive the dist-tag from the version, e.g. publish with `--tag rc` (or `next`) when `package.json` version matches a prerelease pattern, `latest` otherwise; fail the job if the two disagree. Sibling to T35 (hand-publishing bypasses this job entirely). **Fixed:** the publish step now derives the dist-tag from `package.json` version — a `-` in the semver routes to `rc`, everything else to `latest`. Verified against 4.0.0 → latest, 4.0.1 → latest, 4.1.0-rc.1 → rc, 5.0.0-beta.2 → rc. Landed alongside the Node 24 upgrade that OIDC requires, since both touch the same three lines and the release had already shipped, removing the earlier objection to editing the publish path mid-release.

---

## BUG-11

**Lane:** Bug Lane · **Score:** 17.1 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-15

**Receipt:** 28 shipped doc sites instructed bare `npx convoke-doctor`, which resolves a stale global before the registry; rewritten to the `-p` form

**Shipped docs instruct `npx convoke-doctor` — without `-p` — which does NOT bypass a stale global and reaches for an unclaimed npm name.** 28 occurrences across `README.md` and all 7 Vortex user guides (`{EMMA,ISLA,MILA,LIAM,WADE,NOAH,MAX}-USER-GUIDE.md`). `npx <bin>` resolves `node_modules/.bin` and `$PATH` **before** any registry fetch, so an operator holding an old global runs that copy — the exact BUG-10 vector, sitting in the first document every user reads. Second-order: on a machine with no local or global copy, npx then tries to fetch a registry package literally named `convoke-doctor`. Verified `npm view convoke-doctor` → **E404, name unclaimed**. Same for the other bin names. That is a name-squatting exposure on commands the README tells users to run — a decision for the operator (reserve the names, or accept), tracked separately from the mechanical fix. Also fixes `_bmad/bme/_artifacts/workflows/bmad-portfolio-status/workflow.md:68`, which still displays bare `convoke-update` in a HALT message — in the same workflow directory whose two step files were corrected under BUG-10, so the sibling inconsistency is already visible. **Fix:** mechanical rewrite to `npx -p convoke-agents <bin>` across the 28 sites + 1 workflow HALT. Found by BUG-10 R2 review. **✅ DONE 2026-08-15.** 28 `npx convoke-<bin>` occurrences rewritten to the `-p` form across `README.md` (9) and all 7 Vortex user guides (19), plus 5 bare-command instructions in shipped/agent-executed workflow markdown: `bmad-portfolio-status/workflow.md` (the taxonomy-missing HALT), `add-team/step-05-validate.md`, `bmad-audit-skill-dirs/workflow.md` ×2, `bmad-register-skill/workflow.md`. Verified: zero bare `npx convoke-<bin>` remain in shipped paths, no double-application. `CHANGELOG.md` and `_bmad-output/**` deliberately untouched — historical records, not instructions. The npm name-reservation exposure is split out as **I155** (operator decision, not a code fix).

---

## BUG-10

**Lane:** Bug Lane · **Score:** 14.3 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-15

**Receipt:** Convoke's own output told operators to run bare `convoke-*`, so a stale global 3.1.0 answered and falsely reported seven agents missing; 13 sites pinned, guard withdrawn to T31

✅ **STRINGS FIXED 2026-08-15. Guard withdrawn — see T31.** **Convoke's own output told operators to run bare `convoke-*` commands, which resolve through PATH to a stale global install.** Reproduced end-to-end during 4.0.0-rc.1 validation: `convoke-update` completed a correct 3.3.0 → 4.0.0-rc.1 migration, then printed "Run `convoke-doctor` for detailed governance checks". A globally-installed **3.1.0** answered — it does not know the v4 `agents/<name>/SKILL.md` layout — and reported **seven Vortex agents as MISSING** with the remediation **"Reinstall the _vortex module"**: a false data-loss report carrying destructive advice, seconds after a breaking-change migration. The 4.0 doctor on the same project: 26 checks passed, 0 hard failures. **Not rc-specific** — anyone who ever ran `npm install -g convoke-agents` stays exposed. **Shipped:** 13 operator-facing code sites rewritten to `npx -p convoke-agents <bin>` (verified to bypass a global: reports 3.3.0 where the global is 3.1.0) across `convoke-update.js` ×3, `convoke-register-skill.js` ×3, `convoke-doctor.js` ×3, `artifact-utils.js`, `portfolio-engine.js`, and `3.3.x-to-4.0.0.js` ×2 — the latter including `V4_ACTIVATION_TEMPLATE`, whose text is baked into **every migrated SKILL.md**, and a preview line printed verbatim by `migration-runner.js:248`. Plus 3 `_bmad/bme/_artifacts/workflows/bmad-portfolio-status/steps/*.md` matchers that literal-match the emitted strings (R1 HIGH: changing the output silently broke the recommendation branch), and 5 test assertions, all in the same commit per the atomic rule. **Guard NOT shipped.** A bespoke `scripts/audit/cli-guidance-check.js` was written, reviewed twice, and withdrawn. R1 found 4 comment-handling defects; the rewrite for R2 found 9 more plus an infinite loop on empty `BINS`. Root cause: it hand-rolled a JS lexer in regex, so a `/*` inside a *string literal* (`file: 'docs/*'`) latched block-comment mode and blinded ~1,000 lines of the live tree — `refresh-installation.js:493`→EOF among them. Verified by canary: an injected violation at `docs-audit.js:280` was **not** detected while the gate printed PASS. A guard that prints PASS over unscanned code manufactures exactly the false confidence that made this bug dangerous. Rebuilt properly as an ESLint rule in **T31**. **Untouched:** `convoke-doctor.js` still emits `fix: 'Reinstall the <mod> module'` with no backup or scope guidance — the *destructive* half of the incident. Logged as a follow-up.

---

## BUG-12

**Lane:** Bug Lane · **Score:** 9.5 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-15

**Receipt:** `classify-skills.js` interpolated free text into markdown tables unescaped; four divergent escapers converged into `scripts/lib/sanitize.js`

**`classify-skills.js` builds markdown tables with zero cell escaping — the sibling of the file issue #7 just hardened, fed by the same CSV.** `scripts/portability/classify-skills.js:466`, `:478` and `:490` interpolate manifest values straight into table rows (the row originally said "466 and 479" — one wrong line number and a third site missed; caught by the pickup pre-flight) — a template literal whose four values (`c.name`, `existing`, `proposed`, `c.reason`) are dropped between raw pipe delimiters with no escaping. `reason` is free text. Reproduced during issue #7 R3: `reason = 'manual override \| conflicts with heuristic'` yields 6 pipes where 5 delimit 4 columns — the table breaks and the recommendation is silently reinterpreted as extra cells. Same CodeQL `js/incomplete-sanitization` class as alert 10, which issue #7 fixed in `validate-classification.js` while leaving this file untouched. **Compounding cause, and the honest part:** issue #7's own stated rationale was "duplicated escape sets are how the class regresses" — and it then created a *second* private pair of escapers (`escapeMarkdownTableCell`, `escapeMarkdownCodeSpanCell`) inside `validate-classification.js` instead of putting them in `scripts/lib/sanitize.js`. There are now **four** divergent table-cell escapers: those two, `scripts/lib/portfolio/formatters/markdown-formatter.js:9` (`escCell` — correct, only trivially divergent: collapses `\n\n` to one space vs two), and none at all where `classify-skills.js` needs one. **Fix:** move both escapers into `scripts/lib/sanitize.js`, converge `escCell`, wire `classify-skills.js` — one change closes the defect and the duplication together. Not user-facing (generated governance report). **✅ DONE 2026-08-15.** Escapers moved to `scripts/lib/sanitize.js`; `validate-classification.js` and `markdown-formatter.js` import them; all three `classify-skills.js` sites wired; `renderBorderlineMd` exported for test. Four divergent copies → one. Converged on `escCell`'s newline handling (runs collapse to a single space) — R1 proved the two orderings equivalent across all 19,531 strings over the alphabet backslash / pipe / CR / LF / letter, up to length 6. 5 tests on the wiring (4 verified red pre-fix; the 5th is a guard against re-introducing the R1 code-span regression, not a regression test) + 9 direct unit tests at the shared boundary, added after R1 flagged the promoted functions had none. `scripts/audit/drift-snapshot.js:127` deliberately NOT converged — different, defensible strategy; its own gaps logged as **T37**. **Review ran to full convergence, 3 rounds, and the last two both found HIGH.** R1 on the main diff: no HIGH. But 89 lines of `tests/lib/sanitize.test.js` shipped in `d9e15713` outside the reviewed diff — reviewing that gap found a **HIGH**: the `/g` flag was unpinned, so mutating the pipe replace to a non-global form left the suite green while escaping a three-pipe value stopped after the first, leaving the rest live. Every fixture had exactly one occurrence. R2 then found a **HIGH in the R1 remediation itself**: a `cellDelims` helper written to model GFM used run-parity, which is wrong — GFM escapes a pipe whenever a backslash immediately precedes it. Verified against GitHub's renderer (`POST /markdown`, mode=gfm): an escaped-backslash-then-pipe value is ONE cell, the helper predicted two. R1's finding that drove that change was itself mistaken; the lookbehind it condemned matched GFM exactly. Helper deleted. R3: remediation correct, **0 of 27 mutants survive**, central claims re-verified over 492 oracle cases; 4 documentation findings applied. **Correction carried into the code:** the long-standing explanation of alert 10 — that the wrong escape order "re-exposes the pipe as a live delimiter" — is FALSE; both orderings render identically. The real defect is silent character LOSS (a backslash-pipe value renders with the backslash gone; a double backslash renders as one). Gates: lint 0, 2408 tests 0 fail.

---

## BUG-7

**Lane:** Bug Lane · **Score:** 11.2 · **Portfolio:** convoke · **Status:** Done

**Receipt:** Phase 6 export substitution leaked `[your X]` placeholders across 176 files; wording refinement moved upstream and the redundant copy deleted

**Phase 6 export placeholder leak — `[your X]` brackets across 132 adapter cells (true scope 176 files).** `scripts/portability/export-engine.js:481-517` Phase 6 substitution emitted `[your name]`/`[your output folder]`/etc. — bracket-wrapped form read awkwardly, and `convoke-export.js:295-302` already refined to `your-X` form but ONLY for the per-skill README (not for instructions.md / SKILL.md / copilot-instructions.md / Cursor adapters). Surfaced at v63-epic-3 retro 2026-04-25 (TI-6, HIGH PRIORITY pre-Convoke-4.0). Path A executed: moved wording refinement upstream into Phase 6 + deleted redundant convoke-export.js block (DRY). In-flight discovery: latent substitution-order bug (single-brace loop matched inner `{var}` of `{{var}}`); fixed via loop reorder to satisfy spec's "warning behavior preserved" Always-constraint. R1 review: 0 NEW HIGH (3 raw HIGHs reclassified — 2 pre-existing root causes, 1 theoretical); 5 patches applied; 9 defers logged. Validation gates green: unit 1446/0/1, integration 93/0, lint clean, 0 bracket leaks across 176 affected files. Spec: [spec-bug-7-export-placeholder-wording.md](../implementation-artifacts/spec-bug-7-export-placeholder-wording.md).

---

## U10+P23+A8+A9

**Lane:** Initiative Lane · **Score:** 2.3 · **Portfolio:** convoke · **Status:** **Done 2026-08-17**

**Receipt:** BMAD v6.3.0 Adoption (Convoke 4.0) — shipped as 4.0.0 on 2026-08-17; npm `latest`, tag `v4.0.0`, GitHub release published

**BMAD v6.3.0 Adoption (Convoke 4.0)**

---

## T50

**Lane:** Fast Lane · **Score:** 11.4 · **Portfolio:** convoke · **Status:** ✅ Closed 2026-08-24 by commit `4556f4f0`. The Vortex `config.yaml` stamp was the ONLY module-config write in `refresh-installation.js` lacking an `!isSameRoot` guard — Gyre, Enhance, Artifacts and the standalone submodules all had one. Five test call sites pass `PACKAGE_ROOT` deliberately (to exercise dev-environment skips) and this write sat outside those branches, so the repo's own shipped config was rewritten on every run and then committed under bare "Update config.yaml" commits across at least seven releases — which is why the field appeared to track the package version by design. **Guarded, with two regression tests proven by MUTATION** (revert the guard, they fail). A real installation is unaffected: verified against a temp dir, `stamped: true`, target written at 4.0.1. Full suite now leaves the tree clean, reproduced twice. **Residual filed as T54** — `agent-manifest.csv` and `taxonomy.yaml` have the same defect, latent only because the dev tree is currently in sync.

**Receipt:** `npm test` wrote to a shipped config file on every run — the dev-tree write is now guarded

**`npm test` writes to a SHIPPED config file on every run.** Every invocation of the test suite rewrites `_bmad/bme/_vortex/config.yaml`, syncing its `version:` field from `package.json` -- observed 2026-08-23 taking it `4.0.0` -> `4.0.1-rc.0`, four times in one session. **Reproduced on a clean tree** with all in-flight work stashed, so it is the suite's own behaviour, not a side effect of any change. This is a direct `test-fixture-isolation` violation: a test is writing to real module config instead of a fixture. **Why it matters beyond tidiness:** the file is inside `files[]` and ships to users, so a `git commit -a` after a test run silently publishes a config whose version disagrees with the release; and it dirties the tree during any verification that compares working-tree state, which is exactly what made isolating an unrelated test failure take four attempts. Find the writer (likely a `refresh-installation` or `config-merger` test using the real `_bmad/` tree as its target) and point it at a tmpdir fixture.

---

## T32

**Lane:** Fast Lane · **Score:** 9.5 · **Portfolio:** convoke · **Status:** ✅ Closed 2026-08-24 by commit `4556f4f0`. `npm run docs:audit` now runs as a step in the `agent-surface-parity` job, which is in `publish.needs` — so a broken link in a SHIPPED user guide blocks a release. **Demonstrated failing first per NFR10**: a planted broken link produced exit 1 naming file and line, exit 0 on restore. **Observed green on a real runner**, not just locally — run `32674075901`, job `97279233304`. Placed after `Backlog referential integrity` because an initial insert orphaned the BUG-16 incident comment onto the new step; caught at review.

**Receipt:** `npm run docs:audit` existed, was failing, and nothing watched it; wired into CI

**Wire `npm run docs:audit` into CI — it exists, it was failing, and nothing was watching.** Discovered 2026-08-15 while fixing BUG-11: `npm run docs:audit` exited 1 with 8 broken-path findings across all 7 Vortex user guides, every one pointing at the pre-v4 flat agent layout (`_bmad/bme/_vortex/agents/<name>.md`) that the v6.3 skill-dir migration moved to `<name>/SKILL.md`. Broken links in **shipped** user guides, on the 4.0 surface, from a gate the repo already owns. `.github/workflows/ci.yml` runs lint, tests, burn-in, coverage, agent-surface-parity, install-scope-check, security, package-check and fresh-install — but not this one. 22 stale paths were corrected in the same session and the audit now passes with zero findings; **the wiring is the actual fix**, since nothing prevents the next layout change from re-breaking them silently. Add a `docs-audit` step (own job or alongside lint). Sibling pattern to BUG-10/BUG-11: a check that exists but is not enforced is indistinguishable from no check.

---

## T39

**Lane:** Fast Lane · **Score:** 9.5 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-17

**Receipt:** `badges:check` blocked `npm publish` whenever a day had passed, for a reason unrelated to the package

✅ **DONE 2026-08-17.** **`badges:check` blocked `npm publish` whenever a day had passed, for a reason unrelated to correctness.** `prepublishOnly` runs `badges:check` = `npm run badges && git diff --exit-code docs/badges.json`. `generate-badges-json.js` stamps a `generated` date, so on any day after the last badges commit the regenerated file differs and the gate exits 1 — aborting the publish before anything uploads. Observed twice on 2026-08-15/16 across six release candidates: the counts (`teams 2, agents 12, workflows 33, skills 106`) were identical each time; only the date moved. Every publish therefore needs a ritual commit of a file whose only change is a timestamp. **Fix options:** (a) drop `generated` from the file and derive it at render time; (b) exclude that key from the diff comparison; (c) drop `badges:check` from `prepublishOnly` and run it in CI, where a stale badge is a warning rather than a release blocker. Sibling to T32 (`docs:audit` exists but is not wired into CI) — one gate blocked releases for a non-reason while another catches real defects and nobody runs it. **Escalated from backlog item to release blocker 2026-08-17:** the 4.0.0 tag run failed on `ENEEDAUTH` (no `NPM_TOKEN` secret), and while that was being resolved the date rolled over — so the next publish attempt would have aborted at `prepublishOnly` with a completely different error. The defect bit the release it was logged against. **Fixed (option a — remove the field; the "derive at render time" half was not done, because the render target no longer exists — see below):** `generated` deleted from `scripts/generate-badges-json.js`; nothing read it (verified by grep across `README.md`, `docs/`, `.github/workflows/`, `tests/` — only the generator wrote it and two `git diff --exit-code` checks compared it). **Verified:** `badges:check` exits 0 and stays 0 across repeated runs with no date to drift; counts unchanged (teams 2, agents 12, workflows 33, skills 106); unit 1646/0, integration 120/0, lint 0. **Second benefit:** `.github/workflows/badges.yml` auto-commits only when counts actually change now, instead of on any calendar roll. **Discovered during the R1 review (2026-08-17): `docs/badges.json` now has NO consumer at all.** The four dynamic shields that read it were removed from `README.md` by the I156 rewrite (`303f160d`); the two remaining badges are static. `docs/` is not in `package.json` `files`, so the file never ships either. A generator, a scheduled workflow, and a **publish-blocking gate** are maintaining an artifact nobody reads. Retiring the pipeline — or at minimum removing `badges:check` from `prepublishOnly` — is logged as **T40**.

---

## T40

**Lane:** Fast Lane · **Score:** 9.5 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-21 — option (a); pipeline deleted by story `dist-1-1` (ADR-001)

**Receipt:** The badges pipeline gated `npm publish` for reasons unrelated to package health — retired outright, option (a)

✅ **DONE 2026-08-21 — option (a).** **Retire the badges pipeline, or at least stop it gating `npm publish` — it maintains a file with no consumer.** The four dynamic shields that read `docs/badges.json` (teams / agents / workflows / skills, via shields.io `dynamic/json` against raw.githubusercontent) were removed from `README.md` by the I156 rewrite (`303f160d`); the two badges left are static (npm version, MIT licence). `docs/` is not in `package.json` `files`, so the file never ships to users either. Verified 2026-08-17: **zero consumers** across `README.md`, `docs/`, `tests/`, and every workflow — only the generator that writes it and the two `git diff --exit-code` checks that compare it. Meanwhile `badges:check` sits in `prepublishOnly`, so this orphan **blocks releases**: it aborted the 4.0.0 publish on 2026-08-16 (see T39) and forced a ritual commit before every one of six release candidates. **Options as assessed at intake — option (a) taken:** (a) delete the generator, `docs/badges.json` and `.github/workflows/badges.yml` outright — nothing consumes them; (b) keep the counts as a repo-health signal but remove `badges:check` from `prepublishOnly` and run it as its own CI step, where a stale count warns instead of blocking a release; (c) restore a consumer if the counts are genuinely wanted in the README. Note (c) has a wrinkle already recorded elsewhere: `skills: 106` counts the whole installed BMAD skill surface, not Convoke's own inventory, so the badge would overstate. Decide what the number is *for* before restoring it.

---

## T41

**Lane:** Fast Lane · **Score:** 5.4 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-22 — all 5 findings fixed across `dist-1-2` (a), `dist-1-4` (c), `dist-1-3` (e) and `dist-1-5` (b, d)

**Receipt:** Publish-path hardening — all five findings from the BUG-16 R2 review fixed across dist-1-2 through dist-1-5

**Harden the publish path — **ALL 5 findings fixed** (a, b, c, d, e) — BUG-16 R2 review fully discharged.** All live on a path that executes **only** on a `refs/tags/v*` push, so each fix gets exactly one live rehearsal and a wrong edit costs a tag delete-and-repush. Deliberately deferred out of `3a3de195` rather than attempted at the end of a long session. ~~**(a) HIGH — `case *-*` misclassifies build metadata.** `4.0.0+2026-08-17` and `4.0.0+sha.5114f85-dirty` route to `rc`, so a stable release never reaches `latest`. Fix: `case "${VERSION%%+*}"`. Reproduced.~~ ✅ **(a) FIXED 2026-08-22 by story `dist-1-2`** (FR1) — `ci.yml`'s `Publish to npm` step now reads `case "${VERSION%%+*}"`; derivation verified across all five cases locally, no tag pushed. **all findings now closed** *(was "(b)–(e)"; (e) closed 2026-08-22 by `dist-1-3`, (c) by `dist-1-4`)*. ~~**(b) HIGH — `node-version: 24` does not guarantee npm ≥ 11.5.1**, the OIDC floor. 8 of the released 24.x lines bundle npm 11.3.0–11.4.2, and `setup-node` defaults `check-latest: false`, so this works today by luck of the runner toolcache. Regression mode is the silent anonymous publish returning 404. Fix: assert `npm --version` in the job.~~ ✅ **(b) FIXED 2026-08-22 by story `dist-1-5`** (FR2) — the publish job now field-compares `npm --version` against the 11.5.1 floor and fails loudly below it. ~~**(c) HIGH — BUG-15 shipped half its own acceptance text.** "Fail the job if the two disagree" was never built: `github.ref_name` appears nowhere, so tag and `package.json` version are fully decoupled. Tag `v4.0.1` with package.json at `4.1.0-rc.1` publishes the rc under a tag naming a release that never existed.~~ ✅ **(c) FIXED 2026-08-22 by story `dist-1-4`** (FR3) — `github.ref_name` reaches the job via `env:` and the step refuses when tag and version disagree. **(b) and (d) remain open.** ~~**(d) HIGH — `setup-node` writes `_authToken=${NODE_AUTH_TOKEN}` into `.npmrc` regardless.** Unset, npm sends the literal 14-character string as a bearer token, so an OIDC decline reappears as a *bad token* rather than *no token*. Fix: remove the userconfig or assert `npm whoami` before publish.~~ ✅ **(d) FIXED 2026-08-22 by story `dist-1-5`** (FR4) — `registry-url:` removed from `setup-node` so no placeholder userconfig is written, asserted in-job; plus an OIDC id-token precondition check. *(`npm whoami` was NOT the fix: it needs a token that OIDC only mints during publish — but `npm publish --dry-run` DOES perform the full exchange, so a pre-tag identity gate ships too.)* **⚠️ (d)'s recorded MECHANISM was wrong and is corrected here:** `setup-node` (`src/authutil.ts:55-57`) *exports* `NODE_AUTH_TOKEN='XXXXX-XXXXX-XXXXX-XXXXX'` when it is otherwise unset, so it was never unset and npm never sent an unexpanded literal — it sent that 23-character dummy. "the literal 14-character string" was wrong twice over (the literal is 18 chars and never reached the wire). Found by `dist-1-5` R1 against setup-node's source. **The fix is unaffected and better justified:** removing `registry-url:` removes all three of its effects. ~~**(e) MEDIUM — no downgrade guard.** A maintenance `3.3.1` has no hyphen → `latest` → every user is downgraded from 4.0.0.~~ ✅ **(e) FIXED 2026-08-22 by story `dist-1-3`** (FR5) — the publish job now fetches the registry's `latest` and refuses a semver-lower publish, failing closed. **all findings now closed** *(this sentence said "(b)–(d)" until (c) closed 2026-08-22 via `dist-1-4`)*.

---

## T46

**Lane:** Fast Lane · **Score:** 8.1 · **Portfolio:** convoke · **Status:** ✅ Closed 2026-08-23 by `dist-1b-1`. The skip branch now anchors on npm's error-CODE line (`^npm error code E404$`) instead of grepping the whole stderr stream, so unrelated 404 noise no longer disables the guard. **Demonstrated failing first** (NFR10): a fixture carrying `npm error code E500` plus `npm warn 404 Not Found - GET .../-/npm/v1/notifications` made the pre-fix guard SKIP with exit 0; post-fix it aborts. **The folded-in second defect is also fixed:** `npm view <pkg> <missing-field>` exits 0 with empty stdout AND empty stderr (executed -- it is not an error path), so an empty reply reached the success branch and was reported as *"registry returned a multi-line 'latest'"*; it now aborts naming the empty reply and citing the `npm dist-tag add` repair. Comparison extracted to `scripts/ci/downgrade-guard.sh` with a NAMED `GUARD_CAND`/`GUARD_CURRENT` contract, and a transposition test proves the call-site orientation inverts the verdict.

**Receipt:** The FR5 downgrade guard failed OPEN on any `404` in `npm view` stderr, including unrelated ones

**The FR5 downgrade guard's only error branch fails OPEN on any `404` anywhere in `npm view`'s stderr.** `if grep -qE 'E404\|404 Not Found' "$VIEW_ERR"` greps the WHOLE stderr stream rather than the error-code line, and `npm view` emits sub-request noise on that same stream. Reproduced: stderr carrying `npm error code E500` plus a `npm warn 404 Not Found - GET .../-/npm/v1/notifications` line made the block print *"convoke-agents has no published version yet -- nothing to downgrade"*, skip the comparison entirely, and reach `npm publish --tag latest` with EXIT=0. A registry partial outage, a CDN 404 on a notifications/audit sub-fetch, or a proxy that 404s one path is sufficient. **This matters because the registry applies no downgrade protection of its own** -- `npm publish --tag latest` at a lower version is accepted and moves the tag, so gate 5 is the ONLY protection and its sole fail-open branch is reached by substring match on untrusted output. The log line reads like a normal pass. **Fix:** require corroboration before disabling the guard -- only skip if a second probe (`npm view "$PKG" versions`) also 404s -- and reword the message to name what was actually established. **Second, narrower defect three lines away:** an EMPTY registry reply (package exists, no `latest` dist-tag, e.g. after `npm dist-tag rm` or mid-replication) exits 0 with empty stdout, which `grep -c ''` counts as 0 and the `-ne 1` test reports as *"registry returned a multi-line 'latest'"*. Right outcome, wrong diagnosis, on a spent tag. There is no `-z "$CURRENT"` branch. Scope both together.

---

## T35

**Lane:** Fast Lane · **Score:** 4.5 · **Portfolio:** convoke · **Status:** ✅ Closed 2026-08-23 — fixed-in-part by `dist-1-7` (FR9). **What is fixed:** the npm package setting *Require two-factor authentication and disallow bypass 2fa tokens* is in force on `convoke-agents`, so granular access tokens cannot publish regardless of their bypass-2FA flag. All seven observed hand-publishes were token-authenticated and non-interactive — that vector is closed. Verified by operator read of Package Settings → Publishing access; note it was found ALREADY enabled, and npm exposes no audit surface, so the date it was applied is unrecoverable. **What is NOT fixed and is deliberately not being pursued:** a 2FA maintainer can still publish interactively — npm's own wording for this option is that maintainers *"must publish interactively"*. No npm setting blocks a human; the publishing-access list has exactly two options and neither does. So the residual is not a preventive gap that more configuration would close, it is a **detective** problem, and it is folded into **T47** rather than kept open here: a hand-published version carries an empty `dist.attestations` permanently, which is precisely how `4.0.0` is known to have bypassed the pipeline. **Options (b) and (c) DECLINED** per ADR-003: (b) a repository preflight is bypassable and its only home `prepublishOnly` was deleted by ADR-001 (verified: 0 occurrences in `package.json`); (c) recording the built-from commit is redundant once trusted publishing emits provenance.

**Receipt:** Hand-publishing bypassed the entire CI publish gate; fixed in part by dist-1-7 (FR9), residual absorbed into T47

**Hand-publishing bypasses the entire CI publish gate, and nothing binds a published artifact to a committed tree.** `.github/workflows/ci.yml` defines a `publish` job gated on 8 jobs — lint, test, python-test, coverage, security, package-check, agent-surface-parity and **fresh-install (T25)** — publishing from a clean checkout with `--provenance`. It fires only on `refs/tags/v*`. `4.0.0-rc.1` was published by hand at 08:51 on 2026-08-15: no tag, no CI run, none of the 8 gates, no provenance, and packed from a working tree rather than a clean checkout — so whatever was on disk at that moment shipped, committed or not. **Consequence observed the same day:** BUG-10 was fixed at 14:08 and BUG-11 after it, yet `@rc` still served the 08:51 build. Testing against it reproduced both defects and proved nothing about the tree. Verified by unpacking the published tarball: `convoke-update.js:212/215/218` still carried the bare `Run \`convoke-doctor\`` string. Cost a validation cycle; would have cost a recruited validator's session. **Fix options:** (a) make tag-push the only publish path and document it, with `npm publish` from a laptop treated as an incident; (b) if manual rc publishing must stay, add a preflight that refuses to publish when the working tree is dirty or `HEAD` is not pushed, and that prints the commit the tarball was built from; (c) record the built-from commit in the package so a tester can report it. Note this is a *build-freshness* gate, distinct from the A40/P21 Publication Gate, which governs Covenant compliance for external publication.

---

## T25

**Lane:** Fast Lane · **Score:** 8.0 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-14

**Receipt:** No gate proved the *published* package installs; added the CI `fresh-install` job, verified to fail on a real regression rather than merely to exist

✅ **DONE 2026-08-14.** `fresh-install` job added to `.github/workflows/ci.yml` and wired into `publish` `needs`, running `scripts/audit/try-fresh-install.sh`: packs the tree, installs THAT TARBALL into a throwaway project, then runs what a new user runs — `convoke-install-vortex`, `convoke-doctor`, a real `convoke-export`, and a presence/parse check on all 14 declared bins. **Proven to fail on a real regression, not just to exist:** removing `_bmad/_config/skill-manifest.csv` from package `files` (re-breaking I139) makes it exit 1 with `doctor=0 export=99` — i.e. **the health check reported healthy while the shipped bin was broken**, which is precisely the blind spot this job closes. Needs no `npm ci` (verified against a clean clone with no `node_modules`), so the job is checkout + setup-node + one script. Ubuntu-only by design — it is bash; Windows install behaviour stays tracked as **I128**. **R1 CODE REVIEW 2026-08-14 — 2 reviewers, both HIGHs confirmed by my own execution.** **(1) The bin check could not fail.** Guard was `[ $STATUS -gt 1 ]`, but a bin npm cannot link makes `npx` exit **1** — so the check reported "all bins launch". Worse, it probed with `--help`, which `install-vortex-agents`, `install-gyre-agents`, `install-all-agents` and `convoke-doctor` do not implement (0 argv matches), so it EXECUTED three installers with output discarded. Replaced with a presence/ship/parse check that runs no product code. **Correction to the review's framing:** a `files:` omission cannot drop a bin — npm force-includes `bin` targets and `main`, verified by packing. The reachable defects are a target that does not exist and one that does not parse; both are now caught (mutation-verified, exit 1 each; the old check missed both). **(2) `convoke-install-vortex` failure was printed but not gated** — the verdict tested only doctor/export/bins, so "what a new user runs first" could fail while the script printed PASS. Now gated (mutation-verified). Also fixed: `npm install` output was fully silenced, making a registry blip indistinguishable from a code defect on a job that gates `publish` — now captured, with exit **2** reserved for harness/environment failure vs **1** for a real defect; export was 1-of-N and order-dependent — now up to `MAX_EXPORTS` (default 5) with the cap reported, never silent; bin enumeration could silently yield zero iterations; a manifest schema change died with a raw stack trace; no `timeout-minutes` (now 15); no failure artifact (logs now copied to a stable `.fresh-install-logs/` before the temp tree is destroyed, since `KEEP=1` is un-actionable in CI). **R2 (2026-08-14):** found the R1 bin fix passed for a NEW wrong reason — `node --check` parses but never resolves `require()`, so a bin whose dependency did not ship parsed clean and reported "all 14 bins present". Reachable and verified: dropping the `_bmad/bme/_team-factory/` `files:` entry was invisible. Fixed by resolving each require specifier without executing the bin (mutation-verified). Also fixed: every `npm install` failure was blamed on the registry (a crashing postinstall and a bad semver range are product defects); the preserved log was `install.log`, which on every exit-1 path is the log of a SUCCESSFUL install — now the full transcript; the export comment claimed "EVERY skill" while exporting 5. **R3 (2026-08-14, final round):** confirmed no path makes the gate pass when it should fail, EXCEPT the extractor itself failing open via `2>/dev/null` — **the third instance of that exact pattern in one file**, now fixed and mutation-verified. Also fixed: `rm -rf "$LOG_DIR"` recursively deleted caller-supplied directory contents (a direct violation of this repo's `path-safety-for-destructive-ops` rule — verified destroying unrelated files, now removes only its own two logs); a failing `mkdir` aborted the cleanup trap and leaked the temp tree; a failed copy printed "no diagnostics to copy", telling the maintainer the run died before logging when a complete transcript existed; the network-classification grep matched the bare token `network` anywhere. Deferred: **I149**, **I152**, **I153**. **Justification, from this week:** I135, I137 and I139 each passed the full test suite, `npm pack --dry-run` and `node index.js`, and each broke every user. All three were found by packing and installing by hand. Original row: **Install-tarball smoke job (`npm pack` + install in tmp + run bin)** — replace/augment `package-check`'s `node index.js` smoke with a real install verification: `npm pack`, install the tarball into a fresh tmp project, exercise `npx convoke-install-vortex` or `convoke-doctor`. Catches missing `files:` entries in `package.json:6-23` which has churned repeatedly. Highest-reach: every user hits `npm install`.

---

## I135

**Lane:** Fast Lane · **Score:** 27.0 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-14

**Receipt:** `convoke-export` was broken in every user project — the bin resolved a path that only exists in the dev tree

✅ **DONE 2026-08-14 — `convoke-export` was broken in every user project.** `loadReadmeTemplate()` built `<projectRoot>/scripts/portability/templates/readme-template.md`, but that template is part of the SHIPPED package (it sits beside `convoke-export.js`; `scripts/` is in package.json `files`). It therefore existed only when cwd happened to be the Convoke repo. In a real user project the bin exited 4 with `ENOENT ... <their-project>/scripts/portability/templates/readme-template.md`. **Verified both ways:** reproduced in a clean temp project before the fix, confirmed exporting successfully after. Fixed by resolving from `__dirname`; `buildReadme()`'s now-unused `projectRoot` param removed. **Why it survived:** the suites that exercise the CLI were quarantined (I123) and `scripts/portability/**` was outside the coverage gate — broken, untested and invisible simultaneously. `projectRoot` is right for the user's DATA; it is never right for our own code.

---

## I139

**Lane:** Fast Lane · **Score:** 8.6 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-14

**Receipt:** `convoke-export` failed on a clean install because the manifest listed skills the install does not carry; manifest reframed as a candidate list with a filtered copy seeded at install

✅ **DONE 2026-08-14.** `convoke-export` now works on a clean install — verified end-to-end by packing, installing into a fresh project, and exporting (exit 0). **Design: ship the manifest as a CANDIDATE list, seed a FILTERED copy at install.** `_bmad/_config/skill-manifest.csv` added to package `files`; `refreshInstallation` now writes, when the project has none, only the rows whose `path` resolves in that project. That keeps the ~15 Convoke rows always and picks up upstream BMAD rows exactly when the user has that content — 106 candidates in, 15 out, **0 broken paths**. Seeding verbatim was rejected: only 19 of 106 rows point at content Convoke ships, so it would recreate I123's trap of a manifest that mostly resolves to nothing. Never overwrites an existing manifest (user state). **Two bugs found and fixed during implementation, both by inspecting output rather than by a test:** (1) re-serialising through `writeManifest` emitted unquoted fields, while the Enhance registration block dedups with a QUOTED substring match — so it missed the seeded row and appended a **duplicate**; fixed by filtering the package file's raw lines, preserving quoting byte-for-byte. (2) my own acceptance script hardcoded `bmad-brainstorming`, an UPSTREAM skill Convoke does not ship, so it reported a failure that was its own bad assumption; it now picks a skill from the seeded manifest. **Doctor on a clean install: 27 checks passed, 1 warning** (was 25/2). Regression test is behavioural and mutation-verified — dead-branching the seeding, dropping the resolves-on-disk filter, and reintroducing the duplicate each turn it red. Also added `scripts/audit/try-fresh-install.sh` (manual T25). **R1 CODE REVIEW 2026-08-14 — 2 reviewers.** The behavioural test rewrite HELD: 7 of 8 tests confirmed REAL by mutation, including against the exact dead-branching that defeated the pre-rewrite version. Three real defects found and fixed. **(1) The seeding trigger was wrong, and worse than "stuck":** `existsSync` is true for a 0-byte file, so an empty/truncated manifest was never reseeded — and the Enhance block then APPENDED a row to it, which `readManifest` read as the HEADER. Garbage columns, 0 rows, export throwing forever. Reproduced before fixing. Now seeds when absent OR unusable, sets the bad file aside as `.corrupt-<version>` rather than deleting it (path-safety), and leaves a VALID manifest untouched however few rows it has. **(2) The test scanner had its own blind spot:** `stripComments` read `const sep = /\//;` as the start of a `//` comment and dropped the rest of the line, INCLUDING a real offender — verified end-to-end. Now handles regex literals via the standard preceding-token heuristic. **(3) No containment check on the filter predicate** — `path.join` does not neutralise `..`, and `export-engine` reads whatever `path` names into a shareable bundle; added a resolve-and-contain guard plus `isFile` (a directory satisfied `existsSync` and threw EISDIR at export time). Also fixed: the smoke script parsed the manifest with `cut -d,`, which breaks on a quoted field containing a comma. Deferred with evidence: **I142**. Prior severity note: 🔴 **SEVERITY RAISED 2026-08-14 — `convoke-export` is COMPLETELY NON-FUNCTIONAL on a fresh install, not merely under-monitored.** This row originally said "doctor skips wrapper checks and convoke-export has nothing to read", which framed it as a monitoring gap. Running `scripts/audit/try-fresh-install.sh` showed the real impact: after a clean install, `convoke-export bmad-brainstorming` exits **4** with `ENOENT: ... <project>/_bmad/_config/skill-manifest.csv`. **Every export attempt by every new user fails.** That is the same class and severity as **I135** — a shipped bin broken for its actual audience. I135 fixed the template path; the bin is still unusable out of the box because the manifest it reads never ships. **Why it was missed:** `convoke-doctor` reports this only as a ⚠ warning and still exits 0, and `--help` succeeds, so both the health check and a launch smoke call it healthy. Only invoking real work surfaced it. Original framing: **A fresh install ships no `skill-manifest.csv`, so `convoke-doctor` skips all skill-wrapper checks and `convoke-export` has nothing to read.** Remaining warning after I137. `_bmad/_config/` is not in package.json `files`, so neither this nor `taxonomy.yaml` shipped — taxonomy was fixable because `mergeTaxonomy` generates it from constants, but the skill manifest is data with no generator on the install path. **Deliberately NOT fixed with I137:** shipping the repo's 106-row manifest verbatim would hand users rows whose `path` column points at skill content they have not installed, and I123 showed 75/106 of those paths do not resolve even in this repo. That is a design question — should the manifest be seeded empty, filtered to installed modules, or generated at install time? — not a packaging oversight. **Consequence while open:** the doctor's wrapper checks are silently inert on every fresh install, so a whole check category reads as passing when it never ran.

---

## I137

**Lane:** Fast Lane · **Score:** 7.6 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-14 (R1 reviewed)

**Receipt:** A clean install failed `convoke-doctor` on checks that could never pass there; 25 checks now pass with 0 hard failures

✅ **DONE 2026-08-14.** Clean install now exits 0: **25 checks passed, 0 hard failures** (was exit 1 / 17 passed / 3 failures). Verified by repacking, reinstalling into a fresh project, and re-running doctor. Four root causes, each a distinct omission: **(1)** `add-team` shipped 5 step files but no `workflow.md`, which `validator.js:179` requires for every workflow a config declares — entry point written. **(2)** `_team-factory` was the ONLY module tree copied without a config version stamp (Vortex/Gyre use `mergeConfig`, Enhance/Artifacts set it directly, this did neither), so a fresh install of 4.0.0-rc.1 reported `_team-factory: 1.0.0` and told the user to immediately update — now stamped via `doc.set`, deliberately NOT `mergeConfig`, whose structural defaults are Vortex-specific and would seed wrong values into any omitted field. **(3)** `mergeTaxonomy` was reachable only from two migrations, so taxonomy creation lived on the UPGRADE path and never the INSTALL path — now called from `refreshInstallation`, which is idempotent by construction. **(4)** **14 unrunnable remediation strings** across `convoke-doctor.js` (12) and `convoke-update.js` (2) told users to run `node scripts/audit/audit-bmm-dependencies.js`, a path absent from their project — script exposed as the `convoke-audit-bmm-deps` bin (precedent: `convoke-audit-skill-dirs`) and all call sites switched to `npx -p convoke-agents`. Plus a migration abort telling users to regenerate an authoring-time inventory they should never touch — rewritten to report a packaging fault. **Regression coverage:** 6 structural tests in `tests/lib/fresh-install-health.test.js`, all mutation-verified, running in ~15 ms rather than packing a tarball. **Three tests had PINNED the unrunnable string** (`bmm-dependencies-doctor` ×2, `convoke-update-governance` ×1) — they asserted the broken advice, so the bug was protected by its own tests; updated with the reason recorded inline. **R1 CODE REVIEW 2026-08-14 — 2 reviewers, findings applied.** The correctness pass found no HIGHs and confirmed the fix end-to-end by packing/installing/running. The test pass was damning: **4 of 6 tests were VACUOUS.** Two asserted SOURCE TEXT of `refresh-installation.js` (regex on `mergeTaxonomy(` and `scDoc.set(...)`) and were defeated by dead-branching the matched calls — both production fixes fully disabled, all six tests still green; reproduced before rewriting. Two others re-implemented production logic and got it wrong (the workflow check honoured a config `entry` field that `checkModuleWorkflows` ignores, so it verified a rule production does not have). **Rewritten behaviourally:** runs the real `refreshInstallation()` into a temp project (~100 ms) and hands the resulting files to the REAL exported doctor checks — `checkModuleWorkflows` and `checkVersionConsistency` were exported as test seams. All 7 now mutation-verified against the exact mutations that beat the old ones. Also fixed from review: `Missing: [object Object]` for object-form workflow entries; a taxonomy warning that rendered with a green ✓ because `changes[]` is printed as success; frontmatter switched to the dominant `type: step-file` convention. Deferred with evidence: **I140**. Original row: **A clean install of 4.0.0-rc.1 reports itself broken: `convoke-doctor` shows 3 failures + 2 warnings immediately after a successful install.** Found 2026-08-14 by running T25 (install-tarball smoke) by hand: `npm pack` → install the tarball into a fresh project → `convoke-install-vortex` (works; 24 agents land) → `convoke-doctor` → **exit 1, 3 issues, 17 passed**. All 13 declared bins launch cleanly, so this is narrow. **(1) `✗ _team-factory workflows — Missing: add-team`** — the directory DOES install with 5 step files, but `validator.js:179` requires `workflows/<name>/workflow.md` and `add-team` has none. Verified the convention is real: only 2 workflows in the whole tree lack `workflow.md`. Doctor is correct; this is the unshipped Team Factory Phase 3 (see **P25**). **(2) `✗ Version consistency` — package 4.0.0-rc.1 vs `_team-factory` 1.0.0**, whose suggested fix is `convoke-update` — i.e. a fresh installer is told to immediately update. **(3) `✗ Taxonomy: file exists`** — install does not create `_bmad/_config/taxonomy.yaml`. **(4) Unrunnable remediation:** doctor prints `Run: node scripts/audit/audit-bmm-dependencies.js`, a path that exists in the Convoke repo and under the user's `node_modules/`, but NOT at the path given — same class as **I135**. **(5)** `skill-manifest.csv` absent on a fresh install, so wrapper checks silently skip. **Why this is release-blocking-ish:** Story 4.5 spends a scarce external human on precisely this walkthrough. Burning that session on defects a 10-minute tarball smoke finds is a poor trade, and first impressions are not repeatable with the same validator. **Do before 4.5.** Pairs with **T25** — automate the smoke so this cannot regress.

---

## I130

**Lane:** Fast Lane · **Score:** 7.2 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-13

**Receipt:** A partially-complete PF1 recording corpus produced a guaranteed PASS; `UNFILLED_PLACEHOLDER` guard added to the parser

✅ **DONE 2026-08-13.** `UNFILLED_PLACEHOLDER` guard added to `parseRecording` (`scripts/audit/pf1-validation-battery.js`), exit 5, same class as the empty-section guard. **Verified by execution:** all 8 live recordings in `pf1-baselines/` + `pf1-post-migration/` now throw rather than parse; complete recordings still parse. The fabricated-PASS trigger is closed. Note the fix landed 15 seconds after ADR-001 was first committed, and both the ADR and this row carried a stale present-tense "live today" claim until 2026-08-14 — corrected in both. Original row: **PF1 battery: a partially-complete recording corpus silently produces a guaranteed PASS — placeholder sections pass the guard, and `medianOf` erases the real evidence.** Found 2026-08-13 by 3-layer adversarial review of Story 4.3. **Two independent defects that compound.** (1) `parseRecording` (`scripts/audit/pf1-validation-battery.js:129-137`) rejects only *empty* sections (`body.length === 0`); the D2-B fill-in placeholder is **87 bytes**, so it passes — and its own comment says the guard exists to stop "empty == empty → likely false PASS", the exact failure it misses. (2) `computeGate` consumes `medianOf([P1,P2,P3,P4])`, which averages the two middle values of an even-length array; with three identical placeholders scoring 5 the median is **5 for every possible P1** — verified by execution across P1∈{1,2,3,4,5}, all returning `PASS avg 5.00`. So a corpus with one real prompt and three stubs yields **PASS regardless of what the real prompt scores**, including 1 ("outputs are from different agents"). **Live today:** 8 recording files sit in `_bmad-output/pf1-baselines/` + `pf1-post-migration/` in exactly this state; anyone with `ANTHROPIC_API_KEY` can run the battery and obtain a fabricated PASS on the **M9 release-blocking gate**. **Fix:** reject known placeholder bodies in `parseRecording` (exit 5, same as the empty guard); and make `computeGate`/`medianOf` refuse or flag a corpus where prompts are not independently sourced. **Note this touches Story 4.2's `done`, R1+R2-converged code** — needs a story, not a patch.

---

## I140

**Lane:** Fast Lane · **Score:** 6.8 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-15

**Receipt:** `convoke-update` discarded user config comments on merge; the merge path now mutates a comment-preserving document

✅ **DONE 2026-08-15.** The merge path now mutates a comment-preserving `YAML.parseDocument` in place instead of reserialising from a plain object — same convention `refresh-installation.js` already uses for every other config write (js-yaml to read, the `yaml` package to write). **Verified by execution, both halves of the measurement this row insisted on:** a steady-state merge still writes nothing at all (`merged:false`, file byte-identical), and a merge that DOES write — forced by adding a platform default, the way a release does — now keeps the leading comment, an inline comment, the operator's custom initiative, and does not duplicate the managed header. The promotion path (FR42) still removes a promoted user ID, retains the others, and appends its promotion comment. Corrupt-YAML input still falls back to a full reserialise, which is correct: there are no comments to preserve and the content is being replaced wholesale. Two regression tests added to `tests/unit/taxonomy-merger.test.js`, mutation-verified (reverting the merge path to `yaml.dump` turns the second one red). **Note the shared-state hazard the test had to handle:** forcing a write means pushing to the module's exported `DEFAULT_ARTIFACT_TYPES`, so the test pops it in a `finally` — leaking it would silently change what sibling tests assert. Original row: **`mergeTaxonomy` writes with plain `yaml.dump`, discarding operator comments in `taxonomy.yaml` — and I137 widened when that fires.** Found 2026-08-14 by R1 review of I137. Every other config-write site in `refresh-installation.js` uses the comment-preserving `YAML.parseDocument()`/`.toString()` pattern (see the `I29`/`ag-7-1` notes); `taxonomy-merger.js:123` does not — it emits `TAXONOMY_HEADER + yaml.dump(existing)`, so any comment an operator added is gone. **Measured, because the review's framing was too strong.** It does NOT fire on every refresh: the write is guarded by `if (merged \|\| promoted.length > 0)`, so a steady-state refresh writes nothing. Verified by execution — run 2 (no default changes) `merged:false`, comment survives; run 3 (simulating a release that adds one `DEFAULT_ARTIFACT_TYPES` entry) `merged:true`, comment lost. **What I137 changed:** before, `mergeTaxonomy` was reachable only from the 2.0.x→3.1.0 and 3.0.x→3.1.0 migrations — twice, historically. Now it runs at the end of every `refreshInstallation()`, so the comment-loss fires on the first refresh after ANY release that adds a platform initiative, artifact type, or alias. That is rare but recurring, and the file explicitly invites operator edits (`user: Operator-managed. Add custom initiative IDs here`), which is exactly the content most likely to carry an explanatory comment. **Fix:** port the write path to comment-preserving YAML, matching the sibling sites. Not done with I137 — it is a pre-existing defect in a different module, needs its own round-trip test, and the guarded write keeps the exposure bounded.

---

## I127

**Lane:** Fast Lane · **Score:** 6.4 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-14

**Receipt:** Path traversal in artifact resolution — fixed via `path.resolve` containment check, hardened the following day

✅ **DONE 2026-08-13, hardened 2026-08-14.** Fixed via `path.resolve` + `--literal-pathspecs` (5 call sites), then R2/R3 review closed three further fail-OPEN doors in the same guard: a `safe.directory`/"dubious ownership" refusal was being read as "not a repo" (disabling the guard entirely in containers and CI), `assume-unchanged`/`skip-worktree` hid real edits, and the outer catch answered "safe" to a question it failed to evaluate. Non-git projects remain supported — that fail-open is now established positively via a `.git` ancestor walk rather than by treating every git failure as clean. 15 mutation-verified tests in `tests/team-factory/registry-writer-dirty-tree.test.js`. Original row: **`checkDirtyTree` reports a dirty registry as clean when given a relative path — the write guard is skipped.** Found 2026-08-11 (Edge Case Hunter). `registry-writer.js` sets `cwd = path.dirname(registryPath)` and then passes the *unresolved* `registryPath` as the git pathspec, so git looks for `<dirname>/<full-relative-path>`, which does not exist. Verified: with the file genuinely modified, the relative form exits 0 with empty output while the absolute form correctly prints it. Consequence: `{dirty:false}` → the uncommitted-changes guard at `:64-67` is skipped → **a registry carrying uncommitted user edits is overwritten**. **Pre-existing** — the original `execSync` had the identical defect; the 2026-08-11 hardening preserved behaviour exactly (independently confirmed by a 6-case parity matrix) and therefore preserved this too. Not fixed in that change because it is a behavioural fix, not a security fix, and the diff's stated contract was equivalence. **Fix:** `path.resolve(registryPath)` before building the pathspec (mirroring what `runNodeRequire` already does), plus `--literal-pathspecs` so `*`/`?`/leading-`:` in a path cannot re-interpret the pathspec. Affects `checkDirtyTree`'s other callers too (`csv-appender.js:39`, `config-appender.js:33,124`, `registry-appender.js:74`).

---

## I131

**Lane:** Fast Lane · **Score:** 3.8 · **Portfolio:** convoke · **Status:** ✅ Closed 2026-08-14 as `superseded-by-ADR-001`

**Receipt:** PF1 gate quantification retracted — the 2026-08-13 figure was invalid, and the gate itself was retired by ADR-001

🛑 **RETRACTED 2026-08-14 — the 2026-08-13 quantification was INVALID. Close as `superseded-by-ADR-001` (a scope decision), NOT as "measured and found not to work" (a factual claim the evidence does not support).** Adversarial review demolished the analysis on six independent counts; the retraction is recorded rather than the row silently rewritten. **(1) The control was contaminated — the fatal error.** `stack-detective`'s *source* is byte-identical across the commits, but `pf1-record-agent.js` records via `claude -p /<skill>`, which loads the **generated wrapper** at `.claude/skills/<agent>/SKILL.md` — gitignored (`.gitignore:62`), produced by `refresh-installation.js`, and **outside every diff that was run**. That generator changed between the commits (`FOLLOW every step in the <activation> section precisely` → `FOLLOW the activation steps precisely`), so the control carries a real migration-caused instruction delta. **0.352 was never a noise floor**; it is noise + unmeasured effect, and the bias runs toward the conclusion that was reached. Root cause: the claim was about *what the agent executed*; verification was done on *what the repo tracked* — the same `.claude/skills` gitignore trap that cost a day on 2026-08-10, in the same directory. See [[feedback_verification_basis]]. **(2) The "orders agents backwards" claim is a metric artifact** — it reverses under normalised edit distance and stopword-retained Jaccard, and ties (0.003) under overlap coefficient; only the one metric chosen shows it. **(3) It is separately a verbosity artifact** — `hypothesis-engineer` is the only agent whose output grew (99→120 unique words, 1.43× chars, a new "I specialize in" block), and set Jaccard divides by the union, mechanically penalising unilateral additions. **(4) The noise floor was n=1 generalised to a constant** across agents of visibly different variance; the control is the shortest, most templated greeting in the set, a priori the lowest-variance member. Per-agent variance was never measured for anyone. **(5) n=1 was a choice, not a constraint — five byte-identical agents were on disk** (`model-curator`, `readiness-analyst`, `review-coach`, `stack-detective`, `team-factory`); four went unused. **(6) The 160/320 cost projection priced the wrong experiment** — a noise floor is a within-phase property needing only controls, only Prompt 1 (the one prompt already scripted): **5 controls × 1 prompt × 1 phase × N=5 = 25 scripted captures, ~half a day of machine time**, not days of manual operator work. That projection was the core of the "prohibitively expensive" argument. **Also: the instrument DID track the input where the input was visible** — the corpus's largest divergence (`lean-experiments-specialist`, top-ranked on every metric computed) is the `Configuration loaded successfully…` preamble the migration deleted with the XML `<activation>` block. Deterministic and attributable; it was counted as noise. **ADR-001 is unaffected and stands** — it rests on the control diverging *at all* (qualitative, survives everything above), the artifact being transparent markdown, and a deterministic alternative with tripled coverage; review independently corroborated it (**menu-code divergence 0.000 across all four agents**). The error was using ADR-001's soundness to carry I131's arithmetic. **If the real answer is ever wanted:** run the 25-capture control study over the five byte-identical agents first, and pin the model/temperature — `pf1-record-agent.js` passes no `--model` and no seed, so nothing recorded so far has a controlled generator. **No document should repeat the 0.41 effect/noise figure.**

⚠️ **DUPLICATE ROW — SUPERSEDED by the retraction row directly above (also I131). Read that one; this row is kept only so the original wording stays legible.** Corrected 2026-08-14 after review found this row still asserting, unretracted and unmarked, the claim the row above retracts. **PF1 methodology gap: one capture per phase means agent nondeterminism is confounded with migration effect — the corpus cannot support any equivalence claim.** Found 2026-08-13; this is the finding that withdrew the Story 4.3 release record. ~~**Evidence:** the Path B+ control agent `stack-detective` has **byte-identical source** across the two recorded commits — `git diff 90bf3115 e8676ffe -- '*stack-detective*'` returns empty — yet its baseline and post-migration recordings differ substantially. The migration did not touch that agent, so those differences are **agent run-to-run variance**.~~ **← STRUCK 2026-08-14: the control was contaminated. `pf1-record-agent.js` loads the generated, gitignored `.claude/skills/<agent>/SKILL.md`, whose generator (`refresh-installation.js`) changed between those commits at 3 sites. Byte-identical *tracked source* is not *no change*. The divergence is not attributable to run-to-run variance.** What survives without that evidence: the protocol captures each prompt once per phase, so no noise floor exists and no difference is interpretable — a design fact readable in `pf1-record-agent.js`, independent of any recording. `RUNS_PER_AGENT = 3` controls *judge* variance, not *agent* variance — nothing in the protocol repeats a capture. **Consequence:** every baseline↔post difference is unattributable, in both directions; completing Prompts 2-4 (~6 hr) would produce *more* unattributable differences, not evidence. ~~**The control did its job and nobody read it** — Decision 4's Path B+ re-scope introduced `stack-detective` precisely as a control and its signal went unexamined for 10 weeks.~~ **← STRUCK 2026-08-14: the control did NOT do its job; it was contaminated before it ever ran.** **Fix:** amend the recording protocol to capture each prompt N times per phase and treat within-phase variance as the noise floor against which cross-phase difference is judged; or replace LLM-judged equivalence with a deterministic surface (menu codes, capability lists, activation-step presence) where a diff means something. **Blocks any meaningful M9 verdict** — I130 is a correctness fix, this is the one that decides whether PF1 can measure anything at all.

---

## I96

**Lane:** Fast Lane · **Score:** 3.2 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-18

**Receipt:** Sprint 0 anti-pattern registry consultation checklist for future Convoke major releases

✅ **DONE 2026-08-18.** **Sprint 0 anti-pattern registry consultation checklist for future Convoke major releases** — codify L1 hypothesis mitigation per PRD `convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md:64,100`: registry must be consulted at the *start* of future releases, not just updated at the end. Falsification clause L64 ("registry exists but is never consulted") is currently load-bearing on operator memory. Concrete deliverable: add a Sprint 0 checklist line item to the `host_framework_sync` playbook (`docs/host-framework-sync-playbook.md` — Story 5A.2 outline) requiring v4.x + v6.4 release planners to (a) read `_bmad-output/planning-artifacts/convoke-anti-patterns.md` end-to-end at sprint kickoff, (b) cite applicable entries in the new release's planning artifacts (PRD shards or sprint plan), (c) note recurrence inline in registry entries when an anti-pattern reappears (per registry §"Recurrence tracking"). Closes the L1 falsification surface from "operator must remember" to "checklist enforces." Triggered by Story 5B.2 retrospective hypothesis observation: L1 is the only PRD hypothesis with no PRD-cited observation-window (CM-1 V-pass note) — registry artifact ships now; consultation discipline must ship before next major to avoid first-release-only inertia. **Delivered** as the "Sprint 0 consultation checklist (I96, mandatory)" subsection of `docs/host-framework-sync-playbook.md` §(e), shipped with Story 5B.3 and signed off by Winston on 2026-08-16. Four checkboxes: read the registry end to end, cite applicable entries by ID in the Sprint 0 notes, record recurrences inline in the entry (a second occurrence means the counter-pattern is wrong, not that someone was careless), and record that consultation happened. The falsification clause the row was written against — "registry exists but is never consulted" — now rests on a checklist rather than on operator memory.

---

## A47

**Lane:** Fast Lane · **Score:** 12.0 · **Portfolio:** convoke · **Status:** ✅ Done 2026-05-25 (row corrected 2026-08-14)

**Receipt:** `verification-pipefail` rule added to `project-context.md` — pipes in verification commands must capture the upstream exit code

✅ **DONE — shipped 2026-05-25 in `ci-hygiene-1-1`.** Verified 2026-08-14: the `verification-pipefail` rule is present in `project-context.md`. Row was never flipped, so this sat at the TOP of the Fast Lane by RICE (12.0) for ~3 months as already-completed work. Original row: **AC-RETRO-1 `verification-pipefail` rule into `project-context.md`** — codify the AC-RETRO-1 forward-prevention from session-retro-2026-05-05-cov-and-i97-bug.md: "Story Task verification commands using shell pipes MUST use `set -o pipefail` or `${PIPESTATUS[0]}`; `cmd \| head/tail/grep ; echo $?` is forbidden because it captures the rightmost command's exit code." Cite 2026-05-05 retro as scar-story. **ID note:** A46 was already allocated to §A41-2 scope-clarification (shipped 2026-04-26, §2.5 Absorbed) before this triage was run; renumbered to A47 to avoid collision.

---

## I103

**Lane:** Fast Lane · **Score:** 10.8 · **Portfolio:** convoke · **Status:** ✅ Done 2026-05-25 (row corrected 2026-08-14)

**Receipt:** `defaults.run.shell: bash -eo pipefail {0}` set on `ci.yml` so every `run:` step inherits pipefail

✅ **DONE — shipped 2026-05-25 in `ci-hygiene-1-1`.** Verified 2026-08-14: `.github/workflows/ci.yml:16` has `shell: bash -eo pipefail {0}` at `defaults.run`. Original row: **`defaults.run.shell: bash -eo pipefail {0}` on `ci.yml`** — one-line workflow hardening; GitHub Actions default `bash` has `-e` but not `-o pipefail`. Eliminates an entire false-positive class for any future piped step. Sibling to A47 (codifies same lesson at workflow level).

---

## I104

**Lane:** Fast Lane · **Score:** 10.8 · **Portfolio:** convoke · **Status:** ✅ Done 2026-05-25 (row corrected 2026-08-14)

**Receipt:** `npm run lint` gated at `--max-warnings 0` so warnings cannot accumulate silently

✅ **DONE — shipped 2026-05-25 in `ci-hygiene-1-1`.** Verified 2026-08-14: `package.json` lint script is `eslint --max-warnings 0 scripts/ index.js tests/`. Original row: **CI lint `--max-warnings 0`** — `package.json:48` currently runs `eslint scripts/ index.js tests/` without `--max-warnings 0`; `no-unused-vars` configured as `warn` slides through green. Closes rule↔gate disagreement with `project-context.md` `lint-passes-before-review` rule. One-flag edit.

---

## D16

**Lane:** Fast Lane · **Score:** 6.0 · **Portfolio:** convoke · **Status:** ✅ Done 2026-05-25 (row closed 2026-08-14)

**Receipt:** Migration guide tense and PF1 references corrected at Epic 4 ship

✅ **DONE — delivered 2026-05-25, row closed 2026-08-14.** The deliverable IS the decision artifact, and it exists: 196 lines, tracked in git, frontmatter `status: recorded` / `signoff_by: amalik` / `decision: option-f`, and all five claimed contents verified present (Option F decision + rationale, BMAD upstream impact analysis, marketplace landscape spike, PR #9 status correction, v4.1 catch-up scope outline). The row was never flipped, so it sat at **#2 in the Fast Lane by RICE (6.0)** for ~3 months as already-completed work. **Fourth instance today** of a shipped item left marked open — after A47, I103 and I104, all closed 2026-08-14 after the same kind of check. See I150: the lane's top is not trustworthy without verifying status against source. Original row: **v6.3 re-sequencing + v4.1 catch-up decision artifact** — **AUTHORED 2026-05-25** at [convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25.md](convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25.md). Scope expanded mid-author per BMAD upstream impact spike (operator request): not just PF1 sequencing but full Option F decision (ship v4.0 on v6.3 as planned + commit to v4.1 catch-up Initiative for v6.4-v6.7 absorption). Doc embeds: F decision + rationale, BMAD upstream impact analysis (v6.4 → Web Bundles v1.0.0), marketplace landscape spike findings, PR #9 status correction (closed 2026-04-27), v4.1 catch-up scope outline (6 epics, draft). Status: recorded; signoff_by: amalik. **Next action:** add Initiative Lane row for v4.1 catch-up.

---

## I123

**Lane:** Fast Lane · **Score:** 1.7 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-14

**Receipt:** 12 of 15 portability suites silently SKIPped in CI; converted so they run

✅ **DONE 2026-08-14.** Convert the 14 portability/export suites to fixtures — un-quarantine 10 skipped suites and restore `scripts/portability/**` to the coverage gate.** Opened 2026-08-10. **Current state: 12 of 15 portability suites SKIP in CI** (re-verified 2026-08-14; the row originally said 10) behind the shared precondition guard `tests/lib/portability-preconditions.js::vendoredContentSkipReason()`, and `scripts/portability/**` is **excluded from `.c8rc.json`** so the 88% functions threshold stays intact for actively-tested code. **Root cause:** BMAD Update `a16fa340` (2026-06-27) deleted Convoke's vendored copy of upstream BMAD skill content — **1,162 files, 78 `SKILL.md`; tracked skill content 113 → **35 as of 2026-08-14**, down from the 44 recorded when this row was opened — the gap is still widening** (`_bmad/wds` 566, `_bmad/tea` 245, `_bmad/bmm` 228, `_bmad/bmb` 51, `_bmad/core` 37, `_bmad/cis` 34). The exporter reads skill content from the `path` column, and **75/106** of those paths now have no tracked content (re-verified 2026-08-14 from the guard's own output; the row originally said 75/105) — the material exists only in gitignored `.claude/skills/`. **Why fixtures, not re-vendoring:** all 14 suites call `findProjectRoot()` and assert against live repo state, which `project-context.md`'s `test-fixture-isolation` rule forbids outright ("Exception: None"). Re-vendoring would restore green but re-arm the identical failure on the next BMAD update — the convention-vs-structure trap. **Scope:** build a fixture skill tree; thread `projectRoot`/`cwd` through the 14 suites; delete the precondition guard and the `.c8rc.json` exclusion; confirm functions coverage returns ≥ 88% *without* threshold changes. **Trap to avoid (documented in the guard):** do NOT repoint manifest paths at `.claude/skills/...` — gitignored, produces a false green that passes locally and fails CI (this exact error was made and caught on 2026-08-10). **STALENESS PREFLIGHT 2026-08-14:** root cause and approach re-confirmed valid; only the numbers had drifted. Two additions from the preflight. (1) **The skip is invisible in the test counts.** A guarded suite reports `tests 0`, not `skipped N` — `npm test` prints `1498 pass / 2 skipped`, and those 2 are unrelated. The 12 dark suites are announced on stderr (`[portability] SUITE DISABLED:`) but contribute nothing to the totals, so the headline numbers read as full coverage. Any fix should also make the quarantine visible in the counts. (2) **Scope is 15 files / ~2,450 lines**, each with 2-3 `findProjectRoot()` couplings — this is a fixture-tree build plus a mechanical thread-through, not a quick win. The R:6/E:5 scoring is right; it should not be picked up as filler work. **CLOSED — evidence, all by execution.** Fixture at `tests/fixtures/portability-project/` (31 skills, 262 files, 2.5 MB) + `tests/lib/portability-fixture.js` exposing `FIXTURE_ROOT` (data) and `REPO_ROOT` (scripts under test) — conflating those two was the main trap. **Fidelity proven:** `exportSkill('bmad-brainstorming', FIXTURE_ROOT)` is **byte-identical** to the live-repo export (60,790 chars); `validate(FIXTURE_ROOT)` reports **0 hard findings**. Guard `tests/lib/portability-preconditions.js` **deleted**; `scripts/portability/**` **removed from `.c8rc.json`** with thresholds untouched (functions 88 / lines 83 / branches 80). **`npm run test:coverage` exits 0** at functions **90.53%**, lines 88.1%, branches 81.27% — portability code now genuinely covered (`export-engine.js` 94.8% stmts / 100% fn, `convoke-export.js` 89.6%, `manifest-csv.js` 97.3%). Unit suite **1500 → 1566 tests** (+66, matching the 12 dark suites exactly); zero `SUITE DISABLED` warnings remain. **Found and fixed a live bug in a SHIPPED bin (see I135):** `convoke-export` resolved its README template from the *user's* project root, so it failed in every user project — invisible precisely because these suites were dark and the file was outside the coverage gate. **Two suites failed against the first fixture draft; both were fixture gaps, not bad tests, and were fixed by extending the fixture rather than relaxing assertions.** The ratchet in `portability-coverage-exclusion.test.js` was rewritten one-way: the exclusion must not return, and lowering the thresholds instead now fails too.

---

## D15

**Lane:** Fast Lane · **Score:** 2.4 · **Portfolio:** convoke · **Status:** **Rescoped — superseded by I122**

**Receipt:** Author v63-1B story specs — rescoped 2026-08-09 when 3 of 4 ACs proved already satisfied; residual superseded by I122

**~~Author v63-1B-{1,2,3} story specs~~ → RESCOPED 2026-08-09: 3 of 4 ACs already satisfied by upstream absorption; residual = one manifest cleanup.** Mechanical verification 2026-08-09 (during the M2 decoupling spike) found Epic 1B largely self-resolved: **1B.1 removal ✓** — `bmad-agent-qa`/`-sm`/`-quick-flow-solo-dev` absent from *both* `_bmad/bmm/` and `.claude/skills/`; **1B.2 ✓** — Amelia integrated at `.claude/skills/bmad-agent-dev/` (`name = "Amelia"`); **1B.3 ✓** — `grep -rnwE "Bob\|Quinn\|Barry" _bmad/bme/` returns **0 matches**. **Outstanding: 1B.1's manifest half only** — `_bmad/_config/agent-manifest.csv` still carries 3 stale rows (Quinn, Bob, Barry) while `skill-manifest.csv` and `files-manifest.csv` are already clean. That residue is folded into **I122** (broader `agent-manifest.csv` rot: dead paths + duplicate rows), which supersedes this row's remaining scope. **Do not author 3 story specs** — the ~30-60 min × 3 estimate is obsolete.

---

## D14

**Lane:** Fast Lane · **Score:** 2.1 · **Portfolio:** convoke · **Status:** ✅ Closed 2026-08-13 as `superseded-by-ADR-001`

**Receipt:** v63-4-3 PF1 resumption checklist — the M9 PF1 gate it served was retired by ADR-001, so the checklist was never needed

**v63-4-3 PF1 resumption checklist / state-snapshot** — **AUTHORED 2026-05-26** at [v63-4-3-resumption-snapshot.md](../implementation-artifacts/v63-4-3-resumption-snapshot.md). Probes revealed: Tasks 1+2 shipped 2026-04-28 (spike result + recording protocol, D2-A path locked); Tasks 3-8 pending; `scripts/audit/pf1-record-agent.js` not yet authored. Realistic resumption window: ~2.5-3 hours focused session. ANTHROPIC_API_KEY verified set 2026-05-26 by operator. Story `v63-4-3` status remains `in-progress` (accurate — Tasks 1+2 done is genuine partial execution, not drift). Resumption gated only on operator session-time allocation.

---

## I40

**Lane:** Fast Lane · **Score:** 0.7 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-15

**Receipt:** `loadSkillManifest` silently dropped rows on duplicate keys; last-writer-wins kept deliberately, now documented and asserted

✅ **DONE 2026-08-15.** `loadSkillManifest` (`scripts/convoke-doctor.js`) keys a Map by source path, so two rows claiming the same path overwrote with no signal — the manifest could be ambiguous and the operator never learn. Now warns, naming the path and both canonicalIds (`shared/path/SKILL.md (skill-a → skill-b)`). **Last-writer-wins is preserved deliberately:** the row's complaint is the SILENCE, not the precedence, and changing which row wins would be an unevidenced behaviour change to shipped diagnostics. **Latent, not live:** verified the shipped manifest has 106 rows and 106 distinct paths. But demonstrably reachable — the I139 manifest-seeding bug (fixed 2026-08-14) produced exactly this shape, two rows sharing `_bmad/bme/_enhance/workflows/initiatives-backlog/SKILL.md`, which is what made this worth doing rather than closing as theoretical. Three regression tests in `tests/unit/convoke-doctor-skill-wrappers.test.js`, mutation-verified; one asserts the warning does NOT fire when a duplicate path maps to the same canonicalId, since a verbatim repeated row is redundant rather than ambiguous and warning there would be noise. Original row: `loadSkillManifest` Map silently overwrites duplicate paths

---

## I108

**Lane:** Fast Lane · **Score:** 1.4 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-21 — moot; `badges.yml` deleted by story `dist-1-1` (ADR-001)

**Receipt:** `badges.yml` auto-committed to `main` with `[skip ci]`, bypassing every gate — moot once the pipeline was retired

✅ **DONE 2026-08-21 — moot.** **`badges.yml` auto-commit-to-main safety** — `.github/workflows/badges.yml:38-48` auto-commits and pushes `docs/badges.json` to `main` with `[skip ci]`, bypassing every other CI gate. If `scripts/generate-badges-json.js` produces malformed JSON or touches an adjacent file, ships to main untested. ~~Move to PR-validation path (`prepublishOnly` already covers publish-time; this would close the main-push gap).~~ **Moot 2026-08-21:** `badges.yml` is deleted, so there is no auto-commit path left to move, and `prepublishOnly` is gone too.

---
## BUG-14

**Lane:** Bug Lane · **Score:** — · **Portfolio:** convoke · **Status:** ❌ Closed 2026-08-15 (invalid)

**Receipt:** Filed on a wrong premise and closed the same day — 34 of 43 skills failing `exportSkill` was the manifest working as a candidate list, not a defect

❌ **CLOSED 2026-08-15 SAME-DAY — NOT A DEFECT. Filed by me on a wrong premise; kept as a warning because this trap has now caught three attempts.** **The trap:** `skill-manifest.csv` pins upstream paths like `_bmad/bmm/1-analysis/bmad-document-project/SKILL.md`, and 75 of 106 do not resolve in a clean checkout. It looks like rot. It is not. BMAD Update `a16fa340` (2026-06-27) deleted Convoke's vendored copy of upstream skill content — **1,227 files, tracked `SKILL.md` went 122 → 44**. That content now lives only in **gitignored** `.claude/skills/*` (`.gitignore:62`; 100 dirs on disk, 2 tracked). **The fix that suggests itself is wrong and is already documented as wrong.** All 75 rows resolve at `.claude/skills/<canonicalId>/SKILL.md`, so a one-column rewrite looks obvious — it was made on 2026-08-10 11:13 (`4ed770a0`, 85 rows) and reverted at 12:00 (`8f2fbda0`) as part of one coordinated change that also created `tests/lib/portability-preconditions.js`, whose header states it plainly: *"Do NOT 'fix' a failing portability suite by pointing manifest paths at `.claude/skills/...`. Those paths are gitignored; it produces a false green."* Passes on a dev machine with BMAD installed, fails or hollows out in a clean CI checkout. That guard was retired 2026-08-14 (`7a9dc6b8`) only because the suites were converted to fixtures — option (a) of its own stated exit criteria, `tests/fixtures/portability-project/`. **Why the original premise was wrong, point by point:** users never see the repo's `9 success / 34 failed / exit 4` — `refreshInstallation` seeds a manifest **filtered by path existence** (I139, deliberate; the shipped file is a CANDIDATE list); the drop is **not silent** — install prints `Created skill-manifest.csv (15/106 skills present)` (`refresh-installation.js:588`); the `fresh-install` gate is **not blind** — it reads the filtered set and legitimately passes; "83 of 106" was **75** (I split a CSV on commas whose descriptions contain commas — the correct figure was already recorded at `refresh-installation.js:496` citing **I123**); and "stale ~7 weeks unnoticed" ignored the 08-10 fix-and-revert. **Residual, and it is small:** `manifestUsable` (`refresh-installation.js:515`) means the filter runs only when no usable manifest exists, so a BMAD upgrade *after* install leaves a seeded manifest stale with nothing to re-seed or warn. That is a deliberate consequence of the stated "a manifest that parses is USER STATE and is never overwritten" policy, not an oversight — split out as **T36** rather than kept here. **Lesson for the next reader:** the manifest commits are unreadable in isolation. `8f2fbda0` looks like an unexplained revert until you widen to the 12:00:15–12:00:55 burst it belongs to — one logical change spread over **14** single-file commits by the GitHub Desktop workflow. Read the neighbours before concluding.

---

## I156

**Lane:** Fast Lane · **Score:** 2.4 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-15 (row closed 2026-08-25)

**Receipt:** README was a 542-line feature catalogue in build order; rewritten to 176 lines around the lifecycle spine, with `CREDITS.md` and `INSTALLATION.md` split out

**Closed by audit, not by the implementer.** Shipped 2026-08-15 in `docs(I156): rewrite the README around the lifecycle spine` — 530 lines cut from `README.md`, `CREDITS.md` and `INSTALLATION.md` extracted, the row's own spec file amended in the same commit — and the lane row was never flipped. Found 2026-08-25 by the P1+P2 staleness audit, verified against source (README.md is 176 lines, not the 542 the row describes). This is the third recurrence of the pattern that left A47 (12.0), I103 and I104 (10.8) sitting at the top of the Fast Lane for roughly three months as already-shipped work. The audit found it; no gate did.

**README is a feature catalogue in build order, not a description of the product — full rewrite.** Spec ready-for-dev at [fast-readme-rewrite-lifecycle-spine.md](../implementation-artifacts/fast-readme-rewrite-lifecycle-spine.md); 16 pinned decisions from a party-mode roundtable 2026-08-15. **Structure:** 542 lines in which Vortex takes ~110 and Gyre ~60 — the asymmetry encodes build order, not any relationship between the teams, and the operator's framing is that Vortex is one team among several. **Shape agreed:** one lifecycle-jobs spine whose right-hand column *runs out* (shipped rows name a team, unshipped rows name only the job) rather than a today/tomorrow split — two sections would create two places declaring the future, which is exactly how `docs/lifecycle-expansion-vision.md` and `docs/Convoke-Ecosystem-v0.2-Updated-With-Gyre.md` diverged with six colliding names. Uniform team cards; the headline is lifted from the buried footer at `README.md:538`. **Deletions that remove whole rot classes rather than instances:** "What's New in 3.3" and the Roadmap section both name versions (`package.json` is `4.0.0-rc.1`) and the Roadmap hand-types "1,123 tests" — remove them and drift becomes structurally impossible. **`INSTALLATION.md` is already in `files`** and already carries Prerequisites, Options, directory structure, Configuration and Troubleshooting, all of which the README restates; the README defers instead. **Portability is stated once at product level, honestly scoped.** *(Corrected 2026-08-15 by R1 review — this row originally said "no team's **workflows** export today", implying the agent personas did. They do not.* `PERSONA_AGENT_INTENTS` *(`classify-skills.js:87-98`) holds only BMM agents; `skill-manifest.csv` records tier `pipeline` for **all 12** `bmad-agent-bme-*` skills, and exporting one emits "Framework-only skill … cannot run standalone". **Nothing Convoke ships is portable today.** The error came from the party session, not the implementation.)*

---

## T57

**Lane:** Fast Lane · **Score:** 9.5 · **Portfolio:** convoke · **Status:** ✅ Closed 2026-08-25 (invalid — already fixed)

**Receipt:** Review mode's stale column counts — fixed 2026-08-16 by `69c0eba6`, nine days before this row was filed from an un-rechecked intake

**This row should never have existed, and the reason is worth keeping.** IN-187 was filed describing a real defect: `step-r-01-load.md` hardcoded lane column counts of Bug 10 / Fast 9 / Initiative 10 against real tables of 11 / 10 / 11, so Review mode's pre-write validation failed on every run and was always bypassed. Commit `69c0eba6` (2026-08-16) fixed it — both step files now read the counts from `backlog-format-spec.md` §"Table Formats" rather than from a local copy, with the commit noting the copies "went stale when the Dependencies column was added on 2026-04-15 and stayed wrong for months." The intake was never updated.

On 2026-08-24 the backlog cleanup qualified IN-187 into this row **without running check 1 against source**, scored it 9.5, and placed it at the top of the Fast Lane — where it was then twice reported to the operator as the highest-priority open item and as "the gate that would have caught the malformed rows." It had been fixed for over a week.

**The methodological lesson, which generalises.** Check 1 of the staleness pre-flight greps commit history for the row's ID. That check is **structurally blind to any fix that predates the row**: no commit could mention `T57` because `T57` did not exist when the fix landed. A row qualified from an aged intake inherits the intake's staleness and passes every ID-based check. Qualification from an intake older than a few days therefore requires **source verification**, not commit-grep — the same standard the pre-flight demands before *implementing* a row, applied one step earlier, at the moment of filing.

**Review mode's pre-write validation asserts column counts that have never matched the file, so it fails on every run and is always bypassed.** `step-r-01-load.md:86-88` and `step-r-03-update.md:60` assert Bug 10 / Fast 9 / Initiative 10. The real tables — and `backlog-format-spec.md` §Pre-Write Validation #4 — are **11 / 10 / 11**. A gate that fails unconditionally is a gate nobody reads; the operator learns to click past it, which is how malformed rows reach the file. One-line fix per site, but the value is in restoring a signal, not in the edit. Qualified from IN-187.

---

## BUG-13

**Lane:** Bug Lane · **Score:** 5.7 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-25

**Receipt:** `updateLinks` applied every rename entry over the same buffer, so a chained or swapped rename rewrote text a previous entry had just produced — destroying one of the two links

**Fixed by `8f543cdc` — "rewrite each link once, not once per rename entry".** The loop was replaced with a single regex alternation over all old names, so the engine visits each position once and the callback resolves the name it actually matched. The map is a direct old→new mapping, not a chain to follow transitively, and that is now what the code implements.

**Verified by execution at close, not from the commit message** (three isolated fixtures, one temp tree each — an earlier attempt ran them in a shared directory and the first rename contaminated the second, which read as a failure that was not there):

| Case | Input | Pre-fix | Now |
|---|---|---|---|
| chain `{a→b, b→c}` | `[A](a.md) and [B](b.md)` | `[A](c.md) and [B](c.md)` — link to `b.md` destroyed | `[A](b.md) and [B](c.md)` ✓ |
| swap `{a↔b}` | `[A](a.md) [B](b.md)` | `[A](a.md) [B](a.md)` | `[A](b.md) [B](a.md)` ✓ |
| prefixes | `[A](./a.md) [B](../d/b.md)` | double-rewritten by the second pattern | `[A](./x.md) [B](../d/y.md)` ✓ |

The fix also closed a second instance of the same defect one layer down — a direct/`./` pattern and a `../dir/` pattern had run in sequence over the same buffer — and declared a deliberate behaviour change: the rewrite no longer reaches into a `#fragment`, because a fragment is a heading slug, not a file path. Zero links of that shape exist in the corpus. 89 regression tests ship with it in `tests/lib/migration-execution.test.js`.

**Never observed in production.** Renames have so far been one-shot, which is why a defect capable of silent data loss in governed artifact renames sat open from 2026-08-15 to 2026-08-25.

**`updateLinks` corrupts chained and swapped renames — silent data loss in governed artifact renames.** `scripts/lib/artifact-utils.js:1533-1565` applies every map entry sequentially over the same buffer, so an entry can rewrite text a previous entry already produced. Verified by execution during issue #7 R1: chain `{'a.md'→'b.md', 'b.md'→'c.md'}` on `[A](a.md) and [B](b.md)` yields **`[A](c.md) and [B](c.md)`** — entry 1 rewrote `a.md`→`b.md`, entry 2 rewrote that same text again, so both links now point at one file and the link to `b.md` is destroyed. Swap `{'a.md'→'b.md', 'b.md'→'a.md'}` on `[A](a.md) [B](b.md)` yields **`[A](a.md) [B](a.md)`**. `executeInjections` guards only `oldBasename !== newBasename` per entry; nothing checks a new name against another entry's old name. Pre-existing — the loop structure is untouched by issue #7, which only replaced the escape on line 1541 — but the fixed line sits inside this loop, so the next reader will assume it was reviewed. No occurrence in the current corpus (renames have so far been one-shot), which is why it has never surfaced. **Fix:** single pass over a combined alternation, or a pre-check that `new Set(map.values())` is disjoint from `new Set(map.keys())`, refusing the batch if not.

---

## T58

**Lane:** Fast Lane · **Score:** 5.4 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-25

**Receipt:** Nothing asserted the backlog's own table shape; `backlog-integrity.js` now runs four assertions — referential integrity, per-table arity, lane shape, and structure/coverage

**Shipped as `3c605a37`.** Each table's column contract is read from its own header rather than a lane→width map — which is what makes it work where the first attempt was withdrawn at 71 false positives, since §2.5's sub-tables are separate tables rather than one lane of mixed width. `assertStructure` is a floor that does not depend on the parser being correct: before it, the gate printed `PASS — 0 lanes ordered and free of closed rows` and exited 0 on a file whose lanes were never checked.

**Found three real defects in live data while being built:** `IN-80`'s unescaped pipe inside a code span (6 columns in a 5-column table, present since 2026-04-21); a blank line at §2.1 that terminated the Intakes table under GFM, leaving 21 rows rendering as a paragraph; and the author committing the same unescaped-pipe defect in the row written to describe it.

**Review: three rounds, two adversarial layers each, HIGH in every round.** R1: 2 HIGH (silent truncation; a PASS line computed by a different code path than the scan). R2: 6 HIGH across both layers — two of them *inside the R1 remediation*, most sharply a coverage check that computed both sides with the parser's own predicate and therefore could not detect a classification bug by construction. R3 added structural floors on the principle that an imperfect parser is acceptable if its invariants are asserted independently of it. All eight R2 attack vectors verified closed by execution.

**This parser is fenced in, not correct.** If it misbehaves again the honest move is a real markdown dependency — none is installed — not a fourth patch round. Precedent: BUG-10's guard was withdrawn for hand-rolling a lexer in regex.

**Closing note on the close itself.** `3c605a37` changed **zero** lines of this row. The commit shipped the code and left the row `Backlog` at 5.4 — the third instance in one day of a fix landing without its close (the others: `8f543cdc`/BUG-13, and T70(b)), and the second by this author, who had passed a note to a sibling session that same day saying the close is part of the work. Nothing enforces the transition: the gate can check that a row *marked* closed has left its lane, and cannot check whether a row saying `Backlog` describes shipped work. **T55** — the missing `[K] Close/Correct` mode — is the actual fix and remains open at 3.6.

**Nothing asserts the backlog's own table shape, so malformed rows survive until a human sweeps by hand.** Two classes observed: missing columns (`BUG-17`/`BUG-18` written with 10 of the Bug Lane's 11) and foreign-width rows (`BUG-14` carrying 11 columns inside the 5-column §2.5 Completed table — corrected in the 2026-08-24 sweep). `scripts/audit/backlog-integrity.js` runs in CI but asserts only that referenced `BUG-n`/`T-n` rows exist. The naive fix is wrong and was already tried: a per-lane arity check produced 71 false positives because §2.5 has sub-tables of differing width, and was removed before shipping. Needs a **per-table** contract. Extend the same script to cover (a) per-table arity, (b) lane ordering — the check is written and sits unused in `project-context.md` — and (c) the closed-row-in-lane assertion added by the 2026-08-24 spec amendment. Qualified from IN-188. **Sibling (2026-08-25):** **T69** adds a `Filed` date column — the schema change this rule's checks cannot supply. Sequence T58 first so the arity contract is asserted before a column is added to 246 rows, not after.

---

## T69

**Lane:** Fast Lane · **Filed:** 2026-08-25 · **Score:** 2.8 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-25

**Receipt:** Lane rows carried no date, so the staleness rule's own 3-day trigger keyed on a value the file never recorded; an immutable `Filed` column now carries it, backfilled across all 245 live rows

**Shipped as `22357866`.** `Filed` added to §2.2/§2.3/§2.4 with the spec's three column contracts amended in the same edit (11→12, 10→11, 11→12) — the T58 arity gate asserts every row against its own header, so a staged migration would have failed CI mid-way. **245 rows backfilled from 183 commits of file history, 0 unresolvable.**

**Validated rather than assumed.** 100% coverage on a backfill is the shape of a bug, not a success, so it was checked against 11 independently-known filing dates: 11/11 agree, two cross-checked against commit messages that name the filing. An earlier reading — zero rows dating to the file's first commit — looked like the extractor silently matching nothing; it was correct. The file was created 2026-04-12 as a 3-row draft and Pass 2 landed the lane model on 04-15.

**Semantics, documented in the spec:** `Filed` is the date a row entered its *lane*. For the April cohort that is Pass 2's reclassification, not when the item was first raised — earlier history lives in the superseded `convoke-note-initiatives-backlog.md`. Immutable: untouched by rescore, status change or re-sort. A `Touched` column was considered and rejected — it would churn on every edit and answer a question nobody asks.

**Scope addition, declared at the time:** a `Filed` format assertion in `checkLaneShape`. Arity proves the cell exists, not that it holds a date; a blank or free-text cell passed every other check, and a date column nobody can trust is worse than none — the staleness rule would key its trigger on noise. Canaried on live data against a green baseline.

**What it makes visible:** 157 of 245 live rows were filed in April, 16 in May, 2 in June, 70 in August. The cold tail is now legible without a git archaeology run, which is the argument T59 has been waiting on.

**Lane rows carry no date, so "is this stale?" has no mechanical answer — 185 of 246 live rows measured 2026-08-25.** No qualification date, no last-touched date, nothing. Staleness can only be established by reading each row against source, which is what the 2026-08-24/25 audits had to do by hand across 59 rows to find 5 real hits. **Why it matters more than tidiness:** the `staleness-preflight-for-backlog-pickup` rule keys its entire trigger on *"qualified more than 3 calendar days ago"* — a date the file does not record. The rule has therefore never been mechanically enforceable; it fires only when a human remembers it. **Scope:** add a `Filed` column (date the row entered the lane) to §2.2/§2.3/§2.4, backfill from git where the row's introducing commit can be identified and `—` where it cannot — do not guess. `Filed` is immutable; a `Touched` column was considered and rejected as it would churn on every rescore. **This is a schema change across 246 rows, not an assertion**, which is why it is filed separately from T58 rather than bundled into it: T58 adds checks to an existing script, this rewrites every lane table and the format spec's three column contracts, and bundling would misprice both. Sequence after T58 so the new arity contract is asserted before the column is added, not after. **Enables:** a machine-checkable staleness gate, and the 7-day trigger on the rule's new Qualification-time arm.

---


<!-- Aged out 2026-08-25 under T59. These rows are PARKED, not completed: each description is the
     specification needed to reinstate it, preserved verbatim. Reinstating one is a copy-back. -->


## I151

**Lane:** Fast Lane · **Filed:** 2026-08-15 · **Score:** 0.9 · **Portfolio:** enhance · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

*(Renumbered from I80 on 2026-08-14 — a PRE-EXISTING duplicate, undetected until a duplicate-ID check was run during T25 R2 preflight. Two unrelated items shared I80: this one and the `/bmad-register-skill` tracked-artifact gap. That one keeps the ID, having more inbound references. See I150.)* **`_warnings` rename in `loadSkillSource` masks unused-threaded-param bug** — `scripts/portability/export-engine.js:105` declares `loadSkillSource(skillRow, projectRoot, _warnings)`; caller line 1015 passes real `warnings` array expecting population, but function never pushes. `_`-rename satisfies ESLint and makes dead-code permanent. Either populate (surface missing-workflow.md) or remove the parameter from both sides.

---


## D12

**Lane:** Fast Lane · **Filed:** 2026-04-24 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Architecture doc Decision 1 vs Pattern 3 inconsistency** — Decision 1 sample uses `yaml.parse()`; Pattern 3 says `yaml.parseDocument()` for read-write. Sync Decision 1 sample to match Pattern 3 (and any I58 convergence outcome).

---


## T13

**Lane:** Fast Lane · **Filed:** 2026-04-24 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**FR18 + merge + dedup three-way integration test for BMM scanner** — fixture: manual row for `bmad-enhance-initiatives-backlog` + scan emits same (skill, agent) pair + 2 other skills; assert FR18 row pinned first, manual wins dedup.

---


## I1

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

NPM_TOKEN secret for CI publish [rescored 2026-04-19: 1.8→0.9]

---


## T9

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Migration idempotency — zero-ungoverned baseline test — append integration test to `tests/integration/migrate-artifacts-idempotency.test.js` exercising first-run no-op on a fixture with no ungoverned files. Locks the "already-clean project on first run" CLI path.

---


## D3

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

BMAD Core return arrow in diagram

---


## I10

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.9 · **Portfolio:** loom · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Config appender YAML comment preservation (Team Factory)

---


## I15

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`validateManifest` CSV parsing — replace substring matching

---


## I27

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.9 · **Portfolio:** enhance · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Portfolio skill — Option [4] empty-state messaging

---


## I52

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.9 · **Portfolio:** enhance · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Collision resolution flag for migration CLI

---


## I54

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Refactor `DEFAULT_ARTIFACT_TYPES` to single source of truth (migrate-artifacts.js + taxonomy-merger.js + taxonomy.yaml)

---


## U11

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`compareVersions` semver-aware pre-release handling — fix `Number('4-alpha')→0` coercion in `scripts/update/lib/utils.js:27-39`; proper tuple compare + pre-release identifier ordering per semver spec

---


## A11

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Migration scar re-interpretation evidence grounding — locate scar-era retro/logs to anchor Right-to-next-action classification, or soften re-interpretation with evidence-limitation note

---


## I33

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.9 · **Portfolio:** enhance · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Workflow-name namespace collision risk (verbatim names)

---


## I39

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Non-atomic version stamp writes in `refresh-installation.js`

---


## A18

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

A15 OC-R0 format — propagate `(internal)/(external)` qualifier examples into §§3.x and §§8.x evidence-note templates in Compliance Checklist + audit report

---


## I111

**Lane:** Fast Lane · **Filed:** 2026-05-25 · **Score:** 0.9 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Failure-artifact upload narrowing** — `ci.yml:62-66` uploads `tests/` wholesale on failure; the source is already in git and actual test output went to job log via `stdio: 'inherit'` in `scripts/test-runner.js:67`. Pure noise; 14-day retention × matrix(3) × failure rate. Either drop the upload step or narrow to genuine runtime artifacts (coverage report, JUnit XML).

---


## I75

**Lane:** Fast Lane · **Filed:** 2026-04-24 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Duplicate manual rows for same (skill, agent) pair silently preserved in BMM scanner** — add `manualPairSeen` Set tracking in `mergePreservingManual`; log `[warn] duplicate manual entry ...` and keep first row. Story 2.4 manual-registration workflow should also prevent at authoring time.

---


## I74

**Lane:** Fast Lane · **Filed:** 2026-04-24 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**ISO-8601 timestamp dates silently overwritten in BMM scanner** — `/^\d{4}-\d{2}-\d{2}$/` rejects full ISO timestamps; preserve-step discards date and restamps with today's, no warning. Widen regex OR log `[warn] malformed registered_date dropped: ...`.

---


## I2

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`gh auth` for CI release creation [rescored 2026-04-19: 2.4→0.8]

---


## T12

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`git-recency-rule` tests drift at UTC midnight — `tests/lib/portfolio-rules.test.js` uses `new Date().toISOString()` as mock return, making `daysSince` math ±1 day flaky across midnight. Fix: swap for a fixed `staleDays - 1` ago date in 2 test cases.

---


## A1

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** vortex · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Add validate menu items to Wave 3 Vortex agents (Mila, Liam, Noah)

---


## A3

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Add `agentic` + `team-of-teams` npm keywords

---


## I6

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`--verbose` flag across all CLI commands

---


## T1

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`convoke-update.js` coverage to 80%+

---


## U2

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Validate migration modules at load time

---


## I17

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** enhance · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`suggestDifferentiator` — support extensions beyond `.md`/`.yaml`

---


## I19

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** enhance · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Share `_scanCorpus` between portfolio engine and migration suggester

---


## I41

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`convoke-doctor` `console.warn` breaks structured-output contract

---


## I56

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Render `taxonomy.initiatives.user` in generated ADR — add a "User initiatives" line to `generateGovernanceADR` so operator-added initiatives appear in the governance artifact

---


## I90

**Lane:** Fast Lane · **Filed:** 2026-04-25 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`refreshInstallation` flat-cleanup runs in dev environment — cleanup loop at `refresh-installation.js:95-105` is OUTSIDE the `isSameRoot` guard; could wipe `<id>.md.bak` files in dev tree. Zero operator risk today. Fix: move inside `!isSameRoot` block.

---


## I119

**Lane:** Fast Lane · **Filed:** 2026-08-09 · **Score:** 0.8 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Mirror new upstream platform targets (hermes-agent, CodeWhale) in the portability exporter.** `scripts/portability/generate-adapters.js` emits copilot + cursor adapters only; v6.9 added hermes-agent and CodeWhale (`.codewhale/skills/` project, `~/.codewhale/skills/` global) as installer targets. **Not a conformance obligation** — upstream's installer target list does not bind Convoke's exporter (Class A). It is a *capability* gap, and it lands on the ~40% Vortex Standalone segment for whom the portability layer is the product rather than a courtesy. Score reflects the narrow slice of that segment actually on these two platforms today — revisit if demand signal appears (MO6-style).

---


## A37

**Lane:** Fast Lane · **Filed:** 2026-04-20 · **Score:** 0.7 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Step-01 `Read`s workflow.md and echoes concepts to operator — A33 ¶4 exempts "re-introduction in step-01" but is silent on the runtime-echo case. Is the echo a re-introduction (exempt) or a fresh Layer 2 introduction (counts toward budget)? Clarify in §2.6.

---


## I35

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.7 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Naive `split('\n')` CSV parsing — CRLF + quoted-newline edges

---


## I44

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.7 · **Portfolio:** gyre · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

No `validateGyreModule` function in validator.js

---


## A17

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.7 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

A10 3-cell gate scaling — add percentage floor or `≥3 OR ≥10% of matrix` rule so large audits aren't under-sampled

---


## A21

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.7 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

A15+A10 N/A-variant disagreement threshold — treat `external-declared` vs `out-of-scope` vs `FAIL` disagreement as reviewer-agreement failure, not just PASS/FAIL match

---


## T24

**Lane:** Fast Lane · **Filed:** 2026-04-25 · **Score:** 0.7 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Test 16 doesn't verify `{project-root}` resolves at activation — verifies wrapper content but not end-to-end activation correctness. Fix: load SKILL.md target + assert minimal structure (e.g., presence of `description` frontmatter).

---


## I98

**Lane:** Fast Lane · **Filed:** 2026-04-29 · **Score:** 0.7 · **Portfolio:** gyre · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Gyre marketplace structural compliance gap** — forward-looking; Gyre's 4 agents are flat `.md` files (not folder-per-agent), no `module.yaml`, no `module-help.csv`. Structurally MORE out-of-shape than Vortex on two axes (manifest absence + flat-vs-folder). Pattern A-equivalent migration needed when Gyre goes to marketplace (per spike's open product question). Tracks the gap so Pattern A learnings (from I97) transfer cleanly when triggered.

---


## I109

**Lane:** Fast Lane · **Filed:** 2026-05-25 · **Score:** 0.7 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**`convoke-agents` self-dep in `package.json:89`** — `dependencies: { "convoke-agents": "^3.2.0" }` is a circular self-reference, likely artifact of the bmad-enhanced → convoke-agents rename. Resolves fine with `npm ci` but footgun: any operator unfamiliar with rename history sees circular self-dep. Either remove (after verifying no consumer code requires it) or add explanatory comment.

---


## I8

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.6 · **Portfolio:** loom · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Team Factory write verification — value correctness

---


## A34

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.6 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

A24 §8.1 Mitigation Gate refinement — 5 bundled sub-issues: (a) "independent reviewer" scope for G2 undefined; (b) G1 doesn't specify A10 cell-composition; (c) G2 subsumption by G1 is conditional; (d) no G5 for §4.2 empathy-map reading-dependent drift; (e) G1's scope is retrofit-only not v2 baseline.

---


## I91

**Lane:** Fast Lane · **Filed:** 2026-04-25 · **Score:** 0.6 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Concurrent `refreshInstallation` race — parallel to Story 2.4 R1-H1; lockfile gap allows two simultaneous installs to corrupt state. Fix path: lockfile around installation phase (sibling to register-skill `_withCsvLock`).

---


## I57

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.5 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Cross-module exclusion-ID validation for `excluded_agents` — `readExcludedAgents` + doctor warn when an ID doesn't match any known agent in any module's registry

---


## U3

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.5 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Robust version detection fallback

---


## I11

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.5 · **Portfolio:** loom · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Registry Fragment Architecture (D-Q6)

---


## I58

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.5 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Unify YAML parser across `scripts/update/lib/`** — pick one of (`yaml` eemeli vs `js-yaml`) and converge: closes the js-yaml/`yaml` library split between `readExcludedAgents` (js-yaml), `mergeConfig` (yaml), and the new config-loader (yaml per audit). Eliminates filesystem/config state drift risk and removes the parser-asymmetry decision surface for future module additions. **Scope expanded 2026-04-23**: original IN-26 surface was `readExcludedAgents` ↔ `mergeConfig`; v63-1a-1 R1 (IN-101) surfaced same convergence question for the new config-loader — merged here.

---


## I13

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.5 · **Portfolio:** loom · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Team Factory Express Mode (pre-filled spec file input)

---


## I37

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.5 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Non-scalar/merge/anchor YAML keys crash `writeConfig` loop

---


## I46

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.5 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Version-stamp post-check absence in refresh

---


## T15

**Lane:** Fast Lane · **Filed:** 2026-04-24 · **Score:** 0.4 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**`console.warn` spy try/catch wrap for failure-isolation in v3-fallback tests** — `beforeEach` throw poisons subsequent test files in same process; wrap setup in try/catch or use `t.mock`. Sibling pattern to T11 `cpMock?.restore()` defensive-chain rollout.

---


## T10

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.4 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

T4 test 4 variant — leave new ungoverned file uncommitted before migration run. Guards against scanner regression that would skip unstaged files; current test over-specifies git state by committing upfront.

---


## T2

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.4 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`convoke-version.js` coverage to 80%+

---


## I12

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.4 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Validator.js hardcoded to Vortex paths (make module-agnostic)

---


## I3

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.4 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

CSV parser library for manifest (replace regex)

---


## I24

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.4 · **Portfolio:** enhance · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Mock git in unit tests instead of bumping timeouts

---


## I47

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.35 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Doctor missing Enhance menu-patch check + parallel coverage consolidation

---


## I61

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.35 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Parser grammar § — formalize `Layers:` evidence-note prefix alongside Compliance Status cell grammar; gives Story 2.2 Loom parser a target

---


## I107

**Lane:** Fast Lane · **Filed:** 2026-05-25 · **Score:** 0.35 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Shared install artifact across CI jobs** — `ci.yml` 7 jobs each do their own `actions/setup-node@v4` + `npm ci` (11 invocations per pipeline run). `cache: 'npm'` helps but coverage/lint/package-check/security each re-resolve ~30s. Tutorial-default shape. Add a `build` job that uploads `node_modules` artifact consumed by downstream jobs.

---


## T5

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.3 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Expand docs audit — tense consistency + prose patterns

---


## I38

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.3 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`mergeConfig` Document mutation not idempotent across writes

---


## I48

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.3 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Agent-manifest.csv doctor check + CSV-parse validator upgrade

---


## A4

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.3 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Fix temp dir prefix inconsistency (`bmad-` vs `convoke-`)

---


## I112

**Lane:** Fast Lane · **Filed:** 2026-05-25 · **Score:** 0.3 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Portfolio engine "unreadable or empty" mis-categorization** — 3 large planning-artifact files (25-45KB) reported as "unreadable or empty" by `explainUnattributed` in [scripts/lib/portfolio/portfolio-engine.js:200-216](../../scripts/lib/portfolio/portfolio-engine.js#L200-L216). Files exist and are readable via `fs.readFileSync`. Bug likely in content-reading path upstream of `explainUnattributed` (passes empty content for some reason). Pre-existing; orthogonal to ci-hygiene-1-1; surfaced during CI red investigation.

---


## I158

**Lane:** Fast Lane · **Filed:** 2026-08-15 · **Score:** 0.3 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Should `covenant`-type artifacts live in `_bmad-output/planning-artifacts/` at all?** Raised 2026-08-15 while scoping I156: the Operator Covenant is normative, required reading per `project-context.md`, and cited by `_bmad/bme/README.md`, `docs/README.md`, `CHANGELOG.md` and `README.md` — yet it sits in a directory whose contract is generated, disposable output. **Not a filing error:** `_bmad/_config/taxonomy.yaml:50-58` defines `covenant` as a first-class artifact *type* and places it there deliberately, authored by `oc-1-4-covenant-authoring`. So the question is whether the taxonomy is right, not whether the file is misplaced. **Blast radius if it moves:** 31 files reference the path, most of them historical planning/implementation artifacts that arguably should NOT be rewritten (frozen records), plus comment-level references at `tests/lib/artifact-utils.test.js:402` and `scripts/migration/format-conversion/covenant-survival-harness.js:42`. **Scored low on purpose** — the likely outcome is "the taxonomy was right and nothing moves", and C:60% carries that. Logged because the observation deserves a record, not because it should be worked. **Explicitly NOT a prerequisite for I156**, which fixes the reader-facing half (the required reading becomes openable from an npm install) without touching governance.

---


## U14

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.25 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Honor `excluded_agents` in dev-mode (`isSameRoot`) skill wrapper generation loops — align with agent-file copy skip behavior

---


## I59

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.25 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Dedup duplicate entries in `excluded_agents` using Set — consistent with `Set`-based dedup on `agents`

---


## I99

**Lane:** Fast Lane · **Filed:** 2026-04-29 · **Score:** 0.25 · **Portfolio:** loom · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Team Factory marketplace structural compliance gap** — forward-looking, speculative. Single agent (`team-factory.md`) is flat `.md` file; no `module.yaml`; has `module-help.csv` but Convoke-variant schema (different columns from BMM canonical). Memory says Loom/Team Factory "out of marketplace, repo-internal only" — marketplace eligibility may never trigger. Tracked as backstop.

---


## A20

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.2 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

A5 retroactive-gap framing — add explicit "rule is prospective" statement to A5, OR add §6 note to v1 audit acknowledging sample-selection predates the rule

---


## T11

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.2 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`cpMock?.restore()` defensive-chain rollout across `afterEach` hooks — prevents secondary-throw in `afterEach` when `beforeEach` fails. Mechanical grep+touch pattern across `tests/lib/*` + `tests/unit/*` test files.

---


## U13

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.2 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Extend `excluded_agents` support to `EXTRA_BME_AGENTS` (team-factory + other standalone bme agents) — add per-submodule exclusion plumbing in `refresh-installation` + doctor

---


## A2

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.2 · **Portfolio:** vortex · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Create `.agent.yaml` source files for Vortex agents

---


## I42

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.2 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`MERGED_DOC_SENTINEL` doesn't survive spread or JSON-serialize

---


## I53

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.2 · **Portfolio:** enhance · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Carry-forward: CRLF writeManifest + basename collision

---


## I55

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.2 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Validate `taxonomy.initiatives.platform` + `artifact_types` non-empty in `readTaxonomy` — reject/warn on all-commented config before rendering degenerate ADR text

---


## D11

**Lane:** Fast Lane · **Filed:** 2026-04-24 · **Score:** 0.15 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**PF1 migration-guide tense revisit at Epic 4 ship** — guide says "Convoke 4.0 validates agent output equivalence as part of release gating" but Epic 4 (PF1 validation battery) unshipped as of 1A.6 ship. Re-read at Epic 4 ship time; if Epic 4 still slipping, tighten to "will validate" or remove the bullet.

---


## A23

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.15 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

A10 misprediction + DISPUTED interaction — add one sentence to A10 covering auditor-predicted PASS → reviewers unanimously FAIL → DISPUTED-via-path-(b) re-run edge

---


## I45

**Lane:** Fast Lane · **Filed:** 2026-04-15 · **Score:** 0.15 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Workflow-manifest CSV registration drift not validated

---


## D10

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.1 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Revisions table hygiene — split multi-patch rows to per-patch rows, or extract round-detail to a `revisions/` folder with pointer from the table

---


## A22

**Lane:** Fast Lane · **Filed:** 2026-04-19 · **Score:** 0.1 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

`(external)/(internal)` OC-R0 tokens vs `external-declared` OC-R6 value — rename to `(owned)/(unowned)` OR document the collision in Parser grammar §

---


## U12

**Lane:** Fast Lane · **Filed:** 2026-04-18 · **Score:** 0.1 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

Inject `excluded_agents` inline comment on pre-U8 config upgrade via `writeConfig` — operators upgrading see the field appear without context

---


## P25

**Lane:** Initiative Lane · **Filed:** 2026-04-21 · **Score:** 0.7 · **Portfolio:** loom · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Team Factory Phase 3 — add-agent + add-skill extension workflows (TF-FR25 + TF-FR26)** — formalizes the trackable reference for P21 Story 2.2's blocker (previously informal "external Phase 3 Loom Add Skill" label). Per `_bmad/bme/_team-factory/workflows/step-00-route.md:42-48`, Phase 3 workflows are "not yet available"; Phase 1+2 (add-team) shipped via P14. Scope: 2 extension workflows + integration wiring + validation (estimated 5-7 stories from loom-epic.md TF-FR25/TF-FR26 definitions).

---


## P8

**Lane:** Initiative Lane · **Filed:** 2026-04-15 · **Score:** 0.5 · **Portfolio:** helm · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Governance & Support skill set**

---


## P58

**Lane:** Initiative Lane · **Filed:** 2026-06-28 · **Score:** 0.5 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Base-layer consolidation** — extract a kernel/base layer (`scripts/lib/`) to end multiple-sources-of-truth: agent roster ×3 (agent-registry/export-engine/classify-skills), install-layout paths ×10+, frontmatter parser bypassed ×15 (two YAML libs in parallel), kernel primitives misplaced in `update/lib/utils.js` (every subsystem reaches *up*), package self-location `../../../` chains. Post-4.0 debt-paydown; prevents the patch-at-call-site bug class (HIGH-1 was one instance). Coordinate with in-flight `frontmatter.js` rollout + v4.1 cadence/`paths.js` overlap (OQ-1). Brief: [convoke-brief-base-layer-consolidation.md](convoke-brief-base-layer-consolidation.md).

---


## P2

**Lane:** Initiative Lane · **Filed:** 2026-04-15 · **Score:** 0.4 · **Portfolio:** convoke · **Status:** Aged out 2026-08-25 (T59, score floor 1.0)

**Parked, not closed.** Below the 1.0 floor at the 2026-08-25 age-out. Full text preserved verbatim so reinstatement is a copy-back into its lane.

**Multi-module collaboration workflows (cross-team handoffs)**

---

## T59

**Lane:** Fast Lane · **Filed:** 2026-08-24 · **Score:** 1.75 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-25

**Receipt:** Cold-tail age-out decided and applied — score floor 1.0, 85 rows parked to §2.5

**The deferral worked as intended, which is the point worth recording.** On 2026-08-24 the operator ruled "no age-out for now, but this is temporary", and this row existed so that the deferral would return as a decision rather than lapse by silence. It returned the next day and was decided on evidence the original deferral did not have: T69's `Filed` column made an age×score grid computable for the first time.

**What the grid showed:** 173 of 244 live rows were 90+ days old, and 81 of the 85 rows below 1.0 were among them. That is why the floor is score-only — adding `AND 90d+` would have moved four fewer rows in exchange for a two-condition rule. The evidence argued for the simpler policy, not the cleverer one.

**Applied:** 85 rows parked (81 Fast, 4 Initiative; scores 0.1–0.9). Live lane rows 244 → 159. Three rows filed within the previous month (I151, I119, I158) moved with them — low score is the criterion, not staleness, and conflating the two would have made the rule harder to apply.

**Parked, not closed.** 15 KB of description preserved verbatim in this archive, verified byte-for-byte, so reinstatement is a copy-back rather than a rewrite.

**Decide the cold-tail age-out policy — deferred 2026-08-24, deliberately temporary.** 85 live Fast Lane rows score below 1.0 and none moved in the nine days the backlog was under observation; they are ~36% of what a reader scrolls past to reach the working set. The 2026-08-24 cleanup proposed an age-out (row below a score floor and untouched for N months moves to §2.5 with an `Aged out` receipt — nothing deleted, reinstatement is one move). **Operator ruling: no age-out for now, but temporary.** This row exists so the deferral returns as a decision rather than lapsing by silence, which is precisely how IN-185 through IN-188 sat unqualified for nine days while their symptoms recurred. Open question is the floor: 0.5 moves ~45 rows, 1.0 moves 85.

---

## T71

**Lane:** Fast Lane · **Filed:** 2026-08-25 · **Score:** 2.8 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-26

**Receipt:** Part 1's 182 duplicated lines replaced by a pointer to `lifecycle-process-spec.md` — file 1,190 → 1,018 lines

**Shipped in two commits: `87a86b72` (the rule) and `0e251551` (the data).**

**Design change from what the row assumed.** The row said "remove Part 1"; the implementation kept the `## Part 1` heading as a pointer stub instead. `step-r-03` and `step-t-04` each assert the anchor exists and forbid modifying it — retaining the heading left all four assertions true and **unchanged**, cutting the blast radius from six files to five and turning Pre-Write Validation #2 from a 182-line snapshot comparison into a two-line check.

**Two corrections came from outside this work, and both improved it.**

*The sequencing was half wrong.* Splitting rule-before-data followed the clause-3 precedent and was right for `backlog-format-spec.md`, which grants *permissions* — a spec permitting a pointer harms nothing before one exists. It was wrong for the `lifecycle-process-spec.md` header, which makes a *claim of fact*: "this file is the only copy." That was false while 182 duplicated lines remained. A concurrent session caught it, reverted it in `95f35813`, and annotated this row. The header was re-applied in `0e251551`, where it became true. **A rule change may land ahead of the data it governs; a claim of fact may not.** Recorded in that header.

*Mechanical replacement left four self-contradicting instructions* — "link to the `lifecycle-process-spec.md` text verbatim", "a pointer to the canonical process verbatim from template", and two more. Each read as a live instruction to do the opposite of the new rule. Found only by printing all 33 `Part 1` references and reading each end to end; one automated sweep missed them, another returned 14 false positives.

**Verified with the T59 three-question check, applied to a section rather than rows:** Part 2 onwards byte-identical and the removed text confirmed still present in the spec source; the 13 surviving `§1.x` references are plain prose, and the pointer names all six sections so the hop is signposted; the "only copy" claim now holds. Gate 716 rows/14 tables → 694/10 — the four were Part 1's documentation tables, now in the spec file where they belong.

**Part 1 is 180 lines of process text duplicated verbatim into the operational file, and removing it is a governed change, not a deletion.** `## Part 1: Lifecycle Process` (§1.1–§1.6) is a byte copy of `lifecycle-process-spec.md`, which the workflow already loads; keeping it in the backlog serves no operational purpose and is ~15% of a file too large for any agent to read in one pass. **Blast radius, measured — an earlier estimate of "minutes" was wrong:** `backlog-format-spec.md` mandates it in four places — §Document Structure lists §1.1–§1.6 as required (`:45`), §68 states Part 1 is semi-static and *"the skill must NOT regenerate or modify"* it, Create mode generates it verbatim (`:324`), and Pre-Write Validation #2 asserts it unchanged against a loaded snapshot (`:347`). Four workflow step files reference it (`workflow.md`, `step-c-01-init`, `step-c-04-generate`, `step-r-03-update`, `step-t-04-update`). So the change is: amend the spec's structure contract, its Create-mode step and its validation list; align the step files; then replace Part 1 in the backlog with a link. Same shape as the 2026-08-24 clause-3 amendment, which took a session. **Sequence after T69** — both restructure the same file, and doing them together doubles the re-verification surface for no gain. **Note:** the T58 gate's `assertStructure` requires only §2.1–§2.5, so it will not block this; the spec and the workflow will. **Unblocked 2026-08-25** — T69 shipped as `22357866`. **The spec header is pre-written and must land WITH the implementation, not before it:** a header declaring the split already done was committed 2026-08-25 in `5152fbea` (swept into an unrelated story commit) while this row was still `Backlog` and the backlog's Part 1 was still 184 duplicated lines. It told readers that editing `lifecycle-process-spec.md` changes the process everywhere — false until this ships. Reverted 2026-08-26; re-apply it as part of the change, not ahead of it.

---

## T54

**Lane:** Fast Lane · **Filed:** 2026-08-24 · **Score:** 8.1 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-26

**Receipt:** manifest generation extracted to `scripts/lib/agent-manifest-generator.js` behind `npm run generate:manifest`; the refresh-side write guarded on `!isSameRoot`. `npm test` no longer rewrites a tracked file.

**Shipped in `7b957dbf`** as story `gen-1-1`, after **four** spec review rounds and one implementation round.

**The row's own plan survived; its verification did not, three times.** The operator's 2026-08-24 decision — extract, then guard, one copy two callers — was implemented exactly as recorded. What kept failing was the *proof*. R1 specified an md5 comparison that **passed on the defective code**. R2 replaced it with `npm run generate:manifest` + `git diff --exit-code`, the same tautology relocated: pointing the generator at a wrong root wrote 13,391 bytes there and left the check at exit 0. R3 replaced *that* with a committed script perturbing the tracked manifest, which inverted the failure — it goes **red on a correct implementation**, because a non-bme sentinel is preserved by design and truncation destroys 41 unrebuildable rows. Round 4 measured all three and restructured rather than patching a fourth time: the check is now a fixture-isolated test perturbing a **`bme` row**, the only perturbation that round-trips.

**Two oracles, and the second one earned itself.** Task 1 required capturing pre-extraction bytes under both schema variants and asserting they differ. That looked like ceremony until the mutation matrix ran: killing schema detection was **invisible** to the v6.1.0 oracle — the committed manifest's header *is* `V610_HEADER`, so overwriting it is a no-op — and caught only by the legacy oracle. A single-oracle check would have certified a broken extraction as byte-identical.

**The guard's discriminator was wrong twice before it was right.** R2 keyed on `findProjectRoot()` + a contains-check; the tarball ships a `_bmad` directory, so a consumer inside `node_modules/convoke-agents/` resolved to the package itself and passed. R3 keyed on `tests/` being absent from the tarball — but *absent from the tarball* is not *present only in this repo*, and a scratch consumer tree holding `_bmad/` and `tests/` was measured **allowing the write**. The shipped entry derives `packageRoot` from `__dirname` and refuses on a `node_modules` path segment, which also removed an unhandled `null` branch that crashed instead of refusing.

**Round 1 found the defect the extraction carried in.** A 0-byte or whitespace-only manifest made `header = ''`, tripping neither limb of the schema predicate, so the legacy branch was silently taken and the file rewritten as a blank header above 10-column rows — after which `readManifest` promotes the first agent row to be the header and an agent disappears. **This exact defect had already been found and fixed for `skill-manifest.csv` at `refresh-installation.js:509-540` ("usable, not merely present"), and lifting the block did not carry the lesson across.** The generalisable point: an extraction inherits the original's bugs, not the sibling's fixes.

**What this close does NOT resolve — see T74.** The pre-change accident, `npm test` rewriting the manifest on every run, was the de-facto gate keeping it in sync with the registry. Removing it was the point of the work, and §4 of the story deferred the replacement deliberately. Round 1 then confirmed the exposure by execution: delete a `bme` row and every gate stays green. Filed as **T74**.

**Original row text, verbatim:**

> **Two unguarded writes to the real tree in `refresh-installation.js` — related to T50 but NOT the same class, and the naive fix would regress.** T50 guarded the Vortex `config.yaml` stamp; these two remain: **(a)** `_bmad/_config/agent-manifest.csv` rewritten unconditionally (`:640` + `:792`), and **(b)** `_bmad/_config/taxonomy.yaml` merged via `mergeTaxonomy(projectRoot)` (`:1122`). Both tracked, both shipped. Neither dirties the tree today — verified 2026-08-24 by running a real dev-tree refresh and comparing md5s: **both unchanged**, so they are genuinely latent. **CORRECTED 2026-08-24 — an earlier version of this row prescribed "wrap both in `!isSameRoot`, the same shape as T50". Do NOT do that.** The Vortex config was *state*, so skipping it in a dev tree cost nothing. These are *generated artifacts*, and `refreshInstallation` is their **only generator**: nothing else writes `agent-manifest.csv` (`validator.js`, `backup-manager.js`, `catalog-generator.js` and `export-engine.js` only read it), and `mergeTaxonomy` is reachable only from refresh plus two historical migrations — the comment at `:1110` records that **I137 wired it into refresh precisely because it was otherwise unreachable**. Guarding them would leave a dev tree unable to regenerate either file, so an agent added to `agent-registry.js` would go silently missing from the manifest: a visible surprise traded for an invisible one, and I137 undone. **The real defect is that `npm test` is the trigger, not that regeneration happens.** Operator chose the fix 2026-08-24: **extract generation into a deliberate path (`npm run generate:manifest`) with `refreshInstallation` as a second caller, then guard the refresh-side writes** — one copy, two callers, same shape that worked for `downgrade-guard.sh`. **Scoped as a story, not Fast Lane work**: ~156 lines with 9 scope dependencies, plus a severity decision about whether CI should gate manifest-vs-registry drift. **RE-SCOPED 2026-08-24 after a two-layer review of the drafted story (~9 HIGH). The row's own analysis was still wrong in three places; corrected here.** (1) **There is ONE unguarded write, not two.** `mergeTaxonomy` short-circuits on a steady-state merge and writes nothing — asserted by `tests/unit/taxonomy-merger.test.js` (*"I140: a steady-state merge does not write"*), confirmed by mtime measurement against a temp replica. The taxonomy half of this row is **withdrawn**: guarding it buys nothing and would cost dev-tree regeneration. (2) **"Only generator" was false for both files.** `bootstrapTaxonomy` (`scripts/migrate-artifacts.js:149`) is a separate implementation shipped as the `convoke-migrate-artifacts` bin, so a deliberate taxonomy path already exists — and the I137 comment cited as evidence literally quotes the doctor saying *"Run convoke-migrate-artifacts or convoke-update to create it"*. The manifest is also written by `migrations/1.0.x-to-1.3.0.js` (a rename transform) and `backup-manager.js`'s restore. The accurate claim is **refresh is the only FROM-REGISTRY generator of the manifest**. (3) **The manifest is not registry-derived.** It reads the existing file, detects schema from its header, preserves non-bme rows, and merges registry rows in — a function of the TARGET TREE's state (`preservedRows`, `:679-687`). **Two constraints any fix must satisfy, found by the review:** `scripts/audit/install-scope-check.js:93` pins `expected: 11` write ops in `refresh-installation.js` and passes at 11 today — extracting the manifest write drops it to 10 and fails a checker that runs in `agent-surface-parity`, which is in `publish.needs`, so a naive extraction **blocks a publish**; and any `generate:manifest` command ships to consumers and must refuse to run outside the package repo. **Story `gen-1-1` drafted and RETURNED TO BACKLOG** with the findings recorded at its head.

---

## T76

**Lane:** Fast Lane · **Filed:** 2026-08-26 · **Score:** 4.5 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-26 (partial — residue filed as T78)

**Receipt:** `validateManifest` rewritten from a raw-substring check to a parse-based one: rows parsed, header recognised, one row asserted per **non-excluded** registry agent, duplicates reported, and Gyre validated for the first time.

**Closed PARTIAL, deliberately, because the row's own headline example still reproduces.** T76 was titled around a manifest "missing 41 of its 53 rows". That shape still returns `passed: true` with no warning, and it always will: those are **upstream** rows (18 bmm, 12 cis, 4 wds, 3 bmb, 2 tea, 2 core) written by BMAD's installer, and Convoke cannot know how many a given project should have. Detecting their loss needs a before/after comparison inside a single refresh, not a validator. Filed as **T78**. Closing this row silently would have been the T70(b) pattern the project memory flags — a fix shipping while the row's own claim goes unchecked.

**Two of the three named assertions became warnings, and that was the right call.** T76 asked to "reject duplicates" and "require a recognised header". Both now **report** instead of failing. The reason is that `validateManifest` runs at `migration-runner.js:146`, where a failed check `throw`s and rolls the update back to the same file — so failing on a state the generator cannot repair wedges the consumer permanently, with the next update reproducing it identically. Requirement changes get recorded, not absorbed into a close.

**The row's reach premise was wrong and is corrected here.** T76 argued *"This is a live publish gate… `try-fresh-install.sh:179` runs `convoke-doctor`, `:354` gates on its exit code, and `fresh-install` is in `publish.needs`."* Measured 2026-08-26: **`convoke-doctor.js` contains zero references to `validator.js`** and never calls `validateManifest`; "Agent manifest" appears 0 times in a full fresh-install log. The only call sites are `migration-runner.js:146` and `:436` — the **`convoke-update` path**. The 4.5 score was priced on a gate this function is not in. That correction also inverts a gen-1-1 Round 1 finding *and* my own correction of it: the reviewer said doctor ran it only in comments, I "corrected" them to say it ran via the script, and both were wrong. Third consecutive error about the same reachability question, each made confidently.

**What the work actually bought, measured:**

| | Before | After |
|---|---|---|
| Rows parsed, or whole-file substring? | substring | parsed |
| Gyre agents validated | **no** — `GYRE_AGENT_IDS` never imported | yes |
| `excluded_agents` honoured | **no** — a legitimate opt-out FAILED and rolled back the update | yes |
| IDs present only in prose | passed | fails |
| Duplicate rows | passed silently | reported |
| Lost header | passed silently | reported |
| Empty file | passed | fails |

The `excluded_agents` line is a shipped bug this fixed incidentally: before, an operator who opted an agent out had their `convoke-update` **rolled back**.

**Three review rounds, and every one found a false-fail that would have wedged consumers.** R1: validator and generator disagreed on which rows are "ours" — the writer owns by module column, the reader counted by path — so rows the writer preserves as foreign counted as duplicates; **7 of 23 historical manifests reproduced it**. R2: the code identified line 0 as not-a-header, warned, then discarded it anyway, throwing away a real agent row and reporting it missing — the same wedge through a different door. R3: `.replace(/"/g,'')` was not normalisation and could only manufacture a header match across a quote boundary. Each fix was mutation-verified; the final state passes all 19 historical manifest blobs through the real update path with 0 failures.

**Original row text, verbatim:**

> **`validateManifest` is the only checker `agent-manifest.csv` has, it runs inside a publish gate, and it passes on every corrupt shape tested — including one missing 41 of its 53 rows.** `scripts/update/lib/validator.js:203-247` asserts one thing: that each Convoke agent ID appears **somewhere in the file as a raw substring** (`manifestContent.includes(id)`, `:223-224`). It never parses a row, never reads the header, never counts, and never looks at any module but its own. **Measured 2026-08-26, five shapes, all PASS:** (a) every non-bme row deleted — 53 rows → 12, losing 18 bmm / 12 cis / 4 wds / 3 bmb / 2 tea / 2 core; (b) every bme row duplicated; (c) header replaced with `<<<<<<< HEAD`; (d) all rows deleted and the IDs left in a single prose line; (e) **all four Gyre agents removed** — `GYRE_AGENT_IDS` is not even imported at `:10`, so Gyre is unvalidated entirely. **This is a live publish gate, not a dormant script.** `try-fresh-install.sh:179` runs `convoke-doctor`, `:354` gates on its exit code, and `fresh-install` is in `publish.needs` (`ci.yml:452`). A gen-1-1 Round 1 reviewer asserted doctor "appears in `ci.yml` only inside comments" — **that is wrong**, and the correction is why this row is scored for reach rather than filed as a curiosity. **Why now:** gen-1-1 removed the accident (`npm test` rewriting the manifest) that used to surface drift, and Round 3 found a candidate fix that deleted 41 rows *while this validator reported pass*. Detection and generation were both blind at once. **Fix:** parse rows rather than substring-match, assert one row per registry agent (`derive-counts-from-source`, not a magic number), reject duplicates, require a recognised header, import and check `GYRE_AGENT_IDS`, and prove each assertion red before trusting it. **Sequencing:** independent of T74 and T75 — this is the detection half, they are the generation half; fixing this first makes both of those falsifiable.

---

## T74

**Lane:** Fast Lane · **Filed:** 2026-08-26 · **Score:** 6.0 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-26

**Receipt:** a CI step in the `agent-surface-parity` job regenerates the manifest and fails on drift. That job is in `publish.needs`, so a registry edit committed without `npm run generate:manifest` now blocks a release.

**Filed and closed the same day, and it replaces something this project deliberately removed.** Until gen-1.1 (`7b957dbf`), every `npm test` run regenerated `agent-manifest.csv`, so a forgotten regeneration surfaced as a dirty tree. That accident was the only thing keeping the file in sync — and removing it was the entire point of gen-1.1. Round 1 of that story confirmed the exposure by execution rather than inference: delete one `bme` row and lint, install-scope-check, docs:audit, backlog-integrity and the full unit suite all stay green.

**The gate covers 12 of the manifest's 53 data rows, and the step is named accordingly.** `generateAgentManifest` reads the existing file for its header and its `preservedRows`, then writes them straight back — so the header and the 41 upstream rows are compared against themselves and can never differ. Measured: strip all 41, commit, run the step → **GREEN**. An earlier draft of the step was named "Agent manifest matches the registry", which overclaimed on the publish critical path. Renamed to "Agent manifest **bme rows** match the registry", with the limit and its reason in the step comment and a pointer to **T78**, which owns the undetectable half.

**Round 1 found four HIGH. The fourth is the scope limit described above; the other three were defects in the step itself, two of them false claims I had written into the comment.**

1. *"gen-1.1's spec rejected this command twice… it ran against a temp target it did not control."* Both halves wrong. It was proposed once (R2) and rejected once (R3), and R2's diff was scoped to the tracked path — the wrong root was the **generator's write target**, not the diff's subject. The real reason this entry is immune is different and now stated: `scripts/generate-manifest.js` derives its target from `path.resolve(__dirname, '..')`, so it can only ever write this repo's own manifest.
2. `git diff --exit-code` compares worktree to **index**, not to HEAD — anything that stages the file makes it pass while real drift sits staged. Changed to `git diff HEAD`, and the hole is now part of the falsification: staged drift exits 1 where the bare form exited 0.
3. Under `defaults.run.shell: bash -eo pipefail`, a failing `npm run generate:manifest` killed the step before the `::error::` could print — defeating the annotation's whole purpose. Both branches now annotate, and the message prints **before** the diff rather than under several KB of quoted persona prose.

**Falsified against the step body extracted from the YAML, not a retyped copy:** clean tree → exit 0; an agent title edited in `agent-registry.js` without regenerating → exit 1 with the annotation; the same drift **staged** → exit 1; restored → exit 0.

**Lane placement was an operator decision.** `convoke-epic-generated-artifact-writes.md` reserved this work as story 1.2 of `gen-epic-1`. The epic had already closed, so honouring that line meant reopening it to carry a three-line CI step. The operator chose to keep T74 in the Fast Lane and amend the epic; both the §Stories line and the §Scope "out of scope" bullet were amended, with the original text preserved in each — the "fix the claim in both places" discipline gen-1.1's AC1b established. Recorded in the gen-epic-1 retrospective, action item 3.

**Original row text, verbatim:**

> **Nothing keeps the tracked `agent-manifest.csv` in sync with the registry now that `npm test` no longer rewrites it.** Before `7b957dbf` (T54 / story `gen-1-1`), every `npm test` run regenerated the manifest, so a registry edit without a regeneration surfaced as a dirty tree. That accident was the de-facto gate; the story removed it deliberately and deferred the replacement in its §4. **Confirmed by execution during the story's Round 1 review, not inferred:** delete one `bme` row from `_bmad/_config/agent-manifest.csv` and `install-scope-check`, `docs:audit`, `backlog-integrity`, the unit suite and `refresh-installation-exclusions` all stay green. `validateManifest()` (`scripts/update/lib/validator.js:203`) would catch it, but runs only via `convoke-doctor`, which appears in `ci.yml` only inside comments. **Bounded blast radius, stated so this is not over-priced:** the manifest is NOT in the npm tarball (0 entries, `npm pack --dry-run`), so a stale copy never reaches a consumer — a consumer's manifest is generated at install. What rots is this repository's tracked copy and its in-repo readers (`scripts/portability/export-engine.js:154`, `tests/unit/team-factory-wiring.test.js`). **Fix is ~3 lines in the `audit` job:** `npm run generate:manifest && git diff --exit-code _bmad/_config/agent-manifest.csv`. Must be shown red before it is trusted (`verification-must-be-falsifiable`) — delete a `bme` row and confirm the job fails naming the file. **Effort scored conservatively at 1** (step + test + falsification) rather than 0.5; if the operator prices it at 0.5 the score is 12.0 and this tops the lane.

---


## T51

**Lane:** Fast Lane · **Score:** 7.65 · **Portfolio:** convoke · **Status:** ✅ Done 2026-08-27

**Receipt:** Three governed artifacts were counted unattributed with reason `unreadable or empty` while reading perfectly. One `try` wrapped both `fs.readFileSync` and `parseFrontmatter`, so a duplicate `status:` key was reported as a filesystem fault.

**Fixed by `9740d61d` (engine) and `08736661` + `78af4f6d` (data).** Read and parse are now caught separately: a parse failure reports `malformed frontmatter: <cause>` and a read failure still reports `unreadable or empty`. Both still skip fallback attribution.

**The row's own diagnosis was wrong, and usefully so.** It suspected "a size cap, an encoding/BOM issue, or a swallowed exception in the reader". The reader was innocent — all three files read at 48/25/24 KB without error. The exception came from `parseFrontmatter` ("Map keys must be unique"). The message was wrong in the direction that hides the cause twice over: it sent the operator to the filesystem, and it concealed a real defect in the data that nothing else reported.

| | Before | After |
|---|---|---|
| governed | 181 | **184** |
| unattributed | 13 | **10** |
| parse/read failures | 3 | **0** |

**Provenance, corrected mid-review.** The close originally asserted the duplicate `status:` was appended by the governance migration. R1 disproved it: all three files carry both keys in their own creation commits (`dc5dcbfe`, `818bc1fb`, `de2057fa`, April 2026), `git log -S"status: draft"` returns only those commits, and `injectFrontmatter` round-trips through parse → merge → stringify and cannot emit a duplicate at all. The producer is recorded as unidentified rather than guessed at a second time.

**Two further defects found by review, both closed here.** The flattened reason string was still unbounded — `.split('\n')[0]` is a no-op for YAML errors carrying no newline, and an unresolved-alias error quotes the offending token verbatim, so a 60 KB anchor produced a 60 KB reason and a 61 KB report; now bounded at 200 characters. And a truthy non-string `err.message` made `.replace` throw a `TypeError` inside the file loop, taking the whole portfolio run down; unreachable today because `parseFrontmatter` always wraps in `new Error(string)`, closed because the fix is one `String()` and the failure mode is total.

**The guard's real scope, stated rather than assumed.** It sits *after* filename inference, so it suppresses only the fallback layers. A parse-failed file whose filename alone yields an initiative is still attributed — `arch-gyre-thing.md` files under gyre while declaring `initiative: helm`. The three T51 files escaped that only because their filenames infer nothing. Moving the guard above inference is a behaviour change beyond this fix and was not made.

**Data half approved with P59 on the table.** P59 is Blocked on "one status axis, or three fields?" and holds that deciding a file's state *is* the migration. Operator approved 2026-08-27 on the distinction that this is a de-duplication rather than a vocabulary choice — both values were already in the file, and `completedAt` plus a fully-terminal `stepsCompleted` say which is real. P59's axis question is untouched and still open.

**Review.** R1 independent: 3 HIGH, all fixed. R2 **self-executed** after four review agents died to environment errors mid-run; its mechanical checks pass (bounding probed across five error shapes, both R1 mutations killed by the new `chmod 000` fixture, comments re-verified against source), but its two open-ended checks — "any new unfalsifiable assertion" and "anything R1 missed entirely" — were not run independently. Recorded so the gap is visible rather than implied.

**Gates at close:** 2586 tests 0 fail, lint 0, docs:audit 0, backlog-integrity 0, install-scope 0, coverage 87.01/82.07/89.65.

---

## T33

**Unescaped interpolation in two `export-engine.js` RegExps.**

**Closed 2026-08-27. Score rescored 7.2 → 1.9 at close.**

**What the row claimed.** Two RegExp constructors in `scripts/portability/export-engine.js` interpolate a
string without escaping it, both under the `u` flag — where an unmatched `{` or `[` is a *syntax error*, not a
literal. Filed 2026-08-15 out of the issue #7 R1 review as a sibling of BUG-12, on the reading that a persona
named `# Emma {V}` would throw and take the whole export down with it. Scored `R=4 I=2 C=90% E=1 → 7.2`, third
in the Fast Lane.

**What was actually true.** Neither site is reachable with a metacharacter, and only one of the two even has
the `u` flag:

- **`extractInlinePersona` (:311/:318).** The `name` it interpolates does not come from arbitrary text. It
  comes from `/^#\s+([A-Z][a-zA-Z]+)\s*$/` — a letters-only capture, anchored at both ends. `# Emma {V}` does
  not match that pattern at all, so `name` is `null` and the interpolating RegExp is never built. There is no
  input to this function that yields a `name` containing a metacharacter.
- **`extractSectionByHeading` (:390/:406).** Flags are `'mi'`, not `'u'`. Outside `u` mode an unmatched brace
  is a literal and throws nothing. And all five callers pass hardcoded string literals — `'Identity'`,
  `'Communication Style'`, `'Principles'`, `'Overview'`. No caller passes a variable.

So the crash the row described cannot happen, on either site, by either mechanism.

**What shipped anyway.** Both sites now wrap their interpolation in `escapeRegExp` from `scripts/lib/sanitize.js`.
Kept rather than dropped because the helper already exists, the change is two lines, and this is the same
defect class as CodeQL alerts 9 and 10 — the value is in removing the trap before some future caller widens
the input, not in fixing a live failure. The honest framing is hardening, not a fix.

**The tests are unusual and worth understanding before editing them.** Because the runtime path is
unreachable, a test that feeds `# Emma {V}` through `extractInlinePersona` passes identically before and after
the fix — it exercises the `name === null` branch, not the escaping. The suite therefore contains two
**source-shape assertions** that read the file and assert `escapeRegExp` wraps the interpolation at each site.
Those two are the only assertions in the file that discriminate pre-fix from post-fix code (verified: 2 failures
against pre-fix, 0 after). It also **pins reachability** (built from the source text, not copied alongside it) — the letters-only capture pattern, and the
literal-only caller list — so that if a later change makes either site reachable, the pins fail and whoever
made it learns that the escaping now carries real weight. Delete the source-shape assertions and the suite
silently stops testing the fix.

**Rescore.** R 4 → 2, I 2 → 1, C 90% → 95%, E 1 (unchanged) → **1.9**. Reach and Impact fall because nothing
is affected today; Confidence *rises* because the behaviour was measured by execution rather than inferred
from reading. This lands just below T34 (2.7), which is the right neighbourhood — T34's hardening items are at
least reachable.

**Pattern.** Third row this week whose severity did not survive contact with the code, after BUG-14 (invalid)
and T51 (real, but a different defect than the row described). All three were filed from review output that
described a *shape* in the source without tracing whether any input could reach it. The Fast Lane's RICE order
is only as good as the premises underneath it, and premises filed from static reading are the ones to distrust.
See the `staleness-preflight-for-backlog-pickup` qualification-time arm — this is exactly the check it exists
to force.

**Review.** R1 independent: four findings, no HIGH, so no R2 under `code-review-convergence`. The finding
worth carrying forward is the one I did not think to check: R1 asked whether `escapeRegExp` could itself
*introduce* a crash at the `u`-flag site, since in `u` mode an identity escape on a non-syntax character
(`\-`, `\/`, `\ `) is a SyntaxError. It cannot — the escaper touches exactly the 14 ECMAScript
SyntaxCharacters and nothing else — but the fix was one careless character in `sanitize.js` away from turning
an unreachable non-bug into a reachable crash on every export. A test now pins `escapeRegExp`'s output as valid
under `u`; `sanitize.test.js` builds without the flag and would not have caught it.

The other three were all in the work's own self-checks, which is the pattern worth noting:
- The `:311` comment still asserted the live crash the investigation had already disproved, and misstated
  parens/brackets as quiet mismatches when under `u` they throw. The one artifact a maintainer reads first was
  the one still carrying the false premise. Rewritten.
- The persona-name reachability pin held a **local copy** of the capture regex instead of reading source, so
  widening the real capture would have left it green — the check shared nothing with the thing it checked.
  Now built from the source text. Mutation-verified: widening the capture to `/^#\s+(.+?)\s*$/` kills it.
- The caller pin's parser only matched a bare identifier as the first argument, so an *added* caller passing an
  expression was invisible while the five literal calls kept the count green. Now asserts parsed-call count
  equals raw-occurrence count, so divergence is the signal. Mutation-verified: a 6th non-literal caller kills it.
One test was dropped as unfalsifiable (`escapeRegExp('Emma')` is a no-op on letters-only input).

**Gates at close:** lint 0, docs:audit 0, backlog-integrity 0, unit 1829 pass / 0 fail, integration 120/120,
p0 642/642. 16 tests in the T33 suite; 2 fail against pre-fix code and 0 after, and both repaired pins were
mutation-verified rather than assumed.

---

## T44

**The FR5 downgrade guard had no override path and no written repair.**

**Closed 2026-08-27 via option (b) — documentation, not code.**

**What shipped.** A new §5 in `docs/npm-publishing-access-playbook.md`, *"The downgrade guard refused
the publish"*, tabulating all five ways `scripts/ci/downgrade-guard.sh` can refuse, what each means, and
the sanctioned repair for each — plus a *Why there is no override* subsection recording the declined
option so the trade can be re-opened rather than re-derived. Every FATAL path in the guard now names its
repair and cites that section. Three regression tests pin it: the citations, the heading it points at,
and a happy-path anchor without which deleting the comparison outright would leave the five refusal
tests passing on the input-validation branches alone.

**The row talked itself out of the right answer, and that is the reusable part.** T44's 2026-08-23
amendment established that `npm dist-tag` routes through `otplease()` and so needs an interactive session
with a live 2FA prompt — a genuinely important finding, correctly reasoned. But it recorded that finding
as *"option (b) now costs an interactive session"*, which reads as a strike against (b). It is not. That
is the cost of **executing** the repair, never of **documenting** it — and "this repair needs a human at
a terminal with 2FA, so budget for that rather than a re-run" is precisely the sentence an operator needs
at 2am. The amendment discovered the most valuable content for the deliverable and filed it as an
objection to the deliverable. ADR-003 `:175-176` had already stated the test the row failed to apply:
*an escape hatch you have written down is a control; an escape hatch you rediscover under pressure is the
status quo.*

**Two of the five FATAL paths were already done.** `dist-1b-1` landed 2026-08-23 — one day after T44 was
filed — extracted the guard out of `ci.yml` into its own script, and added repair text to the empty-latest
and unparseable-latest branches. The row never knew, so it described work that was already 40% complete
and priced it accordingly. The pickup pre-flight is what surfaced this; nothing else would have.

**Option (a) was declined on cost, not on principle, and the argument for it is stronger than the row's.**
T44 offered no reason to prefer (a) beyond generic escape-hatch value. The real argument — found during
implementation and now recorded in the playbook — is that `npm publish` sets `latest` as a side effect, so
an override would let the **already-trusted CI path** perform the repair itself with no 2FA prompt,
whereas (b)'s repair always requires a human. That is a substantially better case for (a) than the row
made. It still loses, because `ci.yml` has no `workflow_dispatch` trigger at all: adding the input means
opening manual dispatch on the workflow that contains the `publish` job, then gating that surface so a
dispatch cannot publish arbitrarily — a permanent new security surface for a rare event that already
requires a human. E=1 was wrong for (a); it was right for (b). The playbook records the trade with a
trigger for revisiting it: *if the guard ever fires twice in one release cycle, the "it is rare" premise
has failed.*

**One measurement error worth recording.** The first behaviour check of the new FATAL text reported
`exit=0` on a path that must exit 1. The guard was fine; the check was `... | sed` followed by `$?`, which
reads **sed's** status, not the guard's. Same family as the `${PIPESTATUS[0]}`-in-zsh trap from 2026-08-25.
A verification that pipes its subject into anything has stopped measuring the subject.

**Gates at close:** guard suite 15/15 (up from 8), all three new pins mutation-verified — stripping the
citation, renaming the playbook heading, and neutering the comparison each kill exactly one test.
docs:audit 0, backlog-integrity 0.

**Addendum 2026-08-27 — R1 ran after the close and found the mutation claim above overstated.**
The entry says "all three new pins mutation-verified", which was true and also insufficient: R1 tested a
fourth mutant the author had not thought to try — **changing the guard's citation from `§5` to `§9`** — and
it **survived all 15 tests**. The suite asserted the playbook *path* in one place and the existence of a
`## 5.` heading in another, and never tied the two together, so the number itself was unpinned. That is
the same defect the entry congratulates the tests for preventing, one level up: this very change
renumbered `## 5. Related` → `## 6. Related`, so the next section insert renumbers §5 too and a guard
still citing §5 would send operators to whatever then occupies the slot, with the suite green. Fixed by
asserting path-and-section as one string; the `§9` mutant now kills four tests.

Two smaller R1 findings, both in text rather than logic. The playbook's table quoted the downgrade
refusal with an **em dash** where the guard emits **two ASCII hyphens** — an operator pasting the
backticked string into an Actions log search would have got zero hits from the one column headed
*"`FATAL:` message begins"*. And the happy-path anchor's comment named the wrong mutant: deleting the
comparison outright does *not* leave the refusal tests green (measured — it fails one), so the anchor's
real value is against a comparison forced always-true, which the five refusal tests structurally cannot
see. The test was right; the reason given for it was wrong. **Second comment-asserting-something-false
finding in one session**, after T33's — both times the prose aged worse than the code it described,
because nothing executes a comment.

R1 also cleared, by measurement rather than argument, the risk the author considered most likely: the
non-ASCII `§` in the guard's citation emits byte-identical stderr under `LC_ALL=C`, `LC_ALL=POSIX` and
`en_US.UTF-8`, no `.gitattributes` re-encodes it, and the file already carried non-ASCII before this
change. No fix needed. Final mutation score **7 of 7**. Gates re-run after the fixes: unit 1836 pass /
0 fail, lint 0, docs:audit 0, guard suite 15/15.
