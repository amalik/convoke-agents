# Innovation & Novel Patterns

## Framing: Mature Discipline for a Young Domain

Convoke 4.0 does not invent breakthrough techniques. It **imports mature disciplines from traditional software, compiler theory, lean UX experimentation, and editorial practice into a young domain** — AI agent framework maintenance — and names them explicitly so they can be reused in future releases. This is disciplined adoption, not green-field invention. The contribution is the *discipline of importing the discipline*: making these practices explicit, first-class, and load-bearing rather than ad-hoc.

Seven innovations are organized into four thematic disciplines. Each is formulated as a **falsifiable hypothesis** with prediction, observation, and falsification condition. The retrospective (scheduled in Sprint 0 per Release Process Checklist) is the validation gate — without post-release observation, the hypothesis framing is performative.

## Theme 1: Release Discipline

### I1 — `host_framework_sync` as a named, reusable release class

**Source discipline:** Release taxonomy and maintenance-class naming (mainframe, kernel, LTS traditions)
**Hypothesis:** If we deliver the `host_framework_sync` playbook artifact as part of 4.0, then future BMAD major releases will be processed using the playbook as a starting template (≥50% content reuse), rather than reinventing the release plan from scratch.
**Observation:** Content reuse percentage at v6.4 adoption, measured by diff between v6.4 release plan and the 4.0 playbook.
**Falsification:** If v6.4 adoption rewrites ≥50% of the playbook, the release class was premature abstraction.

### S1 — Honesty constraints as release discipline ⭐

**Source discipline:** Academic publishing pre-registration, trustworthy release communication
**Hypothesis:** If we name what the release can't promise (`userMigrationFriction: unknown_until_validated`, synthetic-only validation, maintainer bandwidth as a real constraint, no post-release drift monitoring), then post-release retrospectives will NOT surface "we overclaimed" as a finding.
**Observation:** Retrospective findings tagged `overclaim` or `expectation-mismatch`.
**Falsification:** If the retrospective finds that users experienced the release as overclaiming despite the honesty constraints, the discipline was theatrical, not functional. *Load-bearing innovation — everything else in the PRD bends around this one.*

### S3 — Pre-registered experiments as Sprint 1 gates

**Source discipline:** Lean UX experimentation, pre-registration protocols from scientific methodology
**Hypothesis:** If we pre-register EXP1/EXP2/EXP3 with go/no-go criteria before Sprint 1 starts, then each experiment will produce a documented decision that shapes downstream scope, rather than being run and ignored.
**Observation:** Does the Sprint 1 artifact contain "what this changed downstream" paragraphs for each experiment? Do those paragraphs correspond to observable scope changes in later sprints?
**Falsification:** If experiments ran but downstream scope is unchanged regardless of results, the go/no-go criteria weren't load-bearing and the pre-registration was ceremonial.

## Theme 2: Validation Discipline

### I3 — Pre-release agent behavioral equivalence validation as a shipping commitment

**Source discipline:** Regression testing, snapshot testing, characterization tests from traditional software (applied to LLM outputs for the first time as a release gate in this domain)
**Hypothesis:** If we require PF1 (agent output equivalence on a representative battery) to pass before release, then we establish a measurable baseline where none existed, against which future releases can detect regressions.
**Observation:** Presence of a PF1 PASS/FAIL record in the release artifact. Post-release bug reports tagged `behavior-change` in the first 4 weeks post-ship.
**Falsification:** If ≥3 behavior regression reports land in 4 weeks despite PF1 passing, the synthetic battery was insufficient — we'd need to expand it or add post-release monitoring. *Honest note: there is no baseline to compare against because Convoke has never measured this before. The validation establishes measurement, not necessarily improvement.*

### I5 — Pre/post skill output drift snapshot

**Source discipline:** Snapshot testing, diff-based regression detection
**Hypothesis:** If we capture pre-release and post-release output snapshots for 2–3 key skills (e.g., `bmad-enhance-initiatives-backlog`, a Vortex stream output, a PRD draft output) and compare them, we generate a one-time retrospective drift measurement even without ongoing telemetry.
**Observation:** A drift snapshot comparison file exists in the release artifact, showing semantic diff between pre- and post-release outputs on the same inputs.
**Falsification:** If the comparison reveals significant unintended drift, the release had a behavioral impact we failed to validate via PF1 alone (which means PF1's sample was too narrow).

## Theme 3: Communication Discipline

### S2 — Dual-framing for audience

**Source discipline:** Technical writing, plain-language movement, audience-aware documentation
**Hypothesis:** If we maintain separate `internalOnly` and `userFacing` vocabulary annotations in the PRD frontmatter and enforce them across release documentation, then user-facing communications (CHANGELOG, migration guide, release announcement) will NOT contain any phrase from the `internalOnly` list.
**Observation:** Grep CHANGELOG + migration guide + release announcement for phrases on the `internalOnly` list (`host_framework_sync`, "content, not software", "strategic bet", "first-class community module", etc.).
**Falsification:** If any `internalOnly` phrase appears in user-facing docs, the annotation system failed to prevent bleed-through and the dual-framing discipline was aspirational rather than enforced.

## Theme 4: Learning Discipline

### L1 — Retrospective anti-pattern registry

**Source discipline:** Engineering retrospective practice, standing anti-pattern catalogues (e.g., AntiPatterns by Brown et al., 1998)
**Hypothesis:** If we document the anti-patterns observed during 4.0 (e.g., "we almost silently reordered the prioritized view during a backlog triage," "we used 'first-class' where the status was unearned," "we let M18 masquerade as a metric when it was a policy") in a standing registry that persists across releases, then future releases will exhibit fewer of these same anti-patterns because maintainers can read the registry before starting new work.
**Observation:** The retrospective produces an updated `convoke-anti-patterns.md` registry. Future releases' retrospectives reference the registry and note whether each anti-pattern recurred.
**Falsification:** If the registry exists but is never consulted during subsequent releases, OR if the same anti-patterns recur in v4.1/v6.4 despite the registry, then the Learning Discipline was curation without feedback and failed to change behavior.

## Market Context & Competitive Landscape

**These innovations are not market-facing in the feature sense.** No user is choosing Convoke 4.0 because it has a named release class or a pre-registered experiment protocol. Users choose (or continue using) Convoke because the agents help them run consulting engagements. The innovations matter because they **sustain the framework that users depend on** without requiring users to care about the sustainment work.

**Positioning claim (internal only):** Convoke 4.0 is the first release to apply mature software and editorial discipline to AI agent framework maintenance as a systematic practice. No competing AI agent framework in the Convoke target space (consulting workflow frameworks) is currently doing this. Traditional software has had these disciplines for decades; AI agent frameworks are young enough that the disciplines are still being imported one by one. Convoke's contribution is the *importing*, not the *inventing*.

**User-facing claim (from `userFacing` vocabulary):** Per the dual-framing discipline (S2), this entire section is `internalOnly`. The user-facing equivalent is simply: *"Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD evolves and adds marketplace distribution for reach."* The innovations live behind that sentence.

## Validation Approach — Retrospective as the Gate

Every innovation in this section is formulated as a hypothesis with an observation and a falsification condition. **The retrospective (scheduled in Sprint 0 per Release Process Checklist) is the validation gate.** Without post-release retrospective observation, the hypothesis framing is performative.

The retrospective must explicitly address:

1. Did I1's playbook artifact serve its purpose? Will it be reusable at v6.4? *(Defer observation to v6.4 adoption.)*
2. Did S1's honesty constraints prevent overclaim in user experience? *(Observe in first 4 weeks of user feedback.)*
3. Did S3's pre-registered experiments produce acted-upon decisions? *(Observe in Sprint 1 artifact.)*
4. Did I3's PF1 validation establish a useful behavioral baseline? *(Observe in any post-release behavior-change reports.)*
5. Did I5's drift snapshot reveal unexpected behavioral changes? *(Observe immediately post-release.)*
6. Did S2's dual-framing prevent internal-only phrases from leaking into user docs? *(Grep the published CHANGELOG.)*
7. Did L1's anti-pattern registry capture the real anti-patterns from 4.0? *(Review the registry at retrospective time.)*

## Risk Mitigation — Innovation Durability

The main risk for operator-facing innovations is that **they look like innovation in the PRD but don't reach sustained practice.** Naming something doesn't make it durable — patterns must survive at least one reuse to prove the "named class" is real.

**Per-innovation durability mitigations:**

- **I1** survives only if v6.4 adoption reuses the playbook. Can't validate in 4.0; defer to first reuse opportunity. Flagged in Operating Principles.
- **S1** survives only if honesty constraints become the Convoke default, not a 4.0-specific experiment. Consider a standing rule: every Convoke release must name what it can't promise before ship.
- **S3** survives only if pre-registered experiments become a Sprint 1 default for future releases. Add to the `host_framework_sync` playbook (I1).
- **I3** survives only if PF1-style validation becomes a standing requirement. Consider making it the first item in the host_framework_sync playbook.
- **I5** survives only if the drift snapshot workflow gets codified into a reusable script. Without that, it's a one-time effort.
- **S2** survives only if the `internalOnly`/`userFacing` annotation discipline propagates to future PRDs. Document as a required frontmatter section for all future Convoke PRDs.
- **L1** survives only if the anti-pattern registry is consulted at the *start* of future releases, not just updated at the end. Add to Sprint 0 checklist for next release.

**Cross-cutting mitigation:** The `host_framework_sync` playbook (I1) is the carrier for most of these innovations. If the playbook documents S1, S3, I3, I5, S2, and L1 as standard practice, the innovations propagate via the playbook rather than relying on institutional memory.
