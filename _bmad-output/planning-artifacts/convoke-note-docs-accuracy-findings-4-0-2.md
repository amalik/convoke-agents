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
| **D5** | the two version markers in `docs/development.md` (Agent Architecture Framework, Update System) | "Agent Architecture Framework (**v1.1.0**)", "Update System (**v1.4.0+**)" | Product is **4.0.2** | `grep -n '"version"' package.json` → `4.0.2` |
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

| Finding | Disposition | Why | Command |
|---|---|---|---|
| **D4** | **Qualified**, not deleted | The agent files can contradict it. Under D4's own published unit, 3 Vortex agents (Emma, Wade, Mila) measure 0 and the other 9 measure 2; `name-registry.csv` records the per-agent state. | `find _bmad/bme -path '*agents*' -name '*.md' \| grep -v '/references/'` then D4's unit (row above) on each |
| **D5** `(v1.1.0)` | **KEPT and checked** | An owner exists: the framework specification the section links to declares `version: 1.1.0`. **The epic's AC assumed none existed — wrong.** A second archived file also declares 1.1.0 but carries `status: CORRECTED`, which the archive ruling classifies as a record, not a specification — so ownership is **not** ambiguous. | `grep -rl '^version: 1.1.0' _bmad-output/` then `grep -m1 '^status:' <each>` |
| **D5** `(v1.4.0+)` | **KEPT and checked** — *reversed at Round 1* | First deleted on the basis that `grep -rn '1.4.0' scripts/update/` is empty. **Wrong basis: source files do not carry the version they shipped in.** `CHANGELOG.md` records this version and the update system's introduction; it is owned, and deleting it violated AC7. Restored. **The specific owning entry is deliberately not named here** — two attempts to name it were wrong, the second attributing `## [1.3.0]`'s content to `## [1.4.0]`. Run the command. | `grep -n '1\.4\.0' CHANGELOG.md` and read the enclosing `## [` heading |
| **D6** | **Deleted**, instruction retained | No document carrying either figure is a specification — run the command and check `status:` on each; none carries a specification status, so under the archive ruling none is an owner. The P0 suite is named as the authority instead. **No count is given here on purpose:** this row has carried two different wrong ones. | `grep -rlE '39 scenario\|18 critical' --include='*.md' .` then `grep -m1 '^status:' <each>` |
| **D7** | **Shape, not inventory** | **Five** enumerating nodes were incomplete, not just `_bmad/bme/` — the root `Convoke/` node too, which the first pass missed. `_bmad-output/` showed 2 of 14. Each now shows representative children and is marked non-exhaustive, so adding a directory does not falsify it; renaming or removing a named exemplar would, which is the stated cost. The registry-derived agent/workflow annotations were **preserved** and re-proven machine-checked by mutation. | `ls -1d _bmad/bme/*/ _bmad-output/*/ scripts/*/ tests/*/` vs the fence; annotations re-proven by mutating a count and re-running `npm run docs:audit` |
| **D8 / D9** | **Resolved to their real forms** | Frontmatter name has three forms (`bmad-bme-agent-*`, unquoted role name, quoted spaced name). Display name exists only in v5 agents and is **not always a first name** — `name="Loom Master"`. The caveat Story 1.1 left pointing at 1.3 is removed; it had become a stale claim about a resolved finding. | `grep -m1 '^name:' <each agent file>` and `grep -o 'name="[^"]*"' <each>` |

### `docs/agents.md` — findings added by Story 1.3

| ID | Where | Defect | Command |
|---|---|---|---|
| **A9** | `docs/agents.md:403` | "you don't need all seven" — a count with **no noun**, so `docs-audit.js`'s pattern (which requires the number adjacent to `agents`) never matched it. Unchecked by anything. | `node -e "const{checkStaleReferences}=require('./scripts/docs-audit.js')"` on the line before and after the edit; or mutate `seven`→`eight` and run `npm run docs:audit` |
| **A10** | `docs/agents.md:413` | "Use all seven together" — same defect, same file | same |

**Two claims in `docs/agents.md` were handed to the existing checker instead of being guarded by prose.**
`:403` and `:413` said "all seven" with no noun, which `docs-audit.js`'s pattern requires — so neither was
matched by anything. Reworded to "all seven agents"; coverage proven by mutation (`seven`→`eight` produces a
`stale-reference` finding at `L403`, reverted). This is FR3a's *extend the checker that already exists*, at the
cost of one word.

> **The coverage row for `docs/agents.md` now reads `1.2, 1.3`.** Story 1.3 examined that file and found two
> findings in it (`A9`, `A10`), so FR10 requires the row to reflect them. An earlier pass argued the freeze
> carve-out forbade touching another story's row — the weaker reading, and it would have left a known-wrong
> number with no owner, since Story 1.2 is `done`.

**Same class, still live, routed not fixed.** These evade the checker the same way — **a word between the
number and the noun defeats its adjacency requirement**, which is worth knowing before anyone trusts a green
`docs:audit` on a count.

**No list is given here.** Four successive attempts at "here are all the instances" were each short; the fourth
was written in the commit that corrected the third. Find them instead:

```
grep -rnoE '\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[0-9]+) +[A-Za-z*-]+ +agents?\b' \
  README.md INSTALLATION.md UPDATE-GUIDE.md docs/*.md
```

Each hit belongs to whichever story owns its file. **`README.md:98` is worth seeing before you trust any of
them:** "all 12 Convoke agents" is **true**, and passes only because "Convoke" sits between the number and the
noun. Remove that word and a correct sentence is reported stale — because `validAgentCounts` is built from the
Vortex and Gyre arrays and `team-factory` is in neither. Twelve files, eleven registry agents; filed as the
registry-gap row in the backlog.

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
| `docs/agents.md` | yes | — | **yes** | 1.2, 1.3 | 8 |
| `_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md` | yes | — | **yes** | 1.2 | 1 |
| `_bmad/bme/_vortex/compass-routing-reference.md` | yes | — | **yes** | 1.2 | 2 |
| `UPDATE-GUIDE.md` | yes | 91 | **yes** | 1.4 | 0 |
| `docs/faq.md` | yes | 37 | **yes** | 1.4 | 4 |
| `docs/host-framework-sync-playbook.md` | yes | 36 | no | 1.5 | — |
| `docs/BMAD-METHOD-COMPATIBILITY.md` | yes | 30 | no | 1.5 | — |
| `docs/testing.md` | yes | 22 | no | 1.6 | — |
| `SECURITY.md` | yes | 3 | no | 1.6 | — |
| `docs/references.md` | yes | 2 | no | 1.6 | — |
| `docs/what-convoke-brings-to-bmad-method.md` | yes | 1 | no | 1.6 | — |
| `CREDITS.md` | yes | 0 | no | 1.6 | — |
| `CODE_OF_CONDUCT.md` | yes | 0 | no | 1.6 | — |
| `README.md` | yes | — | no | 1.6 | — |

### ⚠ The counter reports a FLOOR, and these are the classes it misses

Two review rounds found **nine** classes the pinned pattern set does not see — four at Round 1, five
more at Round 2 *after* Round 1's fixes. `code-review-convergence` says two failed attempts at the same
fix predict a third, so the claim was narrowed rather than the patterns widened again. **Every figure
below is a lower bound.** The missing classes are listed here so Stories 1.5 and 1.6 inherit a known
gap instead of a false census, and are filed as backlog row **`T160`**, which owns the decision about whether to close any of them.

| Missing class | Example | Effect |
|---|---|---|
| **Elided-noun counts** | `UPDATE-GUIDE.md:109` — *"All 11 agents installed (7 Vortex + 4 Gyre)"* carries **three** repository numbers; one is seen | undercount, and `docs:audit` cannot fail on the other two either |
| **Two-part versions** (`2.x`, `v6.3`) | `UPDATE-GUIDE.md:11`; `docs/host-framework-sync-playbook.md` reports **0** versions for a document about version alignment | large undercount in Story 1.5 |
| **Counted nouns outside the list** | `tests`, `assertions`, `jobs`, `scripts`, `Operator Rights` | undercount across 1.5 and 1.6 |
| **Path extensions outside the list** | `.prettierrc`, `.svg`, `.xsd`, `Makefile` | none in today's corpus; latent |
| **Directory-diagram nodes** | `docs/BMAD-METHOD-COMPATIBILITY.md:70-90` — 21 paths suppressed as decoration while the same block's 6 counts are kept | deliberate, but inconsistent, and unauthorised by AC1 |
| **Line-local box-drawing suppression** | a prose line quoting `` `├──` `` loses its real paths | false suppression; fires in this epic's own artifacts |
| **Duplicate link text/target** | `[`a/b.md`](a/b.md)` counted twice | over-count |
| **Globs and templates** | `scripts/audit/pf1-*`, `backup-{version}-{timestamp}/` captured truncated | over-count of a non-path |
| **Filenames in prose read as invocations** | `docs/BMAD-METHOD-COMPATIBILITY.md:275` — `convoke-update.js (92.91% coverage)` becomes a command | over-count |

**The over- and under-counts do not cancel, and no claim is made that they do.** They are listed
together because both bound the same figure's trustworthiness.

**Why hand-derivation did not catch the first of these.** `UPDATE-GUIDE.md:109` sits inside Window A,
the window Story 1.4's own record reports as an exact match. The hand pass and the script shared a
blind spot because the same person wrote both, holding the same mental model of what a count is. AC2
chose hand-derivation over re-running precisely to get independence, and got less than it expected:
**the method is only as independent as the two derivations' assumptions are.** A future window should
be enumerated by someone who has not seen the pattern set.

### Story 1.4 output: findings per derived assertion, and the projection (AC4, AC5)

**Findings per derived assertion — the named output this story owes, with all three figures AC5 asks
for.** Round 1 changed every number here: two undercount classes were fixed in the instrument and `D14`
was retracted, so both the numerator and the denominator moved.

| Figure | Value | How to re-derive |
|---|---|---|
| assertions examined (1.4) | **128** | `node scripts/audit/derived-assertions.js UPDATE-GUIDE.md docs/faq.md` |
| findings | **4** (`D10`-`D13`) | the findings table above |
| **measured rate** | **0.0313 findings/assertion** | 4 ÷ 128 |
| remaining load, Story 1.5 | **117** | the projection command below |
| remaining load, Story 1.6 | **105** (includes `README.md`) | same command |
| **projected findings** | **≈ 6.9** | 222 × 0.0313 |

**The blend hides the only interesting fact.** One examined file returned no findings at all and the
other returned all of them, so the average describes neither. Both per-file rates are in the table
above; a reader sizing 1.5 or 1.6 should use the pair, not the blend.

**Remaining load, measured rather than inherited.** AC5 permits counting files this story may not edit —
counting is not examining. Figures above; the command that produces them is
`node scripts/audit/derived-assertions.js docs/host-framework-sync-playbook.md docs/BMAD-METHOD-COMPATIBILITY.md docs/testing.md SECURITY.md docs/references.md docs/what-convoke-brings-to-bmad-method.md CREDITS.md CODE_OF_CONDUCT.md README.md`
and sum the `Story` groupings in the coverage table above. **`README.md` IS included**, so this
projection is a whole-corpus figure and not a floor — the gap AC5 requires stating does not apply.

**The unexamined files also measure differently from their pre-story estimates, and no characterisation
of the spread is offered here.** Two attempts were made — "by a similar factor", then a stated range —
and both were wrong; the second understated its own upper bound by a third and asserted "every file"
while naming a counterexample in the same sentence. A third attempt would be the same mistake. The
per-file ratios are computable from the table below and the script, and are left to the reader. The `Assertions` column above is untouched for unexamined files, so both methods
sit side by side and anyone can compute the per-file ratios rather than take a characterisation on
trust.

**The scope call is the operator's, and this story does not make it.** "Before the tag" is named as the
threshold in the epic and defined nowhere in it — no date, no session budget, no rate — so there is a
numerator and a denominator and nothing to compare them against. A story that declared "it fits" would
be guessing in the operator's name. The figures are above; the decision is recorded wherever the
operator makes it.

### Story 1.4 findings — `docs/faq.md`, `UPDATE-GUIDE.md`

*(No count in this heading. It said "(5)" against four live rows after `D14` was retracted — a figure in a heading is one more thing to go stale. The rows below are the findings.)*

Every assertion in both files was dispositioned; the ones that HOLD are marked checked below rather
than left silent, because a silent assertion is indistinguishable from an unexamined one.

| ID | Line | Claim | Reality | Reproduce |
|----|------|-------|---------|-----------|
| **D10** | `docs/faq.md:131` | `/bmad-bmb-agent` | No such skill. Real id is `bmad-agent-builder` | `cut -d, -f1 _bmad/_config/skill-manifest.csv \| grep -c '"bmad-bmb-agent"'` → `0` |
| **D11** | `docs/faq.md:132` | `/bmad-bmb-module` | Real id is `bmad-module-builder` | same command, substituting the id |
| **D12** | `docs/faq.md:133` | `/bmad-bmb-workflow` | Real id is `bmad-workflow-builder` | same command, substituting the id |
| **D13** | `docs/faq.md:135` | `/bmad-bmb-agent` again, in the Quick start line | Same defect, fourth site | `grep -c '/bmad-bmb-' docs/faq.md` |
| ~~**D14**~~ | `docs/faq.md:84` | *(withdrawn)* | **RETRACTED at Round 1 — the finding was false and its remedy made the document worse.** The file was **renamed, not deleted**: `89f0ffb0` records `R100` to `vision-original-readme.md`, and `9ea6a860` renamed it again to `convoke-vision-original-readme.md`, where it is today. The pointer was stale; the claim was OWNED. The first pass deleted the sentence, which is an AC8 violation — the correct remedy was repointing the path, and that is what now ships. | `git show --name-status -M 89f0ffb0 \| grep -i vision` → `R100`, **not** `D` |

**D10-D13 are one class, and the prefix is not uniformly wrong.** `bmad-bmb-setup` *does* exist, so a
blanket `bmad-bmb-*` → something rewrite would have broken a correct id. Each was derived from
`_bmad/_config/skill-manifest.csv` — the shipped manifest, never `.claude/skills/`, which is gitignored
(NFR8). Falsified after the fix: every `/bmad-*` token in `docs/faq.md` now resolves to exactly one
manifest row.

**Why D14 was wrong, recorded because the cause is a rule this story's own Dev Notes name.** The basis
was `git log --diff-filter=D`, run **without `-M`**, so a 100%-similarity rename reported as a deletion.
That is *"an empty search licenses only 'not in the scope I searched'"* — cited in this story's Dev Notes
as a lesson from `docs-1-1`, and committed anyway, one story later. **Any claim that a file is gone must
be derived with rename detection on**: `git log --diff-filter=D -M --follow -- <path>`.

#### Assertions checked and HOLDING

**No per-kind figures or line anchors are reproduced in this section, and that is the third attempt at
it.** The first two carried hand-maintained totals that went stale the moment Round 1 changed the
instrument — the table summed to the pre-Round-1 total while the coverage table said otherwise — and six
line anchors off by exactly two, frozen at a state the file never shipped in. Both are the same defect:
a derived value written into an artifact whose reader re-derives it. **Regenerate, do not read:**

```
node scripts/audit/derived-assertions.js UPDATE-GUIDE.md docs/faq.md --json
```

What was checked, as classes with the command that reproduces each:

| Class | Verdict | Reproduce |
|---|---|---|
| every `convoke-*` token in both files | all are shipped binaries | compare the `command` rows of the `--json` output against `Object.keys(require('./package.json').bin)` |
| every path in `UPDATE-GUIDE.md` | the ones that do not resolve are runtime-created (`.backups/`, `.logs/`, `.migration-lock`), plus two verified by hand — `:97 .claude/commands/` is a **historical** migration source (and `.claude/` is gitignored, so absence proves nothing — NFR8), and a per-team `guides/` directory exists | `fs.existsSync` over the `path` rows; `ls -d _bmad/bme/*/guides/` |
| every path in `docs/faq.md` | all resolve, or are filenames whose directory is named in the same passage (`.gyre/` under its own heading, the contracts dir on the same line, "the agent registry") | same, plus read the naming line |
| every version in `UPDATE-GUIDE.md` | migration boundaries, not claims about the current release | `grep -n '^### From' UPDATE-GUIDE.md` — this covers the `### From` headings only; `:97`'s inline `(v2.2.0)` was checked separately |
| every version in `docs/faq.md` | historical release references | `grep -n '^## \[' CHANGELOG.md` — `1.1.0` and `1.5.0` have headings; `1.0.x` and `1.6.x` are **ranges**, which no single heading matches, and were read against the range they name |
| every count in both files | verified against the registry and the contract directories | `node -e "const r=require('./scripts/update/lib/agent-registry');console.log(r.AGENTS.length,r.GYRE_AGENTS.length,r.WORKFLOWS.length,r.GYRE_WORKFLOWS.length)"`; `ls -1 _bmad/bme/_vortex/contracts/ _bmad/bme/_gyre/contracts/` |
| counts with a **non-team** qualifier | true, and not roster claims — a Wave-3 historical delta, and BMB's builder agents listed in the table directly beneath the sentence | read the table beneath it |

⚠ **This section covers the assertions the counter reports. It does not cover the classes the counter
misses**, which are listed above and filed. An assertion the instrument cannot see was not examined here,
and that includes `UPDATE-GUIDE.md:109`'s two team counts and `docs/faq.md:159`'s Gyre count.

#### A tooling finding, not a document finding

**`docs-audit.js` required the counted noun ADJACENT to the number, so `docs/faq.md:40` was invisible —
in both directions.** The line's two claims are correct, but a *wrong* version of the same line produced
zero findings, so the sentence could go stale with the gate green. Fixed by admitting a qualifier
between number and noun, restricted to names drawn from `_bmad/bme/_config/name-registry.csv`. The
restriction is load-bearing: an unrestricted qualifier flags "adding three new agents" and "three
builder agents", which are true and are not roster claims. Both directions are mutation-proven.

**⚠ The limit of that fix, recorded because it is easy to over-read.** It makes a claim **visible**, not
**verified against its own team**. `validCountsFor` holds one valid set for every roster, so
*"all four Vortex agents"* still passes on Gyre's 4. That is `T154`, and this story does not close it.

**Assertion counts are Story 1.4's script output, not the pre-story estimates.** The `Assertions`
column above still holds the 2026-09-10 first-pass figures for files no story has examined; the two
rows Story 1.4 examined now carry the count from
[`scripts/audit/derived-assertions.js`](../../scripts/audit/derived-assertions.js), which Stories 1.5
and 1.6 run identically. Re-derive any cell with
`node scripts/audit/derived-assertions.js <file>`; do not hand-edit a figure in this table.

**The two methods disagree substantially, and the estimate is the side that moved.** Both examined
files came in higher than their pre-story figure, `UPDATE-GUIDE.md` by well over double. The first-pass
pattern set was never recorded — this note and the epic both say only "a first-pass pattern set" — so
the divergence cannot be attributed, and *"prior method not reproducible"* is the honest reading rather
than a gap to fill. One likely contributor is decidable: Story 1.4 ruled that **fenced code blocks are
counted**, and `UPDATE-GUIDE.md`'s commands sit inside fences — a bare majority, not the near-totality an earlier draft claimed. Patterns were deliberately
**not** tuned toward the estimate; doing so would invert the test.

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
