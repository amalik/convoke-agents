---
initiative: convoke
artifact_type: note
qualifier: channel-integrity-handoff
created: '2026-09-27'
status: active
schema_version: 1
qualifier_role: operator-authored
---

# Channel Integrity — handoff

**Start here.** The work spans a dozen artifacts and this is the index. It **points** rather than
restates: a figure copied into this file would rot, so every number lives with the command that derives
it, in the artifact that owns it.

**Head at handoff:** `caf19d1f` (was `5106e35b` at first writing), CI green, tree clean. **Refreshed 2026-10-14** after Amendments 2–5; everything below this line was written on 2026-09-28 unless it says otherwise.

---

## 1. What this was

A `skills.sh` page listed one Convoke agent although nothing had been published there. Convoke had been
treating a live publication surface as inert metadata, and 7 of its 11 agents — and none of its workflows
or contracts — were reachable through a channel it did not treat as one. **That much still holds.**

> **⚠ The CAUSE stated here for three weeks was wrong, corrected 2026-10-14 (ADR-001 Amendment 4).**
> This section read: *"The cause was not a crawl: `.claude-plugin/marketplace.json`, shipped in `files[]`,
> is an active publication surface — the `npx skills` CLI searches manifest-declared paths outside its
> own bounded walk, and the Claude Code marketplace reads the same file."*
>
> **Measured, the cause is neither a crawl nor the manifest.** skills.sh *"index[es] every public skill
> that ships through the open skills CLI and rank[s] them by anonymous install telemetry"* (its `/about`).
> A listing follows an **install**. That is why the manifest declares **seven** and the catalogue shows
> **one** — the one with an install count of 1, first seen 16 June 2026. Whether the CLI reads
> manifest-declared paths is a **separate and still untested** question. And the Claude Code marketplace
> does **not** read the same file as a catalogue: Convoke is in **none** of the three plugin catalogues
> (official 0/315, community 0/2283, BMAD's PR #9 closed), so the only Claude Code route is BYO-URL, which
> reads the manifest live and shows the **plugin entry's** `description` rather than any skill's.
>
> **Why this matters to anyone picking the work up:** the original cause implied reach was a function of
> what Convoke declares. It is a function of what people install. Every plan built on "declare it and the
> channel shows it" needs re-reading against A4.6 and A4.7.

## 2. Read in this order

| # | Artifact | What it is |
|---|---|---|
| 1 | [`convoke-note-channel-integrity-findings-2026-09-26.md`](convoke-note-channel-integrity-findings-2026-09-26.md) | **The diagnosis.** Every figure carries its command. Start here. |
| 2 | [`adr/channel-integrity/adr-001-the-distribution-unit.md`](adr/channel-integrity/adr-001-the-distribution-unit.md) | **The decisions.** C1–C14 plus **five amendments**. A1 reframes the initiative; **A4 is the measurement that falsified the original cause** and A5 is the ruling that followed. Read A4 and A5 before acting on A1.3, A1.4 or A2.1, each of which carries a ⚠ pointer. |
| 3 | [`convoke-epic-s4-channel-hub.md`](convoke-epic-s4-channel-hub.md) · [`convoke-epic-channel-integrity-remediation.md`](convoke-epic-channel-integrity-remediation.md) | The two epics. |
| 4 | [`convoke-note-pieces-of-knowledge-to-review.md`](convoke-note-pieces-of-knowledge-to-review.md) | Stale sentences found in passing. **No range stated here — it grew twice on 2026-09-27 alone.** Derive it with `grep -n '^### ~*K[0-9]' _bmad-output/planning-artifacts/convoke-note-pieces-of-knowledge-to-review.md`; struck headings are resolved and recorded in the Resolved table at the foot. |

**There is no live PRD.** `prds/prd-BMAD-Enhanced-2026-09-26/prd.md` was superseded the day it was
written and does **not** govern — but the five reviews beside it are the most useful artifacts of that
day. Anyone reading the PRD for authority is reading a struck document.

## 3. The ruling that reframes it — ADR-001 Amendment 1

**Both `skills.sh` and the Claude Code plugin marketplace are non-reference, disclaimed channels.
Reference distribution is GitHub + npm.** — **narrowed 2026-10-14 by A5.1:** Convoke commits to writing
the disclosure on every surface it controls (the 7 `SKILL.md` `description`s **and** the plugin entry
`description`), and **not** to any channel rendering it. On skills.sh it currently is not rendered, and
publication cannot change that. Purpose of channel presence is *visibility* — "reference all of
our agents/skills as a quick win without degrading our core reference product". Binding condition is
**non-degradation**, made testable as: *a channel listing never claims more than the ledger's status for
that capability.*

**S2 is no longer the destination**, and **S4 is not a step toward it.** S2 would sell the differentiator:
the handoff contracts have no software enforcement, so the coupling exists only as prose and the sole
mechanism holding it together is that the pieces arrive together.

## 4. Story state

| Story | Status |
|---|---|
| `cir-1-1` | **done.** Residue `IN-240` (8 holes, 2 rulings). |
| `cir-1-2` | **closed unimplemented** — a duplicate of `T183`. Its fix was also wrong; do not copy it. Kept for the review inside it. |
| `cir-1-3` | **SHIPPED 2026-10-10** (`8f15aa1d`) + Round 1 fixes (`c8d7594d`); status `review`. The notice is in all 7 frontmatter `description`s and a `## Maturity and limits` pointer in each body. **It is correct in the files and currently reaches no pre-install surface on either channel** — see A4.6/A4.7. Residue: `IN-253` (two AC7 checks weaker than claimed). |
| `s4-1-1` | **deferred, re-affirmed 2026-10-14 on evidence (A5.2).** Its revival condition — *evidence about what breaks for a real operator arriving through a channel* — **is met**, and the evidence argues against the remedy: the defect is skills.sh-shaped, does not exist on the Claude Code path, and a hub would reach that catalogue only once somebody installed the hub. **C10 and C11 stand.** The banner now states what would change the ruling. |
| `s4-1-2` | not authored. Blocked on `validate-marketplace.js`'s `AGENT_IDS` identity check. |

## 5. Next action

**Rewritten 2026-10-14.** The chain this section tracked is finished: `T183` done 2026-09-27, the epic
re-scope done 2026-09-28, `cir-1-3` shipped 2026-10-10, and Amendments 2–5 ruled between 12 and
14 October. **The initiative has no blocked work and no next story.** What is left is qualification and one
cheap experiment.

**Unqualified intakes** — derive them rather than trusting this list:
`grep -n 'IN-25[1-7]' _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`.
At 2026-10-14: `IN-251` (a unit test asserts on a gitignored path in the real repo), `IN-252`
(`*validate-create-story` is recommended and not installed), `IN-253` (`cir-1-3` AC7), `IN-254` (`T275`'s
unblock condition cannot fire on the failure actually observed), `IN-255` (both sub-questions answered;
one residual), `IN-257` (`anthropics/claude-plugins-community` — **deliberately unruled by A5.3**, and
it collides with A1.2). `IN-256` is **discharged**, not pending.

**The one open experiment, and it is self-answering.** Does a *subsequent* install refresh a skills.sh
snapshot? Installing any one of the six unlisted agents through `npx skills add` would both test the
mechanism and, if A4.6's inference holds, place a correctly-disclosed listing on the channel. It is an
outward action that registers telemetry against the repository, so it is an operator decision, not a task.

**`T275` stays `Blocked`** and its trigger is queried by `IN-254`: it waits for the disclosure to *drop*,
and what happened is that it never *arrived*.

## 6. Open decisions — all small, none blocking `cir-1-3`

- **`IN-240(f2)`** — keep the baseline↔references assertion symmetric, or assert only the direction the
  guard exists for?
- **`IN-240`** — may a reference file name *additional* paths (exact set equality currently reddens a
  legitimate `hc*` contract pointer)? And keep hard-coding the sibling-`steps/` convention?
- **The hub's name is ruled (`convoke`); its shape is not** beyond C10/C11.
- ~~**`sprint-status.yaml` vocabulary**~~ — **RULED 2026-09-28. `deferred` and `duplicate` added.**
  `s4-1-1` is now `deferred` and `cir-1-2` is `duplicate`, correcting a mislabel that had stood since
  2026-09-27. **The ruling was forced by a demonstrated destructive path, not by tidiness:** neither
  pre-existing value was safe for a deferred story — `ready-for-dev` is what `bmad-dev-story` selects on
  (`SKILL.md:103-107`), flipping the status before it reads the file, and `backlog` is what
  `bmad-create-story` selects on (`SKILL.md:140-144`), whose `:399` *"Save story document unconditionally"*
  would have **overwritten `s4-1-1`'s file**, four closed operator rulings and its deferral banner with it.
  A comment is not data to either skill. Both new values are selected by neither, so the hold is mechanical.
  Consumer audit run: no consumer enumerates an allowed set, `backlog-integrity.js` parses both as
  `[a-z-]+` and classifies `deferred` as live, and its three status-divergence warnings are unchanged.
- **Is `cir-1-1` in the right epic?** It fixes source-repo path hygiene, not the channel problem the
  epic's Why invokes. See §7.

## 7. Traps — each one cost real time

**Added 2026-10-14 — all three are instrument failures, not data failures.**

- **A claim about a third party must be measured at the third party.** A2.1's reach table measured the
  repository's files — correctly — and labelled the result a property of the **channels**. Every other
  row in it described a surface Convoke produces, so the method worked for all of them and silently failed
  for the one that didn't. **If a row names someone else's system, the command that produced it must have
  talked to that system.**
- **A summarised page is not a measurement.** Two model-read fetches of the same two skills.sh pages
  produced a conclusion — *"the channel renders the body rather than the frontmatter `description`"* —
  that raw `curl` + `grep` reversed within one call. It renders the `description`; it was simply four
  months old. **Fetch the bytes and grep them** when the answer decides a ruling.
- **`T275`'s own evidence grep now matches the subject, not the guard.**
  `grep -rn 'Non-reference listing' --include='*.js' --include='*.yml' --include='*.json' --include='*.sh' .`
  was written to prove *no gate guards the notice* and returned **0**. Since A5.1 put the notice into
  `.claude-plugin/marketplace.json` it returns **1**, and nothing about protection has changed. Exclude
  `.claude-plugin/`, or assert on the guarding file — **never on a count**.

- **Do not use `resolve_config.py`** for module config. Central TOML only; its `modules` keys have no
  `bme`; it drops `document_output_language` and `project_name`; and it would take `_bmad/bme/` Python
  usage 0 → 3 against an invariant the absorption architecture credits with making upstream's churn inert.
  Read a config **Convoke actually writes** instead — which is **not** `_bmad/bme/config.yaml`.
  **Corrected 2026-09-27 by `T183`:** that file is BMAD's installer's to write, `files[]` carries no
  `_bmad/bme/config.*`, and a real fresh install (`bash scripts/audit/try-fresh-install.sh`) produces only
  the six *submodule* configs. Reading it alone resolves to nothing for any operator without upstream
  BMAD. The shipped read is `{project-root}/_bmad/bme/_vortex/config.yaml`. Before rebuilding this in
  prose, read `scripts/update/lib/config-loader.js` — `:21` already replaces the `bmad-init` load path and
  `:35` already assigns `{user}` resolution to the agent.
- **`agent-surface-parity.js` does not cover activation-block defects.** Its check is a presence regex
  (`:110`) that passes the defect and the fix identically. **Three stories cited it as coverage.**
- **`refs:audit` sees nothing in the agent reference files** — it space-fills inline code spans, and every
  path there is backticked. It reports *0 references checked* over them.
- **`grep -rc` is never a falsifier.** It exits 0 whether or not the string is present.
- **Bare `eslint --max-warnings 0` exits 1** (it lints `eslint.config.mjs`). Use `npm run lint`. **Bare
  `agent-surface-parity.js` exits 1** — it needs two git refs.
- **C8 still binds.** There is no self-serve retraction from `skills.sh`; a published name is permanent.
  Nothing new is published until the discovery surface is declared and checkable — and **C12 declined to
  build the gate**, so that is an accepted risk, not compliance.
- **Grep the backlog before authoring a story.** `cir-1-2` duplicated `T183` by ten days.
- **Closing a story silently drops its unmet ACs.** Nothing walks them; the status flips and the
  obligations go with it. `cir-1-2` was closed as a duplicate of `T183` carrying **9** ACs
  (`grep -c '^\*\*AC[0-9a-z]*' _bmad-output/implementation-artifacts/cir-1-2-*.md`). **AC7** — file the v7
  watch item — was unmet, and survived only because that pass happened to re-read the ACs; it is now
  `IN-241`. Whichever of them the successor does *not* inherit dies unrecorded, and the row shows nothing.
  **Before closing a story for any reason — duplicate, superseded, descoped — walk its ACs and dispose of
  each one explicitly: inherited by <successor>, already satisfied, or re-filed as <ID>.** §8's *carry the
  obligations forward* is this same class one artifact up, at the superseded PRD; this is the story-level
  instance, and it has now happened at both levels.

## 8. The two lessons that outlived the work

Both are now rules in `project-context.md`, which is the durable form:

- **`derive-before-you-write`**, and specifically its **mechanism clause** — six rescued drafts were one
  mistake: a mechanism prescribed without reading the mechanism.
- **`file-stale-knowledge-when-you-find-it`** — findings about someone else's sentence go to the queue
  (§2 row 4), not into a drive-by edit and not into a chat message.

**A third candidate, 2026-10-14, not yet a rule:** *a claim about an external system is unverified until something talked to that system.* Amendment 4 exists because this was not true of A1.4 or A2.1, and the original diagnosis in §1 survived three weeks on the same footing. It is close to `verification-must-be-falsifiable` but not the same — those claims were falsifiable, and nobody had run the falsifier. Raise it as a rule only if it recurs outside this initiative.

And one that is not a rule because it needs a person: **when an artifact is superseded, carry its
obligations forward, not just its decisions and defects.** The PRD was the only place the per-segment
obligations lived. Its diagnosis, decisions and defects were all inherited; the obligations were not — and
that is why `cir-1-1` could drift from the channel to the source repo with no gate noticing.
