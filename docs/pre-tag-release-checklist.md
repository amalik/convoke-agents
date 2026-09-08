# Pre-tag release checklist

**Why this exists.** A release tag is spent the moment it is pushed. Three gates can print OK and the
fourth abort on a tag that can no longer be reused — which is exactly what a `v4.0.1` tag would have
done while `package.json` still read `4.0.1-rc.0`. This checklist is the second half of **T49**: the
first half (rehearsing the downgrade comparison on a runner without spending a tag) shipped with
`dist-1b-1` as the non-publishing `downgrade-guard-dry` job.

Every step below is a command with an expected result. Run them against the **exact SHA you intend to
tag**, not against your working tree.

---

## 1. The version is the one you mean to release

```sh
node -p "require('./package.json').version"
```

Must equal the stable version you are about to tag, **without** an `-rc` suffix or build metadata.
The publish job re-derives `CAND` from this and rejects anything that is not a plain `X.Y.Z`
(`ci.yml`, the `CAND` shape check) — and the tag-agreement gate (`dist-1-4`) refuses a tag that
disagrees with it.

> This is the step that was open in T49 for weeks. The tree read `4.0.1-rc.0` while the intended tag
> was `v4.0.1`.

## 2. The working tree is clean and pushed

```sh
git status --porcelain          # expect: empty
git log --oneline -1            # note the SHA — this is what you tag
git fetch origin && git status -sb | head -1   # expect: no "ahead"
```

A tag pointing at an unpushed commit publishes something no one can inspect.

## 3. Every prerequisite job is green on that exact SHA

```sh
SHA=$(git rev-parse HEAD)
RID=$(gh run list --limit 20 --json databaseId,headSha,workflowName \
      --jq "[.[] | select(.headSha==\"$SHA\" and .workflowName==\"CI\")][0].databaseId")
echo "run=$RID"   # must be non-empty; empty means CI has not run on this SHA yet
gh run view "$RID" --json jobs --jq '.jobs[] | "\(.conclusion)\t\(.name)"'
```

> **`workflowName=="CI"` is load-bearing.** Several workflows run on the same push — this SHA has both
> a `CI` run and a `CodeQL` one. Filtering on `headSha` alone returns whichever is newest, silently
> giving you an unrelated job list with no "Downgrade guard (dry)" and no error.

Expect **11 jobs `success`, and exactly two `skipped`: `publish` and `burn-in`.** Both skips are
correct on a branch push — `publish` fires only on `refs/tags/v*` (proven by `dist-1-6`), so a `main`
push exercises the full prerequisite set without touching the registry. Any *other* skip, or any
`failure`/`cancelled`, stops the release here.

**`Downgrade guard (dry)` must be among them and must be green.** It runs only on `main` pushes and
PRs — deliberately *not* on tag pushes — so if you skip this step it never runs for your release at
all.

## 4. Rehearse the actual comparison against the live registry

```sh
CUR=$(npm view convoke-agents dist-tags.latest)
GUARD_CAND=<version-you-are-releasing> GUARD_CURRENT="$CUR" \
  GUARD_PKG=convoke-agents ./scripts/ci/downgrade-guard.sh; echo "exit=$?"
```

Expect `... >= current latest <CUR> -- OK` and `exit=0`.

Then prove it can still refuse, on the same live data:

```sh
GUARD_CAND=0.0.1 GUARD_CURRENT="$CUR" GUARD_PKG=convoke-agents \
  ./scripts/ci/downgrade-guard.sh; echo "exit=$?"
```

Expect `FATAL: refusing to publish ...` and `exit=1`. A guard you have only ever seen say OK is not
evidence — see `verification-must-be-falsifiable`.

**Known limit, stated precisely.** The dry job injects `GUARD_CURRENT` and makes **no network call**.
That does *not* mean the registry read is unproven: the v4.0.1 publish executed it against the live
registry on a runner and logged `Downgrade guard: 4.0.1 >= current latest 4.0.0 -- OK`
(run `32671542491`, 2026-08-23). What has **never** fired on a runner is the narrower **E404 skip
branch** (`ci.yml:949-975`) — the path taken when the registry reports the package as unpublished —
because `convoke-agents` has always existed there. Its anchoring is proven by fixture only.

That branch fails **loud**, not open (T46 closed the fail-open), so the exposure is an aborted publish
on a spent tag rather than a silent downgrade. Step 4 above is the closest rehearsal available without
publishing.

> An earlier draft of this paragraph said the `npm view` *invocation* had never run on a runner. That
> was false — it conflated the invocation with its E404 sub-branch. Caught by Round 1 review.

## 5. Capture the registry state before you tag

```sh
npm view convoke-agents dist-tags
```

Record the output. Nothing re-reads the registry after `npm publish` (**T47** — open), so a green run
is not evidence that `latest` moved. This capture is what you will diff against afterwards.

## 6. Tag and push — assert the name first

Do not type the version twice from memory. That is exactly how T49's original blocker arose
(`package.json` at `4.0.1-rc.0` while a `v4.0.1` tag was intended), and `dist-1-4` aborts the publish
on a mismatch — after the tag is already spent.

```sh
VER=$(node -p "require('./package.json').version")
echo "about to tag v$VER"                     # read it; it must be the release you mean
git tag "v$VER" && git push origin "v$VER"
```

Deriving the tag from `package.json` makes the agreement gate unfailable by construction.

## 7. Verify the registry actually changed

```sh
npm view convoke-agents dist-tags          # compare against step 5
npm view convoke-agents@<version> dist.attestations   # expect a signed record
```

An empty attestation means the release did **not** come through the automated path — that is how
`4.0.0` is known to have been hand-published.

---

## If the guard refuses

Do not improvise. Every refusal mode and its sanctioned repair is tabulated in
[npm-publishing-access-playbook.md](npm-publishing-access-playbook.md) §5. **Most** repair routes run
through `npm dist-tag add`, which needs an **interactive 2FA session** — see §4 of the same document.
The exception is a malformed candidate version (`... is not a plain X.Y.Z release`): that is a
repository problem, fixed in `package.json` and the tag, with nothing to repair on npm. There is no
override for the guard itself.
