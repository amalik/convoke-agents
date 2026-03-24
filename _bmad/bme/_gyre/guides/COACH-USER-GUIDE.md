# Coach 🏋️ User Guide

**(review-coach.md)**

- **Version:** 1.0.0
- **Module:** Gyre Pattern (Production Readiness)
- **Last Updated:** 2026-03-24

---

## Quick Start

**Who is Coach?** Coach is a patient guide who walks you through your capabilities model and findings. Coach never pushes — it presents options and respects your expertise. Through conversational review, you can amend capabilities, adjust findings, and capture feedback that improves the model for your entire team.

**When to use Coach:**

- Lens has produced findings and you want to review them
- You want to customize the capabilities model (remove irrelevant capabilities, add missing ones)
- You want to capture feedback about gaps Gyre missed

**Coach vs Other Gyre Agents:**

| If you want to... | Use... |
|---|---|
| Know what tech stack a project uses | **Scout** 🔎 |
| Generate a capabilities model for that stack | **Atlas** 📐 |
| Find what's missing from the project | **Lens** 🔬 |
| Review and refine the findings | **Coach** 🏋️ |

**What you'll get:** An amended capabilities manifest, reviewed findings, and feedback captured in `.gyre/feedback.yaml` — all persisted for future runs.

---

## How to Invoke

**Claude Code (skills) — recommended:**

```
/bmad-agent-bme-review-coach
```

**Claude Code (terminal) / Other AI assistants:**

```bash
cat _bmad/bme/_gyre/agents/review-coach.md
```

**Claude.ai:**

Open `_bmad/bme/_gyre/agents/review-coach.md` and paste its contents into your conversation.

---

## Menu Options

| # | Code | Description |
|---|------|-------------|
| 1 | **MH** | Redisplay Menu Help |
| 2 | **CH** | Chat with Coach about findings and customization |
| 3 | **RF** | Review Findings — walk through Lens's findings |
| 4 | **RM** | Review Model — walk through Atlas's capabilities |
| 5 | **FA** | Full Analysis — run the complete Gyre pipeline |
| 6 | **PM** | Start Party Mode |
| 7 | **DA** | Dismiss Agent |

Select by number, code, or fuzzy text match.

---

## Workflows

### [RF] Review Findings

Walk through Lens's findings severity-first — blockers, then recommended, then nice-to-have. Amend capabilities and capture feedback.

### [RM] Review Model

Walk through Atlas's capabilities manifest — keep, remove, edit, or add capabilities to tailor the model to your project.

Both RF and RM invoke the same model-review workflow. Coach asks which mode you want, or you can do both in sequence.

- **Prerequisite:** `.gyre/capabilities.yaml` (GC2) required; `.gyre/findings.yaml` (GC3) required for findings review
- **Output:** Amended capabilities.yaml + `.gyre/feedback.yaml` (GC4 contract)
- **When to use:** After Lens produces findings, or any time you want to refine the model

**Review flow:**

1. **Load context** — reads artifacts, displays any existing feedback, checks for deferred reviews
2. **Walkthrough** — walks through each capability or finding. For each item: keep, remove, edit, or add new
3. **Apply amendments** — writes changes directly to capabilities.yaml with amendment flags (`amended`, `removed`, timestamps)
4. **Capture feedback** — prompts "Did Gyre miss anything you know about?" Persists responses to `.gyre/feedback.yaml` with timestamp
5. **Summary** — presents review summary and Compass routing to next agent

**Findings are presented severity-first:** blockers, then recommended, then nice-to-have. You see the most critical items first.

**Amendment types:**

| Action | What happens |
|---|---|
| **Keep** | Capability unchanged |
| **Remove** | Capability flagged `removed: true` with timestamp. Excluded from future analysis. |
| **Edit** | Description or category updated. Original values preserved with `amended: true`. |
| **Add** | New capability added with `source: user-added`. Included in future analysis. |

**Feedback types:** missed-capability, missed-gap, severity-adjustment, other.

**Team benefit:** Coach explains that `feedback.yaml` should be committed to your repo. When teammates run Gyre, their analysis benefits from your amendments and feedback.

### [FA] Full Analysis

Same as Scout's Full Analysis — runs the complete pipeline. Coach handles step 5 (review).

---

## Philosophy

- **Your expertise wins** — Coach presents information and options. It never argues that you should keep a capability you want to remove. You know your project better than any model.
- **Non-destructive amendments** — Removals are flags, not deletions. Original values are preserved. Nothing is lost, and amendments can be reversed.
- **Feedback compounds** — Every review makes the model better for the next person. Feedback persists across runs and across team members.
- **Deferral is fine** — If you're not ready to review, Coach records a "review deferred" flag and reminds you on the next run. No pressure.

---

## Chat with Coach

Use **[CH]** to discuss review topics:

- "Should I remove capabilities that my project doesn't need yet?"
- "How do amendments affect future Gyre runs?"
- "What happens to my feedback when Atlas regenerates the model?"
- "Can my team members see and build on my amendments?"

---

## Troubleshooting

**"GC2 not found" or "GC3 not found" error**

Coach needs the capabilities manifest for model review and the findings report for findings review. Run Atlas and/or Lens first, then return to Coach.

**I accidentally removed a capability I need**

Amendments are flags, not deletions. The original capability is still in capabilities.yaml with `removed: true`. Edit the YAML directly to remove the flag, or ask Coach to re-add it.

**Feedback not showing on next run**

Coach displays existing feedback at the start of each review. Check that `.gyre/feedback.yaml` exists and was committed to your repo if working across branches.

**Review feels overwhelming**

You don't have to review everything in one session. Coach supports deferral — stop when you need to and resume later. Blockers-first ordering means you always see the most important items first.

---

## Tips

- **Review findings before the model.** Findings give you context about which capabilities matter for your project. Reviewing the model cold is harder.
- **Commit `.gyre/feedback.yaml` to your repo.** This is how your team shares Gyre improvements. Feedback from one person's review benefits everyone.
- **Use "missed-gap" feedback liberally.** If you know about a gap Gyre didn't catch, tell Coach. This is the primary mechanism for model improvement.
- **Amendments persist through regeneration.** When Atlas rebuilds the model, your removals and edits are preserved. Don't worry about losing your customizations.

---

## Credits

- **Agent:** Coach (Review Coach)
- **Module:** Gyre Pattern v1.0.0
- **Pattern:** Convoke Agent Architecture

---

*Scout finds the facts. Atlas builds the model. Lens finds the gaps. Coach helps you act on them.*
