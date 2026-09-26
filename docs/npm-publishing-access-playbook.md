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

> **Pre-flight — the manifest check belongs here too.** This route bypasses CI entirely, so the
> `agent-surface-parity` gate that normally refuses a drifted plugin manifest never runs. Before
> publishing by hand, run `pre-tag-release-checklist.md` §1a from the repository root:
> `node -e "const m=require('./.claude-plugin/marketplace.json').plugins[0].version, p=require('./package.json').version; console.log(m, p, m===p ? 'OK' : 'DRIFT')"`.
> §1a lives on the *tag* path; this section exists for when the tag path is unavailable, which is
> exactly when nothing else will catch it.

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
| `GUARD_CAND '…' is not a plain X.Y.Z release` | The version being published is malformed or is a prerelease. This is a **repository** problem, not a registry one. | Fix `package.json`, **`.claude-plugin/marketplace.json`** and the tag. Nothing to repair on npm. |
| `registry returned an EMPTY 'latest'` | The package exists but has no `latest` dist-tag — `npm dist-tag rm`, or mid-replication. | `npm dist-tag add convoke-agents@<good-version> latest`, then re-run the job. **Interactive, needs 2FA** — see §4. |
| `registry returned a multi-line 'latest'` | `npm view` returned something the guard will not parse. Usually a transient registry or network fault, occasionally a genuinely corrupted tag. | Re-run the job first — this is the one mode that is often transient. If it repeats, read the tag by hand (`npm view convoke-agents dist-tags`) and repair as above. |
| `current 'latest' … is not a plain X.Y.Z release` | A prerelease or non-canonical version is parked on `latest` — e.g. `4.0.1-rc.0`. | `npm dist-tag add convoke-agents@<good-version> latest`, then re-run. **Interactive, needs 2FA.** |
| `refusing to publish X to 'latest' -- lower than current latest Y` | The version being published really is lower than `latest`. **The guard cannot tell an accidental downgrade from a deliberate repair of a corrupted `latest`, which is exactly why it stops and asks.** | Decide which value is wrong. If `Y` is legitimate, do not publish — fix the version being released — **in `package.json` and `.claude-plugin/marketplace.json` together**, per row 1. If `Y` is wrong (an accidental `999.0.0`, a mistaken `dist-tag set`), repair `latest` first, then re-run. |

**Split the table by WHAT is at fault, because that decides whether you need a human at a terminal.**

- **The CANDIDATE is at fault** — row 1 (`GUARD_CAND … is not a plain X.Y.Z release`), and the first
  branch of row 5 (the version really is lower and `latest` is legitimate). These are **repository**
  problems: fix `package.json`, `.claude-plugin/marketplace.json` and the tag. Nothing to repair on
  npm, no 2FA, no interactive session.

  > **The manifest is part of this repair since 2026-09-21 (T206), and omitting it burns a second
  > tag.** `agent-surface-parity` now runs `validate-marketplace.js`, which fails when
  > `.claude-plugin/marketplace.json`'s `plugins[0].version` differs from `package.json`; that job
  > is in `publish.needs`, so the publish never starts and the new tag is spent. Bumping only
  > `package.json` here is the natural reading of the old wording and is exactly the trap. Check
  > with `docs/pre-tag-release-checklist.md` step 1a before re-tagging.
- **`latest` is at fault** — rows 2 and 4, and the second branch of row 5. These run through
  `npm dist-tag add` and therefore inherit §4's dependency: **an interactive session with a live 2FA
  prompt.** A token cannot do it and CI can never do it. Budget for a human at a terminal.
- **Neither, yet** — row 3 (multi-line `latest`) is the one mode that is often transient. Re-run the job
  first; only if it repeats is it a `latest` repair.

An earlier version of this paragraph read *"Every repair route runs through `npm dist-tag add`"*, which
contradicted row 1 of its own table directly above it and sent a reader looking for a 2FA session they
did not need. Corrected 2026-09-08.

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

## 6. The credential scan refused the publish

`node scripts/audit/npm-credential-scan.js --cwd "$PWD"` runs in the publish job before `npm publish`
(`.github/workflows/ci.yml`). Run it the same way if you reproduce it by hand: without `--cwd` it infers
the project directory, and from a subdirectory that is a different set of paths than CI checks.

It refuses the publish when an npmrc exists on any path npm reads under the existence rule, when npm's
**builtin** npmrc sets a credential, when `NODE_AUTH_TOKEN` / `NPM_ID_TOKEN` / a credential-shaped or
config-repointing `npm_config_*` variable is set, or when it could not establish which paths npm reads.

**Two rules, because npm has two kinds of config file.** npm has exactly four file-backed config sources
— `builtin`, `project`, `user`, `global`.

- For `project`, `user` and `global`, **existence is the finding, whatever the file contains.** FR4
  removed `registry-url:` from `setup-node` precisely so nothing writes a userconfig, so this job's
  steady state is *no npmrc at all* — observed live in `dist-1-6`'s rehearsal, run `32599414962`, which
  is the same evidence that the guard this replaced was inspecting zero files. A "clean" npmrc means
  something wrote one, and the next thing it writes may carry a token.
- For `builtin` (`<npm install dir>/npmrc`), **content is the finding**, because that file legitimately
  exists on every install — npm ships one containing `prefix = …`. It is reported by neither
  `npm config get userconfig` nor `globalconfig`, and npm emits no auth warning about it, so it is the
  one source that must be read rather than merely counted.

| Message | What it means | Repair |
|---|---|---|
| `'<path>' exists on the publish path AND sets a credential key` | A real credential is on a path npm reads. `setup-node` exports `NODE_AUTH_TOKEN='XXXXX-…'` when unset, so npm would send that dummy as a bearer token and an OIDC decline would be reported as *bad token* rather than *no token* | **Tree- or workflow-borne.** Find what wrote it — a step added before `Publish to npm`, a composite action, or a change to `setup-node`'s inputs. Remove the writer, not the file, or the next release reproduces it. **Assume the credential is compromised and revoke it** |
| `'<path>' exists on the publish path. It sets no credential key…` | The file is there and this scan found no credential key in it. That is not a promise there is no secret in it — only that no key it recognises is set | **Tree- or workflow-borne.** Same repair. The refusal is deliberate: the file's existence is the regression, not its current contents |
| `'<path>' exists on the publish path but is not a regular file` | A directory, symlink target, FIFO or socket sits where npm expects a file — usually `$npm_config_userconfig` pointed somewhere odd, or a `mkdir` that should have been a `touch` | **Workflow-borne.** Find the step that created it. npm's own read would fail too, so this is a bug in the job, not a credential |
| `'<path>' exists on the publish path and cannot be read (<CODE>)` | The file exists but this scan cannot open it, usually `EACCES` after a prior step ran something under `sudo`. Unreadable is never reported as clean | **Workflow-borne.** Fix the step that changed the ownership or mode. Do not `chmod` it and re-run without finding the writer |
| `npm's builtin npmrc '<path>' sets a credential key` | A credential was appended to the npmrc that ships beside npm itself. npm sends it with no warning | **Runner- or workflow-borne.** Find the step that wrote into npm's install directory. **Revoke the credential.** This is the most serious of these findings: nothing else in the toolchain reports it |
| `npm's builtin npmrc '<path>' cannot be read (<CODE>)` | The one source judged by content could not be inspected | **Workflow- or runner-borne.** Treat as uninspected, not clean |
| `the set of npmrc paths npm reads could not be established: …` | `npm config get` or `npm root -g` failed, so the scan does not know which paths to check. A guard that cannot see cannot clear | **Runner-borne.** Usually npm missing from `PATH` or a broken toolchain install. Fix the `setup-node` step; **re-run the job** |
| `--cwd was given with no value` | The invocation is malformed | Pass `--cwd "$PWD"` or omit the flag. Wiring bug, not a credential |
| `NODE_AUTH_TOKEN is set` | A token is in the environment, which outranks OIDC — the regression that put 4.0.0 back on the token path | **Environment-borne.** Remove the `env:` entry, secret reference, or repository/organisation Variable; **re-run the job** |
| `npm_config_* credential, rewritable or config-repointing key(s) in the environment` | npm reads config from the environment above every npmrc. Rejected names include credential spellings, rewritable ones (`${…}`), nerf-darted ones (`//`, `:`), and `userconfig`/`globalconfig`/`cert`/`key`/`cafile`, which repoint npm at another file or are themselves credentials. npm honours any casing | **Environment-borne.** Remove the variable; if it is needed elsewhere, rename it so it does not start `npm_config_`. **Re-run the job** |
| `NPM_ID_TOKEN is set` | It replaces the identity GitHub mints (`oidc.js:50`), so the exchange would run against a supplied assertion | **Environment-borne.** Remove it; **re-run the job** |

**There is no override.** No `workflow_dispatch` input, no environment variable, no skip marker — same
choice as the downgrade guard in §5, for the same reason.

**Whether the tag is spent depends on WHAT is at fault, exactly as it does in §5.** Nothing has been
published when this fires — the scan runs before `npm publish` — so the version number is not consumed.

- **Environment-borne and runner-borne causes** (the last five rows, and the two unreadable/degraded
  rows) live *outside* the tag's tree: a repository or organisation Variable, a secret reference, a
  broken toolchain. Removing one of those needs no commit, so **fix the cause and re-run the failed run
  on the same tag.** Cutting a new tag here burns a version number for nothing.
- **Tree- and workflow-borne causes** (a step or action that writes an npmrc, committed in this tree)
  cannot be fixed without a commit, so the tag *is* spent: remove the writer, then cut a new tag.

If you believe the refusal is wrong, reproduce it as the job does, from the repository root:

```bash
node scripts/audit/npm-credential-scan.js --cwd "$PWD"; echo "exit=$?"
```

**Expect this to exit 1 on a development machine** — it finds your own `~/.npmrc`, which is correct
behaviour and not the CI failure you are chasing. It prints the path, never the token. To exercise the
rules themselves against fixtures rather than your machine, run
`node --test tests/unit/npm-credential-scan.test.js`; that proves what the scan *can* detect, and cannot
reproduce a specific refusal.

## 7. Related

- [ADR-003 — publish-path enforcement](../_bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md)
  — why registry-side enforcement was chosen over a repository guard
- [Epic: 4.0.1 distribution integrity](../_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md)
  — FR9 and the surrounding publish-path work
- [CI workflow](../.github/workflows/ci.yml) — the `publish` job: **eight prerequisite jobs**
  (`needs:`) and **five inline gates** inside the publish step itself. Both numbers appear in the
  project's records and they count different things.
