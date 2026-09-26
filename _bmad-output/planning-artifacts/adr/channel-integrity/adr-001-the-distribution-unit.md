---
initiative: convoke
artifact_type: adr
qualifier: channel-integrity-the-distribution-unit
created: '2026-09-26'
status: active
decision_status: accepted
accepted: '2026-09-26'
schema_version: 1
related_initiative: 'Channel integrity (2026-09-26)'
related_decision: 'ADR-004 (invocable-unit declaration); meta-model ADR-001 (name registry)'
related_epic: none
supersedes: none
qualifier_role: operator-authored
signoff_by: amalik
---

# ADR-001: What unit does Convoke distribute?

**Status:** **ACCEPTED** (2026-09-26) — ruled by Amalik: **S4 now, S2 as the destination.**
**Proposed:** 2026-09-26
**Decision owner:** Amalik
**Evidence:** [`convoke-note-channel-integrity-findings-2026-09-26.md`](../../convoke-note-channel-integrity-findings-2026-09-26.md)

---

## Context

Convoke's unit of value is a **module**: agents, workflows, handoff contracts and a
config, coherent together. Every agent-skill distribution channel in existence has a
unit of **one skill**.

Upstream BMAD resolved the same tension on 2026-09-05 (PR #2768, merged to `main`,
+10,907 / −35,677, in no tagged release) and **not** by atomising its personas. It made
the flow addressable: 5 persona skills, 22 personaless process skills, and a `bmad` hub
skill that materialises the runtime. A lone skill self-diagnoses and names the command
that repairs it.

Convoke's measured position, derived 2026-09-26: **7 of 11 agents reachable, 0 of 29
workflows, 0 of 14 contracts.** The seven personaless skills that do exist are all
Convoke's own tooling. Convoke put its plumbing in the channel and kept its product
out of it.

### Why this is an ADR and not a requirement set

A PRD for this work was drafted on 2026-09-26 and **superseded the same day**. Five
independent reviews found that its requirements had already foreclosed three of the
four options below while the document declared the question open. A requirement set
cannot be written before this ruling without deciding it by accident. That is the
lesson this ADR encodes.

### Constraints the ruling must respect — all verified, none assumed

1. **The meta-model budget is spent.** All three ratified deliverables shipped:
   `_bmad/bme/_config/name-registry.csv`, `scripts/audit/name-registry-integrity.js`
   wired at `ci.yml:231`, and meta-model ADR-001 (accepted 2026-09-05), which records
   *"Three deliverables, no epic, budget held."* **Zero new ADRs, registries or checks
   are available under the ratified baseline.** An option needing them needs a new
   ratification first.
2. **`ADR-004 C2` already fixed the declaration shapes** — an agent in
   `agent-registry.js`, or a `config.yaml` workflow entry with `standalone: true`. It
   *considered and rejected* a third shape: *"the repo would then have three ways to
   declare an invocable unit instead of two."* Making contracts addressable needs that
   ADR amended, not assumed.
3. **`preflight-soft-warn` (`project-context.md:419`) names this case.** Future
   dependency preflights *"MUST follow the same contract: stderr WARNING + exit 0
   pass-through; never `process.exit(non-zero)`"*, because false-positive hard-blocks
   *"would trap operators with legitimate non-standard installs (git-clone, monorepo,
   **alternative distribution channels**)."* Any option whose skills refuse to run
   collides with this rule and with Operator Rights OC-R1 and OC-R5, and needs a
   recorded amendment rather than silence.
4. **`team-state-directories` is absolute.** A team keeping state owns `.<team>/` at
   the project root; Gyre's `full-analysis/step-01-initialize.md` branches on
   `.gyre/capabilities.yaml`. Any option that makes Gyre's workflows addressable from a
   plugin cache must say what happens to that file.
5. **No cadence cap may be stated as N-1.** `convoke-arch-bmad-v6.4-v6.8-absorption.md:230`
   records the floor at **N-8** and warns a literal N-1 *"would be in breach on day one
   and would soft-warn permanently."*
6. **Two segments, one codebase.** ~60% BMAD-addon, for whom the channel is the
   doorway; ~40% standalone, who need the whole module and are served by
   `convoke-export`.
7. **There is no self-serve retraction from skills.sh.** A published name is durable.

## Options

### S1 — Installer-led

npm plus `convoke-install-*` remains the only supported path. Channel listings become
funnel entries that state their dependency.

- **Serves:** the 40% standalone segment fully.
- **Starves:** the 60% addon segment, whose channel this is not.
- **Cost:** lowest. No new declaration shape; constraint 1 respected.
- **Collides with:** constraint 3 if the funnel entry *refuses* rather than warns.

### S2 — Publish the differentiator

Promote the 29 workflows and 14 contracts to addressable personaless skills. Personas
go thin. The module stays the unit of *coherence*; it stops being the unit of
*distribution*.

- **Serves:** both segments, in principle.
- **Cost:** highest declared. 43 new addressable units, 43 names from a registry whose
  budget is spent, and an ADR-004 amendment for the contract shape (constraint 2).
  **Note the mechanism partly exists** — `refresh-installation.js` already generates a
  wrapper per `standalone: true` workflow, but **zero** Vortex or Gyre workflows carry
  that flag today, so this is a data change plus a per-module wiring change, not new
  machinery.
- **Collides with:** constraints 1, 2, 4.

### S3 — Two artifacts, one source

`_bmad/bme/` stays the authoring source; a build step emits the channel tree.

- **Serves:** both segments.
- **Cost:** a generator and a drift gate. Constraint 1 forbids the gate under the
  current budget.
- **Note:** this is the option the superseded PRD's FR13 silently eliminated by
  requiring skills to *exist in the repository*.

### S4 — Router stub

One installer/finder plugin on the marketplace; the full catalog on skills.sh. Uses the
channel asymmetry rather than fighting it.

- **Precedent:** the only pattern large suites actually run. NVIDIA/skills (**383**
  skills) publishes one plugin exposing one skill, `nvidia-skill-finder`.
  HuggingFace/skills publishes one plugin, `hf-cli`, and the other 25 arrive through
  its own CLI.
- **Serves:** the 60% addon segment through a channel with real semver dependencies.
- **Cost:** moderate; needs a hub skill, which Convoke does not have — its installer is
  a `bin` entry, which is also why Gyre cannot travel.
- **Note:** upstream's own marketplace copy is a generation behind its skills.sh copy.
  Nobody runs both channels at parity.

## Decision

**S4 now. S2 as the stated destination.** Ruled by Amalik, 2026-09-26.

Convoke publishes **one** deliberate plugin to the Claude Code marketplace — a hub that
installs and repairs the runtime — and the catalog reaches operators behind it. The
module remains the unit of coherence. S2 (promoting the 29 workflows and 14 contracts to
addressable personaless skills) is the declared destination, not deferred indefinitely
and not started now: it requires a ratification this initiative does not hold.

**Ruled in two follow-up lines, 2026-09-26** (C10, C11): the name registry **does** gain a
`kind: skill` row type, and the hub **fronts** the existing CLIs before absorbing them.
**Still open:** the hub's name, and the order of the remediation.

## Consequences

The four constraint questions the ruling had to answer. **Three are settled by S4
itself; one needs a one-line confirmation.**

**C1 — Baseline budget (constraint 1): no re-ratification needed for S4.** *(The one item
this flagged for confirmation was ruled the same day — see C10.)* S4 adds one plugin entry to a manifest that already exists and one hub skill.
It needs no new ADR, no new registry and no new CI check. It does need a **row** in
`_bmad/bme/_config/name-registry.csv`, and the registry currently types rows by team and
agent — a hub skill is neither. **Extending an existing registry with a row type is not
a new deliverable, but it modifies an artifact ratified by meta-model ADR-001, so it
needed a line of its own, given in C10.** S2 will need a full re-ratification; that is
part of what makes it a destination rather than a next step.

**C2 — ADR-004 (constraint 2): not amended. Deferred to S2.** S4 makes nothing newly
invocable beyond the hub, which fits an existing declared shape. ADR-004's rejected
third shape is needed only to make **contracts** addressable, which is S2's work. The
amendment is therefore a precondition *of S2*, recorded here so S2 cannot start by
assuming it.

**C3 — `preflight-soft-warn` (constraint 3): not amended, and this is an argument for
the ruling rather than a cost of it.** S1's shape — a skill that *refuses* and explains
— collides with the rule's stderr-WARNING/exit-0 contract and with Operator Rights
OC-R1 and OC-R5. S4's shape does not: the hub **detects, warns, offers setup and passes
through**, which is the contract the rule already mandates and the pattern upstream runs
at `skills/bmad-prd/SKILL.md` step 1. **S4 is the only option that needs no amendment
here.**

**C4 — `.gyre/` (constraint 4): unchanged, and the question does not arise.** S4 does
not make Gyre's workflows addressable from a plugin cache; the hub materialises the
runtime in the operator's project, so `.gyre/capabilities.yaml` stays at the project
root where `team-state-directories` requires it. **The conflict becomes live only under
S2**, and S2 must state its answer before it starts.

### Consequences beyond the four

**C5 — The hub closes three defects at once, which is why it is the move.** Gyre's
absence from every skills channel, `convoke-install-gyre` being a `bin` entry rather
than a skill, and the absence of any runtime bootstrap are **one defect**: the thing that
builds the runtime is not itself in the channel. The hub is that thing.

**C6 — The manifest becomes intentional.** `.claude-plugin/marketplace.json` is already
the discovery surface; today it declares seven agent paths by accident of authorship.
Under S4 it declares what Convoke means to publish, which is the finding of 2026-09-26
converted into a design.

**C7 — Parity is explicitly not a goal.** Nobody runs both channels at parity; upstream's
own marketplace copy is a generation behind its skills.sh copy. S4 accepts the asymmetry
as the design.

**C8 — The irreversibility constraint still binds, and was RULED 2026-09-27.** There is no
self-serve retraction from skills.sh.

**Ruling: Amalik accepts publishing the name `convoke`.** That is an acceptance of the
**declared-but-unchecked** branch — C8's *declared* half is satisfied by the manifest and the
tracked directory; its *checkable* half is **not**, because the check is a new CI gate that C1's
spent baseline budget forbids. So C8 is satisfied here by an **operator-accepted risk, not by a
check**, and that is the record.

**What the acceptance does and does not cover.** The durable, unretractable artifact is the
**frontmatter `name`** — skills.sh keys a listing on it (`bmad-bme-agent-wade` became a URL and a
`--skill` argument by name, not by path). So this ruling makes the *name* permanent and leaves the
*location* free: the hub may later move to `_bmad/bme/` (`I80`) or to a root `skills/` tree (PR #9's
structural rejection) without a second irreversible act. **The acceptance is not a waiver of the
check** — if the baseline is re-ratified for one gate, C8's second half should still be closed.

**C10 — The name registry gains a `kind: skill` row type.** Ruled 2026-09-26. The
alternative was to declare the hub as an agent, which would misdescribe it — a hub is
neither a team nor an agent. A parallel list was never an option: meta-model ADR-001 made
this registry *the* declaration point, and a second one would undo its purpose. Extending
an existing row type is the cheapest honest option and preserves the single declaration
point. This is a **row-type extension, not a fourth deliverable**, so it does not reopen
the baseline budget — but `scripts/audit/name-registry-integrity.js` must learn the new
kind **in the same change**, or the check goes green on a row it cannot read.

**C10 as implemented, 2026-09-26.** `VALID_KINDS` gained `skill`; the hub is named
**`convoke`**, matching upstream's own `bmad` hub and the `convoke` team row's existing scope
("Core platform, CLI, update system, meta-infrastructure"). The collision is declared on the
new row per A1, and the row is `proposed` — the name is reserved, nothing is built. Two things
the implementation surfaced, recorded here rather than left in a CSV cell:

- **A1 needed no logic change, but its message was wrong.** It already grouped by name and
  counted distinct kinds, so it was kind-agnostic — yet the text read *"is used by both a team
  and an agent"*, true only while `VALID_KINDS` held exactly those two. It now reports the kinds
  actually present. A message naming a defect that does not exist is worse than none: the reader
  goes looking for an agent.
- **⚠️ A2 does not cover skills.** The tracked-source assertion branches on `kind === 'agent'`,
  so a `skill` row's source file is never verified. Harmless today, because `OPERATIONAL` is
  `shipped`/`in-dev` and this row is `proposed` — but **the day the hub ships, the registry will
  assert a skill exists without checking that it does.** That is the presence-only hole ADR-004
  §3 warns about, and it must be closed in the same change that flips this row to `in-dev`, not
  afterwards.

**C11 — The hub fronts `convoke-install`, `convoke-update` and `convoke-doctor` before it
absorbs them.** Ruled 2026-09-26, deliberately against the obvious answer. Upstream's
`bmad` hub does all three itself, and `slash-command-ux-for-user-facing-tools` points the
same way — but absorbing outright means rewriting three working CLIs on the eve of a
channel change, unbudgeted, with the install path as the blast radius. **Fronting them
puts the runtime bootstrap in the channel immediately, which is the whole of C5, without
touching code that works.** It also keeps the binaries intact for the ~40% standalone
segment, who never touch the channel and for whom `convoke-export` is the delivery path.
Absorption becomes a later, measurable step rather than a precondition — the ratified
baseline-before-expansion pattern: ship the small thing, then one measured test.

**C12 — The baseline is NOT re-ratified for a gate. Ruled 2026-09-27.** C8's *checkable* half and
several of `s4-1-1`'s acceptance criteria would each be cheapest as a CI check, and C1 forbids one.
The answer is not to re-ratify: **the ratified sequence is ship, then a tiny baseline, then one
measured test — and the hub is the measured test.** Gating before the test runs inverts the order,
and the standing counter-metric is 111 gates built for ourselves against none shipped to an operator.
So the assertions run as story tasks with their output recorded in the story, the same
declared-but-unchecked posture accepted in C8, and a gate is considered **afterwards** — with
evidence about what actually broke rather than a guess about what might.

**C13 — The hub's location is `.claude/skills/convoke/`, and it joins `I80`. Ruled 2026-09-27.**
The permanent artifact is the frontmatter **name**, not the path, so a later move costs a rename plus
the three tracking sites rather than a second irreversible act. `I80` is already a consolidation row,
so the hub joins it and all three tracked operator-tooling skills move once. PR #9's root-`skills/`
is an upstream marketplace contract, not Convoke's requirement.

**C14 — No doctor coverage for the hub, recorded. Ruled 2026-09-27.** `checkModuleSkillWrappers`
iterates a discovered module's `config.yaml` workflows, so for a non-workflow skill a
`skill-manifest.csv` row is never looked up and changes nothing; neither existing tracked skill has
one. **But silence is not neutral:** `audit-bmm-dependencies.js:515` tests
`startsWith('convoke-')`, and the directory is `convoke`, so the hub classifies as `unknown` and
`convoke-doctor` would report it under `unregistered-custom-skill` **in every operator's tree**.
C10 fixed the name, so `s4-1-1` owns the classifier branch.

**C9 — Unaffected by this ruling.** The six verified defects are remediation and proceed
independently. The air-gapped / internal-registry gap the ledger calls *"real and
unsolved"* is narrowed by neither S4 nor S2 and remains open.

## Not in this ADR

- **The six defects** in the findings note are remediation and do not depend on this
  ruling. They can proceed as a mini-epic on the `fic` / `tfr-epic-1` precedent.
- **The hub skill's name**, and the order in which the six defects are remediated. The
  hub's shape is settled to the extent of C10 and C11; naming follows the `kind: skill`
  extension.
- **The maturity ledger correction** is independent and carries a clock: the document
  is client-facing and was presented on 2026-09-22 containing statements that are false
  in the reassuring direction.
- **The air-gapped / internal-registry gap** the ledger calls *"real and unsolved"* is
  narrowed by no option here and remains open.
