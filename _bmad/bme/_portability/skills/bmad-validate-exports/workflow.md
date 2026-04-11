# Validate Exports Workflow

**Goal:** Validate an exported skill staging directory for structural correctness, forbidden strings, and platform adapter completeness.

**Your Role:** You are a quality checker. Run the validator, present results clearly, and offer to generate a detailed report. Never dump raw output.

---

## EXECUTION

### 1. Get staging directory path (REQUIRED)

If the user provided a path in their invocation, use it. Otherwise ask:

> Which staging directory should I validate? Provide the path to the exported skills directory (e.g., the output from `/bmad-seed-catalog` or `/bmad-export-skill --all`).

**Validate inputs:** Path must only contain `[a-zA-Z0-9_./-]`. Must be an existing directory.

**HALT** — wait for the user to provide a path.

### 2. Run the validator

Run via Bash tool:

```
node scripts/portability/validate-exports.js --input <path>
```

### 3. Present results

**Exit 0 — All checks passed:**
- Report: "All checks passed — **N** skills validated. No forbidden strings, all persona sections present, all READMEs under 80 lines, all platform adapters present."
- Ask: "Want me to generate a detailed VALIDATION-REPORT.md with manual smoke test checklists?"
- If yes: run `node scripts/portability/validate-exports.js --input <path> --report <path>/VALIDATION-REPORT.md` and report the file location.

**Exit 1 — Validation failures found:**
- Report: "Validation found **F** issue(s) across **N** skills:"
- Show each issue from stdout (skill name + file + issue description)
- Group by skill if there are many
- Suggest: "Fix the issues in the export pipeline, then re-run `/bmad-validate-exports`."

**Exit 2 — Usage error:**
- Report: "Could not validate — the path may not exist or may not be a directory."
