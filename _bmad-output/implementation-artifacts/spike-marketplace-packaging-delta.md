---
initiative: convoke
artifact_type: note
qualifier: marketplace-packaging-delta
created: '2026-04-27'
status: draft
schema_version: 1
inputs:
  - https://github.com/bmad-code-org/bmad-plugins-marketplace/pull/9 (rejection thread)
  - https://github.com/bmad-code-org/BMAD-METHOD/tree/main/src/bmm-skills (reference layout)
  - https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/src/bmm-skills/module.yaml (reference schema)
  - https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/src/bmm-skills/module-help.csv (reference schema)
  - _bmad/bme/_vortex/module.yaml (Convoke current schema — minimal)
  - _bmad/bme/_team-factory/module-help.csv (Convoke current Team Factory variant)
  - .claude-plugin/marketplace.json (Convoke marketplace listing)
  - _bmad-output/implementation-artifacts/spike-bmad-interop-findings.md (predecessor spike, 2026-04-26)
---

# Marketplace Packaging Delta — Diagnostic

**Method.** Read-only desk research on BMAD-METHOD's `src/bmm-skills/` reference layout + schema files, cross-referenced with Convoke's current source topology and `marketplace.json`. **No code modified, no installs run.**

**Trigger.** BMAD-METHOD marketplace PR #9 rejected 2026-04-27. Reviewer feedback: "It looks like this might be from an older version of bmad… Ideally your repo will have at the root a skills folder and within the skills folder there should be a `module.yaml` and a `module-help.csv`. Aside from that, everything then should be skills. Skills should have all internal capabilities or reference other skills within the custom module."

**Status framing.** This note is a follow-up to `spike-bmad-interop-findings.md` (2026-04-26), which concluded "🟢 Epic 3 shipped sound" based on source-code analysis but explicitly flagged the test install as the source of truth for actual behavior. The PR rejection IS that test, delivered through a human reviewer rather than an installer log. The two notes do not contradict — gate B (PluginResolver runtime resolution) and gate A (marketplace submission acceptance) are separate. The prior spike addressed gate B; this note addresses gate A.

---

## TL;DR

1. **The structural delta is real but bounded — for Vortex.** Convoke's current `_bmad/bme/_vortex/{agents,workflows,contracts}/` flat-siblings layout differs from BMM's `src/bmm-skills/<phase>/<skill>/` phase-grouped layout in two ways: (a) **layout topology** (sibling folders vs phase-grouped skills); (b) **manifest schema** (Convoke's `module.yaml` is minimal — no `agents:` array, no prompts, no `directories:`). **Vortex is actually the most-compliant of Convoke's three capability modules** — Gyre and Team Factory are further out of shape (see cross-module compliance audit below).
2. **One critical schema-level gap:** **`module-help.csv` is missing for Vortex.** Team Factory has one (with a Convoke-specific column variant); Vortex has none. This is the single most-citable gap against the marketplace contract.
3. **One critical design tension surfaced:** BMM treats every operator-facing capability (agent, workflow, tool) as a skill, listed in `module-help.csv` with a menu code. Convoke's user model is **agent-first** — operators invoke Emma/Isla/Liam, who orchestrate workflow selection. Restructuring all 18 Vortex workflows into top-level marketplace skills *changes the user model*, not just the packaging.
4. **BMB conversion tooling exists and was explicitly cited by the marketplace reviewer.** `bmad-agent-builder` (BA) and `bmad-workflow-builder` (BW) both list "convert" as an action in `_bmad/bmb/skills/module-help.csv`. Worth a 1-hour evaluation before designing custom adapter or restructure work.
5. **Capability tier signal: this is plausibly Tier 2** — a new sub-capability of the export pipeline ("marketplace-package emitter") rather than a Tier 1 skill addition. Final tier judgment goes through `capability-form-factor-evaluation` once Option D (BMB tooling) is evaluated.

---

## Empirical layout comparison

### BMM (reference) — `src/bmm-skills/`

```
src/bmm-skills/
├── module.yaml                   ← Full schema (see below)
├── module-help.csv               ← 26 skill entries, columns: module, skill, display-name, menu-code, description, action, args, phase, after, before, required, output-location, outputs
├── 1-analysis/
│   ├── bmad-agent-analyst/       ← Each subdir IS a skill (agent)
│   ├── bmad-agent-tech-writer/   ← Each subdir IS a skill (agent)
│   ├── bmad-document-project/    ← Each subdir IS a skill (workflow)
│   ├── bmad-prfaq/               ← Each subdir IS a skill (workflow)
│   ├── bmad-product-brief/       ← Each subdir IS a skill (workflow)
│   └── research/                 ← Each subdir IS a skill (utility)
├── 2-plan-workflows/
├── 3-solutioning/
└── 4-implementation/
```

**Key properties:**
- Skills are *phase-grouped* (numbered prefix, semantic phase name).
- Agents and workflows coexist as peers under each phase folder. No `agents/` vs `workflows/` separation.
- `module.yaml` `agents:` array enumerates every agent declaratively (used by `manifest-generator.collectAgentsFromModuleYaml()` per spike note line 40).
- `module-help.csv` enumerates every skill (agent + workflow + utility) with menu code, phase assignment, dependencies.

### Convoke (current) — `_bmad/bme/_vortex/`

```
_bmad/bme/_vortex/
├── module.yaml                   ← MINIMAL: code, name, header, subheader, description, default_selected. NO agents[], NO prompts, NO directories.
├── (NO module-help.csv)          ← MISSING. Team Factory has one; Vortex doesn't.
├── config.yaml
├── README.md
├── compass-routing-reference.md
├── agents/
│   ├── contextualization-expert/SKILL.md
│   ├── discovery-empathy-expert/SKILL.md
│   ├── hypothesis-engineer/SKILL.md
│   ├── lean-experiments-specialist/SKILL.md
│   ├── learning-decision-expert/SKILL.md
│   ├── production-intelligence-specialist/SKILL.md
│   └── research-convergence-specialist/SKILL.md
├── workflows/                    ← 18 active + 2 deprecated, FLAT (not phase-grouped)
├── contracts/                    ← 5 HC*.md files
├── examples/
└── guides/
```

**Marketplace listing (`marketplace.json`):** explicitly lists 7 skill paths under `plugins[0].skills[]`, all pointing at `./_bmad/bme/_vortex/agents/<agent>/`. Workflows + contracts are not enumerated as skills — they're considered agent-internal content.

### Side-by-side delta table

| Dimension | BMM | Convoke | Delta severity |
|---|---|---|---|
| Module root visible at repo root | `src/bmm-skills/` (one path under `src/`) | `_bmad/bme/_vortex/` (under bmad-extension namespace) | LOW — reviewer's "at the root" was likely descriptive, not literal-path-root. BMM is itself nested under `src/`. |
| `module.yaml` exists | ✓ | ✓ | none |
| `module.yaml` schema completeness | Full (code, name, prompts, directories, agents[]) | Minimal (code, name, header, subheader, description, default_selected) | **HIGH** — no `agents:` array means BMAD's manifest-generator can't enumerate agents declaratively. PluginResolver Strategy 5 / synthesize fallback covers runtime, but the marketplace human reviewer is asking for the canonical pattern. |
| `module-help.csv` exists | ✓ | ✗ | **HIGH** — single most concrete gap. Reviewer-citable. |
| Skill organization | Phase-grouped (`<phase>/<skill>/`) | Flat siblings (`agents/`, `workflows/`, `contracts/`) | MEDIUM — debatable whether marketplace requires phase grouping or just one-folder-per-skill. |
| Workflows treated as skills | ✓ — each workflow is its own skill subdir, listed in module-help.csv | ✗ — workflows are agent-internal, not enumerated as marketplace skills | **HIGH (design-level)** — see "User Model Tension" below. |
| Agents treated as skills | ✓ | ✓ | none |
| Each agent in self-contained folder | ✓ | ✓ | none |

---

## Cross-module compliance audit (forward-looking)

The PR rejection was scoped to the `convoke-vortex` plugin. But if Convoke ships additional bme modules to the marketplace later (Gyre is the most plausible candidate per the predecessor spike's open product question, line 70), the same gates apply. Inventory of all `_bmad/bme/` peer modules:

| Module | Type | Agents structure | `module.yaml` | `module-help.csv` | In marketplace |
|---|---|---|---|---|---|
| `_vortex` | capability | 7 agents, **one folder each** with SKILL.md ✓ | ✓ minimal | ✗ MISSING | ✓ |
| `_gyre` | capability | 4 agents, **flat .md files** (model-curator.md, readiness-analyst.md, review-coach.md, stack-detective.md) ✗ | ✗ MISSING | ✗ MISSING | ✗ |
| `_team-factory` | capability | 1 agent, **flat .md file** (team-factory.md) ✗ | ✗ MISSING | ✓ (Convoke variant schema) | ✗ |
| `_enhance` | capability | 0 agents (workflow-only module) | ✗ | ✗ | ✗ |
| `_artifacts` | infrastructure | 0 | ✗ | ✗ | ✗ |
| `_portability` | infrastructure | 0 (skills/ dir only) | ✗ | ✗ | ✗ |
| `_config` | infrastructure | empty | ✗ | ✗ | ✗ |

**Two findings beyond Vortex's scope:**

1. **Gyre is structurally less compliant than Vortex on TWO axes, not one.** No manifest files (matches Vortex's `module-help.csv` gap), AND **agents are flat .md files, not one-folder-per-agent**. That second gap is a bigger structural mismatch than Vortex has — Vortex at least has the folder-per-agent baseline. If Gyre ever goes to marketplace (per spike open product question), this is the additional gating issue.
2. **Team Factory has the same flat-agent problem** plus inverse manifest state (has `module-help.csv`, missing `module.yaml`). Most heterogeneous module of the three.

**Implication for Option A/B/D evaluation.** The conversion learnings from running BMB tooling on Vortex agents apply directly to Gyre and Team Factory if/when those modules go to marketplace. Better to capture the cluster picture now than re-discover it per-module.

**Infrastructure modules (`_artifacts`, `_portability`, `_config`)** are likely correctly without manifest files — they're not user-facing capability modules. Confirm if any need to ship through marketplace for distribution; if so, evaluate separately.

**Out of scope for this diagnostic** but flagged for the operator: the predecessor spike's open empirical check #2 (`_bmad/bme/_gyre/config.yaml` post-install state divergence) remains open and is independent of the structural compliance question above.

---

## Schema-level gaps (concrete, citable)

### Gap 1: Vortex `module.yaml` is missing the `agents:` array

**Current contents (verified):**
```yaml
code: bme
name: "Convoke: Vortex Discovery Framework"
header: "Convoke — Vortex Discovery Framework"
subheader: "7 AI agents for product discovery based on the Shiftup Innovation Vortex"
description: "Domain-specialized agent teams for structured product discovery: Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, Systematize"
default_selected: false
```

**What BMM expects (verified from `src/bmm-skills/module.yaml`):**
```yaml
agents:
  - code: bmad-agent-analyst
    name: Mary
    title: Business Analyst
    icon: "📊"
    team: software-development
    description: "..."
  - code: bmad-agent-architect
    name: Winston
    ...
```

**Effect.** `manifest-generator.collectAgentsFromModuleYaml()` (per predecessor spike line 40) reads this array. With it absent, Convoke relies on PluginResolver Strategy 5 (synthesize from SKILL.md frontmatter) — the fallback path, not the canonical path. The predecessor spike noted this and concluded Strategy 5 was the correct choice given marketplace.json's schema reality. The marketplace reviewer's response calibrates that conclusion: **the canonical path is what humans expect, even if the fallback resolves correctly.**

### Gap 2: Vortex `module-help.csv` does not exist

**Current state:** `_bmad/bme/_team-factory/module-help.csv` exists (2 rows, columns: `module, phase, name, code, sequence, workflow-file, command, required, agent, options, description, output-location, outputs`). `_bmad/bme/_vortex/module-help.csv` does not exist.

**What BMM expects (verified from `src/bmm-skills/module-help.csv`):** columns `module, skill, display-name, menu-code, description, action, args, phase, after, before, required, output-location, outputs` — 26 rows, one per skill (agent + workflow + utility).

**Schema variance.** The Convoke Team Factory variant has different column ORDER and includes `sequence`, `workflow-file`, `command`, `agent`, `options` columns not present in BMM's. If Convoke generates a Vortex `module-help.csv`, it should match BMM's column schema for marketplace acceptance — Team Factory's variant may itself need re-aligning later (out of scope for this note).

**Effect.** The marketplace tooling and the reviewer cite `module-help.csv` as the manifest of skills. With it absent, Convoke has no declarative skill enumeration at the module root — only the implicit `marketplace.json` `skills:` array, which is plugin-marketplace-specific, not BMAD-module-specific.

### Gap 3: Workflows + contracts are not enumerated as skills

This is the *design-tension* gap, not a pure schema gap. Convoke's 18 active Vortex workflows live under `_bmad/bme/_vortex/workflows/<workflow-name>/` with their own `workflow.md` + step files. They are not currently presented to the marketplace as installable skills. They are also not exposed as user-invokable slash commands except where `.claude/skills/bmad-*` wrappers happen to exist.

In BMM's model, every one of these would be a top-level skill with a menu code (e.g., `BV-PV` for "Build Vortex — Product Vision") in `module-help.csv`. That implies a user-invocation surface change, addressed below.

---

## User model tension (the deeper question)

**BMM's user model:** operator opens menu → picks a skill by menu code (e.g., "DS" for Dev Story) → that skill runs, possibly invoking an agent, possibly invoking a workflow. Skills are the unit of operator interaction.

**Vortex's user model (current):** operator invokes a Vortex agent (e.g., "talk to Emma") → agent presents a capabilities table → agent orchestrates workflow selection within its stream. Agents are the unit of operator interaction; workflows are agent-internal orchestration steps.

**Implication for Option A (full restructure to BMM shape):** if every Vortex workflow becomes a top-level skill in `module-help.csv`, operators can now invoke `BV-EMP` (Empathy Map) directly, bypassing Isla. Whether this is **good or bad** is a *product* question, not a *packaging* question:

- **Argument for surfacing workflows as top-level skills:** discovery-by-menu — operators learn the framework by browsing the skill list. Power users get direct access. Aligns with the BMAD ecosystem norm.
- **Argument against:** Vortex's value prop is the *agent-driven orchestration*. The 7 streams are the navigation; bypassing the agent means bypassing the routing logic that makes the Vortex coherent. Top-level workflow skills could fragment the experience and undercut the agent-first positioning.

**Honest read:** this question wasn't load-bearing while Convoke was an opinionated extension. It becomes load-bearing the moment Convoke ships through the marketplace, because marketplace consumers see the `module-help.csv` menu first and the agent persona second.

**This is a `bmad-cis-design-thinking` or `wds-3-scenarios` question, not just an architecture question.** Out of scope for this diagnostic; flagged here as a precondition to lane-assignment.

---

## Options (cost / benefit / risk)

### Option A — Full restructure to BMM shape (canonical)

**Action:** rehome `_bmad/bme/_vortex/` into phase-grouped skills:
```
_bmad/bme/_vortex/
├── module.yaml (expanded with agents[], prompts, directories)
├── module-help.csv (NEW — list 7 agents + 18 workflows = 25 skills)
├── 1-contextualize/
│   ├── bme-agent-emma/
│   └── bme-workflow-product-vision/
├── 2-empathize/
│   ├── bme-agent-isla/
│   ├── bme-workflow-user-discovery/
│   ├── bme-workflow-empathy-map/
│   ├── bme-workflow-user-interview/
│   └── bme-workflow-research-convergence/
├── 3-synthesize/
├── ... (4-hypothesize, 5-externalize, 6-sensitize, 7-systematize)
└── contracts/  (decision: keep at module root, or distribute per-phase)
```

| | |
|---|---|
| **Cost** | High. ~25 skill folders to rehome. All cross-references in agent SKILL.md, retros, contracts, tests, audits, the Operator Covenant inventory must be updated. Likely 5-10 stories of rehome + reference-sync work. |
| **Benefit** | Marketplace-canonical. Strategy 1 (root manifest) becomes available, not just Strategy 5 fallback. Future BMAD upgrades have lower friction. Resolves the user-model tension by *committing* to skill-first surface. |
| **Risk** | Breaks the agent-first user model unless explicitly designed around. Reference rot is a fixture-isolation rule violation risk if not done carefully. Also: a partial restructure (workflows-only) leaves Convoke in a third hybrid shape, worse than either canonical option. |
| **When this is right** | If product owner concludes the agent-first user model is a *historical* choice, not a *load-bearing* differentiator. |

### Option B — Build a marketplace-export adapter

**Action:** preserve canonical `_bmad/bme/_vortex/{agents,workflows,contracts}/` source. Add `scripts/marketplace/build-package.js` that reads source, emits `dist/marketplace/skills/` directory in BMM shape with phase grouping + module.yaml expansion + module-help.csv generation. Marketplace plugin publishes the *built artifact*, not the source layout. CI step builds and validates the package before submission.

| | |
|---|---|
| **Cost** | Medium. New emitter script — similar architecturally to existing `convoke-export.js`. Phase-assignment mapping table (which workflow lives in which phase) must be authored — likely derivable from `compass-routing-reference.md`. New CI gate for build-and-validate. ~2-3 stories. |
| **Benefit** | Source preserves Convoke's agent-first clarity. The 40% Vortex Standalone segment continues to work via existing `convoke-export`. Two emitters from one source — same architectural pattern as the existing portability layer. |
| **Risk** | Adapter complexity could grow with each BMAD release. Some BMM patterns may not round-trip cleanly. **Critical risk:** the marketplace reviewer said "It looks like this might be from an older version of bmad" — submitting a built artifact that *looks* canonical but is generated from a different shape may be re-read as evasion rather than adoption. Reviewer relationship matters. |
| **When this is right** | If product owner concludes the agent-first user model is load-bearing AND the maintenance overhead of the emitter is acceptable. |

### Option C — Manifest-only minimal patch

**Action:** keep current layout. Add `_bmad/bme/_vortex/module-help.csv` with 7 rows (one per agent skill). Expand `_bmad/bme/_vortex/module.yaml` with `agents:` array. Re-submit PR.

| | |
|---|---|
| **Cost** | Very low. Two file additions. ~half a story. |
| **Benefit** | Minimal disruption. Tests whether the manifest contract alone is sufficient, or whether topology is the real gate. |
| **Risk** | The reviewer said "all content should be self-contained skills" — that's a topology statement, not just a manifest one. Option C may fail the same gate again, burning reviewer goodwill. |
| **When this is right** | If we want a cheap empirical check before committing to A or B. The cost of failure is one more PR rejection, which we've already absorbed. |

### Option D — Use BMB conversion tooling

**Action:** invoke `bmad-agent-builder` (BA action `build-process` "convert" mode) on each of the 7 Vortex agents and `bmad-workflow-builder` (BW action `build-process` "convert" mode) on each of the 18 workflows. Inspect output, decide whether to keep as canonical source or treat as adapter output (Option B).

**Verified.** `_bmad/bmb/skills/module-help.csv` confirms BA and BW both list "Create, edit, **convert**, or fix" in their action descriptions. Convoke ships the BMB module under `_bmad/bmb/skills/`, so the tooling is locally available.

| | |
|---|---|
| **Cost** | Low (1-2 hours of evaluation). Run BA/BW convert on one agent + one workflow, inspect output. |
| **Benefit** | Authoritative — uses upstream's tooling. Zero risk of misinterpreting the contract. The marketplace reviewer explicitly cited this path: "The bmad builder skills can also help you convert as needed." Following the cited path signals goodwill. |
| **Risk** | May not handle Convoke's specific shape (HC contracts, BME-specific frontmatter, multi-team patterns). May require manual fixup after conversion. Output may force Option A topology (phase grouping) — that's a feature if we like it, a bug if we don't. |
| **When this is right** | **Always run this first.** It's the cheapest possible way to learn whether the conversion is mechanical or surfaces design choices. The output informs which of A/B/C is the right destination. |

---

## Recommendation

**Sequence:**

1. **Run Option D first (1-2 hours).** Evaluate BMB's conversion tooling on one agent (`contextualization-expert`) and one workflow (`product-vision`). Inspect what it produces. Two outcomes:
   - **D.1 — Output is acceptable as canonical source.** Path to Option A is paved. Reduce restructure cost from "hand-rehome 25 skills" to "run conversion + manual review + reference-sync."
   - **D.2 — Output is mechanically correct but not a shape we want as canonical.** Path to Option B is paved. The conversion output becomes the emitter's reference target.
2. **Defer the user-model question until after D evaluation.** If BMB's conversion *forces* a user-model decision (e.g., it assumes workflows are top-level skills), that decision becomes part of the diagnostic, not a separate phase.
3. **Don't run Option C as a standalone bet.** It's plausible the manifest-only patch is enough, but if it isn't, the second rejection costs more than the first. If we run C, run it as a *sub-step* of A or B with the manifest files generated correctly the first time.

**Initiative-vs-Fast-Lane recommendation (precondition: D evaluation completes).**

- If D.1 outcome → Path to A is bounded enough that the work plausibly fits in **Initiative Lane** as "Vortex marketplace shape adoption" — bundles-with I95, supersedes I95's smoke-test framing (since the smoke-test premise was "install can happen," and this work is "make install possible"). 5-10 stories is initiative-sized.
- If D.2 outcome → Path to B is **definitely a new capability** ("marketplace-package emitter"). Goes through `capability-form-factor-evaluation` per the rule. Likely Tier 2 (sub-capability of export pipeline). Likely Initiative Lane row, bundles-with the existing `_bmad/bme/_portability/` architecture.

**Not recommended:** treating this as Fast Lane. The work crosses too many systems (manifest schema, layout, user model, test references, marketplace.json, CI) to be safely scoped as a single Fast Lane bug.

---

## Open questions for the operator

1. **Run Option D evaluation now, or schedule it as its own bounded story first?** The 1-2 hour evaluation could be done in this session or stand up as `marketplace-d-evaluation` story. Recommend the former — it directly answers I95's blocking question.
2. **User-model commitment.** Before Option A is viable, product needs to confirm the agent-first model is renegotiable. Recommend a Freya / Saga session (`wds-agent-freya-ux` or `wds-agent-saga-analyst`) before committing to A. Option B *can* proceed without this commitment because source layout doesn't change.
3. **Where does the `module-help.csv` schema variant live?** Team Factory's column schema diverges from BMM's. If Convoke needs a canonical Convoke-specific extension to BMM's CSV schema, that's a documented standard to author (likely a P21 Operator Covenant row or a new Fast Lane spec). Out of scope for this diagnostic.
4. **Does I95 absorb this work or get superseded?** I95 was scoped as smoke-test + minor adoption (channel field). This work is structural pre-install adoption. Recommend: **I95 stays as smoke-test post-install** (executes after this work ships); a new initiative row captures the structural adoption. Cross-reference both ways.

---

## Honest notes on epistemic limits of this diagnostic

1. **Read-only desk research, again.** I did not run BMB conversion tooling. Option D's actual output is unknown until evaluation runs. The recommendation to "run D first" is precisely *because* this gap exists.
2. **Single-skill BMM inspection.** I inspected `src/bmm-skills/1-analysis/` directory listing only — not internal contents of an individual skill subdir. The claim "each skill is self-contained" is inferred from the marketplace reviewer's wording + the module-help.csv enumeration pattern, not from direct inspection of (e.g.) `bmad-document-project/SKILL.md`. If structure inside a BMM skill subdir reveals additional patterns, the recommendation may shift.
3. **User-model tension is real but possibly soluble within Option B.** I framed it as a precondition to Option A, but Option B *also* surfaces it: emitting workflow-as-top-level-skill in the marketplace package while keeping agent-first in source means marketplace consumers experience a different user model than direct-install consumers. Not necessarily bad, but worth naming.
4. **Reviewer relationship dynamics.** The marketplace reviewer offered help via Discord and signaled goodwill. The recommendation to use BMB tooling first is partly *technical* (it's the canonical path) and partly *political* (following their cited path is the relationship-positive move). I'm naming the political read explicitly so the operator can weigh it.
5. **No verification that Convoke's agent SKILL.md frontmatter currently passes BMM's expected SKILL.md schema.** The conversion may reveal frontmatter gaps in our agent skills. Out of scope for this note; would surface during Option D evaluation.

---

## Cross-references

- Predecessor spike: `_bmad-output/implementation-artifacts/spike-bmad-interop-findings.md` (2026-04-26) — gate B analysis (PluginResolver runtime resolution).
- Backlog: I95 (Fast Lane, BMAD v6.4/v6.5 compat recon + minor adoption) — empirical check #1 ("Vortex agents in `_bmad/config.toml` post-marketplace-install") is the blocked-on-this-work test.
- Memory: `project_v63_adoption.md` (current Convoke 4.0 adoption status), `project_two_product_framing.md` (60% marketplace / 40% standalone-Vortex split).
- Rule: `capability-form-factor-evaluation` in `project-context.md` (gates lane assignment for new capabilities).
- Tooling: `_bmad/bmb/skills/bmad-agent-builder/` (BA), `_bmad/bmb/skills/bmad-workflow-builder/` (BW) — both list "convert" as an action.
