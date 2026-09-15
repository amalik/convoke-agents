---
initiative: convoke
artifact_type: note
created: '2026-09-14'
schema_version: 1
status: draft
---

# Convoke Maturity Ledger

## 1. Client-facing ledger

*Basis: the published package convoke-agents 4.0.2, the current release on npm, assessed 14–15 September 2026. "Shipped" and "works" mean verified by running the software or by an automated test that exercises it. No team's conversation quality is measured by automated tests.*

| Capability | What it does for you | Status | Ownership | Honest note |
|---|---|---|---|---|
| Vortex product-discovery team | Seven specialist agents take a team from framing the problem through research, hypotheses and experiments to a pivot, patch or persevere decision, across 22 guided workflows. | Works with limits | Convoke | All seven install and appear as commands in Claude Code. Three use the current BMAD agent format. Four still use the previous format and are scheduled for conversion. |
| Vortex hand-off contracts | Standard templates for what each discovery stage passes to the next, plus guidance on which agent picks up. | Shipped | Convoke | Five hand-off templates and five routing rules. Agents are instructed to follow them. No software checks a document against its template. |
| Gyre production-readiness team | Four agents detect your technology stack, build a capability model, find readiness gaps and review them with you, across 7 workflows. | Works with limits | Convoke | Installs with Convoke and appears in Claude Code. Still classed internally as in development: all four agents use the previous format, the team cannot yet be packaged for a plugin marketplace, and its team guide is not copied into your project. |
| Team Factory | Guides a contributor through designing a new agent team and saves the decisions as a resumable specification. | Works with limits | Convoke | Preview. The design steps run. Generation has not yet produced a team that works end to end, and the installer does not pick up a generated team. It runs from Convoke's source repository and relies on BMAD's agent builder. Under active repair. |
| Adding an agent or skill to an existing team | Extend a team without rebuilding it. | Mapped, not built | Convoke | Documented as planned. Some groundwork code exists, but no workflow uses it. |
| Enhance: initiative backlog skill | A RICE-scored workflow for capturing, triaging and re-scoring initiatives. | Works with limits | Convoke | Available as a direct command. It is meant to appear in BMAD's product-manager agent menu, which happens only on older BMAD layouts. It is the only Enhance skill so far. |
| Artifact governance and portfolio view | Reports each initiative's phase, status and next step from your planning documents. Renames older documents to a naming standard. | Works with limits | Convoke | The command-line report runs but under-reports which initiatives are active. The renaming tool targets older file names and flags already-compliant files for manual review. The guided in-chat versions point at a script location that does not exist in an installed project. |
| Export to GitHub Copilot and Cursor | Turns a skill into a portable instruction document, with ready-to-copy files for Copilot, Cursor and Claude Code. | Works with limits | Convoke (the tool). Most skills that export in full are BMAD ecosystem. | You copy the files into place by hand, and nothing tests that those tools load them. Convoke's own team agents export only as a notice that they need a full Convoke install. The guided in-chat version has the same script-location problem as above; the command-line tool works. |
| Operator Covenant | A published standard: when a skill cannot resolve something, it hands you the decision with a default, a way to override it and the reason it matters. | Works with limits | Convoke | Applied through review, not enforced by software. An April 2026 review of eight skills found 46 of 56 checks passing (82%). Fixes for the discovery team's failing area, the pacing of questions, are in review. |
| Installation and health check | One command installs the teams, with or without BMAD Method. A health check confirms the installation or names what is broken. | Shipped | Convoke | Verified on a clean project: it installed, passed every health check, and correctly failed a deliberately damaged copy. Installs for Claude Code only. A "BMAD core not detected" warning appears on standalone installs even when nothing is wrong. |
| Upgrades | Upgrades an existing installation in place, taking a backup first. | Shipped | Convoke | Verified by upgrading a 3.3.0 installation to 4.0.2. The health check passed afterwards. |
| Release pipeline | CI builds each release from a tagged commit. It must pass the tests and a clean-install trial, and it carries signed build provenance. | Shipped | Convoke | Verified for 4.0.2: every release gate passed and the provenance attestation verifies. The pipeline does not yet re-check the published result automatically. |
| Plugin marketplace distribution | Installing Convoke from the BMAD plugin marketplace. | Mapped, not built | Convoke | The listing metadata is included, but Convoke is not listed. The submission was declined on packaging structure and has not been resubmitted. Install through npm instead. |
| Use in chat windows (e.g. Claude.ai) | Documentation suggests pasting an agent file into a conversation. | Mapped, not built | Convoke | No tooling supports this path, and the agents expect project files a chat window does not have. Not tested in a live session. |
| Further lifecycle phases: Strategy, Growth, Delivery, Security, Operations, Sunset | Coverage of the lifecycle beyond discovery and readiness. | Mapped, not built | Convoke (vision) | Described in an exploratory vision document that says it is not a commitment to build. No agents exist. Gyre assesses security readiness gaps, but nothing fixes them. |
| Proposed teams: Forge (knowledge capture), Helm (portfolio steering) | Named future teams. | Mapped, not built | Convoke (proposed) | Forge is waiting on an external pilot engagement. Helm's engine is fully designed, but none of it is built. Other names in circulation (Sentinel, Conduit, Pulse, Compass, Ledger) have no agreed scope or owner. |

*Design (WDS), build and test (BMM, TEA), creative facilitation (CIS) and agent building (BMB) are BMAD Method ecosystem modules. Convoke does not ship or maintain them, and this ledger does not assess them. WDS is a separate BMAD extension. Convoke is built to run alongside them, but that combination was not trialled for this ledger.*

---

## 2. Evidence appendix

### 2.0 Basis, shorthand, and rules applied

- **Shorthand:**
  - `$SP` = `$SCRATCH` (a temporary working directory outside the repository)
  - `$P` = `$SP/pub/x/package` (the published 4.0.2 tarball, extracted)
  - `$T` = `$SP/trial` (a clean project with 4.0.2 installed from the registry)
  - Backlog = `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`
- **Repo state when assessed:** HEAD `0db3aac8`, which is `v4.0.2-5-g0db3aac8` (five commits after the release tag). The working tree has uncommitted changes that belong to another session; none were touched.
- **Materiality rule:** a defect moves a row to *Works with limits* when it affects the documented outcome. Cosmetic or diagnostic defects are stated in the row's note but do not downgrade it.
- **What "works" could not cover:** no agent was activated in a live LLM session. For agent and workflow rows, "works" means the agent installs, its command wrapper resolves to a file that exists, and structural tests pass in CI. Conversation behaviour is unverified for every team.

#### Version and publication

```
$ npm view convoke-agents dist-tags --json
{ "rc": "4.0.1-rc.0", "latest": "4.0.2" }
$ npm view convoke-agents time --json | tail -2
  "4.0.1": "2026-08-23T22:46:20.186Z",
  "4.0.2": "2026-09-14T08:29:49.928Z"
$ npm view convoke-agents@4.0.2 dist --json      (trimmed)
  shasum add6b5e3c097a6e21c55bf0c197ba962616e8f0f, fileCount 466, unpackedSize 3272081
  attestations.provenance.predicateType: https://slsa.dev/provenance/v1
$ npm view convoke-agents@4.0.2 gitHead
a77cfefe5a8718a5cf85fd46efe70e1975df1f43
$ git rev-parse v4.0.2^{commit}
a77cfefe5a8718a5cf85fd46efe70e1975df1f43
```

The `rc` dist-tag still points at `4.0.1-rc.0`, which is older than `latest`. This is harmless but stale; backlog row T43 covers `rc` downgrade protection.

#### What ships

- `package.json` `files[]` lists these `_bmad/bme/` entries:
  - `_vortex`, `_enhance`, `_gyre`, `_artifacts`, `_portability`, `_team-factory`
  - two named covenant files
  - also `_bmad/_config/skill-manifest.csv`, `.claude-plugin/`, `.claude/skills/bmad-audit-skill-dirs/`, `docs/migration/`, `scripts/`, `src/`, and the root docs
- Lifecycle scripts: `grep '"prepack\|"prepare\|"prepublish' package.json` returns nothing. The only lifecycle script is `postinstall`, which prints guidance.

```
$ npm pack convoke-agents@latest --pack-destination $SP/pub  → convoke-agents-4.0.2.tgz, 466 files
$ find $P/_bmad/bme/<module> -type f | wc -l
  _vortex 226 · _gyre 54 · _enhance 23 · _artifacts 12 · _portability 9 · _team-factory 30 · covenant 2
$ npm pack --dry-run --json   (repo HEAD working tree) → 468 entries
$ diff <published file list> <dry-run file list>
  > _bmad/bme/_team-factory/lib/utils/output-directory.js
  > _bmad/bme/_team-factory/lib/utils/run-context.js
```

The two extra files were added after the tag. **The published tarball is the basis for every "ships" claim below.**

#### Backlog basis

Lanes were parsed with the repo's own `parseTables`/`isClosed`, exported from `scripts/audit/backlog-integrity.js`. The script is `$SP/lanes.js`.

```
HEAD (git show HEAD:<backlog>):  live lane rows 231 = Bug 3 + Fast 213 + Initiative 15; closed-in-lane 0; Intakes 192
working tree (uncommitted):      live lane rows 234 = Bug 3 + Fast 216 + Initiative 15
```

Intake rows (§2.1) have no Portfolio column, so the per-team counts below cover lanes §2.2–§2.4 only.

---

### 2.1 Vortex product-discovery team: Works with limits · Convoke

**Format of each agent, from the shipped files.** Commands:

```
$ for d in $P/_bmad/bme/_vortex/agents/*/; do f=$d/SKILL.md; echo "$d lines=$(wc -l <$f) <agent=$(grep -c '<agent ' $f) <activation=$(grep -c '<activation' $f) ##=$(grep -c '^## ' $f)"; done
```

Results:

| Agent file | Lines | `<agent` | `<activation` | `##` headings |
|---|---|---|---|---|
| contextualization-expert/ (Emma) | 71 | 0 | 0 | 6 |
| lean-experiments-specialist/ (Wade) | 73 | 0 | 0 | 6 |
| research-convergence-specialist/ (Mila) | 69 | 0 | 0 | 6 |
| discovery-empathy-expert/ (Isla) | 117 | 1 | 1 | 0 |
| hypothesis-engineer/ (Liam) | 117 | 1 | 1 | 0 |
| production-intelligence-specialist/ (Noah) | 117 | 1 | 1 | 0 |
| learning-decision-expert/ (Max) | 117 | 1 | 1 | 0 |

- **v6.3 markdown (3):** Emma, Wade, Mila. Each has frontmatter `name: bmad-bme-agent-*`, the sections Overview, Identity, Communication Style, Principles, Capabilities and On Activation, and a `references/` directory.
- **v5 XML-in-markdown (4):** Isla, Liam, Noah, Max. Each has a fenced `xml` block containing `<agent id="…agent.yaml" name="…">` and `<activation critical="MANDATORY">`.

**Inconsistencies found while checking the conversion status:**
- `package.json` `//files` still reads "I97 Epic 2 is 2 of 7 done". The files show 3 of 7.
- `sprint-status.yaml` has `i97-2-3-convert-mila-research-convergence-specialist: in-progress`, even though Mila's converted file shipped. Stories 2-4 through 2-7 are `ready-for-dev`.
- `$P/_bmad/bme/_vortex/module-help.csv` lists only the 3 converted agents.

**Workflows.** `$P/_bmad/bme/_vortex/config.yaml` declares 22 workflows. `ls workflows` shows those 22 plus `_deprecated/`.

**Install trial** (clean project, registry package):

```
$ cd $T && npm init -y && npm install convoke-agents@4.0.2        → exit 0
$ npx --no-install convoke-install                                → exit 0
    Refreshed agent: contextualization-expert/SKILL.md … learning-decision-expert/SKILL.md (7)
    Refreshed workflow: lean-persona … vortex-navigation (22)
    ✓ Emma skill … ✓ Max skill
$ ls $T/.claude/skills | wc -l                                    → 19   (7 Vortex agent wrappers among them)
$ npx --no-install convoke-doctor                                 → exit 0
    ✓ _vortex agents 7 agents present · ✓ _vortex workflows 22 workflows present
    ✓ BME agent skill wrappers 12 agent skill wrappers verified
```

**Path resolution in the installed tree.** Command:

```
$ grep -rhno "{project-root}/_bmad/bme/_[a-z-]*/[…]" _bmad/bme .claude/skills | sort -u  → 235 unique paths
```

Seven paths dangle, and all seven are in `_vortex/workflows/_deprecated/wireframe/` (they point at `_designos`). Every `./references/*.md` target named in the 3 converted agents exists.

**Tests (CI).** CI run `34822641000` on tag `v4.0.2`:
- `test (22)`: unit/team-factory/lib/audit suite `tests 2432 · pass 2431 · fail 0 · skipped 1`; integration suite `tests 124 · pass 124`.
- `coverage` job (adds `tests/p0`): `tests 3198 · pass 3197 · fail 0 · skipped 1`.

P0 suites cover each agent (`tests/p0/p0-{emma,isla,mila,liam,wade,noah,max}.test.js`), workflow structure and handoff contracts. They are **structural** (file shape, menu codes, schema tables), not behavioural. CHANGELOG 4.0.0 says so itself: "Convoke 4.0 makes no behavioural-equivalence claim."

**Backlog rows that bear on this row:**
- **T140** (Open): all 3 converted agents' persona text has drifted from `agent-registry.js`. The voice test `tests/p0/p0-voice-consistency.test.js` checks marker phrases only, so it cannot detect this.
- **T135** (Open): the personality-preservation harness has never executed; 9 of its 10 fixtures are invalid JSON. **No evidence of persona preservation across conversion exists.**
- **I97**: Initiative Lane, "In Pipeline — E2 at 3 of 7".
- **P13** (Qualified, blocked on P12): the Vortex redesign.
- **Portfolio `vortex`:** one live row at HEAD, which is P13.

**Observed defects I found no backlog row for.** The keyword searches were `bmad-init`, `customize`, `HELP_STEP`; treat this list as a floor.

1. **The converted agents' first activation step calls a skill a standalone install does not have.**
   - Emma, Wade and Mila read `1. **Load config via bmad-init skill**` (`$P/_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md`, "On Activation").
   - `ls $T/.claude/skills | grep -i init` returns nothing.
   - In the repo, `_bmad/core/bmad-init/` holds only `.bak` files (moved aside by commit `a16fa340`, 2026-06-27).
   - CHANGELOG 4.0.0 §Removed says "`bmad-init` skill — Removed" and §Changed says agents "load configuration directly from `_bmad/{module}/config.yaml`". The shipped converted agents do not do that.
   - Impact in a live session is **unverified**; see §3.
2. All 9 v5 XML agent files (4 Vortex, 4 Gyre, Team Factory) carry a literal unsubstituted `<step n="{HELP_STEP}">`. This is cosmetic.
3. The installer writes `_bmad/_config/agents/bme-<name>.customize.yaml` for 11 agents, but no agent file or wrapper references them (`grep -rln customize` over installed agents and wrappers). No doc claims this as a feature, so it is observed only and not a ledger claim.

**Why Works with limits:** the conversion is incomplete (3 of 7), which the status definition names explicitly. The one-shot activation defect in the converted agents is unverified in impact. Persona preservation is unmeasured. The agents do install and resolve, so this is not *Mapped, not built*.

---

### 2.2 Vortex hand-off contracts: Shipped · Convoke

```
$ ls $P/_bmad/bme/_vortex/contracts
hc1-empathy-artifacts.md  hc2-problem-definition.md  hc3-hypothesis-contract.md  hc4-experiment-context.md  hc5-signal-report.md
$ ls $T/_bmad/bme/_vortex/contracts        → same 5 files (installed into the project)
$ grep -rn "HC[0-9]*" -o $T/_bmad/bme/_vortex/workflows | sed 's/.*://' | sort | uniq -c
  38 HC1 · 54 HC2 · 60 HC3 · 84 HC4 · 60 HC5 · 1 HC6 · 1 HC7 · 1 HC8 · 3 HC9 · 18 HC10
```

- **HC1–HC5** are schema documents. `_bmad/bme/_vortex/README.md:73` calls them "Artifact Contracts (HC1-HC5) — schema files in `contracts/`".
- **HC6–HC10** are routing rows. `_bmad/bme/_vortex/README.md:82` says "Routing Contracts (HC6-HC10) — no schema files, defined in compass-routing-reference".
- `_bmad/bme/_vortex/compass-routing-reference.md:53` says "HC9/HC10 … ship as Compass guidance rows in the source agent's final step. A full mid-workflow interrupt pattern is deferred."
- `compass-routing-reference.md` and the Vortex README ship in the package but are not copied into the project. The routing rows the agents use live in the installed step files, so nothing dangles.
- **Test:** `tests/p0/p0-handoff-contracts.test.js` parses each HC schema's YAML block and field table. It runs in the CI `coverage` job, which passed at the tag.

**Why Shipped:** the shipped docs describe exactly what ships: five schemas and five guidance-level routing rules, with the interrupt pattern openly deferred. The client note states the one thing a reader might otherwise assume: conformance is by instruction, not software validation.

---

### 2.3 Gyre production-readiness team: Works with limits · Convoke

```
$ for f in $P/_bmad/bme/_gyre/agents/*.md; do …; done
  model-curator.md lines=128 <agent=1 name="Atlas" · readiness-analyst.md 127 name="Lens"
  review-coach.md 130 name="Coach" · stack-detective.md 125 name="Scout"      → all 4 are v5 XML
$ find $P/_bmad/bme -name module.yaml -o -name module-help.csv
  _vortex/module.yaml · _vortex/module-help.csv · _team-factory/module-help.csv       → Gyre has neither
$ ls $P/_bmad/bme/_gyre   → README.md agents compass-routing-reference.md config.yaml contracts guides workflows
$ ls $T/_bmad/bme/_gyre   → README.md agents config.yaml contracts workflows          (no guides/, no routing reference)
$ cat $T/.claude/skills/bmad-agent-bme-stack-detective/SKILL.md
  1. LOAD the FULL agent file from {project-root}/_bmad/bme/_gyre/agents/stack-detective.md   (file exists)
$ npx --no-install convoke-doctor → ✓ _gyre config 4 agents, 7 workflows · ✓ _gyre agents 4 agents present
$ node node_modules/convoke-agents/scripts/install-gyre-agents.js   (separate scratch project) → exit 0, "All Gyre Agents Installed!"
```

- **Tests:** `tests/integration/fresh-install.test.js:251` asserts 12 agent rows (7 Vortex + 4 Gyre + Team Factory). It passed in CI.
- **`_bmad/bme/_config/name-registry.csv`** (repo; not shipped) has `team,gyre,…,in-dev,…,"4 agents, 7 workflows; NO module.yaml and NO module-help.csv, so it cannot be packaged…"`. Agents Lens, Scout, Coach and Atlas are all `in-dev`.

**Backlog rows (portfolio `gyre`, HEAD):**
- **T91** (Open): Gyre `guides/` and `compass-routing-reference.md` ship but never install. `_gyre/README.md:69` names the routing file. The install trial confirms this.
- **I98** (Reinstated): "Gyre cannot be installed or invoked through any supported path…". **The 4.0.2 install trial contradicts this headline for the npm installer + Claude Code path**: wrappers are generated and resolve. The row's structural facts (flat agent files, no `module.yaml`/`module-help.csv`) are still true and still block marketplace packaging. See §3.

**Covenant audit:** `convoke-report-operator-covenant-audit-gyre-2026-04-25.md` is marked PROVISIONAL ("A10 gate FAILED") and flags Right to a default and Right to pause.

**Why Works with limits:** Gyre installs and resolves, but the internal status is `in-dev`, the format is unconverted, marketplace packaging is blocked, and part of its documentation does not install.

---

### 2.4 Team Factory: Works with limits · Convoke

**What ships:**
- 30 files under `$P/_bmad/bme/_team-factory/`: agent `team-factory.md` (v5 XML), `workflows/step-00-route.md` and `workflows/add-team/step-01..05` (**one workflow, add-team**), plus `lib/` writers, validators, schemas and templates.
- It installs: `✓ _team-factory agents 1 agents present`, wrapper `bmad-agent-bme-team-factory`.

**It targets the Convoke source repository and upstream BMB:**
- `$P/_bmad/bme/_team-factory/workflows/add-team/step-04-generate.md` §Placeholders defines "`{registry_path}` | absolute path to `scripts/update/lib/agent-registry.js`". Its generation plan item 9 is "Registry block in `scripts/update/lib/agent-registry.js`". An installed project has no `scripts/` directory (`ls $T/scripts` → No such file or directory).
- The same file's Purpose says "Generate all team files through BMB delegation". BMB is upstream BMAD.

**The installer does not walk a generated team:**

```
$ grep -n "for (const agent of" $P/scripts/update/lib/refresh-installation.js
  764/825: AGENTS · 854: GYRE_AGENTS · 229/880: EXTRA_BME_AGENTS
$ sed -n 12p … refresh-installation.js
  const { AGENTS, …, GYRE_AGENTS, …, EXTRA_BME_AGENTS } = require('./agent-registry');   (fixed names; no dynamic discovery)
$ grep -n "_AGENTS" $P/_bmad/bme/_team-factory/lib/writers/registry-writer.js
  322: lines.push(`const ${prefix}_AGENTS = [`);                                          (a new, separately named array)
```

**Track record:**
- `_bmad-output/implementation-artifacts/tfr-1-1-generate-one-real-team-without-hand-patching.md` (HEAD): "The Team Factory has produced **zero surviving teams**… `tf-2-11`'s pilot team was deleted by its own AC8."
- `tf-2-11-end-to-end-pilot-run.md` §Completion Notes records "Steps 0-3 executed against the live factory" with 7 findings. §Full Pilot Run records "AC#7 is unmet" (terminal validation `valid:false`) and findings 8–15, including "the activation validator cannot pass any agent that has ever shipped".
- `sprint-status.yaml`: `tfr-epic-1: in-progress`, `tfr-1-1…: in-progress`.

**Open rows: 22 live rows with Portfolio `loom` in lanes §2.2–§2.4 at HEAD `0db3aac8`, all in the Fast Lane and none closed.** The uncommitted working tree adds T171, T172 and T173, giving 25. At least two HEAD rows (T167 `run-context.js`, T169 `output-directory.js`) concern files added after v4.0.2.
- **HEAD rows:** T136, T168, T128, T139, T163, T164, T170, T132, T134, T127, T165, T167, T147, T137, T138, T166, T169, T141, T151, I7, I9, I68.
- **Rows most relevant to the client note:**
  - **T128**: the terminal gate "can never report success where teams are actually built". HEAD commit `0db3aac8` reworks it, after the release.
  - **T147**: "a factory-built team is installed by nothing at all". Verified above.
  - **T127**: emits v5 XML agents and hard-fails v6.3. Ruled 2026-09-11 as accepted.
  - **T136**: the `run:` blocks cannot be pasted with real data.
  - **T164**: steps can be skipped while the flow reports success.

**Shipped documentation overclaims.** `README.md:100` says "Output passes the same validation as the native teams." This is contradicted by T128 and by `tf-2-11` AC#7. Do not repeat it in the whitepaper.

**Why Works with limits (and not Shipped):** it ships, and its design steps have been executed, but the documented outcome (a new, validated, installable team) has never been achieved. See §3 for the case for a stricter classification.

---

### 2.5 Adding an agent or skill to an existing team: Mapped, not built · Convoke

- `README.md:100` (shipped): "Adding an agent to an existing team, or a skill to an existing agent, is planned for Phase 3 and not yet available."
- `find $P/_bmad/bme/_team-factory -path '*workflows*'` returns only `step-00-route.md` and `add-team/*`. There is no add-agent or add-skill workflow.
- **T139** (Open): `tf-epic-3` reads `done`, but `registry-appender.js`, `config-appender.js` and `csv-appender.js` "have no caller outside `lib/writers/` itself". These three files are in the tarball (`$P/_bmad/bme/_team-factory/lib/writers/`).
- **P25** (Team Factory Phase 3) is in §2.5 "Aged out".

**Why Mapped, not built:** named in docs, and no invocable workflow ships.

---

### 2.6 Enhance: initiative backlog skill: Works with limits · Convoke

```
$ find $P/_bmad/bme/_enhance -type f  → 23 files: one workflow `initiatives-backlog` (steps-c/-r/-t), templates, ENHANCE-GUIDE.md, extensions/bmm-pm.yaml
$ cat $P/_bmad/bme/_enhance/config.yaml → workflows: initiatives-backlog, target_agent: bmm/agents/pm.md
$ npx --no-install convoke-install (standalone)
    Refreshed Enhance module: _bmad/bme/_enhance/
    ⚠ bmm/agents/pm.md not found — BMM module must be installed first. Skipping Enhance menu patch.
$ ls $T/.claude/skills | grep enhance → bmad-enhance-initiatives-backlog
$ npx --no-install convoke-audit-skill-dirs → "19 skill dir(s) audited; all passed."
$ npx --no-install convoke-export --all → exports bmad-enhance-initiatives-backlog (7 warnings), exit 0
```

- `README.md:94` (shipped): the menu patch "lands only where that agent exists as a file — on BMAD v6.3+ layouts, where agents are skills rather than `.md` files, the slash command is the working path."
- **Backlog:** portfolio `enhance` has 13 live rows at HEAD. Most concern the portfolio and migration tooling (I18, I21, I22, I23, I25, I26, I28, I51, I72, P22) and blocked skill modes (I62, I93). **P12** "Enhance framework — Team Module Generator (BMB)" is Qualified and not built.
- `name-registry.csv`: `team,enhance,…,in-dev,…,"0 agents, 1 workflow. A module, not a team"`.

**Why Works with limits:** the skill installs and is invocable. The "extend an existing agent" mechanism that gives the module its name does not land on current BMAD layouts or in standalone installs.

---

### 2.7 Artifact governance and portfolio view: Works with limits · Convoke

**Shipped surface:**
- Bins `convoke-portfolio` → `scripts/lib/portfolio/portfolio-engine.js` and `convoke-migrate-artifacts` → `scripts/migrate-artifacts.js`.
- Skills `bmad-portfolio-status` and `bmad-migrate-artifacts` (`$P/_bmad/bme/_artifacts/`, 12 files).
- Wrappers are generated at install (`Generated skill wrapper: bmad-migrate-artifacts`, `bmad-portfolio-status`).

**Portfolio report.** Run on a scratchpad copy of 60 repo planning documents (running against the repo itself was not permitted):

```
$ cd $T && node node_modules/convoke-agents/scripts/lib/portfolio/portfolio-engine.js
  convoke   complete   draft (explicit)   Initiative complete — consider retrospective
  …
  Total: 60 artifacts | Governed: 53 | Ungoverned: 7 | Unattributed: 0
```

**T99** (Open): "Declaring an initiative `active` removes it from the WIP radar — and in production the radar is near-silent". It was confirmed live 2026-08-30. The `convoke  complete  draft (explicit)` line above is the same symptom.

**Migration tool.** Run in a scratchpad git repo:

```
$ node …/migrate-artifacts.js    (60 copied docs) → Total: 60 | Rename: 0 | Skip: 0 | Inject: 0 | Conflict: 0 | Ambiguous: 60
  e.g. [!] planning-artifacts/convoke-adr-quint-vs-bmad-first-comparison.md -> ??? (ambiguous -- cannot infer type or initiative)
       Line 2: "initiative: convoke"  Line 3: "artifact_type: adr"
$ (fresh 2-file project: legacy `prd-gyre.md` + governed `vortex-persona-demo.md` with matching frontmatter)
  Total: 2 | Rename: 1 | Skip: 0 | Inject: 0 | Conflict: 0 | Ambiguous: 1
  (the governed file is shown as ambiguous with "Suggested: convoke (source: folder-default, confidence: low)")
```

The cause is in `$T/node_modules/convoke-agents/scripts/lib/artifact-utils.js:381-422`. `inferArtifactType` matches a type only as a filename **prefix** (the legacy `type-initiative` form). `getGovernanceState:684-691` then returns `ungoverned`/`ambiguous`, so an `initiative-type` file cannot reach `SKIP`. No row found for this (searched "migrate-artifacts", "governed"). Related intakes: IN-49, I65, IN-58.

**The guided skills call a script path absent from installed projects:**

```
$ grep -rn "node " $T/_bmad/bme/_artifacts/workflows
  bmad-portfolio-status/steps/step-01-scan.md:55: node scripts/lib/portfolio/portfolio-engine.js --markdown
  bmad-migrate-artifacts/steps/step-02-dryrun.md:49: node scripts/migrate-artifacts.js --include {{scope}}
$ cd $T && node scripts/lib/portfolio/portfolio-engine.js --markdown
  node:internal/modules/cjs/loader:1478  throw err;     (MODULE_NOT_FOUND)
```

No backlog row found for this. The searches were for the literal `node scripts/…` strings and "node_modules/convoke-agents/scripts". An agent in a live session may recover by locating the bin; that is unverified.

**Why Works with limits:** the engines work from the command line. The report's status inference under-counts active work (T99). The migration preview misclassifies already-compliant files. The guided in-chat entry points are broken as written.

---

### 2.8 Export to GitHub Copilot and Cursor: Works with limits · Convoke tool; BMAD-ecosystem content

**Mechanism** (`$P/scripts/portability/`):
- `convoke-export.js` writes `instructions.md` + `README.md` per skill.
- `generate-adapters.js:43-76` writes `adapters/claude-code/SKILL.md`, `adapters/copilot/copilot-instructions.md` and `adapters/cursor/<skill>.md`.
- Nothing installs them. `templates/readme-template.md:43-61` tells the user to copy the files by hand.

```
$ cd $T && npx --no-install convoke-export bmad-agent-bme-contextualization-expert --output $T/exported
  ✅ … → exported/bmad-agent-bme-contextualization-expert/instructions.md (2 warnings)
$ find $T/exported -type f  → README.md, instructions.md, adapters/{claude-code/SKILL.md, copilot/copilot-instructions.md, cursor/<skill>.md}
$ head -3 $T/exported2/bmad-agent-bme-discovery-empathy-expert/instructions.md
  > **⚠️ Framework-only skill.** This skill depends on the full Convoke installation and cannot run standalone.
$ npx --no-install convoke-export --all → "Exported 1 skills (1 success…)"  (only bmad-enhance-initiatives-backlog in a Convoke-only project)
```

**Manifest tiers** (quote-aware parse of `$P/_bmad/_config/skill-manifest.csv`, 106 rows):

```
core 14 (10 standalone, 1 light-deps, 3 pipeline) · bmm 33 (14/4/15) · tea 10 (10/0/0) · cis 10 (9/1/0)
bmb 5 (0/0/5) · wds 15 (0/0/15) · bme 19 (0 standalone, 1 light-deps, 18 pipeline)
```

- BMAD proper totals 72 rows: 43 standalone, 6 light-deps, 23 pipeline. That matches `README.md:98`.
- Every Convoke agent is `pipeline`, and a pipeline skill exports with the framework-only banner (`export-engine.js:1161-1163`). Test: `tests/lib/portability-export-engine.test.js:135`, "Tier 3 pipeline exports with framework-only notice".

**Exported converted agents are lossy.** Compare `$T/exported2/bmad-agent-bme-contextualization-expert/instructions.md` with the shipped `SKILL.md` "On Activation":
- the export begins "How to proceed" mid-list (the step-1 heading is dropped)
- step 3 and the Capabilities table are absent
- `./references/{cap}.md` becomes `./references/your-project-context.md`
- the Identity text is the v5-era registry prose ("Strategic Framing + Problem-Product Space Navigator") rather than the shipped file's

T140 covers the persona drift. No row found for the truncation or placeholder rewrite.

**The guided skills have the same script-path defect as §2.7:**

```
$ grep -rn "node " $T/_bmad/bme/_portability/workflows
  bmad-export-skill/workflow.md:38  node scripts/portability/convoke-export.js <name> --output <path>
  (also catalog-generator.js, seed-catalog-repo.js, validate-exports.js)
$ cd $T && node scripts/portability/convoke-export.js --all --dry-run → MODULE_NOT_FOUND
```

**Tests of host adapters** (file generation only; no test shows a host loading them):
- `tests/lib/portability-adapters.test.js:50,60,69`
- `tests/lib/portability-full-pipeline.test.js:76,79`

**Shipped documentation overclaims.** CHANGELOG 4.0.0 "Multi-platform adapters — Drop-in agent skills for … GitHub Copilot … and Cursor … Use Convoke agents on the platform you already work in, no Convoke runtime required." That contradicts `README.md:98` and the banner above. Do not repeat it.

**Backlog:**
- **I152** (Qualified): the CI export check covers 5 of 106 manifest skills.
- **I84** (Backlog).
- **I141** (Qualified, still in lane): "`_portability` … no install path ever copies it". **Stale.** The install trial shows `Refreshed Portability module` and 4 wrappers, and the `scripts/audit/try-fresh-install.sh:356` comment records the fix by `dist-2-6` on 2026-09-07.

**Why Works with limits:** the exporter works on the command line and emits adapter files. What it can usefully export is mostly BMAD-ecosystem skills. Convoke's teams do not travel. The in-chat entry points are broken as written.

---

### 2.9 Operator Covenant: Works with limits · Convoke

- **What ships:** `$P/_bmad/bme/covenant/covenant-operator.md` (220 lines, frontmatter `status: draft`) and `compliance-checklist.md` (526 lines). Neither is copied into a project (`ls $T/_bmad/bme` shows no `covenant`), and `package.json` `//files` notes "It is prose, not a module". No code enforces it; `grep -rn covenant $P/scripts/update/lib/refresh-installation.js` returns nothing.
- **Shipped claim:** `README.md:143`, "one axiom and seven Operator Rights every Convoke skill honours".

**Audit evidence** (repo, `_bmad-output/planning-artifacts/`):
- `convoke-report-operator-covenant-audit-2026-04-18.md:279`: "Total cells audited: 56. Total fails: 10. Compliance rate: 46/56 = 82%."
  - `:44`: "Static file-review primary… the 84% compliance rate is likely a ceiling, not a floor." The report quotes both 82% and 84%; 82% is the Round 3 final figure at `:24` and `:279`.
  - `:257`: "26 workflows remain unaudited."
- `convoke-report-operator-covenant-audit-vortex-2026-04-19.md:14`: "T1 FIRES for Vortex × Right to pacing (25% compliance, 1/4 skills PASS, N=4)".
- `sprint-status.yaml`: `oc-epic-2: in-progress`, `oc-2-1-retrofit-bottleneck-skills: review`, `oc-2-2…: backlog`, `oc-2-3-publication-strategy: backlog`.

**Backlog:**
- **P21** (Initiative Lane): "Epic 2 — Story 2.1 `ready-for-dev`" (the sprint file now says `review`) and "Story 2.3 gated — see T86".
- **T86** (Open): the publication gate's condition (b) "is NOT met".
- **T121, T122, T123:** gate and retrofit follow-ups filed by oc-2-1 Round 3.

**Why Works with limits:** the standard is published as designed. The README's universal present-tense claim goes beyond the evidence: a sampled static audit at 82%, with a known failing area whose fix is in review.

---

### 2.10 Installation and health check: Shipped · Convoke

```
$ export npm_config_cache=$SP/npmcache; cd $T && npm install convoke-agents@4.0.2 → exit 0 ("added 14 packages … found 0 vulnerabilities")
$ npx --no-install convoke-version → "Status: Not in a Convoke project · Package version: 4.0.2" (exit 0)
$ npx --no-install convoke-install → exit 0
    [1/5] ⚠ _bmad directory not found - creating it · ⚠ BMAD Method not detected (Convoke will install standalone)
    ⚠ BMAD core not detected (package not in node_modules) — cannot verify v6.3 compatibility; proceeding anyway
    Created skill-manifest.csv (19/106 skills present) · Updated config.yaml to v4.0.2
    [5/5] ✓ All files installed successfully
$ npx --no-install convoke-doctor → exit 0, "All 31 checks passed. Installation looks healthy!"
$ npx --no-install convoke-version → "Installed version: 4.0.2 · Package version: 4.0.2 · Status: ✓ Up to date"
$ (copy of $T with _vortex/agents/hypothesis-engineer and .claude/skills/bmad-agent-bme-review-coach deleted)
  node …/convoke-doctor.js → exit 1: "✗ _vortex agents · ✗ BME agent skill wrappers · 2 issue(s) found, 29 checks passed."
```

**Other bins:**
- `convoke-register-skill --help` exits 0.
- `convoke-audit-skill-dirs` exits 0 with "19 … all passed".
- `convoke-audit-bmm-deps --dry-run` reports "0 auto-scan + 0 manual rows". Its `--help` exits 1 as "unknown flag"; this is cosmetic.
- `convoke-validate-marketplace --help` exits 0.
- `install-gyre-agents.js` exits 0.

**CI:** `fresh-install` job at tag run `34822641000` printed `[install exit 0]`, `All 31 checks passed`, `all 5 export(s) succeeded`, `all 14 bins present, shipped, parseable, and their requires resolve`, `[installed-tree status 0]`, `[shipped-links status 0]` and `PASS — a new user gets a working, self-consistent install.` That job packs the tagged tree, not the registry tarball; the registry trial above covers the gap.

**Hosts.** Code: `$P/scripts/update/lib/refresh-installation.js:792-1017` writes wrappers to `.claude/skills/` only. A `find` in `$T` for `.cursor*`, `.github`, `AGENTS.md`, `.clinerules`, `.windsurf*` and `copilot-instructions.md` (excluding node_modules) returned nothing. Whole-word searches for Cline, Windsurf, Codex, Gemini CLI and ChatGPT found no host claim, so **these tools are neither claimed nor supported**. CI runs on `ubuntu-latest` only (`grep runs-on .github/workflows/ci.yml`); the trials here ran on macOS; Windows is untested.

**Backlog (Bug Lane at HEAD, 3 rows):**
- **BUG-20** (Open): the "BMAD core not detected" warning fires for essentially every operator. Reproduced in both trials.
- **BUG-9** (Open): `convoke-update`'s downgrade hint hardcodes `@latest`, affecting prerelease testers only.
- **BUG-4** (Open): doctor cross-module version drift. **Not reproduced**: "Version consistency 4.0.2 — package and config versions consistent" in both the fresh and upgraded projects. Possibly stale.

**Other open rows:**
- **T112** (Open): doctor's fix line for `unregistered-custom-skill` leads to a hard failure. This needs a custom BMM-dependent skill and was not exercised.
- **S3** (Qualified, Initiative Lane): a one-command `npx convoke-agents init`, not built. The current two-step install works.

**Why Shipped:** the documented outcome was reproduced on the published package, and the health check was shown to detect breakage. The remaining defects are diagnostic.

---

### 2.11 Upgrades: Shipped · Convoke

```
$ cd $SP/upgrade && npm install convoke-agents@3.3.0 && npx --no-install convoke-install → exit 0; convoke-version "Installed version: 3.3.0"
$ npm install convoke-agents@4.0.2 && npx --no-install convoke-update --yes → exit 0
    [4/5] ✓ Config structure · ✓ Agent files · ✓ Workflow files · ✓ Agent manifest · ✓ User data preserved (Files: 1, expected: 1)
          ✓ Deprecated workflows · ✓ Workflow step structure · ✓ Enhance module · ✓ Artifacts module · ✓ Portability module
    ✓ Migration completed successfully! Changes applied: ✓ 3.3.x-to-4.0.0 ✓ refresh-installation
    Backup location: …/upgrade/_bmad-output/.backups/backup-3.3.0-1789422636325
$ npx --no-install convoke-doctor → exit 0, "All 31 checks passed." · convoke-version → "Installed version: 4.0.2 … ✓ Up to date"
$ npx --no-install convoke-migrate → 13 migrations listed, 1.0.x-to-1.3.0 … 3.2.x-to-4.0.0
$ (fresh project) npx --no-install convoke-update --dry-run → exit 0, "✓ Already up to date! (v4.0.2)"
```

- **Tests:** `tests/integration/upgrade-cli-e2e.test.js` passed in CI (`✔ Test 16: v3.x → v4.0 upgrade (AC9 + R1-H2)` in the `test (22)` log).
- **Backlog:** BUG-9 (above). **BUG-8**, rollback unable to restore rewritten files, is in §2.5 as fixed `cc685063`.
- Not trialled: upgrades from 1.x/2.x, and rollback after a failed migration.

**Why Shipped:** reproduced on the published package from the most recent breaking baseline.

---

### 2.12 Release pipeline: Shipped · Convoke

```
$ gh run list --commit a77cfefe… → "completed success … CI v4.0.2 push 34822641000"
$ gh run view 34822641000 --json jobs --jq '.jobs[] | "\(.name)\t\(.conclusion)"'
  lint success · test (18) success · test (20) success · test (22) success · coverage success · agent-surface-parity success
  python-test success · package-check success · security success · fresh-install success
  Downgrade guard (dry) skipped · burn-in skipped · publish success
$ grep -n "needs:" .github/workflows/ci.yml → 580: needs: [lint, test, python-test, coverage, security, package-check, agent-surface-parity, fresh-install]
$ grep -n "if: startsWith\|id-token" .github/workflows/ci.yml → 582: if: startsWith(github.ref, 'refs/tags/v') · 592: id-token: write
$ cd $T && npm audit signatures → "14 packages have verified registry signatures · 1 package has a verified attestation"
$ curl -s https://registry.npmjs.org/-/npm/v1/attestations/convoke-agents@4.0.2 | <decode>
  https://slsa.dev/provenance/v1 {"ref":"refs/tags/v4.0.2","repository":"https://github.com/amalik/convoke-agents","path":".github/workflows/ci.yml"}
  https://github.com/amalik/convoke-agents/actions/runs/34822641000/attempts/1
$ gh release view v4.0.2 --json … → isDraft false, isPrerelease false, publishedAt 2026-09-14T10:30:18Z
```

- **Coverage** (`coverage` job at the tag, c8 "All files" line): statements 88.44%, branches 83.62%, functions 91.58%. Scope: files instrumented in that job's run.
- **Open backlog rows (Fast Lane, HEAD):**
  - **T47**: nothing re-reads `dist-tags.latest` after `npm publish`.
  - **T45**: the npmrc credential scan inspects zero files.
  - **T48**: tag delete-and-repush cancels its own run.
  - **T43**: no `rc` downgrade protection.
  - **T104** (Qualified): the `fresh-install` job runs no `npm ci`.
  - **I152**, **I106** (Node matrix only on the test job), **T27**, **I102**.
  - None of these made 4.0.2 wrong; each is a hardening gap.

**Why Shipped:** gating, tag-only publishing and provenance were verified end to end for the current release.

---

### 2.13 Plugin marketplace distribution: Mapped, not built · Convoke

```
$ cat $P/.claude-plugin/marketplace.json
  plugins: [{ name: "convoke-vortex", source: "./", version: "4.0.0", skills: [7 × ./_bmad/bme/_vortex/agents/<id>] }]   (package is 4.0.2; no Gyre/Team Factory/Enhance)
$ gh pr view 9 --repo bmad-code-org/bmad-plugins-marketplace --json state,mergedAt,closedAt
  {"closedAt":"2026-04-27T00:58:13Z","mergedAt":null,"state":"CLOSED"}
$ gh pr view 9 --repo bmad-code-org/bmad-plugins-marketplace --comments   (maintainer, trimmed)
  "Ideally your repo will have at the root a skills folder and within the skills folder there should be a module.yaml and a module-help.csv. … Will close for now"
$ ls -d $P/skills <repo>/skills → No such file or directory (both)
```

The background research also ran `gh api repos/bmad-code-org/bmad-plugins-marketplace/contents/registry/community`, which lists only `suno-band-manager.yaml` and `whiteport-design-studio.yaml`. That result was not re-run for this ledger.

**Tests:**
- `tests/unit/validate-marketplace.test.js` and `tests/integration/dual-distribution-parity.test.js` validate the metadata.
- `tests/integration/lib/marketplace-installer-sim.js:15-17` uses a **simulator** because no local BMAD community-install CLI exists. IN-136 records real verification as blocked.

**Shipped documentation overclaims.** CHANGELOG 4.0.0 says "Marketplace distribution — Install Convoke through the BMAD community plugin marketplace" and "You can now install Convoke through the BMAD plugin system". The repo-only `docs/host-framework-sync-playbook.md` says "Convoke has no marketplace presence today" (`:96-97`) and "The marketplace path is aspirational, not supported" (`:123`). Do not repeat the CHANGELOG claim.

**Backlog:**
- **T107** (Qualified): `module_definition` absent from marketplace.json.
- **T108** (Qualified).
- **I98** (Reinstated): Gyre packaging blocks I113 Epic 4 Story 4.1.
- **I113** (In Pipeline): marketplace structural adoption is Epic 4, "Phase-2 fast-follow; does not gate the MVP".
- **I97** (In Pipeline).

**Why Mapped, not built:** the metadata ships, but the distribution channel does not exist for Convoke.

---

### 2.14 Use in chat windows (e.g. Claude.ai): Mapped, not built · Convoke

- `README.md:56` (shipped): "in the terminal or on Claude.ai, paste the agent file into the conversation."
- There is no tool, export format or test for this path. The export engine's Claude adapter targets Claude Code's `SKILL.md`.
- **The shipped v5 agents instruct the opposite of working without files.** `$P/_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md` activation step 2 says: "Load and read {project-root}/_bmad/bme/_vortex/config.yaml NOW … If config file not found … IMMEDIATELY display: ❌ Configuration Error … Then STOP - do NOT proceed to step 3."
- The converted agents call `bmad-init` (see §2.1).

**Why Mapped, not built:** it is named in docs, nothing in the package supports it, and the agents' own instructions halt without project files. See §3: this is the row most likely to be unfairly harsh.

---

### 2.15 Further lifecycle phases: Mapped, not built · Convoke (vision)

- `README.md:40` (shipped): "Strategy · Growth · Delivery · Security · Ops/Run · Sunset are mapped in the lifecycle vision, not built."
- `docs/lifecycle-expansion-vision.md` (repo; not shipped):
  - `:8` "Status: Exploratory / Pre-specification"
  - `:14` "This is a map of the possible, not a commitment to build."
- `find $P -iname '*strategy*' -o -iname '*growth*' -o -iname '*delivery*' -o -iname '*sunset*' …` finds no team, agent or workflow. `find $P/_bmad/bme -maxdepth 1 -type d` lists only `_artifacts _enhance _gyre _portability _team-factory _vortex covenant`.
- No backlog lane row exists for any of the six phases.

**The vision doc blurs ownership.** Do not source whitepaper copy from it.
- `:435` says "For teams unfamiliar with Convoke's existing modules", then lists "Design & Planning — WDS + BMM Phases 1-3" (`:441`), "Implementation & Quality — BMM Phase 4 + TEA" (`:445`) and "Creative, Build & Extension — CIS + BMB + Enhance + Team Factory" (`:453`).
- It never says WDS, BMM, TEA, CIS or BMB are not Convoke's.

**Other shipped-docs note:** `README.md:37` files WDS under "BMAD Method ecosystem — not ours", while `README.md:98` calls the `_bmad/wds/` rows "a parallel extension that is neither BMAD's nor Convoke's". The ledger footnote uses "separate BMAD extension", per project guidance.

---

### 2.16 Proposed teams (Forge, Helm, others): Mapped, not built · Convoke (proposed)

- **`_bmad/bme/_config/name-registry.csv`** (repo; not shipped):
  - `forge … convoke,proposed` (scope amended 2026-09-05)
  - `helm … convoke,proposed` ("The word 'strategy' is RETIRED for this team")
  - `pulse`, `conduit`, `compass`, `sentinel`, `ledger` all `unassigned,proposed` ("Tier undecided")
  - `tbd-stakes … reserved`
- **`find $P`** finds no directory for any of them. The only hits are mentions in portfolio prompts and `covenant/compliance-checklist.md:386`.
- **Backlog:**
  - **P9** (Initiative Lane): `forge`, "In Pipeline (Blocked on Gate 1)", dependency "external: shadow engagement (Gate 1)".
  - **ILE-1** (Initiative Lane): `helm`, "Ready for Sprint", with brief, PRD, architecture, epics and readiness report.
  - `sprint-status.yaml`: `ile-epic-1` … `ile-epic-6` are all `backlog`, and every `ile-1-*` story is `backlog`.
  - **P7** ML/AI Engineering team (Qualified, needs discovery).
- **Governance:** no team-expansion freeze is in force. The `team-expansion-freeze` rule, whose exit condition was "4.0.2 ships `dist-epic-2`", was recorded as lifted in `f4af93db` and deleted from `project-context.md` in `db12ffa4`. Forge (P9) is now blocked only on its Gate 1 external engagement.

**Shipped/repo text that names unbuilt teams beside built ones:** `covenant/compliance-checklist.md:386` (shipped) "Forge + Helm to be classified at first audit". The repo-only `docs/adr/adr-bmad-coupling-v4.0.md:82` reads "where Convoke's value lives — Vortex, Gyre, Forge, Helm, BMM extensions".

---

### 2.17 Stale backlog rows found while verifying (for the backlog owner, not the client)

| Row | Row claims | Observed on the 4.0.2 package |
|---|---|---|
| I98 | Gyre "cannot be installed or invoked through any supported path" | `convoke-install` and `install-gyre-agents.js` install Gyre and generate 4 resolving wrappers. The structural half (no `module.yaml`) still holds. |
| I141 | `_portability` never copied, skills unreachable | Copied, 4 wrappers generated, doctor green. Script comment records the fix 2026-09-07. |
| BUG-4 | doctor reports cross-module version drift | Fresh and upgraded installs both report "4.0.2 — package and config versions consistent". |
| `package.json` `//files` | "I97 Epic 2 is 2 of 7 done" | 3 of 7 agent files are converted. |

---

## 3. Uncertain rows

1. **Vortex (Works with limits): impact of the `bmad-init` reference in the 3 converted agents.**
   - *Verified:* the instruction exists, no such skill is installed in a standalone project, and CHANGELOG 4.0.0 says it was removed.
   - *Unverified:* whether Emma, Wade and Mila activate correctly in Claude Code anyway, since the model may find `_bmad/bme/_vortex/config.yaml` on its own. If they do not, the Vortex note should add that three agents fail to start in standalone installs.
   - *Would settle it:* a live activation of `/bmad-agent-bme-contextualization-expert` (plus one v5 agent as a control) in a fresh standalone 4.0.2 install, with the transcript kept.

2. **Team Factory (Works with limits): arguably Mapped, not built for its headline outcome.**
   - It ships and its design steps have run, but it has never produced a surviving team, its terminal validation cannot pass at 4.0.2 (T128), and a generated team is not installed (T147).
   - A due-diligence reader who equates "works" with "delivers the documented outcome" would classify it more strictly. The ledger keeps *Works with limits* and labels it "Preview".
   - *Would settle it:* `tfr-1-1` producing one team that installs via `convoke-install` and passes validation, re-run against a published package.

3. **Use in chat windows (Mapped, not built): may be unfairly harsh.**
   - A pasted v6.3 agent persona could still give useful discovery conversation even though workflows and config are absent. The classification rests on the absence of any supporting tooling and on the v5 agents' explicit STOP instruction, not on a failed attempt.
   - *Would settle it:* paste one converted and one v5 agent into Claude.ai and record whether a workflow can be completed.

4. **Covenant (Works with limits): the audit is internal and sampled.**
   - The 82% figure is a self-administered static review of 8 skills (Round 3 final). Its own report calls the figure "likely a ceiling", and the Gyre audit failed its reproducibility gate.
   - The ledger cites the number with its scope. If the whitepaper cannot carry that scope, drop the number rather than the caveat.
   - *Would settle it:* an independent (Tier-2) audit across all Convoke skills.

5. **Artifact governance (Works with limits): is the migration preview behaviour a defect or by design?**
   - The tool may be intended only as a one-shot legacy migration, with idempotency handled by `detectMigrationState` on `--apply` (`tests/integration/migrate-artifacts-idempotency.test.js`).
   - The limit stated in the ledger ("flags already-compliant files for manual review") is observed either way, but whether to call it a defect needs the owner's intent.
   - The in-chat script-path defect (§2.7, §2.8) was verified by running the literal command. Whether a live agent recovers from it is unverified.

6. **Coexistence with an existing BMAD Method install.** Not trialled; only standalone installs were run. The Enhance menu patch, BUG-20's detection logic (it looks only in `node_modules/bmad-method`), and Team Factory's BMB delegation all behave differently with BMAD present.
   - *Would settle it:* install BMAD Method, then Convoke 4.0.2, in a scratch project and run install, doctor and an Enhance menu check.

7. **Gyre (Works with limits): conflicting internal signals.**
   - Backlog I98 says Gyre is not installable through any supported path; the 4.0.2 trial shows it is, for npm + Claude Code. The ledger follows the trial.
   - If "supported path" in I98 means the marketplace or the v6.3 packaging contract, both are right. The owner should reword I98 before the whitepaper cites Gyre as "in development".

8. **Platform coverage.** CI runs only on Ubuntu, and the trials here ran on macOS. No evidence covers Windows; the backlog notes a copy-loop race "under Windows file-lock scenarios" (I89). The ledger makes no platform claim. Do not add one without a Windows run.

9. **Time sensitivity.** Everything here is pinned to 4.0.2 and backlog HEAD `0db3aac8`. Team Factory repair commits are landing now (five commits since the tag, plus uncommitted work). If a 4.0.3 publishes before 2026-09-22:
   - re-run the `npm view convoke-agents dist-tags --json` check and the §2.10 and §2.11 trials against it
   - re-derive the `loom` count with `$SP/lanes.js`
