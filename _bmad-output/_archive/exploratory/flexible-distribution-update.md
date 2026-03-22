---
title: "Flexible Distribution Update: Individual + Bulk Installation"
date: 2026-02-07
version: 1.0.0
status: COMPLETE
---

# Flexible Distribution Update Complete

**User Request:** "I'd like the new agents to be individually deployable (one npm command by agent) AND all at once (one single command for all)"

**Impact:** Distribution strategy and implementation guide updated to support both individual and bulk installation.

---

## What Changed

### distribution-strategy.md (v1.0.0 → v2.0.0)

**Added:**
- Section: "Final Distribution Architecture (v2.0.0)"
- npm package structure: 6 packages total
  - 1 core package (`@bmad/bme-core`)
  - 4 individual agent packages
  - 1 bundle package (`@bmad/bme`)
- Installation flow for individual vs bulk
- File structure after individual vs bulk install
- Package dependencies architecture
- Uninstallation for individual vs bulk
- 4 detailed use cases
- Implementation requirements section
- Installation script templates
- Shared installation helper code

**Status:** v1.0.0 → v2.0.0 (FINALIZED)

### phase-0-implementation-guide.md (v1.1.0 → v1.2.0)

**Updated:**
- Frontmatter: Added `flexibility: install individual agents OR all at once`
- Appendix A: Completely rewritten to show individual + bulk installation
  - Package options (individual vs bundle)
  - 3 installation examples (individual, bulk, gradual adoption)
  - Uninstallation examples
  - agent-manifest.csv entries for both scenarios
- Installation Scripts section: Added 3 script templates
  - `@bmad/bme-core/install-helper.js` (shared utilities)
  - Individual agent `install.js` (example: empathy-mapper)
  - Bundle package `install.js` (meta-package)
- Appendix B: Updated file counts and LOC estimates
  - Total files: ~48 (30 agents + 18 npm package files)
  - Total LOC: ~850-1,050 (including installation scripts)
- Appendix C: NEW - 4 use cases for individual vs bulk installation

**Status:** v1.1.0 → v1.2.0

---

## npm Package Architecture

### 6 Packages Total

```
@bmad/bme-core                    # Shared installation utilities
@bmad/bme-empathy-mapper          # Emma (individual)
@bmad/bme-wireframe-designer      # Wade (individual)
@bmad/bme-quality-gatekeeper      # Quinn (individual)
@bmad/bme-standards-auditor       # Stan (individual)
@bmad/bme                         # Bundle (all 4 agents)
```

### Package Dependencies

**Individual Packages:**
```json
{
  "name": "@bmad/bme-empathy-mapper",
  "peerDependencies": {
    "@bmad/bme-core": "^1.0.0"
  }
}
```

**Bundle Package:**
```json
{
  "name": "@bmad/bme",
  "dependencies": {
    "@bmad/bme-core": "^1.0.0",
    "@bmad/bme-empathy-mapper": "^1.0.0",
    "@bmad/bme-wireframe-designer": "^1.0.0",
    "@bmad/bme-quality-gatekeeper": "^1.0.0",
    "@bmad/bme-standards-auditor": "^1.0.0"
  }
}
```

**Core Package:**
```json
{
  "name": "@bmad/bme-core",
  "main": "install-helper.js",
  "files": ["install-helper.js", "_config/module.yaml"]
}
```

---

## Installation Examples

### Individual Agent Install

```bash
npm install -g @bmad/bme-empathy-mapper

# Output:
✅ Emma (empathy-mapper) installed successfully!
Invoke with: /bmad-agent-bme-empathy-mapper

# What installed:
# - @bmad/bme-core (if not already present)
# - empathy-mapper.md → _bmad/bme/_designos/agents/
# - empathy-map/ workflow → _bmad/bme/_designos/workflows/
# - 1 entry added to agent-manifest.csv
```

### Bulk Install

```bash
npm install -g @bmad/bme

# Output:
✅ Convoke installed successfully!
4 agents available:
  /bmad-agent-bme-empathy-mapper      (Emma - Empathy Mapping)
  /bmad-agent-bme-wireframe-designer  (Wade - Wireframes)
  /bmad-agent-bme-quality-gatekeeper  (Quinn - Quality Gates)
  /bmad-agent-bme-standards-auditor   (Stan - Standards Auditing)

Run '/bmad-party-mode' to see all 25 agents!

# What installed:
# - @bmad/bme-core
# - All 4 individual agent packages (as dependencies)
# - Complete _bmad/bme/ directory structure
# - 4 entries added to agent-manifest.csv
```

### Gradual Adoption

```bash
# Week 1: Try Emma
npm install -g @bmad/bme-empathy-mapper

# Week 2: Add Wade
npm install -g @bmad/bme-wireframe-designer

# Week 3: Upgrade to full bundle
npm install -g @bmad/bme
# Detects Emma + Wade already installed, adds Quinn + Stan
```

---

## Use Cases

### Use Case 1: UX Designer (Emma Only)
**Need:** Empathy mapping for user research
**Install:** `npm install -g @bmad/bme-empathy-mapper`
**LOC Installed:** 235 LOC (vs 1,240 LOC if bulk install)
**Benefit:** Only installs what's needed

### Use Case 2: QA Team (Quality Agents Only)
**Need:** Quality gates and standards auditing
**Install:**
```bash
npm install -g @bmad/bme-quality-gatekeeper
npm install -g @bmad/bme-standards-auditor
```
**LOC Installed:** 675 LOC (Quinn + Stan)
**Benefit:** Skips design agents they won't use

### Use Case 3: Full Product Team (All Agents)
**Need:** All capabilities (design + quality)
**Install:** `npm install -g @bmad/bme`
**LOC Installed:** 1,240 LOC (all 4 agents)
**Benefit:** One command, everything installed

### Use Case 4: Gradual Adoption
**Need:** Try before committing
**Install:** Start with one agent, add more over time
**Benefit:** Lower barrier to entry, natural upgrade path

---

## File Structure Differences

### After Individual Install (Emma Only)

```
_bmad/bme/
├── _config/
│   └── module.yaml
├── _designos/
│   ├── config.yaml
│   ├── agents/
│   │   └── empathy-mapper.md       # Emma
│   └── workflows/
│       └── empathy-map/            # Emma's workflow
└── _agentos/                       # Empty (not installed)
```

**agent-manifest.csv:**
- 1 entry: "empathy-mapper","Emma",...

### After Bulk Install (All Agents)

```
_bmad/bme/
├── _config/
│   └── module.yaml
├── _designos/
│   ├── config.yaml
│   ├── agents/
│   │   ├── empathy-mapper.md       # Emma
│   │   └── wireframe-designer.md   # Wade
│   └── workflows/
│       ├── empathy-map/
│       └── wireframe/
└── _agentos/
    ├── config.yaml
    ├── agents/
    │   ├── quality-gatekeeper.md   # Quinn
    │   └── standards-auditor.md    # Stan
    └── workflows/
        ├── quality-gate/
        └── audit-standards/
```

**agent-manifest.csv:**
- 4 entries: "empathy-mapper","Emma",... + "wireframe-designer","Wade",... + "quality-gatekeeper","Quinn",... + "standards-auditor","Stan",...

---

## Installation Script Architecture

### Shared Helper (@bmad/bme-core)

**File:** `install-helper.js`

**Exports:**
- `findBmadRoot()` - Locates BMAD Method installation
- `installAgent(config)` - Installs individual agent
- `copyRecursive(src, dest)` - Recursively copies directories

**Used By:** All 4 individual agent packages

### Individual Agent Script

**File:** `@bmad/bme-empathy-mapper/install.js`

**Functionality:**
1. Imports `installAgent` from `@bmad/bme-core`
2. Defines agent config (name, displayName, title, icon, paths)
3. Calls `installAgent(config)`
4. Displays success message with slash command

**Template:**
```javascript
const { installAgent } = require('@bmad/bme-core/install-helper');

const AGENT_CONFIG = {
  name: 'empathy-mapper',
  displayName: 'Emma',
  title: 'Empathy Mapping Specialist',
  icon: '🎨',
  module: 'bme',
  submodule: '_designos',
  agentFile: 'agent/empathy-mapper.md',
  workflows: ['agent/workflows/empathy-map']
};

installAgent(AGENT_CONFIG)
  .then(() => {
    console.log('✅ Emma (empathy-mapper) installed successfully!');
    console.log('Invoke with: /bmad-agent-bme-empathy-mapper');
  })
  .catch(err => {
    console.error('❌ Installation failed:', err.message);
    process.exit(1);
  });
```

**Repeated For:** Wade, Quinn, Stan (each with their own config)

### Bundle Script

**File:** `@bmad/bme/install.js`

**Functionality:**
- Displays success message listing all 4 agents
- All actual installation handled by individual package dependencies

**Why Simple?**
- npm automatically installs all dependencies first
- Each dependency's post-install script already ran
- Bundle just confirms everything installed

---

## Phase 0 Implementation Impact

### New Deliverables Added

**npm Package Files:**
1. `@bmad/bme-core/package.json`
2. `@bmad/bme-core/install-helper.js`
3. `@bmad/bme-core/README.md`
4. `@bmad/bme-empathy-mapper/package.json`
5. `@bmad/bme-empathy-mapper/install.js`
6. `@bmad/bme-empathy-mapper/README.md`
7. `@bmad/bme-wireframe-designer/package.json`
8. `@bmad/bme-wireframe-designer/install.js`
9. `@bmad/bme-wireframe-designer/README.md`
10. `@bmad/bme-quality-gatekeeper/package.json`
11. `@bmad/bme-quality-gatekeeper/install.js`
12. `@bmad/bme-quality-gatekeeper/README.md`
13. `@bmad/bme-standards-auditor/package.json`
14. `@bmad/bme-standards-auditor/install.js`
15. `@bmad/bme-standards-auditor/README.md`
16. `@bmad/bme/package.json`
17. `@bmad/bme/install.js`
18. `@bmad/bme/README.md`

**Total:** 18 new npm package files

### LOC Impact

**Original Estimate:**
- Agent + workflow code: 500 LOC
- Total: 500 LOC

**Updated Estimate:**
- Agent + workflow code: 500-700 LOC (unchanged)
- Installation scripts: +200 LOC
  - install-helper.js: ~80 LOC
  - 4 × individual install.js: ~20 LOC each = 80 LOC
  - 1 × bundle install.js: ~10 LOC
  - Utility functions: ~30 LOC
- package.json files: +150 LOC
  - 6 × package.json: ~25 LOC each
- README.md files: +300 LOC (documentation)
  - 6 × README.md: ~50 LOC each

**New Total:** ~850-1,050 LOC code + 300 LOC docs = 1,150-1,350 LOC

**Still Significantly Less Than Original Plan:**
- Original custom orchestration: 1,800 LOC
- Agent enhancement: 1,150 LOC (36% reduction)

---

## Benefits of Flexible Distribution

### For Users

1. **Lower Barrier to Entry**
   - Try one agent before committing to all
   - "Install Emma, see if you like it"

2. **Cost Efficiency**
   - Don't install agents you won't use
   - UX designer doesn't need QA agents

3. **Gradual Adoption**
   - Start small, expand naturally
   - Natural upgrade path: individual → bundle

4. **Targeted Use Cases**
   - Design teams: Emma + Wade only
   - QA teams: Quinn + Stan only
   - Full teams: All 4 agents

### For Project

1. **Easier Marketing**
   - "Try Emma for free" → "Upgrade to full Convoke"
   - Showcase specific agents for specific personas

2. **Better Metrics**
   - Which agents are most popular?
   - Individual install counts show adoption patterns

3. **Flexible Maintenance**
   - Update individual agents independently
   - Bug fix in Emma doesn't require Wade update
   - Independent version numbering per agent

4. **Adoption Funnel**
   - Individual install → Trial
   - Bulk install → Conversion
   - Measure conversion rate

---

## Summary

**Status:** ✅ **COMPLETE**

**Documents Updated:**
1. ✅ distribution-strategy.md (v1.0.0 → v2.0.0)
2. ✅ phase-0-implementation-guide.md (v1.1.0 → v1.2.0)

**Distribution Strategy Finalized:**
- **6 npm packages**: 1 core + 4 individual + 1 bundle
- **Flexible installation**: Individual OR bulk
- **Slash commands**: `/bmad-agent-bme-{agent-name}`
- **Module name**: `bme`

**Key Decisions:**
- ✅ Individual agent packages for targeted installation
- ✅ Bundle package for all-at-once installation
- ✅ Shared core package for installation utilities
- ✅ Post-install scripts for automatic BMAD Method integration
- ✅ Graceful handling of gradual adoption (detect existing agents)

**Implementation Impact:**
- +18 npm package files
- +200 LOC installation scripts
- +150 LOC package.json files
- +300 LOC documentation
- **Total new LOC:** 1,150-1,350 (still 36% less than original 1,800 LOC plan)

**Next Step:** Begin Phase 0 implementation following updated guide

---

**End of Flexible Distribution Update**
