const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const {
  checkStaleReferences,
  checkBrokenLinks,
  checkBrokenPaths,
  checkDocsCoverage,
  checkIncompleteAgentTables,
  checkInternalNamingLeaks,
  formatReport,
  runAudit,
  USER_FACING_DOCS,
} = require('../../scripts/docs-audit');

const { AGENTS, WORKFLOWS, WORKFLOW_NAMES } = require('../../scripts/update/lib/agent-registry');
const { runScript } = require('../helpers');

// === checkStaleReferences ===

describe('checkStaleReferences', () => {
  const agentCount = AGENTS.length;      // 7
  const workflowCount = WORKFLOWS.length; // 22

  it('detects stale digit agent count', () => {
    const content = 'We support 4 agents in the Vortex.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, 'stale-reference');
    assert.equal(findings[0].current, '4 agents');
    assert.equal(findings[0].expected, `${agentCount} agents`);
    assert.equal(findings[0].line, 1);
  });

  it('detects stale written-out agent count', () => {
    const content = 'The system has four agents.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].current, 'four agents');
  });

  it('does not flag correct agent count', () => {
    const content = `There are ${agentCount} agents in the Vortex.`;
    const findings = checkStaleReferences(content, 'test.md');
    const agentFindings = findings.filter(f => f.current.includes('agent'));
    assert.equal(agentFindings.length, 0);
  });

  it('detects stale digit workflow count', () => {
    const content = 'Includes 13 workflows for validation.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].current, '13 workflows');
    assert.equal(findings[0].expected, `${workflowCount} workflows`);
  });

  it('detects stale written-out workflow count', () => {
    const content = 'We ship thirteen workflows.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].current, 'thirteen workflows');
  });

  it('does not flag correct workflow count', () => {
    const content = `Ships with ${workflowCount} workflows.`;
    const findings = checkStaleReferences(content, 'test.md');
    const wfFindings = findings.filter(f => f.current.includes('workflow'));
    assert.equal(wfFindings.length, 0);
  });

  it('detects contradictory terminology "original agents"', () => {
    const content = 'The original agents were Emma and Wade.';
    const findings = checkStaleReferences(content, 'test.md');
    const contradictory = findings.filter(f => f.current.toLowerCase().includes('original'));
    assert.ok(contradictory.length >= 1);
    assert.equal(contradictory[0].category, 'stale-reference');
  });

  it('detects contradictory "original four"', () => {
    const content = 'The original four shipped in v1.0.';
    const findings = checkStaleReferences(content, 'test.md');
    const contradictory = findings.filter(f => f.current.toLowerCase().includes('original'));
    assert.ok(contradictory.length >= 1);
  });

  it('detects contradictory "initial agents"', () => {
    const content = 'The initial agents were limited.';
    const findings = checkStaleReferences(content, 'test.md');
    const contradictory = findings.filter(f => f.current.toLowerCase().includes('initial'));
    assert.ok(contradictory.length >= 1);
  });

  it('reports correct file path and line number', () => {
    const content = 'Line 1\nLine 2\nWe have 4 agents here\nLine 4';
    const findings = checkStaleReferences(content, 'docs/test.md');
    assert.equal(findings[0].file, 'docs/test.md');
    assert.equal(findings[0].line, 3);
  });

  it('detects multiple findings in single file', () => {
    const content = 'We have 4 agents and 13 workflows.\nPlus the original agents.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.ok(findings.length >= 3); // 4 agents, 13 workflows, original agents
  });

  it('returns empty array for clean content', () => {
    const content = 'This is a normal paragraph with no stale references.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.equal(findings.length, 0);
  });
});

// === checkBrokenLinks ===

describe('checkBrokenLinks', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-audit-'));
    // Create some target files for valid links
    await fs.ensureDir(path.join(tmpDir, 'docs'));
    await fs.writeFile(path.join(tmpDir, 'docs', 'exists.md'), '# Exists', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'README.md'), '# README', 'utf8');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('detects broken internal links', () => {
    const content = 'See [guide](docs/missing-file.md) for details.';
    const findings = checkBrokenLinks(content, 'README.md', tmpDir);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, 'broken-link');
    assert.equal(findings[0].current, 'docs/missing-file.md');
  });

  it('does not flag valid internal links', () => {
    const content = 'See [docs](docs/exists.md) for details.';
    const findings = checkBrokenLinks(content, 'README.md', tmpDir);
    assert.equal(findings.length, 0);
  });

  it('skips external URLs', () => {
    const content = 'Visit [site](https://example.com) for info.';
    const findings = checkBrokenLinks(content, 'README.md', tmpDir);
    assert.equal(findings.length, 0);
  });

  it('skips anchor-only links', () => {
    const content = 'Jump to [section](#overview).';
    const findings = checkBrokenLinks(content, 'README.md', tmpDir);
    assert.equal(findings.length, 0);
  });

  it('skips mailto links', () => {
    const content = 'Contact [us](mailto:test@example.com).';
    const findings = checkBrokenLinks(content, 'README.md', tmpDir);
    assert.equal(findings.length, 0);
  });

  it('strips anchor from path before checking existence', () => {
    const content = 'See [section](docs/exists.md#heading) for details.';
    const findings = checkBrokenLinks(content, 'README.md', tmpDir);
    assert.equal(findings.length, 0);
  });

  it('reports correct line number', () => {
    const content = 'Line 1\nLine 2\n[broken](nope.md)\nLine 4';
    const findings = checkBrokenLinks(content, 'README.md', tmpDir);
    assert.equal(findings[0].line, 3);
  });

  it('resolves relative links from subdirectory docs', () => {
    // A link in docs/sub.md pointing to ../README.md should resolve to tmpDir/README.md
    const content = 'See [readme](../README.md) for details.';
    const findings = checkBrokenLinks(content, 'docs/sub.md', tmpDir);
    assert.equal(findings.length, 0);
  });
});

// === checkBrokenPaths ===

describe('checkBrokenPaths', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-audit-'));
    await fs.ensureDir(path.join(tmpDir, 'scripts'));
    await fs.writeFile(path.join(tmpDir, 'scripts', 'exists.js'), '// ok', 'utf8');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('detects broken backtick-wrapped paths', () => {
    const content = 'Run `scripts/missing-file.js` to check.';
    const findings = checkBrokenPaths(content, 'README.md', tmpDir);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, 'broken-path');
    assert.equal(findings[0].current, 'scripts/missing-file.js');
  });

  it('does not flag existing paths', () => {
    const content = 'Run `scripts/exists.js` to check.';
    const findings = checkBrokenPaths(content, 'README.md', tmpDir);
    assert.equal(findings.length, 0);
  });

  it('skips paths with wildcards', () => {
    const content = 'Files matching `scripts/*.js` are included.';
    const findings = checkBrokenPaths(content, 'README.md', tmpDir);
    assert.equal(findings.length, 0);
  });

  it('skips paths with template variables', () => {
    const content = 'Config at `scripts/{name}/config.js`.';
    const findings = checkBrokenPaths(content, 'README.md', tmpDir);
    assert.equal(findings.length, 0);
  });

  it('detects broken _bmad/ prefixed paths', () => {
    const content = 'Agent at `_bmad/agents/missing.md`.';
    const findings = checkBrokenPaths(content, 'README.md', tmpDir);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].current, '_bmad/agents/missing.md');
  });

  it('detects broken docs/ prefixed paths', () => {
    const content = 'See `docs/missing-guide.md` for reference.';
    const findings = checkBrokenPaths(content, 'README.md', tmpDir);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].current, 'docs/missing-guide.md');
  });
});

// === checkDocsCoverage ===

describe('checkDocsCoverage', () => {
  it('reports agents with no docs coverage', () => {
    // Provide docs content that mentions no agents at all
    const findings = checkDocsCoverage(['This doc has no agent references.']);
    const agentFindings = findings.filter(f =>
      f.current.includes('agent') && f.category === 'missing-coverage'
    );
    // Should flag all 7 agents
    assert.equal(agentFindings.length, AGENTS.length);
  });

  it('reports workflows with no docs coverage', () => {
    const findings = checkDocsCoverage(['This doc has no workflow references.']);
    const wfFindings = findings.filter(f =>
      f.current.includes('workflow') && f.category === 'missing-coverage'
    );
    assert.equal(wfFindings.length, WORKFLOW_NAMES.length);
  });

  it('does not flag agents that are mentioned', () => {
    // Mention all agent names
    const allNames = AGENTS.map(a => a.name).join(' ');
    const allWorkflows = WORKFLOW_NAMES.join(' ');
    const content = `${allNames} ${allWorkflows}`;
    const findings = checkDocsCoverage([content]);
    assert.equal(findings.length, 0);
  });

  it('is case-insensitive for agent name matching', () => {
    const allNames = AGENTS.map(a => a.name.toLowerCase()).join(' ');
    const allWorkflows = WORKFLOW_NAMES.join(' ');
    const findings = checkDocsCoverage([`${allNames} ${allWorkflows}`]);
    assert.equal(findings.length, 0);
  });

  it('does not false-match agent names as substrings', () => {
    // "maximize" contains "max" but should not satisfy Max agent coverage
    const otherAgents = AGENTS.filter(a => a.name !== 'Max').map(a => a.name).join(' ');
    const content = `${otherAgents} maximize ${WORKFLOW_NAMES.join(' ')}`;
    const findings = checkDocsCoverage([content]);
    const maxFinding = findings.filter(f => f.current.includes('Max'));
    assert.equal(maxFinding.length, 1);
  });
});

// === checkIncompleteAgentTables ===

describe('checkIncompleteAgentTables', () => {
  it('flags a listing table missing agents', () => {
    // Build a table with one agent per row, but omit one
    const names = AGENTS.map(a => a.name);
    const included = names.slice(0, -1); // drop last agent
    const rows = included.map(n => `| ${n} | description |`);
    const content = [
      '| Agent | Description |',
      '|-------|-------------|',
      ...rows,
    ].join('\n');
    const findings = checkIncompleteAgentTables(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, 'incomplete-agent-table');
    assert.ok(findings[0].expected.includes(names[names.length - 1]));
  });

  it('skips relationship tables with multiple agents per row', () => {
    // Contract-flow style: "Isla → Mila", "Mila → Liam", etc.
    const content = [
      '| Contract | Flow |',
      '|----------|------|',
      '| HC1 | Isla → Mila |',
      '| HC2 | Mila → Liam |',
      '| HC3 | Liam → Wade |',
      '| HC4 | Wade → Noah |',
      '| HC5 | Noah → Max |',
    ].join('\n');
    const findings = checkIncompleteAgentTables(content, 'test.md');
    assert.equal(findings.length, 0);
  });

  it('does not flag tables with fewer than threshold agents', () => {
    const content = [
      '| Agent | Role |',
      '|-------|------|',
      '| Emma | Contextualize |',
      '| Isla | Empathize |',
      '| Mila | Synthesize |',
    ].join('\n');
    const findings = checkIncompleteAgentTables(content, 'test.md');
    assert.equal(findings.length, 0);
  });

  it('does not flag complete agent tables', () => {
    const rows = AGENTS.map(a => `| ${a.name} | ${a.id} |`);
    const content = [
      '| Agent | ID |',
      '|-------|----|',
      ...rows,
    ].join('\n');
    const findings = checkIncompleteAgentTables(content, 'test.md');
    assert.equal(findings.length, 0);
  });

  it('returns empty array for content with no tables', () => {
    const content = 'No tables here, just prose about agents.';
    const findings = checkIncompleteAgentTables(content, 'test.md');
    assert.equal(findings.length, 0);
  });

  it('flags at exact threshold (agentCount - 2 agents present)', () => {
    // Build a table with exactly minForFlag agents (threshold boundary)
    const names = AGENTS.map(a => a.name);
    const threshold = names.length - 2; // e.g., 5 out of 7
    const included = names.slice(0, threshold);
    const rows = included.map(n => `| ${n} | description |`);
    const content = [
      '| Agent | Description |',
      '|-------|-------------|',
      ...rows,
    ].join('\n');
    const findings = checkIncompleteAgentTables(content, 'test.md');
    assert.equal(findings.length, 1, `table with ${threshold}/${names.length} agents should trigger`);
  });

  it('does not flag just below threshold', () => {
    // Build a table with one fewer than threshold
    const names = AGENTS.map(a => a.name);
    const belowThreshold = names.length - 3; // e.g., 4 out of 7
    const included = names.slice(0, belowThreshold);
    const rows = included.map(n => `| ${n} | description |`);
    const content = [
      '| Agent | Description |',
      '|-------|-------------|',
      ...rows,
    ].join('\n');
    const findings = checkIncompleteAgentTables(content, 'test.md');
    assert.equal(findings.length, 0, `table with ${belowThreshold}/${names.length} agents should not trigger`);
  });
});

// === checkInternalNamingLeaks ===

describe('checkInternalNamingLeaks', () => {
  it('detects _vortex in prose', () => {
    const content = 'The _vortex pattern enables agent routing.';
    const findings = checkInternalNamingLeaks(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, 'internal-naming-leak');
    assert.equal(findings[0].line, 1);
  });

  it('skips _vortex inside backticks', () => {
    const content = 'The path is `_bmad/bme/_vortex/agents/`.';
    const findings = checkInternalNamingLeaks(content, 'test.md');
    assert.equal(findings.length, 0);
  });

  it('skips _vortex inside code blocks', () => {
    const content = '```\n_vortex/agents/emma.md\n```';
    const findings = checkInternalNamingLeaks(content, 'test.md');
    assert.equal(findings.length, 0);
  });

  it('skips _vortex inside markdown link targets', () => {
    const content = 'See [Emma Guide](_bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md).';
    const findings = checkInternalNamingLeaks(content, 'test.md');
    assert.equal(findings.length, 0);
  });

  it('reports correct line number', () => {
    const content = 'Line 1\nLine 2\nThe _vortex system\nLine 4';
    const findings = checkInternalNamingLeaks(content, 'test.md');
    assert.equal(findings[0].line, 3);
  });

  it('detects multiple leaks across lines', () => {
    const content = 'The _vortex system\nAlso the _vortex pattern';
    const findings = checkInternalNamingLeaks(content, 'test.md');
    assert.equal(findings.length, 2);
  });

  it('returns empty array for clean content', () => {
    const content = 'The Vortex pattern enables agent routing.';
    const findings = checkInternalNamingLeaks(content, 'test.md');
    assert.equal(findings.length, 0);
  });
});

// === formatReport ===

describe('formatReport', () => {
  it('returns success message for zero findings', () => {
    const output = formatReport([]);
    assert.ok(output.includes('zero findings'));
  });

  it('includes finding count and file count for non-empty findings', () => {
    const findings = [
      { file: 'a.md', line: 1, category: 'stale-reference', current: '4 agents', expected: '7 agents' },
      { file: 'b.md', line: 2, category: 'broken-link', current: 'bad.md', expected: 'file should exist' },
    ];
    const output = formatReport(findings);
    assert.ok(output.includes('2 findings'));
    assert.ok(output.includes('2 files'));
  });

  it('groups findings by file', () => {
    const findings = [
      { file: 'docs/a.md', line: 1, category: 'stale-reference', current: 'x', expected: 'y' },
      { file: 'docs/a.md', line: 5, category: 'broken-link', current: 'x', expected: 'y' },
    ];
    const output = formatReport(findings);
    // File should appear once as a header
    const occurrences = (output.match(/docs\/a\.md/g) || []).length;
    assert.ok(occurrences >= 1);
  });
});

// === runAudit (integration-style) ===

describe('runAudit', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-audit-'));
    // Create _bmad dir so findProjectRoot can locate it
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
    await fs.ensureDir(path.join(tmpDir, 'docs'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns findings for docs with stale references', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'README.md'),
      'We ship 5 agents and 13 workflows.',
      'utf8'
    );
    const findings = await runAudit({ projectRoot: tmpDir });
    const stale = findings.filter(f => f.category === 'stale-reference');
    assert.ok(stale.length >= 2); // 5 agents (invalid count) + 13 workflows (invalid count)
  });

  it('returns empty findings for clean docs', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'README.md'),
      'This is a perfectly clean document with no issues.',
      'utf8'
    );
    // Remove docs dir content for clean test
    await fs.emptyDir(path.join(tmpDir, 'docs'));

    const findings = await runAudit({ projectRoot: tmpDir });
    // May still have missing-coverage findings for agents/workflows
    const nonCoverage = findings.filter(f => f.category !== 'missing-coverage');
    assert.equal(nonCoverage.length, 0);
  });
});

// === CLI exit codes ===

describe('CLI exit codes', () => {
  const scriptPath = path.join(__dirname, '../../scripts/docs-audit.js');

  it('runs without crashing (real project)', async () => {
    const result = await runScript(scriptPath);
    assert.equal(result.exitCode, 0, 'should exit 0 (no findings)');
  });

  it('produces valid JSON with --json flag', async () => {
    const result = await runScript(scriptPath, ['--json']);
    const parsed = JSON.parse(result.stdout);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 0, 'should have zero findings');
  });
});

// === USER_FACING_DOCS constant ===

describe('USER_FACING_DOCS', () => {
  it('contains expected docs', () => {
    assert.ok(USER_FACING_DOCS.includes('README.md'));
    assert.ok(USER_FACING_DOCS.includes('docs/agents.md'));
    assert.ok(USER_FACING_DOCS.includes('UPDATE-GUIDE.md'));
  });

  it('does not contain internal-only docs', () => {
    assert.ok(!USER_FACING_DOCS.includes('CREATE-RELEASE-GUIDE.md'));
    assert.ok(!USER_FACING_DOCS.includes('PUBLISHING-GUIDE.md'));
    assert.ok(!USER_FACING_DOCS.includes('TEST-PLAN-REAL-INSTALL.md'));
  });
});
