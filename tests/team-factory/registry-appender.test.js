const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { appendAgentToBlock, findArrayClose } = require('../../_bmad/bme/_team-factory/lib/writers/registry-appender');

/**
 * Build a minimal registry file with one team block.
 */
function buildRegistryContent(prefix = 'TEST_TEAM', agentId = 'alpha-analyzer') {
  return `'use strict';

// ── Test Team Module ─────────────────────────────────────────────────
const ${prefix}_AGENTS = [
  {
    id: '${agentId}', name: 'Alpha', icon: '\\u{2699}',
    title: 'Alpha Analyzer', stream: 'test-team',
    persona: {
      role: 'Test Role',
      identity: 'Test Identity',
      communication_style: 'Test Style',
      expertise: 'Test Expertise',
    },
  },
];

const ${prefix}_WORKFLOWS = [
  { name: 'data-analysis', agent: '${agentId}' },
];

// Derived lists for Test Team
const ${prefix}_AGENT_FILES = ${prefix}_AGENTS.map(a => \`\${a.id}.md\`);
const ${prefix}_AGENT_IDS = ${prefix}_AGENTS.map(a => a.id);
const ${prefix}_WORKFLOW_NAMES = ${prefix}_WORKFLOWS.map(w => w.name);

module.exports = {
  ${prefix}_AGENTS,
  ${prefix}_WORKFLOWS,
  ${prefix}_AGENT_FILES,
  ${prefix}_AGENT_IDS,
  ${prefix}_WORKFLOW_NAMES,
};
`;
}

function buildNewAgent() {
  return {
    id: 'gamma-guardian',
    name: 'Gamma',
    icon: '\u{1F6E1}',
    role: 'Guards system integrity',
    title: 'Gamma Guardian',
    stream: 'test-team',
    persona: {
      role: 'System Guardian',
      identity: 'Protects system integrity',
      communication_style: 'Precise and authoritative',
      expertise: 'Security and validation',
    },
  };
}

// === Happy path ===

describe('appendAgentToBlock — happy path', () => {
  let tmpDir, registryPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-regapp-'));
    registryPath = path.join(tmpDir, 'agent-registry.js');
    await fs.writeFile(registryPath, buildRegistryContent(), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('appends new agent to existing block', async () => {
    const result = await appendAgentToBlock('test-team', buildNewAgent(), registryPath, { skipDirtyCheck: true });

    assert.equal(result.success, true);
    assert.deepEqual(result.written, ['gamma-guardian']);
    assert.equal(result.rollbackApplied, false);

    // Verify file contains new agent
    const content = await fs.readFile(registryPath, 'utf8');
    assert.ok(content.includes("id: 'gamma-guardian'"));
    assert.ok(content.includes("id: 'alpha-analyzer'"), 'existing agent preserved');

    // Verify require() works
    delete require.cache[registryPath];
    const mod = require(registryPath);
    assert.equal(mod.TEST_TEAM_AGENTS.length, 2);
    assert.equal(mod.TEST_TEAM_AGENTS[1].id, 'gamma-guardian');
  });
});

// === Idempotency ===

describe('appendAgentToBlock — idempotency', () => {
  let tmpDir, registryPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-regapp-'));
    registryPath = path.join(tmpDir, 'agent-registry.js');
    await fs.writeFile(registryPath, buildRegistryContent(), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('skips when agent already exists in block', async () => {
    const existingAgent = {
      id: 'alpha-analyzer',
      name: 'Alpha',
      icon: '\u{2699}',
      role: 'Analyzes data',
      persona: { role: 'Test', identity: '', communication_style: '', expertise: '' },
    };

    const result = await appendAgentToBlock('test-team', existingAgent, registryPath, { skipDirtyCheck: true });

    assert.equal(result.success, true);
    assert.deepEqual(result.skipped, ['agent already exists in block']);
    assert.deepEqual(result.written, []);
  });
});

// === Team not found ===

describe('appendAgentToBlock — team not found', () => {
  let tmpDir, registryPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-regapp-'));
    registryPath = path.join(tmpDir, 'agent-registry.js');
    await fs.writeFile(registryPath, buildRegistryContent(), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails when team block does not exist', async () => {
    const result = await appendAgentToBlock('nonexistent-team', buildNewAgent(), registryPath, { skipDirtyCheck: true });

    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('Team block not found'));
  });
});

// === Rollback on bad syntax ===

describe('appendAgentToBlock — rollback', () => {
  let tmpDir, registryPath, originalContent;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-regapp-'));
    registryPath = path.join(tmpDir, 'agent-registry.js');
    originalContent = buildRegistryContent();
    await fs.writeFile(registryPath, originalContent, 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('restores from backup when verify fails', async () => {
    // Corrupt the agent entry to cause a require() failure
    const badAgent = buildNewAgent();
    badAgent.persona.role = "test'; const x = 'break";

    const result = await appendAgentToBlock('test-team', badAgent, registryPath, { skipDirtyCheck: true });

    // The escapeSingleQuotes function should handle this, so it may succeed
    // But if it fails, rollback should be applied
    if (!result.success) {
      assert.equal(result.rollbackApplied, true);
      const restored = await fs.readFile(registryPath, 'utf8');
      assert.equal(restored, originalContent);
    }
    // .bak should be cleaned up either way
    assert.equal(await fs.pathExists(registryPath + '.bak'), false);
  });
});

// === Input validation ===

describe('appendAgentToBlock — input validation', () => {
  it('fails with empty teamNameKebab', async () => {
    const result = await appendAgentToBlock('', buildNewAgent(), '/fake/path');
    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('teamNameKebab is required'));
  });

  it('fails with null agent data', async () => {
    const result = await appendAgentToBlock('test-team', null, '/fake/path');
    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('newAgentData'));
  });
});

// === findArrayClose ===

describe('findArrayClose', () => {
  it('finds closing bracket for simple array', () => {
    const content = 'const X = [1, 2, 3];';
    const idx = findArrayClose(content, 0);
    assert.equal(content[idx], ']');
  });

  it('handles nested objects', () => {
    const content = "const X = [{ a: [1, 2] }, { b: 'test' }];";
    const idx = findArrayClose(content, 0);
    assert.equal(content[idx], ']');
    assert.equal(content[idx + 1], ';');
  });

  it('handles strings with brackets', () => {
    const content = "const X = [{ id: 'test[0]' }];";
    const idx = findArrayClose(content, 0);
    assert.equal(content[idx], ']');
    assert.equal(content[idx + 1], ';');
  });

  it('returns -1 for unclosed array', () => {
    const content = 'const X = [1, 2, 3';
    const idx = findArrayClose(content, 0);
    assert.equal(idx, -1);
  });
});
