'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');

const {
  scanBmadInitRefs,
  writeInventoryCsv,
  renderInventoryCsv,
  CSV_HEADER,
} = require('../../scripts/audit/audit-bmad-init-refs');

// --- Fixture helpers ---

function makeTmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-audit-bmad-init-'));
}

/**
 * Write a SKILL.md under `{tmp}/_bmad/{subpath}/SKILL.md` with the given
 * frontmatter + body. Also seeds `{tmp}/_bmad/{firstSegment}/config.yaml`
 * so the per-entry verification warning about "module config missing"
 * stays quiet unless a test explicitly wants it.
 */
function writeSkillMd(tmp, subpath, { name, body }) {
  const dir = path.join(tmp, '_bmad', subpath);
  fs.mkdirSync(dir, { recursive: true });
  const frontmatter = name ? `---\nname: ${name}\n---\n\n` : '';
  fs.writeFileSync(path.join(dir, 'SKILL.md'), frontmatter + body, 'utf8');

  // Seed module config.yaml so the AC6 verification doesn't warn for normal tests.
  const module = subpath.split('/')[0];
  const moduleDir = path.join(tmp, '_bmad', module);
  const configPath = path.join(moduleDir, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, 'user_name: TestUser\n', 'utf8');
  }
}

const CANONICAL_ACTIVATION = [
  '## On Activation',
  '',
  '1. **Load config via bmad-init skill** — Store all returned vars for use.',
  '2. **Continue with steps below:**',
].join('\n');

const NON_CANONICAL_MENTION = [
  '## Overview',
  '',
  'This skill discusses bmad-init in its body but does not invoke it at activation.',
].join('\n');

// --- Tests ---

describe('scanBmadInitRefs — canonical vs candidate classification', () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTmpProject();
  });

  afterEach(() => {
    fs.removeSync(tmp);
  });

  it('detects canonical pattern match as candidateStatus="canonical"', () => {
    writeSkillMd(tmp, 'bmm/4-implementation/bmad-agent-dev', {
      name: 'bmad-agent-dev',
      body: CANONICAL_ACTIVATION,
    });

    const entries = scanBmadInitRefs(tmp);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].candidateStatus, 'canonical');
    assert.equal(entries[0].module, 'bmm');
    assert.equal(entries[0].moduleConfigPath, 'bmm');
    assert.equal(entries[0].agentName, 'bmad-agent-dev');
    assert.match(entries[0].patternMatched, /^1\. \*\*Load config via bmad-init skill\*\*/);
    assert.equal(entries[0].file, '_bmad/bmm/4-implementation/bmad-agent-dev/SKILL.md');
  });

  it('classifies non-canonical bmad-init mention as candidateStatus="candidate"', () => {
    writeSkillMd(tmp, 'bmm/1-analysis/bmad-product-brief', {
      name: 'bmad-product-brief',
      body: NON_CANONICAL_MENTION,
    });

    const entries = scanBmadInitRefs(tmp);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].candidateStatus, 'candidate');
    assert.match(entries[0].patternMatched, /candidate — non-canonical mention/);
  });

  it('filters out self-references under _bmad/core/bmad-init/** from both sets', () => {
    // Self-reference: this is the bmad-init skill itself, not a sweep target.
    writeSkillMd(tmp, 'core/bmad-init', {
      name: 'bmad-init',
      body: CANONICAL_ACTIVATION + '\n\nAlso mentions bmad-init and bmad_init heavily.',
    });
    // A real sweep target for comparison.
    writeSkillMd(tmp, 'cis/skills/bmad-cis-agent-storyteller', {
      name: 'bmad-cis-agent-storyteller',
      body: CANONICAL_ACTIVATION,
    });

    const entries = scanBmadInitRefs(tmp);

    assert.equal(entries.length, 1, 'self-reference should be filtered');
    assert.equal(entries[0].file, '_bmad/cis/skills/bmad-cis-agent-storyteller/SKILL.md');
    assert.equal(
      entries.some(e => e.file.startsWith('_bmad/core/bmad-init')),
      false,
      'no entry should point at _bmad/core/bmad-init/**',
    );
  });

  it('returns empty array when no SKILL.md mentions bmad-init anywhere', () => {
    writeSkillMd(tmp, 'bmm/1-analysis/clean-agent', {
      name: 'clean-agent',
      body: '## Overview\n\nThis agent is already v6.3-compliant and direct-loads.\n',
    });

    const entries = scanBmadInitRefs(tmp);

    assert.deepEqual(entries, []);
  });

  it('excludes _bmad/bme/** agents from the output (AC9 regression guard)', () => {
    // Convoke's own bme agents should NEVER appear — they already direct-load.
    // This test ensures the scan doesn't accidentally start flagging them.
    writeSkillMd(tmp, 'bme/_vortex/agents/emma', {
      name: 'emma',
      body: [
        '## On Activation',
        '',
        '- Load and read {project-root}/_bmad/bme/_vortex/config.yaml NOW',
        '- Store ALL fields as session variables: {user_name}, {communication_language}, {output_folder}',
      ].join('\n'),
    });
    // Sanity: also add an upstream skill that SHOULD appear.
    writeSkillMd(tmp, 'bmm/2-plan-workflows/bmad-agent-pm', {
      name: 'bmad-agent-pm',
      body: CANONICAL_ACTIVATION,
    });

    const entries = scanBmadInitRefs(tmp);

    assert.equal(
      entries.some(e => e.file.startsWith('_bmad/bme/')),
      false,
      'no _bmad/bme/** entries should appear — they already direct-load',
    );
    assert.equal(entries.length, 1);
    assert.equal(entries[0].file, '_bmad/bmm/2-plan-workflows/bmad-agent-pm/SKILL.md');
  });

  it('returns entries sorted alphabetically by file path (determinism)', () => {
    writeSkillMd(tmp, 'wds/agents/wds-agent-saga-analyst', {
      name: 'wds-agent-saga-analyst',
      body: CANONICAL_ACTIVATION,
    });
    writeSkillMd(tmp, 'bmm/1-analysis/bmad-agent-analyst', {
      name: 'bmad-agent-analyst',
      body: CANONICAL_ACTIVATION,
    });
    writeSkillMd(tmp, 'cis/skills/bmad-cis-agent-storyteller', {
      name: 'bmad-cis-agent-storyteller',
      body: CANONICAL_ACTIVATION,
    });

    const entries = scanBmadInitRefs(tmp);

    assert.deepEqual(
      entries.map(e => e.file),
      [
        '_bmad/bmm/1-analysis/bmad-agent-analyst/SKILL.md',
        '_bmad/cis/skills/bmad-cis-agent-storyteller/SKILL.md',
        '_bmad/wds/agents/wds-agent-saga-analyst/SKILL.md',
      ],
    );
  });
});

describe('scanBmadInitRefs — per-entry verification (AC6)', () => {
  let tmp;
  let warnSpy;

  beforeEach(() => {
    tmp = makeTmpProject();
    warnSpy = mock.method(console, 'warn', () => {});
  });

  afterEach(() => {
    warnSpy.mock.restore();
    fs.removeSync(tmp);
  });

  it('warns but keeps the entry when module config.yaml is missing', () => {
    // Write a SKILL.md without seeding the module config.yaml
    const dir = path.join(tmp, '_bmad', 'bmm', '1-analysis', 'bmad-agent-analyst');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'SKILL.md'),
      `---\nname: bmad-agent-analyst\n---\n\n${CANONICAL_ACTIVATION}`,
      'utf8',
    );

    const entries = scanBmadInitRefs(tmp);

    assert.equal(entries.length, 1, 'entry should be retained despite warning');
    const warnArgs = warnSpy.mock.calls.map(c => c.arguments[0]);
    assert.ok(
      warnArgs.some(msg => /module config missing/.test(msg)),
      'expected a "module config missing" warning',
    );
  });
});

describe('writeInventoryCsv + renderInventoryCsv', () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTmpProject();
  });

  afterEach(() => {
    fs.removeSync(tmp);
  });

  it('writes a CSV with the canonical 6-column header', () => {
    const out = path.join(tmp, 'inventory.csv');
    writeInventoryCsv([], out);

    const content = fs.readFileSync(out, 'utf8');
    assert.equal(content, `${CSV_HEADER}\n`);
    assert.equal(
      CSV_HEADER,
      'file,module_config_path,module,agent_name,pattern_matched,candidate_status',
    );
  });

  it('quotes fields containing commas or quotes per RFC 4180', () => {
    const entries = [
      {
        file: '_bmad/foo/SKILL.md',
        moduleConfigPath: 'foo',
        module: 'foo',
        agentName: 'agent, with comma',
        patternMatched: 'has "inner quotes" inside',
        candidateStatus: 'canonical',
      },
    ];

    const rendered = renderInventoryCsv(entries);
    const [, dataLine] = rendered.trim().split('\n');

    // Comma-containing field should be quoted.
    assert.match(dataLine, /"agent, with comma"/);
    // Inner quotes should be doubled.
    assert.match(dataLine, /"has ""inner quotes"" inside"/);
  });

  it('renderInventoryCsv throws TypeError when entries is not an array (symmetric with writeInventoryCsv)', () => {
    assert.throws(() => renderInventoryCsv(null), /TypeError.*entries must be an array/s);
    assert.throws(() => renderInventoryCsv(undefined), /TypeError.*entries must be an array/s);
    assert.throws(() => renderInventoryCsv({}), /TypeError.*entries must be an array/s);
    assert.throws(() => renderInventoryCsv('not an array'), /TypeError.*entries must be an array/s);
  });

  it('produces byte-identical output on repeated serialization (determinism for AC8)', () => {
    const entries = [
      {
        file: '_bmad/bmm/x/SKILL.md',
        moduleConfigPath: 'bmm',
        module: 'bmm',
        agentName: 'x',
        patternMatched: '1. **Load config via bmad-init skill**',
        candidateStatus: 'canonical',
      },
    ];

    assert.equal(renderInventoryCsv(entries), renderInventoryCsv(entries));
  });
});

describe('scanBmadInitRefs — input validation', () => {
  it('throws TypeError when projectRoot is not a non-empty string', () => {
    assert.throws(() => scanBmadInitRefs(null), /TypeError.*projectRoot/s);
    assert.throws(() => scanBmadInitRefs(''), /TypeError.*projectRoot/s);
    assert.throws(() => scanBmadInitRefs(42), /TypeError.*projectRoot/s);
  });

  it('throws Error when _bmad/ does not exist under projectRoot', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-audit-empty-'));
    try {
      assert.throws(() => scanBmadInitRefs(empty), /_bmad\/ not found/);
    } finally {
      fs.removeSync(empty);
    }
  });
});
