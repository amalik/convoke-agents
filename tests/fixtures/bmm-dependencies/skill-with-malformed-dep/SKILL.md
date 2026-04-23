---
name: skill-with-malformed-dep
description: Fixture — dependencies is a bare string instead of an array (AC9 case 7).
dependencies: bmad-agent-pm
---

Scan must emit a stderr warning and skip this skill's frontmatter source.
Step-file grep (absent here) still runs normally.
