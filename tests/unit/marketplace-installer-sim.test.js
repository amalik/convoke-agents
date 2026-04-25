const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('fs-extra');
const os = require('node:os');

const {
  marketplaceInstall,
  PARITY_EXCLUSIONS,
  PARITY_HINTS,
  formatHint,
  canonicalIdForSkillRel,
  isExcluded
} = require('../integration/lib/marketplace-installer-sim');
// R1-L2 partial: import PACKAGE_ROOT from helpers instead of recomputing.
const { PACKAGE_ROOT } = require('../helpers');

// Centralized expected canonicalIds (derive-counts-from-source rule):
// don't hardcode "7" — read from marketplace.json.
function getExpectedCanonicalIds() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(PACKAGE_ROOT, '.claude-plugin/marketplace.json'), 'utf8')
  );
  return manifest.plugins[0].skills.map((rel) => canonicalIdForSkillRel(rel));
}

describe('marketplace-installer-sim: U1 — parses manifest + materializes all paths', () => {
  let destRoot;
  const expectedIds = getExpectedCanonicalIds();

  before(async () => {
    destRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-sim-u1-'));
    await marketplaceInstall(destRoot, { sourceRepo: PACKAGE_ROOT });
  });

  after(async () => {
    if (destRoot) await fs.remove(destRoot).catch(() => {});
  });

  it('creates .claude/skills/ at destRoot', () => {
    const skillsDir = path.join(destRoot, '.claude/skills');
    assert.ok(fs.existsSync(skillsDir), '.claude/skills directory should exist');
  });

  it('creates one canonicalId dir per skills[] entry', () => {
    const skillsDir = path.join(destRoot, '.claude/skills');
    const actual = fs.readdirSync(skillsDir).sort();
    assert.deepEqual(actual, expectedIds.slice().sort(), 'canonicalId dirs match marketplace.json.skills[] basenames');
  });

  it('every canonicalId dir contains a non-empty SKILL.md', () => {
    const skillsDir = path.join(destRoot, '.claude/skills');
    for (const id of expectedIds) {
      const skillMd = path.join(skillsDir, id, 'SKILL.md');
      assert.ok(fs.existsSync(skillMd), `${id}/SKILL.md should exist`);
      assert.ok(fs.statSync(skillMd).size > 0, `${id}/SKILL.md should be non-empty`);
    }
  });

  it('SKILL.md content matches the source repo byte-for-byte', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(PACKAGE_ROOT, '.claude-plugin/marketplace.json'), 'utf8')
    );
    for (const skillRel of manifest.plugins[0].skills) {
      const cleanRel = skillRel.replace(/^\.\//, '');
      const canonicalId = canonicalIdForSkillRel(skillRel);
      const sourcePath = path.join(PACKAGE_ROOT, cleanRel, 'SKILL.md');
      const destPath = path.join(destRoot, '.claude/skills', canonicalId, 'SKILL.md');
      // R1-M7: nullity guard — assert path exists before readFileSync to avoid
      // opaque ENOENT; surface a useful "missing source/dest" message instead.
      assert.ok(fs.existsSync(sourcePath), `source SKILL.md missing for ${canonicalId} at ${sourcePath}`);
      assert.ok(fs.existsSync(destPath), `dest SKILL.md missing for ${canonicalId} at ${destPath}`);
      const sourceBytes = fs.readFileSync(sourcePath);
      const destBytes = fs.readFileSync(destPath);
      assert.equal(
        Buffer.compare(sourceBytes, destBytes),
        0,
        `${canonicalId}/SKILL.md bytes should match source`
      );
    }
  });
});

describe('marketplace-installer-sim: U2 — isExcluded() classification', () => {
  it('excludes .DS_Store (case-insensitive)', () => {
    assert.equal(isExcluded('/some/path/.DS_Store'), true);
    assert.equal(isExcluded('/some/path/.ds_store'), true);
    assert.equal(isExcluded('/some/path/.Ds_Store'), true);
  });

  it('excludes Thumbs.db + desktop.ini (case-insensitive)', () => {
    assert.equal(isExcluded('/x/Thumbs.db'), true);
    assert.equal(isExcluded('/x/THUMBS.DB'), true);
    assert.equal(isExcluded('/x/desktop.ini'), true);
    assert.equal(isExcluded('/x/Desktop.INI'), true);
  });

  it('excludes suffixes .bak, ~, .swp, .swo', () => {
    assert.equal(isExcluded('/x/foo.bak'), true);
    assert.equal(isExcluded('/x/foo~'), true);
    assert.equal(isExcluded('/x/foo.swp'), true);
    assert.equal(isExcluded('/x/foo.swo'), true);
  });

  it('excludes dot-prefixed files except .gitkeep', () => {
    assert.equal(isExcluded('/x/.hidden'), true);
    assert.equal(isExcluded('/x/.config'), true);
    assert.equal(isExcluded('/x/.gitkeep'), false, '.gitkeep is the documented exception');
  });

  it('excludes paths containing /node_modules/ when scoped to source-relative path', () => {
    // R1-H1: pathContains check is now scoped to source-relative path.
    // When sourceDir is a path INSIDE node_modules, the relative path doesn't
    // contain /node_modules/ → not excluded.
    assert.equal(isExcluded('/parent/node_modules/foo/bar.js', '/parent/node_modules/foo'), false,
      'when sourceDir is inside node_modules, relative path bar.js should not be excluded');
    // When source-relative path itself contains /node_modules/, excluded:
    assert.equal(isExcluded('/srcRoot/sub/node_modules/foo.js', '/srcRoot'), true,
      'source-relative path containing /node_modules/ should be excluded');
    // Without sourceDir (legacy / no-context call), falls back to absolute path check:
    assert.equal(isExcluded('/x/node_modules/foo.js'), true);
  });

  it('does NOT exclude regular files', () => {
    assert.equal(isExcluded('/x/SKILL.md'), false);
    assert.equal(isExcluded('/x/sub/file.yaml'), false);
    assert.equal(isExcluded('/x/sub/file.txt'), false);
  });

  // R1-M13 verification: empty basename inputs.
  it('returns false for empty-basename inputs', () => {
    assert.equal(isExcluded(''), false);
    assert.equal(isExcluded('/'), false);
  });
});

describe('marketplace-installer-sim: U3 — throws on malformed manifest', () => {
  // R1-M9: per-it badRepo subdirs (not shared) — prevents race on shared
  // manifest.json file if --test-concurrency is ever enabled, and prevents
  // brittleness if one test fails mid-write.

  async function makeBadRepo(label, manifestContent) {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), `convoke-sim-u3-${label}-`));
    await fs.ensureDir(path.join(repo, '.claude-plugin'));
    await fs.writeFile(
      path.join(repo, '.claude-plugin/marketplace.json'),
      typeof manifestContent === 'string' ? manifestContent : JSON.stringify(manifestContent),
      'utf8'
    );
    return repo;
  }

  it('throws when plugins is missing', async () => {
    const repo = await makeBadRepo('a', { name: 'broken' });
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-sim-u3a-dest-'));
    try {
      await assert.rejects(
        () => marketplaceInstall(dest, { sourceRepo: repo }),
        /marketplace\.json regression: plugins\[0\]\.skills missing or empty/
      );
    } finally {
      await fs.remove(repo).catch(() => {});
      await fs.remove(dest).catch(() => {});
    }
  });

  it('throws when plugins[0].skills is missing', async () => {
    const repo = await makeBadRepo('b', { plugins: [{ name: 'x' }] });
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-sim-u3b-dest-'));
    try {
      await assert.rejects(
        () => marketplaceInstall(dest, { sourceRepo: repo }),
        /marketplace\.json regression: plugins\[0\]\.skills missing or empty/
      );
    } finally {
      await fs.remove(repo).catch(() => {});
      await fs.remove(dest).catch(() => {});
    }
  });

  it('throws when plugins[0].skills is an empty array', async () => {
    const repo = await makeBadRepo('c', { plugins: [{ name: 'x', skills: [] }] });
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-sim-u3c-dest-'));
    try {
      await assert.rejects(
        () => marketplaceInstall(dest, { sourceRepo: repo }),
        /marketplace\.json regression: plugins\[0\]\.skills missing or empty/
      );
    } finally {
      await fs.remove(repo).catch(() => {});
      await fs.remove(dest).catch(() => {});
    }
  });

  // R1-M12 coverage: validate every plugin's skills array, not just plugins[0].
  it('throws when plugins[1].skills is non-array (validates all plugins)', async () => {
    const repo = await makeBadRepo('d', {
      plugins: [
        { name: 'first', skills: ['./valid'] },
        { name: 'second', skills: 'not-an-array' }
      ]
    });
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-sim-u3d-dest-'));
    try {
      await assert.rejects(
        () => marketplaceInstall(dest, { sourceRepo: repo }),
        /plugins\[1\]\.skills is not an array/
      );
    } finally {
      await fs.remove(repo).catch(() => {});
      await fs.remove(dest).catch(() => {});
    }
  });

  // R1-M4 coverage: surface a useful error when a declared skill path is missing.
  it('throws when a skills[] path does not exist on disk', async () => {
    const repo = await makeBadRepo('e', {
      plugins: [{ name: 'x', skills: ['./does/not/exist'] }]
    });
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-sim-u3e-dest-'));
    try {
      await assert.rejects(
        () => marketplaceInstall(dest, { sourceRepo: repo }),
        /source-missing|skillRel: does\/not\/exist/
      );
    } finally {
      await fs.remove(repo).catch(() => {});
      await fs.remove(dest).catch(() => {});
    }
  });

  // R2-H1 coverage: empty / '.' / '/' canonicalId would clobber .claude/skills/
  // tree if not guarded; simulator throws "invalid canonicalId" before the
  // destructive fs.remove(destDir).
  it('throws on invalid canonicalIds (./, ., /) before fs.remove', async () => {
    for (const badSkill of ['./', '.', '/']) {
      const repo = await makeBadRepo('h1-' + badSkill.replace(/\W/g, '_'), {
        plugins: [{ name: 'x', skills: [badSkill] }]
      });
      const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-sim-r2h1-dest-'));
      try {
        await assert.rejects(
          () => marketplaceInstall(dest, { sourceRepo: repo }),
          /invalid canonicalId/,
          `should reject skillRel="${badSkill}" with invalid-canonicalId hint`
        );
      } finally {
        await fs.remove(repo).catch(() => {});
        await fs.remove(dest).catch(() => {});
      }
    }
  });

  // R2-M7 coverage: plugins[i] === null must not crash the validation loop.
  it('handles null plugin entries without TypeError', async () => {
    // Build a fixture where plugins[0] is valid, plugins[1] is null. The
    // simulator must skip null and still install plugins[0] cleanly.
    const repo = await makeBadRepo('m7', {
      plugins: [
        { name: 'first', skills: ['./skill-one'] },
        null
      ]
    });
    // Materialize the source dir for plugins[0]'s declared path.
    await fs.ensureDir(path.join(repo, 'skill-one'));
    await fs.writeFile(path.join(repo, 'skill-one', 'SKILL.md'), '# stub', 'utf8');
    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-sim-r2m7-dest-'));
    try {
      // Should NOT throw — null plugin is skipped, plugins[0] installs.
      await marketplaceInstall(dest, { sourceRepo: repo });
      assert.ok(
        fs.existsSync(path.join(dest, '.claude/skills/skill-one/SKILL.md')),
        'plugins[0] should still install when plugins[1] is null'
      );
    } finally {
      await fs.remove(repo).catch(() => {});
      await fs.remove(dest).catch(() => {});
    }
  });
});

describe('marketplace-installer-sim: exports', () => {
  it('PARITY_EXCLUSIONS has expected shape', () => {
    assert.ok(PARITY_EXCLUSIONS.basenames instanceof Set);
    assert.ok(PARITY_EXCLUSIONS.exceptionBasenames instanceof Set);
    assert.ok(Array.isArray(PARITY_EXCLUSIONS.suffixes));
    assert.ok(Array.isArray(PARITY_EXCLUSIONS.pathContains));
  });

  it('PARITY_HINTS has all 4 expected keys', () => {
    assert.ok('source-missing' in PARITY_HINTS);
    assert.ok('npm-missing' in PARITY_HINTS);
    assert.ok('marketplace-sim-missing' in PARITY_HINTS);
    assert.ok('byte-diff' in PARITY_HINTS);
  });

  it('formatHint substitutes context into hint string', () => {
    assert.ok(formatHint('byte-diff', 'foo').includes('foo'), 'hint should append context in parens');
    assert.ok(!formatHint('byte-diff', '').includes('()'), 'empty context should not produce empty parens');
  });

  it('canonicalIdForSkillRel strips ./ prefix and returns basename', () => {
    assert.equal(canonicalIdForSkillRel('./_bmad/bme/_vortex/agents/contextualization-expert'), 'contextualization-expert');
    assert.equal(canonicalIdForSkillRel('_bmad/bme/_vortex/agents/foo'), 'foo');
    assert.equal(canonicalIdForSkillRel('./bar'), 'bar');
  });
});
