---
stepsCompleted: [design-epics, create-stories]
inputDocuments:
  - .claude/plans/curried-jumping-thunder.md
  - _bmad-output/planning-artifacts/epics-phase2.md
---

# Convoke Phase 3 — Product Rename: Convoke → Convoke

## Overview

BMAD Method's trademark prohibits using "BMad" as a product name (the "BMad + qualifier" pattern is explicitly not permitted). The product is evolving from a Vortex-only validation tool into an **agentic operating system** — a team-of-teams platform for creating, delivering, and operating complex systems. Phase 3 executes the complete rename from "Convoke" to "Convoke" across the entire codebase: npm package, CLI commands, documentation, tests, historical artifacts, and GitHub infrastructure.

**Rename scope:** ~200 files, ~680+ references.

**Key decisions:**
- Internal `_bmad/` directory structure: **KEEP** (BMAD Method compatibility)
- Target version: **v2.0.0** (breaking change — SemVer-correct for a rename)
- Historical documentation: **Update everything**
- `.claude/commands/bmad-*` skill files: **KEEP** (BMAD framework, not product-specific)

### Rename Mapping

| Old | New | Context |
|-----|-----|---------|
| `convoke` | `convoke` | npm package name |
| `Convoke` | `Convoke` | Display name |
| `Convoke` | `Convoke` | Prose variant |
| `convoke-install-vortex` | `convoke-install-vortex` | CLI (shortened, scales to future teams) |
| `convoke-install` | `convoke-install` | CLI (installs all teams) |
| `convoke-update` | `convoke-update` | CLI |
| `convoke-version` | `convoke-version` | CLI |
| `convoke-migrate` | `convoke-migrate` | CLI |
| `convoke-doctor` | `convoke-doctor` | CLI |
| `Convoke Community` | `Convoke Contributors` | Author / copyright holder |
| `github.com/amalik/convoke-agents` | `github.com/amalik/convoke-agents` | Repository URL |

**NOT renamed:** `_bmad/` directory paths, `.claude/commands/bmad-*` skill files, "BMAD Method" / "BMad Core" references, agent IDs.

## Requirements Inventory

### Functional Requirements

**Package Identity (5):**

- FR1 [I]: npm package name changes from `convoke` to `convoke` across package.json, package-lock.json, and all internal references
- FR2 [I]: All 6 CLI binary commands are renamed from `bmad-*` to `convoke-*` prefix with shortened install commands (`convoke-install-vortex`, `convoke-install`)
- FR3 [I]: All script files backing CLI commands are renamed to match new command names
- FR4 [I]: Package version resets to `2.0.0` with correct metadata (description, author, repository URL, keywords)
- FR5 [I]: Package ships with `convoke` as a keyword for discoverability during transition period

**Migration (3):**

- FR6 [I]: Migration registry contains a `1.7.x-to-2.0.0` breaking migration entry so existing users' upgrade path works
- FR7 [I]: Users on `convoke-agents@1.7.x` can discover the rename through a deprecation notice on the old package
- FR8 [I]: Existing `_bmad/` directory structure and `_bmad-output/` artifacts are preserved — zero data loss on upgrade

**Documentation Accuracy (5):**

- FR9 [U]: All user-facing documentation references the new product name, CLI commands, and install instructions
- FR10 [U]: README presents Convoke branding (ASCII banner, tagline, badges) and updated value proposition
- FR11 [U]: All 7 user guides reflect the new product name and CLI commands
- FR12 [U]: All workflow templates reference Convoke in their "Created with" footers
- FR13 [U]: CHANGELOG contains a v2.0.0 entry explaining the rename with migration instructions

**Test Integrity (3):**

- FR14 [I]: All test files reference renamed script paths and updated assertion strings
- FR15 [I]: An integration test validates the 1.7.x → 2.0.0 migration path
- FR16 [I]: Full test suite (unit + integration + P0 + coverage) passes with zero failures after rename

**Historical Completeness (2):**

- FR17 [I]: All historical documentation in `_bmad-output/` is updated to reference Convoke. Note: `Convoke` (space-separated) replacements require per-instance review in historical docs — "Enhanced" may be a verb in context, not part of the product name
- FR18 [I]: All top-level release notes, guides, and misc files reference Convoke

**Platform (3):**

- FR19 [I]: GitHub issue templates reference Convoke
- FR20 [I]: CI/CD pipeline publishes under the `convoke` package name
- FR21 [I]: GitHub repository is renamed to `convoke` (manual step — GitHub auto-redirects old URLs)

### Non-Functional Requirements

- NFR1: Rename introduces zero functional changes — all existing behavior is preserved exactly
- NFR2: Script file renames and test file renames are committed atomically — never a state where scripts are renamed but tests reference old paths
- NFR3: Scripted find-and-replace in Phase 7 (historical docs) undergoes manual `git diff` review to catch false positives before committing
- NFR4: Patterns used for find-and-replace target `convoke` (hyphenated) and specific CLI names (e.g., `convoke-update`), never bare `bmad` — protecting `_bmad/` paths and BMAD Method references
- NFR5: `convoke-agents@0.0.1` placeholder is published BEFORE `convoke` deprecation notice — no gap where users see a deprecation pointing to a nonexistent package
- NFR6: The `convoke` keyword is included in the new package for search discoverability during the transition period
- NFR7: docs-audit tool gains a check for stale `convoke` references in user-facing docs

## FR Coverage Map

- FR1-FR5: Epic 1 (Core Identity)
- FR6: Epic 1 (Migration entry)
- FR7: Epic 4 (Deprecation package)
- FR8: Epic 1 (Migration — no data loss)
- FR9-FR13: Epic 2 (Documentation)
- FR14-FR16: Epic 1 (Tests — atomic with core rename)
- FR17-FR18: Epic 3 (Historical & Misc)
- FR19-FR21: Epic 3 (Platform)

---

## Epic List

### Epic 1: Core Identity & Test Migration

The npm package, CLI commands, script files, library modules, migration registry, and all tests are renamed atomically — the package works correctly under the new name with a passing test suite.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR8, FR14, FR15, FR16
**NFRs addressed:** NFR1 (zero functional changes), NFR2 (atomic commit), NFR7 (docs-audit stale check)
**Dependencies:** None — this is the foundation epic
**Atomicity rule:** Script renames and test renames MUST be committed together

### Epic 2: Documentation & Shipped Content

All documentation that ships with the npm package or serves as a user entry point is updated to reflect Convoke branding, CLI commands, and install instructions.

**FRs covered:** FR9, FR10, FR11, FR12, FR13
**NFRs addressed:** NFR1 (behavior preserved), NFR4 (safe patterns)
**Dependencies:** Epic 1 (CLI command names must be finalized)

### Epic 3: Platform, Historical Docs & Miscellaneous

GitHub infrastructure, CI/CD, all top-level misc files, and all historical documentation in `_bmad-output/` are updated. Scripted find-and-replace with manual diff review.

**FRs covered:** FR17, FR18, FR19, FR20, FR21
**NFRs addressed:** NFR3 (manual diff review), NFR4 (safe patterns)
**Dependencies:** Epic 1 (command names finalized). Independent of Epic 2.

### Epic 4: Verification & Release

npm name reservation, deprecation of old package, comprehensive verification, and coordinated publish sequence.

**FRs covered:** FR7, FR16 (final verification), FR20 (publish)
**NFRs addressed:** NFR5 (placeholder before deprecation), NFR6 (discoverability keyword)
**Dependencies:** All previous epics complete

---

## Epic 1: Core Identity & Test Migration

The npm package, CLI commands, script files, library modules, migration registry, and all tests are renamed atomically — the package works correctly under the new name with a passing test suite.

### Story 1.1: Rename Package Identity & CLI Commands

As a maintainer,
I want the npm package name, version, metadata, and all CLI binary definitions updated to the Convoke brand,
So that `npm install convoke-agents` works and all `convoke-*` commands are available.

**Acceptance Criteria:**

**Given** the current `package.json` with name `convoke` and version `1.7.1`
**When** the rename is applied
**Then** `name` is `convoke` and `version` is `2.0.0`
**And** `description` is "Agent teams for complex systems, compatible with BMad Method"
**And** `bin` contains: `convoke-install-vortex`, `convoke-install`, `convoke-update`, `convoke-version`, `convoke-migrate`, `convoke-doctor`
**And** `keywords` includes `convoke`, `convoke`, and `bmad`
**And** `author` is `Convoke Contributors`
**And** `repository.url` points to `github.com/amalik/convoke-agents`
**And** `package-lock.json` is regenerated via `npm install --package-lock-only`
**And** `LICENSE` copyright holder is `Convoke Contributors`

**Files:** `package.json`, `package-lock.json`, `LICENSE`

### Story 1.2: Rename Script Files & Update Internal Strings

As a maintainer,
I want all CLI-backing script files renamed from `bmad-*` to `convoke-*` with their internal strings updated,
So that the renamed `bin` entries in package.json resolve to correctly-branded scripts.

**Acceptance Criteria:**

**Given** the 4 script files that back CLI commands
**When** the rename is applied
**Then** `scripts/update/convoke-update.js` is renamed to `scripts/update/convoke-update.js` with all internal "Convoke" and "bmad-*" strings updated
**And** `scripts/update/convoke-version.js` is renamed to `scripts/update/convoke-version.js` with same treatment
**And** `scripts/update/convoke-migrate.js` is renamed to `scripts/update/convoke-migrate.js` with same treatment
**And** `scripts/convoke-doctor.js` is renamed to `scripts/convoke-doctor.js` with same treatment
**And** all user-facing console output in these files references "Convoke" and `convoke-*` commands
**And** JSDoc headers in each file reference "Convoke"

**Files:** 4 script files (rename + content update)

### Story 1.3: Update Entry Point & Installer Scripts

As a new user,
I want the post-install output and CLI help to show the Convoke brand and correct command names,
So that my first interaction with the package reflects the correct product identity.

**Acceptance Criteria:**

**Given** a user runs `npm install convoke-agents`
**When** the postinstall script executes
**Then** the output says "Convoke installed!" (not "Convoke installed!")
**And** all `npx` command suggestions use `convoke-*` names

**Given** a user runs `node index.js` or `npx convoke`
**When** the help output is displayed
**Then** the header references "Convoke"
**And** all 5 command names use `convoke-*` prefix
**And** the JSDoc comment block references "Convoke"

**Given** a user runs `npx convoke-install-vortex`
**When** the installer completes
**Then** the ASCII banner shows "CONVOKE" in block letters (7-character layout — design subtask: generate or hand-craft the banner before implementation)
**And** the tagline reflects the new positioning
**And** all CLI command suggestions use `convoke-*` names

**Files:** `index.js`, `scripts/postinstall.js`, `scripts/install-vortex-agents.js`, `scripts/install-all-agents.js`

### Story 1.4: Update Library Modules

As a maintainer,
I want all library modules in `scripts/update/lib/` updated with Convoke branding in JSDoc headers and user-facing strings,
So that internal code consistently references the correct product name.

**Acceptance Criteria:**

**Given** the 8 library modules under `scripts/update/lib/`
**When** the rename is applied
**Then** `utils.js` JSDoc header references "Convoke"
**And** `version-detector.js` JSDoc header and any user-facing strings reference "Convoke"
**And** `config-merger.js` JSDoc header references "Convoke"
**And** `refresh-installation.js` JSDoc header references "Convoke"
**And** `migration-runner.js` JSDoc header and error message URLs reference the new repo
**And** `backup-manager.js` JSDoc header references "Convoke"
**And** `validator.js` JSDoc header and diagnostic messages reference "Convoke"
**And** `agent-registry.js` is confirmed to have no product name references (agent IDs are NOT renamed) and its JSDoc is updated if needed
**And** `scripts/docs-audit.js` references "Convoke" and gains a check for stale `convoke` references

**Files:** 8 files in `scripts/update/lib/`, `scripts/docs-audit.js`

### Story 1.5: Create v2.0.0 Migration Entry

As a user upgrading from convoke 1.7.x,
I want the migration system to recognize the 1.7.x → 2.0.0 upgrade path,
So that `convoke-update` correctly processes my upgrade with a breaking change notice.

**Acceptance Criteria:**

**Given** the migration registry at `scripts/update/migrations/registry.js`
**When** a user on version 1.7.x runs the update
**Then** a `1.7.x-to-2.0.0` migration entry exists with `breaking: true`
**And** the migration description explains the product rename
**And** a corresponding `scripts/update/migrations/1.7.x-to-2.0.0.js` delta file exists
**And** the delta file's `preview()` method lists the key changes (name, CLI commands, preserved `_bmad/` structure)
**And** the registry's JSDoc header references "Convoke"

**Files:** `scripts/update/migrations/registry.js`, `scripts/update/migrations/1.7.x-to-2.0.0.js` (new)

### Story 1.6: Migrate All Test Files

As a maintainer,
I want all test files updated to reference renamed scripts and use correct assertion strings,
So that the full test suite passes after the rename with zero failures.

**Acceptance Criteria:**

**Given** the script files have been renamed (Story 1.2)
**When** tests are updated
**Then** `tests/unit/convoke-update.test.js` is renamed to `convoke-update.test.js` with all script paths and assertion strings updated
**And** `tests/unit/convoke-version.test.js` is renamed to `convoke-version.test.js` with same treatment
**And** `tests/integration/convoke-doctor.test.js` is renamed to `convoke-doctor.test.js` with same treatment
**And** `tests/integration/cli-entry-points.test.js` has all 12 CLI refs updated to `convoke-*`
**And** `tests/integration/postinstall.test.js` assertions reference "Convoke" output
**And** `tests/unit/docs-audit.test.js` is updated for any new stale-reference checks
**And** `tests/helpers.js` temp directory prefix updated
**And** all P0 test files are scanned and any product name references updated
**And** after each test file is updated, that specific test file is run individually to verify before moving to the next
**And** `npm run test:all` passes with zero failures

**Files:** 3 test file renames + ~10 test file content updates

### Story 1.7: Add Migration Path Integration Test

As a maintainer,
I want an integration test that validates the upgrade path from convoke 1.7.x to Convoke 2.0.0,
So that I have confidence the migration system correctly handles the breaking rename for existing users.

**Acceptance Criteria:**

**Given** a simulated project at version 1.7.x
**When** the migration system is invoked
**Then** the `1.7.x-to-2.0.0` migration entry is detected and flagged as applicable
**And** the migration is identified as a breaking change
**And** the migration's `preview()` method returns the expected change descriptions
**And** the migration's `apply()` method executes without errors
**And** existing `_bmad/` directory structure is preserved (FR8)

**Implementation note:** Follow the existing migration test patterns in `convoke-update.test.js` (formerly `convoke-update.test.js`) — mock the file system and config using the same helpers and assertion style.

**Files:** New test file in `tests/integration/` or `tests/unit/`

### Epic 1 Verification

```bash
npm test && npm run test:integration && npm run test:p0:gate
node index.js                    # Verify Convoke branding
npm pack --dry-run               # Verify package name is 'convoke'
grep -r "convoke" scripts/ --include="*.js" | grep -v migrations/  # Should return 0
```

**Commit rule:** Stories 1.1–1.7 are developed incrementally but committed as a single atomic commit. Work in sequence (1.1 → 1.2 → ... → 1.7), verifying each step locally, but only `git add` and commit once ALL stories pass. This ensures a rollback-safe working state throughout development while guaranteeing the repo never has renamed scripts without renamed tests.

---

## Epic 2: Documentation & Shipped Content

All documentation that ships with the npm package or serves as a user entry point is updated to reflect Convoke branding, CLI commands, and install instructions.

### Story 2.1: Overhaul README.md

As a new user arriving from npm or GitHub,
I want the README to present Convoke branding with correct install commands and value proposition,
So that my first impression matches the actual product identity.

**Acceptance Criteria:**

**Given** the current README with BMAD ASCII art and convoke references
**When** the overhaul is applied
**Then** the ASCII art banner displays "CONVOKE" in block letters
**And** the tagline reflects the new positioning ("Agent teams for complex systems")
**And** the version badge shows 2.0.0 with the new repo URL
**And** the install command is `npm install convoke-agents && npx convoke-install-vortex`
**And** all CLI examples use `convoke-*` command names
**And** the cache tip references `npx -p convoke-agents@latest convoke-update`
**And** the "How It Fits with BMAD Core" section uses "Convoke" (keeping "BMAD Core" and "BMAD Method" as-is)
**And** the roadmap includes a v2.0.0 entry explaining the rename
**And** zero instances of "convoke" or "Convoke" remain (except in "compatible with BMad Method" style references)

**Files:** `README.md`

### Story 2.2: Update Primary Documentation Files

As a user following install, update, or compatibility guides,
I want all primary documentation to reference Convoke with correct CLI commands,
So that I can follow instructions without encountering stale product name references.

**Acceptance Criteria:**

**Given** the 5 primary documentation files
**When** the rename is applied
**Then** `INSTALLATION.md` uses `npm install convoke-agents`, `npx convoke-install-vortex`, and all `convoke-*` commands
**And** `UPDATE-GUIDE.md` updates all 22 CLI refs and package name references
**And** `CHANGELOG.md` has a v2.0.0 entry explaining the rename with migration instructions, and all historical entries are updated
**And** `BMAD-METHOD-COMPATIBILITY.md` updates all 36 product name refs while keeping "BMAD Method" / "BMad Core" references intact
**And** `PUBLISHING-GUIDE.md` updates all 40 refs and publishing instructions
**And** `scripts/README.md` references Convoke (ships in npm package via `files` field — 3 refs)
**And** zero instances of "convoke" or "Convoke" remain in any of these files

**Files:** `INSTALLATION.md`, `UPDATE-GUIDE.md`, `CHANGELOG.md`, `BMAD-METHOD-COMPATIBILITY.md`, `PUBLISHING-GUIDE.md`, `scripts/README.md`

### Story 2.3: Update Secondary Docs, User Guides & Shipped Content

As a user reading agent guides, workflow templates, or reference docs,
I want consistent Convoke branding throughout all shipped content,
So that every touchpoint within the product reflects the correct identity.

**Acceptance Criteria:**

**Given** the docs/ directory, user guides, workflow templates, and config files
**When** the rename is applied
**Then** `docs/agents.md`, `docs/development.md`, `docs/faq.md`, `docs/testing.md` reference Convoke
**And** all 7 user guides in `_bmad/bme/_vortex/guides/` update the module line and CLI refs
**And** all ~21 workflow template/validate files update the "Created with" footer to "Convoke v2.0.0"
**And** `_bmad/bmm/config.yaml` project_name is set to `Convoke`
**And** zero instances of "convoke" or "Convoke" remain in shipped content

**Files:** 4 docs, 7 guides, ~21 workflow templates, 1 config

### Epic 2 Verification

```bash
npm run docs:audit               # Zero findings
grep -r "convoke\|Convoke" docs/ _bmad/bme/_vortex/ README.md INSTALLATION.md UPDATE-GUIDE.md CHANGELOG.md
# Should return 0 results
```

---

## Epic 3: Platform, Historical Docs & Miscellaneous

GitHub infrastructure, CI/CD, all top-level misc files, and all historical documentation in `_bmad-output/` are updated. Scripted find-and-replace with mandatory manual diff review.

### Story 3.1: Update GitHub & CI Configuration

As a maintainer,
I want GitHub issue templates and CI configuration to reference Convoke,
So that the platform infrastructure matches the new product identity.

**Acceptance Criteria:**

**Given** the GitHub configuration files
**When** the rename is applied
**Then** `.github/ISSUE_TEMPLATE/feedback.yml` references "Convoke agent or workflow"
**And** `.github/workflows/ci.yml` is verified to have no product name references (it uses generic npm commands)
**And** the CI publish job will correctly publish under the `convoke` name (reads from package.json)

**Files:** `.github/ISSUE_TEMPLATE/feedback.yml`, `.github/workflows/ci.yml` (verify only)

### Story 3.2: Update Miscellaneous Top-Level Files

As a maintainer,
I want all remaining top-level files updated to reference Convoke,
So that no stale product name references exist outside of `_bmad-output/`.

**Acceptance Criteria:**

**Given** the misc top-level files (release notes, guides, scripts readme)
**When** the rename is applied
**Then** all 4 release notes files (`RELEASE-NOTES-*.md`, `release-notes-*.md`) reference Convoke
**And** `CREATE-RELEASE-GUIDE.md` and `CREATE-v1.0.3-RELEASE.md` reference Convoke
**And** `create-github-release.sh` references the new repo URL
**And** `CLEANUP-SUMMARY.md`, `TEST-PLAN-REAL-INSTALL.md`, `WARP.md` reference Convoke

**Files:** ~10 top-level files

### Story 3.3: Update Historical Documentation in _bmad-output/

As a maintainer,
I want all historical documentation updated to reference Convoke,
So that the entire project history consistently uses the current product name.

**Acceptance Criteria:**

**Given** ~100 files in `_bmad-output/` across planning-artifacts, project-documentation, implementation-artifacts, journey-examples, brainstorming, test-artifacts, and backups
**When** scripted find-and-replace is applied using safe patterns
**Then** all instances of `convoke`, `Convoke`, `Convoke` are replaced with `convoke` / `Convoke`
**And** all instances of `convoke-install-vortex` are replaced with `convoke-install-vortex`
**And** all instances of `convoke-install` are replaced with `convoke-install`
**And** all instances of `convoke-update`, `convoke-version`, `convoke-migrate`, `convoke-doctor` are replaced with `convoke-*` equivalents
**And** `_bmad/` path references are NOT affected
**And** "BMAD Method" / "BMad Core" references are NOT affected
**And** a `git diff` review is performed before committing to catch false positives (NFR3)

**Safe replacement patterns (NFR4):**
- `Convoke` → `Convoke` (hyphenated, distinct from bare "BMAD")
- `Convoke` → `Convoke` (space-separated variant)
- `convoke` → `convoke` (npm package name)
- `convoke-install-vortex` → `convoke-install-vortex`
- `convoke-install` → `convoke-install`
- `convoke-update` → `convoke-update`
- `convoke-version` → `convoke-version`
- `convoke-migrate` → `convoke-migrate`
- `convoke-doctor` → `convoke-doctor`

**Files:** ~100 files in `_bmad-output/`

### Epic 3 Verification

```bash
# Comprehensive grep audit — search for OLD stale product names
grep -r "bmad-enhanced\|BMAD-Enhanced\|BMAD Enhanced" . \
  --include="*.{js,md,yml,yaml,json,sh,mjs}" \
  --exclude-dir=node_modules --exclude-dir=.claude \
  --exclude="package-lock.json"
# Should return 0 results

# CLI command audit — search for OLD stale CLI commands
grep -r "bmad-install\|bmad-update\|bmad-version\|bmad-migrate\|bmad-doctor" . \
  --include="*.{js,md,yml,yaml,json,sh}" \
  --exclude-dir=node_modules --exclude-dir=.claude
# Should return 0 results
```

---

## Epic 4: Verification & Release

npm name reservation, deprecation of old package, comprehensive verification, and coordinated publish sequence.

**Course correction (2026-03-07):** npm package name changed from `convoke` to `convoke-agents` because `convoke` was already taken on npm. GitHub repo also renamed to `convoke-agents` for consistency. See `sprint-change-proposal-2026-03-07.md` for full analysis.

### Story 4.0: Update npm Package Name & Repo URL to convoke-agents

As a maintainer,
I want the npm package name and GitHub repo URL updated from `convoke` to `convoke-agents` throughout the codebase,
So that the package can be published to npm under an available name.

**Acceptance Criteria:**

**Given** `convoke` is already taken on npm
**When** all package name and repo URL references are updated
**Then** `package.json` name is `convoke-agents`
**And** `package-lock.json` is regenerated
**And** all `npm install convoke` commands become `npm install convoke-agents`
**And** all `npmjs.com/package/convoke` URLs become `npmjs.com/package/convoke-agents`
**And** all `npx -p convoke@` become `npx -p convoke-agents@`
**And** all `github.com/amalik/convoke` URLs become `github.com/amalik/convoke-agents`
**And** `docs-audit.js` stale-ref pattern is updated
**And** all `_bmad-output/` historical docs are updated with same patterns
**And** display name "Convoke" is NOT affected
**And** CLI commands `convoke-*` are NOT affected
**And** `npm test` passes, `docs-audit` returns zero findings

**Files:** package.json, package-lock.json, ~50 docs/code files, ~67 `_bmad-output/` files

### Story 4.1: Reserve npm Package Name

As a maintainer,
I want the `convoke-agents` package name reserved on npm before any public deprecation notice,
So that users who see the deprecation can actually find the new package.

**Acceptance Criteria:**

**Given** the `convoke-agents` name is available on npm
**When** a placeholder package is published
**Then** `convoke-agents@0.0.1` exists on npm with a "Coming soon" README
**And** this is done BEFORE any deprecation notice on `bmad-enhanced`

**Files:** Temporary placeholder package (not in main repo)

### Story 4.2: Publish Deprecation Version of bmad-enhanced

As a user on bmad-enhanced@1.7.x,
I want to receive a clear deprecation notice pointing me to the new `convoke-agents` package,
So that I know how to migrate without losing my data.

**Acceptance Criteria:**

**Given** `convoke-agents@0.0.1` exists on npm
**When** `bmad-enhanced@1.8.0` is published
**Then** the package.json includes a `"deprecated"` field pointing to `convoke-agents`
**And** the postinstall script displays a prominent banner with migration instructions
**And** the banner assures users that `_bmad/` and `_bmad-output/` data is preserved
**And** `npm deprecate bmad-enhanced "Renamed to convoke-agents. Run: npm install convoke-agents"` is executed

**Branch workflow (critical):** The deprecation must be published from the PRE-RENAME codebase, not from main (which has the Convoke rename):
1. Create a `deprecation` branch from the v1.7.1 tag (pre-rename state)
2. On that branch: add `"deprecated"` field to package.json, add deprecation banner to postinstall.js, bump version to 1.8.0
3. Publish `bmad-enhanced@1.8.0` from the `deprecation` branch
4. Run `npm deprecate bmad-enhanced "Renamed to convoke-agents. Run: npm install convoke-agents"`
5. Return to main branch (which has the Convoke rename) for `convoke-agents@2.0.0` publish

**Files:** `package.json`, `scripts/postinstall.js` (on `deprecation` branch only)

### Story 4.3: Final Verification & Publish

As a maintainer,
I want comprehensive verification that the rename is complete before publishing,
So that `convoke-agents@2.0.0` ships with zero stale references and a passing test suite.

**Acceptance Criteria:**

**Given** all Epics 1-3 are complete and Story 4.0 is done
**When** final verification is run
**Then** `npm run lint` passes
**And** `npm test` passes (all unit tests)
**And** `npm run test:integration` passes
**And** `npm run test:p0:gate` passes
**And** `npm run test:coverage` passes
**And** `npm run docs:audit` returns zero findings
**And** comprehensive grep audit returns zero stale references
**And** `node index.js` displays Convoke branding
**And** `npm pack --dry-run` shows package name `convoke-agents`
**And** GitHub repo is renamed to `convoke-agents` (manual via Settings)
**And** `v2.0.0` tag is pushed to trigger CI publish
**And** GitHub release is created with migration notes

**Publish sequence:**
1. Reserve `convoke-agents@0.0.1` (Story 4.1)
2. Publish `bmad-enhanced@1.8.0` deprecation (Story 4.2)
3. `npm deprecate bmad-enhanced`
4. Rename GitHub repo → `convoke-agents`
5. Tag `v2.0.0`, push to trigger CI publish of `convoke-agents@2.0.0`
6. Create GitHub release with migration notes

---

## Sequencing & Dependencies

```
Epic 1 (Core + Tests)  ──────────── start immediately (atomic commit)
  ├→ Epic 2 (Documentation)   ─── depends on Epic 1
  └→ Epic 3 (Platform + Historical) ─── depends on Epic 1
Epic 4 (Verification & Release) ─── depends on ALL previous epics
```

Epics 2 and 3 are independent and can run in parallel after Epic 1.

## Verification

After each epic:
- `npm run test:all` → all pass, 0 fail
- `npm run docs:audit` → zero findings

After all epics:
- Full grep audit for stale references → 0 results
- `npm pack --dry-run` → package name `convoke-agents`, ~242 files, ~1.1 MB
- Fresh install test in temp directory
- Upgrade test from bmad-enhanced@1.7.1

## Process Commitments

- Adversarial code review on every story
- NFR4 (safe replacement patterns) enforced — never replace bare `bmad`
- Manual `git diff` review on all scripted replacements (Story 3.3)
- Atomic commit for Epic 1 (scripts + tests together)
- Sprint status tracking with `p3-` prefix
