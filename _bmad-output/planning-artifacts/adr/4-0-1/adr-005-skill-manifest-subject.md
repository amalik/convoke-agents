---
initiative: convoke
artifact_type: adr
qualifier: 4-0-1-skill-manifest-subject
created: '2026-08-30'
status: superseded-in-part
schema_version: 1
related_initiative: 4.0.1 (distribution integrity) — Epic 2, releasing as 4.0.2
related_decision: 'Epic convoke-epic-4-0-1-distribution-integrity.md — ADR-5; gates Story 2.8, re-specifies FR15'
closes_if_accepted: 'NOTHING — the 2026-08-30 correction re-opens this ruling; Story 2.8 is blocked again'
---

# ADR-005: What `skill-manifest.csv` is a manifest *of*

**Status:** ⚠️ **SUPERSEDED IN PART — the ruling is RE-OPENED.** Accepted 2026-08-30 (Amalik) as
"the manifest describes an installed project"; **corrected the same day** when its central evidential
claim was found false. **Do not implement against the Recommendation or Consequences sections below.**
See [the correction](#correction-2026-08-30--the-evidence-was-measured-against-the-wrong-basis) at the
foot of this document, which is the operative text.
**Initiative:** Convoke 4.0.1 — distribution integrity, Epic 2 (releases as 4.0.2)
**Gates:** Story 2.8, which remains **blocked**. **FR15's re-specification is withdrawn.**

> **⚠️ Read the correction first.** The body below is preserved verbatim as the record of what was
> ruled and why, per this project's practice of striking rather than silently replacing. Two of its
> load-bearing claims are false: *"nothing was deleted"* and the implicit premise that
> `.claude/skills/` is a tree CI can resolve against. It is gitignored.

> **Namespace decision.** `_bmad/_config/skill-manifest.csv` is a Convoke-authored file in a
> Convoke-owned config directory — it is not upstream BMAD's. Filed under `adr/4-0-1/` alongside
> ADR-001-004 for continuity with the initiative that produced it.

---

## Context

Story 2.8 (FR15 / I134) exists to repair four `[BROKEN-DEP]` findings baselined in
`.github/expected-classification-findings.txt`. Its acceptance criterion offers two outcomes:
*"path corrected, or dependency dropped if the template is genuinely gone."*

**Measured 2026-08-30, the tree admits neither.** The story is unbuildable as specified, for the
same structural reason ADR-004 found in Story 2.6: the artifact and the assertion disagree about
what they are describing.

### The manifest's `path` column does not name this tree

| group | rows | resolve under `_bmad/` | resolve under `.claude/skills/<canonicalId>/SKILL.md` |
|---|---|---|---|
| `path` missing | 75 | 0 | **75** |
| `path` present | 31 | 31 | 23 |
| **total** | **106** | 31 | **106** |

**Every row resolves under `.claude/skills/`. Zero rows resolve nowhere.** The 75 divide
`bmm` 32 · `wds` 15 · `tea` 10 · `cis` 10 · `bmb` 5 · `core` 3 — and those five module directories
*do* exist under `_bmad/`; they simply contain **no `SKILL.md` files at all**. Only `_bmad/core`
(21) and `_bmad/bme` (14) vendor skills in this repository. `install_to_bmad` is `true` on all 106
rows in both groups, so that column does not discriminate either.

### The four findings are an artifact of the resolution root, not defects in the manifest

`validate-classification.js:248` derives `skillDir = path.dirname(path.join(projectRoot, skillPath))`
— the resolution root comes from the `path` column. Only **four rows in the entire manifest carry a
relative dependency**, and they split cleanly:

- **3 rows whose `path` does not exist** → produce **all four** findings
- **1 row whose `path` does exist** (`bmad-create-prd` → `_bmad/core/tasks/bmad-create-prd/SKILL.md`)
  → produces **none**

The correlation is total. The validator reports searching `_bmad/bmm/3-solutioning/…` and
`_bmad/wds/workflows/…` — directories that do not exist — so `resolveRelativeDep`'s subtree walk
(attempt 2, the one that recovers a stripped step-file context) has no tree to walk.

### All four templates exist

> ⚠️ **FALSE AS STATED — see the correction.** The four files exist *on a working copy carrying a
> full local install*. All four are **UNTRACKED** and sit under gitignored `.claude/skills/`. This
> section asked "does it exist?" and never "is it tracked?".

| skill | dependency | present at |
|---|---|---|
| `bmad-check-implementation-readiness` | `../templates/readiness-report-template.md` | `.claude/skills/bmad-check-implementation-readiness/templates/` ✓ |
| `bmad-create-epics-and-stories` | `../templates/epics-template.md` | `.claude/skills/bmad-create-epics-and-stories/templates/` ✓ |
| `wds-4-ux-design` | `../templates/page-specification.template.md` | `.claude/skills/wds-4-ux-design/templates/` ✓ |
| `wds-4-ux-design` | `./templates/diagnostic-report-template.md` | `.claude/skills/wds-4-ux-design/templates/` ✓ |

~~So the backlog row's hypothesis — *"consistent with upstream `a16fa340` deleting vendored content"* —
is **disconfirmed**. Nothing was deleted. The content is where a generated wrapper puts it.~~

> ⚠️ **THIS IS THE ADR'S CENTRAL ERROR.** The backlog row was **right**. `a16fa340` deleted **1,227
> files / 193,694 lines**, including **78 `_bmad/**/SKILL.md`**. See the correction at the foot.

### Why this needs an ADR rather than a judgement inside Story 2.8

The two readings produce work that differs by two orders of magnitude and lands in different files:
a **75-row rewrite of a file that ships on `latest`**, versus **one resolution root and four deleted
baseline lines**. That is not a detail a story author should settle silently, and FR15's own wording
("the broken skill dependencies … MUST be repaired") presumes the answer.

---

## Options

**(a) The manifest describes an installed project.** `path` is the destination path a skill occupies
after a BMAD install. This repository is the *source* of two of the seven modules and carries the
other five only as generated `.claude/skills/` wrappers, so 75 rows correctly name a path this tree
does not have. The classifier resolves against the tree where all 106 actually live.

**(b) The manifest describes this repository tree.** `path` is repo-relative source. 75 rows are
wrong and must be rewritten in a shipped file.

**(c) Split the column.** `path` (install destination) + `source_path` (repo-relative, populated only
for `core` and `bme`).

---

## Recommendation — (a), installed project

Three things carry it, none of them a preference:

1. **Only (a) explains the data without residue.** Under (b), 75 rows are wrong *and* the five
   affected modules vendor zero `SKILL.md` — so the "correct" paths (b) would write do not exist
   either, and never did in this repository. (b) cannot say what the repaired value should be.
2. **(a) predicts the finding distribution; (b) does not.** Under (a) the four findings are expected
   — three unresolvable roots, four relative deps between them. Under (b) it is a coincidence that
   every finding lands on a missing-path row and the sole resolvable-path row is clean.
3. **The templates exist.** A "repair" story whose repairs are all no-ops is measuring the wrong
   thing.

### The trade-off, stated rather than discovered

Resolving against `.claude/skills/` checks the **generated wrapper tree**, not source. For the 31
rows this repository vendors under `_bmad/`, that is a *slightly different subject* than today's
check: a dependency broken in source but correct in a stale wrapper would pass. The exposure is
bounded — 4 rows in the manifest carry relative deps at all, 1 of them in the vendored set — and it
is the price of having one resolution root that is correct for all 106 rows instead of one that is
correct for 31. **It is recorded here so it is not rediscovered as a defect.**

This ADR does **not** rule on whether the wrapper tree is the right long-term subject. `_bmad/bme/`
skills are Convoke's own and a source-rooted check for them is defensible later; that is a
successor question, and I159 / the name-registry strand is its natural home.

---

## Consequences if accepted

- **Story 2.8 is re-specified**: a classifier fix plus baseline cleanup, not a manifest repair. No
  shipped `.csv` row is edited, so the 4.0.2 tarball's manifest is byte-identical to 4.0.1's.
- **FR15's wording is wrong and must change** — "the broken skill dependencies … MUST be repaired"
  presumes defects that do not exist. Re-specified to the resolution root.
- **The four baseline lines are deleted** in the same commit that turns the classifier green, per
  Story 2.8's existing shrink-only rule. No line is added.
- **NFR10 still binds**: the fixed classifier must be observed *failing* on a genuinely broken
  dependency before it is trusted — otherwise this trades four false positives for zero coverage,
  which is strictly worse than the state it replaces.
- **Story 2.6 interacts.** Its AC moves four `skill-manifest.csv` rows when `_portability/skills/`
  is renamed to `workflows/`. Under this ruling those rows name install destinations, so the
  rename must be reflected in the *destination* path — verify against ADR-004's contract at
  implementation time, and re-run the classifier after.

## Consequences if rejected

- Story 2.8 becomes a 75-row rewrite of a file live on `latest`, with no source of truth for the
  replacement values, and the four findings it closes are still not defects.

---

## Evidence appendix

```bash
# Every row resolves under .claude/skills/; zero resolve nowhere
python3 -c "
import csv, os
rows=list(csv.DictReader(open('_bmad/_config/skill-manifest.csv')))
cs=lambda r: os.path.exists(f\".claude/skills/{r['canonicalId']}/SKILL.md\")
miss=[r for r in rows if not os.path.exists(r['path'])]
print(len(rows), len(miss), sum(1 for r in miss if cs(r)), sum(1 for r in rows if not cs(r)))"
# -> 106 75 75 0

# The five 'missing' modules exist but vendor no SKILL.md
for m in bmm cis tea wds bmb core bme; do
  echo "$m $(find _bmad/$m -name SKILL.md 2>/dev/null | wc -l)"; done
# -> bmm 0 / cis 0 / tea 0 / wds 0 / bmb 0 / core 21 / bme 14

# Only 4 rows carry a relative dep; 3 have a non-existent path and own all 4 findings
# bmad-create-prd is the sole resolvable-path row and produces none.

# The validator's own output names the directories it could not find
node scripts/portability/validate-classification.js
# -> FAIL: 106 skills checked, 4 errors (4 [BROKEN-DEP]), 29 warnings
# -> searched _bmad/bmm/3-solutioning/... and _bmad/wds/workflows/...  (neither exists)

# All four templates are present under the wrapper dirs
ls .claude/skills/bmad-check-implementation-readiness/templates/readiness-report-template.md \
   .claude/skills/bmad-create-epics-and-stories/templates/epics-template.md \
   .claude/skills/wds-4-ux-design/templates/page-specification.template.md \
   .claude/skills/wds-4-ux-design/templates/diagnostic-report-template.md
```

*The validator writes `_bmad-output/planning-artifacts/portability-validation-report.md`; that run
was reverted so this ADR introduces no working-tree change beyond itself.*

---

## Operator decision

**Accepted 2026-08-30 (Amalik): option (a). `skill-manifest.csv` describes an installed project.**

Story 2.8 is re-scoped to the classifier's resolution root plus baseline cleanup. No row of the
shipped manifest is edited under this ruling.

---

## Correction 2026-08-30 — the evidence was measured against the wrong basis

**This section supersedes the Recommendation, Consequences and Operator decision above.** It was
written hours after the ruling, when authoring Story 2.8 surfaced
`tests/lib/portability-fixture.js:11-19` — a committed file that already records what actually
happened, and contradicts this ADR.

### The two false claims

**(1) "The backlog row's hypothesis … is disconfirmed. Nothing was deleted."** False. `a16fa340`
deleted **1,227 files / 193,694 lines**, including **78 `_bmad/**/SKILL.md`**. The vendored upstream
skill trees were genuinely removed. The backlog row was right and this ADR overturned it on a
measurement that did not test the row's actual claim.

**(2) The implicit premise that `.claude/skills/` is a resolvable root.** It is **gitignored**
(`.gitignore:62` → `.claude/skills/*`), and **all four templates this ADR cited as "present on disk"
are UNTRACKED**. Tracked `SKILL.md` files number **75** — 37 in `tests/fixtures`, 21 in `_bmad/core`,
14 in `_bmad/bme`, **2 under `.claude/skills`**, 1 elsewhere.

### Why the error happened, precisely

The checks run for this ADR asked *"does the template exist?"* and *"does `.claude/skills/<id>/SKILL.md`
exist?"* — both answered against a **working copy carrying a full local install**. Neither asked
*"is it tracked?"*. Every measurement in the Evidence appendix is reproducible **on this machine and
nowhere else**. `project-context.md`'s `verification-basis` rule names this exact failure: verify
against the basis the claim is about. A claim about what a *repository* contains cannot be settled by
`os.path.exists`. See `[[feedback_verification_basis]]`.

### What this makes of the prescription

**Unsafe, and worse than the state it replaced.** Pointing the classifier at `.claude/skills/` makes
Test 1b's result a function of each developer's local install: green on a workstation with a full
install, red or vacuous in a clean CI checkout. That trades four stable false positives for a
non-deterministic gate.

### What is actually true

The `path` column is **repo-relative source, and was correct when authored**. `a16fa340` broke 75 rows
by deleting content the repository **deliberately no longer vendors** — and it is not coming back.
`portability-fixture.js:21-23` states the reason: *"Re-vendoring would have restored green and
re-armed the identical failure on the next upstream update. A committed fixture cannot be deleted by
an upstream commit, which is the whole point."*

So the four `[BROKEN-DEP]` findings are **accurate reports about the repository** — those dependencies
genuinely do not resolve in a clean checkout — but they are **not repairable**, because the content
will not return. That is why Story 2.8 was unbuildable. The original diagnosis had the symptom right
and the cause wrong; this ADR then had the cause wrong in the opposite direction.

### The question this ADR should have asked

Not *"what does the manifest describe?"* but **"what tree should Test 1b validate against?"** — and
the project has already answered it everywhere else. Tests 1a and 2-9 validate against the committed
fixture `tests/fixtures/portability-project/` (**31 rows, 31/31 resolving**). **Test 1b is the sole
outlier pointing at `REPO_ROOT`.** The fixture carries `bmad-create-prd` — the one row that passes in
the real repo — and **none of the three rows that produce findings**.

### The re-opened ruling — three options, none yet chosen

**(i) Scope Test 1b to rows whose `path` resolves.** The repository validates only what it actually
ships; the 75 upstream rows are not its to answer for. **Requires a floor guard** — a scoping rule
that can silently shrink to zero rows is a gate that passes by checking nothing, which is T32's shape.

**(ii) Extend the fixture to cover the four rows and validate their deps there.** Consistent with how
1a and 2-9 already work, and with the fixture's stated purpose. Costs committed fixture content.

**(iii) Keep the baseline; accept the four as permanent acknowledged entries.** Status quo, honest,
and closes I134 as *won't fix* rather than *fixed*. Cheapest; leaves a ratchet carrying four entries
that can never shrink.

**No recommendation is offered here.** The previous recommendation in this ADR was made on
measurements that were never checked against the repository, and re-deciding from the same seat
without that check having been fixed is how the first error propagated into a commit.

### Blast radius of the error

Governance text only — **no code, no test, no shipped file was changed** by the accepted ruling. What
must be corrected: this ADR (done), the epic's **FR15 re-specification** and **Story 2.8 ACs** (both
re-authored on the false cause), and the two memory files updated at the time. The commit that carried
it is `88f0534b`.
