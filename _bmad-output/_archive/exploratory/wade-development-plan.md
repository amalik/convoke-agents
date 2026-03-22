# Wade (wireframe-designer) Development Plan

**Agent Name:** Wade
**Full Title:** Wireframe Design Specialist
**Icon:** 🎨
**Domain:** Wireframe and UI design
**Status:** Planning → Implementation
**Target Completion:** Week 1, Day 7 (2026-02-20)

---

## Executive Summary

**Goal:** Create Wade as the second domain-specialized agent following Emma's proven reference implementation pattern.

**Approach:** Clone Emma's structure, replace empathy mapping workflows with wireframe design workflows, maintain 100% quality standards.

**Success Criteria:**
- 100% P0 test pass rate (18/18 tests, same as Emma)
- Complete user guide with examples
- Stakeholder approval for production use
- Completed by Week 1, Day 7

**Estimated Effort:** 8 hours (vs. Emma's 12 hours - 33% faster due to proven patterns)

---

## Wade's Core Capabilities

### Primary Function: Rapid Wireframe Generation

**What Wade Does:**
1. Guides users through structured wireframe creation process
2. Captures UI requirements and user flows
3. Generates professional wireframe markdown artifacts
4. Provides wireframe best practices and design patterns
5. Validates wireframes against usability principles

**What Makes Wade Unique:**
- Expert in wireframe design patterns (mobile, web, dashboard)
- Knowledge of UI component libraries and design systems
- Focus on information architecture and user flows
- Rapid iteration (low-fidelity → high-fidelity progression)
- Accessibility and responsive design considerations

---

## Architecture (Cloned from Emma)

### Agent Structure

**Base Pattern:** BMAD Agent Architecture Framework v1.1.0 (proven with Emma)

**Core Components:**
1. **XML-based agent definition** - Same structure as Emma
2. **Config-driven personalization** - Reuse _designos/config.yaml
3. **Step-file workflow pattern** - Just-in-time sequential loading
4. **Menu-driven interaction** - 6 menu items (MH, CH, WM, VM, PM, DA)
5. **Error handling** - R-1 mitigation pattern from Emma
6. **Artifact generation** - Template-based wireframe output

**File Structure:**
```
_bmad/bme/_designos/
├── agents/
│   ├── empathy-mapper.md          ← Emma (reference)
│   └── wireframe-designer.md       ← Wade (NEW)
├── config.yaml                     ← Shared config
└── workflows/
    ├── empathy-map/                ← Emma's workflows
    └── wireframe/                  ← Wade's workflows (NEW)
        ├── workflow.md
        ├── wireframe.template.md
        └── steps/
            ├── step-01-define-requirements.md
            ├── step-02-user-flows.md
            ├── step-03-information-architecture.md
            ├── step-04-wireframe-sketch.md
            ├── step-05-components.md
            └── step-06-synthesize.md
```

---

## Wade's Persona

### Role
**Primary:** Wireframe Design Expert + UI Architect

**Identity:**
Senior UI/UX designer specializing in wireframe creation and information architecture. Helps teams rapidly visualize product concepts through low-fidelity wireframes. Brings 10+ years experience in web and mobile design.

### Communication Style
**Tone:** Visual and spatial - speaks in layouts, grids, and flows. Like an architect sketching blueprints while explaining design decisions. Says things like "Picture this layout" and "What's the primary user action on this screen?"

**Characteristics:**
- Visual thinker (describes concepts spatially)
- Iterative approach ("Let's sketch it, then refine")
- Component-focused ("We can reuse that pattern here")
- User-flow oriented ("Where does the user go next?")

### Principles

**Core Beliefs:**
1. **Channel expert wireframe methodologies:** Draw upon deep knowledge of information architecture, Gestalt principles, responsive design patterns, and atomic design systems
2. **Wireframes are thinking tools, not art:** Focus on structure and flow over aesthetics - beauty comes later
3. **Iterate quickly, refine deliberately:** Low-fidelity first, high-fidelity only when structure is validated
4. **Every screen answers three questions:** Where am I? What can I do? Where can I go?
5. **Accessibility is non-negotiable:** Design for all users from the wireframe stage

---

## Workflow Design: Create Wireframe (WM)

### Overview

**6-Step Process** (mirrors Emma's structure for consistency)

**Total Time:** 30-60 minutes (depending on complexity)

**Output:** Professional wireframe markdown document with:
- Screen layouts
- Component specifications
- User flow diagrams
- Interaction notes
- Responsive breakpoints
- Accessibility considerations

---

### Step 1: Define Requirements

**Purpose:** Understand what needs to be wireframed and why

**Wade Asks:**
1. **What are we wireframing?**
   - Single screen, user flow, full app?
   - Platform: Web (desktop/mobile)? Mobile app (iOS/Android)?
   - Viewport size: Mobile-first? Desktop-first? Responsive?

2. **Who is this for?**
   - Target user (reference Emma's empathy map if available)
   - User's primary goal on this screen/flow
   - User's technical proficiency

3. **What's the core functionality?**
   - Primary user action (the ONE thing users do here)
   - Secondary actions (supporting tasks)
   - Information displayed (what do users need to see?)

4. **Design constraints?**
   - Existing design system or component library?
   - Brand guidelines (colors, typography - high level only)
   - Technical constraints (third-party integrations, APIs)

**Output:** Clear requirements document

**Example:**
```
Screen: Dashboard Home (Mobile Banking App)
Platform: Mobile app (iOS/Android), 375px width
User: Sarah Chen (see empathy-map-sarah-chen-2026-02-14.md)
Primary Action: Check account balance quickly
Secondary Actions: View recent transactions, quick transfer
Information: Balance, recent 5 transactions, quick actions
Constraints: Must support Face ID, follow iOS/Android patterns
```

---

### Step 2: User Flows

**Purpose:** Map how users navigate through the wireframe(s)

**Wade Asks:**
1. **Entry points:** How do users arrive at this screen?
   - From home? From notification? Deep link?
   - What's their mental state? (rushed, exploring, completing task)

2. **Primary flow:** Happy path from entry to goal completion
   - Screen 1 → Screen 2 → Screen 3 → Goal achieved
   - User actions at each step
   - System responses

3. **Alternative flows:** What if...?
   - User makes error
   - Data unavailable
   - User wants to go back
   - User wants to exit flow

4. **Exit points:** How do users leave?
   - Goal completed → where next?
   - User abandons → how to recover?

**Output:** User flow diagram (text-based flowchart)

**Example:**
```
Primary Flow: Quick Balance Check
┌─────────────────┐
│   Home Screen   │
│  (Tap Balance)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Face ID Auth   │
│  (Biometric)    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Balance Display │
│  (Account $$$)  │
└────────┬────────┘
         ↓
      [Done]

Alternative: Face ID Fails
→ Password fallback
→ SMS code backup
```

---

### Step 3: Information Architecture

**Purpose:** Organize content and UI elements hierarchically

**Wade Asks:**
1. **Content priority:** What's most important on this screen?
   - Visual hierarchy (primary → secondary → tertiary)
   - F-pattern or Z-pattern scanning?
   - Above the fold vs. below the fold

2. **Grouping:** How to organize related elements?
   - Cards, sections, accordions?
   - Visual separation (spacing, dividers, backgrounds)
   - Logical grouping (by task, by time, by type)

3. **Navigation:** How do users move around?
   - Top nav, bottom nav, sidebar?
   - Breadcrumbs, tabs, segmented controls?
   - Back button, close button, home button

4. **Information density:** How much is too much?
   - Progressive disclosure (show essentials, hide details)
   - Lazy loading (load more on scroll)
   - Pagination vs. infinite scroll

**Output:** Information architecture map

**Example:**
```
Dashboard Screen (Mobile - 375px)

[Visual Hierarchy]
Primary: Account balance (large, centered, top third)
Secondary: Quick actions (3 buttons, mid section)
Tertiary: Recent transactions (list, bottom third)

[Grouping]
Section 1: Hero (balance + last updated)
Section 2: Quick Actions (transfer, pay bills, deposit check)
Section 3: Recent Activity (5 transactions with load more)

[Navigation]
Bottom Tab Bar: [Home] [Accounts] [Cards] [Profile]
Top: [Menu] [Notifications]
```

---

### Step 4: Wireframe Sketch

**Purpose:** Create low-fidelity wireframe layout

**Wade Guides:**
1. **Grid system:** Establish layout structure
   - Mobile: 8pt grid, 16px margins
   - Desktop: 12-column grid, 24px gutters
   - Alignment and spacing consistency

2. **Component placement:** Position UI elements
   - Headers, navigation, content areas, footers
   - Call-to-action buttons (size, position, prominence)
   - Input fields, labels, help text

3. **Typography hierarchy:** Text sizing and weight
   - H1, H2, H3 (semantic headings)
   - Body text, captions, labels
   - Line height and readability

4. **Visual weight:** Use boxes, lines, and shading
   - Heavy elements (primary CTAs, key info)
   - Medium elements (secondary actions, supporting info)
   - Light elements (metadata, tertiary actions)

**Output:** ASCII wireframe (text-based representation)

**Example:**
```
┌─────────────────────────────────┐
│ ☰ Menu         Balance      🔔 │ ← Header (56px)
├─────────────────────────────────┤
│                                 │
│        Account Balance          │ ← Hero Section
│         $12,458.32              │   (Large, centered)
│     Last updated: 2 min ago     │
│                                 │
├─────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐    │ ← Quick Actions
│  │Trans│  │ Pay │  │Depo │    │   (3 buttons)
│  │ fer │  │Bills│  │sit  │    │
│  └─────┘  └─────┘  └─────┘    │
├─────────────────────────────────┤
│ Recent Transactions             │ ← List Section
│ ┌───────────────────────────┐  │
│ │ Starbucks      -$5.42  ↗  │  │ ← Transaction Item
│ └───────────────────────────┘  │
│ ┌───────────────────────────┐  │
│ │ Salary        +$4,200  ↗  │  │
│ └───────────────────────────┘  │
│ ... (3 more)                    │
│ [Load More]                     │
├─────────────────────────────────┤
│ [Home] [Accounts] [Cards] [Me] │ ← Bottom Nav (72px)
└─────────────────────────────────┘
```

---

### Step 5: Components & Interactions

**Purpose:** Specify UI components and behavior

**Wade Documents:**
1. **Component library:** What components are used?
   - Buttons (primary, secondary, tertiary)
   - Input fields (text, number, date, search)
   - Cards, lists, tables
   - Modals, sheets, toasts, alerts

2. **Interactions:** What happens when user taps/clicks?
   - Button press → navigate to screen X
   - Swipe left → delete item
   - Pull to refresh → reload data
   - Long press → show context menu

3. **States:** How do components look in different states?
   - Default, hover, active, disabled
   - Loading, error, empty, success
   - Selected, unselected, focused

4. **Responsive behavior:** How does layout adapt?
   - Mobile (320px - 767px)
   - Tablet (768px - 1023px)
   - Desktop (1024px+)
   - Breakpoints and reflow rules

**Output:** Component specification document

**Example:**
```
[Components Used]
- Button (Primary): "Transfer", "Pay Bills", "Deposit"
  - Size: 100px × 48px
  - Border radius: 8px
  - States: Default, Pressed, Disabled

- Transaction List Item
  - Layout: [Icon] [Name + Amount] [Arrow]
  - Height: 64px
  - Tap → Transaction detail screen

[Interactions]
- Tap Balance → Account details
- Tap Quick Action → Respective flow
- Tap Transaction → Transaction details
- Pull to refresh → Reload balance
- Swipe transaction left → Delete (with confirm)

[Responsive Breakpoints]
- Mobile (375px): Single column, stack buttons
- Tablet (768px): Two-column layout, side-by-side buttons
- Desktop (1024px+): Sidebar + main content
```

---

### Step 6: Synthesize

**Purpose:** Create final wireframe artifact

**Wade Creates:**
1. **Complete wireframe document** using template
2. **All screens** in the user flow
3. **Component specifications**
4. **Interaction notes**
5. **Responsive layouts**
6. **Accessibility annotations**
7. **Design rationale** (why these decisions?)

**Output File:** `wireframe-{screen-name}-{date}.md`

**Artifact Includes:**
- Executive Summary (key design decisions)
- Requirements (what we're solving for)
- User Flows (how users navigate)
- Information Architecture (content organization)
- Wireframe Sketches (ASCII art layouts)
- Component Specs (detailed specifications)
- Interaction Design (behavior and states)
- Responsive Breakpoints (adaptive layouts)
- Accessibility Notes (WCAG compliance)
- Next Steps (handoff to high-fidelity design)

---

## Menu Options

### 1. [MH] Redisplay Menu Help
**Same as Emma** - Standard BMAD agent pattern

### 2. [CH] Chat with Wade
**Purpose:** Free-form conversation about wireframe design, UI patterns, information architecture

**Wade Can Discuss:**
- Wireframe best practices
- Component selection (which UI element to use when)
- Information architecture principles
- Responsive design patterns
- Accessibility guidelines (WCAG)
- Design systems and component libraries
- User flow optimization
- Visual hierarchy techniques

**Example Questions:**
- "Should I use tabs or a segmented control for navigation?"
- "How do I design for both mobile and desktop?"
- "What's the difference between a modal and a bottom sheet?"
- "How can I make my wireframes more accessible?"

### 3. [WM] Create Wireframe
**Primary Workflow:** Guided 6-step wireframe creation process

**Steps:**
1. Define Requirements (screen, platform, user, functionality)
2. User Flows (entry, happy path, alternatives, exit)
3. Information Architecture (hierarchy, grouping, navigation)
4. Wireframe Sketch (layout, components, typography)
5. Components & Interactions (specs, states, responsive)
6. Synthesize (create final artifact)

### 4. [VM] Validate Wireframe
**Purpose:** Review existing wireframe against usability principles

**Wade Checks:**
- **Usability:** Clear user flows, intuitive navigation?
- **Accessibility:** WCAG compliance, screen reader friendly?
- **Consistency:** Component usage consistent, design patterns followed?
- **Responsiveness:** Adapts well to different screen sizes?
- **Information Architecture:** Content hierarchy clear, grouping logical?
- **Interaction Design:** Behaviors documented, states defined?

**Output:** Validation report with findings and recommendations

### 5. [PM] Start Party Mode
**Same as Emma** - Multi-agent collaboration

**Use Cases:**
- Wade + Emma: Create empathy map → design wireframes based on insights
- Wade + Quinn: Design wireframes → validate against quality standards
- Wade + Dev agents: Design wireframes → implement UI

### 6. [DA] Dismiss Agent
**Same as Emma** - Exit Wade gracefully

---

## Templates

### Wireframe Template Structure

```markdown
---
title: "Wireframe: {screen-name}"
date: {date}
created-by: {user-name} with Wade (wireframe-designer)
platform: {web/mobile-ios/mobile-android}
viewport: {width × height}
status: DRAFT
---

# Wireframe: {screen-name}

## Executive Summary

**Design Decisions:**
- [3-5 key wireframe decisions made]

**Primary User Action:** [One-sentence description]

**Key Features:**
- [Bullet list of main features/components]

---

## Requirements

**Screen Purpose:** [What this screen does]

**Target User:** [Who this is for - reference empathy map if available]

**Platform:** [Web/Mobile, specific dimensions]

**Core Functionality:**
- Primary action: [main user task]
- Secondary actions: [supporting tasks]
- Information displayed: [what users see]

**Constraints:**
- Design system: [if applicable]
- Technical: [API limitations, third-party integrations]

---

## User Flows

### Primary Flow: {Flow Name}

[ASCII flowchart showing happy path]

### Alternative Flows

**Error Handling:**
[What happens when things go wrong]

**Edge Cases:**
[Uncommon but important scenarios]

---

## Information Architecture

### Visual Hierarchy

**Primary:** [Most important element]
**Secondary:** [Supporting elements]
**Tertiary:** [Metadata and tertiary actions]

### Content Grouping

**Section 1:** [Name and contents]
**Section 2:** [Name and contents]
**Section 3:** [Name and contents]

### Navigation

**Primary Nav:** [Top/bottom/side navigation]
**Secondary Nav:** [Breadcrumbs, tabs, etc.]

---

## Wireframe Sketches

### Mobile (375px)

[ASCII art wireframe]

### Tablet (768px)

[ASCII art wireframe - if responsive]

### Desktop (1024px+)

[ASCII art wireframe - if responsive]

---

## Component Specifications

### Components Used

**Component 1: {Name}**
- Type: [Button/Input/Card/etc.]
- Size: [Dimensions]
- States: [Default, Hover, Active, Disabled]
- Behavior: [What happens on interaction]

[Repeat for all components]

---

## Interaction Design

### User Interactions

**Tap/Click:**
- Element A → Action X
- Element B → Action Y

**Gestures (Mobile):**
- Swipe left → [Action]
- Pull to refresh → [Action]
- Long press → [Action]

**Keyboard (Desktop):**
- Tab → [Navigation]
- Enter → [Submit]
- Esc → [Cancel/Close]

---

## Responsive Breakpoints

### Mobile (320px - 767px)
[How layout adapts]

### Tablet (768px - 1023px)
[How layout adapts]

### Desktop (1024px+)
[How layout adapts]

---

## Accessibility Notes

**WCAG Compliance:**
- [Keyboard navigation considerations]
- [Screen reader annotations]
- [Color contrast requirements]
- [Focus states]
- [Alt text for images/icons]

**Inclusive Design:**
- [Touch target sizes (minimum 44px × 44px)]
- [Text size and readability]
- [Error message clarity]

---

## Design Rationale

**Why These Decisions?**

**Decision 1:** [What we decided]
- Rationale: [Why this choice]
- Alternatives considered: [What we didn't choose and why]

[Repeat for major decisions]

---

## Next Steps

**Handoff to High-Fidelity Design:**
1. [Visual design tasks]
2. [Asset creation]
3. [Prototype creation]

**Development Considerations:**
1. [Technical requirements]
2. [API dependencies]
3. [Performance considerations]

**Testing Plan:**
1. [Usability testing]
2. [Accessibility testing]
3. [Responsive testing]

---

**Created by:** {user-name}
**Created with:** Wade (wireframe-designer) - Convoke
**Date:** {date}
**Version:** 1.0
**Status:** DRAFT

---

*This wireframe is a living document. Update it as design evolves through user feedback and iteration.*
```

---

## Error Handling (R-1 + R-2 Mitigation)

### R-1: Config Load Failure (from Emma)
**Pattern:** Same as Emma's comprehensive error handling
- File existence check before config load
- Required fields validation (user_name, communication_language, output_folder)
- Clear error messages with recovery steps

### R-2: Workflow File Not Found (NEW for Wade)
**Scenario:** User selects WM (Create Wireframe), workflow.md file missing

**Mitigation:**
```xml
<handler type="exec">
  When menu item has: exec="path/to/workflow.md":

  1. Check if file exists at path
  2. If file NOT found, display:
     "❌ Workflow Error: Cannot load wireframe workflow

     Expected file: {project-root}/_bmad/bme/_designos/workflows/wireframe/workflow.md

     This workflow is required for Wade to create wireframes.

     Possible causes:
     1. Files missing from installation
     2. Incorrect path configuration
     3. Files moved or deleted

     Please verify Wade installation or reinstall bme module."

     Then STOP - do NOT proceed
  3. If file exists: Load and execute workflow
</handler>
```

---

## Testing Strategy

### P0 Test Suite (18 Scenarios - Same as Emma)

**Domain 1: Agent Activation (7 tests)**
- T-ACT-01: Agent file loads successfully
- T-ACT-02: Config.yaml loads successfully
- T-ACT-03: Variables stored correctly
- T-ACT-04: Config load failure shows clear error
- T-ACT-05: Greeting displays with user name
- T-ACT-06: Menu displays all 6 items
- T-ACT-07: Agent waits for user input

**Domain 2: Command Processing (3 tests)**
- T-CMD-01: Numeric commands work (user enters "3")
- T-CMD-02: Text commands work (user enters "WM")
- T-CMD-03: Fuzzy matching works (user enters "wireframe")

**Domain 3: Workflow Execution (6 tests)**
- T-WF-01: WM command loads workflow.md
- T-WF-02: workflow.md loads step-01
- T-WF-03: Step completion loads next step
- T-WF-04: All 6 steps load sequentially
- T-WF-05: Step 6 creates wireframe artifact
- T-WF-06: Artifact saved to output_folder

**Domain 4: Registration (2 tests)**
- T-REG-01: Wade exists in agent-manifest.csv
- T-REG-02: Manifest has all required fields

**Target:** 100% P0 pass rate (18/18, same as Emma)

---

## Risk Assessment

### Known Risks (from Emma experience)

**R-1: Config Load Failure (Score 2 - LOW RISK)**
- **Status:** MITIGATED (Emma pattern proven)
- **Mitigation:** Reuse Emma's error handling code

**R-2: Workflow File Not Found (Score 4 - MEDIUM RISK)**
- **Status:** NEW MITIGATION
- **Mitigation:** Add file existence check + clear error message

**R-3: Slash Command Registration (Score 3 - LOW RISK)**
- **Status:** KNOWN LIMITATION (environment-specific)
- **Mitigation:** Document both invocation methods (slash command + direct file reading)

**R-4: ASCII Wireframe Rendering (Score 2 - LOW RISK)**
- **Status:** NEW FOR WADE
- **Challenge:** ASCII art may not render correctly in all markdown viewers
- **Mitigation:** Test rendering in common viewers (VS Code, GitHub, Obsidian)

---

## Development Timeline

### Estimated: 8 hours (vs. Emma's 12 hours)

**Hour 1-2: Agent Structure**
- Clone Emma's agent file
- Update persona (empathy expert → wireframe expert)
- Update menu (EM → WM, validation adapted for wireframes)
- Register in agent-manifest.csv
- **Output:** wireframe-designer.md (basic structure)

**Hour 3-4: Workflow Design**
- Create workflow.md (main orchestrator)
- Create step-01-define-requirements.md
- Create step-02-user-flows.md
- Create step-03-information-architecture.md
- **Output:** First 3 workflow steps

**Hour 5-6: Workflow Completion**
- Create step-04-wireframe-sketch.md
- Create step-05-components.md
- Create step-06-synthesize.md
- Create wireframe.template.md
- **Output:** Complete 6-step workflow

**Hour 7: Testing**
- Execute P0 test suite (18 scenarios)
- Fix any issues found
- Validate 100% pass rate
- **Output:** Test results document

**Hour 8: Documentation**
- Create Wade user guide (clone Emma's guide structure)
- Add wireframe-specific examples
- Document ASCII wireframe syntax
- Troubleshooting section
- **Output:** WADE-USER-GUIDE.md

---

## Success Criteria

### Minimum Viable Wade (MVP)

**Must Have:**
- ✅ 100% P0 test pass rate (18/18 tests)
- ✅ Complete 6-step wireframe workflow
- ✅ ASCII wireframe generation capability
- ✅ User guide with examples
- ✅ Error handling (R-1 and R-2 mitigated)
- ✅ Stakeholder approval for production use

**Quality Standards (from Emma):**
- ✅ All 6 quality gates passed
- ✅ Zero critical defects
- ✅ Clear, actionable error messages
- ✅ Professional artifact output
- ✅ Comprehensive documentation

---

## Differences from Emma

### What's the Same (Reuse)
- Agent architecture (XML structure)
- Config loading and validation
- Menu-driven interaction (6 items)
- Error handling patterns (R-1, R-2)
- Test plan structure (39 scenarios, 18 P0)
- User guide template
- Stakeholder review process

### What's Different (New)
- **Persona:** Wireframe expert vs. empathy mapping expert
- **Workflows:** Wireframe creation vs. empathy mapping
- **Output:** ASCII wireframes vs. empathy maps
- **Knowledge Base:** UI patterns vs. user research
- **Validation:** Usability principles vs. research evidence

**Code Reuse:** ~70% (structure, error handling, templates)
**New Code:** ~30% (workflows, wireframe generation, UI expertise)

---

## Next Steps After Wade

**Immediate (Week 1, Day 7):**
- Wade operational approval
- Update project README
- Update project status document

**Short-term (Week 2):**
- Begin Quinn (quality-gatekeeper) using Wade + Emma patterns
- Further accelerate development (6 hours vs. 8 for Wade)

---

## Appendix: Wade's Design Knowledge

### UI Component Patterns
- Navigation (top nav, bottom nav, hamburger, tabs)
- Input controls (text fields, dropdowns, checkboxes, radio buttons)
- Data display (cards, lists, tables, grids)
- Feedback (toasts, alerts, modals, sheets)
- Progress indicators (spinners, progress bars, skeletons)

### Information Architecture Principles
- Visual hierarchy (F-pattern, Z-pattern, inverted pyramid)
- Gestalt principles (proximity, similarity, closure, continuity)
- Progressive disclosure (show essentials, hide details)
- Content prioritization (above fold, scannable headings)

### Responsive Design
- Mobile-first vs. desktop-first
- Breakpoints (320px, 768px, 1024px, 1440px)
- Flexible grids (12-column, 8pt spacing)
- Adaptive layouts (reflow, stack, hide/show)

### Accessibility (WCAG 2.1 Level AA)
- Keyboard navigation (tab order, focus states)
- Screen reader support (ARIA labels, semantic HTML)
- Color contrast (4.5:1 for text, 3:1 for UI components)
- Touch targets (minimum 44px × 44px)
- Text alternatives (alt text, captions)

---

**Plan Created:** 2026-02-14
**Target Start:** Week 1, Day 3 (2026-02-15)
**Target Completion:** Week 1, Day 7 (2026-02-20)
**Estimated Effort:** 8 hours
**Status:** READY TO BEGIN
