---
initiative: convoke
artifact_type: note
qualifier: bmad-v64-v65-interop-spike
created: '2026-04-26'
status: draft
schema_version: 1
inputs:
  - https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.4.0
  - https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.5.0
  - bmad-method@6.3.0, 6.4.0, 6.5.0 npm tarballs (read-only)
  - convoke-agents@3.3.0 npm tarball (read-only)
  - peer party-mode operability test in consumer project (BMAD 6.5.0 + Convoke 3.3.0)
---

# BMAD v6.4.0 / v6.5.0 Interop Spike — Findings

**Method:** Read-only desk research on BMAD source (3 versions) + Convoke source/published artifacts. Cross-referenced with operability test from a separate party-mode session run in a consumer project. **No code modified, no installs run in this working tree.**

**Status framing:** Epic 3 (Marketplace) has shipped 2026-04-25. These findings are **post-Epic-3 observations**, not Epic 3 development input. This note does NOT block Epic 4/5 in flight.

---

## TL;DR

1. **v6.4.0 + v6.5.0 blast radius for Convoke is small and mostly additive.** No structural breakage. Two minor enhancement opportunities (channel field declaration, `.agents/skills/` cross-tool standard).
2. **Convoke's marketplace strategy — Vortex-only via PluginResolver Strategy 5 ("Path C" / synthesize fallback) — survives v6.4/v6.5 unchanged.** PluginResolver's contract is stable across the release window.
3. **Real strategic context surfaced:** ~60% of users install BMAD first then add Convoke; ~40% use Vortex standalone (export-based). Two-product framing should be made explicit.
4. **One verified bug:** `_bmad/bme/_team-factory/workflows/add-team/` has no `workflow.md` (only step-01 through step-05). Whether the loader tolerates this is empirical.
5. **Three open empirical questions** that the test install (BMAD 6.5 + Convoke 3.3.0) can answer in minutes.

---

## What v6.4.0 / v6.5.0 actually changed (relevant slice)

| Change | Source ref | Effect on Convoke 3.3.0 |
|---|---|---|
| TOML customization framework (`_bmad/config.toml`, `_bmad/config.user.toml`, `_bmad/custom/config.toml`) | v6.4 | Convoke writes to `_bmad/_config/manifest.yaml` etc.; BMAD writes new TOML files. **Coexist on disk, no overwrite of Convoke files.** |
| External-module `channel` resolver (`stable` / `next` / `pinned`) | v6.4 | Convoke's `marketplace.json` could declare `channel: stable` (minor enhancement, not required). |
| Agent writeback into host `_bmad/config.toml` via `manifest-generator.collectAgentsFromModuleYaml()` | v6.4 | Reads `module.yaml`'s `agents:` array. Convoke's marketplace path uses Strategy 5 (synthesize from SKILL.md frontmatter), so this code path is bypassed. **Empirical question: does Strategy 5 still populate `_bmad/config.toml`?** Verify in test install. |
| Skill scanner skips `_*` and `.*` directories during recursive walk | v6.3 (stable) | All Convoke submodules (`_vortex/`, `_gyre/`, `_team-factory/`) are underscore-prefixed → skipped by scanner. **Marketplace install uses explicit `skills[]` paths, so this doesn't affect Vortex's listing.** |
| 18 new agent-platform adapters | v6.5 | Pure opportunity. No-op unless Convoke wants to target new platforms. |
| `.agents/skills/` cross-tool standard adoption | v6.5 | **Free portability win** for the standalone-Vortex 40% segment. Track for adoption. |
| Removed dead files (`agent-command-generator.js`, `bmad-artifacts.js`, `module-injections.js`) | v6.4 | Convoke imports none of these. ✅ |
| fs-extra → `node:fs` migration | v6.4 | Convoke uses none. ✅ |

**Net assessment:** Compatibility is preserved. Adoption opportunities are minor and additive.

---

## Strategic context that emerged from this session

### Two products, one source of truth

Confirmed user split: **~60% install BMAD first then add Convoke** (lifecycle-extension addon use case). **~40% use Vortex Standalone via export bundle** (discovery-only, no BMAD).

Implication: Convoke is a *product*, BMAD-marketplace is a *channel*, standalone export is a *parallel channel*. The internal architecture is Convoke-shaped; BMAD compatibility is a thin adapter at the edges. The portability layer (`_bmad/bme/_portability/`, `convoke-export`, `bmad-export-skill`) is **load-bearing for the 40% segment, not a courtesy export.**

### Cadence policy proposal (not yet adopted)

**N-1 compliance with BMAD upstream.** When BMAD ships v6.X stable, commit to v6.(X-1) compliance within 4-6 weeks. Trailing-edge, predictable, lower-risk than chasing `latest`. Avoids the treadmill (v6.4 + v6.5 shipped one day apart on 2026-04-25/26).

### Marketplace scope decision recap

Per Epic 3 retro and `.claude-plugin/marketplace.json`:
- **In marketplace:** `convoke-vortex` plugin, 7 Vortex agent skills.
- **Out of marketplace, in npm:** Gyre (4 agents).
- **Out of both, repo-internal only:** Loom / Team Factory (1 agent).

This is a coherent multi-channel strategy. **Open product question:** should Gyre eventually be added to the marketplace as a second plugin (e.g., `convoke-gyre`)? Or stay npm-only? That's a 4.x or 5.x decision, not blocking.

---

## Verified findings

### 1. Missing `workflow.md` in `add-team` workflow

Path: `_bmad/bme/_team-factory/workflows/add-team/`
Files present: `step-01-scope.md`, `step-02-connect.md`, `step-03-review.md`, `step-04-generate.md`, `step-05-validate.md`
Missing: `workflow.md` (orchestrator), `step-00-route.md` (referenced by step-01 prerequisites but does not exist in source)

**Severity:** Medium. Whether the workflow runs end-to-end depends on the BMAD workflow loader's tolerance — strict loader fails to load, lenient loader enumerates step-files lexically.

**Routing:** Fast Lane bug. Verify by running `add-team` in test install before committing a fix. If lenient path works, decide whether to add `workflow.md` preemptively or accept the convention deviation.

### 2. Team Factory does not generate `module.yaml` for new teams

Step 04 generation list (verified in `step-04-generate.md`):
- `agents/{agent}.md` per agent
- `workflows/{workflow_name}/workflow.md` + steps per agent's workflow
- `config.yaml` (Convoke-internal module config)
- `module-help.csv` (PluginResolver Strategy 1 input)
- `README.md`, `compass-routing-reference.md`
- Updates to `scripts/update/lib/agent-registry.js`

**Not generated:** `module.yaml` for the new team.

**Severity:** Low for current Convoke use (Loom is repo-internal; Vortex's marketplace listing already exists). Becomes Medium if any future Convoke team needs marketplace listing via PluginResolver Strategy 1 (root module files).

**Routing:** P25 (Team Factory Phase 3 — add-agent + add-skill, unshipped) input. Add an acceptance criterion if/when a generated team needs marketplace exposure.

---

## Empirical questions for the test install

Three checks, ~5 minutes total in the consumer project running BMAD 6.5.0 + Convoke 3.3.0:

1. **`cat _bmad/config.toml`** — Do Convoke's 7 Vortex agents (or any subset) appear under `[agents.*]`? This determines whether PluginResolver Strategy 5 (synthesize fallback) populates the central agent roster, and answers the peer session's "12 agents not in global roster" observation definitively.
2. **`cat _bmad/bme/_gyre/config.yaml`** — Does the post-install file match the source (which has `submodule_name: _gyre`, no duplicates)? If post-install state differs, that's a real install-time transformation issue. If it matches, the peer session's "typo + dupes" claim was a false positive.
3. **Run the `add-team` workflow** — Does it complete end-to-end despite no `workflow.md`? Lenient vs strict loader behavior is the question.

---

## Recalibrated triage

| Item | Severity | Routing | Status |
|---|---|---|---|
| Missing `workflow.md` in `add-team` | Medium | Fast Lane | New, file to backlog |
| Team Factory generates `module.yaml` per team | Low (current scope) / Medium (future scope) | P25 / Phase 3 input | New, route when P25 picks up add-team work |
| `_gyre/config.yaml` post-install state divergence | Unknown | Empirical check #2 above | Open |
| `_bmad/config.toml` Vortex agents writeback | Unknown | Empirical check #1 above | Open |
| Channel field in `marketplace.json` | Low (enhancement) | Convoke 4.x backlog | New, low-priority enhancement |
| Adopt `.agents/skills/` cross-tool standard | Low (future) | Convoke 4.x or 5.x | Watch list |
| Gyre marketplace listing decision | Strategic | 4.x or 5.x product question | Open question for product owner |
| `bme/` directory location | Not a bug | Closed | Peer module pattern, intentional (per cis/, tea/, wds/, bmm/, bmb/) |
| BME ↔ BMM agent handoff discoverability | Mostly resolved by current setup | Validate empirically | Convoke skills already register globally as slash-command skills; BMAD roster registration is a separate surface |

---

## Recommendations

**🟢 No course-correct on Epic 3.** It shipped sound. Strategy 5 / "Path C" was the correct choice given the discovered marketplace.json schema reality (no `module_definition` field).

**🟡 Run the three empirical checks** in the test install before deciding on any Fast Lane bug filings. Cheap signal that converts unknowns to knowns.

**🟢 Adopt the two-product framing explicitly.** Update memory, update README/positioning when next touched. The 40% standalone-Vortex segment deserves explicit support, not implicit tolerance.

**🟢 Defer v6.4/v6.5 adoption beyond what's free.** N-1 cadence policy: when v6.6 ships and stabilizes, evaluate v6.5 adoption (channel field, `.agents/skills/` standard) as a single coordinated update. Don't chase upstream releases one at a time.

**🟡 Add to backlog (Fast Lane / P25 routing as appropriate):**
- `workflow.md` missing in `add-team` (Fast Lane bug, pending empirical check #3)
- Team Factory `module.yaml` generation for new teams (P25 input, conditional on use case)
- `marketplace.json` channel field declaration (Fast Lane enhancement)

---

## Honest notes on epistemic limits of this spike

1. **Read-only desk research.** I did not run any installs, so all "should work" claims are inferred from source, not observed. The test install is the source of truth for actual behavior.
2. **Peer session findings re-evaluated.** The peer party-mode session in the consumer project reported a `_gyre/config.yaml` typo + duplicate entries that I could not verify in published Convoke 3.3.0 source. Either (a) the peer session misread, or (b) something at install time transforms the file. Empirical check #2 settles this.
3. **Earlier in this session I over-stated the architectural risk.** I initially described the v6.4/v6.5 release as a possible blast radius and argued for a `_bmad/custom/bme/` migration. Both claims were wrong:
   - v6.4/v6.5 is mostly additive; not a blast radius.
   - `bme/` is a peer module (per cis, tea, wds, bmm, bmb), not a customization. The migration recommendation is retracted.
4. **`module.yaml` agent-enumeration framing was incomplete.** I argued Story 3.1 needed an explicit `agents:` AC. Reading the Epic 3 retro showed the team explicitly chose Strategy 5 (synthesize fallback) instead, which bypasses the need. My recommendation was based on Strategy 1 assumptions that don't match Convoke's actual implementation.

These corrections are in this note for traceability.
