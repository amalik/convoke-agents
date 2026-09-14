'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { removeTempDirSync } = require('../helpers');

const {
  audit,
  scanText,
  workflowFiles,
  OBJECT_PLACEHOLDERS,
  ELLIPSIS_RE,
  RUN_LINE_RE,
} = require('../../scripts/audit/run-block-transport');

// tfr-1-1 (T136). Logic-only coverage against fixtures; the live read over the
// real workflow files is `scripts/audit/run-block-transport.js` run as a CLI,
// which `project-context.md` rule `test-fixture-isolation` keeps out of here.

const tmpDirs = [];
function tmpTree() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'tfr-run-block-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) removeTempDirSync(tmpDirs.pop());
});

// A payload that is CORRECT and must never be reported. Both halves matter:
// an authored object literal whose values are quoted strings pastes fine, and
// the first version of this detector flagged exactly this shape.
const CLEAN_AUTHORED_OBJECT =
  `run: node -e "const n = require('{project-root}/x.js'); const id = '{agent_id}'; console.log(JSON.stringify({ valid: /^[a-z]+$/.test(id), id }))"`;

const CLEAN_PATH_TRANSPORT =
  `run: node -e "const rc = require('{project-root}/rc.js'); rc.loadSpec('{spec_path}').then(s => console.log(JSON.stringify(s)))"`;

describe('run-block-transport — what counts as a defect', () => {
  it('reports an interpolated object placeholder', () => {
    const line = `run: node -e "const cc = require('{project-root}/cc.js'); cc.createConfig({spec_data}, 'x')"`;
    const f = scanText(line, 'step.md');
    assert.equal(f.length, 1);
    assert.match(f[0].reason, /\{spec_data\}/);
    assert.equal(f[0].line, 1);
  });

  it('reports EVERY object placeholder on one line, not just the first', () => {
    const line = `run: node -e "v.validateTeam({spec_data}, {generation_context}, '{project-root}')"`;
    const f = scanText(line, 'step.md');
    // Two distinct placeholders on one block — a detector that stops at the
    // first would under-report and let the second survive a fix of the first.
    assert.equal(f.length, 2);
    const reported = f.map(x => x.reason).join(' ');
    assert.match(reported, /\{spec_data\}/);
    assert.match(reported, /\{generation_context\}/);
  });

  it('reports a literal ellipsis, which cannot parse as JavaScript', () => {
    const line = `run: node -e "cd.detectCollisions({team_name_kebab: '{kebab}', agents: [{id: '{id1}'}, ...]}, 'x')"`;
    const f = scanText(line, 'step.md');
    assert.equal(f.length, 1);
    assert.match(f[0].reason, /ellipsis/);
  });

  it('does NOT report an authored object literal whose values are quoted strings', () => {
    // The discriminating case. This block is correct and pastes fine; the
    // detector's first version flagged it, which is why this test exists.
    assert.deepEqual(scanText(CLEAN_AUTHORED_OBJECT, 'step.md'), []);
  });

  it('does NOT report a block that passes a path instead of an object', () => {
    assert.deepEqual(scanText(CLEAN_PATH_TRANSPORT, 'step.md'), []);
  });

  it('ignores lines that are not `run: node -e` blocks', () => {
    const prose = `The placeholder {spec_data} is the parsed spec, and [{id: 'x'}, ...] is illustrative.`;
    assert.deepEqual(scanText(prose, 'step.md'), []);
  });

  it('ignores a `run:` line that is not node -e', () => {
    assert.deepEqual(scanText(`run: bash scripts/thing.sh {spec_data}`, 'step.md'), []);
  });
});

describe('run-block-transport — the placeholder list is the contract', () => {
  it('names exactly the three object-valued placeholders', () => {
    // Pinned by literal membership rather than by length: a list rebuilt from
    // the files under test would be blind to a deletion.
    assert.ok(OBJECT_PLACEHOLDERS.includes('{spec_data}'));
    assert.ok(OBJECT_PLACEHOLDERS.includes('{generation_context}'));
    assert.ok(OBJECT_PLACEHOLDERS.includes('{agent_file_paths}'));
    assert.equal(OBJECT_PLACEHOLDERS.length, 3);
  });

  it('does not treat a scalar placeholder as an object', () => {
    for (const scalar of ['{project-root}', '{module_root}', '{config_path}', '{registry_path}', '{team_name_kebab}']) {
      assert.ok(!OBJECT_PLACEHOLDERS.includes(scalar), `${scalar} must stay scalar`);
    }
  });
});

describe('run-block-transport — file discovery', () => {
  it('walks nested workflow directories, not just the top level', () => {
    const root = tmpTree();
    const nested = path.join(root, '_bmad/bme/_team-factory/workflows/add-team');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, 'step-01.md'), CLEAN_PATH_TRANSPORT);
    fs.writeFileSync(path.join(root, '_bmad/bme/_team-factory/workflows/route.md'), '# top level');

    const found = workflowFiles(root).map(f => path.relative(root, f));
    assert.ok(found.some(f => f.endsWith('add-team/step-01.md')), 'nested file must be found');
    assert.ok(found.some(f => f.endsWith('workflows/route.md')), 'top-level file must be found');
  });

  it('returns empty rather than throwing when the tree is absent', () => {
    assert.deepEqual(workflowFiles(tmpTree()), []);
  });
});

describe('run-block-transport — audit()', () => {
  it('counts run blocks and reports none for a clean tree', () => {
    const root = tmpTree();
    const dir = path.join(root, '_bmad/bme/_team-factory/workflows/add-team');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'a.md'), `${CLEAN_PATH_TRANSPORT}\n${CLEAN_AUTHORED_OBJECT}\n`);

    const r = audit(root);
    assert.equal(r.runBlocks, 2, 'both blocks counted');
    assert.deepEqual(r.findings, [], 'clean tree reports nothing');
  });

  it('reports a defect and names the file it came from', () => {
    const root = tmpTree();
    const dir = path.join(root, '_bmad/bme/_team-factory/workflows/add-team');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'bad.md'), `# heading\n\nrun: node -e "x.y({spec_data})"\n`);

    const r = audit(root);
    assert.equal(r.findings.length, 1);
    assert.equal(r.findings[0].file, path.join('_bmad/bme/_team-factory/workflows/add-team', 'bad.md'));
    assert.equal(r.findings[0].line, 3, 'line number is 1-indexed and points at the run block');
  });
});

describe('run-block-transport — regexes are anchored as claimed', () => {
  it('RUN_LINE_RE requires the line to START with run:', () => {
    assert.ok(RUN_LINE_RE.test('run: node -e "x"'));
    assert.ok(!RUN_LINE_RE.test('  run: node -e "x"'), 'indented example inside prose is not a block');
    assert.ok(!RUN_LINE_RE.test('then run: node -e "x"'));
  });

  it('ELLIPSIS_RE matches only a trailing ellipsis element', () => {
    assert.ok(ELLIPSIS_RE.test(`[{id: 'a'}, ...]`));
    assert.ok(ELLIPSIS_RE.test(`{a: 1, ...}`));
    assert.ok(!ELLIPSIS_RE.test(`const x = {...spread}`), 'a spread operator is valid JavaScript');
    assert.ok(!ELLIPSIS_RE.test(`"a sentence ... with an ellipsis"`));
  });
});
