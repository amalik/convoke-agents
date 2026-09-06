---
baseline_commit: cdd9cf88ff03f010a5bf32bbddb132d718cb718b
---

# Story 2.2: Assert every documented reference resolves inside the package

Status: done

<!-- baseline_commit deliberately ABSENT — it is `dev-story`'s field, stamped at implementation start. -->

## Story

As a **Convoke operator**,
I want every link in what I installed to point at something I have,
so that **"required reading" is readable by someone who installed from npm**.

### What this story is, in one line

Build the shipped-link checker against the harness's already-packed tarball, prove it red on the
**27** real findings, and **do not wire it into CI** — Story 2.3c does that, in the commit that
turns it green.

---

## Acceptance Criteria

**AC1 — Runs against the harness's tarball, not a second pack**

**Given** `scripts/audit/try-fresh-install.sh` already runs `npm pack` as its first step
**When** the checker is written
**Then** it runs against that harness's packed tarball rather than packing its own — a second pack
is a parallel mechanism, the criticism this epic levels at grep-based detection
**And** it reuses the harness's existing extraction rather than extracting again

**AC2 — NOT wired into CI by this story (NFR10)**

**Given** `fresh-install` is one of the eight jobs `publish` `needs:`, and it runs on push to `main`
and on every pull request
**When** this story completes
**Then** the checker is **not** placed in the harness's failure path, and the harness verdict
condition is left byte-identical
**And** `continue-on-error` appears nowhere — a gate nobody watches is T32, the row this epic exists
to close
**And** Completion Notes name **Story 2.3c** as the wiring story
**And** a *cannot-run* condition (exit 2) may exit `ENV_FAIL`, consistent with the nine existing
sites in that file — the constraint is on the **verdict**, not on error handling. This clause exists
because Story 2.4's AC2 did not draw the distinction and a reviewer had to

**AC3 — Every relative link in every shipped `.md` resolves inside the package**

**Given** the packed tarball — **461 files, 334 of them `.md`** today, both re-derived at
implementation time
**When** the gate runs
**Then** it resolves every relative markdown link in every shipped `.md` and fails on any target
absent from the package
**And** `#fragment` suffixes are stripped before resolution; anchor *targets* are not validated, and
the story says so

**AC4 — Fenced and inline code are skipped, and indented fences are handled**

**Given** a naive scan reports **29** findings and a fence-aware scan reports **27** — the two extra
are markdown **examples** inside fenced blocks in
`_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md:227` and
`steps-c/step-c-04-generate.md:102`
**When** the checker runs
**Then** it skips fenced code blocks and inline code spans, so neither is reported
**And** it handles **indented** fences — the `backlog-format-spec.md` example opens with two leading
spaces, and a fence matcher anchored at `^` misreads the fence state for the rest of the file.
*(This is not hypothetical: the first measurement written for this story made exactly that mistake
and classified a fenced example as a real finding.)*
**And** a committed test covers both shapes, indented and flush

**AC5 — Self-referential absolute URLs are validated (ADR-002 Amendment 1)**

**Given** [ADR-002 Amendment 1](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md)
rules that FR12 validates the self-referential subset
**When** the checker runs
**Then** it resolves `https://github.com/amalik/convoke-agents/blob/main/<path>` against the
repository and fails when `<path>` does not exist
**And** external absolute URLs are permitted and **not** validated
**And** the prefix is read from `package.json`'s `repository.url`, never hardcoded and never taken
from a README — `verify-external-identifiers`
**And** the 10 unique self-referential paths shipping today all resolve, so this clause contributes
**zero** findings to AC6's red demonstration — it is built green and stays green until Story 2.3b
moves the Covenant, which is one of the ten

**AC6 — Observed failing, with the count derived (NFR10)**

**Given** the tree as it stands
**When** the gate first executes
**Then** it is observed **failing** with output recorded in Completion Notes, on **27 findings
across 4 files** — re-derived at implementation time, never copied from this story:

```
13  scripts/migration/format-conversion/README.md          <- Class 1 (2.3a)
 5  scripts/migration/format-conversion/fixup-checklist.md <- Class 1 (2.3a)
 5  _bmad/bme/README.md                                    <- Class 2 (2.3b)
 4  CHANGELOG.md                                           <- Class 3 (2.3c)
```

**And** the story records that **ADR-002's own enumeration says "20 broken relative links across 4
files" and is undercounted** — the file set is right, the link count is not. Do not reconcile to 20

**AC7 — The scope limit is stated, not assumed**

**Given** this gate resolves documented references only
**When** its scope is documented
**Then** the story states explicitly that it **cannot** detect a file read at runtime but absent
from the package — that class is Story 2.4's, which shipped — so no one assumes coverage it does
not have
**And** it states that CR-README-D04 **narrows rather than closes**: external absolute URLs remain
unvalidated by design

---

## Tasks / Subtasks

- [x] **T1** — Locate the harness's pack/extract step; hook the checker to its output (AC1)
- [x] **T2** — Link extraction with fence + inline-code stripping, indented fences included (AC3, AC4)
- [x] **T3** — Self-referential absolute-URL resolution, prefix from `package.json` (AC5)
- [x] **T4** — Red demonstration; derive the count; record output (AC6)
- [x] **T5** — Tests: indented fence, flush fence, inline code span, a real broken link, a valid self-referential URL, a broken one. Isolated fixture dirs only (`test-fixture-isolation`)
- [x] **T6** — Scope documentation at the checker and in Completion Notes (AC7, AC2)


### Review Findings

**Round 1, 2026-09-06.** Layer provenance, stated because it is not the intended arrangement:
**Edge Case Hunter ran blind in a separate session** (15 findings, every one reproduced against
running code before triage). **Blind Hunter and Acceptance Auditor ran IN-SESSION**, by the agent
that wrote the code — five successive subagent launches died on infrastructure (one machine sleep,
four 600s stream-watchdog stalls), and after three attempts at the same fix `code-review-convergence`
directs changing the instrument rather than retrying. In-session review is the weaker instrument
here and the two HIGHs below should be read with that discount. **A Round 2 by a different model is
warranted** — Round 1 produced HIGH findings, which triggers Round 2 under the convergence rule.

*Patched (12).* All applied, tested, and mutation-verified:

- [x] [Review][Patch] Comment claimed counts as "Measured on this package" that were copied from the story, not measured — HIGH [scripts/audit/lib/shipped-links.js:18] — said 29/6 naive and 27/4 aware; the actual measurement was 30/7 and 28/5. Absolute counts removed rather than corrected: 2.3a/b/c drive them to zero, so any number there is stale within three stories. The stable *property* is stated instead.
- [x] [Review][Patch] CLI reported a clean scan when markdown was found but zero references were extracted — HIGH [scripts/audit/assert-shipped-links.js] — one unclosed fence produced `scanned 2 markdown file(s), 0 resolvable reference(s)` and **exit 0**. Two fixes: an unterminated fence is now a *finding* naming the opening line, and the CLI fails closed on `linkCount === 0`. Zero shipped files have an unterminated fence today, so the derived count is unaffected.
- [x] [Review][Patch] Comments in the harness and the CLI claimed every finding maps to 2.3a/2.3b/2.3c — MEDIUM [scripts/audit/try-fresh-install.sh; scripts/audit/assert-shipped-links.js] — false for the 28th, and it is the one that would land a red gate on `main`. Both now say so explicitly.
- [x] [Review][Patch] A fence inside a blockquote was invisible, so every link in a blockquoted example became a finding — MEDIUM [scripts/audit/lib/shipped-links.js] — the identical false-positive class AC4 exists to prevent. Latent in 5 shipped files; none holds a link today, which is why it was silent.
- [x] [Review][Patch] A case-only link mismatch passed on a case-insensitive filesystem — MEDIUM [scripts/audit/lib/shipped-links.js] — `[home](Readme.md)` → `README.md` passed on macOS and 404s for every Linux consumer. Resolution is now case-exact per path segment.
- [x] [Review][Patch] A `#committish` in `repository.url` produced a truthy-but-WRONG prefix — MEDIUM [scripts/audit/lib/shipped-links.js] — only `null` fails closed, so AC5 would have evaluated nothing while the run printed a clean verdict.
- [x] [Review][Patch] `?query` was not stripped from targets — MEDIUM — GitHub's `?plain=1` / `?raw=1` turned a live file into a finding.
- [x] [Review][Patch] `http://` and `www.` variants of this repository's own URLs went unvalidated — MEDIUM — a silent hole in AC5 rather than a finding.
- [x] [Review][Patch] npm's documented shorthand `repository` forms returned `null` → CLI exit 2 → `ENV_FAIL` aborting the whole `fresh-install` job — MEDIUM. `github:`/`gitlab:`/`bitbucket:` and ssh-with-port now parse.
- [x] [Review][Patch] Angle-bracket targets and titles were mutually exclusive — LOW — `<file name.md> "Title"` kept its brackets and could never resolve.
- [x] [Review][Patch] `rel.startsWith('..')` could not tell an escape from a file named `..gitkeep-notes.md` — LOW. Containment now compares path segments.
- [x] [Review][Patch] The explicit containment guard was documented as the mechanism that prevents escapes, but is redundant — LOW [scripts/audit/lib/shipped-links.js] — **found by mutation, not by reading**: deleting it turns no test red, because the case-exact segment walk already rejects `..`. Kept as a statement of intent, with a comment saying it is redundant rather than implying it is load-bearing.

**Round 2, 2026-09-06.** All three layers ran as intended this time — Edge Case Hunter, Blind
Hunter and Acceptance Auditor, each blind, each in its own session. **4 HIGH, 11 MEDIUM.**

**Round 2 triggered the restructure clause, and the work was redirected rather than patched again.**
`code-review-convergence`: *"If a round's HIGH findings are predominantly defects in the previous
round's corrections rather than in the work under review, the next action is to change the
instrument, not to patch again."* They were. Round 1's blockquote fix caused two fail-opens; Round
1's zero-extraction guard destroyed Round 1's own unterminated-fence tripwire; Round 1's
`normalizeUrl` leaked a third time (host case) and its shorthand fix a second (`#committish`
ordering); and Round 1's correction to the census claim introduced a **new** false number. Four
instruments were changed, on operator ruling where the choice was not forced:

1. **Markdown scanning — ambition narrowed (operator decision).** Blockquote handling REVERTED.
   Tracking blockquote state without tracking block structure produced two defects worse than the
   one it fixed. The false-positive class is now a documented scope limit with a test pinning it,
   and a real CommonMark parser is backlogged with 2.3c as its decision point. Rejected
   alternatives: adding `markdown-it` (a new *runtime* dependency for every installing user, since
   `scripts/` ships) and continuing to patch by hand.
2. **URL handling — rebuilt on `new URL()`.** The string-prefix instrument leaked once per round,
   each leak a silent skip: `http`/`https`, then `www.`, then host case, then port. All four are
   cases where two strings differ and the URLs are the same. `repositoryIdentity()` now returns
   structured `{host, port, owner, repo}` and comparison is by parsed URL — closing the class
   rather than adding a fourth normalisation. Also fixed: `#committish` now stripped *before*
   shorthand matching, npm's bare `owner/repo` and `git://` accepted, GitLab subgroups kept,
   ports preserved, `ssh://host:port` no longer read as a path segment.
3. **The CLI guard — findings now outrank cannot-run.** `linkCount === 0` fires only when
   `findings.length === 0`.
4. **The evidence record — numbers emitted, not transcribed.** `--json` added. Five false claims
   in this record were hand-maintained figures.

*Round 2 patched (13):*

- [x] [Review][Patch] `linkCount === 0` guard discarded a gathered finding and reported cannot-run — HIGH [scripts/audit/assert-shipped-links.js] — an unterminated fence produces one finding and zero resolvable links, so the guard swallowed the exact tripwire Round 1 added, and the harness turns exit 2 into an advisory line: the run ended reporting nothing. The `precondition` doc-comment claiming it "can never discard evidence" was false and is corrected.
- [x] [Review][Patch] Verification table said "Every mutant killed; none survived" three paragraphs above a note recording that one mutant HAD survived — HIGH [this file] — both could not be true; the summary row was the false one, and it is the row a reader scanning for the verdict reads.
- [x] [Review][Patch] The matrix row for the containment-guard mutant named an executioner that does not execute it — HIGH [this file] — the cited test passes with that edit applied. The row now reads SURVIVED.
- [x] [Review][Patch] Fence state leaked out of a blockquote; a later fence pair rebalanced it so the tripwire stayed silent — HIGH [scripts/audit/lib/shipped-links.js] — real links dropped from ordinary prose, reported clean. Closed by reverting blockquote handling (instrument 1).
- [x] [Review][Patch] Package census said 465; the tarball holds 467 — MEDIUM — delta is exactly this story's two shipping files; 465 was measured pre-change. Corrected, and the regeneration command is now recorded beside it.
- [x] [Review][Patch] Blockquote stripping applied inside fence bodies, so a quoted line closed a real fence early — MEDIUM — closed by instrument 1.
- [x] [Review][Patch] `#committish` stripped *after* shorthand matching, so `github:o/r#v1` still exited 2 — MEDIUM — closed by instrument 2.
- [x] [Review][Patch] Host case not folded, so an uppercase self-referential host went unvalidated — MEDIUM — closed by instrument 2.
- [x] [Review][Patch] Port dropped from the identity but present in links, so self-hosted forge links went unvalidated — MEDIUM — closed by instrument 2.
- [x] [Review][Patch] A symlinked directory defeated containment; the doc-comment promised a guarantee that did not hold — MEDIUM — `realpathSync` containment added after the walk (not instead of it, which would undo case-exactness on macOS).
- [x] [Review][Patch] The case-exactness test could not fail on CI — MEDIUM — every runner is `ubuntu-latest`, where `existsSync` alone already returns false, so the test passed for the ordinary reason and deleting the mechanism left CI green. A second test now poisons the directory cache and asserts the *mechanism*, failing on Linux and macOS alike.
- [x] [Review][Patch] Harness comment claimed the new `exit` fires "never on a product defect" — MEDIUM — untrue for two of the CLI's exit-2 paths (no markdown at all; no parsable `repository.url`), both packaging regressions. The trade is now stated instead of denied.
- [x] [Review][Patch] Stale `27`/`29` left in the committed test file, and `shipped-links.js` cited a mutant identifier defined in no artifact — MEDIUM/LOW — Round 1's "counts rot" patch had been applied to one file only. Counts removed; the citation replaced by a named test.

**Round 3, 2026-09-06 — the FINAL round.** All three layers ran blind. **6 HIGH, ~13 MEDIUM,
~8 LOW** after de-duplication. `code-review-convergence` caps review here: *"No Round 4. If Round 3
still has issues, defer remaining findings to the backlog."*

**The diagnosis, which is the useful output of this round: the AC5 half was over-built, by me, in
Round 2.** AC5 asks for one thing — resolve `https://<forge>/<owner>/<repo>/blob/<ref>/<path>` for
the package being audited, prefix read from `package.json`. Round 2 additionally built npm bare
shorthands, transport ports, and multi-segment repository paths. None is specified; none is used by
this package; each was a fresh way to return a **confident wrong answer** that PASSES the CLI's
fail-closed guard and then silently validates nothing. All three rounds' HIGH findings cluster
there. So Round 3's instrument change was a **deletion**, not a fourth rewrite — narrowing to what
AC5 specifies, which is restoring scope rather than reducing it.

*Round 3 patched (11):*

- [x] [Review][Patch] `repositoryIdentity` returned a confident identity for junk — HIGH — `../owner-repo`, `./repo`, `not-a-url/at-all`, `git@host:22/o/r.git` and `https://host/o/r/tree/main/packages/x` all produced non-null identities, because the bare `owner/repo` shorthand matches ANY two-segment string and the URL branch did not bound the path. A wrong-but-non-null identity passes the "no parsable repository.url" guard, so AC5 evaluated nothing and the run exited 0 clean. Now: exactly `<owner>/<repo>`, prefixed shorthands only, `.`/`..` rejected — anything else is `null` and the gate refuses to run.
- [x] [Review][Patch] A transport port poisoned https matching — HIGH — an `ssh://…:2222/` remote put `2222` into the identity, and the exact-port comparison then skipped every https self-referential link. Ports are no longer part of identity; an SSH port has no relation to the web UI a `blob` link is written against.
- [x] [Review][Patch] Post-scan cannot-run guards discarded gathered findings — HIGH — Round 2 fixed one guard and left two; a package with real broken links and a malformed `repository.url` printed **nothing** and exited 2, which the harness turns into an advisory line. **Fixed structurally**: every post-scan bail-out now routes through one function that emits findings first, so the property holds by construction and cannot be reintroduced by writing the next guard the obvious way.
- [x] [Review][Patch] The `precondition` docstring claimed "the ones after it are guarded explicitly" — HIGH — false: three followed the scan, one was guarded. **That docstring was written in Round 2 to correct a previous false claim.** Replaced by two separately-named functions, so the distinction is enforced rather than asserted.
- [x] [Review][Patch] GitLab `/-/blob/` and Bitbucket `/src/` never classified as self-referential — HIGH — while `repositoryIdentity` shipped a HOSTS map for all three forges and a comment justifying case-folding across all three. AC5 silently evaluated nothing on two of the three advertised forges. Now a per-forge layout table with a test case each, using MISSING targets so a skip and a pass are distinguishable.
- [x] [Review][Patch] `--json` had zero tests — HIGH — its only occurrence in the suite was inside a comment, and it is the instrument the record's evidence rests on. Now tested for payload, exit contract, and parseability on a cannot-run path.
- [x] [Review][Patch] The record cited a mutant identifier defined in no artifact — HIGH — **in the very paragraph written to remove the previous such citation**, the third recurrence in three rounds. Fixed structurally: all numbering removed; the matrix is now keyed on *(edit to make → test that goes red)*, both of which exist in the repository, so no uncommitted harness is needed to check a row.
- [x] [Review][Patch] `--json` emitted nothing on precondition paths — MEDIUM — a consumer piping to `jq` got a parse error rather than a machine-readable error.
- [x] [Review][Patch] An unrecognised flag silently degraded JSON mode to text — MEDIUM.
- [x] [Review][Patch] The relative/self-referential split and unique-path count were still hand-transcribed beneath a paragraph promising every figure came from one command — MEDIUM — `--json` now emits `relativeCount`, `selfRefCount`, `uniqueSelfRefPaths`, `skippedCount`.
- [x] [Review][Patch] Record defects: the AC2 evidence quoted line numbers describing a different operation; the stale-spec enumeration named two locations when there are six; the AC7 list omitted the blockquote limit and three others; the AC4 section did not say AC4 is now only partially satisfied; the census misdescribed the 30 skipped references (naming `mailto:`, of which there are zero, and omitting the self-repository non-file class). All corrected — MEDIUM.

*Also caught, by me, mid-remediation and worth recording:* a first attempt at the unresolvable-path
case returned the **string** `'unresolvable'` from a function every call site tested with `!`.
Truthy — so the error path silently became the pass path. Three characters, fail-open, inside a
review round about fail-open. `resolvesInside` now returns a three-valued status, which forces each
caller to say what it means.

*Round 3 deferred (8), added to the backlog:* the multi-segment git ref that yields a wrong path
rather than a skip; the EVEN-count indented-fence inversion that the unterminated-fence tripwire
does **not** cover (the comment claiming it "almost always" does was corrected); `..` traversing a
symlinked directory, which `path.resolve` collapses before the realpath check sees it; symlinked
`.md` files dropped from the corpus; `raw.githubusercontent.com`; `%2F` promoted to a path
separator; the zero-extraction guard being all-or-nothing rather than proportional; and a package
whose markdown legitimately contains only external links being indistinguishable from a broken
extractor. **All are documented in the library's SCOPE block** — Round 3 found several of them
asserted as "see SCOPE" while SCOPE said nothing.

**Round 3's remediation is itself unreviewed, and the rule caps rounds here.** That is a real
residual risk and is stated rather than glossed: ~250 lines changed after the round reported. The
compensating instruments are the mutation matrix (every row re-run), 73 tests, and the fact that
the change is predominantly **deletion** — the narrowing removes code paths rather than adding
them, which is the direction that historically introduces fewer defects. A follow-up review of this
delta belongs to whoever picks up 2.3c.

*Round 2 deferred (5), added to the backlog:* HTML `<a href>`/`<img src>` unchecked and links inside HTML comments reported; cross-line code spans; escaped backticks; NFC/NFD Unicode mismatch reporting a misleading reason; and the `FENCE_RE` "measured zero" note whose grep covered spaces but not tabs (re-measured for tabs: still 0, so the conclusion holds and only its evidence was narrow).

*Not fixed, and deliberately.* Stale figures survive in the SPEC sections of this file, which
`dev-story` does not permit this agent to edit. An earlier draft named two locations; there are
**six**, enumerated here so the next reader is not misled about how much is stale:

| Where | Says | Measured |
|---|---|---|
| One-line summary (§"What this story is") | 27 real findings | 28 |
| AC3 | 461 files, 334 `.md` | 467, 334 |
| AC4 | naive 29, aware 27 | naive 30, aware 28 |
| AC6 | 27 across 4 files | 28 across 5 |
| Dev Notes table | 29 across 6 / **27 across 4 — "Use this"** | 30 across 7 / 28 across 5 |
| Dev Notes, "Why this story does not wire the gate in" | "Eighteen of the 27" / "removes 18 of 27" | 18 of 28 |

The Dev Notes table is the one most likely to mislead, because its "Use this" marker now points at
a superseded number. The Change Log and these notes carry the correction.

*Round 1 deferred (5).* Real, none reachable on today's corpus; measured, not assumed:

- [x] [Review][Defer] `blob/<ref>/` assumes a single-segment ref, so `release/4.0` mis-splits the path — MEDIUM — zero self-referential URLs use a slashed ref today. A correct fix needs the branch list; not guessable from the URL alone.
- [x] [Review][Defer] A fence-shaped line indented 4+ spaces (an indented code block) can open a fence and invert state — MEDIUM — zero occurrences today; bounding the indent at CommonMark's 3 would reintroduce the AC4 miss for nested list items. The trade-off is now documented at `FENCE_RE`, and the unterminated-fence finding is the tripwire.
- [x] [Review][Defer] Code spans that cross a line boundary are not recognised — LOW — `stripInlineCode` is per-line by design; documented scope limit.
- [x] [Review][Defer] A backslash-escaped backtick opens a span and can mask a real link — LOW.
- [x] [Review][Defer] `.markdown` files and symlinked `.md` files are not scanned — LOW — AC3 scopes the corpus to `.md`; zero of either ship today.

---

## Dev Notes

### The number to trust, and the two that are wrong

Measured against a real `npm pack` of `4.0.1` on 2026-08-31:

| Basis | Result | Why it differs |
|---|---|---|
| ADR-002's enumeration | 20 across 4 files | Undercounted; file set correct |
| Naive scan (no fence handling) | 29 across 6 files | Counts two fenced **examples** as findings |
| **Fence- and code-span-aware** | **27 across 4 files** | **Use this** |

The two prior figures are wrong in opposite directions and the whole discrepancy is fence handling.
That is why AC4 exists as an acceptance criterion rather than an implementation detail: a format
spec necessarily *shows* markdown, so a checker without fence handling will always accuse the
documents that document the format.

### Why this story does not wire the gate in

`fresh-install` gates every PR and every publish. Eighteen of the 27 findings belong to Class 1,
whose remedy is a `files[]` exclusion in Story 2.3a — so wiring here would block the repository
until three further stories land. NFR10 requires the gate **demonstrated** failing, not **merged**
failing.

### Cross-story dependencies

| Story | Relationship |
|---|---|
| `dist-2-3a` | Excludes Class 1 → removes 18 of 27 |
| `dist-2-3b` | Covenant move → removes 5, and is the first real test of AC5 (the Covenant is one of the ten self-referential paths) |
| `dist-2-3c` | Removes the last 4 and **wires this checker in, blocking** |
| `dist-2-4` | **Shipped.** Sibling class — it sees what arrives on disk; this sees documented references. `bmm-dependencies.csv` is referenced by no shipped markdown, so this checker cannot detect it and 2.4 must |

### References

- [ADR-002](../planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md) + **Amendment 1** (absolute URLs) and **Amendment 2** (the three settled rulings)
- `scripts/audit/try-fresh-install.sh` — the harness; see `dist-2-4` for how a check attaches without joining the verdict
- `scripts/docs-audit.js` `checkBrokenLinks` — skips `^https?://` (CR-README-D04)

---

## Commit Plan

```
feat(dist-2-2): assert every documented reference resolves inside the package
```

Body must record the derived finding count, the red-demonstration output, and that the checker is
deliberately outside the verdict with 2.3c named as the wiring story.

---

## Change Log

| Date | Change |
|---|---|
| 2026-08-31 | Story created. Count corrected to 27 (fence-aware) against ADR-002's 20 and a naive 29. AC4 and AC5 added — fence handling from measurement, absolute URLs from ADR-002 Amendment 1. |
| 2026-09-06 | Implemented. Count re-derived at implementation time per AC6: **28 across 5 files**, not 27 across 4 — the four files and their per-file counts match the story exactly; a fifth finding arrived 2026-09-05 in `154719e3`. Gate demonstrated red inside the harness with the harness still exiting 0. |
| 2026-09-06 | Round 1: 12 patched, 5 deferred; 2 HIGH. Committed as `c848c45d`. |
| 2026-09-06 | Round 2: 4 HIGH, 11 MEDIUM — **predominantly defects in Round 1's own corrections**, which fired `code-review-convergence`'s restructure clause. Four instruments changed rather than patched again: markdown ambition narrowed (blockquote handling reverted, operator ruling), URL handling rebuilt on `new URL()`, CLI findings now outrank cannot-run, evidence numbers emitted via `--json` instead of transcribed. 13 patched, 5 deferred. Count unchanged at 28/5. **Round 3 triggered** — Round 2 made structural changes. |
| 2026-09-06 | Round 3 (final): 6 HIGH, ~13 MEDIUM, ~8 LOW. Diagnosis: the AC5 half was over-built in Round 2 — shorthands, ports, multi-segment repos, none specified by AC5, each a way to return a confident wrong answer that passes the fail-closed guard. Instrument change was a **deletion**, narrowing to what AC5 specifies. Post-scan cannot-run made structurally unable to discard findings. All mutant identifiers purged from the record; matrix re-keyed on (edit → test). 11 patched, 8 deferred. Count unchanged at 28/5. **Round cap reached — no Round 4.** |
| 2026-09-06 | Shipped as `c848c45d` + `eceb47b6`; CI green on both. Status → `done` (operator, 2026-09-06). All 7 ACs met — AC4 partially, by ruling, recorded in its own section. 36 findings patched across three rounds, 18 deferred to the backlog with measurements. Round 3's remediation remains unreviewed by rule; the convergence cap is deliberate, and re-reviewing that delta belongs to whoever picks up 2.3c. |

---

## Dev Agent Record

### Agent Model Used

Amelia (Senior Software Engineer) — claude-opus-5[1m]

### Debug Log References

- Harness transcript (full run, packs + installs + all checks): reproduced with
  `bash scripts/audit/try-fresh-install.sh`
- Standalone: `node scripts/audit/assert-shipped-links.js <packageRoot> <repoRoot>`

### Completion Notes List

#### The derived count: 28 across 5 files, not 27 across 4 (AC6)

AC6 requires the count re-derived at implementation time and **never copied from the story**. It was.
The four files the story names are confirmed exactly, per-file count for per-file count:

```
13  scripts/migration/format-conversion/README.md           <- Class 1 (2.3a)
 5  scripts/migration/format-conversion/fixup-checklist.md  <- Class 1 (2.3a)
 5  _bmad/bme/README.md                                     <- Class 2 (2.3b)
 4  CHANGELOG.md                                            <- Class 3 (2.3c)
 1  _bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md   <- NEW
```

The fifth is new since the story was authored on 2026-08-31. `lifecycle-process-spec.md:133` names
`_bmad/bme/_config/name-registry.csv` as the **name authority** — "where the two disagree, the
registry wins" — and that file does not ship. It arrived 2026-09-05 in `154719e3`
(`feat(meta-model): seed the name registry, and rule on helm and forge`) — established with
`git log -1 --format='%H %ad' --date=short 154719e3` for the date and `git log -L 133,133:<file>`
to confirm that commit last wrote the line itself, not merely the file. Verified rather than assumed: the target resolves to
`_bmad/bme/_config/name-registry.csv`, which `fs.existsSync` finds in the repository and not in the
package, because `files[]` carries `_bmad/_config/skill-manifest.csv` — one named file, not the
`_bmad/bme/_config/` directory.

**This is a finding for Story 2.3c, and it should be read before 2.3c is picked up.** ADR-002
enumerates three classes and 2.3c is scoped to "remove the last 4 and wire the gate in, blocking".
The 28th belongs to none of the three classes, so on today's tree 2.3a + 2.3b + 2.3c would leave the
gate red at one finding and 2.3c would wire in a blocking gate that fails. Its remedy is a separate
decision — ship `_bmad/bme/_config/`, or repoint the link — and it is deliberately NOT taken here:
this story builds the gate and demonstrates it red; the remedies are 2.3a/2.3b/2.3c's.

The story's instruction not to reconcile to ADR-002's 20 was followed. Measured on this tree:

| Basis | Result |
|---|---|
| ADR-002's enumeration | 20 across 4 files (undercounted; file set correct) |
| Naive scan, no fence handling | **30 across 7 files** |
| Fence- and code-span-aware | **28 across 5 files** |

#### AC4 — partially satisfied, by operator ruling

**Stated first, because the rest of this section could be read as reporting full satisfaction.**
AC4 requires that fenced code blocks be skipped "so neither is reported". After Round 2 reverted
blockquote handling, a fence inside a **blockquote** is not skipped and links inside it ARE
reported. That is a knowing, ruled-on partial failure of AC4, taken because the alternative
produced two fail-opens (a fence opened in a quote swallowing real prose, and a quoted line
closing a real fence early). The limit is documented in the library header, pinned by a test, and
backlogged with 2.3c as its decision point. Everything below concerns the non-blockquoted case,
which AC4 is met on in full.

#### AC4 — the two extra findings are exactly the two documented examples

The naive-minus-aware delta was computed rather than asserted, and it is exactly the two lines AC4
names, with nothing else in the difference:

```
_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md:227
_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-04-generate.md:102
```

Both were opened and confirmed to be markdown **examples** inside fenced blocks.
`backlog-format-spec.md` opens its fence with **two leading spaces** (it sits inside a list item),
which is why `FENCE_RE` is not anchored at `^`. The damage from anchoring is not the one example it
lets through: the matcher never sees that fence OPEN, so it reads the CLOSING fence as an opening one
and inverts fence state for the whole remainder of the file.

#### AC5 — shown live, not merely silent

AC5's ten paths all resolve, so "zero self-referential findings" is also what a checker that skipped
them entirely would print. Both halves were therefore measured:

- The scanner **classifies 15 occurrences across exactly 10 unique paths** as self-referential —
  matching AC5's "10 unique self-referential paths shipping today" — and all 10 resolve, so this
  clause contributes **zero** findings to the red demonstration, as AC5 predicts.
- Re-run with `repoRoot` pointed at an empty directory, the same scan reports **43 findings, 15 of
  them self-referential**. The clause can fail.
- Non-`blob/` URLs on the same repository (`/issues`, `/security/advisories/new`) are correctly not
  validated — they are repository URLs, not file references.
- The prefix is derived from the shipped `package.json`'s `repository.url`
  (`scripts/audit/lib/shipped-links.js`, `selfRefPrefix`), never hardcoded and never read from a
  README. A test asserts that the SAME url under a different `repository.url` is treated as external.
  An unparsable url yields `null`, and the CLI exits 2 rather than silently skipping AC5 — an empty
  prefix would match every absolute URL.

#### AC1 — one artifact, no second pack, no second extract

`assert-shipped-links.js` reads `$TMP/proj/node_modules/convoke-agents` — the tarball the harness
packed at its first step and npm extracted at the install step. It neither packs nor extracts.
Relative links resolve inside the **package**; self-referential `blob/<ref>/` URLs resolve against
the **repository**, because such a URL names content on the default branch and `docs/` is in the
repository but not in `files[]`. Conflating the two roots would turn ten correct links into ten
findings; a test pins that distinction.

#### AC2 — demonstrated red, deliberately outside the verdict. **Story 2.3c is the wiring story.**

The full harness was run. It printed 28 `FAILED:` lines and `[shipped-links status 1]`, then reached
`PASS — a new user gets a working, self-consistent install.` and **exited 0**. That is the AC2
demonstration in the strongest available form: the gate is red and the harness verdict is untouched.

- The verdict condition is byte-identical to its prior text. Established from git, not by eye:
  `git diff cdd9cf88 -- scripts/audit/try-fresh-install.sh | grep -E '^[+-].*INSTALL. -eq 0'`
  returns nothing, so the line is in no hunk of this story's whole change. Its text is identical
  to the baseline's and only its line number moved, as lines were added above it. **No line
  number is quoted here**: an earlier draft wrote "(406 → 459)", which were the numbers for
  `cdd9cf88 → c848c45d` and not for the operation the sentence described, and they went stale
  again the next time the file grew. The grep is the evidence; the position is not. `$LINKS`
  appears nowhere in the condition, nor in the `FAIL` diagnostic line.
- `continue-on-error` appears nowhere in the file (count: 0).
- The one `exit "$ENV_FAIL"` added is a **cannot-run** path (exit ≠ 0 and ≠ 1), consistent with the
  nine existing sites and with AC2's final clause. Findings are exit 1 and are excluded from it.

#### AC7 — the scope limit, stated

Documented in the header of `scripts/audit/lib/shipped-links.js` and repeated here:

- It **cannot** detect a file that shipped code READS AT RUNTIME but that no markdown mentions. That
  class is Story 2.4's (`assert-installed-tree.js`, shipped). The two are siblings, not substitutes:
  this one sees documented references, that one sees arrivals. `bmm-dependencies.csv` is referenced
  by no shipped markdown, which is precisely why 2.4 had to exist.
- CR-README-D04 **narrows rather than closes**: external absolute URLs remain unvalidated by design.
  Only the self-referential subset is resolved.
- Anchor **targets** are not validated. `#fragment` is stripped before resolution; whether the
  heading exists is out of scope.
- Inline links only. Reference-style definitions (`[id]: path`) are not resolved — none ship today,
  and if one is added it is unchecked. Named as a known hole rather than left implicit.
- A target containing `)` is truncated at the first `)`, matching `scripts/docs-audit.js`.
- **Blockquoted constructs are not understood** — a link inside a blockquoted markdown example IS
  reported. This limit was created deliberately in Round 2 by reverting blockquote handling
  (operator ruling); it is stated in the library header and pinned by a test. An earlier version
  of this AC7 list omitted it, so the record claimed a cleaner scope than the code has.
- **HTML is not markdown**: a relative `<a href>` / `<img src>` is not checked, and a link inside
  an `<!-- HTML comment -->` is reported. Zero shipped files hit either.
- **Inline code spans are matched per line**, so a span wrapping a newline is not masked.
- **Root-relative `/paths` are skipped** — meaningless inside a tarball.
- **A multi-segment git ref yields a wrong path, not a skip**, and **only `owner/repo` is accepted
  as a repository identity** (a GitLab subgroup is refused rather than guessed).
- **Symlinks are handled inconsistently**: a symlinked `.md` is dropped from the corpus; a link
  into a symlinked directory is resolved and containment-checked; a `..` traversing a symlinked
  directory can still escape. Zero symlinks ship.

#### Verification, and how each check was shown able to fail

Per `verification-must-be-falsifiable`, every check cited here was observed producing the other answer.

| Check | Shown red by |
|---|---|
| The test suite (`node --test tests/audit/shipped-links.test.js` reports the count) | The mutation matrix below. Every edit is killed by a named test **except the containment-guard edit, which survives** — recorded as such in the matrix's last row |
| `npm run lint` | Went red on this very change — 2 `no-unused-vars` warnings in the new test file — then green after they were fixed |
| The gate itself | 28 findings on the real tarball, inside the real harness (exit 1) |
| AC5's clause | 15 self-referential findings against an empty `repoRoot` |
| Fence handling | Naive scan reports 30/7 where the aware scan reports 28/5 |

**Mutation matrix — change → the assertion that dies.**

**Keyed on the edit, not on an identifier.** Earlier drafts numbered the mutants and then cited
those numbers as evidence — the library cited one such number in a code comment, and the very
paragraph written to remove that citation introduced another. No such identifier was defined in
any artifact in the repository, and the mutation harness is a scratch script that is **not
committed**, so no reader could check any of them. Three rounds produced three versions of the
same defect, which is why the numbering is gone entirely rather than corrected again: each row below names the **edit to make** and the **test that goes red**, both
of which exist in the repository. Reproduce a row by making the edit and running
`node --test tests/audit/shipped-links.test.js`.

| Edit to `scripts/audit/lib/shipped-links.js` (or the CLI) | Test that dies |
|---|---|
| Anchor `FENCE_RE` at `^` (drop `\s*`) | *skips an INDENTED fence*; *resumes scanning after an indented fence closes* — and **not** the flush-fence test, which is why the two are separate cases |
| Make `stripInlineCode` return its argument | *skips a link inside a code span* + 2 unit cases |
| Resolve self-referential paths against `packageRoot` | *accepts a blob/main URL whose path exists in the repository*; *resolves against the REPOSITORY, not the package* |
| Drop the fence-character check when closing | *does not let a tilde run close a backtick fence* |
| Drop the fence-length check when closing | *does not let a shorter run close a longer fence* |
| Walk into nested `node_modules` | *does not descend into a nested node_modules* |
| Use a whole-link regex instead of the `](` tail | *scans BOTH targets of a badge-wrapped link* |
| Return `unterminatedFenceAt: 0` unconditionally | *fails CLOSED, not open, when a blockquoted fence unbalances the file* + 2 others |
| Fall back to `fs.existsSync` in the segment walk | *consults the directory listing rather than deferring to the filesystem*; *does not accept a case-only mismatch* |
| Use `rel.startsWith('..')` for containment | *accepts a shipped file whose name merely begins with dots* |
| Skip the `?query` strip in `parseTarget` | *strips a ?query before the path, keeping the fragment split* |
| Strip `#committish` after the shorthand match | *strips the #committish BEFORE matching a shorthand, not after* |
| Compare owner/repo case-sensitively | *matches owner and repo case-insensitively, but the PATH case-sensitively* |
| Remove the `realpathSync` containment check | *rejects a path that leaves the package through a SYMLINKED directory* |
| Let the scp branch claim `ssh://` URLs | *decomposes a repository url into host, owner and repo* |
| Let the post-scan guard bypass gathered findings | *emits gathered findings, not a bare exit 2, when the repository url is unparsable*; *prints a gathered finding rather than exiting 2* |
| Accept a bare `owner/repo` identity again | *returns null for junk that superficially looks like owner/repo* |
| Delete `if (segments[0] === '..') return false;` | **Survives — redundant** with the case-exact segment walk, which already rejects `..`. See the redundancy note below |
| Require no prefix on the npm shorthand (accept bare `owner/repo`) | **Survives — redundant** with the `HOSTS` lookup, which yields `undefined` without a known prefix. See the redundancy note below |
| Drop the exactly-two-segments bound on a URL path | **Survives — equivalent**: any longer path puts a `/` in `repo`, which the identity validator rejects. See the redundancy note below |

**On redundancy, and why three rows in this matrix "survive".** Deleting the containment guard, or
requiring the shorthand prefix, or bounding the URL path to exactly two segments — each of these,
removed ALONE, turns no test red. That is not three coverage holes; those edits are *equivalent
mutants*, because the identity validator and the structural branches each independently reject the
same junk. Proven rather than asserted: a COMBINED mutant that removes the whole layered defence at
once makes `repositoryIdentity('../owner-repo')` yield `https://github.com/../owner-repo/` — the
exact Round 3 HIGH — and is killed by *returns null for junk that superficially looks like
owner/repo* and *accepts git:// and PREFIXED shorthands, and REJECTS the bare owner/repo form*.
So the property is guarded and the tests can fail; what no single line is, is solely load-bearing.
The distinction is recorded because the alternative — writing a test per redundant line so every
row shows a kill — would manufacture the appearance of coverage rather than the fact of it.

Two lessons kept because they cost a round each. **A test asserting "no finding" cannot prove a
validator looked at anything** — a *skip* produces that observation equally well, which is why
folding owner/repo case-sensitively once survived the whole suite; the self-referential cases now
use MISSING targets so that a finding must appear. And **when a matrix row disagrees with
expectation, suspect the harness first**: three rows were once wrong because two patterns matched
zero lines and one edit was semantically equivalent to the original.

#### Package census (AC3), re-derived

`npm pack` of `4.0.1`, measured on the tree under review: **467 files, 334 of them `.md`**. The scan
classifies **99 resolvable references** (84 relative + 15 self-referential) and skips 30. The 30
are **22 external URLs, 4 anchor-only, and 4 self-repository non-file URLs** (`/issues/new/choose`,
`/security/advisories/new`) — an earlier draft wrote "external URLs, anchor-only, `mailto:`", and
there are **zero** `mailto:` links, while the self-repository non-file class, which is the one an
AC5 reviewer would want named, went unmentioned. All four counts are now emitted by `--json`
(`relativeCount`, `selfRefCount`, `uniqueSelfRefPaths`, `skippedCount`) rather than transcribed.

An earlier version of this paragraph said **465**, and Round 2 caught it: the tarball held 467, and
the difference was **exactly the two files this story adds** — `scripts/` ships, so the checker
ships with it. 465 was measured before the change and then presented as a census of the artifact
under review. That is the same defect Round 1 had just caught at `shipped-links.js:18`, committed
again inside the correction for it, which is precisely what
`verification-claims-must-name-their-evidence` warns happens when false claims get corrected.

The story recorded 461 on 2026-08-31; whether that was right then was **not** re-verified, and
nothing turns on it.

**Regenerate rather than trust this paragraph.** Every figure above comes from one command:

```
npm pack --pack-destination /tmp/p && mkdir -p /tmp/x && tar -xzf /tmp/p/*.tgz -C /tmp/x
find /tmp/x/package -type f | wc -l                 # total files
find /tmp/x/package -type f -name '*.md' | wc -l    # markdown files
node scripts/audit/assert-shipped-links.js /tmp/x/package "$PWD" --json
```

`--json` was added in Round 2 for exactly this reason: five of this record's false claims were
hand-maintained numbers that rotted the moment the thing they described moved.

#### Other notes

- **Full suite: 0 failures, 1 skip.** The skip is pre-existing and unrelated: running
  each directory separately puts it in `tests/unit` (`tests/audit` reports `skipped 0`), and the new
  suite contains no `skip`. `npm run lint`: 0.
- **`test-fixture-isolation`:** every case builds its own tmp tree under `os.tmpdir()`; nothing reads
  `PACKAGE_ROOT` as data.
- **Namespace decision:** `scripts/audit/`, alongside `assert-installed-tree.js` — repository audit
  tooling, not a `_bmad/bme/` skill, so the Covenant's operator-facing obligations do not attach. It
  is invoked by the harness, not by an operator.
- **`derive-counts-from-source`:** no count is hardcoded in the **checker** — the census, the finding
  count and the per-file breakdown are all computed at runtime. Tests do assert literal numbers
  (e.g. `scanned 2 markdown file(s)`), which is the permitted form: each is a property of a fixture
  the test itself creates in the same function, so the fixture guarantees the count. No test
  asserts a count against live repository state.

### File List

- `scripts/audit/lib/shipped-links.js` (new) — extraction, classification, resolution
- `scripts/audit/assert-shipped-links.js` (new) — CLI; exit 0 clean / 1 findings / 2 cannot-run
- `tests/audit/shipped-links.test.js` (new) — test count derived at read time: `node --test tests/audit/shipped-links.test.js`
- `scripts/audit/try-fresh-install.sh` (modified) — invocation only; verdict condition untouched
- `_bmad-output/implementation-artifacts/dist-2-2-assert-every-documented-reference-resolves-inside-the-package.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — `in-progress` → `review`
