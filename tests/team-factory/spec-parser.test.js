const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { REJECTED, PREFIXED } = require('./output-directory-cases');
const { parseSpecFromString } = require('../../_bmad/bme/_team-factory/lib/spec-parser');

// ── tf-2-13 Task 1 (T133a): enforce the _bmad-output/ rule that was prose-only ──
//
// `step-02-connect.md` §3 instructs "Validate: path should start with `_bmad-output/`".
// Nothing in lib/ enforced it — there was no `startsWith('_bmad-output/')` anywhere —
// so the rule lived only in prose, which is how a generated team's output path drifted.
//
// Note: this is the FIRST test file for spec-parser.js. The module had no coverage.
describe('tf-2-13: output_directory shape is enforced in code, not just prose', () => {
  const base = {
    schema_version: '1.0',
    team_name: 'Probe',
    team_name_kebab: 'probe',
    composition_pattern: 'Independent',
    agents: [{ id: 'alpha-probe', role: 'r' }]
  };
  const errorsFor = async (integration) => {
    const r = await parseSpecFromString(JSON.stringify({ ...base, integration }));
    return (r.errors || []).join(' | ');
  };

  it('accepts a repo-relative path under _bmad-output/', async () => {
    const errs = await errorsFor({ output_directory: '_bmad-output/probe-artifacts' });
    assert.ok(!/output_directory/.test(errs), `unexpected error: ${errs}`);
  });

  it('rejects a path outside _bmad-output/', async () => {
    const errs = await errorsFor({ output_directory: 'tmp/probe-artifacts' });
    assert.match(errs, /_bmad-output\//);
  });

  it('rejects an absolute path', async () => {
    const errs = await errorsFor({ output_directory: '/var/tmp/probe' });
    assert.match(errs, /_bmad-output\//);
  });

  it('still reports the field as required when absent', async () => {
    const errs = await errorsFor({});
    assert.match(errs, /output_directory is required/);
  });
});

// ── R2: `startsWith('_bmad-output/')` is a string test, not a path test ──
// `_bmad-output/../../escaped` passed it, and ensureOutputDirectory then mkdir -p'd
// outside the repo — the escaped path landing in config.yaml AND in the abort
// manifest as an `rm` target. project-context.md rule `path-safety-for-destructive-ops`
// requires resolve + normalise + contains-check; the first pass did none of them.
describe('R2: output_directory cannot escape _bmad-output/', () => {
  const base = {
    schema_version: '1.0', team_name: 'Probe', team_name_kebab: 'probe',
    composition_pattern: 'Independent', agents: [{ id: 'alpha-probe', role: 'r' }]
  };
  const errorsFor = async (d) =>
    ((await parseSpecFromString(JSON.stringify({ ...base, integration: { output_directory: d } }))).errors || []).join(' | ');

  // tfr-1-1 R2: this was a hardcoded list of four. AC#3 asks for ONE case table
  // across every caller precisely so the lists cannot drift apart again, and a
  // duplicate here is the drift it forbids. Sourced from the shared table; the
  // prefixed cases are included because a SPEC field must be repo-relative —
  // `step-02-connect.md` defaults it that way and the config shape appearing here
  // is the defect tf-2-13 R2 fixed.
  const mustReject = [...REJECTED, ...PREFIXED]
    .map(c => c.value)
    .filter(v => typeof v === 'string' && v.trim() !== '');

  it('the shared table actually carries escape cases — a guard against an empty sweep', () => {
    assert.ok(mustReject.includes('_bmad-output/../../escaped'), 'the real escape must be in the table');
    assert.ok(mustReject.length >= 10, `expected a substantial table, got ${mustReject.length}`);
  });

  // Deduplicated: REJECTED and PREFIXED overlap, and a repeated value produced a
  // duplicate test name that node:test silently tolerates.
  for (const bad of [...new Set(mustReject)]) {
    it(`rejects ${JSON.stringify(bad)}`, async () => {
      const errs = await errorsFor(bad);
      assert.match(errs, /output_directory/, 'the refusal must name the field, not merely be some error');
    });
  }

  it('still accepts a normal nested path', async () => {
    assert.ok(!/output_directory/.test(await errorsFor('_bmad-output/probe-artifacts/sub')));
  });
});
