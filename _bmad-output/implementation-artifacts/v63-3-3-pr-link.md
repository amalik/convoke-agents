---
artifact_type: pr-link
story: v63-3-3-submit-marketplace-registry-pr
m12a_evidence: true
pr_url: https://github.com/bmad-code-org/bmad-plugins-marketplace/pull/9
pr_number: 9
pr_title: "Add Convoke (community module: 7-agent product discovery framework)"
upstream_repo: bmad-code-org/bmad-plugins-marketplace
upstream_default_branch: main
fork_repo: amalik/bmad-plugins-marketplace
fork_branch: add-convoke-vortex
fork_branch_head_commit_sha: 8f59e9aa641a07b7a95101a4c163f6467975e970  # post-R2-DN1 revert; R1-M2 commit was f45f2e11a7cd3033e6967fb122366f51832d10d0; original-submission was aa8732d3602a258bffefc32baa73ee16de3446a9
convoke_yaml_blob_sha_at_head: ff4ee1237bd3e32b91c557fce2a764c3f64f9cc8  # post-R2-DN1 revert; identical to original-submission blob (R1-M2 broadened blob d866a84f3d07df4c39b9a663b7f4a79849c2e927 was reverted)
submission_timestamp_utc: 2026-04-25T09:21:04Z
validation_status: PASS
validation_method: manual-schema-match per OP-4 fallback (10 base-required + 5 community-only required + 5 optional fields = 20 ✓ verified; 2 optional intentionally omitted; CodeRabbit AI review pending; no PluginResolver workflow exists in upstream repo)
validation_log: v63-3-3-validation-log.md
remote_verification_repo: amalik/convoke-agents
remote_verification_head_sha: 028669b2cd7a5cc072dbf923640c5dd63d03b3ef
remote_verification_blob_shas:
  .claude-plugin/marketplace.json: 1edefe1bb5b8d8a1cd780b304e87f22db6fa52cf
  _bmad/bme/_vortex/module.yaml: bd50e5da4a3298a54cb07daa7ea6771d3bdf86ca
  scripts/audit/audit-skill-dirs.js: daf1567a055c54f996f756d2fc5276a14299fb16
  scripts/audit/validate-marketplace.js: 3d0ea07884389ca47f1fed2af6473b260b5c792b
  _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md: 8452b679fa32e29575aabbf303da817bd0e7f154
  _bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md: cda02c24882b971ef913ce2a6453099745c6aed2
  _bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md: dd332ae9d3600056285f167d7875733ce1952685
  _bmad/bme/_vortex/agents/hypothesis-engineer/SKILL.md: 46ce33f5859d45072dcb53ea2ebb64d9d04762df
  _bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md: 36cc5e4833bdc434b5a1b359e4d6cfbe8250b899
  _bmad/bme/_vortex/agents/production-intelligence-specialist/SKILL.md: ce44f86898ff39c01e7f9d2d3f141b847f5b4341
  _bmad/bme/_vortex/agents/learning-decision-expert/SKILL.md: 280bfd697aec9766d82e6dcbea7c4c6bdc2f6747
remote_verification_main_drift_warning: "amalik/convoke-agents@main has advanced past 028669b2 to c0a7f284 (BUG-5 chain-walker fix, post-Story-3.3 commit). Pin valid for submission-time evidence; reviewers cloning main today read a different tree. To re-verify, run `gh api repos/amalik/convoke-agents/branches/main --jq .commit.sha` and confirm match against pinned SHA OR re-pin to current HEAD."
m12b_status: PENDING
---

# M12a evidence — Story v63-3-3

## PR submission

| Field | Value |
|---|---|
| PR URL | https://github.com/bmad-code-org/bmad-plugins-marketplace/pull/9 |
| Title | Add Convoke (community module: 7-agent product discovery framework) |
| Submitted | 2026-04-25T09:21:04Z |
| Upstream repo | `bmad-code-org/bmad-plugins-marketplace` |
| Upstream branch | `main` (default) |
| Fork repo | `amalik/bmad-plugins-marketplace` |
| Fork branch | `add-convoke-vortex` |
| Fork branch HEAD commit-SHA (post-R2-DN1 revert) | `8f59e9aa641a07b7a95101a4c163f6467975e970` |
| Fork branch R1-M2-amendment commit-SHA | `f45f2e11a7cd3033e6967fb122366f51832d10d0` (reverted by R2-DN1) |
| Fork branch original-submission commit-SHA | `aa8732d3602a258bffefc32baa73ee16de3446a9` |
| `convoke.yaml` blob-SHA on fork (post-R2-DN1; identical to original) | `ff4ee1237bd3e32b91c557fce2a764c3f64f9cc8` |
| State | OPEN |

## Remote-tree verification (R1-M7)

The registry entry's `repository: https://github.com/amalik/convoke-agents` was verified to point at a tree state containing all the metadata the entry references. **Repo HEAD SHA at verification:** `028669b2cd7a5cc072dbf923640c5dd63d03b3ef`. Per-file blob SHAs (post-R2-H1: full 7-agent enumeration):

| Path | Blob SHA |
|---|---|
| `.claude-plugin/marketplace.json` | `1edefe1bb5b8d8a1cd780b304e87f22db6fa52cf` |
| `_bmad/bme/_vortex/module.yaml` | `bd50e5da4a3298a54cb07daa7ea6771d3bdf86ca` |
| `scripts/audit/audit-skill-dirs.js` | `daf1567a055c54f996f756d2fc5276a14299fb16` |
| `scripts/audit/validate-marketplace.js` | `3d0ea07884389ca47f1fed2af6473b260b5c792b` |
| `_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md` | `8452b679fa32e29575aabbf303da817bd0e7f154` |
| `_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md` | `cda02c24882b971ef913ce2a6453099745c6aed2` |
| `_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md` | `dd332ae9d3600056285f167d7875733ce1952685` |
| `_bmad/bme/_vortex/agents/hypothesis-engineer/SKILL.md` | `46ce33f5859d45072dcb53ea2ebb64d9d04762df` |
| `_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md` | `36cc5e4833bdc434b5a1b359e4d6cfbe8250b899` |
| `_bmad/bme/_vortex/agents/production-intelligence-specialist/SKILL.md` | `ce44f86898ff39c01e7f9d2d3f141b847f5b4341` |
| `_bmad/bme/_vortex/agents/learning-decision-expert/SKILL.md` | `280bfd697aec9766d82e6dcbea7c4c6bdc2f6747` |

A BMAD reviewer cloning `amalik/convoke-agents@028669b2` will find every path the registry entry depends on, including ALL 7 Vortex agent SKILL.md files.

**⚠ Main-drift acknowledgment (R2-M7):** `amalik/convoke-agents@main` has advanced past `028669b2` to `c0a7f284` (BUG-5 chain-walker fix, post-Story-3.3 commit). Pin valid for submission-time evidence; reviewers cloning `main` today read a different tree (which still contains all the cited paths — BUG-5 only modified `scripts/update/migrations/` files unrelated to the registry entry). To re-verify, run `gh api repos/amalik/convoke-agents/branches/main --jq .commit.sha` and confirm match against pinned SHA OR re-pin to current HEAD.

## Validation status

**M12a (ship-blocking — PR open + validates):** ✅ MET via Path C (manual schema-match per OP-4 fallback).

- **Path A (upstream CI):** only CodeRabbit (AI review bot) running at submission time; the marketplace repo has no PluginResolver workflow (`.github/workflows/` only contains `generate-index.yaml` which fires on merge, not PR).
- **Path B (local validator):** exhausted. `npx bmad-builder validate` (package doesn't expose a CLI), `npx bmad-method validate-plugin` (unknown command), `npx bmad-method registry-check` (unknown command). DEF-SPIKE 4 confirmed: no local PluginResolver tool exists for community modules.
- **Path C (manual schema-match):** **PASS — 10/10 base-required + 5/5 community-only required + 5 optional fields verified.** All required fields present with correct types + enum values. Two optional fields (`promoted`, `promoted_rank`) intentionally omitted (community modules don't self-promote; sort order is BMAD org's call). Per OP-4, manual schema-match is acceptable M12a satisfaction.

Full validation evidence in [`v63-3-3-validation-log.md`](v63-3-3-validation-log.md).

**M12b (aspirational — upstream review feedback):** PENDING. Per OP-4, NOT ship-blocking. Status will be filled in by the operator at story-close per the structured template in the story file's Dev Agent Record.

## Reviewer notes

- `approved_sha: null` placeholder per `whiteport-design-studio.yaml` precedent. Will be pinned in a follow-up "Version Update" PR after Convoke v4.0.0 tags.
- `version: "4.0.0"` is the publication target (Convoke `package.json` is currently 3.3.0). All other registry fields reflect the post-4.0 state already shipped in `amalik/convoke-agents@main` (verified at HEAD SHA 028669b2 — see Remote-tree verification above).
- `reviewer: pending` and `approved_date: "2026-04-25"` per upstream `CONTRIBUTING.md` template literal values for unverified initial submissions.
- Reviewer feedback channel: PR comments OR direct mention `@amalik` on the PR.
