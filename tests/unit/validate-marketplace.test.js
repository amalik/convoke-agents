'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const yaml = require('js-yaml');

const {
  PACKAGE_ROOT,
  createTempDir,
  createInstallation,
  runScript,
} = require('../helpers');

const { AGENT_IDS } = require('../../scripts/update/lib/agent-registry');
const pkg = require('../../package.json');
const { _internal } = require('../../scripts/audit/validate-marketplace');

const SCRIPT_PATH = path.join(PACKAGE_ROOT, 'scripts/audit/validate-marketplace.js');

// ─── Fixture helpers ──────────────────────────────────────────────

const VORTEX_AGENTS = [
  'contextualization-expert',
  'discovery-empathy-expert',
  'research-convergence-specialist',
  'hypothesis-engineer',
  'lean-experiments-specialist',
  'production-intelligence-specialist',
  'learning-decision-expert',
];

function defaultMarketplace(skillPaths = VORTEX_AGENTS.map(a => `./_bmad/bme/_vortex/agents/${a}`)) {
  return {
    name: 'convoke',
    owner: { name: 'Amalik Amriou' },
    license: 'MIT',
    repository: 'https://github.com/amalik/convoke-agents',
    keywords: ['bmad', 'discovery', 'vortex', 'product-discovery', 'innovation'],
    plugins: [
      {
        name: 'convoke-vortex',
        source: './',
        description: 'Vortex Framework — 7-stream product discovery for IT transformation consultants.',
        version: pkg.version,
        author: { name: 'Amalik Amriou' },
        skills: skillPaths,
      },
    ],
  };
}

function defaultModuleYaml() {
  return {
    code: 'bme',
    name: 'Convoke: Vortex Discovery Framework',
    header: 'Convoke — Vortex Discovery Framework',
    subheader: '7 AI agents for product discovery based on the Shiftup Innovation Vortex',
    description: 'Domain-specialized agent teams for structured product discovery',
    default_selected: false,
  };
}

/**
 * Seed a valid-by-default marketplace fixture + apply variant overrides.
 *
 * Variants:
 *   skipMarketplace     — don't write .claude-plugin/marketplace.json
 *   malformedJson       — write marketplace.json with trailing comma
 *   marketplace         — override marketplace object entirely
 *   skipModuleYaml      — don't write module.yaml
 *   malformedModuleYaml — write module.yaml with invalid YAML
 *   moduleYaml          — override module.yaml object entirely
 *   skipSkillDir        — { name, reason } — omit this skill dir
 *   skillDirWithoutSkillMd — skill name → create dir but no SKILL.md
 *   skillMdWithoutFrontmatter — skill name → SKILL.md with no frontmatter block
 *   skillMdBadFrontmatter — skill name → frontmatter missing `name:`
 */
async function seedMarketplaceFixture(tmpDir, variants = {}) {
  // 1. Marketplace.json
  if (!variants.skipMarketplace) {
    await fs.ensureDir(path.join(tmpDir, '.claude-plugin'));
    const marketplace = variants.marketplace || defaultMarketplace(variants.skillPaths);
    if (variants.malformedJson) {
      await fs.writeFile(
        path.join(tmpDir, '.claude-plugin/marketplace.json'),
        '{ "name": "convoke", "plugins": [{ "name": "foo", } ] }', // trailing comma
        'utf8'
      );
    } else {
      await fs.writeFile(
        path.join(tmpDir, '.claude-plugin/marketplace.json'),
        JSON.stringify(marketplace, null, 2),
        'utf8'
      );
    }
  }

  // 2. module.yaml
  if (!variants.skipModuleYaml) {
    await fs.ensureDir(path.join(tmpDir, '_bmad/bme/_vortex'));
    if (variants.malformedModuleYaml) {
      await fs.writeFile(
        path.join(tmpDir, '_bmad/bme/_vortex/module.yaml'),
        'code: bme\nname: [unclosed list\n',
        'utf8'
      );
    } else {
      const moduleYaml = variants.moduleYaml || defaultModuleYaml();
      await fs.writeFile(
        path.join(tmpDir, '_bmad/bme/_vortex/module.yaml'),
        yaml.dump(moduleYaml),
        'utf8'
      );
    }
  }

  // 3. Skill dirs (with SKILL.md + v6.3 frontmatter by default)
  const agentsDir = path.join(tmpDir, '_bmad/bme/_vortex/agents');
  await fs.ensureDir(agentsDir);
  for (const agentId of VORTEX_AGENTS) {
    if (variants.skipSkillDir === agentId) continue;
    const skillDir = path.join(agentsDir, agentId);
    await fs.ensureDir(skillDir);
    if (variants.skillDirWithoutSkillMd === agentId) continue;

    let content;
    if (variants.skillMdWithoutFrontmatter === agentId) {
      content = '# agent body without frontmatter\n';
    } else if (variants.skillMdBadFrontmatter === agentId) {
      content = '---\ndescription: missing name\n---\n\n# body\n';
    } else {
      content = `---\nname: ${agentId}\ndescription: test fixture ${agentId}\n---\n\n# ${agentId}\n`;
    }
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf8');
  }

  // 4. package.json (required by checkVersionDrift)
  await fs.writeFile(
    path.join(tmpDir, 'package.json'),
    JSON.stringify({ name: 'convoke-agents', version: variants.pkgVersion || pkg.version }, null, 2),
    'utf8'
  );
}

// ─── Tests ────────────────────────────────────────────────────────

describe('validate-marketplace CLI (Story v63-3-1)', () => {

  // ── Test 1: happy path ──
  it('valid fixture → exit 0 with all 6 checks passed', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir);
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--verbose'], { cwd: tmpDir });
      assert.equal(exitCode, 0, `expected exit 0, got ${exitCode}. stdout:\n${stdout}`);
      assert.ok(stdout.includes('All 6 marketplace checks passed'), `expected success summary; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 2: missing marketplace.json ──
  it('missing .claude-plugin/marketplace.json → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir, { skipMarketplace: true });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('marketplace.json not found'),
        `expected not-found error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 3: malformed JSON ──
  it('malformed marketplace.json → exit 1 + parse error', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir, { malformedJson: true });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('not valid JSON'), `expected JSON error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 4: missing required top-level field ──
  it('missing required top-level field → exit 1 + names the field', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      const marketplace = defaultMarketplace();
      delete marketplace.owner;
      await seedMarketplaceFixture(tmpDir, { marketplace });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('missing required field(s)') && stdout.includes('owner'),
        `expected missing-field error naming "owner"; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 5: skill path doesn't exist on disk ──
  it('skills[] path not on disk → exit 1 + names the path', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      const marketplace = defaultMarketplace([
        ...VORTEX_AGENTS.slice(0, 6).map(a => `./_bmad/bme/_vortex/agents/${a}`),
        './_bmad/bme/_vortex/agents/nonexistent-ghost',
      ]);
      await seedMarketplaceFixture(tmpDir, { marketplace });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('path does not exist') && stdout.includes('nonexistent-ghost'),
        `expected path-not-exist error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 6: skill dir has no SKILL.md ──
  it('skill dir without SKILL.md → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir, { skillDirWithoutSkillMd: 'contextualization-expert' });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('missing SKILL.md') && stdout.includes('contextualization-expert'),
        `expected missing-SKILL.md error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 7: SKILL.md lacks frontmatter ──
  it('SKILL.md without frontmatter block → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir, { skillMdWithoutFrontmatter: 'hypothesis-engineer' });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('missing frontmatter block'),
        `expected missing-frontmatter error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 8: module.yaml missing ──
  it('missing module.yaml → exit 1 + mentions module_definition target', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir, { skipModuleYaml: true });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('module.yaml not found') || stdout.includes('module_definition'),
        `expected missing-module.yaml error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 9: malformed module.yaml ──
  it('malformed module.yaml → exit 1 + YAML parse error', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir, { malformedModuleYaml: true });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('not valid YAML'), `expected YAML parse error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 10: version drift → warning, exit 0 ──
  it('marketplace.json vs package.json version drift → exit 0 + yellow warning', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      const marketplace = defaultMarketplace();
      marketplace.plugins[0].version = '4.0.0';
      await seedMarketplaceFixture(tmpDir, { marketplace, pkgVersion: '3.3.0' });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--verbose'], { cwd: tmpDir });
      assert.equal(exitCode, 0, `drift is warning, not error; got exit=${exitCode}, stdout:\n${stdout}`);
      assert.ok(stdout.includes('marketplace.json v4.0.0') && stdout.includes('package.json v3.3.0'),
        `expected drift warning with both versions; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 11: --dry-run preserves exit 0 even on hard failures ──
  it('--dry-run preserves exit 0 on hard failures', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir, { skipMarketplace: true });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, ['--dry-run'], { cwd: tmpDir });
      assert.equal(exitCode, 0, `--dry-run must exit 0 even on failure; got ${exitCode}`);
      assert.ok(stdout.includes('marketplace.json not found'), 'should still report the failure');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 12: integration — install script post-migration produces runtime layout ──
  it('install script post-migration produces .claude/skills/bmad-agent-bme-<id>/SKILL.md runtime layout', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      // createInstallation calls refreshInstallation internally, which in the
      // post-3.1 world should produce the new skill-dir source layout AND
      // generate runtime wrappers under .claude/skills/.
      await createInstallation(tmpDir, pkg.version);
      for (const agentId of AGENT_IDS) {
        const runtimePath = path.join(tmpDir, '.claude/skills', `bmad-agent-bme-${agentId}`, 'SKILL.md');
        assert.ok(await fs.pathExists(runtimePath),
          `runtime wrapper missing for ${agentId}`);
      }
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 13: frontmatter name follows naming convention (AC3 normalization
  // OR BMB canonical per I97 Story 2.x ADR-001 hybrid naming) ──
  it('AC3: migrated SKILL.md files have frontmatter name matching directory basename OR BMB canonical (post-I97)', async () => {
    // Operates against the actual migrated repo — not a tmpDir fixture.
    //
    // Pre-I97 invariant (legacy): name == directory-basename (e.g., 'contextualization-expert')
    // Post-I97 invariant per ADR-001 hybrid naming (Story 2.1+):
    //   name == 'bmad-bme-agent-{firstName-lowercase}' (e.g., 'bmad-bme-agent-emma')
    // The slash-command alias under .claude/skills/bmad-agent-bme-{role}/ keeps
    // the role-based name (compat alias preserved per ADR-001).
    //
    // During the I97 migration window (Stories 2.1-2.7), some agents are
    // converted (BMB canonical) and others not yet (legacy). This test
    // accepts EITHER invariant — once Story 2.7 closes E2, all 7 agents
    // will use BMB canonical and this test could be tightened.
    //
    // Source of truth for the firstName→agentId mapping: agent-registry.js
    // AGENTS array. The test lazily resolves first-name from the registry.
    const { AGENTS } = require('../../scripts/update/lib/agent-registry');
    const agentIdToFirstName = Object.fromEntries(AGENTS.map(a => [a.id, a.name]));

    for (const agentId of AGENT_IDS) {
      const skillMdPath = path.join(PACKAGE_ROOT, '_bmad/bme/_vortex/agents', agentId, 'SKILL.md');
      const content = fs.readFileSync(skillMdPath, 'utf8');
      const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
      assert.ok(match, `frontmatter missing in ${agentId}/SKILL.md`);
      const fm = yaml.load(match[1]);

      const firstName = agentIdToFirstName[agentId];
      const bmbCanonical = `bmad-bme-agent-${firstName.toLowerCase()}`;
      const validNames = [agentId, bmbCanonical];

      assert.ok(
        validNames.includes(fm.name),
        `frontmatter name must equal '${agentId}' (legacy) OR '${bmbCanonical}' (BMB canonical per ADR-001); ${agentId}/SKILL.md has name="${fm.name}"`,
      );
    }
  });

  // ── Test 14 (R1-D1 + R2-M2/M3/M4): AC6 Case 14 — body byte-identity ──
  //
  // AC6 invariant: when an agent's flat `<id>.md` is moved to skill-dir
  // `<id>/SKILL.md`, the BODY (everything after the frontmatter block)
  // must be byte-for-byte identical. Frontmatter `name:` normalizes from
  // the quoted two-word form to hyphenated directory basename (AC3 Case
  // 13 covers that); the body itself must never be touched.
  //
  // Verification: two-stage git lookup — Stage A reads `HEAD:<flat>` for
  // uncommitted-rename state, Stage B uses `log --follow --diff-filter=A`
  // to locate the rename commit and reads `<commit>~1:<flat>` for the
  // committed-rename state.
  //
  // R2-M2: uses `t.skip(...)` (not silent `return`) so CI without git
  // history sees SKIPPED instead of spurious PASS.
  // R2-M3: uses `commits[0]` (newest A-commit) for re-add histories.
  // R2-M4: ALL 7 agents get full byte-identity check (not just the
  // canonical one) — spec's "size comparison" weaker than identity; since
  // the git lookup is cheap, identity is strictly stronger and simpler.
  it('AC6 Case 14 (R1-D1): post-migration SKILL.md body byte-identical to pre-migration flat .md body — all 7 agents', (t) => {
    const { execFileSync } = require('node:child_process');
    const fmSlice = /^---\s*\n[\s\S]*?\n---\n([\s\S]*)$/;

    function fetchPreMigrationBody(agentId) {
      const flatPath = `_bmad/bme/_vortex/agents/${agentId}.md`;
      let raw;
      try {
        // Stage A: uncommitted rename — `git show HEAD:<flat>` succeeds.
        raw = execFileSync('git', ['show', `HEAD:${flatPath}`], {
          cwd: PACKAGE_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
        });
      } catch (_uncommittedErr) {
        // Stage B: committed rename — walk --follow history, take the
        // NEWEST A-commit (R2-M3: git log outputs newest-first, so
        // `commits[0]`, not `commits[length-1]`).
        const logOut = execFileSync('git', [
          'log', '--diff-filter=A', '--follow', '--format=%H',
          '--', `_bmad/bme/_vortex/agents/${agentId}/SKILL.md`,
        ], { cwd: PACKAGE_ROOT, encoding: 'utf8' }).trim();
        const commits = logOut.split('\n').filter(Boolean);
        const renameCommit = commits[0];
        if (!renameCommit) return null;
        raw = execFileSync('git', [
          'show', `${renameCommit}~1:${flatPath}`,
        ], { cwd: PACKAGE_ROOT, encoding: 'utf8' });
      }
      const match = raw.match(fmSlice);
      return match ? match[1] : null;
    }

    for (const agentId of AGENT_IDS) {
      let preBody;
      try {
        preBody = fetchPreMigrationBody(agentId);
      } catch (err) {
        // R2-M2: visible SKIPPED status when git is unavailable or the
        // pre-rename blob is missing (shallow clone, tarball build,
        // detached tree) — was silent `return` (PASS) pre-R2.
        t.skip(`git unavailable or pre-rename blob missing for ${agentId}: ${err.message}`);
        return;
      }
      if (preBody === null) {
        t.skip(`no rename commit found for ${agentId}; cannot verify byte-identity`);
        return;
      }

      const postPath = path.join(PACKAGE_ROOT, '_bmad/bme/_vortex/agents', agentId, 'SKILL.md');
      const postContent = fs.readFileSync(postPath, 'utf8');
      const postMatch = postContent.match(fmSlice);
      assert.ok(postMatch, `post-migration ${agentId}/SKILL.md must have frontmatter block`);
      assert.equal(postMatch[1], preBody,
        `AC6 Case 14 (R2-M4): ${agentId} body must be byte-identical pre/post migration`);
    }
  });

  // ── Test 14 (Decision 3): repository URL parity (Decision 3 — reversed post-V-pass-correction) ──
  it('Decision 3: marketplace.json.repository equals normalized package.json.repository.url', async () => {
    const mp = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, '.claude-plugin/marketplace.json'), 'utf8'));
    const pkgRepoRaw = pkg.repository && pkg.repository.url;
    const normalized = pkgRepoRaw.replace(/^git\+/, '').replace(/\.git$/, '');
    assert.equal(mp.repository, normalized,
      `marketplace.json.repository ("${mp.repository}") must equal normalized package.json.repository.url ("${normalized}")`);
  });

  // ── Test 15: wrong skill count in marketplace.json ──
  it('wrong skill count (6 or 8 instead of 7) → validator flags error', () => {
    // Unit-level via _internal.auditSkillDirs — faster than CLI spawn.
    // Build a projectRoot fixture synchronously using the filesystem.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-mp-count-'));
    try {
      // Seed only 6 skill dirs.
      for (const id of VORTEX_AGENTS.slice(0, 6)) {
        const dir = path.join(tmp, '_bmad/bme/_vortex/agents', id);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'SKILL.md'),
          `---\nname: ${id}\ndescription: t\n---\n# ${id}\n`,
          'utf8'
        );
      }
      // Pass 7 paths — the 7th doesn't resolve.
      const skills = VORTEX_AGENTS.map(a => `./_bmad/bme/_vortex/agents/${a}`);
      const result = _internal.auditSkillDirs(skills, tmp);
      assert.equal(result.passed, false, 'should fail when fewer than 7 dirs exist');
      assert.ok(result.error && result.error.includes('path does not exist'),
        `expected path-not-exist error; got: ${JSON.stringify(result)}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // ── Test 16 (AC9 non-negotiable) R1-H3-rebuilt, R2-M1 split ──
  //
  // R1-H3 rebuild: manually seed actual pre-migration state (flat
  // `<id>.md` sources + old-shape runtime wrappers) then run
  // `refreshInstallation` and verify the transition.
  //
  // R2-M1 split: AC9 mandates ONLY path-transition invariants (a/b/c/d).
  // The `.backup-v4/` preservation invariant (e) belongs to R1-H2's
  // safety-net contract, not AC9 — Epic 4 may redesign backup without
  // violating AC9. Two `it(...)` blocks give independent traceability.
  //
  // R2-H5: backup relocated from `<agentsDir>/.backup-v4/` to
  // `<vortexDir>/.backup-v4/` (outside agentsDir — prevents recursive
  // re-processing by directory walkers).
  describe('Test 16: v3.x → v4.0 upgrade (AC9 + R1-H2)', () => {
    let tmpDir;
    let agentsDir;
    let skillsDir;
    let vortexDir;

    before(async () => {
      const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
      tmpDir = await createTempDir('bmad-upgrade-v3x-');
      agentsDir = path.join(tmpDir, '_bmad/bme/_vortex/agents');
      skillsDir = path.join(tmpDir, '.claude/skills');
      vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
      await fs.ensureDir(agentsDir);
      await fs.ensureDir(skillsDir);

      // Minimal config.yaml + version stamp so version-detector classifies it.
      await fs.writeFile(
        path.join(vortexDir, 'config.yaml'),
        yaml.dump({
          submodule_name: '_vortex', module: 'bme', version: '3.3.0',
          agents: [...AGENT_IDS], workflows: [],
        }),
        'utf8'
      );

      // Seed FLAT `<id>.md` sources for all 7 Vortex agents.
      for (const agentId of AGENT_IDS) {
        await fs.writeFile(
          path.join(agentsDir, `${agentId}.md`),
          `---\nname: "${agentId.replace(/-/g, ' ')}"\ndescription: pre-migration fixture\n---\n\n# v3.x body for ${agentId}\n`,
          'utf8'
        );
      }

      // Seed OLD-shape runtime wrapper — LOAD points at the flat `.md`
      // source (mirrors what refresh-installation.js:632 wrote pre-3.1).
      for (const agentId of AGENT_IDS) {
        const wrapperDir = path.join(skillsDir, `bmad-agent-bme-${agentId}`);
        await fs.ensureDir(wrapperDir);
        await fs.writeFile(
          path.join(wrapperDir, 'SKILL.md'),
          `---\nname: bmad-agent-bme-${agentId}\ndescription: ${agentId} agent\n---\n\n<agent-activation>\n1. LOAD the FULL agent file from {project-root}/_bmad/bme/_vortex/agents/${agentId}.md\n</agent-activation>\n`,
          'utf8'
        );
      }

      // Run refreshInstallation — simulating the `convoke-update` upgrade
      // path on a 3.x install (note: this test invokes refreshInstallation
      // directly; the real flow routes through convoke-update's detector
      // first, which is intentionally out of scope here).
      await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    });

    after(async () => {
      if (tmpDir) await fs.remove(tmpDir);
    });

    // AC9 invariants (a/b/c/d): path-transition only — no backup-specific
    // assertions. Any backup redesign in Epic 4 must not break this test.
    it('AC9 (R1-H3): all 7 wrappers + sources transitioned from flat-.md to skill-dir', async () => {
      for (const agentId of AGENT_IDS) {
        const wrapperPath = path.join(skillsDir, `bmad-agent-bme-${agentId}`, 'SKILL.md');
        const wrapper = await fs.readFile(wrapperPath, 'utf8');

        // (a) NEW path must appear.
        assert.ok(
          wrapper.includes(`_bmad/bme/_vortex/agents/${agentId}/SKILL.md`),
          `wrapper for ${agentId} must LOAD new skill-dir path; got:\n${wrapper}`,
        );
        // (b) OLD flat path must NOT appear anywhere in the wrapper.
        const flatPattern = new RegExp(`_bmad/bme/_vortex/agents/${agentId}\\.md(?=\\s|$)`);
        assert.ok(
          !flatPattern.test(wrapper),
          `wrapper for ${agentId} must NOT reference old flat-.md path; got:\n${wrapper}`,
        );
        // (c) New source MUST exist on disk.
        const sourceSkillPath = path.join(agentsDir, agentId, 'SKILL.md');
        assert.ok(await fs.pathExists(sourceSkillPath),
          `source SKILL.md missing for ${agentId} post-upgrade`);
        // (d) Old flat source MUST be gone (cleanup ran).
        const flatSourcePath = path.join(agentsDir, `${agentId}.md`);
        assert.ok(!(await fs.pathExists(flatSourcePath)),
          `flat-.md source for ${agentId} must be removed after upgrade`);
      }
    });

    // R1-H2 invariant (e): backup preservation at `<vortexDir>/.backup-v4/`
    // (R2-H5 relocation). Independent from AC9 — if backup policy changes,
    // only this test updates.
    it('R1-H2 (R2-H5): pre-v4 flat files preserved at _vortex/.backup-v4/', async () => {
      for (const agentId of AGENT_IDS) {
        const backupPath = path.join(vortexDir, '.backup-v4', `${agentId}.md`);
        assert.ok(await fs.pathExists(backupPath),
          `R1-H2 safety net: flat-.md for ${agentId} must be preserved at _vortex/.backup-v4/`);
      }
    });
  });

  // ── Test 17: module.yaml code: mismatch ──
  it('module.yaml code: != "bme" → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      const moduleYaml = defaultModuleYaml();
      moduleYaml.code = 'vortex'; // wrong
      await seedMarketplaceFixture(tmpDir, { moduleYaml });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('code="vortex"') && stdout.includes('bme'),
        `expected code-mismatch error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 18: plugins[0].name invariant ──
  it('plugins[0].name != "convoke-vortex" → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      const marketplace = defaultMarketplace();
      marketplace.plugins[0].name = 'convoke-wrong';
      await seedMarketplaceFixture(tmpDir, { marketplace });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes('plugins[0].name') && stdout.includes('convoke-vortex'),
        `expected plugin name error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 19: SKILL.md frontmatter missing `name:` ──
  it('SKILL.md frontmatter without required name: → exit 1', async () => {
    const tmpDir = await createTempDir('bmad-mp-');
    try {
      await seedMarketplaceFixture(tmpDir, { skillMdBadFrontmatter: 'lean-experiments-specialist' });
      const { exitCode, stdout } = await runScript(SCRIPT_PATH, [], { cwd: tmpDir });
      assert.equal(exitCode, 1);
      assert.ok(stdout.includes("missing non-empty 'name'"),
        `expected frontmatter name error; got:\n${stdout}`);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── Test 20 (E3): npm pack --dry-run ships the new artifacts ──
  it('npm pack --dry-run ships marketplace.json + module.yaml + 7 skill-dirs', async () => {
    // Runs against the real repo; uses `npm pack --dry-run --json` to list
    // would-ship files. Skip cleanly if npm is unavailable in the test env.
    const { execFileSync } = require('node:child_process');
    let output;
    try {
      output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
        cwd: PACKAGE_ROOT,
        encoding: 'utf8',
        timeout: 60000,
      });
    } catch (err) {
      // If npm isn't available or pack fails, skip with Dev Agent Record note.
      console.error('[Test 20] npm pack --dry-run unavailable; skipping. Error:', err.message);
      return;
    }
    const parsed = JSON.parse(output);
    const files = (parsed[0] && parsed[0].files) || [];
    const filePaths = files.map(f => f.path);
    assert.ok(filePaths.includes('.claude-plugin/marketplace.json'),
      'marketplace.json must be in shipped tarball');
    assert.ok(filePaths.includes('_bmad/bme/_vortex/module.yaml'),
      'module.yaml must be in shipped tarball');
    for (const agentId of AGENT_IDS) {
      const expected = `_bmad/bme/_vortex/agents/${agentId}/SKILL.md`;
      assert.ok(filePaths.includes(expected),
        `${expected} must be in shipped tarball`);
    }
  });

});
