---
baseline_commit: 4180dd629903cb7d4e92c728e2319d69656aec5c
---

# Story 1.5: Make authentication failure loud

Status: done

<!-- baseline_commit deliberately ABSENT — `dev-story` stamps it at implementation start. -->

## Story

As a **Convoke maintainer**,
I want the publish job to fail rather than publish as nobody,
so that a broken release never looks like a successful one.

## ⚠️ Read this before anything else

**This is the riskiest story in the epic.** It edits the exact authentication path on which **4.0.0 failed four times while appearing to work** (`ci.yml:379-387`). It covers FR2 *and* FR4 — T41 findings **(b)** and **(d)**, its last two open.

**Two claims an earlier draft of this story made are FALSE and were corrected at story review. Do not reintroduce them:**

1. **This story does NOT unblock Story 1.6.** Story 1.6's own AC (epic `:528-530`) states its rehearsal *"is permitted under NFR1's exemption, because Story 1.2 landed FR1 and a prerelease provably routes to `rc` — the exemption depends on FR1 alone, not on FR5"*. **1.6 has been permitted since `dist-1-2`.** Nothing here gates it.
2. **This story does NOT retire the standing no-tag rule.** `convoke-note-4-0-1-scope-decisions.md:187-190` says verbatim: *"Retirement is a separate decision and **cannot precede Story 1.6**, which is the composed live tag rehearsal this rule exists to stage."* That text was written by `dist-1-4`'s R1 to correct this exact error. **Closing T41 satisfies the rule's condition; it does not authorise the retirement.** Record the state change and leave the rule standing.

## Acceptance Criteria

1. **AC1 — FR2: the job asserts npm ≥ 11.5.1 and fails loudly below it.** Given the runner resolves an npm below 11.5.1, the publish job fails with a message naming the **OIDC registry-auth floor**. Verified at authoring time against `https://nodejs.org/dist/index.json`: of **27** released node 24.x lines, **exactly 8** bundle npm below 11.5.1 (`v24.4.1`/`v24.4.0`/`v24.3.0` → 11.4.2, `v24.2.0` → 11.3.0, …); newest is `v24.19.0` → 11.17.0. `setup-node` defaults `check-latest: false`, so **this currently works by luck of the runner toolcache.**
2. **AC2 — The assertion runs BEFORE `npm publish`, and before FR5's registry read.** A wrong npm is an environment fault; it should not cost a registry round-trip to discover.
3. **AC3 — FR4: `.npmrc` must not carry an unset `_authToken`.** `setup-node`'s `registry-url:` writes `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}` into a generated userconfig. With `NODE_AUTH_TOKEN` unset — which is **deliberate**, this job uses OIDC and `ci.yml:402` says so explicitly — npm sends the literal 14-character string `${NODE_AUTH_TOKEN}` as a bearer token. An OIDC decline therefore surfaces as ***bad token*** rather than ***no token***.
4. **AC4 — The FR4 remedy is chosen against npm's source, which IS readable locally.** An earlier draft said "none verifiable locally" and forbade picking on plausibility — an unsatisfiable pairing. **npm 11.11.0 is installed on this machine and its OIDC implementation settles the question** (see Dev Notes). Verify it yourself at implementation time rather than trusting this AC, then record what the source establishes and what genuinely remains for Story 1.6.

5. **AC5 — A pre-publish identity assertion IS possible, and one MUST ship.** An earlier draft of this story declared it impossible and instructed recording a negative result. **That was wrong, and npm's own source refutes it:** `lib/commands/publish.js:141` calls `await oidc(...)` **unconditionally**, and every `dryRun` branch is at `:158` or later — so **`npm publish --dry-run` performs the complete OIDC exchange** (ID-token fetch, POST to `/-/npm/v1/oidc/token/exchange/package/<name>`, and `config.set` of the returned token) and then does not publish. Three assertions exist, in ascending strength:
   - **(i)** assert `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN` are non-empty — `oidc.js` returns `undefined` without them; zero cost, zero network, this is the `id-token: write` precondition
   - **(ii)** `npm publish --dry-run --loglevel verbose`, asserting the success line appears — proves the trusted-publisher entry matches this repo+workflow **before** the real write
   - **(iii)** reproduce the exchange by hand and `npm whoami` with the returned token

   **Critical caveat, and it is the reason a naive version fails open:** `oidc()` is written to `return undefined` on every failure path and **never throws**, so a `--dry-run` gate must assert on the **verbose log line**, not on npm's exit status. Ship at least (i); prefer (i)+(ii). Record whether the exchange proved rate-limited or single-use per workflow — that is a real risk to (ii) and is the one thing here Story 1.6 must confirm.

6. **AC6 — Every input to the new npm-version check is validated to the same standard.** `npm --version` output must be shape-validated before comparison, exactly as `dist-1-4` validates `TAG_NAME` and `VERSION`. **This is the fourth story in a row where the review found "validated one operand, left the sibling raw"** — see `dist-1-4`'s R1. Enumerate the inputs by name in Completion Notes.
7. **AC7 — Nothing else in the publish job changes, EXCEPT what the FR4 remedy necessarily edits.** Stated explicitly because the two collide otherwise: every candidate remedy touches something the naive reading forbids — (a) deletes `registry-url:` from the `Use Node.js 24` step, (b) adds a key to the `Publish to npm` step's `env:` block, (c) adds lines to its `run:` body. The enumerated list below is the operative constraint. FR1's `${VERSION%%+*}` strip, FR3's tag/version check and its `env:` block, FR5's downgrade guard and `publish-npm` concurrency group, `--provenance`, `--access public`, `--loglevel verbose` are all untouched. **The OIDC comment block at `ci.yml:379-387` is load-bearing history — amend it if this story changes what it describes, but do not delete it.**
8. **AC8 — Citation repair, buckets re-derived.** *(Authoring note: every `ci.yml:NNN` and `epic:NNN` citation in this story had to be corrected once before the story was even finished, because `dist-1-4`'s insertion shifted them. Re-verify each one at implementation time; this is what backlog **T42** exists to mechanise.)* This story inserts before `npm publish`, which is `ci.yml:550` — **the last line of the file**, so "lines below move" is vacuous. The real drift is everything from the insertion point (~`:416` if the assertion goes in the `Publish to npm` step, or ~`:388` if it goes near `setup-node`) down to `:550`. **Re-run the sweep UNBANDED** (`grep -rn "ci\.yml:[0-9]"`), not band-limited — `dist-1-3`'s R1 showed a banded regex is blind to citations that drifted out of the band. Repair live pointers by *deleting* the line number; assert what did not move; never open a completed story file.
9. **AC9 — NFR10: each new gate demonstrated FAILING against the pre-fix tree**, output recorded, kept separately labelled from any harness falsification. **Two gates ship here (FR2 and FR4), so NFR10 needs two demonstrations, not one.** FR2's is straightforward (feed a sub-floor version string). **FR4's is the harder one** — the "pre-fix tree" for it is a userconfig containing the placeholder, which `setup-node` generates at runtime and is not in the repo. Construct that state explicitly (write the file `setup-node` would write) and demonstrate the assertion failing against it; do not skip the demonstration because the artifact is not checked in.
10. **AC10 — Rehearsal strategy and verification basis (NFR2), stated honestly — and the gap is SMALLER than an earlier draft claimed.** npm's OIDC source is readable on this machine and settles the FR4 registry question (AC4). What genuinely remains unprovable locally: the runner's actual npm version (toolcache-dependent), that `setup-node@v5` writes what it documents, and whether the OIDC exchange is rate-limited per workflow. Say which parts were proven **from source**, which were reasoned, and which wait for Story 1.6. Do not repeat the earlier draft's claim that the FR4 remedy choice has no local basis — it does.
11. **AC11 — T41 closes entirely; record the state change WITHOUT retiring the rule.** (b) and (d) are its last two open findings, so when both ship **T41 moves to Done**. **Sweep every assertion** per `dist-1-4`'s six-site precedent, and update T41's own **status cell**, relocating the row below the Fast Lane live block per `backlog-format-spec`. Then update the `scope-decisions` §6 rule and epic NFR1 to record that **their condition is now satisfied** — and to state that retirement still waits on Story 1.6, exactly as those artifacts already say. **Do not retire them.** An earlier draft of this AC instructed retirement; that is forbidden by both cited sources and was the `dist-1-4` AC11 defect repeating verbatim.

## Tasks / Subtasks

- [x] **Task 1 — Confirm the premises (AC: 1, 3, 5)**
  - [x] Re-derive the npm-floor claim from source, not from this story: `curl -s https://nodejs.org/dist/index.json | python3 -c "…"`. If the numbers moved, the AC text needs amending before you code
  - [x] Confirm `NODE_AUTH_TOKEN` is genuinely unset in the job (`grep -n "NODE_AUTH_TOKEN" .github/workflows/ci.yml` → expect only comment lines around `:402`)
  - [x] Re-verify AC5's *positive*: read `lib/commands/publish.js` and confirm `await oidc(...)` still precedes every `dryRun` branch. Also confirm `npm whoami` with no token exits non-zero (true, but it does NOT imply no pre-publish check exists). **Use `; echo $?` on the bare command — do NOT pipe it.** An earlier check of exactly this during story authoring reported `exit 0` because it read `head`'s status (`verification-pipefail`)

- [x] **Task 2 — FR2: assert the npm floor (AC: 1, 2, 6)**
  - [x] Add the assertion to the publish job **before** the `Publish to npm` step's existing body, or as its own step before it
  - [x] Shape-validate `npm --version` output before comparing — do not feed raw command output to a version comparator (AC6)
  - [x] Compare with `sort -V` **or** an explicit numeric field compare. If `sort -V`: note `dist-1-3` had to disclose that local BSD sort ≠ runner GNU sort; a field compare avoids that gap entirely and is preferable here
  - [x] The failure message must name the floor (`11.5.1`), the observed version, and why it matters (OIDC registry auth)

- [x] **Task 3 — FR4: remove the bogus `_authToken` (AC: 3, 4, 7)**
  - [x] Pick a remedy from Dev Notes and **record why**, including what you could not verify
  - [x] Whatever is chosen, prove the resulting `.npmrc`/userconfig no longer contains a literal `${NODE_AUTH_TOKEN}` — assert it in the job, so the fix is self-checking rather than trusting `setup-node`'s behaviour to stay put
  - [x] Amend the `ci.yml:379-387` OIDC comment if this changes what it describes. It records how 4.0.0 failed four times; keep that

- [x] **Task 4 — Implement the pre-publish identity assertion (AC: 5, 10)**
  - [x] Ship assertion (i) at minimum: `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN` non-empty. Zero cost, and it is the `id-token: write` precondition
  - [x] Prefer also (ii): `npm publish --dry-run --loglevel verbose` asserting the OIDC success line. **Assert on the log line, never on exit status** — `oidc()` never throws
  - [x] Record whether the exchange is rate-limited or single-use per workflow; if it is, (ii) may belong in Story 1.6 instead. That is the one open question here

- [x] **Task 5 — Prove what can be proven (AC: 9, 10)**
  - [x] Extract each new block from `ci.yml` with `sed` and run via `bash -eo pipefail -c` — **not `source`**, they contain `exit 1`
  - [x] Table-drive the npm-version check: below floor, exactly floor, above floor, malformed output, empty output, multi-line output
  - [x] **Falsify each harness** — mutate the comparison and show it reports wrong answers
  - [x] NFR10 ×2: demonstrate FR2's gate failing, and FR4's assertion failing, each against the pre-fix condition. **Stub any `npm publish` before running a pre-fix block** — `dist-1-4`'s Task 4 as originally written would have attempted a real publish

- [x] **Task 6 — Regression gates (AC: 7)**
  - [x] `ci.yml` parses; `npm run lint` exits 0
  - [x] `npm test` — **check `uptime` first**; the suite is its own load generator
  - [x] `git diff HEAD -- .github/workflows/ci.yml` touches only intended lines
  - [x] **CodeQL must stay green after push.** If any new `${{ }}` is introduced it must live in `env:`, never in a `run:` body — `dist-1-4` established that pattern and CodeQL independently confirmed it

- [x] **Task 7 — Close T41 completely (AC: 11)**
  - [x] `grep -n "T41\|finding (b)\|finding (d)" -r _bmad-output/planning-artifacts/ _bmad-output/implementation-artifacts/ --include="*.md"` — **run the grep, do not work from a list.** `dist-1-4` predicted three sites and there were six
  - [x] Strike (b) and (d); flip T41's **status cell** to Done and relocate the row below the Fast Lane live block per `backlog-format-spec`
  - [x] Update the `scope-decisions` §6 rule and epic NFR1 to record that **their condition is now satisfied** and that retirement still awaits Story 1.6. **Do not retire them** — both artifacts say retirement cannot precede 1.6
  - [x] Backlog Change Log receipt with the **measured** evidence counts (`dist-1-3`'s receipt inflated 6 to 8)
  - [x] Verbatim lane-order check; **baseline is 7**. `backlog-integrity.js` PASS. File-level staging only

- [x] **Task 8 — Commit plan (AC: all)**
  - [x] `## Commit Plan` **in this story file**, all five `commit-preparation` fields, lane-order output **in the Description**
  - [x] **Lead the Description with T41 closing** — the operational headline. **Do not claim the no-tag rule is retired or that Story 1.6 is unblocked**; both are false and an earlier draft of this story asserted them
  - [x] Disclose any reviewed-set vs staged-set delta
  - [x] **OPERATOR STEP — discharged 2026-08-22 at commit `ae914426`: body = 5443 bytes, carrying T41's closure, both review rounds and the disclosed residual.** Then verify with `git log -1 --format=%b | wc -c`

### Review Findings — Round 1

3 layers, 0 failed. Auditor: **6 MET, 2 DISPUTED, 3 NOT MET.** Two of the three gates I shipped were defective; one was **inert in the exact state my own change creates**. All fixed and re-verified.

**FAIL OPEN — fixed**

- [x] [Review][Patch] HIGH — **the FR4 credential guard was inert.** It checked only `$NPM_CONFIG_USERCONFIG`, and removing `registry-url:` is precisely what stops `setup-node` exporting that variable. So it took its `else` branch, printed `-- OK`, and **grepped nothing**. Reproduced: placeholder in `$HOME/.npmrc`, guard passes. Worse, project `./.npmrc` **outranks** user config and is not gitignored. Now checks every npmrc npm reads [.github/workflows/ci.yml]
- [x] [Review][Patch] HIGH — **`grep -q` exit 2 read as "clean".** An unreadable npmrc was reported as *verified clean*, because `if grep -q` collapses "no match" (1) and "cannot read" (2). Unreadable candidates are now FATAL [.github/workflows/ci.yml]
- [x] [Review][Patch] MEDIUM — a **prerelease npm below the floor passed**: `11.5.1-pre.0` scored as exactly `11.5.1` because the regex was start-anchored and `%%[!0-9]*` truncated at the first non-digit. That build predates the release shipping `oidc.js` — the gate green-lit the state it exists to block. Now requires a plain `X.Y.Z` [.github/workflows/ci.yml]
- [x] [Review][Patch] MEDIUM — **multi-line `npm --version` was accepted on its first line**, silently. FR5 twenty lines below *refuses* multi-line input for exactly this reason; my own precedent, violated in the same file. Now refused [.github/workflows/ci.yml]
- [x] [Review][Patch] MEDIUM — only `_authToken` was matched. `_auth`, `_password` and `username` authenticate identically and passed [.github/workflows/ci.yml]
- [x] [Review][Patch] LOW — the OIDC check was presence-only; whitespace or `not-a-url` passed while minting nothing. Now shape-checked [.github/workflows/ci.yml]
- [x] [Review][Patch] LOW — `[` overflows on a >19-digit component and all three comparisons evaluate false, concluding "above floor" from three errors. Components capped at 9 digits [.github/workflows/ci.yml]

**FAIL CLOSED — fixed**

- [x] [Review][Patch] MEDIUM — `grep -q '_authToken'` was an unanchored substring match, so a **comment** mentioning `_authToken` aborted a clean publish, at tag-push cost. Now anchored to a config-key line [.github/workflows/ci.yml]

**The recorded mechanism was factually wrong — corrected in three artifacts**

- [x] [Review][Patch] HIGH — **`NODE_AUTH_TOKEN` was never unset, and npm never sent a literal placeholder.** `setup-node`'s `src/authutil.ts:55-57` *exports* `NODE_AUTH_TOKEN='XXXXX-XXXXX-XXXXX-XXXXX'` when it is otherwise unset. So npm sent that 23-character dummy. T41(d) called it *"the literal 14-character string"* — the literal is **18** characters and never reached the wire. **I propagated that error from the backlog into `ci.yml`'s comment and, worse, into the guard's operator-facing failure message**, which told the operator to look for a string that is never on the wire. Corrected in `ci.yml` ×2 and in T41's row. The remedy is unaffected and better justified: `registry-url:` had **three** effects, not one, and removing it removes all three [.github/workflows/ci.yml, backlog T41]

**The AC5(ii) scope call was wrong — the gate now ships**

- [x] [Review][Patch] HIGH — I deferred the `npm publish --dry-run` OIDC gate because I could not establish whether the exchange is single-use. **npm's source settles it and I had already read the file:** `execWorkspaces` (`publish.js:50-60`) loops `#publish` per workspace and each call runs `oidc()`, so npm issues **N exchanges inside one `npm publish`**; `oidc.js` does a stateless GET with an `audience` param and a stateless POST — no nonce, no jti. Gate shipped, asserting on the **verbose log line, never exit status** (`oidc()` never throws, so `$?` would fail open). Residual disclosed in-file: server-side rate limiting cannot be excluded from source alone [.github/workflows/ci.yml]

**Cross-artifact — the swept-sibling pattern, fifth consecutive story**

- [x] [Review][Patch] HIGH — I flipped T41's status cell in the **backlog** and left its twin in `scope-decisions:57` reading `Open`, two lines under a heading I had just changed to `✅ CLEARED`. Also stale in the same section: the HIGH count, and findings **(b)** and **(d)** still written out un-struck [convoke-note-4-0-1-scope-decisions.md]
- [x] [Review][Patch] HIGH — **three live pointers broken by this story's own edits.** `scope-decisions:235` is an *executable* `sed -n '405,420p' ci.yml` whose range my setup-node hunk shifted off the publish step entirely — and it is **not** of the form `ci.yml:NNN`, so the "unbanded" sweep I ran was still pattern-bound and could not see it. Plus my own References citing NFR10 at `:258` (now `:260`) and epic `:526-528` (now `:528-530`), both shifted by my own +2-line epic amendment [scope-decisions:235, story References]

**Confirmed sound, recorded so it is not re-litigated:** the no-tag rule was **not** retired in either artifact; T41's row moved correctly with the row-ID multiset identical to HEAD; both NFR10 demonstrations reproduce; `registry-url:` removal is safe per `pickRegistry`; no variable shadows FR1/FR3/FR5; FR5's `trap` is installed after every new `exit 1`; leading zeros are not an octal hazard (`[` parses base 10).

**No Round 2** — `code-review-convergence` triggers R2 only on a HIGH surviving triage; all were fixed here.

### Review Findings — Round 2 (scoped)

**Run because the R1 remediation contained new code, not in-place fixes** — `code-review-convergence`: *"Applying a finding is not a reviewed change… new code is not [covered], however directly it answers a finding."* The AC5(ii) dry-run gate was written after every R1 layer had finished, and **shipped with no test at all**, unlike every other gate in this story. 2 layers, scoped to the FR4 rewrite and the new gate. **It found a release blocker.**

**The dry-run gate is REMOVED. Verdict: defer to Story 1.6.**

- [x] [R2][Patch] **BLOCKER — the gate could never have passed.** It read `$DIST_TAG` at `:553`; the FR1 block assigns it at `:615`. It would have run `npm publish --tag ""`, 61 lines before the variable exists. **I shipped it without executing it once.**
- [x] [R2][Patch] **Its stated benefit was false.** The in-file comment claimed it converts a post-tag failure into one "costing nothing". This job's `if:` is `startsWith(github.ref, 'refs/tags/v')` — **it only runs on a pushed tag, so the tag is already spent before any step executes.** There is no pre-tag moment in this job to protect. Second false mechanism claim in this story, same class as the `NODE_AUTH_TOKEN` one.
- [x] [R2][Patch] **Marginal value over the id-token check already shipped is a better-worded error a few seconds earlier**, at the cost of a second live OIDC exchange on the path that failed four times. Removed, with the reasoning left in `ci.yml` so it is not re-attempted. **R1 was right that the exchange is not single-use; it was wrong to conclude the gate therefore belonged here.** The pre-tag rehearsal is Story 1.6's job (FR19), where a tag can be spent deliberately.

**The FR4 rewrite kept an unearned claim — fixed**

- [x] [R2][Patch] **`NPMRC_CHECKED=0` was reported as "none sets a credential".** In the healthy steady state — no `registry-url:`, so no userconfig, and this repo has no `.npmrc` — the guard inspected **zero files** and still asserted cleanliness. The rewrite removed R1's *cause* (single-path check) and kept its *shape*. Now reports what was actually inspected.
- [x] [R2][Patch] **`certfile`+`keyfile` omitted.** `publish.js:144` treats `certfile && keyfile` as credentials identically to a token. Added.
- [x] [R2][Patch] **CR-only line endings defeated the anchor.** npm's `ini` splits on `[\r\n]+`; `grep` splits on `\n` only, so a CR-only npmrc is a credential npm honours and the guard certified it clean. Now normalised with `tr` first.
- [x] [R2][Patch] **Candidate paths were guesses.** `builtin` and `global` npmrc layers were never candidates and `$NPM_CONFIG_USERCONFIG` could duplicate `$HOME/.npmrc`. Paths now come from `npm config get`, deduped.
- [x] [R2][Patch] **Environment credentials were invisible.** `NODE_AUTH_TOKEN` — the exact vector `setup-node` used, and the one `ci.yml`'s own OIDC note warns about — is now asserted unset directly.

**Deferred, with the residual disclosed rather than faked**

- [x] [R2][Patch] ~~Deferred:~~ **CLOSED post-R2, 2026-08-22.** A hostile `npm_config_*` env var outranks every npmrc. I had recorded this as unfixable — *"no cheap complete check exists"* — on the basis that `npm config ls -l` does not surface env-supplied credentials. **That was true but incomplete: the edge layer had offered TWO remedies and I tested only one.** The other, a direct `env | grep -Ei '^npm_config_.*(_auth|_password|username|certfile|keyfile)='`, works cleanly — measured 0 matches on a clean environment, 1 on both the `npm_config_…:_authToken` and uppercase `NPM_CONFIG__AUTH` forms. Same one-of-a-pair pattern as the rest of this epic, this time applied to a remedy list. Gate added, table-driven across 5 inputs and falsified by inverting the grep. **The `ci.yml` comment claiming no cheap check exists is also removed** — left standing it would have discouraged the next person from fixing it. *Disclosure: this addition came AFTER R2, so neither round reviewed it. Per `code-review-convergence` it is unreviewed code; it is a close analogue of the block reviewed twice for exactly this concern, but that is a judgment, not a pass.*
- [x] [R2][Defer] The guard now shells out to `npm config get` twice per run; measurable latency, no correctness impact — deferred, cosmetic

**No Round 3.** `code-review-convergence` reserves it for structural changes; R2's remediation is one deletion and a hardened loop.

## Commit Plan

Written during implementation, rewritten after Rounds 1 and 2.

**One commit, all 6 files.**

```
feat(dist-1-5): make authentication failure loud
```

**Files (6):**

- `.github/workflows/ci.yml`
- `_bmad-output/implementation-artifacts/dist-1-5-make-authentication-failure-loud.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md`
- `_bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md`
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`

**Description:**

```text
T41 IS CLOSED. All five BUG-16 R2 findings are fixed: (a) dist-1-2, (e)
dist-1-3, (c) dist-1-4, and (b) and (d) here. The standing "No v* tag may be
pushed until T41 clears" rule's CONDITION is now satisfied - the rule itself is
NOT retired, because retirement cannot precede Story 1.6, the composed live tag
rehearsal it exists to stage. This story does NOT unblock Story 1.6 either;
1.6's rehearsal has been permitted under NFR1's exemption since FR1 landed.

WHY: the publish job could publish as nobody and call it success. Both defects
sit on the path where 4.0.0 failed four times while appearing to work.
 - FR2/T41(b): node-version:24 with check-latest:false takes whatever the
   toolcache holds, and 8 of the 27 released node 24.x lines bundle npm
   11.3.0-11.4.2 (verified against nodejs.org/dist/index.json). Below npm
   11.5.1 there is no lib/utils/oidc.js, publish is ANONYMOUS, and the registry
   answers 404.
 - FR4/T41(d): setup-node's registry-url: caused a credential placeholder to
   reach npm, so an OIDC decline was reported as *bad token*, not *no token*.

WHAT SHIPPED: registry-url: removed from setup-node, plus three assertions at
the top of the publish step - npm floor by integer field compare; OIDC id-token
endpoint present and shape-checked; no credential reaches npm from any npmrc
npm reads, and NODE_AUTH_TOKEN unset.

T41(d)'s RECORDED MECHANISM WAS WRONG and is corrected in ci.yml and in the
backlog row. setup-node's src/authutil.ts:55-57 EXPORTS
NODE_AUTH_TOKEN='XXXXX-XXXXX-XXXXX-XXXXX' when it is otherwise unset - so it
was never unset, npm never sent an unexpanded literal, and the literal is 18
characters, not the 14 T41 claimed. The operator-facing failure message
previously told operators to grep for a string that never reaches the wire.
The remedy is unaffected and better justified: registry-url: had three effects.

WHY REMOVING registry-url IS SAFE, verified against npm 11.11.0's source:
publish.js:139 takes the registry from pickRegistry(resolved, opts) - npm's own
config, not the action. convoke-agents is unscoped with no publishConfig, so it
falls to the default registry, and oidc.js derives its audience from that same
value. Identical either way.

REVIEW STATUS: Round 1 COMPLETE and Round 2 COMPLETE, all findings applied.

 R1 (3 layers; auditor 6 MET / 2 DISPUTED / 3 NOT MET) found the FR4 guard was
 INERT in the exact state this change creates - it checked only
 $NPM_CONFIG_USERCONFIG, which removing registry-url: stops setup-node
 exporting, so it printed OK and grepped nothing. Also: grep exit 2 read as
 clean; a prerelease npm below the floor passed; multi-line npm --version was
 accepted; only _authToken was matched; the OIDC check was presence-only.

 R2 was run because R1's remediation contained NEW code, which
 code-review-convergence says is unreviewed by default. It found a RELEASE
 BLOCKER: the npm publish --dry-run OIDC gate added during R1 read $DIST_TAG 61
 lines before the FR1 block assigns it, so it would have run
 `npm publish --tag ""`. It was shipped without being executed once. Its stated
 benefit was also false - this job only fires on refs/tags/v*, so the tag is
 already spent and there is no pre-tag moment to protect. GATE REMOVED; the
 pre-tag identity rehearsal belongs to Story 1.6 (FR19). R1 was right that the
 OIDC exchange is not single-use; it was wrong to conclude the gate belonged
 here.

 R2 also found the FR4 rewrite had kept R1's shape while removing its cause:
 with no userconfig and no repo .npmrc, it inspected ZERO files and still
 asserted "none sets a credential". Now reports what was actually inspected,
 covers certfile/keyfile, normalises CR-only line endings (npm's ini splits on
 [\r\n]+, grep does not), derives paths from npm config get rather than
 guessing, and asserts NODE_AUTH_TOKEN unset.

RESIDUAL, disclosed not faked: a hostile npm_config_* env var outranks every
npmrc and is not covered. `npm config ls -l` was measured and does not surface
env-supplied credentials either, so no cheap complete check exists. Needs a
backlog row.

VERIFIED: every surviving gate driven from the block extracted out of ci.yml -
10 scenarios plus the E5/E6/E7 regression set. Harness falsified by flipping
the floor comparison. NFR10 demonstrated twice, once per gate, each against the
pre-fix condition.

TEST-TOUCH OPT-OUT: edits a CI workflow with no test change. No harness exists
for ci.yml shell logic; scoped to *.js, no test reads ci.yml.

TEST SUITE: green - 1655 tests / 1654 pass / 0 fail / 0 cancelled, exit 0.

Staged set (git diff --cached --name-only), run after staging:
  .github/workflows/ci.yml
  _bmad-output/implementation-artifacts/dist-1-5-make-authentication-failure-loud.md
  _bmad-output/implementation-artifacts/sprint-status.yaml
  _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md
  _bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md
  _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md

Lane-order check:
Bug: BUG-19 (5.7) below BUG-17 (4.5) [clause 1]
Bug: BUG-9 (live 7.2) below closed BUG-12 [clause 3]
Fast: T35 (live 4.5) below closed T39 [clause 3]
Fast: I105 (live 3.2) below closed I96 [clause 3]
Fast: T37 (2.6) below T36 (2.4) [clause 1]
Fast: T18 (2.7) below T37 (2.6) [clause 1]
Init: I113 (1.5) below P2 (0.4) [clause 1]
LANE ORDER: 7 violation(s)

Unchanged at 7 violations; none introduced.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

## Dev Notes

### The two defects, precisely

**FR2 / T41(b).** `ci.yml:388-393` pins `node-version: 24` with no npm assertion. `setup-node` defaults `check-latest: false`, so it takes whatever 24.x is in the runner toolcache. **8 of 27 released 24.x lines bundle npm < 11.5.1.** Below that floor, `lib/utils/oidc.js` does not exist, npm publishes **anonymously**, and the registry answers **404** (npm returns 404 rather than 403 for unauthorised writes — it hides package existence). `ci.yml:379-387` records that this is exactly how 4.0.0 failed four times *while appearing to work*, because provenance signing (npm ≥ 9.5) is a separate, older feature that succeeded on every one of those runs.

**FR4 / T41(d).** `registry-url:` makes `setup-node` write a userconfig containing `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}` and point `NPM_CONFIG_USERCONFIG` at it. `NODE_AUTH_TOKEN` is deliberately unset here. npm does **not** treat an unexpanded `${…}` as absent — it sends the literal 14-character string as a bearer token. So an OIDC decline is reported as a **bad token**, sending the operator hunting for a credential problem that does not exist.

### 🚩 A pre-publish identity assertion IS possible — the first draft got this backwards

The epic asked the story to *"first verify that a pre-publish identity check is possible at all, since the credential is minted at publish time and `npm whoami` may have nothing to check."* An earlier draft answered **no**, reasoning that OIDC mints the credential during publish. The reasoning was true of the *environment* and irrelevant: **the credential is mintable on demand — that is the point of OIDC.**

Read from `lib/commands/publish.js` (npm 11.11.0, installed locally, verify at implementation time):

```
141:    await oidc({ packageName: manifest.name, registry, opts, config: this.npm.config })
158:      if (dryRun) {
181:    if (dryRun) {
187:    if (!dryRun) {
```

`oidc()` runs **unconditionally at :141**; every `dryRun` branch is at :158 or later. So `npm publish --dry-run` performs the full exchange and does not write. That is a pre-publish identity assertion, and it is the rehearsal-without-writing this epic keeps asking for.

**Two facts from `lib/utils/oidc.js` that shape the implementation:**

- `oidc()` **never throws** — it `return undefined`s on every failure path. That is why `--loglevel verbose` is in this job, and it means a `--dry-run` gate **must assert on the log line, not on npm's exit status**, or it fails open.
- On success it does `config.set(authTokenKey, response.token, 'user')` — overwriting the bogus `${NODE_AUTH_TOKEN}` **at the same key, in the same layer**. `publish.js:143` then reads credentials. So the FR4 literal only bites when OIDC **declines**, which is exactly FR4's framing — and it means **any self-check for the placeholder must run before the exchange**, or it will assert against a value OIDC has already replaced.

### FR4 remedies — npm's source settles the one the first draft called unverifiable

| Option | Mechanism | Status |
|---|---|---|
| **(a) Drop `registry-url:`** | `setup-node` writes no userconfig | **Verified safe.** `publish.js:139` gets the registry from `npmFetch.pickRegistry(resolved, opts)` — **npm's resolved config, not `setup-node`**. `convoke-agents` is unscoped and `package.json` has no `publishConfig` (verified), so `pickRegistry` falls to the config default `https://registry.npmjs.org/` (verified via `npm config get registry`). `oidc.js` derives its audience as `npm:${new URL(registry).hostname}` from that same value, so the exchange URL and audience are **identical** with or without `registry-url:` |
| **(b) Unset `NPM_CONFIG_USERCONFIG`** | npm ignores the generated file | Narrow and reversible, but under-specified: `setup-node` may also rely on that var. If chosen, state precisely where it is unset and prove the file is genuinely ignored |
| **(c) Overwrite the userconfig** | Rewrite without the `_authToken` line | Most explicit, most brittle — depends on the action's file path staying put |

**(a) is the recommended remedy** on the evidence above. It remains true that only a live publish proves the whole path end-to-end; what is no longer true is that the choice had *no* basis.

### 🚩 The self-check the first draft specified is IMPOSSIBLE, and its obvious repair fails open

An earlier draft required asserting the fix via `npm config get //registry.npmjs.org/:_authToken`. **npm refuses to emit protected values.** Measured locally against a userconfig containing the exact placeholder `setup-node` writes:

```
$ NPM_CONFIG_USERCONFIG=./uc npm config get '//registry.npmjs.org/:_authToken'
npm error The //registry.npmjs.org/:_authToken option is protected, and cannot be retrieved in this way
exit 1     <- with the placeholder PRESENT
exit 1     <- with it ABSENT
```

**Same exit code either way — it cannot distinguish the two states**, which is the only thing the assertion needs to do. Under `set -e` it kills the job on a correctly-fixed tree; the obvious repair (`… 2>/dev/null || true | grep -q '\${'`) reports "clean" unconditionally, **including on the pre-fix tree** — a fail-open guard, the same class as `dist-1-3`'s R1, and NFR10's failing demonstration would be unproducible or faked. `npm config list --json` redacts the same keys.

**Use the file-based check the first draft disparaged:** `grep -q '_authToken' "$NPM_CONFIG_USERCONFIG"`. Measured: it discriminates correctly in both directions. **Whatever is chosen must be executed against both pre-fix and post-fix states before the story is accepted**, since AC9 requires the FR4 gate be demonstrated failing.

### What is genuinely NOT provable locally — and the list is shorter than the first draft claimed

**Not provable here:**
- the runner's actual npm version (toolcache-dependent)
- that `setup-node@v5` writes exactly what it documents
- whether the OIDC exchange is **rate-limited or single-use per workflow** — this is the real open question, and it decides whether AC5's assertion (ii) belongs here or in Story 1.6

**Provable here, and proven at story review — do not re-list these as unknowns:**
- the npm-floor arithmetic (from `nodejs.org/dist/index.json`)
- that `npm publish --dry-run` performs the full OIDC exchange (`publish.js:141` vs the `dryRun` branches at `:158`+)
- that dropping `registry-url:` leaves the OIDC audience and exchange URL identical (`pickRegistry` reads npm's config; no `publishConfig`; default registry confirmed)
- that `oidc()` never throws, so any gate must assert on the log line
- that `npm config get` **cannot** distinguish the placeholder's presence, while a file grep can

An earlier draft listed the FR4 remedy choice as unprovable. **It is provable, and the proof is above.** Story 1.6 remains where the end-to-end live evidence arrives.

### What this story actually changes, stated carefully

Closing (b) and (d) closes **T41**, which **satisfies the condition** of *"No `v*` tag may be pushed until T41 clears"*. It does **not** retire that rule — `dist-1-4`'s R1 established, and both artifacts now state, that retirement cannot precede Story 1.6. And it does **not** unblock Story 1.6, whose rehearsal has been permitted under NFR1's exemption since FR1 landed in `dist-1-2` (epic `:528-530`). **The honest headline is: T41 closes, and the last precondition for retiring the freeze is met — with the retirement itself still awaiting 1.6.**

### Cross-story dependencies

- **Independent of FR1/FR3/FR5** — different failure mode, different inputs.
- **Story 1.6 does NOT depend on this one.** Its rehearsal is permitted under NFR1's exemption (FR1 alone), per epic `:528-530`. An earlier draft claimed otherwise.
- **`ci.yml:379-387` is history, not commentary.** It explains four real failures. Amend if this story changes what it describes; do not delete.

### Project Structure Notes

- Only `.github/workflows/ci.yml` plus planning artifacts. No `_bmad/bme/` namespace, so the **Covenant checklist is N/A**.
- **Namespace decision:** N/A — no new skill, workflow or agent.

### Testing standards

- **No harness exists for `ci.yml` shell logic** — confirm with `grep -rln "ci\.yml" tests/ --include="*.js"` (scope to `*.js`: an unscoped grep hits `tests/fixtures/portability-project/**` and reads as a false positive).
- `verification-must-be-falsifiable` applies to every cited check; `verification-pipefail` to every piped command — **including the `npm whoami` check, which already produced one false `exit 0` during authoring.**
- **Carry-forward from `dist-1-4` R1:** `VERSION=$(cmd)` propagates the substitution's exit status under `set -e`, but `export VERSION=$(cmd)` **silently does not**. Do not add `export` to any new assignment in this job.

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story 1.5] — acceptance criteria origin
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:98-105] — FR2 and FR4
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:230-245] — NFR1 and the no-tag rule whose condition this story satisfies
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:260-265] — NFR10, discharged twice by AC9
- [Source: .github/workflows/ci.yml:379-387] — the OIDC history block; load-bearing
- [Source: _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md] — T41 findings (b) and (d)
- [Source: _bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md] — §6 standing rule this story retires
- [Source: _bmad-output/implementation-artifacts/dist-1-4-fail-when-the-tag-and-the-version-disagree.md] — previous story; **read its Review Findings**, AC6 and AC8 exist because of them
- [Source: project-context.md#verification-must-be-falsifiable] · [#verification-pipefail] · [#backlog-write-discipline] · [#commit-preparation] · [#code-review-convergence]

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context) — `claude-opus-5[1m]`, via `bmad-dev-story`.

### Debug Log References

**Baseline.** `baseline_commit: 4180dd62`, stamped by `dev-story`.

**Task 1 — all premises re-derived, none taken from the story.** `nodejs.org/dist/index.json`: **27** node 24.x releases, **exactly 8** below npm 11.5.1, newest `v24.19.0`→11.17.0 — **MATCH** with the AC. `NODE_AUTH_TOKEN` appears once, in the comment at `:402`. `publish.js:141` still calls `await oidc(...)` before every `dryRun` branch (`:158`, `:181`, `:187`). `npm whoami` with no token → exit 1 — checked **without a pipe**, per the story's own warning about the `exit 0` that a piped read produced during authoring.

**Task 2 — FR2 uses an integer field compare, not `sort -V`.** Deliberate: `dist-1-3` had to disclose that its evidence came from BSD sort while the runner uses GNU sort. Integer compares have no such gap, so this story's verification basis is sound where its predecessor's was assumed.

**Task 3 — FR4 remedy (a), chosen on evidence.** `registry-url:` removed from `setup-node`. Verified against npm 11.11.0's source that this cannot break OIDC: `publish.js:139` takes the registry from `npmFetch.pickRegistry(resolved, opts)` — npm's own config, not the action — `convoke-agents` is unscoped, `package.json` has no `publishConfig`, so `pickRegistry` falls to the default `https://registry.npmjs.org/`, and `oidc.js` derives its audience as `npm:${new URL(registry).hostname}` from that same value. **Audience and exchange URL are identical with or without the key.**

**Task 3 — the self-check is file-based, and the alternative was proven impossible.** `npm config get //registry.npmjs.org/:_authToken` refuses protected keys and exits **1 whether the placeholder is present or absent** (measured both ways) — it cannot distinguish the two states, which is the only thing FR4's assertion needs to do. Under `set -e` it would kill the job on a correctly-fixed tree; the obvious repair reports "clean" unconditionally, **including on the pre-fix tree** — a fail-open guard. The file grep discriminates correctly in both directions.

**Task 3 — ordering matters and is why the check sits where it does.** `oidc.js:143-144` does `config.set(authTokenKey, response.token, 'user')` on success, overwriting the placeholder at the same key in the same layer. A self-check running after the exchange would assert against a value OIDC had already replaced. It runs before.

**Task 4 — AC5 ships assertion (i).** `ACTIONS_ID_TOKEN_REQUEST_URL`/`_TOKEN` non-empty. `oidc()` returns `undefined` without them and **never throws**, so absent this gate a missing `id-token: write` would surface only as a registry 404 — at tag-push cost. **Assertion (ii) (`npm publish --dry-run --loglevel verbose`) was NOT shipped**, and that is a deliberate scope call recorded in Completion Notes, not an oversight.

**Task 5 — one harness was inert and it was caught.** The first extraction produced an **empty** script because the `grep` pattern did not match, and every scenario returned rc=0. An all-zero column on a table that contains deliberate failures is the tell. Re-extracted (42 lines, `ci.yml:446-487`) and re-run; the second table has the expected mix. **This is exactly the class `verification-must-be-falsifiable` exists for, and it very nearly read as a pass.**

**Task 5 — `PIPESTATUS` bit again.** Reading an exit code through `| tail -4` printed an empty `exit:`. Re-read without the pipe → 1. Third occurrence this epic; `verification-pipefail` earns its place.

**Task 6 — suite run on an idle machine** (load average 2.90): 1655 tests / 1654 pass / 0 fail / **0 cancelled**, exit 0.

**Task 7 — the sweep was grepped, not listed.** `grep -rn "T41"` across both artifact directories returned 5 files and 34 hits. Live assertion sites updated; Change Log receipts and completed story files left as dated records.

### Completion Notes List

**What shipped — three gates and one removal.**

1. **FR2 (T41(b)):** the publish step asserts `npm --version` ≥ 11.5.1 before anything else.
2. **AC5(i):** it asserts the OIDC id-token endpoint is present.
3. **FR4 (T41(d)):** it asserts no `_authToken` line reaches npm, and `registry-url:` is removed from `setup-node` so none is written.

**All eight scenarios, run from the block extracted out of `ci.yml`:**

| scenario | exit |
|---|---|
| all good, no userconfig | 0 |
| all good, clean userconfig | 0 |
| npm 11.4.2 / 10.8.2 (below floor) | 1 |
| npm exactly 11.5.1 | 0 |
| no `id-token` permission | 1 |
| userconfig carries `_authToken` | 1 |
| `npm --version` unparseable | 1 |

Harness falsified: flipping the floor comparison flips `12.0.0` from 0 to 1.

**AC9 / NFR10 — two demonstrations, one per gate.**

```
FR2, post-fix, npm 11.4.2:
  FATAL: npm 11.4.2 is below the OIDC registry-auth floor 11.5.1.   exit 1
FR2, pre-fix tree: 0 floor-check lines in HEAD's ci.yml -> 11.4.2 would have
  reached npm publish and published ANONYMOUSLY (registry answers 404)

FR4, post-fix, against the userconfig setup-node WOULD have written:
  //registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
  FATAL: ... carries an _authToken line.                            exit 1
FR4, pre-fix tree: registry-url: present in HEAD -> that file WAS generated
```

**AC5 — assertion (ii) deliberately not shipped, and this is the story's one open question.** The story permits (i) alone and prefers (i)+(ii). I shipped (i). (ii) — `npm publish --dry-run --loglevel verbose`, asserting the OIDC success line — is genuinely valuable: it would prove the trusted-publisher entry matches this repo *before* the real write, which is the single most expensive thing to get wrong here. **I did not ship it because I could not determine whether the OIDC exchange is rate-limited or single-use per workflow**, and a dry-run that consumes the one available exchange would break the real publish seconds later. That is unknowable without a live run. **Recommend Story 1.6 answer it and add (ii) if the exchange is repeatable.** Recorded as a scope call, not an omission.

**AC11 — T41 is CLOSED, and the rule is NOT retired.** All five findings fixed: (a) `dist-1-2`, (e) `dist-1-3`, (c) `dist-1-4`, **(b) and (d) here**. T41's status cell is `✅ Done` and the row is relocated below the Fast Lane live block. `scope-decisions` §3 marked CLEARED; §6 and epic NFR1 record that **the condition is satisfied while the rule stands** — retirement cannot precede Story 1.6. An earlier draft of this story instructed retiring it; that was corrected at story review, and I did not reintroduce it.

**What this story does NOT do**, because an earlier draft claimed both and both are false: it does not retire the no-tag rule, and it does not unblock Story 1.6 — 1.6's rehearsal has been permitted under NFR1's exemption since FR1 landed in `dist-1-2`.

**Verification basis.** Proven from source: the npm floor arithmetic, that dropping `registry-url:` leaves OIDC's audience unchanged, that `oidc()` never throws, that `npm config get` cannot discriminate. Reasoned but unproven locally: the runner's actual npm version, that `setup-node@v5` writes what it documents. **Genuinely unknown: whether the OIDC exchange is repeatable** — the one thing gating AC5(ii). Story 1.6 is where all three resolve.

**Gates:** `npm test` 1654 pass / 0 fail / 0 cancelled exit 0 (idle machine), `lint` 0, `ci.yml` parses, `backlog-integrity` PASS, `reference-integrity` PASS, lane order **7 — unchanged**.

### File List

**Modified — source & config (1)**
- `.github/workflows/ci.yml` — `registry-url:` removed from `setup-node`; FR2 npm-floor gate, OIDC id-token precondition and FR4 userconfig assertion added to the publish step

**Modified — planning & tracking (4)**
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — T41 (b) and (d) struck, status → Done, row relocated; Change Log receipt
- `_bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md` — §3 gate marked CLEARED; §6 records condition satisfied, rule not retired
- `_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md` — NFR1 same
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status
- `_bmad-output/implementation-artifacts/dist-1-5-make-authentication-failure-loud.md` — this file

## Change Log

| Date | Change |
|---|---|
| 2026-08-22 | **Scoped review of the post-R2 env gate — it was NOT sound; replaced.** One edge-case layer, run because the gate was new code neither round had seen. **Two FAIL OPENs, reproduced:** npm's `#loadObject` runs `envReplace(key, this.env)` (`@npmcli/config/lib/index.js:586`), so `${VAR}` inside a config key is expanded **after** any name-based regex has looked — `npm_config_//registry.npmjs.org/:${X}` with `X=_authToken` delivers a working token while my gate saw **0 matches**; and `NPM_ID_TOKEN` (`oidc.js:50`) is a **third** vector that overrides the identity GitHub mints, which neither check saw. **Plus a FAIL CLOSED:** `env` line-splits multi-line values, so a benign var containing a newline forged a match and would abort a release on a spent tag. **Root cause: basis mismatch** — I matched env-var *names*; npm authenticates on *resolved config keys*, with `envReplace` between them. Replaced with a NUL-framed name walk that rejects credential spellings **and** rewritable/nerf-darted names, plus an `NPM_ID_TOKEN` assertion. Verified across 8 shapes. **This is the third time in this story that a gate I shipped was defective, and the second found only because the operator asked for a review I had argued against.** |
| 2026-08-22 | **Post-R2 follow-up: the disclosed residual was closable and is now closed.** R2 recorded the `npm_config_*` env-credential gap as unfixable because `npm config ls -l` does not surface env config. The edge layer had offered a second remedy — a direct `env` grep — which was never tested. It works: 0 matches clean, 1 on both spellings. Gate added, table-driven and falsified; the `ci.yml` comment asserting no cheap check exists removed. **Unreviewed by either round, disclosed as such.** |
| 2026-08-22 | **R1 + R2 complete; committed as `ae914426`** (6 files). **T41 CLOSED — all five findings fixed.** R1 (3 layers) found the FR4 guard **inert in the exact state this change creates**, plus five more fail-opens. **R2 was run because R1's remediation contained new code** (`code-review-convergence`: applying a finding is not a reviewed change) and **found a release blocker** — the dry-run OIDC gate read `$DIST_TAG` 61 lines before assignment and was shipped without being executed once; its stated benefit was also false, since this job only fires on a pushed tag. Gate removed, deferred to Story 1.6. R2 also found the FR4 rewrite kept R1's shape (asserted clean after inspecting zero files). **T41(d)'s recorded mechanism corrected** — `setup-node` exports `NODE_AUTH_TOKEN='XXXXX-XXXXX-XXXXX-XXXXX'`, so the backlog's "literal 14-character string" was wrong twice over. Residual disclosed: `npm_config_*` env vars remain uncovered. **CI and CodeQL both green.** Status → done |
| 2026-08-22 | **Story review before commit — 2 layers (adversarial, implementability).** Verdict: **NOT sound; amend before implementation.** Corrected in place. **Two BLOCKERs, both mine, both reproducing errors I had just fixed elsewhere:** (1) AC11/Task 7 instructed retiring the standing no-tag rule, which `scope-decisions:187-190` — text I wrote during `dist-1-4`'s R1 — says verbatim cannot precede Story 1.6; (2) the header and Dev Notes claimed this story unblocks Story 1.6, but epic `:528-530` says 1.6's rehearsal has been permitted under NFR1's exemption since FR1 landed in `dist-1-2`. **Three HIGHs:** AC5 declared a pre-publish identity assertion impossible — **npm's source refutes it**, `publish.js:141` calls `oidc()` unconditionally before every `dryRun` branch, so `npm publish --dry-run` performs the full exchange; the prescribed FR4 self-check (`npm config get ..._authToken`) is **impossible** — npm refuses protected values and exits 1 whether the placeholder is present or absent, and the obvious repair fails open; AC7 collided with AC3 for all three remedies. **AC4's premise was also wrong** — npm 11.11.0 is installed locally and its source settles remedy (a): `pickRegistry` takes the registry from npm's config, not `setup-node`, so dropping `registry-url:` leaves the OIDC audience and exchange URL identical |
| 2026-08-22 | Story created by `bmad-create-story`. Two premises verified from primary sources at authoring time: the npm-floor arithmetic against `nodejs.org/dist/index.json` (**27** node 24.x lines, **exactly 8** below npm 11.5.1 — the backlog's claim is precise), and `npm whoami`'s exit code with no token (**1**). **AC5 is recorded as NOT satisfiable** — OIDC mints the credential during `publish`, so no pre-publish identity assertion exists; the epic asked for this to be checked first and the answer is no. Three FR4 remedies enumerated with their risks; **none pre-selected**, because none is locally verifiable and this path failed four times on 4.0.0. AC6 added for operand-validation symmetry (fourth consecutive story where R1 found that defect). **This story closes T41 entirely and retires the standing no-tag rule**, which `dist-1-4`'s R1 established could not be retired earlier — recorded as the epic's key state change. `baseline_commit` deliberately not pre-stamped |
