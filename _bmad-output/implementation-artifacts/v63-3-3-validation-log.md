---
artifact_type: validation-log
story: v63-3-3-submit-marketplace-registry-pr
gate_run_timestamp_utc: 2026-04-25T09:09:03Z
convoke_version_at_gate_run: 3.3.0
validate_marketplace_exit_code: 0
audit_skill_dirs_exit_code: 0
gate_pass: true
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

(Per-dir verbose output suppressed for brevity — all 99 skill directories pass v6.3 frontmatter compliance. Full verbose output captured in `/tmp/asd-verbose.log` during the run; reproducible via `node scripts/audit/audit-skill-dirs.js --verbose`.)

## Version drift acknowledgment

The `version alignment` WARNING from `validate-marketplace` reflects the expected pre-4.0 state: `marketplace.json` and `convoke.yaml` both pin the publication-target version (`4.0.0`), while `package.json` is still at the currently-shipped `3.3.0`. This drift is INTENTIONAL per Story 3.3 Decision 1 (registry entry authored at publication target ahead of npm publish + git tag).

Story 3.1's V-pass E5 ("version drift escalates to ERROR at Story 3.3's publish gate") refers to the **npm publish + git tag** gate, which is in Story 4.x scope, not the registry-submission gate (this story). The registry-submission gate (this AC2 run) accepts the WARNING as informational.

## Gate run 2 — PluginResolver validation (AC4)

**Status:** pending — captured after Tasks 5-6 (PR submission + upstream CI).

This section will be appended after the PR is open and either:
- (a) Upstream CI on the PR runs + passes, OR
- (b) Local validator (`bmad-builder validate` or fallback) runs + passes, OR
- (c) Manual schema-match per OP-4 fallback.

