---
initiative: convoke
artifact_type: adr
qualifier: channel-integrity-the-distribution-unit
created: '2026-09-26'
status: active
decision_status: accepted
accepted: '2026-09-26'
schema_version: 1
related_initiative: 'Channel integrity (2026-09-26)'
related_decision: 'ADR-004 (invocable-unit declaration); meta-model ADR-001 (name registry)'
related_epic: none
supersedes: none
qualifier_role: operator-authored
signoff_by: amalik
---

# ADR-001: What unit does Convoke distribute?

**Status:** **ACCEPTED** (2026-09-26) — ruled by Amalik: **S4 now**. **⚠ The "S2 as the destination" half of this ruling was overturned by Amendment 1 on 2026-09-27** (§*Amendment 1 — channel tiers, and S2 reopened*): S2 is reopened, is not a destination, and S4 is not a step toward it. Read A1.1–A1.5 before acting on anything below; C1–C14 are not restated by Amendment 1, but **C2 is affected in effect**: it defers an ADR-004 amendment to S2, so with S2 reopened that deferral now points at nothing scheduled.
**⚠ Amendment 4 (2026-10-14) falsifies a premise shared by A1.3, A1.4 and A2.1** (§*Amendment 4 — what the listing channel actually renders*): the skills.sh catalogue is fed by **CLI install telemetry**, not by reading repositories (A4.6) — it lists **1 of the 7** declared skills, being the only one anyone has installed, and serves a snapshot predating `cir-1-3`, so the disclosure's reach on that channel is **0 of 7** and **no act of publication changes it**. **A4.7 then measured the other channel: Convoke is in none of the three plugin catalogues** (official 0/315, community 0/2283, BMAD's PR #9 closed), the only Claude Code path is BYO-URL reading the repo live, and its pre-install surface is the **plugin entry's** `description` — not a skill's — which carries no notice. **Pre-install reach is zero on both channels, for two unrelated reasons**, and only the Claude Code half is fixable by publication. Amendment 4 **rules nothing** — it records the measurements and leaves the consequent ruling blank.
**Proposed:** 2026-09-26
**Decision owner:** Amalik
**Evidence:** [`convoke-note-channel-integrity-findings-2026-09-26.md`](../../convoke-note-channel-integrity-findings-2026-09-26.md)

---

## Context

Convoke's unit of value is a **module**: agents, workflows, handoff contracts and a
config, coherent together. Every agent-skill distribution channel in existence has a
unit of **one skill**.

Upstream BMAD resolved the same tension on 2026-09-05 (PR #2768, merged to `main`,
+10,907 / −35,677, in no tagged release) and **not** by atomising its personas. It made
the flow addressable: 5 persona skills, 22 personaless process skills, and a `bmad` hub
skill that materialises the runtime. A lone skill self-diagnoses and names the command
that repairs it.

Convoke's measured position, derived 2026-09-26: **7 of 11 agents reachable, 0 of 29
workflows, 0 of 14 contracts.** The seven personaless skills that do exist are all
Convoke's own tooling. Convoke put its plumbing in the channel and kept its product
out of it.

### Why this is an ADR and not a requirement set

A PRD for this work was drafted on 2026-09-26 and **superseded the same day**. Five
independent reviews found that its requirements had already foreclosed three of the
four options below while the document declared the question open. A requirement set
cannot be written before this ruling without deciding it by accident. That is the
lesson this ADR encodes.

### Constraints the ruling must respect — all verified, none assumed

1. **The meta-model budget is spent.** All three ratified deliverables shipped:
   `_bmad/bme/_config/name-registry.csv`, `scripts/audit/name-registry-integrity.js`
   wired at `ci.yml:231`, and meta-model ADR-001 (accepted 2026-09-05), which records
   *"Three deliverables, no epic, budget held."* **Zero new ADRs, registries or checks
   are available under the ratified baseline.** An option needing them needs a new
   ratification first.
2. **`ADR-004 C2` already fixed the declaration shapes** — an agent in
   `agent-registry.js`, or a `config.yaml` workflow entry with `standalone: true`. It
   *considered and rejected* a third shape: *"the repo would then have three ways to
   declare an invocable unit instead of two."* Making contracts addressable needs that
   ADR amended, not assumed.
3. **`preflight-soft-warn` (`project-context.md:419`) names this case.** Future
   dependency preflights *"MUST follow the same contract: stderr WARNING + exit 0
   pass-through; never `process.exit(non-zero)`"*, because false-positive hard-blocks
   *"would trap operators with legitimate non-standard installs (git-clone, monorepo,
   **alternative distribution channels**)."* Any option whose skills refuse to run
   collides with this rule and with Operator Rights OC-R1 and OC-R5, and needs a
   recorded amendment rather than silence.
4. **`team-state-directories` is absolute.** A team keeping state owns `.<team>/` at
   the project root; Gyre's `full-analysis/step-01-initialize.md` branches on
   `.gyre/capabilities.yaml`. Any option that makes Gyre's workflows addressable from a
   plugin cache must say what happens to that file.
5. **No cadence cap may be stated as N-1.** `convoke-arch-bmad-v6.4-v6.8-absorption.md:230`
   records the floor at **N-8** and warns a literal N-1 *"would be in breach on day one
   and would soft-warn permanently."*
6. **Two segments, one codebase.** ~60% BMAD-addon, for whom the channel is the
   doorway; ~40% standalone, who need the whole module and are served by
   `convoke-export`.
7. **There is no self-serve retraction from skills.sh.** A published name is durable.

## Options

### S1 — Installer-led

npm plus `convoke-install-*` remains the only supported path. Channel listings become
funnel entries that state their dependency.

- **Serves:** the 40% standalone segment fully.
- **Starves:** the 60% addon segment, whose channel this is not.
- **Cost:** lowest. No new declaration shape; constraint 1 respected.
- **Collides with:** constraint 3 if the funnel entry *refuses* rather than warns.

### S2 — Publish the differentiator

Promote the 29 workflows and 14 contracts to addressable personaless skills. Personas
go thin. The module stays the unit of *coherence*; it stops being the unit of
*distribution*.

- **Serves:** both segments, in principle.
- **Cost:** highest declared. 43 new addressable units, 43 names from a registry whose
  budget is spent, and an ADR-004 amendment for the contract shape (constraint 2).
  **Note the mechanism partly exists** — `refresh-installation.js` already generates a
  wrapper per `standalone: true` workflow, but **zero** Vortex or Gyre workflows carry
  that flag today, so this is a data change plus a per-module wiring change, not new
  machinery.
- **Collides with:** constraints 1, 2, 4.

### S3 — Two artifacts, one source

`_bmad/bme/` stays the authoring source; a build step emits the channel tree.

- **Serves:** both segments.
- **Cost:** a generator and a drift gate. Constraint 1 forbids the gate under the
  current budget.
- **Note:** this is the option the superseded PRD's FR13 silently eliminated by
  requiring skills to *exist in the repository*.

### S4 — Router stub

One installer/finder plugin on the marketplace; the full catalog on skills.sh. Uses the
channel asymmetry rather than fighting it.

- **Precedent:** the only pattern large suites actually run. NVIDIA/skills (**383**
  skills) publishes one plugin exposing one skill, `nvidia-skill-finder`.
  HuggingFace/skills publishes one plugin, `hf-cli`, and the other 25 arrive through
  its own CLI.
- **Serves:** the 60% addon segment through a channel with real semver dependencies.
- **Cost:** moderate; needs a hub skill, which Convoke does not have — its installer is
  a `bin` entry, which is also why Gyre cannot travel.
- **Note:** upstream's own marketplace copy is a generation behind its skills.sh copy.
  Nobody runs both channels at parity.

## Decision

**S4 now.** ~~S2 as the stated destination.~~ Ruled by Amalik, 2026-09-26; **the S2 half was overturned by Amendment 1 on 2026-09-27 — S2 is reopened, is not a destination, and S4 is not a step toward it.**

Convoke publishes **one** deliberate plugin to the Claude Code marketplace — a hub that
installs and repairs the runtime — and the catalog reaches operators behind it. The
module remains the unit of coherence. S2 (promoting the 29 workflows and 14 contracts to
addressable personaless skills) ~~is the declared destination, not deferred indefinitely~~ — **overturned by Amendment 1 A1.2; S2 is reopened and carries a precondition (contract conformance enforced in software)**
and not started now: it requires a ratification this initiative does not hold.

**Ruled in two follow-up lines, 2026-09-26** (C10, C11): the name registry **does** gain a
`kind: skill` row type, and the hub **fronts** the existing CLIs before absorbing them.
**Still open:** the hub's name, and the order of the remediation.

## Amendment 1 — channel tiers, and S2 reopened (ruled 2026-09-27)

**Ruled by Amalik, in conversation, and recorded here because a signed ADR named a destination he does
not want.**

### A1.1 — Both channels are non-reference and disclaimed

> Reference distribution is **GitHub + npm**. Both `skills.sh` **and** the Claude Code plugin
> marketplace are **non-reference** channels: they may carry incomplete features, and users arriving
> through them are told so. Being *referenced* there is acceptable; being *represented* by them is not.

**The purpose is visibility, not distribution** — in his words, *"to reference all of our agents/skills
on these places as a quick win without degrading our core reference product."*

**The binding condition is non-degradation, not completeness.** He said *"as long as I'm 100% sure our
product on GitHub and npm is complete"*, and on a literal reading that gate can never open: the maturity
ledger's own §1 carries **4 Shipped, 6 "Works with limits", 4 "Mapped, not built"** across 14
client-facing rows, with both *teams* at "Works with limits" and "Plugin marketplace distribution" itself
"Mapped, not built". So the condition is read as his second clause states it — *without degrading the core
reference product* — and made testable as A1.3.

### A1.2 — S2 is no longer the destination, and the reason is his constraint, not a cost

> *"I don't want to sell the differentiator to buy the channel."*

**S2 as signed does sell it**, and the option text concedes it without noticing: it asserts *"the module
stays the unit of coherence"* while the ledger's contracts row states *"Agents are instructed to follow
them. **No software checks a document against its template.**"* The coupling — HC1–HC10, one stage's
output feeding the next — exists only as prose, so **the single mechanism holding it together is that the
pieces arrive together.** Promoting 43 units to independently installable skills removes exactly that.
The earlier correction (the atom is the step, not the persona) changed *what* would be atomised, not
*whether* atomisation dissolves the coupling; "publish the differentiator" was a rename, not a fix.

**S2's status: reopened.** It is not a destination. If it is ever revisited it carries a precondition —
**contract conformance enforced in software before the units become independently installable** — because
only then does separating them not sell anything. **S4 is therefore not a step toward S2.**

### A1.3 — The disclaimer: a flat notice plus a pointer, neither of which can rot

Both parts, because each carries a different kind of claim:

- **Pre-install, in the frontmatter `description`** — the only text Convoke controls that a browsing user
  sees, and the only surface **both** channels render. **⚠ A4.1 confirms the `description` IS rendered; A4.2 refutes "both" as a statement about what the catalogues index.** Terse, because that field is also the activation
  trigger: the three converted agents' descriptions already run **174 / 204 / 203** characters against
  upstream `bmad-prd`'s 104, and doubling a trigger dilutes it.
- **Post-install, in the body: a pointer, never a transcribed status.** *"This capability's current
  maturity and known limits are recorded in the maturity ledger"* + link — the skill states the
  **invariant**, the ledger states the **value**. A copied status rots on the next ledger edit;
  `documentation-claims-must-be-derived` forbids it, and `docs/testing.md` already demonstrates the
  pattern by refusing to state totals at all.

**This is the testable form of A1.1's condition:** a channel listing never claims more than the ledger's
status for that capability, so the channel version cannot overstate the reference.

### A1.4 — Two corrections this ruling forces

1. **Gyre's `SKILL.md` wrappers become a PREREQUISITE, not a non-issue.** The `cir` epic states defect 4
   is *"resolved by the ruling's design, not by remediation"* because the hub materialises the runtime.
   **Under A1.1 that is false:** referencing all agents requires declarable manifest paths, and Gyre's
   four agents have **no `SKILL.md` in the repo at all**. The epic row must be corrected.
2. **`validate-marketplace.js`'s identity invariant must widen.** It enforces set identity between
   `marketplace.json` `skills[]` and `AGENT_IDS` — the 7 Vortex agents — so declaring 11 fails at
   `ci.yml:206`, inside `agent-surface-parity`, which is in `publish.needs`. Proven by execution:
   *"unexpected skill path(s): convoke"*.

**⚠ SUPERSEDED IN PART by A4.2 (2026-10-14): the quote below is from the `npx skills` CLI's README and describes the CLI; the conclusion drawn from it is about the website catalogue, which does not enumerate the manifest. The CLI half remains untested.**

**And the shared-manifest fact that made disclaiming both cheaper than disclaiming either:**
`.claude-plugin/marketplace.json` is read by **both** channels — `npx skills` README: *"If
`.claude-plugin/marketplace.json` or `.claude-plugin/plugin.json` exists, skills declared in those files
are also discovered"* — and the `description` they render is the same string. One manifest, one
disclaimer surface, two channels.

### A1.5 — The cheapest thing in the plan, found while checking A1.3

The four v5 agents' descriptions are **21–36 characters** (`hypothesis-engineer` is 21). Even where those
agents are listed they are near-undiscoverable, because a browsing operator has nothing to match on.
Writing four real descriptions is smaller than the hub and smaller than the manifest work, and it is the
part that actually makes a listing findable.

## Amendment 2 — how far the disclosure reaches (ruled 2026-10-12)

**Ruled by Amalik, in conversation, and recorded here because `cir-1-3` measured the reach and found it
narrower than A1.3 reads.**

### A2.1 — The disclosure is a listing-channel surface, and nothing more

> A1.3's notice and pointer are **for the two listing channels**, which read
> `.claude-plugin/marketplace.json` and therefore the seven agent `SKILL.md` files directly. They are not
> required to reach any other surface, and **they do not**.

Measured on `c8d7594d`, on real artifacts rather than from source:

**⚠ The first row of this table is WRONG for skills.sh and untested for the Claude Code marketplace — see A4.3. It measured the repository's files, which was correct, and labelled the result a property of the channels, which was not.**

| Surface | Carries the notice | Carries the ledger pointer |
|---|---|---|
| The two listing channels (via `marketplace.json`) | **yes**, all 7 | **yes**, all 7 |
| An npm install's host-read wrapper (`.claude/skills/bmad-agent-bme-*`) | no | no |
| The exported / catalogued artifact (`convoke-export`) | no, and never did | no |
| npmjs.com's package page (`README.md`) | no | no |

**Two of those are by construction, not by omission, and that is the point of this amendment.**

- `refresh-installation.js` generates the host wrapper from a template literal whose description is
  `${agent.id} agent`. An npm-installed operator's activation trigger is unchanged by anything A1.3 or
  A1.5 does. **A1.5's benefit therefore does not reach npm installs** — three independent reviewers found
  this from three different angles, and it is a fact about the install model, not a defect in `cir-1-3`.
- `export-engine.js` **assembles** a closed set of sections (`## You are`, `## When to use this skill`,
  `## How to proceed`, `## What you produce`) rather than copying the source's. A new `##` section in a
  source `SKILL.md` is dropped. And `## When to use this skill` is built from `skill-manifest.csv`'s
  description, not the frontmatter — so the notice has never appeared in an export, before or after
  `cir-1-3`.

### A2.2 — The export channel is not a disclosure surface, and will not be made one here

> Exports already carry their own `⚠️ Framework-only skill.` banner, every one of the seven is a
> `tier=pipeline` row, and adding a maturity section to the export assembler would widen A1.3 past its
> scope on the strength of one review finding. **Ruled: leave it.** If the export channel ever needs the
> disclosure, that is a new decision with its own evidence.

Recorded so the next reader does not mistake the absence for a bug. `cir-1-3` briefly put the pointer
*inside* the exported `## How to proceed` section — procedure, not provenance — and the heading that
corrected that also removed it from the export entirely. Both states were measured; this ruling makes the
second one deliberate.

## Amendment 3 — extension is within budget, and C12 still says not yet (ruled 2026-10-13)

**Ruled by Amalik, in conversation, and recorded here because `T275` was authored on a reading of C1 that
never cited C12 — the ruling that already answered its question.**

### A3.1 — Extending an already-wired check is not a new check under C1

> A function that already runs, already parses the artifact, and is already in `publish.needs` learning to
> read **more of the same artifact** is an **extension**, not a new deliverable. It does not reopen the
> baseline budget.

The precedent is **C10**, ruled 2026-09-26, and it is this exact shape: *"This is a row-type extension, not
a fourth deliverable, so it does not reopen the baseline budget — but `name-registry-integrity.js` **must
learn the new kind in the same change**, or the check goes green on a row it cannot read."* An existing
check was **required** to gain assertions, in the same change, with the budget explicitly not reopened.

**The distinction that was being missed.** C8 and C12 each concern a check that **does not exist yet** —
C8's a new publication gate, C12's new CI checks standing up `s4-1-1`'s acceptance criteria. C1 forbids
both, and C8 says so outright: *"the check is a new CI gate that C1's spent baseline budget forbids."*
Nothing is stood up by an extension. **C1 is not the obstacle here; reading it as categorical was wrong in
the restrictive direction.**

### A3.2 — And it is still not built, because C12 is about sequence, not cost

> **Ruled: no gate. The disclosure's protection is declared-but-unchecked** — the four `i97` story notes,
> and the verification command run as a task with its output recorded in whichever story touches the field.
> That is the posture C12 names and C8 already accepted. **A gate is considered afterwards, on evidence that
> the disclosure actually dropped.**

C12 is not a budget argument and was never answered by one: *"the ratified sequence is ship, then a tiny
baseline, then one measured test — and the hub is the measured test. Gating before the test runs inverts
the order, and the standing counter-metric is 111 gates built for ourselves against none shipped to an
operator."* The measured test is `s4-1-1`, which is deferred, so C12's *"afterwards"* has not arrived.
Nothing has broken. The four notes are in. A gate now is the guess C12 refuses.

**And the asymmetry that decides it rather than merely favouring it.** C12 defers the gate pending *evidence
about what actually broke*. A gate makes the disclosure unable to drop — so **the evidence C12 conditions on
could never be gathered**. A deferred decision whose criterion the fix destroys is not deferred; it is
decided quietly by the thing that was supposed to be waiting. **Do not implement against a deferred ruling
when the implementation removes that ruling's own decision criterion.** That test is general and applies
beyond this row.

### A3.3 — What this costs, stated rather than discovered later

The notes protect the four stories that carry them. They do not protect the fifth edit, and no gate will
catch a drop. **That is accepted, deliberately, for the second time** — C8 took the same trade on a larger
risk. If the disclosure does drop, that drop **is** the evidence C12 asked for, and the gate goes in then
with a real instance behind it rather than a hypothesis.

`T275` therefore stays open as the holder of that future consideration, blocked on evidence rather than on a
ruling. The spec written for the gate is withdrawn, not deleted: if the evidence arrives it is the starting
point, and its Round 1 findings are the list of what to fix before it ships.

## Amendment 4 — what the listing channel actually renders, measured (facts recorded 2026-10-14; NOT ruled)

**This amendment rules nothing.** It records measurements that falsify a premise A1.3, A1.4 and A2.1 all
rest on, and it leaves the consequent ruling **blank**, because every option it opens is an operator's call
and one of them is `s4-1-1`, which is deferred by operator ruling and whose revival condition these same
measurements satisfy.

Measured 2026-10-14 against the live channel, on **raw HTML fetched and grepped** rather than on a
model-summarised reading of the page — a distinction that matters, because an earlier summarised read of
these same two pages produced one conclusion this amendment has to correct. Reproduce:

```sh
curl -sS -L -o wade.html  "https://skills.sh/amalik/convoke-agents/bmad-bme-agent-wade"
curl -sS -L -o index.html "https://skills.sh/amalik/convoke-agents"
grep -c "Non-reference listing"              wade.html   # 0  — the cir-1-3 notice
grep -c "Maturity and limits"                wade.html   # 0  — the cir-1-3 pointer
grep -c "Validated learning expert"          wade.html   # 2  — the PRE-cir-1-3 description
grep -c "smallest experiment that validates" wade.html   # 2  — the PRE-cir-1-3 final paragraph
for n in bmad-bme-agent-emma discovery-empathy-expert bmad-bme-agent-mila hypothesis-engineer \
         bmad-bme-agent-wade production-intelligence-specialist learning-decision-expert; do
  printf '%-38s %s\n' "$n" "$(grep -c -- "$n" index.html)"
done                                                     # wade 1; the other six 0
```

### A4.1 — A1.3's choice of surface is CORRECT for skills.sh, and that is what the measurement confirms (⚠ narrowed by A4.7: wrong field for the Claude Code path)

The channel **does** render the frontmatter `description`. It renders Wade's *June* description
(`"Validated learning expert specializing..."`, 2 occurrences) and not the current one
(`"Lean experiments expert for MVPs"`, 0) — but it renders the field. A1.3's premise that the `description`
is *"the only text Convoke controls that a browsing user sees"* **holds**, and `cir-1-3` therefore put the
notice in the right place.

A mid-session reading of the summarised page claimed the channel renders the body *instead of* the
`description`, and that this questioned A1.3. **That claim was wrong** and is withdrawn here. It is recorded
rather than quietly dropped because the error has the shape this initiative keeps producing: a conclusion
about an artifact drawn from a description of it instead of from the artifact.

### A4.2 — The catalogue does not enumerate `marketplace.json`, and A1.4 conflated two different readers (⚠ see A4.6)

**⚠ Partly corrected by A4.6 (same day, one question later): the catalogue does not enumerate ANYTHING — it is fed by CLI install telemetry. A1.4's quote may be correct; the error is inferring catalogue reach from manifest declaration. The text below is kept as written.**

| Fact | Value | Source |
|---|---|---|
| `.claude-plugin/marketplace.json` first existed | **2026-04-24** | `179c304e` |
| All 7 Vortex `SKILL.md` files first existed | **2026-04-24** | seven `--diff-filter=A` commits |
| skills.sh "first seen" | **Jun 16, 2026** | the page, 2 occurrences |
| Skills listed in the catalogue | **1 of 7** | `index.html` greps above |
| `marketplace` / `convoke-vortex` / `plugin` on either page | **0 / 0 / 0** | both files |

The manifest and all seven declared skills existed **two months before** the catalogue first saw the
repository. It indexed one. A reader enumerating that manifest would have found seven.

**A1.4's quoted evidence is about a different reader than A1.4's conclusion.** The quote — *"If
`.claude-plugin/marketplace.json` or `.claude-plugin/plugin.json` exists, skills declared in those files
are also discovered"* — is from the **`npx skills` CLI's README** and describes what **the CLI** discovers
when it installs from a repository. A1.4 then concluded *"One manifest, one disclaimer surface, two
channels"*, which is a claim about what **the website's catalogue indexes**. Those are not the same reader,
and the catalogue's behaviour contradicts it.

**Untested here, deliberately:** whether the CLI does enumerate all seven. Testing it means running an
installer against the live channel, and the measured failure is at the catalogue, which is the surface a
browsing operator meets. The CLI half of A1.4 is neither confirmed nor refuted by this amendment.

**Secondary observation, recorded because it was found in the same pass and bears on A1.5's
discoverability argument:** only 3 of the 7 `SKILL.md` files carry a `bmad-bme-agent-*` frontmatter `name`
(Emma, Mila, Wade — the three v6.3-converted agents). The other four carry their directory name
(`discovery-empathy-expert`, `hypothesis-engineer`, `production-intelligence-specialist`,
`learning-decision-expert`). This is a consequence of the unfinished v6.3 conversion and belongs to `I97` /
`T87` rather than to this ADR; it is noted here only because the catalogue keys its listing on that field.

### A4.3 — A2.1's reach table is false for skills.sh, and the instrument is the reason

A2.1 states, as its first row:

> | The two listing channels (via `marketplace.json`) | **yes**, all 7 | **yes**, all 7 |

Measured on the channel, that row is **wrong for skills.sh on every count**: six of the seven are not
listed at all, and the one that is renders a snapshot predating the notice, so the notice and the pointer
reach **0 of 7**.

**The instrument is why.** A2.1's own preamble says it was *"measured on `c8d7594d`, on real artifacts
rather than from source"* — and it was: it measured **the repository's files**, correctly, and then labelled
the result a property of the **channels**, on the strength of A1.4's assumption that the channels render
those files. The table's column heading is *"Surface"*; what was put in the row was the file. Every other
row in that table is a surface Convoke itself produces and can therefore be measured from the repository.
This row is the only one describing a third party, and it is the only one that was not measured where it
lives.

**Scope of this correction:** skills.sh only. The Claude Code marketplace is the other half of *"the two
listing channels"* and **was not measured** in this pass. A2.1's row is falsified for one channel and
remains untested for the other.

**⚠ DISCHARGED by A4.7 (same day): the other half was measured. A2.1's row is wrong on **both** halves — and the Claude Code side is not a listing channel for Convoke at all.**

### A4.4 — What follows as fact: the disclosure's reach on this channel is currently zero (⚠ "and its arrival is not ours to schedule" — superseded by A4.6: there is nothing to schedule)

`cir-1-3` shipped the notice in `8f15aa1d` on 2026-10-10 and the bearer in `c8d7594d`. Four days later the
channel still serves a June snapshot: the rendered body stops at the `DO NOT scope an experiment larger than
necessary` paragraph — the final line of Wade's file before `8f15aa1d` (76 lines then; that paragraph is
line 77 today) — and carries nothing after it. It is a coherent earlier version, not a truncation
and not a collapsed section.

So the disclosure's reach on skills.sh is **0 of 7 today**, and becomes non-zero only when the catalogue
re-reads. **⚠ A4.6 corrects this sentence: there is no re-read. Reach on this channel is a function of who installs what, and no act of publication changes it.** **Convoke does not trigger that re-read, does not observe it, and has no stated expectation of
when it happens.** That is a dependency the plan did not know it had.

This also means the failure mode is **not the one `T275` is waiting for.** `T275` unblocks *"when the
disclosure is observed to have actually dropped in a shipped version"*. The disclosure has not dropped — it
is present and correct in all seven files. It never arrived. A gate on the repository would have been green
throughout and would not have detected this, which is consistent with A3.2's reasoning and orthogonal to
it: A3.2 asked whether to protect the field, and this is a question about whether anything reads it.

### A4.5 — The blank: what is deliberately not ruled here

Four questions are opened and none is answered, because the first two are measurements nobody has taken and
the second two are the operator's:

1. **Can a re-read be triggered or requested?** If yes, `cir-1-3`'s disclosure lands for the cost of a
   re-index, and no build is needed to make Amendment 1's condition true on this channel.
2. **Does the Claude Code marketplace behave the same way?** **✓ ANSWERED by A4.7: no, in every respect.** It is not a listing for Convoke (absent from all three catalogues), it reads the repository live rather than from a snapshot, and its pre-install surface is the *plugin entry's* `description` rather than a skill's. So this is a skills.sh fact AND a second, unrelated zero — not one listing-channel fact.
3. **Does A1.1's disclaimer commitment survive a channel that may not render the disclaimer?** A1.1
   conditions the non-reference framing on a disclosure the channel is not currently showing.
4. **Does this revive `s4-1-1`?** Its deferral asks for *"evidence about what actually breaks for a real
   operator who finds a Convoke skill through a channel"*, and the measurements above are exactly that: the
   operator finds one agent of eleven, described by a four-month-stale description carrying no disclosure,
   behind an install command that brings that one skill alone. **The condition is met.** The counter-fact is
   in the same data — a hub is a *new* skill published into a catalogue that indexed one of seven declared
   skills in four months — so the evidence argues both that the defect is real and that the proposed remedy
   depends on the mechanism that is failing. Reviving it is a ruling, and it is not made here.

### A4.6 — The mechanism, found one question later: the catalogue is fed by installs, not by reading repositories

A4.2 said the catalogue does not enumerate `marketplace.json`. That is true, and the reason is deeper than
A4.2 knew: **it does not enumerate anything.** From skills.sh's own `/about`, quoted:

> *"We index every public skill that **ships through the open skills CLI** and rank them by anonymous
> install telemetry."*

and from `/docs`:

> *"The skills leaderboard ranks skills based on anonymous telemetry data collected from the skills CLI.
> When users install skills, aggregated usage data helps surface the most popular and useful skills."*

**This explains all three anomalies at once, which is why it is worth more than the separate findings it
replaces:**

| Anomaly A4.2 recorded | What the mechanism says |
|---|---|
| 1 of 7 listed | Wade has **1 install**. The other six have none, so nothing ever entered them |
| "first seen Jun 16, 2026" | Not a crawl date — the date of that install |
| A June snapshot four days after `8f15aa1d` | Content captured around the install event; no later install, no later capture |

**What this corrects in A4.2.** A4.2 charged A1.4 with conflating the CLI and the catalogue. The conflation
was real but the framing was unfair to the quote: **A1.4's `npx skills` README quote may be entirely
correct** — the CLI plausibly does read `marketplace.json` when installing from a repository, and nothing
here tests it. The actual error is one step further on. A1.4 inferred *catalogue reach* from *manifest
declaration*, and the catalogue is downstream of **installs**, not of the manifest. Declaring a skill does
not list it. Someone has to install it.

**The consequence that matters, and it is not a scheduling problem.** A4.4 framed the zero reach as waiting
on a third party's re-read. That framing is wrong. There is no re-read to wait for:

- The six undeclared-in-practice agents carry no disclosure on this channel **because they are not on this
  channel at all**, and publishing cannot put them there.
- The one that is there shows a four-month-old description, and the only event known to refresh it is
  another install.
- **A1.1's commitment — that both channels are non-reference and disclaimed — is therefore not satisfiable
  on skills.sh by any act of publication.** Reach is a function of who installs what. That is a property of
  the channel, not a gap in `cir-1-3`, which did its job correctly in the files.

**Inference boundary, stated because the rest of this amendment is measurement.** The three quotes are
verbatim site text. That a listing is *caused* by an install event, and that the snapshot is captured at
that event, is an **inference** from four convergent facts (install count 1, "first seen" date, frozen
content, six absent siblings) and is not stated policy anywhere on the site. **Untested:** whether a
subsequent install refreshes the snapshot. That is now the only cheap experiment left, and it is
self-answering — an install of any one of the six would both test the mechanism and, if the inference
holds, place a correctly-disclosed listing on the channel.

**And there is no public instrument for re-measuring this.** `GET /api/v1/skills?q=convoke` and
`GET /api/v1/skills/amalik/convoke-agents` both return **HTTP 401**
(`{"error":"authentication_required"}`), and authentication is a Vercel OIDC token scoped to a Vercel
project. No refresh, re-index, claim or submit affordance appears on any of the four pages fetched
(`/`, `/docs`, `/about`, and both repository pages): all of `refresh`, `reindex`, `resync`, `claim`,
`submit` grep to **0**. Raw-HTML grep is the only instrument available, so any future assertion about this
channel is a manual measurement rather than a gate.

**Bearing on `s4-1-1`, strengthening the counter-fact in A4.5(4) rather than settling it:** a hub skill
published into this channel would appear on it only when somebody installs the hub through the CLI. "Put
the bootstrap in the channel" is not an act the publisher can perform here. Still not ruled.

### A4.7 — The other channel, measured: it is not a listing for Convoke at all, and its pre-install surface is a different field

A4.5(2) left open whether the Claude Code marketplace behaves like skills.sh. It does not, in any respect,
and the answer closes `IN-255(b)`.

**First, Convoke is in none of the catalogues.** Measured 2026-10-14 against each catalogue's own
`marketplace.json`, which is *"the catalog itself"* per Anthropic's docs:

| Catalogue | Entries | `convoke` | Status |
|---|---|---|---|
| `anthropics/claude-plugins-official` | **315** | **0** | not listed |
| `anthropics/claude-plugins-community` | **2283** | **0** | not listed |
| `bmad-code-org/bmad-plugins-marketplace` | — | — | PR #9 **closed unmerged** 2026-04-27 |

```sh
for r in anthropics/claude-plugins-community anthropics/claude-plugins-official; do
  curl -sS -L "https://raw.githubusercontent.com/$r/main/.claude-plugin/marketplace.json" \
  | tee /tmp/$(basename $r).json | grep -ci convoke
done
```

The six `vortex` matches in the community catalogue belong to an unrelated `AppsVortex` org (`arn-code`,
`arn-infra`, `arn-spark`) and are not Convoke.

**So the "second listing channel" is not a listing.** The only Claude Code path to Convoke is **BYO-URL** —
`/plugin marketplace add amalik/convoke-agents` — which reads `.claude-plugin/marketplace.json` **live from
the repository**. That is the opposite failure mode from skills.sh: no staleness is possible, because there
is no snapshot and no catalogue in between.

**And the pre-install surface there is a different field from the one `cir-1-3` wrote to.** From
`/docs/en/plugins/install`:

> *"The details pane shows **the plugin's description**."* Skills appear only under *"**Will install**: the
> commands, agents, skills, hooks, and MCP and LSP servers the plugin adds"* — a component list — and
> *"**Plugins from a local or custom marketplace can show `Components will be discovered at installation`
> instead**."*

A BYO-URL marketplace **is** a custom marketplace, so that last sentence is Convoke's case. `Last updated`
and `Context cost` are documented as official-marketplace-only. Nothing in the documented pane renders a
**skill's** frontmatter `description` before install.

Convoke's plugin entry description, read from the shipped manifest, is:

> `"Vortex Framework — 7-stream product discovery for IT transformation consultants."`

**It carries no disclosure.**

### The combined result: zero pre-install reach on both channels, for two unrelated reasons

| Channel | Is the skill `description` the pre-install surface? | Reach of the `cir-1-3` notice |
|---|---|---|
| skills.sh | **Yes** — A4.1 confirmed it | **0 of 7** — 1 of 7 indexed, and that one is a June snapshot (A4.6) |
| Claude Code (BYO-URL) | **No** — the surface is the *plugin entry's* `description` | **0** — that field was never written to |

**A2.1's first row is therefore wrong on both halves, not one.** It read *"The two listing channels (via
`marketplace.json`) | **yes**, all 7 | **yes**, all 7"*. Measured: neither channel renders the notice to a
browsing operator, and one of them is not a listing channel for Convoke in the first place.

**The asymmetry that matters for whatever is ruled next.** The skills.sh half is not fixable by publication
(A4.6). The Claude Code half is fixable by **one line** — the notice appended to the plugin entry's
`description` in `.claude-plugin/marketplace.json`, a file `validate-marketplace.js` already parses and
which `agent-surface-parity` already runs inside `publish.needs`. That asymmetry was invisible while both
channels were assumed to render the same field.

**A channel that exists and has never been used.** `anthropics/claude-plugins-community` is an opt-in
catalogue of **2283** third-party plugins with a documented submission path
(`/docs/en/plugins/publish`), and on it the plugin entry's `description` is the rendered surface and the
catalogue is a repository read live rather than a telemetry snapshot. **Convoke has never submitted to it.**
PR #9 went to `bmad-code-org/bmad-plugins-marketplace`, which is BMAD's marketplace and a different
destination; the structural objection recorded there (`skills/` at root, `module.yaml`, `module-help.csv`)
is BMAD's requirement, not Anthropic's. Whether Anthropic's community catalogue would accept the current
packaging is **untested**. This is recorded because the initiative has been reasoning about "the two
listing channels" as a closed set, and one of the two turns out to be a path Convoke declined to take
rather than a channel that declined Convoke.

**Still not ruled.** A4.5's four questions keep their blanks; this subsection answers only (2), and it
answers it with a fact that makes (3) and (4) sharper rather than settling them.

## Consequences

The four constraint questions the ruling had to answer. **Three are settled by S4
itself; one needs a one-line confirmation.**

**C1 — Baseline budget (constraint 1): no re-ratification needed for S4.** *(The one item
this flagged for confirmation was ruled the same day — see C10.)* S4 adds one plugin entry to a manifest that already exists and one hub skill.
It needs no new ADR, no new registry and no new CI check. It does need a **row** in
`_bmad/bme/_config/name-registry.csv`, and the registry currently types rows by team and
agent — a hub skill is neither. **Extending an existing registry with a row type is not
a new deliverable, but it modifies an artifact ratified by meta-model ADR-001, so it
needed a line of its own, given in C10.** S2 will need a full re-ratification; that is
part of what makes it a destination rather than a next step.

**C2 — ADR-004 (constraint 2): not amended. Deferred to S2.** S4 makes nothing newly
invocable beyond the hub, which fits an existing declared shape. ADR-004's rejected
third shape is needed only to make **contracts** addressable, which is S2's work. The
amendment is therefore a precondition *of S2*, recorded here so S2 cannot start by
assuming it.

**C3 — `preflight-soft-warn` (constraint 3): not amended, and this is an argument for
the ruling rather than a cost of it.** S1's shape — a skill that *refuses* and explains
— collides with the rule's stderr-WARNING/exit-0 contract and with Operator Rights
OC-R1 and OC-R5. S4's shape does not: the hub **detects, warns, offers setup and passes
through**, which is the contract the rule already mandates and the pattern upstream runs
at `skills/bmad-prd/SKILL.md` step 1. **S4 is the only option that needs no amendment
here.**

**C4 — `.gyre/` (constraint 4): unchanged, and the question does not arise.** S4 does
not make Gyre's workflows addressable from a plugin cache; the hub materialises the
runtime in the operator's project, so `.gyre/capabilities.yaml` stays at the project
root where `team-state-directories` requires it. **The conflict becomes live only under
S2**, and S2 must state its answer before it starts.

### Consequences beyond the four

**C5 — The hub closes three defects at once, which is why it is the move.** Gyre's
absence from every skills channel, `convoke-install-gyre` being a `bin` entry rather
than a skill, and the absence of any runtime bootstrap are **one defect**: the thing that
builds the runtime is not itself in the channel. The hub is that thing.

**C6 — The manifest becomes intentional.** `.claude-plugin/marketplace.json` is already
the discovery surface; today it declares seven agent paths by accident of authorship.
Under S4 it declares what Convoke means to publish, which is the finding of 2026-09-26
converted into a design.

**C7 — Parity is explicitly not a goal.** Nobody runs both channels at parity; upstream's
own marketplace copy is a generation behind its skills.sh copy. S4 accepts the asymmetry
as the design.

**C8 — The irreversibility constraint still binds, and was RULED 2026-09-27.** There is no
self-serve retraction from skills.sh.

**Ruling: Amalik accepts publishing the name `convoke`.** That is an acceptance of the
**declared-but-unchecked** branch — C8's *declared* half is satisfied by the manifest and the
tracked directory; its *checkable* half is **not**, because the check is a new CI gate that C1's
spent baseline budget forbids. So C8 is satisfied here by an **operator-accepted risk, not by a
check**, and that is the record.

**What the acceptance does and does not cover.** The durable, unretractable artifact is the
**frontmatter `name`** — skills.sh keys a listing on it (`bmad-bme-agent-wade` became a URL and a
`--skill` argument by name, not by path). So this ruling makes the *name* permanent and leaves the
*location* free: the hub may later move to `_bmad/bme/` (`I80`) or to a root `skills/` tree (PR #9's
structural rejection) without a second irreversible act. **The acceptance is not a waiver of the
check** — if the baseline is re-ratified for one gate, C8's second half should still be closed.

**C10 — The name registry gains a `kind: skill` row type.** Ruled 2026-09-26. The
alternative was to declare the hub as an agent, which would misdescribe it — a hub is
neither a team nor an agent. A parallel list was never an option: meta-model ADR-001 made
this registry *the* declaration point, and a second one would undo its purpose. Extending
an existing row type is the cheapest honest option and preserves the single declaration
point. This is a **row-type extension, not a fourth deliverable**, so it does not reopen
the baseline budget — but `scripts/audit/name-registry-integrity.js` must learn the new
kind **in the same change**, or the check goes green on a row it cannot read.

**C10 as implemented, 2026-09-26.** `VALID_KINDS` gained `skill`; the hub is named
**`convoke`**, matching upstream's own `bmad` hub and the `convoke` team row's existing scope
("Core platform, CLI, update system, meta-infrastructure"). The collision is declared on the
new row per A1, and the row is `proposed` — the name is reserved, nothing is built. Two things
the implementation surfaced, recorded here rather than left in a CSV cell:

- **A1 needed no logic change, but its message was wrong.** It already grouped by name and
  counted distinct kinds, so it was kind-agnostic — yet the text read *"is used by both a team
  and an agent"*, true only while `VALID_KINDS` held exactly those two. It now reports the kinds
  actually present. A message naming a defect that does not exist is worse than none: the reader
  goes looking for an agent.
- **⚠️ A2 does not cover skills.** The tracked-source assertion branches on `kind === 'agent'`,
  so a `skill` row's source file is never verified. Harmless today, because `OPERATIONAL` is
  `shipped`/`in-dev` and this row is `proposed` — but **the day the hub ships, the registry will
  assert a skill exists without checking that it does.** That is the presence-only hole ADR-004
  §3 warns about, and it must be closed in the same change that flips this row to `in-dev`, not
  afterwards.

**C11 — The hub fronts `convoke-install`, `convoke-update` and `convoke-doctor` before it
absorbs them.** Ruled 2026-09-26, deliberately against the obvious answer. Upstream's
`bmad` hub does all three itself, and `slash-command-ux-for-user-facing-tools` points the
same way — but absorbing outright means rewriting three working CLIs on the eve of a
channel change, unbudgeted, with the install path as the blast radius. **Fronting them
puts the runtime bootstrap in the channel immediately, which is the whole of C5, without
touching code that works.** It also keeps the binaries intact for the ~40% standalone
segment, who never touch the channel and for whom `convoke-export` is the delivery path.
Absorption becomes a later, measurable step rather than a precondition — the ratified
baseline-before-expansion pattern: ship the small thing, then one measured test.

**C12 — The baseline is NOT re-ratified for a gate. Ruled 2026-09-27.** C8's *checkable* half and
several of `s4-1-1`'s acceptance criteria would each be cheapest as a CI check, and C1 forbids one.
The answer is not to re-ratify: **the ratified sequence is ship, then a tiny baseline, then one
measured test — and the hub is the measured test.** Gating before the test runs inverts the order,
and the standing counter-metric is 111 gates built for ourselves against none shipped to an operator.
So the assertions run as story tasks with their output recorded in the story, the same
declared-but-unchecked posture accepted in C8, and a gate is considered **afterwards** — with
evidence about what actually broke rather than a guess about what might.

**C13 — The hub's location is `.claude/skills/convoke/`, and it joins `I80`. Ruled 2026-09-27.**
The permanent artifact is the frontmatter **name**, not the path, so a later move costs a rename plus
the three tracking sites rather than a second irreversible act. `I80` is already a consolidation row,
so the hub joins it and all three tracked operator-tooling skills move once. PR #9's root-`skills/`
is an upstream marketplace contract, not Convoke's requirement.

**C14 — No doctor coverage for the hub, recorded. Ruled 2026-09-27.** `checkModuleSkillWrappers`
iterates a discovered module's `config.yaml` workflows, so for a non-workflow skill a
`skill-manifest.csv` row is never looked up and changes nothing; neither existing tracked skill has
one. **But silence is not neutral:** `audit-bmm-dependencies.js:515` tests
`startsWith('convoke-')`, and the directory is `convoke`, so the hub classifies as `unknown` and
`convoke-doctor` would report it under `unregistered-custom-skill` **in every operator's tree**.
C10 fixed the name, so `s4-1-1` owns the classifier branch.

**C9 — Unaffected by this ruling.** The six verified defects are remediation and proceed
independently. The air-gapped / internal-registry gap the ledger calls *"real and
unsolved"* is narrowed by neither S4 nor S2 and remains open.

## Not in this ADR

- **The six defects** in the findings note are remediation and do not depend on this
  ruling. They can proceed as a mini-epic on the `fic` / `tfr-epic-1` precedent.
- **The hub skill's name**, and the order in which the six defects are remediated. The
  hub's shape is settled to the extent of C10 and C11; naming follows the `kind: skill`
  extension.
- **The maturity ledger correction** is independent and carries a clock: the document
  is client-facing and was presented on 2026-09-22 containing statements that are false
  in the reassuring direction.
- **The air-gapped / internal-registry gap** the ledger calls *"real and unsolved"* is
  narrowed by no option here and remains open.
