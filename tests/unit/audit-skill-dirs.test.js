'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');

const {
  PACKAGE_ROOT,
  createTempDir,
  runScript,
} = require('../helpers');

const SCRIPT_PATH = path.join(PACKAGE_ROOT, 'scripts/audit/audit-skill-dirs.js');

// ─── Fixture helpers ──────────────────────────────────────────────

const VALID_FRONTMATTER = '---\nname: example-skill\ndescription: example skill\n---\n\n# body\n';

/**
 * Seed a `.claude/skills/` tree with N valid skill dirs.
 * Also creates `_bmad/` so findProjectRoot() succeeds.
 */
async function seedSkillsFixture(tmpDir, options = {}) {
  const { skills = [], stripBmad = false } = options;
  if (!stripBmad) {
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
  }
  for (const spec of skills) {
    const skillDir = path.join(tmpDir, '.claude/skills', spec.name);
    await fs.ensureDir(skillDir);
    if (spec.skillMd !== undefined) {
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), spec.skillMd, 'utf8');
    } else if (!spec.skipSkillMd) {
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), `---\nname: ${spec.name}\ndescription: t\n---\n# ${spec.name}\n`, 'utf8');
    }
  }
}

// ─── Tests ────────────────────────────────────────────────────────

describe('audit-skill-dirs CLI (Story v63-3-2)', () => {

  // ── Test 1: happy path — all dirs pass ──
  it('valid fixture (5 dirs) → exit 0', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: ['a', 'b', 'c', 'd', 'e'].map(n => ({ name: `skill-${n}` })),
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--verbose'], { cwd: tmpDir });
      assert.equal(exitCode, 0, `expected exit 0, got ${exitCode}. stdout:\n${stdout}`);
      assert.ok(stdout.includes('5 skill dir(s) audited') && stdout.includes('all passed'),
        `expected success summary; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 2: missing SKILL.md in one dir ──
  it('missing SKILL.md in one dir → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: [
          { name: 'skill-a' },
          { name: 'skill-b' },
          { name: 'skill-broken', skipSkillMd: true },
        ],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('missing SKILL.md') && stdout.includes('skill-broken'),
        `expected missing-SKILL.md error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 3: missing frontmatter block ──
  it('SKILL.md without frontmatter block → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: [{ name: 'skill-noframe', skillMd: '# body without frontmatter\n' }],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('missing frontmatter block'),
        `expected missing-frontmatter error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 4: frontmatter not parseable YAML ──
  it('SKILL.md frontmatter with invalid YAML → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: [{ name: 'skill-badyaml', skillMd: '---\nname: [unclosed\n---\n# body\n' }],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('invalid frontmatter YAML') && stdout.includes('skill-badyaml'),
        `expected YAML error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 5: frontmatter missing `name:` ──
  it('SKILL.md frontmatter missing name: → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: [{ name: 'skill-noname', skillMd: '---\ndescription: only desc\n---\n# body\n' }],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes("frontmatter 'name'") && stdout.includes('skill-noname'),
        `expected name-missing error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 6: frontmatter missing `description:` ──
  it('SKILL.md frontmatter missing description: → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: [{ name: 'skill-nodesc', skillMd: '---\nname: skill-nodesc\n---\n# body\n' }],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes("frontmatter 'description'") && stdout.includes('skill-nodesc'),
        `expected description-missing error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 7: --dry-run exits 0 even on failure ──
  it('--dry-run preserves exit 0 on hard failures', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: [{ name: 'skill-broken', skipSkillMd: true }],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--dry-run'], { cwd: tmpDir });
      assert.equal(exitCode, 0, `--dry-run must exit 0; got ${exitCode}`);
      assert.ok(stdout.includes('missing SKILL.md'), 'should still report the failure under --dry-run');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 8: --verbose adds per-finding info ──
  it('--verbose adds per-finding pass-line + info', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: [{ name: 'skill-a' }, { name: 'skill-b' }],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--verbose'], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('skill dir: .claude/skills/skill-a') && stdout.includes('name=skill-a'),
        `expected verbose info lines; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 9: --help wins over other parse errors ──
  it('--help wins over unknown flags (R2-M5 pattern)', async () => {
    const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--help', '--unknown-flag'], { cwd: PACKAGE_ROOT });
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('convoke-audit-skill-dirs') && stdout.includes('Usage:'),
      `expected help text; got:\n${stdout}`);
  });

  // ── Test 10: SKILL.md ≥ 1MB → size-exceeded error ──
  it('SKILL.md at/above SKILL_MD_MAX_BYTES → size-exceeded error (R2-L1 fix-forward inclusive)', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      const big = '---\nname: skill-big\ndescription: t\n---\n' + 'x'.repeat(1_000_001);
      await seedSkillsFixture(tmpDir, {
        skills: [{ name: 'skill-big', skillMd: big }, { name: 'skill-ok' }],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('exceeds') && stdout.includes('skill-big'),
        `expected size-exceeded error; got:\n${stdout}`);
      // Iteration continues — skill-ok still audited.
      assert.ok(stdout.includes('2 skill dir(s) audited'),
        `expected both dirs in scan total; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 11: symlink escaping project root → rejection ──
  it('symlink escaping project root → rejection (R2-H3 strict containment)', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    const externalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-external-'));
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad'));
      const skillsRoot = path.join(tmpDir, '.claude/skills');
      await fs.ensureDir(skillsRoot);
      // External target: a real directory outside tmpDir.
      await fs.writeFile(path.join(externalDir, 'SKILL.md'), VALID_FRONTMATTER);
      // Symlink inside .claude/skills/ pointing at the external dir.
      await fs.symlink(externalDir, path.join(skillsRoot, 'skill-escape'));
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('symlink escapes project root') && stdout.includes('skill-escape'),
        `expected symlink-escape error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
      await fs.remove(externalDir);
    }
  });

  // ── Test 12: broken symlink (ENOENT target) → clean error ──
  it('symlink with broken target → clean stat error (R2-H2 TOCTOU)', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad'));
      const skillsRoot = path.join(tmpDir, '.claude/skills');
      await fs.ensureDir(skillsRoot);
      await fs.symlink('/this/path/definitely/does/not/exist', path.join(skillsRoot, 'skill-dangle'));
      // Plus one valid sibling so iteration continues.
      const okDir = path.join(skillsRoot, 'skill-ok');
      await fs.ensureDir(okDir);
      await fs.writeFile(path.join(okDir, 'SKILL.md'), VALID_FRONTMATTER);
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('cannot stat path') && stdout.includes('skill-dangle'),
        `expected stat error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 13: --dry-run + --verbose combine ──
  it('--dry-run + --verbose combine: verbose output + exit 0', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await seedSkillsFixture(tmpDir, {
        skills: [{ name: 'skill-broken', skipSkillMd: true }, { name: 'skill-ok' }],
      });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--dry-run', '--verbose'], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('missing SKILL.md') && stdout.includes('skill-broken'));
      assert.ok(stdout.includes('skill dir: .claude/skills/skill-ok'));
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 14: empty .claude/skills/ → info, exit 0 ──
  it('empty .claude/skills/ → info message, exit 0', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad'));
      await fs.ensureDir(path.join(tmpDir, '.claude/skills'));
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('0 skill dir(s) audited'),
        `expected zero-scan summary; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 15: non-directory entries skipped (.DS_Store etc.) ──
  it('non-directory entries in .claude/skills/ are skipped', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad'));
      const skillsRoot = path.join(tmpDir, '.claude/skills');
      await fs.ensureDir(skillsRoot);
      // Stray file at skills root.
      await fs.writeFile(path.join(skillsRoot, '.DS_Store'), 'binary-junk\n');
      // One real skill dir.
      await seedSkillsFixture(tmpDir, { skills: [{ name: 'skill-real' }] });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0);
      assert.ok(stdout.includes('1 skill dir(s) audited'),
        `expected scan to skip stray file and audit only the real dir; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 16: .claude/skills/ does NOT exist → info, exit 0 ──
  it('.claude/skills/ directory does not exist → info, exit 0 (fresh-install state)', async () => {
    const tmpDir = await createTempDir('bmad-audit-');
    try {
      await fs.ensureDir(path.join(tmpDir, '_bmad'));
      // Intentionally do NOT create .claude/skills/.
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 0,
        `must exit 0 for missing .claude/skills/ — fresh install isn't audit-failable; got ${exitCode}\n${stdout}`);
      assert.ok(stdout.includes('no skills directory found'),
        `expected fresh-install info message; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 17 (E3 npm-pack shipping check) — R1-M1: visible SKIP on failure ──
  it('npm pack --dry-run ships audit-skill-dirs.js + compat-preflight.js + skill wrapper', (t) => {
    const { execFileSync } = require('node:child_process');
    let output;
    try {
      output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
        cwd: PACKAGE_ROOT,
        encoding: 'utf8',
        timeout: 60000,
      });
    } catch (err) {
      // R1-M1 (R2-M2 anti-pattern fix): visible SKIPPED instead of silent
      // PASS when npm-pack is unavailable. Story 3.1's R2-M2 created this
      // pattern; Story 3.2 spec Task 6.5 explicitly carries it forward.
      t.skip(`npm pack unavailable: ${err.message}`);
      return;
    }
    const parsed = JSON.parse(output);
    const files = (parsed[0] && parsed[0].files) || [];
    const filePaths = files.map(f => f.path);
    const expected = [
      'scripts/audit/audit-skill-dirs.js',
      'scripts/update/lib/compat-preflight.js',
      '.claude/skills/bmad-audit-skill-dirs/SKILL.md',
      '.claude/skills/bmad-audit-skill-dirs/workflow.md',
    ];
    for (const p of expected) {
      assert.ok(filePaths.includes(p),
        `${p} must be in shipped tarball — current files include: ${filePaths.filter(x => x.includes('audit') || x.includes('compat-preflight') || x.includes('bmad-audit-skill-dirs')).join(', ')}`);
    }
  });

  // ── Test 18 (R1-M3): parseArgs rejects unknown flags ──
  it('unknown flag → exit 2 + names the flag (R1-M3)', async () => {
    const { exitCode, stderr } = await runScript(SCRIPT_PATH, ['--verbosee'], { cwd: PACKAGE_ROOT });
    assert.equal(exitCode, 2, `expected exit 2 for unknown flag; got ${exitCode}`);
    assert.ok(stderr.includes('Unknown flag') && stderr.includes('--verbosee'),
      `expected unknown-flag error naming the typo; got stderr:\n${stderr}`);
  });

});
