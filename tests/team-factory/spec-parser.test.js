const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

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

  for (const bad of [
    '_bmad-output/../../escaped',
    '_bmad-output/../etc',
    '_bmad-output/x/../../../tmp/pwned',
    '_bmad-output/'
  ]) {
    it(`rejects ${JSON.stringify(bad)}`, async () => {
      assert.match(await errorsFor(bad), /_bmad-output\//);
    });
  }

  it('still accepts a normal nested path', async () => {
    assert.ok(!/output_directory/.test(await errorsFor('_bmad-output/probe-artifacts/sub')));
  });
});
