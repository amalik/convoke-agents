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

  /**
   * Every warning the check emits, in order.
   *
   * An earlier version kept only the LAST message (`said = m`), so no assertion in this block
   * could notice a duplicated or extra line — a mutant that emitted a second bogus `warnOnce`
   * before the real one survived the whole suite. Collecting them makes "exactly one message" an
   * assertable property.
   */
  function warnings(ids, conforming = true, profile = GYRE, source = SRC) {
    resetExcludedAgentWarnings();
    const real = console.warn;
    const said = [];
    console.warn = (m) => { said.push(m); };
    try { warnOnUnknownExclusions(ids, conforming, profile, source); } finally { console.warn = real; }
    return said;
  }

  /** The single warning, asserting that there is exactly one — or null when silent. */
  function warned(ids, conforming = true, profile = GYRE, source = SRC) {
    const said = warnings(ids, conforming, profile, source);
    assert.ok(said.length <= 1, `expected at most one message; got ${said.length}: ${JSON.stringify(said)}`);
    return said.length === 1 ? said[0] : null;
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
    assert.match(m, /no agent this module knows about/);
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

  // THE LIKELIEST REAL INPUT, and the block had no assertion for it: a valid id plus a typo. R2
  // found a mutant that warns only when EVERY id is unknown, and it survived the entire suite —
  // which is T250's measured defect restored, because every other fixture here passes an
  // all-unknown list and the one mixed fixture silenced `console.warn`.
  it('warns on a MIXED list, naming only the id that does not resolve', () => {
    const m = warned(['review-coach', 'reviewcoach']);
    assert.ok(m, 'a valid id alongside a typo must still warn about the typo');
    assert.match(m, /"reviewcoach"/);
    // The valid id must NOT be reported as unknown. Asserted on the unknown-list clause rather
    // than the whole message, because the message also lists the module's valid ids — among
    // which `review-coach` legitimately appears.
    const clause = m.slice(0, m.indexOf('Nothing was excluded'));
    assert.ok(!clause.includes('"review-coach"'),
      `a resolving id must not be named as unknown; clause was: ${clause}`);
  });

  it('tells the operator what did and did not happen, not just which id is wrong', () => {
    // The actionable half. Unasserted before, so a mutant deleting it survived.
    const m = warned(['reviewcoach']);
    // The message no longer asserts "Nothing was excluded for it" — measurement showed that is
    // false for a user-added agent, whose exclusion does take effect. What it must still say is
    // what to do and that the rest of the list stands.
    assert.match(m, /Check the spelling/, 'the operator needs an action, not just a diagnosis');
    assert.match(m, /any other id in the list still applies/, '...and that the rest of the list stands');
    assert.doesNotMatch(m, /Nothing was excluded for/,
      'that claim was false for a user-added agent and must not come back');
    // Singular vs plural, since the sentence reads wrongly if it does not agree.
    // Subject AND verb must agree. Widening the sentence for the user-added-agent ruling left
    // `names an id that MATCH no agent`, which the first run showed immediately.
    assert.match(m, /names an id that matches no agent/, 'one unknown id reads "an id that matches"');
    assert.match(warned(['reviewcoach', 'modelcurator']), /names ids that match no agent/,
      'two read "ids that match"');
    assert.doesNotMatch(m, /an id that match /, 'singular subject with a plural verb');
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
    // THE PROPERTY, counted. `m.length < 2000` was inert: the uncapped message for this fixture
    // measures 1152 characters, so the threshold passed with the cap deleted and the regex above
    // was doing all the work. At 5000 entries the uncapped line is ~99k characters, which is the
    // hazard being guarded — so the thing to assert is how many ids are NAMED, not a byte count
    // three orders of magnitude away from it.
    assert.equal((m.match(/"ghost-agent-\d+"/g) || []).length, 8,
      `at most 8 ids may be named; the message names ${(m.match(/"ghost-agent-\d+"/g) || []).length}`);
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
    const said = [];
    console.warn = (m) => said.push(m);
    let merged;
    try {
      merged = await mergeConfig(p, '9.9.9', {}, { submodule: '_gyre' });
    } finally {
      console.warn = real;
      await fs.remove(dir);
    }
    // CAPTURED, not silenced. Discarding the output here is what let the mixed-list mutant
    // survive: this was the block's only mixed fixture and it threw the message away.
    assert.ok(said.some((m) => /"reviewcoach"/.test(m)),
      `the unknown half of a mixed list must still be reported; got: ${JSON.stringify(said)}`);
    assert.ok(Array.isArray(merged.agents), 'merge produced no agents array');
    assert.ok(!merged.agents.includes('review-coach'), 'the VALID exclusion must still take effect');
    assert.deepEqual(merged.excluded_agents, ['review-coach', 'reviewcoach'],
      'and the operator\'s list is kept as written, unknown entry included');
  });
});

// ─────────────────────────────────────────────────────────────────
// T250 Round 2. The warning was wired into `mergeConfig` ONLY, and three other readers honour or
// report exclusions without passing through it — measured: `convoke-doctor` affirmed a typo as an
// exclusion (`4 agents present (1 excluded: reviewcoach)` against a 4-agent roster, with
// `review-coach` installed and its wrapper present), `refreshInstallation` in a same-root tree
// applies exclusions with both `mergeConfig` calls skipped, and `generate:manifest` drops rows by
// a route that never merges. The split now lives in `partitionExclusions`, which every roster-
// having caller uses, and `readExcludedAgents` reports when given a profile.
// ─────────────────────────────────────────────────────────────────

describe('T250 R2 — one definition of "unknown", shared by every reader', () => {
  const {
    partitionExclusions, MODULE_PROFILES,
  } = require('../../scripts/update/lib/config-merger');
  const { GYRE_AGENT_IDS } = require('../../scripts/update/lib/agent-registry');

  it('splits a list into the ids the module has and the ids it does not', () => {
    const r = partitionExclusions(['review-coach', 'reviewcoach'], GYRE_AGENT_IDS);
    assert.deepEqual(r.known, ['review-coach']);
    assert.deepEqual(r.unknown, ['reviewcoach']);
  });

  it('keeps duplicates in `known` and dedupes `unknown`', () => {
    // `known` feeds filtering, where a duplicate is harmless and order matters; `unknown` feeds a
    // message, where a duplicate is noise. The asymmetry is deliberate, so it is pinned.
    const r = partitionExclusions(['review-coach', 'review-coach', 'xx', 'xx'], GYRE_AGENT_IDS);
    assert.deepEqual(r.known, ['review-coach', 'review-coach']);
    assert.deepEqual(r.unknown, ['xx']);
  });

  it('treats an absent or empty roster as "nothing is known"', () => {
    assert.deepEqual(partitionExclusions(['review-coach'], []).unknown, ['review-coach']);
    assert.deepEqual(partitionExclusions(['review-coach'], undefined).unknown, ['review-coach']);
    assert.deepEqual(partitionExclusions(undefined, GYRE_AGENT_IDS), { known: [], unknown: [] });
  });

  it('readExcludedAgents REPORTS an unknown id when given a profile, and stays silent without one', async () => {
    // The registry-free default is load-bearing: `convoke-doctor` and `installed-tree.js` read this
    // field with no roster in scope and must not be made to warn.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't250r2-read-'));
    const p = path.join(dir, 'config.yaml');
    await fs.outputFile(p, yaml.dump({ excluded_agents: ['reviewcoach'] }), 'utf8');
    const capture = (opts) => {
      resetExcludedAgentWarnings();
      const real = console.warn;
      const said = [];
      console.warn = (m) => said.push(m);
      try { readExcludedAgents(p, opts); } finally { console.warn = real; }
      return said;
    };
    try {
      assert.deepEqual(capture(undefined), [], 'no profile: the reader must stay registry-free');
      const withProfile = capture({ profile: MODULE_PROFILES._gyre });
      assert.equal(withProfile.length, 1,
        `exactly one message; got ${JSON.stringify(withProfile)}`);
      assert.match(withProfile[0], /"reviewcoach"/);
      // The SOURCE, which was unbound: a wiring passing the wrong path survived.
      assert.ok(withProfile[0].includes(p), 'the message must name the file that was read');
    } finally { await fs.remove(dir); }
  });

  // WHICH PROFILE a caller passes was bound by nothing, because every wiring fixture used
  // `reviewcoach` — unknown to BOTH modules, so the expected output is identical whether the
  // caller passes the right profile or the wrong one. Mutants that hardcoded `_vortex` at the
  // `mergeConfig` site and at the read pass-through both survived. `contextualization-expert`
  // is the discriminator: a real Vortex agent, unknown to Gyre.
  it('reports a cross-module id for the module that does NOT own it, and not for the one that does', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't250r3-which-'));
    const p = path.join(dir, 'config.yaml');
    await fs.outputFile(p, yaml.dump({ excluded_agents: ['contextualization-expert'] }), 'utf8');
    const capture = (profile) => {
      resetExcludedAgentWarnings();
      const real = console.warn;
      const said = [];
      console.warn = (m) => said.push(m);
      try { readExcludedAgents(p, { profile }); } finally { console.warn = real; }
      return said;
    };
    try {
      assert.equal(capture(MODULE_PROFILES._gyre).length, 1,
        'Gyre does not own this agent, so reading Gyre\'s config must report it');
      assert.deepEqual(capture(MODULE_PROFILES._vortex), [],
        'Vortex DOES own it, so the same id in Vortex\'s config is a legitimate opt-out');
    } finally { await fs.remove(dir); }
  });

  it('does not double-report a NON-CONFORMING value on the read path', async () => {
    // `conforming` was passed through but unbound: hardcoding `true` survived, which would give
    // the operator two messages about one field on the three paths that APPLY exclusions.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't250r3-nc-'));
    const p = path.join(dir, 'config.yaml');
    await fs.outputFile(p, yaml.dump({ excluded_agents: ['reviewcoach', 42] }), 'utf8');
    resetExcludedAgentWarnings();
    const real = console.warn;
    const said = [];
    console.warn = (m) => said.push(m);
    try { readExcludedAgents(p, { profile: MODULE_PROFILES._gyre }); } finally {
      console.warn = real;
      await fs.remove(dir);
    }
    assert.equal(said.filter((m) => /no agent this module knows about/.test(m)).length, 0,
      `a malformed value must draw the shape message only; got ${JSON.stringify(said)}`);
    assert.equal(said.length, 1, 'and exactly one message in total');
  });

  it('readExcludedAgents returns IDENTICAL ids with and without a profile', async () => {
    // The name used to claim this and the body asserted something else entirely — a
    // `partitionExclusions` call, duplicating an earlier test — so the invariant it names was
    // bound by nothing: making the reader return `[]`, or only the `known` half, when a profile
    // was passed survived the whole suite. That second one is the live hazard, because three
    // callers FILTER on this return value and a non-conforming list's usable ids would vanish.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 't250r3-ret-'));
    const quiet = (fn) => {
      resetExcludedAgentWarnings();
      const real = console.warn;
      console.warn = () => {};
      try { return fn(); } finally { console.warn = real; }
    };
    try {
      const CASES = [
        ['a valid id', { excluded_agents: ['review-coach'] }],
        ['a typo', { excluded_agents: ['reviewcoach'] }],
        ['mixed', { excluded_agents: ['review-coach', 'reviewcoach'] }],
        ['a bare scalar', { excluded_agents: 'review-coach' }],
        ['a list holding a number', { excluded_agents: ['review-coach', 42] }],
        ['absent', { user_name: 'Pat' }],
      ];
      for (const [label, doc] of CASES) {
        const p = path.join(dir, 'config.yaml');
        await fs.outputFile(p, yaml.dump(doc), 'utf8');
        const without = quiet(() => readExcludedAgents(p));
        const withIt = quiet(() => readExcludedAgents(p, { profile: MODULE_PROFILES._gyre }));
        assert.deepEqual(withIt, without,
          `${label}: the profile changed the RETURN value, which three callers filter on`);
      }
    } finally { await fs.remove(dir); }
  });
});
