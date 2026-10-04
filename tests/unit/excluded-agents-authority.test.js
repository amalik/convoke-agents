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
  readExcludedAgents,
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
  // Content classes, not shape classes. The copy nobody imports is most likely to drift by
  // "helpful cleanup", and with shape rows alone a trim, a dedupe, an empty-string drop, a case
  // fold and a truncation all passed parity.
  ['padded id', ['  review-coach  '], ['  review-coach  '], true],
  ['duplicate ids', ['lens', 'lens'], ['lens', 'lens'], true],
  ['empty-string id', [''], [''], true],
  ['mixed case', ['Review-Coach'], ['Review-Coach'], true],
  ['three ids', ['scout', 'atlas', 'lens'], ['scout', 'atlas', 'lens'], true],
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

  it('the table still holds the shapes this row was reported for', () => {
    // A floor on COUNT let the four shapes T244 was actually reported for be deleted while eight
    // rows and both outcomes remained — green. Pinned by literal membership instead.
    for (const label of ['bare scalar', 'mapping', 'number', 'boolean', 'list with a number']) {
      assert.ok(SHAPES.some(([l]) => l === label), `the "${label}" shape must stay in the table`);
    }
    assert.ok(SHAPES.some(([, , , c]) => c), 'no conforming shape');
    assert.ok(SHAPES.some(([, , , c]) => !c), 'no non-conforming shape');
  });
});

describe('T244 — readExcludedAgents warns too, not just mergeConfig', () => {
  // Dropping `{ source: configPath }` from this call reddened nothing and left the full suite
  // byte-identical to baseline. The operator saw one line anyway only because `refreshInstallation`
  // also calls `mergeConfig` on the same file in the same process and `warnOnce` dedupes —
  // incidental coupling. `validator.js` and `agent-manifest-generator.js` call this with no merge
  // behind them at all.
  it('names the file when the value is non-conforming', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't244r-'));
    const p = path.join(dir, 'config.yaml');
    await fs.outputFile(p, 'submodule_name: _gyre\nexcluded_agents: review-coach\n', 'utf8');
    resetExcludedAgentWarnings();
    const warned = [];
    const real = console.warn;
    console.warn = (...a) => warned.push(a.join(' '));
    let ids;
    try {
      ids = readExcludedAgents(p);
    } finally {
      console.warn = real;
    }
    await fs.remove(dir);
    assert.deepEqual(ids, [], 'a bare scalar yields no exclusions');
    assert.equal(warned.length, 1, 'readExcludedAgents must warn on its own, not rely on mergeConfig');
    assert.ok(warned[0].includes(p), 'the warning must name the file the operator has to edit');
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

  it('a conforming list is written back and applied', async () => {
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

describe('T244 — no site decides what excluded_agents means on its own', () => {
  // The first version of this matched a text IDIOM. Measured: across 94 `.js` files under
  // `scripts/` it had exactly ONE hit — a JSDoc sentence in config-merger.js. It matched neither
  // the authority's real code nor the pinned copy's, so the `installed-tree.js` allow-list entry
  // was dead and the vacuity floor was held up by prose. A verbatim copy of the pinned function
  // evaded it, as did a local alias, `?.`/`??`, a four-line split, and the exact idiom in a `.cjs`,
  // an `.mjs`, or anywhere outside `scripts/`.
  //
  // The question is not "does this text appear" but "does any file other than the authority and
  // the pinned copy decide this". That is a property of imports, so it is checked as one. It fails
  // closed: a sixth site has to mention `excluded_agents` in live code to do its job at all.
  const ALLOWED = new Set([
    'scripts/update/lib/config-merger.js',   // the authority
    'scripts/audit/lib/installed-tree.js',   // documented copy, pinned by parity above
  ]);
  const IMPORTS_AUTHORITY = /require\(\s*['"][^'"]*(config-merger|installed-tree)/;

  /** Comments stripped, so a file that merely MENTIONS the field in prose is not an offender. */
  function liveCode(src) {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  }

  function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, out);
      else if (/\.(js|cjs|mjs)$/.test(e.name)) out.push(p);
    }
    return out;
  }

  const ROOT = path.join(__dirname, '..', '..');

  it('every file that works with excluded_agents goes through the authority', () => {
    const offenders = [];
    let considered = 0;
    for (const p of walk(path.join(ROOT, 'scripts'))) {
      const src = fs.readFileSync(p, 'utf8');
      if (!/excluded_agents|excludedAgents/.test(liveCode(src))) continue;
      considered += 1;
      const rel = path.relative(ROOT, p);
      if (ALLOWED.has(rel) || IMPORTS_AUTHORITY.test(src)) continue;
      offenders.push(rel);
    }
    assert.ok(considered >= 3,
      `only ${considered} file(s) touch excluded_agents in live code — the scan broke, so this is vacuous`);
    assert.deepEqual(offenders, [],
      'this file decides what excluded_agents means without importing the authority; ' +
        'call configMerger.parseExcludedAgents instead');
  });

  it('the allow-list has no dead entries', () => {
    // The previous guard exempted a file it could not even see. An exemption that matches nothing
    // launders exactly what it is supposed to scope.
    for (const rel of ALLOWED) {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      assert.match(liveCode(src), /excluded_agents|excludedAgents/,
        `${rel} is exempted but does not work with excluded_agents in live code — drop the entry`);
    }
  });

  it('the offender test can actually fail', () => {
    // A positive control over the predicate itself, not over the repo: the repo having zero
    // offenders is the desired state, so the repo cannot demonstrate that this can fire.
    const decidesWithoutAuthority = 'const ex = cfg.excluded_agents;\nif (!Array.isArray(ex)) return [];\n';
    assert.match(liveCode(decidesWithoutAuthority), /excluded_agents/, 'precondition');
    assert.ok(!IMPORTS_AUTHORITY.test(decidesWithoutAuthority),
      'a file like this must be classed as an offender, or the check is inert');
  });
});
