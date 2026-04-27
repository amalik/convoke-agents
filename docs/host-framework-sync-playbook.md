---
initiative: convoke
artifact_type: playbook
qualifier: host-framework-sync
created: '2026-04-27'
schema_version: 1
outline_complete: true
winston_signoff_status: pending
---

# `host_framework_sync` Release Playbook

> **STATUS: OUTLINE — INCOMPLETE**
>
> This playbook is an OUTLINE shipped via [Story 5A.2](../_bmad-output/implementation-artifacts/v63-5a-2-create-strategic-adr-and-playbook-outline.md) (Convoke 4.0 Sprint 1). Sections (a) Release Class Definition, (b) Trigger Criteria, and (c) Workstream Template Outline ship complete. **Sections (d) Validation Battery Reference and (e) Known Pitfalls + Winston sign-off are pending [Story 5B.3](../_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-5b3-complete-playbook-and-ship-release-artifacts) (Sprint 5 close).**
>
> **DO NOT use this outline alone as a release template.** Release execution requires the completed playbook. Future maintainers attempting `host_framework_sync v6.4+` adoption MUST verify `winston_signoff_status: signed-off` in frontmatter (and absence of `<!-- TODO-5B3-* -->` markers) before proceeding.

---

## (a) Release Class Definition

A `host_framework_sync` release is a **coordinated platform alignment release** in which Convoke adopts an upstream framework's new major version. Convoke's runtime, agent skills, and distribution mechanics are derived from BMAD METHOD (the upstream "host framework"); when BMAD ships a major version (v6.3 → v6.4 → v7.0 …), Convoke's downstream-of-BMAD positioning per [`adr-bmad-coupling-v4.0.md`](adr/adr-bmad-coupling-v4.0.md) requires a coordinated re-sync.

**What's in scope for a `host_framework_sync` release:**

- **Migration of existing user installs** from the prior Convoke version (BMAD-Nx-coupled) to the new Convoke version (BMAD-N+1-coupled). Filesystem-level migration is the primary user-facing surface.
- **Marketplace registration / re-registration** at upstream's plugin marketplace, if upstream introduced a new schema or contract for community modules.
- **Distribution channel parity** (npm + marketplace + platform-agnostic exporters) verified across all supported channels.
- **BMM / shared-config dependency-registry sweep** for any framework-level paths or conventions that changed upstream. The `bmm-dependencies.csv` registry is the surfacing mechanism; updates here gate `convoke-doctor`'s post-install validation.
- **Behavioral-equivalence validation** against the prior release on a representative sample of agent skills (PF1 validation cycle), to confirm that the framework upgrade did not introduce regressions in operator-observable agent behavior.

**What's NOT in scope for a `host_framework_sync` release:**

- Net-new Convoke features (new agents, new workflows, new skills) unrelated to the framework alignment. Those land in feature releases (e.g., 4.1, 4.2 minor releases between `host_framework_sync` events).
- Changes to Convoke's strategic posture toward BMAD coupling. Those revisions live in follow-on ADRs (`adr-bmad-coupling-v4.x.md`) per [Revalidation Trigger](adr/adr-bmad-coupling-v4.0.md#revalidation-trigger). The playbook executes the strategic bet; it does not re-bet.

**Why this is a named, reusable release class.** Per innovation hypothesis I1 (PRD `innovation-novel-patterns.md:11-30`), naming this release class makes it template-reusable: future BMAD major revs apply the playbook structure (this document) instead of reinventing the release plan from scratch. The hypothesis target is **≥50% content reuse** at v6.4, v7.0, and beyond.

---

## (b) Trigger Criteria

A release qualifies as `host_framework_sync` when **one or more** of the following conditions is met (typically all three at once):

1. **BMAD upstream major-version release.** A new BMAD major version drops (e.g., v6.4, v7.0). This is the canonical trigger.
2. **Shared-infrastructure change.** Upstream changes affect Convoke's runtime contracts — config-loader format, skill-format spec, install-path conventions, BMM module structure, or `_bmad/_config/` schema. Detected via `convoke-doctor` BMM-dependency check + `bmm-dependencies.csv` diff.
3. **Marketplace contract change.** Upstream changes the plugin marketplace's `registry-schema.yaml`, PluginResolver behavior, or community-tier requirements in ways that require Convoke's `convoke.yaml` registry entry to be re-authored or re-validated.

**Operational checklist (use this at trigger evaluation time):**

- [ ] Has BMAD shipped a new major version? (`semver` major-bump on `bmad-method` npm package OR upstream repo.)
- [ ] Does `convoke-doctor` BMM-dependency check report any changes vs the previous Convoke release?
- [ ] Does `validate-marketplace` report schema drift vs upstream `registry/registry-schema.yaml`?
- [ ] Are there breaking changes to canonical agent skill format (SKILL.md structure, slash-command activation, frontmatter contract)?

If **≥2 boxes ticked**, this is a `host_framework_sync` release. If only **box 1** ticked AND boxes 2 + 3 + 4 are unticked (no shared-infra change, no marketplace contract change, no skill-format break), the release may be a minor `host_framework_track` (Convoke's prior version stays compatible; ship as a feature release with version-bump only).

**Anti-vapor anchor (per PM5).** A release is not `host_framework_sync` because someone says it is — it qualifies because the trigger criteria above objectively apply. Conversely, a release that meets the criteria IS `host_framework_sync` even if maintainer bandwidth tempts skipping the playbook.

**Cross-reference.** The ADR's [Revalidation Trigger](adr/adr-bmad-coupling-v4.0.md#revalidation-trigger) names the *strategic-bet* revalidation conditions (which include but are not limited to upstream major releases). The Trigger Criteria here are *release-class-classification* criteria — narrower scope: "is this release a `host_framework_sync` event?" The two layers complement each other; both are evaluated at upstream-rev time.

---

## (c) Workstream Template Outline

> **The 5 workstreams below (WS1 / WS2 / WS3 / WS4 / WS5) are WORKED EXAMPLES from Convoke 4.0's actual structure** (BMAD v6.3 adoption). **Future releases will define their own workstreams based on what changed upstream.** Use this as a pattern-template:
> 1. Identify what changed upstream (using Trigger Criteria from Section (b)).
> 2. Map each change to a workstream.
> 3. For each workstream, define **purpose** + **2-3 template-tasks**.
>
> The pattern (Purpose + Template Tasks structure) is reusable; the workstream NAMES below are NOT — they're specific to BMAD v6.3 → v6.4-or-later transitions; v7.0 will have different workstreams.

### WS1 — Migration

**Purpose.** Move existing Convoke installs from the prior framework version to the new one with empty filesystem diff per controlled fixture. The migration script is the primary user-facing surface during upgrade — its safety properties are load-bearing.

**Template tasks:**
- Draft migration script per phase-pattern (Detect → Verify configs → Sweep targets → Deprecate prior surfaces → Doctor diff).
- Test on sandbox fixture(s) per `test-fixture-isolation` rule — verify byte-identical preservation of pre-section content.
- Register migration in `scripts/update/migrations/registry.js` (append-only); add parallel chain entries if version-pattern constraints force multiple registry rows.

### WS2 — Marketplace

**Purpose.** Maintain Convoke's presence in the upstream plugin marketplace, registering or re-registering with the new framework version's contract. This is Convoke's primary external distribution channel beyond npm.

**Template tasks:**
- Author or update `convoke.yaml` registry-submission file to match upstream `registry/registry-schema.yaml`.
- Open PR against upstream marketplace repo (`bmad-plugins-marketplace`); pass PluginResolver validation OR document Path-C manual schema-match per OP-4.
- Capture PR open + validation evidence in story-level artifacts (PR link, validation log, M12a status).

### WS3 — Distribution

**Purpose.** Verify Convoke installs cleanly across all supported distribution channels (npm + marketplace + platform-agnostic exporters → Claude Code + Copilot + Cursor adapters). Distribution-channel parity is the operationalization of "ships everywhere, starting with the BMAD marketplace."

**Template tasks:**
- Test fresh `npm install` of new Convoke version on a clean sandbox.
- Test marketplace install path simulation (PluginResolver-equivalent) — verify file-set parity vs npm install.
- Run platform-agnostic exporter on a representative skill batch; verify all adapters generate cleanly (no framework leaks; ready-to-drop format).

### WS4 — Dependencies

**Purpose.** Sweep the BMM (or upstream-equivalent) dependency registry for any changes affecting Convoke. Updates to `bmm-dependencies.csv` (or successor) are the surfacing mechanism for "silent breakage becomes visible." `convoke-doctor` consumes the registry at install time.

**Template tasks:**
- Run audit script (`audit-bmm-dependencies.js` or successor) against the new framework version.
- Diff results vs prior Convoke release; classify changes (added / removed / renamed / behavior-changed dependencies).
- Update `bmm-dependencies.csv` registry; verify `convoke-doctor` BMM-dependency check passes against the new state.

### WS5 — Release Discipline

**Purpose.** Ship the release with the full release-discipline machinery (Sprint 1 experiments + ADR + playbook + CHANGELOG + N=1 validation + retrospective + anti-pattern registry update). This is the "release process is content, not software" workstream — it ensures every `host_framework_sync` release leaves behind a verifiable trail of decisions.

**Template tasks:**
- Run pre-registered Sprint 1 experiments at the new upstream version; log go/no-go decisions + downstream-impact statements (FR33+FR34+M5).
- Update or supersede the strategic-bet ADR (`adr-bmad-coupling-v4.x.md`) per ADR's [Revalidation Trigger](adr/adr-bmad-coupling-v4.0.md#revalidation-trigger).
- Author CHANGELOG with `mostHonestOneLineSummary` + Sophia section order + grep-tested cliché violations zero (FR41-FR44+M16); run N=1 external user validation (FR40+M17); run retrospective + update anti-pattern registry (FR47-FR49+NFR25).

---

## (d) Validation Battery Reference

<!-- TODO-5B3-SECTION-D: Validation Battery Reference -->

**Pending [Story 5B.3](../_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-5b3-complete-playbook-and-ship-release-artifacts) (Sprint 5 close).** Will cite Story 4.3 PF1 validation cycle ([`v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md`](../_bmad-output/implementation-artifacts/v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md)) + Story 4.4 drift snapshot ([`v63-4-4-create-drift-snapshot-workflow.md`](../_bmad-output/implementation-artifacts/v63-4-4-create-drift-snapshot-workflow.md)) as the validation infrastructure for behavioral equivalence at each `host_framework_sync` release. Includes drift threshold T (numeric, NFR30), 5-agent × 4-prompt × 3-judge-runs orchestration, and PASS/INVESTIGATE/FAIL gate semantics per [`convoke-arch-bmad-v6.3-adoption.md:362-368`](../_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md).

---

## (e) Known Pitfalls

<!-- TODO-5B3-SECTION-E: Known Pitfalls -->

**Pending [Story 5B.3](../_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-5b3-complete-playbook-and-ship-release-artifacts) (Sprint 5 close).** Will be populated from Convoke 4.0 retrospective in [Story 5B.2](../_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-5b2-run-retrospective-and-create-anti-pattern-registry). Anticipated lessons learned to surface (will refine post-retro):

- Registry-pattern constraint discovery (Story 1A.4 — migration name `3.x` invalid; required parallel entries `3.0.x-to-4.0.0` / `3.1.x-to-4.0.0` / `3.2.x-to-4.0.0` thin wrappers for full chain coverage).
- Path-C marketplace submission precedent (Story 3.3 — upstream had no community-tier CI at submission time; manual schema-match closed M12a per OP-4 framing).
- PF1 release-time deferral (Story 4.3 — release-time activity requires real 4.0 candidate; spec stays ready-for-dev until precondition met).
- v6.3 retrospective findings (Story 5B.2 outputs — anti-pattern registry entries).

---

## Winston Sign-Off

<!-- TODO-5B3-SIGNOFF: Winston sign-off -->

**Winston sign-off:** PENDING ([Story 5B.3](../_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-5b3-complete-playbook-and-ship-release-artifacts) close).

**Hand-off contract for Story 5B.3 author.** Run `grep -r "TODO-5B3" docs/` to surface all 3 pending blocks (sections d + e + sign-off). Complete each with the substantive content described above. Update frontmatter: `outline_complete: false` (full playbook, not outline) AND `winston_signoff_status: signed-off`. Remove the STATUS preamble at top + this sign-off pending notice once playbook is complete and signed.

---

## References

- **Strategic-bet ADR (this playbook's parent decision):** [`adr/adr-bmad-coupling-v4.0.md`](adr/adr-bmad-coupling-v4.0.md)
- **PRD (canonical source for FR31 + FR32 + M13 contracts):** [`../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/index.md`](../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/index.md) (sharded; entry point)
- **Innovation hypothesis I1 (playbook reusability target):** [`../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md`](../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md)
- **Sprint 1 experiments (empirical floor for the strategic bet):** [`../_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md`](../_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md)
