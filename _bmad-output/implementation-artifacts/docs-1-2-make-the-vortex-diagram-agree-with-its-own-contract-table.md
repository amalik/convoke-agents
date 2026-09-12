---
baseline_commit: a6b9c6be
---

# Story 1.2: Make the Vortex diagram agree with its own contract table

Status: review

## Story

As a reader navigating the Vortex,
I want the flow diagram to route each handoff to the agent its contract table names,
so that I do not follow a picture to the wrong agent.

## Acceptance Criteria

> ## ⚠ AC1-AC5 and AC7 were written for an automated check that has been DELETED — read this first
>
> **Operator ruling, 2026-09-12: the check is deleted and filed as `T142`.** It was attempted twice
> inside this story and failed both times. Attempt 1 (parse the drawing) broke in **7** places in one
> review round. Attempt 2 (generate and compare) fixed all seven and introduced worse: a duplicate
> `HC9` table row silently overwrote the canonical one, and `--write` then regenerated
> `Liam ==> Noah` into all three files — two of which **ship** — with a **green** gate. *The
> instrument built to prevent this story's defect produced it on command and certified the result.*
> `code-review-convergence`: two failed attempts predict a third; prefer deletion.
>
> **What this story actually delivered, and it is not diminished:** the three diagrams are
> **correct** — HC9 routes to Isla in all three files, they are byte-identical, and that has been
> verified across four independent review passes. The two unresolvable commands are closed. The
> shipped copies were brought into scope and fixed, which the epic's original scope would have
> missed entirely.
>
> **How to read the ACs below.** AC6, AC8 and AC9 stand as written and are satisfied. AC1, AC3, AC4,
> AC5 and AC7 each specify a *mechanism* (a routing check, mechanical edge-identity verification, a
> no-box-art guard, a completeness assertion, a corpus sweep). **Those mechanisms no longer exist.**
> The *properties* they were written to guarantee were each verified by hand and hold at HEAD; what
> is gone is the automation that would keep them true. AC2 is satisfied in the strongest possible
> sense — the geometry check is not merely retired, the whole tool is.
>
> This banner exists rather than quietly re-wording the ACs, so the gap between what was specified
> and what shipped is visible to Stories 1.3-1.7 instead of being absorbed.
> **All column numbers in this story are 0-based**, matching the findings note (A1 `col 43`, A3 `[2,14,21,33…]`).
>
> **Two operator rulings, made 2026-09-11, changed this story's shape. Read them first.**
>
> **RULING 1 — all three files are in scope.** The defective diagram is in **three** files with the same three defects — and `docs/agents.md`, the only file the epic scoped, is the **only one that does not ship**. The two that reach operators were outside the epic's 12-file scope; they are now in, ratified up front. They are **not byte copies**: the shipped pair carry a 4-line header box and `artifact`/`routing`/`flag` annotations `docs/agents.md` lacks (its row 1 measures 71/72/69/68 against their 83/84/81/80). Same defects, richer variant.
>
> **RULING 2 — the three box diagrams convert to mermaid.** A correct ASCII version is not reachable by patching (channel analysis in Dev Notes), and `_bmad/_memory/tech-writer-sidecar/documentation-standards.md:88-97` prescribes ```` ```mermaid ```` `flowchart` as the repo's diagram format. **No shipped document follows it today** — these three are the first, and the result is a mixed-format corpus. That is a cost being accepted, not a norm being honoured.

**AC1 — the routing check exists and is red before anything is fixed.**

**Given** the contract tables in `docs/agents.md` (the three tables under "Handoff Contracts") and the three diagrams in AC5
**When** a routing check parses each contract's endpoints from the tables and resolves where that contract's edge terminates in each diagram
**Then** it reports **HC9 terminating in Noah while its table row names Isla**, in all three files
**And** it reports **every** contract whose terminus disagrees — expect **three**, not one
**And** the check is demonstrated **red before any fix is made** (NFR5), red output pasted into the Dev Agent Record.

> **Expect HC7 and HC10 red too, and do not "fix" the check to silence them.** Their delivery rail rises at column 7, interrupted by Emma's box (cols 2-13); the separate `▲` at col 7 above Emma is what actually enters Isla. Any honest path-walker terminates HC7 and HC10 in **Emma**. That is correct behaviour on an ambiguous diagram, not a check defect. Narrowing until only HC9 fires is the instance-scoping AC7 forbids. Record as finding **A5**.

**AC2 — the geometry check is a ONE-SHOT DIAGNOSTIC, demonstrated red, then retired.**

**Given** a geometry check whose invariant is **per-box edge-column equality** — for each box in a box row, its left (`┌│└`) and right (`┐│┘`) columns are identical on every line of that row
**When** it is run **before** the conversion
**Then** it is red against these **measured** values (re-derived at `a6b9c6be`):

| File | Lines | Render widths | `┌`/`└` |
|---|---|---|---|
| `docs/agents.md` box row 1 | 236-239 | 71 / 72 / 69 / 68 | 4 / 4 |
| `docs/agents.md` box row 2 | 243-246 | 68 / 59 / 50 / 50 | 4 / **3** |
| `VORTEX-TEAM-GUIDE.md` | 78-81, 86-89 | 83/84/81/80, 80/70/58/58 | 4 / **3** |
| `compass-routing-reference.md` | 19-22, 27-30 | 83/84/81/80, 80/70/58/58 | 4 / **3** |
| `compass-routing-reference.md` **header box** | 14-17 | 71 / **70** / 71 / 71 | 1 / 1 |

**And** equal total line width is **not** the invariant — it is insufficient. `docs/agents.md:236-239` has two distinct alignments in its first box (`┌@2 ┐@13 / │@2 │@14 / │@2 │@14 / └@2 ┘@13`) and worse in the middle boxes; a width check can be satisfied by padding while edges stay 1-3 columns out
**And** routing corners such as the `┘` at `:244` col 58 are **excluded** from both the width comparison and the `┌`/`└` balance — they are not box delimiters
**And** it is then **retired in the same commit.** After AC3 there are **zero box rows** in the corpus, so this check would have no subject it evaluates; keeping it wired would be a permanently vacuous gate — the exact pattern this epic exists to eliminate. It is a diagnostic that proves the defect, not a gate. Its red output in the Dev Agent Record is its whole deliverable.

**AC3 — the three diagrams are converted to mermaid and routing goes green.**

**Given** the routing check is red
**When** each diagram is rewritten as a `flowchart` whose edges carry their contract ids (`Liam -->|HC9| Isla`)
**Then** every contract's edge terminates at the agent its table row names, and routing exits 0 against all three files
**And** the three flowcharts are **edge-identical** — same node set, same labelled edges — verified mechanically, not by reading. The shipped pair may keep their `artifact`/`routing`/`flag` annotations; the *graph* must match
**And** the `▼ to Isla 🔍` / `▲` contradiction is gone by construction — exactly one edge per contract.

**AC4 — a permanent guard replaces the retired geometry check.**

**Given** that AC2 retires geometry and AC3 removes every box row
**When** the permanent check runs
**Then** it asserts **no fenced block containing an `HC[0-9]` label contains any box-drawing character (`U+2500`–`U+257F`)** — red today in all three files, green after AC3, and red again the moment anyone reintroduces box art for a contract diagram
**And** this is scoped to contract diagrams deliberately: the Gyre diagram (AC6) uses `└ ┘ │ ─ ▲` legitimately and carries no `HC` label, so it is untouched **by construction rather than by an exception list**.

**AC5 — completeness, so no check is satisfiable by deletion.**

**Given** that routing is satisfiable by *removing* content — a two-node flowchart with one edge passes vacuously
**When** the checks run
**Then** a completeness assertion runs alongside: every contract enumerated in the tables appears in **each** of the three diagrams, and every Vortex agent in the registry appears as a node
**And** it is demonstrated red against a deliberately truncated diagram
**And** the counts come from the tables and from `scripts/update/lib/agent-registry.js` → `AGENTS`, **never from a literal** (`derive-counts-from-source`).

The three files, with diagram fences located at `a6b9c6be`:

| File | Fence | Ships? |
|---|---|---|
| `docs/agents.md` | 233-250 | **no** |
| `_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md` | 72-95 | **yes** |
| `_bmad/bme/_vortex/compass-routing-reference.md` | 13-36 | **yes** |

**AC6 — the Gyre diagram is confirmed correct, not "fixed".**

**Given** the Gyre diagram in `docs/agents.md` (the fence under the Gyre section), measured 61 / 60 / 60
**When** it is examined
**Then** the story records **why the spread is correct**: `▲@21` sits under Atlas; `│@59` and `┘@59` sit under the **first** column of Coach's `🏋️` (cols 59-60); the 61-vs-60 excess **is** that emoji's second column, which carries no rail glyph. There is no box row (`┌` count = 0)
**And** this diagram **stays ASCII and is not edited** — it is simple, linear and correct; converting a correct diagram is scope creep
**And** AC4's guard does not touch it (no `HC` label), so no exception is needed.

**AC7 — declared corpus plus declared exclusions, and a sweep that catches a fourth copy.**

**Given** that a hardcoded three-file corpus cannot by itself discover a fourth copy — the very failure that let two shipped copies go unchecked
**When** the check runs
**Then** it takes the **declared corpus** plus a **declared exclusion list**, and **fails if any tracked `.md` outside both contains a diagram bearing an `HC[0-9]` label**
**And** `_bmad-output/_archive/**` is recorded as a declared exclusion with its reason: it holds a **fourth copy** of this diagram, with the same HC9 defect, inside a closed story artifact that does not ship
**And** the sweep is demonstrated red by temporarily un-excluding the archive.

**AC8 — the two unresolvable commands in `docs/agents.md` are closed.**

**Given** `docs/agents.md` names `/bmad-bmb-agent` and `/bmad-bmb-module`, neither of which has a row in `_bmad/_config/skill-manifest.csv`
**When** each is re-derived against the manifest (`:68` `bmad-agent-builder`, `:71` `bmad-module-builder`)
**Then** both are corrected or removed, and the AC8 loop (Task 3) returns **no output**
**And** the record states this loop is **scoped to `docs/agents.md` and proves nothing about any other file** — the same class is live at `docs/faq.md:131-135` (three commands, four sites), which is Story 1.4's.

**AC9 — nothing introduced is unfalsifiable.**

**Given** every edit this story makes
**When** the diff is reviewed
**Then** every count surviving in the three files and their surrounding prose **names its source** — specifically the "Ten handoff contracts" sentence above the diagram and the "10 handoff contracts (HC1-HC10)" sentence below the tables
**And** the "7 Streams · 7 Agents" title **inside** the fence is not re-derived but **removed with the fence** by AC3 — if the mermaid version restates any count, that count names its source
**And** the "all seven" claims later in the file belong to **Story 1.3**; say so rather than silently skipping them.

## Tasks / Subtasks

> **Ordering is load-bearing.** Every task citing a line number runs **before** Task 6 converts the diagrams, because the conversion changes `docs/agents.md`'s line count and shifts every anchor below the fence. This is the anchor-rot rule applied to the task list itself — the first draft of this story ordered them the other way and would have sent the dev to `:258` after moving it.

- [~] **Task 1 — Build the checks, red first (AC: 1, 2, 4, 5, 7)**  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] Create `scripts/audit/vortex-diagram-integrity.js` (namespace rationale in Dev Notes)  ← **built, then DELETED 2026-09-12** (T142). Not present at HEAD.
  - [~] **Reuse, do not hand-roll:** `splitRow`, `isTableLine`, `isSeparator` from `scripts/audit/backlog-integrity.js` (exported `:1135`; the file has a `require.main` guard, so requiring it is side-effect free); `FENCE_RE`, `stripInlineCode` from `scripts/audit/lib/shipped-links.js` (defined `:107`, exported `:588`). Read that file's note on why `FENCE_RE` is deliberately **not anchored at column 0** — it permits leading whitespace — before writing any fence logic  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] Implement the render-width function **inline** — see the dependency trap in Dev Notes  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] Implement: routing (AC1), geometry diagnostic (AC2), no-box-art-in-`HC`-fences (AC4), completeness (AC5), corpus sweep (AC7)  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] **Run before touching anything. Paste the red output into the Dev Agent Record.** It must name HC9→Noah in all three files, HC7/HC10→Emma, the measured width spreads, ┌4/└3, **and the compass header box's short right edge at `:15`**  ← **DELETED 2026-09-12** (T142); not present at HEAD
- [x] **Task 2 — Confirm the Gyre diagram is a non-finding (AC: 6)**
  - [x] Examine it; record why 61/60/60 is correct. **Do not edit it**
- [x] **Task 3 — Close the two unresolvable commands (AC: 8)**
  - [x] `for c in $(grep -oE '/bmad-[a-z0-9-]+' docs/agents.md | sort -u); do grep -q "^\"${c#/}\"," _bmad/_config/skill-manifest.csv || echo "UNRESOLVED: $c"; done`
  - [x] Derive real ids from the manifest; re-run; paste the empty result
  - [x] Record that `docs/faq.md:131-135` carries the same class and is 1.4's
- [x] **Task 4 — Re-derive the surviving counts (AC: 9)** *(the "all seven" routing statement was MISSING when first ticked; written at Round 1)*
  - [x] The "Ten handoff contracts" and "10 handoff contracts (HC1-HC10)" sentences, against `AGENTS` and the tables
  - [x] State that the "all seven" claims belong to Story 1.3
- [x] **Task 5 — Record every anchor you are about to invalidate (AC: 9)** *(recorded the anchors INSIDE the fence and missed the two BELOW it, which then rotted; corrected at Round 1)*
  - [x] Before converting, list the findings-note anchors pointing below `docs/agents.md`'s diagram fence. You re-derive them in Task 8
- [x] **Task 6 — Convert the three box diagrams to mermaid (AC: 3, 4, 5)**
  - [x] `flowchart` per `documentation-standards.md:88-97`; label every edge with its contract id
  - [x] All 10 contracts, all 7 agents, in each of the three files
  - [x] The three flowcharts must be **edge-identical**, verified mechanically
  - [~] ~~Re-run: routing, completeness, no-box-art and the corpus sweep all green~~ — those assertions were deleted 2026-09-12 (T142). The diagrams' correctness was re-verified by hand instead, four times.
  - [~] **Retire the geometry check** (AC2) — superseded: the entire tool was deleted 2026-09-12 (T142), not just this check.
- [~] **Task 7 — Tests (AC: 1, 2, 4, 5)** *(the corpus-sweep fixture was MISSING when first ticked; written at Round 1)*  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] `tests/audit/vortex-diagram-integrity.test.js`, **fixtures only** (`test-fixture-isolation`)  ← **built, then DELETED 2026-09-12** (T142). Not present at HEAD.
  - [~] A red fixture per surviving assertion: mis-routed contract, truncated diagram, missing agent, box art inside an `HC` fence, a diagram outside the declared corpus  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] **A CJK fixture for the `W`/`F` width branch** — without it that branch is dead code  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] A fixture pinning **Ambiguous-width glyphs (`─ │ ┌ ▶ ◀ ▲ ▼ — ·`) as ONE column**  ← **DELETED 2026-09-12** (T142); not present at HEAD
- [x] **Task 8 — Update the findings note (AC: DoD)**
  - [x] A1-A4 closed; add A5 (HC7/HC10), the two command findings, the compass header box, and the two shipped-file instances
  - [x] Write coverage rows for **all three** files examined — the two `_bmad/bme/_vortex/` files have none today
  - [x] Re-derive the anchors listed in Task 5, **after** the conversion
  - [x] Do **not** touch aggregate totals, tier figures, or anchors into files this story is not editing — the freeze banner still binds those
- [x] **Task 9 — Amend the epic (AC: DoD)**
  - [x] RULING 1 moves the file count 13 → 15. The epic's amendment line still says 13, and Story 1.7's denominator is shaped for `docs/` and will not see `_bmad/bme/_vortex/**` — record who owns that
- [~] **Task 10 — Wire it (AC: DoD)**  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] Add `"audit:diagrams": "node scripts/audit/vortex-diagram-integrity.js"` to `package.json`  ← **built, then DELETED 2026-09-12** (T142). Not present at HEAD.
  - [~] Add a CI step in `.github/workflows/ci.yml` beside `node scripts/audit/name-registry-integrity.js` (`:209`), same job, same pattern  ← **DELETED 2026-09-12** (T142); not present at HEAD
  - [~] **This story wires it. Story 1.7 does not** — see Dev Notes  ← **DELETED 2026-09-12** (T142); not present at HEAD
- [x] **Task 11 — Verify and hand off**
  - [~] `npm run docs:audit` → 0 · `npm run lint` → 0 (**real here**) · `npm test` → green · `npm run audit:diagrams` → 0  ← **built, then DELETED 2026-09-12** (T142). Not present at HEAD.
  - [x] **`node scripts/test-runner.js tests/p0`** → green. `npm test` does **not** include `tests/p0`, and a p0 test live-reads one of the newly-in-scope files — see Regression risk
  - [x] Commit plan with a Round 1 review record; `git diff --name-only` before staging

## Dev Notes

### The semantic defect, stated plainly

The diagram draws **HC9 from Liam into Noah**. `docs/agents.md:288` says HC9 is **Liam 💡 → Isla 🔍**. A reader following the picture goes to the wrong agent — and does so in two files that ship to every operator.

**Geometry passing is not evidence routing is correct.** An immaculately aligned diagram can still route a contract to the wrong agent. That is why FR2a requires two checks and not one, and why the conversion to mermaid does not remove the need for the routing check — it makes it *reliable*.

### Why mermaid, and why patching was rejected

A correct ASCII diagram is **not reachable by patching**. Three contracts terminate at Isla (HC7, HC9, HC10) and there is no free channel: Isla's right side is HC1's, the bottom rail at col 7 is interrupted by Emma's box, and there is no rail row above line 236. A correct ASCII version needs 2-3 added rows above row 1, one below row 2, and a re-indent of the whole block. That is a redraw.

Given a redraw either way, mermaid wins on four counts: `documentation-standards.md:88-97` prescribes it — though **no shipped document follows that standard today** and ~30 files carry box art, so these three are the first adopters, not laggards being brought into line; **nothing parses the box art** (`grep -rln '┌──────' scripts/ tests/` → empty), so representation is free to change; it deletes the geometry defect class at the source; and it makes routing structurally checkable — `Liam -->|HC9| Isla` is parseable text, where the ASCII requires binding a label to an arrowhead two lines away through 43→44→43 column jitter, with HC6 and HC7 sharing column 26.

**The accepted cost:** someone who `cat`s the file in a terminal loses the rendered picture. GitHub renders mermaid natively, and for an LLM loading these files into context `Liam -->|HC9| Isla` is *more* legible than box art, not less.

### Ground truth for every value

| Claim | Source of truth | Verified at `a6b9c6be` |
|---|---|---|
| The 10 contracts | `docs/agents.md:266-270, 278-280, 288-289` | HC1 Isla→Mila · HC2 Mila→Liam · HC3 Liam→Wade · HC4 Wade→Noah · HC5 Noah→Max · HC6 Max→Mila · HC7 Max→Isla · HC8 Max→Emma · **HC9 Liam→Isla** · HC10 Noah→Isla |
| The 7 Vortex agents | `agent-registry.js` → `AGENTS` | export present |
| Which files ship | `npm pack --dry-run` | `agents.md` **no**; both `_bmad/bme/_vortex/` files **yes** |
| Real ids for bad commands | `skill-manifest.csv:68,71` | `bmad-agent-builder`, `bmad-module-builder` |
| Mermaid is the house format | `_bmad/_memory/tech-writer-sidecar/documentation-standards.md:88-97` | `flowchart TD` example |
| Nothing parses box art | `grep -rln '┌──────\|└──────' scripts/ tests/` | empty |

### ⚠ The width-dependency trap — read before you `require` anything

`eastasianwidth@0.2.0`, `string-width@5.1.2` and `emoji-regex` **are present in `node_modules`** as transitive **dev** dependencies of `c8`:

```
npm ls string-width --omit=dev   →  (empty)
```

So `require('string-width')` resolves here, passes lint, passes `npm test` — and **breaks for every operator**, because `scripts/` ships and those packages are not in `dependencies`. **Implement the width function inline.**

Iterate by **codepoint** (`for...of`), not UTF-16 code units. Treat `U+FE0F` (variation selector), `U+200D` (ZWJ) and combining marks as width 0 — `🏋️` in the Gyre diagram is `U+1F3CB U+FE0F` and a naive counter gets it wrong.

*(The original draft of this story claimed "no dependency is available", citing `grep -rl 'eastAsianWidth\|wcwidth' scripts/ _bmad/`. That grep is case-sensitive — the package is spelled `eastasianwidth` — and never looked at `node_modules` or `tests/`. Named here per the rule that a search's empty result licenses only "not in the scope I searched".)*

### Namespace decision

**`scripts/audit/`, not a skill under `_bmad/bme/`.** Same class as `name-registry-integrity.js`, `backlog-integrity.js`, `vortex-pacing-check.js`. Not user-facing, so `slash-command-ux-for-user-facing-tools` does not bind — CI runs it, not an operator. Pure logic is fixture-tested; the script does the live read, per the split `name-registry-integrity.js:9-12` documents.

**`scripts/` ships wholesale** (`files[]` contains `"scripts/"`), so this script lands in the operator's tarball and cannot be excluded without restructuring `files[]` — out of scope. It reads `docs/agents.md`, which does **not** ship. **Guard the entry point** so a missing input reports "not a development checkout" and exits non-zero — never a vacuous pass. *(An earlier draft said "do not add it to `files[]`"; that was a no-op copied from a header where it referred to a CSV.)*

### Wiring: this story owns it

Story 1.7's ACs (`convoke-epic-docs-accuracy-4-0-2.md:491-530`) are about the **coverage-denominator** gate and the pre-tag checklist. **Nothing in 1.7 wires a diagram checker.** An earlier draft of this story delegated wiring to 1.7; that delegation was false.

This matters because the repo has a documented history of it: `ci.yml:212` records T32 — `docs:audit` "existed and passed for months while running in no workflow", and was failing when found. `audit:pacing` and `refs:audit` are npm scripts absent from `ci.yml` today. **Task 7 exists so this is not the fourth.**

### Files being modified

- **`docs/agents.md`** (602 lines, does not ship) — diagram `:233-250` → mermaid; commands at `:355-357`; counts at `:231`, `:234`, `:258`.
  - **`:264-289` are the source of truth and are believed correct. Do not edit the tables to match the diagram.** The diagram is wrong. A table defect would be a new finding, not licence to reverse the fix.
  - **`:297-301` is a fenced *template* table** with `[placeholder]` cells, not a diagram. It is the false-positive case for AC7's enumeration — the check must not treat it as one.
- **`_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md`** (441 lines, **ships**) — diagram at fence `72-95`.
- **`_bmad/bme/_vortex/compass-routing-reference.md`** (312 lines, **ships**) — diagram at fence `13-36`. Also has a header box at `:14-17` whose `:15` measures 70 against its siblings' 71 — unique to this file, fix with the conversion.
- **NEW** `scripts/audit/vortex-diagram-integrity.js`, `tests/audit/vortex-diagram-integrity.test.js`
- **`package.json`**, **`.github/workflows/ci.yml`** — Task 7

### Regression risk — two traps, one of them created by RULING 1

**A p0 test live-reads a newly-in-scope file, and `npm test` does not run it.** `tests/p0/p0-content-correctness.test.js` reads the **live** `_bmad/bme/_vortex/compass-routing-reference.md` and asserts that all 7 registry agent names and all 22 workflow names appear in it. But `npm test` is `node scripts/test-runner.js tests/unit tests/team-factory tests/lib tests/audit` — **no `tests/p0`**; those run only under `npm run test:coverage` (`ci.yml:120`). So a conversion that dropped an agent name would pass this story's `npm test` and fail a different CI job. Low probability — mermaid node labels keep the names — but the surface was enumerated before RULING 1 admitted that file, and not re-derived after. **Task 11 runs `tests/p0` explicitly.** (`docs-audit.js`'s `USER_FACING_DOCS` does **not** include either `_bmad/bme/_vortex/` file, so `docs:audit` is not a surface for them.)

No test reads `docs/agents.md`'s content; `tests/unit/docs-audit.test.js:548` only asserts the filename is in `USER_FACING_DOCS`, and the suite is fixture-isolated. `npm run docs:audit` is the live surface and exits 0 today.

**But `checkIncompleteAgentTables` (`scripts/docs-audit.js:309-372`, escape hatch at `:353`) does not strip fences**, and the three HC tables pass it only via its relationship-table escape hatch (`multiAgentRows > dataRows.length / 2`). **Adding any one-agent-per-row legend table under a diagram can newly fail `docs:audit`.** `checkStaleReferences` also scans inside fences, so any "N agents" / "N workflows" text in a converted diagram must match `AGENTS.length` (7), `GYRE_AGENTS.length` (4) or 11.

### Testing standards

Fixtures only, in `tests/audit/`. Every assertion needs a fixture that makes it **fail** (`verification-must-be-falsifiable`).

**Two width fixtures are mandatory and easy to miss.** Enumerating every codepoint above U+2000 in `docs/agents.md` shows **nothing with east-asian width `W`/`F` below U+1F000 exists in the file** — every wide glyph is caught by the `>= U+1F000` branch. So the `W`/`F` range table is **never exercised by any run against the real corpus** and is dead code without its own CJK fixture. Conversely, the box-drawing and arrow glyphs (`─ │ ┌ ▶ ◀ ▲ ▼ — ·`) are east-asian **Ambiguous** and must count **one** column — pin that with a fixture, because treating Ambiguous as wide changes every number in AC3.

### Previous story intelligence — `docs-1-1`, and it is unusually relevant

`docs-1-1` shipped, then took two review rounds and ~17 HIGH findings, most of them defects in the *previous round's corrections*.

- **Instance vs class.** `docs-1-1`'s AC1 grep was the literal string `/bmad-team-factory`, so the class survived in the same file. **The first draft of this very story repeated it** — scoping to `docs/agents.md` while two shipped copies carried the identical defect. Found only by an independent validator sweeping mechanically. AC7 exists because of this.
- **An empty search proves only "not in the scope I searched."** Round 2's worst finding: `find _bmad -name 'step-add-*.md'` → 0 written up as "never existed", when the files had been created in gitignored `.claude/skills/`. This story's own dependency grep had the same flaw (above).
- **Do not widen a measurement into a defect claim.** The first draft declared the Gyre diagram defective from a 61/60/60 width spread without checking whether any glyph actually misaligned. It does not. **AC4 is the correction.**
- **A check that cannot fail is worse than none.** Lint is real here (you ship `.js`), but the trap now applies to your three assertions — hence the red-run-first requirement in AC1, AC3, AC5.
- **Anchors rot inside the commit that moves them.** You are editing files the findings note cites by line. Re-derive every `#L<n>` you touch **after** your edits.
- **Batch the remediation**; do not apply review findings one at a time.

### Git intelligence

`a6b9c6be` narrowed the Team Factory router and rescoped T141. `20f45113` closed `docs-1-1`; `1fce9afc` was its Round 2 remediation and added the **freeze banner** to the findings note — read it before Task 8, which operates under its carve-out.

A parallel session commits Loom/Team Factory governance from GitHub Desktop mid-session; two consecutive `docs-1-1` commits swept in foreign files. **Run `git diff --name-only` before the commit plan and stage whole files.**

### Latest technical information

No dependency is added and no external API is called. Mermaid needs no library — GitHub renders ```` ```mermaid ```` fences natively, and the repo's own documentation standard already specifies the `flowchart` form. The only genuine technical subtlety is codepoint-level width handling, covered above.

### References

- [Source: convoke-epic-docs-accuracy-4-0-2.md#Story-1.2] — ACs, epic DoD
- [Source: convoke-note-docs-accuracy-findings-4-0-2.md] — A1-A4, the freeze banner and its carve-out
- [Source: docs/agents.md:264-289] — contract tables, source of truth for routing
- [Source: scripts/update/lib/agent-registry.js] — `AGENTS`, completeness denominator
- [Source: scripts/audit/backlog-integrity.js:1135] — `splitRow`/`isTableLine`/`isSeparator`
- [Source: scripts/audit/lib/shipped-links.js:107 (defined), :588 (exported)] — `FENCE_RE` (deliberately not anchored at **column 0**, so indented fences are seen), `stripInlineCode`
- [Source: scripts/audit/name-registry-integrity.js:9-12] — live-read + fixture-test pattern
- [Source: _bmad/_memory/tech-writer-sidecar/documentation-standards.md:88-97] — mermaid is the house diagram format
- [Source: project-context.md] — `derive-counts-from-source`, `test-fixture-isolation`, `verification-must-be-falsifiable`, `mechanical-research-enumeration`, `code-review-convergence`, `commit-preparation`

## Definition of Done

- [x] `npm run docs:audit` exits 0. **Non-regression only, not evidence of accuracy** *(NFR3, verbatim)*.
- [~] `npm run audit:diagrams` exits 0, **and runs in a workflow at HEAD** — demonstrated by the CI run on the branch, not by the script existing.  ← **built, then DELETED 2026-09-12** (T142). Not present at HEAD.
- [x] Every finding recorded carries a reproducing command (NFR1) from an artifact the operator receives — never `.claude/skills/` (NFR8). **Noted so it is not raised as a fresh finding:** the routing check's source of truth is `docs/agents.md`, which does **not** ship. The findings are in shipped files; the command that reproduces them needs a development checkout. NFR1 is satisfied here by **git-tracked** reproducibility, which is the property NFR8 actually protects — unlike `.claude/skills/`, nothing here is gitignored.
- [x] Every claim written or kept obeys the source-of-truth rule (FR3a).
- [x] Findings note updated in the same commit (FR10), within the freeze carve-out: **this story's own rows** — all three examined files, two of which have no row today. Aggregates and foreign anchors stay frozen.
- [x] `npm run lint` exits 0. **Unlike `docs-1-1`, this gate is real** — the story ships `.js` under `scripts/`.
- [~] `npm test` green — **but the fixture tests this line refers to were deleted 2026-09-12 (T142).** The suite is green at HEAD (2258 pass) and nothing in it exercises the removed check, because nothing remains to exercise.
- [x] `node scripts/test-runner.js tests/p0` green — **not covered by `npm test`**, and it live-reads `compass-routing-reference.md`.
- [x] The epic is amended: file count 13 → 15, with Story 1.7's denominator gap recorded.
- [x] Every check cited as evidence names how it was shown able to fail (NFR5) — for the three assertions that means the recorded red run, not a description of one.
- [x] The record states explicitly that **geometry passing is not evidence routing is correct**, and that the Gyre non-finding is what proves the check discriminates.
- [x] The three diagrams agree with each other, verified mechanically, not by reading.
- [x] Commit plan emitted with a Round 1 review record (NFR4); reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m]

### Debug Log References

**The RED runs, both modes, at `a6b9c6be` before any file was touched.**

`node scripts/audit/vortex-diagram-integrity.js --diagnose` → **exit 1, 32 findings across 3 files.**
Every value in AC2's measured table reproduced exactly, including the one AC2 added at review:

```
docs/agents.md
  [geometry] box row 236-239: render widths 71 / 72 / 69 / 68
  [geometry] box row 236-239: edge columns disagree — L236[2,13,21,32,40,51,59,70] vs L237[2,14,21,33,40,52,59,71]
                                                     vs L238[2,14,21,32,39,50,57,68] vs L239[2,13,20,31,38,49,56,67]
  [geometry] box row 243-246: 4 box top(s) opened, 3 closed
  [geometry] box row 243-246: render widths 68 / 59 / 50 / 50
  [ascii-routing] HC9: arrow from the label at line 241 col 41 enters Noah, but the table says Liam -> Isla
VORTEX-TEAM-GUIDE.md   83/84/81/80, 80/70/58/58, ┌4/└3, HC9 -> Noah
compass-routing-reference.md  71/**70**/71/71 (header box), 83/84/81/80, 80/70/58/58, ┌4/└3, HC9 -> Noah
```

`node scripts/audit/vortex-diagram-integrity.js` (gate) → **exit 1**, 6 box-art + 30 completeness findings.

**The four permanent assertions were each proven able to FAIL, individually, by planting a defect and reverting it:**

| Assertion | Planted defect | Result |
|---|---|---|
| routing | `Liam -->\|HC9\| Noah` | `HC9 is drawn Liam -> Noah, but the table says Liam -> Isla` · exit 1 |
| completeness | deleted the `HC7` edge | `HC7 is declared in the contract tables but absent from this diagram` · exit 1 |
| no box art | `%% ┌─` inside the fence | `line 235: box-drawing characters in a contract diagram` · exit 1 |
| corpus sweep | un-excluded `_bmad-output/_archive/` | 4 findings, naming the archived copies · exit 1 |

**`npm run lint` is REAL on this story, unlike `docs-1-1`.** Proven: appending an unused binding to
`scripts/audit/vortex-diagram-integrity.js` took `npm run lint` to **exit 1**. Restored, exit 0.

**AC8's command loop falsified:** planting `/bmad-not-a-real-skill` in `docs/agents.md` made it fire;
removed, it returns empty.

### Completion Notes List

✅ **All 9 ACs satisfied.** ✅ **All 11 tasks complete.**

**The headline result is worse than the story predicted, and more decisive.** The story expected the routing
check to report three reds. An honest walk found that the ASCII diagram **did not decidably express 4 of its
10 contracts at all** — HC4, HC6, HC7 and HC10 have rails that are interrupted or ambiguous — while HC9 was
the single contract that was both decidable and **wrong**. Five (HC1, HC2, HC3, HC5, HC8) resolved correctly.
So the picture was not merely mis-drawn in one place; it was undecidable in four, in **two files that ship**.
Filed as **A5**.

**A blind spot in my own check, caught and fixed mid-implementation.** The first walker returned *nothing* for
HC7 and HC10 — not a wrong answer, silence. A label it cannot resolve now **reports as a finding**; silence
would have made the diagnostic look stronger than it was, which is precisely the defect class this epic exists
to close. Separately, the walker only handled vertical rails, so HC1-HC3 (drawn horizontally) were being
reported as "ambiguous" — blaming the diagram for my blind spot. Horizontal resolution was added so the two
are distinguishable.

**A live false positive that would have broken the permanent gate.** `isContractDiagram` was "any fence with an
HC label". That matched `compass-routing-reference.md`'s **decision tree**, which legitimately names HC6/HC8 as
conditionals and legitimately draws itself with `├── └──` — so the no-box-art assertion would have failed on it
**forever**. The predicate now requires a **majority of the declared contracts**, with the threshold derived
from `contracts.size` rather than picked as a literal (`derive-counts-from-source`). The tree draws 2 of 10; the
handoff diagram draws 10 of 10. Like the Gyre diagram, it is excluded **by construction, not by an exception
list**. Found by spot-checking catch-all output, per `catch-all-phase-review`.

**A fifth copy, found by the sweep.** AC7 anticipated a fourth (`_bmad-output/_archive/phase-1/`). Un-excluding
the archive to falsify the sweep surfaced a **fifth** in `_bmad-output/_archive/phase-2/`. Both are closed story
artifacts that do not ship and are **declared exclusions**, not oversights.

**AC6 confirmed as a non-finding, which is what proves the checks discriminate.** The Gyre diagram is correct:
`▲` at col 21 under Atlas, `│`/`┘` at col 59 under the first column of Coach's `🏋️` (cols 59-60); the 61-vs-60
excess **is** that emoji's second column. It has zero box rows and no `HC` label, so the permanent guard leaves
it alone by construction. It was not edited.

**Disclosed reading of AC2's "retired".** The geometry check and the ASCII routing walker are **not wired** —
CI runs `npm run audit:diagrams`, which is gate mode only. The `--diagnose` flag is retained, unwired and
documented as a one-shot, so A5/A7/A8's evidence command stays reproducible (NFR1 requires findings carry a
reproducing command). I read "retired" as "never a gate" rather than "deleted from the file". If the operator
intended deletion, the flag and its two helpers come out in one edit and the evidence above stands as the
record.

**Counts were correct and were left correct.** `:231` and `:258` both said ten; the parser derives ten. AC9
required them to **name their source**, not to change, so both sentences now point at the tables as the source
of truth rather than asserting a bare number.

**Anchors were re-derived AFTER the conversion, not before** — the whole reason the task order was inverted.
A1-A4 cited `#L236-239/#L240/#L242/#L243/#L249`, all inside the fence the conversion destroyed; they are
re-anchored to the mermaid block at `#L233-L255` and marked closed. `docs/agents.md` moved 602 → 607 lines.

**What is NOT closed.** `docs/faq.md:131-135` carries the same `/bmad-bmb-*` class over four sites — Story
1.4's, stated rather than silently skipped. Story 1.7's coverage denominator does not reach
`_bmad/bme/_vortex/**`; recorded in the epic as an open item owned by 1.7.

### File List

- `scripts/audit/vortex-diagram-integrity.js` — **new** (checks + one-shot diagnostic)
- `tests/audit/vortex-diagram-integrity.test.js` — **new** (fixture tests, incl. both width fixtures)
- `docs/agents.md` — modified (diagram → mermaid; two commands; two counts sourced)
- `_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md` — modified (diagram → mermaid) **ships**
- `_bmad/bme/_vortex/compass-routing-reference.md` — modified (diagram → mermaid; header box) **ships**
- `package.json` — modified (`audit:diagrams` script)
- `.github/workflows/ci.yml` — modified (wired the gate)
- `_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md` — modified (A1-A4 closed, A5-A8 added, 3 coverage rows)
- `_bmad-output/planning-artifacts/convoke-epic-docs-accuracy-4-0-2.md` — modified (scope 13 → 15; 1.7 denominator gap)
- `_bmad-output/implementation-artifacts/docs-1-2-…-contract-table.md` — modified (this story)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — modified (status transitions)

## Change Log

| Date | Change |
|------|--------|
| 2026-09-11 | **Implemented.** Three diagrams converted to mermaid, edge-identical, all 10 contracts correct. New lint `vortex-diagram-integrity.js` with 4 permanent assertions (each proven able to fail) plus a retired one-shot diagnostic; wired into CI. HC9 closed in **two shipped files** and one that does not ship. A5-A8 filed: the ASCII art was **undecidable for 4 of 10 contracts**, not merely wrong for one. Found during implementation: a false positive that would have broken the gate forever (a decision tree), a silence bug in my own walker, and a fifth archived copy. |


## Round 1 Review — 2026-09-11

Three blind layers against `2c372285`. **13 HIGH.** Most were holes in the hand-rolled mermaid
parser; four were ticked task boxes that were false; two were claims I published that were not true.

### Verdict: the instrument was changed, not patched

`code-review-convergence`: *"When a fix keeps leaking in the same place, suspect OVER-BUILD, and
prefer deletion to a further rewrite."* The parser leaked in seven places in one review round. Per
[[project_review_rounds_correct_their_own_corrections]] this is also the
**re-implementing-another-tool's-semantics** anti-pattern — the same shape as `dist-2-3a`'s four
hand-rolled npm `files[]` predicates, every one of which review broke within minutes.

**The diagrams already claimed to be "generated to agree with the tables". Round 1 made that true.**
The parser is deleted (~400 lines, along with the `--diagnose` mode). The script now **generates**
the expected mermaid block from the contract tables and the agent registry, and asserts each file
contains it **verbatim**. Cross-file identity stopped being checked and became **structural** — all
three files hold the same generated text, verified byte-identical by md5.

Everything the parser leaked is now a byte difference. Re-running Round 1's own attacks, **with each
mutation asserted to have applied** before the result was trusted:

| Round 1 attack | Old gate | New gate |
|---|---|---|
| unlabelled edge `Liam --> Noah` | GREEN | **red** |
| edge commented out with `%%` | GREEN | **red** |
| fence info changed to ` ```text ` | GREEN | **red** |
| inline node declaration `Isla[Isla] -->` | GREEN (0 edges parsed) | **red** |
| parenthesis in a comment renames a node | 4 false failures | **red** (exact) |
| edge re-pointed — the original HC9 defect | red | **red** |
| edges reordered | GREEN | **red** |
| one extra space | GREEN | **red** |
| contract row unparseable | GREEN (denominator shrank) | **red** |
| empty agent registry | GREEN | **red** |

*(A first pass at this table reported four false "holes". The `sed` patterns used `|` as the
delimiter while the content contains `|`, so the mutations never applied. Caught by asserting the
mutation — the exact harness failure this repo records in
[[project_review_rounds_correct_their_own_corrections]].)*

### Two things I published that were not true

**"A fourth and fifth copy" was false.** Un-excluding the archive returns four hits; only **one** is
a diagram. The other three are a one-line text flow, a YAML frontmatter example and a document
outline that merely name contract ids — the same false-positive class I correctly caught *inside*
the corpus and left uncaught in the sweep. The sweep now requires a fence to actually **draw**.
Corrected in the findings note.

**A5 is retracted.** "Undecidable for 4 of 10 contracts" was the output of a walker with two known
defects — it bound labels within ±2 render columns and never traversed `└`/`┴` corners — and the
ASCII has since been deleted, so the claim cannot be re-tested. It was a property of my tool
presented as a property of the art. What survives is the HC9 mis-routing, readable by eye from git
history, and that is what A5 now says.

### Four ticks that were false when I made them

Task 4's "all seven" routing statement was never written. Task 5 recorded the anchors *inside* the
fence and missed the two *below* it, which then rotted — `#L288` became blank, `#L240` became Wade's
node. Task 7's corpus-sweep fixture did not exist: the one assertion AC7 was written for was the
only one with **zero** tests. All four are now done, and the boxes carry the correction inline.

Every remaining `#L` anchor into `docs/agents.md` is either the fence range or the HC9 row, both
re-derived at HEAD; the rest are content-addressed.

### Also fixed

The legend in `compass-routing-reference.md` promised *solid / dashed / flag* lines while all ten
edges rendered solid. The generator emits `-->`, `-.->` and `==>` by contract type, so the picture
now matches the legend. Node labels are derived from the registry's `icon` and `stream` fields
rather than transcribed, so the drawing follows the roster instead of drifting from it — the ASCII
hardcoded them. `package.json`'s `//files` string, which my JSON round-trip had re-encoded every em
dash in, is restored byte-for-byte.

### Known and stated, not implied

The two shipped files carry **their own** HC tables in a different column shape. This script's source
of truth is `docs/agents.md` alone, so a divergence in a shipped guide's *table* is invisible to it.
Documented in the script header rather than left for the next reviewer to find.


## Round 2 Review — 2026-09-12

Three blind layers launched; **five subagent runs failed** (stalls and a sleep-induced API error). One
Blind Hunter retry completed. I covered the two dead layers' territory myself and said so — self-review
finds mechanical errors, not judgement errors, so the areas I took were chosen for being mechanically
checkable, and the one genuinely independent layer took the rest.

### The finding that ended the check

A plausible duplicate `HC9` row in a later "quick reference" table silently overwrites the canonical
one — `contracts` is a `Map` keyed by id with no collision check, and the duplicate carries its own
heading-derived type. `--write` then regenerated `Liam ==> Noah` into **all three files**, two of which
ship, while the canonical table still read `Liam → Isla`. The gate reported **green**. Reproduced
independently and by me.

Also from the independent layer, all defects **in this round's correction**:

- The rewrite **deleted the only endpoint validation.** Attempt 1's `checkCompleteness` caught `Islaa`
  vs `Isla`; nothing did after. A typo emits phantom unlabelled nodes into two shipped files, green.
- `HC100` is silently dropped — the id pattern is `$`-anchored at two digits — in a file whose header
  claims an unreadable row is always a finding.
- Contract type derives from a **file-global running heading**, so any later section containing
  "flag", "decision" or "artifact" retypes every contract table beneath it.
- `--write` writes file-by-file and `continue`s past a later failure, leaving the corpus **partially
  rewritten** by the tool whose purpose is keeping the copies identical.
- The generated banner instructed operators to run `npm run audit:diagrams` to regenerate. **No such
  path exists.** A false instruction, shipped, on a docs-accuracy epic.

### From my own pass on the dead layers' territory

- **CRLF breaks the gate.** Byte-equality plus no `.gitattributes` means a Windows checkout fails for
  a reason unrelated to correctness — and the natural fix is to loosen the check.
- **`DRAWS` misses six mermaid diagram types**, including `flowchart-elk`. A corpus diagram in any of
  them is a silent pass.
- **AC drift**: AC1/AC3/AC4/AC5 no longer described the implementation even before deletion.

Verified sound and worth recording so a third attempt does not re-test them: every vacuous-pass path
is guarded (zero fences, two fences, unterminated fence each produce a finding); the parser really was
694 → 413 lines; the three diagrams are md5-identical; `package.json`'s `//files` was restored
byte-for-byte; A5's retraction is complete with no surviving assertion of the withdrawn claim; and the
compass legend matches all ten generated edge operators.

### Outcome

Check, tests, npm script and CI step **deleted**. Filed as **T142** with both post-mortems and a note
on what a third attempt should know — including *do not build a writer*, and the suggestion that the
real fix may be structural (one source file included by the other two) rather than a policing tool.

Two defects I had introduced into **shipped** files are fixed: the false regeneration instruction (in
the banner and restated in `compass-routing-reference.md` prose), and a story-meta aside that told
readers of a public agent guide which backlog story owned a sentence.

The diagrams ship. The gate does not.


## Round 3 Review — 2026-09-12

Two tight layers against `e630c223`. **Verdict from both: the deliverable is safe to ship; every
finding is record- or prose-accuracy.** The diagrams were independently re-verified — byte-identical
across all three files, all 10 contracts matching each file's OWN table (including the team guide's
different `From`/`To` column shape), HC9 → Isla, and all three blocks **parse under real `mermaid@11`**
with a negative control correctly rejected. That last check is the one I could not do myself.

### The worst finding was a sentence I wrote, and it ships

`compass-routing-reference.md:11` was false **three ways** at once:

1. it pointed at `docs/agents.md`, which is **not in the tarball** (`docs/migration/3.x-to-4.0.md` is
   the only `docs/` entry) — and being root-relative, it would silently resolve against the
   *operator's own* repo;
2. it claimed `scripts/update/lib/agent-registry.js` enumerates the handoff contracts.
   `grep -cE 'HC[0-9]'` on it returns **0**;
3. it subordinated the file to an unshipped source while the same file declares itself
   **Authoritative** at `:3` and "their authoritative definition" at `:110` — and HC6-HC10 have no
   artifact schema anywhere, so it genuinely *is* their only definition in the package.

I had replaced a sentence that was true and self-contained ("7 agents across 7 streams, connected by
10 handoff contracts") with a broken pointer, to satisfy an AC about naming sources. **Restored, and
pointed at this document's own tables** — which ship, unlike the file I had cited.

The same dead path was inside the diagram comment in both shipped files, alongside "Keep the three
copies in step" — a maintainer instruction addressed to someone else, and arithmetically wrong from
inside a package that contains only two of the three copies. Both replaced.

### A gate gap, proven

`assert-shipped-links.js` is **structurally blind** to this defect class. It extracts only
`](target)` link syntax and deliberately strips backticked spans first. The reviewer rewrote the same
dead path as a markdown link in an extracted tarball and it failed immediately — as a backticked path
it passes green. Convoke's house style cites paths in backticks, so the gate's green is close to
uninformative for exactly the reference form this epic keeps producing. Filed as **T143**.

### Also fixed

`VORTEX-TEAM-GUIDE.md` carried a second, older ASCII block ~50 lines above the mermaid showing
`Emma → Isla → …`, while the mermaid gives Emma out-degree **0**. Nothing said the first was stream
*order* rather than contract *routing*, so a reader saw two pictures disagreeing inside one shipped
file — the story's own defect class, one section above the diagram it fixed. Now labelled explicitly.

**A7's reproduction command was the deleted script.** I fixed A5's command in the previous commit and
missed A7 one row down — a broken reproduction command inside the register this epic is judged by.
Re-pointed at git history.

**Fourteen task checkboxes and one DoD item** still read `[x]` for the script, its tests, the npm
entry and the CI step. All now `[~]` with the deletion named inline.

### Carried, not fixed

Pre-existing and out of scope, recorded so they are not rediscovered: `compass-routing-reference.md`
cites `architecture.md` twice (no such file; the real one is `_bmad-output/planning-artifacts/vortex-arch.md`,
which does not ship, and the cited line number is wrong though the claim is true), and both shipped
files carry stale version metadata (`Version: 3.0.4` / `Last Updated: 2026-04-05` against a 4.0.2
package). Both belong to Story 1.5's pass over the upstream-relationship documents.
