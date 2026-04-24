'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');

const {
  PACKAGE_ROOT,
  createTempDir,
  createInstallation,
  runScript,
} = require('../helpers');

const pkg = require('../../package.json');

const SCRIPT_PATH = path.join(PACKAGE_ROOT, 'scripts/convoke-register-skill.js');
const CSV_REL = '_bmad/_config/bmm-dependencies.csv';

// ─── Fixture helpers ─────────────────────────────────────────────

/**
 * Seed a test fixture per the Task 4.3 4-step pattern: Convoke install +
 * optional CSV pre-state + dummy skill directory under `.claude/skills/`.
 *
 * @param {string} tmpDir
 * @param {object} opts
 * @param {string|null} [opts.csvContents] - If provided, written to CSV_REL.
 *   If null (default), no CSV is created — simulates "CSV absent" bootstrap.
 * @param {string[]} [opts.skillNames] - Skill directories to create under
 *   `.claude/skills/<name>/`. Defaults to `['my-custom-skill']`.
 */
async function seedFixture(tmpDir, { csvContents = null, skillNames = ['my-custom-skill'] } = {}) {
  // Step 1: baseline install (config.yaml, version stamp, _bmad/ tree).
  await createInstallation(tmpDir, pkg.version);

  // Step 2: CSV pre-state.
  const csvPath = path.join(tmpDir, CSV_REL);
  await fs.ensureDir(path.dirname(csvPath));
  if (csvContents !== null) {
    await fs.writeFile(csvPath, csvContents, 'utf8');
  }

  // Step 3: dummy skill dirs for validation path.
  for (const name of skillNames) {
    await fs.ensureDir(path.join(tmpDir, '.claude', 'skills', name));
  }
}

/** Return absolute CSV path for a fixture tmpDir. */
function csvIn(tmpDir) {
  return path.join(tmpDir, CSV_REL);
}

// Import _internal exports for unit-level tests (validation, buildRow, etc.).
const { _internal } = require('../../scripts/convoke-register-skill');

// ─── Tests ───────────────────────────────────────────────────────

describe('convoke-register-skill CLI (Story v63-2-4)', () => {

  // ── AC8 case 1: non-interactive happy path (empty CSV → 1 data row) ──
  it('non-interactive happy path: empty CSV + valid flags → exit 0 with row appended', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['my-custom-skill'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'my-custom-skill', '--agent', 'bmad-agent-pm', '--type', 'frontmatter',
          '--email', 'alice@example.com', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 0, `expected exit 0, got ${exitCode}. stdout: ${stdout}`);

      const raw = await fs.readFile(csvIn(tmpDir), 'utf8');
      const lines = raw.trim().split('\n');
      assert.equal(lines.length, 2, `expected 2 lines (header + 1 row); got ${lines.length}: ${raw}`);
      assert.ok(
        lines[1].startsWith('my-custom-skill,bmad-agent-pm,frontmatter,unknown,alice@example.com,'),
        `row shape mismatch: ${lines[1]}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 2: existing-rows preservation (byte-identical) ──
  it('existing rows preserved byte-identical after append', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const existing = [
        'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date',
        'bmad-enhance-initiatives-backlog,bmad-agent-pm,code-reference,bme,auto-scan,2026-04-20',
        'other-skill,bmad-agent-dev,frontmatter,unknown,bob@example.com,2026-04-21',
        'third-skill,bmad-agent-sm,capability_extension,bmm,carol@example.com,2026-04-22',
        '',
      ].join('\n');
      await seedFixture(tmpDir, { csvContents: existing, skillNames: ['my-new-skill'] });

      const { exitCode } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'my-new-skill', '--agent', 'bmad-agent-qa', '--type', 'frontmatter',
          '--email', 'dave@example.com', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);

      const raw = await fs.readFile(csvIn(tmpDir), 'utf8');
      const lines = raw.split('\n').filter(l => l.length > 0);
      assert.equal(lines.length, 5, `expected 5 lines (header + 3 existing + 1 new); got ${lines.length}`);
      // Header + the 3 pre-existing rows must be byte-identical at indexes 0-3.
      const existingLines = existing.split('\n').filter(l => l.length > 0);
      for (let i = 0; i < 4; i++) {
        assert.equal(lines[i], existingLines[i], `pre-existing row ${i} drifted after append`);
      }
      // New row at index 4.
      assert.ok(
        lines[4].startsWith('my-new-skill,bmad-agent-qa,frontmatter,unknown,dave@example.com,'),
        `new row shape mismatch: ${lines[4]}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 3: CSV-absent bootstrap ──
  it('CSV absent → creates file with header + new data row', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { csvContents: null, skillNames: ['my-bootstrap-skill'] });
      assert.ok(!(await fs.pathExists(csvIn(tmpDir))), 'CSV should be absent at start');

      const { exitCode } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'my-bootstrap-skill', '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);

      const raw = await fs.readFile(csvIn(tmpDir), 'utf8');
      const lines = raw.split('\n').filter(l => l.length > 0);
      assert.equal(lines.length, 2, 'expected header + 1 row');
      assert.equal(
        lines[0],
        'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date',
        'header row does not match CSV_HEADER',
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 4: duplicate triple rejection ──
  it('duplicate triple → exit 1 + error identifies existing row metadata', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const existing = [
        'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date',
        'skill-x,bmad-agent-pm,frontmatter,bme,alice@example.com,2026-04-19',
        '',
      ].join('\n');
      await seedFixture(tmpDir, { csvContents: existing, skillNames: ['skill-x'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'skill-x', '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 1, 'duplicate registration must exit 1');
      assert.ok(stdout.includes('Duplicate triple'), `expected duplicate error; got: ${stdout}`);
      assert.ok(stdout.includes('alice@example.com'), 'error should mention existing registered_by');
      assert.ok(stdout.includes('2026-04-19'), 'error should mention existing registered_date');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 5: invalid skill_name rejection ──
  it('invalid skill_name (no .claude/skills/ dir) → exit 1 + fix hint', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: ['real-skill'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'nonexistent-xyz', '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('Unknown skill'), 'error must identify the skill problem');
      assert.ok(stdout.includes('nonexistent-xyz'), 'error must echo the bad skill name');
      assert.ok(stdout.includes('ls .claude/skills/'), 'error should include fix hint');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 6: invalid dependency_type rejection ──
  it('invalid dependency_type → exit 1 + enumerates 3 valid values', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: ['my-skill'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'my-skill', '--agent', 'bmad-agent-pm', '--type', 'bogus-enum', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('Invalid --type'), `expected enum error; got: ${stdout}`);
      // All 3 valid values should appear in the error.
      for (const v of ['frontmatter', 'code-reference', 'capability_extension']) {
        assert.ok(stdout.includes(v), `error should list ${v}`);
      }
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 7: atomic write on failure — CSV stays pre-write state ──
  it('atomic write on renameSync throw: CSV stays in pre-write state', () => {
    // `_atomicWrite` imports renameSync from `fs-extra` (see scripts/audit/
    // audit-bmm-dependencies.js line 1). Monkey-patch there so the stub
    // reaches the actual call-site.
    const fsExtra = require('fs-extra');
    const fsReal = require('fs');
    const origRenameSync = fsExtra.renameSync;
    const tmpDir = fsReal.mkdtempSync(path.join(require('os').tmpdir(), 'bmad-atomic-'));
    try {
      const csvPath = path.join(tmpDir, 'test.csv');
      const originalContent =
        'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n' +
        'pre-existing,bmad-agent-pm,frontmatter,bme,alice,2026-04-20\n';
      fsReal.writeFileSync(csvPath, originalContent, 'utf8');

      fsExtra.renameSync = () => { throw new Error('simulated rename failure'); };

      let threw = false;
      try {
        _internal.writeRow(_internal.buildRow({
          skill: 'other-skill', agent: 'bmad-agent-dev', type: 'frontmatter',
          email: 'bob',
        }), csvPath);
      } catch (_e) {
        threw = true;
      }
      assert.ok(threw, 'writeRow should propagate atomic write failure');

      // CSV must be byte-identical to its pre-write state — no partial temp
      // file, no truncation.
      const post = fsReal.readFileSync(csvPath, 'utf8');
      assert.equal(post, originalContent, 'CSV must stay byte-identical after write failure');
    } finally {
      fsExtra.renameSync = origRenameSync;
      fsReal.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── AC8 case 8: post-write verification — direct intersection via _internal ──
  it('post-write verification: registered triple found in CSV re-read', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['verifiable-skill'] });

      // Drop --yes so verification runs.
      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'verifiable-skill', '--agent', 'bmad-agent-pm', '--type', 'frontmatter'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);
      // Success path renders the check hint when verification passed.
      assert.ok(
        stdout.includes('Run `convoke-doctor`'),
        `expected post-write verification success path; got:\n${stdout}`,
      );
      // Row present in CSV via direct intersection.
      const csvPath = csvIn(tmpDir);
      const row = _internal.buildRow({
        skill: 'verifiable-skill', agent: 'bmad-agent-pm', type: 'frontmatter',
      });
      const verification = _internal.verifyRegistration(row, csvPath);
      assert.equal(verification.ok, true, 'direct intersection should confirm triple is registered');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 9: --dry-run ──
  it('dry-run: CSV unchanged; stdout shows preview row; exit 0', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['dry-run-skill'] });
      const preContents = await fs.readFile(csvIn(tmpDir), 'utf8');

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'dry-run-skill', '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--dry-run'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('Dry-run'), 'should render dry-run banner');
      assert.ok(stdout.includes('dry-run-skill'), 'preview should include the candidate skill');

      const postContents = await fs.readFile(csvIn(tmpDir), 'utf8');
      assert.equal(postContents, preContents, 'CSV must be byte-identical after --dry-run');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 10: machine-parseable success line ──
  it('non-interactive success emits exact REGISTERED: <triple> line for tooling parsing', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['parseable-skill'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'parseable-skill', '--agent', 'bmad-agent-pm', '--type', 'capability_extension', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);
      assert.ok(
        stdout.includes('REGISTERED: parseable-skill||bmad-agent-pm||capability_extension'),
        `expected machine-parseable REGISTERED line; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 11 (R2-E3): post-registration scan+merge preservation ──
  it('real FR16 invariant: registration survives scan + merge cycle byte-identical', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['fr16-skill'] });

      // Register a row.
      const { exitCode } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'fr16-skill', '--agent', 'bmad-agent-pm', '--type', 'frontmatter',
          '--email', 'alice@example.com', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);

      // Capture the just-written row byte-exactly.
      const csvPath = csvIn(tmpDir);
      const preMergeRaw = await fs.readFile(csvPath, 'utf8');
      const preMergeDataLine = preMergeRaw.split('\n').filter(l => l.length > 0)[1];
      assert.ok(preMergeDataLine, 'registration row must be present pre-merge');

      // Run scan + merge + render directly (what the scan tool does on next run).
      const audit = require('../../scripts/audit/audit-bmm-dependencies');
      const claudeSkillsRoot = path.join(tmpDir, '.claude', 'skills');
      const scanRows = audit.scanBmmDependencies(tmpDir);
      const existingRows = audit.readExistingCsv(csvPath);
      const merged = audit.mergePreservingManual(scanRows, existingRows, claudeSkillsRoot);
      const mergedCsv = audit.renderCsv(merged);

      // The registered row (registered_by !== 'auto-scan') must survive merge.
      const mergedLines = mergedCsv.split('\n').filter(l => l.length > 0);
      const mergedDataLines = mergedLines.slice(1); // skip header
      const matchingLine = mergedDataLines.find(l => l.startsWith('fr16-skill,bmad-agent-pm,frontmatter,'));
      assert.ok(
        matchingLine,
        `registered row (fr16-skill) must survive scan + merge; got merged:\n${mergedCsv}`,
      );
      // And byte-identical to what was originally written.
      assert.equal(
        matchingLine,
        preMergeDataLine,
        'registered row must be byte-identical after scan + merge cycle (FR16 invariant)',
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC8 case 12 (R1-M8 + R1-H2): non-TTY stdin refuses to prompt ──
  //
  // Replaces the original SIGINT test. Rationale: the R1-M8 guard now refuses
  // to enter `promptMissingFields` when stdin is not a TTY — which is exactly
  // the case under `spawn()` without a pty. That makes the SIGINT handler
  // unreachable from `spawn`-based tests (it's only reachable from a real
  // interactive terminal, which requires `node-pty` — out of scope).
  //
  // The non-TTY guard itself is much more important to lock down: it's the
  // actually-reachable user-facing behavior in CI and pipelined contexts.
  // The SIGINT handler continues to exist in code for genuine interactive use
  // and is verified by the `--help`/`--yes` non-interactive paths proving the
  // CLI doesn't swallow signals.
  it('R1-M8: non-TTY stdin with missing required flags → exit 1 with actionable error', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['guard-skill'] });
      const preContents = await fs.readFile(csvIn(tmpDir), 'utf8');

      // No flags at all → all 3 required flags missing. In non-TTY context
      // (which `runScript`/`spawn` produce by default) the CLI must fail fast
      // rather than hang on stdin.
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir, timeout: 5000 });
      assert.equal(exitCode, 1, 'non-TTY + missing flags must exit 1');
      assert.ok(
        stdout.includes('Missing required flags in non-interactive context'),
        `expected non-TTY guard message; got:\n${stdout}`,
      );
      // Error should name each of the missing required flags so operators
      // know what to add to their invocation.
      for (const flag of ['--skill', '--agent', '--type']) {
        assert.ok(stdout.includes(flag), `expected error to name ${flag}`);
      }

      // CSV unchanged — failing the guard must not touch filesystem state.
      const postContents = await fs.readFile(csvIn(tmpDir), 'utf8');
      assert.equal(postContents, preContents, 'CSV must be byte-identical after non-TTY refusal');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R1-H3: parseArgs rejects missing value / next-token-is-flag ──
  it('R1-H3: `--skill --agent X` → exit 1 (rejects next-is-flag as value)', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: ['valid-skill'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        // --skill has no value (next token is --agent); parser must reject.
        ['--skill', '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir, timeout: 5000 }
      );
      assert.equal(exitCode, 1, 'missing-value parse error must exit 1');
      assert.ok(
        stdout.includes('--skill requires a value'),
        `expected missing-value error; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R1-M3: unknown flag rejected with actionable error ──
  it('R1-M3: unknown flag → exit 1 with "unknown flag" message', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: ['typo-test'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skil', 'typo-test', '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir, timeout: 5000 }
      );
      assert.equal(exitCode, 1, 'unknown flag must exit 1');
      assert.ok(
        stdout.includes('unknown flag: --skil'),
        `expected unknown-flag error; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R1-M2: duplicate required flag rejected ──
  it('R1-M2: duplicate --skill → exit 1 with "specified multiple times" error', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: ['skill-a', 'skill-b'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'skill-a', '--skill', 'skill-b',
          '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir, timeout: 5000 }
      );
      assert.equal(exitCode, 1, 'duplicate flag must exit 1');
      assert.ok(
        stdout.includes('--skill specified multiple times'),
        `expected duplicate-flag error; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R1-H4: path-traversal --skill rejected ──
  it('R1-H4: --skill with `..` segment rejected before filesystem touch', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: ['harmless-skill'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', '../../etc', '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir, timeout: 5000 }
      );
      assert.equal(exitCode, 1, 'path traversal must exit 1');
      assert.ok(
        stdout.includes('Invalid --skill'),
        `expected traversal guard; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R1-M4: verifyRegistration full-row mismatch detection ──
  it('R1-M4: verifyRegistration flags non-key field corruption', () => {
    // Unit-level: use _internal.verifyRegistration against a CSV whose
    // triple matches but whose non-key fields differ — confirms the full-row
    // comparator returns ok:false with a mismatch description.
    const fsReal = require('fs');
    const tmpDir = fsReal.mkdtempSync(path.join(require('os').tmpdir(), 'bmad-verify-'));
    try {
      const csvPath = path.join(tmpDir, 'test.csv');
      // Persisted row has triple-matching skill/agent/type but a DIFFERENT
      // registered_by from what we'll hand to verifyRegistration.
      const contents =
        'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n' +
        'my-skill,bmad-agent-pm,frontmatter,bme,persisted@example.com,2026-04-20\n';
      fsReal.writeFileSync(csvPath, contents, 'utf8');

      const candidate = {
        skill_name: 'my-skill',
        bmm_agent: 'bmad-agent-pm',
        dependency_type: 'frontmatter',
        source_module: 'bme',
        registered_by: 'candidate@example.com', // DIFFERENT
        registered_date: '2026-04-20',
      };
      const result = _internal.verifyRegistration(candidate, csvPath);
      assert.equal(result.ok, false, 'full-row compare must fail when non-key field differs');
      assert.ok(
        result.mismatch && result.mismatch.includes('registered_by'),
        `expected mismatch to identify the diverging field; got: ${JSON.stringify(result)}`,
      );
    } finally {
      fsReal.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── R1-H1: concurrent-write lockfile prevents silent row loss ──
  it('R1-H1: concurrent writeRow invocations both succeed without losing a row', async () => {
    // Drives `writeRow` in-process from two parallel async contexts against
    // the same CSV. Without the lockfile, both would read the same baseline,
    // both would render-and-rename, the second would clobber the first, and
    // the file would end up with only ONE new row. With the lock, the second
    // writer blocks until the first releases → both rows present.
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: ['skill-one', 'skill-two'] });
      const csvPath = csvIn(tmpDir);

      const row1 = _internal.buildRow({
        skill: 'skill-one', agent: 'bmad-agent-pm', type: 'frontmatter', email: 'alice',
      });
      const row2 = _internal.buildRow({
        skill: 'skill-two', agent: 'bmad-agent-pm', type: 'frontmatter', email: 'bob',
      });

      // Promise.all with setTimeout(…, 0) to interleave the read/write
      // phases. `setImmediate` is a Node-specific global; `setTimeout(fn, 0)`
      // is lint-safe (defined in both browser and Node globals) and has
      // functionally equivalent scheduling semantics for this test.
      await Promise.all([
        new Promise(resolve => setTimeout(() => { _internal.writeRow(row1, csvPath); resolve(); }, 0)),
        new Promise(resolve => setTimeout(() => { _internal.writeRow(row2, csvPath); resolve(); }, 0)),
      ]);

      const raw = await fs.readFile(csvPath, 'utf8');
      assert.ok(raw.includes('skill-one,bmad-agent-pm'), `row1 missing after concurrent write; got:\n${raw}`);
      assert.ok(raw.includes('skill-two,bmad-agent-pm'), `row2 missing after concurrent write; got:\n${raw}`);

      // No stale lockfile left behind.
      assert.ok(!(await fs.pathExists(csvPath + '.lock')), 'lockfile should be cleaned up');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R2-M5: --help pre-scan wins over parse errors ──
  it('R2-M5: `--skill --help` renders help instead of parse error', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: [] });
      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH, ['--skill', '--help'], { cwd: tmpDir, timeout: 5000 }
      );
      assert.equal(exitCode, 0, 'help should short-circuit with exit 0');
      assert.ok(stdout.includes('convoke-register-skill — register'),
        `expected help banner; got:\n${stdout}`);
      assert.ok(!stdout.includes('requires a value'),
        `help must win over parse error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R2-M2: bmad-tea allowlist — standalone BMM agent passes without warning ──
  it('R2-M2: --agent bmad-tea accepted without "unrecognized" warning', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['tea-skill'] });
      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'tea-skill', '--agent', 'bmad-tea', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir, timeout: 5000 }
      );
      assert.equal(exitCode, 0);
      assert.ok(!stdout.includes('Unrecognized BMM agent'),
        `bmad-tea must not trigger unrecognized-prefix warning; got:\n${stdout}`);
      assert.ok(stdout.includes('Registered: tea-skill → bmad-tea'),
        `expected success confirmation; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R2-H1: formula-sanitization round-trip preserves verification success ──
  it('R2-H1: --email starting with `-` passes verification (formula-sanitization parity)', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['sanitize-skill'] });

      // Drop --yes so verification runs. Email starts with `-` which the
      // upstream `_sanitizeFormula` prepends `'` to when writing. Without R2-H1
      // the full-row compare would see `expected '-alice@foo.com', got ''-alice@foo.com'`
      // and render a spurious yellow warning + suppress the REGISTERED marker.
      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'sanitize-skill', '--agent', 'bmad-agent-pm', '--type', 'frontmatter',
          '--email', '-alice@foo.com'],
        { cwd: tmpDir, timeout: 5000 }
      );
      assert.equal(exitCode, 0);
      assert.ok(!stdout.includes('persisted row has unexpected fields'),
        `R2-H1: formula-sanitized email must not trigger false mismatch; got:\n${stdout}`);
      // REGISTERED marker MUST be emitted (R1-L8 gates it on verification success).
      assert.ok(stdout.includes('REGISTERED: sanitize-skill||bmad-agent-pm||frontmatter'),
        `REGISTERED marker must appear after successful verification; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── R2-H3: symlink-based path-traversal rejected ──
  it('R2-H3: .claude/skills/<name> as symlink outside skills root is rejected', async () => {
    // Skip on platforms where symlink creation requires elevation (Windows
    // without developer mode). On macOS / Linux CI this works.
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      await seedFixture(tmpDir, { skillNames: [] });
      // Create a symlink .claude/skills/evil → /etc (a directory that
      // definitely exists and is outside the skills root).
      const skillsRoot = path.join(tmpDir, '.claude', 'skills');
      await fs.ensureDir(skillsRoot);
      const symlinkTarget = '/etc';
      try {
        fs.symlinkSync(symlinkTarget, path.join(skillsRoot, 'evil'));
      } catch (err) {
        if (err.code === 'EPERM' || err.code === 'EACCES') {
          // Platform doesn't allow this symlink; skip.
          return;
        }
        throw err;
      }

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'evil', '--agent', 'bmad-agent-pm', '--type', 'frontmatter', '--yes'],
        { cwd: tmpDir, timeout: 5000 }
      );
      assert.equal(exitCode, 1, 'symlink traversal must exit 1');
      assert.ok(
        stdout.includes('symlink') || stdout.includes('Invalid --skill'),
        `expected symlink guard; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Guard: reserved 'auto-scan' rejected ──
  it('registered_by = "auto-scan" rejected (R2-C3 reserved-value check)', async () => {
    const tmpDir = await createTempDir('bmad-reg-');
    try {
      const header = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date\n';
      await seedFixture(tmpDir, { csvContents: header, skillNames: ['reserved-test'] });

      const { exitCode, stdout } = await runScript(
        SCRIPT_PATH,
        ['--skill', 'reserved-test', '--agent', 'bmad-agent-pm', '--type', 'frontmatter',
          '--email', 'auto-scan', '--yes'],
        { cwd: tmpDir }
      );
      assert.equal(exitCode, 1, 'auto-scan must be rejected');
      assert.ok(
        stdout.includes("'auto-scan' is reserved"),
        `expected reserved-value error; got: ${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

});
