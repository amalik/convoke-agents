'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('node:os');
const path = require('node:path');
const yaml = require('js-yaml');

const { mockExecFileSync } = require('../mock-cp');

const MIGRATION_PATH = '../../scripts/update/migrations/3.3.x-to-4.0.0';

// --- Fixture helpers ---

function makeTmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-mig-4.0-'));
}

/**
 * Build a mini pre-v4 project fixture:
 * - `_bmad/core/bmad-init/SKILL.md` — the deprecation target.
 * - `_bmad/_config/v6.3-migration-inventory.csv` — inventory with N canonical entries.
 * - For each canonical entry: the actual SKILL.md on disk (with v3 activation block).
 * - `_bmad/{module}/config.yaml` — seeded so Phase 2 doesn't skip the module.
 */
function seedPreV4Project(tmp, { canonicalEntries = [], seedConfigs = true, bmadInitContent = null } = {}) {
  fs.mkdirSync(path.join(tmp, '_bmad/core/bmad-init'), { recursive: true });
  const defaultBmadInit =
    '---\n' +
    'name: bmad-init\n' +
    'description: Loads module config\n' +
    '---\n\n' +
    '# bmad-init\n\n' +
    'Original body.\n';
  fs.writeFileSync(
    path.join(tmp, '_bmad/core/bmad-init/SKILL.md'),
    bmadInitContent ?? defaultBmadInit,
    'utf8'
  );

  // Inventory CSV
  const header = 'file,module_config_path,module,agent_name,pattern_matched,candidate_status';
  const rows = canonicalEntries.map(e => [
    e.file,
    e.module,
    e.module,
    e.agentName || 'test-agent',
    '1. **Load config via bmad-init skill**',
    'canonical',
  ].join(','));
  fs.mkdirSync(path.join(tmp, '_bmad/_config'), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, '_bmad/_config/v6.3-migration-inventory.csv'),
    [header, ...rows].join('\n') + '\n',
    'utf8'
  );

  // Per-entry SKILL.md files + seeded configs
  const modules = new Set();
  for (const e of canonicalEntries) {
    const absPath = path.join(tmp, e.file);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, e.content || defaultSkillMdWithBmadInit(e.module, e.agentName), 'utf8');
    modules.add(e.module);
  }

  if (seedConfigs) {
    for (const module of modules) {
      const configPath = path.join(tmp, '_bmad', module, 'config.yaml');
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, 'user_name: TestUser\ncommunication_language: English\n', 'utf8');
      }
    }
  }
}

function defaultSkillMdWithBmadInit(module, agentName) {
  return [
    '---',
    `name: ${agentName}`,
    'description: Test agent',
    '---',
    '',
    '# Test agent',
    '',
    '## Overview',
    '',
    'Test agent.',
    '',
    '## On Activation',
    '',
    '1. **Load config via bmad-init skill** — Store all returned vars for use:',
    '   - Use `{user_name}` from config for greeting',
    '   - Use `{communication_language}` from config for all communications',
    '',
    '2. **Continue with steps below:**',
    '   - Greet the user.',
    '',
    '**CRITICAL:** end of file.',
    '',
  ].join('\n');
}

// Doctor output shapes the text parser consumes.
const CLEAN_DOCTOR_OUTPUT = [
  'Running convoke-doctor...',
  '',
  '  ✓ Module present',
  '    Basics fine',
  '  ✓ Taxonomy: valid YAML',
  '',
  '0 issue(s) found, 24 checks passed.',
].join('\n');

const ONE_NEW_FINDING_DOCTOR_OUTPUT = [
  'Running convoke-doctor...',
  '',
  '  ✓ Module present',
  '  ✗ New failure after migration',
  '    Details about the failure',
  '',
  '1 issue(s) found, 23 checks passed.',
].join('\n');

// --- Tests ---

describe('3.3.x-to-4.0.0 — migration module contract (AC1)', () => {
  it('exports Pattern 7 shape: {name, fromVersion, breaking, description, preview, apply}', () => {
    const m = require(MIGRATION_PATH);
    assert.equal(m.name, '3.3.x-to-4.0.0');
    assert.equal(m.fromVersion, '3.3.x');
    assert.equal(m.breaking, true);
    assert.equal(typeof m.description, 'string');
    assert.ok(m.description.length > 0);
    assert.equal(typeof m.preview, 'function');
    assert.equal(typeof m.apply, 'function');
  });
});

describe('3.3.x-to-4.0.0 — Phase 1 detect (AC2)', () => {
  let tmp;
  let m;

  beforeEach(() => {
    tmp = makeTmpProject();
    m = require(MIGRATION_PATH);
  });

  afterEach(() => {
    fs.removeSync(tmp);
  });

  it('returns isPreV4=true when bmad-init dir exists and a canonical inventory target is on disk', () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/test/SKILL.md', module: 'bmm', agentName: 'bmad-agent-test' }],
    });
    const r = m._internal._phase1_detect(tmp);
    assert.equal(r.isPreV4, true);
    assert.match(r.reason, /bmad-init directory present/);
  });

  it('returns isPreV4=false when migration-state-4.0.yaml has phase5_complete', () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/test/SKILL.md', module: 'bmm', agentName: 'bmad-agent-test' }],
    });
    fs.mkdirSync(path.join(tmp, '_bmad/_memory'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, '_bmad/_memory/migration-state-4.0.yaml'),
      'schema_version: 1\nphase5_complete: true\n',
      'utf8'
    );
    const r = m._internal._phase1_detect(tmp);
    assert.equal(r.isPreV4, false);
    assert.match(r.reason, /phase5_complete/);
  });

  it('returns isPreV4=false when no bmad-init artifacts exist', () => {
    // Empty project, no _bmad/core/bmad-init/, no inventory.
    fs.mkdirSync(path.join(tmp, '_bmad'), { recursive: true });
    const r = m._internal._phase1_detect(tmp);
    assert.equal(r.isPreV4, false);
  });
});

describe('3.3.x-to-4.0.0 — Phase 3 _rewriteActivation (AC4)', () => {
  let m;

  beforeEach(() => {
    m = require(MIGRATION_PATH);
  });

  it('replaces canonical step-1 block with v4 template parameterized by module', () => {
    const input = defaultSkillMdWithBmadInit('bmm', 'bmad-agent-test');
    const { rewritten, content } = m._internal._rewriteActivation(input, 'bmm');

    assert.equal(rewritten, true);
    // Old pattern gone
    assert.doesNotMatch(content, /1\.\s+\*\*Load config via bmad-init skill\*\*/);
    // New template present with module substituted
    assert.match(content, /1\.\s+\*\*Load config\*\*/);
    assert.match(content, /_bmad\/bmm\/config\.yaml/);
    assert.doesNotMatch(content, /\{module\}/);  // substitution happened
    // Step 2 preserved
    assert.match(content, /2\.\s+\*\*Continue with steps below:\*\*/);
    // Tail preserved
    assert.match(content, /\*\*CRITICAL:\*\* end of file/);
  });

  it('preserves pre-On-Activation content byte-identically', () => {
    const input = defaultSkillMdWithBmadInit('bmm', 'bmad-agent-test');
    const { content } = m._internal._rewriteActivation(input, 'bmm');

    const originalFrontmatter = input.slice(0, input.indexOf('## On Activation'));
    const rewrittenFrontmatter = content.slice(0, content.indexOf('## On Activation'));
    assert.equal(originalFrontmatter, rewrittenFrontmatter);
  });

  it('handles CRLF line endings (normalizes to CRLF on write)', () => {
    const input = defaultSkillMdWithBmadInit('cis', 'test-agent').replace(/\n/g, '\r\n');
    const { rewritten, content } = m._internal._rewriteActivation(input, 'cis');

    assert.equal(rewritten, true);
    assert.match(content, /\r\n/, 'CRLF line endings preserved');
  });

  it('returns rewritten=false when no "## On Activation" section exists', () => {
    const input = '# agent\n\n## Overview\n\nno activation section\n';
    const r = m._internal._rewriteActivation(input, 'bmm');
    assert.equal(r.rewritten, false);
    assert.match(r.reason, /No "## On Activation" section found|no "## On Activation" section found/i);
  });

  it('returns rewritten=false when "On Activation" exists but has no canonical step-1', () => {
    const input = [
      '## On Activation',
      '',
      '1. **Some other instruction** — do nothing bmad-init-related',
      '',
      '2. **Continue**',
    ].join('\n');
    const r = m._internal._rewriteActivation(input, 'bmm');
    assert.equal(r.rewritten, false);
    assert.match(r.reason, /bmad-init skill|Load config via bmad-init/i);
  });
});

describe('3.3.x-to-4.0.0 — Phase 2 + Phase 3 integration (state file + sweep)', () => {
  let tmp;
  let cpMock;

  beforeEach(() => {
    tmp = makeTmpProject();
    cpMock = mockExecFileSync(MIGRATION_PATH, __dirname);
    cpMock.setReturnValue(CLEAN_DOCTOR_OUTPUT);
  });

  afterEach(() => {
    cpMock.restore();
    fs.removeSync(tmp);
  });

  it('Phase 2 writes state file with expected schema after config verification (AC3)', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [
        { file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' },
        { file: '_bmad/bmm/b/SKILL.md', module: 'bmm', agentName: 'b' },
      ],
    });
    const mod = cpMock.module;
    await mod._internal._phase2_verifyConfigs(tmp);

    const state = yaml.load(
      fs.readFileSync(path.join(tmp, '_bmad/_memory/migration-state-4.0.yaml'), 'utf8')
    );
    assert.equal(state.schema_version, 1);
    assert.equal(state.phase1_complete, true);
    assert.equal(state.phase2_complete, true);
    assert.equal(state.phase3_files_total, 2);
    assert.deepEqual(state.phase3_files_done, []);
    assert.equal(state.phase4_complete, false);
    assert.equal(state.phase5_complete, false);
    assert.ok(state.phase2_doctor_baseline, 'doctor baseline captured');
  });

  it('Phase 2 skips module with missing config.yaml; warning logged but completion proceeds (AC3 fail-soft)', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' }],
      seedConfigs: false,
    });
    const warnSpy = mock.method(console, 'warn', () => {});
    try {
      const mod = cpMock.module;
      const r = await mod._internal._phase2_verifyConfigs(tmp);
      assert.deepEqual(r.modulesSkipped, ['bmm']);
      assert.ok(
        warnSpy.mock.calls.some(c => /module config missing/.test(c.arguments[0])),
        'warning should mention module config missing'
      );
    } finally {
      warnSpy.mock.restore();
    }
  });

  it('Phase 3 rewrites canonical entries and checkpoints each to state file (AC4)', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [
        { file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' },
        { file: '_bmad/bmm/b/SKILL.md', module: 'bmm', agentName: 'b' },
        { file: '_bmad/cis/c/SKILL.md', module: 'cis', agentName: 'c' },
      ],
    });
    const mod = cpMock.module;
    await mod._internal._phase2_verifyConfigs(tmp);
    const r = mod._internal._phase3_sweepSkillMd(tmp);

    assert.equal(r.filesRewritten, 3);
    // Each file should have v4 pattern
    const aContent = fs.readFileSync(path.join(tmp, '_bmad/bmm/a/SKILL.md'), 'utf8');
    assert.match(aContent, /_bmad\/bmm\/config\.yaml/);
    assert.doesNotMatch(aContent, /Load config via bmad-init skill/);

    const state = yaml.load(
      fs.readFileSync(path.join(tmp, '_bmad/_memory/migration-state-4.0.yaml'), 'utf8')
    );
    assert.equal(state.phase3_files_done.length, 3);
    assert.equal(state.phase3_complete, true);
  });

  it('Phase 3 skips files with no matching activation block (fail-soft) and records reason in state', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [
        {
          file: '_bmad/bmm/malformed/SKILL.md',
          module: 'bmm',
          agentName: 'malformed',
          content: '---\nname: malformed\n---\n\n# No activation section here\n',
        },
      ],
    });
    const warnSpy = mock.method(console, 'warn', () => {});
    try {
      const mod = cpMock.module;
      await mod._internal._phase2_verifyConfigs(tmp);
      const r = mod._internal._phase3_sweepSkillMd(tmp);

      assert.equal(r.filesRewritten, 0);
      const state = yaml.load(
        fs.readFileSync(path.join(tmp, '_bmad/_memory/migration-state-4.0.yaml'), 'utf8')
      );
      assert.equal(state.phase3_files_skipped.length, 1);
      assert.match(state.phase3_files_skipped[0].reason, /On Activation|bmad-init/i);
    } finally {
      warnSpy.mock.restore();
    }
  });
});

describe('3.3.x-to-4.0.0 — Phase 4 deprecation banner (AC5)', () => {
  let tmp;
  let cpMock;

  beforeEach(() => {
    tmp = makeTmpProject();
    cpMock = mockExecFileSync(MIGRATION_PATH, __dirname);
    cpMock.setReturnValue(CLEAN_DOCTOR_OUTPUT);
  });

  afterEach(() => {
    cpMock.restore();
    fs.removeSync(tmp);
  });

  it('inserts banner after frontmatter when not present', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' }],
    });
    const mod = cpMock.module;
    await mod._internal._phase2_verifyConfigs(tmp);
    const r = mod._internal._phase4_deprecateBmadInit(tmp);

    assert.equal(r.bannerAdded, true);
    const updated = fs.readFileSync(path.join(tmp, '_bmad/core/bmad-init/SKILL.md'), 'utf8');
    assert.match(updated, /> ⚠️ \*\*DEPRECATED in Convoke 4\.0\*\*/);
    // Original body preserved
    assert.match(updated, /# bmad-init/);
    assert.match(updated, /Original body\./);
  });

  it('is idempotent when banner already present (sentinel-detected)', async () => {
    // Idempotency now uses the stable HTML-comment sentinel (survives banner
    // wording changes). Fixture includes the sentinel.
    const sentinel = '<!-- convoke:deprecation-banner:bmad-init -->';
    const banner = `${sentinel}\n> ⚠️ **DEPRECATED in Convoke 4.0** — already here`;
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' }],
      bmadInitContent: `---\nname: bmad-init\n---\n\n${banner}\n\n# bmad-init\n`,
    });
    const mod = cpMock.module;
    await mod._internal._phase2_verifyConfigs(tmp);
    const before = fs.readFileSync(path.join(tmp, '_bmad/core/bmad-init/SKILL.md'), 'utf8');
    const r = mod._internal._phase4_deprecateBmadInit(tmp);
    const after = fs.readFileSync(path.join(tmp, '_bmad/core/bmad-init/SKILL.md'), 'utf8');

    assert.equal(r.bannerAdded, false);
    assert.equal(before, after, 'file should be byte-identical when banner already present');
  });
});

describe('3.3.x-to-4.0.0 — Phase 5 doctor diff (AC6)', () => {
  let tmp;
  let cpMock;

  beforeEach(() => {
    tmp = makeTmpProject();
    cpMock = mockExecFileSync(MIGRATION_PATH, __dirname);
  });

  afterEach(() => {
    cpMock.restore();
    fs.removeSync(tmp);
  });

  it('reports zero new findings when before and after doctor output match', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' }],
    });
    cpMock.setReturnValue(CLEAN_DOCTOR_OUTPUT);

    const mod = cpMock.module;
    await mod._internal._phase2_verifyConfigs(tmp);
    const r = mod._internal._phase5_doctorDiff(tmp);

    assert.deepEqual(r.newFindings, []);
    const state = yaml.load(
      fs.readFileSync(path.join(tmp, '_bmad/_memory/migration-state-4.0.yaml'), 'utf8')
    );
    assert.equal(state.phase5_complete, true);
  });

  it('strips ANSI color codes from doctor output (M7 hardening)', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' }],
    });
    // Simulate chalk/ANSI-colored output: the ✗ marker is wrapped in red.
    const coloredDoctor = [
      'Running convoke-doctor...',
      '',
      '  [31m✗[0m Check with color',
      '    Detail line',
      '',
      '1 issue(s) found.',
    ].join('\n');

    cpMock.setReturnValue(coloredDoctor);
    const mod = cpMock.module;
    await mod._internal._phase2_verifyConfigs(tmp);

    // Verify baseline parsed the colored ✗ correctly.
    const state = yaml.load(
      fs.readFileSync(path.join(tmp, '_bmad/_memory/migration-state-4.0.yaml'), 'utf8')
    );
    assert.equal(state.phase2_doctor_baseline.findings.length, 1);
    assert.equal(state.phase2_doctor_baseline.findings[0].name, 'Check with color',
      'ANSI escapes should be stripped before regex match');
  });

  it('reports new findings as WARNINGS (fail-soft, state still completes)', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' }],
    });

    // Phase 2 capture: clean baseline.
    cpMock.setReturnValue(CLEAN_DOCTOR_OUTPUT);
    const mod = cpMock.module;
    await mod._internal._phase2_verifyConfigs(tmp);

    // Phase 5 after-run: 1 new finding.
    cpMock.setReturnValue(ONE_NEW_FINDING_DOCTOR_OUTPUT);
    const warnSpy = mock.method(console, 'warn', () => {});
    try {
      const r = mod._internal._phase5_doctorDiff(tmp);
      assert.equal(r.newFindings.length, 1);
      assert.match(r.newFindings[0].name, /New failure after migration/);
      assert.ok(warnSpy.mock.calls.length > 0, 'should warn on new findings');
    } finally {
      warnSpy.mock.restore();
    }
  });
});

describe('3.3.x-to-4.0.0 — preview() (AC7)', () => {
  let tmp;
  let m;

  beforeEach(() => {
    tmp = makeTmpProject();
    m = require(MIGRATION_PATH);
  });

  afterEach(() => {
    fs.removeSync(tmp);
  });

  it('returns actions array describing what apply() will do (no filesystem mutations)', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [
        { file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' },
        { file: '_bmad/bmm/b/SKILL.md', module: 'bmm', agentName: 'b' },
      ],
    });
    const snapshotBefore = fs.readdirSync(tmp);
    const r = await m.preview(tmp);

    assert.ok(Array.isArray(r.actions));
    assert.ok(r.actions.length >= 3);
    assert.ok(r.actions.some(a => /2 upstream-BMAD SKILL\.md/.test(a)), 'action should cite canonical count');
    assert.ok(r.actions.some(a => /deprecation banner/.test(a)));
    assert.ok(r.actions.some(a => /convoke-doctor/.test(a)));

    const snapshotAfter = fs.readdirSync(tmp);
    assert.deepEqual(snapshotBefore, snapshotAfter, 'preview() must not mutate filesystem');
    // No state file created by preview.
    assert.equal(fs.existsSync(path.join(tmp, '_bmad/_memory/migration-state-4.0.yaml')), false);
  });

  it('short-circuits when no pre-v4 state detected (already at v4)', async () => {
    // Project with no inventory CSV and no bmad-init/ dir → _phase1_detect
    // returns isPreV4: false → preview reports "already complete."
    fs.mkdirSync(path.join(tmp, '_bmad'), { recursive: true });
    const r = await m.preview(tmp);
    assert.ok(Array.isArray(r.actions));
    assert.equal(r.actions.length, 1);
    assert.match(r.actions[0], /Migration already complete|no actions/);
  });

  it('returns short-circuit action when state file marks phase5_complete', async () => {
    seedPreV4Project(tmp, {
      canonicalEntries: [{ file: '_bmad/bmm/a/SKILL.md', module: 'bmm', agentName: 'a' }],
    });
    fs.mkdirSync(path.join(tmp, '_bmad/_memory'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, '_bmad/_memory/migration-state-4.0.yaml'),
      'schema_version: 1\nphase5_complete: true\n',
      'utf8'
    );
    const r = await m.preview(tmp);
    assert.equal(r.actions.length, 1);
    assert.match(r.actions[0], /already complete/);
  });
});
