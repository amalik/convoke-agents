---
initiative: convoke
artifact_type: story
qualifier: v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate
created: '2026-04-26'
schema_version: 1
epic: v63-epic-4
---

# Story 4.3: Execute PF1 validation cycle (record + compare + gate)

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 4 — Validated Behavioral Equivalence](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-4-validated-behavioral-equivalence)
**Sprint:** 4-5 (PF1 stream — third + most operationally complex story; **release-time activity** per CM-7 finding — see §"Execution Precondition" below).
**FR coverage:** FR36 (PF1 judge prompt versioned), FR38 (battery orchestrates), FR39 (PF1 PASS/FAIL gate is M9 release-blocking), FR45 (per-input PASS/FAIL record), FR46 (release record M6).
**NFR coverage:** NFR3 (PF1 ≤15 min per cycle — wall-clock measured here for first time), NFR21, NFR30.
**Failure modes addressed:** FM4-1 (judge variance — battery's median-of-3 mitigates), FM4-2 (CLI scriptability — DS1 spike + Decision 2), FM4-3 (4 prompts include deep workflow per arch:351), FM4-4 (baselines-go-stale — record IMMEDIATELY before migration), FM7-2 mitigation INHERITED from Story 4.1 calibration evidence.

**🚨 EXECUTION PRECONDITION (CM-7 finding):** Story 4.3 is a **release-time activity** that requires a 4.0 candidate to validate against. **Currently `package.json` says 3.3.0; v6.3 work is in progress (18/29 stories shipped)**. Story 4.3's spec can be authored + V-pass'd now, but the **dev-story execution must wait until**: (a) v6.3 implementation work is complete (Epic 1A 6/6 ✓ + Epic 2 4/4 ✓ + Epic 3 5/5 ✓ + Epic 4 ≥3/5 + Epic 5A/5B = ~all 28 v6.3 stories shipped), AND (b) `package.json` version bumped to `4.0.0-rc.X` or similar 4.0 candidate marker, AND (c) the `scripts/update/migrations/3.x-to-4.0.js` migration is implemented + tested per Story 1A.4. Sprint-status keeps `ready-for-dev` per operator decision (Q1=A); Task 0.5 precondition check HALTs dev-story if conditions not met.

**Why FM4-2 IS a blocker for Story 4.3 (in contrast to 4.1/4.2):** FM4-2 = "Claude Code CLI scriptability for non-interactive prompt input". Stories 4.1 + 4.2 only needed the **judge** (Anthropic SDK direct calls, FM4-2-independent). Story 4.3 needs **agent recording** — invoking Carson/Winston/etc. and capturing their outputs. **V-pass empirical preview (CM-1):** `claude -p` IS the non-interactive flag (NOT `--no-interactive`); `echo 'hi' | claude -p "say hello"` returned "Hello!" successfully → FM4-2 likely PASSES → D2-A scripted path viable (~30min total recording vs 4-8hr manual).

**Upstream dependencies:**
- **Story 4.1 (DONE)** — judge prompt + calibration evidence (median 5/2 zero-variance baseline).
- **Story 4.2 (DONE; R1+R2-converged)** — battery harness at `scripts/audit/pf1-validation-battery.js` (13/13 unit tests pass; H1 story-killer caught + fixed). **Known surface bug (CM-4):** `--dry-run` exits 0 silently on missing recordings instead of exit 5 (Story 4.2 Completion Notes claim was wrong); routed to deferred-work as `D-V42-R3-1` for Story 4.2 follow-up amendment. Story 4.3 Task 6.2 works around by checking stdout for `Error:` lines, NOT just exit code.
- **Migration tooling**: `scripts/update/migrations/3.x-to-4.0.js` per arch (delivered by Story 1A.4). NOT `scripts/update/convoke-update.js --apply` (CM-2 finding: `--apply` flag doesn't exist; convoke-update.js runs unconditionally + reports current version).
- **5 PF1 agents** all installed via `.claude/skills/<skill>/SKILL.md` (V-pass probe 5 confirmed all present).

**Downstream consumers:**
- **Convoke 4.0 publication gate (M9)** — PF1 PASS verdict from this story IS the release-blocking gate.
- **Story 5B.1** (CHANGELOG authoring) — release record from this story informs CHANGELOG honesty.
- **Epic 4 retrospective** — PF1 cycle outcomes feed retro lessons.

**Namespace decision:** all artifacts under `_bmad-output/pf1-baselines/` + `_bmad-output/pf1-post-migration/` + `_bmad-output/implementation-artifacts/v63-4-3-*` + (conditional) `scripts/audit/pf1-record-agent.js` (D2-A automation helper). NOT a `_bmad/bme/` skill — covenant-compliance-checklist N/A.

## Story

As Convoke maintainer (Amalik) executing the v4.0 release validation gate at release time,
I want **a documented, time-boxed protocol to capture 5 baseline + 5 post-migration agent recordings, run Story 4.2's battery harness, and log the M9 PF1 gate verdict in the release record**,
so that the M9 release-blocking gate has empirical PASS/INVESTIGATE/FAIL evidence + the FM4-4 "baselines-go-stale" failure mode is mitigated by recording IMMEDIATELY before migration + the operator has unambiguous guidance to ship-or-not.

**Story shape:** **operator-execution-heavy / procedural / release-time-deferred** (matches Story 3.3 PR-submission shape; Story 3.4 + 3.5 procedural-evidence shapes). Most dev-story execution = HALT-for-operator. Time-box: ~3hr scripted (D2-A FM4-2 PASS) / 1 day manual (D2-B FM4-2 FAIL) per epic AC.

**Empirical baseline (probed 2026-04-26 + V-pass-confirmed 2026-04-26):**

| Probe | Result | Spec impact |
|-------|--------|-------------|
| Stories 4.1 + 4.2 done + gates green | ✓ — `tests 1468 / pass 1467 / skip 1 / fail 0` | None |
| Story 4.2 battery script importable | ✓ — 14 exports | None |
| **`claude -p` IS the non-interactive flag** | ✓ — `echo 'hi' \| claude -p "say hello"` returned "Hello!" | **CM-1 fix:** Decision 1 + Task 1.1 use `claude -p`, not `--skill` / `--no-interactive` |
| `scripts/update/convoke-update.js` actually-runnable | ⚠️ — runs unconditionally; says "Already up to date! (v3.3.0)"; **no `--apply` flag** | **CM-2 fix:** Task 4 references `scripts/update/migrations/3.x-to-4.0.js` per arch, not `convoke-update.js --apply` |
| 5 PF1 agents installed via `.claude/skills/` | ✓ — all 5 SKILL.md files present | None |
| **`v3.3.0` git tag exists** | ✓ — also `v3.0.0`, `v3.1.0`, `v3.2.0` | DS3 baseline tag confirmed |
| Battery `--dry-run` exit code on missing recordings | ⚠️ — **exits 0 silently** (Story 4.2 surface bug — Completion Notes claim was wrong) | **CM-4 fix:** Task 6.2 checks stdout for `Error:` lines; bug routed to D-V42-R3-1 |
| Battery `parseRecording` rejects descriptive headers | ⚠️ — `## Prompt 1: Activation greeting + menu` REJECTED by `/^## Prompt (\d+)\s*$/gm` | **CM-6 fix:** Decision 2 + Task 2.1 mandate digit-only `## Prompt N` headers |
| `package.json` current version | ⚠️ — **3.3.0** (no 4.0 WIP exists yet) | **CM-7 fix:** Story 4.3 is release-time activity; Task 0.5 precondition HALTs dev-story until 4.0 candidate exists |
| `ANTHROPIC_API_KEY` env (operator-side) | ⚠️ — UNSET | Task 6.1 HALT covers it |

## Acceptance Criteria

### Decisions (pinned at spec-author time; defensible at dev-time per FM4-2 outcome)

**Decision 1 — FM4-2 CLI scriptability spike runs FIRST as DS1 (Task 1; 30-min time-box).** **PASS criterion:** `claude -p "<prompt>"` (the actual flag per V-pass CM-1) accepts non-interactive input + captures agent's first persona-authored response to stdout. Specifically test: `echo "/<skill>" | claude -p "Activate the skill and respond with your activation greeting"` (or equivalent); verify output contains agent's persona text (e.g., Carson's "Hey Amalik! 🧠 Carson here..." pattern). **FAIL criteria:** any of (a) `-p` flag rejects slash-command dispatch from prompt body, (b) output mixes tool-trace with persona response unparseably, (c) capture isn't deterministic across runs. **Inversion handler:** spike outcome shapes Decision 2 path + total Story 4.3 time budget.

**Decision 2 — Recording mechanism per FM4-2 outcome:**
- **D2-A (FM4-2 PASS):** scripted via NEW `scripts/audit/pf1-record-agent.js` helper. CLI: `node scripts/audit/pf1-record-agent.js --phase baseline` OR `--phase post-migration`. Loops 5 agents × 4 prompts; invokes each via `claude -p`; captures stdout; writes to per-agent files. ~30 min wall-clock total.
- **D2-B (FM4-2 FAIL):** manual capture. Operator opens 5 Claude Code sessions, invokes each prompt-sequence (4 per agent), copy-pastes responses into per-agent files. 4-8hr wall-clock realistic; multi-day if interruptions.
- **HEADER FORMAT CONTRACT (CM-6 — load-bearing):** ALL recording files MUST use **digit-only headers** `## Prompt 1`, `## Prompt 2`, `## Prompt 3`, `## Prompt 4` (no description trailers). Story 4.2 parser regex `/^## Prompt (\d+)\s*$/gm` REJECTS `## Prompt 1: Activation greeting + menu` (verified empirically); descriptions belong in body content or comments, NOT in headers. Operator pre-validates each file via Story 4.2's `parseRecording` before proceeding.

**Decision 3 — Migration sandbox approach: `git worktree` (preferred per OS-1) OR `git stash`+checkout (fallback).** **Preferred (worktree):**
- `git worktree add ../convoke-3x v3.3.0` — creates parallel checkout of 3.x state
- Record baselines from `../convoke-3x` (parallel directory; current 4.0-RC stays intact in main checkout)
- After recording: `git worktree remove ../convoke-3x`
- Cleaner: no stash/checkout dance; current branch undisturbed

**Fallback (stash+checkout):**
- `git stash` (any uncommitted 4.0 work) → `git checkout v3.3.0` → record baselines → `git checkout main && git stash pop` → record post-migration
- Same protocol as original Story 4.3 draft; preserved as fallback if worktree unavailable

**DS3 verifies:** `git tag -l 'v3*'` shows `v3.3.0` ✓ (V-pass confirmed); `git worktree --help` succeeds. **Inversion handler:** if both approaches fail (highly unlikely), fall back to two clean clones (manual sandbox setup beyond Story 4.3 scope; surface to operator).

**Decision 4 — Release record at `_bmad-output/implementation-artifacts/v63-4-3-release-record-4.0.md`.** **Frontmatter (9 keys per CM-5 fix):** `initiative: convoke`, `artifact_type: release-record`, `release_target: 4.0.0`, `m9_pf1_gate: PASS|INVESTIGATE|FAIL` (per battery verdict), `m6_threshold_T: 4.0`, `pf1_battery_results_path: <path>`, `recording_method: scripted|manual` (D2-A or D2-B), `created: <YYYY-MM-DD>`, `signoff_by: amalik` + `baseline_commit: <sha>` + `post_migration_commit: <sha>` (10 keys total — provenance per EO-10). **Body:** gate verdict block + per-agent + per-prompt summary table + recording-method narrative + ship/don't-ship recommendation + operator sign-off line. M9 + M6 satisfied by frontmatter keys + body content. **Cross-reference (EO-4):** release record is SEPARATE from `convoke-announcement-4.0-draft.md`; the announcement consumes release-record's `m9_pf1_gate` field; release-record is the canonical M9+M6 evidence artifact.

**Decision 5 — Time-box discipline + escape hatches.** Hard cap: **3hr if D2-A scripted; 1 day (8hr) if D2-B manual; multi-day acceptable for D2-B with interruptions**. Per task time-budgets:
- Task 1 DS1 spike: 30 min (per arch:372 + V-pass CM-1 advance probe).
- Task 2 protocol authoring: 30 min.
- Task 3 baseline recording: 30 min D2-A / 2-4hr D2-B.
- Task 4 migration trigger: 5 min (worktree swap OR stash-pop).
- Task 5 post-migration recording: same as Task 3.
- Task 6 battery run: 5-15 min (NFR3).
- Task 7 release record + sign-off: 15 min.
- Task 8 validation gates: 5 min.
- **If exceeded:** HALT + surface; D2 escape hatches per Decision 1 inversion handler.

---

**AC1 — FM4-2 spike (DS1) executes + outcome determines recording mechanism (CM-1 fix).**
**Given** Story 4.3 dev-story start + Task 0.5 precondition met
**When** Task 1 DS1 runs
**Then**:
- Spike artifact at `_bmad-output/implementation-artifacts/v63-4-3-fm4-2-spike-result.md` records: spike outcome (PASS/FAIL), specific `claude -p` invocation tested verbatim, observed behavior, time taken, recommendation (D2-A or D2-B), operator override notes if any.
- Decision 2 path resolved before Task 3 begins.
- Time-box: 30 min hard cap; declare FAIL if exceeded.

**AC2 — 5 baseline recordings captured from 3.x state, IMMEDIATELY before migration (FM4-4).**
**Given** Decision 2 path resolved + sandbox at 3.x state per Decision 3
**When** baseline recording phase runs (Task 3)
**Then**:
- 5 files at `_bmad-output/pf1-baselines/{skill}-baseline.md` for: `bmad-agent-bme-contextualization-expert` (Emma), `bmad-agent-pm` (John), `bmad-agent-architect` (Winston), `bmad-cis-agent-brainstorming-coach` (Carson — **CM-3 fix: NOT `bmad-brainstorming` which is the brainstorming-method skill**), `bmad-tea` (Murat).
- Each file has 4 sections delimited by **digit-only `## Prompt N` headers** per Decision 2 HEADER FORMAT CONTRACT (CM-6 fix).
- Each file's 1-line provenance comment: `<!-- Source: <skill> baseline captured <YYYY-MM-DD HH:MM> from convoke 3.x (commit <sha>) -->`.
- **Baseline-staleness bound (EO-5):** captured ≤7 days before migration trigger (FM4-4 mitigation; arch says "IMMEDIATELY" — operator interprets as same-day-of-release-cut, never >7 days stale).
- Files validate against Story 4.2's `parseRecording` (4 sections, exact `Prompt 1..Prompt 4` labels, no empty sections per R1 P5).

**AC3 — Migration triggered + 5 post-migration recordings captured from 4.0 state.**
**Given** AC2 baselines complete + sandbox transitions to 4.0 state per Decision 3
**When** migration trigger + post-migration recording phase runs (Tasks 4 + 5)
**Then**:
- Migration trigger documented: `git worktree remove ../convoke-3x` + use main checkout (worktree path) OR `git checkout main && git stash pop` (stash path); operator chooses per Decision 3.
- **CM-2 fix:** the actual migration tooling is `scripts/update/migrations/3.x-to-4.0.js` (per arch), delivered by Story 1A.4 of v6.3 epic; NOT `scripts/update/convoke-update.js --apply` (no such flag). Verifying migration applied: `node scripts/update/convoke-version.js` should print 4.0 candidate version.
- 5 files at `_bmad-output/pf1-post-migration/{skill}-post.md` for same 5 agents.
- Same recording contract as AC2 (4 digit-only sections, parseRecording-validatable).
- Provenance comment: `<!-- Source: <skill> post-migration captured <YYYY-MM-DD HH:MM> from convoke 4.0 (commit <sha>) -->`.
- Same prompts asked to each agent as AC2 (per Story 4.2 PF1_PROMPTS — identical 4-prompt sequence; CRITICAL for valid pre/post comparison per arch:355).

**AC4 — Battery harness runs + produces gate verdict per arch Decision 4.**
**Given** AC2 + AC3 recordings in place + `ANTHROPIC_API_KEY` env var set
**When** operator runs `node scripts/audit/pf1-validation-battery.js` (Task 6)
**Then**:
- Battery completes in ≤15 min (NFR3) — operator captures `wall_clock_seconds` from results frontmatter.
- Results at `_bmad-output/implementation-artifacts/v63-4-3-battery-results-{date}.md` via env override `PF1_BATTERY_RESULTS_PATH=...`.
- Results frontmatter has 11 keys including `gate_verdict: PASS|INVESTIGATE|FAIL`.
- Gate verdict is the load-bearing M9 release decision per arch:362-368.
- **EO-8 INVESTIGATE blocking semantics:** per arch:367, INVESTIGATE means "fix + retest" (NOT operator-discretionary "ship-with-caveats"). Both INVESTIGATE and FAIL block ship; only PASS unblocks. Spec aligns with arch (corrects Story 4.3 v1 spec which said operator-decides).
- Exit code: 0 (PASS only) ships; 1 (INVESTIGATE) and 2 (FAIL) both block.

**AC5 — Release record `v63-4-3-release-record-4.0.md` logs M9 + M6 entries with operator sign-off.**
**Given** AC4 battery verdict
**When** Task 7 runs
**Then**:
- File exists at `_bmad-output/implementation-artifacts/v63-4-3-release-record-4.0.md` per Decision 4.
- **All 9 frontmatter keys (CM-5 fix; was incorrectly stated as 8) present + non-empty:** `initiative`, `artifact_type`, `release_target`, `m9_pf1_gate`, `m6_threshold_T`, `pf1_battery_results_path`, `recording_method`, `created`, `signoff_by`. Plus optional `baseline_commit` + `post_migration_commit` (provenance per EO-10) = 11 keys total when fully populated.
- Body sections per Decision 4: M9 verdict, M6 T=4.0, per-agent summary, recording method, ship recommendation, operator sign-off.

**AC6 — Validation gates green + scope discipline.**
- [ ] 6.1 `npm test` baseline unchanged: `tests 1468 / pass 1467 / skip 1 / fail 0` (Story 4.3 adds 0 unit tests).
- [ ] 6.2 `npm run test:integration` baseline unchanged: `tests 93 / pass 93 / fail 0`.
- [ ] 6.3 `npm run lint` clean (only NEW JS file is conditional `pf1-record-agent.js` per D2-A; if D2-B no JS).
- [ ] 6.4 `git diff HEAD --stat` confirms scope = AC7 file set.

**AC7 — Scope discipline.**
- IN scope (NEW files):
  - This story file.
  - `_bmad-output/implementation-artifacts/v63-4-3-fm4-2-spike-result.md` (Task 1 DS1 outcome).
  - `_bmad-output/implementation-artifacts/v63-4-3-recording-protocol.md` (Task 2 — operator instructions for D2-A or D2-B).
  - `_bmad-output/pf1-baselines/{5 files}` (Task 3 — 5 baseline recordings).
  - `_bmad-output/pf1-post-migration/{5 files}` (Task 5 — 5 post-migration recordings).
  - `_bmad-output/implementation-artifacts/v63-4-3-battery-results-{date}.md` (Task 6 — battery output via env-overridden RESULTS_PATH).
  - `_bmad-output/implementation-artifacts/v63-4-3-release-record-4.0.md` (Task 7 — M9 + M6 release record).
  - **D2-A only:** `scripts/audit/pf1-record-agent.js` (FM4-2-conditional automation helper).
- IN scope (MODIFIED):
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions + `last_updated` narrative.
  - This story file (Tasks/Subtasks checkboxes + Dev Agent Record + File List + Change Log + Status).
- MUST NOT touch: `scripts/audit/pf1-judge-prompt.md`, `scripts/audit/pf1-judge-calibration.js`, `scripts/audit/pf1-validation-battery.js` (Stories 4.1 + 4.2 frozen surfaces); existing test files; existing fixture dirs; `package.json`/`package-lock.json`; any `_bmad/` files.
- **EO-6 escape hatch:** if Stories 4.1+4.2 reveal real defects during Story 4.3 execution (e.g., CM-4 dry-run-exit-0 was caught HERE), surface as separate Bug-Lane item; do NOT modify their surfaces from within Story 4.3. Pattern: operator-managed-side-commit per BUG-6 precedent.

**Path safety analysis (per `path-safety-for-destructive-ops` rule):** Decision 3's `git worktree add` + `git worktree remove` mutates filesystem. Operator MUST: (a) verify v3.3.0 tag exists pre-worktree-add (`git rev-parse v3.3.0`); (b) verify worktree path doesn't already exist; (c) verify current branch + working tree state pre-fallback-stash (`git status --porcelain`). Story 4.3 spec documents the protocol; operator executes with eyes open. Stash-pop conflicts (unlikely on clean stash) are operator-resolved.

## Tasks / Subtasks

- [ ] **Task 0: Pre-flight gates + execution-precondition check (CM-7).**
  - [ ] 0.1 Confirm Story 4.1 + 4.2 status `done` in sprint-status.yaml + their gates green (`npm test 2>&1 | tail -5` shows `tests 1468 / pass 1467 / skip 1 / fail 0`).
  - [ ] 0.2 Verify Story 4.2 battery script importable: 14 exports per Story 4.2 R1+R2 close.
  - [ ] 0.3 Verify clean slate: `ls _bmad-output/pf1-baselines/ _bmad-output/pf1-post-migration/ _bmad-output/implementation-artifacts/v63-4-3-* 2>/dev/null` — all absent except this story file.
  - [ ] 0.4 Verify v3.3.0 tag exists: `git rev-parse v3.3.0 2>&1` returns sha. If error, surface — DS3 inversion (use last 3.x commit).
  - [ ] 0.5 **EXECUTION PRECONDITION CHECK (CM-7):** verify all of:
    - (a) v6.3 implementation work complete: `grep "v63-epic-1a:\|v63-epic-2:\|v63-epic-3:" _bmad-output/implementation-artifacts/sprint-status.yaml` should show all `done`. Plus Epic 4 stories 4.1 + 4.2 done; 4.4 + 4.5 status checked.
    - (b) `package.json` version is 4.0 candidate: `grep '"version":' package.json` should show `4.0.0` or `4.0.0-rc.X`.
    - (c) `scripts/update/migrations/3.x-to-4.0.js` exists: `ls scripts/update/migrations/3.x-to-4.0.js` returns the path.
    - **If ANY (a)/(b)/(c) fail:** HALT dev-story with explicit operator message: "Story 4.3 is a release-time activity. Preconditions not met: <list>. Resume Story 4.3 dev-story when v6.3 implementation complete + 4.0 candidate exists. Spec stays ready-for-dev."
  - [ ] 0.6 Confirm `ANTHROPIC_API_KEY` env availability for Task 6 (battery run). NOT required for Tasks 1-5; only Task 6+. If unset at Task 6, HALT.

- [ ] **Task 1: DEF-SPIKE — FM4-2 CLI scriptability (DS1; PI-11 inversion handling; 30-min time-box).**
  - [ ] 1.1 **DS1: FM4-2 spike with corrected CLI flag (CM-1 fix).** Test sequence:
    1. `claude --help 2>&1 | grep -E '\-\-print|\-p'` — confirm `-p` / `--print` flag exists.
    2. Try non-interactive Carson invocation: `echo "/bmad-cis-agent-brainstorming-coach" | claude -p "Activate the skill and respond with your activation greeting" 2>&1 | head -100`. **PASS criterion:** output contains Carson's persona greeting (regex match for "Carson" + emoji 🧠 + "brainstorming"). If output is empty / mixed with tool traces / doesn't include persona text, declare FAIL.
    3. If step 2 PASSES: try Winston: `echo "/bmad-agent-architect" | claude -p "..." 2>&1 | head -100`. Repeat for 1 additional agent to verify reproducibility.
    4. Time-box: 30 min hard cap per arch:372. If exceeded with no clear PASS, declare FAIL → D2-B path.
  - [ ] 1.2 Author `_bmad-output/implementation-artifacts/v63-4-3-fm4-2-spike-result.md`: outcome (PASS/FAIL), CLI invocation verbatim, observed behavior (stdout/stderr samples truncated to first 500 chars), time taken, recommendation (D2-A or D2-B). **Inversion handler:** if FAIL but operator believes a different CLI invocation could PASS, document the alternative for future re-spike.
  - [ ] 1.3 Surface DS1 outcome to operator before proceeding to Task 2.

- [ ] **Task 2: Author recording protocol document (~30 min).**
  - [ ] 2.1 Create `_bmad-output/implementation-artifacts/v63-4-3-recording-protocol.md` based on DS1 outcome:
    - **HEADER FORMAT CONTRACT (load-bearing per Decision 2 + CM-6):** every recording file MUST use digit-only headers `## Prompt 1`, `## Prompt 2`, `## Prompt 3`, `## Prompt 4`. NO descriptions in headers (Story 4.2 parser regex `/^## Prompt (\d+)\s*$/gm` REJECTS `## Prompt 1: Activation greeting + menu`). Descriptions belong in Decision 4 spec body, NOT in recording headers.
    - **Per-prompt operator instructions** (D2-B manual; D2-A scripted automates these):
      - **Prompt 1 — Activation greeting + menu:** invoke `/<skill>` (e.g., `/bmad-cis-agent-brainstorming-coach` for Carson per CM-3 fix); capture the FIRST persona-authored natural-language turn (per Story 4.1 AC3 definition); STOP at next user-input boundary.
      - **Prompt 2 — First capability invocation:** type the FIRST numbered capability code from agent's menu (e.g., "BS" for Carson's brainstorming); capture agent's response.
      - **Prompt 3 — Follow-up question:** type an open-ended clarifying question on agent's first response; capture response.
      - **Prompt 4 — Multi-step workflow entry:** invoke agent's deepest workflow capability accessible without supplying real domain data (per arch:351); capture agent's first workflow-step response.
    - **Pre-validation command per file (load-bearing):**
      ```
      node -e "const b = require('./scripts/audit/pf1-validation-battery'); const fs = require('fs'); const text = fs.readFileSync('_bmad-output/pf1-baselines/<skill>-baseline.md', 'utf8'); console.log(b.parseRecording(text));"
      ```
      Must print `{ 'Prompt 1': '...', 'Prompt 2': '...', 'Prompt 3': '...', 'Prompt 4': '...' }`. If errors, fix headers/sections before proceeding.
  - [ ] 2.2 Per-protocol inclusion: provenance-comment template + section-header template + parser-validity check command + correct-vs-incorrect header examples.

- [ ] **Task 3: Capture 5 baseline recordings from 3.x state (HALT for operator action).**
  - [ ] 3.1 Operator runs Decision 3 sandbox setup. **Preferred (worktree per OS-1):** `git worktree add ../convoke-3x v3.3.0` → `cd ../convoke-3x` (separate dir; current 4.0 stays intact). **Fallback (stash):** `git stash` → `git checkout v3.3.0`.
  - [ ] 3.2 Operator captures recordings per Task 2 protocol. Per agent (using **canonical skill names per CM-3 fix**):
    - Emma → `_bmad-output/pf1-baselines/bmad-agent-bme-contextualization-expert-baseline.md`
    - John → `_bmad-output/pf1-baselines/bmad-agent-pm-baseline.md`
    - Winston → `_bmad-output/pf1-baselines/bmad-agent-architect-baseline.md`
    - Carson → `_bmad-output/pf1-baselines/bmad-cis-agent-brainstorming-coach-baseline.md` (**not bmad-brainstorming**)
    - Murat → `_bmad-output/pf1-baselines/bmad-tea-baseline.md`
  - [ ] 3.3 Operator validates EACH file via parser pre-validation command (Task 2.1). All 5 must show 4-key parse output.
  - [ ] 3.4 Operator capture-time-stamps each file's provenance comment + records `baseline_commit: <sha>` for release record (EO-10).
  - [ ] 3.5 **HALT for operator** — dev-agent surfaces protocol + per-agent invocation list + STOPS until operator returns with completed + parser-validated recordings.

- [ ] **Task 4: Trigger v4.0 migration on sandbox (HALT for operator action).**
  - [ ] 4.1 Operator transitions sandbox to 4.0 state. **Worktree path:** `cd <main-checkout-path>` + `git worktree remove ../convoke-3x`. **Stash path:** `git checkout main && git stash pop` (resolve any conflicts manually).
  - [ ] 4.2 Operator verifies 4.0 install functional: `node scripts/update/convoke-version.js` should print `4.0.0` or `4.0.0-rc.X`. If broken, BLOCKING for Story 4.3 ship — surface to operator. **CM-2 fix:** the actual migration is delivered by `scripts/update/migrations/3.x-to-4.0.js` (per arch + Story 1A.4); `scripts/update/convoke-update.js` is the runner CLI but doesn't accept `--apply` flag (verified empirically: runs unconditionally + reports current version).
  - [ ] 4.3 Operator records `post_migration_commit: <sha>` for release record.

- [ ] **Task 5: Capture 5 post-migration recordings from 4.0 state (HALT for operator action).**
  - [ ] 5.1 Same protocol as Task 3 but writing to `_bmad-output/pf1-post-migration/{skill}-post.md` files.
  - [ ] 5.2 Provenance: `<!-- Source: <skill> post-migration captured <YYYY-MM-DD HH:MM> from convoke 4.0 (commit <sha>) -->`.
  - [ ] 5.3 **CRITICAL:** same 4-prompt sequence per agent (must match baseline prompts EXACTLY for valid pre/post comparison; per arch:355).
  - [ ] 5.4 Operator validates files via parser pre-validation command.
  - [ ] 5.5 **HALT for operator** — same as Task 3.

- [ ] **Task 6: Run battery harness (Story 4.2's script).**
  - [ ] 6.1 Operator confirms `ANTHROPIC_API_KEY` set: `[ -n "$ANTHROPIC_API_KEY" ]`. If not, HALT.
  - [ ] 6.2 Operator runs `--dry-run` for structural validation: `node scripts/audit/pf1-validation-battery.js --dry-run 2>&1 | tee /tmp/dry-run-out.log`. **CM-4 fix (Story 4.2 surface bug workaround):** dry-run currently exits 0 silently on missing recordings. Operator MUST grep for error: `grep -E "^Error:" /tmp/dry-run-out.log` — if matches found, recordings malformed; fix Tasks 3 or 5 before proceeding. If no `Error:` lines, dry-run rendered all 20 prompt-pairs (~600 lines stdout); proceed to live run.
  - [ ] 6.3 Operator runs live battery with timestamped results: `PF1_BATTERY_RESULTS_PATH=_bmad-output/implementation-artifacts/v63-4-3-battery-results-$(date +%Y-%m-%d).md node scripts/audit/pf1-validation-battery.js --verbose 2>&1 | tee _bmad-output/implementation-artifacts/v63-4-3-battery-stdout-$(date +%Y-%m-%d).log`. Expected wall-clock: 5-10 min (per Story 4.2 PR3).
  - [ ] 6.4 Operator inspects exit code + results file:
    - **Exit 0 (PASS):** verdict logged; proceed to Task 7.
    - **Exit 1 (INVESTIGATE):** verdict logged; per AC4 EO-8 + arch:367, INVESTIGATE = "fix + retest" (BLOCKING for ship); operator identifies low-scoring agent → root-cause → fix → re-record → re-run.
    - **Exit 2 (FAIL):** verdict logged; do not ship; investigate root cause; re-record + re-run after fix.
    - **Exit 3-5 / 99 (errors):** per Story 4.2 exit-code reference table; HALT + triage.

- [ ] **Task 7: Author release record `v63-4-3-release-record-4.0.md` (~15 min).**
  - [ ] 7.1 Create file at `_bmad-output/implementation-artifacts/v63-4-3-release-record-4.0.md` per Decision 4.
  - [ ] 7.2 Frontmatter: copy gate verdict from battery results + fill all 9 keys (or 11 with optional commit-sha provenance).
  - [ ] 7.3 Body sections per AC5 + Decision 4: M9 verdict, M6 T=4.0, per-agent summary table, recording-method narrative, ship recommendation, operator sign-off.
  - [ ] 7.4 Operator signs off: replaces `Signed off by: <name> on <date>` with actual values. **Anti-pattern guard:** do NOT sign off if gate verdict is INVESTIGATE or FAIL without root-cause-fix-and-re-run completed.

- [ ] **Task 8: Validation gates (AC6).**
  - [ ] 8.1 `npm test 2>&1 | tail -5` — expected `tests 1468 / pass 1467 / skip 1 / fail 0` unchanged.
  - [ ] 8.2 `npm run test:integration 2>&1 | tail -5` — expected `tests 93 / pass 93 / fail 0` unchanged.
  - [ ] 8.3 `npm run lint 2>&1 | tail -5` — clean.
  - [ ] 8.4 `git diff HEAD --stat` — confirms AC7 scope (8-9 NEW files + 2 modified).

## Dev Notes

**Decision rationales (compact):** D1 = FM4-2 spike resolves recording-mechanism uncertainty pre-protocol; CM-1 fix uses `claude -p` (the actual flag). D2 = path-conditional on D1; D2-A scripted (~30min) preferred but D2-B manual (1 day+) acceptable. **HEADER FORMAT CONTRACT load-bearing per CM-6 — digit-only `## Prompt N`, no descriptions.** D3 = git worktree preferred per OS-1 (cleaner; no stash dance); fallback to stash+checkout. **Story 4.3 is RELEASE-TIME activity per CM-7** — Task 0.5 precondition gates execution. D4 = single release record consolidates M9 + M6; 9 frontmatter keys per CM-5 (was incorrectly stated as 8). D5 = explicit per-task time-budgets + escape hatches.

**Anti-patterns to avoid (top 5):**
- DON'T use descriptive headers like `## Prompt 1: Activation greeting + menu` — Story 4.2 parser REJECTS them (CM-6).
- DON'T use `bmad-brainstorming` for Carson — that's the brainstorming-method skill; Carson is `bmad-cis-agent-brainstorming-coach` (CM-3).
- DON'T use `claude --skill X --no-interactive` — neither flag exists; use `claude -p` (CM-1).
- DON'T use `convoke-update.js --apply` — flag doesn't exist; reference `migrations/3.x-to-4.0.js` (CM-2).
- DON'T capture baselines AFTER migration trigger — defeats FM4-4 mitigation purpose.

**External dependencies + risk (compact):**

| ID | Risk | Mitigation |
|----|------|-----------|
| PR1 | FM4-2 spike inconclusive | DS1 30-min cap + declare FAIL → D2-B fallback |
| PR2 | Recording wall-clock exceeds time-box | Decision 5 escape hatches |
| PR3 | v3.3.0 tag missing | DS3 inversion: last 3.x commit OR manual sandbox |
| PR4 | Migration breaks 4.0 install | Task 4.2 verifies; if broken, BLOCKING for ship |
| PR5 | Battery dry-run silent-failure (CM-4) | Task 6.2 grep for `Error:` lines; bug routed to D-V42-R3-1 |
| PR6 | Gate verdict INVESTIGATE/FAIL | Both block ship per AC4 EO-8; operator fix-and-re-run |
| PR7 | Calibration evidence drift | Operator can re-run Story 4.1 calibration to verify |

**Spike points:** DS1 FM4-2 spike (Task 1; load-bearing for D2 path).

**Apply Epic 3 retro action items:**
- **PI-9 (`${PIPESTATUS[0]}`):** Task 6 uses `tee` pipelines but bash exit code is from final command (`tee`). NOT a problem here since `tee` exits 0 normally; battery's exit code captured separately via `echo $?` after the tee chain (operator instruction).
- **PI-10 (Edge Case Hunter as load-bearing):** code-review at story close MUST include Edge Case Hunter layer.
- **PI-11 (DEF-SPIKE inversion handling):** applied in Task 1 (DS1) + Task 0.4 (v3.3.0 tag fallback) + Task 0.5 (precondition check fallback to operator-blocking-flag).
- **PI-12 (spec spot-check rubric audit):** AC1-AC7 each pin verifiable assertions.

**Inheritance from Story 4.1 + 4.2:** Story 4.3 doesn't author code (D2-A's conditional `pf1-record-agent.js` would be the only NEW JS); CONSUMES Stories 4.1 + 4.2 surfaces. CM-4 caught a real Story 4.2 surface bug — routed to deferred-work `D-V42-R3-1` per Q2=A operator decision.

**Story 4.3 is fundamentally operator-driven + release-time-deferred** — dev-story execution mostly HALT-for-operator at Tasks 3, 4, 5, 6, 7. Spec emphasizes process documentation over code authoring.

**TI-9 cron-durability:** N/A — no scheduled actions.

## Change Log

- 2026-04-26 — Story 4.3 created via `/bmad-create-story v63-4-3`. 7 ACs + 5 Decisions + 9 Tasks + 7 PR risks. Operator-execution-heavy procedural story.
- 2026-04-26 — V-pass batch-applied **29 improvements** (7 critical + 10 enhancement + 5 optimization + 7 LLM-opt) via spec-rewrite. **Empirical probes 8/10 caught spec defects (highest-ROI V-pass to date)**: CM-1 `claude -p` is real flag (NOT `--skill`/`--no-interactive`); CM-2 `convoke-update.js --apply` flag doesn't exist + project IS at 3.3.0; CM-3 wrong Carson skill name; CM-4 battery `--dry-run` silently exits 0 on missing recordings (Story 4.2 surface bug — V-pass caught defect in just-shipped Story 4.2; routed to deferred-work `D-V42-R3-1` per Q2=A); CM-5 frontmatter count mismatch (8 vs 9); CM-6 descriptive-header recordings BREAK Story 4.2 parser; CM-7 Decision 3 sandbox INVERTED (project at 3.3.0; no 4.0 WIP yet — Story 4.3 is release-time activity per Q1=A: Task 0.5 precondition HALTs dev-story until 4.0 candidate exists). Plus enhancements: PI-11 inversion handlers; baseline-staleness ≤7-day bound; INVESTIGATE-blocks-ship per arch:367; commit-sha provenance in release record; HEADER FORMAT CONTRACT explicit; cross-reference release record vs convoke-announcement-4.0-draft.md; AC7 escape hatch for upstream-Story-4.1+4.2 defect surfacing. Optimizations: git worktree preferred over stash; per-task timestamping; pre-emptive validation helper. LLM-opt: Decision rationales consolidated; PR table-form; anti-patterns trimmed to top 5. **Final spec:** 7 ACs + 5 Decisions + 9 Tasks (Task 0 with new 0.5 precondition check) + 7 PR risks. Story remains ready-for-dev per Q1=A (operator-blocking-flag in Task 0.5; spec authored now, executed at release time). **V-pass ROI:** prevented 4 foundational story-killers (CM-1, CM-2, CM-3, CM-7) + 3 silent-failure defects (CM-4, CM-5, CM-6) — would have wasted 4-8hr operator time on D2-B fallback for wrong reason + corrupted recordings rejected by parser + invalid migration approach.

## Dev Agent Record

(Populates during dev-story execution. Most tasks HALT for operator action.)

### Implementation Plan

(populates during dev-story Step 5)

### Completion Notes

(populates during dev-story Step 9)

### File List

(populates during dev-story Step 8)

## References

- Architecture Decision 4 + FM4-2 spike spec — `_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md:340-378` + `:489-498`
- Story 4.3 epic spec — `_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md:365-373`
- Epic 3 retro action items (PI-10, PI-11, PI-12) — `_bmad-output/implementation-artifacts/epic-v63-3-retro-2026-04-25.md`
- Project context rules — `project-context.md`
- Story 4.1 (R1+R2-converged) — `_bmad-output/implementation-artifacts/v63-4-1-create-pf1-judge-prompt-and-calibration-test.md`
- Story 4.2 (R1+R2-converged) — `_bmad-output/implementation-artifacts/v63-4-2-create-pf1-validation-battery-harness.md`
- Story 4.1 calibration evidence — `_bmad-output/implementation-artifacts/v63-4-1-judge-calibration-evidence.md`
- `scripts/update/migrations/3.x-to-4.0.js` — actual migration tooling (per arch + Story 1A.4)
- `scripts/audit/pf1-validation-battery.js` — Story 4.2 harness (consumed by Task 6)
- V-pass findings — `.review-cache/v63-4-3-vpass-findings.md` (session scratch; gitignored)
- Deferred bug `D-V42-R3-1` (battery dry-run silent-failure) — `_bmad-output/implementation-artifacts/deferred-work.md`
