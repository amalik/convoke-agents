---
initiative: convoke
artifact_type: note
qualifier: channel-integrity-findings-2026-09-26
status: done
created: '2026-09-26'
schema_version: 1
qualifier_role: operator-authored
---

# Channel Integrity — findings, 2026-09-26

**What this is.** The verified diagnosis of how Convoke reaches operators through
agent-skill distribution channels. Findings only: no requirements, no plan, no
recommendation. The decision this feeds is
[`adr/channel-integrity/adr-001-the-distribution-unit.md`](adr/channel-integrity/adr-001-the-distribution-unit.md).

**How to read the figures.** Every number carries the command that produces it, run
from the repository root at `35b7793f`+. No figure is transcribed. Where a claim could
not be verified it says so in the same sentence.

**Provenance.** Produced 2026-09-26, then reviewed by five independent read-only
passes whose full output is in
`prds/prd-BMAD-Enhanced-2026-09-26/review-*.md` and `reconcile-*.md`. Fourteen figures
in the first draft were wrong; the corrected ones are below. The superseded draft is
retained at `prds/prd-BMAD-Enhanced-2026-09-26/prd.md`.

---

## 1. The trigger, and what it actually showed

A `skills.sh` page listed `bmad-bme-agent-wade`, one install, though nothing had been
published to that registry.

**It was not a crawl.** The `npx skills` CLI walks a fixed list of container
directories to bounded depth, but manifest-declared paths bypass that walk. From the
[CLI README](https://github.com/vercel-labs/skills):

> Skill paths declared in a manifest are searched at their declared depth and are not
> subject to the bounded depth-3 catalog walk described above.

`.claude-plugin/marketplace.json` declares seven `_bmad/bme/_vortex/agents/*` paths.
Wade is one of them.

```sh
python3 -c "import json;d=json.load(open('.claude-plugin/marketplace.json'));print(len(d['plugins'][0]['skills']))"   # 7
```

**The finding is not that Convoke was listed. It is that Convoke already publishes to
a public channel deliberately, and publishes 7 of its 11 agents and none of its
workflows or contracts.** The listing did not create the exposure. It rendered it.

## 2. Measured position

```sh
# agents per team
ls -1 _bmad/bme/_vortex/agents/ | wc -l          # 7 (each holds a SKILL.md)
ls -1 _bmad/bme/_gyre/agents/*.md | wc -l        # 4 (bare .md — no SKILL.md)
find _bmad/bme/_gyre _bmad/bme/_team-factory -name SKILL.md | wc -l   # 0

# workflows — note _deprecated/ inflates a naive count
ls -1d _bmad/bme/_vortex/workflows/*/ | wc -l                  # 23
ls -1d _bmad/bme/_vortex/workflows/*/ | grep -vc _deprecated   # 22
ls -1d _bmad/bme/_gyre/workflows/*/ | wc -l                    # 7

# contracts: named vs existing as files
ls -1 _bmad/bme/_vortex/contracts/hc*.md | wc -l   # 5  (HC1–HC5)
ls -1 _bmad/bme/_gyre/contracts/gc*.md | wc -l     # 4  (GC1–GC4)
grep -rl "HC6\|HC7\|HC8\|HC9\|HC10" _bmad/bme/_vortex/ | wc -l   # mentions only
```

| | Count | Exists as a `SKILL.md` | Reachable by a skills channel |
|---|---|---|---|
| Agents | 11 in 2 teams (+1 internal) | 7 | **7** — Vortex, via the manifest |
| Workflows | **29** (Vortex 22 live, Gyre 7) | 0 | **0** |
| Handoff contracts | 14 named (HC1–HC10, GC1–GC4) | — | **0** |
| Contracts existing as files | **9** of 14 | — | — |

**HC6–HC10 have no artifact.** The feedback-routing half of the contract set exists
only as mentions, in `README.md`, `compass-routing-reference.md`, `hc5-signal-report.md`
and seven workflow step files. **Gyre's GC1–GC4 are files and are referenced from ten
or more Gyre step files** — and are absent from the maturity ledger's contract row.

**The public discovery surface of the repository is nine skills:**

```sh
git ls-files '*SKILL.md' | grep -cE '^\.claude/skills/'   # 2 (whitelisted at .gitignore:66-71)
# + 7 declared in .claude-plugin/marketplace.json         = 9
```

The seven personaless skills under `_bmad/bme/_artifacts`, `_enhance` and
`_portability` sit at depth 5, in no container directory and in no manifest, so they
are **not** reachable. They are also all Convoke's own tooling, not the product.

## 3. Channel mechanics

### `npx skills` / skills.sh

- **Discovery** walks a fixed container-directory list (**59** entries, per the
  README's generated block) to three levels. `--full-depth` additionally reaches
  `SKILL.md` outside those directories.
- **The recursive fallback is capped.** `findSkillDirs` returns `[]` beyond
  `maxDepth = 5`, and the fallback fires only when `skills.length === 0 || fullDepth`.
  Manifest paths are walked *before* that test, so with seven manifest skills the
  zero-length branch can never fire. Source: `src/skills.ts`.
- **No dependency mechanism exists.** [#515](https://github.com/vercel-labs/skills/issues/515),
  open and unanswered since March 2026.
- **No self-serve retraction.** Delisting is manual and discretionary
  ([#1578](https://github.com/vercel-labs/skills/issues/1578)).

### Claude Code plugin marketplaces

A remote plugin is copied to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`,
which is what `${CLAUDE_PLUGIN_ROOT}` points at. Per the
[loading reference](https://code.claude.com/docs/en/plugins/loading), files outside the
plugin directory are not copied. **The relevant mechanism for Convoke is that the file
was never copied — not that a path was rejected**; rejection applies to *declared
component paths*, not runtime reads. Marketplaces do have real semver `dependencies`,
which skills.sh lacks — though resolution requires the dependency's maintainer to tag
`<plugin-name>--v<version>`, which upstream BMAD should not be assumed to do.

### OQ-2, answered

`metadata.internal: true` is **shipped** (`src/skills.ts`, nests under `metadata:`).

- **It suppresses the CLI.** Confirmed by three independent operators in
  [#1578](https://github.com/vercel-labs/skills/issues/1578).
- **It does not remove an already-indexed web listing.** Eleven named URLs across
  those repos still list internal-marked skills. Open since 2026-07-03, no maintainer
  reply.
- **It is not sufficient as a guard.** `src/add.ts` sets `includeInternal` on any
  explicit `--skill <name>`, so an internal skill installs by name with **no env
  var**. And [#2249](https://github.com/vercel-labs/skills/issues/2249) shows the
  strict `=== true` test makes the value spec-invalid, while the spec-compliant
  `"true"` reads as *not internal*.
- **⚠️ Limit of the evidence.** All three proven cases were indexed first and marked
  internal afterwards. **Nothing establishes the behaviour for a skill marked internal
  before it is ever indexed — which is Convoke's case.**

## 4. The non-product `SKILL.md` set

```sh
git ls-files '*SKILL.md' | wc -l                                  # 75
git ls-files '*SKILL.md' | grep -cE '^(_bmad/|\.claude/)'          # 37
git ls-files '*SKILL.md' | grep -vcE '^(_bmad/|\.claude/)'         # 38
git ls-files '*SKILL.md' | grep -vE '^(_bmad/|\.claude/)' | awk -F/ '{print NF-1}' | sort -n | uniq -c
#   6 at depth 4 · 1 at 5 · 2 at 6 · 28 at 7 · 1 at 8
```

**Thirty-eight, in three classes with three different remedies:**

| Class | Count | Where | Remedy differs because |
|---|---|---|---|
| Verbatim upstream names | **32** | `tests/fixtures/portability-project/` mostly | cannot be renamed — the portability suite must test against real upstream names |
| Synthetic | **6** | `tests/fixtures/bmm-dependencies/` (`skill-with-*`) | harmless names; no shadowing risk |
| Smoke-test residue | **1** | `_bmad-output/exp3-smoke-test/` | a second tree entirely, and arguably deletable |

**Reachability is narrower than it looks.** Only **7** of the 38 sit at depth ≤ 5.
The other **31** are at depth 6–8 and are therefore beyond `maxDepth = 5` — unreachable
even with `--full-depth`. The depth invariant "no non-product `SKILL.md` within the
container walk" holds today and is checkable now, independently of OQ-2.

**The real exposure is not registry shadowing.** [#353](https://github.com/vercel-labs/skills/issues/353)
documents *intra-repo* discovery-order shadowing, not one repo shadowing another's
name. Convoke's exposure is the **install-destination overwrite**: two skills claiming
one name land on one path.

**And it is already realised inside Convoke:**

```sh
for f in $(git ls-files '*SKILL.md'); do grep -m1 '^name:' "$f" | sed 's/name: *//'; done \
  | sort | uniq -c | awk '$1>1'
# 13 duplicated names across 20 extra copies: 3x bmad-help, 3x bmad-shard-doc,
# 3x bmad-party-mode, 3x bmad-brainstorming, 3x bmad-index-docs, ...
```

All are vendored upstream copies.

## 5. Defects, with corrected severity

| # | Defect | Verified state |
|---|---|---|
| 0 | 38 non-product `SKILL.md`, 32 with upstream names | **Downgraded twice.** Not default-reachable; 31 of 38 unreachable even with `--full-depth`; `metadata.internal` covers the CLI but not the storefront and not `--skill <name>`. Live risk is install-destination overwrite, not registry shadowing. |
| 1 | A skill arriving without its runtime fails without naming what is missing | Confirmed |
| 2 | Bare cross-directory paths in capability references | Confirmed. **22** bare paths, plus `_bmad/core/tasks/workflow.xml` and `_bmad/core/workflows/party-mode/workflow.md`, neither shipped in `files[]`. |
| 3 | Four dead upstream dependencies | Confirmed: `bmad-init` removed, `bmad-create-prd` → `bmad-prd`, `bmad-create-epics-and-stories` + `bmad-sprint-planning` → `bmad-preview-ticketing`, `bmad-help` in neither `skills/` nor `removals.txt` |
| 4 | Gyre unreachable by any **skills** channel | Confirmed — **not** "every channel": `files[]` ships `_bmad/bme/_gyre/`, so npm delivers it |
| 5 | Maturity ledger distribution row + uncertain-row 1 | Confirmed, and wider than filed — see §6 |

**Not a defect, contrary to the first draft:** Gyre's four agents exist in the tree as
`.md` files and their skill wrappers *are* generated at install time
(`install-gyre-agents.js`, `GYRE_AGENTS` in `scripts/update/lib/agent-registry.js`).
The gap is channel-addressability, not existence. Wording that says they "exist
nowhere" turns a restructure into a creation task and misprices it.

## 6. The maturity ledger is wrong in the reassuring direction

The ledger is client-facing and was presented on 2026-09-22. Thirty-one of its
statements are affected; these are the ones that change what a reader decides.

| Ledger | Says | Now |
|---|---|---|
| `:29` | "The listing metadata is included, but **Convoke is not listed**… Install through npm instead." | **False.** The manifest is an active publication surface, not inert metadata awaiting a submission. |
| `:604` | "the distribution channel does not exist for Convoke" | **False**, same cause |
| `:34`, `:718` | "**npm is the only supported channel**" | **Incomplete.** A second, unsupported channel is live. |
| `:34` | "a **second** supply chain" | **Three**, not two |
| `:18`, `:229` | "Five hand-off templates and five routing rules", status **Shipped** | **Short by four.** GC1–GC4 are absent from the row. |
| `:183` | "Every `./references/*.md` target named in the 3 converted agents exists." | **Measured existence, reported resolution.** Its regex required `{project-root}/` *and* `_designos`, so it could see neither the 22 bare paths nor the 4 `_bmad/core/` references. "Thirteen dangle" is the floor of a badly chosen pattern. |

**For a policy-constrained organisation the ledger's "no supported route" is the
comforting reading. The truth is worse: an unsupported route is live, with no
dependency resolution, and a skill on it fails without naming what is missing.**

**Still unsolved and still unaddressed:** the ledger calls the air-gapped /
internal-registry / mirror / binary gap *"real and unsolved."* Nothing in this
diagnosis narrows it, and it is what a leadership audience asks about.

## 7. What this note deliberately does not do

- **It does not choose the distribution unit.** That is ADR-001's ruling, open.
- **It does not restate third-party security ratings.** The ledger's rule binds:
  *"restating an unverified security rating about somebody else's package is precisely
  the kind of claim this ledger exists to refuse."* Published population statistics
  about the skills ecosystem exist and are cited in the superseded draft's addendum;
  they were **not** reproduced here, they concern ClawHub rather than skills.sh, and
  they are not repeated as fact.
- **It does not assert a cadence policy.** A literal N-1 cap is documented as
  unsatisfiable: `convoke-arch-bmad-v6.4-v6.8-absorption.md:230` records the floor at
  **N-8** and warns a literal N-1 "would be in breach on day one".
