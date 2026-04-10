# Validator / Refresh / Doctor Contract Audit

**Filename date:** 2026-04-08 (matches epic-7 spec reference)
**Authored:** 2026-04-09
**Story:** ag-7-3 (closes I34, RICE 2.4)
**Audited files:**
- `scripts/update/lib/refresh-installation.js` (790 lines)
- `scripts/update/lib/validator.js` (750 lines)
- `scripts/convoke-doctor.js` (672 lines)

**Verdict legend:**
- **SAFE** — validator + doctor respect the same gate as refresh
- **GAP** — refresh acts on a flag, validator/doctor doesn't check it (latent future-trap)
- **MIXED** — validator covers but doctor doesn't, or vice versa
- **N/A** — no validator/doctor check is conceptually needed

---

## Executive Summary

**25 flag-gated branches catalogued (F1-F25).** Verdict distribution: **5 SAFE / 7 GAP / 5 MIXED / 8 N/A**.

> **Parent story note:** Story 7.3 (this audit) closes **I34** (RICE 2.4). The 6 child items it discovered — **I43-I48** — are scored independently and represent the next layer of work. I34 is "audit the surface area"; I43-I48 are "fix the gaps the audit found."

- **0 GAPs fixed in Story 7.3.** Every identified GAP failed the trivial-patch judgment (each requires either a new validator function, an import, or >3 added lines, or all three). **The 12 GAP/MIXED entries** (7 GAP: F3, F6, F8, F9, F13, F20, F21 + 5 MIXED: F1, F2, F16, F17, F23) **fold into 6 promoted backlog items (I43-I48)** as follows:
  - **F6+F20+F21 → I43** (one fix function closes all 12 bme agent skill wrappers; F1 MIXED is partial mitigation by the same fix)
  - **F3+F16+F17 → I44** (no `validateGyreModule`)
  - **F13 → I45** (workflow-manifest registration drift)
  - **F8+F9 → I46** (version-stamp post-check absence)
  - **F2 → I47** (doctor missing Enhance menu-patch presence check; **F5 is SAFE in the verdict tally** — its parallel-coverage observation is a *consolidation opportunity* bundled into I47's scope, not a GAP/MIXED fold-in)
  - **F23 → I48** (agent-manifest.csv doctor check + CSV-parse upgrade; split out from I47 in Round 3 because the fix shape is cross-module, not module-loop-scoped; bundles with I15 which fixes the same `validateManifest` substring weakness)
  - A 7th conceptual finding — extract a shared `ModuleContract` abstraction so future modules can drive validation declaratively — is recorded as a "future epic" in the Next steps section but **NOT filed as a discrete I-item**.
- **Manifest-as-opt-in semantics from Story 7.2 are SAFE for in-manifest workflows** but the **out-of-manifest path is the dominant attack surface**: refresh installs them with no doctor check (only validator catches Enhance + Artifacts via separate `validateXxxModule` paths).
- **F6+F20+F21 (all 12 bme agent skill wrappers — Vortex 7 + Gyre 4 + EXTRA_BME_AGENTS 1) are the highest-impact GAP** confirmed by the audit (F1 — submodule iteration — is partial mitigation by the same fix function). The original Risk Note #5 only suspected F6 (EXTRA_BME_AGENTS, 1 wrapper); the audit walk discovered the same GAP applies to F20 (Vortex 7 wrappers) and F21 (Gyre 4 wrappers). All 12 wrappers are written by refresh, none are checked by validator or doctor. **Re-scored I43: R=8 (was 4), Score 6.4 (was 3.2)** to reflect the corrected reach. The same 1-function fix sketched in I43 closes all three F-rows simultaneously. Sub-components: **R=8, I=2, C=80%, E=2 → 6.4**.
- **F8 (Artifacts version-stamp post-check absence) is a real GAP** — promoted as **I46** (decisively non-trivial: requires a new function, an import, AND >3 added lines + a regression test). F9 (Enhance version-stamp) folds into the same I46 because the root cause is identical.
- **Story 7.2's `checkModuleSkillWrappers` duplicates `validateEnhanceModule` Check 6** ([validator.js:464-469](../../scripts/update/lib/validator.js#L464-L469)) for the Enhance module AND `validateArtifactsModule` Check 5 ([validator.js:560-565](../../scripts/update/lib/validator.js#L560-L565)) for the Artifacts module. Not a bug — both checks pass on healthy installs — but the doctor and validator have parallel implementations of the same wrapper-existence check **on both sides**. Plus the doctor has NO menu-patch presence check for Enhance — only the validator catches a reverted menu patch. Both observations are bundled as **I47** (the F2 missing-doctor-menu-patch issue + the F5 parallel-coverage consolidation question).

The audit's biggest message: the install pipeline is **heterogeneous by module**. Vortex/Gyre go through the global validator (`validateAgentFiles`, `validateWorkflows`) for Vortex but **NOT for Gyre** (F3 + F16 + F17 — no `validateGyreModule` exists); Enhance/Artifacts have dedicated `validateXxxModule` functions; team-factory only has agent-file existence checks (no submodule-level validation). Adding a new module today would inherit *none* of these patterns automatically — the next module's PR has to manually wire validation into all three files. The audit recommends a future epic to extract a shared `ModuleContract` interface that any new module must implement. **Not filed as a discrete I-item** because it's a structural redesign, not a bug.

---

## Methodology

For each of the three audit-target files, the audit:
1. Read the file end-to-end (no skimming).
2. Catalogued every flag-gated `if (...)` branch in `refresh-installation.js` that gates a copy/write/patch action (not bookkeeping or logging).
3. For each branch, traced the corresponding check (if any) in `validator.js` and `convoke-doctor.js`.
4. Cross-referenced field-level coverage: not "does the validator check this workflow?" but "does the validator check every field that refresh consumes?"
5. Self-verified line refs by re-grepping each cited file:line at audit time (Task 3.4 from the story spec — see Verified column).

---

## Excluded from analysis

**`isSameRoot` dev-mode skip** ([refresh-installation.js:38](../../scripts/update/lib/refresh-installation.js#L38) and ~13 usage sites). This is a packaging optimization that skips file copies when the dev repo IS the package source — NOT a behavioral contract. Validator and doctor SHOULD check `projectRoot` in both dev and prod modes regardless, and they do. Including `isSameRoot` as an F-row would pollute the catalogue with a guaranteed N/A.

---

## Flag-gated branches catalogue

| # | Flag | Refresh loc | Refresh action | Ungated action | Validator counterpart | Doctor counterpart | Verdict | Verified |
|---|------|-------------|----------------|----------------|------------------------|---------------------|---------|----------|
| **F1** | `EXTRA_BME_AGENTS` iteration (`!isSameRoot`) | [refresh-installation.js:96-119](../../scripts/update/lib/refresh-installation.js#L96-L119) | Wholesale copy of each submodule directory under `_bmad/bme/{submodule}/` (e.g., `_team-factory/`); idempotent remove-then-copy | Skip with log | [validator.js:208-225](../../scripts/update/lib/validator.js#L208-L225) — `validateManifest` checks each agent file exists on disk | none — doctor's `discoverModules()` scans config.yaml-bearing dirs (not the registry array — if a future EXTRA_BME_AGENTS submodule lacks `config.yaml`, the doctor would silently miss it) | **MIXED** (validator covers, doctor only catches via config.yaml presence — not a true gate-respect; folded into I43 because it's the same "registry vs config.yaml" mismatch) | ✓ |
| **F2** | Enhance `workflow.target_agent` menu-patching loop | [refresh-installation.js:172-223](../../scripts/update/lib/refresh-installation.js#L172-L223) | For each Enhance workflow: read target agent, idempotency-check patch presence, build `<item>` tag, insert before `</menu>`, write file | Empty array (skipped via `isSameRoot ? [] : ...` ternary) | [validator.js:443-453](../../scripts/update/lib/validator.js#L443-L453) — Check 3 of `validateEnhanceModule`: opens target agent file, asserts `patchName` substring is present | none — doctor's `checkModuleConfig`/`checkModuleWorkflows` check structure but not menu-patch presence | **MIXED** (validator covers, doctor doesn't) | ✓ |
| **F3** | Gyre config-merge gate (`!isSameRoot && fs.existsSync(gyreConfigSource)`) | [refresh-installation.js:343-354](../../scripts/update/lib/refresh-installation.js#L343-L354) | Merge `_gyre/config.yaml` (preserves user prefs); calls `assertVersion` + `mergeConfig` + `writeConfig`; stamps version | Skip (no changes, no log on dev) | none — there is no `validateGyreModule` in validator.js | none — doctor's `discoverModules()` finds the file but no Gyre-specific validation runs | **GAP** → I44 | ✓ |
| **F4** | Gyre README copy gate (`!isSameRoot && fs.existsSync(gyreReadmeSource)`) | [refresh-installation.js:359-363](../../scripts/update/lib/refresh-installation.js#L359-L363) | Copy `_gyre/README.md` to project | Skip with no log | none | none | **N/A** (README absence is operator-visible at runtime; not a behavioral contract) | ✓ |
| **F5** | Enhance config-existence + skill-registration gate (`enhanceConfig && !isSameRoot`) | [refresh-installation.js:658-702](../../scripts/update/lib/refresh-installation.js#L658-L702) | For each Enhance workflow: copy SKILL.md from package source; append rows to `workflow-manifest.csv` and `skill-manifest.csv` if not present | Log "skipped (dev environment)" | [validator.js:464-469](../../scripts/update/lib/validator.js#L464-L469) — Check 6 of `validateEnhanceModule`: asserts `.claude/skills/bmad-enhance-${wf.name}/SKILL.md` exists | [convoke-doctor.js:367-422](../../scripts/convoke-doctor.js#L367-L422) — `checkModuleSkillWrappers` resolves through manifest, checks the same file | **SAFE** — both validator and doctor cover. **Note:** F5 is counted as SAFE in the tally (no coverage gap). The "parallel coverage" observation that feeds I47 is a *consolidation opportunity* (one source of truth vs two), NOT a coverage gap — F5 is not double-counted in the verdict distribution. | ✓ |
| **F6** | Standalone bme agent skill-generation loop (`for (const agent of EXTRA_BME_AGENTS)`) | [refresh-installation.js:632-655](../../scripts/update/lib/refresh-installation.js#L632-L655) | Generate `.claude/skills/bmad-agent-bme-{id}/SKILL.md` thin wrapper for each EXTRA_BME_AGENTS entry | (no gate — runs unconditionally for every entry) | [validator.js:218-225](../../scripts/update/lib/validator.js#L218-L225) — checks the **agent .md file** exists at `_bmad/bme/{submodule}/agents/{id}.md`, NOT the skill wrapper at `.claude/skills/bmad-agent-bme-{id}/SKILL.md` | none — `convoke-doctor.js` has zero references to `bmad-agent-bme-` | **GAP** → I43 (highest-impact) | ✓ |
| **F7** | Artifacts skill-wrapper generation gate (`artifactsConfig && !isSameRoot`) + inline `workflow.standalone === true` filter | [refresh-installation.js:709-743](../../scripts/update/lib/refresh-installation.js#L709-L743) | For each `standalone:true` Artifacts workflow: remove + recreate `.claude/skills/{workflow.name}/`, copy SKILL.md from package; non-standalone workflows are logged + skipped | Log "skipped (dev environment)" | [validator.js:549-565](../../scripts/update/lib/validator.js#L549-L565) — `validateArtifactsModule` mirrors the inline filter (`if (wf.standalone !== true) continue;`) and asserts entry-point file + skill wrapper at `.claude/skills/{wf.name}/SKILL.md` | [convoke-doctor.js:367-422](../../scripts/convoke-doctor.js#L367-L422) — `checkModuleSkillWrappers` covers in-manifest workflows | **SAFE** (Story 6.6's fix is in place; standalone filter mirrored on both sides) | ✓ |
| **F8** | Artifacts config-load + version-stamp gate (`fs.existsSync(artifactsConfigPath)` → `if (artifactsConfig) { if (!isSameRoot) }`) | [refresh-installation.js:247-279](../../scripts/update/lib/refresh-installation.js#L247-L279) (inner write at lines [261-267](../../scripts/update/lib/refresh-installation.js#L261-L267)) | Parse `_artifacts/config.yaml`; copy directory tree; `assertVersion(version, 'artifacts')` + `YAML.parseDocument` + `acDoc.set('version', version)` + write | Log "skipped (dev environment)" or "config not found" | [validator.js:512-529](../../scripts/update/lib/validator.js#L512-L529) — checks config.yaml exists + parses + has workflows array, but **does NOT check the `version` field is present or matches package version** | [convoke-doctor.js:486-512](../../scripts/convoke-doctor.js#L486-L512) — `checkVersionConsistency` walks all module configs and reports mismatch, but only AFTER refresh has run; if refresh's version-stamp silently failed, doctor would catch the mismatch on the NEXT run, not the current one | **GAP** → I46 (decisively non-trivial: requires a new function + import + >3 added lines + regression test) | ✓ |
| **F9** | Enhance config-load + version-stamp gate (`fs.existsSync(enhanceConfigPath)` → `if (enhanceConfig) { if (!isSameRoot) }`) | [refresh-installation.js:141-164](../../scripts/update/lib/refresh-installation.js#L141-L164) (inner write at lines [152-157](../../scripts/update/lib/refresh-installation.js#L152-L157)) | Same pattern as F8 but for Enhance: parse, copy tree, `assertVersion(version, 'enhance')` + version-stamp via `YAML.parseDocument` | Same as F8 | [validator.js:393-429](../../scripts/update/lib/validator.js#L393-L429) — `validateEnhanceModule` checks `config.version` is present (line 409 — `if (!config.version) missing.push('version')`) but does NOT verify it matches package version | Same as F8 | **GAP** for staleness (validator catches the missing-field sub-failure; the stale-value sub-failure is uncovered by both validator and doctor) → folded into I46 | ✓ |
| **F10** | Deprecated agent removal loop | [refresh-installation.js:60-68](../../scripts/update/lib/refresh-installation.js#L60-L68) | Remove `empathy-mapper.md` and `wireframe-designer.md` if present | (no gate — runs unconditionally; idempotent) | none — validator doesn't check for *absence* of deprecated files | none | **N/A** (deprecated-file absence is not a contract; running refresh always reasserts the cleanup) | ✓ |
| **F11** | Stale skill cleanup (`fs.existsSync(skillsDir)` → filter `bmad-agent-bme-*` directories not in current registry) | [refresh-installation.js:566-581](../../scripts/update/lib/refresh-installation.js#L566-L581) | For each existing `.claude/skills/bmad-agent-bme-*` directory not matching the current `AGENTS + GYRE_AGENTS + EXTRA_BME_AGENTS` set, `fs.remove` it | Skip if `.claude/skills/` doesn't exist | none — validator's `validateManifest` doesn't check for *absence* of stale wrappers | none | **N/A** (stale-wrapper presence isn't a correctness bug; refresh always reasserts) | ✓ |
| **F12** | Vortex `mergeConfig` + `writeConfig` (no `isSameRoot` gate) | [refresh-installation.js:366-379](../../scripts/update/lib/refresh-installation.js#L366-L379) | Merge `_vortex/config.yaml`, `assertVersion` defense-in-depth, write merged config | (no gate — always runs) | [validator.js:66-98](../../scripts/update/lib/validator.js#L66-L98) — `validateConfigStructure` parses Vortex config and runs `configMerger.validateConfig` | [convoke-doctor.js:150-193](../../scripts/convoke-doctor.js#L150-L193) — `checkModuleConfig` per-module via `discoverModules` | **SAFE** | ✓ |
| **F13** | Workflow-manifest CSV append (`fs.existsSync(wfManifestPath)`) | [refresh-installation.js:672-683](../../scripts/update/lib/refresh-installation.js#L672-L683) | If `workflow-manifest.csv` exists and the canonicalId substring isn't already present, append a row | Log "manifest not found, skipping" | none — validator has no `workflow-manifest.csv` check | none | **GAP** → I45 | ✓ |
| **F14** | Vortex agent copy loop (`!isSameRoot`) | [refresh-installation.js:45-57](../../scripts/update/lib/refresh-installation.js#L45-L57) | For each `AGENT_FILES`: copy from package source to project | Log "skipped (dev environment)" | [validator.js:105-140](../../scripts/update/lib/validator.js#L105-L140) — `validateAgentFiles` asserts each file exists | [convoke-doctor.js:195-236](../../scripts/convoke-doctor.js#L195-L236) — `checkModuleAgents` (config-driven) | **SAFE** | ✓ |
| **F15** | Vortex workflow copy loop (`!isSameRoot`) | [refresh-installation.js:75-93](../../scripts/update/lib/refresh-installation.js#L75-L93) | For each `WORKFLOW_NAMES`: remove + recreate workflow directory | Log "skipped (dev environment)" | [validator.js:147-182](../../scripts/update/lib/validator.js#L147-L182) — `validateWorkflows` asserts each `workflow.md` exists | [convoke-doctor.js:238-267](../../scripts/convoke-doctor.js#L238-L267) — `checkModuleWorkflows` (config-driven) | **SAFE** | ✓ |
| **F16** | Gyre agent copy loop (`!isSameRoot`) | [refresh-installation.js:291-303](../../scripts/update/lib/refresh-installation.js#L291-L303) | For each `GYRE_AGENT_FILES`: copy from package source | Log "skipped (dev environment)" | none — `validateAgentFiles` only iterates Vortex `AGENT_FILES`, not Gyre. **(F3 family — same root cause: no Gyre validator function.)** | [convoke-doctor.js:195-236](../../scripts/convoke-doctor.js#L195-L236) — `checkModuleAgents` config-driven (catches Gyre's declared agents but not the registry contract) | **MIXED** → folded into I44 | ✓ |
| **F17** | Gyre workflow copy loop (`!isSameRoot`) | [refresh-installation.js:310-326](../../scripts/update/lib/refresh-installation.js#L310-L326) | For each `GYRE_WORKFLOW_NAMES`: remove + recreate workflow directory | Log "skipped (dev environment)" | none — same as F16 | [convoke-doctor.js:238-267](../../scripts/convoke-doctor.js#L238-L267) — `checkModuleWorkflows` config-driven | **MIXED** → folded into I44 | ✓ |
| **F18** | Gyre contracts copy gate (`fs.existsSync(gyreContractsSource) && !isSameRoot`) | [refresh-installation.js:331-338](../../scripts/update/lib/refresh-installation.js#L331-L338) | Copy `_gyre/contracts/` directory to project | Skip silently | none | none | **N/A** (contracts dir is informational; refresh-driven, no contract surface) | ✓ |
| **F19** | User guides copy loop + backup sub-gate (`!isSameRoot` outer + `backupGuides && fs.existsSync(dest)` inner) | [refresh-installation.js:530-551](../../scripts/update/lib/refresh-installation.js#L530-L551) | For each `USER_GUIDES`: optional `.bak` of existing dest, then copy from package | Log "skipped (dev environment)" | none — guides are user-editable, not validated | none | **N/A** (user-editable docs; validator/doctor SHOULD NOT enforce content drift) | ✓ |
| **F20** | Vortex agent skill-generation loop (unconditional, like F6) | [refresh-installation.js:583-605](../../scripts/update/lib/refresh-installation.js#L583-L605) | For each `AGENTS`: generate `.claude/skills/bmad-agent-bme-{id}/SKILL.md` thin wrapper (7 wrappers) | (no gate) | none — `validateManifest` checks the source `.md` file but not the wrapper | none — `convoke-doctor.js` has zero references to `bmad-agent-bme-` (verified by grep) | **GAP** → I43 (same root cause as F6, **same fix function closes both**) | ✓ |
| **F21** | Gyre agent skill-generation loop (unconditional, like F6) | [refresh-installation.js:608-630](../../scripts/update/lib/refresh-installation.js#L608-L630) | For each `GYRE_AGENTS`: generate `.claude/skills/bmad-agent-bme-{id}/SKILL.md` thin wrapper (4 wrappers) | (no gate) | none — same as F20 | none — same as F20 | **GAP** → I43 (same root cause as F6 + F20) | ✓ |
| **F22** | Customize file generation gate (`!fs.existsSync(filePath)`) | [refresh-installation.js:777-785](../../scripts/update/lib/refresh-installation.js#L777-L785) | For each `[...AGENTS, ...GYRE_AGENTS]`: write `bme-{agentname}.customize.yaml` from template if not already present | Skip silently if user file exists | none | none | **N/A** (idempotency gate that protects user customizations from overwrite — by design must NOT be validated) | ✓ |
| **F23** | Agent-manifest.csv regeneration (unconditional, read-merge-write) | [refresh-installation.js:381-523](../../scripts/update/lib/refresh-installation.js#L381-L523) (write at [line 521](../../scripts/update/lib/refresh-installation.js#L521)) | Read existing manifest, filter out bme rows (preserving non-bme), rebuild bme rows from `AGENTS + GYRE_AGENTS + EXTRA_BME_AGENTS`, write merged result back | (no gate) | [validator.js:208-225](../../scripts/update/lib/validator.js#L208-L225) — `validateManifest` checks each agent ID is present in the manifest content via raw `String.includes()` substring scan (verified at [validator.js:209-210](../../scripts/update/lib/validator.js#L209-L210); same broken-substring mechanism that **I15** is filed to fix) | none — `convoke-doctor.js` has zero references to `agent-manifest` (verified by grep; only `skill-manifest.csv` is touched) | **MIXED** → promoted as **I48** (Round 3) — split out from I47 because the fix shape is cross-module (top-level `checkAgentManifest` or CSV-parse upgrade), not module-loop-scoped like I47. **Bundles with I15** which fixes the same `validateManifest` substring weakness. | ✓ (Round 2 EH addition, Round 3 EH refinement) |
| **F24** | Legacy `.claude/commands/bmad-agent-bme-*` cleanup loop | [refresh-installation.js:553-562](../../scripts/update/lib/refresh-installation.js#L553-L562) | If `.claude/commands/` exists, iterate and `fs.remove` any `bmad-agent-bme-*` files | Skip silently if directory absent | none | none | **N/A** (destructive cleanup of obsolete pre-skill-format files; validator/doctor correctly do not check "absence of removed files"; refresh always reasserts) | ✓ (Round 3 EH addition) |
| **F25** | Stale `.claude/skills/bmad-agent-bme-*` cleanup loop | [refresh-installation.js:572-581](../../scripts/update/lib/refresh-installation.js#L572-L581) | If `.claude/skills/` exists, iterate `bmad-agent-bme-*` directories and `fs.remove` any not in current `AGENTS + GYRE_AGENTS + EXTRA_BME_AGENTS` registry | Skip silently if directory absent | none | none | **N/A** (destructive cleanup of stale wrappers; complementary to F11; refresh always reasserts the current registry) | ✓ (Round 3 EH addition) |

**Catalogue total:** **25 flag-gated branches** (F1-F25). Verdict distribution: **5 SAFE / 7 GAP / 5 MIXED / 8 N/A**. Breakdown: SAFE = F5, F7, F12, F14, F15. GAP = F3, F6, F8, F9, F13, F20, F21. MIXED = F1, F2, F16, F17, F23. N/A = F4, F10, F11, F18, F19, F22, F24, F25.

---

## Identified GAPs

### GAP-1 (F6 + F20 + F21 + F1): All 12 bme agent skill wrappers — promoted to **I43**

**Scope expansion (Round 1 review patch):** the original GAP-1 only catalogued F6 (EXTRA_BME_AGENTS, 1 wrapper). The Edge Case Hunter review revealed that the **same GAP shape** applies to F20 (Vortex 7 agents, lines 583-605) and F21 (Gyre 4 agents, lines 608-630). All 12 agent skill wrappers are written by `refresh-installation.js` and **none** are checked by `validator.js` or `convoke-doctor.js` (verified: `grep "bmad-agent-bme-" scripts/convoke-doctor.js` returns zero matches). F1 (the EXTRA_BME_AGENTS submodule iteration) has the same registry-vs-config.yaml mismatch that causes the doctor to silently miss new submodules. All four F-rows fold into a single fix.

**Failure mode:**
> A user manually deletes `.claude/skills/` (or their CI image only restores tracked files, or `convoke-update` writes the wrappers but a subsequent `bmad-update` overwrites them). They run `convoke-doctor` and see "All checks passed." They then try to invoke any of the 7 Vortex agents (Emma, Isla, Mila, Liam, Wade, Noah, Max), 4 Gyre agents, or the team-factory agent and Claude Code can't find the skill — the slash command silently fails. The doctor's existence is supposed to prevent exactly this drift, but the current implementation only checks the source `.md` files, not their `.claude/skills/` wrappers.

**Why it's not a trivial fix:**
- Adding the check requires a new doctor function (~15 lines) OR extending `checkModuleSkillWrappers` to also handle agent wrappers (~10 lines).
- Either approach exceeds the AC #6 trivial-patch threshold of ≤3 added lines + needs a regression test file.

**Recommended fix** (sketch — for the follow-up story):

```javascript
// Add to convoke-doctor.js after checkModuleSkillWrappers:
function checkModuleAgentSkillWrappers(mod, projectRoot) {
  const label = `${mod.name} agent skill wrappers`;
  const agents = mod.config.agents || [];
  if (agents.length === 0) return null;
  const failures = agents
    .filter(id => !fs.existsSync(path.join(projectRoot, '.claude/skills', `bmad-agent-bme-${id}`, 'SKILL.md')))
    .map(id => `Missing agent skill wrapper: .claude/skills/bmad-agent-bme-${id}/SKILL.md`);
  if (failures.length > 0) {
    return { name: label, passed: false, error: failures.join('; '), fix: 'Run convoke-update to regenerate agent skill wrappers' };
  }
  return { name: label, passed: true, info: `${agents.length} agent skill wrappers present` };
}
```

**Verified scope:** the function above closes F6 + F20 + F21 simultaneously because all three module config.yaml files declare their agents in `mod.config.agents` (Vortex declares 7, Gyre declares 4, team-factory declares 1 — total 12). Reading each config.yaml at audit time confirmed this. The same function is also a partial mitigation for F1 because it would surface a broken team-factory install where the wrapper exists but the registry doesn't know about it.

**Triage:** `[PROMOTE-TO-BACKLOG]` — filed as **I43** with **R=8** (was R=4 before review found F20+F21; corrected reach reflects all 12 wrappers across all 3 module groups), **I=2**, **C=80%**, **E=2** → **Score 6.4** (was 3.2). One of the highest-priority items in the entire backlog.

---

### GAP-2 (F3 + F16 + F17): Gyre validation absence — promoted to **I44**

**Scope expansion (Round 1 review patch):** the original GAP-2 only catalogued F3 (Gyre config-merge gate). The Edge Case Hunter review added F16 (Gyre agent copy loop, lines 291-303) and F17 (Gyre workflow copy loop, lines 310-326). All three F-rows have the same root cause: **no `validateGyreModule` function exists in `validator.js`**. Folded into a single I44.

**Failure mode:**
> Refresh successfully copies `_gyre/config.yaml`, `_gyre/agents/`, `_gyre/workflows/`, and version-stamps the config. But `_gyre/agents/` is missing one of the GYRE_AGENT_FILES (e.g., a manual `rm` between installs). The validator never runs a `validateGyreModule` — `validateAgentFiles` only iterates Vortex `AGENT_FILES`, not Gyre. The doctor's `checkModuleAgents` runs against the discovered Gyre module but only checks the `agents` array declared in Gyre's config.yaml against actual files — which catches *some* drift but doesn't validate the full GYRE_AGENT_FILES contract from the registry.

**Why it's not a trivial fix:**
- Requires a new `validateGyreModule` function in `validator.js` (likely 30-50 lines mirroring the Enhance/Artifacts pattern).
- Requires wiring it into `validateInstallation` at the top of the file.
- Requires regression tests under `tests/lib/`.
- Definitely > 3 lines.

**Triage:** `[PROMOTE-TO-BACKLOG]` — filed as **I44** (RICE: R=2 Gyre install paths, I=1.5 — drift is recoverable via `convoke-update`, C=70%, E=3 → Score ~0.7).

---

### GAP-3 (F13): Workflow-manifest CSV registration drift — promoted to **I45**

**Failure mode:**
> Refresh appends a row to `workflow-manifest.csv` for each Enhance workflow, gated on "if not already present" via substring check. If the substring check returns a false negative (e.g., the canonicalId is a prefix of another entry), the row is appended a second time and the manifest now has duplicates. No validator/doctor catches duplicate rows; consumers reading the manifest may pick the wrong row. Inverse failure: if the manifest is corrupted/truncated and the entry vanishes, refresh re-appends — but only on the next refresh; in between, `convoke-portfolio` and other manifest consumers would silently misbehave.

**Why it's not a trivial fix:**
- Requires a new validator function or doctor check.
- The substring-based dedup itself is a known issue (already filed earlier in the backlog as I15 — "validateManifest CSV parsing — replace substring matching"). I45 is the *missing-validator-check* aspect, complementary to I15's *broken-dedup* aspect.

**Triage:** `[PROMOTE-TO-BACKLOG]` — filed as **I45** (RICE: R=1 manifest, I=0.5 — current consumers are tolerant, C=60%, E=2 → Score ~0.15). Low priority; flagged for I15 batch.

---

### GAP-4 (F8 + F9): Version-stamp post-check absence — promoted to **I46**

**Failure mode:**
> Refresh successfully parses Artifacts (or Enhance) config.yaml, calls `assertVersion(version, 'artifacts')`, runs `YAML.parseDocument`, calls `acDoc.set('version', version)`, writes the file. But the write happens *after* `acDoc.set` — what if the write itself fails partway through (disk full, permission flip mid-write)? `fs.writeFileSync` is non-atomic. The next `convoke-doctor` run would catch the version mismatch via `checkVersionConsistency` ([convoke-doctor.js:486-512](../../scripts/convoke-doctor.js#L486-L512)), but the *current* refresh run reports success because the version-stamp call returned without throwing.

**Why it's decisively non-trivial (not borderline):**
- A post-check line `assertVersion(yaml.load(fs.readFileSync(targetArtifactsConfig)).version, 'artifacts-postcheck')` requires a re-read of the file.
- The re-read means a new `yaml.load` call — but `js-yaml` is already imported, so no new import is needed. **Correction:** the import argument from the original audit was wrong; the real disqualifier is the I/O round-trip + regression test infrastructure, not an import.
- Total addition is ~5 lines per site × 2 sites + a regression test file → decisively exceeds the AC #6 trivial-patch threshold.

**Triage:** `[PROMOTE-TO-BACKLOG]` — filed as **I46** (RICE: R=2 modules × 1 version-stamp call each, I=1 — partial-write is rare, C=50%, E=2 → Score ~0.5). Low priority; complements **I39** (non-atomic writes filed in 2026-04-09 triage — same root cause). F8 and F9 fold into the same I46 because the root cause is identical.

---

### MIXED-1 (F2): Enhance menu-patch coverage — promoted to **I47** (consolidation)

**Failure mode (parallel coverage, not a true gap):**
> `validateEnhanceModule` Check 3 ([validator.js:443-453](../../scripts/update/lib/validator.js#L443-L453)) verifies the menu patch was applied to the target agent file. `convoke-doctor` has no equivalent — its `checkModuleConfig` and `checkModuleWorkflows` check structure but not patch presence. This is currently SAFE because the validator catches it during `npm test` lib stages, but the *doctor* (which is the operator-facing diagnostic) silently passes a broken Enhance install where the menu patch was reverted.

**Recommended consolidation (sketch):**

```javascript
// Add to convoke-doctor.js per-module loop:
function checkEnhanceMenuPatches(mod, projectRoot) {
  if (mod.name !== '_enhance') return null;
  const failures = (mod.config.workflows || [])
    .filter(wf => wf.target_agent && wf.menu_patch_name)
    .filter(wf => {
      const agentPath = path.join(projectRoot, '_bmad', wf.target_agent);
      if (!fs.existsSync(agentPath)) return false;
      return !fs.readFileSync(agentPath, 'utf8').includes(wf.menu_patch_name || wf.name);
    })
    .map(wf => `Menu patch "${wf.menu_patch_name || wf.name}" missing from ${wf.target_agent}`);
  if (failures.length > 0) return { name: '_enhance menu patches', passed: false, error: failures.join('; '), fix: 'Run convoke-update to re-apply menu patches' };
  return null;
}
```

**Triage:** `[PROMOTE-TO-BACKLOG]` — filed as **I47** (RICE: R=1 module × 1 workflow today, I=1 — Enhance is opt-in but production-critical for users who use it, C=70%, E=2 → Score ~0.35). I47 bundles **two distinct findings** under one ID:
1. **F2 finding (this section):** the doctor has no menu-patch presence check — only the validator catches a reverted patch. Fix sketch above adds `checkEnhanceMenuPatches` to the doctor.
2. **F5 finding (parallel coverage):** `validateEnhanceModule` Check 6 ([validator.js:464-469](../../scripts/update/lib/validator.js#L464-L469)) AND `validateArtifactsModule` Check 5 ([validator.js:560-565](../../scripts/update/lib/validator.js#L560-L565)) BOTH check the same skill wrappers that `checkModuleSkillWrappers` checks. Not a bug — both pass on healthy installs — but a maintainability surface area. The bundled I47 also asks whether to consolidate (one source of truth) or formalize the split with explicit comments.

---

## Story 7.2 wrapper-check coverage

This section addresses **AC #4 + AC #10** of Story 7.3.

As of 2026-04-09, `_bmad/_config/skill-manifest.csv` contains exactly **3 in-manifest bme workflows** (verified by reading the file at audit time):

| Manifest row | Module | Source path | Doctor (`checkModuleSkillWrappers`) | Validator counterpart (parallel coverage) |
|--------------|--------|-------------|--------------------------------------|--------------------------------------------|
| `bmad-migrate-artifacts` | `_artifacts` | `_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/SKILL.md` | ✅ checks `.claude/skills/bmad-migrate-artifacts/SKILL.md` | ✅ `validateArtifactsModule` Check 5 ([validator.js:560-565](../../scripts/update/lib/validator.js#L560-L565)) checks **the same path** |
| `bmad-portfolio-status` | `_artifacts` | `_bmad/bme/_artifacts/workflows/bmad-portfolio-status/SKILL.md` | ✅ same as above | ✅ `validateArtifactsModule` Check 5 — **same path** |
| `bmad-enhance-initiatives-backlog` | `_enhance` | `_bmad/bme/_enhance/workflows/initiatives-backlog/SKILL.md` | ✅ checks `.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md` | ✅ `validateEnhanceModule` Check 6 ([validator.js:464-469](../../scripts/update/lib/validator.js#L464-L469)) checks **the same path** |

**All 3 in-manifest workflows have BOTH validator AND doctor coverage of the same wrapper file.** This is the parallel-coverage finding bundled into I47 — not a bug, but a maintainability surface area worth consolidating in a follow-up.

**Per-module verdict (binding per AC #10):**

| Module | Should `checkModuleSkillWrappers` apply? | Rationale |
|--------|-----------------------------------------|-----------|
| **`_vortex`** (Vortex) | ❌ NO | Vortex workflows are NOT standalone skills. They're agent-menu items invoked by the 7 Vortex agents. The `.claude/skills/bmad-agent-bme-{vortexId}/SKILL.md` wrappers cover the agents, not the workflows. |
| **`_gyre`** (Gyre) | ❌ NO | Same pattern as Vortex — Gyre workflows are agent-menu items for the 4 Gyre agents. |
| **`_team-factory`** (Loom Master / team-factory) | ❌ NO | The team-factory module's "workflows" are step-driven scaffolding routines orchestrated by the Forge Master agent, not standalone slash-command skills. None are in skill-manifest.csv and none should be — verified by reading the manifest end-to-end (no `bmad-team-factory-*` rows). |
| **`_enhance`** (Enhance) | ✅ YES | Enhance's only workflow today (`initiatives-backlog`) IS a standalone skill with a manifest row. **Plus** the validator (`validateEnhanceModule` Check 6) ALREADY checks the same wrapper — see I47 for the consolidation question. |
| **`_artifacts`** (Artifacts) | ✅ YES | Both Artifacts workflows are standalone skills with manifest rows. The validator (`validateArtifactsModule` Check 5) ALSO checks the same wrappers — same parallel-coverage question as Enhance. |

**Conclusion:** The Story 7.2 manifest-as-opt-in semantics are correct. There is no module today where `checkModuleSkillWrappers` SHOULD apply but currently doesn't, and no missing manifest row.

**Side-effect finding (folded into I47):** the **doctor + validator both check the same Enhance and Artifacts wrappers**. Neither is wrong — they're parallel checks at different levels (`validator.js` runs during `npm test`; `convoke-doctor.js` is operator-invoked). But it's a maintainability surface area that the audit recommends consolidating in I47.

---

## Limitations

This audit does NOT cover:
- **Migration history correctness** — Story 7.1 added regression tests for the version-stamp + comment-preservation paths; this audit assumes those tests are sufficient.
- **`convoke-version.js`** — CLI helper that reads versions but doesn't write or modify install state.
- **`convoke-install.js`** — first-time install (vs. refresh). The install path has its own gates that arguably warrant a similar audit, but Story 7.3 was scoped to refresh.
- **`config-merger.js` internals** — the YAML round-trip + sentinel pattern from Story 7.1. Story 7.1's tests already cover the contract surface.
- **Upstream BMAD module validation** (BMM, TEA, CIS, BMB, WDS) — the audit only covers the Convoke-managed bme submodules. The 130+ rows in `skill-manifest.csv` for upstream modules are out of scope.

---

## Next steps

1. **I43 (highest priority — RICE 6.4 after Round 1 review)** — Add `checkModuleAgentSkillWrappers` to `convoke-doctor.js` (or extend `checkModuleSkillWrappers`). This single function closes F6 + F20 + F21 simultaneously (all 12 bme agent skill wrappers across Vortex, Gyre, and team-factory) and partially mitigates F1.
2. **Story 7.4** — Orphan skill-wrapper cleanup. Story 7.4 depends on this audit's catalogue (per the epic file's note) so it can build the conservative-removal allowlist from F1-F25's covered surface area. The team-factory pattern (F11/F25) is the closest precedent for the orphan sweep Story 7.4 will add.
3. **I47 (medium priority)** — Bundle: (a) add `checkEnhanceMenuPatches` to the doctor (closes F2 — currently the validator catches reverted patches but the doctor doesn't), AND (b) decide whether to consolidate the parallel `checkModuleSkillWrappers` ↔ `validateEnhanceModule` Check 6 + `validateArtifactsModule` Check 5 implementations.
4. **I48 (bundles with I15)** — Agent-manifest.csv doctor check + CSV-parse validator upgrade. Closes F23. The fix shape is cross-module (not module-loop) so it was split from I47 in Round 3. I15 already addresses the same substring-matching weakness in `validateManifest`; bundling I48 with I15 avoids double work.
5. **I44 + I46** — Defer until next Epic 7-style debt sprint. Both are real but low-impact. I44 closes F3 + F16 + F17 (all Gyre validation gaps); I46 closes F8 + F9 (version-stamp post-check absence).
6. **`ModuleContract` future epic (NOT filed as a discrete I-item)** — The audit's biggest *structural* finding: each Convoke module wires validation in a different place, with no shared interface. A future epic could extract a `ModuleContract` abstraction (declared in each module's config.yaml) so `validator.js` and `convoke-doctor.js` can drive their checks from a single declarative spec. This is a multi-story epic, not a single I-item, and is recorded here as a **planning-time observation** rather than a backlog item.

---

## Coverage matrix (sanity check)

| Module | Refresh (sites) | Validator (sites) | Doctor (sites) | Coverage |
|--------|-----------------|--------------------|----------------|----------|
| Vortex | F12 (config), F14 (agent copy), F15 (workflow copy), F20 (agent skill gen) | `validateConfigStructure`, `validateAgentFiles`, `validateWorkflows`, `validateManifest` | `checkModuleConfig`, `checkModuleAgents`, `checkModuleWorkflows` | ⚠ Partial — **F20 GAP (agent skill wrapper not validated)** |
| Gyre | F3 (config), F4 (README), F16 (agent copy), F17 (workflow copy), F18 (contracts), F21 (agent skill gen) | none — **F3+F16+F17 GAP (no `validateGyreModule`)** | `checkModuleConfig`, `checkModuleAgents`, `checkModuleWorkflows` (config-driven, but not registry-driven) | ⚠⚠ Partial — **F21 GAP + F3/F16/F17 GAP** |
| Enhance | F2 (menu patch), F5 (skill wrapper + manifest), F9 (config+version) | `validateEnhanceModule` (6 checks) | `checkModuleConfig`, `checkModuleWorkflows`, `checkModuleSkillWrappers` (in-manifest) | ✅ Full + **parallel coverage on F5** (I47 consolidation) — but **doctor missing F2 menu-patch check (I47 part 1)** |
| Artifacts | F7 (skill wrapper), F8 (config+version) | `validateArtifactsModule` (5 checks) | `checkModuleConfig`, `checkModuleWorkflows`, `checkModuleSkillWrappers` (in-manifest) | ✅ Full + **parallel coverage on F7** (I47 consolidation) — but **F8 staleness gap (I46)** |
| Standalone bme agents (team-factory) | F1 (submodule), F6 (agent skill gen) | `validateManifest` (agent file existence only) | `checkModuleConfig`, `checkModuleAgents` (config-driven, doesn't check skill wrapper) | ⚠ Partial — **F6 GAP (agent skill wrapper) + F1 doctor-misses-registry mismatch** |
| User-editable assets | F19 (guides + .bak) | none | none | N/A by design |
| Idempotency-protected user files | F22 (customize.yaml gen) | none | none | N/A by design (must NOT validate user customizations) |
| Cleanup operations | F10 (deprecated agents), F11 (stale skills) | none | none | N/A (refresh always reasserts) |
| Cross-module manifest | F23 (agent-manifest.csv regeneration) | `validateManifest` (substring scan only — see I15) | none — no manifest row-level check | ⚠ MIXED — promoted as **I48** (Round 3, split from I47; bundles with I15) |
| Legacy cleanup | F24 (commands cleanup), F25 (stale skills cleanup) | none | none | N/A by design (refresh always reasserts; Round 3 EH addition) |

---

## Self-verification (Task 3.4)

Every F-row's line ranges were re-grepped at audit time after the catalogue was assembled. The Verified column reflects this check. Any ✓ means the cited file:line still describes the gate as written.

