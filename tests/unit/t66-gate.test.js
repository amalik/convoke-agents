'use strict';

// T67(h) — direct tests for the T66 gate's pure internals.
//
// These two branches shipped in T66 verified only by hand probe, because both live on
// paths a CLI invocation cannot easily reach: an empty or truncated side channel, and
// a test name that merely looks like a TAP directive. An uncovered fail-closed branch
// is the kind that rots — it only ever runs on the day something is already wrong.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('node:child_process');

const { tapFailureLines, supportsReporters } = require('../../scripts/lib/t66-gate');

describe('tapFailureLines — fail-closed on an incomplete stream', () => {
  // A completed TAP stream always ends with a `1..N` plan. Anything without one means
  // the reporter never finished, and reading that as "no failures" is failing OPEN —
  // a check reporting success because it could not run.
  const incomplete = [
    ['empty file', ''],
    ['whitespace only', '\n\n'],
    ['header but no plan', 'TAP version 13\n'],
    ['truncated mid-run', 'TAP version 13\nok 1 - a\nnot ok 2 - b\n'],
  ];

  for (const [label, raw] of incomplete) {
    it(`treats ${label} as a failure rather than a pass`, () => {
      const out = tapFailureLines(raw);
      assert.ok(out.length >= 1, `expected a synthetic failure for ${label}`);
      assert.ok(
        out.some((l) => /incomplete/.test(l)),
        `expected an incompleteness marker for ${label}: ${JSON.stringify(out)}`
      );
    });
  }

  it('reports a real failure ALONGSIDE the incompleteness, never instead of it', () => {
    // A completeness complaint must not swallow the failure the operator needs.
    const out = tapFailureLines('TAP version 13\nok 1 - a\nnot ok 2 - b\n');
    assert.ok(out.includes('not ok 2 - b'), `the real failure must survive: ${JSON.stringify(out)}`);
    assert.ok(out.some((l) => /incomplete/.test(l)), JSON.stringify(out));
  });

  it('rejects a stream truncated after a LEADING plan', () => {
    // TAP13 permits the plan first. Merely finding `1..N` anywhere accepts a stream
    // that died right after it — a killed writer, a full disk — and reads it as clean.
    const out = tapFailureLines('TAP version 13\n1..5\nok 1 - a\n');
    assert.equal(out.length, 1);
    assert.match(out[0], /incomplete/, out[0]);
  });

  it('rejects `1..0` — a valid plan meaning nothing ran', () => {
    // The runner's other guard counts *.test.js FILES, not registered tests, so a
    // suite where every file registers nothing would otherwise be reported green.
    const out = tapFailureLines('TAP version 13\n1..0\n');
    assert.equal(out.length, 1);
    assert.match(out[0], /nothing ran/, out[0]);
  });

  it('accepts a completed stream with no failures', () => {
    assert.deepEqual(tapFailureLines('TAP version 13\nok 1 - a\n1..1\n'), []);
  });

  it('accepts CRLF line endings', () => {
    assert.deepEqual(tapFailureLines('TAP version 13\r\nok 1 - a\r\n1..1\r\n'), []);
  });
});

describe('tapFailureLines — pinned against REAL node:test output', () => {
  // Every other case here is hand-written TAP, i.e. a transcription of the belief the
  // whole filter rests on: that node escapes a literal `#` as `\#`. If that belief is
  // wrong or node changes it, those cases stay green while the runner turns a
  // legitimate `{ todo: 'see issue #42' }` red. This one captures actual reporter
  // output so the premise is pinned to reality rather than to my transcription.
  it('a todo with a hashed reason, and a hash in a test name, behave as assumed', (t) => {
    if (!supportsReporters()) {
      // Without --test-reporter the child dies on an unknown option and stdout is
      // empty, which would surface as a filter regression rather than a missing flag.
      t.skip(`node ${process.versions.node} predates --test-reporter`);
      return;
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-tapreal-'));
    try {
      const file = path.join(dir, 'real.test.js');
      fs.writeFileSync(
        file,
        `const { describe, it, after } = require('node:test');
it('x', { todo: 'see issue #42' }, () => { throw new Error('boom'); });
describe('renders the # TODO badge', () => {
  after(() => { throw new Error('teardown exploded'); });
  it('passes', () => {});
});
`
      );
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT;
      delete env.NODE_V8_COVERAGE;
      delete env.NODE_OPTIONS;
      const res = spawnSync(
        process.execPath,
        ['--test', '--test-reporter=tap', '--test-reporter-destination=stdout', file],
        { encoding: 'utf8', env, timeout: 60_000 }
      );
      assert.ok(!res.error, `spawn failed: ${res.error && res.error.message}`);
      assert.equal(typeof res.stdout, 'string', 'spawn produced no stdout to analyse');
      assert.ok(res.stdout.includes('TAP version'), `child did not emit TAP:\n${res.stderr}`);
      const out = tapFailureLines(res.stdout);
      // The todo must be filtered; the describe whose NAME contains '# TODO' must not.
      assert.ok(
        !out.some((l) => /# TODO see issue/i.test(l)),
        `a todo directive must not be reported as a failure:\n${res.stdout}`
      );
      assert.ok(
        out.some((l) => /renders the/.test(l)),
        `a real failure in a suite whose NAME looks like a directive must be reported:\n${res.stdout}`
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
    }
  });
});

describe('tapFailureLines — TAP directive semantics', () => {
  const plan = (body) => `TAP version 13\n${body}\n1..1\n`;

  // `# SKIP` / `# TODO` mark a PASS in TAP whatever the ok/not-ok token, and node
  // emits `not ok N - x # TODO` for a todo whose body throws.
  const passes = [
    ['plain todo directive', 'not ok 1 - x # TODO'],
    ['lowercase directive', 'not ok 1 - x # todo'],
    ['no space after hash', 'not ok 1 - x #TODO'],
    ['skip with a reason', 'not ok 1 - x # SKIP not on this platform'],
    // The reason's hash is escaped by node, which is what defeated an earlier
    // end-of-line anchor and turned `{ todo: 'see issue #42' }` into a red build.
    ['todo whose reason contains a hash', 'not ok 1 - x # TODO see issue \\#42'],
  ];
  for (const [label, line] of passes) {
    it(`does not report ${label}`, () => {
      assert.deepEqual(tapFailureLines(plan(line)), [], line);
    });
  }

  // node escapes a literal hash in a NAME as `\#`, so an unescaped `#` can only
  // introduce a real directive. That escape check is the whole discriminator.
  const failures = [
    ['a plain failure', 'not ok 1 - teardown exploded'],
    ['a name containing an escaped directive', 'not ok 1 - renders the \\# TODO badge'],
    ['the word todo without a hash', 'not ok 1 - todo list renders'],
  ];
  for (const [label, line] of failures) {
    it(`reports ${label}`, () => {
      assert.deepEqual(tapFailureLines(plan(line)), [line], line);
    });
  }

  it('reports a name with an escaped hash even when a real directive follows', () => {
    // Both present: the escaped one in the name, a genuine directive at the end.
    // The directive wins — it is a pass.
    assert.deepEqual(tapFailureLines(plan('not ok 1 - a \\# TODO badge # TODO')), []);
  });

  it('ignores indented (nested) lines, relying on TAP re-reporting at column 0', () => {
    // Nested failures are re-reported on the enclosing suite at column 0, so anchoring
    // avoids counting the same failure once per level.
    const raw = 'TAP version 13\n    not ok 1 - inner\nnot ok 1 - outer\n1..1\n';
    assert.deepEqual(tapFailureLines(raw), ['not ok 1 - outer']);
  });
});

describe('supportsReporters — the version boundary, tested not assumed', () => {
  // `--test-reporter` was backported to 18.15 and landed in 19.6. A bare `maj > 18`
  // claims support on 19.0-19.5 and aborts the whole suite on an unknown option.
  const cases = [
    ['18.0.0', false], ['18.14.9', false], ['18.15.0', true], ['18.20.4', true],
    ['19.0.0', false], ['19.5.0', false], ['19.6.0', true],
    ['20.0.0', true], ['22.11.0', true], ['25.8.1', true],
    ['20.0.0-nightly20230101', true],
    ['v20.0.0', true], // leading v, as `node -v` prints
  ];
  it('throws on an unparseable version rather than silently disabling the gate', () => {
    // Returning false here would turn the gate off while blaming the node version.
    for (const bad of ['', '18', 'abc', 'x.y.z']) {
      assert.throws(() => supportsReporters(bad), /unparseable/, `should throw for ${JSON.stringify(bad)}`);
    }
  });

  for (const [version, expected] of cases) {
    it(`${version} -> ${expected ? 'supported' : 'unsupported'}`, () => {
      assert.equal(supportsReporters(version), expected);
    });
  }
});
