# Fast Story: Upstream skill-name staleness gate (I143)

**Status:** ready-for-dev · **Lane:** Fast (pending triage RICE) · **Source:** BMAD v6.11.0 impact analysis, 2026-08-11 (Winston) · **Backlog ID:** I143  <!-- renumbered from I130 on 2026-08-14: collided with the PF1 placeholder-guard I130 (✅ Done 2026-08-13). Same bad derivation that produced the I131→I132 collision — the authoring grep undercounted the I1xx space, which runs I100–I142. Backlog row now exists. -->

## Context

Convoke's portability tooling hardcodes upstream BMAD skill names in several collections and in a long chain of inline string comparisons. When upstream renames or removes a skill, **nothing tells us.** The names simply stop matching anything and become dead entries that accumulate silently.

BMAD v6.11.0 (released 2026-08-10) made this concrete. Six hardcoded names in [`scripts/portability/classify-skills.js`](../../scripts/portability/classify-skills.js) now refer to skills that no longer exist upstream:

| Name | Where | v6.11 fate |
|---|---|---|
| `bmad-shard-doc` | [`STANDALONE_UTILITY_INTENTS`:63](../../scripts/portability/classify-skills.js#L63) | removed entirely |
| `bmad-index-docs` | [`STANDALONE_UTILITY_INTENTS`:64](../../scripts/portability/classify-skills.js#L64), inline [:184](../../scripts/portability/classify-skills.js#L184) | removed entirely |
| `bmad-agent-tech-writer` | [`PERSONA_AGENT_INTENTS`:88](../../scripts/portability/classify-skills.js#L88) | retired (Paige) |
| `bmad-sprint-status` | [`PIPELINE_BY_NAME`:72](../../scripts/portability/classify-skills.js#L72) | folded into `bmad-sprint-planning` |
| `bmad-check-implementation-readiness` | [`PIPELINE_BY_NAME`:77](../../scripts/portability/classify-skills.js#L77), inline [:210](../../scripts/portability/classify-skills.js#L210) | folded into sprint-planning |
| `bmad-quick-dev` | inline [:196](../../scripts/portability/classify-skills.js#L196) | renamed → `bmad-build` |

Plus `bmad-dev-story` and `bmad-create-story` (moved to `v6-shims/`, removed from menu) in [`PIPELINE_BY_NAME`:70,73](../../scripts/portability/classify-skills.js#L70-L73) and inline at [:192-195](../../scripts/portability/classify-skills.js#L192-L195), and [`audit-bmm-dependencies.js`:513](../../scripts/audit/audit-bmm-dependencies.js#L513).

**What this is NOT.** This is not a correctness bug in the exporter. [`classifyRow`](../../scripts/portability/classify-skills.js#L432-L442) deliberately returns `null` for an unmatched name — the `P3 (sp-1-2 review)` note is explicit that unknown intent must not silently default to `meta-platform`. Unmatched rows preserve any existing value and route to `BORDERLINE.md` as a heuristic miss for human review. A renamed upstream skill therefore degrades to *"operator must classify this"*, not to a wrong export. **The ~40% Vortex Standalone segment is not shipping bad bundles.**

The defect is narrower: **staleness is invisible.** There is no gate, no expiry, and no signal. The six names above were found by hand-auditing release notes against source. That does not scale — upstream shipped v6.9, v6.10, and v6.11 inside a single checking window.

**Why fix it now rather than absorb it with the rest of v6.11.** This is the only item in the v6.11 delta with a compounding return: it converts every *future* upstream rename from silent rot into an automatic finding. It is also independent of which absorption window (v4.1 / v4.2) the rest of v6.11 lands in, so it can ship without waiting on that decision.

## Design decisions (pinned)

**D1 — Keep the allowlist; add a gate. Do not rewrite `classifyIntent` into content-based inference.** The tempting fix is deriving intent from `SKILL.md` content instead of a name allowlist. Rejected: it trades a predictable, auditable lookup for a classifier that is harder to reason about and harder to test, and it abstracts on the second occurrence rather than the third. The allowlist is the right data structure — it just needs a freshness check.

**D2 — Detect by scanning source literals, not by refactoring the inline conditionals.** [`classifyIntent`](../../scripts/portability/classify-skills.js#L128-L228) mixes named collections with ~80 lines of inline string comparisons. Refactoring all of it into named constants would be cleaner long-term but touches live classification logic for no behavioral gain. Instead the gate **strips comments, then extracts `'bmad-*'` / `'wds-*'` string literals** from the source and validates them against the installed manifest. Zero risk to classification behavior. If the false-positive rate proves annoying in practice, the constants refactor becomes the follow-up — not the entry cost.

**D3 — Promote the existing `stripComments`; do not write a third one.** *(Amended 2026-08-14 — the original decision proposed extracting a fresh helper shared with the `install-scope-check` story. A hardened implementation already exists.)*

[`tests/lib/fresh-install-health.test.js`:232](../../tests/lib/fresh-install-health.test.js#L232) already implements comment-stripping, and it is **battle-tested in exactly the way this story needs**: I139's R1 review found it treating `const sep = /\//;` as the start of a `//` comment and dropping the rest of the line — including a real offender — and fixed it with the standard preceding-token heuristic for regex literals. That fix carries its own regression test at [:321](../../tests/lib/fresh-install-health.test.js#L321) (*"stripComments does not let a regex literal hide an offender"*).

Promote it from the test file into a shared module under `scripts/` and have this gate import it. [`fast-install-scope-check-ci-salvage.md`](fast-install-scope-check-ci-salvage.md) scope item 2 needs the identical technique for the identical reason (its `WRITE_OP_RE` counts matches inside comments and strings) and should import the same module — `shared-test-constants` applied to production helpers. Writing a fresh stripper would re-introduce a blind spot that has already been found and closed once, at review cost.

**This raises the stakes on AC3.** The regex-literal blind spot is precisely a catch-all false-negative: an offender hidden by a mis-parsed comment boundary is a name the gate *fails to report*, which reads as clean. Carry the `:321` test forward against the promoted module rather than assuming the behaviour survives the move.

**D4 — CI guard, not `convoke-doctor`.** The question "did upstream rename a skill under us?" is a **Convoke-maintainer** question, not an operator question. An operator cannot act on the answer — the fix is always a Convoke code change. Putting it in `convoke-doctor` would emit a warning the operator is powerless to resolve, which is an OC-R3 (rationale) failure. It belongs in CI, alongside [`install-scope-check.js`](../../scripts/audit/install-scope-check.js), which set this precedent.

**D5 — Fail loud, with no baseline/allowlist mechanism.** A stale name should turn CI red. This is safe *because of when the signal fires*: CI validates against the repo's committed [`_bmad/_config/skill-manifest.csv`](../../_bmad/_config/skill-manifest.csv), which only changes when someone runs the installer and commits the result. So the gate does not spontaneously break on an upstream release — **it fires at the exact moment of absorption**, in the same PR that bumps the manifest. That is precisely where the signal is actionable. A baseline/suppression file would be premature abstraction (Rule of Three) and would rot the same way the allowlist did.

**D6 — Distinguish upstream drift from Convoke-install breakage.** `VORTEX_AGENTS` ([:97](../../scripts/portability/classify-skills.js#L97)) and `GYRE_AGENTS` ([:108](../../scripts/portability/classify-skills.js#L108)) hold **Convoke-owned** names. If one of those goes missing from the manifest that is not upstream drift — it is a broken Convoke install, a more serious failure with a different remedy. The report must separate the two classes rather than presenting one undifferentiated list.

## Scope

1. **New script `scripts/audit/upstream-name-drift.js`.**
   - Accepts `projectRoot` as a parameter; resolves via `findProjectRoot()` only at the CLI entry point (rule `no-process-cwd-in-libs`).
   - Scans a declared set of source files — at minimum [`scripts/portability/classify-skills.js`](../../scripts/portability/classify-skills.js) and [`scripts/audit/audit-bmm-dependencies.js`](../../scripts/audit/audit-bmm-dependencies.js) — stripping comments before extracting `'bmad-*'` / `'wds-*'` string literals.
   - Loads skill names from [`_bmad/_config/skill-manifest.csv`](../../_bmad/_config/skill-manifest.csv) via the existing [`readManifest`](../../scripts/portability/manifest-csv.js) helper. Derive the name set from the CSV at runtime — do not restate it (rule `derive-counts-from-source`).
   - Reports each extracted literal that has no corresponding manifest row, **split into two sections per D6**: upstream drift vs. Convoke-owned missing.
   - Exit codes: `0` clean · `1` stale names found · `2` manifest missing/unreadable · `3` no source files matched (guards against a silently-empty scan passing as clean).
2. **Wire into CI.** Add an npm script (suggest `audit:name-drift`) and a step in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml). Honor the workflow-level `bash -eo pipefail` default (rule `verification-pipefail`).
3. **Extract the comment-stripping helper** per D3, or import it if the sibling story landed first.
4. **Do not fix the stale names in this story.** The gate ships red on purpose — that is the acceptance evidence that it works. Pruning is **backlog I144**, which depends on this story and should be a separate commit so the "gate catches real drift" signal stays legible in history. *(Corrected 2026-08-14: this line previously pointed at I132, which is the Python/`uv` toolchain preflight — an unrelated item from the same analysis. Do not restate the stale-name count here either; I144 takes its list from this gate's output per `mechanical-research-enumeration`, since the Context table is a hand-audit and may be incomplete.)*

## Acceptance criteria

1. `node scripts/audit/upstream-name-drift.js` run against the current tree exits non-zero and names **at least** the six stale entries in the Context table, each with its source file and line.
2. Output separates upstream-drift names from Convoke-owned missing names (D6). With a fixture where a `VORTEX_AGENTS` member is absent from the manifest, that name appears under the Convoke-owned section, not the upstream section.
3. The scanner ignores names appearing only in comments. Verified by a fixture containing a commented-out `'bmad-shard-doc'` reference and a live one, asserting only the live occurrence is reported (rule `catch-all-phase-review` — this is a catch-all matcher and requires explicit false-positive coverage). Note the two known comment-only mentions at [`classify-skills.js`:389](../../scripts/portability/classify-skills.js#L389) and [:392](../../scripts/portability/classify-skills.js#L392), which must **not** be reported.
4. Exit code `3` when the configured source-file list matches nothing — an empty scan must never be reportable as clean.
5. Tests run against an isolated fixture directory with `{ cwd: tmpDir }` / `{ projectRoot: fixtureDir }`; no assertions against live repo state (rule `test-fixture-isolation`). Fixture-guaranteed counts only.
6. CI runs the gate on every PR.
7. `npm test` and `npm run lint` clean for every file this story touches (rule `lint-passes-before-review`).

**Verification command form** (rule `verification-pipefail` — `$?` after a bare pipe captures the wrong exit code):

```bash
set -o pipefail; node scripts/audit/upstream-name-drift.js 2>&1 | tail -30; echo "EXIT: $?"
```

## Namespace decision

Internal Convoke maintainer tooling under `scripts/audit/` plus a `.github/` CI step. Not an operator-facing command — per D4 the operator cannot act on its output — so the `slash-command-ux-for-user-facing-tools` rule does **not** apply. Direct precedent: [`fast-install-scope-check-ci-salvage.md`](fast-install-scope-check-ci-salvage.md) made the same call for the same reason. No `_bmad/bme/` skill surface is created, so `covenant-compliance-for-convoke-skills` is **N/A** and no Compliance Checklist run is required.

## Safety analysis

Rule `path-safety-for-destructive-ops`: **N/A by construction.** The script is strictly read-only — it reads source files and one CSV, writes nothing, deletes nothing, and takes no user-supplied path for cleanup. The only path input is `projectRoot`, resolved by `findProjectRoot()` at the CLI entry point. If a later revision adds report-file output, this section must be revisited and a resolve + normalize + contains-check against the project root added.

## Dependency note

- **Independent of the v6.11 absorption-window decision** (v4.1 re-baseline vs. v4.2 lane). Ships either way.
- **Bundles with** [`fast-install-scope-check-ci-salvage.md`](fast-install-scope-check-ci-salvage.md) on the D3 comment-stripping helper. Not blocking in either direction — whichever ships first extracts it.
- **Sibling:** the dead-name pruning item (backlog item 3), which this gate makes mechanical. Deliberately kept separate per Scope 4.
- **Relationship to `derive-counts-from-source`:** same failure class as I49 — hardcoded values rotting against changing source data — applied to names rather than counts.

## Process note for the dev agent

The repo auto-commits each file edit individually to `main` and pushes (`feedback_auto_commit_hook`). Script and test **will not land in one atomic commit**. Either disable the hook for the duration of this story or accept the split; if accepting, land the test first so the intermediate commit is never a green-CI-with-no-coverage state.
