# Non-Functional Requirements

*Only categories relevant to Convoke 4.0 are documented. Categories intentionally skipped: Scalability (single-user CLI tool, no concurrent user concerns), Accessibility (no visual UI, CLI tool), Payment/Financial Security (Convoke handles no financial data).*

## Performance

- **NFR1:** `convoke-update` completes end-to-end migration for a typical install in ≤60 seconds on a 2024-era laptop (measured baseline; drift from this triggers investigation).
- **NFR2:** The direct-YAML config loader utility (FR2) adds ≤50ms overhead per agent activation vs. the prior `bmad-init` flow.
- **NFR3:** The PF1 agent behavioral equivalence validation battery (FR36) executes in ≤15 minutes against the full representative input set.
- **NFR4:** The automated skill-dir audit script scans all `.claude/skills/` directories in ≤5 seconds on a typical install.
- **NFR5:** The `bmm-dependencies.csv` regeneration scan (FR13) completes in ≤10 seconds against the Convoke skill corpus.

## Reliability

- **NFR6:** The user migration script (FR7) is fully idempotent — re-running it after a successful run produces an empty filesystem diff (enforced by M4 test).
- **NFR7:** The user migration script supports **resume-after-failure** — if interrupted mid-migration, a subsequent run detects partial state and resumes without corrupting it (FR9).
- **NFR8:** `convoke-update` is offline-safe for the migration phase — does not require network connectivity to complete the direct-load migration itself (marketplace-related checks may require network; migration does not).
- **NFR9:** The post-upgrade regression gate (FR15) is fail-soft — a registry validation failure produces a warning and allows operator override, not a hard block (per PM3 honesty about validation limits).
- **NFR10:** `convoke-doctor` degrades gracefully when any module is missing — reports the missing module as a health finding rather than crashing.

## Integration

- **NFR11:** Convoke's `.claude-plugin/marketplace.json` conforms to BMAD's `registry-schema.yaml` for community modules — validated by BMAD's PluginResolver against the published schema.
- **NFR12:** Convoke's agent SKILL.md files conform to BMAD v6.3 skill directory convention (`<skill-dir>/SKILL.md` with v6.3 frontmatter schema).
- **NFR13:** Convoke's `_bmad/bme/_vortex/module.yaml` (or equivalent `module_definition` target) conforms to BMAD's expected module.yaml schema for PluginResolver discovery.
- **NFR14:** Convoke skills activate correctly against Claude Code's v6.3-compliant activation protocol — validated by smoke test on at least one agent per module (core, bmm, cis, tea, wds, bme).
- **NFR15:** Convoke adapts gracefully when installed *alongside* upstream BMAD (community module install path) — no file collisions, no shared-path conflicts.

## Maintainability

*This is a non-standard NFR category, included because maintainer sustainability is a named load-bearing concern in this release (PM2 / OP-1). Without it, a future maintainer will face unbounded complexity.*

- **NFR16:** The total cumulative lines of code added or modified by 4.0 (JS + Python + YAML + markdown, excluding frontmatter-heavy planning artifacts) is bounded by a target discussed in the architecture doc — overrun triggers scope deferral review per OP-1.
- **NFR17:** All migration-time decisions that require operator judgment (custom skill registration, deferral choices, etc.) are documented in a single operator-facing migration guide ≤1 page (FR10 / FR11).
- **NFR18:** The `host_framework_sync` playbook artifact (FR31) is self-contained — a future maintainer can execute a host_framework_sync release by reading only the playbook plus the current BMAD release notes, without needing to re-read this PRD.
- **NFR19:** All audit scripts (`audit-bmad-init-refs.js`, `audit-skill-dirs.js`, `audit-bmm-dependencies.js`) are placed under a single committed directory (e.g., `scripts/audit/`) with shared utilities for reuse.
- **NFR20:** The architecture doc defines drift threshold T numerically (not prose) so it can be automated and re-used without interpretation (FR46).

## Observability

- **NFR21:** The PF1 validation battery produces a machine-readable PASS/FAIL record per input, not just a summary pass/fail (supports future investigation of *which* inputs drifted).
- **NFR22:** The drift snapshot workflow (FR39) produces a semantic diff artifact that can be manually reviewed for unexpected behavioral changes.
- **NFR23:** The recursive tooling validation result (FR18) is logged as a distinct entry in the WS4 validation log — distinguishable from other dependency checks.
- **NFR24:** Sprint 1 experiment go/no-go decisions (FR34) are logged with timestamps and "what this changed downstream" paragraphs.
- **NFR25:** The retrospective (FR47) produces observation results for each innovation hypothesis (FR49) with distinct PASS / FAIL / DEFERRED status per hypothesis.

## Backwards Compatibility

- **NFR26:** Convoke 4.0 maintains a **one-minor-version backwards-compat window** for the old `bmad-init` config loading pattern — if a user is on 4.0 but has somehow retained an old config layout, the system warns and auto-migrates on next `convoke-update`.
- **NFR27:** The `bmad-init` skill is *deprecated* in 4.0.0, *warned* in 4.0.0 (info-level warning on activation), and *removed* no earlier than 4.1.0 with explicit deprecation date in the playbook artifact.
- **NFR28:** User-authored custom skills that were working in 3.2.0 continue to function in 4.0 as long as they are registered in `bmm-dependencies.csv` per FR16 — 4.0 does not silently break user customizations.
- **NFR29:** Convoke 4.0 accepts installation over a 3.2.0 install without requiring uninstall-then-reinstall — the migration path from any 3.x version is idempotent per NFR6.

## Reproducibility

*Quality-threshold counterpart to FR36–FR40. The FRs specify that validation happens; the NFRs specify how much drift is acceptable.*

- **NFR30:** Drift threshold T is defined numerically in the architecture NFR section. Agents producing outputs within T on the representative input battery are considered behaviorally equivalent.
- **NFR31:** The PF1 battery covers at least 5 representative inputs sampled from real `_bmad-output/vortex-artifacts/` data (minimum; Winston can expand per architecture decision).
- **NFR32:** The drift snapshot (FR39) produces deterministic output when re-run on the same inputs — the snapshot is reproducible.
- **NFR33:** The validation battery can be re-run post-release to detect regression if a user reports behavioral changes, using the same inputs and the same threshold T.
