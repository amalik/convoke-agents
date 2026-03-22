---
title: "CRITICAL: Framework Correction - Actual BMAD Agent Architecture"
date: 2026-02-08
version: 1.1.0
status: CORRECTED
priority: CRITICAL
---

# CRITICAL CORRECTION: Actual BMAD Agent Architecture

**Discovery:** Native BMAD Method agents use **XML-based structure inside markdown code blocks**, NOT plain markdown frontmatter!

**Impact:** Generic Agent Integration Framework (v1.0.0) documented **incorrect** agent structure. Emma v1 implemented incorrect structure.

**Status:** ✅ **CORRECTED** - Emma v2 now uses correct BMAD architecture

---

## What Was Wrong

### Incorrect Structure (v1.0.0)

I documented agents as plain markdown with YAML frontmatter:

```markdown
---
name: empathy-mapper
displayName: Emma
title: Empathy Mapping Specialist
icon: 🎨
role: User Empathy Expert
identity: Design thinking expert...
communicationStyle: Empathetic...
principles: Design is about THEM...
module: bme
---

# Emma - Empathy Mapping Specialist

[Plain markdown content]

<menu>
  <item cmd="MH">[MH] Redisplay Menu</item>
</menu>
```

**Problem:** This is NOT how native BMAD agents work!

---

## Actual BMAD Agent Architecture

### Correct Structure (v1.1.0 - CORRECTED)

Native BMAD agents use **XML inside markdown code blocks**:

```markdown
---
name: "empathy-mapper"
description: "Empathy Mapping Specialist"
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

(backtick)``xml
<agent id="empathy-mapper.agent.yaml" name="Emma" title="Empathy Mapping Specialist" icon="🎨">
<activation critical="MANDATORY">
      <step n="1">Load persona from this current agent file (already in context)</step>
      <step n="2">🚨 IMMEDIATE ACTION REQUIRED - BEFORE ANY OUTPUT:
          - Load and read {project-root}/_bmad/bme/_designos/config.yaml NOW
          - Store ALL fields as session variables: {user_name}, {communication_language}, {output_folder}
          - VERIFY: If config not loaded, STOP and report error to user
          - DO NOT PROCEED to step 3 until config is successfully loaded and variables stored
      </step>
      <step n="3">Remember: user's name is {user_name}</step>
      <step n="4">Show greeting using {user_name} from config, communicate in {communication_language}, then display numbered list of ALL menu items from menu section</step>
      <step n="{HELP_STEP}">Let {user_name} know they can type command `/bmad-help` at any time...</step>
      <step n="5">STOP and WAIT for user input - do NOT execute menu items automatically...</step>
      <step n="6">On user input: Number → process menu item[n] | Text → case-insensitive substring match...</step>
      <step n="7">When processing a menu item: Check menu-handlers section below...</step>

      <menu-handlers>
              <handlers>
          <handler type="exec">
        When menu item or handler has: exec="path/to/file.md":
        1. Read fully and follow the file at that path
        2. Process the complete file and follow all instructions within it
        3. If there is data="some/path/data-foo.md" with the same item, pass that data path to the executed file as context.
      </handler>
      <handler type="data">
        When menu item has: data="path/to/file.json|yaml|yml|csv|xml"
        Load the file first, parse according to extension
        Make available as {data} variable to subsequent handler operations
      </handler>

      <handler type="workflow">
        When menu item has: workflow="path/to/workflow.yaml":

        1. CRITICAL: Always LOAD {project-root}/_bmad/core/tasks/workflow.xml
        2. Read the complete file - this is the CORE OS for processing BMAD workflows
        3. Pass the yaml path as 'workflow-config' parameter to those instructions
        4. Follow workflow.xml instructions precisely following all steps
        5. Save outputs after completing EACH workflow step (never batch multiple steps together)
        6. If workflow.yaml path is "todo", inform user the workflow hasn't been implemented yet
      </handler>
        </handlers>
      </menu-handlers>

    <rules>
      <r>ALWAYS communicate in {communication_language} UNLESS contradicted by communication_style.</r>
      <r>Stay in character until exit selected</r>
      <r>Display Menu items as the item dictates and in the order given.</r>
      <r>Load files ONLY when executing a user chosen workflow or a command requires it, EXCEPTION: agent activation step 2 config.yaml</r>
      <r>Design is about THEM not us - ground every insight in user research evidence</r>
    </rules>
</activation>
  <persona>
    <role>User Empathy Expert + Design Thinking Specialist</role>
    <identity>Design thinking expert specializing in empathy maps and user research. Helps teams understand user needs, emotions, and pain points through structured empathy mapping exercises. Brings 10+ years experience in UX research and human-centered design.</identity>
    <communication_style>Empathetic and curious - asks probing questions with genuine warmth. Focuses relentlessly on emotional understanding and user perspective. Like a therapist who helps teams truly see through users' eyes. Says things like "Tell me more about THAT feeling" and "What does the user NEED when they do this?"</communication_style>
    <principles>- Channel expert design thinking methodologies: draw upon deep knowledge of empathy mapping, Jobs-to-be-Done framework, emotional journey mapping, and human-centered design principles - Design is about THEM not us - every decision must be grounded in real user insights - Emotions drive behavior - understand the WHY, not just the WHAT - Challenge assumptions ruthlessly, then validate through research - Pain points reveal opportunities - every frustration is a solution waiting to happen</principles>
  </persona>
  <menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="CH or fuzzy match on chat">[CH] Chat with Emma about empathy mapping, user research, or design thinking</item>
    <item cmd="EM or fuzzy match on empathy-map" exec="{project-root}/_bmad/bme/_designos/workflows/empathy-map/workflow.md">[EM] Create Empathy Map: Guided 6-step process to create comprehensive user empathy map</item>
    <item cmd="VM or fuzzy match on validate" exec="{project-root}/_bmad/bme/_designos/workflows/empathy-map/validate.md">[VM] Validate Empathy Map: Review existing empathy map against research evidence</item>
    <item cmd="PM or fuzzy match on party-mode" exec="{project-root}/_bmad/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
</agent>
(backtick)``
```

---

## Key Differences

### Frontmatter

**Wrong (v1.0.0):**
```yaml
---
name: empathy-mapper
displayName: Emma
title: Empathy Mapping Specialist
icon: 🎨
role: User Empathy Expert
identity: ...
communicationStyle: ...
principles: ...
module: bme
---
```

**Correct (v1.1.0):**
```yaml
---
name: "empathy-mapper"
description: "Empathy Mapping Specialist"
---
```

**Difference:** BMAD frontmatter is minimal (name + description). All other fields go in XML `<agent>` tag and `<persona>` section.

### Agent Definition

**Wrong:** Plain markdown with XML menu at end

**Correct:** Entire agent is XML inside markdown code block

### Critical Components in XML

1. **`<agent>` wrapper** - Contains id, name, title, icon attributes
2. **`<activation>`** - Sequential steps for agent initialization
3. **`<menu-handlers>`** - Defines how to process exec, workflow, data handlers
4. **`<rules>`** - Behavior rules for the agent
5. **`<persona>`** - Role, identity, communication_style, principles
6. **`<menu>`** - Menu items with fuzzy matching support

### Activation Sequence

**Critical:** Step 2 MUST load config.yaml before any output:

```xml
<step n="2">🚨 IMMEDIATE ACTION REQUIRED - BEFORE ANY OUTPUT:
    - Load and read {project-root}/_bmad/bme/_designos/config.yaml NOW
    - Store ALL fields as session variables: {user_name}, {communication_language}, {output_folder}
    - VERIFY: If config not loaded, STOP and report error to user
    - DO NOT PROCEED to step 3 until config is successfully loaded and variables stored
</step>
```

**Why:** All BMAD agents need user_name, communication_language, output_folder from config

### Menu Handlers

**Critical:** Agents must define how to handle different menu item types:

- **`exec`** - Load and follow markdown file
- **`workflow`** - Load BMAD core workflow processor
- **`data`** - Load data file for context

**Example:**
```xml
<item cmd="EM" exec="{project-root}/_bmad/bme/_designos/workflows/empathy-map/workflow.md">[EM] Create Empathy Map</item>
```

When user selects EM, agent reads exec handler, loads workflow.md, follows it.

---

## What Got Corrected

### Emma Agent File

**Status:** ✅ **CORRECTED**

**File:** [_bmad/bme/_designos/agents/empathy-mapper.md](_bmad/bme/_designos/agents/empathy-mapper.md)

**Changes:**
- Removed extended YAML frontmatter (kept name + description only)
- Added "You must fully embody..." instruction
- Wrapped entire agent in XML code block
- Added `<activation>` with 7 sequential steps
- Added `<menu-handlers>` with exec, data, workflow handlers
- Added `<rules>` section
- Moved persona to `<persona>` XML section (role, identity, communication_style, principles)
- Updated menu items with fuzzy matching

**New LOC:** ~78 LOC (reduced from 100 LOC - XML is more compact)

### Generic Agent Integration Framework

**Status:** ⚠️ **NEEDS UPDATE** (v1.0.0 → v1.1.0)

**File:** [GENERIC-AGENT-INTEGRATION-FRAMEWORK.md](GENERIC-AGENT-INTEGRATION-FRAMEWORK.md)

**Required Changes:**
- Part 1: Update "Standard BMAD Agent Interface" to show XML structure
- Update examples to match corrected Emma
- Document activation sequence importance
- Document menu handlers requirement
- Add reference to native BMAD agents (analyst.md, pm.md as examples)

**Action:** Update framework document in next iteration

---

## Impact on Future Agents

### Wade, Quinn, Stan

**All future agents MUST use XML structure:**

```markdown
---
name: "{agent-name}"
description: "{Description}"
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

(backtick)``xml
<agent id="{agent-name}.agent.yaml" name="{DisplayName}" title="{Title}" icon="{emoji}">
<activation critical="MANDATORY">
    <!-- 7-step activation sequence -->
    <!-- menu-handlers -->
    <!-- rules -->
</activation>
  <persona>
    <!-- role, identity, communication_style, principles -->
  </persona>
  <menu>
    <!-- menu items with fuzzy matching -->
  </menu>
</agent>
(backtick)``
```

### Integration Checklist Update

**Step 4: Create Agent File** now requires:
- [x] Simple frontmatter (name + description)
- [x] Embodiment instruction
- [x] XML code block with `<agent>` wrapper
- [x] `<activation>` with 7 steps + menu-handlers + rules
- [x] `<persona>` with role, identity, communication_style, principles
- [x] `<menu>` with fuzzy matching support

---

## References to Native BMAD Agents

**Examples of correct BMAD agent architecture:**

1. **Analyst (Mary)** - [_bmad/bmm/agents/analyst.md](_bmad/bmm/agents/analyst.md)
   - XML structure with activation sequence
   - Menu handlers (exec, workflow)
   - Research workflows

2. **Product Manager (John)** - [_bmad/bmm/agents/pm.md](_bmad/bmm/agents/pm.md)
   - PRD creation workflows
   - Validation workflows
   - Course correction

**Both use identical structure:**
- Simple frontmatter
- XML code block
- Activation sequence
- Menu handlers
- Persona in XML
- Menu with fuzzy matching

---

## Why This Matters

### Domain Specialization Still Achieved

**Good news:** Even with corrected architecture, domain specialization is preserved.

**Proof:**
- Emma still provides empathy mapping expertise
- XML structure is just BMAD's execution environment
- Workflows (step-files) remain flexible for different domains
- Agent persona/principles capture domain-specific knowledge

**Conclusion:** BMAD agent architecture supports any domain - we just needed to use the correct BMAD agent wrapper.

### What Changed vs. What Stayed Same

**Changed (Agent File Structure):**
- Frontmatter → Minimal (name + description)
- Agent definition → XML code block
- Activation → Explicit sequential steps
- Menu → Fuzzy matching support

**Stayed Same (Workflows):**
- Step-file architecture still valid
- YAML + instructions still valid
- Custom hybrid still possible
- Adapter patterns still correct

**Impact:** Workflow part of framework is correct. Agent wrapper needed correction.

---

## Summary

**Discovery:** Native BMAD agents use XML structure, not plain markdown frontmatter

**Correction:** Emma updated to match actual BMAD architecture

**Status:**
- ✅ Emma v2 - Corrected (uses XML structure)
- ⚠️ Generic Framework v1.0.0 - Needs update (Part 1 incorrect)
- ✅ Workflow patterns - Correct (no changes needed)

**Next Steps:**
1. Update Generic Agent Integration Framework (v1.0.0 → v1.1.0)
2. Create Wade, Quinn, Stan using corrected XML structure
3. Proceed with Phase 0 Week 1 testing

**Key Lesson:** Always examine native BMAD agents FIRST before creating new ones!

---

**End of Critical Correction**

**Corrected Agent:** [_bmad/bme/_designos/agents/empathy-mapper.md](_bmad/bme/_designos/agents/empathy-mapper.md)
