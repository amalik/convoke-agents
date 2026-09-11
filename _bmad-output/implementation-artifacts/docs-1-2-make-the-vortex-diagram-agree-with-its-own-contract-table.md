---
baseline_commit: a6b9c6be
---

# Story 1.2: Make the Vortex diagram agree with its own contract table

Status: ready-for-dev

## Story

As a reader navigating the Vortex,
I want the flow diagram to route each handoff to the agent its contract table names,
so that I do not follow a picture to the wrong agent.

## Acceptance Criteria

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

- [ ] **Task 1 — Build the checks, red first (AC: 1, 2, 4, 5, 7)**
  - [ ] Create `scripts/audit/vortex-diagram-integrity.js` (namespace rationale in Dev Notes)
  - [ ] **Reuse, do not hand-roll:** `splitRow`, `isTableLine`, `isSeparator` from `scripts/audit/backlog-integrity.js` (exported `:1135`; the file has a `require.main` guard, so requiring it is side-effect free); `FENCE_RE`, `stripInlineCode` from `scripts/audit/lib/shipped-links.js` (defined `:107`, exported `:588`). Read that file's note on why `FENCE_RE` is deliberately **not anchored at column 0** — it permits leading whitespace — before writing any fence logic
  - [ ] Implement the render-width function **inline** — see the dependency trap in Dev Notes
  - [ ] Implement: routing (AC1), geometry diagnostic (AC2), no-box-art-in-`HC`-fences (AC4), completeness (AC5), corpus sweep (AC7)
  - [ ] **Run before touching anything. Paste the red output into the Dev Agent Record.** It must name HC9→Noah in all three files, HC7/HC10→Emma, the measured width spreads, ┌4/└3, **and the compass header box's short right edge at `:15`**
- [ ] **Task 2 — Confirm the Gyre diagram is a non-finding (AC: 6)**
  - [ ] Examine it; record why 61/60/60 is correct. **Do not edit it**
- [ ] **Task 3 — Close the two unresolvable commands (AC: 8)**
  - [ ] `for c in $(grep -oE '/bmad-[a-z0-9-]+' docs/agents.md | sort -u); do grep -q "^\"${c#/}\"," _bmad/_config/skill-manifest.csv || echo "UNRESOLVED: $c"; done`
  - [ ] Derive real ids from the manifest; re-run; paste the empty result
  - [ ] Record that `docs/faq.md:131-135` carries the same class and is 1.4's
- [ ] **Task 4 — Re-derive the surviving counts (AC: 9)**
  - [ ] The "Ten handoff contracts" and "10 handoff contracts (HC1-HC10)" sentences, against `AGENTS` and the tables
  - [ ] State that the "all seven" claims belong to Story 1.3
- [ ] **Task 5 — Record every anchor you are about to invalidate (AC: 9)**
  - [ ] Before converting, list the findings-note anchors pointing below `docs/agents.md`'s diagram fence. You re-derive them in Task 8
- [ ] **Task 6 — Convert the three box diagrams to mermaid (AC: 3, 4, 5)**
  - [ ] `flowchart` per `documentation-standards.md:88-97`; label every edge with its contract id
  - [ ] All 10 contracts, all 7 agents, in each of the three files
  - [ ] The three flowcharts must be **edge-identical**, verified mechanically
  - [ ] Re-run: routing, completeness, no-box-art and the corpus sweep all green
  - [ ] **Retire the geometry check** (AC2) in this same commit; it has no subject left
- [ ] **Task 7 — Tests (AC: 1, 2, 4, 5)**
  - [ ] `tests/audit/vortex-diagram-integrity.test.js`, **fixtures only** (`test-fixture-isolation`)
  - [ ] A red fixture per surviving assertion: mis-routed contract, truncated diagram, missing agent, box art inside an `HC` fence, a diagram outside the declared corpus
  - [ ] **A CJK fixture for the `W`/`F` width branch** — without it that branch is dead code
  - [ ] A fixture pinning **Ambiguous-width glyphs (`─ │ ┌ ▶ ◀ ▲ ▼ — ·`) as ONE column**
- [ ] **Task 8 — Update the findings note (AC: DoD)**
  - [ ] A1-A4 closed; add A5 (HC7/HC10), the two command findings, the compass header box, and the two shipped-file instances
  - [ ] Write coverage rows for **all three** files examined — the two `_bmad/bme/_vortex/` files have none today
  - [ ] Re-derive the anchors listed in Task 5, **after** the conversion
  - [ ] Do **not** touch aggregate totals, tier figures, or anchors into files this story is not editing — the freeze banner still binds those
- [ ] **Task 9 — Amend the epic (AC: DoD)**
  - [ ] RULING 1 moves the file count 13 → 15. The epic's amendment line still says 13, and Story 1.7's denominator is shaped for `docs/` and will not see `_bmad/bme/_vortex/**` — record who owns that
- [ ] **Task 10 — Wire it (AC: DoD)**
  - [ ] Add `"audit:diagrams": "node scripts/audit/vortex-diagram-integrity.js"` to `package.json`
  - [ ] Add a CI step in `.github/workflows/ci.yml` beside `node scripts/audit/name-registry-integrity.js` (`:209`), same job, same pattern
  - [ ] **This story wires it. Story 1.7 does not** — see Dev Notes
- [ ] **Task 11 — Verify and hand off**
  - [ ] `npm run docs:audit` → 0 · `npm run lint` → 0 (**real here**) · `npm test` → green · `npm run audit:diagrams` → 0
  - [ ] **`node scripts/test-runner.js tests/p0`** → green. `npm test` does **not** include `tests/p0`, and a p0 test live-reads one of the newly-in-scope files — see Regression risk
  - [ ] Commit plan with a Round 1 review record; `git diff --name-only` before staging

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

- [ ] `npm run docs:audit` exits 0. **Non-regression only, not evidence of accuracy** *(NFR3, verbatim)*.
- [ ] `npm run audit:diagrams` exits 0, **and runs in a workflow at HEAD** — demonstrated by the CI run on the branch, not by the script existing.
- [ ] Every finding recorded carries a reproducing command (NFR1) from an artifact the operator receives — never `.claude/skills/` (NFR8). **Noted so it is not raised as a fresh finding:** the routing check's source of truth is `docs/agents.md`, which does **not** ship. The findings are in shipped files; the command that reproduces them needs a development checkout. NFR1 is satisfied here by **git-tracked** reproducibility, which is the property NFR8 actually protects — unlike `.claude/skills/`, nothing here is gitignored.
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a).
- [ ] Findings note updated in the same commit (FR10), within the freeze carve-out: **this story's own rows** — all three examined files, two of which have no row today. Aggregates and foreign anchors stay frozen.
- [ ] `npm run lint` exits 0. **Unlike `docs-1-1`, this gate is real** — the story ships `.js` under `scripts/`.
- [ ] `npm test` green, including the new fixture tests and both width fixtures.
- [ ] `node scripts/test-runner.js tests/p0` green — **not covered by `npm test`**, and it live-reads `compass-routing-reference.md`.
- [ ] The epic is amended: file count 13 → 15, with Story 1.7's denominator gap recorded.
- [ ] Every check cited as evidence names how it was shown able to fail (NFR5) — for the three assertions that means the recorded red run, not a description of one.
- [ ] The record states explicitly that **geometry passing is not evidence routing is correct**, and that the Gyre non-finding is what proves the check discriminates.
- [ ] The three diagrams agree with each other, verified mechanically, not by reading.
- [ ] Commit plan emitted with a Round 1 review record (NFR4); reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-09-11 | Second independent review of the rewrite: 2 HIGH, 6 MEDIUM, 5 LOW, all applied. The rewrite's own new defects were consequences of the two rulings, not of the first round's corrections — `code-review-convergence`'s restructure trigger did **not** fire. Geometry check reclassified as a one-shot diagnostic that is **retired** after conversion (it would otherwise be a permanently vacuous gate, and the clause claiming otherwise was false); a no-box-art-in-`HC`-fences guard added as the permanent replacement; tasks **reordered** so every line-anchored task runs before the conversion that moves those lines; corpus made declared-plus-exclusions after a **fourth** copy was found in `_bmad-output/_archive/`; "verbatim" corrected to "same defects, richer variant"; column origin pinned 0-based; `tests/p0` surface added. |
| 2026-09-11 | Story created, then substantially rewritten after independent validation. Two operator rulings: all three files in scope (two of them ship; the epic scoped only the one that does not), and the box diagrams convert to mermaid per the repo's own documentation standard. Corrections to the first draft: the Gyre diagram is **not** defective (AC4), the routing check will legitimately report three reds not one (A5), `string-width`/`eastasianwidth` **are** in `node_modules` as transitive dev deps, Story 1.7 does **not** own wiring this check, and existing table/fence parsers must be reused rather than hand-rolled. |
