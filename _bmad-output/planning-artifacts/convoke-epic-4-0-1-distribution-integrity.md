---
initiative: convoke
artifact_type: epic
created: 2026-08-18T00:00:00.000Z
schema_version: 1
status: active
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md
  - _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md
  - _bmad-output/implementation-artifacts/deferred-work.md
  - .github/workflows/ci.yml
  - package.json
  - scripts/convoke-doctor.js
  - scripts/portability/export-engine.js
  - project-context.md
---

# Convoke 4.0.1 — Epic Breakdown

## Overview

Mini-epic following the [`convoke-epic-ci-hygiene.md`](convoke-epic-ci-hygiene.md) /
[`convoke-epic-lint-cleanup-dod-gate.md`](convoke-epic-lint-cleanup-dod-gate.md) /
[`convoke-epic-restore-coverage-green-ci.md`](convoke-epic-restore-coverage-green-ci.md)
precedent: cross-cutting, incident-driven, **no PRD and no Architecture document** —
requirements derive from the ratified
[4.0.1 scope decisions](convoke-note-4-0-1-scope-decisions.md) and are traced to
backlog rows with source-verified anchors.

**Size, stated deliberately.** 15 stories and 3 ADRs — larger than the tiny meta-model
baseline that follows it, which is one ADR, one name registry and one doctor check. That
is on purpose: 4.0.1 pays down the release mechanism once so that the baseline, Forge, and
every release after them are cheap. If that trade stops looking worth it, this is the
paragraph to reread.

**Version — `4.0.1`, a patch, decided 2026-08-19.** Story 2.6 makes four `_portability`
skills reachable and Story 2.5 ships a file that was missing from the package, which reads
like added functionality. It is not. Both are already declared — `_bmad/bme/_portability/`
is in `files[]` and in the tarball an operator has already downloaded; `bmm-dependencies.csv`
is read by shipped code. Nothing is added; delivery of what 4.0.0 already promised is
repaired, which is the textbook patch. The self-consistency argument settles it: this epic's
premise is that 4.0.0 shipped promises it did not keep, and a minor version would assert the
opposite — that the promise is new. Not an ADR; a one-line call.

**Spine.** *Nothing binds what is in the repository to what an operator actually gets.*
Four instances were found by hand within two days, in three different directions
(in-repo-not-in-tarball, in-tarball-no-install-path, declared-but-unwired). None was
caught by a gate. This epic repairs the instances **and** builds the binding check, so
the class becomes mechanically detectable.

## Pre-Epic Decisions (ADRs — authored BEFORE sprint planning)

Neither of these is implementable work, and each sat first in its epic — so both epics
stalled at story one waiting for a human ruling, and Epic 1's story count was a variable.
Pulled out as ADRs; both epics then have a knowable shape end to end.

**ADR-1 — Retire the badges pipeline, or keep and harden it?** *(was FR10 / T40)* — **ACCEPTED 2026-08-19: retire.** See [adr-001](adr/4-0-1/adr-001-retire-badges-pipeline.md). Story 1.1b struck; FR6–FR8 retired; Epic 1 = 7 stories.
~~`prepublishOnly` is still `npm run badges:check`; T39 removed the date but left the gate.~~ **Executed 2026-08-21 by story `dist-1-1`:** the hook, the generator, `badges.yml` and `docs/badges.json` are all deleted.
`docs/badges.json` has no consumer — the I156 rewrite removed the four dynamic shields,
and a repo-wide grep finds only the generator, `badges.yml`, `knip.json` and
`package.json`. Closes `CR-README-D03` (`deferred-work.md:957`) either way.
**Unblocks:** FR6, FR7, FR8 exist only if the answer is *keep*. Decide first or three
stories may be built into a file that is deleted a week later — and FR8's committed tests
would then break the suite on deletion.

**ADR-2 — Where does the Operator Covenant live, and what is the shipped-link policy?** *(was FR20)* — **ACCEPTED 2026-08-20: option (d), three classes; the Covenant moves to `_bmad/bme/covenant/`.** See [adr-002](adr/4-0-1/adr-002-shipped-link-policy.md). FR12's first true positive is `_bmad/bme/README.md`'s three links to
normative required reading (`convoke-covenant-operator.md`, the Compliance Checklist,
`project-context.md`) that lives in generated-artifact space and is not in the package.
Options: move it into `files[]`, rewrite the links as absolute GitHub URLs, or drop them.
**Unblocks:** FR12's checker is never wired into CI until this is ruled. A detector with
no paired decision gets allowlisted the first time it goes red under release pressure —
how the `pathContains` filter and the badges gate were each neutralised.

**ADR-3 — How is "tag-push is the only publish path" actually enforced?** *(gates FR9 / T35)* — **ACCEPTED 2026-08-20: option (a), an npm per-package setting.** Spike resolved: no repository change can enforce this. See [adr-003](adr/4-0-1/adr-003-publish-path-enforcement.md). Stories 1.6 and 1.7 transposed as a result. The backlog row offers three options and the epic must not choose inside an
acceptance criterion: **(a)** make tag-push the only path and treat a laptop
`npm publish` as an incident; **(b)** keep manual rc publishing but add a preflight that
refuses on a dirty tree or unpushed `HEAD` and prints the built-from commit; **(c)**
record the built-from commit in the package so a tester can report it.
**Includes a spike:** option (a) may not be enforceable from this repository at all. The
only local chokepoint was `prepublishOnly`, which **ADR-1 deleted on 2026-08-21 (story `dist-1-1`) — there is now no local chokepoint at all**; the real enforcement
point is likely npm's registry-side publishing settings (the publish job already cites
`gh.io/npm-gat-bypass2fa-deprecation`). Determine whether (a) is a repo change or an npm
account setting before writing the story.
**Unblocks:** FR9. Distinct from the A40/P21 Publication Gate, which governs Covenant
compliance for external publication — this is a build-freshness gate.

## Requirements Inventory

### Functional Requirements

**Gate — T41 (publish path; must clear before 4.0.1 can ship).**
All ~~eight~~ **five** (f/g/h retired 2026-08-21 by ADR-001) execute only on a `refs/tags/v*` push; each gets one live rehearsal.

```
FR1:  The dist-tag derivation MUST ignore SemVer build metadata, so `4.0.0+sha.5114f85`
      routes to `latest` and not `rc`.                                        [T41(a) HIGH]
FR2:  The publish job MUST assert the resolved npm version is >= 11.5.1 (the OIDC
      registry-auth floor) and fail loudly if it is not, rather than depending on the
      runner toolcache.                                                       [T41(b) HIGH]
FR3:  The publish job MUST fail when the pushed git tag and `package.json` version
      disagree — BUG-15's unbuilt acceptance text; `github.ref_name` is referenced
      nowhere today.                                                          [T41(c) HIGH]
FR4:  The job MUST NOT leave `_authToken=${NODE_AUTH_TOKEN}` unset in `.npmrc`, so an
      OIDC decline surfaces as *no token* rather than *bad token*.            [T41(d) HIGH]
FR5:  The publish job MUST fetch the current `latest` from the registry and refuse to
      publish a semver-lower version to it (a `3.3.1` would downgrade every 4.0.0 user).
      A `package.json`-only check CANNOT satisfy this — `ci.yml` queries the registry
      nowhere today, so the job has no knowledge of what `latest` currently is. Accepted
      trade-off: the publish job gains a dependency on registry availability; the story
      must state it rather than discover it.                                  [T41(e) MED]
FR6:  RETIRED 2026-08-19 by ADR-001 (retire the badges pipeline). Was: the badge
      generator must fail rather than emit a collapsed count.            [T41(f) MED]
FR7:  RETIRED 2026-08-19 by ADR-001. Was: the manifest floor must reject implausible
      low counts, not only negative ones.                                [T41(g) MED]
FR8:  RETIRED 2026-08-19 by ADR-001. Was: the generator guards must carry committed
      tests.                                                             [T41(h) MED]
```

**Cluster 4.1 — Publish-path integrity.**

```
FR9:  A published artifact MUST be traceable to a committed tree, by the mechanism
      ADR-3 selects. 4.0.0 and six release candidates were all hand-published; 4.0.0 as
      shipped carries `dist.attestations: null`.       [T35] [MECHANISM SET BY ADR-3]
```

> **FR10 retired as an FR — reclassified ADR-1.** See *Pre-Epic Decisions*. It was a
> decision ("retire the pipeline, or keep it and harden it?"), not implementable work,
> and it sat first in the epic — so the epic's story count was a variable until a human
> ruled. FR numbers are not reused; the gap is deliberate.

**Epic 1 close-out.**

```
FR19: The composed publish job MUST be exercised end-to-end on a prerelease tag
      (`v4.0.1-rc.0`) before the release tag is pushed, and observed landing on `rc`.
      FR1-FR8 are eight edits to the same ~20 lines; each is rehearsable in isolation,
      the resulting job is not, and the job is what ships. One run proves FR1, FR2, FR3,
      FR4 and FR5 together.
      NOT a dry run — there is no `--dry-run` on this path. Because FR3 requires the tag
      to equal `package.json` version, the rehearsal requires committing
      `version: 4.0.1-rc.0` first, and it publishes a real prerelease that OVERWRITES the
      `rc` dist-tag (currently `4.0.0-rc.6`). Both are accepted costs; the story states
      them.                                                             [pre-mortem F1]
```

**Cluster 4.2 — Gates that check what actually ships.**

```
FR11: `npm run docs:audit` MUST run in CI. It exists, it was failing, and it is wired
      into no workflow.                                                       [T32]
FR12: CI MUST pack the tarball and resolve every relative link in every shipped `.md`,
      failing on any target absent from the package. Scope is DOCUMENTED REFERENCES only
      — it cannot see a file the code reads at runtime, which is FR13's class.
                                                                     [spine; absorbs I157]
FR13: The installed tree MUST be asserted to carry every shipped `_bmad/bme/*` module and
      every file in `files[]` that code reads at runtime. Implemented by extending
      `scripts/audit/try-fresh-install.sh` (already the CI `fresh-install` job), NOT by a
      new grep over `scripts/**` — grep is fragile against renames and dynamically built
      paths; an actual install is not. Absorbs **I153** (4.8), whose finding is that the
      harness's bin dependency check verifies only ONE hop.
                                     [spine; detection for I141 AND FR18; absorbs I153]
```

**Cluster 4.3 — Unreachable skills.**

```
FR14: `_bmad/bme/_portability/` MUST be reachable after install — it ships in `files[]`
      but no install path copies it, leaving 4 skills unreachable everywhere. [I141]
```

**Cluster 4.4 — Manifest truth.**

```
FR15: The broken skill dependencies in the shipped `skill-manifest.csv` MUST be
      repaired, with the count derived at implementation time rather than carried
      forward as a literal.                                                   [I134]
```

**Cluster 4.5 — Export robustness.** *(reassigned to Epic 2: a brace in a persona name
crashing the export is not a truth-telling defect — it is "the thing that ships does not
work", and it is a Forge prerequisite.)*

```
FR16: EVERY interpolated `RegExp` construction in `export-engine.js` MUST escape its
      interpolated value — not only the `u`-flag one. Enumerated mechanically per
      `mechanical-research-enumeration`: `:311` ('u'), `:390` ('mi'), `:499` ('g') and
      `:503` ('g') are unescaped; `:1070` already uses the `escapeRegExp` helper that is
      imported into this same file. Derive the count at implementation time; do not carry
      a literal forward.                                                      [T33]
```

**Cluster 4.6 — Honest warnings.** *(sequenced last)*

> **Coupling resolved by subtraction (2026-08-19).** An earlier draft split FR17 and FR18
> across two epics on an outcome grouping, leaving backlog row **BUG-19** closeable by
> neither alone and costing two coupling notes plus two bookkeeping ACs. Both now land in
> **Story 2.5**, which closes the row on its own and re-sorts the lane in the same edit.

```
FR17: A `convoke-doctor` check's label MUST agree with its own finding —
      `'BMM dependencies: registry present'` currently labels a check reporting the
      registry absent.                                                        [BUG-19(a)]
FR18: `_bmad/_config/bmm-dependencies.csv` MUST be in `package.json` `files[]`. It is
      git-tracked, so the warning stopped firing in this repo while nothing changed for
      any npm-installed operator — the population BUG-19 came from.           [BUG-19 files[]]
```

### NonFunctional Requirements

**All `project-context.md` rules apply to this epic as they do to all work in this
repository** — `test-fixture-isolation`, `no-hardcoded-versions`, `no-process-cwd-in-libs`,
`derive-counts-from-source`, `shared-test-constants`, `spec-verify-referenced-files`,
`mechanical-research-enumeration`, `verification-pipefail`, `lint-passes-before-review`,
`code-review-convergence`, `backlog-write-discipline`, `commit-preparation`. They are not
restated as NFRs here; restating standing rules implied this epic invented them and buried
the four below. One addition that is NOT yet a standing rule: **no line-level staging on
the backlog** — `3a3de195` deleted the T35 and T39 rows while claiming to repair them,
because both were modified, the diff carried `-old`/`+new`, and line staging took the `-`
side.

The four NFRs specific to this epic. Numbers are original; 3–7 and 9 were subtracted
2026-08-19 and are not reused.

```
NFR1: No `v*` tag may be pushed until FR1–FR8 clear. (a), (c) and (e) each mis-route a
      tagged publish. An rc needed before then is published by hand with `--tag rc`.
      EXEMPTION — the intent is *no tag that could reach `latest`*, not *no tag*. Once
      **FR1** lands, a prerelease tag provably routes to `rc`, so prerelease tags are
      permitted from that point. FR19 is by construction the first tag allowed. Without
      this clause NFR1 forbids the very run that proves FR1–FR8 — a loop caught in
      party-mode review 2026-08-18.
      The exemption depends on FR1 ALONE. An earlier draft also required FR5, which is
      wrong: FR5 guards against a DOWNGRADE of `latest`, and a prerelease never touches
      `latest`. Coupling them would have let the riskiest change in the epic — a network
      call inside the publish path — block the rehearsal that de-risks everything else.
NFR2: Every publish-path change MUST state its rehearsal strategy. The job runs only on
      a tag push, so a wrong edit costs a tag delete-and-repush; local reproduction of
      the expression is required before the change lands.
      ENFORCEMENT — this is not satisfied by the epic asserting it. Every Epic 1 story
      that edits the publish job carries an explicit AC requiring its rehearsal strategy
      to be recorded and its local reproduction shown. An NFR no acceptance criterion
      asks for is decoration; caught 2026-08-19.
NFR8: `preflight-soft-warn` MUST remain intact. BUG-19(b) is out of scope; FR17 fixes
      the label only and must not change the warn-and-exit-0 contract.
NFR10: Any gate introduced by this epic MUST be demonstrated FAILING against the pre-fix
      tree, with the failure output recorded in the story, before it is accepted. Instance
      repairs that would turn a gate green (FR14, FR18) are separate, later stories — a
      gate and its first fix must never land in the same story. `project-context.md`
      records two 2026-08-15 instances of checks that reported success without doing their
      work.                                                            [pre-mortem F2]
```

### Additional Requirements

Derived from source, in the absence of an Architecture document:

- The `publish` job is gated on eight jobs (`lint`, `test`, `python-test`, `coverage`,
  `security`, `package-check`, `agent-surface-parity`, `fresh-install`) and fires only on
  `refs/tags/v*`. It is the only automated path to the registry.
- npm OIDC registry authentication first ships in npm 11.5.x. Node 20 bundles npm 10.8.2,
  where absence of a token yields an *anonymous* publish and a 404 — the failure mode that
  made 4.0.0 look authenticated through four attempts.
- `package.json` `files[]` is an explicit allowlist, not a glob. `_bmad/_config/` is
  represented by a single entry (`skill-manifest.csv`); adding a file to that directory
  does not ship it.
- ~~`.github/workflows/badges.yml` fires only on changes to `_bmad/bme/_*/config.yaml`,
  `_bmad/_config/skill-manifest.csv` or `scripts/generate-badges-json.js`, and
  auto-commits with `[skip ci]`.~~ **No longer true as of 2026-08-21.** `badges.yml`,
  `scripts/generate-badges-json.js` and `docs/badges.json` were deleted by Story 1.1
  ([ADR-001](adr/4-0-1/adr-001-retire-badges-pipeline.md), option (a)). `.github/workflows/`
  now contains only `ci.yml`, and the `[skip ci]` auto-commit-to-`main` path no longer exists.
  Struck rather than deleted: Stories 1.2–1.7 are generated from this section, and the fact
  that this path *used to* exist is part of why FR9 is scoped as it is.
- 4.0.0 as published carries no provenance attestation and predates `3a3de195`; it is not
  reproducible from a tag. Nothing to undo — it is the baseline FR9 changes.

### UX Design Requirements

**N/A — no user interface.** Convoke 4.0.1 changes CI configuration, packaging
metadata, CLI diagnostics and an export code path. The operator-facing surface is
terminal output, governed by the Operator Covenant and `preflight-soft-warn` (NFR8),
not by a UX design contract.

### FR Coverage Map

```
FR1  Epic 1 — build metadata must not route a stable release to `rc`
FR2  Epic 1 — assert npm >= 11.5.1 (OIDC floor); don't trust the runner toolcache
FR3  Epic 1 — fail when git tag and package.json version disagree
FR4  Epic 1 — no unset _authToken in .npmrc masking an OIDC decline
FR5  Epic 1 — fetch registry `latest`, refuse a semver-lower publish to it
FR6  RETIRED by ADR-001 — badges pipeline deleted, guards protect nothing
FR7  RETIRED by ADR-001
FR8  RETIRED by ADR-001
FR9  Epic 1 — tag push is the only path to the registry
FR19 Epic 1 — composed end-to-end rehearsal on v4.0.1-rc.0                        [LAST]
FR11 Epic 2 — docs:audit runs in CI
FR12 Epic 2 — resolve every DOCUMENTED reference inside the package  [ADR-2 gates wiring]
FR13 Epic 2 — installed tree carries every shipped _bmad/bme/* and every runtime-read
              file in files[]  — extends try-fresh-install.sh; absorbs I153
FR14 Epic 2 — _portability reachable after install                     [turns FR13 green]
FR18 Epic 2 — bmm-dependencies.csv in files[]                          [turns FR13 green]
FR16 Epic 2 — escape every interpolated RegExp in export-engine.js
FR15 Epic 2 — repair broken skill dependencies (count derived at runtime)
FR17 Epic 2 — doctor label must agree with its finding    [same story as FR18: BUG-19]
```

All 18 FRs mapped; FR10 and FR20 retired to ADR-1 and ADR-2. No orphans.

## Epic List

### Epic 1: A release that reaches you correctly
Every Convoke release routes to the dist-tag it belongs on, comes from a committed tree,
and fails loudly rather than silently when it cannot authenticate. No operator is ever
downgraded by an upgrade.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR9, FR19 (FR6–FR8 retired by ADR-001)
**Gate:** 4.0.1 cannot ship until this epic completes (NFR1).
**Blocked on:** nothing — both ADRs gating this epic are accepted. **ADR-1 (2026-08-19)** retire,
so FR6–FR8 are retired and Epic 1 is 7 stories. **ADR-3 (2026-08-20)** option (a): FR9 is enforced
by the npm package setting *Require two-factor authentication and disallow tokens*, which is a
registry configuration, not code — and it lands LAST, after the rehearsal proves the automatic path.
**Story order:** retire the badges pipeline → FR1 → FR5 → FR3 → FR2/FR4 → **FR19 rehearsal → FR9 enforcement last** (transposed 2026-08-20 by ADR-003: prove the automatic path before switching off the manual one).
FR1 is deliberately alone and first after the badges call: it is a one-line change, it is
locally testable, and NFR1's prerelease exemption depends on it — so it unblocks the
rehearsal without waiting on FR5's registry call. Eight of these are edits to the same
~20 lines of a job that runs only on a tag push; FR19 is the only story that exercises
the composition, and it is the release rehearsal.

### Epic 2: The package contains what it promises
Everything an operator installs resolves and works: every link in the package points
inside it, every shipped skill tree has an install path that copies it, and the exporter
does not crash on a name it has never seen. Checked by CI, not by someone happening to
look.
**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18 · **also closes:** I153
**Blocked on:** nothing. **ADR-2 accepted 2026-08-20** — option (d): shrink the shipped surface,
then rule the remainder in three classes. The Covenant moves to `_bmad/bme/covenant/`.
**Story order — red before green (NFR10):** FR11 → FR12's gate built and **observed
failing** but NOT wired into CI → the remaining shipped-link violations fixed under ADR-2's
policy and the checker wired in blocking, same commit → FR13's assertion built and **observed
failing**, also not wired in → FR18 then FR14 as separate later stories, the last of which
turns it green and wires it in. FR16 and FR15 are independent and may run in parallel.
Nothing is ever merged red: `fresh-install` gates every PR and every publish.
**Two detection classes, deliberately distinct.** FR12 sees documented references; FR13
sees what actually arrives on disk after an install. `bmm-dependencies.csv` is referenced
by NO shipped markdown — it is read at runtime by `convoke-register-skill.js:376` and the
doctor — so FR12 cannot detect it and FR13 must. An earlier draft claimed FR18 turned
FR12 green; it does not.


---

## Epic 1: A release that reaches you correctly

Every Convoke release routes to the dist-tag it belongs on, comes from a committed tree, and fails loudly rather than silently when it cannot authenticate. No operator is ever downgraded by an upgrade.

**FRs:** FR1–FR5, FR9, FR19 (FR6–FR8 retired by ADR-001) · **NFRs:** NFR1, NFR2
**Blocked on:** nothing. **ADR-1 (2026-08-19)** — retire: Story 1.1b struck, FR6–FR8 retired, Epic 1 = 7 stories. **ADR-3 (2026-08-20)** — option (a): FR9 is enforced by an npm package setting rather than code, and lands last.
**Gate:** 4.0.1 cannot ship until this epic completes.

### Story 1.1: Retire the badges pipeline

*Covers ADR-001, accepted 2026-08-19. Closes T40 (9.5), I108 (1.4) and CR-README-D03.*

As a Convoke maintainer,
I want the badges pipeline removed from the publish path,
So that a release is never blocked by a file no document consumes.

**Acceptance Criteria:**

**Given** `package.json` declares `prepublishOnly: npm run badges:check`
**When** this story completes
**Then** `prepublishOnly` no longer invokes `badges:check`
**And** if the key is left empty it is removed rather than left declaring nothing
**And** `docs/badges.json`, `scripts/generate-badges-json.js`, `.github/workflows/badges.yml` and the `badges` / `badges:check` scripts are removed together, or the ADR records explicitly which are kept and why
**And** `knip.json`'s entry for the generator is removed in the same commit
**And** `CR-README-D03` (`deferred-work.md:957`) is marked resolved
**And** T40 and I108 are closed in the backlog, each moved below its lane's live block with the lane-order check run in the same edit

**Given** NFR2 — removing `prepublishOnly` is a publish-path change, and the publish job runs only on a `refs/tags/v*` push
**When** the story records its rehearsal strategy
**Then** it states that live verification is **deferred to Story 1.6's composed rehearsal**, and does not claim `npm publish --dry-run` as evidence — whether `--dry-run` fires lifecycle scripts is version-dependent and unverified. Locally verifiable instead: the three keys are absent and nothing invokes them
*(Gap found by the 2026-08-20 story validation: every other publish-path story in this epic carried an NFR2 criterion and this one did not.)*

**Given** `project-context.md:359` uses `npm run badges:check | tail -8; echo $?` as row 1 of the evidence table in the `verification-must-be-falsifiable` rule
**When** the script no longer exists
**Then** the example is annotated as a historical scar story rather than a runnable command — it remains valid as history and must not be deleted

**Given** `.github/workflows/ci.yml:221` comments that *"`prepublishOnly` (the one that exists) does NOT fire on pack"*
**When** the hook is removed
**Then** that comment is corrected in the same commit

### Story 1.1b: Harden the badge generator guards — STRUCK

*Struck 2026-08-19 by [ADR-001](adr/4-0-1/adr-001-retire-badges-pipeline.md), which ruled **retire**. FR6, FR7 and FR8 are retired, not deferred: the guards protected the correctness of a generated file with no consumer, and the file is being deleted. Number not reused.*

### Story 1.2: Strip build metadata before the prerelease test

*Covers FR1. Deliberately alone and first: one line, locally testable, and NFR1's prerelease exemption depends on this story alone — it unblocks Story 1.7 without waiting on Story 1.3.*

As a Convoke operator,
I want a stable release to reach `latest` even when its version carries build metadata,
So that a release I am meant to receive is not parked on `rc` where I never see it.

**Acceptance Criteria:**

**Given** `VERSION=4.0.0+sha.5114f85-dirty`
**When** the publish job derives `DIST_TAG`
**Then** it resolves `latest` — the `+` suffix is stripped before the hyphen test

**Given** `VERSION=4.1.0-rc.1`
**When** the job derives `DIST_TAG`
**Then** it resolves `rc`

**Given** NFR2
**When** the story is completed
**Then** the story records the local reproduction of the derivation across all four cases (stable, stable+metadata, prerelease, prerelease+metadata), requiring no tag push

### Story 1.3: Refuse a semver-lower publish to `latest`

*Covers FR5.*

As a Convoke operator,
I want a maintenance release never to move me backwards,
So that a `3.3.1` cannot downgrade me from 4.0.0.

**Acceptance Criteria:**

**Given** the registry's `latest` is `4.0.0` and `VERSION=3.3.1`
**When** the publish job runs
**Then** it fails before `npm publish`, printing both versions

**Given** the job needs the current `latest`
**When** it makes the comparison
**Then** it fetches the value from the registry — a `package.json`-only check cannot decide this, because `ci.yml` queries the registry nowhere today

**Given** the registry is unreachable
**When** the comparison is attempted
**Then** the job fails closed
**And** the story cites `ci.yml:243-246` as precedent — the `fresh-install` job already accepts that a transient registry failure blocks a tag publish exactly as a real defect would, recoverable by re-running. The trade-off is settled; it is not re-argued here

**Given** NFR2
**Then** the story records its rehearsal strategy

### Story 1.4: Fail when the tag and the version disagree

*Covers FR3.*

As a Convoke operator,
I want the tag I see on GitHub to name the version I get from npm,
So that a release is identifiable from either side.

**Acceptance Criteria:**

**Given** tag `v4.0.1` and `package.json` version `4.1.0-rc.1`
**When** the publish job runs
**Then** it fails before `npm publish`, printing both values
**And** `github.ref_name` is referenced in the job — it appears nowhere today, which is why BUG-15 shipped half its own acceptance text

**Given** tag `v4.0.1` and version `4.0.1`
**When** the job runs
**Then** the check passes and publication proceeds

**Given** NFR2
**Then** the story records its rehearsal strategy

### Story 1.5: Make authentication failure loud

*Covers FR2, FR4.*

As a Convoke maintainer,
I want the publish job to fail rather than publish as nobody,
So that a broken release never looks like a successful one.

**Acceptance Criteria:**

**Given** the runner resolves an npm below 11.5.1
**When** the publish job starts
**Then** it fails with a message naming the OIDC registry-auth floor — `setup-node` defaults `check-latest: false` and 8 of the released 24.x lines bundle npm 11.3.0–11.4.2, so this currently works by luck of the runner toolcache

**Given** no `NODE_AUTH_TOKEN` is set
**When** the job prepares to publish
**Then** `.npmrc` does not carry `_authToken=${NODE_AUTH_TOKEN}` — npm currently sends the literal 14-character string, so an OIDC decline surfaces as *bad token* rather than *no token*
**And** publishing identity is asserted before `npm publish` by whatever means the OIDC path exposes
**And** the story first verifies that a pre-publish identity check is possible at all, since the credential is minted at publish time and `npm whoami` may have nothing to check

**Given** NFR2
**Then** the story records its rehearsal strategy

### Story 1.6: Rehearse the composed job before the release tag

*Covers FR19. Transposed with the former 1.6 on 2026-08-20 by [ADR-003](adr/4-0-1/adr-003-publish-path-enforcement.md): the rehearsal must prove the automatic path works BEFORE the manual path is switched off, or there is no way to ship at all.*

As a Convoke maintainer,
I want the whole publish job exercised once on a prerelease,
So that the release tag is not the first time these changes run together.

**Acceptance Criteria:**

**Given** Stories 1.1–1.5 are complete
**When** `package.json` is set to `4.0.1-rc.0` and tag `v4.0.1-rc.0` is pushed
**Then** the job publishes to the `rc` dist-tag and not `latest`
**And** `npm view convoke-agents dist-tags` shows `latest` unchanged
**And** `dist.attestations` on the published prerelease is non-null

**Given** the trusted-publisher configuration for `convoke-agents` was created on 2026-08-17, after npm's 20 May 2026 cutoff, so at least one allowed action had to be selected explicitly
**When** this story starts
**Then** it is verified FIRST that `npm publish` is among the selected allowed actions — inspectable via `npm trust github convoke-agents --file ci.yml --repo amalik/convoke-agents --dry-run`. If it is absent, the tag push fails at the write and the failure resembles the anonymous-publish 404 already diagnosed four times

**Given** this is not a dry run
**When** the story is planned
**Then** it records that the `rc` dist-tag is overwritten (currently `4.0.0-rc.6`) and that a real prerelease reaches the registry — both accepted costs

**Given** NFR1's tag freeze
**When** `v4.0.1-rc.0` is pushed
**Then** it is permitted under NFR1's exemption, because Story 1.2 landed FR1 and a prerelease provably routes to `rc` — the exemption depends on FR1 alone, not on FR5

### Story 1.7: Make the CI path the only path to the registry

*Covers FR9 / T35. Mechanism set by [ADR-003](adr/4-0-1/adr-003-publish-path-enforcement.md), accepted 2026-08-20: option (a). **Last story in the epic** — it must not run before Story 1.6 is green.*

As a Convoke operator,
I want every published build to come from a committed tree by construction,
So that testing against a published version tells me something true about the source.

**Acceptance Criteria:**

**Given** ADR-003 ruled option (a), and enforcement is an npm per-package setting rather than a repository change
**When** this story completes
**Then** **Require two-factor authentication and disallow tokens** is enabled at Package Settings → Publishing access for `convoke-agents`
**And** the deliverable is that configuration plus its documentation — there is no code change, and the acceptance evidence is the registry's behaviour, not a file in this repository

**Given** Story 1.6's rehearsal has published `4.0.1-rc.0` through the CI job with a non-null attestation
**When** this story starts
**Then** that evidence is confirmed first. Disabling the manual path before the automatic one is proven would leave no way to ship at all

**Given** the setting removes the emergency escape hatch, and this project's publish job was broken as recently as 2026-08-17
**When** this story completes
**Then** a break-glass procedure is documented: where the setting lives, who can disable it, that any hand-publish performed while it is disabled is logged as an incident, and that it is re-enabled immediately afterwards. An escape hatch written down is a control; one rediscovered under pressure is the status quo

**Given** a release published after this story
**When** its npm metadata is inspected
**Then** `dist.attestations` is non-null — 4.0.0 as shipped is `null`, which is the evidence it did not come through this path
**And** T35 is closed against this story, with options (b) and (c) recorded as declined

**Given** NFR2
**Then** the story records its rehearsal strategy — noting that this change is not exercised by a CI run, so its verification is a registry-side check plus a deliberate negative test if one can be performed safely

---

## Epic 2: The package contains what it promises

Everything an operator installs resolves and works: every documented reference points inside the package, every shipped skill tree actually arrives on disk, and the exporter does not crash on a name it has never seen. Checked by CI, not by someone happening to look.

**FRs:** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18 · **also closes:** I153 · **NFRs:** NFR10 (load-bearing), NFR8
**Blocked on:** nothing — **ADR-2 accepted 2026-08-20** (option d, three classes; Covenant → `_bmad/bme/covenant/`). Story 2.3 carries the policy application and the wiring.
**Story order — red before green (NFR10), and never merged red:** 2.1 → 2.2 (checker built, observed failing, NOT wired in) → 2.3 (policy applied, checker wired in blocking, same commit) → 2.4 (assertion built, observed failing, NOT wired in) → 2.5 (registry shipped) → 2.6 (`_portability` reachable + assertion wired in blocking, same commit). **2.7 and 2.8 are independent** and may run at any point.
**Why nothing merges red.** `fresh-install` runs on push to `main` and every pull request, and the `publish` job `needs:` it. A gate merged in a failing state there blocks every PR and every release until its fix lands. NFR10 requires each gate *demonstrated* failing; it does not require it *merged* failing.

### Story 2.1: Run the docs audit in CI

*Covers FR11.*

As a Convoke operator,
I want the documentation audit to run on every change,
So that a broken instruction in the docs is caught before it reaches me.

**Acceptance Criteria:**

**Given** `docs:audit` is declared at `package.json:52` and referenced in no workflow
**When** this story completes
**Then** it runs as a CI job on push and pull request

**Given** the audit passes today (exit 0, zero findings, "Registry: 7 agents, 22 workflows")
**When** the job is accepted under NFR10
**Then** a known docs violation is introduced temporarily and the CI job observed **red**, with the failure output recorded — a gate wired in green has never been shown to work

### Story 2.2: Assert every documented reference resolves inside the package

*Covers FR12. Delivers the checker and its red demonstration only — Story 2.3 wires it into CI. `continue-on-error` appears nowhere in this epic: a gate nobody watches is T32, the row this epic exists to close.*

As a Convoke operator,
I want every link in what I installed to point at something I have,
So that "required reading" is readable by someone who installed from npm.

**Acceptance Criteria:**

**Given** `scripts/audit/try-fresh-install.sh` already runs `npm pack` as its first step
**When** the checker is written
**Then** it is written to run against that harness's packed tarball rather than packing its own — a second pack is a parallel mechanism, the criticism this epic levels at grep-based detection
**And** it is NOT wired into CI by this story. `fresh-install` is one of the eight jobs the `publish` job `needs:`, so anything landing there blocks releases from the moment it merges — which `continue-on-error` cannot express inside a gating job, and which NFR10 forbids landing alongside its own first fix. Story 2.3 wires it in

**Given** the packed tarball (455 files today)
**When** the gate runs
**Then** it resolves every relative link in every shipped `.md` and fails on any target absent from the package

**Given** the tree as it stands
**When** the gate first executes
**Then** it is observed **failing**, with output recorded (NFR10), on at least: `_bmad/bme/README.md`'s three links to the Covenant, the Compliance Checklist and `project-context.md`; seven link instances in `scripts/migration/format-conversion/README.md`; and `CHANGELOG.md`'s link to `docs/migration/3.x-to-4.0.md`, since `docs/` is not in `files[]`

**Given** this gate resolves documented references only
**When** its scope is documented
**Then** the story states explicitly that it CANNOT detect a file read at runtime but absent from the package — that class is Story 2.4's — so no one assumes coverage it does not have

### Story 2.3: Apply the shipped-link policy and wire the gate in, blocking

*No FR of its own; it is what makes FR12 enforceable. Scope set by [ADR-002](adr/4-0-1/adr-002-shipped-link-policy.md), accepted 2026-08-20 — option (d), three classes. **20 broken relative links across 4 files**, enumerated mechanically against the packed tarball.*

As a Convoke operator,
I want the link gate actually enforced,
So that the next broken reference is caught by CI rather than by someone reading carefully.

**Acceptance Criteria:**

**Given** Class 1 — 13 of the 20 findings are in `scripts/migration/format-conversion/`, one-off i97 tooling that no `bin` references and that reaches the tarball only because `files[]` carries `scripts/` wholesale
**When** this story completes
**Then** that directory is excluded from `files[]`, and no link in it is edited — the package boundary was misplaced, not the links
**And** it is verified first that nothing in `scripts/update/**`, no bin, and no test resolves into that directory at runtime

**Given** Class 2 — the Covenant and the Compliance Checklist are normative required reading (`project-context.md:5`) living in generated-artifact space
**When** this story completes
**Then** both are moved to `_bmad/bme/covenant/covenant-operator.md` and `_bmad/bme/covenant/compliance-checklist.md`, and `_bmad/bme/covenant/` is added to `files[]`
**And** all **47** referencing files are updated, enumerated by `grep -rl 'convoke-covenant-operator\|convoke-spec-covenant-compliance-checklist'` re-run at implementation time rather than trusting this count
**And** the four non-prose references are handled explicitly: `_bmad/_config/taxonomy.yaml:56` (names the file in the `covenant` artifact-type definition), `scripts/audit/reference-integrity.js`, `scripts/migration/format-conversion/covenant-survival-harness.js` (or let it go with the Class 1 exclusion — decide, do not drift), and `tests/lib/artifact-utils.test.js`

**Given** BUG-13 — `updateLinks` (`scripts/lib/artifact-utils.js:1497`, called at `:1635`) applies every rename-map entry sequentially over the same buffer, so an entry can rewrite text a previous entry produced
**When** a two-entry rename map is applied across 47 files
**Then** the story ASSERTS that neither new basename equals the other entry's old basename, and verifies the rewritten links by re-running the tarball checker — it does not assume the collision cannot occur. BUG-13 is Open (5.7) and out of scope for 4.0.1

**Given** Class 3 — `CHANGELOG.md` carries 3 findings
**When** this story completes
**Then** `docs/migration/` is added to `files[]` — the migration guide is the single most useful link an upgrading npm reader can follow — and the ADR link plus `docs/BMAD-METHOD-COMPATIBILITY.md` are dropped from the shipped CHANGELOG or rendered as absolute URLs with CR-README-D05's instability accepted on the record

**Given** `_bmad/bme/README.md` links `_bmad/bme/config.yaml`, which is not in `files[]` while the README itself is in the tarball
**When** this story completes
**Then** the asymmetry is resolved deliberately — ship the config or drop the link — rather than left inherited
**And** its link to `project-context.md` becomes an absolute URL or is dropped: contributor governance is repository-only and, unlike the Covenant, is not required reading for a user

**Given** all 20 findings are resolved
**When** this story completes
**Then** the checker from Story 2.2 is wired into `try-fresh-install.sh` as a blocking check, in the same commit that turns it green — it is never merged non-blocking. A gate that runs and nobody watches is T32, the row this epic exists to close

**Given** CR-README-D04 — `scripts/docs-audit.js`'s `checkBrokenLinks` skips `^https?://` entirely
**When** any link is rewritten as an absolute URL
**Then** either FR12's checker validates absolute URLs too, or the policy forbids them in shipped docs — converting a broken relative link into an unvalidated absolute one trades a detectable fault for an undetectable one

**Given** the package shrinks
**When** this story completes
**Then** `agent-surface-parity` and `fresh-install` are both re-run, since both assert against the packed tree

### Story 2.4: Assert the installed tree carries what was shipped

*Covers FR13; absorbs I153. Delivers the assertion and its red demonstration only — Story 2.6 wires it into the gating path, symmetric with 2.2 → 2.3.*

As a Convoke operator,
I want everything in the package to actually arrive when I install,
So that a file cannot ship and be unreachable at the same time.

**Acceptance Criteria:**

**Given** `scripts/audit/try-fresh-install.sh` already packs, installs, and runs doctor and export as the CI `fresh-install` job
**When** this story completes
**Then** the assertion is written against that harness rather than as a new grep over `scripts/**` — grep is fragile against renames and dynamically built paths; an actual install is not
**And** it is NOT placed in the harness's failure path by this story. `fresh-install` runs on push to `main` and on every pull request, and the `publish` job `needs:` it — merging an assertion that is required to be red would block every PR and every release until Stories 2.5 and 2.6 land. Story 2.6 wires it in

**Given** an installed package
**When** the harness runs
**Then** it fails if any shipped `_bmad/bme/*` module is absent from the installed tree
**And** it fails if any file in `files[]` that code reads at runtime is absent

**Given** I153 — the harness's bin dependency check resolves only ONE hop, so most bins' real dependency surface is unchecked
**When** this story completes
**Then** the check walks the full dependency surface, and I153 is closed against this story

**Given** the tree as it stands
**When** the assertion is run against it
**Then** it is observed **failing** on both `_bmad/bme/_portability/` and `_bmad/_config/bmm-dependencies.csv`, with output recorded (NFR10) — demonstrated, not merged red

### Story 2.5: Close BUG-19 — ship the registry and fix the label that contradicts it

*Covers FR18 and FR17 — both halves of backlog row BUG-19. An earlier draft split them across two epics on an outcome grouping; that cost two coupling notes and two bookkeeping ACs, and left a row neither epic could close. Subtracted 2026-08-19.*

As a Convoke operator,
I want `convoke-doctor` to find the dependency registry after an npm install,
So that a healthy install does not warn me about a file that simply was not shipped.

**Acceptance Criteria:**

**Given** `_bmad/_config/bmm-dependencies.csv` is git-tracked but absent from `files[]` — the tarball's only `_bmad/_config/` entry is `skill-manifest.csv`
**When** this story completes
**Then** the file is in the package

**Given** a fresh npm install in a clean project
**When** `convoke-doctor` runs
**Then** the BMM-dependency check does not report the registry absent
**And** the check is run against an INSTALLED PACKAGE, not against this repository — the repo has reported `✓ registry consistent` since the file was committed, while nothing changed for any npm-installed operator

**Given** `scripts/convoke-doctor.js:766-773` emits `name: 'BMM dependencies: registry present'` on the branch whose `warning` reads `bmm-dependencies.csv not found — governance registry has not been generated yet` (FR17)
**When** this story completes
**Then** the check's label is true in BOTH branches, present and absent
**And** `softWarning: true` and the exit-0 pass-through are untouched per NFR8 — this is a string fix, not a contract change; BUG-19(b) remains out of scope
**And** the `fix:` line's pinning to the running build (`npx -p convoke-agents@${pv}`, per BUG-16) is preserved

**Given** the label fix and the packaging fix are both in this story
**When** it completes
**Then** backlog row BUG-19 is closed by it alone, and the row is moved below the live block with the lane-order check run in the same edit

*The label still matters after the registry ships: the absent branch stops firing for npm-installed operators, but not for anyone whose registry has genuinely not been generated.*

### Story 2.6: Make `_portability` reachable, and wire the installed-tree assertion in

*Covers FR14. Turns Story 2.4's remaining finding green and, in the same commit, puts the assertion into the gating path — the last of the two fixes carries the wiring.*

As a Convoke operator,
I want the portability skills to be usable after I install,
So that a capability that ships is a capability I have.

**Acceptance Criteria:**

**Given** `_bmad/bme/_portability/` ships in `files[]` but is referenced nowhere in `scripts/update/lib/*.js` or `scripts/*.js`
**When** an install or refresh runs
**Then** the tree is copied into the project by the same mechanism as the other `_bmad/bme/*` modules

**Given** a fresh install
**When** the portability skills are invoked
**Then** they resolve

**Given** Story 2.5 has already shipped `bmm-dependencies.csv` and this story makes `_portability` reachable, so Story 2.4's assertion now has no findings
**When** this story completes
**Then** the assertion is wired into `try-fresh-install.sh`'s failure path, blocking, in the same commit that turns it green — never merged red into a job that gates every PR and every publish

**Given** NFR6
**When** any count of affected skills appears
**Then** it is derived at implementation time, not carried forward as a literal

### Story 2.7: Escape every interpolated regex in the exporter

*Covers FR16. Independent of 2.1–2.6; may run in parallel. Forge prerequisite.*

As a Convoke maintainer,
I want the exporter to survive any persona name,
So that authoring a new team does not crash the export in a way that surfaces nowhere near its cause.

**Acceptance Criteria:**

**Given** the interpolation sites in `scripts/portability/export-engine.js`
**When** this story completes
**Then** every interpolated `RegExp` construction escapes its value, using the `escapeRegExp` helper already imported into that file
**And** the enumeration is re-run mechanically at implementation time rather than trusting this list: `:311` (`u`), `:390` (`mi`), `:499` (`g`) and `:503` (`g`) are unescaped today; `:1070` already escapes

**Given** a persona name containing `{`, `}`, `(`, `[` or `\`
**When** the export runs
**Then** it completes without throwing
**And** a committed test covers that input, demonstrated failing against the pre-fix code

### Story 2.8: Repair the broken dependencies in the shipped manifest

*Covers FR15 / I134. Moved here from a former Epic 3 when that epic was subtracted — the manifest ships and its dependencies do not resolve, which is this epic's subject read literally.*

As a Convoke operator,
I want the skill manifest's dependencies to resolve,
So that a skill I invoke does not reach for a template that is not there.

**Acceptance Criteria:**

**Given** the four `[BROKEN-DEP]` findings recorded in `.github/expected-classification-findings.txt` — `bmad-check-implementation-readiness` → `../templates/readiness-report-template.md`; `bmad-create-epics-and-stories` → `../templates/epics-template.md`; `wds-4-ux-design` → `../templates/page-specification.template.md` and `./templates/diagnostic-report-template.md`
**When** this story runs
**Then** each is individually confirmed and resolved — path corrected, or dependency dropped if the template is genuinely gone
**And** the evidence for each is recorded separately. The row notes these are "consistent with upstream `a16fa340` deleting vendored content", but consistent is not confirmed

**Given** the baseline file can only shrink
**When** a dependency is fixed
**Then** its line is deleted from `.github/expected-classification-findings.txt` in the same commit — Test 1b fails on any NEW finding and also fails on a FIXED one until its line is removed
**And** no line is ever ADDED to that file to make a test pass

**Given** NFR6
**When** the set is enumerated
**Then** it is derived from the manifest at implementation time, not from the count "four" in this document

**Given** `portability-validation` Test 1 was skipped from 2026-06-27 until I123 un-quarantined it on 2026-08-14 — so nothing checked the manifest for roughly six weeks
**When** this story completes
**Then** it confirms Test 1 is running rather than skipped
