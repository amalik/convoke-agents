---
initiative: convoke
artifact_type: covenant
status: draft
created: '2026-04-18'
schema_version: 1
---

# The Convoke Operator Covenant

> **The operator is the resolver.**

This is the Convoke Operator Covenant: an axiom, foundational vocabulary, two founding incidents, seven commitments, and a compliance protocol that every Convoke skill must honor.

---

## 1. The Axiom

The axiom means: when a Convoke skill cannot resolve something on its own, it brings the operator into the loop — not as a fallback, not as an error path, but as a first-class collaborator whose decision is the mechanism by which the situation resolves. **Uncertainty is a collaboration signal, not an output failure.**

Most agent frameworks compete on capability density: more models, more tools, more autonomy. Convoke competes on a different axis. Convoke holds that an AI skill which cannot complete a task cleanly should not paper over the gap with invented output — it should hand the resolution to the operator, with enough context to make the handoff useful rather than burdensome.

## 2. Job-to-be-Done

> **Operators don't hire Convoke to produce output. They hire Convoke to feel in control of decisions they don't fully understand.**

A Convoke operator may not know what the correct answer is. They may not want to think about the correct answer. But they want to see what is being decided, be offered a **default** if one exists, know how to **override** it, and know why the decision matters. When the skill cannot infer a safe answer — what we call an **unresolvable state** — the operator is handed the resolution, with context, not an error message.

This is the job. Every right below is a mechanic of that job.

## 3. Foundational Vocabulary

The Covenant uses the following terms with specific meanings. Introducing them here so per-right sections can assume them:

| Term | Meaning in this Covenant |
|------|--------------------------|
| **default** | A proposed value the operator can accept without typing, when the skill cannot infer one on its own or wants to offer a safe starting point. |
| **fallback** | Synonymous with default for our purposes: the safe choice offered when primary resolution fails. |
| **override** | The operator's act of rejecting the default and providing their own value. An override is authoritative — the skill honors it without second-guessing. |
| **unresolvable state** | Any branch where the skill cannot cleanly determine the answer. The Covenant treats this as a collaboration point, not a failure. |
| **exclusion** | An item the skill has decided not to process, filter, or include. Exclusions are visible and justified, never silent. |
| **decision point** | A place in a workflow where the skill must wait for operator input before advancing. |
| **interaction round** | One operator-input boundary. A step presenting multiple questions before pausing for input is one round, not many. |
| **concept budget** | The cognitive load a single interaction round places on the operator. See the Right to pacing. |
| **scope** | The total set of items a skill is operating on, before any filter is applied. Operators see scope before they see filtered results. |

With these established, the rest of the Covenant follows.

---

## 4. Why This Exists

The Covenant is not abstract. Two production incidents gave it shape.

### Scar 1 — Migration: 31 items, no guidance

In early 2026, the artifact migration skill encountered a batch of 31 files it could not cleanly classify. Its response: emit 31 lines of `ACTION REQUIRED: Specify initiative for this file`, render them as a wall of text, and exit.

The operator saw a screen of demands with no indication of what "specify initiative" meant mechanically. Edit the filename? Add frontmatter? Run a different command? The skill did not say. The operator was informed that action was required but given no mechanism to take it.

> **What this taught us:** an error that names an action but not a mechanism is not a next action — it is a demand. The *Right to next action* was born here.

### Scar 2 — Portfolio: 108 of 151 files silently dropped

Around the same time, the portfolio skill scanned 151 files, found 108 it could not attribute to a governed initiative, and silently omitted them from the output. The operator saw 43 initiatives and believed that was the full picture. Three weeks later, a governance review surfaced the question: *where are all the planning artifacts?* They had been scanned and dropped without a word.

> **What this taught us:** operators cannot trust a filtered result if they cannot first see the scope that produced it. The *Right to the full universe* and the *Right to completeness* were born here.

### The generalization

Both incidents shared a pattern: the skill resolved from its own position — emitting output based on what it thought was sufficient — rather than treating the operator as the resolver. Fixing the individual skills was not enough; we needed a codified standard so future skills would be built with the operator's perspective as a first-class design constraint.

That standard is this Covenant.

---

## 5. How to Read This

Three audiences read the Covenant differently. We've tried to serve all three.

- **External evaluators.** You can read this cover-to-cover in fifteen minutes. The axiom establishes the *why*; the seven rights establish the *what*; the scars (§4) provide the empirical grounding. What differentiates Convoke from agent frameworks that compete on capability density is a design commitment: operator experience as a first-class architectural concern.
- **Contributors** authoring new Convoke skills: §6 (The Seven Operator Rights) is your design reference. Every new skill is audited against the Compliance Checklist, whose rules map 1-to-1 to these rights.
- **Reviewers** auditing existing skills: use the Compliance Checklist as your working tool; reach for the rights here when a rule's intent is unclear.

---

## 6. The Seven Operator Rights

Each right follows the same structure — **statement**, **why it exists**, **good example**, **anti-pattern**. The rights are not independent; they are seven facets of the one axiom — each addressing a different way a skill can forget the operator is there.

The full list, in canonical order:

1. Right to a default
2. Right to the full universe
3. Right to rationale
4. Right to completeness
5. Right to pause
6. Right to next action
7. Right to pacing

### 6.1 Right to a default

**The right.** At every unresolvable state, the operator receives a proposed default they can accept or override.

**Why it exists.** When a skill encounters ambiguity and emits "unknown" with nothing beside it, it stops being a collaborator. The operator has no starting point and no orientation. A default — even a low-confidence one marked as such — is orientation. It says: *this is what I think; tell me if I'm wrong.*

**Good example.** The Migration skill's ambiguous-entry resolution flow offers a suggested initiative with confidence level beside every option, and the operator can accept with one keystroke or override with a typed value.

**Anti-pattern.** The same skill, for entries where no suggestion can be inferred, emits a bare "initiative unknown" label and asks the operator to produce a value from nothing.

### 6.2 Right to the full universe

**The right.** Before presenting filtered results, the skill shows the full scope — total scanned, total matched, total excluded.

**Why it exists.** Portfolio's silent drop of 108 files was the canonical violation. Operators cannot trust a filtered view if they do not know what the filter excluded.

**Good example.** The portfolio skill now leads every output with a summary line showing total items scanned and how many were excluded from the filtered view, before it renders the main table. Scope appears before narrative.

**Anti-pattern.** A scan that shows only results passing the filter, treating the filter as invisible infrastructure. The operator cannot see what they are missing.

### 6.3 Right to rationale

**The right.** At every decision point, the skill states why the decision matters — what changes downstream, what trade-off is on offer.

**Why it exists.** A bare option list asks the operator to decide without context; they either guess or halt. Rationale is the bridge between an option and a judgment.

**Good example.** Loom's team-factory recommends a composition pattern based on the team description and renders a one-line analogy explaining each alternative, so the operator knows *why* they would prefer one.

**Anti-pattern.** A menu that lists options with no explanation of when to choose which.

### 6.4 Right to completeness

**The right.** Nothing is silently dropped. Every exclusion is named and justified — a count, a list, or at minimum a reason per exclusion class.

**Why it exists.** The scar was Portfolio's silence about 108 files. Items that disappear without a word degrade trust permanently, because the operator can no longer tell whether any given item was processed, dropped, or lost.

**Good example.** The Migration skill's dry-run categorizes every entry into named buckets with counts and reasons. Even dropped items are visible with their exclusion class named.

**Anti-pattern.** A scan that returns "N initiatives found" where N is the filtered count, with no mention of items that did not match. The dropped items have no audit trail.

### 6.5 Right to pause

**The right.** At every decision point, the skill halts and waits. No auto-advance, no silent default-selection, no prompt-without-wait.

**Why it exists.** A skill that auto-proceeds past a decision point has taken the decision from the operator. The operator is not a resolver if their only input opportunity has already been bypassed.

**Good example.** Every step in the Enhance initiatives-backlog workflow closes with an explicit `ALWAYS halt and wait for user input after presenting menu` discipline marker. The operator owns each transition.

**Anti-pattern.** A prompt that reads "Continue? [y/n]" followed immediately by the next step running — the wait was cosmetic.

### 6.6 Right to next action

**The right.** Every error tells the operator what to do next, not only what went wrong.

**Why it exists.** Migration's "ACTION REQUIRED" wall was the canonical violation. An error that names the need for action without naming the mechanism is not a next action.

**Good example.** The portfolio engine's missing-taxonomy error reads: *"taxonomy.yaml not found — run `convoke-migrate-artifacts` or `convoke-update` to create"*. The error names the remedy by command.

**Anti-pattern.** Errors that say "Failed. Resolve manually and re-run." with no indication of what "manually" entails.

### 6.7 Right to pacing

**The right.** Each interaction round introduces no more than three new concepts beyond the Covenant's concept budget.

**Why it exists.** Operators have limited working memory within a single round. A skill that dumps five or ten new terms in one prompt forces the operator to parse vocabulary before they can make the decision. The concept budget is how Convoke protects the operator's attention.

**Good example.** Loom's `add-team` step-01 closes with an explicit `Concept count: 3/3` footer. The skill was designed with the budget in mind.

**Anti-pattern.** A menu that presents a long enumeration of categories, decision verbs, and escape hatches in one round, asking the operator to navigate a surface of many options.

---

## 7. Derivation from the Axiom

Each right is a direct consequence of *the operator is the resolver*:

- **Default** — resolution requires a starting position; "unknown" gives none.
- **Full universe** — resolution requires seeing scope, not just filtered results.
- **Rationale** — resolution requires understanding what is being decided.
- **Completeness** — resolution requires knowing what was dropped.
- **Pause** — resolution requires the skill to wait.
- **Next action** — resolution after an error requires knowing how to proceed.
- **Pacing** — resolution within a budget requires the skill to fit that budget.

If a future right is proposed for the Covenant, it must be shown as a direct consequence of the axiom. If it cannot, it does not belong here.

---

## 8. How to Comply

Convoke skills are audited against the Compliance Checklist (`convoke-spec-covenant-compliance-checklist.md`). The Checklist is the operational instrument; this Covenant is the principle. Together they form the standard:

- **Contributors:** read this Covenant before authoring a new skill. Apply the Checklist's questions as you design each interaction.
- **Reviewers:** use the Checklist as your audit instrument. Reach for this Covenant when a rule's intent is unclear.
- **Auditors:** the Checklist's rubric maps 1-to-1 to the rights above; every FAIL cell cites a violation of one of the seven.

The Covenant is not aspirational. As of 2026-04-18, eight Convoke skills have been audited against the rights: 46 of 56 cells (82%) pass. The remaining retrofit work is tracked in the initiative backlog. External publication of this Covenant will cite both compliance and known gaps honestly — *you do not publish a covenant you cannot keep*.

---

## Revisions

| Date | Change | Source |
|------|--------|--------|
| 2026-04-18 | Initial authoring. Preamble introduces the 9 foundational terms required by the Compliance Checklist's preamble authoring contract. Seven rights follow the 4-part format (statement / why / good example / anti-pattern). Scar stories (Migration, Portfolio) cited by name with their specific violations. | oc-1-4 |
