'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');

const { removeTempDirSync } = require('../helpers');
const {
  loadSpec,
  initContext,
  readContext,
  recordContext,
  writeAtomic,
} = require('../../_bmad/bme/_team-factory/lib/utils/run-context');

// tfr-1-1 (T136). The transport that replaces JSON-into-a-shell-string.

const tmpDirs = [];
function tmp() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'tfr-run-ctx-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) removeTempDirSync(tmpDirs.pop());
});

/**
 * A spec `parseSpec` accepts.
 *
 * Shaped from `tests/team-factory/fixtures/test-team-spec.yaml` — the module's
 * canonical example — rather than assembled field by field. The fixture is
 * Sequential and carries contracts; this is the Independent variant, which needs
 * neither. Copied rather than loaded so a test can mutate one field without
 * touching a fixture five other suites share.
 */
function writeSpec(dir, overrides = {}) {
  const spec = Object.assign({
    schema_version: '1.0',
    team_name: 'Probe Team',
    team_name_kebab: 'probe-team',
    composition_pattern: 'Independent',
    created: '2026-09-14',
    factory_version: '1.0',
    discovery_path: 'unknown',
    description: 'A probe team',
    decisions: [],
    agents: [
      { id: 'probe-one', role: 'Probes things', capabilities: ['probing'], overlap_acknowledgments: [] },
    ],
    integration: { output_directory: '_bmad-output/probe-team-artifacts' },
    progress: { route: 'complete', scope: 'complete', connect: 'complete', review: 'complete', generate: 'pending' },
  }, overrides);
  const p = path.join(dir, 'team-spec-probe-team.yaml');
  fs.writeFileSync(p, yaml.dump(spec), 'utf8');
  return p;
}

describe('loadSpec — the spec arrives by path, never by interpolation', () => {
  it('parses a spec file and returns the spec object', async () => {
    const dir = tmp();
    const spec = await loadSpec(writeSpec(dir));
    assert.equal(spec.team_name_kebab, 'probe-team');
    assert.equal(spec.agents.length, 1);
  });

  it('survives a description containing BOTH quote characters', async () => {
    // The case T136 is filed on. Through the old transport this string could not
    // reach node at all; through a file it is just data.
    const dir = tmp();
    const nasty = `He said "go" — it's fine`;
    const spec = await loadSpec(writeSpec(dir, { description: nasty }));
    assert.equal(spec.description, nasty, 'both quote characters survive the round trip');
  });

  it('throws, naming the file, when the spec is invalid', async () => {
    const dir = tmp();
    const p = path.join(dir, 'team-spec-bad.yaml');
    fs.writeFileSync(p, yaml.dump({ team_name: 'no kebab, no agents' }), 'utf8');
    await assert.rejects(() => loadSpec(p), err => {
      assert.match(err.message, /not usable/);
      assert.ok(err.message.includes(p), 'the message names the path the caller passed');
      return true;
    });
  });

  it('throws when the file does not exist', async () => {
    await assert.rejects(() => loadSpec(path.join(tmp(), 'absent.yaml')), /not usable|Cannot read/);
  });

  it('rejects a non-path argument rather than parsing undefined', async () => {
    for (const bad of [undefined, null, '', '   ', 42, {}]) {
      await assert.rejects(() => loadSpec(bad), /needs a path/);
    }
  });
});

describe('initContext', () => {
  it('creates the file and its parent directory', () => {
    const p = path.join(tmp(), 'nested', 'deeper', 'ctx.json');
    initContext(p, { module_root: '/x' });
    assert.ok(fs.existsSync(p));
    assert.deepEqual(JSON.parse(fs.readFileSync(p, 'utf8')), { module_root: '/x' });
  });

  it('replaces a previous run rather than merging into it', () => {
    const p = path.join(tmp(), 'ctx.json');
    initContext(p, { stale_path: '/from/an/abandoned/run' });
    initContext(p, { module_root: '/fresh' });
    const ctx = readContext(p);
    assert.equal(ctx.module_root, '/fresh');
    assert.ok(!('stale_path' in ctx), 'a stale path would reach the abort manifest as a removal target');
  });

  it('defaults to an empty object', () => {
    const p = path.join(tmp(), 'ctx.json');
    assert.deepEqual(initContext(p), {});
  });

  it('rejects a non-object seed', () => {
    const p = path.join(tmp(), 'ctx.json');
    for (const bad of [[], 'x', 42, null]) {
      assert.throws(() => initContext(p, bad), /must be an object/);
    }
  });
});

describe('readContext — absence is loud, never an empty object', () => {
  it('reads back what was written', () => {
    const p = path.join(tmp(), 'ctx.json');
    initContext(p, { a: 1, nested: { b: [2, 3] } });
    assert.deepEqual(readContext(p), { a: 1, nested: { b: [2, 3] } });
  });

  it('THROWS when the context file is absent', () => {
    // The load-bearing case. Returning {} here would make a correctly generated
    // team fail validation, which is what step-05's own caveat describes.
    const p = path.join(tmp(), 'never-written.json');
    assert.throws(() => readContext(p), err => {
      assert.match(err.message, /generation context not found/);
      assert.ok(err.message.includes(p), 'names the missing file');
      assert.match(err.message, /step-04/, 'says where it comes from');
      assert.match(err.message, /empty context makes a correct team fail/, 'says why {} is not the answer');
      return true;
    });
  });

  it('throws on a JSON array, which is not a context', () => {
    const p = path.join(tmp(), 'ctx.json');
    fs.writeFileSync(p, '[1,2,3]', 'utf8');
    assert.throws(() => readContext(p), /not a JSON object/);
  });

  it('throws on unparseable content rather than returning a default', () => {
    const p = path.join(tmp(), 'ctx.json');
    fs.writeFileSync(p, '{ truncated', 'utf8');
    assert.throws(() => readContext(p), /not a JSON object/);
  });
});

describe('recordContext — what the expect: lines call', () => {
  it('merges a key without disturbing the others', () => {
    const p = path.join(tmp(), 'ctx.json');
    initContext(p, { module_root: '/m', agent_files: ['/a.md'] });
    recordContext(p, 'output_directory_path', '/m/out');
    const ctx = readContext(p);
    assert.equal(ctx.output_directory_path, '/m/out');
    assert.equal(ctx.module_root, '/m', 'existing keys survive');
    assert.deepEqual(ctx.agent_files, ['/a.md']);
  });

  it('stores a whole object, which is what §5c and §5d record', () => {
    const p = path.join(tmp(), 'ctx.json');
    initContext(p);
    const whole = { valid: true, results: [{ agent: 'a', errors: [] }] };
    recordContext(p, 'activation_validation_results', whole);
    assert.deepEqual(readContext(p).activation_validation_results, whole);
  });

  it('overwrites a key on a re-run rather than appending', () => {
    const p = path.join(tmp(), 'ctx.json');
    initContext(p);
    recordContext(p, 'k', 'first');
    recordContext(p, 'k', 'second');
    assert.equal(readContext(p).k, 'second');
  });

  it('throws when the context has not been initialised', () => {
    assert.throws(() => recordContext(path.join(tmp(), 'absent.json'), 'k', 'v'), /not found/);
  });

  it('rejects an empty key', () => {
    const p = path.join(tmp(), 'ctx.json');
    initContext(p);
    for (const bad of [undefined, null, '', '  ', 7]) {
      assert.throws(() => recordContext(p, bad, 'v'), /needs a key/);
    }
  });
});

describe('writeAtomic', () => {
  it('leaves no temp file behind on success', () => {
    const dir = tmp();
    const p = path.join(dir, 'ctx.json');
    writeAtomic(p, { a: 1 });
    const leftovers = fs.readdirSync(dir).filter(f => f.endsWith('.tmp'));
    assert.deepEqual(leftovers, [], 'no .tmp survives a successful write');
  });

  it('does not truncate the target when the write fails', () => {
    const dir = tmp();
    const p = path.join(dir, 'ctx.json');
    writeAtomic(p, { good: true });
    // A value JSON.stringify cannot serialise: the temp write throws before any
    // rename, so the existing target must be untouched rather than truncated.
    const circular = {};
    circular.self = circular;
    assert.throws(() => writeAtomic(p, circular));
    assert.deepEqual(JSON.parse(fs.readFileSync(p, 'utf8')), { good: true }, 'previous context survives');
  });
});
