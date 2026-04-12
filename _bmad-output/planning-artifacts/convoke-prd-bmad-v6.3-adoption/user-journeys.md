# User Journeys

## Journey 1 — Priya upgrades Convoke mid-engagement (primary user, happy path)

**Persona:** Priya, IT transformation consultant at a large European consultancy. Six weeks into a client engagement running a Vortex discovery with Convoke 3.2.0. Has no interest in framework maintenance; Convoke is a tool she relies on daily but doesn't think about. Target: finish the discovery on time.

**Opening scene.** Tuesday morning, week 7 of the engagement. Priya opens her project terminal, intending to run another Vortex stream with Isla (discovery empathy expert). `convoke-doctor` shows a notice: "Convoke 4.0 is available." She hesitates — mid-engagement upgrades feel risky. She checks the CHANGELOG.

**Rising action.** The CHANGELOG leads with Sophia's `mostHonestOneLineSummary`: *"Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD evolves and adds marketplace distribution for reach."* Priya reads three sentences and understands: nothing new to learn, no re-onboarding, just a single command with auto-migration. She runs `convoke-update`.

**Climax (non-event).** The update completes in under 30 seconds. No prompts. No config questions. The `bmad-init` config pattern is silently migrated. Priya runs her Isla stream — the empathy map comes out identical in structure to yesterday's. Agent behavior equivalence holds. She never notices that anything changed under the hood.

**Resolution.** End of day, Priya has completed another Vortex stream without any friction. She closes her terminal without thinking about the upgrade again. **Success state:** the release was invisible.

**Requirements revealed:**
- Single-command upgrade (`convoke-update`)
- Idempotent auto-migration script
- CHANGELOG that leads with honest summary (no FOMO, no FUD)
- Agent behavioral equivalence guarantee (PF1 validation)
- Recursive tooling continuity (if Priya was using `bmad-enhance-initiatives-backlog` to track client findings, it must still work — WS4 first validation target)

## Journey 2 — Priya hits an edge case during migration (primary user, error recovery)

**Persona:** Same Priya. Two weeks later, starting a new engagement. Installs Convoke 4.0 fresh in a new project directory.

**Opening scene.** Priya runs `convoke-install` for the new project. It succeeds. She runs `convoke-doctor`. She expects a clean health report. Instead she sees a warning: `Extension governance registry check: 'bmad-enhance-initiatives-backlog' passed. All other dependencies: 0 detected — scan tool unable to parse custom skill pack at .claude/skills/priya-custom-note-tool/SKILL.md`. She froze.

**Rising action.** Priya has a custom skill she wrote herself that extends John (PM) for her own note-taking workflow. It isn't in the official BMM agent set, so `bmm-dependencies.csv` doesn't know what to do with it. The extensions governance registry (WS4) is telling her honestly: "I couldn't validate this, but I detected it, here's what I see." She considers her options:
1. Remove her custom skill entirely.
2. Ignore the warning and continue.
3. Read the governance documentation to understand how to register her custom skill.

She picks option 3. The governance rule documentation (delivered as part of WS4) explains: "New Convoke skills extending BMM agents must register in `bmm-dependencies.csv`." She adds a row manually. `convoke-doctor` re-runs. Clean report.

**Climax.** The edge case wasn't a bug — it was the governance system *working as designed*, surfacing a dependency that would otherwise have silently broken on a future upgrade. The warning was a feature, not a failure. Priya's custom skill is now registered and will be validated on every future upgrade.

**Resolution.** Priya proceeds with her engagement. She now understands, at a basic level, that Convoke has a governance layer that protects her custom work. Next time she writes a custom skill, she'll register it proactively.

**Requirements revealed:**
- Extensions governance registry surfaces non-standard skills with clear warnings (not silent pass)
- Governance rule documentation is discoverable (linked from warning message)
- Manual registry editing is documented and supported for user-owned extensions
- Warning messages are honest signals, not errors that block work
- `convoke-doctor` health reports distinguish "missing" from "present but unverified"

## Journey 3 — Samira discovers Convoke via the BMAD marketplace (new user, marketplace flow)

**Persona:** Samira, junior consultant on Priya's team. Has never used Convoke. Heard Priya mention "the Vortex discovery thing" and wants to try it on a smaller project. Already has BMAD installed — she uses the core BMAD methodology for everything.

**Opening scene.** Samira is in her editor, exploring the BMAD installer's community module browser. She's looking for something to help with product discovery on a client proposal she's drafting. She sees a listing: `convoke — A 7-agent product discovery framework for IT transformation consultants`. Trust tier: `unverified`. She recognizes "Vortex" from Priya's conversation and clicks install.

**Rising action.** The marketplace flow shows her Convoke's README preview, the module_definition metadata, and the required/recommended modules. She accepts the install. `git clone` runs (BMAD's community module flow). Convoke is installed alongside BMAD. She runs `convoke-install-vortex` which she sees documented in the post-install notes. It completes without asking her any config questions she doesn't already know from BMAD. She runs her first Vortex stream.

**Climax.** Emma (contextualization expert) greets her, walks her through a problem-framing exercise for her client proposal. Samira feels like she just unlocked a capability — she has an AI teammate who can methodically break down a consulting problem the way Priya does. The `trust_tier: unverified` warning is visible but Samira isn't worried — she trusts the recommendation chain (Priya → Convoke) more than she'd trust a generic trust badge.

**Resolution.** Samira completes her proposal with Emma's help. She tells Priya thank you, Priya says you're welcome, and Samira adds Convoke to her personal tooling. Over the next month she tries Isla, Liam, and Max. Each one works as advertised. She never notices the details of how Convoke was installed; she just notices that it worked.

**Requirements revealed:**
- `marketplace.json` accurately describes Convoke to the BMAD installer
- `module_definition` points to the correct `module.yaml` so PluginResolver discovers capabilities
- Post-install notes guide the user toward `convoke-install-vortex` (or equivalent next step)
- `trust_tier: unverified` is honestly displayed but doesn't block install
- First-run experience is coherent without requiring Convoke-specific knowledge beyond what BMAD users already know

## Journey 4 — Amalik (maintainer) runs the release (the operator journey)

**Persona:** Amalik, solo maintainer of Convoke. Six weeks of capacity allocated to 4.0. Wants the state-of-the-art quality bar he committed to but also wants to stay sane.

**Opening scene.** Sprint 0. Amalik sits down to kick off the release. He opens Winston for CA (Create Architecture). They go through the PRD frontmatter together. Winston writes the architecture doc specifying the drift threshold T (M6), the validation battery composition (M9), the governance registry schema (M14), and the `host_framework_sync` playbook outline (M13). The architecture doc passes the IR gate before any dev story starts (M7).

**Rising action — Sprint 1.** Amelia takes the architecture doc and the PRD. Sprint 1 begins with the three pre-registered experiments (M5). Day 1–2: EXP1 migration dry-run on Emma. Day 3: EXP2 marketplace PR pathfinder submitted. Day 4: EXP3 exporter smoke test across Claude Code, Copilot, Cursor. EXP1 passes — equivalence holds on 5 real inputs. EXP2 gets procedural feedback from BMAD org (clean). EXP3 passes — all 3 adapters (Claude Code, Copilot, Cursor) generate correctly and are self-contained. Amalik absorbs Bolder Move 3 into the 4.0 framing. The Executive Summary shifts to the broad version: "Convoke ships everywhere, starting with the BMAD marketplace."

**Climax.** Sprints 2–4. WS1 sweep executes per the migration inventory (M1/M2). WS3 Amelia consolidation runs in parallel. WS4 starts with the recursive tooling validation — `bmad-enhance-initiatives-backlog` passes first (Release Process Checklist item). Then the rest of the BMM dependency scan. WS2 submits the marketplace PR (M12a). The PF1 battery runs pre-release and passes (M9). The architecture budget trip-wire (M8) shows the architecture was delivered within N days — on target. Amalik realizes around week 5 that he's actually going to finish this on schedule.

**Resolution — Sprint 5.** Release ships. CHANGELOG published with Sophia's draft (M16). The `mostHonestOneLineSummary` is verbatim. Priya (from Journey 1) gets the notification and upgrades without incident. Samira (from Journey 3) discovers Convoke the next week via the marketplace. Amalik runs the scheduled retrospective (M17, from Release Process Checklist). Findings go back to the initiatives backlog. The bmad-init skill is gone. Convoke 4.0 is live.

**Requirements revealed:**
- Winston must deliver architecture doc within budget N days for M8 trip-wire
- IR gate (`bmad-check-implementation-readiness`) must accept the architecture doc cleanly
- Sprint 1 experiments must be parallelizable and low-friction to run in week 1
- Migration inventory (M1) must be frozen before Sprint 2 dev work starts
- Recursive tooling validation must run before other WS4 inventory work
- PF1 battery must be executable pre-release, not post-release
- CHANGELOG must be ready by ship day, not after
- Retrospective must be scheduled in Sprint 0 (not "after we ship")

## Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|---------------------------|
| **J1 — Priya's silent upgrade** | Single-command upgrade, idempotent auto-migration, honest CHANGELOG, behavioral equivalence guarantee, recursive tooling continuity |
| **J2 — Priya's edge case** | Governance registry with honest warnings, discoverable governance documentation, manual registration support, distinction between missing/unverified/present |
| **J3 — Samira's marketplace install** | `marketplace.json` validation, module_definition pointing correctly, post-install guidance, honest trust tier display, coherent first-run experience |
| **J4 — Amalik's release operation** | Architecture budget enforcement (M8), IR gate rigor, parallelizable experiments, frozen migration inventory, execution sprints with clear gates, pre-release validation, scheduled retrospective |

**Cross-cutting observation:** Three of four journeys are about *correctness under absence of friction*. Only J4 (Amalik's operator journey) is about *activity and effort*. That's the correct shape for a maintenance release — the users should barely notice, and the maintainer should carry most of the narrative weight.
