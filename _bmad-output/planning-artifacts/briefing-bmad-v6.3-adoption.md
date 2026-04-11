# Briefing Note: BMAD v6.3.0 Adoption Initiative

**Prepared by:** Winston (Architect)
**Date:** 2026-04-11
**Audience:** John (PM) — for RICE scoring and backlog entry
**Status:** Pre-backlog briefing, post-spike

---

## One-line summary

Adopt BMAD METHOD v6.3.0 upstream by migrating Convoke off `bmad-init`, publishing Convoke as a community module on the BMAD marketplace, tracking upstream BMM agent consolidation, and establishing governance over Convoke's BMM-dependent extensions.

## Why now

BMAD v6.3.0 (released upstream) introduces four structural changes that affect Convoke:

1. **`bmad-init` skill eliminated** — upstream now loads config directly from `_bmad/{module}/config.yaml`. Every Convoke agent currently calls `bmad-init` on activation (~25 agent SKILL.md files).
2. **Custom content installation removed** → **marketplace-only distribution**. Upstream now pulls community modules from a central registry at `bmad-code-org/bmad-plugins-marketplace`. Convoke must publish there to remain installable via BMAD's community module browser.
3. **BMM agent consolidation** — upstream merged Barry (quick-flow-solo-dev), Quinn (QA), and Bob (SM) into Amelia (dev). Convoke tracks BMM agents, so this flows through.
4. **New upstream capabilities** — `bmad-prfaq`, `bmad-checkpoint-preview`, new platform adapters (Junie, KiloCoder), and a redesigned installer with manifest-based cleanup. Net-positive additions available once we upgrade.

Staying on pre-v6.3 conventions creates compounding drift cost. This is a now-or-never alignment window before upstream diverges further.

## Scope — four workstreams

### WS1. Direct-load migration
Retire the `bmad-init` skill. Replace with a lightweight direct-YAML loader utility. Sweep all agent SKILL.md activation steps (~25 files across core/bmm/cis/tea/wds/bme modules). Ship a one-shot migration script in `convoke-update` that converts existing user installs. Maintain a one-minor-version backwards-compat window.

**Effort:** 14 stories, ~2–3 focused weeks.

### WS2. Marketplace publication
Publish Convoke as a community module in `bmad-code-org/bmad-plugins-marketplace`.
- Add `.claude-plugin/marketplace.json` at Convoke repo root
- Add/confirm `_bmad/bme/_vortex/module.yaml` as the `module_definition` entry point
- Audit skill directory conformance (BMAD v6.3 expects `<skill-dir>/SKILL.md` — most Convoke skills already comply, canonical sources in `_bmad/bme/_vortex/agents/` need verification)
- Choose a non-colliding module `code` (candidate: `bme` or `vtx`)
- Choose a category slug from BMAD's `categories.yaml`; file upstream issue if "product discovery" category missing
- Tag a release, capture full commit SHA, open PR to marketplace repo with registry entry
- Add a runtime compatibility preflight check (BMAD's schema has **no** `bmad_version` / `engines` field — we must protect ourselves)

**Effort:** ~1–2 weeks, sequenced *after* WS1 so the marketplace version ships on the new config model.

### WS3. Adopt upstream Amelia consolidation
Remove `bmad-agent-qa`, `bmad-agent-sm`, `bmad-agent-quick-flow-solo-dev` from Convoke's bmm module. Pull upstream's updated Amelia. Update Convoke-owned references in `skill-manifest.csv`, `files-manifest.csv`, sprint planning docs, user guides. User-facing migration note points to upstream release notes.

**Effort:** 3–5 days, can run parallel to WS1.

### WS4. Convoke extensions compatibility governance
Convoke ships skills that layer on top of BMM agents (e.g., `bmad-enhance-initiatives-backlog` extends John, and others). These can break silently on BMM upgrades when capabilities tables, workflows, or artifact paths shift.

Deliverables:
- Inventory of Convoke-owned skills and their BMM dependencies → `_bmad/_config/bmm-dependencies.csv`
- Validation pass against v6.3 upstream, fix any breaks
- Post-upgrade regression gate wired into `convoke-update`
- Governance rule: new Convoke skills extending BMM must register in the dependency CSV (mirrors the artifact governance pattern already in flight)

**Effort:** 3–5 days.

## Sequencing

```
WS1 (direct-load migration)  ─┐
                              ├─→ WS2 (marketplace publish)
WS3 (Amelia adoption)  ───────┘
                              │
WS4 (extensions audit)  ──────┘  (runs continuously, finalizes before WS2)
```

WS2 must ship after WS1 — we don't want to onboard marketplace users on a config model we're about to break. WS3 and WS4 can run parallel to WS1. WS4 must finalize before WS2 because the marketplace version must pass extensions validation.

## RICE inputs (Winston's view — John to finalize)

- **Reach:** High. Every Convoke user is affected — pre-v6.3 users via migration, new users via marketplace distribution. Essentially 100% of install base.
- **Impact:** High. Keeps Convoke installable under BMAD v6.3+. Without this, Convoke drifts into an unmaintained fork. Marketplace listing opens a new user acquisition channel.
- **Confidence:** Medium-High. The marketplace spike (completed 2026-04-11) verified the contract against live upstream source. Two unknowns remain: (a) exact skill-dir porting effort, (b) marketplace PR approval timeline on BMAD's side.
- **Effort:** Medium. ~4–5 weeks total, one focused engineer-equivalent. Primarily sweep work (WS1) + packaging work (WS2), with small tracking tasks (WS3, WS4).

## Risks

1. **No BMAD version compatibility field.** BMAD's registry schema has no `bmad_version`/`engines`/`compatible_with`. A pre-v6.3 user installing Convoke v4.0 will fail at runtime with a confusing error. **Mitigation:** runtime preflight check in Convoke + file upstream issue proposing the field.
2. **Skill directory porting gap.** BMAD v6.3 expects `<skill-dir>/SKILL.md` convention. Canonical Convoke agents in `_bmad/bme/_vortex/agents/` need audit — if they're flat `.md` files, they need folder wrapping.
3. **Marketplace PR approval timeline.** Convoke's marketplace listing requires upstream review. Unknown lead time. Community tier starts at `trust_tier: unverified`.
4. **User migration script idempotency.** The `convoke-update` migration runs on user machines — must be bulletproof, idempotent, with path safety analysis (per Convoke's existing feedback rule).
5. **Recursive validation dependency.** WS4 validates `bmad-enhance-initiatives-backlog` — the very skill John is about to use to enter this initiative. Ensure John's skill is on the first-pass audit list.

## Dependencies and conflicts with existing backlog

- **In-flight work that could interact:**
  - Artifact Governance Epic 2 (4/18 stories done) — WS4 follows the same governance pattern, should align artifact-wise
  - Team Factory awaiting Forge Gate 1 — unrelated, shouldn't conflict
  - Phase 3 (product rename) — already shipped 3.1.0 → 3.2.0, this initiative likely ships as 4.0.0
- **Top backlog items from memory** (D7 ASCII banner, D5 problem-framing, D1 workflow list) — these are smaller and can interleave

## Suggested initiative metadata

- **Title:** BMAD v6.3.0 Adoption
- **Type:** Platform / Release
- **Target version:** Convoke 4.0.0 (breaking change)
- **Owner:** Winston (architecture) + Bob (story execution)
- **References:**
  - Upstream release notes: https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.3.0
  - Marketplace repo: https://github.com/bmad-code-org/bmad-plugins-marketplace
  - Example community module (WDS): https://github.com/bmad-code-org/bmad-method-wds-expansion
  - Spike source artifacts: see conversation with Winston, 2026-04-11

## State-of-the-art release quality commitments

Per user directive, this release must raise the consistency bar vs. recent releases. Architecture doc (forthcoming from Winston via `bmad-create-architecture`) will include:

- Decision records per workstream with alternatives considered
- Risk register with per-risk mitigation
- Versioned interface contracts (new config schema, `marketplace.json` shape, `bmm-dependencies.csv` schema)
- NFRs: idempotency, backwards-compat window, rollback plan, path safety analysis
- Traceability: epic→workstream, story→epic, test→story
- IR gate run *before* dev starts, not after
- Retrospective at release end to close the feedback loop

## Handoff

Once John finalizes RICE score and backlog entry, return to Winston for architecture design (CA) on the approved scope.
