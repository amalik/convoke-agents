# Story 2.1: Retrofit T1-Firing Cells (Vortex × Right to pacing)

Status: backlog — **story file is complete; blocked on T88.** See the banner below. Deviation from STATUS DEFINITIONS (`backlog` normally means "story only exists in epic file") follows the documented `tf-2-11` precedent of 2026-04-22: the file is ready, a gate makes it non-actionable, and `backlog` stops it auto-surfacing as the next `dev-story` pick. Promote to `ready-for-dev` when T88 closes.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [P21 Convoke Operator Covenant — Epic 2: Adopt & Publish](../planning-artifacts/convoke-epic-operator-covenant.md)
**Story key:** `oc-2-1-retrofit-bottleneck-skills`
**Created:** 2026-08-28 · **Portfolio:** convoke · **Namespace:** `_bmad/bme/` (Convoke-owned)

> ## ⛔ BLOCKED ON T88 — read before starting
>
> **The retrofit design in this story is unsafe until T88 ships.** Proven 2026-08-28 by `scripts/audit/try-fresh-install.sh` (`KEEP=1`): a fresh 4.0.1 install contains only `agents/`, `config.yaml`, `guides/`, `workflows/` under `_bmad/bme/_vortex/`. **`contracts/` is never copied into an operator's project** — it exists only inside `node_modules/convoke-agents/`. 16 shipped step files already point at `{project-root}/_bmad/bme/_vortex/contracts/hc*N*-….md`, a path no operator has.
>
> This story's design replaces inline schema enumeration with **exactly that pointer**. Landing it before T88 would fix the pacing violation by making the schema unreachable — the Covenant failing on its own terms.
>
> **Do not start Task 3 until T88 is closed.** If T88 is resolved by repointing references instead of copying `contracts/`, re-read §Resolved Design Decision — the retrofit shape changes with it.

> **Why this story exists now.** It has been startable since 2026-04-19 and nobody read the line that said so. `convoke-epic-operator-covenant.md:202` states **"Story 2.1 independent of others"**; the Publication Gate (FR17) blocks **Story 2.3 only**. P21's Stage cell said "Epic 2 deferred" for four months, naming blockers (`IN-12`, Loom Phase 3) that were never Story 2.1's. Corrected 2026-08-27 in `620f888f`; see **T86**.

---

## Story

As an operator running Convoke's Vortex workflows,
I want the step-01 surfaces that fire T1 on **Right to pacing** to introduce ≤ 3 novel concepts per interaction round,
so that the Covenant's central claim is true of Convoke's own primary shipped surface before it is published — and so that a first-time operator meets a question about their problem instead of a schema recital.

---

## Acceptance Criteria

Derived from [Epic Story 2.1 ACs](../planning-artifacts/convoke-epic-operator-covenant.md) (cell-centric per A41+A42, 2026-04-25). AC numbering below is this story's; epic AC wording is preserved in intent.

**AC0 — T88 is closed before implementation begins.**
*Given* the retrofit routes the operator to `contracts/hc*N*-….md` instead of enumerating the schema
*When* the design is applied
*Then* that path must resolve in a real operator install. **It does not today** — see T88. AC0 is satisfied by T88 closing, verified by re-running `bash scripts/audit/try-fresh-install.sh` and confirming `contracts/` is present in the installed `_bmad/bme/_vortex/` tree. **Not by reading the copy logic** — the logic was read first and the install proved it.

**AC1 — Scope is the 11 T1-firing cells, enumerated.**
*Given* the audit matrices of A24 (`Vortex N=4`) and A26 (`HC-cluster N_effective=9`)
*When* T1-firing cell-rows are identified per A30 (`fail_rate > 30% at N_effective ≥ 3`)
*Then* the retrofit scope is exactly the **11 cells in §Cell Catalog below** — `R7-V1`..`R7-V11` — each named by its cell-mechanism per the A39 naming convention. No cell is added or dropped without an audit citation.

**AC2 — Mechanism (i) cells close via one shared construct.**
*Given* the 9 mechanism (i) cells
*When* they are retrofitted
*Then* they are closed through a **single shared scaffold** (contract-name parametrized), **not** 9 independently hand-written splits. Its location is constrained — see §Hard structural constraint item 4. Divergence between the 9 implementations is a defect.

**AC3 — Mechanism (ii) cells close via per-workflow patches.**
*Given* the 2 mechanism (ii) cells (`R7-V5` lean-experiment, `R7-V9` proof-of-value)
*When* they are retrofitted
*Then* each is split across sub-rounds per its catalog entry. **These are NOT template-closable** — see §Correction to A26 §10.

**AC4 — Each retrofitted cell passes OC-R7 on re-score.**
*Given* each retrofitted cell-mechanism
*When* re-scored against OC-R7 under the **current v5.1 rubric** (`§A41-2` as scoped by A46, `§A41-14` Layer 1, `§A41-5` reading commitment)
*Then* every operator-input round in the retrofitted surface introduces ≤ 3 novel concepts, and the count is stated in a `Concept count: N/3` footer.

**AC5 — No per-cell regression, anywhere in the matrix.**
*Given* the retrofits
*When* the audit matrix is re-evaluated across **all** (team × Right) cells — not only R7
*Then* **no previously-passing cell regresses to FAIL**. The baseline is **per-cell**, not per-skill or per-right: a retrofit fixing `R7-V4` must not flip `R1` on `pattern-mapping`. Cell-level regressions block closure.
⚠️ **R1–R6 currently PASS at 100% across all 9 HC-cluster workflows** (A26 §1). That is the regression surface. Splitting a step is exactly the kind of change that drops a `HALT` marker (R5) or a fallback sentence (R1).

**AC6 — Cascade termination.**
*Given* the retrofit is complete
*When* the matrix is re-evaluated
*Then* **no new T1-firing cells are introduced by the retrofit itself**. If the split introduces a new round that itself exceeds budget, the cycle continues on that cell.

**AC7 — Covenant self-compliance.**
*Given* the new `step-01-receive-contract.md` lands under `_bmad/bme/` (Convoke's owned namespace)
*When* it is authored
*Then* the author has read [The Convoke Operator Covenant](../planning-artifacts/convoke-covenant-operator.md) and self-checked the deliverable against the [Compliance Checklist](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md) OC-R0..OC-R7, per `project-context.md` rule `covenant-compliance-for-convoke-skills`. OC-R0's enumeration precondition is satisfied first.
*This is not ceremony:* the artifact whose purpose is fixing a Covenant violation must not itself violate the Covenant.

**AC8 — Non-blocking carry-forward is declared, not silently dropped.**
*Given* oc-1-1 §9.1 retrofit **#4** (`lean-persona` step-01-define-job × Right to pacing)
*When* scope is closed
*Then* #4 is either retrofitted or explicitly recorded as deferred with rationale. It is a **non-T1-firing** cell — `convoke-epic-operator-covenant.md:369`: *"v1 baseline result: No trigger fires"* — so per FR17 it is *not* a publication blocker — but silence is not a decision.

---

## Tasks / Subtasks

- [ ] **Task 0 — Confirm T88 is closed (AC: 0)** — *hard gate; everything below is void if this fails.*
  - [ ] `bash scripts/audit/try-fresh-install.sh` → inspect the installed tree, confirm `_bmad/bme/_vortex/contracts/` exists.
  - [ ] If T88 shipped by repointing references rather than copying, STOP and re-read §Resolved Design Decision — the retrofit shape changes.

- [ ] **Task 1 — Read before writing (AC: 1, 5)**
  - [ ] Read all 12 target step files in full (paths in §Cell Catalog). Do not skim.
  - [ ] For each, record: which section carries the schema enumeration, what the fallback sentence is (R1 evidence), where the wait marker is (R5 evidence), what the `## Next Step` pointer says.
  - [ ] ⚠️ The enumeration section heading is **not uniform**: `### 3. Input Validation` (6 files), `### 3. Input Assessment` (pattern-mapping), `### 3. Validate Your Artifacts` (pivot-resynthesis), `### 3. Per-Experiment Input Validation` (production-monitoring). A blind find/replace misses 3 of 7.

- [ ] **Task 2 — Verify the structural constraint still holds (AC: 2)**
  - [ ] **Already settled — see §Resolved Design Decision.** Read it before writing anything; it is settled by `validator.js` P17/P20, not by taste.
  - [ ] Confirm the constraint still holds: `ls _bmad/bme/_vortex/workflows/*/steps/*.md | wc -l` per workflow, and re-read `scripts/update/lib/validator.js:475-487`. If the cap has changed since 2026-08-28, re-open the decision.

- [ ] **Task 3 — Author the shared scaffold (AC: 2, 4, 7)** — *location constrained, see §Hard structural constraint item 4*
  - [ ] ⛔ **NOT** `_bmad/bme/_vortex/templates/` — that directory is never copied into an operator project. Place the scaffold inside a copied path, or land it as part of T88's copy-phase fix.
  - [ ] Round 1 = receive the input (path or description). Round 2 = validate against the named contract schema.
  - [ ] Each round carries a `Concept count: N/3` footer. **Reuse the existing convention, do not invent one** — see `_bmad/bme/_team-factory/workflows/add-team/step-01-scope.md:104` and siblings.
  - [ ] Self-check against OC-R0..OC-R7 (AC7).

- [ ] **Task 4 — Apply to the 9 mechanism (i) cells (AC: 2, 4, 5)**
  - [ ] `R7-V1` assumption-mapping · `R7-V2` hypothesis-engineering · `R7-V3` behavior-analysis · `R7-V4` experiment-design · `R7-V6` pattern-mapping · `R7-V10` research-convergence · `R7-V11` signal-interpretation — straight parametrization.
  - [ ] `R7-V7` pivot-resynthesis — **dual-schema variant** (HC1 + HC4 as separate sub-rounds).
  - [ ] `R7-V8` production-monitoring — **portfolio-iteration variant** (HC4 per-experiment sub-rounds).
  - [ ] For each: preserve the non-conforming fallback sentence verbatim (R1) and the wait marker (R5). **Do NOT rename the file, add a step file, or touch `## Next Step` / `## Steps Overview` / `Load step:`** — see §Hard structural constraint.

- [ ] **Task 5 — Patch the 2 mechanism (ii) cells (AC: 3, 4, 5)**
  - [ ] `R7-V5` lean-experiment `step-01-hypothesis.md` — split Hypothesis Statement Check + Falsifiability Check across ≥2 sub-rounds.
  - [ ] `R7-V9` proof-of-value `step-01-value-hypothesis.md` — split Value Hypothesis Canvas + Riskiest Value Assumption + sentence template across ≥3 sub-rounds.

- [ ] **Task 6 — Re-score and prove no regression (AC: 4, 5, 6)**
  - [ ] Re-score OC-R7 on all 11 cells under v5.1. Record counts.
  - [ ] Re-score **R1–R6** on all 9 HC-cluster workflows + the 2 A24 workflows. Any PASS→FAIL blocks closure.
  - [ ] Confirm no new T1-firing cell was introduced.

- [ ] **Task 7 — Decide #4 lean-persona (AC: 8)**

- [ ] **Task 8 — Close the row and the story in the same session**
  - [ ] Update `sprint-status.yaml`. Per `project-context.md` and the T55/T79 lesson: **a fix is not a close.** `backlog-integrity.js`'s owed-close scan will flag a `fix(oc-2-1)` commit against an unclosed row.

---

## Dev Notes

### Cell Catalog — the 11 T1-firing cells (authoritative)

| Cell | Workflow | File | Mechanism | Retrofit |
|---|---|---|---|---|
| `R7-V1` | assumption-mapping | `steps/step-01-setup.md` (66 L, §3 @ `:32`) | (i) HC3 | template |
| `R7-V2` | hypothesis-engineering | `steps/step-01-setup.md` (66 L, §3 @ `:31`) | (i) HC2 | template |
| `R7-V3` | behavior-analysis | `steps/step-01-setup.md` (81 L, §3 @ `:31`) | (i) HC4 | template |
| `R7-V4` | experiment-design | `steps/step-01-setup.md` (66 L, §3 @ `:32`) | (i) HC3 | template |
| `R7-V5` | lean-experiment | `steps/step-01-hypothesis.md` (58 L, §3 @ `:31`) | **(ii)** | per-workflow, ≥2 rounds · **at 6-step cap** |
| `R7-V6` | pattern-mapping | `steps/step-01-setup.md` (102 L, §3 @ `:56`) | (i) HC1 | template |
| `R7-V7` | pivot-resynthesis | `steps/step-01-setup.md` (97 L, §3 @ `:37`) | (i) **dual** HC1+HC4 | template, dual-schema variant |
| `R7-V8` | production-monitoring | `steps/step-01-setup.md` (84 L, §3 @ `:40`) | (i) **iteration** HC4 | template, portfolio variant |
| `R7-V9` | proof-of-value | `steps/step-01-value-hypothesis.md` (75 L, §3/§4/§5 @ `:33`/`:47`/`:53`) | **(ii)** | per-workflow, ≥3 rounds · **at 6-step cap** |
| `R7-V10` | research-convergence | `steps/step-01-setup.md` (69 L, §3 @ `:33`) | (i) HC1 | template |
| `R7-V11` | signal-interpretation | `steps/step-01-setup.md` (68 L, §3 @ `:31`) | (i) HC4 | template |

All paths relative to `_bmad/bme/_vortex/workflows/`. **All 12 files (11 + lean-persona) verified present 2026-08-28.**

**Non-blocking carry-forward:** `#4` lean-persona `steps/step-01-define-job.md` (72 L, **at 6-step cap**) — oc-1-1 §9.1 pattern: split into "Define the job" (JTBD + name, 2 concepts) and "Characterize the job" (frequency + importance + evidence, 3 concepts).

### ⚠️ Correction to A26 §10 — its own arithmetic is inconsistent

`convoke-report-operator-covenant-audit-vortex-hc-cluster-2026-04-26.md:§10` states:

> "Total Story 2.1 mechanism (i) retrofit cells: 9 (A26) + 2 (A24) = **11 closed by single shared template**… Plus #4 lean-persona = **14 total**."

**That is wrong, and its own table proves it.** A26's catalog has 9 rows, of which only **7** are mechanism (i) (`R7-V3, V4, V6, V7, V8, V10, V11`); `R7-V5` and `R7-V9` are labelled mechanism (ii) — *"per-workflow patches needed"* — in the same report at `:24`. So:

- Mechanism (i) = 7 (A26) + 2 (A24) = **9**, not 11.
- Mechanism (ii) = **2**.
- **11 total T1-firing cells** — the right number, but it is *not* "11 closed by a single shared template".
- Grand total including non-T1 #4 = **12**, not 14.

**Consequence if uncaught:** the dev agent tries to close `R7-V5` and `R7-V9` with the template, which the same report says cannot work. **Do not trust §10's summary paragraph; trust its table and `:21-24`.**

*This discrepancy is reported to the operator as an open question (below) — the audit is shipped and closed, and amending it is a governance action, not a dev action.*

### The defect, in the operator's words

`assumption-mapping/steps/step-01-setup.md:32-50` — verified live 2026-08-28, unchanged since the 2026-04-19 audit:

> **HC3 Frontmatter Check:** `contract: HC3` · `type: artifact` · `source_agent` · `source_workflow` · `target_agents: [wade]` · `input_artifacts` · `created`
> **HC3 Body Section Check:** Problem Context · Hypothesis Contracts · Assumption Risk Map · Recommended Testing Order · Flagged Concerns

Seven frontmatter fields and five body sections — **12 novel concepts** — before the operator has been asked one question about their actual problem. Budget is 3.

### File anatomy (uniform across the 9 mechanism (i) targets)

```
frontmatter (step / workflow / title)
# Step 1: Setup & Input Validation
## Why This Matters          <- rationale (R3 evidence — PRESERVE)
## Your Task
  ### 1. What <X> Do You Have?
  ### 2. Provide Your Input
  ### 3. Input Validation     <- THE DEFECT (heading varies, see Task 1)
      "If your input is non-conforming: That's okay…"  <- R1 fallback (PRESERVE VERBATIM)
  > For the full schema reference, see .../contracts/hcN-*.md
## Your Turn                  <- R5 implicit-wait pattern (PRESERVE)
## Next Step                  <- pointer to step-02 (DO NOT TOUCH)
```

The `> For the full … schema reference` pointer line is the model for the retrofit: it already demonstrates *reference-instead-of-enumeration*. The retrofit generalises what one line already does.

### Reuse target — do not invent a footer convention

`Concept count: N/3` exists and is the Loom add-team pattern that oc-1-1 §9.2 named as the canonical good example:

- `_bmad/bme/_team-factory/workflows/add-team/step-01-scope.md:104` → `Concept count: 3/3 (team identity, pattern, agents)`
- `…/step-02-connect.md:109` → `Concept count: 2/3 (contracts, integration settings) — or 1/3 for Independent (integration only)`
- `…/step-03-review.md:115`, `…/step-04-generate.md:159`, `…/step-05-validate.md:145`, `…/step-00-route.md:75`

Note the convention **names the concepts in parentheses** and **handles branch-dependent counts**. Match it exactly.

### ⛔ Hard structural constraint — this decides the design, read it first

`scripts/update/lib/validator.js` enforces the shape of every Vortex `steps/` directory, and it is unit-tested at `tests/unit/validator.test.js:486+`:

- **`:475-478` (P17)** — each `steps/` dir must hold **4–6 `.md` files**. `files.length > 6` fails validation.
- **`:483-487` (P20)** — Wave 3 workflows must contain **`step-01-setup.md` by that exact name**, plus `step-02-context.md` and a `*-synthesize.md` final step.

Current step counts:

| 4 steps | 5 steps | **6 steps — AT CAP** |
|---|---|---|
| assumption-mapping, experiment-design | hypothesis-engineering, behavior-analysis, pattern-mapping, pivot-resynthesis, production-monitoring, research-convergence, signal-interpretation | **lean-experiment (`R7-V5`), proof-of-value (`R7-V9`), lean-persona (`#4`)** |

**Consequences, and they are not negotiable:**

1. **Do not rename `step-01-*.md`.** P20 asserts the name, and every `workflow.md` loads it by path — `Load step: {project-root}/…/steps/step-01-setup.md` under `## INITIALIZATION` (e.g. hypothesis-engineering `workflow.md:52`). A rename breaks workflow startup **and** validation.
2. **Do not add a step file to the three at cap.** `lean-experiment`, `proof-of-value` and `lean-persona` are already at 6. Adding a 7th fails P17. Those are exactly the two mechanism (ii) cells plus the carry-forward.
3. **Therefore the retrofit is an IN-FILE round split, not a file split** — see §Resolved Design Decision.
4. **⛔ `_bmad/bme/_vortex/templates/` is an invalid location — do not create it.** `refresh-installation.js` copies Vortex in four phases only: agents by `AGENT_IDS` (`:57`), workflow dirs by the **`WORKFLOW_NAMES` allowlist** (`:154-176`), `config.yaml` (`:603`), guides (`:669`). A new sibling directory under `_vortex/` is copied by **nothing** — it would ship in the npm tarball and never reach a project, exactly as `contracts/` and `examples/` do today. Gyre has an explicit contracts copy block at `:446-454`; Vortex has no equivalent. **The shared scaffold must live inside a workflow directory** (those are copied wholesale at `:161-169`), or T88 must add a copy phase that covers it. Verified against a real install, not against the copy logic alone.

The A24 / oc-1-1 proposals (*"split step-01 into step-01a and step-01b"*) were written in April against a structure that cannot accept them. They describe the **intent** (two rounds), not the **mechanism**. Follow the intent.

### Blast radius — measured

- **Three touchpoints exist, not two.** (1) `workflow.md`'s `Load step:` entry pointer, (2) `## Steps Overview` prose list, (3) the preceding step's `## Next Step` path. **Under in-file splitting, none of the three changes** — which is the point.
- **No external references.** `grep -rln "step-01" _bmad/ scripts/ tests/ docs/` returns zero hits at `_vortex` workflow step files from outside their own directories.
- **`module-help.csv`** lists workflows, not step files — confirm before editing.

### Version-pinning — score under v5.1, not v3

Retrofit verification uses the **current** rubric, and it has moved materially since these audits:
- `§A41-2` multi-field contract counting — **as scoped by A46** (v5.1). A46 self-describes as *"a material scope restriction, not merely a clarification of original intent."* Markdown input tables, category checklists and sentence templates are **out of scope** for §A41-2 and count via §2.6.
- `§A41-14` Layer 1 categorization (v5+).
- `§A41-5` reading-dependent commits. **A26 committed the lenient R5 reading**; the strict `§A41-4` v4+ reading would produce a *second* bottleneck at 8/8. Do not silently adopt the strict reading mid-retrofit — that is a scope change, not an implementation detail.
- Cell-mechanism names (`R7-V1`…) are **stable referents naming the WHERE, not the verdict** (`§A41-13`).

### Namespace decision (required per `project-context.md`)

**Convoke `_bmad/bme/`.** Every target file is under `_bmad/bme/_vortex/`, and the shared scaffold lands inside that tree — location constrained by the copy loop, see §Hard structural constraint item 4. Nothing upstream (`_bmad/core/`, `_bmad/bmm/`, `_bmad/bmb/`) is touched. The Covenant is a Convoke-specific standard and explicitly does **not** apply upstream (`covenant-compliance-for-convoke-skills`, Exception clause). No boundary crossing; no escalation needed.

### Project-context rules that bind this story

| Rule | Application here |
|---|---|
| `covenant-compliance-for-convoke-skills` | AC7 — mandatory, new `_bmad/bme/` surface |
| `namespace-decision-for-new-skills` | recorded above |
| `no-hardcoded-versions` | contract names are parameters, not literals baked into the template |
| `derive-counts-from-source` | the `N` in `Concept count: N/3` must be counted, not guessed |
| `verification-must-be-falsifiable` | AC5's regression check must be able to fail — see §Testing |

### Previous-story intelligence (oc-1-5, the last shipped P21 story)

- Story 1.3 wrote ACs against **four assumed surfaces**; the reality check found only **two existed**. Amelia's lesson: *verify the target files exist before writing ACs against them.* Applied here — all 12 files verified present, line counts recorded.
- oc-1-5's Round 1 review produced patches for **wording drift** between a spec and its own template.
- Anti-pattern carried forward: *do not modify upstream namespaces.*

### Git intelligence

- `620f888f` (2026-08-27) — corrected T86 + P21; established that this story was startable. Read it for the gate reasoning.
- `6800a0b2` (2026-08-27) — a **concurrent session** was editing the backlog the same evening. Check `git status` before touching shared planning artifacts.
- Recent repo convention: `docs()` is this project's **closing** verb; `fix()`/`feat()` are shipping verbs. `backlog-integrity.js`'s owed-close scan keys on that distinction.

---

### Testing

**Structure IS tested; content is NOT.** `tests/unit/validator.test.js:486+` exercises `validateWorkflowStepStructure`, so P17 step-count and P20 filename violations fail CI. What no test covers is the thing this story is about: **concept counts, round boundaries, and whether R1-R6 still hold.** `tests/integration/vortex-parity.test.js` baselines are agent `SKILL.md` files only (`sourcePath: _bmad/bme/_vortex/agents/…`) and assert nothing about workflow steps. So: a structural mistake will be caught for you; **a pacing or regression mistake will not.** The verification that matters is the re-score (AC4/AC5), a human/agent audit pass, not a unit test. Run `node scripts/update/lib/validator.js`'s suite (`npm test`) after every file touched.

Minimum bar:
1. **The re-score must be able to fail.** Before trusting it, run it against **one un-retrofitted file** and confirm it returns FAIL. A verification that cannot come out badly has told you nothing (`verification-must-be-falsifiable`; three such checks shipped in one session on 2026-08-25).
2. **Count from source.** Concept counts are derived by reading the retrofitted file, never carried over from the audit report.
3. If a guard is added, it must obey `test-fixture-isolation` — fixture directory, `{ cwd: tmpDir }`, no assertions against live repo state or live counts.

---

## Resolved Design Decision — in-file round split (settled by the validator, not by preference)

**A26 said "shared template" and never said what that meant mechanically.** The question is now answered by a constraint rather than an opinion: **`validator.js` P17/P20 forbids both renaming `step-01-*.md` and adding a 7th step file to the three workflows at cap.** File-splitting is not available for 3 of 12 targets and puts 7 more at the ceiling.

**The retrofit is therefore two operator-input rounds inside the existing `step-01-*.md` file.** OC-R7 licenses this in its own words:

> *"An 'interaction round' = one operator-input boundary; a step file presenting N questions before pausing is one round."*

Two boundaries in one file = two rounds. The budget is per round, not per file.

**Shape (the shared construct, per option (c) — parametrized partial):**

```
### 2. Provide Your Input
    <round 1: ask for the artifact path or description>
    Concept count: N/3 (…named concepts…)
    <halt / wait marker>            <- R5 evidence, must survive

### 3. <Validation heading — VARIES, see Task 1>
    <round 2: validate against the named contract schema,
     schema referenced not enumerated — reuse the existing
     "> For the full HC3 schema reference, see …" line as the model>
    Concept count: N/3 (…)
    <non-conforming fallback sentence, PRESERVED VERBATIM>   <- R1 evidence
```

The shared scaffold holds **the invariant scaffold only** — round split, footer format, halt discipline, fallback phrasing. Each workflow supplies its own contract name and schema reference. Nothing is loaded at runtime; no new indirection enters the operator path; `Load step:` and `## Next Step` are untouched. **Its location is constrained by the copy loop, not by taste** — see §Hard structural constraint item 4. **And the whole shape depends on AC0**: "reference instead of enumerate" is only an improvement if the reference resolves.

**What this buys:** zero rename risk, zero P17/P20 exposure, and the thing that fires T1 (round structure) is under shared control while the thing that legitimately varies (the schema) stays local.

**Residual judgement left to the dev agent (small):** `R7-V7` (dual HC1+HC4) and `R7-V8` (per-experiment portfolio iteration) may need **three** rounds rather than two. Count first, then decide; do not force two.

---

## References

- [Epic — Story 2.1 ACs, FR17, `:202` independence](../planning-artifacts/convoke-epic-operator-covenant.md)
- [A24 Vortex audit §6.1 retrofit scope, §6.2 pattern, §7.1 A10 cleared 100%](../planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md)
- [A26 HC-cluster audit §4 per-cell evidence, §10 retrofit catalog *(see correction)*](../planning-artifacts/convoke-report-operator-covenant-audit-vortex-hc-cluster-2026-04-26.md)
- [oc-1-1 baseline audit §9.1 retrofit #4, §9.2 `Concept count` pattern](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md)
- [Compliance Checklist — OC-R7, Novel-Concept Glossary, §A41-2/-5/-13/-14](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md)
- [The Convoke Operator Covenant](../planning-artifacts/convoke-covenant-operator.md)
- [T86 + P21 rows — corrected blocker reading](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md)
- `project-context.md` — namespace, covenant-compliance, fixture-isolation, falsifiability rules

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
