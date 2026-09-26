---
title: 'Reconciliation: Channel Integrity PRD vs the client-facing maturity ledger'
initiative: convoke
artifact_type: report
qualifier: reconcile-ledger
status: draft
created: '2026-09-26'
schema_version: 1
---

# Reconciliation: Channel Integrity PRD vs the client-facing maturity ledger

**Inputs.**
- `_bmad-output/planning-artifacts/convoke-note-maturity-ledger-2026-09-14.md` — client-facing, circulated to a leadership review on 2026-09-22. Bases: 4.0.3 tarball at 17 Sept, plus named exceptions at 20, 21, 23 and 25 Sept.
- `_bmad-output/planning-artifacts/prds/prd-BMAD-Enhanced-2026-09-26/prd.md` and `addendum.md` — draft, 26 Sept.

**Scope of this document.** Read-only reconciliation. Nothing here edits the ledger or the PRD.

**Verification.** Every claim marked *(verified)* below was re-derived by execution against the working
tree on 2026-09-26. Commands are given inline so a reader can re-run them.

**Headline count: 31 ledger statements are made FALSE, STALE or MISLEADING by the PRD's findings.**
The PRD named 2 (the distribution row and uncertain-row 1). The other 29 are below.

Two of the PRD's own claims are contradicted by the ledger, and the ledger is right in both cases.

---

## Part 1 — Ledger statements the PRD's findings make FALSE, STALE or MISLEADING

### Group A — Distribution and supply chain (the row the PRD already names, and its neighbours)

**1. §1 supply-chain row — FALSE.**
> "**npm is the only supported channel.**"

Contradicted by the PRD's Trigger: *"Convoke already publishes to a public channel, deliberately, and it
publishes 7 of its 11 agents and none of its workflows or contracts."* The mechanism is Convoke's own
shipped file. `.claude-plugin/marketplace.json` declares seven agent directories, and per the addendum's
quote of the skills CLI README, *"Skill paths declared in a manifest are searched at their declared depth
and are not subject to the bounded depth-3 catalog walk."* One Convoke agent (`bmad-bme-agent-wade`)
was publicly listed with one install.

*(verified)* `node -e "console.log(require('./package.json').files.join('\n'))"` lists `.claude-plugin/`,
so the manifest ships in the npm tarball; `cat .claude-plugin/marketplace.json` shows exactly seven
`./_bmad/bme/_vortex/agents/*` paths. The word "supported" is the only thing holding the sentence up, and
for a security reader it is the wrong axis: what matters is that an undisclosed egress exists, not whether
the maintainer endorses it.

**2. §2.19 — FALSE, and self-indicting.**
> "**The distribution limit is real and unsolved.** npm is the only supported channel. There is no binary
> distribution, no documented internal-registry or mirror path, and no air-gapped procedure. An
> organisation whose policy prevents pulling from the public registry at deployment scale has no supported
> route, and **this ledger should not imply otherwise.**"

The second sentence is false in the same way as (1). The rest of the paragraph survives — and the PRD does
nothing to solve it, which is Part 3 item G1.

**3. §2.19 opening — STALE in its premise.**
> "The distribution limit below is a property of the channel, not of any one version."

Correct in form, wrong in the singular. There are two channels with opposite properties. Addendum §1:
*"Unlike skills.sh, marketplaces have a real dependency system"*; *"No dependency mechanism at all"*;
*"**No self-serve retraction**: deleted skills remain listed … delisting is done by hand by Vercel staff."*
The PRD's own words: *"**The channels are asymmetric on exactly the axis that matters to Convoke.**"*

**4. §1 supply-chain row — MISLEADING as a complete statement of what Convoke publishes.**
> "Convoke publishes one npm package with **four direct runtime dependencies** — `chalk`, `fs-extra`,
> `js-yaml`, `yaml`."

The dependency facts hold (§2.19 re-checked them against the tarball and this reconciliation does not
dispute them). "Publishes one npm package" does not. Convoke also publishes seven skill *paths* into a
public skills registry, from a file that `files[]` ships.

**5. §1 supply-chain row — MISLEADING, and in the direction that understates risk.**
> "an organisation that cannot pull from the public registry at scale has no supported route to Convoke,
> and we do not currently solve that."

For a policy-constrained organisation, "no supported route" is the reassuring reading. The PRD's finding
is worse: an *unsupported* route is live, has no dependency resolution, and (defect 1) *"A Convoke skill
installed alone fails without naming what is missing."* A security function reading this row will conclude
Convoke cannot arrive at all, when in fact it can arrive incompletely and silently.

**6. §1 supply-chain row — MISLEADING BY SCOPE.**
> "every release carries signed build provenance that verifies against the public transparency log."

True of the npm artifact (§2.12 proves it: Rekor logIndex 2877236851). It is the row's strongest
assurance and it does not transfer. A skill obtained through the skills channel carries no SLSA
attestation, no registry signature and no `npm audit signatures` surface — and the PRD adds no requirement
that it should (Part 3, G2). Stated without a channel qualifier in a supply-chain row, it reads as a
property of the product.

**7. §1 supply-chain row — MISLEADING BY SCOPE, same reason.**
> "`npm audit` over the production tree reports **0 vulnerabilities at any severity across 14 packages**"

True and reproducible. There is no production tree, no lockfile and no audit surface on the second channel.

**8. §1 supply-chain row and §2.19 — now UNDERCOUNTED.**
> "BMAD is then a **second supply chain that we neither control nor audit**"
> "adopting Convoke means adopting **two** supply chains, only one of which is ours"

There are three. The skills registry is a third party that hosts the artifact, renders the storefront,
surfaces third-party audit verdicts, and controls delisting — addendum §1: *"delisting is done by hand by
Vercel staff."* The PRD's FR24 still says two: *"(Two supply chains, only one of them Convoke's.)"*
This is both a ledger error and a PRD gap (Part 3, G4).

**9. §1 plugin-marketplace row — FALSE.**
> "The listing metadata is included, but **Convoke is not listed.**"

Convoke is listed. The PRD: *"A `skills.sh` page listed one Convoke agent — `bmad-bme-agent-wade`, one
install."* And the cause is the clause immediately before the false one: the included metadata *is* the
listing mechanism. The ledger treats `.claude-plugin/marketplace.json` as inert metadata waiting for a
submission; the PRD shows it is an active publication surface. *"The listing did not create the exposure.
It rendered it."*

**10. §1 plugin-marketplace row — MISLEADING as advice to a reader.**
> "Install through npm instead."

An instruction to an evaluating organisation that a live public channel already contradicts. Anyone who
runs `npx skills add` against Convoke's repository gets a Convoke agent, by the maintainer's own manifest.

**11. §2.13 verdict — FALSE.**
> "**Why Mapped, not built:** the metadata ships, but the distribution channel does not exist for Convoke."

A distribution channel exists and has a non-zero install count. What does not exist is the *BMAD*
marketplace listing. The verdict conflates the two and lands on the wrong conclusion.

### Group B — Uncertain-row 1 and the reference-resolution class

**12. §3 uncertain row 1 — STALE framing (the PRD names this row; here is what specifically breaks).**
> "*Unverified:* whether Emma, Wade and Mila activate correctly in Claude Code anyway, since the model may
> find `_bmad/bme/_vortex/config.yaml` on its own."

The ledger frames config discovery as a probabilistic property of model behaviour — §2.1: *"Observed
reading it once in four runs."* The PRD supplies a deterministic structural cause for a *wider* class.
Addendum §1, quoting the plugin loading reference: *"Files outside the plugin directory aren't copied, so
when a script inside a copied plugin reads a path above the plugin root, such as `../shared`, it doesn't
find them."* And: *"Under the v6.3 convention bare paths resolve from skill root; under a plugin install
the skill root is the cache directory. **Neither resolution reaches the workflow.**"* On a channel install
this is not uncertain — it is certain to fail, and it fails for workflow and capability references, not
only for config.

**13. §3 uncertain row 1 — the remediation is scoped to the wrong path.**
> "If they do not, the Vortex note should add that three agents fail to start in standalone installs."

"Standalone installs" means npm-without-BMAD throughout this ledger. The failure mode the PRD establishes
is a *channel* install, which the ledger's remediation instruction does not reach. PRD FR11 is the correct
scope: *"Under an install where the skill root is not inside the operator's project — a plugin cache, a
global skills directory — a Convoke skill either resolves its references correctly or fails per FR6–FR9."*

**14. §2.1 — MISLEADING (verified false as reassurance).**
> "Every `./references/*.md` target named in the 3 converted agents exists."

True and irrelevant to the question a reader takes from it. The ledger checked that the reference *files*
exist. It did not look inside them. PRD defect 2: *"Bare paths in
`_bmad/bme/_vortex/agents/*/references/*.md` — Confirmed."*

*(verified)*
```
$ grep -rhoE '(^|[^{/a-zA-Z._-])_bmad/bme/_[a-z-]+/[A-Za-z0-9_./-]+' \
    _bmad/bme/_vortex/agents/*/references/ | wc -l
22
```
Those 12 reference files carry 22 bare `_bmad/bme/_vortex/workflows/...` paths with no `{project-root}`
prefix — e.g. `_bmad/bme/_vortex/workflows/mvp/workflow.md`, `.../lean-persona/validate.md`. Under a
plugin-cache or global-skills install none of them resolves.

**15. §2.1 path-resolution audit — MISLEADING as a completeness claim, by construction.**
> "Thirteen unique paths dangle, across 12 files, split evenly between
> `_vortex/workflows/_deprecated/wireframe/` and `_vortex/workflows/_deprecated/empathy-map/`"
> derived from: `grep -rhoE "\{project-root\}/_bmad/bme/_[a-z-]*/[^\"'\`) ]*" _bmad/bme .claude/skills`

The pattern requires a literal `{project-root}/` prefix **and** a `_bmad/bme/` module path. It is
therefore structurally blind to both of the PRD's resolution defects:

- the 22 **bare** paths of item 14 — they have no `{project-root}` prefix, so the regex cannot see them;
- references to upstream modules outside `_bmad/bme/` — *(verified)*
  `grep -rhoE '_bmad/(core|bmm|bmb|cis|tea|wds)/[A-Za-z0-9_./-]+' _bmad/bme | sort | uniq -c` returns
  `_bmad/core/workflows/party-mode/workflow.md` (9), `_bmad/core/tasks/workflow.xml` (9),
  `_bmad/core/workflows/bmad-party-mode/workflow.md` (4),
  `_bmad/core/workflows/advanced-elicitation/workflow.md` (4), `_bmad/bmm/config.yaml` (4). None of these
  is under `files[]`, so none exists in an installed standalone project.

The audit measured **existence in the repository**, and reported the result as resolution. Existence is
not resolvability, and it never was for the two classes that matter. "Thirteen" is a floor of a
badly-chosen pattern, not a count of the problem.

**16. §1 Vortex row — UNDERSTATED (singular where the class is plural).**
> "Three of the seven have no dependable way to read your project's configuration: **the skill they call
> to load it no longer exists**"

PRD defect 3: *"Four dead upstream dependencies — Confirmed."* The client-facing row names one
(`bmad-init`) and presents it as the whole of the missing-upstream problem. The derivable set is the four
`_bmad/core/` paths in item 15 — two of which are the *same* workflow under an old and a new name
(`party-mode` and `bmad-party-mode`), i.e. exactly the "removed or renamed" class PRD FR23 defines — plus
`bmad-init`, which makes five if it is counted. (The PRD asserts "four" without enumerating; see Part 2,
P9.)

**17. §2.1 — the floor held, but its reach was narrower than stated.**
> "**Observed defects I found no backlog row for.** The keyword searches were `bmad-init`, `customize`,
> `HELP_STEP`; **treat this list as a floor.**"

The hedge is honest and it earns its keep. Recording it here because three defect classes the PRD confirms
were unreachable by those three keywords and by the §2.1 grep: bare-path resolution, upstream-name
shadowing, and upstream components beyond `bmad-init`. A reader who took "floor" as "nearly complete"
was misled by the structure of the search, not by the wording.

### Group C — Contracts, workflows and the addressable surface

**18. §1 hand-off-contracts row — INCOMPLETE, and it is the ledger's only contracts row.**
> "Five hand-off templates and five routing rules."

PRD measured position: *"Handoff contracts | 14 (HC1–HC10, GC1–GC4)"*.

*(verified)* `ls _bmad/bme/_gyre/contracts` → `gc1-stack-profile.md`, `gc2-capabilities-manifest.md`,
`gc3-findings-report.md`, `gc4-feedback-loop.md`. They are referenced from Gyre's README, its
compass-routing-reference and 10+ workflow step files.

The ledger's contract inventory is 10; the product's is 14. The Gyre row never mentions contracts at all,
and §2.3's `ls` output lists a `contracts` directory without opening it. **The PRD is right and the ledger
has a four-artifact hole in a row titled "Vortex hand-off contracts" that a reader will take as the
product's contract story.**

**19. §2.2 verdict — MISLEADING under the ledger's own materiality rule.**
> "**Why Shipped:** the shipped docs describe exactly what ships: five schemas and five guidance-level
> routing rules, with the interrupt pattern openly deferred."

The reasoning is sound on its own terms and the row is scrupulous about HC6–HC10 being guidance rather
than files. What the PRD adds is that none of the ten is *reachable*: SM4 records *"Contracts addressable
| 0 of 14"*, and FR15 states *"HC6–HC10 exist only as mentions across a README, a routing reference and
seven workflow step files."* A client-facing **Shipped** on the row whose subject is "what each discovery
stage passes to the next" is generous once the artifacts turn out to be un-addressable and four of them
are uncounted.

**20. §2.2 — MISLEADING, same existence-vs-resolution error as item 15.**
> "`compass-routing-reference.md` and the Vortex README ship in the package but are not copied into the
> project. The routing rows the agents use live in the installed step files, **so nothing dangles.**"

"Nothing dangles" is a statement about file existence inside a project install. It is precisely the
HC6–HC10 addressability gap FR15 names, restated as a clean bill of health. A routing rule that exists
only as 1–18 textual mentions inside step files is not an artifact that can travel through any channel.

**21. §1 Gyre row and §2.3 — UNDERSTATED.**
> "the team cannot yet be packaged for a plugin marketplace"
> §2.3: "The row's structural facts (flat agent files, no `module.yaml`/`module-help.csv`) are still true
> and still block marketplace packaging."

PRD defect 4: *"Gyre structurally absent from every channel — Confirmed."* The ledger locates the blocker
in two missing metadata files. The PRD locates it one level deeper: *"Gyre's four agents hold no
`SKILL.md`; their skill directories are generated by `convoke-install-gyre` at install time."*

*(verified)* `find _bmad/bme/_gyre -name 'SKILL.md'` returns nothing, and `marketplace.json` declares zero
Gyre paths. Adding `module.yaml` and `module-help.csv` would not make Gyre addressable through either
channel, because there is nothing for a channel to address. The ledger's framing implies a two-file fix.

### Group D — Hosts, reach and self-verification

**22. §2.10 "Hosts" — MISLEADING. Non-support is not non-exposure.**
> "Whole-word searches for Cline, Windsurf, Codex, Gemini CLI and ChatGPT found no host claim, so **these
> tools are neither claimed nor supported.**"

The conclusion is drawn from the absence of a *claim*. The shipped manifest offers seven agents through a
CLI whose container list, per the addendum, *"includes the repo root, `skills/`, `skills/.curated/`,
`.claude/skills/`, `.agents/skills/` and roughly twenty more agent-specific paths"* — i.e. agent-specific
install locations for hosts Convoke does not support. Convoke's skills are *offered* to them. "Neither
claimed nor supported" is true and is the wrong sentence to end the paragraph on.

**23. §1 installation row — literally true, misleading in a distribution context.**
> "Installs for Claude Code only."

True of `convoke-install`. Not true of how a Convoke agent can arrive. Same root as item 22.

**24. §2.10 and §2.6 — MISLEADING as coverage.**
> "`convoke-audit-skill-dirs` exits 0 with '19 … all passed'."
> §2.6: "`npx --no-install convoke-audit-skill-dirs → "19 skill dir(s) audited; all passed."`"

The denominator is the 19 skill directories in an *installed project*. The repository — which is what a
channel walks — carries far more, and they are not clean.

*(verified)*
```
$ git ls-files | grep 'SKILL\.md$' | grep -vE '^(_bmad/bme|\.claude/skills|_bmad/core)/' | wc -l
38
$ for f in $(git ls-files | grep 'SKILL\.md$'); do awk '/^name:/{print $2; exit}' "$f"; done \
    | sort | uniq -c | awk '$1>1'
   3 bmad-help          3 bmad-shard-doc     3 bmad-party-mode
   3 bmad-brainstorming 3 bmad-index-docs    3 bmad-review-adversarial-general
   3 bmad-review-edge-case-hunter            2 bmad-advanced-elicitation
   2 bmad-create-prd    2 bmad-distillator   2 bmad-editorial-review-prose
   2 bmad-editorial-review-structure         2 bmad-cis-agent-brainstorming-coach
```
38 non-product `SKILL.md` (PRD defect 0's figure, confirmed) and **13 frontmatter `name:` collisions with
upstream skills**. Addendum §3 names the consequence: *"first-match-wins dedup by frontmatter `name` lets
one repo's skill shadow another's. This is the class Convoke's 38 fixtures sit in."* A green
`convoke-audit-skill-dirs` says nothing about any of it — the same blind spot the ledger's own §2.18
documents for the installer: *"None of those five is in the list, so the verification cannot fail on
them."*

**25. §2.18 — STALE in scope.**
> "**What this row does not claim.** That the capabilities are missing. Every one of them is installed and
> starts."

The row's thesis — *"the product under-describes itself at exactly the moment a new operator is deciding
whether it worked"* — is correct and the PRD extends it one step earlier, to the moment before installing.
On the channel path the capability is *not* installed with its runtime and does not usefully start: PRD
defect 1, *"A Convoke skill installed alone fails without naming what is missing."* The row's reassuring
final paragraph is true of the npm path only. SM1 states the public-surface version of the same defect:
*"Reachable set equals declared set | 9 reachable, **0 declared**"*.

### Group E — Ownership, basis and scope of the whole ledger

**26. §1 footnote — MISLEADING now that the repository is the surface.**
> "*Design (WDS), build and test (BMM, TEA), creative facilitation (CIS) and agent building (BMB) are BMAD
> Method ecosystem modules. **Convoke does not ship or maintain them, and this ledger does not assess
> them.***"

*(verified)* Convoke's tracked tree contains 37 fixture `SKILL.md` files reproducing BMM, CIS, TEA, BMB and
core skills **under their verbatim upstream names** (`bmad-help`, `bmad-party-mode`, `bmad-agent-dev`,
`bmad-cis-storytelling`, …) at `tests/fixtures/portability-project/` and `tests/fixtures/bmm-dependencies/`.
Convoke does not maintain them. It does publish name-identical copies of them into its own public
discovery surface. The footnote disclaims responsibility for content the repository now exposes, which is
PRD NFR6's class: *"Nothing Convoke publishes can shadow an upstream skill an operator already depends on."*

**27. §2.0 basis — STALE as the ledger's *only* basis.**
> "**The published tarball is the basis for every 'ships' claim below.**"
> §2.0: "*Basis: the published package convoke-agents 4.0.3, the current release on npm*"

A defensible discipline that cannot see this defect class. The PRD: *"The public discovery surface of the
**repository** is nine skills."* Two of those nine (`bmad-audit-skill-dirs`, `bmad-register-skill`) are in
`files[]` and seven are manifest-declared paths; the 38 fixtures are repository-only. A tarball-only basis
structurally cannot assess a channel whose unit of discovery is a git repository. The ledger needs a
second, named basis for the published-surface rows — which is what its own §2.13/§2.18/§2.19 convention
already provides for.

**28. §2.19 — STALE, and the PRD could have settled it but did not.**
> "An attempt to reproduce those values from the cited source
> (`https://skills.sh/bmad-code-org/BMAD-METHOD`, fetched 20 September 2026) returned a page displaying
> **no ratings at all.**"

Addendum §3 asserts *"skills.sh now surfaces third-party verdicts at `/audits`."* That is a different URL,
undated, with no fetch record, in the one area where the ledger holds a recorded failed reproduction. The
PRD neither cites the ledger's attempt nor reconciles the ledger's client-row wording — *"its installer
surfaces third-party scan results at install time"* — with a website-level `/audits` page. See Part 4.

**29. §2.14 — questionable now that the manifest is a publication surface.**
> "There is no tool, export format or test for this path." (use in chat windows)
> "**Why Mapped, not built:** it is named in docs, **nothing in the package supports it**"

`npx skills add` is a tool that delivers one Convoke agent file to a host with no Convoke project around
it — functionally the scenario §2.14 assesses, minus the chat window. The package's own manifest is what
makes that possible. "Nothing in the package supports it" is no longer safe as written; the honest form is
that nothing supports it *well*, which is PRD defect 1.

**30. §1 export row — the stated mitigation does not survive the channel path.**
> "Convoke's own team agents export with a framework-only warning banner, but the file beneath it is the
> agent's full persona — lossy rather than empty, and usable-looking enough that a developer could paste
> the Cursor adapter in and get partial, unsupported behaviour."

This is the ledger's closest anticipation of PRD defect 1, and it rests on the banner. PRD FR8 records why
the banner is not enough on a channel: *"The dependency is legible in the channel's rendered storefront
text, not only at runtime. **(The storefront renders frontmatter `description`; a README is invisible to
it.)**"* On the channel path the operator gets the persona with neither the banner nor the README.

**31. §1 Team Factory row and §2.4 — load-bearing on a decision the ledger does not know it is making.**
> "**The maintainer has decided it is internal scaffolding rather than a capability to adopt** (September
> 2026); removing it from the installed package is planned but not yet done."
> §2.4: "That has not been executed — it still ships, still installs, and its agent still starts."

The ledger treats this as a pending *installer* change. It is now also a pending *publication* change: an
agent already ruled non-adoptable is present in the shipped tree and startable. The PRD counts it in its
measured position as *"(+1 internal)"* without citing `T179` or the standing removal ruling, and FR17 only
requires that such a skill be *"distinguishable"* — not absent. See Part 3, G11.

---

## Part 2 — Claims the PRD makes that the ledger contradicts

**P1. The PRD's Vortex workflow count is wrong; the ledger's is right. (verified)**

PRD: *"Workflows | 30 (Vortex 23, Gyre 7)"*, and SM3 *"Workflows addressable | 0 of 30"*.
Ledger §2.1: *"`$P/_bmad/bme/_vortex/config.yaml` declares 22 workflows. `ls workflows` shows those 22
plus `_deprecated/`."*

```
$ grep -c '^  - ' <(sed -n '/^workflows:/,/^version:/p' _bmad/bme/_vortex/config.yaml)   # → 22
$ ls -1d _bmad/bme/_vortex/workflows/*/ | wc -l                                          # → 23
$ ls -1 _bmad/bme/_vortex/workflows | grep _deprecated                                   # → _deprecated
```
23 counts `_deprecated/` as a workflow. The correct figures are **Vortex 22, Gyre 7, total 29**, and SM3's
target denominator is 29. The ledger also documents that `_deprecated/` is where the 13 dangling
`_designos` paths live — so the PRD's count includes, as an addressable asset, the one directory the
ledger flags as broken.

**P2. FR13's parenthetical is false; the ledger's §2.3 is right. (verified)**

PRD FR13: *"All 11 agents across both teams exist in the repository as skills. **(Gyre's four are
generated at install time today and exist nowhere in the tree.)**"*
Ledger §2.3: `model-curator.md lines=131 <agent=1 name="Atlas" · readiness-analyst.md 130 name="Lens" ·
review-coach.md 133 name="Coach" · stack-detective.md 128 name="Scout"`.

```
$ ls -1 _bmad/bme/_gyre/agents
model-curator.md  readiness-analyst.md  review-coach.md  stack-detective.md
$ find _bmad/bme/_gyre -name 'SKILL.md'      # (nothing)
```
Gyre's four agents **do** exist in the tree — as flat v5 XML `.md` files, shipped in `files[]`. What does
not exist is a `SKILL.md` / skill directory for any of them. "Exist nowhere in the tree" would make the
work a *creation* task; the accurate statement makes it a *restructure* task, which is a different
requirement and a different cost. This matters because FR13 is the requirement that funds it.

**P3. SM1 contradicts the PRD's own trigger.**
> SM1: "Reachable set equals declared set | **9 reachable, 0 declared** | equal, checked in CI"

The Trigger two pages earlier: *"Convoke's own manifest declared him"*, and *"it lists 7 of 11 agents."*
The ledger's §2.13 capture shows the same seven declarations. Seven are declared, in one place, in a file
that ships. The intended meaning is presumably "no *authoritative declaration of the intended* set", but
as written SM1 is self-contradicting and FR1 (*"declared in one place in the repository"*) reads as
already satisfied.

**P4. "Nothing had ever been published to that registry" is true only of that registry — the ledger
supplies the missing history.**

PRD Trigger: *"though nothing had ever been published to that registry."* Ledger §2.13 records PR #9 to
`bmad-code-org/bmad-plugins-marketplace`, closed 2026-04-27 unmerged. Convoke did deliberately submit its
manifest to a public marketplace once. The PRD's framing (*"settles a question nobody had asked"*) reads
as a surprise discovery; the ledger shows the publication intent was explicit five months earlier and was
rejected on structure.

**P5. The PRD's second non-goal declines the change the ledger records as the marketplace's stated
acceptance condition — a direct conflict with G4/FR18.**

PRD non-goal: *"**Matching upstream's unreleased tree.** The flat-skills restructure is on `main` and in no
tagged release; chasing it violates NFR1."*
Ledger §2.13, quoting the marketplace maintainer on PR #9: *"Ideally your repo will have at the root a
skills folder and within the skills folder there should be a module.yaml and a module-help.csv. … Will
close for now"* — with `ls -d $P/skills <repo>/skills → No such file or directory (both)`.

Root-level `skills/` is not merely an untagged upstream branch. It is the **submission requirement of the
channel that already rejected Convoke**, on the record since April 2026. NFR1's cadence argument (*"No
restructure targets an upstream branch that has no tagged release"*) does not apply to an acceptance
condition — a marketplace's intake rules are not a version you track at N-1. As written the non-goal
declines the one change that unblocks G4 (*"the BMAD-addon majority through the channel they already
use"*) and FR18, and it does so without citing the rejection.

**P6. Addendum §2's BMAD-METHOD count sits against a different ledger figure with no command for either.**

Addendum: *"**BMAD-METHOD** (30 skills) | skills.sh only"*.
Ledger §2.8: *"BMAD proper totals 72 rows: 43 standalone, 6 light-deps, 23 pipeline. That matches
`README.md:98`."* — from a quote-aware parse of `skill-manifest.csv` (core 14, bmm 33, tea 10, cis 10,
bmb 5). The bases differ (what upstream lists on one channel vs what Convoke's manifest tiers), which may
reconcile — but the addendum's figure carries a link and no command, and the landscape table it anchors is
the input to OQ-3.

**P7. Defect 3 is asserted without enumeration, in breach of the PRD's own FR2 and NFR5.**
> "| 3 | Four dead upstream dependencies | Confirmed |"

No list, no command, nowhere in prd.md or addendum.md. FR2: *"Every reachable set is derivable by a
command that a reader can run, and the command is the source of any figure quoted about it."* NFR5: *"Any
figure in a shipped document carries the command that produces it."* The derivable set is in Part 1 item
15. Note the ledger's discipline is stricter here than the PRD's, and the ledger is the client-facing
document.

**Corroborations worth recording** (the two documents agree, independently derived):
- PRD *"Personaless skills that exist | 7"* reconciles exactly with ledger §2.1's
  `ls $T/.claude/skills | wc -l → 19` minus doctor's `12 agent skill wrappers verified`.
- PRD *"Agents | 11 in 2 teams (+1 internal)"* reconciles with ledger §2.0's *"Every one of the 12
  installed agents was started once"* and §2.1's *"writes … `customize.yaml` for 11 agents"*.
- PRD defect 0's *"38 public `SKILL.md` fixtures"* — verified at 38 (37 under `tests/fixtures/` plus one
  under `_bmad-output/exp3-smoke-test/`).
- PRD's *"two tracked under `.claude/skills/`"* — verified; `git ls-files .claude/skills` returns
  `bmad-audit-skill-dirs` and `bmad-register-skill`, whitelisted at `.gitignore:66-71`. The ledger's §2.0
  `files[]` summary names only the first of the two; both are in fact in `files[]`.
- `convoke-install-gyre` **is** a real bin (14 bins in `package.json`); the ledger invoked it by raw
  script path (`install-gyre-agents.js`) and its §2.10 bin list omits it. Not a contradiction, but the
  ledger's bin enumeration is incomplete.

---

## Part 3 — Load-bearing ledger content the PRD should have made a requirement and did not

**G1 — Air-gapped, internal-registry, mirror and binary paths. The largest gap, and it is the one a
leadership audience asked about.**
> §2.19: "There is no binary distribution, no documented internal-registry or mirror path, and no
> air-gapped procedure. An organisation whose policy prevents pulling from the public registry at
> deployment scale has no supported route, and this ledger should not imply otherwise."

The PRD has **no requirement** for any of it. F5 ("Both segments arrive intact") splits the world into
BMAD-addon and standalone — both of which pull from *public* channels. FR19 says the standalone operator
*"receives the complete module, configuration included, and is not required to obtain it from a second
channel"* — silent on where the first channel is. The PRD's own finding makes this worse, not better: it
adds a second public-channel dependency while leaving the offline path unaddressed. Suggested shape:
a requirement that the complete module be obtainable as a single verifiable artifact installable from a
private registry, a mirror or a file, with no network call at install time.

**G2 — Provenance and signing do not transfer to the new channel, and nothing requires that they should.**
> §2.12: "It must pass the tests and a clean-install trial, and it carries signed build provenance."
> §2.19: "Build provenance is covered in §2.12 and is not restated here."
> §2.12 evidence: "`npm audit signatures` → 14 packages have verified registry signatures · 1 package has
> a verified attestation"; Rekor logIndex 2877236851.

This is the ledger's single strongest supply-chain assurance and the one an enterprise security review
will anchor on. Nothing in F1–F6 requires that an artifact published to *any* channel carry verifiable
provenance, or that the absence be disclosed. FR5 (*"No name is published into a channel before FR1–FR4
hold"*) gates on the reachable-set check only. Suggested shape: extend FR5 with an integrity condition,
and add an FR that a channel which cannot carry provenance is disclosed as such under FR24.

**G3 — Vulnerability-audit surface per channel.**
> §1: "`npm audit` over the production tree reports 0 vulnerabilities at any severity across 14 packages."

A skills-channel install has no lockfile, no dependency tree and no audit command. The ledger's clean
posture is a property of one channel; no FR preserves or qualifies it.

**G4 — FR24 still says two supply chains; the PRD's own findings make it three.**
> FR24: "When a channel carries a defect Convoke cannot fix, the limit is disclosed rather than omitted.
> *(Two supply chains, only one of them Convoke's.)*"

The parenthetical is copied from the ledger and was not updated. The third is the skills registry itself:
it hosts, renders, surfaces third-party verdicts, and per addendum §1 *"there is no self-serve retraction
… delisting is done by hand by Vercel staff"* and there is *"No dependency mechanism at all."* Those are
exactly FR24's "defect Convoke cannot fix" and none is named.

**G5 — The ledger's materiality rule and status vocabulary are never applied to the new findings.**
> §2.0: "**Materiality rule:** a defect moves a row to *Works with limits* when it affects the documented
> outcome. Cosmetic or diagnostic defects are stated in the row's note but do not downgrade it."

PRD defect 5 is the single line *"Maturity ledger distribution row + uncertain-row 1 | Confirmed"*. It
does not say what the corrected sentences are, which other rows move, or whether any status changes. Yet
defects 1, 2 and 4 remove the documented outcome on the channel path, which is precisely what the rule
downgrades on. FR22 requires derivation (*"Statements about Convoke's distribution in operator-facing
documents are derived from the repository at the stated version, never asserted from memory"*) but not
re-grading. The ledger is in front of leadership *now*; a requirement that says "the ledger is affected"
without saying how leaves the wrong sentences standing. Suggested shape: an FR obliging the affected
client-facing rows to be re-derived and re-graded under §2.0's rule, with the new basis named per the
ledger's own §2.13/§2.18/§2.19 convention.

**G6 — The ecosystem's own router does not know Convoke exists, and no FR addresses it.**
> §2.18: "`.claude/skills/bmad-help/SKILL.md` — the skill whose job is answering *what should I do next* —
> contains **0** occurrences of `bme`, `vortex`, `gyre` or `convoke`. … An operator who asks the
> ecosystem's own help skill what is available will not be told about anything Convoke ships. **Convoke
> can address this with a customisation override and has not.**"

This is a discovery defect at exactly the layer the PRD is about ("how Convoke arrives"), with the fix
already identified by the ledger and explicitly unbuilt. G2/FR8 cover storefront legibility; nothing
covers the router an operator inside the ecosystem will actually ask.

**G7 — Gyre's guides ship and never install (T91), which is FR21's class.**
> §1 Gyre row: "its team guide is not copied into your project."
> §2.3 / §2.18: "**T91** (Open): Gyre `guides/` and `compass-routing-reference.md` ship but never install."

FR21 is the right requirement (*"An operator can tell, before installing, which parts of Convoke a given
channel path will and will not deliver"*) but is scoped to channel *paths*, not to shipped-but-uninstalled
content. A channel unit that carries an agent and not its guide is the same defect one level out, and T91
is already open.

**G8 — The ledger's hardest-won methodological rule is absent, and the PRD's most behavioural
requirements are exactly the class it governs.**
> §2.0: "These are single samples of a non-deterministic system."
> §2.1: "**A nuance the client table can only summarise, and which was got wrong twice before it was
> measured.** … Two independent reviewers had previously reached *opposite* conclusions from single
> samples … **The methodological point is worth more than the finding:** every claim in this ledger about
> agent behaviour rests on single samples of a non-deterministic system, and this is the one row where
> enough samples were taken to notice."

FR6 (*"detects its absence during activation, before producing output"*), FR9 (*"A skill never silently
produces output when its runtime is absent"*) and SM5 (*"Single-skill installs that fail silently |
unknown, assumed all | zero"*) are all assertions about non-deterministic agent behaviour. SM5's "today"
column is literally *"unknown, assumed all"* and its target is *"zero"* — a claim the ledger's own history
says cannot be established from single runs. Nothing in the PRD requires sampled evidence, a sample size,
or a CI harness that runs the activation more than once. This is the requirement most likely to be
declared met on one lucky run.

**G9 — No platform axis on any requirement, and a storefront makes a platform claim implicitly.**
> §3 uncertain row 8: "CI runs only on Ubuntu, and the trials here ran on macOS. No evidence covers
> Windows … **The ledger makes no platform claim. Do not add one without a Windows run.**"

FR20 requires an upstream-version compatibility declaration; FR21 requires pre-install legibility. Neither
has a platform dimension. A channel listing is precisely where an unstated platform claim gets made.

**G10 — FR18 rests on a path the ledger records as never trialled, and the PRD does not cite that.**
> §3 uncertain row 6: "**Coexistence with an existing BMAD Method install.** Not trialled; only standalone
> installs were run. The Enhance menu patch, BUG-20's detection logic … and Team Factory's BMB delegation
> all behave differently with BMAD present."

FR18 (*"An operator who already has BMAD can add Convoke by the same means they add BMAD skills"*) serves
the PRD's stated ~60% majority segment. The PRD already flags FR18–FR21 as *"the least validated
requirements in the document"* for a different reason (no narrated journeys). The ledger supplies a second,
harder reason: the coexistence path has never been exercised at all. Uncertain row 6 even gives the
settling procedure. Neither is cited.

**G11 — A capability already ruled non-adoptable is still on the shipped surface, and FR17 only asks that
it be distinguishable.**
> §2.4: "**A governance fact that outranks the defects.** `T179` (filed 2026-09-16, open): the maintainer
> ruled the Team Factory **internal scaffolding, not a user-facing capability**, and planned its removal
> from the installed package as one coordinated change. That has not been executed — it still ships, still
> installs, and its agent still starts. For an evaluating organisation this matters more than the defect
> list: the owner has already decided this is not something to adopt."

FR17: *"A skill that is metadata or scaffolding rather than a capability is distinguishable from one an
operator should invoke."* Distinguishable is weaker than absent, and NFR3 (irreversibility) argues for
absent: once a name is in a channel there is no self-serve retraction. The PRD's measured position counts
it as *"(+1 internal)"* with no reference to T179.

---

## Part 4 — Does the PRD honour the ledger's rules about evidence?

The ledger states or applies five rules. The PRD honours three and breaches two, one of them squarely.

**Rule 1 — Derivation over assertion. HONOURED, and promoted.**
The ledger's §3 uncertain row 9 (*"re-run the `npm view convoke-agents dist-tags --json` check"*) and its
practice of printing the command for every figure become PRD requirements: FR2 (*"the command is the source
of any figure quoted about it"*) and NFR5 (*"Any figure in a shipped document carries the command that
produces it"*). FR22 generalises it. This is the ledger's method turned into policy and it is the best
thing the PRD does with the ledger.

**Rule 2 — Name your basis, and state exceptions rather than smoothing them. HONOURED in the PRD, and the
PRD's own findings now need the same treatment in the ledger.**
The ledger carries five bases (17, 20, 21, 23, 25 September), each named at the head of its section:
*"assessed 2026-09-21 against HEAD, the same named-exception treatment §2.18 and §2.19 carry."* The PRD
dates its own measurement (*"every figure was produced by execution on 2026-09-26"*). The corollary the
PRD does not draw: the rows it invalidates need a sixth named basis, not a silent edit — the ledger's own
convention, and a retraction is a first-class outcome in it (§2.13: *"The capture above is left as the
record of what was true on this ledger's 17 September basis; read it as history, not as current state"*).

**Rule 3 — Adversarial handling of third-party claims. HONOURED for the CSA note.**
> Addendum §3: "[CSA research note] is real (6 May 2026) but **aggregates rather than scans**, and its
> CVE-2025-59536 citation **is a stretch — that disclosure concerns `.claude/settings.json` hooks, not
> skills.**"

This is exactly the ledger's method: go to the source, characterise what it actually does, and name the
overreach. The `metadata.internal` claim is labelled to the same standard: *"⚠️ **Unverified by this
session:** research reports the flag suppresses the CLI but **not** the skills.sh web listing … **Check
this before designing on the flag.**"* — and OQ-2 carries it forward. Both are model citizens of the
ledger's discipline.

**Rule 4 — Refuse to restate unverified third-party security figures. BREACHED, on the Snyk figures.**

The ledger's rule, twice stated:
> §1 supply-chain row: "its installer surfaces third-party scan results at install time, those results
> describe BMAD rather than Convoke, and you should evaluate them on their own terms. **We have not
> reproduced them and do not restate them here.**"
> §2.19: "The values could not be confirmed from the source that was cited for them, so they are **not
> published here** — restating an unverified security rating about somebody else's package is precisely
> the kind of claim this ledger exists to refuse."

The addendum:
> §3: "[Snyk ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/): 3,984 skills scanned, **1,467 (36.82%)** with ≥1 flaw, **534 (13.4%)**
> critical, **76** confirmed malicious."

Four figures to four significant digits, from a vendor blog, with a link and **no verification label** —
in a document whose own preamble commits to *"Every claim carries its source; claims this session could not
verify are labelled."* The absence of a label, sitting three paragraphs from the `metadata.internal` claim
that *is* labelled, reads as verified by contrast. The ledger refused a claim that *also* had a cited
source; having a source was never the test — reproducing it was.

*The strongest defence, stated fairly:* Snyk's numbers are a **population statistic about third-party
skills**, not a security rating of a named package, so the letter of §2.19's rule ("about somebody else's
package") arguably does not bind. That distinction is real and worth making explicitly in the addendum.
But the ledger's *reason* binds identically — it refused because it could not reproduce from the cited
source — and a client-facing document that quotes 36.82% has restated a number it did not compute. The
minimum fix is a label and a scope sentence; the safer fix is the ledger's own move: state what survives
structurally and drop the digits.

Note also that Convoke's *own* figures in the addendum are unsourced by command (30 BMAD-METHOD skills,
122 scenario-labs skills, 26 huggingface, ~100 NVIDIA), and that prd.md's header guarantee — *"every figure
was produced by execution on 2026-09-26"* — is not true of the table it introduces: the Vortex workflow
count is wrong (Part 2, P1), and defect 3's "four" is unenumerated (P7). A document that states FR2 and
NFR5 fails them on its own first page.

**Rule 5 — The materiality rule. BREACHED by omission.**
> §2.0: "a defect moves a row to *Works with limits* when it affects the documented outcome. Cosmetic or
> diagnostic defects are stated in the row's note but do not downgrade it."

The PRD confirms defects that remove the documented outcome on the channel path and does not run the
rule. Defect 5 is recorded as *"Confirmed"* with no corrected text and no status re-derivation. See
Part 3, G5 — this is the finding with the shortest fuse, because the uncorrected rows are the ones already
in front of leadership.

---

## Appendix — procedural notes

- The ledger's frontmatter still reads `status: draft` while the document has been through a leadership
  review (2026-09-22). The PRD's F6 ("The record matches what ships") has no requirement covering the
  status of the record itself.
- The ledger's §2.10 bin enumeration omits `convoke-install-gyre` and `convoke-install-vortex`; the
  package declares 14 bins and the ledger's "Other bins" list names five plus a raw script path.
- The ledger's §2.0 `files[]` summary names `.claude/skills/bmad-audit-skill-dirs/` only; `files[]` in
  fact carries both tracked skills, which is the pair the PRD counts toward its nine.
- `_bmad/bmm/config.yaml` still carries `project_name: BMAD-Enhanced`, which named the PRD's run folder —
  already flagged in the PRD's own `[NOTE FOR PM]`. Not a ledger conflict; recorded so it is not lost.
