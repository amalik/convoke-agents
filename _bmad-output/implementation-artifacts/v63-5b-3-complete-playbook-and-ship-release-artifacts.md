---
initiative: convoke
artifact_type: story
qualifier: v63-5b-3-complete-playbook-and-ship-release-artifacts
created: '2026-04-27'
schema_version: 1
epic: v63-epic-5b
---

# Story 5B.3: Complete playbook and ship release artifacts

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 5B — Release Communication & Learning](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-5b-release-communication-learning) (THIRD and FINAL Epic 5B story; closes Epic 5B + closes the v6.3 BMAD adoption initiative).
**Sprint:** 5 (Release Communication & Learning stream — RELEASE-TIME-DEFERRED execution gated on Stories 4.3 + 4.5 closing + a 4.0 candidate existing; spec ships ready-for-dev now to capture the full plan + 4 hand-off marker resolutions).
**FR coverage:** FR44 (CHANGELOG maintainer sign-off recorded in release commit message) + FR45 (`host_framework_sync` playbook complete: validation battery reference + known pitfalls + Winston sign-off) + FR46 (release tagged + published to distribution channels).
**M coverage:** M13 (`host_framework_sync` playbook delivered with Winston sign-off recorded — closes the playbook-completion criterion partially shipped at Story 5A.2 outline + this story finalizes); M16 (CHANGELOG closure: mostHonestOneLineSummary verbatim + Sophia section flow + zero cliché violations were Story 5B.1 deliverables; the maintainer-sign-off-in-release-commit completes M16 at this story per FR44 strict reading); M17 dependency: N=1 external user validation must execute (Story 4.5) AND be recorded in release record before this story closes — release ship cannot proceed without M17 PASS.
**NFR coverage:** N/A direct. Operationally depends on M9 (PF1 PASS — Story 4.3) + M17 (N=1 PASS — Story 4.5) + zero release-blocking deferred-work items.
**Failure modes addressed:**
- L1 hypothesis full closure (creation review satisfied at Story 5B.2; **reuse-validation** continues at v4.x/v6.4 retrospective — Story 5B.3 ships I96 Sprint 0 consultation discipline INTO the playbook so future-release authors find it via the playbook).
- 4 TODO-5B3 hand-off markers resolved in one pass: 3 in `docs/host-framework-sync-playbook.md` (SECTION-D, SECTION-E, SIGNOFF) + 1 in `CHANGELOG.md:8` (CHANGELOG-SIGNOFF). Per Story 5B.1 + 5A.2 + 5B.2 hand-off contracts; verified empirically at spec-author time (CM-1 V-pass).
- Silent release ship without retrospective findings folded into playbook §(e) Known Pitfalls (Story 5B.2 anti-pattern registry consumed here).
- Silent release ship without Winston sign-off on playbook (M13 ship-blocking criterion).
- Silent release commit without maintainer CHANGELOG sign-off (M16 + FR44 ship-blocking criterion).
- Distribution-channel mismatch: npm publish must succeed AND GitHub release must reference the npm tarball + tag + match `marketplace.json` plugin metadata (FR46).

**Why this story is RELEASE-TIME-DEFERRED (NOT buildable-now):** Per `success-criteria.md:9-15` (User Success) + `:34-41` (Technical Success) + arch:455 sequence: release ship requires M9 (PF1 PASS) + M17 (N=1 external user) + closed Stories 4.3 + 4.5. Stories 4.3 + 4.5 are themselves release-time-deferred (their specs exist ready-for-dev but execution requires real 4.0 candidate recordings). Story 5B.3 spec exists NOW (captures the full ship plan + 4 marker resolutions + tag/publish coordination); execution begins when (a) Story 4.3 PF1 cycle PASSES on real 4.0 baseline + post-migration recordings, (b) Story 4.5 N=1 cycle reports clean, (c) deferred-work.md sweep confirms zero release-blocking items, (d) Stories 1B.x deferral decision is made (per Epic 1A retro: 1B is deferrable; operator chooses ship-with or ship-without). Anti-pattern guard: spec MUST NOT mark this story executable until precondition gate is GREEN (4.3 PASS + 4.5 PASS + zero-blockers verified). Operator-managed gate at story pickup time.

**Upstream dependencies:**
- **Story 5A.2 playbook outline** (DONE) — `docs/host-framework-sync-playbook.md` ships with sections (a)-(c) populated + 3 hand-off markers (`SECTION-D`, `SECTION-E`, `SIGNOFF`) for Story 5B.3 to resolve.
- **Story 5B.1 CHANGELOG** (DONE) — `CHANGELOG.md` v4.0 section ships with mostHonestOneLineSummary verbatim + Sophia section flow + zero-violations grep-tested + 1 hand-off marker (`CHANGELOG-SIGNOFF`) for Story 5B.3 release commit.
- **Story 5B.2 retrospective + anti-pattern registry** (DONE) — `_bmad-output/implementation-artifacts/v63-retrospective-bmad-v6.3-adoption.md` + `_bmad-output/planning-artifacts/convoke-anti-patterns.md` + I96 backlog entry. Story 5B.2 Section §(e) source: anti-pattern registry's 10 entries feed playbook Known Pitfalls.
- **Story 4.3 PF1 validation cycle** (RELEASE-TIME-DEFERRED ready-for-dev) — `_bmad-output/implementation-artifacts/v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md`. M9 PASS evidence is required for release ship per success-criteria.md.
- **Story 4.4 drift snapshot tooling** (DONE R1+R2) — `scripts/audit/drift-snapshot.js` + protocol doc; cited from playbook §(d) as part of validation battery.
- **Story 4.5 N=1 external user validation** (RELEASE-TIME-DEFERRED ready-for-dev) — `_bmad-output/implementation-artifacts/v63-4-5-n-1-external-user-validation-sprint-5.md`. M17 PASS required for release ship.
- **I96 backlog entry** (BACKLOGGED at Story 5B.2; provenance: v63-5b-2-retrospective) — Sprint 0 anti-pattern registry consultation checklist for future Convoke major releases. Bundles-with Story 5B.3: codify the consultation discipline INTO the playbook §(e) Known Pitfalls or as a standalone section so future operators find it via the playbook surface (closes the L1 hypothesis falsification surface from "operator must remember" to "playbook enforces").

**Downstream consumers:**
- **Convoke 4.0 users** — Existing 3.x users run `convoke-update` post-tag; new users discover via marketplace + npm.
- **Future v6.4 / v7.0 host_framework_sync release maintainer** — Reads completed playbook + signed-off frontmatter as the v4.0 worked example; reapplies WS1-WS5 template-tasks at next upstream major.
- **L1 hypothesis reuse-validation** — Future release retrospective consults `convoke-anti-patterns.md` per Sprint 0 checklist; Story 5B.3 ships the playbook section that surfaces this consultation discipline.
- **Epic 5B closure** — Story 5B.3 = 3/3; Epic 5B status: in-progress → done.
- **v6.3 initiative closure** — 23 stories shipped (excluding deferred Stories 1B.x); Convoke 4.0.0 publicly available.

**Namespace decision:** playbook completion at `docs/host-framework-sync-playbook.md` (existing user-facing doc); CHANGELOG sign-off at `CHANGELOG.md` (existing user-facing release artifact); release commit message authored at git-commit time (operator action, not file artifact); GitHub release + npm publish are external system actions (not file artifacts); package.json version bump 3.3.0 → 4.0.0 at release time. NO `_bmad/bme/` skill — covenant-compliance-checklist N/A. Pure release-coordination + documentation-completion story.

## Story

As Convoke maintainer (Amalik) closing v6.3 BMAD adoption at Sprint 5 release-ship time,
I want **the `host_framework_sync` playbook completed (sections (d) Validation Battery Reference + (e) Known Pitfalls populated from Story 5B.2 retrospective findings + Sprint 0 anti-pattern registry consultation discipline added per I96 + Winston sign-off recorded + frontmatter `winston_signoff_status: signed-off` + 4 TODO-5B3 hand-off markers resolved across `docs/host-framework-sync-playbook.md` + `CHANGELOG.md`), the maintainer CHANGELOG sign-off line written into the release commit message per FR44 + M16 (template: `Maintainer sign-off (CHANGELOG per FR44+M16): Amalik <YYYY-MM-DD>`), `package.json` version bumped 3.3.0 → 4.0.0, the v4.0.0 git tag created, the GitHub release published referencing the tag + npm tarball + marketplace.json plugin metadata, and `npm publish convoke-agents@4.0.0` executed against the npm registry**,
so that Convoke 4.0 ships publicly with verifiable artifact trail (M13 + M16 closed; FR44 + FR45 + FR46 met), existing 3.x users get the upgrade via `convoke-update` against the published 4.0 release, new users discover Convoke via the BMAD marketplace (Story 3.3 PR #9) + npm + platform-agnostic adapters, future `host_framework_sync` release maintainers inherit the completed playbook as a worked example with Sprint 0 consultation discipline pre-codified, and the v6.3 BMAD adoption initiative closes with all release-time-deferred dependencies (Stories 4.3 + 4.5) executed before tag.

**Story shape:** **release-coordination + documentation-completion + external-system-action / RELEASE-TIME-DEFERRED** (mirrors Story 5B.1 doc-completion shape for the playbook portion + adds tag/publish coordination for ship; mid-sized story given coordination surface — ~2-3 hours operator time at release-ship pickup, gated by Stories 4.3 + 4.5 closure). 0 NEW files (playbook + CHANGELOG already exist; this story COMPLETES them). 5 MODIFIED files: `docs/host-framework-sync-playbook.md` (sections d + e + sign-off + frontmatter + STATUS preamble removal), `CHANGELOG.md` (date stamp + sign-off marker resolution), `package.json` (version bump 3.3.0 → 4.0.0), `_bmad-output/implementation-artifacts/sprint-status.yaml` (status transitions + epic close), this story file. Plus external-system actions: git tag, GitHub release, npm publish.

**Empirical baseline (probed 2026-04-27 at story-author time; re-probe required at story-pickup time):**

| Probe | Current state | Story-pickup re-probe required? |
|-------|---------------|-------------------------------|
| 4 TODO-5B3 markers present | ✓ — 1 in `CHANGELOG.md:8` (CHANGELOG-SIGNOFF) + 3 in `docs/host-framework-sync-playbook.md` (L123 SECTION-D, L131 SECTION-E, L144 SIGNOFF) — verified empirically 2026-04-27 (CM-1 V-pass: earlier "L1 + L8 = 2 instances" claim was wrong; CHANGELOG has 1 marker at L8 only) | YES — verify markers still present + grep returns 4 blocks; if drift, surface to operator |
| Story 5B.2 retrospective + registry shipped | ✓ — both files at canonical paths | YES — verify still at canonical paths + content stable |
| Story 4.3 PF1 cycle execution | ⏳ release-time-deferred (spec ready-for-dev; execution waits for 4.0 candidate) | YES — gate-1: must be `done` with M9 PASS evidence in release record before Story 5B.3 execution starts |
| Story 4.5 N=1 cycle execution | ⏳ release-time-deferred (spec ready-for-dev; execution waits for non-Amalik human + 4.0 candidate) | YES — gate-2: must be `done` with M17 PASS evidence in release record before Story 5B.3 execution starts |
| `package.json` version | 3.3.0 (current npm-published latest) | YES — re-probe at pickup (npm may have shipped 3.3.x patches) |
| `marketplace.json` PluginResolver-valid + matches package metadata | Story 3.1 done | YES — re-probe + run `convoke-validate-marketplace` |
| Story 3.3 PR #9 state at upstream | OPEN at story-author time per Story 3.3 PR link | YES — re-probe at ship time; per OP-4 framing, upstream merge is NOT ship-blocking; PR can stay OPEN through ship |
| `npm test` baseline | 1492/1491/1/0 | YES — re-probe at pickup; baseline may shift if upstream releases shipped between author + pickup |
| `npm run test:integration` baseline | 93/93/0 | YES — re-probe at pickup |
| Deferred-work.md zero-blockers sweep | Aggregate ~80+ items per Epic 3 retro TI-3; **TI-3 sweep DEFERRED to pre-ship** | YES — gate-3: operator runs `/bmad-enhance-initiatives-backlog` triage at story pickup to confirm zero release-blocking items |
| Stories 1B.x deferral decision | Per Epic 1A retro: 1B is deferrable; not yet decided | YES — gate-4: operator decides at pickup whether 1B.x ships in 4.0 or defers to 4.0.x patch / 4.1 |

## Acceptance Criteria

### Decisions (pinned at spec-author time; defensible at dev-time)

**Decision 1 — Release-time-deferred execution per dependency chain.** Story 5B.3 spec exists NOW with full plan; execution waits for (a) Story 4.3 closing with M9 PASS, (b) Story 4.5 closing with M17 PASS, (c) deferred-work.md sweep confirming zero release-blocking items, (d) Stories 1B.x deferral decision made. **Anti-pattern guard:** dev-story Task 0 pre-flight gates ALL FOUR conditions; if any FAILS, HALT + surface to operator + DO NOT proceed to Tasks 1+. Operator decides whether to (i) wait for blocker resolution, (ii) reduce scope (e.g., defer ship by version-bump to 4.0.0-rc1 instead of 4.0.0), or (iii) accept blocker as known-issue with explicit deferral note in release commit + post-release follow-up.

**Decision 2 — Playbook completion: 4 hand-off markers + frontmatter update + STATUS preamble removal.** Resolve in this order:
1. **§(d) Validation Battery Reference** — populate at L123 marker location; cite Story 4.3 PF1 cycle artifact (M9 PASS evidence file:line) + Story 4.4 drift-snapshot tooling (`scripts/audit/drift-snapshot.js` + 24-test suite + protocol doc) + **drift threshold T = 4.0** per `convoke-arch-bmad-v6.3-adoption.md:362` (CM-5 V-pass: T = 4.0 verbatim — "equivalent behavior, minor phrasing changes" per arch L362; 5-point scale 1-5; gate at median ≥ 4.0 across 5 agents AND no single agent median ≤ 2 = PASS) + 5-agent × 4-prompt × 3-judge-runs orchestration semantics + PASS/INVESTIGATE/FAIL gate logic. ~1 paragraph technical reference + 1 paragraph "how to invoke at next host_framework_sync release" + 1 paragraph "what to do if PF1 fails post-publish" (EO-2 V-pass: ship 4.0.1 patch with focused fix; do not silent-correct).
2. **§(e) Known Pitfalls** — populate at L131 marker location; pull anti-patterns from `_bmad-output/planning-artifacts/convoke-anti-patterns.md` (Story 5B.2 deliverable) — initially 10 entries, may have grown post-5B.2; cite each AP-N with 1-line summary + counter-pattern reference. PLUS embed I96 Sprint 0 consultation checklist (per Story 5B.2 retrospective backlog entry) — explicit instruction at next host_framework_sync release Sprint 0: "Open `_bmad-output/planning-artifacts/convoke-anti-patterns.md` end-to-end + cite applicable entries in new release's planning artifacts + track recurrence inline." Closes L1 hypothesis falsification surface from "operator must remember" to "playbook surface enforces."
3. **§Winston Sign-Off** — populate at L144 marker location; invoke `bmad-agent-architect` (Winston) via /skill or via dev-story prompt for review + sign-off. Sign-off line template: `Winston sign-off (Story 5A.2 + 5B.3 host_framework_sync playbook per FR45 + M13): <YYYY-MM-DD>`. NO sign-off without Winston actually reviewing the completed playbook.
4. **Frontmatter update** — `outline_complete: true` → `outline_complete: false` (semantic: "no longer just an outline; full playbook"). `winston_signoff_status: pending` → `winston_signoff_status: signed-off`. Per Story 5A.2 spec L17 instruction: future maintainers gate on `signed-off` + absence-of-hand-off-markers.
5. **STATUS preamble removal** — delete the L13-17 STATUS preamble block ("STATUS: OUTLINE — INCOMPLETE...") + delete the §Winston Sign-Off "Hand-off contract for Story 5B.3 author" instruction block (L148-153) — these were Story 5A.2 hand-off markers; they don't ship in the final playbook.

**Decision 3 — Maintainer CHANGELOG sign-off recorded in release commit message per FR44 + M16.** Per Story 5B.1 Decision 5 + Story 5B.1 grep-evidence file's "Re-verification at release ship time" section + the TODO-5B3-CHANGELOG-SIGNOFF marker at `CHANGELOG.md` L1 + L8: the release commit message MUST include the line `Maintainer sign-off (CHANGELOG per FR44+M16): Amalik <YYYY-MM-DD>` (substitute actual date at release ship). The release commit is the SAME commit that bumps `package.json` 3.3.0 → 4.0.0 + finalizes CHANGELOG `## [4.0.0] - YYYY-MM-DD` header date + bumps any other version-coupled artifacts. Sign-off line is part of the commit MESSAGE BODY, not the diff. **Anti-pattern guard:** sign-off line in CHANGELOG.md prose body would falsify FR44 strict reading (FR44 specifies "release commit message"). Both TODO-5B3-CHANGELOG-SIGNOFF marker INSTANCES (L1 + L8) MUST be removed from CHANGELOG.md after release commit (they're hand-off scaffolding, not user-facing content).

**Decision 4 — Release ship sequence per arch:455 + success-criteria.md M-criteria order.** Execute in this exact order, grouped into 5 phases (OS-1 V-pass visual grouping):

***Phase A — Pre-flight (steps 1-2):***
1. Pre-flight gates (Task 0) — verify Stories 4.3 + 4.5 closed + deferred-work zero-blockers + 1B.x decision.
2. Re-run grep tests (FR42 + FR43) against final CHANGELOG (per Story 5B.1 grep-evidence file's re-verification commands; both must return zero matches).

***Phase B — Documentation completion (steps 3-5):***
3. Complete playbook §(d) + §(e) + Winston sign-off + frontmatter + remove STATUS preamble (Decision 2).
4. Update CHANGELOG `## [4.0.0] - YYYY-MM-DD` → fill in actual ship date.
5. Bump `package.json` 3.3.0 → 4.0.0.

***Phase C — Commit + tag (steps 6-9):***
6. Stage release commit with Decision 3 sign-off line in message body + ALSO Winston sign-off line (template: `Winston sign-off (host_framework_sync playbook per FR45 + M13): <YYYY-MM-DD>`). See OS-2 V-pass HEREDOC template at Task 8.4.
7. Run `npm test` + `npm run test:integration` + `npm run lint` final gate (must be GREEN).
8. Create release commit (single commit; squash if multiple in-flight changes).
9. Create v4.0.0 git tag pointing at release commit (`git tag -a v4.0.0 -m "Convoke 4.0.0 release"`).

***Phase D — Publish (steps 10-13):***
10. Push commit + tag to origin/main.
11. Run `npm publish convoke-agents@4.0.0` (NPM 2FA required — operator interactive step).
12. Create GitHub release at `https://github.com/<owner>/convoke-agents/releases/new` referencing tag v4.0.0 + paste CHANGELOG v4.0 section as release notes + attach npm tarball link.
13. Verify `npm view convoke-agents@4.0.0` returns published metadata.

***Phase E — Verification + close (steps 14-15):***
14. Verify `convoke-update` from a sandbox 3.3.0 install successfully migrates to 4.0.0 (smoke test post-publish) + `.claude-plugin/marketplace.json:12` version stays at 4.0.0 (CM-4 V-pass sync verification).
15. Update sprint-status.yaml + close Story 5B.3 + close Epic 5B + close v63-epic initiative + leave PR #9 ship-comment per EO-5 V-pass.
**Inversion handler:** if step 11 (`npm publish`) fails (auth, registry availability, name collision), halt + investigate + retry; if step 12-14 fail post-publish (rare), the tag + npm-published version are the source of truth (rollback npm publish is destructive — only do so if the published artifact is materially broken).

**Decision 5 — Stories 1B.x deferral decision: operator-managed at story pickup.** Per Epic 1A retro: Stories 1B.1 + 1B.2 + 1B.3 (Amelia consolidation) are deferrable from 4.0 ship; not blocking. **CM-3 V-pass empirical note:** Stories 1B.x specs DON'T EXIST yet (sprint-status shows 1B.x at `backlog`; no `.md` spec files at `_bmad-output/implementation-artifacts/v63-1b-*.md`). Story 5B.3 dev-story Task 0 surfaces this decision: (a) ship 4.0 with 1B.x done — operator MUST FIRST bootstrap 3 specs via `/bmad-create-story v63-1b-1` + `v63-1b-2` + `v63-1b-3`, then V-pass + dev-story + code-review each (estimated 6-8 hours total before Story 5B.3 can resume); (b) ship 4.0 without 1B.x — defer to 4.0.x patch or 4.1 minor with explicit deferral note in CHANGELOG + release commit + backlog tagged-deferred-from-v4.0 entries (estimated 30 minutes Task 6.5 work). **Default assumption (operator can override):** ship without 1B.x to honor OP-1 maintainer bandwidth principle + minimize ship-time scope + avoid additional 6-8 hours of bootstrap-then-execute. **Anti-pattern guard:** silent omission of 1B.x deferral note violates OP-2 (deferral is allowed; silent deferral is not).

**Decision 6 — Anti-pattern registry consultation discipline embedded in playbook §(e) per I96 backlog entry.** Story 5B.2 added I96 to Fast Lane (RICE 3.2; provenance: v63-5b-2-retrospective) requiring Sprint 0 anti-pattern registry consultation checklist. Story 5B.3 implements I96's deliverable INSIDE the playbook §(e) Known Pitfalls section: explicit instructions to next-release maintainer at Sprint 0 to (a) read `_bmad-output/planning-artifacts/convoke-anti-patterns.md` end-to-end, (b) cite applicable entries in new release's planning artifacts (PRD shards or sprint plan), (c) note recurrence inline in registry entries when an anti-pattern reappears (per registry §"Recurrence tracking"). Closes I96 + closes L1 falsification surface ("registry exists but is never consulted"). I96 backlog row moves Fast Lane → §2.5 Completed at Story 5B.3 close.

---

**AC1 — Playbook complete: §(d) + §(e) + §Winston Sign-Off + frontmatter + STATUS preamble removed.**
**Given** Story 5B.3 dev-story Task 0 pre-flight passes
**When** Tasks 2-5 complete
**Then**:
- `docs/host-framework-sync-playbook.md` §(d) Validation Battery Reference contains: Story 4.3 PF1 cycle cite (file:line for M9 PASS evidence) + Story 4.4 drift-snapshot tooling cite + drift threshold T value per arch:362-368 + 5×4×3 orchestration semantics + PASS/INVESTIGATE/FAIL gate logic + "how to invoke at next host_framework_sync release" paragraph.
- §(e) Known Pitfalls contains: ≥10 anti-pattern entries from `convoke-anti-patterns.md` (1-line summary per entry + cross-link) + I96 Sprint 0 consultation checklist (Decision 6).
- §Winston Sign-Off contains: signed Winston sign-off line per Decision 2 template.
- Frontmatter: `outline_complete: false` AND `winston_signoff_status: signed-off`.
- STATUS preamble at L13-17 + Hand-off contract block at L148-153 deleted.
- All 3 playbook TODO-5B3 markers (`SECTION-D`, `SECTION-E`, `SIGNOFF`) absent from final playbook.

**AC2 — CHANGELOG release date stamped + grep tests re-run zero-violations + sign-off marker resolved.**
**Given** Tasks 2-5 complete + ship date determined
**When** Task 6 runs
**Then**:
- `CHANGELOG.md` `## [4.0.0] - YYYY-MM-DD` header has actual ship date filled in (e.g., `## [4.0.0] - 2026-MM-DD`).
- TODO-5B3-CHANGELOG-SIGNOFF marker (1 instance at `CHANGELOG.md:8` per CM-1 V-pass empirical verification) removed.
- FR42 cliché-list grep returns zero matches against final v4.0 section (re-run per Story 5B.1 grep-evidence re-verification commands).
- FR43 internalOnly-vocabulary grep returns zero matches against final v4.0 section.
- Re-run grep evidence captured in dev-story Debug Log References (verbatim stdout per Story 5B.1 pattern).

**AC3 — Release commit + tag + maintainer CHANGELOG sign-off in commit message per FR44 + M16.**
**Given** AC1 + AC2 complete
**When** Tasks 7-8 run
**Then**:
- `package.json` version bumped 3.3.0 → 4.0.0.
- Single release commit staged with diff = playbook + CHANGELOG + package.json + sprint-status (+ this story file) + (1B.x deferral notes if applicable per Decision 5).
- Release commit message contains BOTH sign-off lines per Decision 3 + Decision 4: `Maintainer sign-off (CHANGELOG per FR44+M16): Amalik <YYYY-MM-DD>` + `Winston sign-off (host_framework_sync playbook per FR45 + M13): <YYYY-MM-DD>`.
- `git tag -a v4.0.0 -m "Convoke 4.0.0 release"` created pointing at release commit.
- Commit + tag pushed to `origin/main`.

**AC4 — npm publish + GitHub release + post-publish smoke test per FR46.**
**Given** AC3 complete (release commit + tag pushed)
**When** Tasks 9-12 run
**Then**:
- `npm publish convoke-agents@4.0.0` succeeds (NPM 2FA completed by operator).
- `npm view convoke-agents@4.0.0` returns published metadata.
- GitHub release created at `https://github.com/<owner>/convoke-agents/releases/new` referencing tag v4.0.0; release notes contain CHANGELOG v4.0 section verbatim.
- Post-publish smoke test: in a clean sandbox with Convoke 3.3.0 installed, running `convoke-update` migrates successfully to 4.0.0 (verifies marketplace + npm metadata + migration path).
- `.claude-plugin/marketplace.json:12` version field stays at `"4.0.0"` (CM-4 V-pass: pre-set by Story 3.1; verify post-`package.json` bump that the two version fields are in sync — no edit to marketplace.json needed if already at 4.0.0).
- Marketplace.json plugin metadata still PluginResolver-valid against published 4.0.0 (Story 3.1 invariant preserved).

**AC5 — Validation gates green at release ship + zero new test regressions.**
- [ ] 5.1 `npm test` baseline must remain ≥ Story 5B.2 close baseline 1492/1491/1/0 (or higher if Stories 4.3 + 4.5 added tests; verify ALL pass + no regressions).
- [ ] 5.2 `npm run test:integration` baseline ≥ 93/93/0 (or higher post-4.3/4.5).
- [ ] 5.3 `npm run lint` clean.
- [ ] 5.4 `git status --porcelain` empty after release commit + push (clean working tree post-ship).

**AC6 — Scope discipline + Stories 1B.x deferral note (per Decision 5).**
- IN scope (NEW files):
  - This story file.
- IN scope (MODIFIED):
  - `docs/host-framework-sync-playbook.md` — §(d) + §(e) + §Winston Sign-Off + frontmatter + STATUS preamble removed (per AC1).
  - `CHANGELOG.md` — date stamp + 2 marker instances removed (per AC2). PLUS if Stories 1B.x deferred per Decision 5: add a `### Deferred from 4.0 → 4.0.x or 4.1` subsection naming each deferred story + tagged-deferred-from-v4.0 backlog entry per OP-2.
  - `package.json` — version 3.3.0 → 4.0.0 (per AC3).
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — v63-5b-3 status transitions + v63-epic-5b: in-progress → done + last_updated narrative.
  - `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — I96 Fast Lane → §2.5 Completed (per Decision 6 close).
- IN scope (EXTERNAL SYSTEM ACTIONS — not git diff):
  - `git tag -a v4.0.0` + push tag to origin.
  - `npm publish convoke-agents@4.0.0`.
  - GitHub release creation via `gh release create v4.0.0`.
- MUST NOT touch: epic retros (frozen — only cite); shipped Story specs (frozen — only cite); Story 5A.1/5B.1/5B.2 artifacts (frozen — only cite); PRD shards (frozen — only link); ADR (frozen — only link); any code OUTSIDE `package.json` version field; any test files; any `_bmad/` files (per Convoke memory: `_bmad/` paths NOT renamed for BMAD compatibility).

## Tasks / Subtasks

- [ ] **Task 0: Pre-flight gates (operator-managed at story pickup; HALT if any fail). LL-1 V-pass compression: 9 → 6 sub-tasks.**
  - [ ] 0.1 Confirm Stories 4.3 + 4.5 status `done` in sprint-status.yaml with M9 + M17 PASS evidence in release record.
  - [ ] 0.2 Confirm 4 TODO-5B3 hand-off markers present + Stories 5B.1/5B.2/5A.2 artifacts at canonical paths: run `grep -rn "TODO-5B3" docs/host-framework-sync-playbook.md CHANGELOG.md` → expect exactly 4 matches (3 playbook L123/L131/L144 + 1 CHANGELOG L8).
  - [ ] 0.3 Run `/bmad-enhance-initiatives-backlog` Triage mode (or grep `deferred-work.md`) — surface zero release-blocking items; route any blockers to operator before proceeding.
  - [ ] 0.4 Operator decision (Decision 5): Stories 1B.x ship in 4.0 OR defer to 4.0.x/4.1? **CM-3 V-pass note:** 1B.x specs don't exist yet; ship-with requires bootstrapping `/bmad-create-story v63-1b-1/2/3` + V-pass + dev-story + code-review for each (~6-8 hours) BEFORE returning to Story 5B.3. Document decision in dev-story Debug Log References + corresponding CHANGELOG note + backlog entries if deferring.
  - [ ] 0.5 Confirm `npm test` baseline ≥ 1492/1491/1/0 + `npm run test:integration` ≥ 93/93/0 (re-probe; account for Stories 4.3 + 4.5 test additions if any).
  - [ ] 0.6 Mark v63-5b-3: ready-for-dev → in-progress in sprint-status.yaml.

- [ ] **Task 1: Read inputs (~30 min).**
  - [ ] 1.1 Read Story 5B.2 retrospective + anti-pattern registry — extract anti-pattern summaries for §(e).
  - [ ] 1.2 Read Story 4.3 PF1 cycle artifact for M9 PASS cite + Story 4.4 drift-snapshot protocol for §(d) battery reference.
  - [ ] 1.3 Read arch:362-368 for drift threshold T + 5×4×3 orchestration semantics.
  - [ ] 1.4 Read Story 5A.2 playbook outline frontmatter convention + STATUS preamble structure (for clean removal).
  - [ ] 1.5 Read Story 5B.1 grep-evidence file's re-verification commands (verbatim copy for AC2).
  - [ ] 1.6 Read I96 backlog entry text for Decision 6 §(e) consultation checklist content.
  - [ ] 1.7 Read Stories 1B.x specs IF Decision 5 chooses ship-with (otherwise document deferral).

- [ ] **Task 2: Complete playbook §(d) Validation Battery Reference (~30 min).**
  - [ ] 2.1 At marker `<!-- TODO-5B3-SECTION-D: Validation Battery Reference -->` (L123): write technical reference paragraph citing Story 4.3 PF1 cycle (file:line for M9 PASS evidence) + Story 4.4 drift-snapshot.js + 24-test suite + protocol doc.
  - [ ] 2.2 Add drift threshold T = 4.0 (verbatim per `convoke-arch-bmad-v6.3-adoption.md:362` — "equivalent behavior, minor phrasing changes" on a 5-point scale).
  - [ ] 2.3 Add 5-agent × 4-prompt × 3-judge-runs orchestration description + PASS/INVESTIGATE/FAIL gate semantics.
  - [ ] 2.4 Add "How to invoke at next host_framework_sync release" 1-paragraph instruction.
  - [ ] 2.5 Remove the marker + the "Pending Story 5B.3" placeholder paragraph (L125 in current playbook).

- [ ] **Task 3: Complete playbook §(e) Known Pitfalls + I96 consultation checklist (~30 min).**
  - [ ] 3.1 At marker `<!-- TODO-5B3-SECTION-E: Known Pitfalls -->` (L131): pull AP-1..AP-N from `convoke-anti-patterns.md` (10 entries at Story 5B.2 close; may have grown).
  - [ ] 3.2 Per AP-N: write 1-line summary + counter-pattern reference + cross-link to registry entry.
  - [ ] 3.3 Add I96 Sprint 0 consultation checklist subsection per Decision 6: explicit Sprint 0 instruction to next-release maintainer (read registry end-to-end + cite applicable entries + note recurrence inline).
  - [ ] 3.4 Remove the marker + the "Pending Story 5B.3" placeholder paragraph + anticipated-lessons bullets (L133-138 in current playbook).

- [ ] **Task 4: Winston sign-off on playbook (~15 min — operator + agent collaboration).**
  - [ ] 4.1 Invoke `bmad-agent-architect` (Winston) via `/skill bmad-agent-architect` or via dev-story prompt for review of completed playbook (sections a-e + frontmatter).
  - [ ] 4.2 Winston reviews + provides any structural feedback. **EO-3 V-pass clarification:** Winston sign-off review is a one-shot architectural review at this story (NOT a `/bmad-code-review` convergence-rule-bound round). If Winston surfaces structural feedback, apply edits as in-flight playbook revisions within Story 5B.3 scope; if feedback is too large to incorporate at sign-off time, HALT + log as deferred follow-up (separate from code-review convergence rule — that rule applies only to `/bmad-code-review` sweeps, not architect sign-offs).
  - [ ] 4.3 Winston records sign-off line at marker `<!-- TODO-5B3-SIGNOFF: Winston sign-off -->` (L144): `Winston sign-off (Story 5A.2 + 5B.3 host_framework_sync playbook per FR45 + M13): <YYYY-MM-DD>`.
  - [ ] 4.4 Remove the marker + the "PENDING" preamble + the Hand-off contract for Story 5B.3 author block (L146-153).

- [ ] **Task 5: Update playbook frontmatter + STATUS preamble removal (~5 min).**
  - [ ] 5.1 Frontmatter: `outline_complete: true` → `outline_complete: false`.
  - [ ] 5.2 Frontmatter: `winston_signoff_status: pending` → `winston_signoff_status: signed-off`.
  - [ ] 5.3 Delete STATUS preamble block at L13-17 ("STATUS: OUTLINE — INCOMPLETE..." + the 3-line Sections d + e + Winston sign-off pending notice).
  - [ ] 5.4 Verify final playbook contains zero TODO-5B3 markers via `grep -c "TODO-5B3" docs/host-framework-sync-playbook.md` → expect 0.

- [ ] **Task 6: Re-run CHANGELOG grep tests + date stamp + remove sign-off markers (~10 min).**
  - [ ] 6.1 Determine actual release ship date (today at time of execution).
  - [ ] 6.2 Update `CHANGELOG.md` `## [4.0.0] - YYYY-MM-DD` → `## [4.0.0] - <actual-date>`.
  - [ ] 6.3 Re-run FR42 cliché-list grep + FR43 internalOnly grep against the v4.0 section per Story 5B.1 grep-evidence re-verification commands. BOTH must return zero matches; if any matches surface (e.g., from edits made between 5B.1 close and now), HALT + remediate.
  - [ ] 6.4 Remove TODO-5B3-CHANGELOG-SIGNOFF marker (1 instance at `CHANGELOG.md:8` per CM-1 V-pass empirical verification).
  - [ ] 6.5 If Stories 1B.x deferred per Decision 5: add `### Deferred from 4.0 → 4.0.x or 4.1` subsection enumerating deferred stories + backlog entries.

- [ ] **Task 7: Stage release commit + bump package.json (~10 min).**
  - [ ] 7.1 Bump `package.json` version 3.3.0 → 4.0.0.
  - [ ] 7.2 Verify diff clean: only intended files changed (per AC6 IN-scope MODIFIED list).
  - [ ] 7.3 Stage all modified files via `git add` (specific paths, NOT `git add .` — per memory feedback).
  - [ ] 7.4 Compose release commit message with both sign-off lines per Decision 3 + Decision 4 templates.

- [ ] **Task 8: Final pre-tag validation gates + create release commit + tag (~10 min).**
  - [ ] 8.1 `npm test` final run — must be ≥ baseline + 0 regressions (AC5.1).
  - [ ] 8.2 `npm run test:integration` final run (AC5.2).
  - [ ] 8.3 `npm run lint` final run (AC5.3).
  - [ ] 8.4 Create release commit using HEREDOC (OS-2 V-pass exact template):
    ```bash
    git commit -m "$(cat <<'EOF'
    Convoke 4.0.0 — host_framework_sync release for BMAD v6.3 adoption

    Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD evolves and adds marketplace distribution for reach.

    Maintainer sign-off (CHANGELOG per FR44+M16): Amalik <YYYY-MM-DD>
    Winston sign-off (host_framework_sync playbook per FR45 + M13): <YYYY-MM-DD>

    Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
    EOF
    )"
    ```
    Substitute actual `<YYYY-MM-DD>` ship dates before commit. Single commit; both sign-off lines + Co-Authored-By footer required.
  - [ ] 8.5 Create v4.0.0 git tag: `git tag -a v4.0.0 -m "Convoke 4.0.0 release"`.
  - [ ] 8.6 Push commit + tag: `git push origin main && git push origin v4.0.0`.

- [ ] **Task 9: npm publish (~5 min — operator interactive).**
  - [ ] 9.1 Run `npm publish convoke-agents@4.0.0` (operator completes 2FA).
  - [ ] 9.2 Verify `npm view convoke-agents@4.0.0` returns published metadata.
  - [ ] 9.3 Capture publish stdout in dev-story Debug Log References.

- [ ] **Task 10: GitHub release + post-publish smoke test (~15 min).**
  - [ ] 10.1 Create GitHub release. **EO-1 V-pass portable approach (macOS BSD `head` doesn't support negative `-n`):** extract v4.0 section to temp file via `sed -n '/^## \[4\.0\.0\]/,/^## \[3\.3\.0\]/p' CHANGELOG.md | sed '$d' > /tmp/v4.0-release-notes.md` (the second `sed '$d'` strips the trailing `## [3.3.0]` header line), then `gh release create v4.0.0 --title "Convoke 4.0.0" --notes-file /tmp/v4.0-release-notes.md`. Release notes = CHANGELOG v4.0 section verbatim.
  - [ ] 10.2 Smoke test in clean sandbox: install Convoke 3.3.0 (or use existing tmpDir fixture) → run `convoke-update` → verify migration to 4.0.0 succeeds.
  - [ ] 10.3 Re-run `convoke-validate-marketplace` against published 4.0.0 → must remain PluginResolver-valid (Story 3.1 invariant preserved per AC4). **CM-4 V-pass step:** verify `.claude-plugin/marketplace.json:12` version field is `"4.0.0"` (pre-set by Story 3.1; should match the just-bumped `package.json` version — `grep '"version"' .claude-plugin/marketplace.json package.json` should show both at 4.0.0).
  - [ ] 10.4 Capture smoke-test output in dev-story Debug Log References.
  - [ ] 10.5 **EO-5 V-pass:** post-publish, leave a comment on Story 3.3 PR #9 (`bmad-code-org/bmad-plugins-marketplace#9`) noting ship date + GitHub release URL + npm-published version. Closes the loop on the OPEN PR per OP-4 framing. Suggested comment template: `Convoke 4.0.0 shipped <YYYY-MM-DD>: GitHub release <url> + npm tarball <npm-link>. PR registry entry remains accurate; awaiting upstream review at upstream's cadence per OP-4.` Use `gh pr comment 9 --repo bmad-code-org/bmad-plugins-marketplace --body "<text>"`.

- [ ] **Task 11: Close Story 5B.3 + Epic 5B + I96 backlog entry + sprint-status update (~10 min).**
  - [ ] 11.1 Mark all task checkboxes [x] + AC checkboxes [x] in this story file.
  - [ ] 11.2 Set Status: review (per BMAD flow; code review can validate post-ship though it's largely a formality at release ship).
  - [ ] 11.3 Update `_bmad-output/implementation-artifacts/sprint-status.yaml`: v63-5b-3: in-progress → review (or done if skipping code review). v63-epic-5b: in-progress → done. last_updated narrative updated.
  - [ ] 11.4 Move I96 backlog entry from `convoke-note-initiative-lifecycle-backlog.md` Fast Lane → §2.5 Completed (per Decision 6) with shipped-at date.
  - [ ] 11.5 If operator runs `/bmad-code-review` post-ship: convergence rule applies (R1 mandatory if HIGH; release ship is committed at this point so R1 patches would be 4.0.1 patch-level only).

## Dev Notes

**Decision rationales (compact):** D1 = release-time-deferred per dependency chain (4.3 + 4.5 + zero-blockers + 1B.x decision); D2 = playbook completion sequence (4 markers + frontmatter + STATUS preamble removal); D3 = maintainer CHANGELOG sign-off in release commit MESSAGE per FR44 strict reading; D4 = release ship sequence per arch:455 + M-criteria order; D5 = Stories 1B.x deferral default = ship-without (operator can override per OP-1 + OP-2 honest-deferral); D6 = I96 anti-pattern registry consultation discipline embedded in playbook §(e) Known Pitfalls per Story 5B.2 retrospective backlog entry.

**Anti-patterns to avoid in this story (top 5; imperative):**
- ✗ DON'T proceed to Tasks 1+ if Task 0 pre-flight gates FAIL (Decision 1 anti-pattern guard — release-time-deferred status is load-bearing).
- ✗ DON'T put maintainer CHANGELOG sign-off line inside CHANGELOG.md prose body — FR44 specifies "release commit message" (Decision 3 anti-pattern guard).
- ✗ DON'T skip Winston sign-off — M13 ship-blocking criterion requires recorded Winston sign-off (Decision 2 step 3).
- ✗ DON'T `npm publish` BEFORE git tag exists + commit pushed — npm-published is the immutable record; rollback is destructive (Decision 4 sequence).
- ✗ DON'T silently defer Stories 1B.x — OP-2 says deferral is allowed; silent deferral is not (Decision 5 anti-pattern guard).

**External dependencies + risk (compact):**

| ID | Risk | Mitigation |
|----|------|-----------|
| PR1 | Story 4.3 + 4.5 blocked by 4.0 candidate availability | Decision 1 release-time-deferred framing; Task 0 gates explicit |
| PR2 | npm publish 2FA failure or registry availability | Task 9.1 operator-interactive; retry; if persistent, halt + escalate npm support |
| PR3 | GitHub release creation post-tag mismatch | Task 10.1 uses tag explicitly; verify release URL post-create |
| PR4 | Smoke test post-publish reveals migration regression | Task 10.2 — if regression, ship 4.0.1 patch; Decision 4 inversion handler covers this |
| PR5 | Stories 1B.x deferral note omitted from CHANGELOG | Decision 5 + Task 6.5 explicit; OP-2 enforcement |
| PR6 | Marketplace metadata drift between 4.0.0 publish + Story 3.3 PR #9 OPEN state | Task 10.3 re-validates marketplace.json post-publish; PR #9 stays OPEN per OP-4 (not ship-blocking); operator monitors PR #9 separately |
| PR7 | `outline_complete: false` semantics confusing | Decision 2 explicit comment in playbook; future-maintainer reads frontmatter convention |
| PR8 | Re-run grep tests fail post-Story-5B.1 (cliché creeps in via 1B.x deferral note language) | Task 6.3 mandatory; if fail, remediate language before tag |

**OS-1 — release commit + tag + push are coordinated; failure mid-sequence is recoverable but messy.** If git push succeeds but `npm publish` fails: tag is published on GitHub but npm doesn't have 4.0.0 — recover by retrying `npm publish` (tag stays valid). If `npm publish` succeeds but GitHub release creation fails: rare — recover by retrying `gh release create`. If git tag wasn't pushed before npm publish: operator MUST push tag before publish completion to keep state coherent. Mitigation: Task 8.6 explicitly pushes commit + tag BEFORE Task 9 npm publish.

**OS-2 — release commit message format.** Per BMAD project commit conventions + Convoke project memory (Co-Authored-By footer policy): release commit message structure:
```
Convoke 4.0.0 — host_framework_sync release for BMAD v6.3 adoption

<short release summary; 1-3 sentences from CHANGELOG mostHonestOneLineSummary>

Maintainer sign-off (CHANGELOG per FR44+M16): Amalik <YYYY-MM-DD>
Winston sign-off (host_framework_sync playbook per FR45 + M13): <YYYY-MM-DD>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Spike points:** None.

**Apply Epic 3 retro action items:**
- **PI-8 (empirical-probe option-0):** Task 0 pre-flight gates ARE the empirical probe — verify state before any patches.
- **PI-9 (`${PIPESTATUS[0]}`):** N/A — no shell pipelines requiring exit-code capture in this story (the grep tests at Task 6.3 use plain `grep -nE` without piping; exit code 1 = no matches expected).
- **PI-10 (Edge Case Hunter):** code-review at story close MUST include Edge Case Hunter verification of (a) all 4 TODO-5B3 markers absent from final playbook + CHANGELOG, (b) frontmatter convention applied correctly, (c) release commit message contains both sign-off lines.
- **PI-11 (DEF-SPIKE inversion handling):** N/A — no DEF-SPIKEs scheduled.
- **PI-12 (spec spot-check rubric audit):** AC1-AC6 each pin verifiable assertions.

**Inheritance from prior stories:**
- Story 5A.2: playbook outline shape + STATUS preamble convention + frontmatter `winston_signoff_status` field — all become finalization targets at this story.
- Story 5B.1: CHANGELOG mostHonestOneLineSummary verbatim + grep-tests + sign-off marker pattern + grep-evidence re-verification commands — Story 5B.3 re-runs the grep tests at AC2.
- Story 5B.2: anti-pattern registry as data source for §(e) + I96 backlog entry as Decision 6 driver + retrospective findings as input.
- Story 4.3 + 4.4 + 4.5: validation battery infrastructure cited at §(d).
- Story 3.3 marketplace PR + Story 3.1 marketplace.json: invariant preserved at AC4 post-publish smoke test.

**Story 5B.3 closes Epic 5B 3/3** + closes v6.3 BMAD adoption initiative. v6.3 progress at story close: 23 stories shipped (Story 5B.3 = 23rd, assuming Stories 1B.x deferred per Decision 5 default; if 1B.x ships, count goes to 26/28 with deferred-by-design 1B.x edge case).

**TI-9 cron-durability:** N/A.

**Scope guardrails for V-pass:** if V-pass questions Decision 5 (1B.x ship-vs-defer): operator decides at Task 0.6, NOT at spec time. If V-pass suggests adding tests: DEFER (Story 5B.3 adds 0 tests; the Stories 4.3 + 4.5 it depends on may add tests). If V-pass suggests the playbook §(d) needs more detail than currently scoped: defer to operator at Task 2 — current scope is 1 paragraph + 1 invocation paragraph; expansion is operator-discretionary at execution time.

**Hand-off marker contract closure pattern.** This story is the culmination of the 4 TODO-5B3 markers planted by Stories 5A.2 + 5B.1. The grep `grep -rn "TODO-5B3" docs/ CHANGELOG.md` at Task 0.3 must surface exactly 4 markers (3 in playbook L123/L131/L144 + 1 in CHANGELOG.md:8). At Story 5B.3 close, the same grep must return ZERO results (Task 5.4 + Task 6.4 verify). Anti-vapor anchor: if any marker remains post-Story-5B.3, story is NOT done.

## Change Log

- 2026-04-27 — V-pass batch-applied **13 improvements** (5 critical + 5 enhancement + 2 optimization + 1 LLM-opt) via spec-rewrite. **Empirical probes 11/13 PASS + 2 CAUGHT-DEFECT** (TODO-5B3 marker count + sprint count drift caught). **CM-1:** TODO-5B3 marker count corrected to 4 (3 playbook + 1 CHANGELOG L8 ONLY; earlier "L1 + L8 = 2 instances" claim was wrong); empirical-baseline + AC2 + Task 6.4 + closure pattern updated. **CM-2:** sprint count at story-creation corrected 23/28 → 22/28 (Story 5B.3 not shipped yet at creation; close-time count of 23/28 stays correct). **CM-3:** Decision 5 + Task 0.4 augmented with empirical note that 1B.x specs DON'T EXIST yet; ship-with-1B.x requires bootstrapping 3 specs + V-pass + dev-story + code-review for each (~6-8 hours) BEFORE Story 5B.3 resumes. **CM-4:** AC4 + Task 10.3 augmented with `.claude-plugin/marketplace.json:12` version-field sync verification (pre-set at "4.0.0" by Story 3.1; verify post-package.json-bump that both fields match). **CM-5:** drift threshold T = 4.0 explicit value embedded in Decision 2 step 1 + Task 2.2 (verbatim from `convoke-arch-bmad-v6.3-adoption.md:362` — "equivalent behavior, minor phrasing changes"). **EO-1:** Task 10.1 awk command replaced with portable sed-based approach (macOS BSD `head -n -1` doesn't support negative arg). **EO-2:** §(d) §(d) reference plan if PF1 fails post-publish (ship 4.0.1 patch; do not silent-correct). **EO-3:** Task 4.2 Winston review framing clarified (one-shot architectural sign-off review, NOT a `/bmad-code-review` convergence-rule-bound round). **EO-4:** AC4 explicit marketplace.json sync verification (paired with CM-4). **EO-5:** Task 10.5 (new) — post-publish leave PR #9 ship-comment per OP-4 framing. **OS-1:** Decision 4 15-step sequence visually grouped into 5 phases (Pre-flight / Documentation / Commit / Publish / Verification). **OS-2:** Task 8.4 release-commit HEREDOC template embedded inline (not just OS-2 dev-note ref). **LL-1:** Task 0 compressed 9 → 6 sub-tasks (~30% token savings; 0.1+0.2 merged → "4.3+4.5 done with M9+M17 PASS"; 0.7+0.8 merged → "npm test + integration baselines"). **V-pass ROI:** prevented 2 count-drift defects (CM-1 + CM-2 same off-by-one pattern as Story 5B.2 R1 CR-H2) + tightened 1B.x dependency surface (CM-3) + closed marketplace.json sync gap (CM-4) + made drift threshold T value self-contained (CM-5) + macOS portability (EO-1) + closed PR #9 loop (EO-5). Final spec: 6 ACs + 6 Decisions + 11 Tasks (Task 10 expanded to 5 subtasks for EO-5) + 8 PR risks. Story remains ready-for-dev (release-time-deferred per Decision 1).
- 2026-04-27 — Story 5B.3 created via `/bmad-create-story v63-5b-3`. **Third and FINAL Epic 5B story.** 6 ACs + 6 Decisions + 11 Tasks + 8 PR risks. Release-coordination + documentation-completion shape. **Release-time-deferred** (execution gated on Stories 4.3 + 4.5 closing + 4.0 candidate ready + deferred-work zero-blockers + 1B.x deferral decision per Decision 5). 0 NEW files (this story only); 5 MODIFIED at execution time + 3 EXTERNAL system actions (git tag + npm publish + GitHub release). Decision 1: release-time-deferred per dependency chain (anti-pattern guard at Task 0). Decision 2: playbook completion = §(d) + §(e) + Winston sign-off + frontmatter `winston_signoff_status: signed-off` + STATUS preamble removed. Decision 3: maintainer CHANGELOG sign-off in release commit MESSAGE per FR44 strict reading (NOT in CHANGELOG.md prose body). Decision 4: release ship sequence per arch:455 + M-criteria — pre-flight → playbook complete → grep tests → date stamp → version bump → commit with both sign-offs → tag → push → npm publish → GitHub release → smoke test → close. Decision 5: Stories 1B.x deferral default = ship-without per OP-1 maintainer bandwidth + OP-2 honest-deferral; operator can override at Task 0.6. Decision 6: I96 anti-pattern registry consultation discipline embedded in playbook §(e) per Story 5B.2 retrospective backlog entry — closes L1 falsification surface from "operator must remember" to "playbook surface enforces." Inheritance: Stories 5A.2 + 5B.1 + 5B.2 hand-off contracts (4 TODO-5B3 markers all resolve here); Story 4.3 + 4.4 + 4.5 validation battery infrastructure cited at §(d); Story 3.1 + 3.3 marketplace invariants preserved at AC4 post-publish smoke test. v6.3 progress at story creation: 22/28 stories shipped (CM-2 V-pass empirical verification — Story 5B.3 not shipped yet at creation; close-time count is 23/28). 3 ready-for-dev (Stories 4.3 + 4.5 + 5B.3 — all release-time-deferred); 3 backlog (Stories 1B.x — deferral pending per Decision 5). **Recommend V-pass** before dev-story execution given coordination surface (4 marker resolutions + tag + publish + smoke test) + ship-blocking M-criteria (M9 + M13 + M16 + M17) + 8 PR risks + Decision 1 release-time-deferred framing.

## Dev Agent Record

### Agent Model Used

(set at dev-story start)

### Debug Log References

### Completion Notes List

### File List
