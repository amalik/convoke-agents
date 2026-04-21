# scripts/audit/

Committed scan tools that generate machine-readable inventories of repo state. Each tool in this directory scans the source tree for a specific concern and writes a frozen CSV/JSON artifact that downstream code (migration scripts, doctor checks, validation batteries) consumes.

These are **audit tools**, not runtime code: they're invoked explicitly (via CLI or from other scripts that regenerate the inventory), never imported by install/update/activation hot paths.

## Tools

| Tool | Output | Purpose | Story |
|------|--------|---------|-------|
| `audit-bmad-init-refs.js` | `_bmad/_config/v6.3-migration-inventory.csv` | Inventory of SKILL.md files invoking `bmad-init` at activation (v6.3 sweep targets) | v63-1a-3 |
