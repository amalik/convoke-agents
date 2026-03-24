# FAQ

Common questions about Convoke, Vortex, and Gyre.

---

### How is this different from BMAD core agents?

**Convoke handles discovery, validation, and readiness. BMAD Core handles implementation.**

| Phase | Agents | Question answered |
|-------|--------|------------------|
| Product discovery (Vortex) | Emma, Isla, Mila, Liam, Wade, Noah, Max | "Should we build this?" |
| Production readiness (Gyre) | Scout, Atlas, Lens, Coach | "Are we ready to ship?" |
| Implementation (BMAD Core) | PM, Architect, Dev, QA | "Let's build it right" |

Vortex validates *what* to build. Gyre validates *readiness* to ship. BMAD Core handles the building.

---

### Can I use agents independently?

Yes. Each agent works standalone:

- **Emma alone** — Strategic framing and problem space definition
- **Isla alone** — User research and empathy mapping
- **Mila alone** — Research convergence and pattern recognition
- **Liam alone** — Hypothesis engineering and experiment design
- **Wade alone** — Experiment execution and validation
- **Noah alone** — Production signal interpretation and behavior analysis
- **Max alone** — Learning capture and decision-making

Use all seven together for the complete Vortex flow.

---

### What's the recommended order?

Follow the Vortex flow, but jump in wherever you are:

1. **Emma** — Defining a new product or problem space
2. **Isla** — Know the problem, need to understand users
3. **Mila** — Have research data, need to find patterns and convergence
4. **Liam** — Have insights, need structured hypotheses and experiments
5. **Wade** — Have hypotheses ready to test
6. **Noah** — Have production data, need signal interpretation
7. **Max** — Have experiment results, need to decide next steps

Max's Vortex Navigation helps identify which stream needs attention based on evidence gaps.

---

### What happened to empathy mapping and wireframing?

They were repositioned in v1.1.0. The project pivoted from traditional design deliverables to Lean Startup validation.

**v1.0.x:** Emma = Empathy Mapping Specialist, Wade = Wireframe Design Specialist
**v1.1.0+:** Emma = Contextualization Expert, Wade = Lean Experiments Specialist

Empathy mapping was later resurrected in v1.5.0 under Isla's Empathize stream.

---

### Is this the same as the multi-framework orchestration project?

No. The project pivoted from multi-framework orchestration (Quint + DesignOS + BMAD + AgentOS) to focused domain-specialized agents within BMAD.

The archived original vision is at `_bmad-output/planning-artifacts/ORIGINAL-VISION-README.md`.

---

### What was added in Wave 3?

v1.6.x completed the full 7-stream Vortex Pattern by adding three new agents:

- **Mila** — Research convergence, pivot-resynthesis, and pattern mapping
- **Liam** — Hypothesis engineering, assumption mapping, and experiment design
- **Noah** — Signal interpretation, behavior analysis, and production monitoring

These agents fill the gap between Isla's user research and Wade's experiment execution, giving teams a complete discovery-to-decision pipeline.

---

### Are all workflows ready to use?

Yes. All 22 workflows are fully implemented:

- **Emma:** lean-persona, product-vision, contextualize-scope
- **Isla:** empathy-map, user-interview, user-discovery
- **Mila:** research-convergence, pivot-resynthesis, pattern-mapping
- **Liam:** hypothesis-engineering, assumption-mapping, experiment-design
- **Wade:** mvp, lean-experiment, proof-of-concept, proof-of-value
- **Noah:** signal-interpretation, behavior-analysis, production-monitoring
- **Max:** learning-card, pivot-patch-persevere, vortex-navigation

Each includes templates, step files, and validation.

---

### How do I add a custom agent or module?

**Use BMB (BMAD Module Builder) — not manual file editing.**

Convoke includes three builder agents specifically for extending the system:

| Builder | Slash Command | What it creates |
|---------|---------------|-----------------|
| Bond (Agent Builder) | `/bmad-bmb-agent` | Custom agents with persona, menu, and workflows |
| Morgan (Module Builder) | `/bmad-bmb-module` | Complete modules with agents, workflows, and config |
| Wendy (Workflow Builder) | `/bmad-bmb-workflow` | Standalone workflows with steps, templates, and validation |

**Quick start:** Run `/bmad-bmb-agent` to create a new agent through a guided process. BMB handles registry entries, file structure, and validation — you focus on the agent's purpose and behavior.

**Alternative:** Fork the repository if you need full control over distribution (custom npm packages, non-standard patterns).

**Do not** hand-edit the agent registry (`agent-registry.js`) or create agent files manually. Agents added without proper structure — no handoff contracts, no Compass routing, no validation — degrade the Vortex's signal quality. Each unstructured addition makes it harder for agents to produce coherent, chainable outputs. BMB ensures your extensions follow the patterns that keep the Vortex working.

---

### What do I do when a handoff between agents fails?

Handoff failures typically mean the upstream agent's output is missing fields that the downstream agent expects.

**To diagnose:**

1. **Check the journey example** at `_bmad-output/journey-examples/` — it shows what well-formed artifacts look like at every handoff point, serving as an implicit format reference
2. **Check the handoff contract schemas** in `_bmad/bme/_vortex/contracts/` — the 5 artifact contracts (HC1-HC5) each have a schema file (e.g., `hc1-empathy-artifacts.md`) defining which fields the agent produces and the downstream agent consumes
3. **Check the receiving agent's first workflow step** — it documents what input fields it expects and how it uses them

**Common causes:** Running agents out of order, skipping intermediate agents, or using artifacts from a much older version as input to newer agents.

---

### What is Gyre?

**Gyre is a production readiness team — 4 agents that assess whether your project is ready to ship.**

Scout detects your tech stack, Atlas generates a capabilities model tailored to that stack, Lens finds what's missing, and Coach helps you review and refine. All artifacts go to `.gyre/` in your project root.

---

### What's the difference between Vortex and Gyre?

| | Vortex | Gyre |
|---|---|---|
| **Question** | "Should we build this?" | "Are we ready to ship this?" |
| **When** | Before and during development | Before production launch |
| **Focus** | User insight, hypotheses, evidence | Stack analysis, capabilities, gaps |
| **Agents** | 7 (discovery streams) | 4 (analysis pipeline) |
| **Pattern** | Non-linear loop | Linear pipeline with feedback |

They complement each other. Vortex validates the product direction. Gyre validates the production readiness of whatever you built.

---

### What is the `.gyre/` directory?

Gyre creates a `.gyre/` directory in your project root to store analysis artifacts:

- `stack-profile.yaml` — Classified tech stack (technology categories only)
- `capabilities.yaml` — What "ready" looks like for your stack (20+ capabilities)
- `findings.yaml` — What's missing (severity-tagged absences)
- `feedback.yaml` — Your team's amendments and feedback

**Privacy:** `.gyre/` files contain technology categories and structured metadata only — no file contents, paths, version numbers, or secrets. Safe to commit.

---

### Can I use Gyre standalone?

Yes. Install Gyre independently with `npx -p convoke-agents convoke-install-gyre`. Gyre works without Vortex, BMAD Core, or any other module.

---

### Can I create my own team?

Yes. Use the **Team Factory** (`/bmad-team-factory`) for a guided workflow that handles composition pattern selection, agent scope definition, contract design, artifact generation, and integration wiring. Output passes the same validation as native teams.

---

[Back to README](../README.md) | [Agents](agents.md) | [Testing](testing.md) | [Development](development.md)
