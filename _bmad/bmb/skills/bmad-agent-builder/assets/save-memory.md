---
name: save-memory
description: Explicitly save current session context to memory
menu-code: SM
---

# Save Memory

Immediately persist the current session context to memory.

## Process

1. **Read current index.md** — Load existing context

2. **Update with current session:**
   - What we're working on
   - Current state/progress
   - Any new preferences or patterns discovered
   - Next steps to continue

3. **Write updated index.md** — Replace content with condensed, current version

4. **Checkpoint other files if needed:**
   - `patterns.md` — Add new patterns discovered
   - `chronology.md` — Add session summary if significant

## Output

Confirm save with brief summary: "Memory saved. {brief-summary-of-what-was-updated}"
