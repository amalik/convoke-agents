---
initiative: convoke
artifact_type: recruitment-protocol
qualifier: v63-4-5-recruitment-protocol
release_target: 4.0.0
validator_handle: TBD
validator_relationship: TBD
recruitment_date: TBD
session_date: TBD
created: '2026-08-15'
schema_version: 1
epic: v63-epic-4
---

# Story 4.5 — N=1 External Validator Recruitment Protocol

Satisfies AC1. Authored at release time per the Task 0.5 execution precondition. Operator fills the four `TBD` frontmatter keys at Task 1.2–1.3.

---

## ✅ Prerequisite — the 4.0 candidate must be reachable before recruiting

**RESOLVED 2026-08-15.** `4.0.0-rc.1` published under the `rc` dist-tag. Verified: `dist-tags: { latest: 3.3.0, rc: 4.0.0-rc.1 }` — `convoke-agents@latest` still resolves to 3.3.0, so no existing user is exposed to the candidate; the validator installs with `npm install convoke-agents@rc`.

*Original finding, retained because it is a real gap in the story's gate:* `package.json` read `4.0.0-rc.1` while npm published only to `3.3.0`. A validator following Decision 4 would have installed `@latest`, received 3.3.0, and `convoke-update` would have had nothing to do. **Task 0.3 verifies the version *string*, never that the candidate is *obtainable*** — worth fixing in the story's precondition list before this pattern repeats at 4.1.

**Options considered (operator decision — publishing is outward-facing):**

- **Recommended — publish `4.0.0-rc.1` under a non-default dist-tag** (`npm publish --tag rc`). `latest` stays at 3.3.0, so no existing user is exposed to the candidate, and the validator installs with `npm install convoke-agents@rc`. This is the only option that exercises the real registry upgrade path, which is what FR40 is about.
- *Rejected — tarball / `npm pack` handoff.* Works mechanically but bypasses the distribution channel under test, so a registry-specific failure (tag resolution, packaged-files omission, postinstall behaviour on a clean machine) would go undetected. That failure class is exactly what N=1 exists to catch.
- *Rejected — install from git.* Same objection, plus it requires toolchain the validator profile does not assume.

**Relationship to T25** (install-tarball smoke — **shipped 2026-08-14** as the `fresh-install` CI job in `.github/workflows/ci.yml`, gating `publish`): T25 packs the tree and installs *that tarball* into a throwaway project on every run, so packaging defects of the I135 class are already caught automatically. The N=1 session is the complement T25 cannot provide — a human reading the output. If the validator hits a packaging defect anyway, that is a T25 coverage gap and should be logged as one.

---

## Validator profile (Decision 1)

**Required:** (a) a human who is not Amalik; (b) able to run `npm install` and a CLI command from a terminal unsupervised; (c) willing to give 30–60 minutes live plus a short debrief.

**Explicitly not required:** BMAD or Convoke familiarity, software-engineering depth, AI-product domain knowledge. Recruiting an expert biases the test toward the maintainer baseline — the value of N=1 comes from someone who does *not* already know what the commands are supposed to do.

**Pool:** operator-identified. Examples: a friend with Node experience, a fellow consultant, a developer at a portfolio company. **N=1 is the floor, not the ceiling** — recruit more if they're available.

**PII:** record a first name or pseudonym in `validator_handle`. Nothing further is needed.

---

## Outreach pitch (send as-is; one paragraph)

> I'm about to ship version 4.0 of Convoke, an open-source pack of AI agent teams for product work — it plugs into the BMAD Method framework, and it's what I use with clients. Before I release it I need exactly one person who *isn't* me to run the upgrade on their own machine and tell me what's confusing, because I've stared at it too long to see the rough edges any more. It's about an hour: you install it, run one upgrade command, and I sit quietly and watch — I'm testing the software, not you, and every place you get stuck is a bug I need to fix. No prep needed, no prior knowledge of the tool, and you don't need to be a specialist. Here's the release summary if you want to see what you'd be upgrading to: [link CHANGELOG 4.0.0]. Any chance you'd have an hour in the next week or two?

Adjust tone to the relationship; keep the three load-bearing pieces — **~1 hour**, **their own machine**, **being stuck is data, not failure**.

---

## Session setup checklist (confirm before the session)

- [ ] 4.0 candidate reachable on the registry (prerequisite above) — **hard gate**.
- [ ] **Validator is on the `rc`, and it is the copy that will actually run.** Confirmed 2026-08-15 that this is the single easiest way to lose a session. Have them run, in their project directory:
      `npm install convoke-agents@rc && npx -p convoke-agents@rc convoke-version`
      The reported package version **must** read `4.0.0-rc.1`. If it reports anything else, stop and resolve before the session — a stale global install (`npm ls -g --depth=0 convoke-agents`) will shadow the local one whenever a bare `convoke-update` is typed, and the resulting `⚠ DOWNGRADE DETECTED` error's own remediation points at `@latest`, which resolves to 3.3.0 and can never reach the candidate.
- [ ] **Always invoke with `-p convoke-agents@rc`** during the session, never a bare `convoke-update`. The published migration guide says `@latest`, which is correct after ship and wrong for rc validation.
- [ ] Validator's machine: Node ≥ 18, npm ≥ 9. Have them run `node -v && npm -v` in advance so a version problem doesn't burn session time.
- [ ] Validator picks their starting state and says which: **fresh `npm install`** or an **existing Convoke 3.x install**. Both are in scope; record the choice.
- [ ] Screen-share arranged, and confirm they're comfortable being observed and thinking aloud.
- [ ] Operator has `v63-4-5-session-log.md` open and ready to fill in real time.
- [ ] Confirm the ask again on the day: install → `convoke-update` → verify with `convoke-doctor` and/or run one or two Vortex agents. **Out of scope:** PF1 battery, CHANGELOG review, or opinions on Convoke as a product. This tests the *upgrade experience*, nothing else.

---

## Expected output — recognise, do not explain

A dry run of the full path (`@3.3.0` install → `convoke-install` → upgrade to `@rc` → `convoke-update` → `convoke-doctor`) was executed on 2026-08-15 in an isolated directory. Result: migration applied (`3.3.x-to-4.0.0` + `refresh-installation`), backup written, `convoke-update` exit 0, `convoke-doctor` 27 checks passed with zero hard failures.

Three things surface that are **not defects**. Recognise them so you don't break observe-silence decoding them live — and do **not** pre-explain them to the validator, since their reaction to each is exactly the data this session exists to collect.

1. **`⚠ BMAD core not detected (package not in node_modules)`** — the first line of `convoke-update` output. This is `preflight-soft-warn` behaving as specified (stderr warning, exit 0 pass-through). It will fire for essentially every validator, because a bare npm project has no BMAD installed alongside.
2. **`⚠ BMM dependencies: registry present — bmm-dependencies.csv not found`** — appears **twice**, once in the post-upgrade governance check and again in `convoke-doctor`, each time directing them to run a further command. Non-blocking.
3. **The label in (2) contradicts its own message** — it reads "registry present" while reporting the registry is absent. A careful validator may flag this, and they would be correct. Pre-classified as **CONCERN**, not BLOCKER; log to the Fast Lane rather than halting the session.

If the validator hits anything *outside* this list, that is genuine signal — capture it verbatim.

---

## Day-of protocol (operator conduct)

**Observe. Do not help.** Intervene only when the validator is stuck for **more than 5 minutes**, or when there is a safety issue (destructive command, credential exposure). Every rescue destroys the data point you're there to collect.

**Capture verbatim.** Exact error text, not your paraphrase. Their words, not your interpretation. Timestamps at each milestone: start, each question or hesitation, completion or halt.

**Silence is data.** A long pause at a prompt is a finding. Note where it happened and what was on screen.

**Environment capture** — if anything environment-flavoured shows up (OS-specific behaviour, a Node version warning, a registry quirk), ask them to paste `node -v && npm -v && uname -srm && npm config get registry` and record it in the session log's optional `validator_environment` key.

**Three closing questions, asked verbatim:**

1. What was the most surprising thing?
2. What broke, almost broke, or felt fragile?
3. Would you recommend this to *[a specific peer of theirs]*?

**Immediately after:** save and commit the session log while it's fresh, then triage each issue as BLOCKER / CONCERN / OBSERVATION per Decision 3. Security issues are **always** BLOCKER, even if the run completed.
