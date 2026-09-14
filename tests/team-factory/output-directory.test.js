'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { removeTempDirSync } = require('../helpers');
const { CONTAINMENT_CASES, ACCEPTED, REJECTED, PREFIXED } = require('./output-directory-cases');

const {
  isContainedOutputDirectory,
  isRepoRelativeOutputDirectory,
  assertContainedOutputDirectory,
  stripProjectRoot,
} = require('../../_bmad/bme/_team-factory/lib/utils/output-directory');

const { parseSpecFromString } = require('../../_bmad/bme/_team-factory/lib/spec-parser');
const yaml = require('js-yaml');

const { buildConfigData, ensureOutputDirectory } = require('../../_bmad/bme/_team-factory/lib/writers/config-creator');

// tfr-1-1 (T163a), AC#3. ONE case table, iterated across EVERY call site.
//
// Three separate suites — one per site — is what let the three predicates drift
// apart in the first place, so the shape of this file is the fix as much as the
// predicate is. `shared-test-constants`.

const tmpDirs = [];
function tmpRoot() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'tfr-outdir-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) removeTempDirSync(tmpDirs.pop());
});

const label = c => `${JSON.stringify(c.value)} — ${c.contained ? 'contained' : 'rejected'}`;

describe('the predicate itself', () => {
  for (const c of CONTAINMENT_CASES) {
    it(label(c), () => {
      assert.equal(isContainedOutputDirectory(c.value), c.contained, c.why);
    });
  }
});

describe('assertContainedOutputDirectory agrees with the predicate', () => {
  for (const c of ACCEPTED) {
    it(`returns ${JSON.stringify(c.value)} unchanged`, () => {
      // Unchanged means the PREFIX SURVIVES. `prefixProjectRoot` is idempotent, so
      // an assert that quietly stripped the prefix would still produce a correct
      // config — and the bug would surface only on the bypass path.
      assert.equal(assertContainedOutputDirectory(c.value), c.value);
    });
  }
  for (const c of REJECTED) {
    it(`throws on ${JSON.stringify(c.value)}`, () => {
      assert.throws(() => assertContainedOutputDirectory(c.value), /strictly inside/, c.why);
    });
  }
});

describe('call site: buildConfigData', () => {
  const spec = (output_directory) => ({
    team_name: 'Probe', team_name_kebab: 'probe', description: 'd',
    agents: [{ id: 'a', capabilities: ['x'] }],
    integration: { output_directory },
  });

  for (const c of ACCEPTED) {
    it(`accepts ${JSON.stringify(c.value)}`, () => {
      const data = buildConfigData(spec(c.value));
      assert.match(data.output_folder, /^\{project-root\}\//, 'config always carries the prefix');
      assert.ok(!data.output_folder.startsWith('{project-root}/{project-root}/'), 'never double-prefixed');
    });
  }

  for (const c of REJECTED) {
    it(`throws on ${JSON.stringify(c.value)}`, () => {
      assert.throws(() => buildConfigData(spec(c.value)), /strictly inside/, c.why);
    });
  }
});

describe('call site: ensureOutputDirectory', () => {
  const spec = (output_directory) => ({ integration: { output_directory } });

  for (const c of ACCEPTED) {
    it(`accepts ${JSON.stringify(c.value)}`, async () => {
      const root = tmpRoot();
      const r = await ensureOutputDirectory(spec(c.value), root);
      assert.equal(r.success, true, `${c.why}\nerrors: ${JSON.stringify(r.errors)}`);
      assert.ok(fs.existsSync(r.path), 'the directory is created');
      assert.ok(
        r.path.startsWith(path.join(root, '_bmad-output') + path.sep),
        'the resolved path lies inside the output root'
      );
    });
  }

  for (const c of REJECTED) {
    it(`refuses ${JSON.stringify(c.value)}`, async () => {
      const root = tmpRoot();
      const r = await ensureOutputDirectory(spec(c.value), root);
      assert.equal(r.success, false, c.why);
      assert.ok(r.errors.length > 0, 'refusal names a reason');
    });
  }
});

describe('call site: spec-parser — the caller AC#3 names FIRST', () => {
  // Round 2: this sweep did not exist, and moving the `{project-root}/` stripping
  // into the base predicate silently relaxed parseSpec to accept the CONFIG shape
  // in a SPEC field — undoing a tf-2-13 R2 ruling recorded in the module's own
  // fixture comment. No test noticed, because the "four call sites" were the
  // predicate, the assert, buildConfigData and ensureOutputDirectory.
  const specYaml = (output_directory) => yaml.dump({
    schema_version: '1.0', team_name: 'Probe', team_name_kebab: 'probe',
    composition_pattern: 'Independent', created: '2026-09-14', factory_version: '1.0',
    discovery_path: 'unknown', decisions: [],
    agents: [{ id: 'probe-one', role: 'Probes', capabilities: ['probing'], overlap_acknowledgments: [] }],
    integration: { output_directory },
    progress: { route: 'complete', scope: 'complete', connect: 'complete', review: 'complete', generate: 'pending' },
  });

  // The expectation is DERIVED FROM THE TABLE, never from the predicate under
  // test. Round 3: it used to read `isRepoRelativeOutputDirectory(c.value)`, so
  // mutating that function to accept everything left all 22 tests green — merely
  // renamed from `rejects` to `accepts`, including `accepts "_bmad-output/../../escaped"`.
  // That is `verification-must-be-falsifiable`'s absorbed-mutant case verbatim:
  // both sides of the comparison shared a source.
  const expectedFor = c => c.contained && !String(c.value).startsWith('{project-root}/');

  for (const c of CONTAINMENT_CASES.filter(x => typeof x.value === 'string' && x.value.trim() !== '')) {
    const expected = expectedFor(c);
    it(`${expected ? 'accepts' : 'rejects'} ${JSON.stringify(c.value)}`, async () => {
      const r = await parseSpecFromString(specYaml(c.value));
      assert.equal(r.valid, expected, `${c.why}\nerrors: ${JSON.stringify(r.errors)}`);
    });
  }

  it('REJECTS every config-shaped value, contained or not', async () => {
    assert.ok(PREFIXED.length >= 3, 'the table must carry prefixed cases for this to mean anything');
    for (const c of PREFIXED) {
      assert.equal(isRepoRelativeOutputDirectory(c.value), false, `${c.value} is config shape`);
      const r = await parseSpecFromString(specYaml(c.value));
      assert.equal(r.valid, false, `spec-parser must reject the config shape: ${c.value}`);
    }
  });

  it('but buildConfigData still ACCEPTS the config shape — the two contracts differ on purpose', () => {
    for (const c of PREFIXED.filter(x => x.contained)) {
      assert.equal(isContainedOutputDirectory(c.value), true, c.why);
    }
  });
});

describe('the three call sites agree — the property T163a was filed on', () => {
  for (const c of CONTAINMENT_CASES) {
    it(`no site disagrees about ${JSON.stringify(c.value)}`, async () => {
      const root = tmpRoot();
      const full = { team_name: 'P', team_name_kebab: 'p', description: 'd', agents: [{ id: 'a', capabilities: ['x'] }], integration: { output_directory: c.value } };

      const predicate = isContainedOutputDirectory(c.value);

      let builder;
      try { buildConfigData(full); builder = true; } catch { builder = false; }

      const ensured = (await ensureOutputDirectory({ integration: { output_directory: c.value } }, root)).success;

      assert.deepEqual(
        { predicate, builder, ensured },
        { predicate: c.contained, builder: c.contained, ensured: c.contained },
        `sites disagree on ${JSON.stringify(c.value)} — ${c.why}`
      );
    });
  }
});

describe('stripProjectRoot', () => {
  it('removes the prefix exactly once', () => {
    assert.equal(stripProjectRoot('{project-root}/_bmad-output/x'), '_bmad-output/x');
  });
  it('leaves an unprefixed value alone', () => {
    assert.equal(stripProjectRoot('_bmad-output/x'), '_bmad-output/x');
  });
  it('does not strip a prefix that merely appears mid-path', () => {
    assert.equal(stripProjectRoot('_bmad-output/{project-root}/x'), '_bmad-output/{project-root}/x');
  });
});
