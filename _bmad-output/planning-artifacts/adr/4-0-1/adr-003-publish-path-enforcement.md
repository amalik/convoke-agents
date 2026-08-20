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

# ADR-003: How "tag-push is the only publish path" is enforced

**Status:** **Accepted** (2026-08-20, Amalik) — option (a), enable the package setting
**Initiative:** Convoke 4.0.1 — distribution integrity
**Gates:** Story 1.6 (FR9 / T35). The story's deliverable depends entirely on this ruling.

## Spike result — the question the epic could not answer

**Enforcement is an npm per-package setting. It is not a repository change, and no repository
change can substitute for it.**

npm's package settings carry, at **Package Settings → Publishing access**:

> **Require two-factor authentication and disallow tokens** *(recommended)*

Scope is **per-package**. With trusted publishing configured for `convoke-agents` — which
`e18a0cab` established — enabling this setting makes the GitHub Actions OIDC path the only way a
version reaches the registry. A laptop `npm publish` stops being a discouraged practice and starts
being impossible.

**Nothing in this repository can achieve that.** The only local chokepoint is `prepublishOnly`, and
**ADR-001 is deleting it**. Even if it survived, any local hook is bypassable with
`--ignore-scripts`. A repository-side guard can only inconvenience an honest publisher; it cannot
stop the failure mode T35 records, which is a maintainer publishing by hand under deadline because
the CI job was broken. That is exactly what happened seven times, most recently with 4.0.0 at 13:13
on 2026-08-17, eight minutes after the tag job failed.

## Two corollaries the spike surfaced

**1. `--provenance` at `ci.yml:417` is redundant, and it was actively misleading.**
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
credential. It is recorded because this ADR makes that path the *only* path: from acceptance onward,
repository write access **is** publish access, and any future decision to add collaborators is also a
decision about who can ship.

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
the only path. No code.

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

**(a) removes the emergency escape hatch.** If the trusted-publisher configuration breaks, or the
workflow does, there is no hand-publish fallback — the registry will refuse it. Given this project
has had a broken publish job **within the last four days**, that is not hypothetical.

**Mitigation, which is part of the deliverable, not an afterthought:** the setting is reversible from
the npm UI in under a minute. Story 1.6 must ship a documented break-glass procedure — where the
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
- `--provenance` may be dropped from `ci.yml:417`; optional, and only inside a rehearsed change.

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
2. **Do not enable the setting yet.** It goes on after Story 1.7's rehearsal proves the automatic
   path works — otherwise there is no path at all.
