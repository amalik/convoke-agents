# ADR-001: Enhance/Gyre Build Sequencing

**Status:** ACCEPTED
**Date:** 2026-03-21
**Decision Makers:** Full BMAD team (Party Mode + Advanced Elicitation)
**Context Area:** Task 1-4 execution strategy (Gyre, Enhance, Vortex redesign, Forge)

---

## Context

We have four sequential tasks planned for Convoke product evolution:

1. **Gyre redesign** (COMPLETED — architecture, PRD, epics rewritten as Convoke team module)
2. **Enhance framework** (BMB module that generates new Convoke team modules from templates)
3. **Vortex redesign** (retroactively align Vortex to Enhance-codified patterns)
4. **Forge** (use Enhance to scaffold the third Convoke team module)

The question: **Should Enhance framework be built in parallel with Gyre implementation, or sequentially after Gyre ships?**

Key constraints:
- Single developer (Amalik + Claude Code)
- Both tracks touch shared ecosystem files (`agent-registry.js`, `agent-manifest.csv`, `convoke-doctor` validator, `refreshInstallation`)
- Gyre has 24 stories across 4 epics
- Enhance has a 6-step workflow: Team Discovery, Agent Design, Contract Design, Workflow Design, Integration, Validation

---

## Options Evaluated

### Option A: Full Parallel (interleaved from day one)

| Dimension | Assessment |
|-----------|------------|
| Speed to Enhance MVP | Fastest |
| Template accuracy | Risk — Gyre patterns still solidifying during E1-E2 |
| Ecosystem conflict | High — concurrent modifications to shared files |
| Context switching | Heavy — alternating mental models daily |
| Feedback loop | Tight — Enhance templates validated against live Gyre development |

### Option B: Sequential (Gyre first, then Enhance)

| Dimension | Assessment |
|-----------|------------|
| Speed to Enhance MVP | Slowest — blocked until all 24 Gyre stories land |
| Template accuracy | Highest — templates extract from proven, shipped patterns |
| Ecosystem conflict | Zero |
| Context switching | Zero |
| Feedback loop | Delayed — template-hostile quirks discovered late |

### Option C: Staggered Parallel (Gyre E1 first, then interleave)

| Dimension | Assessment |
|-----------|------------|
| Speed to Enhance MVP | Moderate — ~1 week delay vs full parallel |
| Template accuracy | High — E1 proves the module pattern before Enhance templates it |
| Ecosystem conflict | Low — Gyre's integration story (1.6) lands first, establishing the pattern |
| Context switching | Managed — batch by epic boundaries |
| Feedback loop | Good — Enhance development informs E2-E4 story refinements |

---

## Trade-off Matrix

| Criterion | Weight | A: Full Parallel | B: Sequential | C: Staggered |
|-----------|--------|:-:|:-:|:-:|
| Time to all 4 tasks complete | 30% | 8 | 3 | 7 |
| Template accuracy | 25% | 4 | 9 | 8 |
| Integration risk | 20% | 3 | 9 | 7 |
| Cognitive load | 15% | 3 | 9 | 6 |
| Feedback tightness | 10% | 9 | 3 | 7 |
| **Weighted Score** | | **5.3** | **6.3** | **7.1** |

---

## Decision

**Option C: Staggered Parallel**

### Execution Phases (Refined via Tree of Thoughts — Variant C')

Four strategies were evaluated: Epic-Locked Alternation (A), Story-Cluster Interleave (B), Enhance-Front-Loaded (C), and Front-Loaded + Validation Pass (C'). C' scored highest (7.9/10) on the weighted matrix, optimizing for Enhance momentum, minimal context switches (3 total), and guard-rail compliance.

| Phase | Focus | Scope | Key Output | Context Switch? |
|-------|-------|-------|------------|:-:|
| **1** | Gyre E1 | Stories 1.1-1.7 | Module foundation, Scout agent, config-driven doctor | — |
| **2** | Enhance MVP | Steps 1-5 (draft) | Templates extracted from Vortex + E1, draft integration, dry-run dummy module | Yes (1) |
| **3** | Gyre E2a | Stories 2.1-2.2 | Accuracy spike resolved, Atlas agent landed. **Decision gate:** if spike fails, see Spike Contingency below | Yes (2) |
| **4** | Enhance Lock | Template validation pass (~1 day) | Templates locked against Scout + Atlas, doctor passes for dummy module. Validation driven by `enhance-notes.md` rationale checklist | Yes (3) |
| **5** | Gyre E2b-E4 | Stories 2.3-4.7 | Full Gyre implementation complete | — |
| **6** | Enhance Final | Step 6 (Validation) + dogfood exercise + polish | Enhance MVP shipped. Dogfood: scaffold throwaway module, fill in content, evaluate authoring experience. Refine templates before Vortex redesign | — |

**Why C' over alternatives:**
- **vs Epic-Locked (A):** Enhance gets a focused block instead of fragmented slivers between epics. Better momentum.
- **vs Story-Cluster (B):** Avoids 6-7 context switches between heterogeneous work (domain logic vs meta-templating). Each block stays homogeneous.
- **vs Front-Loaded (C):** Complies with template stability gate (2+ agents required for lock). C would lock against Scout alone.

**Phase 2 dry-run artifact:** Enhance Phase 2 should produce a dummy module generated from draft templates. It won't pass doctor yet (no Atlas validation), but proves template machinery works end-to-end. De-risks Phase 4 from "validate + fix" to "validate + tweak."

**Phase 2 template design rationale:** Phase 2 must also produce `_bmad-output/enhance-notes.md` documenting *why* each template section exists, which Vortex/Gyre pattern it extracts from, and what variation points are parameterized. This serves as the context bridge for Phase 4 validation — enabling mechanical checklist-based validation rather than creative re-derivation across Claude Code sessions.

**Phase 3 spike contingency:** If Story 2.1 (Accuracy Spike) fails the ≥70% gate, Enhance templates remain valid — they are structural (module scaffolding patterns), not accuracy-dependent. Gyre E2-E4 enters redesign. Enhance Phase 4 template lock proceeds against Scout + whatever Atlas design exists, since templates target the XML activation protocol structure, not domain logic outcomes.

**Phase 6 dogfood exercise:** Before declaring Enhance MVP shipped, scaffold a throwaway module using the templates, fill in domain-specific content manually, and evaluate the authoring experience. If the fill-in workflow is painful (wrong abstraction boundaries, too many/few placeholders), refine templates before proceeding to Vortex redesign (Task 3). The dogfood module is deleted afterward — it's a usability test, not a product.

### Guard Rails

- No Enhance merges to main until Gyre E1 is tagged complete
- Enhance extracts templates from Vortex + Gyre E1 before generating new content
- Ecosystem file changes (`agent-registry.js`, `agent-manifest.csv`, validator, refresh) batched at epic boundaries
- Epic-boundary batching manages context switching cost
- **Template stability gate:** Templates are DRAFT until validated against 2+ agent implementations from different epics (Scout + Atlas minimum). Design-ahead during E1 is fine; template *lock* requires E2 Story 2.2 (Atlas Agent) to land
- **Dynamic validator requirement:** Gyre E1 Story 1.6 must ensure `convoke-doctor` derives expected agent/workflow counts from each module's `config.yaml` dynamically — not from hardcoded arrays. This eliminates ecosystem file collision risk during interleave
- **No mid-story context switching:** Complete the current story fully (implementation + AC verification) before touching the other track. Cross-track insights captured in `_bmad-output/enhance-notes.md` scratchpad, not acted on immediately
- **Enhance MVP time-box and tier:** Enhance is scoped to the equivalent effort of one Gyre epic. MVP is **Structural tier**: generated agents include the complete XML activation protocol structure (7 steps, persona definition, menu handlers, config loading, step-file references) with parameterized placeholders — not stubs (too shallow for Forge to use) and not LLM-generated content (too ambitious for MVP). Full MVP output: `config.yaml` + agent skeletons + workflow skeletons + contract skeletons + registry entries. Sophistication (auto-compass-routing, smart validation, generative content) goes to initiatives backlog
- **Task sequencing lock:** Enhance templates must be locked before Vortex redesign (Task 3) begins. Vortex redesign *consumes* Enhance templates for validation — it must not feed them. Full sequence: Gyre E1 → Enhance Steps 1-5 draft → Gyre E2 Stories 2.1-2.2 → Enhance template lock → Gyre E2b-E4 → Enhance final → Vortex redesign → Forge

### Key Insight

Gyre E1 is the **pattern proof** — it validates that a second Convoke team module can coexist with Vortex in the ecosystem. Without that proof, Enhance templates against theory. With it, Enhance templates against reality. Two proven reference modules (Vortex + Gyre E1) is the minimum viable input for reliable template extraction.

### Enhance Build Strategy

Extraction before generation:
1. **First milestone:** Extract templates from Vortex + Gyre E1 that *reproduce* what exists
2. **Second milestone:** Parameterize those templates for arbitrary domains

---

## Consequences

### Positive
- Two proven reference modules before templating begins
- Managed cognitive load via epic-boundary batching
- Tight feedback loop: Enhance development informs Gyre E2-E4 refinements
- Patterns are freshest in memory during extraction

### Negative
- ~1 week slower than full parallel start
- Requires discipline to not merge Enhance work early
- Design-ahead work during Phase 2 may need revision if E1 surfaces surprises

---

## Pre-mortem: Identified Failure Modes

Analysis conducted via Pre-mortem method during Advanced Elicitation. Five failure scenarios identified, each with root cause and prevention integrated into guard rails above.

| # | Failure Mode | Root Cause | Prevention (Guard Rail) |
|---|-------------|-----------|------------------------|
| 1 | **Template drift** — Agent template invalidated by E2-E3 pattern variations | Extracted from single agent; one reference point insufficient to generalize | Template stability gate: lock requires 2+ agent implementations |
| 2 | **Ecosystem file collision** — Validator counts diverge across branches | Hardcoded expected counts instead of dynamic config reads | Dynamic validator requirement in Story 1.6 |
| 3 | **Cognitive collapse** — Mid-story context switch produces hybrid code | Epic-boundary batching not enforced at story level | No mid-story switching; scratchpad for cross-track insights |
| 4 | **Enhance scope creep** — Developer tool becomes the product, Gyre stalls | No time-box or MVP definition for Enhance | Enhance MVP time-box; sophistication to backlog |
| 5 | **Vortex reference rot** — Circular dependency between Enhance templates and Vortex redesign | Tasks 2 and 3 run concurrently without versioned contract | Task sequencing lock: templates lock before Vortex redesign |

**Unifying pattern:** Every failure traces to **premature generalization** — extracting before the pattern is proven, switching before the thought is complete, building beyond what's needed. Antidote: *patience at the boundaries, speed within them.*

---

## Integration Contract (War Room Output)

Analysis conducted via Cross-Functional War Room method during Advanced Elicitation. Morgan (Module Builder), Winston (Architect), and Bob (Scrum Master) produced a file-level integration map, two-tier registry strategy, merge protocol, and formal integration contract.

### Shared File Ownership Map

| Shared File | Gyre Touches When | Enhance Touches When | Conflict Risk |
|-------------|-------------------|---------------------|---------------|
| `scripts/install/agent-registry.js` | E1 Story 1.6 — adds `GYRE_AGENTS`, `GYRE_WORKFLOWS` arrays | Step 5 — adds generated module's arrays | Medium |
| `_bmad/_config/agent-manifest.csv` | E1 Story 1.6 — adds 4 Gyre agent rows | Step 5 — adds generated agent rows | Low (append-only) |
| `scripts/install/convoke-doctor.js` | E1 Story 1.6 — refactored to config-driven validation | Step 5 — adds generic module validation | **Eliminated** by config-driven refactor |
| `scripts/update/lib/refresh-installation.js` | E1 Story 1.6 — adds Gyre refresh section | Step 5 — adds generated module refresh | Medium |
| `scripts/update/lib/validator.js` | E1 Story 1.6 — coupled to doctor rules | Step 6 — validates generated modules pass | **Eliminated** by config-driven refactor |
| `package.json` | E1 Story 1.6 — adds `convoke-install-gyre` bin | Step 5 — adds `convoke-install-<module>` bin | Medium (different entries) |

### Two-Tier Registry Strategy

| Tier | What | When | Why |
|------|------|------|-----|
| **Tier 1 (Gyre E1)** | Keep named arrays in registry (`GYRE_AGENTS`, `GYRE_WORKFLOWS`). Doctor becomes config-driven. | Story 1.6 | Solves high-risk problem (doctor/validator collision). Low disruption to existing installer. |
| **Tier 2 (Enhance)** | Registry itself becomes config-driven — reads from each module's `config.yaml` to build arrays dynamically. | Enhance Step 5 | Enhance needs this for generated modules. Two proven modules available to validate against. |

### Merge Protocol

| Rule | Rationale |
|------|-----------|
| Gyre owns main branch during E1 | No Enhance merges. Period. |
| After E1 tag: alternating merge windows | Gyre epic lands first, then Enhance batch, then next Gyre epic. Never concurrent. |
| Shared file changes require `convoke-doctor` run before merge | If doctor passes, the change is safe. Doctor is config-driven — single source of truth. |
| Enhance never modifies existing module configs | Generates *new* module configs only. Vortex and Gyre configs are read-only references. |
| `agent-manifest.csv` is append-only | Both tracks add rows, neither modifies existing rows. Merge conflicts trivially resolvable. |

### Formal Integration Contract: Gyre ↔ Enhance

**Shared Interface:** `_bmad/bme/*/config.yaml` schema
- Each module declares: `submodule_name`, `agents[]`, `workflows[]`, `version`
- `convoke-doctor` validates all modules via this schema
- `convoke-install-<module>` reads this schema for file discovery

**Gyre's Obligations:**
- E1 Story 1.6 delivers config-driven doctor validation
- Gyre `config.yaml` conforms to shared schema
- No changes to Vortex `config.yaml`

**Enhance's Obligations:**
- Generated `config.yaml` conforms to shared schema
- Generated modules pass `convoke-doctor` without doctor modifications
- Registry refactor (Tier 2) maintains backward compatibility with named arrays

**Validation Gate:**
- After each merge: `convoke-doctor` must pass for ALL installed modules
- This is the single integration test — if doctor passes, tracks are compatible

### Story 1.6 Scope Change

Story 1.6 in `epics-gyre.md` has been updated to include the config-driven doctor refactor. The doctor now discovers modules by scanning `_bmad/bme/*/config.yaml` and derives validation expectations dynamically. Estimated impact: +1 day to Story 1.6, but eliminates the two highest-risk integration conflicts (doctor and validator collision).

---

## Red Team / Blue Team: Adversarial Stress Test

Five rounds of adversarial analysis. Red Team (Liam, Quinn) attacked the plan; Blue Team (Winston, Bob) defended. Final score: 38-38 (dead even) — plan is solid but all five rounds produced hardenings now integrated into execution phases and guard rails above.

| Round | Attack Vector | Verdict | Hardening Applied |
|-------|-------------|---------|-------------------|
| 1 | **Accuracy Spike Black Hole** — Story 2.1 has unpredictable duration, could stall entire sequence | Blue defends — spike risk is pre-existing; Enhance templates are structural, not accuracy-dependent | Phase 3 spike contingency added to execution phases |
| 2 | **Context Loss Across Sessions** — Claude Code cold starts lose template design reasoning | Red scores — artifacts capture *what* not *why* | Phase 2 must produce `enhance-notes.md` template design rationale as Phase 4 validation checklist |
| 3 | **Doctor Refactor Underscoped** — config-driven doctor is bigger than +1 day | Blue scopes — file-existence validation only; content validation explicitly out of scope | Story 1.6 scope clarification added to epics |
| 4 | **MVP Definition Ambiguous** — "agent skeleton" could mean stub, structural, or generative | Draw — resolved by formalizing Structural tier | Enhance MVP guard rail specifies Structural tier with complete XML activation protocol |
| 5 | **Ergonomics Untested Until Forge** — template correctness ≠ authoring experience | Red wins — mechanical validation misses workflow usability | Phase 6 dogfood exercise: scaffold throwaway module, fill in content, evaluate experience |

---

## Participants

- **Winston 🏗️ (Architect):** Proposed Option C, provided pattern-proof rationale
- **Morgan 🏗️ (Module Builder):** Proposed Option A, endorsed C with extraction-first refinement
- **Bob 📋 (Scrum Master):** Proposed Option B, endorsed C with no-merge guard rail
- **Wendy 🔧 (Workflow Builder):** Mapped Enhance 6-step workflow to phased execution
- **Bond 🤖 (Agent Builder):** Confirmed agent templates are stable from Vortex, flagged sync-point need
- **John 🧪 (QA):** Required generate-and-validate acceptance criterion in Enhance's first epic
