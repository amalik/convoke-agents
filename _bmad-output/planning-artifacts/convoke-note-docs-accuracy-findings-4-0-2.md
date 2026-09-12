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


> ## ⚠ Derived figures and line anchors in this document are FROZEN and unverified — 2026-09-11
>
> **Do not trust, cite, or hand-correct any count or `#L<n>` anchor below this banner.** Two review
> rounds on Story 1.1 established that hand-maintained derived values in this note fail the same way
> every time: a value gets corrected in one place and stales in the two others derived from it, and a
> line anchor gets repaired by search-and-place without re-deriving whether the finding it points at
> still holds. Round 2 found `12`-file assertions standing beside a 13-row table, `1,355` and `3,191`
> stale by the same 8 lines that `743 → 751` corrected, and D3's anchor repointed onto the very text
> that resolves D3 — a finding now false against its own citation.
>
> This is `derive-counts-from-source` failing inside the document that governs it. Per
> `code-review-convergence` ("change the instrument, not patch again" — two failed attempts predict a
> third), **further hand-patching of these values is suspended.** The replacement is already specified
> by this epic's Tooling line (FR8/FR10): a `docs-audit.js` extension deriving the in-scope column and
> its line counts from the filesystem, plus **content-addressed citations** — section anchor and the
> quoted claim text — so a finding row cannot silently outlive the line it describes.
>
> Until Story 1.7 lands that: treat every number here as *indicative of the finding, not of the
> figure*, and re-derive from the tree before acting on any of them. The findings themselves were each
> verified by execution and stand; only their arithmetic and their anchors are suspect.
>
> **CARVE-OUT — a story recording its OWN findings is not covered by this freeze.** The freeze exists
> to stop derived figures being hand-corrected into staleness *by a story that does not own them*. It
> must not stop a story doing its job: when a derivation pass finds N findings in the file it owns, it
> **must** write N and set `Examined: yes` (FR10), and it should re-derive that file's line count while
> it is there. What remains frozen is everything the story does **not** own — the tier totals, the
> aggregate findings count, the scope-wide line figures, and every `#L<n>` anchor into a file the story
> is not editing. Rule of thumb: **derive and write your own row; do not hand-fix anyone else's.**


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
(`scripts/docs-audit.js:59-457`). All thirteen findings below survive it, because none of them
is a shape defect. This is `documentation-claims-must-be-derived` stated as a measurement:
*nothing in this repository has an opinion about whether a sentence is true.*

**Consequence for the release gate.** [`docs/pre-tag-release-checklist.md`](../../docs/pre-tag-release-checklist.md)
§3 asserts every CI job green, and `docs:audit` is one of those jobs. So the release path as
it stands **cannot refuse a tag over documentation content**, and no gate can be built that
does. The only enforceable form is a recorded derivation pass — a checklist step asserting a
signed findings artifact exists for the release SHA. That is Story 5's subject.

## Findings — `docs/development.md` (153 lines)

Severity key: **ACT-FAIL** = a reader follows the doc and the action fails · **MISLEAD** = the
reader forms a false belief but nothing breaks · **ROT** = stale marker, no reader impact.

| ID | Line | Claim as written | Reality | Evidence |
|----|------|------------------|---------|----------|
| **D1** | [L75](../../docs/development.md#L75) | Use `/bmad-team-factory` | Installed skill is `bmad-agent-bme-team-factory`; the command as written does not exist | `sed -n '219p;230p' scripts/update/lib/agent-registry.js` → `id: kebab-case identifier (becomes bmad-agent-bme-{id})` + `id: 'team-factory'` |
| **D2** | [L77](../../docs/development.md#L77) | "Three capabilities: **Create Team**, **Add Agent**, **Add Skill**" | Only Create Team shipped | `ls -1 _bmad/bme/_team-factory/workflows/` → `add-team`, `step-00-route.md`. Matches P25 (unshipped Phase 3, TF-FR25/26) |
| **D3** | [L52](../../docs/development.md#L52) vs [L88](../../docs/development.md#L88) | Clone recipe uses `contextualization-expert/SKILL.md`; naming table says agent file is `discovery-empathy-expert.md` | **Both half-right, and mutually contradictory.** Vortex agents are `<dir>/SKILL.md`; Gyre agents are flat `.md`. The file states one convention and demonstrates the other | `ls -1 _bmad/bme/_vortex/agents/contextualization-expert/` → `SKILL.md`, `references`  ·  `ls -1 _bmad/bme/_gyre/agents/` → 4 flat `.md` files |
| **D4** | [L13](../../docs/development.md#L13) | "**XML-based** agent structure" — stated for *all* agents | False for the v6.3-converted agents | `grep -c '<agent\|```xml' <agent>/SKILL.md` → Emma **0**, Wade **0**, Isla **2**. 3/7 converted (I97 Epic 2), so the blanket claim is wrong either way |
| **D5** | [L9](../../docs/development.md#L9), [L21](../../docs/development.md#L21) | "Agent Architecture Framework (**v1.1.0**)", "Update System (**v1.4.0+**)" | Product is **4.0.2** | `grep -n '"version"' package.json` → `4.0.2` |
| **D6** | [L69-70](../../docs/development.md#L69-L70) | "**39** scenarios", "**18** critical scenarios minimum" | Hardcoded counts with no derivation — `derive-counts-from-source` class | No source cited in the doc; counts not recomputed here (see Not Covered) |
| **D7** | [L102-127](../../docs/development.md#L102-L127) | Project Structure tree lists `_vortex`, `_gyre`, `_enhance` | `_bmad/bme/` holds **8** directories; `_team-factory`, `covenant`, `_artifacts`, `_config`, `_portability` are all absent from the tree | `ls -1d _bmad/bme/*/` → 8 entries |
| **D8** | [L90](../../docs/development.md#L90) | "Frontmatter name — Spaces, lowercase — `"discovery empathy expert"`", stated as universal | True for **Gyre only** (`"stack detective"`). Vortex is two-way: converted agents use `bmad-bme-agent-emma`, unconverted use `discovery-empathy-expert` | `grep -m1 '^name:' _bmad/bme/_vortex/agents/{contextualization-expert,discovery-empathy-expert}/SKILL.md _bmad/bme/_gyre/agents/stack-detective.md` |
| **D9** | [L91](../../docs/development.md#L91) | "Display name — First name — `name="Isla"`", stated as universal | The `name="…"` XML attribute exists only in **unconverted** agents. Converted agents carry the display name as an `# Emma` heading — `grep -n 'name="' …/contextualization-expert/SKILL.md` returns nothing | `grep -nE 'name="|^# ' _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md` → `6:# Emma` |


### `docs/agents.md` — findings added by Story 1.2

| ID | Where | Defect | Evidence |
|---|---|---|---|
| **A5** | diagram fence, pre-conversion | **HC9 was drawn from Liam into Noah while the contract table reads Liam → Isla** — in all three files. Readable directly from the pre-conversion art: `git show 2c372285^:docs/agents.md \| sed -n '241,244p'` shows `HC9│` descending at col 41 into the third box of the row, which is Noah. **RETRACTED at Round 1 review:** this row previously claimed the art was "undecidable for 4 of 10 contracts". That figure came from a path-walker with two known defects (it bound labels within ±2 render columns and did not traverse `└`/`┴` corners), it was never separated from the tool's own blind spots, and the ASCII has since been deleted — so the claim is **unfalsifiable and is withdrawn**. What survives is the HC9 mis-routing, which is checkable by eye in git history. | `git show 2c372285^:docs/agents.md \| sed -n '236,250p'` |
| **A6** | `L357` (pre-conversion) | `/bmad-bmb-agent` and `/bmad-bmb-module` resolve to nothing — 0 rows each in `skill-manifest.csv`; the shipped ids are `bmad-agent-builder` (`:68`) and `bmad-module-builder` (`:71`) | `for c in $(grep -oE '/bmad-[a-z0-9-]+' docs/agents.md \| sort -u); do grep -q "^\"${c#/}\"," _bmad/_config/skill-manifest.csv \|\| echo "UNRESOLVED: $c"; done` |

### `_bmad/bme/_vortex/` — findings added by Story 1.2 (both files SHIP)

The same diagram, the same three defects, in the two files operators actually receive. `docs/agents.md` — the only file the epic scoped — is the only one that does **not** ship.

| ID | Where | Defect | Evidence |
|---|---|---|---|
| **A7** | `VORTEX-TEAM-GUIDE.md` fence, `compass-routing-reference.md` fence | HC9 drawn into Noah against the table; 4 box tops opened and 3 closed; `▼ to Isla` contradicting the `▲` above Emma. **Identical defects to A1/A2/A4, in shipped files.** | `git show 2c372285^:_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md \| sed -n '78,95p'` (and `compass-routing-reference.md \| sed -n '19,36p'`) — the ASCII as it stood, showing `HC9│` descending into the third box of the row |
| **A8** | `compass-routing-reference.md` header box | Its second line is one render column short of its three siblings (71 / **70** / 71 / 71) — a defect unique to this file; `VORTEX-TEAM-GUIDE.md`'s equivalent box is clean at 71/71/71/71 | same command |

**Not findings, recorded so they are not re-reported:**

- **The Gyre diagram** (`docs/agents.md` L422-426) is **correct**. Its 61/60/60 spread is Coach's two-column emoji `🏋️`, not a misalignment: `▲` at col 21 sits under Atlas, `│`/`┘` at col 59 under the emoji's first column. It contains **no box row**, so a box-row invariant is a category error there. It carries no `HC` label, so the permanent guard leaves it alone **by construction**.
- **The decision tree** in `compass-routing-reference.md` names HC6 and HC8 as conditionals and draws itself with `├── └──`. It is not a flow diagram. The check's threshold — a majority of declared contracts — excludes it by construction rather than by an exception list.
- **One further copy** of the diagram exists, at `_bmad-output/_archive/phase-1/5-3-update-documentation-for-complete-7-agent-vortex.md:173-196`. A closed story artifact that does not ship; a **declared exclusion**, not an oversight. **Corrected at Round 1:** this previously read "a fourth and fifth copy". Un-excluding the archive returned four hits, but only one is a diagram — the other three are a one-line text flow, a YAML frontmatter example and a document outline that merely name contract ids. The sweep now requires a fence to actually *draw* (box art or a `flowchart`/`graph` declaration), so those three no longer match.


### D4-D9 closed by Story 1.3 — 2026-09-12

| Finding | Disposition | Why |
|---|---|---|
| **D4** | **Qualified**, not deleted | The agent files can contradict it. Under D4's own published unit, 3 Vortex agents (Emma, Wade, Mila) measure 0 and the other 9 measure 2; `name-registry.csv` records the per-agent state. The blanket claim is now a mid-migration statement naming its source. |
| **D5** `(v1.1.0)` | **KEPT and checked** | An owner exists: the framework specification `docs/development.md:19` links to declares `version: 1.1.0`. FR3a says keep-and-check what something can contradict. **The epic's AC assumed none existed — that assumption was wrong.** |
| **D5** `(v1.4.0+)` | **Deleted** | Nothing in `scripts/update/` carries the value; the `v1.4.0` tag and CHANGELOG entry version the **package**, not the Update System concept. Nothing could tell you what to refresh it to. |
| **D6** | **Deleted**, instruction retained | Every document carrying the figures has either no `status:` frontmatter or one describing a *run* (`READY FOR EXECUTION`). Under the 2026-09-12 archive ruling, none is an owner. The P0 suite is now named as the authority instead. |
| **D7** | **Shape, not inventory** | All **four** enumerating nodes in the fence were incomplete, not just `_bmad/bme/` — `_bmad-output/` showed 2 of 14. Each now shows representative children and is marked non-exhaustive, so adding, renaming or removing a directory does not falsify it. The registry-derived agent/workflow annotations were **preserved** and re-proven machine-checked by mutation. |
| **D8 / D9** | **Resolved to their real forms** | Frontmatter name has three forms (`bmad-bme-agent-*`, unquoted role name, quoted spaced name). Display name exists only in v5 agents and is **not always a first name** — `name="Loom Master"`. The caveat Story 1.1 left pointing at 1.3 is removed; it had become a stale claim about a resolved finding. |

**Two claims in `docs/agents.md` were handed to the existing checker instead of being guarded by prose.**
`:403` and `:413` said "all seven" with no noun, which `docs-audit.js`'s pattern requires — so neither was
matched by anything. Reworded to "all seven agents"; coverage proven by mutation (`seven`→`eight` produces a
`stale-reference` finding at `L403`, reverted). This is FR3a's *extend the checker that already exists*, at the
cost of one word.

> **The coverage count for `docs/agents.md` is deliberately NOT bumped.** That row is owned by Story 1.2, and
> the freeze banner's carve-out says "derive and write your own row; do not hand-fix anyone else's." Story 1.3
> edited two prose claims in that file; it did not perform its derivation pass. Recording the change here
> rather than editing 1.2's row.

**Same class, still live, routed not fixed:** `docs/faq.md:40` ("all seven **Vortex** agents", Story 1.4) and
`docs/BMAD-METHOD-COMPATIBILITY.md:197` ("All 7 **Vortex** agent files", Story 1.5). Both evade the checker the
same way — **a word between the number and the noun defeats its adjacency requirement**, which is worth knowing
before anyone trusts a green `docs:audit` on a count.

Severity: **D1, D2, D3 = ACT-FAIL** · **D4, D8, D9 = MISLEAD** · **D5, D6, D7 = ROT**

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

## Findings — `docs/agents.md` (607 lines)

The operator reported the diagram as "misaligned". It is — and there is a semantic defect
underneath the cosmetic one.

All four rows were measured, not eyeballed, with an east-asian-width–aware column counter
(emoji render two columns wide; the borders were authored as though they render one):

| ID | Line | Defect | Measurement |
|----|------|--------|-------------|
| **A1** | [diagram fence](../../docs/agents.md#L233-L255) | **The `HC9` arrow contradicts the contract table.** Its `▼` lands at render column 43 — inside the box spanning cols 38–49, which is **Noah**. [L293](../../docs/agents.md#L293) states HC9 is Liam 💡 → **Isla** 🔍 | `▼` glyph positions on L242 = cols **43**, **64**; L243 box spans = `[2-13] [20-31] [38-49] [56-67]`  **CLOSED by docs-1-2** — the ASCII art these cite no longer exists; the diagram is mermaid at `L233-255`. Anchors re-derived after the conversion, not before. |
| **A2** | [diagram fence](../../docs/agents.md#L233-L255) | **Four box tops opened, three closed.** The fourth (cols 56–67) has no body and no bottom | L243 = **68** render cols; L246 = **50** render cols  **CLOSED by docs-1-2** — the ASCII art these cite no longer exists; the diagram is mermaid at `L233-255`. Anchors re-derived after the conversion, not before. |
| **A3** | [diagram fence](../../docs/agents.md#L233-L255) | Rows of the *same* box row measure **71 / 72 / 69 / 68** render columns. `│` edges drift up to **3** columns | L237 edges `[2,14,21,33,40,52,59,71]` vs L238 edges `[2,14,21,32,39,50,57,68]` — divergence begins at the 4th edge and grows  **CLOSED by docs-1-2** — the ASCII art these cite no longer exists; the diagram is mermaid at `L233-255`. Anchors re-derived after the conversion, not before. |
| **A4** | [diagram fence](../../docs/agents.md#L233-L255) | `▼ to Isla 🔍` points **downward** at col 22, while Isla's box is at the **top** of the diagram. The actual delivery was the `▲` at col 7 in the row above Emma (`git show 2c372285^:docs/agents.md | sed -n '240p'`). Two contradictory renderings of one route | `▲` on L240 at cols **7**, **26**; `▼` on L249 at col **22**  **CLOSED by docs-1-2** — the ASCII art these cite no longer exists; the diagram is mermaid at `L233-255`. Anchors re-derived after the conversion, not before. |

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

**3,191 lines is a scope number, not a findings count.** Thirteen findings came from 751 lines
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
| Warm tier (Sep 4–8): `INSTALLATION`, `CONTRIBUTING`, `npm-publishing-access-playbook`, `pre-tag-release-checklist` | — | Written during `dist-epic-2`; low expected yield. `pre-tag-release-checklist.md` re-enters scope as Story 5's **subject**. **`README.md` left this tier on 2026-09-11** — it carried a live D2 claim, and the exclusion had been tested against slash *commands* only, never against capability *claims*. **`CHANGELOG.md` did NOT** — Round 2 referred it to an operator ruling instead; `scripts/docs-audit.js:541-542` already exempts it as a historical record |

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
| `docs/development.md` | yes | — | **yes** | 1.1, 1.3 | 9 |
| `docs/agents.md` | yes | — | **yes** | 1.2 | 6 |
| `_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md` | yes | — | **yes** | 1.2 | 1 |
| `_bmad/bme/_vortex/compass-routing-reference.md` | yes | — | **yes** | 1.2 | 2 |
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
| `README.md` | yes | — | no | 1.6 | — |

**Cross-file closures made by Story 1.1 — these files are NOT examined.** D1 and D2 each appeared in more
files than the one the epic anchored them to. Story 1.1 *edited* `docs/faq.md`, `UPDATE-GUIDE.md` and
`README.md` without performing their derivation passes. Those files keep `Examined: no`; Stories 1.4 and 1.6
still own them.

> **Corrected by Round 1 review, 2026-09-11.** This section previously read "closed both classes everywhere
> they appeared" and instructed Stories 1.4 and 1.6 **not** to re-report D1 or D2. That was false and it
> disarmed the stories that would have caught it. AC2's grep required a *space* between verb and noun
> (`add (an )?agent`); the corpus form is *hyphenated* (`add-agent`), so the check ran green over live
> defects — including `UPDATE-GUIDE.md:70`, three lines above the sentence the story corrected, in the file
> Story 1.4 owns. Re-deriving the pattern from the corpus found **five** D2 instances, not three. Do not
> treat a closure claim in this note as covering a class unless the enumerating pattern is recorded beside it.

- D1 (`/bmad-team-factory`) closed at `docs/development.md:75`, `docs/faq.md:200`, `UPDATE-GUIDE.md:83`.
  **Class not closed:** `/bmad-bmb-agent`, `/bmad-bmb-module` and `/bmad-bmb-workflow` are the same
  ACT-FAIL class. **Closed in `docs/agents.md` by Story 1.2 (finding A6).** Still live at `docs/faq.md:131-135` — deferred, see
  `deferred-work.md`. Stories 1.4 and 1.2 own them.
- D2 (unshipped Add Agent / Add Skill) is closed at **5 locations across 4 files**, verified at HEAD:
  `docs/development.md:79`, `README.md:100`, `UPDATE-GUIDE.md:70`, `UPDATE-GUIDE.md:73`,
  `docs/BMAD-METHOD-COMPATIBILITY.md:105`.
  **Class closure completed 2026-09-11 (post-Round-2), 3 further locations:** `CREDITS.md:36`
  (which *ships* — `package.json` `files[]`), `docs/BMAD-METHOD-COMPATIBILITY.md:162` and
  `UPDATE-GUIDE.md:75`. The latter two were **intra-file contradictions this story created** — it
  fixed `:105` and `:73` and left their contradicting siblings two rows away. All three are
  *narrowings*, matching the precedent already set at `UPDATE-GUIDE.md:73`: the appenders and
  `validateSkillExtension()`/`buildSkillExtensionManifest()` genuinely shipped; the workflows that
  would produce what they validate did not.
  **Total: 8 locations across 6 files.** Remaining open, out of scope pending the CHANGELOG ruling:
  `CHANGELOG.md:217`, `:271`, `:273`.
  **`CREDITS.md` and `docs/BMAD-METHOD-COMPATIBILITY.md` keep `Examined: no`** — they were edited for
  this one defect, not derived. Stories 1.6 and 1.5 still own their passes.
  **Note for Story 1.6 (do not patch — figures are frozen):** `CREDITS.md`'s `Assertions` cell reads
  `0`. It is not 0; `:36` alone carried one. The cell is wrong and is left wrong deliberately, per the
  banner at the top of this document.
  **No pattern is recorded here as authoritative.** Two have now failed in succession: the
  space-separated original (blind to hyphens) and its high-recall replacement (blind to a hardcoded
  file list, and to claims phrased without the word "add"). Enumerating this class is referred to
  Story 1.7's tooling, not to a third grep.

**`README.md` was out of scope and had to be edited anyway.** It advertised a capability
`_bmad/bme/_team-factory/workflows/step-00-route.md:42` explicitly refuses to run, in the highest-traffic
document in the repository. The warm-tier exclusion was tested during the pre-mortem by resolving slash
*commands*; it never tested capability *claims*. That is a gap in the test, not bad luck — a warm-tier file
carried an ACT-FAIL defect.

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
