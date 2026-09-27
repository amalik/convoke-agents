---
baseline_commit: 7d803b10
---

# Story cir-1.1: Resolve every cross-directory reference from a stated base

Status: ready-for-dev

**Epic:** [cir — Channel-Integrity Remediation](../planning-artifacts/convoke-epic-channel-integrity-remediation.md)
**Evidence:** [channel-integrity findings](../planning-artifacts/convoke-note-channel-integrity-findings-2026-09-26.md) §5 defect 2
**Namespace decision:** Convoke-owned. Twelve files under `_bmad/bme/_vortex/agents/*/references/`, plus one test under `tests/unit/`. No new skill, agent or workflow, so `namespace-decision-for-new-skills` and `covenant-compliance-for-convoke-skills` apply only as no-regression checks.
**Safety analysis (`path-safety-for-destructive-ops`):** **not in scope, and here is why rather than a bare N/A.** Nothing in this story deletes, moves or writes to an operator's tree; it edits committed Convoke source and adds one assertion. No script gains a path argument.

## Story

As **an operator running a Convoke agent from anywhere other than the project root**,
I want **every file the agent points me at to resolve**,
so that **a capability does not silently do nothing because a path was read from the wrong directory.**

## Root cause

Twelve capability reference files carry **22** cross-directory paths with no resolution base. Example,
`lean-experiments-specialist/references/mvp.md`:

> invoke the workflow at `_bmad/bme/_vortex/workflows/mvp/workflow.md` and follow its step-file
> sequence under `_bmad/bme/_vortex/workflows/mvp/steps/`

Under the BMAD v6.3 convention a **bare path resolves from skill root**, so these resolve inside the
agent's own directory, where no `workflows/` tree exists. They only appear to work when the agent is
activated from the project root.

```sh
grep -rhoE '(^|[^{/a-zA-Z._-])_bmad/bme/_[a-z-]+/[A-Za-z0-9_./-]*' \
  _bmad/bme/_vortex/agents/*/references/ | wc -l          # 22
```

### The scope is exactly the converted agents, which is why an assertion beats a sweep

```sh
for d in _bmad/bme/_vortex/agents/*/; do
  printf '%-42s refs=%s\n' "$(basename "$d")" \
    "$([ -d "$d/references" ] && ls -1 "$d/references" | wc -l || echo 0)"
done
# contextualization-expert 4 · lean-experiments-specialist 5 · research-convergence-specialist 3 · rest 0
```

The three agents with `references/` directories are **exactly the three converted to v6.3** (Emma,
Wade, Mila). The other four carry none because they are still v5. **`T87` converts those four**, and
each conversion will mint a new `references/` directory in the same shape. A one-time sweep fixes 22
strings; an assertion stops the next four from re-introducing them. **Fix the class, not the
instances.**

### Two things my epic said that are wrong, corrected here

**1. `T138`'s "do not patch it a third time" does not govern this story.** `activation-validator.js`
lives at `_bmad/bme/_team-factory/lib/writers/activation-validator.js` and validates **generated**
agents at `add-team` §5c; `T138` and `T214` are both `loom`-portfolio rows about that file. `git log
--name-only --grep=T214` confirms T214 touched only Team Factory files and their tests. **The defect
*class* is shared — bare path versus stated base — the *check* is not.** Nothing here patches check 4,
and citing T138's warning against this work was a category error in the epic.

**2. The two `_bmad/core/` references are not a prefix defect and are reassigned.** They sit in the
**four v5 agents'** `SKILL.md` (`discovery-empathy-expert`, `production-intelligence-specialist`,
`hypothesis-engineer`, `learning-decision-expert`) at `:82` and `:116`, and they are **already
`{project-root}/`-prefixed**:

> `1. CRITICAL: Always LOAD {project-root}/_bmad/core/tasks/workflow.xml`

The real issue is that `_bmad/core/` is **absent from `files[]`** — verified — because it is **BMAD's
to ship, not Convoke's**. So those references are correct for the ~60% BMAD-addon segment and
unresolvable only for the ~40% standalone segment. **That is a two-segment dependency question, not a
path-prefix one**, and it belongs with `cir-1-2`. Out of scope here, stated so it is not silently
dropped.

## Where the assertion goes — it already has a named home

`tests/unit/agent-activation-config-refs.test.js` sweeps shipped agents for the `{project-root}/`
prefix, and **its own header declares this story's gap**:

> **WHAT THIS DOES NOT CATCH:** … and the **3 v6.3 agents, which carry no activation block at all**
> (T127).

Those three are precisely the three holding all 22 paths. So this is an **extension of an existing
test**, which `npm test` already runs — **no new CI gate, and therefore no collision with the spent
baseline budget.**

That test claims the `committed-artifact-integrity` exception, and any extension must keep all four of
its conditions:

1. **Assert only about the artifact** — import no module under test.
2. **Take expectations from a source the artifact does not control** — the agent registry and the
   directory layout, never the reference file's own contents. *"Otherwise a corrupted artifact chooses
   the standard it is judged against."*
3. **State in the file what the test cannot detect.**
4. **Accept that new data makes it red until the data is complete** — a newly converted agent goes red
   until its references are prefixed. **That is the forward-guard, not a flake.**

## Acceptance Criteria

**AC1 — every cross-directory reference states its base.** All 22 occurrences across the 12 files carry
`{project-root}/`. Derived by the command in §Root cause returning **0** for unprefixed matches, not by
counting edits.

**AC2 — the assertion covers the three converted agents and fails on a regression.** Extending
`tests/unit/agent-activation-config-refs.test.js`, red if any reference under
`_bmad/bme/_vortex/agents/*/references/` carries an unprefixed cross-directory path.

**AC3 — it is a forward-guard, and that is proven, not asserted.** Adding a fourth `references/`
directory with an unprefixed path turns the suite red. Demonstrate with a temporary artifact, then
remove it; record the mutant and the **sole** test that executed it.

**AC4 — all four `committed-artifact-integrity` conditions hold**, including condition 3: the file
states what it cannot detect. At minimum it cannot tell whether a prefixed path points at a file that
**exists** — `refs:audit` covers reachability, this covers resolution base, and neither covers the
other.

**AC5 — no new CI check and no new gate.** The extension rides `npm test`. ADR-001 C1: the meta-model
baseline budget is spent.

**AC6 — the `_bmad/core/` question is recorded, not fixed.** A note in `cir-1-2`'s scope or the epic
stating the two-segment finding, so the reassignment is deliberate rather than an omission.

**AC7 — no regression in the three agents' behaviour.** The edits change how a path resolves, not what
it points at. `npm test`, `npm run refs:audit`, `npm run docs:audit` and
`node scripts/audit/agent-surface-parity.js` all pass.

## Tasks

1. Prefix all 22 occurrences across the 12 files (AC1).
2. Extend `tests/unit/agent-activation-config-refs.test.js` for the v6.3 `references/` set, keeping the
   four exception conditions and updating its **WHAT THIS DOES NOT CATCH** paragraph — that paragraph
   currently names this gap, and leaving it unchanged would leave the file lying about itself (AC2, AC4).
3. Prove the forward-guard with a temporary fourth-agent artifact; record mutant → sole executioner (AC3).
4. Record the `_bmad/core/` reassignment (AC6).
5. Gates: `npm test`, `npm run refs:audit`, `npm run docs:audit`,
   `node scripts/audit/agent-surface-parity.js`, `node scripts/audit/backlog-integrity.js`.

## Dev Notes

### Why this story is first

`s4-1-1`'s AC2 requires the hub to make **zero** `{project-root}` reads at activation. Doing `cir-1-1`
first means the hub is authored into a tree where the resolution-base convention already holds and is
asserted, rather than fighting the same class twice in two stories.

### The trap that already caught this mechanism once

`refresh-installation.js`'s `6d-bis` comment records it: the wrapper generator **copies `SKILL.md`
alone**, so a relative link resolves inside `.claude/skills/<name>/` where no target exists. That is
the same failure from the packaging side. This story fixes the authoring side; neither fix implies the
other.

### What this story does not touch

- `activation-validator.js` and the generated-agent path — `loom`, `T138`/`T214`.
- The `_bmad/core/` dependency — reassigned above.
- The four unconverted agents' conversion — `T87`.
