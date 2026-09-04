# Story 2.1: Retrofit T1-Firing Cells (Vortex × Right to pacing)

Status: review — **implemented 2026-09-03; Rounds 1 and 2 run and applied (2026-09-04). Round 3 owed — Round 2's remediation added a script and a CI step, which is the structural trigger.** Unblocked 2026-08-28 when T88 shipped. AC0 satisfied: a fresh install now carries `_bmad/bme/_vortex/contracts/`, and 17 contract pointers across the installed workflow tree resolve with 0 dangling.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [P21 Convoke Operator Covenant — Epic 2: Adopt & Publish](../planning-artifacts/convoke-epic-operator-covenant.md)
**Story key:** `oc-2-1-retrofit-bottleneck-skills`
**Created:** 2026-08-28 · **Portfolio:** convoke · **Namespace:** `_bmad/bme/` (Convoke-owned)

> ## ✅ T88 CLEARED — AC0 satisfied 2026-08-28
>
> This story was blocked because its design routes the operator to `contracts/hc*N*-….md` and that directory was never copied into an operator project. **T88 fixed it** — `refresh-installation.js` phase 2b now copies `contracts/` and `examples/` into the operator project, remove-then-copy.
>
> **Verified against a real packed install, not the unit suite:** a fresh install's `_bmad/bme/_vortex/` now carries `contracts/` and `examples/` alongside `agents/`, `config.yaml`, `guides/` and `workflows/`, and **17 contract pointers resolve, 0 dangling**. Re-run `bash scripts/audit/try-fresh-install.sh` if you want to see it yourself — Task 0 tells you what to look for.
>
> **T88 was fixed by copying, not by repointing**, so §Resolved Design Decision stands unchanged: reference-instead-of-enumerate is now safe.
>
> **Task 3's location constraint STANDS — do not create `_bmad/bme/_vortex/templates/`.** An intermediate draft of T88 copied every entry at the Vortex root, which would have made that directory install. **Round 1 rejected that draft** and the shipped fix copies `contracts/` and `examples/` only. A root-level `templates/` is therefore still copied by nothing, exactly as §Hard structural constraint item 4 describes. The shared scaffold belongs inside a workflow directory, which is copied wholesale.

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

- [x] **Task 0 — Re-confirm T88's fix in your own tree (AC: 0)** — *T88 shipped 2026-08-28; this is a re-check, not a gate.*
  - [x] `bash scripts/audit/try-fresh-install.sh` → inspect the installed tree, confirm `_bmad/bme/_vortex/contracts/` exists.
  - [x] If T88 shipped by repointing references rather than copying, STOP and re-read §Resolved Design Decision — the retrofit shape changes.

- [x] **Task 1 — Read before writing (AC: 1, 5)**
  - [x] Read all 12 target step files in full (paths in §Cell Catalog). Do not skim.
  - [x] For each, record: which section carries the schema enumeration, what the fallback sentence is (R1 evidence), where the wait marker is (R5 evidence), what the `## Next Step` pointer says.
  - [x] ⚠️ The enumeration section heading is **not uniform**: `### 3. Input Validation` (6 files), `### 3. Input Assessment` (pattern-mapping), `### 3. Validate Your Artifacts` (pivot-resynthesis), `### 3. Per-Experiment Input Validation` (production-monitoring). A blind find/replace misses 3 of 7.

- [x] **Task 2 — Verify the structural constraint still holds (AC: 2)**
  - [x] **Already settled — see §Resolved Design Decision.** Read it before writing anything; it is settled by `validator.js` P17/P20, not by taste.
  - [x] Confirm the constraint still holds: `ls _bmad/bme/_vortex/workflows/*/steps/*.md | wc -l` per workflow, and re-read `scripts/update/lib/validator.js:475-487`. If the cap has changed since 2026-08-28, re-open the decision.

- [x] **Task 3 — Author the shared scaffold (AC: 2, 4, 7)** — *location constrained, see §Hard structural constraint item 4*
  - [x] ⛔ **NOT** `_bmad/bme/_vortex/templates/` — T88 shipped narrowed (`contracts/` + `examples/` only), so a root-level dir is still copied by nothing. Place the scaffold inside a workflow directory; verify with `try-fresh-install.sh` per Task 0.
  - [x] Round 1 = receive the input (path or description). Round 2 = validate against the named contract schema.
  - [x] Each round carries a `Concept count: N/3` footer. **Reuse the existing convention, do not invent one** — see `_bmad/bme/_team-factory/workflows/add-team/step-01-scope.md:104` and siblings.
  - [x] Self-check against OC-R0..OC-R7 (AC7).

- [x] **Task 4 — Apply to the 9 mechanism (i) cells (AC: 2, 4, 5)**
  - [x] `R7-V1` assumption-mapping · `R7-V2` hypothesis-engineering · `R7-V3` behavior-analysis · `R7-V4` experiment-design · `R7-V6` pattern-mapping · `R7-V10` research-convergence · `R7-V11` signal-interpretation — straight parametrization.
  - [x] `R7-V7` pivot-resynthesis — **dual-schema variant** (HC1 + HC4 as separate sub-rounds).
  - [x] `R7-V8` production-monitoring — **portfolio-iteration variant** (HC4 per-experiment sub-rounds).
  - [x] For each: preserve the non-conforming fallback sentence verbatim (R1) and the wait marker (R5). **Do NOT rename the file, add a step file, or touch `## Next Step` / `## Steps Overview` / `Load step:`** — see §Hard structural constraint.

- [x] **Task 5 — Patch the 2 mechanism (ii) cells (AC: 3, 4, 5)**
  - [x] `R7-V5` lean-experiment `step-01-hypothesis.md` — split Hypothesis Statement Check + Falsifiability Check across ≥2 sub-rounds.
  - [x] `R7-V9` proof-of-value `step-01-value-hypothesis.md` — split Value Hypothesis Canvas + Riskiest Value Assumption + sentence template across ≥3 sub-rounds.

- [x] **Task 6 — Re-score and prove no regression (AC: 4, 5, 6)**
  - [x] Re-score OC-R7 on all 11 cells under v5.1. Record counts.
  - [x] Re-score **R1–R6** on all 9 HC-cluster workflows + the 2 A24 workflows. Any PASS→FAIL blocks closure.
  - [x] Confirm no new T1-firing cell was introduced.

- [x] **Task 7 — Decide #4 lean-persona (AC: 8)**

- [x] **Task 8 — Close the row and the story in the same session**
  - [x] Update `sprint-status.yaml`. Per `project-context.md` and the T55/T79 lesson: **a fix is not a close.** `backlog-integrity.js`'s owed-close scan will flag a `fix(oc-2-1)` commit against an unclosed row.

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
4. **⛔ `_bmad/bme/_vortex/templates/` is an invalid location — do not create it.** *(Re-confirmed 2026-08-28 after T88 shipped: an intermediate draft would have made it valid, but that draft was rejected at Round 1 and the shipped phase 2b copies `contracts/` + `examples/` only.)* `refresh-installation.js` copies Vortex in four phases only: agents by `AGENT_IDS` (`:57`), workflow dirs by the **`WORKFLOW_NAMES` allowlist** (`:154-176`), `config.yaml` (`:603`), guides (`:669`). A new sibling directory under `_vortex/` is copied by **nothing** — it would ship in the npm tarball and never reach a project, exactly as `contracts/` and `examples/` do today. Gyre has an explicit contracts copy block at `:446-454`; Vortex has no equivalent. **T88 added a copy phase (2b), but deliberately narrow** — `contracts/` and `examples/` only, after Round 1 rejected a copy-everything draft for exceeding scope and for putting the U8 opt-out at risk. A root-level `templates/` still ships to nobody. **The scaffold must live inside a workflow directory**, which is copied wholesale at `:161-169`. Verified against a real install, not against the copy logic alone.

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

Amelia (bmad-agent-dev) on claude-opus-5[1m], 2026-09-03.

### Debug Log References

- Staleness pre-flight on P21: **GREEN** (Change Log entry 2026-09-03). Five stale citations corrected first in the same session — P21's Stage cell and T86 both asserted `oc-2-1` reads `backlog` at `sprint-status.yaml:509`; it reads `ready-for-dev` at `:520`.
- AC0 re-verified against a real packed install, not the copy logic: `contracts/` present with all 5 HC files; **17 pointer occurrences across 16 files, 0 dangling** — matching the story's claim exactly.
- **A `git stash`/`pop` round-trip in this session raced with an operator commit and had to be undone.** I used a stash to measure the contract-pointer count before vs after. `b787d28a` (T120 `parseVersion`, authored by the operator) landed between the stash and the pop, so the pop restored the stale pre-commit copy of `scripts/update/lib/utils.js` and `scripts/lib/bme-modules.js` as a **staged revert of that commit**. No operator work was lost — it was safe in `b787d28a` — and both files were restored with `git restore --staged --worktree`, `parseVersion` verified present again. **All gates below were re-run afterwards** against the corrected tree; the numbers are identical. Lesson: do not `git stash` in this repo, the operator commits concurrently from GitHub Desktop.
- `_portability` FAILED / `[installed-tree status 1]` appears in both harness runs. **Pre-existing and deliberate** — `$TREE` is held out of the verdict until `dist-2-6` wires it in, and 2.6 is still `ready-for-dev`. Not caused by this story.

### Completion Notes List

**Scope delivered: 12 files, not 11.** The 11 T1-firing cells plus the AC8 carry-forward (#4 `lean-persona`), which was retrofitted rather than deferred — oc-1-1 §9.1 already specified the exact split, so no design invention was needed, and shipping a pacing violation inside the release that publishes a covenant about pacing is the self-compliance problem AC7 exists to prevent.

**The scaffold is repo-only, by operator ruling.** `docs/vortex-step-01-round-split-scaffold.md` is deliberately outside `files[]`. The option space was closed by measurement, not preference: `steps/` is out because `validator.js:473` counts *every* `.md` there against the P17 4–6 cap; a new workflow directory is out because `WORKFLOW_NAMES` derives from the `WORKFLOWS` registry (`agent-registry.js:140`) and would inherit the same cap plus operator visibility; `_vortex/templates/` is copied by nothing; `guides/` is operator-facing and backed up on refresh; `examples/` holds operator-facing HC samples. Since nothing loads the scaffold at runtime it names no `{project-root}` path, so T89's class does not apply. **Verified it does not ship** — 0 copies in the packed tarball.

**What actually collapses the concept count is the reference, not the split.** §A41-2 counts *visible* sub-fields, so pointing at the contract file leaves none to count. `behavior-analysis` §3 was 7 frontmatter + 8 body = **15 concepts in one round** against a budget of 3. Both halves are required: referencing alone still overspends in §1+§2, and splitting alone leaves 15 concepts in round two.

**Three round-1 overspends were found by counting rather than assumed away.** `assumption-mapping` §1 carried a 4-field contract enumeration (4 ≥ 4 → 4 concepts under §A41-2) and `lean-experiment` §1 introduced `Assumption Risk Map` as a fourth concept; `proof-of-value` §1 described three sources individually, which is N not 1 compound under A46(d). All three were compressed to graph-position references.

**R5 was the real hazard, and the pre-existing state was worse than the story implied.** Vortex carries **zero** literal halt markers anywhere — no `HALT`, no `Wait for user input.`, no `MANDATORY EXECUTION RULES` block — so R5 passed only under the lenient reading A26 committed. The retrofit adds **14** new operator decision points. Operator ruled to add literal markers. Marking only the new boundaries would have achieved nothing, because R5 fails a cell on *any* unmarked boundary, so **all 28** boundaries were marked (16 new + 12 pre-existing `## Your Turn`). The markers are agent-facing, so they cost nothing against the R7 budget. **This does not re-score A26** — that stays a separate scope decision.

**AC5 re-score result: no regression.** R1 fallbacks preserved by extraction rather than retyping (9 bold sentences + `pivot-resynthesis` §4). `proof-of-value` has no bold fallback sentence — verified against `HEAD` that it had none before either. **Round 1 corrected the reasoning:** A26 §4.7 anchors its `Right to a default — PASS` on the value-hypothesis statement template, not on a fallback sentence, so the cell was originally cleared against the wrong evidence. That surface survives, so the verdict holds; the justification did not. R2/R4/R6 surfaces untouched. R3 verified per round: every round 1 carries a consequence sentence; one thin boundary at `proof-of-value` §4 was given one. Contract-pointer count unchanged — measured as occurrences of the `_vortex/contracts` path across `_bmad/bme/_vortex/`, before and after. (The **17 across 16 files** in the Debug Log is a narrower measure: occurrences of an `hcN-*.md` filename in the installed tree. Two numbers, two methods — stated here because the first draft gave both for what read as one measure.)

**AC6 cascade termination:** no round exceeds 3/3, so no new T1-firing cell is introduced.

**Open question for the operator, corrected at Round 1:** A26 §10 does contradict itself, but not as the story first said. §10 reads *"mechanism (i): 9 (A26) + 2 (A24) = 11 … Plus #4 lean-persona = 14 total"*; A26 actually contributes **7** mechanism (i) cells (`:217`, `:227`), so §10 double-counts its own two mechanism (ii) cells into the mechanism (i) bucket, giving 11 and 14 where §6/§8 give 9 and 12. The implementation's 12 is right; the earlier framing pointed at the wrong contradiction. Amending a shipped audit is a governance action, not a dev action.

**A second question this session surfaced:** A26 is dated 2026-04-26, which is *after* A41 (2026-04-25), so §A41-4 makes it a v4+ audit that should have used the **strict** R5 reading and scored R5 FAIL across all nine cells. It records R1–R6 PASS at 100%. Either A26 mis-applied the rubric or it made an undocumented lenient commitment. Not filed — it is an evidence-standards question of the same family as T86.

### Review Findings — Round 1 (2026-09-03)

Three layers launched in parallel. **Two completed — Blind Hunter and Edge Case Hunter. The Acceptance Auditor FAILED twice**, both times an API error from the machine sleeping mid-response, so that layer is missing and its AC-by-AC verdict table does not exist. This is a real coverage gap, not a clean bill. Every finding acted on below was reproduced against the tree before being accepted.

**Verdict: RED.** 8 HIGH, ~8 MEDIUM — Round 2 is triggered per `code-review-convergence`.

**HIGH — fixed**

1. **`## Your Turn` re-asked for round-1 input in all 12 files.** Preserved verbatim as R1/R5 evidence, it still said *"Please provide your hypothesis contracts"* after round 2 had already validated them. Verbatim preservation is exactly what made it wrong once a halt was inserted upstream. Every `## Your Turn` now closes its final round by reporting what the check found.
2. **`proof-of-value`'s final ask collapsed its own 4-round split** — it instructed all four deliverables at once, as the file's last and most authoritative line.
3. **The same four HC3 fields were counted two ways in one change set.** `lean-experiment` §3's checklist was footered `1/3` as a §2.6 category checklist while the identical four-field list was deleted from `assumption-mapping` §1 because §A41-2 makes it 4. §3 now references the HC3 contract like every other cell, and the file collapses from 3 rounds to 2.
4. **No round-1 footer counted the file preamble.** Round 1 begins at `# Step 1:` and includes `## Why This Matters`; A26 scored the budget *atop step-prose*. All recounted. Most preambles restate `workflow.md` vocabulary and cost nothing, but `hypothesis-engineering` and `signal-interpretation` each gained one (now 3/3) and `lean-experiment` hit **4/3** — its `workflow.md` is a single line, so "falsifiable bet" is novel.
5. **The R1 fallback had moved behind the round-1 boundary**, so an operator with informal notes never saw that non-conforming input is welcome at the moment they decided what to hand over. It now sits ahead of the halt in all 11 files that have one.
6. **`pivot-resynthesis` and `production-monitoring` never got the sub-rounds their catalog entries and this story's own scaffold prescribe.** Both are now 3 rounds.

**HIGH — deferred to `deferred-work.md` with rationale**

7. **The 16 new operator-decision branches propose no default (OC-R1)**, and the split un-vacuums two cells A26 scored `N/A — vacuous` precisely because step-01 had no decision branch. Choosing a sensible default per boundary is a design question, not a patch.
8. **AC6 cascade was evaluated only inside the 12 changed files.** Concepts removed from `experiment-design` and `assumption-mapping` step-01 now arrive novel in step-02. Verified against source.

Neither has a lane row: `feedback_backlog_id_allocation` forbids allocating an ID while the backlog has uncommitted edits, and a sibling session was paused. **Both need qualifying once this commit lands.**

**MEDIUM — record defects, all fixed**

- Marker arithmetic said 25 (14+11); actual **28 (16+12)** — never updated after `lean-persona` was added.
- **Citation rot introduced by this session's own correction.** The Change Log's whole subject is fixing a stale `sprint-status.yaml:509` citation — and the same session's sprint-status edit moved the key, so the correction cited a line that no longer held. Fixed by removing line numbers and citing the key by name.
- Two numbers (17, 19) for what read as one pointer-count measure.
- "Two round-1 overspends" followed by three.
- The A26 §10 open question pointed at the wrong contradiction.
- `proof-of-value`'s R1 was cleared against the wrong evidence surface.
- 11 halts lacked the consequence clause the scaffold makes mandatory while the record claimed all had one. All 16 now carry one.
- Scaffold citation drift (`validator.js` P17/P20, `agent-registry.js` path) and no `lean-persona` row. Fixed, and finding 4's preamble rule is now written into the scaffold.

**LOW** — the scaffold is untracked and must be explicitly `git add`ed or a `git add -u` commit drops it silently.

### Review Findings — Round 2 (2026-09-04)

Run against the shipped commit `8778df1e` after Round 1's fixes were committed and pushed. Two layers: an adversarial pass aimed squarely at Round 1's own corrections, and the **Acceptance Auditor that failed twice in Round 1** — it completed this time, so the AC coverage gap is closed.

**Verdict: RED, and the pattern held — most findings were defects in Round 1's corrections, not in the original work.** This is the third story running where Round 2 found that.

**Functional defects introduced by Round 1 — fixed**

1. **`lean-experiment` was left referring to a concept it no longer collects.** Fixing the double-count, Round 1 deleted every introduction of `riskiest assumption` — §1's clause, §2's example template, and the checklist item — but left §3 asking *"Is **the** riskiest assumption something you can actually observe or measure?"*, a definite article pointing at nothing. Its `workflow.md` never mentions it (0 hits), **four downstream steps consume it**, and `contracts/hc4-experiment-context.md:56` marks `Riskiest Assumption` **Required** in the artifact this workflow emits. The workflow walked to a mandatory output field it never asked for. **Fixed by eliciting it explicitly in round 2**, which also keeps round 1 at 3/3.
2. **`behavior-analysis`'s rewritten `## Your Turn` made §4 optional** ("or say go") when `steps/step-02-context.md` formalizes "the behavior observation *from Step 1*". Round 1 removed the only mandatory phrasing in the file. **Fixed.**
3. **`lean-persona`'s `## Your Turn` was never rewritten** — Round 1's "all 12 files" was false; it still asked round 1's question at the round-2 boundary. **Fixed.**
4. **`pivot-resynthesis` gained a doubled conditional** — *"If your artifacts are non-conforming: If your artifacts don't perfectly match…"* — when the old §4 body was folded behind the standard bold lead-in. **Fixed.**
5. **`proof-of-value:34` and `:54` had no consequence clause** while the record claimed all 16 halts did. The check that "verified" this matched the em-dash **inside the halt marker itself** — a test that could not fail, which is precisely what `verification-must-be-falsifiable` forbids. **Both fixed.**
6. **The scaffold still described the pre-Round-1 design.** It placed the fallback in §3 (`:77`, and "end of §3" in the Must-survive table) and marked `## Your Turn` prose `PRESERVED VERBATIM` — while Round 1 had moved the fallback to §2 in 10 files and rewritten that prose in 11. The document declares itself *normative*, so the next contributor following it would have re-created both defects Round 1 had just fixed. **Resynced**, with the drift itself recorded in the table.
7. **`hypothesis-engineering`'s recount to 3/3 was wrong in the inflating direction** — its `workflow.md` says "falsifiable hypotheses … prove wrong" and "if you can't prove it wrong, it's not a hypothesis", so the concept is inherited. **Back to 2/3.**

**The restructure — why the footers stopped being patched**

The concept counts have now been wrong **twice running**: as authored, and again after Round 1 recounted every one of them. `code-review-convergence` calls two failed attempts at the same fix a restructure signal, and the operator ruled to restructure rather than attempt a third hand-recount.

Root cause: `Concept count: N/3` is a human judgement under a rubric with inheritance. Nothing could check it, so it kept being wrong while reading as authoritative — a direct collision with `derive-counts-from-source`.

**`scripts/audit/vortex-pacing-check.js`** (new, wired as `npm run audit:pacing` and into CI beside `backlog-integrity` and `docs:audit`) does not compute the count — that is semantic and a script cannot do it. It asserts the properties that *are* mechanical, each of which was individually a real defect in this story:

| # | Assertion | The defect it would have caught |
|---|---|---|
| 1 | rounds == footers == literal halt markers | the 25-vs-28 marker drift after `lean-persona` was added |
| 2 | a footer's number equals the concepts it names | a count nobody could tie to a list |
| 3 | no footer over 3/3 | the budget itself |
| 4 | *(advisory warning only)* a named concept that may be inherited | — |
| 5 | no contract-schema enumeration of 4+ rows | the construct that fired T1 |
| 6 | the fallback precedes the first halt | Round 1 HIGH-5 |
| 7 | every `## Next Step` pointer resolves | — |

**Check 4 is a warning and not a failure, deliberately.** As a hard gate it produced 13 findings that were mostly false — "HC4 schema validation" matches because `HC4`, `schema` and `validation` each appear somewhere in `workflow.md` — and it **missed the one defect it was written for**, because the footer says `falsifiability` and `workflow.md` says `falsifiable`. A gate that fires on healthy cases and stays silent on the sick one gets ignored, or worse, obeyed. `project-context.md` records the inline backlog check that reported 51 violations against a correctly-sorted backlog and had to be deleted; this is the same shape. It stays a stderr WARNING per the `preflight-soft-warn` convention.

**Verified by mutation before wiring**, per NFR10 — an unfalsified gate proves nothing. Five mutations each produce exit 1 and the unmutated tree exits 0: an over-budget footer, a count disagreeing with its own list, a dropped halt marker, a fallback moved behind its boundary, and a restored schema enumeration.

**What the checker still cannot see** — and this is the honest limit: it cannot tell you a footer *omitted* a concept that is genuinely novel. Round 2 argues `pattern-mapping` is at ≥5/3 on that basis (an uncounted mental-model framing plus the Isla source workflows every sibling file counts), and `assumption-mapping`/`signal-interpretation` at 4/3. Those readings are contestable — the auditor recorded them as such — and no mechanical check can settle them. They remain open.

**Acceptance audit (the layer missing from Round 1)**

AC0 PASS · AC1 PASS *(the 12th file is licensed by AC8, with the audit citation AC1 demands)* · AC2 PARTIAL · AC3 PASS · AC4 PARTIAL · AC5 PARTIAL · **AC6 FAIL** *(the deferred step-02 cascade — a verified breach, deferred rather than closed)* · AC7 PARTIAL *(OC-R0's surface enumeration was never recorded, and Task 3's "place the scaffold inside a workflow directory" is ticked while the operator ruled it into `docs/`)* · AC8 PASS.

**Deferred, unchanged from Round 1** — the OC-R1 defaults at the new decision branches, and the AC6 cascade into step-02. Both in `deferred-work.md`; both still need lane rows.

### File List

| File | Change |
|---|---|
| `docs/vortex-step-01-round-split-scaffold.md` | **new** — the shared scaffold (not shipped) |
| `_bmad/bme/_vortex/workflows/assumption-mapping/steps/step-01-setup.md` | `R7-V1` — 2 rounds |
| `_bmad/bme/_vortex/workflows/hypothesis-engineering/steps/step-01-setup.md` | `R7-V2` — 2 rounds |
| `_bmad/bme/_vortex/workflows/behavior-analysis/steps/step-01-setup.md` | `R7-V3` — 2 rounds |
| `_bmad/bme/_vortex/workflows/experiment-design/steps/step-01-setup.md` | `R7-V4` — 2 rounds |
| `_bmad/bme/_vortex/workflows/lean-experiment/steps/step-01-hypothesis.md` | `R7-V5` — 2 rounds (mechanism ii; §3 now references HC3) |
| `_bmad/bme/_vortex/workflows/pattern-mapping/steps/step-01-setup.md` | `R7-V6` — 2 rounds, dual-mode |
| `_bmad/bme/_vortex/workflows/pivot-resynthesis/steps/step-01-setup.md` | `R7-V7` — 3 rounds, one per contract |
| `_bmad/bme/_vortex/workflows/production-monitoring/steps/step-01-setup.md` | `R7-V8` — 3 rounds, per-experiment then roll-up |
| `_bmad/bme/_vortex/workflows/proof-of-value/steps/step-01-value-hypothesis.md` | `R7-V9` — 4 rounds (mechanism ii) |
| `_bmad/bme/_vortex/workflows/research-convergence/steps/step-01-setup.md` | `R7-V10` — 2 rounds |
| `_bmad/bme/_vortex/workflows/signal-interpretation/steps/step-01-setup.md` | `R7-V11` — 2 rounds |
| `_bmad/bme/_vortex/workflows/lean-persona/steps/step-01-define-job.md` | `#4` carry-forward — 2 rounds |
| `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` | pre-flight corrections + Change Log |
| `scripts/audit/vortex-pacing-check.js` | **new (R2)** — makes the pacing footers falsifiable |
| `package.json` | **(R2)** — `npm run audit:pacing` |
| `.github/workflows/ci.yml` | **(R2)** — the gate runs on every push |
| `_bmad-output/implementation-artifacts/deferred-work.md` | the two deferred HIGH findings |

### Gates

Re-run after Round 2 remediation.

- lint **0/0**
- `docs:audit` **0 findings**
- `npm run audit:pacing` **PASS** — 12 retrofitted files; rounds, markers and footers agree, every footer's number matches the concepts it names, none over budget, no schema enumeration reintroduced, every fallback ahead of its boundary, every step-02 pointer resolves. **Demonstrated failing by mutation on all five classes before being wired in.**
- `backlog-integrity.js` **PASS** (802 rows, 10 tables, 3 lanes ordered)
- `npm test` **exit 0 — 1981 tests / 1980 pass / 0 fail / 0 cancelled / 1 pre-existing skip.** Obtained on the fourth attempt; see the note below, which is kept because the three preceding runs disagreed with it.

**On the test suite, stated plainly rather than rounded to green.** Three full runs today returned `1980 pass / 0 fail`, `1979 pass / 0 fail`, and then `1975 pass / 5 fail`. The five failures were chased rather than assumed:

- Four of the five (`convoke-update` CLI, migration rollback BUG-8/AC6, the test-runner hook guard, `validate-marketplace`) **pass in isolation — `fail 0`.**
- The fifth is `performance: full manifest generation within budget (NFR2)`, a pure timing assertion. Measured `generateManifest` directly three times: **1,039,031 ms, 1,271,619 ms, then 6,211 ms.** The budget is 10,000 ms with 30,000 ms headroom. The third run caught the machine awake; the first two are wall-clock during suspension.
- Corroborating: sibling tests in the same run reported durations of 17 and 34 *minutes* for work that normally takes milliseconds, `load average` was 8.7–9.3, and the host has 51 days uptime. The same suspension killed the Round 1 Acceptance Auditor twice.

**A clean run was eventually obtained (exit 0, 1980 pass, 0 fail), which is the result of record.** The note above is kept rather than deleted because three earlier runs of this same tree disagreed, and a reader who saw only the green run would not know how little a single passing run is worth on this host. **No regression is evidenced, and none of the five transient failures touches a surface this story changed** (markdown step files, `docs/`, a new audit script, one `package.json` script line, one CI step). `generateManifest` at 6.2 s against a 10 s budget is the measurement that settles it. CI on a clean runner remains the real arbiter — load average was ~9 throughout and the host has 51 days uptime.

- **Rounds 1 and 2: run, both RED, both remediated. Round 3: OWED** — Round 2's remediation added `scripts/audit/vortex-pacing-check.js`, a `package.json` script and a CI step, and `code-review-convergence` triggers R3 on structural changes. R3 is the last allowed round; anything it finds goes to the backlog.
