# Architecture Decision Record: Artifact Governance Convention

**Status:** ACCEPTED
**Date:** 2026-04-10
**Decision Makers:** Convoke migration tool
**Supersedes:** adr-repo-organization-conventions-2026-03-22.md

---

## Context

The project accumulated artifacts across multiple initiatives (Vortex, Gyre, Forge, Helm, Enhance, Loom, Convoke) using inconsistent naming conventions. Files like `prd-gyre.md`, `architecture-gyre.md`, and `hc2-problem-definition-gyre-2026-03-21.md` followed different patterns, making it difficult to identify which initiative owned each artifact and to build automated tooling on top of the artifact structure.

## Decision

All artifacts within `_bmad-output/` follow the governance naming convention:

```
{initiative}-{artifact_type}[-{qualifier}][-{date}].md
```

**Examples:**
- `gyre-prd.md` (initiative: gyre, type: prd)
- `helm-lean-persona-2026-04-04.md` (initiative: helm, type: lean-persona, date)
- `forge-problem-def-hc2-2026-03-21.md` (initiative: forge, type: problem-def, qualifier: hc2, date)

## Taxonomy

**Platform initiatives (8):** vortex, gyre, bmm, forge, helm, enhance, loom, convoke

**Artifact types (21):** prd, epic, arch, adr, persona, lean-persona, empathy-map, problem-def, hypothesis, experiment, signal, decision, scope, pre-reg, sprint, brief, vision, report, research, story, spec

**Aliases (migration-specific):** Historical name variants mapped to canonical initiative IDs during migration (e.g., strategy-perimeter -> helm, team-factory -> loom).

## Frontmatter Schema v1

Every governed artifact includes YAML frontmatter with these required fields:

```yaml
---
initiative: gyre          # Required. From taxonomy.yaml
artifact_type: prd        # Required. From taxonomy.yaml
created: 2026-04-06       # Required. ISO 8601 date
schema_version: 1         # Required. Integer >= 1
---
```

Existing frontmatter fields are preserved — migration adds fields, never overwrites.

## Migration Scope

- **Directories:** planning-artifacts, vortex-artifacts, gyre-artifacts
- **Files renamed:** 78
- **Frontmatter injected:** 78
- **Links updated:** 42
- **Archive excluded:** `_bmad-output/_archive/` always excluded (FR50)

## Consequences

- All artifacts are discoverable by initiative and type via filename convention
- Automated portfolio tooling can infer initiative state from artifact metadata
- `git log --follow` preserves full history for renamed files
- The previous convention (type-first: `prd-gyre.md`) is superseded
