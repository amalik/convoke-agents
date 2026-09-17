---
initiative: convoke
artifact_type: research
created: '2026-09-14'
schema_version: 1
status: draft
---

# State of the Art: AI-Assisted Product Delivery, Discovery and Readiness (September 2026)

Desk research feeding the BMAD Method + Convoke client whitepaper. Draft for review. All sources were accessed on 14–15 September 2026.

> **Claim-checked 17 September 2026** by two independent reviewers, each re-fetching the cited sources rather than re-reading this note. 25 corrections were applied. Most claims held verbatim. What did not: a quotation attributed to MeasuringU that does not appear in that article; BMAD's own release history (wrong first stable version *and* wrong count, on a row this note had marked *Verified*); ITBench figures quoted from a superseded preprint while citing the published paper; a Meta backtest described as production accuracy; a harmonised standard reported as pending when it had been approved; Article 14 quoted without the party it binds; Article 26(6) quoted without its control and data-protection qualifiers; an undisclosed conflict of interest in the one framework comparison; and three places where this note stated confidently what its own gap list says was never checked. The corrections are in place; the pattern is recorded in the closing section. Nothing in this document is drawn from the products' own claims except where it is explicitly labelled as a self-description.

---

## 1. Executive summary

**AI coding help is now mainstream. Proof of business benefit is not.** In a vendor survey of more than 15,000 professional developers, 90% said they used AI coding agents at work at least weekly (JetBrains, May–July 2026). The most rigorous studies disagree with each other, though, and the 2026 follow-up could not measure the effect reliably at all: developers declined to take part or withheld tasks rather than work without AI, the pay rate was cut from $150 to $50 an hour, and timings became unreliable when developers ran several agents at once. Both of its point estimates indicated a speedup, with intervals including zero. A 2025 randomised trial found experienced developers were 19% *slower* with AI. Company field trials found 26% more tasks completed. The 2026 follow-up to the first trial could not measure the effect reliably, because too many developers refused to work without AI.

**AI adoption is associated with more output and with strain on quality and stability.** Google's DORA research linked AI adoption to less stable software delivery in both 2024 and 2025. Vendor data points the same way: more code, longer reviews, more incidents. DORA's central conclusion is that AI *amplifies* whatever an organisation already is.

**Structured AI delivery methods are a crowded, young category.** BMAD Method is one of a crowded set of open-source frameworks that wrap AI coding tools in a defined process; others include GitHub Spec Kit, OpenSpec, AWS AI-DLC, Superpowers and GSD. Nobody has counted the field: the only published comparison we found selected six by a traction threshold, and its six are not the same six. Thoughtworks rated the approach "Assess" in November 2025, and has not carried that blip into the current (April 2026) Radar. We found no independent evidence that any of them improves business outcomes. Thoughtworks rates the approach "Assess" (worth exploring, not yet a safe bet). It singles out BMAD as heavier and more rigid than lighter alternatives.

**"Covering the whole lifecycle" no longer sets anyone apart.** AWS's open-source AI-DLC now runs from ideation through operations, with a human approval gate after every stage. BMAD itself has added user-research features.

**In product discovery, AI helps when you work with real customers and is risky when it replaces them.** The evidence supports using AI to run and analyse research with real people. AI-simulated "synthetic users" are contested. A 2026 *Nature* study found they predict average survey-experiment effects well. Peer-reviewed work finds they flatten differences between groups; practitioner studies find they also tell teams what they want to hear.

**In operations, AI assists but cannot yet run things on its own.** On public benchmarks, AI agents solved about one realistic reliability incident in nine, or fewer — on benchmarks run with 2024–2025 models. The industry standard for monitoring AI agents is not yet stable.

**The EU moved its deadlines but kept the obligations.** The EU "AI Omnibus" came into force on 27 July 2026. It pushed the main high-risk obligations to 2 December 2027 and 2 August 2028. Transparency rules apply from August 2026. A model where a human decides and agents propose is necessary, but it is not enough on its own. The law requires overseers who are competent, trained and empowered, plus records and organisation-level management. Research also shows that human reviewers often simply follow AI advice.

**The interoperability standards now have neutral stewards.** MCP, AGENTS.md and A2A are now housed in the Linux Foundation's Agentic AI Foundation. Agent Skills, the format BMAD uses, is widely adopted but has no neutral foundation.

**Scaling fails on organisation, not tools.** Analyst and consulting surveys agree that most firms are not yet getting value from AI at scale. Spending on AI coding tokens is rising quickly.

*Interpretation for BMAD + Convoke (detailed in Section 3):* credible positioning should rest on process discipline and support for oversight, with the limits stated openly. It should not rest on productivity claims. The biggest open gaps are:
- no outcome evidence;
- Convoke's own agents cannot yet run outside Convoke;
- the governance model works at the level of each interaction rather than the whole organisation.

---

## 2. Findings by research question

**What a negative claim means here.** Sentences of the form "we found no X" mean: searched Google Scholar, arXiv and the named vendor, registry or standards sites on 14–15 September 2026, re-checked on 17 September, and found nothing matching. They are not assertions that no such work exists. Where a negative claim rests on a named file rather than a search — such as the absence of interview, hypothesis or experiment stages in AI-DLC's Ideation stage list — the file is cited.

**How to read the evidence tables.** *Verified* means the primary source (the study, standard, registry or official page) was retrieved and the claim found in it. For long reports, "read" sometimes means the official abstract, summary page or press release rather than the full PDF; the Source cell says which. *Reported* means only a secondary source was available. *Contested* means credible sources disagree. A claim can be Verified and still be weak evidence, for example vendor telemetry or a single-author preprint. Where that applies, the Claim cell says so. GitHub star counts measure attention, not adoption. npm download counts are inflated by `npx` runs and CI pipelines, and they are not comparable across packages.

### 2.1 Landscape of structured AI-assisted delivery (2026)

**Method layer and tool layer.** The market has split into two layers.
- **Tool layer:** the agent harnesses and IDEs that run models against a codebase. Examples are Claude Code, GitHub Copilot, OpenAI Codex, Cursor, Kiro and OpenCode.
- **Method layer:** process frameworks that sit on top of those tools as instruction files, skills and templates. They prescribe roles, phases, artifacts and review gates. Examples are BMAD Method, GitHub Spec Kit, OpenSpec, AWS AI-DLC, Superpowers and GSD.

Some vendors straddle both layers. AWS Kiro is an IDE with spec-driven development built in. The two layers are converging on shared building blocks: skills in `SKILL.md` folders, subagents, MCP tool connections and repository instruction files. That convergence makes method frameworks cheaper to build and easier to replace.

**Tool layer, usage.** JetBrains' 2026 Developer Ecosystem Survey reports these work-usage shares for May–July 2026:

| Tool | Share of developers |
|---|---|
| Claude Code | 39% |
| GitHub Copilot | 21% (down from 29%) |
| OpenAI Codex | 16% (up from 3% in January) |
| Cursor | 12% (down from 18%) |
| JetBrains AI | 9% |
| OpenCode | 7% |

JetBrains is itself a tool vendor, and it re-weights its sample by familiarity with JetBrains products. Stack Overflow's 2025 survey (48,945 respondents) sets the trust baseline: 84% use or plan to use AI tools, but only 3.1% "highly trust" the output, and 66% cite answers that are "almost right, but not quite". The 2026 Stack Overflow survey opened in June 2026, and we could not find published results.

**Method layer, maturity and critique.** Thoughtworks' Technology Radar puts "spec-driven development" in *Assess* (November 2025). It warns that the workflows are "elaborate and opinionated" and may be "relearning a bitter lesson — that handcrafting detailed rules for AI ultimately doesn't scale". In the April 2026 Radar, OpenSpec is also *Assess*, and the entry contrasts it with "heavier alternatives that enforce more rigid workflows (e.g., BMAD)". Thoughtworks advises teams to keep re-checking whether native agent capabilities make these frameworks unnecessary. Other April 2026 Radar ratings:
- *Adopt:* curated shared instructions, context engineering
- *Trial:* Agent Skills
- *Assess:* teams of role-specific coding agents
- *Caution:* agent instruction bloat, and using coding throughput as a productivity measure

Birgitta Böckeler (martinfowler.com, October 2025) tested Kiro, Spec Kit and Tessl. She found that agents "frequently" ignored the instructions despite all the templates, and wrote: "I'd rather review code than all these markdown files."

**Where BMAD sits.** BMAD Method is a method-layer framework delivered as skills. Its current release is v6.12.0 (4 September 2026). The first stable v6 shipped on 17 February 2026 (GitHub `v6.0.0`, titled "V6 Stable Release! The End of Beta!"; npm `6.0.1` the same day). Nineteen stable 6.x versions were published between then and 4 September 2026, and v6.12.0 alone carries several breaking changes.

On attention signals, BMAD sits mid-pack:

| Framework | GitHub stars (14 Sep 2026) |
|---|---|
| Superpowers | ~287k |
| GitHub Spec Kit | ~137k |
| OpenSpec | ~68k |
| GSD | ~65k |
| BMAD Method | ~53k (about 160 contributors) |
| AWS AI-DLC | ~4.6k (but AWS-backed) |

**Governance.** BMAD is company-controlled open source. The code is MIT-licensed. BMad Code, LLC owns the "BMad" trademarks. Extensions must use their own name and may not present themselves as official. We found no foundation and no published formal governance model.

The only structured comparison we found is a single-author arXiv preprint (June 2026), **whose author also wrote one of the six frameworks it scores — a conflict the paper itself declares**. It rated BMAD strong on roles, specification and context and weaker on portability (BMAD scores the highest total of the six in its Table 6), and concluded that its "effectiveness depends on usage discipline and on independent empirical evaluation". The author also noted that no framework "strongly covers all six dimensions".

Convoke is an extension of BMAD. On its own public signals it is early-stage: 65 GitHub stars, and 3,601 npm downloads in the 30 days to 11 September 2026.

**Lifecycle breadth is now contested ground.** AWS AI-DLC (v2.8.2, 11 September 2026, MIT-0) defines five phases, including *Ideation* and *Operation*. It has 33 stages and 14 agents, and asks the user to approve after each stage. It runs on Claude Code, Kiro, Codex CLI, Cursor, opencode and Copilot. Its Ideation stages are intent capture, market research, feasibility, scope, team formation, mockups and approval. We found no user-interview, hypothesis or experiment stage. Its Operation stages cover deployment, observability and SLOs, incident response and performance validation, with AWS-specific agents.

BMAD upstream now ships a "user-voice" research type grounded in jobs-to-be-done. It works from reviews and forums, not from interviews with users.

| Claim | Source (publisher, title, URL) | Date | Confidence |
|---|---|---|---|
| BMAD Method's latest stable release is v6.12.0; npm `latest` is 6.12.0 | BMad Code, "Release v6.12.0", https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.12.0 ; npm registry `npm view bmad-method dist-tags` | 2026-09-04 | Verified |
| First stable v6 published 2026-02-17 (GitHub `v6.0.0`, `prerelease: false`; npm `6.0.1` same day); 19 stable 6.x versions from then to 6.12.0 on 2026-09-04 | npm registry, `npm view bmad-method time`; GitHub releases API | re-derived 2026-09-17 | Verified |
| v6.12.0 includes breaking changes: `persistent_facts` ships empty, `{diff_output}` renamed to `{diff_file}`, `bmad-checkpoint-preview` renamed to `bmad-walkthrough`, shims need `--shims` | BMad Code, v6.12.0 release notes (URL above) | 2026-09-04 | Verified |
| BMAD-METHOD has 53,008 stars, 5,990 forks and about 160 contributors (anonymous included) | GitHub REST API, `repos/bmad-code-org/BMAD-METHOD` | read 2026-09-14 | Verified |
| bmad-method had 82,238 npm downloads in 30 days (inflated by npx and CI) | npm downloads API, https://api.npmjs.org/downloads/point/last-month/bmad-method | 2026-08-13 to 09-11 | Verified |
| "BMad", "BMad Method", "BMad Core" and "BMad Code" are trademarks of BMad Code, LLC; extensions must keep "distinct name and branding" and may not claim official status | BMad Code, TRADEMARK.md, https://github.com/bmad-code-org/BMAD-METHOD/blob/main/TRADEMARK.md | read 2026-09-14 | Verified |
| Significant BMAD changes must be confirmed with a maintainer; PRs are capped at 800 lines | BMad Code, CONTRIBUTING.md, https://github.com/bmad-code-org/BMAD-METHOD/blob/main/CONTRIBUTING.md | read 2026-09-14 | Verified |
| GitHub Spec Kit: 136,772 stars; v1.0.0 on 2026-08-21 and v1.0.6 on 2026-09-10; MIT; "works with 30+ AI coding agents"; constitution → specify → plan → tasks → implement | GitHub, github/spec-kit, https://github.com/github/spec-kit ; GitHub REST API | read 2026-09-14 | Verified |
| OpenSpec: 68,253 stars; propose → apply → archive workflow; MIT | Fission-AI, OpenSpec, https://github.com/Fission-AI/OpenSpec ; GitHub REST API | read 2026-09-14 | Verified |
| Superpowers ("An agentic skills framework & software development methodology that works"): 286,653 stars; GSD: 64,533 stars | GitHub REST API, `repos/obra/superpowers`, `repos/gsd-build/get-shit-done` | read 2026-09-14 | Verified |
| AWS AI-DLC v2.8.2 (MIT-0) has 5 phases (Initialization, Ideation, Inception, Construction, Operation), 33 stages and 14 agents; "after each stage, you review and approve"; runs on Claude Code, Kiro, Codex CLI, Cursor, opencode and Copilot | AWS Labs, "AI-DLC Workflows: Introduction", https://awslabs.github.io/aidlc-workflows/guide/00-introduction/ ; GitHub release API | v2.8.2 on 2026-09-11 | Verified |
| AI-DLC Ideation covers intent, market research, feasibility, scope, team, mockups and approval (no interview or experiment stage found); Operation covers deployment, observability and SLOs, incident response, performance and feedback | AWS Labs, stage references, https://github.com/awslabs/aidlc-workflows/blob/main/docs/reference/04-stages/ideation.md and .../operation.md | read 2026-09-15 | Verified |
| Kiro reached general availability with property-based testing for specs, checkpoints, a CLI and team plans via IAM Identity Center | Kiro (AWS), "Kiro is generally available", https://kiro.dev/blog/general-availability/ | 2025-11-17 | Verified |
| Spec-driven development rated *Assess*: "elaborate and opinionated"; "may be relearning a bitter lesson" | Thoughtworks, Technology Radar, "Spec-driven development", https://www.thoughtworks.com/radar/techniques/spec-driven-development | Nov 2025 | Verified |
| OpenSpec rated *Assess*, contrasted with "heavier alternatives that enforce more rigid workflows (e.g., BMAD)" and "vendor-specific IDE integrations (e.g., Kiro)" | Thoughtworks, Technology Radar Vol. 34, "OpenSpec", https://www.thoughtworks.com/en-us/radar/tools/openspec | Apr 2026 | Verified |
| April 2026 Radar ratings: Adopt for curated shared instructions and context engineering; Trial for Agent Skills; Assess for team of coding agents; Caution for agent instruction bloat and coding throughput as a productivity measure | Thoughtworks, Technology Radar, Techniques, https://www.thoughtworks.com/radar/techniques | Apr 2026 | Verified |
| Spec Kit rated *Assess*; teams saw a "growing agent instruction set and eventually context rot" | Thoughtworks, Technology Radar, "GitHub Spec Kit", https://www.thoughtworks.com/en-us/radar/languages-and-frameworks/github-spec-kit | Apr 2026 | Verified |
| Three levels of SDD (spec-first, spec-anchored, spec-as-source); agents "frequently" did not follow instructions; "I'd rather review code than all these markdown files" | Böckeler, martinfowler.com, "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl", https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html | 2025-10-15 | Verified |
| Six-framework comparison (Spec Kit, OpenSpec, BMAD, GSD, Spec Kitty, Reversa): "no framework strongly covers all six dimensions"; BMAD's effectiveness "depends on usage discipline and on independent empirical evaluation"; single rater, documents only (single-author preprint) | de Macedo, arXiv 2606.04967, "From Prompt to Process", https://arxiv.org/abs/2606.04967 | 2026-06-03 | Verified |
| One practitioner's run of "BMAD Full" took 6 days and about $200 in AI usage (n=1). The source gives no comparison with other tools' timelines, records the run as BMAD v6.0.3 in February 2026, and calls it "one developer's historical observations with an older version, not a current BMAD price or a prediction for another team" | Ry Walker Research, "BMAD Method", https://rywalker.com/research/bmad-method | read 2026-09-14 | Reported |
| 90% of professional developers used AI coding agents at work at least weekly; usage shares: Claude Code 39%, Copilot 21%, Codex 16%, Cursor 12% (vendor survey, 15,000+ respondents, re-weighted) | JetBrains Research, "AI Coding Agents: Adoption Trends", https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/ | Aug 2026 | Verified |
| 84% use or plan to use AI tools; 3.1% highly trust output; 45.7% somewhat or highly distrust it; 66% cite "almost right, but not quite" | Stack Overflow, 2025 Developer Survey, AI section, https://survey.stackoverflow.co/2025/ai | Jul 2025 | Verified |
| Convoke (convoke-agents): 65 GitHub stars, 4 forks, 3,601 npm downloads in 30 days | GitHub REST API `repos/amalik/convoke-agents` ; npm downloads API | read 2026-09-14 | Verified |

### 2.2 AI in product discovery and validated learning

**State of practice.** AI is now routine inside research workflows but seldom trusted to replace research participants. Maze's 2026 survey of about 500 researchers and product people found 69% using AI in at least some projects. The top reported benefit was faster turnaround (63%). A May 2026 survey by User Interviews found researchers mostly "skeptical" (47%) or "opposed" (17%) to synthetic users. Their top concerns were accuracy (88%) and stakeholders over-relying on the output (79%). About 63% said their organisation has no formal guidance. User Interviews is a participant-recruitment vendor and surveyed only 150 people.

Teresa Torres, the originator of Continuous Discovery Habits, puts it this way: "If you are building a product used by humans, you probably need to be talking to those humans. Full stop." She treats AI as additive: use it to test a single assumption, not to validate a whole solution.

**The synthetic-users debate (Contested).** Credible sources point in different directions:
- **Against substitution.** Nielsen Norman Group compared synthetic users with its own real studies. It found the synthetic responses shallow and sycophantic; for example, synthetic learners claimed to finish courses that real learners abandon. MeasuringU (April 2026) reviewed 12 peer-reviewed papers and found that most reported discrepancies between synthetic and human results — 14 discouraging findings against 9 encouraging: reduced variability, exaggerated effects and flattened subgroups. Wang, Morgenstern and Dickerson (*Nature Machine Intelligence*, 2025) show analytically and empirically that LLMs "misportray and flatten" demographic groups.
- **For narrow uses.** Ashokkumar, Hewitt, Ghezae and Willer (*Nature*, 8 July 2026) built an archive of 70 preregistered US survey experiments (about 470 effects, 119,000+ participants). They found GPT-4-simulated predictions correlated strongly with the real treatment effects, about as accurately as pooled human forecasters. The same study found effect sizes systematically overestimated. Park et al. (revised June 2026) reached 86% of participants' own test-retest consistency, but only by building each agent from a **two-hour interview with the real person**.
- **Reading the evidence together.** Simulations can help forecast directions and averages for known kinds of questions. They are weak on minority segments, lived context and genuinely new behaviour, which is exactly what discovery work is meant to surface.

**AI with real people.** A separate line of evidence supports using AI to *conduct* research with real participants. An LSE working paper (Geiecke and Jaravel) reports that blind expert raters scored AI-led qualitative interviews as roughly comparable to an average human expert interviewer. We could not verify its journal status.

In the EU, an AI system that interacts directly with people must tell them so, unless that is obvious (AI Act Article 50, in application since August 2026). That matters for AI-moderated interviews.

**AI in ideation and lean experimentation.** The evidence is mixed and depends on who uses it:
- In a pre-registered field experiment with 776 Procter & Gamble professionals, individuals working with AI matched the performance of two-person teams without AI.
- Writers given AI ideas produced stories rated more creative individually but more similar to each other collectively (Doshi and Hauser, 2024). That is a homogenisation risk for idea generation.
- In a Kenyan field experiment, AI business advice showed no average effect: high performers gained and low performers lost ground.
- One observational preprint of 1,800 Chinese startups finds AI complements Lean Startup practice.

A high-profile 2024 preprint claiming large AI-driven gains in R&D product innovation was **disowned by MIT in May 2025**. MIT stated it had "no confidence in the provenance, reliability or validity of the data". It is a reminder not to cite headline AI-productivity figures without checking.

**Relevance of DORA.** DORA's AI Capabilities Model lists "user-centric focus" as one of seven amplifiers. It warns that "adopting AI tools can actually harm teams that lack a user-centric focus."

We found no rigorous study of AI-assisted jobs-to-be-done analysis, or of AI-run experimentation, that measured product outcomes.

| Claim | Source (publisher, title, URL) | Date | Confidence |
|---|---|---|---|
| Synthetic-user responses were shallow and sycophantic compared with real studies; acceptable for desk research, hypothesis generation and preparing interview guides; "Making decisions without real-user research is dangerous" | Nielsen Norman Group (Rosala, Moran), "Synthetic Users: If, When, and How to Use AI-Generated 'Research'", https://www.nngroup.com/articles/synthetic-users/ | 2024-06-21 | Verified |
| Review of 12 peer-reviewed papers: "most found discrepancies between synthetic and human results" (14 discouraging findings against 9 encouraging); reduced variability; "tendency for models to exaggerate effects"; concludes it is "premature to rely on research with synthetic users for critical decision-making" | MeasuringU (Lewis, Sauro), "A Review of Experiments with Synthetic Users", https://measuringu.com/review-of-experiments-with-synthetic-users/ | 2026-04-14 | Verified |
| LLMs replacing participants "misportray and flatten" identity groups (human studies with 3,200 participants and four LLMs) | Wang, Morgenstern, Dickerson, *Nature Machine Intelligence* 7:400–411; arXiv 2402.01908, https://arxiv.org/abs/2402.01908 | 2025 | Verified (accepted-version abstract) |
| GPT-4 simulations of 70 preregistered experiments (about 470 effects, 119k+ participants) correlated strongly with actual effects, matching pooled human forecasts; effect sizes overestimated | Ashokkumar, Hewitt, Ghezae, Willer, *Nature* 656:115–122; Stanford GSB summary, https://www.gsb.stanford.edu/faculty-research/publications/large-language-models-can-predict-results-social-science-experiments | 2026-07-08 | Verified (publisher summary) |
| The correlation figure is r = 0.85 (r = 0.90 on studies unpublished at training time) | Secondary summaries of the preprint (e.g., Stanford AI for Public Benefit project page) | 2024–2026 | Reported |
| Agents built from two-hour interviews with 1,052 real people reached 86% of participants' two-week test-retest consistency | Park et al., arXiv 2411.10109 (revised), https://arxiv.org/abs/2411.10109 | rev. 2026-06-28 | Verified |
| Whether AI simulations can stand in for users in research | NN/g, MeasuringU and Wang et al. (above) against Ashokkumar et al. and Park et al. (above) | 2024–2026 | Contested |
| Researchers' views of synthetic users: 47% skeptical, 24% cautiously optimistic, 17% opposed; top concern quality (88%); about 63% of organisations lack guidance (vendor survey, n=150) | User Interviews, "State of Synthetic Users", https://www.userinterviews.com/state-of-synthetic-users-report | May 2026 | Verified |
| 69% of respondents use AI in at least some research projects (about 500 respondents) | Maze, "The Future of User Research Report 2026", https://maze.co/blog/future-user-research-2026/ | 2026-03-11 | Verified |
| "If you are building a product used by humans, you probably need to be talking to those humans. Full stop." AI should be additive, not a replacement | Cieden Podcast, "Teresa Torres on Continuous Discovery in B2B & AI", https://cieden.com/podcast/teresa-torres-on-continuous-discovery-in-b2b-and-ai | undated page | Verified |
| AI-led qualitative interviews rated roughly comparable to an average human expert interviewer by blind raters | Geiecke and Jaravel, "Conversations at Scale: Robust AI-led Interviews", CEPR DP19705 / SSRN 4974382, https://cepr.org/publications/dp19705 | 2024–2026 | Reported |
| In a field experiment with 776 P&G professionals, individuals with AI matched teams without AI; AI reduced functional silos | Dell'Acqua et al., NBER Working Paper 33641, "The Cybernetic Teammate", https://www.nber.org/papers/w33641 | 2025 | Verified |
| Generative AI ideas raised individual creativity but reduced the collective diversity of the stories produced | Doshi and Hauser, *Science Advances*, https://www.science.org/doi/10.1126/sciadv.adn5290 | 2024 | Reported |
| AI business advice had no detectable average effect; high performers gained just over 15%, low performers did worse | Otis, Clarke, Delecourt, Holtz, Koning, *Management Science*, https://doi.org/10.1287/mnsc.2024.06909 | 2024–2025 | Reported |
| In 1,800 Chinese startups (observational), AI investment complements Lean Startup practice: discovery-oriented AI pairs with prototyping, optimisation-oriented AI with A/B testing (preprint) | Wang and Wu, arXiv 2506.16334, https://arxiv.org/abs/2506.16334 | rev. 2025-08-25 | Verified |
| MIT has "no confidence in the provenance, reliability or validity of the data" in the preprint "Artificial Intelligence, Scientific Discovery, and Product Innovation" | MIT Economics, "Assuring an accurate research record", https://economics.mit.edu/news/assuring-accurate-research-record | 2025-05-16 | Verified |
| "Adopting AI tools can actually harm teams that lack a user-centric focus" (DORA AI Capabilities Model) | Google Cloud, "From adoption to impact: Putting the DORA AI Capabilities Model to work", https://cloud.google.com/blog/products/ai-machine-learning/from-adoption-to-impact-putting-the-dora-ai-capabilities-model-to-work | 2025-12-10 | Verified |
| BMAD upstream ships a "User-Voice Research Pack" (jobs-to-be-done, complaints, switching triggers) sourced from reviews, forums and Reddit | BMad Code, `skills/bmad-deep-recon/types/user-voice.md`, https://github.com/bmad-code-org/BMAD-METHOD/blob/main/skills/bmad-deep-recon/types/user-voice.md | read 2026-09-15 | Verified |

### 2.3 AI in production and operational readiness

**Baseline practice.** Google's SRE book defines the Production Readiness Review as verifying that a service "meets accepted standards of production setup and operational readiness". That baseline remains the reference point.

**What AI is doing to stability.** DORA found that a 25% increase in AI adoption was associated with an estimated 7.2% drop in delivery stability and a 1.5% drop in throughput (2024). In 2025 the throughput relationship turned positive, but the link to *instability* remained. Faros AI's 2026 vendor telemetry (22,000 developers, two years, before-and-after comparison) reports large jumps as AI adoption rises: incidents per PR +242.7%, 5x median review time, bugs per PR +28%. That data is not peer-reviewed. The direction matches DORA's.

**AI as an operations assistant.**
- Catchpoint's SRE Report 2026 (n=418): 49% said AI reduced toil, 35% saw no change and 16% saw more. Directors credited AI (60%) far more than individual contributors did (38%). The report suggests AI "redistributed toil rather than removed it".
- In backtesting against historical investigations in Meta's web monorepo, its root-cause ranking identified the cause 42% of the time at investigation creation. Meta filters out low-confidence suggestions because a wrong root cause could "mislead engineers".
- Public benchmarks show autonomous capability is still low. On ITBench (IBM, ICML 2025), agents resolved 11.4% of SRE scenarios, 25.2% of CISO scenarios and 25.8% of FinOps scenarios across 102 scenarios. On OpenRCA (ICLR 2025), the best model located the root cause in 11.34% of 335 failures. Both used 2024–2025 models, and newer models may score higher. We found no equally rigorous 2026 re-run.

**Agents in production are a new risk class (Contested case).** In February 2026 the *Financial Times* reported, citing people familiar with the matter, that Amazon's Kiro agent caused a 13-hour disruption by deleting and recreating an environment. Amazon published a rebuttal. It said the event was "user error — specifically misconfigured access controls — not AI", that it affected one service in one region, and that mandatory peer review for production access was added afterwards. We could not access the FT original.

**Observability for agents is immature.** Every attribute and span in OpenTelemetry's GenAI and MCP semantic conventions is still marked `stability: development`, which is not stable. Tooling that traces what agents did in production is therefore still settling.

AWS AI-DLC's Operation phase now bundles observability and SLO setup, incident-response runbooks and performance validation into an agent workflow, which puts it on the same ground as readiness-focused offerings.

| Claim | Source (publisher, title, URL) | Date | Confidence |
|---|---|---|---|
| PRR objective: "Verify that a service meets accepted standards of production setup and operational readiness" | Google, *Site Reliability Engineering*, "The Evolving SRE Engagement Model", https://sre.google/sre-book/evolving-sre-engagement-model/ | 2016 (online) | Verified |
| A 25% increase in AI adoption is associated with an estimated 1.5% decrease in delivery throughput and a 7.2% reduction in delivery stability | Google Cloud, "Announcing the 2024 DORA report", https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report | Oct 2024 | Verified |
| AI adoption is positively related to throughput (a change from 2024) and still negatively related to delivery stability | Google Cloud, "Announcing the 2025 DORA Report", https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report | 2025-09-23 | Verified |
| As AI adoption rises: incidents per PR +242.7%, monthly incidents +57.9%, 5x median review time, bugs per PR +28%, deployments per week −11.7% (vendor telemetry, 22,000 developers) | Faros AI, "The Acceleration Whiplash" (AI Engineering Report 2026), https://www.faros.ai/research/ai-acceleration-whiplash | 2026-04-12 | Verified (vendor data) |
| Effect of AI on toil: 49% decreased, 35% no change, 16% increased; directors 60% vs individual contributors 38% (n=418) | Catchpoint, "SRE Report 2026: What surprised us…", https://www.catchpoint.com/blog/sre-report-2026-what-surprised-us-what-didnt-and-why-the-gaps-matter-most | 2026-01-22 | Verified |
| Agents resolve "only 11.4% of SRE scenarios, 25.2% of CISO scenarios, and 25.8% of FinOps scenarios" (102 scenarios) | Jha et al. (IBM, UIUC), "ITBench", ICML 2025, PMLR v267, https://proceedings.mlr.press/v267/jha25a.html | published version, read 2026-09-17 | Verified. The arXiv v1 preprint (Feb 2025) gives 13.8% and 0% for FinOps; the published paper supersedes it |
| Best model (Claude 3.5 with a specialised agent) located the root cause in 11.34% of 335 failures (68 GB of telemetry) | Xu et al., "OpenRCA", ICLR 2025, https://proceedings.iclr.cc/paper_files/paper/2025/hash/d29b8d53678015079e1d245c023e49d2-Abstract-Conference.html | 2025 | Verified |
| 42% accuracy identifying root causes at investigation creation (web monorepo); low-confidence suggestions filtered because they "can potentially suggest wrong root causes and mislead engineers" | Meta Engineering, "Leveraging AI for efficient incident response", https://engineering.fb.com/2024/06/24/data-infrastructure/leveraging-ai-for-efficient-incident-response/ | 2024-06-24 | Verified |
| Whether an AI agent (Kiro) caused a December 2025 AWS service disruption: the FT says yes; Amazon attributes it to misconfigured access controls | GeekWire, "Amazon pushes back on Financial Times report…", https://www.geekwire.com/2026/amazon-pushes-back-on-financial-times-report-blaming-ai-coding-tools-for-aws-outages/ ; Amazon, "Correcting the Financial Times report…", https://www.aboutamazon.com/news/aws/aws-service-outage-ai-bot-kiro | Feb 2026 | Contested |
| All GenAI and MCP semantic-convention definitions are `stability: development` (118 attributes in the GenAI registry) | OpenTelemetry, semantic-conventions-genai, `model/gen-ai/registry.yaml`, https://github.com/open-telemetry/semantic-conventions-genai | read 2026-09-15 | Verified |
| AI-DLC Operation stages include observability setup with SLO/SLI tracking, incident response and performance validation | AWS Labs, Operation stage reference (URL in 2.1) | read 2026-09-15 | Verified |

### 2.4 Evidence on outcomes: productivity and quality

**Established (multiple rigorous sources agree):**
1. Adoption and *perceived* productivity are high. DORA 2025 (about 5,000 respondents) found 90% use AI at work and more than 80% believe it increased their productivity.
2. Perception is an unreliable measure. In METR's 2025 randomised trial, developers *expected* a 24% speedup and still *believed* afterwards that they had been 20% faster, when they had been 19% slower.
3. Effects vary by context, task and experience. The field trials show larger gains for less experienced developers. Anthropic's 2026 trial shows learning costs, with the largest gap in debugging.
4. At team and organisation level, AI is linked to worse stability, and the bottleneck moves to review. See DORA in 2.3, and Faros's 2025 finding of +98% merged PRs and +91% review time with "no significant correlation … at the company level".
5. Security quality of generated code has not improved in step with functional quality. Veracode's Spring 2026 test of more than 150 models found only 55% of tasks produced secure code, "essentially flat" across model generations. Reasoning models reached 70–72%.

**Contested (credible studies disagree):** the size and even the sign of the productivity effect.
- **Slower:** METR 2025 RCT, 19% slower (95% CI +2% to +39%).
- **Faster:**
  - Google's enterprise RCT: about 21% faster, with wide confidence intervals.
  - Three company field experiments (4,867 developers): +26.08% completed tasks (SE 10.3%).
  - Microsoft's 2026 rollout study of command-line agents (preprint, not a randomised trial as far as the abstract shows): adopters merged about 24% more PRs.
- **Unmeasurable:** METR's 2026 follow-up (57 developers, 800+ tasks) estimated task-time changes of −18% (CI −38% to +9%) for returning developers and −4% (CI −15% to +9%) for new recruits. Both point towards a speedup, but the intervals include zero. METR calls the data an "unreliable signal", mainly because developers chose not to take part or withheld tasks rather than work without AI.

Output measures such as PR counts are exactly what Thoughtworks now cautions against using as productivity measures.

**Economic modelling is not evidence of return on investment.** DORA's 2026 *ROI of AI-assisted Software Development* is a framework and calculator. According to InfoQ's coverage, it describes a "J-curve" with an early productivity dip driven partly by a "verification tax". The authors themselves call its projections "a high-uncertainty estimate meant to spark a conversation".

**Capability trend.** METR measured the length of software tasks frontier models complete with 50% success. It doubled about every 7 months over six years (to March 2025). The page is flagged as partly out of date, and success on tasks that take humans hours is still far from reliable.

| Claim | Source (publisher, title, URL) | Date | Confidence |
|---|---|---|---|
| RCT: 16 experienced open-source developers, 246 tasks; AI use made tasks take 19% longer; developers forecast a 24% speedup and afterwards believed they were 20% faster | METR, "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity", https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ | 2025-07-10 | Verified |
| Follow-up (57 developers, 800+ tasks): −18% (CI −38% to +9%) for returning developers and −4% (CI −15% to +9%) for new ones; "unreliable signal" because of selection effects; 30–50% withheld tasks they did not want to do without AI | METR (Becker et al.), "We are Changing our Developer Productivity Experiment Design", https://metr.org/blog/2026-02-24-uplift-update/ | 2026-02-24 | Verified |
| RCT with 96 Google engineers: AI cut time on an enterprise task by about 21%, with broad confidence intervals | Paradis et al. (Google), arXiv 2410.12944, https://arxiv.org/abs/2410.12944 | 2024 (v3 2024-11-11) | Verified |
| Three field experiments (Microsoft, Accenture, a Fortune 100 firm; 4,867 developers): +26.08% (SE 10.3%) completed tasks; less experienced developers gained more | Cui, Demirer, Jaffe, Musolff, Peng, Salz, Microsoft Research, https://www.microsoft.com/en-us/research/publication/the-effects-of-generative-ai-on-high-skilled-work-evidence-from-three-field-experiments-with-software-developers/ | 2025 | Verified |
| The same paper is published in *Management Science* (DOI 10.1287/mnsc.2025.00535) | INFORMS page (returned 403 when fetched) | 2025 | Reported |
| The overall productivity effect of AI coding tools on professional developers | METR 2025 against Paradis et al., Cui et al. and Murphy-Hill et al.; METR 2026 update | 2024–2026 | Contested |
| Early-2026 rollout of Claude Code and Copilot CLI at Microsoft: adopters "merged roughly 24% more pull requests than they would have otherwise"; adoption spread "primarily through social networks" (preprint) | Murphy-Hill, Butler, Savelieva, arXiv 2607.01418, https://arxiv.org/abs/2607.01418 | 2026-07-01 | Verified |
| 90% of respondents use AI at work; more than 80% believe it increased productivity; 30% have little or no trust in AI-generated code (nearly 5,000 respondents) | Google Cloud, "Announcing the 2025 DORA Report" (URL in 2.3) | 2025-09-23 | Verified |
| High-AI-adoption teams: +21% tasks, +98% merged PRs, +91% PR review time, +9% bugs per developer; "No significant correlation between AI adoption and improvements at the company level" (vendor telemetry, 10,000+ developers) | Faros AI, "The AI Productivity Paradox Research Report", https://www.faros.ai/blog/ai-software-engineering | 2025-07-23 | Verified (vendor data) |
| Only 55% of generation tasks yield secure code, flat between 45% and 55% across model generations; reasoning models 70–72% (150+ models) | Veracode, "Spring 2026 GenAI Code Security Update", https://www.veracode.com/blog/spring-2026-genai-code-security/ | 2026-03-24 | Verified (vendor data) |
| "AI-written code produces ~1.7x more issues than human code" (470 open-source PRs) — vendor data; CodeRabbit sells AI code review | CodeRabbit, "State of AI vs Human Code Generation" (newsroom), https://www.coderabbit.ai/newsroom/state-of-ai-vs-human-code-generation-report | Dec 2025 | Reported |
| RCT (n=52, mostly junior): AI group scored 50% vs 67% on a mastery quiz (Cohen's d=0.738, p=0.01); speed gain not significant; largest gap on debugging | Anthropic (Shen, Tamkin), "How AI assistance impacts the formation of coding skills", https://www.anthropic.com/research/AI-assistance-coding-skills | 2026-01-29 | Verified |
| Survey of 415 practitioners: gains may be "surface-level acceleration" offset by review burden and verification effort (preprint) | Afroz et al., arXiv 2510.24265, "The Fast and Spurious", https://arxiv.org/abs/2510.24265 | rev. 2026-04-05 | Verified |
| DORA's ROI report is a model; the authors call its figures "a high-uncertainty estimate"; J-curve and "verification tax" | InfoQ, "New DORA Report Claims Strong Engineering Foundations Drive AI Return on Investment", https://www.infoq.com/news/2026/05/dora-roi-ai-assisted-dev-report/ ; DORA, https://dora.dev/ai/roi/report/ | 2026-05-11 | Reported |
| The 50% task-completion time horizon doubled about every 7 months over 6 years; the page notes some content is out of date | METR, "Measuring AI Ability to Complete Long Software Tasks", https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/ | 2025-03-19 | Verified |

### 2.5 Governance

**EU AI Act, as it stands in September 2026.** The Commission's AI Act page was last updated on 3 August 2026. It gives this timeline:

| What applies | Date |
|---|---|
| Prohibited practices and AI-literacy obligations | 2 February 2025 |
| Governance rules and general-purpose AI (GPAI) model obligations | 2 August 2025 |
| General application, including transparency rules | 2 August 2026 |
| High-risk obligations for systems in the listed sensitive areas | **2 December 2027** |
| High-risk AI embedded in regulated products | **2 August 2028** |
| New prohibition on AI-generated non-consensual intimate content and CSAM | December 2026 |

The two postponed high-risk dates come from the "Digital Omnibus on AI". Council and Parliament reached agreement on 7 May 2026, and it entered into force on 27 July 2026. Law-firm summaries identify it as Regulation (EU) 2026/1744, published in the Official Journal on 24 July 2026. They also report a grace period to 2 December 2026 for machine-readable marking by generative systems already on the market, and a softened AI-literacy duty ("take measures supporting AI literacy"). The Commission's own article pages still display the pre-amendment text with a notice that it has been amended.

Harmonised standards that would give a presumption of conformity are late, but the first has landed: CEN-CENELEC approved **EN 18286** on 12 July 2026, the first European standard supporting the AI Act to reach publication. It does not yet confer a presumption of conformity — that requires citation in the Official Journal, which had not happened as of the Commission's standardisation page of 3 August 2026. The rest of the JTC 21 programme remains outstanding.

**Relevant obligations.** The following apply to *high-risk* systems:
- **Article 14** obliges **providers** to design and develop high-risk systems so that human overseers can understand their capacities and limitations, "remain aware of … automation bias", correctly interpret output, "disregard, override or reverse" it, and interrupt the system. Deployers must implement the measures the provider identifies (Art. 26(1)) — the duty to *build for* oversight and the duty to *exercise* it bind different parties.
- **Article 26(2)** requires deployers to assign oversight to people with "the necessary competence, training and authority, as well as the necessary support".
- **Article 26(6)** requires deployers to keep logs automatically generated by the high-risk system, *to the extent those logs are under their control*, for a period appropriate to its intended purpose and at least six months — *unless other Union or national law, in particular data-protection law, provides otherwise*.

Whether any given system is high-risk is determined by Article 6 and Annex III, as amended by the Digital Omnibus. **We did not perform that classification for any product.** Nothing here should be read as a classification of Convoke, BMAD or any client system; that determination needs legal advice on the specific deployment.

**NIST AI RMF and ISO/IEC 42001.** NIST's AI RMF 1.0 (January 2023) organises risk work into Govern, Map, Measure and Manage. It has a Generative AI Profile (NIST AI 600-1, July 2024), and NIST says it is being revised under the White House AI Action Plan, with no completion date given. Three subcategories bear directly on human oversight:
- GOVERN 3.2: roles for "human-AI configurations and oversight".
- MAP 3.5: documented human-oversight processes.
- MANAGE 2.4: mechanisms to "supersede, disengage, or deactivate" AI systems.

ISO/IEC 42001:2023 specifies requirements for an organisation-wide AI management system. We could not read ISO's page, so its details here come from secondary sources.

**Evidence that "a human decides" is not automatically effective.** A JRC field experiment with 1,411 HR and banking professionals found overseers "equally likely to follow advice from a generic AI that is discriminatory as from an AI that is programmed to be fair". Legal scholars argue that the Act's awareness mandate alone is insufficient against automation bias. OWASP's Top 10 for Agentic Applications (December 2025) includes "Human-Agent Trust Exploitation": agents appear "confident, fluent, and authoritative", so people accept recommendations without checking. Vendor documentation also says instruction files are not controls. Claude Code states that `CLAUDE.md` content is "context, not enforced configuration", and that hard limits need hooks or managed settings.

**Analysis (interpretation): how an "operator decides, agents propose" model maps to these frameworks.** The Convoke Operator Covenant ("the operator is the resolver") defines seven rights: default, full universe, rationale, completeness, pause, next action and pacing. Its frontmatter status is `draft`.

*Where it maps well:*
- Override and stop (Art. 14(4)(d)–(e); NIST MANAGE 2.4) correspond to the rights to a default/override and to pause.
- Understanding limits and correct interpretation (Art. 14(4)(a),(c)) are supported by the rights to rationale, full universe and completeness. Showing scope before filtered results directly counters silent omission.
- A documented oversight process (NIST MAP 3.5) is partly served by the Covenant and its compliance checklist.

*Where it does not suffice on its own:*
1. **Competence and authority.** Art. 26(2) is an organisational duty: training, authority and support. Software cannot grant these.
2. **Automation bias.** The Covenant does not mention it (text search). A one-keystroke "accept default" may *increase* anchoring. The JRC evidence suggests people follow AI advice whatever its quality. Anthropic's trial suggests skills needed for oversight, such as debugging, weaken with AI use.
3. **Records and logs.** Artifacts written by agents are not the automatically generated system logs that Art. 12 and Art. 26(6) contemplate for high-risk systems.
4. **Organisation-level management.** ISO/IEC 42001 sets requirements for an organisation-wide AI management system, and NIST's GOVERN function expects organisational policies and roles. **We read only ISO/IEC 42001's published scope statement, not Annex A** (see gap 4), so we do not enumerate its controls here. Either way both operate at organisation level, not at the level of a single interaction.
5. **Enforcement.** Rules expressed in markdown instructions are guidance to the model, not technical controls (Claude Code documentation).
6. **Security.** Prompt injection and tool or skill poisoning can steer what gets proposed to the operator (see 2.6). Human approval does not detect a manipulated proposal that looks plausible.
7. **Verification of the Covenant itself.** The Covenant reports that 46 of 56 audit cells pass (82%). It also discloses that the audit used a single LLM reviewer, was mostly static, was run inside the project, and covered **eight skills out of roughly thirty-three** — and it states the 82% figure is "more plausibly a ceiling than a floor". The Covenant requires those caveats to travel with the number.

| Claim | Source (publisher, title, URL) | Date | Confidence |
|---|---|---|---|
| Timeline: prohibitions and AI literacy from 2 Feb 2025; GPAI and governance from 2 Aug 2025; general application from 2 Aug 2026; transparency from Aug 2026; sensitive-area high-risk from 2 Dec 2027; high-risk in products from 2 Aug 2028; intimate-content/CSAM prohibition from Dec 2026; Omnibus agreed 7 May 2026, in force 27 Jul 2026 | European Commission, "AI Act" (regulatory framework page), https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai | updated 2026-08-03 | Verified |
| The AI Omnibus is Regulation (EU) 2026/1744, published in the OJ on 24 Jul 2026 | K&L Gates Cyber Law Watch, "EU Digital Omnibus on AI Enters Into Force", https://www.cyberlawwatch.com/2026/07/31/eu-digital-omnibus-on-ai-enters-into-force/ ; Lewis Silkin, https://www.lewissilkin.com/insights/2026/07/27/the-digital-omnibus-on-ai-enters-into-force-today-102nedo | 2026-07-27/31 | Reported |
| Omnibus details: grace period to 2 Dec 2026 for marking by pre-existing generative systems; AI literacy softened to "take measures supporting AI literacy"; Annex VIII registration streamlined | Lewis Silkin (URL above) | 2026-07-27 | Reported |
| Article 4 (AI literacy) text shown is pre-amendment; the page states it has been amended by the Digital Omnibus | European Commission AI Act Service Desk, Article 4, https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-4 | read 2026-09-15 | Verified |
| Art. 14(4): overseers must be able to understand limits, "remain aware of … automation bias", interpret output, "disregard, override or reverse the output", and interrupt via a "stop" button | EC AI Act Service Desk, Article 14, https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14 | read 2026-09-15 | Verified |
| Art. 26(2): oversight assigned to persons with "the necessary competence, training and authority, as well as the necessary support"; Art. 26(6): logs kept for at least six months | EC AI Act Service Desk, Article 26, https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26 | read 2026-09-15 | Verified |
| Art. 50(1): providers must ensure people interacting directly with an AI system are informed, unless it is obvious (text shown pre-amendment) | EC AI Act Service Desk, Article 50, https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50 | read 2026-09-15 | Verified |
| prEN 18286 (AI quality management system) was at formal vote in mid-2026; CEN-CENELEC targets its prioritised deliverables for Q4 2026 | JTC 21 news and trackers, https://jtc21.eu/category/harmonized-ai-standards/ ; CEN-CENELEC, https://www.cencenelec.eu/news-events/news/2025/brief-news/2025-10-23-ai-standardization/ | 2025–2026 | Reported |
| AI RMF 1.0 released 26 Jan 2023; Generative AI Profile (NIST-AI-600-1) 26 Jul 2024; "The AI RMF 1.0 is being revised as part of the White House AI Action Plan" | NIST, "AI Risk Management Framework", https://www.nist.gov/itl/ai-risk-management-framework | read 2026-09-15 | Verified |
| GOVERN 3.2 (roles for human-AI configurations and oversight); MAP 3.5 (human oversight processes documented); MANAGE 2.4 (mechanisms to supersede, disengage or deactivate) | NIST AIRC, AI RMF Core, https://airc.nist.gov/airmf-resources/airmf/5-sec-core/ | read 2026-09-15 | Verified |
| ISO/IEC 42001:2023 specifies requirements for establishing, implementing, maintaining and continually improving an AI management system; published December 2023 | ANSI/ANAB blog, https://blog.ansi.org/anab/iso-iec-42001-ai-management-systems/ ; IEC Webstore, https://webstore.iec.ch/en/publication/90574 (iso.org returned 403) | 2023 | Reported |
| Field experiment (N=1,411, Italy and Germany): overseers "equally likely to follow advice from a generic AI that is discriminatory as from an AI that is programmed to be fair" | European Commission JRC (Gaudeul et al.), "The impact of human oversight on discrimination in AI-supported decision-making", https://op.europa.eu/publication/manifestation_identifier/PUB_KJ0124180ENN | 2024 | Verified |
| The AI Act's requirement to enable awareness of automation bias is likely insufficient; standards should draw on behavioural research (preprint) | Laux and Ruschemeier, arXiv 2502.10036, https://arxiv.org/abs/2502.10036 | rev. 2025-06-20 | Verified |
| OWASP Top 10 for Agentic Applications for 2026 published | OWASP GenAI Security Project, https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ | 2025-12-09 | Verified |
| The list includes ASI09 "Human-Agent Trust Exploitation" ("Agents can appear confident, fluent, and authoritative…") | Teleport, "OWASP Top 10 for Agentic Applications 2026", https://goteleport.com/blog/owasp-top-10-agentic-applications/ | 2026 | Reported |
| Claude Code treats CLAUDE.md "as context, not enforced configuration"; use hooks or managed settings for enforcement | Anthropic, Claude Code Docs, "How Claude remembers your project", https://code.claude.com/docs/en/memory | read 2026-09-15 | Verified |
| The Operator Covenant's self-audit: 46 of 56 cells (82%) pass; single LLM reviewer, mostly static review, auditor inside the project (product self-description) | Convoke, `_bmad/bme/covenant/covenant-operator.md` §8 (repository file) | 2026-04-18 | Verified (self-description) |

### 2.6 Portability and interoperability

**Agent Skills (SKILL.md).** Anthropic created the format and released it as an open standard; secondary sources date the release to 18 December 2025. A skill is a folder with a `SKILL.md` file containing at least a `name` and `description`, loaded through "progressive disclosure". The official client list includes Claude Code, OpenAI Codex, GitHub Copilot and VS Code, Cursor, Gemini CLI, Kiro, JetBrains Junie, OpenCode, Goose and many others.

Its governance is the weakest of the four standards. The site says only that it was "originally developed by Anthropic, released as an open standard" and is "open to contributions". The code is Apache-2.0 and the docs CC-BY-4.0. The Agentic AI Foundation's project list does not include it. A secondary claim that Agent Skills moved to the foundation could not be confirmed.

**Model Context Protocol (MCP).** Anthropic contributed MCP as a founding project of the Linux Foundation's Agentic AI Foundation (AAIF) on 9 December 2025. The AAIF's platinum members are AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft and OpenAI. MCP's maintainers and its proposal process (SEPs) stayed in place. The current specification is dated 2026-07-28. The specification itself warns that tools "represent arbitrary code execution" and that tool descriptions "should be considered untrusted". It also says MCP "cannot enforce these security principles at the protocol level".

**AGENTS.md** is now stewarded by the AAIF and self-reports use in "over 60,000" open-source projects. Claude Code does *not* read AGENTS.md natively. Its documentation recommends importing it from `CLAUDE.md`.

**Agent2Agent (A2A).**
- Google announced it in April 2025.
- It was donated to the Linux Foundation in June 2025.
- v1.0.0 was released on 12 March 2026 and v1.0.1 on 28 May 2026.
- It became an AAIF-hosted project on 17 August 2026.

MCP connects agents to tools; A2A connects agents to each other.

**Lock-in risks for agent-based methods.**
1. **Harness dependence.** Instruction and memory file conventions still differ between tools (CLAUDE.md vs AGENTS.md). Features such as hooks, subagents and slash commands are harness-specific. Thoughtworks describes Kiro as needing "vendor-specific IDE integrations".
2. **Model churn.** Anthropic gives "at least 60 days' notice" before retiring a model. Claude Sonnet 3.7, for example, was deprecated on 28 October 2025 and retired on 19 February 2026. Methods tuned to one model's behaviour need re-validation on a regular cycle.
3. **Supply-chain exposure.** Skills and MCP servers are executable context:
   - Researchers evaluated seven MCP clients and found most lack adequate defences against tool poisoning.
   - A 2026 study showed natural-language attacks on skill registries succeeding in 36.5% to 100% of cases for evading governance checks.
   - A Snyk audit of 3,984 public skills, reported via Cloud Security Alliance, found 36.82% with security flaws and 76 with confirmed malicious payloads.
4. **Upstream volatility.** Frequent breaking releases in a framework you extend (BMAD: 19 stable 6.x versions in about six months) add maintenance cost for extensions.

On the positive side, both `bmad-method@6.12.0` and `convoke-agents@4.0.2` are published with npm SLSA provenance attestations.

| Claim | Source (publisher, title, URL) | Date | Confidence |
|---|---|---|---|
| Agent Skills: a folder with `SKILL.md` (at minimum `name` and `description`); progressive disclosure; "originally developed by Anthropic, released as an open standard"; client list includes Claude Code, Codex, GitHub Copilot, VS Code, Cursor, Gemini CLI, Kiro, Junie, OpenCode, Goose | Agent Skills, "Overview", https://agentskills.io | read 2026-09-14 | Verified |
| No foundation stewardship stated for Agent Skills; repo code Apache-2.0, docs CC-BY-4.0; not in the AAIF project list | agentskills/agentskills README, https://github.com/agentskills/agentskills ; AAIF, "Projects", https://aaif.io/projects/ | read 2026-09-14 | Verified |
| Agent Skills was released as an open standard on 18 Dec 2025 | Simon Willison, "Agent Skills", https://simonwillison.net/2025/Dec/19/agent-skills/ ; VentureBeat coverage | 2025-12-18/19 | Reported |
| AAIF formed with founding projects MCP (Anthropic), goose (Block) and AGENTS.md (OpenAI); platinum members AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI | Linux Foundation, press release, https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation | 2025-12-09 | Verified |
| MCP's "governance model … continues as is"; maintainers decide through the SEP process | MCP Blog, "MCP joins the Agentic AI Foundation", https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/ | 2025-12-09 | Verified |
| Current MCP specification version 2026-07-28; tools are arbitrary code execution; tool descriptions untrusted; MCP "cannot enforce these security principles at the protocol level" | Model Context Protocol, "Specification", https://modelcontextprotocol.io/specification/latest ; GitHub release `2026-07-28` | 2026-07-28 | Verified |
| AGENTS.md "is now stewarded by the Agentic AI Foundation"; used by "over 60,000 open-source projects" (self-reported) | AGENTS.md, https://agents.md | read 2026-09-14 | Verified |
| "Claude Code reads CLAUDE.md, not AGENTS.md"; recommends `@AGENTS.md` import or a symlink | Anthropic, Claude Code Docs, "How Claude remembers your project", https://code.claude.com/docs/en/memory | read 2026-09-15 | Verified |
| A2A v1.0.0 released 2026-03-12 and v1.0.1 on 2026-05-28 | GitHub Releases API, `repos/a2aproject/A2A` | read 2026-09-14 | Verified |
| A2A announced by Google (Apr 2025) and donated to the Linux Foundation (Jun 2025) | Google Developers Blog, "Google Cloud donates A2A to Linux Foundation", https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/ | 2025-06 | Reported |
| A2A "is joining the Agentic AI Foundation (AAIF) as a hosted project" | AAIF Blog, "A2A joins AAIF's open agentic stack", https://aaif.io/blog/a2a-joins-aaif | 2026-08-17 | Verified |
| At least 60 days' notice before retiring publicly released models; Claude Sonnet 3.7 deprecated 2025-10-28 and retired 2026-02-19 | Anthropic, "Model deprecations", https://platform.claude.com/docs/en/docs/about-claude/model-deprecations | read 2026-09-15 | Verified |
| Seven major MCP clients evaluated; most lack adequate defences against tool poisoning (preprint) | Huang et al., arXiv 2603.22489, https://arxiv.org/abs/2603.22489 | 2026-03-23 | Verified |
| Attacks on skill registries: discovery manipulation up to 86% pairwise win rate; selection bias in 77.6% of trials; governance-check evasion in 36.5% to 100% of cases (preprint) | Saha, Faghih, Feizi, arXiv 2605.11418, https://arxiv.org/abs/2605.11418 | 2026-05-12 | Verified |
| Snyk audit of 3,984 skills (ClawHub, skills.sh): 36.82% with security flaws, 13.4% critical, 76 confirmed malicious | Cloud Security Alliance, "Agent Context Poisoning: SKILL.md and the New AI Supply Chain Attack Surface", https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/ | 2026-05-06 | Reported |
| "MCP by default" rated *Caution* | Thoughtworks, Technology Radar, Techniques (URL in 2.1) | Apr 2026 | Verified |
| BMAD v6.12.0 installer adds Polytoken, Grok and ZCode; project-context tool adopts handwritten `AGENTS.md` | BMad Code, v6.12.0 release notes (URL in 2.1) | 2026-09-04 | Verified |
| `bmad-method@6.12.0` and `convoke-agents@4.0.2` carry npm attestations (SLSA provenance v1 for convoke-agents) | npm registry, `npm view <pkg>@<ver> dist` | read 2026-09-15 | Verified |

### 2.7 Scaling adoption in organisations

**Pattern 1: value is concentrated in a few firms.**
- BCG (September 2025; 1,250 executives) classifies only 5% of companies as "future-built" and 60% as laggards with minimal gains. It says agents already account for 17% of AI value.
- McKinsey's State of AI 2025 (n=1,993; secondary source) reports 62% of organisations at least experimenting with agents. Nearly two-thirds have not begun scaling, and high performers are about 2.8x as likely to have fundamentally redesigned workflows.
- MIT NANDA's widely quoted "95% get no measurable P&L return" (July 2025) rests on interviews, 153 surveys and public disclosures, and critics dispute how it defines success. Treat it as contested.
- Gartner predicts that more than 40% of agentic AI projects will be cancelled by the end of 2027 because of cost, unclear value or weak risk controls (press release not accessible; reported).

**Pattern 2: the organisation limits the gains, not the tool.**
- DORA 2025 names seven capabilities that amplify AI's benefit: a clear AI stance, healthy data ecosystems, AI-accessible internal data, strong version control, small batches, user-centric focus and quality internal platforms. It also reports 90% of organisations have adopted at least one internal platform.
- Atlassian's 2025 DevEx survey (n=3,500): 68% of developers save more than 10 hours a week with AI, while 50% lose 10 or more hours a week to organisational friction. Developers spend only a small share of their time coding, and 63% say leaders don't understand their pain points.
- Faros's 2026 vendor data describes a "senior engineer tax" and "more code … entering production with no review at all".

**Pattern 3: enablement spreads socially, and guardrails must be technical.**
- Microsoft's 2026 rollout study found adoption spread "primarily through social networks" and recommends "visible peer use as central to rollout strategy".
- Thoughtworks recommends curated shared instructions (*Adopt*) and cautions against instruction bloat.
- Tool vendors separate enforceable managed settings from advisory instruction files.
- Microsoft and LinkedIn's 2024 Work Trend Index reported 78% of AI users bringing their own AI tools to work. That is a shadow-AI signal governance programmes must reach.

**Pattern 4: cost is becoming a first-order constraint.**
- The FinOps Foundation (February 2026; n=1,192) reports 98% of practitioners now manage AI spend, up from 31% two years earlier.
- Gartner (June 2026, via secondary coverage) predicts AI coding costs will exceed the average developer's salary by 2028. It reports about a quarter of technology leaders already spend $200–500 per developer per month on tokens, and about 6% spend more than $2,000.

**Pattern 5: people risks.** Anthropic's trial shows learning costs for less experienced developers. Participants who used AI to ask for explanations retained more. This is a direct input to how training should be designed.

| Claim | Source (publisher, title, URL) | Date | Confidence |
|---|---|---|---|
| 5% of companies "future-built", 35% "scalers", 60% laggards with minimal gains; agents 17% of AI value, projected 29% by 2028 (1,250 executives) | BCG press release, "AI Leaders Outpace Laggards…", https://www.prnewswire.com/news-releases/ai-leaders-outpace-laggards-with-double-the-revenue-growth-and-40-more-cost-savings-302570218.html | 2025-09-30 | Verified |
| n=1,993 (fielded 25 Jun–29 Jul 2025); 62% at least experimenting with agents; nearly two-thirds not yet scaling; 39% report enterprise EBIT impact; high performers 2.8x more likely to redesign workflows | McKinsey, "The state of AI in 2025" (page timed out; figures from secondary summaries), https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai | Nov 2025 | Reported |
| "95% of organizations are seeing no business return"; 300+ initiatives, 52 interviews, 153 surveys; workers in 90% of firms use personal AI tools while 40% bought official subscriptions | Virtualization Review on MIT NANDA, https://virtualizationreview.com/articles/2025/08/19/mit-report-finds-most-ai-business-investments-fail-reveals-genai-divide.aspx ; critique: Futuriom, https://www.futuriom.com/articles/news/why-we-dont-believe-mit-nandas-werid-ai-study/2025/08 | Jul–Aug 2025 | Contested |
| Over 40% of agentic AI projects will be cancelled by end of 2027 (cost, unclear value, inadequate risk controls) | Gartner press release (403 on fetch), https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027 ; BigDATAwire coverage | 2025-06-25 | Reported |
| Seven DORA AI capabilities (clear AI stance, healthy data ecosystems, AI-accessible internal data, strong version control, small batches, user-centric focus, quality internal platforms) | Google Cloud, "From adoption to impact…" (URL in 2.2) | 2025-12-10 | Verified |
| AI "amplifier" thesis; 90% of organisations have adopted at least one platform | Google Cloud, "Announcing the 2025 DORA Report" (URL in 2.3) | 2025-09-23 | Verified |
| 68% save more than 10 h/week with AI; 50% lose 10+ h/week to non-coding friction; 63% say leaders don't understand their pain points (n=3,500) | Atlassian, "AI adoption is rising, but friction persists", https://www.atlassian.com/blog/developer/developer-experience-report-2025 | 2025-07-09 | Verified |
| Adoption spread "primarily through social networks"; recommend "visible peer use as central to rollout strategy" (preprint) | Murphy-Hill et al., arXiv 2607.01418 (URL in 2.4) | 2026-07-01 | Verified |
| 78% of AI users bring their own AI tools to work (31,000 knowledge workers, 31 markets) | Microsoft and LinkedIn, 2024 Work Trend Index, https://news.microsoft.com/source/2024/05/08/microsoft-and-linkedin-release-the-2024-work-trend-index-on-the-state-of-ai-at-work/ | 2024-05-08 | Reported |
| 98% of 1,192 respondents manage AI spend (up from 31% two years prior) | FinOps Foundation / Linux Foundation, "State of FinOps Survey…", https://www.linuxfoundation.org/press/state-of-finops-survey-ai-value-and-skills-top-priorities-as-finops-matures-across-technology-value-98-manage-ai-90-saas-64-licensing-48-data-center-1 | 2026-02-19 | Verified |
| AI coding costs to surpass the average developer salary by 2028; about a quarter of leaders spend $200–500/developer/month on tokens; about 6% more than $2,000 | DevOps.com, "AI Coding Costs Could Exceed Developer Salaries, Gartner Warns", https://devops.com/ai-coding-costs-could-exceed-developer-salaries-gartner-warns/ (Gartner original returned 403) | 2026-06-24/30 | Reported |
| "Senior engineer tax"; "More code is entering production with no review at all" (vendor) | Faros AI, "Ten Takeaways", https://www.faros.ai/blog/ai-acceleration-whiplash-takeaways | 2026-04-12 | Verified (vendor data) |
| Managed settings are "enforced by the client regardless of what Claude decides"; CLAUDE.md instructions "are not a hard enforcement layer" | Anthropic, Claude Code Docs (URL in 2.5) | read 2026-09-15 | Verified |

---

## 3. Implications for BMAD + Convoke positioning

> **INTERPRETATION, NOT FACT.** This section draws inferences from the evidence above and from the products' own documentation (README, Covenant). It is intended as input to the whitepaper's maturity ledger. It is not a sales argument. Every statement here should be challenged before it reaches clients.

### 3.1 Where BMAD and Convoke honestly sit

- **Layer.** Both are *method-layer* assets: role definitions, workflows and artifact contracts, delivered as skills and markdown that run inside third-party harnesses (mainly Claude Code, with others supported by BMAD). Neither is a tool or a model. Their value therefore depends on the harnesses, and on the rate at which native harness features absorb method features. Thoughtworks explicitly advises re-checking whether frameworks are still needed as agents improve.
- **Category.** BMAD is an established but not leading member of a young category that Thoughtworks rates *Assess*. Thoughtworks singles it out as heavier and more rigid. Convoke is an early-stage extension of BMAD (65 stars, about 3.6k monthly npm downloads) and inherits BMAD's trademark constraints and release volatility. We found no published governance document for BMAD (see gap 17), so its decision rights and succession arrangements are **undocumented rather than known to be company-controlled** — an unknown to raise with the maintainers, not a finding.
- **Evidence status.** We found no independent evaluation of either product's effect on delivery outcomes. The broader category has none either ("absent benchmarks for complete processes", per the June 2026 taxonomy preprint). The whitepaper should not attribute productivity, quality or time-to-market gains to BMAD + Convoke. The rigorous evidence on AI productivity is contested even for the underlying tools.

### 3.2 Where the landscape is ahead, or where BMAD + Convoke are missing something

| Area | What the landscape shows | Gap or risk for BMAD + Convoke (interpretation) |
|---|---|---|
| Lifecycle breadth | AWS AI-DLC (open source, AWS-backed) already spans Ideation → Operation with approval gates after every stage; BMAD upstream added user-voice research | "Before and after the build" is no longer a unique claim. Differentiation must be *specific*: evidence-grounded discovery with real users and experiments, and stack-agnostic readiness. We did not audit AI-DLC's Ideation or Operation stages against either, so we do not claim they are absent there; note also that 5 of its 7 Ideation stages and all 7 Operation stages are marked CONDITIONAL, so end-to-end coverage is a capability rather than a mandatory path. (AI-DLC Operation is AWS-centric). Both differentiators are unproven. |
| Portability | Spec Kit and OpenSpec claim 30+ agents; Agent Skills is supported across major harnesses | By Convoke's own README, all 12 Convoke agents are classed "pipeline" (non-portable). For clients who want to run Convoke outside a full Convoke installation, or on harnesses other than the primary one, this is a material gap, not a footnote. |
| Outcome evidence | Rigorous RCTs and field studies exist for tools; none for method frameworks | No measurement of Convoke's effect on decisions, rework or defects. A credible ledger needs at least pilot metrics (for example DORA stability, review time, discovery-to-decision lead time) with a baseline. |
| Review load | Böckeler, Thoughtworks (instruction bloat) and Faros (review time) all flag artifact and review overload | BMAD + Convoke generate many markdown artifacts across many agents. Unless reviewed efficiently, this may *worsen* the review bottleneck the evidence identifies. |
| Discovery integrity | Synthetic users are contested; AI with real participants is better supported; homogenisation risk in AI ideation | Vortex's credibility depends on keeping track of where evidence came from (real users vs. model-generated) and on not letting agents stand in for customers. Whether it does this consistently was not assessed here. |
| Readiness accuracy | Agents solve roughly one in seven benchmark SRE incidents or fewer; Meta filters low-confidence root-cause output | Gyre's absence-detection approach fits "assist, don't act". Its precision and recall on real repositories are unmeasured; a false "ready" verdict is the costly error. |
| Governance depth | Regulators and standards require organisational controls, competence, logs and management systems; human oversight often rubber-stamps | The Covenant is an interaction-design standard for individual skills, not an organisational governance framework. It does not address automation bias. Its "one-keystroke default" could strengthen anchoring. Its audit is self-run. |
| Enforcement | Vendors separate enforceable settings (hooks, permissions, sandboxing) from advisory instructions | Rules expressed as agent markdown are advisory. Claims of "governance" should say which controls are enforced by tooling and which depend on model compliance. |
| Security | Tool poisoning, skill-registry manipulation and malicious public skills are documented | Distributing agent teams as installable skill packs is supply-chain exposure. Provenance attestations exist (a positive), but threat modelling of prompt injection through discovery inputs (reviews, transcripts, repositories) was not found in the sources reviewed. |
| Standards alignment | MCP, AGENTS.md and A2A now have neutral governance; Agent Skills does not | Betting on SKILL.md is reasonable given how widely it is adopted. The whitepaper should disclose that its governance is not neutral. |
| Cost | Token costs are rising; Gartner projects cost exceeding salary by 2028 | Multi-agent, artifact-heavy workflows consume tokens. No cost-per-outcome data exists for BMAD + Convoke; the one practitioner report (6 days, ~$200) is anecdotal. |
| Upstream dependency | BMAD shipped 19 stable 6.x releases in about six months, some with breaking changes | Convoke's maintenance burden and compatibility risk track BMAD's cadence. Clients adopting both take on two release streams. |

### 3.3 What appears defensible (still interpretation)

- **Aligned with where the evidence points.** DORA's finding that AI amplifies existing systems and punishes teams without user focus supports putting discovery discipline and readiness checks *around* AI-accelerated building. That is a direction the evidence supports, not proof that Convoke delivers it.
- **"Operator is the resolver" fits the oversight principles.** It lines up with Art. 14(4)(d)–(e) and NIST MANAGE 2.4, provided it is positioned as *one layer* of oversight. Organisations still need an AI management system, trained and empowered overseers, technical enforcement and logging.
- **Candour is itself a differentiator in a hype-heavy market.** The existing README already publishes portability limits, and the Covenant publishes its audit caveats. A published maturity ledger would follow the same practice.

---

## 4. Gaps: what we tried to verify and could not

1. **Stack Overflow 2026 Developer Survey results.** The survey opened on 23 June 2026. We found no published results. Several secondary sites label 2025 figures as "2026". Only the 2025 survey is cited.
2. **McKinsey State of AI 2025.** The primary page and PDF timed out twice. All figures are from secondary summaries.
3. **Gartner press releases** (agentic AI cancellations, June 2025; AI coding costs, June 2026) returned HTTP 403. Figures come from secondary coverage.
4. **ISO/IEC 42001.** iso.org returned 403. Publication date and scope rely on ANSI/IEC store pages and secondary summaries. Annex A controls were not reviewed.
5. **Council press release on the AI Omnibus** (7 May 2026) and the **EUR-Lex text of Regulation (EU) 2026/1744** were not retrieved. The regulation number, OJ date, marking grace period and AI-literacy wording come from law-firm summaries. The Commission's article pages still show pre-amendment text.
6. **Harmonised standards status** (prEN 18286 and the rest of the JTC 21 programme). Only trackers and secondary notes were found; no official CEN-CENELEC status page for the vote outcome.
7. **Agent Skills governance.** One secondary source claims stewardship moved to the AAIF. Neither the Agent Skills site, its repository nor the AAIF project list confirms it. Treated as unconfirmed.
8. **OWASP Agentic Top 10 item list.** The OWASP page did not render the list. Item names come from a secondary summary.
9. **Kiro/AWS outage.** The *Financial Times* original was not accessible. Only coverage and Amazon's rebuttal were read.
10. **Ashokkumar et al. (*Nature* 2026) correlation coefficients.** The Nature page redirected to authentication. r = 0.85/0.90 comes from secondary summaries; the publisher summary confirms only "strong" correlation and overestimated effect sizes.
11. **Journal status** of Geiecke and Jaravel (AI-led interviews), Cui et al. (*Management Science*), Dell'Acqua et al. (a claimed 2026 journal publication) and Otis et al. (exact figures differ between working-paper versions) could not be confirmed from primary pages.
12. **Independent evaluation of BMAD Method.** The only comparative test found (6 days, ~$200) is a secondary report of one practitioner's run. The original could not be located. No peer-reviewed or replicated evaluation was found.
13. **Independent evaluation of Convoke.** None was found.
14. **Rigorous 2026 benchmarks for AI in SRE and incident response.** ITBench and OpenRCA used 2024–2025 models. Newer vendor claims (for example 94% accuracy figures) are unverified marketing and were excluded.
15. **AI-assisted jobs-to-be-done and AI-run experimentation.** No rigorous outcome study was found. The section relies on adjacent evidence (ideation, entrepreneurship, synthetic respondents).
16. **DORA 2026 annual State of AI-assisted Software Development report.** No 2026 annual edition was found as of 15 September 2026, only the ROI framework (last updated 22 April 2026). The ROI report's full text was not read; its content comes from InfoQ.
17. **BMAD formal governance model.** No governance document (decision rights, maintainers list, succession) was found beyond CONTRIBUTING.md and TRADEMARK.md. GitHub's license detector reports "NOASSERTION" even though the project states it is MIT-licensed; the reason was not investigated.
18. **GDPR and data-protection implications** of processing research interviews and product data through third-party model providers. Not researched; needs specialist legal review before the client document makes any claim.
19. **Figures repeatedly seen in secondary sources but not verified, and deliberately excluded:**
    - "73% of enterprises' AI costs exceeded projections"
    - "Uber exhausted its 2026 AI budget in four months"
    - "8% of researchers use synthetic users regularly"
    - various AI-SRE accuracy claims
