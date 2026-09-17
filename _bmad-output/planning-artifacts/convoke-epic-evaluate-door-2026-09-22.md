---
initiative: convoke
artifact_type: epic
qualifier: evaluate-door-2026-09-22
created: '2026-09-17'
status: active
schema_version: 1
related_initiative: 'docs program — three doors'
qualifier_role: operator-authored
---

# Epic: the Evaluate door (`eval-epic-1`)

**Created 2026-09-17**, five days before the leadership review on **Tuesday 2026-09-22**. The docs program
was planned on 2026-09-14 (`convoke-note-docs-program-three-doors-2026-09-14.md`) and Wave 1 has been
running since, but it had no epic and no story tracking — so what was drafted, what was verified, and what
had not been started were not visible in one place. This epic is that place. It covers **Wave 1 only**: the
Evaluate door and the "Customize without forking" page. Use (Wave 2) and Build (Wave 3) come after.

## Why it exists

The audience is organisations deciding whether to adopt. They are not reading for features; they are
testing whether the vendor tells the truth about its own limits. That makes **candor the governance
proof**, and it makes one overclaim found during due diligence more expensive than ten missing pages,
because it travels to every other evaluator.

Two things follow, and they shape every story here:

- **Every claim needs a source, and every command gets executed before it is published.** This project has
  four consecutive arcs where the review rounds' own remediations produced the next round's defects; the
  rule that survived is that a documented command must be run from the reader's position, not composed.
- **Nothing reaches an evaluator without an independent review.** Self-review finds mechanical errors, not
  judgement errors. That is `eval-1-7`, and it is not optional.

## Scope

| Story | Deliverable | Depends on |
|---|---|---|
| `eval-1-1` | Re-derive the maturity ledger against 4.0.3 | 4.0.3 published ✓ |
| `eval-1-2` | Claim-check the state-of-the-art research | — |
| `eval-1-3` | Whitepaper, sections 1–6 and appendices | 1-1, 1-2 |
| `eval-1-4` | Executive brief, two pages | 1-1, 1-3 |
| `eval-1-5` | Page one: two framing options, then locked | evaluator interviews |
| `eval-1-6` | Due-diligence pack, as far as it gets | 1-1 |
| `eval-1-7` | Independent review before anything reaches an evaluator | 1-3, 1-4, 1-5, 1-6 |

**Format ruled 2026-09-17:** markdown in the repository. Reviewable, diffable, and every claim traceable to
a commit. Export is a later decision, not a dependency.

**Interviews ruled 2026-09-17:** they are happening, and the work draws around them. Only page one's framing
depends on them, so `eval-1-5` carries two options and locks last. Nothing else waits.

## Why the ledger is first

The ledger is page 2 of the client document — the page whose entire job is being right about the product's
own limits. It was derived against published 4.0.2 on 14–15 September, and **4.0.3 published on 2026-09-17**
fixing precisely the defect the ledger leads with: on a fresh 4.0.2 install, agents stopped at activation
with `Configuration Error: Missing required field(s)`, confirmed by starting them headless. A ledger that
discloses a defect the product no longer has is as wrong as one that hides a defect it still has, and it is
wrong in the direction that costs credibility twice — once when an evaluator finds it stale, and again when
they wonder what else is.

## Explicitly not in scope

- **Wave 2 (Use) and Wave 3 (Build).** Named in the program plan, scheduled after the review.
- **Fixing what the ledger discloses.** `T180`, `T181`, `T182` and `T183` are open rows. The Evaluate door
  reports the product as it is; it does not wait for it to improve.
- **Backlog filing of the ~13 defects found during Wave 1** (4 from the ledger, 9 from the customize
  evidence). Unblocked now that 4.0.3 has shipped, but it is backlog hygiene, not a client deliverable.
  Carried forward.

## Definition of done

Every claim in the Evaluate pack is sourced; every command in it was executed and its real output recorded;
the ledger's basis is the published release an evaluator would install today; page one is locked against
whatever the interviews returned, or explicitly marked vendor-authored if they returned nothing usable; and
an independent review has run against the assembled pack, with its findings either fixed or disclosed.
