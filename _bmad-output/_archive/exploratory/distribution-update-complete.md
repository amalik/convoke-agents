---
title: "Distribution Strategy Update Complete"
date: 2026-02-07
status: COMPLETE
---

# Distribution Strategy Update Complete

**Updated:** phase-0-implementation-guide.md v1.0.0 → v1.1.0
**Date:** 2026-02-07
**Changes:** Incorporated user distribution decisions (bme module, npm package, explicit slash commands)

---

## User Decisions Incorporated

### 1. Module Name: `bme`
- Changed all references from `convoke` to `bme`
- Updated agent frontmatter: `module: bme`
- Updated file paths: `_bmad/bme/` (instead of `_bmad-enhanced/`)

### 2. Distribution Method: npm package
- Package name: `@bmad/enhanced` (or `convoke`)
- Installation: `npm install -g @bmad/enhanced`
- Added npm package structure to Appendix A
- Documented post-install script functionality
- Added installation script pseudo-code

### 3. Slash Command Format: `/bmad-agent-bme-{agent-name}`
- Changed from `/bmad-agent-designos-empathy-mapper` to `/bmad-agent-bme-empathy-mapper`
- Changed from `/bmad-agent-agentos-quality-gatekeeper` to `/bmad-agent-bme-quality-gatekeeper`
- Explicit module prefix for all 4 agents

---

## What Changed in phase-0-implementation-guide.md

### Version Update
```yaml
version: 1.0.0 → 1.1.0
distribution:
  module_name: bme
  installation: npm package
  slash_command_format: /bmad-agent-bme-{agent-name}
related_docs:
  - distribution-strategy.md  # NEW
```

### Module References (Global Find/Replace)
- ✅ `module: designos` → `module: bme` (2 occurrences)
- ✅ `module: agentos` → `module: bme` (2 occurrences)

### File Paths (Global Find/Replace)
- ✅ `_bmad-enhanced/_designos/` → `_bmad/bme/_designos/` (all occurrences)
- ✅ `_bmad-enhanced/_agentos/` → `_bmad/bme/_agentos/` (all occurrences)
- ✅ `_bmad-enhanced/workflows/` → `_bmad/bme/workflows/` (all occurrences)

### Slash Commands (Global Find/Replace)
- ✅ `/bmad-agent-designos-empathy-mapper` → `/bmad-agent-bme-empathy-mapper`
- ✅ `/bmad-agent-designos-wireframe-designer` → `/bmad-agent-bme-wireframe-designer`
- ✅ `/bmad-agent-agentos-quality-gatekeeper` → `/bmad-agent-bme-quality-gatekeeper`
- ✅ `/bmad-agent-agentos-standards-auditor` → `/bmad-agent-bme-standards-auditor`

### New Sections Added

#### Appendix A: Distribution & Installation (NEW)

**npm Package Structure:**
- Package name: `@bmad/enhanced` (or `convoke`)
- Installation command: `npm install -g @bmad/enhanced`
- Post-install script: Automatically copies module + updates manifest
- CLI command: `convoke install` or `bme install`

**Installation Flow:**
1. Detect BMAD Method installation
2. Copy `bme` module to `_bmad/bme/`
3. Update `_bmad/_config/agent-manifest.csv`
4. Verify installation
5. Display slash commands

**Example agent-manifest.csv entries:**
```csv
"empathy-mapper","Emma",...,"bme","_bmad/bme/_designos/agents/empathy-mapper.md"
"wireframe-designer","Wade",...,"bme","_bmad/bme/_designos/agents/wireframe-designer.md"
"quality-gatekeeper","Quinn",...,"bme","_bmad/bme/_agentos/agents/quality-gatekeeper.md"
"standards-auditor","Stan",...,"bme","_bmad/bme/_agentos/agents/standards-auditor.md"
```

**Installation Script (install.js) - Pseudo-code:**
- Error if BMAD Method not found
- Copy module to `_bmad/bme`
- Append 4 agents to agent-manifest.csv
- Display success + slash commands

**Slash Command Format Documentation:**
- Pattern: `/bmad-agent-bme-{agent-name}`
- Examples with all 4 agents
- Rationale: Clear module ownership, avoids conflicts, easy to identify in party mode

#### Appendix B: File Structure Summary (Updated)

**Changed:**
- Root directory: `_bmad-enhanced/` → `_bmad/bme/`
- Added npm package files: `package.json`, `install.js`
- Added module config: `_bmad/bme/_config/module.yaml`
- Updated all sub-paths to reflect `_bmad/bme/` structure

---

## Summary of Changes

### Files Updated: 1
- ✅ phase-0-implementation-guide.md (v1.0.0 → v1.1.0)

### Global Replacements Made:
1. Module names: `designos` → `bme`, `agentos` → `bme`
2. File paths: `_bmad-enhanced/` → `_bmad/bme/`
3. Slash commands: Added explicit `bme` prefix

### Sections Added:
1. Frontmatter distribution metadata
2. Appendix A: Distribution & Installation (npm package structure, installation script, slash commands)
3. Updated Appendix B: File structure with `_bmad/bme/` and npm files

### LOC Impact:
- Implementation guide: +~150 LOC (npm documentation added)
- Actual Phase 0 code: No change (still ~500 LOC)

---

## Alignment Check

### ✅ Aligned Documents
1. ✅ phase-0-implementation-guide.md v1.1.0 (UPDATED)
2. ✅ distribution-strategy.md (already reflects bme/npm/slash command decisions)

### 📝 Other Documents (No Update Needed)
- architectural-decision-record.md (mentions agent enhancement, not distribution details)
- integration-roadmap.md (Phase 0 tasks, not distribution)
- framework-deep-dive-analysis.md (framework analysis, not distribution)
- PIVOT-SUMMARY-2026-02-07.md (pivot rationale, not distribution)

**Reason:** Distribution details are implementation-level concerns documented in implementation guide, not architectural/strategic concerns.

---

## Next Steps

### Ready to Start Implementation

**Phase 0 Week 1 (When Ready):**

**Day 1-2: Create Emma (Empathy Mapper)**
```bash
# File structure
_bmad/bme/_designos/agents/empathy-mapper.md
_bmad/bme/_designos/workflows/empathy-map/workflow.md
_bmad/bme/_designos/workflows/empathy-map/steps/step-01-define-user.md
...

# Agent frontmatter
module: bme

# Slash command to test
/bmad-agent-bme-empathy-mapper
```

**Day 3-4: Create Wade (Wireframe Designer)**
```bash
# File structure
_bmad/bme/_designos/agents/wireframe-designer.md
_bmad/bme/_designos/workflows/wireframe/workflow.yaml
_bmad/bme/_designos/workflows/wireframe/instructions.md

# Agent frontmatter
module: bme

# Slash command to test
/bmad-agent-bme-wireframe-designer
```

### npm Package Creation (Post Phase 0)

**After Week 3 (all 4 agents working):**
1. Create package.json with Convoke metadata
2. Write install.js post-install script
3. Test installation on fresh BMAD Method install
4. Publish to npm registry: `npm publish`
5. Test end-to-end: `npm install -g @bmad/enhanced`

---

## Verification Checklist

### Implementation Guide Updated ✅
- [x] Module name: `bme` everywhere
- [x] File paths: `_bmad/bme/` structure
- [x] Slash commands: `/bmad-agent-bme-{agent-name}` format
- [x] npm package documentation added (Appendix A)
- [x] File structure updated (Appendix B)
- [x] Version bumped: v1.1.0
- [x] Frontmatter distribution metadata added

### User Decisions Reflected ✅
- [x] Question 1: Module name → `bme`
- [x] Question 2: Distribution → npm package
- [x] Question 3: Slash commands → `/bmad-agent-bme-empathy-mapper`

### Documentation Complete ✅
- [x] Installation flow documented
- [x] agent-manifest.csv entries shown
- [x] Installation script pseudo-code provided
- [x] Slash command format explained with rationale

---

## Summary

**Status:** ✅ **COMPLETE**

**Distribution strategy finalized and documented:**
- Module name: `bme`
- Distribution: npm package (`@bmad/enhanced`)
- Installation: `npm install -g @bmad/enhanced`
- Slash commands: `/bmad-agent-bme-{agent-name}`

**Implementation guide updated to v1.1.0** with:
- All module references changed to `bme`
- All file paths updated to `_bmad/bme/` structure
- All slash commands updated to explicit `bme` prefix
- npm package structure & installation documented (Appendix A)
- File structure summary updated (Appendix B)

**Ready to begin Phase 0 implementation following updated guide.**

---

**End of Distribution Update**
