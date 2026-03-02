---
step: 2
workflow: proof-of-concept
title: Design PoC Scope
---

# Step 2: Design PoC Scope

Now that you know what could break, let's design the smallest possible test that answers the technical feasibility question. A proof-of-concept is not a prototype, not an MVP, not a demo -- it is the minimum code required to validate or invalidate a specific technical risk.

## Why This Matters

The most common PoC failure is scope creep. Teams start testing whether an API integration works and end up building half the product. Every hour spent on polish, error handling, or UI in a PoC is an hour wasted -- because if the core technical question answers "no," all that extra work is thrown away. Ruthless scoping keeps PoCs cheap, fast, and focused on the one question that matters.

## Your Task

### 1. Define the Core Technical Question

From Step 1, distill your risks into a single, testable technical question:

| Element | Your Answer |
|---------|-------------|
| **The Question** | What single technical question must this PoC answer? |
| **In Scope** | What is the minimum set of components, integrations, or code needed to answer the question? |
| **Out of Scope** | What are you explicitly NOT building? (Error handling, auth, UI, persistence, monitoring, etc.) |
| **Time Box** | How long should this PoC take? (Hours, not weeks. If it takes weeks, the scope is too large.) |

**Guidance:** If your "In Scope" list has more than 3-5 items, your PoC is too big. Strip it down to the absolute minimum needed to answer the question.

### 2. Design the Technical Approach

Map out the simplest path to answering the question:

| Component | What You Will Build | What You Will Fake/Stub |
|-----------|-------------------|----------------------|
| **Data** | *Minimum data needed* | *Hardcoded values, mock data, sample files* |
| **Integration** | *Actual API calls, library usage, or protocol tests* | *Mock services, stubbed responses, local simulators* |
| **Compute** | *The actual algorithm, query, or processing* | *Simplified versions, reduced datasets, single-threaded* |
| **Infrastructure** | *Minimum deployment (local, container, sandbox)* | *Production-grade setup, scaling, redundancy* |

**What you will NOT build:**
- [ ] Production error handling
- [ ] Authentication / authorization
- [ ] User interface (unless UI IS the technical question)
- [ ] Logging / monitoring
- [ ] Data migrations
- [ ] Automated tests (manual verification is fine for a PoC)
- [ ] Documentation beyond what this workflow produces

### 3. Define PoC Deliverables

What will exist when the PoC is done?

| Deliverable | Description |
|-------------|------------|
| **Working code** | *What will it do? What will it demonstrate?* |
| **Test data** | *What data will you use? Where does it come from?* |
| **Measurement method** | *How will you measure pass/fail against the criteria from Step 1?* |
| **Run instructions** | *How does someone else reproduce the result? (Even a single command is enough.)* |

### 4. Identify Dependencies and Blockers

Before building, confirm you have (or can get) everything needed:

| Dependency | Status | Blocker? |
|------------|--------|----------|
| **API keys / credentials** | Have / Need / Can self-provision | Yes / No |
| **Test environment** | Have / Need / Can create locally | Yes / No |
| **Test data** | Have / Need / Can generate | Yes / No |
| **Libraries / SDKs** | Have / Need / Can install | Yes / No |
| **Hardware / compute** | Have / Need / Can provision | Yes / No |

If any dependency is a blocker, resolve it before proceeding to Step 3. Do not start building a PoC that you know will stall on a missing credential or environment.

### 5. Scope Gut-Check

Final check before you build:

- [ ] Can this PoC be completed in the time box defined above?
- [ ] Does it test exactly one technical risk (the highest-priority one from Step 1)?
- [ ] Would a clear pass/fail result from this PoC change your decision about the project?
- [ ] If the PoC fails, will you know WHY it failed (not just that it failed)?
- [ ] Is there anything in scope that does not directly contribute to answering the technical question?

If you answered "no" to the last question, remove it from scope. If you answered "no" to any of the others, tighten the scope until every answer is "yes."

---

## Your Turn

Design your PoC scope: define the core question, map the technical approach, list deliverables, and confirm dependencies. Share your scope and I will help you cut anything that does not directly answer the technical question.

---

**[a]** Advanced Elicitation -- Deep dive into scope refinement with guided questioning
**[p]** Party Mode -- Bring in other Vortex agents to challenge your PoC scope
**[c]** Continue -- Proceed to building the proof-of-concept

---

## Next Step

When your PoC scope is defined and gut-checked, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/proof-of-concept/steps/step-03-build.md
