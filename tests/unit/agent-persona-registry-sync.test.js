'use strict';

/**
 * Every registered agent's persona in `agent-registry.js` must still match its agent file.
 *
 * WHY THIS EXISTS (T140). Converting an agent to v6.3 rewrites its persona in the agent file and
 * leaves the registry holding the older text. The gate that was supposed to catch this
 * (`tests/p0/p0-voice-consistency.test.js`) compared a hardcoded table of signature phrases and
 * asserted that at least one appeared in both texts — so two fully diverged personas passed as long
 * as each still contained `'really solving'`. It self-labelled `[Low-Confidence]`. Six agents were
 * drifted on `identity` when T140 was re-measured; the commit that added this file re-synced 25
 * fields across 10 of the 12 registered agents.
 *
 * WHERE THE GATES RUN, which is half the reason this file is here rather than in `tests/p0/`:
 * `npm test` covers `tests/unit tests/team-factory tests/lib tests/audit`, so the p0 suite runs only
 * inside CI's `coverage` job. This file runs in both.
 *
 * THE RELATION, ruled 2026-09-23: **the registry field equals the first block of the agent file's
 * corresponding field**, compared with whitespace collapsed. Not equality of the whole field: a v5
 * agent file's `<identity>` carries operational content after the opening paragraph (detection
 * targets, lists) that the registry deliberately summarises — `stack-detective` holds 369 registry
 * characters against a 973-character element. Not a bare prefix either: "the first three words"
 * would satisfy that. The first block has a mechanical boundary, and it is how every agent that was
 * consistent at ruling time already looked (Liam and Noah on all four fields; `stack-detective`,
 * `model-curator` and `readiness-analyst` on identity).
 *
 * WHICH FIELDS MUST BE COMPARED IS DERIVED FROM THE FILE'S FORMAT, not from what the file happens
 * to contain: v5 files must expose all four, v6.3 files the three they have (they carry no
 * `## Role` section). Otherwise renaming one heading drops that field out of the comparison and
 * leaves its registry value unconstrained, with nothing failing.
 *
 * WHAT THIS DOES NOT CATCH:
 *   - **`role` on the three converted agents.** No gate compares it — `tests/unit/agent-registry.
 *     test.js` only checks it is non-empty. The p0 role test deleted alongside this file did compare
 *     it, through a helper that maps a v6.3 agent's role onto its identity section, so this is a net
 *     reduction on that one field. Filed as **T209**.
 *   - **How deep the guard goes, which the agent file's author chooses.** Inserting a blank line
 *     after the first sentence shrinks what is compared, and nothing detects the shrink. Measured
 *     2026-09-23: 8 of 45 fields hold less than their whole file field — `expertise` at 63-67% for
 *     the three converted agents, `identity` at 30-38% for the five multi-block v5 agents. Filed as
 *     **T211**.
 *   - Both sides edited to the same wrong text.
 *
 * `committed-artifact-integrity` (`project-context.md`): the **registry** is the subject; the agent
 * files are the authority, and are asserted on only for existence and for exposing their format's
 * fields. That is what keeps condition 2 — expectations from a source the subject does not control —
 * true here. The exception's other conditions: only these artifacts are asserted on, the floor is
 * stated above, and a newly registered agent goes red until its file and registry entry agree.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');
const {
  extractPersonaFromAgentFile,
} = require('../../_bmad/bme/_team-factory/lib/writers/registry-writer');
const registry = require('../../scripts/update/lib/agent-registry');

const FIELDS = ['role', 'identity', 'communication_style', 'expertise'];

// One roster, from the registry itself: the Vortex seven, the Gyre four, and the standalone bme
// agents. A test scoped to one module is how six drifted agents stayed green — the p0 voice suite
// iterates Vortex only, and `review-coach` (Gyre) had diverged on all four fields.
// Derived, not listed: `add-team` writes a new team as its own `<PREFIX>_AGENTS` export
// (`registry-writer.js`, its `written:` array), so a hardcoded list of export names would leave
// every generated team unguarded — green forever, whatever its personas said.
const AGENTS = Object.entries(registry)
  .filter(([name, value]) => /(^|_)AGENTS$/.test(name) && Array.isArray(value))
  .flatMap(([, value]) => value)
  .filter((a) => a && a.id && a.persona)
  .sort((a, b) => a.id.localeCompare(b.id));

// The three shapes an agent file takes today. A registered agent whose file matches none of them
// fails rather than skips — that is the check, not an inconvenience.
function agentFile(id) {
  const candidates = [
    `_bmad/bme/_vortex/agents/${id}/SKILL.md`,
    `_bmad/bme/_gyre/agents/${id}.md`,
    `_bmad/bme/_team-factory/agents/${id}.md`,
  ].map((p) => path.join(PACKAGE_ROOT, p));
  return candidates.find((p) => fs.existsSync(p)) || null;
}

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const firstBlock = (s) => norm(String(s || '').split(/\n\s*\n/)[0]);

describe('agent registry personas match their agent files', () => {
  it('the registry exports agents to check', () => {
    assert.ok(AGENTS.length >= 12,
      `expected at least the 7 Vortex + 4 Gyre + 1 bme agents, got ${AGENTS.length}`);
  });

  for (const agent of AGENTS) {
    it(`${agent.id}: every persona field the file carries matches the registry`, async () => {
      const file = agentFile(agent.id);
      assert.ok(file, `${agent.id} is registered but has no agent file in any known location`);

      const filePersona = await extractPersonaFromAgentFile(file);
      // Which fields the file must expose is derived from its FORMAT, not from what it happens
      // to contain. Without this, renaming a heading (`## Principles` → `## Operating
      // Principles`) drops that field out of the comparison silently and leaves the registry
      // value unconstrained — no failure, no signal.
      const isV5 = /^<agent\s/m.test(fs.readFileSync(file, 'utf8'));
      const required = isV5 ? FIELDS : FIELDS.filter((f) => f !== 'role');
      const compared = [];
      for (const field of FIELDS) {
        const expected = firstBlock(filePersona[field]);
        if (!expected) continue;
        compared.push(field);
        assert.equal(norm(agent.persona[field]), expected,
          `${agent.id}: registry persona.${field} has drifted from ${path.relative(PACKAGE_ROOT, file)}. `
          + 'The agent file is authoritative: copy its first block into the registry, do not edit the file to match.');
      }
      const missing = required.filter((f) => !compared.includes(f));
      assert.deepEqual(missing, [],
        `${agent.id}: ${path.relative(PACKAGE_ROOT, file)} no longer exposes ${missing.join(', ')} — `
        + `a ${isV5 ? 'v5' : 'v6.3'} agent file must expose ${required.join(', ')}, or the registry value goes unchecked. `
        + 'Restore the element or heading rather than letting the field drop out of the comparison.');
    });
  }
});
