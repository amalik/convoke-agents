---
title: "Emma Testing Guide: How to Test the Empathy Mapper Agent"
date: 2026-02-08
version: 1.0.0
status: TESTING READY
agent: Emma (empathy-mapper)
---

# Emma Testing Guide

**Goal:** Verify Emma (empathy-mapper) works correctly before creating Wade, Quinn, and Stan.

**Agent File:** [_bmad/bme/_designos/agents/empathy-mapper.md](_bmad/bme/_designos/agents/empathy-mapper.md)

---

## Prerequisites

### 1. Register Emma in Agent Manifest

**File:** `_bmad/_config/agent-manifest.csv`

**Add this line:**
```csv
"empathy-mapper","Emma","Empathy Mapping Specialist","🎨","User Empathy Expert + Design Thinking Specialist","Design thinking expert specializing in empathy maps and user research. Helps teams understand user needs, emotions, and pain points through structured empathy mapping exercises. Brings 10+ years experience in UX research and human-centered design.","Empathetic and curious - asks probing questions with genuine warmth. Focuses relentlessly on emotional understanding and user perspective. Like a therapist who helps teams truly see through users' eyes. Says things like 'Tell me more about THAT feeling' and 'What does the user NEED when they do this?'","- Channel expert design thinking methodologies: draw upon deep knowledge of empathy mapping, Jobs-to-be-Done framework, emotional journey mapping, and human-centered design principles - Design is about THEM not us - every decision must be grounded in real user insights - Emotions drive behavior - understand the WHY, not just the WHAT - Challenge assumptions ruthlessly, then validate through research - Pain points reveal opportunities - every frustration is a solution waiting to happen","bme","_bmad/bme/_designos/agents/empathy-mapper.md"
```

**How to add:**
1. Open `_bmad/_config/agent-manifest.csv`
2. Add the line above as row 23 (after workflow-builder)
3. Save the file

### 2. Create Config File (if not exists)

**File:** `_bmad/bme/_designos/config.yaml`

**Already created:** ✅ This file exists at [_bmad/bme/_designos/config.yaml](_bmad/bme/_designos/config.yaml)

**Verify it contains:**
```yaml
output_folder: "{project-root}/_bmad-output/design-artifacts"
user_name: "{user}"
communication_language: "en"
```

### 3. Create Output Directory

```bash
mkdir -p _bmad-output/design-artifacts
```

---

## Testing Methods

### Method 1: Direct Agent Invocation (Recommended)

**How to invoke Emma:**

1. **In Claude Code conversation, type:**
   ```
   /bmad-agent-bme-empathy-mapper
   ```

2. **What should happen:**
   - Emma loads her persona from the agent file
   - Emma reads config.yaml and stores user_name, communication_language, output_folder
   - Emma greets you by name (from config.yaml)
   - Emma displays her menu with numbered items:
     ```
     1. [MH] Redisplay Menu Help
     2. [CH] Chat with Emma about empathy mapping, user research, or design thinking
     3. [EM] Create Empathy Map: Guided 6-step process to create comprehensive user empathy map
     4. [VM] Validate Empathy Map: Review existing empathy map against research evidence
     5. [PM] Start Party Mode
     6. [DA] Dismiss Agent
     ```
   - Emma waits for your input

3. **What to test:**
   - Type `2` or `CH` → Should start chat mode
   - Type `3` or `EM` → Should load empathy-map workflow
   - Type `MH` → Should redisplay menu
   - Type fuzzy match like "empathy" → Should match [EM] Create Empathy Map

**Expected Behavior:**
- ✅ Emma loads without errors
- ✅ Config variables loaded ({user_name}, {communication_language}, {output_folder})
- ✅ Menu displays correctly
- ✅ Menu commands respond correctly
- ✅ Fuzzy matching works

### Method 2: Read Agent File Directly

**Alternative testing (if slash command doesn't work):**

1. **Manually read Emma's agent file:**
   ```
   Read the file: _bmad/bme/_designos/agents/empathy-mapper.md
   ```

2. **Follow the activation instructions:**
   - Load persona
   - Read config.yaml
   - Store variables
   - Display greeting + menu

3. **Test menu items manually:**
   - Ask Claude to execute menu item 3 (EM - Create Empathy Map)
   - Should load: `_bmad/bme/_designos/workflows/empathy-map/workflow.md`

---

## Test Scenarios

### Test 1: Agent Activation

**Goal:** Verify Emma loads correctly

**Steps:**
1. Invoke Emma: `/bmad-agent-bme-empathy-mapper`
2. Observe activation sequence

**Expected Results:**
- ✅ Step 1: Persona loaded
- ✅ Step 2: Config.yaml loaded, variables stored
- ✅ Step 3: User name remembered
- ✅ Step 4: Greeting displayed with user name
- ✅ Step 4: Menu displayed with all items numbered
- ✅ Step 5: Emma waits for input (doesn't auto-execute)

**Pass Criteria:**
- Emma greets you by name from config.yaml
- Menu displays 6 items
- Emma waits for user input

### Test 2: Chat Mode

**Goal:** Verify Emma's persona is active

**Steps:**
1. Invoke Emma
2. Select `2` or type `CH`
3. Ask: "What is an empathy map?"

**Expected Results:**
- ✅ Emma responds in character (empathetic, curious)
- ✅ Emma explains empathy maps with design thinking perspective
- ✅ Emma's communication style matches persona (asks probing questions)
- ✅ Emma references her principles (Design is about THEM not us)

**Pass Criteria:**
- Emma stays in character
- Responses reflect her expertise in empathy mapping
- Communication style is empathetic and curious

### Test 3: Create Empathy Map Workflow

**Goal:** Verify workflow execution works

**Steps:**
1. Invoke Emma
2. Select `3` or type `EM`
3. Follow the 6-step workflow

**Expected Results:**
- ✅ Step 1: Emma loads `workflow.md`
- ✅ Step 2: Emma loads `step-01-define-user.md`
- ✅ Emma guides you through defining target user
- ✅ After step 1 completion, Emma loads step-02-says-thinks.md
- ✅ Process continues through all 6 steps sequentially
- ✅ Final step creates empathy map artifact in `_bmad-output/design-artifacts/`

**Pass Criteria:**
- Workflow loads without errors
- Steps load sequentially (just-in-time)
- Emma enforces step completion before moving to next step
- Final artifact created in output_folder

### Test 4: Validate Empathy Map Workflow

**Goal:** Verify second workflow works

**Steps:**
1. Invoke Emma
2. Select `4` or type `VM`
3. Provide an existing empathy map or create a sample

**Expected Results:**
- ✅ Emma loads `validate.md`
- ✅ Emma asks for empathy map to validate
- ✅ Emma provides validation feedback (evidence gaps, specificity issues, etc.)
- ✅ Emma assigns validation score (Strong / Needs Work / Speculative)

**Pass Criteria:**
- Validation workflow loads
- Emma provides structured validation feedback
- Feedback follows validation criteria from validate.md

### Test 5: Fuzzy Matching

**Goal:** Verify menu fuzzy matching works

**Steps:**
1. Invoke Emma
2. Instead of menu number, type partial text:
   - `empathy` → Should match [EM] Create Empathy Map
   - `validate` → Should match [VM] Validate Empathy Map
   - `chat` → Should match [CH] Chat with Emma
   - `party` → Should match [PM] Start Party Mode

**Expected Results:**
- ✅ Fuzzy text matching works
- ✅ Ambiguous matches prompt for clarification
- ✅ No match shows "Not recognized"

**Pass Criteria:**
- Fuzzy matching behaves as specified in activation step 6

### Test 6: Party Mode Integration

**Goal:** Verify Emma integrates with party mode

**Steps:**
1. Invoke Emma
2. Select `5` or type `PM`
3. Observe party mode loading

**Expected Results:**
- ✅ Emma loads `_bmad/core/workflows/party-mode/workflow.md`
- ✅ Party mode shows Emma as available agent
- ✅ Emma can be selected in multi-agent discussions

**Pass Criteria:**
- Party mode loads without errors
- Emma appears in party mode agent list

### Test 7: Config Variable Resolution

**Goal:** Verify config.yaml variables work

**Steps:**
1. Edit `_bmad/bme/_designos/config.yaml`
2. Change `user_name` to your actual name
3. Change `communication_language` to "fr" (French) or another language
4. Invoke Emma

**Expected Results:**
- ✅ Emma greets you with your actual name
- ✅ Emma communicates in the specified language
- ✅ Emma uses output_folder from config for artifacts

**Pass Criteria:**
- Config variables correctly loaded and used
- User name appears in greeting
- Language setting respected

---

## Troubleshooting

### Issue: Emma doesn't load

**Possible Causes:**
1. Emma not registered in agent-manifest.csv
2. Slash command incorrect (must be `/bmad-agent-bme-empathy-mapper`)
3. Agent file path incorrect in manifest

**Fix:**
- Verify agent-manifest.csv entry (row 23)
- Check path: `_bmad/bme/_designos/agents/empathy-mapper.md`
- Try reading agent file directly

### Issue: Config not loading

**Error:** "Config not loaded, STOP"

**Possible Causes:**
1. config.yaml doesn't exist
2. config.yaml path incorrect
3. config.yaml missing required fields

**Fix:**
- Verify file exists: `_bmad/bme/_designos/config.yaml`
- Check path matches activation step 2
- Ensure user_name, communication_language, output_folder present

### Issue: Workflow doesn't load

**Error:** Workflow file not found

**Possible Causes:**
1. Workflow path incorrect in menu item
2. Workflow file doesn't exist
3. exec/workflow handler not working

**Fix:**
- Verify workflow files exist:
  - `_bmad/bme/_designos/workflows/empathy-map/workflow.md`
  - `_bmad/bme/_designos/workflows/empathy-map/validate.md`
- Check menu item paths use `{project-root}` variable
- Ensure exec handler in activation section is correct

### Issue: Menu doesn't display

**Possible Causes:**
1. XML structure malformed
2. Menu items missing required attributes
3. Activation steps out of order

**Fix:**
- Validate XML syntax in agent file
- Check all menu items have `cmd` and description
- Verify activation steps 1-7 in correct order

---

## Success Criteria Checklist

**Emma is ready for production if:**

- [ ] Emma loads without errors via slash command
- [ ] Config.yaml variables loaded correctly
- [ ] Menu displays with 6 items
- [ ] Chat mode (CH) works - Emma stays in character
- [ ] Create Empathy Map (EM) workflow loads and executes
- [ ] Validate Empathy Map (VM) workflow loads and executes
- [ ] Fuzzy matching works for menu commands
- [ ] Party mode integration works
- [ ] Emma uses correct communication language from config
- [ ] Emma addresses user by name from config
- [ ] Artifacts created in correct output_folder
- [ ] Emma enforces sequential step completion
- [ ] Emma's persona is consistent across all interactions

**If all checkboxes pass:** ✅ Emma is production-ready, proceed to create Wade

**If any fail:** ⚠️ Debug and fix before proceeding

---

## Next Steps After Successful Testing

**Once Emma passes all tests:**

1. **Document findings** - Note any issues encountered and how they were fixed
2. **Update framework** - Add any learnings to Generic Agent Integration Framework
3. **Create Wade** - Use Emma as template for Wade (wireframe-designer)
4. **Repeat testing** - Apply same test scenarios to Wade
5. **Create Quinn and Stan** - Continue pattern

---

## Quick Test Script

**For rapid testing, run through this sequence:**

```
1. /bmad-agent-bme-empathy-mapper
2. Type: CH
3. Ask: "What is an empathy map?"
4. Observe: Emma responds in character
5. Type: MH
6. Observe: Menu redisplays
7. Type: EM
8. Observe: Workflow loads (step-01-define-user.md)
9. Type: DA
10. Observe: Agent dismissed
```

**Expected time:** ~5 minutes

**Pass if:** All 10 steps complete without errors

---

**End of Emma Testing Guide**

**Status:** Ready to test Emma
**Next:** Register Emma in agent-manifest.csv, then test
