const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');

describe('Fresh Install (refreshInstallation on empty project)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-fresh-'));
    // Create minimal project structure
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('creates agent files in the correct location', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const emmaPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md');
    const wadePath = path.join(tmpDir, '_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md');
    const islaPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md');
    const maxPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/learning-decision-expert/SKILL.md');

    assert.ok(fs.existsSync(emmaPath), 'Emma agent file should exist');
    assert.ok(fs.existsSync(wadePath), 'Wade agent file should exist');
    assert.ok(fs.existsSync(islaPath), 'Isla agent file should exist');
    assert.ok(fs.existsSync(maxPath), 'Max agent file should exist');
  });

  it('creates config.yaml with correct version', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    assert.ok(fs.existsSync(configPath), 'config.yaml should exist');

    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    const pkg = require('../../package.json');
    assert.equal(config.version, pkg.version);
  });

  it('populates agents and workflows in config', async () => {
    const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

    assert.ok(Array.isArray(config.agents), 'agents should be an array');
    assert.ok(config.agents.includes('contextualization-expert'));
    assert.ok(config.agents.includes('lean-experiments-specialist'));
    assert.ok(config.agents.includes('discovery-empathy-expert'));
    assert.ok(config.agents.includes('learning-decision-expert'));

    assert.ok(Array.isArray(config.workflows), 'workflows should be an array');
    assert.ok(config.workflows.length >= 13, 'should have at least 13 workflows');
  });

  it('creates workflow directories if source exists', async () => {
    const workflowsDir = path.join(tmpDir, '_bmad/bme/_vortex/workflows');
    assert.ok(fs.existsSync(workflowsDir), 'workflows directory should exist');
  });

  it('returns a list of changes made', async () => {
    // Run fresh on a new tmp dir to test return value
    const tmpDir2 = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-fresh2-'));
    await fs.ensureDir(path.join(tmpDir2, '_bmad'));

    const changes = await refreshInstallation(tmpDir2, { backupGuides: false, verbose: false });

    assert.ok(Array.isArray(changes));
    assert.ok(changes.length > 0, 'should report at least one change');
    assert.ok(changes.some(c => c.includes('config.yaml')), 'should mention config update');
    assert.ok(changes.some(c => c.includes('Refreshed skill:')), 'should mention skill creation');

    await fs.remove(tmpDir2);
  });
});

describe('Fresh Install creates skill files', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-skills-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('creates all 7 skill files', async () => {
    const { AGENTS } = require('../../scripts/update/lib/agent-registry');
    for (const agent of AGENTS) {
      const skillPath = path.join(tmpDir, '.claude', 'skills', `bmad-agent-bme-${agent.id}`, 'SKILL.md');
      assert.ok(fs.existsSync(skillPath), `Skill file for ${agent.name} should exist`);
    }
  });

  it('skill files have correct frontmatter', async () => {
    const skillPath = path.join(tmpDir, '.claude', 'skills', 'bmad-agent-bme-contextualization-expert', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('name: bmad-agent-bme-contextualization-expert'), 'should have correct name (no quotes)');
    assert.ok(content.includes('description: contextualization-expert agent'), 'should have correct description (no quotes)');
  });

  it('skill files reference correct agent path', async () => {
    const skillPath = path.join(tmpDir, '.claude', 'skills', 'bmad-agent-bme-lean-experiments-specialist', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md'), 'should reference correct agent file');
  });

  it('is idempotent — running twice produces same result', async () => {
    const { AGENTS } = require('../../scripts/update/lib/agent-registry');

    // Capture content before second run
    const contentsBefore = {};
    for (const agent of AGENTS) {
      const skillPath = path.join(tmpDir, '.claude', 'skills', `bmad-agent-bme-${agent.id}`, 'SKILL.md');
      contentsBefore[agent.id] = fs.readFileSync(skillPath, 'utf8');
    }

    // Run again
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    // Verify all files exist with identical content
    for (const agent of AGENTS) {
      const skillPath = path.join(tmpDir, '.claude', 'skills', `bmad-agent-bme-${agent.id}`, 'SKILL.md');
      assert.ok(fs.existsSync(skillPath), `Skill file for ${agent.name} should still exist after re-run`);
      const contentAfter = fs.readFileSync(skillPath, 'utf8');
      assert.equal(contentAfter, contentsBefore[agent.id], `${agent.name} content should be identical after re-run`);
    }
  });

  it('removes legacy command files during migration', async () => {
    const tmpDir2 = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-legacy-'));
    await fs.ensureDir(path.join(tmpDir2, '_bmad'));

    // Create legacy command files
    const commandsDir = path.join(tmpDir2, '.claude', 'commands');
    await fs.ensureDir(commandsDir);
    await fs.writeFile(path.join(commandsDir, 'bmad-agent-bme-contextualization-expert.md'), 'legacy', 'utf8');
    await fs.writeFile(path.join(commandsDir, 'bmad-agent-bme-discovery-empathy-expert.md'), 'legacy', 'utf8');

    // Run refresh
    const changes = await refreshInstallation(tmpDir2, { backupGuides: false, verbose: false });

    // Legacy commands should be gone
    assert.ok(!fs.existsSync(path.join(commandsDir, 'bmad-agent-bme-contextualization-expert.md')), 'legacy command should be removed');
    assert.ok(!fs.existsSync(path.join(commandsDir, 'bmad-agent-bme-discovery-empathy-expert.md')), 'legacy command should be removed');

    // Skills should exist
    const skillPath = path.join(tmpDir2, '.claude', 'skills', 'bmad-agent-bme-contextualization-expert', 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), 'skill file should exist after migration');

    // Changes should mention legacy removal
    assert.ok(changes.some(c => c.includes('Removed legacy command:')), 'should report legacy command removal');

    await fs.remove(tmpDir2);
  });
});

describe('Fresh Install agent content matches package source', () => {
  let tmpDir;
  const packageRoot = path.join(__dirname, '..', '..');

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-content-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('installed Emma matches package source', async () => {
    const srcPath = path.join(packageRoot, '_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md');
    const dstPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md');

    if (fs.existsSync(srcPath)) {
      const src = fs.readFileSync(srcPath, 'utf8');
      const dst = fs.readFileSync(dstPath, 'utf8');
      assert.equal(dst, src, 'Installed Emma should match package source');
    }
  });

  it('installed Wade matches package source', async () => {
    const srcPath = path.join(packageRoot, '_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md');
    const dstPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md');

    if (fs.existsSync(srcPath)) {
      const src = fs.readFileSync(srcPath, 'utf8');
      const dst = fs.readFileSync(dstPath, 'utf8');
      assert.equal(dst, src, 'Installed Wade should match package source');
    }
  });

  it('installed Isla matches package source', async () => {
    const srcPath = path.join(packageRoot, '_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md');
    const dstPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md');

    if (fs.existsSync(srcPath)) {
      const src = fs.readFileSync(srcPath, 'utf8');
      const dst = fs.readFileSync(dstPath, 'utf8');
      assert.equal(dst, src, 'Installed Isla should match package source');
    }
  });

  it('installed Max matches package source', async () => {
    const srcPath = path.join(packageRoot, '_bmad/bme/_vortex/agents/learning-decision-expert/SKILL.md');
    const dstPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/learning-decision-expert/SKILL.md');

    if (fs.existsSync(srcPath)) {
      const src = fs.readFileSync(srcPath, 'utf8');
      const dst = fs.readFileSync(dstPath, 'utf8');
      assert.equal(dst, src, 'Installed Max should match package source');
    }
  });
});

describe('Agent manifest v6.1.0 schema', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-manifest-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('fresh install uses v6.1.0 12-column header', async () => {
    const manifestPath = path.join(tmpDir, '_bmad', '_config', 'agent-manifest.csv');
    const content = fs.readFileSync(manifestPath, 'utf8');
    const header = content.split('\n')[0];
    assert.ok(header.includes('canonicalId'), 'header should include canonicalId column');
    assert.ok(header.includes('communicationStyle'), 'header should include communicationStyle column');
    assert.ok(header.startsWith('name,'), 'header should start with name (v6.1.0 format)');
  });

  it('bme rows have 12 columns with module and canonicalId populated', async () => {
    const manifestPath = path.join(tmpDir, '_bmad', '_config', 'agent-manifest.csv');
    const lines = fs.readFileSync(manifestPath, 'utf8').trim().split('\n');
    const dataRows = lines.slice(1);

    assert.equal(dataRows.length, 12, 'should have 12 agent rows (7 vortex + 4 gyre + 1 standalone bme: team-factory)');

    for (const row of dataRows) {
      // Count fields by parsing quoted CSV
      const fields = row.match(/"([^"]*(?:""[^"]*)*)"/g);
      assert.ok(fields, `row should have quoted fields: ${row.substring(0, 60)}...`);
      assert.equal(fields.length, 12, `row should have 12 columns: ${row.substring(0, 60)}...`);

      // module (index 9) should be "bme"
      const module = fields[9].replace(/^"|"$/g, '');
      assert.equal(module, 'bme', 'module column should be bme');

      // canonicalId (index 11) should start with bmad-agent-bme-
      const canonicalId = fields[11].replace(/^"|"$/g, '');
      assert.ok(canonicalId.startsWith('bmad-agent-bme-'), `canonicalId should start with bmad-agent-bme-: ${canonicalId}`);
    }
  });

  it('preserves existing non-bme rows when manifest exists', async () => {
    const tmpDir2 = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-preserve-'));
    await fs.ensureDir(path.join(tmpDir2, '_bmad', '_config'));

    // Write a v6.1.0 manifest with a non-bme row
    const header = 'name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId';
    const nativeRow = '"Winston","","Architect","🏗️","","System Architect","Senior architect","Calm tones","Lean architecture","bmm","_bmad/bmm/agents/architect.md","bmad-architect"';
    const manifestPath = path.join(tmpDir2, '_bmad', '_config', 'agent-manifest.csv');
    await fs.writeFile(manifestPath, header + '\n' + nativeRow + '\n', 'utf8');

    await refreshInstallation(tmpDir2, { backupGuides: false, verbose: false });

    const content = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(content.includes('"bmm"'), 'should preserve bmm row');
    assert.ok(content.includes('"Winston"'), 'should preserve Winston row');
    assert.ok(content.includes('"Emma"'), 'should add Emma bme row');

    const lines = content.trim().split('\n');
    assert.equal(lines.length, 14, 'should have header + 1 bmm + 12 bme rows (7 vortex + 4 gyre + 1 standalone)');

    await fs.remove(tmpDir2);
  });
});

describe('Agent customize files', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-customize-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('creates 7 customize files on fresh install', async () => {
    const { AGENTS } = require('../../scripts/update/lib/agent-registry');
    for (const agent of AGENTS) {
      const filename = `bme-${agent.name.toLowerCase()}.customize.yaml`;
      const filePath = path.join(tmpDir, '_bmad', '_config', 'agents', filename);
      assert.ok(fs.existsSync(filePath), `Customize file for ${agent.name} should exist: ${filename}`);
    }
  });

  it('customize files have correct template structure', async () => {
    const filePath = path.join(tmpDir, '_bmad', '_config', 'agents', 'bme-emma.customize.yaml');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('agent:'), 'should have agent section');
    assert.ok(content.includes('metadata:'), 'should have metadata section');
    assert.ok(content.includes('persona:'), 'should have persona section');
    assert.ok(content.includes('memories: []'), 'should have memories section');
    assert.ok(content.includes('menu: []'), 'should have menu section');
    assert.ok(content.includes('prompts: []'), 'should have prompts section');
  });

  it('does NOT overwrite existing customize files on re-install', async () => {
    const filePath = path.join(tmpDir, '_bmad', '_config', 'agents', 'bme-emma.customize.yaml');
    const customContent = '# User-modified customize file\nagent:\n  metadata:\n    name: "My Custom Emma"\n';
    await fs.writeFile(filePath, customContent, 'utf8');

    // Run refresh again
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    // Content should be preserved, not overwritten
    const afterContent = fs.readFileSync(filePath, 'utf8');
    assert.equal(afterContent, customContent, 'customize file should not be overwritten');
  });
});

// fic-1-1 / BUG-22. A fresh 4.0.2 install wrote configs with no user_name/communication_language,
// so 7 of 11 agents stopped on first start; it also seeded Gyre with Vortex identity and doubled
// Gyre's lists on its first update. These go through refreshInstallation, the path the installer and
// convoke-update both take, rather than mergeConfig alone.
describe('Fresh Install writes the config every agent needs (fic-1-1)', () => {
  const { GYRE_AGENT_IDS, GYRE_WORKFLOW_NAMES } = require('../../scripts/update/lib/agent-registry');
  const templateDescription = (submodule) =>
    yaml.load(fs.readFileSync(path.join(__dirname, `../../_bmad/bme/${submodule}/config.yaml`), 'utf8')).description;
  let tmpDir;

  const readConfig = (submodule) =>
    yaml.load(fs.readFileSync(path.join(tmpDir, `_bmad/bme/${submodule}/config.yaml`), 'utf8'));

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-fic-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  for (const [submodule, outputFolder] of [
    ['_vortex', '{project-root}/_bmad-output/vortex-artifacts'],
    ['_gyre', '{project-root}/_bmad-output/gyre-artifacts'],
  ]) {
    it(`${submodule}/config.yaml carries the fields its agents require (AC1)`, () => {
      const config = readConfig(submodule);
      assert.equal(config.submodule_name, submodule);
      assert.equal(config.module, 'bme');
      assert.equal(config.output_folder, outputFolder);
      if (submodule === '_gyre') assert.equal(config.description, templateDescription('_gyre'));
      assert.equal(config.user_name, '{user}');
      assert.equal(config.communication_language, 'en');
    });
  }

  it('repeated refreshes leave Gyre lists canonical (AC2)', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const config = readConfig('_gyre');
    assert.deepEqual(config.agents, GYRE_AGENT_IDS);
    assert.deepEqual(config.workflows, GYRE_WORKFLOW_NAMES);
  });

  it('repairs a Gyre config in the shape a 4.0.2 install left it (AC3)', async () => {
    const gyreConfigPath = path.join(tmpDir, '_bmad/bme/_gyre/config.yaml');
    fs.writeFileSync(gyreConfigPath, yaml.dump({
      submodule_name: '_vortex',
      description: 'Vortex Pattern - Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, and Systematize streams',
      module: 'bmx',
      output_folder: '{project-root}/_bmad-output/vortex-artifacts',
      agents: [...GYRE_AGENT_IDS, ...GYRE_AGENT_IDS],
      excluded_agents: [],
      workflows: [...GYRE_WORKFLOW_NAMES, ...GYRE_WORKFLOW_NAMES],
      version: '4.0.2',
      migration_history: [],
      acme_client: 'Globex',
    }));

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const config = readConfig('_gyre');
    assert.equal(config.submodule_name, '_gyre');
    assert.equal(config.module, 'bme');
    assert.equal(config.description, templateDescription('_gyre'));
    assert.equal(config.output_folder, '{project-root}/_bmad-output/gyre-artifacts');
    assert.deepEqual(config.agents, GYRE_AGENT_IDS);
    assert.deepEqual(config.workflows, GYRE_WORKFLOW_NAMES);
    assert.equal(config.user_name, '{user}');
    assert.equal(config.communication_language, 'en');
    assert.equal(config.acme_client, 'Globex');
  });

  it('repairs a Vortex config left holding Gyre identity (the Vortex call site passes its submodule)', async () => {
    const vortexConfigPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
    const config = readConfig('_vortex');
    const gyreTemplate = yaml.load(fs.readFileSync(path.join(__dirname, '../../_bmad/bme/_gyre/config.yaml'), 'utf8'));
    fs.writeFileSync(vortexConfigPath, yaml.dump({
      ...config, submodule_name: '_gyre', description: gyreTemplate.description, output_folder: gyreTemplate.output_folder,
    }));

    const warn = console.warn;
    console.warn = () => {};
    try {
      await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    } finally {
      console.warn = warn;
    }

    const repaired = readConfig('_vortex');
    assert.equal(repaired.submodule_name, '_vortex');
    assert.equal(repaired.output_folder, '{project-root}/_bmad-output/vortex-artifacts');
  });

  it('refuses a config with a duplicate key before copying anything, leaving it byte-identical', async () => {
    const dupDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-fic-dup-'));
    try {
      await fs.ensureDir(path.join(dupDir, '_bmad'));
      await refreshInstallation(dupDir, { backupGuides: false, verbose: false });
      const gyreConfigPath = path.join(dupDir, '_bmad/bme/_gyre/config.yaml');
      const content = fs.readFileSync(gyreConfigPath, 'utf8') + 'acme_client: Globex\nuser_name: Pat\n';
      fs.writeFileSync(gyreConfigPath, content);
      const agentPath = path.join(dupDir, '_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md');
      const agentMarked = fs.readFileSync(agentPath, 'utf8') + '\n<!-- marker: must survive a refused refresh -->\n';
      fs.writeFileSync(agentPath, agentMarked);

      const warn = console.warn;
      console.warn = () => {};
      try {
        await assert.rejects(
          refreshInstallation(dupDir, { backupGuides: false, verbose: false }),
          /refusing to overwrite .*_gyre\/config\.yaml: it is not valid YAML/
        );
      } finally {
        console.warn = warn;
      }
      assert.equal(fs.readFileSync(gyreConfigPath, 'utf8'), content);
      assert.equal(fs.readFileSync(agentPath, 'utf8'), agentMarked, 'nothing was copied before the refusal');
    } finally {
      await fs.remove(dupDir);
    }
  });
});
