# Convoke Friction Log Template

**Purpose:** Capture moments where consultants wish Convoke could help but currently can't.
**Audience:** Consultants and architects using Convoke on real engagements.
**Frequency:** Log entries as they happen. Review quarterly for scope prioritization.

---

## How to use

When you hit a moment where you think *"I wish Convoke had something for this"* — log it. Takes 2 minutes. Don't overthink it.

Each entry becomes a demand signal for the ecosystem. Enough entries in the same area = validated demand for a new capability.

---

## Friction Log

### Entry template

Copy this block for each entry:

```markdown
---

**Date:** YYYY-MM-DD
**Consultant:** [your name]
**Client/Engagement:** [client name or engagement code]
**Engagement week:** [e.g., Week 2]

**What were you trying to do?**
[One sentence. What task or goal were you working on?]

**What was missing?**
[One sentence. What capability or support did you need that Convoke doesn't have?]

**How did you work around it?**
[One sentence. What did you do instead? Or did you just skip it?]

**How did it feel?**
[One word or phrase: frustrating / minor inconvenience / blocking / "I just moved on"]

**Which ecosystem scope does this map to (if any)?**
[Forge / Sentinel / Ledger / Pulse / Loom / Conduit / Compass / New / Not sure]

---
```

---

## Example entries

---

**Date:** 2026-03-15
**Consultant:** Sarah
**Client/Engagement:** ACME-MODERNIZATION
**Engagement week:** Week 1

**What were you trying to do?**
Understand why the payment service has a 4 AM restart cron job.

**What was missing?**
A structured way to extract and document tribal knowledge from the client's ops team.

**How did you work around it?**
Took notes in a personal doc, spent 3 hours chasing the answer across 4 people.

**How did it feel?**
Frustrating — this always happens in week 1.

**Which ecosystem scope does this map to?**
Forge

---

**Date:** 2026-03-18
**Consultant:** Marco
**Client/Engagement:** BANK-CORE-REWRITE
**Engagement week:** Week 6

**What were you trying to do?**
Show the client's VP that the new system meets their internal security policy.

**What was missing?**
A way to map client-specific compliance obligations to what Gyre found.

**How did you work around it?**
Manually created a spreadsheet mapping policies to Gyre findings.

**How did it feel?**
Minor inconvenience — but I know I'll do this on every banking client.

**Which ecosystem scope does this map to?**
Ledger (or Forge→Gyre integration for RCAs)

---

**Date:** 2026-03-20
**Consultant:** Sarah
**Client/Engagement:** ACME-MODERNIZATION
**Engagement week:** Week 4

**What were you trying to do?**
Figure out who in the client org is blocking the architecture decision.

**What was missing?**
Stakeholder mapping and political navigation support.

**How did you work around it?**
Asked my manager, who'd worked with this client before. Got lucky.

**How did it feel?**
"I just moved on" — but it delayed the decision by a week.

**Which ecosystem scope does this map to?**
Compass

---

## Quarterly review process

1. Collect all entries from the quarter
2. Group by ecosystem scope
3. Count entries per scope — this is your demand signal
4. For scopes with 3+ entries: run through the Capability Evaluation Framework
5. For scopes with <3 entries: keep logging, revisit next quarter
6. Share findings with the Convoke maintainer team

**The rule:** No capability gets built without friction log evidence. Vision is not demand.
