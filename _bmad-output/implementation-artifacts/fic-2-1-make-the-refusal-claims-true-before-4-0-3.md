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

### File List

- `INSTALLATION.md`, `UPDATE-GUIDE.md` — refusal claims scoped per path and per config; the four-case table
- `CHANGELOG.md` — `[4.0.3] - UNRELEASED` entry, corrected figures, both known gaps
- `docs/pre-tag-release-checklist.md` — step 1b, failing on a missing or undated entry
- `_bmad/bme/_vortex/agents/*/SKILL.md` (4), `_bmad/bme/_gyre/agents/*.md` (4), `_bmad/bme/_team-factory/agents/team-factory.md` — activation advice; the Team Factory one differs because its config is unguarded
- `_bmad/bme/_vortex/guides/*-USER-GUIDE.md` (7) — unreadable-config branch
- `_bmad-output/drafts/docs-program/customize-without-forking.md` — the disproved claim
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — `T181` filed, `BUG-22` figure annotated (`T180` and the `IN-211` correction landed at authoring)
- `_bmad-output/planning-artifacts/convoke-epic-fresh-install-config-4-0-3.md`, `convoke-epic-release-truth-4-0-3.md` — figure corrections
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status

## Change Log

| Date | Note |
|---|---|
| 2026-09-17 | **Implemented; to `review`.** Three paths established by execution, both shipped documents scoped per path, nine activation blocks and seven guides repaired, a 4.0.3 changelog entry and a checklist step that fails without a dated one. The story-close consumer audit found 3 HIGH — all in claims this story authored — and all were reproduced and fixed: the refusal covers only two of six module configs (`T181` filed), a version-pinned `4.0.2` literal inside a 4.0.3 document, and an undrived "7 of 11" that is 8 of 12. |
| 2026-09-17 | Story authored from a second, independent story-close consumer audit of `fic-1-1`. The production fix is sound; two published sentences are false on the `convoke-update` + damaged-Vortex path, nine shipped activation blocks and seven guides advise a command that now refuses, and a 4.0.3 would ship without a changelog entry. Mechanism verified in source: `getCurrentVersion` swallows the parse error and `guessVersionFromFileStructure` returns `1.1.0` because `workflows/_deprecated/` exists on every real install. |
