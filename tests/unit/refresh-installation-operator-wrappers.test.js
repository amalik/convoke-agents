/**
 * T252: the refresh must not destroy operator work under `.claude/skills/`.
 *
 * Operator ruling 2026-10-08, two halves:
 *   1. A directory under a Convoke prefix whose name Convoke has never shipped is LEFT IN PLACE
 *      and reported.
 *   2. A name Convoke does own, holding content Convoke did not write, is COPIED ASIDE outside
 *      `.claude/skills/` before the refresh removes or regenerates it.
 *
 * A test about preserved content plants text and asserts on where that text ended up, so a
 * refresh that skipped the directory and one that preserved it cannot both pass. A test about
 * content that needs no copy asserts that no copy for that wrapper exists.
 *
 * NOT covered here:
 *   - a copy that fails part-way through. Nothing in this file makes `copySync` fail after it
 *     has started; every failure here is a backup directory that cannot be written at all.
 *   - a wrapper holding a broken link, a circular link, a FIFO or a socket.
 *   - the regular-file check before `SKILL.md` is read. Removing it makes a FIFO at that name
 *     block forever, and no test here plants one.
 *   - `isSameDirectoryEntry` returning true. One directory entry has two names only on a
 *     case-insensitive filesystem, so the unit tests below assert the false cases and the true
 *     case is reached only through the rename test, which skips on Linux CI.
 * Three tests depend on the filesystem and say so when they skip: two run only where names are
 * case-insensitive (macOS, Windows), one only where they are case-sensitive (Linux CI).
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const {
  refreshInstallation,
  cleanupOrphanWorkflowWrappers,
  isSameDirectoryEntry,
  WRAPPER_BACKUP_REL,
} = require('../../scripts/update/lib/refresh-installation');
const { AGENTS, GYRE_AGENTS, RETIRED_WRAPPER_IDS } = require('../../scripts/update/lib/agent-registry');
const { createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

// Minimal pm.md needed because the Enhance block runs alongside the main install flow
const MINIMAL_PM_MD = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
</agent>`;

const OPERATOR_TEXT = '---\nname: operator-authored\n---\n\nwritten by the operator\n';
const REFRESH_OPTIONS = { backupGuides: false, verbose: false };

const VORTEX_AGENT = AGENTS[0];
const GYRE_AGENT = GYRE_AGENTS[0];

function setExcludedAgents(tmpDir, module, excludedIds) {
  const configPath = path.join(tmpDir, `_bmad/bme/${module}/config.yaml`);
  const cfg = yaml.load(fs.readFileSync(configPath, 'utf8'));
  cfg.excluded_agents = excludedIds;
  fs.writeFileSync(configPath, yaml.dump(cfg), 'utf8');
}

/** Every copy kept for `wrapper`, as absolute paths. */
function copiesOf(backupDir, wrapper) {
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir)
    .filter(entry => entry.startsWith(`${wrapper}-`) && /^[0-9a-f]{16}$/.test(entry.slice(wrapper.length + 1)))
    .map(entry => path.join(backupDir, entry));
}

/** The text of `file` in every copy kept for `wrapper` that has it, sorted. */
function keptTexts(backupDir, wrapper, file = 'SKILL.md') {
  return copiesOf(backupDir, wrapper)
    .map(copy => path.join(copy, file))
    .filter(p => fs.existsSync(p))
    .map(p => fs.readFileSync(p, 'utf8'))
    .sort();
}

describe('T252: refresh preserves operator work under .claude/skills/', () => {
  let tmpDir, skillsDir, backupDir, warnings;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t252-'));
    await createValidInstallation(tmpDir);
    await fs.ensureDir(path.join(tmpDir, '_bmad/bmm/agents'));
    await fs.writeFile(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), MINIMAL_PM_MD, 'utf8');
    skillsDir = path.join(tmpDir, '.claude', 'skills');
    backupDir = path.join(tmpDir, WRAPPER_BACKUP_REL);
    silenceConsole();
    // Every test starts from what an ordinary install leaves behind.
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);
    warnings = [];
    console.warn = (...args) => { warnings.push(args.join(' ')); };
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  async function plant(rel, text = OPERATOR_TEXT) {
    const file = path.join(skillsDir, rel);
    await fs.ensureDir(path.dirname(file));
    await fs.writeFile(file, text, 'utf8');
  }

  const readIfPresent = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);

  /** Does this filesystem treat two spellings of a name as one entry? Measured, not assumed. */
  const caseInsensitive = () => fs.existsSync(path.join(skillsDir, `BMAD-AGENT-BME-${VORTEX_AGENT.id}`));

  it('keeps the backup location outside .claude/skills/, where a copy would stay invocable', () => {
    const rel = path.relative(skillsDir, backupDir);
    assert.ok(rel.startsWith('..'), `backup dir ${backupDir} must not sit inside ${skillsDir}`);
  });

  it('an ordinary refresh over an untouched install copies nothing and warns about nothing', async () => {
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);
    assert.ok(!fs.existsSync(backupDir), 'no operator content, so no backup directory at all');
    assert.deepEqual(warnings, []);
  });

  // --- Ruling 1: names Convoke never shipped are left in place and reported ---

  for (const foreign of ['bmad-enhance-acme', 'bmad-agent-bme-acme-reviewer']) {
    it(`leaves ${foreign} in place and reports it as a warning, not as a change`, async () => {
      await plant(`${foreign}/SKILL.md`);

      const changes = await refreshInstallation(tmpDir, REFRESH_OPTIONS);

      assert.equal(readIfPresent(path.join(skillsDir, foreign, 'SKILL.md')), OPERATOR_TEXT);
      assert.deepEqual(
        warnings.filter(w => w.includes(foreign)).map(w => w.trim().split(':')[0]),
        ['Left in place']
      );
      assert.deepEqual(changes.filter(c => c.includes(foreign)), [],
        'convoke-update prints every change with a green tick; nothing was changed here');
    });
  }

  // --- Ruling 2: owned names holding other content are copied aside, then handled as before ---

  for (const [label, module, agent] of [
    ['Vortex', '_vortex', VORTEX_AGENT],
    ['Gyre', '_gyre', GYRE_AGENT],
  ]) {
    const wrapper = `bmad-agent-bme-${agent.id}`;

    it(`${label}: excluding an agent removes its generated wrapper without a copy`, async () => {
      setExcludedAgents(tmpDir, module, [agent.id]);

      await refreshInstallation(tmpDir, REFRESH_OPTIONS);

      assert.ok(!fs.existsSync(path.join(skillsDir, wrapper)), 'excluded wrapper is removed');
      assert.ok(!fs.existsSync(backupDir), 'the wrapper was Convoke text; nothing to preserve');
    });

    it(`${label}: a hand-written wrapper at an excluded agent's name is copied aside, then removed`, async () => {
      setExcludedAgents(tmpDir, module, [agent.id]);
      await plant(`${wrapper}/SKILL.md`);

      const changes = await refreshInstallation(tmpDir, REFRESH_OPTIONS);

      assert.ok(!fs.existsSync(path.join(skillsDir, wrapper)), 'excluded agent stays non-invocable');
      assert.deepEqual(keptTexts(backupDir, wrapper), [OPERATOR_TEXT]);
      assert.ok(
        changes.some(c => c.startsWith('Backed up') && c.includes(wrapper)),
        `the run must say where the content went; got:\n${changes.join('\n')}`
      );
    });

    it(`${label}: a file beside the generated text in an excluded agent's wrapper is copied aside`, async () => {
      setExcludedAgents(tmpDir, module, [agent.id]);
      await plant(`${wrapper}/NOTES.md`);

      await refreshInstallation(tmpDir, REFRESH_OPTIONS);

      assert.ok(!fs.existsSync(path.join(skillsDir, wrapper)), 'the whole directory is removed');
      assert.deepEqual(keptTexts(backupDir, wrapper, 'NOTES.md'), [OPERATOR_TEXT]);
    });

    it(`${label}: an edited live wrapper is copied aside before it is regenerated`, async () => {
      const live = path.join(skillsDir, wrapper, 'SKILL.md');
      const generated = fs.readFileSync(live, 'utf8');
      await plant(`${wrapper}/SKILL.md`, `${generated}\noperator edit\n`);

      await refreshInstallation(tmpDir, REFRESH_OPTIONS);

      assert.equal(fs.readFileSync(live, 'utf8'), generated, 'the live wrapper is regenerated');
      assert.deepEqual(keptTexts(backupDir, wrapper), [`${generated}\noperator edit\n`]);
    });
  }

  it('a wrapper at a retired agent name is copied aside, then removed', async () => {
    assert.ok(RETIRED_WRAPPER_IDS.length > 0, 'fixture needs at least one retired agent id');
    const wrapper = `bmad-agent-bme-${RETIRED_WRAPPER_IDS[0]}`;
    await plant(`${wrapper}/SKILL.md`);

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    assert.ok(!fs.existsSync(path.join(skillsDir, wrapper)), 'retired wrapper is removed');
    assert.deepEqual(keptTexts(backupDir, wrapper), [OPERATOR_TEXT]);
  });

  it('an edited Enhance wrapper is copied aside before it is refreshed', async () => {
    const wrapper = 'bmad-enhance-initiatives-backlog';
    const live = path.join(skillsDir, wrapper, 'SKILL.md');
    const shipped = fs.readFileSync(live, 'utf8');
    await plant(`${wrapper}/SKILL.md`, `${shipped}\noperator edit\n`);

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    assert.equal(fs.readFileSync(live, 'utf8'), shipped);
    assert.deepEqual(keptTexts(backupDir, wrapper), [`${shipped}\noperator edit\n`]);
  });

  for (const wrapper of ['bmad-portfolio-status', 'bmad-export-skill']) {
    it(`an extra file inside the ${wrapper} wrapper is copied aside before the directory is rebuilt`, async () => {
      assert.ok(fs.existsSync(path.join(skillsDir, wrapper, 'SKILL.md')), 'fixture: wrapper is installed');
      await plant(`${wrapper}/NOTES.md`);

      await refreshInstallation(tmpDir, REFRESH_OPTIONS);

      assert.deepEqual(keptTexts(backupDir, wrapper, 'NOTES.md'), [OPERATOR_TEXT]);
    });
  }

  it('a sibling file the refresh does not touch is left where it is and not copied', async () => {
    // The agent and Enhance phases rewrite SKILL.md only, so a file beside it is not at risk.
    const wrappers = [`bmad-agent-bme-${VORTEX_AGENT.id}`, `bmad-agent-bme-${GYRE_AGENT.id}`, 'bmad-enhance-initiatives-backlog'];
    for (const wrapper of wrappers) await plant(`${wrapper}/NOTES.md`);

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    for (const wrapper of wrappers) {
      assert.equal(readIfPresent(path.join(skillsDir, wrapper, 'NOTES.md')), OPERATOR_TEXT);
      assert.deepEqual(copiesOf(backupDir, wrapper), [], `${wrapper} had nothing at risk`);
    }
  });

  // --- The copies themselves ---

  it('a later copy never replaces an earlier one', async () => {
    // The order that loses work under a single-slot backup: the operator's edit is copied, the
    // wrapper is regenerated, and then a release changes the shipped text — so the NEXT thing
    // found at that name is Convoke's own previous wrapper, which also "differs".
    const wrapper = `bmad-agent-bme-${VORTEX_AGENT.id}`;
    await plant(`${wrapper}/SKILL.md`, 'operator edit\n');
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);
    await plant(`${wrapper}/SKILL.md`, 'the previous release wrote this\n');
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    assert.deepEqual(keptTexts(backupDir, wrapper), ['operator edit\n', 'the previous release wrote this\n']);
  });

  it('content already copied is neither copied nor reported again', async () => {
    // A file something keeps re-creating (Finder's .DS_Store) inside a directory the refresh rebuilds.
    const wrapper = 'bmad-portfolio-status';
    await plant(`${wrapper}/NOTES.md`);
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);
    await plant(`${wrapper}/NOTES.md`);

    const changes = await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    assert.equal(copiesOf(backupDir, wrapper).length, 1);
    assert.deepEqual(changes.filter(c => c.startsWith('Backed up')), []);
    assert.deepEqual(warnings, []);
    assert.ok(!fs.existsSync(path.join(skillsDir, wrapper, 'NOTES.md')), 'the wrapper was rebuilt');
  });

  it('a copy the operator has taken files back out of is not mistaken for a copy', async () => {
    // Restoring with `mv` leaves the backup directory behind, empty. The same edit made again
    // digests to that directory's name; only its content says whether the edit is kept.
    const wrapper = `bmad-agent-bme-${VORTEX_AGENT.id}`;
    await plant(`${wrapper}/SKILL.md`);
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);
    const [copy] = copiesOf(backupDir, wrapper);
    await fs.move(path.join(copy, 'SKILL.md'), path.join(skillsDir, wrapper, 'SKILL.md'), { overwrite: true });
    assert.deepEqual(fs.readdirSync(copy), [], 'fixture: the backup directory is still there, and empty');

    const changes = await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    assert.deepEqual(keptTexts(backupDir, wrapper), [OPERATOR_TEXT]);
    assert.equal(changes.filter(c => c.startsWith('Backed up') && c.includes(wrapper)).length, 1);
  });

  // One file whose bytes spell out a second file's entry in the digest stream, against the two
  // real files. The first payload is the collision when a file is hashed as path, NUL, bytes, NUL;
  // the second is the collision when the byte length is left out of the current form.
  for (const [form, spliced] of [['path-bytes', 'x\0/b\0y'], ['no length', 'xf/b\0y']]) {
    it(`two trees that differ only in where a file boundary falls are kept as two copies (${form})`, async () => {
      const wrapper = 'bmad-portfolio-status';
      await plant(`${wrapper}/a`, spliced);
      await refreshInstallation(tmpDir, REFRESH_OPTIONS);
      await plant(`${wrapper}/a`, 'x');
      await plant(`${wrapper}/b`, 'y');
      await refreshInstallation(tmpDir, REFRESH_OPTIONS);

      assert.deepEqual(keptTexts(backupDir, wrapper, 'a'), ['x', spliced].sort());
      assert.deepEqual(keptTexts(backupDir, wrapper, 'b'), ['y']);
    });
  }

  it('a tree that differs only by an empty directory is kept as its own copy', async () => {
    const wrapper = 'bmad-portfolio-status';
    await plant(`${wrapper}/NOTES.md`);
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);
    await plant(`${wrapper}/NOTES.md`);
    await fs.ensureDir(path.join(skillsDir, wrapper, 'drafts'));
    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    const copies = copiesOf(backupDir, wrapper);
    assert.equal(copies.length, 2);
    assert.equal(copies.filter(copy => fs.existsSync(path.join(copy, 'drafts'))).length, 1);
  });

  it('a symlinked SKILL.md is copied as the text it points at, not as a link', async () => {
    const wrapper = `bmad-agent-bme-${VORTEX_AGENT.id}`;
    const notes = path.join(tmpDir, 'my-notes', 'emma.md');
    await fs.ensureDir(path.dirname(notes));
    await fs.writeFile(notes, OPERATOR_TEXT, 'utf8');
    const live = path.join(skillsDir, wrapper, 'SKILL.md');
    await fs.remove(live);
    await fs.symlink(path.relative(path.dirname(live), notes), live);

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    const [copy] = copiesOf(backupDir, wrapper);
    assert.ok(copy, 'a copy was made');
    assert.ok(fs.lstatSync(path.join(copy, 'SKILL.md')).isFile(), 'the copy is a regular file');
    assert.equal(fs.readFileSync(path.join(copy, 'SKILL.md'), 'utf8'), OPERATOR_TEXT);
  });

  it('a symlinked wrapper directory is copied as the files it points at', async () => {
    const wrapper = `bmad-agent-bme-${VORTEX_AGENT.id}`;
    const elsewhere = path.join(tmpDir, 'my-skills', 'emma');
    await fs.ensureDir(elsewhere);
    await fs.writeFile(path.join(elsewhere, 'SKILL.md'), OPERATOR_TEXT, 'utf8');
    await fs.remove(path.join(skillsDir, wrapper));
    await fs.symlink(path.relative(skillsDir, elsewhere), path.join(skillsDir, wrapper));

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    const [copy] = copiesOf(backupDir, wrapper);
    assert.ok(copy, 'a copy was made');
    assert.ok(fs.lstatSync(copy).isDirectory(), 'the copy is a real directory');
    assert.equal(fs.readFileSync(path.join(copy, 'SKILL.md'), 'utf8'), OPERATOR_TEXT);
  });

  it('a symlinked wrapper directory holding exactly the generated text is not copied', async () => {
    const wrapper = `bmad-agent-bme-${VORTEX_AGENT.id}`;
    const elsewhere = path.join(tmpDir, 'my-skills', 'emma');
    await fs.move(path.join(skillsDir, wrapper), elsewhere);
    await fs.symlink(path.relative(skillsDir, elsewhere), path.join(skillsDir, wrapper));

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    assert.deepEqual(copiesOf(backupDir, wrapper), [], 'a link is not, by itself, operator content');
  });

  it('a skill file stored under another case is copied before the write that replaces it', async (t) => {
    if (!caseInsensitive()) return t.skip('case-sensitive filesystem: skill.md and SKILL.md are different files here');
    const wrapper = `bmad-agent-bme-${VORTEX_AGENT.id}`;
    await fs.remove(path.join(skillsDir, wrapper));
    await plant(`${wrapper}/skill.md`);

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    assert.notEqual(readIfPresent(path.join(skillsDir, wrapper, 'skill.md')), OPERATOR_TEXT,
      'fixture: the refresh did write through to that file');
    assert.deepEqual(keptTexts(backupDir, wrapper, 'skill.md'), [OPERATOR_TEXT]);
  });

  it('an owned wrapper stored under another case is renamed to the owned spelling, not called foreign', async (t) => {
    if (!caseInsensitive()) return t.skip('case-sensitive filesystem: the other spelling is a different directory here');
    const wrapper = `bmad-agent-bme-${VORTEX_AGENT.id}`;
    const variant = `bmad-agent-bme-${VORTEX_AGENT.id.toUpperCase()}`;
    await fs.rename(path.join(skillsDir, wrapper), path.join(skillsDir, variant));
    assert.ok(fs.readdirSync(skillsDir).includes(variant), 'fixture: the directory is stored under the variant spelling');
    await plant(`${variant}/SKILL.md`);

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    const stored = fs.readdirSync(skillsDir);
    assert.ok(stored.includes(wrapper) && !stored.includes(variant), `stored names: ${stored.join(', ')}`);
    assert.deepEqual(keptTexts(backupDir, wrapper), [OPERATOR_TEXT]);
    assert.deepEqual(warnings, []);
  });

  it('where another spelling is a different directory, it is left alone and the owned one is untouched', async (t) => {
    if (caseInsensitive()) return t.skip('case-insensitive filesystem: the other spelling is the same directory here');
    const wrapper = `bmad-agent-bme-${VORTEX_AGENT.id}`;
    const variant = `bmad-agent-bme-${VORTEX_AGENT.id.toUpperCase()}`;
    const generated = fs.readFileSync(path.join(skillsDir, wrapper, 'SKILL.md'), 'utf8');
    await plant(`${variant}/SKILL.md`);

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    assert.equal(readIfPresent(path.join(skillsDir, variant, 'SKILL.md')), OPERATOR_TEXT);
    assert.equal(readIfPresent(path.join(skillsDir, wrapper, 'SKILL.md')), generated);
    assert.ok(!fs.existsSync(backupDir), 'nothing was replaced, so nothing was copied');
  });

  it('when a copy cannot be made, the wrapper is left as it is and the refresh still completes', async () => {
    // A FILE where the backup directory belongs makes every copy fail the same way on any platform.
    await fs.ensureDir(path.dirname(backupDir));
    await fs.writeFile(backupDir, 'not a directory', 'utf8');
    // One wrapper per caller of preserveOperatorWrapper inside refreshInstallation.
    assert.ok(GYRE_AGENTS.length > 1, 'fixture needs one Gyre agent to exclude and one to edit');
    const excluded = `bmad-agent-bme-${GYRE_AGENT.id}`;
    setExcludedAgents(tmpDir, '_gyre', [GYRE_AGENT.id]);
    const untouched = {
      [`bmad-agent-bme-${VORTEX_AGENT.id}/SKILL.md`]: 'Vortex loop: not rewritten',
      [`bmad-agent-bme-${GYRE_AGENTS[1].id}/SKILL.md`]: 'Gyre loop: not rewritten',
      [`${excluded}/SKILL.md`]: 'stale sweep: not removed',
      'bmad-enhance-initiatives-backlog/SKILL.md': 'Enhance: not overwritten',
      'bmad-portfolio-status/NOTES.md': 'Artifacts: not rebuilt',
      'bmad-export-skill/NOTES.md': 'Portability: not rebuilt',
    };
    for (const rel of Object.keys(untouched)) await plant(rel);

    await refreshInstallation(tmpDir, REFRESH_OPTIONS);

    for (const [rel, what] of Object.entries(untouched)) {
      const name = rel.split('/')[0];
      assert.equal(readIfPresent(path.join(skillsDir, rel)), OPERATOR_TEXT, what);
      assert.equal(warnings.filter(w => w.includes('could not back up') && w.includes(`/${name} `)).length, 1,
        `one warning names ${name}; got:\n${warnings.join('\n')}`);
    }
  });
});

describe('T252: isSameDirectoryEntry', () => {
  let tmpDir;
  beforeEach(async () => { tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t252-entry-')); });
  afterEach(async () => { await fs.remove(tmpDir); });

  it('is false for two different directories', async () => {
    const a = path.join(tmpDir, 'a');
    const b = path.join(tmpDir, 'b');
    await fs.ensureDir(a);
    await fs.ensureDir(b);

    assert.equal(isSameDirectoryEntry(a, b), false);
  });

  it('is false when either path does not exist', async () => {
    const a = path.join(tmpDir, 'a');
    await fs.ensureDir(a);

    assert.equal(isSameDirectoryEntry(a, path.join(tmpDir, 'missing')), false);
    assert.equal(isSameDirectoryEntry(path.join(tmpDir, 'missing'), a), false);
  });
});

describe('T252: cleanupOrphanWorkflowWrappers preserves what it removes', () => {
  let tmpDir, skillsDir, backupRoot;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t252-orphan-'));
    skillsDir = path.join(tmpDir, '.claude', 'skills');
    backupRoot = path.join(tmpDir, WRAPPER_BACKUP_REL);
    silenceConsole();
  });
  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  async function seedOrphan() {
    const dir = path.join(skillsDir, 'bmad-portfolio-status');
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, 'SKILL.md'), OPERATOR_TEXT, 'utf8');
    return dir;
  }

  it('copies a retired verbatim-name wrapper aside before removing it', async () => {
    const dir = await seedOrphan();

    cleanupOrphanWorkflowWrappers(skillsDir, new Set(), new Set(['bmad-portfolio-status']), { backupRoot });

    assert.ok(!fs.existsSync(dir), 'orphan is removed');
    assert.deepEqual(keptTexts(backupRoot, 'bmad-portfolio-status'), [OPERATOR_TEXT]);
  });

  it('leaves the orphan where it is when the copy cannot be made', async () => {
    const dir = await seedOrphan();
    await fs.ensureDir(path.dirname(backupRoot));
    await fs.writeFile(backupRoot, 'not a directory', 'utf8');

    const changes = cleanupOrphanWorkflowWrappers(skillsDir, new Set(), new Set(['bmad-portfolio-status']), { backupRoot });

    assert.equal(fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8'), OPERATOR_TEXT);
    assert.deepEqual(changes, []);
  });

  it('refuses to run without a backup root rather than guessing one from the skills path', async () => {
    await seedOrphan();
    assert.throws(
      () => cleanupOrphanWorkflowWrappers(skillsDir, new Set(), new Set(['bmad-portfolio-status'])),
      TypeError
    );
    assert.ok(fs.existsSync(path.join(skillsDir, 'bmad-portfolio-status')), 'nothing was removed');
  });
});
