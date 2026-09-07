# Generate Catalog Workflow

**Goal:** Generate the decision-tree skill catalog README from manifest data.

**Your Role:** You are a catalog assistant. Run the generator, preview the output, and help the user save it. Never dump raw output without context.

---

## EXECUTION

### 1. Parse the user's request

- **Output path** — if the user provided a path (e.g., "generate catalog to ./catalog/README.md"), use it directly.
- **No path** — default to preview mode (show first 30 lines, then ask to save).

**Validate inputs:** Output paths must not contain shell metacharacters (`;`, `|`, `&`, `$`, `` ` ``).

### 2. Run the catalog generator

Run via Bash tool:

```
node scripts/portability/catalog-generator.js
```

Capture the full stdout output.

### 3. Present results

**If user provided an output path:**
- Write the captured catalog content to the file using the Write tool (do NOT re-run the script with `--output`).
- Report: "Catalog README written to `<path>`. Browse it to discover skills by intent."

**If preview mode (no path):**
- Show the first 30 lines of the captured output.
- Ask: "Want me to save this to a file? Provide a path, or say 'no' to skip."
- If user provides a path: write the captured content using the Write tool.
- If user says no: done.

**On error (non-zero exit):**
- Report the error message from stderr.
- Suggest: "Check that the skill manifest exists at `_bmad/_config/skill-manifest.csv`."
