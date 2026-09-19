---
initiative: convoke
artifact_type: adr
qualifier: changelog-surfaces-two-rendering-models
created: '2026-09-18'
status: accepted
decided: '2026-09-19'
schema_version: 1
related_initiative: 'Release-gate correctness (no epic; qualified from the alert-29 review)'
related_decision: 'Gates T192 and T195; informs T189 and T190'
related_findings: 'T189, T190, T192, T195 (bundles IN-228); CodeQL alerts 28 and 29'
---

# ADR-001: Convoke renders its changelog on two surfaces, and they disagree

## Context

`scripts/audit/check-changelog-entry.js` is the pre-tag release gate. Its design principle,
stated in its own header, is **read the file twice and refuse when the two readings disagree** —
it does not try to be right about markdown, it detects divergence between what a strict scan sees
and what `changelog-reader.js` (the parser `convoke-update` actually uses) sees.

That principle is sound and three of its six checks honour it. Two do not, and the reason they do
not has been misdiagnosed twice — most recently as "the gate holds two comment models". That is a
symptom. The cause is one level down.

**Convoke renders the same file on two surfaces with genuinely different semantics.**

| Surface | Path | HTML comments |
|---|---|---|
| GitHub | `CHANGELOG.md` rendered by cmark-gfm plus GitHub's sanitizer | **invisible** |
| `convoke-update` | `printChangelog` → `console.log(entry.body)` | **fully visible** |

`convoke-update` prints raw markdown to a terminal. It performs no comment handling, and neither
does `changelog-reader.js` (zero occurrences of `<!--`). So a body that is only an HTML comment is
wrong on both surfaces for *opposite* reasons: it shows a GitHub reader nothing, and it leaks
internal drafting notes to a terminal operator.

Every attempt to describe this in a code comment has been wrong. Across three review rounds on the
alert-29 fix, reviewers found claims that the stripper "knows every terminator the tokenizer does"
(it does not handle EOF), that a wrapping comment "is removed whole" (it is not), that matching
more is "the safe direction here" (it caused two release-blocking false refusals), and an
enumeration of "two misses" that was neither closed nor correctly scoped. The comment was rewritten
four times and was wrong each time. That is the evidence that this belongs in a ratified artifact
rather than in prose beside the code.

### Which reading each check consults, and which surface it protects

Ratified as the declaration each verdict now carries in `check-changelog-entry.js`. Anchored by verdict
name rather than line number, because a line pin in that file rots on the next edit to it.

| Verdict | Strict scan | `changelog-reader.js` | Surface | Honours the invariant |
|---|---|---|---|---|
| `MALFORMED HEADING` | yes | no | GitHub | **no** — T190 |
| `DUPLICATE CHANGELOG ENTRIES` | yes | yes | both | yes |
| `MISSING CHANGELOG ENTRY` | yes | yes | both | yes |
| `DISPUTED …` heading count | yes | yes | both | yes |
| `DISPUTED …` date | yes | yes | both | yes |
| `UNDATED CHANGELOG ENTRY` | no | date only | both | reader-side by design |
| `UNREADABLE CHANGELOG BODY` | n/a — a refusal to judge | n/a | none | n/a |
| `EMPTY CHANGELOG ENTRY` | no | body only, via a third model | both | **no** |

**Corrected at ratification (2026-09-19):** the proposed table listed six verdicts. The gate emits eight —
`MISSING CHANGELOG ENTRY` and `UNDATED CHANGELOG ENTRY` were absent from it. Both consult readings that
agree, so neither changes the decision; but an invariant that does not cover every check is the defect this
ADR exists to stop.

The third model is `stripHtmlComments` (`scripts/lib/sanitize.js::htmlCommentPattern`,
`/<!--(?:>|->|[\s\S]*?--!?>)/g`), which follows the HTML tokenizer. `COMMENT_CLOSE_RE` in the gate
follows CommonMark (`-->` only). Both are correct for their own purpose; T192 is the defect that
falls out of the seam between them.

## Decision

**Name the two surfaces as an invariant, assign each check the surface it protects, and do not
reconcile the models.**

### Option A — document the surfaces, assign each check one (recommended)

Record the table above as a ratified invariant. Every existing check declares which surface it
protects; every new check must do the same or declare itself surface-independent. The two comment
models stay, because each is correct for the surface it serves.

- Cost: this document, plus a one-line declaration per check (**done at ratification**).
- `T190` becomes a straightforward instance: restore the invariant by giving the malformed check a
  reader-side counterpart.
- `T192` stops being a seam defect and becomes an ordinary GitHub-surface defect — `--!>` followed
  by text destroys GitHub rendering, so the gate should refuse it.
- `T195` is answered: *does the body render as anything* is not one question, so no single model
  can answer it and the check is right to stop at *is the body only comments*.

### Option B — reconcile on CommonMark everywhere

Replace `stripHtmlComments` in the gate with a CommonMark-faithful stripper.

- Correct for GitHub, wrong for `convoke-update`, where comments are visible.
- Requires a second stripper that `sanitize.js` deliberately does not provide, duplicating a
  module that exists precisely so there is one audited implementation.

### Option C — reconcile on the tokenizer everywhere

Widen `COMMENT_CLOSE_RE` to `--!?>`.

- This is CodeQL alert 28's proposal. It was measured and reverted: widening makes the heading scan
  hide fewer headings, so the gate detects fewer divergences and fails open. Commit `2c8ed99b`.

## What this decision explicitly does NOT claim

- **It does not make the gate able to decide whether a body renders as anything.** A body that is
  only a link-reference definition renders as nothing on GitHub and contains no comment at all. No
  comment-stripper reaches it; only a renderer does. That limit is accepted, not closed.
- **It does not close T189, T192 or T195.** It gives each of them a frame. They remain open rows.
- **It does not claim the two surfaces are equally important.** It claims only that they differ,
  and that a check which does not say which one it serves cannot be reasoned about.
- **It asserts nothing about severity.** `CHANGELOG.md` currently contains zero `<!--`, and the
  gate runs in no CI job (`T194`). Everything here is latent.

## Consequences

- New checks in this gate carry one extra line: which surface, and which readings. The eight existing
  verdicts carry theirs as of ratification.
- The two comment models remain, permanently, with a written reason. Future readers stop
  rediscovering the seam and rewriting the comment.
- `sanitize.js` keeps its single-implementation property; the gate does not grow a private stripper.
- The code comment at the body check is now a pointer at this ADR, and the prose that produced a false
  claim on each of its four rewrites is gone.

## Alternatives considered

Leaving the explanation in a code comment was the status quo and is what this ADR replaces. It was
tried four times across three review rounds and produced a false claim every time, including one
that inverted the meaning of the very rule it was describing. The failure is structural, not
careless: a comment beside one check cannot hold an invariant that spans six.

## Evidence appendix

Every claim above was derived on 2026-09-18, not recalled. Re-derive with:

```sh
grep -n 'console.log(entry.body)' scripts/update/convoke-update.js  # raw markdown to a terminal
grep -c -- '<!--' scripts/update/lib/changelog-reader.js # 0 — the reader has no comment model
grep -c -- '<!--' CHANGELOG.md                           # 0 — no shipped entry exercises this
grep -n 'htmlCommentPattern = ' scripts/lib/sanitize.js  # the tokenizer model
grep -n 'COMMENT_CLOSE_RE = ' scripts/audit/check-changelog-entry.js  # the CommonMark model
grep -c 'check-changelog-entry' .github/workflows/ci.yml # 0 — the gate runs in no CI job (T194)
```

All were run from the repository root on 2026-09-18, and re-run unchanged on 2026-09-19. Note that the two `grep -c` lines exit
**1**, because that is what `grep` does when the count is zero — which is the answer being cited.
Under `set -e` they abort on a correct result.

Rendering differences were confirmed against GitHub's own renderer with
`gh api -X POST /markdown`, not against a local library.

## Operator decision

**ACCEPTED 2026-09-19 — Option A.** The two surfaces are a ratified invariant. Every verdict in
`check-changelog-entry.js` declares the surface it protects and the readings it consults; the two comment
models stay, each correct for the surface it serves.

Changed by the ruling, in the same commit: the eight declarations, the body check's comment reduced to a
pointer here, and the table above completed to all eight verdicts.

Not changed: `T189`, `T190`, `T192` and `T195` stay open — they have a frame now, not a fix. The gate is
still wired into no CI job (`T194`), so what it protects remains latent until it is.
