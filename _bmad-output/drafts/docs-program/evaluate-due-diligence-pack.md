# Due-diligence pack — BMAD Method + Convoke

*Answers to the questions an evaluating organisation's security, legal and architecture reviewers ask.
Every answer here was established on 17 September 2026 by inspecting the published package
`convoke-agents@4.0.3` — 469 files, extracted from the npm tarball — or by running it, with one exception:
the answers drawn from the maturity ledger's §2.18 and §2.19 were established on 20 September, and those
sections name their own basis. Where something was not tested, this pack says so rather than inferring.*

---

## 1. Security and data handling

**Does it run as a service, or send data anywhere?**
No. Convoke installs instruction files, workflow definitions and artifact templates into your project
directory, and runs inside the AI coding assistant you already use. It starts no service, opens no network
listener, and stores nothing outside your repository.

**How was that established?** The shipped code was searched for every network-capable construct —
`require('http')`, `require('https')`, `require('net')`, `require('dgram')`, `require('tls')`, `fetch(`,
`axios`, `node-fetch` — across all 469 files of the published tarball. **There are none.** The only network
access in the lifecycle is `npm` fetching the package itself, which your own registry policy governs — note
that one migration step re-invokes the package through `npx`, so that fetch can also happen during an
update, not only at install.

**What does it execute?**
Five external commands in the product's own code paths, plus a shell in one contributor script. One of the
five deserves your attention:

- **`git`** — by far the most used: 17 call sites pass `git` as the command to `execSync`/`execFileSync` across `scripts/` and `src/`; counting every literal `git` invocation across the shipped tree, including `_bmad/`, gives 33. Derive it yourself rather than taking a single number: the two counts answer different questions.
  Not only read commands: the artifact tooling runs `git mv`, `git add` and `git commit`, and **rolls back a
  failed rename with `git reset --hard HEAD`** (`scripts/lib/artifact-utils.js`, four sites). That command
  discards *every* uncommitted change in the working tree, not only the ones this tool made. It is reachable
  through the artifact-migration tooling, not through installing or updating.
- **`npx`**, **`node`** (via `process.execPath`), **`python3`** (a legacy configuration fallback), and
  **`claude`** (a contributor-only recording script).
- One script, `scripts/convoke-check.js`, executes commands from its own hardcoded table (`npm run lint`,
  `npm test` and similar) through a shell. It is contributor tooling and is not part of installing or
  running the product.

**What are its dependencies?**
Four direct — `chalk`, `fs-extra`, `js-yaml`, `yaml` — which resolve to 13 packages in the installed tree.

**Is the build attested?**
Releases from **`4.0.1-rc.0` onward** carry signed build provenance (SLSA) verifiable against the public
Sigstore transparency log. That is four of the twenty-seven published versions: the attested pipeline first
ran for that release candidate, and everything before it has no attestation. Check any version yourself at
`registry.npmjs.org/-/npm/v1/attestations/convoke-agents@<version>`.

**Our discovery workflows interview real people. What about their data?**
This is the sharpest gap in what the product does *for you*, and we would rather name it than be asked. The
`user-interview` workflow instructs an operator to recruit participants, review screening-survey answers,
optionally record sessions, and write participant tables with direct quotes into the repository — where they
also pass through your AI assistant. The workflow does tell the interviewer to set expectations about
recording and to ask permission to take notes or record. What it contains **no guidance on at all is data
minimisation, retention, lawful basis or participant withdrawal** — the word "consent" does not appear in
it, and nothing tells you how long to keep a participant table or how to remove someone from it. Those obligations fall entirely on the adopting
organisation, under its own data-protection regime, and we do not currently help you meet them. Treat
research artifacts produced by these workflows as personal data and apply your existing controls to the
repository and to the assistant.

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
| GitHub Copilot, Cursor | Export tool produces instruction files for ecosystem skills. **Convoke's own twelve agents export with a framework-only warning banner — but the file beneath the banner is the agent's full persona** (role, identity, communication style, principles, output contract), plus Copilot and Cursor adapter files. It is lossy rather than empty: a developer could paste it into Cursor and get partial, unsupported behaviour. On a Convoke-only install, `convoke-export --all` exports exactly **one** skill, because most manifest rows do not install |
| MCP (Model Context Protocol) | Not implemented |
| AGENTS.md | Not implemented — Convoke emits no `AGENTS.md`. Note that the host does support it: Claude Code reads a repository's `AGENTS.md` as project instructions, on its own or alongside `CLAUDE.md` ([source](https://code.claude.com/docs/en/memory)). The gap is Convoke's, not the platform's |
| A2A (Agent2Agent) | Not implemented |
| BMAD Method | Not required. Convoke extends it where it is installed, and installs standalone where it is not |
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
**Not the agents themselves.** Edits to an agent file, a workflow file or a hand-off contract template are
overwritten by the next install — silently, with no prompt and no backup. That includes
`contracts/hc1-empathy-artifacts.md`, and the hand-off contracts are the part of the method this pack calls
load-bearing. Re-running an installer also overwrites the Vortex user guides with no backup, though
`convoke-update` does keep a `.bak` of those.

What *does* survive: the discovery and readiness team configuration files, which are merged rather than
replaced, and which since 4.0.3 an install refuses to overwrite if it cannot parse them. The other four
module configuration files are rewritten from the template on every install. The supported extension points are `_bmad/custom/`
overrides — which reach the **BMAD** agents you hand off to, not Convoke's own, none of which ship a
`customize.toml` — and your own prefixed skills, which are left untouched. To add rules on top of a Convoke
agent, wrap it in a skill of your own: you can layer onto it, but not rewrite it. A separate document covers
this in detail.

**What does it cost to run?**
Nothing in licence fees. The cost is your AI assistant's token usage, which depends on the workflows you
run and the model you run them on. We publish no cost model, because the one practitioner data point we
found was a single run on an older version and is not a basis for a projection.

**How do we verify a release is genuine?**
`npm audit signatures` in a project where the package is a recorded dependency (`npm install convoke-agents`).
It reports *"found no installed dependencies to audit"* if you used the `npx -p` form, which records nothing.
Also the provenance attestation at
`registry.npmjs.org/-/npm/v1/attestations/convoke-agents@<version>`, which names the GitHub workflow and
commit that built it and resolves in the public transparency log.

**What is the biggest risk in adopting this?**
Two, honestly. The maintenance relationship — one maintainer, no support contract. And the absence of
outcome evidence: no independent study shows this method, or any competing framework, improves delivery
outcomes.

## 5. Ledger evidence

The maturity ledger classifies eighteen capabilities — four *Shipped*, eight *Works with limits*, six
*Mapped, not built* — with an evidence appendix giving, per row, the commands that were run and their
output. It is a separate document, re-derived against 4.0.3. Reviewers who want to reproduce any row can
run the commands it records.

---

*Open item: this pack has not been reviewed by counsel. The licence and support sections state facts about
published licence terms; they are not legal advice, and an adopting organisation should have its own
counsel read the MIT terms and the upstream trademark notice.*
