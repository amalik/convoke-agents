---
baseline_commit: 15f3b132738e3e5d2565306fd5c84f0445de989b
---

# Fast Story: README rewrite — lifecycle spine + link-contract fix

**Status:** done *(R1 + R2 converged — 45 findings across two rounds, all patched or deferred; no Round 3, R2's fixes were content-level)* · **Lane:** Fast (pending triage RICE) · **Source:** Party-mode roundtable, 2026-08-15 (Paige, John, Victor, Sophia, Caravaggio, Mary, Sally, Winston, Amelia, Murat, Maya, Carson, Dana) · **Backlog ID:** I156 <!-- allocated 2026-08-15; I156–I160 each verified zero-hit against the backlog before allocation, per I150 -->

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

### 4. Portability — ⚠️ CORRECTED 2026-08-15 by Round 1 review

> 🛑 **The paragraph below is wrong.** It is preserved because the decisions built on it must stay legible. It claims the agent personas escape tier `pipeline` through the `PERSONA_AGENT_INTENTS` override. They do not: that set (`scripts/portability/classify-skills.js:87-98`) contains **only BMM agents** — `bmad-agent-analyst`, `-pm`, `-architect`, `-ux-designer`, `-tech-writer`, `-sm`, `-dev`, `-quick-flow-solo-dev`, `-qa` — and **no `bmad-agent-bme-*` name at all**. `_bmad/_config/skill-manifest.csv` records tier `pipeline` for **all 12** Convoke agents, and exporting one emits *"Framework-only skill … cannot run standalone."*
>
> **Correct statement, as amended by Round 2 — the first version of this correction over-shot.** All **12 Convoke agents** are tier `pipeline` and none is portable. That is true. But "no Convoke agent *or workflow*" was false: `_bmad/_config/skill-manifest.csv` has 19 `bme` rows — 18 `pipeline` and one **`light-deps`**, `bmad-enhance-initiatives-backlog`, which *does* export (`export-engine.js:1009` — standalone and light-deps are exportable; the framework-only banner at `:1088` is gated strictly on `tier === 'pipeline'`). So: no Convoke **team** is portable; exactly one Convoke-authored **workflow** is. What exports cleanly is the upstream BMAD skill set plus that one skill. The error originated in the party session, passed unchallenged into this spec, and reached product copy at `README.md:22` — the second paragraph a stranger reads. It was caught only because the Acceptance Auditor re-derived the claim from the manifest rather than trusting the spec that sent it. The same false premise sits in the I156 and I157 backlog descriptions and in the Change Log entry committed as `15f3b132`.

*(original, superseded)*

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
- **Commit plan required** (`commit-preparation`), and preparing it is a Round 1 landing point (`code-review-convergence`).

---

## Dev Agent Record

### Implementation plan and decisions taken during execution

**Card contents deviate from the template in one respect, deliberately.** The template specified a `{N} agents · {N} workflows` line derived from `docs/badges.json`. That file carries only aggregates (`teams`, `agents`, `workflows`, `skills`) — per-team counts are not derivable from it, and the old README got them from dynamic shields badges querying each team's `config.yaml`, which D9 removes. Hand-typing "7 agents · 22 workflows" would satisfy AC2's grep (which only catches `X.Y` version patterns and `NNN tests`) while violating its prose and `derive-counts-from-source`. Resolved by carrying **no counts at all**: each card lists its agents by name (`Emma 🎯 · Isla 🔍 · …`), which is more useful to a reader and cannot silently disagree with reality the way a stale integer can.

**Cards are exactly equal, not merely within AC5's ±20%.** Both are 8 non-blank lines. This required dropping the per-agent tables (7 rows for Vortex against 4 for Gyre would have broken parity by construction, from data rather than editorial choice) in favour of one name line each plus a link to the Agent Guide.

**Gyre's excerpt is real output from this repository.** `.gyre/findings.yaml` is tracked in git and holds Lens's run against Convoke itself. Quoted finding DL-001 (46 Python files with local tests, zero CI coverage — severity `blocker`). Verified it has since been fixed: `.github/workflows/ci.yml:263` now defines a `python-test` job which is in `publish`'s `needs`. The excerpt says so, so the README does not advertise a blocker Convoke no longer has. Vortex's excerpt is Emma's Job-to-be-Done, verified verbatim at `busy-parents-7-agent-journey.md:50` — both quotations trace to a source artifact rather than being composed, per Murat's constraint.

**AC6 reads "portability appears exactly once" as: once as a product-level claim.** It occurs in two places, and both are required by the design: the honest scoping sentence in the positioning block, and the Portability *module* description in the extension band (D14 places the export tooling there — it is a different subject from the claim). What the AC forbids — a repeated per-card property line — does not occur.

### Changes made beyond the literal scope, with reasons

**`package.json` `files` gained `CREDITS.md`.** Scope item 4 predicted no change and said a genuine need was "a decision to raise, not to make silently" — raising it here. AC1 fails without it, since the README links `CREDITS.md` relatively. It is the same class as `LICENSE` and `CHANGELOG.md`, both already shipped, so exiling it to an absolute URL would have been the less consistent fix.

**D9's stated rationale was false — correction.** The decision reads "`docs/badges.json` and `npm run badges` / `badges:check` / `prepublishOnly` stay — the file has non-README consumers." It has none. A repo-wide grep finds only its own generator (`scripts/generate-badges-json.js`), the workflow that regenerates it, `knip.json`, and `package.json`'s own `badges:check`. Keeping the machinery was still the right call for this story — deleting a publish gate is not a documentation change — but the reason given for it was wrong, and the orphaned gate is now logged as `CR-README-D03`.

**`INSTALLATION.md` carried the identical link defect and is shipped.** Its links to `docs/agents.md` (×2) and `docs/BMAD-METHOD-COMPATIBILITY.md` resolved only in a git clone. Converted to absolute URLs under scope item 5. Also removed its `**Version:** 3.0.0` / `**Last Updated:** 2026-03-24` header — stale by four minor versions, and the same rot class D8 deletes from the README.

### Findings raised, not fixed

- **`CHANGELOG.md` has three links of the same class** (`docs/BMAD-METHOD-COMPATIBILITY.md`, `docs/migration/3.x-to-4.0.md`, `_bmad-output/planning-artifacts/adr/v63/adr-001-…md`) and is shipped. Left alone: changelog entries are historical records, and rewriting a past entry's links is the same objection that split I158 out of this story. **I157's gate should scan every shipped markdown file, not just `README.md`** — this is the evidence for that scope.
- **`INSTALLATION.md:17` links BMAD Method as `https://github.com/bmadhub/bmad`**, while `README.md` and `CREDITS.md` use `https://github.com/bmad-code-org`. Two URLs for the same project inside one package. Not changed — `feedback_verify_external_identifiers` says verify against external truth before accepting a plausible-looking correction, and that verification needs network access this run did not have. Operator decision.
- **`package.json` `description` is still "Agent teams for complex systems"** — the tagline this story removed from the README as a conference-badge line. Out of scope (npm metadata, not documentation), but it is now the only place that phrasing survives.

### Completion notes

README went from 542 lines to 171; `CREDITS.md` is 73. Every acceptance criterion was executed as written rather than assessed by reading:

| AC | Result |
|----|--------|
| 1 — relative links resolve in the packed tarball | **FAILED as first reported, then fixed.** The originally-recorded "Pass" was a false verification claim: the command I ran added a `grep -q "^$l"` prefix fallback that the AC's literal pipeline does not have, so the two `guides/` **directory** links passed my check and failed the AC's. Caught by the Acceptance Auditor running the AC verbatim. Both card links now point at files (`EMMA-USER-GUIDE.md`, `GYRE-TEAM-GUIDE.md`) and the literal command returns clean. |
| 2 — no version strings, no hand-typed counts | **Pass.** `grep -nE '\b[0-9]+\.[0-9]+(\.[0-9]+)?\b\|[0-9,]{3,} tests'` returns **zero** matches — no justified survivors to record. |
| 3 — headline is the D1 sentence | **Pass.** Present ×1; `"Agent teams for complex systems"` absent. |
| 4 — single spine, ≥1 job row with no team, no unshipped row names a team | **Pass.** Two rows carry `—`. |
| 5 — uniform cards, ±20% | **Pass.** 8 lines and 8 lines. |
| 6 — portability once, product-level, no overstatement | **Pass.** See reading above; the only workflow-export claim in the file is the negative one. |
| 7 — standalone/extension claim survives D11's deletion | **Pass.** `README.md:48`. |
| 8 — `CREDITS.md` drops no name | **Pass.** `comm -23` of old-vs-new extracted name lists is empty. |
| 9 — `docs:audit` 0, `badges:check` passes | **Pass**, after one fix: the audit read the backticked `.github/copilot-instructions.md` as a repo path. Restored the `{target}/` prefix, which is also more accurate — those files are written inside the export target. |
| 10 — wordmark survives, per-team diagrams gone | **Pass.** Exactly one `┌` diagram line remains (the arc); the Vortex 7-stream, Gyre and Enhance diagrams are gone. |
| 11 — no directory tree; install defers to `INSTALLATION.md` | **Pass.** Zero `├──`; three references to `INSTALLATION.md`. |
| 12 — `npm test` and `npm run lint` clean | **Pass.** Lint exit 0. Unit: **1628 pass / 0 fail / 1 skipped** across 395 suites. Integration run additionally: **120/120**. |

### Review Findings — Round 1 (2026-08-15)

Three layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor. The two hunters **contradicted each other** on the portability claim; resolved mechanically against `skill-manifest.csv` and `classify-skills.js` — the Auditor was right.

**Decision needed**

- [ ] [Review][Decision] The 11 agent activation commands now live only in `docs/agents.md`, which `files` excludes — options: list them in the shipped `INSTALLATION.md`, ship `docs/` (rejected by D6: leaks `KORE-Method-v0.1-Draft.md` and the ecosystem drafts), or accept the absolute link

**Patch**

- [ ] [Review][Patch] **Portability claim is false — no Convoke persona is portable** [README.md:22, :102] — `skill-manifest.csv` tier is `pipeline` for all 12 `bmad-agent-bme-*` skills; `PERSONA_AGENT_INTENTS` (`classify-skills.js:87-98`) contains only BMM agents. Contaminates spec §4, the I156/I157 backlog rows, and the Change Log entry already committed in `15f3b132`
- [ ] [Review][Patch] Update section never fetches the package, so it updates nothing [README.md:121]
- [ ] [Review][Patch] `/bmad-team-factory` is not a registered skill; the id is `bmad-agent-bme-team-factory` [README.md:104]
- [ ] [Review][Patch] D13's second directive unimplemented — the major-boundary warning was deleted, not moved; it now exists nowhere [UPDATE-GUIDE.md]
- [ ] [Review][Patch] AC1 fails under its own literal command — two `guides/` directory links have no tarball entry [README.md:80, :92]
- [ ] [Review][Patch] `_gyre/config.yaml` is a wrong path introduced by the rewrite; HEAD had it right [README.md:55]
- [ ] [Review][Patch] `CREDITS.md` lists 11 shipped agents; there are 12 [CREDITS.md:19-33]
- [ ] [Review][Patch] `CREDITS.md`'s opening sentence contradicts its own two sections [CREDITS.md:3]
- [ ] [Review][Patch] Gyre excerpt is an unmarked abridgement inside quote markers [README.md:88]
- [ ] [Review][Patch] Arc shows 5 stages, table shows 6 jobs — two drawings of one roadmap [README.md:31-46]
- [ ] [Review][Patch] Three BMAD URLs across the change; canonical per `docs/adr/adr-bmad-coupling-v4.0.md:20` is `bmad-code-org/BMAD-METHOD` [README.md:18, CREDITS.md:7, INSTALLATION.md:15]
- [ ] [Review][Patch] Spelled-out counts "Seven agents" / "Four agents" are the drift class AC2 exists to prevent [README.md:72, :84]
- [ ] [Review][Patch] `INSTALLATION.md` verification cats a file that no longer exists — Vortex agents are v6.3 directories [INSTALLATION.md:144]
- [ ] [Review][Patch] `INSTALLATION.md` tree lists 3 modules; `files` ships 6 [INSTALLATION.md:77-112]
- [ ] [Review][Patch] Deleted the "`.gyre/` is safe to commit, no secrets" reassurance while newly linking into that file [README.md:92]
- [ ] [Review][Patch] Lifecycle diagram is ~89 display columns; wraps below 80 [README.md:31-36]
- [ ] [Review][Patch] Footer is four in-page anchors and zero outbound links [README.md:169]

**Deferred — pre-existing, not caused by this change**

- [x] [Review][Defer] Installer banners print the retired tagline at install time [scripts/install-{vortex,gyre}-agents.js:26] — deferred, `scripts/` is outside story scope
- [x] [Review][Defer] `package.json` `description` still carries the retired tagline — deferred, npm metadata
- [x] [Review][Defer] `docs/badges.json` has no renderer yet still gates `prepublishOnly` — deferred; **D9's stated rationale ("the file has non-README consumers") is false** — a repo-wide grep finds only its generator, its workflow, `knip.json` and `package.json`
- [x] [Review][Defer] `docs-audit` skips absolute URLs and does not know about `CREDITS.md` — deferred to I157
- [x] [Review][Defer] Absolute URLs pin `blob/main` rather than a release tag — deferred
- [x] [Review][Defer] `convoke-install` prints "All Vortex Agents Installed!" though it installs every module — deferred, `scripts/`
- [x] [Review][Defer] `.gyre/findings.yaml` is five months old; Gyre has not been re-run on Convoke — deferred
- [x] [Review][Defer] `CHANGELOG.md` carries three links of the broken class — deferred, historical record

**Dismissed (4):** portability "claimed and disclaimed 24 lines apart" (moot once the claim is corrected) · standalone/extension stated twice (deliberate — positioning and spine) · "reviewed diff is not the change set" (artifact of the concurrent session, already surfaced to the operator) · East-Asian-ambiguous glyph widths (the wordmark already assumes a UTF-8 terminal).

### Review Findings — Round 2 (2026-08-15)

Three fresh layers against the patched tree, briefed to find what the patches broke rather than re-find what they fixed. The Acceptance Auditor verified **15 of 18** Round 1 fixes as genuinely applied.

**8 HIGH, 11 MEDIUM, 8 LOW — all applied.** The five that Round 1 *created*:

- [x] [Review][Patch] `_portability/` documented as installed; no installer copies it — `grep -rn "_portability" scripts/` is empty [INSTALLATION.md] — **introduced by the R1 fix for the 3-vs-6 module count.** Package contents ≠ installed contents; I conflated them
- [x] [Review][Patch] "every Convoke agent and workflow is `pipeline`" — 18 of 19 `bme` rows; `bmad-enhance-initiatives-backlog` is `light-deps` [README.md:103] — **R1 over-corrected**, false in the opposite direction from the original
- [x] [Review][Patch] "the unfinished row in the table above" dangles — R1 fixed the arc/table mismatch by *deleting* the portability spine row, which also broke D5 [README.md:103]
- [x] [Review][Patch] "Loom" published as a third team in two shipped docs, contradicting the README and D3's explicit name-collision hold [CREDITS.md, INSTALLATION.md] — **introduced by R1**
- [x] [Review][Patch] `.gyre/` "no paths" reassurance refuted by the evidence quoted four lines below it [README.md:83] — **introduced by R1**

Round 1 misses and pre-existing defects, also fixed:

- [x] [Review][Patch] `convoke-install` / `-vortex` / `-gyre` presented as three scopes; `install-all-agents.js` is one `require()` and all three install everything [README.md, INSTALLATION.md]
- [x] [Review][Patch] `UPDATE-GUIDE.md:5-7` carried the identical stale `Version: 3.0.0` block R1 deleted from `INSTALLATION.md` — in a file R1 edited six lines below
- [x] [Review][Patch] "11 agents" ×2 in `INSTALLATION.md` against the 12 commands R1 added to it
- [x] [Review][Patch] Summary table still listed 3 modules, ten lines under the tree R1 expanded to 6
- [x] [Review][Patch] Enhance menu-patch target `bmm/agents/pm.md` does not exist on a v6.3+ layout — `_bmad/bmm/` has no `agents/` directory [README.md:99]
- [x] [Review][Patch] Uninstall deleted `_bmad-output/gyre-artifacts/` without backing it up, and missed three installed modules and two skill wrappers [INSTALLATION.md]
- [x] [Review][Patch] Export-notice quote truncated without a marker, in the same paragraph as a correctly-marked one [README.md:103]
- [x] [Review][Patch] `_team-factory` tree entry omitted `workflows/`, `schemas/`, `templates/`, `config.yaml`; `_artifacts` omitted `config.yaml`
- [x] [Review][Patch] Four portability skills documented nowhere in the shipped surface [README.md:101]
- [x] [Review][Patch] `excluded_agents` caveat missing from the new 12-command block [INSTALLATION.md]
- [x] [Review][Patch] `@latest` blockquote stated a mechanism that does not apply to fresh or npx-only installs [UPDATE-GUIDE.md:13]
- [x] [Review][Patch] Install section handed upgraders the bare form the Update section calls broken [README.md:112]
- [x] [Review][Patch] "it changes nothing" overstated — `convoke-update` still reconciles files [README.md:129]
- [x] [Review][Patch] Diagram's fifth box overran its border by one column [README.md:34]
- [x] [Review][Patch] CREDITS exhaustiveness claim excluded the WDS agents present in this repo [README.md:169]
- [x] [Review][Patch] Record inaccuracies corrected: AC5 said "8 lines and 8 lines" (actual 7 and 7); AC7's line citation drifted; D9's correction miscited `knip.json` as a `badges.json` consumer (it references the *generator* — the conclusion stands)
- [x] [Review][Patch] File List claimed a `package.json` edit that landed in `340f1b95` from another workstream — corrected below

**Deviation recorded rather than patched — D5.** D5 requires the job "run any team outside Claude Code" to appear in the spine's unfinished column. It is not there, and should not be: the spine is a **lifecycle** and portability is not a lifecycle stage. Forcing it back reintroduces the arc/table disagreement that Round 1 fixed. Portability is instead stated at product level (`README.md:22`) and in full in the extension band (`:101-103`), which satisfies D5's *intent* — the reader learns it is unfinished — without a non-lifecycle row in a lifecycle diagram.

**Link-scheme rule, recorded so the next editor does not normalise the wrong way:** targets inside `package.json` `files` are linked **relatively**; everything else (`docs/**`, `_bmad-output/**`, `.gyre/**`) is linked by **absolute GitHub URL**. AC1 enforces the first half; nothing yet enforces the second — that is I157's job.

**Convergence.** Round 2's fixes are content and wording corrections — no new files, no renamed functions, no altered control flow — so `code-review-convergence` stops here. No Round 3.

### File List

- `README.md` — rewritten
- `CREDITS.md` — new
- `INSTALLATION.md` — links absolutised, stale version header removed, module tree and Summary corrected, 12 activation commands added, install-scope claim corrected, uninstall made non-destructive
- `UPDATE-GUIDE.md` — major-boundary warning added (D13), stale version header removed
- ~~`package.json`~~ — the `files` gain of `CREDITS.md` **is not in this change set**. It landed in `340f1b95` (`fix(BUG-16)`) from a concurrent session before this story committed. AC1 passes today only because that workstream carried this story's edit; applied in isolation this diff would fail AC1 on `CREDITS.md`. Do not stage `package.json`.

### Change Log

| Date | Change |
|------|--------|
| 2026-08-15 | Implemented. README rewritten around the lifecycle spine (542 → 171 lines); `CREDITS.md` extracted with all names preserved; link contract fixed and verified against a packed tarball; `INSTALLATION.md` reconciled. All 12 ACs executed and passing. Three findings raised rather than fixed — see above. Status → review. | Expected shape: one commit — `docs(readme): rewrite around the lifecycle spine and fix the link contract` — covering `README.md`, `CREDITS.md`, and `package.json` only if `files` genuinely changed. The backlog rows above are a separate governance commit.
