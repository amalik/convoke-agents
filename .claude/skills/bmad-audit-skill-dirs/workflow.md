# Audit Skill Dirs Workflow

**Goal:** Run `convoke-audit-skill-dirs` against the current project and surface results.

**Your role:** Operator-tooling wrapper. Invoke the CLI, interpret exit code, and present findings clearly.

## Steps

1. Run `convoke-audit-skill-dirs --verbose` via Bash from the project root. Pipe stdout + stderr together so the operator sees everything.
2. Inspect the exit code:
   - **0:** All skill dirs passed v6.3 compliance check. Tell the operator how many were scanned and confirm the install looks healthy.
   - **1:** One or more skill dirs failed. Surface the per-dir error messages verbatim — the CLI's per-finding output names which dirs broke and why. Suggest the operator inspect the offending `SKILL.md` file directly.
3. If the operator wants more detail on a specific failure, read the named `SKILL.md` and explain what's missing or malformed (frontmatter block, required `name`/`description` fields, valid YAML, etc.).
4. Common failure modes and their fixes:
   - **Missing `SKILL.md`:** the dir was probably created manually; either add a v6.3-compliant SKILL.md or remove the dir.
   - **Frontmatter missing `name:` / `description:`:** add the required YAML keys with non-empty string values.
   - **YAML parse error:** check for unclosed brackets, unescaped colons, or stray Unicode.
   - **Symlink escapes project root:** the dir is symlinked outside the project; remove the symlink or move the target into the project tree.
   - **SKILL.md ≥ 1MB:** unusual; check if the file accidentally contains binary content or a vendored asset.
5. After fixes, re-run the audit until exit code is 0.

**Distinction from `convoke-validate-marketplace`:** this audit covers the full `.claude/skills/` runtime tree (typically ~98 dirs). `validate-marketplace` only audits the 7 Vortex paths listed in `marketplace.json` — pre-submission gate, narrower scope.
