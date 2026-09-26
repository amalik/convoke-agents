'use strict';

/**
 * Every config reference inside a shipped agent's activation block carries the `{project-root}/`
 * prefix.
 *
 * WHY THIS EXISTS (T214, R2). An unprefixed reference resolves against whatever directory the agent is
 * activated from. `activation-validator.js` check 2 enforces the prefix for GENERATED agents at
 * `add-team` §5c, but it runs on generated output — nothing held the agents already in the tree to the
 * convention. Of the 9 with activation blocks, exactly ONE was exercised by a test, so breaking the
 * prefix in the other 8 passed the suite, and the T214 receipt claimed a "real-agent sweep" that did
 * not exist. This is that sweep.
 *
 * `committed-artifact-integrity` (`project-context.md`): the agent files ARE the subject, and a fixture
 * copy would test the copy. This file deliberately imports NO module under test — it asserts on the
 * artifacts alone, which is the exception's first condition. Expectations come from the agent registry
 * and the directory layout, not from the agent files. A new agent goes red until its references are
 * prefixed.
 *
 * WHAT THIS DOES NOT CATCH: whether the reference sits inside the LOAD instruction rather than merely
 * somewhere in the block (T138 — an agent can name its config in prose or boilerplate while loading it
 * by some other string), and the 3 v6.3 agents, which carry no activation block at all (T127).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');

const BME = path.join(PACKAGE_ROOT, '_bmad/bme');
const ACTIVATION = /<activation[^>]*>([\s\S]*?)<\/activation>/;

// Every agent file under `_bmad/bme/<module>/agents/`, in both shapes: `<id>.md` and `<id>/SKILL.md`.
function agentFiles() {
  const found = [];
  for (const mod of fs.readdirSync(BME)) {
    const dir = path.join(BME, mod, 'agents');
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const entry of fs.readdirSync(dir)) {
      const direct = path.join(dir, entry);
      if (entry.endsWith('.md') && fs.statSync(direct).isFile()) found.push({ mod, file: direct });
      else if (fs.existsSync(path.join(direct, 'SKILL.md'))) found.push({ mod, file: path.join(direct, 'SKILL.md') });
    }
  }
  return found.sort((a, b) => a.file.localeCompare(b.file));
}

const AGENTS = agentFiles();

describe('shipped agents — activation-block config references', () => {
  it('there are agent files to check, and some carry activation blocks', () => {
    assert.ok(AGENTS.length >= 12, `expected at least the 12 bme agents, found ${AGENTS.length}`);
    const withBlocks = AGENTS.filter(({ file }) => ACTIVATION.test(fs.readFileSync(file, 'utf8')));
    assert.ok(withBlocks.length >= 9,
      `expected at least 9 agents with an activation block, found ${withBlocks.length} — if a conversion removed one, `
      + 'say so here deliberately rather than letting the sweep quietly shrink');
  });

  for (const { mod, file } of AGENTS) {
    const rel = path.relative(PACKAGE_ROOT, file);
    it(`${rel}: every config reference in its activation block is {project-root}-prefixed`, (t) => {
      const match = fs.readFileSync(file, 'utf8').match(ACTIVATION);
      if (!match) { t.skip(`${rel} has no activation block (v6.3 — T127)`); return; }
      const block = match[1].replace(/\\/g, '/');
      const tail = `_bmad/bme/${mod}/config.yaml`;
      const bare = [...block.matchAll(new RegExp(`${tail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.\\-])`, 'gi'))]
        .filter((m) => !block.slice(0, m.index).endsWith('{project-root}/'))
        .map((m) => block.slice(0, m.index).split('\n').length);
      assert.deepEqual(bare, [],
        `${rel} names ${tail} without the "{project-root}/" prefix on activation-block line(s) ${bare.join(', ')}. `
        + 'That resolves against the directory the agent is activated from.');
    });
  }
});
