# Story 1.5: Make authentication failure loud

Status: ready-for-dev

<!-- baseline_commit deliberately ABSENT — `dev-story` stamps it at implementation start. -->

## Story

As a **Convoke maintainer**,
I want the publish job to fail rather than publish as nobody,
so that a broken release never looks like a successful one.

## ⚠️ Read this before anything else

**This is the riskiest story in the epic.** It edits the exact authentication path on which **4.0.0 failed four times while appearing to work** (`ci.yml:379-387`). It covers FR2 *and* FR4 — T41 findings **(b)** and **(d)**, its last two open.

**Two claims an earlier draft of this story made are FALSE and were corrected at story review. Do not reintroduce them:**

1. **This story does NOT unblock Story 1.6.** Story 1.6's own AC (epic `:526-528`) states its rehearsal *"is permitted under NFR1's exemption, because Story 1.2 landed FR1 and a prerelease provably routes to `rc` — the exemption depends on FR1 alone, not on FR5"*. **1.6 has been permitted since `dist-1-2`.** Nothing here gates it.
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

- [ ] **Task 1 — Confirm the premises (AC: 1, 3, 5)**
  - [ ] Re-derive the npm-floor claim from source, not from this story: `curl -s https://nodejs.org/dist/index.json | python3 -c "…"`. If the numbers moved, the AC text needs amending before you code
  - [ ] Confirm `NODE_AUTH_TOKEN` is genuinely unset in the job (`grep -n "NODE_AUTH_TOKEN" .github/workflows/ci.yml` → expect only comment lines around `:402`)
  - [ ] Re-verify AC5's *positive*: read `lib/commands/publish.js` and confirm `await oidc(...)` still precedes every `dryRun` branch. Also confirm `npm whoami` with no token exits non-zero (true, but it does NOT imply no pre-publish check exists). **Use `; echo $?` on the bare command — do NOT pipe it.** An earlier check of exactly this during story authoring reported `exit 0` because it read `head`'s status (`verification-pipefail`)

- [ ] **Task 2 — FR2: assert the npm floor (AC: 1, 2, 6)**
  - [ ] Add the assertion to the publish job **before** the `Publish to npm` step's existing body, or as its own step before it
  - [ ] Shape-validate `npm --version` output before comparing — do not feed raw command output to a version comparator (AC6)
  - [ ] Compare with `sort -V` **or** an explicit numeric field compare. If `sort -V`: note `dist-1-3` had to disclose that local BSD sort ≠ runner GNU sort; a field compare avoids that gap entirely and is preferable here
  - [ ] The failure message must name the floor (`11.5.1`), the observed version, and why it matters (OIDC registry auth)

- [ ] **Task 3 — FR4: remove the bogus `_authToken` (AC: 3, 4, 7)**
  - [ ] Pick a remedy from Dev Notes and **record why**, including what you could not verify
  - [ ] Whatever is chosen, prove the resulting `.npmrc`/userconfig no longer contains a literal `${NODE_AUTH_TOKEN}` — assert it in the job, so the fix is self-checking rather than trusting `setup-node`'s behaviour to stay put
  - [ ] Amend the `ci.yml:379-387` OIDC comment if this changes what it describes. It records how 4.0.0 failed four times; keep that

- [ ] **Task 4 — Implement the pre-publish identity assertion (AC: 5, 10)**
  - [ ] Ship assertion (i) at minimum: `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN` non-empty. Zero cost, and it is the `id-token: write` precondition
  - [ ] Prefer also (ii): `npm publish --dry-run --loglevel verbose` asserting the OIDC success line. **Assert on the log line, never on exit status** — `oidc()` never throws
  - [ ] Record whether the exchange is rate-limited or single-use per workflow; if it is, (ii) may belong in Story 1.6 instead. That is the one open question here

- [ ] **Task 5 — Prove what can be proven (AC: 9, 10)**
  - [ ] Extract each new block from `ci.yml` with `sed` and run via `bash -eo pipefail -c` — **not `source`**, they contain `exit 1`
  - [ ] Table-drive the npm-version check: below floor, exactly floor, above floor, malformed output, empty output, multi-line output
  - [ ] **Falsify each harness** — mutate the comparison and show it reports wrong answers
  - [ ] NFR10 ×2: demonstrate FR2's gate failing, and FR4's assertion failing, each against the pre-fix condition. **Stub any `npm publish` before running a pre-fix block** — `dist-1-4`'s Task 4 as originally written would have attempted a real publish

- [ ] **Task 6 — Regression gates (AC: 7)**
  - [ ] `ci.yml` parses; `npm run lint` exits 0
  - [ ] `npm test` — **check `uptime` first**; the suite is its own load generator
  - [ ] `git diff HEAD -- .github/workflows/ci.yml` touches only intended lines
  - [ ] **CodeQL must stay green after push.** If any new `${{ }}` is introduced it must live in `env:`, never in a `run:` body — `dist-1-4` established that pattern and CodeQL independently confirmed it

- [ ] **Task 7 — Close T41 completely (AC: 11)**
  - [ ] `grep -n "T41\|finding (b)\|finding (d)" -r _bmad-output/planning-artifacts/ _bmad-output/implementation-artifacts/ --include="*.md"` — **run the grep, do not work from a list.** `dist-1-4` predicted three sites and there were six
  - [ ] Strike (b) and (d); flip T41's **status cell** to Done and relocate the row below the Fast Lane live block per `backlog-format-spec`
  - [ ] Update the `scope-decisions` §6 rule and epic NFR1 to record that **their condition is now satisfied** and that retirement still awaits Story 1.6. **Do not retire them** — both artifacts say retirement cannot precede 1.6
  - [ ] Backlog Change Log receipt with the **measured** evidence counts (`dist-1-3`'s receipt inflated 6 to 8)
  - [ ] Verbatim lane-order check; **baseline is 7**. `backlog-integrity.js` PASS. File-level staging only

- [ ] **Task 8 — Commit plan (AC: all)**
  - [ ] `## Commit Plan` **in this story file**, all five `commit-preparation` fields, lane-order output **in the Description**
  - [ ] **Lead the Description with T41 closing** — the operational headline. **Do not claim the no-tag rule is retired or that Story 1.6 is unblocked**; both are false and an earlier draft of this story asserted them
  - [ ] Disclose any reviewed-set vs staged-set delta
  - [ ] **OPERATOR STEP — leave unchecked until the commit exists.** Then verify with `git log -1 --format=%b | wc -c`

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

Closing (b) and (d) closes **T41**, which **satisfies the condition** of *"No `v*` tag may be pushed until T41 clears"*. It does **not** retire that rule — `dist-1-4`'s R1 established, and both artifacts now state, that retirement cannot precede Story 1.6. And it does **not** unblock Story 1.6, whose rehearsal has been permitted under NFR1's exemption since FR1 landed in `dist-1-2` (epic `:526-528`). **The honest headline is: T41 closes, and the last precondition for retiring the freeze is met — with the retirement itself still awaiting 1.6.**

### Cross-story dependencies

- **Independent of FR1/FR3/FR5** — different failure mode, different inputs.
- **Story 1.6 does NOT depend on this one.** Its rehearsal is permitted under NFR1's exemption (FR1 alone), per epic `:526-528`. An earlier draft claimed otherwise.
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
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:230-243] — NFR1 and the no-tag rule this story retires
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:258-263] — NFR10, discharged twice by AC9
- [Source: .github/workflows/ci.yml:379-387] — the OIDC history block; load-bearing
- [Source: _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md] — T41 findings (b) and (d)
- [Source: _bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md] — §6 standing rule this story retires
- [Source: _bmad-output/implementation-artifacts/dist-1-4-fail-when-the-tag-and-the-version-disagree.md] — previous story; **read its Review Findings**, AC6 and AC8 exist because of them
- [Source: project-context.md#verification-must-be-falsifiable] · [#verification-pipefail] · [#backlog-write-discipline] · [#commit-preparation] · [#code-review-convergence]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|---|---|
| 2026-08-22 | **Story review before commit — 2 layers (adversarial, implementability).** Verdict: **NOT sound; amend before implementation.** Corrected in place. **Two BLOCKERs, both mine, both reproducing errors I had just fixed elsewhere:** (1) AC11/Task 7 instructed retiring the standing no-tag rule, which `scope-decisions:187-190` — text I wrote during `dist-1-4`'s R1 — says verbatim cannot precede Story 1.6; (2) the header and Dev Notes claimed this story unblocks Story 1.6, but epic `:526-528` says 1.6's rehearsal has been permitted under NFR1's exemption since FR1 landed in `dist-1-2`. **Three HIGHs:** AC5 declared a pre-publish identity assertion impossible — **npm's source refutes it**, `publish.js:141` calls `oidc()` unconditionally before every `dryRun` branch, so `npm publish --dry-run` performs the full exchange; the prescribed FR4 self-check (`npm config get ..._authToken`) is **impossible** — npm refuses protected values and exits 1 whether the placeholder is present or absent, and the obvious repair fails open; AC7 collided with AC3 for all three remedies. **AC4's premise was also wrong** — npm 11.11.0 is installed locally and its source settles remedy (a): `pickRegistry` takes the registry from npm's config, not `setup-node`, so dropping `registry-url:` leaves the OIDC audience and exchange URL identical |
| 2026-08-22 | Story created by `bmad-create-story`. Two premises verified from primary sources at authoring time: the npm-floor arithmetic against `nodejs.org/dist/index.json` (**27** node 24.x lines, **exactly 8** below npm 11.5.1 — the backlog's claim is precise), and `npm whoami`'s exit code with no token (**1**). **AC5 is recorded as NOT satisfiable** — OIDC mints the credential during `publish`, so no pre-publish identity assertion exists; the epic asked for this to be checked first and the answer is no. Three FR4 remedies enumerated with their risks; **none pre-selected**, because none is locally verifiable and this path failed four times on 4.0.0. AC6 added for operand-validation symmetry (fourth consecutive story where R1 found that defect). **This story closes T41 entirely and retires the standing no-tag rule**, which `dist-1-4`'s R1 established could not be retired earlier — recorded as the epic's key state change. `baseline_commit` deliberately not pre-stamped |
