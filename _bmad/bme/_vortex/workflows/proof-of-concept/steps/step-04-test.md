---
step: 4
workflow: proof-of-concept
title: Test Technical Assumptions
---

# Step 4: Test Technical Assumptions

The prototype exists. Now we find out if it actually works -- not "works on my machine" but works against the specific pass/fail criteria defined in Step 1. This is where assumptions meet reality.

## Why This Matters

Building a PoC and declaring it "works" based on a single happy-path run is not validation -- it is confirmation bias. Technical feasibility means the system works under the conditions that matter: at the expected load, with realistic data, against actual API endpoints, within the required time constraints. This step forces you to test systematically rather than optimistically, so the feasibility assessment in Step 5 is grounded in evidence, not hope.

## Your Task

### 1. Revisit Your Pass/Fail Criteria

Pull forward the criteria from Step 1 and confirm they are still the right thresholds:

| Criteria | Threshold (from Step 1) | Still Valid? | Adjusted Threshold (if changed) |
|----------|------------------------|--------------|-------------------------------|
| **Pass** | *What proves feasibility* | Yes / No | *Updated threshold if needed* |
| **Fail** | *What disproves feasibility* | Yes / No | *Updated threshold if needed* |
| **Inconclusive** | *What means "need more data"* | Yes / No | *Updated threshold if needed* |

If you adjusted thresholds, document why. Moving the goalposts after seeing results is a red flag -- but refining criteria based on what you learned during the build (Step 3) is legitimate.

### 2. Design Test Scenarios

For each technical risk being validated, define specific test scenarios:

| Scenario | What It Tests | Input | Expected Output | Risk Category |
|----------|--------------|-------|----------------|---------------|
| **Happy path** | Does it work at all under ideal conditions? | *Simplest valid input* | *Expected result* | Baseline |
| **Realistic load** | Does it work at expected production conditions? | *Realistic data volume, concurrent users, or request rate* | *Within pass threshold* | Performance / Scalability |
| **Edge cases** | Does it handle boundary conditions? | *Empty data, maximum size, malformed input, timeout* | *Graceful handling or documented limitation* | Data / Algorithm |
| **Failure modes** | What happens when dependencies fail? | *API timeout, network error, invalid response* | *Known failure behavior* | Integration / Dependencies |
| **Stress test** | Where does it break? | *2x, 5x, 10x expected load* | *Identify breaking point* | Scalability |

**Guidance:** You do not need all five scenario types. Choose the ones that directly test your top risks from Step 1. If your primary risk is integration complexity, focus on happy path and failure modes. If your primary risk is performance, focus on realistic load and stress test.

### 3. Run Tests and Record Results

Execute each scenario and record raw results:

| Scenario | Actual Result | Pass/Fail/Inconclusive | Notes |
|----------|--------------|----------------------|-------|
| *Happy path* | *What actually happened* | *Against criteria* | *Anything unexpected* |
| *Realistic load* | *Measured metrics* | *Against criteria* | *Bottlenecks observed* |
| *Edge cases* | *Behavior observed* | *Against criteria* | *Limitations found* |
| *Failure modes* | *How it failed* | *Against criteria* | *Recovery behavior* |
| *Stress test* | *Breaking point found* | *Against criteria* | *Resource limits hit* |

**Record raw data, not interpretations.** If the response time was 340ms, write "340ms" -- do not write "acceptable." Interpretation happens in Step 5.

### 4. Capture Performance Data (If Applicable)

If performance is a relevant risk, record specific metrics:

| Metric | Target (from Step 1) | Measured | Delta | Acceptable? |
|--------|---------------------|----------|-------|-------------|
| **Latency (p50)** | *Target ms* | *Actual ms* | *+/- ms* | Yes / No |
| **Latency (p95)** | *Target ms* | *Actual ms* | *+/- ms* | Yes / No |
| **Throughput** | *Target ops/sec* | *Actual ops/sec* | *+/- ops/sec* | Yes / No |
| **Memory usage** | *Target MB* | *Actual MB* | *+/- MB* | Yes / No |
| **CPU utilization** | *Target %* | *Actual %* | *+/- %* | Yes / No |
| **Error rate** | *Target %* | *Actual %* | *+/- %* | Yes / No |

### 5. Document Unexpected Findings

During testing, you will discover things you did not expect. These are often more valuable than the planned test results:

| Finding | Expected? | Impact | Action Required |
|---------|-----------|--------|----------------|
| *What you discovered* | Yes / No | High / Medium / Low | *Does this change the feasibility assessment?* |

Pay special attention to:
- API rate limits or throttling not mentioned in documentation
- Data format inconsistencies between documentation and reality
- Performance cliffs (works fine at N, collapses at N+1)
- Hidden dependencies or configuration requirements
- Licensing or usage restrictions discovered during testing

---

## Your Turn

Design test scenarios for your top technical risks, run them against the prototype, and record raw results. Share your test results and unexpected findings -- I will help you assess what they mean for feasibility.

---

**[a]** Advanced Elicitation -- Deep dive into test design with guided questioning
**[p]** Party Mode -- Bring in other Vortex agents to challenge your test methodology
**[c]** Continue -- Proceed to feasibility evaluation

---

## Next Step

When your tests are complete and results are recorded, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/proof-of-concept/steps/step-05-evaluate.md
