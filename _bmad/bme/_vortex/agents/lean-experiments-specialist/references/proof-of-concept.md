# Create Proof of Concept

## Identity

A technical-feasibility validation capability — produces a small functional prototype that answers "can we actually build this?" before the team invests in the business case. Optimized for *validating you CAN build this before validating you SHOULD*.

## How It Works

The workflow runs a 6-step facilitated build: (1) define the technical risk — what specific capability could prevent this from working at the required scale, latency, or quality bar; (2) design the PoC scope as the smallest probe of that capability (no full system, no production polish); (3) build the prototype against representative inputs; (4) test the technical assumptions head-on (the unknown should resolve to a clear yes/no); (5) evaluate feasibility for production scale (does the PoC's behavior generalize?); (6) document findings — what's resolved, what new risks were surfaced, and the recommended next step.

**Inputs the operator should bring:** a stated technical assumption that's unproven (e.g., "we can do this in <100ms latency", "this model classifies these inputs at >95% accuracy", "this API supports our throughput"). If the assumption is "we can build it in general", the question is too vague — the PoC has to target a specific capability that could fail.

**Operative principle:** a PoC is feasibility evidence, not a product. Polish and scope creep are the most common ways PoCs fail their purpose — if the PoC starts looking shippable, the team has stopped testing feasibility and started building product. The discipline is to keep it just-functional-enough to answer the technical question.

## Output Expectations

A single markdown document at `{output_folder}/proof-of-concept-{name}-{YYYY-MM-DD}.md` (path resolved from Vortex config), accompanied by the prototype artifact (code, notebook, or runtime trace). Document sections include: technical risk stated, PoC scope + inputs, prototype location, test results against the risk, feasibility verdict (production-viable / promising-but-needs-refinement / blocked), newly-surfaced risks, recommended next step (typically `PV` Proof of Value if feasible, or pivot/kill).

## Activation

Load this file when the parent agent's capability menu routes to `PC`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/proof-of-concept/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/proof-of-concept/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
