---
name: skill-with-removed-dep
description: Fixture — skill whose frontmatter listed bmad-agent-pm historically but now does not (AC9 case 6).
dependencies:
  - bmad-agent-dev
---

The existing CSV has an auto-scan row for bmad-agent-pm against this skill.
The scan must drop that row (dep-removed) since bmad-agent-pm is no longer
referenced in frontmatter or step files.
