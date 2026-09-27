'use strict';

/**
 * Each v6.3 agent's capability reference file points at the workflow its menu code was captured
 * pointing at, with a `{project-root}/` prefix, and each target exists with the right type.
 *
 * WHY THIS EXISTS (cir-1-1). A bare path resolves from skill root, so "invoke the workflow at
 * `_bmad/bme/_vortex/workflows/mvp/workflow.md`" pointed inside the agent's own directory, where no
 * `workflows/` tree exists. It only appeared to work when the agent was activated from the project
 * root. 22 such paths across 12 files were prefixed.
 *
 * WHY IT ASSERTS THE TARGET AND NOT JUST THE SHAPE. R1 demonstrated that a prefix-shape check is
 * nearly worthless: a mutant repointed all 12 capabilities at one workflow and this file, plus
 * `vortex-parity` and all of `tests/p0`, stayed green. Nothing in the repository detected a
 * cross-wired capability. So the expected path is taken from `menuCodeToWorkflow` in
 * `tests/integration/fixtures/vortex-parity/*-baseline.json` and compared as an exact string.
 *
 * `committed-artifact-integrity` (`project-context.md`): the reference files ARE the subject, so a
 * fixture copy would test the copy. This file imports no module under test. Two independent
 * expectation sources, neither controlled by the judged file:
 *   - the frozen parity baselines — `captured: 2026-05-02`, `preMigrationFormat: v5-xml-in-markdown`,
 *     pinned by `preMigrationGitBlob`. They predate the reference files and were taken from a
 *     different format, so they cannot have been derived from what they now judge.
 *   - each agent's `SKILL.md` capability table, for which reference file a code routes to.
 * Set equality in both directions means new data goes red until it is complete, in either direction:
 * an unrouted file on disk and a routed file that is missing both fail.
 *
 * WHAT THIS DOES NOT CATCH:
 *   - `_bmad-output/` and other sibling trees: the occurrence scan is `_bmad/`-rooted, and
 *     `_bmad-output/` does not match it. No reference file names that tree today (deferred in R1).
 *   - paths written without an `_bmad/` root at all — a bare `mvp/validate.md` gloss is invisible.
 *   - whether the workflow a code SHOULD point at is itself correct. The baselines freeze what the
 *     v5 agents did; if a pre-migration mapping was wrong, this preserves the error faithfully.
 *   - the same defect class outside these files: 83 occurrences ship elsewhere under `_bmad/bme/`.
 *     cir-1-1 scoped to load instructions; that residue is stated in the story, not guarded here.
 *   - anything about an installed or published tree. Targets resolve against the source repo, so a
 *     target present here but absent from the tarball would pass.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');

const AGENTS_DIR = path.join(PACKAGE_ROOT, '_bmad/bme/_vortex/agents');
const FIXTURES_DIR = path.join(PACKAGE_ROOT, 'tests/integration/fixtures/vortex-parity');
const PREFIX = '{project-root}/';

/** The frozen pre-migration capture: agent id -> { menu code -> workflow path }. */
function frozenMaps() {
  const out = {};
  for (const f of fs.readdirSync(FIXTURES_DIR).sort()) {
    if (!f.endsWith('-baseline.json')) continue;
    const fixture = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, f), 'utf8'));
    if (fixture.menuCodeToWorkflow) out[f.replace('-baseline.json', '')] = fixture.menuCodeToWorkflow;
  }
  return out;
}

/** From an agent's SKILL.md capability table: menu code -> reference filename. */
function routedCapabilities(agentId) {
  const skill = fs.readFileSync(path.join(AGENTS_DIR, agentId, 'SKILL.md'), 'utf8');
  const out = {};
  for (const m of skill.matchAll(/^\|\s*([A-Z]{2})\s*\|[^|]*\|[^|]*`\.\/references\/([^`]+)`/gm)) {
    out[m[1]] = m[2];
  }
  return out;
}

/**
 * The paths a reference file must name, derived from the frozen map rather than listed here.
 * A `workflow.md` capability also names its `steps/` directory; a `validate.md` one does not.
 */
function expectedPaths(workflowPath) {
  if (path.basename(workflowPath) === 'workflow.md') {
    return [workflowPath, `${path.dirname(workflowPath)}/steps/`].sort();
  }
  return [workflowPath];
}

/** Every `_bmad/`-rooted occurrence, with whether the exact prefix sits immediately before it. */
function occurrences(text) {
  return [...text.matchAll(/_bmad\/[A-Za-z0-9_.\-/]*/g)].map((m) => ({
    path: m[0],
    prefixed: text.slice(Math.max(0, m.index - PREFIX.length), m.index) === PREFIX,
  }));
}

const frozen = frozenMaps();

describe('cir-1-1: capability reference files point where the frozen capture says', () => {
  it('the frozen oracle covers the agents and codes it is asserted against', () => {
    // Literal membership from the committed record, not an aggregate count off today's tree. An
    // aggregate floor (">= 3 agents", ">= 12 files") stops biting the moment a fourth agent is
    // converted: R1 showed a whole agent could regress while both counts still passed.
    assert.deepEqual(Object.keys(frozen).sort(),
      ['contextualization-expert', 'lean-experiments-specialist', 'research-convergence-specialist']);
    const codes = Object.values(frozen).reduce((n, m) => n + Object.keys(m).length, 0);
    assert.equal(codes, 12, `expected 12 routed capabilities in the frozen baselines, found ${codes}`);
  });

  for (const [agentId, codeToWorkflow] of Object.entries(frozen)) {
    describe(agentId, () => {
      const routed = routedCapabilities(agentId);
      const refsDir = path.join(AGENTS_DIR, agentId, 'references');

      it('every routed code is captured, and every captured code is routed', () => {
        assert.deepEqual(Object.keys(routed).sort(), Object.keys(codeToWorkflow).sort());
      });

      it('the reference directory holds exactly the files the capability table routes to', () => {
        // Closes both orphan directions: a file on disk that no code names would otherwise never be
        // opened, and a routed file that is missing would otherwise be invisible.
        assert.deepEqual(fs.readdirSync(refsDir).sort(), [...new Set(Object.values(routed))].sort());
      });

      for (const [code, workflowPath] of Object.entries(codeToWorkflow)) {
        const file = routed[code];
        if (!file) continue; // the equality assertion above owns this failure
        const rel = path.join('_bmad/bme/_vortex/agents', agentId, 'references', file);

        it(`${code} -> ${file}: names exactly its captured workflow, prefixed`, () => {
          const text = fs.readFileSync(path.join(refsDir, file), 'utf8');
          const found = occurrences(text);

          const bare = found.filter((o) => !o.prefixed).map((o) => o.path);
          assert.deepEqual(bare, [], `${rel}: path(s) lack ${PREFIX} and resolve from skill root`);

          // Exact set equality against the frozen capture. This is what a prefix-shape check missed:
          // it kills cross-wiring, a path truncated at a `{placeholder}` (the match stops at `{`, so
          // the set no longer matches), a wrong-case segment, and a double base — in one assertion.
          assert.deepEqual(found.map((o) => o.path).sort(), expectedPaths(workflowPath),
            `${rel}: named paths do not match the frozen capture for ${code}`);
        });

        it(`${code} -> ${file}: every target exists with the right type`, () => {
          // No other gate checks these targets at all: `reference-integrity.js` reports
          // "0 references checked" over these files because it space-fills inline code spans and
          // every path here is backticked, and `docs-audit.js` runs a fixed corpus that excludes
          // them. `existsSync` alone was not enough — a directory satisfied a claim about a file.
          for (const p of expectedPaths(workflowPath)) {
            const target = path.join(PACKAGE_ROOT, p);
            assert.ok(fs.existsSync(target), `${rel}: ${p} does not exist`);
            const stat = fs.statSync(target);
            if (p.endsWith('/')) {
              assert.ok(stat.isDirectory(), `${rel}: ${p} is named as a directory but is a file`);
            } else {
              assert.ok(stat.isFile(), `${rel}: ${p} is named as a file but is a directory`);
            }
          }
        });
      }
    });
  }
});
