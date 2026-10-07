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
  it('parity with the authority across the enumerated shapes', () => {
    for (const [label, value, ids] of SHAPES) {
      assert.deepEqual(parseExcludedAgentsLocal(value), ids, `${label}: local copy disagrees`);
      assert.deepEqual(parseExcludedAgentsLocal(value), parseExcludedAgents(value).ids, label);
    }
  });

  it('the table still holds the shapes this row was reported for', () => {
    // A floor on COUNT let the four shapes T244 was actually reported for be deleted while eight
    // rows and both outcomes remained — green. Pinned by literal membership instead.
    // Including the CONTENT rows. Pinning only the five pre-existing labels left the table
    // cuttable to six rows while every drift they were added for passed — the count floor's hole,
    // one row over.
    for (const label of ['bare scalar', 'mapping', 'number', 'boolean', 'list with a number',
      'padded id', 'duplicate ids', 'empty-string id', 'mixed case', 'three ids']) {
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
    // Both this warning and the reader's parse-failure `catch` embed the full path, so checking the
    // path alone could not tell "your opt-out did not apply" from "the reader crashed".
    assert.match(warned[0], /NOT applied/, 'it must say the opt-out did not take effect');
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

describe('T244 — no unaugmented re-implementation under scripts/ (a floor, not a property)', () => {
  // The first version of this matched a text IDIOM. Measured: across 94 `.js` files under
  // `scripts/` it had exactly ONE hit — a JSDoc sentence in config-merger.js. It matched neither
  // the authority's real code nor the pinned copy's, so the `installed-tree.js` allow-list entry
  // was dead and the vacuity floor was held up by prose. A verbatim copy of the pinned function
  // evaded it, as did a local alias, `?.`/`??`, a four-line split, and the exact idiom in a `.cjs`,
  // an `.mjs`, or anywhere outside `scripts/`.
  //
  // WHAT THIS IS AND IS NOT. Three versions of this check have now been written. The first matched
  // a text idiom and had one hit across 94 files — a comment. The second matched the require PATH,
  // so any file importing `config-merger` for `mergeConfig` was exempt. This one matches the
  // authority's function names, and it is still a TEXT SEARCH: it catches a plain copy-paste
  // re-implementation under `scripts/`, which is the case that actually happens. It does NOT catch
  // a site that reaches the field without naming it (`cfg['excluded' + '_agents']`), that holds the
  // field name in a module outside `scripts/`, or that lives in a `.ts`/`.jsx` file or another
  // directory. Those are stated, not closed — a text search cannot close them, and widening the
  // pattern a fourth time is how the first two versions were born.
  // The MODULE is not the predicate: `config-merger` and `installed-tree` are both widely imported,
  // so matching the require path gave a free pass to any file that pulled in `mergeConfig` or
  // `declaredUnits` for something unrelated and then re-implemented the coercion anyway. An
  // exemption that broad launders exactly what it is meant to scope. Match the FUNCTION.
  const AUTHORITY_FNS = ['parseExcludedAgents', 'readExcludedAgents', 'parseExcludedAgentsLocal'];
  const usesAuthority = (src) => AUTHORITY_FNS.some((fn) => new RegExp(`\\b${fn}\\b`).test(src));

  /** Comments stripped, so a file that merely MENTIONS the field in prose is not an offender. */
  function liveCode(src) {
    // The block strip is ANCHORED to a line start. Unanchored, `['scripts/*', …]` and
    // `['*/node_modules']` in ordinary string literals formed a `/* … */` pair and the code between
    // them — including the field read — was deleted, so the file was skipped entirely.
    return src.replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, '').replace(/^\s*\/\/.*$/gm, '');
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
    const scanned = new Set();
    for (const p of walk(path.join(ROOT, 'scripts'))) {
      const src = fs.readFileSync(p, 'utf8');
      const rel = path.relative(ROOT, p);
      scanned.add(rel);
      if (!/excluded_agents|excludedAgents/.test(liveCode(src))) continue;
      // `liveCode`, not `src`: naming the authority in a COMMENT above a verbatim
      // re-implementation exempted the file and left the whole suite byte-identical.
      if (usesAuthority(liveCode(src))) continue;
      offenders.push(rel);
    }
    // Membership, not a count. A count floor that included the exempt files had zero slack and
    // reddened when `convoke-doctor` delegated MORE completely — punishing the improvement.
    for (const must of ['scripts/update/lib/config-merger.js', 'scripts/audit/lib/installed-tree.js']) {
      assert.ok(scanned.has(must), `the walk did not reach ${must} — the scan broke, so this is vacuous`);
    }
    assert.deepEqual(offenders, [],
      'this file decides what excluded_agents means without importing the authority; ' +
        'call configMerger.parseExcludedAgents instead');
  });

  it('the offender test can actually fail', () => {
    // A positive control over the predicate itself, not over the repo: the repo having zero
    // offenders is the desired state, so the repo cannot demonstrate that this can fire.
    const decidesWithoutAuthority = 'const ex = cfg.excluded_agents;\nif (!Array.isArray(ex)) return [];\n';
    assert.match(liveCode(decidesWithoutAuthority), /excluded_agents/, 'precondition');
    assert.ok(!usesAuthority(decidesWithoutAuthority),
      'a file like this must be classed as an offender, or the check is inert');
    // And the exemption must not be launderable by an unrelated import of the same module.
    const laundered = `const { declaredUnits } = require('../audit/lib/installed-tree');\n${decidesWithoutAuthority}`;
    assert.ok(!usesAuthority(laundered),
      'importing the module for an unrelated reason must not exempt a file from the rule');
  });
});

// ─────────────────────────────────────────────────────────────────
// T250. `conforming` is a predicate about TYPES, so a MISTYPED id satisfies it. Measured on a real
// install: `excluded_agents: [reviewcoach]` printed nothing and `review-coach` was installed with
// its skill wrapper — T244's complaint in its likelier form.
//
// Operator ruling 2026-10-07, following T244's: WARN in the installer and PROCEED, and an id
// belonging to the OTHER module counts as unknown. The roster check lives at `mergeConfig`'s call
// site, never in `parseExcludedAgents`, which must stay registry-free for doctor and installed-tree.
// ─────────────────────────────────────────────────────────────────

describe('T250 — a conforming but unknown agent id is no longer silent', () => {
  const { warnOnUnknownExclusions } = require('../../scripts/update/lib/config-merger');
  const { AGENT_IDS, GYRE_AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
  const GYRE = { agentIds: GYRE_AGENT_IDS };
  const SRC = '_bmad/bme/_gyre/config.yaml';

  /** Capture the one warning the check emits, if any. */
  function warned(ids, conforming = true, profile = GYRE, source = SRC) {
    resetExcludedAgentWarnings();
    const real = console.warn;
    let said = null;
    console.warn = (m) => { said = m; };
    try { warnOnUnknownExclusions(ids, conforming, profile, source); } finally { console.warn = real; }
    return said;
  }

  // The fixture is DERIVED: a literal "valid id" list here would rot the moment an agent is added
  // or renamed, which is the failure this repo keeps paying for.
  it('fixture: the ids used below really are and are not in the Gyre roster', () => {
    assert.ok(GYRE_AGENT_IDS.includes('review-coach'), 'review-coach must be a real Gyre id');
    assert.ok(!GYRE_AGENT_IDS.includes('reviewcoach'), 'reviewcoach must NOT be one');
    assert.ok(AGENT_IDS.includes('contextualization-expert'), 'the cross-module id must be a real Vortex id');
    assert.ok(!GYRE_AGENT_IDS.includes('contextualization-expert'), '...and not a Gyre one');
  });

  it('warns on a mistyped id, naming the file and the id', () => {
    const m = warned(['reviewcoach']);
    assert.ok(m, 'a mistyped id must not be silent — that is the whole defect');
    assert.match(m, /_bmad\/bme\/_gyre\/config\.yaml/, 'the operator has to be told WHICH file');
    assert.match(m, /"reviewcoach"/, 'and which id');
    assert.match(m, /no agent for/);
  });

  it('warns on an id that belongs to the other module, and says whose it is', () => {
    // The ruling's second half. "Unknown" alone reads as false to someone looking at an id they
    // know exists, so the message names the owner — the likeliest cause is a copied config.
    const m = warned(['contextualization-expert']);
    assert.ok(m);
    assert.match(m, /"contextualization-expert"/);
    assert.match(m, /_vortex/, 'naming the owning module is what makes this actionable');
  });

  it('stays silent when every id resolves, and when ids merely repeat', () => {
    assert.equal(warned(['review-coach']), null);
    assert.equal(warned([...GYRE_AGENT_IDS]), null, 'the whole roster is valid by construction');
    assert.equal(warned(['review-coach', 'review-coach']), null, 'a duplicate is benign — T250 says so');
  });

  it('names a repeated unknown id ONCE', () => {
    // Both halves matter. The dedupe is what keeps a hand-edited list of twenty copies of one typo
    // from producing twenty clauses — and asserting it with VALID duplicates proved nothing,
    // because `unknown` was empty either way and a mutant dropping the dedupe survived.
    const m = warned(['reviewcoach', 'reviewcoach', 'reviewcoach']);
    assert.ok(m);
    assert.equal((m.match(/"reviewcoach"/g) || []).length, 1,
      `a repeated unknown id must be named once; got: ${m}`);
  });

  it('does not warn a SECOND time about a non-conforming value', () => {
    // `parseExcludedAgents` has already warned about the shape. Two messages describing the same
    // field is the noise that trains an operator to skip both.
    //
    // The id here must be UNKNOWN. An earlier version passed `['review-coach']` — a VALID id — so
    // `unknown` was empty and the check returned early whatever the conforming guard did: the
    // fixture could not distinguish the guard from its deletion, and a mutant removing it survived.
    assert.equal(warned(['reviewcoach'], false), null,
      'a non-conforming value must not draw a second message about its contents');
    // ...and the same id DOES warn when the value is conforming, or the line above proves nothing.
    assert.ok(warned(['reviewcoach'], true), 'control: this id warns when the list conforms');
  });

  it('shows an empty entry rather than letting it vanish from the message', () => {
    const m = warned(['']);
    assert.ok(m);
    assert.match(m, /""/, 'an unquoted empty id leaves the operator reading a sentence about nothing');
  });

  it('lists THIS module\'s ids, so the operator can see the correct spelling', () => {
    const m = warned(['reviewcoach']);
    for (const id of GYRE_AGENT_IDS) assert.ok(m.includes(id), `the valid id ${id} must be offered`);
    // ...and not the other module's, which would be advice that does not apply here.
    assert.ok(!m.includes('contextualization-expert'));
  });

  it('caps a long list instead of emitting one enormous line', () => {
    // The sibling warning learned this: a 5000-entry list produced a 34k-character single line.
    const many = Array.from({ length: 50 }, (_, i) => `ghost-agent-${i}`);
    const m = warned(many);
    assert.match(m, /and 42 more/, '50 unknown ids must collapse to 8 named plus a count');
    assert.ok(m.length < 2000, `the message is ${m.length} characters`);
  });

  it('is WIRED into mergeConfig, not merely exported', async () => {
    // Without this, deleting the call site leaves every test above green and the defect restored.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't250-wired-'));
    const p = path.join(dir, 'config.yaml');
    await fs.outputFile(p, yaml.dump({
      submodule_name: '_gyre', module: 'bme', user_name: 'Pat', excluded_agents: ['reviewcoach'],
    }), 'utf8');
    resetExcludedAgentWarnings();
    const real = console.warn;
    const said = [];
    console.warn = (m) => said.push(m);
    try {
      await mergeConfig(p, '9.9.9', {}, { submodule: '_gyre' });
    } finally {
      console.warn = real;
      await fs.remove(dir);
    }
    assert.ok(said.some((m) => /"reviewcoach"/.test(m)),
      `mergeConfig did not surface the unknown id; it said: ${JSON.stringify(said)}`);
  });

  it('still applies the ids that DO resolve when the list is mixed', async () => {
    // The ruling is "warn and proceed", so the valid half of a mixed list must keep working.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't250-mixed-'));
    const p = path.join(dir, 'config.yaml');
    await fs.outputFile(p, yaml.dump({
      submodule_name: '_gyre', module: 'bme', user_name: 'Pat',
      excluded_agents: ['review-coach', 'reviewcoach'],
    }), 'utf8');
    resetExcludedAgentWarnings();
    const real = console.warn;
    console.warn = () => {};
    let merged;
    try {
      merged = await mergeConfig(p, '9.9.9', {}, { submodule: '_gyre' });
    } finally {
      console.warn = real;
      await fs.remove(dir);
    }
    assert.ok(Array.isArray(merged.agents), 'merge produced no agents array');
    assert.ok(!merged.agents.includes('review-coach'), 'the VALID exclusion must still take effect');
    assert.deepEqual(merged.excluded_agents, ['review-coach', 'reviewcoach'],
      'and the operator\'s list is kept as written, unknown entry included');
  });
});
