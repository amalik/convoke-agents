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

**Head at handoff:** `5106e35b`, CI green, tree clean.

---

## 1. What this was

A `skills.sh` page listed one Convoke agent although nothing had been published there. The cause was not
a crawl: **`.claude-plugin/marketplace.json`, shipped in `files[]`, is an active publication surface** —
the `npx skills` CLI searches manifest-declared paths outside its own bounded walk, and the Claude Code
marketplace reads the same file. Convoke had been publishing 7 of its 11 agents, and none of its
workflows or contracts, to a channel it did not treat as one.

## 2. Read in this order

| # | Artifact | What it is |
|---|---|---|
| 1 | [`convoke-note-channel-integrity-findings-2026-09-26.md`](convoke-note-channel-integrity-findings-2026-09-26.md) | **The diagnosis.** Every figure carries its command. Start here. |
| 2 | [`adr/channel-integrity/adr-001-the-distribution-unit.md`](adr/channel-integrity/adr-001-the-distribution-unit.md) | **The decisions.** C1–C14 plus **Amendment 1**, which is the one that reframes everything. |
| 3 | [`convoke-epic-s4-channel-hub.md`](convoke-epic-s4-channel-hub.md) · [`convoke-epic-channel-integrity-remediation.md`](convoke-epic-channel-integrity-remediation.md) | The two epics. |
| 4 | [`convoke-note-pieces-of-knowledge-to-review.md`](convoke-note-pieces-of-knowledge-to-review.md) | Stale sentences found in passing, K1–K6. |

**There is no live PRD.** `prds/prd-BMAD-Enhanced-2026-09-26/prd.md` was superseded the day it was
written and does **not** govern — but the five reviews beside it are the most useful artifacts of that
day. Anyone reading the PRD for authority is reading a struck document.

## 3. The ruling that reframes it — ADR-001 Amendment 1

**Both `skills.sh` and the Claude Code plugin marketplace are non-reference, disclaimed channels.
Reference distribution is GitHub + npm.** Purpose of channel presence is *visibility* — "reference all of
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
| `cir-1-3` | not authored. **Sized for a world where the channels had to be complete — re-scope before authoring.** |
| `s4-1-1` | authored, not built. Same re-scope caveat. Its four rulings are closed. |
| `s4-1-2` | not authored. Blocked on `validate-marketplace.js`'s `AGENT_IDS` identity check. |

## 5. Next action, and it is small

**`T183`** — the only genuinely dead upstream dependency. It carries its own corrected fix spec, derived
2026-09-27; do not re-derive it. About an hour. It is the only remaining item that repairs the **reference
product**, which Amendment 1 makes the only thing that has to be complete.

Everything else waits on a re-scope, because the channels are non-reference now and both `s4` and
`cir-1-3` were sized before that ruling.

## 6. Open decisions — all small, none blocking `T183`

- **`IN-240(f2)`** — keep the baseline↔references assertion symmetric, or assert only the direction the
  guard exists for?
- **`IN-240`** — may a reference file name *additional* paths (exact set equality currently reddens a
  legitimate `hc*` contract pointer)? And keep hard-coding the sibling-`steps/` convention?
- **The hub's name is ruled (`convoke`); its shape is not** beyond C10/C11.
- **`sprint-status.yaml` vocabulary** — `cir-1-2` is recorded as `descoped-by-ADR`, which is defined as
  closure *by an ADR*. It was closed as a **duplicate**. The vocabulary has no value for that; two comment
  lines above the entry say so. Add a `duplicate` value, or leave it.
- **Is `cir-1-1` in the right epic?** It fixes source-repo path hygiene, not the channel problem the
  epic's Why invokes. See §7.

## 7. Traps — each one cost real time

- **Do not use `resolve_config.py`** for module config. Central TOML only; its `modules` keys have no
  `bme`; it drops `document_output_language` and `project_name`; and it would take `_bmad/bme/` Python
  usage 0 → 3 against an invariant the absorption architecture credits with making upstream's churn inert.
  Read `_bmad/bme/config.yaml` instead — one read, everything.
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

## 8. The two lessons that outlived the work

Both are now rules in `project-context.md`, which is the durable form:

- **`derive-before-you-write`**, and specifically its **mechanism clause** — six rescued drafts were one
  mistake: a mechanism prescribed without reading the mechanism.
- **`file-stale-knowledge-when-you-find-it`** — findings about someone else's sentence go to the queue
  (§2 row 4), not into a drive-by edit and not into a chat message.

And one that is not a rule because it needs a person: **when an artifact is superseded, carry its
obligations forward, not just its decisions and defects.** The PRD was the only place the per-segment
obligations lived. Its diagnosis, decisions and defects were all inherited; the obligations were not — and
that is why `cir-1-1` could drift from the channel to the source repo with no gate noticing.
