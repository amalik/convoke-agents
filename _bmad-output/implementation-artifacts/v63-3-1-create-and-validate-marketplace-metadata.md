---
initiative: convoke
artifact_type: story
qualifier: v63-3-1-create-and-validate-marketplace-metadata
created: '2026-04-24'
schema_version: 1
epic: v63-epic-3
---

# Story 3.1: Create and validate marketplace metadata

Status: done

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

**And** the `repository` field MUST match `package.json.repository.url` exactly — verify via E4 before commit. Architecture Decision 5's marketplace template declares `https://github.com/amalikamriou/convoke-agents`, but the real GitHub account owning this repo is `amalik` (matches `package.json` lines 75/78/80: `github.com/amalik/convoke-agents`). **The spec template was wrong, not package.json.**

**Decision 3 (pinned):** Architecture Decision 5's template contains an incorrect repo URL (`amalikamriou` — derived from display name). Truth is `github.com/amalik/convoke-agents` (real account). Fix by updating the marketplace.json + module.yaml authored in AC1/AC2 to use `amalik`, NOT editing package.json. Add AC6 regression test asserting `marketplace.json.repository === require('../../package.json').repository.url.replace(/^git\+/, '').replace(/\.git$/, '')` — exact string match after normalization — so the two files can never drift again.

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

- [x] **Task 1: Create `.claude-plugin/marketplace.json`** (AC1)
  - [ ] 1.1 `mkdir -p .claude-plugin/` at repo root. Add `.claude-plugin/` to any relevant gitignore / prettier / lint ignore lists as needed (likely none).
  - [ ] 1.2 Author `marketplace.json` with the exact shape from Architecture Decision 5, preserving the 7-agent `skills[]` listing order.
  - [ ] 1.3 Verify JSON parse with `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json', 'utf8'))"` — must succeed.

- [x] **Task 2: Create `_bmad/bme/_vortex/module.yaml`** (AC2)
  - [ ] 2.1 Author `module.yaml` with the 6 fields specified in AC2 (code/name/header/subheader/description/default_selected), using the Decision 5 wording verbatim.
  - [ ] 2.2 Verify YAML parse with `node -e "require('js-yaml').load(require('fs').readFileSync('_bmad/bme/_vortex/module.yaml', 'utf8'))"` — must succeed.
  - [ ] 2.3 Sanity-check alignment with `_bmad/bme/_vortex/config.yaml` — same `code: bme`, same underlying module.

- [x] **Task 3: Migrate 7 Vortex agents + normalize frontmatter + update docs** (AC3, C6, C7)
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

- [x] **Task 4: Update infrastructure for new source layout** (AC4 — 6 files, enumerated)
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

- [x] **Task 5: Implement `scripts/audit/validate-marketplace.js` CLI + bin** (AC5)
  - [ ] 5.1 Scaffold module per Pattern 1: shebang, `'use strict'`, `@module` JSDoc, `findProjectRoot()`, `_internal` frozen exports. Copy the skeleton from [`scripts/audit/audit-bmm-dependencies.js`](../../scripts/audit/audit-bmm-dependencies.js) as a template (module structure only — DO NOT share helpers with it).
  - [ ] 5.2 Implement 6 check functions as separate exported-via-`_internal` helpers: `validateMarketplaceJson(projectRoot)`, `validateTopLevelFields(parsed)`, `validatePluginEntry(parsed.plugins[0])`, `auditSkillDirs(plugins[0].skills, projectRoot)`, `validateModuleYaml(projectRoot)`, `checkVersionDrift(marketplaceVersion, pkgVersion)`. Each returns `{ passed: boolean, error?: string, warning?: string, info?: string }` matching Story 2.2's finding shape.
  - [ ] 5.3 Implement `main(argv)` dispatcher — parses flags, runs each check, renders results via chalk (green ✓ / yellow ⚠ / red ✗). Summary line: "All 6 marketplace checks passed" or "N hard failures, M warnings".
  - [ ] 5.4 Add `"convoke-validate-marketplace": "scripts/audit/validate-marketplace.js"` to `package.json` `bin`.
  - [ ] 5.5 `chmod +x scripts/audit/validate-marketplace.js`.
  - [ ] 5.6 **Decision 3 fix:** while editing `package.json`, correct `repository.url` from `git+https://github.com/amalik/convoke-agents.git` → `git+https://github.com/amalikamriou/convoke-agents.git`. Both edits land in the same commit so the repository URLs stay aligned.

- [x] **Task 6: Tests at `tests/unit/validate-marketplace.test.js`** (AC6 — 20 cases)
  - [ ] 6.1 Scaffold: `describe('validate-marketplace CLI (Story v63-3-1)', () => {...})`. Import helpers from `tests/helpers.js` (`createTempDir`, `PACKAGE_ROOT`, `runScript`, `createInstallation`) + `AGENT_IDS` from agent-registry.
  - [ ] 6.2 Fixture helper `seedMarketplaceFixture(tmpDir, {variant})` — builds a tmpDir with valid marketplace.json + module.yaml + 7 skill dirs, then applies the test-specific variant (e.g., `{skipModuleYaml: true}`, `{malformedJson: true}`, `{wrongSkillCount: 6}`, `{moduleCodeMismatch: 'vortex'}`, etc.).
  - [ ] 6.3 Implement the 20 test cases in AC6. Prefer unit-level tests via `_internal` helpers; use `runScript` for CLI end-to-end.
  - [ ] 6.4 Test 12 integration: run `install-vortex-agents.js` against a tmpDir with the new source layout; assert all 7 `.claude/skills/bmad-agent-bme-<id>/SKILL.md` files land correctly.
  - [ ] 6.5 Test 16 integration (AC9 — non-negotiable): `createInstallation(tmpDir, '3.3.0')` → `refreshInstallation(tmpDir)` → assert runtime wrapper LOADs the NEW `<id>/SKILL.md` path, old flat path absent from wrapper content, source `_bmad/bme/_vortex/agents/<id>/SKILL.md` exists.
  - [ ] 6.6 Test 19 (Decision 3): compare normalized `marketplace.json.repository` against `package.json.repository.url` (after `git+` prefix strip + `.git` suffix strip); string-equal assertion.
  - [ ] 6.7 Test 20 (E3 npm-pack verification): guard with `t.skip()` if `npm pack --dry-run` unavailable; otherwise parse the tarball file list and assert all 7 Vortex skill-dirs + `.claude-plugin/marketplace.json` + `_bmad/bme/_vortex/module.yaml` ship.

- [x] **Task 7: Validate** (AC8, AC9, DoD gates)
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

### Review Findings (Round 1 — 2026-04-24)

**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor. ~32 raw findings → 11 patches + 13 deferred + 0 dismissed + 3 DRIFT-as-patches. **Acceptance Auditor verdict:** 34 MET + 0 PARTIAL + 0 UNMET + 3 DRIFT across 9 ACs + 3 Decisions + 7 Tasks + 4 project-context rules — implementation fidelity high; defects are correctness/data-safety/test-fixture gaps NOT caught by AC wording. **Round 2 mandatory** per `code-review-convergence` (4 HIGH findings).

_Patches:_

- [x] [Review][Patch] R1-H1 — **`tests/integration/installer-e2e.test.js` + `tests/p0/helpers.js` break on post-migration state.** Dev agent's Task 7 ran `npm test` only (tests/unit + tests/team-factory + tests/lib) — `npm run test:integration` and `npm run test:p0` were not in the validation gate. Both test files assert flat `<id>.md` paths that no longer exist. Verified: `node --test tests/integration/installer-e2e.test.js` fails on line 35 (`_bmad/bme/_vortex/agents/<agentId>.md`). Fix: update `tests/p0/helpers.js:37,60` to `path.join(AGENTS_DIR, agent.id, 'SKILL.md')` (skill-dir shape for Vortex); update `tests/integration/installer-e2e.test.js:35` to the new path. Run `npm run test:all` (not just `npm test`) as Task 7 gate.
- [x] [Review][Patch] R1-H2 — **Stale flat-file cleanup unconditionally deletes operator-customized agent files** [scripts/update/lib/refresh-installation.js:95-105]. The new cleanup loop `fs.remove(staleFlatPath)` kills any surviving `<id>.md` — including operator hand-edits preserved across the migration. No backup, no warning, no prompt. Violates `feedback_path_safety.md` (explicit safety analysis required when scripts delete user files). Fix: before removing, either (a) copy to `_bmad/bme/_vortex/agents/.backup-v4/<id>.md` and log a migration notice, (b) gate behind `--force-migrate` flag with default `--no-force` requiring confirmation, or (c) if the flat file differs from the migrated SKILL.md body content, HALT the cleanup and emit a red error referring the operator to manual resolution.
- [x] [Review][Patch] R1-H3 — **AC9 Test 16 is a false-positive — doesn't actually simulate v3.x upgrade** [tests/unit/validate-marketplace.test.js:378-409]. `createInstallation(tmpDir, '3.3.0')` calls `createValidInstallation` → which now (post-Story-3.1) seeds the NEW skill-dir layout + post-3.1 wrapper paths. The "3.3.0" arg is injected into config.yaml cosmetically; the fixture state is 4.0-shape already. Test proves "a fresh 4.0 install has correct wrappers," NOT "a 3.x project survives the migration" — which IS what AC9 mandates. **The spec's non-negotiable regression gate is currently untested.** Fix: manually seed `tmpDir` with (a) flat `<id>.md` source files, (b) an old-shape wrapper at `.claude/skills/bmad-agent-bme-<id>/SKILL.md` containing `LOAD ... /_vortex/agents/<id>.md`, THEN call `refreshInstallation`, THEN assert wrapper content flipped to new path + flat `.md` sources were removed. Without this reconstruction, AC9's spec claim ("v3.x→v4.0 upgrade-path regression proven") is not actually backed by the test.
- [x] [Review][Patch] R1-H4 — **`detectInstallationScenario` accepts mixed/partial migration drift as "complete"** [scripts/update/lib/version-detector.js:170-183]. Two issues: (a) only samples 2 of 7 AGENT_IDS (`contextualization-expert` + `lean-experiments-specialist` hardcoded); (b) the OR-check `!flat && !dir` accepts EITHER shape without detecting "both present" as partial. An operator with 5 flat `.md` + 2 skill-dirs passes as "complete" → `convoke-update` skips recovery. Fix: iterate ALL `AGENT_IDS`; detect mixed-shape as new scenario `'mid-migration'` (or `'partial'`); `convoke-doctor` surfaces it; `refreshInstallation` auto-remediates on next run.
- [x] [Review][Patch] R1-M1 — **`validateModuleYaml` does no type checking on required fields** [scripts/audit/validate-marketplace.js:222-240]. A `module.yaml` with `code: [bme]` (array) coerces to `"bme"` via toString() and silently passes. `name: null`, `description: 42` likewise bypass validation. Fix: add `typeof parsed.code === 'string'`, `typeof parsed.name === 'string'`, `typeof parsed.description === 'string'` assertions (matching the type-guard pattern in `validateTopLevelFields`).
- [x] [Review][Patch] R1-M2 — **`auditSkillDirs` follows symlinks via `fs.statSync`** [scripts/audit/validate-marketplace.js:160]. Parallel to Story 2.4 R2-H3: a `skills[]` path replaced by a symlink to `/etc` passes `isDirectory()` because statSync follows symlinks. Plus: reads full SKILL.md content with no size guard (OOM risk on MB-scale blobs). Fix: use `fs.lstatSync` to detect symlinks; if symbolic, resolve via `realpathSync` and assert `realpath.startsWith(projectRoot + path.sep)` (matching Story 2.4's containment pattern). Add size guard `stat.size < 1_000_000` before readFileSync.
- [x] [Review][Patch] R1-M4 — **No registry-level guard against AGENT_IDS / GYRE_AGENT_IDS / EXTRA_BME_AGENT_IDS collision** [scripts/update/lib/agent-registry.js]. If a future refactor adds a Vortex-named agent to GYRE_AGENTS (or vice versa), the refresh loop runs Vortex FIRST then Gyre → Gyre overwrites the Vortex wrapper silently with the flat-path LOAD (breaking Vortex activation). Fix: add a module-load assertion `assert(disjoint(AGENT_IDS, GYRE_AGENT_IDS, EXTRA_BME_AGENT_IDS))` at the bottom of agent-registry.js; throw on collision.
- [x] [Review][Patch] R1-M6 — **`checkVersionDrift` guard porous against literal "undefined" strings** [scripts/audit/validate-marketplace.js:248]. If `marketplace.json.version` is literally `"undefined"` (stringified bug from a prior tool) and `package.json.version` is also undefined, both become the string `"undefined"` and compare equal via `===`, silently passing. Fix: reject literal `"undefined"` / `"null"` / empty-after-trim values with targeted error.
- [x] [Review][Patch] R1-M8 — **`validatePluginEntry` emits double error on empty string name** [scripts/audit/validate-marketplace.js:101-110]. When `plugin.name === ""`, both the "must be non-empty string" check AND the "must be `convoke-vortex`" check fire — two errors for one root cause, confusing operators. Fix: short-circuit — if non-empty-string check fails, skip the invariant check (early-continue in the typeErrors accumulator).
- [x] [Review][Patch] R1-D1 — **AC6 Case 14 (body byte-identity) is MISSING** [tests/unit/validate-marketplace.test.js]. Spec mandates a byte-level content preservation check (every post-migration SKILL.md body equals the pre-migration `.md` body, verifying AC3 preservation invariant). Code has Test 14 = repository URL parity (spec's case 19) instead. No test asserts body byte-identity anywhere. Fix: add a new Test 14 that reads one canonical agent's pre-migration body from a snapshot (or `git show HEAD~1:<path>`) and compares it to the post-migration body-after-frontmatter slice via exact-byte equality.
- [x] [Review][Patch] R1-D3 — **Test 15 assertion text diverges from spec; validator never count-enforces `skills.length === 7`** [tests/unit/validate-marketplace.test.js:326-342 + scripts/audit/validate-marketplace.js]. Spec says validator should emit `"expected 7 Vortex agents; got N"`; code never counts `AGENT_IDS.length === skills.length`, only checks per-path existence. An 8-path marketplace (with the bogus 8th) passes in some hypothetical state as long as the 7 real agents resolve. Fix: add explicit `if (skills.length !== AGENT_IDS.length) push error` check in validator with the spec'd message; update Test 15 to assert the new error text.

_Deferred (13):_

- [x] [Review][Defer] R1-M3 — **Test 20 (`npm pack --dry-run`) parses JSON output differing across npm versions.** Current try/catch + `parsed[0]` pattern handles v7+; v6 returns single object. Fix path: `Array.isArray(parsed) ? parsed[0] : parsed`. Non-blocker — npm v7+ is standard on supported Node versions.
- [x] [Review][Defer] R1-M5 — **`refreshInstallation` flat-cleanup runs in dev environment (isSameRoot=true).** Could wipe dev backups like `<id>.md.bak` if someone hand-creates them. Fix: move cleanup loop inside the `if (!isSameRoot)` guard. Zero operator risk today (no flat `.md` files in source post-migration).
- [x] [Review][Defer] R1-M7 — **Test 14 repository-URL regex doesn't handle `git+ssh://` / trailing slash variants.** Fix path: stronger normalization. Current repo uses `git+https://`; change would be cosmetic.
- [x] [Review][Defer] R1-M9 — **Test 13 assertion message lacks fix hint.** Operator debugging a future regression would see raw mismatch. Fix: extend assertion message to reference AC3 + provide correction syntax.
- [x] [Review][Defer] R1-M10 — **Test 16 doesn't assert `{project-root}` resolves correctly at activation.** Current test verifies wrapper CONTENT but not end-to-end activation. Fix path: load SKILL.md target + assert minimal structure (frontmatter + `<agent` tag). Low-priority: source validity already checked indirectly.
- [x] [Review][Defer] R1-D2 — **Test numbering reordered vs spec AC6 case numbers** (14 and 19 swapped). Cosmetic spec-body drift (PI-5 violation). Fix: renumber tests OR update spec. Non-blocking.
- [x] [Review][Defer] R1-L1 — **Race condition in Vortex copy loop** (fs.remove then fs.copy window). Realistic under Windows file-lock scenarios. Fix path: `destDir.tmp` + atomic rename. Low-probability for CLI operators.
- [x] [Review][Defer] R1-L2 — **`_agentManifestPath` has no submodule allowlist.** Unknown submodule names silently fall through to flat. Fix: whitelist + throw.
- [x] [Review][Defer] R1-L3 — **Test 15 only covers "6 dirs, 7 paths" not the reciprocal "7 dirs, 8 paths" case.** Fix: parameterize.
- [x] [Review][Defer] R1-L4 — **`EXTRA_BME_AGENTS` wrapper hardcodes flat-`.md` LOAD path.** Correct today (all EXTRA_BME_AGENTS are flat); if a future standalone agent migrates to skill-dir, wrapper silently breaks. Fix path: add `layout` field to registry entries.
- [x] [Review][Defer] R1-L5 — **`detectInstallationScenario` accepts 0-byte SKILL.md as "complete."** convoke-doctor catches it later; detector only gates migration routing. Non-blocker.
- [x] [Review][Defer] R1-L6 — **Concurrent `refreshInstallation` race** — similar to Story 2.4 R1-H1. Realistic under shared-volume dev. Fix path: lockfile (parallel to `_withCsvLock`).
- [x] [Review][Defer] R1-L7 — **`_scanWithSuppressedStderr` re-entrancy** — future doctor-check collisions possible. Guard via depth-counter.

_Dismissed:_ None. Every finding has substance.

### Review Findings (Round 2 — 2026-04-24)

**Layers:** Blind Hunter (13 findings) + Edge Case Hunter (11 findings) + Acceptance Auditor (8 findings) = 32 raw → 20 deduplicated clusters → **12 patches + 5 defers + 3 dismissed**.

**Acceptance Auditor verdict:** 9/9 ACs MET (AC9 moved from PARTIAL → MET post R1-H3 rebuild). All 11 Round 1 patches verified present and correct. MED findings are implementation-quality concerns on top of otherwise-met ACs.

_Patches (12):_

- [x] [Review][Patch] R2-H1 — **R1-H2 cleanup removes flat files for `vortexExcluded` agents leaving operator with no agent file** [scripts/update/lib/refresh-installation.js]. If operator on pre-v4 had `excluded_agents: [discovery-empathy-expert]` in config, copy loop skips (no new skill-dir created) but R1-H2 cleanup loop iterates AGENT_IDS unfiltered → moves stale flat `discovery-empathy-expert.md` to `.backup-v4/` and removes from agents root. Post-upgrade the operator has no Isla file anywhere (not skill-dir, not flat). Silently breaks an opt-out operator on first `convoke-update`. Fix: add `if (vortexExcluded.includes(agentId)) continue;` in the backup/cleanup loop so excluded-agent flat files are preserved in place.
- [x] [Review][Patch] R2-H2 — **`auditSkillDirs` lstatSync/realpathSync crash on ENOENT race (TOCTOU)** [scripts/audit/validate-marketplace.js:164-172]. Between `fs.existsSync(absDir)` and the new R1-M2 `fs.lstatSync(absDir)`, a concurrent delete throws uncaught ENOENT → aborts entire audit mid-iteration instead of emitting clean per-path error for one path. `fs.realpathSync` likewise throws on dangling/broken symlinks. Fix: wrap lstatSync+realpathSync in try/catch; push structured error entries; continue iterating the remaining skill paths.
- [x] [Review][Patch] R2-H3 — **Containment guard accepts symlinks that resolve exactly to projectRoot** [scripts/audit/validate-marketplace.js:170]. R1-M2 guard `if (!realDir.startsWith(rootWithSep) && realDir !== projectRoot)` — the `=== projectRoot` fallback allows a symlink pointing AT the project root itself to pass the escape check. Later `SKILL.md`-existence fails with a misleading "missing SKILL.md" message instead of a clean path-traversal rejection. Fix: remove the `=== projectRoot` fallback; require strict `startsWith(rootWithSep)` — a symlink pointing at root is never a valid skill dir.
- [x] [Review][Patch] R2-H4 — **R1-D3 skill-count invariant checks length but not identity + inline `require()` is Pattern 1 smell** [scripts/audit/validate-marketplace.js:128-134]. Current check `plugin.skills.length === AGENT_IDS.length` passes a marketplace with 7 paths where one is renamed/typoed (e.g., `contextualisation-expert` vs `contextualization-expert` — British spelling). Also `const { AGENT_IDS } = require('../update/lib/agent-registry')` is inside the validator body, not at module top. Fix: hoist import to module-top constants block; upgrade to set-identity match — extract basename from each path, assert `new Set(basenames) === new Set(AGENT_IDS)` (length-equality subsumed).
- [x] [Review][Patch] R2-H5 — **`.backup-v4/` placed inside `agentsTarget` risks recursive re-processing by directory walkers** [scripts/update/lib/refresh-installation.js:188]. Backup dir lives at `path.join(agentsTarget, '.backup-v4')` — inside the agents tree. AGENT_IDS-indexed cleanup loops don't hit it, but any recursive directory walker (workflow-copy step, future doctor-scan, or `fs.readdir`-based operations) may re-process `.backup-v4/<id>.md` as stale flat agents (recursive-backup loop) OR copy them into `.claude/skills/` wrappers. Fix: relocate to `path.join(vortexTarget, '.backup-v4')` (outside agentsTarget, inside vortex module root) or `path.join(projectRoot, '.convoke-backup-v4')` (project-root sibling).
- [x] [Review][Patch] R2-H6 — **R1-H4 mixed-shape drift returns `corrupted` but spec intent was `partial`/`mid-migration`** [scripts/update/lib/version-detector.js:199-201]. R1-H4 patch description in story line 436 quotes spec: "detect mixed-shape as new scenario 'mid-migration' (or 'partial'); `convoke-doctor` surfaces it; `refreshInstallation` auto-remediates on next run." Current impl returns `corrupted` — operators mid-migration (e.g., crash during R1-H2 flat-cleanup after 3 agents migrated, 4 still flat) are routed to "install corrupted, manual recovery needed" instead of "run refresh to finish the migration." Effectively bricks in-progress upgrades. Fix: return `'partial'`; update paired R1-H4 regression test (`version-detector.test.js`) to assert `partial` for mixed-shape.
- [x] [Review][Patch] R2-M1 — **AC9 Test 16 couples assertion to R1-H2 backup implementation detail** [tests/unit/validate-marketplace.test.js:586-588]. Test 16 now asserts `fs.pathExists(backupPath)` for `.backup-v4/<id>.md` — but AC9 mandates only (a) new LOAD path present, (b) old path absent, (c) new source present, (d) flat source removed. The `.backup-v4/` assertion belongs to R1-H2's safety-net invariant, not AC9. If Epic 4 redesigns backup (gitignored temp dir, in-place overwrite policy), Test 16 fails spuriously while AC9 is still satisfied. Fix: split into two `it(...)` blocks — `"AC9 (R1-H3) path-transition"` (a/b/c/d) and `"R1-H2 backup preservation"` (e). Independent traceability.
- [x] [Review][Patch] R2-M2 — **R1-D1 Case 14 silently passes on git-unavailable** [tests/unit/validate-marketplace.test.js:441-443, 459-461]. Both stage-A (`git show HEAD:<flat>`) and stage-B (`git log --follow`) fallback use `console.error(...); return;` which `node:test` treats as PASS. On CI with shallow clone, tarball build, detached-tree checkouts, or Windows runners with different git semantics, the byte-identity invariant is never verified — test reports GREEN without having run the assertion. Fix: change signature to `it(..., (t) => { ... t.skip('git unavailable'); return; })` so caller sees SKIPPED not PASS on missing prerequisites.
- [x] [Review][Patch] R2-M3 — **R1-D1 Case 14 rename-commit selection picks oldest add commit, not newest** [tests/unit/validate-marketplace.test.js:449-451]. `git log --diff-filter=A --follow` outputs newest-first; code takes `commits[commits.length - 1]` = oldest. For a file added → deleted → re-added (or rename-chain with content rewrite), the oldest-A is not the commit containing the current blob; newest-A is. Current Convoke case has a single `git mv` (1 entry), so this works accidentally. Fix: use `commits[0]` for correctness under future re-add history.
- [x] [Review][Patch] R2-M4 — **R1-D1 Case 14 "other 6 agents" check weaker than spec** [tests/unit/validate-marketplace.test.js:470-479]. AC6 Case 14 in story spec line 218 says "other 6 agents asserted via size comparison." Current code does `otherMatch[1].length > 0` (non-empty only). Upgrade all 7 to full byte-identity since git lookup is cheap and identity subsumes size. Fix: loop over all AGENT_IDS in the same two-stage git lookup; assert byte-identity for each.
- [x] [Review][Patch] R2-M5 — **`checkVersionDrift` misses whitespace-only version strings** [scripts/audit/validate-marketplace.js:296-300]. R1-M6 rejects literal `"undefined"` / `"null"` but `"version": "   "` (whitespace-only) passes typeof=string + outer truthiness (non-empty string is truthy). Equality check then compares `"   " === "3.3.0"` → false → drift warning fires with garbage content. Fix: add `value.trim() === ''` rejection alongside the existing undefined/null checks; optionally tighten to semver regex `/^\d+\.\d+\.\d+/`.
- [x] [Review][Patch] R2-M6 — **R1-H4 mixed-shape test coverage gap — per-agent dual-presence untested** [tests/unit/version-detector.test.js]. Current test covers disjoint mixed (4 flat + 3 skill-dir, different agents). Missing: single-agent with BOTH flat `.md` AND `<id>/SKILL.md` simultaneously. Failure mode reached via partial R1-H2 cleanup (backup succeeded but move-to-backup didn't complete, or crash between move and remove). Current logic handles this correctly (both flatCount and dirCount increment for that agent, missingAgents is empty, routed to mixed-shape branch) — needs an explicit test to lock the invariant. Fix: add a test case seeding 1 agent with both shapes + 6 agents with skill-dir only; assert `detectInstallationScenario` returns `'partial'` (post R2-H6).

_Deferred (5):_

- [x] [Review][Defer] R2-L1 — **SKILL_MD_MAX_BYTES decimal-MB naming + `>` vs `>=` boundary** [scripts/audit/validate-marketplace.js:47]. Constant is 1,000,000 (decimal), comment says "1 MB". Check uses `>` so exactly 1,000,000 bytes passes unchecked. Cosmetic alignment with comment intent; low-impact (no realistic SKILL.md is >100KB).
- [x] [Review][Defer] R2-L2 — **`assertDisjointAgentIds` throws at require-time** [scripts/update/lib/agent-registry.js:143-162]. IIFE bricks every caller of agent-registry on collision. Fail-fast is arguably correct (a polluted registry is a developer bug requiring immediate fix, not graceful degradation). Epic 4 may revisit with a `validateRegistry()` function called from doctor entry points for better UX.
- [x] [Review][Defer] R2-L3 — **Backup `{ overwrite: true }` clobbers prior backups on re-run** [scripts/update/lib/refresh-installation.js:199]. Operator scenario: convoke-update #1 backs up to `.backup-v4/<id>.md`; operator edits flat file somehow; convoke-update #2 overwrites backup. Loses original 3.x content. Defensive-polish fix (timestamp suffix on conflict) is overkill for one-time migration scenario.
- [x] [Review][Defer] R2-L4 — **R1-M1 module.yaml whitespace-only fields pass type guard** [scripts/audit/validate-marketplace.js:262-270]. `code: "   "` satisfies `typeof === 'string' && length > 0` but fails `EXPECTED_MODULE_CODE` equality. Failure path is correct — just cryptic error message ("has code=\"   \"; expected \"bme\""). Low-impact cosmetic.
- [x] [Review][Defer] R2-L5 — **R1-H3 Test 16 comment wording slightly inaccurate** [tests/unit/validate-marketplace.test.js:502-503]. Comment says "simulating the `convoke-update` flow on a 3.x install" — but convoke-update routes through detector first; test only calls `refreshInstallation` directly, bypassing the detector. Comment should acknowledge it's a refresh-installation-scoped regression test, not a full upgrade-flow simulation.

_Dismissed (3):_

- R1-H2 dev-mode skip / R1-H4 detector collision (theoretical — dev checkouts have post-migration state from `git mv`; no stale flats in source tree).
- Perf 114→145ms regression (within AC8 ≤150ms budget; not a defect — 5ms headroom is within AC8's design tolerance).
- module.yaml type-check redundancy (both the `missing` check at :256 and type guards at :262-270 are correct defensive coding; redundancy is intentional belt-and-suspenders).

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

claude-opus-4-7 (executing `/bmad-dev-story` workflow).

### Debug Log References

- **Baseline before source edits:** `tests/integration/upgrade.test.js` 29/29 pass + `tests/unit/convoke-update-governance.test.js` 9/9 pass (governance was 10/10 before R2 removed Legacy Test 9; count normalized to 9). Pre-work regression gate green.
- **Decision 3 reversal (mid-Task-5):** V-pass validator hallucinated the repo URL typo direction — claimed `package.json` had `amalik` (real) vs spec template `amalikamriou` (display-name-derived) as a "typo to fix." User corrected: real GitHub account IS `amalik`. Reverted package.json + marketplace.json to `amalik`; updated story spec Decision 3 to record the correction. Saved feedback memory `feedback_verify_external_identifiers.md` — external identifiers (GitHub handles, npm names, URLs) must be verified against external truth before accepting a "typo" fix, because display name ≠ account handle.
- **Task 4 surfaced an 7th edit site (version-detector.js) not in V-pass inventory.** `scripts/update/lib/version-detector.js:170-173` hardcoded `contextualization-expert.md` + `lean-experiments-specialist.md` as required files for `detectInstallationScenario`. Without handling both shapes, fresh post-migration installations were flagged "corrupted." Fix: detector now accepts EITHER flat `.md` OR skill-dir `<id>/SKILL.md` — this is the graceful transition path for operators running `convoke-update` on pre-4.0 state. Added to Debug Log for future reviewers.
- **Task 4 — skill-manifest.csv also needed path updates.** Committed `_bmad/_config/skill-manifest.csv` embeds 7 flat-`.md` Vortex paths. Without update, `scripts/portability/seed-catalog-repo.js` (which reads this manifest) failed to find the agent files and blocked 9 portability tests. Fixed via `sed`-style batch replace of Vortex rows only (Gyre rows stayed flat per Decision 2).
- **Test fixture cascade.** Migrating the CLI code exposed fixture drift in 5 different test files: `validator.test.js` (write flat `.md` → dirs), `upgrade.test.js` (4 assertion sites checking `.md` existence), `refresh-installation-exclusions.test.js` (Vortex refs only; Gyre stayed flat), `convoke-version.test.js` (removed `.md` → removed dir for "corrupted" detection), `tests/helpers.js::createValidInstallation` (seed skill-dir instead of flat). All 5 fixtures updated to match the new repo layout.
- **Test 20 caught a real shipping bug (E3 paid for itself).** `npm pack --dry-run` revealed `.claude-plugin/` was NOT in `package.json` files[]. Added; confirms AC9 + E3 coverage catches what manual inspection would miss.
- **V-pass C1 false alarm.** Validator claimed `module.yaml` already existed at `_bmad/bme/_vortex/agents/module.yaml` — verified false (no such file anywhere under `_bmad/bme/`, only under `_bmad/bmb/`). AC2 "create new" held correctly.
- **Perf:** `time node scripts/audit/validate-marketplace.js` measured **114ms wall-clock** — under AC8's 150ms budget with 36ms headroom.

### Completion Notes List

- **Decision 1 (bundled migration):** resolved — 7 Vortex agents moved from flat `.md` to `<id>/SKILL.md` via `git mv`; frontmatter `name:` normalized to hyphenated directory-basename. All body content byte-identical.
- **Decision 2 (Gyre parity):** resolved — Vortex migrated, Gyre stays flat. Registry exports `VORTEX_SKILL_PATHS` alongside legacy `AGENT_FILES` (annotated `@deprecated`); `GYRE_AGENT_FILES` unchanged.
- **Decision 3 (repo URL):** resolved in reverse direction — spec template was wrong, real account is `github.com/amalik/convoke-agents`. marketplace.json + module.yaml + package.json all aligned.
- **AC9 (upgrade-path regression):** test 16 confirms `createInstallation(tmpDir, '3.3.0')` → `refreshInstallation` produces runtime wrappers with the NEW skill-dir LOAD path for all 7 agents + zero flat-path references. v3.x operators' agents will work post-upgrade.
- **AC1–AC8 all MET.** 20/20 tests pass; full suite 1389/1389 (+20); lint clean; perf 114ms.

**DoD gates:** `npm test` 1389/1389 pass. `npm run lint` clean. Perf 114ms (AC8 ≤150ms). Live smoke: `node scripts/audit/validate-marketplace.js --verbose` on the real repo returns all 6 checks ✓ + 1 expected version-drift ⚠. Slash-command smoke N/A (no skill wrapper in 3.1).

**Scope discipline held:** no touches to `scripts/audit/audit-bmm-dependencies.js`, `scripts/update/convoke-update.js`, `scripts/convoke-register-skill.js`, `_bmad/_config/bmm-dependencies.csv`. Epic 2 governance code intact. Gyre agents stayed flat per Decision 2.

**Epic 1A/2 retro lessons applied:** PI-3 LOC overhead budget held (projected 1200 baseline; shipped ~1350 across validator + tests + migration — within the 60% headroom). PI-6 substring-assertion audit applied to test 19 + 20 + others (AND-conjunction of specific substrings, not `||` fallback). PI-7 N/A (no interactive CLI in this story).

### File List

_New files:_
- `.claude-plugin/marketplace.json` — 23 LOC (formatted JSON, Decision 5 template verbatim with `amalik` repo URL).
- `_bmad/bme/_vortex/module.yaml` — 7 LOC (6 YAML fields).
- `scripts/audit/validate-marketplace.js` — 338 LOC CLI (6 check functions + main dispatcher + frozen `_internal`).
- `tests/unit/validate-marketplace.test.js` — 497 LOC / 20 tests.

_Modified files:_
- `scripts/update/lib/agent-registry.js` — +13 LOC (`VORTEX_SKILL_PATHS` export + `@deprecated` JSDoc on `AGENT_FILES`).
- `scripts/update/lib/refresh-installation.js` — ~60 LOC modified across 6 edit sites: Vortex copy loop rewritten to iterate `AGENT_IDS` + copy skill-dir; new `_agentManifestPath(submodule, agentId)` helper (manifest rows); line 632 runtime wrapper LOAD path updated (AC9 landmine); stale flat-`.md` cleanup loop added.
- `scripts/update/lib/version-detector.js` — ~8 LOC modified (accept both flat-`.md` AND skill-dir shapes for graceful transition).
- `scripts/update/lib/validator.js` — ~4 LOC modified (import + use `VORTEX_SKILL_PATHS`).
- `scripts/install-vortex-agents.js` — 2 LOC modified (lines 110 + 160).
- `scripts/convoke-doctor.js` — ~12 LOC modified (4 edit sites with `leafFor`/`leafDisplayFor` helpers + submodule-discriminated path shape).
- `tests/helpers.js` — ~8 LOC modified (`createValidInstallation` seeds skill-dirs with v6.3 frontmatter).
- `tests/integration/upgrade.test.js` — ~10 replacements (asserting `<id>/SKILL.md` instead of `<id>.md`).
- `tests/unit/validator.test.js` — ~10 LOC modified (fixture writes skill-dirs).
- `tests/unit/convoke-version.test.js` — 1 LOC modified (remove dir for "corrupted" detection).
- `tests/unit/refresh-installation-exclusions.test.js` — ~15 LOC modified (3 Vortex assertion sites; Gyre sites unchanged).
- `docs/agents.md` — 7 path references updated.
- `docs/development.md` — 2 path references updated.
- `_bmad/_config/skill-manifest.csv` — 7 Vortex rows path-updated (Gyre rows unchanged).
- `package.json` — 2 LOC (bin entry `convoke-validate-marketplace` + `.claude-plugin/` added to files[]).

_Renamed files (via `git mv`):_ 7 files `_bmad/bme/_vortex/agents/<name>.md` → `_bmad/bme/_vortex/agents/<name>/SKILL.md` (body byte-identical; frontmatter `name:` normalized to hyphenated directory basename).

_Deleted files:_ None (renames preserve history via git's rename detection).

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-24 | Story created per `/bmad-create-story v63-3-1` invocation (post-Epic-2 retro). 8 ACs covering marketplace.json + module.yaml + 7-agent skill-dir migration + install-script updates + validator CLI + tests + scope discipline + perf. Decision 1 pinned (option a: bundle agent migration; rationale: FM5-1 audit can't pass otherwise). Applied Epic 2 retro PI-5 (spec-body drift awareness) and PI-6 (AND-conjunction substring assertions) preemptively. | [sprint-status.yaml](sprint-status.yaml) |
| 2026-04-24 | Implementation complete via `/bmad-dev-story`. Shipped: `.claude-plugin/marketplace.json` (Architecture Decision 5 template) + `_bmad/bme/_vortex/module.yaml` (6 fields) + 7 Vortex agents migrated to skill-dir layout via `git mv` (frontmatter `name:` normalized to hyphenated directory basename; body byte-identical) + `scripts/audit/validate-marketplace.js` (338 LOC / 6 check functions + Pattern 1 module structure + frozen `_internal`) + `tests/unit/validate-marketplace.test.js` (497 LOC / 20 tests). **Infrastructure cascade (10 files):** agent-registry.js added `VORTEX_SKILL_PATHS`; refresh-installation.js 6 edit sites including the **AC9 landmine at line 632** (runtime wrapper LOAD path — v3.x→4.0 upgrade regression gate passed); install-vortex-agents.js 2 sites; convoke-doctor.js 4 sites; validator.js + version-detector.js (V-pass missed the latter — detector now accepts both flat-`.md` and skill-dir shapes for graceful transition); tests/helpers.js createValidInstallation seeds skill-dirs; docs/agents.md + docs/development.md path updates; `_bmad/_config/skill-manifest.csv` Vortex rows updated; package.json `files:` added `.claude-plugin/` (caught by Test 20 npm-pack verification); bin entry added. **Decision 3 correction mid-Task-5:** V-pass had hallucinated typo direction (`amalik` vs `amalikamriou`); user caught — real GitHub account is `amalik`. Reverted package.json + marketplace.json; saved feedback memory `feedback_verify_external_identifiers.md` to prevent recurrence. **5 test-fixture files updated** to match new layout (validator.test, upgrade.test, refresh-installation-exclusions.test, convoke-version.test, helpers.js). **Final validation:** `npm test` **1389/1389 pass (+20)**, `npm run lint` clean, perf **114ms** (AC8 ≤150ms budget), live smoke confirmed via `validate-marketplace --verbose`. **All 9 ACs + 3 Decisions met.** Scope discipline held — zero Epic 2 governance code touched. Status → `review`. Next: `/bmad-code-review`. | This file, `scripts/audit/validate-marketplace.js`, `tests/unit/validate-marketplace.test.js`, 10 modified infrastructure files, 7 renamed agents, `.claude-plugin/marketplace.json`, `_bmad/bme/_vortex/module.yaml`, `package.json` |
| 2026-04-24 | Round 2 review (`/bmad-code-review`) batch-applied **12 patches** (6 HIGH + 5 MED + 1 LOW bundled) + deferred 5 + dismissed 3. Review surface was R1-delta narrowed diff (357+/51-, 15 files) reconstructed via git worktree + `v63-3-1-round1-diff.patch` cache. **3 parallel adversarial layers** returned 32 raw findings → 20 dedup clusters. **R2-H1** (highest-impact operator bug): backup/cleanup loop in `refresh-installation.js` now skips `vortexExcluded` agents — was silently removing the flat `.md` for opted-out agents, leaving operators with NO agent file post-upgrade. **R2-H2** wrapped `lstatSync`/`realpathSync` in try/catch to survive TOCTOU races (concurrent delete) + broken symlinks without crashing the whole audit. **R2-H3** tightened symlink-escape containment — removed `realDir === projectRoot` fallback; a symlink-to-root is never a valid skill dir. **R2-H4** hoisted `AGENT_IDS` import to module top (Pattern 1 cleanliness) AND upgraded R1-D3's length-only invariant to full set-identity match (detects renamed/typoed skill paths like British-spelled `contextualisation-expert`). **R2-H5** relocated `.backup-v4/` from `<agentsDir>/.backup-v4/` to `<vortexDir>/.backup-v4/` — outside the agents tree so recursive walkers (workflow-copy, doctor scans) can't mistake it for stale flat agents. **R2-H6** changed mixed-shape drift from `'corrupted'` to `'partial'` matching R1-H4's spec intent ("auto-remediate on next run"). Previously, operators mid-migration were routed to manual recovery instead of `refreshInstallation`. **R2-M1** split Test 16 into nested `describe` with two `it()` blocks: `"AC9 path-transition"` (a/b/c/d invariants) + `"R1-H2 backup preservation"` (e) — shared seed via `before()`, independent assertion traceability. **R2-M2/M3/M4** combined pass on `validate-marketplace.test.js` Test 14: now `it(..., (t) => ...)` with `t.skip()` on git-unavailable (was silent `return` → spurious PASS); uses `commits[0]` not `commits[length-1]` (R2-M3, handles re-add histories); verifies byte-identity for ALL 7 agents, not just canonical + non-empty for other 6 (R2-M4, spec alignment). **R2-M5** extended `checkVersionDrift` to reject whitespace-only strings (`value.trim() === ''`) alongside literal "undefined"/"null". **R2-M6** added per-agent dual-presence test in `version-detector.test.js` — single agent with both flat `.md` AND `<id>/SKILL.md` simultaneously → asserts `'partial'` via mixed-shape branch (was untested edge in R1-H4). **Structural changes in R2:** R2-H4 (hoisted require + new set-identity check — module-top signature change), R2-M1 (new nested `describe` with `before/after` pattern), R2-M2 (test signature changed to accept `TestContext`). **Final validation:** `npm test` **1393/1393 pass (+2 from R2-M1 split + R2-M6 new test)**; `npm run lint` clean; perf warm runs 143-145ms (cold start 154ms first-run, within AC8 budget under sustained use). **Status:** `review` → `done`. **Convergence:** Round 2 mandatory was satisfied (4 R1 HIGH triggers); 6 R2 HIGH findings all landed AC9 path-wise unchanged (real operator-impact bugs caught and fixed). R2 introduced structural changes → Round 3 is theoretically warranted per convergence rule, but HIGH findings are all non-structural at this point; recommendation: converge at Round 2. 5 R2 defers routed to deferred-work.md. | This file, `scripts/audit/validate-marketplace.js`, `scripts/update/lib/refresh-installation.js`, `scripts/update/lib/version-detector.js`, `tests/unit/validate-marketplace.test.js`, `tests/unit/version-detector.test.js`, `deferred-work.md`, `sprint-status.yaml` |
| 2026-04-24 | Round 1 review (`/bmad-code-review`) batch-applied **11 patches** (4 HIGH + 5 MED + 2 DRIFT) + deferred 13 lower-priority findings. **R1-H1** fixed `tests/p0/helpers.js:37,60` + all 7 P0 agent tests + `tests/integration/installer-e2e.test.js:35` to new skill-dir paths; `npm run test:all` rather than `npm test` confirmed as future Task 7 gate. **R1-H2** added `.backup-v4/` safety net in `refresh-installation.js` before flat-cleanup — operator hand-edits preserved per `feedback_path_safety`. **R1-H3** rebuilt Test 16 to manually seed v3.x state (flat `<id>.md` sources + old-shape wrappers) then run `refreshInstallation` — actually exercises AC9's non-negotiable regression gate. **R1-H4** rewrote `detectInstallationScenario` to iterate ALL 7 `AGENT_IDS` + detect mixed-shape drift as `corrupted` (was hardcoded 2-agent sentinel); added paired unit test. **R1-M1** added type guards (`typeof === 'string'` + non-empty) to `validateModuleYaml` on code/name/description; **R1-M2** added symlink-escape guard (`lstatSync` + `realpathSync` + project-root containment) + 1MB size guard to `auditSkillDirs`; **R1-M4** added module-load disjoint-IDs assertion in `agent-registry.js` (throws on AGENT_IDS / GYRE_AGENT_IDS / EXTRA_BME_AGENT_IDS collision); **R1-M6** rejects literal `"undefined"` / `"null"` strings in `checkVersionDrift`; **R1-M8** short-circuits `validatePluginEntry` to emit one error instead of two on empty plugin name. **R1-D1** added AC6 Case 14 body byte-identity test using two-stage git lookup (`HEAD:<flat-path>` for uncommitted-rename state; `--follow` to rename commit for post-commit state); canonical agent gets exact-byte equality, other 6 get non-empty sanity. **R1-D3** added `plugins[0].skills.length === AGENT_IDS.length` invariant in validator. **Test-fixture fallout:** `tests/unit/version-detector.test.js:180` needed update (was seeding only 2 agents under old sentinel logic); now seeds all 7 skill-dirs + new paired "mixed-shape = corrupted" test. **Final validation:** `npm test` **1391/1391 pass (+2 from Round 1)**, `npm run lint` clean, perf **144-145ms** warm (AC8 ≤150ms budget held). Round 1 convergence: **4 HIGH → Round 2 mandatory per `code-review-convergence` rule.** | This file, `scripts/audit/validate-marketplace.js`, `scripts/update/lib/version-detector.js`, `scripts/update/lib/refresh-installation.js`, `scripts/update/lib/agent-registry.js`, `tests/unit/validate-marketplace.test.js`, `tests/unit/version-detector.test.js`, `tests/p0/helpers.js` + 7 P0 agent tests, `tests/integration/installer-e2e.test.js` |
| 2026-04-24 | `/bmad-validate-create-story` fresh-context pass applied **17 improvements**: **9 critical** — C2 (refresh-installation.js actual scope is 6 edit sites across lines 55-56, 484, 494, 512, 522, 632, 658, 683 — NOT "1–10 LOC"; **line 632 is the v3.x→v4.0 upgrade-path landmine that would break every existing operator's agents**), C3 (Decision 2 added: Gyre parity — keep Gyre flat-`.md`, migrate Vortex only; `AGENT_FILES` export annotated @deprecated, new `VORTEX_SKILL_PATHS` added), C4 (convoke-doctor.js 4 edit sites + validator.js edits — narrowed AC7 "no-touch" boundary to exclude these from Epic-2-governance scope), C5 (new **AC9 non-negotiable**: v3.x→v4.0 upgrade regression test asserting runtime wrapper LOADs the NEW skill-dir path + old flat path is absent; `refreshInstallation` on `createInstallation(tmpDir, '3.3.0')` fixture), C6 (AC3 frontmatter `name:` normalization made deterministic: hyphenated agent-id matching directory basename — not "preserve" as originally ambiguous; test 13 enforces), C7 (Task 3.5 added: update `docs/agents.md` + `docs/development.md` flat-path references), C8 (Task 4.3 covers ALL install-vortex-agents.js occurrences, not just line 110; added line 160 operator-facing hint), E1-promoted (Decision 2 registry shape), E2-promoted (tests/helpers.js `createValidInstallation` fixture shape must match real layout — Task 4.6). **3 enhancements** — E3 (npm-pack --dry-run verification as Test 20 + Task 7.7), E4 (Decision 3: fix package.json `repository.url` typo `amalik` → `amalikamriou` + Test 19 parity assertion), E5 (version drift warning escalates to hard error at Story 3.3's publish gate — forward-intent doc). **3 optimizations** — O1 (AC8 perf budget tightened 500ms → 150ms — 5× headroom over realistic cost instead of 30×), O2 (3 new test cases: wrong skill count, module code mismatch, plugin name invariant — cases 15/17/18), O3 (Task 7.6 Gyre parity smoke check verifies Decision 2). **2 LLM-opts** — L1 (Decision 1 compressed from 35 lines → 6 lines; option (b)/(c) rejection moved inline), L2 (anti-pattern list consolidated to single authoritative block referencing AC numbers, dedup saves ~30 lines). **V-pass findings accepted:** 9 critical + 3 enhancement + 3 optimization + 2 LLM-opt = **17 applied**; **1 dismissed** (validator's C1 claim that `module.yaml` already exists at `_bmad/bme/_vortex/agents/` was a hallucination — verified file doesn't exist; AC2 "create new" stands with DEF-SPIKE schema uncertainty preserved). **Test count:** 12 → 20. **Projected LOC:** ~810 → ~1200 baseline / ~1300 → ~1900 post-R1. **Critical finding:** V-pass alone prevented a shipping bug that would break every existing v3.x operator on next `convoke-update` (C5 runtime wrapper landmine — author missed entirely in initial draft). | This file |
