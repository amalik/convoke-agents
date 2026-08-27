# npm Publishing Access — operator playbook

**Audience:** whoever holds the `convoke-agents` npm package. **Not** shipped to users — `docs/`
contributes zero files to the published tarball.

**Why this exists:** `convoke-agents` restricts who may write to the registry. That restriction is
useful precisely when things are going wrong, which is the worst moment to be discovering how it
works. Read this before you need it.

---

## 1. The setting

**Where:** [npmjs.com](https://www.npmjs.com) → `convoke-agents` → **Settings** →
**Publishing access**.

Two options exist. Convoke uses the second:

| Option | Effect |
|---|---|
| Require two-factor authentication **or** a granular access token with bypass 2FA enabled *(npm default)* | A token can publish non-interactively. |
| **Require two-factor authentication and disallow bypass 2fa tokens** *(marked "recommended"; Convoke's setting)* | Granular access tokens **cannot publish, regardless of their bypass-2FA setting.** A maintainer must publish interactively and answer a 2FA prompt. |

**CI is unaffected.** The GitHub Actions job publishes through *trusted publishing* (OIDC), which is
not a token for this purpose. This was proved live: `4.0.1-rc.0` published through CI with a real
SLSA attestation.

> **Wording note.** npm's UI reads *"…and disallow **bypass 2fa** tokens"* while npm's own
> documentation still reads *"…and disallow tokens"*. These are the same option — the list has
> exactly two entries and only this one is marked *recommended*. Match on **"(recommended)"**, not on
> the sentence, which npm has changed once already. Observed live 2026-08-23.

**Who can change it:** a package owner. Today that is one person and there is no org — see §4.

**Trusted publisher, confirmed live 2026-08-23:** `amalik/convoke-agents`, bound to workflow
**`ci.yml`**, permitted action **`npm publish`**. The workflow-filename binding matters: a publish
attempted from any *other* workflow file is declined, so new release workflows must be registered.

**There is no machine read-back.** `npm access get status` returns only `public`/`private`; there is
no `get mfa`. A CLI setter exists (`npm access set mfa=…`) but npm documents none of its three
values, so setting it blind can silently select the *weaker* policy. **Always use the web UI, where
the selected option is visible.** The UI is the only place the current state can be observed, which
also means nothing can detect later drift — if you change it, record it here.

---

## 2. Break-glass: publishing when CI cannot

Two routes. **Try them in this order.**

### Primary — publish interactively (no setting change)

**Before you type it, do the thing T35 exists to enforce.** `npm publish` packs the **working
tree**, not a commit — that is precisely how `4.0.0-rc.1` shipped uncommitted content nobody could
identify afterwards. So:

    # 1. no uncommitted tracked changes
    git status --porcelain                                  # MUST be empty

    # 2. no IGNORED files inside what npm actually packs (not the whole repo)
    ROOTS=$(node -p "require('./package.json').files.join(' ')")
    git status --porcelain --ignored=matching -- $ROOTS | grep '^!!'   # MUST print nothing

    # 3. HEAD must exist on the remote
    git fetch -q && git branch -r --contains HEAD | grep -q . \
      && echo "pushed OK" || echo "NOT PUSHED — stop"

    git log --oneline -1                                    # record this SHA
    npm publish --tag <tag>                                 # answer the 2FA prompt

**Why three checks and not one.** (1) is ordinary cleanliness. (2) exists because `npm pack` ships
whatever `files:` covers **including git-ignored files**, so a clean-looking tree can still pack a
stray `*.log` or `.cache/` — **and it must be scoped to the packed roots**: run bare across this
repo it reports ~161 ignored paths (`node_modules/`, `coverage/`) and can never be empty, which
would train you to ignore it. (3) uses `branch -r --contains` rather than reading "ahead" from
`git status -sb`, because a detached HEAD or a branch with no upstream reports no "ahead" while
still being unpushed — and an unpushed SHA in your incident note exists on **no other machine**,
which is T35's original harm reproduced with a checklist tick against it.

A dirty tree here reproduces the original incident while you are trying to recover from a different
one. If either check fails, stash, commit or push first — do not publish "just this once".

Publishing this way works *while the restriction stays on*, so **no window opens** and there is
nothing to undo. Note the version you publish is **permanent**: npm refuses to republish a version,
the unpublish window is 72 hours, and it closes entirely once anything depends on it. Getting the
version wrong is not recoverable by retrying.

> ⚠️ **UNTESTED.** The account's 2FA mode is `auth-only`, which prompts on login and account changes
> rather than on writes. npm's documentation does not state whether a package-level publishing
> policy overrides an account-level `auth-only` mode. If this route fails, fall through to the
> secondary — do not assume the setting is broken.

### Secondary — disable the restriction temporarily

Only if the primary is unavailable. Web UI → switch to the default option → publish → **switch it
back immediately.**

This *does* open a window in which any valid token can publish. Treat re-enabling as part of the
same task, not as follow-up work.

### Both routes share one dependency

Changing package settings **also requires 2FA**. So if you cannot satisfy a 2FA challenge, *neither*
route is available — the secondary does not rescue the case its name implies. There is one account
and no organisation, so there is no second person to fall back to. If that risk is unacceptable,
the fix is an npm org with a second owner, not a change to this document.

---

## 3. Every hand-publish is an incident

The restriction exists because seven releases were hand-published, and one of them —
`4.0.0-rc.1`, on 2026-08-15 — was packed from a working tree, so whatever was on disk at that
moment shipped, committed or not. Testing against it reproduced already-fixed bugs and proved
nothing about the source. That history is recorded in
[the lifecycle backlog](../_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md)
row **T35**, now closed.

**If you hand-publish, file a NEW Bug or Fast Lane row** recording **date, version, and why CI could
not do it**, and cross-reference T35 as the origin. Do **not** append to T35 — it is closed, and
reopening a closed row to record a new instance loses the distinction between the history and the
recurrence. Then fix the reason.

**How to tell after the fact:**

    npm view convoke-agents@<version> dist.attestations

Non-empty means it came through CI, and the attestation names the source repo and commit.
**Empty is strong evidence of a hand-publish** — it is how `4.0.0` is known to have bypassed the
pipeline — but read it as one-way: attestations post-date this practice, so an *old* version can be
empty for uninteresting reasons. For anything published from 4.0.1 onward, empty means hand-published.
The marker is permanent either way.

---

## 4. What else this setting gates

It is easy to read "publishing access" as covering `npm publish` only. It does not — the npm
documentation page is titled *"Requiring 2FA for package publishing **and settings
modification**"*. Every one of these is gated on this package:

| Command | Typical use |
|---|---|
| `npm publish` | releasing |
| `npm dist-tag add/rm` | moving `latest` or `rc` — the documented repair for a corrupted tag |
| `npm deprecate` | retracting a bad release once the 72-hour unpublish window has closed |
| `npm owner add/rm` | adding a second maintainer |
| `npm access set/grant/revoke` | changing this very setting |

**CI cannot substitute for any of them except the first.** A trusted publisher's permitted actions
are `npm publish` and `npm stage publish` — nothing else.

**Consequences worth knowing before an incident:**

- The `npm dist-tag add` repair for a bad `latest` pointer now needs an interactive session with a
  live 2FA prompt. It cannot be scripted and cannot be run by CI.
- The documented release rollback ([story `dist-1-6`](../_bmad-output/implementation-artifacts/dist-1-6-rehearse-the-composed-job-before-the-release-tag.md),
  AC9) depends on that same command, so it inherits the same dependency.
- `npm deprecate` — the standard response to a broken release — is gated too.

---

## 5. The downgrade guard refused the publish

`scripts/ci/downgrade-guard.sh` (FR5) runs inside the `publish` job and **refuses rather than guesses**
whenever it cannot establish that the version being published is at least the registry's current
`latest`. That is deliberate: `sort -V` ranks `4.1.0` *below* `4.1.0-rc.1`, the reverse of SemVer, so a
guard that tried to compare its way through an unparseable or prerelease `latest` would be worse than
one that stops.

There is **no override** — no `workflow_dispatch` input, no environment variable, no `[skip-guard]`.
That is a deliberate choice, not an oversight (see *Why there is no override* below). What follows is
the sanctioned repair for each way it can refuse, so the procedure is written down rather than
rediscovered under pressure.

| `FATAL:` message begins | What it means | Repair |
|---|---|---|
| `GUARD_CAND '…' is not a plain X.Y.Z release` | The version being published is malformed or is a prerelease. This is a **repository** problem, not a registry one. | Fix `package.json` and the tag. Nothing to repair on npm. |
| `registry returned an EMPTY 'latest'` | The package exists but has no `latest` dist-tag — `npm dist-tag rm`, or mid-replication. | `npm dist-tag add convoke-agents@<good-version> latest`, then re-run the job. **Interactive, needs 2FA** — see §4. |
| `registry returned a multi-line 'latest'` | `npm view` returned something the guard will not parse. Usually a transient registry or network fault, occasionally a genuinely corrupted tag. | Re-run the job first — this is the one mode that is often transient. If it repeats, read the tag by hand (`npm view convoke-agents dist-tags`) and repair as above. |
| `current 'latest' … is not a plain X.Y.Z release` | A prerelease or non-canonical version is parked on `latest` — e.g. `4.0.1-rc.0`. | `npm dist-tag add convoke-agents@<good-version> latest`, then re-run. **Interactive, needs 2FA.** |
| `refusing to publish X to 'latest' -- lower than current latest Y` | The version being published really is lower than `latest`. **The guard cannot tell an accidental downgrade from a deliberate repair of a corrupted `latest`, which is exactly why it stops and asks.** | Decide which value is wrong. If `Y` is legitimate, do not publish — fix the version being released. If `Y` is wrong (an accidental `999.0.0`, a mistaken `dist-tag set`), repair `latest` first, then re-run. |

**Every repair route runs through `npm dist-tag add`, so every one of them inherits §4's dependency:**
an interactive session with a live 2FA prompt. A token cannot do it and CI can never do it. Budget for
a human at a terminal, not a re-run.

### Why there is no override

An override was considered and declined (backlog `T44`). A `workflow_dispatch` boolean the guard
honoured would be genuinely useful — because `npm publish` sets `latest` as a side effect, the
already-trusted CI path could then perform the repair itself, with no 2FA prompt. It was declined on
cost, not on principle: `ci.yml` has no `workflow_dispatch` trigger at all, so adding the input means
opening manual dispatch on the workflow that contains the `publish` job, then gating that surface so a
dispatch cannot publish arbitrarily. That is a new and permanent security surface in exchange for a
rare event that already requires a human.

If the guard ever fires twice in one release cycle, revisit that trade — the calculation above assumes
it is rare.

---

## 6. Related

- [ADR-003 — publish-path enforcement](../_bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md)
  — why registry-side enforcement was chosen over a repository guard
- [Epic: 4.0.1 distribution integrity](../_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md)
  — FR9 and the surrounding publish-path work
- [CI workflow](../.github/workflows/ci.yml) — the `publish` job: **eight prerequisite jobs**
  (`needs:`) and **five inline gates** inside the publish step itself. Both numbers appear in the
  project's records and they count different things.
