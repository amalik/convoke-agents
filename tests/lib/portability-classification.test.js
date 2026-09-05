'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Story sp-1-2: Classify All Skills.
//
// The manifest-classification lint that used to live here MOVED on 2026-09-05 to
// `scripts/audit/skill-manifest-integrity.js`, with fixture-bound tests in
// `tests/audit/skill-manifest-integrity.test.js`. It read the LIVE tree via
// `findProjectRoot()` + `git ls-files` — a `test-fixture-isolation` violation. It was a
// lint over a tracked governance artifact, not a unit test, so it was promoted to
// `scripts/audit/` alongside `backlog-integrity.js` rather than excused by a rule
// carve-out. Found during the upstream v6.10 -> v6.12 absorption pass.
//
// What remains below is genuinely unit-scoped: pure rendering tests with no tree access.
//
// SCOPE — this file is clean; the RULE is not satisfied repo-wide. `portability-schema.test.js`
// in this same directory still calls `findProjectRoot()` and asserts against the live
// manifest, so `test-fixture-isolation` remains violated there. Filed in `deferred-work.md`
// rather than fixed, to keep this Fast Lane change at one file. Round 2 caught an earlier
// version of this comment implying the class was closed.

// --- BUG-12: markdown table-cell escaping in the borderline report ---
//
// `renderBorderlineMd` interpolated manifest values straight between `|`
// delimiters at three sites. `reason` is free text, so a single pipe in it
// added a column and silently reinterpreted the recommendation as extra cells.
// Same CodeQL js/incomplete-sanitization class as alert 10, which issue #7
// fixed in the sibling file `validate-classification.js` while leaving this
// one untouched.

describe('renderBorderlineMd — table-cell escaping (BUG-12)', () => {
  const { renderBorderlineMd } = require('../../scripts/portability/classify-skills');

  /** Count real cell delimiters — unescaped pipes only. */
  const delims = (line) => line.split(/(?<!\\)\|/).length - 1;
  const dataRows = (md) => md.split('\n').filter((l) => /^\| `/.test(l));

  it('keeps 4 columns when a conflict reason contains a pipe', () => {
    const md = renderBorderlineMd('2026-08-15', [{
      name: 'bmad-x',
      existing: { tier: 'standalone', intent: 'review-something', dependencies: '' },
      proposed: { tier: 'pipeline', intent: 'review-something', dependencies: '' },
      reason: 'manual override | conflicts with heuristic',
    }], [], []);
    const rows = dataRows(md);
    assert.equal(rows.length, 1, `expected 1 row, got ${rows.length}`);
    assert.equal(delims(rows[0]), 5, `row split into extra cells: ${rows[0]}`);
    assert.ok(rows[0].includes('override \\| conflicts'), `pipe not escaped: ${rows[0]}`);
  });

  it('keeps 4 columns when an ambiguous reason contains a pipe', () => {
    const md = renderBorderlineMd('2026-08-15', [], [{
      name: 'bmad-y', tier: 'standalone', intent: 'review-something',
      reason: 'scored a | b equally',
    }], []);
    const rows = dataRows(md);
    assert.equal(rows.length, 1);
    assert.equal(delims(rows[0]), 5, `row split into extra cells: ${rows[0]}`);
  });

  it('keeps 4 columns when a miss carries a pipe in tier or intent', () => {
    const md = renderBorderlineMd('2026-08-15', [], [], [{
      name: 'bmad-z', tier: 'stand|alone', intent: 'review-something',
    }]);
    const rows = dataRows(md);
    assert.equal(rows.length, 1);
    assert.equal(delims(rows[0]), 5, `row split into extra cells: ${rows[0]}`);
  });

  // The skill column is a code span, where backslash escapes are not processed.
  // It must NOT get the backslash-doubling the plain cells get.
  it('does not double backslashes in the backticked skill column', () => {
    const md = renderBorderlineMd('2026-08-15', [], [], [{
      name: 'bmad-a\\b', tier: 'standalone', intent: 'review-something',
    }]);
    const [row] = dataRows(md);
    assert.ok(row.includes('`bmad-a\\b`'), `code span mangled: ${row}`);
    assert.ok(!row.includes('`bmad-a\\\\b`'), `backslash doubled: ${row}`);
  });

  it('flattens newlines so a reason cannot break the table', () => {
    const md = renderBorderlineMd('2026-08-15', [], [{
      name: 'bmad-w', tier: 'standalone', intent: 'review-something',
      reason: 'line1\nline2',
    }], []);
    assert.equal(dataRows(md).length, 1);
    assert.ok(dataRows(md)[0].includes('line1 line2'));
  });
});
