---
baseline_commit: 813e4e3f
---

# Story cir-1.3: Make a skill that arrives alone say so

Status: ready-for-dev

**Epic:** [cir — Channel-Integrity Remediation](../planning-artifacts/convoke-epic-channel-integrity-remediation.md)
**Ruling:** [ADR-001 — the distribution unit](../planning-artifacts/adr/channel-integrity/adr-001-the-distribution-unit.md), **Amendment 1** (2026-09-27) — **A1.1** both channels are non-reference and disclaimed, **A1.3** the disclaimer is a flat notice plus a pointer, **A1.5** four descriptions are too short to match on.
**Re-scoped 2026-09-28 by operator ruling.** See §What this story used to be.
**Namespace decision:** Convoke-owned. Every edit is frontmatter or body prose inside `_bmad/bme/_vortex/agents/*/SKILL.md`, which `files[]` ships. No upstream BMAD file is touched, no script changes, no new skill. The `covenant-compliance-for-convoke-skills` rule applies: these are operator-facing surfaces on shipped skills.
**Safety analysis (`path-safety-for-destructive-ops`):** **not in scope.** Nothing in this story deletes, moves or writes in an operator's tree; no script gains a path argument. Recorded rather than omitted, because the rule asks for the analysis and not for its conclusion.

---

## What this story used to be, and why it changed

This slot was **defect 1 — a skill that arrives alone fails without saying so**, to be closed by a Convoke
skill *detecting* an absent runtime during activation and naming the command that obtains it.

**Amendment 1 changed what the channels are for**, and with it what "say so" has to mean. The channels are
now **visibility, not distribution**: a user arriving through one is told the listing is non-reference and
pointed at GitHub + npm. Under that framing the binding condition is **non-degradation**, made testable by
A1.3 as *a channel listing never claims more than the ledger's status for that capability* — and the thing
that satisfies it is a **disclaimer**, not runtime repair.

Three items had converged on the same question. The operator ruled on 2026-09-28:

| Item | Disposition |
|---|---|
| **A1.3 disclaimer** — unassigned to any story before this one | **This story.** It is the only one of the three that must exist before anything is published |
| `cir-1-3` runtime detection (this slot, as originally scoped) | **Folded.** A skill that arrives alone now says so through the disclaimer and the pointer, not through a detector |
| `s4-1-1` — the `convoke` hub | **Deferred**, not cancelled. C10 and C11 stand; its *Why* was a distribution argument that A1.1 weakened, so it is reconsidered with evidence about what actually breaks for a real operator. That order is the ratified one: ship, tiny baseline, then one measured test |

**What is NOT folded in:** `s4-1-1`'s fronting of `convoke-install` / `convoke-update` / `convoke-doctor`
(C11). Nothing here retires C11 — it is deferred with the hub, and retiring it would be a ruling.

---

## Root cause — the ledger does not ship, so a relative pointer cannot resolve

A1.3 specifies a post-install body pointer: *"This capability's current maturity and known limits are
recorded in the maturity ledger"* + link. **A repo-relative link resolves to nothing for the reader it is
written for.** The ledger is tracked in git but is not in the published package:

```sh
node -e "console.log(require('./package.json').files.some(p=>p.startsWith('_bmad-output')))"   # false
git ls-files --error-unmatch _bmad-output/planning-artifacts/convoke-note-maturity-ledger-2026-09-14.md   # tracked
```

Confirmed against a real install rather than against `files[]` alone — `KEEP=1 bash scripts/audit/try-fresh-install.sh`,
then `find <proj> -name '*maturity-ledger*'` returns nothing.

So the pointer must be an **absolute** URL. **A1.3 does not specify a link form** — it says *"+ link"* and
nothing more — so this is a gap being filled, not an ADR defect.

**The form is already ruled, by a different ADR, and that ADR is governing here:**
[ADR-002 — shipped link policy](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) fixes the
validated shape as `https://github.com/amalik/convoke-agents/blob/main/<path>` and records the hazard in the
same breath: absolute URLs hardcode `blob/main`, *"so a README published with 4.0.0 resolves against
whatever `main` says months later, and the `bmad-enhanced` → `convoke-agents` rename **proves the path is
not stable**"* (`:66-69`). **That hazard applies directly here** and the ledger's filename is date-stamped
(`convoke-note-maturity-ledger-2026-09-14.md`), so seven hardcoded URLs rot the day it is renamed or
re-dated. AC4 carries the consequence.

**17** occurrences of the exact shape already ship, **2** of them into `_bmad-output/`, so the form is
precedented for this target. Derive with the path retained — a pattern that stops at `<owner>/<repo>` collapses every URL to one string and cannot tell a
`blob/` deep link from `/issues`:

```sh
grep -rhoE 'https://github\.com/amalik/convoke-agents/blob/main/[^ )`]+' \
  README.md INSTALLATION.md CHANGELOG.md CONTRIBUTING.md docs/migration/*.md | sort | uniq -c
```

**Do not re-derive the handle from a display name** — `feedback_verify_external_identifiers` exists because
that has already cost this project a wrong "fix". `package.json` `repository.url`, `homepage` and `bugs.url`
all agree on `amalik/convoke-agents`.

## The descriptions, derived

The `description` field is the only text Convoke controls that a browsing user sees pre-install, on **both**
channels, and it is also the activation trigger — so it carries two jobs and length discipline matters.

**Measure the raw line value, quotes included.** That is the convention A1.3 and A1.5 use, and it is the
only one that is reproducible:

```sh
for d in _bmad/bme/_vortex/agents/*/; do
  v=$(awk '/^description:/{sub(/^description:[[:space:]]*/,""); print; exit}' "$d/SKILL.md")
  printf '%-34s %3d\n' "$(basename "$d")" "${#v}"; done
```

| Agent | chars |
|---|---|
| `hypothesis-engineer` | 21 |
| `discovery-empathy-expert` | 28 |
| `learning-decision-expert` | 28 |
| `production-intelligence-specialist` | 36 |
| `contextualization-expert` | 174 |
| `research-convergence-specialist` | 203 |
| `lean-experiments-specialist` | 204 |

The four short ones are their agent's **title**, not a description — `description: "Discovery & Empathy
Expert"`. There is nothing for a browsing operator to match on. Upstream `bmad-prd` is **104** for
comparison; that file is under `.claude/skills/`, which `.gitignore:69` ignores, so the figure is not
reproducible from a clean clone — ADR-001:253 cites the upstream path `skills/bmad-prd/SKILL.md` instead.

> **A1.3 and A1.5's figures are correct — do not "fix" them.** An earlier draft of this story asserted they
> were off by ~2 (claiming 19–34 and 174/203/203). **That was this story's error, not the ADR's**, and it is
> recorded because the cause generalises: the extractor used `gsub(/^"|"$/,"")`, an **unpaired** pair — anchored on both sides, but each alternative fires alone — which strips a *closing quote of an inner quotation* from an unquoted YAML scalar —
> `lean-experiments-specialist`'s description ends `…validates?"` and measured 203 instead of 204. Every
> A1.3/A1.5 figure reproduces exactly under the raw-value convention above. The reviewer who caught it
> measured both ways; that is the check.

## Scope: the 7 declared paths, and only those

`.claude-plugin/marketplace.json` declares **7** paths, all `_bmad/bme/_vortex/agents/*`. Derive with
`node -e "const m=require('./.claude-plugin/marketplace.json'); console.log((m.plugins?.[0]?.skills||[]).length)"`.

**Gyre is out of scope and is not an oversight.** *"Reference all of our agents"* means 11; the manifest can
declare 7; Gyre's four have no in-repo `SKILL.md` and so cannot be declared at all. **The derivation, the
two independent checks that widening would trip, and the C8 exposure are in `IN-248`** — not restated here,
because an earlier draft of this paragraph carried a copy that was wrong twice over (it cited a verifier as
the generator, and claimed a gitignore rule made the path impossible when `.gitignore:70-71` already
un-ignores two sibling skill directories). Operator ruling 2026-09-28: **declare 7, disclose the listing is
partial (AC3), file Gyre separately.**

**Sequencing conflict, and it is not hypothetical.** The four v5 agents whose descriptions AC5 rewrites are
the subjects of `i97-2-4`, `i97-2-5`, `i97-2-6` and `i97-2-7`, all `ready-for-dev`. Those conversions
**already own AC5's work** (`i97-2-4` requires *"`description:` must be a real one-line description (no
`TBD` placeholder)"*) and they **remove the single `xml` fence** that AC2's placement decision rests on —
the three already-converted agents carry no fence, the four v5 ones carry one to EOF. So: if a conversion
lands first, AC2's four-agent branch evaporates and AC5 is partly done; if this story lands first, the
conversions must preserve what it wrote. **Check which has landed before starting, and say so in the
completion notes.**

---

## Acceptance Criteria

**AC1 — every one of the 7 declared skills carries this pre-install notice in its frontmatter
`description`, verbatim:**

> `Non-reference listing; complete product on GitHub + npm.`

**The wording is fixed here, in the story, on purpose.** An earlier draft said only *"contains the agreed
marker substring"* and named no marker — which hands the dev both the text and its own test, and is
satisfiable by seven descriptions reading *"…See GitHub."* Falsifier, a literal the story owns and the dev
does not choose:

```sh
for p in $(node -e "const m=require('./.claude-plugin/marketplace.json'); console.log((m.plugins?.[0]?.skills||[]).join(' '))"); do
  awk '/^---$/{n++; next} n==1' "$p/SKILL.md" \
    | grep -q 'Non-reference listing; complete product on GitHub + npm.' || echo "MISSING: $p"; done
```

**Scoped to the frontmatter on purpose.** A whole-file `grep` is satisfied by the notice appearing in the
body — which AC2 explicitly permits for the pointer — leaving the `description` untouched and the pre-install
surface, the only one both channels render, with no disclosure at all. That was an earlier draft's defect.

Empty output passes. Derive the set of 7 from `marketplace.json`, never from a hand-typed list.

**AC2 — every one of the 7 carries a post-install pointer in its body.** It names the invariant — that
maturity and known limits are recorded in the ledger — and links to it. **It must not transcribe a status**
(`documentation-claims-must-be-derived`; a copied value rots on the next ledger edit, and `K10` is the
instance where a transcribed status is already wrong).

**⚠ For the four v5 agents there is no body prose to put it in.** Their `SKILL.md` is frontmatter, one
instruction line, then a single ` ```xml ` fence to EOF (all four are 120 lines). A pointer inside that
fence is **inside a code block**, where `shipped-links.js` skips it by design and where it is model
instructions rather than anything an operator reads. **Decide the placement before writing, and state it:**
either prose after the closing fence, or — if the pointer must sit in the activation context — record
explicitly that AC4 then validates 3 of 7 and say why that is acceptable. Do not let the fence swallow it
silently.

**AC3 — the notice discloses that the listing is partial.** 7 of 11 agents are declarable today; a listing
that silently presents 7 as the product overstates it, which is the degradation A1.1 forbids. **It must not
state the numbers** — both change (`derive-before-you-write`).

**AC4 — the link resolves, and it is the ADR-002 shape.** `https://github.com/amalik/convoke-agents/blob/main/<path>`,
per ADR-002's RULING. **`assert-shipped-links.js` is the gate that checks it** (see Dev Notes — it is
wired and blocking, contrary to an earlier draft of this story).

**What that gate cannot tell you, stated because AC4 is otherwise read as stronger than it is:** it resolves
self-referential `blob/<ref>/` URLs against the **working tree**, not against what `main` serves — ADR-002
says so outright (`:271-272`), and `try-fresh-install.sh:463` passes `$REPO` as the repo root. So it catches
a typo or a wrong path; it does **not** catch an unpushed path, a later rename, or `blob/main` drift. The
ledger's filename is date-stamped, so a re-date breaks all seven links with the gate green. **Record that as
a known residual in the completion notes** rather than implying AC4 covers it.

**AC5 — the four short descriptions become descriptions (A1.5).** 21 / 28 / 28 / 36 today, and each is
merely the agent's title. **Bounded:** re-derive all seven raw lengths with the command in §The
descriptions, derived and paste the output — the command emits alphabetical order; the table above is sorted by length, so compare by name, not by row position.

**AC5a — the description budget, because AC1 and AC3 both add to the same field.** The notice is **56**
characters; AC3's clause adds more; the longest description is already **204**. So 204 + 1 + 56 = **261**
before AC3 exists — the budget cannot be met by appending, only by **tightening existing text**.

**Bar: no `description` exceeds 220 raw characters.** Derived, not picked: A1.3's stated concern is dilution
against upstream `bmad-prd`'s **104**, and the three long descriptions are already 174–204, so 220 is the
smallest bar that leaves the notice room without letting any description grow past what already ships. That
means the 204 must come down to ~160 before the notice. Falsifier:

```sh
for d in _bmad/bme/_vortex/agents/*/; do
  v=$(awk '/^description:/{sub(/^description:[[:space:]]*/,""); print; exit}' "$d/SKILL.md")
  [ ${#v} -gt 220 ] && echo "OVER: $(basename "$d") ${#v}"; done
```

**AC3 does not move.** An earlier draft offered an escape hatch — *if the budget is tight, AC3's clause moves
to the body pointer* — which relocates the partial-listing disclosure to a post-install surface a browsing
operator never sees. That voids the condition the operator attached to the declare-7 ruling (`IN-248`:
*"declare 7 now, **disclose that the listing is partial**"*) and re-creates the overstatement A1.1 forbids.
If the budget genuinely cannot hold AC1 + AC3, that is an operator decision, not a dev's trade.

**AC6 — no new gate, and the existing ones pass.** ADR-001 **C1** permits no new CI check under the spent
baseline; **C12** is the precedent for a recorded task instead. `npm test` · `npm run lint` ·
`npm run refs:audit` · `npm run docs:audit` · `node scripts/audit/backlog-integrity.js` · `npm run test:p0`
· `node scripts/audit/agent-surface-parity.js "$(git describe --tags --abbrev=0)" HEAD` · **`bash scripts/audit/try-fresh-install.sh`**, which exercises AC4, **and `node scripts/audit/validate-marketplace.js`**, whose `auditSkillDirs` does a real `yaml.load` on each of the 7 frontmatters and is the only gate that parses the field this story edits (`ci.yml:206`, job `agent-surface-parity`, in `publish.needs`) — an earlier draft
omitted it while claiming its link check was unwired.

**AC7 — nothing new is published, and it is checked rather than attested.** C8 binds: there is no self-serve
retraction from `skills.sh`. This story declares no new path and no new name.

```sh
git diff HEAD --stat .claude-plugin/marketplace.json    # must be empty (HEAD, not worktree-vs-index:
                                                       # a staged change passes a bare `git diff`)
```

Second, independent: `validate-marketplace.js` enforces set identity between `skills[]` and `AGENT_IDS` and
fails with `unexpected skill path(s)` on any addition (`:158`), at `ci.yml:206` inside
`agent-surface-parity`, which is in `publish.needs`. An earlier draft asked only that the dev *state* C8
compliance in the notes — for the one irreversible constraint in the story, that was a note to self.

---

## Tasks

1. [ ] Derive the 7 declared paths from `marketplace.json`; record the list (AC1, AC3).
2. [ ] Decide and record where the pointer goes for the **four v5 agents**, whose files are one XML fence to
   EOF with no body prose (AC2). Do this before writing anything.
3. [ ] Write the notice and the pointer once; apply to all 7 (AC1, AC2, AC3). Keep inside AC5a's budget by
   tightening the three long descriptions rather than appending to them.
4. [ ] Write the four short descriptions (AC5), then re-derive all seven raw lengths and paste the output.
5. [ ] `bash scripts/audit/try-fresh-install.sh` — the gate that exercises AC4. Paste the verdict, and record
   the residual AC4 names (working-tree resolution, date-stamped target).
6. [ ] Remaining gates (AC6); run AC7's two checks and paste both.

---

## Dev Notes — traps, each one already paid for

- **`refs:audit` will not see the pointer.** It space-fills inline code spans, and it reports *0 references
  checked* over the agent files. Its PASS is not evidence for AC2 or AC4. This is a recorded trap in the
  channel-integrity handoff §7.
- **`agent-surface-parity.js` will not see it either** — `:110` is a presence regex
  (`/config\.yaml|load.{0,20}config|config.{0,20}load/i`) that matches a defect and its fix identically.
  Three stories have now cited it as coverage it does not provide.
- **`assert-shipped-links.js` IS a wired, blocking gate. An earlier draft of this story said it was not, and
  got there by the exact method this project already filed a row about.** The trace:
  `scripts/audit/try-fresh-install.sh:463` runs it and feeds its exit into `$LINKS`; the verdict at `:503`
  requires `$LINKS -eq 0`; `.github/workflows/ci.yml:477` runs `try-fresh-install.sh` in the `fresh-install`
  job; `fresh-install` is in `publish.needs` (`:666`). Its own header says *"IN THE VERDICT AND BLOCKING
  since story dist-2.3c… A finding here now fails the build, which is the point."*

  **How the earlier draft went wrong, because it generalises:** it grepped `package.json` and `ci.yml` for
  the script's *name*, found nothing, and concluded not-wired — then cited
  `tests/lib/format-conversion-exclusion.test.js:9` (*"not blocking until dist-2.3c"*), a **dated** sentence
  whose date has passed. `IN-245(a)` in the lifecycle backlog says precisely this: *"Trace what the jobs run
  rather than grepping for the script name; grepping the name is how the first draft went wrong."* That row
  was filed in the change immediately before this one. **Trace the invocation chain, always.**
- **A failing link shows up as a red `fresh-install` job**, whose step name says nothing about links. If that
  job reddens on this story, read its log before assuming the failure is elsewhere.
- **Do not add a CI check for any of this.** C1. If one looks necessary, that is a ruling, not a task.
- **The description field is an activation trigger.** Doubling it dilutes the trigger — A1.3 says so
  explicitly. Growth is a cost here, not a neutral.
- **Do not write the ledger's *status* anywhere.** The skill states the invariant, the ledger states the
  value. A transcribed status is the defect `K10` was filed for: the ledger currently discloses a defect the
  product no longer has, and any copy of it would now be wrong in a second place.
- **Grep the backlog before filing anything found along the way.** `cir-1-2` duplicated `T183` by ten days,
  and that is now a clause in `derive-before-you-write`.
