---
initiative: convoke
artifact_type: note
qualifier: announcement-4.0-draft
created: '2026-04-11'
schema_version: 1
source: >-
  Extracted from convoke-prd-bmad-v6.3-adoption.md frontmatter
  (partyFindingsRound2.PR2-5.draftAnnouncement — Sophia's ship-ready draft
  refined via Shark Tank Pitch + Feynman Technique + Party Round 2).
status: draft
---

# Convoke 4.0 — Release Announcement (Draft)

**Status:** Draft, pending release ship date. Written in Sophia's voice (Master Storyteller). Tone validated against PRD `framingAnnotations.userFacing` vocabulary.

---

## The announcement

The Convoke 4.0 release is live. We've spent the last few weeks making Convoke healthy enough to last — not adding new features, but making sure the agents you rely on keep working as BMAD evolves underneath them. You can now install Convoke through the BMAD plugin system, as a standalone Claude Code skill pack, or via adapters for Copilot and Cursor. For existing users, upgrading is a single command and auto-migration handles the rest. If this release does its job, you'll barely notice it — which is the point.

---

## Narrow-framing fallback

If Bolder Move 3 (platform-agnostic publishing) is NOT absorbed into 4.0 (decision contingent on Sprint 1 Experiment EXP3), replace the install-method sentence with:

> For the first time, you can install Convoke through the BMAD plugin system alongside the framework itself.

---

## Cliché list avoided (per PR2-5 shark tank findings)

These phrases were explicitly struck from the announcement and must NOT reappear in any user-facing release communication for 4.0:

- "Convoke 4.0 is here" (generic product-launch opening)
- "first-class community module" (unearned status inflation per Shark 1)
- "For the curious" (lazy segue)
- "Convoke is a bit like a well-maintained tool: nothing flashy, just reliable" (mixed metaphor + brand-safety platitude)
- "opinionated downstream" (internal jargon, not user vocabulary)
- "host_framework_sync" (internal release class label, not user vocabulary)
- "content, not software" (internal insight, not user-facing framing)
- "strategic bet on BMAD coupling" (internal planning vocabulary)

## Vocabulary rules enforced

Per PRD `framingAnnotations.internalOnly`, the following internal phrases must NOT appear in this announcement:

- `host_framework_sync`
- "content, not software"
- "strategic bet"
- "first-class community module"
- "first formal recognition of Convoke-as-downstream"
- "named reusable release class"

Grep-testable before publication:

```bash
grep -E '(host_framework_sync|content, not software|strategic bet|first-class|opinionated downstream|first formal recognition|named reusable release class)' convoke-announcement-4.0.md
# Must return zero results before publishing
```

## Publication checklist

Before this announcement ships:

- [ ] Replace "live" with the actual release date
- [ ] Decide Bolder Move 3 outcome (from EXP3) and select narrow or broad install-method sentence accordingly
- [ ] Run the cliché-list grep check
- [ ] Run the `internalOnly` vocabulary grep check
- [ ] Maintainer sign-off recorded in the release commit message (per FR44)
- [ ] Publish to: npm CHANGELOG, GitHub release notes, Convoke README section

---

## Traceability

- Source PRD: [`convoke-prd-bmad-v6.3-adoption.md`](convoke-prd-bmad-v6.3-adoption.md)
- Validation report: [`convoke-report-prd-validation-bmad-v6.3-adoption.md`](convoke-report-prd-validation-bmad-v6.3-adoption.md)
- PRD frontmatter source: `partyFindingsRound2.PR2-5`
- Related FRs: FR41 (mostHonestOneLineSummary verbatim), FR42 (cliché grep test), FR43 (dual-framing vocabulary), FR44 (maintainer sign-off)

---

> **Claim guard (2026-08-13, code review).** An earlier draft of this announcement claimed
> Convoke 4.0 "actually tests whether your agents behave the same way after the upgrade."
> **Do not reinstate that line.** The PF1 behavioural-equivalence gate was **waived** for 4.0:
> only activation greetings were captured, and a control agent whose source did not change
> between the compared commits still produced differing recordings — so the corpus measures
> agent run-to-run variance as much as any upgrade effect. This file is the canonical voice
> source the CHANGELOG derives from, which is why the correction is pinned here and not only
> downstream. See `_bmad-output/implementation-artifacts/v63-4-3-release-record-4.0.md`.

