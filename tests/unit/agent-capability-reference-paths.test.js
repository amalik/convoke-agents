'use strict';

/**
 * Every cross-directory path inside a v6.3 agent's capability reference file carries the
 * `{project-root}/` prefix, and resolves to a file that exists.
 *
 * WHY THIS EXISTS (cir-1-1). A bare path resolves from skill root, so a capability that says
 * "invoke the workflow at `_bmad/bme/_vortex/workflows/mvp/workflow.md`" points inside the agent's
 * own directory, where no `workflows/` tree exists. It only appears to work when the agent is
 * activated from the project root. Measured at 6e306647: 22 such paths across 12 files, every one on
 * line 21, every line the same "invoke the workflow at … follow its step-file sequence under …"
 * sentence.
 *
 * WHY A SIBLING AND NOT AN EXTENSION of `agent-activation-config-refs.test.js`, whose header names
 * this very gap. That file is a T214 deliverable and its regex has already been patched twice (R2
 * added `(?![\w.\-])`, R3 replaced it with `(?![\w\-])(?!\.[A-Za-z0-9])`). `code-review-convergence`'s
 * "two failed attempts predict a third" applies to it, and T138 says restructure rather than patch a
 * third time. The subject differs on every axis anyway: reference files not agent files, any
 * `_bmad/…` path not the single literal config path, and no activation block is involved.
 *
 * `committed-artifact-integrity` (`project-context.md`): the reference files ARE the subject, so a
 * fixture copy would test the copy. This file imports NO module under test. Expectations come from
 * each agent's `SKILL.md` — which names its own `./references/<cap>.md` files — never from the
 * reference file being judged, so a corrupted reference cannot choose the standard it is judged
 * against. A newly converted agent goes red until its references are prefixed; that is the point.
 *
 * WHY THE PREFIX IS DETECTED BY POSITION, NOT BY A CHARACTER CLASS. The obvious pattern is "the
 * character before `_bmad` is not `/`", and it is blind to at least nine forms — `{project-ROOT}/`,
 * `{project_root}/`, `{project-root}//`, `./_bmad/`, a prefix wrapped onto the previous line, an
 * uppercase module segment. This walks every `_bmad/` occurrence and inspects the text immediately
 * before it, so the only way to pass is to carry the exact prefix.
 *
 * WHAT THIS DOES NOT CATCH:
 *   - whether the path is the RIGHT target — only that it is prefixed and the file exists;
 *   - paths written without the `_bmad/` root at all (e.g. a bare `mvp/validate.md` gloss);
 *   - the same defect class outside these files: 83 further occurrences ship in `_bmad/bme/**.md`
 *     (guides, READMEs, `compass-routing-reference.md`, 7 workflow schema glosses). cir-1-1 scoped
 *     to load instructions deliberately; the residue is stated in that story, not guarded here;
 *   - anything about the agents' `SKILL.md` files, which carry no unprefixed cross-directory paths
 *     (verified at 6e306647) and are the expectation SOURCE here, not a subject.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');

const AGENTS_DIR = path.join(PACKAGE_ROOT, '_bmad/bme/_vortex/agents');
const PREFIX = '{project-root}/';

/** Agents whose SKILL.md routes capabilities to `./references/<name>.md`. */
function agentsWithCapabilityReferences() {
  const found = [];
  for (const id of fs.readdirSync(AGENTS_DIR).sort()) {
    const skill = path.join(AGENTS_DIR, id, 'SKILL.md');
    if (!fs.existsSync(skill)) continue;
    // Expectation source: the SKILL.md, which the reference files do not control.
    const named = [...fs.readFileSync(skill, 'utf8').matchAll(/\.\/references\/([a-z0-9-]+\.md)/g)]
      .map((m) => m[1]);
    if (named.length === 0) continue;
    found.push({ id, named: [...new Set(named)].sort() });
  }
  return found;
}

/** Every `_bmad/` occurrence in `text`, with whether the exact prefix sits immediately before it. */
function bmadPathOccurrences(text) {
  const out = [];
  for (const m of text.matchAll(/_bmad\/[A-Za-z0-9_.\-/]*/g)) {
    const before = text.slice(Math.max(0, m.index - PREFIX.length), m.index);
    out.push({ path: m[0], prefixed: before === PREFIX, index: m.index });
  }
  return out;
}

describe('cir-1-1: capability reference files resolve from a stated base', () => {
  const agents = agentsWithCapabilityReferences();

  it('finds the converted agents and their reference files — the floor', () => {
    // Without floors this whole suite passes on an empty tree: deleting the 12 files, or emptying
    // them, would leave nothing unprefixed to find. The existing sibling needed three floors for
    // exactly this reason.
    assert.ok(agents.length >= 3,
      `expected at least 3 agents routing to ./references/, found ${agents.length}`);
    const total = agents.reduce((n, a) => n + a.named.length, 0);
    assert.ok(total >= 12,
      `expected at least 12 capability reference files named across SKILL.md files, found ${total}`);
  });

  for (const agent of agentsWithCapabilityReferences()) {
    describe(agent.id, () => {
      for (const file of agent.named) {
        const rel = path.join('_bmad/bme/_vortex/agents', agent.id, 'references', file);
        const abs = path.join(AGENTS_DIR, agent.id, 'references', file);

        it(`${file}: exists, and every cross-directory path carries ${PREFIX}`, () => {
          assert.ok(fs.existsSync(abs),
            `${rel} is named by ${agent.id}/SKILL.md but does not exist`);
          const text = fs.readFileSync(abs, 'utf8');
          const occurrences = bmadPathOccurrences(text);

          // Per-file floor: a file with no cross-directory path at all cannot vacuously pass the
          // assertion below. Emptying a reference file must go red, not silent.
          assert.ok(occurrences.length > 0,
            `${rel} names no _bmad/ path — either the capability lost its workflow pointer, or this test is looking in the wrong place`);

          const bare = occurrences.filter((o) => !o.prefixed);
          assert.deepEqual(bare.map((o) => o.path), [],
            `${rel}: ${bare.length} cross-directory path(s) lack ${PREFIX} and resolve from skill root`);
        });

        it(`${file}: every prefixed target exists on disk`, () => {
          // No other gate does this. Measured at 6e306647: `reference-integrity.js` reports
          // "0 references checked" over these files because it space-fills inline code spans and
          // every path here is backticked; `docs-audit.js`'s corpus is a fixed list that excludes
          // them. So a typo in a prefixed target would otherwise ship unnoticed.
          const text = fs.readFileSync(abs, 'utf8');
          const missing = [];
          for (const occ of bmadPathOccurrences(text)) {
            const target = path.join(PACKAGE_ROOT, occ.path.replace(/[.,;:)]+$/, ''));
            if (!fs.existsSync(target)) missing.push(occ.path);
          }
          assert.deepEqual(missing, [], `${rel}: target(s) do not exist: ${missing.join(', ')}`);
        });
      }
    });
  }
});
