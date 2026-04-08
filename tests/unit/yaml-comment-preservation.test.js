/**
 * ag-7-1: YAML comment preservation tests
 *
 * Verifies that the migration to the comment-preserving `yaml` package keeps
 * documentation comments intact across:
 * - refresh-installation.js Enhance + Artifacts version stamps (I29)
 * - config-merger.js Vortex/Gyre merge (I29)
 * - config-appender.js team-factory append (I10)
 * - assertVersion guard ordering (I30)
 *
 * Closes I30 (rank #2, score 9.6), I29 (rank #42), I10 (rank #49).
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const YAML = require('yaml');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const { mergeConfig, writeConfig } = require('../../scripts/update/lib/config-merger');
const { appendConfigAgent, appendConfigWorkflow } = require('../../_bmad/bme/_team-factory/lib/writers/config-appender');
const { PACKAGE_ROOT, createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

const ARTIFACTS_COMMENT_NEEDLE = '# Workflows in this module are STANDALONE';

const PM_MD = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
</agent>`;

async function setupTempProject() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-yaml-pres-'));
  await createValidInstallation(tmpDir);
  // pm.md so the Enhance menu patch doesn't error
  const pmDir = path.join(tmpDir, '_bmad/bmm/agents');
  await fs.ensureDir(pmDir);
  await fs.writeFile(path.join(pmDir, 'pm.md'), PM_MD, 'utf8');
  return tmpDir;
}

// === (a) refreshInstallation: Artifacts comment preservation ===

describe('ag-7-1: refreshInstallation preserves _artifacts comments', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupTempProject();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('keeps the standalone:true documentation comment after version stamp', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const artifactsConfig = fs.readFileSync(
      path.join(tmpDir, '_bmad/bme/_artifacts/config.yaml'),
      'utf8'
    );

    assert.ok(
      artifactsConfig.includes(ARTIFACTS_COMMENT_NEEDLE),
      `expected Artifacts config to retain its standalone:true comment, got:\n${artifactsConfig}`
    );

    // Also verify the version was actually stamped
    const parsed = YAML.parse(artifactsConfig);
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    assert.equal(parsed.version, pkg.version);
  });
});

// === (b) refreshInstallation: Enhance comment preservation ===

describe('ag-7-1: refreshInstallation preserves _enhance comments (if any present in source)', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupTempProject();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('preserves all comments from source _enhance/config.yaml after stamp', async () => {
    // Read the source file's comment lines (if any) BEFORE running refresh
    const sourceContent = fs.readFileSync(
      path.join(PACKAGE_ROOT, '_bmad/bme/_enhance/config.yaml'),
      'utf8'
    );
    const sourceCommentLines = sourceContent.split('\n').filter(l => l.trim().startsWith('#'));

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const targetContent = fs.readFileSync(
      path.join(tmpDir, '_bmad/bme/_enhance/config.yaml'),
      'utf8'
    );
    const targetCommentLines = targetContent.split('\n').filter(l => l.trim().startsWith('#'));

    // Every source comment line must appear in the target
    for (const commentLine of sourceCommentLines) {
      assert.ok(
        targetCommentLines.includes(commentLine),
        `expected target Enhance config to preserve comment line: ${commentLine}`
      );
    }
  });
});

// === (c+d) config-merger comment preservation for Vortex + Gyre ===

describe('ag-7-1: config-merger.mergeConfig + writeConfig preserve comments', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-merger-pres-'));
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('preserves a documentation comment across the merge round-trip', async () => {
    const configPath = path.join(tmpDir, 'config.yaml');
    const COMMENT = '# This is a load-bearing documentation comment that must survive merge';
    const original = `${COMMENT}
submodule_name: _vortex
description: Test module
module: bme
version: 1.0.0
output_folder: '{project-root}/_bmad-output/vortex-artifacts'
agents:
  - existing-agent
workflows:
  - existing-workflow
`;
    await fs.writeFile(configPath, original, 'utf8');

    const merged = await mergeConfig(configPath, '3.1.0', {
      agents: ['contextualization-expert'],
      workflows: ['lean-persona']
    });
    await writeConfig(configPath, merged);

    const after = fs.readFileSync(configPath, 'utf8');
    assert.ok(
      after.includes(COMMENT),
      `expected merged config to preserve the comment, got:\n${after}`
    );

    // And the merge actually applied
    const parsed = YAML.parse(after);
    assert.equal(parsed.version, '3.1.0');
    assert.ok(parsed.agents.includes('contextualization-expert'));
    assert.ok(parsed.agents.includes('existing-agent'));
  });

  it('throws via assertVersion when newVersion is undefined', async () => {
    const configPath = path.join(tmpDir, 'config.yaml');
    await fs.writeFile(configPath, 'agents: []\nworkflows: []\n', 'utf8');

    await assert.rejects(
      mergeConfig(configPath, undefined, {}),
      /Refresh: cannot stamp config — getPackageVersion\(\) returned undefined/
    );
  });

  it('throws via assertVersion when newVersion is empty string', async () => {
    const configPath = path.join(tmpDir, 'config.yaml');
    await fs.writeFile(configPath, 'agents: []\nworkflows: []\n', 'utf8');

    await assert.rejects(
      mergeConfig(configPath, '', {}),
      /Refresh: cannot stamp config — getPackageVersion\(\) returned ''/
    );
  });
});

// === (e) team-factory config-appender comment preservation ===

describe('ag-7-1: appendConfigAgent + appendConfigWorkflow preserve comments', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-appender-pres-'));
    // Initialize a git repo so checkDirtyTree doesn't fire
    const { execSync } = require('child_process');
    execSync('git init -q', { cwd: tmpDir });
    execSync('git config user.email "test@test"', { cwd: tmpDir });
    execSync('git config user.name "test"', { cwd: tmpDir });
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('preserves comments when appending an agent (closes I10)', async () => {
    const configPath = path.join(tmpDir, 'config.yaml');
    const COMMENT = '# Team factory test config — comment must survive append';
    const original = `${COMMENT}
agents:
  - existing-agent
workflows:
  - existing-workflow
`;
    await fs.writeFile(configPath, original, 'utf8');
    require('child_process').execSync('git add . && git commit -q -m initial', { cwd: tmpDir });

    const result = await appendConfigAgent('new-agent', configPath, { skipDirtyCheck: true });
    assert.equal(result.success, true, `append failed: ${JSON.stringify(result.errors)}`);

    const after = fs.readFileSync(configPath, 'utf8');
    assert.ok(
      after.includes(COMMENT),
      `expected appender to preserve the comment, got:\n${after}`
    );

    const parsed = YAML.parse(after);
    assert.ok(parsed.agents.includes('new-agent'));
    assert.ok(parsed.agents.includes('existing-agent'));
  });

  it('preserves comments when appending a workflow (closes I10)', async () => {
    const configPath = path.join(tmpDir, 'config.yaml');
    const COMMENT = '# Workflow append comment — must survive';
    const original = `${COMMENT}
agents:
  - existing-agent
workflows:
  - existing-workflow
`;
    await fs.writeFile(configPath, original, 'utf8');
    require('child_process').execSync('git add . && git commit -q -m initial', { cwd: tmpDir });

    const result = await appendConfigWorkflow('new-workflow', configPath, { skipDirtyCheck: true });
    assert.equal(result.success, true, `append failed: ${JSON.stringify(result.errors)}`);

    const after = fs.readFileSync(configPath, 'utf8');
    assert.ok(
      after.includes(COMMENT),
      `expected appender to preserve the comment, got:\n${after}`
    );

    const parsed = YAML.parse(after);
    assert.ok(parsed.workflows.includes('new-workflow'));
  });
});

// === (f) Round-trip identity ===

describe('ag-7-1: round-trip identity for real config files', () => {
  it('parse → stringify → parse yields identical structure for _artifacts/config.yaml', () => {
    const source = fs.readFileSync(
      path.join(PACKAGE_ROOT, '_bmad/bme/_artifacts/config.yaml'),
      'utf8'
    );

    const doc1 = YAML.parseDocument(source);
    const stringified = doc1.toString({ lineWidth: 0 });
    const doc2 = YAML.parseDocument(stringified);

    assert.deepEqual(doc2.toJSON(), doc1.toJSON(), 'JSON structure must round-trip cleanly');
    // The stringified output should preserve the comment block
    assert.ok(
      stringified.includes(ARTIFACTS_COMMENT_NEEDLE),
      'comment must survive parse → stringify round-trip'
    );
  });

  it('parse → stringify → parse yields identical structure for _enhance/config.yaml', () => {
    const source = fs.readFileSync(
      path.join(PACKAGE_ROOT, '_bmad/bme/_enhance/config.yaml'),
      'utf8'
    );

    const doc1 = YAML.parseDocument(source);
    const stringified = doc1.toString({ lineWidth: 0 });
    const doc2 = YAML.parseDocument(stringified);

    assert.deepEqual(doc2.toJSON(), doc1.toJSON());
  });
});

// === (g) Backwards compat: yaml package can read all existing source configs ===

describe('ag-7-1: backwards-compat — yaml package reads existing js-yaml-formatted configs', () => {
  const sourceConfigs = [
    '_bmad/bme/_vortex/config.yaml',
    '_bmad/bme/_gyre/config.yaml',
    '_bmad/bme/_enhance/config.yaml',
    '_bmad/bme/_artifacts/config.yaml',
    '_bmad/bme/_team-factory/config.yaml',
  ];

  for (const relPath of sourceConfigs) {
    it(`parses ${relPath} without throwing or yielding errors`, () => {
      const fullPath = path.join(PACKAGE_ROOT, relPath);
      if (!fs.existsSync(fullPath)) {
        // Skip if the module isn't present (e.g., team-factory config in some configs)
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      const doc = YAML.parseDocument(content);
      assert.equal(doc.errors.length, 0, `parse errors in ${relPath}: ${JSON.stringify(doc.errors)}`);
      const parsed = doc.toJSON();
      assert.ok(parsed && typeof parsed === 'object', `${relPath} must yield a non-null object`);
    });
  }
});
