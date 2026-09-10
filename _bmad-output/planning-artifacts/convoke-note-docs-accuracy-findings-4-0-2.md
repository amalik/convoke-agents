---
initiative: convoke
artifact_type: note
created: 2026-09-10T00:00:00.000Z
schema_version: 1
status: active
inputDocuments:
  - docs/development.md
  - docs/agents.md
  - docs/pre-tag-release-checklist.md
  - scripts/docs-audit.js
  - package.json
  - project-context.md
---

# Documentation Accuracy — Derived Findings for 4.0.2

## Why this note exists

The operator found two stale spots by eye on 2026-09-10 (`docs/development.md`, the
`docs/agents.md` flow diagram) and asked for a documentation quality check before the
4.0.2 tag. This note records the findings **derived from source** during scoping, so the
remediation stories start from evidence rather than rediscovering it.

**Every row below names the command that produced it.** Per
`verification-claims-must-name-their-evidence`, a finding with no reproducible pointer is a
suspicion, not a finding.

## The finding that shapes the epic

`npm run docs:audit` **exits 0 with zero findings** on both files:

```sh
set -o pipefail; npm run docs:audit >/dev/null 2>&1; echo "EXIT: $?"   # => EXIT: 0
```

It is not broken. It checks *shape* — stale references, broken links, broken paths, docs
coverage, incomplete agent tables, internal naming leaks, stale brand references
(`scripts/docs-audit.js:59-457`). All eleven findings below survive it, because none of them
is a shape defect. This is `documentation-claims-must-be-derived` stated as a measurement:
*nothing in this repository has an opinion about whether a sentence is true.*

**Consequence for the release gate.** [`docs/pre-tag-release-checklist.md`](../../docs/pre-tag-release-checklist.md)
§3 asserts every CI job green, and `docs:audit` is one of those jobs. So the release path as
it stands **cannot refuse a tag over documentation content**, and no gate can be built that
does. The only enforceable form is a recorded derivation pass — a checklist step asserting a
signed findings artifact exists for the release SHA. That is Story 5's subject.

## Findings — `docs/development.md` (141 lines)

Severity key: **ACT-FAIL** = a reader follows the doc and the action fails · **MISLEAD** = the
reader forms a false belief but nothing breaks · **ROT** = stale marker, no reader impact.

| ID | Line | Claim as written | Reality | Evidence |
|----|------|------------------|---------|----------|
| **D1** | [L75](../../docs/development.md#L75) | Use `/bmad-team-factory` | Installed skill is `bmad-agent-bme-team-factory`; the command as written does not exist | `sed -n '219p;230p' scripts/update/lib/agent-registry.js` → `id: kebab-case identifier (becomes bmad-agent-bme-{id})` + `id: 'team-factory'` |
| **D2** | [L77](../../docs/development.md#L77) | "Three capabilities: **Create Team**, **Add Agent**, **Add Skill**" | Only Create Team shipped | `ls -1 _bmad/bme/_team-factory/workflows/` → `add-team`, `step-00-route.md`. Matches P25 (unshipped Phase 3, TF-FR25/26) |
| **D3** | [L52](../../docs/development.md#L52) vs [L83](../../docs/development.md#L83) | Clone recipe uses `contextualization-expert/SKILL.md`; naming table says agent file is `discovery-empathy-expert.md` | **Both half-right, and mutually contradictory.** Vortex agents are `<dir>/SKILL.md`; Gyre agents are flat `.md`. The file states one convention and demonstrates the other | `ls -1 _bmad/bme/_vortex/agents/contextualization-expert/` → `SKILL.md`, `references`  ·  `ls -1 _bmad/bme/_gyre/agents/` → 4 flat `.md` files |
| **D4** | [L13](../../docs/development.md#L13) | "**XML-based** agent structure" — stated for *all* agents | False for the v6.3-converted agents | `grep -c '<agent\|```xml' <agent>/SKILL.md` → Emma **0**, Wade **0**, Isla **2**. 3/7 converted (I97 Epic 2), so the blanket claim is wrong either way |
| **D5** | [L9](../../docs/development.md#L9), [L21](../../docs/development.md#L21) | "Agent Architecture Framework (**v1.1.0**)", "Update System (**v1.4.0+**)" | Product is **4.0.2** | `grep -n '"version"' package.json` → `4.0.2` |
| **D6** | [L69-70](../../docs/development.md#L69-L70) | "**39** scenarios", "**18** critical scenarios minimum" | Hardcoded counts with no derivation — `derive-counts-from-source` class | No source cited in the doc; counts not recomputed here (see Not Covered) |
| **D7** | [L96-119](../../docs/development.md#L96-L119) | Project Structure tree lists `_vortex`, `_gyre`, `_enhance` | `_bmad/bme/` holds **8** directories; `_team-factory`, `covenant`, `_artifacts`, `_config`, `_portability` are all absent from the tree | `ls -1d _bmad/bme/*/` → 8 entries |

Severity: **D1, D2, D3 = ACT-FAIL** · **D4 = MISLEAD** · **D5, D6, D7 = ROT**

> **⚠ Evidence basis — read before reproducing D1.** An earlier version of this row cited
> `ls -1d .claude/skills/*team-factory*`. **`.claude/skills/*` is gitignored** (`.gitignore:62`), so
> that directory holds an *installed* artifact, not a shipped one — a documentation check that
> resolves slash commands there is inspecting something no operator receives, and it can report a
> command as present when the package does not ship it. The row now derives from
> `scripts/update/lib/agent-registry.js:219,230`, which is what the installer reads.
>
> **The finding survived the correction; the citation did not.** Caught by pre-mortem on 2026-09-10,
> before any story was built on it. This is `verification-must-be-falsifiable`'s *"prefer a check
> that fires on the real artifact"* — and it is the reason NFR8 exists in the epic. Every other
> finding in this note was already derived from `_bmad/`, `docs/`, `scripts/` or `package.json`;
> D1 was the only wrong-basis citation.

> **D3 is the instructive one.** It is not staleness — it is a file that contradicts itself
> 31 lines apart, and it survived a green gate, two releases, and every reader since the v6.3
> restructure. A doc can be internally inconsistent without any link breaking.

## Findings — `docs/agents.md` (602 lines)

The operator reported the diagram as "misaligned". It is — and there is a semantic defect
underneath the cosmetic one.

All four rows were measured, not eyeballed, with an east-asian-width–aware column counter
(emoji render two columns wide; the borders were authored as though they render one):

| ID | Line | Defect | Measurement |
|----|------|--------|-------------|
| **A1** | [L242](../../docs/agents.md#L242) | **The `HC9` arrow contradicts the contract table.** Its `▼` lands at render column 43 — inside the box spanning cols 38–49, which is **Noah**. [L288](../../docs/agents.md#L288) states HC9 is Liam 💡 → **Isla** 🔍 | `▼` glyph positions on L242 = cols **43**, **64**; L243 box spans = `[2-13] [20-31] [38-49] [56-67]` |
| **A2** | [L243](../../docs/agents.md#L243) | **Four box tops opened, three closed.** The fourth (cols 56–67) has no body and no bottom | L243 = **68** render cols; L246 = **50** render cols |
| **A3** | [L236-239](../../docs/agents.md#L236-L239) | Rows of the *same* box row measure **71 / 72 / 69 / 68** render columns. `│` edges drift up to **3** columns | L237 edges `[2,14,21,33,40,52,59,71]` vs L238 edges `[2,14,21,32,39,50,57,68]` — divergence begins at the 4th edge and grows |
| **A4** | [L249](../../docs/agents.md#L249) | `▼ to Isla 🔍` points **downward** at col 22, while Isla's box is at the **top** of the diagram. The actual delivery is the `▲` at [L240](../../docs/agents.md#L240) col 7. Two contradictory renderings of one route | `▲` on L240 at cols **7**, **26**; `▼` on L249 at col **22** |

Severity: **A1 = ACT-FAIL** (a reader routes to the wrong agent) · **A2, A4 = MISLEAD** · **A3 = ROT**

**Reproducing A1–A4.** The measurement is a render-column counter over `docs/agents.md`
lines 234–250, treating any codepoint with `east_asian_width in (W,F)` or `> 0x1F000` as two
columns. Re-run it after any diagram edit; a correct diagram has equal render-column counts
across all four rows of a box row, and equal `┌`/`└` counts per box row.

**Falsifiability.** Each row above is falsified by the same command returning different
numbers. A2 in particular dies if L243 and L246 ever measure equal — which is what a correct
fix produces, and is the acceptance check Story 1 should assert.

## What is NOT covered

**10 of 12 in-scope files are unexamined.** This note covers `development.md` and `agents.md`
only. The scope ruling of 2026-09-10 puts twelve files in the derivation pass:

| Tier | Files | Lines |
|------|-------|-------|
| Cold (Feb–Apr, survived two releases untouched) | `faq.md`, `testing.md`, `BMAD-METHOD-COMPATIBILITY.md`, `references.md`, `what-convoke-brings-to-bmad-method.md`, `CODE_OF_CONDUCT.md` | 1,836 |
| Mid (Aug 15–26) | `development.md`, `agents.md`, `UPDATE-GUIDE.md`, `host-framework-sync-playbook.md`, `SECURITY.md`, `CREDITS.md` | 1,355 |

**3,191 lines is a scope number, not a findings count.** Eleven findings came from 743 lines
of the mid tier. The cold tier has had two releases to rot and has not been edited through
either; expect its yield per 100 lines to be higher, not lower.

## Explicitly out of scope (ruled 2026-09-10)

| File | Lines | Why |
|------|-------|-----|
| `Convoke-Ecosystem-v0.2-Updated-With-Gyre.md` | 637 | Vision/draft artifact, not published documentation |
| `KORE-Method-v0.1-Draft.md` | 590 | Self-declared draft |
| `lifecycle-expansion-vision.md` | 459 | Vision artifact |
| `lifecycle-expansion-references.md` | 379 | Sibling of the above; same treatment |
| `codebase-audit-2026-06-27.md` | 526 | **Dated historical snapshot.** Holding a record of what was true on 2026-06-27 to present-tense accuracy is the wrong bar — `verification-claims-must-name-their-evidence` exempts prose recording history. Check only that nothing **cites** it as current |
| Warm tier (Sep 4–8): `README`, `INSTALLATION`, `CONTRIBUTING`, `CHANGELOG`, `npm-publishing-access-playbook`, `pre-tag-release-checklist` | — | Written during `dist-epic-2`; low expected yield. `pre-tag-release-checklist.md` re-enters scope as Story 5's **subject** |

The five vision/draft/snapshot files carry a **separate, non-blocking finding**: they sit in
`docs/` alongside published documentation with nothing marking them as drafts. Relocation or
labelling is out of scope for 4.0.2 — file it, do not fix it here.

## Derived-assertion density — the epic's sizing input, measured before the cut

Measured 2026-09-10, **before** Stories 1.4–1.6 were cut. Recorded here rather than produced
inside a story, because a count that arrives after the cut is frozen cannot correct the cut —
which is exactly how the first cut came to be wrong (FR4a).

| File | Lines | Commands | Paths | Counts | Versions | **Assertions** |
|------|------:|---------:|------:|-------:|---------:|---------------:|
| `UPDATE-GUIDE.md` | 262 | 22 | 4 | 5 | 6 | **37** |
| `docs/host-framework-sync-playbook.md` | 227 | 12 | 23 | 1 | 0 | **36** |
| `docs/BMAD-METHOD-COMPATIBILITY.md` | 375 | 5 | 1 | 15 | 9 | **30** |
| `docs/testing.md` | 145 | 11 | 4 | 4 | 3 | **22** |
| `docs/faq.md` | 204 | 6 | 7 | 4 | 3 | **20** |
| `SECURITY.md` | 44 | 3 | 0 | 0 | 0 | **3** |
| `docs/references.md` | 877 | 0 | 0 | 2 | 0 | **2** |
| `docs/what-convoke-brings-to-bmad-method.md` | 107 | 1 | 0 | 0 | 0 | **1** |
| `CREDITS.md` | 79 | 0 | 0 | 0 | 0 | **0** |
| `CODE_OF_CONDUCT.md` | 128 | 0 | 0 | 0 | 0 | **0** |
| | | | | | | **151** |

**Lines and assertions disagree violently, and the disagreement broke the first story cut.**
`docs/references.md` is the longest file in the corpus at 877 lines and carries **2** derived
assertions — a 60× lower density than `UPDATE-GUIDE.md` at 262 lines and 37. The line-sized cut
had paired `references.md` with `BMAD-METHOD-COMPATIBILITY.md` and labelled the pair the epic's
overrun risk (1,252 lines); by assertion count that cluster scored 32, while the cluster labelled
"low yield, cheap" (585 lines) scored 40. **The largest story was the smallest and the cheapest
was nearly the largest.** The story count did not change when this was corrected; the contents did.

**Why `references.md` scores 2, and what follows from it.** It is a bibliography — 73 headings,
64 external URLs, 22 markdown links — whose claims are about academic literature rather than about
this repository. A derivation-against-source pass is the wrong instrument for it. Its two
repository-facing assertions are checked in Story 1.6; its link integrity is filed as a backlog
row (FR9), because resolving 64 external URLs under `external-claims-must-be-executed-or-hedged`
is real work on a different cadence and is not release-gate work.

**Status: provisional.** These counts come from a first-pass pattern set, not the pinned script
FR4a requires. The coarse structure is safe at a 60× gap; the fine ordering — 1.5's 66 against
1.6's 28 — is less so. Story 1.4 re-derives with the pinned script and reports divergence. If it
disagrees materially, the cut is revisited **once**.

## Coverage denominator — REQUIRED, and the thing Story 1.7 actually gates on

No check can decide whether a sentence is true. **Coverage is mechanically checkable, and truth is
not**, so coverage is what the release gate asserts.

This note MUST carry a coverage table, updated by every story that examines a file, in exactly this
shape:

| File | In scope | Assertions | Examined | Story | Findings |
|------|----------|-----------:|----------|-------|----------|
| `docs/development.md` | yes | — | **yes** | 1.1, 1.3 | 7 |
| `docs/agents.md` | yes | — | **yes** | 1.2 | 4 |
| `UPDATE-GUIDE.md` | yes | 37 | no | 1.4 | — |
| `docs/faq.md` | yes | 20 | no | 1.4 | — |
| `docs/host-framework-sync-playbook.md` | yes | 36 | no | 1.5 | — |
| `docs/BMAD-METHOD-COMPATIBILITY.md` | yes | 30 | no | 1.5 | — |
| `docs/testing.md` | yes | 22 | no | 1.6 | — |
| `SECURITY.md` | yes | 3 | no | 1.6 | — |
| `docs/references.md` | yes | 2 | no | 1.6 | — |
| `docs/what-convoke-brings-to-bmad-method.md` | yes | 1 | no | 1.6 | — |
| `CREDITS.md` | yes | 0 | no | 1.6 | — |
| `CODE_OF_CONDUCT.md` | yes | 0 | no | 1.6 | — |

An `Assertions` value of `0` is a measurement, not an exemption: a zero-assertion file is still
examined and still recorded as `0` findings, with the script output as its evidence.

**Why this and not a signature.** A findings artifact that merely *exists* is satisfied by a tired
operator at 11pm, and passes identically whether twelve files were examined or two. The failure it
guards against is not dishonesty — it is Story 1.5 (1,252 lines, the coldest tier) being quietly
dropped under tag pressure while the gate stays green because the artifact is still there. An
`Examined: no` row on an `In scope: yes` file is a **refusal condition**, and it is decidable.

**Findings count is recorded, never targeted.** The column exists so a later reader can see yield per
file, not so a story can be judged by it. A zero is a legitimate result and must be written as `0`,
never left blank — blank means *not examined*, and the two must never be confusable.

## Method for Stories 2–4

Stories 2–4 have no pre-derived findings. The pass is: for each sentence asserting repository
behaviour, name the file that determines it and read it (`documentation-claims-must-be-derived`,
Operational check). Conventions from `git log`, gates from `.github/workflows/`, thresholds from
their config file, rules from `project-context.md`. Counts get recomputed, never copied
(`derive-counts-from-source`). Paths get globbed (`spec-verify-referenced-files`).

Record findings in this note's table format — **ID, line, claim, reality, evidence command** —
so each is independently re-runnable. A finding without a command does not enter the table.
