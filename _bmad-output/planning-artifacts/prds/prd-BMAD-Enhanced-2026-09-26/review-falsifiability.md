---
title: 'Channel Integrity PRD — adversarial review of requirement falsifiability'
initiative: convoke
artifact_type: report
qualifier: channel-integrity-falsifiability-review
status: draft
created: '2026-09-26'
updated: '2026-09-26'
schema_version: 1
qualifier_role: agent-authored
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-BMAD-Enhanced-2026-09-26/prd.md
  - _bmad-output/planning-artifacts/prds/prd-BMAD-Enhanced-2026-09-26/addendum.md
  - project-context.md
---

# Adversarial review: can these requirements be falsified?

**Basis.** `prd.md` and `addendum.md` as of 2026-09-26 18:11, repo at `HEAD = f09e2f8c`
with `prd.md` and `.memlog.md` modified in the working tree. Every count in this review
was produced by a command; the commands are in §7 and each finding names the one that
produced it. Governing rules read: `verification-must-be-falsifiable`,
`derive-counts-from-source`, `documentation-claims-must-be-derived`,
`external-claims-must-be-executed-or-hedged`, `verification-claims-must-name-their-evidence`
(`project-context.md:527, 300, 502, 471, 614`).

**Verdict.** The FR set is unusually falsifiable for a PRD — 19 of 24 FRs name an
observation that would prove them unmet — but the document is not yet usable by an
architect, because the one decision the architecture is supposed to make (OQ-1, the
distribution unit) has already been foreclosed by FR13/FR14/FR15, the word *declared*
carries two opposite meanings in the same document, and four of the six success metrics
quote a "today" figure that no command reproduces at `HEAD`.

---

## 1. Ranked findings

Ranked by impact on the PRD's usefulness downstream, not by cost to fix.

### F-01 · BLOCKER · `declared` means two opposite things, and the two readings produce different architectures

The Trigger section says the manifest **is** the declaration:

> "**It was not a crawl, and it was not luck. Convoke's own manifest declared him.**"
> "The manifest *is* Convoke's discovery surface."

SM1's "Today" column says:

> "9 reachable, **0 declared**"

`.claude-plugin/marketplace.json` declares seven skill paths (derived: §7.1). Under the
Trigger's sense of the word, the declared set is 7 and FR1 is already partially met — the
work is a checker. Under SM1's sense, the declared set is 0 and FR1 requires a new
governance file that does not exist. Both readings are supported by the text. An architect
picking the first builds a validator over `marketplace.json`; one picking the second builds
a declaration format, a seeding path and a migration. **Nothing in the PRD distinguishes
them.** Fix: define "declared" once, in F1's preamble, and say explicitly whether
`marketplace.json` is or is not the declaration of record.

### F-02 · BLOCKER · FR4's check can be built so that it cannot fail, and SM1's target rewards exactly that

FR4: *"A check fails CI when the reachable set diverges from the declared set."* FR1 puts
the declared set "in one place in the repository"; FR2 requires the reachable set be
"derivable by a command". The PRD **never requires the two sides to have independent
sources.** If the declared set is generated from `marketplace.json` and the reachable set
is derived from `marketplace.json`, the check compares a file with itself and is green
forever.

This is the exact shape of the last row of `verification-must-be-falsifiable`:

> "**The mutant was absorbed by a derived expectation.** Wrapper generation READS that
> registry […] so the probe entered the *expected* set and the *actual* set together. The
> two sides agreed because they share a source."

SM1 compounds it. Its target is *"equal, checked in CI"* — a metric with no floor,
satisfiable by declaring whatever happens to be reachable. **G1 ("exposed on purpose") is
carried entirely by FR4 and SM1, and as written both can be satisfied without any exposure
decision being made.** Fix: FR4 must state that the reachable set is derived by walking the
filesystem/channel and the declared set is read from the declaration, and — per the rule —
that the gate is not shippable until it has failed once against an undeclared-but-reachable
skill planted on purpose.

### F-03 · BLOCKER · OQ-1 is declared open, and FR13/FR14/FR15 have already closed it

OQ-1 says: *"This PRD states what must be true of the unit; the decision is a mechanism and
belongs to the architecture document. Four options are on the record in `addendum.md` §4."*
The FRs then eliminate three of the four:

| Option (addendum §4) | Eliminated by |
|---|---|
| S1 installer-led | FR14 + SM3: workflows "addressable" where the measured table's column header defines addressable as *"Addressable by a skills channel"* |
| S3 two artifacts, one source (generated channel tree) | FR13: *"All 11 agents […] **exist in the repository** as skills"* — a generated tree is not in the repository |
| S4 router stub (one plugin on the marketplace, catalog on skills.sh) | FR15 + SM3/SM4: every workflow and every contract individually addressable, which is the opposite of a router stub |

What remains is S2. The `.memlog.md` confirms this was the intent — *"the doctrine comes IN
as requirements … S2-prime (promoting 30 workflows + 14 contracts to personaless skills)"* —
but the PRD presents the decision as open. Two consequences: the PRD breaks its own
capabilities-not-implementation rule (see §2, FR13/FR14/FR15), and the architecture document
will be asked to choose from a menu of one while believing it has four. **Fix: either say in
OQ-1 that S2 is the working assumption and the architecture's job is to falsify it, or
weaken FR13–FR15 to outcomes that all four options can satisfy** (e.g. "the flow is
reachable without prior knowledge of which agent owns which step").

### F-04 · HIGH · F4 + SM2/SM3/SM4 cannot coexist with NFR2, the multi-team non-goal, and NFR3

Counting the units F4 makes addressable: 11 agents + 29-to-39 workflows + 14 contracts
(§7.2, §7.3) — roughly 55 published names. Against that:

- **Non-goal:** *"A multi-team release."* FR13 spans *"both teams"* by its own words.
- **NFR2:** *"one ADR, one name registry, one doctor check, hard budget."*
- **NFR3:** *"No action publishes a name into a channel from which it cannot be retracted
  until F1 holds"* — and the addendum records that retraction is manual and discretionary.
- **Counter-metric:** *"count of names published (rises irreversibly, see NFR3)."*

SM2, SM3 and SM4 are metrics whose only direction of improvement is *publish more names*,
and one of the four counter-metrics is *count of names published*. The PRD gives no exchange
rate and no sequencing. An architect will either honour NFR2 and fail SM2–SM4, or honour
SM2–SM4 and blow NFR2 — and both are traceable to the PRD, not to the architect. Fix: state
which instrument wins, or scope F4 to a measured pilot (the memlog's "unlisted skills.sh
pack as a measured test" is the obvious candidate and is currently nowhere in the PRD).

### F-05 · HIGH · SM3's denominator is not derivable at any reading, and its baseline contradicts the same table

The measured table says *"Workflows | 30 (Vortex 23, Gyre 7) | **0**"*. Derived (§7.2):

| Reading | Count |
|---|---|
| Vortex live `workflow.md` + Gyre | 22 + 7 = **29** |
| Vortex including `_deprecated` + Gyre | 24 + 7 = **31** |
| All `_bmad/bme` teams | **39** |
| PRD's figure | 30 |

No command produces 30. Worse, the same table's last row — *"Personaless skills that exist |
7 | 7 — all of them Convoke's own tooling"* — counts seven items that are **all workflows**
with a `SKILL.md`, at `_bmad/bme/{_artifacts,_enhance,_portability}/workflows/*/SKILL.md`
(§7.4). So one table treats a workflow-with-a-SKILL.md as a "personaless skill" in row 4 and
asserts that **zero** workflows are addressable in row 2. Both rows cannot use the same
definition of *workflow*. An epic author sizing F4 gets a wrong count and a wrong baseline,
and — more usefully — loses the one piece of good news in the document: **the pattern FR14
asks for already exists and ships, seven times over.** Fix: state the scope ("Vortex and Gyre
workflows only"), derive the count, and cite the seven existing personaless workflow skills
as the precedent.

### F-06 · HIGH · FR16 is falsified at `HEAD` by 13 duplicate names, all of them upstream's

FR16: *"Every skill name is allocated from a single registry, and no two skills — Convoke's
or an upstream skill Convoke ships alongside — claim the same name."*

Derived (§7.5): among 75 tracked `SKILL.md`, **13 frontmatter names are claimed more than
once**, seven of them three times — `bmad-help`, `bmad-shard-doc`, `bmad-party-mode`,
`bmad-brainstorming`, `bmad-index-docs`, `bmad-review-adversarial-general`,
`bmad-review-edge-case-hunter`, plus six pairs. They are upstream copies vendored under
`_bmad/core/{skills,tasks,workflows}/`. Read literally, FR16 demands Convoke rename
upstream's own skills, which contradicts FR23's and NFR6's premise that Convoke ships
*alongside* upstream. Read charitably, FR16 is about the *published* set — but it does not
say so, and the difference is a whole epic. Fix: scope FR16 to names Convoke publishes into
a channel, and state whether vendored upstream copies are in or out.

### F-07 · HIGH · NFR1 states an unadopted proposal in the indicative, and a non-goal rests on it

NFR1: *"Convoke tracks upstream at N-1, four to six weeks behind."* Non-goals: *"chasing it
violates NFR1."*

There is no ratification. `project-context.md` contains no cadence policy (§7.6); no ADR
declares one; the only record is a memory note whose own heading reads **"Cadence policy
proposal (not yet adopted)"**. `documentation-claims-must-be-derived` is explicit:

> "A policy that does not exist yet is a **proposal**, not a fact, and must not be written in
> the indicative."

The cost is not tidiness. NFR1 is the sole stated reason to reject the flat-skills
restructure, and it is also the constraint that will be cited to reject other options later.
Fix: either get the cadence ruled and cite the ruling, or write NFR1 as *"proposed, not
ratified"* and drop it from the non-goal's justification.

### F-08 · HIGH · FR13's parenthetical is false, and contradicts the PRD's own measured position

FR13's note: *"(Gyre's four are generated at install time today and **exist nowhere in the
tree**.)"* They exist: `_bmad/bme/_gyre/agents/{model-curator,readiness-analyst,review-coach,stack-detective}.md`
(§7.3). The measured-position section states it correctly two pages earlier: *"Gyre's four
agents hold no `SKILL.md`; their skill directories are generated by `convoke-install-gyre` at
install time."* An architect reading FR13 scopes authoring four agents; the real work is four
`SKILL.md` wrappers over agents that already exist. Fix: reuse the measured-position wording
verbatim.

### F-09 · HIGH · Four of six success metrics quote a "today" figure whose basis is unstated, and three read differently elsewhere

`derive-counts-from-source` and NFR5 both bind here, and the PRD's own FR2 says *"the command
is the source of any figure quoted about it."* Not one figure in the measured table, the
defect table or the SM table carries a command.

- **SM1 "9 reachable."** Reachable = 2 tracked `SKILL.md` under `.claude/skills/` + 7
  manifest paths. The basis is *git-tracked at `HEAD`*, and it is not stated. On the
  operator's own working tree the same count is 103 (`.claude/skills` holds 101 `SKILL.md`
  on disk, 2 tracked — §7.7), and a repo-wide walk finds 258. The figure is right for the
  published-repo basis and wrong for every other; the basis is the load-bearing half and it
  is missing.
- **SM6 "38."** Derived: **37** tracked `SKILL.md` under `tests/fixtures/` (§7.7). The 38th
  is `_bmad-output/exp3-smoke-test/bmad-cis-agent-brainstorming-coach/adapters/claude-code/SKILL.md`,
  which is not a fixture — so the defect table's *"38 public `SKILL.md` **fixtures**"* is
  wrong under the only arithmetic that reaches 38.
- **SM3 "0 of 30."** See F-05.
- **SM4 "0 of 14."** 14 is derivable as a count of *named identifiers* (HC1–HC10, GC1–GC4) —
  credit — but 9 of them are files (`hc1`–`hc5`, `gc1`–`gc4`) and 5 (HC6–HC10) exist only as
  mentions (§7.3). So "0 of 14 addressable" hides that five must be **authored** before they
  can be addressed. Two different kinds of work in one denominator.

### F-10 · MEDIUM-HIGH · FR3 and SM6 can be falsified by a Vercel release rather than by a Convoke change

FR3 requires marking *"such that no documented channel path offers it for installation —
including explicitly-flagged paths, not only default ones."* SM6 measures *"reachable by any
documented flag."* Documented by whom? The `--full-depth` flag and `INSTALL_INTERNAL_SKILLS=1`
are an external CLI's surface, versioned outside Convoke. As written, a new flag in a future
CLI release moves the metric with no change to Convoke — the requirement is unownable, and a
CI gate built on it will go red for reasons no story can fix. Compounding it, **OQ-2 is
unresolved and FR3's only known mechanism depends on the answer**: the addendum flags, marked
unverified, that `metadata.internal: true` may suppress CLI installs but not the skills.sh
listing. Fix: pin FR3 to a named CLI version, and make "documented paths" an enumerated list
in the repo that a bump reviews.

### F-11 · MEDIUM-HIGH · The PRD fails its own FR2 and NFR5 in its own body

FR2: *"the command is the source of any figure quoted about it."* NFR5: *"Any figure in a
shipped document carries the command that produces it."* The PRD quotes roughly a dozen
figures (11, 7, 30, 23, 14, 9, 38, 6, 4, 2) and carries no command for any. The header even
asserts the derivation without showing it: *"every figure was produced by execution on
2026-09-26."* Per `verification-claims-must-name-their-evidence`, that sentence is a claim
about the correctness apparatus with no pointer, and §7 of this review shows three of those
figures (30, 38, and FR13's "nowhere in the tree") do not survive re-derivation. Fix: either
scope NFR5 to shipped operator-facing documents and say the PRD is out of scope, or add the
commands — the second is cheap and would have caught F-05, F-08 and F-09 before review.

### F-12 · MEDIUM · FR22 cannot be falsified by inspecting the artifact

*"Statements … are derived from the repository at the stated version, never asserted from
memory."* Derivation is a property of the authoring process; a reader cannot observe it. What
a reader *can* observe is whether the statement is true and whether a command accompanies it
— which is NFR5. As written FR22 is a process rule (a restatement of
`documentation-claims-must-be-derived`) wearing an FR's clothes, and no story can close it.
Fix: restate as the observable — *"every statement about distribution carries the command
that produces it, and the command reproduces the stated value."*

### F-13 · MEDIUM · FR5 is unsatisfiable for names already published

*"No name is published into a channel before FR1–FR4 hold for that channel."* Seven names are
already published (`marketplace.json`, §7.1) and Wade is already listed on skills.sh — the
Trigger is the evidence. FR1–FR4 do not hold. NFR3 records that retraction is manual and
discretionary, so the existing seven cannot be un-published to restore compliance. FR5 is
therefore violated at t=0 with no remedy. Fix: *"no **further** name"*, plus an explicit
ruling on the seven already out.

### F-14 · MEDIUM · FR11 and the whole of F3 are satisfiable with zero functionality

*"…either resolves its references correctly **or fails per FR6–FR9**."* The disjunction means
F3 can be closed entirely by making every plugin-cache install fail with a good error
message. That may be the right answer, but the PRD should say whether it is acceptable,
because an epic author will take the cheaper branch. Same shape, lower stakes, in FR9:
*"Degradation is permitted; silence is not"* — degradation is undefined, so any output
qualifies.

### F-15 · MEDIUM · FR20 and FR23 do not say shape or content, and FR23 has no pinned basis

FR20: *"declares which upstream BMAD versions it is compatible with, and that declaration is
checkable."* Checkable that the field is *present*, or that the range is *true*?
`documentation-claims-must-be-derived` is blunt about the difference — *"'Shape passed' is not
'content verified'"* — and with no basis this ships as a presence check that stays green
against a wrong range. FR23 (*"No shipped Convoke surface depends on an upstream component
that upstream has removed or renamed"*) needs the same thing from the other side: removed as
of **which** upstream ref? The non-goals forbid targeting the untagged tree, so the basis must
be a tagged release — unstated, and the answer changes weekly. Fix: name the ref and store it
where the check reads it.

### F-16 · MEDIUM · FR6 and SM5 have no population and no measurement procedure

FR6 requires detection *"during activation, before producing output."* Activation is
LLM-mediated, so the falsifying observation ("it produced output first") is probabilistic and
the PRD names no trial count. SM5 — *"Single-skill installs that fail silently | unknown,
assumed all | zero"* — needs a population: how many single-skill installs are in scope, 9, 11
or 55? And who adjudicates "silently"? The hedge *"unknown, assumed all"* is good practice and
honest (credit), but a target of zero over an unknown denominator is not a metric. Note also
that defect 1 is marked **Confirmed** for one skill and SM5 generalises to all by assumption —
the assumption is labelled, so this is a scoping gap, not a rule violation.

### F-17 · MEDIUM · FR8's parenthetical is an unhedged external claim with no source, and it decides the mechanism

*"(The storefront renders frontmatter `description`; a README is invisible to it.)"* The
addendum quotes the CLI README for discovery, exclusion, dependencies and retraction — and
says nothing about storefront rendering. `external-claims-must-be-executed-or-hedged` allows
three forms; this is none of them. It is also the clearest mechanism smuggle in the document:
it tells the architect where to put the text. Fix: execute it (publish a test listing, or read
the renderer), quote a source, or mark it unverified and name what would settle it — the
addendum does exactly that for OQ-2 and is the model.

### F-18 · LOW-MEDIUM · FR24 is unobservable without an enumeration

*"When a channel carries a defect Convoke cannot fix, the limit is disclosed rather than
omitted."* An omission of an unknown cannot be detected — there is no observation that proves
FR24 unmet. It becomes falsifiable the moment it points at a list, and the list already exists:
addendum §1 and §3 name no self-serve retraction, no dependency mechanism, first-match-wins
shadowing (`vercel-labs#353`), and `#1578`. Fix: FR24 references that enumeration, and the
enumeration lives in the repo.

### F-19 · LOW-MEDIUM · Three undefined vocabularies for the same distinction

FR3 says *"not a product skill"*; SM6 says *"non-product"*; FR17 says *"metadata or scaffolding
rather than a capability"*. None is defined, and FR17 adds a fourth implied category (*"one an
operator should invoke"*). Without one definition there is no denominator for SM6 and no
predicate for FR3's check. FR17 is the weakest requirement in the document on its own terms:
*"is distinguishable from"* names neither an observer nor a signal, so no observation falsifies
it. It is prose, not a requirement.

### F-20 · LOW · Overlaps that will produce duplicate stories

| Pair | Relationship |
|---|---|
| FR9 vs FR6 + FR7 | FR9 ("never silently produces output") is the conjunction of FR6 (detect before output) and FR7 (name the missing component). No observation falsifies FR9 that does not already falsify FR6 or FR7. |
| FR10 vs FR12 | FR10 states the property, FR12 gates it. One requirement with a gate, not two requirements. |
| FR21 vs FR8 | Both are "the operator can see, before installing, what they will get". FR8 scopes it to the dependency; FR21 to the parts delivered. Same surface, same story. |
| NFR6 vs FR16 | NFR6 ("nothing Convoke publishes **can** shadow an upstream skill") is FR16's name-disjointness restated as a modal. And "can shadow" is not in Convoke's gift — the addendum records first-match-wins dedup is the CLI's, decided by scan order. Per `verification-claims-must-name-their-evidence`, a "cannot" claim needs a pointer; none exists. Keep FR16, delete or restate NFR6. |
| NFR5 vs FR2 (second clause) vs FR22 | The same derivation rule stated three times, in three registers. |
| FR2 vs FR4 | FR2's command is the input to FR4's gate; sequencing, not two capabilities. |

### F-21 · LOW · NFR2's instrument is ambiguous, and FR4 + FR12 already exceed it

NFR2 says *"hard budget"* and, in the same breath, *"the count of new self-facing gates is a
counter-metric."* A hard budget refuses; a counter-metric watches. FR4 and FR12 each require a
CI check — that is two — and FR2 (a runnable command) and FR20 (a checkable declaration) imply
more. Fix: say which instrument governs and give the number.

### F-22 · LOW · The `[NOTE FOR PM]` naming claim overstates, in a note that asks for a ruling

*"…while every existing PRD here is a flat `convoke-prd-<qualifier>.md`."* Derived (§7.8): of
nine PRD files in `planning-artifacts/`, `gyre-prd.md` and `enhance-prd-module-p4.md` do not
carry the `convoke-prd-` prefix, and `convoke-prd-bmad-v6.3-adoption` is a **directory**, not a
flat file — so the run-folder shape this PRD uses has a precedent the note says does not exist.
The `project_name: BMAD-Enhanced` half of the note verifies exactly (`_bmad/bmm/config.yaml:14`).
Since the note asks for a ruling, the ruling should rest on the derived picture.

---

## 2. FR-by-FR: falsifier, mechanism, measurability

*Falsifier* = the concrete observation that would prove the FR unmet. **—** means none exists.

| FR | Falsifying observation | Mechanism smuggled? | Measurable as written? |
|---|---|---|---|
| FR1 | No file declares the set, or two files do | No | **Partly** — "each public channel" is never enumerated; and see F-01 on *declared* |
| FR2 | A figure is quoted with no command, or the command yields a different number | No | Yes. Violated by this PRD (F-11) |
| FR3 | `npx skills add --full-depth` offers a fixture | No | **No** — "product skill" undefined (F-19); "documented paths" unbounded (F-10) |
| FR4 | Plant an undeclared reachable skill; CI stays green | No | Yes — but see F-02: the check can be built unfalsifiable |
| FR5 | A name appears in a channel while FR1–FR4 do not hold | No | **No** — already violated at t=0 with no remedy (F-13) |
| FR6 | Install one skill alone, activate, see output before any detection | No | **Partly** — no trial count, no population (F-16) |
| FR7 | The emitted text names no component, or gives no command | No | Yes |
| FR8 | The storefront text does not mention the dependency | **Yes** — "the storefront renders frontmatter `description`" decides where the text goes, and is itself unsourced (F-17) | Yes, once the rendering claim is settled |
| FR9 | Output produced with runtime absent and no notice | No | Yes, but duplicates FR6+FR7 (F-20); "degradation" undefined (F-14) |
| FR10 | Grep finds a cross-directory reference with no stated base | **Mild** — "states its resolution base" picks annotation over vendoring or env-var resolution | Yes |
| FR11 | Plugin-cache install resolves nothing and does not fail | No | Yes — **strongest FR in the document**; but satisfiable with zero functionality (F-14) |
| FR12 | Plant a bare cross-directory path; CI stays green | No | **Partly** — "shipped skill" denominator unstated (does it include `_bmad/core` copies, fixtures?). T214 citation verifies (§7.9) |
| FR13 | Count `SKILL.md` per agent: fewer than 11 | **Yes** — *"exist in the repository as skills"* forecloses S3's generated tree (F-03) | Yes; parenthetical false (F-08) |
| FR14 | Name a workflow, it does not run without an agent | **Yes** — with SM3's column header, this forecloses S1 and S4 (F-03) | **No** — denominator wrong, `_deprecated` scope undefined (F-05) |
| FR15 | A contract has no name or no address | **Yes** — same as FR14 | **No** — "addressable" undefined for a schema document; 5 of 14 do not exist yet (F-09) |
| FR16 | Two skills claim one name | **Mild** — "a single registry" is a mechanism (budgeted by NFR2, so ratified) | Yes, and **falsified now**, 13 times (F-06) |
| FR17 | — | No | **No** — no observer, no signal. Prose (F-19) |
| FR18 | A BMAD operator's usual `add` path does not yield Convoke | **Yes** — "the same means they add BMAD skills" answers OQ-3, which is declared open | Partly — "the same means" unnamed |
| FR19 | Install from one channel; config absent, or a second channel needed | No | **Partly** — "complete module, configuration included" vs NFR4's "never writes governance rows": which files are in scope? |
| FR20 | An artifact declares no range, or declares a false one | No | **No** — shape vs content unstated (F-15) |
| FR21 | Storefront does not state what is and is not delivered | No | Partly — "channel path" set unenumerated. Overlaps FR8 (F-20) |
| FR22 | — | No | **No** — unobservable from the artifact (F-12) |
| FR23 | A shipped surface references a removed/renamed upstream component | No | **Partly** — no pinned upstream ref (F-15) |
| FR24 | — | No | **No** — an undisclosed unknown is undetectable (F-18) |

**Score.** 19 of 24 name a real falsifier. Four (FR17, FR22, FR24, and FR5 for the already-published
names) do not. FR13, FR14, FR15, FR18 and FR8 decide the how.

---

## 3. NFR1–NFR6

| NFR | Falsifying observation | Notes |
|---|---|---|
| NFR1 | A restructure targets an untagged upstream branch; or measured lag falls outside 4–6 weeks | Second clause falsifiable; first needs a command for "lag". **States an unratified proposal in the indicative** (F-07) |
| NFR2 | Count the ADRs, registries and gates added; more than one each | Falsifiable, and **already exceeded by FR4 + FR12** (F-21). "Hard budget" vs "counter-metric" ambiguity |
| NFR3 | A name is published into a non-retractable channel while F1 is open | Falsifiable. Opposed by SM2/SM3/SM4 with no exchange rate (F-04) |
| NFR4 | Install, then inspect the governance registry for rows | Falsifiable and well-pinned to the BUG-19 ruling. **Best-specified NFR in the document** |
| NFR5 | A figure in a shipped document with no command | Falsifiable; scope of "shipped document" unstated; duplicates FR2/FR22 (F-11, F-20) |
| NFR6 | Convoke publishes a name upstream already uses | **"can shadow" is not Convoke's to guarantee** — scan order is the CLI's. Restate as FR16 (F-20) |

---

## 4. SM1–SM6: basis and stability

The question the caller asked — *would the metric read differently at a different commit?* —
answered per metric.

| SM | Today figure | Basis stated? | Reads differently at another commit / basis? |
|---|---|---|---|
| SM1 | "9 reachable, 0 declared" | **No** | **Yes, badly.** 9 requires the basis *git-tracked at `HEAD`*. Working tree: `.claude/skills` holds 101 `SKILL.md`, 2 tracked. Repo-wide walk: 258. And "0 declared" contradicts the Trigger (F-01) |
| SM2 | "7 of 11" | Partly — "(+1 internal)" excludes the team-factory agent, which is stated | **Stable.** Both halves re-derive (§7.1, §7.3). The one metric that holds up. "Addressable" should still name the channel |
| SM3 | "0 of 30" | **No** | **Yes.** 30 matches nothing: 29 / 31 / 39 (F-05). "0" contradicts the seven existing personaless workflow skills in the same table |
| SM4 | "0 of 14" | Partly | 14 re-derives as a count of names (credit), but mixes 9 existing files with 5 that must be authored (F-09) |
| SM5 | "unknown, assumed all" | **Hedged, correctly** | Stable because it claims nothing. Target "zero" has no population and no adjudication procedure (F-16) |
| SM6 | "38" | **No** | **Yes.** 37 fixtures at `HEAD`; 38 only by counting a non-fixture, which contradicts the wording (F-09). "Any documented flag" is an external, versioned surface (F-10) |

**Counter-metrics.** Naming them is good practice and rare — credit. But none carries a
threshold, and a counter-metric with no threshold is an intention, not a guardrail. Two of the
four (*install counts*, *number of listings*) are explicitly disclaimed in the non-goals as
things Convoke does not chase, which makes them weak detectors: they can rise or fall for
reasons unrelated to SM5. The one with teeth — *count of names published* — points in the exact
opposite direction to SM2, SM3 and SM4 (F-04).

---

## 5. Overlap and contradiction

**Says the same thing twice** (details in F-20): FR9 ⊂ FR6+FR7 · FR10/FR12 one property plus
its gate · FR21 ⊂ FR8 · NFR6 ⊂ FR16 · NFR5 = FR2's second clause = FR22 · FR2 feeds FR4.

**Cannot both hold as written:**

1. **Trigger ("the manifest declared him", "the manifest *is* Convoke's discovery surface") vs
   SM1 ("0 declared").** F-01.
2. **FR13 + SM2's 11/11 vs the non-goal "A multi-team release" and NFR2's hard budget.** FR13
   says "across both teams" in as many words. F-04.
3. **SM2/SM3/SM4 vs the counter-metric "count of names published (rises irreversibly)" and
   NFR3.** The metrics' only improvement direction is the counter-metric's only worsening
   direction. F-04.
4. **FR5 vs the observed state.** Seven names published, FR1–FR4 not holding, no retraction
   available. F-13.
5. **FR16 vs FR23/NFR6's premise.** FR16 forbids two skills claiming one name including
   upstream's; Convoke deliberately vendors 13 groups of upstream skills under their own
   names. F-06.
6. **FR13's parenthetical vs the measured-position paragraph.** "Exist nowhere in the tree"
   vs "hold no `SKILL.md`". F-08.
7. **OQ-1/OQ-3 declared open vs FR13/FR14/FR15/FR18 deciding them.** F-03.
8. **FR4 + FR12 (two CI gates) vs NFR2 ("one doctor check", "hard budget").** F-21.

---

## 6. The declared gaps: usable downstream, or wrong architecture?

### 6.1 Missing user journeys · FR18–FR21 stand on inference

**Usable by an epic author: yes.** FR18–FR21 are testable as written (attempt the install, read
the storefront), so stories can be authored and closed.

**Safe for an architect: no.** FR18, FR19 and FR21 are precisely the requirements that decide
the channel and unit question — OQ-1 and OQ-3 — and the PRD itself labels them *"the least
validated requirements in the document."* The architecture's biggest decision will be made from
the four requirements with the weakest evidential basis. That is not a documentation gap; it is
a load-bearing one.

Two concrete aggravations, both cheap to fix:
- The inference label lives in "Gaps this draft does not fill", roughly 120 lines below FR18.
  **A downstream reader reads the FR list, not the gaps section.** Move an `[ASSUMPTION —
  inferred, not captured]` marker inline onto FR18–FR21.
- FR18's *"the same means they add BMAD skills"* is the mechanism-bearing clause, and BMAD's
  means is documented in addendum §2 (skills.sh with `bmod.toml` sidecars). So FR18 answers
  OQ-3 by reference while OQ-3 is open. Either resolve OQ-3 or write FR18 without naming
  BMAD's channel.

### 6.2 SM3 and SM4 have no target

**Usable by an architect: yes** — they are inputs to OQ-1, and the PRD says so.

**Usable by an epic author: no.** F4 is where G3 lives — *"the parts of Convoke that carry its
value"* — and it cannot be sized, sequenced or closed. The predictable outcome is epics for
F1/F2/F3/F5/F6 and a placeholder for F4, i.e. **the PRD's headline differentiator ships last or
not at all.** Compounding it, the denominator is wrong (F-05), so even an interim sizing is
wrong. Minimum fix: derive the counts, state the `_deprecated` and other-team scope, and give
SM3/SM4 a provisional target with the ruling that sets it named as a dependency.

### 6.3 `[ASSUMPTION] Stakes: internal-to-launch`

**Harmless.** It affects the depth of the document, not its content, and NFR2 bounds scope
independently. The tag does the job a tag should do. No action.

### 6.4 `[ASSUMPTION] Entry point: Vision + Features`

**Harmless.** It explains the document's shape (why there are Goals and FRs and no journeys).
Downstream readers are unaffected. No action.

### 6.5 The fourth assumption — untagged, and the one that matters

`.memlog.md` records it: *"the PRD states what must be TRUE of the distribution unit …; the unit
DECISION itself is a mechanism and belongs to the architecture document … If Amalik wants the
decision ruled inside the PRD, this assumption is the thing to overturn."*

**The PRD carries three `[ASSUMPTION]` tags and this is not one of them.** OQ-1 presents the
deferral as settled — *"the decision is a mechanism and belongs to the architecture document"* —
in the indicative, with no tag. Combined with F-03 (FR13/FR14/FR15 have already eliminated S1,
S3 and S4), the effect is the review's central risk: **the architecture inherits a decision that
looks open, is not, and is nowhere marked as an assumption.** This is the one gap that will
produce the wrong architecture rather than merely an incomplete one.

### 6.6 `[NOTE FOR PM]`

Both divergences are real. `_bmad/bmm/config.yaml:14` carries `project_name: BMAD-Enhanced`
exactly as claimed. The naming half overstates — see F-22 — and since the note asks for a
ruling, the ruling should rest on the derived picture rather than the claimed one.

---

## 7. Derivation appendix

Every command was run at `HEAD = f09e2f8c` from the repo root. Re-run any row to check this
review; per `verification-must-be-falsifiable`, a figure with no command is not evidence.

### 7.1 Manifest-declared skills — 7

```bash
python3 -c "import json;print(len(json.load(open('.claude-plugin/marketplace.json'))['plugins'][0]['skills']))"
# 7   — all seven under _bmad/bme/_vortex/agents/, none from Gyre
```
`.claude-plugin/` contains only `marketplace.json`; there is no `plugin.json`, so
`marketplace.json` is the whole manifest surface.

### 7.2 Workflows — 22 live Vortex, 24 with deprecated, 7 Gyre, 39 across all teams

```bash
find _bmad/bme/_vortex/workflows -name workflow.md -not -path '*_deprecated*' | wc -l   # 22
find _bmad/bme/_vortex/workflows -name workflow.md | wc -l                              # 24
find _bmad/bme/_vortex/workflows/_deprecated -name workflow.md                           # wireframe/, empathy-map/
find _bmad/bme/_gyre/workflows -name workflow.md | wc -l                                 # 7
find _bmad/bme -name workflow.md | wc -l                                                 # 39
for d in _bmad/bme/_*/workflows; do printf "%s " "$d"; find "$d" -name workflow.md | wc -l; done
# _artifacts 2 · _enhance 1 · _gyre 7 · _portability 4 · _team-factory 1 · _vortex 24
```
Note `empathy-map` exists both live and deprecated — a further reason the scope must be stated.

### 7.3 Agents (11) and contracts (5 HC files + 4 GC files of 14 names)

```bash
ls _bmad/bme/_vortex/agents/ | wc -l          # 7 directories, each with a SKILL.md
ls _bmad/bme/_gyre/agents/                     # model-curator.md readiness-analyst.md review-coach.md stack-detective.md
find _bmad/bme/_gyre -name SKILL.md | wc -l    # 0   ← the true state; FR13's "exist nowhere" is false
ls _bmad/bme/_vortex/contracts/                # hc1..hc5 only
ls _bmad/bme/_gyre/contracts/                  # gc1-stack-profile gc2-capabilities-manifest gc3-findings-report gc4-feedback-loop
```

### 7.4 The seven "personaless skills" are all workflows

```bash
git ls-files | grep '/SKILL\.md$' | grep _bmad/bme | grep -v _vortex/agents
# _bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/SKILL.md
# _bmad/bme/_artifacts/workflows/bmad-portfolio-status/SKILL.md
# _bmad/bme/_enhance/workflows/initiatives-backlog/SKILL.md
# _bmad/bme/_portability/workflows/bmad-export-skill/SKILL.md
# _bmad/bme/_portability/workflows/bmad-generate-catalog/SKILL.md
# _bmad/bme/_portability/workflows/bmad-seed-catalog/SKILL.md
# _bmad/bme/_portability/workflows/bmad-validate-exports/SKILL.md
```
Seven, all at `<team>/workflows/<name>/SKILL.md`. FR14's pattern already ships.

### 7.5 Duplicate skill names — 13 groups

```bash
for f in $(git ls-files | grep '/SKILL\.md$'); do
  awk 'NR<=6 && /^name:/{sub(/^name:[ ]*/,"");gsub(/['"'"'"]/,"");print;exit}' "$f"; done \
  | sort | uniq -c | sort -rn | awk '$1>1'
#  3 bmad-shard-doc · 3 bmad-review-edge-case-hunter · 3 bmad-review-adversarial-general
#  3 bmad-party-mode · 3 bmad-index-docs · 3 bmad-help · 3 bmad-brainstorming
#  2 bmad-editorial-review-structure · 2 bmad-editorial-review-prose · 2 bmad-distillator
#  2 bmad-create-prd · 2 bmad-cis-agent-brainstorming-coach · 2 bmad-advanced-elicitation
```
All are upstream copies under `_bmad/core/{skills,tasks,workflows}/`; e.g.
`_bmad/core/skills/bmad-help/SKILL.md` carries `name: bmad-help` verbatim.

### 7.6 No ratified cadence policy

```bash
grep -rni "cadence" project-context.md                 # 0 policy hits
grep -rni "N-1" project-context.md docs/adr/           # 0 relevant hits
```
The only record is a memory note headed *"Cadence policy proposal (not yet adopted)"*.

### 7.7 `SKILL.md` populations

```bash
git ls-files | grep -c '/SKILL\.md$'                       # 75 tracked
git ls-files | grep '/SKILL\.md$' | awk -F/ '{print $1"/"$2}' | sort | uniq -c | sort -rn
#  37 tests/fixtures · 21 _bmad/core · 14 _bmad/bme · 2 .claude/skills · 1 _bmad-output/exp3-smoke-test
find . -name SKILL.md -not -path './node_modules/*' | wc -l   # 258 on disk
find .claude/skills -name SKILL.md | wc -l                    # 101 on disk, 2 tracked
```
So SM6's 38 = 37 fixtures + 1 non-fixture, and SM1's 9 holds only on the tracked-at-`HEAD` basis.

### 7.8 PRD naming precedent

```bash
ls _bmad-output/planning-artifacts/ | grep -i prd | grep -v report
# convoke-prd-artifact-governance-portfolio.md · convoke-prd-bmad-v6.3-adoption (DIRECTORY)
# convoke-prd-bmad-v6.4-v6.8-absorption.md · convoke-prd-bmad-v63-source-format-adoption.md
# convoke-prd-initiative-lifecycle-engine.md · enhance-prd-module-p4.md · gyre-prd.md
grep -n project_name _bmad/bmm/config.yaml                 # 14: project_name: BMAD-Enhanced
```

### 7.9 FR12's T214 citation is real

`T214` is a live backlog row about bare config references and their normalisation
(`convoke-note-backlog-completed-archive.md:2595`, with the 2026-09-26 reachability
measurement recorded on `T138` in `convoke-note-initiative-lifecycle-backlog.md:336`). FR12's
*"extended past config references to capability references"* is an accurate description of that
class. Credit: this is the citation most likely to have been wrong, and it holds.

---

## 8. What holds up

Recorded so the fixes do not damage the parts that work.

- **FR11** is the best requirement in the document: it names an environment, a failure mode and
  a disjunctive acceptance, and it can be falsified in one install.
- **NFR4** is the best-pinned NFR: one observation (inspect the registry after install), tied to
  a ruling with a bug number.
- **SM2** is the only metric whose "today" and "target" both re-derive at `HEAD`, and it states
  its own exclusion ("+1 internal").
- **SM5's hedge** — *"unknown, assumed all"* — is exactly what
  `external-claims-must-be-executed-or-hedged` asks for, written as the deliverable rather than
  as a weaker version of one.
- **The 14 contract names** re-derive exactly, and the FR15 parenthetical about HC6–HC10 being
  mentions only is correct.
- **FR12's T214 citation** is accurate (§7.9), which `spec-verify-referenced-files` would have
  been within its rights to doubt.
- **The addendum's discipline** — quoting the CLI README verbatim, marking OQ-2 unverified and
  naming what would settle it, labelling "personaless process skills as connective tissue" as
  this session's own coinage rather than a published pattern — is the standard the PRD's own
  figures should meet.
- **The counter-metrics section and the gaps section exist at all.** The defect this review
  keeps finding is not missing candour; it is that the honest labels sit far away from the
  requirements they qualify, where a downstream reader will not meet them.
