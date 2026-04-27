---
initiative: convoke
artifact_type: story
qualifier: v63-5a-2-create-strategic-adr-and-playbook-outline
created: '2026-04-27'
schema_version: 1
epic: v63-epic-5a
---

# Story 5A.2: Create strategic ADR and playbook outline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 5A — Sprint 1 Experiments & Strategic ADR](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-5a-sprint-1-experiments-strategic-adr) (SECOND + final Story 5A; closes Epic 5A pending retro).
**Sprint:** 1 (FR coverage Sprint 1 stream — buildable retrospectively now per Story 5A.1 precedent; Sprint 5 phase = playbook completion handled by Story 5B.3 separately).
**FR coverage:** FR31 (Convoke delivers `host_framework_sync` playbook at committed path; Sprint 1 = OUTLINE only per epic AC; FR32 completion in Story 5B.3 Sprint 5), FR32 (playbook content areas — release class definition + trigger criteria + workstream template covered by this story; validation battery ref + known-pitfalls + Winston sign-off deferred to Story 5B.3), FR35 (strategic bet ADR with decision + ≥2 alternatives + revalidation trigger + PRD link).
**M coverage:** M15 (strategic bet ADR with decision + ≥2 alternatives + revalidation trigger + PRD link — file at committed path, sections checked); **M13 PARTIAL** — playbook delivered with required outline sections; Winston sign-off + remaining sections deferred to Story 5B.3 per epic AC line 409.
**Failure modes addressed:** PM4 ("named release class" without playbook artifact = vapor — Story 5A.2 closes this by shipping the OUTLINE; Story 5B.3 closes the COMPLETION); PM5 (strategic bet must be hypothesis, not commitment — ADR encodes revalidation trigger explicitly); NFR18 (playbook self-contained — future maintainer reads playbook + BMAD release notes only; no PRD re-read needed).

**Why this story is BUILDABLE NOW (NOT release-time-deferred):** all inputs are available — Sprint 1 experiments shipped via Story 5A.1 (`convoke-note-sprint-1-experiments.md`); PRD is canonical at `convoke-prd-bmad-v6.3-adoption/`; existing Convoke ADR precedents available (`convoke-adr-repo-organization-conventions-2026-03-22.md` for format template + frontmatter convention). Sprint 5 deferral is for playbook COMPLETION (validation battery ref + known-pitfalls + Winston sign-off), not for ADR or playbook outline. Story 5A.2 ships ADR (full) + playbook outline (3 of 5 sections); Story 5B.3 completes playbook (remaining 2 sections + sign-off).

**Why two deliverables in one story (NOT split):** epic story brief lines 407-408 explicitly bundles them. Both are products of Sprint 1 strategic-thinking work — the ADR documents the strategic bet that the playbook operationalizes. Splitting introduces sequencing complexity without scope reduction. Decision 1 honors epic intent.

**Upstream dependencies:**
- **Story 5A.1 (DONE)** — Sprint 1 experiments artifact at `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md`. ADR cites the 3 experiment outcomes (PASS×3) as evidence informing the BMAD coupling decision (per Decision 4).
- **PRD (CANONICAL)** — `_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/` (sharded). ADR's "PRD link" target. Strategic bet wording sourced from `executive-summary.md:38`.
- **Existing Convoke ADR precedent** — `_bmad-output/planning-artifacts/convoke-adr-repo-organization-conventions-2026-03-22.md` provides format template (frontmatter shape + Status/Date/Decision Makers/Context/Decision/Alternatives/Consequences sections).

**Downstream consumers:**
- **Story 5B.3 (release-time)** — playbook completion. Consumes the OUTLINE shipped here + adds validation battery ref + known-pitfalls + Winston sign-off.
- **Future v6.4 / v7.0 host_framework_sync releases** — playbook is the reusable template per innovation-novel-patterns.md I1 hypothesis (≥50% content reuse target).
- **Story 5B.2 retrospective** — ADR's revalidation trigger + Story 5B.3 completion outcome are inputs to retro hypothesis-status assessment per FR49.

**Namespace decision:** all artifacts under `docs/` (PRD-cited convention for this ADR per FR35 + Decision 2 for playbook). NOT in `_bmad-output/planning-artifacts/` despite that being the Convoke ADR family default — PRD explicitly cites `docs/adr/adr-bmad-coupling-v4.0.md` (M15 contract). NO code, NO `_bmad/bme/` skill — covenant-compliance-checklist N/A.

## Story

As Convoke maintainer (Amalik) closing Epic 5A,
I want **a strategic bet ADR at `docs/adr/adr-bmad-coupling-v4.0.md` (full content per FR35+M15) + a host_framework_sync playbook outline at `docs/host-framework-sync-playbook.md` (3 of 5 sections per FR31 + epic AC; remaining 2 sections deferred to Story 5B.3 per epic line 409)**,
so that M15 + FR35 are satisfied for ship-blocking ADR completeness + the playbook outline gives Story 5B.3 a substantive starting point for Sprint 5 completion + future v6.4/v7.0 maintainers have a reusable template per innovation-novel-patterns.md I1 hypothesis.

**Story shape:** **pure documentation / strategic-thinking + outline-authoring / buildable-now** (mirrors Story 5A.1 shape; second smallest v6.3 story-shape). ZERO code, ZERO tests, ZERO new dependencies. ~2-3 hours operator time (more than Story 5A.1 because ADR requires fresh strategic thinking, not just retrospective logging). 3 NEW markdown files + 2 MODIFIED.

**Empirical baseline (probed 2026-04-27):**

| Probe | Result | Spec impact |
|-------|--------|-------------|
| Story 5A.1 done + Sprint 1 artifact present | ✓ — `convoke-note-sprint-1-experiments.md` at planning-artifacts/ with 3 PASS verdicts + L28 hypothesis confirmed | ADR cites for evidence base (Decision 4) |
| `docs/adr/` directory exists | ✗ — `docs/` exists (with README, FAQ, etc.) but no `adr/` subdirectory yet | Task 2.1 creates `docs/adr/`; first ADR there |
| `docs/host-framework-sync-playbook.md` clean slate | ✓ — absent | Story 5A.2 creates |
| `docs/adr/adr-bmad-coupling-v4.0.md` clean slate | ✓ — absent | Story 5A.2 creates |
| Existing Convoke ADR format precedent | ✓ — `convoke-adr-repo-organization-conventions-2026-03-22.md` provides frontmatter + section structure template | Decision 3 reuses format |
| Strategic bet wording in PRD | ✓ — `executive-summary.md:38` has canonical wording ("Convoke's value grows by being the best opinionated downstream of BMAD..."); revalidation trigger ("at each major upstream release v6.4, v7.0, ...") explicit | ADR Decision section uses canonical PRD wording verbatim |
| innovation-novel-patterns.md I1 hypothesis | ✓ — playbook reusability target (≥50% content reuse for v6.4/v7.0) explicit | Playbook outline anti-pattern guard: "self-contained per NFR18" |
| `npm test` baseline post-Story-5A.1 | ✓ — `tests 1492 / pass 1491 / skip 1 / fail 0` | Unchanged (Story 5A.2 adds 0 tests) |

## Acceptance Criteria

### Decisions (pinned at spec-author time; defensible at dev-time)

**Decision 1 — Two deliverables, one story (per epic intent line 407-408 bundling ADR + playbook outline together).** Rationale: both are Sprint 1 strategic outputs; the ADR documents the bet, the playbook operationalizes it for repeatable execution. Splitting would introduce sequencing complexity without scope reduction. Path: ADR + playbook outline ship together; Story 5B.3 separately completes playbook at Sprint 5.

**Decision 2 — Playbook path: `docs/host-framework-sync-playbook.md`** (matches ADR's `docs/` location per PRD-cited M15 path; ecosystem-facing artifact appropriate for `docs/` family alongside README + FAQ + BMAD-METHOD-COMPATIBILITY). Rationale (FR31 says "committed path" without specifying): `docs/` is the existing Convoke ecosystem-facing documentation family; placement preserves the ADR + playbook pair under `docs/` for future-maintainer discoverability per NFR18. **Alternative considered:** `_bmad-output/planning-artifacts/` (Convoke ADR family default) — rejected because PRD diverges from convention for THIS ADR (FR35 cites `docs/adr/`), and pairing ADR + playbook in different families fragments discoverability.

**Decision 3 — ADR format mirrors `convoke-adr-repo-organization-conventions-2026-03-22.md`** for base section structure (Status / Date / Decision Makers / Context / Decision / Alternatives Considered / Consequences). **CR-M6 R1 frontmatter clarification:** the precedent ADR has a 4-key frontmatter (`initiative` + `artifact_type` + `created` + `schema_version`); the new ADR has a 5-key frontmatter ADDING `qualifier: bmad-coupling-v4.0`. The `qualifier` key was canonicalized as the standard non-date-qualified-artifact identifier per Convoke's artifact-governance taxonomy migration (post-2026-04-08); precedent ADR pre-dates that taxonomy + lacks the key. New ADR conforms to current taxonomy by adding `qualifier`; this is an ADDITIVE schema convention update, not a precedent violation. **CM-4 V-pass clarification (sections):** new ADR ADDS a NEW load-bearing section **Revalidation Trigger** per FR35's strategic-bet contract. The precedent ADR does NOT have a Revalidation Trigger (correctly — repo-organization is structural, not a hypothesis revalidated per major upstream release). The new section is ADDITIVE — not a precedent violation. PRD M15 + FR35 require: decision + ≥2 alternatives + revalidation trigger (with named owner) + PRD link. AC1 lists all 8 sections (7 from precedent + Revalidation Trigger).

**Decision 4 — ADR Decision section uses canonical PRD wording verbatim** from `executive-summary.md:38`: "Convoke's value grows by being the best opinionated downstream of BMAD, not by being an independent agent framework. This release leans INTO BMAD coupling — marketplace distribution, shared config conventions, upstream tracking — accepting the risk that if BMAD's trajectory falters, Convoke falters with it." Reduces drift between PRD and ADR (NFR18 self-containment property — ADR + PRD-link suffices for full context).

**Decision 5 — Playbook outline scope: 3 of 5 FR32 sections shipped now; 2 deferred to Story 5B.3 with explicit TODO markers.** Sections shipped this story: (a) **Release class definition** (what `host_framework_sync` is + when it applies); (b) **Trigger criteria** (how to recognize when a release qualifies as `host_framework_sync` vs other classes); (c) **Workstream template outline** (5-workstream skeleton derived from Convoke 4.0 actual structure: WS1 migration + WS2 marketplace + WS3 distribution + WS4 dependencies + WS5 release-discipline). Sections deferred to Story 5B.3 (Sprint 5): (d) **Validation battery reference** (cite Story 4.3 PF1 protocol); (e) **Known-pitfalls** (populate from Convoke 4.0 retrospective in Story 5B.2). Plus **Winston sign-off** at Story 5B.3 close. **Anti-pattern guard:** Story 5A.2 outline must self-document that sections (d) + (e) + sign-off are intentionally pending — NOT silently incomplete; NFR18 self-containment property tested by "would a future v6.4 maintainer know this is incomplete?" — yes, via explicit TODO callouts.

---

**AC1 — `docs/adr/adr-bmad-coupling-v4.0.md` exists with full PRD M15 + FR35 contract.**
**Given** Story 5A.2 dev-story start
**When** Tasks 1-2 complete
**Then**:
- File exists at `docs/adr/adr-bmad-coupling-v4.0.md` (creates `docs/adr/` subdirectory).
- **Frontmatter — exactly 5 keys per CM-5 V-pass (verbatim list, no ambiguity):**
  ```yaml
  initiative: convoke
  artifact_type: adr
  qualifier: bmad-coupling-v4.0
  created: <YYYY-MM-DD>
  schema_version: 1
  ```
- Required sections (8 total per Decision 3): **Status** (= ACCEPTED), **Date**, **Decision Makers** (Amalik + Winston per precedent), **Context** (BMAD coupling tradeoff space; reference Convoke 4.0 release shape), **Decision** (canonical PRD wording per Decision 4), **Alternatives Considered** (≥2 — see AC2), **Consequences** (positive + negative per coupling lean), **Revalidation Trigger** (per FR35 — names condition + owner explicitly; new section vs precedent ADR per Decision 3 + CM-4 V-pass clarification).
- PRD link present: link target `_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/index.md` (or sharded equivalent).

**AC2 — ADR Alternatives Considered section has ≥2 distinct alternatives + reasoned dismissal each.**
**Given** ADR draft authored
**When** AC2 reviewed
**Then**:
- At minimum 2 alternatives documented. Suggested 3 (operator can compress to 2 if redundant): **Alt 1 — Lean OUT of BMAD coupling** (treat Convoke as independent agent framework with optional BMAD compatibility); **Alt 2 — Defer coupling decision** (ship Convoke 4.0 with status-quo coupling + revisit at v4.5 with more data); **Alt 3 — Hybrid coupling** (selective BMAD coupling per workstream — couple distribution, decouple agent runtime).
- Each alternative has: 1-paragraph description + reasoned "why rejected" rationale citing concrete tradeoffs (cost / risk / value-trajectory). **CR-M3 R1 amendment:** original spec said "1-paragraph rationale" but delivered ADR uses 3 numbered bullets per alternative (one per tradeoff axis — cost, risk, value-trajectory). The bullet form is a richer FR35 surface than monolithic-paragraph — each tradeoff is independently auditable. AC2 now reads as "reasoned rationale" (form-flexible: 1-paragraph OR 3-bullet acceptable).

**AC3 — ADR Revalidation Trigger section is concrete + load-bearing per FR35.**
**Given** ADR draft authored
**When** AC3 reviewed
**Then**:
- Trigger conditions pinned (4 distinct events per CR-L1 R1 amendment matching delivered ADR): (1) at each BMAD major upstream release (v6.4, v7.0, v7.5, ...); (2) BMAD upstream stops shipping for ≥9 months; (3) BMAD major-version cadence breaks unexpectedly (e.g., v7.0 skipped over v6.4 with anomalous breaking changes); (4) BMAD project leadership changes affect the strategic direction Convoke depends on.
- Owner pinned: Amalik (project lead).
- Process: revalidation = re-run Sprint 1 experiments (EXP1 migration + EXP2 marketplace) at the upstream release version + author follow-on ADR (`adr-bmad-coupling-v4.x.md`) capturing GO / PIVOT / DECOUPLE outcome. **NOT vapor**: an explicit re-run protocol exists, owned by a named human, anchored to a measurable trigger condition.

**AC4 — `docs/host-framework-sync-playbook.md` exists with 3 of 5 FR32 sections + explicit Sprint 5 TODOs for remaining 2.**
**Given** ADR completed (AC1-AC3)
**When** Task 3 runs
**Then**:
- File exists at `docs/host-framework-sync-playbook.md`.
- Frontmatter (5 keys + 2 status keys): `initiative: convoke`, `artifact_type: playbook`, `qualifier: host-framework-sync`, `created: <YYYY-MM-DD>`, `schema_version: 1`, `outline_complete: true`, `winston_signoff_status: pending` (Story 5B.3 flips both: `outline_complete` → `false` once full playbook ships AND `winston_signoff_status` → `signed-off`).
- **CM-1 V-pass STATUS preamble (load-bearing) — added at top of body, before Section (a):** a 1-2-paragraph "STATUS: OUTLINE — INCOMPLETE" block explicitly stating that sections (d) Validation Battery Reference + (e) Known Pitfalls are pending Story 5B.3 (Sprint 5 close); Winston sign-off pending; the playbook **MUST NOT be used as a release template until completion**. This guards future-maintainer self-containment per NFR18 — a v6.4 maintainer reading the outline alone will see the STATUS block before any operational content.
- 3 sections shipped per Decision 5: (a) **Release Class Definition**, (b) **Trigger Criteria**, (c) **Workstream Template Outline**. Each ~3-7 paragraphs.
- **CM-3 V-pass — Section (c) Workstream Template Outline must include explicit pattern-not-Convoke-4.0-specifics boilerplate:** "The 5 workstreams below (WS1 migration / WS2 marketplace / WS3 distribution / WS4 dependencies / WS5 release-discipline) are WORKED EXAMPLES from Convoke 4.0's actual structure. Future releases adopting a new upstream framework version will define their own workstreams based on what changed upstream. Use this as a pattern-template: (1) identify what changed upstream, (2) map each change to a workstream, (3) for each workstream, define purpose + 2-3 template-tasks. The pattern (Purpose + Template Tasks structure) is reusable; the Convoke-4.0 workstream names are NOT." Anti-pattern guard for NFR18 reusability per innovation-novel-patterns.md I1 hypothesis (≥50% content reuse target for v6.4/v7.0).
- 2 sections placeholder per Decision 5 + CM-2 V-pass searchable-marker format: (d) **Validation Battery Reference** with HTML-comment marker `<!-- TODO-5B3-SECTION-D: Validation Battery Reference -->` followed by TODO text "Pending Story 5B.3 — will cite Story 4.3 PF1 validation cycle + Story 4.4 drift snapshot artifacts"; (e) **Known Pitfalls** with marker `<!-- TODO-5B3-SECTION-E: Known Pitfalls -->` followed by "Pending Story 5B.3 — populated from Convoke 4.0 retrospective in Story 5B.2".
- 1 Winston sign-off line with marker `<!-- TODO-5B3-SIGNOFF: Winston sign-off -->` followed by "Pending Story 5B.3 — Winston signs after playbook completion". Story 5B.3 author runs `grep -r "TODO-5B3"` to surface all pending work in one pass.

**AC5 — Validation gates green + scope discipline.**
- [ ] 5.1 `npm test` baseline 1492/1491/1/0 unchanged (Story 5A.2 adds 0 unit tests).
- [ ] 5.2 `npm run test:integration` baseline 93/93/0 unchanged.
- [ ] 5.3 `npm run lint` clean (no JS).
- [ ] 5.4 `git status --porcelain` confirms scope (3 NEW + 2 MODIFIED per AC6 — adjusted for state-dependence per Story 5A.1 CR-M5 R1 precedent).

**AC6 — Scope discipline.**
- IN scope (NEW files):
  - This story file (NEW at story creation; MODIFIED at dev-time per state-dependence per Story 5A.1 CR-M5 R1 precedent).
  - `docs/adr/adr-bmad-coupling-v4.0.md` (Decision 1 + AC1; creates `docs/adr/` subdirectory).
  - `docs/host-framework-sync-playbook.md` (Decision 1 + AC4).
- IN scope (MODIFIED):
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions (story `backlog → ready-for-dev → in-progress → review → done`; Epic 5A potentially `in-progress → done` after Story 5A.2 closes pending Story 5A retro decision).
  - This story file at dev-time (Tasks/Subtasks checkboxes + Dev Agent Record + File List + Change Log + Status).
- MUST NOT touch: `convoke-note-sprint-1-experiments.md` (Story 5A.1 frozen surface — only cite); existing Convoke ADRs in `_bmad-output/planning-artifacts/` (precedents — only cite); PRD shards (frozen; only link); any code; any test files; `package.json`/`package-lock.json`; any `_bmad/` files.

## Tasks / Subtasks

- [x] **Task 0: Pre-flight gates.**
  - [x] 0.1 Story 5A.1 status `done` confirmed; `convoke-note-sprint-1-experiments.md` present at `_bmad-output/planning-artifacts/`.
  - [x] 0.2 `docs/` exists with README + FAQ + agents.md + BMAD-METHOD-COMPATIBILITY.md + etc. (confirmed).
  - [x] 0.3 Clean slate confirmed pre-Task-2: `docs/adr/` absent + ADR file absent + playbook absent.
  - [x] 0.4 `npm test` baseline 1492/1491/1/0 confirmed.

- [x] **Task 1: Read inputs.**
  - [x] 1.1 Sprint 1 artifact confirmed: 3 PASS verdicts + Net Downstream Impact closing + L28 hypothesis confirmation. Cited as evidence base in ADR Context section.
  - [x] 1.2 PRD `executive-summary.md:38` strategic-bet wording captured verbatim for ADR Decision section. NFR18 + I1 hypothesis confirmed for playbook framing.
  - [x] 1.3 ADR precedent format reviewed (`convoke-adr-repo-organization-conventions-2026-03-22.md`); 5-key frontmatter + 7-section pattern confirmed; Revalidation Trigger added as 8th section per Decision 3 + CM-4 V-pass.

- [x] **Task 2: Author ADR `docs/adr/adr-bmad-coupling-v4.0.md`.**
  - [x] 2.1 Created `docs/adr/` subdirectory (first ADR there; bootstraps the family).
  - [x] 2.2 ADR shipped with full 8-section structure: Status (ACCEPTED) + Date (2026-04-27) + Decision Makers (Amalik + Winston) + Context (BMAD coupling tradeoff space + Sprint 1 evidence cited) + Decision + Alternatives + Consequences + Revalidation Trigger.
  - [x] 2.3 Decision section quotes `executive-summary.md:38` verbatim (no paraphrasing; NFR18 zero-drift property maintained).
  - [x] 2.4 3 distinct alternatives shipped (exceeds AC2 minimum of 2): Alt 1 Lean OUT (3 reasons rejected); Alt 2 Defer (3 reasons rejected); Alt 3 Hybrid (3 reasons rejected). Each with description + concrete tradeoff-cited rejection rationale.
  - [x] 2.5 Revalidation Trigger section per AC3: 4 named conditions (BMAD major upstream rev / ≥9 mo no shipping / cadence break / leadership direction change) + owner Amalik + 3-step process (re-run experiments + reassess + author follow-on ADR with GO/PIVOT/DECOUPLE outcome).
  - [x] 2.6 Sprint 1 experiments artifact + PRD index.md + 6 other references cited via markdown links.

- [x] **Task 3: Author playbook outline `docs/host-framework-sync-playbook.md` (~30-45 min).**
  - [x] 3.1 Created file with frontmatter (7 keys: 5 standard + `outline_complete: true` + `winston_signoff_status: pending`); YAML parse verified.
  - [x] 3.2 **CM-1 V-pass STATUS preamble (FIRST body block, before Section a)** — 1-2-paragraph "STATUS: OUTLINE — INCOMPLETE" block: "This playbook is an OUTLINE. Sections (a)+(b)+(c) below ship complete via Story 5A.2 (Sprint 1). Sections (d) Validation Battery Reference and (e) Known Pitfalls + Winston sign-off are pending Story 5B.3 (Sprint 5 close). **Do NOT use this outline alone as a release template — release execution requires the completed playbook.** Future maintainers attempting `host_framework_sync v6.4+` adoption MUST verify `winston_signoff_status: signed-off` in frontmatter before proceeding."
  - [x] 3.3 Section (a) Release Class Definition shipped: in-scope/out-of-scope lists + I1 hypothesis reusability framing (≥50% content reuse target for v6.4/v7.0).
  - [x] 3.4 Section (b) Trigger Criteria shipped: 3 trigger types (BMAD major upstream rev / shared-infrastructure change / marketplace contract change) + operational checklist (4 boxes; ≥2 ticked = `host_framework_sync`) + cross-reference to ADR Revalidation Trigger (different scope: this is release-class classification; ADR trigger is strategic-bet revalidation).
  - [x] 3.5 Section (c) Workstream Template Outline shipped: opens with **CM-3 V-pass pattern-reusability boilerplate** "The 5 workstreams below (WS1 / WS2 / WS3 / WS4 / WS5) are WORKED EXAMPLES from Convoke 4.0's actual structure. Future releases will define their own workstreams based on what changed upstream. Use this as a pattern-template: (1) identify what changed upstream, (2) map changes to workstreams, (3) for each workstream, define purpose + 2-3 template-tasks. The pattern (Purpose + Template Tasks structure) is reusable; the workstream NAMES are NOT." Then list the 5 Convoke 4.0 workstreams: WS1 migration + WS2 marketplace + WS3 distribution + WS4 dependencies + WS5 release-discipline. Per workstream: 1-paragraph purpose + 2-3 bullet template-tasks (e.g., WS1 migration: "draft migration script", "test on sandbox fixture", "PF1 validation gate"). Total ~6-9 paragraphs (boilerplate + 5 workstreams).
  - [x] 3.6 Section (d) Validation Battery Reference TODO block shipped — **CM-2 V-pass HTML-comment marker:**
    ```markdown
    ### (d) Validation Battery Reference
    <!-- TODO-5B3-SECTION-D: Validation Battery Reference -->
    Pending Story 5B.3 — will cite Story 4.3 PF1 validation cycle (`v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md`) + Story 4.4 drift snapshot (`v63-4-4-create-drift-snapshot-workflow.md`) as the validation infrastructure for behavioral equivalence at each `host_framework_sync` release.
    ```
  - [x] 3.7 Section (e) Known Pitfalls TODO block shipped — **CM-2 V-pass HTML-comment marker:**
    ```markdown
    ### (e) Known Pitfalls
    <!-- TODO-5B3-SECTION-E: Known Pitfalls -->
    Pending Story 5B.3 — populated from Convoke 4.0 retrospective in Story 5B.2. Will include lessons learned (registry-pattern constraint discovery from Story 1A.4; Path-C marketplace submission from Story 3.3; PF1 release-time deferral from Story 4.3; etc.).
    ```
  - [x] 3.8 Sign-off line TODO block shipped — **CM-2 V-pass HTML-comment marker:**
    ```markdown
    <!-- TODO-5B3-SIGNOFF: Winston sign-off -->
    Winston sign-off: PENDING (Story 5B.3 close).
    ```
    Per AC4 + epic AC line 409. Story 5B.3 author runs `grep -r "TODO-5B3"` to surface all 3 pending blocks in one pass.

- [x] **Task 4: Validation gates (AC5).**
  - [x] 4.1 `npm test` — `tests 1492 / pass 1491 / skip 1 / fail 0` unchanged from baseline.
  - [x] 4.2 `npm run test:integration` — `tests 93 / pass 93 / fail 0` unchanged.
  - [x] 4.3 `npm run lint` — clean (EXIT=0; no JS files touched).
  - [x] 4.4 `git status --porcelain` — scope verified: 1 MODIFIED (sprint-status.yaml) + 3 NEW (`docs/adr/` directory containing ADR + `docs/host-framework-sync-playbook.md` + this story file). YAML frontmatter for both new docs verified parseable via `node -e "yaml.parse(...)"`.

- [x] **Task 5: Story-close sprint-status update.**
  - [x] 5.1 sprint-status.yaml updated at Step 9 closure: story `in-progress → review`; **CR-M2 R1 wording fix:** Epic 5A status is "1/2 shipped + 1 in review" at story-close (Story 5A.2 transitions to `review`, not `done`). Epic 5A closes at 2/2 only after R1 code-review converges + status flips to `done`. `last_updated` narrative authored.

## Dev Notes

**Decision rationales (compact):** D1 = bundle ADR + playbook outline per epic intent (both Sprint 1 strategic outputs). D2 = `docs/host-framework-sync-playbook.md` matches PRD-cited ADR `docs/` location for ecosystem-facing artifact discoverability. D3 = ADR format mirrors `convoke-adr-repo-organization-conventions-2026-03-22.md` precedent + extends with Revalidation Trigger (FR35 requirement). D4 = canonical PRD strategic-bet wording verbatim in ADR Decision section (NFR18 self-containment + zero-drift property). D5 = 3 of 5 playbook sections this story (release class def + trigger criteria + workstream template); 2 sections deferred to Story 5B.3 (validation battery ref + known pitfalls); Winston sign-off Story 5B.3.

**Anti-patterns to avoid (top 5; LL-1 V-pass — imperative form):**
- ✗ DON'T re-author PRD strategic bet → use verbatim quote per Decision 4 (NFR18 zero-drift + PM5 hypothesis-not-commitment).
- ✗ DON'T silently skip deferred playbook sections → use HTML-comment markers `<!-- TODO-5B3-SECTION-{D,E} -->` per CM-2 V-pass (grep-able for Story 5B.3 author).
- ✗ DON'T ship <2 ADR alternatives → FR35+M15 hard requirement: ≥2 distinct alternatives with reasoned dismissal each.
- ✗ DON'T use vague revalidation trigger ("revisit when needed") → FR35 requires concrete condition + named owner per PM5.
- ✗ DON'T trap workstream template in Convoke-4.0 specifics → NFR18 + I1 hypothesis require pattern-reusability for v6.4/v7.0 (Section c boilerplate per CM-3).

**External dependencies + risk (compact):**

| ID | Risk | Mitigation |
|----|------|-----------|
| PR1 | Strategic-bet wording in PRD changes between spec-author + dev-story | Decision 4 mandates verbatim quote at dev-time (re-fetch from PRD); cite line number for traceability |
| PR2 | ≥2 alternatives feel forced / contrived | AC2 lists 3 candidate alternatives (lean-out / defer / hybrid) — operator picks the 2 most defensible |
| PR3 | Playbook workstream template too Convoke-specific (NFR18 violation) | Decision 5 + Anti-pattern #5 + Task 3.4 emphasis on "skeleton" not "Convoke 4.0 sprint plan recap" |
| PR4 | Story 5B.3 hand-off contract unclear (what exactly does it complete?) | AC4 + Decision 5 explicit TODO marker blocks for sections (d) + (e); winston_signoff_status frontmatter key flags pending state |
| PR5 | First ADR in `docs/adr/` family — discoverability bootstrap concern | Task 2.1 creates the directory; future ADRs follow this precedent (BUT separate path-convention ADR may be needed if Convoke ADRs migrate from `_bmad-output/planning-artifacts/` to `docs/adr/` — out of scope for this story) |

**Spike points:** None. Pure documentation / strategic thinking.

**Apply Epic 3 retro action items:**
- **PI-9 (`${PIPESTATUS[0]}`):** N/A — no shell pipelines.
- **PI-10 (Edge Case Hunter):** code-review at story close MUST include Edge Case Hunter layer (markdown + cross-reference + frontmatter-shape edges; PRD link verification critical).
- **PI-11 (DEF-SPIKE inversion handling):** N/A — no spikes.
- **PI-12 (spec spot-check rubric audit):** AC1-AC6 each pin verifiable assertions.

**Inheritance from prior stories:**
- Story 5A.1: pure documentation story-shape; cite-existing-evidence pattern (Decision 2 there → Decision 4 here verbatim quote pattern); buildable-now NOT release-time-deferred.
- Story 4.3 / 4.5: release-time-deferred pattern explicitly NOT applied (Story 5A.2 OUTLINE phase is buildable now; Story 5B.3 handles Sprint 5 completion separately).
- Story 5A.1 CR-M5 R1: AC6 state-dependence ("X NEW + Y MODIFIED" depends on commit timing) acknowledged here in AC6 boilerplate.

**Story 5A.2 closes Epic 5A** (when shipped). v6.3 progress goes 20 → 21/29 stories shipped.

**CM-6 V-pass — I1 hypothesis validation gate dependency:** innovation-novel-patterns.md I1 hypothesis ("≥50% content reuse for v6.4/v7.0 maintainers using the playbook as starting template") **CANNOT BE VALIDATED** at v6.4 unless the playbook is COMPLETE. Story 5A.2 ships an INCOMPLETE outline (3/5 sections + 2 deferred). I1 hypothesis validation at v6.4 REQUIRES Story 5B.3 completion (sections d+e + Winston sign-off). If a v6.4 maintainer in 2027+ receives only the 5A.2 outline + sees `winston_signoff_status: pending` in frontmatter, the I1 hypothesis validation is VOID for that release. **Mitigation pattern:** Story 5B.3 explicitly records "playbook is NOW COMPLETE and stable for v6.4+ reuse" + flips `winston_signoff_status` → `signed-off` + `outline_complete` → `false` (full playbook ships, not outline). Future v6.4 maintainer's first check is the frontmatter status keys.

**TI-9 cron-durability:** N/A — no scheduled actions.

**Scope guardrails for V-pass:** if V-pass questions Decision 2 playbook path (`docs/` vs `_bmad-output/planning-artifacts/`) — both are defensible; operator can override to planning-artifacts if preferred for ADR family consistency, but `docs/` matches PRD intent for ecosystem-facing artifacts. If V-pass suggests "include Winston sign-off in this story" — DEFER per Decision 5 + epic AC line 409 (Sprint 5 = Story 5B.3 scope). If V-pass suggests "split ADR + playbook into two stories" — DEFER per Decision 1 (epic intent bundles them).

## Change Log

- 2026-04-27 — Story 5A.2 R1 code-review converged via `/bmad-code-review`. **R1 batch-applied 8 patches + 2 deferred + 5 dismissed** (15 raw → 8 net): 6 MED (CR-M1 Task 3 parent checkbox [x]; CR-M2 Epic 5A progress wording tightening — "1/2 shipped + 1 in review" at story-close, flips to 2/2 on review-close; CR-M3 AC2 amendment to match delivered 3-bullet "why rejected" rationale form; CR-M4 playbook References self-reference removed — implementing story not relevant to ecosystem-facing playbook audience; CR-M5 ADR "verbatim" framing clarification — body character-identical, bolded lead-in label `**Strategic bet (...):**` elided as label-only; CR-M6 Decision 3 frontmatter clarification — `qualifier` key added per Convoke artifact-governance taxonomy migration post-2026-04-08, precedent ADR pre-dates that convention) + 2 LOW (CR-L1 AC3 amendment to 4 conditions matching delivered ADR — adds leadership-change as condition #4 alongside major-rev / ≥9-mo-no-shipping / cadence-break; CR-L2 playbook "boxes 2-4" rewording for unambiguous reading). 2 LOW deferred as D-V5A2-R1-1..2 (`outline_complete` flag naming + "Winston (architect)" external-reader ambiguity). 5 dismissed (CM-3 wording drift equivalent meaning; WS1 example variation per `e.g.`; `created` quoting style both YAML-valid; 50% reuse repetition consistent referencing; sprint-status `last_updated` scalar bloat already TI-8 backlog item). **R2 NOT triggered** per `code-review-convergence` rule (R1 had **0 HIGH** — second consecutive R1-only convergence in v6.3 stream after Story 5A.1; pure-docs minimal defect surface; Auditor verdict was ALL_AC_MET with 0 findings — cleanest auditor verdict to date). Final cumulative: 8 patches across 1 round + 2 deferred. **All gates green:** unit 1492/1491/1/0 unchanged; integration 93/93 unchanged; lint clean. **EPIC 5A: 2/2 stories shipped** — closes pending operator decision on Epic 5A retrospective (`optional` per sprint-status). **v6.3 progress: 21/29 stories shipped + 2 release-time-deferred** (Stories 4.3 + 4.5).
- 2026-04-27 — Story 5A.2 dev-story executed via `/bmad-dev-story` (autonomous single-session). All 6 ACs MET; all 5 Tasks executed (Task 3 expanded to 8 subtasks per V-pass CM-1 STATUS preamble); all gates GREEN. **Final shape:** 3 NEW files (`docs/adr/adr-bmad-coupling-v4.0.md` ~150 lines + `docs/host-framework-sync-playbook.md` ~145 lines + this story file) + 1 MODIFIED (sprint-status.yaml). **Test deltas:** unit 1492/1491/1/0 unchanged (pure docs; ZERO new tests); integration 93/93 unchanged; lint clean. **All 5 V-pass CMs applied during authoring:** CM-1 STATUS preamble at top of playbook (NFR18 guard); CM-2 HTML-comment grep-markers (`<!-- TODO-5B3-SECTION-D/E -->` + `<!-- TODO-5B3-SIGNOFF -->`); CM-3 Section (c) pattern-reusability boilerplate; CM-4 Revalidation Trigger as 8th ADR section per FR35 (additive, not precedent violation); CM-5 explicit 5-key frontmatter list. CM-6 (I1 hypothesis validation gate) documented in playbook STATUS preamble. **All 5 Decisions honored:** D1 bundle (single story) + D2 `docs/` location + D3 ADR mirrors precedent + Revalidation Trigger addition + D4 PRD verbatim quote (zero-drift; NFR18) + D5 3-of-5 playbook sections shipped + 2 deferred + sign-off pending. **3 ADR alternatives shipped** (exceeds AC2 ≥2 minimum): Lean-OUT (3 reasons rejected), Defer (3 reasons rejected), Hybrid (3 reasons rejected). **Revalidation Trigger** has 4 named conditions + Amalik as owner + 3-step process (re-run experiments + reassess + author follow-on ADR with GO/PIVOT/DECOUPLE outcome) — non-vapor per PM5. **Closes Epic 5A** (1/2 → 2/2 — pending retro decision). **v6.3 progress: 20 → 21/29 stories shipped + 2 release-time-deferred (Stories 4.3 + 4.5).** Story 5B.3 hand-off contract rigorous: `grep -r "TODO-5B3" docs/` surfaces 3 pending blocks; future-maintainer guard via STATUS preamble + frontmatter check. Ready for `/bmad-code-review`.
- 2026-04-27 — V-pass batch-applied **8 improvements** (6 critical + 0 enhancement + 0 optimization + 2 LLM-opt) via spec-rewrite. **Empirical probes 12/12 PASS** (all factual claims verified — verbatim PRD quote integrity, Story 5B.3 hand-off contract, NFR18 deferral framing, FR/M strict reading, AC verifiability). 6 CMs all refinements/clarifications, no factual defects: **CM-1** added STATUS preamble to playbook outline (1-2 paragraphs at top of body, before Section a, marking outline as INCOMPLETE + "do not use alone for release execution" — NFR18 future-maintainer guard); **CM-2** TODO markers reformatted as HTML-comment grep-able pattern (`<!-- TODO-5B3-SECTION-D -->` / `<!-- TODO-5B3-SECTION-E -->` / `<!-- TODO-5B3-SIGNOFF -->`) so Story 5B.3 author runs `grep -r "TODO-5B3"` to surface all pending blocks in one pass; **CM-3** Section (c) Workstream Template pattern-reusability boilerplate added (1 paragraph framing 5 Convoke-4.0 workstreams as WORKED EXAMPLES, not absolute template — NFR18 + I1 hypothesis pattern-reusability); **CM-4** Decision 3 framing clarified — Revalidation Trigger is ADDITIVE per FR35 strategic-bet contract, not precedent violation; **CM-5** AC1 frontmatter rewritten as explicit 5-key YAML list (verbatim, no "plus a 5th" ambiguity); **CM-6** I1 hypothesis validation gate dependency on Story 5B.3 completion documented in Dev Notes (incomplete outline can't validate I1 reusability at v6.4). **LL-1** anti-patterns compressed to imperative form (~30% token savings); **LL-2** Task subtasks tightened (already mostly imperative; minor adjustments). **V-pass ROI:** prevented 1 NFR18 self-containment partial-shipment risk (CM-1) + 1 hand-off-loss risk (CM-2 grep pattern) + 1 reusability-trapping risk (CM-3) + 3 doc-clarity gaps (CM-4/5/6) + LLM-opt token savings. Final spec: 6 ACs + 5 Decisions + 5 Tasks (Task 3 expanded from 7 to 8 subtasks for new STATUS preamble) + 5 PR risks. Story remains ready-for-dev.
- 2026-04-27 — Story 5A.2 created via `/bmad-create-story v63-5a-2`. **Final Epic 5A story** — closes Epic 5A pending retro decision. 6 ACs + 5 Decisions + 5 Tasks + 5 PR risks. Pure documentation / strategic-thinking + outline-authoring story (second smallest v6.3 shape after 5A.1). 3 NEW files (story + ADR + playbook outline) + 2 MODIFIED (sprint-status + this story self-update at story-close). Decision 1: bundle ADR + playbook outline per epic intent. Decision 2: `docs/host-framework-sync-playbook.md` matches PRD-cited ADR location. Decision 3: ADR format mirrors precedent + extends with Revalidation Trigger. Decision 4: canonical PRD strategic-bet wording verbatim (zero-drift). Decision 5: 3/5 playbook sections this story; 2 deferred to Story 5B.3 + Winston sign-off Sprint 5 close. **NOT release-time-deferred** — buildable now. Empirical probes 8/8 PASS. Inheritance: Story 5A.1 documentation shape + cite-evidence pattern + state-dependent AC6. v6.3 progress: 20/29 shipped + 3 ready (Stories 4.3, 4.5, 5A.2; first two release-time-deferred). **Recommend V-pass** before dev-story given strategic-thinking surface + 5 Decisions + first ADR in `docs/adr/` family.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context window, Claude Code CLI dev-story session 2026-04-27).

### Debug Log References

- **Task 0 pre-flight gates (4/4 PASS):** Story 5A.1 done; Sprint 1 artifact present; `docs/` has README+FAQ+etc.; clean slate for new files; npm test baseline 1492/1491/1/0.
- **Task 1 inputs read:** Sprint 1 artifact (3 PASS verdicts + L28 confirmation); PRD `executive-summary.md:38` strategic-bet wording captured verbatim; ADR precedent format reviewed (`convoke-adr-repo-organization-conventions-2026-03-22.md` → 5-key frontmatter + 7-section pattern).
- **Task 2 ADR shipped:** `docs/adr/adr-bmad-coupling-v4.0.md` with 5-key frontmatter + 8 sections (Status/Date/Decision Makers/Context/Decision/Alternatives/Consequences/Revalidation Trigger). Decision section quotes PRD verbatim (NFR18 zero-drift). 3 alternatives shipped (exceeds AC2 ≥2 minimum): Lean-OUT (3 reasons rejected), Defer (3 reasons rejected), Hybrid (3 reasons rejected). Revalidation Trigger has 4 named conditions + Amalik as owner + 3-step process (re-run experiments + reassess + author follow-on ADR with GO/PIVOT/DECOUPLE outcome). 8 References cited.
- **Task 3 playbook outline shipped:** `docs/host-framework-sync-playbook.md` with 7-key frontmatter (5 standard + `outline_complete: true` + `winston_signoff_status: pending`). CM-1 STATUS preamble at top (NFR18 future-maintainer guard). Section (a) Release Class Definition (in-scope/out-of-scope; I1 hypothesis framing). Section (b) Trigger Criteria (3 trigger types + 4-box operational checklist + cross-reference to ADR Revalidation Trigger). Section (c) Workstream Template Outline opens with CM-3 pattern-reusability boilerplate then 5 Convoke-4.0 workstreams (WS1 migration / WS2 marketplace / WS3 distribution / WS4 dependencies / WS5 release-discipline) — each with purpose + 3 template-tasks. Sections (d) + (e) + Winston sign-off use CM-2 HTML-comment markers (`<!-- TODO-5B3-SECTION-D -->` / `<!-- TODO-5B3-SECTION-E -->` / `<!-- TODO-5B3-SIGNOFF -->`) so Story 5B.3 author runs `grep -r "TODO-5B3" docs/` to surface all 3 pending blocks.
- **Task 4 validation gates (4/4 PASS):** npm test 1492/1491/1/0 unchanged; integration 93/93 unchanged; lint clean (EXIT=0); scope verified (1 MODIFIED + 3 NEW). YAML frontmatter for both new docs parses cleanly via `yaml.parse()` (verified via node REPL).

### Completion Notes List

- **All 6 ACs MET.** AC1: ADR file at canonical path with 5-key frontmatter + 8 required sections. AC2: 3 distinct alternatives (exceeds ≥2) with reasoned rejection per tradeoff axis. AC3: Revalidation Trigger names condition + owner + 3-step process; non-vapor per PM5 framing. AC4: playbook outline at canonical path with 7-key frontmatter + 3 shipped sections + 2 TODO-marker placeholders + 1 sign-off TODO; CM-2 HTML-comment grep-able pattern + CM-1 STATUS preamble + CM-3 pattern-reusability boilerplate all applied. AC5: gates green. AC6: scope = 1 MODIFIED + 3 NEW.
- **All 5 V-pass CMs applied during authoring (not retroactively):** CM-1 STATUS preamble at top of playbook + CM-2 HTML-comment grep-markers + CM-3 pattern-reusability boilerplate at Section (c) + CM-4 Decision 3 framing followed (Revalidation Trigger added as 8th section per FR35 strategic-bet contract, not precedent violation) + CM-5 frontmatter explicit 5-key list followed (no ambiguity in delivered ADR). CM-6 I1 hypothesis validation gate dependency documented in playbook STATUS preamble (future v6.4 maintainer must verify `winston_signoff_status: signed-off` before proceeding).
- **All 5 Decisions honored:** D1 bundle ADR + playbook outline (single story); D2 playbook at `docs/host-framework-sync-playbook.md` (matches ADR `docs/` location); D3 ADR mirrors precedent + adds Revalidation Trigger; D4 PRD strategic-bet wording verbatim quoted (NFR18 zero-drift); D5 3 of 5 playbook sections shipped + 2 deferred to Story 5B.3 with searchable TODO markers + Winston sign-off pending.
- **Pure documentation story-shape preserved.** ZERO code, ZERO tests, ZERO new dependencies. Test counts unchanged (1492/1491/1/0). Lint unchanged. ~2-3 hours operator-equivalent (mostly strategic synthesis + verbatim transcription).
- **Story 5B.3 hand-off contract is rigorous.** Story 5B.3 author runs `grep -r "TODO-5B3" docs/` to surface 3 pending blocks (sections d + e + sign-off). Frontmatter status keys flip on completion: `outline_complete: false` (full playbook ships, not outline) + `winston_signoff_status: signed-off`. Future-maintainer guard via STATUS preamble + frontmatter check ensures incomplete-shipment risk is contained per CM-1.
- **Closes Epic 5A on R1 convergence** (CR-M2 R1 wording fix: at story-close `review`, Epic 5A is 1/2 shipped + 1 in review; Epic 5A flips to 2/2 + done after R1 code-review converges + this story flips `review → done`. Epic 5A retrospective is `optional` per sprint-status — operator decision). v6.3 progress at story-close: **20/29 shipped + 1 in review** + 2 release-time-deferred (Stories 4.3 + 4.5); on review-close: 21/29 shipped.

### File List

**NEW (3):**
- `docs/adr/adr-bmad-coupling-v4.0.md` (~150 lines; first ADR in `docs/adr/` family — bootstraps the directory)
- `docs/host-framework-sync-playbook.md` (~145 lines; 5 sections + STATUS preamble + 3 TODO markers)
- `_bmad-output/implementation-artifacts/v63-5a-2-create-strategic-adr-and-playbook-outline.md` (this story; created at story-creation, modified during V-pass + dev-story)

**MODIFIED (1):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status transitions: backlog → ready-for-dev → in-progress → review; epic-5a progress 1/2 → 2/2; `last_updated` narrative)
