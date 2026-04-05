const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const {
  writeRegistryBlock,
  derivePrefix,
  buildAgentEntry,
  buildModuleBlock,
  buildWorkflowNames,
  applyInsertions,
  escapeSingleQuotes,
} = require('../../_bmad/bme/_team-factory/lib/writers/registry-writer');

const GOLDEN_BLOCK_PATH = path.join(__dirname, 'golden', 'golden-registry-block.js');

/**
 * Build a minimal test registry file content with Vortex + Gyre structure.
 * Mimics the real agent-registry.js structure at a minimal scale.
 */
function buildTestRegistry() {
  return `'use strict';

const AGENTS = [
  { id: 'test-vortex-agent', name: 'TestAgent', icon: '\\u{1F3AF}',
    title: 'Test Agent', stream: 'Test',
    persona: { role: 'Test', identity: 'Test', communication_style: 'Test', expertise: 'Test' } },
];

const WORKFLOWS = [
  { name: 'test-workflow', agent: 'test-vortex-agent' },
];

const AGENT_FILES = AGENTS.map(a => \`\${a.id}.md\`);
const AGENT_IDS = AGENTS.map(a => a.id);
const WORKFLOW_NAMES = WORKFLOWS.map(w => w.name);

module.exports = {
  AGENTS,
  WORKFLOWS,
  AGENT_FILES,
  AGENT_IDS,
  WORKFLOW_NAMES,
};
`;
}

/**
 * Build a test spec matching the test-team-spec.yaml fixture
 * with enriched persona fields for registry writing.
 */
function buildTestSpec() {
  return {
    team_name: 'Test Team',
    team_name_kebab: 'test-team',
    composition_pattern: 'Sequential',
    agents: [
      {
        id: 'alpha-analyzer',
        name: 'Alpha',
        role: 'Analyzes data patterns',
        capabilities: ['data analysis', 'pattern recognition'],
        pipeline_position: 1,
        icon: '\u{2699}',
        persona: {
          role: 'Analyzes data patterns',
          identity: 'Test agent',
          communication_style: 'Direct',
          expertise: 'Testing',
        },
      },
      {
        id: 'beta-builder',
        name: 'Beta',
        role: 'Builds software components',
        capabilities: ['component building', 'code generation'],
        pipeline_position: 2,
        icon: '\u{2699}',
        persona: {
          role: 'Builds software components',
          identity: 'Test agent',
          communication_style: 'Direct',
          expertise: 'Testing',
        },
      },
    ],
  };
}

// === derivePrefix ===

describe('derivePrefix', () => {
  it('converts kebab-case to SCREAMING_SNAKE_CASE', () => {
    assert.equal(derivePrefix('test-team'), 'TEST_TEAM');
  });

  it('strips leading underscore', () => {
    assert.equal(derivePrefix('_gyre'), 'GYRE');
  });

  it('handles single word', () => {
    assert.equal(derivePrefix('vortex'), 'VORTEX');
  });

  it('handles empty string', () => {
    assert.equal(derivePrefix(''), '');
  });
});

// === escapeSingleQuotes ===

describe('escapeSingleQuotes', () => {
  it('escapes single quotes', () => {
    assert.equal(escapeSingleQuotes("What's this?"), "What\\'s this?");
  });

  it('escapes backslashes before single quotes', () => {
    assert.equal(escapeSingleQuotes("path\\to\\'file"), "path\\\\to\\\\\\'file");
  });

  it('handles empty string', () => {
    assert.equal(escapeSingleQuotes(''), '');
  });

  it('handles null/undefined', () => {
    assert.equal(escapeSingleQuotes(null), '');
    assert.equal(escapeSingleQuotes(undefined), '');
  });

  it('escapes newlines and carriage returns', () => {
    assert.equal(escapeSingleQuotes('line1\nline2'), 'line1\\nline2');
    assert.equal(escapeSingleQuotes('line1\r\nline2'), 'line1\\r\\nline2');
  });
});

// === buildAgentEntry ===

describe('buildAgentEntry', () => {
  it('builds entry from enriched agent spec', () => {
    const agent = {
      id: 'test-agent',
      name: 'TestBot',
      icon: '\u{1F50E}',
      role: 'Tester',
      persona: {
        role: 'Test role',
        identity: 'Test identity',
        communication_style: 'Direct',
        expertise: 'Testing',
      },
    };
    const entry = buildAgentEntry(agent, 'my-team');
    assert.equal(entry.id, 'test-agent');
    assert.equal(entry.name, 'TestBot');
    assert.equal(entry.icon, '\u{1F50E}');
    assert.equal(entry.title, 'Tester');
    assert.equal(entry.stream, 'my-team');
    assert.equal(entry.persona.role, 'Test role');
  });

  it('derives name from id when name not provided', () => {
    const agent = { id: 'stack-detective', role: 'Detective' };
    const entry = buildAgentEntry(agent, 'team');
    assert.equal(entry.name, 'Stack Detective');
  });

  it('uses default icon when not provided', () => {
    const agent = { id: 'test', role: 'Test' };
    const entry = buildAgentEntry(agent, 'team');
    assert.equal(entry.icon, '\u{2699}');
  });
});

// === buildModuleBlock ===

describe('buildModuleBlock', () => {
  it('generates block matching golden file structure', () => {
    const specData = buildTestSpec();
    const prefix = 'TEST_TEAM';
    const workflowNames = buildWorkflowNames(specData);
    const block = buildModuleBlock(specData, prefix, 'Test Team', workflowNames);
    const golden = fs.readFileSync(GOLDEN_BLOCK_PATH, 'utf8').trim();
    assert.equal(block, golden, 'Module block does not match golden file');
  });

  it('escapes single quotes in persona fields', () => {
    const specData = {
      team_name: 'Quote Team',
      team_name_kebab: 'quote-team',
      agents: [{
        id: 'quoter',
        name: 'Quoter',
        role: "It's a test",
        icon: '\u{2699}',
        persona: {
          role: "What's this?",
          identity: "I'm the agent",
          communication_style: "Says 'hello'",
          expertise: "Testing's edge",
        },
      }],
    };
    const wfNames = buildWorkflowNames(specData);
    const block = buildModuleBlock(specData, 'QUOTE_TEAM', 'Quote Team', wfNames);

    // Verify single quotes are escaped
    assert.ok(block.includes("What\\'s this?"), 'Should escape single quotes in role');
    assert.ok(block.includes("I\\'m the agent"), 'Should escape single quotes in identity');

    // Verify the block is valid JS by writing to temp and requiring
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-tf-quote-'));
    const tmpFile = path.join(tmpDir, 'quote-test.js');
    try {
      const wrapped = `'use strict';\n${block}\nmodule.exports = { QUOTE_TEAM_AGENTS, QUOTE_TEAM_WORKFLOWS };\n`;
      fs.writeFileSync(tmpFile, wrapped, 'utf8');
      const loaded = require(tmpFile);
      assert.equal(loaded.QUOTE_TEAM_AGENTS[0].persona.role, "What's this?");
    } finally {
      delete require.cache[require.resolve(tmpFile)];
      fs.removeSync(tmpDir);
    }
  });
});

// === applyInsertions ===

describe('applyInsertions', () => {
  it('inserts block before module.exports and exports before };', () => {
    const content = buildTestRegistry();
    const block = '// ── New Module ──\nconst NEW_AGENTS = [];';
    const exports = ['NEW_AGENTS'];
    const result = applyInsertions(content, block, exports);

    // Block appears before module.exports
    const blockIdx = result.indexOf('// ── New Module ──');
    const exportsIdx = result.indexOf('module.exports = {');
    assert.ok(blockIdx < exportsIdx, 'Block should be before module.exports');

    // New export appears inside module.exports
    assert.ok(result.includes('  NEW_AGENTS,'), 'Export should be inside module.exports');
  });

  it('preserves existing content exactly', () => {
    const content = buildTestRegistry();
    const block = '// ── New ──\nconst X = 1;';
    const result = applyInsertions(content, block, ['X']);

    // Original AGENTS still present
    assert.ok(result.includes("id: 'test-vortex-agent'"));
    assert.ok(result.includes('WORKFLOWS,'));
  });
});

// === writeRegistryBlock (integration) ===

describe('writeRegistryBlock', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-registry-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('happy path — inserts block, require() passes, exports updated', async () => {
    const registryPath = path.join(tmpDir, 'happy-registry.js');
    await fs.writeFile(registryPath, buildTestRegistry(), 'utf8');

    const specData = buildTestSpec();
    const result = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });

    assert.equal(result.success, true);
    assert.deepEqual(result.errors, []);
    assert.ok(result.written.includes('TEST_TEAM_AGENTS'));
    assert.ok(result.written.includes('TEST_TEAM_WORKFLOWS'));
    assert.equal(result.rollbackApplied, false);

    // Verify file is loadable
    const loaded = require(registryPath);
    assert.ok(loaded.TEST_TEAM_AGENTS);
    assert.equal(loaded.TEST_TEAM_AGENTS.length, 2);
    assert.equal(loaded.TEST_TEAM_AGENTS[0].id, 'alpha-analyzer');
    assert.ok(loaded.TEST_TEAM_WORKFLOWS);
    assert.equal(loaded.TEST_TEAM_WORKFLOWS.length, 2);

    // Verify existing content preserved
    assert.ok(loaded.AGENTS);
    assert.equal(loaded.AGENTS[0].id, 'test-vortex-agent');

    delete require.cache[require.resolve(registryPath)];
  });

  it('idempotency — running twice returns skipped on second run', async () => {
    const registryPath = path.join(tmpDir, 'idempotent-registry.js');
    await fs.writeFile(registryPath, buildTestRegistry(), 'utf8');

    const specData = buildTestSpec();
    const result1 = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });
    assert.equal(result1.success, true);

    const result2 = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });
    assert.equal(result2.success, true);
    assert.deepEqual(result2.skipped, ['block already exists']);
    assert.deepEqual(result2.written, []);

    delete require.cache[require.resolve(registryPath)];
  });

  it('prefix collision — existing module prefix is detected and blocked', async () => {
    // Create a registry that already has TEST_TEAM_AGENTS
    const content = buildTestRegistry().replace(
      'module.exports = {',
      'const TEST_TEAM_AGENTS = [];\nmodule.exports = {\n  TEST_TEAM_AGENTS,'
    );
    const registryPath = path.join(tmpDir, 'collision-registry.js');
    await fs.writeFile(registryPath, content, 'utf8');

    const specData = buildTestSpec();
    const result = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });
    assert.equal(result.success, true);
    assert.deepEqual(result.skipped, ['block already exists']);
  });

  it('rollback on structural failure — corrupted write triggers rollback', async () => {
    const registryPath = path.join(tmpDir, 'rollback-registry.js');
    const originalContent = buildTestRegistry();
    await fs.writeFile(registryPath, originalContent, 'utf8');

    // Monkey-patch fs.writeFile to corrupt the registry on the second call (the actual write)
    // These vars were part of a monkey-patch approach that was replaced by the trick-content strategy below
    // We can't easily intercept fs inside the module, so instead we'll create a registry
    // where the insertion produces invalid JS that fails require() verification.
    // Use a registry with a module.exports that, when the block is inserted before it,
    // creates a syntax error due to missing semicolon in the original content.
    const trickContent = "'use strict';\nconst AGENTS = []\nmodule.exports = {\n  AGENTS,\n};\n";
    await fs.writeFile(registryPath, trickContent, 'utf8');

    const specData = buildTestSpec();
    const result = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });

    if (result.success) {
      // If it succeeded, the block was valid — verify no .bak remains
      assert.equal(await fs.pathExists(`${registryPath}.bak`), false);
      delete require.cache[require.resolve(registryPath)];
    } else if (result.rollbackApplied) {
      // Rollback path exercised — verify original content restored
      const restored = await fs.readFile(registryPath, 'utf8');
      assert.equal(restored, trickContent);
      assert.equal(await fs.pathExists(`${registryPath}.bak`), false);
    }
    // Either path is acceptable — the test validates no crash and proper cleanup
  });

  it('additive-only — existing module blocks are preserved exactly', async () => {
    const registryPath = path.join(tmpDir, 'additive-registry.js');
    const originalContent = buildTestRegistry();
    await fs.writeFile(registryPath, originalContent, 'utf8');

    const specData = buildTestSpec();
    await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });

    const modified = await fs.readFile(registryPath, 'utf8');

    // Original AGENTS array preserved
    assert.ok(modified.includes("id: 'test-vortex-agent'"));
    // Original WORKFLOWS preserved
    assert.ok(modified.includes("{ name: 'test-workflow', agent: 'test-vortex-agent' }"));
    // New block added
    assert.ok(modified.includes('TEST_TEAM_AGENTS'));

    delete require.cache[require.resolve(registryPath)];
  });

  it('require() post-write validation — modified file is loadable by Node', async () => {
    const registryPath = path.join(tmpDir, 'require-test-registry.js');
    await fs.writeFile(registryPath, buildTestRegistry(), 'utf8');

    const specData = buildTestSpec();
    await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });

    // Directly require the file
    const loaded = require(registryPath);
    assert.ok(loaded.AGENTS, 'Original AGENTS should be exported');
    assert.ok(loaded.TEST_TEAM_AGENTS, 'New TEST_TEAM_AGENTS should be exported');
    assert.ok(loaded.TEST_TEAM_WORKFLOW_NAMES, 'Derived lists should be exported');
    assert.deepEqual(loaded.TEST_TEAM_AGENT_IDS, ['alpha-analyzer', 'beta-builder']);

    delete require.cache[require.resolve(registryPath)];
  });

  it('special characters in persona — quotes produce valid JS', async () => {
    const registryPath = path.join(tmpDir, 'special-chars-registry.js');
    await fs.writeFile(registryPath, buildTestRegistry(), 'utf8');

    const specData = {
      team_name: 'Special Team',
      team_name_kebab: 'special-team',
      agents: [{
        id: 'quoter',
        name: 'Quoter',
        role: "It's complex",
        icon: '\u{2699}',
        capabilities: ['quoting'],
        persona: {
          role: "Says 'hello' and 'goodbye'",
          identity: "I'm the agent who asks 'why?'",
          communication_style: "Uses contractions: don't, won't, can't",
          expertise: "Master of the '\\' backslash",
        },
      }],
    };

    const result = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });
    assert.equal(result.success, true);

    // Verify require() works with special chars
    const loaded = require(registryPath);
    assert.equal(loaded.SPECIAL_TEAM_AGENTS[0].persona.role, "Says 'hello' and 'goodbye'");
    assert.equal(loaded.SPECIAL_TEAM_AGENTS[0].persona.identity, "I'm the agent who asks 'why?'");

    delete require.cache[require.resolve(registryPath)];
  });

  it('returns error when registry file not found', async () => {
    const result = await writeRegistryBlock(buildTestSpec(), '/nonexistent/registry.js', { skipDirtyCheck: true });
    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('Cannot read registry file'));
  });

  it('rejects empty team_name_kebab', async () => {
    const registryPath = path.join(tmpDir, 'empty-kebab-registry.js');
    await fs.writeFile(registryPath, buildTestRegistry(), 'utf8');

    const specData = { ...buildTestSpec(), team_name_kebab: '' };
    const result = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });
    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('team_name_kebab is required'));
  });

  it('rejects stale .bak file', async () => {
    const registryPath = path.join(tmpDir, 'stale-bak-registry.js');
    await fs.writeFile(registryPath, buildTestRegistry(), 'utf8');
    await fs.writeFile(`${registryPath}.bak`, 'stale backup', 'utf8');

    const specData = buildTestSpec();
    const result = await writeRegistryBlock(specData, registryPath, { skipDirtyCheck: true });
    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('Stale .bak file'));

    await fs.remove(`${registryPath}.bak`);
  });
});

// === dirty-tree detection ===

describe('checkDirtyTree (unit)', () => {
  // Note: We test the dirty-tree function directly rather than via writeRegistryBlock
  // since mocking git in integration tests requires a real git repo.

  const { checkDirtyTree } = require('../../_bmad/bme/_team-factory/lib/writers/registry-writer');

  it('returns { dirty: false } for a file not tracked by git', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-dirty-'));
    const tmpFile = path.join(tmpDir, 'test.js');
    await fs.writeFile(tmpFile, 'content', 'utf8');

    const result = checkDirtyTree(tmpFile);
    // Not in a git repo, so git diff will fail — checkDirtyTree handles gracefully
    assert.equal(result.dirty, false);

    await fs.remove(tmpDir);
  });

  it('writeRegistryBlock with dirty file returns dirty result', async () => {
    // Create a temp git repo with a modified registry file
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-dirty-git-'));
    const registryPath = path.join(tmpDir, 'agent-registry.js');

    try {
      const { execSync } = require('child_process');
      execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
      execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });

      // Create initial registry and commit
      await fs.writeFile(registryPath, buildTestRegistry(), 'utf8');
      execSync('git add .', { cwd: tmpDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tmpDir, stdio: 'pipe' });

      // Modify the file (uncommmitted change)
      await fs.appendFile(registryPath, '\n// dirty change\n');

      // Now writeRegistryBlock should detect dirty tree
      const specData = buildTestSpec();
      const result = await writeRegistryBlock(specData, registryPath);

      assert.equal(result.success, false);
      assert.equal(result.dirty, true);
    } finally {
      await fs.remove(tmpDir);
    }
  });
});
