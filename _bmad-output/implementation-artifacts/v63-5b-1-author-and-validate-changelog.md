---
initiative: convoke
artifact_type: story
qualifier: v63-5b-1-author-and-validate-changelog
created: '2026-04-27'
schema_version: 1
epic: v63-epic-5b
---

# Story 5B.1: Author and validate CHANGELOG

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 5B — Release Communication & Learning](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-5b-release-communication-learning) (FIRST story; auto-transitions epic backlog → in-progress).
**Sprint:** 5 (Release Communication stream — buildable retrospectively now per Story 5A.1 + 5A.2 pattern; release-date stamp + maintainer-sign-off-in-commit-message are release-time activities, but CHANGELOG content authoring is buildable now).
**FR coverage:** FR41 (CHANGELOG contains `mostHonestOneLineSummary` verbatim + Sophia's section structure), FR42 (CHANGELOG grep-tested against cliché list — zero violations), FR43 (no `internalOnly` phrases in user-facing text), FR44 (maintainer sign-off recorded in release commit message).
**M coverage:** M16 (CHANGELOG with verbatim mostHonestOneLineSummary + Sophia section order + zero cliché violations + maintainer sign-off in commit message).
**Failure modes addressed:** S2 (dual-framing discipline failure — `internalOnly` phrases bleeding through to user-facing CHANGELOG → falsifies innovation-novel-patterns.md L52-55 hypothesis); P-CHGLOG-1 (Sprint 5 release announcement reads as feature-launch hype rather than honest maintenance — counters Sophia's PR2-5 framing).

**Why this story is BUILDABLE NOW (NOT release-time-deferred):** Sophia's announcement draft is canonical at `_bmad-output/planning-artifacts/convoke-announcement-4.0-draft.md` (2026-04-11; Sophia's voice; user-facing vocabulary verified); cliché list + `internalOnly` regex are pinned in the draft + PRD; migration guide exists at `docs/migration/3.x-to-4.0.md` (Story 1A.6 done); existing `CHANGELOG.md` at repo root has a marker HTML comment from Story 1A.6 hand-off awaiting 5B.1 v4.0 section composition; v6.3 stream ships are 21/29 done with concrete deliverables to summarize. Release-time activities deferred per Decision 5: (a) actual release date stamp (operator fills in at ship time); (b) maintainer sign-off recorded in release commit message (FR44 — happens at the release commit, NOT at story-close).

**Why pure-docs / no-code story-shape:** Story 5B.1 is documentation authoring + grep-testable validation. ZERO code, ZERO unit tests, ZERO new dependencies. The grep tests (FR42 + FR43) are bash one-liners executed by the operator at story-close + re-run at release commit time; they're not automated CI gates per current scope (matches Story 5A.1 + 5A.2 procedural pattern).

**Upstream dependencies:**
- **Sophia's announcement draft (CANONICAL voice + cliché list + internalOnly regex):** [`_bmad-output/planning-artifacts/convoke-announcement-4.0-draft.md`](../planning-artifacts/convoke-announcement-4.0-draft.md). Cliché list = 8 phrases; internalOnly regex provided in draft "Vocabulary rules enforced" section.
- **PRD canonical mostHonestOneLineSummary:** verbatim text per `convoke-prd-bmad-v6.3-adoption/user-journeys.md:9` + `executive-summary.md:40` references — full quote: *"Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD evolves and adds marketplace distribution for reach."*
- **Existing CHANGELOG.md** at repo root with v3.3.0 entry shipped + marker HTML comment from Story 1A.6 hand-off ("when Story 5B.1 authors the 4.0 section, include: 'See [migration guide](docs/migration/3.x-to-4.0.md) for upgrade instructions.' Per Story v63-1a-6 AC5"). Story 5B.1 PREPENDS the v4.0 section ABOVE v3.3.0.
- **Migration guide:** [`docs/migration/3.x-to-4.0.md`](../../docs/migration/3.x-to-4.0.md) (Story 1A.6 done; 43 LOC user-facing).
- **Story 5A.1 Sprint 1 experiments:** [`convoke-note-sprint-1-experiments.md`](../planning-artifacts/convoke-note-sprint-1-experiments.md) (3 PASS verdicts informing CHANGELOG's behavioral-equivalence framing).
- **Stories 1A/2/3/4.1/4.2/4.4/5A**: shipped v6.3 deliverables to summarize in v4.0 CHANGELOG entries.
- **Story 1A.6 Round 1 hand-off comment in CHANGELOG.md:** dictates migration-guide link inclusion per Story 1A.6 AC5.

**Downstream consumers:**
- **Convoke 4.0 release ship gate** — CHANGELOG is one of the load-bearing release artifacts (alongside Story 4.3 release record + Story 4.5 N=1 validation report + Story 5B.3 completed playbook).
- **GitHub release notes** — CHANGELOG content is published to the GitHub release page (per Sophia's draft "Publish to: npm CHANGELOG, GitHub release notes, Convoke README section").
- **`convoke-update` "What's New" stdout** — `scripts/update/lib/changelog-reader.js` (Story U7 / 3.3.0 release) parses CHANGELOG entries; Story 5B.1's v4.0 section will surface in operator's upgrade-time stdout.
- **Story 5B.2 retrospective** — CHANGELOG content informs retro framing (release-shipped vs internal-only narratives).
- **Story 5B.3 release ship** — CHANGELOG must be finalized + maintainer-sign-off-in-commit per FR44 before release tagged.

**Namespace decision:** all artifacts under `_bmad-output/implementation-artifacts/v63-5b-1-*` (story spec + grep-test evidence file) + repo-root `CHANGELOG.md` modification (existing user-facing artifact). NOT in `_bmad/bme/` — covenant-compliance-checklist N/A.

## Story

As Convoke maintainer (Amalik) closing Epic 5B Sprint 5,
I want **the v4.0 section authored at the top of `CHANGELOG.md` containing the canonical `mostHonestOneLineSummary` verbatim per FR41 + Sophia's narrative flow + Keep-a-Changelog Added/Changed/Removed structure summarizing v6.3-stream deliverables + zero cliché-list violations per FR42 + zero `internalOnly` phrases per FR43 + a documented maintainer-sign-off process for the release commit per FR44**,
so that M16 ship-blocking criterion is met with verifiable grep-testable evidence + existing users (Priya from User Journey 1) get an honest 3-sentence summary that matches what 4.0 actually delivers + the dual-framing discipline hypothesis (innovation-novel-patterns.md S2) is verifiable post-ship.

**Story shape:** **pure documentation / Sophia-faithful authoring + grep-testable validation / buildable-now.** ZERO code, ZERO tests, ZERO new dependencies. ~1-2 hours operator time (most of which is summarizing 21 shipped stories into Sophia's voice + running grep tests). 2 NEW markdown files + 2 MODIFIED.

**Empirical baseline (probed 2026-04-27):**

| Probe | Result | Spec impact |
|-------|--------|-------------|
| Sophia's announcement draft exists + canonical | ✓ — `convoke-announcement-4.0-draft.md` 2026-04-11 with full cliché list (8 phrases) + internalOnly regex in "Vocabulary rules enforced" + Publication Checklist | Decision 1 quotes draft verbatim for narrative flow |
| `mostHonestOneLineSummary` canonical text | ✓ — quoted verbatim in `user-journeys.md:9` + cited in `executive-summary.md:40` | Decision 2 mandates verbatim placement at TOP of v4.0 section |
| Existing `CHANGELOG.md` state | ✓ — v3.3.0 entry shipped 2026-04-19; Story 1A.6 hand-off HTML comment near top awaiting v4.0 section | Decision 3 PREPENDS v4.0 ABOVE v3.3.0; HTML comment removed once v4.0 section authored |
| Migration guide present | ✓ — `docs/migration/3.x-to-4.0.md` 43 LOC user-facing (Story 1A.6 done) | AC4 mandates migration-guide link per Story 1A.6 AC5 hand-off |
| v6.3 stream shipped stories | ✓ — 21/29 stories shipped + 2 release-time-deferred | AC2 narrative covers 21 shipped + acknowledges PF1 + N=1 release-time activities |
| `convoke-update` "What's New" parser | ✓ — `scripts/update/lib/changelog-reader.js` exists (U7/3.3.0 release) | NFR consideration — v4.0 entry must parse cleanly via Keep-a-Changelog headers |
| Cliché list + internalOnly regex grep-testable | ✓ — single regex covers 8 cliché phrases + 6 internalOnly terms; bash one-liner viable | Decision 4 grep-test commands pinned |
| `npm test` baseline post-Story-5A.2 | ✓ — `tests 1492 / pass 1491 / skip 1 / fail 0` | Unchanged (Story 5B.1 adds 0 tests) |

## Acceptance Criteria

### Decisions (pinned at spec-author time; defensible at dev-time)

**Decision 1 — Sophia-faithful narrative flow.** v4.0 CHANGELOG entry's prose follows the announcement draft's narrative arc verbatim where possible: (1) mostHonestOneLineSummary at TOP per FR41, (2) "spent the last few weeks making Convoke healthy enough to last" maintenance framing, (3) multi-channel install (BMAD plugin + Claude Code skill pack + Copilot/Cursor adapters), (4) single-command auto-migration for existing users, (5) behavioral equivalence testing ("we actually test whether your agents behave the same way after the upgrade"), (6) "if this release does its job, you'll barely notice it — which is the point" closing. Each Sophia-flow element maps to a Keep-a-Changelog subsection (Decision 3); the prose lead is BEFORE the subsections.

**Decision 2 — `mostHonestOneLineSummary` at TOP, verbatim.** Per FR41 + M16, the canonical sentence ("Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD evolves and adds marketplace distribution for reach.") appears as the FIRST prose line of the v4.0 section, AFTER the `## [4.0.0] - YYYY-MM-DD` header but BEFORE any subsection. Verbatim = character-identical (em-dashes preserved if present; quoted vs unquoted decided by markdown context). **Anti-pattern:** any rewording — even minor — falsifies the FR41 grep test. Story 5A.2 CR-M5 R1 precedent applied: "verbatim" framing is load-bearing.

**Decision 3 — Keep-a-Changelog Added/Changed/Removed structure, summarizing v6.3 stream into user-facing voice.** Subsections follow existing `CHANGELOG.md` v3.3.0 format (Added / Changed / Fixed / Documentation). Story 5B.1 entries are Sophia-voice user-facing summaries — NOT story-by-story recaps. Examples (operator finalizes at dev-time):
- **Added:** Multi-channel install (BMAD plugin marketplace + Claude Code + Copilot + Cursor adapters); behavioral equivalence validation post-upgrade; single-command auto-migration via `convoke-update`; `convoke-doctor` BMM-dependency surfacing.
- **Changed:** BMAD METHOD compatibility v6.3.0 adopted; agent skills delivered as canonical SKILL.md format throughout.
- **Removed:** `bmad-init` skill (deprecated; functionality moved into the upgrade tool).
- **Documentation:** Migration guide at `docs/migration/3.x-to-4.0.md` per Story 1A.6.
**Anti-pattern:** subsection entries that name internal artifacts (e.g., "PF1 validation cycle", "host_framework_sync", "Sprint 1 experiments", "strategic-bet ADR") — these are `internalOnly` per FR43 and would fail the grep test.

**Decision 4 — Two grep-tests at story-close (pre-ship verification per FR42 + FR43).** Operator runs both commands at Task 4 + captures output. **OS-1 V-pass scope-narrowing helper:** to verify ONLY the new v4.0 section (avoid false positives from older entries), extract section first via:
```bash
sed -n '/^## \[4\.0\.0\]/,/^## \[3\.3\.0\]/p' CHANGELOG.md > /tmp/v4.0-changelog-section.md
```
Then run grep against `/tmp/v4.0-changelog-section.md`. Both forms acceptable (full-file grep + scope-narrowed grep); evidence file captures whichever was used.

- **FR42 cliché-list grep** (8 phrases per Sophia's draft):
  ```bash
  grep -E '(Convoke 4\.0 is here|first-class community module|For the curious|opinionated downstream|content, not software|strategic bet on BMAD coupling|host_framework_sync|nothing flashy)' CHANGELOG.md
  ```
  Expected: zero matches in the new v4.0 section.
- **FR43 `internalOnly` grep** (per announcement draft regex):
  ```bash
  grep -E '(host_framework_sync|content, not software|strategic bet|first-class|opinionated downstream|first formal recognition|named reusable release class)' CHANGELOG.md
  ```
  Expected: zero matches in the new v4.0 section.
- **CM-1 V-pass dual-classification note:** `opinionated downstream` appears in BOTH the FR42 cliché regex AND the FR43 internalOnly regex. The announcement draft's "Vocabulary rules enforced" enumeration (lines 50-56) lists 6 phrases; the regex on line 61 covers 7 (adds `opinionated downstream`). This is intentional dual-classification — `opinionated downstream` is both a cliché (Shark Tank framing per PR2-5) and an internalOnly phrase (PRD `framingAnnotations.internalOnly` family). The spec inherits Sophia's regex faithfully; if any future revisions to the announcement draft add new phrases, operator updates spec regex correspondingly. Evidence file at `_bmad-output/implementation-artifacts/v63-5b-1-grep-evidence.md` per AC5 captures both outputs.

**Decision 5 — Maintainer sign-off DEFERRED to release-time commit message (FR44 explicit framing).** Story 5B.1 ships CHANGELOG content + grep-evidence. The maintainer sign-off recorded in the release commit message happens at Story 5B.3 release ship time (when the actual `git tag v4.0.0` + ship commit is authored). Story 5B.1 documents the sign-off process (template commit message line) in the Dev Notes for Story 5B.3 hand-off; the sign-off itself is NOT a Story 5B.1 deliverable. **Anti-pattern:** marking FR44 as MET at Story 5B.1 close — it's PARTIAL; full M16 closure requires Story 5B.3's release commit. **EO-1 V-pass marker-naming pattern (parallel to Story 5A.2 family):** Story 5A.2 introduced `<!-- TODO-5B3-SECTION-D -->`, `<!-- TODO-5B3-SECTION-E -->`, `<!-- TODO-5B3-SIGNOFF -->` for playbook hand-off (sections d+e + Winston playbook sign-off). Story 5B.1 adds `<!-- TODO-5B3-CHANGELOG-SIGNOFF: maintainer sign-off line in release commit message per FR44 + M16 -->` for the distinct maintainer-CHANGELOG-sign-off-in-commit-message hand-off. Both marker families share the `TODO-5B3-` prefix so Story 5B.3 author runs `grep -r "TODO-5B3"` (across `docs/` + `CHANGELOG.md`) to surface ALL pending hand-off items in one pass: 2 playbook sections + 1 Winston playbook sign-off + 1 maintainer CHANGELOG sign-off-in-commit = 4 pending blocks total at Story 5B.3 entry.

---

**AC1 — `CHANGELOG.md` v4.0 section exists at top of file with mostHonestOneLineSummary verbatim per FR41.**
**Given** Story 5B.1 dev-story start
**When** Tasks 1-2 complete
**Then**:
- `CHANGELOG.md` has a `## [4.0.0] - YYYY-MM-DD` header (date placeholder until release ship time per Decision 5).
- The next prose line is exactly: *"Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD evolves and adds marketplace distribution for reach."* (character-identical per Decision 2).
- The v4.0 section appears ABOVE the existing `## [3.3.0] - 2026-04-19` section (Story 1A.6 hand-off HTML comment removed; replaced by the v4.0 section).
- A `<!-- TODO-5B3-CHANGELOG-SIGNOFF -->` marker is present per Decision 5 hand-off.

**AC2 — v4.0 section narrative follows Sophia's flow per Decision 1 + summarizes 21 shipped v6.3 stories in user-facing voice per Decision 3.**
**Given** AC1 complete
**When** Task 2 narrative + subsections authored
**Then**:
- 1-2 paragraphs of Sophia-voice prose AFTER mostHonestOneLineSummary, AFTER the `## [4.0.0]` header, BEFORE the Added subsection. Covers Decision 1's 6 flow elements (maintenance framing → multi-channel install → single-command upgrade → behavioral-equivalence test → "barely notice it" closing).
- 4 Keep-a-Changelog subsections per Decision 3: **Added**, **Changed**, **Removed**, **Documentation**. Optional **Fixed** subsection if there are user-facing fixes worth surfacing (operator decides at dev-time).
- Each subsection contains 3-7 user-facing bullet entries summarizing the v6.3 stream's user-impact (NOT story-by-story; Sophia voice; no internal jargon).
- "We actually test whether your agents behave the same way after the upgrade" framing surfaces somewhere — either in the prose lead OR in an Added bullet — per innovation hypothesis I3 (PF1 + drift snapshots are the user-facing equivalence claim).

**AC3 — Migration guide link per Story 1A.6 AC5 hand-off.**
**Given** AC2 complete
**When** Task 2.4 runs
**Then**:
- The v4.0 section contains a markdown link `[migration guide](docs/migration/3.x-to-4.0.md)` somewhere in the prose lead OR in the Documentation subsection (operator chooses placement; both are valid).
- Link target verified to exist (Story 1A.6 done; file is 43 LOC).

**AC4 — Two grep-tests run + zero violations + evidence captured per Decision 4.**
**Given** AC1-AC3 complete
**When** Task 3 runs
**Then**:
- Operator runs FR42 cliché-list grep against `CHANGELOG.md` — zero matches in the v4.0 section.
- Operator runs FR43 `internalOnly` grep against `CHANGELOG.md` — zero matches in the v4.0 section.
- Both stdout outputs captured verbatim at `_bmad-output/implementation-artifacts/v63-5b-1-grep-evidence.md` (5-key frontmatter: `initiative`, `artifact_type: evidence`, `qualifier: v63-5b-1-grep-evidence`, `created`, `schema_version`; body has both commands + outputs + verdict line "Zero violations: M16 grep-tests PASS").
- If ANY violations found, Task 3.3 HALT for operator to revise CHANGELOG content + re-run grep.

**AC5 — Maintainer sign-off process documented for Story 5B.3 hand-off per Decision 5.**
**Given** AC4 grep-tests pass
**When** Task 4 runs
**Then**:
- `CHANGELOG.md` has `<!-- TODO-5B3-CHANGELOG-SIGNOFF: maintainer sign-off line in release commit message per FR44 + M16 -->` marker near top (above the v4.0 section header OR in v4.0 frontmatter region).
- This story's Dev Notes section documents the sign-off template: release commit message must include line `Maintainer sign-off (CHANGELOG per FR44+M16): Amalik <YYYY-MM-DD>`.
- AC5 verdict at Story 5B.1 close: M16 PARTIAL (CHANGELOG content + grep-tests verified; sign-off recorded at Story 5B.3 release commit).

**AC6 — Validation gates green + scope discipline.**
- [ ] 6.1 `npm test` baseline 1492/1491/1/0 unchanged (Story 5B.1 adds 0 unit tests).
- [ ] 6.2 `npm run test:integration` baseline 93/93/0 unchanged.
- [ ] 6.3 `npm run lint` clean (no JS).
- [ ] 6.4 `git status --porcelain` confirms scope (2 NEW + 2 MODIFIED per AC7).

**AC7 — Scope discipline.**
- IN scope (NEW files):
  - This story file.
  - `_bmad-output/implementation-artifacts/v63-5b-1-grep-evidence.md` (Task 3 grep outputs evidence).
- IN scope (MODIFIED):
  - `CHANGELOG.md` — PREPEND v4.0 section above v3.3.0; remove Story 1A.6 hand-off HTML comment; add `<!-- TODO-5B3-CHANGELOG-SIGNOFF -->` marker.
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions + `last_updated` narrative.
  - This story file (Tasks/Subtasks checkboxes + Dev Agent Record + File List + Change Log + Status).
- MUST NOT touch: Sophia's announcement draft (frozen — only cite); PRD shards (frozen — only link); existing v3.3.0 CHANGELOG section (frozen — leave intact below v4.0); migration guide (Story 1A.6 frozen — only link); any code; any test files; any `_bmad/` files.
- **EO-1 escape hatch:** if at dev-time the v4.0 release date is known + user wants to ship CHANGELOG + commit at the same time, operator can populate the date placeholder + finalize the sign-off line in commit message in one pass — no harm done; just collapses Decision 5's two-phase pattern into one. Default flow stays date-placeholder + Story 5B.3 release-time sign-off.

## Tasks / Subtasks

- [ ] **Task 0: Pre-flight gates.**
  - [ ] 0.1 Confirm Sophia's announcement draft present at `_bmad-output/planning-artifacts/convoke-announcement-4.0-draft.md`; cliché list (8 phrases) + internalOnly regex extractable.
  - [ ] 0.2 Confirm migration guide present at `docs/migration/3.x-to-4.0.md` (Story 1A.6 done; 43 LOC).
  - [ ] 0.3 Confirm `CHANGELOG.md` at repo root has v3.3.0 entry + Story 1A.6 hand-off HTML comment near top.
  - [ ] 0.4 Confirm `npm test` baseline 1492/1491/1/0.

- [ ] **Task 1: Read inputs (~10 min).**
  - [ ] 1.1 Read announcement draft fully — capture mostHonestOneLineSummary verbatim, narrative flow, cliché list, internalOnly list.
  - [ ] 1.2 Read migration guide briefly — confirm path + 1-line summary for Documentation subsection cite.
  - [ ] 1.3 Skim Story 5A.1 Sprint 1 experiments artifact — confirm 3 PASS verdicts framing for behavioral-equivalence claim.
  - [ ] 1.4 Skim sprint-status.yaml — confirm 21 shipped v6.3 stories + 2 release-time-deferred (4.3 + 4.5) for AC2 framing.

- [ ] **Task 2: Author v4.0 CHANGELOG section (~30-45 min).**
  - [ ] 2.1 Open `CHANGELOG.md`; locate Story 1A.6 hand-off HTML comment near top (lines 9-12 currently); REMOVE it.
  - [ ] 2.2 Add `## [4.0.0] - YYYY-MM-DD` header above v3.3.0; populate date as placeholder (operator fills at release ship time per Decision 5).
  - [ ] 2.3 Author 1-2 paragraphs of Sophia-voice prose AFTER `## [4.0.0]` header per Decision 1 + AC2; lead with mostHonestOneLineSummary verbatim per Decision 2 + AC1.
  - [ ] 2.4 Add markdown link `[migration guide](docs/migration/3.x-to-4.0.md)` per Story 1A.6 AC5 + AC3 (operator chooses placement: prose OR Documentation subsection).
  - [ ] 2.5 Author 4 Keep-a-Changelog subsections per Decision 3 + AC2 (**Added** / **Changed** / **Removed** / **Documentation**; optional **Fixed**). Each 3-7 bullets summarizing v6.3 stream user-impact in Sophia voice.
  - [ ] 2.6 Add `<!-- TODO-5B3-CHANGELOG-SIGNOFF: maintainer sign-off line in release commit message per FR44 + M16 -->` marker near top of CHANGELOG.md per AC5 + Decision 5.

- [ ] **Task 3: Run grep-tests + capture evidence (~10 min).**
  - [ ] 3.1 Run FR42 cliché-list grep per Decision 4. Capture output verbatim.
  - [ ] 3.2 Run FR43 `internalOnly` grep per Decision 4. Capture output verbatim.
  - [ ] 3.3 If ANY violations in either grep, HALT — revise v4.0 section content; re-run greps until zero violations.
  - [ ] 3.4 Author `_bmad-output/implementation-artifacts/v63-5b-1-grep-evidence.md` with 5-key frontmatter + body containing both commands + outputs + verdict line per AC4.

- [ ] **Task 4: Document maintainer sign-off process for Story 5B.3 hand-off (~5 min).**
  - [ ] 4.1 In this story's Dev Notes (or as a separate paragraph in Completion Notes List), record the release-commit-message sign-off template: `Maintainer sign-off (CHANGELOG per FR44+M16): Amalik <YYYY-MM-DD>`.
  - [ ] 4.2 Verify the `<!-- TODO-5B3-CHANGELOG-SIGNOFF -->` marker per Task 2.6 is in place — Story 5B.3 author runs `grep -r "TODO-5B3" CHANGELOG.md` to surface the pending sign-off.

- [ ] **Task 5: Validation gates (AC6).**
  - [ ] 5.1 `npm test` — baseline 1492/1491/1/0 unchanged.
  - [ ] 5.2 `npm run test:integration` — baseline 93/93/0 unchanged.
  - [ ] 5.3 `npm run lint` — clean (no JS).
  - [ ] 5.4 `git status --porcelain` — confirms AC7 scope: 2 NEW (story + grep-evidence) + 2 MODIFIED (CHANGELOG + sprint-status).

## Dev Notes

**Decision rationales (compact):** D1 = Sophia-faithful narrative flow (announcement draft is canonical voice); D2 = mostHonestOneLineSummary at TOP verbatim (FR41+M16 grep-test load-bearing); D3 = Keep-a-Changelog Added/Changed/Removed/Documentation subsections (matches existing `CHANGELOG.md` v3.3.0 format); D4 = two grep-tests with output-captured evidence per FR42+FR43+M16; D5 = maintainer sign-off deferred to Story 5B.3 release commit per FR44 strict reading.

**Anti-patterns to avoid (top 5; imperative):**
- ✗ DON'T paraphrase mostHonestOneLineSummary → Decision 2 + AC1 require character-identical placement (FR41 grep-test load-bearing).
- ✗ DON'T name internal artifacts in CHANGELOG entries (e.g., "PF1 validation cycle", "host_framework_sync", "Sprint 1 experiments", "strategic bet ADR") → FR43 `internalOnly` grep-test fails immediately.
- ✗ DON'T skip the cliché list grep at story-close → FR42 + M16 contract requires evidence captured (AC4 + Task 3.4).
- ✗ DON'T mark FR44 MET at Story 5B.1 close → Decision 5 explicit: sign-off is release-commit-time at Story 5B.3 (M16 PARTIAL until 5B.3 ships).
- ✗ DON'T forget the migration-guide link → Story 1A.6 hand-off explicit + AC3 mandatory.

**External dependencies + risk (compact):**

| ID | Risk | Mitigation |
|----|------|-----------|
| PR1 | Sophia's announcement draft drifts (e.g., new cliché added post-spec) | Operator re-fetches at dev-time + diffs against this spec's cliché list (8 phrases) |
| PR2 | mostHonestOneLineSummary text changes in PRD | Decision 2 mandates verbatim quote at dev-time from canonical source (`user-journeys.md:9`) |
| PR3 | `internalOnly` regex insufficient (new internal phrases coined post-spec) | FR43 grep-test catches regex-matched phrases; operator audits CHANGELOG content prose against announcement draft's full vocabulary rules |
| PR4 | Operator forgets to remove Story 1A.6 hand-off HTML comment | Task 2.1 explicit; AC1 verifies absence |
| PR5 | Maintainer sign-off skipped at release commit (FR44 violation) | TODO-5B3 marker + Story 5B.3 grep workflow surfaces it |

**Spike points:** None.

**Apply Epic 3 retro action items:**
- **PI-9 (`${PIPESTATUS[0]}`):** N/A — no shell pipelines.
- **PI-10 (Edge Case Hunter):** code-review at story close MUST include Edge Case Hunter layer (markdown structure + grep-test correctness + cross-reference to migration guide + cliché-list completeness).
- **PI-11 (DEF-SPIKE inversion handling):** N/A — no spikes.
- **PI-12 (spec spot-check rubric audit):** AC1-AC7 each pin verifiable assertions.

**Inheritance from prior stories:**
- Story 5A.1 + 5A.2: pure-documentation shape; cite-existing-evidence pattern (Sophia's draft is the canonical source); buildable-now NOT release-time-deferred.
- Story 5A.2 CR-M5 R1: "verbatim" framing is load-bearing (applies here for mostHonestOneLineSummary).
- Story 5A.2 CM-2: HTML-comment grep-marker pattern (`<!-- TODO-5B3-CHANGELOG-SIGNOFF -->` here mirrors `<!-- TODO-5B3-SECTION-D -->` etc.).
- Story 1A.6: CHANGELOG.md hand-off comment + migration guide link contract honored.

**Story 5B.1 closes Epic 5B's first slot** (1/3) — Story 5B.2 (retrospective + anti-pattern registry) + Story 5B.3 (playbook completion + release ship) are next. v6.3 progress: 21 → 22/29 stories shipped on close.

**TI-9 cron-durability:** N/A — no scheduled actions.

**Scope guardrails for V-pass:** if V-pass questions Decision 5 deferral of FR44 → spec is correct (FR44 wording: "release commit message" — that's release ship time, not story close). If V-pass suggests adding automated CI grep-test for FR42+FR43 → DEFER (Decision 4 grep-tests are operator-run + evidence-captured; CI-automation is a future hardening story per Story 5B.2 retrospective input). If V-pass surfaces a missing cliché phrase → operator adds to Sophia's announcement draft + spec + grep regex (it's intentionally not pre-frozen).

**Maintainer sign-off template (per Decision 5 + AC5; Story 5B.3 hand-off):**
```
Maintainer sign-off (CHANGELOG per FR44+M16): Amalik <YYYY-MM-DD>
```
This line MUST appear in the release commit message body when Story 5B.3 ships v4.0.0. The grep verification post-ship: `git log -1 --format=%B v4.0.0 | grep -E '^Maintainer sign-off \(CHANGELOG per FR44\+M16\):'` must return exactly 1 match.

## Change Log

- 2026-04-27 — V-pass batch-applied **3 improvements** (1 critical + 1 enhancement + 1 optimization + 0 LLM-opt) via spec-rewrite. **Empirical probes 12/12 PASS** (1 caught defect lives in upstream source — Sophia's announcement draft enumeration is incomplete vs its own grep regex; spec inherits regex faithfully). **CM-1 V-pass:** Decision 4 dual-classification note added — `opinionated downstream` appears in BOTH FR42 cliché regex AND FR43 internalOnly regex (announcement draft enumeration lists 6 phrases but regex covers 7; spec preserves Sophia's regex faithfully + documents the dual-classification rationale). **EO-1 V-pass:** marker renamed `<!-- TODO-5B3-SIGNOFF-COMMIT -->` → `<!-- TODO-5B3-CHANGELOG-SIGNOFF -->` for parallel structure with Story 5A.2's family pattern (`-SECTION-D` / `-SECTION-E` / `-SIGNOFF` for playbook → adds `-CHANGELOG-SIGNOFF` for CHANGELOG; both share `TODO-5B3-` prefix so Story 5B.3 author runs `grep -r "TODO-5B3"` across `docs/` + `CHANGELOG.md` to surface 4 pending blocks total: 2 playbook sections + 1 Winston playbook sign-off + 1 maintainer CHANGELOG sign-off-in-commit). **OS-1 V-pass:** Decision 4 grep-scope-narrowing helper added — `sed -n '/^## \[4\.0\.0\]/,/^## \[3\.3\.0\]/p' CHANGELOG.md` extracts only the v4.0 section before grep, avoiding false positives from older entries; full-file grep also acceptable. **V-pass ROI:** prevented 1 upstream-source clarity gap (CM-1 dual-classification surfaced) + tightened 1 hand-off-discoverability convention (EO-1 marker-naming) + 1 grep-test ergonomics improvement (OS-1 scope-narrowing). Final spec: 7 ACs + 5 Decisions + 5 Tasks + 5 PR risks. Story remains ready-for-dev. Lower ROI than Story 4.3's 8/10 empirical-probe defect catch (clean spec — second consecutive 12/12 PASS with mostly-refinement findings); appropriate for pure-doc Sophia-fidelity story shape.
- 2026-04-27 — Story 5B.1 created via `/bmad-create-story v63-5b-1`. **First Epic 5B story** — `v63-epic-5b` auto-transitions backlog → in-progress. 7 ACs + 5 Decisions + 5 Tasks + 5 PR risks. Pure documentation / Sophia-faithful authoring + grep-testable validation story. **Buildable now** (Sophia's announcement draft + cliché list + internalOnly regex + migration guide all canonical pre-shipped). 2 NEW files (story spec + grep-evidence) + 2 MODIFIED (CHANGELOG.md prepend v4.0 section + sprint-status.yaml). Decision 1: Sophia-faithful narrative flow per announcement draft. Decision 2: mostHonestOneLineSummary at TOP verbatim per FR41 (load-bearing per Story 5A.2 CR-M5 R1 precedent). Decision 3: Keep-a-Changelog Added/Changed/Removed/Documentation subsections summarizing v6.3 stream user-impact in Sophia voice (NOT story-by-story; no internal artifacts named per FR43). Decision 4: two grep-tests at story-close per FR42+FR43 + evidence captured at `v63-5b-1-grep-evidence.md`. Decision 5: maintainer sign-off (FR44) DEFERRED to Story 5B.3 release commit message per strict FR44 reading; M16 PARTIAL at story-close (CHANGELOG + grep-tests done; sign-off-in-commit pending Story 5B.3). Empirical probes 8/8 PASS at spec-author time. Inheritance: Story 5A.1+5A.2 pure-documentation shape; Story 5A.2 CR-M5 verbatim-framing precedent; Story 1A.6 hand-off comment + migration-guide link contract honored. v6.3 progress: 21/29 shipped + 3 ready (Stories 4.3 + 4.5 release-time-deferred; Story 5B.1 buildable-now). **Recommend V-pass** before dev-story given Sophia's voice + grep-test correctness + FR44 deferral framing + cliché-list completeness audit.

## Dev Agent Record

### Agent Model Used

(set at dev-story start)

### Debug Log References

### Completion Notes List

### File List
