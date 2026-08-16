---
initiative: convoke
artifact_type: playbook
qualifier: host-framework-sync
created: '2026-04-27'
schema_version: 1
outline_complete: false
winston_signoff_status: signed-off
---

# `host_framework_sync` Release Playbook

---

## (a) Release Class Definition

A `host_framework_sync` release is a **coordinated platform alignment release** in which Convoke adopts an upstream framework's new major version. Convoke's runtime, agent skills, and distribution mechanics are derived from BMAD METHOD (the upstream "host framework"); when BMAD ships a major version (v6.3 → v6.4 → v7.0 …), Convoke's downstream-of-BMAD positioning per [`adr-bmad-coupling-v4.0.md`](adr/adr-bmad-coupling-v4.0.md) requires a coordinated re-sync.

**What's in scope for a `host_framework_sync` release:**

- **Migration of existing user installs** from the prior Convoke version (BMAD-Nx-coupled) to the new Convoke version (BMAD-N+1-coupled). Filesystem-level migration is the primary user-facing surface.
- **Marketplace registration / re-registration** at upstream's plugin marketplace, if upstream introduced a new schema or contract for community modules.
- **Distribution channel parity** (npm + marketplace + platform-agnostic exporters) verified across all supported channels.
- **BMM / shared-config dependency-registry sweep** for any framework-level paths or conventions that changed upstream. The `bmm-dependencies.csv` registry is the surfacing mechanism; updates here gate `convoke-doctor`'s post-install validation.
- **Contract-parity validation** against the prior release: agents present, menu codes preserved, activation still loads config, and the packaged tarball installs and runs on a clean machine. See [§(d)](#d-validation-battery-reference) for the gates that enforce this.
  - **Not behavioural equivalence.** Convoke does not verify that an agent *responds* the same way across a framework upgrade, and makes no such claim. The PF1 behavioural-equivalence battery that earlier versions of this playbook scoped here was retired by [ADR-001](../_bmad-output/planning-artifacts/adr/v63/adr-001-retire-m9-pf1-gate.md); its scripts remain in `scripts/audit/pf1-*` but are not wired into CI and are not a release gate. Do not run them expecting a verdict.

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

Every `host_framework_sync` release must pass the gates below before publish. All of them run in
CI on every push, so "did we validate?" is answered by a green pipeline rather than by recollection.

**⚠ If you came here looking for the PF1 battery, it no longer exists.** Planning artifacts written
before 2026-08-13 describe a behavioural-equivalence battery with a numeric drift threshold *T* and a
5-agent × 4-prompt × 3-judge-run orchestration returning PASS / INVESTIGATE / FAIL. That instrument was
**retired by [ADR-001](../_bmad-output/planning-artifacts/adr/v63/adr-001-retire-m9-pf1-gate.md)**: M9 was
superseded, FR36–FR38 were superseded by FR38a, and the harness was never wired into CI. Its scripts
survive at `scripts/audit/pf1-*` and will run if invoked — they are not a gate and their output is not a
verdict. **Any reference to a drift threshold *T*, to M9, or to a 5×4×3 orchestration predates ADR-001
and is stale.** What follows is what actually runs.

### The gates

| Gate | What it proves | Where |
|---|---|---|
| **Agent surface parity** | The operator-facing contract is unchanged across two git refs: agents present, menu codes preserved, activation still loads config. 12 agents, seconds, no API key. | `scripts/audit/agent-surface-parity.js <base-ref> HEAD`, CI job `agent-surface-parity` |
| **Fresh install** | Packs *this tree* into a tarball, installs **that tarball** into a throwaway project, and runs what a new user runs. Catches packaging defects (`files` omissions, unresolvable bins, postinstall failures) that a repo-local test cannot. | CI job `fresh-install`, `scripts/audit/try-fresh-install.sh` |
| **Install-scope containment** | Migration and install writes stay inside Convoke-owned paths. | CI job step, `scripts/audit/install-scope-check.js` |
| **CLI guidance pinning** | The two operator-facing scripts emit no unpinned `npx -p convoke-agents <bin>`. An unpinned form resolves the `latest` dist-tag rather than the running build. | `tests/lib/fresh-install-health.test.js` |
| **Drift snapshots (FR39)** | Records agent-surface snapshots for later comparison. **Unaffected by ADR-001.** | Story 4.4, `scripts/audit/drift-snapshot.js` |
| **N=1 external validation (FR40 / M17)** | A non-maintainer completes the upgrade on their own machine, observed. The only gate that tests the experience rather than the contract. | Story 4.5 protocol + report |
| **Suites + lint** | `npm test`, `npm run test:integration`, `npm run lint`. | CI jobs `test`, `lint`, `coverage`, `burn-in` |

### What these gates do NOT prove

**Behavioural equivalence.** Surface parity proves the contract you interact with is unchanged —
which agents exist, what you can ask them to do, whether they still read your config. It does not
prove an agent *responds* the same way. Convoke makes no behavioural-equivalence claim, and the
retired instrument could not have proven one either. Do not let a green pipeline be described as
equivalence in release copy — that exact claim leaked into four shipped surfaces during 4.0 and had
to be corrected (see AP-1 and AP-7 in §(e)).

### How to invoke at the next release

Run the parity check against the last release tag, then let CI do the rest:

```bash
BASE=$(git describe --tags --abbrev=0 --match 'v*')
node scripts/audit/agent-surface-parity.js "$BASE" HEAD
```

Exit 0 with every agent listed means the contract held. Then push a `v*` tag: the `publish` job is
gated on eight jobs including `fresh-install`, and publishes with npm provenance. **Publishing by
hand bypasses all of it** — every 4.0 release candidate was hand-published and therefore ungated,
which is logged as T35. Recruit the N=1 validator in parallel; it has real lead time and is the only
gate that cannot be automated.

---

## (e) Known Pitfalls

Drawn from the Convoke 4.0 retrospective ([Story 5B.2](../_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-5b2-run-retrospective-and-create-anti-pattern-registry))
and the anti-pattern registry at [`convoke-anti-patterns.md`](../_bmad-output/planning-artifacts/convoke-anti-patterns.md).
Each line is a summary; the registry entry holds the counter-pattern and the evidence.

| # | Pitfall | Counter-pattern |
|---|---|---|
| **AP-1** | Marketing-as-fact in CHANGELOG entries | State what shipped and what it does not do. A claim you cannot point at a gate for is marketing |
| **AP-2** | CHANGELOG bullet duplication across versions | One entry per change, in the version that introduced it |
| **AP-3** | Round 1 patches introducing new HIGH-severity regressions | Remediation is unreviewed text; re-review it or disclose that you did not |
| **AP-4** | Spec-body drift after R1 patches | Amend the spec body when a review changes the plan, not only the task list |
| **AP-5** | Shell pipeline `$?` reads tail's exit, not the load-bearing command | `set -o pipefail`, or capture the exit code before piping |
| **AP-6** | Spec spot-check rubric too narrow to catch user-visible defects | Check the surface the operator sees, not just internal structure |
| **AP-7** | Overpromising shipped functionality by referencing unbuilt machinery | Reference only what exists at the ref you are shipping |
| **AP-8** | "First-class" and other unearned status inflation in user-facing prose | Delete the adjective; describe the behaviour |
| **AP-9** | Structural migrations leaving downstream test fixtures broken | Migrate fixtures in the same commit as the structure |
| **AP-10** | Test fragility via incidental substring match in CLI tests | Assert on behaviour and on values read at runtime, never on incidental phrasing |
| **AP-11** | Count drift in cross-spec progress narratives | Derive counts from source at write time; never restate a count from memory |

### Sprint 0 consultation checklist (I96, mandatory)

The registry's falsification clause is *"registry exists but is never consulted"*, and until this
checklist existed that clause rested on operator memory. **At Sprint 0 of any future
`host_framework_sync` release — before the first story is written — the release planner must:**

- [ ] Read [`convoke-anti-patterns.md`](../_bmad-output/planning-artifacts/convoke-anti-patterns.md) **end to end**. Not skim, not search.
- [ ] Cite every applicable entry in the release brief or Sprint 0 notes, by ID, with one line on how this release avoids it.
- [ ] When an entry recurs anyway, note the recurrence **inline in the registry entry** with the date and the release. A second occurrence is the signal that the counter-pattern is wrong, not that someone was careless.
- [ ] Add new entries at the release retrospective, and record here that consultation happened — a checklist nobody records is the same failure the clause describes.

---

## Winston Sign-Off

**Winston sign-off (Story 5A.2 + 5B.3 `host_framework_sync` playbook per FR45 + M13): 2026-08-16.**

Reviewed sections (a)–(e) and frontmatter. Signed after one structural correction: §(a) had scoped
**behavioural-equivalence validation (PF1)** as in-scope for the release class while §(d) recorded that
instrument as retired. A definition section that promises a gate the validation section says does not
exist is how a maintainer ends up running `scripts/audit/pf1-*` and treating the output as a verdict —
the AP-7 failure mode, inside the document that lists AP-7. §(a) now scopes contract parity and
disclaims equivalence explicitly.

Two observations left deliberately unaddressed, recorded so the next reviewer need not rediscover them:
the frontmatter key `outline_complete: false` reads backwards on a completed document (the load-bearing
key is `winston_signoff_status`, which is unambiguous), and §(b)'s three numbered trigger conditions map
onto a four-box operational checklist.

The section worth protecting is **§(d) "What these gates do NOT prove."** Most playbooks list what they
check; this one states its own limits and names the failure it prevents. Do not trim it for length.

---

## References

- **Strategic-bet ADR (this playbook's parent decision):** [`adr/adr-bmad-coupling-v4.0.md`](adr/adr-bmad-coupling-v4.0.md)
- **PRD (canonical source for FR31 + FR32 + M13 contracts):** [`../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/index.md`](../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/index.md) (sharded; entry point)
- **Innovation hypothesis I1 (playbook reusability target):** [`../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md`](../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md)
- **Sprint 1 experiments (empirical floor for the strategic bet):** [`../_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md`](../_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md)
