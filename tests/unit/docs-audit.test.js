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
  validCountsFor,
  rosterTotal,
  expectedCountText,
  registryHeader,
  teamNames,
} = require('../../scripts/docs-audit');

const {
  AGENTS,
  WORKFLOWS,
  WORKFLOW_NAMES,
  GYRE_AGENTS,
  EXTRA_BME_AGENTS,
} = require('../../scripts/update/lib/agent-registry');
const agentRegistry = require('../../scripts/update/lib/agent-registry');
const { runScript, removeTempDir } = require('../helpers');

// === checkStaleReferences ===

describe('checkStaleReferences', () => {
  const agentCount = AGENTS.length;      // 7
  const workflowCount = WORKFLOWS.length; // 22

  it('detects stale digit agent count', () => {
    const content = 'We support 5 agents in the Vortex.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, 'stale-reference');
    assert.equal(findings[0].current, '5 agents');
    assert.equal(findings[0].line, 1);
  });

  it('detects stale written-out agent count', () => {
    const content = 'The system has five agents.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].current, 'five agents');
  });

  it('does not flag correct agent count', () => {
    const content = `There are ${agentCount} agents in the Vortex.`;
    const findings = checkStaleReferences(content, 'test.md');
    const agentFindings = findings.filter(f => f.current.includes('agent'));
    assert.equal(agentFindings.length, 0);
  });

  // T146: the valid set is built from THREE registry groups, not two. Before this, the full
  // roster (Vortex + Gyre + EXTRA_BME_AGENTS) read as stale while the Vortex+Gyre subtotal
  // passed — so a TRUE statement about the agent count was reported wrong. Nothing exercised
  // the third group, which is why the gap survived; these two cases pin it.
  it('accepts the full roster count, including EXTRA_BME_AGENTS', () => {
    const full = AGENTS.length + GYRE_AGENTS.length + EXTRA_BME_AGENTS.length;
    const findings = checkStaleReferences(`All ${full} agents are registered.`, 'test.md');
    assert.deepEqual(
      findings.filter((f) => f.current.includes('agent')),
      [],
      `the full roster (${full}) must be a valid agent count`
    );
  });

  // T148: the derivation used to name its roster arrays literally, which is how T146 happened
  // and how team four would have reintroduced it. These pin the generalisation itself — the
  // function takes a registry so a roster the real one does not have can be handed to it.
  describe('validCountsFor — generalises to rosters the real registry does not have', () => {
    const base = { AGENTS: new Array(7), GYRE_AGENTS: new Array(4), EXTRA_BME_AGENTS: new Array(1) };

    it('accepts each roster size, the whole roster, and the teams without extras', () => {
      assert.deepEqual(
        [...validCountsFor(base, 'AGENTS')].sort((a, b) => a - b),
        [1, 4, 7, 11, 12]
      );
    });

    it('picks up a FOURTH roster with no edit to this file — the T148 regression guard', () => {
      const withForge = { ...base, FORGE_AGENTS: new Array(3) };
      const valid = validCountsFor(withForge, 'AGENTS');
      assert.ok(valid.has(3), "the new roster's own size must become valid");
      assert.ok(valid.has(15), 'the whole roster (7+4+1+3) must become valid');
      assert.ok(valid.has(14), 'the teams without extras (7+4+3) must become valid');
      // NOTE: this records BEHAVIOUR, not desirability. `UPDATE-GUIDE.md` carries
      // version-scoped lines ("From v1.7.x to v3.0.0: All 11 agents installed") that stay true
      // forever, and the checker has no notion of version scope — so registering team four
      // turns two CORRECT lines red. Filed as T152; do not read this assertion as approving
      // that outcome.
      assert.ok(!valid.has(11), 'the previous team total is no longer the team total');
    });

    it('excludes EXTRA_ rosters from the teams-without-extras total', () => {
      assert.ok(validCountsFor(base, 'AGENTS').has(11), '7+4 excludes the EXTRA roster');
    });

    it('is order-independent', () => {
      const reordered = {
        EXTRA_BME_AGENTS: new Array(1), GYRE_AGENTS: new Array(4), AGENTS: new Array(7),
      };
      assert.deepEqual(
        [...validCountsFor(base, 'AGENTS')].sort((a, b) => a - b),
        [...validCountsFor(reordered, 'AGENTS')].sort((a, b) => a - b)
      );
    });

    it('ignores a non-array export that DOES match the suffix', () => {
      // Must end in the suffix, or the key is filtered out before `Array.isArray` is consulted
      // and the guard is never exercised. An earlier version of this test seeded `AGENT_IDS`,
      // which fails `endsWith('AGENTS')` — so it asserted something trivially true while its
      // title claimed coverage the suite did not have.
      const noisy = { ...base, WAVE3_AGENTS: new Set([1, 2, 3]), FUTURE_AGENTS: [] };
      assert.deepEqual(
        [...validCountsFor(noisy, 'AGENTS')].sort((a, b) => a - b),
        [1, 4, 7, 11, 12],
        'a Set-valued roster must be ignored, not summed'
      );
    });

    it('matches the suffix at the END, not anywhere in the name', () => {
      // Pins `endsWith` against `includes`: a mutation to `includes` survived the suite.
      const trap = { ...base, AGENTS_ARCHIVE: new Array(99) };
      const valid = validCountsFor(trap, 'AGENTS');
      assert.ok(!valid.has(99), 'AGENTS_ARCHIVE must not be read as a roster');
      assert.ok(!valid.has(111), 'and must not be summed into the total');
    });

    it('separates the two suffixes', () => {
      const mixed = { AGENTS: new Array(7), WORKFLOWS: new Array(22) };
      assert.ok(!validCountsFor(mixed, 'AGENTS').has(22));
      assert.ok(!validCountsFor(mixed, 'WORKFLOWS').has(7));
    });
  });

  it('still rejects a count belonging to no registry group', () => {
    // Deliberately outside every subtotal and every sum of them, so a future fourth group
    // cannot make this value accidentally valid and silently stop testing anything.
    const bogus = (AGENTS.length + GYRE_AGENTS.length + EXTRA_BME_AGENTS.length) * 3 + 7;
    const findings = checkStaleReferences(`All ${bogus} agents are registered.`, 'test.md');
    assert.equal(
      findings.filter((f) => f.current.includes('agent')).length,
      1,
      `${bogus} belongs to no group and must still be flagged`
    );
  });

  it('detects stale digit workflow count', () => {
    const content = 'Includes 13 workflows for validation.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].current, '13 workflows');
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
    const content = 'Line 1\nLine 2\nWe have 5 agents here\nLine 4';
    const findings = checkStaleReferences(content, 'docs/test.md');
    assert.equal(findings[0].file, 'docs/test.md');
    assert.equal(findings[0].line, 3);
  });

  it('detects multiple findings in single file', () => {
    const content = 'We have 5 agents and 13 workflows.\nPlus the original agents.';
    const findings = checkStaleReferences(content, 'test.md');
    assert.ok(findings.length >= 3); // 5 agents, 13 workflows, original agents
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
    await removeTempDir(tmpDir);
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
    await removeTempDir(tmpDir);
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

/** chalk colour codes, removed so assertions read the text rather than the escapes. */
const stripAnsi = (s) => s.replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '');

describe('count claims with a team qualifier (docs-1-4 AC6)', () => {
  // `docs/faq.md:40` carried TWO count claims on one line — "all seven Vortex agents" and "all
  // four Gyre agents" — and the checker saw NEITHER, because it required the counted noun
  // adjacent to the number. The claims were true; what mattered is that a FALSE version was
  // equally invisible, so the line could go stale with the gate green.
  it('flags a wrong count that carries a team qualifier', () => {
    const line = 'Use all nine Vortex agents, or all six Gyre agents.';
    const found = checkStaleReferences(line, 'x.md');
    assert.equal(found.length, 2, 'both claims on the line must be flagged, not just the first');
    assert.deepEqual(found.map((f) => f.current), ['nine Vortex agents', 'six Gyre agents']);
  });

  it('accepts the same line when the counts are right', () => {
    const line = 'Use all seven Vortex agents, or all four Gyre agents.';
    assert.deepEqual(checkStaleReferences(line, 'x.md'), []);
  });

  it('does NOT treat a non-team qualifier as a roster claim', () => {
    // Both are true and neither is about a Convoke roster: one counts a historical delta, the
    // other counts BMB's builder agents. An unrestricted qualifier flagged both.
    assert.deepEqual(checkStaleReferences('adding three new agents:', 'x.md'), []);
    assert.deepEqual(checkStaleReferences('Convoke includes three builder agents:', 'x.md'), []);
  });

  it('still flags the bare adjacent form', () => {
    assert.equal(checkStaleReferences('We support 5 agents.', 'x.md').length, 1);
  });

  it('derives team names from the registry rather than a list in this file', () => {
    const teams = teamNames();
    assert.ok(teams.length >= 2, 'the registry yielded no teams');
    for (const t of ['vortex', 'gyre']) {
      assert.ok(teams.map((x) => x.toLowerCase()).includes(t), `${t} missing from the derived set`);
    }
  });

  // ⚠ CAVEAT, recorded because AC6 requires it and because the mutation proof above is easy to
  // over-read: this makes the claim VISIBLE, not verified against its own team. `validCountsFor`
  // holds ONE valid set for every roster, so a claim naming the wrong team still passes when the
  // number is valid for some other team. That is T154 and is not closed here.
  it('a count valid for ANOTHER team still passes — the known limit of this fix', () => {
    assert.deepEqual(checkStaleReferences('Use all four Vortex agents.', 'x.md'), [],
      'documents the T154 gap; this is not an endorsement of the behaviour');
  });
});

describe('the remedy a finding prints (T153)', () => {
  // The four `expectedCountText` call sites, digit and written-out alike. NOT every count remedy
  // in the file — `contradictoryPatterns` holds three more, of which only the T157 site is pinned
  // (separately, below); the other two are unguarded, filed as T158.
  // Asserting this per-test-case guarded only two of the four: the written-out paths checked
  // `current` and never `expected`, so both could be reverted to the pre-fix defect with the
  // suite green. This list is hand-maintained — add a row when a new site is introduced.
  const COUNT_REMEDY_SITES = [
    { site: 'digit agents',        content: 'We support 5 agents in the Vortex.',  suffix: 'AGENTS',    noun: 'agents' },
    { site: 'written-out agents',  content: 'The system has five agents.',         suffix: 'AGENTS',    noun: 'agents' },
    { site: 'digit workflows',     content: 'Includes 13 workflows for validation.', suffix: 'WORKFLOWS', noun: 'workflows' },
    { site: 'written-out workflows', content: 'We ship thirteen workflows.',        suffix: 'WORKFLOWS', noun: 'workflows' },
  ];

  for (const { site, content, suffix, noun } of COUNT_REMEDY_SITES) {
    it(`never prescribes a lone roster size — ${site}`, () => {
      const [finding] = checkStaleReferences(content, 'test.md');
      assert.ok(finding, `${site}: nothing was flagged, so the remedy is untested`);
      // A lone number here is the T153 defect: it is accepted by the check on re-run, so
      // following it turns a wrong document into one the audit passes.
      assert.doesNotMatch(finding.expected, new RegExp(`^\\d+ ${noun}$`),
        `${site}: the remedy must not be a single roster size presented as the answer`);
    });

    it(`enumerates every accepted count — ${site}`, () => {
      const [finding] = checkStaleReferences(content, 'test.md');
      const valid = [...validCountsFor(agentRegistry, suffix)].sort((a, b) => a - b);
      // Word-boundary, not `.includes`: "11, 12".includes("1") is true, so a substring test
      // cannot see a one-digit accepted count vanish inside a two-digit one.
      for (const n of valid) {
        assert.match(finding.expected, new RegExp(`\\b${n}\\b`),
          `${site}: accepted count ${n} is missing from the remedy`);
      }
      // Ascending order and the ", " separator are the rendering; both were revertible while
      // the enumeration assertion alone stayed green, because it is one-directional.
      assert.ok(finding.expected.includes(valid.join(', ')),
        `${site}: accepted counts must render ascending and comma-separated`);
    });
  }

  it('does not hand back a figure the audit would silently accept', () => {
    // The original defect: "13 agents" was told to become "7 agents" — wrong (the total is 12)
    // AND valid, so the corrected document passed. Re-running the check on the remedy's own
    // figure must not turn a wrong document into a green one.
    const findings = checkStaleReferences('Convoke ships 13 agents.', 'x.md');
    assert.equal(findings.length, 1);
    const single = findings[0].expected.match(/^(\d+) agents$/);
    assert.equal(single, null,
      'a lone number here is the T153 defect: it is accepted on re-run whether or not it is true');
  });

  it('says out loud that it cannot tell which roster is meant', () => {
    // The archive note calls this clause the honest half of the remedy. Deleting it left the
    // whole suite green until this test existed.
    const many = checkStaleReferences('Convoke ships 13 agents.', 'x.md')[0].expected;
    assert.match(many, /cannot tell which roster is meant \(T154\)/);
  });

  it('degrades honestly when the registry cannot support any count', () => {
    assert.match(expectedCountText(new Set(), 'agents'), /no agents count is derivable/);
    // One roster means the check CAN tell which roster is meant, so the hedge must go — and
    // "one of 7 agents" would read partitively rather than as the number 7.
    assert.equal(expectedCountText(new Set([7]), 'agents'), '7 agents');
    assert.doesNotMatch(expectedCountText(new Set([7]), 'agents'), /one of/);
  });

  it('keeps the unfixed site visible rather than half-fixing it (T157)', () => {
    // T153 left this remedy exactly as found and filed T157. Nothing pinned "exactly as found",
    // so a silent edit here would go unnoticed — and it is the last live instance of T153's
    // own defect: a lone count that the check itself accepts on re-run.
    const [finding] = checkStaleReferences('The original 4 shipped in v1.0.', 'x.md');
    assert.equal(finding.expected, `current ${AGENTS.length} agents`);
    assert.ok(validCountsFor(agentRegistry, 'AGENTS').has(AGENTS.length),
      'and it is still self-validating — that is why T157 stays open');
  });

  it('names the roster the incomplete-table count is about', () => {
    const table = ['| Agent | Role |', '|---|---|']
      .concat(AGENTS.slice(0, AGENTS.length - 2).map((a) => `| ${a.name} | x |`))
      .join('\n');
    const [finding] = checkIncompleteAgentTables(`${table}\n\ntail`, 'x.md');
    assert.ok(finding, 'the fixture must actually trip the check');
    assert.match(finding.current, /Vortex agents$/,
      'the denominator is the Vortex roster and must say so');
  });

  it('names the whole registry in the report header, not one roster', () => {
    const agents = rosterTotal(agentRegistry, 'AGENTS');
    const workflows = rosterTotal(agentRegistry, 'WORKFLOWS');
    // Falsification: these totals must differ from the single roster the header used to print,
    // or this test would pass against the defect it exists to catch.
    assert.notEqual(agents, AGENTS.length, 'fixture no longer distinguishes total from roster');
    assert.notEqual(workflows, WORKFLOWS.length, 'fixture no longer distinguishes total from roster');

    for (const output of [formatReport([]), formatReport([
      { file: 'a.md', line: 1, category: 'stale-reference', current: 'x', expected: 'y' },
    ])]) {
      const plain = stripAnsi(output);
      assert.match(plain, new RegExp(`Registry: ${agents} agents, ${workflows} workflows`));
    }
  });
});

describe('registryHeader', () => {
  it('sums every roster, against a fixture the function cannot derive from itself', () => {
    // Hand-built numbers, so a wrong `rosterTotal` cannot move both sides of the assertion
    // together — the flaw in deriving the expectation from the function under test.
    const fake = { AGENTS: new Array(3), GYRE_AGENTS: new Array(2), EXTRA_BME_AGENTS: new Array(1),
      WORKFLOWS: new Array(9), GYRE_WORKFLOWS: new Array(1) };
    assert.equal(registryHeader(fake), '6 agents, 10 workflows (from exported rosters)');
  });

  it('states the basis of its figures rather than asserting a bare total', () => {
    // The workflow figure is a known undercount (T150) and the coverage checks span less than
    // the word "Registry" implies (T156). The qualifier is what makes the line true.
    assert.match(registryHeader(), /\(from exported rosters\)/);
  });
});

describe('rosterTotal', () => {
  it('sums every roster matching the suffix, ignoring non-arrays', () => {
    const base = { AGENTS: new Array(7), GYRE_AGENTS: new Array(4), EXTRA_BME_AGENTS: new Array(1) };
    assert.equal(rosterTotal(base, 'AGENTS'), 12);
    assert.equal(rosterTotal({ ...base, WAVE4_AGENTS: new Array(3) }, 'AGENTS'), 15);
    // NOTE: only `WIDE_AGENTS` probes the Array.isArray guard. `AGENT_IDS` fails `endsWith`
    // first, so it proves nothing — kept solely to document that it is inert, because an
    // earlier test in this file made exactly that mistake under a title claiming coverage.
    assert.equal(rosterTotal({ ...base, AGENT_IDS: 'nope', WIDE_AGENTS: new Set('ab') }, 'AGENTS'), 12);
    // A Set has no `.length`, so it cannot distinguish `Array.isArray` from a duck-typed
    // `x && x.length !== undefined`. This one can: it is array-LIKE and must still be rejected.
    assert.equal(rosterTotal({ ...base, ARRAYLIKE_AGENTS: { length: 99 } }, 'AGENTS'), 12);
    assert.equal(rosterTotal({}, 'AGENTS'), 0);
  });

  it('counts EXTRA_ rosters, unlike the team subtotal', () => {
    // rosterTotal answers "how many exist", validCountsFor answers "what may a doc claim".
    // The fixture needs THREE rosters: with only AGENTS + EXTRA_BME_AGENTS the team subtotal
    // coincides with a roster size, so `has(subtotal)` holds whether or not the filter runs —
    // the assertion would observe nothing. Here the subtotal (11) is its own number.
    const base = { AGENTS: new Array(7), GYRE_AGENTS: new Array(4), EXTRA_BME_AGENTS: new Array(1) };
    assert.equal(rosterTotal(base, 'AGENTS'), 12, 'rosterTotal includes EXTRA_ rosters');
    const valid = validCountsFor(base, 'AGENTS');
    assert.ok(valid.has(11), 'the team subtotal must exclude EXTRA_, giving 11 alongside the total 12');
    assert.ok(valid.has(12), 'and the whole-roster total must still be claimable');
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
    await removeTempDir(tmpDir);
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
//
// These tests assert CLI *behavior* (exit code validity, JSON shape) against an
// isolated fixture. They deliberately do NOT assert `findings.length === 0`
// against the real project — that coupling turned any doc drift into a red CI
// across all Node versions. If you want "the real project has clean docs",
// run `npm run docs:audit` as a separate gate, not as a unit test.

describe('CLI exit codes', () => {
  const scriptPath = path.join(__dirname, '../../scripts/docs-audit.js');
  let cliTmpDir;

  before(async () => {
    // Minimal fixture: `_bmad/` marker so findProjectRoot locates it here
    // (walking up from cwd) instead of traversing past tmp into the real repo.
    cliTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-audit-cli-'));
    await fs.ensureDir(path.join(cliTmpDir, '_bmad'));
  });

  after(async () => {
    await removeTempDir(cliTmpDir);
  });

  it('runs without crashing', async () => {
    const result = await runScript(scriptPath, [], { cwd: cliTmpDir });
    // Behavior: process exits with a valid integer code (clean exit, not a crash).
    // 0 = no findings, 1 = findings present — both are valid CLI outcomes.
    assert.ok(
      result.exitCode === 0 || result.exitCode === 1,
      `should exit 0 or 1, got ${result.exitCode}`
    );
  });

  it('produces valid JSON with --json flag', async () => {
    const result = await runScript(scriptPath, ['--json'], { cwd: cliTmpDir });
    const parsed = JSON.parse(result.stdout);
    assert.ok(Array.isArray(parsed), 'output should be a JSON array');
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
