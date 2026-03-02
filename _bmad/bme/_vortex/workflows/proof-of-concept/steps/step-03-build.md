---
step: 3
workflow: proof-of-concept
title: Build Prototype
---

# Step 3: Build Prototype

Time to build. The scope is locked, the question is clear, and the pass/fail criteria are defined. Now write the minimum code needed to answer the technical feasibility question -- nothing more.

## Why This Matters

A proof-of-concept is a learning tool, not a product. The moment you start optimizing, refactoring, or adding "just one more feature," you have stopped validating feasibility and started building a product. The goal is a clear answer -- feasible or not feasible -- in the shortest time possible. Ugly code that answers the question is infinitely more valuable than elegant code that answers the wrong question.

## Your Task

### 1. Set Up the Build Environment

Before writing PoC code, confirm your environment matches the scope from Step 2:

| Requirement | Status | Notes |
|-------------|--------|-------|
| **Runtime / language** | Ready / Setting up | *e.g., Node 20, Python 3.12, Go 1.22* |
| **Dependencies installed** | Ready / Installing | *List key libraries or SDKs* |
| **API keys / credentials** | Configured / Pending | *Confirm access to external services* |
| **Test data available** | Ready / Generating | *Confirm data source and format* |
| **Test environment** | Ready / Provisioning | *Local, container, cloud sandbox* |

If anything is "Pending" or "Provisioning," resolve it before proceeding. Do not start coding around missing infrastructure -- that creates noise in your results.

### 2. Build to the Scope

Follow the scope defined in Step 2. For each in-scope component:

| Component | What to Build | Done? |
|-----------|--------------|-------|
| *From Step 2 scope* | *Specific implementation task* | [ ] |
| *From Step 2 scope* | *Specific implementation task* | [ ] |
| *From Step 2 scope* | *Specific implementation task* | [ ] |

**Build rules:**
- [ ] **No scope creep.** If you discover something interesting but out of scope, write it down for later -- do not build it now.
- [ ] **No optimization.** First make it work, then measure. Optimization is for production, not PoCs.
- [ ] **No polish.** Hardcoded values, console output, manual steps -- all acceptable. The PoC needs to produce a measurable result, not impress anyone.
- [ ] **Document surprises.** If something unexpected happens during implementation -- an API behaves differently than documented, a library has a limitation you did not expect, performance is wildly different from estimates -- write it down immediately. These surprises ARE the findings.

### 3. Track Implementation Notes

As you build, capture what you learn. These notes feed directly into Step 4 (testing) and Step 6 (documentation):

| Observation | Category | Impact on Feasibility |
|-------------|----------|----------------------|
| *What you noticed while building* | Performance / Integration / Data / Algorithm / Infrastructure | Positive / Negative / Neutral |

**Categories to watch:**
- **Performance:** Was anything surprisingly fast or slow?
- **Integration:** Did the API/service work as documented? Any unexpected behaviors, rate limits, or authentication quirks?
- **Data:** Is the data in the format you expected? Any transformation issues?
- **Algorithm:** Does the approach work in principle? Any edge cases that change the picture?
- **Infrastructure:** Any resource constraints (memory, CPU, network) you did not anticipate?

### 4. Build Checkpoint

Before moving to testing, verify:

- [ ] The PoC runs end-to-end (even if manually triggered or partially hardcoded)
- [ ] It produces a measurable output that can be compared against the pass/fail criteria from Step 1
- [ ] You can reproduce the result (run it again, get a comparable outcome)
- [ ] You have not built anything outside the Step 2 scope
- [ ] Implementation notes capture every surprise, blocker, and unexpected behavior

**If the PoC does not run:** That is a valid finding. If you cannot get it working at all, document exactly where it breaks and why. A PoC that fails to run because of a fundamental technical limitation has answered the feasibility question -- the answer is "no" (or "not with this approach").

---

## Your Turn

Build the PoC according to your Step 2 scope. Track implementation notes as you go. When you have a running prototype that produces measurable output, share your implementation notes and we will move to structured testing.

---

**[a]** Advanced Elicitation -- Deep dive into implementation challenges with guided questioning
**[p]** Party Mode -- Bring in other Vortex agents to review your implementation approach
**[c]** Continue -- Proceed to testing technical assumptions

---

## Next Step

When your prototype is built and producing measurable output, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/proof-of-concept/steps/step-04-test.md
