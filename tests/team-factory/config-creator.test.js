const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { createConfig, detectCollisions, deriveWorkflowNames, toKebab, buildConfigData, ensureOutputDirectory } = require('../../_bmad/bme/_team-factory/lib/writers/config-creator');

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'test-team-spec.yaml');
const GOLDEN_PATH = path.join(__dirname, 'golden', 'golden-config.yaml');

function loadFixtureSpec() {
  return yaml.load(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

// === createConfig ===

describe('createConfig', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-config-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('creates config.yaml matching golden file', async () => {
    const specData = loadFixtureSpec();
    const outputPath = path.join(tmpDir, '_test-team', 'config.yaml');
    const bmeRoot = tmpDir; // empty dir — no collisions

    const result = await createConfig(specData, outputPath, bmeRoot);
    assert.equal(result.success, true);
    assert.deepEqual(result.errors, []);

    const actual = fs.readFileSync(outputPath, 'utf8');
    const expected = fs.readFileSync(GOLDEN_PATH, 'utf8');
    assert.equal(actual, expected, 'config.yaml does not match golden file');
  });

  it('refuses to overwrite existing file (additive-only)', async () => {
    const specData = loadFixtureSpec();
    const existingDir = path.join(tmpDir, '_existing');
    await fs.ensureDir(existingDir);
    const outputPath = path.join(existingDir, 'config.yaml');
    await fs.writeFile(outputPath, 'existing content', 'utf8');

    const result = await createConfig(specData, outputPath, tmpDir);
    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('already exists'));

    // Verify file was not overwritten
    const content = await fs.readFile(outputPath, 'utf8');
    assert.equal(content, 'existing content');
  });

  it('output is valid YAML that parses correctly', async () => {
    const specData = loadFixtureSpec();
    const isolatedBmeRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-parse-'));
    const outputPath = path.join(isolatedBmeRoot, '_test-team', 'config.yaml');

    await createConfig(specData, outputPath, isolatedBmeRoot);
    const content = await fs.readFile(outputPath, 'utf8');
    const parsed = yaml.load(content);

    assert.equal(parsed.submodule_name, '_test-team');
    assert.equal(parsed.module, 'bme');
    assert.equal(parsed.core_module, 'bme');
    assert.deepEqual(parsed.agents, ['alpha-analyzer', 'beta-builder']);
    assert.deepEqual(parsed.workflows, ['data-analysis', 'component-building']);
  });
});

// === detectCollisions ===

describe('detectCollisions', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-collision-'));
    // Create a fake existing module config
    const existingDir = path.join(tmpDir, '_existing-mod');
    await fs.ensureDir(existingDir);
    await fs.writeFile(path.join(existingDir, 'config.yaml'), yaml.dump({
      submodule_name: '_existing-mod',
      agents: ['shared-agent', 'unique-agent'],
      workflows: ['shared-workflow', 'unique-workflow']
    }), 'utf8');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('detects duplicate agent ID across modules', async () => {
    const specData = {
      team_name_kebab: 'new-team',
      agents: [{ id: 'shared-agent', capabilities: ['testing'] }]
    };
    const collisions = await detectCollisions(specData, tmpDir);
    const agentCollisions = collisions.filter(c => c.field === 'agent');
    assert.ok(agentCollisions.length > 0);
    assert.equal(agentCollisions[0].value, 'shared-agent');
    assert.equal(agentCollisions[0].existingModule, '_existing-mod');
  });

  it('detects duplicate workflow name across modules', async () => {
    const specData = {
      team_name_kebab: 'new-team',
      agents: [{ id: 'safe-agent', capabilities: ['shared workflow'] }]
    };
    const collisions = await detectCollisions(specData, tmpDir);
    const wfCollisions = collisions.filter(c => c.field === 'workflow');
    assert.ok(wfCollisions.length > 0);
    assert.equal(wfCollisions[0].value, 'shared-workflow');
  });

  it('detects duplicate submodule_name from a different directory', async () => {
    // Create a second module directory whose config has the same submodule_name
    // as our new team — simulates a renamed/moved module
    const aliasDir = path.join(tmpDir, '_alias-mod');
    await fs.ensureDir(aliasDir);
    await fs.writeFile(path.join(aliasDir, 'config.yaml'), yaml.dump({
      submodule_name: '_collision-team',
      agents: ['other-agent'],
      workflows: ['other-workflow']
    }), 'utf8');

    const specData = {
      team_name_kebab: 'collision-team',
      agents: [{ id: 'safe-agent', capabilities: ['safe'] }]
    };
    const collisions = await detectCollisions(specData, tmpDir);
    const subCollisions = collisions.filter(c => c.field === 'submodule_name');
    assert.ok(subCollisions.length > 0);
    assert.equal(subCollisions[0].existingModule, '_alias-mod');
  });

  it('returns empty array when no collisions', async () => {
    const specData = {
      team_name_kebab: 'unique-team',
      agents: [{ id: 'unique-id', capabilities: ['unique thing'] }]
    };
    const collisions = await detectCollisions(specData, tmpDir);
    assert.equal(collisions.length, 0);
  });

  it('returns error result when collisions found', async () => {
    const specData = loadFixtureSpec();
    // Override with colliding agent
    specData.agents[0].id = 'shared-agent';
    const outputPath = path.join(tmpDir, '_collision-test', 'config.yaml');

    const result = await createConfig(specData, outputPath, tmpDir);
    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('Collision'));
  });
});

// === deriveWorkflowNames ===

describe('deriveWorkflowNames', () => {
  it('derives from first capability', () => {
    const spec = {
      agents: [
        { id: 'a', capabilities: ['Data Analysis', 'Other Thing'] },
        { id: 'b', capabilities: ['Component Building'] }
      ]
    };
    const names = deriveWorkflowNames(spec);
    assert.deepEqual(names, ['data-analysis', 'component-building']);
  });

  it('uses role when no capabilities', () => {
    const spec = {
      agents: [{ id: 'a', role: 'Stack Detective', capabilities: [] }]
    };
    const names = deriveWorkflowNames(spec);
    assert.deepEqual(names, ['stack-detective']);
  });

  it('uses workflow_names map when available', () => {
    const spec = {
      agents: [{ id: 'a', capabilities: ['something'] }],
      workflow_names: { a: 'custom-name' }
    };
    const names = deriveWorkflowNames(spec);
    assert.deepEqual(names, ['custom-name']);
  });
});

// === toKebab ===

describe('toKebab', () => {
  it('converts spaces to hyphens', () => {
    assert.equal(toKebab('Data Analysis'), 'data-analysis');
  });

  it('handles special characters', () => {
    assert.equal(toKebab('Model & Review'), 'model-review');
  });

  it('trims leading/trailing hyphens', () => {
    assert.equal(toKebab(' Test '), 'test');
  });
});

// ── tf-2-13 Task 1 (T133a): output_folder must carry the {project-root}/ prefix ──
// step-02-connect.md §5 documents the template as '{project-root}/{output_directory}'
// and every shipped module (_gyre, _vortex, _team-factory) carries it. buildConfigData
// wrote the bare value, so a generated team resolved its output against process.cwd().
describe('tf-2-13: output_folder prefix', () => {
  it('prefixes output_folder with {project-root}/, matching every shipped module', () => {
    const cfg = buildConfigData({
      team_name: 'Prefix Probe',
      team_name_kebab: 'prefix-probe',
      description: 'probe',
      agents: [{ id: 'alpha-probe', role: 'r' }],
      integration: { output_directory: '_bmad-output/prefix-probe-artifacts' }
    });
    assert.equal(cfg.output_folder, '{project-root}/_bmad-output/prefix-probe-artifacts');
  });

  it('does not double-prefix a value that already carries it', () => {
    const cfg = buildConfigData({
      team_name: 'Prefix Probe',
      team_name_kebab: 'prefix-probe',
      description: 'probe',
      agents: [{ id: 'alpha-probe', role: 'r' }],
      integration: { output_directory: '{project-root}/_bmad-output/prefix-probe-artifacts' }
    });
    assert.equal(cfg.output_folder, '{project-root}/_bmad-output/prefix-probe-artifacts');
  });
});

// ── tf-2-13 Task 5 (T133e): the factory must create the team's output directory ──
// Nothing did. The three ensureDir calls (spec-writer:43, config-creator:41,
// csv-creator:37) each create the parent of the file being written; output_directory
// was only ever read — validated, written into config, displayed. tf-2-11 Risk #3
// predicted exactly this, and the pilot confirmed it: the directory never appeared.
describe('tf-2-13: output directory is created', () => {
  let root;
  before(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'tf213-out-')); });
  after(async () => { await fs.remove(root); });

  const spec = { team_name_kebab: 'out-probe', integration: { output_directory: '_bmad-output/out-probe-artifacts' } };

  it('creates the directory under the given projectRoot', async () => {
    const r = await ensureOutputDirectory(spec, root);
    assert.equal(r.success, true, JSON.stringify(r.errors));
    assert.equal(await fs.pathExists(path.join(root, '_bmad-output/out-probe-artifacts')), true);
    assert.equal(r.path, path.join(root, '_bmad-output/out-probe-artifacts'));
  });

  it('is idempotent — a second call on an existing directory succeeds', async () => {
    await ensureOutputDirectory(spec, root);
    const r = await ensureOutputDirectory(spec, root);
    assert.equal(r.success, true);
  });

  it('resolves against projectRoot, never process.cwd()', async () => {
    const r = await ensureOutputDirectory(spec, root);
    assert.ok(r.path.startsWith(root), `resolved outside projectRoot: ${r.path}`);
  });
});
