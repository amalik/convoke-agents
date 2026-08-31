---
initiative: convoke
artifact_type: adr
qualifier: knowledge-governance-object-ontology
created: '2026-08-31'
status: draft
decision_status: proposed
schema_version: 1
related_initiative: 'P60 — Knowledge & Documentation Governance'
related_decision: 'ADR-001 (OQ-2); ADR-002'
related_epic: none
supersedes: none
qualifier_role: winston-architect
signoff_by: pending
---

# ADR-003: Object Ontology — Work Receipts Are a Class, Declared Once

**Status:** **PROPOSED** (2026-08-31) — awaiting sign-off
**Initiative:** Knowledge & Documentation Governance (**P60**)
**Decision owner:** Amalik
**Resolves:** ADR-001 open question **OQ-2**

---

## Context

ADR-001 deferred OQ-2 as *"whether knowledge products (keyed by subject, having currency) and work receipts (keyed by work item, never stale) remain two models,"* noting that `scripts/lib/portfolio/portfolio-engine.js:64` *"already assumes they do."*

Two things are wrong with that framing, and correcting them is what makes the question decidable.

### 1. The cited assumption is not an ontological one

`portfolio-engine.js:62-68` is a doc comment on `STORY_PREFIX_MAP`. It states that story files use compact filename prefixes and live in `implementation-artifacts/`. That is a **filing convention**, not a data model.

### 2. The two models do not exist in code

Searching `scripts/lib/` and `scripts/audit/` for a receipt-versus-product distinction returns three hits, all in `backlog-integrity.js` (lines 286, 961, 1120) and all referring to the backlog's own §2.5 receipts — an unrelated concept.

```
grep -rn "receipt\|knowledge product\|staleness\|currency" scripts/lib scripts/audit | grep -v "\.test\."
```

**No module branches on artifact class.** `taxonomy.yaml` carries 23 `artifact_types` with no class field. So OQ-2 cannot be *"do they remain two models"* — they were never two models.

### 3. What exists instead: the same decision, made three times, differently

The distinction is real, but it is expressed as three independent directory scopes that no two of which agree:

| Directory | `.md` files | portfolio-engine | archive | migrate-artifacts |
|---|---|---|---|---|
| `planning-artifacts` | 140 | ✓ | ✓ | ✓ |
| `vortex-artifacts` | 32 | ✓ | ✓ | ✓ |
| `implementation-artifacts` | **226** | ✓ | ✓ | **✗** |
| `gyre-artifacts` | 1 | ✓ | **✗** | ✓ |
| `pf1-baselines`, `pf1-post-migration`, `exp3-smoke-test`, `party-mode`, `draft-proposals` | 15 | ✓ | ✗ | ✗ |

Sources: `portfolio-engine.js:263-266` (all `_bmad-output` subdirs minus `EXCLUDE_DIRS` at line 29); `archive.js:21` (`SCAN_DIRS`); `migrate-artifacts.js:34` (`DEFAULT_INCLUDE_DIRS`).

No ontology explains this table. `implementation-artifacts` is archivable but not governable; `gyre-artifacts` is governable but not archivable. Each instrument made its own scoping call and none references a shared definition.

### 4. The scoping disagreement is most of the "ungoverned corpus"

Measured 2026-08-31 (governed = frontmatter carries both `initiative` and `artifact_type`, the test `portfolio-engine.js:333` applies):

| Directory | Files | Governed | % | In migrate scope? |
|---|---|---|---|---|
| `vortex-artifacts` | 32 | 32 | **100%** | ✓ |
| `planning-artifacts` | 140 | 114 | **81%** | ✓ |
| `implementation-artifacts` | 226 | 52 | **23%** | **✗** |

Governance coverage tracks migration-tool scope. The one directory the migrator excludes is the largest — 226 of 398 files, 57% of the corpus — and is the only one below 81%.

**This reframes ADR-001's headline.** The ungoverned bulk is substantially a scoping decision, not neglect. And it puts the coverage metric in an impossible position: `portfolio-engine.js` counts `implementation-artifacts` in its governance denominator while `convoke-migrate-artifacts` — the tool its own output recommends running — will not touch those files by default. The ratio cannot reach 100% by construction.

*Method note: an earlier attempt at these figures returned 0% because the harness read `parseFrontmatter`'s return object directly instead of its `.data` property. The table above uses `.data`. Both the engine's own run and this measurement are reproducible with the commands cited.*

---

## Decision

**Proposed: work receipts are an explicit artifact class, declared once in `taxonomy.yaml`, read by every instrument that scopes the corpus. Receipts are exempt from governance-metadata expectations and from the coverage denominator; they remain in scope for archival and for activity inference.**

**D1 — The class is a property of the artifact, not of its directory.** `taxonomy.yaml` gains a class per `artifact_type` (`product` | `receipt`). Directory location stops being the carrier of the distinction.

**D2 — One definition, three readers.** `portfolio-engine.js`, `archive.js` and `migrate-artifacts.js` all resolve class from the taxonomy. None keeps its own directory list for this purpose. This is ADR-002's **D5** applied one level up: the divergence in §Context.3 is what a convention-held boundary produces.

**D3 — Receipts are exempt from the governance denominator.** The coverage figure is reported over products only, or as two figures. A metric whose denominator includes files its own remediation tool excludes is not measuring neglect.

**D4 — Receipts stay in scope for archive and for activity inference.** A shipped story is still a real event in git history and a legitimate recency signal (`git-recency-rule.js:52-64`), and duplicated dated receipts are still archivable (`archive.js:21`). Exempting them from *governance metadata* is not exempting them from *existence*.

**D5 — No backfill.** The 174 ungoverned files in `implementation-artifacts` are not a debt to be paid; under D1 most are correctly ungoverned. This follows ADR-002's ruling that metadata exists to serve a consumer, not to achieve uniformity.

---

## Consequences

**Positive**

- The largest single line item in P60's cleanup — 174 ungoverned files — is resolved by ruling rather than by migration.
- The coverage metric becomes achievable and therefore meaningful.
- The three-way scoping disagreement gets one owner.

**Negative**

- `taxonomy.yaml` gains a field, and each of the 23 artifact types needs a class assigned — a one-time judgement per type.
- Three instruments change their scoping source. `migrate-artifacts.js`'s `--include` flag (parsed at `migrate-artifacts.js:52`, documented at `:113`) must keep working for explicit operator overrides.
- If a receipt type is later found to need currency after all, the class assignment must move, not the file.

**Neutral**

- Which of the 23 types are receipts is **not** decided here (see Open questions). The obvious candidates are `story`, `sprint`, `retrospective`-shaped reports and `pre-reg`; the obvious products are `arch`, `prd`, `adr`, `brief`, `vision`.
- ADR-002's `decision_status` field applies to products only under this split, which answers the question ADR-002 left to OQ-2 — but only once the type list below is ruled.

---

## Alternatives considered

**A. One model — bring `implementation-artifacts` into `migrate-artifacts`' default scope.** Rejected. It makes the corpus uniform at the cost of backfilling 174 files with metadata no consumer reads, which is the option ADR-002 rejected for `status` on the same reasoning. It would also make `story` files carry `initiative` twice — once in frontmatter, once in the filename prefix that `STORY_PREFIX_MAP` already resolves.

**B. Status quo — three independent scopes.** Rejected. It is the mechanism that produced §Context.3, where no two instruments agree and neither `implementation-artifacts` nor `gyre-artifacts`' treatment is explicable. This is the third instance of a convention-held boundary drifting that this initiative has found in two days; the first two were `VALID_STATUSES` and `config-loader.js`.

**C. Directory-as-class, but written down once.** Rejected, narrowly. It is cheaper than D1 and would fix the divergence. But it fixes it by ratifying directory location as ontology, which fails the moment a product lands in `implementation-artifacts/` — and `deferred-work.md` and `sprint-status.yaml` already do.

---

## Open questions

- **OQ-2a — Which of the 23 `artifact_types` are receipts.** A one-time classification; should be ruled with the type list in front of the operator, not inferred here.
- **OQ-2b — Whether coverage reports one figure or two** (D3 permits either).
- **Whether `EXCLUDE_DIRS` survives** as a separate concept once class is explicit, or collapses into it.

---

## Change log

| Date | Change | By |
|------|--------|-----|
| 2026-08-31 | Initial draft. Proposed, unsigned. Reframes OQ-2: the two models were never implemented; the distinction exists as three inconsistent directory scopes. | Winston (architect role) |
