---
baseline_commit: d1194f94510c208855bfdf729d12316c3740dc07
---

# Story fic-2.1: Make the refusal claims true before 4.0.3

Status: ready-for-dev

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

- [ ] **Task 1 — Establish the three paths by execution (AC: #1)** — install with a damaged config; update with damaged Gyre and a refresh due; update with damaged Vortex. Record each command and its output. Work in a scratch project, never the repo.
- [ ] **Task 2 — Correct `INSTALLATION.md` and `UPDATE-GUIDE.md` (AC: #1)** — each claim names its path; the Vortex-under-update case is stated with a pointer to `T180`.
- [ ] **Task 3 — Repair the nine activation blocks (AC: #2)** — derive the file list with the grep in AC#2 rather than from this list.
- [ ] **Task 4 — Repair the seven Vortex guides (AC: #3)**; confirm the Gyre guides have no equivalent section before touching them.
- [ ] **Task 5 — Changelog entry and a checklist step that catches its absence (AC: #4)** — prove the step fails with the entry removed.
- [ ] **Task 6 — File `T180`; correct `IN-211`'s evidence (AC: #5)** — lanes stay ordered; `backlog-integrity.js` passes.
- [ ] **Task 7 — Consumer audit at close (AC: #6)** — one independent layer; dispositions recorded.

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

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Note |
|---|---|
| 2026-09-17 | Story authored from a second, independent story-close consumer audit of `fic-1-1`. The production fix is sound; two published sentences are false on the `convoke-update` + damaged-Vortex path, nine shipped activation blocks and seven guides advise a command that now refuses, and a 4.0.3 would ship without a changelog entry. Mechanism verified in source: `getCurrentVersion` swallows the parse error and `guessVersionFromFileStructure` returns `1.1.0` because `workflows/_deprecated/` exists on every real install. |
