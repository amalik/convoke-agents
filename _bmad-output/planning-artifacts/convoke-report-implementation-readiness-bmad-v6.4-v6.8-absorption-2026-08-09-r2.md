---
stepsCompleted: [1, 2, 3, 4, 5, 6]
verdict: READY
findings: {critical: 0, major: 2, minor: 2}
assessmentRun: r2
supersedes: convoke-report-implementation-readiness-bmad-v6.4-v6.8-absorption-2026-08-09.md
absorption_window: 'v6.4–v6.10'
filenameQualifierNote: 'Filename retains the stale `v6.4-v6.8` qualifier; `absorption_window` above is authoritative. Governed rename deferred to backlog I121.'
assessedDocuments:
  prd: convoke-prd-bmad-v6.4-v6.8-absorption.md
  architecture: convoke-arch-bmad-v6.4-v6.8-absorption.md
  epics: convoke-epic-bmad-v6.4-v6.8-absorption.md
  ux: null
assessorIndependenceCaveat: 'The assessing agent (Winston) authored the 2026-08-09 M1 and M2 amendments under review in this run. Findings concerning those amendments should be weighted accordingly; a second reviewer would be justified in looking hardest there.'
---

# Implementation Readiness Assessment Report

**Date:** 2026-08-09
**Project:** BMAD-Enhanced (Convoke) — v4.1 upstream BMAD absorption

---

## Run Context

This is **run 2 (r2)** of the readiness assessment for the v4.1 absorption chain, executed the same day as run 1.

**Run 1** (`convoke-report-implementation-readiness-bmad-v6.4-v6.8-absorption-2026-08-09.md`) returned verdict **NEEDS WORK** on 10 findings (0 Critical, 5 Major, 3 Minor, 2 Info). Three were fixed in-session (C1, C2, m1). **Two Major findings were left open as operator decisions:**

- **M1 — OQ-1 unresolved.** Epic 1 Story 1.1's AC1 required cadence fields to resolve via the config-loader — a path AD8 forbids and the frozen API could not serve. Story 1 of 21, on the critical path, not implementable as written.
- **M2 — Epic 3 externally gated.** The MVP differentiator carried `blocked-on: external A8 Epic 1B`, whose specs do not exist on disk. The decoupling spike recommended 2026-06-21 had not been run.

**Both were actioned between r1 and r2** (2026-08-09, later the same day):

| Finding | Action taken | Artifacts touched |
|---|---|---|
| **M1** | OQ-1 resolved as **option (c)** — `cadence-state.js` owns `_bmad/_config/cadence.yaml` outright; the `_bmad/` traversal guard is extracted to a shared helper; `config-loader.js`'s public signature is unchanged (no Story 1A.2 AC9 amendment). Story 1.1's statement and AC1 amended; a third AC added covering the shared guard. | arch §AD1, epics Story 1.1, backlog I113 |
| **M2** | Decoupling spike run — **the Epic 1B gate is SOFT.** Epic 3 unblocked and sequences normally; the "sequence E7 LAST" recommendation withdrawn across 8 sites in 2 documents. | arch (4 sites), epics (4 sites), backlog I113 + D15 + new I122 |

**This run's purpose** is to re-assess the amended chain mechanically rather than to accept those amendments on the author's word — the same discipline that caught finding C1 in r1, which was a defect introduced that same day by the same agent.

---

## Step 1 — Document Discovery

### Assessment target

| Type | File | Size | Modified |
|---|---|---|---|
| **PRD** | `convoke-prd-bmad-v6.4-v6.8-absorption.md` | 45,788 B | 2026-08-09 10:35 |
| **Architecture** | `convoke-arch-bmad-v6.4-v6.8-absorption.md` | 34,499 B | 2026-08-09 19:56 |
| **Epics & Stories** | `convoke-epic-bmad-v6.4-v6.8-absorption.md` | 34,705 B | 2026-08-09 19:56 |
| **UX** | — none — | | |

The two 19:56 timestamps are the M1/M2 amendments under re-assessment.

### Duplicates

**None.** All three assessed documents exist as whole documents only, with no sharded counterparts.

One sharded PRD folder exists in the directory — `convoke-prd-bmad-v6.3-adoption/` — but it belongs to the **v6.3 initiative** (a different release) and its whole version is already in `archive/`. Not a conflict for this assessment.

### Missing documents

**⚠️ No UX document — assessed as N/A with rationale, not as a gap.**

The only UX artifact in `planning-artifacts/` is `epic-skill-portability-ux.md` (5.3 KB), which belongs to the skill-portability initiative. v4.1 is CLI, config-surface, and CI work with no user-facing visual surface. Its operator-experience standard is carried by **The Convoke Operator Covenant** and its Compliance Checklist, both of which were declared as input documents in all three artifacts by r1 finding C2.

*Reviewer note: if a future reviewer disagrees that a Covenant-governed CLI surface is exempt from a UX artifact, this is the place to challenge it. The judgment is recorded here rather than left implicit.*

### Filename qualifier (informational)

All three assessed files retain the stale `v6.4-v6.8` qualifier while the actual absorption window is **v6.4–v6.10** (re-baselined 2026-08-09, Option B). Per operator decision the frontmatter `absorption_window` is authoritative; the governed rename of 4 files is tracked as backlog **I121**. This report's own filename follows the same convention deliberately, for consistency with the chain it assesses.

---

## Step 2 — PRD Analysis

**Source:** `convoke-prd-bmad-v6.4-v6.8-absorption.md` (388 lines), read in full. Requirements extracted by **mechanical enumeration** of the PRD's canonical `## Functional Requirements` / `## Non-Functional Requirements` sections (`project-context.md` rule `mechanical-research-enumeration`) — not from the epics' restatement of them, and not by eyeballing headers.

### Functional Requirements

**Currency Management *(E4)***
- **FR1:** An operator can pin Convoke to a chosen BMAD compat-floor.
- **FR2:** An operator can opt into a newer upstream channel independently of their pinned floor.
- **FR3:** An operator can select a default channel that Convoke tracks automatically *(set-and-forget)*.
- **FR4:** An operator can view which channel and floor they are currently on.
- **FR5:** An operator can perform channel/floor operations through Convoke's conversational skill surface.
- **FR25:** The system validates a chosen channel/floor combination and warns or refuses on an incompatible selection.

**Upstream Absorption & Cadence *(E4 + N-cadence policy)***
- **FR6:** The system can classify an upstream update as **declaration-only, conformance-required, or breaking** (the absorption ternary; supersedes the original compat-only-vs-breaking binary).
- **FR7:** An operator can absorb a compat-only upstream update with no Convoke code change.
- **FR8:** The system applies a defined breaking-change protocol when an upstream change is breaking.
- **FR9:** Convoke publishes a binding N-cadence policy declaring its maximum compat-floor lag.
- **FR10:** The maintainer can record the v4.1 absorption effort as a reusable baseline for future cadence comparison.
- **FR24:** The system surfaces a warning when Convoke's compat-floor lag exceeds the N-cadence policy cap.

**Schema Conformance & Migration *(E2)***
- **FR11:** The system migrates Convoke modules' module-help schema to the v6.7 field convention (`after`/`before` → `preceded-by`/`followed-by`).
- **FR11b:** The system converts Convoke module-help files on a **non-conformant column set** (neither pre- nor post-v6.7 schema) to the canonical 13-column header. *Structural conversion with column-semantics mapping, not a field rename. Columns with no canonical target (`sequence`, `agent`, `options`) must be resolved explicitly; a dropped column requires operator confirmation (OC-R5).*
- **FR12:** An operator's installed Convoke is migrated to the new schema on update without manual edits.
- **FR13:** When a migration cannot apply cleanly, the operator receives a next-action message, not a bare error *(OC-R6)*.
- **FR14:** The system verifies behavioral parity across agents after a schema or channel change.

**Operator Covenant Enforcement *(E7)***
- **FR15:** A Convoke skill halts and waits for the operator at every OC-R5 decision point.
- **FR16:** A Convoke skill's agent self-confirms each activation step executed before beginning the main workflow.
- **FR17:** The system enumerates all `_bmad/bme/` pause-point skills mechanically to define enforcement coverage.
- **FR18:** The Covenant compliance audit can be re-run with the baseline method to confirm ≥ 82% (no regression).
- **FR26:** The system flags a `_bmad/bme/` skill that lacks OC-R5 self-confirm enforcement *(authoring-time durability check)*.

**Marketplace Distribution & Discoverability *(E1 — Phase 2)***
- **FR19:** Convoke is structured per the marketplace structural contract (`skills/` at root + `module.yaml` + `module-help.csv`).
- **FR20:** Convoke declares a `plugin_name` distinct from its internal module code.
- **FR21:** An operator can install Convoke via a documented BYO-URL path when a marketplace listing is unavailable.
- **FR22:** A standalone operator can submit a demand signal/request through a documented, low-friction path reachable outside the dev loop.

**Re-engagement & Recovery *(E4 migration)***
- **FR23:** A lapsed or forked operator can re-enter on a pinned floor via a documented migration path.

**Total FRs: 27** *(FR1–FR26 plus FR11b; numbering is non-contiguous within groups by design — FR24/FR25/FR26 and FR11b were added during review.)*

### Non-Functional Requirements

**Compatibility & Conformance**
- **NFR1 (Parity):** 0 operator-facing regressions across the 5 classes, verified by the PF1-style battery whose coverage includes all in-scope agents (enumerated from source) (MO7).
- **NFR2 (Compat-floor):** Convoke declares and honors a ≤ N-3 compat-floor (binding policy); v6.3+ source format must not regress.
- **NFR3 (Marketplace structural):** the repo satisfies the structural contract mechanically (`skills/` at root, valid `module.yaml`, parseable `module-help.csv`) **and** BYO-URL install is verified end-to-end.

**Reliability & Safety**
- **NFR4 (Recoverable migrations):** migrations are idempotent with a verified recovery path — re-running a half-failed migration converges; never leaves a partially-written install.
- **NFR5 (Soft-warn preflight):** stderr WARNINGs, exit 0, never block install/update.
- **NFR6 (Blast-radius):** E2/E4 ship migrations + parity; additive changes don't mutate existing installs.

**Security & Safety**
- **NFR7 (Path-safety):** user-path operations resolve + normalize + contains-check against the project root and refuse paths outside it.
- **NFR8 (No hardcoded versions/secrets):** versions via `getPackageVersion()`; no credentials in source; dependency hygiene.
- **NFR9 (Allowlist input validation):** channel/pin/CSV inputs validated against an allowlist pattern (semver/tag charset); no arbitrary code or ref execution; CSV-injection prefix applied.

**Maintainability *(floor-payback)***
- **NFR10 (Currency cost, class-dependent):** Class A absorbs with 0 Convoke source/logic changes; Class B is bounded/mechanical/migration-assisted; Class C invokes the breaking-change protocol (MO2). v4.1 effort captured as a baseline in a defined unit (maintainer-hours + files-touched + story-count) (MO2b).
- **NFR11 (Covenant floor):** compliance ≥ 82% (baseline method); new `_bmad/bme/` skills pass the compliance checklist with no FAIL cells (N/A allowed with rationale) (FR26).

**Observability**
- **NFR12 (Cadence observability):** the system can report cadence state — current floor, declared cap, actual lag, last-absorption timestamp — inspectable by the operator and logged.

**Performance**
- **NFR13:** operator-facing ops carry indicative budgets (reported, not gated); CI parity battery + audit complete within a declared CI time ceiling (hard gate); no operation regresses > 2× against the captured baseline (hard gate).

**Engineering Discipline**
- **NFR14:** counts derive from source; migration files carry delta logic only; libs accept `projectRoot`; every story ships lint-clean; verification commands honor pipefail; a namespace decision is recorded.

**Total NFRs: 14**

### Additional Requirements & Constraints

- **8 Measurable Outcomes** (MO1–MO8, incl. MO2b) with defined metrics and measurement points.
- **5 operator-facing regression classes** (MO7): persona/voice drift · menu-code changes · output format/schema · command/capability availability · activation-sequence + `on_complete` hook execution.
- **Ecosystem-conformance constraints** (the domain's "compliance"): marketplace structural contract · module-help schema · v6.3+ source format must not regress · Operator Covenant ≥ 82%.
- **Integration constraints:** parallel-install model (side-by-side with BMAD, *not* a package dependency); cross-platform export targets (`.agents/skills/`, Web Bundles).
- **`project-context.md` rules bound into the PRD:** `no-hardcoded-versions`, `no-process-cwd-in-libs`, `slash-command-ux-for-user-facing-tools`, `covenant-compliance-for-convoke-skills`, `namespace-decision-for-new-skills`, `test-fixture-isolation`, `lint-passes-before-review`, `verification-pipefail`, `derive-counts-from-source`, `mechanical-research-enumeration`.
- **Scope boundary:** v4.2 spike capabilities (E3/E5/E6) are intentionally excluded from the FR set.
- **N/A with rationale:** Scalability and Accessibility NFRs omitted deliberately (not a hosted service; CLI/content tool, no UI).

### PRD Completeness Assessment

**Complete and unusually well-formed for traceability.** Specific strengths relevant to this assessment:

- **Canonical FR/NFR sections exist and are unambiguous** — requirements can be extracted mechanically rather than inferred, which is what makes a real coverage matrix possible.
- **Bidirectional traceability is claimed and checkable:** every FR traces to a journey or Measurable Outcome, and the *Journey Requirements Summary* table asserts every epic appears in ≥ 1 journey and every journey grounds ≥ 1 MO.
- **Deliberate omissions are declared with rationale** rather than left silent (Scalability/Accessibility N/A; E3/E5/E6 excluded).
- **The absorption ternary is reconciled into the FR set** (FR6, NFR10, MO2) rather than left as an architecture-only concept.

**One item carried forward to Step 3 for verification:**

> ⚠️ **The FR denominator changed during r1.** Run 1 reported FR coverage as **26/26 = 100%**, then — as finding **C1** — added **FR11b** to the PRD's canonical section, taking the total to **27**. The 26/26 matrix was therefore computed against a denominator that no longer holds, and **FR11b's coverage was never verified by a matrix pass**. r1 noted the epics cite FR11b 5× and mapped it to Story 2.4, but a citation is not a coverage proof. Step 3 must build the matrix at **n=27** and verify FR11b independently.

*This is the assessor-independence caveat operating in practice: the gap exists precisely because the same agent authored the fix and reported the coverage in one pass.*

---

## Step 3 — Epic Coverage Validation

**Source:** `convoke-epic-bmad-v6.4-v6.8-absorption.md` (430 lines), read in full. **4 epics / 21 stories.**

**Method.** The matrix was built by a **mechanical per-story scan** — parsing each `### Story` block and extracting its FR citations — *not* by reading the epics' own `FR Coverage Map`. A self-declared coverage map is an assertion, not evidence; the map is used only as a cross-check afterward.

*Method note (recorded because it changed a result): the first scan split story blocks on `###` only, which let each epic's last story absorb the following epic's `##` preamble. That produced one false attribution — `FR18 → Story 2.4`, bled from Epic 3's normative-reference note citing "NFR11/FR18". Re-run with boundaries on both `##` and `###`, the attribution corrects to `FR18 → Story 3.4`. Coverage totals were unaffected. Logged so the matrix below is reproducible rather than merely asserted.*

### Coverage Matrix

| FR | Epic Coverage | Status |
|---|---|---|
| FR1 | Epic 1 · Story 1.3 | ✓ Covered |
| FR2 | Epic 1 · Story 1.3 | ✓ Covered |
| FR3 | Epic 1 · Story 1.3 | ✓ Covered |
| FR4 | Epic 1 · Story 1.5 | ✓ Covered |
| FR5 | Epic 1 · Story 1.10 | ✓ Covered |
| FR6 | Epic 1 · Story 1.6 | ✓ Covered |
| FR7 | Epic 1 · Story 1.7 | ✓ Covered |
| FR8 | Epic 1 · Story 1.8 | ✓ Covered |
| FR9 | Epic 1 · Story 1.4 | ✓ Covered |
| FR10 | Epic 1 · Story 1.7 | ✓ Covered |
| FR11 | Epic 2 · Story 2.1 | ✓ Covered |
| **FR11b** | **Epic 2 · Story 2.4** | ✓ **Covered** *(verified this run — see below)* |
| FR12 | Epic 2 · Story 2.1 | ✓ Covered |
| FR13 | Epic 2 · Story 2.2, Story 2.4 | ✓ Covered |
| FR14 | Epic 2 · Story 2.3 | ✓ Covered |
| FR15 | Epic 3 · Story 3.2 | ✓ Covered |
| FR16 | Epic 3 · Story 3.2 | ✓ Covered |
| FR17 | Epic 3 · Story 3.1 | ✓ Covered |
| FR18 | Epic 3 · Story 3.4 | ✓ Covered |
| FR19 | Epic 4 · Story 4.1 | ✓ Covered |
| FR20 | Epic 4 · Story 4.1 | ✓ Covered |
| FR21 | Epic 4 · Story 4.2 | ✓ Covered |
| FR22 | Epic 4 · Story 4.3 | ✓ Covered |
| FR23 | Epic 1 · Story 1.9 | ✓ Covered |
| FR24 | Epic 1 · Story 1.4 | ✓ Covered |
| FR25 | Epic 1 · Story 1.3 | ✓ Covered |
| FR26 | Epic 3 · Story 3.3 | ✓ Covered |

### Missing Requirements

**None.** No PRD FR is uncovered, and no FR appears in the epics that is absent from the PRD (the defect class that produced r1's finding C1).

### ✅ Step-2 carry-forward resolved — FR11b is genuinely covered

The concern raised in Step 2 was that r1 reported **26/26** and *then* added FR11b as finding C1, so the reported 100% was computed against a stale denominator and FR11b's coverage was never matrix-verified.

**Verified this run at n=27: FR11b is covered by Epic 2 Story 2.4**, and not merely name-checked. Story 2.4's first AC cites FR11b directly and specifies the canonical 13-column output header plus removal of the phantom trailing column. It also carries a genuine OC-R5 clause — columns with no canonical target (`sequence`, `agent`, `options`) must be explicitly resolved, and *a dropped column requires operator confirmation*. That is a real acceptance criterion, not a placeholder.

*This is the one finding r1's process could not have produced, since the fix and the coverage report happened in the same pass. It resolves clean.*

### Cross-check against the epics' self-declared Coverage Map

The document's own map claims `FR1-10, FR23-25 → Epic 1` · `FR11, FR11b, FR12-14 → Epic 2` · `FR15-18, FR26 → Epic 3` · `FR19-22 → Epic 4`. The mechanical scan **reconciles exactly** — no epic claims an FR its stories do not cite, and no story cites an FR its epic does not claim. The map is accurate.

### Enabler stories (informational, not a gap)

Two stories cite **no FR**:

- **Story 1.1** — Cadence state with advisory-locked writes (AD1 + AD8)
- **Story 1.2** — Migration-safety contract (AD3, SHARED with Epic 2)

Both are **architecture-derived enabler stories**, not requirement-derived. They implement AD1/AD8/AD3, which every downstream Epic 1 and Epic 2 story depends on. This is correct structure, not missing traceability — but it is worth stating that their justification lives in the architecture, so a reader checking only FR traceability would find them unanchored. Both trace cleanly to the *Additional Requirements* section's AD list.

### Coverage Statistics

| Metric | Value |
|---|---|
| Total PRD FRs (canonical section) | **27** |
| FRs covered in epics | **27** |
| **Coverage percentage** | **100.0%** |
| FRs in epics but not PRD | 0 |
| Epics / Stories | 4 / 21 |
| Stories citing ≥ 1 FR | 19 |
| Enabler stories (architecture-derived) | 2 |

---

## Step 4 — UX Alignment Assessment

### UX Document Status

**Not Found — and correctly so.** Assessed rather than assumed, per this step's rule *"don't assume UX is not needed."*

### Is UX/UI implied? (tested, not asserted)

| Test | Result |
|---|---|
| UX document for this initiative | None. The only `*ux*.md` in `planning-artifacts/` is `epic-skill-portability-ux.md` — a different initiative. |
| UI-related vocabulary across all 3 artifacts (`web app`, `mobile`, `browser`, `screen`, `button`, `frontend`, `GUI`, `wireframe`, `responsive`, `CSS`, `React`) | **0 occurrences in all three documents** |
| Explicit declaration in PRD | `NFR §359`: *"Scalability and Accessibility are N/A (not a hosted service; CLI/content tool, no UI)"* |
| Explicit declaration in Epics | `§113-115`: *"UX Design Requirements — None — no UI; Convoke is content + CLI/slash-command tooling"* |

**Conclusion: no visual UI is implied.** A zero-hit sweep for UI vocabulary across ~1,200 lines of planning material is strong negative evidence, not an assumption.

### But there *is* an operator-experience surface — and it is governed

The absence of a *UX document* must not be read as the absence of *operator-experience requirements*. This initiative has a substantial operator-facing surface:

| Requirement | Operator-facing concern |
|---|---|
| FR4 / NFR12 | cadence status renders in a **fixed, parseable shape** |
| FR5 | channel/floor ops through the **conversational skill surface** |
| FR13 | migration failure yields a **next-action message, not a bare error** (OC-R6) |
| FR15 / FR16 | skills **halt and wait** at decision points; activation self-confirms (OC-R5) |
| MO7 class ③ | **output format/schema** is a tracked regression class |

**The architecture treats this explicitly as UX.** `AD7 — Slash-Command Surface` is annotated ***(E4 UX)*** in the architecture itself, and specifies a Covenant-compliant surface (defaults, pause, rationale) wrapping a tested CLI. `AD6` homes cadence observability.

**The governing standard exists and is declared.** Verified this run:

| Artifact | Covenant declared | Checklist declared |
|---|---|---|
| PRD | ✓ | ✓ |
| Epics | ✓ (×2) | ✓ (×2) |
| Architecture | ✓ | ✓ |

Both files exist on disk (`convoke-covenant-operator.md` 17 KB; `convoke-spec-covenant-compliance-checklist.md` 101 KB). **r1's C2 fix holds.**

**Assessment: UX-as-visual-design is genuinely N/A; UX-as-operator-experience is covered by the Operator Covenant + Compliance Checklist, architecturally homed in AD6/AD7, and enforced as MVP scope by Epic 3.** For this project the Covenant *is* the UX specification — which is the whole Blue Ocean thesis, not a documentation shortcut.

### Alignment Issues

**None between UX, PRD, and Architecture** — the operator-facing requirements above each have an architectural home (AD6, AD7) and an epic (Epic 1 Stories 1.5/1.10; Epic 2 Story 2.2; Epic 3).

### ⚠️ Incidental finding — architecture never absorbed FR11b

Discovered while verifying architectural support for the operator-facing surface (in scope for this step's *"verify architecture supports requirements"* check):

| Artifact | `FR11b` mentions |
|---|---|
| PRD | 1 *(canonical definition, added by r1 finding C1)* |
| Epics | 5 *(Story 2.4 + coverage map + inventory)* |
| **Architecture** | **0** |

The architecture's FR→component table reads **`FR11-14 (schema migration)`**, which by literal reading excludes `FR11b`. The architecture also contains **zero** mentions of `team-factory`, `non-conformant`, or `13-column` — so it never absorbed the E2 scope split at all.

**Why it matters more than a notation nit.** The epics themselves argue FR11b is materially different in kind from FR11 — *"different operation, different risk"*, a **semantic column mapping** rather than a 1:1 rename, with three source columns (`sequence`, `agent`, `options`) having no canonical target, and a failure mode described as *"a working but wrong menu rather than a crash."* That is precisely the class of decision an architecture is supposed to home. Story 2.4 currently carries that design detail alone.

**Why it is nonetheless Minor, not Major.** FR11b's component home is unambiguous by inclusion — it lands on the same `migrations/<ver>-module-help-schema.js` + `migration-safety.js` pair as FR11-14 — and AD3 already covers its *safety* path (Story 2.4's third AC routes it through the migration-safety contract). Story 2.4 is also unusually well-specified (5 ACs, an explicit OC-R5 confirmation gate for dropped columns). Nothing is unimplementable; the architecture is simply one requirement out of date.

**Recommendation.** Amend the architecture's FR→component row `FR11-14` → **`FR11, FR11b, FR12-14`**, and add one line homing the conversion's column-semantics mapping. ~2 minutes.

**Process observation (the more useful finding).** FR11b was added to the **PRD** on 2026-08-09 and to the **epics** on 2026-08-09, and the **architecture was amended twice on 2026-08-09** (M1 resolution, M2 spike) — and FR11b never propagated to it through either round. A three-document chain stayed inconsistent across two amendment passes because each pass was scoped to its own finding. Worth a propagation check whenever an FR is added mid-flight, rather than trusting that same-day edits will converge.

### Warnings

- **No UX document** — assessed as **N/A with rationale**, not a gap. Recorded so a future reviewer can challenge the judgment rather than find it silently assumed.
- **FR11b absent from the architecture** — Minor; see above.

---

## Step 5 — Epic Quality Review

Validated against `create-epics-and-stories` standards. Dependency and AC-structure checks were run **mechanically** (parsing every story block) rather than by inspection — the method distinction turns out to matter, see M3-r2 below.

### Epic Structure Validation

#### A. User-value focus — ✅ PASS (4/4)

| Epic | Title | Goal statement | Verdict |
|---|---|---|---|
| 1 | Managed Currency & the Cadence Floor | *"Operators gain control over their BMAD currency: pin a compat-floor, choose a channel…"* | ✅ user outcome |
| 2 | Schema Conformance Absorption | *"Operators' installs stay conformant… migrated cleanly, with behavioral-parity verification and Covenant-compliant failure messaging"* | ✅ user outcome |
| 3 | Enforced Operator Covenant | *"Operators never silently lose a decision"* | ✅ user outcome |
| 4 | Marketplace Discoverability | *"Operators discover and install Convoke via the marketplace (or the verified BYO-URL floor)"* | ✅ user outcome |

**No technical-milestone epics.** Every epic names what an operator can do. Epic 2's *title* is the most technical-sounding of the four, but its goal statement is properly user-framed — noted, not flagged.

#### B. Epic independence — ✅ PASS

Exactly one inter-epic dependency is declared: **Epic 2 → Epic 1's AD3 migration-safety contract** (`§136`). That is **backward** and therefore legal. No epic requires a later epic; no circular dependencies. Epic 3 and Epic 4 are independent of Epics 1–2 entirely.

*Improvement since r1:* Epic 3's `blocked-on: external Epic 1B` gate — the only external dependency in the chain — was cleared this same day by the M2 decoupling spike. Epic independence is now clean **internally and externally**.

### Story Quality Assessment

#### A. Forward dependencies — ✅ PASS (zero)

Mechanical scan of all 21 story blocks for references to a **later** story or a **later** epic: **0 violations.** Story ordering is sound — e.g. Story 1.3 bootstraps the `convoke-cadence` CLI *before* Story 1.5 consumes `convoke-cadence status`, and Epic 2 declares Epic 1's AD3 rather than anticipating it.

#### B. BDD structure — ✅ PASS (21/21)

Every story uses `**Given** … **When** … **Then**`. `Given` count equals `Then` count in all 21 stories — no malformed or truncated criteria.

#### C. Brownfield handling — ✅ PASS

Architecture specifies **no starter template**, and the epics encode it explicitly: *"No starter template (brownfield). First implementation story = 'extend `scripts/update/lib/` with the cadence module,' NOT a project init."* Story 1.1 conforms — it extends existing tooling. Correct for a brownfield project; a greenfield-style init story here would have been the defect.

### 🟠 Major Issues

**M3-r2 — AC thinness is substantially broader than r1 reported, and includes the differentiator's core story.**

r1's finding M3 named **three** stories with a single happy-path AC (1.5, 1.8, 1.9). Mechanical enumeration finds **11 of 21 stories** carry exactly one AC:

| Story | Single-AC | Load-bearing? | r1 flagged? |
|---|---|---|---|
| 1.5 Cadence status | ✔ | NFR12 — *"a policy you can't observe isn't binding"* | ✅ yes |
| 1.8 Breaking-change protocol | ✔ | FR8, Journey 4 failure path | ✅ yes |
| 1.9 Fork/ancient-pin re-entry | ✔ | Journey 5 — *"strongest possible evidence the floor works"* | ✅ yes |
| **3.2 OC-R5 enforcement retrofit** | ✔ | **FR15+FR16 — the MVP differentiator's central implementation story** | ❌ **missed** |
| **3.3 Authoring-time durability check** | ✔ | **FR26 — what makes E7 durable against regression** | ❌ **missed** |
| 2.2 OC-R6 failure messaging | ✔ | *is itself* the failure path — single AC defensible | — |
| 3.1 Enumerate pause-point skills | ✔ | mechanical enumeration — defensible | — |
| 3.4 Covenant re-audit | ✔ | AC is measurable (≥82%, no Right drops) — defensible | — |
| 4.1 / 4.2 / 4.3 | ✔ | Phase-2, deferred — lower urgency | — |

**AC density:** 37 ACs across 21 stories — **median 1**, mean 1.76, range 1–5. r1's m2 called this inconsistency "partly by design"; the design defence holds for enumeration and Phase-2 stories, but not for 3.2 and 3.3.

**Story 3.2 is the sharp one.** It is the implementation heart of the release's declared differentiator, and its sole AC is happy-path: *"Given an enumerated pause-point skill, When retrofitted per ADR-001, Then the agent self-confirms… And the skill halts and waits."* Nothing specifies what happens when a skill **cannot** be retrofitted, how the halt is **verified** rather than asserted, or what the operator sees on partial retrofit. For an epic whose PRD framing is *"the operator never silently loses control,"* a story that cannot fail is a story that cannot prove it succeeded.

**Story 3.3** has a live unspecified decision: it says CI "flags" a non-compliant skill, but not whether flagging **blocks** or **warns**. `project-context.md`'s `preflight-soft-warn` rule mandates warn-and-exit-0 for preflights — if that norm extends here, a durability check that never blocks cannot prevent regression, which is its entire purpose. The AC must resolve block-vs-warn.

**Recommendation.** Extend r1's M3 remediation from 3 stories to **5** — add a failure-path AC to **3.2** and **3.3** at story-creation, alongside 1.5/1.8/1.9. All five failure modes are governed by **OC-R6** (next-action, not bare error), so the remediation pattern is uniform.

*Method note: r1 missed 3.2 and 3.3 because AC density was assessed by reading rather than counting. This is a live instance of `mechanical-research-enumeration` — the same rule that surfaced the second `module-help.csv` (FR11b) and the `_bmad/bme/` grep result in the M2 spike. Three separate findings in one initiative traceable to enumerate-don't-eyeball.*

**S1 — Story 3.2 is plausibly epic-sized, and unbounded at authoring time.**

Story 3.2's scope is *"every enumerated pause-point skill"* — a denominator **produced by Story 3.1**, so it is undefined until 3.1 runs. The candidate surface in `_bmad/bme/` today:

| Surface | Count |
|---|---|
| `SKILL.md` files | 14 |
| `workflow.md` files | 38 |
| agent definitions | 24 |
| total `.md` | 317 |

Even if only a fraction carry OC-R5 pause points, a per-skill retrofit across up to 14 skills / 38 workflows under **one** acceptance criterion is not a story — it is an epic wearing a story's clothes.

**Mitigating context:** the epics document states plainly that it is *"commitment-locking plan-ahead, not implementation-ready,"* and Story 3.1 exists precisely to produce the denominator. So this is correctly *sequenced*; it is the **sizing** that must not survive into sprint-planning unexamined.

**Recommendation.** At story-creation, after 3.1 produces the enumeration, **split 3.2 by skill or skill-group** with per-unit ACs. Flag now so the split is a planned step rather than a discovery made mid-sprint.

### 🟡 Minor Concerns

- **m1-r2 — FR11b absent from the architecture.** Carried from Step 4. The arch's FR→component row reads `FR11-14`, and the architecture has zero mentions of FR11b, `team-factory`, `non-conformant`, or `13-column`. Component home is unambiguous by inclusion; ~2-minute fix.
- **m2-r2 — Epic 2's title is the one technical-sounding label** ("Schema Conformance Absorption") in an otherwise user-framed set. Goal statement is properly user-centric, so this is cosmetic.

### Best-Practices Compliance Checklist

| Check | Epic 1 | Epic 2 | Epic 3 | Epic 4 |
|---|---|---|---|---|
| Delivers user value | ✅ | ✅ | ✅ | ✅ |
| Functions independently | ✅ | ✅ (backward dep on E1) | ✅ | ✅ |
| Stories appropriately sized | ✅ | ✅ | ⚠️ **3.2 (S1)** | ✅ |
| No forward dependencies | ✅ | ✅ | ✅ | ✅ |
| Clear acceptance criteria | ⚠️ 1.5/1.8/1.9 | ✅ | ⚠️ **3.2/3.3** | ⚠️ Phase-2 thin |
| Traceability to FRs maintained | ✅ | ✅ | ✅ | ✅ |
| Brownfield handling correct | ✅ | ✅ | ✅ | ✅ |

*(Database/entity-creation timing: **N/A** — Convoke has no database. Recorded as a declared N/A rather than a silent skip.)*

### Quality Exemplar (worth preserving)

**Story 2.4** — the story added on 2026-08-09 — is the quality standard the thin stories should be measured against: 5 ACs covering the happy path, an explicit **OC-R5 operator-confirmation gate** for dropped columns, an AD3 safety-routing requirement, a targeted parity check naming the specific MO7 regression class at risk (menu-code availability), an OC-R6 failure path, and a written risk note identifying the failure mode as *"working but wrong"* rather than a crash. It demonstrates that thin ACs elsewhere are a **choice**, not a house style.

---

## Step 6 — Summary and Recommendations

### Independent re-verification of the r1→r2 amendments

The two findings that made r1 **NEEDS WORK** were cleared by amendments authored by this same agent. Rather than accept that prose, each underlying claim was re-tested against source **in this run**:

| Claim | Re-verified | Result |
|---|---|---|
| **M2** — Story 1B.3's acceptance grep passes, so the 1B gate cannot bind Epic 3 | `grep -rnwE "Bob\|Quinn\|Barry" _bmad/bme/` | **0 matches** ✅ |
| **M1a** — `loadModuleConfig` has no production callers (so the "frozen API" cost was theoretical) | `grep -rn loadModuleConfig scripts/ index.js`, excluding self | **0 callers** ✅ |
| **M1b** — the API resolves to the *wrong file* for cadence state | `config-loader.js:115` | `path.join(bmadRoot, moduleConfigPath, 'config.yaml')` ✅ |
| **M1c** — the internals option (a) proposed delegating to are private | `config-loader.js:336` | `module.exports = { loadModuleConfig }` ✅ |

**All four hold.** The verdict below does not rest on the assessor's own narrative.

### Overall Readiness Status

## ✅ READY — for sprint-planning, with two mandatory story-creation conditions

**What changed since r1 (NEEDS WORK).** r1's disqualifier was specific and structural: *"Story 1.1 — the first story of the first epic, on the critical path — cannot be implemented as written."* That condition is gone. Story 1.1 now has three ACs, all implementable, and the AD8 boundary it depends on is structurally rather than conventionally enforced. Epic 3's external gate — the chain's only unbounded dependency — is cleared and re-verified.

**What READY means here, precisely.** The next gate for this chain is **sprint-planning**, not implementation; the whole initiative remains `depends: I97 close (v4.0 ship)`, and the epics document declares itself *"commitment-locking plan-ahead, not implementation-ready."* This assessment finds the chain sound **for that gate**. It is **not** a finding that all 21 stories are implementation-ready — Story 3.2 demonstrably is not, and says so below.

### Findings — 4 total (0 Critical · 2 Major · 2 Minor)

| ID | Severity | Finding | Remediation |
|---|---|---|---|
| **M3-r2** | 🟠 Major | AC thinness broader than r1 reported: **11 of 21** stories carry a single AC (r1 named 3). The two missed — **3.2** (differentiator's core implementation) and **3.3** (E7's durability gate) — are load-bearing MVP stories with happy-path-only ACs. 3.3 additionally leaves **block-vs-warn unresolved**, which decides whether the check can prevent regression at all. | Add a failure-path AC to **5** stories (1.5, 1.8, 1.9, **3.2**, **3.3**) at story-creation. All five failure modes are OC-R6-governed, so the pattern is uniform. |
| **S1** | 🟠 Major | **Story 3.2 is plausibly epic-sized and unbounded at authoring time.** Scope = "every enumerated pause-point skill," a denominator produced by Story 3.1. Candidate surface: 14 `SKILL.md`, 38 `workflow.md`, 24 agents. One AC. | After 3.1 produces the enumeration, **split 3.2 by skill or skill-group** with per-unit ACs. Plan the split; don't discover it mid-sprint. |
| **m1-r2** | 🟡 Minor | **Architecture never absorbed FR11b.** PRD 1 mention, epics 5, **arch 0** — and zero mentions of `team-factory`, `non-conformant`, or `13-column`. FR→component row reads `FR11-14`. | Amend the row to `FR11, FR11b, FR12-14`; add one line homing the column-semantics mapping. ~2 min. |
| **m2-r2** | 🟡 Minor | Epic 2's title ("Schema Conformance Absorption") is the one technical-sounding label in an otherwise user-framed set. Goal statement is properly user-centric. | Cosmetic. Optional. |

### What is verified sound

| Dimension | Result |
|---|---|
| FR coverage | **27/27 = 100%** — mechanical per-story scan at the corrected denominator; FR11b independently confirmed covered by Story 2.4 |
| FRs in epics but not PRD | **0** — the r1 C1 defect class does not recur |
| Forward dependencies | **0** across all 21 stories |
| Epic independence | Clean — one dependency (Epic 2 → Epic 1 AD3), backward and legal |
| External gates | **None remaining** — Epic 3's 1B gate cleared and re-verified |
| BDD structure | 21/21 conformant; `Given` count = `Then` count in every story |
| Technical-milestone epics | 0 — all four epics state operator outcomes |
| Brownfield handling | Correct — no starter-template story; Story 1.1 extends existing tooling |
| Covenant declared as input | ✅ in all three artifacts (r1's C2 fix holds) |
| UX | N/A with rationale — 0 UI-vocabulary hits across ~1,200 lines; operator experience governed by the Covenant, homed in AD6/AD7 |

### Critical Issues Requiring Immediate Action

**None.** No finding blocks sprint-planning. Both Majors are story-creation-time work, and story-creation is the next activity for each affected story.

### Recommended Next Steps

1. **Amend the architecture for FR11b** (m1-r2) — 2 minutes, and it closes a three-document inconsistency that survived two same-day amendment rounds.
2. **At sprint-planning, treat S1 as a required agenda item** — Story 3.2's split is a planning decision, not an implementation detail. It is the single largest sizing unknown in the chain.
3. **At story-creation, apply M3-r2's five-story AC remediation** — 1.5, 1.8, 1.9, 3.2, 3.3. Use **Story 2.4** as the template; it is the chain's quality exemplar (5 ACs, explicit OC-R5 gate, named parity class, OC-R6 failure path, written risk note).
4. **Adopt a propagation check when an FR is added mid-flight.** FR11b reached the PRD and epics but not the architecture, despite the architecture being edited twice the same day. Each amendment pass was correctly scoped to its own finding and collectively they left the chain inconsistent.

### Process observation worth carrying forward

Three distinct findings in this initiative trace to the same root: **enumerate, don't eyeball.**

- The second `module-help.csv` (→ FR11b / Story 2.4) — found by glob, missed by expectation.
- The M2 decoupling verdict — decided by a grep returning 0, after seven weeks of the question sitting open.
- **M3-r2 itself** — r1 assessed AC density by reading and found 3 thin stories; counting found 11, including the differentiator's core story.

`project-context.md`'s `mechanical-research-enumeration` rule is earning its place. The r1→r2 delta is largely the difference between reading artifacts and measuring them.

### Assessor Independence

The agent conducting this assessment (**Winston**) authored the M1 and M2 amendments under review. Mitigations applied: every load-bearing claim in those amendments was **re-tested against source in this run** (see table above), and the coverage matrix was rebuilt mechanically at the corrected denominator rather than carried forward from r1.

The residual risk is one of framing, not fact: an independent reviewer might weigh S1 or M3-r2 as sufficient to withhold READY. That reading is defensible, and the evidence to make it is recorded above rather than summarized away.

### Final Note

This assessment identified **4 issues across 3 severity categories** (0 Critical, 2 Major, 2 Minor) — down from r1's 10 (0 Critical, 5 Major, 3 Minor, 2 Info). **Both r1 Major blockers are closed and independently re-verified.** No finding blocks the next gate. The two Major findings are named conditions on story-creation, not open questions requiring an operator decision — for the first time in this chain's history, **no decision is owed by the operator.**

---

**Assessed by:** Winston (System Architect) · **Date:** 2026-08-09 · **Run:** r2
**Supersedes:** `convoke-report-implementation-readiness-bmad-v6.4-v6.8-absorption-2026-08-09.md` (r1, NEEDS WORK)
