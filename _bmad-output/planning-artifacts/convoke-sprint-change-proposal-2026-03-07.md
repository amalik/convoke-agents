# Sprint Change Proposal: npm Package Name convoke → convoke-agents

**Date:** 2026-03-07
**Triggered by:** Story p3-4-1 review — `convoke` name already taken on npm
**Approved by:** Amalik (Project Lead)
**Scope:** Minor — Direct Adjustment

---

## Issue Summary

The npm package name `convoke` is already taken (`convoke@0.9.1` by `ahelmberger`). Phase 3 Epics 1-3 committed `convoke` as the package name across ~200 files. The npm package name must change to `convoke-agents`. The GitHub repo will also be renamed to `convoke-agents` for consistency.

**Key distinction:** The product display name "Convoke" does NOT change. Only the npm package identifier and GitHub repo URL change.

## Impact Analysis

| What changes | Pattern | Approx count |
|---|---|---|
| npm package name | `"convoke"` → `"convoke-agents"` in package.json | 1 |
| Install commands | `npm install convoke` → `npm install convoke-agents` | ~40 |
| npm URLs | `npmjs.com/package/convoke` → `npmjs.com/package/convoke-agents` | ~10 |
| npx invocations | `npx -p convoke@` → `npx -p convoke-agents@` | ~5 |
| Badge URLs | `fury.io/js/convoke` → `fury.io/js/convoke-agents` | ~3 |
| GitHub URLs | `github.com/amalik/convoke` → `github.com/amalik/convoke-agents` | ~93 |
| docs-audit.js | stale-ref check pattern | 1 |
| `_bmad-output/` historical | same patterns | ~67 |
| **Total** | | **~220** |

**NOT affected:** Display name "Convoke", CLI commands `convoke-*`, `_bmad/` paths, agent IDs, test files.

## Recommended Approach

**Direct Adjustment:** Insert new Story 4.0 before existing 4.1.

### Updated Epic 4 Story List

| # | Story | Status | Change |
|---|-------|--------|--------|
| **4.0** | **Update npm package name and repo URL to convoke-agents** | **backlog (NEW)** | Added |
| 4.1 | Reserve npm package name (`convoke-agents@0.0.1`) | backlog | Updated package name |
| 4.2 | Publish deprecation version (`bmad-enhanced@1.8.0`) | backlog | Updated target name |
| 4.3 | Final verification & publish (`convoke-agents@2.0.0`) | backlog | Updated package name |

## Implementation Handoff

**Scope:** Minor — direct implementation by dev team
**Handoff:** Dev agent via `create-story` → `dev-story` → `code-review` workflow

**Story 4.0 implementation approach:**
1. Update `package.json` name field + regenerate `package-lock.json`
2. Sed pipeline for GitHub URLs: `github.com/amalik/convoke` → `github.com/amalik/convoke-agents`
3. Sed pipeline for npm package contexts: `install convoke` → `install convoke-agents`, etc.
4. Update `docs-audit.js` stale-ref pattern
5. Update `_bmad-output/` historical docs (same patterns)
6. Full verification: `npm test`, `docs-audit`, grep audit

**Risk:** Low — mechanical replacement using proven Epic 3 sed pipeline patterns
