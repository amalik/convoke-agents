# Story 1.7: Make the CI path the only path to the registry

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Convoke operator,
I want every published build to come from a committed tree by construction,
so that testing against a published version tells me something true about the source.

## ⚠️ READ THIS FIRST — three things that make this story unlike the other six

**1. There is no code change. The deliverable is a registry setting plus documentation.**
Nothing in this repository can enforce FR9. Tasks marked **OPERATOR STEP** are handed to Amalik
with exact instructions and a HALT. Do not simulate them and do not mark them complete on the
operator's behalf.

**A CLI setter does exist — `npm access set mfa=none|publish|automation <pkg>` — and AC1 still
uses the web UI deliberately.** npm's own documentation for `npm access` lists the three values and
**defines none of them**, and there is **no read-back command**: `npm access get status` returns
only public/private. So the CLI can set the policy but cannot show you which policy is in force,
and picking `automation` instead of `publish` would silently select the *weaker* option with no way
to notice. The web UI names both options in full and shows which is selected. **Use the UI because
the result is verifiable, not because the CLI is absent.**

**2. The epic's own framing contains a factual error, corrected below.** ADR-003 claims the setting
makes a laptop publish *"impossible"*. It does not. npm's documentation is explicit that the
setting **requires** interactive human publishing rather than blocking it. This changes what the
story can honestly claim and what T35's closure can assert. See **AC6** and **Dev Notes §1**.

**3. This story removes a capability. Order is load-bearing.** Confirm the automatic path works
*before* disabling the manual one. That precondition is already satisfied — see **AC2** — but it
must be re-verified at implementation time, not assumed from this file.

## Acceptance Criteria

**AC1 — The setting is enabled.**
**Given** ADR-003 ruled option (a), and enforcement is an npm per-package setting rather than a
repository change
**When** this story completes
**Then** **Require two-factor authentication and disallow tokens** is enabled at
**Package Settings → Publishing access** for `convoke-agents`
**And** the deliverable is that configuration plus its documentation — there is no code change, and
the acceptance evidence is the registry's behaviour, not a file in this repository.

*Setting name verified verbatim against npm's live documentation 2026-08-23 (two independent pages,
both current). It is not stale.* [Source: https://docs.npmjs.com/trusted-publishers/]

**AC2 — The automatic path is confirmed working first.**
**Given** Story 1.6's rehearsal has published `4.0.1-rc.0` through the CI job with a non-null
attestation
**When** this story starts
**Then** that evidence is confirmed **by running the check, not by reading this file** — disabling
the manual path before the automatic one is proven would leave no way to ship at all.

Command and expected result:

    npm view convoke-agents@4.0.1-rc.0 dist.attestations   # -> non-empty (url + provenance)
    npm view convoke-agents@4.0.0     dist.attestations   # -> EMPTY, the contrast that proves the point

*Both were run 2026-08-23 and returned exactly that. Re-run anyway — this AC is the safety
interlock for an irreversible-in-practice change.*

**AC3 — The account's 2FA MODE is confirmed sufficient for interactive publishing.**
**Given** 2FA is enabled on the operator account in **`auth-only`** mode — measured 2026-08-23 via
`npm profile get --json` → `tfa: {'pending': None, 'mode': 'auth-only'}`
**When** AC4's primary break-glass depends on interactive publishing actually working
**Then** it must be established that `auth-only` satisfies the package setting's interactive-publish
requirement — because npm's documentation **does not state** whether a package-level publishing-access
policy overrides an account-level `auth-only` mode, and the alternative mode is `auth-and-writes`.

**This is an open question, not a resolved one.** It is resolved by observation in Task 5, not by
reasoning. If interactive publishing turns out not to work under `auth-only`, the fix is
`npm profile enable-2fa auth-and-writes` — an account-wide change, so it is the operator's call.

*This AC did not exist in the epic. It is added because AC6's correction makes the human path
load-bearing: the break-glass depends on interactive publishing being available.*

**AC4 — A break-glass procedure is documented.**
**Given** the setting restricts the emergency escape hatch, and this project's publish job was
broken as recently as 2026-08-17
**When** this story completes
**Then** a break-glass procedure is documented: where the setting lives, who can change it, that
any hand-publish is logged as an incident, and how normal service is restored.

**AMENDED from the epic's wording, which assumed the only break-glass was disabling the setting.**
There are two, and the epic's is the worse one:

- **Primary — interactive publish with 2FA.** Permitted *while the setting remains enabled*.
  Requires no configuration change, so there is **no window during which the control is off**.
- **Secondary — disable the setting.** Only if the primary is unavailable (e.g. 2FA cannot be
  satisfied). This is the one that opens a window, so it is the fallback, not the default.

The procedure MUST present them in that order and state why. *An escape hatch written down is a
control; one rediscovered under pressure is the status quo* — and an escape hatch that needlessly
disables the control is worse than one that does not.

**AC5 — Attestation evidence, and T35's disposition.**
**Given** a release published after this story
**When** its npm metadata is inspected
**Then** `dist.attestations` is non-null — 4.0.0 as shipped is empty, which is the evidence it did
not come through this path.

**AMENDED — T35 cannot be closed as fully fixed by this story.** The epic says *"T35 is closed
against this story, with options (b) and (c) recorded as declined."* Options (b) and (c) are
correctly declined and MUST be recorded as such. But T35's headline is *"hand-publishing bypasses
the entire CI publish gate"*, and after this change a 2FA maintainer can still hand-publish
interactively. What the setting actually closes is the **token/automation vector** — which is the
vector the observed incidents used (see Dev Notes §2). **The disposition of T35 is an operator
decision, recorded in Task 6, not something this story decides unilaterally.**

**AC6 — The ADR-003 factual error is corrected in place.**
**Given** ADR-003 states *"A laptop `npm publish` stops being a discouraged practice and starts
being impossible"*
**When** this story completes
**Then** that sentence is corrected, because npm's documentation says the opposite:

> "a maintainer must have two-factor authentication enabled for their account, and they must
> publish interactively. Maintainers will be required to respond to a 2FA prompt when they perform
> the publish."
> …
> "Granular access tokens cannot be used to publish packages, regardless of their bypass 2FA
> setting."
> [Source: https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/]

**And** the correction is an **Amendment entry**, not a rewrite — ADR-003's reasoning and its
accepted decision both stand; only the overclaim about what option (a) achieves is wrong. Option
(a) remains the correct choice: it is still the only option that enforces anything.

**AC7 — Rehearsal strategy is recorded (NFR2), including a negative test.**
**Given** NFR2
**Then** the story records its rehearsal strategy — noting that this change is **not exercised by a
CI run**, so its verification is a registry-side check plus a deliberate negative test.

The negative test is specified, safe, and falsifiable — see **Task 5**, including the branch where
it is **inconclusive by construction** (a dead credential fails identically to an enforced policy).
A recorded strategy that was never executed does not satisfy this AC, and neither does a probe that
could not have distinguished the two outcomes.

**AC8 — The trusted-publisher allowed-actions question is closed with evidence.**
**Given** ADR-003's corollary 2 warns that configurations created after 2026-05-20 must explicitly
select allowed actions, and Convoke's was created 2026-08-17
**When** this story completes
**Then** the question is recorded as **resolved by observation**: `4.0.1-rc.0` published
successfully through trusted publishing on 2026-08-22, which is only possible if `npm publish` is
among the selected allowed actions.
**And** no further verification is required — a successful publish is stronger evidence than
reading the setting back.

## Tasks / Subtasks

- [ ] **Task 1 — Re-verify the precondition before touching anything (AC: 2)**
  - [ ] Run both `npm view` commands from AC2. Record raw output in the Debug Log.
  - [ ] **HALT if `4.0.1-rc.0` attestations are empty.** That would mean the CI path is not proven
        and this story must not proceed.
  - [ ] Confirm `git status` is clean and `main` is in sync with origin.

- [ ] **Task 2 — Confirm the 2FA mode still reads `auth-only` (AC: 3)**
  - [ ] Run `npm profile get --json` and read the `tfa` field. Record it verbatim.
  - [ ] **Expected:** `{'pending': None, 'mode': 'auth-only'}` (measured 2026-08-23).
  - [ ] If it reads `auth-and-writes`, the AC3 open question is moot — record that and move on.
  - [ ] **Do NOT change the account 2FA mode as part of this task.** It is account-wide, it affects
        every package the operator owns, and Task 5 determines whether it is even necessary.

- [ ] **Task 3 — Write the break-glass playbook (AC: 4)**
  - [ ] Create `docs/npm-publishing-access-playbook.md`.
  - [ ] Content, in this order: what the setting is and where it lives (npmjs.com →
        `convoke-agents` → Settings → Publishing access); who can change it (package owners /
        org admins); **primary break-glass** (interactive publish with 2FA, no setting change);
        **secondary break-glass** (disable the setting — with the explicit note that this opens a
        window and must be re-enabled immediately); the incident-logging requirement (any
        hand-publish is logged as a T35 instance with date, version and reason); and how to verify
        afterwards (`npm view convoke-agents@<v> dist.attestations` — a hand-published version
        will be empty, and that is the durable marker).
  - [ ] Do **NOT** add the file to `USER_FACING_DOCS` in `scripts/docs-audit.js` — it is a
        maintainer runbook, not shipped user documentation. `docs/` contributes **0 files** to the
        tarball (verified), so it is repo-only by construction.
  - [ ] Run `node scripts/audit/reference-integrity.js` — any links in the new file must resolve.

- [ ] **Task 4 — OPERATOR STEP: enable the setting (AC: 1)**
  - [ ] **Only after Tasks 1–3 are complete.**
  - [ ] Present exact navigation: npmjs.com → `convoke-agents` → **Settings** →
        **Publishing access** → select **"Require two-factor authentication and disallow tokens"**
        → Save.
  - [ ] HALT and wait for the operator to confirm it is saved. Record the confirmation.

- [ ] **Task 5 — Execute the negative test (AC: 7)**
  - [ ] **Safety analysis, stated before the command is run:** the probe attempts to publish a
        version that **already exists on the registry** (`4.0.1-rc.0`). npm refuses to overwrite an
        existing version, so the attempt **cannot mutate the registry** on any code path — it
        cannot create a version and cannot move a dist-tag. The only outcome is an error, and
        *which* error is the measurement.
  - [ ] **FIRST establish a working baseline, or the probe proves nothing.** Run `npm whoami`.

        - **exit 0** → the credential authenticates; the probe below is meaningful. Proceed.
        - **exit non-zero (E401)** → **the probe is INCONCLUSIVE and must be recorded as such.**
          A dead credential returns an auth error whether or not the setting is enabled, so a
          failed publish would be indistinguishable from success. **Do not record that as a pass.**

        *The credential lapsed and was restored by an operator login at 11:43 on 2026-08-23;
        `npm whoami` → `amalik`, exit 0. See Dev Notes §2 — re-run rather than trusting this note.*
  - [ ] **If the baseline is green**, from the laptop run:

            npm publish --tag rc 2>&1 | tail -20

        *(the working tree is at `4.0.1-rc.0`; if it is not, do not adjust the version to make the
        probe work — re-read Task 5's premise instead)*
  - [ ] **Expected:** an authorisation/forbidden error naming the tokens policy — evidence the
        setting is live. **Not expected:** `EPUBLISHCONFLICT`, which would mean the request passed
        authentication and was rejected only for being a duplicate — i.e. **the token still has
        publish authority and the setting is NOT in effect.**
  - [ ] Record the verbatim error. **The distinction between those two errors is the entire test** —
        do not record "it failed" as a pass.
  - [ ] **If the baseline is red**, the falsifiable substitute is the *positive* control: the next
        CI publish must still succeed with a non-null attestation. That proves the setting did not
        break the OIDC path, which is the risk that actually matters. Record it as the substitute
        and say plainly that the negative direction was not exercised.
  - [ ] State plainly in the Completion Notes that CI was **not** re-run for this change and why
        (the setting is registry-side; no workflow input changed).

- [ ] **Task 6 — OPERATOR DECISION: T35's disposition (AC: 5)**
  - [ ] Present the two defensible options and recommend one:
        **(i)** Close T35 as *fixed-in-part*, with a successor row for the residual interactive
        vector; **(ii)** keep T35 open at a reduced score, annotated with what this story closed.
  - [ ] Record options (b) and (c) as **declined**, with ADR-003's reasoning, either way.
  - [ ] Apply the operator's choice to the backlog under `backlog-write-discipline`: run the
        lane-order check **before and after**, restore order in the same edit, and add a Change Log
        receipt. Do not leave a row where it lands.

- [ ] **Task 7 — Amend ADR-003 (AC: 6)**
  - [ ] Add an entry to the existing **## Amendments** section (the section already exists — append,
        do not create a second one).
  - [ ] Correct the "impossible" sentence in place with a dated marker. **Preserve the original
        wording** — strike it or quote it, do not delete it. The ADR's decision is unchanged.
  - [ ] Record AC8's resolution of corollary 2 in the same amendment.

- [ ] **Task 8 — Close out (AC: all)**
  - [ ] Update the epic's Story 1.7 ACs to match the amendments in AC4/AC5/AC6, with dated markers.
  - [ ] Write the **## Commit Plan** section per `commit-preparation`: Files, Summary
        (`<type>(<scope>): <intent>`), Description, staged-set proof, and a falsifiable clause.
  - [ ] Verify the committed set equals the reviewed set.

## Dev Notes

### §1 — The correction, stated precisely (the most important thing in this file)

ADR-003 says option (a) makes a laptop publish **impossible**. npm's documentation says it makes a
laptop publish **interactive**. Those are different claims and only one is true.

| | Before the setting | After the setting |
|---|---|---|
| CI via trusted publishing (OIDC) | works | **works** — OIDC is not a token for this purpose |
| Laptop publish with a granular access token | works | **blocked** |
| Laptop publish interactively, 2FA prompt | works | **still works** |

The middle row is the whole value of the change. The bottom row is what the ADR got wrong.

**Why this still leaves option (a) the right decision.** Option (b) is bypassable and its home
(`prepublishOnly`) was deleted by ADR-001 — verified: `grep -c prepublishOnly package.json` → **0**.
Option (c) is diagnostic only and redundant once attestations exist. Option (a) is the only one that
enforces anything, and it closes the vector that was actually used. The error is in the *claim*, not
the *choice* — which is why AC6 amends rather than reopens.

### §2 — Which vector the real incidents used, and how we know

The laptop at `~/.npmrc` holds an `_authToken` (checked by key name only, never by value). At
09:0x on 2026-08-23 `npm whoami` returned `amalik`; **twenty minutes later the same command
returned E401, stably across three attempts, with unauthenticated reads still working** — so the
credential died mid-session. npm is concurrently rolling out a restriction on tokens that bypass
2FA (`gh.io/npm-gat-bypass2fa-deprecation`, surfaced in the CLI's own notice), which is the most
likely cause and would make it a **granular access token** — exactly the class AC1's setting names.

**Restored at 11:43 the same day** by an operator login, which rewrote `~/.npmrc`; `npm whoami`
returns `amalik` again and `npm profile get` now succeeds. So the vector is open, not closed — the
lapse was transient and must not be mistaken for a control.

Either way the seven hand-publishes were **token-authenticated and non-interactive**, which is the
path AC1's setting blocks.

So the change is worth more than §1's table alone suggests: it does not merely raise friction, it
closes the mechanism every observed incident actually used. What it leaves open is a path nobody has
taken yet, which must now pass a live 2FA challenge and leaves an empty `dist.attestations` behind
as a permanent marker.

**Expect a visible side effect:** after Task 4, the operator's existing laptop token stops being
able to publish `convoke-agents`. That is the intended outcome, not a regression. It does not affect
`npm install`, `npm view`, or any other package.

### §3 — Files this story touches

| Path | Action | Notes |
|---|---|---|
| `docs/npm-publishing-access-playbook.md` | **NEW** | Naming follows `docs/host-framework-sync-playbook.md`. `docs/` packs 0 files — repo-only. |
| `_bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md` | UPDATE | Append to the existing `## Amendments` section (verified present). |
| `_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md` | UPDATE | Story 1.7 AC block, dated markers. |
| `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` | UPDATE | T35 disposition + Change Log receipt. Lane order before/after. |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE | `dist-1-7` → `review`. |
| `.github/workflows/ci.yml` | **DO NOT TOUCH** | See §4. |

All paths verified to exist 2026-08-23 per `spec-verify-referenced-files`. Re-verify at
implementation time.

### §4 — Explicitly out of scope (do not scope-creep)

- **Removing `--provenance`.** ADR-003 corollary 1 is right that it is redundant, and says any
  removal must be *"rehearsed under FR19"*. FR19 was Story 1.6 and is closed. Removing it now would
  ship an unrehearsed edit to the publish job. **Leave it.**
- **Removing `--loglevel verbose`.** `ci.yml`'s own comment licenses this after the *second* green
  publish — the stable tag, which has not happened.
- **T46, T47, T48, T49** — filed 2026-08-23 against the publish job. Real, but none is FR9. Do not
  fix them here.
- **Bumping `package.json` off `4.0.1-rc.0`.** Needed before a stable tag; not this story's job,
  and Task 5's probe actually depends on the current version already being published.

### §5 — Staleness pre-flight on T35 (`staleness-preflight-for-backlog-pickup`)

Run 2026-08-23. T35 qualified ~2026-08-15 with parallel tracks active, so the pre-flight is
mandatory on both arms.

| Check | Verdict | Evidence |
|---|---|---|
| 1. Existence | **GREEN** | 8 commits mention T35; all are Epic 1 stories citing it. None closes it. |
| 2. Dependency | **GREEN** | `prepublishOnly` gone (0 occurrences), as ADR-003 predicted for option (b). Story 1.6 green. |
| 3. Code anchor | **GREEN** | `publish` needs exactly **8** jobs as T35 claims; tag gate present once. `convoke-update.js` anchors resolve. |
| 4. Semantic anchor | **RED** | T35's option (a) is worded *"make tag-push the only publish path"*. The selected mechanism does not achieve that. |

**Verdict: RED on check 4** → per the rule, re-qualify or confirm with the operator. That is
exactly what Task 6 does. The story proceeds because the *mechanism* is still correct; it is the
*claim* that needs re-scoping.

### §6 — Learnings carried from Story 1.6

- **Operator-facing pushes must be OPERATOR STEPs with HALTs.** 1.6's first draft contained an
  instruction that would have published from the laptop. Tasks 2 and 4 here follow the corrected
  pattern.
- **"Measure, do not assume" applies to external systems too.** 1.6 invented a `workflow_dispatch`
  OIDC probe without checking that npm binds trusted publishing to the *workflow filename*. This
  story's central facts were therefore taken from npm's own docs, quoted verbatim, from two pages —
  not from the ADR that summarised them.
- **A gate that reports OK after inspecting nothing is not a gate** (T45). Task 5's negative test is
  written so that the *wrong* error counts as a failure, not a pass.
- **Do not retire a control early.** Two stories tried to retire the tag freeze before its story;
  both were corrected at review. Here the analogue is Task 4's ordering — the setting goes on only
  after Task 1 re-proves the CI path.

### Project Structure Notes

- **Namespace decision (`namespace-decision-for-new-skills`): N/A with reason.** This story adds no
  skill, workflow or agent — it adds one maintainer runbook under `docs/` and edits governed
  artifacts under `_bmad-output/`. No `_bmad/bme/` surface is touched, so there is no
  Convoke-vs-upstream-BMAD namespace question to answer.
- **Covenant (`covenant-compliance-for-convoke-skills`): N/A** — no skill surface.
- `docs/` is repo-only (0 packed files), so nothing here changes what installers receive.

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story-1.7] — AC origin
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#FR9] — "traceable to a committed tree"
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#NFR2] — rehearsal-strategy enforcement
- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md#Options] — (a)/(b)/(c) and the recommendation
- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md#Two-corollaries-the-spike-surfaced] — `--provenance` redundancy, allowed-actions cutoff
- [Source: _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md#T35] — the row this story dispositions
- [Source: https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/] — verbatim wording of both Publishing-access options
- [Source: https://docs.npmjs.com/trusted-publishers/] — OIDC survives "disallow tokens"; allowed-actions selection

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|---|---|
| 2026-08-23 | Story created by `bmad-create-story`. **Three amendments to the epic's ACs, all disclosed rather than silent.** The epic's central mechanism is sound but its claim about that mechanism is not: ADR-003 says option (a) makes a laptop publish *impossible*, while npm's own documentation — checked verbatim on two current pages — says it makes it *interactive*, blocking granular access tokens only. That correction cascades: the break-glass procedure is **better** than the epic assumed (interactive 2FA publish needs no setting change, so no window opens), and T35's closure is **weaker** (the interactive vector survives), so its disposition became an explicit operator decision rather than an assertion. Added **AC3** — establish 2FA state *before* flipping the setting, since the corrected reading makes the human path load-bearing for break-glass. Added **AC6** (amend the ADR) and **AC8** (corollary 2 is resolved by observation: `4.0.1-rc.0` published, therefore `npm publish` is an allowed action). Precondition re-verified live: `4.0.0` attestations empty, `4.0.1-rc.0` non-null. Staleness pre-flight on T35 run — checks 1–3 GREEN, **check 4 RED** on the semantic anchor, routed to Task 6. Negative test specified against an already-published version so it cannot mutate the registry, with the failure mode named explicitly (`EPUBLISHCONFLICT` means the setting is NOT live) |
