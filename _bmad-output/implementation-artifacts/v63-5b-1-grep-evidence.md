---
initiative: convoke
artifact_type: evidence
qualifier: v63-5b-1-grep-evidence
created: '2026-04-27'
schema_version: 1
---

# Story 5B.1 — CHANGELOG Grep-Test Evidence (FR42 + FR43)

**Purpose.** Captures the two grep-tests run at Story 5B.1 dev-story Task 3 against the new v4.0 section of `CHANGELOG.md`. Per Decision 4 + AC4, both must return zero violations.

**Verdict:** **Zero violations: M16 grep-tests PASS** (FR42 cliché-list zero matches + FR43 internalOnly-vocabulary zero matches in the v4.0 section).

---

## Method

### Scope-narrowing helper (per OS-1 V-pass)

The grep tests are run against the v4.0 section ONLY (avoids false positives from older changelog entries). Section extraction:

```bash
sed -n '/^## \[4\.0\.0\]/,/^## \[3\.3\.0\]/p' CHANGELOG.md > /tmp/v4.0-changelog-section.md
```

Output: 33 lines (the v4.0 section + leading delimiter line up to but not including the `## [3.3.0]` header). **Note:** initial story-close run captured 34 lines; R1 code-review CR-H1 patch removed the "What's New" surfacing bullet (which repeated a v3.3.0 feature per Edge Hunter audit), bringing the section to 33 lines. Both pre-patch and post-patch grep runs return zero matches for FR42 + FR43 — R1 patches preserved the zero-violations property.

---

## FR42 — Cliché-list grep test (8 phrases per Sophia's announcement draft)

```bash
grep -nE '(Convoke 4\.0 is here|first-class community module|For the curious|opinionated downstream|content, not software|strategic bet on BMAD coupling|host_framework_sync|nothing flashy)' /tmp/v4.0-changelog-section.md
```

**Output:** *(empty — zero matches)*

**Exit code:** 1 (grep returns 1 when no matches found — this is the expected/required outcome per FR42).

**Verdict: PASS — zero cliché-list violations in the v4.0 section.**

Phrases tested:
1. "Convoke 4.0 is here" (generic product-launch opening)
2. "first-class community module" (unearned status inflation)
3. "For the curious" (lazy segue)
4. "opinionated downstream" (internal jargon)
5. "content, not software" (internal insight)
6. "strategic bet on BMAD coupling" (internal planning vocabulary)
7. "host_framework_sync" (internal release class label)
8. "nothing flashy" (mixed metaphor + brand-safety platitude — fragment match for the full "Convoke is a bit like a well-maintained tool: nothing flashy, just reliable" phrase from Sophia's draft)

---

## FR43 — `internalOnly` vocabulary grep test (per announcement draft regex)

```bash
grep -nE '(host_framework_sync|content, not software|strategic bet|first-class|opinionated downstream|first formal recognition|named reusable release class)' /tmp/v4.0-changelog-section.md
```

**Output:** *(empty — zero matches)*

**Exit code:** 1 (grep returns 1 when no matches found — this is the expected/required outcome per FR43).

**Verdict: PASS — zero `internalOnly` vocabulary violations in the v4.0 section.**

Terms tested (per announcement draft "Vocabulary rules enforced" + spec Decision 4 CM-1 V-pass dual-classification note):
1. `host_framework_sync` (internal release class label)
2. "content, not software" (internal insight)
3. "strategic bet" (internal planning vocabulary)
4. "first-class" (unearned status inflation)
5. "opinionated downstream" (internal framing — dual-classified as both cliché AND internalOnly per CM-1 V-pass)
6. "first formal recognition" (internal narrative)
7. "named reusable release class" (internal taxonomy)

**CM-1 V-pass dual-classification note:** `opinionated downstream` appears in BOTH the FR42 cliché regex AND the FR43 internalOnly regex. The announcement draft enumeration lists 6 internalOnly phrases but its grep regex covers 7 (adds `opinionated downstream`). This is intentional — `opinionated downstream` is both a cliché (Shark Tank framing per PR2-5) and an internalOnly phrase (PRD `framingAnnotations.internalOnly` family). Spec inherits Sophia's regex faithfully; both grep tests verify the v4.0 section against the union of vocabulary rules.

---

## M16 release criterion: PASS (grep-tests portion)

Per `success-criteria.md:63` (M16): "CHANGELOG contains `mostHonestOneLineSummary` verbatim + follows Sophia section order + zero cliché list violations + maintainer sign-off in release commit". The grep-tests above verify the cliché list + internalOnly vocabulary portions; the verbatim mostHonestOneLineSummary placement + Sophia section flow are verified by AC1 + AC2 of Story 5B.1 (Task 2 deliverable). The maintainer sign-off in release commit is **DEFERRED to Story 5B.3** per Decision 5 + AC5 (FR44 strict reading: "release commit message" = release ship time).

**M16 status at Story 5B.1 close:** PARTIAL (3 of 4 criteria met: mostHonestOneLineSummary verbatim ✓ + Sophia section flow ✓ + zero grep violations ✓). Remaining criterion (maintainer sign-off in release commit) closes at Story 5B.3.

**Hand-off marker:** `<!-- TODO-5B3-CHANGELOG-SIGNOFF -->` placed near top of `CHANGELOG.md`. Story 5B.3 author runs `grep -r "TODO-5B3"` across `docs/` + `CHANGELOG.md` to surface all 4 pending hand-off blocks (2 playbook sections + Winston playbook sign-off + maintainer CHANGELOG sign-off-in-commit).

---

## Re-verification at release ship time

Story 5B.3 author SHOULD re-run both grep tests against the final CHANGELOG (after operator fills in actual release date in `## [4.0.0] - YYYY-MM-DD` header) before tagging v4.0.0. If any future edits to the v4.0 section introduce a cliché or internalOnly phrase, the FR42 + FR43 grep tests catch it pre-tag.

Re-verification commands (verbatim from above):

```bash
sed -n '/^## \[4\.0\.0\]/,/^## \[3\.3\.0\]/p' CHANGELOG.md > /tmp/v4.0-changelog-section.md
grep -nE '(Convoke 4\.0 is here|first-class community module|For the curious|opinionated downstream|content, not software|strategic bet on BMAD coupling|host_framework_sync|nothing flashy)' /tmp/v4.0-changelog-section.md
grep -nE '(host_framework_sync|content, not software|strategic bet|first-class|opinionated downstream|first formal recognition|named reusable release class)' /tmp/v4.0-changelog-section.md
```

Both must return zero matches before release tag.

---

## Traceability

- **Story 5B.1 spec:** [`v63-5b-1-author-and-validate-changelog.md`](v63-5b-1-author-and-validate-changelog.md)
- **Sophia's announcement draft (canonical voice + cliché list + internalOnly regex):** [`../planning-artifacts/convoke-announcement-4.0-draft.md`](../planning-artifacts/convoke-announcement-4.0-draft.md)
- **CHANGELOG.md v4.0 section** (test target): repo-root `CHANGELOG.md` lines starting at `## [4.0.0]`
- **FR coverage:** FR41 (mostHonestOneLineSummary verbatim — verified by Task 2 not by grep), FR42 (cliché-list grep — this evidence file), FR43 (internalOnly grep — this evidence file), FR44 (maintainer sign-off — DEFERRED to Story 5B.3)
- **M coverage:** M16 PARTIAL at Story 5B.1 close (full closure at Story 5B.3 release ship)
