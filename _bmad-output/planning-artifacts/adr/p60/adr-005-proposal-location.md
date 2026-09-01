---
initiative: convoke
artifact_type: adr
qualifier: knowledge-governance-proposal-location
created: '2026-09-01'
status: draft
decision_status: proposed
schema_version: 1
related_initiative: 'P60 — Knowledge & Documentation Governance'
related_decision: 'ADR-001 (OQ-3); ADR-002; ADR-003; ADR-004'
related_epic: none
supersedes: none
qualifier_role: winston-architect
---

# ADR-005: Proposal Location — Draft Is a Status, Audience Decides the Tree

**Status:** **PROPOSED** (2026-09-01)
**Initiative:** Knowledge & Documentation Governance (**P60**)
**Decision owner:** Amalik
**Resolves:** ADR-001 open question **OQ-3** — the last question blocking P60

---

## Context

ADR-001 deferred OQ-3 as:

> *"**Where proposals live.** Whether unruled strategy drafts belong in `docs/` or in
> `planning-artifacts/` under a `draft` status."* — `adr-001-cleanup-scope.md:114`

### 1. The question is a false binary — there are four locations

| Location | Files | Instrument treatment |
|---|---:|---|
| `docs/` | 15 | **Outside every instrument.** The portfolio engine scans `_bmad-output/` only. |
| `_bmad-output/drafts/` | 2 | **Excluded** — `EXCLUDE_DIRS`, `portfolio-engine.js:29` |
| `_bmad-output/draft-proposals/` | 1 | **Included** in the governance denominator |
| `planning-artifacts/` at `status: draft` | 5 | Included and governed |

Two directories whose names differ by a hyphenated suffix receive **opposite** treatment, and nothing
in the code or the corpus explains why `drafts` is in `EXCLUDE_DIRS` and `draft-proposals` is not.
Verified by executing the engine's own directory-selection logic:

```
dirs the engine scans: draft-proposals, exp3-smoke-test, gyre-artifacts, implementation-artifacts,
                       party-mode, pf1-baselines, pf1-post-migration, planning-artifacts, vortex-artifacts
  drafts          -> 0 file(s) in the denominator
  draft-proposals -> 1 file(s) in the denominator
```

This is the fourth instance of the pattern this initiative keeps finding: a distinction held by
convention across several instruments, drifting because no definition is shared. The first three were
`VALID_STATUSES` (ADR-002), the three directory scopes (ADR-003) and the two archives (ADR-004).

### 2. The cost, in one measurement

`docs/lifecycle-expansion-vision.md` has **14 inbound references** — the most-cited strategy document
in the project. It carries **no frontmatter**, declares no status, and sits in a tree no governance
instrument scans. `docs/what-convoke-brings-to-bmad-method.md` has **0** inbound references and is
invisible in exactly the same way.

**No instrument can tell those two apart.** That is what OQ-3 is actually about: not tidiness, but that
the project's most load-bearing unruled document and its most orphaned one are indistinguishable to
every tool that reports on the corpus.

Of 15 files in `docs/`, **1** carries frontmatter (`host-framework-sync-playbook.md`).

### 3. `docs/` does not ship, but the README does

`package.json` `files[]` does not include `docs/` (**I157**), so none of those 15 files reach an
installed operator. `README.md` *is* shipped, and it links **6 of the 15**:

```
docs/BMAD-METHOD-COMPATIBILITY.md   docs/agents.md      docs/development.md
docs/faq.md                          docs/testing.md     docs/lifecycle-expansion-vision.md
```

ADR-001 anticipated this at `:93` — *"The `docs/` tree is in the mutation scope despite not shipping,
because a shipped `README.md` links into it. Those links are the operator-facing surface, not the files
themselves."* **The link, not the directory, is what makes a document published.** That sentence is the
test this ADR formalises.

### 4. A defect in ADR-001's own scope clause

`adr-001-cleanup-scope.md:58` is titled *"**2. Mutation scope is `_bmad-output/` only.**"* and its
sentence reads *"confined to `_bmad-output/`, `docs/`, and the repository root."* The heading and the
text disagree. The text is correct — Alternative A at `:99` rejects `_bmad-output/`-only mutation
explicitly — so the heading is the error. Recorded here rather than fixed silently.

---

## Decision

**Proposed: `draft` is a status, never a location. The tree is chosen by audience, not by maturity.
`drafts/` and `draft-proposals/` are dissolved.**

**D1 — `draft` is a status, not a place.** This is ADR-004's own test applied to the opposite case, and
it returns the opposite answer. Archival earned a directory because it is a **one-way transition
performed by a tool that logs it** — the move *is* the event. Drafting is neither one-way nor
tool-performed: a draft becomes ruled by a human decision, and the document typically does not move
when it does. A directory cannot represent a state its subject leaves without relocating.

**D2 — Audience decides the tree.** `docs/` is the reader-facing tree, reachable through a shipped
README. `_bmad-output/` is the operator- and agent-facing tree, and it is the only one any instrument
scans. **An unruled strategy draft's audience is the operator deciding it**, so it belongs in
`planning-artifacts/` — which answers OQ-3 as asked.

**D3 — The shipped README link is the test for "published".** A `docs/` file the README links is a
published document and stays, whatever its maturity. A `docs/` file the README does not link is not
published, is scanned by nothing, and is misfiled. Nine of the fifteen currently fail this test.

**D4 — `drafts/` and `draft-proposals/` are dissolved**, their three files relocated by audience under
D2, and `drafts` is removed from `EXCLUDE_DIRS` once the directory is gone.

**D5 — No backfill.** Per ADR-002 D1, `status` stays optional; relocated files are not required to
declare `status: draft`. Location is being ruled here, not metadata.

---

## Consequences

**Positive**

- The last question blocking P60 closes, and it closes on a principle already established rather than a
  new one.
- The `drafts`/`draft-proposals` divergence is removed at the root instead of documented.
- After D3, "is this document published?" has a mechanical answer for the first time.

**Negative**

- **D3 implies moving nine files**, and every move is link damage against a corpus already carrying 673
  broken references. **T84 is a hard prerequisite**, exactly as it is for OQ-4's reorganisation. This
  ADR rules the test; it does not authorise the move.
- `docs/README.md` is itself unlinked from the shipped README and would fail D3 — almost certainly a
  false positive that the implementing story must handle rather than obey.
- Relocating `codebase-audit-2026-06-27.md` (9 inbound references) and
  `Convoke-Ecosystem-v0.2-Updated-With-Gyre.md` (3) touches well-cited documents.

**Neutral**

- ADR-002's status ruling is untouched.
- Whether `EXCLUDE_DIRS` survives as a concept is still ADR-003's open question; D4 removes one entry
  from it, not the mechanism.

---

## Alternatives considered

**A. Unruled strategy lives in `docs/` under a `draft` status.** Rejected. It puts the document in the
one tree no instrument scans, so the status would be declared to nobody — which is the present
condition and the thing §Context.2 measures the cost of.

**B. Keep `draft-proposals/` as the single proposal directory and dissolve only `drafts/`.** Rejected.
It preserves maturity-as-location, which D1 rejects on ADR-004's own reasoning, and it would need a
rule for when a proposal leaves the directory — the rule that does not exist today and is why the two
directories drifted apart.

**C. Move all 15 `docs/` files into `_bmad-output/` and let the README link across.** Rejected. It
breaks the shipped README's operator-facing surface, which ADR-001:93 identifies as the thing worth
protecting, and Alternative B of ADR-001 already rejected renaming shipped paths outside the publish
path's rehearsal and gating.

**D. Rule nothing; let `status: draft` in `planning-artifacts/` be the convention and leave `docs/`
alone.** Rejected, narrowly. It is nearly free and would work for new documents. It leaves the
15 existing `docs/` files exactly as they are, including the 14-inbound vision document that no
instrument can see — so it answers the question without addressing what made it worth asking.

---

## Open questions

- **OQ-3a — Published *and* unruled.** `docs/lifecycle-expansion-vision.md` passes D3 (the README links
  it) and is an unruled strategy draft under D2. The two rules point in opposite directions for it, and
  it is the most-referenced document in the class. D3 wins as written — it stays in `docs/` — but that
  leaves the project's most-cited vision document permanently ungoverned. **This is the one part the
  measurements do not settle.**
- **OQ-3b — Whether `docs/` should be scanned at all.** Making it a fourth include directory would
  govern all 15 files without moving any, and is a smaller change than D3's nine moves. It is not
  proposed here because `docs/` is reader-facing and its files are not artifacts in the taxonomy's
  sense — but that reasoning deserves a challenge before D3 is implemented.

---

## Verification

Every figure was produced by executing against the tracked repository at commit `889b42be`: the engine's
directory-selection logic was run to produce the `drafts`/`draft-proposals` split, inbound reference
counts come from a corpus-wide grep excluding each file's own path, and the README link list is
`grep -oE 'docs/[A-Za-z0-9._-]+\.md' README.md | sort -u`. `files[]` membership was read from
`package.json` via `require`, not from documentation about it.
