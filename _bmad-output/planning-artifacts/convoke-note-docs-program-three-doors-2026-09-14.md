---
initiative: convoke
artifact_type: note
created: '2026-09-14'
schema_version: 1
status: active
---

# Docs program: three readers, three doors

## Readers
| Door | Reader | What they asked for |
|---|---|---|
| **Evaluate** | Evaluating organisations | Sound, not-too-technical grounding: state of the art, theory, and the stakes of adoption, scaling, governance, portability, interoperability. **Most important.** |
| **Use** | Operators | Tips, best practices, workflow descriptions for BMAD + Convoke, in a business voice. GitHub's interface and tone put them off. |
| **Build** | Practitioners | Docs reliable enough to contribute instead of forking. |

## Decisions (Amalik, 2026-09-14)
1. The evaluation document puts the **maturity ledger on page 2**, right after the vision.
2. **Amalik curates, on GitHub.** Contribution-path problems get solved when they actually happen.
3. **Deadline:** upcoming leadership review, **2026-09-22**. Only the Evaluate door (plus one Build page) ships for it.
4. **Two evaluator interviews** before the framing locks (see `convoke-note-evaluator-interview-guide-2026-09-14.md`).

## Principles
- One rendered doc site, three doors, Diátaxis inside each door. The site tooling gets chosen in Wave 2, after the leadership review.
- **BMAD upstream and WDS are linked, not absorbed.** Only `_bmad/bme/` is Convoke.
- **Every claim is sourced. Every command is executed before it's published.** No version, count or figure is recalled from memory.
- **An independent review runs before anything reaches an evaluator.** Self-review finds typos, not judgement errors.

## Waves
| Wave | Deliverable | Status |
|---|---|---|
| 1 | State-of-the-art research (sourced) | running: `convoke-research-state-of-the-art-ai-delivery-2026-09-14.md` |
| 1 | Maturity ledger (derived from the repo and the published package) | running: `convoke-note-maturity-ledger-2026-09-14.md` |
| 1 | Customize without forking (commands executed in a scratch install) | running: `_bmad-output/drafts/docs-program/customize-without-forking.md` |
| 1 | Executive brief (2 pp) | after the interviews |
| 1 | Whitepaper | after the interviews |
| 1 | Due-diligence pack | as far as it gets by the leadership review |
| 2 | **Use**: getting started ×2 (BMAD-addon / standalone), end-to-end playbooks, agent cards (11 existing guides + the undocumented modules), tips & best practices, glossary | after 2026-09-22 |
| 3 | **Build**: architecture & module map, contribution path, release & versioning policy, CLI/config/contracts reference, testing (rewritten) | after Wave 2 |

## Evaluate door: skeleton

### Executive brief (2 pages)
1. What BMAD + Convoke are, in one paragraph
2. Why now (from the research)
3. What changes for a delivery organisation
4. What's proven and what isn't (ledger digest)
5. What adoption looks like (pilot shape)
6. The decision being asked for

### Whitepaper
- **p1: The stakes.** AI-assisted delivery is arriving either way; the question is whether it's governed. *(page one is locked only after the interviews)*
- **p2: Maturity ledger.** Shipped / works with limits / mapped, not built, with ownership (Convoke vs BMAD ecosystem).
1. The problem: the two riskiest ends of the lifecycle, deciding what to build and knowing it's fit to run
2. How it works: Discovery (Vortex) · Design (WDS, BMAD ecosystem) · Build (BMM/TEA, BMAD) · Readiness (Gyre), plus the handoff contracts
3. Theoretical grounding, stream by stream
4. State of the art and positioning
5. The stakes: adoption · scaling · governance (Covenant, artifact governance, regulatory mapping) · portability · interoperability · security & data
6. Roadmap and release management
- Appendices: glossary, references

### Due-diligence pack
FAQ · security & data handling · interoperability matrix · licence & support model · ledger evidence

## Timeline to the leadership review
| Day | What | Who |
|---|---|---|
| Mon 14 | Research, ledger, customize page start. Interview guide delivered. | agents / Amalik |
| Tue 15 – Thu 17 | Two evaluator interviews | **Amalik** |
| Wed 16 | Review research and ledger; draft page-one options; pick format (PDF vs web page) | Amalik + session |
| Thu 17 | Interview input folded in; **framing locked** | session |
| Fri 18 | Full draft: brief + whitepaper | session |
| Sat 19 – Sun 20 | Buffer / Amalik reads | Amalik |
| Mon 21 | Independent review (claim check + adversarial, fresh reviewers) → fixes → final | session |
| **Tue 22** | **Leadership review** | Amalik |

## Open
- Who attends the leadership review: the evaluating organisations' leadership, or Amalik's own? Only page one's framing depends on the answer.

## Found during Wave 1: risks for the leadership review
Evidence: `convoke-note-maturity-ledger-2026-09-14.md` (appendix) and `_bmad-output/drafts/docs-program/customize-without-forking.evidence.md` (D1–D9).
- **Agent startup on a fresh install: CONFIRMED 2026-09-15.** Setup: a clean `npm install convoke-agents@4.0.2` plus `convoke-install` in the scratchpad, each agent started headless with `claude -p "/<skill>"`.
  - **Isla (Vortex) and Scout (Gyre) stop with "Configuration Error: Missing required field(s)"**, because the install writes no `user_name` or `communication_language`.
  - **Emma recovers:** she greets the user, asks for their name and language, and shows her menu.
  - Only 3 of 11 agents were started. By identical startup text, Liam, Noah and Max should behave like Isla, the other three Gyre agents like Scout, and Mila and Wade like Emma. That is inferred, not run.
  - Scout's error message suggests `output_folder: vortex-artifacts` for Gyre, which is defect D1 leaking into the error text.
  - Emma's missing `bmad-init` does not stop her.
  - → **Hotfix (4.0.3) or disclose: Amalik's call.**
- **`_gyre/config.yaml` is seeded with Vortex values** (D1), and its first update doubles its agent and workflow lists, which then stay doubled (D2).
- **Overclaims in shipped docs contradict page 2:** README ×2, the lifecycle vision, the 4.0.0 changelog.
- **About 13 defects have no backlog row** (4 from the ledger, 9 from the customize evidence). The backlog edits that blocked filing are now committed; filing waits only on the 4.0.3 decision.
- **Upstream drift:** BMAD 6.12.0 removed `bmad-agent-tech-writer` and `bmad-check-implementation-readiness`. Existing overrides for them go dead silently, and the Use door must not send operators to them.

## Research implications for page one (to discuss Wed 16)
Source: `convoke-research-state-of-the-art-ai-delivery-2026-09-14.md`. Its claims have not yet passed the Monday claim check.
- **No independent outcome evidence exists for BMAD, Convoke, or any structured AI delivery method.** The whitepaper claims no productivity or quality outcomes.
- **"Lifecycle coverage on both sides of the build" does not set us apart:** AWS AI-DLC covers Ideation to Operation, with human approval gates. The remaining differences to test are how deep discovery goes (real users and experiments, which AI-DLC's ideation stages lack), being independent of any one host or cloud, and the candor of the ledger.
- **DORA 2024 and 2025:** AI goes with less stable delivery and amplifies whatever the organisation already is. This supports framing the pitch around governance and discipline.
- **Governance:** "operator decides" is necessary but not sufficient for EU AI Act Art. 14 and 26, ISO 42001, and automation bias. Claim that the method helps meet these obligations, never that it makes you compliant. GDPR needs a legal review before the document says anything about it.
- **Adoption stake:** BMAD is controlled by one company, BMad Code LLC, and ships breaking changes often (19 releases in 6.x). The whitepaper needs a version-cadence policy (N-1).
- **Portability:** Convoke's own agents are not portable. Say it in the ledger; don't let the interoperability section imply otherwise.
