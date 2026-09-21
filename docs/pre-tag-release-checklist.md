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

## 1a. `.claude-plugin/marketplace.json` declares that same version

**From the repository root**, like every other command here — these paths are cwd-relative and the
command throws from anywhere else. (An earlier draft contrasted this with step 1b; that was wrong.
`node scripts/audit/…` is equally cwd-relative — 1b's note is about how that script resolves the
repository once loaded, not about where you invoke it.)

```sh
node -e "const m=require('./.claude-plugin/marketplace.json').plugins[0].version, p=require('./package.json').version; console.log(m, p, m===p ? 'OK' : 'DRIFT')"
```

Nothing syncs these two files — there is no `version` script and no release step that touches the
manifest — so a bump edits `package.json` and leaves the manifest behind. Fix by hand: set
`plugins[0].version` in `.claude-plugin/marketplace.json` to match.

**For an `-rc` tag, the manifest takes the full prerelease string** (`4.1.0-rc.0`, not `4.1.0`).
The check is string equality, and the publish job routes prereleases to the `rc` dist-tag, so an
rc release is a real release for this purpose.

> **This step can burn a tag, which the previous behaviour could not.** `agent-surface-parity` is
> in `publish.needs` and the workflow fires on `v*`, so pushing a tag with the manifest unsynced
> fails the job and blocks the publish — and a tag is spent the moment it is pushed. That trade
> was made deliberately: the manifest sat at `4.0.0` while the package reached `4.0.3`, shipping a
> version disagreeing with its own `package.json` in **ten** tarballs (every publish from
> `4.0.0-rc.1` on except `4.0.0`; `.claude-plugin/` has been in `files[]` since 2026-04-24). The
> validator reported it every single run as a yellow warning that deferred enforcement to a
> publish-time escalation which was never built. Catching it before the tag is the point of the
> step; run it here and the gate never fires.

## 1b. `CHANGELOG.md` has an entry for that version

```sh
node scripts/audit/check-changelog-entry.js
```

Must print `✓ changelog entry for <version> dated <date>` and exit 0. It resolves the repository from its
own location, so it does not matter which directory you run it from.

It reads the entry with `changelog-reader.js`, the parser `convoke-update` itself uses, and compares
versions the way `printChangelog` does — so the entry it blesses is the entry operators are shown. It also
reads the file a second time under CommonMark's fence and comment rules, and **refuses when the two
readings disagree** rather than picking a side. On top of that it rejects:

| Shape | Why it matters |
|---|---|
| no entry for the version | `printChangelog` returns early on an empty list, so the release reaches people silently |
| `## [4.0.3]`, `- UNRELEASED`, `- TBD` | the reader tests the version and not the date, so `convoke-update` renders `4.0.3 — UNRELEASED` |
| `- 0000-00-00`, `- 2026-13-45` | date-shaped, not a date; rendered verbatim to operators |
| a heading that is only an example — inside a code fence, or an HTML comment | `changelog-reader.js` sees neither fences indented 1-3 spaces nor comments, so an example counts as a release. `CHANGELOG.md` already carries two indented fenced blocks |
| two entries for one version, or a malformed `## 4.0.2 - …` neighbour | the first wins and the rest of the file leaks into it — the leak the reader's own header comment warns about |
| a dated heading with an empty body, or a body that is only a comment | "has an entry" was satisfied by a heading alone |
| a mistyped flag (`--versoin 4.0.3`) | exits 2 rather than silently checking the version in `package.json` instead |

Each shape in the table above is pinned by a test in `tests/audit/check-changelog-entry.test.js`.

> **Retracted 2026-09-17.** This paragraph used to add that every guard in the script — 23 of them — had
> been reverted one at a time and that *no guard survives unpinned*. That is not true at this commit.
> Reverting `visibleHeadings`' same-line comment return, `VERSIONISH_RE`'s 1-3-space indent
> tolerance or `parseArgs`' rejection of a flag-shaped value each leaves the suite
> fully green. Re-derive before trusting any such claim: copy the script, revert one guard, point a copy
> of the test file at it, and run `node --test`. The suite pins the shapes in the table, not every guard
> in the file.

Nothing else catches any of this. `docs-audit.js` does read `CHANGELOG.md` — broken-link, naming and
coverage checks run on it, while stale-reference and broken-path checks are deliberately skipped
(`scripts/docs-audit.js:750-755`) — but no CI job checks that the file has an entry for the version being
released, and before `fic-2-1` added this step the word "changelog" did not appear in this checklist at
all.

Pre-release versions are checked the same way: this changelog carries five dated `-alpha` entries, and a
trailing note such as `- 2026-02-15 (Unpublished)` is accepted.

So: replace the `UNRELEASED` placeholder with the release date, then re-run the check above.

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

Expect **every job `success` except `publish` and `burn-in`, which must both be `skipped`.** They skip
for *different* reasons, and neither runs on a plain branch push: `publish` is gated on
`startsWith(github.ref, 'refs/tags/v')` (`ci.yml:572`), while `burn-in` is gated on
`github.event_name == 'pull_request'` (`ci.yml:80`) and so does not run on a tag push either. A `main`
push therefore exercises the full prerequisite set without touching the registry (`dist-1-6`). Any
*other* skip, or any `failure`/`cancelled`, stops the release here.

> Deliberately not a job COUNT. An earlier draft said "expect 11 successes"; that was true the day it
> was written and goes stale the moment a Node version joins the test matrix — and a stale count in a
> release procedure reads as authoritative, halting a correct release. Name the load-bearing jobs
> instead.
>
> A second draft then pluralised the skip reason — *"they fire only on `refs/tags/v*`"* — which is true
> of `publish` and false of `burn-in`. Introduced while removing the count, and caught by review of that
> removal. The two conditions are unrelated and are now stated separately.

**`Downgrade guard (dry)` must be among the successes.** It runs only on `main` pushes and PRs —
deliberately *not* on tag pushes — so if you skip this step it never runs for your release at all.

### The documentation coverage denominator

This runs as a step of the audit job above, so on a green pipeline it has already passed. Run it
locally when you want the detail, or when the pipeline is not green yet:

```bash
node scripts/audit/coverage-denominator.js
```

**What this asserts: that a derivation pass was *recorded* over the full in-scope documentation set.**
It derives that set from tracked files — every `*.md` under `docs/` and at the repository root, minus a
declared exclusion list, plus the module documents named explicitly — and refuses if any of them has no
row in the coverage table, or has one saying it was not examined. A tracked `*.md` added under `docs/`
enters the denominator on its own; nobody maintains a list of what to check. The match is exact: a
`.MD` or `.markdown` file is not seen, and neither is an untracked one.

**What this does NOT assert: that any document is correct.** No check can decide whether a sentence is
true. This one reads coverage, which is mechanically checkable, and stops a story being dropped while
the release reports a completed pass. A green result here is not evidence that the documentation is
accurate, and must not be cited as such.

When it refuses it names each file and the story that owns it, or reports `owner: none` when a file has
no row at all. Either way the fix is to examine the file and record the result — not to add a row
asserting work that was never done.

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

**Poll — do not compare once.** The registry lags the publish job, and during that window every check
here reads as a *failed* release.

```sh
VER=$(node -p "require('./package.json').version")
for i in $(seq 1 18); do
  OUT=$(curl -s https://registry.npmjs.org/convoke-agents \
        | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);
          process.stdout.write(JSON.stringify(j["dist-tags"]))})')
  echo "$(date -u +%H:%M:%SZ)  $OUT"
  case "$OUT" in *"\"latest\":\"$VER\""*) echo "moved"; break;; esac
  sleep 20
done
npm view "convoke-agents@$VER" dist.attestations --prefer-online   # expect a signed record
```

Expect `latest` to become the version you tagged, and a `provenance` predicate. An empty attestation means
the release did **not** come through the automated path — that is how `4.0.0` is known to have been
hand-published.

**Measured at the 4.0.3 publish (2026-09-17): the gap was ~2.5 minutes.** The job logged
`+ convoke-agents@4.0.3` and a Sigstore transparency entry at 10:44:28Z; the packument — read uncached,
over plain HTTP, with no npm cache in the way — still returned `latest: 4.0.2` and `404` for the new
version at 10:45:33, 10:45:53, 10:46:13 and 10:46:34, and first showed `latest: 4.0.3` at 10:46:54.

> **If it has not moved, do not retag.** An npm version is permanent and a spent tag cannot be reused, so
> retagging cannot repair a publish — it can only burn the next version number. Read the `publish` job's
> log first: `+ convoke-agents@<version>` and a `Provenance statement published to transparency log` line
> mean the publish succeeded and you are looking at propagation. Absent those, go to
> `docs/npm-publishing-access-playbook.md` §5.

`T47` is the reason this is a manual poll: nothing in the pipeline re-reads the registry after
`npm publish`, so a green run is not evidence that `latest` moved.

---

## If the guard refuses

Do not improvise. Every refusal mode and its sanctioned repair is tabulated in
[npm-publishing-access-playbook.md](npm-publishing-access-playbook.md) §5. **Read it by what is at fault,
not by counting routes.** If the CANDIDATE is wrong — a malformed version, or a genuine downgrade where
`latest` is legitimate — it is a repository problem: fix `package.json` and the tag, with nothing to
repair on npm and no 2FA needed. If **`latest`** is wrong, the repair runs through `npm dist-tag add`,
which needs an **interactive 2FA session** (§4) that a token and CI can never provide. There is no
override for the guard itself.

> Two earlier drafts of this paragraph were both wrong: the first repeated the playbook's own
> "every repair route runs through `npm dist-tag add`" (untrue of its row 1), the second called the
> malformed-candidate case *the* exception (there are two). The playbook's contradicting sentence is
> fixed in the same commit.
