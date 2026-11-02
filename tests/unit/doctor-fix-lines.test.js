'use strict';

/**
 * T263: a `convoke-doctor` fix line that names a command must name one that resolves the finding.
 *
 * Four did not. Three advised `convoke-update`, which on an installation that is already current
 * prints "Already up to date!" and refreshes nothing, so the finding repeated forever; one advised
 * `convoke-audit-bmm-deps` for a manual registry row, which that command keeps unconditionally.
 *
 * `FIX_LINES` is the coverage table. The guard reads the doctor's source and requires every line
 * that names a Convoke command, or calls `refreshFix`, to belong to exactly one row of it, so a
 * new command-naming fix cannot be added without either a behavioural test here, a named test
 * that covers it, or a stated reason it has none. Each
 * behavioural row builds the state that raises its finding on a real install, reads the fix line
 * the real doctor prints, runs the command it names — by its `bin` entry, with the arguments the
 * line gives, so the test follows the string — and runs the doctor again.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { spawnSync } = require('child_process');

const { createValidInstallation, PACKAGE_ROOT } = require('../helpers');

const PKG = require(path.join(PACKAGE_ROOT, 'package.json'));
const BINS = PKG.bin;
const DOCTOR = 'scripts/convoke-doctor.js';
const CSV = '_bmad/_config/bmm-dependencies.csv';

/**
 * Runs a script. `input` answers any prompt: an operator following a fix line answers the
 * command's confirmation, and an unanswered one applies nothing (T278).
 */
function run(script, cwd, args = [], input = '') {
  return spawnSync(process.execPath, [path.join(PACKAGE_ROOT, script), ...args], {
    cwd, encoding: 'utf8', input, timeout: 120000, env: { ...process.env, FORCE_COLOR: '0' },
  });
}

/** The doctor's report for the finding named exactly `name`: its `✗`/`⚠` line and the lines under it. */
function findingIn(out, name) {
  const lines = out.split('\n');
  const at = lines.findIndex((l) => /^ {2}[✗⚠] /.test(l) && (name === null || l.slice(4) === name));
  if (at < 0) return null;
  const block = [lines[at]];
  for (let i = at + 1; i < lines.length && /^ {4}/.test(lines[i]); i++) block.push(lines[i]);
  return block.join('\n');
}

/** Every Convoke command a fix line offers, as `{ bin, args }`, with the line's own arguments. */
function commandsIn(block) {
  return [...block.matchAll(/npx -p convoke-agents@(\S+) (convoke-[a-z-]+)((?: --[a-z-]+(?: '[^']*')?)*)/g)]
    .map((m) => {
      assert.equal(m[1], PKG.version, `the fix line must pin this build:\n${block}`);
      assert.ok(BINS[m[2]], `${m[2]} is not a bin this package ships`);
      const args = [...m[3].matchAll(/--[a-z-]+|'([^']*)'/g)].map((a) => (a[1] !== undefined ? a[1] : a[0]));
      return { bin: m[2], args };
    });
}

/** The one command that resolves the finding: listing pointers (`--dry-run`) do not. */
function resolvingCommand(block) {
  const cmds = commandsIn(block).filter((c) => !c.args.includes('--dry-run'));
  assert.equal(cmds.length, 1, `the fix line must name exactly one resolving command:\n${block}`);
  return cmds[0];
}

function seedSkill(root, name, agents) {
  const dir = path.join(root, '.claude/skills', name);
  fs.ensureDirSync(dir);
  fs.writeFileSync(path.join(dir, 'SKILL.md'),
    `---\nname: ${name}\ndependencies:\n${agents.map((a) => `  - ${a}\n`).join('')}---\nContent.\n`);
}

function appendRows(root, rows) {
  fs.appendFileSync(path.join(root, CSV), rows.map((r) => `${r}\n`).join(''));
}

function setModuleVersion(root, mod, version) {
  const file = path.join(root, '_bmad/bme', mod, 'config.yaml');
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /^version: .*$/m, `fixture: ${mod} config has no version line`);
  fs.writeFileSync(file, text.replace(/^version: .*$/m, `version: ${version}`));
}

/** A version older than this build, derived so it never pins a release by hand. */
function olderVersion() {
  const [maj, min, pat] = PKG.version.match(/^(\d+)\.(\d+)\.(\d+)/).slice(1).map(Number);
  if (pat > 0) return `${maj}.${min}.${pat - 1}`;
  return min > 0 ? `${maj}.${min - 1}.0` : `${maj - 1}.0.0`;
}

const tenGone = Array.from({ length: 10 }, (_, i) => `bmad-gone-${i}`);

/**
 * The coverage table. `source` is a fragment of the doctor's source unique to the fix; `name` the
 * finding it belongs to; `command` what the printed line must offer; `breakIt` the state that
 * raises it; `passes` the check that must report `✓` once it is resolved, where there is one.
 * `testedBy` names the test in this file that covers a line the loop cannot run; `exempt` gives
 * the reason a line has no test at all.
 */
const FIX_LINES = [
  {
    source: 'convoke-update --refresh (${what})',
    exempt: 'the body of refreshFix, which only builds the line; each of its call sites has its own row',
  },
  { source: 'function refreshFix(what) {', exempt: 'the definition of refreshFix' },
  {
    source: 'fix: `Run: npx -p convoke-agents@${getPackageVersion()} convoke-install`',
    name: 'Module discovery', command: 'convoke-install', passes: 'Module discovery',
    breakIt: (d) => fs.readdirSync(path.join(d, '_bmad/bme'))
      .forEach((m) => fs.removeSync(path.join(d, '_bmad/bme', m, 'config.yaml'))),
  },
  {
    source: 'Run this command from inside a Convoke project',
    name: 'Project root', command: 'convoke-install', passes: 'Project root',
    breakIt: (d) => fs.readdirSync(d).forEach((e) => fs.removeSync(path.join(d, e))),
  },
  {
    source: "refreshFix('regenerates skill wrappers')",
    name: '_enhance skill wrappers', command: 'convoke-update --refresh', passes: '_enhance skill wrappers',
    breakIt: (d) => fs.removeSync(path.join(d, '.claude/skills/bmad-enhance-initiatives-backlog')),
  },
  {
    source: "refreshFix('regenerates agent skill wrappers')",
    name: 'BME agent skill wrappers', command: 'convoke-update --refresh', passes: 'BME agent skill wrappers',
    breakIt: (d) => fs.removeSync(path.join(d, '.claude/skills/bmad-agent-bme-contextualization-expert')),
  },
  {
    source: "refreshFix('recreates it')",
    name: 'Taxonomy: file exists', command: 'convoke-update --refresh', passes: 'Taxonomy: file exists',
    breakIt: (d) => fs.removeSync(path.join(d, '_bmad/_config/taxonomy.yaml')),
  },
  {
    source: "refreshFix('creates it')",
    name: 'Private reports folder', command: 'convoke-update --refresh', passes: 'Private reports folder',
    breakIt: (d) => fs.removeSync(path.join(d, '_bmad-output/private/.gitignore')),
  },
  {
    // T266: an opt-out written but not yet applied.
    source: "refreshFix('applies it')",
    name: '_gyre excluded_agents', command: 'convoke-update --refresh', passes: '_gyre agents',
    breakIt: (d) => {
      const file = path.join(d, '_bmad/bme/_gyre/config.yaml');
      const text = fs.readFileSync(file, 'utf8');
      assert.match(text, /^excluded_agents: \[\]$/m, 'fixture: the shipped config has an empty opt-out list');
      fs.writeFileSync(file, text.replace(/^excluded_agents: \[\]$/m, 'excluded_agents:\n  - review-coach'));
    },
  },
  {
    source: '${packageVersion} convoke-update`',
    name: 'Version consistency', command: 'convoke-update', passes: 'Version consistency',
    breakIt: (d) => setModuleVersion(d, '_enhance', olderVersion()),
  },
  {
    source: 'fix: `Run: npx -p convoke-agents@${pv} convoke-audit-bmm-deps`,',
    name: 'BMM dependencies: registry missing', command: 'convoke-audit-bmm-deps',
    passes: 'BMM dependencies: registry consistent',
    breakIt: (d) => fs.removeSync(path.join(d, CSV)),
  },
  {
    source: 'Debug with: npx -p convoke-agents@${pv} convoke-audit-bmm-deps --dry-run',
    exempt: 'a pointer for debugging a scan that threw; what resolves it is whatever made the scan throw, which no command repairs',
  },
  {
    source: 'to see individual drift entries; regenerate with:',
    name: 'BMM dependencies: stale-autoscan (10 findings)', command: 'convoke-audit-bmm-deps',
    passes: 'BMM dependencies: registry consistent',
    breakIt: (d) => appendRows(d, tenGone.map((s) => `${s},bmad-agent-pm,frontmatter,bmm,auto-scan,2026-10-30`)),
  },
  {
    source: 'Remove the row or restore the skill; regenerate with:',
    name: 'BMM dependencies: [stale:skill-gone] bmad-gone-skill → bmad-agent-pm', command: 'convoke-audit-bmm-deps',
    passes: 'BMM dependencies: registry consistent',
    breakIt: (d) => appendRows(d, ['bmad-gone-skill,bmad-agent-pm,frontmatter,bmm,auto-scan,2026-10-30']),
  },
  {
    source: 'fix: `Regenerate with: npx -p convoke-agents@${pv} convoke-audit-bmm-deps`',
    name: 'BMM dependencies: [stale:dep-removed] bmad-real-skill → bmad-agent-dev', command: 'convoke-audit-bmm-deps',
    passes: 'BMM dependencies: registry consistent',
    breakIt: (d) => {
      seedSkill(d, 'bmad-real-skill', ['bmad-agent-pm']);
      appendRows(d, [
        'bmad-real-skill,bmad-agent-pm,frontmatter,bmm,auto-scan,2026-10-30',
        'bmad-real-skill,bmad-agent-dev,frontmatter,bmm,auto-scan,2026-10-30',
      ]);
    },
  },
  {
    source: 'List them with: npx -p convoke-agents@${pv} convoke-audit-bmm-deps --dry-run\\n',
    exempt: 'the [unregistered] summary: its register command is a template the operator fills from the --dry-run listing; '
      + 'the per-row form, which gives the exact command, is run here, and bmm-dependencies-doctor.test.js covers this one',
  },
  {
    source: 'Then register each with: npx -p convoke-agents@${pv} convoke-register-skill',
    exempt: 'the [unregistered] summary, as above',
  },
  {
    source: "' convoke-register-skill at all: a name with leading",
    exempt: 'names the register command to say it cannot carry these names; it offers nothing to run',
  },
  { source: 'Rename the directories first — re-run convoke-doctor', exempt: 'names the doctor itself, which checks and repairs nothing' },
  {
    source: 'This name cannot be passed to convoke-register-skill',
    exempt: 'names the register command to say it cannot carry this name; it offers nothing to run',
  },
  { source: 'Rename the directory, then re-run convoke-doctor.', exempt: 'names the doctor itself, which checks and repairs nothing' },
  {
    source: 'convoke-register-skill --skill ${shellQuote(r.skill_name)}',
    name: 'BMM dependencies: [unregistered] my-tool → bmad-agent-pm', command: 'convoke-register-skill --skill --agent --type',
    passes: 'BMM dependencies: registry consistent',
    breakIt: (d) => seedSkill(d, 'my-tool', ['bmad-agent-pm']),
  },
  {
    source: "' — convoke-audit-bmm-deps keeps manual rows. The rows:",
    testedBy: 'the [missing-target] summary lists exactly the missing rows, and offers no command',
  },
  {
    source: "or delete its row (${missingTargetRow(r)}) from _bmad/_config/bmm-dependencies.csv — convoke-audit-bmm-deps",
    testedBy: 'a manual registry row whose skill is gone is not offered a command that keeps it',
  },
  {
    source: 'to sync registry with current scan output',
    name: 'BMM dependencies: scan-vs-csv-mismatch (10 findings)', command: 'convoke-audit-bmm-deps',
    passes: 'BMM dependencies: registry consistent',
    breakIt: (d) => tenGone.forEach((s) => seedSkill(d, s.replace('gone', 'drift'), ['bmad-agent-pm'])),
  },
  {
    source: 'convoke-audit-bmm-deps to sync`',
    name: 'BMM dependencies: [drift] bmad-drift-skill → bmad-agent-pm', command: 'convoke-audit-bmm-deps',
    passes: 'BMM dependencies: registry consistent',
    breakIt: (d) => seedSkill(d, 'bmad-drift-skill', ['bmad-agent-pm']),
  },
];

describe('T263: the coverage table holds every fix line that offers a command', () => {
  const lines = fs.readFileSync(path.join(PACKAGE_ROOT, DOCTOR), 'utf8').split('\n');
  const offering = lines
    .map((text, i) => ({ text, at: i + 1 }))
    .filter(({ text }) => !/^\s*(\/\/|\*|\/\*\*)/.test(text))
    .filter(({ text }) => !/require\(/.test(text))
    .filter(({ text }) => /\bconvoke-(?!agents\b)[a-z]+(-[a-z]+)*/.test(text) || /refreshFix\(/.test(text));
  const self = fs.readFileSync(__filename, 'utf8');

  it('finds the lines it guards', () => {
    assert.ok(offering.length >= FIX_LINES.length, `only ${offering.length} command-offering lines found`);
  });

  it('every command-offering line belongs to exactly one row', () => {
    for (const { text, at } of offering) {
      const rows = FIX_LINES.filter((r) => text.includes(r.source));
      assert.equal(rows.length, 1,
        `${DOCTOR}:${at} offers a command but matches ${rows.length} coverage rows — add one to FIX_LINES:\n${text.trim()}`);
    }
  });

  it('every row still names a line', () => {
    for (const r of FIX_LINES) {
      assert.ok(offering.some(({ text }) => text.includes(r.source)), `stale coverage row: ${r.source}`);
    }
  });

  it('every row has a behavioural test, a named test that exists, or a stated reason it has none', () => {
    for (const r of FIX_LINES) {
      if (r.testedBy) {
        // Backslashes first, then quotes, as the source literal would hold them (code-scanning #35).
        const literal = r.testedBy.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        assert.ok(self.includes(`it('${literal}'`), `no test named "${r.testedBy}"`);
      } else {
        assert.ok(r.exempt || (r.name && r.command && r.breakIt), `incomplete coverage row: ${r.source}`);
      }
    }
  });
});

describe('T263: every convoke-doctor fix line that names a command resolves its finding', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t263-'));
    await createValidInstallation(dir);
    const install = run(BINS['convoke-install'], dir);
    assert.equal(install.status, 0, install.stderr);
    const doctor = run(DOCTOR, dir);
    assert.equal(findingIn(doctor.stdout, null), null, `fixture: a fresh install reports nothing:\n${doctor.stdout}`);
  });

  afterEach(async () => {
    await fs.remove(dir);
  });

  for (const row of FIX_LINES.filter((r) => r.breakIt)) {
    it(row.name, async () => {
      await row.breakIt(dir);
      const before = findingIn(run(DOCTOR, dir).stdout, row.name);
      assert.ok(before, `fixture: no "${row.name}" finding was raised`);
      const { bin, args } = resolvingCommand(before);
      assert.equal([bin, ...args.filter((a) => a.startsWith('--'))].join(' '), row.command,
        `the fix line offers ${bin} ${args.join(' ')}, not ${row.command}:\n${before}`);

      const fixed = run(BINS[bin], dir, args, 'y\n');
      assert.equal(fixed.status, 0, `${bin} failed:\n${fixed.stdout}${fixed.stderr}`);

      const after = run(DOCTOR, dir);
      assert.equal(findingIn(after.stdout, row.name), null,
        `"${row.name}" is still reported after running ${bin}, as its fix line says:\n${after.stdout}`);
      if (row.passes) assert.ok(after.stdout.split('\n').includes(`  ✓ ${row.passes}`), `no ✓ ${row.passes}:\n${after.stdout}`);
      assert.equal(after.status, 0, after.stdout);
    });
  }

  it('the version mismatch is resolved when it is in _vortex too', async () => {
    setModuleVersion(dir, '_vortex', olderVersion());
    const before = findingIn(run(DOCTOR, dir).stdout, 'Version consistency');
    assert.ok(before, 'fixture: no version finding');
    const { bin, args } = resolvingCommand(before);
    const fixed = run(BINS[bin], dir, args, 'y\n');
    assert.equal(fixed.status, 0, fixed.stdout + fixed.stderr);
    const after = run(DOCTOR, dir);
    assert.equal(findingIn(after.stdout, 'Version consistency'), null, after.stdout);
    assert.ok(after.stdout.split('\n').includes('  ✓ Version consistency'), after.stdout);
    assert.equal(after.status, 0, after.stdout);
  });

  it('a manual registry row whose skill is gone is not offered a command that keeps it', () => {
    // No command removes a manual row: convoke-audit-bmm-deps preserves them, so the fix must say
    // what will clear it — restoring the skill, or deleting the row — and offer no command.
    appendRows(dir, ['gone-skill,bmad-agent-pm,frontmatter,unknown,operator,2026-10-30']);
    const name = 'BMM dependencies: [missing-target] gone-skill → bmad-agent-pm (frontmatter)';
    const block = findingIn(run(DOCTOR, dir).stdout, name);
    assert.ok(block, 'fixture: no missing-target finding');
    assert.deepEqual(commandsIn(block), [], `the fix offers a command, and none removes a manual row:\n${block}`);
    assert.match(block, /_bmad\/_config\/bmm-dependencies\.csv/, 'the fix must say where the row is');

    // The audit really does keep it — the reason for the line above.
    const audit = run(BINS['convoke-audit-bmm-deps'], dir);
    assert.equal(audit.status, 0, audit.stdout + audit.stderr);
    assert.ok(findingIn(run(DOCTOR, dir).stdout, name), 'fixture: the audit cleared a manual row after all');

    // Following the fix clears it.
    const csv = path.join(dir, CSV);
    fs.writeFileSync(csv, fs.readFileSync(csv, 'utf8').split('\n').filter((l) => !l.startsWith('gone-skill,')).join('\n'));
    const after = run(DOCTOR, dir);
    assert.equal(findingIn(after.stdout, name), null);
    assert.ok(after.stdout.split('\n').includes('  ✓ BMM dependencies: registry consistent'), after.stdout);
  });

  it('the [missing-target] summary lists exactly the missing rows, and offers no command', () => {
    // A healthy manual row beside them: the listing must leave it out, which the audit's
    // --dry-run — the pointer this replaced — did not.
    seedSkill(dir, 'my-ok', ['bmad-agent-pm']);
    appendRows(dir, [
      'my-ok,bmad-agent-pm,frontmatter,unknown,operator,2026-10-30',
      ...tenGone.map((s) => `${s},bmad-agent-pm,frontmatter,unknown,operator,2026-10-30`),
    ]);
    const name = 'BMM dependencies: missing-scan-target (10 findings)';
    const block = findingIn(run(DOCTOR, dir).stdout, name);
    assert.ok(block, 'fixture: no missing-target summary');
    assert.deepEqual(commandsIn(block), [], `no command removes a manual row:\n${block}`);
    for (const s of tenGone) assert.ok(block.includes(`${s} → bmad-agent-pm (frontmatter)`), `${s} is not listed:\n${block}`);
    assert.ok(!block.includes('my-ok'), `a healthy row is listed:\n${block}`);

    const audit = run(BINS['convoke-audit-bmm-deps'], dir);
    assert.equal(audit.status, 0, audit.stdout + audit.stderr);
    assert.ok(findingIn(run(DOCTOR, dir).stdout, name), 'fixture: the audit cleared manual rows after all');

    const csv = path.join(dir, CSV);
    fs.writeFileSync(csv, fs.readFileSync(csv, 'utf8').split('\n').filter((l) => !l.startsWith('bmad-gone-')).join('\n'));
    const after = run(DOCTOR, dir);
    assert.equal(findingIn(after.stdout, name), null, after.stdout);
    assert.ok(after.stdout.split('\n').includes('  ✓ BMM dependencies: registry consistent'), after.stdout);
    assert.equal(after.status, 0, after.stdout);
  });

  it('two manual rows for one skill and agent are two findings with two names', () => {
    appendRows(dir, [
      'gone-x,bmad-agent-pm,frontmatter,unknown,operator,2026-10-30',
      'gone-x,bmad-agent-pm,code-reference,unknown,operator,2026-10-30',
      'gone-y,,frontmatter,unknown,operator,2026-10-30',
    ]);
    const out = run(DOCTOR, dir).stdout;
    assert.ok(findingIn(out, 'BMM dependencies: [missing-target] gone-x → bmad-agent-pm (frontmatter)'), out);
    assert.ok(findingIn(out, 'BMM dependencies: [missing-target] gone-x → bmad-agent-pm (code-reference)'), out);
    assert.ok(findingIn(out, 'BMM dependencies: [missing-target] gone-y → (no agent) (frontmatter)'), out);
  });

});

describe('T263: the private-folder git advice lists what it says it lists', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t263-git-'));
    await createValidInstallation(dir);
    assert.equal(run(BINS['convoke-install'], dir).status, 0);
    const git = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
    git('init', '-q');
    git('config', 'user.email', 't@example.com');
    git('config', 'user.name', 't');
    fs.writeFileSync(path.join(dir, '_bmad-output/private/user-interview-a.md'), 'x');
    fs.ensureDirSync(path.join(dir, '_bmad-output/vortex-artifacts/2026'));
    fs.writeFileSync(path.join(dir, '_bmad-output/vortex-artifacts/2026/user-interview-b.md'), 'x');
    // Not a report: the doctor does not count it, so the listing it gives must not name it either.
    fs.writeFileSync(path.join(dir, '_bmad-output/vortex-artifacts/2026/not-a-user-interview-c.md'), 'x');
    git('add', '-f', '_bmad-output/private', '_bmad-output/vortex-artifacts');
    git('commit', '-qm', 'reports');
  });

  afterEach(async () => {
    await fs.remove(dir);
  });

  /** The `git ls-files …` command a finding's fix gives, run as written. */
  function listing(block) {
    assert.match(block, /From the project root, list them with: git ls-files/);
    const m = block.match(/(git ls-files -- .*?) —/);
    assert.ok(m, `no listing command:\n${block}`);
    const r = spawnSync('sh', ['-c', m[1]], { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.split('\n').filter(Boolean);
  }

  it('both findings list exactly the reports, never the rule that must stay committed', () => {
    const out = run(DOCTOR, dir).stdout;
    const blocks = out.split('\n')
      .map((l, i) => (l === '  ⚠ Interview reports in git' ? i : -1)).filter((i) => i >= 0)
      .map((i) => findingIn(out.split('\n').slice(i).join('\n'), 'Interview reports in git'));
    assert.equal(blocks.length, 2, out);
    assert.deepEqual(listing(blocks[0]), ['_bmad-output/private/user-interview-a.md']);
    assert.deepEqual(listing(blocks[1]), ['_bmad-output/vortex-artifacts/2026/user-interview-b.md']);
  });
});
