---
baseline_commit: d4a8ba20e0eb02f23453ae305f3aa6f1bfae1bb4
---

# Story 1.7: Make the CI path the only path to the registry

Status: review

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

**DO NOT RUN that command.** It is quoted to explain why AC1 uses the UI, not as an instruction.
Task 4 is an OPERATOR STEP with a HALT, and this is the only fully formed registry-write command in
this file — a wrong value is undetectable afterwards, because AC5 establishes there is no machine
read-back.

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

**This is a RECORDED OPEN RISK, not a question this story can close.** The only observation that
would settle it is a real interactive publish, which this story forbids. A token-based probe cannot
answer it — a non-interactive rejection says nothing about whether an *interactive* publish would be
accepted; the two are disjoint.

**Therefore AC4's primary break-glass ships UNTESTED, and must say so.** If it turns out not to work
under `auth-only`, the remedy is `npm profile enable-2fa auth-and-writes` — which OTP-gates every
write on **every package the operator owns**, not just this one. That blast radius is why it is the
operator's call and is not pre-authorised here.

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

**Both hatches share one dependency, and the playbook must say so.** Disabling the setting is itself
a package-settings modification, which npm gates behind 2FA (*"Modifying a package's settings also
requires two-factor authentication"* — npm docs). So the secondary hatch **does not cover the case
its own name implies**: if the operator cannot satisfy 2FA, neither hatch is available. There is one
account and no org, so there is no second person to fall back to. State this plainly rather than
implying the fallback is independent.

**AC5 — Attestation evidence, and T35's disposition.**
**Given** a release published after this story
**When** its npm metadata is inspected
**Then** `dist.attestations` is non-null — 4.0.0 as shipped is empty, which is the evidence it did
not come through this path.

**This AC cannot close at story close, and that is not a defect — it is the nature of the control.**
No release happens during this story. The acceptance evidence at close is **AC1's UI read-back**;
the attestation check is a standing assertion for the next release. Say that explicitly rather than
leaving an AC that looks satisfiable and is not. Note also that the setting is **not readable from
any machine interface** — `npm access get status` returns only public/private and there is no
`get mfa` — so nothing can detect later drift. Record the UI state as the only evidence there is.

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

**The epic's wording is conditional and this story previously dropped the condition.** The epic says
*"a deliberate negative test **if one can be performed safely**"* (epic, Story 1.7). It cannot be, and
the reasoning is recorded in Task 5. **The negative direction is therefore deliberately NOT
exercised.** Verification is instead:

1. **AC1's UI read-back** — the selected option is directly observable and is the actual acceptance
   evidence for this story.
2. **The positive control** — the next CI publish still succeeds and still attests. That proves the
   change did not break the OIDC path, which is the risk that actually matters.

A recorded strategy that was never executed does not satisfy this AC; neither does a probe that
could not have distinguished its own outcomes.

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

- [x] **Task 1 — Re-verify the precondition before touching anything (AC: 2)**
  - [x] Run both `npm view` commands from AC2. Record raw output in the Debug Log.
  - [x] **HALT if `4.0.1-rc.0` attestations are empty.** That would mean the CI path is not proven
        and this story must not proceed.
  - [x] Confirm `git status` is clean and `main` is in sync with origin.

- [x] **Task 2 — Confirm the 2FA mode still reads `auth-only` (AC: 3)**
  - [x] Run `npm profile get --json` and read the `tfa` field. Record it verbatim.
  - [x] **Expected:** `{'pending': None, 'mode': 'auth-only'}` (measured 2026-08-23).
  - [x] If it reads `auth-and-writes`, the AC3 open question is moot — record that and move on.
  - [x] **Do NOT change the account 2FA mode as part of this task.** It is account-wide and affects
        every package the operator owns.
  - [x] **Carry AC3 forward as an open risk — nothing in this story can close it.** Record in the
        Completion Notes: the mode measured, that npm's docs do not state whether a package-level
        policy overrides account-level `auth-only`, and that AC4's primary break-glass therefore
        ships **untested**. Task 3 must reproduce that caveat in the playbook.

- [x] **Task 3 — Write the break-glass playbook (AC: 4)**
  - [x] Create `docs/npm-publishing-access-playbook.md`.
  - [x] Content, in this order: what the setting is and where it lives (npmjs.com →
        `convoke-agents` → Settings → Publishing access); who can change it (package owners /
        org admins); **primary break-glass** (interactive publish with 2FA, no setting change);
        **secondary break-glass** (disable the setting — with the explicit note that this opens a
        window and must be re-enabled immediately); **that BOTH hatches are 2FA-gated**, so the
        fallback does not cover the case its name implies, with one account and no org; **that the
        primary hatch is UNTESTED** under the account's `auth-only` mode (AC3); the incident-logging requirement (any
        hand-publish is logged as a T35 instance with date, version and reason); and how to verify
        afterwards (`npm view convoke-agents@<v> dist.attestations` — a hand-published version
        will be empty, and that is the durable marker).
  - [x] Do **NOT** add the file to `USER_FACING_DOCS` in `scripts/docs-audit.js` — it is a
        maintainer runbook, not shipped user documentation. `docs/` contributes **0 files** to the
        tarball (verified), so it is repo-only by construction.
  - [x] The playbook MUST also enumerate the **settings-modification surface** (Dev Notes §2b):
        `npm dist-tag`, `npm deprecate`, `npm owner` and `npm access` are all gated by this setting,
        and the CI trusted publisher **cannot** perform any of them. Anyone reaching for the T44
        repair or a rollback needs to know that before they need it.
  - [x] Verify links with the **scoped** invocation — the bare run does not walk `docs/` at all and
        would PASS after reading zero lines of the new file:

            node scripts/audit/reference-integrity.js --paths docs/npm-publishing-access-playbook.md

        **The `(scoped to ...)` phrase is NOT a sufficient criterion — it is printed from the
        presence of the flag, not from any file being read** (`reference-integrity.js:589,593`
        interpolate it unconditionally; `:303` turns a missing target into a *skip*). Run before the
        file exists, this command prints `PASS — 0 references checked, 0 broken (scoped to ...)` and
        exits 0. Verified 2026-08-23.

        **Pass requires BOTH:** (1) the output contains `--paths target does not exist` **nowhere**,
        and (2) the reference count is **greater than zero** — `PASS — N references checked`, N > 0.

        **HALT if either fails.** Zero references means the gate read nothing. Task 4 is irreversible
        in practice and must not proceed on an unverified Task 3.

- [x] **Task 4 — OPERATOR STEP: enable the setting (AC: 1)**
  - [x] **Only after Tasks 1–3 are complete.**
  - [x] Present exact navigation: npmjs.com → `convoke-agents` → **Settings** →
        **Publishing access** → select **"Require two-factor authentication and disallow tokens"**
        → Save.
  - [x] *(Executed as an inspection, not a change — the setting was already correct, so nothing was
        clicked. The subtasks below are ticked as **verified**, not as **performed**.)*
  - [x] **Record the BEFORE state first** — which of the two options is currently selected. There is
        no machine read-back (AC5), so this is the only rollback target that will ever exist.
  - [x] HALT and wait for the operator to confirm it is saved.
  - [x] **Record the AFTER state by reading the UI back**, not by assuming the click worked. This
        read-back is AC1's acceptance evidence.

- [x] **Task 5 — Record the rehearsal strategy; do NOT run a laptop publish probe (AC: 7)**
  - [x] **A negative test was designed, reviewed, and REMOVED. Do not reinstate it.** Three
        independent reasons, all measured against npm 11.11.0 — record them in the Debug Log so the
        next person does not rebuild it:
        1. **It cannot reach the policy.** `lib/commands/publish.js:165-172` reads the registry and
           throws `You cannot publish over the previously published versions` **locally**, before
           any write. Against an already-published version the probe never exercises the
           publishing-access policy at all — it would report a pass having tested nothing.
        2. **Its safety argument expires.** The probe was inert only while `package.json` said
           `4.0.1-rc.0`. The next planned action is bumping to `4.0.1`, which is **not published**
           (verified E404). After the bump the local check passes and the probe becomes a real
           laptop publish: an unattested `4.0.1` that exists forever, and `v4.0.1` could then never
           be published by CI — permanently, blocked by the same local throw at
           `publish.js:170-172` cited in reason 1, since npm's unpublish window is 72h and refuses
           once there are dependents. *(Not `EPUBLISHCONFLICT` — that code has no thrower in npm at
           all, which is reason 3.)*
        3. **Its result would not discriminate.** A 403 is returned identically by a live policy, a
           token lacking publish scope, and a duplicate version. `npm whoami` proves only that the
           credential authenticates against a *read* endpoint.
  - [x] Record the rehearsal strategy in the Completion Notes: this change is registry-side, **no CI
        run exercises it**, and no workflow input changed. Verification is AC1's UI read-back plus
        the positive control below.
  - [x] **Positive control (the falsifiable part).** State that the next CI publish must still
        succeed with a non-null `dist.attestations`. That is the assertion that the setting did not
        break the OIDC path. It is **not** satisfied within this story — name the release that will
        satisfy it.
  - [x] State plainly that the **negative direction is deliberately not exercised**, citing the
        epic's own conditional (*"if one can be performed safely"*). An undisclosed gap is a defect;
        a disclosed one is a decision.

- [x] **Task 6 — OPERATOR DECISION: T35's disposition (AC: 5)**
  - [x] Present the two defensible options and recommend one:
        **(i)** Close T35 as *fixed-in-part*, with a successor row for the residual interactive
        vector; **(ii)** keep T35 open at a reduced score, annotated with what this story closed.
  - [x] Record options (b) and (c) as **declined**, with ADR-003's reasoning, either way.
  - [x] **Annotate T44 with the consequence this story creates.** T44's preferred remedy is option
        (b), *"document the `npm dist-tag set` repair as the sanctioned path"*. After this story that
        repair cannot be run by a token and can never be run by CI — it requires an interactive
        session with a live OTP. T44 was written without that dependency; add it to the row.
  - [x] Apply the operator's choice to the backlog under `backlog-write-discipline`: run the
        lane-order check **before and after**, restore order in the same edit, and add a Change Log
        receipt. Do not leave a row where it lands.

- [x] **Task 7 — Amend ADR-003 (AC: 6, 8)**
  - [x] Add an entry to the existing **## Amendments** section (the section already exists — append,
        do not create a second one).
  - [x] Correct the "impossible" sentence in place with a dated marker. **Preserve the original
        wording** — strike it or quote it, do not delete it. The ADR's decision is unchanged.
  - [x] Record AC8's resolution of corollary 2 in the same amendment — this is AC8's only task, and
        it closes by citing `4.0.1-rc.0`'s successful publish rather than by re-reading a setting.
  - [x] **Sweep the whole ADR for the same overclaim, do not patch one sentence.** Located
        2026-08-23 — it appears in **two** sections: *(**RETRACTED at code review** — the true
        count is FOUR. This subtask's enumeration was wrong twice over and is preserved only to show
        how: it greps remembered wording instead of the claim. Re-run it by reading the whole
        document.)* **Spike result** (`:30-32`,
        *"the only way a version reaches the registry… stops being a discouraged practice and starts
        being impossible"*) and **Options** (`:87`, option (a) *"Makes the CI path the only path"*).
        Re-locate them by grep rather than by line number, which will have drifted; an amendment
        that fixes one instance leaves the document self-contradictory.

- [x] **Task 8 — Close out (AC: all)**
  - [x] Update the epic's Story 1.7 ACs to match the amendments in AC4/AC5/AC6, with dated markers.
  - [x] Write the **## Commit Plan** section per `commit-preparation`: Files, Summary
        (`<type>(<scope>): <intent>`), Description, staged-set proof, and a falsifiable clause.
  - [x] Verify the committed set equals the reviewed set.

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

**Expect a visible side effect:** with the setting in force, the operator's laptop token cannot
publish `convoke-agents`. That is the intended outcome, not a regression. *(Written before
implementation as a prediction about Task 4. It did not come true as phrased — the setting was
already enabled, so Task 4 changed nothing and there was no observable transition. The steady state
is as described; the moment never happened.)* It does not affect
`npm install` or `npm view`, and it does not affect any other package — **but it does affect every
other WRITE on this one.** See §2b, which is the part that is easy to miss.

### §2b — The settings-modification surface, which the epic and ADR-003 both omit

The setting's own documentation page is titled *"Requiring 2FA for package **publishing and settings
modification**"*. The epic, ADR-003 and this story's first draft all reasoned about publishing only.
Measured against npm 11.11.0 — every one of these routes through `otplease()`:

| Command | Source | Gated |
|---|---|---|
| `npm publish` | `lib/commands/publish.js:188` | yes |
| `npm dist-tag add/rm` | `lib/commands/dist-tag.js:122,148` | yes |
| `npm deprecate` | `lib/commands/deprecate.js:72` | yes |
| `npm owner add/rm` | `lib/commands/owner.js:214` | yes |
| `npm access set/grant/revoke` | `lib/commands/access.js:119,125,163,174` | yes |

**And CI cannot substitute for any of them.** A trusted publisher's allowed actions are `npm publish`
and `npm stage publish` — *nothing else*. So OIDC covers publish and only publish.

Three consequences the story must carry rather than discover:

- **T44's preferred remedy costs an interactive session.** Its option (b) is *"document the
  `npm dist-tag set` repair as the sanctioned path"*. That repair can no longer be run by a token and
  can never be run by CI. T44 was written without that dependency.
- **`dist-1-6`'s AC9 rollback gains a second blocker.** Its state (iv) recovery is an
  `npm dist-tag add` to move `latest` back. That already required a credential; now it also requires
  a live OTP.
- **`npm deprecate` is gated too** — the standard response to shipping a broken release once the
  72-hour unpublish window has closed, which is exactly the state T47 contemplates.

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
- **Bumping `package.json` off `4.0.1-rc.0`.** Needed before a stable tag; not this story's job.
  *(An earlier draft justified the pin by a probe that depended on it. That probe is deleted — see
  Task 5 — so the pin is simply out of scope, not protective of anything.)*

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
- **A gate that reports OK after inspecting nothing is not a gate** (T45). **There is no negative
  test in this story — do not reconstruct one; see Task 5.** The lesson now lives in Task 3's link
  check, whose first two drafts both had this defect: the bare run does not walk `docs/`, and the
  scoped run still passes on a file that does not exist. Its pass condition is a non-zero reference
  count, not a reassuring phrase.
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

- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story 1.7: Make the CI path the only path to the registry] — AC origin
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#FR9] — "traceable to a committed tree"
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#NFR2] — rehearsal-strategy enforcement
- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md#Options] — (a)/(b)/(c) and the recommendation
- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md#Two corollaries the spike surfaced] — `--provenance` redundancy, allowed-actions cutoff
- [Source: npm 11.11.0 `lib/commands/publish.js:165-172`] — the duplicate-version check throws locally, before any write
- [Source: npm 11.11.0 `lib/commands/{dist-tag,deprecate,owner,access}.js`] — `otplease()` on every package write
- [Source: https://raw.githubusercontent.com/npm/documentation/main/content/packages-and-modules/securing-your-code/requiring-2fa-for-package-publishing-and-settings-modification.mdx] — raw doc source; option 2 verbatim
- [Source: _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md#T35] — the row this story dispositions
- [Source: https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/] — verbatim wording of both Publishing-access options
- [Source: https://docs.npmjs.com/trusted-publishers/] — OIDC survives "disallow tokens"; allowed-actions selection

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context) — `claude-opus-5[1m]`

### Debug Log References

**Task 1 — precondition re-verified (AC2), 2026-08-23.** Not taken from the story file; re-run.
```
npm view convoke-agents@4.0.1-rc.0 dist.attestations
  {"url":"https://registry.npmjs.org/-/npm/v1/attestations/convoke-agents@4.0.1-rc.0",
   "provenance":{"predicateType":"https://slsa.dev/provenance/v1"}}
npm view convoke-agents@4.0.0 dist.attestations
  <empty>
```
The CI path is proven and the contrast holds. `git status` clean, 0 unpushed. **No HALT.**

**Task 2 — 2FA mode (AC3), 2026-08-23.**
```
npm profile get --json  ->  tfa: {'pending': None, 'mode': 'auth-only'}
```
Still `auth-only`, so **AC3's open question applies**: npm does not document whether a package-level
policy overrides account-level `auth-only`. AC4's primary break-glass therefore ships **UNTESTED**,
and the playbook says so in §2. Account 2FA mode deliberately NOT changed — account-wide blast radius.

**Task 3 — playbook written and gate run (AC4), 2026-08-23.**
```
node scripts/audit/reference-integrity.js --paths docs/npm-publishing-access-playbook.md
  [reference-integrity] PASS — 6 references checked, 0 broken (scoped to docs/...)
```
Both required conditions met: no `target does not exist` warning, and **N=6 > 0**. The bare run
would not have walked `docs/` at all, and the scoped run on a missing file returns
`PASS — 0 references` exit 0 — which is why the count, not the phrase, is the criterion.
Not added to `USER_FACING_DOCS` (0 hits). `docs/` still packs 0 of 454 files.

**Tasks 4-8 — where their output lives, 2026-08-23.** These tasks produced records rather than
commands, so their evidence is in the Completion Notes and in the amended artifacts themselves
rather than here. Naming that explicitly because "no Debug Log entry" is otherwise indistinguishable
from "task not performed":
- **Task 4** (setting) → Completion Notes, AC1 paragraph. Operator UI read; no command exists.
- **Task 5** (rehearsal strategy) → Completion Notes, AC7 paragraph. **The deleted probe was
  deliberately not run** — the three measured reasons are in the task body and must not be
  relitigated.
- **Task 6** (T35 disposition) → the backlog diff: T35 closed + relocated, T47 absorbed, T44
  amended, Change Log receipt. Lane order 7 → 6 measured before and after.
- **Task 7** (ADR amendment) → the ADR diff. **Its first sweep was wrong** — it asserted "exactly
  two sites, not three" and missed a paraphrase; corrected to three, then to four, and finally
  **abandoned**. A fifth audit read all 209 ADR lines as a ledger and found **eleven** more sites
  including the document title. Sentence-by-sentence patching was replaced by a **document-wide
  scope banner**; no enumeration of sites is claimed anywhere.
- **Task 8** (close-out) → the epic diff and the Commit Plan.

### Completion Notes List

**AC1 — SATISFIED, but by pre-existing configuration, not by a change this story made.**
Operator read the UI 2026-08-23: Publishing access was **already** set to the recommended option.
Before state == after state; nothing was clicked. **This is a finding, not a formality** — the epic
and ADR-003 both assume the story enables the setting, and the deliverable was therefore always
documentation plus records. The control has been in place for some unknown period; it cannot be
dated, because npm offers no machine read-back and no audit surface for it (AC5).

**Reconciling that with T35.** Seven hand-publishes are on record, most recently `4.0.0` at 13:13 on
2026-08-17 — eight minutes after the tag job failed. Trusted publishing was configured the same day
(`e18a0cab`). The setting was therefore most plausibly applied *during or after* that configuration,
i.e. after the last hand-publish, which is consistent with every observation available. **It cannot
be proven**, and the story should not claim it: the honest statement is that the control is on now
and its start date is unrecoverable.

**Wording discrepancy, recorded and propagated.** npm's UI reads *"Require two-factor authentication
and disallow **bypass 2fa** tokens (recommended)"*; npm's own documentation source still reads
*"…and disallow tokens"*. Same option — the list has exactly two entries and only one is marked
recommended. The playbook now tells operators to match on `(recommended)` rather than on a sentence
npm has already changed once.

**AC8 — upgraded from inference to direct observation.** The story closed corollary 2 by reasoning
that `4.0.1-rc.0` published, therefore `npm publish` must be an allowed action. The operator read the
configuration directly: trusted publisher `amalik/convoke-agents`, workflow **`ci.yml`**, permitted
action **`npm publish`**. That also confirms the workflow-filename binding that `dist-1-6`'s review
identified — a publish from any other workflow file would be declined.

**AC7 / NFR2 — rehearsal strategy.** This change is registry-side; **no CI run exercises it** and no
workflow input changed. Verification is (1) AC1's UI read-back, done, and (2) the positive control:
the next CI publish must still succeed with a non-null `dist.attestations`. That will be the
`v4.0.1` stable release. **The negative direction is deliberately not exercised**, per the epic's own
conditional *"if one can be performed safely"* — the reasons are in Task 5 and must not be relitigated
by rebuilding the probe.

### File List

- `docs/npm-publishing-access-playbook.md` — NEW (Task 3)
- `_bmad-output/implementation-artifacts/dist-1-7-make-the-ci-path-the-only-path-to-the-registry.md` — frontmatter, status, tasks, Dev Agent Record
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `dist-1-7` → `review`
- `_bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md` — Task 7: document-wide scope banner + Amendments row; four sentence-strikes retained, labelled non-exhaustive
- `_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md` — Task 8, Story 1.7 AC amendment block
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — Task 6: T35 closed + relocated, T47 absorbed residual, T44 amended, T41/T39 relocated, Change Log receipt

## Change Log

| Date | Change |
|---|---|
| 2026-08-23 | **Round 2 — 4 NEW HIGH findings, every one introduced by the Round-1 rebuild.** Applying findings creates unreviewed text, and this is what it produced. **The replacement link gate was the same T45 gate it replaced:** `--paths` echoes `(scoped to ...)` from the presence of the flag, not from reading anything, and `:303` turns a missing target into a *skip* — so run before the playbook exists it printed `PASS — 0 references checked` and exited 0, with the phrase the story required as proof. Verified by running it. The pass condition is now a **non-zero reference count plus the absence of the skip warning**, with a HALT. **Dev Notes §6 still credited the deleted probe** with catching exactly that defect — the highest-consequence leftover in the file, because a dev agent reading Notes before Tasks could have reconstructed the probe that Task 5 shows would publish an unattested `4.0.1`. **Dev Notes §4 still justified the version pin by that probe's dependency**, inverting the rebuilt Task 5's own reasoning. **And the rebuilt Task 5 re-used `EPUBLISHCONFLICT`** as its mechanism — the very code the same rebuild's Change Log proves has no thrower in npm; the real blocker is `publish.js:170-172`, cited correctly two lines earlier. Also fenced the banner's `npm access set mfa=` line with an explicit DO-NOT-RUN (it was the only fully formed registry-write command left in the file, sitting in the first screen, argued on *verifiability* rather than prohibition), gave Task 3 a HALT since it gates the irreversible Task 4, and propagated AC3's untested-break-glass caveat and AC4's shared-2FA-dependency into the tasks that were supposed to carry them. Six of R1's seven claimed fixes verified genuinely applied; the seventh was H1 |
| 2026-08-23 | **Story review before implementation — 2 layers. Verdict: NOT READY; rebuilt.** **The negative test was deleted, not fixed.** It failed three ways at once, all measured against npm 11.11.0: `publish.js:165-172` throws the duplicate-version error **locally** before any write, so the probe could never reach the publishing-access policy it was written to test — a pass reported after testing nothing, the exact T45 shape Dev Notes §6 claims to design against; its `EPUBLISHCONFLICT` discriminator **has no thrower in npm at all**, existing only in a formatter; and its safety argument expired on the very next planned action — bumping `package.json` to `4.0.1`, which is unpublished, would have turned an inert probe into **a live laptop publish of a real version**, creating an unattested `4.0.1` and permanently blocking CI from ever releasing `v4.0.1`. Both review layers found that independently; it is the same class that got `dist-1-6`'s draft rejected. Removal is *aligned with* the epic, which says *"a deliberate negative test **if one can be performed safely**"* — a conditional the first draft silently dropped. **A whole surface was undisclosed:** `npm dist-tag`, `deprecate`, `owner` and `access` are all OTP-gated by this setting and a trusted publisher may only `npm publish`, so **T44's preferred remedy and `dist-1-6`'s AC9 rollback both now require an interactive session** — recorded in new Dev Notes §2b. **AC3 was unsatisfiable** (the task nominated to resolve it observed a disjoint thing) and is now a recorded open risk with the primary break-glass shipping UNTESTED; **AC4's two hatches share one 2FA dependency**, so the fallback does not cover the case it names; **AC5 cannot close at story close** and says so, since the setting has no machine read-back. Task 3's link check was itself a T45 gate — the bare `reference-integrity.js` does not walk `docs/` and would PASS having read zero lines; now scoped with `--paths` and required to echo the filename. **One reviewer finding was rejected on evidence:** H3 claimed AC6's quote was not verbatim and inverted a conditional; npm's raw doc source shows option 2 does say *"they must publish interactively"* — the reviewer had attributed option 1's conditional to option 2. AC6's thesis stands |
| 2026-08-23 | Story created by `bmad-create-story`. **Three amendments to the epic's ACs, all disclosed rather than silent.** The epic's central mechanism is sound but its claim about that mechanism is not: ADR-003 says option (a) makes a laptop publish *impossible*, while npm's own documentation — checked verbatim on two current pages — says it makes it *interactive*, blocking granular access tokens only. That correction cascades: the break-glass procedure is **better** than the epic assumed (interactive 2FA publish needs no setting change, so no window opens), and T35's closure is **weaker** (the interactive vector survives), so its disposition became an explicit operator decision rather than an assertion. Added **AC3** — establish 2FA state *before* flipping the setting, since the corrected reading makes the human path load-bearing for break-glass. Added **AC6** (amend the ADR) and **AC8** (corollary 2 is resolved by observation: `4.0.1-rc.0` published, therefore `npm publish` is an allowed action). Precondition re-verified live: `4.0.0` attestations empty, `4.0.1-rc.0` non-null. Staleness pre-flight on T35 run — checks 1–3 GREEN, **check 4 RED** on the semantic anchor, routed to Task 6. Negative test specified against an already-published version so it cannot mutate the registry, with the failure mode named explicitly (`EPUBLISHCONFLICT` means the setting is NOT live) |

## Commit Plan

**Files (6)**

```
docs/npm-publishing-access-playbook.md                                           (NEW)
_bmad-output/implementation-artifacts/dist-1-7-...-to-the-registry.md
_bmad-output/implementation-artifacts/sprint-status.yaml
_bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md
_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md
_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md
```

**Summary:** `feat(dist-1-7): make the CI path the enforced path to the registry`

**Description:**

> Closes FR9, the last story of Epic 1. Operator-action story: the deliverable is an npm
> per-package setting plus its documentation. No code change.
>
> **The setting was found ALREADY ENABLED.** The epic and ADR-003 both assume this story turns it
> on. AC1 is satisfied by pre-existing configuration, and npm exposes no audit surface for the
> setting, so the date it was applied is unrecoverable — recorded as unknown rather than inferred.
>
> ADR-003's false premise is corrected by a **document-wide scope banner**, not by enumerating
> sites. Four sweeps each claimed completeness and each missed instances — a fifth audit found
> eleven more, including the title — so enumeration was abandoned as the wrong instrument. Four
> sentences retain individual strikes and are explicitly labelled non-exhaustive. npm's wording for the option is that a maintainer *"must publish
> interactively"* — it blocks granular access tokens, not people. The decision stands; the claim
> did not. Corollary 2 closed by direct observation: trusted publisher `amalik/convoke-agents`,
> workflow `ci.yml`, action `npm publish` — the workflow-filename binding is now in the playbook.
>
> T35 closed as fixed-in-part; residual folded into T47 rather than opened as a new row, because
> no npm setting blocks a 2FA human and detection replaces prevention — a hand-published version
> carries an empty `dist.attestations` permanently, which is how 4.0.0 is known to have bypassed
> CI. Options (b) and (c) declined per ADR-003. T44 amended: its preferred `npm dist-tag` repair
> now requires an interactive session, since this setting gates settings modification and a trusted
> publisher may only `npm publish`.
>
> Gates: lane order 7 → 6 (one cleared, none introduced); `backlog-integrity.js` PASS 326 rows;
> `reference-integrity --paths` 6 references on the new playbook; `npm run lint` exit 0;
> `docs/` still packs 0 of 454 files.

**Falsifiable clause:** ADR-003 carries a scope banner under its title containing the string
`document-wide scope correction`, the banner states the interactive route is `documented, not
observed`, and it records that the token-vector inference `cannot resolve which`. The playbook's
break-glass carries three numbered preconditions, and check (2) is scoped to `require('./package.json').files`
rather than the whole repo — run bare it reports ~161 ignored paths here and could never pass.

*Two earlier versions of this clause were themselves defective and are recorded because the pattern
matters more than the fix: the first counted unstruck occurrences of the word "impossible" — testing
the word, not the claim, which is why four sweeps missed paraphrases; the second enumerated "all
four sites" while the same file said no enumeration was claimed. This version asserts only the
presence of specific strings and one scoping property, all checkable by grep.* T35's status cell starts `✅ Closed 2026-08-23`; T47 contains `ABSORBED
2026-08-23`; T44 contains `AMENDED 2026-08-23`; the playbook's scoped link check reports
**6 references, 0 broken** with no skip warning.

*(An earlier wording claimed "**0** registry-write commands in the story file". That was false: two
are present and deliberate — `npm access set mfa=…` at the banner and `npm profile enable-2fa
auth-and-writes` in AC3, both quoted to explain a decision, the first explicitly fenced DO-NOT-RUN.
The original check grepped only indented lines, so it measured a pattern chosen to match the claim
rather than testing the claim. The honest, checkable assertion is: **every registry-write command in
this file appears in prose as an explanation, none in an executable task step** — verified by
inspecting all task blocks.)*

**Rehearsal note (NFR2):** no CI run exercises this change — it is registry-side and no workflow
input changed. CI will run on push and must stay green, but that is a regression check, not proof.
The positive control is the next release: `v4.0.1` must publish with non-null `dist.attestations`.
