---
initiative: convoke
artifact_type: adr
qualifier: 4-0-1-bme-module-contract
created: '2026-08-30'
status: accepted
schema_version: 1
related_initiative: 4.0.1 (distribution integrity) — Epic 2, releasing as 4.0.2
related_decision: 'Epic convoke-epic-4-0-1-distribution-integrity.md — ADR-4; gates Story 2.6, constrains Story 2.4'
closes_if_accepted: 'I141; unblocks FR14; re-specifies FR13'
---

# ADR-004: What a `_bmad/bme/*` module is, and how `_portability` conforms

**Status:** **Accepted** (2026-08-30, Amalik) — option (a), conform `_portability` to the contract
**Initiative:** Convoke 4.0.1 — distribution integrity, Epic 2 (releases as 4.0.2; see Finding 12)
**Gates:** Story 2.6, which is not implementable until this is ruled. **Constrains:** Story 2.4 — the assertion FR13 specifies goes green on the defect it exists to catch unless this contract defines what it asserts against.

> **Namespace decision.** This ADR governs `_bmad/bme/`, Convoke's owned namespace, so it is Convoke-specific and not an upstream BMAD concern. It is filed under `adr/4-0-1/` alongside ADR-001-003 for continuity with the initiative that produced it, even though Epic 2 now releases as 4.0.2.

## Context

Story 2.6's first two acceptance criteria contradict each other. AC1 says copy `_portability` "by **the same mechanism as the other `_bmad/bme/*` modules**"; AC2 says the four skills then resolve when invoked. AC1 does not produce AC2, for two independent reasons, and neither is visible from the epic.

**There is no "the same mechanism."** Module installation is five bespoke code paths, not one loop: Vortex (`refresh-installation.js:40`), Enhance (`:314`), Artifacts (`:424`), Gyre, and a generic-looking block at `:227` that iterates **`EXTRA_BME_AGENTS`** (`agent-registry.js:228`). That last one is the only thing resembling a general mechanism, and it is **driven by an agent registry** — a module with no agent entry is never visited. `_portability` has no agents, so no path reaches it.

**Copying would not make anything invocable anyway.** `.claude/skills/` wrappers are *generated*, never copied — from agents (`:749`, `:810`, `:836`) and from `config.yaml` workflows carrying `standalone: true` (`:909`). `_portability` has neither a `config.yaml` nor a `workflows/` directory. It ships four `SKILL.md` files under `skills/`, a third shape no generator recognises.

The failure reproduces with no packaging involved: **all four skills are absent from this repository's own `.claude/skills/`** while the source tree sits right there.

### The root cause is narrower than I141 states, and it changes the fix

I141 and FR14 both read as *"the tree ships but no install path copies it."* That is true but incomplete. `epic-skill-portability-ux.md:78-90` specified **two** locations:

```
.claude/skills/bmad-export-skill/          ← "what Claude Code reads"
_bmad/bme/_portability/workflows/…/        ← "what convoke-install copies"
```

> "Both must exist."

It also offered an explicit alternative — skip the module copy entirely, since the scripts already live at `scripts/portability/` — and left it as "dev's judgment call in Story 6.1."

**What shipped is neither option.** The module-side half exists, but under `skills/` rather than `workflows/` and with no `config.yaml`; the `.claude/skills/` half — the one the epic calls the thing Claude Code actually reads — was never built. Then `files[]` shipped the orphaned half.

So Story 2.6's AC1 would copy **the half that was never the interface.** The missing artefact is a generated wrapper, not a copied directory.

### A second document already calls this intentional

`INSTALLATION.md:116` states:

> The `_portability/` module ships inside the npm package but is **not** copied into your project — `convoke-export` runs from the package itself, so there is nothing to install.

That is **true of the bin and false of the skills.** `convoke-export` is a real `bin` entry (`package.json`) and does run from the package. The four `SKILL.md` files are a different surface, and no CLI invocation makes `/bmad-export-skill` resolve.

`project-context.md`'s `slash-command-ux-for-user-facing-tools` rule names this exact shape: *"Any user-facing tool must be exposed as a BMAD slash-command skill, not as a bare CLI script… If you find yourself writing CLI-only documentation, you've missed a layer."* INSTALLATION.md is that documentation. Whatever is decided below, **that sentence must change** — it currently certifies the defect as a design choice.

### Why this needs an ADR rather than a judgement inside Story 2.6

Five modules share a shape. One does not. The shape has never been written down, which is why `_portability` shipped inside `files[]` for two releases with no gate noticing, and why FR13 cannot be specified tightly enough to catch it. Rule of Three passed some time ago: this is five conforming instances and one violator.

It also blocks the story that closes the epic. **Story 2.6 carries both FR14 and the wiring of Story 2.4's assertion**, so the epic's terminal move waits on this ruling.

## What the contract actually is

Enumerated mechanically from the tree, not asserted:

| Module | `config.yaml` | `agents/` | `workflows/` | `skills/` | in `files[]` | reachable |
|---|---|---|---|---|---|---|
| `_vortex` | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `_gyre` | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `_team-factory` | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| `_enhance` | ✓ | — | ✓ | — | ✓ | ✓ |
| `_artifacts` | ✓ | — | ✓ | — | ✓ | ✓ |
| **`_portability`** | **—** | **—** | **—** | **✓** | **✓** | **✗** |
| `_config` | — | — | — | — | — | n/a (empty) |

The contract the five conforming modules already keep, stated for the first time:

> **C1.** Every `_bmad/bme/<module>/` directory in `files[]` MUST carry a `config.yaml` with a `version` field. The installer stamps it; an unstamped module fails Convoke's own version-consistency check.
> **C2.** Every operator-invocable unit MUST be **declared** — as an agent in `agent-registry.js`, or as a `config.yaml` workflow entry with `standalone: true`. Declaration, not file placement, is what produces a `.claude/skills/` wrapper.
> **C3.** A module MUST NOT ship an operator-facing surface that C2 does not declare. An undeclared `SKILL.md` is unreachable by construction.
> **C4.** `files[]` membership is necessary and not sufficient. Shipping is not installing; installing is not invoking.

C1 is not speculative. **I137** is the recorded precedent: `_team-factory` was the one module copied without its config stamped, so a fresh successful install immediately failed its own health check and told a brand-new user to run an update. Same class — a module that did not match the assumed shape, discovered by an operator rather than a gate.

## Options

**(a) Conform `_portability` to the contract.** Add `config.yaml` declaring the four skills as `standalone: true` workflows; move `skills/` → `workflows/`; add an install path. The generated wrappers then come from the Artifacts code path (`:909`), which already emits `.claude/skills/{workflow.name}/SKILL.md` using the workflow name verbatim — and all four skills already carry the `bmad-` prefix that path expects.

**(b) Teach the generator a third shape.** Extend wrapper generation to walk a bare `skills/` directory. No source-tree change to `_portability`.

**(c) Fold the four skills into an existing module** (`_artifacts` or `_enhance`) and delete `_portability`.

**(d) Retire the capability.** Drop `_portability` from `files[]`, keep `convoke-export` as a bin, and make INSTALLATION.md's claim true by removing the skills.

## Recommendation — (a), conform

**(a) writes the contract down by making the violator conform, rather than by widening the contract to admit it.** It adds no new mechanism: the Artifacts path already produces exactly the artefact `_portability` needs, keyed off exactly the declaration it lacks. It is also, precisely, finishing what `epic-skill-portability-ux.md` specified and Story 6.1 left half-done.

**(b) is the tempting one and I think it is wrong.** It is less work today — one generator change, no files moved — but it makes "a bare `skills/` directory" a supported module shape, so the repo would then have three ways to declare an invocable unit instead of two. Every future gate, doctor check and audit has to know all three. That is the opposite of boring: it buys a day now and taxes every subsequent check. Convoke's problem is not that its module shapes are too restrictive; it is that nothing states what they are.

**(c)** is defensible if you think a four-skill module is not worth its own directory — but it moves files without settling the contract, so the next module authored in a novel shape reproduces this exactly.

**(d)** is the honest option if portability-as-skills is not wanted. It should be rejected for a stated reason rather than by default, because the memory record has the portability layer as load-bearing for the ~40% Vortex Standalone segment, not a courtesy.

### The trade-off, stated rather than discovered

**(a) costs more than (b) and touches a shipped tree.** `_portability/skills/` → `_portability/workflows/` renames paths inside `files[]`, which is a packaging change in a patch release.

The blast radius is genuinely near-zero, and that is measurable rather than hoped: `grep -rn "_portability"` across the repo returns references only from `package.json`, `CHANGELOG.md`, `INSTALLATION.md` and planning artefacts. **No code resolves into that directory** — which is the bug, and is also what makes the rename safe. Nothing can break, because nothing was reaching it.

The second cost is real and should not be waved through: **this ADR pulls forward a piece of the meta-model baseline** ratified 2026-08-15 (one ADR + one name registry + one doctor/CI check, hard budget). The scope discipline that protects is worth protecting. The mitigation is to keep this ADR to the module contract **only** — no registry, no doctor check, no naming rules — and let the baseline consume C1-C4 rather than re-derive them. If this ADR grows a registry section, it has failed.

## Consequences if accepted

- Story 2.6 becomes implementable: add `config.yaml`, move `skills/` → `workflows/`, add the module to the install path, and the existing generator produces four wrappers.
- **Story 2.4's assertion must be re-specified against C2/C4, not C4 alone.** As FR13 is worded today — *"fails if any shipped `_bmad/bme/*` module is absent from the installed tree"* — the gate would go **green** on a `_portability` tree that was copied but stays uninvocable. That is a gate passing on the defect it was built to catch, which is the exact failure `project-context.md` records twice from 2026-08-15 and which NFR10 exists to prevent. The assertion must check that every **declared** unit resolves to a wrapper after install.
- `INSTALLATION.md:116` is rewritten: the bin runs from the package; the skills install like every other module's.
- I141 closes against Story 2.6.
- The baseline inherits C1-C4 as its ADR input instead of starting cold.

## Consequences if rejected

- If **(b)**: Story 2.6 is cheaper, and Convoke carries three declaration shapes indefinitely. FR13 still needs re-specifying — C4-only checking is wrong under every option.
- If **(c)** or **(d)**: Story 2.6 is rewritten around a different outcome and `epic-skill-portability-ux.md` should be marked superseded, since it specifies a layout no longer intended.
- If **nothing is decided**: Story 2.6 stays unbuildable and Story 2.4 stays `ready-for-dev` with a blocked closer — the forward-dependency risk in Finding 9, realised. An unwired gate drifts against the code it checks and is eventually deleted as dead weight.

## Evidence appendix

```bash
# The six modules and their shapes — _portability is the only one without config.yaml
for d in _bmad/bme/*/; do echo "$(basename $d): $(ls $d 2>/dev/null | tr '\n' ' ')"; done
# _artifacts: config.yaml workflows
# _enhance:   config.yaml extensions guides workflows
# _gyre:      README.md agents compass-routing-reference.md config.yaml contracts guides workflows
# _team-factory: agents config.yaml lib module-help.csv schemas templates workflows
# _vortex:    README.md agents compass-routing-reference.md config.yaml contracts examples guides module-help.csv module.yaml workflows
# _portability: skills          <-- and nothing else
# _config: (empty, not in files[])

# The four skills are absent from this repo's own .claude/skills/, source tree present
for s in bmad-export-skill bmad-generate-catalog bmad-seed-catalog bmad-validate-exports; do
  [ -d ".claude/skills/$s" ] && echo "$s PRESENT" || echo "$s ABSENT"; done
# -> all four ABSENT

# The only generic module-copy loop is driven by an agent registry
sed -n '227,233p' scripts/update/lib/refresh-installation.js
# for (const agent of EXTRA_BME_AGENTS) { … srcDir = _bmad/bme/<agent.submodule> … }
grep -n "EXTRA_BME_AGENTS = " scripts/update/lib/agent-registry.js   # :228 — team-factory only

# Wrappers are generated from declarations, never copied from skills/
grep -n "standalone !== true" scripts/update/lib/refresh-installation.js   # :915

# Nothing in the codebase resolves into _portability — the bug, and why the rename is safe
grep -rn "_portability" --exclude-dir=node_modules --exclude-dir=.git . | grep -v "_bmad-output/"
# -> package.json:13, CHANGELOG.md:191, INSTALLATION.md:116 only

# The bin exists and is real; it is a different surface from the four skills
grep -n "convoke-export" package.json    # bin -> scripts/portability/convoke-export.js
```

**Prior art in the record.** `convoke-note-backlog-completed-archive.md:1856` already found this and stated it plainly — *"`_bmad/bme/_portability/` is in `package.json` `files` and is installed by nothing anywhere"* — alongside the same defect in `_gyre`'s static assets. Both were deferred. It has been known and unfixed since; nothing bound the finding to a gate, which is Epic 2's spine restated.

## Operator decision

**Accepted 2026-08-30 (Amalik): option (a) — conform `_portability` to the contract.** Story 2.6 is re-authored against C1-C4.

The three subsidiary questions, and how each was resolved:

2. **`_portability` keeps its own module directory.** Implied by (a): the point of conforming is that the module becomes indistinguishable in shape from the other five, and folding it away (option (c)) would move files without settling the contract.
3. **Story 2.4's assertion checks invocability (C2), not presence (C4).** Resolved per the recommendation, and it is the answer that carries the most weight — a presence-only gate goes green on the exact defect it was built to catch. **This obliges an amendment to Story 2.4's AC3, which is currently worded against presence.** See the companion note in Story 2.6's Cross-story dependencies.
4. **Story 2.6 rewrites `INSTALLATION.md:116`.** It is the story that makes the sentence false, so it owns making it true again. Story 2.3 is already oversized (readiness Finding 7) and this is one sentence, not a link-policy question.

> Questions 2-4 were resolved by the recommendation rather than answered individually at the point of acceptance. Each is a one-line reversal if wrong; question 3 is the one to challenge if any.
