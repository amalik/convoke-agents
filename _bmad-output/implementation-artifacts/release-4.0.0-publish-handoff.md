# Convoke 4.0.0 — Publish Handoff

**Written:** 2026-08-17 · **For:** the session running the publication · **Status of this doc:** working note, not a governed artifact.

State verified against the tree at the time of writing. Re-verify anything below that a step depends on — a second session has been writing since.

---

## 1. Where things actually stand

```
origin/main   0381a3f8  chore(badges): auto-regenerate badges.json [skip ci]   ← badges.json = 2026-08-17
              078a3074  Update config.yaml                                    ← local HEAD, badges.json = 2026-08-16
              f67092db  release: Convoke 4.0.0                                ← where tag v4.0.0 points

remote tag    v4.0.0  →  f67092db          (exists; no GitHub Release attached)
npm           latest: 3.3.0  ·  rc: 4.0.0-rc.6
working tree  docs/badges.json + scripts/generate-badges-json.js modified, uncommitted (the T39 fix, in flight)
```

**Local `main` is one commit behind `origin/main`.** That single fact is what broke the previous plan.

### Why the last attempt failed, precisely

CI run `31943190328` (tag `v4.0.0`, 2026-08-16): all eight gates green — lint, test 18/20/22, python-test, coverage, security, package-check, agent-surface-parity, fresh-install. Only `publish` failed:

```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in
```

**The `NPM_TOKEN` diagnosis was correct.** But it expired at midnight UTC. In that same log, `prepublishOnly` → `badges:check` *passed*, because the run was on the 16th and `docs/badges.json` said `2026-08-16`. Re-tagging a commit whose `badges.json` says `2026-08-16` and running it today makes `badges:check` exit 1 on the date field — aborting before `npm publish` ever asks for the token.

Verified live on 2026-08-17: `npm run badges:check` → exit 1, `generated` the only delta.

---

## 2. Phase 0 — the only change that ships before the tag

**T39** (Fast Lane, score 9.5, effort 1) — `prepublishOnly` runs `badges:check`, which regenerates a dated file and diffs it, so any publish on a day after the last badges commit aborts on the timestamp alone.

The in-flight edit takes backlog **fix option (a)** — drop `generated` from the generator. That is the better of the three options: it fixes the comparison at the source, so both `badges:check` *and* `.github/workflows/badges.yml`'s own diff stop firing on a calendar roll. Option (c) would only have moved one gate.

### Verified before adopting it

- **Nothing reads `generated`.** Repo-wide grep for `badges.json` finds only its generator, `.github/workflows/badges.yml`, `knip.json`, and `package.json`'s own `badges:check`. The README's four dynamic shields were removed by the README rewrite (D9); the two remaining badges are static (`npm/v`, `license`). No test asserts the key.
- The gate could therefore only ever fail on the date. It blocked six release candidates and was structurally incapable of catching a real defect.

### One reviewer note, not a blocker

This makes the orphan harmless; it does not resolve it. `deferred-work.md:957` **CR-README-D03** already records that `docs/badges.json` has no consumer yet still gates `npm publish`, and asks whether to retire the gate or give the file a consumer. Correct scope call to leave that alone here — but link T39 to CR-README-D03 so it doesn't rot.

### Commit plan

> **Files:** `scripts/generate-badges-json.js`, `docs/badges.json`
> **Summary:** `fix(T39): stop the publish gating on a regenerated timestamp`
> **Description:** `generate-badges-json.js` stamped a `generated` date into `docs/badges.json`, which is then compared with `git diff --exit-code` by both `badges:check` (wired into `prepublishOnly`) and `.github/workflows/badges.yml`. Any publish on a day after the last badges commit therefore aborted on a calendar roll rather than a real change — it blocked the 4.0.0 tag run and forced a no-op timestamp commit before every prior release candidate. Counts are the payload and nothing reads the date: a repo-wide grep finds only the generator, the workflow, `knip.json` and `package.json`. Verified live 2026-08-17: `badges:check` exits 1 with `generated` as the only delta. Related: `deferred-work.md` CR-README-D03 (the file is an orphan that still gates publish — unresolved here, deliberately). Round 1: `<status>`.

**Both files in one commit.** `scripts/generate-badges-json.js` is in `badges.yml`'s path filter, so pushing the generator alone triggers the workflow, which regenerates `docs/badges.json`, auto-commits it with `[skip ci]`, and puts local behind by one again — the exact failure this document exists to prevent. Committed together, the workflow regenerates, finds no diff, logs "No changes", and commits nothing.

**Not in this commit:** BUG-15. See §4.

---

## 3. Publish runbook

Run in order. Steps 2–3 must complete before step 4 or CI hits the same locked door.

```bash
# 0. Land Phase 0.
#    `git pull` WILL REFUSE while docs/badges.json is modified — origin changed the same
#    region (08-16 → 08-17). badges.json is generated output, so discard and rebuild it:
git checkout -- docs/badges.json
git pull                                  # → 0381a3f8
npm run badges                            # regenerate, now without the date
# commit both files per §2, then:
git push

# 1. Install the key.
#    npmjs.com → sign in → avatar → Access Tokens → Generate New Token
#                → Classic Token → Automation → copy
gh secret set NPM_TOKEN                   # paste when prompted

# 2. Re-point the tag. Tag the REMOTE tip explicitly, never bare local HEAD.
git fetch origin
git tag -d v4.0.0
git push origin :refs/tags/v4.0.0
git tag -a v4.0.0 origin/main -m "Convoke 4.0.0"
git push origin v4.0.0                    # this alone re-triggers CI; no separate re-run

# 3. Verify — the output, not the vibe.
npm view convoke-agents dist-tags         # want: latest: 4.0.0
```

Checked: no GitHub Release points at `v4.0.0`, so deleting the tag orphans nothing (`gh release list` shows 3.3.0 as Latest). `package.json.repository.url` is `github.com/amalik/convoke-agents` and matches `origin`, so `--provenance` will resolve. The `publish` job is gated on eight jobs; all eight were green on 2026-08-16.

`git tag -a v4.0.0 origin/main` rather than bare is what permanently kills the behind-by-one class.

---

## 4. Tag freeze — hold this until BUG-15 ships

**BUG-15** (Bug Lane, score 17.9 — the highest-scoring open item in the project) has been moved to 4.0.1 by operator decision. `.github/workflows/ci.yml:377` runs `npm publish --provenance --access public` with **no `--tag`**, and the job fires on any `refs/tags/v*`.

Publishing `4.0.0` this way is correct — a final release belongs on `latest`.

> **From now until BUG-15 lands: no `v*` tag may be pushed except `v4.0.0` itself.**
> Any tagged release candidate would go straight to `latest` and be served to every existing user. If an rc is needed inside that window, publish it by hand with an explicit `--tag rc`, as rc.1–rc.6 already went out.

---

## 5. Concurrency rules — these apply because two sessions are writing

1. **`staleness-preflight-for-backlog-pickup`** (`project-context.md:258`). The parallel-tracks trigger has **no age exemption**. T39 is a day old so the date arm does not fire, but sessions have been writing since it was qualified — run the four checks anyway.
2. **`backlog-write-discipline`** (`project-context.md:298`). Flipping T39 to closed means moving the row **below the live block in the same edit**, then running the lane-order check and pasting its result into the commit Description. The Bug Lane already carries a closed 17.1 row sitting above `BUG-15` at 17.9 — that is what this rule exists to stop.
3. **`I150`.** Allocate any new backlog ID by grepping for the candidate ID first, never by `max(I-number)`. Four collisions came from exactly that; one went undetected for months.
4. **`code-review-convergence`** (`project-context.md:106`). Round 1 fires the moment the commit plan exists, not when asked. Derive the review diff from `git diff HEAD --name-only`, and assert the reviewed set equals the committed set before emitting the plan.

---

## 6. Known state this release ships with, accepted

- **Cross-module version skew widened.** `_bmad/bme/_vortex/config.yaml` is now `4.0.0`; `_artifacts`, `_enhance`, `_gyre` and `_team-factory` remain `1.0.0`. `convoke-doctor` reports skew across all five, and per **BUG-17** `convoke-update` only ever reads `_vortex` — so operators get a louder warning about a state they have no command to resolve. Lands on top of **BUG-19** (warnings on a healthy install have stopped carrying information). Not a ship blocker; do not discover it in a support thread.
- **Commit `078a3074` is titled `Update config.yaml`** — the exact form `commit-preparation` names as never acceptable. Already landed; noted so it is not repeated.

---

## 7. What comes after — 4.0.1, capped at six clusters

Order matters only for the first: **BUG-15 + T35 go first**, because until they land the tag freeze in §4 stays in force.

| Cluster | Rows | Score / E | Concern |
|---|---|---|---|
| Publish-path integrity | **BUG-15**, **T35** | 17.9 / 1 · 4.5 / 2 | Pin the dist-tag; bind a published tarball to a committed tree |
| Watch the audit that works | **T32** | 9.5 / 1 | `npm run docs:audit` exists, was failing, nothing runs it |
| Unreachable skills | **I141** | 3.6 / 2 | `_bmad/bme/_portability/` ships but no install path copies it — 4 skills unreachable in every install |
| Manifest truth | **I134** | 5.4 / 2 | Four genuine broken skill dependencies in the shipped manifest, invisible ~6 weeks |
| Export robustness | **T33** | 7.2 / 1 | A brace in a persona name crashes the export — load-bearing before any new team is authored |
| Honest warnings | **BUG-19(a)** | — | The `⚠ BMM dependencies: registry present` label contradicts its own message. **Last** — part (b) touches `preflight-soft-warn` and stays deferred |

Then, unchanged and kept **separate** so its cost measurement survives: the tiny meta-model baseline (1 ADR + 1 name registry + 1 doctor/CI check, hard budget) → Forge as the measured test against Gyre's cost.
