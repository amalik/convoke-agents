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

**Convoke creates:**
```
your-project/
└── _bmad/
    ├── bme/
    │   ├── _vortex/
    │   │   ├── agents/           # 7 agent definitions
    │   │   ├── workflows/        # 22 workflows
    │   │   ├── contracts/        # Handoff contracts (HC1-HC5 artifact, HC6-HC10 routing)
    │   │   ├── guides/           # 7 user guides
    │   │   └── config.yaml
    │   ├── _gyre/
    │   │   ├── agents/           # 4 agent definitions
    │   │   ├── workflows/        # 7 workflows
    │   │   ├── contracts/        # GC1-GC4 handoff contracts
    │   │   ├── guides/           # 4 user guides
    │   │   └── config.yaml
    │   └── _enhance/
    │       ├── workflows/        # Skill workflows
    │       ├── extensions/       # Agent menu patches
    │       └── config.yaml
    └── _config/
        └── agent-manifest.csv (updated)
```

---

## Compatibility Requirements

### Current Version

**Convoke v2.4.0**
- Compatible with: BMAD Method v1.x (optional — works standalone)
- Creates `_bmad/` directory automatically if missing
- Optional detection: BMAD Method config (bmad.yaml in _bmad/_config/)
- Teams: Vortex (7 agents), Gyre (4 agents)
- Skills: Enhance (initiatives-backlog)

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

   # Test Convoke agents
   cat _bmad/bme/_vortex/agents/contextualization-expert.md
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
| 2.4.0                | 1.x (optional — works standalone) | Enhance module, Gyre team (4 agents), Team Factory, skill validator |
| 2.3.x                | 1.x (optional — works standalone) | Enhance module, skills architecture |
| 2.0.0                | 1.x (optional — works standalone) | Product renamed to Convoke, CLI commands: `convoke-*` |
| 1.6.4                | 1.x (optional — works standalone) | 7 Vortex agents, 22 workflows, Compass routing |
| 1.6.0                | 1.x (optional — works standalone) | Added Mila, Liam, Noah; HC contracts; Compass routing |
| 1.5.x                | 1.x (optional — works standalone) | Added Isla and Max, test hardening |
| 1.4.x                | 1.x (optional — works standalone) | Architecture refactor, registry-driven |
| 1.3.x                | 1.x (assumed)                  | Migration system |
| 1.0.x-alpha          | 1.x (assumed)                  | Initial release (Emma and Wade only) |

**Updated as versions are released and tested.**

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
- [ ] Activate Emma: `cat _bmad/bme/_vortex/agents/contextualization-expert.md`
- [ ] Test Emma workflow: Type `LP` (Lean Persona) and complete all steps
- [ ] Activate Mila (or another recent agent): `cat _bmad/bme/_vortex/agents/research-convergence-specialist.md`
- [ ] Run `npx -p convoke-agents convoke-doctor` to verify all 7 agents and 22 workflows
- [ ] Verify artifacts generated correctly
- [ ] Check for errors or warnings
- [ ] Update compatibility matrix if successful

### Automated Testing

Convoke includes automated test coverage:

- **P0 activation tests:** Verify all 7 agents activate correctly (642 assertions)
- **Content correctness tests:** Validate voice consistency, handoff contracts, Compass routing
- **CLI tests:** convoke-update.js (92.91% coverage), convoke-version.js (95.52% coverage)
- **Docs audit:** Programmatic stale-reference, broken-link, and broken-path detection across 16 user-facing files
- **Total:** 293 tests, 0 failures, CI-integrated

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
✅ 293 automated tests validate agent activation, content correctness, and CLI behavior

**For Maintainers:**

- Maintain Convoke agents separately from BMAD Method
- Test compatibility if BMAD Method releases breaking changes
- Update compatibility matrix when verified

**For Users:**

- Install with `npm install convoke-agents && npx -p convoke-agents convoke-install-vortex`
- No prerequisite installation needed
- If using BMAD Method alongside, check compatibility matrix before updating either package

---

**Version:** 2.4.0
**Last Updated:** 2026-03-24
**Status:** Living Document (update as needed)
