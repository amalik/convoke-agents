---
initiative: convoke
artifact_type: note
created: '2026-09-14'
schema_version: 1
status: draft
---

# Convoke Maturity Ledger

## 1. Client-facing ledger

> **Corrected 2026-09-26.** Six statements in this ledger were found false or
> incomplete, all in the reassuring direction, by the channel-integrity findings
> (`convoke-note-channel-integrity-findings-2026-09-26.md`). The original wording is
> retained inline behind each correction. The cause was common to all six: the
> `.claude-plugin/marketplace.json` shipped in `files[]` was treated as inert metadata
> awaiting a submission. It is an **active publication surface** — the `npx skills` CLI
> searches manifest-declared paths at their declared depth, bypassing its own bounded
> directory walk. Convoke has been publishing seven agents to a public channel since
> that manifest shipped.

*Basis: the published package convoke-agents 4.0.3, the current release on npm, assessed 17 September 2026 — with one stated exception: the last two rows, §2.18 and §2.19, were added on 20 September and each names its own basis at the head of its evidence section. "Shipped" and "works" mean verified by running the software or by an automated test that exercises it. Every agent named below was also started once in a live session against a clean install of that package — which establishes that it starts, and nothing more. No team's conversation quality is measured by automated tests.*

| Capability | What it does for you | Status | Ownership | Honest note |
|---|---|---|---|---|
| Vortex product-discovery team | Seven specialist agents take a team from framing the problem through research, hypotheses and experiments to a pivot, patch or persevere decision, across 22 guided workflows. | Works with limits | Convoke | All seven install, appear as commands in Claude Code, and start. Three use the current BMAD agent format; four still use the previous format and are scheduled for conversion. Three of the seven have no dependable way to read your project's configuration: the skill they call to load it no longer exists, and whether they find the file anyway varies between runs of the same project. Observed reading it once in four runs, with two independent reviewers reaching opposite conclusions from single samples. Expect to be asked for your name and language some of the time. |
| Vortex hand-off contracts | Standard templates for what each discovery stage passes to the next, plus guidance on which agent picks up. | Shipped | Convoke | **Corrected 2026-09-26** — previously *"five hand-off templates and five routing rules"*, which was short by four artifacts: it omitted the Gyre team's `gc1`–`gc4` contracts, which exist as files and are referenced from ten or more Gyre workflow step files. **Fourteen contracts are named across the two teams (HC1–HC10, GC1–GC4); nine exist as files.** HC6–HC10, the feedback-routing half, exist only as mentions in a README, a routing reference and seven step files. Agents are instructed to follow them. No software checks a document against its template. |
| Gyre production-readiness team | Four agents detect your technology stack, build a capability model, find readiness gaps and review them with you, across 7 workflows. | Works with limits | Convoke | Installs with Convoke, appears in Claude Code, and all four agents start. Still classed internally as in development: all four use the previous format, the team cannot yet be packaged for a plugin marketplace, and its team guide is not copied into your project. Until 4.0.3 the installer wrote this team's configuration with the discovery team's identity, which stopped all four agents from starting at all. |
| Team Factory | Guides a contributor through designing a new agent team and saves the decisions as a resumable specification. | Mapped, not built | Convoke | **Reclassified 2026-09-17** from *Works with limits*, by this ledger's own materiality rule: the documented outcome — a new, validated, installable team — has never been achieved, so the row was measuring that the design steps run rather than that the capability works. **The maintainer has decided it is internal scaffolding rather than a capability to adopt** (September 2026); removing it from the installed package is planned but not yet done. The design steps run. Generation has not produced a team that works end to end, and the installer does not pick up a generated team. It runs only from Convoke's source repository and relies on BMAD's agent builder. Do not plan on it. |
| Adding an agent or skill to an existing team | Extend a team without rebuilding it. | Mapped, not built | Convoke | Documented as planned. Some groundwork code exists, but no workflow uses it. |
| Enhance: initiative backlog skill | A RICE-scored workflow for capturing, triaging and re-scoring initiatives. | Works with limits | Convoke | Available as a direct command. It is meant to appear in BMAD's product-manager agent menu, which happens only on older BMAD layouts. It is the only Enhance skill so far. |
| Artifact governance and portfolio view | Reports each initiative's phase, status and next step from your planning documents. Renames older documents to a naming standard. | Works with limits | Convoke | The command-line report runs but under-reports which initiatives are active. The renaming tool targets older file names and flags already-compliant files for manual review. The guided in-chat versions point at a script location that does not exist in an installed project. |
| Export to GitHub Copilot and Cursor | Turns a skill into a portable instruction document, with ready-to-copy files for Copilot, Cursor and Claude Code. | Works with limits | Convoke (the tool). Most skills that export in full are BMAD ecosystem. | You copy the files into place by hand, and nothing tests that those tools load them. Convoke's own team agents export with a framework-only warning banner, but the file beneath it is the agent's full persona — lossy rather than empty, and usable-looking enough that a developer could paste the Cursor adapter in and get partial, unsupported behaviour. On a Convoke-only install, `--all` exports exactly one skill. The guided in-chat version has the same script-location problem as above; the command-line tool works. |
| Operator Covenant | A published standard: when a skill cannot resolve something, it hands you the decision with a default, a way to override it and the reason it matters. | Works with limits | Convoke | Applied through review, not enforced by software. An April 2026 review of eight skills found 46 of 56 checks passing (82%). Fixes for the discovery team's failing area, the pacing of questions, are in review. |
| Installation and health check | One command installs the teams, with or without BMAD Method. A health check confirms the installation or names what is broken. | Shipped | Convoke | Verified on a clean project: it installed, passed all 31 health checks, and correctly failed a deliberately damaged copy. Since 4.0.3 it refuses to overwrite a discovery- or readiness-team configuration file it cannot parse, naming the file and the error instead of replacing your settings with defaults. Four of the six module configuration files are still rewritten from the template on **every** install, so customisation there does not persist. Installs for Claude Code only. A "BMAD core not detected" warning appears on standalone installs even when nothing is wrong. |
| Upgrades | Upgrades an existing installation in place, taking a backup first. | Shipped | Convoke | Verified by upgrading a 3.3.0 installation to 4.0.3, and a 4.0.2 one. The health check passed afterwards, and the upgrade repairs a readiness-team configuration that an earlier release had mis-written. One edge case: if your *discovery* team's configuration file is unparseable, the upgrade cannot recognise your version, offers a migration plan from a much older one, and fails partway through — it then restores from its own backup and leaves your files as they were. |
| Release pipeline | CI builds each release from a tagged commit. It must pass the tests and a clean-install trial, and it carries signed build provenance. | Shipped | Convoke | Verified for 4.0.3: every release gate passed and the provenance attestation verifies against the public transparency log. The pipeline does not yet re-check the published result automatically — after the 4.0.3 publish the registry reported the previous version for about two and a half minutes, so a single check taken straight afterwards would have reported a successful release as a failed one. |
| Plugin marketplace distribution | Installing Convoke from the BMAD plugin marketplace. | Mapped, not built | Convoke | **Corrected 2026-09-26** — previously: *"The listing metadata is included, but Convoke is not listed. The submission was declined on packaging structure and has not been resubmitted. Install through npm instead."* **That was false.** The marketplace submission was indeed declined and not resubmitted, but the shipped `.claude-plugin/marketplace.json` is an active publication surface, not inert metadata: it declares seven Vortex agent paths, and the `npx skills` CLI searches manifest-declared paths at their declared depth. One of those agents has been listed publicly on `skills.sh` since 16 June 2026 with one recorded install. So a second, **unsupported** channel is live: it has no dependency resolution, a skill installed from it fails without naming what is missing, and there is no self-serve way to withdraw a listing. Install through npm — but do not read this row as meaning nothing else is reachable. |
| Use in chat windows (e.g. Claude.ai) | Documentation suggests pasting an agent file into a conversation. | Mapped, not built | Convoke | No tooling supports this path, and the agents expect project files a chat window does not have. Not tested in a live session. |
| Further lifecycle phases: Strategy, Growth, Delivery, Security, Operations, Sunset | Coverage of the lifecycle beyond discovery and readiness. | Mapped, not built | Convoke (vision) | Described in an exploratory vision document that says it is not a commitment to build. No agents exist. Gyre assesses security readiness gaps, but nothing fixes them. |
| Proposed teams: Forge (knowledge capture), Helm (portfolio steering) | Named future teams. | Mapped, not built | Convoke (proposed) | Forge is waiting on an external pilot engagement. Helm's engine is fully designed, but none of it is built. Other names in circulation (Sentinel, Conduit, Pulse, Compass, Ledger) have no agreed scope or owner. |
| Finding and confirming what you installed | Knowing which agents and workflows you have, where they live, and whether the install actually worked. | Works with limits | Convoke; BMAD Method (its help skill) | The health check is real: it verifies an installation and names what is broken. Everything else in this area is weaker than it looks. The installer's own final verification covers the **seven discovery agents only** — the five other agents it installs in the same run are not among its checks — and its success banner reads *"All Vortex Agents Installed"*, which is literally true and easy to read as *all agents*. The "Next Steps" it prints lists seven commands out of the twelve installed. BMAD Method's own "what should I do next" skill has no knowledge of Convoke at all: it names two upstream modules and none of Convoke's teams, so asking it will not surface anything we ship. The readiness team's guides ship inside the package and no install path copies them into your project. The practical effect — reported independently by operators in different roles at different organisations, and reproducible from source — is that people do not find capabilities they already have, and cannot always tell whether the install succeeded. |
| Supply chain and how you obtain it | What Convoke is made of, what it depends on, and what you can check before you install it. | Works with limits | Convoke (its own package); BMAD Method (the required dependency) | Convoke publishes one npm package with **four direct runtime dependencies** — `chalk`, `fs-extra`, `js-yaml`, `yaml`. `npm audit` over the production tree reports **0 vulnerabilities at any severity across 14 packages**, and every release carries signed build provenance that verifies against the public transparency log. **npm is the only supported channel** — **corrected 2026-09-26: only supported, but no longer the only *live* one.** A second channel is reachable through the shipped plugin manifest (see the marketplace row); it is unsupported, unversioned and cannot be withdrawn, and you should assume anything obtained through it is not covered by the assurances in this paragraph. There is no binary, no guidance for an internal registry or mirror, and no air-gapped path; an organisation that cannot pull from the public registry at scale has no supported route to Convoke, and we do not currently solve that. Convoke does **not** require BMAD Method — it installs standalone where BMAD is absent. But the usual deployment is alongside it, and BMAD is then a **second supply chain that we neither control nor audit** (**corrected 2026-09-26:** with the channel above, there are **three**, and only the npm one is ours): its installer surfaces third-party scan results at install time, those results describe BMAD rather than Convoke, and you should evaluate them on their own terms. We have not reproduced them and do not restate them here. If you deploy Convoke standalone, only the first paragraph of this row applies to you. |

*Design (WDS), build and test (BMM, TEA), creative facilitation (CIS) and agent building (BMB) are BMAD Method ecosystem modules. Convoke does not ship or maintain them, and this ledger does not assess them. WDS is a separate BMAD extension. Convoke is built to run alongside them, but that combination was not trialled for this ledger.*

---

## 2. Evidence appendix

### 2.0 Basis, shorthand, and rules applied

- **Shorthand:**
  - `$SP` = `$SCRATCH` (a temporary working directory outside the repository)
  - `$P` = `$SP/pub/x/package` (the published 4.0.3 tarball, extracted) · `$P2` = the 4.0.2 tarball, for contrast
  - `$T` = `$SP/trial` (a clean project with 4.0.3 installed from the registry) · `$T2` = the same with 4.0.2
  - Backlog = `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`
- **Repo state when assessed:** HEAD `b2900c39`, which is `v4.0.3-1-gb2900c39` (one commit after the release tag). Re-derived on 17 September 2026, the day 4.0.3 published; the 14–15 September pass against 4.0.2 is the prior basis.
- **Materiality rule:** a defect moves a row to *Works with limits* when it affects the documented outcome. Cosmetic or diagnostic defects are stated in the row's note but do not downgrade it.
- **What "works" now covers, and what it still does not.** Every one of the 12 installed agents was started once, headless, against `$T`, and all 12 reached their menu. That establishes that activation completes — nothing more. No workflow was driven to an artifact, nothing was produced and checked, and conversation quality is unmeasured for every team. These are single samples of a non-deterministic system.

  This is the one row where the previous basis was materially out of date. On 4.0.2, a fresh standalone install left **8 of the 12 installed agents unable to start at all**: `mergeConfig` seeded only the discovery team's lists and was called for the readiness team too, so neither configuration file carried `user_name` or `communication_language`, and each of those agents stopped with `❌ Configuration Error: Missing required field(s) in config.yaml`. 4.0.3 fixes it. Both directions were observed rather than inferred — the failure reproduced on a 4.0.2 install (`$T2`) and the fix confirmed on a 4.0.3 one (`$T`):

```
$ cd $T2 && claude -p "/bmad-agent-bme-discovery-empathy-expert"      # 4.0.2
❌ **Configuration Error: Missing required field(s) in config.yaml**
Required fields: `user_name`, `communication_language`, `output_folder`
Found: `output_folder` (with template variable)
Missing: `user_name`, `communication_language`

$ cd $T && claude -p "/bmad-agent-bme-discovery-empathy-expert"       # 4.0.3
Hello {user}! I'm **Isla**, your Discovery & Empathy Expert.
…
**What would you like to work on?**
1. **[MH] Redisplay Menu Help**  …
```

  The readiness team's agent failed the same way on 4.0.2, and its error text proposed the *discovery* team's output folder — the mis-seeding showing through the diagnostic.

- **A nuance the client table can only summarise, and which was got wrong twice before it was measured.** Three of the seven discovery agents (the converted ones) start, but their configuration loading is **non-deterministic**. Their first activation step calls a `bmad-init` skill that no longer exists in the package; the call returns `Unknown skill: bmad-init`, and the agent then searches for the config itself, in paths that are not where it lives. Sometimes it finds the file anyway; sometimes it asks the operator instead.

  **Measured 2026-09-17, in a separate probe project** with `user_name: 'QZX-PROBE-42'` and `communication_language: fr`, Emma was started four times: once she answered "Bonjour QZX-PROBE-42 !", and three times she greeted in English with no name. Two independent reviewers had previously reached *opposite* conclusions from single samples — one observed all three agents reading the config, the other observed all three failing to. Neither was wrong about what they saw; both were wrong to generalise, and so was the first version of this row, which asserted the agents never read the config. The other nine agents read the file deterministically and echo all three fields back. Filed as `T183`.

  The methodological point is worth more than the finding: every claim in this ledger about agent behaviour rests on single samples of a non-deterministic system, and this is the one row where enough samples were taken to notice.

#### Version and publication

```
$ npm view convoke-agents dist-tags --json
{ "rc": "4.0.1-rc.0", "latest": "4.0.3" }
$ npm view convoke-agents time --json | tail -2
  "4.0.2": "2026-09-14T08:29:49.928Z",
  "4.0.3": "2026-09-17T10:46:34.840Z"
$ npm view convoke-agents@4.0.3 dist --json      (trimmed)
  shasum c18b1b672b4d6612355f61f24114687b7d1a24e1, fileCount 469, unpackedSize 3342296
  attestations.provenance.predicateType: https://slsa.dev/provenance/v1
$ npm view convoke-agents@4.0.3 gitHead
35b7793f0de9659954b21b7f157697ae84645a9a
$ git rev-parse v4.0.3^{commit}
35b7793f0de9659954b21b7f157697ae84645a9a
```

The `rc` dist-tag still points at `4.0.1-rc.0`, which is older than `latest`. This is harmless but stale; backlog row T43 covers `rc` downgrade protection.

#### What ships

- `package.json` `files[]` lists these `_bmad/bme/` entries:
  - `_vortex`, `_enhance`, `_gyre`, `_artifacts`, `_portability`, `_team-factory`
  - two named covenant files
  - also `_bmad/_config/skill-manifest.csv`, `.claude-plugin/`, `.claude/skills/bmad-audit-skill-dirs/`, `docs/migration/`, `scripts/`, `src/`, and the root docs
- Lifecycle scripts: `grep '"prepack\|"prepare\|"prepublish' package.json` returns nothing. The only lifecycle script is `postinstall`, which prints guidance.

```
$ npm pack convoke-agents@latest --pack-destination $SP/pub  → convoke-agents-4.0.3.tgz, 469 files
$ find $P/_bmad/bme/<module> -type f | wc -l
  _vortex 226 · _gyre 54 · _enhance 23 · _artifacts 12 · _portability 9 · _team-factory 32 · covenant 2
$ diff <(cd $P2 && find . -type f | sort) <(cd $P && find . -type f | sort)
  three additions only: _team-factory/lib/utils/{output-directory,run-context}.js, scripts/audit/check-changelog-entry.js
$ npm pack --dry-run --json   (repo HEAD working tree) → 468 entries
$ diff <published file list> <dry-run file list>
  > _bmad/bme/_team-factory/lib/utils/output-directory.js
  > _bmad/bme/_team-factory/lib/utils/run-context.js
```

The two extra files were added after the tag. **The published tarball is the basis for every "ships" claim below.**

#### Backlog basis

Lanes were parsed with the repo's own `parseTables`/`isClosed`, exported from `scripts/audit/backlog-integrity.js`. The script is `$SP/lanes.js`.

```
HEAD (git show HEAD:<backlog>):  live lane rows 238 = Bug 6 + Fast 217 + Initiative 15; closed-in-lane 0
by portfolio:                    convoke 194 · loom 25 · enhance 13 · gyre 2 · forge 1 · helm 1 · vortex 1 · (pending) 1
Bug Lane:                        T181, T183, T182, BUG-4, BUG-20, BUG-9   (BUG-22 closed at 4.0.3)
```

Intake rows (§2.1) have no Portfolio column, so the per-team counts below cover lanes §2.2–§2.4 only.

---

### 2.1 Vortex product-discovery team: Works with limits · Convoke

**Format of each agent, from the shipped files.** Commands:

```
$ for d in $P/_bmad/bme/_vortex/agents/*/; do f=$d/SKILL.md; echo "$d lines=$(wc -l <$f | tr -d " ") <agent=$(grep -c '<agent ' $f) <activation=$(grep -c '<activation' $f) ##=$(grep -c '^## ' $f)"; done
```

Results:

| Agent file | Lines | `<agent` | `<activation` | `##` headings |
|---|---|---|---|---|
| contextualization-expert/ (Emma) | 71 | 0 | 0 | 6 |
| lean-experiments-specialist/ (Wade) | 73 | 0 | 0 | 6 |
| research-convergence-specialist/ (Mila) | 69 | 0 | 0 | 6 |
| discovery-empathy-expert/ (Isla) | 120 | 1 | 1 | 0 |
| hypothesis-engineer/ (Liam) | 120 | 1 | 1 | 0 |
| production-intelligence-specialist/ (Noah) | 120 | 1 | 1 | 0 |
| learning-decision-expert/ (Max) | 120 | 1 | 1 | 0 |

- **v6.3 markdown (3):** Emma, Wade, Mila. Each has frontmatter `name: bmad-bme-agent-*`, the sections Overview, Identity, Communication Style, Principles, Capabilities and On Activation, and a `references/` directory.
- **v5 XML-in-markdown (4):** Isla, Liam, Noah, Max. Each has a fenced `xml` block containing `<agent id="…agent.yaml" name="…">` and `<activation critical="MANDATORY">`.

**Inconsistencies found while checking the conversion status:**
- `package.json` `//files` still reads "I97 Epic 2 is 2 of 7 done". The files show 3 of 7.
- `sprint-status.yaml` has `i97-2-3-convert-mila-research-convergence-specialist: in-progress`, even though Mila's converted file shipped. Stories 2-4 through 2-7 are `ready-for-dev`.
- `$P/_bmad/bme/_vortex/module-help.csv` lists only the 3 converted agents.

**Workflows.** `$P/_bmad/bme/_vortex/config.yaml` declares 22 workflows. `ls workflows` shows those 22 plus `_deprecated/`.

**Install trial** (clean project, registry package):

```
$ cd $T && npm init -y && npm install convoke-agents@4.0.3        → exit 0
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
$ grep -rhoE "\{project-root\}/_bmad/bme/_[a-z-]*/[^\"'`) ]*" _bmad/bme .claude/skills | sort -u | wc -l  → 244
  (working tree, and it reaches into the gitignored `.claude/skills/`, so this one is repo-scoped rather than package-scoped)
```

Thirteen unique paths dangle, across 12 files, split evenly between `_vortex/workflows/_deprecated/wireframe/` and `_vortex/workflows/_deprecated/empathy-map/` — six step files each, all pointing at `_designos`, plus `_designos/config.yaml` referenced from both. Derive with `grep -rhoE "\{project-root\}/_bmad/bme/_designos[^\"'`) ]*" $P/_bmad/bme | sort -u`. Every `./references/*.md` target named in the 3 converted agents exists. **Corrected 2026-09-26: that check measured existence and this row reported it as resolution.** The reference files exist; their contents were never opened. They carry **22 bare cross-directory paths** with no `{project-root}/` prefix, plus `_bmad/core/tasks/workflow.xml` and `_bmad/core/workflows/party-mode/workflow.md`, neither of which ships in `files[]`. The pattern used above required both `{project-root}/` and `_designos`, so it could see none of them — **"thirteen unique paths dangle" is the floor of that pattern, not a total.** Derive the residue with `grep -rhoE '(^|[^{/a-zA-Z._-])_bmad/bme/_[a-z-]+/[A-Za-z0-9_./-]*' _bmad/bme/_vortex/agents/*/references/ | wc -l`.

**Tests (CI).** CI run `35211917101` on tag `v4.0.3`:
- `test (22)`: unit/team-factory/lib/audit suite `tests 2752 · pass 2751 · fail 0 · skipped 1`; integration suite `tests 130 · pass 130 · fail 0`.
- `coverage` job (adds `tests/p0`): `tests 3524 · pass 3523 · fail 0 · skipped 1`; "All files" 88.61 / 84.08 / 91.7 / 88.61.

P0 suites cover each agent (`tests/p0/p0-{emma,isla,mila,liam,wade,noah,max}.test.js`), workflow structure and handoff contracts. They are **structural** (file shape, menu codes, schema tables), not behavioural. CHANGELOG 4.0.0 says so itself: "Convoke 4.0 makes no behavioural-equivalence claim."

**Backlog rows that bear on this row:**
- **T140** ✅ Done 2026-09-23: persona agreement between `agent-registry.js` and the agent files is now an exact relation — the registry field must equal the leading block of the file's field — enforced for every registered agent by `tests/unit/agent-persona-registry-sync.test.js`, which runs in `npm test`. The marker-phrase check this row called undetectable is deleted. **The row's own diagnosis was wrong and is worth recording:** the drift was not confined to the three converted agents. Six agents diverged on `identity`, three of them never converted (Isla, Max, Gyre's `review-coach`), and the "identical" control agent was holding a summary of a longer field. 25 fields across 10 of 12 agents were re-synced from their files. Residue: **T209** (Mila's `role` is unguarded; Emma's and Wade's are pinned by p0 tests), **T210**, **T211**. *(Basis: assessed 2026-09-23 against HEAD, the same named-exception treatment §2.18 and §2.19 carry.)*
- **T135** ✅ Done 2026-09-21: the personality-preservation harness now loads every agent's capture; before, it had never run, because its fixtures were invalid JSON. That repair produced no new scores. **What the scoring record holds for the three converted agents:** Emma — scored by the operator, lowest dimension 3, report `status: pass` (`convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md`). Wade — all seven dimensions 4, scored by the same model that converted him and **operator-confirmed 2026-09-25** on the D7 sanity check the report asked for; `status: pass` (`…-wade-conversion-2026-05-02.md`). That check found D7's verdict sound and its stated evidence wrong — it cited hypothesis/experiment-ladder/threshold TABLES, and the captures hold no markdown table at all, so the row was corrected to the evidence that exists (same prose shape both phases, response volume -6%, emoji 25 → 16). Mila — **unscored**; the report is a skeleton awaiting the operator (`…-mila-conversion-2026-08-28.md`). So persona preservation is operator-confirmed for **two agents of seven**. The 2026-09-14 line here said no evidence existed; Emma's report already existed then. *(Basis: assessed 2026-09-21 against HEAD, the same named-exception treatment §2.18 and §2.19 carry.)*
- **I97**: Initiative Lane, "In Pipeline — E2 at 3 of 7".
- **P13** (Qualified, blocked on P12): the Vortex redesign.
- **Portfolio `vortex`:** one live row at HEAD, which is P13.

**Observed defects I found no backlog row for.** The keyword searches were `bmad-init`, `customize`, `HELP_STEP`; treat this list as a floor.

1. **The converted agents' first activation step calls a skill a standalone install does not have.**
   - Emma, Wade and Mila read `1. **Load config via bmad-init skill**` (`$P/_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md`, "On Activation").
   - `ls $T/.claude/skills | grep -i init` returns nothing.
   - In the repo, `_bmad/core/bmad-init/` holds only `.bak` files (moved aside by commit `a16fa340`, 2026-06-27).
   - CHANGELOG 4.0.0 §Removed says "`bmad-init` skill — Removed" and §Changed says agents "load configuration directly from `_bmad/{module}/config.yaml`". The shipped converted agents do not do that.
   - **Measured 2026-09-17 against 4.0.3: the missing skill does not stop them, and does not make them find the config either.** Tracing Emma's activation shows `Skill(bmad-init)` returning `Unknown skill: bmad-init`, then four searches — `.bmad/config.*`, `bmad-config.*`, `.vortex/config.*`, `project-context.md` — none of which is `_bmad/bme/_vortex/config.yaml`, each returning `No files found`. She then asks the operator for their name and language. Mila says the same in prose; Wade does not mention configuration at all. The effect is a degraded first turn: these three do not read `user_name`, `communication_language` or `output_folder` unless the operator supplies them. The four unconverted discovery agents and all four readiness agents read the file and echo all three fields. Filed as `T183`.
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
- `compass-routing-reference.md` and the Vortex README ship in the package but are not copied into the project. The routing rows the agents use live in the installed step files, so nothing dangles. **Corrected 2026-09-26:** this is the same existence-versus-resolution error as §2.1 — see that row, and note that five of the fourteen named contracts have no file at all.
- **Test:** `tests/p0/p0-handoff-contracts.test.js` parses each HC schema's YAML block and field table. It runs in the CI `coverage` job, which passed at the tag.

**Why Shipped:** the shipped docs describe exactly what ships: five schemas and five guidance-level routing rules, with the interrupt pattern openly deferred. The client note states the one thing a reader might otherwise assume: conformance is by instruction, not software validation.

---

### 2.3 Gyre production-readiness team: Works with limits · Convoke

```
$ for f in $P/_bmad/bme/_gyre/agents/*.md; do echo "$(basename $f) lines=$(wc -l <$f | tr -d ' ') <agent=$(grep -c '<agent ' $f) $(grep -m1 -oE 'name="[A-Za-z]+"' $f)"; done
  model-curator.md lines=131 <agent=1 name="Atlas" · readiness-analyst.md 130 name="Lens"
  review-coach.md 133 name="Coach" · stack-detective.md 128 name="Scout"      → all 4 are v5 XML
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

### 2.4 Team Factory: Mapped, not built · Convoke

**What ships:**
- 32 files under `$P/_bmad/bme/_team-factory/`: agent `team-factory.md` (v5 XML), `workflows/step-00-route.md` and `workflows/add-team/step-01..05` (**one workflow, add-team**), plus `lib/` writers, validators, schemas and templates.
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

**Open rows: 25 live rows with Portfolio `loom` at HEAD `b2900c39`, all in the Fast Lane and none closed.** `T136`, `T128` and `T164` closed with the repair epic and are not among them; `T174`–`T179` are at that HEAD, not uncommitted. Re-derive with the repository's own parser (`parseTables`/`isClosed` from `scripts/audit/backlog-integrity.js`) rather than by hand — an earlier enumeration here listed 22 rows against a count of 25 and included three closed ones. At least two HEAD rows (T167 `run-context.js`, T169 `output-directory.js`) concern files added after v4.0.2.
- **The 25 rows:** T168, T139, T170, T132, T134, T127, T165, T167, T163, T147, T137, T138, T166, T169, T175, T176, T177, T141, T178, T179, T151, T174, I7, I9, I68.
- **Rows most relevant to the client note:**
  - **T128**: the terminal gate "can never report success where teams are actually built" — **closed** 2026-09-15 by `tfr-1-1`, along with `T164` and `T136`. The repair epic (`tfr-epic-1`) is done: `add-team` runs end to end and its blocks execute verbatim in documented order. What has *not* changed is the outcome this row's verdict rests on — no generated team has ever been installed.
  - **T147**: "a factory-built team is installed by nothing at all". Verified above.
  - **T127**: emits v5 XML agents and hard-fails v6.3. Ruled 2026-09-11 as accepted.
  - **T136**: the `run:` blocks cannot be pasted with real data.
  - **T164**: steps can be skipped while the flow reports success.

**Shipped documentation no longer overclaims — corrected in 4.0.3.** Until 4.0.2, `README.md:100` said "Output passes the same validation as the native teams", which `T128` and `tf-2-11` AC#7 contradicted. That sentence is gone. The shipped text now reads: *"It is a preview: its first steps record your design decisions as a resumable spec, but generating the team writes into Convoke's own source files, so it only completes inside a clone of the Convoke repository, and nothing installs a generated team yet. Treat the result as a starting point, not a finished team."* Shipped documentation and observed behaviour now agree.

**A governance fact that outranks the defects.** `T179` (filed 2026-09-16, open): the maintainer ruled the Team Factory **internal scaffolding, not a user-facing capability**, and planned its removal from the installed package as one coordinated change. That has not been executed — it still ships, still installs, and its agent still starts. For an evaluating organisation this matters more than the defect list: the owner has already decided this is not something to adopt.

**Why Mapped, not built (reclassified 2026-09-17, from *Works with limits*):** it ships and its design steps run, but the documented outcome — a new, validated, installable team — has never been achieved, and the row was therefore measuring that the steps execute rather than that the capability works. This ledger's own materiality rule (§2.0) decides it: a defect that removes the documented outcome is not a limit on a working capability. `T179`'s ruling — internal scaffolding, not a user-facing capability — is the operator's own statement of the same thing.

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

**Portfolio report.** The input basis for this run is not recorded, and the figure below is what the run printed. An earlier draft described it as "a scratchpad copy of 60 repo planning documents"; that description belongs to the migration-tool run further down, which reports `Total: 60`, and is inconsistent with this run's own `Total: 120`. The repository holds 120 `.md` files in `planning-artifacts/`, so 120 is the plausible corpus, but that is inference and is not asserted here:

```
$ cd $T && node node_modules/convoke-agents/scripts/lib/portfolio/portfolio-engine.js
  convoke   complete   draft (explicit)   Initiative complete — consider retrospective
  …
  Total: 120 artifacts | Governed: 109 | Ungoverned: 11 | Unattributed: 0
  loom          complete    complete (explicit)     Initiative complete — consider retrospective
  gyre          complete    complete (explicit)     Initiative complete — consider retrospective
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
- **Shipped claim, softened in 4.0.3.** Until 4.0.2, `README.md:143` claimed "one axiom and seven Operator Rights every Convoke skill honours" — a universal present-tense claim beyond the evidence. It now reads: *"one axiom and seven Operator Rights every Convoke skill is **required to** honour. Authors self-check against the Compliance Checklist and reviewers confirm it; **nothing enforces it in software**."* The shipped text now states the enforcement gap itself, so the verdict rests on the remaining two grounds — the sampled 82% static audit, and the failing area's fix still in review — not on a contradiction between the README and reality.

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
$ export npm_config_cache=$SP/npmcache; cd $T && npm install convoke-agents@4.0.3 → exit 0 ("added 14 packages … found 0 vulnerabilities")
$ npx --no-install convoke-version → "Status: Not in a Convoke project · Package version: 4.0.3" (exit 0)
$ npx --no-install convoke-install → exit 0
    [1/5] ⚠ _bmad directory not found - creating it · ⚠ BMAD Method not detected (Convoke will install standalone)
    ⚠ BMAD core not detected (package not in node_modules) — cannot verify v6.3 compatibility; proceeding anyway
    Created skill-manifest.csv (19/106 skills present) · Updated config.yaml to v4.0.3
    [5/5] ✓ All files installed successfully
$ npx --no-install convoke-doctor → exit 0, "All 31 checks passed. Installation looks healthy!"
$ npx --no-install convoke-version → "Installed version: 4.0.3 · Package version: 4.0.3 · Status: ✓ Up to date"
$ (copy of $T with _vortex/agents/hypothesis-engineer and .claude/skills/bmad-agent-bme-review-coach deleted)
  node …/convoke-doctor.js → exit 1: "✗ _vortex agents · ✗ BME agent skill wrappers · 2 issue(s) found, 29 checks passed."
```

**Other bins:**
- `convoke-register-skill --help` exits 0.
- `convoke-audit-skill-dirs` exits 0 with "19 … all passed".
- `convoke-audit-bmm-deps --dry-run` reports "0 auto-scan + 0 manual rows". Its `--help` exits 1 as "unknown flag"; this is cosmetic.
- `convoke-validate-marketplace --help` exits 0.
- `install-gyre-agents.js` exits 0.

**CI:** `fresh-install` job at tag run `35211917101` printed `[install exit 0]`, `All 31 checks passed`, `all 5 export(s) succeeded`, `all 14 bins present, shipped, parseable, and their requires resolve`, `[installed-tree status 0]`, `[shipped-links status 0]` and `PASS — a new user gets a working, self-consistent install.` That job packs the tagged tree, not the registry tarball; the registry trial above covers the gap.

**Hosts.** Code: `$P/scripts/update/lib/refresh-installation.js:792-1017` writes wrappers to `.claude/skills/` only. A `find` in `$T` for `.cursor*`, `.github`, `AGENTS.md`, `.clinerules`, `.windsurf*` and `copilot-instructions.md` (excluding node_modules) returned nothing. Whole-word searches for Cline, Windsurf, Codex, Gemini CLI and ChatGPT found no host claim, so **these tools are neither claimed nor supported**. CI runs on `ubuntu-latest` only (`grep runs-on .github/workflows/ci.yml`); the trials here ran on macOS; Windows is untested.

**Backlog (Bug Lane at HEAD, 6 rows — T181, T183, T182, BUG-4, BUG-20, BUG-9, as §2.0 records; the three most relevant to this row are below):**
- **BUG-20** (Open): the "BMAD core not detected" warning fires for essentially every operator. Reproduced in both trials.
- **BUG-9** (Open): `convoke-update`'s downgrade hint hardcodes `@latest`, affecting prerelease testers only.
- **BUG-4** (Open): doctor cross-module version drift. **Not reproduced**: "Version consistency 4.0.3 — package and config versions consistent" in both the fresh and upgraded projects. Possibly stale.

**Other open rows:**
- **T112** (Open): doctor's fix line for `unregistered-custom-skill` leads to a hard failure. This needs a custom BMM-dependent skill and was not exercised.
- **S3** (Qualified, Initiative Lane): a one-command `npx convoke-agents init`, not built. The current two-step install works.

**Why Shipped:** the documented outcome was reproduced on the published package, and the health check was shown to detect breakage. The remaining defects are diagnostic.

---

### 2.11 Upgrades: Shipped · Convoke

```
$ cd $SP/upgrade33 && npm install convoke-agents@3.3.0 && npx --no-install convoke-install → exit 0; convoke-version "Installed version: 3.3.0"
$ npm install convoke-agents@4.0.3 && npx --no-install convoke-update --yes → exit 0   (From: 3.3.0  To: 4.0.3)
    [4/5] ✓ Config structure · ✓ Agent files · ✓ Workflow files · ✓ Agent manifest · ✓ User data preserved (Files: 1, expected: 1)
          ✓ Deprecated workflows · ✓ Workflow step structure · ✓ Enhance module · ✓ Artifacts module · ✓ Portability module
    ✓ Migration completed successfully! Changes applied: ✓ 3.3.x-to-4.0.0 ✓ refresh-installation
    Backup location: …/upgrade/_bmad-output/.backups/backup-3.3.0-1789422636325
$ npx --no-install convoke-doctor → exit 0, "All 31 checks passed." · convoke-version → "Installed version: 4.0.3 … ✓ Up to date"
$ npx --no-install convoke-migrate → 13 migrations listed, 1.0.x-to-1.3.0 … 3.2.x-to-4.0.0
$ (fresh project) npx --no-install convoke-update --dry-run → exit 0, "✓ Already up to date! (v4.0.3)"
$ cd $SP/upgrade && (4.0.2 install) && npm install convoke-agents@4.0.3 && convoke-update --yes → exit 0
    From: 4.0.2  To: 4.0.3 · "No migration deltas needed — refreshing installation files."
```

**The 4.0.2 → 4.0.3 upgrade repairs the mis-written readiness config in place**: `submodule_name` `_vortex`→`_gyre`, `output_folder` `vortex-artifacts`→`gyre-artifacts`, and both missing keys added. The discovery config gains the two keys the same way.

**One path cannot deliver the new refusal (`T180`, Open).** With a *discovery* `config.yaml` that will not parse, version detection cannot read it, falls back to guessing `1.1.0` from the directory layout, and offers a seven-migration plan:

```
Update Plan:  From: 1.1.0  To: 4.0.3
Could not check migration history: duplicated mapping key (40:1)      (×7)
Migration 3/7: 1.5.x-to-1.6.0
✗ 1.5.x-to-1.6.0 failed: duplicated mapping key (40:1)
✗ Migration failed! … Restoring from backup… ✓ Installation restored from backup
```

exit 1, and the config is byte-identical afterwards. With a damaged *readiness* config the refusal does land: `✗ Update failed! config-merger: refusing to overwrite …/_gyre/config.yaml: it is not valid YAML …`. A rollback after a failed migration was therefore observed once, and it restored the installation.

- **Tests:** `tests/integration/upgrade-cli-e2e.test.js` passed in CI (`✔ Test 16: v3.x → v4.0 upgrade (AC9 + R1-H2)` in the `test (22)` log).
- **Backlog:** BUG-9 (above). **BUG-8**, rollback unable to restore rewritten files, is in §2.5 as fixed `cc685063`.
- Not trialled: upgrades from 1.x/2.x, and rollback after a failed migration.

**Why Shipped:** reproduced on the published package from the most recent breaking baseline.

---

### 2.12 Release pipeline: Shipped · Convoke

```
$ gh run list --commit 35b7793f… → "completed success … CI v4.0.3 push 35211917101"
$ gh run view 35211917101 --json jobs --jq '.jobs[] | "\(.name)\t\(.conclusion)"'
  lint success · test (18) success · test (20) success · test (22) success · coverage success · agent-surface-parity success
  python-test success · package-check success · security success · fresh-install success
  Downgrade guard (dry) skipped · burn-in skipped · publish success
$ grep -n "needs:" .github/workflows/ci.yml → 580: needs: [lint, test, python-test, coverage, security, package-check, agent-surface-parity, fresh-install]
$ grep -n "if: startsWith\|id-token" .github/workflows/ci.yml → 582: if: startsWith(github.ref, 'refs/tags/v') · 592: id-token: write
$ cd $T && npm audit signatures → "14 packages have verified registry signatures · 1 package has a verified attestation"
$ curl -s https://registry.npmjs.org/-/npm/v1/attestations/convoke-agents@4.0.3 | <decode>
  https://slsa.dev/provenance/v1 {"ref":"refs/tags/v4.0.3","repository":"https://github.com/amalik/convoke-agents","path":".github/workflows/ci.yml"}
  https://github.com/amalik/convoke-agents/actions/runs/35211917101/attempts/1
  Rekor logIndex 2877236851, integrated 2026-09-17T10:44:26Z
$ curl -s "https://rekor.sigstore.dev/api/v1/log/entries?logIndex=2877236851" → entry returned
$ gh release view v4.0.3 --json … → isDraft false, isPrerelease false, publishedAt 2026-09-17T10:58:55Z
```

- **Coverage** (`coverage` job at the tag, c8 "All files" line): statements 88.61%, branches 84.08%, functions 91.7%. Scope: files instrumented in that job's run.
- **Open backlog rows (Fast Lane, HEAD):**
  - **T47**: nothing re-reads `dist-tags.latest` after `npm publish`.
  - **T45**: the npmrc credential scan inspects zero files.
  - **T48**: tag delete-and-repush cancels its own run.
  - **T43**: no `rc` downgrade protection.
  - **I152**, **I106** (Node matrix only on the test job), **T27**, **I102**.
  - None of these made 4.0.2 wrong; each is a hardening gap.

**Why Shipped:** gating, tag-only publishing and provenance were verified end to end for the current release.

---

### 2.13 Plugin marketplace distribution: Mapped, not built · Convoke

```
$ cat $P/.claude-plugin/marketplace.json
  plugins: [{ name: "convoke-vortex", source: "./", version: "4.0.0", skills: [7 × ./_bmad/bme/_vortex/agents/<id>] }]   (package is 4.0.3; no Gyre/Team Factory/Enhance)
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
- **I98** (Reinstated): Gyre packaging blocks I113 Epic 4 Story 4.1.
- **I113** (In Pipeline): marketplace structural adoption is Epic 4, "Phase-2 fast-follow; does not gate the MVP".
- **I97** (In Pipeline).
- **T205 / T206** ✅ Done 2026-09-21 — the drift this section's own `$ cat` block records is fixed (manifest now `4.0.3`), and `validate-marketplace.js` is wired into `agent-surface-parity` with the drift as a hard failure. The capture above is left as the record of what was true on this ledger's 17 September basis; read it as history, not as current state. See the completed-work archive.
- **T107 / T108** closed INVALID 2026-09-21 — `module_definition` is absent from `marketplace.json` by design, not omission. See the completed-work archive.

*Basis for the two bullets above: assessed 2026-09-21 against HEAD, not on this ledger's 17 September basis — the same named-exception treatment §2.18 and §2.19 carry. The two 2026-09-14 bullets they replace (T107, T108) were deleted rather than struck, because the rows no longer exist in any lane.*

**Why Mapped, not built:** the metadata ships, but the *marketplace* distribution route was declined and not resubmitted. **Corrected 2026-09-26** — the original sentence read *"the distribution channel does not exist for Convoke"*, and that was false: the shipped manifest is read by the `npx skills` CLI, which searches manifest-declared paths outside its bounded directory walk, and one declared agent has been listed publicly since June 2026. The status stays *Mapped, not built* because nothing about that route is supported, versioned or withdrawable — not because it is inert.

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

| Row | Row claims | Observed on the published package (4.0.3 unless a row says otherwise) |
|---|---|---|
| I98 | Gyre "cannot be installed or invoked through any supported path" | `convoke-install` and `install-gyre-agents.js` install Gyre and generate 4 resolving wrappers. The structural half (no `module.yaml`) still holds. |
| I141 | `_portability` never copied, skills unreachable | Copied, 4 wrappers generated, doctor green. Script comment records the fix 2026-09-07. |
| BUG-4 | doctor reports cross-module version drift | Fresh and upgraded installs both report "4.0.3 — package and config versions consistent". |
| `package.json` `//files` | "I97 Epic 2 is 2 of 7 done" | 3 of 7 agent files are converted. |

---

### 2.18 Finding and confirming what you installed: Works with limits · Convoke; BMAD Method

Assessed 20 September 2026. Unlike most rows here, this one is reproducible from source alone — no install
trial is needed to see it.

**The installer verifies a subset of what it installs.** In `scripts/install-vortex-agents.js`, the phase-5
check list is built from the `AGENTS` array — the seven discovery agents — twice over (agent file, then
generated skill) plus the configuration file: fifteen checks. The same run also writes skills for the four
readiness agents and the team-factory agent. None of those five is in the list, so the verification cannot
fail on them, and "All files installed successfully" is a statement about fifteen paths rather than about the
installation.

**The banner says what it checked, and reads as more.** The success box prints `All Vortex Agents Installed!`
That is accurate about the discovery team and is the last line most operators read. `Next Steps` then lists
seven activation commands; twelve agents are installed.

**BMAD Method's router does not know Convoke exists.** `.claude/skills/bmad-help/SKILL.md` — the skill whose
job is answering *what should I do next* — contains **0** occurrences of `bme`, `vortex`, `gyre` or
`convoke`. The modules it names are `core` and `bmm`. An operator who asks the ecosystem's own help skill
what is available will not be told about anything Convoke ships. Convoke can address this with a
customisation override and has not.

**The readiness team's guides never arrive.** Filed as `T91` (2026-08-27, open): `guides/` and
`compass-routing-reference.md` ship inside the package and no install path copies them into the project.

**Field corroboration.** Operators in different roles at different client organisations independently reported
both halves of this row — not finding capabilities that were already installed, and not being able to tell
whether the install had succeeded. Those reports are held confidentially and are not quoted here; they are
recorded because they arrived independently of each other and independently of this repository, and because
the underlying defects are verifiable above without them.

**What this row does not claim.** That the capabilities are missing. Every one of them is installed and
starts. The defect is that the product under-describes itself at exactly the moment a new operator is
deciding whether it worked.

### 2.19 Supply chain and how you obtain it: Works with limits · Convoke; BMAD Method

Assessed 20 September 2026 against the working tree at `1b584d24` — a later basis than the rest of this
ledger, which is stated rather than smoothed over. The dependency facts were then re-checked against the
published 4.0.3 tarball and are identical there: the same four direct dependencies, unchanged between the
tree and the release. The distribution limit below is a property of the channel, not of any one version.

```
$ node -e "console.log(require('./package.json').dependencies)"
{ chalk: '^4.1.2', fs-extra: '^11.3.3', js-yaml: '^4.3.1', yaml: '^2.8.3' }

$ npm audit --omit=dev --json   # metadata.vulnerabilities
{"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0}   # across 14 production packages
```

Build provenance is covered in §2.12 and is not restated here.

**The distribution limit is real and unsolved.** npm is the only supported channel. **Corrected 2026-09-26:** it is not the only *reachable* one — see the §1 marketplace row. The limit below is unchanged and remains the sharper problem. There is no binary
distribution, no documented internal-registry or mirror path, and no air-gapped procedure. An organisation
whose policy prevents pulling from the public registry at deployment scale has no supported route, and this
ledger should not imply otherwise.

**A verification that failed, recorded rather than dropped.** An operator reported seeing third-party risk
ratings — Gen, Socket and Snyk columns — displayed during a BMAD Method skills installation, with
medium-risk entries among them. An attempt to reproduce those values from the cited source
(`https://skills.sh/bmad-code-org/BMAD-METHOD`, fetched 20 September 2026) returned a page displaying **no
ratings at all**. The values could not be confirmed from the source that was cited for them, so they are
**not published here** — restating an unverified security rating about somebody else's package is precisely
the kind of claim this ledger exists to refuse.

What survives verification is structural, and is what the client-facing row states: adopting Convoke means
adopting **two** supply chains, only one of which is ours, and the other's scan results will be surfaced to
whoever installs it. Evaluate them separately.


## 3. Uncertain rows

1. **Vortex (Works with limits): impact of the `bmad-init` reference in the 3 converted agents.**
   - *Verified:* the instruction exists, no such skill is installed in a standalone project, and CHANGELOG 4.0.0 says it was removed.
   - *Unverified:* whether Emma, Wade and Mila activate correctly in Claude Code anyway, since the model may find `_bmad/bme/_vortex/config.yaml` on its own. If they do not, the Vortex note should add that three agents fail to start in standalone installs.
   - *Settled in part:* the live activations in §2.1 were run against a fresh standalone **4.0.3** install. They establish that the agents start; the config-reading behaviour is the part that varied between runs.

2. **Team Factory: settled 2026-09-17 — reclassified to *Mapped, not built*.** No longer uncertain; kept here because the ledger's first version said otherwise.
   - It ships and its design steps run, but it has never produced a surviving team and a generated team is not installed (T147). `T128`, the terminal gate that could not pass, was closed by `tfr-1-1` on 2026-09-15; the outcome it gated still has not been achieved.
   - The stricter reading is now the ledger's: a defect that removes the documented outcome is not a limit on a working capability (§2.0 materiality rule). `T179` records the maintainer's own ruling to the same effect.
   - *Would reopen it:* the factory producing one team that installs via `convoke-install` and passes validation, re-run against a published package.

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
   - *Would settle it:* install BMAD Method, then Convoke 4.0.3, in a scratch project and run install, doctor and an Enhance menu check.

7. **Gyre (Works with limits): conflicting internal signals.**
   - Backlog I98 says Gyre is not installable through any supported path; the install trials (4.0.2, then 4.0.3) show it is, for npm + Claude Code. The ledger follows the trials.
   - If "supported path" in I98 means the marketplace or the v6.3 packaging contract, both are right. The owner should reword I98 before the whitepaper cites Gyre as "in development".

8. **Platform coverage.** CI runs only on Ubuntu, and the trials here ran on macOS. No evidence covers Windows; the backlog notes a copy-loop race "under Windows file-lock scenarios" (I89). The ledger makes no platform claim. Do not add one without a Windows run.

9. **Time sensitivity.** Re-derived against **4.0.3** and backlog HEAD `b2900c39` on 2026-09-17. (Written when the basis was 4.0.2 at HEAD `0db3aac8`.) Team Factory repair commits were landing as this was derived. If a version later than 4.0.3 publishes before it is read:
   - re-run the `npm view convoke-agents dist-tags --json` check and the §2.10 and §2.11 trials against it
   - re-derive the `loom` count with `$SP/lanes.js`
