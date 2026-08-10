---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
lastStep: 8
completedAt: '2026-06-21'
prdReconciliationDONE:
  - 'RESOLVED 2026-06-21: ternary propagated to PRD FR6 (classify into 3), NFR10 (class-dependent currency cost), MO2 (class-dependent floor-payback), and Technical Success. PRD and architecture now consistent on the absorption ternary.'
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-covenant-operator.md
  - _bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md
  - _bmad-output/planning-artifacts/convoke-prd-bmad-v6.4-v6.8-absorption.md
  - _bmad-output/planning-artifacts/adr/v4-1/adr-001-guardrails-covenant-enforcement.md
  - _bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md
  - _bmad-output/planning-artifacts/adr/i97/
  - project-context.md
  - _bmad-output/planning-artifacts/convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25.md
workflowType: 'architecture'
project_name: 'Convoke v4.1 (Upstream BMAD Absorption)'
absorption_window: 'v6.4–v6.10'
window_amended: '2026-08-09'
window_amendment_note: 'Window re-baselined v6.8 → v6.10 (Option B). AD1–AD9 survive unchanged — the ternary absorbed the new delta without an architectural revision, which is the design working as intended. Filename qualifier retained pending a governed rename; `absorption_window` is authoritative.'
user_name: 'Amalik'
date: '2026-06-21'
initiative: convoke
artifact_type: arch
qualifier: bmad-v6.4-v6.8-absorption
related_initiative: I113
related_prd: convoke-prd-bmad-v6.4-v6.8-absorption.md
status: complete
schema_version: 1
---

# Architecture Decision Document — Convoke v4.1 (Upstream BMAD Absorption)

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

> **Absorption window: v6.4 → v6.10** (widened from v6.8 on 2026-08-09). **No architectural decision changed.** AD1–AD9 absorbed two unplanned upstream minors without revision — the ternary classified the entire delta as Class A, the schema locks held, and no new component was required. That is the strongest available evidence that the spine was cut at the right altitude. See *Ternary Applied — the v6.9/v6.10 Delta* below.

## Project Context Analysis

### Requirements Overview

**Functional Requirements (27, MVP + Phase-2)** cluster into subsystems:
- **Channel/Cadence engine** (FR1-5, FR24, FR25 + FR6-10): release-channel state, default-channel tracking, **ternary** absorption classification (see below), breaking-change protocol, N-cadence policy + cap-breach surfacing, baseline capture. *The novel subsystem.*
- **Schema-migration engine** (FR11, **FR11b**, FR12-14): module-help **rename** migration (FR11) **and structural conversion** (FR11b) + failure messaging (OC-R6) + parity. *Two operations, not one: FR11 is a 1:1 field rename; FR11b maps a different column vocabulary onto the canonical 13-column header, where `sequence`/`agent`/`options` have no canonical target and a dropped column requires operator confirmation (OC-R5). Same component, materially different risk — a wrong mapping yields a working-but-wrong operator menu rather than a crash.*
- **Covenant-enforcement layer** (FR15-18, FR26): OC-R5 runtime enforcement (per ADR-001) + authoring-time durability check.
- **Compat-Surface Audit** (NFR10 precondition): verifies Convoke content is version-agnostic where it declares compat — turns *latent Class-B* changes into *caught* ones (see Foundational Bet).
- **Observability/reporting** (NFR12): cadence state.
- **Marketplace/distribution** (FR19-22, **Phase-2**): structural restructure (inherits I97 ADRs) + BYO-URL + demand-signal path.
- **Re-entry** (FR23): fork/ancient-pin migration path.

**Non-Functional Requirements (architecture-driving):** NFR10 (class-dependent currency cost — see bet), NFR4 (idempotent recoverable migrations), NFR5 (soft-warn preflight), NFR7/NFR9 (path-safety + allowlist), NFR12 (cadence observability), NFR1 (source-enumerated parity battery).

**Scale & Complexity:** MEDIUM execution, bounded MVP (E2+E4+E7).
- Primary domain: Node.js CLI tooling + LLM-interpreted content (parallel-install; no `bmad-method` dependency)
- Complexity level: MEDIUM (one HIGH-novelty subsystem — the channel/cadence engine)
- Estimated architectural components: ~5 (channel/cadence engine, migration engine, covenant-enforcement layer, compat-surface audit, observability)

### Foundational Bet — the absorption *ternary* (NFR10, corrected from binary)

First-principles analysis established that "absorbing an upstream release" is **three** fundamentally different operations, not two — because Convoke *conforms to BMAD's contracts and coexists*, it does not consume BMAD as code:

| Class | What changed upstream | Convoke's response | Code change? |
|-------|-----------------------|--------------------|--------------|
| **A — Declaration-only** | Nothing Convoke's contracts use | Raise declared compat ceiling | **0 (pure data/manifest)** |
| **B — Conformance-required** | A contract Convoke conforms to (schema, source format, activation) — *E2 itself is Class B* | Bounded, mechanical, migration-assisted content edits | **Cheap, not zero** |
| **C — Breaking** | Runtime behavior Convoke depends on | Logic change via breaking-change protocol | Logic change |

**The data/logic separation bet is sound but scoped to Class A:** channel/floor state lives in a config surface no logic reads as a constant (enabled by `no-hardcoded-versions`). It delivers 0-code-change for Class A; it does **not** make Class B free. The honest floor-payback claim is **class-dependent**, and the cadence engine must **classify into all three**.

> **PRD reconciliation required (tracked in frontmatter):** NFR10 / FR6 / MO2 were written against the binary and must adopt the ternary before epics.

### Ternary Applied — the v6.9/v6.10 Delta *(added 2026-08-09)*

The window re-baseline (v6.8 → v6.10) is the ternary's **first application to upstream releases the architecture did not anticipate**. Full classification lives in the PRD (*v6.9–v6.10 Delta Classification*); the architecturally-relevant findings:

**1. Class A held across ~20 discrete upstream changes — zero code change.** This validates the data/logic separation bet *within its declared scope*. Two structural properties did the work, and both were pre-existing rather than designed as currency insurance:
- **Parallel-install, not package-dependency.** Upstream's installer changes (new platform targets, `uv` probe, module-picker churn) cannot reach Convoke because Convoke is not installed *through* them.
- **Zero Python surface.** The v7 `uv run` pre-announcement — the delta's only pre-declared breaking change — has no Convoke attachment point. Exposure is inherited via BMAD-owned `resolve_customization.py` alone.

  *Architectural note:* these are load-bearing for the Class-A claim but are **not currently expressed as constraints**. They are accidents that happen to hold. If Convoke ever adds a Python script or takes a package dependency on `bmad-method`, the Class-A rate degrades silently. **Recommend AD5 (compat-surface audit) assert both properties** so the invariant becomes checked rather than lucky.

**2. AD2's classification burden is confirmed real, and the MVP design is confirmed adequate.** Reaching "Class A" required source-tree evidence, not release-note reading: `post-install-message` *looked* Class B from the notes and was Class A on inspection (field is optional, Convoke omits it); the `bmad-investigate` retirement *looked* Class B (registered in 4 manifests) and was Class A because `validator.js` asserts on none of them. **Both would have been over-classified from notes alone.** The MVP's assisted operator-declaration with safety asymmetry handled this correctly — conservative default, evidence to downgrade. It also sharpens the **contract-diff probe** (AD2's v4.1.x target): the probe must diff *what Convoke consumes*, not what upstream changed, or it will reproduce exactly these two false positives.

**3. AD9 gets its first entry, and it is a Class-A record.**

```yaml
# AD9 baseline entry #1
date:         2026-08-09
from_version: 6.8.0
to_version:   6.10.0
class:        A            # declaration-only
files_touched: 0
effort:       classification-only   # no implementation
```

Recorded honestly, this is **n=1 on a favourable window** — it establishes Class-A is *achievable and detectable*, not that it is the common case. AD9 exists to accumulate exactly this kind of entry until the cadence-cost claim rests on a distribution rather than an anecdote.

**4. One Class-C candidate is deferred, not absorbed.** Upstream's canonical shared memlog (`src/scripts/memlog.py`, v6.9) is not forced — Convoke has no coupling — but it occupies the same architectural role as Vortex's **HC1–HC10 handoff contracts** and the initiative-lifecycle backlog: durable working memory across agent boundaries. Adopting it, ignoring it, or bridging to it is a genuine architectural fork with a one-way-door flavour. **Not decided here.** → v4.2 spike, logged so the decision is made deliberately rather than by default.

### Technical Constraints & Dependencies
- **Parallel-install model** — no `node_modules/bmad-method`; conformance is structural/contractual.
- **`depends: I97/v4.0 ship`** — the whole initiative gates on it.
- **Reuse existing tooling** — `migration-runner`, `refresh-installation`, `validator`, `config-merger`.
- **project-context rules** — no-hardcoded-versions, no-process-cwd-in-libs, path-safety, slash-command-ux, covenant-compliance, namespace-decision.
- ~~**E7 retrofit `sequence-after` Epic 1B**~~ — **constraint LIFTED 2026-08-09** (decoupling spike: 1B gate is soft; 1B.3's `_bmad/bme/` grep already passes at 0 matches, so no double-touch is possible). E7 sequences normally.
- **E1 inherits I97's 5 ADRs** (marketplace structure).

### Cross-Cutting Concerns Identified
- **Data/logic separation for currency (NFR10, Class A):** channel/floor state in manifest/config so a Class-A absorption touches *data, not code*. The most architecturally-consequential constraint.
- **Compat-surface version-agnosticism (NFR10 precondition):** Convoke content must not embed version-specific assumptions where it declares compat, else Class-A bumps become *latent Class-B*. New concern surfaced by First Principles.
- **Shared migration-safety contract (NFR4/NFR6/NFR7):** every install-touching op (E2 schema, E4 channel switch, E4 breaking-change, FR23 re-entry) shares one idempotent + path-safe + recoverable contract.
- **Covenant enforcement as a layer (E7):** OC-R5 enforcement spans all `_bmad/bme/` skills + an authoring-time gate (FR26) — a cross-cutting mechanism, not a component.
- **Observability (NFR12):** cadence state queryable across channel + cadence + policy.
- **Verification/parity harness (NFR1/MO7):** the PF1-style battery validates every install-touching change.

## Starter Template Evaluation

**N/A — brownfield extension.** v4.1 adds to the shipped Convoke repository; there is no greenfield starter. The de-facto "starter" is the existing codebase and its established patterns, which all v4.1 decisions build on and must not regress:

**Established Technology Baseline:**
- **Runtime/Language:** Node.js, CommonJS, no TypeScript
- **Test:** `node:test` (migrated off Jest); fixture-isolation discipline (`test-fixture-isolation`)
- **Lint:** ESLint (`lint-passes-before-review` gate)
- **Update/migration tooling:** `scripts/update/lib/` — `migration-runner`, `refresh-installation`, `validator`, `config-merger`, `utils` (`getPackageVersion`, `findProjectRoot`)
- **Content:** `_bmad/bme/` skills (markdown `SKILL.md` + `workflow.md` + steps), v6.3+ outcome-based format
- **Distribution:** npm (`convoke-agents`) + marketplace — **parallel-install** to BMAD
- **CLI surface:** `convoke-*` bin entries wrapped as `bmad-*` slash-command skills

**Implication:** v4.1 introduces **no new frameworks or languages**. The new subsystems (channel/cadence engine, compat-surface audit, covenant-enforcement layer) are authored in the existing Node.js/CommonJS style, reuse the existing tooling, and follow project-context rules. The first implementation story is **not** "init a starter" but "extend `scripts/update/lib/` with the channel/cadence module."

## Core Architectural Decisions

*No web-version search applicable — v4.1 introduces zero new technology; every decision is structure/pattern within the existing Node.js/CommonJS stack. Decisions hardened via party-mode review (Amelia/Murat/Mary), 2026-06-21.*

### Decision Priority Analysis
- **Critical (block implementation):** AD1 cadence state storage · AD2 absorption classification · AD3 migration-safety contract · AD4 Covenant enforcement.
- **Important (shape architecture):** AD5 compat-surface audit · AD6 N-cadence policy + observability · AD7 slash-command surface · AD8 concurrency/locking · AD9 baseline capture.
- **Deferred:** contract-diff probe (AD2 target design → v4.1.x fast-follow); marketplace structural (E1 Phase-2, inherits I97 ADRs); E3/E5/E6 spikes (v4.2).

### AD1 — Cadence State Storage *(the NFR10 enabler)*
**Decision:** Channel/floor/policy/cadence state lives in a dedicated config surface (`_bmad/_config/cadence.yaml`), owned and read **exclusively by `cadence-state.js`** — **never hardcoded constants**. Fields: `channel`, `pinned_floor`, `declared_ceiling`, `policy_cap`, `last_absorption`.
**Rationale:** This *is* the data/logic separation — the enabler of Class-A 0-code-change. **Affects:** FR1-4, FR9, FR24, NFR8, NFR10, NFR12.

**✅ OQ-1 — RESOLVED 2026-08-09 (operator: Amalik; option (c)).** *Raised 2026-06-28; escalated by the 2026-08-09 IR run as M1 (resolve **before** sprint-planning — Story 1.1 is story 1 of 21 on the critical path and was not implementable as written).*

**The contradiction.** AD1 originally said cadence state is *"read via the config-loader,"* while AD8 / Component Boundaries assert *"only `cadence-state.js` reads/writes `cadence.yaml` — no other module touches the file directly."* These conflicted on **who reads the file**.

**Resolution — (c): `cadence-state.js` owns `cadence.yaml` outright; the `_bmad/` traversal guard is extracted into a shared helper.** AD1's wording is amended above to remove "read via the config-loader." `config-loader.js`'s public signature is **unchanged** — no Story 1A.2 AC9 amendment is required. The only shared code is the security-critical path guard, extracted from `config-loader.js` ([lines 108-122](../../scripts/update/lib/config-loader.js#L108-L122)) into a helper both modules call.

**Why (c) over the originally-leaning (a) and the mechanically-simpler (b)** — two findings from the 2026-08-09 code re-read that the original framing did not have:

1. **The "frozen API" is frozen over nobody.** `loadModuleConfig` has **zero production callers** — the only `scripts/` reference is the literal string `config-loader.js` inside a deprecation message at `scripts/update/migrations/3.3.x-to-4.0.0.js:42`; the sole caller is `tests/lib/config-loader.test.js`. (Consistent with its reserved-component status.) A frozen API protects consumers; there are none. So (b)'s headline cost was largely theoretical — it is a *spec* commitment, not a *compatibility* one.
2. **(a) was not free, and its API shape does not fit.** `config-loader.js` exports only `loadModuleConfig`; the internals (a) proposed delegating to — traversal guard, `_resolveProjectRootPlaceholder`, legacy fallback — are all private, so (a) opens the module up regardless. Worse, `loadModuleConfig` takes a *module directory* and appends `config.yaml` (`scripts/update/lib/config-loader.js:115`); `loadModuleConfig(root, '_config')` therefore resolves to `_bmad/_config/config.yaml` — **the wrong file**. The API needed more than a filename parameter; its module-directory shape is a poor fit for a singleton state file.

**The deciding argument — structural over conventional.** Under (b), once `loadModuleConfig` accepts a filename, *any* module can reach `cadence.yaml` through it, and AD8's single-owner rule survives only as convention. Convoke had a convention-based boundary fail on this exact date: the BMAD installer overwrote `_bmad/_config/skill-manifest.csv` at commit `a16fa340` (2026-06-27), stripping the four Convoke-owned columns (`install_to_bmad`, `tier`, `intent`, `dependencies`) and every Convoke-owned row — 54 test failures and six weeks of red CI, caught 2026-08-09. `cadence.yaml` is the same shape of asset: a file Convoke owns that other tooling has reason to read. (c) makes the boundary **impossible to cross** rather than **documented as not-to-be-crossed**.

**Rule-of-Three note (deliberate override).** Extracting the guard at two consumers rather than three is intentional: a duplicated path-traversal guard does not decay into mere debt when copies drift — it decays into a vulnerability, present only in the copy nobody remembered to patch. Convoke's `path-safety-for-destructive-ops` rule governs the same class of check.

**Implementation consequences** (for story-creation): one new shared guard helper (~20 lines, extracted not authored); `config-loader.js` refactored to call it (public signature untouched); `cadence-state.js` implements its own YAML read + `{project-root}` resolution against `_bmad/_config/cadence.yaml`. **AD8 is unchanged and now structurally true.**

Source: codebase audit 2026-06-28 — [`docs/codebase-audit-2026-06-27.md`](../../docs/codebase-audit-2026-06-27.md) finding #20; resolution evidence 2026-08-09 (caller enumeration + API-shape re-read).

### AD2 — Absorption Classification *(the ternary engine)*
**Decision (MVP):** **Assisted operator-declaration** of class A/B/C — the engine presents a classification checklist; the operator confirms (Covenant: operator is resolver). **Safety asymmetry:** when uncertain, default to the **more conservative** class; **under-classification requires an explicit operator override** (because under-classification = silent non-conformance, the dangerous error; over-classification is merely wasteful).
**Target design (v4.1.x fast-follow):** a **contract-diff probe** — fetch the upstream release's contract-bearing files at the release tag (reusing the E7-spike `raw.githubusercontent` mechanism), diff against Convoke's declared-conformant baseline (no diff → Class A; contract diff → ≥ Class B; removal/behavioral markers → Class C candidate), and *propose* the class for operator confirmation. An ergonomics upgrade (better default), not a safety requirement — hence fast-follow.
**Rationale:** Honors the ternary + OC-R1 (default) + OC-R3 (rationale); the AD5 gate backstops under-classification. **Affects:** FR6-8, NFR10, MO2.

### AD3 — Migration-Safety Contract *(shared)*
**Decision:** One safety contract — backup → path-safety guard (resolve+normalize+contains-check) → idempotency check → apply → verify/recover — through which **all** install-touching ops route (E2, E4 channel/breaking, FR23).
**Caveat (verify first):** confirm `migration-runner` is not forward-only. If it has no rollback, the safety contract is a **new opt-in component** migrations call, **not** a modification of the runner (avoid destabilizing existing migrations).
**Rationale:** One contract satisfies NFR4 + NFR7 across every mutation; reuses existing patterns where safe. **Affects:** FR11, **FR11b**, FR12-14, FR23, NFR4, NFR6, NFR7. *(FR11b routes through this contract identically to FR11 — see epics Story 2.4 AC3.)*

### AD4 — Covenant Enforcement Mechanism *(E7)*
**Decision:** Per **ADR-001**, agent-internal self-confirmation extended to OC-R5 pause points (runtime). The authoring-time durability check (FR26) is CI-gated.
**Caveat (placement):** OC-R5 enforcement is **content-semantic** (does a skill self-confirm at pause points?), not structural — decide deliberately between extending the existing `validator` and a **sibling checker**, to avoid false-positive bloat in the structural validator.
**Rationale:** CI gate makes E7 durable, not a one-time retrofit. Consumes ADR-001, doesn't re-open it. **Affects:** FR15-18, FR26, NFR11.

### AD5 — Compat-Surface Audit *(elevated — the under-classification backstop)*
**Decision:** A CI check flagging version-specific assumptions in `_bmad/bme/` content (hardcoded BMAD-version strings, version-gated behavior). **Elevated from detect-only to gating the Class-A declaration-bump path** — a Class-A bump is blocked if the audit finds version-specific assumptions (which would make the bump a *latent Class-B*).
**Rationale:** The architectural backstop against the dangerous misclassification (Class-B-read-as-A); catch-all-phase spot-check discipline for false positives. **Affects:** NFR10 precondition; ternary integrity.

**Amendment 2026-08-09 — assert the two properties that make Class A possible.** The v6.9/v6.10 delta classified Class A largely because of two structural properties of Convoke that are currently *accidental*, not *asserted*: (a) Convoke installs **parallel to** BMAD and takes no package dependency on `bmad-method`; (b) Convoke ships **zero `.py` files** and no `_bmad/bme/` skill invokes `python3`. Together these made upstream's installer churn and the v7 `uv run` breaking pre-announcement inert. **Neither is enforced anywhere.** Add both as AD5 audit assertions, so that adding a Python script or a `bmad-method` dependency fails the compat-surface audit rather than silently degrading the Class-A rate. This is the cheapest available form of the invariant: the property already holds, so the assertion starts green and only ever fires on a real regression.

### AD6 — N-Cadence Policy + Observability
**Decision:** The binding policy is a **governed markdown artifact** (like the Covenant) declaring `policy_cap` + the breaking-change protocol. Cap-breach (FR24) reads `cadence.yaml` lag vs cap at preflight → **soft-warn** (NFR5, never block). Observability (NFR12): a `convoke-cadence status` command reporting floor/cap/lag/last-absorption.
**Rationale:** Policy-as-artifact gives "binding" a home; soft-warn gives teeth without blocking; status makes it observable. **Affects:** FR9, FR24, NFR5, NFR12.

### AD7 — Slash-Command Surface *(E4 UX)*
**Decision:** A `bmad-cadence` skill wrapping a `convoke-cadence` CLI, per the established skill-wraps-tested-CLI pattern; Covenant-compliant (defaults, pause, rationale).
**Rationale:** slash-command-ux rule; reuses the Epic-2 architecture (`.claude/skills/bmad-*` + `scripts/convoke-*` + bin entry). **Affects:** FR5, FR1-4, FR24.

### AD8 — Concurrency / Locking *(new)*
**Decision:** `cadence.yaml` is shared mutable state (written by channel ops, read by preflight + status). All writes go through the Epic-2 **`_withCsvLock` advisory-lock** pattern (generalized to the cadence file) to make concurrent `convoke-update` / `convoke-cadence` safe.
**Rationale:** Reuses a proven Convoke concurrency primitive; prevents torn reads/writes. **Affects:** AD1, AD3, AD6.

### AD9 — Baseline Capture Mechanism *(new — makes MO2b measurable)*
**Decision:** Each absorption appends a **structured record** (class A/B/C, files-touched count, effort unit) to an absorption log. The v4.1 absorption itself is the first baseline entry (NFR10/MO2b).
**Rationale:** Without a structured record, MO2 (floor pays back) and MO2b (baseline captured) are unmeasurable; this is the data substrate for the floor-payback regression gate (NFR13). **Affects:** FR10, MO2, MO2b, NFR10, NFR13.

**Amendment 2026-08-09 — entry #1 exists and predates the implementation.** The v6.8 → v6.10 absorption is recorded as baseline entry #1 (Class A, `files_touched: 0`, `effort: classification-only`) *before* the log mechanism is built. Two consequences for implementation: (1) the log's first write must be a **backfill**, so the schema has to accept a historical entry rather than assuming append-at-time-of-absorption; (2) the schema's `effort` field needs a value for absorptions that involve **classification but no implementation** — the original design implicitly assumed effort meant "work done," and Class A's whole point is that there isn't any. Both are small, but they are the kind of assumption that only surfaces when a real entry arrives.

### Decision Impact Analysis
- **Implementation sequence:** AD1 (state) → AD8 (locking) → AD3 (safety) → AD2 (classifier, MVP) + AD6 (policy/observability) + AD9 (baseline) → AD7 (slash surface) → AD4/AD5 (CI gates). ~~AD4 (E7) `sequence-after` Epic 1B.~~ **Lifted 2026-08-09 — 1B gate is soft (decoupling spike); AD4/E7 sequences normally.** Contract-diff probe (AD2 target) deferred to v4.1.x.
- **Cross-component dependencies:** AD1 underpins all (state); AD8 guards AD1 writes; AD3 underpins all mutations; AD2 reads AD1+AD6 and is backstopped by AD5; AD4 consumes ADR-001; AD9 feeds NFR13's regression gate.

## Implementation Patterns & Consistency Rules

*Baseline: all existing `project-context.md` rules apply and govern (no-hardcoded-versions, no-process-cwd-in-libs, test-fixture-isolation, slash-command-ux, covenant-compliance, derive-counts-from-source, shared-test-constants, verification-pipefail, path-safety-for-destructive-ops, catch-all-phase-review). They are not restated. The patterns below are v4.1-specific additions.*

### Naming & Schema Locks *(primary divergence risk)*
- **Cadence state (`cadence.yaml`):** exact snake_case fields matching `config.yaml` convention — `channel`, `pinned_floor`, `declared_ceiling`, `policy_cap`, `last_absorption`. No agent renames/adds fields without an ADR.
- **Absorption class identifiers:** canonical strings `declaration-only` / `conformance-required` / `breaking` — used *identically* in classifier, logs, status, tests; held in a **shared constants module** (per `shared-test-constants`).
- **Absorption-record schema (AD9):** fixed fields `date`, `from_version`, `to_version`, `class`, `files_touched`, `effort`.
- **File locations:** state → `_bmad/_config/cadence.yaml`; N-cadence policy → governed markdown in planning-artifacts; absorption log → fixed path.
- **CLI/skill names:** one CLI `convoke-cadence` (not split); slash-command skill `bmad-cadence`; bin entry `convoke-cadence`.

### Structure Patterns
- Cadence/channel module under `scripts/update/lib/` (alongside `migration-runner` et al.), **not** a new top-level dir.
- Tests in `tests/unit` / `tests/integration` with **fixture-isolation**; shared constants extend the `test-constants.js` pattern.

### Format Patterns
- **Soft-warn:** all cadence/preflight warnings → `chalk.yellow` WARNING to stderr, **exit 0** (`preflight-soft-warn`). Never block.
- **Next-action errors (OC-R6):** failures **name the remedy command** (e.g., "Run `convoke-cadence recover`") — never bare "failed."
- **Status output:** `convoke-cadence status` reports floor/cap/lag/last-absorption in a fixed, parseable shape.

### Process Patterns
- **All install-touching writes route through the AD3 migration-safety contract** — direct `fs` writes to install paths outside the wrapper are forbidden.
- **All `cadence.yaml` writes acquire the AD8 advisory lock.**
- **The `bmad-cadence` skill passes the covenant-compliance checklist (OC-R0…R7)** before review (FR26 enforces this for all `_bmad/bme/` skills).

### Enforcement
- CI gates: validator (AD4 OC-R5 check) + compat-surface audit (AD5) + lint + parity battery (NFR1).
- Shared constants prevent class-identifier drift; `derive-counts-from-source` for any counts (pause-point skills, agents).

## Project Structure & Boundaries

### v4.1 Additions to the Existing Repo *(NEW / MODIFIED)*

```
convoke-agents/                              # existing repo
├── package.json                             # MODIFIED: + convoke-cadence bin entry
├── scripts/
│   ├── convoke-cadence.js                   # NEW  AD7 — CLI (status/pin/channel/classify)
│   └── update/
│       ├── lib/
│       │   ├── cadence-state.js             # NEW  AD1 cadence.yaml I/O + AD8 advisory lock
│       │   ├── cadence-engine.js            # NEW  AD2 ternary classifier (assisted)
│       │   ├── migration-safety.js          # NEW  AD3 backup→guard→idempotent→recover
│       │   ├── absorption-log.js            # NEW  AD9 structured baseline record
│       │   ├── compat-surface-audit.js      # NEW  AD5 version-assumption audit
│       │   ├── migration-runner.js          # MODIFIED  AD3 integration (or new opt-in wrapper)
│       │   ├── validator.js                 # MODIFIED  AD4 OC-R5 enforcement check
│       │   └── config-loader.js             # MODIFIED  load cadence.yaml
│       └── migrations/
│           └── <ver>-module-help-schema.js  # NEW  E2 schema rename (delta-only)
├── _bmad/
│   ├── _config/
│   │   └── cadence.yaml                      # NEW  AD1 state surface
│   └── bme/ … (pause-point skills)          # MODIFIED  E7 OC-R5 self-confirm retrofit (1B gate lifted 2026-08-09)
├── .claude/skills/bmad-cadence/             # NEW  AD7 slash-command skill (SKILL.md + workflow.md)
├── scripts/portability/test-constants.js    # MODIFIED  + class identifiers (shared constants)
├── tests/
│   ├── unit/{cadence-state,cadence-engine,migration-safety,absorption-log,compat-surface-audit}.test.js   # NEW
│   └── integration/cadence-cli.test.js      # NEW  convoke-cadence e2e (fixture-isolated)
├── _bmad-output/planning-artifacts/
│   └── convoke-policy-n-cadence.md          # NEW  AD6 governed policy + breaking-change protocol
└── .github/workflows/ci.yml                 # MODIFIED  + compat-surface audit + OC-R5 validator gates
```

**Phase-2 (E1, deferred):** `skills/` at repo root + `module.yaml` + `module-help.csv` restructure — inherits I97's 5 ADRs. Not in the MVP tree.

### Component Boundaries
- **State boundary:** only `cadence-state.js` reads/writes `cadence.yaml` (all access through it + AD8 lock). No other module touches the file directly.
- **Mutation boundary:** all install-touching writes go through `migration-safety.js` (AD3). Direct `fs` writes to install paths are forbidden.
- **Classification boundary:** `cadence-engine.js` owns the ternary; consumes `cadence-state` + the policy artifact; backstopped by `compat-surface-audit`.
- **Enforcement boundary:** `validator.js` (or sibling, per AD4 caveat) owns OC-R5 + compat-surface CI gates.
- **UX boundary:** `bmad-cadence` skill is the only operator-facing surface; `convoke-cadence.js` is the tested CLI beneath it.

### Requirements → Structure Mapping
| FRs | Location |
|---|---|
| FR1-5, FR25 (currency) | `cadence-state.js` + `convoke-cadence.js` + `bmad-cadence/` |
| FR6-8 (classification) | `cadence-engine.js` |
| FR9, FR24 (policy/cap-breach) | `convoke-policy-n-cadence.md` + `cadence-engine.js` + preflight |
| FR10 (baseline) | `absorption-log.js` |
| FR11, **FR11b**, FR12-14 (schema migration) | `migrations/<ver>-module-help-schema.js` + `migration-safety.js` — FR11 rename; **FR11b structural conversion** (column-semantics mapping, OC-R5 gate on dropped columns) |
| FR15-18, FR26 (Covenant) | `_bmad/bme/` retrofit + `validator.js` |
| FR23 (re-entry) | `cadence-state.js` + `migration-safety.js` |
| FR19-22 (marketplace) | **Phase-2** root restructure (deferred) |

## Architecture Validation Results

### Coherence Validation ✅
- **Decision compatibility:** AD1–AD9 form a consistent dependency chain (state → lock → safety → classify → backstop); no contradictions; ADR-001 consumed cleanly by AD4.
- **Pattern consistency:** schema locks support AD1/AD9; soft-warn supports AD6; the migration-safety contract supports AD3; CLI/skill naming supports AD7.
- **Structure alignment:** component boundaries enforce the AD-set (state = AD1+AD8; mutation = AD3; UX = AD7).

### Requirements Coverage Validation ✅
- **FRs:** all MVP FRs (1-18, 23-26) mapped to components; FR19-22 intentionally Phase-2.
- **NFRs:** NFR1→parity battery · NFR2/3→conformance+AD5 · NFR4/6/7→AD3 · NFR5→AD6 soft-warn · NFR8→AD1 · **NFR9→input allowlist in `convoke-cadence.js`/`cadence-engine.js` parsing (homed during validation)** · NFR10→AD1+AD2+AD5 · NFR11→AD4 · NFR12→AD6 · NFR13→AD9 · NFR14→patterns/enforcement.

### Implementation Readiness ✅ *(with bounded conditions)*
Decisions complete, patterns enforceable, structure specific with full FR mapping.

### Gap Analysis
- **Critical:** none blocking.
- **Important (close before/at epics):**
  1. **PRD reconciliation** — the ternary must propagate to PRD **NFR10/FR6/MO2** (tracked in frontmatter `prdReconciliationTODO`).
  2. **Two verify-at-implementation caveats:** AD3 (confirm `migration-runner` isn't forward-only) + AD4 (validator-rule vs sibling-checker for the content-semantic OC-R5 check).
- **Deferred:** contract-diff probe (AD2 target → v4.1.x); full auto-detection; E1/E3/E5/E6.

### Architecture Completeness Checklist
- ✅ Requirements analysis (context, scale, constraints, cross-cutting concerns)
- ✅ Architectural decisions (AD1–AD9, critical + important, with rationale)
- ✅ Implementation patterns (schema locks, structure, format, process, enforcement)
- ✅ Project structure (NEW/MODIFIED tree, boundaries, FR→structure mapping)

### Architecture Readiness Assessment
**Status: READY FOR IMPLEMENTATION** *(conditions: close the PRD reconciliation; resolve the 2 AD caveats at implementation-time)*
**Confidence: HIGH** — bounded conditions, no open architectural unknowns.
**Key strengths:** the **ternary correction** (caught the naive "0-code-change" bet using v4.1's own E2 as counterexample); data/logic separation scoped correctly to Class A; the **safety asymmetry** on classification; reuse of proven Convoke primitives (`_withCsvLock`, `migration-runner`, `validator`).
**Future enhancement:** contract-diff probe; auto-detection; E1/E3/E5/E6 (Phase-2 / v4.2).

### Implementation Handoff
- **AI agent guidelines:** follow AD1–AD9 and the consistency rules exactly; respect component boundaries; route all install-touching writes through the AD3 contract; all `cadence.yaml` access through `cadence-state.js` + AD8 lock.
- **First implementation priority:** AD1 (`cadence-state.js` + `cadence.yaml` schema) + AD8 (advisory lock).
- **Sequence:** AD1 → AD8 → AD3 → AD2+AD6+AD9 → AD7 → AD4/AD5. *(E7's `sequence-after Epic 1B` constraint was lifted 2026-08-09 — decoupling spike found the gate soft.)*
- **Gate before epics:** close the PRD reconciliation (ternary → NFR10/FR6/MO2).
