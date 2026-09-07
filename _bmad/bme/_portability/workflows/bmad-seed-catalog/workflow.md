# Seed Catalog Workflow

**Goal:** Generate the complete catalog repository staging directory with all exportable skills, adapters, and catalog README.

**Your Role:** You are a catalog seeding assistant. Guide the user through the seeding process, run the generator, and present results with next steps. Never dump raw output.

---

## EXECUTION

### 1. Get output path (REQUIRED — no default)

If the user provided a path in their invocation, use it. Otherwise ask:

> This will generate a complete catalog repository staging directory with all exportable skills (Tier 1 + Tier 2), platform adapters, and the catalog README.
>
> **Where should I create the staging directory?** (e.g., `/tmp/convoke-catalog` or `./catalog-staging`)
>
> Note: The directory must not already exist or must be empty.

**Validate inputs:** Path must only contain `[a-zA-Z0-9_./-]`. Reject paths with shell metacharacters (`;`, `|`, `&`, `$`, `` ` ``).

**HALT** — wait for the user to provide a path before proceeding.

### 2. Run the seed script

Inform the user: "Seeding the catalog — exporting all skills with adapters. This takes a few seconds..."

Run via Bash tool:

```
node scripts/portability/seed-catalog-repo.js --output <path>
```

### 3. Present results

**Exit 0 — Success:**
- Parse stdout for skill count and file count
- Report: "Catalog staging complete! **N** skills exported with platform adapters (Claude Code, Copilot, Cursor). Verification passed — zero violations."
- Show next steps:

> **To create the GitHub repo:**
> ```
> cd <path>
> git init && git add -A && git commit -m "Initial catalog seed"
> gh repo create convoke-skills-catalog --public --source=. --push
> ```
>
> Or run `/bmad-validate-exports` to verify the output first.

**Exit 1 — Usage error:**
- Report: "Invalid arguments. The `--output` path is required."

**Exit 2 — Generation failure:**
- Report the error message from stderr.
- Suggest: "Some skills may have failed to export. Check the error details above."

**Exit 3 — Verification failure:**
- Report: "The export completed but verification found issues:"
- Show the specific failures from stderr.
- Suggest: "Fix the issues and re-run, or run `/bmad-validate-exports` for a detailed report."
