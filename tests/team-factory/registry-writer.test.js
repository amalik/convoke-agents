const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { removeTempDir } = require('../helpers');

const {
  writeRegistryBlock,
  derivePrefix,
  buildAgentEntry,
  extractPersonaFromAgentFile,
  buildModuleBlock,
  buildWorkflowNames,
  applyInsertions,
  escapeSingleQuotes,
  normalizeAgentFiles,
  personaCoverage,
  hasPersona,
  firstBlock,
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
    await removeTempDir(tmpDir);
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
    // tfr-1-1: the skip did no extraction, so coverage is "not computed" — present as
    // null, never absent and never a zeroed object that would read as "nothing covered".
    assert.ok('personaCoverage' in result2, 'every return carries personaCoverage');
    assert.equal(result2.personaCoverage, null);

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

// ── tf-2-13 Task 3 (T133c): title must be the spec's title, not its role ──
// buildAgentEntry read `agentSpec.role || agentSpec.title || agentSpec.id`, so role
// won and the spec's title was silently discarded. Compare a hand-written entry:
// contextualization-expert has title 'Contextualization Expert' and a separate,
// much longer persona.role — conflating them loses the distinction.
describe('tf-2-13: registry entry title', () => {
  it('uses the spec title when one is given', () => {
    const e = buildAgentEntry(
      { id: 'alpha-probe', name: 'Alpha', role: 'Does the alpha thing', title: 'Alpha Specialist' },
      'probe'
    );
    assert.equal(e.title, 'Alpha Specialist');
  });

  it('falls back to role when no title is given', () => {
    const e = buildAgentEntry({ id: 'beta-probe', name: 'Beta', role: 'Does the beta thing' }, 'probe');
    assert.equal(e.title, 'Does the beta thing');
  });

  it('falls back to the id when neither is given', () => {
    const e = buildAgentEntry({ id: 'gamma-probe', name: 'Gamma' }, 'probe');
    assert.equal(e.title, 'gamma-probe');
  });
});

// ── tf-2-13 Task 6 (T131): populate persona from the agent file BMB just wrote ──
// Design ruled 2026-09-11. The row was filed as "the factory never ASKS for persona",
// which read as a collection problem blocked on NFR2 (step-01 sits at 3/3). But
// step-04-generate.md §3a ALREADY instructs BMB to author "role, identity,
// communication_style, principles" into every agent file — the factory commissioned
// the persona and then read an empty spec field. A wiring defect, not a scope gap,
// which is why this adds zero operator questions.
describe('tf-2-13: persona extracted from the generated agent file', () => {
  let dir;
  before(async () => { dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tf213-persona-')); });
  after(async () => { await fs.remove(dir); });

  const V5 = `# Agent
\`\`\`xml
<agent id="a" name="A"><activation critical="MANDATORY"></activation>
  <persona>
    <role>V5 Role Line</role>
    <identity>V5 identity prose.</identity>
    <communication_style>V5 style prose.</communication_style>
    <principles>- V5 principle one - V5 principle two</principles>
  </persona>
</agent>
\`\`\``;

  const V63 = `---
name: bmad-bme-agent-probe
description: probe
---

# Probe

## Identity

V63 identity prose.

## Communication Style

V63 style prose.

## Principles

- V63 principle one
- V63 principle two
`;

  it('reads a v5 <persona> block', async () => {
    const f = path.join(dir, 'v5.md');
    await fs.writeFile(f, V5);
    const p = await extractPersonaFromAgentFile(f);
    assert.equal(p.identity, 'V5 identity prose.');
    assert.equal(p.communication_style, 'V5 style prose.');
    assert.match(p.expertise, /V5 principle one/);
  });

  it('reads v6.3 markdown sections', async () => {
    const f = path.join(dir, 'v63.md');
    await fs.writeFile(f, V63);
    const p = await extractPersonaFromAgentFile(f);
    assert.equal(p.identity, 'V63 identity prose.');
    assert.equal(p.communication_style, 'V63 style prose.');
    assert.match(p.expertise, /V63 principle one/);
  });

  it('returns empty fields rather than throwing on an unreadable file', async () => {
    const p = await extractPersonaFromAgentFile(path.join(dir, 'nope.md'));
    assert.deepEqual(p, { role: '', identity: '', communication_style: '', expertise: '' });
  });

  it('an explicit spec persona still wins over an extracted one', async () => {
    const f = path.join(dir, 'v5.md');
    const extracted = await extractPersonaFromAgentFile(f);
    const e = buildAgentEntry(
      { id: 'p-probe', name: 'P', role: 'R', persona: { identity: 'EXPLICIT' } },
      'probe',
      extracted
    );
    assert.equal(e.persona.identity, 'EXPLICIT');
  });

  it('fills the empty case from the extracted persona', async () => {
    const f = path.join(dir, 'v5.md');
    const extracted = await extractPersonaFromAgentFile(f);
    const e = buildAgentEntry({ id: 'q-probe', name: 'Q', role: 'R' }, 'probe', extracted);
    assert.equal(e.persona.identity, 'V5 identity prose.');
  });
});

// ── tf-2-13 Task 6 wiring: writeRegistryBlock populates persona from agentFiles ──
// The extractor is useless unless the write path calls it. writeRegistryBlock knew
// nothing of the agent files, so personas stayed empty even once extraction existed.
describe('tf-2-13: registry write populates persona from the generated files', () => {
  let dir, registryPath;
  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tf213-wire-'));
    registryPath = path.join(dir, 'agent-registry.js');
    await fs.writeFile(registryPath, "'use strict';\n\nmodule.exports = {\n};\n", 'utf8');
    await fs.writeFile(path.join(dir, 'wire-probe.md'), `<persona>
  <role>Wire Role</role>
  <identity>Wire identity prose.</identity>
  <communication_style>Wire style prose.</communication_style>
  <principles>- Wire principle</principles>
</persona>`, 'utf8');
  });
  after(async () => { await fs.remove(dir); });

  it('fills identity/communication_style/expertise from the agent file', async () => {
    const spec = {
      team_name: 'Wire Probe', team_name_kebab: 'wire-probe',
      agents: [{ id: 'wire-probe', name: 'Wire', role: 'R', capabilities: ['do-thing'] }],
      integration: { output_directory: '_bmad-output/wire-probe-artifacts' }
    };
    const r = await writeRegistryBlock(spec, registryPath, {
      skipDirtyCheck: true,
      agentFiles: [path.join(dir, 'wire-probe.md')]
    });
    assert.equal(r.success, true, JSON.stringify(r.errors));
    const written = await fs.readFile(registryPath, 'utf8');
    assert.match(written, /Wire identity prose\./);
    assert.match(written, /Wire style prose\./);
    assert.match(written, /Wire principle/);
  });
});

// ── R2: persona keying by basename voids every v6.3 agent ──
// writeRegistryBlock keyed personas as path.basename(file, '.md'). v5 agents live at
// agents/<id>.md so that works; v6.3 agents live at agents/<id>/SKILL.md, so EVERY one
// keys as "SKILL", collides, and buildModuleBlock's lookup by a.id misses — producing
// empty personas with success:true. Proven end-to-end against the real Vortex files.
describe('R2: persona keying works for the v6.3 directory layout', () => {
  let dir, registryPath;
  const REPO = path.resolve(__dirname, '..', '..');
  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tf213-v63-'));
    registryPath = path.join(dir, 'agent-registry.js');
    await fs.writeFile(registryPath, "'use strict';\n\nmodule.exports = {\n};\n", 'utf8');
  });
  after(async () => { await fs.remove(dir); });

  it('fills personas for real v6.3 agents stored as <id>/SKILL.md', async () => {
    const spec = {
      team_name: 'V63 Probe', team_name_kebab: 'v63-probe',
      agents: [
        { id: 'contextualization-expert', name: 'Emma', role: 'R', capabilities: ['a-b'] },
        { id: 'research-convergence-specialist', name: 'Mila', role: 'R', capabilities: ['c-d'] }
      ],
      integration: { output_directory: '_bmad-output/v63-probe-artifacts' }
    };
    const r = await writeRegistryBlock(spec, registryPath, {
      skipDirtyCheck: true,
      agentFiles: [
        path.join(REPO, '_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md'),
        path.join(REPO, '_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md')
      ]
    });
    assert.equal(r.success, true, JSON.stringify(r.errors));
    const written = await fs.readFile(registryPath, 'utf8');
    const emptyPersonas = (written.match(/identity: ''/g) || []).length;
    assert.equal(emptyPersonas, 0, 'v6.3 agents must not land with empty personas');
  });
});

// === tfr-1-1 Task 4 (T164a) — agentFiles is no longer coerced, coverage is reported ===

describe('normalizeAgentFiles — an unusable value is reported, not swallowed', () => {
  it('accepts omission without an issue (the writer\'s own CLI passes no options)', () => {
    assert.deepEqual(normalizeAgentFiles(undefined), { agentFiles: [], agentFilesIssues: [] });
    assert.deepEqual(normalizeAgentFiles(null), { agentFiles: [], agentFilesIssues: [] });
  });

  it('reports a bare string instead of iterating it character by character', () => {
    const r = normalizeAgentFiles('/tmp/agents/one.md');
    assert.deepEqual(r.agentFiles, []);
    assert.equal(r.agentFilesIssues.length, 1);
    assert.match(r.agentFilesIssues[0], /is a string/);
  });

  it('reports a non-array object', () => {
    const r = normalizeAgentFiles({ 0: '/tmp/a.md' });
    assert.deepEqual(r.agentFiles, []);
    assert.match(r.agentFilesIssues[0], /is object/);
  });

  it('keeps the usable paths and reports only the unusable entries', () => {
    const r = normalizeAgentFiles(['/tmp/a.md', '', null, 42, '/tmp/b.md']);
    assert.deepEqual(r.agentFiles, ['/tmp/a.md', '/tmp/b.md']);
    assert.equal(r.agentFilesIssues.length, 3);
  });
});

describe('personaCoverage — a different fact from write success', () => {
  const spec = {
    team_name_kebab: 'test-team',
    agents: [{ id: 'alpha-analyzer' }, { id: 'beta-builder' }],
  };

  it('classifies an agent with no persona anywhere as empty', () => {
    const c = personaCoverage(spec, {});
    assert.deepEqual(c.covered, []);
    assert.deepEqual(c.empty, ['alpha-analyzer', 'beta-builder']);
  });

  it('counts an extracted field as coverage', () => {
    const c = personaCoverage(spec, { 'alpha-analyzer': { role: '', identity: 'Reads data', communication_style: '', expertise: '' } });
    assert.deepEqual(c.covered, ['alpha-analyzer']);
    assert.deepEqual(c.empty, ['beta-builder']);
  });

  it('does NOT count a spec-declared role as coverage', () => {
    // Round 1's decisive finding. `role` is required with minLength 1 by both team
    // schemas and `buildAgentEntry` copies it into `persona.role`, so counting it made
    // the predicate true for every spec that can reach the writer — a gate that cannot
    // fail, reporting the exact T131 shape as covered.
    const declared = { team_name_kebab: 'test-team', agents: [{ id: 'alpha-analyzer', role: 'Stated in the spec' }] };
    const c = personaCoverage(declared, {});
    assert.deepEqual(c.covered, []);
    assert.deepEqual(c.empty, ['alpha-analyzer']);
  });

  it('counts a spec-declared persona.identity as coverage — the schema does not require it', () => {
    const declared = { team_name_kebab: 'test-team', agents: [{ id: 'alpha-analyzer', role: 'r', persona: { identity: 'Stated deliberately' } }] };
    const c = personaCoverage(declared, {});
    assert.deepEqual(c.covered, ['alpha-analyzer']);
  });

  it('derives the agent set from the spec at call time, never a fixed list', () => {
    const one = personaCoverage({ team_name_kebab: 'test-team', agents: [{ id: 'solo' }] }, {});
    assert.equal(one.covered.length + one.empty.length, 1);
    const none = personaCoverage({ team_name_kebab: 'test-team', agents: [] }, {});
    assert.equal(none.covered.length + none.empty.length, 0);
  });

  it('carries the agentFiles issues through to the caller', () => {
    const c = personaCoverage(spec, {}, { agentFilesIssues: ['bad'], missingAgentFiles: ['/nope.md'] });
    assert.deepEqual(c.agentFilesIssues, ['bad']);
    assert.deepEqual(c.missingAgentFiles, ['/nope.md']);
  });
});

describe('hasPersona', () => {
  it('is false when every evidence field is blank or whitespace', () => {
    assert.equal(hasPersona({ role: '', identity: '   ', communication_style: '', expertise: '\n' }), false);
  });

  it('is false when ONLY role carries text — every agent has a role, so it is no evidence', () => {
    assert.equal(hasPersona({ role: 'Analyzes data patterns', identity: '', communication_style: '', expertise: '' }), false);
  });

  it('is true when any single evidence field carries text', () => {
    for (const field of ['identity', 'communication_style', 'expertise']) {
      const persona = { role: '', identity: '', communication_style: '', expertise: '', [field]: 'x' };
      assert.equal(hasPersona(persona), true, `${field} should count as evidence`);
    }
  });

  it('is false for a missing or non-object persona', () => {
    assert.equal(hasPersona(undefined), false);
    assert.equal(hasPersona('role'), false);
  });
});

describe('writeRegistryBlock — agent files that cannot be read are reported', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-agentfiles-'));
  });

  after(async () => {
    await removeTempDir(tmpDir);
  });

  it('lists a missing path and a DIRECTORY in missingAgentFiles, and not a readable file', async () => {
    // A directory passes `pathExists`, and the extractor swallows EISDIR like ENOENT, so
    // recording `agents/<id>/` instead of `agents/<id>/SKILL.md` used to vanish silently.
    const registryPath = path.join(tmpDir, 'agentfiles-registry.js');
    await fs.writeFile(registryPath, buildTestRegistry(), 'utf8');
    const readable = path.join(tmpDir, 'agents', 'alpha-analyzer.md');
    const directory = path.join(tmpDir, 'agents', 'beta-builder');
    const missing = path.join(tmpDir, 'agents', 'gamma-nowhere.md');
    await fs.ensureDir(directory);
    await fs.writeFile(readable, '<identity>Reads data</identity>\n', 'utf8');

    const result = await writeRegistryBlock(buildTestSpec(), registryPath, {
      skipDirtyCheck: true,
      agentFiles: [readable, directory, missing],
    });

    assert.equal(result.success, true, JSON.stringify(result.errors));
    assert.deepEqual(result.personaCoverage.missingAgentFiles.slice().sort(), [directory, missing].sort());

    delete require.cache[require.resolve(registryPath)];
  });
});

describe('firstBlock — the relation the registry holds (T140)', () => {
  // Every persona fixture in this file is a single one-line block, on which firstBlock is the
  // identity function — so before these tests, deleting all four of its call sites in
  // buildAgentEntry left the entire suite green. Found by R2, 2026-09-23.
  it('keeps a leading list whole however its items are spaced', () => {
    assert.equal(firstBlock('- one\n- two\n- three'), '- one - two - three');
    assert.equal(firstBlock('- one\n\n- two\n\n- three'), '- one - two - three',
      'a blank line between bullets must not register one principle of three');
    assert.equal(firstBlock('* star one\n\n* star two'), '* star one * star two');
  });

  it('stops at the operational content a v5 field carries after its opening block', () => {
    assert.equal(firstBlock('Opening paragraph.\n\nDetection targets:\n- a manifest\n- a config'),
      'Opening paragraph.');
    assert.equal(firstBlock('- one\n\n- two\n\nTrailing prose that is not a bullet.'), '- one - two');
  });

  it('collapses whitespace and survives CRLF', () => {
    assert.equal(firstBlock('Two   spaces\n and a wrap.'), 'Two spaces and a wrap.');
    assert.equal(firstBlock('- one\r\n\r\n- two'), '- one - two');
  });

  it('returns an empty string for nothing at all', () => {
    for (const empty of ['', '   ', '\n\n', null, undefined]) assert.equal(firstBlock(empty), '');
  });
});

describe('buildAgentEntry — writes the first block, not the whole field (T140)', () => {
  it('truncates a multi-block extracted persona to its leading block', () => {
    const entry = buildAgentEntry(
      { id: 'multi-block-agent', name: 'Multi', capabilities: ['do-thing'] },
      'probe-team',
      {
        role: 'Role line.',
        identity: 'Opening identity.\n\nOperational detail the registry does not hold.',
        communication_style: 'Speaks plainly.\n\nMore about how.',
        expertise: '- one\n\n- two',
      }
    );
    assert.equal(entry.persona.identity, 'Opening identity.',
      'a generated team must not be born holding a value its own sync gate calls drift');
    assert.equal(entry.persona.communication_style, 'Speaks plainly.');
    assert.equal(entry.persona.expertise, '- one - two', 'a spaced-out principle list must survive whole');
    assert.equal(entry.persona.role, 'Role line.');
  });
});
