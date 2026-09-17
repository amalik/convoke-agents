---
baseline_commit: d1194f94510c208855bfdf729d12316c3740dc07
---

# Story fic-2.1: Make the refusal claims true before 4.0.3

Status: review

**Epic:** [fic-epic-2 — make 4.0.3's refusal claims true](../planning-artifacts/convoke-epic-release-truth-4-0-3.md) (one-story mini-epic, `tfr-epic-2` precedent)
**Origin:** a second, independent story-close consumer audit of `fic-1-1`, 2026-09-17 — the clause added in `d954e90a`.
**Namespace decision:** no skill, agent or workflow is added. Changes are prose in shipped files plus one changelog entry and one checklist step. `namespace-decision-for-new-skills` is satisfied because nothing is added.
**Covenant:** no `_bmad/bme/` skill or workflow is authored; nine agent activation blocks have their error advice corrected. No-regression check only.
**Safety analysis (`path-safety-for-destructive-ops`):** not in scope. Nothing here accepts a path or removes anything.

## Story

As **someone updating Convoke whose `config.yaml` I once hand-edited**,
I want **the documentation and the agents' own error messages to describe what the tool actually does**,
so that **I am not sent to a command that refuses, or shown a breaking-change migration plan for an install that is already current**.

## Context

`fic-1-1` shipped a real fix (`BUG-22`) and its production code is sound — the audit confirmed that. What is wrong is what was published about it.

**The mechanism, verified in source.** `version-detector.js::getCurrentVersion` catches a config parse error and falls back to `guessVersionFromFileStructure`, which returns `'1.1.0'` when `workflows/_deprecated/` exists — present on every real install (`install-vortex-agents.js` creates it). So on `convoke-update` with a damaged **Vortex** config the operator gets a 1.1.0 → 4.0.2 breaking-change plan, not the documented refusal. The audit ran it end to end: migrations applied, `1.5.x-to-1.6.0` failed on the same parse error, rollback restored from backup, exit 1. No data lost; the word "refusing" never appears.

**Where the refusal IS real:** `convoke-install` (any damaged config), and `convoke-update` when the damaged config is **Gyre** *and* a refresh is due. The only automated coverage of the refusal (`tests/integration/fresh-install.test.js`) uses the Gyre config, which is why the gap survived four review rounds and one consumer audit.

**Scope boundary — do NOT do these:**

| Thing | Why not |
|---|---|
| `scripts/update/lib/version-detector.js` | Filed as `T180`. Changing version detection on the update path is a behaviour change a held release does not need. This story makes the words match the code |
| `mergeConfig`, `assertConfigReadable`, `writeConfig`, `MODULE_PROFILES` | `fic-1-1`'s production fix; the audit found it sound |
| Publishing 4.0.3 | Operator decision, held 2026-09-16. This story clears the reason for the hold; it does not lift it |

## Acceptance Criteria

**AC#1 — every published refusal claim names the path it holds for, and each is executed.** `INSTALLATION.md` and `UPDATE-GUIDE.md` must not assert a refusal that does not occur. For each claim, record the command and its output for all three paths: `convoke-install` with a damaged config (refuses), `convoke-update` with a damaged Gyre config and a refresh due (refuses), `convoke-update` with a damaged Vortex config (does **not** refuse — a migration plan appears). Say what happens on the third path rather than omitting it, and point at `T180`.

**AC#2 — no shipped surface advises an action that refuses.** The nine activation blocks that say "Please reinstall or contact support" (`grep -rln "Please reinstall or contact support" _bmad/` → 9 files: four `_vortex/agents/*/SKILL.md`, four `_gyre/agents/*.md`, `_team-factory/agents/team-factory.md`) tell the operator what to do for an unreadable config, not to reinstall.

**AC#3 — the seven Vortex user guides branch on present-but-unreadable.** Their "Cannot load config file" section currently offers only "if missing, reinstall". The Gyre guides have no equivalent section — confirm before adding one.

**AC#4 — 4.0.3 cannot ship without a changelog entry.** `CHANGELOG.md` gains a `[4.0.3]` entry naming both operator-visible effects: agents now get a config on a fresh install, and a config that cannot be read now blocks install (and update, on the paths AC#1 names). `docs/pre-tag-release-checklist.md` gains a step that catches a missing entry — today it mentions the changelog **zero** times (`grep -ci changelog docs/pre-tag-release-checklist.md` → 0). **Falsifiable:** with the entry removed, the step must fail.

**AC#5 — the behaviour defect is filed, not fixed.** `T180` covers the `version-detector` fallback. `IN-211`'s recorded evidence is corrected: it states an unparseable Vortex config reaches the `no-version` branch, which cannot happen once `workflows/_deprecated/` exists.

**AC#6 — story-close consumer audit.** Required by `code-review-convergence`: this story changes documented promises in shipped files. One independent whole-repository layer, searching behavioural prose as well as symbols — that is how this story's own origin was found.

## Tasks / Subtasks

- [x] **Task 1 — Establish the three paths by execution (AC: #1)** — install with a damaged config; update with damaged Gyre and a refresh due; update with damaged Vortex. Record each command and its output. Work in a scratch project, never the repo.
- [x] **Task 2 — Correct `INSTALLATION.md` and `UPDATE-GUIDE.md` (AC: #1)** — each claim names its path; the Vortex-under-update case is stated with a pointer to `T180`.
- [x] **Task 3 — Repair the nine activation blocks (AC: #2)** — derive the file list with the grep in AC#2 rather than from this list.
- [x] **Task 4 — Repair the seven Vortex guides (AC: #3)**; confirm the Gyre guides have no equivalent section before touching them.
- [x] **Task 5 — Changelog entry and a checklist step that catches its absence (AC: #4)** — prove the step fails with the entry removed.
- [x] **Task 6 — File `T180`; correct `IN-211`'s evidence (AC: #5)** — lanes stay ordered; `backlog-integrity.js` passes.
- [x] **Task 7 — Consumer audit at close (AC: #6)** — one independent layer; dispositions recorded.

## Dev Notes

### The three paths, and why only one was tested

`tests/integration/fresh-install.test.js` covers the refusal with the **Gyre** config. The Vortex path differs because `getCurrentVersion` reads the Vortex config first and its failure is swallowed. Any test you add for AC#1 should name the path in its title, so the next reader cannot mistake one path's evidence for another's.

### Traps

- **Do not "fix" `version-detector.js` to make the docs true.** That is `T180`, and it is a behaviour change on the update path.
- **`convoke-update` with Vortex already at the package version exits `✓ Already up to date!`** and never notices a damaged Gyre config at all. Say so if AC#1's wording implies otherwise.
- **The four `_vortex` activation blocks live at `agents/<id>/SKILL.md`**; the four `_gyre` ones at `agents/<id>.md`. Derive paths by grep, not by pattern.
- **Never run installers against this repository.** Use a scratch project directory.
- **Another session commits to this tree.** Never `git stash`; snapshot `git status --porcelain` before and after any run that writes.

### Testing standards

`node:test`. Governing rules: `documentation-claims-must-be-derived` (every sentence you write about behaviour must come from an executed command), `external-claims-must-be-executed-or-hedged`, `verification-must-be-falsifiable` (AC#4's checklist step), `test-fixture-isolation`, `verification-pipefail`, `lint-passes-before-review`.

### References

- [convoke-epic-release-truth-4-0-3.md](../planning-artifacts/convoke-epic-release-truth-4-0-3.md)
- [fic-1-1-seed-the-config-every-agent-needs-on-a-fresh-install.md](fic-1-1-seed-the-config-every-agent-needs-on-a-fresh-install.md) — §Consumer Audit, §Release status at close
- [version-detector.js](../../scripts/update/lib/version-detector.js) — `getCurrentVersion`, `guessVersionFromFileStructure`
- [config-merger.js](../../scripts/update/lib/config-merger.js) — `assertConfigReadable` (read only; out of scope)
- [pre-tag-release-checklist.md](../../docs/pre-tag-release-checklist.md)
- [project-context.md](../../project-context.md) — `documentation-claims-must-be-derived`, `code-review-convergence`

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context), via `bmad-dev-story`.

### Debug Log References

### Completion Notes List

**Task 1 — the paths, executed.** In a scratch project (never the repo): install with a damaged config → refuses, exit 1, byte-identical. `convoke-update` with damaged **Gyre** and a refresh due → refuses, exit 1. `convoke-update` with damaged **Vortex** → `Warning: Could not read config.yaml`, plan `From: 1.1.0 / To: 4.0.2`, breaking changes, `1.5.x-to-1.6.0` fails, rollback, exit 1, config byte-identical. Fourth case found while running them: damaged **Gyre** with nothing out of step → `✓ Already up to date!`, exit 0, never noticed.

**Two of the story's own assumptions were wrong, and are corrected here rather than followed.** (a) It said the Gyre guides have no config section, citing four Gyre files — those four are *agent* files, already covered by Task 3; the Gyre guides have no such section at all, so nothing was added there. (b) Six of the seven Vortex guides carry a second "If missing" line belonging to a different section about missing workflow files; only the config block was touched.

**A mistake of mine, caught before review.** The guides first cited `UPDATE-GUIDE.md` by repo-relative path. Those guides are copied into a user's project where that file does not exist — the "reason about the consumer without reading it" trap, inside the story written because of it. Replaced, then removed entirely (see below).

**Task 7 — story-close consumer audit (AC#6): 3 HIGH, 3 MEDIUM, 4 LOW. All three HIGHs were in claims this story authored, and all three were reproduced by me before fixing.**

| Finding | What was false | Fix |
|---|---|---|
| HIGH-1 | "a `config.yaml` that cannot be read is never replaced" — only `_vortex` and `_gyre` are guarded (`refresh-installation.js`). A damaged `_enhance` config: `convoke-install` **exit 0**, zero refusals, file replaced, operator's `user_name` gone | Claims scoped to Vortex and Gyre in UPDATE-GUIDE, CHANGELOG and INSTALLATION; the table gains the unguarded-modules row; **`T181` filed** |
| HIGH-2 | `1.1.0 → 4.0.2` is a version-pinned literal in a document shipped *inside* 4.0.3; the plan's target is `package.json`'s version | Literal removed from both documents |
| HIGH-3 | CHANGELOG said "7 of the 11 installed agents" — never derived, inherited from the `BUG-22` row. `docs-audit` prints `Registry: 12 agents`; the eight that stop are Isla, Liam, Noah, Max and the four Gyre agents | Corrected to 8 of 12 with the agents named; `BUG-22`'s receipt and both epic files annotated |
| MEDIUM-1 | Step 1b passed with the `UNRELEASED` placeholder intact, and `convoke-update` would show operators `4.0.3 — UNRELEASED` | Step 1b now fails on a missing **or undated** entry; verified against all three states |
| MEDIUM-2 | The guides cited a document absent from a user's project (an npx install leaves no local copy) | Citation removed; the advice is self-contained |
| MEDIUM-3 | `drafts/docs-program/customize-without-forking.md` still stated the claim this story disproved | Corrected, with both gaps named |
| LOW-1/2 | "three cases" against a four-row table; "stops when it reaches the copy step" (the refusal runs *before* any copy) | Both corrected |
| LOW-3 | Emma, Mila and Wade load config via `bmad-init` and cannot emit that error; their guides' section was pre-existing and got enlarged | Left as-is — harmless, and trimming it is not this story's scope. Disclosed here |
| LOW-4 | `convoke-doctor` still says "Reinstall the module" while 16 shipped surfaces now say do not | `IN-211`, deferred by operator ruling 2026-09-16. Disclosed, unchanged |

**The most consequential single edit** was to `_bmad/bme/_team-factory/agents/team-factory.md`: my Task 3 wording told the Loom Master operator that install "refuses to overwrite a config it cannot read" — about the one config for which that is demonstrably untrue. It now tells them not to reinstall because reinstalling *would* replace it, and points at `T181`.

**Not fixed, by scope:** `version-detector.js` (`T180`) and the unguarded module configs (`T181`). Both are behaviour changes; this story makes the words match the code.

**Checks:** full suite `npm test` 0 failures; `npm run lint` clean; `docs-audit` clean; `backlog-integrity` PASS (931 rows). `assert-shipped-links.js` exits 1 — it does so on a pristine HEAD copy too and is wired into neither CI nor npm scripts, so it is pre-existing and not this story's.

### Round 1 (scoped layer on the shipped files) — 2 HIGH, 4 MEDIUM, 6 LOW, all remediated

Each defect below was reproduced before it was fixed. Both HIGHs were in sentences this story authored.

| # | Defect | Fix | Re-derive with |
|---|---|---|---|
| H1 | `UPDATE-GUIDE.md` said "The last row is a known defect, tracked as `T180`" — a fifth row appended at story close moved `T180`'s case to row 4, so the sentence attached the "decline the plan" advice to the `T181` case, which offers no plan | Names the case (`convoke-update` + Vortex) instead of a row position, and says what the last row is | `awk '/^\| What you run/,/^$/' UPDATE-GUIDE.md` |
| H2 | `INSTALLATION.md` said an install "stops **before copying anything**" — false for the CLI. `install-vortex-agents.js` step `[2/5]` runs `archiveDeprecatedWorkflows` (`fs.copySync`) and `cleanupLegacyFiles` (`fs.removeSync` of `_bmad/bme/_designos` and `_bmad/_designos`) before the config check at `[4/5]`. A run that refused restored `workflows/_deprecated/wireframe` and **deleted** `_bmad/bme/_designos` | Both documents and the changelog now name what step `[2/5]` has already done, including the delete | install into a scratch dir, `rm -rf` the wireframe dir, create `_bmad/bme/_designos`, append `user_name: dup` to the Vortex config, re-run the installer: exit 1, wireframe back, `_designos` gone |
| M1 | Step 1b said "no CI job reads the file" — `docs-audit.js` reads `CHANGELOG.md` (`scripts/docs-audit.js:119`, `:750`) | The true claim: no CI job checks the file has an entry for the version being released | `grep -n CHANGELOG scripts/docs-audit.js` |
| M2 | Step 1b rejected only the literal `UNRELEASED`; `## [4.0.3]` and `## [4.0.3] - TBD` both passed | Reads the entry with `changelog-reader.js` and requires a leading ISO date | the seven-case table below |
| M3 | UPDATE-GUIDE row 5 said "either command … replaced with defaults" — `convoke-update` with nothing out of step prints `✓ Already up to date!` and exits before any config is written (`convoke-update.js:289-290`) | Row 5 names the commands that reach the file, and says what happens when update does not | `convoke-update` in a damaged-but-current install |
| M4 | "no module has been copied, so your installation is not half-updated" — the second clause is false for `convoke-install` (see H2) | Replaced; "no module directory has been copied" is kept because it is true | as H2 |
| L1 | `INSTALLATION.md` "an update stops too when a refresh is due" — false for Vortex (`T180`) | Scoped to the Gyre config | — |
| L2 | The changelog cited "UPDATE-GUIDE, section …" without saying where the reader would find it | Cites `UPDATE-GUIDE.md` and notes it ships inside the package (`package.json` `files[]`) | `node -p "require('./package.json').files"` |
| L3 | This story enlarged the "Cannot load config file" section in EMMA, MILA and WADE guides — those three agents cannot emit that string (it appears in 9 activation blocks, none of them theirs) | Section deleted from those three guides. **Round 2 reversed this** — see R2-H1 and R2-H2 | `grep -rl "Cannot load config file" _bmad/bme/*/agents` → 9 activation blocks, none of them Emma, Mila or Wade |
| L4 | Step 1b hard-failed pre-release versions | The reader accepts them; this changelog's five `-alpha` entries pass | case table below |
| L5 | Step 1b's hand-written heading pattern disagreed with `changelog-reader.js::HEADER_RE` on spacing and dash characters | Uses the reader itself, so the check accepts exactly what `convoke-update` will render | case table below |
| L6 | Nine activation blocks said "the next run of the install command" without naming it | Names `convoke-install-vortex` / `convoke-install-gyre` / `convoke-install`, each observed rewriting a deleted config | delete a module `config.yaml`, re-run that installer |

**Step 1b, seven cases** (scratch dir, `package.json` version varied, repo `scripts/` symlinked):

| Changelog heading | Version | Exit |
|---|---|---|
| `## [4.0.3] - UNRELEASED` | 4.0.3 | 1 — undated |
| `## [4.0.3]` | 4.0.3 | 1 — undated (`null`) |
| `## [4.0.3] - TBD` | 4.0.3 | 1 — undated |
| entry absent | 4.0.3 | 1 — missing |
| `##  [4.0.3]   -   2026-09-17` | 4.0.3 | 0 |
| `## [4.0.3] - 2026-09-17 (Unpublished)` | 4.0.3 | 0 |
| `## [1.0.3-alpha] - 2026-02-15 (Unpublished)` | 1.0.3-alpha | 0 |

**Refuted, so not changed:** `config-merger.js:464`, `tests/integration/fresh-install.test.js:436` and the `BUG-22` backlog row all say `refreshInstallation` refuses "before copying anything". Scoped to `refreshInstallation` that is true: called directly against a project with a damaged Vortex config, a deleted `hypothesis-engineer/SKILL.md` and a deleted `_bmad/bme/_gyre/agents/`, it threw and restored neither. The false claim was `INSTALLATION.md`'s, which attributed the property to the install command.

**Checks after remediation:** `docs-audit` zero findings (`Registry: 12 agents, 29 workflows`); `npx eslint scripts tests` exit 0. No production code changed.

### Round 2 (three scoped layers on the remediation) — 7 HIGH, 6 MEDIUM, 3 LOW

Round 1's fixes generated every HIGH here. Layers: A on the rewritten release check, B on the shipped
documents' claims, C on the deletions and the nine activation blocks.

**The release check was restructured rather than patched a fourth time.** Layer A fooled it three ways, so
it moved out of the markdown into `scripts/audit/check-changelog-entry.js`, with
`tests/audit/check-changelog-entry.test.js` pinning each shape (14 tests). Six guards were reverted one at
a time on a copy of the tree: each was killed by its own test, suite floor 14 on every run, copy restored
byte-identical.

| # | Defect | Fix |
|---|---|---|
| A-H1 | A `##` heading inside a fence indented 1-3 spaces parsed as a live entry — `changelog-reader.js`'s `FENCE_RE` is anchored at column 0. `CHANGELOG.md` already contains four such fences | The gate re-scans headings with a fence rule that accepts the indent and rejects an entry the strict scan cannot see. The **rendering** half is `T182` |
| A-H2 | Two entries for one version: `.find()` took the first, so a dated stub masked a live `UNRELEASED` heading | Rejects more than one heading claiming the version |
| A-H3 | The command ran only from the repository root — including for a reader sitting in `docs/`, where the checklist lives; `MODULE_NOT_FOUND` is indistinguishable from a gate failure | The script resolves the repository from `__dirname`; a test runs it from `os.tmpdir()` |
| A-M1/M2 | A dated heading with an empty body passed; `0000-00-00`, `9999-99-99`, `2026-13-45` passed | Body must be non-empty; the date must be a real calendar date |
| A-M3 | "`docs-audit.js` … for link and staleness checks only" — false in both halves: staleness is precisely what is skipped for `CHANGELOG.md`, and four other checks run on it | Corrected, citing `scripts/docs-audit.js:750-755` |
| A-M4 | "what this step accepts is what operators will be shown" — `4.0.3+build.7` failed the gate but rendered to operators, because the gate used string equality where `printChangelog` uses `compareVersions` | The gate compares versions the same way; pinned by a test |
| A-M5 | A malformed neighbouring heading (`## 4.0.2 - …`) merged 4.0.2's whole section under 4.0.3, gate green | Rejects a version-shaped heading that does not parse. Prose headings such as `## Version History` are left alone — the first version of this guard failed on the repository's own changelog, caught by the test that runs the gate against the real file |
| B-H1 | "`convoke-install` (any variant) … step `[2/5]` has already run" — `convoke-install-gyre` runs four steps, refuses at `[3/4]`, and has no archive or cleanup step at all. INSTALLATION.md's "treat them as aliases" made a reader apply the false claim to exactly that variant | All three documents now state the sequence per command; the table gained a `convoke-install-gyre` row |
| B-H2 | Row 4's `From: 1.1.0` is `1.0.0` on a project installed with `convoke-install-gyre` alone (`guessVersionFromFileStructure` needs `workflows/_deprecated/`, which that installer never creates), with three breaking changes, not two — and the recovery advice told operators to recognise the case by the `1.1.0` | The row gives both values and the condition; the advice keys on "a surprisingly old `From:` version" |
| B-L3/L4/L5 | `[2/5]`/`[4/5]` collide with `convoke-update`'s own five-step sequence; "no module directory has been copied" is contradicted by the `wireframe` copy one paragraph later; "an early migration" is migration 3 of 7 | Commands named; "no agent, workflow, guide or config file has been replaced"; the migration named |
| C-H1 | R1-L3 justified deleting guide sections because those agents "load config through `bmad-init`, which walks the operator through setup". **`bmad-init` does not exist** — deleted upstream in `a16fa340`, only `.bak` files remain, no `.claude/skills/bmad-init`, and a packed tarball ships no `_bmad/core`. The deleted advice was replaced by nothing | Sections restored; the missing skill is filed as `T183`, which is a live defect in three shipped agents, not a docs issue |
| C-H2 | Three of seven Vortex guides were left with no mention of `config.yaml` at all — a file all seven agents share, guarded by an installer-level refusal any Emma operator can hit. The guides are the only config document installed into a project | Restored under a heading that is true for those agents: "The Vortex config file is missing or cannot be read" |
| C-M1 | The named install commands reset `_enhance`, `_artifacts`, `_portability` and `_team-factory` configs on **every** run, damaged or not; UPDATE-GUIDE scoped the loss to "the damaged file" | Re-derived independently: `my_custom_key` and `user_name: Pat` gone after an ordinary re-install (exit 0) while `_vortex` and `_gyre` kept both. Table row, INSTALLATION, CHANGELOG and `T181` all widened |
| C-L1 | The Round 1 commit message says "Thirteen findings"; the table enumerates twelve plus one refuted claim | Recorded here; the commit message stands as pushed |
| C-L2 | R1-L3's "the four whose agents do emit it" implies a match that does not hold — nine agents emit the string, four guides carry the section | Corrected in the row above |

**Checked and sound across the three layers:** all five original table rows reproduced exit-for-exit,
including the `_designos` delete (a planted `MY-NOTES.md` was destroyed by a run that then refused); the
`T180`/`T181` attributions as the table now reads; "8 of the 12" and the named eight; every command↔config
pairing in the nine activation blocks, each observed rewriting its module's config after deletion; the
refusal asymmetry that makes the Team Factory block say the opposite of the other eight; nothing linking
to the deleted sections; and every "re-derive with" command in the Round 1 table above.

**Not this commit's:** `scripts/audit/audit-bmad-init-refs.js --verify-only` reports pre-existing drift at
`_bmad/_config/v6.3-migration-inventory.csv`; the files touched here carry no `bmad-init` reference and the
generated inventory is identical before and after.

### File List

- `INSTALLATION.md`, `UPDATE-GUIDE.md` — refusal claims scoped per path and per config; the four-case table
- `CHANGELOG.md` — `[4.0.3] - UNRELEASED` entry, corrected figures, both known gaps
- `docs/pre-tag-release-checklist.md` — step 1b, now one line calling the gate below
- `scripts/audit/check-changelog-entry.js`, `tests/audit/check-changelog-entry.test.js` — the release gate and the 14 tests that pin it (Round 2)
- `_bmad/bme/_vortex/agents/*/SKILL.md` (4), `_bmad/bme/_gyre/agents/*.md` (4), `_bmad/bme/_team-factory/agents/team-factory.md` — activation advice; the Team Factory one differs because its config is unguarded
- `_bmad/bme/_vortex/guides/*-USER-GUIDE.md` (7) — unreadable-config branch
- `_bmad-output/drafts/docs-program/customize-without-forking.md` — the disproved claim
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — `T181` filed, `BUG-22` figure annotated (`T180` and the `IN-211` correction landed at authoring)
- `_bmad-output/planning-artifacts/convoke-epic-fresh-install-config-4-0-3.md`, `convoke-epic-release-truth-4-0-3.md` — figure corrections
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status

## Change Log

| Date | Note |
|---|---|
| 2026-09-17 | **Round 2 remediated as one batch: 7 HIGH, 6 MEDIUM, 3 LOW, every HIGH generated by Round 1's own fixes.** The release check was fooled three ways and moved out of the markdown into a tested script, proven by reverting each of its six guards on a copy. Two claims generalised from two installers to three were false for `convoke-install-gyre`. The guide sections Round 1 deleted were restored: their justification rested on `bmad-init`, a skill deleted upstream in June and shipped by nothing — now `T183`. `T181` is wider than filed: the four unguarded configs are rewritten on every install, not only when damaged. |
| 2026-09-17 | **Round 1 remediated as one batch.** 2 HIGH, 4 MEDIUM, 6 LOW — every one a sentence this story authored, both HIGHs reproduced first. The install refusal is not write-free: step `[2/5]` deletes `_bmad/bme/_designos` before the check at `[4/5]`, and both shipped documents said otherwise. Step 1b now reads the entry with the shipped parser and is proven to fail on four heading shapes and pass on three. One claim was refuted rather than fixed: `refreshInstallation` really does refuse before copying. |
| 2026-09-17 | **Implemented; to `review`.** Three paths established by execution, both shipped documents scoped per path, nine activation blocks and seven guides repaired, a 4.0.3 changelog entry and a checklist step that fails without a dated one. The story-close consumer audit found 3 HIGH — all in claims this story authored — and all were reproduced and fixed: the refusal covers only two of six module configs (`T181` filed), a version-pinned `4.0.2` literal inside a 4.0.3 document, and an undrived "7 of 11" that is 8 of 12. |
| 2026-09-17 | Story authored from a second, independent story-close consumer audit of `fic-1-1`. The production fix is sound; two published sentences are false on the `convoke-update` + damaged-Vortex path, nine shipped activation blocks and seven guides advise a command that now refuses, and a 4.0.3 would ship without a changelog entry. Mechanism verified in source: `getCurrentVersion` swallows the parse error and `guessVersionFromFileStructure` returns `1.1.0` because `workflows/_deprecated/` exists on every real install. |
