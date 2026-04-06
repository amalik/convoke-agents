# Changelog

All notable changes to Convoke will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.1.0] - 2026-04-06

### Added

- **Artifact Governance Migration** (`convoke-migrate-artifacts`) — Full transactional migration pipeline that renames artifacts to `{initiative}-{type}[-qualifier][-date].md` convention, injects frontmatter metadata, updates internal links, and generates a governance ADR. Supports dry-run (default), `--apply` with interactive confirmation, `--force` for automation, `--include` for scope control, and `--verbose` for cross-references.
- **Portfolio Intelligence** (`convoke-portfolio`) — Read-only initiative portfolio showing phase, status, next action, and context for every initiative. Features 4 inference rules (frontmatter, artifact-chain, git-recency, conflict-resolver), degraded mode for ungoverned artifacts, governance health score, WIP overload radar, `--filter` prefix filtering, `--sort last-activity`, `--verbose` inference trace, and terminal + markdown output formats.
- **Taxonomy Configuration** (`_bmad/_config/taxonomy.yaml`) — Single source of truth for initiative IDs, artifact types, and historical name aliases. Created automatically by `convoke-update` (migration 2.0.x/3.0.x-to-3.1.0) or `convoke-migrate-artifacts`.
- **convoke-doctor taxonomy validation** — 6 new health checks: file exists, valid YAML, structure, ID format, no duplicates, no initiative/type collisions.
- **convoke-update taxonomy merger** — Automatic taxonomy creation on upgrade from pre-3.1.0. Merges platform entries without overwriting user additions. Promotes user initiative IDs to platform when they become official (FR42).
- **convoke-check** (`npm run check`) — Local CI mirror that runs lint + unit + integration + Jest lib tests before push. Prevents CI failures from reaching GitHub Actions.
- **Workflow frontmatter adoption** — `bmad-create-prd` and `bmad-create-epics-and-stories` templates now include governance frontmatter fields (initiative, artifact_type, status, created, schema_version). Graceful degradation when taxonomy absent.
- **BMAD portfolio skill** (`.claude/skills/bmad-portfolio-status/`) — Thin wrapper invoking `convoke-portfolio --markdown` for chat/skill context.
- **Artifact rename map** — `artifact-rename-map.md` generated during migration with old-to-new filename mapping.
- **Governance ADR** — Migration generates `adr-artifact-governance-convention-{date}.md` documenting the naming convention and supersedes the previous repo organization ADR.

### Changed

- **Frontmatter schema v1** — All governed artifacts include: `initiative`, `artifact_type`, `created` (ISO date), `schema_version: 1`. Optional: `status` (draft/validated/superseded/active).
- **Shell injection prevention** — All `execSync` calls migrated to `execFileSync` with argument arrays across `artifact-utils.js` and `ensureCleanTree`.
- **convoke-doctor** — Now exports `checkTaxonomy` for testability; uses `require.main === module` guard.

### Infrastructure

- **320+ tests** across unit (Node built-in), integration, and Jest lib suites
- **50 FRs and 22 NFRs** addressed across 18 stories in 5 epics
- **5 retrospectives** with compounding process improvements

---

## [3.0.0] - 2026-03-25

### Added

- **Team Factory extension workflows** — Add Agent (`step-add-agent.md`) and Add Skill (`step-add-skill.md`) workflows for extending existing teams and agents
- **Appender modules** — `registry-appender.js`, `config-appender.js`, `csv-appender.js` for automated wiring when adding agents or skills to existing teams
- **Extension validator** — `validateSkillExtension()` and `buildSkillExtensionManifest()` for validating factory-generated extensions
- **Multi-team docs-audit** — `checkStaleReferences()` now validates against all registered teams (Vortex + Gyre) instead of only Vortex, eliminating false positives for Gyre references

### Fixed

- **docs-audit false positives** — 39 false-positive stale reference findings caused by audit only knowing Vortex counts (7 agents, 22 workflows). Now uses registry-driven valid count Sets for all teams.
- **Brand reference false positives** — Lines documenting the historical rename (`bmad-enhanced → convoke-agents`) no longer flagged as stale brand references

---

## [2.4.0] - 2026-03-15

### Added

- **Enhance module — Agent Skills architecture** — New module type alongside Teams. Skills add capabilities to existing agents via menu patching without modifying agent files.
- **Initiatives Backlog skill (PM agent)** — RICE-scored backlog management with 3 modes:
  - **Triage** — Ingest review findings, extract actionable items, propose RICE scores with two-gate validation, append to existing backlog (4 step files)
  - **Review** — Walk through existing items one at a time, rescore where priorities shifted, regenerate prioritized view (3 step files)
  - **Create** — Gather initiatives interactively, batch-score with RICE, generate complete backlog from scratch (4 step files)
- **Enhance module installer integration** — File copy, PM agent menu patching (`[IB] Initiatives Backlog`), 6-point verification in `convoke-doctor`, skill wrapper + manifest registration
- **ENHANCE-GUIDE.md** — Pattern documentation for module authors: directory structure, step file architecture, menu patching, config registration, verification integration
- **Enhance module validation** — `validateEnhanceModule()` with 6-point check: directory exists, entry point resolves, menu patch present, config valid, filesystem consistency, skill wrapper exists

### Changed

- **README** — Repositioned Convoke around two extensibility axes: Teams (new agents) and Skills (new capabilities). Full Enhance section with mode diagram, activation instructions, and link to pattern guide. Updated architecture diagram, install tree, and roadmap.

---

## [2.3.1] - 2026-03-15

### Fixed

- **Migration chaining bug** — `getMigrationsFor()` now walks the full migration chain instead of only matching the first hop. Users jumping multiple versions (e.g., `1.0.x` → `2.x`) previously skipped all intermediate migrations silently. The `1.5.x-to-1.6.0` config delta (Wave 3 agents) was being skipped for anyone upgrading from `1.0.x–1.4.x`.
- **README version badge** — Updated from stale `2.0.1` to current version
- **INSTALLATION.md** — Added missing `-p convoke-agents` to `npx` command in troubleshooting section
- **BMAD-METHOD-COMPATIBILITY.md** — Fixed wrong package name (`convoke` → `convoke-agents`) and added missing `-p convoke-agents` to all `npx` commands
- **Archived outdated docs** — PUBLISHING-GUIDE.md and TEST-PLAN-REAL-INSTALL.md marked as historical (contained legacy commands)

### Added

- **Chain traversal tests** — 10 new unit tests for migration chain resolution, parallel entry exclusion, and breaking change detection across chains
- **Multi-version integration test** — Verifies full `1.5.2 → current` update path with all 3 deltas executing and complete migration history

---

## [2.2.0] - 2026-03-14

### Changed

- **Agent activation migrated from commands to skills** — `.claude/commands/bmad-agent-bme-*.md` replaced by `.claude/skills/bmad-agent-bme-{id}/SKILL.md` (BMAD v6.1.0 format)
- **Agent manifest uses v6.1.0 12-column schema** — BME agents now populate all fields including `canonicalId`, `module`, `communicationStyle`, `capabilities`
- **Removed redundant `createAgentManifest()`** from installer — `refreshInstallation()` is now the single code path for manifest generation

### Added

- **`src/module.yaml`** — External module spec definition for future BMAD registration
- **Agent customize files** — `_bmad/_config/agents/bme-{name}.customize.yaml` generated on install (never overwritten)
- **Legacy command cleanup** — Automatically removes `.claude/commands/bmad-agent-bme-*` files from prior installs

### Removed

- **`_bmad/bme/_config/module.yaml`** — Stale legacy file with deprecated agent references deleted

---

## [2.0.0] - 2026-03-07

### Changed

- **Product renamed to Convoke.** Package name is now `convoke` on npm (`npm install convoke-agents`).
- **All CLI commands renamed** from `bmad-*` to `convoke-*`:
  - `convoke-install-vortex` (was `bmad-install-vortex-agents`)
  - `convoke-install` (was `bmad-install-agents`)
  - `convoke-update` (was `bmad-update`)
  - `convoke-version` (was `bmad-version`)
  - `convoke-doctor` (was `bmad-doctor`)
  - `convoke-migrate` (was `bmad-migrate`)
- **Migration path from v1.7.x** — Run `npm install convoke-agents && npx convoke-update` to migrate
- **`_bmad/` directory preserved** — All agent files, workflows, and user data remain in `_bmad/` for BMAD Method compatibility
- **Repository URL** updated to `github.com/amalik/convoke-agents`

---

## [1.7.1] - 2026-03-03

### Fixed

- **`convoke-update` failed to upgrade from 1.6.x to 1.7.0** — Missing `1.6.x-to-1.7.0` migration in registry caused "No migrations needed (versions compatible)" instead of running the upgrade. Added migration entry and no-op delta file.

---

## [1.7.0] - 2026-03-02

### Added

- **Docs Audit Tool** (`npm run docs:audit`) — Programmatic documentation quality checker with 5 check types:
  - Stale numeric references (detects outdated agent/workflow counts)
  - Broken internal links
  - Incomplete agent listing tables (with relationship table detection)
  - Internal naming convention leaks (`_vortex` in user-facing prose)
  - Forward-compatibility checks
- **P0 Content Correctness Test Suite** — 12 test files covering activation, voice consistency, content correctness, handoff contracts, and workflow structure for all 7 agents
- **18 production-quality workflow step files** for Wade's three remaining workflows:
  - `lean-experiment/steps/` — step-01-hypothesis through step-06-decide
  - `proof-of-concept/steps/` — step-01-risk through step-06-document
  - `proof-of-value/steps/` — step-01-value-hypothesis through step-06-document
- **7 comprehensive user guides** — Created/expanded guides for all 7 agents in `_bmad/bme/_vortex/guides/`
- **"Your First 15 Minutes" walkthrough** in README — 6-step guided onboarding from config to first artifact
- **Activation model explanation** in README — explains what agent files are and how Claude adopts personas
- **Config personalization step** in README Quick Start and installer output
- **`convoke-update` test suite** — 615+ lines covering upgrade flows, config merging, version detection
- **`convoke-version` test suite** — 377 lines covering version display, migration history, update detection
- **`docs-audit` test suite** — 539 lines covering all 5 check functions
- **7-agent journey example** — Complete busy-parents walkthrough demonstrating all 7 agents and handoff contracts
- **Structured feedback mechanism** — GitHub issue template for agent/workflow feedback

### Changed

- **CRITICAL: Fixed npm package bloat** — Package reduced from 1618 files / 9.7 MB to 242 files / 1.1 MB. The `files` field in `package.json` was too broad (`"_bmad/"`, `"_bmad-output/"`), shipping internal backups, migration logs, sprint artifacts, and all BMAD modules (bmm, cis, core, tea). Now precisely targets `"_bmad/bme/_vortex/"` only.
- **Config merger smart-merge** — `mergeConfig()` now preserves user-added agents and workflows during updates. Canonical entries maintain registry order; user-added entries are deduplicated and appended.
- **User guide invocation methods reordered** — Direct File Reading is now Method 1 (Recommended) in all 7 guides; Slash Command is Method 2 (BMAD Environments Only)
- **README overhaul** — Value proposition, visual Vortex diagram, agent output previews, Claude Code/Claude.ai activation instructions
- **Installer output** — Now shows numbered "Next Steps" including config personalization
- **Journey example condensed** — 944 to 888 lines, tightened transition sections
- **docs/agents.md** — Updated agent count references, handoff contract documentation
- **docs/faq.md** — Expanded with workflow and agent questions
- **INSTALLATION.md** — Updated installation instructions
- **UPDATE-GUIDE.md** — Added user-agent preservation documentation

### Fixed

- Config merger overwrote user-added agents on upgrade (now preserved via smart-merge)
- Incomplete agent table detection false positives on relationship/contract-flow tables
- Internal naming leak check false positives on markdown link targets and backtick-wrapped paths
- `_vortex` appearing unescaped in 7 user guide Credits sections
- Separator and header rows incorrectly counted in agent table completeness check
- README "Type `LP`" instruction meaningless to new users (now "Select **Lean Persona** from the menu")
- Redundant config personalization step in "Your First 15 Minutes"

### Technical Details

- **Tests:** 309 pass, 0 fail, 0 todo (unit + integration + P0)
- **Package:** 242 files, 1.1 MB unpacked (was 1618 files, 9.7 MB)
- **Docs audit:** `npm run docs:audit --json` returns `[]` (zero findings)
- **All 22 workflows** now have production-quality step content (no placeholders)

---

## [1.6.0] - 2026-02-26

### Added

- **Mila — Research Convergence Specialist** (Stream 3: Synthesize) — New agent that converges divergent research into actionable problem definitions using JTBD framing and Pains & Gains analysis
  - `research-convergence` workflow — Synthesize multiple research artifacts into a single problem definition
  - `pivot-resynthesis` workflow — Re-synthesize problem definition after failed experiments
  - `pattern-mapping` workflow — Surface convergent patterns across research sources
- **Liam — Hypothesis Engineer** (Stream 4: Hypothesize) — New agent that engineers testable hypotheses from validated problem definitions using structured brainwriting and assumption mapping
  - `hypothesis-engineering` workflow — Produce testable hypotheses in 4-field contract format
  - `assumption-mapping` workflow — Classify hidden assumptions by risk level
  - `experiment-design` workflow — Design experiments targeting riskiest assumptions first
- **Noah — Production Intelligence Specialist** (Stream 6: Sensitize) — New agent that interprets production signals through experiment lineage context
  - `signal-interpretation` workflow — Contextual interpretation of production signals
  - `behavior-analysis` workflow — Behavioral pattern analysis against experiment baselines
  - `production-monitoring` workflow — Multi-signal monitoring across active experiments
- **10 Handoff Contracts (HC1-HC10)** — Structured information flow between all 7 agents
  - HC1-HC5: Artifact contracts with schema definitions in `_bmad/bme/_vortex/contracts/`
  - HC6-HC8: Decision-driven routing contracts (Max → Mila/Isla/Emma)
  - HC9-HC10: Flag-driven routing contracts (Liam → Isla, Noah → Isla)
- **Compass Routing** — Every workflow's final step includes evidence-driven routing table with agent recommendations
- **Compass Routing Reference** — Authoritative routing document (`_bmad/bme/_vortex/compass-routing-reference.md`) defining all routes across 22 workflows
- **Cross-agent routing for existing agents** — Emma, Isla, Wade, and Max now route to Mila, Liam, and Noah where appropriate
- **Module README** — Technical inventory at `_bmad/bme/_vortex/README.md` with complete agent, workflow, and contract listings
- **Extensibility documentation** — 4-step pattern for adding new agents (registry → agent file → workflows → guide) validates NFR9/E4

### Changed

- **README.md** — Updated from 4-agent to 7-agent framework with non-linear Vortex diagram, 10 HC contracts, and Compass routing
- **docs/agents.md** — Expanded from 4-agent reference to comprehensive 7-agent practitioner guide with user journeys, handoff contracts, and Compass documentation
- **Agent registry** — Now contains 7 agents and 22 workflows (was 4 agents, 13 workflows)
- **Roadmap** — v1.6.0 marked as current release; Wave 3 complete

---

## [1.5.2] - 2026-02-22

### Changed

- **Registry-driven postinstall** — `postinstall.js` now imports from `agent-registry.js` instead of hardcoding agent names; agent list stays current automatically
- **Removed deprecated installer wrappers** — Deleted `install-emma.js` and `install-wade.js`; removed `convoke-install-emma` / `convoke-install-wade` bin entries and `install:emma` / `install:wade` scripts
- **Manifest persona data moved to registry** — `createAgentManifest()` now reads role, identity, communication_style, and expertise from `agent-registry.js` instead of hardcoded CSV strings
- **Formalized config schema** — `validateConfig()` rewritten to iterate a declarative `CONFIG_SCHEMA`; added type checks for `submodule_name`, `module`, `output_folder`, `communication_language`, `party_mode_enabled`, and array-item types for `agents`/`workflows`

### Fixed

- CHANGELOG.md backfilled with missing v1.4.0, v1.4.1, and v1.5.1 entries

---

## [1.5.1] - 2026-02-20

### Added

- **Test hardening** — 184 tests (130 unit + 54 integration), all green
- Line coverage raised to 83.4% (up from 68%)
- `validator.js` coverage: 96% (was 21%)
- `migration-runner.js` coverage: 81% (was 28%)
- Installer E2E test (CLI as child process)
- `convoke-doctor` negative-path tests (8 scenarios)

### Fixed

- Validator now checks all 4 agents (was only 2)
- `mergeConfig` seeds structural defaults for fresh installs so config and validation stay consistent

### Added

- **Vortex Compass** — Evidence-driven cross-stream navigation in every workflow's final step
  - Conditional "If you learned X → go to Y" tables replace fixed "Next suggested workflow" links
  - Each compass points to workflows across different agents, creating true vortex loops
  - All 12 workflow endpoints now interconnect (vortex-navigation excluded — it IS the navigator)
  - Always includes Max's Vortex Navigation as escape hatch for full gap analysis

---

## [1.5.0] - 2026-02-20

### Added

- **Isla** (discovery-empathy-expert) - Discovery & Empathy Expert for the Empathize stream
- **Max** (learning-decision-expert) - Learning & Decision Expert for the Systematize stream
- New primary installer: `convoke-install-vortex`
- Workflows for Isla: `empathy-map`, `user-interview`, `user-discovery`
- Workflows for Max: `learning-card`, `pivot-patch-persevere`, `vortex-navigation`
- `ISLA-USER-GUIDE.md` and `MAX-USER-GUIDE.md` in vortex-artifacts
- Migration path: 1.3.x and 1.4.x to 1.5.0 (non-breaking)

### Changed

- `convoke-install` now delegates to `install-vortex-agents.js` (umbrella wrapper)
- `convoke-install-emma` and `convoke-install-wade` are now deprecation wrappers
- Package description updated to include Empathize and Systematize streams
- `convoke-doctor` now checks for all 4 agents and 13 workflows

### Fixed

- `empathy-map` workflow `_designos` path references corrected to `_vortex`
- `validate.md` and `empathy-map.template.md` author attribution corrected from Emma to Isla

---

## [1.4.1] - 2026-02-19

### Added

- CI pipeline with GitHub Actions (lint + test on Node 18/20/22)
- ESLint configuration and full lint pass
- `convoke-doctor` diagnostic CLI with 7 installation checks
- 112 tests (82 unit + 30 integration)
- `.c8rc.json` for coverage configuration

### Fixed

- Silenced console in tests that trigger heavy source-code logging (Node 20 IPC bug)

---

## [1.4.0] - 2026-02-18

### Changed

- **Architecture refactor** — Centralized agent/workflow data into `agent-registry.js`
  - Single source of truth consumed by validator, refresh-installation, convoke-doctor, migration-runner, and index.js
  - To add a new agent: push one entry to `AGENTS` + its workflows to `WORKFLOWS`; all consumers pick up the change automatically
- **`refresh-installation.js`** — Shared refresh logic extracted; copies agents, workflows, config, and user guides from package to project
- **`migration-runner.js`** — Rewritten as 8-step orchestration (deltas → refresh → validate) with lock file, backup, and rollback
- **`validator.js`** — Data-driven validation using registry arrays instead of hardcoded checks
- **`config-merger.js`** — Seeds structural defaults (`submodule_name`, `description`, `module`, `output_folder`) so fresh installs pass validation

### Removed

- Hardcoded agent/workflow arrays throughout codebase (replaced by registry imports)

---

## [1.3.6] - 2026-02-18

### Fixed

**🔍 Improved Installation Diagnostics:**
- Added detailed debugging output to config.yaml creation in install script
- Shows exact file path where config.yaml will be created
- Verifies file existence immediately after write
- Catches and displays any errors during config creation
- Better error handling with try-catch blocks

**📊 Improved Version Check Messaging:**
- `convoke-version` now distinguishes between "fresh", "partial", and "corrupted" installations
- "Partial installation" message when config.yaml is missing but other files exist
- "Corrupted installation" message when required agent files are missing
- Each scenario now provides specific next steps for resolution
- No longer shows generic "Not installed" for all cases

**What this helps with:**
- Easier troubleshooting when installations fail
- Clear indication of what's wrong with partial installations
- Better guidance on how to fix installation issues
- More detailed logs for support/debugging

---

## [1.3.5] - 2026-02-18

### Fixed

**🚨 CRITICAL Install Script Bug:**
- Fixed `convoke-install` only copying deprecated workflows, not the 7 new workflows
- Fixed hardcoded version 1.2.0 (now correctly uses 1.3.5)
- Install script now copies all 7 Vortex workflows: lean-persona, product-vision, contextualize-scope, mvp, lean-experiment, proof-of-concept, proof-of-value
- **This was causing "folders are still a mess" issue - workflows were listed in config but never installed**

**What was broken in v1.3.4 and earlier:**
- Fresh installs only got deprecated workflows (empathy-map, wireframe)
- Config.yaml listed 7 workflows that didn't exist
- Version was always set to 1.2.0 regardless of package version
- Validation failed because workflow.md files were missing

---

## [1.3.4] - 2026-02-18

### Fixed

**🔧 CRITICAL Migration Bug:**
- Fixed migration system not detecting migrations from 1.2.0 to 1.3.x
- Updated all migrations to target version 1.3.4 (was 1.3.0)
- Migrations now correctly run when upgrading from 1.0.x, 1.1.x, or 1.2.x
- **This fixes the "No migrations needed (versions compatible)" error**
- Now properly removes deprecated agents and legacy `_designos` directory

**What was broken in v1.3.3:**
- Users on v1.2.0 saw "No migrations needed" but weren't upgraded
- Deprecated agents and `_designos` directory weren't removed
- Version remained at 1.2.0 instead of updating to 1.3.x

---

## [1.3.3] - 2026-02-18

### Fixed

**🧹 Legacy Directory Cleanup:**
- Added automatic removal of old `_designos` directory (pre-Vortex structure) in all migrations
- Users with installations from very old versions will now have the legacy directory removed automatically
- Migration preview now shows when legacy directory will be removed
- Removed obsolete `_designos` reference from `.npmignore`

**Updated migrations:**
- `1.0.x-to-1.3.0`, `1.1.x-to-1.3.0`, `1.2.x-to-1.3.0` all now remove `_bmad/bme/_designos/` if present

---

## [1.3.2] - 2026-02-18

### Fixed

**🚨 CRITICAL Package Bug:**
- Fixed `.npmignore` excluding Vortex pattern files from published package
- Agent files (`contextualization-expert.md`, `lean-experiments-specialist.md`) now included in package
- All workflow template files now included in package
- `CHANGELOG.md` and `UPDATE-GUIDE.md` now included in package
- User guides in both `vortex-artifacts/` and `design-artifacts/` now included
- **This was blocking all installations and migrations in v1.3.0 and v1.3.1** ❌

**Package now includes:**
- 113 files (was 27 in v1.3.0/v1.3.1)
- 116.1 kB (was 55.0 kB in v1.3.0/v1.3.1)
- All necessary agent and workflow files

**⚠️ Action Required:**
- If you installed v1.3.0 or v1.3.1: `npm install convoke-agents@1.3.2`
- Fresh installations now work: `npx convoke-install`
- Migrations now work: `npx convoke-update`

---

## [1.3.1] - 2026-02-18

### Fixed

**🐛 Migration Bug:**
- Fixed issue where deprecated agent files (`empathy-mapper.md`, `wireframe-designer.md`) were not being removed during migration
- All three migrations (1.0.x, 1.1.x, 1.2.x → 1.3.0) now properly remove deprecated agents before copying new ones
- Users upgrading from v1.0.x or v1.1.x will now see only the correct agent files
- Migration preview output now explicitly shows which deprecated files will be removed

**⚠️ Note:** v1.3.1 still had the critical `.npmignore` bug from v1.3.0. Use v1.3.2 instead.

---

## [1.3.0] - 2026-02-17

### Major Release: Automatic Update/Migration System

This release introduces a comprehensive update/migration system that makes it safe and easy to upgrade Convoke from previous versions.

### Added

**🔄 Automatic Update System:**
- **convoke-update** - Main update CLI with dry-run support
  - Preview changes before applying: `npx convoke-update --dry-run`
  - Interactive confirmation (or `--yes` to skip)
  - Automatic backup before every migration
  - Automatic rollback on failure
  - Detailed progress indicators

- **convoke-version** - Version information CLI
  - Shows current vs. latest version
  - Displays migration history
  - Update availability status
  - Example: `npx convoke-version`

- **convoke-migrate** - Manual migration control (advanced users)
  - Run specific migrations
  - List available migrations
  - Example: `npx convoke-migrate 1.1.x-to-1.2.0`

**📦 Migration Framework:**
- Version detector with fallback strategies
- Backup manager with automatic cleanup (keeps last 5)
- Config merger preserving user preferences
- Migration registry with version matching
- Installation validator with comprehensive checks
- Migration runner with orchestration and error handling

**🛡️ Data Safety:**
- Automatic backups before every migration
- Backup location: `_bmad-output/.backups/backup-{version}-{timestamp}/`
- Automatic rollback if migration fails
- Migration history tracking in config.yaml
- Migration logs in `_bmad-output/.logs/`
- Lock file prevents concurrent migrations

**📋 Migrations Implemented:**
- `1.2.x-to-1.3.0` - Minor update (adds migration system)
  - Updates version, removes deprecated agents, refreshes agent files, verifies structure
- `1.1.x-to-1.3.0` - Minor update (no breaking changes)
  - Updates version, removes deprecated agents, refreshes agent files, verifies structure
- `1.0.x-to-1.3.0` - Breaking change migration
  - Moves empathy-map → _deprecated/
  - Installs all 7 new workflows
  - Updates config and agent manifest
  - Removes deprecated agent files
  - Preserves all user data

**📚 Documentation:**
- **UPDATE-GUIDE.md** - Comprehensive update documentation
  - Quick update instructions
  - Migration paths (v1.1.x and v1.0.x)
  - Data safety guarantees
  - Troubleshooting guide
  - FAQs
- **README.md** - Added update section
  - Version checking
  - Update commands
  - Migration paths
  - Troubleshooting
- **CHANGELOG.md** - This entry!

### Changed

**🎨 Enhanced Postinstall Experience:**
- Now detects upgrades automatically
- Shows breaking changes warnings
- Prompts to run `npx convoke-update`
- Displays current → new version
- Does NOT auto-migrate (requires user consent)

**⚙️ Package.json:**
- Added `js-yaml` dependency for config parsing
- Added 3 new bin commands:
  - `convoke-update`
  - `convoke-version`
  - `convoke-migrate`

**📁 File Structure:**
- New `scripts/update/` directory:
  - `lib/` - Shared migration logic (6 modules)
  - `migrations/` - Individual migration files + registry
  - `convoke-update.js`, `convoke-version.js`, `convoke-migrate.js` - CLI commands

### Migration Features

**Preserved During Updates:**
- All user data in `_bmad-output/` (except documentation guides)
- User preferences (user_name, communication_language)
- Custom config settings (output_folder, party_mode_enabled)
- BMAD Method files (never touched)
- Deprecated workflows (remain functional in `_deprecated/`)

**Updated During Migrations:**
- Agent definition files
- Workflow files
- Config.yaml (with preference preservation)
- User guides (documentation)
- Agent manifest

**Version Tracking:**
- New `migration_history` field in config.yaml
- Tracks: timestamp, from_version, to_version, migrations_applied
- Prevents re-running migrations
- Useful for debugging and support

### User Experience

**Before Update:**
```bash
npm install convoke-agents@1.3.0
# Postinstall shows:
# ⚠ UPGRADE DETECTED
# Current version: 1.1.0
# New version: 1.3.0
# Run: npx convoke-update --dry-run (to preview)
```

**Preview Changes:**
```bash
npx convoke-update --dry-run
# Shows detailed preview of changes without applying
```

**Apply Update:**
```bash
npx convoke-update
# [1/5] Creating backup...
# [2/5] Running migrations...
# [3/5] Updating configuration...
# [4/5] Validating installation...
# [5/5] Cleanup...
# ✓ Migration completed successfully!
```

### Technical Implementation

**Core Components:**
- **version-detector.js** - Detects versions, determines migration path
- **backup-manager.js** - Creates backups, handles rollback
- **config-merger.js** - Smart YAML merging preserving user settings
- **migration-runner.js** - Orchestrates migrations, handles errors
- **validator.js** - Validates installation integrity
- **registry.js** - Tracks available migrations

**Migration Flow:**
1. Detect current/target versions
2. Get applicable migrations
3. Create backup
4. Execute migrations sequentially
5. Update config and migration history
6. Validate installation
7. Cleanup old backups
8. Create migration log

**Error Handling:**
- Automatic rollback on any failure
- Detailed error logs
- Migration lock prevents concurrent runs
- Validation checks after migration

### Backwards Compatibility

- v1.1.x users: Smooth upgrade, no breaking changes
- v1.0.x users: Breaking changes handled automatically
- Fresh installs: Unaffected, install normally
- Manual migration: Fallback instructions provided
- All migrations preserve user data

### Future-Proof

- Extensible migration registry
- Easy to add new migrations (just add to registry.js)
- Supports chained migrations (e.g., 1.0 → 1.1 → 1.2 → 1.3)
- Version range matching (1.0.x, 1.1.x patterns)

### Notes

- This is a MAJOR infrastructure release
- Sets foundation for future seamless updates
- Users on v1.0.x or v1.1.x can safely upgrade
- Update system tested with comprehensive migration scenarios
- v1.4.0+ updates will use this system for smooth upgrades

---

## [1.2.0] - 2026-02-17

### Major Release: Complete Vortex Pattern Implementation

This release completes the Vortex Pattern by implementing all 7 new Lean Startup workflows, updating documentation, and cleaning up deprecated workflows.

### Added

**🎯 Emma's Contextualize Stream Workflows (3 workflows):**
- **lean-persona** - Create lean user personas focused on jobs-to-be-done (not demographics)
  - 6-step workflow from job definition through validation planning
  - Hypothesis-driven approach with riskiest assumptions identified
  - Integrates with Wade's lean-experiment workflow

- **product-vision** - Define strategic product vision and alignment
  - 6-step workflow from problem definition through synthesis
  - Vision statement formula, future state (3-5 years), guiding principles
  - Strategic assumptions identification and validation planning

- **contextualize-scope** - Decide which problem space to investigate
  - 6-step workflow using systematic opportunity evaluation
  - Scoring matrix with weighted criteria
  - Clear scope boundaries (what's in, what's out)

**🧪 Wade's Externalize Stream Workflows (4 workflows):**
- **mvp** - Design Minimum Viable Product specifications
  - Focus on testing riskiest assumptions, not building feature-light products
  - Build-Measure-Learn cycle planning
  - Success criteria and MVP scope definition

- **lean-experiment** - Execute Build-Measure-Learn cycles
  - Hypothesis-driven experimentation framework
  - Metrics definition and experiment design
  - Pivot or persevere decision framework

- **proof-of-concept** - Validate technical feasibility
  - Test that you CAN build it before validating you SHOULD
  - Technical risk assessment and PoC scoping
  - Feasibility evaluation and findings documentation

- **proof-of-value** - Validate business value and market demand
  - Test that you SHOULD build it (business case)
  - Willingness to pay experiments
  - Business case calculation and build/pivot/kill decisions

**📚 Documentation Updates:**
- **Emma User Guide v1.2.0** - Updated to reflect Contextualization Expert role
  - Focuses on Lean Startup methodologies and strategic framing
  - Documents legacy empathy-map workflow (still functional)
  - Documents all 3 new Contextualize stream workflows
  - Location: `_bmad-output/vortex-artifacts/EMMA-USER-GUIDE.md`

- **Wade User Guide v1.2.0** - Updated to reflect Lean Experiments Specialist role
  - Focuses on Build-Measure-Learn cycles and validated learning
  - Documents legacy wireframe workflow (still functional)
  - Documents all 4 new Externalize stream workflows
  - Location: `_bmad-output/vortex-artifacts/WADE-USER-GUIDE.md`

### Changed
- User guides moved from `design-artifacts/` to `vortex-artifacts/`
- Deprecated workflows archived to `_bmad/bme/_vortex/workflows/_deprecated/`
  - `empathy-map/` moved to `_deprecated/empathy-map/` (still functional)
  - `wireframe/` moved to `_deprecated/wireframe/` (still functional)
- Installer scripts updated to reference deprecated workflow locations
- Config.yaml version bumped to 1.2.0
- All installer scripts now install user guides from vortex-artifacts location

### Documentation
- Emma positioned as Lean Startup expert (not design thinking)
- Wade positioned as experimentation specialist (not wireframe designer)
- Comprehensive migration guides added to both user guides
- Roadmap section added documenting v1.3.0 and v1.4.0+ plans

### Backwards Compatibility
- Legacy workflows (empathy-map, wireframe) remain functional
- Old artifacts from v1.0.x-v1.1.x continue to work
- Migration path documented for users on previous versions

### Technical Details
- **Total files created:** 56 workflow files (7 workflows × 8 files each)
- **Workflow architecture:** Step-file based with just-in-time loading
- **Output templates:** Markdown-based artifact templates for each workflow
- **Integration:** Workflows reference each other (e.g., lean-persona → mvp → lean-experiment)

### Notes
- All 7 Vortex workflows now fully implemented and ready to use
- Legacy workflows (empathy-map, wireframe) remain in `_deprecated/` for backwards compatibility
- Update/migration tooling planned for v1.3.0
- This is a MAJOR feature release, not just documentation cleanup

---

## [1.1.3] - 2026-02-17

### Fixed
- Removed outdated user guide references from installer output
  - Replaced with "User guides being updated for v1.2.0" message in all 3 installers

---

## [1.1.2] - 2026-02-17

### Fixed
- **CRITICAL: Installer scripts now reference correct agent file names**
  - Updated `install-all-agents.js` to copy `contextualization-expert.md` and `lean-experiments-specialist.md`
  - Updated `install-emma.js` to copy `contextualization-expert.md`
  - Updated `install-wade.js` to copy `lean-experiments-specialist.md`
  - Fixed config.yaml generation in all installers to use new agent names
  - Fixed agent-manifest.csv generation to reference correct file paths
  - Fixed Quick Start instructions in installer output

**Impact:** v1.1.1 had broken installer scripts that would fail when users ran `npx convoke-install`. This patch fixes the installation process.

### Known Issues
- User guides still reference v1.0.0 content and will be updated in v1.2.0

---

## [1.1.1] - 2026-02-17

### Fixed
- **Agent file naming consistency:** Renamed agent files to match BMM module naming convention
  - `empathy-mapper.md` → `contextualization-expert.md`
  - `wireframe-designer.md` → `lean-experiments-specialist.md`
- Updated all workflow references to use new agent file names
- Updated config.yaml agent list with new names
- Fixed migration guide in v1.1.0 to reference correct agent file names

---

## [1.1.0] - 2026-02-16

### MAJOR REPOSITIONING: From Design Agents to Vortex Pattern

This release represents a fundamental repositioning of Convoke from design-focused agents (empathy mapping, wireframing) to a Lean Startup validation framework.

### Changed
- **BREAKING:** Renamed module from `_designos` to `_vortex`
- **BREAKING:** Emma repositioned from "Empathy Mapping Specialist" to "Contextualization Expert" (icon: 🎯)
  - Focus: Strategic framing, lean personas, product vision, problem space navigation
  - Role: Guides teams through the "Contextualize" stream
  - New workflows: lean-persona, product-vision, contextualize-scope (empathy-map deprecated)
- **BREAKING:** Wade repositioned from "Wireframe Design Specialist" to "Lean Experiments Specialist" (icon: 🧪)
  - Focus: Build-Measure-Learn cycles, MVPs, validated learning
  - Role: Guides teams through the "Externalize" stream
  - New workflows: mvp, lean-experiment, proof-of-concept, proof-of-value (wireframe deprecated)
- **BREAKING:** Output folder changed from `_bmad-output/design-artifacts` to `_bmad-output/vortex-artifacts`
- Updated all installer scripts to reflect new module name and agent descriptions
- Updated config.yaml structure to version 1.1.0 with Vortex pattern metadata
- Updated agent-manifest.csv with new agent identities and expertise

### Added
- Vortex pattern structure with Contextualize and Externalize streams
- 7 new workflow placeholders (v1.2.0):
  - Emma (Contextualize): lean-persona, product-vision, contextualize-scope
  - Wade (Externalize): mvp, lean-experiment, proof-of-concept, proof-of-value
- Version field in config.yaml for better version tracking

### Migration Guide

**For existing users upgrading from 1.0.x:**

1. **Module path changed:**
   - Old: `_bmad/bme/_designos/`
   - New: `_bmad/bme/_vortex/`

2. **Output folder changed:**
   - Old: `_bmad-output/design-artifacts/`
   - New: `_bmad-output/vortex-artifacts/`

3. **Agent activation paths updated:**
   - Emma: `cat _bmad/bme/_vortex/agents/contextualization-expert.md`
   - Wade: `cat _bmad/bme/_vortex/agents/lean-experiments-specialist.md`

4. **Workflows replaced:**
   - Emma's empathy-map workflow → lean-persona workflow (coming in v1.2.0)
   - Wade's wireframe workflow → lean-experiment workflow (coming in v1.2.0)

5. **Clean reinstall recommended:**
   ```bash
   # Backup any custom configs
   # Remove old installation
   rm -rf _bmad/bme/_designos
   rm -rf _bmad-output/design-artifacts

   # Install v1.1.0
   npm install convoke-agents@1.1.0
   npx convoke-install
   ```

### Positioning Rationale

**Why this change?**

The repositioning aligns Emma and Wade with Lean Startup and validated learning principles:

- **Emma (Contextualize):** Helps teams frame the right problem before building solutions
  - Differentiation: Emma contextualizes (problem space), Maya creates (solution space)
- **Wade (Externalize):** Helps teams validate assumptions through rapid experimentation
  - Differentiation: Wade externalizes (test with users), Sally internalizes (test with code)

This creates a clear value proposition: Use Emma + Wade for Lean Startup validation, then hand off to BMAD core agents for implementation.

### Technical Details
- Module version: 1.1.0
- Config structure: Updated with submodule metadata
- Backward compatibility: NONE (breaking changes require migration)
- Package size: ~55KB (unchanged)

### Notes
- v1.0.x workflows (empathy-map, wireframe) are deprecated
- New workflows (lean-persona, mvp, etc.) will be fully implemented in v1.2.0
- User guides will be updated in v1.2.0 to reflect new positioning

---

## [1.0.4-alpha] - 2026-02-16

### Fixed
- **Documentation:** All installation commands now correctly use `npm install convoke-agents@alpha` instead of `npm install convoke-agents`
- Updated installation instructions across all documentation files:
  - README.md
  - INSTALLATION.md
  - BMAD-METHOD-COMPATIBILITY.md
  - PUBLISHING-GUIDE.md
  - scripts/README.md
  - index.js

### Changed
- Updated CLI output in index.js to show npx commands instead of npm run commands
- Updated version references from 1.0.3-alpha to 1.0.4-alpha

### Notes
- v1.0.3-alpha was unpublished due to incorrect installation documentation
- This release contains the same functionality as 1.0.3-alpha with corrected docs

---

## [1.0.3-alpha] - 2026-02-15 (Unpublished)

### Added
- **npx bin commands** for user-friendly installation
  - `npx convoke-install` - Install all agents (Emma + Wade)
  - `npx convoke-install-emma` - Install Emma only
  - `npx convoke-install-wade` - Install Wade only
- bin section in package.json with executable scripts
- Updated postinstall message to show npx commands

### Changed
- **BREAKING:** Installation command changed from `npm run install:agents` to `npx convoke-install`
- Updated all documentation to use npx commands:
  - README.md
  - INSTALLATION.md
  - BMAD-METHOD-COMPATIBILITY.md
  - PUBLISHING-GUIDE.md
  - All other documentation files

### Fixed
- Installation now works correctly in user projects (previous `npm run` commands didn't work)
- Users can now install agents without package.json modifications

### Technical Details
- Added bin executables that npm automatically links to node_modules/.bin/
- Maintained backward compatibility with npm scripts for development

---

## [1.0.2-alpha] - 2026-02-15

### Added
- User guides now included in npm package (19KB Emma guide + 43KB Wade guide)

### Fixed
- **Bug:** User guides were excluded from npm package due to .npmignore pattern ordering
- Reordered .npmignore patterns so specific inclusions take precedence over general exclusions

### Changed
- Package size increased from 40KB to 55.6KB (due to user guides inclusion)

---

## [1.0.1-alpha] - 2026-02-15

### Fixed
- **Critical Bug:** Wade workflow installation failed due to filename mismatch
  - Installer tried to copy `step-05-components-interactions.md`
  - Actual filename was `step-05-components.md`
- Fixed in:
  - scripts/install-all-agents.js (line 114)
  - scripts/install-wade.js (line 72)

---

## [1.0.0-alpha] - 2026-02-15

### Added
- Initial release of Convoke
- **Emma (empathy-mapper)** - Empathy Mapping Specialist
  - 6-step empathy map workflow
  - Empathy map template
  - Validation workflow
  - Complete user guide (19KB)
- **Wade (wireframe-designer)** - Wireframe Design Expert
  - 6-step wireframe workflow
  - Wireframe template
  - Complete user guide (43KB)
- Complete installation system
  - BMAD Method prerequisite checking
  - Automatic agent file copying
  - Configuration file generation
  - User-friendly installation messages
- Comprehensive documentation
  - README.md with project overview
  - INSTALLATION.md with detailed installation guide
  - BMAD-METHOD-COMPATIBILITY.md explaining integration
  - User guides for both agents
- Test coverage
  - Emma: 18 P0 tests + 5 live tests (100% pass rate)
  - Wade: 18 P0 tests + 5 live tests (100% pass rate)

### Technical Details
- Package size: 40KB (initial)
- 33 files in package
- Dependencies: chalk (4.1.2), fs-extra (11.3.3)
- Node.js requirement: >=14.0.0
- License: MIT

---

## Version History

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 1.0.3-alpha | 2026-02-15 | Feature | npx bin commands |
| 1.0.2-alpha | 2026-02-15 | Bug Fix | User guides included |
| 1.0.1-alpha | 2026-02-15 | Bug Fix | Wade filename fix |
| 1.0.0-alpha | 2026-02-15 | Initial | First release |

---

## Upgrade Guide

### From 1.0.2-alpha to 1.0.3-alpha

**Installation command changed:**

**Old:**
```bash
npm install convoke-agents@alpha
npm run install:agents  # This doesn't work
```

**New:**
```bash
npm install convoke-agents@alpha
npx convoke-install  # This works!
```

**Note:** The old `npm run install:agents` command never actually worked in user projects. The new npx command is the correct installation method.

### From 1.0.1-alpha to 1.0.2-alpha

No changes to installation flow. User guides are now automatically included.

### From 1.0.0-alpha to 1.0.1-alpha

No changes to installation flow. Reinstallation will fix the Wade workflow bug.

---

## Links

- **npm Package:** https://www.npmjs.com/package/convoke-agents
- **GitHub Repository:** https://github.com/amalik/convoke-agents
- **BMAD Method:** https://github.com/bmadhub/bmad
- **Issues:** https://github.com/amalik/convoke-agents/issues

---

**For detailed technical documentation, see:**
- [README.md](README.md) - Project overview
- [INSTALLATION.md](INSTALLATION.md) - Installation guide
- [BMAD-METHOD-COMPATIBILITY.md](docs/BMAD-METHOD-COMPATIBILITY.md) - Integration details
- User guides in `_bmad/bme/_vortex/guides/`
