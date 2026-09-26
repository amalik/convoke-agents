---
baseline_commit: f83cdfd6
---

# Story s4-1.1: The `convoke` hub that puts the bootstrap in the channel

Status: ready-for-dev

**Epic:** [s4 — The `convoke` Channel Hub](../planning-artifacts/convoke-epic-s4-channel-hub.md)
**Ruling:** [ADR-001 — the distribution unit](../planning-artifacts/adr/channel-integrity/adr-001-the-distribution-unit.md), accepted 2026-09-26. **C10** names the hub `convoke`; **C11** fronts rather than absorbs; **C5** is why it is the move.
**Evidence:** [channel-integrity findings](../planning-artifacts/convoke-note-channel-integrity-findings-2026-09-26.md)
**Namespace decision:** Convoke-owned, and specifically a **tracked skill directory at `.claude/skills/convoke/`** per the `bmad-register-skill` / `bmad-audit-skill-dirs` precedent. Not upstream BMAD (this bootstraps *Convoke's* runtime). Not a generated wrapper — see §The placement is already decided, which corrects an earlier draft of this story.
**Safety analysis (`path-safety-for-destructive-ops`):** **in scope** — the hub invokes `convoke-install` and `convoke-update`, which write into an operator's project. See §Safety Analysis.

> **This story was rewritten 2026-09-26** after an independent validation pass. The first draft
> put the hub behind a `standalone: true` generated wrapper and built its central open question
> on a miscount. Both were wrong, and the corrections are recorded inline rather than dropped,
> because each one is a trap the dev agent would otherwise re-enter.
>
> ## ⛔ Then reviewed twice more, and it is BLOCKED ON FOUR OPERATOR RULINGS
>
> `ready-for-dev` here means only what the vocabulary defines it as — *the story file exists*. **Do
> not start implementation.** Two further independent reviews (one checking the rewrite, one with no
> prior context) found ~14 findings, and they converge on one thing: **this story is carrying
> decisions it has no authority to make.** Naming them is the fix; a third rewrite is not.
>
> 1. ~~**C8 — does merging this story publish?**~~ **RULED 2026-09-27: Amalik accepts publishing the
>    name `convoke`.** Merging does publish — tracking under `.claude/skills/` makes the name
>    publicly indexable with no retraction path — and that risk is accepted. C8 is satisfied here by
>    an operator-accepted risk, **not** by a check: its *checkable* half stays open because the gate
>    it needs is forbidden by C1's spent budget (ADR-001 C8). **Note what is and is not locked:** the
>    unretractable artifact is the frontmatter `name`, which skills.sh keys listings on — so the
>    *location* below remains free to change without a second irreversible act.
> 2. **Markdown-only, or a Node detector?** AC10 makes the detector conditional because markdown has
>    no `process.exit`/`throw`/`chalk`; AC12 then demands exit-code and swallowed-throw proof
>    unconditionally. **They contradict.** The precedent skills are a six-line `SKILL.md` plus a
>    `workflow.md`, which pushes markdown-only — and then AC12 and Task 6 have no subject.
> 3. **Location, given PR #9.** `.claude/skills/convoke/` is a **third** destination. PR #9 was
>    closed 2026-04-27 on a structural rejection — *"needs `skills/` at root"* — and `I80` wants
>    `_bmad/bme/`. Placing the hub here may mean moving it twice.
> 4. **Is doctor coverage owed?** Task 3's row-vs-no-row dichotomy is **false in both branches**:
>    `checkModuleSkillWrappers` only looks up manifest rows for workflows enumerated in a discovered
>    module's `config.yaml`, so for a non-workflow skill a row is inert. Neither precedent skill has
>    one. The real question is whether the hub needs doctor coverage at all, through what mechanism.
>
> **Known defects in the text below, not yet fixed** (held as one batch pending the rulings, because
> piecemeal patching is what produced this round): AC3 pins the wrong command — it must be
> `npx -p convoke-agents convoke-install` (`README.md:108`), since `npm install` alone does not create
> the runtime; **six ACs (AC4–AC9) cannot be falsified by any test** and no task verifies them;
> **OC-R6 has no AC at all** while AC4 expands its surface to three CLIs that AC10 forbids touching,
> which `project-context.md:141` alone makes a blocker for ready-for-review; AC11 misses that
> `trackedSourcesAt()` is `git ls-files _bmad/bme`-scoped, so its resolver would emit a false
> `source/untracked`; AC1 must enumerate **every** file the hub ships, because
> `skills-packaging.test.js` asserts `deepEqual`, not membership; the plugin-cache quote in
> §"The placement is already decided" is **misapplied** — the plugin's `source` is `"./"`, so
> `_bmad/bme/` is inside the plugin directory, and the real reason is `{project-root}` resolution,
> which the next clause states correctly; and the upstream `bmad-prd` quote is verbatim but must be
> cited as a URL at `bmad-code-org/BMAD-METHOD@main`, since no such local path exists and the
> installed copy is a different file.
>
> **`s4-1-2` is blocked by a gate nobody named:** `validate-marketplace.js` enforces set identity
> between `marketplace.json` `skills[]` basenames and `AGENT_IDS`, proven by execution to fail with
> *"unexpected skill path(s): convoke"*. That step is `ci.yml:206`, inside `agent-surface-parity`,
> which is in `publish.needs` (`ci.yml:666`).

## Story

As **an operator who reached Convoke through a channel rather than through npm**,
I want **the skill I installed to tell me what is missing and the command that gets it**,
so that **I am not left with a persona that cannot act and no idea why.**

## Root cause

Convoke's runtime bootstrap is a `bin` entry in `package.json`. **The thing that builds the
runtime is not itself in the channel.** ADR-001 C5 records the consequence as one defect with
three faces: Gyre cannot travel, a skill arriving alone cannot repair itself, and the manifest
publishes seven agents by accident rather than a product by design.

## The placement is already decided — and the earlier draft had it wrong

**The hub is a tracked, self-contained skill directory.** The repo already ships two of exactly
this artifact class, and `.gitignore:51` states the policy:

> Exception: operator-tooling slash-command skills shipped via npm-pack must be tracked.
> A skill exempted below MUST also be added to `package.json` `files[]` and to `EXPECTED` in
> `tests/lib/skills-packaging.test.js`… **Exempting one here and stopping is what kept
> `bmad-register-skill` out of every published tarball from 2026-04-25 to 2026-09-17.**

Three reasons this is not a preference:

1. **A generated wrapper cannot serve `s4-1-2`.** `marketplace.json` `skills[]` entries point at
   **tracked repo directories**; generated `.claude/skills/` wrappers are gitignored and never
   enter the tarball. The manifest story literally cannot declare a generated wrapper.
2. **A `standalone: true` wrapper is self-defeating here.** That shape produces a *thin*
   `SKILL.md` that loads `{project-root}/_bmad/bme/<mod>/workflows/convoke/workflow.md` — a file
   absent **by definition** in the absent-runtime case this hub exists to handle. A plugin is
   copied to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` and *"files outside the
   plugin directory are not copied"*. The hub must be self-contained.
3. **It needs no `refresh-installation.js` change at all.**

**Moving these skills into `_bmad/bme/` with a copy step is `I80`** (open, 4.5) — named by the
same `.gitignore` comment. **Out of scope here.** This story follows the shipped precedent; it
does not pre-empt I80.

### A miscount the first draft made, corrected

It claimed *"three near-duplicate branches predict a fourth."* **There are two.** `6d` Artifacts
(`refresh-installation.js:951`) and `6d-bis` Portability (`:992`) are near-duplicates. `6c`
Enhance (`:905`) is **structurally different**: `_bmad/bme/_enhance/config.yaml` carries no
`standalone:` key at all, so 6c does not gate on the flag, synthesizes
`bmad-enhance-${workflow.name}`, appends rows to **two** manifests, and does **no**
remove-then-copy. Folding 6c into one loop would impose the flag on Enhance, stop generating
`bmad-enhance-initiatives-backlog`, and go red at `validator.js:607-609`. **Recorded because the
dev agent must not "de-duplicate" three things that are two.**

## Acceptance Criteria

**AC1 — the hub is a tracked, self-contained skill directory.** `.claude/skills/convoke/`, git-tracked
via the step-wise `.gitignore` exemption, **and** in `package.json` `files[]`, **and** in `EXPECTED`
in `tests/lib/skills-packaging.test.js`. All three, or the tarball omission recurs exactly as the
`.gitignore` comment records it.

**AC2 — no `{project-root}` read at activation time.** Every path the hub needs before the runtime
exists is inside its own directory. A relative `[workflow.md](workflow.md)` is correct here, as in
`bmad-register-skill/SKILL.md:6`, **because both files are tracked and co-located** — the opposite of
the generated-wrapper rule in §Dev Notes.

**AC3 — it names the acquisition command, literally.** Not a local binary: an operator who reached
Convoke through a channel has **no** `convoke-install` on PATH — `command not found` for precisely
this reader. The command is `npm install convoke-agents@latest` (`README.md:107`). This is the lesson
of the upstream snippet quoted in §Dev Notes, which names an *acquisition* command, not a local one.

**AC4 — OC-R0 first, as a mandatory precondition.** The 3-layer interaction surface is enumerated in
this file before any other right is answered, with each layer-3 entry carrying `(internal)` or
`(external)`. The three fronted binaries are **`(internal)`**, so `N/A — external-declared` is
unavailable, and per the checklist *"or any underlying script it invokes"* **their** error strings
land in the hub's OC-R6 surface.

**AC5 — OC-R2 and OC-R4 on the runtime scan.** The hub *scans* for runtime components, so it reports
total scanned + matched + excluded, with a count and a per-class reason for exclusions. "Names the
missing component" (singular) is Scar 2 restated and fails both.

**AC6 — OC-R3 at 100% of decision points.** *"Any single missing instance = FAIL."* Every decision
point carries a sentence naming consequence, trade-off or downstream effect — not one sentence at one
point.

**AC7 — OC-R1: a default, never a refusal.** `skip`/`abort` are exits, not fallback values, and
count as **FAIL**.

**AC8 — OC-R5 with a *literal* halt marker.** One of the checklist's accepted strings must appear
near the prompt: `HALT`, `HALT and wait for user input`, `ALWAYS halt and wait for user input` in a
MANDATORY EXECUTION RULES block, or `HALT for input.` / `Wait for user input.` / `WAIT for operator
input` standalone after a menu. *"A menu with no literal halt statement on a following line = FAIL."*
**Prose about waiting fails this AC.**

**AC9 — OC-R7: ≤ 3 novel concepts per interaction round.** The hub's vocabulary (runtime, module,
wrapper, channel, bootstrap, hub) exceeds the budget in one block as drafted. Stage it or drop terms.

**AC10 — it fronts once present, and never hard-fails.** It invokes the existing
`convoke-install` / `convoke-update` / `convoke-doctor` **when they exist** (C11 — no CLI logic is
reimplemented or moved); when they do not, AC3's command is the answer. **Rule which artifact carries
the soft-warn contract:** `preflight-soft-warn` binds *preflight helpers* through `process.exit`,
`throw` and `chalk.yellow` — **Node APIs a markdown `SKILL.md` does not have.** If a Node detector
ships with the hub, it follows `scripts/update/lib/compat-preflight.js` (already stderr +
`chalk.yellow` + exit 0) and is exempt from this AC's no-CLI-logic clause; if not, this AC is the
skill-level analogue and **the scope extension is recorded here**, not assumed.

**AC11 — the registry row flips, and A2's hole actually closes.** Flip `skill,convoke` in
`_bmad/bme/_config/name-registry.csv` from `proposed` to `in-dev`, **and add a separate
`checkSkillSources()`** with its own path resolver, its own counter and its own message. **Removing
the `kind === 'agent'` test at `name-registry-integrity.js:255` is not sufficient:** three lines later
`byName.get(...)` is built from `agent-registry.js`, which has no `convoke`, so `if (!agent) continue`
skips the row anyway and A2 stays vacuous while the check prints PASS. Also: **A3 must not run on the
row** (`checkAgentSources` is A2+A3 in one loop and would demand `bmad-bme-agent-convoke`); `:309`
hardcodes `['_bmad','bme',moduleDir,'agents',…]`, and the row's `declared_in` is
`channel-integrity-adr-001`, a provenance, not a module — **nothing in the row locates a `SKILL.md`
today**, so the resolver and the convention must both be stated. A4 and A1 are safe (verified). The
PASS line and v5 count are agent-denominated and must not claim the skill row.

**AC12 — the soft-warn is proven in both directions.** Runtime **absent** ⇒ warning emitted **and**
exit 0. Runtime **present** ⇒ exit 0 **and no warning**. Plus a thrown-error case proven to be
swallowed. *"Exits 0 and emits the warning"* alone is satisfied by a detector that always warns —
**the fixture cannot distinguish the guard from its relaxation.** Record a mutant → sole-executing-test
table, not a pass count.

**AC13 — no new ADR, registry or CI check.** ADR-001 C1; the baseline budget is spent.

## Tasks

1. Author `.claude/skills/convoke/SKILL.md` (+ `workflow.md`) self-contained (AC1, AC2), satisfying
   AC3–AC10 in its activation block.
2. Wire all three tracking sites in one change: `.gitignore` step-wise exemption, `package.json`
   `files[]`, `EXPECTED` in `tests/lib/skills-packaging.test.js` (AC1).
3. **Decide the `skill-manifest.csv` question and write the decision down.** It is the **opt-in
   marker** for doctor's wrapper check (`scripts/convoke-doctor.js:416-419, 463-473`). **No row ⇒
   `convoke-doctor` silently skips the hub** — the same presence-only hole AC11 exists to close. **A
   row ⇒** doctor reports a missing wrapper in the dev tree, where `isSameRoot` suppressed
   generation. **Never repoint `path` at gitignored `.claude/skills/`** — that is the candidate-list
   trap that has caught four attempts.
4. Front the three binaries when present; name AC3's command when absent (AC10).
5. `checkSkillSources()` + the registry row flip, with a test for each (AC11).
6. Tests per AC12, in an isolated fixture directory (`test-fixture-isolation`, `{ cwd: tmpDir }`).
7. Gates: `npm test`, `npm run refs:audit`, `npm run docs:audit`,
   `node scripts/audit/name-registry-integrity.js`, `node scripts/audit/backlog-integrity.js`,
   **`node scripts/audit/skill-manifest-integrity.js`** (`ci.yml:184`),
   **`node scripts/audit/validate-marketplace.js`** (`ci.yml:206`), and
   **`tests/lib/skills-packaging.test.js`**.

## Safety Analysis

**The hub invokes writers.** `convoke-install` and `convoke-update` write into the operator's
project. The hub must not run either without AC7's accept-or-override and AC8's literal halt. An
auto-advancing hub would write to a project on activation — the Covenant violation the rights exist
to prevent, in the one skill most likely to be run by someone who has never seen Convoke.

**AC1's shape reduces the blast radius rather than adding to it.** A tracked directory needs no
`fs.remove(destSkillDir)`; the two generated branches each delete a directory derived from a
config-supplied `workflow.name` before copying. Choosing the tracked shape means this story adds no
new recursive-remove path.

## Dev Notes

### The reference implementation, verbatim, and the lesson to extract

Upstream `skills/bmad-prd/SKILL.md` step 1:

> Script not found: BMad is not set up here. Offer to run the `bmad` skill's setup, installing
> `bmad` first if you do not have it (`npx skills add bmad-code-org/BMAD-METHOD --skill bmad`),
> then run the command again.

It names the condition, the missing component, and an **acquisition** command — not a local binary —
and it **offers** rather than refuses. That is AC3, AC7 and AC10 together.

### The absolute-path rule applies to *generated* wrappers, not to this story

`6d-bis`'s own comment records why generated wrappers need absolute `{project-root}` paths: *"the
generator copies SKILL.md **ALONE**… A relative link would resolve inside `.claude/skills/<name>/`,
where no `workflow.md` exists."* **For a tracked, co-located skill the rule inverts** — relative is
correct, exactly as `bmad-register-skill/SKILL.md:6` does it. The first draft of this story promoted
the generated-wrapper rule to a universal mandate; that would have broken AC2.

### Reuse, so nothing is reinvented

- `scripts/update/lib/compat-preflight.js` is the in-repo soft-warn reference: stderr +
  `chalk.yellow` + exit 0.
- `validator.js:642` already has `validateStandaloneWorkflowModule(projectRoot, {label, dirRel})`,
  called twice — the generalisation I80 would want already exists one file away.
- `scripts/audit/vortex-pacing-check.js` already asserts rounds == footers == halt markers and
  N ≤ 3 — the mechanical form of AC8 and AC9, currently Vortex-scoped and not in CI.

### Out of scope, stated so it is not drifted into

- **Absorbing the three CLIs** — C11 defers it.
- **Moving tracked skills into `_bmad/bme/`** — that is `I80`.
- **`.claude-plugin/marketplace.json`** — `s4-1-2`, and it must **follow** this story.
- **Publishing.** ~~This story can be built and merged without unblocking C8.~~ **RETRACTED
  2026-09-26 — that was false, and it was the most consequential error in this file.** `.claude/skills/`
  is entry #435 in the `npx skills` CLI's own container-directory list, and the two existing tracked
  skills sit one level inside it, within the three-level walk. The findings note counts them in the
  live public surface for exactly that reason (2 tracked + 7 manifest = 9). **So the moment
  `!.claude/skills/convoke/` lands in `.gitignore`, the surface becomes ten and the name `convoke` is
  publicly indexable — and there is no self-serve retraction.** C8 is therefore a **merge**
  precondition for this story, not a publish one.
