'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { vendoredContentSkipReason } = require('./portability-preconditions');

// Restore trigger for the `scripts/portability/**` coverage exclusion.
//
// WHY THIS TEST EXISTS (code review 2026-08-10, HIGH)
// ---------------------------------------------------
// `.c8rc.json` excludes `scripts/portability/**` because its suites are disabled while
// the vendored BMAD skill content is missing (backlog I123). That exclusion is load-
// bearing and dangerous: `scripts/portability/convoke-export.js` is a DECLARED BIN
// (`package.json` -> `bin["convoke-export"]`) shipped to npm inside `files: ["scripts/"]`.
// So production code currently ships with its tests skipped AND no coverage floor.
//
// Keeping the global thresholds "intact" while removing the untested code from the
// denominator is functionally equivalent to lowering them. That trade is accepted only
// as a temporary measure, and only while its cause holds.
//
// `.c8rc.json` is plain JSON with nowhere to record intent, so this test is the link:
// the exclusion is legal ONLY while the precondition that justifies it is still true.
// The moment the vendored content returns (or the suites are converted to fixtures and
// the guard stops firing), this fails and forces the exclusion to be removed — instead
// of the exclusion quietly outliving its reason and hiding an untested shipped binary.

describe('portability coverage exclusion is tied to its cause', () => {
  const projectRoot = findProjectRoot();
  const C8RC = path.join(projectRoot, '.c8rc.json');
  const EXCLUSION = 'scripts/portability/**';

  it('the exclusion exists if and only if the vendored-content precondition fails', () => {
    const c8rc = JSON.parse(fs.readFileSync(C8RC, 'utf8'));
    const excluded = (c8rc.exclude || []).includes(EXCLUSION);
    const skipReason = vendoredContentSkipReason();

    if (skipReason) {
      assert.equal(
        excluded,
        true,
        `Portability suites are disabled (${skipReason}) but "${EXCLUSION}" is not excluded in .c8rc.json — ` +
          `the coverage gate would fail on code whose tests cannot run.`
      );
    } else {
      assert.equal(
        excluded,
        false,
        `Portability suites can now run, so "${EXCLUSION}" must be REMOVED from .c8rc.json exclude. ` +
          `convoke-export.js is a shipped bin; leaving it outside the coverage gate hides untested ` +
          `production code. See backlog I123.`
      );
    }
  });

  it('convoke-export is still a shipped bin (the reason this matters)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    // If this ever stops being true, the urgency of I123 drops and this test's rationale
    // should be revisited rather than silently carried forward.
    assert.equal(pkg.bin['convoke-export'], 'scripts/portability/convoke-export.js');
    assert.ok(pkg.files.includes('scripts/'));
  });
});
