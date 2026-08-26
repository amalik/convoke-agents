---
initiative: convoke
artifact_type: report
qualifier: reference-graph-baseline
created: '2026-08-26'
status: active
schema_version: 1
related_adr: adr/knowledge-governance/adr-001-cleanup-scope.md
related_story: fast-reference-graph-baseline
baseline_commit: 028424c2
measured_in: clean clone (see Reproduction)
revision: 3
---

# Reference-Graph Baseline — 2026-08-26

**Purpose.** Capture the state of the corpus reference graph *before* any document is renamed or moved, so damage caused by a future rename is distinguishable from damage that already existed.

## Reproduction — read before using these numbers

**This baseline is measured in a clean clone, not a working tree.** The checker resolves references against the filesystem, so a developer tree resolves links that a fresh checkout cannot — installed skills, ignored directories, files outside the repository. Measuring in a dev tree produces a machine-local number that is useless for set-diff.

```sh
git clone --local --no-hardlinks <repo> /tmp/refbase && cd /tmp/refbase
git checkout 028424c2
node <repo>/scripts/audit/reference-integrity.js \
  --paths="_bmad-output,_bmad/bme,docs,$(ls *.md | paste -sd, -)"
```

`npm run refs:audit` runs the same scope **in the current tree** and is the right tool for a quick local check. It is **not** how this baseline was produced and its number will differ. The script requires the `package.json` entry that defines it; that entry is not yet committed (§0, defect 3).

---

## 0. Corrections — two review rounds

Revision 1 and revision 2 were each reviewed and each was found defective. Both failures share one root cause, and it is recorded rather than quietly repaired.

> **Shared root cause: the measurement environment was never pinned.**
> Revision 1 pinned nothing — it reused a root file list taken hours earlier (`derive-counts-from-source`).
> Revision 2 pinned *which files* by deriving the list at run time, but still measured **my working tree**.
> Revision 3 pins *whose filesystem* by measuring a clean clone at a named commit.
> Each round fixed the layer above the real defect. This is the restructure `code-review-convergence` calls for after a round corrects a round.

### Round 1 findings (revision 1 → 2)

| # | Defect | Effect |
|---|---|---|
| 1 | Root scope enumerated 7 files; the root holds 9. `CONTRIBUTING.md`, `SECURITY.md` omitted — both present at the stated commit. `SECURITY.md` ships; two in-scope root files do not. | Coverage understated by 16 refs; root falsification could not cover them. |
| 2 | The binding step-8 condition pointed at §5 (Known limitations) rather than §7 (the set), twice. | The one instruction the initiative depends on named the wrong section. |
| 3 | Reproduction impossible at the stated commit — `refs:audit` did not exist there. | Baseline unreproducible as documented. |
| 4 | "Counts derived by `find`" false for the root row. | A `derive-counts-from-source` violation inside a report citing the rule. |

### Round 2 findings (revision 2 → 3)

| # | Defect | Effect |
|---|---|---|
| 5 | **The count was machine-local.** A clean clone of the same commit with the same scope reports **673**, not 657. 16 references (13 unique pairs) resolve only on the authoring machine: **9 into gitignored `.claude/skills/**`**, **4 into `~/.claude/projects/…/memory/*.md` outside the repository**. | A CI or fresh-clone set-diff against §7 would have shown 16 phantom new breaks. **The defect this baseline exists to prevent, present in the baseline itself.** |
| 6 | `$(ls *.md)` derives from the working tree, so untracked root documents enter the comparison universe. | Set-diff was environment-dependent. Resolved by §Reproduction, not by reverting to an enumerated list. |
| 7 | Reproduction paragraph claimed `refs:audit` "lands in the same commit as revision 2"; commit `028424c2` carries only the two `.md` files. | Still true at revision 3 — see below. |
| 8 | §0 attributed the 2,695→2,712 delta to 16 refs; it is **17**. The 17th is the report's own self-inclusion, which also moved the `_bmad-output/` row 1,155/2,402 → 1,156/2,403. | Arithmetic understated by one; an uncredited row change. |

**Defect 3/7 is not yet fixed and is not fixable from inside this document.** The `package.json` entry defining `refs:audit` has been omitted from two consecutive commits (`2fc98395`, `028424c2`). Until it lands, no commit in history can reproduce the command. The file is tracked, unignored, and carries no `assume-unchanged` flag — it is simply not being staged.

**What survived all corrections:** both shipped surfaces are clean at every revision, class A remains just over half, and neither abort-condition verdict changed.

---

## 1. Verdict — read this first

**Abort condition 2 (link baseline bad → stop at "new documents only"): DID NOT FIRE — conditionally.**

**673 broken references of 2,712 checked (24.8%)** — severe on its face. It does not block the initiative, for three reasons, each a condition on how the work proceeds:

1. **The operator-facing surfaces are clean.** `_bmad/bme/` (the shipped tree) reports **0 broken of 39**. The repository root reports **0 broken of 88**. All damage is interior to the artifact corpus.
2. **Just over half is not damage.** 338 of 673 (50.2%) point at files that **exist** — written repo-root-relative from documents that do not sit at the repository root. Nothing missing; the link convention is wrong.
3. **The baseline is a diffable set, not a number.** **§7** lists every broken reference, measured in a clean clone. Compare against that set, never against zero — and never against a dev-tree run.

**Abort condition 3 (instrument cannot see both trees): DID NOT FIRE.** All four trees reachable in both directions — §3.

**Abort condition 1 (redundancy low → stop at staleness): NOT EVALUABLE.** Redundancy is a content question; this measured structure only. Open.

> **The binding condition.** This checker **cannot return 0 on this corpus**, so it must never be a binary CI gate. It is a **baseline-diff instrument**: compare against **§7**, from a clean checkout. A green-or-red wiring would block every build or force mass edits nobody authorised.

---

## 2. Coverage

Measured in a clean clone at `028424c2`.

| Tree | `.md` files | Refs checked | Broken | Exit |
|---|---:|---:|---:|---:|
| `_bmad-output/` | 1,156 | 2,403 | 628 | 1 |
| `_bmad/bme/` (**ships**) | 318 | 39 | **0** | 0 |
| `docs/` | 17 | 182 | 45 | 1 |
| Repository root | 9 | 88 | **0** | 0 |
| **Corpus** | **1,500** | **2,712** | **673** | 1 |

Per-tree refs sum to 2,712 and broken to **673** — both match the corpus run. Counts derived by `find` / `ls` in the clean clone, in the same session as the run.

### 2.1 A scope trap found before running

`COVERAGE_SCOPES` ([`reference-integrity.js:67`](../../scripts/audit/reference-integrity.js#L67)) — the default "full project scan" — resolves to five globs only:

```
tests/**/*.md
.claude/skills/bmad-agent-bme-*/SKILL.md
_bmad-output/implementation-artifacts/*-retro-*.md
_bmad-output/planning-artifacts/convoke-report-*-audit-*.md
_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md
```

An I97 citation checker for retros and audit reports — **not** a corpus link checker. `docs/`, `_bmad/bme/`, the repository root and most of both artifact directories fall outside it; a bare invocation prints `PASS` and means very little. The scope is therefore passed explicitly. **No source file was modified.**

---

## 3. Falsification evidence (AC2)

A clean result is worthless until the checker has been seen to fail. This instrument's own history records patch **P6**, where a glob matched nothing and produced a silent pass.

| Tree | RED (planted break reported, exit 1) | GREEN (token gone after removal) |
|---|---|---|
| `_bmad-output/` | ✓ | ✓ |
| `_bmad/bme/` | ✓ | ✓ |
| `docs/` | ✓ | ✓ |
| Repository root (derived scope) | ✓ | ✓ |

The root row plants a **new root `.md` present in no list** and confirms the derived glob discovers it — proving the scope self-updates, which an enumerated list cannot demonstrate. Coverage of `CONTRIBUTING.md` and `SECURITY.md` was asserted in the same run.

> **Harness note.** The first run of this demonstration reported a false negative on `_bmad-output/`. Cause: `printf … | grep -q` — `grep -q` exits on first match, `printf` dies with `EPIPE`, `pipefail` propagated the harness's failure as the checker's. `verification-pipefail`, inside the falsification harness itself. Rewritten pipe-free. Recorded because it looked exactly like a real finding.

---

## 4. Classification of the 673 broken references

Every broken target re-tested for existence **relative to the clean clone's root**.

| Class | Count | Share | Meaning |
|---|---:|---:|---|
| **A — root-relative authoring** | 338 | 50.2% | Target exists. Link written as if the document sat at the repo root. Mechanically fixable. |
| **B — target absent** | 335 | 49.8% | Target does not exist. Genuine dead reference. |

Of class B, **259 point at `.md` documents**; 76 at non-markdown targets. Only those 259 interact with a rename.

**Adversarial checks** (a misclassification here would move the §1 verdict):

- **0 of 338** class-A links begin with `../`, `./` or `/` — all plain root-relative, so root-resolution is plausible author intent, not coincidence.
- **4 of 338** class-A targets resolve to a directory rather than a file.
- The 16 machine-local references that inflated revisions 1–2 are class **B** here, correctly, because a clean clone cannot resolve them.

### 4.1 Class B by source area

| Area | Class-B refs |
|---|---:|
| `_bmad-output/implementation-artifacts` | 142 |
| `_bmad-output/_archive` | 139 |
| `_bmad-output/planning-artifacts` | 43 |
| `_bmad-output/vortex-artifacts` | 8 |
| `_bmad-output/test-artifacts` | 3 |

`_bmad-output/_archive/` holds 139 of 335 — historical documents whose targets legitimately no longer exist. They should not be repaired, and **any future gate must exclude `_archive/`**.

`docs/` and `drafts/` contribute **zero** class-B references; every break there is class A.

### 4.2 Concentration

| Source | Class-B refs |
|---|---:|
| `_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md` | 34 |
| `_bmad-output/_archive/exploratory/readme.md` | 27 |
| `_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md` | 20 |
| `_bmad-output/_archive/exploratory/readme-conflict-resolution.md` | 18 |
| `_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md` | 13 |
| `_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md` | 12 |
| `_bmad-output/_archive/exploratory/architectural-decision-record.md` | 11 |
| `_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md` | 11 |
| `_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md` | 10 |
| `_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md` | 9 |

All 45 `docs/` breaks originate in one file, `docs/codebase-audit-2026-06-27.md`, and all 45 are class A. The other 16 files in `docs/` are clean.

---

## 5. Known limitations

1. **The result depends on the filesystem it runs against, not on the repository.** A dev tree resolves ignored and out-of-repo paths that a fresh checkout cannot — the defect that produced revisions 1 and 2. Any comparison against §7 must be made from a clean checkout.
2. **It validates a checkout, not a shipped package.** `_bmad/bme/` passes while I157 remains true — `_bmad/bme/README.md` links to files absent from `package.json` `files[]`. Structurally incapable of detecting the repo-versus-tarball class; a tarball-scoped gate is a separate instrument.
3. **Committed documents cite gitignored paths.** The 9 references into `.claude/skills/**` are links no collaborator can follow. Separate from the rename question, and worth its own row.
4. **Root scope covers `.md` at depth 0 only.** A new root file with another extension, or a new top-level directory, still requires editing the scope.
5. **Anchors are not validated.** `_validateRef` strips `#fragment`; `file.md#L99` passes whenever `file.md` exists.
6. **`_archive/` is included here** but should be excluded from any future gate (§4.1).
7. **The report sits inside its own corpus.** Its links are checked by the run it documents; the §7 appendix is fenced, and `_stripCodeRegions` blanks it, so it does not contaminate the count.

---

## 6. What this unblocks

- Step 8 (renaming existing documents) may proceed **provided** verification is a set-diff against **§7**, taken from a clean checkout, never a comparison to zero.
- A future gate is a **diff instrument**, not pass/fail, and excludes `_archive/`.
- Class A (338 refs) is a candidate mechanical fix independent of the cleanup: rewriting root-relative links removes 50% of the noise.

---

## 7. Appendix — the baseline set

Every broken reference in a clean clone at `028424c2`. **This is the comparison set** referenced by §1 and §6.

### 7.1 Class B — target absent (335)

```
_bmad-output/_archive/exploratory/align-command-prototype.md → ./baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/align-command-prototype.md → ./product-brief-Convoke-2026-02-01.md
_bmad-output/_archive/exploratory/alignment-summary.md → ../planning-artifacts/architectural-decision-record.md
_bmad-output/_archive/exploratory/alignment-summary.md → ../planning-artifacts/architectural-decision-record.md
_bmad-output/_archive/exploratory/alignment-summary.md → ../planning-artifacts/baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/alignment-summary.md → ../planning-artifacts/integration-roadmap.md
_bmad-output/_archive/exploratory/alignment-summary.md → ../planning-artifacts/technical-deep-dive-analysis.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/brainstorming/alignment-summary.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/brainstorming/architectural-decision-framework.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/brainstorming/brainstorming-session-2026-02-05.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/brainstorming/llm-agnostic-architecture.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/brainstorming/orchestration-patterns-catalog.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/planning-artifacts/architectural-comparison-quint-vs-bmad-first.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/planning-artifacts/baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/planning-artifacts/greenfield-architecture-analysis.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/planning-artifacts/integration-roadmap.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/planning-artifacts/product-brief-Convoke-2026-02-01.md
_bmad-output/_archive/exploratory/architectural-decision-record.md → _bmad-output/planning-artifacts/technical-deep-dive-analysis.md
_bmad-output/_archive/exploratory/critical-framework-correction.md → _bmad/bme/_designos/agents/empathy-mapper.md
_bmad-output/_archive/exploratory/critical-framework-correction.md → _bmad/bme/_designos/agents/empathy-mapper.md
_bmad-output/_archive/exploratory/critical-framework-correction.md → _bmad/bmm/agents/analyst.md
_bmad-output/_archive/exploratory/critical-framework-correction.md → _bmad/bmm/agents/pm.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_config/module.yaml
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/agents/empathy-mapper.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/config.yaml
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/empathy-map.template.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/steps/step-01-define-user.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/steps/step-02-says-thinks.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/steps/step-03-does-feels.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/steps/step-04-pain-points.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/steps/step-05-gains.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/steps/step-06-synthesize.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/validate.md
_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md → _bmad/bme/_designos/workflows/empathy-map/workflow.md
_bmad-output/_archive/exploratory/emma-testing-guide.md → _bmad/bme/_designos/agents/empathy-mapper.md
_bmad-output/_archive/exploratory/emma-testing-guide.md → _bmad/bme/_designos/config.yaml
_bmad-output/_archive/exploratory/executive-summary-presentation.md → ./baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/executive-summary-presentation.md → ./product-brief-Convoke-2026-02-01.md
_bmad-output/_archive/exploratory/generic-agent-integration-framework.md → _bmad/bme/_designos/agents/empathy-mapper.md
_bmad-output/_archive/exploratory/generic-agent-integration-framework.md → _bmad/bme/_designos/agents/empathy-mapper.md
_bmad-output/_archive/exploratory/generic-agent-integration-framework.md → _bmad/bme/_designos/workflows/empathy-map/
_bmad-output/_archive/exploratory/generic-agent-integration-framework.md → _bmad/bme/_designos/workflows/empathy-map/
_bmad-output/_archive/exploratory/generic-agent-integration-framework.md → _bmad/bme/_designos/workflows/wireframe/
_bmad-output/_archive/exploratory/git-commit-summary.md → ../README.md
_bmad-output/_archive/exploratory/git-commit-summary.md → design-artifacts/EMMA-USER-GUIDE.md
_bmad-output/_archive/exploratory/git-commit-summary.md → planning-artifacts/ORIGINAL-VISION-README.md
_bmad-output/_archive/exploratory/git-commit-summary.md → test-artifacts/emma-tests/emma-p0-test-results.md
_bmad-output/_archive/exploratory/integration-roadmap.md → ./baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/integration-roadmap.md → ./product-brief-Convoke-2026-02-01.md
_bmad-output/_archive/exploratory/llm-agnostic-architecture.md → ../planning-artifacts/architectural-decision-record.md
_bmad-output/_archive/exploratory/llm-agnostic-architecture.md → ../planning-artifacts/architectural-decision-record.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./brainstorming/alignment-summary.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/architectural-decision-record.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/framework-deep-dive-analysis.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/framework-deep-dive-analysis.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/framework-deep-dive-analysis.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/integration-roadmap.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/pivot-summary-2026-02-07.md → ./planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → ../README.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → ../README.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → design-artifacts/EMMA-USER-GUIDE.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/4-framework-comparison-matrix.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/ORIGINAL-VISION-README.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/ORIGINAL-VISION-README.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/architectural-decision-record.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/architectural-decision-record.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/framework-deep-dive-analysis.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/integration-roadmap.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/integration-roadmap.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/technical-deep-dive-analysis.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → planning-artifacts/technical-deep-dive-analysis.md
_bmad-output/_archive/exploratory/readme-conflict-resolution.md → test-artifacts/emma-tests/emma-p0-test-results.md
_bmad-output/_archive/exploratory/readme.md → ../README.md
_bmad-output/_archive/exploratory/readme.md → ../_bmad/bme/_designos/workflows/empathy-map/
_bmad-output/_archive/exploratory/readme.md → ./brainstorming/alignment-summary.md
_bmad-output/_archive/exploratory/readme.md → ./brainstorming/architectural-decision-framework.md
_bmad-output/_archive/exploratory/readme.md → ./brainstorming/brainstorming-session-2026-02-05.md
_bmad-output/_archive/exploratory/readme.md → ./brainstorming/brainstorming-session-2026-02-05.md
_bmad-output/_archive/exploratory/readme.md → ./brainstorming/llm-agnostic-architecture.md
_bmad-output/_archive/exploratory/readme.md → ./brainstorming/orchestration-patterns-catalog.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/4-framework-comparison-matrix.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/4-framework-comparison-matrix.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/ORIGINAL-VISION-README.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/align-command-prototype.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/architectural-comparison-quint-vs-bmad-first.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/architectural-decision-record.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/baseartifact-contract-spec.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/executive-summary-presentation.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/framework-deep-dive-analysis.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/greenfield-architecture-analysis.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/integration-roadmap.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/phase-0-alternative-agent-integration.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/phase-0-workflow-map.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/product-brief-Convoke-2026-02-01.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/technical-deep-dive-analysis.md
_bmad-output/_archive/exploratory/readme.md → ./planning-artifacts/technical-deep-dive-analysis.md
_bmad-output/_archive/exploratory/roadmap-update-complete.md → ./planning-artifacts/phase-0-implementation-guide.md
_bmad-output/_archive/exploratory/wade-completion-status.md → design-artifacts/WADE-USER-GUIDE.md
_bmad-output/_archive/exploratory/wade-completion-status.md → test-artifacts/wade-tests/test-fixtures.md
_bmad-output/_archive/phase-1/emma-agent-verification-test-design.md → _bmad-output/CRITICAL-FRAMEWORK-CORRECTION.md
_bmad-output/_archive/phase-1/emma-agent-verification-test-design.md → _bmad-output/EMMA-REFERENCE-IMPLEMENTATION-COMPLETE.md
_bmad-output/_archive/phase-1/emma-agent-verification-test-design.md → _bmad-output/EMMA-TESTING-GUIDE.md
_bmad-output/_archive/phase-1/emma-agent-verification-test-design.md → _bmad-output/EMMA-TESTING-GUIDE.md
_bmad-output/_archive/phase-1/emma-agent-verification-test-design.md → _bmad-output/EMMA-TESTING-GUIDE.md
_bmad-output/_archive/phase-1/emma-agent-verification-test-design.md → _bmad-output/GENERIC-AGENT-INTEGRATION-FRAMEWORK.md
_bmad-output/_archive/phase-1/emma-agent-verification-test-design.md → _bmad-output/GENERIC-AGENT-INTEGRATION-FRAMEWORK.md
_bmad-output/_archive/phase-1/emma-agent-verification-test-design.md → _bmad/bme/_designos/agents/empathy-mapper.md
_bmad-output/_archive/phase-2/README.md → ../../WADE-DEVELOPMENT-PLAN.md
_bmad-output/_archive/phase-2/README.md → ../../design-artifacts/WADE-USER-GUIDE.md
_bmad-output/_archive/phase-2/README.md → ../../design-artifacts/WADE-USER-GUIDE.md
_bmad-output/_archive/phase-2/WADE-FINAL-SUMMARY.md → ../../../_bmad/bme/_designos/agents/wireframe-designer.md
_bmad-output/_archive/phase-2/WADE-FINAL-SUMMARY.md → ../../../_bmad/bme/_designos/workflows/wireframe/wireframe.template.md
_bmad-output/_archive/phase-2/WADE-FINAL-SUMMARY.md → ../../../_bmad/bme/_designos/workflows/wireframe/workflow.md
_bmad-output/_archive/phase-2/WADE-FINAL-SUMMARY.md → ../../PROJECT-STATUS-UPDATE.md
_bmad-output/_archive/phase-2/WADE-FINAL-SUMMARY.md → ../../WADE-DEVELOPMENT-PLAN.md
_bmad-output/_archive/phase-2/WADE-FINAL-SUMMARY.md → ../../design-artifacts/WADE-USER-GUIDE.md
_bmad-output/_archive/phase-2/WADE-FINAL-SUMMARY.md → ../../design-artifacts/WADE-USER-GUIDE.md
_bmad-output/_archive/phase-2/p2-5-5-structured-user-feedback-mechanism.md → link
_bmad-output/_archive/phase-2/product-brief-BMAD-Enhanced-2026-02-01.md → ./baseartifact-contract-spec.md
_bmad-output/_archive/phase-2/wade-live-test-results.md → ../../../_bmad/bme/_designos/agents/wireframe-designer.md
_bmad-output/_archive/phase-2/wade-live-test-results.md → ../../WADE-DEVELOPMENT-PLAN.md
_bmad-output/_archive/phase-2/wade-live-test-results.md → ../../design-artifacts/WADE-USER-GUIDE.md
_bmad-output/_archive/releases/NPX-INSTALLATION-UPDATE.md → BMAD-METHOD-COMPATIBILITY.md
_bmad-output/_archive/releases/NPX-INSTALLATION-UPDATE.md → scripts/install-emma.js
_bmad-output/_archive/releases/NPX-INSTALLATION-UPDATE.md → scripts/install-wade.js
_bmad-output/_archive/releases/PUBLISHING-COMPLETE.md → CREATE-RELEASE-GUIDE.md
_bmad-output/_archive/releases/RELEASE-NOTES-v1.0.2-alpha.md → _bmad-output/design-artifacts/EMMA-USER-GUIDE.md
_bmad-output/_archive/releases/RELEASE-NOTES-v1.0.2-alpha.md → _bmad-output/design-artifacts/WADE-USER-GUIDE.md
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → .claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → _bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → _bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → _bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → _bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → _bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → _bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → .claude/skills/bmad-portfolio-status/workflow.md
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → _bmad/bmm/2-plan-workflows/bmad-create-prd/
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → _bmad/bmm/3-solutioning/bmad-create-epics-and-stories/
_bmad-output/implementation-artifacts/ag-6-5-portfolio-skill-wrapper.md → .claude/skills/bmad-portfolio-status/workflow.md
_bmad-output/implementation-artifacts/ag-6-5-portfolio-skill-wrapper.md → _bmad/bmm/3-solutioning/bmad-create-epics-and-stories/
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad-output/planning-artifacts/epic-7-platform-debt.md
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad-output/planning-artifacts/initiatives-backlog.md
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad-output/planning-artifacts/epic-7-platform-debt.md
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad-output/planning-artifacts/initiatives-backlog.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → ../planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/planning-artifacts/epic-7-platform-debt.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/planning-artifacts/epic-7-platform-debt.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/planning-artifacts/initiatives-backlog.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/planning-artifacts/initiatives-backlog.md
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/planning-artifacts/epic-7-platform-debt.md
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/planning-artifacts/epic-7-platform-debt.md
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/planning-artifacts/initiatives-backlog.md
_bmad-output/implementation-artifacts/ci-hygiene-1-1-pipefail-and-lint-gate-fidelity.md → convoke-note-initiative-lifecycle-backlog.md
_bmad-output/implementation-artifacts/ci-hygiene-1-1-pipefail-and-lint-gate-fidelity.md → convoke-note-initiative-lifecycle-backlog.md
_bmad-output/implementation-artifacts/i97-1-1-migration-tooling-foundation-scaffolded.md → ../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_marketplace_structural_adoption.md
_bmad-output/implementation-artifacts/i97-1-1-migration-tooling-foundation-scaffolded.md → ../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_marketplace_structural_adoption.md
_bmad-output/implementation-artifacts/i97-1-1-migration-tooling-foundation-scaffolded.md → ../../.claude/skills/bmad-agent-pm/SKILL.md
_bmad-output/implementation-artifacts/i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md → ../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_marketplace_structural_adoption.md
_bmad-output/implementation-artifacts/i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md → ../../.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md
_bmad-output/implementation-artifacts/i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md → ../../.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md
_bmad-output/implementation-artifacts/i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md → ../../.claude/skills/bmad-agent-pm/SKILL.md
_bmad-output/implementation-artifacts/i97-2-2-convert-wade-lean-experiments-specialist.md → ../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_i97_story_2_1_calibration.md
_bmad-output/implementation-artifacts/i97-2-3-convert-mila-research-convergence-specialist.md → ../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_i97_story_2_1_calibration.md
_bmad-output/implementation-artifacts/i97-bug-1-fix-p0-activation-defects.md → ../planning-artifacts/spike-marketplace-packaging-delta.md
_bmad-output/implementation-artifacts/lint-1-1-fix-ci-lint-and-add-dod-gate.md → ../../.claude/skills/bmad-dev-story/checklist.md
_bmad-output/implementation-artifacts/lint-1-1-fix-ci-lint-and-add-dod-gate.md → ../../.claude/skills/bmad-dev-story/checklist.md
_bmad-output/implementation-artifacts/lint-1-1-fix-ci-lint-and-add-dod-gate.md → ../../.claude/skills/bmad-dev-story/checklist.md#L47
_bmad-output/implementation-artifacts/lint-1-1-fix-ci-lint-and-add-dod-gate.md → ../../.claude/skills/bmad-dev-story/checklist.md#L47
_bmad-output/implementation-artifacts/lint-1-1-fix-ci-lint-and-add-dod-gate.md → ../../_bmad/bmm/4-implementation/bmad-dev-story/checklist.md
_bmad-output/implementation-artifacts/oc-1-1-covenant-audit.md → ~/.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_operator_covenant.md
_bmad-output/implementation-artifacts/oc-1-5-adoption-surface.md → path/to/convoke-covenant-operator.md
_bmad-output/implementation-artifacts/oc-gyre-covenant-audit-a39.md → ../planning-artifacts/convoke-note-operator-covenant-compliance-checklist.md
_bmad-output/implementation-artifacts/sp-1-1-define-portability-schema.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-1-1-define-portability-schema.md → ../planning-artifacts/epics-skill-portability.md#story-11-define-portability-schema
_bmad-output/implementation-artifacts/sp-1-1-define-portability-schema.md → ../planning-artifacts/vision-skill-portability.md
_bmad-output/implementation-artifacts/sp-1-1-define-portability-schema.md → ../planning-artifacts/vision-skill-portability.md
_bmad-output/implementation-artifacts/sp-1-2-classify-all-skills.md → ../planning-artifacts/epics-skill-portability.md#story-12-classify-all-skills
_bmad-output/implementation-artifacts/sp-1-2-classify-all-skills.md → ../planning-artifacts/vision-skill-portability.md
_bmad-output/implementation-artifacts/sp-1-3-validate-classification-completeness.md → ../planning-artifacts/epics-skill-portability.md#story-13-validate-classification-completeness
_bmad-output/implementation-artifacts/sp-1-3-validate-classification-completeness.md → ../planning-artifacts/vision-skill-portability.md
_bmad-output/implementation-artifacts/sp-2-1-canonical-format-specification.md → ../planning-artifacts/epics-skill-portability.md#story-21-canonical-format-specification
_bmad-output/implementation-artifacts/sp-2-1-canonical-format-specification.md → ../planning-artifacts/vision-skill-portability.md
_bmad-output/implementation-artifacts/sp-2-2-export-engine.md → ../planning-artifacts/epics-skill-portability.md#story-22-export-engine
_bmad-output/implementation-artifacts/sp-2-2-export-engine.md → ../planning-artifacts/vision-skill-portability.md
_bmad-output/implementation-artifacts/sp-2-3-cli-entry-point.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-2-4-export-all-tier-1-skills.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-3-1-decision-tree-catalog-generator.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-3-1-decision-tree-catalog-generator.md → ../planning-artifacts/vision-skill-portability.md
_bmad-output/implementation-artifacts/sp-3-2-per-skill-readme-generation.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-4-1-create-and-seed-repository.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-4-1-create-and-seed-repository.md → ../planning-artifacts/vision-skill-portability.md
_bmad-output/implementation-artifacts/sp-4-2-end-to-end-validation.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-5-1-template-inlining-for-tier-2-export.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-5-2-platform-adapter-generation.md → ../../.claude/skills/bmad-brainstorming/SKILL.md
_bmad-output/implementation-artifacts/sp-5-2-platform-adapter-generation.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-5-3-export-tier-2-skills-and-update-catalog.md → ../planning-artifacts/epics-skill-portability.md
_bmad-output/implementation-artifacts/sp-6-1-export-skill-wrapper.md → ../../.claude/skills/bmad-migrate-artifacts/
_bmad-output/implementation-artifacts/sp-6-1-export-skill-wrapper.md → ../../.claude/skills/bmad-portfolio-status/
_bmad-output/implementation-artifacts/sp-6-2-catalog-seed-skill-wrappers.md → ../../.claude/skills/bmad-export-skill/
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /.claude/skills/bmad-team-factory/step-03-review.md
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /_bmad-output/implementation-artifacts/tf-2-5-decision-summary-spec-file-persistence.md
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /_bmad-output/planning-artifacts/architecture-reference-teams.md
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /_bmad-output/planning-artifacts/epic-team-factory.md
_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md → /_bmad/bme/_gyre/
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /.claude/skills/bmad-team-factory/step-04-generate.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad-output/planning-artifacts/epic-team-factory.md
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad/bmb/module-help.csv
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad/bme/_gyre/config.yaml
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad/bme/_vortex/config.yaml
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → /_bmad/bmm/module-help.csv
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /.claude/skills/bmad-team-factory/step-04-generate.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad-output/planning-artifacts/epic-team-factory.md
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → /_bmad/bme/_team-factory/lib/types/factory-types.js
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → .claude/skills/bmad-team-factory/workflow.md
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad-output/planning-artifacts/architecture-team-factory.md
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad-output/planning-artifacts/epic-team-factory.md
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/bme/config.yaml:1-11
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/SKILL.md
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/resources/core-module.yaml
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L112-L140
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L147-L160
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L163-L169
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L163-L169
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L172-L189
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L196-L225
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L232-L272
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L279-L338
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L345-L396
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L403-L520
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L46-L71
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/core/bmad-init/scripts/bmad_init.py#L523-L530
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → convoke-epic-bmad-v6.3-adoption.md#epic-1a-seamless-config-migration
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → convoke-epic-bmad-v6.3-adoption.md#story-1a2-create-config-loaderjs-with-direct-yaml-loading
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → convoke-epic-bmad-v6.3-adoption.md#story-1a2-create-config-loaderjs-with-direct-yaml-loading
_bmad-output/implementation-artifacts/v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py
_bmad-output/implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md → ../../.claude/skills/bmad-dev-story/checklist.md
_bmad-output/implementation-artifacts/v63-1a-6-author-migration-guide-standalone-deliverable.md → ../../_bmad/bmm/4-implementation/bmad-dev-story/checklist.md
_bmad-output/implementation-artifacts/v63-2-1-create-bmm-dependency-scan-tool-and-registry.md → ../../.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md
_bmad-output/implementation-artifacts/v63-2-1-create-bmm-dependency-scan-tool-and-registry.md → ../../tests/fixtures/bmm-dependencies
_bmad-output/implementation-artifacts/v63-2-4-custom-skill-registration-and-honest-warnings.md → ../../.claude/skills/bmad-export-skill/
_bmad-output/implementation-artifacts/v63-2-4-custom-skill-registration-and-honest-warnings.md → ../../.claude/skills/bmad-migrate-artifacts/
_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-protocol.md → epic-v63-4-retro-XXXX.md
_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-protocol.md → v63-5b-2-retrospective-and-anti-pattern-registry.md
_bmad-output/planning-artifacts/archive/convoke-prd-bmad-v6.3-adoption.md → convoke-note-initiatives-backlog.md
_bmad-output/planning-artifacts/convoke-announcement-4.0-draft.md → convoke-prd-bmad-v6.3-adoption.md
_bmad-output/planning-artifacts/convoke-epic-7-platform-debt.md → convoke-note-initiatives-backlog.md
_bmad-output/planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md → ../../.claude/skills/bmad-dev-story/checklist.md
_bmad-output/planning-artifacts/convoke-migration-guide-3.x-to-4.0-draft.md → convoke-prd-bmad-v6.3-adoption.md
_bmad-output/planning-artifacts/convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25.md → ../../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_marketplace_structural_adoption.md
_bmad-output/planning-artifacts/convoke-spec-baseartifact-contract.md → ./4-framework-comparison-matrix.md
_bmad-output/planning-artifacts/convoke-spec-baseartifact-contract.md → ./integration-roadmap.md
_bmad-output/planning-artifacts/convoke-spec-baseartifact-contract.md → ./product-brief-Convoke-2026-02-01.md
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/bme/_vortex/agents/contextualization-expert.md#L13
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/resources/core-module.yaml#L25
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L112-L140
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L147-L160
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L149-L154
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L163-L169
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L172-L189
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L196-L225
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L206-L207
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L232-L272
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L236-L238
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L246-L249
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L252-L253
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L259-L261
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L279-L338
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L345-L396
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L348-L356
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L403-L520
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L405-L412
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L417-L421
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L442
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L46-L71
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L523-L530
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L523-L530
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L537-L591
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L572-L587
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/bmad_init.py#L78-L109
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L109-L110
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L129-L130
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L248-L260
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L314-L320
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L57-L64
_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md → ../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L85-L87
_bmad-output/test-artifacts/2026-04-08-baseline-sweep.md → ../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/MEMORY.md
_bmad-output/test-artifacts/2026-04-08-party-mode-session-notes.md → ../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/MEMORY.md
_bmad-output/test-artifacts/2026-04-08-party-mode-session-notes.md → ../../.claude/skills/bmad-create-story/
_bmad-output/vortex-artifacts/forge-decision-hc6-framework-2026-03-21.md → lean-persona-knowledge-holder-2026-03-21.md
_bmad-output/vortex-artifacts/forge-decision-hc6-framework-2026-03-21.md → lean-persona-landing-consultant-2026-03-21.md
_bmad-output/vortex-artifacts/forge-decision-hc6-framework-2026-03-21.md → scope-decision-forge-2026-03-21.md
_bmad-output/vortex-artifacts/gyre-decision-hc6-framework-2026-03-21.md → lean-experiment-gyre-discovery-interviews-2026-03-20.md
_bmad-output/vortex-artifacts/gyre-decision-hc6-framework-2026-03-21.md → lean-persona-compliance-officer-2026-03-21.md
_bmad-output/vortex-artifacts/gyre-decision-hc6-framework-2026-03-21.md → lean-persona-engineering-lead-2026-03-21.md
_bmad-output/vortex-artifacts/gyre-decision-hc6-framework-2026-03-21.md → lean-persona-sre-platform-engineer-2026-03-21.md
_bmad-output/vortex-artifacts/gyre-decision-hc6-framework-2026-03-21.md → scope-decision-gyre-2026-03-21.md
```

### 7.2 Class A — root-relative authoring (338)

```
_bmad-output/_archive/phase-2/p2-1-1-build-programmatic-docs-audit-tool.md → scripts/convoke-doctor.js
_bmad-output/_archive/phase-2/p2-1-1-build-programmatic-docs-audit-tool.md → scripts/update/lib/utils.js
_bmad-output/_archive/phase-2/p2-1-1-build-programmatic-docs-audit-tool.md → scripts/update/lib/validator.js
_bmad-output/_archive/phase-2/p2-1-1-build-programmatic-docs-audit-tool.md → tests/helpers.js
_bmad-output/_archive/releases/NPX-INSTALLATION-UPDATE.md → INSTALLATION.md
_bmad-output/_archive/releases/NPX-INSTALLATION-UPDATE.md → README.md
_bmad-output/_archive/releases/NPX-INSTALLATION-UPDATE.md → scripts/install-all-agents.js
_bmad-output/_archive/releases/RELEASE-NOTES-v1.0.2-alpha.md → INSTALLATION.md
_bmad-output/_archive/releases/RELEASE-NOTES-v1.0.2-alpha.md → README.md
_bmad-output/drafts/README-draft.md → CHANGELOG.md
_bmad-output/drafts/README-draft.md → LICENSE
_bmad-output/drafts/README-draft.md → UPDATE-GUIDE.md
_bmad-output/drafts/README-draft.md → UPDATE-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad-output/journey-examples/busy-parents-7-agent-journey.md
_bmad-output/drafts/README-draft.md → _bmad-output/journey-examples/busy-parents-7-agent-journey.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_enhance/guides/ENHANCE-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_enhance/guides/ENHANCE-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_vortex/contracts/
_bmad-output/drafts/README-draft.md → _bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_vortex/guides/ISLA-USER-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_vortex/guides/LIAM-USER-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_vortex/guides/MAX-USER-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_vortex/guides/MILA-USER-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_vortex/guides/NOAH-USER-GUIDE.md
_bmad-output/drafts/README-draft.md → _bmad/bme/_vortex/guides/WADE-USER-GUIDE.md
_bmad-output/drafts/README-draft.md → docs/agents.md
_bmad-output/drafts/README-draft.md → docs/agents.md
_bmad-output/drafts/README-draft.md → docs/agents.md
_bmad-output/drafts/README-draft.md → docs/development.md
_bmad-output/drafts/README-draft.md → docs/development.md
_bmad-output/drafts/README-draft.md → docs/faq.md
_bmad-output/drafts/README-draft.md → docs/faq.md
_bmad-output/drafts/README-draft.md → docs/testing.md
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → _bmad/_config/agent-manifest.csv
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → _bmad/_config/agent-manifest.csv
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → _bmad/_config/agent-manifest.csv
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → _bmad/_config/agent-manifest.csv
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → _bmad/bme/_team-factory/agents/team-factory.md
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → _bmad/bme/_team-factory/agents/team-factory.md
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → scripts/update/lib/agent-registry.js
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-6-1-wire-loom-master-agent.md → tests/lib/
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → tests/lib/inference.test.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → tests/lib/inference.test.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → tests/lib/inference.test.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → tests/lib/manifest.test.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → tests/lib/manifest.test.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → tests/lib/manifest.test.js
_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md → tests/lib/manifest.test.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/portfolio-engine.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/portfolio-engine.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/portfolio-engine.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/portfolio-engine.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/rules/artifact-chain-rule.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/rules/artifact-chain-rule.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/rules/artifact-chain-rule.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/rules/conflict-resolver.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/rules/conflict-resolver.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → scripts/lib/portfolio/rules/conflict-resolver.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → tests/lib/portfolio-engine.test.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → tests/lib/portfolio-engine.test.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → tests/lib/portfolio-engine.test.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → tests/lib/portfolio-rules.test.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → tests/lib/portfolio-rules.test.js
_bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md → tests/lib/portfolio-rules.test.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → _bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → _bmad/_config/skill-manifest.csv
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → _bmad/_config/skill-manifest.csv
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → scripts/lib/artifact-utils.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → scripts/migrate-artifacts.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → scripts/migrate-artifacts.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → scripts/migrate-artifacts.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → tests/lib/manifest.test.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → tests/lib/manifest.test.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → tests/lib/migrate-artifacts.test.js
_bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md → tests/lib/migrate-artifacts.test.js
_bmad-output/implementation-artifacts/ag-6-5-portfolio-skill-wrapper.md → _bmad-output/implementation-artifacts/ag-6-3-portfolio-attribution-improvements.md
_bmad-output/implementation-artifacts/ag-6-5-portfolio-skill-wrapper.md → _bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md
_bmad-output/implementation-artifacts/ag-6-5-portfolio-skill-wrapper.md → _bmad/_config/skill-manifest.csv
_bmad-output/implementation-artifacts/ag-6-5-portfolio-skill-wrapper.md → _bmad/_config/skill-manifest.csv
_bmad-output/implementation-artifacts/ag-6-5-portfolio-skill-wrapper.md → scripts/lib/portfolio/portfolio-engine.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → _bmad-output/implementation-artifacts/ag-6-4-migration-skill-wrapper.md
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → _bmad-output/implementation-artifacts/ag-6-5-portfolio-skill-wrapper.md
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → _bmad/bme/_artifacts/config.yaml
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → _bmad/bme/_artifacts/config.yaml
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → _bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → _bmad/bme/_artifacts/workflows/bmad-portfolio-status/
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/convoke-doctor.js#L159
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/convoke-doctor.js#L60-L65
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/update/lib/refresh-installation.js#L595
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → tests/unit/refresh-installation-enhance.test.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → tests/unit/validator.test.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → tests/unit/validator.test.js
_bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md → tests/unit/validator.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad/bme/_artifacts/config.yaml
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad/bme/_team-factory/lib/writers/config-appender.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad/bme/_team-factory/lib/writers/config-appender.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad/bme/_team-factory/lib/writers/config-appender.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad/bme/_team-factory/lib/writers/config-appender.js#L126
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → _bmad/bme/_team-factory/lib/writers/config-appender.js#L48
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → package.json
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → package.json
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js#L240-L279
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js#L240-L303
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js#L251-L258
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/config-merger.js#L30
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/refresh-installation.js#L144-L152
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/refresh-installation.js#L251-L256
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/utils.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/utils.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/utils.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/utils.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/utils.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/utils.js#L101-L114
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/team-factory/config-appender.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/refresh-installation-artifacts.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/utils.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/utils.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/utils.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/utils.test.js#L115
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/utils.test.js#L140-L160
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/yaml-comment-preservation.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/yaml-comment-preservation.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/yaml-comment-preservation.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/yaml-comment-preservation.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/yaml-comment-preservation.test.js
_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md → tests/unit/yaml-comment-preservation.test.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad/_config/skill-manifest.csv
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad/_config/skill-manifest.csv
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad/_config/skill-manifest.csv
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad/bme/_artifacts/config.yaml
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → _bmad/bme/_team-factory/lib/utils/csv-utils.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js#L236-L239
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js#L282-L298
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js#L367-L380
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js#L373-L377
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js#L55-L67
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/convoke-doctor.js#L55-L67
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/update/lib/config-merger.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/update/lib/refresh-installation.js#L660
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/update/lib/refresh-installation.js#L705-L712
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → scripts/update/lib/validator.js#L482-L563
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → tests/unit/convoke-doctor-skill-wrappers.test.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → tests/unit/convoke-doctor-skill-wrappers.test.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → tests/unit/convoke-doctor-skill-wrappers.test.js
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → tests/unit/convoke-doctor-skill-wrappers.test.js#L264-L280
_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md → tests/unit/refresh-installation-artifacts.test.js
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/implementation-artifacts/ag-6-6-skill-registration-wiring.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad-output/implementation-artifacts/sprint-status.yaml
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → _bmad/_config/skill-manifest.csv
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → package.json#L44
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/convoke-doctor.js
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L172-L223
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L172-L223
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L247-L279
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L247-L279
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L343-L354
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L343-L354
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L359-L363
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L359-L363
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L38
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L632-L657
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L632-L657
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L658-L702
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L658-L702
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L704-L743
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L704-L743
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L96-L119
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L96-L119
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/refresh-installation.js#L96-L119
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js#L208-L225
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js#L208-L225
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js#L208-L225
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js#L374-L490
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js#L374-L490
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js#L491-L575
_bmad-output/implementation-artifacts/ag-7-3-validator-refresh-contract-audit.md → scripts/update/lib/validator.js#L491-L575
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → _bmad-output/implementation-artifacts/sprint-status.yaml
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → scripts/update/lib/refresh-installation.js
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → scripts/update/lib/refresh-installation.js#L566-L581
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → scripts/update/lib/refresh-installation.js#L566-L581
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → scripts/update/lib/refresh-installation.js#L566-L581
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → scripts/update/lib/refresh-installation.js#L566-L581
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → scripts/update/lib/refresh-installation.js#L658-L743
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → scripts/update/lib/refresh-installation.js#L660
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → scripts/update/lib/refresh-installation.js#L718
_bmad-output/implementation-artifacts/ag-7-4-orphan-skill-wrapper-cleanup.md → tests/unit/refresh-installation-artifacts.test.js
_bmad-output/implementation-artifacts/ci-hygiene-1-1-pipefail-and-lint-gate-fidelity.md → _bmad-output/implementation-artifacts/session-retro-2026-05-05-cov-and-i97-bug.md
_bmad-output/implementation-artifacts/spec-bug-2-adr-idempotent-noop-commit.md → scripts/lib/artifact-utils.js#L2104
_bmad-output/implementation-artifacts/spec-bug-2-adr-idempotent-noop-commit.md → scripts/migrate-artifacts.js#L380
_bmad-output/implementation-artifacts/spec-bug-2-adr-idempotent-noop-commit.md → scripts/migrate-artifacts.js#L400
_bmad-output/implementation-artifacts/spec-bug-2-adr-idempotent-noop-commit.md → scripts/migrate-artifacts.js#L402-L404
_bmad-output/implementation-artifacts/spec-bug-7-export-placeholder-wording.md → scripts/portability/convoke-export.js#L295-L302
_bmad-output/implementation-artifacts/spec-bug-7-export-placeholder-wording.md → scripts/portability/export-engine.js#L481-L517
_bmad-output/implementation-artifacts/spec-bug-7-export-placeholder-wording.md → scripts/portability/export-engine.js#L507-L515
_bmad-output/implementation-artifacts/spec-i20-portfolio-markdown-unattributed.md → scripts/lib/portfolio/portfolio-engine.js#L503-L504
_bmad-output/implementation-artifacts/spec-i20-portfolio-markdown-unattributed.md → scripts/lib/portfolio/portfolio-engine.js#L528
_bmad-output/implementation-artifacts/spec-i20-portfolio-markdown-unattributed.md → scripts/lib/portfolio/portfolio-engine.js#L528-L540
_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md → scripts/update/lib/agent-registry.js
_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md → scripts/update/lib/agent-registry.js
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → _bmad/bme/_team-factory/lib/types/factory-types.js
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → scripts/update/lib/agent-registry.js
_bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md → scripts/update/lib/validator.js
_bmad-output/implementation-artifacts/v3.2.0-release-description.md → CHANGELOG.md
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-1-config-loading-architecture-wr1--wr8
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-1-config-loading-architecture-wr1--wr8
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#known-failure-modes--mitigations
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#known-failure-modes--mitigations
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#pattern-3-yaml-readwrite-safety
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#pattern-3-yaml-readwrite-safety
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/functional-requirements.md
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/_config/taxonomy.yaml
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → _bmad/bme/config.yaml
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → project-context.md
_bmad-output/implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md → project-context.md
_bmad-output/implementation-artifacts/v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md → tests/mock-cp.js
_bmad-output/implementation-artifacts/v63-5b-1-author-and-validate-changelog.md → docs/migration/3.x-to-4.0.md
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → scripts/lib/artifact-utils.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/artifact-utils.test.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/artifact-utils.test.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/inference.test.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/manifest.test.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/migrate-artifacts.test.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/migrate-artifacts.test.js#L304
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/migration-execution.test.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/portfolio-engine.test.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/portfolio-engine.test.js#L59-L64
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/portfolio-rules.test.js
_bmad-output/test-artifacts/2026-04-08-astonishment-report.md → tests/lib/taxonomy.test.js
_bmad-output/test-artifacts/2026-04-08-baseline-sweep.md → tests/team-factory/registry-writer.test.js#L179
_bmad-output/test-artifacts/2026-04-08-baseline-sweep.md → tests/team-factory/registry-writer.test.js#L179
_bmad-output/test-artifacts/2026-04-08-baseline-sweep.md → tests/team-factory/registry-writer.test.js#L179
_bmad-output/test-artifacts/2026-04-08-baseline-sweep.md → tests/team-factory/registry-writer.test.js#L179
docs/codebase-audit-2026-06-27.md → scripts/archive.js#L246
docs/codebase-audit-2026-06-27.md → scripts/audit/audit-bmad-init-refs.js#L112
docs/codebase-audit-2026-06-27.md → scripts/audit/install-scope-check.js#L1
docs/codebase-audit-2026-06-27.md → scripts/audit/install-scope-check.js#L60
docs/codebase-audit-2026-06-27.md → scripts/audit/pf1-judge-calibration.js#L29
docs/codebase-audit-2026-06-27.md → scripts/audit/pf1-record-agent.js#L1
docs/codebase-audit-2026-06-27.md → scripts/audit/pf1-record-agent.js#L61
docs/codebase-audit-2026-06-27.md → scripts/audit/pf1-validation-battery.js#L96
docs/codebase-audit-2026-06-27.md → scripts/convoke-check.js#L26
docs/codebase-audit-2026-06-27.md → scripts/docs-audit.js#L27
docs/codebase-audit-2026-06-27.md → scripts/install-gyre-agents.js#L18
docs/codebase-audit-2026-06-27.md → scripts/lib/artifact-utils.js#L1406
docs/codebase-audit-2026-06-27.md → scripts/lib/artifact-utils.js#L1637
docs/codebase-audit-2026-06-27.md → scripts/lib/portfolio/portfolio-engine.js#L301
docs/codebase-audit-2026-06-27.md → scripts/lib/portfolio/portfolio-engine.js#L43
docs/codebase-audit-2026-06-27.md → scripts/lib/portfolio/rules/artifact-chain-rule.js#L22
docs/codebase-audit-2026-06-27.md → scripts/lib/portfolio/rules/git-recency-rule.js#L31
docs/codebase-audit-2026-06-27.md → scripts/portability/convoke-export.js#L219
docs/codebase-audit-2026-06-27.md → scripts/portability/convoke-export.js#L319
docs/codebase-audit-2026-06-27.md → scripts/portability/export-engine.js#L1006
docs/codebase-audit-2026-06-27.md → scripts/portability/export-engine.js#L175
docs/codebase-audit-2026-06-27.md → scripts/portability/export-engine.js#L509
docs/codebase-audit-2026-06-27.md → scripts/portability/export-engine.js#L818
docs/codebase-audit-2026-06-27.md → scripts/portability/generate-adapters.js#L22
docs/codebase-audit-2026-06-27.md → scripts/portability/generate-adapters.js#L62
docs/codebase-audit-2026-06-27.md → scripts/portability/manifest-csv.js#L5
docs/codebase-audit-2026-06-27.md → scripts/portability/seed-catalog-repo.js#L355
docs/codebase-audit-2026-06-27.md → scripts/portability/seed-catalog-repo.js#L405
docs/codebase-audit-2026-06-27.md → scripts/update/convoke-migrate.js#L84
docs/codebase-audit-2026-06-27.md → scripts/update/lib/backup-manager.js#L212
docs/codebase-audit-2026-06-27.md → scripts/update/lib/config-loader.js#L325
docs/codebase-audit-2026-06-27.md → scripts/update/lib/config-merger.js#L416
docs/codebase-audit-2026-06-27.md → scripts/update/lib/migration-runner.js#L52
docs/codebase-audit-2026-06-27.md → scripts/update/lib/refresh-installation.js#L34
docs/codebase-audit-2026-06-27.md → scripts/update/lib/utils.js#L27
docs/codebase-audit-2026-06-27.md → scripts/update/lib/utils.js#L76
docs/codebase-audit-2026-06-27.md → scripts/update/lib/validator.js#L609
docs/codebase-audit-2026-06-27.md → scripts/update/lib/version-detector.js#L55
docs/codebase-audit-2026-06-27.md → scripts/update/migrations/3.3.x-to-4.0.0.js#L380
docs/codebase-audit-2026-06-27.md → scripts/update/migrations/3.3.x-to-4.0.0.js#L84
docs/codebase-audit-2026-06-27.md → tests/integration/fresh-install.test.js#L251
docs/codebase-audit-2026-06-27.md → tests/lib/portability-canonical-format.test.js#L28
docs/codebase-audit-2026-06-27.md → tests/lib/portability-canonical-format.test.js#L28
docs/codebase-audit-2026-06-27.md → tests/lib/portability-seed-catalog.test.js#L82
docs/codebase-audit-2026-06-27.md → tests/unit/migration-runner-orchestration.test.js#L28
```
