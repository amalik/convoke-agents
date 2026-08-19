---
initiative: convoke
artifact_type: adr
qualifier: 4-0-1-retire-badges-pipeline
created: '2026-08-19'
status: proposed
schema_version: 1
related_initiative: 4.0.1 (distribution integrity)
related_decision: 'Epic convoke-epic-4-0-1-distribution-integrity.md — ADR-1; gates Stories 1.1a / 1.1b'
closes_if_accepted: 'T40; I108; CR-README-D03; retires FR6, FR7, FR8 (T41 f/g/h)'
---

# ADR-001: Retire the badges pipeline

**Status:** **Proposed** (2026-08-19) — awaiting operator decision
**Initiative:** Convoke 4.0.1 — distribution integrity
**Gates:** Epic 1, Stories 1.1a / 1.1b. Epic 1's story count is 7 or 8 depending on this ruling, so sprint planning cannot estimate it until this is accepted.

## Context

`package.json` declares:

```
badges        : node scripts/generate-badges-json.js
badges:check  : npm run badges && git diff --exit-code docs/badges.json
prepublishOnly: npm run badges:check
```

`badges:check` regenerates `docs/badges.json` and fails if the result differs from the committed
file. Because `prepublishOnly` runs it, **it gates every `npm publish`.**

**1. The file has no consumer.**

The I156 README rewrite (`303f160d`) culled the four dynamic `shields.io` `dynamic/json` badges
that read `docs/badges.json` from `raw.githubusercontent.com`. `README.md:13-14` now carries two
static shields — `npm/v` and a license badge — neither of which touches the file. A repo-wide grep
for `badges.json` finds only: its own generator, `.github/workflows/badges.yml`, `knip.json`, and
`package.json`'s own `badges:check`.

The rewrite story's decision **D9** kept the machinery on the stated grounds that *"the file has
non-README consumers."* That claim was false and was corrected in the story's own review record.
The residue is logged as **CR-README-D03** (`deferred-work.md:957`): *"decide whether to retire the
gate or give the file a consumer."* This ADR is that decision.

There is no latent consumer either. The same rewrite deliberately carried **no counts at all** in
the README — team cards list agents by name rather than by number, precisely so a stale integer
cannot disagree with reality.

**2. Every failure it has ever produced was a false one.**

Until 2026-08-17 the generator stamped a `generated` date. Any publish on a day after the last
badges commit therefore regenerated a file that differed **only in that timestamp**, and the gate
exited 1. Observed across the 4.0.0 release: the counts (`teams 2, agents 12, workflows 33,
skills 106`) were identical every time; only the date moved. It blocked the tag CI run, and forced
a ritual commit of a file whose sole change was a timestamp before every prior release candidate —
`8de471c3`, `f58b15a8`, `b4c095db`, `a2e32cbd`.

**T39** (`6d6578e2`, shipped 2026-08-17) removed the date. That closed the false-failure path — and
in doing so removed the only thing the gate could ever have detected, since the counts are
regenerated from the same source data that produced them. **The gate is now structurally incapable
of failing on anything real.**

**3. Keeping it costs three stories, on a file nobody reads.**

`3a3de195` added guards to the generator during the BUG-16 R2 review (throw on a non-list config
value, on a missing module config, on a header-only manifest). The same review left three further
findings open, carried into this release as **T41 (f), (g), (h)** → **FR6, FR7, FR8** → **Story
1.1b**:

- `agents: []` returns 0 silently, reproducing the `agents: 5` collapse the new guard cites as its motivation
- the manifest floor rejects only negative counts; truncating to 3 rows yields `skills: 2` at exit 0
- zero committed tests for the guards; the mutation matrix was a one-off with no artifact, and it had a hole

**4. The workflow bypasses every CI gate.**

`.github/workflows/badges.yml:38-48` auto-commits and pushes `docs/badges.json` to `main` with
`[skip ci]`. Malformed output ships to `main` untested. Logged as **I108** (score 1.4, Backlog).

**Surface:** `scripts/generate-badges-json.js` (91 lines), `.github/workflows/badges.yml` (48
lines), `docs/badges.json`, two `package.json` scripts plus the `prepublishOnly` hook, and one
`knip.json` entry at line 21.

## Options

**(a) Retire.** Delete the generator, the workflow, `docs/badges.json`, both npm scripts, the
`prepublishOnly` hook and the `knip.json` entry.

**(b) Keep and harden.** Implement FR6, FR7, FR8 (Story 1.1b) and leave the gate in place.

**(c) Keep the file, drop the publish gate.** Remove `badges:check` from `prepublishOnly`; leave
`badges.yml` regenerating on push. The middle option T40's own row offers.

## Recommendation — (a) Retire

The decisive question is not *is the gate harmful* — since T39 it is nearly inert — but *what is it
protecting*. The answer is a generated file with no reader, whose counts are derived from source
data that is itself the authority. `derive-counts-from-source` says any count that must appear is
derived from the source at runtime; the generator is one implementation of that rule, and the docs
that would have consumed it were deliberately written to carry no counts.

**Option (b)** spends three stories hardening the correctness of an output nobody consumes, and
leaves I108 open. The guards are individually reasonable and collectively unmotivated.

**Option (c)** is the shape that produced this situation: machinery retained because deleting it
felt like a bigger decision than keeping it. It leaves the workflow, the generator, the three open
guard findings and I108 all in place, and buys only the removal of a hook that no longer fires
falsely.

**Retiring closes four items in one commit** — T40 (9.5), I108 (1.4), CR-README-D03, and FR6–FR8
evaporate rather than being implemented. Epic 1 drops from 8 stories to 7.

**Reversibility.** 91 lines plus a 48-line workflow, both recoverable from git. If shields are ever
wanted again they are cheaper to rebuild against the then-current schema than to carry unread for
another year.

## Consequences if accepted

- **Story 1.1a is implemented; Story 1.1b is struck.** Epic 1 = 7 stories.
- **FR6, FR7, FR8 are retired**, not deferred. T41 drops from 8 findings to 5 — four HIGH, one MEDIUM.
- **T40, I108 and CR-README-D03 close** against Story 1.1a, each with the lane re-sorted in the same edit per `backlog-write-discipline`.
- `prepublishOnly` becomes empty or is removed. **Verify no other hook depends on it** before deleting the key.
- **The `docs:audit` gate becomes the only documentation check in CI** (Epic 2, Story 2.1). See the note below.

## Consequences if rejected — (b) or (c)

- Story 1.1b stands. Epic 1 = 8 stories. FR6–FR8 need committed tests demonstrated failing against the pre-guard generator (NFR10).
- I108 stays open, and the `[skip ci]` auto-commit path to `main` stays open with it.
- If (c): T40 partially closes; CR-README-D03 stays open, since the file still has no consumer.

## Related finding, not part of this decision

**CR-README-D04** records that `scripts/docs-audit.js`'s `checkBrokenLinks` **skips `^https?://`**,
so the 14 absolute URLs the README rewrite introduced are not validated at all, and `CREDITS.md` is
absent from `USER_FACING_DOCS`. `docs:audit` reporting *"zero findings"* today therefore partly
means *it is not looking*. This bears on **Story 2.1**'s acceptance criteria, not on this ADR —
recorded here so the two are not conflated.

## Evidence appendix

```bash
# The gate and its hook
python3 -c "import json;s=json.load(open('package.json'))['scripts'];print({k:v for k,v in s.items() if 'badge' in k or k=='prepublishOnly'})"

# No consumer
grep -rn "badges.json" . --exclude-dir=node_modules --exclude-dir=.git | grep -v "^./docs/badges.json"

# Only two static shields remain in the README
grep -n "shields.io" README.md

# The ritual commits
git log --oneline -- docs/badges.json

# Surface that would be deleted
wc -l scripts/generate-badges-json.js .github/workflows/badges.yml
grep -n "generate-badges-json" knip.json
```

## Operator decision

**Amalik — retire, keep-and-harden, or keep-the-file-drop-the-gate?**

Recording the ruling here flips `status: proposed` → `accepted` (or `rejected`, with the chosen
alternative named), and unblocks sprint planning for Epic 1.
