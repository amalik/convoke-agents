# Due-diligence pack — BMAD Method + Convoke

*Answers to the questions an evaluating organisation's security, legal and architecture reviewers ask.
Every answer here was established on 17 September 2026 by inspecting the published package
`convoke-agents@4.0.3` — 469 files, extracted from the npm tarball — or by running it. Where something was
not tested, this pack says so rather than inferring.*

---

## 1. Security and data handling

**Does it run as a service, or send data anywhere?**
No. Convoke installs instruction files, workflow definitions and artifact templates into your project
directory, and runs inside the AI coding assistant you already use. It starts no service, opens no network
listener, and stores nothing outside your repository.

**How was that established?** The shipped code was searched for every network-capable construct —
`require('http')`, `require('https')`, `require('net')`, `require('dgram')`, `require('tls')`, `fetch(`,
`axios`, `node-fetch` — across all 469 files of the published tarball. **There are none.** The only network
access in the lifecycle is `npm` fetching the package itself, which your own registry policy governs.

**What does it execute?**
Shipped code shells out to exactly two commands: **`git`** (16 call sites — status, log, rev-parse, used by
artifact tooling and the portfolio report) and **`npx`** (one call site). It executes nothing else.

**What are its dependencies?**
Four, all widely used: `chalk`, `fs-extra`, `js-yaml`, `yaml`. Every release carries signed build
provenance (SLSA) verifiable against the public Sigstore transparency log, and `npm audit signatures`
verifies it in your own project.

**Where does my data go?**
Wherever your AI coding assistant already sends it. Convoke adds no data path of its own. The prompts and
artifacts flow through the assistant your organisation has already assessed — so the data-handling
question is one about that assistant, not about this product.

**Ecosystem risks that are not this product's, but are yours to manage.**
Two, stated because they affect any agent-skills tooling:
- Agent instruction files are *context, not enforced configuration*. If you need a hard limit on what an
  agent may do, it must be implemented as a hook or managed setting, not as an instruction.
- Independent testing of published skill and MCP ecosystems has found a substantial proportion of
  extensions carrying security issues. Any organisation installing agent extensions needs a review path for
  what it installs. That includes this one.

**Not tested:** Windows. Continuous integration runs on Linux only, and the trials behind this pack were on
macOS.

## 2. Licence and support model

| Question | Answer |
|---|---|
| Licence | MIT, declared in `package.json` and in the shipped `LICENSE` file |
| Upstream licence | BMAD Method is MIT, with a trademark notice appended — the name is protected, the code is not |
| Commercial support | **None offered.** There is no support contract, no SLA, and no paid tier |
| Maintainership | A single maintainer, publishing on GitHub |
| Issue handling | Public GitHub issues, best-effort, no response-time commitment |
| Roadmap commitment | None. The roadmap in the whitepaper is intent, not obligation |

This is the honest shape of a young open-source project, and it is a real risk to weigh: an organisation
adopting it takes on the maintenance relationship itself. The mitigations available to you are the ones
available with any MIT-licensed dependency — fork it, vendor it, or contribute to it.

## 3. Interoperability

| Interface | Status |
|---|---|
| Claude Code | Supported. This is the environment Convoke installs for |
| GitHub Copilot, Cursor | Export tool produces instruction files for ecosystem skills. **Convoke's own twelve agents export only as a notice that a full install is required** |
| MCP (Model Context Protocol) | Not implemented |
| AGENTS.md | Not implemented. Claude Code reads `CLAUDE.md`, not `AGENTS.md` |
| A2A (Agent2Agent) | Not implemented |
| BMAD Method | Required host framework. Convoke also installs standalone, without it |
| Plugin marketplace | Not listed. A submission was declined on packaging structure and has not been resubmitted |

**The honest summary:** Convoke is a Claude Code product today. The wider ecosystem is converging on shared
formats, and Convoke does not yet implement any of them. If multi-assistant portability is a requirement
rather than a preference, this product does not meet it now.

## 4. Frequently asked questions

**Is this a fork of BMAD Method?**
No. It is an extension installed alongside it, in its own namespace (`_bmad/bme/`). BMAD's own modules are
unmodified.

**What happens when BMAD publishes a breaking change?**
You decide when to take it. Nineteen stable BMAD versions were published between February and September
2026, several with breaking changes. Convoke's proposed policy is to track one minor version behind
upstream. An adopting organisation should set its own policy deliberately rather than inherit the cadence.

**Can we customise the agents without forking?**
Yes, for the two protected configuration files — the discovery and readiness team configs — which are
merged rather than replaced on update, and which since 4.0.3 an install will refuse to overwrite if it
cannot parse them. **Four other module configuration files are rewritten from the template on every
install**, so customisation in those does not persist. A separate document covers customisation in detail.

**What does it cost to run?**
Nothing in licence fees. The cost is your AI assistant's token usage, which depends on the workflows you
run and the model you run them on. We publish no cost model, because the one practitioner data point we
found was a single run on an older version and is not a basis for a projection.

**How do we verify a release is genuine?**
`npm audit signatures` in your project, and the provenance attestation at
`registry.npmjs.org/-/npm/v1/attestations/convoke-agents@<version>`, which names the GitHub workflow and
commit that built it and resolves in the public transparency log.

**What is the biggest risk in adopting this?**
Two, honestly. The maintenance relationship — one maintainer, no support contract. And the absence of
outcome evidence: no independent study shows this method, or any competing framework, improves delivery
outcomes.

## 5. Ledger evidence

The maturity ledger classifies sixteen capabilities — four *Shipped*, seven *Works with limits*, five
*Mapped, not built* — with an evidence appendix giving, per row, the commands that were run and their
output. It is a separate document, re-derived against 4.0.3. Reviewers who want to reproduce any row can
run the commands it records.

---

*Open item: this pack has not been reviewed by counsel. The licence and support sections state facts about
published licence terms; they are not legal advice, and an adopting organisation should have its own
counsel read the MIT terms and the upstream trademark notice.*
