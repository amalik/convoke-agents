---
initiative: convoke
artifact_type: retrospective
created: 2026-05-05T00:00:00.000Z
schema_version: 1
status: complete
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-epic-restore-coverage-green-ci.md
  - _bmad-output/planning-artifacts/convoke-epic-i97-bug-fixes.md
  - _bmad-output/implementation-artifacts/cov-1-1-close-functions-coverage-gap.md
  - _bmad-output/implementation-artifacts/i97-bug-1-fix-p0-activation-defects.md
---

# Session Retrospective — cov-epic-1 + i97-bug-epic-1 (2026-05-03 → 2026-05-05)

## Scope

Session-arc retrospective covering two single-story mini-epics shipped together in one continuous flow:

1. **`cov-epic-1` (cov-1.1)** — c8 functions threshold gap closure. Diagnosed in party-mode (Winston + Murat) → SM story authoring → dev → R1 review converged with 8 patches → done.
2. **`i97-bug-epic-1` (i97-bug-1)** — P0 activation test contract format-aware update (v5 XML + v6.3 markdown). Discovered during cov-1.1 Task 4.4 HALT → operator option A (story split) → SM story authoring → dev (false-positive Task 4.4) → R1 review caught the gap → operator option A (widen scope) → 8 patches → done.

Both epics together resolved a 4-day GitHub Actions `coverage` job red (since 2026-05-01T23:15:46Z).

## What went well

- **Party-mode diagnosis worked.** Winston (Architect) + Murat (Test Architect) co-diagnosed the dual-cause CI red in <10 minutes. The two-perspective frame (architectural vs. test-quality) produced a sharper triage than either would have alone.
- **Single-story mini-epic precedent held.** Both epics followed the lint-epic-1 / mig-test-epic-1 / cov-epic-1 shape: incident-driven, one story, optional retro. Low ceremony, high velocity.
- **V-pass+R1-only convergence default served as the load-bearing safety net.** R1 caught a dev-story false-positive that would have shipped i97-bug-1 to "done" with 12 hidden P0 failures. Without R1, CI would have stayed red despite "done" status.
- **Code-review-as-checkpoint compounds in value.** R1 on cov-1.1 caught 10 patches; R1 on i97-bug-1 caught the load-bearing AC1 FAIL plus 7 more patches. The cost of R1 (3 parallel agents × ~30 min) is dwarfed by the cost of false-positive shipping.
- **Operator option-letter pattern (A/B/C) shipped cleanly twice.** Used for cov-1.1 dev-story HALT (Option A: split story) and i97-bug-1 R1 (Option A: widen scope). The friction-free decision protocol kept momentum without sacrificing rigor.
- **Format-aware machinery is now reusable.** `parseV63Definition` + `extractMarkdownSection` + `extractExecPaths` + `resolveExecPath` + `countRules` + `hasConfigErrorHandling` + `fileMentions` form a self-contained v6.3 contract toolkit ready for the remaining 4 I97 conversions (Isla, Noah, Max, Liam).

## What didn't go well

- **Bash pipe exit-code trap masked a real defect.** `npm run test:coverage 2>&1 | tail -15; echo "EXIT: $?"` returns `tail`'s exit code (always 0), not the upstream command's. Dev-story Task 4.4 reported "EXIT: 0" while the actual exit was 1 with 12 P0 failures. The same pattern was present in cov-1.1 verification too — caught only because R1 ran the command independently with `set -o pipefail`.
- **Baseline capture used a narrower surface than the AC verified against.** i97-bug-1 Task 1.2 ran `node --test tests/p0/p0-activation.test.js` (one file, 22 ✖) instead of `npm run test:coverage` (the AC1 binding, 22 + 12 = ~34 ✖). The 12 per-agent test failures in `p0-emma.test.js` / `p0-wade.test.js` / `p0-mila.test.js` were invisible to the dev-story baseline.
- **Hypothetical edge-case "fix" caused empirical regression.** R1's "strip code fences before discriminator" fix was sound for the hypothetical concern (v6.3 file with fenced v5 example) but regressed the empirical reality: v5 agents have their `<agent>` tag *inside* a `\`\`\`xml` fence. Stripping fences mis-classified all 4 v5 agents as v6.3. The fix had to be reverted.
- **Story 2.1 / 2.2 conversion ACs didn't catch the P0 contract gap at ship time.** Each I97 Epic 2 conversion (Emma 2.1, Wade 2.2) shipped under its own ACs (parity harness + personality rubric), but neither AC ran the full P0 surface against the converted agent. The gap surfaced 2 days later via the cov-1.1 coverage job — too late.
- **Story authoring under-described "second cause" handoff.** cov-1.1's AC1 amendment named "75+ assertions across multiple converted Vortex agents" without specifying that those assertions live in PER-AGENT test files (p0-emma/wade/mila), distinct from the activation test file. i97-bug-1's story authoring inherited the imprecision and scoped to `p0-activation.test.js` only.
- **Progressive scope erosion was a real near-miss.** cov-1.1 → i97-bug-1 → i97-bug-2 was the option-B path. Operator explicitly chose option A to break the pattern; without that conscious choice, the session would have looked like "moving goalposts" by the third split.

## Key insights

1. **Verification commands must propagate exit codes correctly.** `set -o pipefail` or capturing the un-piped command's `$?` is non-negotiable for AC verification. Any `cmd | head/tail/grep ; echo $?` pattern in a story Task is a latent false-positive generator.
2. **Baseline capture must run the SAME command the AC verifies against.** A narrower-surface baseline produces a narrower fix. If AC1 binds to `npm run test:coverage`, Task 1 baseline must also run `npm run test:coverage` (not a sub-suite).
3. **Hypothetical edge cases warrant empirical verification before fixing.** R1's adversarial reviewers are tuned to find hypotheticals; the dev pass should test fixes against the actual file corpus before locking them in. "Verify against the 7 SKILL.md files" should be a default subtask whenever a fix touches format detection.
4. **Conversion stories should ship with full-target-suite verification.** I97 Epic 2 conversion ACs should include `npm run test:coverage` exit 0 (or scope-isolated equivalent) — not just the parity harness + personality rubric. The remaining 4 I97 conversions (Isla / Noah / Max / Liam) inherit this lesson.
5. **Code-review-as-checkpoint pays for itself by R1.** Two consecutive R1 runs caught defects dev missed (10 + 8 patches across the session). The "different LLM, different angle" principle has empirical support now; the V-pass+R1 default is well-calibrated.
6. **Split-vs-widen scope decisions need an explicit "stop the splits" trigger.** After cov-1.1 (option A split) → i97-bug-1 (option A widen) the operator implicitly recognized progressive scope erosion. The decision protocol benefits from a named criterion: "after N splits, default to widen unless there's a load-bearing reason to split again."

## Action items (carry-forward)

| ID | Action | Owner | Trigger |
|---|---|---|---|
| AC-RETRO-1 | Add `verification-pipefail` rule to `project-context.md`: "Story Task verification commands using shell pipes MUST use `set -o pipefail` or `${PIPESTATUS[0]}`; `cmd \| head/tail/grep ; echo $?` is forbidden because it captures the rightmost command's exit code." Cite session 2026-05-05 as scar-story. | Bob (SM) on next story authoring | Pre-next-story |
| AC-RETRO-2 | Update `bmad-create-story` template/checklist: Task 1 baseline-capture sub-task MUST run the SAME command the AC verifies against (not a narrowed sub-suite). | Bob (SM) | Pre-next-story |
| AC-RETRO-3 | Update I97 Epic 2 conversion-story ACs (or i97-2-3 Mila in-flight) to include "post-ship full P0 surface verification" (`npm run test:coverage` exit 0 against the converted agent's per-agent test file). The format-aware machinery now exists; future conversions should leverage it. | I97 conversion dev (next pickup) | i97-2-3+ |
| AC-RETRO-4 | Add `bmad-code-review` Edge Case Hunter prompt amendment: "verify any fix against the actual file corpus before declaring HIGH" — to reduce hypothetical-fix-causes-empirical-regression risk. | Optional / sprint-time | Backlog candidate |
| AC-RETRO-5 | Document the "split-vs-widen scope" decision protocol in `convoke-anti-patterns.md` (or the host-framework-sync-playbook) with the cov-1.1 → i97-bug-1 → option-A precedent as exemplar. | Optional / sprint-time | Backlog candidate |

## Backlog candidates (out-of-scope from these epics)

- **B1 — Extract `tests/p0/helpers.js` v6.3 toolkit into a reusable contract validation library.** When the remaining 4 I97 conversions ship (Isla/Noah/Max/Liam → v6.3), each new agent will fail P0 in the same way Emma/Wade/Mila did. Pre-emptive: factor the helpers into a per-agent v6.3 P0 generator (one function call per agent declaration) instead of N copies of `it('agent file mentions ...')`. RICE-able as a Fast Lane item.
- **B2 — Add `i97-3-1 (CI Infrastructure Spike)` cross-reference: P0 activation contract was absorbed early via i97-bug-1.** Already done at story authoring per option γ. No additional action needed; called out for traceability.
- **B3 — Sprint-status `last_updated` field structural cleanup** (already deferred via cov-1-1 R1; pre-existing pattern across all stories).
- **B4 — Strict-semver hardening for `compareVersions`** (deferred from v6.3 Story 4.2b R1 — orthogonal to this retro but mentioned in project memory; not actioned here).

## Readiness assessment

| Dimension | Status | Notes |
|---|---|---|
| Testing & quality | ✅ green | 2272/2273 pass; 1 skipped (upstream); 0 fail. Full P0 surface format-aware. |
| Deployment | n/a (library) | npm package; no deploy step. v4.0.0-rc.1 still cooking. |
| Stakeholder acceptance | ✅ operator (Amalik) approved both epics' Option A path | No external stakeholder for this incident-driven work. |
| Technical health | ✅ stable | Zero production code modified across both epics. Test-layer additions only. |
| Unresolved blockers | ✅ none | Both causes of the 4-day CI red are closed. |
| Critical path to next epic | ✅ clear | Remaining I97 Epic 2 conversions (2.4-2.7) and Epic 3 (CI Gate Productionization) sequencing intact. |

## Next steps

1. **Operator commits + pushes the i97-bug-1 R1 patches** (6 files in working tree).
2. **CI `coverage` job goes green for the first time since 2026-05-01T23:15:46Z** — verify on the next push.
3. **AC-RETRO-1 (pipefail rule) and AC-RETRO-2 (baseline-capture binding)** picked up at next `bmad-create-story` invocation. Cheap to apply; high-value forward-prevention.
4. **i97-2-3 Mila** continues in-flight (capability-prompts + calibration-baseline phase). The format-aware P0 contract now passes for her SKILL.md as part of i97-bug-1's diff.
5. **Both mini-epic retros optional**, per the lint-epic-1 / mig-test-epic-1 / cov-epic-1 single-story precedent. This document satisfies that obligation for the session arc.

---

**Session-arc velocity note:** two single-story mini-epics shipped end-to-end (party-mode → SM → dev → R1 → done) in one continuous flow, with one mid-session HALT (cov-1.1 Task 4.4) and one R1-driven scope-widening (i97-bug-1 R1 → option A). Both epics resolved root causes that had been stacking up for 4 days. Net outcome: CI green, format-aware contract toolkit added, operator-pattern decision protocol exercised twice cleanly.
