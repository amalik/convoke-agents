'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { REPO_ROOT } = require('./portability-fixture');

// Backlog I123 — CLOSED 2026-08-14. This file used to be a RATCHET.
//
// When an upstream BMAD update deleted the vendored skill content the portability suites read
// from, 12 suites were quarantined and `scripts/portability/**` was removed from `.c8rc.json`
// `exclude` so the 88% functions threshold would still pass. Excluding untested code from the
// denominator while calling the thresholds "intact" is functionally identical to lowering them,
// and `.c8rc.json` is plain JSON with nowhere to record that intent — so this test carried it:
// the exclusion was legal ONLY while the precondition that justified it still held, and this
// test was written to FAIL the moment that stopped being true.
//
// It has now fired and been discharged. The suites run against a committed fixture
// (`tests/lib/portability-fixture.js`), the guard is deleted, and the exclusion is gone. What
// remains is the one-way half of the ratchet: the exclusion must never come back.
//
// Re-adding it is the easy move next time an upstream update breaks these suites. It is also
// how a shipped bin ends up untested — which is not hypothetical: while `scripts/portability/**`
// sat outside the coverage gate, `convoke-export` shipped with a broken template path that made
// it fail in EVERY user project. Un-quarantining the suites is what surfaced it.

describe('portability coverage exclusion must not return', () => {
  const C8RC = path.join(REPO_ROOT, '.c8rc.json');
  const EXCLUSION = 'scripts/portability/**';

  it('scripts/portability/** is inside the coverage gate', () => {
    const c8rc = JSON.parse(fs.readFileSync(C8RC, 'utf8'));
    assert.equal(
      (c8rc.exclude || []).includes(EXCLUSION),
      false,
      `"${EXCLUSION}" is excluded from coverage again. convoke-export.js is a shipped bin; ` +
        `leaving it outside the gate hides untested production code. If an upstream change broke ` +
        `these suites, extend tests/fixtures/portability-project/ instead — see backlog I123.`
    );
  });

  it('the coverage thresholds were not lowered instead', () => {
    // The other way to make this pass. Values are asserted explicitly so a quiet downgrade is
    // as loud as re-adding the exclusion.
    const c8rc = JSON.parse(fs.readFileSync(C8RC, 'utf8'));
    assert.equal(c8rc.functions, 88, 'functions threshold changed');
    assert.equal(c8rc.lines, 83, 'lines threshold changed');
    assert.equal(c8rc.branches, 80, 'branches threshold changed');
    assert.equal(c8rc['check-coverage'], true, 'coverage checking was switched off');
  });

  it('convoke-export is still a shipped bin (the reason this matters)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    // If this stops being true, the urgency drops and this file's rationale should be revisited
    // rather than silently carried forward.
    assert.equal(pkg.bin['convoke-export'], 'scripts/portability/convoke-export.js');
    assert.ok(pkg.files.includes('scripts/'));
  });
});
