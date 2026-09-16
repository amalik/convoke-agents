---
baseline_commit: 7fe788e9
---

# Story fic-1.1: Seed the config every agent needs on a fresh install

Status: done

**Epic:** [fic-epic-1 — Fresh-Install Config (4.0.3 hotfix)](../planning-artifacts/convoke-epic-fresh-install-config-4-0-3.md)
**Origin:** `BUG-22` (16.2): (a) missing `user_name`/`communication_language`, (b) Gyre config seeded with Vortex values, (c) Gyre lists doubled. (d) was found in review: an unparseable existing config was silently overwritten with defaults.
**Namespace decision:** Convoke-owned `scripts/update/lib/`, `tests/`, and one sentence in `INSTALLATION.md`. No skill, agent or workflow is added or changed, so `namespace-decision-for-new-skills` and `covenant-compliance-for-convoke-skills` apply only as no-regression checks.
**Safety analysis (`path-safety-for-destructive-ops`):** in scope. The change alters which fields of an operator's file an update overwrites, and when it refuses to write. See §Safety Analysis.

## Story

As an **operator who has just installed Convoke**,
I want **every Vortex and Gyre agent to start**, and my later edits to survive updates,
so that **the first thing I try works, and a typo in my config never costs me the rest of it**.

## Root cause

`scripts/update/lib/config-merger.js::mergeConfig` had one Vortex-shaped set of structural defaults and one notion of "canonical" agents and workflows. `refresh-installation.js` called it for both Vortex and Gyre.
- **(a)** The defaults had no `user_name` or `communication_language`, so a config written from nothing had neither key. An existing `{user}` value survived; only fresh installs were affected.
- **(b)** For Gyre, the Vortex defaults filled `submodule_name`, `description` and `output_folder`.
- **(c)** Gyre's IDs are not in Vortex's lists, so they were treated as user-added. The first update doubled both lists (4 → 8 agents, 7 → 14 workflows); the `Set` dedupe then kept them at that size.
- **(d)** `writeConfig`'s self-heal path fell through to `yaml.dump` when the existing file did not parse. A single duplicate key therefore replaced the whole file with defaults. (a) makes this reachable: an operator who adds `user_name: Pat` instead of replacing the seeded line creates exactly that duplicate.

## Acceptance Criteria

1. **Fresh install.** `refreshInstallation` on an empty project writes `_bmad/bme/_vortex/config.yaml` and `_bmad/bme/_gyre/config.yaml`. Each carries `user_name: '{user}'`, `communication_language: en`, `module: bme`, and its own module's `submodule_name`, `description` and `output_folder`.
2. **No duplication.** Repeated refreshes leave `agents` and `workflows` equal to the module's canonical list plus each user-added entry exactly once, and a second run writes the same bytes.
3. **Repair.** A Gyre config in the 4.0.2 damaged shape is repaired on the next refresh, keeping unknown operator keys. That shape is `submodule_name: _vortex`, the Vortex description and `output_folder`, doubled lists, no user keys. A value equal to the other module's exact default is repaired even when `submodule_name` was already corrected by hand.
4. **Operator values survive** in both modules: `user_name`, `communication_language`, an edited `description`, a custom `output_folder`, `party_mode_enabled`, `excluded_agents`, user-added agents and workflows, unknown keys, and comments.
5. **Existing behaviour.** Every pre-existing test passes unmodified. Two changes are deliberate and acknowledged:
   - Identity is normalised: a legacy `submodule_name: vortex` becomes `_vortex`. Nothing in `scripts/` reads the field.
   - (d): a file `mergeConfig` cannot parse still yields defaults from `mergeConfig`, as tested, but `writeConfig` now refuses to write over it.
6. **No silent drift.** A test fails if the module defaults disagree with the shipped templates on `submodule_name`, `module`, `output_folder`, `user_name` or `communication_language`. `description` is excluded because the Vortex template is stale (`IN-208`).
7. **Fail loud on misuse.**
   - An unknown `submodule` throws, including prototype names and non-strings.
   - Omitting `submodule` on a config that names another known module throws, instead of stamping Vortex onto it.
8. **Live check** (manual, recorded below). On a clean install of the packed working tree, Isla and Scout start without a configuration error.
9. **Never overwrite what cannot be read, and refuse before changing anything.** `writeConfig` and `assertConfigReadable` refuse, leaving the file byte-identical, when the existing file is any of:
   - invalid YAML to either parser (`yaml` or `js-yaml`), including a duplicate key;
   - a document `yaml` cannot convert, such as one with over 100 aliases;
   - a list, or any non-null scalar.

   A document of just `null` is written normally. `refreshInstallation` runs this check on both configs before copying anything, so a refused update leaves no mixed-version tree.
10. **Empty is missing.** A present-but-empty (`null` or `''`) default field takes the module default.

## Tasks

- [x] T1: Failing tests first (red).
- [x] T2: Module-aware `mergeConfig`. Both refresh call sites pass `submodule` explicitly.
- [x] T3: Full suites green at the final state: `npm test`, `npm run test:integration`, `npm run lint`, plus `docs:audit`, `backlog-integrity` and `coverage-denominator`.
- [x] T4: AC8 live check.
- [x] T5: Independent review: three parallel layers on separate copies, then one scoped layer on the remediation. **No further round.** The scoped layer found no HIGH, and its findings were applied and mutation-checked. Per `code-review-convergence`, rewritten logic earns one scoped layer, not a cascade.
- [x] T6: At merge, `BUG-22` is MOVED to §2.5, not status-edited.
- [x] T7: Story-close consumer audit (`code-review-convergence`, clause added `d954e90a`). One independent whole-repository layer. See §Consumer Audit.

## Safety Analysis

`writeConfig` rewrites the operator's `config.yaml` on every update. After this story:
- **`submodule_name`, `module`:** always taken from the module profile. They name the directory the file lives in.
- **`description`, `output_folder`:** replaced only when the value equals the *other* module's exact default. An operator would have to type the other team's exact default string for this to misfire, and neither field is read by a Gyre workflow (Gyre writes to `.gyre/`). When the repair fires it prints `Repaired <field> in <path>`, so it is never silent.
- **Default fields that are `null` or `''`:** take the module default.
- **`agents` / `workflows`:** canonical entries are re-derived; user entries are judged against the right module's list and kept once.
- **Unreadable or non-mapping file:** no write at all. The update stops with a one-line `refusing to overwrite <path>: … Fix or remove the file, then re-run.` before any module is copied, and the file is untouched. Before, the file was replaced with defaults after the other modules had already been copied.

Nothing is deleted, no path comes from input, and the merge is idempotent (AC2).

## Dev Notes

- **Scope boundary:** no doctor check (`IN-193`), no `bmad-init` references (`IN-198`), no Vortex template description fix (`IN-208`).

### Test evidence
- **Red.** Before the fix, 8 of 9 new unit tests and all 4 new integration tests failed.
- **Mutation, scratch copy only.** Every piece of logic was removed or reverted one at a time, and a named test failed for each: defaults, list judgement, repair rule, forced identity and `module`, the implicit-submodule guard, empty-value defaulting, the `writeConfig` refusal, the non-mapping guard, null-document handling, frozen copies, the Symbol-safe message, the array guard, and the Gyre call site.
- **Survivors.** Two, both equivalent, so no test was added:
  - the explicit `{ submodule: '_vortex' }` at the Vortex call site, which equals the default;
  - `extractUserPreferences`'s `output_folder` comparison, which is unobservable through `mergeConfig`. It is covered directly.
- **Second remediation (scoped layer), mutation-checked.** Removing each of these fails a test:
  - the preflight at the refresh site;
  - the `toJS` check and the `js-yaml` check;
  - the first-line message;
  - null-document normalisation (and treating any falsy scalar as null);
  - the explicit Vortex call site;
  - empty-`description` defaulting;
  - exact-match repair (versus a suffix match), and the Vortex-direction repair;
  - the own-property guard (versus `in`).

  The one survivor is the `Repaired …` warning line, a log line that is deliberately untested.
- **End to end, refused update then recovery** (packed working tree, all module configs aged to 4.0.1, `acme_client: Globex` and `user_name: Pat` appended to Gyre's config):
  - `convoke-update --yes` exits 1 with `refusing to overwrite …/_gyre/config.yaml: it is not valid YAML (Map keys must be unique …). Fix or remove the file, then re-run.` Gyre's config keeps its checksum, a marker added to a Vortex agent file survives, and all six modules stay at 4.0.1.
  - After deleting the seeded `user_name: '{user}'` line, the re-run exits 0: all six modules are at 4.0.2, `user_name: Pat` and `acme_client: Globex` are kept, and `convoke-doctor` reports "All 31 checks passed".
- **Line numbers.** `refresh-installation.js` line numbers are unchanged. The preflight wraps the existing `readExcludedAgents` arguments rather than adding a statement. `scripts/audit/lib/installed-tree.js` pins call sites by line, and an added line broke three of its citations.

### AC8 live check (2026-09-15)
- **Setup:** `npm pack` of the working tree, installed into a clean project, then `convoke-install` (exit 0) and `convoke-doctor` ("All 31 checks passed").
- **Both configs:** carry `submodule_name`, their own `output_folder`, `user_name: '{user}'` and `communication_language: en`. Gyre lists 4 agents and 7 workflows.
- **Isla:** `claude -p "/bmad-agent-bme-discovery-empathy-expert"` greets and shows her menu.
- **Scout:** `claude -p "/bmad-agent-bme-stack-detective"` greets and shows his menu.
- The same commands on `convoke-agents@4.0.2` printed `Configuration Error: Missing required field(s)`.
- **Observed, not in scope:** both greet "{user}" until the operator edits the file, which is the documented flow (`IN-209`).
- The live check ran before the review remediation. The remediation touched no path a fresh install takes, and a fresh install is covered by the integration suite.

### Review findings

| Finding | Source | Resolution |
|---|---|---|
| Omitting `submodule` rewrites a healthy Gyre config as Vortex | blind, acceptance | Guard throws; both call sites explicit (AC7) |
| Duplicate key → whole config replaced by defaults | edge | `writeConfig` refuses (AC9); `INSTALLATION.md` says edit in place |
| Repair keyed only on `submodule_name` | edge | Rule keys on the other module's exact default (AC3) |
| Empty values not defaulted | blind, edge | AC10 |
| Non-mapping document crashes with an unnamed file | edge | Named refusal (AC9) |
| `null` options / Symbol submodule throw `TypeError` | blind, edge | Guarded (AC7) |
| Registry arrays mutable through the export | blind | Frozen copies |
| AC4 proven for Gyre only; descriptions asserted by regex; `module` forcing and `Set` dedupe untested | acceptance | Tests over both modules, exact values, fixtures extended |
| "Doubled on every update"; `extractUserPreferences` named as a cause | blind, acceptance | Corrected here, in code comments and in `BUG-22` |
| Comments claimed `mergeConfig` throws for any other submodule | blind, acceptance | Rewritten to what it does |
| BMAD core `user_name`/`communication_language` ignored | edge | Not a hotfix: `IN-209` |
| Gyre config absent from the update backup list | edge | Not a hotfix: `IN-210` |
| Foreign repair ignores another module's agent IDs | blind | No install path writes that shape; the comment no longer claims it |
| Refusal fired mid-refresh → mixed-version tree, "restored from backup" untrue | scoped | `assertConfigReadable` preflight before any copy (AC9); verified end to end |
| Parses but cannot convert (over 100 aliases) → still overwritten | scoped | `readConfigDocument` checks `toJS` (AC9) |
| `yaml` and `js-yaml` disagree on validity | scoped | Refuse if either rejects (AC9) |
| Repair silent when it fires | scoped | `Repaired <field> in <path>` warning |
| Untested: empty `description`, exact-match repair, Vortex-side repair, Vortex call site, `in` guard, falsy scalars, self-heal message | scoped | Tests added; mutants killed |
| Refusal message multi-line | scoped | First line of the parser message only |

### Consumer Audit (story close)

Required by `code-review-convergence`'s story-close clause, added in `d954e90a` after this story's
review rounds had already run. One layer, whole-repository, independent of the implementer.

Scoped from what the story changed: `mergeConfig`'s 4th `options` argument and its two new throws;
the new `MODULE_PROFILES` and `assertConfigReadable` exports; `extractUserPreferences`' 2nd argument;
`writeConfig`'s refusal; the `refreshInstallation` preflight and the non-zero exit it gives
`convoke-update` / `convoke-install`; the seeded `user_name` / `communication_language`; Gyre's own
identity and un-doubled lists.

Consumers that were not already correct:

| Consumer | What it assumed | Disposition |
|---|---|---|
| `_bmad-output/drafts/docs-program/customize-without-forking.md` §2 | a fresh install writes no name or language, so "add the keys yourself" | **Updated.** Version-aware: 4.0.2 vs 4.0.3, plus the "edit in place, never add a second `user_name:` line" warning. The old instruction now produces a duplicate key, which is exactly what the refusal rejects |
| same file, `output_folder` bullet | Gyre's config carries Vortex's `output_folder` | **Updated.** Version-aware; (b) fixed it |
| `UPDATE-GUIDE.md` "Installation appears corrupted" | reinstalling repairs a corrupted install | **Updated.** New troubleshooting entry for the refusal message; the old section now points at it. Reinstalling cannot clear this class, by design |
| `convoke-note-initiative-lifecycle-backlog.md` I138 (live row) | "`mergeConfig` cannot be used as-is: its structural defaults are Vortex-specific" | **Updated.** Conclusion survives, reason did not: defaults are per-profile now; what blocks reuse is the absent profile plus the unknown-submodule throw |
| `convoke-epic-fresh-install-config-4-0-3.md` scope table | `fic-1-1` = `BUG-22` (a)–(c) | **Updated** to (a)–(d) |
| `convoke-doctor.js:184,228,246,261,282,300`; `convoke-update.js:274-276,281-284` | reinstalling repairs any broken module | **Deferred to `IN-211`** by operator ruling 2026-09-16 — docs-only for the hotfix. The refusal message already carries the correct instruction, so the strings are wrong but the operator is not stranded |
| `customize-without-forking.evidence.md` D1–D3; `convoke-note-docs-program-three-doors-2026-09-14.md`; `CHANGELOG.md` | pinned to a `convoke-agents@4.0.2` run | **Historical record — left as-is** |

Consumers checked and still correct: `migration-runner.js:311` (the only bare-object `writeConfig`
caller — `yaml.load` at `:301` throws first, and the preflight has already run); `validator.js`
(`CONFIG_SCHEMA` unchanged, and it still cannot see this defect class — that is `IN-193`);
`convoke-doctor`'s check count (`passed.length`, no check added); all 18 line-pinned citations in
`scripts/audit/lib/installed-tree.js` (`refresh-installation.js` line numbers are unchanged — every
hunk is balanced and the preflight wraps existing arguments rather than adding a statement);
`.github/workflows/ci.yml`; the 11 agent activation blocks that require the three fields.

No consumers exist in `_bmad/**` workflows, `run:` blocks, agent menus, `.claude/skills/**`, the CSV
registries, or `scripts/portability/` — `grep -rn "config-merger\|mergeConfig\|writeConfig\|refreshInstallation" _bmad/ .claude/`
returns three unrelated comments, and `grep -rn "config.yaml" scripts/portability/` returns nothing.

Falsification of the negative results: the prose patterns used do return hits elsewhere —
`replace .?\{user\}|\{user\} with your|add (the )?(keys|user_name)` finds `README.md:49`,
`INSTALLATION.md:243` and both installer scripts; `(overwrit|reset|regenerat|replace|restore|repair).{0,40}config`
finds `UPDATE-GUIDE.md` and `CHANGELOG.md`. So the empty results measure the tree, not a broken pattern.

Reproducing the refusal, both directions:

```bash
printf 'user_name: "{user}"\nuser_name: Pat\n' > /tmp/dup.yaml
node -e "require('./scripts/update/lib/config-merger').assertConfigReadable('/tmp/dup.yaml')"
# → Error: config-merger: refusing to overwrite /tmp/dup.yaml: it is not valid YAML
#   (Map keys must be unique at line 2, column 1:). Fix or remove the file, then re-run.
printf 'user_name: Pat\n' > /tmp/ok.yaml
node -e "require('./scripts/update/lib/config-merger').assertConfigReadable('/tmp/ok.yaml'); console.log('accepted')"
# → accepted
```

### Release status at close

Fixed in `main` (`6ab2fafa`); **not published.** `npm view convoke-agents dist-tags` gives
`latest: 4.0.2`, `package.json` is `4.0.2`, and `git tag --list 'v4.0.*'` has no `v4.0.3`. The defect
is therefore still live for anyone installing today, and the remaining work is a release, not code.
Operator ruled 2026-09-16 to hold it.
