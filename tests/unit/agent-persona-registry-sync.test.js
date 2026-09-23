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
 * THE RELATION, ruled 2026-09-23: **the registry field equals the leading block of the agent file's
 * corresponding field**, compared with whitespace collapsed. A leading LIST is one block however its
 * items are spaced — splitting on blank lines alone registered one principle of N. The rule lives in
 * `registry-writer.js::firstBlock`, which is also what writes generated teams' personas; this file
 * imports it rather than restating it, because two copies of one rule drift apart silently. Not equality of the whole field: a v5
 * agent file's `<identity>` carries operational content after the opening paragraph (detection
 * targets, lists) that the registry deliberately summarises — `stack-detective` holds 369 registry
 * characters against a 973-character element. Not a bare prefix either: "the first three words"
 * would satisfy that. The first block has a mechanical boundary, and it is how every agent that was
 * consistent at ruling time already looked (Liam and Noah on all four fields; `stack-detective`,
 * `model-curator` and `readiness-analyst` on identity).
 *
 * THE AGENT FILE IS FOUND BY SEARCHING `_bmad/bme/`, not by a list of known directories: `add-team`
 * writes each new team's agents under its own submodule, so a hardcoded list made every generated
 * team fail on the path rather than on its persona. Exactly one file must match an id — two agents
 * sharing an id across modules would otherwise both be validated against whichever file was listed
 * first, and neither against its own.
 *
 * WHICH FIELDS MUST BE COMPARED IS DERIVED FROM THE FILE'S FORMAT, not from what the file happens
 * to contain: v5 files must expose all four, v6.3 files the three they have (they carry no
 * `## Role` section). Otherwise renaming one heading drops that field out of the comparison and
 * leaves its registry value unconstrained, with nothing failing.
 *
 * WHAT THIS DOES NOT CATCH:
 *   - **`role` on Mila.** v6.3 files carry no `## Role` section, so this gate cannot compare it for
 *     any converted agent — but `tests/p0/p0-emma.test.js` and `p0-wade.test.js` pin Emma's and
 *     Wade's registry role against their agent files, and p0 runs in CI's `coverage` job, which is in
 *     `publish.needs`. Mila has no such test, so hers is guarded only by a non-emptiness check in
 *     `tests/unit/agent-registry.test.js`. Filed as **T209**.
 *   - **How deep the guard goes, which the agent file's author chooses.** Inserting a blank line
 *     after the first sentence shrinks what is compared, and nothing detects the shrink. Measured
 *     2026-09-23: 8 of 45 fields hold less than their whole file field — `expertise` at 63-67% for
 *     the three converted agents, `identity` at 30-38% for the five multi-block v5 agents. Filed as
 *     **T211**.
 *   - Both sides edited to the same wrong text.
 *   - A field's later blocks, by construction — that content is what the registry is allowed not to
 *     hold.
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
  firstBlock,
} = require('../../_bmad/bme/_team-factory/lib/writers/registry-writer');
const registry = require('../../scripts/update/lib/agent-registry');

const FIELDS = ['role', 'identity', 'communication_style', 'expertise'];
const BME = path.join(PACKAGE_ROOT, '_bmad/bme');

// Derived, not listed: `add-team` writes a new team as its own `<PREFIX>_AGENTS` export
// (`registry-writer.js`, its `written:` array), so a hardcoded list of export names would leave
// every generated team unguarded — green forever, whatever its personas said.
const AGENTS = Object.entries(registry)
  .filter(([name, value]) => /(^|_)AGENTS$/.test(name) && Array.isArray(value))
  .flatMap(([, value]) => value)
  .filter((a) => a && a.id)
  .sort((a, b) => a.id.localeCompare(b.id));

// An entry may carry its persona nested under `persona` or flat on the entry itself: the registry's
// own doc block for `EXTRA_BME_AGENTS` describes the flat shape while its entry uses the nested one.
// Skipping the shape we did not expect is how an agent goes unchecked, so both are read and an entry
// with neither fails.
function personaOf(agent) {
  if (agent.persona && typeof agent.persona === 'object') return agent.persona;
  if (FIELDS.some((f) => typeof agent[f] === 'string')) return agent;
  return null;
}

// Every `_bmad/bme/<module>/agents/<id>.md` and `.../agents/<id>/SKILL.md`, found by walking rather
// than by a list of the three shapes that existed when this was written.
function agentFiles(id) {
  const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
  const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
  const found = [];
  // `statSync`, not the dirent: a symlinked module directory is not `isDirectory()` and would be
  // skipped whole, hiding every agent inside it. Candidates must be real files — a directory named
  // `<id>.md` would otherwise be read and throw EISDIR instead of reporting its shape.
  for (const mod of fs.readdirSync(BME)) {
    const dir = path.join(BME, mod, 'agents');
    if (!isDir(path.join(BME, mod)) || !isDir(dir)) continue;
    for (const p of [path.join(dir, `${id}.md`), path.join(dir, id, 'SKILL.md')]) {
      if (isFile(p)) found.push(p);
    }
  }
  return found;
}

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

describe('agent registry personas match their agent files', () => {
  it('every id the registry declares is on the roster this file checks', () => {
    // Derived like the roster above, for the same reason: a generated team exports its own
    // `<PREFIX>_AGENT_IDS`, and naming the three that existed when this was written would leave
    // this guard covering exactly the case the roster derivation exists to cover.
    const declared = [...new Set(Object.entries(registry)
      .filter(([name, value]) => /(^|_)AGENT_IDS$/.test(name) && Array.isArray(value))
      .flatMap(([, value]) => value)
      .filter((id) => typeof id === 'string'))].sort();
    assert.ok(declared.length > 0, 'the registry declared no agent ids at all');
    const onRoster = AGENTS.map((a) => a.id);
    assert.deepEqual(declared.filter((id) => !onRoster.includes(id)), [],
      'an id the registry declares is not reachable through any `*_AGENTS` export — it would go unchecked');
  });

  it('no two registered agents share an id', () => {
    const ids = AGENTS.map((a) => a.id);
    const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    assert.deepEqual(dupes, [],
      `two registered agents share an id (${dupes.join(', ')}) — both would be validated against one file, neither against its own`);
  });

  for (const agent of AGENTS) {
    it(`${agent.id}: every persona field the file carries matches the registry`, async () => {
      const persona = personaOf(agent);
      assert.ok(persona,
        `${agent.id} is registered with no persona in either shape (nested \`persona: {…}\` or flat fields)`);

      const files = agentFiles(agent.id);
      assert.equal(files.length, 1,
        files.length === 0
          ? `${agent.id} is registered but no _bmad/bme/*/agents/${agent.id}.md or .../${agent.id}/SKILL.md exists`
          : `${agent.id} resolves to ${files.length} agent files (${files.map((f) => path.relative(PACKAGE_ROOT, f)).join(', ')}) — which one is authoritative is undefined`);
      const file = files[0];
      const raw = fs.readFileSync(file, 'utf8');
      const rel = path.relative(PACKAGE_ROOT, file);

      // A half-converted file — v6.3 sections added, the v5 XML left behind — is the drift this gate
      // exists for, wearing a disguise: `extractPersonaFromAgentFile` prefers the XML, so the registry
      // stays "in sync" with the persona the agent no longer uses.
      //
      // Both halves are judged on the file MINUS its HTML comments, and the XML half requires a
      // CLOSING tag — exactly what the extractor requires. Otherwise a sentence mentioning
      // `<identity>` in prose, or a commented-out heading in a template note, failed a healthy file
      // with a message whose stated reason ("pinned to the older text") was provably false: with no
      // closing tag the extractor reads the markdown anyway. Both demonstrated by R3, 2026-09-23.
      const body = raw.replace(/<!--[\s\S]*?-->/g, '');
      const hasXmlPersona = /<(identity|communication_style|principles)>[\s\S]*?<\/\1>/.test(body);
      const hasMarkdownPersona = /^##\s+(Identity|Communication Style|Principles)\s*$/m.test(body);
      assert.ok(!(hasXmlPersona && hasMarkdownPersona),
        `${rel} carries BOTH a closed v5 XML persona and v6.3 markdown sections. `
        + '`extractPersonaFromAgentFile` reads the XML, so this file\'s registry entry is pinned to the older text. '
        + 'Finish the conversion by deleting the XML persona.');

      const filePersona = await extractPersonaFromAgentFile(file);
      // Which fields the file must expose is derived from its FORMAT, not from what it happens to
      // contain. Without this, renaming a heading (`## Principles` → `## Operating Principles`) drops
      // that field out of the comparison silently and leaves the registry value unconstrained.
      const isV5 = /^\s*<agent[\s>]/m.test(body);
      const required = isV5 ? FIELDS : FIELDS.filter((f) => f !== 'role');
      const compared = [];
      for (const field of FIELDS) {
        const expected = firstBlock(filePersona[field]);
        if (!expected) continue;
        compared.push(field);
        assert.equal(norm(persona[field]), expected,
          `${agent.id}: registry persona.${field} has drifted from ${rel}. `
          + 'The agent file is authoritative: copy its leading block into the registry, do not edit the file to match.');
      }

      const missing = required.filter((f) => !compared.includes(f));
      assert.deepEqual(missing, [],
        `${agent.id}: ${rel} no longer exposes ${missing.join(', ')} — `
        + `a ${isV5 ? 'v5' : 'v6.3'} agent file must expose ${required.join(', ')}, or the registry value goes unchecked. `
        + 'Restore the element or heading rather than letting the field drop out of the comparison.');
    });
  }
});
