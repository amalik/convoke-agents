---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
inputDocuments:
  - _bmad-output/planning-artifacts/briefing-bmad-v6.3-adoption.md
  - _bmad-output/planning-artifacts/convoke-note-initiatives-backlog.md
  - _bmad-output/planning-artifacts/convoke-vision-ecosystem.md
  - _bmad-output/planning-artifacts/convoke-vision-skill-portability.md
  - _bmad-output/planning-artifacts/convoke-note-lifecycle-expansion-plan.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 3
workflowType: prd
initiative: convoke
artifact_type: prd
qualifier: bmad-v6.3-adoption
status: draft
created: '2026-04-11'
schema_version: 1
classification:
  projectType: developer_tool
  projectTypeNotes: >-
    CSV-level match. At first principles Convoke is content (prompts, skills,
    workflows) interpreted by an LLM runtime — not a traditional developer
    tool with library dependencies. See hostFrameworkDependencies for the
    real dependency stack. Evolving to dual-distribution in this release:
    standalone CLI framework (current) + BMAD marketplace community module
    (new via WS2). Both channels must be first-class.
  domain: general
  domainNotes: >-
    CSV match is 'general' but actual target market is IT consultancy for
    enterprise brownfield transformations (see convoke-vision-ecosystem.md
    Lifecycle positioning). Preserve this positioning in PRD prose even
    though the classification field is general.
  complexity: high
  projectContext: brownfield
  releaseType: host_framework_sync
  releaseSubtype: distribution_change
  contentReleaseClass: host_framework_sync
  releaseClassNote: >-
    This is a recurring release class — every major BMAD upstream rev will
    need one of these. Naming the pattern now so it's reusable for v6.4,
    v7.0, and beyond. Characterized by: LLM runtime discovery path changes,
    distribution channel changes, upstream content parity tracking, and
    extensions governance against moving upstream.
  userMigrationFriction: unknown_until_validated
  userMigrationFrictionNote: >-
    Testable assumption: "Post-migration agents produce functionally
    equivalent outputs to pre-migration agents on representative inputs."
    Until validated empirically, friction is unknown. Honest default is
    NOT "medium" — that would be hope, not measurement. Validation plan
    belongs in architecture NFRs and release quality gates.
  hostFrameworkDependencies:
    llmRuntime: claude-code
    llmRuntimeContract: >-
      .claude/skills/{name}/SKILL.md convention, activation protocol,
      tool name vocabulary (Read/Edit/Bash/etc.)
    conventionFramework: bmad-method
    conventionVersionCurrent: '6.2.x'
    conventionVersionTarget: '6.3.0'
    modelBehaviorContract: claude-opus-4-6
    modelBehaviorNote: >-
      Agent behavior is undefined if the underlying Claude model is
      replaced or significantly updated. This is a latent dependency
      not addressed by this release — flag for separate governance.
  classificationSource: >-
    Initial proposal by John (PM), refined through Advanced Elicitation
    Method #5 (Stakeholder Round Table) with Winston, Paige, Mary, and
    Priya, then refined again through Method #1 (First Principles Analysis)
    which stripped the 'developer_tool' and 'platform_alignment' labels
    and rebuilt from fundamentals. 2026-04-11.
partyFindings:
  date: '2026-04-11'
  participants:
    - Bob (SM, BMM) — sprint planning perspective, personally affected by WS3
    - Amelia (Dev, BMM) — implementation reality perspective
    - Noah (Production Intelligence, Vortex) — post-release signals
    - Max (Learning & Decision, Vortex) — retrospective and decision frameworks
  findings:
    - id: PF1
      topic: Missing WS1 sub-goal
      finding: >-
        Agent output equivalence validation battery is currently implicit
        in `userMigrationFriction: unknown_until_validated` but has no
        dedicated workstream. Needs four components: (1) representative
        input battery (2) drift threshold (3) fallback protocol (4)
        empirical definition of 'representative' — e.g., pull from the
        most recent 5 real engagement outputs in _bmad-output/.
      feedsInto: vision, scope, architecture-NFRs
      source: Amelia + Noah + Max consensus (Topic 2)
    - id: PF2
      topic: Missing risk class
      finding: >-
        Current risk register has only event risks ('this thing might be
        wrong'). Missing flow/temporal risks ('this thing might stall').
        Breaking platform releases die by stall, not by defect. Add
        temporal coupling risk given the (U10 ‖ A8) → A9 → P23 sequence.
      feedsInto: risk-register
      source: Max (Topic 3)
    - id: PF3
      topic: New risk R6 — WS4 scope optimism
      finding: >-
        WS4 (extensions governance) scoped as 3–5 days assumes small
        extensions inventory. If inventory doubles, WS4 becomes 2 weeks
        and blocks P23 (marketplace publication). Validate inventory
        size early in WS4 before committing to the 3–5 day estimate.
      feedsInto: risk-register, scope
      source: Amelia (Topic 3)
    - id: PF4
      topic: New risk R7 — Upstream moving target
      finding: >-
        BMAD upstream may ship v6.3.1 or v6.4.0 during Convoke's 4–5 week
        adoption window. The briefing assumes upstream is a static target.
        Need policy: re-target mid-flight, accept lag on ship day, or
        freeze target version explicitly.
      feedsInto: risk-register
      source: Noah (Topic 3)
    - id: PF5
      topic: New risk R8 — Recursive tooling risk
      finding: >-
        `bmad-enhance-initiatives-backlog` skill (the very tool being used
        to manage this release backlog) is one of the Convoke extensions
        WS4 is designed to validate. If WS4 finds it broken on v6.3, we
        cannot use it to manage this release. MUST be the first skill WS4
        validates — before any other dependency inventory work.
      feedsInto: risk-register, scope-ordering
      source: Bob (Topic 3)
    - id: PF6
      topic: PRD positioning refinement
      finding: >-
        WS3 (Amelia consolidation) should NOT be framed as 'we follow
        upstream.' The correct framing is: 'upstream consolidation happens
        to match our target user's reality — solo consultants and small
        teams do not need a dedicated SM persona.' This strengthens the
        Convoke positioning and turns a passive tracking decision into an
        active product decision. Bob's own reflection on what he will and
        will not miss about being a distinct persona. User-facing migration
        note must document the new Amelia mode-switching pattern (sprint
        planning mode vs. implementation mode) so users do not lose the
        handoff structure without realizing it.
      feedsInto: vision, scope, user-migration-guide
      source: Bob + Max (Topic 4)
    - id: PF7
      topic: Honest scope of learning
      finding: >-
        This release validates v6.3 spec compliance but does NOT validate
        Convoke's response to ongoing upstream drift over time. That is
        a separate governance capability we are deferring. Name this
        explicitly in the 'what we will have learned' section of the PRD
        to avoid overclaiming release outcomes.
      feedsInto: learning-section, post-release-followup
      source: Max + Noah (Topic 1)
  unresolvedTensions:
    - >-
      PF1's validation battery requires either synthetic test infrastructure
      (pre-release gate) or production telemetry (post-release signal).
      Convoke has neither today. Decision needed: invest in synthetic
      battery now, defer to post-release manual spot-check, or kick off
      a parallel N1-telemetry initiative. Feed to Winston's CA.
visionDraft:
  date: '2026-04-11'
  source: Step 2b draft proposal refined via Advanced Elicitation Method #18 (Shark Tank Pitch)
  statement: >-
    Convoke 4.0 is the release where Convoke stops being a BMAD fork and
    becomes an officially registered BMAD community module — maintained
    with the discipline of a content distribution, not a software
    dependency, and shipping via both standalone install and the official
    BMAD marketplace.
  coreInsight: >-
    Convoke is content, not software — it is LLM-interpreted prompts,
    skills, and workflow definitions, not compiled code. This means:
    (1) upstream sync is ongoing discipline, not a one-time port;
    (2) validation must be behavioral, not syntactic; and
    (3) distribution is a strategic lever, not plumbing.
  threeFirsts:
    - First Convoke release as an officially registered BMAD community module (NOT "first-class" — reserved for when Convoke earns bmad-certified tier via the marketplace promotion ladder)
    - First host-framework-sync release (new named release class, reusable template for v6.4/v7.0/...)
    - First formal recognition of Convoke-as-downstream with durable governance (WS4 extensions compatibility registry)
  strategicBet: >-
    Convoke's value grows by being the best opinionated downstream of BMAD,
    not by being an independent agent framework. This release leans INTO
    BMAD coupling as a feature — marketplace distribution, shared config
    conventions, upstream tracking — rather than away from it. If BMAD's
    trajectory falters, this release also falters. We accept that risk as
    the price of ecosystem leverage over framework independence.
  scopeBoundary: >-
    4.0 positions Convoke for its current audience — individual consultants
    and small teams adopting Convoke on their own authority. Buyer-facing
    concerns (enterprise support commitments, roadmap visibility contracts,
    legal/licensing clarity) are explicitly out of scope for this release
    and deferred to a future initiative.
  contributionStance: >-
    Convoke remains solo-authored for 4.0. Opening to community contributions
    is a separate strategic decision requiring its own review bar, licensing
    clarity, and CI/governance investment — not in scope for 4.0. Users can
    still open issues and submit PRs, but the review and merge workflow is
    explicitly author-maintained.
  sharkTankFindings:
    - id: ST1
      shark: The Upstream Maintainer (BMAD org representative)
      challenge: >-
        "First-class" language is unearned status inflation. Convoke ships
        to the marketplace at `trust_tier: unverified`. Humans review to
        earn `community-reviewed`. BMAD org certifies for `bmad-certified`.
        Using "first-class" in the CHANGELOG misleads users about status.
      resolution: Struck "first-class" from all vision language. Replaced with "officially registered" or "first" (in time, not status).
    - id: ST2
      shark: Priya's Boss (enterprise buyer with budget authority)
      challenge: >-
        Vision addresses users (consultants) and internal stakeholders
        (architects, maintainers) but says nothing about buyers who
        actually authorize Convoke adoption on enterprise engagements.
        Support commitment, roadmap visibility, legal/licensing are
        silently missing.
      resolution: Acknowledged as scope boundary. Buyer-facing positioning deferred to a future release. Explicit rather than silent gap.
    - id: ST3
      shark: The Competing Framework Author (rival agent framework for consultants)
      challenge: >-
        Vision assumes tighter BMAD coupling is obviously good, without
        defending that assumption. A competing framework could spend
        4-5 weeks shipping features instead of upstream alignment.
        What if BMAD isn't the gravity well?
      resolution: Added explicit strategic bet declaration. BMAD coupling named as a deliberate choice with a named risk. Not assumed — defended.
    - id: ST4
      shark: The Pragmatic Maintainer (hypothetical Convoke contributor)
      challenge: >-
        Vision is missing the contributor perspective. What's the
        contribution experience? Fork? PR? Review bar? If Convoke wants
        to be a real community ecosystem, this release is an opportunity
        to name that. Silence is worse than either "solo-authored" or
        "open to contributions."
      resolution: Added explicit contribution stance — solo-authored for 4.0, community contribution as a separate future decision.
  whyNow:
    - BMAD v6.3.0 has already shipped upstream; every week delay compounds drift cost
    - Custom-content installation path is being REMOVED upstream (not deprecated — removed); marketplace is the only future distribution channel
    - Skill portability initiative (P16-P20) is Done — infrastructure to manage Convoke-as-content is newly in place
    - Strategic identity moment — marketplace publication is the first external validation of Convoke's ecosystem positioning
  futureState:
    forUsers:
      - Discover Convoke via the BMAD marketplace, not just Amalik hand-sharing
      - Install Convoke alongside BMAD with unified tooling and mental model
      - Upgrade through `convoke-update` without manual migration (auto-migration handles bmad-init retirement)
      - Read CHANGELOG that honestly names "platform alignment release" and "agent behavior equivalence validated on a representative sample (post-release drift monitoring is a separate future capability)"
    forConvoke:
      - Named reusable release class for upstream sync (host_framework_sync) — operationalized via a documented playbook/checklist as a 4.0 deliverable, NOT just a rhetorical label
      - Dependency registry catching extension drift (bmm-dependencies.csv)
      - Empirical validation of agent behavior equivalence on a representative sample (new capability — PF1)
      - Installable through BMAD marketplace as Convoke 4.0.0, unverified tier, with a promotion path
    forEcosystem:
      - Dual-distribution model (standalone + marketplace) matches ecosystem vision positioning
      - Skill portability + marketplace publication become complementary distribution channels
      - Unblocks future releases where Convoke ships new agents/teams (Forge, Helm) via marketplace as they mature
  honestyConstraints:
    - field: marketplaceSuccessCriteria
      constraint: >-
        Marketplace is a long-term distribution investment. 4.0 success
        criteria is publication and correctness, NOT install count. Install
        count velocity is a 12-18 month observation, not a 4.0 outcome.
      rationale: Prevents retrospective judgment against a metric the early marketplace cannot deliver.
    - field: maintainerSustainability
      constraint: >-
        Release scope is constrained by maintainer bandwidth (solo + agent-
        assisted). Each of the four workstreams (U10, P23, A8, A9) is
        independently valuable and CAN BE DEFERRED to a future release if
        timeline pressure mounts. 4.0 is a bundled delivery preference,
        NOT a hard commitment. Graceful descent path is explicit.
      rationale: Prevents maintainer burnout that would stop all Convoke maintenance for months post-release.
      flagForScopeSection: true
      flagForArchitectureNFR: true
    - field: validationHonesty
      constraint: >-
        Pre-release validation (PF1 synthetic battery) confirms behavioral
        equivalence on a representative sample. Post-release drift
        monitoring is a separate capability NOT delivered in 4.0 — users
        should report behavioral surprises and the maintainer will
        investigate. No guarantee of equivalence beyond the sample.
      rationale: Prevents false confidence from synthetic-only validation.
    - field: releaseClassOperationalization
      constraint: >-
        host_framework_sync as a reusable release class requires a concrete
        artifact — a documented playbook or checklist — shipped as part of
        4.0. Without that artifact the class is rhetoric, not template.
        The playbook IS a 4.0 deliverable, not an implicit by-product.
      rationale: Prevents "named release class" from being vapor that never gets reused in v6.4/v7.0.
      flagAsDeliverable: true
    - field: strategicBetRevalidation
      constraint: >-
        The BMAD coupling strategic bet is revalidated at each major
        upstream release (v6.4, v7.0, ...). If BMAD stagnates for 6+
        months or a clearly-superior framework emerges, Convoke
        reconsiders independence. The bet is a hypothesis to retest,
        not a locked commitment.
      rationale: Prevents Convoke from being welded to BMAD's fate without a defined reassessment trigger.
  plainLanguage:
    audience: A smart friend running a small IT consulting firm who has never used BMAD, never heard of Convoke, isn't using Claude Code yet
    description: >-
      User-facing companion framing for CHANGELOG, migration guide, and
      release announcement. NOT a replacement for the sophisticated framing
      above — that remains the authoritative version for architecture,
      planning, and internal rigor. This is the version that ships to users.
    whatConvokeIs: >-
      Convoke is a set of AI assistants that walk you through the standard
      steps of an IT consulting engagement — stakeholder interviews,
      requirements, architecture sketches, sprint planning. Each one is a
      different role, and they hand work off to each other in a standard
      flow. The assistants live in Claude Code, shipped as a package.
    whyRelease4IsABigDeal:
      - >-
        Right now Convoke only works if you install it separately. After 4.0,
        it installs the same way as BMAD itself, through the same registry.
        Most new users will discover Convoke through the registry, not
        through me talking about it.
      - >-
        Convoke needs to stay in sync with changes to the underlying
        framework. Every time BMAD updates, Convoke has to match — or the
        agents start misbehaving. This release is the first time I'm
        treating that sync as normal, planned work instead of an emergency.
        I'm naming the pattern so next time, I don't reinvent the process.
      - >-
        I'm building a safety net for the parts of Convoke that extend
        BMAD. Without the safety net, those could silently break when
        upstream changes. The new compatibility registry catches drift
        before it breaks users.
    whatExistingUsersGet: >-
      Honestly? If you're already a happy Convoke 3.x user, most of what
      changes in 4.0 is under the hood. You'll run an upgrade command,
      auto-migration handles the config layout changes, and your agents
      keep working. The thing you'll notice is that the CHANGELOG tells
      you honestly whether your agents still behave the same after the
      upgrade — not just 'it compiled, ship it.' The thing your colleagues
      will notice is that they can finally install Convoke through the
      normal BMAD plugin system instead of asking me for a link. If you
      just use Convoke yourself, the change is invisible — and that's fine.
      This release is mostly about making Convoke healthy enough to last.
  mostHonestOneLineSummary: >-
    Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD
    evolves and adds marketplace distribution for reach.
  framingAnnotations:
    internalOnly:
      - host_framework_sync (release class label — use for architecture, planning, release taxonomy)
      - Convoke is content, not software (core insight for reasoning about releases; do not surface to users — they care whether it works, not its implementation category)
      - Strategic bet on BMAD coupling (internal planning; user doesn't need to know you're making strategic calls)
      - First formal recognition of Convoke-as-downstream (internal framing; mostly decorative — actual user-facing substance is the safety net for extensions)
      - Named reusable release class (internal; rename to 'sync playbook' if ever user-facing)
    userFacing:
      - Installs through the normal BMAD plugin system (replaces 'marketplace / officially registered / first-class')
      - Agents still behave the same after upgrade (replaces 'agent output equivalence validated')
      - Safety net for parts of Convoke that extend BMAD (replaces 'extensions governance layer')
      - Staying in sync with the framework underneath us (replaces 'host_framework_sync' for user docs)
      - Maintenance release that keeps Convoke healthy (the most honest framing — use in release announcement)
  existingUserValueProp:
    honestAssessment: >-
      4.0 is NOT primarily a user-facing feature release. Existing users
      will experience it as a healthy upgrade. The user value is in:
      (1) not breaking, (2) the new install channel for colleagues,
      (3) the new honesty standard for behavioral equivalence.
      That's enough for this release. Do not dress it up.
    weaknessAcknowledged: >-
      Earlier drafts of the vision were wrapping a maintenance-release
      reality in progressively more sophisticated language (first-class,
      coming-out, opinionated downstream). Feynman test revealed this.
      Internal framing stays sophisticated because sophistication serves
      planning discipline. User-facing framing goes plain because plain
      serves trust.
  preMortemFindings:
    - id: PM1
      failureMode: Marketplace symbolic, not functional
      scenario: >-
        Oct 2026. Convoke 4.0 live on marketplace for 6 months. Install
        count <50. Vast majority still install standalone via npm.
        Marketplace publication was symbolic, not a distribution lever.
      gapDetected: No realistic adoption velocity expectation in vision
      resolution: Added honestyConstraints[marketplaceSuccessCriteria] — publication and correctness, not install count
    - id: PM2
      failureMode: Maintainer burnout during/after release
      scenario: >-
        Release shipped on time and correctly. But Convoke maintenance
        stopped for 3 months after. State-of-the-art bar burned through
        discretionary bandwidth; maintainer needed a break. No minor
        fixes, no v6.4 adoption, no new skills for a quarter.
      gapDetected: Maintainer not acknowledged as a constrained resource
      resolution: Added honestyConstraints[maintainerSustainability] — each workstream independently valuable and deferrable. Graceful descent path is explicit.
      mostUncomfortable: true
    - id: PM3
      failureMode: Post-release behavioral drift
      scenario: >-
        Synthetic battery passed pre-release. 6 weeks into live usage,
        users reported subtle output differences. Not broken, but not
        identical. Trust lost.
      gapDetected: Synthetic validation framed as sufficient, not necessary-but-insufficient
      resolution: Added honestyConstraints[validationHonesty] — pre-release validation confirms equivalence on a sample; post-release drift monitoring is a separate capability
    - id: PM4
      failureMode: "host_framework_sync as release class used exactly once"
      scenario: >-
        BMAD v6.4 ships with different change shape (e.g., mandatory
        permission model). The v6.3 template doesn't apply. Next
        release reinvents from scratch. "Reusable template" was rhetoric.
      gapDetected: "Named release class" without a concrete operationalizing artifact
      resolution: Added honestyConstraints[releaseClassOperationalization] — playbook/checklist is a 4.0 deliverable, not an implicit by-product
    - id: PM5
      failureMode: Strategic bet locked in prematurely
      scenario: >-
        BMAD looks like gravity well for 4 months. Month 5, Anthropic
        releases major Claude update, tool ecosystems shift. BMAD
        architecture starts looking dated. The bet worked for the wrong
        reason — nothing else had happened yet.
      gapDetected: Strategic bet presented as clear commitment, not hypothesis
      resolution: Added honestyConstraints[strategicBetRevalidation] — revalidation trigger at each major upstream release
partyFindingsRound2:
  date: '2026-04-11'
  participants:
    - Sophia (Master Storyteller, CIS) — narrative framing and release announcement voice
    - Victor (Disruption Strategist, CIS) — strategic bet pressure-testing and bolder alternatives
    - Isla (Discovery & Empathy Expert, Vortex) — user reality and adoption grounding
    - Wade (Lean Experiments Specialist, Vortex) — experiment design and validation strategy
  findings:
    - id: PR2-1
      topic: Vision substance vs. tonal register
      finding: >-
        Vision is substantively sound after 5 refinement passes but is
        emotionally flat. That is CORRECT for a maintenance release —
        Priya should read the vision and feel nothing (no friction, no
        FOMO, no FUD). It does mean the release announcement cannot
        rely on the vision's tone. The announcement needs its own
        tonal register.
      feedsInto: executive-summary, release-announcement-voice
      source: Victor lead, Sophia + Isla + Wade cross-talk (Topic 1)
    - id: PR2-2
      topic: Feynman translation has two weak phrases
      finding: >-
        Feynman plain-language translation is ~80% believable to Priya.
        Two phrases need repair:
        (1) "staying in sync with BMAD changes" triggers maintenance-as-
            feature suspicion — users correctly intuit that this is work
            Amalik has to do and he is framing his burden as their value.
            Reword to eliminate the implication.
        (2) "safety net for parts of Convoke that extend BMAD" is a
            conceptual black box. Users do not know what "parts extending
            BMAD" means. Replace with concrete story from Victor:
            "If your BMAD agents start misbehaving after an upgrade,
            Convoke now catches it before you notice."
      feedsInto: plain-language, release-announcement, migration-guide
      source: Isla lead, Victor + Sophia cross-talk (Topic 2)
    - id: PR2-3
      topic: Victor's Bolder Move 3 — platform-agnostic publishing
      finding: >-
        Instead of framing 4.0 as "dual-distribution" (standalone + BMAD
        marketplace), reframe as "multi-platform publishing" leveraging
        the existing P18 skill portability exporter (Done). WS2 becomes
        "publish to marketplace AND validate standalone skill exports AND
        validate Copilot/Cursor adapters." The story shifts from "Convoke
        joins BMAD registry" (static) to "Convoke ships everywhere,
        starting with BMAD registry" (motion).
        Key properties:
        - Low cost — piggybacks on P16-P20 work already shipped
        - High upside — diversifies platform risk, unlocks colleague
          recommendations across tool boundaries
        - Compatible with current release scope — framing change, not
          scope change
        - Testable in 1 day via P18 exporter smoke test (Wade's
          Experiment 3 from Topic 4)
      feedsInto: vision-framing, WS2-scope, executive-summary
      source: Victor lead, Sophia + Wade + Isla cross-talk (Topic 3)
      status: UNRESOLVED_VISION_DECISION
      decisionRequired: >-
        Amalik must decide whether to absorb Bolder Move 3 into the 4.0
        vision framing. Decision is contingent on Wade's Experiment 3
        (1-day P18 exporter smoke test) validating that the exporter
        produces usable Copilot/Cursor adapters on at least one agent.
        If absorbed: WS2 story count grows by ~1 validation story, WS2
        narrative is materially stronger, and the release announcement
        gains "works in your tool of choice" framing. If not absorbed:
        4.0 stays narrowly framed as "BMAD marketplace debut" and
        platform-agnostic publishing defers to a future release.
        RECOMMENDED DECISION POINT: after Wade's Experiment 3 result,
        before finalizing Executive Summary.
    - id: PR2-4
      topic: Three week-1 lean experiments to de-risk the release
      finding: >-
        Three parallelizable experiments totaling ~4 days in week 1 of
        execution would de-risk the three highest-uncertainty bets in
        the release. These are NOT generic spike work — they are
        pre-registered validation experiments with go/no-go implications.
      experiments:
        - id: EXP1
          name: PF1 dry-run on single agent (~2 days)
          description: >-
            Pick one agent (Vortex Emma or BMM John). Manually migrate
            its SKILL.md to v6.3 direct-load pattern. Run pre-migration
            and migrated versions against 5 real inputs from
            _bmad-output/vortex-artifacts/. Diff outputs semantically.
          validates: Migration correctness and equivalence template
          goNoGo: >-
            If equivalence holds, mass-apply migration template.
            If fails, release scope is bigger than mechanical sweep —
            pause and rescope early instead of 4 weeks in.
          owner: Amelia (execute), Winston (analyze drift)
        - id: EXP2
          name: Marketplace PR pathfinder (~1 day)
          description: >-
            Submit a draft PR to bmad-plugins-marketplace with a
            bare-minimum Convoke registry entry (valid schema, no real
            metadata). Do NOT ask for merge — ask for review feedback.
            Goal is process validation and surfacing hidden requirements.
          validates: Marketplace submission process and approval unknowns
          goNoGo: >-
            If feedback is positive or procedural, continue to full PR
            in WS2. If feedback reveals hidden requirements or blockers,
            adjust WS2 scope and architecture to address them.
          owner: Amalik (submit), Winston (respond to feedback)
        - id: EXP3
          name: P18 exporter smoke test for platform-agnostic framing (~1 day)
          description: >-
            Run the existing P18 exporter on ONE agent (Emma). Generate
            Claude Code + Copilot + Cursor adapters. Install each into
            a sandbox project and do a 5-minute smoke test per platform.
          validates: Victor's Bolder Move 3 (PR2-3) — whether platform-agnostic publishing is real or rhetoric
          goNoGo: >-
            If all 3 adapters install and produce reasonable behavior,
            absorb Bolder Move 3 into the 4.0 framing. If any fails,
            drop Bolder Move 3 and ship with narrow "marketplace debut"
            framing. Decision feeds Executive Summary finalization.
          owner: Amalik (run exporter), Wade (design smoke test)
      feedsInto: sprint-1-stories, scope, executive-summary
      source: Wade lead, Sophia + Victor + Isla cross-talk (Topic 4)
      flagForScopeSection: true
      flagForStoriesStep: true
    - id: PR2-5
      topic: Sophia's release announcement draft and revision
      finding: >-
        Sophia drafted a release announcement in her voice, then picked
        it apart for hidden clichés, producing a revised version that is
        ship-ready for 4.0 (pending Bolder Move 3 decision from PR2-3).
      draftAnnouncement: >-
        The Convoke 4.0 release is live. We've spent the last few weeks
        making Convoke healthy enough to last — not adding new features,
        but making sure the agents you rely on keep working as BMAD
        evolves underneath them. You can now install Convoke through the
        BMAD plugin system, as a standalone Claude Code skill pack, or
        via adapters for Copilot and Cursor. For existing users,
        upgrading is a single command and auto-migration handles the
        rest. One thing new in this release: we actually test whether
        your agents behave the same way after the upgrade, instead of
        assuming they do. No more "it compiled, ship it." If this
        release does its job, you'll barely notice it — which is the
        point.
      narrowFallback: >-
        If Bolder Move 3 (PR2-3) is NOT absorbed, replace the install
        sentence with: "For the first time, you can install Convoke
        through the BMAD plugin system alongside the framework itself."
      clichesRemoved:
        - "Convoke 4.0 is here" → "The Convoke 4.0 release is live"
        - "For the curious" lazy segue → "One thing new in this release"
        - "Convoke is a bit like a well-maintained tool: nothing flashy, just reliable" → "If this release does its job, you'll barely notice it — which is the point"
      feedsInto: executive-summary, release-announcement, CHANGELOG
      source: Sophia lead, Isla + Victor + Wade cross-talk (Topic 5)
---

# Product Requirements Document — BMAD v6.3.0 Adoption

**Author:** Amalik
**Date:** 2026-04-11
**Target Release:** Convoke 4.0.0 (breaking change)
**Source Initiative Entries:** U10, P23, A8, A9 in [convoke-note-initiatives-backlog.md](convoke-note-initiatives-backlog.md)
**Epic Grouping:** "BMAD v6.3.0 Adoption" (U10 + P23 + A8 + A9)

## Executive Summary

**Convoke 4.0 is the first release where Convoke acts on its identity as an ecosystem product — not a side project — with everything that implies for distribution, governance, and sustainability.** It is a coordinated platform alignment release adopting BMAD METHOD v6.3.0 upstream, formalized as the first instance of a named, reusable release class: `host_framework_sync`.

**Core insight powering this release:** Convoke is *content, not software* — LLM-interpreted prompts, skills, and workflow definitions rather than compiled code. This reframe drives every architectural and product decision in 4.0: upstream sync becomes ongoing content-distribution discipline (not emergency patching), validation becomes necessarily behavioral (not syntactic), and distribution becomes a strategic lever (not plumbing). v6.3 adoption is the first release where Convoke acts on this insight explicitly.

**Target users:** IT transformation consultants and small teams using Convoke on brownfield enterprise engagements. The release is optimized for *continuity of use* — existing users experience a healthy upgrade with auto-migration handling config layout changes, and their agents continue to behave equivalently on representative inputs.

**Problem being solved:** BMAD v6.3.0 introduces four structural changes that affect Convoke — elimination of the `bmad-init` skill, removal of the custom-content installation path in favor of marketplace-only distribution, upstream consolidation of the BMM developer/QA/SM agents into Amelia, and no compatibility version field in the marketplace schema. Without adoption, Convoke drifts into an unmaintained fork. With adoption, Convoke becomes an officially registered BMAD community module with a durable governance layer.

**Validation as a first-class deliverable:** Pre-release validation of agent behavioral equivalence on representative inputs is a new capability this release introduces — the validation protocol is an architecture deliverable, not an afterthought. Synthetic battery only; post-release drift monitoring is a separate future capability.

**Release scope — four workstreams, sequenced `(WS1/U10 ‖ WS3/A8) → WS4/A9 → WS2/P23`:**

- **WS1 / U10 — Direct-load migration** (highest blast radius): Retire `bmad-init`, sweep ~25 agent activation patterns across core/bmm/cis/tea/wds/bme modules, ship idempotent user migration script in `convoke-update`. ~14 stories, 2–3 weeks.
- **WS2 / P23 — Marketplace publication** (sequenced after WS1 and WS4): Register Convoke as community module in `bmad-plugins-marketplace`, add runtime compatibility preflight to protect against the missing `bmad_version` field, audit skill-dir conformance. 1–2 weeks.
- **WS3 / A8 — Adopt upstream Amelia consolidation** (parallel to WS1): Track upstream BMM agent removal (Bob/Quinn/Barry). Alignment is a deliberate product choice matching Convoke's target user reality — solo consultants and small teams do not benefit from separate SM/QA/Dev personas. 3–5 days.
- **WS4 / A9 — Convoke extensions compatibility governance** (finalizes before WS2): Build `bmm-dependencies.csv` registry, validate Convoke-owned skills that extend BMM agents, wire regression gate into `convoke-update`. **First validation target: the `bmad-enhance-initiatives-backlog` skill — the very skill used to track this release — must pass the WS4 gate before any other dependency inventory work.** Recursive tooling risk demands this ordering. 3–5 days.

**Sprint 1 pre-work — three pre-registered experiments (~4 days total) de-risking the release:**

- **EXP1 — Migration correctness dry-run** (~2 days): Manually migrate one agent (Emma or John) to v6.3 direct-load, run pre/post against 5 real inputs from `_bmad-output/vortex-artifacts/`, diff outputs semantically. Go/no-go: if equivalence holds, mass-apply template; if fails, rescope the sweep early.
- **EXP2 — Marketplace PR pathfinder** (~1 day): Submit a draft registry entry to `bmad-plugins-marketplace` asking for process feedback (not merge). Surfaces approval unknowns before committing to WS2.
- **EXP3 — Platform-agnostic exporter smoke test** (~1 day): Run the existing P18 exporter on one agent to generate Claude Code + Copilot + Cursor adapters, smoke-test each. Decides whether to absorb platform-agnostic publishing into the 4.0 framing. Feeds Executive Summary finalization.

**Lineage:** This release is the first to leverage the skill portability infrastructure shipped in P16–P20 — that prior work (canonical skill format, exporter CLI, catalog generator, platform adapters) makes platform-agnostic publishing possible as a future extension, and makes EXP3 a 1-day test rather than a multi-week prototype.

**Honesty constraints** (from pre-mortem): Release scope is constrained by maintainer bandwidth — each workstream is independently valuable and may be deferred if timeline pressure mounts. Pre-release validation confirms agent behavioral equivalence on a representative sample only; post-release drift monitoring is a separate capability not delivered in 4.0. The strategic bet on BMAD coupling is revalidated at each major upstream release.

### What Makes This Special

Convoke 4.0 lands three firsts for the Convoke product line:

- **First Convoke release as an officially registered BMAD community module.** Status tier starts at `unverified` with a promotion path to `community-reviewed` and eventually `bmad-certified`. Unlocks discoverability through the BMAD registry for consultants who already trust that channel.
- **First release of a named, reusable release class.** `host_framework_sync` is delivered with a concrete playbook artifact — reusable for v6.4, v7.0, and beyond. Future BMAD major revs will apply this template instead of reinventing from scratch.
- **First formal recognition of Convoke-as-downstream with durable governance.** The `bmm-dependencies.csv` registry and its validation sweep turn what was previously silent breakage into surfaced regressions.

**Strategic bet (explicit, revalidated each major upstream release):** Convoke's value grows by being the best opinionated downstream of BMAD, not by being an independent agent framework. This release leans INTO BMAD coupling — marketplace distribution, shared config conventions, upstream tracking — accepting the risk that if BMAD's trajectory falters, Convoke falters with it. The bet is revalidated at each major upstream release (v6.4, v7.0, ...).

**User-facing communication drafts:** A plain-language translation of this release is captured in the PRD frontmatter under `visionDraft.plainLanguage` and `mostHonestOneLineSummary`. Sophia's ship-ready release announcement draft is in `partyFindingsRound2.PR2-5`. These are the voices to reach for in CHANGELOG, migration guide, and external release communication — not the internal framing above.

## Project Classification

- **Project Type:** `developer_tool` *(CSV match; at first principles Convoke is LLM-interpreted content — see `hostFrameworkDependencies` for the real dependency stack)*
- **Domain:** `general` *(CSV match; actual target market is IT consultancy for enterprise brownfield transformations)*
- **Complexity:** `high` *(multi-workstream coordinated breaking release)*
- **Project Context:** `brownfield` *(Convoke 3.2.0 is live on npm; 88 ranked backlog items; ~15 parallel initiatives in flight)*
- **Release Type:** `host_framework_sync` / `distribution_change` *(new release class — first of its kind; will recur on every BMAD major rev)*
- **User Migration Friction:** `unknown_until_validated` *(behavioral equivalence is a testable assumption; validation plan in architecture NFRs)*
- **Host Framework Dependencies:** `claude-code` (LLM runtime) + `bmad-method@6.3.0` (convention framework, target) + `claude-opus-4-6` (model behavior contract)
