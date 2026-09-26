---
title: 'Channel Integrity — addendum'
initiative: convoke
artifact_type: note
qualifier: channel-integrity-addendum
status: draft
created: '2026-09-26'
updated: '2026-09-26'
schema_version: 1
qualifier_role: operator-authored
---

# Channel Integrity — addendum

Mechanism, landscape and options-considered. Nothing here is a requirement. Every
claim carries its source; claims this session could not verify are labelled.

## 1. How the two channels actually work

### `npx skills` / skills.sh — no dependency mechanism

**Discovery is a bounded walk over a fixed list, not a crawl.** From the
[CLI README](https://github.com/vercel-labs/skills):

> Each skill container directory is walked up to three levels deep […] A `SKILL.md`
> discovered at a shallower level shadows anything nested below it. **Use
> `--full-depth` to also discover `SKILL.md` files outside these container
> directories (e.g. under `examples/` or `tests/`).**

The list includes the repo root, `skills/`, `skills/.curated/`, `.claude/skills/`,
`.agents/skills/` and roughly twenty more agent-specific paths. Two consequences:

1. **Manifest-declared paths bypass the walk entirely.** > "Skill paths declared in
   a manifest are searched at their declared depth and are not subject to the
   bounded depth-3 catalog walk described above." `.claude-plugin/marketplace.json`
   and `plugin.json` are both parsed. **This is how Wade became discoverable** —
   Convoke's own manifest declares `./_bmad/bme/_vortex/agents/lean-experiments-specialist`,
   five levels deep and outside every container directory. The manifest is
   Convoke's discovery surface, and it lists 7 of 11 agents.
2. **A recursive fallback exists, conditionally.** > "If no skills are found in
   standard locations, a recursive search is performed." Convoke has two tracked
   `SKILL.md` under `.claude/skills/` (whitelisted at `.gitignore:66-71`), so the
   fallback does not fire today. It is one `.gitignore` change away from firing.

**Exclusion is per-skill and shipped.** README §frontmatter:

> `metadata.internal`: Set to `true` to hide the skill from normal discovery.
> Internal skills are only visible and installable when `INSTALL_INTERNAL_SKILLS=1`
> is set.

[Issue #572](https://github.com/vercel-labs/skills/issues/572) remains open because
it requests a *repo-level* mechanism; it explicitly rejected `.skillsignore` as
"unnecessary configuration overhead" and `_`-prefix conventions as "implicit and
fragile". ⚠️ **Unverified by this session:** research reports the flag suppresses the
CLI but **not** the skills.sh web listing ([#1578](https://github.com/vercel-labs/skills/issues/1578),
a skill listed publicly despite `metadata.internal: true`). **Check this before
designing on the flag.**

**No dependency mechanism at all.** [Issue #515](https://github.com/vercel-labs/skills/issues/515)
(Mar 2026, unanswered): if skill A needs skill B, A must bundle everything or hope B
is installed. **No self-serve retraction**: deleted skills remain listed
([#1578](https://github.com/vercel-labs/skills/issues/1578)); delisting is done by
hand by Vercel staff.

### Claude Code plugin marketplaces — real dependencies, hard path boundary

From the [plugin loading reference](https://code.claude.com/docs/en/plugins/loading):
a remote plugin is copied to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`,
which is what `${CLAUDE_PLUGIN_ROOT}` points at. > "Files outside the plugin
directory aren't copied, so when a script inside a copied plugin reads a path above
the plugin root, such as `../shared`, it doesn't find them." Paths escaping the
plugin root are rejected.

**This is the mechanism behind defect (2).** Convoke's capability references use bare
paths (`_bmad/bme/_vortex/workflows/mvp/workflow.md`). Under the v6.3 convention
bare paths resolve from skill root; under a plugin install the skill root is the
cache directory. Neither resolution reaches the workflow.

Unlike skills.sh, marketplaces have a real dependency system —
[semver `dependencies`](https://code.claude.com/docs/en/plugins/dependencies),
constraint intersection, `allowCrossMarketplaceDependenciesOn`, and a
**bundle-as-plugin** idiom (a manifest carrying only `name` + `dependencies`).

**The channels are asymmetric on exactly the axis that matters to Convoke.**

## 2. How comparable suites solve coherence

| Project | Channels | Mechanism |
|---|---|---|
| **BMAD-METHOD** (30 skills) | skills.sh only | Sidecar `bmod.toml` per skill with `required_skills = [{skill="bmad", version=…}]` — the only machine-readable skill→skill dependency found anywhere. `bmad` hub materialises `{project-root}/_bmad/`. Hard gate: missing runtime → read sibling `bmad` SKILL.md and run setup. Non-invocable *module-record* skills. |
| **bmad-plugins** | CC + Codex marketplaces | Same trees, older `module-manifest.toml`, **no `required_skills`, no plugin `dependencies`**. Upstream's own marketplace copy is a generation behind its skills.sh copy. |
| **CIS suite** (11) | skills.sh only | Per-skill runtime self-diagnosis: each agent reads its own `bmod.toml` and offers the exact `npx skills add … --skill …`. |
| **scenario-labs/skills** (122) | both; marketplace **generated** from `skills.sh.json` | Prose degradation contract in 121/122 files + `references/dependencies.md`. Real code coupling via sibling-dir imports. |
| **huggingface/skills** (26) | both | Marketplace exposes **one** plugin (`hf-cli`); the other 25 arrive via `hf skills add`. **Ship the installer, not the suite.** |
| **NVIDIA/skills** (~100) | both | Same asymmetry: one router plugin on the marketplace, full catalog on skills.sh. |
| **anthropics/skills** | both | "Each skill is self-contained in its own folder." No hub, no shared runtime. |

**Patterns worth naming:** hub-skill-bootstraps-runtime (common); **router-stub on the
marketplace + full catalog on skills.sh** (HF, NVIDIA — channel asymmetry as
deliberate design); prose degradation contract in every skill; marketplace generated
from a skills.sh grouping file. Sidecar-declared dependencies are BMAD-family only.

⚠️ **"Personaless process skills as connective tissue" is this session's own coinage,
not a published pattern.** The citable vocabulary is
[arXiv 2606.20631](https://arxiv.org/abs/2606.20631) — *Skill Extension Bundle*,
*Skill Resource Materialisation Boundary*, *Skill Eligibility Gate*.

## 3. Failure modes on the record

- **Shadowing by claimed name.** [vercel-labs#353](https://github.com/vercel-labs/skills/issues/353)
  (open): first-match-wins dedup by frontmatter `name` lets one repo's skill shadow
  another's. This is the class Convoke's 38 fixtures sit in.
- **Fixture skills installed for real.** [raiderrobert/napoln#113](https://github.com/raiderrobert/napoln/issues/113)
  — a repo walk offered and installed test-data skills, three of which fail
  validation *by design*. The closest published analogue to Convoke's exposure.
  Sablier's convention: keep meta-skills at `.agents/internal-skills/`, outside any
  container dir.
- **Security baseline.** [Snyk ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/):
  3,984 skills scanned, **1,467 (36.82%)** with ≥1 flaw, **534 (13.4%)** critical,
  **76** confirmed malicious. [CSA research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/)
  is real (6 May 2026) but aggregates rather than scans, and its CVE-2025-59536
  citation is a stretch — that disclosure concerns `.claude/settings.json` hooks,
  not skills. [OWASP Agentic Skills Top 10 v1.0](https://owasp.github.io/www-project-agentic-skills-top-10/)
  exists. skills.sh now surfaces third-party verdicts at `/audits`.

## 4. Options considered for the distribution unit

Recorded so the architecture decision has a trail. **Not decided here.**

- **S1 — installer-led.** npm + `convoke-install-*` is the only supported path;
  crawled listings become funnel entries that refuse to run and say why. Cheapest.
  Serves the 40% standalone segment; starves the 60% addon segment.
- **S2 — channel-native, corrected.** Not "atomize the personas." Promote the 30
  workflows and 14 contracts to addressable personaless skills; personas go thin;
  the module remains the unit of *coherence* (`config.yaml` + contracts) and stops
  being the unit of *distribution*. Sells nothing; publishes the differentiator.
- **S3 — two artifacts, one source.** `_bmad/bme/` stays the authoring source; a
  build step emits the channel tree. Serves both segments. Cost: a generator, and a
  drift gate between source and artifact.
- **S4 — router stub, added after research.** One installer/finder plugin on the
  marketplace, full catalog on skills.sh. The only pattern two large suites (HF,
  NVIDIA) actually run in production, and it uses the channel asymmetry instead of
  fighting it.

