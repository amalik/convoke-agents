---
initiative: convoke
artifact_type: validation-log
story: v63-3-3-submit-marketplace-registry-pr
gate_run_timestamp_utc: 2026-04-25T09:09:03Z
convoke_version_at_gate_run: 3.3.0
validate_marketplace_exit_code: 0
audit_skill_dirs_exit_code: 0
gate_pass: true
gate_2_method: manual-schema-match-OP4-fallback
gate_2_caveats: "no PluginResolver tool available locally OR upstream; CodeRabbit AI bot only auto-check on PR; full enumeration of 10 base-required + 5 community-only + 5 optional fields"
note_version_drift: "marketplace.json v4.0.0 vs package.json v3.3.0 WARNING is INFORMATIONAL — Decision 1 explicitly authors registry at publication-target 4.0.0 ahead of actual tag. Story 3.1's E5 escalation refers to the npm-publish gate (Story 4.x), not the registry-submission gate (this story)."
---

# Pre-submission validation log — Story v63-3-3

This file is M12a evidence for AC2 (pre-submission gate) and AC4 (PluginResolver validation, appended later).

## Gate run 1 — pre-submission (AC2)

**Timestamp:** 2026-04-25T09:09:03Z
**Convoke version (`package.json`):** 3.3.0
**Tools invoked:**
- `node scripts/audit/validate-marketplace.js --verbose`
- `node scripts/audit/audit-skill-dirs.js --verbose`

### `convoke-validate-marketplace` output

```
exit code: 0

Marketplace validation:
  ✓ marketplace.json — parseable
    parsed successfully (971 bytes)
  ✓ marketplace.json — required top-level fields
    6 required fields present; 1 plugin entry
  ✓ marketplace.json — plugin entry structure
    plugin "convoke-vortex" v4.0.0 with 7 skills
  ✓ skills[] paths — FM5-1 audit
    7 skill dirs audited; all v6.3-compliant
  ✓ module.yaml — parseable + required fields
    code=bme; 6 fields
  ⚠ version alignment (marketplace.json vs package.json)
    marketplace.json v4.0.0 vs package.json v3.3.0 — expected during pre-4.0 dev; escalates to ERROR at Story 3.3's publish gate

  5 check(s) passed; 1 warning(s).
```

### `convoke-audit-skill-dirs` output

```
exit code: 0

Skill directory audit:

  99 skill dir(s) audited; all passed.
```

(Per-dir verbose output suppressed for brevity — all 99 skill directories pass v6.3 frontmatter compliance.)

## Version drift acknowledgment

The `version alignment` WARNING from `validate-marketplace` reflects the expected pre-4.0 state: `marketplace.json` and `convoke.yaml` both pin the publication-target version (`4.0.0`), while `package.json` is still at the currently-shipped `3.3.0`. This drift is INTENTIONAL per Story 3.3 Decision 1.

Story 3.1's V-pass E5 ("version drift escalates to ERROR at Story 3.3's publish gate") refers to the **npm publish + git tag** gate, which is in Story 4.x scope, not the registry-submission gate (this story). The registry-submission gate accepts the WARNING as informational.

## Code-namespace collision check (R1-M3; R2-M5 single-command rewrite)

**Timestamp:** 2026-04-25 (R1 evidence add; R2-M5 single-reproducible-command rewrite)

Verified `code: bme` is unclaimed in the upstream registry by enumerating all `code:` values across the entire registry tree (`official.yaml` + `community/*.yaml` + `utility/*.yaml`) via a single reproducible pipeline (run live during R2-M5 patch):

```
$ gh api 'repos/bmad-code-org/bmad-plugins-marketplace/git/trees/HEAD?recursive=1' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); [print(e['path']) for e in d['tree'] if e['type']=='blob' and (e['path']=='registry/official.yaml' or (e['path'].startswith('registry/community/') and e['path'].endswith('.yaml')) or (e['path'].startswith('registry/utility/') and e['path'].endswith('.yaml')))]"
registry/community/whiteport-design-studio.yaml
registry/official.yaml
registry/utility/bmad-utility-skills.yaml

$ while read p; do gh api "repos/bmad-code-org/bmad-plugins-marketplace/contents/$p" --jq .content | base64 -d | grep -E "^\s*code:"; done < <(above) | sort -u
    code: bmb
    code: bmm
    code: cis
    code: core
    code: gds
    code: tea
code: wds
```

Existing codes: `bmb, bmm, cis, core, gds, tea, wds` (7 entries). The utility-tier file `registry/utility/bmad-utility-skills.yaml` is a multi-skill listing without a top-level `code:` field. **`bme` is NOT taken** — no collision. Convoke's `code: bme` registers the namespace cleanly.

## Gate run 2 — PluginResolver / schema-match evidence (AC4)

**Timestamp:** 2026-04-25T09:22:00Z (post-PR submission)
**PR:** https://github.com/bmad-code-org/bmad-plugins-marketplace/pull/9 (commit-SHA aa8732d3602a258bffefc32baa73ee16de3446a9; convoke.yaml blob-SHA ff4ee1237bd3e32b91c557fce2a764c3f64f9cc8)

**Note on timing (R1-L3 acknowledgment):** Gate-2 evidence was compiled POST-submission per AC4 design (Path A — upstream CI — can only run against an open PR; Path C manual schema-match was run as parallel evidence at 09:22:00Z, after PR creation at 09:21:04Z). The pre-submission gate (AC2) ran at gate-1 timestamp 09:09:03Z and is the AC that gates submission. Gate-2 is M12a aspiration evidence (PR validates), not AC2 evidence (gate ran before push).

### Path A (upstream CI) — partial

```
$ gh pr checks https://github.com/bmad-code-org/bmad-plugins-marketplace/pull/9
CodeRabbit	pending	0		Review in progress
```

CodeRabbit is an AI code review bot — not a PluginResolver schema validator. The upstream marketplace repo has no PluginResolver workflow (`.github/workflows/` only contains `generate-index.yaml` which fires on merge, not on PR). DEF-SPIKE 3 (V-pass) said "upstream DOES run automated CI on community PRs" — but the upstream-docs description doesn't match the actual `.github/workflows/` state at submission time. As of this submission, no schema-validating CI fires on community-tier PRs.

### Path B (local validator) — exhausted

```
$ npx -y bmad-builder validate _bmad-output/implementation-artifacts/v63-3-3-convoke.yaml
npm error could not determine executable to run

$ npx -y bmad-method validate-plugin _bmad-output/implementation-artifacts/v63-3-3-convoke.yaml
error: unknown command 'validate-plugin'

$ npx -y bmad-method registry-check _bmad-output/implementation-artifacts/v63-3-3-convoke.yaml
error: unknown command 'registry-check'
```

DEF-SPIKE 4 (V-pass) resolved: no local PluginResolver tool exists. `bmad-method` is in npm but doesn't expose `validate-plugin` or `registry-check` subcommands; `bmad-builder` doesn't expose a CLI binary at all.

### Path C (manual schema-match per OP-4) — PASS

Loaded `/tmp/registry-schema.yaml` (fetched from `bmad-code-org/bmad-plugins-marketplace/registry/registry-schema.yaml`) + `_bmad-output/implementation-artifacts/v63-3-3-convoke.yaml`. **Per R1-H2 fix: explicit per-field assertions for 22 fields total — 15 schema-required (10 base + 5 community-only) + 5 included optional + 2 intentionally omitted.** (R2-M6 framing-consistency fix: matches frontmatter `gate_2_caveats` field.)

#### 10 base-required fields:

```
  ✓ name="convoke-vortex"                                      [type=string ✓]
  ✓ display_name="Convoke: Vortex Discovery Framework"         [type=string ✓]
  ✓ description="Vortex Framework — 7-stream..."               [type=string ✓]
  ✓ repository="https://github.com/amalik/convoke-agents"      [type=string ✓]
  ✓ author="Amalik Amriou"                                     [type=string ✓]
  ✓ license="MIT"                                              [type=string ✓]
  ✓ type="community"                                           [enum ✓: community vs bmad-org]
  ✓ category="business-and-strategy"                           [enum ✓: present in categories.yaml]
  ✓ subcategory="product"                                      [enum ✓: present under business-and-strategy in categories.yaml]
  ✓ trust_tier="unverified"                                    [enum ✓: unverified vs community-reviewed vs bmad-certified]
```

#### 5 community-only required fields:

```
  ✓ version="4.0.0"                                            [type=string ✓; publication target per Decision 1 Path A]
  ✓ approved_tag="v4.0.0"                                      [type=string ✓; matches CONTRIBUTING.md template <release tag>; tag will exist post-Story-4.x npm-publish]
  ✓ approved_sha=null                                          [explicit null per whiteport-design-studio.yaml precedent (`null # TODO: pin to actual commit SHA`); will be pinned in Version Update PR after Convoke 4.0 ships]
  ✓ approved_date="2026-04-25"                                 [type=string ✓; matches CONTRIBUTING.md template `"<today's date>"` for unverified initial submissions]
  ✓ reviewer="pending"                                         [type=string ✓; matches CONTRIBUTING.md template literal `reviewer: pending` for unverified initial submissions]
```

#### 5 optional fields included:

```
  ✓ code="bme"                                                 [type=string ✓; collision check above shows unclaimed]
  ✓ module_definition="_bmad/bme/_vortex/module.yaml"          [type=string ✓; remote-verified — see "Remote verification" below]
  ✓ npm_package="convoke-agents"                               [type=string ✓; matches package.json.name]
  ✓ default_selected=false                                     [type=boolean ✓]
  ✓ keywords=["bmad","discovery","vortex","product-discovery","innovation"]  [type=array ✓; matches marketplace.json.keywords order per AC1]
```

#### 2 optional fields intentionally omitted:

```
  ⊘ promoted                  (not provided — community modules don't self-promote)
  ⊘ promoted_rank             (not provided — sort order set by BMAD org, not submitter)
```

**RESULT: 20 ✓ / 0 ✗ / 2 ⊘. All required fields (10 base + 5 community-only) present + types + enums match. All 5 included optional fields validated. PASS per OP-4 manual schema-match.**

### M12a verdict

**PASS via Path C.** PR open + complete schema-match verified for all required + included-optional fields. Per OP-4, upstream review responsiveness (Path A CI gating) is out of scope for ship-blocking. Manual schema-match closes M12a regardless of upstream CI behavior.

## Remote verification (R1-M7)

**Timestamp:** 2026-04-25 (R1 evidence add)
**`amalik/convoke-agents` HEAD SHA at verification:** `028669b2cd7a5cc072dbf923640c5dd63d03b3ef`

Each path cited by `convoke.yaml` verified to exist on `amalik/convoke-agents@main` HEAD via `gh api repos/amalik/convoke-agents/contents/<path>`:

```
marketplace.json blob:                          1edefe1bb5b8d8a1cd780b304e87f22db6fa52cf
module.yaml blob:                               bd50e5da4a3298a54cb07daa7ea6771d3bdf86ca
audit-skill-dirs.js blob:                       daf1567a055c54f996f756d2fc5276a14299fb16
validate-marketplace.js blob:                   3d0ea07884389ca47f1fed2af6473b260b5c792b
_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md blob:  8452b679fa32e29575aabbf303da817bd0e7f154
```

This pin makes the operator's "everything pushed" claim falsifiable. A BMAD reviewer cloning at this SHA WILL find the cited paths.
