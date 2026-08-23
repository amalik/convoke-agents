---
initiative: convoke
artifact_type: adr
qualifier: 4-0-1-publish-path-enforcement
created: '2026-08-20'
status: accepted
schema_version: 1
related_initiative: 4.0.1 (distribution integrity)
related_decision: 'Epic convoke-epic-4-0-1-distribution-integrity.md — ADR-3; gates Story 1.6 (FR9 / T35)'
spike: 'RESOLVED — enforcement is an npm per-package setting, not a repository change'
accepted: '2026-08-20 (Amalik) — option (a)'
---

# ADR-003: How "tag-push is the only *automated* publish path" is enforced

> ## ⚠️ Read this before anything else — document-wide scope correction (2026-08-23)
>
> **Throughout this ADR, read "the only path" as "the only *automated* path."**
>
> This document was written on the premise that enabling the npm package setting makes CI the sole
> route to the registry and hand-publishing impossible. **That premise is not supported.** The
> setting restricts **token authentication** — npm's trusted-publishers page says it "only affects
> traditional token authentication", and its 2FA page adds that granular access tokens cannot
> publish regardless of their bypass-2FA flag. What it does **not** do is remove the human route:
> npm's wording for this option is that a maintainer *"must publish interactively"* and will answer
> a 2FA prompt.
>
> **State that claim at the strength the evidence supports, and no further.** npm's documentation
> describes an interactive route; **this project has not exercised it.** The account's 2FA mode is
> `auth-only`, npm does not document whether a package-level policy overrides that mode, and no
> negative test was performed — Story 1.7 designed one, reviewed it, and deleted it as unsafe. So:
> *documented, not observed.* The original error here was asserting a mechanism from a summary; an
> unhedged correction in the opposite direction would repeat it.
>
> **This scoping governs every occurrence in the document, including the title, and supersedes any
> sentence that reads otherwise** — whether or not that sentence carries its own strike-through.
>
> **Why a banner instead of sentence-by-sentence strikes.** Four separate sweeps each claimed
> completeness and each missed sites; a fifth audit read all 209 lines as a ledger and found
> **eleven** more, including this title. The claim is the document's organising premise, not a set
> of stray sentences, so enumerating instances is the wrong instrument. Four sentences carry
> individual strikes because they were amended before this was understood; they are accurate, and
> they are **not** an exhaustive list. **The decision itself stands** — option (a) remains the only
> option that enforces anything at the registry, and it restricts the token route.
>
> **What is NOT established, and must not be read into this document:** that the seven historical
> hand-publishes were token-authenticated. That is an inference from the credential presently on the
> maintainer's laptop, not an observation of those events — `_npmUser` is identical for a token and
> an interactive publish, so the published metadata cannot distinguish them. It is also in tension
> with what Story 1.7 discovered: the setting was found **already enabled**, with its application
> date unrecoverable. If it was already on when `4.0.0` was hand-published on 2026-08-17, then either
> that publish was not token-authenticated, or the setting does not restrict that token class. This
> document cannot resolve which, and does not claim to.

**Status:** **Accepted** (2026-08-20, Amalik) — option (a), enable the package setting
**Initiative:** Convoke 4.0.1 — distribution integrity
**Gates:** Story 1.6 (FR9 / T35). The story's deliverable depends entirely on this ruling.

## Spike result — the question the epic could not answer

**Enforcement is an npm per-package setting. It is not a repository change, and no repository
change can substitute for it.**

npm's package settings carry, at **Package Settings → Publishing access**:

> **Require two-factor authentication and disallow tokens** *(recommended)*

Scope is **per-package**. With trusted publishing configured for `convoke-agents` — which
`e18a0cab` established — enabling this setting makes the GitHub Actions OIDC path the only
**tokenless/automated** way a version reaches the registry.

> ~~A laptop `npm publish` stops being a discouraged practice and starts being impossible.~~
> **AMENDED 2026-08-23 by `dist-1-7` — this overclaimed.** npm's documentation for this option says
> *"a maintainer must have two-factor authentication enabled for their account, and they must
> publish interactively"*, and separately that *"granular access tokens cannot be used to publish
> packages, regardless of their bypass 2FA setting"*. The setting blocks **tokens**, not people: a
> 2FA maintainer can still hand-publish interactively. The decision below is unaffected — (a) is
> still the only option that enforces anything, and it closes the vector every observed incident
> actually used (all seven hand-publishes were token-authenticated). Only the claim was wrong.

**Nothing in this repository can achieve that.** The only local chokepoint is `prepublishOnly`, and
**ADR-001 is deleting it**. Even if it survived, any local hook is bypassable with
`--ignore-scripts`. A repository-side guard can only inconvenience an honest publisher; it cannot
stop the failure mode T35 records, which is a maintainer publishing by hand under deadline because
the CI job was broken. That is exactly what happened seven times, most recently with 4.0.0 at 13:13
on 2026-08-17, eight minutes after the tag job failed.

## Two corollaries the spike surfaced

**1. `--provenance` in `ci.yml`'s `Publish to npm` step is redundant, and it was actively misleading.**
npm's documentation is explicit: *"When you publish using trusted publishing from GitHub Actions or
GitLab CI/CD, npm automatically generates and publishes provenance attestations for your package.
This happens by default — you don't need to add the `--provenance` flag."*

`3a3de195`'s own root-cause note explains why the flag mattered anyway: provenance *signing* is a
separate, older feature (npm ≥ 9.5), so every failed run signed a Sigstore statement and **looked
authenticated right up to the write**. The flag is now noise on a path that produces attestations
without it. Removing it is optional and low-stakes; if it is removed, do so in a commit that is
rehearsed under FR19, not casually.

**2. The trusted-publisher configuration may be incomplete, and this fires on the next release.**
npm's docs: *"Trusted publisher configurations created before May 20, 2026 are automatically set to
allow `npm publish` only… Configurations created after May 20, 2026 require you to explicitly select
at least one allowed action."*

Convoke's configuration was created on **2026-08-17** — after that cutoff. **Verify that `npm
publish` is among its selected allowed actions.** If it is not, the next tag push fails at the
write, and the failure will look like the anonymous-publish 404 this project has already spent four
attempts diagnosing.

**3. Trusted publishing widens who can ship, and that is the point worth reading twice.**
`npm trust github --dry-run`, run 2026-08-20, states it plainly:

> *Anyone with GitHub repository write access can publish to `convoke-agents`*

Publish authority moves from **whoever holds a token** to **whoever has repository write**. For a
single-maintainer repository that is a narrowing, not a widening — the token was the looser
credential. It is recorded because this ADR makes that path the ~~*only* path~~ **only automated
path** *(**AMENDED 2026-08-23 — fourth instance, found on the third sweep.** Interactive publishing
by a 2FA maintainer survives, so repository write is not the sole route to the registry. The point
below still holds for everything that ships through CI.)*: from acceptance onward, repository write
access **is** publish access for automated releases, and any future decision to add collaborators is
also a decision about who can ship.

**Tooling note.** `npm trust github` exists in the local npm 11.11.0 and accepts `--dry-run` — but it
is a **create** command, not a read. Its dry-run output describes what it *would* establish and stops
at *"Two-factor authentication is required for this operation"*; it never prints the existing
configuration or its allowed actions. **Verifying the allowed-actions list is a UI step** — npmjs.com
→ `convoke-agents` → Settings → Publishing access. Invocation, for reference:
`npm trust github convoke-agents --file ci.yml --repo amalik/convoke-agents --dry-run`. Configuration
is inspectable and scriptable, not UI-only. (Local `npm whoami` currently returns `E401`, so the
current settings were not read for this ADR — verification is an operator step.)

## Options

**(a) Enable "require 2FA and disallow tokens" on the package.** Registry-side. Makes the CI path
the only ~~path~~ **automated path** *(amended 2026-08-23 — see Amendments; interactive publishing
by a 2FA maintainer survives this setting)*. No code.

**(b) Add a repository preflight** that refuses to publish on a dirty tree or unpushed `HEAD` and
prints the built-from commit. Code, no enforcement — bypassable, and its natural home
(`prepublishOnly`) is being deleted by ADR-001.

**(c) Record the built-from commit in the package** so a tester can report which tree they have.
Code, diagnostic only.

## Recommendation — (a) alone

**(a) is the only option that enforces anything.** It is a settings change measured in minutes, with
no code, no test surface and no rehearsal cost.

**(b) is theatre against this threat model.** T35's failure mode is a maintainer publishing by hand
*because the automated path was broken*. A guard that the same maintainer can skip does not address
it, and ADR-001 removes the hook it would live in.

**(c) becomes redundant under (a).** Trusted publishing emits a provenance attestation recording the
source repository and commit — which is precisely what (c) proposes to hand-roll. 4.0.0's
`dist.attestations: null` is the evidence that it was *not* published this way; every publish under
(a) carries that record for free.

### The trade-off, stated rather than discovered

**(a) narrows the emergency escape hatch.** If the trusted-publisher configuration breaks, or the
workflow does, ~~there is no hand-publish fallback — the registry will refuse it~~ *(**AMENDED
2026-08-23 — third instance of the same overclaim, missed by `dist-1-7`'s first sweep and caught in
its code review.** A hand-publish fallback **does** remain: a 2FA maintainer may publish
interactively. What the registry refuses is a **token**. The trade-off below is therefore real but
smaller than stated — the fallback costs a live 2FA challenge and cannot be automated, rather than
being unavailable.)* Given this project has had a broken publish job **within the last four days**,
that is not hypothetical.

**Mitigation, which is part of the deliverable, not an afterthought:** the setting is reversible from
the npm UI in under a minute. Story 1.7 must ship a documented break-glass procedure *(amended 2026-08-23: this read "Story 1.6"; the obligation belongs to the story that flips the registry setting, and the epic correctly places it in Story 1.7's ACs. Story 1.6 shipped without it, as intended.)* — where the
setting lives, who can flip it, and the requirement that any hand-publish performed under it is
logged as an incident and followed by re-enabling. An escape hatch you have written down is a
control. An escape hatch you rediscover under pressure is the status quo.

## Consequences if accepted

- **Story 1.6's deliverable is a registry configuration plus documentation, not code.** Its
  acceptance criteria are verified against npm, not against a file in this repository — which the
  story already anticipates.
- **Enable the setting only after FR19's rehearsal passes.** Turning off the manual path before the
  automatic one is proven leaves no way to ship at all. Sequence: Stories 1.1–1.5 → **1.7 rehearsal
  green** → 1.6 enables the setting. This inverts the current story order and the epic must be
  amended to say so.
- Verify the trusted-publisher allowed-actions list includes `npm publish` **before** the rehearsal,
  not after.
- T35 closes against Story 1.6. Its options (b) and (c) are declined on the record.
- `--provenance` may be dropped from `ci.yml`'s `Publish to npm` step; optional, and only inside a rehearsed change.

## Consequences if rejected

- **(b)** ships a guard that documents an intention without enforcing it, in a hook ADR-001 deletes.
  T35's seventh instance becomes an eighth the next time CI is red at a bad moment.
- **(c)** yields a diagnostic that trusted publishing already provides, and leaves the hand-publish
  path fully open.
- Doing nothing leaves the position that produced 4.0.0: an unattested tarball on `latest`, not
  reproducible from its tag.

## Evidence appendix

```bash
# The tooling exists locally and supports dry-run inspection
npm --version                       # 11.11.0
npm trust github --help
npm trust github convoke-agents --file ci.yml --repo amalik/convoke-agents --dry-run

# 4.0.0 was not published through the trusted path
npm view convoke-agents@4.0.0 --json | python3 -c "
import json,sys; d=json.load(sys.stdin); print(d['dist'].get('attestations'), d.get('_npmUser'))"
# -> None {'name': 'amalik', ...}

# The flag the docs say is unnecessary under trusted publishing
grep -n "provenance" .github/workflows/ci.yml
```

**Sources:** [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/) — the
"Require two-factor authentication and disallow tokens" setting under Package Settings → Publishing
access; automatic provenance under trusted publishing; the May 20 2026 allowed-actions cutoff.

## Operator decision

**Accepted 2026-08-20 (Amalik): option (a) — enable "Require two-factor authentication and disallow
tokens" on the `convoke-agents` package.** Options (b) and (c) declined on the record: (b) cannot
enforce and loses its host hook to ADR-001; (c) is superseded by the provenance attestation trusted
publishing emits for free.

**Epic amended the same day.** Stories 1.6 and 1.7 are transposed so that numeric order matches
execution order: the rehearsal (FR19) is now **1.6**, and the enforcement (FR9) is now **1.7**, last
in the epic. Turning off the manual publish path before the automatic one is proven would leave no
way to ship at all.

Two things only you can do, in this order:

1. **Check now:** does `convoke-agents`' trusted-publisher configuration list `npm publish` among its
   allowed actions? It was created after the May 20 2026 cutoff, so the selection was required. If it
   is missing, the next tag push fails at the write regardless of this ADR.
2. ~~**Do not enable the setting yet.**~~ *(Superseded 2026-08-23: on execution of Story 1.7 the setting was found ALREADY enabled, and `4.0.1-rc.0` had already published through CI with a valid attestation — so the condition this instruction was guarding had been satisfied before it could be followed.)* It was to go on after Story 1.7's rehearsal proved the automatic
   path works — otherwise there is no path at all.

## Amendments

| Date | By | Change |
|---|---|---|
| 2026-08-22 | `dist-1-1` R2 review | `--provenance at ci.yml:417` citation verified and preserved by reflowing that story's edit to net-zero lines. No text changed here. |
| 2026-08-23 | `dist-1-7` (FR9) | **Substantive correction at FOUR sites, plus corollary 2 closed.** (1) The spike result claimed a laptop publish becomes *"impossible"*; npm's documentation says the opposite — the option requires interactive publishing and blocks granular access tokens. Four sentences carry individual strikes — **Spike result**, **Options (a)**, **The trade-off** (*"there is no hand-publish fallback"*) and **Two corollaries** (*"makes that path the only path"*; an earlier version of this row misnamed that last one "Consequences if accepted"). **They are NOT an exhaustive list, and no enumeration is claimed.** Four sweeps each asserted completeness and each missed sites; a fifth read all 209 lines as a ledger and found **eleven** more, including the document title. Sentence-by-sentence patching was therefore abandoned in favour of the **document-wide scope banner under the title**, which governs every occurrence. Root cause of all four failures was identical: grepping remembered wording instead of reading for the claim. The first sweep asserted "exactly two, not three" and was wrong: it grepped the remembered wording (`impossible`/`only path`) rather than the claim's meaning, so a paraphrase survived. Caught by this story's own code review; original wording preserved at every site. **The decision stands**: option (a) is still the only enforcing option, and it closes the token vector that all seven observed hand-publishes used. What changes is the *claim*, and downstream: the break-glass is better than assumed (interactive publish needs no setting change, so no window opens) and T35's closure is weaker (the interactive vector survives). **Root cause worth recording: this ADR reasoned from a summary of npm's docs rather than from the docs** — the same basis mismatch that produced T41(d)'s wrong mechanism and the epic's "queries the registry nowhere" claim. (2) **Corollary 2 is CLOSED.** It warned that a post-2026-05-20 trusted-publisher configuration must explicitly select allowed actions. Confirmed by direct observation 2026-08-23: publisher `amalik/convoke-agents`, workflow `ci.yml`, permitted action `npm publish` — and corroborated by `4.0.1-rc.0` publishing successfully. (3) **Scope note:** the option's UI wording is now *"…disallow **bypass 2fa** tokens (recommended)"* while npm's docs still say *"…disallow tokens"*; same option, matched on *(recommended)*. |
| 2026-08-22 | `dist-1-3` (FR5) | Both `ci.yml:417` citations (§`:43`, §`:134`) **de-pinned** to "`ci.yml`'s `Publish to npm` step". `dist-1-3` inserts a downgrade guard before `npm publish`, moving that line `417 → 495`; re-pinning would have been broken again by Story 1.4, which edits the same block. **Factual pointer only — the decision, its options analysis and its consequences are unchanged.** Recorded here because this ADR is `Accepted` and previously carried no amendment trace, while sibling ADRs (`v4-1/adr-001`, `v63/adr-001`) do. |
