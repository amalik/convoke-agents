---
initiative: convoke
artifact_type: decision-note
qualifier: v6-3-resequencing-and-v4-1-catchup
created: '2026-05-25'
schema_version: 1
status: recorded
signoff_by: amalik
qualifier_role: winston-architect
decision: option-f
---

# Convoke v6.3 Re-Sequencing & v4.1 Catch-Up Decision — 2026-05-25

**Backlog row:** [D16 (Fast Lane, RICE 6.0)](convoke-note-initiative-lifecycle-backlog.md#23-fast-lane-quick-wins--spikes)
**Triggered by:** Release-readiness probe 2026-05-25 (operator-attempted pickup of v63-4-5 + v63-5b-3 surfaced both as release-time-deferred and gated on stalled v63-4-3). Expanded scope via BMAD upstream release analysis (operator request: "analyze last BMAD Method releases and see how it impacts Convoke").

## Decision

**Option F: Ship Convoke 4.0 on v6.3 baseline as planned + commit to a v4.1 Initiative to absorb upstream BMAD v6.4 → v6.7 changes in a focused, time-bounded effort.**

Recorded by Amalik (operator) 2026-05-25, on Winston's recommendation.

## Status snapshot (2026-05-25)

| Surface | State |
|---------|-------|
| v4.0 ship progress | 23/29 stories shipped (~78%); Epics 1A/2/3/5A done; Stories 4.1, 4.2, 4.2b, 4.4, 5B.1, 5B.2 done |
| **v63-4-3 (PF1 validation cycle)** | **STALLED** — `in-progress`; context-rebuild required on resumption; **release path blocker** |
| v63-4-5 + v63-5b-3 | `ready-for-dev` but RELEASE-TIME-DEFERRED — both gate on v63-4-3 PF1 PASS |
| v63-1B-{1,2,3} (Amelia consolidation) | All at `backlog`; specs not authored. Per v63-5b-3 Decision 5 default: ship-without-1B |
| Upstream BMAD | v6.7.1 (2026-05-18) + Web Bundles v1.0.0 (2026-05-25, TODAY). **Convoke is at N-4** (5 minor + 1 patch + 1 new artifact behind) |
| BMAD marketplace PR #9 | **CLOSED 2026-04-27** (structural rejection by `bmadcode` — needs `skills/` at root) |
| Marketplace structural adoption | Already SPLIT from v4.0 ship 2026-04-28 ("path locked: simple-and-fast → separate initiative pending") |

## Options considered

| Opt | Description | Tradeoff | Verdict |
|-----|-------------|----------|---------|
| A | Defer v63-4-3 → 4.0.1 patch; ship v4.0 on v6.3 baseline now | Cheapest now, expensive later (forces near-immediate 4.1 to absorb v6.4-v6.7) | Considered |
| B | Ship 4.0.0-rc.X iterations until PF1 closes | Same v6.3 baseline as A, but delays ship; risks N-5 by close | Considered |
| C | Reduce v4.0 scope | Ignores upstream-lag dimension entirely | Considered |
| E | Re-baseline v4.0 against v6.7 | Months of additional work; kills v4.0 momentum | Considered, rejected |
| **F** | **Ship 4.0 on v6.3 as planned + scope v4.1 catch-up Initiative for upstream absorption** | Preserves train; bounds the catch-up; honors "simple-and-fast" 2026-04-28 path | **Chosen** |
| G | (Pair with F) Marketplace reality-check spike before 4.0 ships | Avoids sinking time into mechanism that may be gone post-v6.7 | **Executed 2026-05-25** (this doc) — finding: marketplace still viable; see spike findings below |

## Why F

1. **Preserves ship momentum.** v4.0 is 78% shipped on a v6.3 baseline plan that was deliberately scoped 2026-04-28 ("simple-and-fast"). Re-baselining mid-stream (Option E) would re-author significant planning artifacts and abandon work in flight.
2. **Bounds the catch-up.** v4.1 as a dedicated Initiative with explicit scope (6 epics, below) forces the upstream-divergence work to be planned, scoped, and finished — rather than absorbed ad-hoc across miscellaneous post-4.0 work.
3. **Honors the 2026-04-28 path-lock decision.** The team already split marketplace structural work out of v4.0 ship per "Path locked 2026-04-28: simple-and-fast → Epic 1B → 4.0.1 patch; marketplace structural adoption → separate initiative." F is the named continuation of that decision applied to the broader upstream catch-up, not a reversal.
4. **Addresses N-cadence structurally.** v6.4 release channels (`stable`/`next`/`pinned`, `--channel`, `--pin CODE=TAG`) are the structural fix to Convoke's N-1 cadence policy (~4-6 wk lag). Adopting them in v4.1 makes future BMAD-lag manageable rather than ad-hoc.
5. **Acknowledges divergence cost explicitly.** Option F's commitment to v4.1 catch-up makes the cost of staying-on-v6.3 visible (a quarter of work). Options A/B/C hide that cost; Option E pays it all at once at the wrong time.

## v4.1 catch-up Initiative scope (6 epics, draft)

| Epic | Scope | Forced/Optional | Cost estimate |
|------|-------|------------------|---------------|
| **E1** | **Marketplace structural adoption** (Pattern A — restructure to `skills/` at root + module.yaml + module-help.csv per PR #9 rejection feedback; resubmit `bmad-plugins-marketplace` PR) | Optional but high-leverage. Already PRD'd + Arch'd + 5 ADRs authored 2026-04-28 — execution gap | ~7 stories per existing plan |
| **E2** | **v6.7 module-help schema rename** (`after`/`before` → `preceded-by`/`followed-by` in Convoke modules' `module-help.csv`) | Forced if adopting v6.7 conventions | Small — schema migration |
| **E3** | **TOML customization framework adoption spike** (v6.4 — assess whether Convoke wrapper patterns collapse into `_bmad/custom/` overrides; could obviate significant wrapper-skill code) | Optional, high-leverage if positive | Spike first (~1-2 stories), then larger if go |
| **E4** | **Release-channels adoption** (v6.4 — pin Convoke's BMAD floor at v6.3 stable; allow operators to opt into v6.7 separately) | Structural fix for N-cadence | Medium — installer + manifest changes |
| **E5** | **`bmad-investigate` + `.decision-log` evaluation** (v6.7) | Optional capability gain — mirror, integrate, or pass | Spike each; commit only on positive |
| **E6** | **Web Bundles v1.0.0 evaluation** (2026-05-25 today — Gemini Gems + ChatGPT Custom GPTs distribution surface for Vortex Standalone segment, ~40% per two-product framing) | Optional capability gain; possibly its own initiative if scope justifies | Spike first |
| **E7** | **Activation-guardrails adoption as Covenant enforcement substrate** (v6.8 — adopt the `INCLUDE→READ→RUN→CHECK→FILTER→CD` guardrail pattern as the runtime mechanism that graduates OC-R5 (pause) from convention to enforced). Added 2026-06-20 — see [adr/v4-1/adr-001](adr/v4-1/adr-001-guardrails-covenant-enforcement.md) | Optional but high-leverage — strengthens the headline differentiator. **Gated** on the agent-internal-vs-operator-facing spike question | Spike first (binary gate), then bounded retrofit of existing `_bmad/bme/` skills |

**Estimated total:** ~1 quarter of focused work, depending on E3/E5/E6/E7 spike outcomes.

> **Scope update 2026-06-20:** E7 added after analyzing **v6.8.0** (2026-05-25), which this note's original appendix did not cover (appendix stops at Web Bundles v1.0.0). See Appendix C below and [adr/v4-1/adr-001](adr/v4-1/adr-001-guardrails-covenant-enforcement.md).

## v4.0 ship-track (per F)

1. **Resume v63-4-3 PF1 validation cycle** — high context-rebuild cost. Author D14 (PF1 resumption checklist / state-snapshot, RICE 2.1, Fast Lane) before pickup to reduce friction.
2. **v63-4-5 N=1 external validation** — release-time-deferred; runs after 4.3 closes per spec.
3. **v63-5b-3 release ship coordination** — release-time-deferred; runs after 4.3 + 4.5 close per spec.
4. **D13 (v63-4-5 Task 0.4 spec wording fix)** — `3.x-to-4.0.js` → chain-walker reference. ~5 min cleanup; defer to v63-4-5 dev pickup time (operator can correct in-flight).
5. **D15 (v63-1B-{1,2,3} story spec authoring)** — only needed if operator decides ship-WITH-1B. Default per v63-5b-3 Decision 5: ship-WITHOUT-1B (1B becomes v4.0.1 patch material).
6. **Tag v4.0.0, publish to npm, GitHub release** per v63-5b-3 Decision 4 sequencing.

## Open decisions still operator-owned

- **1B.x ship-with-or-without** — default ship-without per v63-5b-3 Decision 5. Confirm at v63-5b-3 pickup.
- **v63-4-3 resumption owner** — operator. D14 reduces friction but doesn't eliminate the context-rebuild cost.
- **v4.1 Initiative timing** — does v4.1 start immediately post-v4.0 ship, or is there a deliberate pause for v4.0 stabilization? Default recommendation: start v4.1 immediately to lock the commitment; E1 (marketplace) and E4 (release channels) are highest-leverage.

## Operator immediate actions (post-decision)

1. **Commit + push the ci-hygiene-1-1 changes + today's backlog updates + this decision doc** — closes ci-hygiene-1-1 story properly (AC4 operator action — pending since story shipped earlier this session).
2. **Add Initiative Lane row to lifecycle backlog** for "Convoke 4.1 — Upstream BMAD v6.4-v6.7 absorption" (separate Triage cycle; capture-what-we-decided rather than ceremony-before-doing).
3. **Decide v63-4-3 resumption window** — when does the operator allocate session time for the PF1 cycle? Without a resumption date, F's "ship 4.0 as planned" cannot execute.

## Appendix A — BMAD upstream impact analysis (Convoke lens)

### v6.4.0 (2026-04-25) — TOML customization framework + release channels

| Change | Convoke impact | v4.1 epic |
|--------|----------------|-----------|
| `bmad-customize` skill + `_bmad/custom/` TOML overrides across all agents/workflows | HIGH — could obviate wrapper-skill patterns | E3 spike |
| Release channels (`stable`/`next`/`pinned`, `--channel`, `--pin CODE=TAG`) | MED-HIGH — structural N-cadence fix | E4 |
| TOML replaces briefly-introduced YAML customization | LOW — never adopted YAML | — |
| -1683 LOC dead code removal (`agent-command-generator.js`, `bmad-artifacts.js`, `module-injections.js`) | LOW — Convoke unlikely to reference | grep-verify at spike time |
| Bob removed from workflow map diagrams | Confirms v63-1B Amelia consolidation direction | — |

### v6.5.0 (2026-04-26) — 18 new agent platforms (42 total)

- Cross-tool `.agents/skills/` standard for supported platforms
- **Convoke impact:** LOW-MED. Overlaps `convoke-export` portability layer in spirit; different audience (dev-tool adapters). Check whether `.agents/skills/` standard absorbs anything in P20

### v6.6.0 (2026-04-29) — Brownfield scoping + non-interactive installer

| Change | Convoke impact |
|--------|----------------|
| `--set <module>.<key>=<value>` non-interactive config | HIGH — could simplify install scripts |
| Brownfield epic scoping (file-overlap detection + design completeness gate) in `bmad-create-epics-and-stories` | HIGH — solves real Convoke pain point |
| PluginResolver for community installs (marketplace plugins with nested module.yaml) | Aligns with `convoke-vortex` shape |
| 31 misaligned rows in core/bmm `module-help.csv` repaired | MED — sibling to backlog I100 (module-help schema extension) |
| `project_name` moved from `[modules.bmm]` to `[core]` in config.toml (auto-migrated) | LOW |
| `--tools none` rejected; fresh `--yes` requires explicit `--tools <id>` | LOW — check install scripts at spike time |

### v6.7.0 (2026-05-17) — PRD/Brief rebuild + marketplace retirement + `.decision-log`

| Change | Convoke impact | v4.1 epic |
|--------|----------------|-----------|
| **Remote marketplace registry FULLY RETIRED.** No `bmad-code-org/bmad-plugins-marketplace` network calls in installer | CRITICAL — but **mechanism gone, registry still exists.** See spike findings below | E1 |
| **WDS bundled in official `bmad-modules.yaml` picker** | New strategic path long-term, NOT actionable for Convoke (no community type in bundled file) | — (future) |
| **`plugin_name` override** for module-code-vs-plugin-name divergence | HIGH — enables `convoke-agents` (npm) vs internal module code split | E1 |
| Community modules picker removed; install via `--custom-source <git-url-or-path>` | Convoke's BYO-URL path is **endorsed** post-v6.7 | E1 |
| `bmad-investigate` skill (forensic case-file investigation, evidence-graded findings) | HIGH — mirror or integrate | E5 |
| `.decision-log` pattern threading decisions through workflows | MED — cross-fertilize with ADR + sprint-status patterns | E5 |
| `bmad-prd` + `bmad-brief` rebuilt as Create/Update/Validate intent facilitators | MED — architecture pattern Convoke could apply | E5 |
| `after`/`before` → `preceded-by`/`followed-by` in module-help.csv | MED — forced change | **E2** |
| 12 of 14 Dependabot security alerts closed (lockfile-only) | LOW direct | — |

### v6.7.1 (2026-05-18) — BMad Automator rename fix
- Installer tolerates previously-installed-module-source-gone (baut→automator rename). Pattern useful for future Convoke module rename. **LOW current impact.**

### Web Bundles v1.0.0 (2026-05-25, TODAY)
- Gemini Gems + ChatGPT Custom GPTs distribution: self-contained ZIP bundles (`SKILL.md` + `INSTRUCTIONS.md` + supporting data)
- **Convoke impact: HIGH for Vortex Standalone audience (~40% per two-product framing).** Net-new distribution surface BMAD opened literally today. `convoke-export` targets dev-tools; chat-platform web-bundle export would be net-new Convoke capability | E6

## Appendix B — Marketplace landscape findings (2026-05-25 spike)

### Three distribution layers post-v6.7

| Layer | Status 2026-05-25 | Convoke path |
|-------|-------------------|--------------|
| **Bundled `bmad-modules.yaml`** (installer picker source-of-truth) | Only accepts `bmad-org` + `experimental` types (no `community` type observed in current schema) | Not accessible without org transfer — not a Convoke path |
| **Community marketplace registry** (`bmad-plugins-marketplace/registry/community/*.yaml`) | **STILL ACTIVE.** Repo last pushed 2026-05-16 (2 days before v6.7.0 release). README still describes submission flow | Resubmit `convoke.yaml` post-Pattern-A restructure |
| **BYO URL** (`--custom-source <git-url>`) | **ENDORSED** install mechanism for community modules post-v6.7 | Works today — Convoke installable via this path now |

**What v6.7 changed:** the installer no longer auto-discovers community modules in the picker. The marketplace becomes a **discoverability registry**, not an **install mechanism**. Convoke must rely on (a) marketplace registry visibility for discovery + (b) operators knowing the URL for `--custom-source`-driven install.

### PR #9 status (2026-05-25 verification)

**CLOSED 2026-04-27** by `bmadcode` (BMAD's owner). Constructive structural rejection:

> "Hi - thank you for your submission! I am excited to try this, but this will not work with the current installer - but should be a relatively simple fix I hope for you.
>
> For a module to be installable, all content should be in self contained skills. It looks like this might be from an older version of bmad.
>
> Ideally your repo will have at the root a skills folder and within the skills folder there should be a module.yaml and a module-help.csv.
>
> aside from that, everything then should be skills. skills should have all internal capabilities - or reference other skills within the custom module. The docs in BMB can help - or reach out in discord if you would like some help.
>
> The way the current bmm module though should help show the pattern - https://github.com/bmad-code-org/BMAD-METHOD/tree/main/src/bmm-skills - notice that all nested folders are skills and are listed in the module-help.csv and the agents if you want them to be available in party mode are also listed in the module.yaml file.
>
> Will close for now, happy to help or chat if you need some help. The bmad builder skills can also help you convert as needed."

**The rejection IS the structural spec for v4.1 E1.** No reply or counter-PR posted by Convoke side post-rejection. Closure is final until a new PR is opened with the restructured layout.

## Appendix C — v6.8.0 impact analysis (added 2026-06-20)

v6.8.0 (2026-05-25) released the same day as the Option F decision and was not in the original appendix (which stopped at Web Bundles v1.0.0). Upstream head as of 2026-06-20 remains v6.8.0 — nothing newer. Convoke (v6.3 baseline) is now **N-6** (v6.4, v6.5, v6.6, v6.7.0, v6.7.1, v6.8.0 ahead).

| Change | Convoke impact | v4.1 epic |
|--------|----------------|-----------|
| **Strengthened activation guardrails across 23+ skills** — explicit prepend/append step naming + mandatory confirmation gates ("each step must run and be validated before the next activates"); kills agents short-circuiting `INCLUDE→READ→RUN→CHECK→FILTER→CD`, guessing variables, skipping append steps + `on_complete` hooks | **HIGH — intersects the Operator Covenant.** Orthogonal axis (agent↔author, not workflow↔operator) but reinforces OC-R5 (pause): guardrails are the enforcement layer that makes the Covenant's pause contract binding rather than conventional. **Not a competitor — an enforcement substrate.** Full analysis: [adr/v4-1/adr-001](adr/v4-1/adr-001-guardrails-covenant-enforcement.md) | **E7** |
| `bmad-spec` skill — five-field kernel (Problem / Capabilities / Constraints / Non-goals / Success signal) → `SPEC.md`; eight-rule Spec Law; `sources:` tracking | MED — planning-artifact pattern Convoke could apply; unrelated to guardrails | E5 (fold in) |
| `bmad-ux` two-file contract — `DESIGN.md` (visual tokens, Google Labs spec) + `EXPERIENCE.md` (behavior/IA/states/a11y, `{path.to.token}` refs) | LOW — WDS-adjacent; WDS is a parallel extension, NOT a Convoke module | — (awareness-only) |
| Web Bundles formally bundled into v6.8.0 release | (already captured as E6 via the standalone Web Bundles v1.0.0 entry) | E6 |

**Headline finding:** the guardrails do not threaten the Covenant differentiator — they are the runtime enforcement layer the Covenant has been assuming. Adopting them sharpens positioning ("guardrails make the agent obey; the Covenant makes the workflow accountable to the operator"). The one gate before adoption: confirm BMAD's confirmation gates are agent-internal, not operator-facing — an operator-facing gate adopted verbatim would itself violate OC-R7 (pacing). See ADR-001 for the binary spike.

## Provenance

- **Backlog rows added 2026-05-25:** D13, D14, D15, D16 (Fast Lane, IN-160 → IN-163)
- **Memory files updated 2026-05-25:** [project_marketplace_structural_adoption.md](../../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_marketplace_structural_adoption.md) + MEMORY.md pointer + project_v63_adoption.md pointer
- **Spike data sources:** `gh release view` output for v6.4.0 → v6.7.1 + web-bundles-v1.0.0; `gh api repos/bmad-code-org/BMAD-METHOD/contents/bmad-modules.yaml`; `gh pr view 9 --repo bmad-code-org/bmad-plugins-marketplace`
- **Predecessor analysis:** [spike-marketplace-packaging-delta.md](../implementation-artifacts/spike-marketplace-packaging-delta.md) (2026-04-27 — Pattern A decision)
- **Related decision artifacts:** `convoke-arch-bmad-v63-source-format-adoption.md` (I97 architecture, 2026-04-28); 5 ADRs at `adr/i97/`
- **Session context:** 2026-05-25 session — ci-hygiene-1-1 shipped + ci-hygiene-1-1 R1 complete + release-readiness triage + this decision

## Change Log

- **2026-06-20** — v6.8.0 absorbed into scope (Winston/Architect, per operator Amalik). Added **E7** (activation-guardrails adoption as Covenant enforcement substrate) to the v4.1 scope table (6→7 epics), Appendix C (v6.8.0 impact), and authored [adr/v4-1/adr-001-guardrails-covenant-enforcement.md](adr/v4-1/adr-001-guardrails-covenant-enforcement.md). Trigger: CA session "look at the latest BMAD Method releases and see how it impacts Convoke." Finding: upstream guardrails are orthogonal to the Operator Covenant and reinforce OC-R5 — an enforcement layer, not a competitor. Upstream head confirmed at v6.8.0 (Convoke now N-6).
- **2026-05-25** — Decision authored by Winston (Architect) per operator (Amalik) Option F selection. Captures: (a) F decision + rationale, (b) BMAD upstream impact analysis appendix (v6.4 → Web Bundles v1.0.0), (c) marketplace landscape spike findings, (d) PR #9 status correction (closed 2026-04-27), (e) v4.1 catch-up Initiative scope outline (6 epics, draft). Status: recorded. Sign-off: amalik 2026-05-25.
