# Fast Story: README rewrite — lifecycle spine + link-contract fix

**Status:** ready-for-dev · **Lane:** Fast (pending triage RICE) · **Source:** Party-mode roundtable, 2026-08-15 (Paige, John, Victor, Sophia, Caravaggio, Mary, Sally, Winston, Amelia, Murat, Maya, Carson, Dana) · **Backlog ID:** I156 <!-- allocated 2026-08-15; I156–I160 each verified zero-hit against the backlog before allocation, per I150 -->

**Spawns:** I157 (packed-tarball link gate) · I158 (normative-document location review) · I159 (activation command naming, Initiative Lane) · I160 (installer prompts for `{user}`). The README's bare `npx` form is **not** a new row — it is an instance of **T30**, which now records it.

## Context

`README.md` is 542 lines organised as a feature catalogue in the order the product was built. Three defect classes, only one of which is a writing problem.

### 1. Structure encodes build order, not the product

Vortex occupies ~110 lines (agents table, 22-workflow `<details>`, three inlined output excerpts, seven guide links); Gyre gets ~60; Enhance / Portability / Team Factory share a trailing "Extending Convoke" band. A reader cannot tell that these are peers. The operator's framing for the rewrite: **Convoke is built in BMAD's format — it extends BMAD where BMAD Method is installed, and runs on its own where it isn't**, covering the full product lifecycle around BMAD's build phase. Vortex is one team among several, not the centre.

`README.md:413` currently states "Convoke works standalone or as an extension — no BMAD Method installation required." That claim **stays** (~40% of users are Vortex Standalone per `project_two_product_framing`), but it is currently a throwaway line at the bottom of a diagram section rather than part of the positioning.

### 2. Version drift (three places, one cause)

| Location | Says | Actual |
|---|---|---|
| `README.md:31` | "What's New in **3.3**" | `package.json` version is `4.0.0-rc.1` |
| `README.md:451-456` | Roadmap ends at **v3.x** | 4.0 is in rc |
| `README.md:454` | "**1,123 tests**" | hand-typed; violates `derive-counts-from-source` |

### 3. Link contract is broken for every non-git reader — the real bug

`package.json` `files` ships `index.js`, `scripts/`, `_bmad/bme/{_vortex,_enhance,_gyre,_artifacts,_portability,_team-factory}/`, `_bmad/_config/skill-manifest.csv`, `.claude-plugin/`, one `.claude/skills/` dir, `INSTALLATION.md`, `UPDATE-GUIDE.md`, `CHANGELOG.md`, `LICENSE`, `README.md`, `src/`.

It ships **neither `docs/` nor `_bmad-output/`**. Seven README links therefore resolve only inside a git clone:

| README line | Target | Ships? |
|---|---|---|
| `:24` "**Required reading first**" | `_bmad-output/planning-artifacts/convoke-covenant-operator.md` | ❌ |
| `:110`, `:146` | `_bmad-output/journey-examples/busy-parents-7-agent-journey.md` | ❌ |
| `:439`, `:44`, `:45`, … | `docs/agents.md` | ❌ |
| `:440` | `docs/BMAD-METHOD-COMPATIBILITY.md` | ❌ |
| `:441` | `docs/testing.md` | ❌ |
| `:442` | `docs/development.md` | ❌ |
| `:307`, `:443` | `docs/faq.md` | ❌ |

Consequence, stated plainly: **a skill author who installed Convoke from npm cannot open the document `project-context.md` makes required reading.** Five of the seven rows in the Documentation table point at files absent from their install. The `_bmad/bme/*/guides/*` links *do* resolve — those directories are in `files`.

Additionally, four of seven badges are `shields.io` **dynamic JSON** fetches against `raw.githubusercontent.com/amalik/convoke-agents/main/docs/badges.json`, so the first screenful depends on shields uptime, repo visibility, `main` not moving, and a generated file staying generated. Payload: `teams: 2, agents: 12, workflows: 33, skills: 106`. The `skills: 106` figure counts the whole installed BMAD surface, not Convoke's inventory.

### 4. Portability claim must not overstate

`scripts/portability/classify-skills.js:311-312`:

```js
if (modulePath.includes('_bmad/bme/_vortex/')) return 'pipeline';
if (modulePath.includes('_bmad/bme/_gyre/'))   return 'pipeline';
```

Tier `pipeline` is what `README.md:246` already calls **non-portable**. Only the agent personas escape, via the `PERSONA_AGENT_INTENTS` override (`classify-skills.js:303-305`), which covers Gyre's four exactly as it covers Vortex's seven. **No team's workflows export today.** Any "all teams are portable like Vortex" framing is false in both directions — the parity exists, at zero. Portability belongs in the unfinished half of the document, not the shipped half.

## Design decisions (pinned)

**D1 — The headline already exists, buried.** `README.md:538`, centred in the footer under the credits: *"Discover what has to be discovered. Ship what's ready to ship."* It states the lifecycle in nine words and both sides of BMAD's build phase. It replaces `"Agent teams for complex systems"` in the ASCII block. Do not invent a new tagline.

**D2 — One lifecycle spine, not two halves.** The operator asked for "what it is today" and "what it's going to be" as two parts. **Implement as one arc whose right-hand column runs out.** Every row is a lifecycle job; shipped jobs name a team, unshipped jobs leave the name blank. Two sections would split a single argument in half and create two places that declare the future — the exact failure mode that produced the competing ontologies in `docs/lifecycle-expansion-vision.md` and `docs/Convoke-Ecosystem-v0.2-Updated-With-Gyre.md`.

**D3 — No team names in unshipped rows.** Jobs / scopes only ("domain knowledge capture", "portfolio strategy"). Operator directive, and it is load-bearing: the two ecosystem documents above carry unresolved name collisions (Helm, Loom, Compass, Atlas, Scout, Flux). Publishing names now publishes the collision. A job label survives a rename; a team name becomes a 404.

**D4 — Uniform team cards.** Fixed shape per team: job · one line of what it does · **one** real output excerpt · one link out. Same shape for every team, no exceptions. This is what dissolves the Vortex/Gyre imbalance structurally rather than by editorial restraint, and it makes adding a team an append rather than a redesign. The busy-parents journey is **linked, not inlined at length** — the long-form example stays where it is and is referenced.

**D5 — Portability is one product-level sentence, not a per-card property.** It sits with the positioning sentence at the top, honestly scoped: the agent personas export today, the team workflows do not yet. A "not yet" line repeated on every card reads as an apology in triplicate and creates N places to edit on the day `classify-skills.js:311-312` changes. The *job* ("run any team outside Claude Code") appears in the unfinished column.

**D6 — Fix the link contract, not the file locations.** README links to shipped paths stay relative; README links to repo-only paths become **absolute canonical URLs** (`https://github.com/amalik/convoke-agents/blob/main/...`). **Do not add `docs/` or `_bmad-output/` to `package.json` `files`.** `docs/` contains internal material that must not ship — `KORE-Method-v0.1-Draft.md`, `Convoke-Ecosystem-v0.2-Updated-With-Gyre.md`, `lifecycle-expansion-vision.md`, `codebase-audit-2026-06-27.md`. `_bmad-output/` is generated-artifact space by contract. Shipping either to fix seven links would leak unreleased strategy documents to every installer.

**D7 — Do not relocate the Covenant in this story.** *(Amends the roundtable's ruling, on evidence gathered after it was made.)* `_bmad/_config/taxonomy.yaml:50-58` defines `covenant` as a first-class artifact **type** with `planning-artifacts/` as its home, authored there deliberately by `oc-1-4-covenant-authoring`. Its location is a governance decision, not a misfiling. 31 files reference the path, including `_bmad/bme/README.md`, `docs/README.md`, `CHANGELOG.md`, `project-context.md`, `tests/lib/artifact-utils.test.js:402` and `scripts/migration/format-conversion/covenant-survival-harness.js:42` (both comment-level). Moving it is a taxonomy amendment with a 31-file blast radius and belongs in its own item. D6 fixes the reader-facing defect — the required reading becomes openable from any install — without touching governance.

**D8 — Delete the rotting section classes, don't police them.** Remove **"What's New in X"** (a CHANGELOG rendered in the wrong file; keep the CHANGELOG link) and the **Roadmap section** (the unfinished column of the D2 arc *is* the roadmap; two futures reopens the ontology wound). Consequence: the README names no version and no hand-typed count, so version drift becomes structurally impossible rather than a thing to remember. Any count that must appear derives from `docs/badges.json` via the existing `npm run badges` generator (`derive-counts-from-source`).

**D9 — Badge cull.** Keep the two static badges (npm version, licence). Drop the four dynamic `shields.io`/`raw.githubusercontent` fetches and the `skills: 106` vanity count. `docs/badges.json` and `npm run badges` / `badges:check` / `prepublishOnly` stay — the file has non-README consumers; only the README's dependence on it goes.

**D10 — Acknowledgments → `CREDITS.md`.** The 46-line, 28-agent list (`README.md:485-533`) names BMM / CIS / BMB / TEA agents that built Convoke, not agents a user receives — a reader counting names gets 28 while the badge says 12. It is a genuine signature and is **kept**, moved to `CREDITS.md`, linked from the footer in one warm line (not an administrative one).

**D11 — Delete "How It Fits with BMAD Core"** (`README.md:396-413`). Its two-box diagram makes the same claim as the D2 arc, which draws BMM as someone else's box in the middle and says it better. Preserve the *content* of `:413` (standalone/extension) into the positioning sentence — delete the section, not the claim.

**D12 — Promote "Your First 15 Minutes"** (`README.md:352-359`) to just after the arc. It is the only passage in the current file that assumes the reader has to *do* something, and it currently sits at line 352.

**D13 — Use the `-p` form; it is already established.** `README.md:290/297/304` teaches `npm install convoke-agents@latest` + `npx convoke-install`; `UPDATE-GUIDE.md` uses `npx -p convoke-agents <cmd>` on all eight of its command lines and explains at `:62` why the `-p` is **mandatory**. This is not an open question: backlog **T30** already owns the class ("user-facing docs must use the canonical `npx -p convoke-agents…` invocation form"), and **BUG-9** is what it cost — an operator typed the bare form during rc validation, hit a stale global 3.1.0, and got a spurious DOWNGRADE DETECTED. Convert the README's three install lines to the `-p` form. If a specific bin genuinely does not resolve under `-p`, that is a finding to raise, not a licence to keep two grammars. Also move the v2.x→v3.x major-boundary blockquote (`README.md:429`) into `UPDATE-GUIDE.md`; it is troubleshooting, and it needs a new sentence every major release.

**D14 — Two axes, one page: teams get the spine, skills get a band.** Teams do lifecycle jobs; Enhance adds capabilities to existing agents; Portability exports; Team Factory *makes teams*. These are not lifecycle rows and must not be forced into the spine — mixing the axes is how `docs/lifecycle-expansion-vision.md` and `docs/Convoke-Ecosystem-v0.2-Updated-With-Gyre.md` diverged. The spine carries teams only; a short "extending Convoke" band below carries the skill-tier modules.

**D15 — ASCII policy: keep the wordmark, keep one arc, drop the per-team pipeline diagrams.** The `CONVOKE` block wordmark (`README.md:3-11`) is deliberate craft that renders in a terminal with no network — it **stays** (with the D1 tagline swapped in). The `docs/badges.json` counts and the D2 arc are the only other diagram. The three per-team ASCII pipelines (`:49-66` Vortex 7-stream, `:161-172` Gyre, `:255-268` Enhance) are **deleted** — they are the single largest contributor to the Vortex/Gyre asymmetry D4 exists to remove, and the arc supersedes them. If a team's flow genuinely needs a diagram, it lives in that team's guide, not the README.

**D16 — Delegate install detail to `INSTALLATION.md`; do not restate it.** `INSTALLATION.md` **is** in `package.json` `files` (relative link, resolves everywhere) and already covers Prerequisites, Quick Install, Installation Options, What Gets Installed with the directory structure, Configuration, Verification and Troubleshooting. `README.md` currently duplicates all of it: Prerequisites `:278-282`, three install variants `:284-307`, Personalize `:309-311`, and a 30-line directory tree `:363-392`. Reduce the README to the single happy-path install (`npm install` + `npx convoke-install`), the `convoke-doctor` escape hatch, and a link. **Delete the directory tree from the README entirely** — do not `<details>`-collapse it; it exists in full at `INSTALLATION.md:77`. Reconcile the two documents where they disagree rather than leaving both.

## Target structure

Ordered outline the rewrite should produce. Section names are guidance; the order and the omissions are not.

1. Wordmark + D1 tagline + two static badges (D9, D15)
2. **Positioning paragraph** — built in BMAD's format · extends BMAD where installed · runs on its own where it isn't (D11) · one portability sentence, honestly scoped (D5)
3. **The lifecycle spine** (D2) — the arc, with the right-hand column running out
4. **Your First 15 Minutes** (D12), promoted from `:352`
5. **Team cards** (D4), uniform, one per team
6. **Extending Convoke** band (D14) — Enhance · Portability · Team Factory, short
7. **Install** — happy path + link to `INSTALLATION.md` (D16)
8. **Updating** — keep, minus the major-boundary blockquote (D13)
9. **Documentation** table — absolute URLs for repo-only rows (D6)
10. **Contributing · Licence · Acknowledgment line → `CREDITS.md`** (D10)

**Spine rows — starting point, not a fixed list.** Shipped rows name a team; unshipped rows name only the job (D3). The dev agent may re-word the job labels; it may not add a team name to an unshipped row.

| Lifecycle job | Team |
|---|---|
| Frame the problem and understand users | Vortex |
| *(BMAD Method — build)* | *(not Convoke's box)* |
| Assess production readiness | Gyre |
| Capture domain knowledge from an existing system | — |
| Run any team outside Claude Code | — |

**Card template — this shape, every team, no exceptions (D4):**

```markdown
### {Team} — {lifecycle job}

{One sentence: what it does and for whom.}

{N} agents · {N} workflows        <!-- derived from docs/badges.json, never hand-typed -->

> {One real excerpt, quoted from a source artifact and cited.}

[Guides]({relative link — guides are shipped}) · [Full example]({absolute URL if repo-only})
```

## Scope

1. **Rewrite `README.md`** per D1–D5, D8–D16, following the Target structure above. Target: substantially shorter than 542 lines; length is an outcome of the card template, not a target to hit.
2. **Convert every repo-only link to an absolute canonical URL** (D6). The seven links in the Context table, plus any introduced by the rewrite. Relative links are permitted **only** to paths present in `package.json` `files`.
3. **Create `CREDITS.md`** with the current Acknowledgments content (D10); link once from the README footer.
4. **Verify `package.json` `files` covers every relative link the new README contains** (D6). Expect no change to `files`; if the rewrite genuinely needs a new shipped path, that is a decision to raise, not to make silently.
5. **Reconcile `INSTALLATION.md`** where it and the new README disagree (D16). The README defers; `INSTALLATION.md` is the source of truth for install detail.
6. **Do not touch** `classify-skills.js`, the artifact taxonomy, the Covenant's location, or the badge generator scripts.

### Read before writing

Non-negotiable — read each of these completely before drafting a line (this is the step whose omission causes review cycles):

| File | Why |
|---|---|
| `README.md` | The document being replaced; every claim in it is either carried, moved, or deliberately dropped |
| `INSTALLATION.md` | D16 — the README defers to it; you must know what it already says |
| `package.json` | The `files` array is the whole basis of the link contract (D6, AC1) |
| `docs/badges.json` | Source for any count that appears (D8) |
| `_bmad-output/journey-examples/busy-parents-7-agent-journey.md` | Source of the card excerpts; quote, never compose |
| `docs/agents.md` | What the README should link to rather than restate |

**Preserve on pain of regression:** the ASCII wordmark (D15); the standalone/extension claim from `:413` (D11, AC7); all 28 names from `:485-533` (D10, AC8); the `convoke-doctor` escape hatch (`:307`); the Compass routing note (`:68`, `:359`) — it is a genuine differentiator currently buried in a caption.

**Node version is already correct.** `package.json` `engines` is `>=18.0.0` and `.github/workflows/ci.yml:50` runs the matrix on `[18, 20, 22]`. "Node.js 18+" stands — do not churn it.

## Acceptance criteria

1. Every relative link in the new `README.md` resolves to a path matched by `package.json` `files`. Verified mechanically, not by eye (`mechanical-research-enumeration`): extract all `](` targets, filter out `http(s)://` and in-page anchors, and check each survivor against a packed tarball.

   ```bash
   set -o pipefail
   npm pack --silent >/dev/null && \
   tar -tzf convoke-agents-*.tgz | sed 's|^package/||' > /tmp/packed.txt
   grep -o '](\([^)#][^)]*\))' README.md | sed 's/^](//;s/)$//' \
     | grep -v '^http' | sort -u | while read -r l; do
       grep -qxF "$l" /tmp/packed.txt || echo "UNRESOLVED: $l"; done
   ```
   Passes when the loop prints nothing.
2. `README.md` contains no version string and no hand-typed count of agents, workflows, skills or tests (D8). `grep -nE '\b[0-9]+\.[0-9]+(\.[0-9]+)?\b|[0-9,]{3,} tests' README.md` returns only matches that are Node/tooling minimums (e.g. "Node.js 18+") — each surviving match is justified in the Dev Agent Record.
3. The headline under the ASCII wordmark is the D1 sentence; `"Agent teams for complex systems"` no longer appears.
4. The lifecycle spine is a single structure (D2) in which at least one row names a job with no team name (D3), and no unshipped row names a team.
5. Every team present in the README uses the identical card shape (D4). Line counts per card are within ±20% of each other — the Vortex/Gyre asymmetry is gone.
6. Portability appears exactly once as a product-level statement (D5), scoped to personas-yes / team-workflows-not-yet, and does not appear as a per-team property line. It does not claim any team's workflows export.
7. `README.md:413`'s standalone/extension claim survives into the positioning sentence (D11) — the claim is not lost with the deleted section.
8. `CREDITS.md` exists, contains all 28 names currently in `README.md:485-533`, and is linked from the README footer. No name is dropped in the move (diff the name lists).
9. `npm run docs:audit` exits 0 against the rewritten tree, and `npm run badges:check` still passes (D9 removes the README's *use* of the badges, not the generator).
10. The ASCII wordmark survives (D15) and the three per-team pipeline diagrams do not: `grep -c '─' README.md` counts only the arc's characters — no Vortex 7-stream, Gyre 4-agent, or Enhance backlog diagram remains.
11. No directory tree in `README.md` (D16); the install section links to `INSTALLATION.md` and does not restate its Prerequisites / Options / Configuration content.
12. `npm test` and `npm run lint` clean (`lint-passes-before-review`). No test asserts against live README content — if the rewrite breaks a test, check whether that test violates `test-fixture-isolation` before editing the README to satisfy it.

## Namespace decision

Root-level documentation (`README.md`, new `CREDITS.md`) and `package.json`. No `_bmad/bme/` surface is created or modified, so `covenant-compliance-for-convoke-skills` is **N/A** and no Compliance Checklist run is required. No new operator-facing tool is introduced, so `slash-command-ux-for-user-facing-tools` is **N/A**. `_bmad/` paths are untouched (BMAD Method compatibility preserved).

## Safety analysis

`path-safety-for-destructive-ops`: **N/A by construction.** No script is authored; no user-supplied path is accepted; nothing is deleted from disk. `CREDITS.md` is a new file. The only overwrite is `README.md` itself, which is version-controlled — the dev agent must confirm a clean `git status` for `README.md` before the rewrite so the prior version is recoverable.

## Out of scope — spawn as backlog rows

1. **Packed-tarball README link gate (Murat).** Promote AC1's command into `scripts/audit/` with an npm script and a CI step, so link rot fails the build instead of being caught by the next rewrite. Sits alongside `install-scope-check.js`; honours `verification-pipefail`. Real test surface, does not block a documentation rewrite.
2. **Normative-document location review (Winston).** Whether `covenant`-type artifacts belong in `_bmad-output/planning-artifacts/` at all, given they are normative and required reading while `_bmad-output/` is generated-artifact space. Touches `_bmad/_config/taxonomy.yaml:50-58` and 31 referencing files. See D7.
3. **Three product bugs surfaced by writing the docs** — each independently qualifying:
   - Activation commands need an inline comment to identify who they are (`README.md:319-331`, e.g. `/bmad-agent-bme-production-intelligence-specialist # Noah`). If a name needs a gloss, the name failed.
   - Onboarding step 2 asks the operator to hand-edit `config.yaml` to replace `{user}` (`README.md:311`, `:354`). The installer should ask. Plausible OC-R-class Covenant concern.
   - Two `npx` grammars across README and UPDATE-GUIDE (D13) — if D13's verification shows the `-p` form is correct, the README is not the only place that needs fixing.

## Notes for the dev agent

- **`_bmad-output/drafts/README-draft.md` (2026-03-22) is stale.** It carries the same `"Agent teams for complex systems"` tagline this story removes. Do not use it as a base.
- **The proof excerpts are quotations with a shelf life** (Murat). Each card's excerpt must be traceable to a source artifact — quote from `_bmad-output/journey-examples/busy-parents-7-agent-journey.md` and cite it, rather than composing new sample output in the README. Invented excerpts cannot be checked and will drift.
- **Staleness pre-flight:** qualified 2026-08-15, implemented same day → **age exemption** applies (`staleness-preflight-for-backlog-pickup`). No pre-flight required. Re-run all four checks if pickup slips past 2026-08-18.
- **Not tracked in `sprint-status.yaml`.** Fast Lane stories are standalone files tracked in the lifecycle backlog, per the `fast-upstream-name-staleness-gate` / `fast-python-uv-toolchain-preflight` precedent. Do not add a `development_status` key.
- **Commit plan required** (`commit-preparation`), and preparing it is a Round 1 landing point (`code-review-convergence`). Expected shape: one commit — `docs(readme): rewrite around the lifecycle spine and fix the link contract` — covering `README.md`, `CREDITS.md`, and `package.json` only if `files` genuinely changed. The backlog rows above are a separate governance commit.
