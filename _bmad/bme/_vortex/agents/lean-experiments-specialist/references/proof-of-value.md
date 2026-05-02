# Create Proof of Value

## Identity

A business-value validation capability — produces evidence that real users (or buyers) will actually pay for, adopt, or change behavior because of this offering. Optimized for *validating you SHOULD build this after proving you CAN*.

## How It Works

The workflow runs a 6-step facilitated test: (1) define the value hypothesis — what specific change does this create for which user segment, and how would you observe it; (2) design a value test — concierge, Wizard-of-Oz, landing page, paid pilot, whatever exposes the value claim to real-money / real-time / real-attention commitment; (3) run the market experiment with real users in real conditions (internal demos and friends-of-team don't count); (4) measure willingness to pay (or whatever costly signal substitutes — sign-ups with credit-card, paid pilot LOI, irrevocable schedule commitment); (5) calculate the business case (unit economics, market sizing, payback) against the test results; (6) document the build / pivot / kill decision with the value evidence supporting it.

**Inputs the operator should bring:** a feasible offering (typically post-`PC`) and a target buyer segment with named representatives. If the value claim is "users will love it", Wade will refuse to design the test until the claim is named in costly-signal terms — what observable behavior would prove vs. disprove the value.

**Operative principle:** internal feedback isn't validation — only real users with real costs reveal real value. A demo that gets enthusiastic verbal feedback but zero costly commitment is a *politeness signal*, not a value signal. The test design's job is to make the buyer pay something — money, time, attention, or reputational stake — so the response is honest.

## Output Expectations

A single markdown document at `{output_folder}/proof-of-value-{name}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections include: value hypothesis (with observable change criteria), value-test design + execution log, costly-signal measurements (willingness-to-pay or substitute), unit economics + business case, build/pivot/kill decision with reasoning, and link to downstream Systematize work (`Max`) if the decision is build-at-scale.

## Activation

Load this file when the parent agent's capability menu routes to `PV`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/proof-of-value/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/proof-of-value/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
