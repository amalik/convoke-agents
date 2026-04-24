---
initiative: convoke
artifact_type: story
qualifier: v63-3-1-create-and-validate-marketplace-metadata
created: '2026-04-24'
schema_version: 1
epic: v63-epic-3
---

# Story 3.1: Create and validate marketplace metadata

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 3 — Discover via BMAD Marketplace](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-3-discover-via-bmad-marketplace)
**Sprint:** 4 (WS2/P23 marketplace stream)
**FR coverage:** FR19 (`.claude-plugin/marketplace.json` passes PluginResolver), FR20 (references `_bmad/bme/_vortex/module.yaml` as `module_definition`), partial FR23 (file-level preflight groundwork; runtime preflight ships in Story 3.2).
**NFR coverage:** NFR11 (marketplace.json conforms to BMAD `registry-schema.yaml`), NFR12 (agent SKILL.md files conform to v6.3 skill-dir convention), NFR13 (module.yaml conforms to BMAD expected schema).
**Failure modes addressed:** FM5-1 (skills[] paths lack SKILL.md — pre-submission audit catches this).
**Upstream dependencies:**
- Epic 1A shipped the baseline Convoke 4.0 filesystem structure (config.yaml, version stamp, agent files). Story 3.1 consumes that structure as input.
- **No upstream code dependencies** — Epic 3 is distribution/compatibility scope, NOT governance (Epic 2 territory). Zero imports from `scripts/audit/audit-bmm-dependencies.js`, `scripts/convoke-doctor.js`, `scripts/update/convoke-update.js`, `scripts/convoke-register-skill.js`.

**Downstream consumers:**
- **Story 3.2** (compatibility preflight + `audit-skill-dirs.js`) — scans the skill directories Story 3.1 creates, validates v6.3 frontmatter continues to hold.
- **Story 3.3** (submit marketplace registry PR) — requires 3.1's `marketplace.json` + audit to be green before the PR can be opened.
- **Story 3.4** (dual-distribution parity verification) — compares npm install vs. marketplace install; both paths must produce identical `.claude/skills/` layout.
- **Story 3.5** (platform adapter batch validation) — iterates over 3.1's canonical `skills[]` array (the 7 Vortex agents).

**Namespace decision:**
- `.claude-plugin/marketplace.json` at repo root — this is BMAD's canonical marketplace-metadata location per Decision 5. NOT gitignored (the `.claude/` gitignore entry doesn't cover `.claude-plugin/`).
- `_bmad/bme/_vortex/module.yaml` under the Vortex module — this is the `module_definition` target that PluginResolver will resolve. Sits alongside existing `_bmad/bme/_vortex/config.yaml` (which stays as-is; config.yaml is runtime config, module.yaml is publisher metadata).
- `_bmad/bme/_vortex/agents/<agent-name>/SKILL.md` — new directory-per-agent layout replacing today's flat `<agent-name>.md`. See Decision 1 below.
- `scripts/audit/validate-marketplace.js` + `tests/unit/validate-marketplace.test.js` — new validator CLI + tests. Pattern reuse from Story 2.1's `audit-bmm-dependencies.js`.
- **Covenant compliance checklist:** NOT applicable — no new `_bmad/bme/*` skill is being authored; Vortex agents are being re-shaped, not created.

## Story

As a new user browsing the BMAD community module browser,
I want Convoke listed with valid marketplace metadata that PluginResolver can validate,
so that I can install Convoke through the BMAD marketplace (not just via `npm install convoke-agents`) and have the same result.

**Scope note on coupling:** Marketplace metadata (`marketplace.json` + `module.yaml`) requires that the paths in `skills[]` resolve to directories containing `SKILL.md` with v6.3 frontmatter (NFR12). Today, the 7 Vortex agents live as **flat `.md` files** at `_bmad/bme/_vortex/agents/<name>.md`, not as directories with `SKILL.md`. Ergo, shipping valid marketplace metadata requires restructuring the agents. This coupling is explicit in Decision 1 below.

## Acceptance Criteria

**Decision 1 (pinned):** Bundle agent skill-dir migration into Story 3.1. FM5-1 audit (AC5) cannot pass without the underlying skill-dir structure existing; splitting would ship broken metadata or block the entire epic. Coupling adds substantial scope (see AC3 + AC4 + AC9 + revised Dev Notes LOC projection); keeps the story self-contained. If dev-time implementation reveals an unexpected historical-migration blocker, HALT and surface to user.

**Decision 2 (pinned): `AGENT_FILES` registry shape + Gyre parity.** The current `scripts/update/lib/agent-registry.js` exports `AGENT_FILES = AGENTS.map(a => '${a.id}.md')` and `GYRE_AGENT_FILES = GYRE_AGENTS.map(a => '${a.id}.md')`. Both are consumed by `refresh-installation.js`, `validator.js`, and tests. Post-migration, these flat-filename strings no longer match on-disk reality.
- **(a) Migrate Vortex only; keep Gyre flat-`.md` (selected).** Story 3.1's marketplace.json `skills[]` lists 7 Vortex agents — ONLY Vortex needs skill-dir conformance for Epic 3. Gyre stays flat-`.md` to bound story scope. Registry adds **new** exports `VORTEX_SKILL_PATHS = AGENTS.map(a => '${a.id}/SKILL.md')` alongside the now-legacy `AGENT_FILES`. `AGENT_FILES` is NOT removed (other call-sites may reference it); it's relabeled in JSDoc as "legacy — prefer `VORTEX_SKILL_PATHS` post-3.1." Gyre's `GYRE_AGENT_FILES` unchanged.
- **(b) Migrate both Vortex and Gyre in one story** — rejected: doubles the migration blast radius; Gyre has no marketplace entry in Decision 5's template; Epic 4 validation gate (Story 4.1) is the natural place to revisit Gyre's layout if needed.
- **(c) Repurpose `AGENT_FILES` shape** — rejected: breaks all downstream consumers silently; relabel-and-add is safer.

**Upshot:** `_bmad/bme/_vortex/agents/` ends up with skill-dirs; `_bmad/bme/_gyre/agents/` stays flat. Mixed layout is explicit and documented. Every consumer of `AGENT_FILES` / `GYRE_AGENT_FILES` is audited in AC4.

---

**AC1 — `.claude-plugin/marketplace.json` at repo root, matching Architecture Decision 5.**
**Given** a new file at [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json)
**When** it's parsed by any JSON reader or by BMAD's PluginResolver
**Then** it MUST match the shape specified in [convoke-arch-bmad-v6.3-adoption.md §Decision 5](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-5-marketplace--distribution-architecture-wr5) verbatim, with these field requirements:
- Top-level: `name: "convoke"`, `owner: { name: "Amalik Amriou" }`, `license: "MIT"`, `repository: "https://github.com/amalikamriou/convoke-agents"`, `keywords` (array of 5 strings), `plugins` (array with one entry).
- Plugin entry: `name: "convoke-vortex"`, `source: "./"`, `description` (single sentence matching Decision 5's exact wording), `version: "4.0.0"`, `author: { name: "Amalik Amriou" }`, `skills` (array of 7 directory paths).
- `skills[]` must list EXACTLY the 7 Vortex agent directory paths in Decision 5's listing order (contextualize, empathize, synthesize, hypothesize, externalize, sensitize, systematize).

**And** the file MUST be valid JSON (parseable without syntax errors — `JSON.parse` succeeds).

**And** the `repository` field MUST match `package.json.repository.url` exactly — verify via E4 before commit. Today `package.json` line 74 declares `git+https://github.com/amalik/convoke-agents.git` (note: `amalik`, not `amalikamriou`). Architecture Decision 5's marketplace template declares `https://github.com/amalikamriou/convoke-agents`. This is a **real mismatch** that Story 3.1 must resolve — either fix the typo in `package.json.repository.url`, or update Decision 5's marketplace template. **Decision 3 (pinned below):** fix package.json (most likely the typo, given user handle `amalikamriou`).

**Decision 3 (pinned):** `package.json.repository.url` has a typo (`amalik` → `amalikamriou`). Fix by editing `package.json` in Story 3.1's commit; add a regression test case in AC6 asserting `marketplace.json.repository === require('../../package.json').repository.url.replace(/^git\+/, '').replace(/\.git$/, '')` — exact string match after normalization.

**And** `version` field handling — today `package.json.version` = `"3.3.0"`; at 4.0 tag, it becomes `"4.0.0"`. Story 3.1 ships `marketplace.json.plugins[0].version = "4.0.0"` (the ship-time value) as a hardcoded literal for the publication artifact. AC5 check #6 emits a WARNING at dev time (3.3.0 vs 4.0.0 mismatch expected); **that warning MUST escalate to a hard ERROR at the publish gate** (Story 3.3's pre-PR validator). This is a forward-intent for Story 3.3 — not part of 3.1's own exit criteria, but 3.1 documents the intent so 3.3 doesn't ship with the drift unresolved.

**AC2 — `_bmad/bme/_vortex/module.yaml` declares module metadata for PluginResolver.**
**Given** a new file at [`_bmad/bme/_vortex/module.yaml`](../../_bmad/bme/_vortex/module.yaml)
**When** PluginResolver reads it (or the local validator parses it)
**Then** it MUST contain these fields matching BMAD's expected module.yaml schema (inferred from the shipped `node_modules/convoke-agents/src/module.yaml` reference + Decision 5 + BMAD v6.3 distribution docs):
- `code: bme` — module identifier matching the parent directory convention.
- `name: "Convoke: Vortex Discovery Framework"` — human-readable module name for installer UI.
- `header: "Convoke — Vortex Discovery Framework"` — installer banner.
- `subheader: "7 AI agents for product discovery based on the Shiftup Innovation Vortex"` — installer subtitle.
- `description: "Domain-specialized agent teams for structured product discovery: Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, Systematize"` — long-form description.
- `default_selected: false` — installer opt-in default; don't auto-activate.

**And** the file MUST be valid YAML (parseable via `js-yaml` / `yaml` — already in dependencies).

**And** the file MUST sit alongside the existing [`_bmad/bme/_vortex/config.yaml`](../../_bmad/bme/_vortex/config.yaml) — `config.yaml` stays as-is (runtime operator config); `module.yaml` is publication metadata. Two files, different audiences (operator vs. PluginResolver), no content overlap.

**Dev-time spike note (tracked as DEF-SPIKE in Dev Agent Record):** BMAD v6.3's exact `module.yaml` schema is not published locally in the Convoke tree. The field set above is derived from (1) the Convoke 3.x shipped artifact at `node_modules/convoke-agents/src/module.yaml`, (2) the equivalent `_bmad/bmb/skills/module.yaml` example in the BMB builder module, (3) Architecture Decision 5's explicit template. Research-agent confidence: MEDIUM-HIGH. If the dev agent discovers a required field not in the list above during implementation (e.g., `module_version`, `bmad_version`, custom config prompts), ADD it with a JSDoc comment citing the source, don't silently expand.

**AC3 — All 7 Vortex agents migrated from flat `.md` to skill-dir format.**
**Given** today's source layout `_bmad/bme/_vortex/agents/<agent-id>.md` (7 flat files)
**When** Story 3.1 completes
**Then** the 7 agents MUST live at `_bmad/bme/_vortex/agents/<agent-id>/SKILL.md` (each a directory containing SKILL.md):
- `contextualization-expert/SKILL.md`
- `discovery-empathy-expert/SKILL.md`
- `research-convergence-specialist/SKILL.md`
- `hypothesis-engineer/SKILL.md`
- `lean-experiments-specialist/SKILL.md`
- `production-intelligence-specialist/SKILL.md`
- `learning-decision-expert/SKILL.md`

**And** each `SKILL.md` MUST have v6.3-compliant frontmatter:
- `name:` MUST equal the hyphenated agent directory name (e.g. `contextualization-expert`) — **normalized from the current two-word quoted form** (`name: "contextualization expert"`). PluginResolver + BMAD v6.3 skill-dir convention expects `name == directory-basename`; the existing `.claude/skills/bmad-agent-bme-<id>/SKILL.md` runtime wrappers already use hyphenated `name: bmad-agent-bme-<id>`. Source-side normalization brings frontmatter into alignment.
- `description:` — current short description preserved verbatim (e.g. `"Contextualization Expert"`). Only `name:` is normalized in Story 3.1.

**Normalization rule (deterministic):** `newName = agentId` where `agentId` is the directory name (same as the ID in `AGENT_IDS` from `agent-registry.js`). Example: `"contextualization expert"` → `contextualization-expert`. All 7 agents get this treatment; the mapping is exactly the current directory names Story 3.1 is creating.

**And** the move MUST preserve file content (body prose) — no re-authoring of agent body text in Story 3.1. ONLY the `name:` frontmatter field changes; everything else (description, body paragraphs, instructions) is byte-identical to the pre-migration flat file.

**Tests:** AC6 case 13 asserts "for each agent, `SKILL.md`'s `name:` frontmatter equals the directory basename" (enforced via `js-yaml` parse of the frontmatter block). AC6 case 14 asserts "body content byte-identity": given a checksum of each old flat `.md` file (pre-move), after AC3 completes, the same content appears verbatim after the frontmatter block in the new `SKILL.md`.

**And** the move SHOULD use `git mv <old> <new>` (or equivalent staged-move semantics) so git history is preserved through the rename. The dev agent MUST verify `git log --follow _bmad/bme/_vortex/agents/<name>/SKILL.md` shows the full prior history.

**Anti-pattern:** do NOT create `SKILL.md` stubs that just `require` or reference the old flat `.md` content. The SKILL.md file IS the canonical agent definition post-migration.

**Anti-pattern:** do NOT leave the old flat `.md` files in place alongside the new skill-dirs. The repo must have ONE source-of-truth per agent. Duplicating risks future drift.

**AC4 — Install + refresh + validator + doctor + registry + test-helpers updated for new Vortex skill-dir layout.**

This is the **largest AC in Story 3.1** — the migration's path-shape change radiates across 6 files. Every edit site enumerated explicitly below; the dev agent MUST update each without dropping any.

**Edit sites (verified against current repo state):**

1. **`scripts/update/lib/agent-registry.js`** — add `VORTEX_SKILL_PATHS = AGENTS.map(a => '${a.id}/SKILL.md')`; keep `AGENT_FILES` (legacy flat shape) for any non-migrated consumers but annotate JSDoc `@deprecated use VORTEX_SKILL_PATHS post-v4.0 migration`. Do NOT modify `GYRE_AGENT_FILES` (Decision 2: Gyre stays flat).

2. **`scripts/update/lib/refresh-installation.js`** — update **6 edit sites**:
   - **Line 55-56:** `for (const file of AGENT_FILES) { ... const agentId = file.replace(/\.md$/, '') ... }` — switch to iterating `VORTEX_SKILL_PATHS` OR compute new path shape; the agentId derivation changes.
   - **Lines 484, 494:** manifest rows with `` `_bmad/bme/${submodule}/agents/${a.id}.md` `` — update to `` `_bmad/bme/${submodule}/agents/${a.id}/SKILL.md` `` ONLY for the Vortex/bme-Vortex branch. The Gyre branch (also bme) stays flat — may need submodule discrimination.
   - **Lines 512, 522:** same manifest-row pattern in the `EXTRA_BME_AGENTS` branch — verify per-agent whether the submodule is Vortex (migrated) or Gyre (flat); apply the correct path shape per agent.
   - **Lines 632:** `` LOAD the FULL agent file from {project-root}/_bmad/bme/_vortex/agents/${agent.id}.md `` — this is the **runtime skill-wrapper LOAD instruction** written INTO `.claude/skills/bmad-agent-bme-<id>/SKILL.md`. Update to `` /_bmad/bme/_vortex/agents/${agent.id}/SKILL.md ``. **This is the v3.x→v4.0 upgrade landmine: if this isn't updated, every existing operator's agents break on next `convoke-update`.** (See AC9.)
   - **Line 658:** identical pattern for Gyre — keep pointing at flat `.md` (Decision 2).
   - **Line 683:** identical pattern for `EXTRA_BME_AGENTS` — discriminate per agent's submodule.

3. **`scripts/install-vortex-agents.js`** — update **ALL occurrences** of the flat-path string, not just line 110:
   - **Line 110:** `{ path: '_bmad/bme/_vortex/agents/${a.id}.md', ... }` → `{ path: '_bmad/bme/_vortex/agents/${a.id}/SKILL.md', ... }`.
   - **Line 160:** `console.log(... \`cat _bmad/bme/_vortex/agents/{agent-id}.md\` ...)` — operator-facing hint; update the shown path to `{agent-id}/SKILL.md`.
   - Verify no other occurrences via `grep -n 'agents/.*\.md' scripts/install-vortex-agents.js` before marking Task done.

4. **`scripts/convoke-doctor.js`** — update **4 edit sites** (verified at lines 226/231/237/244/252):
   - **Line 226:** the `error: 'agents/ directory not found'` check — unchanged semantically, keep.
   - **Line 231:** `agentIds.filter(id => !fs.existsSync(path.join(agentsDir, \`${id}.md\`)))` → `agentIds.filter(id => !fs.existsSync(path.join(agentsDir, id, 'SKILL.md')))` for Vortex branch. If the function is shared across Vortex + Gyre, discriminate by passing the submodule context.
   - **Line 237:** error message `'Missing: ${missing.map(id => \`${id}.md\`).join(\', \'))}'` → `'Missing: ${missing.map(id => \`${id}/SKILL.md\`).join(\', \')}'`.
   - **Line 244:** `fs.statSync(path.join(agentsDir, \`${id}.md\`))` → `fs.statSync(path.join(agentsDir, id, 'SKILL.md'))`.
   - **Line 252:** error message `'Empty agent files: ${empty.map(id => \`${id}.md\`)...}'` → `.join('/SKILL.md')` or equivalent.

5. **`scripts/update/lib/validator.js`** — update **line 113** (and any paired line at line ~130 if the validator paginates):
   - `const agentsDir = path.join(projectRoot, '_bmad/bme/_vortex/agents');` stays (directory still correct).
   - The iteration over `AGENT_FILES` needs to switch to `VORTEX_SKILL_PATHS` or `fs.existsSync(path.join(agentsDir, agentId, 'SKILL.md'))`.

6. **`tests/helpers.js`** — update **`createValidInstallation`** at lines 94-117 (specifically line 106): `fs.writeFile(path.join(agentsDir, '${agentId}.md'), ...)` → create directory + SKILL.md for each Vortex agent; keep flat `.md` shape for Gyre agents if `createValidInstallation` also covers Gyre (verify). The helper's fake-fixture shape MUST match the real post-migration layout or every test using it produces a non-v6.3-compliant fixture that masquerades as valid.

**And** the runtime target `.claude/skills/bmad-agent-bme-<id>/SKILL.md` MUST remain at the same path for end users. The **CONTENT** of that file changes (the LOAD instruction at refresh-installation.js:632 shifts from flat path to `<id>/SKILL.md`); the FILENAME + DIRECTORY stay identical. Pre-existing operators whose `.claude/skills/` was generated under flat-path semantics will see the LOAD instruction auto-update on the next `convoke-update` run — this is what AC9 regression-tests.

**And** existing integration tests MUST continue to pass post-migration: [`tests/integration/upgrade.test.js`](../../tests/integration/upgrade.test.js) (29 cases), [`tests/unit/convoke-update-governance.test.js`](../../tests/unit/convoke-update-governance.test.js) (10 cases). The `createInstallation(tmpDir, version)` helper — which uses `refreshInstallation` internally — MUST produce the correct post-migration layout without test modifications.

**Pre-work verification:** before making any source edits (AC3 or AC4), grep the entire `scripts/` tree for `_bmad/bme/_vortex/agents/.*\.md` to catch any flat-path reference this list missed. Add to the edit list if found; report in Dev Agent Record.

---

**AC7 — Scope discipline: narrow out-of-scope boundary.**

**Out of scope for Story 3.1 (strict):**
- `scripts/audit/audit-bmm-dependencies.js` — Story 2.1's territory, no changes.
- `scripts/update/convoke-update.js` — Story 2.3's territory, no changes.
- `scripts/convoke-register-skill.js` — Story 2.4's territory, no changes.
- `_bmad/_config/bmm-dependencies.csv` — governance registry, no changes.

**IN scope (must update despite not being Epic 3-authored originally):**
- `scripts/convoke-doctor.js` — 4 edit sites per AC4.5 (doctor reads agent paths; migration breaks it if untouched). This overrides the naive "no Epic 2 code" boundary — the CORRECT invariant is "no Epic 2 *governance logic* changes," and doctor's Vortex-agent-path checks aren't governance logic.
- `scripts/update/lib/validator.js` — update-infrastructure, not governance; migration breaks it if untouched.
- `tests/helpers.js::createValidInstallation` — test infrastructure; fixture must match real layout.

**And** verifiable via `git diff HEAD --stat` prior to commit: the diff shows changes ONLY to the files in AC4's edit-sites list + AC3's 7 agent renames + AC1/AC2's 2 new metadata files + AC5's new validator + test + bin entry. No surprise files.

**AC5 — `scripts/audit/validate-marketplace.js` CLI for FM5-1 pre-submission validation.**
**Given** a new file at [`scripts/audit/validate-marketplace.js`](../../scripts/audit/validate-marketplace.js)
**When** invoked via `node scripts/audit/validate-marketplace.js` (or `convoke-validate-marketplace` bin)
**Then** it MUST perform these checks:
1. **JSON syntax:** `JSON.parse(.claude-plugin/marketplace.json)` succeeds.
2. **Required top-level fields:** `name`, `owner`, `license`, `repository`, `keywords`, `plugins` all present with correct types (object / string / string / string / array of strings / array of objects).
3. **Plugin entry structure:** exactly one plugin entry with all required fields (`name`, `source`, `description`, `version`, `author`, `skills`).
4. **FM5-1 skill-dir audit:** for each path in `plugins[0].skills[]`, verify the resolved directory exists under the repo AND contains a `SKILL.md` AND that `SKILL.md` has frontmatter with at least `name:` and `description:` keys.
5. **`module_definition` cross-check:** verify `_bmad/bme/_vortex/module.yaml` exists and is parseable YAML (even though `marketplace.json` doesn't currently inline a `module_definition` field, PluginResolver auto-discovers at the `_bmad/bme/_vortex/` location; check it's findable).
6. **Version drift check:** `marketplace.json.plugins[0].version` SHOULD match `package.json.version` (warn if they differ; don't error — the marketplace.json is a pinned publication artifact that may lag package.json during dev).

**And** the CLI MUST support these flags:
- `--dry-run` — run all checks, print results, exit 0 regardless of outcomes (for operator preview).
- `--verbose` / `-v` — print per-check pass/fail lines with green ✓ / yellow ⚠ / red ✗ per convoke-doctor convention.
- `--help` / `-h` — print usage.

**And** exit codes: 0 = all checks passed; 1 = one or more checks failed; 130 = SIGINT during interactive use (not expected in this CLI since there are no prompts — but consistent with Story 2.4's convention).

**And** the module MUST follow Pattern 1: shebang, `'use strict'`, `@module` JSDoc, `findProjectRoot()` lookup (no `process.cwd()` in helpers), `Object.freeze(_internal)` exports block with individual validators exposed for unit-level testing.

**Bin entry:** add `"convoke-validate-marketplace": "scripts/audit/validate-marketplace.js"` to `package.json` `bin`. Name aligned with `convoke-*` CLI convention; placement near `convoke-doctor` / `convoke-register-skill`.

**Anti-pattern:** do NOT reuse `scripts/audit/audit-bmm-dependencies.js` helpers for marketplace validation. Epic 3 is distribution/compatibility; Epic 2 is governance. The two audit tools are siblings, not a shared codebase. Copy the module skeleton (structure, Pattern 1 shape) but authorize independent evolution of each validator's internals.

**AC6 — Tests at `tests/unit/validate-marketplace.test.js`.**
**Given** tests run via `node --test tests/unit/validate-marketplace.test.js`
**When** the suite executes
**Then** these cases MUST pass (using fixture-based setup per `test-fixture-isolation`; `node:test` + `assert/strict`):
1. **Happy path** — fixture with valid marketplace.json + module.yaml + 7 skill-dirs → CLI exits 0 + all checks ✓.
2. **Missing `.claude-plugin/marketplace.json`** → exit 1 + actionable error ("marketplace.json not found — run Story 3.1 migration").
3. **Malformed JSON** (e.g., trailing comma) → exit 1 + JSON parse error in stderr.
4. **Missing required top-level field** (e.g., `owner` deleted from fixture) → exit 1 + error naming the missing field.
5. **Skill path doesn't exist on disk** — fixture `skills[0]` points at nonexistent dir → exit 1 + per-skill error line.
6. **Skill directory exists but lacks `SKILL.md`** — empty dir → exit 1 + FM5-1 error.
7. **SKILL.md lacks required frontmatter** — empty frontmatter block → exit 1 + frontmatter validation error.
8. **Missing `_bmad/bme/_vortex/module.yaml`** → exit 1 + "module_definition target not found" error.
9. **Malformed `module.yaml`** (bad YAML) → exit 1 + YAML parse error.
10. **Version drift warning** — `marketplace.json` says `4.0.0`, `package.json` says `3.3.0` → exit 0 + yellow ⚠ warning line (not a hard error; warning-only).
11. **`--dry-run` preserves exit 0** on FM5-1 failures (for operator preview — run, see results, no CI failure).
12. **Integration: install script post-migration** — spawn `install-vortex-agents.js` against a tmpDir with the NEW skill-dir source layout → assert `.claude/skills/bmad-agent-bme-<id>/SKILL.md` exists for all 7 agents with correct content.
13. **Frontmatter `name:` matches directory basename (AC3 normalization)** — for each migrated agent, parse its `SKILL.md` frontmatter via `js-yaml` and assert `name === agentId` (hyphenated, matches the directory name). Uses the `AGENT_IDS` constant from `agent-registry.js` as source of truth.
14. **Body content byte-identity (AC3 preservation)** — pre-migration fixture is a snapshot of the current `_bmad/bme/_vortex/agents/<id>.md` files (copy raw text into the test); post-migration SKILL.md body (everything after the frontmatter block) is byte-identical to pre-migration content. Test intentionally hard-codes a byte-level check against a known-good agent (e.g. `contextualization-expert`) with inline expected-content constant; other 6 agents asserted via size comparison.
15. **Wrong skill count in marketplace.json** — fixture with `plugins[0].skills` array containing 6 or 8 entries (instead of 7) → validator flags as error `"expected 7 Vortex agents; got N"`. Derived from `AGENT_IDS.length` at runtime (`derive-counts-from-source` rule).
16. **v3.x → v4.0 upgrade runtime-wrapper regression** (AC9 — non-negotiable) — as detailed in AC9 above; invokes `refreshInstallation` on a `createInstallation(tmpDir, '3.3.0')` fixture and asserts the runtime wrapper LOADs the new skill-dir path.
17. **Module `code:` mismatch** — fixture with `_bmad/bme/_vortex/module.yaml` containing `code: vortex` (should be `code: bme`) → validator flags error naming the expected value.
18. **Plugin name invariant** — fixture with `marketplace.json.plugins[0].name = "convoke-wrong"` → validator flags error asserting `plugins[0].name === "convoke-vortex"` (Decision 5 invariant + FR20).
19. **Repository URL parity (Decision 3)** — assert `marketplace.json.repository` equals `package.json.repository.url` (after git+ prefix + .git suffix normalization). Fails if either drifts; flags the exact mismatch.
20. **npm-pack verification (E3)** — spawn `npm pack --dry-run` in the project root; parse the resulting tarball file list; assert that all 7 `_bmad/bme/_vortex/agents/<id>/SKILL.md` files + `.claude-plugin/marketplace.json` + `_bmad/bme/_vortex/module.yaml` are present in the shipped package. Test SKIP-if-not-applicable (if `npm pack --dry-run` isn't available in the test env, skip with `t.skip()` + Dev Agent Record note).

**Per Epic 2 lessons (PI-6):** prefer AND-conjunction of specific substrings over `||` fallback. Assert on specific error messages, not generic "error" strings.

**Per Epic 2 lessons (PI-7):** N/A here — no interactive CLI prompts in this story (validator is non-interactive by design).

**Projected:** ~500–700 LOC / 20 test cases (up from the initial 12-case draft — validator correctly surfaced missing coverage for AC3 normalization + AC9 upgrade-path + invariant checks + npm-pack verification). Per Epic 1A retro PI-3 + Epic 2 refinement (baseline + ~40 LOC/HIGH + ~10 LOC/MED), this story's HIGH risk is medium-high (migration blast radius + runtime-wrapper edge cases); expect 2–4 HIGH findings at R1.

**AC8 — Performance: `validate-marketplace` CLI completes in ≤150ms on Convoke's current tree.**
**Given** the current Convoke repo (~7 Vortex agent SKILL.md files + 1 marketplace.json + 1 module.yaml)
**When** `time node scripts/audit/validate-marketplace.js` runs
**Then** wall-clock ≤150ms — tightened from the initial 500ms draft because the validator's workload (7 directory stats + 7 SKILL.md reads + 1 JSON parse + 1 YAML parse) is on the order of single-digit ms in practice; 150ms is meaningful regression headroom (≥5× the expected cost) without being so loose that a real slowdown hides.

**Rationale for tighter budget:** Story 2.3's `_runPostUpgradeGate` measured at 174ms doing roughly 10× more filesystem work than this validator. 500ms would tolerate a 30×-worse regression silently. 150ms catches anything worth investigating.

**AC9 — v3.x → v4.0 upgrade-path regression: runtime wrapper LOAD instruction reflects new source path.**
**Given** an operator's installation at Convoke 3.3.0 with `.claude/skills/bmad-agent-bme-<id>/SKILL.md` containing `LOAD the FULL agent file from {project-root}/_bmad/bme/_vortex/agents/<id>.md` (the pre-migration runtime wrapper shape, generated by the previously-shipped `refresh-installation.js:632`)
**When** the operator runs `convoke-update` to upgrade to 4.0, triggering `refreshInstallation(projectRoot, ...)`
**Then** the runtime wrapper at `.claude/skills/bmad-agent-bme-<id>/SKILL.md` MUST be rewritten with the new LOAD path `{project-root}/_bmad/bme/_vortex/agents/<id>/SKILL.md`. Verified by reading the file post-refresh and grepping for the new path (AND absence of the old flat-`.md` path).

**And** the agent-activation chain MUST work end-to-end after upgrade: given a fixture at Convoke 3.3.0, run `refreshInstallation(tmpDir, ...)` to simulate the upgrade, then assert that (a) `.claude/skills/bmad-agent-bme-<id>/SKILL.md` exists with the new LOAD path, (b) `_bmad/bme/_vortex/agents/<id>/SKILL.md` exists on disk (target of the new LOAD path), (c) the 7 agents' activation text is unchanged (body content byte-identical to pre-upgrade source).

**Test (AC6 case 16 — `createInstallation(tmpDir, '3.3.0')` → refresh → assert new-path LOAD):**
```js
it('v3.x → v4.0 upgrade rewrites runtime wrapper LOAD to new SKILL.md path (AC9)', async () => {
  const tmpDir = await createTempDir('bmad-v63-3-1-upgrade-');
  await createInstallation(tmpDir, '3.3.0'); // seeds v3.3.0 state
  await refreshInstallation(tmpDir, { backupGuides: false, verbose: false }); // simulates v4.0 upgrade
  for (const agentId of AGENT_IDS) {
    const wrapperPath = path.join(tmpDir, '.claude/skills', `bmad-agent-bme-${agentId}`, 'SKILL.md');
    const wrapper = await fs.readFile(wrapperPath, 'utf8');
    assert.ok(
      wrapper.includes(`_bmad/bme/_vortex/agents/${agentId}/SKILL.md`),
      `wrapper for ${agentId} must LOAD new skill-dir path; got:\n${wrapper}`,
    );
    assert.ok(
      !wrapper.includes(`_bmad/bme/_vortex/agents/${agentId}.md\n`) &&
      !wrapper.includes(`_bmad/bme/_vortex/agents/${agentId}.md `),
      `wrapper for ${agentId} must NOT reference old flat-.md path; got:\n${wrapper}`,
    );
    // Target of the new LOAD path must exist.
    const sourceSkillPath = path.join(tmpDir, '_bmad/bme/_vortex/agents', agentId, 'SKILL.md');
    assert.ok(await fs.pathExists(sourceSkillPath), `source SKILL.md missing for ${agentId}`);
  }
});
```

**Rationale:** This AC is the single most important regression gate in Story 3.1. Without it, every existing Convoke 3.x operator's 7 Vortex agents break silently on `convoke-update` (the runtime wrapper LOADs a path that no longer exists). The V-pass surfaced this as C5 — the spec author missed it entirely. The test case above is non-negotiable.

**Anti-pattern:** Do NOT rely on `convoke-doctor` catching this post-upgrade. Doctor checks agent file existence (AC4.4 fixes that check for the new shape), but doctor doesn't verify the runtime wrapper's LOAD-path string — a stale wrapper pointing at a non-existent path is undetectable by doctor. AC9's regression test is the only guard.

## Tasks / Subtasks

- [ ] **Task 1: Create `.claude-plugin/marketplace.json`** (AC1)
  - [ ] 1.1 `mkdir -p .claude-plugin/` at repo root. Add `.claude-plugin/` to any relevant gitignore / prettier / lint ignore lists as needed (likely none).
  - [ ] 1.2 Author `marketplace.json` with the exact shape from Architecture Decision 5, preserving the 7-agent `skills[]` listing order.
  - [ ] 1.3 Verify JSON parse with `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json', 'utf8'))"` — must succeed.

- [ ] **Task 2: Create `_bmad/bme/_vortex/module.yaml`** (AC2)
  - [ ] 2.1 Author `module.yaml` with the 6 fields specified in AC2 (code/name/header/subheader/description/default_selected), using the Decision 5 wording verbatim.
  - [ ] 2.2 Verify YAML parse with `node -e "require('js-yaml').load(require('fs').readFileSync('_bmad/bme/_vortex/module.yaml', 'utf8'))"` — must succeed.
  - [ ] 2.3 Sanity-check alignment with `_bmad/bme/_vortex/config.yaml` — same `code: bme`, same underlying module.

- [ ] **Task 3: Migrate 7 Vortex agents + normalize frontmatter + update docs** (AC3, C6, C7)
  - [ ] 3.1 For each of the 7 agents (IDs from [`scripts/update/lib/agent-registry.js`](../../scripts/update/lib/agent-registry.js) `AGENT_IDS`: `contextualization-expert`, `discovery-empathy-expert`, `research-convergence-specialist`, `hypothesis-engineer`, `lean-experiments-specialist`, `production-intelligence-specialist`, `learning-decision-expert`):
    1. `mkdir _bmad/bme/_vortex/agents/<agent-id>/`
    2. `git mv _bmad/bme/_vortex/agents/<agent-id>.md _bmad/bme/_vortex/agents/<agent-id>/SKILL.md`
    3. **Normalize frontmatter `name:`** — open `SKILL.md`, update `name: "<two-word form>"` to `name: <agent-id>` (hyphenated, matches directory basename). `description:` preserved verbatim.
    4. Verify body content is byte-identical to the pre-move flat file (only frontmatter `name:` changes).
  - [ ] 3.2 Verify git history preservation: `git log --follow _bmad/bme/_vortex/agents/<id>/SKILL.md` should show the full prior commit trail.
  - [ ] 3.3 Verify OLD flat `.md` files are GONE: `ls _bmad/bme/_vortex/agents/*.md 2>/dev/null | wc -l` returns 0.
  - [ ] 3.4 Grep repo-wide for any missed `_bmad/bme/_vortex/agents/.*\.md` references outside the files in AC4; add to edit list if found.
  - [ ] 3.5 **Update docs that reference flat paths (C7):**
    - [`docs/agents.md`](../../docs/agents.md) — update all `_bmad/bme/_vortex/agents/<name>.md` references to `<name>/SKILL.md`.
    - [`docs/development.md`](../../docs/development.md) — update onboarding `cp agents/<name>.md` example to the new layout.
    - Grep `docs/` tree for remaining flat-path references; update each.

- [ ] **Task 4: Update infrastructure for new source layout** (AC4 — 6 files, enumerated)
  - [ ] 4.0 **Pre-work:** run `node --test tests/integration/upgrade.test.js` BEFORE any source changes — establish 29/29 pass baseline.
  - [ ] 4.1 **`scripts/update/lib/agent-registry.js`** — add `VORTEX_SKILL_PATHS = AGENTS.map(a => '${a.id}/SKILL.md')` export; annotate existing `AGENT_FILES` JSDoc as `@deprecated — prefer VORTEX_SKILL_PATHS post-v4.0`. Keep `GYRE_AGENT_FILES` unchanged (Decision 2).
  - [ ] 4.2 **`scripts/update/lib/refresh-installation.js`** — update 6 edit sites:
    - Lines 55-56 (Vortex iteration) → switch to `VORTEX_SKILL_PATHS` or equivalent.
    - Lines 484, 494 — Vortex manifest-row paths.
    - Lines 512, 522 (`EXTRA_BME_AGENTS`) — discriminate per-agent submodule.
    - **Line 632 (CRITICAL — AC9 landmine):** runtime wrapper LOAD path `_bmad/bme/_vortex/agents/${agent.id}.md` → `${agent.id}/SKILL.md`.
    - Line 658 (Gyre wrapper) — KEEP flat path (Decision 2: Gyre stays flat).
    - Line 683 (`EXTRA_BME_AGENTS` wrapper) — discriminate per agent's submodule.
  - [ ] 4.3 **`scripts/install-vortex-agents.js`** — update line 110 (`verifyPaths`) + line 160 (operator-facing `console.log` hint); grep the file for other occurrences.
  - [ ] 4.4 **`scripts/convoke-doctor.js`** — update 4 edit sites (lines 231, 237, 244, 252) per AC4; each currently uses `${id}.md`, switch to `path.join(agentsDir, id, 'SKILL.md')`.
  - [ ] 4.5 **`scripts/update/lib/validator.js`** — update line 113 (+ paired iteration if paginated) to use `VORTEX_SKILL_PATHS` or skill-dir-shaped existence check.
  - [ ] 4.6 **`tests/helpers.js::createValidInstallation`** — update line 106: create `agentsDir/<agentId>/SKILL.md` (with minimal frontmatter `---\nname: <agentId>\ndescription: test fixture\n---\n# <agentId>\n`) instead of flat `agentsDir/<agentId>.md`. Gyre's equivalent (if present) stays flat per Decision 2.
  - [ ] 4.7 **Post-work validation:** re-run `tests/integration/upgrade.test.js` (29/29), `tests/unit/convoke-update-governance.test.js` (10/10), `tests/unit/validator.test.js` (all pass). Any failure → Task 4 incomplete; surface to user.
  - [ ] 4.8 **Scope-discipline grep:** `git diff HEAD --stat` at end of Task 4 shows modifications ONLY to the 6 files above + the 7 Task-3 renames + Task-1/2 new files + Task-5 validator + Task-6 tests + package.json bin+repository fix. No surprise edits.

- [ ] **Task 5: Implement `scripts/audit/validate-marketplace.js` CLI + bin** (AC5)
  - [ ] 5.1 Scaffold module per Pattern 1: shebang, `'use strict'`, `@module` JSDoc, `findProjectRoot()`, `_internal` frozen exports. Copy the skeleton from [`scripts/audit/audit-bmm-dependencies.js`](../../scripts/audit/audit-bmm-dependencies.js) as a template (module structure only — DO NOT share helpers with it).
  - [ ] 5.2 Implement 6 check functions as separate exported-via-`_internal` helpers: `validateMarketplaceJson(projectRoot)`, `validateTopLevelFields(parsed)`, `validatePluginEntry(parsed.plugins[0])`, `auditSkillDirs(plugins[0].skills, projectRoot)`, `validateModuleYaml(projectRoot)`, `checkVersionDrift(marketplaceVersion, pkgVersion)`. Each returns `{ passed: boolean, error?: string, warning?: string, info?: string }` matching Story 2.2's finding shape.
  - [ ] 5.3 Implement `main(argv)` dispatcher — parses flags, runs each check, renders results via chalk (green ✓ / yellow ⚠ / red ✗). Summary line: "All 6 marketplace checks passed" or "N hard failures, M warnings".
  - [ ] 5.4 Add `"convoke-validate-marketplace": "scripts/audit/validate-marketplace.js"` to `package.json` `bin`.
  - [ ] 5.5 `chmod +x scripts/audit/validate-marketplace.js`.
  - [ ] 5.6 **Decision 3 fix:** while editing `package.json`, correct `repository.url` from `git+https://github.com/amalik/convoke-agents.git` → `git+https://github.com/amalikamriou/convoke-agents.git`. Both edits land in the same commit so the repository URLs stay aligned.

- [ ] **Task 6: Tests at `tests/unit/validate-marketplace.test.js`** (AC6 — 20 cases)
  - [ ] 6.1 Scaffold: `describe('validate-marketplace CLI (Story v63-3-1)', () => {...})`. Import helpers from `tests/helpers.js` (`createTempDir`, `PACKAGE_ROOT`, `runScript`, `createInstallation`) + `AGENT_IDS` from agent-registry.
  - [ ] 6.2 Fixture helper `seedMarketplaceFixture(tmpDir, {variant})` — builds a tmpDir with valid marketplace.json + module.yaml + 7 skill dirs, then applies the test-specific variant (e.g., `{skipModuleYaml: true}`, `{malformedJson: true}`, `{wrongSkillCount: 6}`, `{moduleCodeMismatch: 'vortex'}`, etc.).
  - [ ] 6.3 Implement the 20 test cases in AC6. Prefer unit-level tests via `_internal` helpers; use `runScript` for CLI end-to-end.
  - [ ] 6.4 Test 12 integration: run `install-vortex-agents.js` against a tmpDir with the new source layout; assert all 7 `.claude/skills/bmad-agent-bme-<id>/SKILL.md` files land correctly.
  - [ ] 6.5 Test 16 integration (AC9 — non-negotiable): `createInstallation(tmpDir, '3.3.0')` → `refreshInstallation(tmpDir)` → assert runtime wrapper LOADs the NEW `<id>/SKILL.md` path, old flat path absent from wrapper content, source `_bmad/bme/_vortex/agents/<id>/SKILL.md` exists.
  - [ ] 6.6 Test 19 (Decision 3): compare normalized `marketplace.json.repository` against `package.json.repository.url` (after `git+` prefix strip + `.git` suffix strip); string-equal assertion.
  - [ ] 6.7 Test 20 (E3 npm-pack verification): guard with `t.skip()` if `npm pack --dry-run` unavailable; otherwise parse the tarball file list and assert all 7 Vortex skill-dirs + `.claude-plugin/marketplace.json` + `_bmad/bme/_vortex/module.yaml` ship.

- [ ] **Task 7: Validate** (AC8, AC9, DoD gates)
  - [ ] 7.1 `npm test` — full suite passes. Baseline at Epic 2 close: 1369/1369. Expected delta from Story 3.1: +20 new tests from AC6; pre-existing integration tests (29/29 upgrade + 10/10 governance) unchanged. Target: ~1389/1389.
  - [ ] 7.2 `npm run lint` — zero errors/warnings in modified files.
  - [ ] 7.3 Perf: `time node scripts/audit/validate-marketplace.js` on the real Convoke repo — assert ≤150ms (AC8).
  - [ ] 7.4 Live smoke: run `node scripts/audit/validate-marketplace.js` on the committed state. All 6 checks should pass green ✓. Then run `node scripts/audit/validate-marketplace.js --verbose` and verify output is operator-readable.
  - [ ] 7.5 Manual sanity: `node scripts/install-vortex-agents.js` (in a tmpDir via `createInstallation`) — verify runtime layout still at `.claude/skills/bmad-agent-bme-<id>/SKILL.md` with correct content pointing at the NEW `<id>/SKILL.md` source path.
  - [ ] 7.6 **Gyre parity smoke check (O3 — Decision 2 verification):** `ls _bmad/bme/_gyre/agents/` confirms Gyre agent files stay flat `.md`. If any Gyre agent accidentally got migrated, the AC8 validator would NOT catch it (only Vortex is in scope for the validator); manual verification required.
  - [ ] 7.7 **npm-pack shipping check (E3):** `npm pack --dry-run 2>&1 | grep -E 'marketplace\.json|module\.yaml|vortex/agents'` — verify all 7 Vortex skill-dirs + marketplace.json + module.yaml are listed in the tarball contents. Automated via Test 20 in AC6; manual run during validation for final confidence.

## Dev Notes

### Architectural Context

From [convoke-arch-bmad-v6.3-adoption.md §Decision 5](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-5-marketplace--distribution-architecture-wr5):

> **marketplace.json** at `.claude-plugin/marketplace.json` … **Pre-submission validation (FM5-1):** Skill-dir audit must verify every `skills[]` path contains a SKILL.md with v6.3-compliant frontmatter before PR submission. **module_definition:** `_bmad/bme/_vortex/module.yaml` — validate against BMAD expected schema. **Compatibility preflight:** Runtime check in `convoke-install`/`convoke-update` detecting BMAD version; warn if < 6.3.0.

Story 3.1 ships the first two points (marketplace.json + FM5-1 audit + module.yaml). The third (compatibility preflight) is Story 3.2's scope.

### Why Story 3.1 ships first in Epic 3

- Every other Epic 3 story depends on the marketplace metadata artifact existing: 3.2 audits it, 3.3 submits it as a PR, 3.4 validates parity against it, 3.5 uses its `skills[]` as the canonical export list.
- Without 3.1, the epic has no deliverable.

### Previous story intelligence

**Epic 2 close (2026-04-24) established 7 action items for Epic 3** (per `epic-v63-2-retro-2026-04-24.md`):
- **PI-5** — spec-body drift check at R2 (dev agent reflex — apply here if R1 patches grow test count).
- **PI-6** — substring-assertion audit for CLI tests (use AND-conjunction of specific substrings; apply in AC6).
- **PI-7** — non-TTY guard as default for operator-facing CLIs (apply to `validate-marketplace` CLI if it ever grows interactive prompts; not needed in 3.1's initial scope).
- **TI-3** — pre-4.0 defer sweep (run before the 4.0 release tag; doesn't affect 3.1 directly).
- **TI-4, TI-5** — low-priority carry-forwards.
- **DI-1** — slash-command skill operator docs (not relevant; 3.1 ships a CLI, not a skill).

**Epic 1A retro lesson PI-3** — 60% LOC overhead budget. Baseline 3.1 projection: ~350 LOC validator + ~400 LOC tests + ~20 LOC marketplace.json + ~10 LOC module.yaml + ~30 LOC install-script edits = ~810 LOC. Post-R1 hardening budget: ~1300 LOC total. Flag if the final Story LOC exceeds 1500.

### Pattern reuse from Epic 2

- **Module structure (Pattern 1):** shebang, strict mode, `@module` JSDoc, `findProjectRoot()`, `Object.freeze(_internal)`. Copy from `audit-bmm-dependencies.js` skeleton.
- **Check-function shape:** return `{ passed, error?, warning?, info? }` matching Story 2.2's `checkBmmDependencies` finding shape. This lets a future consumer (hypothetical marketplace extension of `convoke-doctor`) merge marketplace checks into the doctor's output.
- **CLI flag conventions:** `--verbose`, `--dry-run`, `--help` / `-h`. No `--yes` needed (no interactive prompts in this CLI).
- **`bin` entry naming:** `convoke-<verb>-<noun>` — `convoke-validate-marketplace`.

### Scope boundary — explicit out-of-scope list

**Out of scope for Story 3.1:**
- **Compatibility preflight runtime check** (Story 3.2). Story 3.1 establishes the artifacts; 3.2 checks BMAD version at install/update time.
- **Submitting the marketplace registry PR** (Story 3.3). Story 3.1 validates locally; 3.3 opens the PR to bmad-plugins-marketplace.
- **Dual-distribution parity verification** (Story 3.4). Story 3.1 ensures the metadata is valid; 3.4 proves npm install and marketplace install produce identical state.
- **Platform adapter batch validation** (Story 3.5). Story 3.1 provides the skills[] list; 3.5 runs the export tool against each.
- **Modifying `.claude/` runtime layout.** Only the SOURCE under `_bmad/bme/_vortex/` shifts; `.claude/skills/bmad-agent-bme-<id>/SKILL.md` stays identical.
- **Any Epic 2 governance code** (see AC7).
- **Re-authoring agent body text.** AC3 migration copies content verbatim; dev agent must NOT rewrite agent prompts.

### Anti-pattern prevention (consolidated — single authoritative list)

Each anti-pattern references the AC that authoritatively specifies the rule (to avoid duplication drift — Epic 2 retro PI-6 discipline):

- **No PR submission in 3.1.** Opening the marketplace registry PR is Story 3.3. Story 3.1 validates locally only. (Per AC5 scope.)
- **No flat `.md` dangling siblings post-migration.** One source-of-truth per agent. (Per AC3 Task 3.3 verification.)
- **Frontmatter `name:` normalization is mandatory, not optional.** The two-word quoted form MUST become hyphenated agent-id. (Per AC3 + AC6 case 13.)
- **No runtime `.claude/skills/` layout changes.** Only source shifts; the runtime path stays identical (only the LOAD instruction CONTENT updates to reference the new source). (Per AC4 + AC9.)
- **No reuse of Story 2.1's `_internal` helpers** — different domain (governance vs. marketplace). Copy module skeleton, not internals. (Per AC5 scope.)
- **Use `js-yaml` for YAML parsing** — already a dependency; no hand-rolling. (Per AC5 implementation hint.)
- **No Epic 2 governance code edits.** Specifically: `scripts/audit/audit-bmm-dependencies.js`, `scripts/update/convoke-update.js`, `scripts/convoke-register-skill.js`, `_bmad/_config/bmm-dependencies.csv` are out-of-scope. (Per AC7 narrow list — note `convoke-doctor.js` IS in scope for path-shape updates.)
- **No Gyre migration.** Per Decision 2, Gyre stays flat-`.md`; only Vortex migrates in this story.
- **FM5-1 audit must be green locally before commit.** Task 7.4 is the gate. Don't ship with failing audit.

### project-context.md anchor rules that apply

- **`no-process-cwd-in-libs`** — validator helpers accept `projectRoot`; only `main()` calls `findProjectRoot()`.
- **`lint-passes-before-review`** — DoD gate enforced by Task 7.2.
- **`derive-counts-from-source`** — validator reports "N skills audited" where N is derived from `plugins[0].skills.length`, not hardcoded.
- **`test-fixture-isolation`** — every test uses `createTempDir` + `runScript(…, {cwd: tmpDir})`.
- **`spec-verify-referenced-files`** — Task 3.2's agent ID list must match `AGENT_IDS` from `agent-registry.js` at dev time (pre-migration). Verify before Task 3.1.
- **`code-review-convergence`** — downstream rule for post-dev review.

### Pattern 1 (module structure) — applied

- Shebang `#!/usr/bin/env node`.
- `@module scripts/audit/validate-marketplace` JSDoc header.
- `findProjectRoot()` at `main()` entry; no `process.cwd()` in helpers.
- `Object.freeze(_internal)` export block exposes individual check functions for unit-level testing.
- `main()` separable from helpers; tests can import helpers directly.

### Testing standards

- `node:test` + `assert/strict` (consistent with Epic 2 convention).
- Fixtures via `tests/helpers.js` (`createTempDir`, `runScript`, `PACKAGE_ROOT`).
- Assertion style: AND-conjunction of specific substrings for rendered output (PI-6); exact exit-code assertions; byte-identity checks for file preservation.
- No new test infrastructure dependencies. `js-yaml` + `yaml` already present for parsing.

### References

- **Epic 3 definition:** [`convoke-epic-bmad-v6.3-adoption.md §Epic 3`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-3-discover-via-bmad-marketplace)
- **PRD FR19–FR25:** [`functional-requirements.md`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/functional-requirements.md)
- **PRD NFR11–NFR13:** [`non-functional-requirements.md`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/non-functional-requirements.md)
- **Architecture Decision 5:** [`convoke-arch-bmad-v6.3-adoption.md §Decision 5`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-5-marketplace--distribution-architecture-wr5)
- **Epic 1A retro:** [`epic-v63-1a-retro-2026-04-23.md`](epic-v63-1a-retro-2026-04-23.md) — PI-1/PI-2/PI-3 discipline carried forward.
- **Epic 2 retro:** [`epic-v63-2-retro-2026-04-24.md`](epic-v63-2-retro-2026-04-24.md) — PI-5/PI-6/PI-7 new action items; apply PI-6 to AC6 test assertions.
- **Module skeleton template:** [`scripts/audit/audit-bmm-dependencies.js`](../../scripts/audit/audit-bmm-dependencies.js) — copy structure, not helpers.
- **Existing bundled module.yaml:** `node_modules/convoke-agents/src/module.yaml` — reference shape (shipped in Convoke 3.x).
- **`tests/helpers.js`:** [`tests/helpers.js`](../../tests/helpers.js) — `createTempDir`, `runScript`, `PACKAGE_ROOT`, `createInstallation(tmpDir, version)`.

### Project structure notes (updated post-V-pass)

- **New files:**
  - `.claude-plugin/marketplace.json` — ~30 LOC (formatted JSON).
  - `_bmad/bme/_vortex/module.yaml` — ~8 LOC (6 YAML fields).
  - `scripts/audit/validate-marketplace.js` — projected 350–450 LOC (6 validators + main + help + frozen _internal).
  - `tests/unit/validate-marketplace.test.js` — projected **500–700 LOC / 20 cases** (up from initial 400–550 / 12 draft after V-pass added AC3 normalization, AC9 upgrade regression, and invariant-check cases).
- **Modified files** (up from initial 3 → 10 after V-pass — migration blast radius):
  - `scripts/install-vortex-agents.js` — 2 edit sites (lines 110 + 160).
  - `scripts/update/lib/refresh-installation.js` — **6 edit sites** (lines 55-56, 484, 494, 512, 522, 632, 658, 683 — some are multi-site clusters; estimated 15–25 LOC touched).
  - `scripts/convoke-doctor.js` — 4 edit sites (lines 226, 231, 237, 244, 252).
  - `scripts/update/lib/validator.js` — 1–2 edit sites (line 113 + paired).
  - `scripts/update/lib/agent-registry.js` — 3 LOC (add `VORTEX_SKILL_PATHS` export + JSDoc annotation on existing `AGENT_FILES`).
  - `tests/helpers.js` — ~10 LOC (`createValidInstallation` fixture shape update).
  - `docs/agents.md` — ~7 lines (path references).
  - `docs/development.md` — ~2 lines (onboarding example).
  - `package.json` — 2 LOC (bin entry + repository URL typo fix per Decision 3).
- **Renamed files (via `git mv`):** 7 files `_bmad/bme/_vortex/agents/<name>.md` → `_bmad/bme/_vortex/agents/<name>/SKILL.md` (with frontmatter `name:` normalization applied per AC3).
- **No changes to:**
  - `.claude/skills/` runtime layout (unchanged path; LOAD-instruction content updates via refresh-installation.js:632).
  - `scripts/audit/audit-bmm-dependencies.js` / `scripts/convoke-register-skill.js` / `scripts/update/convoke-update.js` / `_bmad/_config/bmm-dependencies.csv` (Epic 2 territory).
  - `_bmad/bme/_vortex/config.yaml` (runtime operator config, unrelated to publication metadata).
  - `_bmad/bme/_gyre/agents/` (Decision 2: Gyre stays flat).
  - `_bmad/bme/_vortex/workflows/` or any other Vortex subdirectory.

### LOC projection — revised post-V-pass

- Initial projection (pre-V-pass): ~810 baseline / ~1300 post-R1.
- **Revised projection (post-V-pass):** ~1200 baseline (validator + 20 tests + migration + infrastructure edits) / **~1900 post-R1** using Epic 2 refined heuristic (baseline + ~40 LOC/HIGH + ~10 LOC/MED; expecting 2–4 HIGH given migration blast radius).
- Flag to reviewer if final shipped LOC exceeds ~2200 — indicates unexpected scope creep beyond the V-pass's surfaced edges.

### Forward-intent notes for downstream stories

- **Story 3.2 (compatibility preflight + `audit-skill-dirs.js`):** will scan `.claude/skills/` at runtime to verify v6.3 structure continues to hold. Story 3.1's migration + AC5 validator cover the SOURCE side; 3.2 covers the RUNTIME side.
- **Story 3.3 (submit marketplace registry PR):** will invoke `convoke-validate-marketplace` as a pre-flight check before opening the PR.
- **Story 3.5 (platform adapter batch validation):** will iterate over `plugins[0].skills[]` to select which skills get platform-adapter-validated. Story 3.1 pins this list to 7 Vortex agents.

## Dev Agent Record

### Agent Model Used

_(To be filled in by dev agent during implementation.)_

### Debug Log References

_(Dev agent records key decisions + validation outcomes here, including any discoveries that shift the spec.)_

### Completion Notes List

_(Dev agent fills in at story close.)_

### File List

_(Dev agent fills in at story close.)_

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-24 | Story created per `/bmad-create-story v63-3-1` invocation (post-Epic-2 retro). 8 ACs covering marketplace.json + module.yaml + 7-agent skill-dir migration + install-script updates + validator CLI + tests + scope discipline + perf. Decision 1 pinned (option a: bundle agent migration; rationale: FM5-1 audit can't pass otherwise). Applied Epic 2 retro PI-5 (spec-body drift awareness) and PI-6 (AND-conjunction substring assertions) preemptively. | [sprint-status.yaml](sprint-status.yaml) |
| 2026-04-24 | `/bmad-validate-create-story` fresh-context pass applied **17 improvements**: **9 critical** — C2 (refresh-installation.js actual scope is 6 edit sites across lines 55-56, 484, 494, 512, 522, 632, 658, 683 — NOT "1–10 LOC"; **line 632 is the v3.x→v4.0 upgrade-path landmine that would break every existing operator's agents**), C3 (Decision 2 added: Gyre parity — keep Gyre flat-`.md`, migrate Vortex only; `AGENT_FILES` export annotated @deprecated, new `VORTEX_SKILL_PATHS` added), C4 (convoke-doctor.js 4 edit sites + validator.js edits — narrowed AC7 "no-touch" boundary to exclude these from Epic-2-governance scope), C5 (new **AC9 non-negotiable**: v3.x→v4.0 upgrade regression test asserting runtime wrapper LOADs the NEW skill-dir path + old flat path is absent; `refreshInstallation` on `createInstallation(tmpDir, '3.3.0')` fixture), C6 (AC3 frontmatter `name:` normalization made deterministic: hyphenated agent-id matching directory basename — not "preserve" as originally ambiguous; test 13 enforces), C7 (Task 3.5 added: update `docs/agents.md` + `docs/development.md` flat-path references), C8 (Task 4.3 covers ALL install-vortex-agents.js occurrences, not just line 110; added line 160 operator-facing hint), E1-promoted (Decision 2 registry shape), E2-promoted (tests/helpers.js `createValidInstallation` fixture shape must match real layout — Task 4.6). **3 enhancements** — E3 (npm-pack --dry-run verification as Test 20 + Task 7.7), E4 (Decision 3: fix package.json `repository.url` typo `amalik` → `amalikamriou` + Test 19 parity assertion), E5 (version drift warning escalates to hard error at Story 3.3's publish gate — forward-intent doc). **3 optimizations** — O1 (AC8 perf budget tightened 500ms → 150ms — 5× headroom over realistic cost instead of 30×), O2 (3 new test cases: wrong skill count, module code mismatch, plugin name invariant — cases 15/17/18), O3 (Task 7.6 Gyre parity smoke check verifies Decision 2). **2 LLM-opts** — L1 (Decision 1 compressed from 35 lines → 6 lines; option (b)/(c) rejection moved inline), L2 (anti-pattern list consolidated to single authoritative block referencing AC numbers, dedup saves ~30 lines). **V-pass findings accepted:** 9 critical + 3 enhancement + 3 optimization + 2 LLM-opt = **17 applied**; **1 dismissed** (validator's C1 claim that `module.yaml` already exists at `_bmad/bme/_vortex/agents/` was a hallucination — verified file doesn't exist; AC2 "create new" stands with DEF-SPIKE schema uncertainty preserved). **Test count:** 12 → 20. **Projected LOC:** ~810 → ~1200 baseline / ~1300 → ~1900 post-R1. **Critical finding:** V-pass alone prevented a shipping bug that would break every existing v3.x operator on next `convoke-update` (C5 runtime wrapper landmine — author missed entirely in initial draft). | This file |
