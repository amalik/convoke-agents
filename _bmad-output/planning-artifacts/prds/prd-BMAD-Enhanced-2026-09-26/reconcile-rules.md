---
title: 'Channel Integrity — input reconciliation against binding rules'
initiative: convoke
artifact_type: report
qualifier: channel-integrity-rule-reconciliation
status: draft
created: '2026-09-26'
schema_version: 1
---

# Channel Integrity PRD — reconciliation against the project's binding rules

**Subject.** `_bmad-output/planning-artifacts/prds/prd-BMAD-Enhanced-2026-09-26/prd.md`
(draft, 2026-09-26) and its `addendum.md`.

**Bases read in full.** `project-context.md` (839 lines, 28 rule headings),
`_bmad/bme/covenant/covenant-operator.md`, `_bmad/bme/covenant/compliance-checklist.md`.

**Bases derived by execution** (not recalled), because the reconciliation turns on whether a
mechanism already exists:

```bash
grep -n '^## Rule:\|^## [a-z-]*$' project-context.md            # 28 rule headings
head -12 _bmad/bme/_config/name-registry.csv                     # kinds: team, agent only
grep -c '^agent,' _bmad/bme/_config/name-registry.csv            # 12 agent rows
sed -n '206,232p' .github/workflows/ci.yml                       # name-registry gate + its .claude/skills ruling
sed -n '245,263p' .github/workflows/ci.yml                        # refs:audit gate + exemption model
grep -n 'standalone' scripts/update/lib/refresh-installation.js   # :952 standalone->wrapper generation
grep -n '_vortex/agents' .claude-plugin/marketplace.json          # exactly 7 declared paths
sed -n '58,74p' .gitignore                                        # 2 whitelisted skills under .claude/skills/
find . -name SKILL.md -not -path './node_modules/*' | wc -l       # 258
```

**Count: 20 collisions.** Eleven are collisions with a rule as written; nine are rules the plan
silently assumes away (the rule is never named and its obligation is unbudgeted). Both classes are
registered below; the register at the end gives the roll-up.

---

## Part 1 — Rule by rule

### 1. `namespace-decision-for-new-skills` — COLLIDES (C8)

> **Statement.** Every new skill or workflow story must include a "Namespace decision" section in
> its spec, explaining whether the skill lives under Convoke's `_bmad/bme/` namespace or upstream
> BMAD's namespace, and why. […] If the choice isn't obvious (mixed-namespace work, refactoring
> that crosses the boundary), escalate to the user before coding.

PRD, F4:

> **FR14.** Each workflow can be invoked by name without first activating an agent.
> **FR15.** Each handoff contract is a named, addressable artifact.

Against the PRD's own measured position — 30 workflows, 14 contracts, plus FR13's four Gyre
agents — F4 spawns **≥ 48 new addressable units**, each of which is "a new skill or workflow" and
therefore each of which owes a Namespace decision section. The PRD contains the word "namespace"
nowhere. Two consequences:

- **The obligation is per-unit and not batchable.** 48 stories × a Namespace decision section is
  not a line item the PRD budgets, and NFR2's budget ("one ADR, one name registry, one doctor
  check, hard budget") cannot absorb it.
- **FR3 is mixed-namespace by construction and therefore owes an escalation *before* coding.**
  FR3 targets the 38 `SKILL.md` that "carry verbatim upstream names". Marking an upstream-named
  artifact is exactly the rule's "refactoring that crosses the boundary" trigger. The PRD schedules
  no escalation.

**FR16 is a namespace question wearing naming clothes:**

> **FR16.** Every skill name is allocated from a single registry, and no two skills — Convoke's or
> an upstream skill Convoke ships alongside — claim the same name.

"an upstream skill Convoke ships alongside" is the boundary this rule exists to keep clean. FR16
cannot be specified without first ruling which side of `_bmad/bme/` those 38 names sit on.

### 2. `covenant-compliance-for-convoke-skills` — COLLIDES (C9)

> **Statement.** Before authoring a new skill, workflow, or agent under `_bmad/bme/` […] the author
> must read [the Covenant] and self-check the deliverable against the [Compliance Checklist] before
> marking the story ready-for-review.
>
> **How to apply.** […] satisfy the Checklist's OC-R0 enumeration precondition first (record the
> full 3-layer interaction surface — workflow.md + all step files + all invoked scripts/CLIs), then
> work through OC-R1 through OC-R7 […]. Cells answered against an incompletely-enumerated surface
> are invalid per OC-R0.

F4's ≥ 48 units all land under `_bmad/bme/`. At OC-R0 + 7 cells each that is **≥ 384 cells**.
For scale, the Covenant's own §8 records the entire baseline audit as *"eight Convoke skills […] 46
of 56 cells (82%) pass."* F4 would multiply Convoke's audited Covenant surface by roughly seven,
inside an initiative whose NFR2 declares a hard budget of three deliverables.

**Sharper than cost: two of F4's FRs create a unit class the Checklist has no PASS shape for.**

> **FR15.** Each handoff contract is a named, addressable artifact.
> **FR17.** A skill that is metadata or scaffolding rather than a capability is distinguishable from
> one an operator should invoke.

A handoff contract has no prompts, no decision points and no errors. Under the Checklist it can only
be scored `N/A — out-of-scope (<reason>)`, which the Checklist defines as *"The entire skill is
declared out-of-scope for this audit (e.g., headless automation, non-operator-facing build tool).
Typically applied at skill level once; all 7 rules then get the same `out-of-scope` answer."*
Publishing 14 such units means 14 skills that are Covenant-exempt by declaration. That may be the
right answer, but the PRD must say it, because the alternative reading — 14 skills with 98 blank
cells — is a FAIL: *"Blank cells = FAIL (incomplete audit); parsers MUST emit a warning and treat as
FAIL."*

### 3. `slash-command-ux-for-user-facing-tools` — COLLIDES (C14)

> **Statement.** Any user-facing tool must be exposed as a BMAD slash-command skill, not as a bare
> CLI script. CLI scripts are an implementation detail, not a user interface.
>
> **How to apply.** […] the story's deliverables must include a slash-command skill that wraps the
> underlying script. If you find yourself writing CLI-only documentation, you've missed a layer.

Four PRD requirements are CLI-only as written, and none names a wrapping skill:

> **FR2.** Every reachable set is derivable by a command that a reader can run, and the command is
> the source of any figure quoted about it.
> **FR7.** On detecting absence, the skill names the missing component and states the exact command
> that obtains it.
> **FR19.** An operator with no BMAD receives the complete module, configuration included, and is
> not required to obtain it from a second channel.
> **FR21.** An operator can tell, before installing, which parts of Convoke a given channel path
> will and will not deliver.

FR7's and FR19's case has a genuine exemption available — pre-install there is no Convoke runtime, so
a slash command is unavailable by construction and the CLI *is* the interface. **The PRD does not
state it**, which is the defect: a dev agent reading FR7 and the rule together has no way to tell
whether it is exempt or in violation. FR21 has no such excuse — "an operator can tell, before
installing" is a lookup tool with no named surface, and per the rule it owes a skill (post-install,
at minimum) rather than a script. FR2's "a command that a reader can run" is CLI documentation by
definition, and the rule's closing sentence fires on it verbatim.

**Required phrasing.** Add one clause to F2/F5 naming the exemption and its boundary: *pre-runtime
surfaces are CLI by necessity; every post-install equivalent is reachable as a slash-command skill.*

### 4. `path-safety-for-destructive-ops` — SILENTLY ASSUMED AWAY (C19)

> **Statement.** Any script that accepts a user-provided path and performs destructive operations
> (delete, overwrite, cleanup) must include a safety analysis in its spec and refuse to operate on
> paths outside the project root.
>
> **How to apply.** […] 1. A `resolve + normalize + contains-check` against the project root.
> 2. An explicit refusal path for `/`, `$HOME`, and any path that isn't under the project root.

Two exposures, and the second is structural rather than an omission.

**(a) Option S3 needs a safety analysis the PRD does not require.** Addendum §4:

> **S3 — two artifacts, one source.** `_bmad/bme/` stays the authoring source; a build step emits
> the channel tree. Serves both segments. Cost: a generator, and a drift gate between source and
> artifact.

A generator that "emits the channel tree" overwrites and cleans a directory. If S3 is chosen, the
rule binds at story-authoring time and the PRD carries no requirement that makes it visible.

**(b) FR11 removes the anchor the rule mandates.**

> **FR11.** Under an install where the skill root is not inside the operator's project — a plugin
> cache, a global skills directory — a Convoke skill either resolves its references correctly or
> fails per FR6–FR9.

The rule's prescribed mechanism is a contains-check **against the project root**. FR11's install
topology is defined by the project root not containing the skill. Any cleanup or overwrite in that
topology therefore has no anchor the rule recognises, and `$HOME` — which the rule names as a
must-refuse — is the *parent* of `~/.claude/plugins/cache/`. The PRD must either exclude destructive
operations from the FR11 topology or name a second containment root for it.

### 5. `test-fixture-isolation` — COLLIDES (C1, C18)

> **Statement.** Tests that invoke a CLI script via `runScript(...)` or scan the project tree via
> `findProjectRoot()` / `runAudit()` / similar **must** run against an isolated fixture directory,
> never against `PACKAGE_ROOT`.
>
> **Assertions.** Assert on *behavior* […] never on *counts* against live state
> (`findings.length === 0`, "all 7 agents mentioned") unless the fixture itself *guarantees* the count.

**C1 — FR4 cannot be built where the PRD implies, and cannot compute what it claims. This is the
document's hardest collision; it is treated in full under Part 4.**

> **FR4.** A check fails CI when the reachable set diverges from the declared set.

Two layers. First, placement: FR4 and FR12 must read the live tree, so they cannot live in `tests/`.
Every sibling already resolves this the same way — `scripts/audit/name-registry-integrity.js` states
it in its own header: *"Why an audit script rather than a test: it reads the LIVE tree on purpose.
Asserting that the registry agrees with reality is its whole job, so `test-fixture-isolation` would
forbid it in `tests/`."* The PRD does not say where FR4 and FR12 live, so a dev agent can put either
in `tests/` and violate the rule while satisfying the FR.

Second, and worse — see Part 4 — **the reachable set is not computable in CI at all.**

**C18 — FR3 mutates 38 committed test fixtures.**

> **FR3.** Every `SKILL.md` in the repository that is not a product skill is marked such that no
> documented channel path offers it for installation.

The rule's one exception, `committed-artifact-integrity`, carries four conditions, of which #1 is
*"Assert only about the artifact. The moment the test asserts on the behaviour of code, the exception
is gone"* and #4 is *"Accept that new data makes it red until the data is complete."* FR3 edits
frontmatter on 38 fixtures whose purpose is to be fixture data. Any suite that reads those fixtures'
frontmatter — and `derived-assertions.js`, `audit-skill-dirs.js` and `skill-manifest-integrity.js`
are all candidates — is a consumer the PRD does not enumerate. Per `code-review-convergence`'s
consumer-audit clause this is a whole-repository enumeration owed before FR3 closes, not a diff review.

### 6. `fixture-determinism` — COLLIDES (C1)

> **Statement.** A test must not assert on anything it does not control. If the asserted value can
> change without the code under test changing, the test is a clock, a race, or a census — not a test.
>
> - **Ambient environment** — inherited env vars, global config, the developer's own `git` settings.

FR4's "reachable set" is an ambient-environment value. Derived 2026-09-26: the tree holds **258**
`SKILL.md`; `.gitignore:62-71` whitelists exactly **two** under `.claude/skills/`
(`bmad-audit-skill-dirs`, `bmad-register-skill`). A dev tree and a fresh CI checkout therefore
disagree about the reachable set by ~256 entries, and nothing in the code under test changed. That is
the rule's fourth axis exactly, and the rule's own evidence table already carries this shape:

> | `02cb6d72` | live repo census | failed on corpus **growth**, not regression | `derive-counts-from-source` |

The addendum makes the dependence explicit and does not draw the conclusion:

> **A recursive fallback exists, conditionally.** […] Convoke has two tracked `SKILL.md` under
> `.claude/skills/` (whitelisted at `.gitignore:66-71`), so the fallback does not fire today. **It is
> one `.gitignore` change away from firing.**

A requirement whose satisfaction is one `.gitignore` line from inverting is pinned to an ambient
input. FR4 must name its enumeration basis (`git ls-files`, or the tarball, or `npm pack`) rather
than "the reachable set".

### 7. `no-hardcoded-versions` — COLLIDES (C13)

> **Statement.** Never hardcode version strings in source code. Always read via
> `getPackageVersion()` from `scripts/update/lib/utils.js`.
>
> **Why.** […] Hardcoded versions rot silently and cause update logic to compare against stale values.

> **FR20.** Every published artifact declares which upstream BMAD versions it is compatible with,
> and that declaration is checkable.

`getPackageVersion()` does not answer FR20 — FR20's subject is *upstream's* version, not Convoke's, so
the named helper is unavailable and the rule's "how to apply" does not reach it. The rule's *why*
reaches it completely. With F4's ≥ 48 published units, "every published artifact declares" is ≥ 48
upstream version strings, and NFR1 guarantees they rot on a schedule:

> **NFR1 — Cadence.** Convoke tracks upstream at N-1, four to six weeks behind.

A compatibility range restated 48 times and revised every four to six weeks is the rot this rule
names, with a clock attached. **Required phrasing:** one declaration point, read by the ≥ 48 artifacts
(or generated into them), with the check asserting the *single* source — the same shape
`getPackageVersion()` has for Convoke's own version.

### 8. `derive-counts-from-source` — COLLIDES (C10)

> **Statement.** Tests and deliverables that assert or report counts (number of agents, skills,
> findings, taxonomy entries, etc.) must derive those counts from the authoritative source data at
> runtime — never hardcode them.
>
> - In deliverables (audit tables, coverage reports): generate counts programmatically from the
>   data, not by hand-counting table rows.

The PRD is a deliverable that reports counts, and **it collides with its own FR2 and NFR5 as well as
with this rule.** Its own text:

> **FR2.** Every reachable set is derivable by a command that a reader can run, **and the command is
> the source of any figure quoted about it.**
> **NFR5 — Derivation.** Any figure in a shipped document carries the command that produces it.

Against that, the PRD's Measured position table and Success metrics carry **eleven** hardcoded
figures — 11, 7, 30, 23, 7, 14, 7, 9, 2, 38, 0 — and **not one command**. The preamble asserts the
derivation without recording it:

> every figure was produced by execution on 2026-09-26, and mechanism claims carry their primary
> source in `addendum.md`.

`addendum.md` carries primary sources for *external mechanism* claims (which is correct and well done)
and no command for any internal count. So SM2's "7 of 11 → 11 of 11", SM3's "0 of 30", SM4's "0 of
14" and SM6's "38 → zero" are hand-counted denominators in a document that requires the opposite.
SM6 is additionally a census: the fixture corpus grows, so "38" is stale on the next fixture added,
and the metric reads as regression when it is growth.

**This is the one finding that is cheap and total to fix**, and per `documentation-claims-must-be-derived`
it is the higher-yield pass on this document, not a lighter one:

> **For a documentation change, verifying the assertions substitutes for reviewing the diff.** It is
> the higher-yield pass, not a lighter one.

### 9. `shared-test-constants` — SILENTLY ASSUMED AWAY (C12)

> **Statement.** Test suites that validate the same invariants (forbidden strings, expected patterns,
> canonical IDs) must import from shared constant files — not duplicate the lists inline.

FR1, FR4 and FR12 all need the same three lists: the container-directory set, the shipped-skill glob
set, and the not-a-product-skill predicate. FR1 says "declared in one place in the repository" —
which is the rule's answer — but FR4 and FR12 are separate checks and the PRD does not say they read
FR1's declaration rather than carrying their own copies. The repository already has the scar, recorded
in `name-registry-integrity.js`:

> Named for its DOMAIN, not just "tiers": this column carries OWNERSHIP. Unprefixed, it collided with
> the portability classification vocabulary declared under the same identifier two files away in
> `skill-manifest-integrity.js` — an entirely different value set.

**Required phrasing.** FR4 and FR12 assert *against FR1's declaration*, by import, and FR1 names the
file.

### 10. `documentation-claims-must-be-derived` — COLLIDES (C11, C20)

> **Statement.** Any sentence in project documentation that asserts something about **this
> repository's own behaviour** — a command, a CI gate, a threshold, a convention, a policy — must be
> derived from the source that determines it, at the time of writing. […] **A policy that does not
> exist yet is a proposal, not a fact, and must not be written in the indicative.**

The FR section is protected by the PRD's own banner (*"Status: draft — Discovery in progress. Nothing
below is a requirement yet."*) — that disclosure is correct and it discharges the indicative-mood
problem for FR1–FR24. Two claims sit **outside** that banner's protection because they assert
existing policy.

**C11 — NFR2 asserts an available budget that is already spent.**

> **NFR2 — Budget.** The ratified baseline binds: one ADR, one name registry, one doctor check, hard
> budget.

All three deliverables shipped. Derived at HEAD:

```bash
head -12 _bmad/bme/_config/name-registry.csv      # the name registry — exists, 26 rows
sed -n '206,232p' .github/workflows/ci.yml         # the check — wired, line 231
ls _bmad-output/planning-artifacts/adr/meta-model/ # adr-001-provenance-and-vocabulary.md
```

And the ADR itself records the delivery in the past tense:

> **Positive.** The provenance axis exists for the first time, and it is checkable rather than
> conventional. […] Deliverable 3 gains a fourth assertion. **Three deliverables, no epic, budget
> held.**

NFR2 reads to a dev agent as "you may spend one ADR, one registry and one check." The truth is that
the allowance was consumed by T124 and the meta-model ADR, so the correct reading is **zero new ADRs,
zero new registries, zero new doctor checks** unless the baseline is re-ratified. Since FR15 needs an
ADR-004 amendment (Part 4) and FR16 needs a registry extension, NFR2 as written mis-prices the whole
plan. **Required phrasing:** state what the baseline already spent, and say explicitly whether
Channel Integrity is inside the spent baseline or a re-ratification.

**C20 — FR22 and NFR5 restate two existing rules as new requirements.**

> **FR22.** Statements about Convoke's distribution in operator-facing documents are derived from the
> repository at the stated version, never asserted from memory.

That is this rule, verbatim in substance. NFR5 is `derive-counts-from-source` plus this rule's
operational check. Re-declaring a binding rule as an FR creates a second source of truth for one
obligation, and the rule the PRD is restating is the one that says *"If the ratified rule binds
contributors or agents, it belongs in this file, not only in prose docs."* **Required phrasing:** cite
`project-context.md` by rule name instead of re-legislating, or carry an FR only for the part that is
new (the *channel*-specific claims).

### 11. `generic-agents-specific-knowledge` — see Part 3 (C16)

### 12. `team-state-directories` — COLLIDES (C7)

> **Statement.** A Convoke team that keeps state between runs owns **`.<team>/` at the project
> root** — its own, never another team's. […] Every file the state directory can hold carries a
> declared VCS treatment, and **the declaration is implemented in `.gitignore`.**
>
> The test is whether a **workflow branches on a project-root state file**. Gyre passes it
> explicitly: [`full-analysis/steps/step-01-initialize.md:34`] routes to **Anticipation** mode and
> skips model generation when `.gyre/capabilities.yaml` exists.

Set against:

> **FR11.** Under an install where the skill root is not inside the operator's project — a plugin
> cache, a global skills directory — a Convoke skill either resolves its references correctly or
> fails per FR6–FR9.
> **FR13.** All 11 agents across both teams exist in the repository as skills.
> **FR14.** Each workflow can be invoked by name without first activating an agent.

FR14 makes all 30 workflows addressable; seven of them are Gyre's, and `full-analysis` is the one that
branches on `.gyre/capabilities.yaml`. Under FR11's topology **"the project root" is not derivable
from the skill's position**, so that branch has three possible outcomes and the PRD selects none:

1. It resolves `.gyre/` against the plugin cache, finds nothing, and silently re-runs model
   generation — a wrong answer with no error, which is FR9's own prohibition turned inward.
2. It writes state into `~/.claude/plugins/cache/…/.gyre/`, where the rule's absolute *"`.<team>/` at
   the project root"* is violated and the directory is shared across every project the operator opens.
3. It fails per FR6–FR9 — which makes FR14 unsatisfiable for Gyre's seven workflows in the topology
   FR11 exists to support.

The rule's own worked evidence shows the third-party hazard is real, not hypothetical: `.gyre/.lock`
*"would have been cloned into every fresh checkout, where [step-01] warns on any lock older than five
minutes."* In a shared plugin cache the same lock is shared across projects concurrently.

Second, narrower point: the rule requires that every state file's VCS treatment be *implemented in
`.gitignore`*, and FR19 promises "the complete module, configuration included". Whether `.gyre/`
travels in that bundle is a treatment decision, and *"A treatment stated only in an architecture
document or a PRD is not a treatment."*

**Required phrasing.** FR11 must name how project root is resolved when the skill root is outside it,
and F4 must either scope Gyre's stateful workflows out of the addressable set or carry the resolution
rule as its own requirement.

### 13. `backlog-write-discipline` — SILENTLY ASSUMED AWAY (C17)

> **Statement.** The lifecycle backlog's three lanes are sorted **at all times** […] Any writer who
> adds a lane row, edits a score, or flips a status is responsible for restoring that order **in the
> same edit** — whether or not the write went through `bmad-enhance-initiatives-backlog`.
>
> **Before emitting a commit plan that touches the backlog.** Run the check below and paste its
> result into the commit Description. It costs one command.

The PRD's Discovery produced six defects and three open questions and files none of them. Two of
the three OQs are backlog-shaped (OQ-2 is a verifiable claim about an external system; OQ-3 is an
operator decision), and defect 0's three live residues — *"name-shadowing class, no self-serve
retraction, and a conditional recursive fallback one `.gitignore` change away from firing"* — are
three separate rows with three different decay rates. Per the qualification-time arm of
`staleness-preflight-for-backlog-pickup`: *"Prefer filing instance and gate as separate rows — they
decay at different rates."*

**A second, concrete defect in the PRD's one backlog citation.**

> **FR12.** A check fails CI on any bare cross-directory path in a shipped skill. *(This is T214's
> class, extended past config references to capability references.)*

T214 is **closed** — it sits in `convoke-note-backlog-completed-archive.md:622`, shipped 2026-09-26,
score 6.0 — and its own closing entry states the boundary FR12 inherits:

> **Check 2 no longer normalises the `{project-root}/` prefix away before comparing: every occurrence
> of a module's config tail in an activation block must carry it.** It does NOT guarantee the agent
> loads its config from the project root — a load step that spells no full path is invisible to the
> check, **which is T138.**

So: T214's scope was *activation-block config-tail spelling*. FR12's scope is *any bare
cross-directory path in a shipped skill*. That is not an extension of T214's class, it is a different
class an order of magnitude wider, and **the open row that owns the residue is T138, which the PRD
does not cite.** T138 also carries a standing warning FR12 walks into:

> **Note for whoever picks this up:** check 4 has already been rewritten twice (`375f465d` then
> `58965967`); `code-review-convergence`'s 'two failed attempts predict a third' applies —
> restructure the check's purpose, do not patch it a third time.

Third: `catch-all-phase-review` binds FR12 and is not named. FR12 is a catch-all matcher over every
path-shaped string in every shipped skill. The rule requires a `--dry-run`/`--verbose` mode, a
≥ 10-match false-positive spot check, and a fixture containing known false positives. The repository's
precedent is exact and cost-paid — from `ci.yml:245`:

> By 2026-09-19 it reported **658 broken references across 92 files** and exited 1 on every run — a
> gate in that state is not a weak gate, it is documentation […] Wired only after it was made green,
> and in that order on purpose.

FR12 must carry the exemption model (`HISTORICAL_RECORD_PREFIXES`-shaped, with the exempt count printed
and a `--no-exempt` mode) and must be made green before wiring, or it repeats the scar.

---

## Part 2 — The Operator Covenant

### 2.1 What FR4 and FR12 do *not* violate

FR4 and FR12 are CI gates. They are not Convoke skills, have no operator at the point of failure, and
the Checklist's own value set covers them: `N/A — out-of-scope (<reason>)` for *"headless automation,
non-operator-facing build tool"*. **Neither FR4 nor FR12 violates any Operator Right**, and the
question "does a failing CI check hard-stop the operator?" is out of the Covenant's scope by
construction — the Covenant's operator is the *installing/running* operator, not the contributor.

One caveat worth recording: **FR4's failure message is operator-facing for a contributor**, and the
rule `covenant-compliance-for-convoke-skills` is scoped to `_bmad/bme/`, not to `scripts/audit/`. So
the obligation on FR4's message is `verification-claims-must-name-their-evidence`, not OC-R6.

### 2.2 FR6 and FR9 violate OC-R1 and OC-R5 as written (C3)

Covenant axiom and §1:

> **The operator is the resolver.**
>
> when a Convoke skill cannot resolve something on its own, it brings the operator into the loop —
> **not as a fallback, not as an error path**, but as a first-class collaborator whose decision is the
> mechanism by which the situation resolves. **Uncertainty is a collaboration signal, not an output
> failure.**

Covenant §3 defines the state FR6 detects:

> **unresolvable state** | Any branch where the skill cannot cleanly determine the answer. The
> Covenant treats this as a collaboration point, not a failure.

A missing runtime is an unresolvable state by that definition. Now the PRD:

> **FR6.** Any Convoke skill that requires the Convoke runtime detects its absence during
> activation, before producing output.
> **FR9.** A skill never silently produces output when its runtime is absent. Degradation is
> permitted; silence is not.

And the shape the addendum proposes for it:

> **S1 — installer-led.** npm + `convoke-install-*` is the only supported path; crawled listings
> become funnel entries that **refuse to run and say why.**

**OC-R1 — Right to a default. FAIL as written.** Checklist:

> | OC-R1 | At every branch where the skill encounters unresolvable state, does it propose a default
> value the operator can accept or override? (**`skip` / `abort` are exits, not fallback values —
> they count as FAIL.**) | |

"Refuse to run and say why" is an abort. FR6 requires detection, FR7 requires a command, FR9 forbids
silence — **no FR in F2 requires a proposed default the operator can accept or override.** FR9's
"Degradation is permitted" *permits* the compliant behaviour without requiring it, which under a
binary rubric is a FAIL: the Checklist's §"No partial credit" gives no borderline value.

**OC-R5 — Right to pause. FAIL as written.** Covenant §6.5:

> **The right.** At every decision point, the skill halts and waits. No auto-advance, no silent
> default-selection, no prompt-without-wait.

A skill that refuses to run never reaches an input boundary. It does not auto-advance *past* the
decision — it deletes the decision. The Checklist requires a literal marker: *"Accepted markers (one
must appear near the prompt): (i) literal `HALT` […]"*. F2 as written produces no prompt for a marker
to sit near.

**Required phrasing for compliance.** FR6 stays as-is (detection is right, and "before producing
output" is OC-R2/R4-shaped and good). FR9 must be inverted from a permission into an obligation, and a
new requirement must carry the default:

> **FR9 (compliant).** When its runtime is absent, a skill halts at an explicit decision point and
> offers a proposed default the operator can accept or override — at minimum the choice between
> obtaining the runtime and proceeding in a named degraded mode. It never silently produces output,
> and it never exits without offering that choice. Where no operator is present (non-interactive
> runs), the skill uses a declared **fallback** and names it in its output.

The last sentence matters: Covenant §3 distinguishes the two and the PRD conflates them —
*"**default**: A proposed value shown to the operator […] **fallback**: A safe value the skill can
use when no operator is present (automation contexts, non-interactive runs). Distinct from default:
default is a prompt, fallback is a silent safety net."* FR6's "during activation" includes
non-interactive activation, so F2 owes both.

### 2.3 FR7 satisfies OC-R6 and fails OC-R3 (C4)

> **FR7.** On detecting absence, the skill names the missing component and states the exact command
> that obtains it.

**OC-R6 — Right to next action. PASS, and well specified.** Covenant §6.6's good example is the same
shape: *"Taxonomy config not found at `<path>`. Run `convoke-migrate-artifacts` or `convoke-update` to
create it." The error names the remedy by command.* FR7 is the Right to next action written as an FR;
it is the strongest Covenant alignment in the document.

**OC-R3 — Right to rationale. FAIL as written.** Checklist:

> | OC-R3 | At 100% of operator decision points, does the skill include at least one sentence of
> rationale explicitly naming at least one of: **consequence, trade-off, or downstream effect**? (Any
> single missing instance = FAIL.) | |

FR7 requires two things — the missing component's name, and the command. Neither is a consequence, a
trade-off or a downstream effect. Covenant §6.3: *"A bare option list asks the operator to decide
without context; they either guess or halt. Rationale is the bridge between an option and a
judgment."* And `covenant-compliance-for-convoke-skills` names this exact failure: *"'See the
Covenant' with no rationale violates OC-R3 (the Right to rationale that the Covenant itself
encodes)."*

**Required phrasing.**

> **FR7 (compliant).** On detecting absence, the skill names the missing component, states the exact
> command that obtains it, **and states in one sentence what the operator cannot do until they run
> it** — the capability withheld, not the condition detected.

### 2.4 FR8 is a pacing risk against OC-R7 (recorded, not a violation)

> **FR8.** The dependency is legible in the channel's rendered storefront text, not only at runtime.
> *(The storefront renders frontmatter `description`; a README is invisible to it.)*

Covenant §6.7: *"Each interaction round introduces no more than three new concepts beyond the
Covenant's concept budget."* The storefront `description` is the **first** round the operator ever
reads, and it starts with zero inherited vocabulary — the Checklist's workflow-inheritance carve-out
(*"Concepts introduced in `workflow.md` […] count as pre-existing for all step files within the same
workflow"*) does not reach a storefront, because there is no earlier step. FR8 asks one sentence to
carry the missing component, the command, FR7's consequence clause and, for a Convoke skill, the words
*module*, *runtime* and likely *team*. The Novel-Concept Glossary counts *"Domain-specific terms"* and
*"Named actions with new consequences"*, and none of those words is in the pre-existing list.

Not a violation of an FR as worded — a constraint F2's implementation will hit. Worth one clause in
FR8: *the description stays within the concept budget; detail lives in the runtime message.*

### 2.5 Roll-up against the seven rights

| Right | FR4/FR12 | FR6 | FR7 | FR8 | FR9 |
|---|---|---|---|---|---|
| OC-R1 default | out-of-scope | — | — | — | **FAIL** — no default, abort counts as FAIL |
| OC-R2 full universe | out-of-scope | PASS-shaped | — | — | — |
| OC-R3 rationale | out-of-scope | — | **FAIL** — command ≠ consequence | — | — |
| OC-R4 completeness | out-of-scope | — | — | — | PASS — "silence is not [permitted]" |
| OC-R5 pause | out-of-scope | — | — | — | **FAIL** — refusal deletes the decision point |
| OC-R6 next action | out-of-scope | — | **PASS** | PASS | — |
| OC-R7 pacing | out-of-scope | — | — | risk | — |

**Answering the question directly: no FR violates a right about hard-stopping the operator, because
the Covenant has no such right.** The Covenant's objection to a hard stop is indirect and arrives
through OC-R1 and OC-R5: a stop is permitted, but only *after* a default was offered and the skill
waited. FR6–FR9 as written stop *instead of* offering and waiting. The nearest thing to a
"don't hard-stop" rule lives in `project-context.md`, not the Covenant — and it is the next item.

### 2.6 The rule the PRD never names: `preflight-soft-warn` (C2)

> ## preflight-soft-warn
>
> **Rule.** Runtime preflight checks (BMAD compatibility, environment sanity) emit yellow WARNINGs to
> stderr but exit 0 — **never block the install/update flow**. Operators see the WARNING but the
> operation continues.
>
> **Why.** […] **False-positive hard-blocks would trap operators with legitimate non-standard installs**
> (git-clone, monorepo, alternative distribution channels).
>
> **How to apply.** Future preflight helpers (e.g., environment-preflight, **dependency-preflight**)
> MUST follow the same contract: stderr WARNING + exit 0 pass-through; never `process.exit(non-zero)`;
> never `throw` to the caller.

FR6 is a dependency-preflight. The rule names `dependency-preflight` in its forward-binding clause, by
name, as a covered case. The PRD does not mention `preflight-soft-warn` anywhere.

The rule's *why* is the sharpest part: false-positive hard-blocks trap operators with **"alternative
distribution channels"** — which is the entire subject of this PRD. FR11's plugin-cache and
global-skills-directory topologies are precisely the non-standard installs the rule was written to
protect, and FR6's detector will have its highest false-positive rate exactly there, because a
plugin-cache install cannot see the project root (see C7).

There is a real scoping argument available: `preflight-soft-warn`'s stated scope is *"the
install/update flow"*, and a skill *activation* is arguably a different flow. **The PRD must make that
argument or lose it.** As it stands F2 reads as a forward-binding rule being overridden silently —
which is the class `documentation-claims-must-be-derived` was written about, pointed at a rule instead
of a doc.

**Required phrasing.** Either (a) scope the distinction explicitly — *`preflight-soft-warn` binds the
install/update flow; FR6 binds skill activation, where producing output against an absent runtime is
the harm, and the two contracts differ deliberately* — and record it as an amendment to
`preflight-soft-warn` in `project-context.md`, per that file's own *"If the ratified rule binds
contributors or agents, it belongs in this file"*; or (b) adopt the soft-warn contract and let FR9's
degradation clause do the work, which happens also to be what OC-R1 requires.

Note that (b) resolves C2, C3 and part of C7 with one decision. It is the cheapest coherent fix in
this document.

---

## Part 3 — Rule 28 `generic-agents-specific-knowledge` and F4 (C16)

The rule's candid close:

> **Not enforced.** Nothing mechanical distinguishes generic content from domain content today, and
> until something does, **this rule is a declaration** — the same class of gap this file documents
> elsewhere. It was also, until 2026-09-20, unwritten: it existed only in the operator's head and in
> advice given verbally in workshops, which is why adopters who never attended one do the opposite on
> day one.

**Question asked: does F4 repeat the declaration-without-enforcement pattern the rule diagnoses in
itself? Yes, on three counts — and it is worse than the rule's own case, because F4 has gates
available and does not use them.**

**(a) Three of F4's five FRs carry no enforcement, next to two F1 requirements that do.** F1 pairs
its declarations with gates: FR3 with FR4 ("A check fails CI when…"), FR10 with FR12 ("A check fails
CI on any bare cross-directory path"). F4 has no such pairing:

| FR | Declaration | Enforcer named in the PRD | Enforcer that exists at HEAD |
|---|---|---|---|
| FR13 | 11 agents exist as skills | none | `name-registry-integrity.js` A2/A4 (partial — tracked source, not skills) |
| FR14 | each workflow invocable by name | none | none; the *mechanism* exists (`refresh-installation.js:952`) |
| FR15 | each contract addressable | none | none |
| FR16 | one registry, no duplicate names | none | `name-registry-integrity.js` A1 — **but `VALID_KINDS = ['team','agent']`** |
| FR17 | scaffolding distinguishable from capability | none | none |

FR14, FR15 and FR17 are declarations with no gate, no metric and no mechanism. SM3 and SM4 — the two
metrics that would measure them — carry *"to be set with G3's scope"*, and the PRD says so plainly:
*"SM3 and SM4 have no target. Setting them is the same decision as OQ-1."* **A requirement whose
metric has no target and whose check does not exist is exactly the artifact Rule 28 calls a
declaration.**

FR17 is the clearest instance. *"A skill that is metadata or scaffolding rather than a capability is
distinguishable from one an operator should invoke"* names no marker, no field, no predicate and no
consumer of the distinction. Compare FR3, which names its mechanism class ("marked such that no
documented channel path offers it") and pairs with FR4. FR17 is FR3 with the mechanism removed.

**(b) On the rule's substance, F4 points the wrong way — and the PRD has no knowledge-layer
requirement at all.** The rule:

> **Statement.** Teams, agents, skills and workflows stay **as generic as possible**. Domain
> specificity is carried by **curated knowledge that agents read** — never by specialising the agent
> itself.
>
> **Adding domain capability.** Put it in knowledge — a markdown artifact first — and have the agent
> read it. Inventory it, curate it, and **expose** it; knowledge nothing can find is knowledge you do
> not have.

The 14 handoff contracts **are** Convoke's curated-knowledge layer: HC1–HC5 are artifact contracts,
HC6–HC10 routing contracts, GC1–GC4 Gyre's. FR15 promotes them from *knowledge an agent reads* to
*addressable units an operator invokes*. That is not forbidden — the rule's Exception protects
functional specialisation (*"Vortex is discovery-shaped, Gyre is readiness-shaped […] that is what a
team is"*) and a Shiftup-stream handoff contract is craft, not client or sector. **But the rule's
reviewing bullet will fire on all 14 and nothing in the PRD pre-answers it:**

> **Reviewing a PR.** If a diff puts domain-specific content inside an agent, skill or workflow file,
> block and cite this rule.

And the direction of travel is the rule's own field evidence pointed at F4. The rule cites a CTO:
*"when adopting BMAD and Convoke, we start customizing agents and skills."* F4 multiplies the
customisable addressable surface by ~5× (9 reachable today → ≥ 48 proposed) **and adds no requirement
for the knowledge layer that is supposed to absorb customisation.** G3's stated goal is *"the parts of
Convoke that carry its value — the workflows and the handoff contracts — become addressable"*; the
rule's position is that the parts carrying domain value should be *readable knowledge*, exposed and
inventoried, not individually invocable. Those are not the same plan, and the PRD does not
acknowledge the tension.

**(c) Where F4 *avoids* the pattern, and it deserves credit.** FR15's parenthetical is exactly the
honesty the rule models: *"(HC1–HC5 are files; HC6–HC10 exist only as mentions across a README, a
routing reference and seven workflow step files.)"* That is a derived, falsifiable statement of the
current gap. The "Gaps this draft does not fill" section does the same for FR18–FR21: *"FR18–FR21
stand on inference by acceptance rather than by capture — a later reader should treat those four as
the least validated requirements in the document."* **That paragraph is the best thing in the PRD**,
and it is the template FR14/FR15/FR17 should follow: say the FR is a declaration, or give it a gate.

**Verdict.** F4 repeats the pattern. Three FRs (FR14, FR15, FR17) are declarations with no
enforcement and two metrics with no targets, in a document that pairs declaration with gate everywhere
else. The remedy Rule 28 itself implies is the honest label: mark FR14/FR15/FR17 as declarations
pending OQ-1, the way the PRD already marks FR18–FR21 — or pair each with a check and pay NFR2's
budget for it.

---

## Part 4 — Impossible, and already solved

### 4.1 FR4 is unsatisfiable as written (C1) — the hardest finding

> **FR4.** A check fails CI when the reachable set diverges from the declared set.
> **SM1.** Reachable set equals declared set — 9 reachable, **0 declared** → equal, checked in CI.

**The reachable set cannot be enumerated in CI, and the repository has already ruled on this — in a
comment on the CI step next to where FR4's check would go.** `.github/workflows/ci.yml:228-230`:

> It does NOT read `.claude/skills/`, which `.gitignore:62` ignores — **a check over an ignored path
> passes vacuously in CI.** The wrappers are generated at install time and `convoke-doctor.js:92`
> already checks them there.

The same ruling, at length, in `scripts/audit/name-registry-integrity.js`:

> **A2 DELIBERATELY DOES NOT READ `.claude/skills/`.** The baseline memo words this check as "every
> `bmad-agent-bme-*` skill resolves", but `.gitignore:62` ignores `.claude/skills/*`, so a fresh CI
> checkout sees almost nothing there and the check would pass vacuously. We assert the TRACKED source
> those wrappers are generated from — and `tracked` here means `git ls-files`, not `existsSync`,
> because an untracked local file satisfies a developer and vanishes in CI, which is the same vacuous
> pass wearing a different hat. **An empty enumeration is a FAILURE TO RUN, never a clean bill of
> health.**

Derived at HEAD, 2026-09-26: 258 `SKILL.md` in the tree; `.gitignore:66-71` whitelists two. A CI
checkout therefore sees ~2 of the set FR4 must compare. FR4 has three exits and the PRD must choose
one:

1. **Redefine "reachable" as the tracked/packaged set** — `git ls-files` plus `npm pack`, plus the
   manifest's 7 declared paths. This is the only exit consistent with the existing ruling, and it
   changes SM1's "9 reachable" into a figure a command produces.
2. **Move the check to install time**, where `convoke-doctor.js:92` already stands and the generated
   wrappers actually exist. This forfeits "fails CI", which is FR4's whole text.
3. **Reverse the `.gitignore` decision** (track `.claude/skills/`), which is `I80`'s Option B, already
   an open backlog row: *"move SKILL.md to `_bmad/bme/` tracked location + add refresh-installation.js
   copy step"* (`.gitignore:58-65`). That is an initiative, not an FR.

As written, FR4 is the `verification-must-be-falsifiable` failure mode in advance: a gate that cannot
fail because its enumeration is empty. That rule's words: *"A check that cannot fail is not weak
evidence — it is **no** evidence, and it is worse than none because it reads like proof."* And its
shipping condition: *"A new gate is not shippable until it has failed once on purpose."*

### 4.2 FR3 + FR5 + NFR3 + OQ-2 are circular (C15)

> **FR3.** Every `SKILL.md` […] is marked such that no documented channel path offers it for
> installation — including explicitly-flagged paths, not only default ones.
> **FR5.** No name is published into a channel before FR1–FR4 hold for that channel.
> **NFR3 — Irreversibility.** No action publishes a name into a channel from which it cannot be
> retracted until F1 holds.
> **OQ-2.** Does `metadata.internal: true` suppress the **skills.sh web listing**, or only CLI
> installs? Unverified. Item 0's design depends on the answer.

FR3 is F1's; FR5 and NFR3 forbid publishing until F1 holds; FR3's satisfaction depends on OQ-2; and
OQ-2's answer — per the addendum — is only obtainable by observing the live web listing:

> ⚠️ **Unverified by this session:** research reports the flag suppresses the CLI but **not** the
> skills.sh web listing ([#1578], a skill listed publicly despite `metadata.internal: true`). **Check
> this before designing on the flag.**
>
> **No self-serve retraction**: deleted skills remain listed ([#1578]); delisting is done by hand by
> Vercel staff.

So: FR3 needs OQ-2; OQ-2 needs an observation of a published listing; publishing is barred by FR5 and
NFR3 until FR3 holds; and if the observation goes the wrong way the name cannot be retracted. The
cycle is real and the PRD does not name it.

`external-claims-must-be-executed-or-hedged` gives the only compliant exit — SM6's target ("38 →
zero, reachable by any documented flag") is a claim about an external system and must be
**"Explicitly marked unverified, naming what would settle it"**, not stated as a target:

> A claim that is none of these does not enter a governed artifact — not an ADR, an epic, a story AC,
> a backlog row, or an operator runbook. **"I read the docs" is not execution, and a documentation
> summary is not the docs.**

And the observation that would settle OQ-2 without spending an irretractable name: publish a
**throwaway** name under `metadata.internal: true` and read the web listing. That is the "documented,
not observed" → "observed" conversion the rule asks for, and it should be an explicit Discovery task,
not an open question.

### 4.3 FR13 is worded against a framing ADR-004 explicitly rejected (C5)

> **FR13.** All 11 agents across both teams exist in the repository as skills. *(Gyre's four are
> generated at install time today and exist nowhere in the tree.)*

`_bmad-output/planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md`:

> **C2.** Every operator-invocable unit MUST be **declared** — as an agent in `agent-registry.js`, or
> as a `config.yaml` workflow entry with `standalone: true`. **Declaration, not file placement, is
> what produces a `.claude/skills/` wrapper.**
>
> **Copying would not make anything invocable anyway.** `.claude/skills/` wrappers are *generated*,
> never copied […]
>
> **3. Story 2.4's assertion checks invocability (C2), not presence (C4).** Resolved per the
> recommendation, and it is the answer that carries the most weight — **a presence-only gate goes
> green on the exact defect it was built to catch.**

FR13 asserts **presence** ("exist in the repository as skills"), and its parenthetical treats
generation-at-install as the defect. ADR-004 ruled that generation *is* the mechanism and that
presence is the wrong assertion. Derived: Gyre's four agents **are** declared — `GYRE_AGENTS` at
`scripts/update/lib/agent-registry.js:149`, and all twelve agent rows are in
`_bmad/bme/_config/name-registry.csv`, cross-checked by assertion A4 ("agent rows match
`agent-registry.js` — the drift invariant") in CI at `ci.yml:231`.

**So FR13 is already satisfied under the ruled definition, and unsatisfiable-as-stated is the better
reading of its intent.** What FR13 is *reaching for* is real and different: Gyre's agents are not in
`.claude-plugin/marketplace.json` (verified: 7 declared paths, all Vortex), so they are declared but
not **channel-addressable**. **Required phrasing:** *All 11 agents are declared per ADR-004 C2 and
appear in every channel manifest Convoke publishes.* That states the actual gap and does not reopen a
signed ADR.

### 4.4 FR15 and FR17 need an ADR-004 amendment that NFR2's budget has already spent (C6)

ADR-004 considered and declined the third declaration shape FR15 requires:

> **(b) is the tempting one and I think it is wrong.** It is less work today — one generator change,
> no files moved — but it makes "a bare `skills/` directory" a supported module shape, so the repo
> would then have **three ways to declare an invocable unit instead of two.** Every future gate,
> doctor check and audit has to know all three.

A handoff contract is neither an agent in `agent-registry.js` nor a `standalone: true` workflow, so
FR15 requires exactly shape (b). FR17's "metadata or scaffolding" skill — the addendum's cited
BMAD-METHOD *"Non-invocable module-record skills"* — is a fourth. Both need an ADR-004 amendment, and
per C11 the baseline's one-ADR allowance was consumed by the meta-model ADR. FR15 and FR17 are
therefore **blocked on an operator ruling**, not schedulable work, and belong with OQ-1 rather than in
F4's requirement list.

### 4.5 FR11 vs `team-state-directories` — structurally incompatible for Gyre

Treated in full at Part 1 §12. In summary: the rule's *"`.<team>/` at the project root"* is absolute
and FR11's topology makes "the project root" undeterminable from the skill's position. One of the two
must be amended; the PRD amends neither.

### 4.6 Already solved — mechanisms that exist at HEAD

| PRD requirement | Existing mechanism (derived) | What is actually missing |
|---|---|---|
| **FR14** each workflow invocable by name | `refresh-installation.js:952` — *"Each `standalone:true` workflow gets a skill wrapper at `.claude/skills/{workflow.name}/SKILL.md`"*; endorsed by ADR-004 C2 as one of the two legitimate declaration shapes | Nothing mechanical. FR14 is a **data** change — set `standalone: true` on 30 `config.yaml` entries — plus the Covenant and namespace cost of 30 units (C8, C9) |
| **FR16** single name registry, no collisions | `_bmad/bme/_config/name-registry.csv` (26 rows) + `scripts/audit/name-registry-integrity.js` A1 (*"names unique within kind; a name shared across kinds must be a DECLARED collision"*), in CI at `ci.yml:231`; ADR-001 makes it the declaration point | `VALID_KINDS = ['team','agent']` — a `skill` kind. **And a decided obstacle:** the registry is *"REPO-SIDE ONLY, BY DECISION […] Do not add it to `package.json` `files[]` without reopening that ruling in T124."* FR16's clause about *upstream skills Convoke ships alongside* needs that ruling reopened |
| **FR12** bare cross-directory paths | `scripts/audit/reference-integrity.js` + `npm run refs:audit` in CI at `ci.yml:262`, with the exemption model FR12 will need | Scope. `reference-integrity.js`'s five coverage scopes do not include shipped-skill capability references, and it is `.md`-only *(narrowed after "23 false positives")* |
| **FR23** no dependency on removed upstream components | `_bmad/_config/bmm-dependencies.csv` + `scripts/audit/audit-bmm-dependencies.js` + the `bmad-register-skill` slash command | Nothing structural. The "four dead upstream dependencies" is a **data finding against an existing registry**, i.e. a backlog row, not an FR |
| **FR3** non-product skills unofferable | `metadata.internal: true` — the PRD's own defect table calls it *"a shipped per-skill mitigation"* | Application to 38 files, and OQ-2 (§4.2) |
| **FR22, NFR5** derived claims | `documentation-claims-must-be-derived` + `derive-counts-from-source` in `project-context.md`, both binding today | Nothing. See C20 — these are restatements |
| **NFR2**'s three budget items | All three shipped: `name-registry.csv`, `name-registry-integrity.js` (`ci.yml:231`), meta-model `adr-001` — *"Three deliverables, no epic, budget held."* | The budget is **spent**, not available. See C11 |
| **NFR4** installer writes no governance rows | The BUG-19 ruling, shipped in `dist-2-5` | Nothing. Correctly stated as an existing constraint |

---

## Collision register

| # | Rule(s) | FR(s) | Class | Severity |
|---|---|---|---|---|
| C1 | `test-fixture-isolation`, `fixture-determinism`, `verification-must-be-falsifiable` + the `.gitignore:62` ruling in `ci.yml:228` | **FR4**, SM1 | Collides — unsatisfiable as written; would ship a gate that cannot fail | **Highest** |
| C2 | `preflight-soft-warn` (names `dependency-preflight` by name) | **FR6, FR9** | Silently assumed away — rule never mentioned | **Highest** |
| C3 | Covenant OC-R1, OC-R5 | **FR6, FR9** | Collides — abort with no default and no pause = FAIL on two rights | **Highest** |
| C4 | Covenant OC-R3 | **FR7** | Collides — command without consequence | High |
| C5 | ADR-004 §3 (invocability, not presence) | **FR13** | Collides — reopens a signed ruling; already satisfied under it | High |
| C6 | ADR-004 C2 + option (b) declined; NFR2 budget | **FR15, FR17** | Collides — needs a third/fourth declaration shape and an ADR the budget spent | **Highest** |
| C7 | `team-state-directories` | **FR11**, FR14 (Gyre's 7), FR19 | Collides — `.gyre/` has no project root under a plugin-cache install | **Highest** |
| C8 | `namespace-decision-for-new-skills` | **FR3, FR13–FR17** | Collides — ≥48 units owe a Namespace decision; FR3 owes a pre-coding escalation | High |
| C9 | `covenant-compliance-for-convoke-skills` | **FR13–FR17** | Collides — ≥384 Checklist cells unbudgeted; no PASS shape for FR15/FR17 units | High |
| C10 | `derive-counts-from-source` + the PRD's own FR2/NFR5 | **SM1–SM6**, Measured position | Collides — 11 hardcoded figures, 0 commands, in a doc requiring the opposite | High (cheap fix) |
| C11 | `documentation-claims-must-be-derived`; meta-model ADR-001 | **NFR2** | Collides — asserts an available budget that T124 already spent | High |
| C12 | `catch-all-phase-review`, `shared-test-constants`, `code-review-convergence` (two-attempts clause) | **FR12**, FR1, FR4 | Silently assumed away — no dry-run, no FP budget, no exemption model; miscites closed T214 instead of open T138 | High |
| C13 | `no-hardcoded-versions` + NFR1's own clock | **FR20** | Collides — ≥48 upstream version strings rotting every 4–6 weeks | Medium |
| C14 | `slash-command-ux-for-user-facing-tools` | **FR2, FR7, FR19, FR21** | Collides — CLI as the interface, exemption available but unstated | Medium |
| C15 | `external-claims-must-be-executed-or-hedged` | **FR3, FR5, SM6, NFR3, OQ-2** | Collides — circular: verifying FR3 requires an irretractable publish FR5/NFR3 forbid | High |
| C16 | `generic-agents-specific-knowledge` | **FR14, FR15, FR17**, SM3, SM4, G3 | Collides — declaration without enforcement (Part 3); no knowledge-layer FR | Medium |
| C17 | `backlog-write-discipline`, `staleness-preflight` (qualification arm) | Discovery output; **FR12**'s citation | Silently assumed away — 6 defects + 3 OQs filed nowhere; instance/gate not split | Medium |
| C18 | `test-fixture-isolation` (`committed-artifact-integrity` conditions); `code-review-convergence` consumer audit | **FR3** | Silently assumed away — mutates 38 fixtures, consumers unenumerated | Medium |
| C19 | `path-safety-for-destructive-ops` | **FR11**, addendum S3 | Silently assumed away — no safety analysis; FR11 removes the containment anchor | Medium |
| C20 | `documentation-claims-must-be-derived` | **FR22, NFR5** | Collides — restates binding rules as FRs, creating two sources for one obligation | Low |

**Totals.** 20 registered: 11 collisions with a rule as written, 9 rules silently assumed away.
6 at highest severity (C1, C2, C3, C6, C7, and C15/C11 adjacent).

## What this reconciliation did not check

- **The six defects' own truth.** Taken as given from the PRD; this pass reconciled the *plan*
  against the *rules*, not the findings against the tree.
- **FR18–FR21 in substance.** The PRD already discloses that these rest on inference rather than
  capture; nothing here strengthens or weakens them beyond C14.
- **OQ-2.** Not executed. It is an external-system observation and `external-claims-must-be-executed-or-hedged`
  forbids reporting a read as an execution.
- **Whether the 20 are exhaustive.** 28 rule headings exist; 13 were named for examination plus
  `preflight-soft-warn`, `external-claims-must-be-executed-or-hedged`,
  `documentation-claims-must-be-derived`, `verification-must-be-falsifiable`,
  `code-review-convergence`, `catch-all-phase-review`, `spec-verify-referenced-files` and
  `staleness-preflight-for-backlog-pickup`, which the PRD's text pulled in. Eight rules were not
  examined against this PRD: `no-process-cwd-in-libs`, `no-code-in-party-mode`,
  `a-remediation-is-an-unreviewed-change`, `lint-passes-before-review`, `verification-pipefail`,
  `capability-form-factor-evaluation`, `mechanical-research-enumeration`,
  `verification-claims-must-name-their-evidence`, `commit-preparation`. **`capability-form-factor-evaluation`
  is the most likely to bite of those unexamined** — F4 proposes ≥48 new capabilities and that rule
  requires the Capability Evaluation Framework decision tree plus friction-log evidence at the
  qualifying gate (*"No capability gets built without friction log evidence — vision is not demand"*).
  Treat this count as a **floor**.
