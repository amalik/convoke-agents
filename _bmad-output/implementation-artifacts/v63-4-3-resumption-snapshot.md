---
initiative: convoke
artifact_type: state-snapshot
qualifier: v63-4-3-resumption-snapshot
created: '2026-05-26'
schema_version: 1
parent_story: v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate
backlog_row: D14
purpose: reduce-context-rebuild-cost-on-stalled-story-pickup
---

# v63-4-3 PF1 Validation Cycle — Resumption Snapshot

> ## 🛑 SUPERSEDED 2026-08-13 — DO NOT RESUME FROM THIS DOCUMENT
>
> This snapshot says Tasks 3-5 shipped and Task 6 is next with valid inputs on disk. **Both
> claims are wrong**, and acting on them produces a fabricated PASS on the M9 release gate:
>
> - Tasks 3/5 captured **Prompt 1 only** — Prompts 2-4 in all 8 files are 87-byte placeholders.
> - The corpus is **not valid**: each prompt is captured **once per phase**, so agent variance is
>   uncontrolled and no difference is interpretable. *(Corrected 2026-08-14 — this bullet
>   previously cited `stack-detective`'s byte-identical source against differing recordings as the
>   evidence. That control was contaminated: the recorder loads the generated, gitignored wrapper,
>   whose generator changed between the two commits. Backlog **I131**'s quantification is
>   retracted; the once-per-phase design fact above stands on its own.)*
> - Running the battery on it yields **PASS regardless of the real scores** (backlog **I130**).
>
> This document twice asserted completeness inferred from file existence. Read the story file
> and `v63-4-3-release-record-4.0.md` instead.

**Status as of 2026-05-26:** Story `v63-4-3` was picked up 2026-04-28. Tasks 1 + 2 shipped artifacts. Tasks 3-8 pending. Story has been on long-pause for ~4 weeks; this doc captures the state-of-play so resumption costs minutes, not hours.

**Backlog row:** [D14 (Fast Lane, RICE 2.1)](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md#23-fast-lane-quick-wins--spikes)
**Parent story spec:** [v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md](v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md)
**D2 path decision:** **D2-A (scripted via `claude -p`)** — locked via spike 2026-04-28; do NOT re-litigate

---

## Task progress table

| Task | Description | Status | Artifact (if shipped) |
|------|-------------|--------|-----------------------|
| 0 | Pre-flight gates + execution-precondition check | ✅ passed 2026-04-28 | (no artifact — gate-only) |
| 1 | DEF-SPIKE FM4-2 — CLI scriptability | ✅ **PASS → D2-A** | [v63-4-3-fm4-2-spike-result.md](v63-4-3-fm4-2-spike-result.md) |
| 2 | Author recording protocol | ✅ shipped 2026-04-28 | [v63-4-3-recording-protocol.md](v63-4-3-recording-protocol.md) |
| 3 | Capture baseline recordings (3.x state) | ✅ **shipped 2026-05-31** | `_bmad-output/pf1-baselines/` — **4** `*-baseline.md` (Emma, Wade, Liam, Stack Detective) |
| 4 | Trigger v4.0 migration on sandbox worktree | ✅ **done** (implied by Task 5 artifacts) | git worktree at v3.3.0 → `convoke-update` to 4.0 |
| 5 | Capture post-migration recordings (4.0 state) | ✅ **shipped 2026-05-31** | `_bmad-output/pf1-post-migration/` — **4** `*-post.md` |
| **6** | **Run battery harness (Story 4.2's `pf1-validation-battery.js`)** | ⏳ **NEXT** | requires `ANTHROPIC_API_KEY` — **verify it is exported before starting; it was NOT set in the 2026-08-10 pre-flight shell** |
| 7 | Author release record `v63-4-3-release-record-4.0.md` | ⏳ pending | Target file: `v63-4-3-release-record-4.0.md` (confirmed absent 2026-08-10) |
| 8 | Validation gates (lint + tests + scope check) | ⏳ pending | — |

> **Snapshot refreshed 2026-08-10 after a staleness pre-flight (verdict YELLOW).** Tasks 3–5 shipped on 2026-05-31 — *after* this snapshot was written on 2026-05-26 — but the table still marked them pending, which is the exact failure this document exists to prevent. **Remaining work is Tasks 6–8, not 3–8.** The recorded inputs Task 6 consumes are already on disk.
>
> **Counts corrected 5 → 4.** The recording protocol re-scoped the roster to **4 PF1 agents (3 Vortex + 1 Gyre) + 1 mechanical `install-scope-check.js`**, striking John / Winston / Carson as BMAD-upstream-owned. This snapshot's original "5 recordings" wording predated that re-scope.
>
> **Why the re-scope now matters more than it did:** BMAD Update `a16fa340` (2026-06-27) deleted 78 upstream `SKILL.md` files from the repo. Had the roster still included Carson and Winston, their baselines would be unreproducible today. It doesn't — and none of the 4 Convoke agents actually recorded has changed since 2026-05-31 (latest source edit 2026-05-03), so **the existing baselines remain valid**.

**Tasks 1 + 2 artifacts committed. `scripts/audit/pf1-record-agent.js` now EXISTS (was listed as missing here); `v63-4-3-release-record-4.0.md` remains the one missing-but-required artifact.**

## The gap: `scripts/audit/pf1-record-agent.js` (Task 1.5 D2-A deliverable)

**Not yet created.** Per spike result (`v63-4-3-fm4-2-spike-result.md:128-141`), the D2-A path requires authoring a helper script that wraps the verified-working CLI invocation:

```bash
claude -p --max-turns 5 "/<skill-name>"
```

**Spike-confirmed invariants (per Test 1-3, page 32-90 of spike result):**
- Slash-command-as-prompt-arg form works (NOT stdin pipe)
- `--max-turns 5` empirically sufficient for activation greeting (Prompt 1)
- May need adjustment (`--max-turns 10+`?) for deeper prompts (Prompt 2-4 capture)
- Wall-clock per invocation: ~5-15s (Carson + Winston both <60s including activation overhead)
- 20 invocations total (5 agents × 4 prompts × 1 phase) → ~5 min raw + protocol overhead → **~30 min target per phase**

**Sketch of `scripts/audit/pf1-record-agent.js`** (per spike Task 1.5 outline):

```js
#!/usr/bin/env node
// Wraps `claude -p --max-turns N "/<skill>"` for each agent×prompt combo
// Writes output to _bmad-output/pf1-baselines/ or _bmad-output/pf1-post-migration/
// Per recording protocol: digit-only headers `## Prompt 1` (NOT `## Prompt 1: ...`)
// Parser contract: Story 4.2's regex `/^## Prompt (\d+)\s*$/gm` rejects trailers
```

Estimated authoring cost: **~30 min** (small focused script + tests).

## The 5 PF1 agents (canonical skill IDs)

Per recording protocol §1:

| # | Agent | Skill ID |
|---|-------|----------|
| 1 | Emma (Contextualization Expert) | `bmad-agent-bme-contextualization-expert` |
| 2 | John (Product Manager) | `bmad-agent-pm` |
| 3 | Winston (Architect) | `bmad-agent-architect` |
| 4 | Carson (Brainstorming Coach) | `bmad-cis-agent-brainstorming-coach` |
| 5 | (5th agent — verify in protocol doc) | (skill ID — verify) |

## The 4 prompts (per phase)

(Verify exact prompts in recording protocol §2. They map to PF1 cells per Architecture FM4-2 spec.)

## Pre-flight at resumption (per protocol §0)

- [ ] `git status --porcelain` clean (or known-state)
- [ ] `package.json` version is `4.0.0-rc.1` (✅ verified 2026-05-25 — current `4.0.0-rc.1`)
- [ ] `git rev-parse v3.3.0` returns sha — needed for Decision 3 sandbox setup
- [ ] `ANTHROPIC_API_KEY` set (✅ verified 2026-05-26 by operator)
- [ ] Decide Decision 3 sandbox approach: **`git worktree`** (preferred per OS-1) or `git stash`+checkout (fallback)
- [ ] `mkdir -p _bmad-output/pf1-baselines _bmad-output/pf1-post-migration`

## Realistic resumption window estimate

| Phase | Work | Time |
|-------|------|------|
| Context re-load | Read this doc + spike result + protocol doc | ~10 min |
| Author `pf1-record-agent.js` | Per spike Task 1.5 outline | ~30 min |
| Task 3 (5 baseline recordings) | Run script in 3.x state via worktree | ~30 min |
| Task 4 (trigger migration) | `convoke-update` on sandbox worktree to 4.0 | ~15 min |
| Task 5 (5 post-migration recordings) | Run script again in 4.0 state | ~30 min |
| Task 6 (battery harness) | `node scripts/audit/pf1-validation-battery.js` | ~10-30 min |
| Task 7 (release record) | Author `v63-4-3-release-record-4.0.md` | ~15 min |
| Task 8 (validation gates) | `npm test`, `npm run lint`, `git diff --stat` | ~10 min |
| **Total** | | **~2.5-3 hours focused session** |

Could be split across 2 sessions if needed — natural break point after Task 3 (baseline recordings captured + committed).

## Recording format contract (LOAD-BEARING — do not violate)

Per recording protocol: every recording file MUST use **digit-only headers**:

```markdown
## Prompt 1

(response text)

## Prompt 2

(response text)
```

NOT `## Prompt 1: Activation greeting` (trailer breaks Story 4.2's parser regex `/^## Prompt (\d+)\s*$/gm`).

## Open gates at resumption

| Gate | Resolution at resumption time |
|------|------------------------------|
| Task 6 exit-code routing | Per Story 4.2 exit-code reference table (see protocol §4 + battery script header). Plan for: exit 0 = PASS, exit 1 = INVESTIGATE, exit 2 = FAIL, exit 3-5 = errors |
| FM4-2 wall-clock budget | Decision 5 hard cap = **3 hours** for D2-A path. If exceeded → HALT + surface (D2-A failure handler) |
| `--max-turns 5` deeper-prompt sufficiency | Per spike: `--max-turns 5` sufficient for activation. **Empirically verify on Prompt 2-4** at first recording attempt. Adjust to `--max-turns 10` if Prompt 2-4 truncates |

## Decision paths still open

None — all major decisions resolved at 2026-04-28:
- D2 = D2-A (scripted) ✓ locked
- D3 sandbox = git worktree (preferred) ✓ pre-decided
- Per-Right Covenant policy = D6 per-Right (from I97 ADR-005) ✓ inherited

## References

- Parent spec: [v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md](v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md)
- Spike result: [v63-4-3-fm4-2-spike-result.md](v63-4-3-fm4-2-spike-result.md)
- Recording protocol: [v63-4-3-recording-protocol.md](v63-4-3-recording-protocol.md)
- Battery harness (Story 4.2's deliverable): [scripts/audit/pf1-validation-battery.js](../../scripts/audit/pf1-validation-battery.js)
- Architecture FM4-2 spec: `convoke-arch-bmad-v6.3-adoption.md:489-498`
- Backlog row: D14 (Fast Lane, RICE 2.1) — provenance: Release-readiness probe 2026-05-25 + Option F decision (D16)

## Change Log

- **2026-05-26 (D14 authoring)** — Snapshot captured by Winston (Architect) per D14 Fast Lane row. Probes confirmed: Tasks 1+2 shipped 2026-04-28 (spike result + recording protocol), Tasks 3-8 pending (no recordings, no release record, no `pf1-record-agent.js` automation script). D2-A path locked via spike PASS. Realistic resumption window: ~2.5-3 hours focused session. ANTHROPIC_API_KEY verified set 2026-05-26 by operator. Story `v63-4-3` status remains `in-progress` (accurate — Tasks 1+2 done is genuine partial execution, not status drift). Resumption gated only on operator session-time allocation.
