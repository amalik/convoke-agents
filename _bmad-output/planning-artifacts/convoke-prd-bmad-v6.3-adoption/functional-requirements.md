# Functional Requirements

*The capability contract. Every feature shipped in 4.0 must trace back to one of these FRs. Any capability not listed here does not exist in the release. Organized by logical capability areas, not by workstream.*

## Direct-Load Configuration

- **FR1:** Convoke agents load module configuration directly from `_bmad/{module}/config.yaml` without invoking the `bmad-init` skill.
- **FR2:** Convoke provides a direct-YAML loader utility that replaces `bmad-init` functionality for all agent activation flows.
- **FR3:** Every Convoke agent's activation protocol follows the v6.3-compliant direct-load pattern after migration.
- **FR4:** No Convoke skill in the `_bmad/` source tree retains an active reference to `bmad-init` (documentation and historical notes explaining the removal are allowed).

## User Migration

- **FR5:** The operator can upgrade Convoke 3.2.0 → 4.0 in a single command (`convoke-update`).
- **FR6:** Convoke auto-migrates existing `_bmad/core/config.yaml` and `_bmad/{module}/config.yaml` layouts to v6.3-compliant direct-load conventions during upgrade.
- **FR7:** The migration script is idempotent — re-running it produces no side effects after the first successful run.
- **FR8:** The migration script performs only operations within Convoke-owned paths and passes path-safety analysis per the Convoke memory feedback rule.
- **FR9:** The operator can re-run `convoke-update` after a failed migration and resume safely (re-entrancy).
- **FR10:** The operator is presented with a migration guide ≤1 page in length, linked from the terminal output of `convoke-update` and from the CHANGELOG.
- **FR11:** The migration guide introduces zero new concepts the operator must learn (no new agent names, no new config keys, no new workflows).

## Extensions Compatibility Governance

- **FR12:** Convoke maintains `_bmad/_config/bmm-dependencies.csv` — a registry enumerating every Convoke-owned skill that extends a BMM agent.
- **FR13:** A committed scan tool regenerates `bmm-dependencies.csv` from the `.claude/skills/` filesystem as the canonical source of truth.
- **FR14:** `convoke-doctor` validates the BMM dependency registry as a standing health check and surfaces drift (new skills, removed skills, unregistered custom skills).
- **FR15:** `convoke-update` executes a post-upgrade regression gate against the BMM dependency registry before completing.
- **FR16:** The operator can register a custom skill that extends a BMM agent by adding a row to `bmm-dependencies.csv`.
- **FR17:** Convoke displays honest warnings for detected-but-unregistered custom skills — warnings are informational, not blocking.
- **FR18:** The recursive tooling validation (`bmad-enhance-initiatives-backlog` passing WS4 gate first) is enforced as the first validation target before any other dependency inventory work.

## Marketplace Distribution

- **FR19:** Convoke publishes a `.claude-plugin/marketplace.json` at the repo root that passes BMAD's PluginResolver validation.
- **FR20:** The marketplace entry references `_bmad/bme/_vortex/module.yaml` as the `module_definition`.
- **FR21:** A new user can install Convoke through the BMAD community module browser with no manual workarounds.
- **FR22:** Marketplace install produces the same Convoke state as standalone `convoke-install` (dual-distribution parity, validated by post-install filesystem diff).
- **FR23:** Convoke performs a runtime compatibility preflight check at install and upgrade time, protecting against the missing `bmad_version` field in the marketplace schema.
- **FR24:** Convoke is registered in `bmad-plugins-marketplace/registry/community/convoke.yaml` with `trust_tier: unverified` and valid `module_definition` metadata.
- **FR25:** Convoke supports three installation methods simultaneously: standalone CLI, BMAD marketplace, and direct git clone with manual install.

## Agent Consolidation Tracking

- **FR26:** `bmad-agent-qa`, `bmad-agent-sm`, and `bmad-agent-quick-flow-solo-dev` are removed from Convoke's bmm module installation (source tree + installed artifacts).
- **FR27:** Convoke integrates upstream Amelia (v6.3+) as the sole consolidated developer/QA/SM agent.
- **FR28:** Convoke's manifests (`skill-manifest.csv`, `files-manifest.csv`, `agent-manifest.csv`) reflect the consolidated Amelia lineup with no stale references.
- **FR29:** Convoke workflows with historical references to Bob/Quinn/Barry are updated to reference Amelia.
- **FR30:** Cross-reference grep confirms no remaining mentions of removed agents in any Bme (Vortex, Gyre, etc.) workflows.

## Release Discipline & Playbook

- **FR31:** Convoke delivers a `host_framework_sync` playbook artifact at a committed path as a 4.0 deliverable, signed off by Winston.
- **FR32:** The playbook documents release class definition, trigger criteria, workstream template, validation battery reference, and known-pitfalls in a reusable format.
- **FR33:** The operator runs three pre-registered experiments (EXP1, EXP2, EXP3) during Sprint 1 and logs go/no-go decisions for each.
- **FR34:** Each Sprint 1 experiment produces a documented "what this changed downstream" statement in the Sprint 1 artifact.
- **FR35:** A strategic bet ADR is created at a committed path containing decision, ≥2 alternatives considered, revalidation trigger, and link to the PRD.

## Validation & Behavioral Equivalence

> **⛔ FR36-FR38 SUPERSEDED 2026-08-13 by [ADR-001](../adr/v63/adr-001-retire-m9-pf1-gate.md).**
> Retained below, not deleted, so the original requirement stays legible next to why it changed.
> **Reason:** the PF1 instrument cannot separate signal from noise on this material — the Path B+
> control agent `stack-detective` had byte-identical source across the compared commits yet
> produced differing recordings, so agent run-to-run variance is confounded with migration effect.
> **Replaced by** deterministic agent-surface parity (`scripts/audit/agent-surface-parity.js`):
> 12 agents, menu codes and config-load verified exactly, in seconds, no API key.
> **Convoke 4.0 therefore ships without a behavioural-equivalence claim** — user-facing copy was
> corrected accordingly. **FR39 and FR40 are unaffected and still stand.**

- ~~**FR36:**~~ *(superseded)* Convoke executes a pre-release agent behavioral equivalence validation battery (PF1) against representative inputs sampled from `_bmad-output/vortex-artifacts/`.
- ~~**FR37:**~~ *(superseded)* The validation battery compares pre-migration and post-migration agent outputs within a numerically-defined drift threshold T (defined in architecture NFRs).
- ~~**FR38:**~~ *(superseded)* A validation failure (drift beyond T on any input) blocks release progression.
- **FR38a** *(replaces FR36-FR38, ADR-001):* Convoke verifies **agent-surface parity** between the previous release tag and the release candidate — every agent still present, every menu code preserved, activation still loading config — deterministically and in CI. A parity break blocks release progression. This asserts contract parity, **not** behavioural equivalence.
- **FR39:** The operator can capture pre/post skill output drift snapshots for 2–3 key skills (e.g., `bmad-enhance-initiatives-backlog`, a Vortex stream output, a PRD draft output) as a retrospective observation artifact.
- **FR40:** An external non-maintainer user runs the upgrade on their own install and reports no issues before release. The external validation is logged in the release record.

## Release Communication

- **FR41:** Convoke's CHANGELOG contains the `mostHonestOneLineSummary` text verbatim and follows the section structure from Sophia's ship-ready draft.
- **FR42:** The CHANGELOG is grep-tested against the cliché list from `partyFindingsRound2.PR2-5` and contains zero violations.
- **FR43:** The PRD and derivative release documents distinguish `internalOnly` from `userFacing` vocabulary annotations; user-facing documents contain no phrases from the `internalOnly` list.
- **FR44:** The maintainer sign-off on the CHANGELOG is recorded in the release commit message.

## Quality Gates

- **FR45:** The IR gate (`bmad-check-implementation-readiness`) is executed against the architecture doc before any epic implementation story starts. Sprint 1 pre-registered experiments are exempted from this rule.
- **FR46:** The architecture doc exists at a committed path, defines drift threshold T numerically, and has passed the IR gate with a logged result.

## Retrospective & Learning

- **FR47:** A retrospective is scheduled in Sprint 0 with owner named, date committed, feedback process documented, and target backlog destination (`convoke-note-initiatives-backlog.md`) identified.
- **FR48:** The retrospective produces an updated `convoke-anti-patterns.md` registry capturing anti-patterns observed during 4.0 execution.
- **FR49:** The retrospective explicitly addresses each innovation hypothesis (I1, S1, S3, I3, I5, S2, L1) with an observation result or deferred-until-later note.
- **FR50:** Retrospective findings feed back into `convoke-note-initiatives-backlog.md` as new or updated items with traceable provenance.
