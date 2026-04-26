---
status: draft-pending-commit
target_file: project-context.md
target_position: between `slash-command-ux-for-user-facing-tools` and `no-code-in-party-mode`
drafted: 2026-04-26
drafted_in: party mode session (John, Winston, Amalik)
approved_text: yes (Amalik 2026-04-26)
commit_deferred_until: v6.3 Epic 3 (Marketplace) ships
defer_reason: Parallel Claude track active on v6.3 work; mid-flight rule changes could cause inconsistent behavior between in-flight agents. Self-applied I94 (parallel-track collision detection) decision.
related: I92, I94, feedback_prefer_bmad_channels.md
---

# Draft Rule for project-context.md (Pending Commit)

The text below is approved by the operator and ready to paste into `project-context.md` once the v6.3 release track is no longer mid-execution.

**Commit instructions:** Paste the section between the `---START---` / `---END---` markers below into `project-context.md` between the existing `## Rule: slash-command-ux-for-user-facing-tools` block and the `## Rule: no-code-in-party-mode` block. Then delete this staging file.

---START---

## Rule: prefer-bmad-channels-over-freeform-claude

**Statement.** Default channel for project work is the appropriate BMAD agent or skill — not free-form Claude conversation. When the request has an obvious agent/skill/workflow owner, route there. When unclear, name candidate(s) and ask the operator. Free-form chat is a fallback for off-process exploration, not the primary work mode.

**Why.** Operator (Amalik, 2026-04-26) flagged process drift over the prior ~2 days where work bypassed BMAD agents and ran as free-form Claude chat — output became over-complicated and execution drifted from BMAD standards. Convoke's value proposition depends on consistent, agent-mediated execution; if its own author drifts off-process, end-users will too. See `feedback_prefer_bmad_channels.md` in auto-memory.

**How to apply.** At the start of any non-trivial request, identify the BMAD owner (agent, skill, or workflow) and propose routing there before working directly. Resist drift to free-form discussion when a workflow exists. Applies mid-conversation: if a chat session grows into real work, name the agent/skill that should take over and propose the handoff. Self-check signals that drift is happening: response length growing, multiple parallel sub-tasks accumulating without an owning skill, decisions being made conversationally that would normally go through a story spec or qualifying gate. Pairs with the existing `no-code-in-party-mode` discipline.

---END---
