# Retrospective — `dist-epic-2`: The package contains what it promises

**Date:** 2026-09-08 · **Epic:** `dist-epic-2` (Convoke 4.0.1 distribution integrity) · **Status:** 10/10 stories done
**Participants:** Amalik (Project Lead), Amelia (Senior Software Engineer), John (PM), Winston (Architect), Murat (Test Architect), Mary (Analyst), Dr. Quinn (Problem Solver)

---

## 0. The finding that outranks every other one

**`package.json` is `4.0.1`. `npm view convoke-agents dist-tags.latest` is `4.0.1`. The same version.**

Epic 2 fixed the conversion tooling shipping in the tarball, the broken documented references, the
missing dependency registry (BUG-19), the unreachable `_bmad/bme/_portability/` module, and the
unescaped interpolations in the exporter. **None of it has reached a user.** Every defect this epic
closed is live on `latest` for anyone running `npm i convoke-agents` today.

The `team-expansion-freeze` exit condition is worded precisely — *4.0.2 **ships** `dist-epic-2`*.
The publish is the exit, not the epic. **Convoke is not out of the freeze.**

This retro treats the publish as the critical path. No new epic work starts before it.

---

## 1. What the epic delivered

| Gate | Story | Now blocking |
|---|---|---|
| `docs:audit` in CI | `dist-2-1` | yes — `agent-surface-parity`, in `publish.needs` |
| Every documented reference resolves inside the package (FR12) | `dist-2-2` | yes |
| Conversion tooling excluded from the tarball | `dist-2-3a` | — |
| Covenant moved into source-owned space | `dist-2-3b` | — |
| CHANGELOG links settled + shipped-link gate wired blocking | `dist-2-3c` | yes |
| Installed tree carries what was shipped (FR13) | `dist-2-4` | yes — via T102 |
| Dependency registry ships; BUG-19 closed | `dist-2-5` | — |
| Portability reachable; installed-tree assertion wired | `dist-2-6` | yes |
| Every interpolated regex escaped | `dist-2-7` | — |
| Validate the manifest set that actually seeds | `dist-2-8` | yes |

Suite: **2,232 tests at close** (`npm test`, 2026-09-08), against **1,655** at `a57e02e8`, the
`dist-epic-1` close — measured by re-running the suite in a worktree at that commit. An earlier
draft said "1,890 → 2,232"; 1,890 is a real figure but a **mid-epic** one, recorded during
`dist-2-4`, not the starting baseline. Two ADRs signed mid-epic that did not exist when it was written —
**ADR-002** (shipped-link policy, three amendments) and **ADR-004** (bme module contract). The epic
discovered it needed a constitution.

## 2. The number that matters

Epic 1's retro made review rounds its headline. Epic 2's equivalent:

**Five of the nine stories with story files reached Round 3 — the convergence cap:** `dist-2-2`,
`dist-2-3a`, `dist-2-3b`, `dist-2-4`, `dist-2-5`. **Four closed at Round 1 without triggering
Round 2:** `dist-2-3c`, `dist-2-6`, `dist-2-7`, `dist-2-8` — the first two say so in terms
("Round 2 not triggered"). `dist-2-1` shipped straight from the epic body with no story file at all.

> **This paragraph was wrong on its first draft, and the correction belongs in the record.** It read
> *"seven of nine reached Round 3 … only `dist-2-7` and `dist-2-8` closed at Round 1"*, derived by
> counting `Round N` mentions per file. That method screened out false **Round 4** hits — which the
> draft then cited as having "checked" the number — while counting a *mention* of Round 3 as a Round 3
> and missing two explicit "Round 2 not triggered" statements. Re-derived from each file's own
> numbered-round **headers**: five, not seven. Caught by Round 1 review of this retrospective.
>
> That is this epic's dominant defect class reproduced **inside the document criticising it**: a count
> asserted from a proxy, with a disclaimer that made it look audited. It is left visible rather than
> silently corrected, because the silent correction is what the class feeds on.

**The pattern is already encoded and held all the way through:** each round's HIGHs were defects in
the *previous round's fixes*. T102 closed this session with attempt **three** of the same `(b)` fix,
the first two having been reviewed and found wrong.

## 3. What went well

**Deletion beat repair, twice, independently.** `dist-2-4` Round 3 deleted the zero-unit alarm rather
than fixing it — removing code cannot reintroduce the class of defect every prior repair had.
`dist-2-5` arrived at the same shape from the other side: BUG-19's fix turned out to be an **empty**
registry created at install, not the `files[]`+copy the story specified, nor the project scan that
replaced it. **The installer must never write governance rows on the operator's behalf.**

**Traps were documented instead of re-sprung.** The `skill-manifest.csv` candidate-list trap has
caught four attempts and cost one reverted ADR; the 75-of-106 non-resolving paths are the *design*.
It is now a comment at the test naming both commits and the archived row.

**NFR10 held.** Every gate was demonstrated failing before being merged blocking. That is why arming
three gates on the publish path did not take CI down.

## 4. What did not

**Vacuous verification survived every process we added.** Four instances in the closing stories
alone, each caught only by *running* rather than reading: `dist-2-7`'s pin could not see quoted keys;
`dist-2-8`'s ratchet plant threw before planting anything, making "16 pass" meaningless; T102's (e)
test exercised the callee, not the caller where the defect was; and T102's first NFR10 demonstration
injected a probe into a registry the generator *reads*, so it landed on both sides of the comparison
and the gate correctly said `tree=0`. (That fourth one is an **in-session observation with no story
record** — the T102 backlog row documents only the successful final demonstration. Flagged by review
as the one incident resting solely on the author's account; the *mechanism* is checkable at
`refresh-installation.js:854`, which generates wrappers by iterating the same registry.)

That last one is a shape `verification-must-be-falsifiable` did not previously cover, and the rule
has been amended with it — see §6.

**Six untrue comments, none caught by the author.** Three in `installed-tree.js`, one in its test
file, one in `try-fresh-install.sh` asserting `DELIBERATELY NOT IN THE VERDICT` three lines above
text saying the opposite, and one claiming all three `chdir`-calling suites seed a manifest when one
builds a bare git repo with no `_bmad/` at all.

**Counting errors, repeatedly** — including declaring a *correct* figure wrong by silently changing
the grouping basis. That is `verification-basis` failing in the direction that looks like diligence.

**The common root of all three:** verifying against the artifact's self-description rather than
against the basis the claim is about.

**Two files shipped through three review rounds without ever being in a reviewed diff.**
`try-fresh-install.sh` and the backlog markdown were excluded from every T102 round's diff. Reviewed
separately at the operator's prompting, **both had defects** — including the contradictory comment
above. A round's diff is not the commit's diff unless someone checks.

## 5. Epic 1 debt, re-triaged against the publish

| Item | State | Publish-relevant? |
|---|---|---|
| T45 | **Appears already fixed** — `ci.yml:697-730` now scans every npmrc npm reads, and its comment names the exact inert state T45 filed. Row is stale, code is not. | Needs a closing check, not work |
| T49 | Open — the FR5 downgrade comparison **has never executed on a runner**; one of five gates never exercised | **Yes** — 4.0.2 > 4.0.1 should pass, but unproven |
| T47 | Open — nothing re-reads the registry after `npm publish`; a RED run can still have moved `latest` | **Yes** — post-publish verification |
| T48 | Open — delete-and-repush tag recovery cancels its own in-flight run | Yes, if the publish needs recovery |
| T43 | Open — `rc` dist-tag has no downgrade protection | Only if publishing an `rc` |
| T42 | Open — nothing distinguishes a LIVE pointer from a DATED record | No |
| T44, T46 | Closed (closing notes in the archive) | — |

**T45 is worth naming for its own sake:** a check in the publish job that reported OK after
inspecting zero files. That is this epic's dominant defect class, already filed, sitting on the path
of the very publish that exits the freeze — and it was fixed without the row being closed.

## 6. Actions taken (applied, not aspirational)

1. **`verification-must-be-falsifiable` amended** in `project-context.md` — four new incident rows
   (count corrected 5 → 9 from the rows), plus two new clauses:
   - *The mutant must not be **absorbed by a derived expectation**.* Ask what the expected set is
     derived from; if it includes the thing you mutated, the mutant is inert.
   - *A demonstration that trips several gates at once has not isolated yours.* When a verdict is a
     conjunction, a demonstration moving two terms tests neither.
2. **T102 closed** — six correctness fail-opens `(a)`-`(f)` fixed, `$TREE` wired into the harness
   verdict, gate demonstrated failing with `$TREE` isolated.
3. **T126 filed** with twelve items; `(r)` added from T102's own review round.
4. **Test 1b's recorded diagnosis corrected** — the cross-file `chdir` race is **falsified**
   (`node --test` isolates per file, measured). `REPO_ROOT` is now `__dirname`-derived and guarded.

## 7. Open action items

| # | Action | Owner | Status |
|---|---|---|---|
| 1 | **Publish 4.0.2** — bump `package.json` off 4.0.1, ship through the CI path, verify `latest` moved. **Blocks all new epic work.** | Amalik | open |
| 2 | Close T45 with a verification check — confirm `ci.yml:697-730` satisfies its filing, then close the row | dev agent | open |
| 3 | T49 before the stable tag — prove the FR5 comparison on a runner via a non-publishing dry run | Amalik | open |
| 4 | T47 — re-read the registry after publish; a green run is not proof `latest` moved | dev agent | open |
| 5 | Sequence T126 `(g)` first — the forged-emit-line spoofing vector, now that a blocking gate parses that output | dev agent | open |
| 6 | Make the reviewed set equal the committed set — no round closes while a changed file sits outside its diff | dev agent | open |

## 8. Readiness assessment

| Dimension | State |
|---|---|
| Stories | ✅ 10/10 done |
| Local gates | ✅ 2,232 tests, lint clean, `docs:audit` 0, backlog-integrity PASS, harness PASS |
| Blocking gates armed | ✅ three, each demonstrated failing before merge |
| **Published** | ❌ **NO — `latest` is 4.0.1. Every fix is unshipped.** |
| Freeze exit | ❌ not met — the exit is the publish |
| Next epic | none defined in the 4.0.1 epic file; Epic 2 is the last |

**Verdict: complete as an epic, not delivered as a release.**

## 9. Key takeaways

1. **A finished epic is not a shipped fix.** Ten green stories moved nothing for users until 4.0.2 publishes.
2. **Rules did not stop the vacuous checks — running the falsification did.** Four occurred *after* the rule existed and was being followed.
3. **A round's diff is not the commit's diff.** Two files reached the final commit unreviewed; both had defects.
4. **Prefer deletion when a fix keeps leaking.** Both stories that stopped repairing and started removing closed cleanly.
