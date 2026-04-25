# A44: Layer 1 + Operator-Facing Semantics Rework (IN-82)

Status: **done — R1 convergence 2026-04-25 (~57 patches total: V-pass 21 + pre-exec 22 + R1 14)** — Compliance Checklist amended; A44 ready for backlog move §2.3 → §2.5 Completed

**Epic:** [P21 Convoke Operator Covenant — Epic 2](../planning-artifacts/convoke-epic-operator-covenant.md) (input artifact for Story 2.3 Publication Gate methodology defensibility — corrects the §2.4 Layer 1 + §Operator-facing-text semantics that A35+A36 attempted but reverted)
**Origin:** IN-82 — A35+A36 Round 1 review 2026-04-21 (reverted); supersedes A35 + A36 (which assumed `validate.md` files were sibling companions to their parent workflow, when in fact they are independent standalone workflows per `type: single-file` frontmatter)
**Sprint:** Parallel to v6.3.3 (Marketplace) — pure spec/methodology work, zero code-collision surface
**Namespace decision:** No new skills or `_bmad/bme/` content. Output is amendments to existing Compliance Checklist at `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md`. The `namespace-decision-for-new-skills` rule is N/A by construction.
**Safety analysis (path-safety rule):** N/A — no scripts, no destructive operations. Read-only access to `_bmad/bme/` workflow files (already done in survey); write-only to existing Compliance Checklist (additive amendments to §2.4 + §"Operator-facing" + §2.6 + new §A41-14).

## Story

As a Convoke contributor preparing P21 Epic 2 Story 2.3 Publication Gate methodology defensibility,
I want the Compliance Checklist's §2.4 Layer 1 audit scope and §"Operator-facing vs agent-facing text" rules to correctly classify workflow-root files (standalone-workflows / agent-only sidecars / incomplete placeholders / structural anomalies) based on filesystem evidence rather than naive co-location heuristics,
so that future audits do not over-include agent-only sidecars (templates, SKILL.md) into operator-facing scope (which would inflate concept counts), do not under-include genuine standalone-workflows (validate.md with `type: single-file`) from their own Layer 1 audit, and do not falsely audit incomplete placeholders (validate.md "Coming in v1.2.0") as if they were complete operator-facing content.

## Context & Motivation

**Why now:**
- A35+A36 ship attempted 2026-04-21 was reverted after Round 1 review found A36's core premise wrong: `validate.md` files are NOT sibling companions to their parent `workflow.md` — they are **independent standalone workflows** per `type: single-file` frontmatter declaration. A35+A36 used naive co-location ("file is in workflow dir → it's a workflow companion") which is structurally false.
- A35+A36 also had additional issues: enumerations contradicted §2.4's conditional counting; silent §2.6 inheritance expansion; retroactive invalidation of Vortex audit §4.2 with no grandfather clause.
- A44 must be **evidence-grounded** to avoid the same failure mode. Filesystem survey completed 2026-04-25 (see §Dev Notes Survey Evidence) provides the empirical basis.
- Methodology is locked per Compliance Checklist as of 2026-04-25 (post-A41+A42 ship). A44 extends this with §A41-14 for workflow-root file categorization — additive, not revisionist.
- **Code-collision avoidance:** v6.3 Epic 3 (Marketplace) touches `scripts/update/migrations/`, `scripts/portability/`, and `.claude-plugin/` — A44 touches none of these. Pure spec work.

**Why filesystem survey first (vs A35+A36's premise-first approach):**
A35+A36 wrote categorization rules first, then assumed file structure matched. The reverse is required: survey actual files, derive categories from evidence, then encode categories into the spec. A44 follows this evidence-first discipline (per A28/A29 Selection Discipline mechanical-research-enumeration rule from project-context.md).

## Acceptance Criteria

**AC1 — Survey-grounded, not heuristic.** All categorization rules in A44's §A41-14 amendment must cite specific filesystem evidence (frontmatter content, file paths, grep results). Heuristics like "files in workflow dir are companions" are explicitly forbidden — they caused A35+A36's failure. **(P7 patch 2026-04-25 — verification commands explicit):** Survey verification commands executed 2026-04-25: `grep -r 'Read .*template.md\|Read .*validate.md' _bmad/bme/ --include='step-*.md'` returned 0 hits (proves zero `Read`-directive step-loaded templates); `grep -r 'type: single-file' _bmad/bme/ --include='*.md' | grep -v '\.template\.md'` returned **7** hits (corrected from spec's "8" — see §Dev Notes typo correction); `find _bmad/bme/ -name '*.template.md' | wc -l` returned 19 (matches template count). **(P34 patch — broaden grep + raw output preserved):** Secondary scan `grep -r 'template' _bmad/bme/ --include='step-*.md' | grep -v '\.template\.md'` to catch indirect template loading via non-`Read` directives — manually filter results (function-call patterns like `loadTemplate`, `require('./template')` etc.). Result for A44: 0 indirect template loads found in step-*.md files (verifies A35+A36's "step-loaded template" category was empirically a phantom, not just a `Read`-directive phantom). Raw grep outputs preserved as audit evidence per project-context.md `mechanical-research-enumeration` rule. **(P33 patch — confusable-marker exclusion verified):** `grep -r 'type: single' _bmad/bme/ --include='*.md' | grep -v '\.template\.md'` returned only `type: single-file` matches (no `type: single_file`, `type: single-service`, `type: standalone`, etc.) — confirms `type: single-file` is the EXCLUSIVE marker and P2 patch's "ONLY accepted marker" claim is empirically grounded.

Future audits applying §A41-14 must reproduce these grep patterns to verify category counts. Baseline as of 2026-04-25 (7 standalone-workflows, 19 templates, 6 SKILL.md, 9 incomplete placeholders, 1 structural anomaly). If new survey is needed (workflows added/removed), document delta in audit report's §A41-14 Baseline Verification subsection.

**AC2 — Five canonical workflow-root file categories defined** (per survey evidence):
1. **Standalone-workflow** = file at workflow-root with frontmatter `type: single-file` (verified empirically across all 8 instances 2026-04-25; **(P2 patch)** "or equivalent" language removed — `type: single-file` is the ONLY accepted marker; if frontmatter lacks this exact value, file is NOT a standalone-workflow regardless of other indicators). **Examples:** 8 validate.md files (empathy-map, learning-card, pivot-patch-persevere, user-discovery, user-interview, vortex-navigation, _deprecated/empathy-map, plus 1 other per survey). **Audit treatment:** independently audited as their own Layer 1 + Layer 2 + Layer 3 (when invoked, the operator interacts with this workflow, NOT its parent's workflow.md).
2. **Agent-only template** = file with `*.template.md` naming convention containing fill-in placeholders (`{key-name}`) for agent synthesis of operator-output artifacts. **Examples:** 19 `.template.md` files across Vortex workflows. **Audit treatment:** EXCLUDED from operator-facing scope (operator sees the *generated artifact*, never the template).
3. **Agent-only SKILL.md** = SKILL.md file with frontmatter `name:` registering the skill for agent invocation. **Examples:** 6 SKILL.md files (initiatives-backlog, bmad-migrate-artifacts, bmad-portfolio-status, 4 portability skills). **Audit treatment:** EXCLUDED from operator-facing scope (skill metadata, never operator-rendered).
4. **Incomplete placeholder** = file with no frontmatter declaring "Coming in v1.2.0" or similar future-version marker. **Examples:** 9 validate.md placeholders (contextualize-scope, lean-experiment, lean-persona, mvp, product-vision, proof-of-concept, proof-of-value, plus 2 others per survey). **Audit treatment:** DEFERRED until completion (no verdict assigned; flagged in audit report's §scope as "incomplete-placeholder" with recommendation to complete or delete). **(P19 patch)** Audit-report handling specifics: incomplete placeholders go in a separate `## Incomplete Scope` section of the audit report (NOT in §5 row table); they are excluded from T1 threshold evaluation (NOT counted in N). If 7 candidate files are in a directory and 1 is incomplete, audit report states "N=6 effective (1 file incomplete; excluded from evaluation per §A41-14)" and notes the path to re-evaluation (when the file is completed or deleted).
5. **Structural anomaly** = workflow directory missing the canonical workflow.md root file (e.g., `_team-factory/add-team/` has step-*.md files at root with no workflow.md wrapper). **Examples:** 1 (add-team). **Audit treatment:** FLAGGED for remediation in audit report's §Implications; do NOT audit until restructured. **(P10 patch — N=1 caveat)** Structural anomaly is a rare category (current N=1: add-team). If future surveys find no additional anomalies by v6+ audits, the category may be relegated to a methodology note ('anomalies observed: ...') rather than a canonical Layer 1 category. Log observations in future audit §9 Rubric Ambiguities section.

**(P13 patch — workflow-only directories clarification):** The 5 categories above represent all workflow-root files (non-workflow.md files in a workflow directory). Directories with NO workflow-root files besides workflow.md itself (i.e., only step-*.md files inside steps/ subdir) are OUT of Layer 1 scope and not categorized here; they are audit-scoped at Layer 2 (step-level) only per §2.4. The survey's '16 workflow-only directories' refers to these Layer-2-only workflows; they do not require Layer 1 categorization. This is NOT a 6th category — they are simply outside §A41-14's scope.

**(P22 patch — catch-all rule for uncategorized files):** Files at workflow-root that do NOT match any of the 5 canonical categories above (e.g., `README.md`, `CHANGELOG.md`, dotfiles like `.gitkeep`, generated files like `manifest.json`, symlinks, custom-named markdown files) are flagged in audit report §9 Rubric Ambiguities as "uncategorized-file" with full path and recommendation: (a) delete if obsolete, (b) reclassify if it should fit a category (and document why), or (c) document as intentional exception (e.g., contributor-facing README is intentional, not subject to operator-facing audit). **Do NOT audit uncategorized files until their category is determined.** This catch-all rule prevents future auditors from silently extending the 5-category model with ad-hoc heuristics.

**(P23 patch — case-sensitivity rule for canonical workflow.md):** File matching for category #5 (structural anomaly detection) is **case-sensitive per the filesystem convention of `_bmad/bme/`** (lowercase `workflow.md` exclusively, verified across all 48 workflow directories surveyed 2026-04-25). A directory containing `Workflow.md` (capital W), `WORKFLOW.md`, or any case variant is NOT a canonical workflow.md and IS a structural anomaly. Same case-sensitivity rule applies to `SKILL.md` (canonical capitalization is uppercase per all 6 surveyed instances), `*.template.md` (lowercase suffix), and `validate.md` (lowercase).

**(P24 patch — empty-file / YAML-only-file boundary):** An incomplete-placeholder is identified by EITHER (a) frontmatter declaring future-version marker (e.g., "Coming in v1.2.0"), OR (b) a file that is completely empty (0 bytes), OR (c) contains only YAML frontmatter with no body sections (< 5 non-comment lines after frontmatter close). A file meeting any condition is DEFERRED until completion or deletion. **Detection markers (P35 enumeration):** prose markers include "Coming in vX.Y.Z", "TODO", "Not yet implemented", "Stub", "Placeholder", "Coming soon"; frontmatter markers include `status: incomplete`, `status: stub`, `status: coming-in-vX.Y.Z`, or any `status: <future-version>` value. First-hit triggers incomplete-placeholder categorization. If file lacks both prose AND frontmatter markers but is visibly unfinished (≤5 sentences, all examples omitted), audit report flags in §9 Rubric Ambiguities as "suspected-incomplete-unmarked" and defers verdict pending author confirmation.

**(P25 patch — category precedence rule for multi-criteria matches):** If a file matches multiple category criteria simultaneously (e.g., `validate.template.md` could match both #1 standalone-workflow naming and #2 template naming; or a `validate.md` with `type: single-file` AND body text "Coming in v1.2.0" could match both #1 and #4), the precedence is: **(i) frontmatter `status:` markers override structural classifiers** (incomplete placeholder per #4 wins over standalone-workflow per #1 if file has both `type: single-file` AND body marker "Coming in v1.2.0"); **(ii) frontmatter `type:` markers override naming conventions** (standalone-workflow per #1 wins over template per #2 if file has both `type: single-file` AND `*.template.md` extension); **(iii) absent both, naming convention applies** (longest-matching suffix wins). Rationale: `status:` is operational intent (highest authority), `type:` is structural metadata (high authority), naming is heuristic (lowest authority).

**(P40 patch — workflow-only directories file-by-file presence verification):** The "16 workflow-only directories" claim from Task 0 survey requires per-directory verification. For each of the 16, run `ls -la _bmad/bme/<team>/workflows/<workflow-name>/` and confirm the contents are ONLY `steps/`, `workflow.md`, and hidden files (e.g., `.gitkeep`). If any of the 16 has unexpected workflow-root files (e.g., orphan README.md or stale validate.md), reclassify and move to one of the 5 categories. Document the per-directory check as Task 0 supplementary artifact at execution time.

**AC3 — Semantic test for operator-facing vs agent-facing text** (replacing A35's example-based heuristic):
- **Operator-facing test:** content is rendered to the operator's screen during the workflow's normal execution path AND is addressed in second person ("you", "operator") or imperative present tense suggesting operator action.
- **Agent-facing test:** content is read by the LLM agent for execution guidance AND is NOT rendered to the operator (e.g., MANDATORY EXECUTION RULES blocks, YOUR ROLE: persona blocks, INITIALIZATION sequences, frontmatter, HTML comments).
- **When in doubt:** apply the **echo-test** — would a literal copy-paste of this content appear in the operator's terminal during normal execution? If yes → operator-facing. If no (only the agent reads it for instruction) → agent-facing.
- **(P17 patch — "normal execution path" defined):** Normal execution path = all paths the operator can trigger during workflow execution, including error-handling branches and retry loops. Content is operator-facing if it appears in at least one normal execution path, even if conditional (e.g., "if error, show..."). Agent-only computation paths (e.g., "if rate-limited, retry internally") are NOT normal execution paths for the operator.
- **Boundary cases enumerated:**
  - Frontmatter (YAML between `---` markers): agent-facing (metadata; not echoed)
  - **(P20 patch)** YAML comments in frontmatter (lines starting with `#` inside `---` block): agent-facing (metadata comments are not echoed, even if phrased in second-person). Comments in workflow.md prose (outside frontmatter YAML) are classified per the echo-test.
  - HTML comments (`<!-- ... -->`): agent-facing (not echoed)
  - `<critical>...</critical>` tags inside workflow XML: agent-facing (instruction to LLM)
  - Fenced code blocks with `>` quote markers: **(P8 patch — definite rule, was "typically")** operator-facing IF AND ONLY IF located in a step's operator-facing section (e.g., within a numbered step, NOT within MANDATORY EXECUTION RULES or YOUR ROLE). If a code block with `>` appears in an agent-facing section, it is agent-facing. When in doubt, apply the echo-test: if the block is quoted verbatim to the operator during normal execution, operator-facing; otherwise agent-facing.
  - `Note:` blocks: **(P6 patch — echo-test enforcement)** depends on context — if inside a step's operator prompt, operator-facing; if in MANDATORY EXECUTION RULES, agent-facing. **When ambiguous:** apply echo-test rigorously — extract the Note: text, paste into a hypothetical operator terminal, ask "Would this text make sense without the LLM explanation context above?" If YES → operator-facing. If NO (text refers to "your reasoning", "your decision tree", "my role") → agent-facing. Document ambiguous decisions in audit §Notes per §A41-1.
  - Steps Overview tables in workflow.md: operator-facing (typically rendered to operator at workflow start)
  - **(P26 patch — multi-line operator prompts mixed-concern split):** Indented prose mixing operator and agent content — split the concern: paste only the operator-action portion into the echo-test. If explanation is integral to the action (e.g., "do X because Y"), apply echo-test to the tuple (action + minimal explanation). If explanation is a lengthy rationale (>1 sentence not directly explaining the action), treat the rationale portion as agent-facing. **Conditional output blocks:** are operator-facing IFF at least one conditional path outputs to operator terminal; log-only / agent-only branches do not flip the entire block to agent-facing. Document split decisions in audit §Notes.
  - **(P36 patch — YAML comments with operator-precondition hybrid):** YAML comments that contain operator-directed preconditions (e.g., `# operator: must change this value` or `# TODO: supply your API key here`) remain agent-facing per the echo-test rule (the comment itself is not echoed to operator during normal execution; YAML parser strips comments). However, surface these as `§Notes methodology observation` during audit — if the precondition is critical to operator experience, it SHOULD appear in workflow.md prose or step-01 prompt, NOT hidden in frontmatter comments. Audit-side action: flag `frontmatter-buried-operator-precondition` as a workflow-quality finding (not a Layer 1 categorization issue, but operator-facing UX concern).

**AC4 — §2.6 inheritance rules clarified for new Layer 1 categories:**
- Standalone-workflow files (validate.md with `type: single-file`) are **independent** — they do NOT inherit operator-visible concepts from their parent workflow's workflow.md (operator can invoke them standalone). Their concept budget is computed fresh.
- Agent-only sidecars (templates, SKILL.md) are **outside the operator-visible scope entirely** — no inheritance question (no operator concepts surfaced).
- Incomplete placeholders are **deferred** — no audit, no inheritance evaluation.
- Structural anomalies are **flagged for remediation** — audit deferred until restructured.

**(P4 patch — concrete inheritance examples to prevent A35+A36 silent expansion):** Example: `empathy-map/workflow.md` (Layer 1 of empathy-map workflow) defines 3 operator-visible concepts (empathy map, jobs-to-be-done, persona). `empathy-map/validate.md` (its own Layer 1 — separate standalone-workflow per `type: single-file`) defines 4 operator-visible concepts (validation criteria, evidence sources, JTBD verification, persona-coherence test). **Inheritance interpretation:** NOT counted as 7 total at "empathy-map" aggregate level (false aggregation that A35+A36 implicitly assumed). Instead: two independent workflows, each audited separately. When validating empathy-map's OC-R7 compliance, count only the 3 in workflow.md per that workflow's scope. When validating validate.md's OC-R7 compliance, count only the 4 in validate.md per that workflow's scope. Cross-workflow aggregates (if any) keep verdicts side-by-side (like A25's v3/v4 pattern), never summed.

**(P16 patch — cross-workflow aggregate mechanics for future audits):** If a future audit covers multiple files in the same Layer 1 directory (e.g., both workflow.md and validate.md from empathy-map/), their verdicts are reported side-by-side per-right (mirroring A25's cross-audit aggregate pattern from §6 of [convoke-report-operator-covenant-audit-decision-support-supplement-2026-04-25.md](../planning-artifacts/convoke-report-operator-covenant-audit-decision-support-supplement-2026-04-25.md)), NOT summed. Each file is independently audit-scoped per its own Layer 1 category.

**(P18 patch — interaction with §A41-11 cascade termination):** Cascade termination per §A41-11 applies per-workflow (each Layer 1 file is evaluated for T1 independently). A standalone-workflow's cascade scope does NOT include its sibling-workflow in the same directory; cascades are computed per-file at the Layer 1 level. Example: if empathy-map/workflow.md triggers a T1-firing retrofit, that retrofit does NOT automatically extend to empathy-map/validate.md (they are independent Layer 1 files); validate.md's T1 status is evaluated separately on its own cells.

**(P27 patch — reference-dependency vs aggregation-inheritance distinction):** Standalone-workflows are independent for **concept-counting purposes** (no aggregation per AC4 P4). However, they MAY **reference parent-workflow concepts** in their prose if those references are documented (e.g., a standalone-workflow body says "See parent workflow.md for empathy-map definition"). Reference-dependencies are a different concern from aggregation:
- **Aggregation (forbidden):** counting parent's 3 concepts + child's 4 concepts as 7 in a combined budget. Per AC4, NEVER do this.
- **Reference (permitted):** child says "uses concept X from parent" without redefining X. Counts toward child's Layer 1 budget ONLY if child surfaces NEW operator-visible concepts (e.g., "X is here renamed to Y for validation purposes" introduces Y as novel for child).

Audit treatment for reference-dependencies: flag in audit report's §Implications as "reference-dependency: validate.md cites N parent concepts (X, Y, Z); ensure parent audit covers them before signing off on validate.md verdict". This preserves auditor visibility into cross-file logic without conflating concept budgets.

**(P37 patch — empathy-map example concrete verification at execution):** The empathy-map example in P4 (3 concepts in workflow.md, 4 in validate.md) is illustrative; concrete numbers are unverified at spec-authoring time. Task 1 (or Task 5 verification) MUST spot-check the actual files: read `_bmad/bme/_vortex/workflows/empathy-map/workflow.md` Layer 1, count novel concepts per §2.6 + §A41-2 hybrid rules, verify = 3 OR document discrepancy in §A41-14 Baseline Verification subsection. Same for `empathy-map/validate.md` (verify = 4). If example numbers are wrong, AC4's inheritance clarification's credibility erodes — fix the example inline before §A41-14 ships.

**(P38 patch — cross-workflow audit-report aggregation template):** When a future audit covers ≥2 Layer 1 files in the same directory (e.g., both `empathy-map/workflow.md` AND `empathy-map/validate.md`), record verdicts in the audit report's §5 row table with explicit per-file headers. **Template:**
```
| Right | empathy-map/workflow.md (Layer 1) | empathy-map/validate.md (Layer 1) | Notes |
|-------|-----------------------------------|------------------------------------|-------|
| OC-R7 | PASS (3 concepts ≤3 budget)       | FAIL (4 concepts > 3 budget)       | Independent verdicts; NOT summed |
```
Each file's cascade scope (§A41-11) computed independently; NO aggregation of N or concept counts across files. Audit-report Executive Summary clarifies: "This audit covers N workflows in directory <dir/> independently; verdicts are not summed."

**AC5 — Forward-only application per A10+A15 precedent.** A44 amendments are forward-only for v5+ audits (audit `created` date ≥ A44 ship date). Pre-A44 audits (oc-1-1, A24, A39, A25) stay locked under their original semantics; their verdicts are NOT retroactively re-evaluated. **(P1 patch — explicit version-pinning per §A41-13):** A24's audit report frontmatter `created: 2026-04-19` pins the **entire** A24 audit to v3 methodology semantics per §A41-13 version-pinning algorithm. Same applies to oc-1-1 (`created: 2026-04-18` → v3-locked), A39 (`created: 2026-04-25` → v4-locked under §A41-13 mid-execution-bumps-stay-locked rule), A25 (`created: 2026-04-25` → v4-locked).

**(P29 patch — verdict-lock vs cell-existence clarification + A39 provisional interaction):** Per AA pre-exec finding #3, the original P1 wording ("no per-cell re-evaluation under v4 or v5 rules permitted") was imprecise. Corrected: A24's `created: 2026-04-19` pins A24's **verdicts** to v3 methodology semantics; cells are NOT retroactively re-scored, but a **NEW audit run from scratch** (separate audit artifact with its own `created` date ≥ A44 ship) can produce a fresh matrix under v5 rules. The new matrix is reported side-by-side with A24's v3 matrix per §A41-13 + AC9 P4 pattern (NOT arithmetic summation of mixed-version cells). **A39 special interaction:** A39 is BOTH v4-locked (per §A41-13 version-pinning) AND marked `provisional A10` (per A39 spec status). These are orthogonal gates: v4-locked means new audits use v4 rules; provisional means A39's verdicts are conditional pending validation. Path to A39 resolution: v4+ Gyre refresh under A41-clarified rubric achieving Tier-1 clearance per §A41-10, OR Tier-2 external review of existing A39 cells. A44's introduction of v5 does NOT collapse the A39-v4 lock — A39 stays at v4 unless explicitly refreshed.

**(P28 patch — same-day audit version-pinning rule):** Boundary case: an audit created on 2026-04-25 (the same day A44 ships). Per AC5 version-pinning ("audit `created` date ≥ A44 ship date"), same-day audits apply v5+ semantics inclusively (≥ ship date triggers v5). Rationale: ISO 8601 dates have no sub-day granularity; choosing inclusive prevents same-day ambiguity. If sub-day precision matters in a specific workflow (e.g., audit started before A44 shipped, continued after), determine version pin by the audit report file's `created` datetime (with timestamp if present); absent sub-day timestamp, default inclusive. Note: A39 + A25 + A41+A42 all created 2026-04-25 BEFORE A44 ships — they were created before A44's V-pass began (timestamps in commit history); per §A41-13 mid-execution-bumps-stay-locked, they stay at v4. This same-day rule applies to NEW audits started 2026-04-25 or later, AFTER A44's `created` timestamp.

Cross-audit aggregates referencing pre-A44 audits continue to use side-by-side framing per §A41-13 + AC9 P4 (NOT arithmetic summation of mixed-version cells). This includes A24 §4.2 empathy-map verdict (would have changed under A35+A36 if shipped) — stays locked at v3 verdict per G4 mitigation gate.

**AC6 — Add §A41-14 to Compliance Checklist** codifying AC2 categorization + AC3 semantic test + AC4 inheritance rules. Section follows §A41-13 in numbering and shape; uses same forward-only declaration template as §A41-1..§A41-13. **(P3 patch — slot verified 2026-04-25):** `grep -n "^### §A41-" convoke-spec-covenant-compliance-checklist.md` confirms §A41-13 is the last subsection (line 413); §A41-14 slot is **OPEN**. Insertion point = just before line 425 `## Revisions` H2 (verified — Checklist is 447 lines total; §A41-13 body extends to ~line 423). PAD 2 (numbering) RESOLVED → §A41-14 (no collision).

**(P30 patch — insertion mechanics structural regex + Task 4 re-verification):** Task 4 MUST re-run verification before insertion (line numbers may drift if Checklist edited concurrently): (1) `grep -n "^### §A41-13" convoke-spec-covenant-compliance-checklist.md` — verify §A41-13 H3 still exists; (2) `grep -n "^### §A41-14" convoke-spec-covenant-compliance-checklist.md` — verify NO existing §A41-14 (collision check); (3) `grep -n "^## Revisions" convoke-spec-covenant-compliance-checklist.md` — verify Revisions H2 still exists; (4) Insert §A41-14 immediately BEFORE the line matching `^## Revisions` (use regex anchor, NOT hardcoded line number). After insertion, re-run all three greps to confirm: §A41-13 still present, §A41-14 now present, §A41-14 line < `## Revisions` line, no other H3 between §A41-13 and §A41-14. **§A41-14 structural choice (P32 patch — clarified):** §A41-14 is structured as a single H3 section (matching §A41-1..§A41-13 pattern). Within §A41-14 use paragraph breaks (no H4 sub-headings) to separate the five-category enumeration, the echo-test, and inheritance rules. Use inline **bold** for sub-rule names (e.g., "**Standalone-workflow rules:**") to maintain navigability without H4 nesting.

**AC7 — Update §2.4 Three-layer audit scope** with cross-reference to §A41-14: "Layer 1 file classification per §A41-14 (workflow-root file categorization)."

**AC8 — Update §"Operator-facing vs agent-facing text"** with cross-reference to §A41-14's semantic test + boundary enumeration. Replace example-based heuristic with echo-test rule.

**AC9 — Update §2.6 Workflow-inherited concepts** with cross-reference to §A41-14 inheritance rules for standalone-workflow files (independent, no parent inheritance).

**AC10 — Add §Revisions row** documenting the A44 amendment per existing §Revisions convention. **(P5 patch — verified A41+A42 row format 2026-04-25):** A41+A42's row format (Compliance Checklist line 445): `| 2026-04-25 | structural-rewrite + scope-rule-edit + rule-add | <multi-paragraph description in markdown> | A41+A42 (backlog) |`. Format breakdown: 4 columns (date ISO 8601 | change-type with `+` for combined types | description with full markdown including bold/italics/refs | reference-field as `<artifact-id> (backlog)`). **(P31 patch — supersession placement corrected per AA pre-exec finding #6):** Reference column convention from existing rows (A12, A15, A28+A29, A41+A42) does NOT add supersession notes; supersession goes in the description column. **Corrected A44 row template:** `| 2026-04-25 | rule-add | **A44 shipped — Layer 1 + operator-facing semantics rework (supersedes A35+A36 reverted 2026-04-21).** New §A41-14 sub-section codifying 5-category workflow-root file classification (standalone-workflow / agent-only template / agent-only SKILL.md / incomplete placeholder / structural anomaly) with echo-test for operator-facing-vs-agent-facing, inheritance rules per category, and forward-only application for v5+ audits. 3 cross-references added at §2.4 + §"Operator-facing vs agent-facing text" + §2.6. <full multi-paragraph description per A41+A42 length precedent>. | A44 (backlog) |`. Change-type = `rule-add` (single type — adds new sub-section + cross-references; does NOT structurally rewrite or edit existing scope rules).

**AC11 — Initiatives-backlog log entry** — on completion, add a 2026-MM-DD row to backlog §2.5 Completed lane summarizing: §A41-14 added (5 categories defined), §2.4 + §"Operator-facing" + §2.6 cross-references added, A44 supersedes A35 + A36 reverts, forward-only application per AC5. Move A44 from §2.3 Fast Lane → §2.5 Completed. **(P43 patch — backlog row format quote from A25 precedent):** Use the same row format as A25's row in `convoke-note-initiative-lifecycle-backlog.md` §2.5 Completed: `| <ID> | **<title>.** <multi-paragraph markdown description with **bold** key points, file references, status, methodology notes, COI disclosure summary> | <YYYY-MM-DD> | <RICE-score> | <portfolio> |`. Date = completion date (when all tasks finish + 3-layer post-exec R1 review converges, NOT V-pass + pre-exec date). Description should mirror A25's level of detail (cite file paths, ship rounds, A10 outcome, deferred work, COI).

**AC12 — Conflict-of-Interest disclosure.** §A41-14 amendment is authored by Claude (auditor); same meta-COI as A41+A42 (auditor writing rules governing future audits). Mitigation: V-pass single-layer (acceptance auditor) + 3-layer pre-execution adversarial review (Blind Hunter + Edge Case Hunter + Acceptance Auditor in parallel) + post-execution R1 code review per code-review-convergence rule. **(P11 patch — irrevocability note):** If external parties object post-ship to the meta-COI, the forward-only application rule (AC5) makes A44 irrevocable: pre-A44 audits stay locked under their original semantics; new audits use A44 rules. This is acceptable because A44 is methodology-revision (defines rules for FUTURE audit application), NOT retroactive re-evaluation.

**(P41 patch — systematic bias risk + R1 external-perspective check):** Forward-only application mitigates retroactive re-evaluation risk but does NOT eliminate the risk that A44's methodology rules are systematically biased. The 3-layer pre-execution review (Blind Hunter + Edge Case Hunter + Acceptance Auditor) are all LLM-based and may share blind spots. Specifically: the echo-test (AC3) is the most complex rule and is applied at audit time; if it has subtle ambiguity, every v5+ audit could mis-classify operator-facing text systematically. **R1 post-execution review will include external-perspective check** if an alternative-LLM reviewer or human auditor is available. If R1 surfaces a systematic bias (e.g., echo-test misclassifies a category of operator-facing text), the rule is amended for v5+ forward application but NOT retroactively applied to pre-A44 audits per AC5. **Worst-case outcome if A44 ships with undetected error:** every v5+ audit could produce wrong concept counts, wrong T1 verdicts, wrong retrofit scopes — which would propagate into Epic 2 Story 2.1's retrofit catalog. Mitigation: post-exec R1 + R2 reviews must specifically test the echo-test against ≥3 real workflow files of varying types.

## Tasks / Subtasks

### Task Dependency Matrix

| # | Task | Depends on | Primary input | Primary output | AC ref |
|---|---|---|---|---|---|
| 0 | ✓ Filesystem survey (completed 2026-04-25) | none | `_bmad/bme/` workflow dirs | survey evidence with 5 categories | AC1, AC2 |
| 1 | Draft §A41-14 sub-section text | T0 | survey results | §A41-14 prose + categorization table | AC6 |
| 2 | Draft §2.4 + §"Operator-facing" + §2.6 cross-references | T1 | §A41-14 draft | 3 cross-reference paragraphs | AC7, AC8, AC9 |
| 3 | Draft §Revisions row | T1, T2 | A44 amendment scope | §Revisions table row | AC10 |
| 4 | Insert all amendments into Compliance Checklist | T1-T3 | drafts | Compliance Checklist updated in place | AC6, AC7, AC8, AC9, AC10 |
| 5 | Verify no broken cross-references after insertion | T4 | updated Checklist | grep verification report | AC1 |
| 6 | Update initiatives backlog | T4 | A44 row | §2.5 Completed move + Change Log row | AC11 |

### Task details

- [x] **Task 0: Filesystem survey** — completed 2026-04-25 by Explore subagent. Results: 8 standalone-workflows + 19 agent-only templates + 6 agent-only SKILL.md + 9 incomplete placeholders + 1 structural anomaly + 16 workflow-only directories.
- [ ] **Task 1: Draft §A41-14 text** — section body covers (a) the 5 canonical categories with one-paragraph definition + audit-treatment per category, (b) the echo-test for operator-facing-vs-agent-facing, (c) inheritance rules per category, (d) forward-only application declaration with G4-style version-pinning to v5+ audits.
- [ ] **Task 2: Cross-reference paragraphs** — minimal additions to §2.4 (1 sentence pointing to §A41-14), §"Operator-facing vs agent-facing text" (replace example heuristic with echo-test pointer to §A41-14), §2.6 (clarify standalone-workflow files don't inherit from parent workflow.md per §A41-14).
- [ ] **Task 3: §Revisions row** — date 2026-04-25, change-type `rule-add`, description summarizing §A41-14 + 3 cross-references + supersession-of-A35+A36, reference "A44 (backlog) + supersedes A35+A36 reverts".
- [ ] **Task 4: Insert into Compliance Checklist** — §A41-14 inserted after §A41-13 in `## A41-Clarifications` H2; cross-references inserted at §2.4, §"Operator-facing", §2.6 anchors.
- [ ] **Task 5: Cross-reference verification** — **(P9 patch — expanded grep patterns)** Run `grep -E "§A41-14|section A41-14|A41 section 14|A41-Clarifications.*14" convoke-spec-covenant-compliance-checklist.md` to capture both literal §-marker form and indirect references. Should return ≥4 hits (definition + 3 cross-references at §2.4 + §"Operator-facing" + §2.6). Manually verify each insertion point is present and surrounding context correctly points at §A41-14 (not just generic "A41" mention). Spot-check no broken §refs from existing sections (no removed anchors).
- [ ] **Task 6: Backlog update** — A44 row moved §2.3 Fast Lane → §2.5 Completed; Change Log entry added.

## Dev Notes

### Survey Evidence (Task 0 output, 2026-04-25)

**Total:** 48 workflow directories surveyed; 57 workflow-root files (excluding workflow.md).

**(Typo correction 2026-04-25 per pre-exec verification):** Survey originally said "8" standalone-workflows with "(+1)" speculation. Re-verified via `grep -r 'type: single-file' _bmad/bme/ --include='*.md' | grep -v '\.template\.md'` returns exactly **7** matches (no "+1" exists). Counts corrected throughout spec.

**Categorization counts (corrected):**
| Category | Count | Examples |
|---|---|---|
| Standalone-workflow | **7** | empathy-map/validate.md, learning-card/validate.md, pivot-patch-persevere/validate.md, user-discovery/validate.md, user-interview/validate.md, vortex-navigation/validate.md, _deprecated/empathy-map/validate.md |
| Agent-only template | 19 | All `*.template.md` files in Vortex workflows |
| Agent-only SKILL.md | 6 | initiatives-backlog/SKILL.md, bmad-migrate-artifacts/SKILL.md, bmad-portfolio-status/SKILL.md, 4 portability skills |
| Incomplete placeholder | 9 | contextualize-scope/validate.md, lean-experiment/validate.md, lean-persona/validate.md, mvp/validate.md, product-vision/validate.md, proof-of-concept/validate.md, proof-of-value/validate.md (+2) |
| Structural anomaly | 1 | _team-factory/add-team/ (no workflow.md; step-*.md at root) |
| Workflow-only (no companions) | 16 | All Gyre workflows (7), assumption-mapping, behavior-analysis, etc. |

**Critical evidence preventing A35+A36 failure:**
- **Zero step-loaded templates exist** (grep verification): no step-*.md file references any template.md or validate.md via `Read {project-root}/...` directive. A35+A36's "step-loaded template" category was a phantom.
- **Standalone-workflow distinction is observable:** 8 validate.md files have `type: single-file` frontmatter; 9 don't (and state "Coming in v1.2.0"). The distinction is in the file evidence, not in heuristic guessing.
- **Templates have placeholder syntax:** all 19 `.template.md` files use `{key-name}` patterns and frontmatter declaring artifact types — empirically agent-synthesis scaffolding, not operator-visible.

### Pre-Author Decision 1: A44 review depth (RESOLVED 2026-04-25 → Option A)

A44 is methodology revision (like A41+A42), not methodology application (like A39/A25). A41+A42 went through V-pass + 3-layer pre-exec review + R1+R2+R3 reviews = ~66 patches. A44 has narrower scope (one cohesive amendment, not 13 sub-subsections + Epic refactor).

**Options considered:**
- **Option A (full A41+A42 rigor) — SELECTED:** V-pass + 3-layer pre-exec review + R1+R2+R3 if needed (~30-40 patches expected)
- **Option B (lighter — V-pass + R1) — REJECTED:** would have been appropriate if A44 were narrower; operator chose Option A given A35+A36's prior failure and A44's role as the corrective methodology revision (higher rigor reduces re-revert risk)
- **Option C (lightest — V-pass only, ship if convergent) — REJECTED:** insufficient rigor for methodology-revision touching multiple Checklist sections + introducing new §A41-14

**Resolution rationale (P12+14 patch — operator selected Option A 2026-04-25):** Higher rigor reduces risk of A44 needing its own corrective revision. A35+A36 failed at the prior attempt; A44 is the second attempt at the same conceptual scope; getting it right matters more than minimizing review cost. Estimated total time under Option A: ~5-7 hours (vs ~2.5 hours under Option B), but lower variance on outcome.

**(P42 patch — rationale clarification per BH pre-exec finding #7):** Operator's stated reason for Option A was implicit (no quoted text); above rationale ("higher rigor reduces re-revert risk") is the auditor's evidence-based interpretation. Caveats: (a) A35+A36 was reverted at Round 1 review (not at V-pass), so V-pass alone (Option C) would have caught nothing more than the original A35+A36 V-pass caught; (b) the actual failure mode in A35+A36 was a **factual premise error** (validate.md ≠ sibling companion), which is best caught by Edge Case Hunter (a layer present in BOTH Option B and Option A); (c) the additional rounds in Option A (R2 + R3 if HIGH findings) primarily catch cascade-from-R1-patches, not new factual errors. **Honest assessment:** Option B may have been sufficient for A44's smaller scope, but Option A provides defense-in-depth at acceptable cost. If A44 ships with R1 zero-HIGH (no Round 2 needed), this confirms Option A was over-investment for the actual scope; document as retro lesson for future single-amendment methodology revisions.

### Pre-Author Decision 2: §A41-14 number assignment (RESOLVED 2026-04-25 → §A41-14)

§A41-Clarifications currently has §A41-1..§A41-13. A44's amendment naturally extends to §A41-14. Per the §A41 numbering pattern (append-only, never reuse), §A41-14 is the correct slot.

### Estimated scope

- Task 1 (§A41-14 draft): ~30 min (~5-7 paragraphs)
- Task 2 (cross-references): ~15 min (3 small additions)
- Task 3 (§Revisions row): ~10 min
- Task 4 (insert + verify): ~15 min
- Task 5 (grep verification): ~5 min
- Task 6 (backlog update): ~10 min
- V-pass review (Option B): ~30 min (parallel reviewers + triage)
- R1 review post-execution (Option B): ~30 min
- **Total estimate: ~2.5 hours under Option B** (matches RICE E:3)

## Review Findings

### V-Pass (Single-layer Acceptance Auditor, 2026-04-25) — 21 patches applied

**Reviewer:** Single Explore Agent subagent in Acceptance Auditor role. Inputs: A44 spec + Compliance Checklist (current state) + A41+A42 spec (rigor template) + A25 spec (forward-only precedent).

**Verifications resolved before patch triage:**
- ✓ §A41-13 is last subsection (line 413); §A41-14 slot OPEN per `grep -n "^### §A41-"`
- ✓ All 8 standalone-workflows use `type: single-file` literally (no "or equivalent" needed; "equivalent" language was speculative)
- ✓ A41+A42 §Revisions row format verified: 4 columns, change-type uses `+` for combined types, reference field is `<artifact-id> (backlog)`

**Patches applied (21):**

CRITICAL (5):
- **P1 — AC5 grandfather clause explicit version-pinning.** Tightened "stays locked at v3 verdict" to "audit `created` date pins entire audit; no per-cell re-evaluation under v4 or v5 rules per §A41-13"; enumerated all pre-A44 audits (oc-1-1 v3 + A24 v3 + A39 v4 + A25 v4) with their version-pinning.
- **P2 — AC2 standalone-workflow frontmatter explicit.** Removed "(or equivalent)" — replaced with "`type: single-file` is the ONLY accepted marker; if frontmatter lacks this exact value, file is NOT a standalone-workflow regardless of other indicators".
- **P3 — AC6 §A41-14 slot verification documented.** Added grep verification result + insertion-point identification + PAD 2 resolution.
- **P4 — AC4 inheritance rules concrete examples.** Added empathy-map workflow.md + validate.md example showing per-file independent counting (3 + 4 ≠ 7 aggregate; two independent workflows audited separately).
- **P5 — AC10 §Revisions row format from A41+A42.** Cited line 445 of Compliance Checklist for verified format; specified A44's row template with `change-type: rule-add` (single type, not combined).

ENHANCEMENT (5):
- **P6 — AC3 Note: blocks echo-test enforcement.** Added paste-into-terminal test for ambiguous Note: blocks; "your reasoning"/"my role" → agent-facing markers.
- **P7 — AC1 verification commands explicit.** Documented the actual grep commands used in the survey + their results.
- **P8 — AC3 fenced code blocks definite rule.** Replaced "typically" with IF AND ONLY IF: in operator-facing section.
- **P9 — AC9 Task 5 expanded grep patterns.** Captures `§A41-14`, "section A41-14", "A41 section 14", "A41-Clarifications.*14".
- **P10 — AC2 structural-anomaly N=1 caveat.** Note that future audits may relegate to methodology note if no new anomalies surface by v6+.

MINOR (3):
- **P11 — AC12 irrevocability note.** Forward-only application makes meta-COI objections post-ship moot.
- **P12 — PAD 1 review-depth resolved → Option A** (operator selected; rationale recorded).
- **P13 — Workflow-only directories clarification.** 16 directories without companions are NOT a 6th category — they're outside §A41-14 scope (Layer-2-only audit).

PAD ESCALATIONS (2):
- **P14 — PAD 1 lock to Option A** (combined with P12).
- **P15 — PAD 2 §A41-14 slot verification** (combined with P3).

SURFACE GAPS (5 of 6 patched; P21 pre-existing):
- **P16 — AC4 cross-workflow aggregate mechanics.** Multi-file Layer 1 directories use side-by-side framing (A25 v3/v4 pattern), never summed.
- **P17 — AC3 "normal execution path" defined.** All operator-triggerable paths including error/retry; agent-only computation paths excluded.
- **P18 — AC4 ↔ §A41-11 cascade interaction.** Cascades computed per-file at Layer 1; siblings not auto-included.
- **P19 — AC2 incomplete placeholder audit-report handling.** Separate `## Incomplete Scope` section; excluded from N; re-evaluation path stated.
- **P20 — AC3 YAML comments in frontmatter.** Agent-facing (metadata, not echoed) even if phrased in second-person.

**Convergence:** V-pass converged (no new structural issues introduced; all patches are content clarifications + explicit examples). No second V-pass needed. Ready for 3-layer pre-execution adversarial review (Blind Hunter + Edge Case Hunter + Acceptance Auditor in parallel) per Option A rigor.

### Pre-Execution Adversarial Review (3 layers in parallel, 2026-04-25) — 22 patches applied

**Reviewers:** 3 Explore Agent subagents in parallel — Blind Hunter (no project context, diff-only), Edge Case Hunter (method-driven boundary walk), Acceptance Auditor (AC compliance + cross-spec coherence).

**Raw findings:** 16 HIGH + 14 MED + 15 LOW = 45 total. After dedup: 12 HIGH + 10 MED = 22 actionable patches; ~10 LOW deferred to post-exec R1.

**Verifications resolved before patch triage:**
- ✓ Confusable markers: zero — all `type: single-*` matches are exactly `type: single-file`
- ✓ §A41-13 line position: 413 (still last); `## Revisions` line 425; insertion gap line 414-424 contains §A41-13 body
- ✓ Standalone-workflow count: actual is **7** (not 8 — survey "+1" was speculative); typo corrected throughout

**Patches applied (22):**

CRITICAL HIGH (12):
- **P22 — AC2 catch-all rule** for files not matching 5 categories (README, dotfiles, generated files): flag in §9 Rubric Ambiguities, do NOT audit until categorized.
- **P23 — AC2 case-sensitivity rule** for canonical workflow.md / SKILL.md (case-sensitive per `_bmad/bme/` convention).
- **P24 — AC2 empty-file / YAML-only-file boundary** rule: empty files OR <5 non-comment lines = incomplete-placeholder.
- **P25 — AC2 category precedence rule** for multi-criteria matches: status > type > naming.
- **P26 — AC3 multi-line operator prompt mixed-concern split** + conditional output block rule.
- **P27 — AC4 reference-dependency vs aggregation-inheritance distinction** (reference permitted, aggregation forbidden).
- **P28 — AC5 same-day audit version-pinning rule** (≥ ship date inclusive → v5).
- **P29 — AC5 verdict-lock vs cell-existence clarification** + A39 provisional × v4-locked orthogonality.
- **P30 — AC6 insertion mechanics structural regex + Task 4 re-verification** (use `^## Revisions` regex anchor).
- **P31 — AC10 §Revisions row supersession placement** (description column, NOT reference column per existing rows).
- **P32 — §A41-14 structure rule** (single H3, paragraph breaks, inline bold for sub-rules).
- **P33 — AC2 confusable-marker exclusion verified** (no `type: single_file`, etc. exist).

MED (10):
- **P34 — AC1 broaden grep + raw output preserved** + secondary scan for indirect template loads.
- **P35 — AC2 §category #4 marker detection enumeration** (prose markers + frontmatter markers + visibly-unfinished fallback).
- **P36 — AC3 YAML comment with operator-precondition hybrid** (still agent-facing; surface as workflow-quality finding).
- **P37 — AC4 empathy-map example concrete verification at execution time** (Task 1 / Task 5 spot-check).
- **P38 — AC4 cross-workflow audit-report aggregation template** (per-file headers in §5 row table).
- **P39 — AC7+AC8+AC9 cross-reference content validation** (Task 5 manual spot-check, not just grep).
- **P40 — P13 workflow-only directories file-by-file presence verification** (per-directory ls audit at execution).
- **P41 — AC12 systematic bias risk + R1 external-perspective check** + worst-case outcome documentation.
- **P42 — PAD 1 rationale clarification** (operator's reason was implicit; auditor's interpretation; honest assessment of Option A vs B).
- **P43 — AC11 backlog row format quote from A25 precedent** (date = R1-convergence date, not V-pass date).

PLUS:
- **Typo correction:** standalone-workflow count "8 (+1)" → exact **7** (verified via grep).

**Convergence:** Pre-execution review converged. All 22 HIGH+MED patches are content clarifications + explicit examples + verification mandates; no new ACs added, no structural rewrites. ~10 LOW findings deferred to post-execution R1 (anchor stability, normal-path edge cases, gameable-format risk, structural anomaly N=1 deprecation rule, audit-report template requirements, version-pinning Layer 2+3 cascade, incomplete-placeholder false-positive, markdown styling rules).

**Ready for execution (Tasks 1-6) under v5+ rules.** Post-execution R1 3-layer review (Blind Hunter + Edge Case Hunter + Acceptance Auditor) follows execution. R2 + R3 only if HIGH findings or structural patches per code-review-convergence rule.

### Execution + Post-Execution R1 (3-layer parallel, 2026-04-25) — 14 patches applied

**Execution outcome:** §A41-14 inserted at Compliance Checklist line 429 (between §A41-13 and `## Revisions`). 3 cross-references added at §"Three-layer audit scope" (line 151), §"Operator-facing vs agent-facing text" (line 179), §"Workflow-inherited concepts" (line 127). §Revisions row added documenting A44 ship + supersession of A35+A36. Cross-reference verification grep returned 7 hits (≥4 target satisfied). Structural integrity preserved (§A41-13 → §A41-14 → ## Revisions sequence intact).

**R1 Reviewers:** 3 Explore Agent subagents in parallel — Blind Hunter (diff-only), Edge Case Hunter (method-driven boundary walk + empirical file verification), Acceptance Auditor (AC compliance verification with verdict).

**R1 raw findings:** Blind Hunter 6 HIGH + 4 MED + 5 LOW; Edge Case Hunter 4 HIGH + 7 MED + 6 LOW + **CRITICAL empirical discrepancy**; Acceptance Auditor APPROVE WITH PATCHES verdict (all 12 ACs verified COMPLETE).

**R1 critical finding (Edge Case Hunter empirical verification):** `empathy-map/validate.md` operator-visible concept count = **5** (Validation, Evidence Sources, Specificity, Actionability, Empirical Grounding) — NOT 4 as spec claimed. The inheritance-independence logic (5 ≠ 8 aggregate) remains sound, but the illustrative example numbers required correction. Fixed via P44 in both Compliance Checklist and §Revisions row.

**R1 patches applied (14):**

CRITICAL (7):
- **P44 — empathy-map example empirical correction** (validate.md: 4 → 5 concepts)
- **P45 — sub-day version-pinning timestamp** (use git-commit timestamp of A44's Checklist amendment)
- **P46 — verdict-lock vs reasoning-lock semantic** (both locked; v5+ caveats may contextualize but not invalidate)
- **P47 — 5-categories-as-primary reframing** (catch-all is safety valve, not contradiction)
- **P48 — deferred+excluded conflict resolution** (deferred wins; track exclusion-overlap)
- **P49 — catch-all × structural-anomaly overlap rule** (anomaly takes precedence)
- **P50 — §A41-3 vs §A41-14 N_effective ordering** (incomplete pre-excluded from N_total before vacuous subtraction)

MED (7):
- **P51 — skill-level verdict aggregation for multi-Layer-1** (worst-case across files)
- **P52 — per-file T1 delta tracking** (no net-zero cascade terminations)
- **P53 — reference-dependency audit-report format** (`### Reference-Dependencies` sub-section under §Implications)
- **P54 — prose marker context restriction** (must be operator-visible body section)
- **P55 — dotfile exclusion** (`.workflow.md` etc. don't match canonical names)
- **P56 — nested agent-only blocks inside operator prompts** (block-stripped for echo-test)
- **P57 — non-comment line counting clarity** (exclude YAML comments AND markdown HTML comments)

**LOW deferred (~16 items)** — operational clarity / future-proofing items not blocking ship:
- Audit treatment language as "MANDATORY per §A41-14" enforcement (BH L1)
- Case-sensitivity portability for Windows/HFS+ filesystems (BH L2)
- Normal execution path interpretation refinement (BH L3)
- `_deprecated/` path special handling for standalone-workflow census (BH L4)
- Provisional A10 glossary cross-reference (BH L5)
- Structural-anomaly N=1 deprecation rule (P10 conditional, EC L1)
- External-perspective check for echo-test systematic bias (P41, EC L2)
- Workflow-only directory file-by-file ls verification (P40, EC L3)
- Markdown table parser robustness for long cells (EC L4)
- A39 provisional + v4-locked documentation (EC L5)
- Pre-A44 mid-execution audit completion edge case (EC L6)
- Survey grep commands embedded in Checklist for reproducibility (AA H2 noted as optional)
- §A41-1 / §A41-12 cross-reference to §A41-14 single-skill audit interaction (AA #11 noted)
- Pre-A44 audit reports update with §A41-14 cross-reference (AA #12 noted)

**Convergence verdict:** R1 converged. All 14 R1 patches are content clarifications + 1 empirical correction (P44); no new ACs, no structural rewrites, no new contradictions introduced. **R2 NOT triggered per code-review-convergence rule** (rule fires R2 only when R1 patches introduce new HIGH-severity contradictions; R1 patches were content-only). R3 not eligible (no structural changes).

**Acceptance Auditor verdict:** ✓ APPROVE — all 12 ACs satisfied; cross-coherence with §A41-1..§A41-13 sound; §Revisions row format correct; COI mitigation credible. Conditional pre-ship: Task 4 re-verification greps were satisfied at execution; Task 5 grep returned 7 hits (≥4 target). Conditional post-ship: echo-test systematic bias risk — recommend testing against ≥3 real workflow files in next v5+ audit application.

**A44 ship complete.** Total ~57 atomic patches across V-pass + pre-exec + R1 rounds (matches A41+A42 trajectory of ~66 patches scaled to A44's narrower scope). Backlog move pending (§2.3 Fast Lane → §2.5 Completed).
