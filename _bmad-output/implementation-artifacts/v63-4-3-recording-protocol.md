---
initiative: convoke
artifact_type: protocol
qualifier: v63-4-3-recording-protocol
created: '2026-04-28'
updated: '2026-05-29'
schema_version: 1
parent_story: v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate
recording_method: D2-A (scripted) — fallback D2-B (manual) documented inline
scope_revision: path-b-plus-2026-05-29
---

# Story 4.3 — PF1 Recording Protocol (operator-execution playbook)

**🔄 2026-05-29 Path B+ re-scope (Decision 4 addendum):** Original spec listed 5 agents (1 Vortex + 4 BMAD). Re-scoped to **4 agents (3 Vortex + 1 Gyre)** to densify Convoke-conversion signal. BMAD-agent control validation moved to mechanical `scripts/audit/install-scope-check.js` (~$0 cost vs ~$1 LLM + 2 hr operator time). Agent table §1 below reflects new scope. Other protocol details (Prompts 2-4 contracts, parser invariants, D2-A/D2-B paths) unchanged.

**Goal:** capture **4 agents × 4 prompts × 2 phases (baseline + post-migration) = 32 recordings** in a parser-validatable format that Story 4.2's battery harness can consume.

**Time-box:** ~25 min D2-A (scripted) / 3-6hr D2-B (manual) per Decision 5 [scaled down proportionally from original 5-agent estimate].

**Parser contract (load-bearing):** every recording file MUST use **digit-only headers** `## Prompt 1`, `## Prompt 2`, `## Prompt 3`, `## Prompt 4` — NO description trailers. Story 4.2's parser regex `/^## Prompt (\d+)\s*$/gm` REJECTS `## Prompt 1: Activation greeting`. Description-aware text belongs in body content or comments, NOT headers.

---

## 0. Pre-flight (operator)

Before starting either D2-A or D2-B path:

- [ ] `git status --porcelain` clean (or known-state) — recordings will be captured against the live `_bmad/` install.
- [ ] `package.json` version is `4.0.0-rc.1` or 4.0 candidate (post-Story-4.2b ship).
- [ ] `git rev-parse v3.3.0` returns sha (~`90bf3115...`) — needed for Decision 3 sandbox setup.
- [ ] Decide Decision 3 sandbox approach: **`git worktree`** (preferred per OS-1) or **`git stash`+checkout** (fallback).
- [ ] `mkdir -p _bmad-output/pf1-baselines _bmad-output/pf1-post-migration`.

---

## 1. The 4 PF1 agents (canonical skill IDs) — Path B+ scope 2026-05-29

| # | Agent | Display Name | Module | Type | Skill ID (canonical) | Recording filename (baseline) | Recording filename (post-migration) |
|---|-------|--------------|--------|------|----------------------|------------------------------|-----|
| 1 | Emma | Contextualization Expert | Vortex | Signal (POC ref) | `bmad-agent-bme-contextualization-expert` | `_bmad-output/pf1-baselines/bmad-agent-bme-contextualization-expert-baseline.md` | `_bmad-output/pf1-post-migration/bmad-agent-bme-contextualization-expert-post.md` |
| 2 | Wade | Lean Experiments Specialist | Vortex | Signal (R2-converged conversion — Story 2.2) | `bmad-agent-bme-lean-experiments-specialist` | `_bmad-output/pf1-baselines/bmad-agent-bme-lean-experiments-specialist-baseline.md` | `_bmad-output/pf1-post-migration/bmad-agent-bme-lean-experiments-specialist-post.md` |
| 3 | Liam | Hypothesis Engineer | Vortex | Signal (HC-schema-heaviest conversion — Story 2.7) | `bmad-agent-bme-hypothesis-engineer` | `_bmad-output/pf1-baselines/bmad-agent-bme-hypothesis-engineer-baseline.md` | `_bmad-output/pf1-post-migration/bmad-agent-bme-hypothesis-engineer-post.md` |
| 4 | Stack Detective | Stack Detective | Gyre | Control (cross-Convoke-module) | `bmad-agent-bme-stack-detective` | `_bmad-output/pf1-baselines/bmad-agent-bme-stack-detective-baseline.md` | `_bmad-output/pf1-post-migration/bmad-agent-bme-stack-detective-post.md` |

**Original-spec-deprecated agents (no longer in PF1 scope per Decision 4 addendum):**

| ~~Agent~~ | ~~Skill ID~~ | Why dropped | Replacement |
|-----------|--------------|-------------|-------------|
| ~~John (PM)~~ | ~~`bmad-agent-pm`~~ | BMAD-upstream-owned; control validation now mechanical | `install-scope-check.js` |
| ~~Winston (Architect)~~ | ~~`bmad-agent-architect`~~ | BMAD-upstream-owned; control validation now mechanical | `install-scope-check.js` |
| ~~Carson (Brainstorming Coach)~~ | ~~`bmad-cis-agent-brainstorming-coach`~~ | CIS-upstream-owned; control validation now mechanical | `install-scope-check.js` |
| ~~Murat (Test Architect)~~ | ~~`bmad-tea`~~ | TEA-upstream-owned; control validation now mechanical | `install-scope-check.js` |

**Path B+ rationale:** Original spec's 5-agent design (1 Vortex Emma + 4 BMAD John/Winston/Carson/Murat) put 80% of test cost into control validation. Re-scope replaces the 4-BMAD-agent control with mechanical `scripts/audit/install-scope-check.js` (snapshot-based assertion that migration code's write ops stay within Convoke scope: `_bmad/bme/` + version metadata + Convoke output paths). Test signal density rises from 20% → 75%; total LLM call count drops 40 → 32.

**CM-3 reminder (now N/A since Carson dropped, retained for historical clarity):** Carson's canonical skill ID was `bmad-cis-agent-brainstorming-coach` (NOT `bmad-brainstorming`, which is the brainstorming-method skill). Pre-existing Convoke users with Carson installed via CIS module will still have her, but PF1 no longer tests her under Path B+ scope.

---

## 2. The 4 prompts (per agent — same for both phases)

**Prompt 1 — Activation greeting + menu**

Type the bare slash command:
```
/<skill-id>
```
Example for Emma: `/bmad-agent-bme-contextualization-expert`

**Capture criteria:** the FIRST persona-authored natural-language turn (per Story 4.1 AC3). STOP at the first user-input boundary (i.e., when the agent waits for your input). Do NOT type a follow-up.

**Prompt 2 — First capability invocation** (Path B+ scope 2026-05-29)

Type the FIRST numbered/coded capability from the agent's menu (rendered in Prompt 1's response).

| Agent | Expected Prompt 2 input |
|-------|------------------------|
| Emma | First capability code from her menu (operator discovers at activation time — likely `CC` or first listed code per Vortex Contextualize stream conventions) |
| Wade | First capability code from his menu (likely `EX` or first listed; Vortex Externalize stream — Lean experiments specialist) |
| Liam | First capability code from his menu (likely `HE` or first listed; Vortex Hypothesize stream — HC schema-heaviest agent) |
| Stack Detective | First capability code from her menu (Gyre Readiness stream — operator discovers at activation time) |

**Capture criteria:** the agent's response to the capability invocation (typically: skill activation + first instruction or first elicitation question). STOP at the next user-input boundary.

**Prompt 3 — Open-ended follow-up question**

Type a contextual clarifying question on the agent's Prompt 2 response. **Use the same template question per agent across baseline and post-migration phases** (consistency is critical for valid pre/post comparison per arch:355).

Suggested template (operator may adjust per agent's Prompt 2 response):
```
Can you walk me through the next step in more detail?
```

**Capture criteria:** the agent's elaboration / continuation. STOP at next boundary.

**Prompt 4 — Multi-step workflow entry** (Path B+ scope 2026-05-29)

Invoke the agent's deepest workflow capability accessible without supplying real domain data. Use the same invocation per agent across both phases.

| Agent | Suggested Prompt 4 input |
|-------|--------------------------|
| Emma | Workflow that doesn't need real customer data (capability that returns a template/guide rather than processing input) |
| Wade | Hypothesis-falsification workflow or experiment-card capability (works against existing repo state / hypothesis fixtures) |
| Liam | HC-schema-validator workflow or hypothesis-charter capability (deepest HC-schema interaction without supplying real PRD) |
| Stack Detective | Stack-analysis or dependency-trace capability that returns a template/structure rather than analyzing real code |

**Capture criteria:** the agent's first workflow-step response (typically: "Step 1 of N: ..." or first elicitation in the workflow's sequence). STOP at next boundary.

**CRITICAL invariant (per arch:355):** Same prompts asked to each agent across baseline AND post-migration. Wording must match exactly for valid pre/post comparison.

---

## 3. Recording file format (per file, both phases identical structure)

Every recording file MUST follow this exact structure:

```markdown
<!-- Source: <skill-id> {baseline|post-migration} captured <YYYY-MM-DD HH:MM> from convoke {3.x|4.0} (commit <sha>) -->

## Prompt 1

<paste agent's response to Prompt 1 here, verbatim, with original markdown formatting preserved>

## Prompt 2

<paste agent's response to Prompt 2 here>

## Prompt 3

<paste agent's response to Prompt 3 here>

## Prompt 4

<paste agent's response to Prompt 4 here>
```

**Header constraints (CM-6 + parser invariant):**
- Headers MUST be EXACTLY `## Prompt 1`, `## Prompt 2`, `## Prompt 3`, `## Prompt 4` (digit only, no trailing colon, no description, no whitespace before EOL).
- Sections must appear in numerical order (Prompt 1 first).
- Each section must have non-empty body content.
- Provenance comment is REQUIRED on line 1.

**Provenance comment template (replace placeholders):**

Baseline phase:
```
<!-- Source: <skill-id> baseline captured 2026-04-28 14:30 from convoke 3.x (commit 90bf3115) -->
```

Post-migration phase:
```
<!-- Source: <skill-id> post-migration captured 2026-04-28 15:15 from convoke 4.0.0-rc.1 (commit <sha-of-post-migration-checkout>) -->
```

---

## 4. Pre-validation (operator MUST run per file before declaring it complete)

After saving each recording file, validate it parses correctly using Story 4.2's parser:

```bash
node -e "
const b = require('./scripts/audit/pf1-validation-battery');
const fs = require('fs');
const text = fs.readFileSync('_bmad-output/pf1-baselines/<skill-id>-baseline.md', 'utf8');
const parsed = b.parseRecording(text);
console.log('keys:', Object.keys(parsed));
console.log('all 4 sections present:', ['Prompt 1','Prompt 2','Prompt 3','Prompt 4'].every(k => parsed[k] && parsed[k].length > 0));
"
```

**Expected output:**
```
keys: [ 'Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4' ]
all 4 sections present: true
```

**If output differs:** fix the file before proceeding. Common errors:
- Missing prompt section → add it.
- Header has trailing description (e.g., `## Prompt 1: Activation greeting`) → strip the description.
- Empty section body → re-capture the prompt response.
- Wrong order (e.g., Prompt 2 before Prompt 1) → reorder.

---

## 5. D2-A path: scripted recording (recommended; ~30 min)

**Per FM4-2 spike (`v63-4-3-fm4-2-spike-result.md`): the working invocation form is**

```bash
claude -p --max-turns N "/<skill-id>"
```

**NOT** `echo "/<skill>" | claude -p "..."` — that stdin-pipe form fails with `Error: Reached max turns (N)`.

### 5.1 Recommended automation: `scripts/audit/pf1-record-agent.js` (NEW file per Decision 2 D2-A)

Sketch (Task 1.5 of D2-A path; operator authors as sub-deliverable when picking up baseline recording):

```js
#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const phase = process.argv[2]; // 'baseline' or 'post-migration'
if (!['baseline','post-migration'].includes(phase)) {
  console.error('Usage: node pf1-record-agent.js --phase baseline|post-migration');
  process.exit(2);
}

const PHASE_SUFFIX = phase === 'baseline' ? 'baseline' : 'post';
const PHASE_DIR = phase === 'baseline' ? 'pf1-baselines' : 'pf1-post-migration';
const COMMIT_SHA = execSync('git rev-parse HEAD').toString().trim().slice(0, 8);

const SKILLS = [
  'bmad-agent-bme-contextualization-expert',
  'bmad-agent-pm',
  'bmad-agent-architect',
  'bmad-cis-agent-brainstorming-coach',
  'bmad-tea',
];

const PROMPTS_PER_AGENT = {
  // Prompt 1 is always /<skill>; Prompts 2-4 are agent-specific (operator fills in)
  // For now, just capture Prompt 1 (activation greeting) — Prompts 2-4 require iteration
  // and may need a stateful CLI session beyond `claude -p` simple-prompt mode.
  'bmad-agent-architect': ['/bmad-agent-architect', 'CA', 'Walk me through the next step', 'IR'],
  // ... other agents
};

for (const skillId of SKILLS) {
  const prompts = PROMPTS_PER_AGENT[skillId] || [`/${skillId}`];
  const fileName = `_bmad-output/${PHASE_DIR}/${skillId}-${PHASE_SUFFIX}.md`;
  const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const provenance = `<!-- Source: ${skillId} ${phase} captured ${ts} from convoke ${phase==='baseline'?'3.x':'4.0.0-rc.1'} (commit ${COMMIT_SHA}) -->`;

  let body = provenance + '\n\n';
  for (let i = 0; i < prompts.length; i++) {
    const promptText = prompts[i].startsWith('/') ? prompts[i] : prompts[i];
    console.log(`Recording ${skillId} Prompt ${i+1} ...`);
    const stdout = execSync(`claude -p --max-turns 10 "${promptText.replace(/"/g, '\\"')}"`).toString();
    body += `## Prompt ${i+1}\n\n${stdout}\n\n`;
  }
  fs.writeFileSync(fileName, body);
  console.log(`Wrote ${fileName}`);
}
```

**⚠️ KNOWN LIMITATION:** `claude -p` is single-shot per invocation (no stateful session). This means Prompts 2-4 (which depend on the agent being in an activated state from Prompt 1) **may NOT capture cleanly** in scripted form, because each `claude -p` call starts a fresh context. The spike only verified Prompt 1 (activation greeting). For Prompts 2-4, operator may need to:

- (a) **Inline-state the activation in the prompt argument**: `claude -p --max-turns 15 "/<skill> ; activate the skill ; then run <capability-code> ; capture response"` — chained instruction in one prompt, hoping the model self-activates and then responds.
- (b) **Fall back to D2-B (manual)** for Prompts 2-4 only: capture Prompt 1 scripted, then manually walk Prompts 2-4 in an interactive session.
- (c) **Use stream-json mode + multi-turn**: `claude -p --output-format stream-json --max-turns 20 "..."` and parse the streamed output to extract the persona-authored turn at the right position.

**Recommended:** start with (a). If Prompts 2-4 capture inconsistently, fall back to (b) for those prompts only.

### 5.2 Per-recording smoke test

After each agent's file is written, run the pre-validation command from §4. If parser rejects, fix headers/sections.

### 5.3 D2-A wall-clock estimate

- 5 agents × 4 prompts × ~15s/invocation × 2 phases = ~600s = **~10 min** for invocations.
- Pre-validation per file: ~30s × 10 files = 5 min.
- Total D2-A: **~15-30 min** (well within Decision 5's 3hr cap).

---

## 6. D2-B path: manual recording (fallback if D2-A Prompts 2-4 capture is unreliable; ~4-8hr)

**When to use:** if §5.1 limitation bites (Prompts 2-4 don't capture cleanly via single-shot `claude -p`), fall back here.

### 6.1 Per-agent manual workflow

For each of the 5 agents:

1. Open a fresh Claude Code interactive session (e.g., `claude` with no `-p` flag, in a fresh terminal/window).
2. Type Prompt 1: `/<skill-id>` (e.g., `/bmad-cis-agent-brainstorming-coach`).
3. Wait for agent's activation greeting + menu. Copy the FULL response (without your own input or tool traces).
4. Open the recording file (`_bmad-output/pf1-baselines/<skill-id>-baseline.md` or post-migration equivalent).
5. Paste the response under `## Prompt 1`.
6. Back in the session, type Prompt 2 input (per §2 table).
7. Wait for response. Copy it. Paste under `## Prompt 2` in the recording file.
8. Repeat for Prompts 3 and 4.
9. Add the provenance comment at line 1.
10. Run §4 pre-validation. Fix if needed.
11. End the session (`/exit` or Ctrl+D).
12. Move to the next agent.

### 6.2 Per-phase wall-clock estimate

- 5 agents × ~30 min/agent (4 prompts + paste + validate) = **~2.5 hours per phase**.
- 2 phases (baseline + post-migration) = **~5 hours**.
- With interruptions/iteration: **realistic 6-8 hours total**.

### 6.3 Quality gates per file (D2-B)

- All 4 prompts captured.
- No tool traces / metadata leaked into response body (only persona-authored prose + capability tables).
- §4 pre-validation passes.
- Same prompts asked across baseline + post-migration phases.

---

## 7. Header format examples (correct vs incorrect)

### ✅ CORRECT

```markdown
<!-- Source: bmad-agent-architect baseline captured 2026-04-28 14:30 from convoke 3.x (commit 90bf3115) -->

## Prompt 1

Good afternoon. I'm Winston, your System Architect.

I've loaded the project context...

## Prompt 2

I'd be glad to walk you through architecture documentation...
```

### ❌ INCORRECT — REJECTED BY PARSER

```markdown
## Prompt 1: Activation greeting + menu       ← description after digit fails regex
## prompt 2                                    ← lowercase fails regex
## Prompt 2 - First capability                 ← description fails regex
##Prompt 1                                     ← missing space fails regex
## Prompt 1                                    ← trailing whitespace MAY fail (regex uses \s*$ but ## Prompt 1<TAB> would fail)
```

---

## 8. After all 10 baseline files captured (HALT for operator → continue Story 4.3 Tasks 4+)

When all 5 baseline files are written + pre-validated:

- [ ] Confirm `ls _bmad-output/pf1-baselines/ | wc -l` returns 5.
- [ ] Confirm each file passes §4 pre-validation.
- [ ] Record `baseline_commit: <sha>` in your notes for Story 4.3 release record (Decision 4).
- [ ] Notify dev-agent via "baselines captured; resume Story 4.3 Task 4."

Same after all 5 post-migration files:

- [ ] Confirm `ls _bmad-output/pf1-post-migration/ | wc -l` returns 5.
- [ ] Pre-validate all 5.
- [ ] Record `post_migration_commit: <sha>` in your notes.
- [ ] Notify dev-agent: "post-migration captured; resume Story 4.3 Task 6."

---

## References

- Story 4.3 — `_bmad-output/implementation-artifacts/v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md` (Decisions 1+2+3, Task 2.1+2.2)
- FM4-2 spike result — `_bmad-output/implementation-artifacts/v63-4-3-fm4-2-spike-result.md`
- Story 4.2 battery harness — `scripts/audit/pf1-validation-battery.js` (specifically `parseRecording` export)
- Architecture FR39 / NFR3 — `_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md`
- Agent manifest — `_bmad/_config/agent-manifest.csv`
