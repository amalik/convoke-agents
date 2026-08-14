# Portability test fixture

A miniature, self-contained BMAD project. The portability/export suites in `tests/lib/` point at
this directory instead of the live repository.

**Do not edit files here by hand to make a test pass.** See "Extending" below.

## Why this exists (backlog I123)

These suites used to call `exportSkill(id, findProjectRoot())` — the live repo. That violates
`project-context.md`'s `test-fixture-isolation` rule ("Exception: None"), and it broke for real.

BMAD Update `a16fa340` (2026-06-27) deleted Convoke's vendored copy of upstream skill content:
1,162 files, and tracked `SKILL.md` went 113 → 35. Seventy-five of 106 manifest paths stopped
resolving in a clean checkout — the content survived only in gitignored `.claude/skills/`, so the
suites passed on a developer machine and could not run in CI at all.

The response at the time was to quarantine: 12 suites skipped behind a precondition guard, and
`scripts/portability/**` removed from `.c8rc.json` so the 88% functions threshold would still
pass. That kept the build green for ~6 weeks while a **shipped binary went completely untested**.

It was not academic. Un-quarantining these suites immediately surfaced a real defect:
`convoke-export` resolved its README template from the *user's* project root rather than from its
own install directory, so the published bin failed in **every** user project with

```
❌ bmad-brainstorming — ENOENT: ... <their-project>/scripts/portability/templates/readme-template.md
```

It only ever worked when the current directory happened to be this repo. Fixed 2026-08-14 in
`loadReadmeTemplate()`.

Re-vendoring the upstream tree would have restored green and re-armed the identical failure on the
next upstream update. **A committed fixture cannot be deleted by an upstream commit.** That is the
entire point.

## What is here

- `_bmad/_config/skill-manifest.csv` — 31 rows, copied verbatim from the real manifest
- `_bmad/_config/agent-manifest.csv` — for persona resolution
- `_bmad/**/<skill>/` — the full skill directory for each row

Whole directories are copied, not just `SKILL.md`. `SKILL.md` is usually a thin pointer
("Follow the instructions in ./workflow.md"); the substance lives in siblings — `workflow.md`,
`steps/`, `*.csv`, `template.md`. Copying only `SKILL.md` produced a 1.6 KB export where the real
one is 60 KB, and silently dropped the `{{user_name}}` patterns one regression test depends on.

The set is chosen to satisfy what the suites actually assert:

| Requirement | Source |
|---|---|
| 19 skill ids referenced by name in the suites | grep of `tests/lib/portability-*.test.js` |
| dependency closure of those 19 | otherwise `[BROKEN-DEP]` / `[ORPHAN-DEP]` findings that are fixture artefacts |
| all 6 standalone intent categories | `catalog-generator` Test 3 |
| ≥ 12 skills resolving to a named persona | `export-all` Test 5 |

`bmad-tea` is deliberately **excluded**: 4 MB on its own, and it drags six orphan dependencies.
The `testarch` skill already supplies the `test-your-code` intent.

Verified properties, by execution:

- `exportSkill('bmad-brainstorming', FIXTURE_ROOT)` is **byte-identical** to the live-repo export
  (60,790 chars) — the fixture is faithful, not a simplification.
- `validate(FIXTURE_ROOT)` reports **zero** hard findings, so
  `portability-validation` Test 1a fails only if the validator itself regresses.

## Extending

When a suite needs a skill that is not here:

1. Copy the whole skill directory to the same relative path under this fixture.
2. Append its row **verbatim** from `_bmad/_config/skill-manifest.csv`.
3. Add anything it depends on, transitively — `node -e "require('./scripts/portability/validate-classification').validate('tests/fixtures/portability-project')"`
   reports what is missing. Zero hard findings is the bar.

Prefer extending the fixture over relaxing an assertion. Two suites failed against the first
draft of this fixture; both were genuine coverage gaps in the fixture, not bad tests.

## What must not happen again

If an upstream update breaks these suites, **do not** re-add `scripts/portability/**` to
`.c8rc.json` and do not reintroduce a skip guard. `tests/lib/portability-coverage-exclusion.test.js`
fails if either happens, and explains why.
