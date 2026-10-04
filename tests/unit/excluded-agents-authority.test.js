'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

const {
  parseExcludedAgents,
  resetExcludedAgentWarnings,
  mergeConfig,
  writeConfig,
} = require('../../scripts/update/lib/config-merger');
const { parseExcludedAgentsLocal } = require('../../scripts/audit/lib/installed-tree');

// ─────────────────────────────────────────────────────────────────
// T244. An operator who wrote `excluded_agents: review-coach` (a bare scalar) had the value
// rewritten to `[]`, the agent reinstalled with its skill wrapper, and nothing printed on stdout or
// stderr — measured on a real npm install. Five sites re-implemented the rule independently.
//
// The ruling: keep the operator's text, warn, do not apply. `parseExcludedAgents` is the authority;
// four of the five callers delegate to it, and the fifth is pinned here (see `parity`).
// ─────────────────────────────────────────────────────────────────

/** Every shape an operator can put in that field, including the ones that caused T244. */
const SHAPES = [
  ['absent', undefined, [], true],
  ['null', null, [], true],
  ['empty list', [], [], true],
  ['one id', ['review-coach'], ['review-coach'], true],
  ['two ids', ['review-coach', 'lens'], ['review-coach', 'lens'], true],
  ['bare scalar', 'review-coach', [], false],
  ['mapping', { 'review-coach': true }, [], false],
  ['number', 42, [], false],
  ['boolean', true, [], false],
  ['list with a number', ['review-coach', 42], ['review-coach'], false],
  ['list with a mapping', ['review-coach', { a: 1 }], ['review-coach'], false],
  ['list of only non-strings', [42, null], [], false],
];

describe('T244 — the authority for what excluded_agents means', () => {
  for (const [label, value, ids, conforming] of SHAPES) {
    it(`${label}: ids and conformance`, () => {
      resetExcludedAgentWarnings();
      const r = parseExcludedAgents(value);
      assert.deepEqual(r.ids, ids);
      assert.equal(r.conforming, conforming, `${label} should be ${conforming ? '' : 'non-'}conforming`);
    });
  }

  it('warns only for a non-conforming value, and only when given a source', () => {
    for (const [label, value, , conforming] of SHAPES) {
      resetExcludedAgentWarnings();
      const warned = [];
      const real = console.warn;
      console.warn = (...a) => warned.push(a.join(' '));
      try {
        parseExcludedAgents(value, { source: 'cfg.yaml' });
      } finally {
        console.warn = real;
      }
      assert.equal(warned.length, conforming ? 0 : 1, `${label}: expected ${conforming ? 0 : 1} warning`);
      if (!conforming) {
        assert.match(warned[0], /cfg\.yaml/, 'the warning must name the file the operator has to edit');
        assert.match(warned[0], /excluded_agents/, 'and the field');
        assert.match(warned[0], /NOT applied/, 'and that the opt-out did not take effect');
      }
    }
  });

  it('stays silent without a source, so audit and doctor callers do not print', () => {
    resetExcludedAgentWarnings();
    const warned = [];
    const real = console.warn;
    console.warn = (...a) => warned.push(a.join(' '));
    try {
      parseExcludedAgents('review-coach');
    } finally {
      console.warn = real;
    }
    assert.equal(warned.length, 0);
  });

  it('warns once per message, because two readers read the same file on one install', () => {
    resetExcludedAgentWarnings();
    const warned = [];
    const real = console.warn;
    console.warn = (...a) => warned.push(a.join(' '));
    try {
      parseExcludedAgents('review-coach', { source: 'a.yaml' });
      parseExcludedAgents('review-coach', { source: 'a.yaml' });
      parseExcludedAgents('review-coach', { source: 'b.yaml' });
    } finally {
      console.warn = real;
    }
    assert.equal(warned.length, 2, 'same file once; a different file is its own warning');
  });
});

describe('T244 — the one site that cannot delegate stays in step', () => {
  // `scripts/audit/lib/installed-tree.js` resolves js-yaml against the TARGET project so it can
  // audit an installation from outside the package, and `config-merger` statically requires
  // js-yaml, yaml and fs-extra. It keeps a local copy; this is what stops the two drifting.
  it('parity with the authority across every shape', () => {
    for (const [label, value, ids] of SHAPES) {
      assert.deepEqual(parseExcludedAgentsLocal(value), ids, `${label}: local copy disagrees`);
      assert.deepEqual(parseExcludedAgentsLocal(value), parseExcludedAgents(value).ids, label);
    }
  });

  it('the shape table is not empty and covers both conformance outcomes', () => {
    // Without this the parity loop above could pass vacuously on an emptied table.
    assert.ok(SHAPES.length >= 8, `expected a real shape table, got ${SHAPES.length}`);
    assert.ok(SHAPES.some(([, , , c]) => c), 'no conforming shape');
    assert.ok(SHAPES.some(([, , , c]) => !c), 'no non-conforming shape');
  });
});

describe('T244 — a non-conforming value is kept, not rewritten', () => {
  async function mergeWith(excluded) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't244-'));
    const p = path.join(dir, 'config.yaml');
    await fs.outputFile(p, yaml.dump({
      submodule_name: '_gyre', module: 'bme', user_name: 'Pat', excluded_agents: excluded,
    }), 'utf8');
    resetExcludedAgentWarnings();
    const real = console.warn;
    console.warn = () => {};
    let merged;
    try {
      merged = await mergeConfig(p, '9.9.9', {}, { submodule: '_gyre' });
      await writeConfig(p, merged);
    } finally {
      console.warn = real;
    }
    const onDisk = yaml.load(await fs.readFile(p, 'utf8'));
    await fs.remove(dir);
    return { merged, onDisk };
  }

  it('a bare scalar survives the merge verbatim', async () => {
    const { onDisk } = await mergeWith('review-coach');
    assert.equal(onDisk.excluded_agents, 'review-coach',
      'the operator\'s text was replaced — this is the T244 data loss');
  });

  it('a list holding a non-string survives verbatim', async () => {
    const { onDisk } = await mergeWith(['review-coach', 42]);
    assert.deepEqual(onDisk.excluded_agents, ['review-coach', 42],
      'the cleaned-up list was written back, destroying the entry the operator has to fix');
  });

  it('a conforming list is still normalised and applied', async () => {
    const { merged, onDisk } = await mergeWith(['review-coach']);
    assert.deepEqual(onDisk.excluded_agents, ['review-coach']);
    assert.ok(!merged.agents.includes('review-coach'), 'a conforming opt-out must still take effect');
  });

  it('the usable half of a non-conforming list is still honoured', async () => {
    const { merged } = await mergeWith(['review-coach', 42]);
    assert.ok(!merged.agents.includes('review-coach'),
      'a partial opt-out should apply to the ids that are usable');
  });
});

describe('T244 — no site re-implements the rule', () => {
  // The consolidation is the fix; a sixth copy appearing is the regression. Enumerated by file
  // with one named exemption, plus a floor so a renamed idiom cannot make this vacuous.
  const IDIOM = /Array\.isArray\([^)]*excluded_agents|excluded_agents[^\n]*\n?[^\n]*typeof a === 'string'/;
  const ALLOWED = new Set([
    'scripts/update/lib/config-merger.js',     // the authority itself
    'scripts/audit/lib/installed-tree.js',     // documented local copy, pinned by parity above
  ]);

  function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, out);
      else if (e.name.endsWith('.js')) out.push(p);
    }
    return out;
  }

  it('the coercion appears only in the authority and the one pinned copy', () => {
    const root = path.join(__dirname, '..', '..');
    const hits = walk(path.join(root, 'scripts'))
      .filter((p) => IDIOM.test(fs.readFileSync(p, 'utf8')))
      .map((p) => path.relative(root, p))
      .sort();
    assert.ok(hits.length >= 1, 'the idiom scan found nothing — it stopped matching, so it is vacuous');
    assert.deepEqual(hits.filter((h) => !ALLOWED.has(h)), [],
      'a new site re-implements what excluded_agents means; call parseExcludedAgents instead');
  });
});
