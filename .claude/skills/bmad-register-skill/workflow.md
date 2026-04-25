# Register custom BMM-dependent skill

**Goal:** Register a custom skill in the BMM dependency registry so future `convoke-update` and `convoke-doctor` runs treat it as known governance state instead of surfacing it as an `unregistered-custom-skill` warning.

**Your role:** Conversational front-end for [`scripts/convoke-register-skill.js`](../../../scripts/convoke-register-skill.js). The skill wraps the CLI; the CLI owns all mutation logic (validation, atomic write, duplicate detection, post-write verification). Do NOT write to `_bmad/_config/bmm-dependencies.csv` from this workflow — keep mutation in the tested CLI path.

**Audience:** operators who have a custom skill under `.claude/skills/<name>/` that extends a BMM agent, typically triggered by a `convoke-doctor` warning.

---

## Phase 1 — Discovery

Run `convoke-doctor` to see whether any unregistered custom skills already exist:

```bash
node scripts/convoke-doctor.js
```

**Non-zero exit handling:** if `convoke-doctor` exits non-zero due to **hard failures UNRELATED to BMM drift** (e.g., missing module, broken config, corrupt installation), STOP and surface the failure to the operator — do NOT proceed with registration until the environment is healthy. Governance **soft-warnings** (exit 0 with ⚠ findings in the BMM dependencies check) are expected and continue normally; those are exactly what we're here to address.

Parse the output for any `⚠ BMM dependencies: [unregistered] <skill> → <agent>` lines (Story 2.2 finding category 2). Then:

- **If one or more unregistered custom skills surface:** list them to the operator and offer to register each one. Proceed through Phase 2 for each skill the operator wants to register.
- **If none surface** (clean `BMM registry consistent` output): ask the operator which skill they want to register manually. Typical reason: they just installed a new custom skill and want to pre-register it before it surfaces as a warning.

---

## Phase 2 — Collect fields

Prompt the operator for the fields the CLI requires. Ask them one-by-one (or in a short block) and explain each. Expected fields (matching `scripts/convoke-register-skill.js --help`):

| Field | Example | Notes |
|-------|---------|-------|
| `--skill` | `my-custom-skill` | Directory name under `.claude/skills/<name>/`. CLI validates this exists. |
| `--agent` | `bmad-agent-pm` | The BMM agent the skill depends on. CLI warns (doesn't reject) if the prefix is unrecognized. |
| `--type` | `frontmatter` | One of: `frontmatter`, `code-reference`, `capability_extension`. CLI rejects other values. |
| `--source` | `unknown` | Source module label. Default `unknown` for user custom skills — just accept the default unless the operator has a specific reason. |
| `--email` | `alice@example.com` | Operator identifier. Default `operator` if omitted. **MUST NOT be `auto-scan`** — that literal is reserved for the scanner; the CLI rejects it upfront to save a round-trip. If the operator tries to type `auto-scan`, ask for a different value (email, username, or accept `operator`). |

**Defaults to offer:**
- `source`: `unknown` (appropriate for any user-added custom skill).
- `email`: the operator's real email if they've shared it in the conversation; otherwise `operator`.

Reply with the collected values formatted as a JSON object so they're easy to re-use if the operator wants to iterate:

```json
{
  "skill": "<name>",
  "agent": "<bmad-agent-*>",
  "type": "<frontmatter|code-reference|capability_extension>",
  "source": "<module-or-unknown>",
  "email": "<identifier>"
}
```

Confirm with the operator before invoking the CLI in Phase 3.

---

## Phase 3 — Invoke the CLI

Shell out to `scripts/convoke-register-skill.js` with the collected flags. Use `--yes` to skip the post-write verification round-trip (the CLI still runs the write atomically; `--yes` only suppresses the verification step for faster CI-style feedback).

```bash
node scripts/convoke-register-skill.js \
  --skill <name> \
  --agent <agent> \
  --type <type> \
  --source <source> \
  --email <email> \
  --yes
```

The CLI will:
1. Validate all fields (skill dir exists, agent prefix known, type in enum, not reserved `auto-scan`).
2. Check for duplicate triples in the existing CSV.
3. Atomically append the row (preserves existing rows byte-identical — no re-sort).
4. Emit a machine-parseable line: `REGISTERED: <skill>||<agent>||<type>`.

---

## Phase 4 — Present result + offer next registration

Parse the CLI output:

- **Exit 0** + `REGISTERED:` line present → registration succeeded. Confirm to the operator with the three parts of the triple. If additional `unregistered-custom-skill` findings remained from Phase 1, offer to loop back and register the next one.
- **Exit 1** with stderr / stdout error → surface the error **verbatim** to the operator. Do NOT retry silently — they need to see the specific failure. Common causes:
  - `Unknown skill: <name>` — typo; ask them to confirm the directory under `.claude/skills/`.
  - `Duplicate triple` — the (skill, agent, type) already exists; offer to use a different `type` (e.g., `code-reference` instead of `frontmatter`) or point them at hand-editing the CSV.
  - `Invalid --type` — they picked something outside the 3-value enum; prompt again.
  - `'auto-scan' is reserved` — ask for a different `--email` value (per Phase 2 guidance).
- **Exit 130** — operator cancelled via Ctrl+C; no CSV mutation happened. Acknowledge the cancel; offer to restart when they're ready.

If more unregistered skills remain after a successful registration, ask whether to register the next one. When the operator is done, suggest a final sanity check:

```bash
node scripts/convoke-doctor.js
```

The BMM dependencies check should now show `✓ BMM dependencies: registry consistent` for the newly-registered skill(s) — closing the governance loop.

---

## Anti-patterns

- **DO NOT** write to `_bmad/_config/bmm-dependencies.csv` from this workflow. The CLI owns atomic write + duplicate detection + RFC 4180 quoting; duplicating that logic here would drift from the tested path.
- **DO NOT** invoke `scripts/audit/audit-bmm-dependencies.js` as part of this flow. That tool is for scanner maintenance, not registration. Running it before or after a manual registration introduces a window where `mergePreservingManual` could interact with the operator's in-progress edit.
- **DO NOT** accept `--email auto-scan` — catch that value in Phase 2 and ask for a different identifier to save a CLI round-trip.
