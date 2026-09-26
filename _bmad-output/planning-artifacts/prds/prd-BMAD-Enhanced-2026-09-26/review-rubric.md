---
title: 'Channel Integrity — PRD quality review'
initiative: convoke
artifact_type: report
qualifier: channel-integrity-review-rubric
status: draft
created: '2026-09-26'
updated: '2026-09-26'
schema_version: 1
---

# PRD Quality Review — Channel Integrity: how Convoke arrives

Reviewed: `prd.md` (219 lines) + `addendum.md` (144 lines). Claims were re-derived
against the working tree at review time; commands are given inline so every figure
below is checkable.

## Overall verdict

The thesis is real and well earned — *the listing did not create the exposure, it
rendered it; the manifest is the discovery surface* — and the addendum is unusually
disciplined source work (it corrects the session's own earlier claims, labels one
finding unverified, and flags its own coined vocabulary as not-a-published-pattern).
What is at risk is the factual centerpiece and the scope arithmetic: the PRD's channel
model omits **npm**, the channel Convoke actually ships on today, and three
consequential claims are false once npm is in the frame (SM1's "0 declared",
defect 4's "absent from every channel", FR13's "exist nowhere in the tree"). Separately,
F4 asks for ~55 newly addressable units and three new CI gates while NFR2 declares a
hard budget of one ADR, one registry and one doctor check, and non-goal 3 forbids a
multi-team release — the contradiction is never named, let alone resolved. This is a
good diagnosis with an unbudgeted requirement set; it is not yet safe to break into
epics.

## Decision-readiness — thin

The PRD states positions rather than hedging, and several are genuinely brave: install
counts named as a **counter-metric** rather than a goal (`prd.md:92-95`), "names
published" named as an irreversible counter-metric (`:113-114`), and defect 0
**downgraded** against the session's own earlier position (`:60`) — a PRD that argues
itself down is rare and creditable. Non-goals do real work: each of the three cites the
constraint that makes it a non-goal (NFR1, NFR2, the one-skill-channel argument).

But the real forks are unmarked. The single `[NOTE FOR PM]` in the document
(`:215-218`) is about `project_name: BMAD-Enhanced` in `_bmad/bmm/config.yaml` and a
file-layout convention — a safe checkpoint, exactly the rubric's red flag. Meanwhile at
least three genuine forks carry no callout at all: (a) NFR2's hard budget against F4's
scope; (b) FR3's satisfiability if OQ-2 resolves against the flag; (c) FR14/FR15 saying
"each" while SM3/SM4 have no target. A reader who pushed back on any of those three
would find their objection unaddressed, not answered.

OQ-1 is the deeper problem. It is presented as open — *"the decision is a mechanism and
belongs to the architecture document"* (`:69-72`) — while FR14 ("each workflow can be
invoked by name without first activating an agent") and FR15 ("each handoff contract is
a named, addressable artifact") **are** addendum option S2, stated as requirements. S1
(installer-led, "the only supported path") is eliminated by FR14/FR15/FR19 without a
sentence saying so. The deferral is rhetorical: the unit decision is made in F4 and
disowned in OQ-1. `.memlog.md:6` records the operator choosing the opposite route
("the doctrine comes IN as requirements … the unit decision, S2-prime … None of them are
deferrals any more"), and `.memlog.md:8` records the skill's contrary scoping assumption
and even flags it as the thing to overturn — but that assumption never reached the PRD.

### Findings
- **high** OQ-1's deferral is contradicted by FR14/FR15 (§Open Questions `:69-72`, §F4 `:154-157`) — FR14+FR15 are addendum S2 (`addendum.md:134-136`) expressed as requirements; S1 is eliminated silently. `.memlog.md:6` records the operator accepting the opposite route. *Fix:* either state in OQ-1 that the PRD constrains the unit to S2/S3 and only the build mechanism is open, or strike "each" from FR14/FR15 and replace with the property that must hold of whatever unit is chosen (e.g. "a workflow is invocable without prior agent activation, by whatever means the architecture selects").
- **high** The OQ-1 scoping assumption is untagged in the PRD (§Gaps `:211-214`) — the two `[ASSUMPTION]` tags cover stakes and entry point; the third and most consequential assumption lives only in `.memlog.md:8`. It is the reason SM3 and SM4 have no target and F4 is unquantified. *Fix:* add `[ASSUMPTION] Unit decision deferred to architecture` inline, with the memlog's own "this is the thing to overturn" sentence.
- **medium** The only `[NOTE FOR PM]` sits at a safe checkpoint (`:215-218`) while three live forks carry none. *Fix:* add `[NOTE FOR PM]` at NFR2-vs-F4, at FR3/OQ-2, and at FR14/FR15-vs-SM3/SM4. The config-naming note is a housekeeping item, not a PM decision — demote it.
- **medium** OQ-3 asks which channel is primary but the answer space excludes npm (`:74-76`). With npm in frame the question changes shape (three channels, one of which already delivers the complete module). *Fix:* re-ask OQ-3 over the real channel set.

## Substance over theater — strong

Almost nothing here is furniture. **Zero personas** — correct for this shape, and the
PRD does not manufacture them to look thorough. No differentiation section, no
"innovation" claim. The NFRs are the opposite of boilerplate: NFR1 carries a number
("N-1, four to six weeks"), NFR3 states *why* irreversibility binds ("there is no
self-serve delisting; retraction is manual and discretionary"), NFR4 cites the specific
ruling it encodes ("the BUG-19 ruling: an empty registry created at install, not a
populated one"). NFR5 and NFR6 are product-specific and falsifiable. There is no
"the system must be scalable/secure/reliable" row anywhere.

The addendum raises the bar further. `addendum.md:103-106` explicitly retracts its own
framing: *"'Personaless process skills as connective tissue' is this session's own
coinage, not a published pattern"* — and hands over the citable vocabulary instead.
`addendum.md:54-57` labels the `metadata.internal` / web-listing question unverified and
says "check this before designing on the flag", which then surfaces as OQ-2. The
`.gitignore:66-71` citation at `addendum.md:43` is **exact** (I checked: 66 `!.claude/`
through 71 `!.claude/skills/bmad-register-skill/`). The CSA citation is even marked as
overreaching on its own side (`addendum.md:121-122`). This is sourcing discipline, not
citation theater.

Two soft spots. First, the declared entry point is *"Vision + Features"*
(`:213-214`) and there is **no Vision section**. The Trigger is a diagnosis and the
Goals are outcomes; neither states a future state an operator would recognise. The
document is Features-only against its own stated entry point. Second, §Defects is
headed "Six were verified" (`:53`) and the header claims *"every figure was produced by
execution on 2026-09-26"* (`:18-20`) — but defect 0's severity turns on a **reading of
the CLI README**, not an execution of the CLI, and the PRD does not distinguish the two
bases. The reading happens to hold (see the depth arithmetic under Done-ness), but
"verified" is doing work the evidence does not support.

### Findings
- **medium** Declared entry point "Vision + Features" delivers no Vision (§Gaps `:213-214`) — nothing in the document states the intended end state; Goals are outcomes and the Trigger is a diagnosis. *Fix:* either add three sentences of Vision (what an operator's first contact with Convoke looks like when this is done) or retag the entry point as Features-only, which is a defensible choice for a capability spec.
- **medium** "Six were verified" conflates execution with document-reading (§Defects `:53`, header `:18-20`) — defect 0's downgrade rests on the README's discovery passage, never on running `npx skills add` against this repo. *Fix:* label each defect row with its basis (executed / read / inferred). The project's own lesson applies: verify against the basis the claim is about.

## Strategic coherence — adequate

There is a thesis, it is stated, and it is not the obvious one. *The module is the unit
of coherence and has stopped being the unit of distribution* (`addendum.md:134-136`),
reached via the Trigger's reframe (`:27-36`). The feature arc follows from it and reads
as a chain, not a backlog: F1 make the surface intentional → F2 make failure legible →
F3 make references survive relocation → F4 make the value addressable → F5 serve both
segments → F6 keep the record true. The MVP scope kind is coherent (problem-solving /
integrity, not revenue), and the counter-metric set is the strongest part of the
document — naming install counts and listing counts as things that *can rise while SM5
worsens* is precisely a thesis-protecting counter-metric.

Two things break the coherence. First, **the metrics that test the thesis are the two
without targets.** If the bet is that the value lives in workflows and contracts, SM3
and SM4 are the bet, and both say "*to be set with G3's scope*" (`:107-108`). Everything
quantified (SM1, SM2, SM5, SM6) measures hygiene; nothing quantified measures the
thesis. Second, **F4 does not fit inside the strategy the PRD says binds it.** Non-goal
3 forbids "a multi-team release" on the authority of the ratified
baseline-before-expansion rule; NFR2 restates the budget as *one* ADR, *one* name
registry, *one* doctor check, "hard budget". F4 then asks for: 4 new Gyre agent skills
(FR13), 30 workflows individually invocable (FR14), 14 contracts as addressable
artifacts (FR15) — and the FR set as a whole asks for at least three new CI gates
(FR4 divergence gate, FR12 bare-path gate, FR20 compatibility checkability). Against
"one doctor check". The PRD raises the budget twice and never measures itself against
it.

### Findings
- **critical** F4 and the FR-wide gate count exceed NFR2's hard budget, unacknowledged (§F4 `:150-161`, §NFR `:186-189`, §Non-goals `:98-99`) — FR13+FR14+FR15 = 4 + 30 + 14 = ~48 newly addressable units, plus FR4/FR12/FR20 = three new gates against a budget of one. The PRD cites the budget as binding and then breaks it without a de-scoping proposal. *Fix:* pick one of three honest resolutions and state it: (a) declare F4 out of the baseline and file it as the successor initiative, keeping F1/F2/F3/F6 inside budget; (b) reduce F4 to one proof unit (one workflow + one contract addressable, as the measured test the ratified baseline actually calls for) and set SM3/SM4 to 1 of 30 and 1 of 14; (c) overturn NFR2 explicitly with the operator's signature. Silence is the one option that is not available.
- **high** The thesis's own metrics are the unset ones (§SM `:107-108`) — SM3 and SM4 are the only rows that test "the value is in the workflows and contracts", and both are blank; the quantified rows all measure hygiene. *Fix:* if OQ-1 must stay open, set SM3/SM4 as a floor now ("at least 1 workflow and 1 contract addressable end-to-end, count set by architecture") so the thesis has a falsifiable test at this version.
- **medium** Three of six verified defects have no success metric (§Defects `:58-65` vs §SM `:103-110`) — defect 2 (bare paths), defect 3 (dead upstream dependencies) and defect 5 (maturity ledger row) map to FR12, FR23 and FR22 but to no SM row. Defects 0/1/4 map to SM6/SM5/SM2. *Fix:* add SM rows for bare-path count (today: derive with the FR12 gate's own scan) and dead-upstream-dependency count (today: 4), or say explicitly that those two are gate-only, no metric.

## Done-ness clarity — thin

Several FRs are genuinely strong and I would hand them to an engineer as-is. FR6 has a
temporal bound an implementer can test ("during activation, **before producing
output**"). FR7 names two concrete outputs (the missing component, the exact command).
FR16 is a hard invariant with a named registry. FR4 and FR12 name the failing actor
(CI). FR8 carries the mechanism in its parenthetical — *"the storefront renders
frontmatter `description`; a README is invisible to it"* — which is what makes it
testable rather than aspirational.

Then there is a long adjective tail. **FR17** ("a skill that is metadata or scaffolding
rather than a capability is *distinguishable* from one an operator should invoke") names
no mechanism, no field, no place a reader looks — and it overlaps FR3 and SM6 while
partitioning the skill space differently (see Downstream usability). **FR9**'s
"silently" is undefined and unmeasurable as written, yet SM5 quantifies it ("installs
that fail **silently**: unknown, assumed all → zero") with no measurement procedure;
"assumed all" is honest but means the baseline is not a measurement. **FR19**'s
"complete module, configuration included" has no manifest to check "complete" against —
though `package.json` `files[]` is sitting right there and would serve. **FR21** ("an
operator can tell, before installing, which parts a given channel path will and will not
deliver") states no surface and no artifact; done-ness is unjudgeable. **FR22** ("derived
from the repository at the stated version, never asserted from memory") is a process
rule in FR clothing — provenance is not testable from the artifact. **FR11** is
conditionally testable but names no acceptance environment, and it is the one FR that
*requires* a real install fixture (plugin cache, global skills dir) to close.

The sharpest done-ness collision is FR14/FR15 versus SM3/SM4: the FRs say **each** of
30 and **each** of 14; the metrics say the target is unset. An engineer cannot know
whether story 1 of F4 is "one workflow" or "all thirty".

Two notes on the FR3 / defect-0 pair, since this is where the PRD's central correction
lives. The downgrade **holds on the arithmetic**, and better than the PRD argues it: no
fixture `SKILL.md` sits within three levels of the repo root. Derive with
`for f in $(git ls-files 'tests/*' | grep SKILL.md); do echo "$f" | awk -F/ '{print NF-1}'; done | sort -n | uniq -c`
— depths are 4 (x6), 6 (x2), 7 (x28), 8 (x1). That is a **depth invariant**, it is
CI-checkable today, and it does not depend on OQ-2. FR3 as written instead depends on a
per-skill marking whose efficacy against the web storefront is exactly what OQ-2 says is
unverified — so FR3 may be unsatisfiable, and SM6's target of zero with it. The durable
form of FR3 is the invariant, not the flag.

### Findings
- **high** "addressable" is load-bearing and undefined (§SM `:106-108`, §F4 `:152-157`) — SM2/SM3/SM4 and FR13/FR14/FR15 all turn on it, and the Trigger proves the two candidate meanings come apart: the 7 Vortex agents are reachable *because the manifest declares them*, not because they hold a `SKILL.md`. FR13 ("all 11 agents exist in the repository as skills") therefore does **not** achieve SM2 ("agents addressable, 11 of 11") — it produces 4 more `SKILL.md` files that no channel offers. *Fix:* define addressable once (proposed: "declared in a channel manifest **and** resolvable by that channel's documented install path") and amend FR13 to require declaration, not existence.
- **high** FR14/FR15 say "each" while SM3/SM4 have no target (§F4 `:154-157` vs §SM `:107-108`) — the two statements of scope disagree and nothing says which binds. *Fix:* make the FRs match whatever floor SM3/SM4 get.
- **medium** FR3 may be unsatisfiable as written; the depth invariant is satisfiable today (§F1 `:122-124`, OQ-2 `:72-73`) — FR3 relies on marking, OQ-2 says marking may not suppress the web listing, so no amount of implementation closes FR3 if OQ-2 resolves against the flag. *Fix:* restate FR3 as a structural invariant — "no non-product `SKILL.md` exists within three levels of the repository root, inside any CLI container directory, or in any channel manifest" — and keep `metadata.internal` as defence in depth. That version is checkable now and survives a `.gitignore` or directory rename, which is the fallback risk the PRD itself raises at `:60`.
- **medium** FR17, FR19, FR21, FR22 and FR9's "silently" have no verifiable consequence (§F2 `:137-138`, §F4 `:161`, §F5 `:168-172`, §F6 `:176-177`). *Fix:* FR17 → name the field and its values; FR19 → "complete" means the set declared by `package.json` `files[]`, checked by a post-install assertion; FR21 → name the surface (the storefront `description` plus a per-channel coverage table in the README) and the content; FR22 → move to NFR5 where it already lives and delete the duplicate FR, or give it a gate; FR9 → define silent as "produces artifact output without having emitted the FR7 notice".
- **medium** FR11 names no acceptance environment (§F3 `:143-146`) — it is the only FR that cannot be closed without a real relocated install. *Fix:* name the two fixtures (plugin cache path, global skills dir) as part of the requirement, so the story inherits them.
- **low** FR22 and NFR5 overlap, and FR2 partly restates NFR5 (`:176-177`, `:196-197`, `:120-121`). *Fix:* keep the gate-able form, delete the restatement.

## Scope honesty — adequate

The disclosure discipline here is above average. The status banner is unambiguous —
*"Nothing below is a requirement yet"* (`:17`). §Gaps does not merely note the missing
journeys, it states the consequence and names the weakest requirements by ID: *"FR18–FR21
stand on inference by acceptance rather than by capture — a later reader should treat
those four as the least validated requirements in the document"* (`:206-209`). That is
the sentence most PRDs will not write. Non-goals each carry their authority. SM3/SM4's
blankness is declared rather than filled with a plausible number.

Open-items density is appropriate for the stakes: 3 OQ + 2 `[ASSUMPTION]` + 1
`[NOTE FOR PM]` + 2 unset targets on an explicit draft at internal-to-launch stakes is
fine. It would be a blocker on a green-light document, and the banner correctly prevents
that reading.

What is *not* honest is by omission, and one omission is large. The PRD's channel world
is two channels — skills.sh and Claude Code marketplaces. Convoke's actual shipping
channel is **npm**: `convoke-agents@4.0.3`, with a 23-entry `package.json` `files[]`
that is a tracked, explicit declaration of the published surface. The string "npm"
appears **once** in the entire document set — as option S1 in `addendum.md:130` — and
never in the PRD body, the measured position, the SM table, or FR3's "any documented
channel path". Verify with
`grep -in 'npm\|package.json\|skill-manifest' prd.md addendum.md`. Three claims are
false once npm is in frame, and a fourth requirement may already be satisfied. Likewise
`_bmad/_config/skill-manifest.csv` — 106 rows with `name` and `path` columns, i.e. the
repo's existing declared-skill-set artifact, and itself shipped in `files[]` — appears
nowhere, even though FR1 asks for a declaration "in one place" and FR4 asks for a gate
on declared-vs-reachable divergence.

### Findings
- **critical** The channel model omits npm, and three factual claims are false because of it (§Measured position `:38-50`, SM1 `:105`, defect 4 `:64`, FR13 `:152-153`) — (1) SM1's baseline "**0 declared**" is wrong: `.claude-plugin/marketplace.json` declares 7 skill paths and `package.json` `files[]` declares 23 published paths (`node -e 'console.log(require("./package.json").files)'`); the Trigger itself argues the manifest is a deliberate declaration, so SM1 contradicts the PRD's own thesis two pages earlier. (2) Defect 4, "Gyre structurally absent from **every** channel", is false: `files[]` ships `_bmad/bme/_gyre/`. It is absent from the two *skill* channels. (3) FR13's parenthetical, "Gyre's four are generated at install time today and **exist nowhere in the tree**", is false — `ls _bmad/bme/_gyre/agents/` returns `model-curator.md`, `readiness-analyst.md`, `review-coach.md`, `stack-detective.md`; what is absent is their `SKILL.md` wrappers, which is exactly what `:47-48` gets right. An engineer reading FR13 would scope "author four agents" instead of "wrap four existing agents". *Fix:* add npm as a third channel to the measured position with its own addressability column; restate SM1 as "one declaration per channel, all three reconciled by a command" with today's baseline of "3 partial declarations, 0 reconciled"; scope defect 4 to "the two skill channels"; delete FR13's false parenthetical and replace with "Gyre's four agent definitions exist at `_bmad/bme/_gyre/agents/*.md`; none carries a `SKILL.md`".
- **high** The "Personaless skills that exist" row contradicts the nine-skill surface two lines below it (§Measured position `:45-50`) — the row claims 7 exist and "**7** — all of them" are addressable, but the paragraph derives the public discovery surface as **nine** = 2 tracked under `.claude/skills/` + 7 manifest-declared Vortex agents. The 7 personaless skills are `_bmad/bme/{_artifacts,_enhance,_portability}/workflows/*/SKILL.md` (`git ls-files '_bmad/bme/*' | grep SKILL.md`): five path segments deep, outside every container directory, in no manifest — so **0**, by the PRD's own mechanism. The columns also fail to add up: 7 + 7 = 14, not 9. *Fix:* set that cell to 0 and state the reason (depth 5, non-container, undeclared); then the table reconciles to 9 with the two `.claude/skills/` entries added as their own row.
- **high** SM6's baseline of 38 is a transcribed figure, wrong twice, in a document whose NFR5 forbids exactly that (§Defects `:60`, SM6 `:110`) — `git ls-files 'tests/*' | grep -c SKILL.md` = **37**, and of those, `for f in $(git ls-files 'tests/*' | grep SKILL.md); do grep -m1 '^name:' $f; done | grep -c '^name: bmad'` = **31** carry verbatim upstream `bmad-*` names; the other 6 are synthetic `skill-with-*` names that shadow nothing. The 38th `SKILL.md` outside the product tree is `_bmad-output/exp3-smoke-test/bmad-cis-agent-brainstorming-coach/adapters/claude-code/SKILL.md` — a smoke-test output artifact, not a fixture, and not under `tests/`. So one number is carrying three different classes with three different remedies: 31 shadowing-capable names (FR16/NFR6), 6 harmless synthetic fixtures, 1 stray generated artifact outside `tests/`. *Fix:* split the row into the shadowing class (31) and the installable-non-product class (38 across two trees), give each its derivation command per NFR5, and note that `_bmad-output/` is a second non-product tree FR3 must cover — the PRD currently reasons only about `tests/`.
- **medium** `_bmad/_config/skill-manifest.csv` is absent from a PRD about declared skill sets (§F1 `:117-126`) — 106 rows, columns `name` and `path`; it is the repo's existing declared-set artifact and is itself published. FR1 ("declared in one place") and FR4 (divergence gate) will collide with it, and project history records four failed attempts against this file because most of its `path` values are non-resolving **by design**, plus one reverted ADR. An implementer meeting FR4 naively will read those rows as drift. *Fix:* name the file in F1, state whether FR1 consolidates the three existing declarations or adds a fourth, and carry the candidate-list caveat into FR4's scope so the gate excludes it explicitly.

## Downstream usability — thin

This dimension matters here more than usual: `.memlog.md:7` records that
`bmad-create-epics-and-stories` was invoked first and **halted** because no PRD and no
architecture existed. This document is chain-top with a consumer already waiting, so
source-extractability is load-bearing, not optional.

The mechanics are clean. FR1–FR24 are contiguous, unique and correctly partitioned
across F1–F6 (5+4+3+5+4+3 = 24). G1–G4, SM1–SM6, NFR1–NFR6, OQ-1–OQ-3 and defects 0–5 are
all contiguous with no duplicates. Internal cross-references resolve: FR11's "fails per
FR6–FR9", non-goal 2's NFR1, non-goal 3's NFR2, the counter-metrics' NFR3. Sections are
readable pulled out alone, and the addendum is genuinely separable — mechanism there,
requirements here, with no "see above" dependence.

What will hurt downstream is vocabulary. There is **no Glossary**, and the document's
core concept appears under four near-synonyms with load-bearing differences: *reachable*
(SM1, FR1, FR4), *addressable* (SM2–SM4, F4 heading, FR15), *discoverable* / *discovery
surface* (`:32`, `:47-50`), and *declared* (SM1, FR1) — while `marketplace.json` already
uses "declares" for something the PRD calls 0. Worse, the skill space is partitioned
**three incompatible ways**: FR3's product / non-product, FR17's capability /
metadata-or-scaffolding, and the table's personaless / persona (plus the addendum's S2
"personaless skills"). Are the 14 handoff contracts "metadata" under FR17 or "product"
under FR3? Are the 7 personaless tooling skills products? Undecidable as written, and
FR3 and FR17 will generate contradictory stories. Finally, three external references —
T214 (`:62`, `:148`), BUG-19 (`:194`) and "the ratified baseline-before-expansion rule"
(`:98-99`) — carry no path. T214 and BUG-19 do resolve in
`_bmad-output/planning-artifacts/` (T214 in
`convoke-note-initiative-lifecycle-backlog.md`, BUG-19 in
`convoke-note-4-0-1-scope-decisions.md`), but a story author has to hunt.

### Findings
- **high** No Glossary, and four near-synonyms for the central concept (throughout; §SM `:105-108`, §F1 `:118-126`, §F4 `:152-157`) — reachable / addressable / discoverable / declared are used as if interchangeable while the Trigger's own finding is that they come apart. *Fix:* add a Glossary with four entries: *reachable* (a channel's install path offers it), *declared* (a manifest or `files[]` names it), *addressable* (invocable by name after install), *discovery surface* (the union of reachable sets). Then re-read SM1–SM4 against it; at least SM1 and SM2 change.
- **high** FR3 and FR17 partition the skill space incompatibly (§F1 `:122-124`, §F4 `:161`) — product/non-product versus capability/metadata-or-scaffolding, with no mapping and no ruling on where contracts and tooling skills fall. *Fix:* one taxonomy, stated once, with every existing skill class placed in it: Vortex/Gyre agents, the 7 tooling workflows, the 14 contracts, the 30 workflows, the 37 fixtures, the 2 tracked `.claude/skills/` entries. That enumeration is also what FR1's declaration file needs, so it is not extra work.
- **medium** Three external references carry no path (`:62`, `:98-99`, `:148`, `:194`). *Fix:* add the file paths; they exist and resolve.

## Shape fit — adequate, with one split judgment

The capability-spec shape is right, and the PRD earns it. Zero personas, operational
rather than user-facing metrics, FRs written as invariants — for a developer-tooling
product with one operator role per segment, that is the correct shape and not a
shortcut. Nothing here is over-formalized. Brownfield references are mostly precise
(`.gitignore:66-71` exact; the Vortex/Gyre workflow split 23 + 7 = 30 checks out via
`ls -d _bmad/bme/_{vortex,gyre}/workflows/*/`; the HC1–HC5-are-files / HC6–HC10-are-mentions
distinction at `:156-157` matches `ls _bmad/bme/_vortex/contracts/`, which holds 9 files:
hc1–hc5 plus gc1–gc4) — with the three npm-related exceptions already filed above.

**On the missing user journeys, the answer is not uniform across the document, and
treating it as one question is what makes it look survivable.** Split F1–F6 by what
defines "done":

- **F1, F3, F6 survive with zero journeys.** Their done-ness is defined by commands and
  invariants: a declared set, a divergence gate, a bare-path gate, resolution bases,
  derived figures. No protagonist is needed to verify any of them. These are ready for
  epic breakdown today, modulo the findings above.
- **F2 and F5 do not survive.** They are first-contact experience requirements wearing
  capability-spec clothing. FR7 ("names the missing component and states the exact
  command") cannot be specified without knowing where the operator is standing — the
  storefront, a CLI install, or an activation inside Claude Code — and FR6-versus-FR8 is
  itself that distinction (runtime versus storefront) drawn without the journey that
  makes it. FR21 ("an operator can **tell**, before installing…") is a pure UX
  requirement with no surface named. FR18's "by the same means they add BMAD skills"
  presumes knowledge of a path nobody narrated. The PRD's own §Gaps concedes that *all
  six defects live inside* the find-install-first-run journey.

So: survivable for **this PRD's stated purpose** — handing the architecture document the
OQ-1 decision, which is a mechanism question F1/F3/F4 frame adequately. **Not** survivable
for the step `.memlog.md:7` says comes next. Story authors for FR18–FR21 will invent the
journey silently, and the operator's acceptance will be cited as validation for
inferences he never narrated. The honest gate is to mark F2/F5 provisional and let F1/F3/F6
proceed.

One more shape gap: §Gaps names two protagonists (one who runs BMAD, one who does not)
but the Trigger is about a **third** — the stranger who installs `bmad-bme-agent-wade`
alone from a listing, having never heard of BMAD or Convoke. That person is the entire
reason F2 exists, and defect 1 is their experience. A journeys capture that omits them
will under-specify F2.

### Findings
- **high** F2 and F5 are first-contact UX requirements with no journey basis, while F1/F3/F6 are not (§F2 `:128-138`, §F5 `:163-172`, §Gaps `:203-209`) — the PRD treats the journeys gap as uniform; it is not, and the uniform framing lets FR18–FR21 travel into stories as if they were invariants. *Fix:* mark F2 and F5 **provisional — blocked on journey capture** in the document itself, and add an explicit gate: F1/F3/F6 may enter epic breakdown now; F2/F5 may not, until two journeys are narrated. Alternatively reduce each of FR18–FR21 to its machine-checkable core (FR8's frontmatter-description form is the model) and accept that the experience question is deferred rather than answered.
- **medium** The third protagonist is unnamed (§Gaps `:203-209`) — the accidental single-skill installer, who has no BMAD and did not come looking for Convoke, is the Trigger's own subject and the subject of defect 1, but the journeys gap asks for only two protagonists. *Fix:* name three.

## Mechanical notes

- **No Assumptions Index.** Two `[ASSUMPTION]` tags sit inline in §Gaps (`:211`, `:213`)
  with no index section. Roundtrip is trivially satisfied at 2 tags, but the third
  assumption (OQ-1 scoping, `.memlog.md:8`) is untagged and unindexed, which is the
  failure that matters. Tag form is `[ASSUMPTION]` rather than the rubric's
  `[ASSUMPTION: …]`.
- **IDs are clean.** FR1–FR24 contiguous and correctly summing across F1–F6 (5+4+3+5+4+3);
  G1–G4, SM1–SM6, NFR1–NFR6, OQ-1–OQ-3, defects 0–5 all contiguous, no duplicates, no
  dangling internal cross-references.
- **No UJ section at all**, so no floating-UJ or unnamed-protagonist defects — the gap is
  the absence, covered under Shape fit.
- **Glossary absent.** See Downstream usability; listed here too because it is the
  cheapest mechanical fix with the largest downstream effect.
- **Line-number citations will rot.** `.gitignore:66-71` (`addendum.md:43`) and
  `refresh-installation.js`-style anchors are exact today; they drift on the next edit to
  those files. Prefer a grep that pins the content (e.g.
  `grep -n 'bmad-register-skill' .gitignore`).
- **Numbers that currently re-derive correctly:** 30 workflows (23 Vortex + 7 Gyre);
  7 manifest-declared Vortex agent paths; 2 tracked `.claude/skills/` entries;
  11 agents in 2 teams + 1 internal (`_bmad/bme/_team-factory/agents/team-factory.md`);
  9 contract files (hc1–hc5, gc1–gc4) with HC6–HC10 as mentions only.
  **Numbers that do not:** 38 non-product `SKILL.md` (37 + 1 of another class, 31
  shadowing-capable); "0 declared" (3 partial declarations exist); "7 personaless
  addressable" (0).
- **Housekeeping from `:215-218` stands** — `project_name: BMAD-Enhanced` in
  `_bmad/bmm/config.yaml`, and `prds/<run>/prd.md` versus the flat
  `convoke-prd-<qualifier>.md` convention used by every other PRD in
  `_bmad-output/planning-artifacts/`. Both are real; neither is a PM decision.
