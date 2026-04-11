---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
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
status: complete
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

---

*This PRD was authored through the `bmad-create-prd` workflow (11 steps) with extensive multi-round elicitation: Stakeholder Round Table, First Principles Analysis, Shark Tank Pitch, Pre-mortem Analysis, Feynman Technique, and four Party Mode rounds covering execution, narrative, metrics, and innovation. The extensive frontmatter above captures the reasoning trail; the main content below is the ship-ready PRD. For a quick orientation, read the Executive Summary and skim the Functional Requirements; everything else supports these two sections.*

---

## Contents

- [Executive Summary](#executive-summary)
- [Project Classification](#project-classification)
- [Success Criteria](#success-criteria) — User/Business/Technical Success, Measurable Outcomes, Release Process Checklist, Operating Principles
- [Product Scope](#product-scope) — MVP, Growth Features, Vision
- [User Journeys](#user-journeys) — Priya, Samira, Amalik narratives
- [Domain-Specific Requirements](#domain-specific-requirements) — Not applicable; empty by design
- [Innovation & Novel Patterns](#innovation--novel-patterns) — 7 hypotheses across Release/Validation/Communication/Learning Discipline
- [Developer-Tool Specific Requirements](#developer-tool-specific-requirements) — Language matrix, installation methods, API surface
- [Project Scoping & Phased Development](#project-scoping--phased-development) — MVP philosophy, resources, risks, scope decisions
- [Functional Requirements](#functional-requirements) — 50 FRs across 10 capability areas (the capability contract)
- [Non-Functional Requirements](#non-functional-requirements) — 33 NFRs across Performance/Reliability/Integration/Maintainability/Observability/Backwards Compatibility/Reproducibility

---

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

## Success Criteria

*These criteria are **diagnostic** — they measure whether the release shipped correctly. The **narrative** of why each matters lives in the Executive Summary; the two sections are coupled and should not be separated in future document reorganizations.*

### User Success

> **Note on measurement:** The metrics below are **structural proxies** for user experience, not direct measurements of it. Direct user-reality measurement (telemetry, surveys, research) is a deferred capability — see Growth Features. For a solo-maintained project, proxies + N=1 external validation are the best instruments available.

Success for existing Convoke 3.2.0 users = **a healthy upgrade they barely notice**:

- **Upgrade completes in a single command** (`convoke-update`) with no manual migration steps. Validated by running the upgrade on at least 3 sandbox installs covering representative config variants before release (minimum, not maximum).
- **Agent behavioral equivalence maintained** on the PF1 synthetic battery: pre-migration and post-migration agents produce outputs within drift threshold T (defined numerically in architecture NFRs) on a battery of representative inputs sampled from `_bmad-output/vortex-artifacts/`. Any drift beyond T blocks release.
- **Zero user action required to re-onboard,** measured via structural proxy: the migration guide is ≤1 page AND introduces zero new concepts users must learn (no new agent names, no new config keys).
- **CHANGELOG is trustworthy,** measured via three concrete tests: (a) contains the `mostHonestOneLineSummary` text verbatim, (b) follows Sophia's section headers in order (from `partyFindingsRound2.PR2-5`), (c) contains no phrase from the cliché list in PR2-5. Plus maintainer sign-off recorded in the release commit message.
- **N=1 external user validation before release.** At least one non-maintainer user (colleague, friend — any non-Amalik human) has run the upgrade on their own install and reported no issues. Minimum viable reality check; single point of failure but infinitely better than zero.

Success for *new* users discovering Convoke via the BMAD marketplace = **a discoverable install path that works on first attempt**:

- **Convoke is listed in `bmad-plugins-marketplace/registry/community/convoke.yaml`** with `trust_tier: unverified`, valid `module_definition`, passing PluginResolver validation.
- **At least 3 independent fresh installs in clean sandbox projects** performed by the maintainer, logged in the release record, with zero manual workarounds applied (minimum, not maximum).
- **Marketplace install produces the same Convoke state** as standalone `convoke-install` — dual-distribution parity, validated by diffing the two post-install filesystems.

### Business Success

Business success for 4.0 is NOT measured in adoption velocity — per PM1 the marketplace is too early, and marketplace adoption velocity is a 12–18 month observation rather than a 4.0 outcome. Success is measured in **release correctness, governance capability unlocked, and strategic positioning landed**:

- **All four workstreams ship** (WS1/U10, WS2/P23, WS3/A8, WS4/A9) OR deferral of ≤1 workstream with: (a) documented rationale, (b) specific follow-up issue opened in backlog tagged `deferred-from-v4.0`, (c) named owner, (d) target re-evaluation date. Per PM2, partial ship with honest deferral is acceptable; silent deferral is not.
- **Marketplace PR is open with complete registry metadata** and passes BMAD's PluginResolver validation against `registry-schema.yaml` (ship-blocking). **Upstream review feedback** is tracked as a separate, aspirational target — if not received by release date, note the delay honestly but do not block ship.
- **`host_framework_sync` playbook artifact delivered** — a concrete file covering (in whatever structure Winston chooses) release class definition, trigger criteria, workstream template, validation battery reference, and known-pitfalls. Winston sign-off recorded. Per PM4, "named release class" without this artifact is vapor.
- **`bmm-dependencies.csv` registry operational** — generated by a committed scan tool (e.g., `scripts/audit-bmm-dependencies.js`). The scan tool output IS the registry; human edits are forbidden; re-running the tool is the update mechanism. Wired into `convoke-update` as a post-upgrade gate.
- **Strategic bet documented as a revalidatable ADR:** file exists at a committed path (e.g., `docs/adr/adr-bmad-coupling-v4.0.md`) containing (a) decision statement, (b) ≥2 alternatives considered, (c) explicit revalidation trigger naming the condition and owner, (d) link back to this PRD. Per PM5, the bet must be a hypothesis, not a commitment.

### Technical Success

Technical success requires all four workstreams to meet their individual completion bars AND collectively satisfy cross-cutting quality constraints:

- **WS1 — Direct-load migration completeness:** No active/callable references to `bmad-init` skill remain in source — verified by a committed audit script that filters grep results to code-like contexts (documentation and historical comments explaining the removal are allowed). User migration script is idempotent — 2x re-run on ≥3 sandbox fixtures produces an empty filesystem diff. Path-safety analysis recorded in the script spec per Convoke memory feedback rule.
- **WS2 — Marketplace conformance:** `marketplace.json` at repo root passes BMAD's PluginResolver validation. `module_definition` field correctly points to `_bmad/bme/_vortex/module.yaml`. Automated skill-dir audit (via committed `scripts/audit-skill-dirs.js` or equivalent) walks `.claude/skills/` and verifies every directory contains a SKILL.md file conforming to v6.3 frontmatter schema — zero flat `.md` files remain. Compatibility preflight check protects against missing `bmad_version` field at runtime.
- **WS3 — Amelia consolidation:** `bmad-agent-qa`, `bmad-agent-sm`, and `bmad-agent-quick-flow-solo-dev` directories removed from Convoke's bmm module (source + installed). Upstream Amelia pulled and integrated. `skill-manifest.csv`, `files-manifest.csv`, sprint planning docs, and user guides updated. Cross-reference grep confirms no remaining mentions of removed agents in Bme workflows.
- **WS4 — Extensions governance operational:** `_bmad/_config/bmm-dependencies.csv` exists and is generated by the committed scan tool. Post-upgrade regression gate wired into `convoke-update`. Governance rule documented.
- **Cross-cutting:** Architecture doc exists, defines drift threshold T numerically, and has passed the IR gate before any epic implementation story starts (Sprint 1 experiments are exempted — they run pre-IR to inform architecture). Retrospective SCHEDULED in Sprint 0 (see Release Process Checklist).

### Measurable Outcomes

| # | Metric | Source | Measurement method |
|---|--------|--------|---------------------|
| M1 | SKILL.md migration inventory committed (frozen list) | Sprint 0 | File `_bmad/_config/v6.3-migration-inventory.csv` exists before dev starts; amendments allowed with change record |
| M2 | 100% of M1 inventory migrated to direct-load | WS1 | Every row in M1 has `migrated: true` |
| M3 | No active/callable `bmad-init` references in source | WS1 | Committed audit script `scripts/audit-bmad-init-refs.js` returns 0 results in code contexts |
| M4 | User migration script: 2x re-run on ≥3 sandbox fixtures → empty filesystem diff | WS1 | Automated test in CI |
| M5 | Sprint 1 experiments (EXP1, EXP2, EXP3) logged with go/no-go result + 1-paragraph "what this changed downstream" statement in Sprint 1 artifact | PR2-4 | Sprint 1 artifact inspection |
| M6 | Architecture doc defines drift threshold T as a numeric value | New (G2) | Numeric literal present in NFR section |
| M7 | IR gate run successfully against architecture doc before any epic implementation story starts (Sprint 1 experiments exempted) | New (G3) | Sprint 0 artifact records IR gate pass; dev story start dates all ≥ IR gate date |
| M8 | Architecture doc delivered within budget — IR gate pass date ≤ CA start date + N days | OP-3 trip-wire | Date comparison; N defined in release plan |
| M9 | PF1 validation battery PASSED (100% of inputs within drift threshold T; battery size per architecture NFR) | PF1 + M6 | Test record in release artifact; blocked on M6 |
| M10 | 4/4 workstreams shipped OR deferral ≤1 with rationale+follow-up issue+owner+date | WS1–WS4 | CHANGELOG + backlog state |
| M11 | Every deferred workstream has a corresponding backlog issue tagged `deferred-from-v4.0` with status `Backlog` | PR3-9 | Backlog query |
| M12a | Marketplace PR open with complete registry metadata; passes PluginResolver validation | WS2 (ship-blocking) | GitHub PR link + validation log |
| M12b | At least one round of BMAD org review feedback received | WS2 (aspirational) | PR comments; if absent by release date, note delay honestly but do not block ship |
| M13 | `host_framework_sync` playbook delivered covering required content areas, Winston sign-off | PM4 | Playbook file exists + Winston sign-off recorded |
| M14 | `bmm-dependencies.csv` generated by committed scan tool (scan tool IS the source of truth) | WS4 | Registry file exists; scan tool exists; registry matches tool output |
| M15 | Strategic bet ADR exists with decision, ≥2 alternatives, revalidation trigger, PRD link | PM5 | File at committed path; sections checked |
| M16 | CHANGELOG contains `mostHonestOneLineSummary` verbatim + follows Sophia section order + zero cliché list violations + maintainer sign-off in release commit | PR2-5 | Three grep-able tests + git commit check |
| M17 | N=1 external non-maintainer user has run the upgrade and reported no issues | PR3-5 | External user report logged in release record |

### Release Process Checklist

These are **process checks**, not quality metrics — they verify that release operational hygiene happened, not that the release is correct. Separated from Measurable Outcomes so the metrics table stays diagnostic.

- [ ] **`bmad-init` skill directory removed** from `_bmad/core/bmad-init/` (source) and from npm-published install artifacts. Pertains to OUR controlled artifacts, not user filesystems.
- [ ] **`bmad-enhance-initiatives-backlog` is the first WS4 validation target** — tagged and executed before any other dependency inventory work, visible in sprint plan ordering.
- [ ] **Retrospective scheduled in Sprint 0** with owner named, date committed, and feedback process documented (Sprint 0 artifact lists retrospective questions and identifies `convoke-note-initiatives-backlog.md` as the findings destination).

### Operating Principles

These are *principles*, not metrics or policies — they describe how we aspire to operate. Three have enforcement trip-wires; two rely on operator self-awareness. Honest separation — conflating principles with metrics is how metrics tables get bureaucratic and principles get lost.

- **OP-1 — Maintainer bandwidth awareness.** Solo + agent-assisted capacity is real. If release work materially exceeds expected effort (Amalik's judgment — not precisely measured), the honest response is workstream deferral, not silent over-work. This is a principle, not an enforced constraint — there is no trip-wire, and the honesty depends on the operator choosing it. Named explicitly so the choice is visible.
- **OP-2 — Deferral is allowed; silent deferral is not.** Enforced by M10 (4/4 with ≤1 explicit deferral) and M11 (deferral follow-up backlog issue). Load-bearing.
- **OP-3 — Architecture is the upstream dependency; delays are visible.** Enforced by M8 (architecture budget trip-wire) — if IR gate passes more than N days after CA starts, flag for deferral review. Load-bearing via M8.
- **OP-4 — Upstream BMAD responsiveness is out of scope.** Enforced by M12a/M12b split — ship-blocking path excludes BMAD org response times. Load-bearing via M12.
- **OP-5 — Recursive tooling must be validated first.** Enforced by the Release Process Checklist ordering. Load-bearing.

## Product Scope

### MVP — Minimum Viable Product

Per OP-1 and OP-2, each workstream is independently valuable. Per M10, partial MVP is acceptable IF deferrals are explicit, named, and have follow-up plans.

**Mandatory for 4.0 MVP:**
- **WS1 / U10** — foundation; deferring means Convoke breaks on BMAD v6.3+
- **WS4 / A9** — at minimum its first validation target (Release Process Checklist item: recursive tooling check for `bmad-enhance-initiatives-backlog`). Full registry can be minimal but must exist.
- **All Sprint 1 experiments** (EXP1, EXP2, EXP3) — they inform every downstream decision (M5)
- **Architecture doc passing IR gate before dev starts** — M6, M7, M8

**Deferrable if maintainer bandwidth requires:**
- **WS3 / A8** (Amelia consolidation) — deferrable if upstream Amelia is unstable or if skill-dir sweep overruns
- **WS2 / P23** (marketplace publication) — highest-profile workstream but not a correctness blocker. Standalone 4.0 is a valid release even if marketplace approval is pending

**Minimum-viable quality bar:**
- IR gate run before dev starts (M7)
- PF1 validation battery run before release (M9)
- Sprint 1 experiments run in week 1 (M5)
- Retrospective scheduled in Sprint 0 (Release Process Checklist)
- CHANGELOG per Sophia's voice (M16)
- N=1 external user validation (M17)

### Growth Features (Post-MVP, 4.1+)

- **Post-release drift monitoring** — explicitly deferred per PM3. Addresses the gap between pre-release synthetic validation and production behavior.
- **Bolder Move 3 — platform-agnostic publishing** — contingent on EXP3. Ships in 4.1 if the smoke test succeeds; expands marketplace distribution to standalone skill exports + Copilot/Cursor adapters.
- **Marketplace promotion to `community-reviewed`** — requires BMAD org review; out of scope for 4.0; 4.1+ follow-up.
- **Buyer-facing positioning** — per shark tank ST2, enterprise buyer concerns out of scope for 4.0.
- **Agent behavior telemetry + user feedback infrastructure** — would make `unknown_until_validated` measurable and replace structural proxies with direct user-reality measurements. Separate N1-telemetry initiative.

### Vision (Future)

- **Multi-platform publishing at scale** — Convoke skills available through BMAD marketplace + Claude Code native + Copilot + Cursor + Windsurf simultaneously.
- **Community contribution model** — per ST4, opening Convoke to external contributions with defined review bar.
- **`host_framework_sync` as a standard release pattern** — every major BMAD rev applies the 4.0 playbook with minimal re-reasoning. v6.4, v7.0, v8.0 all follow the template.
- **`bmad-certified` trust tier** — earned through sustained stability, community review, and upstream partnership.
- **Unblocks Convoke ecosystem expansion** — Forge, Helm, Loom teams shipped via marketplace as they mature.

## User Journeys

### Journey 1 — Priya upgrades Convoke mid-engagement (primary user, happy path)

**Persona:** Priya, IT transformation consultant at a large European consultancy. Six weeks into a client engagement running a Vortex discovery with Convoke 3.2.0. Has no interest in framework maintenance; Convoke is a tool she relies on daily but doesn't think about. Target: finish the discovery on time.

**Opening scene.** Tuesday morning, week 7 of the engagement. Priya opens her project terminal, intending to run another Vortex stream with Isla (discovery empathy expert). `convoke-doctor` shows a notice: "Convoke 4.0 is available." She hesitates — mid-engagement upgrades feel risky. She checks the CHANGELOG.

**Rising action.** The CHANGELOG leads with Sophia's `mostHonestOneLineSummary`: *"Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD evolves and adds marketplace distribution for reach."* Priya reads three sentences and understands: nothing new to learn, no re-onboarding, just a single command with auto-migration. She runs `convoke-update`.

**Climax (non-event).** The update completes in under 30 seconds. No prompts. No config questions. The `bmad-init` config pattern is silently migrated. Priya runs her Isla stream — the empathy map comes out identical in structure to yesterday's. Agent behavior equivalence holds. She never notices that anything changed under the hood.

**Resolution.** End of day, Priya has completed another Vortex stream without any friction. She closes her terminal without thinking about the upgrade again. **Success state:** the release was invisible.

**Requirements revealed:**
- Single-command upgrade (`convoke-update`)
- Idempotent auto-migration script
- CHANGELOG that leads with honest summary (no FOMO, no FUD)
- Agent behavioral equivalence guarantee (PF1 validation)
- Recursive tooling continuity (if Priya was using `bmad-enhance-initiatives-backlog` to track client findings, it must still work — WS4 first validation target)

### Journey 2 — Priya hits an edge case during migration (primary user, error recovery)

**Persona:** Same Priya. Two weeks later, starting a new engagement. Installs Convoke 4.0 fresh in a new project directory.

**Opening scene.** Priya runs `convoke-install` for the new project. It succeeds. She runs `convoke-doctor`. She expects a clean health report. Instead she sees a warning: `Extension governance registry check: 'bmad-enhance-initiatives-backlog' passed. All other dependencies: 0 detected — scan tool unable to parse custom skill pack at .claude/skills/priya-custom-note-tool/SKILL.md`. She froze.

**Rising action.** Priya has a custom skill she wrote herself that extends John (PM) for her own note-taking workflow. It isn't in the official BMM agent set, so `bmm-dependencies.csv` doesn't know what to do with it. The extensions governance registry (WS4) is telling her honestly: "I couldn't validate this, but I detected it, here's what I see." She considers her options:
1. Remove her custom skill entirely.
2. Ignore the warning and continue.
3. Read the governance documentation to understand how to register her custom skill.

She picks option 3. The governance rule documentation (delivered as part of WS4) explains: "New Convoke skills extending BMM agents must register in `bmm-dependencies.csv`." She adds a row manually. `convoke-doctor` re-runs. Clean report.

**Climax.** The edge case wasn't a bug — it was the governance system *working as designed*, surfacing a dependency that would otherwise have silently broken on a future upgrade. The warning was a feature, not a failure. Priya's custom skill is now registered and will be validated on every future upgrade.

**Resolution.** Priya proceeds with her engagement. She now understands, at a basic level, that Convoke has a governance layer that protects her custom work. Next time she writes a custom skill, she'll register it proactively.

**Requirements revealed:**
- Extensions governance registry surfaces non-standard skills with clear warnings (not silent pass)
- Governance rule documentation is discoverable (linked from warning message)
- Manual registry editing is documented and supported for user-owned extensions
- Warning messages are honest signals, not errors that block work
- `convoke-doctor` health reports distinguish "missing" from "present but unverified"

### Journey 3 — Samira discovers Convoke via the BMAD marketplace (new user, marketplace flow)

**Persona:** Samira, junior consultant on Priya's team. Has never used Convoke. Heard Priya mention "the Vortex discovery thing" and wants to try it on a smaller project. Already has BMAD installed — she uses the core BMAD methodology for everything.

**Opening scene.** Samira is in her editor, exploring the BMAD installer's community module browser. She's looking for something to help with product discovery on a client proposal she's drafting. She sees a listing: `convoke — A 7-agent product discovery framework for IT transformation consultants`. Trust tier: `unverified`. She recognizes "Vortex" from Priya's conversation and clicks install.

**Rising action.** The marketplace flow shows her Convoke's README preview, the module_definition metadata, and the required/recommended modules. She accepts the install. `git clone` runs (BMAD's community module flow). Convoke is installed alongside BMAD. She runs `convoke-install-vortex` which she sees documented in the post-install notes. It completes without asking her any config questions she doesn't already know from BMAD. She runs her first Vortex stream.

**Climax.** Emma (contextualization expert) greets her, walks her through a problem-framing exercise for her client proposal. Samira feels like she just unlocked a capability — she has an AI teammate who can methodically break down a consulting problem the way Priya does. The `trust_tier: unverified` warning is visible but Samira isn't worried — she trusts the recommendation chain (Priya → Convoke) more than she'd trust a generic trust badge.

**Resolution.** Samira completes her proposal with Emma's help. She tells Priya thank you, Priya says you're welcome, and Samira adds Convoke to her personal tooling. Over the next month she tries Isla, Liam, and Max. Each one works as advertised. She never notices the details of how Convoke was installed; she just notices that it worked.

**Requirements revealed:**
- `marketplace.json` accurately describes Convoke to the BMAD installer
- `module_definition` points to the correct `module.yaml` so PluginResolver discovers capabilities
- Post-install notes guide the user toward `convoke-install-vortex` (or equivalent next step)
- `trust_tier: unverified` is honestly displayed but doesn't block install
- First-run experience is coherent without requiring Convoke-specific knowledge beyond what BMAD users already know

### Journey 4 — Amalik (maintainer) runs the release (the operator journey)

**Persona:** Amalik, solo maintainer of Convoke. Six weeks of capacity allocated to 4.0. Wants the state-of-the-art quality bar he committed to but also wants to stay sane.

**Opening scene.** Sprint 0. Amalik sits down to kick off the release. He opens Winston for CA (Create Architecture). They go through the PRD frontmatter together. Winston writes the architecture doc specifying the drift threshold T (M6), the validation battery composition (M9), the governance registry schema (M14), and the `host_framework_sync` playbook outline (M13). The architecture doc passes the IR gate before any dev story starts (M7).

**Rising action — Sprint 1.** Amelia takes the architecture doc and the PRD. Sprint 1 begins with the three pre-registered experiments (M5). Day 1–2: EXP1 migration dry-run on Emma. Day 3: EXP2 marketplace PR pathfinder submitted. Day 4: EXP3 exporter smoke test across Claude Code, Copilot, Cursor. EXP1 passes — equivalence holds on 5 real inputs. EXP2 gets procedural feedback from BMAD org (clean). EXP3 reveals that the Copilot adapter has a minor issue but the Claude Code and Cursor adapters work — Amalik notes the EXP3 result and decides NOT to absorb Bolder Move 3 into 4.0 framing (defers to 4.1). The Executive Summary stays narrow.

**Climax.** Sprints 2–4. WS1 sweep executes per the migration inventory (M1/M2). WS3 Amelia consolidation runs in parallel. WS4 starts with the recursive tooling validation — `bmad-enhance-initiatives-backlog` passes first (Release Process Checklist item). Then the rest of the BMM dependency scan. WS2 submits the marketplace PR (M12a). The PF1 battery runs pre-release and passes (M9). The architecture budget trip-wire (M8) shows the architecture was delivered within N days — on target. Amalik realizes around week 5 that he's actually going to finish this on schedule.

**Resolution — Sprint 5.** Release ships. CHANGELOG published with Sophia's draft (M16). The `mostHonestOneLineSummary` is verbatim. Priya (from Journey 1) gets the notification and upgrades without incident. Samira (from Journey 3) discovers Convoke the next week via the marketplace. Amalik runs the scheduled retrospective (M17, from Release Process Checklist). Findings go back to the initiatives backlog. The bmad-init skill is gone. Convoke 4.0 is live.

**Requirements revealed:**
- Winston must deliver architecture doc within budget N days for M8 trip-wire
- IR gate (`bmad-check-implementation-readiness`) must accept the architecture doc cleanly
- Sprint 1 experiments must be parallelizable and low-friction to run in week 1
- Migration inventory (M1) must be frozen before Sprint 2 dev work starts
- Recursive tooling validation must run before other WS4 inventory work
- PF1 battery must be executable pre-release, not post-release
- CHANGELOG must be ready by ship day, not after
- Retrospective must be scheduled in Sprint 0 (not "after we ship")

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|---------------------------|
| **J1 — Priya's silent upgrade** | Single-command upgrade, idempotent auto-migration, honest CHANGELOG, behavioral equivalence guarantee, recursive tooling continuity |
| **J2 — Priya's edge case** | Governance registry with honest warnings, discoverable governance documentation, manual registration support, distinction between missing/unverified/present |
| **J3 — Samira's marketplace install** | `marketplace.json` validation, module_definition pointing correctly, post-install guidance, honest trust tier display, coherent first-run experience |
| **J4 — Amalik's release operation** | Architecture budget enforcement (M8), IR gate rigor, parallelizable experiments, frozen migration inventory, execution sprints with clear gates, pre-release validation, scheduled retrospective |

**Cross-cutting observation:** Three of four journeys are about *correctness under absence of friction*. Only J4 (Amalik's operator journey) is about *activity and effort*. That's the correct shape for a maintenance release — the users should barely notice, and the maintainer should carry most of the narrative weight.

## Domain-Specific Requirements

**Not applicable** for a general-domain framework release. Convoke operates in the `general` domain (per classification) and does not face regulated-industry compliance concerns (no HIPAA, PCI-DSS, GDPR, FedRAMP, FDA, or equivalent). Platform and ecosystem constraints relevant to 4.0 — skill manifest schema compliance, BMAD marketplace registry conformance, upstream convention tracking, licensing — are already covered under Technical Success (WS2), Business Success (marketplace registry metadata, ADR documentation), and Operating Principles (OP-4 upstream BMAD governance). This section is deliberately empty to record that the decision to omit full domain-requirements work was made explicitly, not as an oversight.

## Innovation & Novel Patterns

### Framing: Mature Discipline for a Young Domain

Convoke 4.0 does not invent breakthrough techniques. It **imports mature disciplines from traditional software, compiler theory, lean UX experimentation, and editorial practice into a young domain** — AI agent framework maintenance — and names them explicitly so they can be reused in future releases. This is disciplined adoption, not green-field invention. The contribution is the *discipline of importing the discipline*: making these practices explicit, first-class, and load-bearing rather than ad-hoc.

Seven innovations are organized into four thematic disciplines. Each is formulated as a **falsifiable hypothesis** with prediction, observation, and falsification condition. The retrospective (scheduled in Sprint 0 per Release Process Checklist) is the validation gate — without post-release observation, the hypothesis framing is performative.

### Theme 1: Release Discipline

#### I1 — `host_framework_sync` as a named, reusable release class

**Source discipline:** Release taxonomy and maintenance-class naming (mainframe, kernel, LTS traditions)
**Hypothesis:** If we deliver the `host_framework_sync` playbook artifact as part of 4.0, then future BMAD major releases will be processed using the playbook as a starting template (≥50% content reuse), rather than reinventing the release plan from scratch.
**Observation:** Content reuse percentage at v6.4 adoption, measured by diff between v6.4 release plan and the 4.0 playbook.
**Falsification:** If v6.4 adoption rewrites ≥50% of the playbook, the release class was premature abstraction.

#### S1 — Honesty constraints as release discipline ⭐

**Source discipline:** Academic publishing pre-registration, trustworthy release communication
**Hypothesis:** If we name what the release can't promise (`userMigrationFriction: unknown_until_validated`, synthetic-only validation, maintainer bandwidth as a real constraint, no post-release drift monitoring), then post-release retrospectives will NOT surface "we overclaimed" as a finding.
**Observation:** Retrospective findings tagged `overclaim` or `expectation-mismatch`.
**Falsification:** If the retrospective finds that users experienced the release as overclaiming despite the honesty constraints, the discipline was theatrical, not functional. *Load-bearing innovation — everything else in the PRD bends around this one.*

#### S3 — Pre-registered experiments as Sprint 1 gates

**Source discipline:** Lean UX experimentation, pre-registration protocols from scientific methodology
**Hypothesis:** If we pre-register EXP1/EXP2/EXP3 with go/no-go criteria before Sprint 1 starts, then each experiment will produce a documented decision that shapes downstream scope, rather than being run and ignored.
**Observation:** Does the Sprint 1 artifact contain "what this changed downstream" paragraphs for each experiment? Do those paragraphs correspond to observable scope changes in later sprints?
**Falsification:** If experiments ran but downstream scope is unchanged regardless of results, the go/no-go criteria weren't load-bearing and the pre-registration was ceremonial.

### Theme 2: Validation Discipline

#### I3 — Pre-release agent behavioral equivalence validation as a shipping commitment

**Source discipline:** Regression testing, snapshot testing, characterization tests from traditional software (applied to LLM outputs for the first time as a release gate in this domain)
**Hypothesis:** If we require PF1 (agent output equivalence on a representative battery) to pass before release, then we establish a measurable baseline where none existed, against which future releases can detect regressions.
**Observation:** Presence of a PF1 PASS/FAIL record in the release artifact. Post-release bug reports tagged `behavior-change` in the first 4 weeks post-ship.
**Falsification:** If ≥3 behavior regression reports land in 4 weeks despite PF1 passing, the synthetic battery was insufficient — we'd need to expand it or add post-release monitoring. *Honest note: there is no baseline to compare against because Convoke has never measured this before. The validation establishes measurement, not necessarily improvement.*

#### I5 — Pre/post skill output drift snapshot

**Source discipline:** Snapshot testing, diff-based regression detection
**Hypothesis:** If we capture pre-release and post-release output snapshots for 2–3 key skills (e.g., `bmad-enhance-initiatives-backlog`, a Vortex stream output, a PRD draft output) and compare them, we generate a one-time retrospective drift measurement even without ongoing telemetry.
**Observation:** A drift snapshot comparison file exists in the release artifact, showing semantic diff between pre- and post-release outputs on the same inputs.
**Falsification:** If the comparison reveals significant unintended drift, the release had a behavioral impact we failed to validate via PF1 alone (which means PF1's sample was too narrow).

### Theme 3: Communication Discipline

#### S2 — Dual-framing for audience

**Source discipline:** Technical writing, plain-language movement, audience-aware documentation
**Hypothesis:** If we maintain separate `internalOnly` and `userFacing` vocabulary annotations in the PRD frontmatter and enforce them across release documentation, then user-facing communications (CHANGELOG, migration guide, release announcement) will NOT contain any phrase from the `internalOnly` list.
**Observation:** Grep CHANGELOG + migration guide + release announcement for phrases on the `internalOnly` list (`host_framework_sync`, "content, not software", "strategic bet", "first-class community module", etc.).
**Falsification:** If any `internalOnly` phrase appears in user-facing docs, the annotation system failed to prevent bleed-through and the dual-framing discipline was aspirational rather than enforced.

### Theme 4: Learning Discipline

#### L1 — Retrospective anti-pattern registry

**Source discipline:** Engineering retrospective practice, standing anti-pattern catalogues (e.g., AntiPatterns by Brown et al., 1998)
**Hypothesis:** If we document the anti-patterns observed during 4.0 (e.g., "we almost silently reordered the prioritized view during a backlog triage," "we used 'first-class' where the status was unearned," "we let M18 masquerade as a metric when it was a policy") in a standing registry that persists across releases, then future releases will exhibit fewer of these same anti-patterns because maintainers can read the registry before starting new work.
**Observation:** The retrospective produces an updated `convoke-anti-patterns.md` registry. Future releases' retrospectives reference the registry and note whether each anti-pattern recurred.
**Falsification:** If the registry exists but is never consulted during subsequent releases, OR if the same anti-patterns recur in v4.1/v6.4 despite the registry, then the Learning Discipline was curation without feedback and failed to change behavior.

### Market Context & Competitive Landscape

**These innovations are not market-facing in the feature sense.** No user is choosing Convoke 4.0 because it has a named release class or a pre-registered experiment protocol. Users choose (or continue using) Convoke because the agents help them run consulting engagements. The innovations matter because they **sustain the framework that users depend on** without requiring users to care about the sustainment work.

**Positioning claim (internal only):** Convoke 4.0 is the first release to apply mature software and editorial discipline to AI agent framework maintenance as a systematic practice. No competing AI agent framework in the Convoke target space (consulting workflow frameworks) is currently doing this. Traditional software has had these disciplines for decades; AI agent frameworks are young enough that the disciplines are still being imported one by one. Convoke's contribution is the *importing*, not the *inventing*.

**User-facing claim (from `userFacing` vocabulary):** Per the dual-framing discipline (S2), this entire section is `internalOnly`. The user-facing equivalent is simply: *"Convoke 4.0 is a maintenance release that keeps Convoke healthy as BMAD evolves and adds marketplace distribution for reach."* The innovations live behind that sentence.

### Validation Approach — Retrospective as the Gate

Every innovation in this section is formulated as a hypothesis with an observation and a falsification condition. **The retrospective (scheduled in Sprint 0 per Release Process Checklist) is the validation gate.** Without post-release retrospective observation, the hypothesis framing is performative.

The retrospective must explicitly address:

1. Did I1's playbook artifact serve its purpose? Will it be reusable at v6.4? *(Defer observation to v6.4 adoption.)*
2. Did S1's honesty constraints prevent overclaim in user experience? *(Observe in first 4 weeks of user feedback.)*
3. Did S3's pre-registered experiments produce acted-upon decisions? *(Observe in Sprint 1 artifact.)*
4. Did I3's PF1 validation establish a useful behavioral baseline? *(Observe in any post-release behavior-change reports.)*
5. Did I5's drift snapshot reveal unexpected behavioral changes? *(Observe immediately post-release.)*
6. Did S2's dual-framing prevent internal-only phrases from leaking into user docs? *(Grep the published CHANGELOG.)*
7. Did L1's anti-pattern registry capture the real anti-patterns from 4.0? *(Review the registry at retrospective time.)*

### Risk Mitigation — Innovation Durability

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

## Developer-Tool Specific Requirements

### Project-Type Overview

Convoke is a `developer_tool` in the `general` domain. Unlike traditional developer tools (SDKs, libraries, CLI frameworks), Convoke ships **LLM-interpreted content** (prompts, skills, workflow definitions) alongside a thin layer of JS/Python CLI tooling. This hybrid nature means the "API surface" is split: a small CLI surface for human operators and a large content surface that is consumed by Claude Code rather than called programmatically.

This section captures project-type-specific technical requirements for 4.0. Several subsections are intentionally brief because the content is already documented elsewhere in the PRD; cross-references are noted.

### Language Matrix

| Layer | Language/Format | Role | Target audience |
|-------|-----------------|------|-----------------|
| **Agent content** | Markdown (SKILL.md, agent files) | Prompts, personas, workflow steps | Claude Code (LLM runtime) |
| **Configuration** | YAML (`config.yaml`, `module.yaml`) | Module metadata, user settings | Convoke installer + operator |
| **Manifests** | CSV (`skill-manifest.csv`, `bmm-dependencies.csv`) | Tooling registries | Convoke scripts |
| **CLI tooling** | JavaScript (Node 18+) | `convoke-install`, `convoke-update`, `convoke-doctor`, `convoke-version`, etc. | Developer/consultant operator |
| **Scripts/audits** | Python 3.10+ (with `uv`) and JavaScript | Ad-hoc scripts for audits, migration, validation | Maintainer + CI |

**4.0-specific language changes:** None. The language matrix is stable across the release; 4.0 changes *how* content is loaded (direct-load migration) and *where* it's distributed (marketplace), not *what languages* are used.

### Installation Methods

4.0 introduces a second installation path. Both paths must produce equivalent post-install state (validated per Technical Success WS2 parity check).

| Method | Command | Status in 4.0 | Target user |
|--------|---------|---------------|-------------|
| **Standalone CLI (primary, existing)** | `npm install -g convoke-agents && convoke-install` | Supported; remains the primary path | Existing Convoke users, users with existing Convoke workflows |
| **BMAD marketplace (new)** | BMAD community module browser → select `convoke` → install | New in 4.0; `trust_tier: unverified` initially | New users discovering Convoke via BMAD, colleagues of existing users |
| **Direct git clone + manual install** | `git clone` + `convoke-install` | Unchanged — power-user path, not advertised | Contributors, debuggers |

**Cross-reference:** Installation flow details are in Journey 3 (Samira's marketplace install) and WS2 scope in the Executive Summary.

**Upgrade path:** `convoke-update` remains the canonical upgrade command regardless of install method. Auto-migration handles the `bmad-init` → direct-load transition (WS1).

### API Surface

Convoke exposes **no programmatic API** — there is no `require('convoke-agents')` import path, no HTTP endpoints, no callable library. The "API surface" is split across three modalities:

**1. CLI surface** (for operators):
- `convoke-install` / `convoke-install-vortex` / `convoke-install-gyre` — installation commands
- `convoke-update` — upgrade flow including auto-migration
- `convoke-doctor` — health checks including WS4 governance registry validation
- `convoke-version` — version display
- `convoke-migrate` — manual migration trigger
- Plus future: `convoke-install <module>` (from P3 team installer architecture, not this release)

**2. Claude Code skill surface** (for the LLM runtime):
- `.claude/skills/<skill-name>/SKILL.md` for each installed skill
- Activation protocol per BMAD v6.3 convention (must be v6.3-compliant after 4.0)
- Skill discovery via `bmad-skill-manifest.yaml` and `skill-manifest.csv`

**3. Convoke extension surface** (for operator-authored customizations):
- Operators can write custom skills that extend BMM agents (e.g., Priya's custom note-taking skill from Journey 2)
- Extensions register in `_bmad/_config/bmm-dependencies.csv` per WS4 governance rule
- This is a new first-class surface introduced by WS4 — prior Convoke versions had no formal extension registration

**4.0-specific API surface changes:**
- WS1 retires the `bmad-init` skill activation pattern — all skills now load config directly
- WS3 removes three skills from the surface (`bmad-agent-qa`, `bmad-agent-sm`, `bmad-agent-quick-flow-solo-dev`), absorbed into Amelia
- WS4 adds the extensions registration surface (operators can now formally register custom skills)

### Code Examples

**Existing agent invocation patterns are unchanged by 4.0.** Users invoke agents the same way in 3.2.0 and 4.0:

- Ask to talk to an agent by name: "talk to Winston," "talk to John"
- Invoke a skill directly: "run lets create PRD," "triage the initiatives backlog"
- The agent menu and command interactions are identical post-migration

**Cross-reference:** Journey 1 (Priya's silent upgrade) demonstrates the continuity — her Isla stream produces the same output structure after the upgrade as before. This is enforced by PF1 validation (M9).

**4.0-specific code examples (new):**
- **Manual extension registration** (new in WS4) — when a user creates a custom skill extending a BMM agent, they add a row to `_bmad/_config/bmm-dependencies.csv`:
  ```
  skill_name,bmm_agent,owner,registered_date
  priya-custom-note-tool,bmad-agent-pm,priya@example.com,2026-05-15
  ```
- **Marketplace install** (new in WS2) — users select Convoke in the BMAD community module browser (no command-line invocation by the user; handled by BMAD installer).

### Migration Guide

**This section is covered in depth elsewhere — see:**
- **Journey 1** for the happy-path upgrade experience
- **Journey 2** for the edge case (governance registry warning for unregistered custom skills)
- **WS1 scope** in the Executive Summary for the auto-migration mechanism
- **M3, M4** in Success Criteria for the audit and idempotency metrics
- **Sophia's release announcement draft** in frontmatter (`partyFindingsRound2.PR2-5`) for the user-facing voice

**One commitment specific to this section:** The 4.0 migration guide will be **≤1 page** and introduce **zero new concepts** users must learn. This is a structural proxy for "zero user action required to re-onboard" (per User Success criteria).

**Implementation considerations:**
- Migration guide lives at `docs/migration/3.x-to-4.0.md` or equivalent
- Links from `convoke-update` terminal output when the update runs
- Linked from CHANGELOG 4.0 entry

### Implementation Considerations

**Non-functional requirements specific to `developer_tool` project type for 4.0:**
- **Idempotency of CLI commands** — `convoke-update` must be safe to re-run without side effects (M4)
- **Path safety** — scripts accepting user paths must pass path-safety analysis (per Convoke memory feedback rule, reflected in Technical Success WS1)
- **Cross-platform support** — Convoke supports macOS, Linux, and WSL. Windows-native is not officially supported and is not in scope for 4.0. No change from 3.2.0.
- **Minimum runtime versions** — Node 18+, Python 3.10+ (the latter per BMAD v6.3 prerequisites that Convoke inherits)
- **Offline-safe** — `convoke-update` should degrade gracefully if the marketplace registry is unreachable (per BMAD's own registry client behavior, inherited)

## Project Scoping & Phased Development

*The MVP/Growth/Vision feature breakdown is documented in Success Criteria → Product Scope. This section adds the **strategic framing** for scoping decisions: MVP philosophy, resource requirements, and consolidated risk mitigation. Cross-references point to where specific feature/phase content lives.*

### MVP Strategy & Philosophy

**MVP Approach:** `host_framework_sync` release — a **new class of MVP** for Convoke, distinct from typical MVP philosophies:

| Typical MVP approach | What it targets | Why it doesn't fit 4.0 |
|----------------------|----------------|------------------------|
| Problem-solving MVP | Validate a user problem | Convoke already validated the user problem (3.x has live users); 4.0 solves *maintainer* problems, not new *user* problems |
| Experience MVP | Validate a user experience | User experience stays unchanged (continuity is the goal) |
| Platform MVP | Validate a distribution/growth channel | Partially fits (marketplace publication IS a new channel) but undersells |
| Revenue MVP | Validate willingness to pay | Not applicable — Convoke is open source / MIT |

**What 4.0 actually validates:** that Convoke can sustain itself as a downstream of BMAD through structured, honest, reusable release discipline. The MVP validates the **release process**, not the product.

**Chosen MVP philosophy: `host_framework_sync` as a reusable release class** (Innovation I1). The minimum thing that would make this release "validated" is:

1. The release ships with honest constraints named (S1)
2. The release class is documented as reusable (playbook artifact M13)
3. The recursive tooling test (the backlog skill must pass WS4 first) is satisfied
4. At least one non-maintainer user has validated the upgrade (M17)

These are the *load-bearing validation signals*. Everything else in the Success Criteria metrics is a correctness check, not a philosophy validation.

**Cross-reference:** MVP feature set (mandatory / deferrable / quality bar) is documented in Success Criteria → Product Scope → MVP. That enumeration is the authoritative list; not duplicated here.

### Resource Requirements

This release is resource-constrained by design. Operating Principle **OP-1 (maintainer bandwidth awareness)** is the primary constraint.

**Team size and composition:**
- **Primary author and executor:** Amalik (solo maintainer)
- **Agent-assisted drafting and design:** Winston (architecture), Amelia (dev), Bob consolidation via Amelia (sprint planning), John (PRD — this document)
- **External roles:** N=1 external validator for M17 (any non-maintainer person willing to run the upgrade and report back)
- **Total human FTE:** ~1 (Amalik himself, part-time allocation to this release)

**Skills required:**
- Node.js 18+ and Python 3.10+ proficiency for CLI tooling and scripts
- BMAD v6.3 convention knowledge (acquired during the release — Sprint 0 experiments include a pathfinder for this)
- Git workflow for repo management
- Markdown authoring for documentation
- **NOT required:** LLM prompt engineering beyond what's already in Convoke's existing skill library

**Time budget:**
- **Target:** ~4–5 focused weeks across 5 sprints
- **Hard ceiling:** If cumulative work materially exceeds expected effort, trigger workstream deferral review (OP-1 — honest principle, no automated enforcement)
- **Soft budget for architecture delivery:** N days from CA start to IR gate pass (OP-3 trip-wire M8 — enforced)

**Cross-reference:** PM2 (maintainer burnout pre-mortem) in the Executive Summary frontmatter captures the full honesty framing.

### Risk Mitigation Strategy

Risks consolidated from pre-mortem (PM1–PM5), shark tank (ST1–ST4), party round 1 (PF1–PF7), and party round 2 (PR2-1 through PR2-5). Organized by Technical / Market / Resource categories.

#### Technical Risks

| Risk | Mitigation |
|------|------------|
| **No `bmad_version` field in marketplace schema** — pre-v6.3 users may install incompatible Convoke and fail at runtime | Runtime compatibility preflight check in Convoke (WS2) + file upstream issue |
| **Skill directory porting gap** — audit needed to confirm all skills comply with v6.3 `<skill-dir>/SKILL.md` convention | Automated skill-dir audit script (Technical Success WS2); surface in Sprint 1 pathfinder work |
| **User migration script idempotency failure** — script runs twice and produces different state | M4 (2x re-run test on ≥3 sandbox fixtures) + path safety analysis per Convoke memory feedback rule |
| **Agent behavioral drift not caught by PF1** — synthetic battery too narrow; live usage surfaces edge cases | PM3 honesty (pre-release battery is *necessary*, not *sufficient*); I5 drift snapshot as retrospective observation; future telemetry capability (deferred to Growth) |
| **Recursive tooling failure mid-release** — backlog skill breaks during the release that's using it | Release Process Checklist mandates backlog skill as first WS4 validation target (PF5) |

#### Market Risks

| Risk | Mitigation |
|------|------------|
| **Marketplace adoption velocity disappoints** — install count stays low for 6+ months | PM1 honesty: success criteria explicitly excludes adoption velocity for 4.0; measured as 12–18 month observation |
| **Strategic bet on BMAD goes bad** — BMAD stagnates or a superior framework emerges | PM5: strategic bet documented as revalidatable hypothesis (ADR with revalidation trigger); reconsider at each major upstream release |
| **Enterprise buyers are confused by `unverified` trust tier** — ST2 finding | Honest disclosure in marketplace listing; buyer-facing positioning explicitly deferred to future release |
| **Convoke looks like a maintenance release with no user value** — existing users ask "why upgrade?" | Sophia's release announcement draft leads with "healthy enough to last" framing; CHANGELOG honesty per M16 |

#### Resource Risks

| Risk | Mitigation |
|------|------------|
| **Maintainer burnout during release** (PM2) | OP-1: workstream deferral is the honest response; each workstream is independently valuable; M10 permits ≤1 deferral with ceremony |
| **WS4 scope is optimistic** — extensions inventory could double the effort (PF3) | Validate inventory size early in Sprint 1 (before WS4 full commitment); relax expected count if sweep reveals more extensions |
| **Marketplace PR approval timeline** — unknown BMAD org response speed (PF4) | M12 split into M12a (ship-blocking: PR open + validates) and M12b (aspirational: BMAD feedback); approval is not ship-blocking |
| **Architecture doc takes longer than expected** (blocks several metrics) | OP-3 trip-wire M8 — architecture budget N days from CA start to IR gate pass; overrun triggers deferral review |
| **Upstream BMAD moves to v6.3.1 or v6.4.0 mid-release** (PF4 / PR2-3) | Freeze target to v6.3.0 explicitly at release kickoff; upstream drift noted but not re-targeted mid-flight |

**Cross-cutting mitigation:** The state-of-the-art release quality commitments (decision records, risk register, versioned interface contracts, traceability, IR gate pre-dev, retrospective post-release) are themselves the primary mitigation for *release-quality* risks. PM2 honesty framing (bandwidth as constraint) is the primary mitigation for *execution* risks.

### Scope Decision Summary

**What we committed to:**
- Four workstreams (WS1/U10, WS2/P23, WS3/A8, WS4/A9) with explicit sequencing
- Three Sprint 1 pre-registered experiments (EXP1, EXP2, EXP3)
- Honesty constraints named in advance
- Behavioral equivalence validation as a shipping gate
- Recursive tooling validation as first WS4 target
- N=1 external user validation before release
- Documented playbook artifact for future reuse
- Retrospective scheduled in Sprint 0

**What we explicitly deferred (see Growth Features in Success Criteria):**
- Post-release drift monitoring
- Platform-agnostic publishing absorbing Bolder Move 3 (contingent on EXP3 — may be absorbed)
- Marketplace trust tier promotion
- Buyer-facing positioning
- Agent behavior telemetry
- Community contribution model

**What we did NOT consider and should acknowledge as blind spots:**
- Windows-native support (still out of scope)
- Internationalization of user-facing release docs (CHANGELOG, migration guide are English-only)
- Accessibility of any web-facing Convoke assets (none exist, but noted)
- Localization of agent personas (agents speak English; no multilingual support)

These are blind spots, not deferrals — we didn't weigh them in the scope discussion. Acknowledging them explicitly keeps the PRD honest about what wasn't considered.

## Functional Requirements

*The capability contract. Every feature shipped in 4.0 must trace back to one of these FRs. Any capability not listed here does not exist in the release. Organized by logical capability areas, not by workstream.*

### Direct-Load Configuration

- **FR1:** Convoke agents load module configuration directly from `_bmad/{module}/config.yaml` without invoking the `bmad-init` skill.
- **FR2:** Convoke provides a direct-YAML loader utility that replaces `bmad-init` functionality for all agent activation flows.
- **FR3:** Every Convoke agent's activation protocol follows the v6.3-compliant direct-load pattern after migration.
- **FR4:** No Convoke skill in the `_bmad/` source tree retains an active reference to `bmad-init` (documentation and historical notes explaining the removal are allowed).

### User Migration

- **FR5:** The operator can upgrade Convoke 3.2.0 → 4.0 in a single command (`convoke-update`).
- **FR6:** Convoke auto-migrates existing `_bmad/core/config.yaml` and `_bmad/{module}/config.yaml` layouts to v6.3-compliant direct-load conventions during upgrade.
- **FR7:** The migration script is idempotent — re-running it produces no side effects after the first successful run.
- **FR8:** The migration script performs only operations within Convoke-owned paths and passes path-safety analysis per the Convoke memory feedback rule.
- **FR9:** The operator can re-run `convoke-update` after a failed migration and resume safely (re-entrancy).
- **FR10:** The operator is presented with a migration guide ≤1 page in length, linked from the terminal output of `convoke-update` and from the CHANGELOG.
- **FR11:** The migration guide introduces zero new concepts the operator must learn (no new agent names, no new config keys, no new workflows).

### Extensions Compatibility Governance

- **FR12:** Convoke maintains `_bmad/_config/bmm-dependencies.csv` — a registry enumerating every Convoke-owned skill that extends a BMM agent.
- **FR13:** A committed scan tool regenerates `bmm-dependencies.csv` from the `.claude/skills/` filesystem as the canonical source of truth.
- **FR14:** `convoke-doctor` validates the BMM dependency registry as a standing health check and surfaces drift (new skills, removed skills, unregistered custom skills).
- **FR15:** `convoke-update` executes a post-upgrade regression gate against the BMM dependency registry before completing.
- **FR16:** The operator can register a custom skill that extends a BMM agent by adding a row to `bmm-dependencies.csv`.
- **FR17:** Convoke displays honest warnings for detected-but-unregistered custom skills — warnings are informational, not blocking.
- **FR18:** The recursive tooling validation (`bmad-enhance-initiatives-backlog` passing WS4 gate first) is enforced as the first validation target before any other dependency inventory work.

### Marketplace Distribution

- **FR19:** Convoke publishes a `.claude-plugin/marketplace.json` at the repo root that passes BMAD's PluginResolver validation.
- **FR20:** The marketplace entry references `_bmad/bme/_vortex/module.yaml` as the `module_definition`.
- **FR21:** A new user can install Convoke through the BMAD community module browser with no manual workarounds.
- **FR22:** Marketplace install produces the same Convoke state as standalone `convoke-install` (dual-distribution parity, validated by post-install filesystem diff).
- **FR23:** Convoke performs a runtime compatibility preflight check at install and upgrade time, protecting against the missing `bmad_version` field in the marketplace schema.
- **FR24:** Convoke is registered in `bmad-plugins-marketplace/registry/community/convoke.yaml` with `trust_tier: unverified` and valid `module_definition` metadata.
- **FR25:** Convoke supports three installation methods simultaneously: standalone CLI, BMAD marketplace, and direct git clone with manual install.

### Agent Consolidation Tracking

- **FR26:** `bmad-agent-qa`, `bmad-agent-sm`, and `bmad-agent-quick-flow-solo-dev` are removed from Convoke's bmm module installation (source tree + installed artifacts).
- **FR27:** Convoke integrates upstream Amelia (v6.3+) as the sole consolidated developer/QA/SM agent.
- **FR28:** Convoke's manifests (`skill-manifest.csv`, `files-manifest.csv`, `agent-manifest.csv`) reflect the consolidated Amelia lineup with no stale references.
- **FR29:** Convoke workflows with historical references to Bob/Quinn/Barry are updated to reference Amelia.
- **FR30:** Cross-reference grep confirms no remaining mentions of removed agents in any Bme (Vortex, Gyre, etc.) workflows.

### Release Discipline & Playbook

- **FR31:** Convoke delivers a `host_framework_sync` playbook artifact at a committed path as a 4.0 deliverable, signed off by Winston.
- **FR32:** The playbook documents release class definition, trigger criteria, workstream template, validation battery reference, and known-pitfalls in a reusable format.
- **FR33:** The operator runs three pre-registered experiments (EXP1, EXP2, EXP3) during Sprint 1 and logs go/no-go decisions for each.
- **FR34:** Each Sprint 1 experiment produces a documented "what this changed downstream" statement in the Sprint 1 artifact.
- **FR35:** A strategic bet ADR is created at a committed path containing decision, ≥2 alternatives considered, revalidation trigger, and link to the PRD.

### Validation & Behavioral Equivalence

- **FR36:** Convoke executes a pre-release agent behavioral equivalence validation battery (PF1) against representative inputs sampled from `_bmad-output/vortex-artifacts/`.
- **FR37:** The validation battery compares pre-migration and post-migration agent outputs within a numerically-defined drift threshold T (defined in architecture NFRs).
- **FR38:** A validation failure (drift beyond T on any input) blocks release progression.
- **FR39:** The operator can capture pre/post skill output drift snapshots for 2–3 key skills (e.g., `bmad-enhance-initiatives-backlog`, a Vortex stream output, a PRD draft output) as a retrospective observation artifact.
- **FR40:** An external non-maintainer user runs the upgrade on their own install and reports no issues before release. The external validation is logged in the release record.

### Release Communication

- **FR41:** Convoke's CHANGELOG contains the `mostHonestOneLineSummary` text verbatim and follows the section structure from Sophia's ship-ready draft.
- **FR42:** The CHANGELOG is grep-tested against the cliché list from `partyFindingsRound2.PR2-5` and contains zero violations.
- **FR43:** The PRD and derivative release documents distinguish `internalOnly` from `userFacing` vocabulary annotations; user-facing documents contain no phrases from the `internalOnly` list.
- **FR44:** The maintainer sign-off on the CHANGELOG is recorded in the release commit message.

### Quality Gates

- **FR45:** The IR gate (`bmad-check-implementation-readiness`) is executed against the architecture doc before any epic implementation story starts. Sprint 1 pre-registered experiments are exempted from this rule.
- **FR46:** The architecture doc exists at a committed path, defines drift threshold T numerically, and has passed the IR gate with a logged result.

### Retrospective & Learning

- **FR47:** A retrospective is scheduled in Sprint 0 with owner named, date committed, feedback process documented, and target backlog destination (`convoke-note-initiatives-backlog.md`) identified.
- **FR48:** The retrospective produces an updated `convoke-anti-patterns.md` registry capturing anti-patterns observed during 4.0 execution.
- **FR49:** The retrospective explicitly addresses each innovation hypothesis (I1, S1, S3, I3, I5, S2, L1) with an observation result or deferred-until-later note.
- **FR50:** Retrospective findings feed back into `convoke-note-initiatives-backlog.md` as new or updated items with traceable provenance.

## Non-Functional Requirements

*Only categories relevant to Convoke 4.0 are documented. Categories intentionally skipped: Scalability (single-user CLI tool, no concurrent user concerns), Accessibility (no visual UI, CLI tool), Payment/Financial Security (Convoke handles no financial data).*

### Performance

- **NFR1:** `convoke-update` completes end-to-end migration for a typical install in ≤60 seconds on a 2024-era laptop (measured baseline; drift from this triggers investigation).
- **NFR2:** The direct-YAML config loader utility (FR2) adds ≤50ms overhead per agent activation vs. the prior `bmad-init` flow.
- **NFR3:** The PF1 agent behavioral equivalence validation battery (FR36) executes in ≤15 minutes against the full representative input set.
- **NFR4:** The automated skill-dir audit script scans all `.claude/skills/` directories in ≤5 seconds on a typical install.
- **NFR5:** The `bmm-dependencies.csv` regeneration scan (FR13) completes in ≤10 seconds against the Convoke skill corpus.

### Reliability

- **NFR6:** The user migration script (FR7) is fully idempotent — re-running it after a successful run produces an empty filesystem diff (enforced by M4 test).
- **NFR7:** The user migration script supports **resume-after-failure** — if interrupted mid-migration, a subsequent run detects partial state and resumes without corrupting it (FR9).
- **NFR8:** `convoke-update` is offline-safe for the migration phase — does not require network connectivity to complete the direct-load migration itself (marketplace-related checks may require network; migration does not).
- **NFR9:** The post-upgrade regression gate (FR15) is fail-soft — a registry validation failure produces a warning and allows operator override, not a hard block (per PM3 honesty about validation limits).
- **NFR10:** `convoke-doctor` degrades gracefully when any module is missing — reports the missing module as a health finding rather than crashing.

### Integration

- **NFR11:** Convoke's `.claude-plugin/marketplace.json` conforms to BMAD's `registry-schema.yaml` for community modules — validated by BMAD's PluginResolver against the published schema.
- **NFR12:** Convoke's agent SKILL.md files conform to BMAD v6.3 skill directory convention (`<skill-dir>/SKILL.md` with v6.3 frontmatter schema).
- **NFR13:** Convoke's `_bmad/bme/_vortex/module.yaml` (or equivalent `module_definition` target) conforms to BMAD's expected module.yaml schema for PluginResolver discovery.
- **NFR14:** Convoke skills activate correctly against Claude Code's v6.3-compliant activation protocol — validated by smoke test on at least one agent per module (core, bmm, cis, tea, wds, bme).
- **NFR15:** Convoke adapts gracefully when installed *alongside* upstream BMAD (community module install path) — no file collisions, no shared-path conflicts.

### Maintainability

*This is a non-standard NFR category, included because maintainer sustainability is a named load-bearing concern in this release (PM2 / OP-1). Without it, a future maintainer will face unbounded complexity.*

- **NFR16:** The total cumulative lines of code added or modified by 4.0 (JS + Python + YAML + markdown, excluding frontmatter-heavy planning artifacts) is bounded by a target discussed in the architecture doc — overrun triggers scope deferral review per OP-1.
- **NFR17:** All migration-time decisions that require operator judgment (custom skill registration, deferral choices, etc.) are documented in a single operator-facing migration guide ≤1 page (FR10 / FR11).
- **NFR18:** The `host_framework_sync` playbook artifact (FR31) is self-contained — a future maintainer can execute a host_framework_sync release by reading only the playbook plus the current BMAD release notes, without needing to re-read this PRD.
- **NFR19:** All audit scripts (`audit-bmad-init-refs.js`, `audit-skill-dirs.js`, `audit-bmm-dependencies.js`) are placed under a single committed directory (e.g., `scripts/audit/`) with shared utilities for reuse.
- **NFR20:** The architecture doc defines drift threshold T numerically (not prose) so it can be automated and re-used without interpretation (FR46).

### Observability

- **NFR21:** The PF1 validation battery produces a machine-readable PASS/FAIL record per input, not just a summary pass/fail (supports future investigation of *which* inputs drifted).
- **NFR22:** The drift snapshot workflow (FR39) produces a semantic diff artifact that can be manually reviewed for unexpected behavioral changes.
- **NFR23:** The recursive tooling validation result (FR18) is logged as a distinct entry in the WS4 validation log — distinguishable from other dependency checks.
- **NFR24:** Sprint 1 experiment go/no-go decisions (FR34) are logged with timestamps and "what this changed downstream" paragraphs.
- **NFR25:** The retrospective (FR47) produces observation results for each innovation hypothesis (FR49) with distinct PASS / FAIL / DEFERRED status per hypothesis.

### Backwards Compatibility

- **NFR26:** Convoke 4.0 maintains a **one-minor-version backwards-compat window** for the old `bmad-init` config loading pattern — if a user is on 4.0 but has somehow retained an old config layout, the system warns and auto-migrates on next `convoke-update`.
- **NFR27:** The `bmad-init` skill is *deprecated* in 4.0.0, *warned* in 4.0.0 (info-level warning on activation), and *removed* no earlier than 4.1.0 with explicit deprecation date in the playbook artifact.
- **NFR28:** User-authored custom skills that were working in 3.2.0 continue to function in 4.0 as long as they are registered in `bmm-dependencies.csv` per FR16 — 4.0 does not silently break user customizations.
- **NFR29:** Convoke 4.0 accepts installation over a 3.2.0 install without requiring uninstall-then-reinstall — the migration path from any 3.x version is idempotent per NFR6.

### Reproducibility

*Quality-threshold counterpart to FR36–FR40. The FRs specify that validation happens; the NFRs specify how much drift is acceptable.*

- **NFR30:** Drift threshold T is defined numerically in the architecture NFR section. Agents producing outputs within T on the representative input battery are considered behaviorally equivalent.
- **NFR31:** The PF1 battery covers at least 5 representative inputs sampled from real `_bmad-output/vortex-artifacts/` data (minimum; Winston can expand per architecture decision).
- **NFR32:** The drift snapshot (FR39) produces deterministic output when re-run on the same inputs — the snapshot is reproducible.
- **NFR33:** The validation battery can be re-run post-release to detect regression if a user reports behavioral changes, using the same inputs and the same threshold T.
