# Retrospective — `dist-epic-1`: Distribution Integrity (4.0.1)

**Date:** 2026-08-23 · **Facilitator:** Amelia (Developer) · **Project Lead:** Amalik
**Status:** 7/7 stories done · epic `done` · 30 commits · 9 backlog rows generated (T41–T49)

---

## 1. What the epic delivered

The npm publish path — on which release **4.0.0 failed four times while appearing to succeed** —
now works and is **proven live**. `4.0.1-rc.0` published through CI (run `32599414962`) with a real
SLSA provenance attestation. Five gates exist where there were none:

| Gate | Story | Closes |
|---|---|---|
| npm ≥ 11.5.1 OIDC floor | `dist-1-5` | T41(b) — anonymous publish below the floor |
| OIDC precondition + credential scan | `dist-1-5` | T41(d) — placeholder credential reached npm |
| tag ↔ `package.json` agreement | `dist-1-4` | T41(c) — tag and version fully decoupled |
| dist-tag classification | `dist-1-2` | T41(a) — build metadata mis-classified |
| downgrade guard on `latest` | `dist-1-3` | T41(e) — no downgrade protection |

Plus: the badges pipeline retired (`dist-1-1`), the composed job rehearsed live (`dist-1-6`), and
the publish path enforced registry-side with an operator playbook (`dist-1-7`).

**T41 closed** (all 5 surviving findings). **T35 closed** as fixed-in-part.

---

## 2. The number that matters

Change-log rounds per story — how many times each story was corrected *after* being declared done:

| Story | Rounds | | Story | Rounds |
|---|---|---|---|---|
| `dist-1-1` | 7 | | `dist-1-3` | 3 |
| `dist-1-6` | 6 | | `dist-1-4` | 3 |
| `dist-1-5` | 5 | | `dist-1-7` | 3 |
| `dist-1-2` | 4 | | **total** | **36** |

Seven stories, **36 correction rounds**. The outcome was good; the path to it was not efficient.

---

## 3. Root cause — confirmed against the record, not asserted

**Project Lead's diagnosis:** *"things can get over-complicated easily, especially when relying on
documentation outside the project."*

Tested by sorting every defect by whether the claim was **executable locally** or **about an
external system**. The split is near-perfect.

**Local — correct on first attempt, every time:** gate composition, pack counts, lane order,
backlog integrity, reference integrity, YAML validity.

**External — wrong, unverifiable, or still open:**

| Claim | Outcome |
|---|---|
| `EPUBLISHCONFLICT` is npm's duplicate-version error | **False** — no thrower; formatter only |
| The 2FA setting makes hand-publishing impossible | **Inverted** — npm says maintainers *"must publish interactively"* |
| `--ignored=matching` gates a clean tree | **Fixture-verified**; 161 lines in the real repo, can never pass |
| BSD vs GNU `sort -V` agree | Disclosed, never closed; still unexecuted on a runner |
| `auth-only` satisfies the package policy | **Still unknown** — shipped as a recorded open risk |

**The compounding mechanism:** each wrong external claim generated a correction round, and each
correction asserted a *new* unverified external claim. ADR-003's central premise was swept **four
times** — each sweep grepping remembered wording rather than reading for the claim — before the
instrument itself had to change.

---

## 4. Honest findings about process

**4.1 — Over-complication is REPEAT feedback.** Recorded 2026-04-26 after the A26 audit: *"the
workflow is over complicated."* The rule written from it says default to **V-pass + R1 only**.
`dist-1-7` ran a 3-layer pre-implementation review, then R1 (3 layers), R2, R3 and R4 — eight agent
layers across four rounds. Mitigating: the Project Lead requested rounds 3 and 4 explicitly.
Aggravating: each round was *offered* as an open question rather than closed with a recommendation,
which is an invitation, not neutrality.

**4.2 — The `No Round 4` cap was exceeded, and the exception is instructive.** Round 4 found two
HIGHs, so the cap's premise (diminishing returns) did not hold here. The reason: rounds 2–4 were
**fixing fixes**, not reviewing work. When the instrument finally changed — a document-wide scope
banner instead of a fifth enumeration — one pass closed what four sweeps could not.

**4.3 — The safety net was a person, not the process.** The Project Lead overrode a "no further
review needed" call **three times** and was vindicated **twice**, once catching a release blocker
(`dist-1-3`'s guard failed open on `$PKG` unset and would have published `3.3.1` over `4.0.0`).
Their own account: *"the experience of developing with you taught me to be systematic with
reviews."* That is a compliment and a dependency. The process did not catch those; vigilance did.

**4.4 — Verification checks failed the same way the claims did.** Several checks confirmed the
wrong thing: an awk `$12` read that "verified" text which had landed *outside* the table; a
`grep -c` scoped to indented lines that reported 0 registry-write commands when 2 were present; a
File-List completeness check that reported all six entries missing while all six were present. Each
tested a proxy the author chose rather than the property claimed.

---

## 5. Actions taken (already applied, not aspirational)

**A1 — New rule `external-claims-must-be-executed-or-hedged`** in `project-context.md`. Any
assertion about an external system must be executed against the real basis, quoted verbatim from
primary source, or explicitly marked unverified. Includes the evidence table from §3 and the
explicit sub-clause that *correcting an overclaim with an unhedged counter-claim is the same defect
reversed*. **Owner:** dev agent, enforced at review. **Status:** DONE.

**A2 — `code-review-convergence` amended with a routing clause**, not a cap: when a round's HIGHs
are predominantly defects in the *previous round's corrections*, change the instrument rather than
patch again. Explicitly *not* a reduction in review depth — the Project Lead declined that
trade-off. **Status:** DONE.

**A3 — The Round-4 exception recorded in the rule itself**, with its diagnosis, so it reads as
evidence that Round 3 chose the wrong instrument rather than as licence for a fourth round.
**Status:** DONE.

---

## 6. Carried forward — open and dated

| Item | Score | Note |
|---|---|---|
| **T46** | 8.1 | FR5's downgrade guard **fails open on any `404`** in `npm view` stderr. Only protection between a lower version and `latest`. **Release-blocking.** |
| **T49** | 4.8 | `package.json` is `4.0.1-rc.0` → a `v4.0.1` tag aborts at gate 4. Also: FR5's comparison has **never executed on a runner**. **Release-blocking.** |
| T42 | 7.2 | `reference-integrity.js` checks file existence, not `file:LINE` pin accuracy |
| T44 | 7.2 | No override path if `latest` is corrupted — now also needs an interactive session |
| T47 | 5.4 | Nothing re-reads the registry after `npm publish`; absorbed T35's residual |
| T45 | 5.4 | npmrc credential scan inspects zero files in production |
| T48 | 3.6 | Delete-and-repush cancels its own in-flight run |
| T43 | 3.6 | `rc` dist-tag has no downgrade protection |

**Open risk shipped deliberately:** whether `auth-only` satisfies the package publishing policy is
untested, and `dist-1-7`'s primary break-glass depends on it. Recorded in AC3 and the playbook.

**Unapplied review findings:** R4's nine MEDIUM and four LOW findings on `dist-1-7` — wording and
cross-artifact consistency, not operational correctness. In the review notes.

---

## 7. Next

**T46 + T49 as a pair, before any stable tag.** Fix the fail-open, bump the version, and use T49's
non-publishing dry run to prove the guard on a real runner without spending a tag. That converts
*"the stable path has never run"* into *"the stable path has been observed"* — the only thing that
makes a `v4.0.1` tag safe to spend.

**T46 is the first test of rule A1**: its fix is a claim about how `npm view` behaves on a 404,
which must now be executed rather than asserted.
