---
title: 'Channel Integrity — independent mechanics fact-check'
initiative: convoke
artifact_type: report
qualifier: channel-integrity-mechanics-review
status: final
created: '2026-09-26'
updated: '2026-09-26'
schema_version: 1
qualifier_role: review-receipt
---

# Channel Integrity — independent mechanics fact-check

Scope: every factual claim about an external system in `addendum.md` §1, §2, §3 and in
`prd.md`'s Trigger, Defect table, Open Questions, SM6 and NFR3 — plus the two
repo-local claims. Each verified against the primary source (tool README, tool
**source code**, issue bodies and comments, vendor docs, publisher pages) on
2026-09-26. Nothing below is answered from memory.

**Tally: 72 claims checked — 52 agree · 14 wrong or materially overstated · 3 right
in kind but wrong in scope · 2 cannot-verify · 1 out of scope.**

Reproducing commands are given inline; the two decisive ones are:

```
curl -sSL https://raw.githubusercontent.com/vercel-labs/skills/main/src/skills.ts | sed -n '108,175p;300,325p'
gh api -X GET search/code -f q='required_skills repo:bmad-code-org/BMAD-METHOD' --jq '.items[].path'
```

---

## 0. The answer to OQ-2

**`metadata.internal: true` suppresses the CLI. It does not remove an existing
skills.sh web listing. It is not a retraction mechanism, and it is not sufficient for
FR3 as FR3 is currently written.**

| Sub-question | Answer | Primary evidence |
|---|---|---|
| Is it shipped? | Yes | README "Optional Fields"; `src/skills.ts:117-122` implements it |
| Where does it nest? | Under `metadata:` — `metadata.internal`, **not** top-level `internal:` | `const isInternal = metadata?.internal === true` (`src/skills.ts:121`); README example |
| Does it suppress CLI discovery/install? | Yes, proven by three independent operators | [#1578](https://github.com/vercel-labs/skills/issues/1578): `kunchenguid/lavish-axi`, `hraness/ensoul`, `scenario-labs/skills` each confirm `npx skills add … --list` omits them |
| Does it suppress the skills.sh **web listing**? | **No** — not retroactively. 11 named skills.sh URLs across those three repos still list skills marked internal on the default branch | [#1578](https://github.com/vercel-labs/skills/issues/1578) body + both comments (2026-08-29, 2026-09-22) |
| Has a maintainer answered? | No. Issue open since 2026-07-03; every participant is `author_association: NONE`; latest report 2026-09-22 | `gh api repos/vercel-labs/skills/issues/1578/comments` |
| Why? | The page appears to be indexed from an earlier discovery pass / install telemetry, not re-derived from the live default branch. skills.sh's FAQ documents only "Skills appear on the leaderboard automatically through anonymous telemetry when users run `npx skills add`" and no re-index or delist path | [skills.sh/docs/faq](https://www.skills.sh/docs/faq); #1578 |

**The limit of the evidence, which matters for Convoke's design.** All three cases are
skills that were **public and indexed first, then marked internal**. No source
establishes what happens to a skill marked internal *before* it is ever indexed.
Convoke's 38 fixtures have never been indexed (only Wade was listed), so marking them
internal pre-emptively is plausibly sufficient for the website — but that is
*unproven*, and only the CLI half is proven. Item 0's design must not assume the
website half.

**Two live caveats that make the flag weaker than `prd.md` Defect 0 assumes:**

1. **An explicit `--skill <name>` request installs an internal skill anyway.**
   `src/add.ts:1330-1338`: *"Include internal skills when a specific skill is
   explicitly requested (via `--skill` or `@skill` syntax). The `'*'` wildcard is a
   bulk request, not an explicit one."* `includeInternal` is then passed into
   `discoverSkills`, and `parseSkillMd` stops filtering. **This is undocumented in the
   README.** So `metadata.internal` alone does **not** satisfy FR3's "no documented
   channel path offers it for installation — including explicitly-flagged paths".
   A second mechanism (or renaming the fixtures) is required.
2. **The flag's value is spec-invalid and a fix is unmerged.** Open issue
   [#2249](https://github.com/vercel-labs/skills/issues/2249) (2026-09-17): the Agent
   Skills spec types `metadata` as string→string, so the YAML boolean `true` makes the
   whole `SKILL.md` unloadable by strict consumers (Atlassian Rovo Dev rejects it),
   while the spec-compliant string `"true"` is read as *not internal* by the strict
   `=== true` check. Open PR [#2294](https://github.com/vercel-labs/skills/pull/2294)
   (2026-09-24) would accept both; it is unmerged as of 2026-09-26. Designing on this
   flag means designing on a value that is currently either spec-invalid or silently
   non-hiding.

---

## 1. `npx skills` discovery model — addendum §1 and the PRD Trigger

Source for all rows: `https://github.com/vercel-labs/skills` README (`main`) and
`src/skills.ts`, `src/add.ts`, `src/constants.ts` at `main`.

| # | Claim | Source | Verdict | Correction |
|---|---|---|---|---|
| A1 | "Each skill container directory is walked up to three levels deep" | README L415 | **Agree** | Verbatim. `DEFAULT_SKILL_CONTAINER_DEPTH = 3` (`src/constants.ts:6`) |
| A2 | "A `SKILL.md` discovered at a shallower level shadows anything nested below it" | README L419 | **Agree** | Verbatim. Implemented as `if (foundAtChild …) continue` (`src/skills.ts:296`) |
| A3 | "Use `--full-depth` to also discover `SKILL.md` files outside these container directories (e.g. under `examples/` or `tests/`)" | README L419-421 | **Agree** | Verbatim |
| A4 | "The list includes the repo root, `skills/`, `skills/.curated/`, `.claude/skills/`, `.agents/skills/` **and roughly twenty more** agent-specific paths" | README `skill-discovery` block | **Disagree** | The block has **59 entries**, so ~54 more, not ~20. Derive: `sed -n '/skill-discovery:start/,/skill-discovery:end/p' README.md \| grep -c '^- '` |
| A5 | "Manifest-declared paths **bypass the walk entirely**" | README; `src/skills.ts:266-270,305-307` | **Partial** | The README sentence quoted ("not subject to the bounded depth-3 catalog walk described above") is verbatim and correct. But "entirely" overstates the code: manifest dirs are appended to `prioritySearchDirs` and walked at **depth 1** (`walkSkillDirs(dir, 1)`), not zero. They escape the *depth-3 catalog* walk, not all walking |
| A6 | "`.claude-plugin/marketplace.json` and `plugin.json` are both parsed" | README "Plugin Manifest Discovery" | **Agree** | Exact: `.claude-plugin/marketplace.json` **or** `.claude-plugin/plugin.json` |
| A7 | "If no skills are found in standard locations, a recursive search is performed" | README L505 | **Agree** | Verbatim |
| A8 | "Convoke has two tracked `SKILL.md` under `.claude/skills/` (whitelisted at `.gitignore:66-71`), so the fallback does not fire today" | repo; `src/skills.ts:310` | **Partial** | Both facts hold (see H2, H3) and the conclusion holds — but for a stronger reason than given: the 7 manifest-declared skills alone keep `skills.length` non-zero |
| A9 | "It is **one `.gitignore` change away from firing**" | `src/skills.ts:270, 310-311` | **Disagree** | The condition is `if (skills.length === 0 \|\| options?.fullDepth)`. Manifest paths are pushed into the search list (L270) and walked (L305-307) **before** that check, so with 7 manifest-declared skills `skills.length` is never 0. Un-whitelisting `.claude/skills/` cannot fire the fallback; it would take the manifest declarations ceasing to resolve as well |
| A10 | Trigger: the manifest declares `./_bmad/bme/_vortex/agents/lean-experiments-specialist` — "five levels deep, outside every container directory" | repo + README dir list | **Agree** | 5 path segments; `_bmad/` is in none of the 59 container dirs; `SKILL.md` is tracked; its frontmatter `name` is `bmad-bme-agent-wade`, matching the listing named in the Trigger |
| A11 | Trigger: "The CLI walks a fixed list of container directories three levels deep, but manifest-declared paths bypass that walk entirely" | as A1+A5 | **Agree** | Subject to A5's "entirely" nit |
| A12 | Defect 0: the 38 fixtures are "**reachable only via explicit `--full-depth`**" | `src/skills.ts:136` (`findSkillDirs(dir, depth = 0, maxDepth = 5)`), L310-311 | **Disagree** | Right in kind, wrong in reach. The fallback calls `findSkillDirs(searchPath)` with **`maxDepth = 5`** and returns `[]` when `depth > maxDepth`. **31 of the 38 sit at directory depth 6-8** (all under `tests/fixtures/portability-project/`) and are **unreachable by `--full-depth` from the repo root**. Only 7 are reachable: 6 at depth 4 (`tests/fixtures/bmm-dependencies/*`) and 1 at depth 5 (`_bmad-output/exp3-smoke-test/…/adapters/claude-code/`). All 38 remain reachable by an explicit subpath argument, which the CLI honours by design |
| A13 | SM6 baseline: "Non-product `SKILL.md` reachable by any documented flag — **38**" | as A12 | **Disagree** | The reachable-at-repo-root figure is **7**. 38 is the count that *exists*, not the count reachable. Derive: `git ls-files \| grep 'SKILL\.md$' \| grep -E '^tests/\|^_bmad-output/' \| awk -F/ '{print NF-1}' \| sort -n \| uniq -c` → 6@4, 1@5, 2@6, 28@7, 1@8 |
| A14 | "The public discovery surface of the repository is **nine** skills" (2 + 7) | repo + `src/skills.ts` | **Agree** | Consistent with the code: default discovery finds the 2 under `.claude/skills/` (a container dir) plus the 7 manifest paths. The other 66 tracked `SKILL.md` sit outside all 59 container dirs, and the fallback never fires (A9) |

**One further code fact, not claimed anywhere and worth having:** `SKIP_DIRS =
['node_modules', '.git', 'dist', 'build', '__pycache__']` (`src/skills.ts:10`).
`tests`, `fixtures` and `_bmad-output` are **not** skipped — so napoln#113's proposed
test-segment skip is *not* implemented in this CLI. Depth, not a denylist, is the only
thing keeping 31 of the fixtures out.

---

## 2. Exclusion, shadowing and dependencies — issues 515, 353, 572

| # | Claim | Source | Verdict | Correction |
|---|---|---|---|---|
| B1 | `metadata.internal: true` is shipped | README; `src/skills.ts:117-122` | **Agree** | |
| B2 | Quote: "Set to `true` to hide the skill from normal discovery. Internal skills are only visible and installable when `INSTALL_INTERNAL_SKILLS=1` is set." | README "Optional Fields" | **Agree** | Verbatim |
| B3 | It nests under `metadata` | `src/skills.ts:121` | **Agree** | |
| B4 | "the flag suppresses the CLI but **not** the skills.sh web listing" | [#1578](https://github.com/vercel-labs/skills/issues/1578) | **Partial** | True for listings created *before* the flag was added — three repos, 11 URLs. **Not established** for a skill marked internal before it is ever indexed, which is Convoke's actual case. See §0 |
| B5 | "#1578, a skill listed publicly despite `metadata.internal: true`" | #1578 | **Agree** | Three such reports in that one thread |
| C1 | "No self-serve retraction: deleted skills remain listed" | #1578; [#1757](https://github.com/vercel-labs/skills/issues/1757); [#2266](https://github.com/vercel-labs/skills/issues/2266); [#2303](https://github.com/vercel-labs/skills/issues/2303); [FAQ](https://www.skills.sh/docs/faq) | **Agree** | Stronger than stated: **four** open delist requests (2026-07-03, 07-22, 09-19, 09-25), none closed, three with zero comments; the FAQ documents no delist or re-index path |
| C2 | "delisting is done by hand by Vercel staff" | [Vercel Community 35562](https://community.vercel.com/t/removing-a-skill-from-the-skills-sh-list/35562) | **Agree** — but re-cite | The addendum attributes this to #1578, where it is **unanswered**. The actual support is the community thread, where Vercel staff (Andrew Qu) replies *"what skill is it? I can remove it"*. Move the citation |
| C3 | NFR3: "There is no self-serve delisting; retraction is manual and discretionary" | as C1, C2 | **Agree** | |
| E1 | #515 "(Mar 2026, **unanswered**)" | #515 body + comments | **Disagree** on "unanswered" | Created 2026-03-05 ✓. It has **2 comments**: one third party pointing at PSPM, one linking duplicate requests **#860 and #1438**. Accurate wording: "unanswered *by maintainers*; three threads open for the same ask" |
| E2 | #515: "if skill A needs skill B, A must bundle everything or hope B is installed" | #515 body | **Agree** | Close paraphrase of the body |
| E3 | "No dependency mechanism at all" in `npx skills` | #515; README | **Agree** | |
| E4 | BMAD's `required_skills` is "**the only machine-readable skill→skill dependency found anywhere**" | #515 comment; [anyt-io/pspm-cli](https://github.com/anyt-io/pspm-cli) | **Disagree** | Over-claim. #515's own comment thread names **PSPM** — "NPM for agent skills, skill with version control, private skills, lock files" — a third-party manifest with semver ranges, a lockfile and SHA-256 integrity hashes. Narrow the claim to "the only one found in a BMAD-family or comparable published suite" |
| E5 | #353 "(open): first-match-wins dedup by frontmatter `name` lets **one repo's skill shadow another's**" | #353 body + repro | **Disagree** on mechanism | State ✓ (open, labelled `bug`, 2026-02-12, 1 comment). But #353 documents shadowing **within one repository's discovery pass** — attacker dir + legit dir in the same repo; the repro builds a single test repo. Cross-repo shadowing happens at the **install destination** (`installer.ts:203-205`: the install dir is named from `skill.name`), a different code path than the one #353 titles |
| E6 | "This is the class Convoke's 38 fixtures sit in" | `src/skills.ts:284-302, 310-320` | **Disagree** | With `--full-depth`, the priority-dir walk runs **first** and `seenNames` is already populated, so a fixture can never out-shadow a Convoke skill found in a container dir; by default the fixtures are not discovered at all. Convoke's live risk is the **install-destination overwrite** — a fixture named e.g. `bmad-agent-dev` installing over the operator's real upstream skill — not #353's discovery-order win. Restate the defect as that class; it is the one NFR6 actually guards |
| E7 | #572 "remains open because it requests a **repo-level** mechanism" | #572 body | **Disagree** | #572 requests a **per-skill frontmatter field** (`internal: true` / `private: true`) — essentially what shipped, differing only in nesting under `metadata`. `.skillsignore` is listed as a *rejected alternative*, not as the request |
| E8 | #572 "explicitly rejected `.skillsignore` as **'unnecessary configuration overhead'**" | #572 body | **Disagree** | Misquote; that phrase does not appear. The text is *"viable but adds another config file"* |
| E9 | #572 rejected `_`-prefix conventions as "implicit and fragile" | #572 body | **Agree** | Verbatim: *"works but is implicit and fragile"*, covering both `_` prefix and `.internal/` |
| E10 | *(supplied)* A supported reason #572 is still open | #572 body + #1578 | — | #572 asks that internal skills *"Not appear in `/find-skills` or any discovery UI"*. The shipped flag does not deliver that for the website (B4). That, not a repo-level ask, is the open gap |

---

## 3. Claude Code plugin install layout — addendum §1 second half

Source for all rows: [plugin loading reference](https://code.claude.com/docs/en/plugins/loading)
and [plugin dependencies](https://code.claude.com/docs/en/plugins/dependencies).

| # | Claim | Verdict | Correction |
|---|---|---|---|
| D1 | A remote plugin is copied to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` | **Agree** | Exact table row: `cache/<marketplace>/<plugin>/<version>/`, relative to a plugins root that is "`~/.claude/plugins` unless you set `CLAUDE_CODE_PLUGIN_CACHE_DIR`" |
| D2 | That is what `${CLAUDE_PLUGIN_ROOT}` points at | **Agree** | Verbatim: "`${CLAUDE_PLUGIN_ROOT}` points at this directory". Add: it changes with **every version**, so durable files belong in `${CLAUDE_PLUGIN_DATA}` |
| D3 | "Files outside the plugin directory aren't copied, so when a script inside a copied plugin reads a path above the plugin root, such as `../shared`, it doesn't find them" | **Agree** | Verbatim. Scope: it is the bullet for "**Every other marketplace plugin**". `--plugin-dir`, skills-directory, local relative-path and command-link plugins load **in place and are never copied** — so FR11's "plugin cache" premise holds for remote marketplace installs specifically |
| D4 | "Paths escaping the plugin root are **rejected**." | **Disagree** — two mechanisms conflated | Rejection applies to **declared component paths**: "It rejects a component path that resolves outside the plugin root, whether the path is declared in `plugin.json` or in a marketplace entry" → a `path escapes plugin directory` error. A **runtime file read** of `../shared` is not rejected; it simply finds nothing (that is D3). Defect 2 and FR10-FR12 concern runtime reads from reference files, so the operative mechanism is *not copied → not found*, and the correct fix is an explicit resolution base, not permission |
| D5 | Marketplaces have real semver `dependencies` | **Agree** | `dependencies` array in `.claude-plugin/plugin.json`; ranges `~2.1.0`, `^2.0`, `>=1.4`, `=2.1.0` |
| D6 | Constraint intersection across dependents | **Agree** | "the dependency resolves to the highest version that satisfies all of their ranges"; non-overlapping ranges fail the install with `has conflicting version requirements` |
| D7 | `allowCrossMarketplaceDependenciesOn` | **Agree** | Set on the **root** marketplace's `marketplace.json` (the one hosting the plugin being installed). Without it a cross-marketplace dependency is not installed unless the user already has it enabled at the same scope |
| D8 | Bundle-as-plugin idiom: a manifest carrying only `name` + `dependencies` | **Agree** | "A plugin manifest needs only `name`, so this is a valid plugin, and installing it installs every dependency" |
| D9 | *(supplied — material to OQ-3)* | — | Constraints resolve **against git tags** named `<plugin-name>--v<version>` on the repo hosting the dependency, and "**Tag-based resolution applies only to git-backed sources**". For `npm`, `archive` and `command` sources the constraint does not control which version is fetched — it is only checked at load, and the dependent plugin is **disabled** if unsatisfied. So "marketplaces resolve semver dependencies" is true **only if the dependency's maintainer tags releases**. OQ-3 should not treat upstream-BMAD semver resolution as available until upstream tags `<name>--v<version>` |

---

## 4. Comparables — addendum §2

| # | Claim | Source | Verdict | Correction |
|---|---|---|---|---|
| F1 | BMAD-METHOD "(30 skills)" | `bmad-code-org/BMAD-METHOD` tree | **Agree** | 30 at `skills/<name>/SKILL.md`; 40 `SKILL.md` repo-wide |
| F2 | "skills.sh only" | `gh api repos/bmad-code-org/BMAD-METHOD/contents/.claude-plugin` → 404 | **Agree** | No plugin manifest in the repo |
| F3 | "Sidecar `bmod.toml` **per skill** with `required_skills = [{skill="bmad", version=…}]`" | code search, 9 hits | **Disagree** | 30 `bmod.toml` exist, but `required_skills` appears in **2 of them**, both *module-record* skills: `skills/bmod-method/bmod.toml` → `required_skills = [{ skill = "bmad", version = "6.13.0", source = "github:bmad-code-org/BMAD-METHOD/skills" }]`, and `skills/bmod-core-tools/bmod.toml` → `required_skills = ["bmad"]`. An ordinary skill (`skills/bmad-agent-dev/bmod.toml`) carries **`recommended_skills`**, not `required_skills`. The object form also carries a third key, `source`, which the addendum's shape omits, and a plain string is valid too. Correct reading: *the requirement is declared once per module record, not once per skill* |
| F4 | "`bmad` hub materialises `{project-root}/_bmad/`" and "Hard gate: missing runtime → read sibling `bmad` SKILL.md and run setup" | `skills/bmad/scripts/setup.py`, `setup_check.py` | **Cannot verify in full** | The scripts exist and `setup_check.owed()` emits `npx skills add … --skill …` notes for unmet requirements, so the *self-diagnosis* half is real. The "hard gate" wording is a claim about the SKILL.md prose, which this pass did not read. Either read it or soften the word "gate" |
| F5 | "Non-invocable *module-record* skills" | as F3 | **Agree** | `bmod-method` and `bmod-core-tools` are exactly the two carrying `required_skills` |
| F6 | bmad-plugins: "CC + Codex marketplaces" | tree | **Agree** | `.claude-plugin/marketplace.json` **and** `.agents/plugins/marketplace.json` |
| F7 | bmad-plugins: "older `module-manifest.toml`, **no** `required_skills`, **no** plugin `dependencies`" | tree + 2 code searches | **Agree** | `module-manifest.toml` present per skill; 0 hits for `required_skills`; 0 hits for `dependencies` in `plugin.json` |
| F8 | CIS suite "(11)" | tree | **Agree** | 11 `SKILL.md` |
| F9 | huggingface/skills "(26) … marketplace exposes **one** plugin (`hf-cli`); the other 25 arrive via `hf skills add`" | `.claude-plugin/marketplace.json` | **Agree** | 26 `SKILL.md`; exactly one plugin entry, `hf-cli`, source `./skills/hf-cli`, description opens "Execute Hugging Face Hub operations using the hf CLI. **Install additional Hugging Face skills**…" |
| F10 | NVIDIA/skills "**(~100)**" | tree | **Disagree** | **383** tracked `SKILL.md`: 382 at `skills/<name>/SKILL.md` plus 1 in the router plugin. Off by ~3.8×. Derive: `gh api "repos/NVIDIA/skills/git/trees/main?recursive=1" --jq '[.tree[].path\|select(test("SKILL\\.md$"))]\|length'` |
| F11 | NVIDIA: "one router plugin on the marketplace, full catalog on skills.sh" | `.claude-plugin/marketplace.json`; `plugins/nvidia-skills/` | **Agree** — the strongest row in the table | Exactly one plugin, `nvidia-skills`, source `./plugins/nvidia-skills`, containing exactly one skill, `nvidia-skill-finder`, described "Find the right NVIDIA skill for…" — with `BENCHMARK.md` and `evals/evals.json` beside it. It also ships `.codex-plugin/plugin.json` and `.cursor-plugin/plugin.json`, so "both" is really three plugin ecosystems behind one router |
| F12 | scenario-labs/skills "(122)"; "marketplace **generated** from `skills.sh.json`"; "prose degradation contract in 121/122 files" | tree | **Partial** | **128** `SKILL.md` today, not 122 — so the "121/122" figure is stale and NFR5's derive-don't-assert rule applies to it. Both `skills.sh.json` and `.claude-plugin/marketplace.json` are present, consistent with generation |
| F13 | anthropics/skills: "Each skill is self-contained in its own folder" | — | **Not checked** | Outside the assigned spot-check set |
| F14 | "'Personaless process skills as connective tissue' is this session's own coinage, not a published pattern" | — | **Agree**, as far as a negative can be checked | Supported indirectly: the arXiv paper's own vocabulary is different (G2) |

---

## 5. Failure modes and security baseline — addendum §3

| # | Claim | Source | Verdict | Correction |
|---|---|---|---|---|
| G1 | arXiv 2606.20631 exists | [arxiv.org/abs/2606.20631](https://arxiv.org/abs/2606.20631) | **Agree** | "Harnessing Agent Skills: Architectural Patterns and a Reference Architecture for Skill-Mediated LLM Agents", Xia, Zhu, Xing, Lu, Sejdinovic, Xu; submitted 29 May 2026; ten patterns (five core, five supporting) in four layers: Supply Chain, Mediation, Execution Control, Evidence & Feedback |
| G2 | "The citable vocabulary is arXiv 2606.20631 — *Skill Extension Bundle*, *Skill Resource Materialisation Boundary*, *Skill Eligibility Gate*" | abstract, listing page, PDF text extraction | **Cannot verify** | **None of the three terms surfaced** in the abstract, the listing page or a PDF extraction; the four layer names that did surface are different words. This is the same failure shape the earlier pass had — citing a source for wording the source may not use. Either quote the pattern names from the paper body or drop the attribution |
| G3 | napoln#113: "a repo walk offered and installed test-data skills, three of which fail validation *by design*" | [raiderrobert/napoln#113](https://github.com/raiderrobert/napoln/issues/113) | **Agree** | Open, 2026-09-04, 0 comments. Verbatim: "`napoln add larksuite/cli --all` offers/installs them alongside the real skills, and three of them fail validation by design". Note it is the **`napoln`** tool discovering **`larksuite/cli`'s** fixtures — not `npx skills` |
| G4 | "Sablier's convention: keep meta-skills at `.agents/internal-skills/`, outside any container dir" | `sablier-labs/sablier-skills` tree | **Agree** — and stronger | The repo holds `.agents/internal-skills/sync-create-skills.md` and `sync-pair-skills.md` as bare **`.md`** files, not `SKILL.md`, so they are not skills at all — belt and braces. Attribution nit: this example comes from **#572**, not napoln#113 where the addendum places it. #572's own link still points at the old `.agents/skills/sync-create-skills/SKILL.md`, which *is* inside a container dir |
| G5 | Snyk ToxicSkills: 3,984 scanned | [snyk.io](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/) | **Agree** | "scanning 3,984 skills from ClawHub" |
| G6 | 1,467 (36.82%) with ≥1 flaw | same | **Agree** | "36.82% (1,467 skills) have at least one security flaw" |
| G7 | 534 (13.4%) critical | same | **Agree** | "13.4% of all skills, or 534 in total, all contain at least one critical-level security issue" |
| G8 | 76 confirmed malicious | same | **Agree** — wording nit | Source says "76 malicious **payloads**", confirmed through HITL; it also reports 8 still publicly available at publication. **Scope caveat worth adding:** the population is **ClawHub**, not skills.sh, and the study published 5 Feb 2026 — the addendum presents the figures in a skills.sh-channel section without naming the population |
| G9 | CSA research note is real (6 May 2026) | [CSA labs](https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/) | **Agree** | "Agent Context Poisoning: SKILL.md and the New AI Supply Chain Attack Surface", 6 May 2026 |
| G10 | "aggregates rather than scans" | same | **Agree** | Synthesises third-party findings, chiefly Snyk's Feb 2026 audit |
| G11 | "its CVE-2025-59536 citation is a stretch — that disclosure concerns `.claude/settings.json` hooks, not skills" | same | **Agree** | The note itself describes the CVE as a hook command in `.claude/settings.json` executing arbitrary shell instructions — a project-configuration vector, not a skill one |
| G12 | OWASP Agentic Skills Top 10 v1.0 exists | [OWASP project page](https://owasp.github.io/www-project-agentic-skills-top-10/) | **Agree** | v1.0 released 17 Aug 2026; maps to AISVS v1.0, MCP Top 10, ISO/IEC 42001, NIST AI RMF |
| G13 | "skills.sh now surfaces third-party verdicts at `/audits`" | [skills.sh/audits](https://www.skills.sh/audits) | **Agree** | "Combined security audit results from Gen Agent Trust Hub, Socket, and Snyk" |

---

## 6. Repo-local claims

| # | Claim | Command | Verdict |
|---|---|---|---|
| H1 | `.claude-plugin/marketplace.json` declares exactly **7** Vortex agent paths | `jq '.plugins[0].skills \| length' .claude-plugin/marketplace.json` | **Agree** — 7 entries, one per Vortex agent (`contextualization-expert`, `discovery-empathy-expert`, `research-convergence-specialist`, `hypothesis-engineer`, `lean-experiments-specialist`, `production-intelligence-specialist`, `learning-decision-expert`), and **all 7 hold a tracked `SKILL.md`** |
| H2 | Exactly **2** `SKILL.md` tracked under `.claude/skills/` | `git ls-files \| grep -c '^\.claude/skills/.*SKILL\.md$'` | **Agree** — `bmad-audit-skill-dirs`, `bmad-register-skill` |
| H3 | *(addendum)* whitelisted at `.gitignore:66-71` | `sed -n '66,71p' .gitignore` | **Agree** — exactly those six lines: `!.claude/`, `.claude/*`, `!.claude/skills/`, `.claude/skills/*`, then the two skill directories |
| H4 | *(PRD)* **38** non-product `SKILL.md` | `git ls-files \| grep 'SKILL\.md$' \| grep -cE '^tests/\|^_bmad-output/'` | **Agree** as a count — 31 `tests/fixtures/portability-project` + 6 `tests/fixtures/bmm-dependencies` + 1 `_bmad-output/exp3-smoke-test` = 38, out of 75 tracked `SKILL.md`. The *reachability* claim attached to this number is wrong; see A12/A13 |

---

## 7. What the requirements should change

Not requirements — the smallest set of edits the findings force.

1. **SM6's baseline is 7, not 38** (A12/A13). The target of zero is unaffected, but the
   figure must carry the command, and Defect 0's "reachable only via `--full-depth`"
   needs the depth-5 bound stated.
2. **OQ-2 closes with a qualification, not a yes/no** (§0). `metadata.internal`
   suppresses the CLI; it does not delist an already-indexed page; and it is unproven
   for a never-indexed skill. Item 0 may rely on the CLI half only.
3. **FR3 is not satisfiable by `metadata.internal` alone** — `--skill <name>` sets
   `includeInternal` and installs internal skills without the env var. FR3 says
   "including explicitly-flagged paths"; that path is open.
4. **Defect 0's residual "name-shadowing class" should be restated** as the
   install-destination overwrite, not issue #353's intra-repo discovery race (E5/E6).
   As written it points at a mechanism that cannot reach Convoke.
5. **A9's "one `.gitignore` change from firing" should be struck.** The manifest keeps
   `skills.length` non-zero; the fallback cannot fire from that change alone. This
   removes one of Defect 0's three "still live" items.
6. **FR10-FR12's mechanism sentence needs correcting** (D4): remote marketplace plugins
   fail because the file was never copied, not because the path was rejected.
   Rejection is a separate rule about *declared component paths*.
7. **OQ-3 should not assume semver resolution is available** until upstream BMAD tags
   `<plugin-name>--v<version>` on a git-backed source (D9).
8. **Three figures in §2 need re-deriving or dropping**: NVIDIA ~100 → 383,
   scenario-labs 122 → 128, and the arXiv three-term vocabulary → unattributed (G2).
   NFR5 already requires the commands; these three are where it was not applied.
