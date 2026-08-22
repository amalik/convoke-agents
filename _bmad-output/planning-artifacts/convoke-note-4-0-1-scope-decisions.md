---
initiative: convoke
artifact_type: note
qualifier: 4-0-1-scope-decisions
created: '2026-08-18'
updated: '2026-08-21'
schema_version: 1
status: active
origin: party-mode-session-2026-08-16/18 (John, Winston, Amelia, Amalik)
---

# Convoke 4.0.1 — Ratified Scope and Decisions

**Purpose.** The agreed input to `bmad-create-epics-and-stories` for the 4.0.1 patch
release. Every scope claim below was verified against source during the session, not
read from a backlog row — the commands are in §8 so a story author can re-run them.

**How to use it.** §2 is the epic spine. §3 is the gate that must clear before 4.0.1
can reach anyone. §4 is the story surface. §5 is what was deliberately excluded and
must not drift back in. §6 binds implementation. §7 records the staleness pre-flight.

---

## 1. Release context

4.0.0 shipped 2026-08-17 (`npm latest: 4.0.0`, GitHub Release live, tag `v4.0.0` →
`e18a0cab`). It was **hand-published** at 13:13:15Z, eight minutes after the tag CI
`publish` job failed — `dist.attestations: null`, `_npmUser: amalik`. The shipped
tarball therefore predates `3a3de195` and carries no provenance. Nothing to undo;
recorded as T35's seventh instance.

Two rows closed on the way: **BUG-15** (dist-tag pinning) and **T39** (badges
timestamp gating publish). Both verified in source, not from their rows.

---

## 2. Epic spine

> **Nothing binds what is in the repository to what an operator actually gets.**

Four instances, found by hand within two days, in three different directions:

| Instance | Direction | Row |
|---|---|---|
| `_bmad/bme/README.md` links to the Covenant, the Compliance Checklist and `project-context.md` | in repo, **not** in tarball | I157 |
| `_bmad/bme/_portability/` ships in `files[]` | in tarball, **no install path copies it** | I141 |
| `_bmad/_config/bmm-dependencies.csv` | in repo, **not** in tarball | BUG-19 (see §4.6) |
| `npm run docs:audit` | exists, wired into no workflow | T32 |

None was caught by a gate. Each was caught by someone happening to look. The epic's
job is to make that class mechanically detectable, not to fix four files.

---

## 3. The gate — T41 (must clear before 4.0.1 ships)

**T41** · R6 I3 C90% **E3** · score 5.4 · Open · `found-by: BUG-16 R2 2026-08-17`

**Not a cluster and not a quick win.** ~~Eight~~ **Five** findings (as of 2026-08-21) on `.github/workflows/ci.yml`'s
`publish` job — a path that executes **only** on a `refs/tags/v*` push, so every fix
gets exactly one live rehearsal and a wrong edit costs a tag delete-and-repush. It
sits outside the six clusters and is priced at effort 3 deliberately, rather than
being smuggled in as a seventh quick win.

**Why it gates rather than queues.** 4.0.1 cannot reach anyone except through this
job. Finding **(e)** fires on precisely this release: a maintenance `3.3.1` has no
hyphen, so `case *-*` routes it to `latest` and **downgrades every user from 4.0.0**.

~~Four~~ **Three** HIGH remain. ~~(a) `case *-*` misclassifies build metadata, so `4.0.0+sha…` routes to
`rc` and a stable release never reaches `latest`;~~ ✅ **(a) FIXED 2026-08-22 by story `dist-1-2`** (FR1) —
`ci.yml:412` now reads `case "${VERSION%%+*}"`. (b) `node-version: 24` does not
guarantee npm ≥ 11.5.1 — the OIDC floor — and works today by luck of the runner
toolcache, regressing to a silent anonymous publish returning 404; (c) BUG-15 shipped
half its own acceptance text — "fail the job if the two disagree" was never built and
`github.ref_name` appears nowhere, so tag and `package.json` version are fully
decoupled; (d) `setup-node` writes `_authToken=${NODE_AUTH_TOKEN}` regardless, so an
OIDC decline resurfaces as a *bad token* rather than *no token*.
~~Four~~ **One** MEDIUM: (e) downgrade guard. **(f), (g) and (h) were RETIRED 2026-08-21** by
[ADR-001](adr/4-0-1/adr-001-retire-badges-pipeline.md) together with the badges pipeline — all three
described guards inside `scripts/generate-badges-json.js`, which is deleted. Do **not** re-create the
generator to harden them; story `dist-1-1` AC8 forbids it. ~~The E3 pricing above still reflects the old
8-finding scope and is pending recompute.~~ **Recompute completed 2026-08-21: E3 / 5.4 re-affirmed, not raised** —
the retired findings were MEDIUM generator work while all four HIGHs (and the one-live-rehearsal-per-fix cost that
priced E3) survived. As of 2026-08-22, (a) is also fixed and E3/5.4 still stands for the remaining (b)–(e).

**Story shape.** Its own story set, not a checklist. Each finding needs a stated
rehearsal strategy given the one-shot constraint.

---

## 4. The six clusters

The cap is **six clusters**, not six rows. A slot freed by a shipped row may only be
refilled from **inside the same cluster** — that rule is why T40 joined without moving
the count.

### 4.1 Publish-path integrity — T35, T40

- **T35** · R5 I2 C90% E2 · 4.5 · Open — hand-publishing bypasses all eight CI gates
  and nothing binds a published artifact to a committed tree. **Re-scoped:** yesterday
  hand-publishing was a workaround for a broken job; the job now works (Node 24 +
  Trusted Publishing), so "make tag-push the only publish path, treat a laptop
  `npm publish` as an incident" is enforceable for the first time.
- **T40** · R5 I2 C95% E1 · 9.5 · ✅ **Done 2026-08-21** — retire the badges pipeline, or at least stop
  it gating `npm publish`. It maintains a file with no consumer. Sibling of T39
  (shipped); closes `CR-README-D03` in `deferred-work.md:957`. **Deletes machinery
  rather than adding any.** Shipped by story `dist-1-1` per
  [ADR-001](adr/4-0-1/adr-001-retire-badges-pipeline.md) option (a): generator, workflow and
  generated file deleted; `badges`, `badges:check` and `prepublishOnly` removed from `package.json`.

### 4.2 Watch the audit that works — T32

**T32** · R5 I2 C95% E1 · 9.5 · Open. `docs:audit` is declared at `package.json:52`
and appears in **no** workflow file. It exists, it was failing, and nothing runs it.

### 4.3 Unreachable skills — I141

**I141** · R4 I2 C90% E2 · 3.6 · Qualified. `_bmad/bme/_portability/` is in
`package.json` `files[]`, so it ships; a grep across `scripts/update/lib/*.js` and
`scripts/*.js` returns **zero** references, so no install path copies it. Four skills
are unreachable in every install anyone has.

### 4.4 Manifest truth — I134

**I134** · R4 I3 C90% E2 · 5.4 · Qualified. Broken skill dependencies in the shipped
`skill-manifest.csv`, invisible for ~6 weeks. Reproduces live: the dependency audit
reports `bmad-enhance-initiatives-backlog NOT present under .claude/skills/`.
**Story note:** the original row cites four; one run observed one. Derive the count at
implementation time per `derive-counts-from-source`; do not carry the literal forward.

### 4.5 Export robustness — T33

**T33** · R4 I2 C90% E1 · 7.2 · Open. `scripts/portability/export-engine.js:311`
interpolates an unescaped value into a `u`-flag regex:

```js
new RegExp(`#\s+${name}\s*([\p{Emoji}])`, 'u')
```

A brace in a persona name crashes the export. **Load-bearing before any new team is authored** — Forge introduces new
persona strings written by whoever builds it.

### 4.6 Honest warnings — BUG-19(a) + the `files[]` one-liner

**BUG-19** · R6 I2 C95% E2 · 5.7 · Open · `deferred-from-v4.0`. **Part (a) only.**

- **(a) The label contradicts its own finding.** `scripts/convoke-doctor.js:768`
  declares `name: 'BMM dependencies: registry present'` on a check whose message reads
  `bmm-dependencies.csv not found`. Mechanical fix.
- **The `files[]` one-liner.** `_bmad/_config/bmm-dependencies.csv` is git-tracked
  (`c58a4053`, `ce9defb4`) — so `convoke-doctor` in this repo now reports
  `✓ BMM dependencies: registry consistent`. It is **not** in `files[]`: the tarball's
  only `_bmad/_config/` entry is `skill-manifest.csv`. For every npm-installed
  operator — the population BUG-19 came from, via the Story 4.5 N=1 external
  validation — nothing has changed. **Do not record BUG-19 as half-fixed without this
  line.**
- **Sequence it last** in the epic. Part (b) may open the `preflight-soft-warn`
  contract; if it does, it opens after the other five clusters have landed.

**Part (b) stays deferred** — see §5.

---

## 5. Explicitly out of scope

| Excluded | Why |
|---|---|
| **BUG-19 part (b)** — `⚠ BMAD core not detected` firing for essentially every operator | It is `preflight-soft-warn` behaving exactly as specified. Changing it edits a contract with a deliberate fail-soft guarantee, on one data point. Deferred, not dismissed. |
| **Backlog cleanup proposal** (`_bmad-output/draft-proposals/backlog-cleanup-proposal.md`) | A spec self-contradiction plus a tooling gap (`IN-185`–`IN-188`), not a soundness patch. Different shape, different phase. Decide it this week — **not inside 4.0.1**. |
| **The tiny meta-model baseline** (1 ADR + 1 name registry + 1 doctor/CI check) | Kept separate so its cost measurement survives. Folding soundness rows into it contaminates the instrument that Forge is meant to be measured against. |
| **Forge / any new team** | Phase 3. Gated on the baseline, which is gated on 4.0.1. |

---

## 6. Constraints binding implementation

1. **No `v*` tag may be pushed until T41 clears.** Findings (a), (c) and (e) all
   mis-route a tagged publish. If a release candidate is needed before then, publish
   by hand with an explicit `--tag rc`.
2. **No line-level staging on the backlog.** `3a3de195` deleted the T35 and T39 rows
   while its message claimed to repair them: both rows were *modified*, so the diff
   carried `-old` and `+new`, and line-level staging took the `-` side. T35 — an open
   risk item — silently left the backlog for 23 minutes until Round 2 caught it
   (`9db669b8`). File-level staging or nothing.
3. **`backlog-write-discipline`.** Any row flipped to closed moves below the live
   block in the same edit; run the lane-order check and paste its result into the
   commit Description.
4. **`code-review-convergence`.** Round 1 fires when the commit plan exists, not on
   request. Derive the review diff from `git diff HEAD --name-only`, and assert the
   reviewed set equals the committed set before emitting the plan.
5. **`derive-counts-from-source`.** Applies directly to §4.4 — no literal counts.
6. **`commit-preparation`.** Every change ships with a commit plan; never
   `Update <filename>` as a summary.

---

## 7. Staleness pre-flight record (2026-08-18)

Run per `staleness-preflight-for-backlog-pickup`; parallel-tracks arm, no age
exemption. Verdicts are against source, not against rows.

| Item | Verdict | Basis |
|---|---|---|
| BUG-15 | 🔴 **shipped** | `ci.yml:411-417` implements the `DIST_TAG` derivation + `--tag "$DIST_TAG"`. Removed from scope. *(Basis updated 2026-08-22: the subject was `case "$VERSION"` when this verdict was written; `dist-1-2` changed it to `case "${VERSION%%+*}"` per FR1. A re-run of this pre-flight must grep the new form.)* |
| T35 | 🟡 **re-scope** | Still Open; motivation changed now that the publish job works. |
| T32 | 🟢 | `docs:audit` in `package.json:52`, in no workflow. |
| I141 | 🟢 | In `files[]`; zero install-path references. |
| I134 | 🟢 | Audit reproduces the broken dependency live. |
| T33 | 🟢 | `export-engine.js:311` anchor exact. |
| BUG-19(a) | 🟢 | `convoke-doctor.js:768` anchor exact. |

**Gap found in the method, not the items.** The pre-flight verifies items already
known; nothing in it asks what *entered* the lane since qualification. T41 and T40
were both created on 2026-08-17 by the review rounds on the work under discussion, and
the room re-derived T41(c) as a "new" finding before Amalik caught it. Logged as an
intake against the rule; not fixed here.

---

## 8. Verification commands

```bash
# Publish path (T41 (a)(c), BUG-15 as shipped)
sed -n '405,420p' .github/workflows/ci.yml
grep -n "github.ref_name" .github/workflows/ci.yml        # expect: no match — finding (c)

# T32 — declared but unwired
grep -n "docs:audit" .github/workflows/*.yml package.json

# I141 — ships, never copied
grep -rn "_portability" scripts/update/lib/*.js scripts/*.js

# T33 — the u-flag interpolation
sed -n '311p' scripts/portability/export-engine.js

# BUG-19(a) + the files[] gap
sed -n '768p' scripts/convoke-doctor.js
npm pack --dry-run --json | python3 -c "import json,sys; print([f['path'] for f in json.load(sys.stdin)[0]['files'] if '_bmad/_config/' in f['path']])"

# T35 — how 4.0.0 actually reached the registry
npm view convoke-agents@4.0.0 --json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['dist'].get('attestations'), d.get('_npmUser'))"
```

---

## 9. Next step

`bmad-create-epics-and-stories` against §3 and §4 — T41 as its own story set, the six
clusters as the epic body under the §2 spine. Then sprint planning.
