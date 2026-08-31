---
initiative: convoke
artifact_type: adr
qualifier: knowledge-governance-status-axis
created: '2026-08-30'
status: active
decision_status: accepted
accepted: '2026-08-31'
schema_version: 1
related_initiative: 'P60 — Knowledge & Documentation Governance'
related_decision: 'ADR-001 (OQ-1)'
related_epic: none
supersedes: none
qualifier_role: winston-architect
signoff_by: amalik
---

# ADR-002: The Status Axis — Status Is Evidence, Not an Assertion

**Status:** **ACCEPTED** (2026-08-31) — signed off by Amalik
**Proposed:** 2026-08-30
**Initiative:** Knowledge & Documentation Governance (**P60**)
**Decision owner:** Amalik
**Resolves:** ADR-001 open question **OQ-1**

---

## Context

ADR-001 deferred OQ-1 as *"one `status` field or three fields,"* noting the corpus carries 15 distinct values across three axes while the shipped enum at `scripts/lib/artifact-utils.js:763` carries four — one of which (`validated`) is a verdict, and one of which (`complete`) is the corpus's most common value yet illegal.

Re-measuring on ADR-001's own scope (both trees, 1,502 markdown files) changes the picture in three ways.

### 1. The corpus is far more divergent than recorded

| | ADR-001 | Measured 2026-08-30 |
|---|---|---|
| Distinct `status` values | 15 | **41** (40 real + 1 template placeholder) |
| Files with frontmatter | — | 1,067 |
| Files carrying `status` | — | **174 (16% of frontmatter files)** |

**`status` is absent from 84% of the corpus.** No prior framing of OQ-1 used this number, and it is the one that decides the migration cost.

### 2. The shipped enum is enforced over nobody

`VALID_STATUSES` is referenced by exactly one function — `validateFrontmatterSchema` (`scripts/lib/artifact-utils.js:805`) — and **that function's only callers are its own tests.** There are zero production consumers.

This is the same shape as v4.1's OQ-1, where `loadModuleConfig`'s "frozen API" turned out to protect no callers. A closed enum that nothing enforces is a *specification* commitment, not a *compatibility* one, and may be changed at the cost of its tests.

### 3. There are two status systems, and they share no vocabulary

The instrument that actually runs — the portfolio engine — never imports `VALID_STATUSES`. It reads `frontmatter.status` as free text, marks it `confidence: 'explicit'` (`rules/frontmatter-rule.js:18-21`), and where the field is absent, **infers** `ongoing`/`stale` from git recency (`rules/git-recency-rule.js:61-63`).

| | Vocabulary | Enforced? | Runs? |
|---|---|---|---|
| `VALID_STATUSES` | `draft`, `validated`, `superseded`, `active` | by tests only | no |
| Portfolio engine | `ongoing`, `stale`, `blocked`, `complete`, `unknown` | n/a — open | yes |

The two sets **intersect in nothing**. `complete` — the corpus's most common illegal value, 30 files — is legal and load-bearing in the only code that runs.

### 4. The unreconciled vocabularies have already produced a defect

`git-recency-rule.js:22` returns early when `confidence === 'explicit'`, so a declared status suppresses inference. `portfolio-engine.js:462` then tests membership in `activeStatuses = ['ongoing', 'stale', 'blocked']`.

Executed against the shipped rule (2026-08-30):

```
declared=active    -> value=active    confidence=explicit  counted as ACTIVE? no
declared=draft     -> value=draft     confidence=explicit  counted as ACTIVE? no
declared=ongoing   -> value=ongoing   confidence=explicit  counted as ACTIVE? YES
```

**Declaring an initiative `active` removes it from the WIP radar.** Declaring nothing leaves it counted, because inference supplies `ongoing`. The radar therefore undercounts exactly the initiatives that are diligently labelled. *(The membership test and rule 1 are executed above; the inference path at `git-recency-rule.js:61-63` is read, not executed — it requires git history.)*

This is not a coincidental bug. It is what two independently-maintained vocabularies produce, and it is the strongest available evidence for the structural fix below.

---

## Decision

**OQ-1 resolves as: `status` is evidence for the portfolio engine, not an author assertion the validator enforces.** Operator ruling, Amalik, 2026-08-30.

Five consequences follow.

**D1 — `status` is optional.** Absent means *not stated*, not *invalid*. The engine infers. **No backfill of the 893 status-less files.**

**D2 — Two fields, not three.**

- **`status`** — lifecycle. Absorbs the completion cluster (`complete`/`done`/`final`/`shipped`, 52 files) and the gate cluster (`ready-for-sprint`/`implementation ready`/`testing ready`, 13 files), both of which are positions in a work pipeline rather than a separate axis.
- **`decision_status`** — verdict (49 files). Genuinely orthogonal: an ADR may be `superseded` + `accepted` — the document replaced, the ruling still true. One field cannot express that.

No third `gate` field. Rule of Three declines an abstraction built on 13 instances that collapse into an existing one.

**D3 — The enum is widened to match the running consumer, and split by who may write it.**

| Field | Author-declarable | Engine-inferred only |
|---|---|---|
| `status` | `draft`, `active`, `blocked`, `complete`, `superseded` | `ongoing`, `stale`, `unknown` |
| `decision_status` | `proposed`, `accepted`, `rejected`, `superseded`, `deferred` | — |

`validated` **leaves the lifecycle enum** — it is a verdict, and belongs to `decision_status`. This is a breaking change to a shipped enum, permissible only because §Context.2 establishes there are no production consumers; the cost is confined to `tests/lib/artifact-utils.test.js`.

**D4 — Validation is present-value-only.** `validateFrontmatterSchema` rejects an *illegal* value; it never requires the field. This is what makes D1 enforceable without a migration.

**D5 — One enum, one owner, one mapping.** The vocabulary is defined once, exported, and imported by both `validateFrontmatterSchema` and the portfolio engine. The author-declared → WIP-bucket translation lives in a **single map**, not in a second hand-maintained list.

This is the deciding structural point, and it is the same argument that settled v4.1's OQ-1: two lists maintained by convention drift, and §Context.4 is that drift already having happened. Extending `activeStatuses` to include `active` would fix today's symptom and leave the mechanism intact.

---

## Consequences

**Positive**

- **No backfill.** The largest cost on the table — ~893 files — is removed by the ruling rather than paid.
- **Corpus normalization gets cheaper, not just smaller.** Because `status` is optional, a file carrying a nonsense value (`framework specification`, `implementation guide`) can have the field **deleted** rather than adjudicated. Most of the 41-value tail is deletable, not translatable.
- **The WIP-radar defect is fixed by construction** under D5, not patched.
- The corpus's dominant real value, `complete` (30 files), becomes legal — the schema stops disagreeing with reality.

**Negative**

- `VALID_STATUSES` changes shape; `tests/lib/artifact-utils.test.js` must be updated, including its enumeration at line 353.
- `decision_status` is introduced as a schema field where it currently exists only as ADR-001's self-demonstration.
- Optional-by-design means the corpus will never be uniformly labelled. That is accepted: uniform labelling was never achieved in 16 months and is not what the consumer needs.

**Neutral**

- Which artifact types *may* carry `decision_status` is deliberately not fixed here — it depends on OQ-2 (object ontology). The evidence leans `adr`, `decision`, `experiment`, `persona` (verdict-dominant in the cross-tab), but that list is OQ-2's to ratify.

---

## Alternatives considered

**A. One `status` field, widened enum.** Rejected. The cross-tab shows artifact type predicts axis — `adr` is 12/13 verdict, `arch` is 8/8 lifecycle, `decision` 5/5 verdict. A single vocabulary spanning both is the union of 40 values, which is free text wearing an enum's clothes.

**B. Three fields (`status` + `decision_status` + `gate`).** Rejected under Rule of Three — see D2.

**C. Per-artifact-type enums declared in `taxonomy.yaml`.** Rejected *for now*, not on merit. It matches the cross-tab well, but it makes `taxonomy.yaml` carry validation policy for 20+ types and forces a schema decision on every new type. It is a refinement available later if D3's flat enums prove too loose; it does not remove the need for the two axes, only scopes them.

**D. Status as a required governance assertion.** Rejected by operator ruling. It requires the ~893-file backfill, requires wiring `validateFrontmatterSchema` into CI where it has never run, and still leaves the portfolio engine's vocabulary to reconcile — the largest cost of the four options, for guarantees the sole consumer does not ask for.

---

## Open questions

- **Which types may carry `decision_status`** — deferred to **OQ-2** (object ontology).
- **Whether the portfolio engine is itself invoked** by anyone. P60's founding premise is that none of the ten instruments run. This ADR ratifies the engine's model as authoritative; if the engine has no operator either, that premise deserves its own examination — but it does not change this ruling, which reduces cost under either answer.

---

## Change log

| Date | Change | By |
|------|--------|-----|
| 2026-08-30 | Initial draft. Proposed, unsigned. Resolves ADR-001 OQ-1 on the operator's ruling that status is engine evidence. | Winston (architect role) |
| 2026-08-31 | **Accepted by Amalik as drafted.** No amendment applied. The substantive ruling was made 2026-08-30 (status is engine evidence); this entry records the signature. `status` moves `draft` → `active` and `decision_status` `proposed` → `accepted` — the two-axis split this ADR decides, applied to itself. | Amalik |
