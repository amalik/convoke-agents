'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { removeTempDirSync } = require('../helpers');
const { CONTAINMENT_CASES, ACCEPTED, REJECTED } = require('./output-directory-cases');

const {
  isContainedOutputDirectory,
  assertContainedOutputDirectory,
  stripProjectRoot,
} = require('../../_bmad/bme/_team-factory/lib/utils/output-directory');

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
