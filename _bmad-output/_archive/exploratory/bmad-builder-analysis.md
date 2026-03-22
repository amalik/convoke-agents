---
title: "Should We Use BMAD Builder Instead of Manual Agent Creation?"
date: 2026-02-07
version: 1.0.0
status: ANALYSIS
---

# BMAD Builder vs Manual Agent Creation

**User Question:** Would it be better to implement these new capacities using BMAD Builder (bmb)?

**Repository:** https://github.com/bmad-code-org/bmad-builder

---

## What is BMAD Builder?

BMAD Builder (BMB) is a **meta-module** for BMAD Method that provides guided workflows for creating:
1. **Agents** - Specialized AI systems with domain expertise
2. **Workflows** - Structured processes with steps and decision logic
3. **Modules** - Packaged bundles combining agents and workflows

**Installation:**
```bash
npx bmad-method@alpha install
# Select BMB from available modules
```

**Entry Points:**
- `/bmb-agent` - Agent creation workflow
- `/bmb-workflow` - Workflow design workflow
- `/bmb-module` - Module packaging workflow

---

## How BMAD Builder Works

### Agent Creation Process

**Command:** `/bmb-agent`

**Interactive Workflow:**
1. Asks: "What domain should this agent specialize in?"
2. Provides contextual guidance for knowledge areas
3. Helps configure:
   - Custom expertise
   - Communication styles
   - Tool access
4. Generates `.agent.yaml` files in `agents/` directory

**Output Structure:**
```
your-module/
├── src/
│   ├── module.yaml
│   ├── agents/
│   │   └── your-agent.agent.yaml
│   ├── workflows/
│   └── tools/
└── package.json
```

**Publishing:**
- Git tag: `git tag v1.0.0`
- Push to repository
- Share with community

---

## Current Approach vs BMAD Builder

### Current Approach (Manual Creation)

**What We're Doing:**
1. Manually creating 4 agent files (Emma, Wade, Quinn, Stan)
2. Writing workflows using existing BMAD patterns (step-files OR YAML+instructions)
3. Packaging as 6 npm packages (individual + bundle)
4. Writing custom installation scripts (install-helper.js)
5. Distributing via npm registry

**Advantages:**
- ✅ Full control over agent structure
- ✅ Custom npm distribution (individual + bulk)
- ✅ Flexible installation (gradual adoption path)
- ✅ We understand BMAD agent architecture deeply
- ✅ Can reuse existing BMAD workflow patterns
- ✅ Direct file control (no abstraction layer)

**Disadvantages:**
- ❌ More manual work (writing agents from scratch)
- ❌ Need to write installation scripts manually
- ❌ More code to maintain (~850-1,050 LOC)

---

### BMAD Builder Approach

**What We Would Do:**
1. Use `/bmb-agent` to create 4 agents interactively
2. Use `/bmb-workflow` to create workflows
3. Use `/bmb-module` to package as a module
4. Publish via git tags (standard BMAD module distribution)

**Advantages:**
- ✅ Guided interactive workflows (easier agent creation)
- ✅ Follows BMAD Builder conventions (standardized)
- ✅ Less manual code writing
- ✅ Built-in module packaging
- ✅ Community-standard distribution

**Disadvantages:**
- ❌ **No npm individual agent packages** (BMAD Builder creates modules, not individual npm packages)
- ❌ **No flexible installation** (all-or-nothing module install, not gradual adoption)
- ❌ **Abstraction layer** (BMAD Builder generates code, less direct control)
- ❌ **Unknown if supports step-file vs YAML+instructions patterns** (documentation doesn't specify)
- ❌ **Git-tag distribution only** (no npm registry flexibility)
- ❌ **All agents in one module** (can't install Emma separately from Wade)

---

## Critical Differences

### Distribution Model

**Current Approach:**
```bash
# User can choose:
npm install -g @bmad/bme-empathy-mapper      # Emma only
npm install -g @bmad/bme-quality-gatekeeper  # Quinn only
npm install -g @bmad/bme                     # All 4 agents
```

**BMAD Builder Approach:**
```bash
# User gets all agents at once:
bmad install your-module
# OR (git-based):
git clone https://github.com/your-org/your-module.git
cd your-module
./install.sh
```

**Impact:** **BMAD Builder does NOT support individual agent installation.** Users must install the entire module (all 4 agents) at once.

**User Requirement:** "I'd like the new agents to be individually deployable (one npm command by agent) AND all at once"

**Result:** ❌ BMAD Builder **DOES NOT MEET** this requirement.

---

### Workflow Architecture Support

**Current Approach:**
- Emma: Step-file architecture (6 micro-files)
- Wade: YAML + instructions architecture (monolithic)
- Quinn: Step-file architecture (6 micro-files)
- Stan: YAML + instructions architecture (monolithic)

**BMAD Builder Approach:**
- `/bmb-workflow` generates workflows
- **Unknown if it supports both step-file AND YAML+instructions patterns**
- Documentation doesn't specify workflow architecture options

**Risk:** BMAD Builder might only support one workflow pattern, forcing us to use the same architecture for all agents (less flexibility).

---

### Installation Flexibility

**Current Approach:**
- Individual agent packages allow **gradual adoption**
- Use Case: Try Emma → Add Wade later → Upgrade to full bundle
- Lower barrier to entry for new users

**BMAD Builder Approach:**
- Module installation is **all-or-nothing**
- User must install all 4 agents at once
- No gradual adoption path

**User Benefit Lost:** Natural upgrade funnel (individual → bundle) impossible with BMAD Builder.

---

## Analysis: Should We Use BMAD Builder?

### When BMAD Builder is Better

**Use BMAD Builder if:**
1. You want guided agent creation (less manual work)
2. You're creating a standard BMAD module (not custom npm distribution)
3. You don't need individual agent packages
4. You want to follow BMAD community conventions
5. You're building agents for internal use only (not public distribution)

**Example:** Creating custom agents for your own project, where all agents are always used together.

---

### When Manual Approach is Better (Our Case)

**Use Manual Approach if:**
1. ✅ **You need individual agent packages** (REQUIRED by user)
2. ✅ **You need flexible npm distribution** (individual + bulk)
3. ✅ **You need gradual adoption path** (try one agent first)
4. ✅ **You need full control over agent structure**
5. ✅ **You want to use both workflow architectures** (step-files AND YAML+instructions)
6. ✅ **You're building a public npm package** (not just a BMAD module)

**Our Use Case:** ✅ **All 6 criteria apply** - Manual approach is better.

---

## Hybrid Approach: Could We Use BMAD Builder Partially?

### Option: Use BMAD Builder for Initial Scaffolding

**Workflow:**
1. Use `/bmb-agent` to generate initial agent structure (Emma, Wade, Quinn, Stan)
2. Use `/bmb-workflow` to scaffold workflows
3. **Then modify** generated files to fit our npm distribution model
4. Package as individual npm packages manually

**Advantages:**
- ✅ Faster initial agent creation (guided workflows)
- ✅ Learn BMAD Builder conventions
- ✅ Still get individual npm packages

**Disadvantages:**
- ⚠️ Two-step process (generate → modify)
- ⚠️ May need to undo BMAD Builder's module structure
- ⚠️ Unclear if generated agents match our architecture vision

**Recommendation:** ⚠️ **Possible but adds complexity** - Only worth it if BMAD Builder saves significant time.

---

## Time Comparison

### Manual Approach (Current Plan)

**Week 1:**
- Day 1-2: Create Emma (agent + workflow) - 235 LOC
- Day 3-4: Create Wade (agent + workflow) - 280 LOC
- Day 5: Testing

**Week 2:**
- Day 6-7: Create Quinn (agent + workflow) - 295 LOC
- Day 8-9: Create Stan (agent + workflow) - 380 LOC
- Day 10: Testing

**Week 3:**
- Day 11-12: Cross-agent orchestration - 50 LOC
- Day 13: Party mode integration
- Day 14: Documentation
- Day 15: Buffer

**Total:** ~1,240 LOC agents + ~200 LOC npm scripts = ~1,440 LOC over 3 weeks

---

### BMAD Builder Approach (Hypothetical)

**Week 1:**
- Day 1: Use `/bmb-agent` to create Emma (guided)
- Day 2: Use `/bmb-agent` to create Wade (guided)
- Day 3: Use `/bmb-workflow` to create empathy-map workflow
- Day 4: Use `/bmb-workflow` to create wireframe workflow
- Day 5: Testing

**Week 2:**
- Day 6: Use `/bmb-agent` to create Quinn (guided)
- Day 7: Use `/bmb-agent` to create Stan (guided)
- Day 8: Use `/bmb-workflow` to create quality-gate workflow
- Day 9: Use `/bmb-workflow` to create audit-standards workflow
- Day 10: Testing

**Week 3:**
- Day 11: Use `/bmb-module` to package module
- Day 12: Modify for npm distribution (convert module → individual packages)
- Day 13: Write custom installation scripts
- Day 14: Testing npm packages
- Day 15: Documentation

**Total:** Unknown LOC (BMAD Builder generates) + ~200 LOC npm scripts (still needed) over 3 weeks

**Time Saved:** ⚠️ **Unclear** - Week 3 becomes "conversion work" instead of orchestration/testing.

**Risk:** If BMAD Builder's generated structure doesn't match our needs, Week 3 becomes **refactoring work** instead of new features.

---

## Recommendation

### ❌ Do NOT Use BMAD Builder for Convoke

**Primary Reason:** **BMAD Builder CANNOT provide individual agent npm packages.**

User requirement: "individually deployable (one npm command by agent)"

BMAD Builder provides: Module-based distribution (all-or-nothing)

**Conclusion:** BMAD Builder fundamentally conflicts with the user's distribution requirement.

---

### ✅ Stick with Manual Approach

**Reasons:**
1. ✅ **Meets user requirement** for individual agent packages
2. ✅ **Enables gradual adoption** (try Emma → upgrade to bundle)
3. ✅ **Provides npm flexibility** (individual + bulk packages)
4. ✅ **Full control** over agent structure and workflows
5. ✅ **Supports both workflow architectures** (step-files AND YAML+instructions)
6. ✅ **Clear implementation path** (we already have detailed guide)

**Trade-off:** More manual work, but **necessary** to meet requirements.

---

## Alternative: Use BMAD Builder for Future Agents

**Recommendation for Post-Phase 0:**

If we create **additional agents** in the future (Phase 1.5 - "Enhance Agent Capabilities"):
- Journey Mapper
- Persona Creator
- API Standards Auditor
- Performance Quality Gate

**Then consider:** Using BMAD Builder to **scaffold** those agents, then package them as individual npm packages.

**Benefit:** Learn BMAD Builder workflows while still maintaining npm distribution model.

---

## Summary

**Question:** Should we use BMAD Builder for Convoke?

**Answer:** ❌ **No** - BMAD Builder does not support individual agent npm packages, which is a core user requirement.

**What BMAD Builder Provides:**
- Guided agent creation workflows
- Module-based packaging
- Git-tag distribution
- Community-standard conventions

**What We Need:**
- Individual agent npm packages
- Flexible installation (individual + bulk)
- Gradual adoption path
- Custom npm distribution

**Conclusion:** Manual approach is **required** to meet user requirements.

**When to Use BMAD Builder:**
- Future agent scaffolding (generate → modify → package as npm)
- Internal-only agents (where individual packages not needed)
- Learning BMAD community conventions

---

## Sources

- [BMAD Builder GitHub Repository](https://github.com/bmad-code-org/bmad-builder)
- [BMAD Builder Installation Guide](https://deepwiki.com/bmad-code-org/bmad-builder/3.1-installation)
- [BMad Builder Module Overview](https://deepwiki.com/bmad-code-org/BMAD-METHOD/6-creative-intelligence-suite-(cis))
- [BMAD Method v6 What's New](https://deepwiki.com/bmad-code-org/BMAD-METHOD/1.4-what's-new-in-v6)

---

**End of Analysis - Recommendation: Continue with Manual Approach**
