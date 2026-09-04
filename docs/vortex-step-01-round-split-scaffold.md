# Vortex step-01 round-split scaffold

**Audience:** Convoke contributors editing `_bmad/bme/_vortex/workflows/*/steps/step-01-*.md`.
**Status:** normative for those files. Divergence between implementations is a defect, not a style choice.
**Origin:** P21 Operator Covenant, Epic 2 Story 2.1 (`oc-2-1-retrofit-bottleneck-skills`).

This file is **not shipped**. It is deliberately outside `files[]` — nothing loads it at runtime
and no operator reads it, so it names no `{project-root}` path and adds no indirection to the
operator path. Its only job is to keep the nine mechanism (i) retrofits identical.

---

## Why this exists

`step-01` is where a Vortex workflow meets a first-time operator. Every one of them opened by
reciting a handoff-contract schema — seven frontmatter fields and five to eight body sections —
before asking a single question about the operator's actual problem.

Under **OC-R7 (Right to pacing)** the budget is **≤ 3 novel concepts per interaction round**, and
an interaction round is *one operator-input boundary* — a step file presenting N questions before
pausing is one round, not N. Under **§A41-2**, a contract-schema enumeration counts as **1 compound
concept if ≤ 3 sub-fields are visible** and **N concepts if ≥ 4 are visible**. So a step file that
printed HC4's 7 frontmatter fields and 8 body sections spent **15 concepts** in its first round.

That is the T1 fire: 11 cells, `Right to pacing`, 100% of the HC-cluster.

**The fix is structural, and it has two halves. Both are required.**

1. **Split one round into two.** Ask for the artifact, *stop*, then validate. The budget is per
   round, so two rounds carry two budgets.
2. **Reference the schema instead of enumerating it.** This is what actually collapses the count:
   §A41-2 counts *visible* sub-fields, so a pointer to the contract file has none to count. The
   whole schema becomes one compound concept — the contract itself.

Half (2) alone still fails, because §1 and §2 together already spend the budget. Half (1) alone
still fails, because 15 concepts in round two is no better than 15 in round one.

> **The reference only works because the file it points at installs.** `contracts/` reaches an
> operator project via `refreshInstallation` phase 2b (T88). If that ever regresses, this whole
> design degrades into pointing at nothing — re-check with `scripts/audit/try-fresh-install.sh`
> before assuming it holds.

---

## The invariant shape

Everything in `<angle brackets>` is per-workflow. Everything else is fixed.

```markdown
## Your Task

### 1. What <Artifact> Do You Have?

<prose: name the contract, where it comes from, and that non-Vortex input is accepted.
 Do NOT enumerate schema fields here.>

### 2. Provide Your Input

<prose: ask for the path or a description, with 1-3 concrete examples.>

**If your input is non-conforming:** <PRESERVED VERBATIM FROM THE EXISTING FILE>

Concept count: N/3 (<named concepts>)

**Your turn — I'll wait here.** <one sentence restating what to hand over,
naming a consequence or downstream effect — R3 needs rationale at every decision point.>

Wait for user input.

### 3. <Validation heading — VARIES, see the parametrization table>

*Once you've given me that, I'll check it against the <HCn> schema and tell you what's
present and what's missing.*

> The full <HCn> schema lives at
> `{project-root}/_bmad/bme/_vortex/contracts/<hcN-name>.md`.
> You don't need to read it — I will.

Concept count: N/3 (<named concepts>)

---

## Your Turn

<REWRITTEN — this closes the FINAL round. It must report what the validation found and
hand control back; it must NOT re-ask for the input round 1 already collected. The heading
survives (R5 evidence); the prose under it does not.>

Wait for user input.

## Next Step

<UNTOUCHED — the pointer to step-02>
```

### The two boundaries

| Round | Ends at | Budget spent on |
|---|---|---|
| 1 | `Wait for user input.` in §2 | the contract's *name* and provenance |
| 2 | `Wait for user input.` under `## Your Turn` | validation and the readiness verdict |

Two boundaries in one file = two rounds. This is an **in-file** split and it has to be —
see [the structural constraint](#structural-constraint-do-not-split-the-file).

### Why both a prose halt and a literal marker

`**Your turn — I'll wait here.**` is what the operator reads. `Wait for user input.` is the
**literal marker OC-R5 accepts**, and it is agent-facing, so it costs nothing against the R7
concept budget.

Vortex carried **zero** literal halt markers before this retrofit, so R5 passed only under the
lenient reading (A26's committed reading; §A41-4 makes the strict reading v4+ and forward-only).
Carrying both means these cells pass R5 under **either** reading. R5 fails a cell on *any*
unmarked boundary — so if you add a round, add its marker in the same edit, and note that the
pre-existing `## Your Turn` boundary needs one too.

**This does not re-score A26.** Making a file strict-compliant and re-scoring an audit under the
strict reading are different jobs; the second is a scope decision, not an implementation detail.

---

## Must survive verbatim

Four things carry audit evidence for rights other than R7. **They do not all survive the same way, and the heading above is loose** — the fallback survives by *wording* (it moved), the `## Your Turn` boundary survives by *heading* (its prose is rewritten), and only the marker and the `## Next Step` block survive verbatim. Round 1 moved the fallback and rewrote that prose while this table went on describing the old shape for a full review round; Round 2's correction to that then misdescribed it again. Treat the *Where* column as authoritative, not this heading. Changing them trades an R7 fix for an
R1 or R5 regression, and **AC5 makes that a blocking, per-cell defect**: R1–R6 currently PASS at
100% across all nine HC-cluster workflows, so every one of them is a regression surface.

| What | Right | Where |
|---|---|---|
| The `**If your input is non-conforming:**` sentence *(wording only)* | **R1** — right to a fallback | **in §2, ahead of the round-1 halt** — it is useless behind the boundary, where the operator has already had to decide what to hand over |
| The `## Your Turn` **heading** — its prose is rewritten, not preserved | **R5** — right to an explicit wait | after the last numbered section |
| A literal `Wait for user input.` line at **every** boundary | **R5** under the strict reading | after each halt |
| The `## Next Step` block and its `step-02` path | — | end of file |

Also **do not**: rename the file (P20 asserts `step-01-setup.md` by name and `workflow.md` loads it
by path), add a step file (P17 caps `steps/` at 4–6 `.md` files — and it counts *every* `.md`
there), or edit `## Steps Overview` in `workflow.md` (in-file splitting means it stays true).

---

## Structural constraint: do not split the file

`scripts/update/lib/validator.js` enforces:

- **P17 (`:473-479`)** — each `steps/` directory holds 4–6 `.md` files. Note `:473` filters on
  `.endsWith('.md')`, so **every** `.md` in `steps/` counts, not just `step-*.md`.
- **P20 (`:481-491`)** — Wave 3 workflows must contain `step-01-setup.md` under that exact name,
  plus `step-02-context.md` and a `*-synthesize.md` final step.

`lean-experiment`, `proof-of-value` and `lean-persona` are already at **6 files — the cap**. The
April proposals ("split step-01 into step-01a and step-01b") were written against a structure that
cannot accept them. They describe the *intent* (two rounds), not the *mechanism*. Follow the intent.

---

## Counting the footer

Use the Loom `add-team` convention exactly — it names the concepts in parentheses and handles
branch-dependent counts:

- `_bmad/bme/_team-factory/workflows/add-team/step-01-scope.md:104` →
  `Concept count: 3/3 (team identity, pattern, agents)`
- `…/step-02-connect.md:109` →
  `Concept count: 2/3 (contracts, integration settings) — or 1/3 for Independent (integration only)`

**Round 1 starts at the top of the file, not at §1.** The preamble — the `# Step 1: …` title, its
opening sentence and `## Why This Matters` — is inside round 1, and the audits count it. Most of
that prose restates vocabulary `workflow.md` already introduced, so it usually costs nothing, but
check rather than assume: `lean-experiment`'s `workflow.md` is a single line, so its preamble's
"falsifiable bet" is novel and has to be paid for.

**What you do not count:**

- **Anything `workflow.md` already introduced.** Operator-visible concepts in `workflow.md` are
  pre-existing for every step file in that workflow. In practice this covers the contract's own
  name — `assumption-mapping/workflow.md` already says "HC3 artifact" and "hypothesis contract",
  so §1 does not pay for them again.
- **General computing literacy** — file, path, list, input, review, confirm, skip, and the rest of
  the §2.6 pre-existing set.
- **Cross-workflow references stated as graph position** — "from Liam's `hypothesis-engineering`
  workflow" is 1 compound concept, not one per workflow named. It becomes N only if each is
  described in detail (§A41-2 scope, carve-out (d) per A46).

**What you do count:** domain-specific terms, distinct decision mechanisms, named actions with new
consequences, and mental-model framings — including ones introduced inside an illustration.

Score under **v5.1**: §A41-2 as scoped by A46, §A41-14 Layer 1 categorisation, and A26's lenient
§A41-5 reading. Do not silently adopt the strict §A41-4 reading — that is a scope change, not an
implementation detail, and it produces a second bottleneck at 8/8.

---

## Parametrization table

| Workflow | Contract | §3 heading (keep as-is) | Note |
|---|---|---|---|
| assumption-mapping | HC3 | `Input Validation` | |
| hypothesis-engineering | HC2 | `Input Validation` | |
| behavior-analysis | HC4 | `Input Validation` | keeps its §4 observation table |
| experiment-design | HC3 | `Input Validation` | |
| pattern-mapping | HC1 | `Input Assessment` | dual-mode: HC1 schema *or* structural clarity |
| pivot-resynthesis | HC1 + HC4 | `Validate Your Research` / `Validate Your Experiment Evidence` | **dual schema — shipped as 3 rounds**, one per contract |
| production-monitoring | HC4 | `Per-Experiment Input Validation` / `Portfolio Readiness` | **portfolio iteration — shipped as 3 rounds**: per-experiment, then the roll-up |
| research-convergence | HC1 | `Input Validation` | |
| signal-interpretation | HC4 | `Input Validation` | |

The heading text is **not** uniform. A blind find/replace on `### 3. Input Validation` misses three
of the nine.

`lean-experiment` and `proof-of-value` are **not** in this table. They are mechanism (ii): their §3
is a checklist and a canvas rather than a contract-schema recital. `lean-experiment` still ends up
referencing HC3 — its readiness checklist *was* the HC3 four-field contract, so it counts under
§A41-2 like any other enumeration (2 rounds). `proof-of-value` genuinely has no contract to point
at and splits into 4 rounds, one per operator deliverable.

`lean-persona` is also retrofitted (2 rounds) and is not in the table either: it has no contract at
all, so only the round-split half of this scaffold applies to it. Its split follows oc-1-1 §9.1 —
"Define the job" (job + name), then "Characterize the job" (frequency + importance + evidence).

---

## Worked example — `assumption-mapping`

Before, §3 printed 7 HC3 frontmatter fields and 5 body sections. Under §A41-2 that is 7 + 5 = **12
concepts**, in the same round as §1 and §2, against a budget of 3.

After: §2 closes round 1 at **3/3** (hypothesis-engineering as source, non-Vortex input accepted,
multiple-artifact input — the HC3 contract itself being inherited from `workflow.md`), and §3 opens
round 2 at **2/3** (schema validation, readiness assessment) with the schema referenced rather than
enumerated.
