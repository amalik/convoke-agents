---
initiative: convoke
artifact_type: story
qualifier: v63-3-3-submit-marketplace-registry-pr
created: '2026-04-25'
schema_version: 1
epic: v63-epic-3
---

# Story 3.3: Submit marketplace registry PR

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 3 — Discover via BMAD Marketplace](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-3-discover-via-bmad-marketplace)
**Sprint:** 4 (WS2/P23 marketplace stream)
**FR coverage:** FR24 (Convoke registered in `bmad-plugins-marketplace/registry/community/convoke.yaml` with `trust_tier: unverified` and valid `module_definition` metadata).
**Success criteria:** **M12a (ship-blocking)** — Marketplace PR open with complete registry metadata; passes PluginResolver validation. **M12b (aspirational, NOT ship-blocking per OP-4)** — at least one round of BMAD org review feedback received; if absent by release date, note delay honestly but do not block ship.

**Upstream dependencies:**
- **Story 3.1 shipped `marketplace.json` + `module.yaml`** (the local metadata `convoke.yaml` will reference). `validate-marketplace` is the pre-submission gate.
- **Story 3.2 shipped `audit-skill-dirs`** — full-tree audit must pass before submission so the registry advertises a clean install.
- **No upstream code dependencies on Epic 2** — pure distribution scope.

**Downstream consumers:**
- **Story 3.4 (dual-distribution parity verification)** — once the registry is published (or the PR is open + validating), Story 3.4 simulates the marketplace install path against npm install for parity diff.
- **Story 3.5 (platform adapter batch validation)** — orthogonal but reads from the same Tier 1 skill set.
- **Convoke 4.0 publication gate** — M12a is on the critical path. M12b is NOT.

**Namespace decision:** all 4 new artifacts live under `_bmad-output/implementation-artifacts/v63-3-3-*.{md,yaml}` — see "Project structure notes" below for the canonical inventory. Key choices:
- `convoke.yaml` lives in `_bmad-output/` (not `.claude-plugin/`) because it's a SUBMISSION artifact for an EXTERNAL repo, not a Convoke-internal config. Intentionally NOT in `package.json.files[]` per V-pass C3.
- **Out of scope:** modifying `.claude-plugin/marketplace.json` or `_bmad/bme/_vortex/module.yaml` (Story 3.1 territory; locked); modifying `audit-skill-dirs.js` or `validate-marketplace.js` (Story 3.1/3.2 territory; locked).
- **Covenant compliance checklist:** NOT applicable — no new code/skill being authored; procedural metadata + external-PR work.

## Story

As Convoke maintainer (Amalik) preparing the v4.0 release,
I want Convoke registered in the BMAD community plugin marketplace with valid metadata that PluginResolver accepts,
so that new users can discover Convoke through `bmad-cli list-plugins` (or equivalent BMAD discovery surface) and install it via the marketplace path — closing M12a (ship-blocking gate) for the 4.0 release.

**Scope distinction:** Story 3.1 authored the LOCAL marketplace metadata (`marketplace.json` + `module.yaml`) that PluginResolver reads from Convoke's repo. Story 3.3 authors the REMOTE registry submission (`convoke.yaml` in `bmad-plugins-marketplace/registry/community/`) that points at Convoke's repo. The two files describe Convoke from opposite sides of the marketplace boundary; both must agree for the PluginResolver round-trip to validate.

**External dependency note:** This story touches an external repository (`bmad-plugins-marketplace`). Per OP-4 (success-criteria.md), BMAD org review responsiveness is OUT OF SCOPE — M12a (PR open + validates) is ship-blocking; M12b (review feedback received) is aspirational. If the PR is open and PluginResolver passes locally, M12a is met regardless of upstream review timing.

## Acceptance Criteria

**Decision 1 (resolved post-Task-1):** schema lives at `registry/registry-schema.yaml` (NOT `schemas/...` — initial provisional was wrong; Task 1.2 corrected). Required fields verified from schema + CONTRIBUTING.md template + existing `whiteport-design-studio.yaml` precedent. **Verified canonical shape for Convoke:**
```yaml
name: convoke-vortex
display_name: "Convoke: Vortex Discovery Framework"
code: bme
description: "Vortex Framework — 7-stream product discovery for IT transformation consultants."
repository: https://github.com/amalik/convoke-agents
module_definition: _bmad/bme/_vortex/module.yaml
npm_package: convoke-agents
author: Amalik Amriou
license: MIT
default_selected: false
type: community
category: business-and-strategy
subcategory: product
keywords:
  - bmad
  - discovery
  - vortex
  - product-discovery
  - innovation

version: "4.0.0"
approved_tag: v4.0.0
approved_sha: null # TODO: pin to actual commit SHA when v4.0.0 is tagged
trust_tier: unverified
approved_date: "2026-04-25"
reviewer: pending
```

**Verified facts (from Task 1 spike):**
- Schema location: `registry/registry-schema.yaml` (NOT `schemas/...`).
- `trust_tier` enum: lowercase `unverified` / `community-reviewed` / `bmad-certified` (FR24 was right, BMAD docs TitleCase was wrong).
- `category` enum: confirmed `business-and-strategy` exists in `categories.yaml`. Subcategory `product` ("Product Management — Roadmaps, requirements, user stories, prioritization") is the best fit for Convoke's discovery framework. (Provisional `discovery/product-discovery` was wrong — that pair doesn't exist in the enum.)
- Required fields per schema: `name`, `display_name`, `description`, `repository`, `author`, `license`, `type`, `category`, `subcategory`, `trust_tier`. Community-only required: `version`, `approved_tag`, `approved_sha`, `approved_date`, `reviewer`.
- `approved_sha: null` placeholder is acceptable per existing `whiteport-design-studio.yaml` precedent (uses `null # TODO: pin to actual commit SHA`).

**Pending operator decision (Story 3.3 vs Story 4.x boundary):** Convoke's `package.json.version` is currently 3.3.0; `v4.0.0` tag does not yet exist. Two reasonable paths:
- **Path A (selected provisionally):** Submit at publication-target `version: "4.0.0"` with `approved_sha: null` per whiteport precedent. M12a (PR open + validates) is the ship-blocking gate; the SHA gets pinned in a follow-up "Version Update" PR after Convoke 4.0 ships. Aligns with FR24's 4.0 vision.
- **Path B (alternative):** Submit at currently-shipped `version: "3.3.0"` with real SHA, then a follow-up PR at 4.0.0 ship. Lower-risk for upstream review (no null SHA) but contradicts FR24's 4.0 publication target.

Path A is the default per Decision 1 above; surface to user during Task 4-5 if Path B is preferred.

**⚠ URL trap:** Architecture Decision 5's marketplace template still has the stale `github.com/amalikamriou/convoke-agents` (the typo Story 3.1 V-pass corrected). DO NOT copy from arch — copy from `.claude-plugin/marketplace.json` (the live, corrected source). Real account is `amalik`. This trap is documented in `feedback_verify_external_identifiers.md`.

**Decision 2 (pinned): manual fork-and-PR workflow, not scripted.** Operator runs `gh repo fork` + `gh pr create` per Tasks 4-5. (Rationale in Dev Notes "Why Decision 2".)

**Decision 3 (pinned): pre-submission gate is hard-block.** BOTH `convoke-validate-marketplace` AND `convoke-audit-skill-dirs` MUST exit 0 before PR push (Tasks 0.2 + 3). (Rationale in Dev Notes "Why Decision 3".)

---

**AC1 — `convoke.yaml` registry-submission file authored at `_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml`.**
**Given** Story 3.1's `.claude-plugin/marketplace.json` + `_bmad/bme/_vortex/module.yaml` exist and pass `convoke-validate-marketplace` cleanly
**When** Task 2 authors the YAML
**Then** the file MUST:
- Match the upstream schema (Task 1 DEF-SPIKE resolves exact fields from `bmad-plugins-marketplace/schemas/registry-schema.yaml`).
- Include `trust_tier: unverified` per FR24 (mandatory — community modules default to unverified; only BMAD org review can promote to `verified`).
- Reference `module_definition: _bmad/bme/_vortex/module.yaml` matching Story 3.1's actual file path.
- Use `repository: https://github.com/amalik/convoke-agents` matching `package.json.repository.url` (normalized — no `git+` prefix, no `.git` suffix; Decision 3 from Story 3.1 holds).
- Use `version: 4.0.0` (literal; the publication target — NOT `package.json.version` which is still 3.3.0 at story-author time).
- Use `keywords` in the EXACT order shipped in `marketplace.json.keywords` (currently `[bmad, discovery, vortex, product-discovery, innovation]`). V-pass O2: pinning order avoids accidental reorderings that confuse reviewers comparing the two files.
- Be valid YAML (parseable via `js-yaml.load` without errors).

**AC2 — Pre-submission gate: BOTH local validators exit 0 before PR submission.**
**Given** the operator is about to push the fork branch
**When** they run the gate
**Then** BOTH commands MUST exit 0:
- `npx convoke-validate-marketplace` — Story 3.1's marketplace.json + module.yaml pass.
- `npx convoke-audit-skill-dirs` — Story 3.2's full-tree skill-dir audit passes (98+ dirs).

**And** the gate output (both commands' stdout) MUST be captured in `_bmad-output/implementation-artifacts/v63-3-3-validation-log.md` with timestamps. This log is part of M12a evidence.

**AC3 — Marketplace PR opened against `bmad-plugins-marketplace`.**
**Given** the gate passes
**When** the operator runs the fork+PR workflow (Task 5)
**Then**:
- A fork of `bmad-plugins-marketplace` MUST exist on `github.com/amalik/`.
- A branch named `add-convoke-vortex` (or similar; operator picks) on the fork MUST contain `registry/community/convoke.yaml` matching AC1.
- A PR MUST be opened from `amalik/bmad-plugins-marketplace:add-convoke-vortex` → `bmad-code-org/bmad-plugins-marketplace:main` (verify upstream repo path during Task 1 spike — exact org may differ).
- PR title: `Add Convoke (community module: 7-agent product discovery framework)`.
- PR body: standard contribution template if upstream provides one; otherwise short description + link to Convoke repo + note on `trust_tier: unverified`.

**AC4 — PluginResolver validation passes against the submitted entry.** (V-pass L4: paths summarized as a decision table.)

| Validation path | Acceptable? | Evidence required |
|---|---|---|
| **A.** Upstream CI runs on PR + passes (V-pass DEF-SPIKE 3 confirmed CI fires on community PRs) | YES (preferred) | `gh pr checks <pr-url>` log captured to `v63-3-3-validation-log.md` |
| **B.** Local validator runs + passes (Task 6.2 spike order: `bmad-builder validate` → `bmad-method validate-plugin` → `bmad-method registry-check`) | YES (fallback) | local stdout captured |
| **C.** Manual schema-match (load `registry-schema.yaml` + `convoke.yaml`; assert every required field present + types match) | YES (per OP-4) | manual check log + reasoning |

Path A is expected default per V-pass DEF-SPIKE 3. Path C remains acceptable per OP-4 (upstream responsiveness out of scope) — closing Story 3.3 with manual schema-match satisfies M12a.

**AC5 — M12a evidence captured.**
**Given** the PR is open AND validation passes (per AC4)
**When** the operator finalizes the story
**Then** `_bmad-output/implementation-artifacts/v63-3-3-pr-link.md` MUST contain:
- The exact PR URL (e.g., `https://github.com/bmad-code-org/bmad-plugins-marketplace/pull/123`).
- Submission timestamp (UTC ISO-8601).
- A 1-line summary of the validation status (PASS / PENDING / FAILED).

**And** the validation log path is referenced in the M12a evidence file.

**AC6 — M12b operator awareness note (informational; NOT a blocker).**
**Given** the PR is open
**When** the operator monitors for upstream review
**Then** the story file's Dev Agent Record MUST include a note:
- Whether at least one round of BMAD org review feedback was received by the time Story 3.3 closes.
- If YES → M12b satisfied; capture reviewer handle + 1-line summary.
- If NO → M12b deferred per OP-4; this does NOT block ship; record "M12b not achieved by release date" honestly.

This AC is binary-explicit so we don't accidentally wait on M12b before closing the story.

**AC7 — Scope discipline: zero modifications to Story 3.1/3.2 code.**
**Given** the Story 3.3 diff
**When** `git diff HEAD --stat` is reviewed
**Then** the following MUST NOT appear:
- `.claude-plugin/marketplace.json`
- `_bmad/bme/_vortex/module.yaml`
- `scripts/audit/validate-marketplace.js`
- `scripts/audit/audit-skill-dirs.js`
- `scripts/update/lib/compat-preflight.js`
- `package.json`
- Any file under `_bmad/bme/_vortex/agents/`
- Any file under `.claude/skills/bmad-audit-skill-dirs/` or `.claude/skills/bmad-validate-marketplace/` (the latter doesn't exist; called out for clarity)

**And** the following ARE in scope:
- **New (4):** `_bmad-output/implementation-artifacts/v63-3-3-submit-marketplace-registry-pr.md` (this file), `_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml`, `_bmad-output/implementation-artifacts/v63-3-3-validation-log.md`, `_bmad-output/implementation-artifacts/v63-3-3-pr-link.md`.
- **Modified (1):** `_bmad-output/implementation-artifacts/sprint-status.yaml` (status transitions only).

**V-pass O3 — spec-deviation guardrail:** if Task 1 surfaces an upstream-required field that requires touching `package.json` (e.g., a new `homepage` URL Convoke doesn't already have, a new keyword the registry mandates), that constitutes a spec deviation — surface to user, don't silently amend `package.json`. Same for any other AC7-out-of-scope file.

**V-pass C3 — `_bmad-output/v63-3-3-convoke.yaml` is intentionally NOT in `package.json.files[]`.** It's a submission artifact for an external repo, not a Convoke runtime asset shipped via npm. Do NOT add it to `files[]` and do NOT extend Story 3.2's Test 17 (npm-pack shipping check) to cover it.

## Tasks / Subtasks

- [ ] **Task 0: Pre-flight gates** (V-pass E4 + E6 — added pre-emptively to catch environment + baseline issues before doing destructive external work.)
  - [ ] 0.1 Verify `gh` CLI installed + authed + correct account: `gh --version && gh auth status && gh api user --jq .login`. The `.login` MUST equal `amalik` (or whatever the operator's GitHub handle is — match Decision 1's `maintainer.github`). HALT if any fail. This catches missing CLI / expired token / wrong account before fork operations.
  - [ ] 0.2 Confirm green baseline: `npx convoke-validate-marketplace && npx convoke-audit-skill-dirs`. Both MUST exit 0. If either fails, a regression slipped in between Story 3.2 close and Story 3.3 start — HALT and triage. Story 3.3 starts on green or it doesn't start.

- [ ] **Task 1: DEF-SPIKE — fetch upstream registry schema + verify org/repo paths.** (V-pass resolved DEF-SPIKE 1: real org is `bmad-code-org`.)
  - [ ] 1.1 Verify upstream repo path + default branch: `gh repo view bmad-code-org/bmad-plugins-marketplace --json name,defaultBranchRef -q '.name + "@" + .defaultBranchRef.name'`. Note default branch name (could be `main`, `master`, `trunk` — substitute into Tasks 4.2 + 5.1 placeholders). HALT if repo doesn't exist (BMAD hasn't published yet — Epic 3 ship gate blocks).
  - [ ] 1.2 Fetch `registry-schema.yaml`: `gh api repos/bmad-code-org/bmad-plugins-marketplace/contents/schemas/registry-schema.yaml --jq .content | base64 -d > /tmp/registry-schema.yaml`. If at different path, find via `gh api repos/bmad-code-org/bmad-plugins-marketplace/git/trees/HEAD?recursive=1 --jq '.tree[] | select(.path | endswith("schema.yaml")) | .path'`.
  - [ ] 1.3 Verify exact required + optional fields. **Specifically:**
    - **`trust_tier` casing** — lowercase `unverified` (FR24) vs TitleCase `Unverified` (BMAD docs)? Update Decision 1 + AC1 + YAML.
    - **`category` + `subcategory` enum values** — fetch `gh api repos/bmad-code-org/bmad-plugins-marketplace/contents/categories.yaml --jq .content | base64 -d`. Pin `category` + `subcategory` to actual valid values (provisional `discovery`/`product-discovery` may not match enum).
    - Required vs optional field set — flag discrepancies vs Decision 1's provisional shape.
  - [ ] 1.4 Locate existing community entries: `gh api repos/bmad-code-org/bmad-plugins-marketplace/contents/registry/community --jq '.[].name'`. Pick 1-2; fetch + study conventions (case, ordering, naming).
  - [ ] 1.5 Fetch upstream contribution conventions: `gh api repos/bmad-code-org/bmad-plugins-marketplace/contents/CONTRIBUTING.md --jq .content | base64 -d`. Also try `.github/PULL_REQUEST_TEMPLATE.md` (optional). Pin PR title format + body checklist; AC3's hardcoded title may need adjustment.

- [ ] **Task 2: Author `_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml`.**
  - [ ] 2.1 Use Task 1's verified schema. Start from Decision 1's provisional shape; adjust per Task 1.3 discrepancies.
  - [ ] 2.2 Validate the local YAML parses cleanly: `node -e "console.log(require('js-yaml').load(require('fs').readFileSync('_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml', 'utf8')))"`.
  - [ ] 2.3 Cross-check: every field referencing Convoke's marketplace metadata MUST agree with `.claude-plugin/marketplace.json` exactly (name, version, repository URL, keywords ORDER + values, description text). Mismatch = registry entry PluginResolver will reject.
  - [ ] 2.4 **Three-version cross-check (V-pass E5):** ensure `convoke.yaml.version === marketplace.json.plugins[0].version`. Run: `node -e "const m=require('./.claude-plugin/marketplace.json'); const y=require('js-yaml').load(require('fs').readFileSync('_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml','utf8')); if(m.plugins[0].version!==y.version){console.error('VERSION DRIFT: marketplace=' + m.plugins[0].version + ' yaml=' + y.version); process.exit(1)}"`.

- [ ] **Task 3: Run pre-submission gate (AC2).** (Note: Task 0.2 already proved baseline green; this re-runs after `convoke.yaml` is in place to catch any drift introduced by Task 2.)
  - [ ] 3.1 `npx convoke-validate-marketplace --verbose` → must exit 0; capture stdout.
  - [ ] 3.2 `npx convoke-audit-skill-dirs --verbose` → must exit 0; capture stdout.
  - [ ] 3.3 If EITHER exits non-zero, HALT — do NOT proceed to PR. Report which tool failed + relevant error block.
  - [ ] 3.4 Write `_bmad-output/implementation-artifacts/v63-3-3-validation-log.md` with frontmatter (gate-run timestamp UTC, tool versions from `package.json.version`, exit codes) + concatenated stdout from both tools.

- [ ] **Task 4: Set up the fork via local clone.** (V-pass E7: pick clone path; cleaner than gh API gymnastics.)
  - [ ] 4.1 `gh repo fork bmad-code-org/bmad-plugins-marketplace --clone=false` (creates fork on `amalik/`; don't clone via gh — local clone next step).
  - [ ] 4.2 In a tmpdir: `git clone https://github.com/amalik/bmad-plugins-marketplace.git && cd bmad-plugins-marketplace && git checkout -b add-convoke-vortex`. (Use the default branch name resolved in Task 1.1 if NOT `main`.)
  - [ ] 4.3 Copy: `cp /Users/amalikamriou/BMAD-Enhanced/_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml registry/community/convoke.yaml`.
  - [ ] 4.4 Commit + push: `git add registry/community/convoke.yaml && git commit -m "Add Convoke community module" && git push -u origin add-convoke-vortex`.
  - [ ] 4.5 Verify on fork: `gh api repos/amalik/bmad-plugins-marketplace/contents/registry/community/convoke.yaml?ref=add-convoke-vortex --jq .sha` returns a SHA.

- [ ] **Task 5: Open the PR (AC3).**
  - [ ] 5.1 `gh pr create --repo bmad-code-org/bmad-plugins-marketplace --head amalik:add-convoke-vortex --base <default-branch-from-Task-1.1> --title "<format-from-Task-1.5>" --body-file /tmp/v63-3-3-pr-body.md`. (PR title format: per Task 1.5 spike result; if no upstream convention surfaced, use `Add Convoke (community module: 7-agent product discovery framework)` as fallback.)
  - [ ] 5.2 PR body (`/tmp/v63-3-3-pr-body.md`): reference Convoke's repo `https://github.com/amalik/convoke-agents`, list the 7 Vortex agents, note `trust_tier: <verified-casing-from-Task-1.3>`, link to `_bmad-output/implementation-artifacts/v63-3-3-validation-log.md` SHA on Convoke's repo (since the file isn't in the marketplace fork). Conform to upstream `PULL_REQUEST_TEMPLATE.md` if Task 1.5 found one.
  - [ ] 5.3 Capture PR URL + headRefOid: `gh pr view <pr-url> --json url,headRefOid -q '.url + "@" + .headRefOid'`. If `gh pr create` fails (upstream rejects community PRs lacking maintainer template), document failure mode + HALT.

- [ ] **Task 6: PluginResolver validation (AC4).** (V-pass E1: tool name was speculative; spike actual command.)
  - [ ] 6.1 **Primary:** wait for upstream CI on the PR. Check `gh pr checks <pr-url>` after a few minutes. V-pass DEF-SPIKE 3: upstream DOES run automated validation (Validate Module + manifest verification + security scanning) — CI should trigger. If passes → AC4 met; capture log via `gh pr checks <pr-url> --json` or by browsing the GitHub Actions run page.
  - [ ] 6.2 **Fallback A (local validator):** if CI doesn't trigger, try in order:
    - `npx --package bmad-builder bmad-builder validate _bmad-output/implementation-artifacts/v63-3-3-convoke.yaml`
    - `npx --package bmad-method bmad-method validate-plugin _bmad-output/implementation-artifacts/v63-3-3-convoke.yaml`
    - `npx --package bmad-method bmad-method registry-check _bmad-output/implementation-artifacts/v63-3-3-convoke.yaml`
    - Document which (if any) actually exists; update DEF-SPIKE 4 in Dev Agent Record.
  - [ ] 6.3 **Fallback B (manual schema-match):** if no local validator exists, load `/tmp/registry-schema.yaml` (Task 1.2) + `convoke.yaml`, assert every required field is present + types match. Document manual check in Dev Agent Record + validation log. Per OP-4, this is acceptable M12a satisfaction.
  - [ ] 6.4 Append validation result + method to `v63-3-3-validation-log.md`.

- [ ] **Task 7: Capture M12a + M12b evidence (AC5 + AC6).**
  - [ ] 7.1 Author `_bmad-output/implementation-artifacts/v63-3-3-pr-link.md` with: PR URL, submission timestamp (UTC ISO-8601), validation status (PASS/PENDING/FAILED), **fork-branch SHA from Task 5.3** (V-pass E3: pin evidence to a specific tree state — if the operator amends the PR later, the snapshot must reference what was originally validated).
  - [ ] 7.2 Update Dev Agent Record M12b template with concrete values per the structured form below.

- [ ] **Task 8: Validation gates.**
  - [ ] 8.1 `npm test` — full suite passes. Story 3.3 adds NO new tests (procedural story); baseline 1422/1423 should hold unchanged.
  - [ ] 8.2 `npm run lint` — clean (no code changes; lint should be a no-op).
  - [ ] 8.3 Verify the 4 new artifacts exist + are well-formed:
    - `node -e "require('js-yaml').load(require('fs').readFileSync('_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml','utf8'))"` (parse OK)
    - `node -e "require('gray-matter')(require('fs').readFileSync('_bmad-output/implementation-artifacts/v63-3-3-validation-log.md','utf8'))"` (frontmatter OK)
    - Same gray-matter check for `v63-3-3-pr-link.md`.
  - [ ] 8.4 `git diff HEAD --stat` — confirm AC7 scope (only the 4 new files + sprint-status.yaml).

## Dev Notes

**Story shape note:** Story 3.3 is fundamentally different from Stories 3.1/3.2 — those were code-implementation stories with tests; this is a procedural + external-PR story. There are NO new tests because there's no new code. The "validation" is procedural: pre-submission gate (AC2) + PluginResolver schema match (AC4). Don't try to write unit tests for the YAML file or the PR — the evidence is the artifacts themselves.

**Why Decision 2 (manual workflow):** Convoke 4.0 ships once. After release, registry amendments would be `gh pr edit` calls (1 LOC each). Building a `convoke-submit-marketplace` CLI to automate a one-shot operation has negative ROI: more maintenance burden than the manual flow it replaces. If 5.0+ ever needs to re-submit (e.g., schema migration upstream), revisit then.

**Why Decision 3 (hard-block gate):** This is the publish-gate escalation Story 3.1's V-pass deferred (E5: "version drift warning escalates to hard error at Story 3.3's publish gate"). Story 3.3 IS that gate. Pushing a registry entry that points at a broken Convoke install would create a public failure mode that's hard to roll back — better to halt locally than apologize publicly.

**Anti-patterns to avoid:**
- **DO NOT** modify `.claude-plugin/marketplace.json` or `_bmad/bme/_vortex/module.yaml` (Story 3.1 territory; locked at 3.1's `done` state). If the schema mismatch surfaces a need to amend Story 3.1's files, HALT and surface to user — that's a corrective-action conversation, not Story 3.3 scope.
- **DO NOT** modify the validators (`validate-marketplace.js`, `audit-skill-dirs.js`). They're locked.
- **DO NOT** wait on upstream BMAD review (M12b). Per OP-4, that's explicitly out of scope for ship-blocking. Close Story 3.3 when M12a is met (PR open + validation passes).
- **DO NOT** author a CLI wrapper for the PR submission. Decision 2 rejects this; manual workflow is correct.
- **DO NOT** trust `process.cwd()` if any glue scripting is added (anchor rule `no-process-cwd-in-libs`). Story 3.3 should have minimal scripting; if Task 1's spike requires a small fetch helper, follow the same pattern Stories 3.1/3.2 used.

**External dependencies + risk:**
- **PR1 — bmad-plugins-marketplace org/path may not be published yet.** Task 1.1's spike resolves this; if HALT fires there, the entire Epic 3 ship gate is blocked on upstream availability. Surface to user immediately if encountered — may need to defer Story 3.3 or rescope to "draft submission held locally pending upstream availability."
- **PR2 — registry-schema.yaml may differ from Decision 1's provisional shape.** Acceptable; Task 1.3 documents diffs; Task 2 adapts. No risk if dev agent reads the schema first.
- **PR3 — upstream CI may not validate community-tier PRs automatically.** Falls back to AC4's manual schema-match path. Documented as acceptable per OP-4.

**Spike points (DEF-SPIKE) tracked in Dev Agent Record:**
- **DEF-SPIKE 1:** Upstream `bmad-plugins-marketplace` repo path (org + name). Provisional: `bmad-code-org/bmad-plugins-marketplace`. Task 1.1 resolves.
- **DEF-SPIKE 2:** `registry-schema.yaml` exact required fields. Task 1.2-1.3 resolves; updates Decision 1.
- **DEF-SPIKE 3:** Whether upstream CI validates community-tier PRs (decides AC4 path). Task 6.1 resolves.
- **DEF-SPIKE 4:** Whether `bmad-cli validate-registry-entry` (or equivalent) is locally invocable. Task 6.2 resolves.

## Testing

**No new tests.** Story 3.3 is procedural — the artifacts ARE the evidence:
- `v63-3-3-convoke.yaml` validates via `js-yaml.load` (Task 2.2)
- Pre-submission gate captures `validate-marketplace` + `audit-skill-dirs` outputs (Task 3.4)
- PluginResolver result captured in validation log (Task 6.4)
- PR URL + timestamp captured in M12a evidence (Task 7.1)

**Validation surface for M12a sign-off:**
- All 4 artifact files exist + parse cleanly
- Pre-submission gate exit codes both 0 (logged)
- PR URL resolves (gh API GET on the PR returns 200)
- Validation log shows either upstream CI PASS or manual schema-match PASS

## References

- **Epic 3 definition:** [`convoke-epic-bmad-v6.3-adoption.md §Epic 3 Story 3.3`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-33-submit-marketplace-registry-pr)
- **PRD FR24:** [`functional-requirements.md`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/functional-requirements.md) — registry entry shape.
- **Success criteria M12a/M12b:** [`success-criteria.md`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/success-criteria.md).
- **OP-4 (upstream responsiveness out of scope):** [`success-criteria.md §OP-4`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/success-criteria.md#OP-4).
- **Story 3.1 (shipped, done):** [`v63-3-1-create-and-validate-marketplace-metadata.md`](v63-3-1-create-and-validate-marketplace-metadata.md) — local marketplace metadata; consumed by `convoke.yaml`'s `module_definition` reference.
- **Story 3.2 (shipped, done):** [`v63-3-2-compatibility-preflight-and-skill-dir-audit.md`](v63-3-2-compatibility-preflight-and-skill-dir-audit.md) — full-tree audit; consumed by AC2 pre-submission gate.
- **Architecture Decision 5 (marketplace template):** [`convoke-arch-bmad-v6.3-adoption.md §Decision 5`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-5-marketplace--distribution-architecture-wr5).

## Project structure notes

- **New files (4):**
  - `_bmad-output/implementation-artifacts/v63-3-3-submit-marketplace-registry-pr.md` (this file).
  - `_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml` — projected ~15-25 LOC YAML (depends on schema).
  - `_bmad-output/implementation-artifacts/v63-3-3-validation-log.md` — projected ~50-100 LOC (concatenated tool outputs).
  - `_bmad-output/implementation-artifacts/v63-3-3-pr-link.md` — ~15 LOC (URL + timestamps + status).

- **Modified files (1):**
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions.

- **External work:**
  - Fork `<org>/bmad-plugins-marketplace` to `amalik/bmad-plugins-marketplace`.
  - Add `registry/community/convoke.yaml` to `add-convoke-vortex` branch on the fork.
  - Open PR upstream.

- **Projected total LOC in this repo:** ~80-150 LOC across 4 markdown/YAML files. **No code, no tests.** Story 3.3 is the leanest in Epic 3.

## Dev Agent Record

**DEF-SPIKE tracking:**
- [x] **DEF-SPIKE 1 resolved pre-dev via V-pass:** upstream repo path = **`bmad-code-org/bmad-plugins-marketplace`** (verified live; `bmadcode/...` is just DeepWiki's URL slug, the GitHub org doesn't exist). Task 1.1 confirms default branch + repo accessibility.
- [x] **DEF-SPIKE 2 partially resolved pre-dev via V-pass:** schema requires `category` + `subcategory` from upstream `categories.yaml` (BMAD docs confirm). `trust_tier` casing unverified (FR24 lowercase vs BMAD docs TitleCase). Task 1.2-1.3 fetches schema + categories.yaml + pins exact fields + casing.
- [x] **DEF-SPIKE 3 resolved pre-dev via V-pass:** upstream **DOES** run automated CI on community PRs (Validate Module + manifest verification + security scanning). AC4 manual fallback only fires if CI fails to trigger.
- [ ] DEF-SPIKE 4 — `bmad-cli validate-registry-entry` was speculative; actual command unknown locally. Task 6.2 spike order: `bmad-builder validate` → `bmad-method validate-plugin` → `bmad-method registry-check` → manual schema-match fallback. Answer = `_______________` (fill in).

**Deviations from spec:** (fill in during implementation)

**M12b status (V-pass E8 — structured template):**
- Reviewed by: ___________ (BMAD org member handle, or "none")
- Review date: ___________ (UTC ISO-8601, or "N/A")
- Outcome: ___________ (one of: APPROVED / CHANGES_REQUESTED / COMMENTED / NONE_BY_RELEASE)
- Notes: ___________ (1-line summary, or "M12b deferred per OP-4")

**Implementation pause note (2026-04-25 — Path C deferral):**

Tasks 0-3 ran cleanly:
- Task 0.1 ✓ `gh` authed as `amalik`
- Task 0.2 ✓ green baseline (`validate-marketplace` exit 0; `audit-skill-dirs` 99/99 pass)
- Task 1 ✓ DEF-SPIKEs 1-3 fully resolved (schema at `registry/registry-schema.yaml`; trust_tier lowercase confirmed; `business-and-strategy/product` is the right category pair); CONTRIBUTING + new-module PR template + whiteport-design-studio precedent + categories.yaml all retrieved
- Task 2 ✓ [`v63-3-3-convoke.yaml`](v63-3-3-convoke.yaml) authored — 7/7 cross-checks vs `marketplace.json` pass; YAML parses; three-version cross-check confirms marketplace.json + convoke.yaml align at 4.0.0 (package.json still 3.3.0, expected pre-ship)
- Task 3 ✓ [`v63-3-3-validation-log.md`](v63-3-3-validation-log.md) captured

**Tasks 4-7 (fork + PR + PluginResolver evidence + M12a/M12b capture) deferred per Path C decision** because:
- Story 3.1 + 3.2 + 3.3 work is **uncommitted** on the local tree (operator-managed commits per session policy). Until Story 3.1 + 3.2 are pushed to `https://github.com/amalik/convoke-agents`, the registry entry's `repository` field points at a remote tree state that LACKS `.claude-plugin/marketplace.json`, `_bmad/bme/_vortex/module.yaml`, the 7-agent skill-dir migration, and `audit-skill-dirs.js`. BMAD's reviewer (or upstream CI) would clone the repo, find the cited metadata missing, and reject the submission as broken — visible failure on a public BMAD repo.
- `v4.0.0` git tag does not yet exist; per Decision 1's Path A, `approved_sha: null` is acceptable per whiteport precedent, but the prerequisite tree-state issue is the harder blocker.

**Resume pre-conditions (operator-driven):**
1. Commit + push Story 3.1 + 3.2 + 3.3-local-artifacts to `amalik/convoke-agents` (the PR's `repository` target).
2. Optionally tag `v4.0.0` and pin `approved_sha` in `convoke.yaml` (otherwise null per whiteport precedent is fine).
3. Resume Story 3.3 from Task 4. Tasks 0-3 do NOT need to re-run unless the local tree has drifted (re-run Task 0.2 cheaply if so).

**M12a status:** PENDING per Path C deferral. Story 3.3 stays `in-progress` to signal the local work is real but external submission is paused on prereqs. Per OP-4, M12a timing is operator-controlled — no calendar pressure.

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-25 | Story moved ready-for-dev → in-progress via `/bmad-dev-story`. Tasks 0-3 ran cleanly: pre-flight gates green (gh authed as `amalik`; baseline `validate-marketplace` exit 0 + `audit-skill-dirs` 99/99 pass); Task 1 spike fully resolved DEF-SPIKEs 1-3 inline (schema at `registry/registry-schema.yaml`; trust_tier lowercase confirmed; category `business-and-strategy/product` is the right enum pair vs provisional `discovery/product-discovery` which doesn't exist; CONTRIBUTING + new-module PR template + whiteport-design-studio.yaml precedent + categories.yaml all retrieved); Task 2 authored `v63-3-3-convoke.yaml` with 7/7 cross-checks vs marketplace.json passing; Task 3 captured pre-submission validation log with frontmatter + version-drift acknowledgment. **Tasks 4-7 (fork + PR + PluginResolver evidence) DEFERRED per Path C** — operator chose to pause external submission because Story 3.1 + 3.2 + 3.3-local-artifacts are uncommitted on the local tree, so the registry entry's `repository` field would point at a remote tree state lacking marketplace.json, module.yaml, 7-agent skill-dir migration, and audit-skill-dirs.js → BMAD reviewer would clone + reject. Resume pre-conditions: (1) commit+push Story 3.1+3.2+3.3 work to `amalik/convoke-agents`; (2) optionally tag v4.0.0 + pin real SHA (else null per whiteport precedent is fine); (3) resume from Task 4. M12a status: PENDING per Path C; per OP-4, operator-controlled timing — no calendar pressure. Story stays `in-progress` to signal local work is real + external submission is paused on prereqs. | This file, `v63-3-3-convoke.yaml`, `v63-3-3-validation-log.md` |
| 2026-04-25 | `/bmad-validate-create-story` fresh-context V-pass applied **18 improvements**: **7 critical** — C1 (six wrong references to `bmadcode/bmad-plugins-marketplace`; real org is `bmad-code-org/...`; bulk-replaced); C2 (Architecture Decision 5 still has stale `amalikamriou` URL — Decision 1 now warns NOT to copy from arch); C3 (`_bmad-output/v63-3-3-convoke.yaml` intentionally NOT in `package.json.files[]` — documented in AC7 to prevent over-correction); C5 (added `category` + `subcategory` provisional values to Decision 1 — schema requires them per BMAD docs); C6 (`trust_tier` casing unverified; FR24 lowercase vs BMAD docs TitleCase — Task 1.3 verifies); C7 (PR title format may need to match upstream CONTRIBUTING.md — Task 1.5 added); C4 verified (`_bmad-output/` is NOT gitignored — no fix needed; documented). **8 enhancements** — E1 (Task 6.2 spike order: `bmad-builder validate` → `bmad-method validate-plugin` → `bmad-method registry-check` → manual; old `bmad-cli validate-registry-entry` was speculative); E2 (Task 4.0 verifies upstream default branch — could be `master`/`trunk`, not `main`); E3 (AC5 + Task 7.1 pin evidence to fork-branch SHA via `gh pr view --json headRefOid`); E4 (Task 0.2 pre-flight green-baseline check before external work); E5 (Task 2.4 three-version cross-check between `marketplace.json.plugins[0].version` and `convoke.yaml.version`); E6 (Task 0.1 pre-flight `gh auth status` + `--jq .login` matches `amalik`); E7 (Tasks 4 picks local-clone path; deleted gh-API alternative as fragile); E8 (M12b structured template — 4-field form replaces unstructured placeholder). **3 optimizations** — O1 (Task 8.3 explicit verification commands — `js-yaml.load` + `gray-matter` parse checks); O2 (AC1 keywords MUST be in same ORDER as `marketplace.json.keywords` — pinning prevents reorderings); O3 (AC7 spec-deviation guardrail — if Task 1 surfaces a need to touch `package.json`, surface to user, don't silently amend). **4 LLM-opts** — L1 (consolidated file inventory in Project structure notes only; Namespace decision now cross-references); L2 (split run-on Change Log entry into separate dated rows); L3 (Decisions 2/3 now 1-line each, with Why-rationale in Dev Notes only); L4 (AC4 paths summarized as decision table — easier to scan than nested If/And). **DEF-SPIKE answers (V-pass resolved 3 of 4):** DEF-SPIKE 1 = `bmad-code-org/bmad-plugins-marketplace`; DEF-SPIKE 2 partial (schema requires `category`+`subcategory`; trust_tier casing TBD by Task 1.3); DEF-SPIKE 3 = upstream DOES run automated CI on community PRs; DEF-SPIKE 4 unresolved (Task 6.2 spike order pinned). **V-pass findings dismissed:** 0; **2 verified-correct** (file naming convention, no-new-tests rationale). **Final spec shape:** 8 ACs + **3 Decisions** + **9 Tasks** (added Task 0 pre-flight; 0.1 + 0.2; expanded 1.5 + 2.4) + 0 tests (procedural). **Story remains ready-for-dev.** V-pass ROI: prevented 6 broken upstream references (C1) that would silently produce 404s on PR submission; pre-empted 4 task-design defects (E1/E2/E6/E7) that would require operator-driven recovery during /bmad-dev-story. Ready for `/bmad-dev-story` (operator-driven — needs `gh` CLI auth + `amalik` fork ownership). | This file |
| 2026-04-25 | Story created post-Story-3.2 close via `/bmad-create-story v63-3-3`. 8 ACs + 3 Decisions + 8 Tasks + 4 DEF-SPIKEs covering FR24 registry-submission + M12a ship-blocking PR + M12b operator-awareness (NOT ship-blocking per OP-4). Procedural story — no new code, no new tests; the 4 artifacts ARE the evidence. ~80-150 LOC across 4 markdown/YAML files (leanest in Epic 3). Critical risk PR1: if upstream `bmad-plugins-marketplace` repo doesn't exist yet, Epic 3 ship gate blocks. Pattern reuse: validate-marketplace + audit-skill-dirs are CONSUMED but NOT MODIFIED. | [sprint-status.yaml](sprint-status.yaml) |
