---
initiative: convoke
artifact_type: report
qualifier: gyre-build-cost
created: '2026-09-06'
schema_version: 1
status: complete
related_initiative: 'Meta-model baseline (ratified 2026-08-15)'
related_decision: 'Victor gate — write down Gyre cost BEFORE Forge'
measured_by: claude
signoff_by: pending
---

# Gyre's Build Cost — the baseline's control measurement

**Recorded 2026-09-06, BEFORE any Forge work begins.** That ordering is the whole point.

The 2026-08-15 baseline memo carries one open gate:

> **Open gate (Victor's condition):** write down Gyre's build cost *before* starting Forge. If Forge
> doesn't cost materially less, the meta-model was theatre and the sequencing decision gets reopened.

This file is that number. It exists so the comparison cannot be settled after the fact by whichever
figures happen to flatter the conclusion.

---

## 1. What Gyre cost

### Module content — `_bmad/bme/_gyre/`

| | |
|---|---|
| Files | **54** |
| Markdown lines | **5,697** |
| Agents | 4 (Lens, Scout, Coach, Atlas) |
| Workflows | 7 |
| Commits touching the module | **65**, across **5 distinct days** |
| Span | 2026-03-21 → 2026-04-18 |

### Planning artifacts — `_bmad-output/planning-artifacts/gyre-*`

**9 files, 4,253 lines**, over 5 commits between 2026-03-24 and 2026-04-10:

| Artifact | Lines |
|---|---|
| `gyre-arch.md` | 831 |
| `gyre-epic.md` | 816 |
| `gyre-prd.md` | 787 |
| `gyre-research-domain-operational-readiness-2026-03-19.md` | 645 |
| `gyre-report-prd-validation.md` | 324 |
| `gyre-brief-2026-03-19.md` | 293 |
| `gyre-note-hc-forge-gyre-handoff.md` | 270 |
| `gyre-note-validation-report.md` | 207 |
| `gyre-sprint-change-proposal-2026-03-25.md` | 80 |

### Integration surface — the number that actually matters

**85 files outside `_bmad/bme/_gyre` reference Gyre.** This is the figure the meta-model exists to
reduce: module content scales with how much team you want, but integration cost is what makes adding a
team expensive.

| Area | Files |
|---|---|
| `tests/` | 36 |
| `docs/` | 13 |
| `scripts/migration/` | 7 |
| `scripts/update/` | 6 |
| `scripts/audit/` | 6 |
| `scripts/*.js` (top level) | 5 |
| `scripts/lib/` | 4 |
| `_bmad/_config/` | 4 |
| `.github/` | 2 |
| `scripts/portability/` | 1 |

**Including a bespoke installer.** `scripts/install-gyre-agents.js` is **151 lines of one-team-only
install logic**. A meta-model that works should make a second such file unnecessary; if Forge needs its
own `install-forge-agents.js`, that is the gate failing regardless of what the line counts say.

Ten of the 85 are Gyre-specific fixtures and documents that exist only because Gyre exists.

**Gross total: ~9,950 authored lines plus 85 integration points.**

---

## 2. The correction that stops this number from being misused

**Gyre is not finished, so this is the cost of an INCOMPLETE team.**

| Requirement | State |
|---|---|
| `module.yaml` | **MISSING** |
| `module-help.csv` | **MISSING** |
| Agents on v6.3 outcome markdown | **0 of 4** — all still v5 XML |
| Folder-per-agent layout | **0 of 4** — all flat `.md` |

Consequences, measured rather than asserted: Gyre **cannot be packaged or published**, cannot reach the
marketplace, and is reached today only by operators hand-wiring filesystem paths — the revealed demand
that reinstated **I98** at 2.4 on 2026-09-05.

**So the honest comparison is not "Forge total vs 9,950 + 85."** Forge built through the meta-model will
be a *complete* team. Gyre at 9,950 lines is a team missing two manifests, a directory restructure and
four agent conversions.

**Comparing a complete Forge against an incomplete Gyre would flatter the meta-model**, and the flattery
would be invisible unless it is written down now — which is precisely why Victor's gate demands the
before.

**Therefore the gate is evaluated as:**

> **Forge (complete) vs Gyre (9,950 lines + 85 integration points) PLUS the unpaid remainder — I98's
> repackaging, scored at 2.4 with E=6.**

If Forge lands anywhere near the Gyre figure without that adjustment, the meta-model has not been shown
to work; it has been shown to be measured generously.

---

## 3. What "materially less" should mean

Not ruled here — the memo does not define it, and defining it after seeing Forge's number would be the
same failure this file exists to prevent. Stating the candidates so the choice is made on the criterion
rather than on the outcome:

- **Integration points** — the strongest single indicator, because it is what a meta-model targets. Gyre:
  **85**. A meta-model that works should put Forge in the low tens, and should make a second bespoke
  installer unnecessary.
- **Authored lines** — weakest of the three. It scales with team ambition, not with build friction, and
  Forge's KORE scope is not Gyre's scope.
- **Distinct surfaces requiring a manual edit** — the cleanest proxy for "is a team cheap to add yet",
  and the one closest to the memo's stated aim: *"the path back to the ambition runs through making a
  team cheap to add."*

**Recommendation, offered before the data exists so it cannot be fitted to it:** judge the gate primarily
on **integration points and bespoke files**, secondarily on distinct manual surfaces, and treat authored
line count as context rather than evidence.

---

## 4. Reproducing these figures

```bash
# module content
find _bmad/bme/_gyre -type f | wc -l
find _bmad/bme/_gyre -name '*.md' -exec cat {} + | wc -l
git log --oneline -- _bmad/bme/_gyre | wc -l
git log --format='%ad' --date=short -- _bmad/bme/_gyre | sort -u | wc -l

# planning artifacts
cat _bmad-output/planning-artifacts/gyre*.md | wc -l

# integration surface
grep -ril 'gyre' scripts/ tests/ .github/ docs/ package.json index.js _bmad/_config/ | wc -l

# the unpaid remainder
ls _bmad/bme/_gyre/module.yaml _bmad/bme/_gyre/module-help.csv 2>&1
grep -rl '<agent id=' _bmad/bme/_gyre/agents/ | wc -l
```

**Known limits of this measurement.** Commit counts understate effort here: Gyre was authored largely in
single-file "Create X" commits, so 65 commits across 5 days measures editing rhythm, not labour. No
wall-clock or session-time record exists for the March–April build, and none was reconstructed rather
than invented. The integration count is a case-insensitive filename-and-content grep, so it includes
incidental mentions (a doc listing all teams) alongside real wiring; it is an upper bound on
*references* and a reasonable proxy for *coupling*, not an exact count of required edits.
