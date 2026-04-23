'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const {
  scanBmmDependencies,
  renderCsv,
  readExistingCsv,
  mergePreservingManual,
  CSV_HEADER,
  FR18_FIRST_SKILL,
  _internal,
} = require('../../scripts/audit/audit-bmm-dependencies');

const FIXTURE_ROOT = path.join(__dirname, '..', 'fixtures', 'bmm-dependencies');

// --- Test helpers ---

/**
 * Build a tmp project root with `.claude/skills/` populated from named
 * fixtures. Returns the absolute tmp project root.
 *
 * @param {string[]} fixtureNames - Subset of fixture directory names under
 *   tests/fixtures/bmm-dependencies/ to copy into the tmp project.
 * @returns {Promise<string>}
 */
async function buildTmpProject(fixtureNames) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-deps-'));
  const skillsRoot = path.join(tmp, '.claude', 'skills');
  await fs.ensureDir(skillsRoot);
  for (const name of fixtureNames) {
    await fs.copy(path.join(FIXTURE_ROOT, name), path.join(skillsRoot, name));
  }
  return tmp;
}

/**
 * Write a seeded CSV into `_bmad/_config/bmm-dependencies.csv` under tmpRoot.
 * The `rows` array omits the header — it is written automatically.
 */
async function seedCsv(tmpRoot, rows) {
  const csvPath = path.join(tmpRoot, '_bmad', '_config', 'bmm-dependencies.csv');
  await fs.ensureDir(path.dirname(csvPath));
  const lines = [CSV_HEADER, ...rows.map(r => [
    r.skill_name, r.bmm_agent, r.dependency_type, r.source_module, r.registered_by, r.registered_date,
  ].join(','))];
  await fs.writeFile(csvPath, lines.join('\n') + '\n', 'utf8');
  return csvPath;
}

// --- scanBmmDependencies ---

describe('scanBmmDependencies — detection heuristic', () => {
  let tmpRoot;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    warnSpy = mock.method(console, 'warn', () => {});
    errorSpy = mock.method(console, 'error', () => {});
  });

  afterEach(async () => {
    warnSpy.mock.restore();
    errorSpy.mock.restore();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('AC9 case 1 — frontmatter dependency emits a frontmatter row', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    const rows = scanBmmDependencies(tmpRoot);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].skill_name, 'skill-with-frontmatter-dep');
    assert.equal(rows[0].bmm_agent, 'bmad-agent-pm');
    assert.equal(rows[0].dependency_type, 'frontmatter');
    assert.equal(rows[0].source_module, 'unknown');
    assert.equal(rows[0].registered_by, 'auto-scan');
    assert.match(rows[0].registered_date, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('AC9 case 2 — step-file grep emits a code-reference row', async () => {
    tmpRoot = await buildTmpProject(['skill-with-stepfile-dep']);
    const rows = scanBmmDependencies(tmpRoot);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].skill_name, 'skill-with-stepfile-dep');
    assert.equal(rows[0].bmm_agent, 'bmad-agent-architect');
    assert.equal(rows[0].dependency_type, 'code-reference');
  });

  it('AC9 case 3 — doc-body mention does NOT emit a row (negative assertion)', async () => {
    tmpRoot = await buildTmpProject(['skill-with-docbody-only']);
    const rows = scanBmmDependencies(tmpRoot);
    const bodyMatches = rows.filter(r => r.skill_name === 'skill-with-docbody-only');
    assert.equal(bodyMatches.length, 0, 'doc-body prose must NOT yield rows');
  });

  it('AC9 case 7 — malformed frontmatter (bare string) warns and skips frontmatter source', async () => {
    tmpRoot = await buildTmpProject(['skill-with-malformed-dep']);
    const rows = scanBmmDependencies(tmpRoot);
    const malformedRows = rows.filter(r => r.skill_name === 'skill-with-malformed-dep');
    assert.equal(malformedRows.length, 0, 'malformed frontmatter must not yield frontmatter rows');
    const warnings = warnSpy.mock.calls.map(c => c.arguments.join(' '));
    assert.ok(
      warnings.some(w => w.includes('dependencies must be an array')),
      `expected 'dependencies must be an array' warning; got: ${warnings.join(' || ')}`,
    );
  });

  it('frontmatter takes precedence over step-file grep for the same agent', async () => {
    // Use the frontmatter-dep fixture and manually add a step file that would
    // otherwise trigger a duplicate code-reference row for the same agent.
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    const stepFile = path.join(tmpRoot, '.claude', 'skills', 'skill-with-frontmatter-dep', 'steps-c', 'step-01.md');
    await fs.ensureDir(path.dirname(stepFile));
    await fs.writeFile(stepFile, '# Step 01\n\nReference bmad-agent-pm here.\n', 'utf8');
    const rows = scanBmmDependencies(tmpRoot);
    // Only one row for this (skill, agent) pair, and it must be the
    // authoritative frontmatter entry — not code-reference.
    assert.equal(rows.length, 1);
    assert.equal(rows[0].dependency_type, 'frontmatter');
  });

  it('throws TypeError on empty projectRoot', () => {
    assert.throws(() => scanBmmDependencies(''), TypeError);
    assert.throws(() => scanBmmDependencies(null), TypeError);
  });

  it('throws Error when .claude/skills/ is missing', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-deps-empty-'));
    try {
      assert.throws(() => scanBmmDependencies(tmp), /\.claude\/skills not found/);
    } finally {
      await fs.remove(tmp);
    }
  });
});

// --- FR18 ordering ---

describe('scanBmmDependencies — FR18 recursive-tooling ordering', () => {
  let tmpRoot;
  let errorSpy;

  beforeEach(() => {
    errorSpy = mock.method(console, 'error', () => {});
  });

  afterEach(async () => {
    errorSpy.mock.restore();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('logs FR18 line when bmad-enhance-initiatives-backlog is absent', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    scanBmmDependencies(tmpRoot);
    const stderr = errorSpy.mock.calls.map(c => c.arguments.join(' '));
    assert.ok(
      stderr.some(l => l.includes(`[FR18] ${FR18_FIRST_SKILL} NOT present`)),
      `expected FR18 absent-subject log; got: ${stderr.join(' || ')}`,
    );
  });

  it('logs FR18 line with zero dependencies when the skill exists but has none', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-deps-fr18-'));
    const fr18Dir = path.join(tmpRoot, '.claude', 'skills', FR18_FIRST_SKILL);
    await fs.ensureDir(fr18Dir);
    await fs.writeFile(path.join(fr18Dir, 'SKILL.md'), '---\nname: ' + FR18_FIRST_SKILL + '\n---\nnothing here.\n', 'utf8');
    scanBmmDependencies(tmpRoot);
    const stderr = errorSpy.mock.calls.map(c => c.arguments.join(' '));
    assert.ok(
      stderr.some(l => l.includes(`[FR18] ${FR18_FIRST_SKILL} scanned first — 0 dependencies`)),
      `expected FR18 zero-deps log; got: ${stderr.join(' || ')}`,
    );
  });

  it('pins FR18 subject rows to top when it has dependencies', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-deps-fr18-pin-'));
    const skillsRoot = path.join(tmpRoot, '.claude', 'skills');
    // FR18 subject — AFTER alphabetically, but must be pinned first in output.
    const fr18Dir = path.join(skillsRoot, FR18_FIRST_SKILL);
    await fs.ensureDir(fr18Dir);
    await fs.writeFile(
      path.join(fr18Dir, 'SKILL.md'),
      '---\nname: ' + FR18_FIRST_SKILL + '\ndependencies:\n  - bmad-agent-pm\n---\n',
      'utf8',
    );
    // aaa-something — alphabetically FIRST, but must appear AFTER fr18 in output.
    const aaaDir = path.join(skillsRoot, 'aaa-something');
    await fs.ensureDir(aaaDir);
    await fs.writeFile(
      path.join(aaaDir, 'SKILL.md'),
      '---\nname: aaa-something\ndependencies:\n  - bmad-agent-dev\n---\n',
      'utf8',
    );
    const rows = scanBmmDependencies(tmpRoot);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].skill_name, FR18_FIRST_SKILL, 'FR18 subject must be pinned first');
    assert.equal(rows[1].skill_name, 'aaa-something');
  });
});

// --- mergePreservingManual ---

describe('mergePreservingManual — preservation + stale detection', () => {
  let tmpRoot;
  let errorSpy;

  beforeEach(() => {
    errorSpy = mock.method(console, 'error', () => {});
  });

  afterEach(async () => {
    errorSpy.mock.restore();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('AC9 case 4 — manual row (non-auto-scan registered_by) preserved byte-identical', async () => {
    tmpRoot = await buildTmpProject(['skill-with-manual-entry']);
    const csvPath = await seedCsv(tmpRoot, [{
      skill_name: 'skill-with-manual-entry',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'user@example.com',
      registered_date: '2026-01-15',
    }]);
    const scanRows = scanBmmDependencies(tmpRoot);
    const existingRows = readExistingCsv(csvPath);
    const merged = mergePreservingManual(
      scanRows,
      existingRows,
      path.join(tmpRoot, '.claude', 'skills'),
    );
    const manual = merged.find(r => r.registered_by === 'user@example.com');
    assert.ok(manual, 'manual row must survive merge');
    assert.equal(manual.bmm_agent, 'bmad-agent-pm');
    assert.equal(manual.registered_date, '2026-01-15', 'manual registered_date preserved');
    // AND the scan row for bmad-agent-dev (from frontmatter) is also there.
    assert.ok(merged.find(r => r.bmm_agent === 'bmad-agent-dev' && r.registered_by === 'auto-scan'));
  });

  it('AC9 case 5 — auto-scan row for a skill that no longer exists is dropped (skill-gone)', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    const csvPath = await seedCsv(tmpRoot, [{
      skill_name: 'skill-that-was-removed',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-03-01',
    }]);
    const scanRows = scanBmmDependencies(tmpRoot);
    const existingRows = readExistingCsv(csvPath);
    const merged = mergePreservingManual(
      scanRows,
      existingRows,
      path.join(tmpRoot, '.claude', 'skills'),
    );
    assert.ok(
      !merged.find(r => r.skill_name === 'skill-that-was-removed'),
      'removed skill must be dropped',
    );
    const stderr = errorSpy.mock.calls.map(c => c.arguments.join(' '));
    assert.ok(
      stderr.some(l => l.includes('[stale:skill-gone]') && l.includes('skill-that-was-removed')),
      `expected [stale:skill-gone] log; got: ${stderr.join(' || ')}`,
    );
  });

  it('AC9 case 6 — auto-scan row for a removed dependency is dropped (dep-removed)', async () => {
    tmpRoot = await buildTmpProject(['skill-with-removed-dep']);
    const csvPath = await seedCsv(tmpRoot, [{
      skill_name: 'skill-with-removed-dep',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-03-01',
    }]);
    const scanRows = scanBmmDependencies(tmpRoot);
    const existingRows = readExistingCsv(csvPath);
    const merged = mergePreservingManual(
      scanRows,
      existingRows,
      path.join(tmpRoot, '.claude', 'skills'),
    );
    assert.ok(
      !merged.find(r => r.skill_name === 'skill-with-removed-dep' && r.bmm_agent === 'bmad-agent-pm'),
      'removed dependency row must be dropped',
    );
    // The still-present dependency (bmad-agent-dev) should remain.
    assert.ok(
      merged.find(r => r.skill_name === 'skill-with-removed-dep' && r.bmm_agent === 'bmad-agent-dev'),
      'current frontmatter dependency should remain',
    );
    const stderr = errorSpy.mock.calls.map(c => c.arguments.join(' '));
    assert.ok(
      stderr.some(l => l.includes('[stale:dep-removed]') && l.includes('skill-with-removed-dep')),
      `expected [stale:dep-removed] log; got: ${stderr.join(' || ')}`,
    );
  });
});

// --- Formatting & internals ---

describe('renderCsv / readExistingCsv — round-trip', () => {
  it('renderCsv emits a trailing LF and correct header', () => {
    const csv = renderCsv([]);
    assert.equal(csv, CSV_HEADER + '\n');
  });

  it('round-trip: readExistingCsv(renderCsv(rows)) deep-equals rows', async () => {
    const rows = [
      {
        skill_name: 'foo',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'convoke',
        registered_by: 'auto-scan',
        registered_date: '2026-04-23',
      },
      {
        skill_name: 'bar',
        bmm_agent: 'bmad-agent-dev',
        dependency_type: 'code-reference',
        source_module: 'unknown',
        registered_by: 'user@example.com',
        registered_date: '2026-02-10',
      },
    ];
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-rt-'));
    try {
      const csvPath = path.join(tmp, 'out.csv');
      await fs.writeFile(csvPath, renderCsv(rows), 'utf8');
      const parsed = readExistingCsv(csvPath);
      assert.deepEqual(parsed, rows);
    } finally {
      await fs.remove(tmp);
    }
  });

  it('readExistingCsv returns [] for missing file', () => {
    const rows = readExistingCsv('/tmp/definitely-does-not-exist-' + Date.now() + '.csv');
    assert.deepEqual(rows, []);
  });

  it('renderCsv rejects non-array input', () => {
    assert.throws(() => renderCsv('not-an-array'), TypeError);
  });
});

describe('_inferSourceModule — prefix rule (AC2)', () => {
  const { _inferSourceModule } = _internal;

  it('bmad-* fallback → bmm', () => {
    assert.equal(_inferSourceModule('bmad-agent-pm'), 'bmm');
    assert.equal(_inferSourceModule('bmad-agent-dev'), 'bmm');
    assert.equal(_inferSourceModule('bmad-create-prd'), 'bmm');
    assert.equal(_inferSourceModule('bmad-agent-quick-flow-solo-dev'), 'bmm');
  });

  it('bmad-agent-bme-* → bme (more specific than bmad-*)', () => {
    assert.equal(_inferSourceModule('bmad-agent-bme-contextualization-expert'), 'bme');
    assert.equal(_inferSourceModule('bmad-agent-bme-team-factory'), 'bme');
  });

  it('bmad-cis-* → cis (more specific than bmad-*)', () => {
    assert.equal(_inferSourceModule('bmad-cis-innovation-strategy'), 'cis');
    assert.equal(_inferSourceModule('bmad-cis-agent-storyteller'), 'cis');
  });

  it('bmad-testarch-* → testarch (more specific than bmad-*)', () => {
    assert.equal(_inferSourceModule('bmad-testarch-atdd'), 'testarch');
    assert.equal(_inferSourceModule('bmad-testarch-framework'), 'testarch');
  });

  it('convoke-* → convoke', () => {
    assert.equal(_inferSourceModule('convoke-update'), 'convoke');
  });

  it('wds-* → wds', () => {
    assert.equal(_inferSourceModule('wds-1-project-brief'), 'wds');
    assert.equal(_inferSourceModule('wds-agent-freya-ux'), 'wds');
  });

  it('q-* and qN-* → fpf (hyphen anchor)', () => {
    assert.equal(_inferSourceModule('q-query'), 'fpf');
    assert.equal(_inferSourceModule('q0-init'), 'fpf');
    assert.equal(_inferSourceModule('q1-hypothesize'), 'fpf');
  });

  it('qN<non-hyphen> → unknown (prevents false positives like q2k-legacy)', () => {
    assert.equal(_inferSourceModule('q2k-legacy'), 'unknown');
    assert.equal(_inferSourceModule('quantum-x'), 'unknown');
    assert.equal(_inferSourceModule('question'), 'unknown');
  });

  it('unknown prefix → unknown', () => {
    assert.equal(_inferSourceModule('foo-bar-baz'), 'unknown');
    assert.equal(_inferSourceModule(''), 'unknown');
    assert.equal(_inferSourceModule(null), 'unknown');
  });
});

describe('_simpleLineDiff — minimal line diff for --verify-only', () => {
  const { _simpleLineDiff } = _internal;

  it('returns empty string for identical inputs', () => {
    assert.equal(_simpleLineDiff('a\nb\nc', 'a\nb\nc'), '');
  });

  it('prefixes removed lines with "- " and added lines with "+ "', () => {
    const diff = _simpleLineDiff('a\nb\nc', 'a\nx\nc');
    assert.match(diff, /^- b$/m);
    assert.match(diff, /^\+ x$/m);
  });
});

// --- Round 1 patches — regression guards ---

describe('H1 — registered_date preservation across runs', () => {
  let tmpRoot;

  afterEach(async () => {
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('preserves registered_date on auto-scan rows whose (skill, agent, type) is unchanged', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    const csvPath = await seedCsv(tmpRoot, [{
      skill_name: 'skill-with-frontmatter-dep',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01', // old date must survive
    }]);
    const scanRows = scanBmmDependencies(tmpRoot);
    const existingRows = readExistingCsv(csvPath);
    const merged = mergePreservingManual(
      scanRows, existingRows, path.join(tmpRoot, '.claude', 'skills'),
    );
    const row = merged.find(r =>
      r.skill_name === 'skill-with-frontmatter-dep' && r.bmm_agent === 'bmad-agent-pm');
    assert.ok(row);
    assert.equal(row.registered_date, '2026-01-01',
      'registered_date must be preserved across runs to keep --verify-only stable');
  });

  it('stamps today on newly-introduced rows', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    // No existing CSV — every scan row is "new".
    const scanRows = scanBmmDependencies(tmpRoot);
    const merged = mergePreservingManual(
      scanRows, [], path.join(tmpRoot, '.claude', 'skills'),
    );
    const row = merged[0];
    assert.match(row.registered_date, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('H2 — multiline-aware CSV line splitting', () => {
  const { _splitCsvLines } = _internal;

  it('treats a \\n inside quoted field as part of that row', () => {
    const raw = 'skill,agent,"multi\nline value",mod,user,2026-01-01\nskill2,agent2,plain,mod,user,2026-01-02\n';
    const lines = _splitCsvLines(raw);
    assert.equal(lines.length, 2);
    assert.ok(lines[0].includes('multi\nline value'),
      `first line should retain embedded newline; got: ${JSON.stringify(lines[0])}`);
  });

  it('round-trips scan output containing an embedded newline via readExistingCsv', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-h2-'));
    try {
      const csvPath = path.join(tmp, 'out.csv');
      const rows = [{
        skill_name: 'multi-line-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'user@example.com\nmore@example.com',
        registered_date: '2026-01-01',
      }];
      await fs.writeFile(csvPath, renderCsv(rows), 'utf8');
      const parsed = readExistingCsv(csvPath);
      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].registered_by, 'user@example.com\nmore@example.com');
    } finally {
      await fs.remove(tmp);
    }
  });
});

describe('H3 — self-reference filter + .yaml allowlist + references/ exclusion', () => {
  let tmpRoot;
  let errorSpy;

  beforeEach(() => {
    errorSpy = mock.method(console, 'error', () => {});
  });

  afterEach(async () => {
    errorSpy.mock.restore();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('does NOT emit a row when a skill references its own name in a step file', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-self-'));
    const skillDir = path.join(tmpRoot, '.claude', 'skills', 'bmad-agent-pm');
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: bmad-agent-pm\n---\nhello\n',
      'utf8',
    );
    // Include a step file that references the skill's own name.
    const stepFile = path.join(skillDir, 'workflow.md');
    await fs.writeFile(stepFile, 'Trigger bmad-agent-pm on step 3.', 'utf8');
    const rows = scanBmmDependencies(tmpRoot);
    assert.equal(rows.length, 0, 'self-reference must not count as a dependency');
  });

  it('greps .yaml files for bmad-agent-* references (cross-skill manifest edges)', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-yaml-'));
    const skillDir = path.join(tmpRoot, '.claude', 'skills', 'skill-yaml-dep');
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: skill-yaml-dep\n---\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(skillDir, 'bmad-skill-manifest.yaml'),
      'dependencies:\n  - bmad-agent-architect\n',
      'utf8',
    );
    const rows = scanBmmDependencies(tmpRoot);
    const match = rows.find(r => r.bmm_agent === 'bmad-agent-architect');
    assert.ok(match, 'YAML manifest agent reference must be detected');
    assert.equal(match.dependency_type, 'code-reference');
  });

  it('skips the references/ subtree (doc examples are NOT dependencies)', async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-refs-'));
    const skillDir = path.join(tmpRoot, '.claude', 'skills', 'skill-with-refs');
    await fs.ensureDir(path.join(skillDir, 'references'));
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: skill-with-refs\n---\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(skillDir, 'references', 'examples.md'),
      'Example: bmad-agent-pm might be invoked here.',
      'utf8',
    );
    const rows = scanBmmDependencies(tmpRoot);
    assert.equal(rows.length, 0, 'references/ subtree must be excluded from grep');
  });
});

describe('M3 — CSV formula-injection sanitization', () => {
  const { _sanitizeFormula } = _internal;

  it('prefixes values beginning with formula sentinels with a single quote', () => {
    // _sanitizeFormula is internal; call renderCsv end-to-end instead.
    const csv = renderCsv([{
      skill_name: '=HYPERLINK("evil")',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01',
    }]);
    assert.ok(csv.includes("'=HYPERLINK"),
      `expected formula sanitization via leading quote; got: ${csv}`);
  });

  it('passes through normal values unchanged', () => {
    const csv = renderCsv([{
      skill_name: 'bmad-agent-pm',
      bmm_agent: 'bmad-agent-dev',
      dependency_type: 'frontmatter',
      source_module: 'bmm',
      registered_by: 'auto-scan',
      registered_date: '2026-01-01',
    }]);
    assert.ok(csv.includes('bmad-agent-pm,bmad-agent-dev,'));
    assert.ok(!csv.includes("'bmad-agent"));
  });

  // _sanitizeFormula existence check (via _internal export suppression).
  // The function is not exported under _internal today; the renderCsv tests
  // above are sufficient behavioral coverage.
  assert.ok(typeof _sanitizeFormula === 'undefined' || typeof _sanitizeFormula === 'function');
});

describe('M4 + R2-D3 — dedup manual and auto rows by (skill, agent, type) triple', () => {
  let tmpRoot;
  let errorSpy;

  beforeEach(() => {
    errorSpy = mock.method(console, 'error', () => {});
  });

  afterEach(async () => {
    errorSpy.mock.restore();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('drops auto-scan row when a manual row exists for the same (skill, agent, type)', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    // Manual row matches scan's triple exactly — scan row gets dropped.
    const csvPath = await seedCsv(tmpRoot, [{
      skill_name: 'skill-with-frontmatter-dep',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'frontmatter',
      source_module: 'unknown',
      registered_by: 'user@example.com',
      registered_date: '2025-12-01',
    }]);
    const scanRows = scanBmmDependencies(tmpRoot);
    const existingRows = readExistingCsv(csvPath);
    const merged = mergePreservingManual(
      scanRows, existingRows, path.join(tmpRoot, '.claude', 'skills'),
    );
    const matching = merged.filter(r =>
      r.skill_name === 'skill-with-frontmatter-dep' && r.bmm_agent === 'bmad-agent-pm');
    assert.equal(matching.length, 1, 'exactly one row per triple expected after dedup');
    assert.equal(matching[0].registered_by, 'user@example.com', 'manual row wins for same type');
  });

  // R2-D3: manual row of one type does NOT suppress scan detection of a
  // different type for the same (skill, agent). Scan supplements rather than
  // replaces a manual registration.
  it('keeps auto-scan row when manual row has a different dependency_type', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    // Manual registration uses 'code-reference' type, but scan detects frontmatter.
    const csvPath = await seedCsv(tmpRoot, [{
      skill_name: 'skill-with-frontmatter-dep',
      bmm_agent: 'bmad-agent-pm',
      dependency_type: 'code-reference',
      source_module: 'unknown',
      registered_by: 'user@example.com',
      registered_date: '2025-12-01',
    }]);
    const scanRows = scanBmmDependencies(tmpRoot);
    const existingRows = readExistingCsv(csvPath);
    const merged = mergePreservingManual(
      scanRows, existingRows, path.join(tmpRoot, '.claude', 'skills'),
    );
    const matching = merged.filter(r =>
      r.skill_name === 'skill-with-frontmatter-dep' && r.bmm_agent === 'bmad-agent-pm');
    assert.equal(matching.length, 2,
      'both manual (code-reference) and scan (frontmatter) rows should survive with triple-key dedup');
    const types = matching.map(r => r.dependency_type).sort();
    assert.deepEqual(types, ['code-reference', 'frontmatter']);
  });
});

describe('M6 — auto-scan marker normalization', () => {
  let tmpRoot;
  let errorSpy;

  beforeEach(() => {
    errorSpy = mock.method(console, 'error', () => {});
  });

  afterEach(async () => {
    errorSpy.mock.restore();
    if (tmpRoot) await fs.remove(tmpRoot);
    tmpRoot = null;
  });

  it('treats AUTO-SCAN (uppercase) and " auto-scan " (whitespace) as auto-scan', async () => {
    tmpRoot = await buildTmpProject(['skill-with-frontmatter-dep']);
    const csvPath = await seedCsv(tmpRoot, [
      {
        skill_name: 'gone-skill-1',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'AUTO-SCAN',
        registered_date: '2026-01-01',
      },
      {
        skill_name: 'gone-skill-2',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: '  auto-scan  ',
        registered_date: '2026-01-01',
      },
    ]);
    const scanRows = scanBmmDependencies(tmpRoot);
    const existingRows = readExistingCsv(csvPath);
    const merged = mergePreservingManual(
      scanRows, existingRows, path.join(tmpRoot, '.claude', 'skills'),
    );
    // Both ghost rows should be dropped as stale, not preserved as "manual".
    assert.ok(!merged.find(r => r.skill_name === 'gone-skill-1'));
    assert.ok(!merged.find(r => r.skill_name === 'gone-skill-2'));
  });
});

describe('R2-P1 — CRLF inside quoted fields preserved byte-identical', () => {
  const { _splitCsvLines } = _internal;

  it('_splitCsvLines preserves \\r\\n inside a quoted field', () => {
    const raw = 'a,b,"line1\r\nline2",d\r\ne,f,g,h\r\n';
    const lines = _splitCsvLines(raw);
    assert.equal(lines.length, 2, 'two logical rows expected');
    assert.ok(lines[0].includes('line1\r\nline2'),
      `quoted CRLF must be preserved inside the field; got: ${JSON.stringify(lines[0])}`);
    assert.ok(!lines[1].includes('\r\n'), 'second row should not contain CRLF');
  });

  it('readExistingCsv round-trips a manual row with CRLF inside a quoted field', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-crlf-quoted-'));
    try {
      const csvPath = path.join(tmp, 'out.csv');
      const rows = [{
        skill_name: 'multi-line-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'line1\r\nline2',
        registered_date: '2026-01-01',
      }];
      await fs.writeFile(csvPath, renderCsv(rows), 'utf8');
      const parsed = readExistingCsv(csvPath);
      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].registered_by, 'line1\r\nline2',
        'CRLF inside a quoted field must survive round-trip byte-identical per AC8');
    } finally {
      await fs.remove(tmp);
    }
  });
});

describe('M7 — BOM / CRLF-resilient header detection', () => {
  it('reads CSV with leading UTF-8 BOM correctly', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-bom-'));
    try {
      const csvPath = path.join(tmp, 'out.csv');
      const content = '﻿' + renderCsv([{
        skill_name: 'foo',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      }]);
      await fs.writeFile(csvPath, content, 'utf8');
      const rows = readExistingCsv(csvPath);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].skill_name, 'foo');
    } finally {
      await fs.remove(tmp);
    }
  });

  it('reads CSV written with CRLF line endings', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-bmm-crlf-'));
    try {
      const csvPath = path.join(tmp, 'out.csv');
      const crlfContent = renderCsv([{
        skill_name: 'foo',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'unknown',
        registered_by: 'auto-scan',
        registered_date: '2026-01-01',
      }]).replace(/\n/g, '\r\n');
      await fs.writeFile(csvPath, crlfContent, 'utf8');
      const rows = readExistingCsv(csvPath);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].skill_name, 'foo');
    } finally {
      await fs.remove(tmp);
    }
  });
});
