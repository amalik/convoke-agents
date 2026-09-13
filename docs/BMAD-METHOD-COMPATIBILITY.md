# BMAD Method Compatibility Guide

**Convoke** works standalone or as an extension of the **BMAD Method**. This document explains the relationship, compatibility behavior, and update strategy.

---

## Relationship Between BMAD Method and Convoke

### Architecture

```
┌─────────────────────────────────────────────────┐
│           BMAD Method (Core)                    │
│  - Core framework and CLI                       │
│  - Agent architecture                           │
│  - Workflow system                              │
│  - Configuration management                     │
│  - Base agents (if any)                         │
└─────────────────────────────────────────────────┘
                      ▲
                      │ extends
                      │
┌─────────────────────────────────────────────────┐
│           Convoke (Extension Package)            │
│                                                  │
│  Vortex — Product Discovery (7 agents)          │
│  - Emma, Isla, Mila, Liam, Wade, Noah, Max      │
│                                                  │
│  Gyre — Production Readiness (4 agents)         │
│  - Scout, Atlas, Lens, Coach                     │
│                                                  │
│  Enhance — Agent Skills                          │
│  - Initiatives Backlog (PM agent)                │
└─────────────────────────────────────────────────┘
```

### Key Principle

**Convoke works standalone — BMAD Method is optional.**

- Convoke creates the `_bmad/` directory automatically if missing
- If BMAD Method is already installed, Convoke detects it and logs confirmation
- If BMAD Method is not installed, the installer warns but proceeds in standalone mode
- No npm dependency on BMAD Method — Convoke is fully self-contained

---

## Installation Flow

### Standard Installation (Standalone)

```bash
npm install convoke-agents
npx -p convoke-agents convoke-install-vortex
```

### With Existing BMAD Method

```bash
# If BMAD Method is already installed, Convoke detects it automatically
npm install convoke-agents
npx -p convoke-agents convoke-install-vortex
# Installer logs: "✓ BMAD Method configuration found"
```

### What Gets Installed

**Convoke creates** the shape below. This is an orientation sketch, not an inventory —
derive the authoritative module set from the package manifest rather than reading it here:

```bash
node -e "console.log(require('convoke-agents/package.json').files.filter(f => f.startsWith('_bmad/bme/')).join('\n'))"
```

```
your-project/
└── _bmad/
    ├── bme/
    │   ├── _vortex/          # Vortex — product discovery
    │   ├── _gyre/            # Gyre — production readiness
    │   ├── _enhance/         # Enhance — agent skills
    │   ├── _artifacts/       # artifact governance workflows
    │   ├── _portability/     # platform-agnostic exporters
    │   ├── _team-factory/    # Loom — team creation
    │   └── covenant/         # Operator Covenant + compliance checklist
    └── _config/
        └── agent-manifest.csv (updated)
```

Each team module carries its own `config.yaml`, `workflows/`, and — where it has agents —
`agents/`, `guides/` and `contracts/`.

---

## Compatibility Requirements

### Current Version

Read the package version from `package.json` rather than from this file:
`node -e "console.log(require('./package.json').version)"`.

- Compatible with: **BMAD Method >= 6.3.0** (optional — works standalone). The floor is
  `REQUIRED_BMAD_VERSION` in `scripts/update/lib/compat-preflight.js`; the preflight *warns*
  and proceeds, so a lower version does not block installation
- Creates `_bmad/` directory automatically if missing
- Optional detection: BMAD Method config (bmad.yaml in _bmad/_config/)
- Teams: Vortex (7 agents), Gyre (4 agents)
- Skills: Enhance (initiatives-backlog)
- Team Factory: guided team creation (the `add-agent` and `add-skill` extensions are planned for Phase 3 and do not ship yet)

### Detection Logic

Convoke installers check:

1. **Required:** `_bmad/` directory exists
   - If missing: Created automatically by the installer
   - Installation proceeds in standalone mode

2. **Optional:** BMAD Method configuration (bmad.yaml in _bmad/_config/)
   - If found: Logged as detected
   - If missing: Warning only (installation continues in standalone mode)
   - Allows for different BMAD Method configurations

---

## Update Strategy

### When BMAD Method Updates

**Your Responsibility:**
- Monitor BMAD Method releases
- Test Convoke compatibility with new BMAD versions
- Update Convoke if breaking changes occur

**Recommended Process:**

1. **Test with new BMAD Method version:**
   ```bash
   # Install new BMAD Method version
   cd bmad && git pull && npm install

   # Test Convoke agents — each agent is a DIRECTORY containing SKILL.md
   cat _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md
   # Verify Emma still works

   # Run diagnostics to check all 7 agents
   npx -p convoke-agents convoke-doctor
   ```

2. **If agents break:**
   - Identify breaking changes in BMAD Method
   - Update Convoke agents/workflows
   - Increment Convoke version
   - Update compatibility documentation

3. **If agents work:**
   - Update compatibility matrix below
   - No Convoke changes needed

---

## Compatibility Matrix

| Convoke Version | Compatible BMAD Method Versions | Notes |
|----------------------|--------------------------------|-------|
| 4.0.x                | **>= 6.3.0** (optional — works standalone) | Enforced by `REQUIRED_BMAD_VERSION` (`scripts/update/lib/compat-preflight.js`); warns, does not block |
| 3.0.0                | not determined by the package | Team Factory extension *groundwork* (appenders + validator; the Add Agent / Add Skill workflows did not ship), multi-team docs-audit |
| 2.4.0                | not determined by the package | Enhance module, Gyre team (4 agents), Team Factory, skill validator |
| 2.3.x                | not determined by the package | Enhance module, skills architecture |
| 2.0.0                | not determined by the package | Product renamed to Convoke, CLI commands: `convoke-*` |
| 1.6.4                | not determined by the package | 7 Vortex agents, 22 workflows, Compass routing |
| 1.6.0                | not determined by the package | Added Mila, Liam, Noah; HC contracts; Compass routing |
| 1.5.x                | not determined by the package | Added Isla and Max, test hardening |
| 1.4.x                | not determined by the package | Architecture refactor, registry-driven |
| 1.3.x                | not determined by the package | Migration system |
| 1.0.x-alpha          | not determined by the package | Initial release (Emma and Wade only) |

**Why the pre-4.0 rows name no BMAD version.** They previously all read `1.x`. No Convoke
release ever targeted BMAD 1.x: that line was published once, on 2025-06-15
(`npm view bmad-method time --json`), months before Convoke's first release, and BMAD was
already on its 6.x line by the time 1.6.4 shipped. Nothing in the repository determined a
supported BMAD version before `compat-preflight.js` was added on 2026-04-25
(`git log --diff-filter=A -M --follow -- scripts/update/lib/compat-preflight.js`), so those
cells asserted something no object could confirm or contradict.

**The version column is authoritative only for rows a gate covers.** Releases after 3.0.0 —
3.1.0, 3.2.0, 3.2.1, 3.3.0 — are absent from this table; enumerate what actually shipped with
`git tag --list` and `CHANGELOG.md` rather than reading this list as complete. `1.6.4` has no
CHANGELOG entry and no git tag here, but it did ship: it was published on 2026-02-27 under the
package's pre-rename name (`bmad-enhanced` → `convoke-agents`; re-derive with `npm view bmad-enhanced time --json`).
The row is real; this repository's own records are what is incomplete.

---

## Breaking Change Scenarios

### Scenario 1: BMAD Method Changes Directory Structure

**Example:** BMAD moves from `_bmad/` to `bmad/`

**Impact:** Convoke installers will fail (can't find `_bmad/`)

**Solution:**
1. Update all installer scripts to check for new path
2. Support both old and new paths during transition
3. Release Convoke patch with updated paths
4. Document minimum BMAD Method version

---

### Scenario 2: BMAD Method Changes Agent Architecture

**Example:** BMAD changes XML agent format to YAML

**Impact:** All 7 Vortex agent files become incompatible

**Solution:**
1. Convert all agent definitions to new format
2. Update workflow files if format changes
3. Update templates if needed
4. Release Convoke major version bump
5. Document breaking change and migration path

---

### Scenario 3: BMAD Method Changes Config Format

**Example:** BMAD changes `config.yaml` structure

**Impact:** Convoke config.yaml becomes invalid

**Solution:**
1. Update installer config generation
2. Migrate existing configs (provide migration script)
3. Test with both old and new BMAD versions
4. Release Convoke patch
5. Document minimum BMAD Method version

---

## Version Strategy

### Semantic Versioning

Convoke follows semver:

- **Major (X.0.0):** Breaking changes (requires user action)
- **Minor (1.X.0):** New agents, features (backward compatible)
- **Patch (1.0.X):** Bug fixes, documentation (backward compatible)

### When to Bump Versions

**Major version bump (e.g., 1.x → 2.0):**
- BMAD Method breaking change requires Convoke updates
- Agent architecture fundamentally changes
- Incompatible with previous BMAD Method versions

**Minor version bump (e.g., 1.0 → 1.1):**
- New agent or workflow added
- New features added to existing agents
- Optional BMAD Method version requirement changes

**Patch version bump (e.g., 1.0.0 → 1.0.1):**
- Bug fixes in installers
- Documentation improvements
- No functional changes to agents

---

## Testing Compatibility

### Manual Testing Checklist

When new BMAD Method version releases:

- [ ] Install new BMAD Method version
- [ ] Run `npx -p convoke-agents convoke-install-vortex`
- [ ] Verify all files copied correctly
- [ ] Activate Emma: `cat _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md`
- [ ] Test Emma workflow: Type `LP` (Lean Persona) and complete all steps
- [ ] Activate Mila (or another recent agent): `cat _bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md`
- [ ] Run `npx -p convoke-agents convoke-doctor` to verify all 7 agents and 22 workflows
- [ ] Verify artifacts generated correctly
- [ ] Check for errors or warnings
- [ ] Update compatibility matrix if successful

### Automated Testing

Convoke includes automated test coverage. **Totals are not restated here** — they change on
almost every commit and nothing in the repository pins them. Derive them instead:

| Suite | What it covers | Derive with |
|---|---|---|
| **P0** | Agent activation, voice consistency, handoff contracts, Compass routing, workflow structure | `node scripts/test-runner.js tests/p0` |
| **Unit / lib / audit / team-factory** | Installers, update system, registries, audit scripts | `npm test` |
| **Integration** | End-to-end install and update flows | `npm run test:integration` |
| **Coverage** | Line/branch coverage for the CLI entry points | `npm run test:coverage` |
| **Docs audit** | Stale-reference, broken-link and broken-path detection across 17 user-facing files | `npm run docs:audit` |

All of the above run in CI (`.github/workflows/ci.yml`) on pushes to `main`, on pull requests
targeting `main`, and on `v*` tags — though not each under its own job: the P0 suite reaches CI
through `npm run test:coverage` in the `coverage` job, not a standalone p0 job. Check with
`grep -n 'run: npm' .github/workflows/ci.yml`.

---

## Communication Plan

### When Breaking Change Occurs

1. **Create GitHub Issue:**
   - Title: "BMAD Method vX.X.X Compatibility"
   - Document breaking changes
   - Outline required updates

2. **Update Documentation:**
   - Update this compatibility guide
   - Update README.md with version requirements
   - Update INSTALLATION.md with prerequisites

3. **Release Notes:**
   - Clearly state BMAD Method version requirements
   - Document breaking changes
   - Provide migration instructions

4. **User Notification:**
   - Update README badges if needed
   - Consider deprecation warnings for old versions

---

## Recommendations

### For Convoke Maintainers

1. **Monitor BMAD Method releases:**
   - Watch BMAD Method repository
   - Test compatibility with each release
   - Update compatibility matrix

2. **Maintain clear separation:**
   - Never include BMAD Method code in Convoke
   - Always check for BMAD Method presence
   - Document dependencies clearly

3. **Version conservatively:**
   - Don't break compatibility unnecessarily
   - Support multiple BMAD Method versions when possible
   - Clearly document minimum requirements

4. **Test thoroughly:**
   - Test with multiple BMAD Method versions
   - Automate compatibility testing when possible
   - Create regression tests for agents

### For Users

1. **Install directly:**
   - Run `npm install convoke-agents && npx -p convoke-agents convoke-install-vortex`
   - No prerequisite installation needed
   - BMAD Method is optional — installer handles both cases

2. **If using both packages:**
   - Check compatibility matrix before updating either
   - Test Convoke after updating BMAD Method
   - Report compatibility issues

3. **Stay informed:**
   - Watch for Convoke release notes
   - Check compatibility guide before updating
   - Report bugs or compatibility issues

---

## Summary

**Key Points:**

✅ Convoke works standalone — no BMAD Method required
✅ If BMAD Method is present, the installer detects and logs it
✅ Installers create `_bmad/` automatically if missing
✅ Compatibility should be tested if using both together
✅ Automated tests validate agent activation, content correctness, and CLI behavior — run `npm test` and `node scripts/test-runner.js tests/p0` for current totals

**For Maintainers:**

- Maintain Convoke agents separately from BMAD Method
- Test compatibility if BMAD Method releases breaking changes
- Update compatibility matrix when verified

**For Users:**

- Install with `npm install convoke-agents && npx -p convoke-agents convoke-install-vortex`
- No prerequisite installation needed
- If using BMAD Method alongside, check compatibility matrix before updating either package

---

**Applies to:** Convoke 4.0.x (`REQUIRED_BMAD_VERSION` >= 6.3.0)
**Last Updated:** 2026-09-13
**Status:** Living Document (update as needed)
