# BMAD Method Compatibility Guide

**BMAD-Enhanced** is an extension package for the **BMAD Method**. This document explains the relationship, compatibility requirements, and update strategy.

---

## Relationship Between BMAD Method and BMAD-Enhanced

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
│        BMAD-Enhanced (Extension Package)        │
│  - 7 domain-specialized Vortex agents           │
│  - Emma (contextualization-expert)              │
│  - Isla (discovery-empathy-expert)              │
│  - Mila (research-convergence-specialist)       │
│  - Liam (hypothesis-engineer)                   │
│  - Wade (lean-experiments-specialist)            │
│  - Noah (production-intelligence-specialist)    │
│  - Max (learning-decision-expert)               │
└─────────────────────────────────────────────────┘
```

### Key Principle

**BMAD-Enhanced does NOT include BMAD Method.**

- Users must install BMAD Method first
- BMAD-Enhanced adds agents to existing BMAD installation
- BMAD-Enhanced installers verify BMAD Method presence
- Prevents duplicate code and maintenance burden

---

## Installation Flow

### Correct Installation Order

```bash
# Step 1: Install BMAD Method (required)
npx bmad-method@alpha install

# Step 2: Install BMAD-Enhanced agents (extension)
npm install bmad-enhanced@alpha
npx bmad-install-agents
```

### What Happens

**BMAD Method creates:**
```
your-project/
└── _bmad/
    ├── _config/
    │   └── bmad.yaml
    └── (other BMAD core files)
```

**BMAD-Enhanced adds:**
```
your-project/
└── _bmad/
    ├── bme/
    │   └── _vortex/
    │       ├── agents/           # 7 agent definitions
    │       ├── workflows/        # 22 workflows
    │       ├── contracts/        # HC1-HC5 handoff contracts
    │       ├── guides/           # 7 user guides
    │       └── config.yaml
    └── _config/
        └── agent-manifest.csv (updated)
```

---

## Compatibility Requirements

### Current Version

**BMAD-Enhanced v1.6.4**
- Compatible with: BMAD Method v1.x (optional — works standalone)
- Creates `_bmad/` directory automatically if missing
- Optional detection: BMAD Method config (bmad.yaml in _bmad/_config/)

### Detection Logic

BMAD-Enhanced installers check:

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
- Test BMAD-Enhanced compatibility with new BMAD versions
- Update BMAD-Enhanced if breaking changes occur

**Recommended Process:**

1. **Test with new BMAD Method version:**
   ```bash
   # Install new BMAD Method version
   cd bmad && git pull && npm install

   # Test BMAD-Enhanced agents
   cat _bmad/bme/_vortex/agents/contextualization-expert.md
   # Verify Emma still works

   # Run diagnostics to check all 7 agents
   npx bmad-doctor
   ```

2. **If agents break:**
   - Identify breaking changes in BMAD Method
   - Update BMAD-Enhanced agents/workflows
   - Increment BMAD-Enhanced version
   - Update compatibility documentation

3. **If agents work:**
   - Update compatibility matrix below
   - No BMAD-Enhanced changes needed

---

## Compatibility Matrix

| BMAD-Enhanced Version | Compatible BMAD Method Versions | Notes |
|----------------------|--------------------------------|-------|
| 1.6.4                | 1.x (optional — works standalone) | Current release — 7 agents, 22 workflows, Compass routing |
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

**Impact:** BMAD-Enhanced installers will fail (can't find `_bmad/`)

**Solution:**
1. Update all installer scripts to check for new path
2. Support both old and new paths during transition
3. Release BMAD-Enhanced v1.1.0 with updated paths
4. Document minimum BMAD Method version

---

### Scenario 2: BMAD Method Changes Agent Architecture

**Example:** BMAD changes XML agent format to YAML

**Impact:** All 7 Vortex agent files become incompatible

**Solution:**
1. Convert all agent definitions to new format
2. Update workflow files if format changes
3. Update templates if needed
4. Release BMAD-Enhanced v2.0.0 (major version bump)
5. Document breaking change and migration path

---

### Scenario 3: BMAD Method Changes Config Format

**Example:** BMAD changes `config.yaml` structure

**Impact:** BMAD-Enhanced config.yaml becomes invalid

**Solution:**
1. Update installer config generation
2. Migrate existing configs (provide migration script)
3. Test with both old and new BMAD versions
4. Release BMAD-Enhanced v1.1.0
5. Document minimum BMAD Method version

---

## Version Strategy

### Semantic Versioning

BMAD-Enhanced follows semver:

- **Major (X.0.0):** Breaking changes (requires user action)
- **Minor (1.X.0):** New agents, features (backward compatible)
- **Patch (1.0.X):** Bug fixes, documentation (backward compatible)

### When to Bump Versions

**Major version bump (e.g., 1.x → 2.0):**
- BMAD Method breaking change requires BMAD-Enhanced updates
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
- [ ] Run `npx bmad-install-vortex-agents`
- [ ] Verify all files copied correctly
- [ ] Activate Emma: `cat _bmad/bme/_vortex/agents/contextualization-expert.md`
- [ ] Test Emma workflow: Type `LP` (Lean Persona) and complete all steps
- [ ] Activate Mila (or another recent agent): `cat _bmad/bme/_vortex/agents/research-convergence-specialist.md`
- [ ] Run `npx bmad-doctor` to verify all 7 agents and 22 workflows
- [ ] Verify artifacts generated correctly
- [ ] Check for errors or warnings
- [ ] Update compatibility matrix if successful

### Automated Testing (Future)

Recommended automated tests:

1. **Installation test:** Verify installer detects BMAD Method
2. **File integrity test:** Verify all files copied correctly
3. **Agent activation test:** Verify agents load without errors
4. **Workflow execution test:** Run complete workflows
5. **Artifact generation test:** Verify output files created

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

### For BMAD-Enhanced Maintainers

1. **Monitor BMAD Method releases:**
   - Watch BMAD Method repository
   - Test compatibility with each release
   - Update compatibility matrix

2. **Maintain clear separation:**
   - Never include BMAD Method code in BMAD-Enhanced
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

1. **Install in correct order:**
   - Always install BMAD Method first
   - Then install BMAD-Enhanced

2. **Keep versions in sync:**
   - Check compatibility matrix before updating
   - Test BMAD-Enhanced after updating BMAD Method
   - Report compatibility issues

3. **Stay informed:**
   - Watch for BMAD-Enhanced release notes
   - Check compatibility guide before updating
   - Report bugs or compatibility issues

---

## Future Enhancements

### Automated Compatibility Checking

**Proposed:** Add version detection to installers

```javascript
// Pseudocode
function checkBMADMethodVersion() {
  const bmadVersion = readBMADVersion(); // from bmad.yaml or package.json
  const compatibleVersions = ['1.0.x', '1.1.x'];

  if (!isCompatible(bmadVersion, compatibleVersions)) {
    console.warn(`
      Warning: BMAD Method version ${bmadVersion} may not be compatible.
      BMAD-Enhanced tested with: ${compatibleVersions.join(', ')}

      Continue anyway? (y/n)
    `);
  }
}
```

### Version Pinning

**Proposed:** Allow users to pin BMAD Method version

```json
// bmad-enhanced-config.json
{
  "bmadMethodVersion": "1.0.0",
  "strict": true
}
```

---

## Summary

**Key Points:**

✅ BMAD-Enhanced extends BMAD Method (does not include it)
✅ BMAD Method is a required prerequisite
✅ Installers check for BMAD Method presence
✅ Compatibility must be tested with each BMAD Method update
✅ Clear documentation prevents user confusion

**Your Responsibility:**

- Maintain BMAD-Enhanced agents separately from BMAD Method
- Test compatibility when BMAD Method updates
- Update BMAD-Enhanced only when needed
- Document compatibility clearly

**User Benefits:**

- No duplicate code
- Smaller package size
- Clear separation of concerns
- Flexibility to use BMAD Method with or without BMAD-Enhanced

---

**Version:** 1.6.4
**Last Updated:** 2026-03-02
**Status:** Living Document (update as needed)
