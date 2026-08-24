'use strict';

// Pure internals of the T66 gate in `scripts/test-runner.js`.
//
// Lives in its own module so the fail-closed and directive branches can be tested
// directly. Both sit on paths a CLI invocation cannot easily reach — an empty or
// truncated side channel, a directive-looking test name — which is why they
// previously shipped verified only by hand probe.

/**
 * Failing TAP lines in `raw`, or a synthetic failure when the stream is incomplete.
 *
 * Pure and exported (see the bottom of this file) so the fail-closed and directive
 * branches can be tested directly — both live on paths a CLI invocation cannot
 * easily reach, which is why they previously shipped verified only by hand probe.
 *
 * @param {string} raw - Full TAP output.
 * @returns {string[]} Verbatim failing TAP lines, plus a `SIDE_CHANNEL_PREFIX` marker
 *   when the stream itself is unusable. Markers are appended, never substituted, so a
 *   completeness complaint can never swallow a real failure.
 */
/** Every synthetic marker starts with this — the side channel failed, not a test. */
const SIDE_CHANNEL_PREFIX = 'not ok - T66 side channel';

function tapFailureLines(raw) {
  const lines = String(raw ?? '').split('\n').map((l) => l.replace(/\r$/, ''));

  // Column-0 result lines only. Nested subtests are indented and re-reported on their
  // enclosing suite at column 0, so anchoring avoids counting one failure per level.
  const results = lines.filter((l) => /^(?:not ok|ok) \d+/.test(l));

  // A `# SKIP` / `# TODO` directive marks a pass whatever the token, and node emits
  // `not ok N - x # TODO` for a todo whose body throws. The ESCAPE check is the whole
  // discriminator and is sufficient alone: node escapes any literal hash in a name —
  // and in a directive's reason — as `\#`, so an UNescaped `#` can only be a directive.
  // An end-of-line anchor was tried and is wrong: `{ todo: 'see issue #42' }` emits
  // `not ok 1 - x # TODO see issue \#42`, whose trailing `\#` defeated it.
  const failures = results.filter(
    (l) => /^not ok /.test(l) && !/(?<!\\)#\s*(TODO|SKIP)\b/i.test(l)
  );

  // COMPLETENESS. A prefix test on the lines after the plan is not a discriminator:
  // node emits `# Subtest: <name>` at column 0 before every result, and forwards a
  // test's own console.log as `# <text>` — so `every(startsWith('#'))` accepts a stream
  // truncated one line after a LEADING plan (TAP13 permits plan-first). The invariant
  // that actually holds is arithmetic: the plan count equals the number of column-0
  // results. Failures found so far are always returned alongside any synthetic marker,
  // so a real failure is never swallowed by a completeness complaint.
  const planLine = lines.find((l) => /^1\.\.\d+$/.test(l));
  if (!planLine) {
    return [...failures, `${SIDE_CHANNEL_PREFIX} incomplete (no TAP plan)`];
  }
  const planned = Number(/^1\.\.(\d+)$/.exec(planLine)[1]);
  if (planned === 0) {
    // A valid plan meaning ZERO tests ran. Defence in depth rather than a live path:
    // measured, a file registering no tests emits `ok 1 - <file>` with plan `1..1`, and
    // the runner exits early when no files match — so `1..0` is not currently reachable
    // from it. Kept because "the plan says nothing ran" must never read as success.
    // Number(), not a string compare: `1..00` is also zero.
    return [...failures, `${SIDE_CHANNEL_PREFIX} reports a plan of 0 tests (nothing ran)`];
  }
  if (results.length !== planned) {
    return [
      ...failures,
      `${SIDE_CHANNEL_PREFIX} incomplete (plan says ${planned}, saw ${results.length} results)`,
    ];
  }
  return failures;
}

/**
 * Does this runtime support `--test-reporter` / `--test-reporter-destination`?
 *
 * Backported to 18.15 and landed in 19.6 — so 19.0-19.5 does NOT have it, and a bare
 * `maj > 18` aborts the entire suite on an unknown option there.
 *
 * Single definition on purpose: the test suite previously re-implemented this, and a
 * drift in the permissive direction would silently convert most of it to `t.skip`,
 * leaving the gate untested behind a green run.
 *
 * @param {string} [version] - Defaults to the running node.
 * @returns {boolean}
 */
function supportsReporters(version = process.versions.node) {
  // Tolerate a leading `v`; reject anything else unparseable LOUDLY rather than
  // returning false, which would disable the gate while blaming the node version.
  const [maj, min] = String(version).replace(/^v/, '').split('.').map(Number);
  if (!Number.isInteger(maj) || !Number.isInteger(min)) {
    throw new TypeError(`supportsReporters: unparseable node version ${JSON.stringify(version)}`);
  }
  if (maj === 18) return min >= 15;
  if (maj === 19) return min >= 6;
  return maj > 19;
}

module.exports = { tapFailureLines, supportsReporters, SIDE_CHANNEL_PREFIX };
