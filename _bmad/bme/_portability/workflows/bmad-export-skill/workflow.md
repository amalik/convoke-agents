# Export Skill Workflow

**Goal:** Export a BMAD skill to portable LLM-agnostic format via guided conversation.

**Your Role:** You are a portability assistant. Parse the user's request, run the export command, and present results clearly. Never dump raw CLI output — always format conversationally.

---

## EXECUTION

### 1. Parse the user's request

Extract from the invocation text:

- **Skill name** — a specific skill like `bmad-brainstorming`
- **Batch mode** — "all", "tier 1", "tier 2", "everything", "all skills"
- **Output path** — any path mentioned after "to" or "output" or "in"
- **Dry run** — "preview", "dry run", "what would happen", "without writing"

**Validate inputs:** Skill names must only contain letters, numbers, and hyphens (`[a-zA-Z0-9-]`). Output paths must not contain shell metacharacters (`;`, `|`, `&`, `$`, `` ` ``). Reject invalid inputs with a clear message.

**If the intent is clear** (e.g., `/bmad-export-skill bmad-brainstorming`), proceed immediately with defaults. Do NOT ask to confirm parameters the user already provided.

**If no skill name or mode is provided**, ask:

> Which skill do you want to export? You can say:
> - A skill name (e.g., `bmad-brainstorming`)
> - `all` — export all portable skills (Tier 1 + Tier 2)
> - `tier 1` — only standalone skills
> - `tier 2` — only light-deps skills

### 2. Build and run the command

Use the project root to construct the command. Default output: `./exported-skills/` from project root.

**In a Convoke development checkout** (the project root's `package.json` has `"name": "convoke-agents"`), run `scripts/portability/convoke-export.js` with `node` and the same arguments instead of the `npx` commands below: inside the checkout, `npx -p convoke-agents` finds the checkout's own package name, installs nothing, and the command is not found or resolves to an old global copy.

| Mode | Command |
|---|---|
| Single skill | `npx -p convoke-agents convoke-export <name> --output <path>` |
| Tier batch | `npx -p convoke-agents convoke-export --tier <N> --output <path>` |
| All | `npx -p convoke-agents convoke-export --all --output <path>` |

Add `--dry-run` if the user requested a preview.

Run the command via the Bash tool.

### 3. Present results

Parse the command output and exit code:

**Exit 0 — Success:**
- Count the `✅` lines in stdout for the success count
- Report: "Exported **N** skill(s) to `<path>/`. Each skill has `instructions.md`, `README.md`, and platform adapters for Claude Code, Copilot, and Cursor."
- If warnings > 0: "**W** warnings generated (mostly unmapped config variables — safe to ignore)."
- Suggest next steps: "Each skill's `README.md` says where to copy its adapter for Claude Code, Copilot, or Cursor."

**Exit 2 — Skill not found:**
- Report: "Skill `<name>` was not found in the manifest. Check the spelling or run `/bmad-help` to see available skills."

**Exit 3 — Tier not supported:**
- Report: "Tier 3 (pipeline) skills cannot be exported — they require the full Convoke framework."

**Exit 4 — Partial failure (batch):**
- Count `✅` and `❌` lines
- Report: "Exported **S** of **N** skills. **F** failed."
- List the failed skills with their error messages (from `❌` lines on stderr)

**Dry run:**
- If `[DRY RUN]` appears in output: "Preview complete — would export **N** skills. No files were written."

**Exit 1 — Usage error, or the package could not be fetched:**
- If stderr has `npm error` lines, `npx` could not fetch `convoke-agents` (offline, or a registry problem): report those lines verbatim.
- Otherwise report: "Invalid arguments. Check the skill name and flags. Run `/bmad-help` for guidance."

**Any other error:**
- Report the error message from stderr verbatim.
